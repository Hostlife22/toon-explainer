// director.js — the acting director for beans. `lookAt` (a layer id, a point or a timeline of those) turns the body
// toward the target (facing keys sampled at 6 Hz), tilts the head up or down with a spring snap and leads with the
// eyes; `takes` add reaction takes (double, snap, jolt, blink) compiled into facing / view / expr keys, hops, a
// tremble and blinks. With acting on (painted look by default): a blink just after the cut and on head snaps
// (`acting.blink`), a head kick on every expression change (`react`) and idle glances in long holds (`fidget`).
// Pure functions of (layer, shot, time); the bean is drawn by bean.js with the derived fields.
(function () {
  'use strict';
  const T = window.TOON, W = T.W, H = T.H;
  const BLINK = 0.1, CUT_BLINK = 0.07, HZ = 6, DEAD = 24, MAX_TILT = 15;

  // ---------- timelines ----------
  const isKeys = (v) => Array.isArray(v) && v.length > 0 && v[0] !== null && typeof v[0] === 'object' && !Array.isArray(v[0]) && 'v' in v[0];
  const toKeys = (v, def) => (isKeys(v) ? v : [{ at: 0, v: v ?? def }]);
  const valAt = (keys, t) => { let v = keys[0].v; for (const k of keys) if (t >= (k.at ?? 0) - 1e-9) v = k.v; return v; };
  // Merge a base timeline with override segments [{from, to, v}] (later segments win) into [{at, v}] keys.
  function overlay(base, segs) {
    if (!segs.length) return base;
    const times = new Set([0, ...base.map((k) => k.at ?? 0)]);
    segs.forEach((s) => { times.add(s.from); if (Number.isFinite(s.to)) times.add(s.to); });
    const out = [];
    [...times].sort((a, b) => a - b).forEach((t) => {
      let v = valAt(base, t);
      for (const s of segs) if (t >= s.from - 1e-9 && t < s.to - 1e-9) v = s.v;
      if (!out.length || out[out.length - 1].v !== v) out.push({ at: t, v });
    });
    return out;
  }
  const faceNum = (v) => (v === 'left' || v === -1 ? -1 : 1);

  // ---------- targets ----------
  function headAt(shot, id, t) {
    const b = T.layerBounds(shot, id, t);
    if (!b) return null;
    return b.rig ? [b.x, b.rig.foot - 450 * b.rig.k] : [b.x, b.y];
  }
  function pointOf(v, shot, t) {
    if (v == null) return null;
    if (typeof v === 'string') return headAt(shot, v, t);
    if (Array.isArray(v)) return [v[0] * W, v[1] * H];
    if (typeof v.target === 'string') return headAt(shot, v.target, t);
    return [v.x * W, v.y * H];
  }
  const optsOf = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
  function selfHead(Ly, t) {
    const st = T.layerState(Ly, t);
    if (!st) return null;
    const k = ((Ly.size ?? 420) / 600) * Math.abs(st.s);
    return { x: st.x, y: st.y - 450 * k, flip: st.flip };
  }
  // Screen direction (+1 right / -1 left) from the character's head to the target at shot time t, or 0 inside the dead zone.
  function dirTo(Ly, v, shot, t) {
    const p = pointOf(v, shot, t), me = selfHead(Ly, t);
    if (!p || !me) return 0;
    const dx = p[0] - me.x;
    return Math.abs(dx) < DEAD ? 0 : Math.sign(dx);
  }
  // Head tilt (degrees, rig frame) that points the face at the target: negative looks up.
  function tiltTo(Ly, v, shot, t) {
    if (v == null || optsOf(v).head === false) return 0;
    const p = pointOf(v, shot, t), me = selfHead(Ly, t);
    if (!p || !me) return 0;
    const elev = Math.atan2(-(p[1] - me.y), Math.max(40, Math.abs(p[0] - me.x))) / T.DEG;
    return -T.clamp(elev * 0.4, -MAX_TILT, MAX_TILT);
  }

  // ---------- compiled plan ----------
  // Cached per film by the shot id and the authored fields the plan depends on, so the transient copies made by
  // swaps, rack focus, dist haze or vertical framing reuse it. Bounded (oldest out); plans are pure, so eviction
  // never changes a frame.
  const plans = new WeakMap(), MAX_PLANS = 512;
  T.directorCompiles = 0;
  const planKey = (Ly, shot) => (shot ? shot.id : '') + '|' + JSON.stringify([Ly.id, Ly.who, Ly.lookAt, Ly.takes, Ly.facing, Ly.view,
    Ly.expr, Ly.at, Ly.x, Ly.y, Ly.size, Ly.scale, Ly.flip, Ly.move, Ly.path, Ly.look && Ly.look.view]);
  function planOf(Ly, shot, env) {
    const film = (T.film && T.film.spec) || env.spec || T;
    let cache = plans.get(film);
    if (!cache) { cache = new Map(); plans.set(film, cache); }
    const key = planKey(Ly, shot);
    if (cache.has(key)) return cache.get(key);
    const plan = compile(Ly, shot, env);
    T.directorCompiles++;
    cache.set(key, plan);
    if (cache.size > MAX_PLANS) cache.delete(cache.keys().next().value);
    return plan;
  }
  // The layer's flip at shot time t (move / path flips change it during the shot).
  const flipAt = (Ly, t) => { const st = T.layerState(Ly, t); return (st && st.flip) || 1; };
  function compile(Ly, shot, env) {
    const at0 = Ly.at ?? 0, end = (shot && shot.dur) || 10, look = Ly.lookAt == null ? null : toKeys(Ly.lookAt);
    const S = (lt) => lt + at0; // layer time -> shot time
    // base facing: explicit facing, else derived from lookAt (sampled on a fixed 6 Hz grid), else right
    let facing = toKeys(Ly.facing, 'right').map((k) => ({ ...k, v: faceNum(k.v) }));
    if (look && Ly.facing == null) {
      const keys = [{ at: 0, v: 1 }];
      look.forEach((k, i) => {
        if (k.v == null || optsOf(k.v).turn === false) return;
        const from = k.at ?? 0, to = Math.min(i + 1 < look.length ? look[i + 1].at ?? 0 : Infinity, end - at0);
        for (let t = from; t < to + 1e-9; t += 1 / HZ) {
          const d = dirTo(Ly, k.v, shot, S(t));
          const v = d ? d * flipAt(Ly, S(t)) : keys[keys.length - 1].v;
          if (t <= 1e-9) keys[0] = { at: 0, v }; // already turned at the cut: no turn on frame 0
          else if (v !== keys[keys.length - 1].v) keys.push({ at: t, v });
        }
      });
      facing = keys;
    }
    const cast = (env.cast && env.cast[Ly.who]) || {};
    const baseView = toKeys(Ly.view, (Ly.look && Ly.look.view) || cast.view || '3q');
    const baseExpr = toKeys(Ly.expr, 'neutral');
    const fSegs = [], vSegs = [], eSegs = [], hops = [], kicks = [], blinks = [], tremble = [];
    for (const tk of Ly.takes || []) {
      const a = tk.at, toward = tk.target ? dirTo(Ly, tk.target, shot, S(a)) * flipAt(Ly, S(a)) : 0, orig = valAt(facing, a);
      const turn = (from, to, back) => {
        if (toward) fSegs.push({ from, to, v: back ? orig : toward });
        else vSegs.push({ from, to, v: back ? valAt(baseView, a) : 'front' });
      };
      if (tk.kind === 'double') {
        turn(a, a + 0.22, false); turn(a + 0.22, a + 0.6, true); turn(a + 0.6, Infinity, false);
        eSegs.push({ from: a + 0.6, to: a + 1.5, v: tk.expr ?? 'shock' });
        hops.push({ at: a + 0.6, dur: 0.24, h: 26 }); kicks.push({ at: a + 0.6, amp: 7 }); blinks.push(a, a + 0.56);
      } else if (tk.kind === 'snap') {
        turn(a, Infinity, false); kicks.push({ at: a, amp: 5 }); blinks.push(a);
      } else if (tk.kind === 'jolt') {
        hops.push({ at: a, dur: 0.22, h: 34 }); tremble.push([a + 0.2, a + 0.5]); blinks.push(a);
        if (tk.expr) eSegs.push({ from: a, to: a + 0.8, v: tk.expr });
      } else if (tk.kind === 'blink') blinks.push(a);
    }
    const expr = overlay(baseExpr, eSegs);
    if (look) look.forEach((k) => { if ((k.at ?? 0) > 0) blinks.push(k.at); });
    const exprChanges = expr.filter((k, i) => i > 0 && k.v !== expr[i - 1].v).map((k) => k.at);
    return {
      look, facing: overlay(facing, fSegs), view: vSegs.length ? overlay(baseView, vSegs) : null, expr: eSegs.length ? expr : null,
      hops, kicks, blinks, tremble, exprChanges, derivedFacing: !!(look && Ly.facing == null) || fSegs.length > 0,
    };
  }

  // ---------- per-frame values ----------
  function lookNow(Ly, P, lt, shot) {
    if (!P.look) return { tilt: 0, gaze: 0, active: false };
    let i = -1;
    for (let k = 0; k < P.look.length; k++) if (lt >= (P.look[k].at ?? 0) - 1e-9) i = k;
    if (i < 0) return { tilt: 0, gaze: 0, active: false };
    const t = lt + (Ly.at ?? 0), cur = P.look[i].v, prev = i > 0 ? P.look[i - 1].v : null;
    const sp = i > 0 ? T.poseSpring(lt - (P.look[i].at ?? 0), 0.05) : 1;
    const tilt = T.lerp(tiltTo(Ly, prev, shot, t), tiltTo(Ly, cur, shot, t), sp);
    const eyes = (v) => {
      if (v == null || optsOf(v).eyes === false) return 0;
      const d = dirTo(Ly, v, shot, t), me = selfHead(Ly, t), f = faceNum(valAt(P.facing, lt));
      return d && me ? 12 * d * f * (me.flip || 1) : 0;
    };
    return { tilt, gaze: T.lerp(eyes(prev), eyes(cur), T.clamp(sp)), active: cur != null };
  }
  const kick = (s, amp) => (s < 0 || s > 1 ? 0 : -amp * Math.exp(-7 * s) * Math.sin(Math.PI * 2 * 2.2 * s));
  function fidget(Ly, lt) {
    const seed = (Ly.who || 'bean') + (Ly.id || '') + ':fidget', h = T.hash(seed), P = 2.6 + (h % 20) / 10, u = lt + (h % 50) / 10;
    const seg = Math.floor(u / P), r = T.rng(T.hash(seed + seg));
    if (r() > 0.7) return { gaze: 0, tilt: 0 };
    const start = seg * P + P * (0.25 + r() * 0.3), dur = 0.6 + r() * 0.5, s = u - start;
    if (s < 0 || s > dur) return { gaze: 0, tilt: 0 };
    const e = Math.min(T.clamp(s / 0.12), T.clamp((dur - s) / 0.15)), dir = r() < 0.5 ? -1 : 1;
    return { gaze: 13 * dir * e, tilt: (r() < 0.5 ? -2.5 : 2.5) * e };
  }
  const idle = (Ly, lt) => {
    const pose = T.timed(Ly.pose ?? 'idle', lt).cur;
    const talking = (Ly.talk || []).some(([a, b]) => lt >= a && lt <= b) || !!Ly.lipsync;
    return (pose == null || pose === 'idle') && !talking && !(T.gaitKind && T.gaitKind(Ly, lt));
  };

  T.directBean = (Ly, lt, env) => {
    const act = T.actingOf(Ly);
    if (Ly.lookAt == null && !Ly.takes && !(act && (act.blink || act.fidget || act.react))) return { L: Ly, hop: 0 };
    const shot = env.shot, P = planOf(Ly, shot, env), out = { ...Ly };
    if (P.derivedFacing) out.facing = P.facing;
    if (P.view) out.view = P.view;
    if (P.expr) out.expr = P.expr;
    if (P.tremble.length) out.tremble = [...(Ly.tremble || []), ...P.tremble];
    const lk = lookNow(Ly, P, lt, shot);
    let tilt = lk.tilt, gaze = lk.gaze;
    for (const k of P.kicks) tilt += kick(lt - k.at, k.amp);
    if (act && act.react) for (const a of P.exprChanges) tilt += kick(lt - a, 5);
    const busy = [...P.blinks, ...P.exprChanges].some((a) => lt >= a && lt < a + 1.5); // no fidgets right after a take or a change
    if (act && act.fidget && !lk.active && !busy && Ly.gaze == null && idle(out, lt)) { const f = fidget(Ly, lt); gaze += f.gaze; tilt += f.tilt; }
    if (tilt) out.headTilt = (Ly.headTilt ?? 0) + tilt;
    if (gaze) out.gaze = (Ly.gaze ?? 0) + gaze;
    const blinks = act && act.blink ? [CUT_BLINK, ...P.blinks] : P.blinks;
    if (blinks.length) out.blinkAt = blinks;
    let hop = 0;
    for (const h of P.hops) { const p = (lt - h.at) / h.dur; if (p > 0 && p < 1) hop += Math.sin(p * Math.PI) * h.h; }
    return { L: out, hop };
  };
  // A blink forced by the director (cut, head snap, take): eyes shut for 3 frames from each time.
  T.forcedBlink = (Ly, lt) => !!Ly.blinkAt && Ly.blinkAt.some((b) => lt >= b && lt < b + BLINK);

  T.TAKES = { double: true, snap: true, jolt: true, blink: true };
  const base = T.layers.bean;
  T.layers.bean = (ctx, Ly, lt, env) => {
    const { L, hop } = T.directBean(Ly, lt, env);
    if (hop && env.st) { const s = Math.abs(env.st.s * env.st.sy) || 1; ctx.translate(0, -hop / s); }
    base(ctx, L, lt, env);
    if (T.RIG_PROBE && Ly.id && T.RIG_PROBE[Ly.id]) T.RIG_PROBE[Ly.id].hop = hop;
  };
})();
