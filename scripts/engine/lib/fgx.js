// fgx.js — more foreground framing kinds (fg layer): sandbags, trench-wall, window-grid, bars, barbed-wire, curtains,
// foam, hands-fpv, lamp-post. Same contract as scenery.js: full-frame coordinates centered at the layer origin.
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL, W = T.W, H = T.H, OV = 260;
  const FGX = {
    sandbags(ctx, L) {
      const col = L.color ?? '#9a917c', y0 = H / 2 - (L.h ?? 0.2) * H, r = T.rng(T.hash(L.id ?? 'sb'));
      for (let row = 0; row < 3; row++) for (let x = -W / 2 - OV + (row % 2) * 80; x < W / 2 + OV; x += 160) {
        const y = y0 + row * 70 + r() * 8;
        T.outlined(ctx, (k) => T.rrect(k, x, y, 170, 80, 36), T.shade(col, -0.06 * row), { line: 7, shade: (k) => { k.strokeStyle = T.shade(col, -0.35); k.lineWidth = 4; k.beginPath(); k.moveTo(x + 20, y + 40); k.quadraticCurveTo(x + 85, y + 52, x + 150, y + 40); k.stroke(); } });
      }
    },
    'trench-wall'(ctx, L) { T.slabs(ctx, -W / 2 - OV, W / 2 + OV, H / 2 - (L.h ?? 0.28) * H, H / 2 + OV, L.id ?? 'tw', L.color ?? '#3d3222', L.bevel ?? '#6e5c3c'); },
    'window-grid'(ctx, L) {
      ctx.fillStyle = L.haze ?? 'rgba(255,255,255,0.3)'; ctx.fillRect(-W / 2 - OV, -H / 2 - OV, W + OV * 2, H + OV * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 30; for (const x of [-0.3, 0.05, 0.32]) { ctx.beginPath(); ctx.moveTo(W * x, -H / 2); ctx.lineTo(W * x + 400, H / 2); ctx.stroke(); }
      const cols = L.cols ?? 4, rows = L.rows ?? 3, col = L.color ?? '#3a2a22';
      ctx.strokeStyle = col; ctx.lineWidth = L.mullion ?? 28;
      for (let i = 0; i <= cols; i++) { const x = -W / 2 + (i * W) / cols; ctx.beginPath(); ctx.moveTo(x, -H / 2 - OV); ctx.lineTo(x, H / 2 + OV); ctx.stroke(); }
      for (let j = 0; j <= rows; j++) { const y = -H / 2 + (j * H) / rows; ctx.beginPath(); ctx.moveTo(-W / 2 - OV, y); ctx.lineTo(W / 2 + OV, y); ctx.stroke(); }
    },
    bars(ctx, L) {
      const n = L.count ?? 7, col = L.color ?? '#2a2622';
      for (let i = 0; i < n; i++) {
        const x = -W / 2 + ((i + 0.5) / n) * W;
        T.outlined(ctx, (k) => T.rrect(k, x - 18, -H / 2 - OV, 36, H + OV * 2, 16), col, { line: 6, shade: (k) => { k.fillStyle = L.rim ?? 'rgba(255,190,90,0.55)'; k.fillRect(x - 18, -H / 2 - OV, 9, H + OV * 2); } });
      }
      if (L.crossbar !== false) for (const y of [-0.3, 0.3]) T.outlined(ctx, (k) => k.rect(-W / 2 - OV, H * y - 14, W + OV * 2, 28), col, { line: 6 });
    },
    'barbed-wire'(ctx, L) { T.barbedWire(ctx, -W / 2 - OV, W / 2 + OV, H / 2 - (L.y ?? 0.08) * H, L.id ?? 'bw', L.h ?? 110); },
    curtains(ctx, L, lt) {
      const col = L.color ?? '#8a1a1a', side = L.width ?? 0.18;
      T.curtain(ctx, -W / 2 - OV, -W / 2 + side * W, -H / 2 - OV, H / 2 + OV, col, lt, 'fgl');
      T.curtain(ctx, W / 2 - side * W, W / 2 + OV, -H / 2 - OV, H / 2 + OV, col, lt, 'fgr');
    },
    foam(ctx, L, lt) {
      const r = T.rng(T.hash(L.id ?? 'foam'));
      for (let i = 0; i < 16; i++) { const x = -W / 2 - OV + (i / 15) * (W + OV * 2), y = H / 2 - 40 + r() * 60, rr = 90 + r() * 70; T.outlined(ctx, (k) => k.arc(x + Math.sin(lt + i) * 4, y, rr, 0, Math.PI * 2), '#ffffff', { line: 6, ink: L.rim ?? '#9fc4e8' }); }
    },
    // First-person gloved hands rising from the bottom corners with a gentle bob (storyteller / reader POV).
    'hands-fpv'(ctx, L, lt) {
      const skin = L.color ?? '#f6f2ea';
      for (const d of [-1, 1]) {
        const bob = Math.sin(lt * 2 + (d > 0 ? 1 : 0)) * 10, x = d * W * 0.3, y = H / 2 - 230 + bob;
        ctx.save(); ctx.translate(x, y); ctx.rotate(-d * 0.18);
        T.outlined(ctx, (k) => T.rrect(k, -95, 60, 190, 360, 70), L.sleeve ?? '#5a6a8a', { line: 9 });
        for (let f = 0; f < 4; f++) T.outlined(ctx, (k) => T.rrect(k, -92 + f * 48, -150 + Math.abs(f - 1.5) * 18, 42, 150, 21), skin, { line: 7 });
        T.outlined(ctx, (k) => T.rrect(k, -110, -60, 220, 170, 80), skin, { line: 9, shade: (k) => { k.fillStyle = '#d8d0c4'; k.fillRect(-d * 110, -60, d * 60, 170); } });
        T.outlined(ctx, (k) => T.rrect(k, d * 70 - 26, -40, 52, 120, 26), skin, { line: 7 }); // thumb
        ctx.restore();
      }
    },
    'lamp-post'(ctx, L) {
      const x = ((L.side ?? 'right') === 'right' ? 1 : -1) * W * 0.4;
      T.outlined(ctx, (k) => k.rect(x - 20, -H / 2 + 60, 40, H + OV), '#2a2a2e', { line: 6 });
      T.outlined(ctx, (k) => { k.moveTo(x - 70, -H / 2 + 60); k.lineTo(x - 40, -H / 2 - 40); k.lineTo(x + 40, -H / 2 - 40); k.lineTo(x + 70, -H / 2 + 60); k.closePath(); }, '#fff3c0', { line: 6 });
    },
  };
  Object.assign(T.FG, FGX);
})();
