// rich-towns.js — painted (Places 2.0) street1920 (hazy city silhouette, domes, palazzi with shutters, balconies,
// awnings, shop signs, chimneys with smoke, lamp posts, cobbles) and factory (saw-tooth halls in brick, lit windows,
// chimneys with smoke, water tower, pipes, fence, puddles). Same fields as the classic kinds.
(function () {
  'use strict';
  const T = window.TOON, W = T.W, H = T.H, TAU = Math.PI * 2, OV = 420;
  const INK = '#3a281c', rgba = T.rgba;
  const ol = (ctx, path, fill, line = 4, o = {}) => T.outlined(ctx, path, fill, { line, ink: INK, ...o });
  const key = (kind, env, bg, plane) => `${kind}|${env.seed}|${T.bgKey(bg)}|${plane}`;

  // ---------- street1920 ----------
  function dome(ctx, x, base, s, wall, roof) {
    T.texBox(ctx, x - 90 * s, base - 200 * s, 180 * s, 200 * s, wall, 'plaster', { line: 5, alpha: 0.4, detail: (k) => { k.fillStyle = rgba(INK, 0.75); for (let i = -2; i <= 2; i++) { k.beginPath(); T.rrect(k, x + i * 34 * s - 9 * s, base - 160 * s, 18 * s, 70 * s, 9 * s); k.fill(); } } });
    ol(ctx, (k) => { k.moveTo(x - 112 * s, base - 200 * s); k.quadraticCurveTo(x - 112 * s, base - 380 * s, x, base - 400 * s); k.quadraticCurveTo(x + 112 * s, base - 380 * s, x + 112 * s, base - 200 * s); k.closePath(); }, roof, 5, { shade: (k) => { k.strokeStyle = rgba('#1e0f05', 0.4); k.lineWidth = 4; for (let i = -2; i <= 2; i++) { k.beginPath(); k.moveTo(x + i * 42 * s, base - 200 * s); k.quadraticCurveTo(x + i * 22 * s, base - 340 * s, x, base - 400 * s); k.stroke(); } } });
    ol(ctx, (k) => k.rect(x - 16 * s, base - 450 * s, 32 * s, 54 * s), wall, 4);
    ol(ctx, (k) => k.arc(x, base - 456 * s, 18 * s, Math.PI, 0), roof, 4);
    ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, base - 474 * s); ctx.lineTo(x, base - 510 * s); ctx.stroke();
  }
  // One palazzo facade, base at y, left edge x, width w, height h.
  function palazzo(ctx, x, y, w, h, col, seed, o = {}) {
    const r = T.rng(T.hash(seed)), shutter = ['#3a6a4a', '#4a5a7a', '#7a4a32'][Math.floor(r() * 3)], stoneBase = T.shade(col, -0.18), floors = Math.max(2, Math.round((h - 120) / 120));
    T.texBox(ctx, x, y - h, w, h, col, 'plaster', { line: 6, alpha: 0.55, scale: 0.9 });
    T.texBox(ctx, x, y - 110, w, 110, stoneBase, 'stone', { line: 5, alpha: 0.35 });
    const cols = Math.max(2, Math.floor((w - 40) / 110)), cw = (w - 40) / cols;
    for (let f = 0; f < floors; f++) {
      const fy = y - 140 - f * 120;
      if (fy - 90 < y - h + 40) break;
      for (let c = 0; c < cols; c++) {
        const wx = x + 20 + c * cw + cw / 2;
        ctx.fillStyle = rgba('#140a06', 0.22); ctx.fillRect(wx - 24 + 6, fy - 84 + 8, 48, 84);
        ol(ctx, (k) => { k.moveTo(wx - 24, fy); k.lineTo(wx - 24, fy - 62); k.arc(wx, fy - 62, 24, Math.PI, 0); k.lineTo(wx + 24, fy); k.closePath(); }, o.night ? '#f0c060' : '#2e2a32', 4, { paint: false, shade: (k) => { k.fillStyle = rgba('#9ab8d0', o.night ? 0 : 0.35); k.fillRect(wx - 24, fy - 86, 14, 86); } });
        if (r() < 0.55) for (const d of [-1, 1]) ol(ctx, (k) => k.rect(wx + d * 24 - (d < 0 ? 18 : 0), fy - 84, 18, 84), shutter, 3, { shade: (k) => { k.strokeStyle = rgba(INK, 0.4); k.lineWidth = 2; for (let yy = fy - 78; yy < fy; yy += 9) { k.beginPath(); k.moveTo(wx + d * 24 - (d < 0 ? 18 : 0), yy); k.lineTo(wx + d * 24 + (d < 0 ? 0 : 18), yy); k.stroke(); } } });
        ol(ctx, (k) => k.rect(wx - 32, fy - 4, 64, 10), T.shade(col, 0.15), 3);
        if (f === 0 && r() < 0.5) { // balcony with railing and flowers
          ol(ctx, (k) => k.rect(wx - 40, fy + 4, 80, 12), T.shade(col, -0.1), 3);
          ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(wx - 40, fy - 26); ctx.lineTo(wx + 40, fy - 26); for (let bx = wx - 36; bx <= wx + 36; bx += 12) { ctx.moveTo(bx, fy - 26); ctx.lineTo(bx, fy + 4); } ctx.stroke();
        } else if (r() < 0.4) { for (let i = 0; i < 4; i++) { ctx.fillStyle = ['#d84a4a', '#f0c040', '#e86a9a'][i % 3]; ctx.beginPath(); ctx.arc(wx - 22 + i * 15, fy - 8, 6, 0, TAU); ctx.fill(); } ctx.fillStyle = '#4a7a3a'; ctx.fillRect(wx - 28, fy - 6, 56, 8); }
      }
      ol(ctx, (k) => k.rect(x - 6, fy + 14, w + 12, 10), T.shade(col, 0.12), 3); // string course
    }
    // cornice with dentils and a tiled roof edge
    ol(ctx, (k) => k.rect(x - 14, y - h - 4, w + 28, 26), T.shade(col, 0.18), 5, { shade: (k) => { k.fillStyle = rgba(INK, 0.45); for (let dx = x; dx < x + w; dx += 18) k.fillRect(dx, y - h + 14, 8, 8); } });
    ol(ctx, (k) => { k.moveTo(x - 10, y - h - 4); k.lineTo(x + 20, y - h - 46); k.lineTo(x + w - 20, y - h - 46); k.lineTo(x + w + 10, y - h - 4); k.closePath(); }, o.roof ?? '#a8553a', 5, { shade: (k) => { k.strokeStyle = rgba('#3a1408', 0.45); k.lineWidth = 3; for (let dx = x; dx < x + w; dx += 22) { k.beginPath(); k.moveTo(dx, y - h - 4); k.lineTo(dx + 10, y - h - 46); k.stroke(); } } });
    const chim = [];
    for (const fx of o.chimneys ?? [0.22, 0.76]) { const cx = x + w * fx; ol(ctx, (k) => k.rect(cx - 16, y - h - 110, 32, 70), T.shade(o.roof ?? "#a8553a", -0.15), 4); ol(ctx, (k) => k.rect(cx - 22, y - h - 118, 44, 12), T.shade(col, -0.2), 3); chim.push([cx, y - h - 120]); }
    // shopfront: awning, door, sign
    const sx = x + w * 0.5;
    ol(ctx, (k) => { k.moveTo(sx - 30, y); k.lineTo(sx - 30, y - 70); k.arc(sx, y - 70, 30, Math.PI, 0); k.lineTo(sx + 30, y); k.closePath(); }, '#4a2e1e', 4);
    if (r() < 0.8) { const aw = Math.min(w - 40, 260), ac = ['#b83a32', '#2e6a4a', '#c89a32'][Math.floor(r() * 3)]; ol(ctx, (k) => { k.moveTo(sx - aw / 2, y - 120); k.lineTo(sx + aw / 2, y - 120); k.lineTo(sx + aw / 2 + 20, y - 80); k.lineTo(sx - aw / 2 - 20, y - 80); k.closePath(); }, ac, 4, { shade: (k) => { k.fillStyle = '#f4ecd8'; for (let ax = sx - aw / 2 - 20; ax < sx + aw / 2 + 20; ax += 40) { k.beginPath(); k.moveTo(ax, y - 80); k.lineTo(ax + 20, y - 80); k.lineTo(ax + 20 - 10, y - 120); k.lineTo(ax - 10, y - 120); k.closePath(); k.fill(); } } }); }
    return chim;
  }
  function lampPost(ctx, x, base, s = 1) {
    T.contactShadow(ctx, x, base, 40 * s, 8 * s, 0.4);
    ol(ctx, (k) => { k.moveTo(x - 20 * s, base); k.lineTo(x - 9 * s, base - 60 * s); k.lineTo(x - 6 * s, base - 380 * s); k.lineTo(x + 6 * s, base - 380 * s); k.lineTo(x + 9 * s, base - 60 * s); k.lineTo(x + 20 * s, base); k.closePath(); }, '#2a2e2a', 4);
    ol(ctx, (k) => { k.moveTo(x - 30 * s, base - 380 * s); k.lineTo(x - 20 * s, base - 450 * s); k.lineTo(x + 20 * s, base - 450 * s); k.lineTo(x + 30 * s, base - 380 * s); k.closePath(); }, '#f6e8b0', 4);
    ol(ctx, (k) => { k.moveTo(x - 30 * s, base - 450 * s); k.lineTo(x, base - 480 * s); k.lineTo(x + 30 * s, base - 450 * s); k.closePath(); }, '#2a2e2a', 4);
  }
  T.richBg('street1920', (ctx, bg, lt, env) => {
    const hz = H * (bg.horizon ?? 0.7), grey = !!bg.grey, night = bg.preset === 'night';
    const { pal } = T.richSky(ctx, bg, lt, env, { preset: grey ? 'overcast' : bg.preset ?? 'day', horizon: hz });
    const haze = typeof bg.haze === 'string' ? bg.haze : grey ? '#a8b0b8' : T.atmosColor({ shot: { bg: { kind: 'sky', preset: grey ? 'overcast' : bg.preset ?? 'day' } } });
    T.plane(ctx, env, { f: 0.3, key: key('street', env, bg, 'far'), haze: T.hazeOf(bg, 0.5), hazeColor: haze }, (g) => T.cityline(g, hz - 30, env.seed + 'far', grey ? '#7a7e82' : T.mix(pal.hills[2], '#8a6a5a', 0.4), { h: 170, windowAlpha: night ? 0.7 : 0.25 }));
    T.plane(ctx, env, { f: 0.55, key: key('street', env, bg, 'mid'), haze: T.hazeOf(bg, 0.25), hazeColor: haze }, (g) => {
      for (const dx of bg.domes ?? [0.3, 0.7]) dome(g, dx * W, hz - 180, 1, grey ? '#9a9a96' : '#d8c2a0', grey ? '#6d6f73' : '#8a6a5a');
      if (bg.obelisk) { const x = bg.obelisk * W; T.texShape(g, (k) => { k.moveTo(x - 30, hz); k.lineTo(x - 18, hz - 520); k.lineTo(x, hz - 570); k.lineTo(x + 18, hz - 520); k.lineTo(x + 30, hz); k.closePath(); }, grey ? '#b0aea8' : '#e9dcc0', 'stone', { line: 6, alpha: 0.3 }); }
      const r = T.rng(T.hash(env.seed + 'midrow'));
      for (let x = W * 0.28; x < W * 0.72;) { const w = 150 + r() * 90, h = 160 + r() * 90; const h2 = h + (r() - 0.5) * 120; palazzo(g, x, hz + 10, w, h2, grey ? '#a8a8a2' : ['#d8b088', '#c9a070', '#e0c098', '#d0a888'][Math.floor(r() * 4)], env.seed + 'm' + x, { night, chimneys: r() < 0.5 ? [0.3] : [], roof: ['#a8553a', '#8a4a3a', '#b8684a'][Math.floor(r() * 3)] }); x += w + 6; }
    });
    let chimneys = [];
    T.plane(ctx, env, { f: 0.85, key: key('street', env, bg, 'near') }, (g) => {
      const r = T.rng(T.hash(env.seed + 'st' + 'b'));
      for (let i = 0; i < 6; i++) {
        const x = -OV + (i / 6) * (W + OV * 2), w = (W + OV * 2) / 6 - 10, h = 300 + r() * 120 + 160, col = grey ? T.mix('#c9a070', '#8a96a0', 0.6) : ['#c9a070', '#d8b088', '#b88a5a'][i % 3];
        if (i === 2 || i === 3) continue;
        palazzo(g, x, hz + 20, w, h, col, env.seed + 'p' + i, { night });
      }
      T.cobbles(g, hz + 20, H + OV, env.seed, grey ? '#7a7670' : '#9a8f80');
      T.texBox(g, -OV, hz + 14, W * 0.28 + OV, 22, '#b8b0a0', 'stone', { line: 4 }); T.texBox(g, W * 0.72, hz + 14, W * 0.28 + OV, 22, '#b8b0a0', 'stone', { line: 4 });
      for (const lx of bg.lamps ?? [0.27, 0.73]) lampPost(g, lx * W, hz + 40, 1);
    });
    // chimney smoke (recomputed: same seeded layout as the palazzi)
    T.plane(ctx, env, { f: 0.85, live: true }, (g) => {
      const r = T.rng(T.hash(env.seed + 'st' + 'b'));
      for (let i = 0; i < 6; i++) {
        const x = -OV + (i / 6) * (W + OV * 2), w = (W + OV * 2) / 6 - 10, h = 300 + r() * 120 + 160;
        if (i === 2 || i === 3) continue;
        for (const fx of [0.22, 0.76]) T.softSmoke(g, x + w * fx, hz + 20 - h - 124, lt, { seed: env.seed + "sm" + i + fx, color: grey ? "#9a9a9a" : "#e0dcd4", rise: 240, size: 24, drift: 90, n: 6, alpha: 0.6 });
      }
      for (const lx of bg.lamps ?? [0.27, 0.73]) T.lampPool(g, lx * W, hz + 40 - 415, night ? 260 : 120, '#ffe0a0', night ? 0.6 : 0.25, lt, env.seed + 'lp' + lx);
    });
    void chimneys;
  });

  // ---------- factory ----------
  function hall(ctx, x, base, w, h, col, seed, o = {}) {
    const r = T.rng(T.hash(seed)), teeth = Math.max(2, Math.round(w / 110)), tw = w / teeth;
    T.texBox(ctx, x, base - h, w, h + 40, col, 'brick', { line: 6, alpha: 0.75, scale: 0.55, detail: (k) => {
      for (let wx = x + 26; wx < x + w - 50; wx += 62) for (let wy = base - h + 50; wy < base - 40; wy += 72) {
        const lit = o.night ? r() < 0.6 : r() < 0.15;
        k.fillStyle = lit ? '#f0c060' : '#1c1e24'; k.fillRect(wx, wy, 34, 42);
        k.strokeStyle = rgba(T.shade(col, 0.35), 0.8); k.lineWidth = 3; k.strokeRect(wx, wy, 34, 42); k.beginPath(); k.moveTo(wx + 17, wy); k.lineTo(wx + 17, wy + 42); k.moveTo(wx, wy + 21); k.lineTo(wx + 34, wy + 21); k.stroke();
      }
      const g = k.createLinearGradient(0, base - h, 0, base + 40); g.addColorStop(0, rgba('#000000', 0)); g.addColorStop(1, rgba('#000000', 0.3)); k.fillStyle = g; k.fillRect(x, base - h, w, h + 40);
    } });
    for (let i = 0; i < teeth; i++) { // saw-tooth roof with skylights
      const tx = x + i * tw;
      ol(ctx, (k) => { k.moveTo(tx, base - h); k.lineTo(tx, base - h - 70); k.lineTo(tx + tw, base - h); k.closePath(); }, '#4a4a50', 4, { shade: (k) => { k.fillStyle = rgba('#a8c8d8', 0.7); k.fillRect(tx + 3, base - h - 66, 10, 64); } });
    }
  }
  function chimney(ctx, x, top, base, w) {
    T.texShape(ctx, (k) => { k.moveTo(x - w / 2, base); k.lineTo(x - w * 0.36, top); k.lineTo(x + w * 0.36, top); k.lineTo(x + w / 2, base); k.closePath(); }, '#8a4a36', 'brick', { line: 5, alpha: 0.7, scale: 0.4, detail: (k) => { k.fillStyle = '#d8d0c0'; for (const t of [0.12, 0.2]) k.fillRect(x - w, top + (base - top) * t, w * 2, 10); } });
    ol(ctx, (k) => k.rect(x - w * 0.46, top - 12, w * 0.92, 16), '#5a3a2a', 4);
  }
  T.richBg('factory', (ctx, bg, lt, env) => {
    const hz = H * (bg.horizon ?? 0.72), preset = bg.preset ?? 'overcast', night = preset === 'night', col = bg.color ?? '#3c3f45';
    T.richSky(ctx, bg, lt, env, { preset, horizon: hz });
    const haze = typeof bg.haze === 'string' ? bg.haze : T.atmosColor({ shot: { bg: { kind: 'sky', preset } } });
    T.plane(ctx, env, { f: 0.3, key: key('factory', env, bg, 'far'), haze: T.hazeOf(bg, 0.55), hazeColor: haze }, (g) => T.cityline(g, hz - 20, env.seed + 'ff', T.shade(col, 0.1), { h: 150, domes: false, windowAlpha: night ? 0.6 : 0.15, windowColor: '#f0c060' }));
    const stacks = [];
    T.plane(ctx, env, { f: 0.7, key: key('factory', env, bg, 'halls') }, (g) => {
      const r = T.rng(T.hash(env.seed + 'fac'));
      // water tower behind the halls
      const tx = W * 0.62;
      g.strokeStyle = INK; g.lineWidth = 7; g.beginPath(); for (const d of [-1, -0.35, 0.35, 1]) { g.moveTo(tx + d * 70, hz); g.lineTo(tx + d * 46, hz - 420); } for (let y = hz - 380; y < hz; y += 120) { g.moveTo(tx - 66, y + 110); g.lineTo(tx + 62, y); g.moveTo(tx + 66, y + 110); g.lineTo(tx - 62, y); } g.stroke();
      ol(g, (k) => T.rrect(k, tx - 80, hz - 560, 160, 150, 20), '#6a5a4a', 5, { shade: (k) => { k.strokeStyle = rgba(INK, 0.5); k.lineWidth = 3; for (let x = tx - 60; x < tx + 80; x += 30) { k.beginPath(); k.moveTo(x, hz - 560); k.lineTo(x, hz - 410); k.stroke(); } } });
      ol(g, (k) => { k.moveTo(tx - 90, hz - 556); k.lineTo(tx, hz - 620); k.lineTo(tx + 90, hz - 556); k.closePath(); }, '#4a3a2e', 5);
      for (let i = 0; i < 5; i++) {
        const x = -OV + ((i + 0.2) / 5) * (W + OV * 2), w = 280 + r() * 160, h = 260 + r() * 160;
        if (r() > 0.3) { const cx = x + w * 0.7, ch = 220 + r() * 120; chimney(g, cx, hz - h - ch, hz - h + 20, 56); stacks.push([cx, hz - h - ch]); }
        hall(g, x, hz, w, h, col, env.seed + 'h' + i, { night });
      }
      g.strokeStyle = '#5a5a5e'; g.lineWidth = 14; g.beginPath(); g.moveTo(-OV, hz - 160); g.lineTo(W + OV, hz - 180); g.stroke(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke(); // pipe bridge
      if (bg.banner) { T.texBox(g, W * 0.4, hz - 300, 220, 320, bg.banner, 'fabric', { line: 6, alpha: 0.35 }); ol(g, (k) => k.arc(W * 0.4 + 110, hz - 160, 50, 0, TAU), '#f2efe8', 5); }
    });
    T.plane(ctx, env, { f: 0.7, live: true }, (g) => {
      const r = T.rng(T.hash(env.seed + 'fac'));
      for (let i = 0; i < 5; i++) {
        const x = -OV + ((i + 0.2) / 5) * (W + OV * 2), w = 280 + r() * 160, h = 260 + r() * 160;
        if (r() > 0.3) { const cx = x + w * 0.7, ch = 220 + r() * 120; T.softSmoke(g, cx, hz - h - ch - 14, lt, { seed: env.seed + 'smk' + i, color: night ? '#4a4a52' : '#707074', drift: 180, rise: 320, size: 50, n: 8, alpha: 0.85 }); }
      }
    });
    T.plane(ctx, env, { f: 1, key: key('factory', env, bg, 'yard') }, (g) => {
      T.floorAt(g, 'stone', hz + 30, H + OV, { color: '#5a5d62', seed: 'yard' });
      const r = T.rng(T.hash(env.seed + 'pud'));
      for (let i = 0; i < 5; i++) { const x = r() * W, y = hz + 90 + r() * (H - hz - 120), w = 120 + r() * 160; g.fillStyle = rgba('#a8b4bc', 0.5); g.beginPath(); g.ellipse(x, y, w, w * 0.12, 0, 0, TAU); g.fill(); g.strokeStyle = rgba('#ffffff', 0.4); g.lineWidth = 3; g.beginPath(); g.moveTo(x - w * 0.5, y - 2); g.lineTo(x + w * 0.2, y - 2); g.stroke(); }
      g.strokeStyle = '#3a3a3e'; g.lineWidth = 6; g.beginPath(); g.moveTo(-OV, hz + 26); g.lineTo(W + OV, hz + 26); for (let x = -OV; x < W + OV; x += 90) { g.moveTo(x, hz + 30); g.lineTo(x, hz - 70); } g.moveTo(-OV, hz - 64); g.lineTo(W + OV, hz - 64); g.stroke();
      g.strokeStyle = rgba('#3a3a3e', 0.45); g.lineWidth = 2; for (let x = -OV; x < W + OV; x += 18) { g.beginPath(); g.moveTo(x, hz - 64); g.lineTo(x + 18, hz + 26); g.moveTo(x + 18, hz - 64); g.lineTo(x, hz + 26); g.stroke(); } // chain link
    });
  });
})();
