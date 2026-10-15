// foreground.js — more foreground framing kinds (fg layer): sandbags, trench-wall, window-grid, bars, barbed-wire, curtains,
// foam, hands-fpv, lamp-post, aperture. Same contract as scenery.js: full-frame coordinates centered at the layer origin.
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
    // Looking out from inside: a dark frame over the whole screen with one rectangular (or rounded) hole. hole:[x, y, w, h]
    // fractions of the visible frame (vertical films: the strip), radius px, edge ink rim + one lighter bevel tone, bars.
    aperture(ctx, L, lt, env) {
      const hole = L.hole ?? [0.2, 0.18, 0.6, 0.64];
      if (!Array.isArray(hole) || hole.length !== 4) throw new Error('fg aperture: hole must be [x, y, w, h] frame fractions');
      const [lo, vw] = T.visibleSpan(env), col = L.color ?? '#120c09', d = env.dpr || 1;
      const x = lo + hole[0] * vw, y = hole[1] * H, w = hole[2] * vw, h = hole[3] * H, rad = Math.min(L.radius ?? 0, w / 2, h / 2);
      const holePath = (k, g = 0) => T.rrect(k, x - g, y - g, w + g * 2, h + g * 2, Math.max(0, rad + g));
      ctx.save(); ctx.setTransform(d, 0, 0, d, 0, 0); // screen space: the frame does not move with the camera
      ctx.fillStyle = col; ctx.beginPath(); ctx.rect(lo - OV, -OV, vw + OV * 2, H + OV * 2); holePath(ctx); ctx.fill('evenodd');
      const n = Math.max(0, Math.round(L.bars ?? 0)), bw = L.barWidth ?? Math.max(18, w * 0.03);
      if (n) {
        ctx.save(); ctx.beginPath(); holePath(ctx); ctx.clip();
        for (let i = 1; i <= n; i++) { const bx = x + (i * w) / (n + 1); T.outlined(ctx, (k) => k.rect(bx - bw / 2, y - 20, bw, h + 40), col, { line: 6, shade: (k) => { k.fillStyle = T.shade(col, 0.25); k.fillRect(bx - bw / 2, y - 20, bw * 0.3, h + 40); } }); }
        ctx.restore();
      }
      if (L.edge !== false) {
        ctx.strokeStyle = T.shade(col, 0.28); ctx.lineWidth = 22; ctx.beginPath(); holePath(ctx, 11); ctx.stroke(); // bevel tone
        ctx.strokeStyle = P.ink; ctx.lineWidth = 8; ctx.beginPath(); holePath(ctx); ctx.stroke();
      }
      ctx.restore();
    },
  };
  Object.assign(T.FG, FGX);
})();
