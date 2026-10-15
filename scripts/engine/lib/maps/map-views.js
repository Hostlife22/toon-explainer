// map-views.js — map views and living regions. Views (T.MAP_VIEWS): tilt (perspective slab), globe (planet curve / full globe), tabletop (paper
// on a war table). Living regions through T.MAP_REGION_HOOKS: split, shatter, slash, engulf, peel, drift, wipe, blotch
// conquest, annex flash, damage, surrender, border fire and four new face moods. Overlays (T.MAP_OVERLAYS + order):
// figures (cast beans as stickers), arrows, brawls, fires, trails, tracks, forts, camps, squads, flags, coins, xmarks,
// barriers, words, drops, tacks, hand. New T.MAP_ICONS. Timings are measured on the reference map shots at 30 fps.
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL, W = T.W, H = T.H, DEG = T.DEG, FR = 1 / 30, TAU = Math.PI * 2;
  const OV = T.MAP_OVERLAYS, ICONS = T.MAP_ICONS;
  if (!OV || !ICONS || !T.MAP_VIEWS || !T.MAP_REGION_HOOKS) throw new Error('map-views.js needs map.js and map-overlays.js loaded first');

  // ---------- small helpers ----------
  const twos = (lt) => Math.floor(lt * 15);
  const list = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
  const frame = (lt, at) => Math.floor((lt - at) * 30 + 1e-6);
  const snap = (lt, at, seq) => { const f = frame(lt, at); return f < 0 ? 0 : seq[Math.min(f, seq.length - 1)]; };
  const mean = (pts) => [pts.reduce((a, q) => a + q[0], 0) / pts.length, pts.reduce((a, q) => a + q[1], 0) / pts.length];
  const trace = (k, pts) => { k.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) k.lineTo(pts[i][0], pts[i][1]); k.closePath(); };
  const polyline = (k, pts) => { k.beginPath(); k.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) k.lineTo(pts[i][0], pts[i][1]); };
  const pip = (pts, x, y) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
  const px = (g, p) => [g.X(p[0]), g.Y(p[1])];
  const up = (g, x, y) => g.project(x / g.mw + 0.5, y / g.mh + 0.5); // flat px -> projected [px, py, scale]
  const viewScale = (ctx) => { const m = ctx.getTransform(); return Math.max(Math.hypot(m.a, m.b), Math.hypot(m.c, m.d)) || 1; };
  const fbox = (g) => { const st = g.env.st || { x: W / 2, y: H / 2, s: 1 }, s = st.s || 1; return { x0: -st.x / s, y0: -st.y / s, x1: (W - st.x) / s, y1: (H - st.y) / s }; };
  const colorOf = (g, v, lt, def) => (v == null ? def : g.byId[v] ? g.color(g.byId[v], lt) : v);
  const ptOf = (g, v) => {
    if (typeof v === 'string') { const R = g.byId[v]; if (!R) throw new Error(`map: no region with id "${v}"`); return g.centroid(R); }
    if (!Array.isArray(v) || v.length < 2) throw new Error('map: a point must be [x, y] or a region id'); return px(g, v);
  };
  const areaPts = (g, o, what) => {
    if (o.pts) return o.pts.map((p) => px(g, p)); const R = g.byId[o.region]; if (!R) throw new Error(`map ${what}: unknown region "${o.region}"`); return g.pts(R);
  };
  // Seeded points inside a polygon (rejection sampling with a minimum spacing that relaxes when the area is crowded).
  const scatter = (pts, n, seed, minD = 0) => {
    const r = T.rng(T.hash(seed)), xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]), out = [];
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    for (let tries = 0; out.length < n && tries < n * 80; tries++) { const x = T.lerp(x0, x1, r()), y = T.lerp(y0, y1, r()), d = minD * (tries > n * 40 ? 0.4 : 1);
      if (pip(pts, x, y) && out.every((q) => Math.hypot(q[0] - x, q[1] - y) >= d)) out.push([x, y]); }
    return out;
  };
  // Polyline cut at progress p (0..1).
  const partial = (pts, p) => {
    if (p >= 1) return pts; const e = T.pathAt(pts, Math.max(0, p)); return pts.slice(0, e.i + 1).concat([[e.x, e.y]]);
  };
  // Points every `step` px along a closed (or open) polyline.
  const resample = (pts, step, closed = true) => {
    const ring = closed ? pts.concat([pts[0]]) : pts, out = [];
    let carry = 0; for (let i = 0; i < ring.length - 1; i++) { const [ax, ay] = ring[i], [bx, by] = ring[i + 1], l = Math.hypot(bx - ax, by - ay);
      for (let d = carry; d < l; d += step) out.push([T.lerp(ax, bx, d / l), T.lerp(ay, by, d / l), Math.atan2(by - ay, bx - ax)]); carry = (carry - l) % step; if (carry < 0) carry += step; }
    return out;
  };
  const halfPlane = (k, x, y, nx, ny) => { const B = 1e4, qx = -ny, qy = nx; k.moveTo(x + qx * B, y + qy * B); k.lineTo(x - qx * B, y - qy * B); k.lineTo(x - qx * B - nx * B, y - qy * B - ny * B); k.lineTo(x + qx * B - nx * B, y + qy * B - ny * B); k.closePath(); };
  const tube = (ctx, a, b, col, w = 22) => { ctx.lineCap = 'round'; ctx.strokeStyle = P.ink; ctx.lineWidth = w + 12; polyline(ctx, [a, b]); ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = w; polyline(ctx, [a, b]); ctx.stroke(); };
  const upright = (fn) => { fn.upright = true; return fn; };

  T.MAP_FACTIONS = { red: '#d52a2a', purple: '#a43fd6', green: '#3aa33a', lime: '#3ad13a', orange: '#f08a2c', navy: '#1d2a5a', yellow: '#f2c43a', grey: '#9a9a98', cyan: '#7fd6ea', black: '#1a1210' };

  // ---------- views ----------
  // The flat map is painted into a scratch canvas (begin), then warped onto the layer (end). Geometry lives on g.mx3.
  function flatCanvas(ctx, g, mag) {
    const q = Math.min(viewScale(ctx) * mag, 4096 / g.mw, 4096 / g.mh), cw = Math.ceil(g.mw * q), ch = Math.ceil(g.mh * q);
    const [c, k] = T.scratch('mx3view', cw, ch);
    k.clearRect(0, 0, cw, ch); k.setTransform(q, 0, 0, q, cw / 2, ch / 2); g.mx3.c = c; g.mx3.q = q; return k;
  }
  // Pinhole board: pitch `deg`, far/near width ratio `taper`, far edge at frame height `vp`, optional pan glide and skew.
  function persp(o, g, lt, d) {
    const deg = o.deg ?? d.deg, taper = o.taper ?? d.taper, zoom = o.zoom ?? d.zoom, skew = o.skew ?? 0;
    if (!(deg >= 0 && deg <= 75)) throw new Error(`map view: deg must be within 0..75 (got ${deg})`);
    if (!(taper >= 0.2 && taper <= 1)) throw new Error(`map view: taper must be within 0.2..1 (got ${taper})`); const h = g.mh / 2, sn = Math.max(Math.sin(deg * DEG), 0.02), cs = Math.cos(deg * DEG);
    const D = taper >= 0.999 ? 1e9 : (h * sn * (1 + taper)) / (1 - taper), kf = (Y) => (D / (D - Y * sn)) * zoom;
    let pan = [0, 0]; if (o.pan) { const dur = o.panDur ?? Math.max(0.5, (g.env.shot?.dur ?? 4) - (g.L.at ?? 0)), e = T.ease.inOut(T.prog(lt, o.panAt ?? 0, dur));
      pan = [T.lerp(o.pan[0][0], o.pan[1][0], e) * g.mw, T.lerp(o.pan[0][1], o.pan[1][1], e) * g.mh]; }
    const yr = (Y) => Y * cs * kf(Y), sy = ((o.vp ?? d.vp) - 0.5) * H - yr(-h);
    const project = (Xc, Yc) => { const X = Xc - pan[0], Y = Yc - pan[1], k = kf(Y), y = yr(Y) + sy; return [X * k + skew * (y - sy), y, k]; };
    return { project, maxK: kf(h) };
  }
  const outline = (G, g, grow = 0) => {
    const Lp = [], Rp = [], n = 24, w = g.mw / 2 + grow, h = g.mh / 2 + grow;
    for (let i = 0; i <= n; i++) { const Y = -h + (2 * h * i) / n; Lp.push(G.project(-w, Y)); Rp.push(G.project(w, Y)); }
    return Lp.concat(Rp.reverse());
  };
  // 96 horizontal strips, each scaled by its row's perspective factor; the caller clips to the exact board outline.
  function blitPersp(ctx, G, g) {
    const { c } = G, n = 96, h = g.mh / 2, sh = c.height / n;
    for (let i = 0; i < n; i++) { const Y0 = -h + (2 * h * i) / n, Y1 = Y0 + (2 * h) / n, a = G.project(-g.mw / 2, Y0), b = G.project(-g.mw / 2, Y1), m = G.project(-g.mw / 2, (Y0 + Y1) / 2);
      ctx.drawImage(c, 0, i * sh, c.width, sh, m[0] - 2, a[1], g.mw * m[2] + 4, b[1] - a[1] + 0.8); }
  }
  const softShadow = (ctx, poly, dx, dy, blur, alpha) => { ctx.save(); ctx.filter = `blur(${(blur * viewScale(ctx)).toFixed(1)}px)`; ctx.fillStyle = `rgba(0,0,0,${alpha})`; ctx.translate(dx, dy); ctx.beginPath(); trace(ctx, poly); ctx.fill(); ctx.restore(); };
  const TILT = { deg: 35, taper: 0.78, zoom: 1, vp: 0.42 }, TABLE = { deg: 28, taper: 0.78, zoom: 0.72, vp: 0.13 };

  T.MAP_VIEWS.tilt = {
    begin(ctx, L, g, lt) { const o = L.tilt || {}; g.mx3 = persp(o, g, lt, TILT); g.st.extrude = o.depth ?? 12; return flatCanvas(ctx, g, Math.min(1.6, g.mx3.maxK)); },
    end(ctx, L, g, lt) { const o = L.tilt || {}, ol = outline(g.mx3, g); if (o.shadow !== false) softShadow(ctx, ol, 6, 10, 12, 0.25);
      ctx.save(); ctx.beginPath(); trace(ctx, ol); ctx.clip(); blitPersp(ctx, g.mx3, g); ctx.restore(); if (L.figures) drawFigures(ctx, L.figures, g, lt); },
    project: (x, y, g) => g.mx3.project(x, y),
  };

  T.MAP_VIEWS.tabletop = {
    begin(ctx, L, g, lt) { const o = L.table || {}; g.mx3 = persp(o, g, lt, TABLE); return flatCanvas(ctx, g, Math.min(1.4, g.mx3.maxK)); },
    end(ctx, L, g, lt) { const o = L.table || {}, f = fbox(g), col = o.color ?? '#3a3a2e', G = g.mx3; ctx.fillStyle = col; ctx.fillRect(f.x0 - 10, f.y0 - 10, f.x1 - f.x0 + 20, f.y1 - f.y0 + 20);
      const r = T.rng(T.hash('table')); ctx.strokeStyle = T.shade(col, -0.15); ctx.lineWidth = 2;
      for (let y = f.y0 + 30; y < f.y1; y += 60) { const a = r() * 6; ctx.beginPath(); ctx.moveTo(f.x0, y); ctx.bezierCurveTo(f.x0 + 600, y + a, f.x1 - 600, y - a, f.x1, y + r() * 4); ctx.stroke(); }
      const paper = outline(G, g, o.border ?? 26), inner = outline(G, g); softShadow(ctx, paper, 10, 16, 14, 0.4); T.outlined(ctx, (k) => trace(k, paper), o.paper ?? '#efe2c0', { line: 3 });
      ctx.save(); ctx.beginPath(); trace(ctx, inner); ctx.clip(); blitPersp(ctx, G, g); ctx.restore(); if (o.burnt) burntEdge(ctx, paper, lt);
      if (o.curl !== false) { curl(ctx, paper[paper.length - 1], paper[paper.length - 2], paper[0], col); curl(ctx, paper[25], paper[24], paper[26], col); }
      if (L.figures) drawFigures(ctx, L.figures, g, lt); },
    project: (x, y, g) => g.mx3.project(x, y),
  };
  // Folded paper corner: the corner is cut in table colour, the flap is a light triangle with a shadow wedge.
  function curl(ctx, C, A0, B0, table) {
    const s = 70, u = (p) => { const l = Math.hypot(p[0] - C[0], p[1] - C[1]) || 1; return [C[0] + ((p[0] - C[0]) / l) * s, C[1] + ((p[1] - C[1]) / l) * s]; };
    const A = u(A0), B = u(B0), F = [A[0] + B[0] - C[0], A[1] + B[1] - C[1]], M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], Fi = [T.lerp(M[0], F[0], 0.8), T.lerp(M[1], F[1], 0.8)];
    ctx.fillStyle = table; ctx.beginPath(); trace(ctx, [A, C, B]); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); trace(ctx, [A, [Fi[0] + 8, Fi[1] + 8], B]); ctx.fill();
    T.outlined(ctx, (k) => trace(k, [A, Fi, B]), '#fff6dc', { line: 3 });
  }
  function burntEdge(ctx, poly, lt) {
    const r = T.rng(T.hash('burnt')), jag = resample(poly, 24).map(([x, y, a]) => { const o = (r() - 0.5) * 16; return [x - Math.sin(a) * o, y + Math.cos(a) * o]; });
    ctx.save(); ctx.beginPath(); trace(ctx, poly); ctx.clip(); ctx.lineJoin = 'round';
    for (const [w, c] of [[90, 'rgba(58,26,10,0.3)'], [44, 'rgba(58,26,10,0.85)']]) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); trace(ctx, jag); ctx.stroke(); }
    ctx.restore();
  }

  // Globe: the map lies on a planet whose horizon curves under a starry sky (or a full disc with a terminator).
  function globeGeo(o, g, lt) {
    const f = fbox(g), cx = (f.x0 + f.x1) / 2, spin = (o.spin ?? 0.006) * lt * g.mw, wrap = (x) => ((((x + g.mw / 2) % g.mw) + g.mw) % g.mw) - g.mw / 2;
    if (o.full) { const r = (o.r ?? 0.38) * H, cy = (f.y0 + f.y1) / 2 + (o.dy ?? 0) * H, span = T.clamp(o.span ?? 0.8, 0.4, 1), vspan = T.clamp(o.vspan ?? 0.86, 0.4, 1);
      const project = (Xc, Yc) => { const ph = (wrap(Xc - spin) / g.mw) * Math.PI * span; if (Math.abs(ph) > Math.PI / 2) return [0, 0, 0]; const cp = Math.cos(ph); return [cx + r * Math.sin(ph), cy + (Yc / (g.mh / 2)) * r * vspan * cp, (r / (g.mh / 2)) * Math.max(cp, 0.2)]; };
      return { full: true, r, cx, cy, spin, wrap, project, f, span, vspan }; }
    const R = (o.curve ?? 2.2) * W, hy = f.y0 + (o.space ?? 0.25) * H, sag = (x) => R - Math.sqrt(Math.max(0, R * R - (x - cx) * (x - cx)));
    const oy = hy - ((o.top ?? 0.15) - 0.5) * g.mh, project = (Xc, Yc) => { const x = wrap(Xc - spin), y = Yc + oy + sag(x); return y < hy + sag(x) - 1 ? [0, 0, 0] : [x, y, 1]; };
    return { R, cx, hy, oy, sag, spin, wrap, project, f };
  }
  function sky(ctx, o, G, lt, top, bottom) {
    const f = G.f, night = o.night !== false, gr = ctx.createLinearGradient(0, f.y0, 0, bottom);
    gr.addColorStop(0, night ? '#0b1238' : '#cfe0f2'); gr.addColorStop(1, night ? '#2e4fae' : '#e8dcb8'); ctx.fillStyle = gr; ctx.fillRect(f.x0 - 10, f.y0 - 10, f.x1 - f.x0 + 20, f.y1 - f.y0 + 20);
    if (!night) return; const r = T.rng(T.hash('stars'));
    for (let i = 0; i < (o.stars ?? 60); i++) { const x = T.lerp(f.x0, f.x1, r()), y = T.lerp(f.y0, top(x), r()), rad = 1 + r() * 2, tw = r() < 0.3 ? 0.6 + 0.4 * T.noise(lt * 2, i) : 1;
      ctx.fillStyle = `rgba(255,250,230,${((0.4 + r() * 0.6) * tw).toFixed(3)})`; ctx.beginPath(); ctx.arc(x, y, rad, 0, TAU); ctx.fill(); }
  }
  T.MAP_VIEWS.globe = {
    begin(ctx, L, g, lt) { g.mx3 = globeGeo(L.globe || {}, g, lt); return flatCanvas(ctx, g, 1); },
    end(ctx, L, g, lt) { const o = L.globe || {}, G = g.mx3, { c, q } = G, rim = o.rim ?? '#b9cbe4', n = 128;
      const col = (x0, x1, dy, dh) => { let sx = (G.wrap(x0 + G.spin) + g.mw / 2) * q; const sw = Math.max(1, (x1 - x0) * q); sx = Math.min(sx, c.width - sw); ctx.drawImage(c, sx, 0, sw, c.height, x0, dy, x1 - x0 + 0.8, dh); };
      if (G.full) { sky(ctx, { ...o, night: true }, G, lt, () => G.f.y1, G.f.y1); ctx.save(); ctx.beginPath(); ctx.arc(G.cx, G.cy, G.r, 0, TAU); ctx.clip();
        ctx.fillStyle = o.sea ?? g.L.sea ?? g.st?.sea ?? '#5a78d8'; ctx.fillRect(G.cx - G.r, G.cy - G.r, G.r * 2, G.r * 2);
        for (let i = 0; i < n; i++) { const x0 = G.cx - G.r + (2 * G.r * i) / n, x1 = x0 + (2 * G.r) / n, xm = (x0 + x1) / 2 - G.cx, ph = Math.asin(T.clamp(xm / G.r, -1, 1)); colFull(ctx, G, g, ph, x0, x1, G.r * G.vspan * Math.cos(ph)); }
        const limb = ctx.createRadialGradient(G.cx, G.cy, G.r * 0.72, G.cx, G.cy, G.r); limb.addColorStop(0, 'rgba(20,30,70,0)'); limb.addColorStop(1, 'rgba(20,30,70,0.45)'); ctx.fillStyle = limb; ctx.fillRect(G.cx - G.r, G.cy - G.r, G.r * 2, G.r * 2);
        ctx.fillStyle = 'rgba(10,15,40,0.45)'; ctx.beginPath(); ctx.rect(G.cx - G.r, G.cy - G.r, G.r * 2, G.r * 2); ctx.arc(G.cx - G.r * 0.7, G.cy, G.r * 1.05, 0, TAU, true); ctx.fill();
        ctx.restore();
        for (const [w, a] of [[18, 0.08], [12, 0.2], [6, 0.35]]) { ctx.strokeStyle = T.hex6(rim) + Math.round(a * 255).toString(16).padStart(2, '0'); ctx.lineWidth = w; ctx.beginPath(); ctx.arc(G.cx, G.cy, G.r + w / 2, 0, TAU); ctx.stroke(); }
        ctx.strokeStyle = P.ink; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(G.cx, G.cy, G.r, 0, TAU); ctx.stroke(); } else { const f = G.f;
        sky(ctx, o, G, lt, (x) => G.hy + G.sag(x) - 12, G.hy + 40); ctx.save(); ctx.beginPath(); ctx.arc(G.cx, G.hy + G.R, G.R, 0, TAU); ctx.clip();
        for (let i = 0; i < n; i++) { const x0 = f.x0 + ((f.x1 - f.x0) * i) / n, x1 = x0 + (f.x1 - f.x0) / n; col(x0, x1, G.oy - g.mh / 2 + G.sag((x0 + x1) / 2), g.mh); }
        ctx.restore();
        for (const [w, a] of [[18, 0.08], [12, 0.2], [6, 0.35]]) { ctx.strokeStyle = T.hex6(rim) + Math.round(a * 255).toString(16).padStart(2, '0'); ctx.lineWidth = w; ctx.beginPath(); ctx.arc(G.cx, G.hy + G.R, G.R + w / 2, Math.PI * 1.2, Math.PI * 1.8); ctx.stroke(); }
      }
      if (L.figures) drawFigures(ctx, L.figures, g, lt); },
    project: (x, y, g) => g.mx3.project(x, y),
  };
  // Full-globe column: content u around the visible hemisphere (orange-slice lens, columns squeeze toward the limb).
  function colFull(ctx, G, g, ph, x0, x1, hh) {
    const { c, q } = G, k = g.mw / (Math.PI * G.span), u = ph * k, du = Math.max(1, ((x1 - x0) / (G.r * Math.cos(ph) + 1e-3)) * k * q);
    let sx = (G.wrap(u + G.spin) + g.mw / 2) * q; sx = Math.min(sx, c.width - du); ctx.drawImage(c, sx, 0, du, c.height, x0, G.cy - hh, x1 - x0 + 0.8, hh * 2);
  }

  // Rising smoke column: opaque cloud puffs (T.drawCloud, one merged outline each) that grow as they climb and shrink away.
  function smoke(ctx, x, y, lt, o = {}) {
    const n = o.n ?? 3, size = o.size ?? 60, rise = o.rise ?? size * 2.4, drift = o.drift ?? -size * 0.5, life = o.life ?? 1.6, r = T.rng(T.hash(o.seed ?? 'smoke')), puffs = [];
    for (let i = 0; i < n; i++) { const ph = (((lt + (i / n) * life + r() * 0.2) % life) + life) % life / life, jx = (r() - 0.5) * size * 0.3; puffs.push([ph, jx, i]); }
    puffs.sort((a, b) => b[0] - a[0]).forEach(([ph, jx, i]) => { const k = ph < 0.75 ? 0.45 + ph * 0.8 : 1.05 * (1 - (ph - 0.75) / 0.25); if (k <= 0.05) return;
      T.drawCloud(ctx, x + jx + drift * ph, y - rise * ph, size * k, size * 0.8 * k, (o.seed ?? 'smoke') + i, { line: 3, count: 6, color: o.color ?? '#8a8580', shade: o.shade ?? '#6c6763' }); });
  }

  // ---------- region faces (base moods + plead / hearts / pipe / dollar, damage marks, gaze) ----------
  const NEW_MOODS = new Set(['plead', 'hearts', 'pipe', 'dollar']);
  const newMood = (F) => !!F && (Array.isArray(F.mood) ? F.mood.some((e) => NEW_MOODS.has(e.v)) : NEW_MOODS.has(F.mood));
  const heart = (k, x, y, r) => { k.moveTo(x, y + r); k.bezierCurveTo(x - r * 1.7, y - r * 0.2, x - r * 0.8, y - r * 1.5, x, y - r * 0.55); k.bezierCurveTo(x + r * 0.8, y - r * 1.5, x + r * 1.7, y - r * 0.2, x, y + r); k.closePath(); };
  function face3(ctx, cx, cy, s, F, mood, lt, o = {}) {
    const q = T.ease.outBack(T.prog(lt, F.at ?? 0, 0.25));
    if (q <= 0) return; const D = o.damage && lt >= (o.damage.at ?? 0) ? o.damage : null, dk = D ? D.kind ?? 'black-eye' : null, dq = D ? snap(lt, D.at ?? 0, [1.3, 1.15, 1]) : 1;
    const gx = (o.gaze?.[0] ?? 0) * 9, gy = (o.gaze?.[1] ?? 0) * 7;
    ctx.save(); ctx.translate(cx, cy); ctx.scale((q * s) / 100, ((q * s) / 100) * (o.squash ?? 1));
    ctx.strokeStyle = P.ink; ctx.fillStyle = P.ink; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (dk === 'black-eye') { ctx.save(); ctx.translate(-42, 2); ctx.scale(dq, dq); T.outlined(ctx, (k) => k.arc(0, 0, 32, 0, TAU), '#8a4aa8', { line: 6 }); ctx.fillStyle = '#4a2060'; ctx.beginPath(); ctx.arc(0, 4, 30, 0.15 * Math.PI, 0.85 * Math.PI); ctx.arc(0, -6, 30, 0.8 * Math.PI, 0.2 * Math.PI, true); ctx.fill(); ctx.restore(); }
    const blink = !NEW_MOODS.has(mood) && (lt + Math.abs(cx) * 0.01) % 3.3 < 0.1; // abs: centred coords go negative
    for (const d of [-1, 1]) { const ex = d * 42 + gx; ctx.fillStyle = P.ink; ctx.strokeStyle = P.ink;
      if (d === -1 && dk === 'x-eye') { ctx.save(); ctx.scale(dq, dq); ctx.beginPath(); ctx.moveTo(ex - 16, -16); ctx.lineTo(ex + 16, 16); ctx.moveTo(ex + 16, -16); ctx.lineTo(ex - 16, 16); ctx.stroke(); ctx.restore(); }
      else if (mood === 'plead') { ctx.beginPath(); ctx.ellipse(ex, gy, 25, 31, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex - 8, gy - 11, 8, 0, TAU); ctx.arc(ex + 8, gy + 8, 4, 0, TAU); ctx.fill(); }
      else if (mood === 'hearts') { const b = 1 + 0.12 * Math.abs(Math.sin(lt * 7)); ctx.save(); ctx.translate(ex, gy); ctx.scale(b, b); T.outlined(ctx, (k) => heart(k, 0, 0, 22), '#e0303a', { line: 5 }); ctx.restore(); }
      else if (mood === 'dollar') { ctx.font = T.font(70); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 9; ctx.strokeText('$', ex, gy); ctx.fillStyle = '#3aa33a'; ctx.fillText('$', ex, gy); }
      else if (mood === 'pipe') { ctx.beginPath(); ctx.ellipse(ex, gy + 4, 10, 12, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(ex - 20, gy - 4); ctx.lineTo(ex + 20, gy - 4); ctx.stroke(); }
      else if (blink || mood === 'sleepy') { ctx.beginPath(); ctx.moveTo(ex - 16, 0); ctx.lineTo(ex + 16, 0); ctx.stroke(); }
      else if (mood === 'happy') { ctx.beginPath(); ctx.moveTo(ex - 18, 6); ctx.quadraticCurveTo(ex, -22, ex + 18, 6); ctx.stroke(); }
      else if (mood === 'strain') { ctx.beginPath(); ctx.moveTo(ex - d * 16, -14); ctx.lineTo(ex + d * 12, 0); ctx.lineTo(ex - d * 16, 14); ctx.stroke(); }
      else if (mood === 'shock') { T.outlined(ctx, (k) => k.arc(ex, 0, 20, 0, TAU), '#fff', { line: 7 }); ctx.fillStyle = P.ink; ctx.beginPath(); ctx.arc(ex + gx * 0.3, gy, 6, 0, TAU); ctx.fill(); }
      else { ctx.beginPath(); ctx.ellipse(ex, gy, 9, 15, 0, 0, TAU); ctx.fill(); }
      ctx.lineWidth = 12; const up = mood === 'plead' ? 16 : 0; // inner brow end (toward the nose) is ex - d * 22: low = angry, high = sad
      if (mood === 'angry') { ctx.beginPath(); ctx.moveTo(ex - d * 22, -22); ctx.lineTo(ex + d * 22, -40); ctx.stroke(); }
      if (['sad', 'cry', 'worried', 'plead'].includes(mood)) { ctx.beginPath(); ctx.moveTo(ex - d * 22, -44 - up); ctx.lineTo(ex + d * 22, -30 - up); ctx.stroke(); }
    }
    ctx.beginPath(); ctx.strokeStyle = P.ink; ctx.lineWidth = 12;
    if (dk === 'black-eye') { ctx.lineWidth = 5; T.outlined(ctx, (k) => { k.moveTo(-14, 38); k.lineTo(14, 38); k.lineTo(0, 58); k.closePath(); }, '#f2b44a', { line: 5 }); }
    else if (mood === 'plead') { ctx.lineWidth = 7; ctx.moveTo(-14, 50); for (let i = 1; i <= 4; i++) ctx.lineTo(-14 + i * 7, 50 + (i % 2 ? -5 : 0)); ctx.stroke(); }
    else if (mood === 'happy' || mood === 'hearts') { ctx.moveTo(-26, 34); ctx.quadraticCurveTo(0, 62, 26, 34); ctx.stroke(); }
    else if (mood === 'dollar') { T.outlined(ctx, (k) => { k.moveTo(-34, 32); k.quadraticCurveTo(0, 80, 34, 32); k.closePath(); }, '#fff', { line: 8 }); }
    else if (['angry', 'sad', 'cry', 'worried'].includes(mood)) { ctx.moveTo(-24, 54); ctx.quadraticCurveTo(0, 34, 24, 54); ctx.stroke(); }
    else if (mood === 'shock') { ctx.ellipse(0, 46, 12, 16, 0, 0, TAU); ctx.stroke(); }
    else if (mood === 'smug' || mood === 'pipe') { ctx.moveTo(-20, 44); ctx.quadraticCurveTo(10, 54, 30, 38); ctx.stroke(); }
    else { ctx.moveTo(-18, 44); ctx.lineTo(18, 44); ctx.stroke(); }
    if (mood === 'pipe') { T.outlined(ctx, (k) => { k.moveTo(24, 40); k.lineTo(118, 58); k.lineTo(116, 68); k.lineTo(22, 50); k.closePath(); }, '#f4efe4', { line: 5 });
      T.outlined(ctx, (k) => T.rrect(k, 108, 30, 30, 40, 8), '#f4efe4', { line: 5 });
      const b = twos(lt) % 2 ? 4 : -4; ctx.strokeStyle = 'rgba(190,190,190,0.9)'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(123, 24); ctx.bezierCurveTo(140 + b, 0, 106 - b, -16, 128, -44); ctx.stroke();
    }
    if (dk === 'bandage') { ctx.save(); ctx.translate(50, -46); ctx.scale(dq, dq); ctx.rotate(0.35); for (const r of [0, Math.PI / 2]) { ctx.save(); ctx.rotate(r); T.outlined(ctx, (k) => T.rrect(k, -40, -12, 80, 24, 8), '#e8c79a', { line: 5 }); ctx.restore(); } ctx.fillStyle = '#b08a5a'; for (const [x, y] of [[-6, -4], [6, 4], [-6, 4], [6, -4]]) { ctx.beginPath(); ctx.arc(x, y, 2.5, 0, TAU); ctx.fill(); } ctx.restore(); }
    if (dk === 'crack') { ctx.strokeStyle = P.ink; ctx.lineWidth = 6; polyline(ctx, [[-20, -95], [-6, -60], [-24, -30], [-4, -4]]); ctx.stroke(); }
    const acc = F.accessory;
    if (acc === 'sunglasses') { ctx.fillStyle = '#111'; for (const d of [-1, 1]) { ctx.beginPath(); T.rrect(ctx, d * 42 - 30, -18, 60, 34, 12); ctx.fill(); } ctx.fillRect(-14, -8, 28, 8); }
    if (acc === 'crown') { ctx.save(); ctx.translate(0, -70); ctx.scale(0.5, 0.5); T.outlined(ctx, (k) => { k.moveTo(-90, 40); k.lineTo(-110, -50); k.lineTo(-50, -5); k.lineTo(0, -70); k.lineTo(50, -5); k.lineTo(110, -50); k.lineTo(90, 40); k.closePath(); }, P.gold, { line: 12 }); ctx.restore(); }
    if (acc === 'tear' || mood === 'cry' || mood === 'plead') { const f = (lt * 1.2) % 1; ctx.fillStyle = '#7fd0f0'; ctx.beginPath(); ctx.ellipse(-42, 30 + f * 50, 8, 12, 0, 0, TAU); ctx.fill(); }
    if (acc === 'bandage') { ctx.save(); ctx.rotate(-0.5); T.outlined(ctx, (k) => T.rrect(k, -70, -60, 140, 34, 10), '#f2c9a0', { line: 6 }); ctx.restore(); }
    ctx.restore();
  }

  // ---------- region hook ----------
  const HOOK_KEYS = ['split', 'shatter', 'slash', 'engulf', 'peel', 'drift', 'wipe', 'annex', 'damage', 'surrender', 'fire'];
  const BARE = { face: null, label: null, strikeLabel: null, arms: null, conquer: null, whiteout: null, pulse: null };
  const DIRS = { top: [0, -1], bottom: [0, 1], left: [-1, 0], right: [1, 0] };
  const geoOf = (R, g) => { const pts = g.pts(R), bb = g.bbox(R); return { pts, bb, c: mean(pts), diag: Math.hypot(bb.w, bb.h) }; };
  const paintClip = (ctx, R, g, fill, clipFn) => { ctx.save(); ctx.beginPath(); clipFn(ctx); ctx.clip(); g.drawRegion(R, { ...BARE, halftone: false, fill }, ctx); ctx.restore(); };
  const squadWipes = (g, R) => (R.id ? list(g.L.squads).filter((Q) => Q.wipe && Q.wipe.region === R.id) : []);

  T.MAP_REGION_HOOKS.push((ctx, R, g, lt) => {
    const blotch = !!(R.conquer && R.conquer.pattern === 'blotch'), wipes = squadWipes(g, R);
    if (!(blotch || wipes.length || HOOK_KEYS.some((k) => R[k] != null) || newMood(R.face))) return false;
    if (R.conquer && R.conquer.pattern && !['flood', 'blotch'].includes(R.conquer.pattern)) throw new Error(`map region: unknown conquer.pattern "${R.conquer.pattern}"`);
    const grow = T.prog(lt, R.at ?? 0, R.dur ?? 1.2), fade = R.out != null ? 1 - T.prog(lt, R.out, R.outDur ?? 0.5) : 1;
    if (grow <= 0 || fade <= 0) return true; const geo = geoOf(R, g), b = baseState(R, g, lt), Sh = R.shatter;
    if (Sh && lt >= (Sh.at ?? 1) + (Sh.cracks ?? 0.4)) { shatter(ctx, R, g, lt, geo); return true; }
    if (R.split && lt >= (R.split.at ?? 1)) { split(ctx, R, g, lt, geo); afterFx(ctx, R, g, lt, geo); return true; }
    ctx.save(); ctx.translate(b.off[0], b.off[1]); ctx.globalAlpha *= b.alpha;
    g.drawRegion(R, { face: null, label: null, ...(blotch ? { conquer: null } : {}), ...(b.fill ? { fill: b.fill } : {}) }, ctx); const st = covers(ctx, R, g, lt, geo, blotch, wipes);
    if (Sh) cracks(ctx, R, g, lt, geo); if (R.slash) slashMarks(ctx, R, g, lt, geo); if (fade > 0.5) decor(ctx, R, g, lt, geo, st); ctx.restore();
    if (R.peel && R.peel.coins !== false) peelCoins(ctx, R, lt, geo, b.off); afterFx(ctx, R, g, lt, geo); return true;
  });
  function afterFx(ctx, R, g, lt, geo) { if (R.surrender) surrender(ctx, R, g, lt, geo); if (R.fire) borderFire(ctx, R, lt, geo); if (R.slash) spill(ctx, R, lt, geo); }

  // annex flashes (6 f per colour, hard switches), drift (slide then grey), peel (lift + fade)
  function baseState(R, g, lt) {
    let fill = null, off = [0, 0], alpha = 1; const A = R.annex;
    if (A && lt >= (A.at ?? 0.8)) { const cols = A.colors ?? ['#ff8a1a', '#ffd23a'], n = (A.flashes ?? 2) * cols.length, i = Math.floor((lt - (A.at ?? 0.8)) / (6 * FR) + 1e-6); fill = i < n ? cols[i % cols.length] : A.to ?? '#d0312d'; }
    const Dr = R.drift;
    if (Dr) { const at = Dr.at ?? 1, dur = Dr.dur ?? 2, e = T.ease.inOut(T.prog(lt, at, dur)), q = T.prog(lt, at + dur, 0.3);
      off = [(Dr.dx ?? -0.04) * g.mw * e, (Dr.dy ?? 0) * g.mh * e]; if (q > 0 && Dr.to !== null) fill = T.mix(fill ?? g.color(R, lt), Dr.to ?? '#4a4a4a', q); }
    const Pe = R.peel;
    if (Pe) { const e = T.ease.in(T.prog(lt, Pe.at ?? 2, Pe.dur ?? 0.5)); off = [off[0], off[1] - (Pe.lift ?? 12) * e]; alpha *= 1 - e; }
    return { fill, off, alpha };
  }
  function peelCoins(ctx, R, lt, geo, off) {
    const at = R.peel.at ?? 2, q = snap(lt, at, [0.4, 0.8, 1.1, 1]), gone = T.prog(lt, at + (R.peel.dur ?? 0.5) + 0.3, 0.2);
    if (q <= 0 || gone >= 1) return; ctx.save(); ctx.translate(geo.c[0] + off[0], geo.c[1] + off[1]); ctx.scale(q * (1 - gone), q * (1 - gone));
    for (const [x, y] of [[-34, 10], [0, 14], [34, 10], [-17, -8], [17, -8], [0, -26]]) T.outlined(ctx, (k) => k.ellipse(x, y, 26, 12, 0, 0, TAU), '#f2c21a', { line: 4, shade: (k) => { k.fillStyle = '#c8961a'; k.fillRect(x - 30, y + 2, 60, 14); } });
    ctx.restore();
  }

  // engulf (lid arc), wipe (circle / straight edge), blotch conquest and squad wipes recolour parts of the region.
  function covers(ctx, R, g, lt, geo, blotch, wipes) {
    const out = { done: false, gaze: null, shrink: 1 }, rp = (k) => T.smoothPath(k, geo.pts);
    const edge = (fn, w = 8) => { ctx.save(); ctx.beginPath(); rp(ctx); ctx.clip(); ctx.strokeStyle = P.ink; ctx.lineWidth = w; ctx.beginPath(); fn(ctx); ctx.stroke(); ctx.restore(); };
    const E = R.engulf;
    if (E) { const p = T.ease.outCubic(T.prog(lt, E.at ?? 1, E.dur ?? 0.5)); if (p > 0) { const dv = Array.isArray(E.dir) ? E.dir : DIRS[E.dir ?? 'top'];
        if (!dv) throw new Error(`map region engulf: unknown dir "${E.dir}"`);
        const l = Math.hypot(dv[0], dv[1]) || 1, u = [dv[0] / l, dv[1] / l], Rc = geo.diag * 1.4, d = T.lerp(Rc + geo.diag * 0.6, Rc - geo.diag, p), ox = geo.c[0] + u[0] * d, oy = geo.c[1] + u[1] * d;
        paintClip(ctx, R, g, colorOf(g, E.by, lt, '#d0312d'), (k) => k.arc(ox, oy, Rc, 0, TAU)); edge((k) => k.arc(ox, oy, Rc, 0, TAU), 10);
        Object.assign(out, { gaze: u, shrink: T.lerp(1, 0.8, p), done: p >= 1 }); }
    }
    const Wp = R.wipe;
    if (Wp) { const p = T.ease.inOut(T.prog(lt, Wp.at ?? 0, Wp.dur ?? 2)), o = Wp.from ? px(g, Wp.from) : geo.c, col = colorOf(g, Wp.by, lt, '#c3161f');
      if (p > 0 && (Wp.shape ?? 'circle') === 'circle') { const rad = Math.max(...geo.pts.map(([x, y]) => Math.hypot(x - o[0], y - o[1]))) * 1.05 * p;
        paintClip(ctx, R, g, col, (k) => k.arc(o[0], o[1], rad, 0, TAU)); if (p < 1) edge((k) => k.arc(o[0], o[1], rad, 0, TAU)); } else if (p > 0 && Wp.shape === 'line') {
        let n = [geo.c[0] - o[0], geo.c[1] - o[1]]; const l = Math.hypot(n[0], n[1]); n = l > 1 ? [n[0] / l, n[1] / l] : [1, 0];
        const pr = geo.pts.map(([x, y]) => (x - o[0]) * n[0] + (y - o[1]) * n[1]), d = T.lerp(Math.min(...pr) - 10, Math.max(...pr) + 10, p), ex = o[0] + n[0] * d, ey = o[1] + n[1] * d;
        paintClip(ctx, R, g, col, (k) => halfPlane(k, ex, ey, n[0], n[1])); if (p < 1) edge((k) => { k.moveTo(ex - n[1] * 4000, ey + n[0] * 4000); k.lineTo(ex + n[1] * 4000, ey - n[0] * 4000); });
      } else if (Wp.shape && Wp.shape !== 'circle' && Wp.shape !== 'line') throw new Error(`map region wipe: unknown shape "${Wp.shape}"`); }
    if (blotch) blotchFill(ctx, R, g, lt, geo, out);
    for (const Q of wipes) { const ld = squadLead(Q, g, lt); if (!ld.started) continue; const n = [Math.cos(ld.a), Math.sin(ld.a)], ex = ld.x - n[0] * 40, ey = ld.y - n[1] * 40;
      paintClip(ctx, R, g, Q.wipe.to ?? '#9a9a9a', (k) => halfPlane(k, ex, ey, n[0], n[1])); }
    return out;
  }
  function blotchFill(ctx, R, g, lt, geo, out) {
    const C = R.conquer, at = C.at ?? 1, dur = C.dur ?? 2, p = T.prog(lt, at, dur);
    if (lt < at) return; const seed = (R.id ?? 'r') + ':blotch', r = T.rng(T.hash(seed)), ch = C.chunk ? px(g, C.chunk) : scatter(geo.pts, 1, seed + 'c')[0] || geo.c;
    const spots = [[ch[0], ch[1], Math.max(geo.bb.w, geo.bb.h) * 0.15]].concat(scatter(geo.pts, C.blobs ?? 20, seed + 'b').map(([x, y]) => [x, y, 10 + r() * 30]));
    paintClip(ctx, R, g, colorOf(g, C.by, lt, P.red), (k) => { spots.forEach(([x, y, r0], i) => { const rr = p >= 1 ? geo.diag : r0 * (1 + p) + geo.diag * 0.36 * T.ease.inOut(p); T.smoothPath(k, T.blobPts(x, y, rr, rr, seed + i, 8, 0.3)); }); });
    if (C.rays && lt < at + dur + 0.5) {
      const figs = list(g.L.figures).map((f) => px(g, [f.x ?? 0.5, f.y ?? 0.5])), o = figs.length ? figs.reduce((a, q) => (Math.hypot(q[0] - ch[0], q[1] - ch[1]) < Math.hypot(a[0] - ch[0], a[1] - ch[1]) ? q : a)) : ch;
      ctx.save(); ctx.beginPath(); T.smoothPath(ctx, geo.pts); ctx.clip(); ctx.fillStyle = 'rgba(248,232,160,0.6)'; ctx.beginPath();
      for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU + lt * 6 * DEG; ctx.moveTo(o[0], o[1]); ctx.arc(o[0], o[1], geo.diag * 0.8, a, a + TAU / 30); }
      ctx.fill(); ctx.restore(); }
    out.done = out.done || p >= 1;
  }
  function decor(ctx, R, g, lt, geo, st) {
    const { bb, c } = geo, F = R.face, C = R.conquer;
    const conquered = st.done || (C && C.pattern !== 'blotch' && T.prog(lt, C.at ?? 1, C.dur ?? 0.8) >= 1);
    if (F) { let mood = T.timed(F.mood ?? 'neutral', lt).cur; if (conquered) mood = C?.mood ?? 'cry'; if (R.slash && lt >= (R.slash.at ?? 0.5)) mood = R.slash.mood ?? 'strain';
      const fx = c[0] + (R.faceOffset?.[0] ?? 0) * bb.w, fy = c[1] + (R.faceOffset?.[1] ?? 0) * bb.h;
      face3(ctx, fx, fy, Math.min(bb.w, bb.h) * (F.scale ?? 0.32) * st.shrink, F, mood, lt, { gaze: st.gaze, damage: R.damage, squash: conquered ? 0.7 : 1 }); }
    const lab = typeof R.label === 'string' ? { text: R.label } : R.label;
    if (lab) { const size = lab.size ?? R.labelSize ?? 64, dy = lab.dy ?? (F ? -size * 1.9 : 0), q = T.ease.outBack(T.prog(lt, lab.at ?? R.at ?? 0, 0.25));
      if (q > 0) { ctx.save(); ctx.translate(c[0], c[1] + dy); ctx.rotate((lab.tilt ?? 0) * DEG); ctx.scale(q, q); T.toonText(ctx, lab.text, 0, 0, { size, fill: lab.color ?? '#fff' }); ctx.restore(); }
    }
  }

  // split: blob pre-phase (4 f), crack, halves recolour (dur), drift apart (gap, 5 f outBack), own faces, punching arms.
  function splitGeo(R, g, geo) {
    const S = R.split, { bb } = geo;
    let line; if (S.line) line = S.line.map((p) => px(g, p)); else { const r = T.rng(T.hash((R.id ?? 'r') + ':split')), n = 6 + Math.floor(r() * 4), amp = bb.w * 0.06; line = [];
      for (let i = 0; i <= n; i++) line.push([geo.c[0] + (i === 0 || i === n ? 0 : (i % 2 ? 1 : -1) * amp * (0.6 + r() * 0.4)), bb.y - 30 + ((bb.h + 60) * i) / n]); }
    const a = line[0], b = line[line.length - 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, t = [(b[0] - a[0]) / l, (b[1] - a[1]) / l], nv = [t[1], -t[0]], B = 5000;
    const ext = [[a[0] - t[0] * B, a[1] - t[1] * B], ...line, [b[0] + t[0] * B, b[1] + t[1] * B]];
    const side = (s) => ext.concat([[ext[ext.length - 1][0] + nv[0] * B * s, ext[ext.length - 1][1] + nv[1] * B * s], [ext[0][0] + nv[0] * B * s, ext[0][1] + nv[1] * B * s]]);
    const half = (s) => { const q = geo.pts.filter(([x, y]) => ((x - a[0]) * nv[0] + (y - a[1]) * nv[1]) * s > 0); const m = q.length ? mean(q) : [geo.c[0] + nv[0] * s * bb.w * 0.25, geo.c[1] + nv[1] * s * bb.h * 0.25]; return [T.lerp(m[0], geo.c[0] + nv[0] * s * bb.w * 0.25, 0.3), m[1]]; };
    return { line: ext, sides: [side(1), side(-1)], hc: [half(1), half(-1)], nv };
  }
  function split(ctx, R, g, lt, geo) {
    const S = R.split, at = S.at ?? 1, blob = S.blob !== false, tb = blob ? at + 4 * FR : at, cols = S.colors ?? ['#e9a83a', '#6b3a8a'], base = g.color(R, lt);
    if (lt < tb) { g.drawRegion(R, { face: null, label: null }, ctx);
      paintClip(ctx, R, g, cols[0], (k) => k.arc(geo.c[0], geo.c[1], geo.diag * 0.6 * T.ease.out(T.prog(lt, at, 4 * FR)), 0, TAU)); return; }
    const sp = splitGeo(R, g, geo), dur = S.dur ?? 0.2, rq = T.prog(lt, tb, dur), gap = (S.gap ?? 0) * T.ease.outBack(T.prog(lt, tb + dur, 5 * FR));
    const fills = [blob ? cols[0] : T.mix(base, cols[0], rq), T.mix(blob ? cols[0] : base, cols[1], rq)], offs = [1, -1].map((s) => [sp.nv[0] * s * gap / 2, sp.nv[1] * s * gap / 2]);
    for (let i = 0; i < 2; i++) { ctx.save(); ctx.translate(offs[i][0], offs[i][1]); ctx.beginPath(); trace(ctx, sp.sides[i]); ctx.clip();
      g.drawRegion(R, { ...BARE, fill: fills[i] }, ctx); ctx.beginPath(); T.smoothPath(ctx, geo.pts); ctx.clip(); ctx.lineJoin = 'round';
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 14; polyline(ctx, sp.line); ctx.stroke(); ctx.strokeStyle = P.ink; ctx.lineWidth = 8; polyline(ctx, sp.line); ctx.stroke(); ctx.restore(); }
    const moods = S.faces ?? ['angry', 'angry'], fs = Math.min(geo.bb.w * 0.5, geo.bb.h) * (R.face?.scale ?? 0.32) * 0.8, hc = sp.hc.map((h, i) => [h[0] + offs[i][0], h[1] + offs[i][1]]);
    if (S.fight) { for (let i = 0; i < 2; i++) { const o = hc[1 - i], h = hc[i], dx = o[0] - h[0], dy = o[1] - h[1], l = Math.hypot(dx, dy) || 1, ph = (((frame(lt, tb + 0.3) + i * 3) % 6) + 6) % 6;
        if (lt < tb + 0.3) continue;
        const ext = ph < 2 ? (ph + 1) / 2 : ph < 4 ? 1 : (6 - ph) / 2, a = [h[0] + (dx / l) * fs * 0.5, h[1] + (dy / l) * fs * 0.5 + fs * 0.25], e = [a[0] + (dx / l) * l * 0.62 * ext, a[1] + (dy / l) * l * 0.62 * ext];
        tube(ctx, a, e, fills[i], 20); T.outlined(ctx, (k) => k.arc(e[0], e[1], 17, 0, TAU), '#fff', { line: 6 });
        if (ph === 2 || ph === 3) T.starburst(ctx, e[0] + (dx / l) * 18, e[1] + (dy / l) * 18, 12, 34, 8, 'spl' + i + frame(lt, 0), '#fff6c8', P.ink, 4); }
    }
    for (let i = 0; i < 2; i++) if (moods[i]) face3(ctx, hc[i][0], hc[i][1], fs, { at: tb }, moods[i], lt, { damage: i === 0 ? R.damage : null });
  }

  // shatter: crack lines grow (cracks s), then Voronoi pieces fly out, spin and drop (dur), fading over the last 4 f.
  const clipHalf = (poly, a, b) => {
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, nx = b[0] - a[0], ny = b[1] - a[1], f = (p) => (p[0] - mx) * nx + (p[1] - my) * ny, out = [];
    for (let i = 0; i < poly.length; i++) { const p = poly[i], q = poly[(i + 1) % poly.length], fp = f(p), fq = f(q); if (fp <= 0) out.push(p);
      if (fp <= 0 !== fq <= 0) { const t = fp / (fp - fq); out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]); }
    }
    return out;
  };
  function cellsOf(R, geo) {
    const n = Math.max(2, R.shatter.pieces ?? 12), { bb } = geo, seeds = scatter(geo.pts, n, (R.id ?? 'r') + ':sh', Math.sqrt((bb.w * bb.h) / n) * 0.55);
    const box = [[bb.x - 40, bb.y - 40], [bb.x + bb.w + 40, bb.y - 40], [bb.x + bb.w + 40, bb.y + bb.h + 40], [bb.x - 40, bb.y + bb.h + 40]];
    return seeds.map((s, i) => { let poly = box; seeds.forEach((o, j) => { if (j !== i && poly.length) poly = clipHalf(poly, s, o); }); return { poly, c: poly.length ? mean(poly) : s }; }).filter((cl) => cl.poly.length >= 3);
  }
  function cracks(ctx, R, g, lt, geo) {
    const Sh = R.shatter, p = T.ease.out(T.prog(lt, Sh.at ?? 1, Sh.cracks ?? 0.4));
    if (p <= 0) return; ctx.save(); ctx.beginPath(); T.smoothPath(ctx, geo.pts); ctx.clip(); ctx.beginPath(); ctx.arc(geo.c[0], geo.c[1], geo.diag * 0.7 * p, 0, TAU); ctx.clip();
    ctx.beginPath(); for (const cl of cellsOf(R, geo)) trace(ctx, cl.poly);
    ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(255,243,176,0.6)'; ctx.lineWidth = 8; ctx.stroke(); ctx.strokeStyle = '#1d1410'; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
  }
  function shatter(ctx, R, g, lt, geo) {
    const Sh = R.shatter, t = lt - (Sh.at ?? 1) - (Sh.cracks ?? 0.4), dur = Sh.dur ?? 0.5, p = T.ease.outCubic(T.prog(t, 0, dur));
    const a = Sh.keep ? 1 : 1 - T.prog(t, dur - 4 * FR, 4 * FR);
    if (Sh.bgStreaks) streaks(ctx, geo, lt); if (a <= 0) return; const r = T.rng(T.hash((R.id ?? 'r') + ':fly')), shadeC = T.shade(g.color(R, lt), -0.42), rp = (k) => T.smoothPath(k, geo.pts);
    ctx.save(); ctx.globalAlpha *= a; for (const cl of cellsOf(R, geo)) {
      const dx = cl.c[0] - geo.c[0], dy = cl.c[1] - geo.c[1], l = Math.hypot(dx, dy) || 1, dist = (Sh.spread ?? 160) * (0.4 + 0.6 * r()), rot = (r() * 2 - 1) * 25 * DEG;
      ctx.save(); ctx.translate(cl.c[0] + (dx / l) * dist * p, cl.c[1] + (dy / l) * dist * p + (Sh.fall ?? 30) * p * p); ctx.rotate(rot * p); ctx.translate(-cl.c[0], -cl.c[1]);
      ctx.save(); ctx.translate(0, 6); ctx.beginPath(); trace(ctx, cl.poly); ctx.clip(); ctx.beginPath(); rp(ctx); ctx.fillStyle = shadeC; ctx.fill(); ctx.restore();
      ctx.save(); ctx.beginPath(); trace(ctx, cl.poly); ctx.clip(); g.drawRegion(R, BARE, ctx);
      ctx.beginPath(); rp(ctx); ctx.clip(); ctx.beginPath(); trace(ctx, cl.poly); ctx.strokeStyle = P.ink; ctx.lineWidth = 6; ctx.stroke(); ctx.restore(); ctx.restore(); }
    ctx.restore();
  }
  function streaks(ctx, geo, lt) {
    const r = T.rng(T.hash('streaks' + twos(lt))), { bb } = geo;
    ctx.save(); ctx.beginPath(); T.smoothPath(ctx, geo.pts); ctx.clip(); ctx.fillStyle = '#2a0a0e'; ctx.fillRect(bb.x - 20, bb.y - 20, bb.w + 40, bb.h + 40);
    for (let i = 0; i < 16; i++) { ctx.fillStyle = ['#b8202a', '#7a1018', '#8fc59a'][i % 3]; ctx.fillRect(bb.x + r() * bb.w - 100, bb.y + r() * bb.h, 80 + r() * 260, 6 + r() * 12); }
    ctx.restore();
  }

  // slash: zig-zag stitches draw (8 f each), wounds open (3 f) and spill money / soldiers / drops on parabolas (1 s).
  const woundsOf = (R) => { const S = R.slash, t0 = (S.at ?? 0.5) + (S.stitches ?? 3) * 8 * FR + 0.1; return list(S.wounds ?? [{}]).map((w, j) => ({ x: w.x ?? 0.5, y: w.y ?? 0.55, at: w.at ?? t0 + j * 0.3, size: w.size ?? 1 })); };
  function slashMarks(ctx, R, g, lt, geo) {
    const S = R.slash, at = S.at ?? 0.5, r = T.rng(T.hash((R.id ?? 'r') + ':slash')), { bb } = geo;
    ctx.save(); ctx.beginPath(); T.smoothPath(ctx, geo.pts); ctx.clip(); ctx.lineJoin = 'miter'; ctx.lineCap = 'round';
    for (let i = 0; i < (S.stitches ?? 3); i++) { const p = T.prog(lt, at + i * 8 * FR, 8 * FR), ang = (r() * 2 - 1) * 0.5, cy = bb.y + bb.h * (0.2 + 0.6 * r()), cx = bb.x + bb.w * (0.35 + 0.3 * r());
      if (p <= 0) continue; const len = Math.max(bb.w, bb.h) * 1.2, n = Math.floor(len / 18), pts = [];
      for (let k = 0; k <= n; k++) { const u = (k / n - 0.5) * len, v = (k % 2 ? 1 : -1) * 10; pts.push([cx + Math.cos(ang) * u - Math.sin(ang) * v, cy + Math.sin(ang) * u + Math.cos(ang) * v]); }
      const cut = pts.slice(0, Math.max(2, Math.ceil(pts.length * p)));
      ctx.strokeStyle = P.ink; ctx.lineWidth = 8; polyline(ctx, cut); ctx.stroke(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; polyline(ctx, cut); ctx.stroke(); }
    for (const w of woundsOf(R)) { const q = T.prog(lt, w.at, 3 * FR), x = bb.x + w.x * bb.w, y = bb.y + w.y * bb.h, hw = 46 * w.size, hh = 18 * w.size * q;
      if (q > 0) T.outlined(ctx, (k) => { k.moveTo(x - hw, y); k.lineTo(x, y - hh); k.lineTo(x + hw, y); k.lineTo(x, y + hh); k.closePath(); }, '#2a1c15', { line: 3, ink: '#5a1010' }); }
    ctx.restore();
  }
  function spill(ctx, R, lt, geo) {
    const S = R.slash, kind = S.spill ?? 'money', { bb } = geo;
    if (kind === 'none') return; if (!['money', 'soldiers', 'blood'].includes(kind)) throw new Error(`map region slash: unknown spill "${kind}"`);
    woundsOf(R).forEach((w, j) => { const t = lt - w.at - 3 * FR, x0 = bb.x + w.x * bb.w, y0 = bb.y + w.y * bb.h, r = T.rng(T.hash((R.id ?? 'r') + ':spill' + j));
      if (t < 0 || t > 1.6) return; for (let i = 0; i < (S.count ?? 16); i++) {
        const vx = (r() < 0.5 ? -1 : 1) * (140 + r() * 220), vy = -(380 + r() * 300), rot0 = r() * TAU, age = t - i * 0.04; if (age < 0 || age > 1) continue;
        ctx.save(); ctx.translate(x0 + vx * age, y0 + vy * age + 450 * age * age); ctx.rotate(rot0 + frame(age, 0) * 10 * DEG);
        if (kind === 'money' && i % 3) { T.outlined(ctx, (k) => k.rect(-56, -28, 112, 56), '#8cc46a', { line: 5 }); ctx.strokeStyle = '#4a8a3a'; ctx.lineWidth = 4; ctx.strokeRect(-44, -18, 88, 36);
          ctx.font = T.font(34); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2e6a2a'; ctx.fillText('$', 0, 2); }
        else if (kind === 'money') T.outlined(ctx, (k) => k.arc(0, 0, 22, 0, TAU), '#f2c21a', { line: 4, shade: (k) => { k.fillStyle = '#c8961a'; k.fillRect(-24, 6, 48, 20); } }); else if (kind === 'soldiers') { ctx.rotate(-rot0); T.mapIcon(ctx, 'helmet', 50, lt, {}); }
        else { ctx.fillStyle = '#c8202a'; ctx.beginPath(); ctx.ellipse(0, 0, 12, 18, 0, 0, TAU); ctx.fill(); }
        ctx.restore(); }
    });
  }
  // surrender: a tube arm rises from the region (6 f outBack) and waves a white flag on twos.
  function surrender(ctx, R, g, lt, geo) {
    const S = R.surrender, q = T.ease.outBack(T.prog(lt, S.at ?? 1, 6 * FR)), { bb, c } = geo, side = S.side ?? 1, k = S.size ?? 1;
    if (q <= 0) return; const a = [c[0] + side * bb.w * 0.28, c[1] + bb.h * 0.05], h = [a[0] + side * 40 * k * q, a[1] - (bb.h * 0.3 + 70) * k * q]; tube(ctx, a, h, g.color(R, lt), 22 * k);
    ctx.save(); ctx.translate(h[0], h[1]); ctx.scale(k, k);
    ctx.strokeStyle = P.ink; ctx.lineWidth = 12; polyline(ctx, [[0, 20], [0, -120]]); ctx.stroke(); ctx.strokeStyle = '#a8763a'; ctx.lineWidth = 6; ctx.stroke();
    const wv = (twos(lt) % 2 ? 1 : -1) * 8 * DEG;
    ctx.translate(0, -118); ctx.rotate(wv);
    T.outlined(ctx, (k2) => { k2.moveTo(0, 0); k2.quadraticCurveTo(30, -10, 60, 4); k2.lineTo(58, 44); k2.quadraticCurveTo(30, 32, 0, 42); k2.closePath(); }, '#fbfaf4', { line: 5 });
    ctx.rotate(-wv); T.outlined(ctx, (k2) => k2.arc(0, 118, 18, 0, TAU), '#fff', { line: 6 }); ctx.restore();
  }
  // border fire: flipbook flames every `every` px along the outline with black smoke above.
  function borderFire(ctx, R, lt, geo) {
    const Fi = R.fire, at = Fi.at ?? 1, size = Fi.size ?? 54;
    if (lt < at) return; const spots = resample(geo.pts, Fi.every ?? 60);
    spots.forEach(([x, y], i) => { if (i % 5 === 0 && lt >= at + i * 0.03) smoke(ctx, x, y - size * 1.3, lt, { size: size * 1.5, seed: (R.id ?? 'r') + 'sm' + i }); });
    spots.forEach(([x, y], i) => { if (lt < at + i * 0.03) return; ctx.save(); ctx.translate(x, y + 6); T.drawFlame(ctx, size * (0.8 + 0.1 * (i % 5)), lt + i * 0.07, (R.id ?? 'r') + 'bf' + i); ctx.restore(); });
  }

  // ---------- icons ----------
  const ol = (ctx, fn, fill, line) => T.outlined(ctx, fn, fill, { line });
  Object.assign(ICONS, {
    fort(ctx, s, lt, o) { const c = o.color ?? '#b07a4a', w = s * 0.5, h = s * 0.42;
      ol(ctx, (k) => { k.moveTo(-w, 0); k.lineTo(-w, -h); for (let i = 0; i < 5; i++) { const x = -w + (i * 2 * w) / 5; k.lineTo(x, -h - s * 0.14); k.lineTo(x + w / 5, -h - s * 0.14); k.lineTo(x + w / 5, -h); k.lineTo(x + (2 * w) / 5, -h); } k.lineTo(w, 0); k.closePath(); }, c, s * 0.06);
      ol(ctx, (k) => { k.moveTo(-s * 0.1, 0); k.lineTo(-s * 0.1, -s * 0.16); k.arc(0, -s * 0.16, s * 0.1, Math.PI, 0); k.lineTo(s * 0.1, 0); k.closePath(); }, '#3a2a22', s * 0.04); },
    camp: (ctx, s, lt, o) => campStyle('camp', ctx, s, lt, o),
    formation: (ctx, s, lt, o) => campStyle('formation', ctx, s, lt, o),
    factory(ctx, s, lt) {
      for (const x of [0.12, 0.32]) { ol(ctx, (k) => k.rect(x * s, -s * 0.75, s * 0.12, s * 0.5), '#8a5a4a', s * 0.04); if (lt != null) T.smokePuffs(ctx, x * s + s * 0.06, -s * 0.8, lt, { n: 3, size: s * 0.1, rise: s * 0.5, seed: 'fac' + x, color: '#9a948c', drift: -s * 0.2 }); }
      ol(ctx, (k) => { k.moveTo(-s * 0.5, 0); k.lineTo(-s * 0.5, -s * 0.3); for (let i = 0; i < 3; i++) { const x = -s * 0.5 + i * s * 0.22; k.lineTo(x + s * 0.22, -s * 0.48); k.lineTo(x + s * 0.22, -s * 0.3); } k.lineTo(s * 0.5, -s * 0.3); k.lineTo(s * 0.5, 0); k.closePath(); }, '#b8695a', s * 0.05);
      ctx.fillStyle = '#ffe08a'; for (const x of [-0.38, -0.16, 0.06, 0.28]) ctx.fillRect(x * s, -s * 0.2, s * 0.1, s * 0.1); },
    derrick(ctx, s) { ctx.strokeStyle = P.ink; ctx.lineWidth = s * 0.07; ctx.lineJoin = 'round'; const leg = [[-s * 0.3, 0], [-s * 0.06, -s * 0.9], [s * 0.06, -s * 0.9], [s * 0.3, 0]];
      polyline(ctx, leg); ctx.stroke(); ctx.strokeStyle = '#5a5a60'; ctx.lineWidth = s * 0.035; ctx.stroke();
      ctx.beginPath(); for (let i = 1; i < 4; i++) { const y = -s * 0.22 * i, w = s * (0.3 - 0.06 * i); ctx.moveTo(-w, y); ctx.lineTo(w, y - s * 0.22); ctx.moveTo(w, y); ctx.lineTo(-w, y - s * 0.22); } ctx.stroke();
      ol(ctx, (k) => T.rrect(k, -s * 0.42, -s * 0.06, s * 0.84, s * 0.12, s * 0.03), '#2a2420', s * 0.04); },
    plane(ctx, s, lt) { ol(ctx, (k) => { k.ellipse(0, 0, s * 0.5, s * 0.1, 0, 0, TAU); }, '#8a9a6a', s * 0.05);
      ol(ctx, (k) => { k.moveTo(-s * 0.1, -s * 0.04); k.lineTo(s * 0.12, -s * 0.04); k.lineTo(s * 0.02, -s * 0.42); k.lineTo(-s * 0.1, -s * 0.42); k.closePath(); }, '#7a8a5a', s * 0.05);
      ol(ctx, (k) => { k.moveTo(-s * 0.5, 0); k.lineTo(-s * 0.56, -s * 0.22); k.lineTo(-s * 0.42, -s * 0.06); k.closePath(); }, '#7a8a5a', s * 0.04);
      ctx.strokeStyle = P.ink; ctx.lineWidth = s * 0.05; const b = (twos(lt ?? 0) % 2 ? 1 : -1) * s * 0.18; polyline(ctx, [[s * 0.52, -b], [s * 0.52, b]]); ctx.stroke(); },
    'church-hut'(ctx, s) { ol(ctx, (k) => k.rect(-s * 0.32, -s * 0.32, s * 0.5, s * 0.32), '#e8dcc0', s * 0.05);
      ol(ctx, (k) => { k.moveTo(-s * 0.38, -s * 0.3); k.lineTo(-s * 0.07, -s * 0.56); k.lineTo(s * 0.24, -s * 0.3); k.closePath(); }, '#8a4a2a', s * 0.05);
      ol(ctx, (k) => k.rect(s * 0.14, -s * 0.62, s * 0.18, s * 0.62), '#e8dcc0', s * 0.05);
      ol(ctx, (k) => { k.moveTo(s * 0.1, -s * 0.6); k.lineTo(s * 0.23, -s * 0.8); k.lineTo(s * 0.36, -s * 0.6); k.closePath(); }, '#8a4a2a', s * 0.05);
      ctx.strokeStyle = P.ink; ctx.lineWidth = s * 0.035; polyline(ctx, [[s * 0.23, -s * 0.8], [s * 0.23, -s * 0.96]]); ctx.stroke(); polyline(ctx, [[s * 0.17, -s * 0.9], [s * 0.29, -s * 0.9]]); ctx.stroke();
      ctx.fillStyle = '#3a2a22'; ctx.fillRect(-s * 0.12, -s * 0.18, s * 0.1, s * 0.18); },
    rubble(ctx, s) {
      ol(ctx, (k) => { k.moveTo(-s * 0.36, 0); k.lineTo(-s * 0.36, -s * 0.36); k.lineTo(-s * 0.26, -s * 0.3); k.lineTo(-s * 0.2, -s * 0.44); k.lineTo(-s * 0.12, -s * 0.18); k.lineTo(-s * 0.1, 0); k.closePath(); }, '#b0a594', s * 0.05);
      for (let i = 0; i < 6; i++) { const x = (i - 2.5) * s * 0.14, r = s * (0.09 + (i % 3) * 0.03); T.outlined(ctx, (k) => T.smoothPath(k, T.blobPts(x, -r * 0.6, r, r * 0.7, 'rub' + i, 7, 0.3)), ['#8e8578', '#a89c8a', '#7a7064'][i % 3], { line: s * 0.04 }); }
    },
  });
  // camp styles: palisade ring, camp ellipse of dot soldiers, formation block with standards, blob of helmets
  function campStyle(style, ctx, s, lt, o) {
    const col = o.color ?? '#c3161f', r = T.rng(T.hash('camp' + style)), flagAt = (x, y, k = 0.5) => { ctx.save(); ctx.translate(x, y); ICONS.flag(ctx, s * k, lt, { color: col }); ctx.restore(); };
    if (style === 'palisade') { T.outlined(ctx, (k) => k.ellipse(0, 0, s * 0.55, s * 0.3, 0, 0, TAU), '#6a4a2a', { line: s * 0.05 });
      ctx.fillStyle = '#3a2416'; for (let i = 0; i < 26; i++) { const a = (i / 26) * TAU; ctx.beginPath(); ctx.arc(Math.cos(a) * s * 0.45, Math.sin(a) * s * 0.22, s * 0.035, 0, TAU); ctx.fill(); }
      for (let i = 0; i < 5; i++) { const a = Math.PI + (i / 4) * Math.PI, x = Math.cos(a) * s * 0.48, y = Math.sin(a) * s * 0.25; ol(ctx, (k) => { k.moveTo(x - s * 0.03, y); k.lineTo(x - s * 0.03, y - s * 0.2); k.lineTo(x, y - s * 0.27); k.lineTo(x + s * 0.03, y - s * 0.2); k.lineTo(x + s * 0.03, y); k.closePath(); }, '#8a5a2a', s * 0.025); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y - s * 0.24, s * 0.022, 0, TAU); ctx.fill(); }
    } else if (style === 'camp' || style === 'blob') {
      if (style === 'camp') { ctx.fillStyle = '#3a2a20'; ctx.beginPath(); ctx.ellipse(0, 0, s * 0.6, s * 0.3, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#1d1410'; for (let i = 0; i < 28; i++) { const a = r() * TAU, d = Math.sqrt(r()); ctx.beginPath(); ctx.arc(Math.cos(a) * d * s * 0.52, Math.sin(a) * d * s * 0.24, s * 0.04, 0, TAU); ctx.fill(); } }
      else { T.drawCloud(ctx, 0, -s * 0.1, s * 1.1, s * 0.6, 'campblob', { line: 4, boil: lt }); for (let i = 0; i < 9; i++) { ctx.save(); ctx.translate((i % 5 - 2) * s * 0.18 + (i > 4 ? s * 0.09 : 0), -s * 0.2 + (i > 4 ? s * 0.12 : 0)); T.mapIcon(ctx, 'helmet', s * 0.2, lt, {}); ctx.restore(); } }
    } else if (style === 'formation') {
      ol(ctx, (k) => { k.moveTo(-s * 0.55, s * 0.12); k.lineTo(-s * 0.42, -s * 0.16); k.lineTo(s * 0.55, -s * 0.16); k.lineTo(s * 0.42, s * 0.12); k.closePath(); }, '#3a2e26', s * 0.04);
      ctx.fillStyle = '#120c09'; for (let y = -s * 0.1; y < s * 0.1; y += s * 0.075) for (let x = -s * 0.44; x < s * 0.44; x += s * 0.075) { ctx.beginPath(); ctx.arc(x + (y + s * 0.1) * -0.4, y, s * 0.022, 0, TAU); ctx.fill(); }
      for (const x of [-0.3, 0, 0.3]) { ctx.strokeStyle = P.ink; ctx.lineWidth = s * 0.03; polyline(ctx, [[x * s, -s * 0.1], [x * s, -s * 0.55]]); ctx.stroke(); ol(ctx, (k) => k.rect(x * s, -s * 0.55, s * 0.14, s * 0.12), col, s * 0.025); }
      return; } else throw new Error(`map camp: unknown style "${style}"`); for (let i = 0; i < (o.flags ?? 2); i++) flagAt((i - ((o.flags ?? 2) - 1) / 2) * s * 0.35, -s * 0.12);
  }

  // ---------- figures (upright cast beans with a sticker rim) ----------
  const SAFE = 0.035, FIG_TOP = 1.3; // title-safe margin (frame fraction); bean height incl. headwear in units of S
  const walkWin = (Fg) => (Fg.walk ? Fg.walk : [(Fg.at ?? 0) + 0.3, (Fg.at ?? 0) + 2.3]);
  function figPos(Fg, lt) {
    let x = Fg.x ?? 0.5, y = Fg.y ?? 0.5, flip = !!Fg.flip, moving = false, p = 0; if (Fg.path && Fg.path.length >= 2) { const w = walkWin(Fg); p = T.prog(lt, w[0], w[1] - w[0]);
      const pa = T.pathAt(Fg.path, p); x = pa.x; y = pa.y; moving = lt > w[0] && lt < w[1]; if (Math.cos(pa.a) < -0.01) flip = !flip;
    }
    return { x, y, flip, moving, p };
  }
  function sticker(ctx, S, paint, rim = 6) {
    const q = viewScale(ctx), bx = -0.9 * S, by = -1.35 * S, pad = Math.ceil(rim * q) + 2, cw = Math.ceil(1.8 * S * q) + pad * 2, ch = Math.ceil(1.65 * S * q) + pad * 2;
    if (cw > 4096 || ch > 4096 || cw < 8) { paint(ctx); return; }
    const [c1, k1] = T.scratch('mx3fig', cw, ch);
    k1.clearRect(0, 0, cw, ch); k1.setTransform(q, 0, 0, q, pad - bx * q, pad - by * q); paint(k1); k1.setTransform(1, 0, 0, 1, 0, 0); const [c2, k2] = T.scratch('mx3stk', cw, ch), r = rim * q;
    k2.clearRect(0, 0, cw, ch); for (let i = 0; i < 12; i++) k2.drawImage(c1, Math.cos((i / 12) * TAU) * r, Math.sin((i / 12) * TAU) * r);
    k2.globalCompositeOperation = 'source-in'; k2.fillStyle = '#fff'; k2.fillRect(0, 0, cw, ch); k2.globalCompositeOperation = 'source-over'; k2.drawImage(c1, 0, 0);
    ctx.drawImage(c2, bx - pad / q, by - pad / q, cw / q, ch / q);
  }
  function seat(ctx, kind, S, front) {
    const s = S / 600;
    if (kind === 'throne' && !front) { ol(ctx, (k) => T.rrect(k, -170 * s, -620 * s, 340 * s, 520 * s, 40 * s), '#e2b23a', 7 * s);
      ol(ctx, (k) => T.rrect(k, -125 * s, -575 * s, 250 * s, 440 * s, 30 * s), '#a8202a', 6 * s); ol(ctx, (k) => k.rect(-200 * s, -190 * s, 400 * s, 190 * s), '#7a4a24', 7 * s);
    } else if (kind === 'throne') { for (const d of [-1, 1]) ol(ctx, (k) => T.rrect(k, d * 175 * s - 30 * s, -260 * s, 60 * s, 130 * s, 18 * s), '#e2b23a', 6 * s); }
    else if (kind === 'deckchair' && !front) {
      ctx.strokeStyle = P.ink; ctx.lineWidth = 18 * s; polyline(ctx, [[-200 * s, 0], [120 * s, -460 * s]]); ctx.stroke(); polyline(ctx, [[180 * s, 0], [-60 * s, -200 * s]]); ctx.stroke();
      ctx.strokeStyle = '#a8763a'; ctx.lineWidth = 10 * s; polyline(ctx, [[-200 * s, 0], [120 * s, -460 * s]]); ctx.stroke(); polyline(ctx, [[180 * s, 0], [-60 * s, -200 * s]]); ctx.stroke();
      ol(ctx, (k) => { k.moveTo(-170 * s, -150 * s); k.lineTo(100 * s, -470 * s); k.lineTo(170 * s, -420 * s); k.lineTo(-60 * s, -120 * s); k.closePath(); }, '#e8563a', 6 * s);
    } else if (kind === 'bed' && !front) {
      ol(ctx, (k) => k.rect(-330 * s, -170 * s, 660 * s, 170 * s), '#8a5a2a', 7 * s); ol(ctx, (k) => k.rect(-330 * s, -330 * s, 50 * s, 330 * s), '#8a5a2a', 7 * s);
      ol(ctx, (k) => T.rrect(k, -290 * s, -270 * s, 150 * s, 90 * s, 30 * s), '#ffffff', 6 * s);
    } else if (kind === 'bed') ol(ctx, (k) => T.rrect(k, -150 * s, -230 * s, 470 * s, 120 * s, 30 * s), '#d8d0c4', 6 * s);
    else if (!['throne', 'deckchair', 'bed'].includes(kind)) throw new Error(`map figure: unknown sit "${kind}"`);
  }
  function drawFigure(ctx, Fg, g, lt) {
    const at = Fg.at ?? 0;
    if (lt < at || (Fg.out != null && lt > Fg.out + 3 * FR)) return; const pos = figPos(Fg, lt), [x, y, s] = g.project(pos.x, pos.y); if (!(s > 0.01)) return;
    const f = fbox(g), safe = f.y0 + SAFE * H, en = Fg.enter ?? 'pop'; let S = (Fg.scale ?? 0.32) * H * s;
    if (Fg.fit !== false && y - S * FIG_TOP < safe) S = Math.max(S * 0.45, (y - safe) / FIG_TOP); // keep the head inside the safe frame
    let sx = 1, sy = 1, dy = 0; if (en === 'pop') sx = sy = snap(lt, at, [0.25, 0.6, 1]); else if (en === 'stretch') { sy = snap(lt, at, [0.3, 1.15, 1]); sx = snap(lt, at, [1.25, 0.94, 1]); }
    else if (en === 'drop') { const q = T.prog(lt, at, 6 * FR); dy = -(1 - T.ease.in(q)) * H * 0.6; if (q >= 1) { sy = snap(lt, at + 6 * FR, [0.8, 1.08, 1]); sx = 2 - sy; } }
    else if (en !== 'none') throw new Error(`map figure: unknown enter "${en}"`); if (Fg.out != null && lt > Fg.out) { const k = snap(lt, Fg.out, [0.6, 0.25, 0]); sx *= k; sy *= k; }
    const yk = Fg.yank != null && lt > Fg.yank ? T.ease.in(T.prog(lt, Fg.yank, 3 * FR)) * (y - f.y0 + S * 1.5) : 0; dy -= yk; if (sx <= 0 || sy <= 0) return;
    if (Fg.hover) dy += Math.sin((twos(lt - at) / 15 / 0.8) * TAU) * 3 - 6; ctx.save(); ctx.translate(x, y);
    if (Fg.shadow !== false && !Fg.hover && Fg.yank == null) { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(4, 6, S * 0.24 * sx, S * 0.05 * sx, 0, 0, TAU); ctx.fill(); }
    ctx.translate(0, dy); ctx.scale(sx * (pos.flip ? -1 : 1), sy);
    const Ly = { ...Fg, size: S, pose: Fg.pose ?? (Fg.sit === 'bed' ? 'lie' : Fg.sit ? 'sit' : undefined), walk: Fg.path || Fg.walk ? [walkWin(Fg)] : undefined, flip: undefined, move: undefined };
    const paint = (k) => { if (Fg.sit) seat(k, Fg.sit, S, false); T.layers.bean(k, Ly, lt, g.env); if (Fg.sit) seat(k, Fg.sit, S, true); };
    if (Fg.sticker === false) paint(ctx); else sticker(ctx, S, paint, Fg.rim ?? 6); ctx.restore();
    if (Fg.strings) puppetBar(ctx, x, y, dy, S, sy, Math.max(safe + 30, y - S * FIG_TOP - 170) - yk);
  }
  // Marionette control: a wooden cross held above the figure, strings to the hands and head.
  function puppetBar(ctx, x, y, dy, S, sy, barY) {
    const bw = Math.max(110, S * 0.75); ctx.strokeStyle = '#2a1c15'; ctx.lineWidth = 2.5;
    for (const [hx, hy] of [[-0.34, -0.48], [0, -0.95], [0.34, -0.48]]) { ctx.beginPath(); ctx.moveTo(x + hx * bw * 2.6, barY); ctx.lineTo(x + hx * S, y + dy + hy * S * sy); ctx.stroke(); }
    T.outlined(ctx, (k) => T.rrect(k, x - bw, barY - 10, bw * 2, 20, 6), '#a8763a', { line: 5 });
    T.outlined(ctx, (k) => T.rrect(k, x - 11, barY - 60, 22, 110, 6), '#8a5a2a', { line: 5 });
  }
  function drawFigures(ctx, figs, g, lt) {
    list(figs).map((Fg) => { const p = figPos(Fg, lt); return [Fg, g.project(p.x, p.y)[1]]; }).sort((a, b) => a[1] - b[1]).forEach(([Fg]) => drawFigure(ctx, Fg, g, lt));
  }
  // Territory painted behind a walker: a lobe every `every` frames at the foot point, union outlined, own side band.
  function paintTrail(ctx, Fg, g, lt) {
    const Pn = Fg.paint, w = walkWin(Fg);
    if (!Pn || !Fg.path || lt < w[0]) return;
    const every = (Pn.every ?? 5) * FR, n = Math.floor((Math.min(lt, w[1]) - w[0]) / every) + 1, rr = Pn.r ?? [0.03, 0.06], r = T.rng(T.hash((Fg.id ?? Fg.who ?? 'fig') + ':paint')), lobes = [];
    for (let i = 0; i < n; i++) { const pa = T.pathAt(Fg.path, T.prog(w[0] + i * every, w[0], w[1] - w[0])); lobes.push([g.X(pa.x), g.Y(pa.y), T.lerp(rr[0], rr[1], r()) * g.mw]); }
    const path = (k) => { k.beginPath(); for (const [x, y, rad] of lobes) { k.moveTo(x + rad, y); k.arc(x, y, rad, 0, TAU); } }, col = Pn.color ?? '#c3161f';
    ctx.save();
    if (Pn.clip) { ctx.beginPath(); for (const id of list(Pn.clip)) { const R = g.byId[id]; if (!R) throw new Error(`map figure paint: unknown clip region "${id}"`); T.smoothPath(ctx, g.pts(R)); } ctx.clip(); }
    ctx.save(); ctx.translate(0, g.st.extrude + 2); path(ctx); ctx.fillStyle = T.shade(col, -0.42); ctx.fill(); ctx.restore();
    path(ctx); ctx.lineWidth = 10; ctx.strokeStyle = P.ink; ctx.stroke(); path(ctx); ctx.fillStyle = col; ctx.fill(); ctx.restore();
  }
  OV.figures = (ctx, figs, g, lt) => { for (const Fg of list(figs)) paintTrail(ctx, Fg, g, lt); if (!g.view) drawFigures(ctx, figs, g, lt); };

  // ---------- arrows ----------
  // Big outlined word riding on the shaft (reference: white letters with a dark rim, about as tall as the arrow is thick).
  function shaftLabel(ctx, pts, text, size, fill) {
    const m = T.pathAt(pts, 0.5); let a = m.a, len = 0; for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (a > Math.PI / 2 || a < -Math.PI / 2) a += Math.PI; ctx.save(); ctx.font = T.font(size, 900); const tw = ctx.measureText(text).width, k = Math.min(1, (len * 0.62) / (tw || 1));
    const sz = Math.max(LABEL_MIN, size * k); ctx.translate(m.x, m.y); ctx.rotate(a);
    T.toonText(ctx, text, 0, sz * 0.36, { size: sz, fill, shadow: false, stroke: sz * 0.24 }); ctx.restore();
  }
  const LABEL_MIN = 34, ARROW_W = { flat: 62, block: 72, hook: 24 };
  OV.arrows = (ctx, arr, g, lt) => {
    for (const A of list(arr)) { const at = A.at ?? 0, style = A.style ?? 'flat';
      if (!['flat', 'block', 'hook'].includes(style)) throw new Error(`map arrow: unknown style "${style}"`); if (lt < at || (A.out != null && lt > A.out)) continue;
      let a = ptOf(g, A.from), b = ptOf(g, A.to);
      const trim = A.trim ?? (typeof A.from === 'string' || typeof A.to === 'string' ? 0.08 : 0), dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
      a = [a[0] + dx * trim, a[1] + dy * trim]; b = [b[0] - dx * trim, b[1] - dy * trim];
      const bend = (A.bend ?? 0.06) * len, mx = (a[0] + b[0]) / 2 + (dy / len) * bend, my = (a[1] + b[1]) / 2 - (dx / len) * bend; let pts = [];
      for (let i = 0; i <= 10; i++) { const u = i / 10, v = 1 - u; pts.push([v * v * a[0] + 2 * u * v * mx + u * u * b[0], v * v * a[1] + 2 * u * v * my + u * u * b[1]]); }
      let sc = 1; const fr = (lt - at) * 30, c = pts[5]; if (A.draw) { const p = T.ease.inOut(T.prog(lt, at, A.draw)); if (p < 0.08) continue; pts = partial(pts, p); }
      else sc = fr < 4 ? T.ease.outCubic(fr / 4) * 1.1 : fr < 6 ? T.lerp(1.1, 1, (fr - 4) / 2) : 1; if (A.pulse) sc *= 1 + 0.03 * Math.sin((lt - at) * TAU); if (sc <= 0.02) continue;
      const fill = A.color ?? (style === 'block' ? '#c03030' : style === 'hook' ? '#ffffff' : '#e8502a'), w = A.width ?? ARROW_W[style], ls = A.labelSize ?? Math.max(56, w * 1.05);
      ctx.save(); ctx.translate(c[0], c[1]); ctx.scale(sc, sc); ctx.translate(-c[0], -c[1]); if (style === 'flat') {
        T.drawThickArrow(ctx, pts, { w, head: A.head ?? w * 2.05, fill, shade: T.shade(fill, -0.2), double: A.double, line: 5 });
        if (A.label) shaftLabel(ctx, pts, A.label, ls, A.labelColor ?? '#fff'); } else if (style === 'block') {
        ctx.save(); ctx.translate(0, A.depth ?? 12); T.drawThickArrow(ctx, pts, { w, fill: T.shade(fill, -0.42), shade: false, double: A.double, line: 5 }); ctx.restore();
        T.drawThickArrow(ctx, pts, { w, fill, shade: false, double: A.double, line: 5 }); if (A.label) shaftLabel(ctx, pts, A.label, ls, A.labelColor ?? '#fff'); } else {
        const e = pts[pts.length - 1], p2 = pts[pts.length - 2], ang = Math.atan2(e[1] - p2[1], e[0] - p2[0]), hd = A.head ?? w * 2.4;
        const vee = [[e[0] - Math.cos(ang - 0.6) * hd, e[1] - Math.sin(ang - 0.6) * hd], e, [e[0] - Math.cos(ang + 0.6) * hd, e[1] - Math.sin(ang + 0.6) * hd]];
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        for (const [col, lw] of [[P.ink, w + 12], [fill, w]]) { ctx.strokeStyle = col; ctx.lineWidth = lw; polyline(ctx, pts); ctx.stroke(); polyline(ctx, vee); ctx.stroke(); }
        if (A.label) shaftLabel(ctx, pts, A.label, A.labelSize ?? Math.max(56, w * 2.4), A.labelColor ?? '#fff'); }
      ctx.restore(); }
  };

  // ---------- brawls and scattered fires (upright) ----------
  function ownBrawl(ctx, size, lt, seed) {
    const r = T.rng(T.hash(seed)), b = T.rng(T.hash(seed + ':' + twos(lt)));
    ctx.lineCap = 'round'; for (let i = 0; i < 3; i++) { const a = ((i + r() * 0.5) / 3) * TAU + (b() - 0.5) * 50 * DEG, l = size * (0.5 + r() * 0.12), e = [Math.cos(a) * l, Math.sin(a) * l * 0.8];
      tube(ctx, [0, 0], e, '#f4f1ea', size * 0.07); T.outlined(ctx, (k) => k.arc(e[0], e[1], size * 0.085, 0, TAU), '#fff', { line: 4 }); }
    T.drawCloud(ctx, 0, 0, size, size * 0.72, seed, { boil: lt, count: 8, line: 4 });
    for (let i = 0; i < 2; i++) T.starburst(ctx, (b() - 0.5) * size * 0.8, -size * 0.28 - b() * size * 0.12, size * 0.04, size * 0.1, 5, seed + 'st' + i + twos(lt), '#ffe14a', P.ink, 3);
    ctx.strokeStyle = P.ink; ctx.lineWidth = size * 0.035;
    for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(d * size * 0.18, -size * 0.1); ctx.lineTo(d * size * 0.06, -size * 0.04); ctx.stroke(); }
    T.outlined(ctx, (k) => T.rrect(k, -size * 0.12, size * 0.04, size * 0.24, size * 0.09, size * 0.02), '#fff', { line: 3 });
    ctx.beginPath(); for (const x of [-0.04, 0.04]) { ctx.moveTo(x * size, size * 0.04); ctx.lineTo(x * size, size * 0.13); } ctx.lineWidth = 2; ctx.stroke();
  }
  OV.brawls = upright((ctx, arr, g, lt) => {
    for (const B of list(arr)) { const at = B.at ?? 0, fade = B.out != null ? 1 - T.prog(lt, B.out, B.outDur ?? 0.6) : 1, size = B.size ?? 170;
      if (lt < at || fade <= 0) continue; const seed = 'brawl' + (B.id ?? B.region ?? ''), spots = scatter(areaPts(g, B, 'brawls'), B.count ?? 9, seed, size * 0.55);
      ctx.save(); ctx.globalAlpha *= fade; spots.map((p, i) => [i, up(g, p[0], p[1])]).sort((a, b) => a[1][1] - b[1][1]).forEach(([i, [x, y, s]]) => {
        const k = snap(lt, at + i * (B.every ?? 0.06), [0.3, 0.7, 1.12, 1]), j = T.rng(T.hash(seed + i + ':' + twos(lt))); if (k <= 0 || !(s > 0.01)) return;
        ctx.save(); ctx.translate(x + (j() - 0.5) * 6, y - size * 0.3 * s + (j() - 0.5) * 6); ctx.scale(k * s, k * s);
        if (T.drawBrawl) T.drawBrawl(ctx, 0, 0, size, lt, seed + i, { limbs: 3, stars: 2, face: true }); else ownBrawl(ctx, size, lt, seed + i); ctx.restore(); }); ctx.restore(); }
  });
  OV.fires = upright((ctx, arr, g, lt) => {
    for (const Fi of list(arr)) { const at = Fi.at ?? 0, size = Fi.size ?? 84, fade = Fi.out != null ? 1 - T.prog(lt, Fi.out, Fi.outDur ?? 0.5) : 1, seed = 'fires' + (Fi.id ?? Fi.region ?? '');
      if (lt < at || fade <= 0) continue; ctx.save(); ctx.globalAlpha *= fade;
      scatter(areaPts(g, Fi, 'fires'), Fi.count ?? 18, seed, size * 0.6).map((p, i) => [i, up(g, p[0], p[1])]).sort((a, b) => a[1][1] - b[1][1]).forEach(([i, [x, y, s]]) => {
        const q = snap(lt, at + i * (Fi.every ?? 0.08), [0.4, 0.8, 1]); if (q <= 0 || !(s > 0.01)) return; ctx.save(); ctx.translate(x, y); ctx.scale(s * q, s * q);
        if (Fi.smoke !== false && i % 3 === 0) smoke(ctx, 0, -size * 1.2, lt, { size: size * 1.2, seed: seed + 's' + i });
        T.drawFlame(ctx, size, lt + i * 0.07, seed + i); ctx.restore(); }); ctx.restore(); }
  });

  // ---------- trails, tracks, forts ----------
  OV.trails = (ctx, arr, g, lt) => {
    for (const Tr of list(arr)) { let pts, p; if (Tr.head != null) { const Fg = list(g.L.figures).find((f) => f.id === Tr.head);
        if (!Fg || !Fg.path) throw new Error(`map trail: no walking figure with id "${Tr.head}"`); pts = Fg.path.map((q) => px(g, q)); p = figPos(Fg, lt).p;
      } else { pts = (Tr.pts || []).map((q) => px(g, q)); p = T.prog(lt, Tr.at ?? 0, Tr.dur ?? 1.5); }
      if (pts.length < 2 || p <= 0) continue; ctx.save(); ctx.setLineDash(Tr.dash ?? [18, 12]); ctx.strokeStyle = Tr.color ?? '#d02020'; ctx.lineWidth = Tr.width ?? 6; ctx.lineJoin = 'round';
      polyline(ctx, partial(pts, p)); ctx.stroke(); ctx.restore(); }
  };
  OV.tracks = (ctx, arr, g, lt) => {
    for (const Tk of list(arr)) { const p = T.prog(lt, Tk.at ?? 0, Tk.dur ?? 0.2), col = Tk.color ?? '#3a1d14'; if (p <= 0) continue;
      const dense = resample(partial(Tk.pts.map((q) => px(g, q)), p), 7, false); if (dense.length < 2) continue; ctx.save(); ctx.strokeStyle = col; ctx.lineCap = 'butt';
      ctx.lineWidth = 5; ctx.beginPath(); dense.forEach(([x, y, a], i) => { if (i % 2 === 0) { ctx.moveTo(x - Math.sin(a) * 11, y + Math.cos(a) * 11); ctx.lineTo(x + Math.sin(a) * 11, y - Math.cos(a) * 11); } }); ctx.stroke();
      ctx.lineWidth = 3; ctx.lineJoin = 'round'; for (const d of [-5, 5]) { polyline(ctx, dense.map(([x, y, a]) => [x - Math.sin(a) * d, y + Math.cos(a) * d])); ctx.stroke(); }
      ctx.restore(); }
  };
  OV.forts = upright((ctx, arr, g, lt) => {
    for (const Fo of list(arr)) { const pts = (Fo.along || []).map((q) => px(g, q)), n = Fo.count ?? 6;
      if (pts.length < 2) throw new Error('map forts: "along" needs 2+ points'); for (let i = 0; i < n; i++) {
        const pa = T.pathAt(pts, n > 1 ? i / (n - 1) : 0.5), t0 = (Fo.at ?? 1) + i * (Fo.every ?? 0.2), q = T.ease.outBack(T.prog(lt, t0, 0.25)), [x, y, s] = up(g, pa.x, pa.y);
        if (q <= 0 || !(s > 0.01)) continue; ctx.save(); ctx.translate(x, y); ctx.rotate((1 - T.ease.outCubic(T.prog(lt, t0, 0.25))) * -14 * DEG); ctx.scale(q * s, q * s);
        T.mapIcon(ctx, Fo.icon ?? 'fort', Fo.size ?? 120, lt, Fo); ctx.restore(); }
    }
  });

  // ---------- camps and squads (upright tokens) ----------
  const hop = (lt, i = 0) => ((Math.floor(lt * 15) + i) % 2 ? -3 : 3); // alternate +-3 px, 4-frame period (on twos)
  OV.camps = upright((ctx, arr, g, lt) => {
    for (const C of list(arr)) { const q = T.ease.outBack(T.prog(lt, C.at ?? 0, 0.25)), M = C.move; if (q <= 0) continue; let p = [C.x ?? 0.5, C.y ?? 0.5], moving = false;
      if (M) { const e = T.ease.inOut(T.prog(lt, M.at ?? 0, M.dur ?? 3)); moving = e > 0 && e < 1; p = [T.lerp(p[0], M.to[0], e), T.lerp(p[1], M.to[1], e)]; }
      const [x, y, s] = g.project(p[0], p[1]); if (!(s > 0.01)) continue; ctx.save(); ctx.translate(x, y + (moving && C.hop !== false ? hop(lt) : 0)); ctx.scale(q * s, q * s);
      campStyle(C.style ?? 'camp', ctx, C.size ?? 230, lt, C); ctx.restore(); }
  });
  const FORM = { diamond: [[0, 0], [-1, -0.75], [-1, 0.75], [-2, 0], [-2, -1.5], [-2, 1.5], [-3, -0.75], [-3, 0.75], [-4, 0]] };
  function squadLead(Q, g, lt) {
    const pts = (Q.pts || []).map((q) => px(g, q));
    if (pts.length < 2) throw new Error('map squads: "pts" needs 2+ points'); const p = T.prog(lt, Q.at ?? 0, Q.dur ?? 3), pa = T.pathAt(pts, p); return { ...pa, p, started: lt >= (Q.at ?? 0) };
  }
  OV.squads = upright((ctx, arr, g, lt) => {
    for (const Q of list(arr)) { if (lt < (Q.at ?? 0)) continue;
      const ld = squadLead(Q, g, lt), n = Q.count ?? 4, sz = Q.size ?? 130, sp = sz * 0.95, form = Q.formation ?? 'diamond', r = T.rng(T.hash('squad' + (Q.id ?? '')));
      if (!['diamond', 'line', 'blob'].includes(form)) throw new Error(`map squads: unknown formation "${form}"`);
      const ca = Math.cos(ld.a), sa = Math.sin(ld.a), moving = ld.p > 0 && ld.p < 1, empty = Q.state && lt >= (Q.state.at ?? 0) && Q.state.v === 'empty'; const mem = []; for (let i = 0; i < n; i++) {
        const o = form === 'line' ? [-i, 0] : form === 'blob' ? [-r() * 2.4, (r() - 0.5) * 2.4] : FORM.diamond[i % 9].map((v, k) => v - (k === 0 ? Math.floor(i / 9) * 5 : 0));
        mem.push([i, up(g, ld.x + (o[0] * ca - o[1] * sa) * sp, ld.y + (o[0] * sa + o[1] * ca) * sp)]); }
      const q = T.ease.outBack(T.prog(lt, Q.at ?? 0, 0.25)); mem.sort((a, b) => a[1][1] - b[1][1]).forEach(([i, [x, y, s]]) => { if (!(s > 0.01)) return;
        const draw = (k) => { k.save(); k.translate(x, y + (moving && Q.hop !== false ? hop(lt, i) : 0)); k.scale(q * s * (ca < -0.01 ? -1 : 1), q * s);
          if (Q.prop) T.drawProp(k, Q.prop, sz, lt, Q); else T.mapIcon(k, Q.icon ?? 'helmet', sz, lt, Q);
          if (Q.flagEvery && (i + 1) % Q.flagEvery === 0) { k.translate(0, -sz * 0.5); T.mapIcon(k, 'flag', sz * 0.7, lt, { color: '#fbfaf4' }); }
          k.restore(); }; if (empty) T.filtered(ctx, 'grayscale(1) brightness(1.1) opacity(0.7)', draw); else draw(ctx); }); }
  });

  // ---------- flags, coins, xmarks, barriers ----------
  OV.flags = upright((ctx, arr, g, lt) => {
    for (const Fl of list(arr)) {
      const at = Fl.at ?? 0, h = Fl.h ?? 220, pp = T.ease.outCubic(T.prog(lt, at, 15 * FR)), cp = T.ease.outCubic(T.prog(lt, at + 9 * FR, 10 * FR)), [x, y, s] = g.project(Fl.x ?? 0.5, Fl.y ?? 0.5);
      if (pp <= 0 || !(s > 0.01)) continue; const top = -h * pp, cw = h * 0.62 * cp, chh = h * 0.4, ph = (twos(lt) / 15 / 0.6) * TAU;
      const wv = (u) => Math.sin(ph - u * 3) * chh * 0.12 * u, col = Fl.color ?? '#c8323a', c2 = Fl.color2 ?? '#f4efe4';
      const cloth = (k) => { k.moveTo(0, top); for (let i = 1; i <= 6; i++) k.lineTo((cw * i) / 6, top + wv(i / 6)); for (let i = 6; i >= 0; i--) k.lineTo((cw * i) / 6, top + chh + wv(i / 6)); k.closePath(); };
      ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.ellipse(4, 4, 16, 6, 0, 0, TAU); ctx.fill();
      for (const [c, lw] of [['#fff', 20], [P.ink, 10], ['#8a5a2a', 5]]) { ctx.strokeStyle = c; ctx.lineWidth = lw; polyline(ctx, [[0, 0], [0, top]]); ctx.stroke(); }
      if (cw > 2) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 14; ctx.beginPath(); cloth(ctx); ctx.stroke(); T.outlined(ctx, cloth, col, { line: 5, shade: (k) => {
          const pat = Fl.pattern; k.fillStyle = c2; if (pat === 'disc') { k.beginPath(); k.arc(cw * 0.5, top + chh * 0.5 + wv(0.5), chh * 0.26, 0, TAU); k.fill(); }
          else if (pat === 'star') { k.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i / 10) * TAU, rr = i % 2 ? chh * 0.13 : chh * 0.32; k.lineTo(cw * 0.5 + Math.cos(a) * rr, top + chh * 0.5 + wv(0.5) + Math.sin(a) * rr); } k.fill(); }
          else if (pat === 'stripes') k.fillRect(0, top + chh / 3 - 20, cw, chh / 3 + 0); else if (pat === 'band') k.fillRect(0, top - 20, cw * 0.3, chh + 40);
          else if (pat != null) throw new Error(`map flag: unknown pattern "${pat}"`);
          if (Fl.letter) { k.font = T.font(chh * 0.62); k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText(String(Fl.letter).slice(0, 2), cw * 0.5, top + chh * 0.52 + wv(0.5)); }
        } }); }
      T.outlined(ctx, (k) => k.arc(0, top - 6, 7, 0, TAU), P.gold, { line: 4 }); ctx.restore(); }
  });
  OV.coins = upright((ctx, Cs, g, lt) => {
    for (const C of list(Cs)) { const pts = (C.pts || []).map((q) => px(g, q)), hopT = C.hop ?? 0.6, sz = C.size ?? 36;
      if (pts.length < 2) throw new Error('map coins: "pts" needs 2+ points'); for (let i = 0; i < (C.count ?? 8); i++) {
        const t = lt - (C.at ?? 0) - i * (C.every ?? 0.25); if (t < 0) continue; let seg = Math.floor(t / hopT); if (seg >= pts.length - 1) { if (!C.loop) continue; seg %= pts.length - 1; }
        const u = (t % hopT) / hopT, a = pts[seg], b = pts[seg + 1], [x, y, s] = up(g, T.lerp(a[0], b[0], u), T.lerp(a[1], b[1], u)); if (!(s > 0.01)) continue;
        ctx.save(); ctx.translate(x, y - Math.sin(Math.PI * u) * (C.apex ?? 40) * s); ctx.scale(s, s); const w = sz * (0.3 + 0.7 * Math.abs(Math.cos(t * 8)));
        T.outlined(ctx, (k) => k.ellipse(0, 0, w, sz, 0, 0, TAU), '#e8c040', { line: 3, shade: (k) => { k.fillStyle = '#c89a20'; k.fillRect(-sz, sz * 0.3, sz * 2, sz); } }); ctx.restore(); }
    }
  });
  function brush(ctx, a, b, w, p) {
    if (p <= 0) return; const n = 12, dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, L = [], R = [];
    for (let i = 0; i <= n; i++) { const u = (i / n) * p, hw = (w / 2) * (0.3 + 0.7 * Math.sin(Math.PI * Math.min(1, u * 0.9 + 0.1))), x = a[0] + dx * u, y = a[1] + dy * u; L.push([x + nx * hw, y + ny * hw]); R.push([x - nx * hw, y - ny * hw]); }
    ctx.beginPath(); trace(ctx, L.concat(R.reverse())); ctx.fill();
  }
  OV.xmarks = (ctx, arr, g, lt) => {
    for (const X of list(arr)) { const at = X.at ?? 0, s = X.size ?? 160, h = s / 2, [x, y] = px(g, [X.x ?? 0.5, X.y ?? 0.5]); if (lt < at) continue;
      ctx.save(); ctx.translate(x, y); ctx.rotate((X.rot ?? -4) * DEG); ctx.fillStyle = X.color ?? '#141010'; brush(ctx, [-h, -h], [h, h * 1.05], s * (X.width ?? 0.12), T.prog(lt, at, 3 * FR));
      brush(ctx, [h * 1.05, -h], [-h * 0.95, h], s * (X.width ?? 0.12), T.prog(lt, at + 3 * FR, 3 * FR)); ctx.restore(); }
  };
  OV.barriers = upright((ctx, arr, g, lt) => {
    for (const B of list(arr)) { const at = B.at ?? 0, q = T.ease.outBack(T.prog(lt, at, 0.15)), [x, y, s0] = g.project(B.x ?? 0.5, B.y ?? 0.5), s = s0 * (B.scale ?? 1.6), len = B.len ?? 120;
      if (q <= 0 || !(s > 0.01)) continue; const f = frame(lt, at + 0.15), swing = f < 0 ? 70 : f < 8 ? 70 * (1 - T.ease.in(f / 8)) : f < 10 ? -6 : 0;
      ctx.save(); ctx.translate(x, y); ctx.scale(q * s * (B.flip ? -1 : 1), q * s);
      ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.ellipse(4, 4, 18, 6, 0, 0, TAU); ctx.fill(); ol(ctx, (k) => k.rect(-8, -72, 16, 72), '#8a8a88', 4);
      ctx.translate(0, -60); ctx.rotate(-(swing + (B.angle ?? 0)) * DEG); ol(ctx, (k) => k.rect(0, -7, len, 14), '#fbfaf4', 4);
      ctx.save(); ctx.beginPath(); ctx.rect(0, -7, len, 14); ctx.clip(); ctx.fillStyle = B.color ?? '#d42020'; for (let i = 0; i < 6; i += 2) ctx.fillRect((i * len) / 6, -7, len / 6, 14); ctx.restore();
      ctx.strokeStyle = P.ink; ctx.lineWidth = 4; ctx.strokeRect(0, -7, len, 14); T.outlined(ctx, (k) => k.arc(0, 0, 9, 0, TAU), '#5a5a58', { line: 4 }); ctx.restore(); }
  });

  // ---------- words lying on the map plane (and river labels along a path) ----------
  function shadeUnder(g, x, y, lt) {
    const regs = (g.L.regions || []).filter((R) => R.pts && lt >= (R.at ?? 0) && pip(g.pts(R), g.X(x), g.Y(y)));
    return regs.length ? T.shade(g.color(regs[regs.length - 1], lt), -0.74) : '#3a2a1a';
  }
  OV.words = (ctx, arr, g, lt) => {
    for (const Wd of list(arr)) { const at = Wd.at ?? 0, text = String(Wd.text ?? ''); if (lt < at || !text) continue; if (Wd.along) {
        const pa = T.pathAt(Wd.along.map((q) => px(g, q)), Wd.labelAt ?? 0.5), a = Math.cos(pa.a) < 0 ? pa.a + Math.PI : pa.a, size = Wd.size ?? 64;
        ctx.save(); ctx.globalAlpha *= T.prog(lt, at, 6 * FR); ctx.translate(pa.x, pa.y); ctx.rotate(a); ctx.font = 'italic ' + T.font(size, Wd.weight ?? 900); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = size * 0.26; ctx.strokeText(text, 0, -size * 0.7); ctx.fillStyle = Wd.color ?? '#1d3f7a'; ctx.fillText(text, 0, -size * 0.7);
        ctx.restore(); continue; }
      const style = Wd.style ?? (Wd.extrude ? 'extrude' : 'shade'), size = Wd.size ?? 160, [x, y] = px(g, [Wd.x ?? 0.5, Wd.y ?? 0.5]);
      if (!['shade', 'toon', 'extrude'].includes(style)) throw new Error(`map words: unknown style "${style}"`);
      const sc = style === 'extrude' ? T.lerp(1.6, 1, T.ease.outCubic(T.prog(lt, at, 3 * FR))) : T.lerp(1.3, 1, T.ease.outCubic(T.prog(lt, at, 5 * FR)));
      ctx.save(); ctx.globalAlpha *= Math.min(1, T.prog(lt, at, 2 * FR) + 0.3); ctx.translate(x, y); ctx.rotate((Wd.rot ?? -10) * DEG); ctx.transform(1, 0, Wd.skew ?? -0.25, 0.75, 0, 0); ctx.scale(sc, sc);
      ctx.font = T.font(size); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
      if (style === 'shade') { ctx.fillStyle = 'rgba(20,10,5,0.35)'; ctx.fillText(text, 0, 5); ctx.fillStyle = Wd.color ?? shadeUnder(g, Wd.x ?? 0.5, Wd.y ?? 0.5, lt); ctx.fillText(text, 0, 0); }
      else if (style === 'toon') T.toonText(ctx, text, 0, size * 0.36, { size, fill: Wd.color ?? '#fff' }); else {
        const d = Wd.extrude ?? 10; ctx.fillStyle = Wd.side ?? '#6b3a1d'; for (let i = d; i >= 1; i--) ctx.fillText(text, i, i);
        ctx.strokeStyle = P.ink; ctx.lineWidth = 8; ctx.strokeText(text, 0, 0); ctx.fillStyle = Wd.color ?? '#efe3c8'; ctx.fillText(text, 0, 0); }
      ctx.restore(); }
  };

  // ---------- drops: hover above, 1-frame squash, 1-frame slam, settle, puffs ----------
  const DROPS = {
    bandage(ctx, s) {
      T.outlined(ctx, (k) => T.rrect(k, -s / 2, -s * 0.15, s, s * 0.3, s * 0.1), '#e8c79a', { line: 6, shade: (k) => { k.fillStyle = '#d4ae7c'; k.fillRect(-s / 2, s * 0.06, s, s * 0.1); } });
      T.outlined(ctx, (k) => T.rrect(k, -s * 0.14, -s * 0.11, s * 0.28, s * 0.22, s * 0.04), '#f6e2c4', { line: 4 });
      ctx.fillStyle = '#b08a5a'; for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { ctx.beginPath(); ctx.arc(sx * s * (0.24 + i * 0.07), (j - 0.5) * s * 0.1, 3, 0, TAU); ctx.fill(); }
    },
    stamp(ctx, s, t, D) {
      if (t >= 0) { ctx.save(); ctx.strokeStyle = D.color ?? '#c8202a'; ctx.lineWidth = s * 0.035; ctx.strokeRect(-s * 0.45, -s * 0.16, s * 0.9, s * 0.32); ctx.font = T.font(s * 0.15); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = D.color ?? '#c8202a'; ctx.fillText(D.text ?? 'APPROVED', 0, 0); ctx.restore(); }
      const lift = t < 0.25 ? 0 : T.ease.in(T.prog(t, 0.25, 0.3)) * s * 1.6; if (lift > s * 1.5) return; ctx.save(); ctx.translate(0, -lift);
      ol(ctx, (k) => T.rrect(k, -s * 0.46, -s * 0.18, s * 0.92, s * 0.2, s * 0.03), '#c8323a', 6); ol(ctx, (k) => k.rect(-s * 0.08, -s * 0.5, s * 0.16, s * 0.32), '#8a5a2a', 6); ol(ctx, (k) => k.ellipse(0, -s * 0.56, s * 0.18, s * 0.11, 0, 0, TAU), '#a8763a', 6);
      ctx.restore(); },
    foot(ctx, s, t) {
      if (t >= 0) { const q = T.ease.outCubic(T.prog(t, 0.1, 0.6)); ctx.fillStyle = '#a8141e'; ctx.beginPath(); T.smoothPath(ctx, T.blobPts(0, 0, s * (0.3 + 0.12 * q), s * (0.06 + 0.04 * q), 'seep', 14, 0.3)); ctx.fill(); }
      const pink = '#f3a3c0', sh = '#d47fa0'; ol(ctx, (k) => k.rect(-s * 0.3, -s * 2, s * 0.28, s * 1.85), pink, 8);
      T.outlined(ctx, (k) => { k.moveTo(-s * 0.32, -s * 0.2); k.quadraticCurveTo(-s * 0.4, 0, -s * 0.2, 0); k.lineTo(s * 0.3, 0); k.quadraticCurveTo(s * 0.42, -s * 0.02, s * 0.36, -s * 0.12); k.quadraticCurveTo(s * 0.1, -s * 0.2, 0, -s * 0.3); k.lineTo(-s * 0.02, -s * 0.4); k.lineTo(-s * 0.3, -s * 0.4); k.closePath(); }, pink, { line: 8, shade: (k) => { k.fillStyle = sh; k.fillRect(-s * 0.5, -s * 0.06, s, s * 0.1); } });
      for (let i = 0; i < 5; i++) ol(ctx, (k) => k.ellipse(s * (0.16 + i * 0.05), -s * (0.06 + (i % 2) * 0.01), s * 0.035, s * 0.05, 0, 0, TAU), pink, 5); },
  };
  OV.drops = upright((ctx, arr, g, lt) => {
    for (const D of list(arr)) {
      const kind = D.prop ?? 'bandage', at = D.at ?? 0, slam = at + (D.hold ?? 1), size = D.size ?? (kind === 'foot' ? 900 : 420), [x, y, s] = g.project(D.x ?? 0.5, D.y ?? 0.5);
      if (!DROPS[kind] && !T.PROPS[kind]) throw new Error(`map drops: unknown prop "${kind}"`); const fade = D.out != null ? 1 - T.prog(lt, D.out, 0.3) : 1;
      if (lt < at || fade <= 0 || !(s > 0.01)) continue; const t = lt - slam, hover = t < -FR, rot = (D.rot ?? (kind === 'foot' ? 0 : -25)) * DEG; let dy = 0, sx = 1, sy = 1;
      if (t < 0) { dy = kind === 'foot' ? -size * 0.75 : -size * 0.35 - 90; dy += hover ? (twos(lt) % 2 ? -2.5 : 2.5) : 0; sx = sy = 1.12; if (!hover) { sy *= 0.55; sx *= 1.15; } }
      else { const k = snap(lt, slam, [1.05, 1.03, 1.01, 1]); sx = k; sy = k * (kind === 'foot' ? 1 : 0.85); }
      ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha *= fade;
      if (t < 0) { ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(0, 0, size * 0.4, size * 0.08, 0, 0, TAU); ctx.fill(); }
      ctx.save(); ctx.translate(0, dy); ctx.rotate(t < 0 ? rot * 0.4 : rot); ctx.scale(sx, sy);
      if (DROPS[kind]) DROPS[kind](ctx, size, t, D); else T.drawProp(ctx, kind, size, lt, D); ctx.restore(); const pq = T.prog(lt, slam, 8 * FR);
      if (D.puffs !== false && t >= 0 && pq < 1) { ctx.globalAlpha *= 1 - pq;
        for (const d of [-1, 1]) { const ex = Math.cos(rot) * size * 0.5 * d, ey = Math.sin(rot) * size * 0.5 * d + (kind === 'foot' ? -20 : 0); T.drawCloud(ctx, ex + d * 40 * pq, ey, 120 * (0.6 + pq * 0.6), 84 * (0.6 + pq * 0.6), 'dp' + d, { line: 4, boil: lt }); }
      }
      ctx.restore(); }
  });

  // ---------- tabletop props: tacks dropping in rhythm and a gloved hand ----------
  function tack(ctx, col) {
    ctx.strokeStyle = '#8a8a8a'; ctx.lineWidth = 4; ctx.lineCap = 'round'; polyline(ctx, [[0, 0], [0, -30]]); ctx.stroke();
    T.outlined(ctx, (k) => k.arc(0, -32, 14, 0, TAU), col, { line: 3, shade: (k) => { k.fillStyle = T.shade(col, -0.3); k.fillRect(-14, -28, 28, 14); } });
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-4, -37, 4, 0, TAU); ctx.fill();
  }
  OV.tacks = upright((ctx, arr, g, lt) => {
    for (const K of list(arr)) { const at = K.at ?? 0, f = (lt - at) * 30, [x, y, s0] = g.project(K.x ?? 0.5, K.y ?? 0.5), s = s0 * (K.size ?? 2.2);
      if (f < 0 || !(s > 0.01)) continue; const fall = f < 4 ? 1 - T.ease.in(f / 4) : 0, sq = f >= 4 && f < 5 ? [1.1, 0.9] : [1, 1]; ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
      ctx.fillStyle = `rgba(0,0,0,${(0.3 - fall * 0.15).toFixed(2)})`; ctx.beginPath(); ctx.ellipse(6, 2, 10 + fall * 6, 4 + fall * 2, 0, 0, TAU); ctx.fill();
      ctx.translate(0, -80 * fall); ctx.scale(sq[0], sq[1]); tack(ctx, K.color ?? '#d42020'); if (K.label) T.toonText(ctx, K.label, 0, -62, { size: K.labelSize ?? 34 }); ctx.restore(); }
  });
  OV.hand = upright((ctx, arr, g, lt) => {
    for (const Hd of list(arr)) {
      const at = Hd.at ?? 0, dur = Hd.dur ?? 0.4, hold = Hd.hold ?? 1, e = T.ease.outCubic(T.prog(lt, at, dur)), rr = T.ease.in(T.prog(lt, at + dur + hold, 10 * FR)), k = e * (1 - rr);
      if (k <= 0) continue; const to = Hd.to ?? [0.5, 0.5], [tx, ty] = g.project(to[0], to[1]), f = fbox(g), size = Hd.size ?? 200;
      const dist = { bottom: f.y1 - ty, top: ty - f.y0, left: tx - f.x0, right: f.x1 - tx }, from = Hd.from ?? Object.keys(dist).sort((a, b) => dist[a] - dist[b])[0];
      const start = { bottom: [tx + 160, f.y1 + size * 2], top: [tx - 160, f.y0 - size * 2], left: [f.x0 - size * 2, ty + 160], right: [f.x1 + size * 2, ty + 160] }[from];
      if (!start) throw new Error(`map hand: unknown from "${from}"`);
      const v = [tx - start[0], ty - start[1]], vl = Math.hypot(v[0], v[1]) || 1, dir = Math.atan2(v[0] / vl, -v[1] / vl), tip = (size / 120) * 74;
      const j = e >= 1 && rr <= 0 ? T.rng(T.hash('hand' + twos(lt))) : null, tr = j ? [(j() - 0.5) * 2, (j() - 0.5) * 2] : [0, 0];
      const fx = T.lerp(start[0], tx, k) + tr[0], fy = T.lerp(start[1], ty, k) + tr[1], wx = fx - (v[0] / vl) * tip, wy = fy - (v[1] / vl) * tip;
      tube(ctx, [start[0] - (v[0] / vl) * 400, start[1] - (v[1] / vl) * 400], [wx - (v[0] / vl) * size * 0.35, wy - (v[1] / vl) * size * 0.35], Hd.sleeve ?? '#4a5a3a', 60);
      if (Hd.carry === 'tack' && e < 1) { ctx.save(); ctx.translate(fx, fy + 8); tack(ctx, Hd.color ?? '#d42020'); ctx.restore(); }
      if (Hd.carry === 'flag' && e < 1) { ctx.save(); ctx.translate(fx, fy + 30); T.mapIcon(ctx, 'flag', 80, lt, { color: Hd.color ?? '#d42020' }); ctx.restore(); }
      T.drawGlove(ctx, wx, wy, dir, Hd.state ?? 'pinch', { size }); }
  });

  T.MAP_OVERLAY_ORDER.push('tracks', 'trails', 'words', 'xmarks', 'arrows', 'camps', 'forts', 'squads', 'coins', 'barriers', 'flags', 'fires', 'figures', 'brawls', 'tacks', 'drops', 'hand');
})();
