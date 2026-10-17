// land-kinds.js — new Places 2.0 landscapes: `river` (variant river: banks, reeds, rocks, flowing water; coast: sea
// horizon, beach, rolling surf), `dunes` (lit / shadow dune faces, ripples, mesas, blowing sand), `ancient` (temples
// with columns and pediments, colonnade, statues, cypresses, paved plaza) and `castle` (keep, towers, walls and
// banners on a hill over a timber-framed town with smoking chimneys). Painted look: hazed, cached planes.
(function () {
  'use strict';
  const T = window.TOON, W = T.W, H = T.H, TAU = Math.PI * 2, OV = 420;
  const INK = '#3a281c', rgba = T.rgba;
  const ol = (ctx, path, fill, line = 4, o = {}) => T.outlined(ctx, path, fill, { line, ink: INK, ...o });
  const key = (kind, env, bg, plane) => `${kind}|${env.seed}|${T.bgKey(bg)}|${plane}`;
  const hazeCol = (bg, preset) => (typeof bg.haze === 'string' ? bg.haze : T.atmosColor({ shot: { bg: { kind: 'sky', preset, palette: bg.palette } } }));
  const sky = (ctx, bg, lt, env, preset, hz, clouds) => {
    const r = T.richSky(ctx, bg, lt, env, { preset, horizon: hz, clouds: 0 }), n = bg.clouds ?? clouds;
    if (n) T.plane(ctx, env, { f: 0.3, live: true }, (g) => (T.PAINT ? T.paintSky.clouds(g, { ...bg, clouds: n }, r.pal, lt, env.seed) : T.cloudLayer(g, { ...bg, clouds: n }, r.pal, lt, env.seed)));
    return r;
  };

  // ---------- river / coast ----------
  function reeds(ctx, x, y, s, lt, seed) {
    const r = T.rng(T.hash(seed));
    for (let i = 0; i < 7; i++) {
      const bx = x + (i - 3) * 9 * s, h = (60 + r() * 50) * s, sw = Math.sin(lt * 1.5 + i + x * 0.01) * 6 * s;
      ctx.strokeStyle = i % 2 ? '#4a6a2a' : '#6a8a3a'; ctx.lineWidth = 4 * s; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(bx, y); ctx.quadraticCurveTo(bx + sw * 0.5, y - h * 0.5, bx + sw, y - h); ctx.stroke();
      if (i % 3 === 0) { ctx.fillStyle = '#6a4a2a'; ctx.beginPath(); ctx.ellipse(bx + sw, y - h, 5 * s, 14 * s, 0, 0, TAU); ctx.fill(); }
    }
  }
  T.bgs.river = (ctx, bg, lt, env) => {
    const coast = (bg.variant ?? 'river') === 'coast', preset = bg.preset ?? 'day', hz = (bg.horizon ?? (coast ? 0.5 : 0.55)) * H;
    const { pal } = sky(ctx, bg, lt, env, preset, hz, 4), hc = hazeCol(bg, preset), seed = env.seed + 'river' + (bg.seed ?? '');
    const waterCol = bg.water ?? (coast ? '#3a8ab0' : '#4a92a8');
    if (coast) {
      T.plane(ctx, env, { f: 0.2, key: key('river', env, bg, 'sea') }, (g) => {
        T.waterBody(g, hz, H + OV, waterCol, { sky: pal.stops[pal.stops.length - 1] });
        g.fillStyle = rgba(T.mix(waterCol, '#ffffff', 0.4), 0.6); g.fillRect(-OV, hz, W + OV * 2, 6);
        const hl = T.mix(pal.hills[0], '#a8b8c8', 0.4); g.fillStyle = hl; g.beginPath(); g.moveTo(W * 0.62, hz); g.quadraticCurveTo(W * 0.78, hz - 80, W * 0.98, hz - 40); g.lineTo(W + OV, hz - 30); g.lineTo(W + OV, hz); g.closePath(); g.fill(); // headland
      });
      T.plane(ctx, env, { f: 0.5, live: true }, (g) => T.waterGlints(g, hz + 4, H * 0.72, lt, seed, { n: 50, flow: 0.4 }));
      T.plane(ctx, env, { f: 0.9, key: key('river', env, bg, 'beach') }, (g) => {
        const sand = bg.sand ?? '#e2c890';
        T.outlined(g, (k) => { k.moveTo(-OV, H + OV); k.lineTo(-OV, H * 0.7); k.bezierCurveTo(W * 0.3, H * 0.66, W * 0.6, H * 0.76, W + OV, H * 0.74); k.lineTo(W + OV, H + OV); k.closePath(); }, sand, { line: 4, ink: rgba(INK, 0.5), paint: false, shade: (k) => {
          if (T.PAINT) T.fillTexture(k, null, 'paper', { rect: [-OV, H * 0.6, W + OV * 2, H], alpha: 0.7, scale: 1.4 });
          const wet = k.createLinearGradient(0, H * 0.68, 0, H * 0.8); wet.addColorStop(0, rgba('#8a7a5a', 0.45)); wet.addColorStop(1, rgba('#8a7a5a', 0)); k.fillStyle = wet; k.fillRect(-OV, H * 0.66, W + OV * 2, H * 0.14);
          const r = T.rng(T.hash(seed + 'shell')); for (let i = 0; i < 30; i++) { k.fillStyle = r() < 0.5 ? '#f8f0e0' : '#a89070'; k.beginPath(); k.ellipse(r() * W, H * 0.8 + r() * H * 0.2, 4 + r() * 5, 3, r() * 3, 0, TAU); k.fill(); }
        } });
        const r = T.rng(T.hash(seed + 'rk'));
        for (let i = 0; i < 4; i++) { const x = W * (0.75 + r() * 0.25), y = H * (0.74 + r() * 0.05), s = 50 + r() * 60; ol(g, (k) => T.smoothPath(k, T.blobPts(x, y, s, s * 0.6, seed + 'r' + i, 8, 0.25)), '#7a7468', 4); }
      });
      T.plane(ctx, env, { f: 0.9, live: true }, (g) => { // rolling surf: a foam line that advances and recedes
        for (let j = 0; j < 2; j++) {
          const p = ((lt * 0.25 + j * 0.5) % 1), y = H * 0.705 + Math.sin(p * Math.PI) * H * 0.035, a = Math.sin(p * Math.PI) * 0.85;
          g.strokeStyle = rgba('#ffffff', a); g.lineWidth = 8; g.lineCap = 'round'; g.beginPath();
          for (let x = -OV; x <= W + OV; x += 40) { const yy = y + (x / W) * H * 0.04 + Math.sin(x * 0.02 + lt * 2) * 4; x === -OV ? g.moveTo(x, yy) : g.lineTo(x, yy); }
          g.stroke();
        }
      });
      return;
    }
    T.plane(ctx, env, { f: 0.3, key: key('river', env, bg, 'far'), haze: T.hazeOf(bg, 0.45), hazeColor: hc }, (g) => T.hillBand(g, hz, 120, 0.0022, seed + 'f', T.mix(pal.hills[0], '#a8c0c8', 0.2), { trees: 7, treeSize: 60 }));
    T.plane(ctx, env, { f: 0.6, key: key('river', env, bg, 'water') }, (g) => {
      const bank = (k, side) => { if (side < 0) { k.moveTo(-OV, hz + 20); k.bezierCurveTo(W * 0.3, hz + 30, W * 0.2, H * 0.8, -OV, H * 0.95); } else { k.moveTo(W + OV, hz + 20); k.bezierCurveTo(W * 0.62, hz + 30, W * 0.9, H * 0.82, W + OV, H * 0.9); } k.closePath(); };
      T.waterBody(g, hz + 20, H + OV, waterCol, { sky: pal.stops[pal.stops.length - 1] });
      for (const side of [-1, 1]) T.outlined(g, (k) => bank(k, side), pal.hills[1], { line: 5, ink: INK, paint: false, shade: (k) => { if (T.PAINT) T.fillTexture(k, null, 'grass', { rect: [-OV, hz, W + OV * 2, H], alpha: 0.6 }); k.strokeStyle = rgba('#5a4a2a', 0.6); k.lineWidth = 14; k.beginPath(); bank(k, side); k.stroke(); } });
      const r = T.rng(T.hash(seed + 'stones'));
      for (let i = 0; i < 8; i++) { const x = W * (0.25 + r() * 0.5), y = hz + 80 + r() * (H - hz - 60), s = 14 + ((y - hz) / H) * 60; ol(g, (k) => T.smoothPath(k, T.blobPts(x, y, s, s * 0.5, seed + 's' + i, 8, 0.25)), '#8a8478', 3); }
      const leaf = T.shade(pal.hills[1], -0.1); // bank vegetation: trees and bushes along both shores
      for (const [x, y, h] of [[0.03, 0.72, 330], [0.13, 0.66, 220], [0.9, 0.7, 300], [0.98, 0.76, 360]]) T.foliageTree(g, x * W, y * H, h, seed + 'bt' + x, { leaf, line: 4, crown: 1.2 });
      for (const [x, y, w] of [[0.08, 0.8, 90], [0.2, 0.7, 60], [0.84, 0.76, 80], [0.72, 0.62, 50]]) T.bush(g, x * W, y * H, w, seed + 'bb' + x, T.shade(leaf, 0.05));
    });
    T.plane(ctx, env, { f: 0.6, live: true }, (g) => T.waterGlints(g, hz + 24, H + 30, lt, seed, { n: 46, flow: 1.6 }));
    T.plane(ctx, env, { f: 1.05, live: true }, (g) => { for (const [x, y, s] of [[0.06, 0.96, 1.4], [0.14, 0.9, 1], [0.9, 0.94, 1.3], [0.82, 0.88, 0.9]]) reeds(g, x * W, y * H, s, lt, seed + x); });
  };

  // ---------- dunes ----------
  // A row of dunes: gentle windward slope up to a sharp crest, a shaded slip face on the side away from the light.
  function dune(ctx, baseY, amp, seed, col, light) {
    const r = T.rng(T.hash(seed)), lit = T.mix(col, '#fff4d8', 0.3), dark = T.mix(T.shade(col, -0.3), '#8a5a6a', 0.2), bottom = H + OV;
    ctx.fillStyle = col; ctx.fillRect(-OV, baseY, W + OV * 2, bottom - baseY);
    for (let x = -OV - 200; x < W + OV;) {
      const w = 420 + r() * 520, h = amp * (0.6 + r() * 0.6), cx = x + w * (light > 0 ? 0.62 : 0.38), cy = baseY - h, x1 = x + w;
      const body = (k) => { k.moveTo(x, baseY + 30); k.quadraticCurveTo(T.lerp(x, cx, 0.55), cy - h * 0.05, cx, cy); k.quadraticCurveTo(T.lerp(cx, x1, 0.35), cy + h * 0.15, x1, baseY + 30); k.lineTo(x1, bottom); k.lineTo(x, bottom); k.closePath(); };
      T.outlined(ctx, body, col, { line: 3, ink: rgba(INK, 0.4), paint: false, shade: (k) => {
        const g = k.createLinearGradient(0, cy, 0, baseY + 120); g.addColorStop(0, rgba(lit, 0.7)); g.addColorStop(1, rgba(col, 0)); k.fillStyle = g; k.fillRect(x, cy, w, baseY + 120 - cy);
        const sx = light > 0 ? x1 : x; // slip face: from the crest down to the far foot
        k.fillStyle = dark; k.beginPath(); k.moveTo(cx, cy); k.quadraticCurveTo(T.lerp(cx, sx, 0.35), cy + h * 0.15, sx, baseY + 30); k.lineTo(sx, bottom); k.lineTo(T.lerp(cx, sx, 0.15), bottom); k.quadraticCurveTo(cx + (sx - cx) * 0.02, cy + h * 0.6, cx, cy); k.closePath(); k.fill();
        if (T.PAINT) T.fillTexture(k, null, 'water', { rect: [x, cy, w, bottom - cy], alpha: 0.3, scale: 1.5, seed: 3 }); // wind ripples
      } });
      ctx.strokeStyle = rgba('#fff8e4', 0.9); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(T.lerp(x, cx, 0.55), cy + h * 0.1); ctx.quadraticCurveTo(T.lerp(x, cx, 0.8), cy, cx, cy); ctx.stroke();
      x += w * (0.55 + r() * 0.2);
    }
  }
  T.bgs.dunes = (ctx, bg, lt, env) => {
    const preset = bg.preset ?? 'day', hz = (bg.horizon ?? 0.58) * H, sand = bg.sand ?? '#e0b878';
    sky(ctx, bg, lt, env, preset, hz, 2);
    const hc = hazeCol(bg, preset), seed = env.seed + 'dunes' + (bg.seed ?? ''), light = T.PAINT && T.PAINT.wx < 0 ? -1 : 1;
    T.plane(ctx, env, { f: 0.2, key: key('dunes', env, bg, 'mesa'), haze: T.hazeOf(bg, 0.3), hazeColor: hc }, (g) => {
      for (const [x, w, h] of [[0.15, 360, 150], [0.72, 520, 110], [0.95, 260, 180]]) ol(g, (k) => { k.moveTo(x * W - w / 2, hz + 10); k.lineTo(x * W - w * 0.4, hz - h); k.lineTo(x * W + w * 0.38, hz - h + 6); k.lineTo(x * W + w / 2, hz + 10); k.closePath(); }, T.mix(sand, '#c06a4a', 0.35), 3, { shade: (k) => { k.fillStyle = rgba('#5a2a2a', 0.3); k.fillRect(x * W + w * 0.05, hz - h, w, h + 10); k.strokeStyle = rgba(INK, 0.3); k.lineWidth = 3; for (let y = hz - h + 30; y < hz; y += 30) { k.beginPath(); k.moveTo(x * W - w / 2, y); k.lineTo(x * W + w / 2, y); k.stroke(); } } });
    });
    [[0.4, 0, 70, 0.35], [0.65, 70, 110, 0.15], [0.9, 170, 120, 0]].forEach(([f, dy, amp, hzA], i) => T.plane(ctx, env, { f, key: key('dunes', env, bg, 'd' + i), haze: T.hazeOf(bg, hzA), hazeColor: hc }, (g) => dune(g, hz + dy + 20, amp, seed + i, T.shade(sand, -0.04 * i), light)));
    T.plane(ctx, env, { f: 1, key: key('dunes', env, bg, 'near') }, (g) => {
      const r = T.rng(T.hash(seed + 'stones'));
      for (let i = 0; i < 5; i++) { const x = r() * W, y = H * (0.86 + r() * 0.1), s = 20 + r() * 30; ol(g, (k) => T.smoothPath(k, T.blobPts(x, y, s, s * 0.5, seed + 'st' + i, 7, 0.3)), '#a88a62', 3); T.contactShadow(g, x + 10, y + s * 0.4, s * 1.2, s * 0.2, 0.3); }
      if (bg.skull !== false) { const x = W * 0.8, y = H * 0.93; ol(g, (k) => { k.arc(x, y - 30, 30, Math.PI * 0.85, Math.PI * 2.15); k.lineTo(x + 16, y); k.lineTo(x - 16, y); k.closePath(); }, '#efe6d0', 4, { shade: (k) => { k.fillStyle = INK; k.beginPath(); k.arc(x - 10, y - 28, 7, 0, TAU); k.arc(x + 10, y - 28, 7, 0, TAU); k.fill(); } }); }
    });
    T.plane(ctx, env, { f: 0.95, live: true }, (g) => { // blowing sand streaks + heat shimmer specks
      const r = T.rng(T.hash(seed + 'blow'));
      g.lineCap = 'round';
      for (let i = 0; i < 26; i++) { const sp = 160 + r() * 200, y = hz + 40 + r() * (H - hz), len = 60 + r() * 120, x = ((r() * (W + 600) + lt * sp) % (W + 600)) - 300; g.strokeStyle = rgba('#fff0d0', 0.35 + 0.25 * Math.sin(lt * 2 + i)); g.lineWidth = 2 + r() * 2; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + len / 2, y - 8, x + len, y - 2); g.stroke(); }
    });
  };

  // ---------- ancient city ----------
  function temple(ctx, x, base, w, col, roof, n = 6) {
    const h = w * 0.55, colW = w / (n * 1.6);
    for (let i = 0; i < 3; i++) T.texBox(ctx, x - w / 2 - (3 - i) * 14, base - (i + 1) * 16, w + (3 - i) * 28, 16, T.shade(col, -0.05 * i), 'stone', { line: 3, alpha: 0.3 });
    const top = base - 48 - h;
    ctx.fillStyle = T.shade(col, -0.45); ctx.fillRect(x - w / 2 + 10, top + 20, w - 20, h); // cella in shadow
    for (let i = 0; i < n; i++) T.drawColumn(ctx, x - w / 2 + colW + i * ((w - colW * 2) / (n - 1)), base - 48, h, colW, col);
    T.texBox(ctx, x - w / 2 - 12, top - 34, w + 24, 34, T.shade(col, 0.05), 'stone', { line: 4, alpha: 0.3, detail: (k) => { k.fillStyle = rgba(INK, 0.35); for (let dx = x - w / 2; dx < x + w / 2; dx += 22) k.fillRect(dx, top - 24, 10, 14); } });
    ol(ctx, (k) => { k.moveTo(x - w / 2 - 22, top - 34); k.lineTo(x, top - 34 - w * 0.2); k.lineTo(x + w / 2 + 22, top - 34); k.closePath(); }, roof ?? T.shade(col, 0.08), 5, { shade: (k) => { k.strokeStyle = rgba(INK, 0.5); k.lineWidth = 3; k.beginPath(); k.moveTo(x - w * 0.36, top - 40); k.lineTo(x, top - 34 - w * 0.16); k.lineTo(x + w * 0.36, top - 40); k.closePath(); k.stroke(); } });
  }
  function statue(ctx, x, base, s, col) {
    T.texBox(ctx, x - 40 * s, base - 80 * s, 80 * s, 80 * s, T.shade(col, -0.1), 'stone', { line: 4, alpha: 0.3 });
    ol(ctx, (k) => { k.moveTo(x - 30 * s, base - 80 * s); k.quadraticCurveTo(x - 36 * s, base - 200 * s, x - 14 * s, base - 230 * s); k.lineTo(x + 14 * s, base - 230 * s); k.quadraticCurveTo(x + 36 * s, base - 200 * s, x + 30 * s, base - 80 * s); k.closePath(); }, col, 4);
    ol(ctx, (k) => k.arc(x, base - 255 * s, 26 * s, 0, TAU), col, 4);
    ol(ctx, (k) => { k.moveTo(x + 20 * s, base - 210 * s); k.lineTo(x + 60 * s, base - 290 * s); k.lineTo(x + 70 * s, base - 284 * s); k.lineTo(x + 30 * s, base - 196 * s); k.closePath(); }, col, 3);
  }
  T.bgs.ancient = (ctx, bg, lt, env) => {
    const preset = bg.preset ?? 'day', hz = (bg.horizon ?? 0.6) * H, marble = bg.stone ?? '#e8dcc4', seed = env.seed + 'anc' + (bg.seed ?? '');
    const { pal } = sky(ctx, bg, lt, env, preset, hz, 4), hc = hazeCol(bg, preset);
    T.plane(ctx, env, { f: 0.25, key: key('ancient', env, bg, 'far'), haze: T.hazeOf(bg, 0.5), hazeColor: hc }, (g) => {
      T.hillBand(g, hz - 30, 160, 0.0018, seed + 'hill', pal.hills[0], { trees: 0, strokes: 30 });
      const r = T.rng(T.hash(seed + 'roofs'));
      for (let x = -OV; x < W + OV; x += 70 + r() * 50) { const w = 70 + r() * 60, h = 40 + r() * 50, y = hz + 10 + r() * 20; g.fillStyle = T.mix(marble, '#c8a888', 0.4); g.fillRect(x, y - h, w, h + 30); g.fillStyle = '#b8684a'; g.beginPath(); g.moveTo(x - 6, y - h); g.lineTo(x + w / 2, y - h - 22); g.lineTo(x + w + 6, y - h); g.fill(); }
      temple(g, W * 0.72, hz - 40, 300, T.mix(marble, '#d0c0a0', 0.2), '#c87050', 6);
    });
    T.plane(ctx, env, { f: 0.55, key: key('ancient', env, bg, 'mid'), haze: T.hazeOf(bg, 0.2), hazeColor: hc }, (g) => {
      const r = T.rng(T.hash(seed + 'cyp'));
      for (const x of [0.06, 0.12, 0.88, 0.95]) T.foliageTree(g, x * W, hz + 90, 320 + r() * 80, seed + 'c' + x, { kind: 'cypress', leaf: '#3e5a32', line: 4 });
      temple(g, W * 0.32, hz + 90, 560, marble, null, 8);
    });
    T.plane(ctx, env, { f: 0.85, key: key('ancient', env, bg, 'colonnade') }, (g) => {
      T.texBox(g, -OV, hz + 120, W + OV * 2, H, '#d8c8a8', null, { line: 0 });
      T.floorAt(g, 'stone', hz + 130, H + OV, { color: bg.paving ?? '#d0c0a0', seed: 'agora' });
      if (bg.colonnade !== false) for (const x of [-0.02, 0.08, 0.92, 1.02]) T.drawColumn(g, x * W, hz + 150, H * 0.8, 110, marble);
      if (bg.colonnade !== false) for (const d of [-1, 1]) T.texBox(g, d < 0 ? -OV : W * 0.88, -OV, W * 0.12 + OV, hz + 150 - H * 0.8 + OV, T.shade(marble, -0.05), 'stone', { line: 5, alpha: 0.3 });
      if (bg.statue !== false) statue(g, W * 0.62, hz + 230, 1, T.shade(marble, -0.02));
    });
  };

  // ---------- castle and town ----------
  function tower(ctx, x, base, w, h, stone, roof) {
    T.texBox(ctx, x - w / 2, base - h, w, h, stone, 'stone', { line: 5, alpha: 0.45, scale: 0.5, detail: (k) => { k.fillStyle = '#1a1410'; for (let y = base - h + 50; y < base - 40; y += 90) { k.beginPath(); T.rrect(k, x - 8, y, 16, 34, 8); k.fill(); } } });
    if (roof) ol(ctx, (k) => { k.moveTo(x - w / 2 - 14, base - h); k.lineTo(x, base - h - w * 1.3); k.lineTo(x + w / 2 + 14, base - h); k.closePath(); }, roof, 5, { shade: (k) => { k.strokeStyle = rgba('#1a0a10', 0.35); k.lineWidth = 3; for (let i = 1; i < 4; i++) { k.beginPath(); k.moveTo(x - w / 2 + i * w / 4, base - h); k.lineTo(x, base - h - w * 1.3); k.stroke(); } } });
    else for (let cx = x - w / 2; cx < x + w / 2 - 4; cx += 22) ol(ctx, (k) => k.rect(cx, base - h - 22, 14, 22), stone, 3);
  }
  function house(ctx, x, base, w, h, seed) {
    const r = T.rng(T.hash(seed)), plaster = ['#efe2c4', '#e8d4b0', '#f2e8d0'][Math.floor(r() * 3)], beam = '#5a3a24', roof = ['#9a4a32', '#6a4a3a', '#8a5a3a'][Math.floor(r() * 3)];
    T.texBox(ctx, x - w / 2, base - h, w, h, plaster, 'plaster', { line: 4, alpha: 0.5, detail: (k) => { k.strokeStyle = beam; k.lineWidth = 6; k.strokeRect(x - w / 2 + 3, base - h + 3, w - 6, h - 6); k.beginPath(); k.moveTo(x - w / 2, base - h * 0.5); k.lineTo(x + w / 2, base - h * 0.5); k.moveTo(x - w / 2, base - h); k.lineTo(x - w * 0.1, base - h * 0.5); k.moveTo(x + w / 2, base - h); k.lineTo(x + w * 0.1, base - h * 0.5); k.stroke(); k.fillStyle = '#3a2a22'; k.fillRect(x - w * 0.3, base - h * 0.85, w * 0.18, h * 0.22); k.fillRect(x + w * 0.12, base - h * 0.85, w * 0.18, h * 0.22); k.fillRect(x - w * 0.1, base - h * 0.42, w * 0.2, h * 0.42); } });
    ol(ctx, (k) => { k.moveTo(x - w / 2 - 14, base - h); k.lineTo(x, base - h - w * 0.55); k.lineTo(x + w / 2 + 14, base - h); k.closePath(); }, roof, 4, { shade: (k) => { if (T.PAINT) T.fillTexture(k, null, 'brick', { rect: [x - w, base - h - w, w * 2, w], alpha: 0.35, scale: 0.35 }); } });
    ol(ctx, (k) => k.rect(x + w * 0.18, base - h - w * 0.45, w * 0.12, w * 0.3), '#8a6a5a', 3);
    return [x + w * 0.24, base - h - w * 0.47];
  }
  const townLayout = (seed, hz) => { const r = T.rng(T.hash(seed + 'town')), out = []; for (let x = -OV + 60; x < W + OV; x += 150 + r() * 60) out.push([x, hz + 150 + r() * 40, 130 + r() * 50, 110 + r() * 60]); return out; };
  T.bgs.castle = (ctx, bg, lt, env) => {
    const preset = bg.preset ?? 'day', hz = (bg.horizon ?? 0.56) * H, stone = bg.stone ?? '#a8a090', roof = bg.roof ?? '#3a4a7a', flag = bg.flag ?? '#c0302a';
    const { pal } = sky(ctx, bg, lt, env, preset, hz, 4), hc = hazeCol(bg, preset), seed = env.seed + 'castle' + (bg.seed ?? ''), cx = (bg.at ?? 0.62) * W;
    T.plane(ctx, env, { f: 0.25, key: key('castle', env, bg, 'far'), haze: T.hazeOf(bg, 0.5), hazeColor: hc }, (g) => T.hillBand(g, hz, 120, 0.002, seed + 'far', T.mix(pal.hills[0], '#a0b8c0', 0.3), { trees: 8, treeSize: 50 }));
    const towers = [[cx - 300, 380, 110, roof], [cx + 300, 380, 110, roof], [cx - 120, 520, 140, roof], [cx + 120, 470, 120, null], [cx, 600, 170, roof]];
    T.plane(ctx, env, { f: 0.45, key: key('castle', env, bg, 'castle'), haze: T.hazeOf(bg, 0.18), hazeColor: hc }, (g) => {
      const base = hz + 40;
      T.hillBand(g, base + 40, 180, 0.0016, seed + 'hill', pal.hills[1], { bushes: 6, bushSize: 40, trees: 3, treeSize: 90 });
      T.texBox(g, cx - 320, base - 220, 640, 230, stone, 'stone', { line: 5, alpha: 0.45, scale: 0.5, detail: (k) => { k.fillStyle = '#1a1410'; k.beginPath(); k.moveTo(cx - 50, base + 10); k.lineTo(cx - 50, base - 80); k.arc(cx, base - 80, 50, Math.PI, 0); k.lineTo(cx + 50, base + 10); k.fill(); } });
      for (let x = cx - 320; x < cx + 320; x += 32) ol(g, (k) => k.rect(x, base - 246, 20, 26), stone, 3);
      for (const [x, h, w, rf] of towers) tower(g, x, base, w, h, T.shade(stone, (x - cx) * 0.0002), rf);
    });
    T.plane(ctx, env, { f: 0.45, live: true }, (g) => { // banners flutter on the roofed towers
      const base = hz + 40;
      for (const [x, h, w, rf] of towers) {
        if (!rf) continue;
        const top = base - h - w * 1.3, wv = T.sway(lt, seed + x, 0.9, 8);
        g.strokeStyle = INK; g.lineWidth = 4; g.beginPath(); g.moveTo(x, top); g.lineTo(x, top - 70); g.stroke();
        ol(g, (k) => { k.moveTo(x, top - 70); k.quadraticCurveTo(x + 30, top - 74 + wv, x + 64, top - 62 + wv * 1.4); k.quadraticCurveTo(x + 30, top - 48 + wv, x, top - 46); k.closePath(); }, flag, 3);
      }
    });
    const houses = townLayout(seed, hz);
    T.plane(ctx, env, { f: 0.75, key: key('castle', env, bg, 'town') }, (g) => {
      T.hillBand(g, hz + 190, 30, 0.002, seed + 'th', T.shade(pal.hills[1], 0.05), { strokes: 20 });
      houses.forEach(([x, b, w, h], i) => house(g, x, b + 40, w, h, seed + 'h' + i));
    });
    T.plane(ctx, env, { f: 0.75, live: true }, (g) => houses.forEach(([x, b, w, h], i) => { if (i % 2) return; T.softSmoke(g, x + w * 0.24, b + 40 - h - w * 0.47, lt, { seed: seed + 'hs' + i, color: '#d8d4cc', size: 18, rise: 160, drift: 60, n: 5, alpha: 0.55 }); }));
    T.plane(ctx, env, { f: 1, key: key('castle', env, bg, 'road') }, (g) => {
      T.hillBand(g, H * 0.84, 20, 0.002, seed + 'road', T.shade(pal.hills[0], 0.03), { strokes: 50 });
      T.outlined(g, (k) => { k.moveTo(W * 0.4, H * 0.84); k.lineTo(W * 0.5, H * 0.84); k.lineTo(W * 0.62, H + OV); k.lineTo(W * 0.2, H + OV); k.closePath(); }, '#b89870', { line: 4, ink: rgba(INK, 0.6), shade: (k) => { if (T.PAINT) T.fillTexture(k, null, 'stone', { rect: [W * 0.1, H * 0.8, W * 0.6, H * 0.4], alpha: 0.35, scale: 0.6 }); } });
    });
  };
})();
