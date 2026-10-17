// gags-fx.js — acting and gags, part 2: FX poof clouds, hats that drop / pass / fly / stack, micro-acting marks,
// sweat and tear emitters and the "no X" sign (T.FX, T.ACT_MARKS, T.PROPS.prohibit). Helpers come from gags.js (T.GAG).
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL, W = T.W, H = T.H, D = T.DEG, GK = T.GAG;
  const { FPS, VIEW_SHIFT, frame, twos, isHex, lookOf, poseOf, toWorld, headWorld, onTarget, puff, dustCluster, arcs, rimOf, hatAt, poly } = GK;
  // ========== FX — poof, hat, marks, sweat-spray, tear-stream, prohibit
  // Fade a group as one flat sheet (overlapping lobes must not show through each other).
  function flat(ctx, alpha, fn) {
    if (alpha >= 1) { fn(ctx); return; }
    if (alpha <= 0) return;
    const [c, k] = T.scratch('act:flat', ctx.canvas.width, ctx.canvas.height);
    k.clearRect(0, 0, c.width, c.height); k.setTransform(ctx.getTransform()); fn(k);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha *= alpha; ctx.drawImage(c, 0, 0); ctx.restore();
  }
  // Poof: covers the subject in 2 frames, boils, dissolves into stray puffs (19 frames). 300 x 220; word: text | false.
  function poof(ctx, L, lt) {
    const f = lt * FPS, w = L.w ?? 300, h = L.h ?? 220, seed = (L.id ?? 'poof') + ':' + (L.at ?? 0);
    const holdF = (L.hold ?? 0.17) * FPS, endF = 2 + holdF + 12;
    if (f > endF) return;
    const col = L.color ?? '#f4f1ea', sh = L.shade ?? '#d6d0c6';
    if ((L.mode ?? 'band') === 'column') return poofColumn(ctx, L, f, w, h, seed, col, sh);
    const sc = f < 2 ? T.lerp(0.6, 1.05, T.ease.outBack(f / 2)) : T.lerp(1.05, 1.3, T.ease.outCubic(T.clamp((f - 2) / (endF - 2))));
    const fade = 1 - T.ease.in(T.clamp((f - 2 - holdF) / 12));
    const g = T.rng(T.hash(seed + ':stray')), n = L.puffs ?? 5, fly = T.ease.outCubic(T.clamp((f - 2) / (endF - 2)));
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + g() * 0.8, d0 = w * 0.5, d = d0 + (80 + g() * 60) * fly, r = h * (0.08 + g() * 0.06);
      if (f < 2 + holdF * 0.5) continue;
      ctx.save(); ctx.globalAlpha *= 1 - T.clamp((f - endF + 8) / 8);
      puff(ctx, Math.cos(a) * d, Math.sin(a) * d * 0.7 - 20 * fly, r * (1 - fly * 0.4), col, sh, 5);
      ctx.restore();
    }
    flat(ctx, fade, (k) => T.drawCloud(k, 0, 0, w * sc, h * sc, seed, { count: L.count ?? 7, color: col, shade: sh, line: 6, boil: lt }));
    if (L.word !== null && L.word !== false && f >= 1) {
      const ws = T.lerp(0.5, 1.2, T.ease.outCubic(T.clamp((f - 1) / (endF - 1))));
      ctx.save(); ctx.globalAlpha *= 1 - T.clamp((f - endF + 5) / 5); ctx.rotate(-8 * D); ctx.scale(ws, ws);
      T.toonText(ctx, typeof L.word === 'string' ? L.word : 'POOF!', 0, w * 0.06, { size: w * 0.16 * (L.wordSize ?? 1), fill: L.wordColor ?? '#e8c860', stroke: 12, shadow: false });
      ctx.restore();
    }
  }
  // Column (ran away): 2-3 stacked clouds grow upward from the feet over 8 frames, hold 4, fade 12.
  function poofColumn(ctx, L, f, w, h, seed, col, sh) {
    const n = L.count && L.count <= 4 ? L.count : 3, fade = 1 - T.clamp((f - 12) / 12);
    flat(ctx, fade, (k) => {
    for (let i = 0; i < n; i++) {
      const p = T.ease.outBack(T.clamp((f - i * 2) / 6)), cw = w * (0.62 - i * 0.12) * Math.max(0.01, p);
      if (p <= 0) continue;
      T.drawCloud(k, 0, -h * 0.35 - i * h * 0.62 * p, cw, cw * 0.8, seed + i, { count: 6, color: col, shade: sh, line: 6, boil: f / FPS });
    }
    });
  }

  // Hat: drop / give / fly / stack a headwear sprite onto (or off) the target's head.
  function hat(ctx, L, lt) {
    if (!GK.cur) return;
    const env = GK.cur.env, slt = GK.cur.lt, start = slt - lt, mode = L.mode ?? 'drop', kind = L.head ?? 'crown';
    const pose = poseOf(env, L.target, slt), base = pose || poseOf(env, L.target, start) || poseOf(env, L.target, start - 1 / FPS);
    if (!base) { if (L.target) return; throw new Error('hat: needs a "target" layer id (a bean)'); }
    const own = lookOf(env, base.L), look = { ...own, ...(own.head !== kind ? { headColor: undefined, headColor2: undefined } : {}), ...(isHex(L.color) ? { headColor: L.color } : {}), ...(isHex(L.color2) ? { headColor2: L.color2 } : {}) };
    const view = base.L.view ?? look.view ?? '3q', flip = base.st.flip, f = lt * FPS;
    toWorld(ctx, env, base.z, base.hud);
    const worn = () => pose && pose.L.look && pose.L.look.head === kind; // the target's own swap has taken over
    const [hx, hy] = headWorld(pose || base);
    if (mode === 'drop' || mode === 'stack') {
      const n = mode === 'stack' ? L.stack ?? 1 : 0, fallF = mode === 'stack' ? 5 : 2, k = (pose || base).k;
      if (mode === 'drop' && f >= fallF && worn()) return;
      const p = T.clamp(f / fallF), e = mode === 'stack' ? T.ease.in(p) : p;
      const restY = hy - n * 98 * k, y = restY - (1 - e) * (L.from ?? 600);
      const sq = f >= fallF && f < fallF + 2;
      const tilt = n ? (n % 2 ? 6 : -6) * D : 0;
      if (f < fallF + 4 && mode === 'drop') swoosh(ctx, hx, y, restY, k, f / (fallF + 4));
      hatAt(ctx, kind, look, lt, hx, y, k, (pose || base).st.r + tilt, flip, sq ? (n ? 1.1 : 1.06) : 1, sq ? (n ? 0.85 : 0.9) : 1, view);
      if (L.bonk && f >= fallF && f < fallF + 4) T.starburst(ctx, hx + 70 * k * 2, restY - 160 * k, 10, 30, 6, (L.id ?? 'hat') + 'bonk', '#fff6c8', P.ink, 4);
      return;
    }
    if (mode === 'give') {
      const giver = poseOf(env, L.from, start) || base, [gx, gy] = headWorld(giver), q = T.ease.outCubic(T.clamp(f / 12));
      if (f >= 12 && worn()) return;
      const x = T.lerp(gx, hx, q), y = T.lerp(gy, hy, q) - Math.sin(q * Math.PI) * (L.arc ?? 120);
      hatAt(ctx, kind, look, lt, x, y, T.lerp(giver.k, (pose || base).k, q), (1 - q) * -15 * D, flip, 1, 1, view);
      return;
    }
    if (mode === 'fly') return hatFly(ctx, L, lt, base, look, view, kind);
    if (mode === 'flat') return hatFlat(ctx, L, lt, base, look, view, kind);
    throw new Error(`hat: mode "${mode}" must be drop, give, fly, stack or flat`);
  }
  // Two yellow swoosh arcs along the drop path, 4 frames.
  function swoosh(ctx, x, y, restY, k, p) {
    ctx.save(); ctx.globalAlpha *= 1 - p; ctx.lineCap = 'round';
    for (const s of [-1, 1]) {
      const ox = s * 190 * k;
      for (const [c, lw] of [[P.ink, 10], ['#ffd84a', 5]]) { ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(x + ox * 0.7, restY - 420 * k); ctx.quadraticCurveTo(x + ox * 1.1, restY - 280 * k, x + ox * 0.85, restY - 180 * k); ctx.stroke(); }
    }
    ctx.restore();
  }
  // Helmet-pop / startle: up and spinning, lands beside the feet with one small bounce; `float` hovers in a figure 8.
  function hatFly(ctx, L, lt, base, look, view, kind) {
    const [hx, hy] = headWorld(base), k = base.k, dir = L.dir ?? -1;
    if (L.float) {
      const rise = T.ease.outCubic(T.clamp(lt / 0.2)), w = Math.PI * 2 * 0.7 * lt;
      hatAt(ctx, kind, look, lt, hx + Math.sin(w) * 70 * rise, hy - 160 * rise + Math.sin(2 * w) * 30 * rise, k, Math.sin(w) * 25 * D, base.st.flip, 1, 1, view);
      return;
    }
    // lands upright on its brim beside the feet (head centre sits (-450 - brim y) units below the ground line)
    const vy = L.vy ?? -900, g = L.g ?? 2500, vx = (L.vx ?? 220) * dir, ground = base.st.y + (-450 - rimOf(kind)[0] - rimOf(kind)[2] * 0.4) * k;
    const tl = (-vy + Math.sqrt(vy * vy + 2 * g * Math.max(0, ground - hy))) / g;
    const t = Math.min(lt, tl), x = hx + vx * t, y = hy + vy * t + 0.5 * g * t * t;
    const b = lt > tl ? -14 * Math.sin(T.clamp((lt - tl) / 0.2) * Math.PI) : 0;
    // whole turns only, so the spin ends upright; a 6 deg settle tilt after the landing
    const turns = Math.max(1, Math.round(((L.spin ?? 540) * tl) / 360)), rot = lt < tl ? dir * turns * 2 * Math.PI * T.ease.out(lt / tl) : dir * 6 * D;
    const sq = lt > tl && lt < tl + 0.07;
    hatAt(ctx, kind, look, lt, x, y + b, k, rot, base.st.flip, sq ? 1.12 : 1, sq ? 0.86 : 1, view, true);
  }
  // Flat: the hat left behind after a stomp / squash, pressed flat on the ground where the target stood.
  function hatFlat(ctx, L, lt, base, look, view, kind) {
    const k = base.k, f = lt * FPS, p = T.ease.outBack(T.clamp(f / 4));
    const [y0] = rimOf(kind), sy = L.flat ?? 0.42, cy = base.st.y + (-450 - y0) * k * sy;
    hatAt(ctx, kind, look, lt, base.st.x, cy, k, (L.tilt ?? -4) * D, base.st.flip, T.lerp(1.4, 1.15, p), T.lerp(0.2, sy, p), view, true);
    if (f < 14) { ctx.save(); ctx.globalAlpha *= 1 - T.clamp((f - 6) / 8); [-1, 1].forEach((s, i) => dustCluster(ctx, base.st.x + s * 190 * k, base.st.y - 14, 26, (L.id ?? 'hf') + i)); ctx.restore(); }
  }

  // Marks: micro-acting signs around the head, all on twos. Drawn in the target's rig units (1 px of a 300 px
  // character = 2 units). Sub-kind in `mark`.
  const MARK_DUR = { 'shout-jag': 0.5, ticks: 0.13, notice: 0.17, whoosh: 0.4 };
  const MARKS = {
    'shout-jag'(ctx, L, lt, side) {
      const r = T.rng(T.hash((L.id ?? 'jag') + twos(lt)));
      ctx.save(); ctx.strokeStyle = L.color ?? P.ink; ctx.lineWidth = 10; ctx.lineJoin = 'miter'; ctx.lineCap = 'round';
      for (const a of [-30, 0, 30]) {
        ctx.save(); ctx.translate(0, -450); ctx.rotate(a * D + side * 0.15); ctx.translate((r() - 0.5) * 12, -200 + (r() - 0.5) * 12);
        ctx.beginPath(); ctx.moveTo(0, 0); for (let i = 1; i <= 4; i++) ctx.lineTo(i % 2 ? 16 : -16, -i * 17); ctx.stroke(); ctx.restore();
      }
      ctx.restore();
    },
    ticks(ctx, L, lt, side) { // press / snap / realize / crunch
      const v = L.variant ?? 'realize', crunch = v === 'crunch';
      if (crunch && twos(lt) % 2) return;
      const [ox, oy] = crunch ? [side * 120, -382] : [side * 175, -560], col = L.color ?? (v === 'realize' ? '#ffe060' : '#ffd21a');
      const n = L.count ?? 4, g = T.rng(T.hash((L.id ?? 'tk') + twos(lt)));
      for (let i = 0; i < n; i++) {
        const a = (side > 0 ? -70 : -110) * D + (i - (n - 1) / 2) * 0.42, r0 = 26, r1 = r0 + 36 + g() * 8;
        tickStroke(ctx, ox + Math.cos(a) * r0, oy + Math.sin(a) * r0, ox + Math.cos(a) * r1, oy + Math.sin(a) * r1, col);
      }
    },
    notice(ctx, L, lt) { // "\ | /" fan above the head
      for (const a of [-25, 0, 25]) { const r = (a - 90) * D; tickStroke(ctx, Math.cos(r) * 190, -450 + Math.sin(r) * 190, Math.cos(r) * 236, -450 + Math.sin(r) * 236, L.color ?? '#ffe98a'); }
    },
    zzz(ctx, L, lt, side) { // a Z every 0.6 s rising 30 px/s, drifting, fading over 1.5 s
      const sizes = [60, 46, 34];
      for (let i = Math.max(0, Math.floor((lt - 1.5) / 0.6)); i * 0.6 <= lt; i++) {
        const a = lt - i * 0.6, sz = sizes[i % 3] * 2;
        ctx.save(); ctx.globalAlpha *= 1 - a / 1.5;
        T.toonText(ctx, 'Z', side * (200 + a * 20), -640 - a * 60, { size: sz, fill: L.color ?? '#ffffff', stroke: sz * 0.16, shadow: false });
        ctx.restore();
      }
    },
    'hat-drips'(ctx, L, lt) { // stress ticks hanging under a brim, one falls as a drop every 0.4 s
      const n = L.count ?? 8, g = T.rng(T.hash((L.id ?? 'hd') + twos(lt)));
      ctx.save(); ctx.strokeStyle = P.ink; ctx.lineWidth = 6; ctx.lineCap = 'round';
      for (let i = 0; i < n; i++) { const x = -120 + (240 * i) / (n - 1), len = 26 + (i % 3) * 6 + (g() - 0.5) * 12; ctx.beginPath(); ctx.moveTo(x, -548); ctx.lineTo(x, -548 + len); ctx.stroke(); }
      ctx.restore();
      const k = Math.floor(lt / 0.4), a = (lt % 0.4) / 0.4, x = -120 + (240 * ((k * 5) % n)) / (n - 1);
      ctx.save(); ctx.globalAlpha *= 1 - a; drop(ctx, x, -500 + a * a * 140, 0.7, '#9fdcf2'); ctx.restore();
    },
    gloom(ctx, L, lt) { // purple despair lines hanging from the forehead, grow over 8 frames
      const n = L.count ?? 8, grow = T.ease.outCubic(T.clamp(lt * FPS / 8)), g = T.rng(T.hash((L.id ?? 'gl') + ':g'));
      ctx.save(); ctx.strokeStyle = L.color ?? '#4a2a5a'; ctx.fillStyle = ctx.strokeStyle; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.globalAlpha *= 0.85;
      for (let i = 0; i < n; i++) {
        const x = -110 + (220 * i) / (n - 1) + 30, len = (60 + g() * 60) * grow, y0 = -578 + Math.abs(x - 30) * 0.25;
        ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y0 + len); ctx.stroke();
        ctx.beginPath(); ctx.arc(x, y0 + len + 4, 8 * grow, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    },
    stink(ctx, L, lt) { // three green wavy lines rising from the head
      const t = twos(lt) / 15;
      ctx.save(); ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        const x0 = (i - 1) * 70, rise = ((t * 0.8 + i * 0.33) % 1) * 120;
        for (const [c, lw] of [[P.ink, 12], [L.color ?? '#6aa84f', 7]]) {
          ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.beginPath();
          for (let s = 0; s <= 10; s++) { const y = -610 - rise - s * 12, x = x0 + Math.sin(s * 0.9 + t * Math.PI * 2) * 14; s ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
          ctx.stroke();
        }
      }
      ctx.restore();
    },
    whoosh(ctx, L, lt, side) { // white motion arcs beside the body: appear in 2 frames, fade over 10
      const a = T.clamp(lt * FPS / 2) * (1 - T.clamp((lt * FPS - 2) / 10));
      arcs(ctx, -side * 60, -300, 260, side > 0 ? Math.PI * 0.75 : -Math.PI * 0.25, side > 0 ? Math.PI * 1.25 : Math.PI * 0.25, L.count ?? 3, a, 10);
    },
    question(ctx, L, lt) { T.drawProp(ctx, 'question', 140, lt, {}); },
    exclaim(ctx, L, lt) { T.drawProp(ctx, 'exclaim', 140, lt, {}); },
    scribble(ctx, L, lt) { // black zigzag scribble cloud above the head
      const g = T.rng(T.hash((L.id ?? 'sc') + twos(lt)));
      ctx.save(); ctx.strokeStyle = L.color ?? '#1a1210'; ctx.lineWidth = 6; ctx.lineJoin = 'round'; ctx.beginPath();
      for (let i = 0; i < 26; i++) { const a = g() * Math.PI * 2, r = Math.sqrt(g()); const x = Math.cos(a) * r * 120, y = -700 + Math.sin(a) * r * 60; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke(); ctx.restore();
    },
  };
  // question / exclaim draw at the origin: lift them above the head with a 2 Hz bob.
  for (const q of ['question', 'exclaim']) { const fn = MARKS[q]; MARKS[q] = (ctx, L, lt) => { ctx.save(); ctx.translate(0, -700 + Math.sin(lt * Math.PI * 4) * 4); fn(ctx, L, lt); ctx.restore(); }; }
  T.ACT_MARKS = MARKS;
  function tickStroke(ctx, x0, y0, x1, y1, col) {
    ctx.save(); ctx.lineCap = 'round';
    for (const [c, lw] of [[P.ink, 18], [col, 10]]) { ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); }
    ctx.restore();
  }
  function marks(ctx, L, lt) {
    const fn = MARKS[L.mark ?? 'shout-jag'];
    if (!fn) throw new Error(`marks: unknown mark "${L.mark}" (use ${Object.keys(MARKS).join(', ')})`);
    const dur = L.dur ?? MARK_DUR[L.mark ?? 'shout-jag'] ?? Infinity;
    if (lt > dur + 0.2) return;
    ctx.save();
    const pose = onTarget(ctx, L);
    if (pose) {
      if (!pose.local && L.size) { ctx.translate(0, -450); ctx.scale(L.size, L.size); ctx.translate(0, 450); }
      if (Number.isFinite(dur) && lt > dur) ctx.globalAlpha *= 1 - T.clamp((lt - dur) / 0.2);
      fn(ctx, L, lt, L.side ?? 1);
    }
    ctx.restore();
  }

  // Teardrop pointing along `ang` (0 = falling down), rig units.
  function drop(ctx, x, y, s, fill, ang = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s);
    T.outlined(ctx, (k) => { k.moveTo(0, -34); k.quadraticCurveTo(24, 4, 0, 18); k.quadraticCurveTo(-24, 4, 0, -34); }, fill, { line: 6 });
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(-6, 2, 4, 7, 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  // Sweat spray: drops leave the head rim on gravity arcs, `rate` per second, 15 frames each; `stack` accumulates.
  function sweatSpray(ctx, L, lt) {
    const dur = L.dur ?? Infinity;
    if (lt > dur + 0.5) return;
    ctx.save();
    if (!onTarget(ctx, L)) { ctx.restore(); return; }
    const fill = L.color ?? '#9fdcf2', sz = L.size ?? 1;
    if (L.stack) {
      for (let i = 0; i <= Math.min(lt, dur); i++) drop(ctx, (L.side ?? 1) * (128 + (i % 3) * 14), -520 + (i % 2) * 30 + (lt - i) * 8, 2.3 * sz, fill);
      ctx.restore(); return;
    }
    const rate = L.rate ?? 3, life = 0.5, spread = (L.spread ?? 120) * D;
    for (let i = Math.max(0, Math.floor((lt - life) * rate)); i / rate <= Math.min(lt, dur); i++) {
      const a0 = i / rate, t = lt - a0, g = T.rng(T.hash((L.id ?? 'sw') + ':' + i));
      if (t < 0 || t > life) continue;
      const a = -Math.PI / 2 + (g() - 0.5) * 2 * spread, d = 160 + g() * 160, p = t / life;
      const x = Math.cos(a) * (165 + d * p), y = -450 + Math.sin(a) * (165 + d * p) + 700 * t * t;
      const vx = Math.cos(a) * d / life, vy = Math.sin(a) * d / life + 1400 * t;
      ctx.save(); ctx.globalAlpha *= 1 - p * p;
      drop(ctx, x, y, 2.5 * sz, fill, Math.atan2(vy, vx) - Math.PI / 2);
      ctx.restore();
    }
    ctx.restore();
  }
  // Tear stream: a light-blue ribbon from the lower lid to the chin, dash pattern scrolling 4 px per frame.
  function tearStream(ctx, L, lt) {
    const dur = L.dur ?? Infinity;
    if (lt > dur) return;
    ctx.save();
    const pose = onTarget(ctx, L);
    if (!pose) { ctx.restore(); return; }
    const view = pose.L.view ?? '3q', fx = (VIEW_SHIFT[view] ?? 0.24) * 150, sp = view === 'side' ? 0 : view === '3q' ? 40 : 52;
    const eyes = view === 'side' ? [fx + 18] : L.both === false ? [fx + sp] : [fx - sp, fx + sp];
    const w = (L.width ?? 10) * 2, grow = T.ease.outCubic(T.clamp(lt / 0.2)), len = 230 * grow, g = T.rng(T.hash((L.id ?? 'tear') + twos(lt)));
    for (const ex of eyes) {
      const pts = [];
      for (let s = 0; s <= 8; s++) pts.push([ex + (ex < fx ? -1 : 1) * s * 4 + (g() - 0.5) * 4, -436 + (s / 8) * len]);
      ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (const [c, lw] of [[P.ink, w + 8], [L.color ?? '#7fc4ff', w]]) { ctx.strokeStyle = c; ctx.lineWidth = lw; poly(ctx, pts); ctx.stroke(); }
      ctx.setLineDash([10, 22]); ctx.lineDashOffset = -lt * FPS * 8; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = w * 0.3; poly(ctx, pts); ctx.stroke();
      ctx.restore();
      const [bx, by] = pts[8];
      T.outlined(ctx, (k) => k.arc(bx, by + 6, w * 0.75, 0, Math.PI * 2), L.color ?? '#7fc4ff', { line: 5 });
    }
    ctx.restore();
  }

  // "No X" sign: red ring + 45 deg bar with a union ink outline, optional icon prop underneath.
  function prohibitSign(ctx, size, ringP, barP, o, lt) {
    const R = size / 2, rw = R * 0.14 * 2, Ri = R - rw, col = isHex(o.color) ? o.color : '#d42020', line = Math.max(3, size * 0.012);
    if (o.icon && T.PROPS[o.icon] && o.icon !== 'prohibit') { ctx.save(); ctx.filter = 'saturate(0.85)'; T.drawProp(ctx, o.icon, size * 0.6, lt, {}); ctx.restore(); }
    ctx.save(); ctx.scale(ringP, ringP);
    const ring = (k) => { k.moveTo(R, 0); k.arc(0, 0, R, 0, Math.PI * 2); k.moveTo(Ri, 0); k.arc(0, 0, Ri, 0, Math.PI * 2, true); };
    const bar = (k) => { k.save(); k.rotate(45 * D); k.rect(-Ri - 2, -rw / 2, (Ri + 2) * 2 * barP, rw); k.restore(); };
    ctx.lineJoin = 'round'; ctx.strokeStyle = P.ink; ctx.lineWidth = line * 2;
    ctx.beginPath(); ring(ctx); if (barP > 0) bar(ctx); ctx.stroke();
    ctx.fillStyle = col; ctx.beginPath(); ring(ctx); ctx.fill('evenodd');
    if (barP > 0) { ctx.beginPath(); bar(ctx); ctx.fill(); }
    if (o.highlight !== false) { ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = Math.max(2, size * 0.008); ctx.beginPath(); ctx.arc(0, 0, R - rw * 0.3, -2.6, -1.9); ctx.stroke(); }
    ctx.restore();
  }
  // Ring 0 -> 1.15 -> 1 over 7 frames with a 5 deg pop tilt, then the bar wipes along its length over 4 frames.
  function prohibitFx(ctx, L, lt) {
    const f = lt * FPS, size = L.size ?? 260;
    if (L.stamp) { if (f >= 1 || L.stamp === 'instant') { if (f < 3) ctx.translate((twos(lt) % 2 ? 4 : -4), 0); prohibitSign(ctx, size, 1, 1, L, lt); } return; }
    const ringP = Math.max(0.001, T.ease.outBack(T.clamp(f / 7))), barP = T.ease.outCubic(T.clamp((f - 7) / 4));
    ctx.rotate((1 - T.clamp(f / 7)) * 5 * D);
    if (L.jolt && f >= 11 && f < 13) ctx.translate(f < 12 ? 4 : -4, 0);
    prohibitSign(ctx, size, ringP, barP, L, lt);
  }

  Object.assign(T.FX, { poof, hat, marks, 'sweat-spray': sweatSpray, 'tear-stream': tearStream, prohibit: prohibitFx });
  T.PROPS.prohibit = (ctx, s, lt, o) => prohibitSign(ctx, s, 1, 1, o || {}, lt);
})();
