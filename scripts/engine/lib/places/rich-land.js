// rich-land.js — painted (Places 2.0) open-air kinds: rich `sky` landscapes (hazed hill planes with bushes and tree
// clumps, textured ground, swaying trees and grass), rich `mountains` (hazed ranges, shaded rock, snow caps, pine
// belts) and the new kinds `hills` (rolling grassland, fence, path, flowers) and `woods` (forest edge: hazed treeline,
// layered foliage trees, meadow, light shafts and pollen). Classic look: the new kinds draw plain versions.
(function () {
  'use strict';
  const T = window.TOON, W = T.W, H = T.H, TAU = Math.PI * 2, OV = 420;
  const INK = '#3a281c', rgba = T.rgba;
  const key = (kind, env, bg, plane) => `${kind}|${env.seed}|${T.bgKey(bg)}|${plane}`;
  const clouds = (ctx, bg, pal, lt, env, n) => T.plane(ctx, env, { f: 0.3, live: true }, (g) => (T.PAINT ? T.paintSky.clouds(g, { ...bg, clouds: n }, pal, lt, env.seed) : T.cloudLayer(g, { ...bg, clouds: n }, pal, lt, env.seed)));
  const sky = (ctx, bg, lt, env, o) => {
    const r = T.richSky(ctx, bg, lt, env, { ...o, clouds: 0 });
    const n = bg.clouds ?? o.clouds ?? 0;
    if (n) clouds(ctx, bg, r.pal, lt, env, n);
    return r;
  };
  const hazeCol = (bg, preset) => (typeof bg.haze === 'string' ? bg.haze : T.atmosColor({ shot: { bg: { kind: 'sky', preset: preset ?? bg.preset ?? 'day', palette: bg.palette } } }));

  // ---------- sky ----------
  T.richBg('sky', (ctx, bg, lt, env, classic) => {
    if (bg.timelapse) { classic(ctx, bg, lt, env); return; }
    const { pal, hz } = sky(ctx, bg, lt, env, {}), seed = env.seed + (bg.seed ?? ''), hc = hazeCol(bg);
    const hills = bg.hills === false ? 0 : bg.hills ?? 3, gy = (bg.groundY ?? 0.8) * H;
    for (let k = 0; k < hills; k++) {
      const col = pal.hills[k % pal.hills.length];
      T.plane(ctx, env, { f: 0.45 + k * 0.18, key: key('sky', env, bg, 'h' + k), haze: T.hazeOf(bg, 0.42 - k * 0.16), hazeColor: hc }, (g) =>
        T.hillBand(g, hz + k * 38, 150 - k * 35, 0.0022 + k * 0.0012, seed + 'h' + k, col, { bushes: k ? 5 + k * 2 : 0, bushSize: 26 + k * 16, trees: k === 1 ? 4 : k === 2 ? 3 : 0, treeSize: 60 + k * 30, strokes: 40 + k * 20, depth: 140 + k * 40 }));
    }
    if (bg.ground !== false || bg.water) T.plane(ctx, env, { f: 1, key: key('sky', env, bg, 'ground') }, (g) => {
      if (bg.water) T.waterBody(g, (bg.water.y ?? 0.82) * H, H + OV, bg.water.color ?? '#5fa8d0');
      if (bg.ground !== false) { T.groundBand(g, bg, pal, gy, seed); T.paintSky.ground(g, bg, pal, gy, seed); }
    });
    const trees = bg.trees || [];
    if (trees.length || (bg.ground ?? 'grass') === 'grass' || bg.water) T.plane(ctx, env, { f: 1, live: true }, (g) => {
      if (bg.water) T.waterGlints(g, (bg.water.y ?? 0.82) * H, H + 40, lt, seed);
      for (const tr of trees) T.swayTree(g, env, tr[0] * W, tr[1] * H, (tr[2] ?? 0.35) * H * 1.15, seed + 't' + tr[0], { leaf: '#6a8a34' }, lt);
      if (bg.ground !== false && (bg.ground ?? 'grass') === 'grass') T.grassTufts(g, gy + 30, H + 20, lt, seed, { n: 14, color: T.shade(pal.ground, -0.05), size: 1.2 });
    });
  });

  // ---------- mountains ----------
  function peak(ctx, x, base, w, h, col, snow, seed, line) {
    const r = T.rng(T.hash(seed)), px = x + (r() - 0.5) * w * 0.2, py = base - h, pts = [[x - w / 2, base]];
    for (let i = 1; i < 6; i++) { const t = i / 6; pts.push([T.lerp(x - w / 2, px, t) + (r() - 0.5) * 18, T.lerp(base, py, t) + (r() - 0.5) * h * 0.06]); }
    pts.push([px, py]);
    for (let i = 1; i < 6; i++) { const t = i / 6; pts.push([T.lerp(px, x + w / 2, t) + (r() - 0.5) * 18, T.lerp(py, base, t) + (r() - 0.5) * h * 0.06]); }
    pts.push([x + w / 2, base]);
    const path = (k) => { k.moveTo(pts[0][0], pts[0][1]); pts.forEach(([a, b]) => k.lineTo(a, b)); k.closePath(); };
    const dark = T.shade(col, -0.3), lit = T.mix(col, '#fff0d0', 0.18);
    T.outlined(ctx, path, col, { line, ink: rgba(INK, 0.7), paint: false, shade: (k) => {
      k.fillStyle = lit; k.beginPath(); k.moveTo(px, py); for (let i = 0; i <= 6; i++) k.lineTo(pts[i][0], pts[i][1]); k.lineTo(px - w * 0.05, base); k.closePath(); k.fill();
      k.fillStyle = dark; k.beginPath(); k.moveTo(px, py); k.lineTo(px + w * 0.06, base); for (let i = 12; i >= 7; i--) k.lineTo(pts[i][0], pts[i][1]); k.closePath(); k.fill();
      k.strokeStyle = rgba(T.shade(col, -0.45), 0.5); k.lineWidth = 3; // gullies
      for (let i = 0; i < 6; i++) { const gx = px + (r() - 0.5) * w * 0.5, gy = py + h * (0.2 + r() * 0.3); k.beginPath(); k.moveTo(gx, gy); k.lineTo(gx + (gx - px) * 0.6, gy + h * 0.35); k.stroke(); }
      if (T.PAINT) T.fillTexture(k, null, 'stone', { rect: [x - w / 2, py, w, h], alpha: 0.3, scale: 0.7 });
      if (snow) {
        const sp = (k2) => { k2.moveTo(px, py - 4); const n = 9; for (let i = 0; i <= n; i++) { const t = i / n, sx = T.lerp(px - w * 0.22, px + w * 0.22, t), sy = py + h * (0.24 + ((i % 2) ? 0.12 : 0) + Math.sin(i * 1.7) * 0.03); k2.lineTo(sx, sy); } k2.closePath(); };
        k.fillStyle = '#f4f8fc'; k.beginPath(); sp(k); k.fill();
        k.save(); k.beginPath(); sp(k); k.clip(); k.fillStyle = '#b8c8e0'; k.beginPath(); k.moveTo(px, py); k.lineTo(px + w * 0.3, py + h * 0.5); k.lineTo(px + w * 0.04, py + h * 0.5); k.closePath(); k.fill(); k.restore();
        k.strokeStyle = rgba('#8aa0c0', 0.8); k.lineWidth = 3; k.beginPath(); sp(k); k.stroke();
      }
    } });
  }
  T.richBg('mountains', (ctx, bg, lt, env, classic) => {
    if ((bg.variant ?? 'peaks') !== 'peaks') { classic(ctx, bg, lt, env); return; }
    const hz = (bg.horizon ?? 0.66) * H, preset = bg.preset ?? 'day';
    const { pal } = sky(ctx, bg, lt, env, { preset, horizon: hz, clouds: 4 }), hc = hazeCol(bg, preset), seed = env.seed + 'mt';
    const gcol = typeof bg.ground === 'string' && bg.ground.startsWith('#') ? bg.ground : pal.ground, snowy = bg.snow ?? parseInt(T.hex6(gcol).slice(1, 3), 16) > 200;
    [[0.22, 0.75, '#8a92a0', 7, 0.55], [0.42, 1.0, '#6e6a6a', 5, 0.3]].forEach(([f, sc, col, n, hz0], li) => T.plane(ctx, env, { f, key: key('mt', env, bg, 'r' + li), haze: T.hazeOf(bg, hz0), hazeColor: hc, mist: [hz - 300, hz + 40] }, (g) => {
      const r = T.rng(T.hash(seed + li));
      for (let i = 0; i < n; i++) { const x = -OV + ((i + r() * 0.5) / n) * (W + OV * 2), w = (380 + r() * 260) * sc, h = (380 + r() * 260) * sc; peak(g, x, hz + li * 40, w, h, li ? T.mix(col, pal.hills[2], 0.3) : col, true, seed + li + 'p' + i, li ? 5 : 4); }
      if (li) for (let x = -OV; x < W + OV; x += 34) T.pine(g, x + (T.hash(seed + x) % 20), hz + 60 + (T.hash(seed + 'y' + x) % 30), 70 + (T.hash(seed + 'h' + x) % 40), '#3a5a44', 3);
    }));
    T.plane(ctx, env, { f: 0.7, key: key('mt', env, bg, 'foot'), haze: T.hazeOf(bg, 0.12), hazeColor: hc }, (g) => {
      T.hillBand(g, hz + 90, 70, 0.003, seed + 'foot', snowy ? '#dfe6ee' : T.shade(gcol, -0.1), { texture: snowy ? 'paper' : 'grass', trees: 0, strokes: 30 });
      const r = T.rng(T.hash(seed + 'pines'));
      for (let i = 0; i < 9; i++) { const x = r() * (W + OV) - OV / 2; T.pine(g, x, hz + 110 + r() * 50, 120 + r() * 80, snowy ? '#3a5a50' : '#3e5a34', 4); }
    });
    T.plane(ctx, env, { f: 1, key: key('mt', env, bg, 'ground') }, (g) => {
      g.fillStyle = gcol; g.fillRect(-OV, hz + 150, W + OV * 2, H + OV);
      if (T.PAINT) T.fillTexture(g, null, snowy ? 'paper' : 'grass', { rect: [-OV, hz + 150, W + OV * 2, H], alpha: 0.6, scale: 1.2 });
      const sh = g.createLinearGradient(0, hz + 150, 0, H); sh.addColorStop(0, rgba(snowy ? '#8aa0c0' : '#1a1020', 0.3)); sh.addColorStop(0.3, rgba('#1a1020', 0)); sh.addColorStop(1, rgba(snowy ? '#7088b0' : '#1a1020', 0.3));
      g.fillStyle = sh; g.fillRect(-OV, hz + 150, W + OV * 2, H);
      g.strokeStyle = rgba(INK, 0.5); g.lineWidth = 4; g.beginPath(); g.moveTo(-OV, hz + 150); g.lineTo(W + OV, hz + 150); g.stroke();
      const r = T.rng(T.hash(seed + 'rocks'));
      for (let i = 0; i < 7; i++) { const x = r() * W, y = hz + 190 + r() * (H - hz - 200), s = 30 + r() * 50; T.outlined(g, (k) => T.smoothPath(k, T.blobPts(x, y, s, s * 0.6, seed + 'rk' + i, 8, 0.25)), snowy ? '#9aa4b0' : '#8a8478', { line: 4, ink: INK, shade: (k) => { if (snowy) { k.fillStyle = '#f4f8fc'; k.beginPath(); k.ellipse(x - s * 0.1, y - s * 0.45, s * 0.8, s * 0.25, 0, 0, TAU); k.fill(); } } }); }
    });
    if (snowy) T.plane(ctx, env, { f: 0.9, live: true }, (g) => { // drifting snow
      const r = T.rng(T.hash(seed + 'snow'));
      g.fillStyle = 'rgba(255,255,255,0.8)';
      for (let i = 0; i < 70; i++) { const x = ((r() * (W + 200) + lt * (20 + r() * 30)) % (W + 200)) - 100, y = ((r() * H + lt * (40 + r() * 50)) % H), s = 2 + r() * 3; g.beginPath(); g.arc(x + Math.sin(lt + i) * 10, y, s, 0, TAU); g.fill(); }
    });
  });

  // ---------- hills (new) ----------
  T.bgs.hills = (ctx, bg, lt, env) => {
    const preset = bg.preset ?? 'day', hz = (bg.horizon ?? 0.56) * H;
    const { pal } = sky(ctx, bg, lt, env, { preset, horizon: hz, clouds: 5 }), hc = hazeCol(bg, preset), seed = env.seed + 'hills' + (bg.seed ?? '');
    const g0 = bg.grass ?? pal.hills[0];
    [[0.25, 0, 0.5, 120, 0.002, T.mix(pal.hills[0], '#a8c0c8', 0.25), { trees: 6, treeSize: 50 }], [0.45, 70, 0.3, 140, 0.0028, pal.hills[0], { bushes: 8, bushSize: 30, trees: 5, treeSize: 80 }], [0.7, 170, 0.1, 120, 0.0034, pal.hills[1], { bushes: 7, bushSize: 50, trees: 2, treeSize: 150 }]]
      .forEach(([f, dy, hzA, amp, fr, col, o], i) => T.plane(ctx, env, { f, key: key('hills', env, bg, 'p' + i), haze: T.hazeOf(bg, hzA), hazeColor: hc }, (g) => {
        const pts = T.hillBand(g, hz + dy, amp, fr, seed + i, col, { ...o, strokes: 50, depth: 220 });
        if (i === 2 && bg.fence !== false) { // fence along the near crest
          g.strokeStyle = INK; g.lineWidth = 5; g.beginPath();
          for (let x = -OV + 40; x < W * 0.55; x += 90) { const y = T.ridgeY(pts, x) + 30; g.moveTo(x, y); g.lineTo(x, y - 54); }
          for (const dy2 of [-44, -20]) { g.moveTo(-OV + 40, T.ridgeY(pts, -OV + 40) + 30 + dy2); for (let x = -OV + 40; x < W * 0.55; x += 90) g.lineTo(x, T.ridgeY(pts, x) + 30 + dy2); }
          g.stroke(); g.strokeStyle = '#a8845a'; g.lineWidth = 2.5; g.stroke();
        }
      }));
    T.plane(ctx, env, { f: 1, key: key('hills', env, bg, 'meadow') }, (g) => {
      T.hillBand(g, H * 0.8, 40, 0.0015, seed + 'm', T.shade(g0, 0.04), { strokes: 70, depth: 260, texScale: 1.2 });
      if (bg.path !== false) T.outlined(g, (k) => { k.moveTo(W * 0.56, H * 0.78); k.quadraticCurveTo(W * 0.5, H * 0.88, W * 0.62, H + OV); k.lineTo(W * 0.86, H + OV); k.quadraticCurveTo(W * 0.62, H * 0.88, W * 0.6, H * 0.78); k.closePath(); }, '#c8a874', { line: 4, ink: rgba(INK, 0.6), shade: (k) => { if (T.PAINT) T.fillTexture(k, null, 'stone', { rect: [W * 0.4, H * 0.76, W * 0.5, H * 0.4], alpha: 0.3, scale: 0.6 }); } });
      const r = T.rng(T.hash(seed + 'fl'));
      for (let i = 0; i < (bg.flowers ?? 60); i++) { const x = r() * (W + OV) - OV / 2, y = H * 0.82 + r() * r() * H * 0.2, s = 3 + (y - H * 0.8) * 0.03; g.fillStyle = ['#f4f0e0', '#f0c040', '#e86a8a', '#c8a0e8'][i % 4]; g.beginPath(); g.arc(x, y, s, 0, TAU); g.fill(); }
    });
    T.plane(ctx, env, { f: 1, live: true }, (g) => {
      for (const tr of bg.trees ?? [[0.1, 0.88, 0.6]]) T.swayTree(g, env, tr[0] * W, tr[1] * H, (tr[2] ?? 0.5) * H, seed + 'tt' + tr[0], { leaf: bg.leaf ?? T.mix('#5a7a30', pal.hills[1], 0.35) }, lt);
      T.grassTufts(g, H * 0.84, H + 20, lt, seed, { n: 18, color: T.shade(g0, -0.05), size: 1.3 });
    });
  };

  // ---------- woods: forest edge (new) ----------
  T.bgs.woods = (ctx, bg, lt, env) => {
    const preset = bg.preset ?? 'day', hz = (bg.horizon ?? 0.6) * H, leaf = bg.leaf ?? '#5d7d32';
    const { pal } = sky(ctx, bg, lt, env, { preset, horizon: hz, clouds: 3 }), hc = hazeCol(bg, preset), seed = env.seed + 'woods' + (bg.seed ?? '');
    T.plane(ctx, env, { f: 0.25, key: key('woods', env, bg, 'line'), haze: T.hazeOf(bg, 0.5), hazeColor: hc }, (g) => {
      const r = T.rng(T.hash(seed + 'tl')), col = T.mix(T.shade(leaf, -0.2), '#6a8a8a', 0.3);
      g.fillStyle = col; g.beginPath(); g.moveTo(-OV, hz + 60);
      for (let x = -OV; x < W + OV; x += 50 + r() * 40) { const rr = 40 + r() * 50; g.arc(x, hz - 40 - r() * 60, rr, Math.PI, 0); }
      g.lineTo(W + OV, hz + 60); g.closePath(); g.fill();
      g.fillStyle = rgba(T.shade(col, 0.2), 0.5); for (let i = 0; i < 60; i++) { g.beginPath(); g.arc(r() * (W + OV * 2) - OV, hz - 60 - r() * 60, 10 + r() * 20, Math.PI, 0); g.fill(); }
    });
    T.plane(ctx, env, { f: 0.45, key: key('woods', env, bg, 'mid'), haze: T.hazeOf(bg, 0.28), hazeColor: hc }, (g) => {
      const r = T.rng(T.hash(seed + 'mid'));
      T.hillBand(g, hz + 70, 30, 0.002, seed + 'mg', T.shade(pal.hills[1], -0.05), { strokes: 20, texture: 'grass' });
      for (const row of [0, 1]) for (let x = -OV + 40 + row * 70; x < W + OV; x += 120 + r() * 70) T.foliageTree(g, x, hz + 70 + row * 30 + r() * 20, (230 + r() * 150) * (row ? 1.1 : 0.9), seed + 'mt' + row + x, { leaf: T.shade(leaf, (row ? -0.02 : -0.14) + r() * 0.08), line: 4, crown: 1.45 });
    });
    T.plane(ctx, env, { f: 0.7, key: key('woods', env, bg, 'near') }, (g) => {
      const r = T.rng(T.hash(seed + 'near'));
      T.hillBand(g, hz + 150, 40, 0.0025, seed + 'ng', pal.hills[1], { strokes: 40, bushes: 9, bushSize: 70, bushColor: T.shade(leaf, -0.1) });
      for (const x of [W * 0.06, W * 0.3, W * 0.74, W * 0.95]) T.foliageTree(g, x + (r() - 0.5) * 80, hz + 200, 420 + r() * 120, seed + 'nt' + x, { leaf, line: 5, crown: 1.25 });
    });
    T.plane(ctx, env, { f: 1, key: key('woods', env, bg, 'meadow') }, (g) => {
      T.hillBand(g, H * 0.82, 30, 0.0016, seed + 'mead', T.shade(pal.hills[0], 0.02), { strokes: 70, depth: 240 });
      const r = T.rng(T.hash(seed + 'fl'));
      for (let i = 0; i < 40; i++) { const x = r() * W, y = H * 0.84 + r() * H * 0.16; g.fillStyle = ['#f4f0e0', '#f0c040', '#e8e0f0'][i % 3]; g.beginPath(); g.arc(x, y, 3 + r() * 3, 0, TAU); g.fill(); }
    });
    T.plane(ctx, env, { f: 1, live: true }, (g) => {
      if (bg.rays !== false && T.PAINT) for (const [x, w] of [[0.2, 110], [0.45, 70], [0.62, 140]]) T.lightShaft(g, x * W, -60, x * W + w, -60, 0.35, 1, H * 0.95, '#fff4c8', 0.16);
      for (const [x, s] of [[-0.02, 0.95], [1.02, 0.9]]) T.swayTree(g, env, x * W, H * 1.04, H * s, seed + 'big' + x, { leaf: T.shade(leaf, -0.12), line: 7 }, lt);
      T.grassTufts(g, H * 0.86, H + 20, lt, seed, { n: 22, color: T.shade(pal.hills[0], -0.1), size: 1.3 });
      if (T.PAINT) T.dustMotes(g, 0, H * 0.2, W, H * 0.7, lt, seed + 'pollen', { n: 30, color: '#fff8c0', alpha: 0.6, size: 2.6, drift: 10 });
    });
  };
})();
