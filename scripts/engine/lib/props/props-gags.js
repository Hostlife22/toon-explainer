// props-gags.js — gag props: signpost family, furniture, cage / door / gate / portcullis, handheld gag props, screens that
// show another shot, calendars and clocks, extruded emblems and stat blocks, prize wheel and coin flip, plus the shared
// helpers used by the personified `obj` layer (animals-objects.js). `s` = size in px (the prop's largest dimension).
// Ground props draw with origin = bottom centre (listed in T.PROP_GROUND); handheld props draw centred so bean `hold`
// keeps working. Times are layer-local, timing is measured in frames at 30 fps. Random detail is seeded by the layer
// id and never drawn inside a path callback (T.outlined runs those twice).
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL, D = T.DEG, PI = Math.PI, TAU = Math.PI * 2;
  const LW = (s) => Math.max(3, s * 0.02);
  const sh = (c, k = -0.22) => T.shade(c, k);
  const F = (lt) => lt * 30;
  const two = (lt) => Math.floor(lt * 15);
  const RNG = (o, kind, part) => T.rng(T.hash((o.id || kind) + ':' + part));
  const O = (ctx, s, path, fill, shade) => T.outlined(ctx, path, fill, { line: LW(s), shade });
  const fillR = (col, x, y, w, h) => (k) => { k.fillStyle = col; k.fillRect(x, y, w, h); };
  const evt = (v) => (v == null || v === false ? null : v === true ? {} : typeof v === 'number' ? { at: v } : v);
  // Rotation a prop applies to itself at time lt (radians), so a hand holding it can follow the grip point.
  T.PROP_TILT = T.PROP_TILT || {};
  T.PROP_TILT.bottle = (o, lt) => T.pourAmount(o.pour, lt) * 110 * D;
  const inWin = (wins, lt) => (wins || []).some(([a, b]) => lt >= a && lt <= b);
  const ell = (k, x, y, rx, ry, r = 0) => k.ellipse(x, y, Math.abs(rx), Math.abs(ry), r, 0, TAU);

  // Thick outlined stroke (tubes, sticks, legs, bars): ink underneath, colour on top.
  function stick(ctx, s, pts, w, col, cap = 'round') {
    const path = () => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); };
    ctx.save(); ctx.lineCap = cap; ctx.lineJoin = 'round';
    ctx.strokeStyle = P.ink; ctx.lineWidth = w + LW(s) * 2; path(); ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = w; path(); ctx.stroke();
    ctx.restore();
  }
  // Coil spring along a polyline (>= 2 points): a helix whose back half is drawn dark first and front half light on
  // top, each with an ink underlay. o: {r radius 44, pitch 84 px per turn, color, len (polyline length, measured if absent)}.
  T.drawCoil = (ctx, pts, o = {}) => {
    const m = pts.length - 1, seg = (i) => [pts[i], pts[Math.min(m, i + 1)]];
    const len = o.len ?? pts.slice(1).reduce((a, p, i) => a + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);
    const r = o.r ?? 44, n = Math.max(2, Math.round(len / (o.pitch ?? 84))), steel = o.color ?? '#c9ccd2', N = n * 24;
    const at = (f) => { const j = Math.min(m - 1, Math.floor(f)), u = f - j, [p, q] = seg(j); return [T.lerp(p[0], q[0], u), T.lerp(p[1], q[1], u), Math.atan2(q[1] - p[1], q[0] - p[0])]; };
    const halves = (front) => { const out = []; let cur = [];
      for (let i = 0; i <= N; i++) {
        const q = i / N, th = q * n * TAU, [x, y, a] = at(Math.min(m - 0.001, q * m)), off = Math.cos(th) * r, adv = Math.sin(th) * r * 0.42;
        if ((Math.sin(th) >= 0) === front) cur.push([x - Math.sin(a) * off + Math.cos(a) * adv, y + Math.cos(a) * off + Math.sin(a) * adv]);
        else if (cur.length) { out.push(cur); cur = []; }
      }
      if (cur.length) out.push(cur); return out; };
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const [front, col] of [[false, T.shade(steel, -0.35)], [true, steel]]) for (const sg of halves(front)) {
      if (sg.length < 2) continue;
      for (const [c, lw] of [[P.ink, o.ink ?? 17], [col, o.width ?? 8]]) { ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(sg[0][0], sg[0][1]); for (const p of sg) ctx.lineTo(p[0], p[1]); ctx.stroke(); }
    }
    ctx.restore();
  };
  // Multi-line fitted text: one size for all lines, optional seeded +-1.5 deg per-line tilt (hand-lettered planks).
  function words(ctx, txt, x, y, maxW, size, fill, o = {}) {
    if (txt == null || txt === '') return;
    const ls = String(txt).split('\n');
    let sz = size;
    for (const l of ls) sz = Math.min(sz, T.fitSize(ctx, l, size, maxW, o.weight));
    if (o.maxH) sz = Math.min(sz, o.maxH / (ls.length * 1.08));
    const r = o.seed ? T.rng(T.hash(o.seed + ':tilt')) : null;
    ls.forEach((l, i) => {
      ctx.save(); ctx.translate(x, y + (i - (ls.length - 1) / 2) * sz * 1.08);
      if (r) ctx.rotate((r() - 0.5) * 3 * D);
      ctx.lineWidth = 1;
      T.toonText(ctx, l, 0, 0, { size: sz, fill, ink: o.ink ?? fill, stroke: o.stroke ?? sz * 0.04, shadow: false, baseline: 'middle', weight: o.weight });
      ctx.restore();
    });
  }
  // Yellow impact ticks around a point (door slam, button press, phone ring).
  function ticks(ctx, s, x, y, n, r0, r1, col = '#f5d33a', a0 = 0, spread = TAU) {
    for (let i = 0; i < n; i++) {
      const a = a0 + (n === 1 ? 0 : (i / (spread >= TAU ? n : n - 1)) * spread);
      stick(ctx, s, [[x + Math.cos(a) * r0, y + Math.sin(a) * r0], [x + Math.cos(a) * r1, y + Math.sin(a) * r1]], Math.max(3, s * 0.018), col);
    }
  }

  // drawProp has no env; props that need the cast (bed occupant) or a sub-shot (screens) read it from here.
  let ENV = null;
  T.withPropEnv = (env, fn) => { const prev = ENV; ENV = env || ENV; try { return fn(); } finally { ENV = prev; } };
  const baseProp = T.layers.prop;
  T.layers.prop = (ctx, L, lt, env) => T.withPropEnv(env, () => baseProp(ctx, L, lt, env));

  // Bean head of a cast member in head units (centre (0,-450)); used by beds, cribs and dagger reflections.
  function castHead(ctx, who, expr, lt, seed, view = 'front') {
    if (!T.BEAN_HEAD) return;
    const own = (ENV && ENV.cast && ENV.cast[who]) || {};
    T.BEAN_HEAD.draw(ctx, { skin: P.skin, robe: P.red, hair: 'short', ...own }, { view, expr: expr ?? 'neutral', lt, seed, blink: false, gazeX: 0, mouthKind: null });
  }
  // Another shot drawn into a rounded screen rect (cover fit), else text / flat colour; scanlines, bulge and glare.
  function screen(ctx, s, o, lt, x, y, w, h, r) {
    ctx.save(); ctx.beginPath(); T.rrect(ctx, x, y, w, h, r); ctx.clip();
    ctx.fillStyle = o.screenColor ?? '#1d2a33'; ctx.fillRect(x, y, w, h);
    if (o.screen && ENV) {
      const c = T.subShot(o.screen, o.screenTime ?? lt, ENV), k = Math.max(w / T.W, h / T.H);
      ctx.drawImage(c, x + w / 2 - (T.W * k) / 2, y + h / 2 - (T.H * k) / 2, T.W * k, T.H * k);
    } else if (o.text) words(ctx, o.text, x + w / 2, y + h / 2, w * 0.84, h * 0.3, o.textColor ?? '#e8f4ff', { maxH: h * 0.8 });
    if (o.scan !== 0) { ctx.fillStyle = `rgba(0,0,0,${o.scan ?? 0.06})`; for (let yy = y; yy < y + h; yy += 3) ctx.fillRect(x, yy, w, 1); }
    if (o.bulge !== false) {
      const g = ctx.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * 0.3, x + w / 2, y + h / 2, Math.max(w, h) * 0.72);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.45)'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w * 0.45, y); ctx.lineTo(x, y + h * 0.6); ctx.fill();
    ctx.restore();
  }

  // ---------- signpost family ----------
  function plank(ctx, s, w, h, txt, arrow, col, tc, key) {
    const tip = arrow ? Math.min(0.18 * s, w * 0.3) : 0, d = arrow === 'left' ? -1 : 1, bx = d * (w / 2 - tip);
    const path = (k) => {
      if (!arrow) { T.rrect(k, -w / 2, -h / 2, w, h, s * 0.02); return; }
      k.moveTo(-d * w / 2, -h / 2); k.lineTo(bx, -h / 2); k.lineTo(d * w / 2, 0); k.lineTo(bx, h / 2); k.lineTo(-d * w / 2, h / 2); k.closePath();
    };
    const r = T.rng(T.hash(key + ':grain')), gy = [0, 1, 2].map(() => (r() - 0.5) * h * 0.7), ph = r() * 6;
    O(ctx, s, path, col, (c) => {
      c.fillStyle = sh(col); c.fillRect(-w, h * 0.18, w * 2, h);
      c.strokeStyle = 'rgba(110,70,30,0.45)'; c.lineWidth = Math.max(1.5, s * 0.006);
      for (const y of gy) { c.beginPath(); for (let x = -w / 2; x <= w / 2; x += w / 16) c.lineTo(x, y + Math.sin((x / w) * 9 + ph + y) * h * 0.04); c.stroke(); }
    });
    ctx.fillStyle = '#4a3220';
    for (const nx of [-d * (w / 2 - s * 0.04), arrow ? bx - d * s * 0.02 : d * (w / 2 - s * 0.04)]) { ctx.beginPath(); ctx.arc(nx, 0, s * 0.012, 0, TAU); ctx.fill(); }
    words(ctx, txt, -d * tip * 0.5, 0, (w - tip) * 0.8, h * 0.42, tc, { seed: key, maxH: h * 0.82 });
  }
  function post(ctx, s, top, stake) {
    O(ctx, s, (k) => { k.moveTo(-s * 0.025, top); k.lineTo(s * 0.025, top); k.lineTo(s * 0.025, 0); if (stake !== false) k.lineTo(0, s * 0.05); k.lineTo(-s * 0.025, 0); k.closePath(); }, '#8a5a2a', fillR('#6e4620', s * 0.005, top, s * 0.03, s * 2));
  }
  function signpost(ctx, s, lt, o) {
    const col = o.color ?? '#b07a3c', tc = o.textColor ?? '#3a2414', key = o.id || 'signpost';
    const w = o.w ?? s, h = o.h ?? s * 0.42, stack = o.stack || [], py = -s * (0.78 + stack.length * 0.28);
    ctx.rotate(Math.sin(lt * PI) * D); // idle wobble +-1 deg at 0.5 Hz about the ground
    if (o.post !== false) post(ctx, s, py - h * 0.2, o.stake);
    stack.forEach((t, i) => { ctx.save(); ctx.translate(0, py + h / 2 + s * 0.16 + i * s * 0.28); ctx.rotate((i % 2 ? 4 : -3) * D); plank(ctx, s, w * 0.82, s * 0.22, t, false, col, tc, key + i); ctx.restore(); });
    let txt = o.text ?? '', arrow = o.arrow ?? false, rot = (o.tilt ?? -6) * D, spin = null, dy = 0;
    const fl = evt(o.turn);
    if (fl && lt >= (fl.at ?? 0)) {
      const f = F(lt - (fl.at ?? 0));
      if (f < 1) rot += 15 * D; // 1-frame anticipation
      else if (f < 23) spin = (f - 1) * 47 * D; // 22-frame pinwheel spin about the post top
      else {
        txt = fl.text ?? txt;
        if (fl.arrow !== undefined) arrow = fl.arrow; else if (arrow && (fl.dir ?? -1) === -1) arrow = arrow === 'left' ? 'right' : 'left';
        const q = (f - 23) / 6; if (q < 1) dy = Math.sin(q * TAU) * s * 0.012 * (1 - q);
      }
    }
    ctx.save(); ctx.translate(0, py + dy);
    if (spin == null) { ctx.rotate(rot); plank(ctx, s, w, h, txt, arrow, col, tc, key); }
    else {
      const a0 = ctx.globalAlpha;
      ctx.globalAlpha = a0 * 0.3; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0, 0, w * 0.5, 0, TAU); ctx.fill();
      for (let g = 3; g >= 0; g--) { ctx.save(); ctx.globalAlpha = a0 * (g ? 0.28 : 0.75); ctx.rotate(spin - g * 35 * D); plank(ctx, s, w, h, '', arrow, col, tc, key); ctx.restore(); }
      ctx.globalAlpha = a0;
    }
    ctx.restore();
  }
  function forkSigns(ctx, s, lt, o) {
    ctx.rotate(Math.sin(lt * PI) * D);
    post(ctx, s, -s * 1.0, o.stake);
    const w = o.w ?? s * 0.62, h = s * 0.2, tc = o.textColor ?? '#3a2414';
    [[o.left ?? 'LEFT', 'left', o.colorL ?? '#b07a3c', -0.86, 6, -0.2], [o.right ?? 'RIGHT', 'right', o.colorR ?? '#9a6a34', -0.62, -5, 0.2]].forEach(([t, a, c, y, r, x], i) => {
      ctx.save(); ctx.translate(s * x, s * y); ctx.rotate(r * D); plank(ctx, s, w, h, t, a, c, tc, (o.id || 'fork') + i); ctx.restore();
    });
  }
  function marquee(ctx, s, lt, o) {
    const cv = o.curve ?? 0.4, col = o.color ?? '#3a1426', bulb = o.bulb ?? '#ff7ad9', bw = s * 0.21;
    ctx.rotate(Math.sin(lt * TAU) * 2 * D);
    const p0 = [-s * 0.5, s * 0.14], p1 = [-s * 0.05, s * (0.14 - cv * 0.7)], p2 = [s * 0.5, -s * 0.1];
    const q = (t) => [0, 1].map((i) => (1 - t) * (1 - t) * p0[i] + 2 * (1 - t) * t * p1[i] + t * t * p2[i]);
    const tan = (t) => Math.atan2(2 * (1 - t) * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]), 2 * (1 - t) * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]));
    T.drawThickArrow(ctx, [0, 0.2, 0.4, 0.6, 0.8, 1].map(q), { w: bw, head: s * 0.38, fill: col, line: LW(s), shade: false });
    const step = Math.floor(lt * 10);
    for (let i = 0; i < 14; i++) { // 7 bulbs per edge, chasing in threes
      const t = 0.04 + (i % 7) * 0.085, [x, y] = q(t), a = tan(t) + PI / 2, side = i < 7 ? 1 : -1;
      const bx = x + Math.cos(a) * bw * 0.36 * side, by = y + Math.sin(a) * bw * 0.36 * side, lit = (step + i) % 3 === 0;
      if (lit) { ctx.fillStyle = bulb + '55'; ctx.beginPath(); ctx.arc(bx, by, s * 0.034, 0, TAU); ctx.fill(); }
      T.outlined(ctx, (k) => k.arc(bx, by, s * 0.015, 0, TAU), lit ? '#fff4fb' : sh(bulb, -0.45), { line: Math.max(1.5, s * 0.006) });
    }
    if (o.text) { const [x, y] = q(0.3); ctx.save(); ctx.translate(x, y); ctx.rotate(tan(0.3)); ctx.lineWidth = 1; T.toonText(ctx, o.text, 0, 0, { size: T.fitSize(ctx, o.text, bw * 0.42, s * 0.5), fill: '#fff', baseline: 'middle', shadow: false }); ctx.restore(); }
  }

  // ---------- furniture (features 44, 94) ----------
  function chainLinks(ctx, s, x0, y0, x1, y1, L, col, phase = 0) {
    const len = Math.hypot(x1 - x0, y1 - y0), step = L * 0.72, n = Math.max(1, Math.floor(len / step)), w = Math.max(3, L * 0.16);
    ctx.save(); ctx.translate(x0, y0); ctx.rotate(Math.atan2(y1 - y0, x1 - x0));
    const fr = ((phase % 1) + 1) % 1, base = Math.floor(phase);
    for (let i = -1; i <= n; i++) {
      const x = (i + fr) * step; if (x < 0 || x > len) continue;
      if ((i + base) % 2 === 0) { ctx.lineWidth = w + LW(s) * 1.2; ctx.strokeStyle = P.ink; ctx.beginPath(); ell(ctx, x, 0, L / 2, L * 0.3); ctx.stroke(); ctx.lineWidth = w; ctx.strokeStyle = col; ctx.stroke(); }
      else O(ctx, s * 0.6, (k) => T.rrect(k, x - L / 2, -w * 0.6, L, w * 1.2, w * 0.6), sh(col, -0.25));
    }
    ctx.restore();
  }
  function padlock(ctx, s, x, y, r) {
    ctx.lineWidth = r * 0.3 + LW(s); ctx.strokeStyle = P.ink; ctx.beginPath(); ctx.arc(x, y - r * 0.5, r * 0.55, PI, 0); ctx.stroke();
    ctx.lineWidth = r * 0.3; ctx.strokeStyle = '#9aa0a6'; ctx.stroke();
    O(ctx, s, (k) => T.rrect(k, x - r * 0.8, y - r * 0.5, r * 1.6, r * 1.3, r * 0.25), '#e2b23c', fillR('#b0862a', x + r * 0.2, y - r, r, r * 2));
    ctx.fillStyle = P.ink; ctx.beginPath(); ctx.arc(x, y + 0.05 * r, r * 0.16, 0, TAU); ctx.fill();
  }
  // `part`: "back" (frame only), "front" (chains + sign only, as a second layer over the sitter), default both.
  function throne(ctx, s, lt, o) {
    if (o.part !== 'front') throneFrame(ctx, s, lt, o);
    if (o.part !== 'back') throneFront(ctx, s, lt, o);
  }
  function throneFront(ctx, s, lt, o) {
    const ch = evt(o.chains);
    if (ch && lt >= (ch.at ?? 0)) { // three strands bolted to the arm posts, crossing the sitter's lap and chest
      const p = T.clamp(T.prog(lt, ch.at ?? 0, 0.2)), col = o.chainColor ?? '#9a9aa2', L = s * 0.06;
      for (const [x0, y0, x1, y1] of [[-0.33, -0.44, 0.33, -0.18], [0.33, -0.44, -0.33, -0.18], [-0.34, -0.3, 0.34, -0.3]]) chainLinks(ctx, s, s * x0, s * y0, s * T.lerp(x0, x1, p), s * T.lerp(y0, y1, p), L, col);
      for (const d of [-1, 1]) for (const y of [-0.44, -0.3, -0.18]) O(ctx, s, (k) => k.arc(d * s * 0.335, s * y, s * 0.018, 0, TAU), '#5a5a62');
      if (p >= 1) { const q = T.ease.outBack(T.clamp(T.prog(lt, (ch.at ?? 0) + 0.2, 0.15))); padlock(ctx, s, 0, -s * 0.27, s * 0.07 * q); }
    }
    if (o.sign) { // hangs above the pointed back on two cords, clear of the sitter's head and crown
      const y = -s * (o.pointed ? 1.2 : 1.14);
      ctx.save(); ctx.strokeStyle = P.ink; ctx.lineWidth = Math.max(2, s * 0.006); ctx.beginPath(); ctx.moveTo(-s * 0.12, y + s * 0.02); ctx.lineTo(0, -s * (o.pointed ? 1.0 : 0.96)); ctx.lineTo(s * 0.12, y + s * 0.02); ctx.stroke();
      ctx.translate(0, y); ctx.rotate(-3 * D); O(ctx, s, (k) => k.rect(-s * 0.22, -s * 0.08, s * 0.44, s * 0.16), '#f6f1e4', fillR('#e2d9c2', -s, s * 0.05, s * 2, s)); words(ctx, o.sign, 0, 0, s * 0.38, s * 0.07, o.textColor ?? '#c0202a', { maxH: s * 0.14 }); ctx.restore();
    }
  }
  function throneFrame(ctx, s, lt, o) {
    const v = o.color ?? '#b8202c', g = o.frame ?? '#e2b23c', bw = s * 0.55, seatY = -s * 0.46;
    for (const x of [-0.27, 0.27]) O(ctx, s, (k) => T.rrect(k, s * x - s * 0.035, -s * 0.32, s * 0.07, s * 0.32, s * 0.025), g, fillR(sh(g), s * x, -s, s, s));
    const back = (m) => (k) => {
      const x0 = -bw / 2 + m, x1 = bw / 2 - m, r = (x1 - x0) / 2, y0 = -s + m + (o.pointed ? s * 0.06 : 0);
      k.moveTo(x0, seatY); k.lineTo(x0, y0 + r);
      if (o.pointed) { k.quadraticCurveTo(x0, y0 + r * 0.2, 0, y0 - s * 0.06); k.quadraticCurveTo(x1, y0 + r * 0.2, x1, y0 + r); }
      else k.arc(0, y0 + r, r, PI, 0);
      k.lineTo(x1, seatY); k.closePath();
    };
    O(ctx, s, back(0), g, fillR(sh(g), bw * 0.2, -s * 1.2, bw, s));
    O(ctx, s, back(s * 0.045), v, fillR(sh(v), bw * 0.12, -s * 1.2, bw, s));
    ctx.fillStyle = g;
    for (let i = 0; i < 6; i++) { const x = (i % 2 ? 1 : -1) * bw * 0.16, y = -s * (0.82 - Math.floor(i / 2) * 0.11); T.outlined(ctx, (k) => k.arc(x, y, s * 0.014, 0, TAU), g, { line: Math.max(1.5, s * 0.006) }); }
    O(ctx, s, (k) => T.rrect(k, -s * 0.31, seatY, s * 0.62, s * 0.12, s * 0.03), v, fillR(sh(v), -s, seatY + s * 0.07, s * 2, s));
    O(ctx, s, (k) => T.rrect(k, -s * 0.33, seatY + s * 0.11, s * 0.66, s * 0.05, s * 0.02), g, fillR(sh(g), -s, seatY + s * 0.14, s * 2, s));
    for (const d of [-1, 1]) {
      O(ctx, s, (k) => T.rrect(k, d * s * 0.33 - s * 0.04, -s * 0.6, s * 0.08, s * 0.26, s * 0.03), v, fillR(sh(v), d * s * 0.33, -s, s, s));
      O(ctx, s, (k) => k.arc(d * s * 0.33, -s * 0.61, s * 0.05, 0, TAU), g, (k) => { k.strokeStyle = sh(g, -0.35); k.lineWidth = s * 0.012; k.beginPath(); k.arc(d * s * 0.33, -s * 0.61, s * 0.022, 0, TAU * 0.8); k.stroke(); });
    }
  }
  function bed(ctx, s, lt, o) {
    const wood = o.color ?? '#8a5a3a', sheet = o.quilt ?? '#f2efe9', breath = Math.sin(lt * 0.4 * TAU) * 2;
    const occ = o.occupant ? (Array.isArray(o.occupant) ? o.occupant : o.two ? [o.occupant, o.occupant] : [o.occupant]) : [];
    if (o.view === 'top') return bedTop(ctx, s, lt, o, wood, sheet, occ, breath);
    O(ctx, s, (k) => T.rrect(k, -s * 0.53, -s * 0.47, s * 0.07, s * 0.47, s * 0.025), wood, fillR(sh(wood), -s * 0.49, -s, s * 0.03, s));
    O(ctx, s, (k) => T.rrect(k, s * 0.46, -s * 0.3, s * 0.06, s * 0.3, s * 0.02), wood, fillR(sh(wood), s * 0.49, -s, s * 0.03, s));
    O(ctx, s, (k) => T.rrect(k, -s * 0.48, -s * 0.13, s * 0.96, s * 0.06, s * 0.02), sh(wood, -0.1));
    O(ctx, s, (k) => T.rrect(k, -s * 0.47, -s * 0.3, s * 0.93, s * 0.18, s * 0.04), '#e6e0d4');
    O(ctx, s, (k) => ell(k, -s * 0.37, -s * 0.33, s * 0.1, s * 0.045, -0.1), '#ffffff', fillR('#dcd6cc', -s, -s * 0.31, s * 2, s));
    occ.forEach((oc, i) => { ctx.save(); ctx.translate(-s * 0.35 + i * s * 0.13, -s * 0.36); ctx.rotate(-0.25 + i * 0.1); const k = (s * 0.2) / 300; ctx.scale(k, k); ctx.translate(0, 450); castHead(ctx, oc.who, oc.expr, lt, (o.id || 'bed') + i, oc.view ?? 'front'); ctx.restore(); });
    const bump = occ.length ? s * 0.07 + breath : breath * 0.4;
    O(ctx, s, (k) => {
      k.moveTo(-s * 0.3, -s * 0.31); k.quadraticCurveTo(-s * 0.05, -s * 0.31 - bump * 1.6, s * 0.18, -s * 0.31 - bump * 0.7);
      k.quadraticCurveTo(s * 0.36, -s * 0.33, s * 0.47, -s * 0.3); k.lineTo(s * 0.47, -s * 0.07);
      for (let i = 3; i > 0; i--) { const x = -s * 0.3 + (s * 0.77 * i) / 3; k.quadraticCurveTo(x - s * 0.13, -s * 0.03, x - s * 0.257, -s * 0.08); }
      k.closePath();
    }, sheet, (k) => { k.fillStyle = sh(sheet); k.fillRect(-s, -s * 0.2, s * 2, s); k.strokeStyle = sh(sheet, -0.3); k.lineWidth = LW(s) * 0.6; for (const x of [0.02, 0.24]) { k.beginPath(); k.moveTo(s * x, -s * 0.26); k.quadraticCurveTo(s * (x + 0.03), -s * 0.15, s * (x - 0.01), -s * 0.08); k.stroke(); } });
  }
  function bedTop(ctx, s, lt, o, wood, sheet, occ, breath) {
    O(ctx, s, (k) => T.rrect(k, -s * 0.5, -s * 0.62, s, s * 0.62, s * 0.03), wood);
    O(ctx, s, (k) => T.rrect(k, -s * 0.46, -s * 0.58, s * 0.92, s * 0.54, s * 0.03), '#e6e0d4');
    O(ctx, s, (k) => T.rrect(k, -s * 0.4, -s * 0.55, s * 0.8, s * 0.12, s * 0.05), '#ffffff');
    occ.forEach((oc, i) => { ctx.save(); ctx.translate((i - (occ.length - 1) / 2) * s * 0.26, -s * 0.47); const k = (s * 0.18) / 300; ctx.scale(k, k); ctx.translate(0, 450); castHead(ctx, oc.who, oc.expr, lt, (o.id || 'bed') + i, 'front'); ctx.restore(); });
    O(ctx, s, (k) => T.rrect(k, -s * 0.47, -s * 0.38 - breath * 0.5, s * 0.94, s * 0.36 + breath * 0.5, s * 0.04), sheet, fillR(sh(sheet), -s, -s * 0.12, s * 2, s));
  }
  function lectern(ctx, s, lt, o) {
    const col = o.color ?? '#7a4a2a', tw = s * 0.5 * (o.low ? 0.8 : 1), bw = s * 0.4, top = -s * 0.78;
    if (o.poster) { O(ctx, s, (k) => k.rect(s * 0.4, -s * 1.05, s * 0.38, s * 0.52), '#8a5a2a'); O(ctx, s, (k) => k.rect(s * 0.43, -s * 1.02, s * 0.32, s * 0.46), '#f3ead2'); words(ctx, o.poster, s * 0.59, -s * 0.79, s * 0.28, s * 0.08, o.textColor ?? '#c0202a', { maxH: s * 0.4 }); ctx.strokeStyle = P.ink; ctx.lineWidth = LW(s); ctx.beginPath(); ctx.moveTo(s * 0.59, -s * 0.53); ctx.lineTo(s * 0.59, 0); ctx.stroke(); }
    O(ctx, s, (k) => { k.moveTo(-tw / 2, top); k.lineTo(tw / 2, top); k.lineTo(bw / 2, 0); k.lineTo(-bw / 2, 0); k.closePath(); }, col, fillR(sh(col), s * 0.07, top, s, s));
    O(ctx, s, (k) => { k.moveTo(-tw * 0.36, top + s * 0.1); k.lineTo(tw * 0.36, top + s * 0.1); k.lineTo(bw * 0.34, -s * 0.12); k.lineTo(-bw * 0.34, -s * 0.12); k.closePath(); }, sh(col, 0.1));
    O(ctx, s, (k) => k.rect(-bw * 0.65, -s * 0.05, bw * 1.3, s * 0.05), sh(col, -0.15));
    O(ctx, s, (k) => { k.moveTo(-tw * 0.58, top + s * 0.02); k.lineTo(tw * 0.58, top + s * 0.02); k.lineTo(tw * 0.5, top - s * 0.07); k.lineTo(-tw * 0.5, top - s * 0.11); k.closePath(); }, sh(col, 0.18));
    if (o.sign) words(ctx, o.sign, 0, -s * 0.42, bw * 0.62, s * 0.08, o.textColor ?? '#f2c230', { maxH: s * 0.4 });
    if (o.mic) { ctx.strokeStyle = P.ink; ctx.lineWidth = Math.max(2, s * 0.008); ctx.beginPath(); ctx.moveTo(tw * 0.2, top - s * 0.08); ctx.quadraticCurveTo(tw * 0.36, top - s * 0.24, tw * 0.1, top - s * 0.3); ctx.stroke(); O(ctx, s, (k) => ell(k, tw * 0.08, top - s * 0.31, s * 0.035, s * 0.025, -0.5), '#3a3d42'); }
  }
  function easelContent(ctx, s, lt, c, w, h) {
    if (c.text) words(ctx, c.text, 0, -h * 0.36, w * 0.86, s * 0.07, c.textColor ?? '#2a1c15', { maxH: h * 0.2 });
    if (c.chart) {
      const ch = c.chart, pts = ch.pts ?? [[0, 0.2], [0.2, 0.35], [0.4, 0.45], [0.6, 0.6], [0.75, 0.75], [0.95, 0.08]];
      const crash = ch.crashAt ?? pts.length - 1, X = (x) => -w * 0.38 + x * w * 0.76, Y = (y) => h * 0.36 - y * h * 0.56;
      ctx.strokeStyle = P.ink; ctx.lineWidth = Math.max(2, s * 0.007); ctx.beginPath(); ctx.moveTo(X(0), Y(1)); ctx.lineTo(X(0), Y(0)); ctx.lineTo(X(1), Y(0)); ctx.stroke();
      const p = T.ease.inOut(T.prog(lt, ch.at ?? 0, ch.dur ?? 1.5)), n = Math.max(1, crash), upto = p * n;
      ctx.lineWidth = Math.max(3, s * 0.014); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = ch.color ?? '#3fae3a'; ctx.beginPath();
      for (let i = 0; i <= Math.min(n, Math.ceil(upto)); i++) { const f = Math.min(1, upto - i + 1), a = pts[Math.max(0, i - 1)], b = pts[i], x = i ? T.lerp(a[0], b[0], f) : b[0], y = i ? T.lerp(a[1], b[1], f) : b[1]; if (i) ctx.lineTo(X(x), Y(y)); else ctx.moveTo(X(x), Y(y)); }
      ctx.stroke();
      const q = T.prog(lt, (ch.at ?? 0) + (ch.dur ?? 1.5), 4 / 30); // crash segment snaps in over 4 frames
      if (q > 0 && crash < pts.length) {
        const a = pts[crash - 1] || pts[0], b = pts[pts.length - 1], ex = X(T.lerp(a[0], b[0], q)), ey = Y(T.lerp(a[1], b[1], q)), ang = Math.atan2(ey - Y(a[1]), ex - X(a[0]));
        ctx.strokeStyle = ch.crashColor ?? '#d0302a'; ctx.beginPath(); ctx.moveTo(X(a[0]), Y(a[1])); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.fillStyle = ch.crashColor ?? '#d0302a'; ctx.beginPath(); ctx.moveTo(ex + Math.cos(ang) * s * 0.04, ey + Math.sin(ang) * s * 0.04); ctx.lineTo(ex + Math.cos(ang + 2.4) * s * 0.04, ey + Math.sin(ang + 2.4) * s * 0.04); ctx.lineTo(ex + Math.cos(ang - 2.4) * s * 0.04, ey + Math.sin(ang - 2.4) * s * 0.04); ctx.fill();
      }
    }
    if (c.prohibit) { const r = Math.min(w, h) * 0.4; ctx.strokeStyle = '#d0202a'; ctx.lineWidth = r * 0.16; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.moveTo(-r * 0.7, -r * 0.7); ctx.lineTo(r * 0.7, r * 0.7); ctx.stroke(); }
  }
  function easel(ctx, s, lt, o) {
    const wood = '#8a5a2a', w = s * 0.6, h = s * 0.45, cy = -s * 0.7;
    stick(ctx, s, [[0, -s * 0.96], [s * 0.08, 0]], s * 0.03, sh(wood, -0.3));
    for (const d of [-1, 1]) stick(ctx, s, [[d * s * 0.05, -s], [d * s * 0.3, 0]], s * 0.035, wood);
    let k = 1, c = o;
    if (o.flipAt != null) { const f = F(lt - o.flipAt); if (f >= 0) { k = f < 6 ? Math.abs(Math.cos((f / 6) * PI)) : 1; if (f >= 3) c = { ...o, ...(o.after || {}) }; } }
    ctx.save(); ctx.translate(0, cy - h / 2); ctx.scale(1, Math.max(0.02, k)); ctx.translate(0, h / 2);
    O(ctx, s, (kk) => k > 0 && kk.rect(-w / 2, -h / 2, w, h), c.board ?? '#f3ead2', fillR('#e2d6b8', w * 0.3, -h, w, h * 2));
    easelContent(ctx, s, lt - (o.flipAt != null && F(lt - o.flipAt) >= 3 ? o.flipAt : 0), c, w, h);
    ctx.restore();
    O(ctx, s, (kk) => kk.rect(-w * 0.55, cy + h / 2, w * 1.1, s * 0.035), wood);
  }
  function deckchair(ctx, s, lt, o) {
    const m = '#8a8f96', tl = [-s * 0.26, -s * 0.9], tr = [s * 0.2, -s * 0.94], fr = [s * 0.32, -s * 0.38], fl = [-s * 0.3, -s * 0.34];
    for (const [a, b] of [[tl, [-s * 0.4, 0]], [tr, [s * 0.3, 0]]]) stick(ctx, s, [a, b], s * 0.03, sh(m, -0.2));
    const cols = o.stripes ?? ['#e8504a', '#f3ead2'];
    O(ctx, s, (k) => { k.moveTo(tl[0], tl[1]); k.lineTo(tr[0], tr[1]); k.quadraticCurveTo(s * 0.3, -s * 0.5, fr[0], fr[1]); k.quadraticCurveTo(0, -s * 0.28, fl[0], fl[1]); k.quadraticCurveTo(-s * 0.32, -s * 0.5, tl[0], tl[1]); k.closePath(); }, cols[1], (k) => {
      for (let i = 0; i < 5; i += 2) { const a = i / 5, b = (i + 1) / 5; k.fillStyle = cols[0]; k.beginPath(); k.moveTo(T.lerp(tl[0], tr[0], a), T.lerp(tl[1], tr[1], a) - 4); k.lineTo(T.lerp(tl[0], tr[0], b), T.lerp(tl[1], tr[1], b) - 4); k.lineTo(T.lerp(fl[0], fr[0], b), s * 0.2); k.lineTo(T.lerp(fl[0], fr[0], a), s * 0.2); k.fill(); }
      k.fillStyle = 'rgba(0,0,0,0.12)'; k.fillRect(-s, -s * 0.5, s * 2, s);
    });
    for (const [a, b] of [[fl, [-s * 0.22, 0]], [fr, [s * 0.4, 0]], [[-s * 0.3, -s * 0.5], [s * 0.32, -s * 0.52]]]) stick(ctx, s, [a, b], s * 0.03, m);
    if (o.cocktail) { ctx.save(); ctx.translate(s * 0.58, 0); const g = s * 0.28; stick(ctx, s, [[0, 0], [0, -g * 0.5]], g * 0.05, '#dfe9ec'); O(ctx, s, (k) => ell(k, 0, -g * 0.02, g * 0.2, g * 0.05), '#dfe9ec'); O(ctx, s, (k) => { k.moveTo(-g * 0.28, -g); k.lineTo(g * 0.28, -g); k.lineTo(0, -g * 0.48); k.closePath(); }, '#f2c43a', fillR('#fff6c8', -g, -g, g * 2, g * 0.1)); stick(ctx, s, [[g * 0.05, -g * 0.7], [g * 0.3, -g * 1.25]], g * 0.04, '#e8504a'); O(ctx, s, (k) => k.arc(-g * 0.22, -g, g * 0.12, 0, TAU), '#f6e04a'); ctx.restore(); }
  }
  function coffin(ctx, s, lt, o) {
    const col = o.color ?? '#7a4a2a';
    if (o.lying) { ctx.translate(-s / 2, -s * 0.3); ctx.rotate(PI / 2); ctx.translate(0, s); }
    const hex = (m = 1) => (k) => { const p = [[-0.18, -1], [0.18, -1], [0.3, -0.72], [0.2, 0], [-0.2, 0], [-0.3, -0.72]]; p.forEach(([x, y], i) => { const X = x * s * m, Y = (y + 0.5) * s * m - s * 0.5; if (i) k.lineTo(X, Y); else k.moveTo(X, Y); }); k.closePath(); };
    if (o.open) { O(ctx, s, hex(), '#2a1a10'); O(ctx, s, hex(0.84), '#d8cde0', fillR('#b8acc4', s * 0.05, -s, s, s)); ctx.save(); ctx.translate(s * 0.36, s * 0.02); ctx.rotate(10 * D); O(ctx, s, hex(), col, fillR('#5a3218', s * 0.06, -s, s, s)); ctx.restore(); }
    else { O(ctx, s, hex(), col, fillR('#5a3218', s * 0.06, -s, s, s)); ctx.strokeStyle = sh(col, -0.35); ctx.lineWidth = LW(s) * 0.7; ctx.beginPath(); hex(0.78)(ctx); ctx.stroke(); }
    if (o.flowers && !o.lying) for (const [x, y] of [[-0.08, -0.06], [0.06, -0.08], [0, -0.13]]) O(ctx, s, (k) => k.arc(s * x, s * y, s * 0.045, 0, TAU), '#e86f8a', (k) => { k.fillStyle = '#f2c230'; k.beginPath(); k.arc(s * x, s * y, s * 0.015, 0, TAU); k.fill(); });
  }
  function swaddle(ctx, s, lt, o) {
    const col = o.color ?? '#cfe2f2';
    O(ctx, s, (k) => T.rrect(k, -s * 0.24, -s * 0.2, s * 0.48, s * 0.66, s * 0.22), col, fillR(sh(col), s * 0.06, -s, s, s * 2));
    O(ctx, s, (k) => k.arc(0, -s * 0.24, s * 0.22, 0, TAU), P.skin, fillR(P.skinShade, s * 0.1, -s, s, s));
    ctx.strokeStyle = P.ink; ctx.lineWidth = Math.max(2, s * 0.025); ctx.lineCap = 'round';
    for (const d of [-1, 1]) { ctx.beginPath(); ctx.arc(d * s * 0.08, -s * 0.26, s * 0.035, 0.2, PI - 0.2); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(0, -s * 0.15, s * 0.03, 0, TAU); ctx.stroke();
    O(ctx, s, (k) => { k.moveTo(-s * 0.24, -s * 0.06); k.quadraticCurveTo(0, s * 0.06, s * 0.24, -s * 0.06); k.lineTo(s * 0.24, s * 0.1); k.quadraticCurveTo(0, s * 0.2, -s * 0.24, s * 0.1); k.closePath(); }, sh(col, 0.25));
  }
  function crib(ctx, s, lt, o) {
    const wood = o.color ?? '#c99a5a', n = o.babies ?? 0;
    O(ctx, s, (k) => k.rect(-s * 0.45, -s * 0.42, s * 0.9, s * 0.08), '#f2efe9');
    for (let i = 0; i < n; i++) { ctx.save(); ctx.translate(((i - (n - 1) / 2) * s * 0.7) / Math.max(1, n), -s * 0.5); ctx.rotate((i % 2 ? 8 : -8) * D); swaddle(ctx, s * 0.3, lt, o); ctx.restore(); }
    for (let i = 1; i <= 9; i++) { const x = -s * 0.45 + (i * s * 0.9) / 10; stick(ctx, s, [[x, -s * 0.66], [x, -s * 0.2]], s * 0.018, wood, 'butt'); }
    for (const y of [-0.7, -0.22]) O(ctx, s, (k) => T.rrect(k, -s * 0.47, s * y, s * 0.94, s * 0.05, s * 0.02), wood, fillR(sh(wood), -s, s * y + s * 0.03, s * 2, s));
    for (const d of [-1, 1]) { O(ctx, s, (k) => T.rrect(k, d * s * 0.49 - s * 0.03, -s * 0.76, s * 0.06, s * 0.76, s * 0.02), wood, fillR(sh(wood), d * s * 0.49, -s, s, s)); O(ctx, s, (k) => k.arc(d * s * 0.49, -s * 0.78, s * 0.04, 0, TAU), wood); }
  }
  function dinnerTable(ctx, s, lt, o) {
    const wood = o.color ?? '#8a5a3a', cloth = o.cloth ?? '#f2efe9';
    for (const d of [-1, 1]) O(ctx, s, (k) => k.rect(d * s * 0.42 - s * 0.03, -s * 0.2, s * 0.06, s * 0.2), wood);
    O(ctx, s, (k) => { k.moveTo(-s * 0.36, -s * 0.6); k.lineTo(s * 0.36, -s * 0.6); k.lineTo(s * 0.5, -s * 0.42); k.lineTo(s * 0.5, -s * 0.2); for (let i = 6; i > 0; i--) { const x = -s * 0.5 + (s * i) / 6; k.quadraticCurveTo(x - s / 12, -s * 0.15, x - s / 6, -s * 0.2); } k.lineTo(-s * 0.5, -s * 0.42); k.closePath(); }, cloth, fillR(sh(cloth), -s, -s * 0.42, s * 2, s));
    for (const [x, y, r] of [[-0.3, -0.555, 0.06], [0, -0.565, 0.06], [0.3, -0.555, 0.06], [-0.34, -0.46, 0.08], [0.34, -0.46, 0.08], [0, -0.45, 0.08]]) { O(ctx, s, (k) => ell(k, s * x, s * y, s * r, s * r * 0.32), '#ffffff', fillR('#dcd6cc', -s, s * y + s * r * 0.1, s * 2, s)); }
    for (const x of [-0.18, 0.2]) O(ctx, s, (k) => { k.moveTo(s * (x - 0.025), -s * 0.6); k.lineTo(s * (x + 0.025), -s * 0.6); k.lineTo(s * (x + 0.018), -s * 0.52); k.lineTo(s * (x - 0.018), -s * 0.52); k.closePath(); }, '#dfeef2');
    O(ctx, s, (k) => ell(k, 0, -s * 0.5, s * 0.15, s * 0.045), '#e8e4da');
    O(ctx, s, (k) => ell(k, 0, -s * 0.535, s * 0.1, s * 0.055), '#a0602a', (k) => { k.fillStyle = sh('#a0602a'); k.fillRect(-s, -s * 0.52, s * 2, s); k.fillStyle = '#d8975a'; k.beginPath(); ell(k, -s * 0.03, -s * 0.56, s * 0.04, s * 0.015); k.fill(); });
    for (const d of [-1, 1]) stick(ctx, s, [[d * s * 0.09, -s * 0.54], [d * s * 0.14, -s * 0.57]], s * 0.012, '#f2efe9');
  }
  function armchair(ctx, s, lt, o) {
    const col = o.color ?? '#7a2030';
    for (const d of [-1, 1]) O(ctx, s, (k) => k.rect(d * s * 0.3 - s * 0.03, -s * 0.1, s * 0.06, s * 0.1), '#4a2a18');
    O(ctx, s, (k) => { k.moveTo(-s * 0.3, -s * 0.36); k.lineTo(-s * 0.36, -s * 0.8); k.quadraticCurveTo(-s * 0.4, -s * 1.0, -s * 0.2, -s * 0.98); k.quadraticCurveTo(0, -s * 1.06, s * 0.2, -s * 0.98); k.quadraticCurveTo(s * 0.4, -s * 1.0, s * 0.36, -s * 0.8); k.lineTo(s * 0.3, -s * 0.36); k.closePath(); }, col, fillR(sh(col), s * 0.12, -s * 1.1, s, s));
    if (o.view !== 'back') {
      ctx.fillStyle = sh(col, -0.4); for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc((i % 3 - 1) * s * 0.12, -s * (0.84 - Math.floor(i / 3) * 0.16), s * 0.012, 0, TAU); ctx.fill(); }
      O(ctx, s, (k) => T.rrect(k, -s * 0.3, -s * 0.42, s * 0.6, s * 0.14, s * 0.05), sh(col, 0.08));
      for (const d of [-1, 1]) O(ctx, s, (k) => T.rrect(k, d * s * 0.38 - s * 0.09, -s * 0.62, s * 0.18, s * 0.52, s * 0.08), col, fillR(sh(col), d * s * 0.38 + s * 0.02, -s, s, s));
    }
    O(ctx, s, (k) => T.rrect(k, -s * 0.44, -s * 0.3, s * 0.88, s * 0.2, s * 0.05), sh(col, -0.08));
  }

  // ---------- cage, door, gate, portcullis ----------
  function cage(ctx, s, lt, o) {
    const col = o.color ?? '#2a2a24', rx = s * 0.36, ry = s * 0.07, top = -s * 0.66, bw = Math.max(4, s * 0.015), dr = evt(o.drop);
    if (dr) { const f = F(lt - (dr.at ?? 0)); if (f < 0) return; if (f < 5) ctx.translate(0, -(1 - T.ease.in(f / 5)) * 1300); else if (f < 8) { const q = 0.03 * Math.sin(((f - 5) / 3) * PI); ctx.scale(1 + q, 1 - q); } }
    const bar = (a, c, w) => { const x = Math.cos(a) * rx, y = Math.sin(a) * ry; ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, top + y); ctx.quadraticCurveTo(x, -s * 0.94, 0, -s * 0.94); ctx.stroke(); };
    ctx.lineCap = 'round';
    const angs = [...Array(9)].map((_, i) => (i / 9) * TAU + 0.17);
    ctx.save(); ctx.globalAlpha *= 0.5; for (const a of angs) if (Math.sin(a) < 0) bar(a, '#1a1a16', bw); ctx.restore();
    for (const [y, w] of [[0, ry], [top, ry]]) { ctx.lineWidth = bw * 2 + LW(s); ctx.strokeStyle = P.ink; ctx.beginPath(); ell(ctx, 0, y, rx, w); ctx.stroke(); ctx.lineWidth = bw * 2; ctx.strokeStyle = col; ctx.stroke(); }
    for (const a of angs) if (Math.sin(a) >= 0) { bar(a, P.ink, bw + LW(s)); bar(a, col, bw); ctx.save(); ctx.translate(-bw * 0.25, 0); bar(a, '#6a6a60', Math.max(1.5, bw * 0.3)); ctx.restore(); }
    O(ctx, s, (k) => k.arc(0, -s * 0.95, s * 0.035, 0, TAU), col);
    ctx.lineWidth = bw; ctx.strokeStyle = col; ctx.beginPath(); ctx.arc(0, -s * 1.02, s * 0.04, PI * 0.6, PI * 2.4); ctx.stroke();
    if (o.lock) padlock(ctx, s, rx * 0.4, -s * 0.12, s * 0.05);
  }
  function behind(ctx, s, o, lt, x, y, w, h, open) {
    const b = o.behind ?? 'dark';
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    if (b === 'fire') {
      ctx.fillStyle = '#ff8a1a'; ctx.fillRect(x, y, w, h);
      for (let i = 0; i < 3; i++) { ctx.save(); ctx.translate(x + w * (0.2 + i * 0.3), y + h); T.drawFlame(ctx, h * (0.7 + (i % 2) * 0.25), lt + i * 0.13, (o.id || 'door') + i); ctx.restore(); }
    } else if (typeof b === 'string' && b.startsWith('#')) { ctx.fillStyle = b; ctx.fillRect(x, y, w, h); }
    else if (b !== 'dark' && ENV) { const c = T.subShot(b, o.screenTime ?? lt, ENV), k = Math.max(w / T.W, h / T.H); ctx.drawImage(c, x + w / 2 - (T.W * k) / 2, y + h / 2 - (T.H * k) / 2, T.W * k, T.H * k); }
    else { ctx.fillStyle = '#15110c'; ctx.fillRect(x, y, w, h); }
    ctx.restore();
    if (b === 'fire' && open > 0) { ctx.save(); ctx.globalAlpha *= 0.4 * open; ctx.fillStyle = '#ffb030'; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + w, 0); ctx.lineTo(x + w * 1.6, s * 0.3); ctx.lineTo(x + w * 0.4, s * 0.3); ctx.closePath(); ctx.fill(); ctx.restore(); }
  }
  function door(ctx, s, lt, o) {
    const col = o.color ?? '#8a5a3a', fw = s * 0.58, w = s * 0.5, h = s * 0.96;
    O(ctx, s, (k) => k.rect(-fw / 2, -s, fw, s), o.frame ?? '#5a3a22');
    const op = evt(o.open), p = op ? T.ease.out(T.prog(lt, op.at ?? 0, op.dur ?? 0.4)) : 0, ang = p * 80 * D;
    if (p > 0) behind(ctx, s, o, lt, -w / 2, -h, w, h, p);
    const sl = evt(o.slam), f = sl ? F(lt - (sl.at ?? 0)) : -1;
    const bow = f < 0 || f >= 7 ? 0 : f < 3 ? f / 3 : f < 5 ? 1 : 1 - (f - 5) / 2, b = bow * w * 0.06;
    const lw = w * Math.cos(ang), x0 = -w / 2;
    if (b > 0) { ctx.fillStyle = '#15110c'; ctx.fillRect(x0, -h, b * 1.2, h); }
    O(ctx, s, (k) => { k.moveTo(x0, -h); k.lineTo(x0 + lw, -h); k.lineTo(x0 + lw, 0); k.lineTo(x0, 0); k.quadraticCurveTo(x0 + b * 2, -h / 2, x0, -h); k.closePath(); }, col, (k) => {
      k.fillStyle = sh(col); k.fillRect(x0 + lw * 0.62, -h, lw, h);
      k.strokeStyle = sh(col, -0.4); k.lineWidth = LW(s) * 0.6; for (const t of [1 / 3, 2 / 3]) { k.beginPath(); k.moveTo(x0 + lw * t, -h); k.lineTo(x0 + lw * t, 0); k.stroke(); }
    });
    if (lw > w * 0.15) { O(ctx, s, (k) => k.arc(x0 + lw * 0.84, -h * 0.48, s * 0.022, 0, TAU), '#e2b23c'); if (o.knocker) { ctx.lineWidth = s * 0.012; ctx.strokeStyle = '#b0862a'; ctx.beginPath(); ctx.arc(x0 + lw / 2, -h * 0.62, s * 0.04, 0, TAU); ctx.stroke(); } }
    if (f >= 3 && f < 5) for (const d of [-1, 1]) ticks(ctx, s, d * fw * 0.55, -h * 0.5, 3, s * 0.02, s * 0.1, '#f5d33a', d < 0 ? PI - 0.5 : -0.5, 1.0);
  }
  function stoneArch(ctx, s, ow, oh, wallW) {
    const r = ow / 2;
    O(ctx, s, (k) => { k.rect(-wallW / 2, -oh - r * 0.6, wallW, oh + r * 0.6); }, '#8a8478', (k) => {
      k.strokeStyle = sh('#8a8478', -0.3); k.lineWidth = LW(s) * 0.5;
      for (let y = 0; y > -oh - r; y -= s * 0.1) { k.beginPath(); k.moveTo(-wallW / 2, y); k.lineTo(wallW / 2, y); k.stroke(); const off = (Math.round(-y / (s * 0.1)) % 2) * s * 0.09; for (let x = -wallW / 2 + off; x < wallW / 2; x += s * 0.18) { k.beginPath(); k.moveTo(x, y); k.lineTo(x, y - s * 0.1); k.stroke(); } }
    });
  }
  const archPath = (ow, oh) => (k) => { const r = ow / 2; k.moveTo(-r, 0); k.lineTo(-r, -oh + r); k.arc(0, -oh + r, r, PI, 0); k.lineTo(r, 0); k.closePath(); };
  function gate(ctx, s, lt, o) {
    const ow = s, oh = s * 0.8, col = o.color ?? '#5a5040';
    stoneArch(ctx, s, ow, oh, s * 1.4);
    const cl = evt(o.close), op = evt(o.open);
    let ang = 0;
    if (cl) ang = (1 - T.ease.in(T.prog(lt, cl.at ?? 0, cl.dur ?? 0.33))) * 85 * D;
    if (op) ang = T.ease.out(T.prog(lt, op.at ?? 0, op.dur ?? 0.6)) * 85 * D;
    ctx.save(); ctx.beginPath(); archPath(ow, oh)(ctx); ctx.clip();
    behind(ctx, s, o, lt, -ow / 2, -oh, ow, oh, Math.sin(ang));
    for (const d of [-1, 1]) {
      const lw = (ow / 2) * Math.cos(ang), x0 = d * ow / 2, x1 = x0 - d * lw;
      O(ctx, s, (k) => k.rect(Math.min(x0, x1), -oh - 4, Math.abs(lw), oh + 8), col, (k) => {
        k.strokeStyle = sh(col, -0.35); k.lineWidth = LW(s) * 0.6; for (let i = 1; i < 4; i++) { const x = T.lerp(x0, x1, i / 4); k.beginPath(); k.moveTo(x, -oh); k.lineTo(x, 0); k.stroke(); }
        k.fillStyle = '#3a3a3e'; for (const y of [-oh * 0.75, -oh * 0.25]) k.fillRect(Math.min(x0, x1), y, Math.abs(lw), s * 0.035);
      });
      if (lw > ow * 0.12) { ctx.lineWidth = s * 0.012; ctx.strokeStyle = P.ink; ctx.beginPath(); ctx.arc(x1 + d * lw * 0.15, -oh * 0.45, s * 0.03, 0, TAU); ctx.stroke(); }
    }
    ctx.restore();
    ctx.lineWidth = LW(s) * 1.4; ctx.strokeStyle = P.ink; ctx.beginPath(); archPath(ow, oh)(ctx); ctx.stroke();
    if (cl) { const f = F(lt - (cl.at ?? 0) - (cl.dur ?? 0.33)); if (f >= 0 && f < 7) { ctx.save(); ctx.globalAlpha *= 0.85; T.starburst(ctx, 0, -oh * 0.45, s * 0.07, s * 0.2, 12, (o.id || 'gate') + 'st', '#e8e6a8', P.ink, LW(s)); ctx.restore(); ticks(ctx, s, 0, -oh * 0.45, 5, s * 0.24, s * 0.34, '#f2efe0'); if (T.drawCloud && f < 6) { ctx.save(); ctx.globalAlpha *= 0.8 * (1 - f / 6); for (const d of [-1, 1]) T.drawCloud(ctx, d * s * 0.12, -s * 0.03, s * 0.22, s * 0.08, (o.id || 'gate') + 'dust' + d, { color: '#d8cfc0', line: LW(s) * 0.4, boil: lt }); ctx.restore(); } } }
  }
  function portcullis(ctx, s, lt, o) {
    const ow = s, oh = s * 0.9, cl = evt(o.drop) || { at: 0, dur: o.dur ?? 0.85 }, dur = cl.dur ?? 0.85;
    stoneArch(ctx, s, ow, oh, s * 1.36);
    ctx.save(); ctx.beginPath(); (o.arch === false ? (k) => k.rect(-ow / 2, -oh, ow, oh) : archPath(ow, oh))(ctx); ctx.clip();
    behind(ctx, s, o, lt, -ow / 2, -oh, ow, oh, 0);
    const t = lt - (cl.at ?? 0), last = 3 / 30;
    let p = T.ease.in(T.prog(t, 0, dur - last)); if (t > dur - last) p = 1 + 0.02 * Math.sin(T.prog(t, dur - last, last) * PI);
    const bot = -oh + p * oh, n = o.bars ?? 7;
    for (let i = 0; i < n; i++) { const x = -ow / 2 + ((i + 0.5) * ow) / n; stick(ctx, s, [[x, -oh - 10], [x, bot]], s * 0.03, '#5a5a5a', 'butt'); ctx.strokeStyle = '#c8c8c8'; ctx.lineWidth = s * 0.012; ctx.beginPath(); ctx.moveTo(x - s * 0.008, -oh); ctx.lineTo(x - s * 0.008, bot); ctx.stroke(); O(ctx, s, (k) => { k.moveTo(x - s * 0.018, bot); k.lineTo(x + s * 0.018, bot); k.lineTo(x, bot + s * 0.05); k.closePath(); }, '#c8c8c8'); }
    for (let j = 1; j <= 3; j++) { const y = bot - (j * oh) / 3.4; stick(ctx, s, [[-ow / 2, y], [ow / 2, y]], s * 0.025, '#7a7a7a', 'butt'); }
    ctx.restore();
    ctx.lineWidth = LW(s) * 1.4; ctx.strokeStyle = P.ink; ctx.beginPath(); archPath(ow, oh)(ctx); ctx.stroke();
  }

  // ---------- handheld gag props (features 46, 95), drawn centred ----------
  const H = {
    sack(ctx, s, lt, o) {
      const col = o.color ?? '#c9a06a';
      O(ctx, s, (k) => { k.moveTo(-s * 0.1, -s * 0.28); k.bezierCurveTo(-s * 0.46, -s * 0.1, -s * 0.46, s * 0.46, 0, s * 0.46); k.bezierCurveTo(s * 0.46, s * 0.46, s * 0.46, -s * 0.1, s * 0.1, -s * 0.28); k.closePath(); }, col, fillR(sh(col), s * 0.12, -s, s, s * 2));
      O(ctx, s, (k) => { k.moveTo(-s * 0.1, -s * 0.28); k.lineTo(-s * 0.2, -s * 0.48); k.quadraticCurveTo(0, -s * 0.42, s * 0.2, -s * 0.5); k.lineTo(s * 0.1, -s * 0.28); k.closePath(); }, col);
      stick(ctx, s, [[-s * 0.13, -s * 0.28], [s * 0.13, -s * 0.28]], s * 0.035, '#8a6a3a');
      for (const [x, y] of [[-0.24, 0.24], [0.18, 0.02]]) { O(ctx, s, (k) => k.rect(s * x, s * y, s * 0.1, s * 0.08), sh(col, 0.15)); }
      if (o.dollar) words(ctx, '$', 0, s * 0.14, s * 0.5, s * 0.3, '#3a8a3a', { stroke: s * 0.02 });
      else words(ctx, o.text, 0, s * 0.14, s * 0.56, s * 0.16, o.textColor ?? '#3a2414', { maxH: s * 0.3 });
    },
    bottle(ctx, s, lt, o) {
      const p = T.pourAmount(o.pour, lt), a = p * 110 * D, col = o.color ?? '#5a3a22';
      if (p > 0.6) { const mx = Math.sin(a) * s * 0.5, my = -Math.cos(a) * s * 0.5; ctx.strokeStyle = o.liquid ?? '#d9b84a'; ctx.lineWidth = s * 0.05; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(mx, my); ctx.quadraticCurveTo(mx + s * 0.08, my + s * 0.4, mx + s * 0.06 + Math.sin(lt * 30) * 2, my + s * 0.9); ctx.stroke(); }
      ctx.rotate(a);
      O(ctx, s, (k) => { k.moveTo(-s * 0.06, -s * 0.42); k.lineTo(-s * 0.06, -s * 0.22); k.quadraticCurveTo(-s * 0.18, -s * 0.16, -s * 0.18, -s * 0.04); k.lineTo(-s * 0.18, s * 0.46); k.quadraticCurveTo(0, s * 0.52, s * 0.18, s * 0.46); k.lineTo(s * 0.18, -s * 0.04); k.quadraticCurveTo(s * 0.18, -s * 0.16, s * 0.06, -s * 0.22); k.lineTo(s * 0.06, -s * 0.42); k.closePath(); }, col, fillR(sh(col), s * 0.07, -s, s, s * 2));
      O(ctx, s, (k) => T.rrect(k, -s * 0.05, -s * 0.5, s * 0.1, s * 0.1, s * 0.02), '#c9a06a');
      O(ctx, s, (k) => k.rect(-s * 0.16, s * 0.04, s * 0.32, s * 0.24), o.label ?? '#efe6cf');
      words(ctx, o.text, 0, s * 0.16, s * 0.26, s * 0.09, o.textColor ?? '#c0202a', { maxH: s * 0.2 });
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = s * 0.025; ctx.beginPath(); ctx.moveTo(-s * 0.11, -s * 0.06); ctx.lineTo(-s * 0.11, s * 0.0); ctx.moveTo(-s * 0.11, s * 0.32); ctx.lineTo(-s * 0.11, s * 0.4); ctx.stroke();
    },
    candle(ctx, s, lt, o) {
      const fl = 1 + (T.rng(T.hash((o.id || 'candle') + two(lt)))() - 0.5) * 0.12;
      const g = ctx.createRadialGradient(0, -s * 0.36, 0, 0, -s * 0.36, s * 0.45); g.addColorStop(0, 'rgba(255,215,106,0.35)'); g.addColorStop(1, 'rgba(255,215,106,0)');
      ctx.fillStyle = g; ctx.fillRect(-s * 0.5, -s * 0.8, s, s * 0.9);
      O(ctx, s, (k) => ell(k, 0, s * 0.42, s * 0.3, s * 0.07), '#c9a040', fillR('#a07c20', -s, s * 0.44, s * 2, s));
      O(ctx, s, (k) => { k.moveTo(-s * 0.11, -s * 0.22); k.lineTo(s * 0.11, -s * 0.22); k.lineTo(s * 0.11, s * 0.4); k.lineTo(-s * 0.11, s * 0.4); k.closePath(); }, o.color ?? '#efe6cf', fillR('#d6ccb2', s * 0.04, -s, s, s * 2));
      for (const [x, l] of [[-0.06, 0.12], [0.07, 0.2]]) O(ctx, s, (k) => T.rrect(k, s * x - s * 0.025, -s * 0.24, s * 0.05, s * l, s * 0.025), o.color ?? '#efe6cf');
      stick(ctx, s, [[0, -s * 0.22], [0, -s * 0.27]], s * 0.012, P.ink);
      ctx.save(); ctx.translate(0, -s * 0.26); ctx.scale(fl, fl);
      T.outlined(ctx, (k) => { k.moveTo(0, 0); k.bezierCurveTo(-s * 0.1, -s * 0.04, -s * 0.04, -s * 0.16, 0, -s * 0.24); k.bezierCurveTo(s * 0.04, -s * 0.16, s * 0.1, -s * 0.04, 0, 0); }, '#ffd23a', { line: Math.max(2, s * 0.01), shade: (k) => { k.fillStyle = '#ff9a1a'; k.beginPath(); ell(k, 0, -s * 0.04, s * 0.03, s * 0.05); k.fill(); } });
      ctx.restore();
    },
    key(ctx, s, lt, o) {
      const col = o.color ?? '#e8c040';
      if (o.hook) { // brass wall hook at the anchor; the key's ring hangs on the peg (swing pivots here)
        O(ctx, s, (k) => T.rrect(k, -s * 0.06, -s * 0.1, s * 0.12, s * 0.12, s * 0.03), '#8a5a3a', fillR('#6e4620', s * 0.02, -s, s, s));
        ctx.translate(0, s * 0.43);
        stick(ctx, s, [[0, -s * 0.47], [0, -s * 0.4], [s * 0.04, -s * 0.38]], s * 0.03, '#b8902a');
      }
      O(ctx, s, (k) => { for (let i = 0; i < 3; i++) { const a = -PI / 2 + (i - 1) * 1.2; k.moveTo(Math.cos(a) * s * 0.11 + s * 0.08, -s * 0.33 + Math.sin(a) * s * 0.11); k.arc(Math.cos(a) * s * 0.11, -s * 0.33 + Math.sin(a) * s * 0.11, s * 0.08, 0, TAU); } k.moveTo(s * 0.12, -s * 0.3); k.arc(0, -s * 0.3, s * 0.12, 0, TAU); }, col, fillR(sh(col), s * 0.04, -s, s, s));
      ctx.fillStyle = P.ink; ctx.beginPath(); ctx.arc(0, -s * 0.31, s * 0.045, 0, TAU); ctx.fill();
      O(ctx, s, (k) => { k.rect(-s * 0.035, -s * 0.18, s * 0.07, s * 0.66); k.rect(-s * 0.065, -s * 0.16, s * 0.13, s * 0.05); }, col, fillR(sh(col), s * 0.01, -s, s, s * 2));
      O(ctx, s, (k) => { k.moveTo(s * 0.035, s * 0.3); k.lineTo(s * 0.17, s * 0.3); k.lineTo(s * 0.17, s * 0.36); k.lineTo(s * 0.12, s * 0.36); k.lineTo(s * 0.12, s * 0.4); k.lineTo(s * 0.17, s * 0.4); k.lineTo(s * 0.17, s * 0.48); k.lineTo(s * 0.035, s * 0.48); k.closePath(); }, col);
    },
    broom(ctx, s, lt, o) {
      const sw = evt(o.sweep);
      if (sw && lt >= (sw.at ?? 0) && lt <= (sw.at ?? 0) + (sw.dur ?? 1.2)) {
        const f = F(lt - (sw.at ?? 0)); ctx.translate(0, -s * 0.5); ctx.rotate(Math.sin((f / 6) * PI) * 20 * D); ctx.translate(0, s * 0.5);
        if (T.drawCloud) { ctx.save(); ctx.globalAlpha *= 0.7; T.drawCloud(ctx, s * 0.2 * Math.sign(Math.cos((f / 6) * PI)), s * 0.5, s * 0.3, s * 0.12, (o.id || 'broom') + Math.floor(f / 6), { color: '#d8c8a8', line: 2, boil: lt }); ctx.restore(); }
      }
      stick(ctx, s, [[0, -s * 0.5], [0, s * 0.12]], s * 0.04, o.color ?? '#8a5a2a');
      O(ctx, s, (k) => { k.moveTo(-s * 0.07, s * 0.1); k.lineTo(s * 0.07, s * 0.1); k.lineTo(s * 0.19, s * 0.5); k.lineTo(-s * 0.19, s * 0.5); k.closePath(); }, '#c99a5a', (k) => { k.strokeStyle = '#9a6a3a'; k.lineWidth = Math.max(1.5, s * 0.008); for (let i = -2; i <= 2; i++) { k.beginPath(); k.moveTo(i * s * 0.025, s * 0.18); k.lineTo(i * s * 0.07, s * 0.5); k.stroke(); } });
      O(ctx, s, (k) => k.rect(-s * 0.08, s * 0.14, s * 0.16, s * 0.04), '#c0392b');
    },
    magnet(ctx, s, lt, o) {
      const col = o.color ?? '#c8202a', at = evt(o.attract);
      if (at && lt >= (at.at ?? 0)) {
        const [tx, ty] = at.target ?? [0, s * 1.4], r = T.rng(T.hash((o.id || 'magnet') + ':bolt' + two(lt)));
        for (const px of [-s * 0.23, s * 0.23]) { ctx.strokeStyle = '#ffe14a'; ctx.lineWidth = Math.max(3, s * 0.02); ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(px, s * 0.45); for (let i = 1; i <= 5; i++) ctx.lineTo(T.lerp(px, tx, i / 5) + (i < 5 ? (r() - 0.5) * s * 0.18 : 0), T.lerp(s * 0.45, ty, i / 5)); ctx.stroke(); }
        ctx.strokeStyle = 'rgba(255,225,74,0.7)'; ctx.lineWidth = Math.max(2, s * 0.012);
        for (let i = 0; i < 3; i++) { const rr = s * (0.3 + i * 0.14 + ((lt * 1.5) % 1) * 0.14); ctx.beginPath(); ctx.arc(0, s * 0.45, rr, 0.35 * PI, 0.65 * PI); ctx.stroke(); }
      }
      const glow = 0.25 + 0.2 * Math.sin(lt * TAU);
      for (const px of [-s * 0.23, s * 0.23]) { const g = ctx.createRadialGradient(px, s * 0.45, 0, px, s * 0.45, s * 0.2); g.addColorStop(0, `rgba(255,240,150,${glow})`); g.addColorStop(1, 'rgba(255,240,150,0)'); ctx.fillStyle = g; ctx.fillRect(px - s * 0.2, s * 0.25, s * 0.4, s * 0.4); }
      O(ctx, s, (k) => { k.moveTo(-s * 0.32, s * 0.45); k.lineTo(-s * 0.32, -s * 0.13); k.arc(0, -s * 0.13, s * 0.32, PI, 0); k.lineTo(s * 0.32, s * 0.45); k.lineTo(s * 0.14, s * 0.45); k.lineTo(s * 0.14, -s * 0.13); k.arc(0, -s * 0.13, s * 0.14, 0, PI, true); k.lineTo(-s * 0.14, s * 0.45); k.closePath(); }, col, fillR(sh(col), s * 0.14, -s, s, s * 2));
      for (const d of [-1, 1]) O(ctx, s, (k) => k.rect(d * s * 0.23 - s * 0.09, s * 0.27, s * 0.18, s * 0.18), '#d8dce0', fillR('#a8acb0', d * s * 0.23 + s * 0.02, 0, s, s));
    },
    phone(ctx, s, lt, o) {
      const style = o.style ?? 'brick';
      for (const t of [].concat(o.ring ?? [])) { const d = lt - t; if (d >= 0 && d < 0.5) { ctx.translate((two(lt) % 2 ? 1 : -1) * 1.5, 0); for (const sd of [-1, 1]) ticks(ctx, s, 0, -s * 0.2, 3, s * 0.36, s * 0.5, '#f5d33a', sd < 0 ? PI - 0.6 : -0.6, 1.2); } }
      if (style === 'smart') { O(ctx, s, (k) => T.rrect(k, -s * 0.25, -s * 0.5, s * 0.5, s, s * 0.07), '#1d1d22'); screen(ctx, s, o, lt, -s * 0.22, -s * 0.44, s * 0.44, s * 0.86, s * 0.04); return; }
      if (style === 'rotary') {
        O(ctx, s, (k) => { k.moveTo(-s * 0.42, s * 0.3); k.quadraticCurveTo(-s * 0.4, -s * 0.12, 0, -s * 0.14); k.quadraticCurveTo(s * 0.4, -s * 0.12, s * 0.42, s * 0.3); k.closePath(); }, o.color ?? '#c0392b', fillR(sh(o.color ?? '#c0392b'), s * 0.14, -s, s, s * 2));
        O(ctx, s, (k) => ell(k, 0, s * 0.08, s * 0.17, s * 0.13), '#f2efe9');
        ctx.fillStyle = P.ink; for (let i = 0; i < 8; i++) { const a = -PI * 0.2 + i * 0.6; ctx.beginPath(); ctx.arc(Math.cos(a) * s * 0.11, s * 0.08 + Math.sin(a) * s * 0.085, s * 0.018, 0, TAU); ctx.fill(); }
        O(ctx, s, (k) => { k.moveTo(-s * 0.48, -s * 0.2); k.quadraticCurveTo(0, -s * 0.44, s * 0.48, -s * 0.2); k.lineTo(s * 0.38, -s * 0.12); k.quadraticCurveTo(0, -s * 0.3, -s * 0.38, -s * 0.12); k.closePath(); }, o.color ?? '#c0392b');
        return;
      }
      const flip = style === 'flip', col = o.color ?? (flip ? '#9aa0aa' : '#7a7a80');
      if (!flip) stick(ctx, s, [[s * 0.08, -s * 0.3], [s * 0.08, -s * 0.5]], s * 0.035, '#3a3a3e');
      O(ctx, s, (k) => T.rrect(k, -s * 0.15, flip ? 0 : -s * 0.32, s * 0.3, flip ? s * 0.48 : s * 0.8, s * 0.05), col, fillR(sh(col), s * 0.06, -s, s, s * 2));
      if (flip) O(ctx, s, (k) => T.rrect(k, -s * 0.15, -s * 0.46, s * 0.3, s * 0.44, s * 0.05), col);
      O(ctx, s, (k) => k.rect(-s * 0.1, flip ? -s * 0.4 : -s * 0.24, s * 0.2, s * (flip ? 0.26 : 0.16)), '#a8d8a0');
      ctx.fillStyle = sh(col, -0.45); for (let i = 0; i < 12; i++) { ctx.beginPath(); T.rrect(ctx, -s * 0.09 + (i % 3) * s * 0.065, (flip ? s * 0.08 : -s * 0.02) + Math.floor(i / 3) * s * 0.08, s * 0.05, s * 0.05, s * 0.01); ctx.fill(); }
    },
    megaphone(ctx, s, lt, o) {
      const col = o.color ?? '#b08a3a', on = o.on === true || inWin(o.on, lt);
      O(ctx, s, (k) => k.rect(-s * 0.5, -s * 0.05, s * 0.2, s * 0.1), '#3a3d42');
      O(ctx, s, (k) => T.rrect(k, -s * 0.22, s * 0.04, s * 0.07, s * 0.24, s * 0.03), '#3a3d42');
      O(ctx, s, (k) => { k.moveTo(-s * 0.32, -s * 0.07); k.lineTo(s * 0.3, -s * 0.18); k.lineTo(s * 0.3, s * 0.18); k.lineTo(-s * 0.32, s * 0.07); k.closePath(); }, col, fillR(sh(col), -s, s * 0.03, s * 2, s));
      O(ctx, s, (k) => ell(k, s * 0.3, 0, s * 0.05, s * 0.18), sh(col, -0.45));
      if (on) { const k = two(lt) % 2 ? 1.12 : 1; ticks(ctx, s, s * 0.3, 0, 3, s * 0.24 * k, s * 0.36 * k, '#f5d33a', -0.7, 1.4); }
    },
    magnifier(ctx, s, lt, o) {
      const r = s * 0.3, rv = evt(o.reveal), env = ENV;
      ctx.save(); ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.clip();
      const m = ctx.getTransform(), z = (rv && rv.scale) ?? o.zoom ?? 1.4, a = rv ? T.clamp(F(lt - (rv.at ?? 0)) / 6) : 1;
      if (rv && rv.layers && env && a > 0) {
        ctx.globalAlpha *= a; ctx.setTransform(env.dpr * z, 0, 0, env.dpr * z, m.e * (1 - z), m.f * (1 - z));
        for (const L of rv.layers) T.drawLayer(ctx, T.effLayer(L, env.lt), env.lt, env, env.cam);
      } else if (!rv) { const snap = T.snapshot(ctx, 'magnifier'); ctx.setTransform(z, 0, 0, z, m.e * (1 - z), m.f * (1 - z)); ctx.drawImage(snap, 0, 0); }
      ctx.restore();
      ctx.save(); ctx.globalAlpha *= 0.12; ctx.fillStyle = '#cfe8f2'; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill(); ctx.restore();
      ctx.save(); ctx.rotate(PI / 4); O(ctx, s, (k) => T.rrect(k, -s * 0.045, r + s * 0.02, s * 0.09, s * 0.5, s * 0.04), '#5a3a26'); ctx.restore();
      ctx.lineWidth = s * 0.035 + LW(s) * 2; ctx.strokeStyle = P.ink; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
      ctx.lineWidth = s * 0.035; ctx.strokeStyle = '#8a6440'; ctx.stroke();
      ctx.lineWidth = 2; ctx.strokeStyle = '#e0e0e0'; ctx.beginPath(); ctx.arc(0, 0, r - s * 0.022, 0, TAU); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = s * 0.03; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, 0, r * 0.75, PI * 1.1, PI * 1.4); ctx.stroke();
    },
    scissors(ctx, s, lt, o) {
      let a = 30 * D;
      for (const t of [].concat(o.snip ?? []).map((v) => (typeof v === 'number' ? v : v.at ?? 0))) { const f = F(lt - t); if (f >= 0 && f < 2) a = Math.min(a, (1 - f / 2) * 30 * D); else if (f >= 2 && f < 6) a = Math.min(a, ((f - 2) / 4) * 30 * D); }
      for (const d of [-1, 1]) {
        ctx.save(); ctx.rotate((d * a) / 2);
        O(ctx, s, (k) => { k.moveTo(0, -d * s * 0.03); k.lineTo(s * 0.5, 0); k.lineTo(0, d * s * 0.035); k.closePath(); }, '#cfd2d6', fillR('#8e9298', 0, d > 0 ? 0 : -s, s, s));
        ctx.lineWidth = s * 0.05 + LW(s) * 2; ctx.strokeStyle = P.ink; ctx.beginPath(); ell(ctx, -s * 0.3, d * s * 0.09, s * 0.12, s * 0.07, d * 0.3); ctx.moveTo(-s * 0.18, d * s * 0.06); ctx.lineTo(0, 0); ctx.stroke();
        ctx.lineWidth = s * 0.05; ctx.strokeStyle = o.color ?? '#c8202a'; ctx.stroke();
        ctx.restore();
      }
      O(ctx, s, (k) => k.arc(0, 0, s * 0.025, 0, TAU), '#8e9298');
    },
    mallet(ctx, s, lt, o) {
      const g = o.style === 'giant', hw = s * (g ? 0.7 : 0.4), hh = s * (g ? 0.45 : 0.3);
      stick(ctx, s, [[0, s * 0.5], [0, -s * 0.2]], s * (g ? 0.07 : 0.05), '#8a5a2a');
      O(ctx, s, (k) => T.rrect(k, -hw / 2, -s * 0.5, hw, hh, s * 0.03), o.color ?? '#d8b890', fillR('#d29b5a', -hw / 2, -s * 0.5 + hh * 0.65, hw, hh));
      for (const d of [-1, 1]) O(ctx, s, (k) => k.rect(d * hw * 0.32 - s * 0.012, -s * 0.5, s * 0.024, hh), sh(o.color ?? '#d8b890', -0.3));
    },
    dagger(ctx, s, lt, o) {
      O(ctx, s, (k) => { k.moveTo(0, -s * 0.5); k.lineTo(s * 0.08, s * 0.04); k.lineTo(-s * 0.08, s * 0.04); k.closePath(); }, '#c8d6ea', (k) => {
        k.fillStyle = '#a8b6ca'; k.fillRect(0, -s, s, s * 2); k.fillStyle = '#4a7ab0'; k.beginPath(); k.moveTo(0, -s * 0.36); k.lineTo(s * 0.015, 0); k.lineTo(-s * 0.015, 0); k.fill();
        if (o.tip) { k.fillStyle = o.tip === true ? '#a3121a' : o.tip; k.fillRect(-s, -s * 0.6, s * 2, s * 0.14); }
        if (o.reflect && T.BEAN_HEAD) { k.save(); k.globalAlpha = 0.55; k.translate(0, -s * 0.18); const z = (s * 0.1) / 300; k.scale(z, z); k.translate(0, 450); castHead(k, o.reflect, o.reflectExpr ?? 'angry', lt, 'dagger', 'front'); k.restore(); }
      });
      O(ctx, s, (k) => T.rrect(k, -s * 0.18, s * 0.04, s * 0.36, s * 0.06, s * 0.03), '#c9a040');
      O(ctx, s, (k) => T.rrect(k, -s * 0.04, s * 0.1, s * 0.08, s * 0.3, s * 0.03), '#3a2a20');
      O(ctx, s, (k) => k.arc(0, s * 0.44, s * 0.05, 0, TAU), '#c9a040');
    },
    'boxing-glove'(ctx, s, lt, o) {
      const col = o.color ?? '#c8302a';
      O(ctx, s, (k) => T.rrect(k, -s * 0.2, s * 0.18, s * 0.4, s * 0.3, s * 0.06), '#f3ead2', fillR('#d8cfba', s * 0.06, 0, s, s));
      O(ctx, s, (k) => { k.moveTo(-s * 0.22, s * 0.2); k.bezierCurveTo(-s * 0.42, -s * 0.1, -s * 0.3, -s * 0.5, 0, -s * 0.5); k.bezierCurveTo(s * 0.34, -s * 0.5, s * 0.4, -s * 0.06, s * 0.22, s * 0.2); k.closePath(); }, col, fillR(sh(col, -0.25), s * 0.12, -s, s, s * 2));
      O(ctx, s, (k) => ell(k, -s * 0.25, -s * 0.02, s * 0.1, s * 0.17, 0.3), col, fillR(sh(col, -0.25), -s, s * 0.06, s * 2, s));
      if (o.badge) { const cs = o.badge === true ? ['#2a5aa8', '#f2efe9', '#c8302a'] : o.badge; ctx.save(); ctx.beginPath(); ctx.rect(-s * 0.15, -s * 0.36, s * 0.3, s * 0.2); ctx.clip(); cs.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(-s * 0.15 + (i * s * 0.3) / cs.length, -s * 0.36, s * 0.3 / cs.length + 1, s * 0.2); }); ctx.restore(); ctx.lineWidth = LW(s) * 0.7; ctx.strokeStyle = P.ink; ctx.strokeRect(-s * 0.15, -s * 0.36, s * 0.3, s * 0.2); }
      ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = s * 0.03; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, -s * 0.2, s * 0.22, PI * 1.2, PI * 1.45); ctx.stroke();
    },
    chain(ctx, s, lt, o) {
      const w = o.w ?? s, ph = (lt * (o.scroll ?? 0)) / (s * 0.07), L = (s / 300) * 28 * (o.link ?? 1);
      chainLinks(ctx, s, -w / 2, 0, w / 2 - (o.ball ? s * 0.12 : 0), 0, L, o.color ?? '#8a8a92', ph);
      if (o.ball) O(ctx, s, (k) => k.arc(w / 2, 0, s * 0.15, 0, TAU), '#2a2a2e', (k) => { k.fillStyle = 'rgba(255,255,255,0.25)'; k.beginPath(); k.arc(w / 2 - s * 0.05, -s * 0.05, s * 0.04, 0, TAU); k.fill(); });
    },
    binoculars(ctx, s, lt, o) { // 3/4 view: two barrels toward screen right, big objective rims, eyecups, strap
      ctx.translate(T.noise(lt * 4, (o.id || 'bino') + 'x') * 2, T.noise(lt * 4, (o.id || 'bino') + 'y') * 2);
      const body = o.color ?? '#2e2e34', lens = o.eyes ? '#ffffff' : '#8fd0dc';
      ctx.save(); ctx.strokeStyle = P.ink; ctx.lineWidth = s * 0.03; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-s * 0.36, s * 0.04); ctx.bezierCurveTo(-s * 0.4, s * 0.42, s * 0.3, s * 0.42, s * 0.26, s * 0.08); ctx.stroke(); ctx.strokeStyle = '#7a4a2a'; ctx.lineWidth = s * 0.016; ctx.stroke(); ctx.restore();
      for (const [dx, dy, far] of [[s * 0.07, -s * 0.13, true], [0, 0, false]]) {
        ctx.save(); ctx.translate(dx, dy);
        const c = far ? T.shade(body, -0.25) : body;
        O(ctx, s, (k) => T.rrect(k, -s * 0.42, -s * 0.07, s * 0.12, s * 0.14, s * 0.03), '#1a1a1e');
        O(ctx, s, (k) => { k.moveTo(-s * 0.32, -s * 0.09); k.lineTo(s * 0.18, -s * 0.13); k.lineTo(s * 0.18, s * 0.13); k.lineTo(-s * 0.32, s * 0.09); k.closePath(); }, c, fillR(T.shade(c, -0.25), -s, s * 0.04, s * 2, s));
        O(ctx, s, (k) => T.rrect(k, -s * 0.12, -s * 0.12, s * 0.14, s * 0.24, s * 0.02), '#5a5a62');
        O(ctx, s, (k) => ell(k, s * 0.2, 0, s * 0.06, s * 0.15), '#1a1a1e');
        if (!far) { O(ctx, s, (k) => ell(k, s * 0.215, 0, s * 0.04, s * 0.115), lens); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ell(ctx, s * 0.205, -s * 0.05, s * 0.012, s * 0.03); ctx.fill(); if (o.eyes) { ctx.fillStyle = P.ink; ctx.beginPath(); ell(ctx, s * 0.222, s * 0.01, s * 0.016, s * 0.045); ctx.fill(); } }
        ctx.restore();
      }
      O(ctx, s, (k) => T.rrect(k, -s * 0.06, -s * 0.1, s * 0.1, s * 0.1, s * 0.02), '#5a5a62');
    },
    'white-flag'(ctx, s, lt, o) {
      const w = s * 0.7, h = s * 0.5, x0 = -s * 0.3, y0 = -s * 0.5, wave = (u) => Math.sin(u * 4 * PI - lt * 1.2 * TAU) * w * 0.06 * u;
      stick(ctx, s, [[x0, s * 0.5], [x0, y0]], s * 0.04, '#8a5a2a');
      O(ctx, s, (k) => { k.moveTo(x0, y0); for (let u = 0; u <= 1.001; u += 0.1) k.lineTo(x0 + u * w, y0 + wave(u)); for (let u = 1; u >= -0.001; u -= 0.1) k.lineTo(x0 + u * w, y0 + h + wave(u)); k.closePath(); }, o.color ?? '#f6f3ee', fillR('#d8d2c6', x0, y0 + h * 0.6, w * 1.2, h));
    },
    cleaver(ctx, s, lt, o) {
      const ch = evt(o.chop);
      if (ch) { const p = T.ease.outBack(T.prog(lt, ch.at ?? 0, ch.dur ?? 0.8)); ctx.translate(-s * 0.5, 0); ctx.rotate(T.lerp(ch.from ?? -25, ch.to ?? 35, p) * D); ctx.translate(s * 0.5, 0); }
      O(ctx, s, (k) => T.rrect(k, -s * 0.5, -s * 0.04, s * 0.32, s * 0.09, s * 0.04), '#5a3a26');
      const g = ctx.createLinearGradient(0, -s * 0.19, 0, s * 0.19); g.addColorStop(0, '#cfd2d6'); g.addColorStop(1, '#8e9298');
      O(ctx, s, (k) => T.rrect(k, -s * 0.2, -s * 0.19, s * 0.6, s * 0.38, s * 0.04), g, fillR('#6e7278', -s * 0.2, -s * 0.19, s * 0.6, s * 0.05));
      ctx.fillStyle = P.ink; ctx.beginPath(); ctx.arc(s * 0.3, -s * 0.08, s * 0.035, 0, TAU); ctx.fill();
    },
    bandage(ctx, s, lt, o) {
      O(ctx, s, (k) => T.rrect(k, -s * 0.5, -s * 0.13, s, s * 0.26, s * 0.13), o.color ?? '#f2b48c', fillR(sh(o.color ?? '#f2b48c', -0.12), -s, s * 0.05, s * 2, s));
      O(ctx, s, (k) => T.rrect(k, -s * 0.18, -s * 0.095, s * 0.36, s * 0.19, s * 0.04), '#f8d6b8');
      ctx.fillStyle = '#c98a6a'; for (let i = 0; i < 10; i++) for (const d of [-1, 1]) { ctx.beginPath(); ctx.arc(d * s * (0.25 + (i % 5) * 0.045), (i < 5 ? -1 : 1) * s * 0.05, s * 0.01, 0, TAU); ctx.fill(); }
    },
    pitchfork(ctx, s, lt, o) {
      stick(ctx, s, [[0, s * 0.5], [0, -s * 0.24]], s * 0.035, o.color ?? '#8a5a2a');
      stick(ctx, s, [[-s * 0.1, -s * 0.24], [s * 0.1, -s * 0.24]], s * 0.03, '#9a9aa0');
      for (const x of [-0.1, 0, 0.1]) stick(ctx, s, [[s * x, -s * 0.24], [s * x, -s * 0.5]], s * 0.022, '#9a9aa0');
    },
    whistle(ctx, s, lt, o) {
      const col = o.color ?? '#c0392b';
      if (o.on === true || inWin(o.on, lt)) { const k = two(lt) % 2 ? 1 : 0.85; ticks(ctx, s, -s * 0.42, -s * 0.05, 3, s * 0.12 * k, s * 0.3 * k, '#f5d33a', PI - 0.6, 1.2); }
      O(ctx, s, (k) => { k.moveTo(-s * 0.4, -s * 0.12); k.lineTo(0, -s * 0.12); k.arc(s * 0.12, s * 0.06, s * 0.22, -PI * 0.6, PI * 1.2); k.lineTo(-s * 0.4, s * 0.0); k.closePath(); }, col, fillR(sh(col), -s, s * 0.08, s * 2, s));
      ctx.lineWidth = s * 0.03; ctx.strokeStyle = P.ink; ctx.beginPath(); ctx.arc(s * 0.36, -s * 0.18, s * 0.08, 0, TAU); ctx.stroke();
      ctx.fillStyle = P.ink; ctx.fillRect(-s * 0.06, -s * 0.12, s * 0.08, s * 0.04);
    },
    remote(ctx, s, lt, o) {
      const pr = [].concat(o.press ?? []).map((v) => (typeof v === 'number' ? v : v.at ?? 0)).some((t) => F(lt - t) >= 0 && F(lt - t) < 3);
      O(ctx, s, (k) => T.rrect(k, -s * 0.15, -s * 0.34, s * 0.3, s * 0.67, s * 0.06), o.color ?? '#4a4a50', fillR('#3a3a40', s * 0.05, -s, s, s * 2));
      O(ctx, s, (k) => k.arc(0, -s * 0.18 + (pr ? s * 0.015 : 0), s * 0.07, 0, TAU), '#c81a1a');
      for (const y of [0.0, 0.14]) O(ctx, s, (k) => k.arc(0, s * y, s * 0.045, 0, TAU), '#9aa0a6');
      if (pr) ticks(ctx, s, 0, -s * 0.18, 3, s * 0.13, s * 0.24, '#ffd21a', -PI * 0.85, PI * 0.7);
    },
  };
  H['big-button'] = (ctx, s, lt, o) => {
    const pr = [].concat(o.press ?? []).map((v) => (typeof v === 'number' ? v : v.at ?? 0)).some((t) => F(lt - t) >= 0 && F(lt - t) < 3), dy = pr ? s * 0.03 : 0;
    O(ctx, s, (k) => { k.moveTo(-s * 0.3, -s * 0.36 + dy); k.bezierCurveTo(-s * 0.3, -s * 0.66 + dy, s * 0.3, -s * 0.66 + dy, s * 0.3, -s * 0.36 + dy); k.closePath(); }, o.color ?? '#c81a1a', (k) => { k.fillStyle = sh(o.color ?? '#c81a1a'); k.fillRect(s * 0.08, -s, s, s); k.fillStyle = 'rgba(255,255,255,0.4)'; k.beginPath(); ell(k, -s * 0.1, -s * 0.52 + dy, s * 0.08, s * 0.03, -0.3); k.fill(); });
    O(ctx, s, (k) => T.rrect(k, -s * 0.42, -s * 0.38, s * 0.84, s * 0.38, s * 0.06), '#1d1d22', fillR('#2e2e34', -s, -s * 0.38, s * 2, s * 0.08));
    if (pr) ticks(ctx, s, 0, -s * 0.5, 5, s * 0.36, s * 0.52, '#ffd21a', -PI * 0.95, PI * 0.9);
  };

  H.smartphone = (ctx, s, lt, o) => H.phone(ctx, s, lt, { ...o, style: 'smart' });
  // Treasure mound: seeded coins sorted back to front, a few banknotes, optional chest, glints on twos.
  H['coin-heap'] = (ctx, s, lt, o) => {
    const r = RNG(o, 'heap', 'coins'), coins = [], n = o.count ?? 34, gold = o.color ?? '#f2c230';
    for (let i = 0; i < n; i++) { const u = r() * 2 - 1, hmax = Math.sqrt(1 - u * u) * s * 0.42, y = -r() * hmax; coins.push([u * s * 0.46, y, (r() - 0.5) * 0.8, r()]); }
    coins.sort((a, b) => a[1] - b[1]);
    if (o.chest) { O(ctx, s, (k) => k.rect(-s * 0.3, -s * 0.5, s * 0.6, s * 0.3), '#7a4a2a'); O(ctx, s, (k) => { k.moveTo(-s * 0.3, -s * 0.5); k.lineTo(-s * 0.26, -s * 0.78); k.lineTo(s * 0.26, -s * 0.78); k.lineTo(s * 0.3, -s * 0.5); k.closePath(); }, '#8a5a3a'); }
    O(ctx, s, (k) => { k.moveTo(-s * 0.5, 0); k.quadraticCurveTo(-s * 0.3, -s * 0.5, 0, -s * 0.46); k.quadraticCurveTo(s * 0.3, -s * 0.5, s * 0.5, 0); k.closePath(); }, sh(gold, -0.1));
    for (const [x, y, a] of [[-0.3, -0.12, -0.4], [0.24, -0.2, 0.5], [0.05, -0.34, 0.15]]) { ctx.save(); ctx.translate(s * x, s * y); ctx.rotate(a); O(ctx, s * 0.6, (k) => k.rect(-s * 0.11, -s * 0.05, s * 0.22, s * 0.1), '#7cb85a', (k) => { k.strokeStyle = '#4a8a3a'; k.lineWidth = 2; k.strokeRect(-s * 0.085, -s * 0.03, s * 0.17, s * 0.06); }); ctx.restore(); }
    for (const [x, y, a] of coins) { ctx.save(); ctx.translate(x, y); ctx.rotate(a * 0.4); O(ctx, s * 0.5, (k) => ell(k, 0, 0, s * 0.055, s * 0.028), gold, fillR(sh(gold), -s, s * 0.006, s * 2, s)); ctx.restore(); }
    const g = T.rng(T.hash((o.id || 'heap') + ':glint' + Math.floor(lt * 7.5)));
    for (let i = 0; i < 3; i++) { const c = coins[Math.floor(g() * coins.length)]; if (!c) break; const z = s * 0.05; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(c[0], c[1] - z); ctx.lineTo(c[0] + z * 0.2, c[1] - z * 0.2); ctx.lineTo(c[0] + z, c[1]); ctx.lineTo(c[0] + z * 0.2, c[1] + z * 0.2); ctx.lineTo(c[0], c[1] + z); ctx.lineTo(c[0] - z * 0.2, c[1] + z * 0.2); ctx.lineTo(c[0] - z, c[1]); ctx.lineTo(c[0] - z * 0.2, c[1] - z * 0.2); ctx.fill(); }
  };

  // ---------- bowling, chess, ice ----------
  H['bowling-ball'] = (ctx, s, lt, o) => {
    const rl = evt(o.roll), r = s / 2, cs = o.colors ?? ['#2a5aa8', '#f2efe9', '#c8302a'];
    let spin = 0;
    if (rl) { const f = F(lt - (rl.at ?? 0)), wb = rl.wobble ?? 13; if (f >= 0 && f < wb) spin = (two(lt) % 2 ? 4 : -4) * D; else if (f >= wb) { const p = T.ease.in(T.clamp((f - wb) / 4)), [dx, dy] = rl.to ?? [900, 0]; ctx.translate(dx * p, dy * p); spin = ((f - wb) * 40) * D; } }
    ctx.translate(0, -r); ctx.rotate(spin);
    O(ctx, s, (k) => k.arc(0, 0, r, 0, TAU), cs[0], (k) => { cs.forEach((c, i) => { k.fillStyle = c; k.fillRect(-r, -r + (i * 2 * r) / cs.length, 2 * r, (2 * r) / cs.length + 1); }); k.fillStyle = 'rgba(0,0,0,0.18)'; k.beginPath(); k.arc(r * 0.3, r * 0.3, r, 0, TAU); k.fill(); });
    ctx.fillStyle = P.ink; for (const [x, y] of [[-0.18, -0.4], [0.05, -0.48], [-0.02, -0.22]]) { ctx.beginPath(); ell(ctx, r * x, r * y, r * 0.08, r * 0.1); ctx.fill(); }
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = r * 0.08; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, 0, r * 0.75, PI * 1.05, PI * 1.35); ctx.stroke();
  };
  H.pins = (ctx, s, lt, o) => {
    const n = o.count ?? 6, hit = evt(o.hit), rows = [[0, 0], [-1, 1], [1, 1], [-2, 2], [0, 2], [2, 2], [-3, 3], [-1, 3], [1, 3], [3, 3]].slice(0, n).reverse();
    const pin = (k) => { k.moveTo(-s * 0.05, 0); k.bezierCurveTo(-s * 0.2, -s * 0.35, -s * 0.03, -s * 0.55, -s * 0.06, -s * 0.75); k.bezierCurveTo(-s * 0.1, -s * 0.92, s * 0.1, -s * 0.92, s * 0.06, -s * 0.75); k.bezierCurveTo(s * 0.03, -s * 0.55, s * 0.2, -s * 0.35, s * 0.05, 0); k.closePath(); };
    rows.forEach(([cx, row], i) => {
      ctx.save(); ctx.translate(cx * s * 0.14 + row * s * 0.06, -row * s * 0.05);
      if (hit) { // pins fly, spin, then land and stay lying on the floor (knocked down, still in frame)
        const t = lt - (hit.at ?? 0);
        if (t > 0) {
          const r = T.rng(T.hash((o.id || 'pins') + i)), vx = (r() - 0.4) * s * 2.6, vy = -(r() * 0.5 + 0.5) * s * 5, g = s * 22, sp = (25 + r() * 15) * (r() < 0.4 ? -1 : 1), tl = (-2 * vy) / g;
          if (t < tl) { ctx.translate(vx * t, vy * t + 0.5 * g * t * t); ctx.rotate(sp * F(t) * D); }
          else { ctx.translate(vx * tl + vx * 0.08 * T.ease.out(T.clamp((t - tl) / 0.2)), -s * 0.09 + row * s * 0.05); ctx.rotate(Math.sign(sp) * PI / 2); }
        }
      }
      O(ctx, s, pin, o.color ?? '#f6f3ee', (k) => { k.fillStyle = '#c0392b'; k.fillRect(-s, -s * 0.66, s * 2, s * 0.035); k.fillRect(-s, -s * 0.6, s * 2, s * 0.035); k.fillStyle = 'rgba(0,0,0,0.12)'; k.fillRect(s * 0.02, -s, s, s); });
      ctx.restore();
    });
  };
  H.chess = (ctx, s, lt, o) => {
    const col = o.color ?? (o.side === 'black' ? '#2a2a2e' : '#f4f1ea'), pc = o.piece ?? 'pawn', tp = evt(o.topple), dir = (tp && tp.dir) ?? 1;
    if (tp) { const p = T.ease.in(T.prog(lt, tp.at ?? 0, 7 / 30)); ctx.translate(dir * s * 0.18, 0); ctx.rotate(dir * p * PI / 2); ctx.translate(-dir * s * 0.18, 0); }
    const shd = fillR(sh(col, col === '#2a2a2e' ? 0.15 : -0.18), s * 0.06, -s * 1.2, s, s * 1.2);
    O(ctx, s, (k) => T.rrect(k, -s * 0.18, -s * 0.1, s * 0.36, s * 0.1, s * 0.03), col, shd);
    if (pc === 'knight') O(ctx, s, (k) => { k.moveTo(-s * 0.13, -s * 0.1); k.lineTo(-s * 0.1, -s * 0.5); k.quadraticCurveTo(-s * 0.06, -s * 0.82, s * 0.06, -s * 0.8); k.lineTo(s * 0.18, -s * 0.6); k.lineTo(s * 0.14, -s * 0.52); k.lineTo(s * 0.02, -s * 0.56); k.quadraticCurveTo(s * 0.14, -s * 0.3, s * 0.13, -s * 0.1); k.closePath(); }, col, shd);
    else {
      const tall = { pawn: 0.45, king: 0.72, queen: 0.66 }[pc] ?? 0.45;
      O(ctx, s, (k) => { k.moveTo(-s * 0.13, -s * 0.1); k.quadraticCurveTo(-s * 0.04, -s * tall * 0.6, -s * 0.05, -s * tall); k.lineTo(s * 0.05, -s * tall); k.quadraticCurveTo(s * 0.04, -s * tall * 0.6, s * 0.13, -s * 0.1); k.closePath(); }, col, shd);
      O(ctx, s, (k) => T.rrect(k, -s * 0.1, -s * tall - s * 0.03, s * 0.2, s * 0.05, s * 0.02), col);
      if (pc === 'pawn') O(ctx, s, (k) => k.arc(0, -s * 0.56, s * 0.1, 0, TAU), col, shd);
      if (pc === 'queen') O(ctx, s, (k) => { k.moveTo(-s * 0.1, -s * 0.69); for (let i = 0; i <= 4; i++) k.lineTo(-s * 0.1 + i * s * 0.05, -s * (i % 2 ? 0.76 : 0.86)); k.lineTo(s * 0.1, -s * 0.69); k.closePath(); }, col, shd);
      if (pc === 'king') { O(ctx, s, (k) => T.rrect(k, -s * 0.08, -s * 0.86, s * 0.16, s * 0.12, s * 0.04), col, shd); O(ctx, s, (k) => { k.rect(-s * 0.015, -s * 0.98, s * 0.03, s * 0.12); k.rect(-s * 0.05, -s * 0.94, s * 0.1, s * 0.03); }, col); }
    }
  };
  H['ice-block'] = (ctx, s, lt, o) => {
    const w = s * 0.75, d = s * 0.12, col = o.color ?? '#bfe8ea';
    ctx.save(); ctx.globalAlpha *= o.opacity ?? 0.55;
    ctx.fillStyle = sh(col, -0.15); ctx.beginPath(); ctx.moveTo(w / 2, -s + d); ctx.lineTo(w / 2 + d, -s); ctx.lineTo(w / 2 + d, -d); ctx.lineTo(w / 2, 0); ctx.fill();
    ctx.fillStyle = sh(col, 0.2); ctx.beginPath(); ctx.moveTo(-w / 2, -s + d); ctx.lineTo(-w / 2 + d, -s); ctx.lineTo(w / 2 + d, -s); ctx.lineTo(w / 2, -s + d); ctx.fill();
    ctx.fillStyle = col; ctx.beginPath(); T.rrect(ctx, -w / 2, -s + d, w, s - d, s * 0.04); ctx.fill();
    ctx.restore();
    ctx.lineWidth = LW(s); ctx.strokeStyle = P.ink; ctx.lineJoin = 'round';
    ctx.beginPath(); T.rrect(ctx, -w / 2, -s + d, w, s - d, s * 0.04); ctx.moveTo(-w / 2 + s * 0.02, -s + d); ctx.lineTo(-w / 2 + d, -s); ctx.lineTo(w / 2 + d, -s); ctx.lineTo(w / 2 + d, -d); ctx.lineTo(w / 2, 0); ctx.moveTo(w / 2 + d, -s); ctx.lineTo(w / 2, -s + d); ctx.stroke();
    ctx.strokeStyle = '#ffffff'; ctx.lineCap = 'round';
    for (const [lw, y0, y1] of [[6, 0.82, 0.62], [3, 0.58, 0.5]]) { ctx.lineWidth = lw * (s / 300); ctx.beginPath(); ctx.moveTo(-w / 2 + s * 0.08, -s * y0); ctx.lineTo(-w / 2 + s * 0.08, -s * y1); ctx.stroke(); }
  };

  T.PROP_GROUND = new Set(['signpost', 'fork-signs', 'throne', 'bed', 'lectern', 'easel', 'deckchair', 'coffin', 'crib', 'dinner-table', 'armchair', 'cage', 'door', 'gate', 'portcullis', 'coin-heap', 'big-button', 'bowling-ball', 'pins', 'chess', 'ice-block', 'clock', 'emblem3d', 'stat-block', 'prize-wheel']);
  T.PROP3 = { stick, words, ticks, chainLinks, padlock, castHead, screen, O, LW, evt, inWin, F, two, RNG, fillR, ell, env: () => ENV };
  Object.assign(T.PROPS, {
    signpost, 'fork-signs': forkSigns, 'marquee-arrow': marquee,
    throne, bed, lectern, easel, deckchair, coffin, crib, 'dinner-table': dinnerTable, armchair, swaddle,
    cage, door, gate, portcullis, ...H,
  });

  // ---------- pun close-up and strategy-game props ----------
  // coin-gavel (centred): a judge's gavel whose head is a stack of gold coins seen edge-on, coin faces on both ends.
  // o: {color gold, wood '#8a5a34', strike: [t...] (head swings down 25 deg over 3 frames and back over 4)}.
  function coinGavel(ctx, s, lt, o) {
    const gold = o.color ?? P.gold, wood = o.wood ?? '#8a5a34', hw = s * 0.62, hh = s * 0.3, hy = -s * 0.22;
    const hit = (o.strike || []).map((t) => F(lt - t)).find((f) => f >= 0 && f < 7);
    if (hit != null) { ctx.translate(0, s * 0.45); ctx.rotate((hit < 3 ? hit / 3 : 1 - (hit - 3) / 4) * 25 * D); ctx.translate(0, -s * 0.45); }
    stick(ctx, s, [[0, hy + hh * 0.3], [0, s * 0.42]], s * 0.075, wood, 'butt');
    ctx.save(); ctx.strokeStyle = sh(wood, -0.25); ctx.lineWidth = s * 0.022; ctx.beginPath(); ctx.moveTo(s * 0.02, hy + hh * 0.6); ctx.lineTo(s * 0.02, s * 0.4); ctx.stroke(); ctx.restore();
    O(ctx, s, (k) => ell(k, 0, s * 0.45, s * 0.07, s * 0.05), sh(wood, -0.1));
    const n = 9, cw = hw / n, ry = hh / 2, rx = hh * 0.2;
    O(ctx, s, (k) => { k.moveTo(-hw / 2, hy - ry); k.lineTo(hw / 2, hy - ry); k.ellipse(hw / 2, hy, rx, ry, 0, -PI / 2, PI / 2); k.lineTo(-hw / 2, hy + ry); k.closePath(); }, gold,
      (k) => { k.fillStyle = sh(gold, -0.25); k.fillRect(-hw / 2, hy + ry * 0.35, hw + rx, ry); });
    ctx.save(); ctx.strokeStyle = sh(gold, -0.4); ctx.lineWidth = LW(s) * 0.7;
    for (let i = 1; i < n; i++) { const x = -hw / 2 + i * cw; ctx.beginPath(); ctx.moveTo(x, hy - ry + LW(s) * 0.5); ctx.lineTo(x, hy + ry - LW(s) * 0.5); ctx.stroke(); }
    ctx.restore();
    O(ctx, s, (k) => ell(k, -hw / 2, hy, rx, ry), sh(gold, 0.12), (k) => { k.strokeStyle = sh(gold, -0.3); k.lineWidth = LW(s) * 0.7; k.beginPath(); ell(k, -hw / 2, hy, rx * 0.62, ry * 0.7); k.stroke(); });
    ctx.save(); ctx.translate(-hw / 2, hy); ctx.scale(rx / ry, 1); T.toonText(ctx, '$', 0, ry * 0.32, { size: ry * 0.9, fill: sh(gold, -0.35), stroke: 0, shadow: false }); ctx.restore();
    glint(ctx, -hw * 0.18, hy - ry * 0.45, s * 0.035);
  }
  function glint(ctx, x, y, r) {
    ctx.fillStyle = '#fffbe6'; ctx.beginPath(); ctx.moveTo(x, y - r * 2); ctx.quadraticCurveTo(x, y, x + r, y); ctx.quadraticCurveTo(x, y, x, y + r * 2); ctx.quadraticCurveTo(x, y, x - r, y); ctx.quadraticCurveTo(x, y, x, y - r * 2); ctx.fill();
  }
  // iso-tile (ground): an isometric strategy-game tile — grass diamond (2:1) on a thick earth slab, seeded tufts.
  // o: {color '#7cbf4a' grass, earth '#8a5a34', depth 0.2 (of size), owner (border colour), building 'none'|'house'|'tower'}.
  const ISO_BUILD = {
    none() {},
    house(ctx, s) {
      const w = s * 0.2, h = s * 0.16, wall = '#e8dcc0', roof = '#c0503a';
      O(ctx, s, (k) => { k.moveTo(-w, 0); k.lineTo(0, w * 0.5); k.lineTo(0, w * 0.5 - h); k.lineTo(-w, -h); k.closePath(); }, wall);
      O(ctx, s, (k) => { k.moveTo(0, w * 0.5); k.lineTo(w * 0.8, w * 0.1); k.lineTo(w * 0.8, w * 0.1 - h); k.lineTo(0, w * 0.5 - h); k.closePath(); }, sh(wall, -0.18));
      O(ctx, s, (k) => { k.moveTo(-w * 1.08, -h + 2); k.lineTo(-w * 0.5, -h - s * 0.14); k.lineTo(w * 0.4, -h - s * 0.14 - w * 0.25); k.lineTo(w * 0.86, w * 0.1 - h + 2); k.lineTo(0, w * 0.5 - h + 4); k.closePath(); }, roof,
        (k) => { k.fillStyle = sh(roof, -0.2); k.beginPath(); k.moveTo(-w * 0.5, -h - s * 0.14); k.lineTo(w * 0.4, -h - s * 0.14 - w * 0.25); k.lineTo(w * 0.86, w * 0.1 - h + 2); k.lineTo(0, w * 0.5 - h + 4); k.closePath(); k.fill(); });
      O(ctx, s, (k) => k.rect(-w * 0.55, -h * 0.55, w * 0.22, h * 0.55 + w * 0.13), '#5a3a22');
    },
    tower(ctx, s, o) {
      const r = s * 0.12, h = s * 0.42, stone = '#b9b2a4', top = -h;
      O(ctx, s, (k) => { k.moveTo(-r, top); k.lineTo(-r, 0); k.ellipse(0, 0, r, r * 0.5, 0, PI, 0, true); k.lineTo(r, top); k.closePath(); }, stone, (k) => { k.fillStyle = sh(stone, -0.18); k.fillRect(r * 0.3, top, r, h + r); });
      for (let i = 0; i < 4; i++) { const x = -r + (i * 2 * r) / 3.5; O(ctx, s, (k) => k.rect(x, top - s * 0.05, r * 0.4, s * 0.05), stone); }
      O(ctx, s, (k) => ell(k, 0, top, r, r * 0.42), sh(stone, 0.1));
      O(ctx, s, (k) => { k.moveTo(-r * 0.3, -h * 0.25); k.lineTo(-r * 0.3, -h * 0.45); k.arc(0, -h * 0.45, r * 0.3, PI, 0); k.lineTo(r * 0.3, -h * 0.25); k.closePath(); }, '#3a2a22');
      stick(ctx, s, [[0, top - s * 0.02], [0, top - s * 0.2]], s * 0.012, '#5a3a22');
      O(ctx, s, (k) => { k.moveTo(0, top - s * 0.2); k.lineTo(s * 0.12, top - s * 0.17); k.lineTo(0, top - s * 0.13); k.closePath(); }, o.owner ?? P.red);
    },
  };
  function isoTile(ctx, s, lt, o) {
    const grass = o.color ?? '#7cbf4a', earth = o.earth ?? '#8a5a34', dep = s * (o.depth ?? 0.2), hw = s / 2, hh = s / 4, cy = -dep - hh;
    const build = ISO_BUILD[o.building ?? 'none'];
    if (!build) throw new Error(`iso-tile: unknown building "${o.building}" (none, house, tower)`);
    O(ctx, s, (k) => { k.moveTo(-hw, cy); k.lineTo(0, cy + hh); k.lineTo(0, 0); k.lineTo(-hw, -dep + 0); k.closePath(); }, earth);
    O(ctx, s, (k) => { k.moveTo(hw, cy); k.lineTo(0, cy + hh); k.lineTo(0, 0); k.lineTo(hw, -dep); k.closePath(); }, sh(earth, -0.22));
    ctx.fillStyle = sh(grass, -0.2); // grass lip hanging over the earth sides
    ctx.beginPath(); ctx.moveTo(-hw, cy); ctx.lineTo(0, cy + hh); ctx.lineTo(hw, cy);
    for (let i = 0; i <= 8; i++) { const u = 1 - i / 8, x = hw * (2 * u - 1), y = cy + hh * (1 - Math.abs(2 * u - 1)) + s * (i % 2 ? 0.05 : 0.025); ctx.lineTo(x, y); }
    ctx.closePath(); ctx.fill();
    const top = (k, g = 0) => { k.moveTo(0, cy - hh + g * 0.5); k.lineTo(hw - g, cy); k.lineTo(0, cy + hh - g * 0.5); k.lineTo(-hw + g, cy); k.closePath(); };
    O(ctx, s, (k) => top(k), grass, (k) => { k.fillStyle = sh(grass, -0.1); k.beginPath(); k.moveTo(0, cy); k.lineTo(hw, cy); k.lineTo(0, cy + hh); k.closePath(); k.fill(); });
    const r = RNG(o, 'iso-tile', 'tufts');
    ctx.strokeStyle = sh(grass, -0.3); ctx.lineWidth = LW(s) * 0.6; ctx.lineCap = 'round';
    for (let i = 0; i < 7; i++) { const u = r() - 0.5, v = r() - 0.5, x = (u + v) * hw * 0.8, y = cy + (v - u) * hh * 0.8; ctx.beginPath(); ctx.moveTo(x - s * 0.015, y); ctx.lineTo(x - s * 0.02, y - s * 0.03); ctx.moveTo(x + s * 0.01, y); ctx.lineTo(x + s * 0.02, y - s * 0.035); ctx.stroke(); }
    if (o.owner) { ctx.save(); ctx.strokeStyle = o.owner; ctx.lineWidth = s * 0.035; ctx.lineJoin = 'round'; ctx.beginPath(); top(ctx, s * 0.06); ctx.stroke(); ctx.restore(); }
    ctx.save(); ctx.translate(0, cy + hh * 0.15); build(ctx, s, o); ctx.restore();
  }
  Object.assign(T.PROPS, { 'coin-gavel': coinGavel, 'iso-tile': isoTile });
  T.PROP_GROUND.add('iso-tile');
})();
