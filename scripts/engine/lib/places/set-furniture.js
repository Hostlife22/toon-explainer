// set-furniture.js — the set kit's furniture and dressing (T.SET_PARTS): shelf (books / jars / scrolls), cabinet
// (filing drawers), rug, table and desk (with items), chair, bed, plant, clock (swinging pendulum), throne, bench,
// flasks (bubbling), crates and globe. Standing parts: x = centre, y = floor contact, scale = size.
(function () {
  'use strict';
  const T = window.TOON, TAU = Math.PI * 2;
  const INK = '#3a281c', rgba = T.rgba;
  const ol = (ctx, path, fill, line = 4, o = {}) => T.outlined(ctx, path, fill, { line, ink: INK, ...o });
  const BOOKS = ['#8a2a22', '#2a4a7a', '#3a6a3a', '#c89a3a', '#5a3a6a', '#7a5a3a', '#2a5a5a', '#a8442a', '#e0d4b0'];

  // ---------- shelf ----------
  function shelfItems(ctx, x, y, w, h, kind, r) {
    if (kind === 'jars') {
      for (let px = x + 10; px < x + w - 40;) { const jw = 34 + r() * 22, jh = 40 + r() * 34, c = ['#7aa86a', '#c8b05a', '#a85a4a', '#8ab0c8'][Math.floor(r() * 4)]; ol(ctx, (k) => T.rrect(k, px, y + h - jh, jw, jh, 8), c, 3, { shade: (k) => { k.fillStyle = rgba('#ffffff', 0.3); k.fillRect(px + 5, y + h - jh + 6, 5, jh - 12); } }); ol(ctx, (k) => k.rect(px + 4, y + h - jh - 9, jw - 8, 10), '#6a4a2a', 2); px += jw + 6 + r() * 12; }
      return;
    }
    if (kind === 'scrolls') {
      for (let py = y + h - 16; py > y + 20; py -= 26) for (let px = x + 14; px < x + w - 20; px += 34) { const jx = px + (r() - 0.5) * 6; ol(ctx, (k) => k.arc(jx, py, 13, 0, TAU), '#e8dcb0', 2, { shade: (k) => { k.fillStyle = '#b8a070'; k.beginPath(); k.arc(jx, py, 5, 0, TAU); k.fill(); } }); }
      return;
    }
    for (let px = x + 6; px < x + w - 18;) {
      const bw = 16 + r() * 16, bh = h * (0.6 + r() * 0.38), c = BOOKS[Math.floor(r() * BOOKS.length)], lean = r() < 0.12 && px > x + 40;
      ctx.save(); ctx.translate(px, y + h); if (lean) ctx.rotate(-0.25);
      ol(ctx, (k) => k.rect(0, -bh, bw, bh), c, 2.5, { shade: (k) => { k.fillStyle = rgba('#f0d890', 0.7); k.fillRect(2, -bh + 10, bw - 4, 3); k.fillRect(2, -16, bw - 4, 3); } });
      ctx.restore();
      px += bw + (lean ? 18 : 1);
      if (kind === 'mixed' && r() < 0.12) { ol(ctx, (k) => T.rrect(k, px + 4, y + h - 36, 30, 36, 8), '#8ab0c8', 2); px += 40; }
    }
  }
  const shelf = { draw(ctx, p, env, S) {
    const s = S.s, w = (p.w ?? 300) * s, h = (p.h ?? 440) * s, x = S.x - w / 2, y = S.y - h, c = p.color ?? '#6e4424', rows = p.rows ?? 4, r = T.rng(T.hash(S.seed + 'books'));
    T.contactShadow(ctx, S.x, S.y, w * 0.6, 14 * s, 0.45);
    T.texBox(ctx, x, y, w, h, c, 'wood', { line: 5, rot: 90 });
    ctx.fillStyle = T.shade(c, -0.55); ctx.fillRect(x + 14 * s, y + 18 * s, w - 28 * s, h - 32 * s);
    const rh = (h - 32 * s) / rows, kinds = Array.isArray(p.items) ? p.items : [p.items ?? 'books'];
    for (let i = 0; i < rows; i++) {
      const ry = y + 18 * s + i * rh;
      shelfItems(ctx, x + 14 * s, ry + 6 * s, w - 28 * s, rh - 16 * s, kinds[i % kinds.length], r);
      T.texBox(ctx, x + 8 * s, ry + rh - 12 * s, w - 16 * s, 12 * s, T.shade(c, 0.1), 'wood', { line: 3 });
      const g = ctx.createLinearGradient(0, ry, 0, ry + 40 * s); g.addColorStop(0, rgba('#100804', 0.45)); g.addColorStop(1, rgba('#100804', 0));
      ctx.fillStyle = g; ctx.fillRect(x + 14 * s, ry, w - 28 * s, 40 * s);
    }
    T.texBox(ctx, x - 12 * s, y - 16 * s, w + 24 * s, 22 * s, T.shade(c, 0.05), 'wood', { line: 4 });
  } };

  // ---------- filing cabinet ----------
  const cabinet = { draw(ctx, p, env, S) {
    const s = S.s, w = 170 * s, n = p.drawers ?? 4, dh = 72 * s, h = n * dh + 20 * s, x = S.x - w / 2, y = S.y - h, c = p.color ?? '#7a8478';
    T.contactShadow(ctx, S.x, S.y, w * 0.65, 12 * s, 0.45);
    ol(ctx, (k) => k.rect(x, y, w, h), c, 5);
    for (let i = 0; i < n; i++) {
      const dy = y + 10 * s + i * dh;
      ol(ctx, (k) => k.rect(x + 10 * s, dy + 4 * s, w - 20 * s, dh - 8 * s), T.shade(c, 0.06), 3);
      ol(ctx, (k) => T.rrect(k, S.x - 30 * s, dy + dh * 0.45, 60 * s, 12 * s, 5 * s), '#c8c0a8', 2);
      ol(ctx, (k) => k.rect(S.x - 22 * s, dy + 12 * s, 44 * s, 18 * s), '#f2ead6', 2);
    }
    if (p.open != null) { const dy = y + 10 * s + (p.open % n) * dh; ol(ctx, (k) => k.rect(x + 2 * s, dy + 4 * s, w - 4 * s, dh * 0.6), T.shade(c, 0.12), 3); for (let i = 0; i < 6; i++) ol(ctx, (k) => k.rect(x + 18 * s + i * 22 * s, dy - 16 * s, 18 * s, 26 * s), i % 2 ? '#e8dcb0' : '#d8c890', 2); }
  } };

  // ---------- rug ----------
  const rug = { draw(ctx, p, env, S) {
    const s = S.s, w = (p.w ?? 640) * s, h = w * 0.2, c = p.color ?? '#8d2d2a', trim = p.trim ?? '#d8a040', oval = p.shape === 'oval';
    const path = (k, i = 0) => (oval ? k.ellipse(S.x, S.y, w / 2 - i, h / 2 - i * 0.2, 0, 0, TAU) : (k.moveTo(S.x - w * 0.42 + i, S.y - h / 2 + i * 0.2), k.lineTo(S.x + w * 0.42 - i, S.y - h / 2 + i * 0.2), k.lineTo(S.x + w / 2 - i, S.y + h / 2 - i * 0.2), k.lineTo(S.x - w / 2 + i, S.y + h / 2 - i * 0.2), k.closePath()));
    T.texShape(ctx, (k) => path(k), c, 'fabric', { line: 4, paint: 0.5, rect: [S.x - w / 2, S.y - h / 2, w, h], detail: (k) => {
      k.strokeStyle = trim; k.lineWidth = 8 * s; k.beginPath(); path(k, 30 * s); k.stroke();
      k.strokeStyle = T.shade(c, -0.35); k.lineWidth = 4 * s; k.beginPath(); path(k, 52 * s); k.stroke();
      k.fillStyle = trim; k.beginPath(); k.moveTo(S.x, S.y - h * 0.26); k.lineTo(S.x + w * 0.1, S.y); k.lineTo(S.x, S.y + h * 0.26); k.lineTo(S.x - w * 0.1, S.y); k.closePath(); k.fill();
    } });
  } };

  // ---------- table / desk with items ----------
  const ITEMS = {
    books: (ctx, x, y, s) => { for (let i = 0; i < 3; i++) ol(ctx, (k) => k.rect(x - 50 * s + i * 4 * s, y - (i + 1) * 16 * s, 100 * s - i * 8 * s, 16 * s), BOOKS[i * 2], 2.5); },
    papers: (ctx, x, y, s) => { for (let i = 0; i < 3; i++) { ctx.save(); ctx.translate(x + i * 14 * s, y - 2 - i * 2); ctx.rotate(-0.1 + i * 0.12); ol(ctx, (k) => k.rect(-46 * s, -8 * s, 92 * s, 10 * s), '#f4eedc', 2); ctx.restore(); } },
    candle: (ctx, x, y, s) => { ol(ctx, (k) => k.ellipse(x, y - 4 * s, 26 * s, 8 * s, 0, 0, TAU), '#b8902e', 2); ol(ctx, (k) => k.rect(x - 8 * s, y - 60 * s, 16 * s, 56 * s), '#f4ecd8', 2.5); },
    jug: (ctx, x, y, s) => ol(ctx, (k) => { k.moveTo(x - 24 * s, y); k.quadraticCurveTo(x - 40 * s, y - 50 * s, x - 14 * s, y - 70 * s); k.lineTo(x + 14 * s, y - 70 * s); k.quadraticCurveTo(x + 40 * s, y - 50 * s, x + 24 * s, y); k.closePath(); }, '#a8603a', 3),
    bottle: (ctx, x, y, s) => ol(ctx, (k) => { k.rect(x - 14 * s, y - 60 * s, 28 * s, 60 * s); k.rect(x - 6 * s, y - 84 * s, 12 * s, 26 * s); }, '#3a6a4a', 3),
    inkwell: (ctx, x, y, s) => { ol(ctx, (k) => T.rrect(k, x - 16 * s, y - 24 * s, 32 * s, 24 * s, 6 * s), '#2a2a3a', 2.5); ctx.strokeStyle = '#f4f0e6'; ctx.lineWidth = 3 * s; ctx.beginPath(); ctx.moveTo(x, y - 20 * s); ctx.lineTo(x + 24 * s, y - 70 * s); ctx.stroke(); },
    globe: (ctx, x, y, s) => { ol(ctx, (k) => k.rect(x - 22 * s, y - 8 * s, 44 * s, 8 * s), '#6a4224', 2); ol(ctx, (k) => k.arc(x, y - 44 * s, 34 * s, 0, TAU), '#6aa0c8', 3, { shade: (k) => { k.fillStyle = '#8ab060'; k.beginPath(); k.ellipse(x - 8 * s, y - 50 * s, 14 * s, 18 * s, 0.4, 0, TAU); k.fill(); } }); },
    skull: (ctx, x, y, s) => ol(ctx, (k) => { k.arc(x, y - 30 * s, 26 * s, Math.PI * 0.85, Math.PI * 2.15); k.lineTo(x + 14 * s, y); k.lineTo(x - 14 * s, y); k.closePath(); }, '#e8e0cc', 3),
    lamp: (ctx, x, y, s) => { ol(ctx, (k) => k.rect(x - 4 * s, y - 70 * s, 8 * s, 70 * s), '#b8902e', 2); ol(ctx, (k) => { k.moveTo(x - 44 * s, y - 64 * s); k.lineTo(x - 30 * s, y - 100 * s); k.lineTo(x + 30 * s, y - 100 * s); k.lineTo(x + 44 * s, y - 64 * s); k.closePath(); }, '#2f6a4a', 3); },
  };
  function itemsOn(ctx, p, x0, x1, y, s, seed) {
    const list = p.items ?? [];
    list.forEach((it, i) => { const fn = ITEMS[it]; if (fn) fn(ctx, x0 + ((i + 0.5) / list.length) * (x1 - x0), y, s, seed); });
  }
  function tableShape(ctx, p, S, w, topY, depth, legs, c, desk) {
    const s = S.s;
    T.contactShadow(ctx, S.x, S.y, w * 0.6, 16 * s, 0.5);
    if (desk) { T.texBox(ctx, S.x - w / 2 + 14 * s, topY + depth, w - 28 * s, S.y - topY - depth, T.shade(c, -0.12), 'wood', { line: 5, detail: (k) => { for (const dx of [-0.32, 0.32]) for (let i = 0; i < 3; i++) { const cx = S.x + dx * w, cy = topY + depth + 20 * s + i * ((S.y - topY - depth - 30 * s) / 3); k.strokeStyle = rgba(INK, 0.6); k.lineWidth = 3; k.strokeRect(cx - 70 * s, cy, 140 * s, (S.y - topY - depth - 50 * s) / 3); k.fillStyle = '#c8a040'; k.fillRect(cx - 14 * s, cy + 16 * s, 28 * s, 6 * s); } } }); }
    else for (const lx of [-0.42, 0.42]) T.texBox(ctx, S.x + lx * w - 12 * s, topY + depth, 24 * s, S.y - topY - depth, T.shade(c, -0.2), 'wood', { line: 4, rot: 90 });
    T.texShape(ctx, (k) => { k.moveTo(S.x - w * 0.44, topY); k.lineTo(S.x + w * 0.44, topY); k.lineTo(S.x + w / 2, topY + depth * 0.6); k.lineTo(S.x - w / 2, topY + depth * 0.6); k.closePath(); }, T.shade(c, 0.12), 'wood', { line: 5, rect: [S.x - w / 2, topY, w, depth] });
    T.texBox(ctx, S.x - w / 2, topY + depth * 0.6, w, depth * 0.4 + 6 * s, c, 'wood', { line: 5 });
    void legs;
  }
  const table = {
    draw(ctx, p, env, S) { const s = S.s, w = (p.w ?? 380) * s, topY = S.y - 170 * s; tableShape(ctx, p, S, w, topY, 34 * s, 2, p.color ?? '#8a5632', false); itemsOn(ctx, p, S.x - w * 0.4, S.x + w * 0.4, topY + 12 * s, s, S.seed); },
    live(ctx, p, lt, env, S) { const s = S.s, w = (p.w ?? 380) * s, list = p.items ?? [], topY = S.y - 170 * s; list.forEach((it, i) => { if (it !== 'candle') return; const x = S.x - w * 0.4 + ((i + 0.5) / list.length) * w * 0.8; ctx.save(); ctx.translate(x, topY + 12 * s - 60 * s); T.drawFlame(ctx, 24 * s, lt, S.seed + i); ctx.restore(); T.lampPool(ctx, x, topY - 60 * s, 180 * s, '#ffd070', 0.35, lt, S.seed + 'c' + i); }); },
  };
  const desk = {
    draw(ctx, p, env, S) { const s = S.s, w = (p.w ?? 520) * s, topY = S.y - 200 * s; tableShape(ctx, p, S, w, topY, 40 * s, 0, p.color ?? '#6a3e22', true); itemsOn(ctx, p, S.x - w * 0.4, S.x + w * 0.4, topY + 14 * s, s, S.seed); },
    live: table.live,
  };
  const chair = { draw(ctx, p, env, S) {
    const s = S.s, c = p.color ?? '#7a4a2a', d = p.flip ? -1 : 1;
    T.contactShadow(ctx, S.x, S.y, 80 * s, 10 * s, 0.4);
    for (const lx of [-50, 46]) T.texBox(ctx, S.x + lx * s, S.y - 120 * s, 12 * s, 120 * s, T.shade(c, -0.2), 'wood', { line: 3 });
    T.texBox(ctx, S.x - 70 * s, S.y - 136 * s, 140 * s, 24 * s, c, 'wood', { line: 4 });
    T.texShape(ctx, (k) => { k.moveTo(S.x + d * 50 * s, S.y - 130 * s); k.lineTo(S.x + d * 62 * s, S.y - 300 * s); k.quadraticCurveTo(S.x + d * 0, S.y - 330 * s, S.x - d * 40 * s, S.y - 300 * s); k.lineTo(S.x - d * 46 * s, S.y - 130 * s); k.closePath(); }, c, 'wood', { line: 4, rot: 90 });
    ol(ctx, (k) => T.rrect(k, S.x - 32 * s, S.y - 280 * s, 64 * s, 110 * s, 20 * s), p.cushion ?? '#8a2a22', 3);
  } };

  // ---------- bed ----------
  const bed = { draw(ctx, p, env, S) {
    const s = S.s, w = 560 * s, c = p.color ?? '#6a4224', sheet = p.sheet ?? '#5a7ab8';
    T.contactShadow(ctx, S.x, S.y, w * 0.55, 16 * s, 0.5);
    T.texShape(ctx, (k) => { k.moveTo(S.x - w / 2, S.y - 150 * s); k.lineTo(S.x - w / 2, S.y - 330 * s); k.quadraticCurveTo(S.x, S.y - 400 * s, S.x + w / 2, S.y - 330 * s); k.lineTo(S.x + w / 2, S.y - 150 * s); k.closePath(); }, c, 'wood', { line: 5 });
    T.texBox(ctx, S.x - w / 2 - 10 * s, S.y - 150 * s, w + 20 * s, 150 * s, T.shade(c, -0.1), 'wood', { line: 5 });
    ol(ctx, (k) => T.rrect(k, S.x - w * 0.42, S.y - 250 * s, w * 0.36, 80 * s, 30 * s), '#f4f0e6', 4);
    T.texShape(ctx, (k) => { k.moveTo(S.x - w * 0.46, S.y - 170 * s); k.quadraticCurveTo(S.x - w * 0.1, S.y - 240 * s, S.x + w * 0.48, S.y - 200 * s); k.lineTo(S.x + w * 0.5, S.y - 110 * s); k.lineTo(S.x - w * 0.48, S.y - 110 * s); k.closePath(); }, sheet, 'fabric', { line: 5, alpha: 0.35, detail: (k) => { k.strokeStyle = rgba(T.shade(sheet, -0.5), 0.5); k.lineWidth = 4; for (let i = 0; i < 4; i++) { k.beginPath(); k.moveTo(S.x - w * 0.2 + i * w * 0.15, S.y - 200 * s); k.quadraticCurveTo(S.x - w * 0.15 + i * w * 0.15, S.y - 160 * s, S.x - w * 0.2 + i * w * 0.16, S.y - 112 * s); k.stroke(); } } });
  } };

  // ---------- plant ----------
  const plant = { draw(ctx, p, env, S) {
    const s = S.s, c = p.color ?? '#4a7a3a', r = T.rng(T.hash(S.seed + 'leaf'));
    T.contactShadow(ctx, S.x, S.y, 60 * s, 10 * s, 0.4);
    const n = p.kind === 'palm' ? 7 : 11;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (i / (n - 1) - 0.5) * 2.4 + (r() - 0.5) * 0.2, len = (p.kind === 'palm' ? 220 : 150) * s * (0.7 + r() * 0.4), bx = S.x, by = S.y - 110 * s;
      const tx = bx + Math.cos(a) * len, ty = by + Math.sin(a) * len * 0.9, mx = bx + Math.cos(a) * len * 0.5, my = by + Math.sin(a) * len * 0.5 - 30 * s;
      ol(ctx, (k) => { k.moveTo(bx, by); k.quadraticCurveTo(mx - 22 * s, my, tx, ty); k.quadraticCurveTo(mx + 22 * s, my + 10 * s, bx, by); k.closePath(); }, i % 2 ? c : T.shade(c, 0.15), 3);
    }
    ol(ctx, (k) => { k.moveTo(S.x - 56 * s, S.y - 120 * s); k.lineTo(S.x + 56 * s, S.y - 120 * s); k.lineTo(S.x + 40 * s, S.y); k.lineTo(S.x - 40 * s, S.y); k.closePath(); }, p.pot ?? '#b8603a', 4, { shade: (k) => { k.fillStyle = rgba('#000000', 0.18); k.fillRect(S.x - 60 * s, S.y - 120 * s, 120 * s, 18 * s); } });
  } };

  // ---------- clock (pendulum) ----------
  const clock = {
    draw(ctx, p, env, S) {
      const s = S.s, w = 130 * s, h = 440 * s, x = S.x - w / 2, y = S.y - h, c = p.color ?? '#5a3420';
      T.contactShadow(ctx, S.x, S.y, w * 0.6, 10 * s, 0.4);
      T.texBox(ctx, x, y + 60 * s, w, h - 60 * s, c, 'wood', { line: 5, rot: 90 });
      ol(ctx, (k) => { k.moveTo(x - 10 * s, y + 70 * s); k.lineTo(x - 10 * s, y + 30 * s); k.quadraticCurveTo(S.x, y - 10 * s, x + w + 10 * s, y + 30 * s); k.lineTo(x + w + 10 * s, y + 70 * s); k.closePath(); }, T.shade(c, 0.08), 5);
      ol(ctx, (k) => k.arc(S.x, y + 82 * s, 44 * s, 0, TAU), '#f4ecd0', 4, { shade: (k) => { k.strokeStyle = INK; k.lineWidth = 3; k.beginPath(); k.moveTo(S.x, y + 82 * s); k.lineTo(S.x, y + 52 * s); k.moveTo(S.x, y + 82 * s); k.lineTo(S.x + 20 * s, y + 90 * s); k.stroke(); } });
      ol(ctx, (k) => k.rect(x + 22 * s, y + 150 * s, w - 44 * s, 220 * s), '#2a1a12', 3, { paint: false });
    },
    live(ctx, p, lt, env, S) {
      const s = S.s, y = S.y - 440 * s + 150 * s, a = Math.sin(lt * Math.PI) * 0.28;
      ctx.save(); ctx.translate(S.x, y); ctx.rotate(a);
      ctx.strokeStyle = '#c8a040'; ctx.lineWidth = 4 * s; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 160 * s); ctx.stroke();
      ol(ctx, (k) => k.arc(0, 170 * s, 20 * s, 0, TAU), '#d8b048', 3);
      ctx.restore();
    },
  };

  // ---------- throne / bench ----------
  const throne = { draw(ctx, p, env, S) {
    const s = S.s, gold = p.color ?? '#d0a03a', cloth = p.cloth ?? '#8a1a2a';
    T.contactShadow(ctx, S.x, S.y, 200 * s, 18 * s, 0.5);
    for (let i = 0; i < 2; i++) T.texBox(ctx, S.x - (260 - i * 50) * s, S.y - (i + 1) * 36 * s, (520 - i * 100) * s, 36 * s, '#a89c8a', 'stone', { line: 4 });
    const by = S.y - 72 * s;
    ol(ctx, (k) => { k.moveTo(S.x - 130 * s, by); k.lineTo(S.x - 130 * s, by - 420 * s); k.quadraticCurveTo(S.x - 130 * s, by - 520 * s, S.x, by - 540 * s); k.quadraticCurveTo(S.x + 130 * s, by - 520 * s, S.x + 130 * s, by - 420 * s); k.lineTo(S.x + 130 * s, by); k.closePath(); }, gold, 6);
    T.texShape(ctx, (k) => { k.moveTo(S.x - 90 * s, by - 160 * s); k.lineTo(S.x - 90 * s, by - 400 * s); k.quadraticCurveTo(S.x, by - 470 * s, S.x + 90 * s, by - 400 * s); k.lineTo(S.x + 90 * s, by - 160 * s); k.closePath(); }, cloth, 'fabric', { line: 4, alpha: 0.4 });
    ol(ctx, (k) => k.arc(S.x, by - 545 * s, 22 * s, 0, TAU), '#e84a3a', 4);
    T.texBox(ctx, S.x - 170 * s, by - 170 * s, 340 * s, 60 * s, cloth, 'fabric', { line: 5, r: 12 * s, alpha: 0.4 });
    for (const d of [-1, 1]) ol(ctx, (k) => T.rrect(k, S.x + d * 170 * s - 22 * s, by - 250 * s, 44 * s, 250 * s, 14 * s), gold, 5);
    ol(ctx, (k) => k.rect(S.x - 160 * s, by - 110 * s, 320 * s, 110 * s), T.shade(gold, -0.1), 5);
  } };
  const bench = { draw(ctx, p, env, S) {
    const s = S.s, w = (p.w ?? 560) * s, c = p.color ?? '#7a4a2a', back = p.back !== false;
    T.contactShadow(ctx, S.x, S.y, w * 0.55, 12 * s, 0.45);
    if (back) T.texBox(ctx, S.x - w / 2, S.y - 260 * s, w, 130 * s, T.shade(c, -0.08), 'wood', { line: 5, detail: (k) => { for (let x = S.x - w / 2 + 40 * s; x < S.x + w / 2 - 40 * s; x += 120 * s) { k.strokeStyle = rgba(INK, 0.5); k.lineWidth = 3; k.strokeRect(x, S.y - 240 * s, 90 * s, 90 * s); } } });
    for (const lx of [-0.45, 0.45]) T.texBox(ctx, S.x + lx * w - 14 * s, S.y - 110 * s, 28 * s, 110 * s, T.shade(c, -0.2), 'wood', { line: 4 });
    T.texBox(ctx, S.x - w / 2 - 14 * s, S.y - 130 * s, w + 28 * s, 30 * s, c, 'wood', { line: 5 });
  } };

  // ---------- lab glassware (bubbles) ----------
  const FLASK = ['#5ad06a', '#e85a8a', '#5ab0e8', '#f0c040'];
  const flaskPos = (S, i) => [S.x + (i - 1.5) * 90 * S.s, S.y - 150 * S.s];
  const flasks = {
    draw(ctx, p, env, S) {
      const s = S.s;
      T.texBox(ctx, S.x - 230 * s, S.y - 150 * s, 460 * s, 26 * s, '#5a5a62', null, { line: 4 });
      for (const lx of [-0.45, 0.45]) ol(ctx, (k) => k.rect(S.x + lx * 460 * s - 10 * s, S.y - 124 * s, 20 * s, 124 * s), '#4a4a52', 3);
      for (let i = 0; i < 4; i++) {
        const [x, y] = flaskPos(S, i), c = (p.colors || FLASK)[i % 4], round = i % 2 === 0;
        const body = (k) => { if (round) { k.moveTo(x - 10 * s, y - 120 * s); k.lineTo(x - 10 * s, y - 80 * s); k.arc(x, y - 44 * s, 42 * s, -Math.PI / 2 - 0.25, Math.PI * 1.5 + 0.25, true); k.lineTo(x + 10 * s, y - 120 * s); k.closePath(); } else { k.moveTo(x - 10 * s, y - 120 * s); k.lineTo(x - 10 * s, y - 70 * s); k.lineTo(x - 44 * s, y); k.lineTo(x + 44 * s, y); k.lineTo(x + 10 * s, y - 70 * s); k.lineTo(x + 10 * s, y - 120 * s); k.closePath(); } };
        ctx.save(); ctx.beginPath(); body(ctx); ctx.clip(); ctx.fillStyle = rgba('#dff4f8', 0.55); ctx.fillRect(x - 50 * s, y - 130 * s, 100 * s, 130 * s); ctx.fillStyle = c; ctx.fillRect(x - 50 * s, y - 50 * s, 100 * s, 60 * s); ctx.fillStyle = rgba('#ffffff', 0.35); ctx.fillRect(x - 24 * s, y - 100 * s, 7 * s, 90 * s); ctx.restore();
        ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); body(ctx); ctx.stroke();
      }
    },
    live(ctx, p, lt, env, S) {
      const s = S.s;
      for (let i = 0; i < 4; i++) {
        const [x, y] = flaskPos(S, i), c = (p.colors || FLASK)[i % 4];
        for (let b = 0; b < 4; b++) { const ph = ((lt * (0.8 + b * 0.2) + b * 0.27 + i * 0.13) % 1); ctx.fillStyle = rgba(T.mix(c, '#ffffff', 0.5), 1 - ph); ctx.beginPath(); ctx.arc(x + Math.sin(ph * 9 + b) * 8 * s, y - 20 * s - ph * 150 * s, (3 + b) * s * (1 - ph * 0.4), 0, TAU); ctx.fill(); }
        T.lampPool(ctx, x, y - 30 * s, 90 * s, c, 0.25, lt, S.seed + i);
      }
    },
  };

  // ---------- crates and barrel ----------
  const crates = { draw(ctx, p, env, S) {
    const s = S.s, c = p.color ?? '#a8784a';
    T.contactShadow(ctx, S.x, S.y, 260 * s, 18 * s, 0.5);
    const box = (x, y, w) => T.texBox(ctx, x, y - w, w, w, c, 'wood', { line: 5, detail: (k) => { k.strokeStyle = rgba(T.shade(c, -0.5), 0.9); k.lineWidth = 6 * s; k.strokeRect(x + 8 * s, y - w + 8 * s, w - 16 * s, w - 16 * s); k.beginPath(); k.moveTo(x + 10 * s, y - 10 * s); k.lineTo(x + w - 10 * s, y - w + 10 * s); k.stroke(); } });
    box(S.x - 230 * s, S.y, 170 * s); box(S.x - 60 * s, S.y, 150 * s); box(S.x - 170 * s, S.y - 170 * s, 140 * s);
    const bx = S.x + 180 * s;
    T.texShape(ctx, (k) => { k.moveTo(bx - 70 * s, S.y); k.quadraticCurveTo(bx - 90 * s, S.y - 100 * s, bx - 70 * s, S.y - 200 * s); k.lineTo(bx + 70 * s, S.y - 200 * s); k.quadraticCurveTo(bx + 90 * s, S.y - 100 * s, bx + 70 * s, S.y); k.closePath(); }, '#8a5a32', 'wood', { line: 5, rot: 90, detail: (k) => { k.fillStyle = '#4a4a4a'; for (const yy of [40, 160]) k.fillRect(bx - 90 * s, S.y - yy * s - 6 * s, 180 * s, 12 * s); } });
  } };
  const globe = { draw(ctx, p, env, S) {
    const s = S.s;
    T.contactShadow(ctx, S.x, S.y, 80 * s, 10 * s, 0.4);
    for (const d of [-1, 0, 1]) { ctx.strokeStyle = INK; ctx.lineWidth = 6 * s; ctx.beginPath(); ctx.moveTo(S.x, S.y - 120 * s); ctx.lineTo(S.x + d * 60 * s, S.y); ctx.stroke(); }
    ITEMS.globe(ctx, S.x, S.y - 110 * s, 2.6 * s);
    ctx.strokeStyle = '#b8902e'; ctx.lineWidth = 7 * s; ctx.beginPath(); ctx.arc(S.x, S.y - 224 * s, 100 * s, Math.PI * 0.6, Math.PI * 2.4); ctx.stroke();
  } };

  Object.assign(T.SET_PARTS, { shelf, cabinet, rug, table, desk, chair, bed, plant, clock, throne, bench, flasks, crates, globe });
  T.SET_ITEMS = ITEMS;
})();
