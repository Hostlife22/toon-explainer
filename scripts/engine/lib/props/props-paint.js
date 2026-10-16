// props-paint.js — painted materials for props and the painted versions of the most used classic props.
// Materials (usable by any prop, in both looks; the light side follows the painted light when there is one):
//   T.matGlass(ctx, path, {tint, alpha, line, liquid:{level, color, tilt, bubbles, seed}, contents(ctx, bb), lt})
//   T.matLiquid(ctx, bb, {level, color, tilt, bubbles, seed, meniscus}, lt) — inside a clip
//   T.matMetal(ctx, path, color, {line, axis 'x'|'y'}) — anisotropic specular streaks
//   T.matWood / T.matFabric / T.matPaper / T.matStone / T.matLeather(ctx, path, color, {line, rot, grain, fold, alpha})
//     — the texture tile under the painted look (classic: wood grain marks only)
// Painted overrides (style.look "painted" only; the classic functions are kept in T.PROPS_CLASSIC and still run in the
// classic look): bottle, crate, barrel, coin, moneybag, sack, hourglass, bulb, book, scroll, sword, shield. Props that
// stand on something also get a contact shadow under the painted look (layer contact: false opts out).
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL, TAU = Math.PI * 2, D = T.DEG;
  const U = T.PROP3, { words, evt } = U;
  const LW = (s) => Math.max(3, s * 0.02);
  const rgba = (hex, a) => { const n = parseInt(T.hex6(hex).slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${T.clamp(a).toFixed(3)})`; };
  const h32 = T.h32;

  // ---------- materials ----------
  T.matLiquid = (ctx, bb, L, lt = 0) => {
    const col = T.hex6(L.color ?? '#5fb0d8'), level = L.level ?? bb.y + bb.h * 0.4, big = Math.max(bb.w, bb.h) * 2, cx = bb.x + bb.w / 2;
    const depth = bb.y + bb.h - level;
    if (depth <= 0) return;
    ctx.save(); ctx.translate(cx, level); ctx.rotate(-(L.tilt ?? 0));
    const g = ctx.createLinearGradient(0, 0, 0, depth);
    g.addColorStop(0, T.mix(col, '#ffffff', 0.12)); g.addColorStop(1, T.mix(col, '#140a10', 0.4));
    ctx.fillStyle = g; ctx.fillRect(-big, 0, big * 2, big);
    const side = ctx.createLinearGradient(-bb.w / 2, 0, bb.w / 2, 0); // the glass bends the edges darker
    side.addColorStop(0, rgba('#140a10', 0.28)); side.addColorStop(0.25, rgba('#140a10', 0)); side.addColorStop(0.75, rgba('#140a10', 0)); side.addColorStop(1, rgba('#140a10', 0.28));
    ctx.fillStyle = side; ctx.fillRect(-bb.w / 2, 0, bb.w, big);
    if (L.meniscus !== false) {
      const rx = bb.w * 0.5, ry = Math.max(2, bb.w * 0.07);
      ctx.fillStyle = T.mix(col, '#ffffff', 0.42); ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = Math.max(1.5, ry * 0.45); ctx.beginPath(); ctx.ellipse(0, 0, rx * 0.92, ry * 0.8, 0, 0.15, Math.PI - 0.15); ctx.stroke();
    }
    const n = L.bubbles === true ? 7 : L.bubbles ?? 0, seed = T.hash(L.seed ?? 'liq');
    for (let i = 0; i < n; i++) {
      const sp = 0.4 + h32(seed, i, 1) * 0.6, y = depth - ((lt * sp * depth * 0.9 + h32(seed, i, 2) * depth) % depth), r = Math.max(1.5, bb.w * (0.02 + 0.03 * h32(seed, i, 3)));
      const x = (h32(seed, i, 4) - 0.5) * bb.w * 0.6 + Math.sin(lt * 5 + i) * r * 0.6;
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = Math.max(1, r * 0.35); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
    }
    ctx.restore();
  };

  T.matGlass = (ctx, pathFn, o = {}) => {
    const bb = T.pathBounds(pathFn);
    if (!bb) return;
    const tint = T.hex6(o.tint ?? '#cfe6ee'), dark = T.mix(tint, '#10202a', 0.55), ll = T.lightLocal(ctx), side = ll.lx >= 0 ? 1 : -1;
    ctx.save(); ctx.beginPath(); pathFn(ctx); ctx.clip();
    ctx.save(); ctx.globalAlpha *= o.alpha ?? 0.5; ctx.fillStyle = T.mix(tint, '#ffffff', 0.3); ctx.fillRect(bb.x, bb.y, bb.w, bb.h); ctx.restore();
    if (o.liquid) T.matLiquid(ctx, bb, o.liquid, o.lt ?? 0);
    if (o.contents) o.contents(ctx, bb);
    const g = ctx.createLinearGradient(bb.x, 0, bb.x + bb.w, 0);
    g.addColorStop(0, rgba(dark, 0.55)); g.addColorStop(0.16, rgba(tint, 0.14)); g.addColorStop(0.5, rgba('#ffffff', 0)); g.addColorStop(0.84, rgba(tint, 0.14)); g.addColorStop(1, rgba(dark, 0.55));
    ctx.fillStyle = g; ctx.fillRect(bb.x, bb.y, bb.w, bb.h);
    const sx = bb.x + bb.w * (0.5 - side * 0.27), sw = Math.max(2, bb.w * 0.075);
    ctx.fillStyle = 'rgba(255,255,255,0.78)'; ctx.beginPath(); T.rrect(ctx, sx - sw / 2, bb.y + bb.h * 0.14, sw, bb.h * 0.5, sw / 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); T.rrect(ctx, bb.x + bb.w * (0.5 + side * 0.3) - sw * 0.3, bb.y + bb.h * 0.55, sw * 0.6, bb.h * 0.25, sw * 0.3); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.beginPath(); ctx.arc(sx, bb.y + bb.h * 0.7, sw * 0.42, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = rgba('#ffffff', 0.45); ctx.lineWidth = (o.line ?? T.LINE) * 2.2; ctx.save(); ctx.beginPath(); pathFn(ctx); ctx.clip(); ctx.stroke(); ctx.restore(); // glass thickness
    ctx.strokeStyle = o.ink ?? P.ink; ctx.lineWidth = o.line ?? T.LINE; ctx.beginPath(); pathFn(ctx); ctx.stroke();
  };

  // Anisotropic metal sheen across `axis` (x: bands run vertically). Mirrored to the light side.
  const sheen = (k, bb, axis, side) => {
    const g = axis === 'y' ? k.createLinearGradient(0, bb.y, 0, bb.y + bb.h) : k.createLinearGradient(bb.x, 0, bb.x + bb.w, 0);
    const st = [[0, 'rgba(0,0,0,0.28)'], [0.2, 'rgba(0,0,0,0.06)'], [0.45, 'rgba(255,255,255,0)'], [0.64, 'rgba(255,255,255,0.45)'], [0.71, 'rgba(255,255,255,0.92)'], [0.77, 'rgba(255,255,255,0.3)'], [0.9, 'rgba(0,0,0,0.12)'], [1, 'rgba(0,0,0,0.3)']];
    for (const [u, c] of st) g.addColorStop(side > 0 ? u : 1 - u, c);
    k.fillStyle = g; k.fillRect(bb.x, bb.y, bb.w, bb.h);
  };
  T.matMetal = (ctx, pathFn, color, o = {}) => {
    const bb = T.pathBounds(pathFn), ll = T.lightLocal(ctx), axis = o.axis ?? 'x', side = (axis === 'y' ? -ll.ly : ll.lx) >= 0 ? 1 : -1;
    T.outlined(ctx, pathFn, color, { line: o.line ?? T.LINE, ink: o.ink, shade: (k) => { if (bb) sheen(k, bb, axis, axis === 'y' ? -side : side); if (o.shade) o.shade(k); } });
  };
  const textured = (tex, marks) => (ctx, pathFn, color, o = {}) => {
    const bb = T.pathBounds(pathFn);
    T.outlined(ctx, pathFn, color, { line: o.line ?? T.LINE, ink: o.ink, shade: (k) => {
      if (bb && T.PAINT && T.fillTexture) T.fillTexture(k, null, tex, { rect: [bb.x - 4, bb.y - 4, bb.w + 8, bb.h + 8], alpha: o.alpha ?? 0.6, scale: o.grain ?? Math.max(0.25, bb.h / 300), rot: o.rot ?? 0, seed: o.seed ?? 0 });
      else if (bb && marks) marks(k, bb, color, o);
      if (bb && o.fold) { // a crease: dark valley and a lit ridge
        k.strokeStyle = rgba('#3a2a1a', 0.28); k.lineWidth = Math.max(1.5, bb.w * 0.012); k.beginPath(); k.moveTo(bb.x, bb.y + bb.h * o.fold); k.lineTo(bb.x + bb.w, bb.y + bb.h * (o.fold + 0.02)); k.stroke();
        k.strokeStyle = rgba('#ffffff', 0.5); k.beginPath(); k.moveTo(bb.x, bb.y + bb.h * o.fold + k.lineWidth * 1.4); k.lineTo(bb.x + bb.w, bb.y + bb.h * (o.fold + 0.02) + k.lineWidth * 1.4); k.stroke();
      }
      if (o.shade) o.shade(k);
    } });
  };
  const grainMarks = (k, bb, color, o) => { // classic look: a few wavy grain lines
    k.save(); k.translate(bb.x + bb.w / 2, bb.y + bb.h / 2); k.rotate((o.rot ?? 0) * D);
    const L = Math.max(bb.w, bb.h), n = 4;
    k.strokeStyle = T.shade(color, -0.3); k.lineWidth = Math.max(1.5, L * 0.012); k.lineCap = 'round';
    for (let i = 0; i < n; i++) { const y = ((i + 0.5) / n - 0.5) * Math.min(bb.w, bb.h) * 0.8; k.beginPath(); k.moveTo(-L * 0.45, y); k.bezierCurveTo(-L * 0.15, y - L * 0.03, L * 0.15, y + L * 0.03, L * 0.4, y); k.stroke(); }
    k.restore();
  };
  T.matWood = textured('wood', grainMarks);
  T.matFabric = textured('fabric', null);
  T.matPaper = textured('paper', null);
  T.matStone = textured('stone', null);
  T.matLeather = textured('plaster', null); // mottled hide / painted leather

  // ---------- painted overrides ----------
  const OVER = {};
  const BODY = {
    bottle: (s) => (k) => { k.moveTo(-s * 0.06, -s * 0.42); k.lineTo(-s * 0.06, -s * 0.22); k.quadraticCurveTo(-s * 0.18, -s * 0.16, -s * 0.18, -s * 0.04); k.lineTo(-s * 0.18, s * 0.46); k.quadraticCurveTo(0, s * 0.52, s * 0.18, s * 0.46); k.lineTo(s * 0.18, -s * 0.04); k.quadraticCurveTo(s * 0.18, -s * 0.16, s * 0.06, -s * 0.22); k.lineTo(s * 0.06, -s * 0.42); k.closePath(); },
    moneybag: (s) => (k) => { k.moveTo(-s * 0.18, -s * 0.32); k.quadraticCurveTo(-s * 0.5, s * 0.05, -s * 0.38, s * 0.38); k.quadraticCurveTo(0, s * 0.52, s * 0.38, s * 0.38); k.quadraticCurveTo(s * 0.5, s * 0.05, s * 0.18, -s * 0.32); k.closePath(); },
    sack: (s) => (k) => { k.moveTo(-s * 0.1, -s * 0.28); k.bezierCurveTo(-s * 0.46, -s * 0.1, -s * 0.46, s * 0.46, 0, s * 0.46); k.bezierCurveTo(s * 0.46, s * 0.46, s * 0.46, -s * 0.1, s * 0.1, -s * 0.28); k.closePath(); },
    barrel: (s) => (k) => { k.moveTo(-s * 0.32, -s * 0.45); k.quadraticCurveTo(-s * 0.45, 0, -s * 0.32, s * 0.45); k.lineTo(s * 0.32, s * 0.45); k.quadraticCurveTo(s * 0.45, 0, s * 0.32, -s * 0.45); k.closePath(); },
  };

  OVER.bottle = (ctx, s, lt, o) => {
    const pr = evt(o.pour), p = pr ? T.ease.inOut(T.prog(lt, pr.at ?? 0, pr.dur ?? 0.5)) : 0, a = p * 110 * D, tint = o.color ?? '#7a5226';
    const liq = o.liquid ?? T.mix(T.hex6(tint), '#2a1206', 0.25), fill = T.clamp(T.num ? T.num(o.fill ?? 0.72, lt) : 0.72) * (1 - p * 0.7);
    if (p > 0.6) { const mx = Math.sin(a) * s * 0.5, my = -Math.cos(a) * s * 0.5; ctx.strokeStyle = liq; ctx.lineWidth = s * 0.05; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(mx, my); ctx.quadraticCurveTo(mx + s * 0.08, my + s * 0.4, mx + s * 0.06 + Math.sin(lt * 30) * 2, my + s * 0.9); ctx.stroke(); }
    ctx.rotate(a);
    const level = s * 0.48 - fill * s * 0.6;
    T.matGlass(ctx, BODY.bottle(s), { tint, alpha: 0.55, line: LW(s), lt, liquid: fill > 0.01 ? { level, color: liq, tilt: a, bubbles: o.bubbles, seed: o.id ?? 'bottle' } : null });
    T.matWood(ctx, (k) => T.rrect(k, -s * 0.05, -s * 0.5, s * 0.1, s * 0.1, s * 0.02), '#c9a06a', { line: LW(s), grain: 0.2 });
    T.matPaper(ctx, (k) => k.rect(-s * 0.16, s * 0.04, s * 0.32, s * 0.24), o.label ?? '#efe6cf', { line: LW(s) * 0.8, grain: 0.3 });
    words(ctx, o.text, 0, s * 0.16, s * 0.26, s * 0.09, o.textColor ?? '#c0202a', { maxH: s * 0.2 });
  };

  OVER.crate = (ctx, s, lt, o) => {
    const col = T.hex6(o.color ?? '#9a6a3a'), dk = T.shade(col, -0.18), line = s * 0.03, b = s * 0.085;
    T.matWood(ctx, (k) => k.rect(-s * 0.5, -s * 0.45, s, s * 0.9), dk, { line: s * 0.035, grain: s / 520 });
    ctx.save(); ctx.beginPath(); ctx.rect(-s * 0.5, -s * 0.45, s, s * 0.9); ctx.clip(); // plank seams
    for (const y of [-0.15, 0.15]) { ctx.fillStyle = rgba('#1a0f08', 0.45); ctx.fillRect(-s * 0.5, s * y - s * 0.006, s, s * 0.012); ctx.fillStyle = rgba('#ffffff', 0.18); ctx.fillRect(-s * 0.5, s * y + s * 0.008, s, s * 0.008); }
    ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.rect(-s * 0.5 + b, -s * 0.45 + b, s - b * 2, s * 0.9 - b * 2); ctx.clip(); // diagonal brace
    ctx.translate(0, 0); ctx.rotate(Math.atan2(s * 0.9, s));
    T.matWood(ctx, (k) => k.rect(-s * 0.75, -b * 0.5, s * 1.5, b), col, { line, grain: s / 700 });
    ctx.restore();
    for (const [x, y, w, h] of [[-0.5, -0.45, 1, b / s], [-0.5, 0.45 - b / s, 1, b / s], [-0.5, -0.45, b / s, 0.9], [0.5 - b / s, -0.45, b / s, 0.9]]) T.matWood(ctx, (k) => k.rect(s * x, s * y, s * w, s * h), col, { line, grain: s / 700, rot: h > w ? 90 : 0 });
    if (o.text) { ctx.save(); ctx.globalAlpha *= 0.88; words(ctx, o.text, 0, s * 0.02, s * 0.62, s * 0.18, '#2a1c15', { stroke: 0 }); ctx.restore(); } // stencil over the boards
    ctx.fillStyle = '#4a4e54';
    for (const [x, y] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const nx = x * (s * 0.5 - b / 2), ny = y * (s * 0.45 - b / 2); ctx.beginPath(); ctx.arc(nx, ny, s * 0.016, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(nx - s * 0.005, ny - s * 0.005, s * 0.006, 0, TAU); ctx.fill(); ctx.fillStyle = '#4a4e54'; }
  };

  const bulgeX = (s, y) => { const t = (y / (s * 0.45) + 1) / 2; return s * ((1 - t) * (1 - t) * 0.32 + 2 * t * (1 - t) * 0.45 + t * t * 0.32); };
  OVER.barrel = (ctx, s, lt, o) => {
    const col = T.hex6(o.color ?? '#8a5a32'), body = BODY.barrel(s);
    T.matWood(ctx, body, col, { line: s * 0.035, rot: 90, grain: s / 600 });
    ctx.save(); ctx.beginPath(); body(ctx); ctx.clip(); // staves
    ctx.strokeStyle = rgba('#1a0f08', 0.5); ctx.lineWidth = Math.max(1.5, s * 0.008);
    for (const f of [-0.66, -0.33, 0, 0.33, 0.66]) { ctx.beginPath(); ctx.moveTo(f * s * 0.32, -s * 0.45); ctx.quadraticCurveTo(f * s * 0.45, 0, f * s * 0.32, s * 0.45); ctx.stroke(); }
    ctx.restore();
    for (const y of [-0.34, -0.12, 0.12, 0.34]) {
      const yy = s * y, h = s * 0.045, w0 = bulgeX(s, yy - h / 2), w1 = bulgeX(s, yy + h / 2);
      T.matMetal(ctx, (k) => { k.moveTo(-w0, yy - h / 2); k.lineTo(w0, yy - h / 2); k.lineTo(w1, yy + h / 2); k.lineTo(-w1, yy + h / 2); k.closePath(); }, o.hoop ?? '#5f646c', { line: s * 0.02 });
    }
    T.matWood(ctx, (k) => k.ellipse(0, -s * 0.45, s * 0.32, s * 0.06, 0, 0, TAU), T.shade(col, 0.08), { line: s * 0.025, grain: s / 700 });
    ctx.strokeStyle = rgba('#1a0f08', 0.45); ctx.lineWidth = Math.max(1.5, s * 0.01); ctx.beginPath(); ctx.ellipse(0, -s * 0.45, s * 0.26, s * 0.042, 0, 0, TAU); ctx.stroke();
  };

  OVER.coin = (ctx, s, lt, o) => {
    const sx = o.spin ? Math.cos(lt * 6) : 1, gold = o.color ?? '#efbe33';
    ctx.scale(Math.abs(sx) < 0.08 ? 0.08 : sx, 1);
    T.matMetal(ctx, (k) => k.arc(0, 0, s / 2, 0, TAU), gold, { line: s * 0.05 });
    T.outlined(ctx, (k) => k.arc(0, 0, s * 0.37, 0, TAU), T.shade(gold, -0.12), { line: s * 0.022, paint: 0.6 });
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, s * 0.37, 0, TAU); ctx.clip(); sheen(ctx, { x: -s * 0.37, y: -s * 0.37, w: s * 0.74, h: s * 0.74 }, 'x', -1); ctx.restore();
    ctx.strokeStyle = rgba('#7a5410', 0.55); ctx.lineWidth = s * 0.012; // milled rim
    for (let i = 0; i < 36; i++) { const a = (i / 36) * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a) * s * 0.42, Math.sin(a) * s * 0.42); ctx.lineTo(Math.cos(a) * s * 0.47, Math.sin(a) * s * 0.47); ctx.stroke(); }
    const tx = o.text ?? '$';
    T.toonText(ctx, tx, s * 0.012, s * 0.172, { size: s * 0.45, fill: rgba('#ffffff', 0.55), stroke: 0, shadow: false }); // emboss: lit edge
    T.toonText(ctx, tx, 0, s * 0.16, { size: s * 0.45, fill: P.goldDark, stroke: s * 0.02, ink: '#6a4a10', shadow: false });
  };

  const folds = (ctx, s, pts, col) => { for (const p of pts) T.inkStroke(ctx, p.map(([x, y]) => [x * s, y * s]), { w: s * 0.018, ink: rgba(T.shade(col, -0.45), 0.7) }); };
  OVER.moneybag = (ctx, s, lt, o) => {
    const col = '#c99a5b', body = BODY.moneybag(s);
    T.matFabric(ctx, body, col, { line: s * 0.05, grain: s / 900, alpha: 0.45 });
    folds(ctx, s, [[[-0.12, -0.28], [-0.2, -0.05], [-0.16, 0.2]], [[0.1, -0.28], [0.16, -0.08], [0.24, 0.1]], [[-0.02, -0.26], [0.02, -0.1]]], col);
    T.matFabric(ctx, (k) => { k.moveTo(-s * 0.2, -s * 0.32); k.lineTo(-s * 0.3, -s * 0.5); k.lineTo(s * 0.3, -s * 0.5); k.lineTo(s * 0.2, -s * 0.32); k.closePath(); }, col, { line: s * 0.05, grain: s / 900, alpha: 0.45 });
    T.matFabric(ctx, (k) => T.rrect(k, -s * 0.22, -s * 0.36, s * 0.44, s * 0.07, s * 0.03), '#8a5a2a', { line: s * 0.03, grain: s / 1200 });
    T.toonText(ctx, '$', 0, s * 0.25, { size: s * 0.42, fill: P.gold, stroke: s * 0.06, shadow: false });
  };
  OVER.sack = (ctx, s, lt, o) => {
    const base = T.PROPS_CLASSIC.sack, col = o.color ?? '#c9a06a';
    base(ctx, s, lt, { ...o, text: null, dollar: false });
    ctx.save(); ctx.beginPath(); BODY.sack(s)(ctx); ctx.clip();
    if (T.fillTexture) T.fillTexture(ctx, null, 'fabric', { rect: [-s * 0.5, -s * 0.3, s, s * 0.8], alpha: 0.4, scale: s / 900 });
    ctx.restore();
    folds(ctx, s, [[[-0.08, -0.24], [-0.22, 0.02], [-0.26, 0.24]], [[0.08, -0.24], [0.16, -0.02], [0.3, 0.16]], [[-0.04, 0.3], [0.1, 0.42]]], col);
    if (o.dollar) words(ctx, '$', 0, s * 0.14, s * 0.5, s * 0.3, '#3a8a3a', { stroke: s * 0.02 });
    else words(ctx, o.text, 0, s * 0.14, s * 0.56, s * 0.16, o.textColor ?? '#3a2414', { maxH: s * 0.3 });
  };

  OVER.hourglass = (ctx, s, lt, o) => {
    const p = (lt * 0.3) % 1, sand = o.sand ?? '#e8b84a';
    const glass = (k) => { k.moveTo(-s * 0.28, -s * 0.46); k.lineTo(s * 0.28, -s * 0.46); k.quadraticCurveTo(s * 0.28, -s * 0.12, s * 0.04, 0); k.quadraticCurveTo(s * 0.28, s * 0.12, s * 0.28, s * 0.46); k.lineTo(-s * 0.28, s * 0.46); k.quadraticCurveTo(-s * 0.28, s * 0.12, -s * 0.04, 0); k.quadraticCurveTo(-s * 0.28, -s * 0.12, -s * 0.28, -s * 0.46); k.closePath(); };
    for (const x of [-0.33, 0.33]) T.matWood(ctx, (k) => T.rrect(k, s * x - s * 0.03, -s * 0.5, s * 0.06, s, s * 0.03), '#8a5a32', { line: s * 0.025, rot: 90, grain: 0.25 });
    T.matGlass(ctx, glass, { tint: '#dff1f5', line: s * 0.03, contents: (k) => {
      const top = -s * 0.04 - s * 0.4 * (1 - p); // top sand surface sinks
      k.fillStyle = sand; k.beginPath(); k.moveTo(-s * 0.3, top); k.quadraticCurveTo(0, top + s * 0.06, s * 0.3, top); k.lineTo(s * 0.3, 0); k.lineTo(-s * 0.3, 0); k.closePath(); k.fill();
      const hgt = s * 0.36 * p; // bottom mound grows
      k.beginPath(); k.moveTo(-s * 0.3, s * 0.46); k.lineTo(-s * 0.3, s * 0.46 - hgt * 0.35); k.quadraticCurveTo(0, s * 0.46 - hgt * 1.4, s * 0.3, s * 0.46 - hgt * 0.35); k.lineTo(s * 0.3, s * 0.46); k.closePath(); k.fill();
      k.fillStyle = T.shade(sand, -0.22); k.fillRect(-s * 0.3, s * 0.46 - hgt * 0.2, s * 0.6, hgt * 0.2 + 1);
      if (p < 0.98) { k.strokeStyle = sand; k.lineWidth = s * 0.012; k.beginPath(); k.moveTo(0, -s * 0.01); k.lineTo(0, s * 0.46 - hgt * 0.9); k.stroke(); }
    } });
    for (const y of [-0.5, 0.5]) T.matWood(ctx, (k) => T.rrect(k, -s * 0.38, s * y - s * 0.05, s * 0.76, s * 0.1, s * 0.04), P.brown, { line: s * 0.035, grain: 0.3 });
  };

  OVER.bulb = (ctx, s, lt, o) => {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const fl = 0.92 + 0.08 * Math.sin(lt * 9), g = ctx.createRadialGradient(0, -s * 0.12, 0, 0, -s * 0.12, s * 0.95 * fl);
    g.addColorStop(0, 'rgba(255,236,150,0.75)'); g.addColorStop(0.4, 'rgba(255,214,110,0.25)'); g.addColorStop(1, 'rgba(255,200,90,0)');
    ctx.fillStyle = g; ctx.fillRect(-s, -s * 1.1, s * 2, s * 2); ctx.restore();
    const glass = (k) => { k.arc(0, -s * 0.12, s * 0.3, Math.PI * 0.8, Math.PI * 2.2); k.lineTo(s * 0.12, s * 0.25); k.lineTo(-s * 0.12, s * 0.25); k.closePath(); };
    T.matGlass(ctx, glass, { tint: '#fff3a0', alpha: 0.9, line: s * 0.035, contents: (k, bb) => {
      const c = k.createRadialGradient(0, -s * 0.1, 0, 0, -s * 0.1, s * 0.3); c.addColorStop(0, 'rgba(255,255,235,1)'); c.addColorStop(1, 'rgba(255,224,90,0.35)'); k.fillStyle = c; k.fillRect(bb.x, bb.y, bb.w, bb.h);
      k.strokeStyle = '#a0521a'; k.lineWidth = s * 0.018; k.beginPath(); k.moveTo(-s * 0.06, s * 0.2); k.lineTo(-s * 0.06, -s * 0.06); for (let i = 0; i < 5; i++) k.lineTo(-s * 0.06 + (i + 0.5) * s * 0.024, -s * 0.06 + (i % 2 ? 0.03 : -0.03) * s); k.lineTo(s * 0.06, -s * 0.06); k.lineTo(s * 0.06, s * 0.2); k.stroke();
    } });
    T.matMetal(ctx, (k) => T.rrect(k, -s * 0.14, s * 0.24, s * 0.28, s * 0.16, s * 0.04), '#a8adb4', { line: s * 0.03, shade: (k) => { k.strokeStyle = rgba('#2a2a30', 0.55); k.lineWidth = s * 0.014; for (const y of [0.29, 0.34]) { k.beginPath(); k.moveTo(-s * 0.14, s * y); k.lineTo(s * 0.14, s * (y + 0.02)); k.stroke(); } } });
    ctx.strokeStyle = P.ink; ctx.lineWidth = s * 0.04; ctx.lineCap = 'round';
    for (let i = 0; i < 7; i++) { const a = -Math.PI * 0.95 + i * (Math.PI * 0.9 / 6), r0 = s * 0.42, r1 = s * (0.52 + 0.04 * Math.sin(lt * 9 + i)); ctx.beginPath(); ctx.moveTo(Math.cos(a) * r0, -s * 0.12 + Math.sin(a) * r0); ctx.lineTo(Math.cos(a) * r1, -s * 0.12 + Math.sin(a) * r1); ctx.stroke(); }
  };

  OVER.book = (ctx, s, lt, o) => {
    const col = T.hex6(o.color ?? '#7a3b2e');
    T.matPaper(ctx, (k) => T.rrect(k, -s * 0.36, -s * 0.47, s * 0.76, s * 0.94, s * 0.03), '#f1e6c8', { line: s * 0.03, grain: 0.3 });
    ctx.strokeStyle = rgba('#8a7a5a', 0.6); ctx.lineWidth = Math.max(1, s * 0.006);
    for (let i = 1; i < 9; i++) { const x = s * 0.3 + (i / 9) * s * 0.1; ctx.beginPath(); ctx.moveTo(x, -s * 0.44); ctx.lineTo(x, s * 0.44); ctx.stroke(); }
    T.matLeather(ctx, (k) => T.rrect(k, -s * 0.4, -s * 0.5, s * 0.72, s, s * 0.05), col, { line: s * 0.04, grain: s / 700, alpha: 0.7 });
    for (const y of [-0.36, 0.36]) T.matMetal(ctx, (k) => k.rect(-s * 0.4, s * y - s * 0.02, s * 0.12, s * 0.04), P.gold, { line: s * 0.015 });
    ctx.strokeStyle = rgba(P.gold, 0.85); ctx.lineWidth = s * 0.012; ctx.strokeRect(-s * 0.24, -s * 0.38, s * 0.48, s * 0.76);
    if (o.text) T.toonText(ctx, o.text, -s * 0.04, 0, { size: s * 0.16, fill: P.gold, stroke: s * 0.03, shadow: false });
  };

  OVER.scroll = (ctx, s, lt, o) => {
    const w = s * 1.3, h = s * 0.8;
    T.matPaper(ctx, (k) => k.rect(-w / 2, -h / 2, w, h), P.paper, { line: s * 0.04, grain: 0.4, shade: (k) => {
      const g = k.createRadialGradient(0, 0, h * 0.2, 0, 0, w * 0.62); g.addColorStop(0, 'rgba(120,80,30,0)'); g.addColorStop(1, 'rgba(120,80,30,0.32)'); k.fillStyle = g; k.fillRect(-w / 2, -h / 2, w, h);
      k.strokeStyle = 'rgba(70,45,25,0.7)'; k.lineWidth = s * 0.016; k.lineCap = 'round';
      for (let i = 0; i < 5; i++) { const y = -h * 0.3 + i * h * 0.14, x1 = w * 0.36 - (i === 4 ? w * 0.32 : 0); k.beginPath(); k.moveTo(-w * 0.36, y); for (let x = -w * 0.36; x <= x1; x += s * 0.03) k.lineTo(x, y + Math.sin(x * 0.35 + i * 2) * s * 0.008 + ((x * 7) % 3) * s * 0.002); k.stroke(); }
    } });
    for (const sx of [-1, 1]) { T.matPaper(ctx, (k) => T.rrect(k, sx * w / 2 - s * 0.09, -h / 2 - s * 0.08, s * 0.18, h + s * 0.16, s * 0.08), P.paperDark, { line: s * 0.04, grain: 0.4, rot: 90 }); T.matWood(ctx, (k) => T.rrect(k, sx * w / 2 - s * 0.05, -h / 2 - s * 0.14, s * 0.1, s * 0.07, s * 0.03), '#7a4a26', { line: s * 0.025 }); T.matWood(ctx, (k) => T.rrect(k, sx * w / 2 - s * 0.05, h / 2 + s * 0.07, s * 0.1, s * 0.07, s * 0.03), '#7a4a26', { line: s * 0.025 }); }
    if (o.text) T.toonText(ctx, o.text, 0, s * 0.06, { size: s * 0.2, fill: P.ink, stroke: 0, shadow: false });
  };

  OVER.sword = (ctx, s) => {
    T.matMetal(ctx, (k) => { k.moveTo(-s * 0.05, -s * 0.15); k.lineTo(-s * 0.05, -s * 0.85); k.lineTo(0, -s); k.lineTo(s * 0.05, -s * 0.85); k.lineTo(s * 0.05, -s * 0.15); k.closePath(); }, '#cfd6dd', { line: s * 0.03, shade: (k) => { k.strokeStyle = rgba('#5a6470', 0.6); k.lineWidth = s * 0.01; k.beginPath(); k.moveTo(0, -s * 0.18); k.lineTo(0, -s * 0.8); k.stroke(); } });
    T.matMetal(ctx, (k) => T.rrect(k, -s * 0.16, -s * 0.17, s * 0.32, s * 0.06, s * 0.03), P.gold, { line: s * 0.03, axis: 'y' });
    T.outlined(ctx, (k) => T.rrect(k, -s * 0.04, -s * 0.12, s * 0.08, s * 0.18, s * 0.03), P.brown, { line: s * 0.03, shade: (k) => { k.strokeStyle = rgba('#1a0f08', 0.6); k.lineWidth = s * 0.012; for (let y = -0.1; y < 0.06; y += 0.035) { k.beginPath(); k.moveTo(-s * 0.04, s * y); k.lineTo(s * 0.04, s * (y + 0.025)); k.stroke(); } } });
    T.matMetal(ctx, (k) => k.arc(0, s * 0.08, s * 0.035, 0, TAU), P.gold, { line: s * 0.02 });
  };

  OVER.shield = (ctx, s, lt, o) => {
    T.PROPS_CLASSIC.shield(ctx, s, lt, o);
    const w = s * 0.62, h = s;
    ctx.save(); ctx.beginPath(); T.rrect(ctx, -w / 2, -h / 2, w, h, s * 0.1); ctx.clip();
    if (T.fillTexture) T.fillTexture(ctx, null, 'plaster', { rect: [-w / 2, -h / 2, w, h], alpha: 0.5, scale: s / 500 });
    ctx.restore();
    T.matMetal(ctx, (k) => k.arc(0, 0, s * 0.09, 0, TAU), P.gold, { line: s * 0.025 });
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.arc(-s * 0.03, -s * 0.03, s * 0.022, 0, TAU); ctx.fill();
  };

  T.PROPS_CLASSIC = T.PROPS_CLASSIC || {};
  for (const [kind, fn] of Object.entries(OVER)) {
    const base = T.PROPS[kind];
    if (!base) throw new Error('props-paint: missing classic prop ' + kind);
    T.PROPS_CLASSIC[kind] = base;
    T.PROPS[kind] = (ctx, s, lt, o) => (T.PAINT ? fn(ctx, s, lt, o) : base(ctx, s, lt, o));
  }

  // ---------- painted contact shadows for props that stand on something ----------
  // width factor per kind (fraction of size); ground props (T.PROP_GROUND) stand at their origin, others on their lower edge.
  T.PROP_FOOT = { bottle: 0.2, crate: 0.55, barrel: 0.4, moneybag: 0.42, sack: 0.42, hourglass: 0.42, canister: 0.26, bomb: 0.36, mug: 0.32, teacup: 0.46, gravestone: 0.4, temple: 0.8, castle: 0.6, tent: 0.62, dome: 0.4, pawn: 0.32, skull: 0.24 };
  const baseLayer = T.layers.prop;
  T.layers.prop = (ctx, L, lt, env) => {
    if (T.PAINT && L.contact == null && T.contactShadow) {
      const s = L.size ?? 160, ground = T.PROP_GROUND.has(L.kind), wf = T.PROP_FOOT[L.kind] ?? (ground ? 0.5 : null);
      if (wf != null) { // airborne (jump): the shadow stays on the ground and shrinks, as core's layerContact does
        const st = env && env.st, lift = Math.max(0, (st && st.jy) || 0) / Math.max(0.05, st ? st.s : 1), k = 1 / (1 + lift / (s * 0.6));
        T.contactShadow(ctx, 0, lift + (ground ? 0 : s * 0.47), s * wf * k, s * 0.055 * k, 0.55 * k);
      }
    }
    return baseLayer(ctx, L, lt, env);
  };
})();
