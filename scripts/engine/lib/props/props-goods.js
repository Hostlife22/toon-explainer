// props-goods.js — everyday explainer goods drawn with the painted materials (props-paint.js): book-stack,
// paper-stack, coin-pile, banknotes, gold-bars, amphora, apple, cheese, fish, chair, stool, oil-lamp, lantern, inkwell.
// Centred at the origin, `size` = height. Optional fields: color, count, colors (book-stack), text (banknotes, gold-bars),
// flame (oil-lamp / lantern: false = unlit). Random detail is seeded by the layer id and never drawn in a path callback.
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL, TAU = Math.PI * 2, h32 = T.h32;
  const LW = (s) => Math.max(3, s * 0.02);
  const seedOf = (o, kind) => T.hash((o.id ?? kind) + ':' + kind);
  const flame = (ctx, s, lt, x, y, k = 1) => { // small lamp flame with an additive glow, re-shaped on twos
    const f = Math.floor(lt * 15), j = 1 + (h32(5, f, 1) - 0.5) * 0.16;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(x, y - s * 0.06 * k, 0, x, y - s * 0.06 * k, s * 0.5 * k); g.addColorStop(0, 'rgba(255,214,110,0.55)'); g.addColorStop(1, 'rgba(255,190,80,0)');
    ctx.fillStyle = g; ctx.fillRect(x - s * 0.5 * k, y - s * 0.6 * k, s * k, s * k); ctx.restore();
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k * j);
    T.outlined(ctx, (c) => { c.moveTo(0, 0); c.bezierCurveTo(-s * 0.07, -s * 0.03, -s * 0.03, -s * 0.12, 0, -s * 0.18); c.bezierCurveTo(s * 0.03, -s * 0.12, s * 0.07, -s * 0.03, 0, 0); }, '#ffd23a', { line: Math.max(2, s * 0.008), paint: false, shade: (c) => { c.fillStyle = '#fff6c0'; c.beginPath(); c.ellipse(0, -s * 0.04, s * 0.022, s * 0.045, 0, 0, TAU); c.fill(); } });
    ctx.restore();
  };

  const GOODS = {
    'book-stack'(ctx, s, lt, o) {
      const n = o.count ?? 5, cols = o.colors ?? ['#7a3b2e', '#2e4a6a', '#5a6a2e', '#8a6a2a', '#4a2e5a', '#2e5a52'], r = seedOf(o, 'books'), hh = (s * 0.92) / n;
      for (let i = 0; i < n; i++) {
        const w = s * (0.7 + 0.25 * h32(r, i, 1)), x = (h32(r, i, 2) - 0.5) * s * 0.12, y = s * 0.46 - (i + 1) * hh, col = cols[i % cols.length];
        const bx = x - w / 2, bh = hh * 0.94, pw = s * 0.05;
        T.matPaper(ctx, (k) => k.rect(bx + w - pw - s * 0.02, y + bh * 0.1, pw + s * 0.02, bh * 0.8), '#f1e6c8', { line: LW(s) * 0.6, grain: 0.25 }); // page block
        ctx.strokeStyle = 'rgba(120,100,70,0.6)'; ctx.lineWidth = Math.max(1, s * 0.004);
        for (let l = 1; l < 4; l++) { const yy = y + bh * (0.1 + 0.2 * l); ctx.beginPath(); ctx.moveTo(bx + w - pw - s * 0.01, yy); ctx.lineTo(bx + w - s * 0.005, yy); ctx.stroke(); }
        T.matLeather(ctx, (k) => T.rrect(k, bx, y, w - pw, bh, s * 0.02), col, { line: LW(s) * 0.8, grain: s / 800, alpha: 0.6 }); // spine toward us
        for (const f of [0.1, 0.84]) { ctx.fillStyle = P.gold; ctx.fillRect(bx + (w - pw) * f, y + bh * 0.12, s * 0.018, bh * 0.76); }
        T.outlined(ctx, (k) => k.rect(bx + (w - pw) * 0.3, y + bh * 0.28, (w - pw) * 0.4, bh * 0.44), T.shade(col, -0.35), { line: Math.max(1.5, s * 0.006), paint: false, shade: (k) => { k.fillStyle = 'rgba(242,194,48,0.85)'; k.fillRect(bx + (w - pw) * 0.34, y + bh * 0.46, (w - pw) * 0.32, bh * 0.08); } });
      }
    },
    'paper-stack'(ctx, s, lt, o) {
      const n = o.count ?? 9, r = seedOf(o, 'papers'), hh = (s * 0.7) / n, w = s * 0.9;
      for (let i = 0; i < n; i++) {
        const y = s * 0.46 - (i + 1) * hh, dx = (h32(r, i, 1) - 0.5) * s * 0.08, rot = (h32(r, i, 2) - 0.5) * 0.06;
        ctx.save(); ctx.translate(dx, y + hh / 2); ctx.rotate(rot);
        T.matPaper(ctx, (k) => k.rect(-w / 2, -hh / 2, w, hh * 0.9), h32(r, i, 3) < 0.3 ? '#efe2c0' : '#f7f0de', { line: LW(s) * 0.55, grain: 0.25 });
        ctx.restore();
      }
      const ty = s * 0.46 - n * hh; // top sheet with writing
      ctx.save(); ctx.translate(0, ty - s * 0.02); ctx.scale(1, 0.32);
      T.matPaper(ctx, (k) => k.rect(-w / 2, -s * 0.35, w, s * 0.7), '#fbf6e8', { line: LW(s) * 1.4, grain: 0.3, shade: (k) => { k.strokeStyle = 'rgba(40,40,60,0.6)'; k.lineWidth = s * 0.02; for (let l = 0; l < 6; l++) { const yy = -s * 0.24 + l * s * 0.09; k.beginPath(); k.moveTo(-w * 0.38, yy); for (let x = -w * 0.38; x < w * (0.36 - (l === 5 ? 0.3 : 0)); x += s * 0.04) k.lineTo(x, yy + Math.sin(x * 0.4 + l) * s * 0.012); k.stroke(); } } });
      ctx.restore();
    },
    'coin-pile'(ctx, s, lt, o) {
      const r = seedOf(o, 'coinpile'), n = o.count ?? 26, gold = o.color ?? '#efbe33';
      T.outlined(ctx, (k) => { k.moveTo(-s * 0.5, s * 0.46); k.quadraticCurveTo(-s * 0.3, -s * 0.2, 0, -s * 0.24); k.quadraticCurveTo(s * 0.3, -s * 0.2, s * 0.5, s * 0.46); k.closePath(); }, T.shade(gold, -0.25), { line: LW(s) });
      const coins = [];
      for (let i = 0; i < n; i++) { const u = h32(r, i, 1), v = Math.sqrt(h32(r, i, 2)); const y = s * 0.42 - v * s * 0.62, half = (s * 0.5) * (1 - (s * 0.42 - y) / (s * 0.8)); coins.push({ x: (u - 0.5) * 2 * half * 0.9, y, a: (h32(r, i, 3) - 0.5) * 0.8, k: 0.75 + h32(r, i, 4) * 0.4 }); }
      coins.sort((a, b) => a.y - b.y);
      for (const c of coins) { ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.a); ctx.scale(1, 0.42); T.matMetal(ctx, (k) => k.arc(0, 0, s * 0.11 * c.k, 0, TAU), gold, { line: LW(s) * 1.6 }); ctx.restore(); }
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 4; i++) { const x = (h32(r, i, 9) - 0.5) * s * 0.6, y = s * 0.3 - h32(r, i, 10) * s * 0.5, g = s * 0.035 * (0.6 + 0.4 * Math.sin(lt * 4 + i * 2)); ctx.beginPath(); ctx.moveTo(x, y - g * 2); ctx.quadraticCurveTo(x, y, x + g * 2, y); ctx.quadraticCurveTo(x, y, x, y + g * 2); ctx.quadraticCurveTo(x, y, x - g * 2, y); ctx.quadraticCurveTo(x, y, x, y - g * 2); ctx.fill(); }
    },
    banknotes(ctx, s, lt, o) {
      const n = o.count ?? 4, col = o.color ?? '#9cc48a', r = seedOf(o, 'notes'), w = s * 0.95, h = s * 0.46;
      for (let i = 0; i < n; i++) {
        ctx.save(); ctx.translate((h32(r, i, 1) - 0.5) * s * 0.1, s * 0.14 - i * s * 0.06); ctx.rotate((h32(r, i, 2) - 0.5) * 0.18);
        T.matPaper(ctx, (k) => k.rect(-w / 2, -h / 2, w, h), col, { line: LW(s) * 0.8, grain: 0.3, fold: 0.5, shade: (k) => {
          k.strokeStyle = T.shade(col, -0.35); k.lineWidth = s * 0.012; k.strokeRect(-w / 2 + s * 0.04, -h / 2 + s * 0.04, w - s * 0.08, h - s * 0.08);
          k.fillStyle = T.shade(col, -0.18); k.beginPath(); k.ellipse(0, 0, h * 0.28, h * 0.32, 0, 0, TAU); k.fill();
        } });
        if (i === n - 1) { T.toonText(ctx, o.text ?? '$', 0, h * 0.12, { size: h * 0.42, fill: T.shade(col, -0.5), stroke: 0, shadow: false }); for (const sx of [-1, 1]) T.toonText(ctx, String(o.amount ?? '100'), sx * w * 0.36, -h * 0.22, { size: h * 0.18, fill: T.shade(col, -0.5), stroke: 0, shadow: false }); }
        ctx.restore();
      }
      T.matPaper(ctx, (k) => k.rect(-s * 0.07, -s * 0.1, s * 0.14, s * 0.4), '#e8dcc0', { line: LW(s) * 0.7, grain: 0.25 }); // paper band
    },
    'gold-bars'(ctx, s, lt, o) {
      const gold = o.color ?? '#efbe33', bw = s * 0.42, bh = s * 0.2, rows = [[-1, 0, 1], [-0.5, 0.5], [0]];
      rows.forEach((row, ri) => row.forEach((c) => {
        const x = c * bw * 1.02, y = s * 0.38 - ri * bh * 1.05, top = bh * 0.32;
        T.matMetal(ctx, (k) => { k.moveTo(x - bw / 2, y); k.lineTo(x - bw / 2 + top, y - bh); k.lineTo(x + bw / 2 - top, y - bh); k.lineTo(x + bw / 2, y); k.closePath(); }, gold, { line: LW(s) });
        T.matMetal(ctx, (k) => k.rect(x - bw / 2 + top, y - bh, bw - top * 2, bh * 0.18), T.mix(gold, '#ffffff', 0.3), { line: LW(s) * 0.6, axis: 'y' });
        if (o.text !== false && ri === 0) T.toonText(ctx, o.text ?? 'AU', x, y - bh * 0.3, { size: bh * 0.32, fill: T.shade(gold, -0.4), stroke: 0, shadow: false });
      }));
    },
    amphora(ctx, s, lt, o) {
      const col = o.color ?? '#c0703a', body = (k) => { k.moveTo(-s * 0.08, -s * 0.4); k.quadraticCurveTo(-s * 0.08, -s * 0.28, -s * 0.24, -s * 0.18); k.quadraticCurveTo(-s * 0.34, s * 0.02, -s * 0.18, s * 0.3); k.quadraticCurveTo(-s * 0.05, s * 0.48, 0, s * 0.48); k.quadraticCurveTo(s * 0.05, s * 0.48, s * 0.18, s * 0.3); k.quadraticCurveTo(s * 0.34, s * 0.02, s * 0.24, -s * 0.18); k.quadraticCurveTo(s * 0.08, -s * 0.28, s * 0.08, -s * 0.4); k.closePath(); };
      for (const sx of [-1, 1]) { ctx.strokeStyle = P.ink; ctx.lineWidth = s * 0.07; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(sx * s * 0.07, -s * 0.34); ctx.quadraticCurveTo(sx * s * 0.24, -s * 0.38, sx * s * 0.2, -s * 0.18); ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = s * 0.035; ctx.stroke(); }
      T.matLeather(ctx, body, col, { line: LW(s), grain: s / 700, alpha: 0.45, shade: (k) => { k.fillStyle = T.shade(col, -0.45); k.fillRect(-s * 0.4, -s * 0.06, s * 0.8, s * 0.035); k.fillRect(-s * 0.4, s * 0.16, s * 0.8, s * 0.02); k.strokeStyle = T.shade(col, -0.45); k.lineWidth = s * 0.012; for (let i = -3; i <= 3; i++) { k.beginPath(); k.moveTo(i * s * 0.06, -s * 0.02); k.lineTo(i * s * 0.06 + s * 0.03, s * 0.12); k.stroke(); } } });
      T.outlined(ctx, (k) => T.rrect(k, -s * 0.11, -s * 0.47, s * 0.22, s * 0.08, s * 0.03), T.shade(col, -0.1), { line: LW(s) });
    },
    apple(ctx, s, lt, o) {
      const col = o.color ?? '#c8323a';
      T.outlined(ctx, (k) => { k.moveTo(0, -s * 0.24); k.bezierCurveTo(-s * 0.2, -s * 0.42, -s * 0.5, -s * 0.24, -s * 0.42, s * 0.08); k.bezierCurveTo(-s * 0.36, s * 0.38, -s * 0.12, s * 0.5, 0, s * 0.4); k.bezierCurveTo(s * 0.12, s * 0.5, s * 0.36, s * 0.38, s * 0.42, s * 0.08); k.bezierCurveTo(s * 0.5, -s * 0.24, s * 0.2, -s * 0.42, 0, -s * 0.24); k.closePath(); }, col, { line: LW(s) * 1.4, shade: (k) => { k.fillStyle = 'rgba(255,255,255,0.65)'; k.beginPath(); k.ellipse(-s * 0.2, -s * 0.12, s * 0.06, s * 0.11, -0.4, 0, TAU); k.fill(); k.strokeStyle = T.mix(col, '#f2c230', 0.4); k.lineWidth = s * 0.012; for (let i = 0; i < 5; i++) { k.beginPath(); k.moveTo(s * (0.05 + i * 0.06), -s * 0.2); k.quadraticCurveTo(s * (0.1 + i * 0.06), 0, s * (0.05 + i * 0.05), s * 0.3); k.stroke(); } } });
      ctx.strokeStyle = P.brown; ctx.lineWidth = s * 0.04; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, -s * 0.24); ctx.quadraticCurveTo(s * 0.02, -s * 0.38, s * 0.07, -s * 0.46); ctx.stroke();
      T.outlined(ctx, (k) => { k.moveTo(s * 0.04, -s * 0.36); k.quadraticCurveTo(s * 0.2, -s * 0.52, s * 0.34, -s * 0.4); k.quadraticCurveTo(s * 0.2, -s * 0.28, s * 0.04, -s * 0.36); k.closePath(); }, '#6f9a3a', { line: LW(s) });
    },
    cheese(ctx, s, lt, o) {
      const col = o.color ?? '#f2c64a', top = (k) => { k.moveTo(-s * 0.48, s * 0.0); k.lineTo(s * 0.38, -s * 0.3); k.lineTo(s * 0.48, -s * 0.05); k.closePath(); };
      T.outlined(ctx, (k) => { k.moveTo(-s * 0.48, 0); k.lineTo(s * 0.48, -s * 0.05); k.lineTo(s * 0.48, s * 0.32); k.lineTo(-s * 0.48, s * 0.36); k.closePath(); }, T.shade(col, -0.08), { line: LW(s), shade: (k) => { k.fillStyle = T.shade(col, -0.32); for (const [x, y, r] of [[-0.24, 0.16, 0.06], [0.08, 0.2, 0.08], [0.32, 0.1, 0.045], [-0.02, 0.06, 0.035]]) { k.beginPath(); k.ellipse(s * x, s * y, s * r, s * r * 0.85, 0, 0, TAU); k.fill(); } } });
      T.outlined(ctx, top, col, { line: LW(s), shade: (k) => { k.fillStyle = T.shade(col, -0.25); k.beginPath(); k.ellipse(s * 0.2, -s * 0.12, s * 0.05, s * 0.025, 0, 0, TAU); k.fill(); } });
      T.outlined(ctx, (k) => { k.moveTo(s * 0.38, -s * 0.3); k.lineTo(s * 0.48, -s * 0.05); k.lineTo(s * 0.48, s * 0.32); k.lineTo(s * 0.4, s * 0.02); k.closePath(); }, '#d89a2a', { line: LW(s) * 0.8 });
    },
    fish(ctx, s, lt, o) {
      const col = o.color ?? '#7f9fb4', sw = Math.sin(lt * 6) * (o.flop ? 0.2 : 0);
      ctx.rotate(sw);
      T.outlined(ctx, (k) => { k.moveTo(s * 0.32, 0); k.lineTo(s * 0.5, -s * 0.2); k.lineTo(s * 0.46, 0); k.lineTo(s * 0.5, s * 0.2); k.closePath(); }, T.shade(col, -0.15), { line: LW(s) });
      T.outlined(ctx, (k) => { k.moveTo(-s * 0.48, 0); k.quadraticCurveTo(-s * 0.2, -s * 0.3, s * 0.36, 0); k.quadraticCurveTo(-s * 0.2, s * 0.26, -s * 0.48, 0); k.closePath(); }, col, { line: LW(s), shade: (k) => { k.fillStyle = '#e8eef2'; k.beginPath(); k.moveTo(-s * 0.48, s * 0.02); k.quadraticCurveTo(-s * 0.2, s * 0.24, s * 0.36, s * 0.02); k.lineTo(s * 0.36, s * 0.2); k.lineTo(-s * 0.5, s * 0.2); k.fill(); k.strokeStyle = T.shade(col, -0.3); k.lineWidth = s * 0.01; for (let i = 0; i < 6; i++) { const x = -s * 0.2 + i * s * 0.08; k.beginPath(); k.arc(x, -s * 0.02, s * 0.05, -1.2, 1.2); k.stroke(); } k.fillStyle = 'rgba(255,255,255,0.5)'; k.fillRect(-s * 0.3, -s * 0.12, s * 0.5, s * 0.025); } });
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(-s * 0.34, -s * 0.04, s * 0.04, 0, TAU); ctx.fill(); ctx.fillStyle = P.ink; ctx.beginPath(); ctx.arc(-s * 0.335, -s * 0.04, s * 0.02, 0, TAU); ctx.fill();
    },
    chair(ctx, s, lt, o) {
      const wood = o.color ?? '#9a5e32', dk = T.shade(wood, -0.2);
      for (const x of [-0.24, 0.24]) T.matWood(ctx, (k) => k.rect(s * x - s * 0.025, s * 0.02, s * 0.05, s * 0.44), dk, { line: LW(s), rot: 90, grain: 0.3 });
      T.matWood(ctx, (k) => k.rect(s * 0.2 - s * 0.03, -s * 0.5, s * 0.06, s * 0.96), wood, { line: LW(s), rot: 90, grain: 0.3 });
      for (const y of [-0.42, -0.28, -0.14]) T.matWood(ctx, (k) => T.rrect(k, -s * 0.2, s * y, s * 0.42, s * 0.06, s * 0.02), wood, { line: LW(s) * 0.8, grain: 0.3 });
      T.matWood(ctx, (k) => k.rect(-s * 0.26 - s * 0.03, -s * 0.5, s * 0.06, s * 0.52), wood, { line: LW(s), rot: 90, grain: 0.3 });
      T.matWood(ctx, (k) => { k.moveTo(-s * 0.36, -s * 0.02); k.lineTo(s * 0.28, -s * 0.02); k.lineTo(s * 0.32, s * 0.06); k.lineTo(-s * 0.4, s * 0.06); k.closePath(); }, T.shade(wood, 0.1), { line: LW(s), grain: 0.3 });
      for (const x of [-0.36, 0.28]) T.matWood(ctx, (k) => k.rect(s * x - s * 0.03, s * 0.06, s * 0.06, s * 0.4), wood, { line: LW(s), rot: 90, grain: 0.3 });
    },
    stool(ctx, s, lt, o) {
      const wood = o.color ?? '#a8743a';
      for (const x of [-0.3, 0.3, -0.1, 0.1]) { const far = Math.abs(x) < 0.2; T.matWood(ctx, (k) => { k.moveTo(s * x * 0.7 - s * 0.03, -s * 0.2); k.lineTo(s * x * 0.7 + s * 0.03, -s * 0.2); k.lineTo(s * x + s * 0.03, s * 0.46); k.lineTo(s * x - s * 0.03, s * 0.46); k.closePath(); }, far ? T.shade(wood, -0.25) : wood, { line: LW(s), rot: 90, grain: 0.3 }); }
      T.matWood(ctx, (k) => k.rect(-s * 0.26, s * 0.18, s * 0.52, s * 0.05), T.shade(wood, -0.1), { line: LW(s) * 0.8, grain: 0.3 });
      T.matWood(ctx, (k) => k.ellipse(0, -s * 0.24, s * 0.34, s * 0.09, 0, 0, TAU), T.shade(wood, 0.08), { line: LW(s), grain: 0.35 });
      T.outlined(ctx, (k) => { k.moveTo(-s * 0.34, -s * 0.24); k.lineTo(-s * 0.34, -s * 0.18); k.ellipse(0, -s * 0.18, s * 0.34, s * 0.09, 0, Math.PI, 0, true); k.lineTo(s * 0.34, -s * 0.24); k.ellipse(0, -s * 0.24, s * 0.34, s * 0.09, 0, 0, Math.PI, false); k.closePath(); }, T.shade(wood, -0.15), { line: LW(s) });
    },
    'oil-lamp'(ctx, s, lt, o) {
      const brass = o.color ?? '#c99a3a';
      T.matMetal(ctx, (k) => { k.moveTo(-s * 0.46, s * 0.06); k.quadraticCurveTo(-s * 0.2, s * 0.36, s * 0.22, s * 0.22); k.quadraticCurveTo(s * 0.44, s * 0.14, s * 0.48, -s * 0.06); k.quadraticCurveTo(s * 0.2, s * 0.02, -s * 0.46, s * 0.06); k.closePath(); }, brass, { line: LW(s), axis: 'y' });
      T.matMetal(ctx, (k) => k.ellipse(-s * 0.02, s * 0.06, s * 0.22, s * 0.06, 0, 0, TAU), T.shade(brass, -0.15), { line: LW(s) * 0.8 });
      ctx.strokeStyle = P.ink; ctx.lineWidth = s * 0.05; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(-s * 0.44, s * 0.14, s * 0.1, -2.2, 1.2); ctx.stroke(); ctx.strokeStyle = brass; ctx.lineWidth = s * 0.025; ctx.stroke();
      if (o.flame !== false) flame(ctx, s, lt, s * 0.46, -s * 0.06, 1.2);
    },
    lantern(ctx, s, lt, o) {
      const metal = o.color ?? '#4a4e54';
      ctx.strokeStyle = P.ink; ctx.lineWidth = s * 0.04; ctx.beginPath(); ctx.arc(0, -s * 0.42, s * 0.1, Math.PI, 0); ctx.stroke();
      T.matGlass(ctx, (k) => k.rect(-s * 0.2, -s * 0.26, s * 0.4, s * 0.52), { tint: '#ffe9a8', alpha: 0.75, line: LW(s), contents: (k, bb) => { if (o.flame === false) return; const g = k.createRadialGradient(0, 0, 0, 0, 0, s * 0.3); g.addColorStop(0, 'rgba(255,240,180,0.95)'); g.addColorStop(1, 'rgba(255,190,80,0.2)'); k.fillStyle = g; k.fillRect(bb.x, bb.y, bb.w, bb.h); } });
      if (o.flame !== false) flame(ctx, s, lt, 0, s * 0.1, 0.9);
      for (const x of [-0.2, 0, 0.2]) T.matMetal(ctx, (k) => k.rect(s * x - s * 0.02, -s * 0.28, s * 0.04, s * 0.56), metal, { line: LW(s) * 0.7 });
      T.matMetal(ctx, (k) => { k.moveTo(-s * 0.26, -s * 0.26); k.lineTo(-s * 0.12, -s * 0.38); k.lineTo(s * 0.12, -s * 0.38); k.lineTo(s * 0.26, -s * 0.26); k.closePath(); }, metal, { line: LW(s) });
      T.matMetal(ctx, (k) => T.rrect(k, -s * 0.26, s * 0.26, s * 0.52, s * 0.1, s * 0.02), metal, { line: LW(s) });
    },
    inkwell(ctx, s, lt, o) {
      ctx.save(); ctx.translate(s * 0.1, -s * 0.12); ctx.rotate(0.35);
      T.outlined(ctx, (k) => { k.moveTo(0, s * 0.3); k.quadraticCurveTo(-s * 0.16, -s * 0.1, -s * 0.06, -s * 0.5); k.quadraticCurveTo(s * 0.14, -s * 0.2, s * 0.02, s * 0.3); k.closePath(); }, '#f4efe4', { line: LW(s) * 0.8, shade: (k) => { k.strokeStyle = 'rgba(120,110,90,0.6)'; k.lineWidth = s * 0.008; for (let i = 0; i < 9; i++) { const y = s * 0.24 - i * s * 0.08; k.beginPath(); k.moveTo(s * 0.01, y); k.lineTo(-s * 0.1, y - s * 0.06); k.stroke(); } } });
      ctx.restore();
      T.matGlass(ctx, (k) => { k.moveTo(-s * 0.14, -s * 0.06); k.lineTo(s * 0.14, -s * 0.06); k.quadraticCurveTo(s * 0.3, s * 0.02, s * 0.3, s * 0.24); k.lineTo(s * 0.3, s * 0.4); k.quadraticCurveTo(s * 0.3, s * 0.46, s * 0.24, s * 0.46); k.lineTo(-s * 0.24, s * 0.46); k.quadraticCurveTo(-s * 0.3, s * 0.46, -s * 0.3, s * 0.4); k.lineTo(-s * 0.3, s * 0.24); k.quadraticCurveTo(-s * 0.3, s * 0.02, -s * 0.14, -s * 0.06); k.closePath(); }, { tint: '#9ab0c8', line: LW(s), liquid: { level: s * 0.12, color: o.ink ?? '#1a1a3a', meniscus: true } });
      T.matMetal(ctx, (k) => T.rrect(k, -s * 0.15, -s * 0.12, s * 0.3, s * 0.07, s * 0.02), '#c99a3a', { line: LW(s) * 0.8 });
    },
  };
  Object.assign(T.PROPS, GOODS);
  Object.assign(T.PROP_FOOT || (T.PROP_FOOT = {}), { 'book-stack': 0.5, 'paper-stack': 0.5, 'coin-pile': 0.56, banknotes: 0.5, 'gold-bars': 0.72, amphora: 0.22, apple: 0.3, cheese: 0.5, chair: 0.42, stool: 0.38, 'oil-lamp': 0.3, lantern: 0.3, inkwell: 0.32 });
})();
