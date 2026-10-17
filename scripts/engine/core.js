// core.js — toon-explainer runtime: math helpers, seeded noise, timeline, camera, layer motion, transitions, renderFrame(t).
// All drawing happens in a fixed 1920×1080 logical space; the physical canvas may be scaled for previews.
(function () {
  'use strict';
  const T = (window.TOON = window.TOON || {});
  T.W = 1920;
  T.H = 1080;
  T.DEG = Math.PI / 180;
  T.DPR = 1;
  T.layers = T.layers || {}; // type → draw(ctx, L, lt, env)
  T.bgs = T.bgs || {}; // kind → draw(ctx, bg, lt, env)
  T.images = {};

  // ---------- math ----------
  T.clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  T.lerp = (a, b, p) => a + (b - a) * p;
  T.prog = (t, at, dur) => T.clamp((t - at) / Math.max(1e-6, dur));
  T.ease = {
    linear: (p) => p,
    in: (p) => p * p,
    out: (p) => 1 - (1 - p) * (1 - p),
    inOut: (p) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2),
    outCubic: (p) => 1 - Math.pow(1 - p, 3),
    inCubic: (p) => p * p * p,
    // anticipation: backs up first (about -10 %), then goes
    inBack: (p) => { const c = 1.7; return (c + 1) * p * p * p - c * p * p; },
    // anticipation and overshoot: backs up, travels, passes the end (about 10 %) and returns
    inOutBack: (p) => {
      const c = 1.7 * 1.525;
      return p < 0.5 ? (Math.pow(2 * p, 2) * ((c + 1) * 2 * p - c)) / 2 : (Math.pow(2 * p - 2, 2) * ((c + 1) * (p * 2 - 2) + c) + 2) / 2;
    },
    // spring settle: passes the end by about 13 %, swings back and lands exactly on it
    outSettle: (p) => (p >= 1 ? 1 : 1 - Math.exp(-5 * p) * Math.cos(2.5 * Math.PI * p)),
    // looser spring: two visible swings before it lands
    outElastic: (p) => (p >= 1 ? 1 : 1 - Math.exp(-3.2 * p) * Math.cos(4.5 * Math.PI * p)),
    outBack: (p) => {
      const c = 1.9;
      return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2);
    },
    outBounce: (p) => {
      const n = 7.5625, d = 2.75;
      if (p < 1 / d) return n * p * p;
      if (p < 2 / d) return n * (p -= 1.5 / d) * p + 0.75;
      if (p < 2.5 / d) return n * (p -= 2.25 / d) * p + 0.9375;
      return n * (p -= 2.625 / d) * p + 0.984375;
    },
  };
  T.easeBy = (name) => T.ease[name] || T.ease.inOut;

  // ---------- deterministic randomness ----------
  T.hash = (str) => {
    let h = 2166136261 >>> 0;
    const s = String(str);
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };
  T.rng = (seed) => {
    let a = seed >>> 0 || 1;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  const cell = (i, seed) => T.rng(T.hash(seed + ':' + i))();
  // Smooth 1D value noise in [-1, 1].
  T.noise = (x, seed = 0) => {
    const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
    return T.lerp(cell(i, seed), cell(i + 1, seed), u) * 2 - 1;
  };

  // ---------- timeline ----------
  T.TRANSITION_DUR = { cut: 0, dissolve: 0.35, 'fade-white': 0.4, 'fade-black': 0.5, 'zoom-punch': 0.3, whip: 0.3, iris: 0.5 };
  T.buildTimeline = (spec) => {
    let start = 0;
    const shots = spec.shots.map((s, i) => {
      const tr = typeof s.transition === 'string' ? { kind: s.transition } : s.transition || { kind: 'cut' };
      const kind = tr.kind || 'cut';
      const shot = { ...s, index: i, start, transition: { ...tr, kind, dur: tr.dur ?? T.TRANSITION_DUR[kind] ?? 0 } };
      start += s.dur;
      return shot;
    });
    return { shots, total: start };
  };
  T.shotAt = (tl, t) => {
    const { shots } = tl;
    for (let i = shots.length - 1; i >= 0; i--) if (t >= shots[i].start - 1e-6) return i; // starts are float sums
    return 0;
  };

  // ---------- camera ----------
  // camera: { zoom:[from,to], pan:[[x0,y0],[x1,y1]] (px), focus:[nx,ny], ease, punch:[{at,amount}], shake:[{at,dur,amp}], rot:[from,to] }
  // zoom / pan may also be [{at, v, ease}] keys. `shot` (optional) lets camera modules frame layers of the shot
  // (T.CAM_EXT: frame, follow, handheld, dolly zoom, orbit, roll, angle; lens/camera-grammar.js).
  T.CAM_KEYS = (keys, lt) => T.num(keys, lt); // replaced by lens/camera-moves.js (eased keys)
  T.cameraAt = (cam, lt, dur, shot) => {
    const c = cam || {};
    const e = T.easeBy(c.ease || 'linear')(T.prog(lt, c.at ?? 0, c.dur ?? dur));
    const zoom = c.zoom || [1, 1.04];
    const keyed = (v) => Array.isArray(v) && v.length > 0 && v[0] !== null && typeof v[0] === 'object' && !Array.isArray(v[0]);
    let z = keyed(zoom) ? T.CAM_KEYS(zoom, lt) : T.lerp(zoom[0], zoom[1], e);
    const z0 = z;
    const pan = c.pan || [[0, 0], [0, 0]];
    let px, py;
    if (keyed(pan)) [px, py] = T.CAM_KEYS(pan, lt);
    else { px = T.lerp(pan[0][0], pan[1][0], e); py = T.lerp(pan[0][1], pan[1][1], e); }
    for (const k of c.punch || []) {
      const d = lt - k.at;
      if (d >= 0) z *= 1 + (k.amount ?? 0.15) * (d < 0.08 ? d / 0.08 : Math.exp(-(d - 0.08) * 7));
    }
    let sx = 0, sy = 0;
    for (const s of c.shake || []) {
      const d = lt - s.at;
      if (d >= 0 && d <= s.dur) {
        const amp = (s.amp ?? 18) * (1 - d / s.dur);
        sx += T.noise(lt * 30, 'sx' + s.at) * amp;
        sy += T.noise(lt * 30, 'sy' + s.at) * amp;
      }
    }
    let rot = 0;
    if (Array.isArray(c.rot) && c.rot.length && typeof c.rot[0] === 'object') rot = T.snapTimeline(c.rot, lt, 0.067) * T.DEG; // dutch-angle keys
    else if (c.rot) rot = T.lerp(c.rot[0], c.rot[1], e) * T.DEG;
    let focus = c.focus || [0.5, 0.5];
    for (const j of c.jump || []) { // cut-in without a cut: 1-frame zoom jump on a pose snap (stacks)
      if (lt < j.at) continue;
      z *= j.zoom ?? 1.3;
      if (j.focus) focus = j.focus;
    }
    const out = { z, px, py, sx, sy, rot, fx: focus[0] * T.W, fy: focus[1] * T.H };
    return T.CAM_EXT && T.CAM_EXT.wants(c) ? T.CAM_EXT.apply(out, c, lt, dur, shot, z / z0) : out;
  };
  // [{at, v}] number keys: holds each value, blending into the next over `blend` seconds (hold-and-snap).
  T.snapTimeline = (keys, lt, blend = 0.067) => {
    let i = -1;
    for (let k = 0; k < keys.length; k++) if (lt >= (keys[k].at ?? 0)) i = k;
    if (i < 0) return keys[0].v;
    if (i === 0) return keys[0].v;
    return T.lerp(keys[i - 1].v, keys[i].v, T.ease.outCubic(T.prog(lt, keys[i].at ?? 0, blend)));
  };
  // Apply camera with a parallax factor f (0 = locked to screen, 1 = full camera). While a background with a
  // `parallax` multiplier draws, T.BG_DEPTH scales every plane's distance from the camera plane (f = 1).
  T.BG_DEPTH = null;
  T.depthF = (f) => (T.BG_DEPTH == null || T.BG_DEPTH === 1 ? f : 1 - (1 - f) * T.BG_DEPTH);
  // Zoom of a plane at factor f. Framed cameras (camera.frame) push far in: a deep background (f < 0 through a large
  // bg.parallax) must not shrink below the frame there.
  T.planeZoom = (cam, f) => { const z = 1 + (cam.z - 1) * f; return cam.framed ? Math.max(1, z) : z; };
  T.applyCam = (ctx, cam, f = 1) => {
    if (!cam || f === 0) return;
    f = T.depthF(f);
    if (cam.ext && T.applyCamExt) { T.applyCamExt(ctx, cam, f); return; } // dolly zoom, orbit, low / high angle
    const z = T.planeZoom(cam, f);
    ctx.translate(cam.fx + cam.sx, cam.fy + cam.sy);
    ctx.rotate(cam.rot * f);
    ctx.scale(z, z);
    ctx.translate(-cam.fx - cam.px * f, -cam.fy - cam.py * f);
  };

  // ---------- layer motion ----------
  const ENTER_DUR = 0.32;
  // Entrances with their own measured timing (reference: drop + squash settles in ~12 frames, pop-tilt in 6, slam in 3).
  const ENTER_DUR_BY_KIND = { 'drop-squash': 0.5, 'pop-tilt': 0.22, slam: 0.12 };
  // Default entrance per layer type (measured: characters/backgrounds are already there at the cut; lettering pops).
  T.DEFAULT_ENTER = { bean: 'none', image: 'none', map: 'none', fx: 'none', fg: 'none', sign: 'none', timer: 'none', title: 'none', era: 'slide-left', caption: 'fade' }; // framing is already there at the cut
  T.ENTERS = T.ENTERS || {}; // kind → fn(p, st, isExit, L): extra entrance/exit kinds registered by modules
  T.ENTER_DUR = T.ENTER_DUR || {}; // kind → default duration (s) for registered kinds
  // Entrance duration of a layer exactly as T.layerState resolves it (fx that react to landings use it).
  T.enterDurOf = (L) => { const k = L.enter || T.DEFAULT_ENTER[L.type] || 'pop'; return L.enterDur ?? ENTER_DUR_BY_KIND[k] ?? T.ENTER_DUR[k] ?? ENTER_DUR; };
  function enterExit(kind, p, st, isExit, L) {
    const q = isExit ? 1 - p : p;
    if (T.ENTERS[kind]) { T.ENTERS[kind](p, st, isExit, L); return; }
    switch (kind) {
      case 'drop-squash': { // 2-frame fall, impact squash 150/55, rebound 85/115, settle
        if (isExit) { st.a *= q; return; }
        const t = p * 0.5;
        if (t < 0.067) { st.y -= (1 - t / 0.067) * T.H * 0.9; return; }
        const k = (t - 0.067) / 0.433, d = Math.exp(-k * 5) * Math.cos(k * Math.PI * 3);
        st.sx *= 1 + 0.5 * d; st.sy *= 1 - 0.45 * d; return;
      }
      case 'pop-tilt': st.s *= isExit ? T.ease.in(q) : Math.max(0, T.ease.outBack(q)); st.r += (1 - q) * (st.flip > 0 ? -5 : 5) * T.DEG; return;
      case 'slam': {
        if (isExit) { st.a *= q; return; }
        st.s *= 1 + 0.6 * (1 - T.ease.outCubic(q));
        if (q >= 1) return;
        st.a *= Math.min(1, q * 3); return;
      }
      case 'none': return;
      case 'fade': st.a *= q; return;
      case 'pop': st.s *= isExit ? T.ease.in(q) : Math.max(0, T.ease.outBack(q)); return;
      case 'drop': st.y -= (1 - (isExit ? q : T.ease.outBounce(q))) * T.H * 0.8; return;
      case 'rise': st.y += (1 - T.ease.outCubic(q)) * T.H * 0.7; return;
      case 'slide-left': st.x -= (1 - T.ease.outCubic(q)) * T.W * 0.7; return;
      case 'slide-right': st.x += (1 - T.ease.outCubic(q)) * T.W * 0.7; return;
      case 'slide-up': st.y -= (1 - T.ease.outCubic(q)) * T.H * 0.7; return;
      case 'slide-down': st.y += (1 - T.ease.outCubic(q)) * T.H * 0.7; return;
      case 'spin': st.s *= T.ease.outBack(q); st.r += (1 - q) * Math.PI * 2; return;
      default: st.s *= Math.max(0, T.ease.outBack(q));
    }
  }
  // Positional segment of a move step, [x0, y0, x1, y1] in px, starting from the current position (x, y), or null.
  // to: [x, y] absolute frame fractions; by: [dx, dy] relative to the start; from: [x, y] where the step starts (the layer
  // holds there until the step begins when it is the first positional step). Without to / by a `from` step ends at (x, y).
  T.moveSeg = (m, x, y) => {
    if (!m || !(m.to || m.by || m.from)) return null;
    const x0 = m.from ? m.from[0] * T.W : x, y0 = m.from ? m.from[1] * T.H : y;
    if (m.to) return [x0, y0, m.to[0] * T.W, m.to[1] * T.H];
    if (m.by) return [x0, y0, x0 + m.by[0] * T.W, y0 + m.by[1] * T.H];
    return [x0, y0, x, y];
  };
  // Returns {x,y,s,r,a,flip} for a layer at shot-local time lt, or null when not visible.
  T.layerState = (L, lt) => {
    const at = L.at ?? 0, out = L.out ?? Infinity;
    const enterKind = L.enter || T.DEFAULT_ENTER[L.type] || 'pop';
    const ed = L.enterDur ?? ENTER_DUR_BY_KIND[enterKind] ?? T.ENTER_DUR[enterKind] ?? ENTER_DUR;
    const xd = L.exitDur ?? T.ENTER_DUR[L.exit] ?? 0.25;
    if (lt < at || lt > out + xd) return null;
    const st = { x: (L.x ?? 0.5) * T.W, y: (L.y ?? 0.5) * T.H, s: L.scale ?? 1, r: (L.rot ?? 0) * T.DEG, a: L.alpha ?? 1, flip: L.flip ? -1 : 1, sx: 1, sy: 1 };
    let first = true; // only the first positional step may hold the layer at its `from` before it starts
    for (const m of L.move || []) {
      const p = T.easeBy(m.ease || 'inOut')(T.prog(lt, m.at ?? 0, m.dur ?? 0.6)), seg = T.moveSeg(m, st.x, st.y), lead = first;
      if (seg) first = false;
      if (p <= 0) { if (seg && m.from && lead) { st.x = seg[0]; st.y = seg[1]; } continue; }
      if (seg) { st.x = T.lerp(seg[0], seg[2], p); st.y = T.lerp(seg[1], seg[3], p); }
      if (m.scale != null) st.s = T.lerp(st.s, m.scale, p);
      if (m.rot != null) st.r = T.lerp(st.r, m.rot * T.DEG, p);
      if (m.alpha != null) st.a = T.lerp(st.a, m.alpha, p);
      if (m.flip != null && p >= 1) st.flip = m.flip ? -1 : 1;
    }
    const seed = L.id || L.__seed || L.type + (L.x ?? 0) + (L.y ?? 0); // __seed: path layers keep their authored anchor
    if (L.bob) { const b = Math.sin((lt + (T.hash(seed) % 100) / 37) * Math.PI * 2 * (L.bobHz ?? 0.8)) * L.bob; st.y += b; if (b < 0) st.jy = -b; }
    if (L.sway) st.r += Math.sin(lt * Math.PI * 2 * (L.swayHz ?? 0.5)) * L.sway * T.DEG;
    if (L.wobble) { st.x += T.noise(lt * 6, seed + 'wx') * L.wobble; st.y += T.noise(lt * 6, seed + 'wy') * L.wobble; }
    for (const s of L.shake || []) {
      const d = lt - s.at;
      if (d >= 0 && d <= (s.dur ?? 0.4)) st.x += Math.sin(d * 70) * (s.amp ?? 12) * (1 - d / (s.dur ?? 0.4));
    }
    for (const j of L.jump || []) {
      const p = T.prog(lt, j.at, j.dur ?? 0.45);
      if (p > 0 && p < 1) { const dy = Math.sin(p * Math.PI) * (j.h ?? 120); st.y -= dy; st.jy = (st.jy || 0) + dy; } // jy: height above the ground (contact shadow)
    }
    if (L.jitter) { // struggle / panic tremble, a new seeded offset every `on` frames
      const j = L.jitter === true ? {} : typeof L.jitter === 'number' ? { amp: L.jitter } : L.jitter, llt = lt - at;
      if (llt >= (j.from ?? 0) && llt <= (j.to ?? Infinity)) {
        const r = T.rng(T.hash(seed + ':jit:' + Math.floor((llt * 30) / (j.on ?? 2))));
        st.x += (r() - 0.5) * 2 * (j.amp ?? 3); st.y += (r() - 0.5) * 2 * (j.amp ?? 3);
      }
    }
    if (L.swing) { // damped pendulum around the layer origin (hanging signs, dropped mics, keys)
      const w = L.swing === true ? {} : L.swing, t = lt - (w.at ?? at);
      if (t >= 0) st.r += (w.amp ?? 8) * Math.exp(-(w.decay ?? 2.2) * t) * Math.sin((2 * Math.PI * t) / (w.period ?? 1.2)) * T.DEG;
    }
    st.bx = st.x; st.by = st.y; // anchor before entrance/exit offsets (used by the safe-frame clamp)
    enterExit(enterKind, T.prog(lt, at, ed), st, false, L);
    if (enterKind === 'slam') { const d = lt - at - ed; if (d >= 0 && d < 0.2) { st.x += Math.sin(d * 90) * 14 * (1 - d / 0.2); st.y += Math.cos(d * 70) * 8 * (1 - d / 0.2); } }
    if (lt > out) enterExit(L.exit || 'fade', T.prog(lt, out, xd), st, true, L);
    return st.a <= 0 || st.s <= 0 ? null : st;
  };

  // ---------- swap: instant mid-shot field changes ----------
  // swap: [{at, ...fields}] (shot time). Entries with at <= lt merge in order; `look` merges into L.look (null values
  // stay and override the cast entry); a top-level null deletes the field. Hard swap = 1 frame, as in the reference.
  T.effLayer = (L, lt) => {
    if (!L.swap || !L.swap.length) return L;
    let E = null;
    for (const s of L.swap) {
      if (lt < (s.at ?? 0)) continue;
      if (!E) E = { ...L };
      for (const [k, v] of Object.entries(s)) {
        if (k === 'at') continue;
        if (k === 'look' && v && typeof v === 'object') E.look = { ...(E.look || {}), ...v };
        else if (v === null) delete E[k];
        else E[k] = v;
      }
    }
    if (E) Object.defineProperty(E, '__swapBase', { value: L.__swapBase || L }); // the authored layer (T.swapBase), hidden from JSON
    return E || L;
  };
  // The authored layer behind a swapped copy (pure functions of time, such as rider anchors, resolve swaps per time).
  T.swapBase = (L) => (L && L.__swapBase) || L;

  // ---------- layer modifiers ----------
  // T.LAYER_MODS[name] = { order, apply?(src, L, lt, env) -> canvas, under?(ctx, src, L, lt, env), filter?(L, lt, env) -> css }
  // A modifier is active when layer[name] is truthy. The layer is painted to a scratch canvas, `apply` steps run in
  // `order`, `under` steps draw beneath the final composite (glows), `filter` strings join on the final drawImage.
  T.LAYER_MODS = T.LAYER_MODS || {};
  T.LAYER_MODS.blur = {
    order: 95,
    filter: (L) => {
      const px = T.num(L.blur, 0) * (T.DPR || 1);
      if (!(px >= 0.3)) return null;
      return `blur(${px.toFixed(2)}px) brightness(${1 - (L.blurDim ?? 0.08)})`;
    },
  };
  // A modifier may declare when(L) to ignore a field that a layer type uses for its own meaning.
  const activeMods = (L) => Object.keys(T.LAYER_MODS).filter((k) => L[k] && (!T.LAYER_MODS[k].when || T.LAYER_MODS[k].when(L))).sort((a, b) => (T.LAYER_MODS[a].order ?? 50) - (T.LAYER_MODS[b].order ?? 50));
  let modDepth = 0;
  T.modLayer = (ctx, L, lt, env, paint, isolate = false) => {
    const mods = activeMods(L);
    if (!mods.length && !isolate) { paint(ctx); return; }
    const w = ctx.canvas.width, h = ctx.canvas.height, k = env.dpr || 1;
    const [c, o] = T.scratch('mod' + modDepth, w, h);
    o.clearRect(0, 0, w, h);
    o.setTransform(k, 0, 0, k, 0, 0);
    modDepth++;
    try { paint(o); } finally { modDepth--; }
    o.setTransform(1, 0, 0, 1, 0, 0);
    let src = c;
    for (const m of mods) if (T.LAYER_MODS[m].apply) src = T.LAYER_MODS[m].apply(src, L, lt, env, modDepth) || src;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); // layer alpha (ctx.globalAlpha) applies to the composite
    for (const m of mods) if (T.LAYER_MODS[m].under) T.LAYER_MODS[m].under(ctx, src, L, lt, env);
    const filters = mods.map((m) => T.LAYER_MODS[m].filter && T.LAYER_MODS[m].filter(L, lt, env)).filter(Boolean);
    if (filters.length) ctx.filter = filters.join(' ');
    ctx.drawImage(src, 0, 0, w, h);
    ctx.restore();
  };

  // Rack focus: shot.focus = [{at, on: <layer id> | "bg", dur: 0.4, px: 10, bg}] — layers with an id other than `on`
  // ramp to px blur, `on` ramps sharp; the background gets `bg` px (default px unless on === "bg").
  // Lettering and screen furniture stay sharp during rack focus unless they opt in with focusable: true.
  const FOCUS_EXEMPT = new Set(['label', 'title', 'caption', 'date', 'era', 'counter', 'timer', 'doc', 'hud', 'cursor', 'fx']);
  T.focusBlur = (shot, lt) => focusBlur(shot, lt); // (shot, lt) -> null | (id or '@bg') -> blur px
  function focusBlur(shot, lt) {
    const keys = T.focusKeysOf ? T.focusKeysOf(shot) : shot.focus;
    if (!keys || !keys.length) return null;
    const under = (e, id) => {
      if (!e) return 0;
      if (id === '@bg') return e.on === 'bg' ? 0 : e.bg ?? e.px ?? 10;
      return id === e.on ? 0 : e.px ?? 10;
    };
    let i = -1;
    for (let k = 0; k < keys.length; k++) if (lt >= (keys[k].at ?? 0)) i = k;
    if (i < 0) return null;
    const e = keys[i], prev = keys[i - 1], p = T.ease.inOut(T.prog(lt, e.at ?? 0, e.dur ?? 0.4));
    return (id) => T.lerp(under(prev, id), under(e, id), p);
  }

  // Paint one layer (already swapped) with its motion state; shared by shots and persistent overlays.
  T.drawLayer = (ctx, L, lt, shotEnv, cam) => {
    if (Array.isArray(L.blur)) L = { ...L, blur: T.num(L.blur, lt) };
    const draw = T.layers[L.type];
    if (!draw) throw new Error(`Unknown layer type "${L.type}"` + (shotEnv.shot ? ` in shot ${shotEnv.shot.id}` : ''));
    const st = T.layerState(L, lt);
    if (!st) return;
    const hud = L.hud ?? HUD_DEFAULT[L.type] ?? false;
    const paint = (c) => {
      c.save();
      if (!hud && cam) T.applyCam(c, cam, T.layerZ(L));
      c.translate(st.x, st.y);
      c.rotate(st.r);
      c.scale(st.s * st.flip * st.sx, st.s * st.sy);
      if (T.PAINT && T.layerContact) T.layerContact(c, L, st);
      draw(c, L, lt - (L.at ?? 0), { ...shotEnv, st, lt });
      c.restore();
    };
    // painted look: lettering and screen furniture stay flat unless painted: true; painted: false opts any layer out
    const saved = T.PAINT, flat = saved && (L.painted === false || (L.painted !== true && T.PAINT_EXEMPT && T.PAINT_EXEMPT.has(L.type)));
    if (flat) T.PAINT = null;
    ctx.save();
    try {
      ctx.globalAlpha *= st.a;
      // painted look: a fading layer is painted opaque on a scratch canvas first, so overlapping shading bands
      // do not build up alpha; the composite takes the layer alpha
      if (activeMods(L).length || (T.PAINT && st.a < 1)) T.modLayer(ctx, L, lt, shotEnv, paint, true);
      else paint(ctx);
    } finally { ctx.restore(); T.PAINT = saved; }
  };

  // Parallax factor of a layer: z, else 1 / dist (camera distance relative to the subject plane), else 1.
  T.layerZ = (L) => L.z ?? (L.dist > 0 ? 1 / L.dist : 1);

  // ---------- drawing a shot ----------
  // Layer types drawn in screen space by default (modules may add their own, e.g. T.HUD_DEFAULT.hud = true).
  T.HUD_DEFAULT = { era: true, timer: true, date: false, title: false };
  const HUD_DEFAULT = T.HUD_DEFAULT;
  // fn(ctx, shot, lt, shotEnv, cam): drawn right after the backgrounds, before every layer (and before a bg grade).
  T.AFTER_BG = T.AFTER_BG || [];
  // Transform of a layer exactly as T.drawLayer sets it (camera, position, rotation, scale), or null when hidden.
  T.layerTransform = (ctx, L, lt, cam) => {
    const st = T.layerState(L, lt);
    if (!st) return null;
    if (!(L.hud ?? HUD_DEFAULT[L.type] ?? false) && cam) T.applyCam(ctx, cam, T.layerZ(L));
    ctx.translate(st.x, st.y); ctx.rotate(st.r); ctx.scale(st.s * st.flip * st.sx, st.s * st.sy);
    return st;
  };
  T.drawShot = (ctx, shot, lt, env) => {
    const prevPaint = T.PAINT, prevDepth = T.BG_DEPTH;
    T.PAINT = T.paintState ? T.paintState(env.spec, shot) : null; // painted look state for this shot (shade.js)
    T.BG_DEPTH = null; // a shot nested in a background (screens) must not inherit its parent's parallax
    try { drawShotBody(ctx, shot, lt, env); } finally { T.PAINT = prevPaint; T.BG_DEPTH = prevDepth; }
  };
  function drawShotBody(ctx, shot, lt, env) {
    ctx.save();
    ctx.setTransform(env.dpr, 0, 0, env.dpr, 0, 0);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, T.W, T.H);
    const cam = T.cameraAt(shot.camera, lt, shot.dur, shot);
    const shotEnv = { ...env, cam, shot, seed: (env.seed || 1) + ':' + shot.id };
    const bgs = Array.isArray(shot.bg) ? shot.bg : [shot.bg || { kind: 'sky' }];
    const drawBgs = (c) => {
      for (const bg of bgs) {
        const draw = T.bgs[bg.kind || (bg.image ? 'image' : 'sky')];
        if (!draw) throw new Error(`Unknown bg kind "${bg.kind}" in shot ${shot.id}`);
        c.save();
        const depth = T.BG_DEPTH;
        T.BG_DEPTH = bg.parallax ?? null; // per-background parallax multiplier (applyCam)
        try {
          draw(c, bg, lt, shotEnv);
          c.restore();
          if (T.PAINT && T.paintBg) { c.save(); T.paintBg(c, bg, lt, shotEnv); c.restore(); } // painted look: this bg's textures and occlusion, moving with its parallax
        } finally { T.BG_DEPTH = depth; }
      }
    };
    drawBgs(ctx);
    const focus = focusBlur(shot, lt);
    const bgBlur = focus ? focus('@bg') : 0;
    if (bgBlur >= 0.3) T.filtered(ctx, `blur(${(bgBlur * env.dpr).toFixed(2)}px) brightness(0.96)`, drawBgs); // blurred copy over the sharp one: no dark edges
    for (const hook of T.AFTER_BG) hook(ctx, shot, lt, shotEnv, cam); // backdrops that layers paint behind every layer (globe stars)
    if (T.gradeBg && !env.noPost) T.gradeBg(ctx, shot, lt, shotEnv); // panel cells with grade:false stay ungraded
    // modules may add or hide layers (over-the-shoulder framing) and step characters on twos (camera-grammar.js)
    const layers = T.shotLayers ? T.shotLayers(shot, lt, env) : shot.layers || [];
    let streaked = !cam.streak; // whip pan motion blur goes under the lettering and screen furniture
    for (const L0 of layers) {
      let L = T.effLayer(L0, lt);
      if (!streaked && (L.hud || HUD_DEFAULT[L.type] || FOCUS_EXEMPT.has(L.type)) && L.type !== 'fx') { T.camStreak(ctx, cam, shotEnv); streaked = true; }
      if (focus && L.id && !L.sharp && (L.focusable || !FOCUS_EXEMPT.has(L.type))) {
        const fb = focus(L.id), own = T.num ? T.num(L.blur, lt) || 0 : 0;
        if (fb >= 0.3 || own) L = { ...L, blur: Math.max(fb, own) };
      }
      if (L.dist != null && T.distLayer) L = T.distLayer(L);
      T.drawLayer(ctx, L, T.twosLt ? T.twosLt(L, lt, shot, env) : lt, shotEnv, cam);
    }
    if (!streaked) T.camStreak(ctx, cam, shotEnv);
    if (T.post && !env.noPost) T.post(ctx, lt, shotEnv);
    const lb = shot.camera && shot.camera.letterbox;
    if (lb) drawLetterbox(ctx, lb === true ? {} : lb, lt);
    ctx.restore();
  }

  // Cinematic bars for extreme close-ups: {h: 0.12, at: 0, dur: 0.2, out, color}
  function drawLetterbox(ctx, lb, lt) {
    const dur = lb.dur ?? 0.2;
    let p = T.ease.outCubic(T.prog(lt, lb.at ?? 0, dur));
    if (lb.out != null && lt > lb.out) p *= 1 - T.ease.inOut(T.prog(lt, lb.out, dur));
    if (p <= 0) return;
    const bh = (lb.h ?? 0.12) * T.H * p;
    ctx.fillStyle = lb.color ?? '#000';
    ctx.fillRect(-10, -10, T.W + 20, bh + 10);
    ctx.fillRect(-10, T.H - bh, T.W + 20, bh + 10);
  }

  // ---------- transitions ----------
  function blit(ctx, src, alpha = 1, sx = 1, ox = 0, oy = 0) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = alpha;
    const w = ctx.canvas.width, h = ctx.canvas.height;
    ctx.translate(w / 2 + ox, h / 2 + oy);
    ctx.scale(sx, sx);
    ctx.drawImage(src, -w / 2, -h / 2, w, h);
    ctx.restore();
  }
  function overlay(ctx, color, alpha) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = T.clamp(alpha);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.restore();
  }
  // A copy of a world buffer with everything outside the centred visible strip cleared.
  function stripOnly(src, key) {
    const [c, k] = T.scratch('strip:' + key, src.width, src.height), sw = Math.round(src.width * T.STRIP_W / T.W), sx = Math.round((src.width - sw) / 2);
    k.setTransform(1, 0, 0, 1, 0, 0); k.clearRect(0, 0, c.width, c.height);
    k.drawImage(src, sx, 0, sw, src.height, sx, 0, sw, src.height);
    return c;
  }
  T.transitions = {
    dissolve: (ctx, a, b, p) => { blit(ctx, a); blit(ctx, b, T.ease.inOut(p)); },
    'fade-white': (ctx, a, b, p) => { blit(ctx, p < 0.5 ? a : b); overlay(ctx, '#fffaf0', 1 - Math.abs(p * 2 - 1)); },
    'fade-black': (ctx, a, b, p) => { blit(ctx, p < 0.5 ? a : b); overlay(ctx, '#000', 1 - Math.abs(p * 2 - 1)); },
    'zoom-punch': (ctx, a, b, p) => {
      if (p < 0.5) { const q = p * 2; blit(ctx, a, 1, 1 + T.ease.in(q) * 0.9); overlay(ctx, '#fff', q * 0.85); }
      else { const q = (p - 0.5) * 2; blit(ctx, b, 1, 1.25 - T.ease.outCubic(q) * 0.25); overlay(ctx, '#fff', (1 - q) * 0.85); }
    },
    // tr.dir: "left" (default: the picture travels left), "right", "up", "down"; vertical films travel the strip width.
    whip: (ctx, a, b, p, tr = {}) => {
      const dir = tr.dir ?? 'left';
      if (!['left', 'right', 'up', 'down'].includes(dir)) throw new Error(`whip dir must be left, right, up or down (got ${JSON.stringify(dir)})`);
      const horiz = dir === 'left' || dir === 'right', sign = dir === 'left' || dir === 'up' ? 1 : -1;
      const span = horiz ? ctx.canvas.width * (T.STRIP_W ?? T.W) / T.W : ctx.canvas.height, e = T.ease.inOut(p);
      if (horiz && span < ctx.canvas.width) { a = stripOnly(a, 'a'); b = stripOnly(b, 'b'); } // vertical films: slide only what was visible
      for (let k = 0; k < 5; k++) {
        const o = (k - 2) * span * 0.025, da = sign * (-e * span + o), db = sign * ((1 - e) * span + o);
        blit(ctx, a, 0.3, 1, horiz ? da : 0, horiz ? 0 : da);
        blit(ctx, b, 0.3, 1, horiz ? db : 0, horiz ? 0 : db);
      }
    },
    iris: (ctx, a, b, p) => {
      blit(ctx, a);
      const w = ctx.canvas.width, h = ctx.canvas.height;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, T.ease.inOut(p) * Math.hypot(w, h) * 0.55, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(b, 0, 0);
      ctx.restore();
    },
  };

  // ---------- frame entry point ----------
  // shot.pinned: layers drawn after the shot without camera; in vertical films they stay centred while frame pans.
  // An fx in pinned whose target is a world layer (an id in shot.layers) is drawn in the world pass right after the
  // layers, so it follows the target's camera and frame; everything else in pinned is drawn in frame space.
  const pinSplit = new WeakMap();
  T.resolvePinned = (shot) => {
    if (!shot.pinned || !shot.pinned.length) return shot;
    if (pinSplit.has(shot)) return pinSplit.get(shot);
    const ids = new Set((shot.layers || []).map((L) => L && L.id).filter(Boolean)), moved = new Set();
    const lightIds = (v) => (Array.isArray(v) ? v.map((q) => (q && typeof q === 'object' ? q.id : q)) : []); // blackout lights
    const refs = (L) => [L.target, L.follow, ...lightIds(L.lights), ...(L.swap || []).flatMap((s) => [s.target, s.follow, ...lightIds(s.lights)])].filter((v) => typeof v === 'string');
    // propagate until stable: an fx that targets an fx already moved to the world pass moves too
    for (let changed = true; changed;) {
      changed = false;
      shot.pinned.forEach((L, i) => {
        if (moved.has(i) || !L || L.type !== 'fx' || !refs(L).some((r) => ids.has(r))) return;
        moved.add(i); changed = true; if (L.id) ids.add(L.id);
      });
    }
    const out = { ...shot, layers: [...(shot.layers || []), ...shot.pinned.filter((_, i) => moved.has(i))], pinned: shot.pinned.filter((_, i) => !moved.has(i)) };
    pinSplit.set(shot, out);
    return out;
  };
  T.drawPinned = (c, shot, lt, env) => {
    if (!shot.pinned || !shot.pinned.length) return;
    c.save();
    c.setTransform(env.dpr, 0, 0, env.dpr, 0, 0);
    const own = { ...shot, layers: shot.pinned };
    const sEnv = { ...env, cam: null, shot: own, outerShot: shot, outerCam: T.cameraAt(shot.camera, lt, shot.dur, shot), seed: (env.seed ?? 1) + ':' + shot.id + ':pinned' };
    const prevPaint = T.PAINT;
    T.PAINT = T.paintState ? T.paintState(env.spec, shot) : null;
    try { for (const L0 of shot.pinned) { const L = T.effLayer(L0, lt); T.drawLayer(c, L, T.twosLt ? T.twosLt(L, lt, shot, env) : lt, sEnv, null); } } finally { T.PAINT = prevPaint; c.restore(); }
  };
  // Output formats. "vertical" (9:16) keeps the 1920x1080 world and shows a strip of it STRIP_W wide and the full
  // height, centred on shot.frame (x fraction, number or [{at, v, ease}] keys, default 0.5), scaled to 1080x1920.
  T.FORMATS = { landscape: { w: 1920, h: 1080 }, vertical: { w: 1080, h: 1920 } };
  // A vertical shot as its viewer sees it: without its own camera.focus, the camera zooms around the strip centre fx
  // (world px). __stripFocus tells keepInFrame to re-centre the zoom on each sampled moment's strip.
  T.stripFramed = (shot, fx) => {
    const cam = shot.camera || {};
    return cam.focus ? shot : { ...shot, camera: { ...cam, focus: [fx / T.W, 0.5] }, __stripFocus: true };
  };
  const even = (v) => Math.round(v / 2) * 2; // even sizes: libx264 yuv420p rejects odd dimensions
  // [left, width] of the world span the viewer sees in this draw: the whole width, or the vertical strip at env.frameX.
  T.STRIP_W = T.W;
  T.visibleSpan = (env) => (env && env.frameX != null ? [env.frameX - T.STRIP_W / 2, T.STRIP_W] : [0, T.W]);
  T.init = (spec, canvas, opts = {}) => {
    const scale = opts.scale ?? 1;
    const format = T.FORMATS[spec.format || 'landscape'];
    if (!format) throw new Error(`Unknown format "${spec.format}" (landscape, vertical)`);
    const vertical = spec.format === 'vertical';
    T.FORMAT = vertical ? 'vertical' : 'landscape';
    const STRIP_W = (T.H * format.w) / format.h; // visible world width: 1920 landscape, 607.5 vertical
    T.STRIP_W = STRIP_W;
    const wscale = (scale * format.h) / T.H; // world pixels per logical unit
    T.DPR = wscale; // shadowBlur and other device-pixel values must be multiplied by this
    canvas.width = even(format.w * scale);
    canvas.height = even(format.h * scale);
    const mk = () => { const c = document.createElement('canvas'); c.width = even(T.W * wscale); c.height = even(T.H * wscale); return c; };
    const bufA = mk(), bufB = mk();
    const tl = T.buildTimeline(spec);
    T.film = { spec, timeline: tl }; // the film being rendered (transitions and modules read cast/shots from here)
    const env = { dpr: wscale, seed: spec.seed ?? 1, spec, cast: spec.cast || {}, style: spec.style || {} };
    const ctx = canvas.getContext('2d');
    const drawPinned = (c, shot, lt) => T.drawPinned(c, shot, lt, vertical ? { ...env, frameX: T.W / 2 } : env);
    // spec.overlays: [{from, to, layer}] — screen-space layers that persist across cuts (quest chips, speedrun timers)
    const overlays = (spec.overlays || []).map((o, k) => ({ ...o, layer: { id: 'overlay' + k, ...o.layer, hud: true } }));
    const drawOverlays = (c, t, shot) => {
      if (!overlays.length) return;
      c.save();
      c.setTransform(wscale, 0, 0, wscale, 0, 0);
      for (const o of overlays) {
        const from = o.from ?? 0;
        if (t < from || (o.to != null && t > o.to)) continue;
        if (o.hideIn && shot && o.hideIn.includes(shot.id)) continue; // e.g. a split screen that needs the corner
        const olt = t - from;
        T.drawLayer(c, T.effLayer(o.layer, olt), olt, { ...env, cam: null, shot, seed: env.seed + ':overlay', frameX: vertical ? T.W / 2 : undefined }, null);
      }
      c.restore();
    };
    // Draw one shot (and its pinned layers) into a world-sized canvas. Vertical films draw the shot centred on its
    // frame x, then shift it so that point lands on the world centre: transitions and overlays always see the
    // visible strip in the middle of the canvas.
    const tmp = vertical ? mk() : null;
    const frameShot = (c, shot0, lt) => {
      const shot = T.resolvePinned(shot0);
      if (!vertical) { T.drawShot(c, shot, lt, env); drawPinned(c, shot, lt); return; }
      const fx = T.clamp(T.num(shot.frame, lt, 0.5) * T.W, STRIP_W / 2, T.W - STRIP_W / 2);
      const framed = T.stripFramed(shot, fx); // zoom around the visible strip
      // Draw and pixel-process only the visible strip (plus a 2-px margin): about a third of the world's pixels.
      const sx = Math.max(0, Math.floor((fx - STRIP_W / 2) * wscale) - 2), sw = Math.min(tmp.width - sx, Math.ceil(STRIP_W * wscale) + 4);
      const tctx = tmp.getContext('2d');
      tctx.save(); tctx.setTransform(1, 0, 0, 1, 0, 0); tctx.fillStyle = '#000'; tctx.fillRect(0, 0, tmp.width, tmp.height); // no stale pixels outside the strip
      tctx.beginPath(); tctx.rect(sx, 0, sw, tmp.height); tctx.clip();
      T.PIXEL_RECT = { canvas: tmp, rect: [sx, 0, sw, tmp.height] };
      try { T.drawShot(tctx, framed, lt, { ...env, frameX: fx }); } finally { T.PIXEL_RECT = null; tctx.restore(); }
      c.save();
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.fillStyle = '#000'; c.fillRect(0, 0, c.canvas.width, c.canvas.height);
      const dx = Math.round((T.W / 2 - fx) * wscale);
      c.drawImage(tmp, sx, 0, sw, tmp.height, sx + dx, 0, sw, tmp.height);
      c.restore();
      drawPinned(c, shot, lt);
    };
    const world = vertical ? mk() : canvas; // the frame is composed here, then cropped into the output canvas
    const wctx = world.getContext('2d');
    const render = (t) => {
      t = T.clamp(t, 0, Math.max(0, tl.total - 1e-6));
      const i = T.shotAt(tl, t), shot = tl.shots[i], lt = Math.max(0, t - shot.start);
      const tr = shot.transition;
      if (i > 0 && tr.dur > 0 && lt < tr.dur && T.transitions[tr.kind]) {
        const prev = tl.shots[i - 1];
        frameShot(bufA.getContext('2d'), prev, prev.dur + lt);
        frameShot(bufB.getContext('2d'), shot, lt);
        wctx.setTransform(1, 0, 0, 1, 0, 0);
        wctx.fillStyle = '#000'; wctx.fillRect(0, 0, world.width, world.height); // start from a clean frame: semi-transparent transitions (whip) must not show the previous render
        T.transitions[tr.kind](wctx, bufA, bufB, lt / tr.dur, tr, { ...env, prev, shot });
      } else {
        frameShot(wctx, shot, lt);
      }
      drawOverlays(wctx, t, shot);
      if (vertical) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        const sx = (T.W - STRIP_W) / 2 * wscale;
        ctx.drawImage(world, sx, 0, STRIP_W * wscale, world.height, 0, 0, canvas.width, canvas.height);
      }
      return { shot: shot.id, index: i, lt };
    };
    return { render, timeline: tl };
  };

  // ---------- assets ----------
  T.collectImages = (spec) => {
    const out = new Set();
    const walk = (v, key) => {
      if (Array.isArray(v)) v.forEach((x) => walk(x, key));
      else if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => walk(x, k));
      else if (typeof v === 'string' && ['src', 'image', 'idle', 'talk', 'blink'].includes(key)) out.add(v);
    };
    walk(spec, '');
    return [...out];
  };
  T.loadImages = (srcs) => Promise.all(srcs.map((src) => new Promise((ok, fail) => {
    const im = new Image();
    im.onload = () => { T.images[src] = im; ok(); };
    im.onerror = () => fail(new Error('Image failed to load: ' + src));
    im.src = src;
  })));
  T.img = (src) => {
    const im = T.images[src];
    if (!im) throw new Error('Image not preloaded: ' + src);
    return im;
  };
})();
