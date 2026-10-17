// rich-war.js — painted (Places 2.0) battlefield (hazed ridges with dead trees and smoke columns, cratered mud with
// puddles, stumps, wire on stakes, fires with glow and smoke, drifting ground fog), trench (no-man's-land beyond a
// sandbagged lip, plank revetment with posts, a ladder, flares at night) and harbor (sea with glints, lighthouse and
// town, moored boats bobbing along a plank pier with bollards, rope, crates and lamps, gulls). Same fields as classic.
(function () {
  'use strict';
  const T = window.TOON, W = T.W, H = T.H, TAU = Math.PI * 2, OV = 420;
  const INK = '#3a281c', rgba = T.rgba;
  const ol = (ctx, path, fill, line = 4, o = {}) => T.outlined(ctx, path, fill, { line, ink: INK, ...o });
  const key = (kind, env, bg, plane) => `${kind}|${env.seed}|${T.bgKey(bg)}|${plane}`;
  const hazeCol = (bg, preset) => (typeof bg.haze === 'string' && bg.haze.startsWith('#') ? bg.haze : T.atmosColor({ shot: { bg: { kind: 'sky', preset, palette: bg.palette } } }));

  // Painted crater: dark bowl, inner shadow, lit far rim, thrown-up near lip, sometimes a puddle reflecting the sky.
  function crater(ctx, x, y, rx, col, wet, sky) {
    const ry = rx * 0.28;
    ctx.fillStyle = T.mix(col, '#d8c8a0', 0.2); ctx.beginPath(); ctx.ellipse(x, y + ry * 0.15, rx * 1.18, ry * 1.35, 0, 0, TAU); ctx.fill(); // spoil ring
    ctx.fillStyle = T.shade(col, -0.35); ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.clip();
    ctx.fillStyle = T.shade(col, -0.1); ctx.beginPath(); ctx.ellipse(x, y + ry * 0.55, rx * 0.95, ry * 0.75, 0, 0, TAU); ctx.fill();
    if (wet) { ctx.fillStyle = T.mix(sky, '#5a6a6a', 0.45); ctx.beginPath(); ctx.ellipse(x, y + ry * 0.4, rx * 0.55, ry * 0.4, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = rgba('#ffffff', 0.5); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - rx * 0.3, y + ry * 0.3); ctx.lineTo(x + rx * 0.1, y + ry * 0.3); ctx.stroke(); }
    ctx.restore();
    ctx.strokeStyle = rgba('#fff0c8', 0.35); ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(x, y - 3, rx, ry, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
    ctx.strokeStyle = rgba(INK, 0.45); ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI); ctx.stroke();
  }
  function stump(ctx, x, y, h, seed) {
    const r = T.rng(T.hash(seed));
    ol(ctx, (k) => { k.moveTo(x - h * 0.16, y); k.lineTo(x - h * 0.1, y - h * 0.8); k.lineTo(x - h * 0.02, y - h); k.lineTo(x + h * 0.04, y - h * 0.82); k.lineTo(x + h * 0.08, y - h * 0.9); k.lineTo(x + h * 0.11, y - h * 0.7); k.lineTo(x + h * 0.17, y); k.closePath(); }, '#3a2e24', 4, { shade: (k) => { k.strokeStyle = rgba('#1a120c', 0.5); k.lineWidth = 2; for (let i = 0; i < 3; i++) { const sx = x + (r() - 0.5) * h * 0.18; k.beginPath(); k.moveTo(sx, y); k.lineTo(sx + (r() - 0.5) * 6, y - h * 0.7); k.stroke(); } } });
  }
  function wireLine(ctx, x0, x1, y, seed, h) {
    for (let x = x0; x <= x1; x += 200) ol(ctx, (k) => { k.moveTo(x - 6, y); k.lineTo(x - 2, y - h); k.lineTo(x + 6, y - h); k.lineTo(x + 8, y); k.closePath(); }, '#5a4a36', 3);
    ctx.strokeStyle = '#2a2420'; ctx.lineWidth = 3; ctx.beginPath();
    for (let x = x0; x <= x1; x += 6) { const ph = (x - x0) / 38; ctx.lineTo(x + Math.cos(ph * TAU) * 12, y - h * 0.55 + Math.sin(ph * TAU) * 22); }
    ctx.stroke(); ctx.strokeStyle = rgba('#c8c0b0', 0.4); ctx.lineWidth = 1; ctx.stroke();
  }
  function fogBank(ctx, y, lt, seed, col, a = 0.35) {
    const r = T.rng(T.hash(seed + 'fog'));
    for (let i = 0; i < 9; i++) { const sp = 6 + r() * 10, x = ((r() * (W + OV * 2) + lt * sp) % (W + OV * 2)) - OV, rx = 260 + r() * 260, g = ctx.createRadialGradient(x, y, 0, x, y, rx); g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0)); ctx.fillStyle = g; ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.28); ctx.translate(-x, -y); ctx.fillRect(x - rx, y - rx, rx * 2, rx * 2); ctx.restore(); }
  }

  // ---------- battlefield ----------
  T.richBg('battlefield', (ctx, bg, lt, env) => {
    const seed = env.seed + 'bf', hz = (bg.horizon ?? 0.5) * H, preset = bg.preset ?? 'sepia', ground = bg.ground ?? '#6b5f3a', crCol = bg.crater ?? '#4a4128';
    const { pal } = T.richSky(ctx, bg, lt, env, { preset, horizon: hz }), hc = hazeCol(bg, preset), sky = pal.stops[pal.stops.length - 1];
    T.plane(ctx, env, { f: 0.3, key: key('bf', env, bg, 'far'), haze: 0.45, hazeColor: hc }, (g) => {
      T.hillBand(g, hz - 10, 100, 0.0022, seed + 'far', T.mix(bg.hill ?? '#8a7a50', '#6a6a5a', 0.3), { strokes: 30 });
      const r = T.rng(T.hash(seed + 'farT'));
      for (let i = 0; i < 9; i++) T.deadTree(g, r() * (W + OV) - OV / 2, hz + 10 + r() * 20, 120 + r() * 90, seed + 'ft' + i, '#4a4038');
      for (let i = 0; i < 3; i++) { const x = W * (0.15 + i * 0.33 + r() * 0.1); for (let j = 0; j < 7; j++) { g.fillStyle = rgba('#4a443c', 0.35 - j * 0.03); g.beginPath(); g.arc(x + j * j * 3, hz - 30 - j * 60, 40 + j * 14, 0, TAU); g.fill(); } } // distant smoke columns
    });
    T.plane(ctx, env, { f: 0.45, key: key('bf', env, bg, 'ridge'), haze: 0.2, hazeColor: hc }, (g) => T.hillBand(g, hz + 20, 70, 0.003, seed + 'h', bg.hill ?? '#8a7a50', { strokes: 40, texture: 'grass', texAlpha: 0.4 }));
    T.plane(ctx, env, { f: 0.8, key: key('bf', env, bg, 'ground') }, (g) => {
      g.fillStyle = ground; g.fillRect(-OV, hz + 30, W + OV * 2, H + OV);
      T.fillTexture(g, null, 'stone', { rect: [-OV, hz + 30, W + OV * 2, H], alpha: 0.35, scale: 1.3 });
      T.fillTexture(g, null, 'grass', { rect: [-OV, hz + 30, W + OV * 2, H], alpha: 0.3, scale: 1.1 });
      const near = g.createLinearGradient(0, hz + 30, 0, H); near.addColorStop(0, rgba('#140a06', 0.3)); near.addColorStop(0.25, rgba('#140a06', 0)); near.addColorStop(1, rgba('#140a06', 0.3)); g.fillStyle = near; g.fillRect(-OV, hz + 30, W + OV * 2, H);
      const cr = T.rng(T.hash(seed + 'c')), list = [];
      for (let i = 0; i < (bg.craters ?? 14); i++) { const x = -OV + cr() * (W + OV * 2), t = cr(), y = T.lerp(hz + 50, H * 0.95, t); list.push([x, y, 50 + cr() * 90 * (0.5 + t), cr() < 0.35]); }
      list.sort((a, b) => a[1] - b[1]).forEach(([x, y, rx, wet]) => crater(g, x, y, rx, crCol, wet, sky));
      const r = T.rng(T.hash(seed + 'tr'));
      for (let i = 0; i < (bg.trees ?? 4); i++) { const x = -OV + r() * (W + OV * 2), y = hz + 40 + r() * 80, h = 260 + r() * 200; T.deadTree(g, x, y, h, seed + 't' + i); }
      const sr = T.rng(T.hash(seed + 'stumps'));
      for (let i = 0; i < 6; i++) stump(g, sr() * W, hz + 120 + sr() * (H - hz - 160), 50 + sr() * 50, seed + 's' + i);
      for (let i = 0; i < 5; i++) { const x = sr() * W, y = hz + 140 + sr() * (H - hz - 180); g.save(); g.translate(x, y); g.rotate((sr() - 0.5) * 0.6); T.texBox(g, -70, -9, 140, 18, '#6a5236', 'wood', { line: 3 }); g.restore(); } // broken planks
      if (bg.wire) wireLine(g, -OV, W + OV, H * 0.78, seed + 'w', 70);
      if (bg.bodies) {
        const br = T.rng(T.hash(seed + 'b'));
        for (let i = 0; i < bg.bodies; i++) {
          const x = -OV * 0.5 + br() * (W + OV), y = hz + 80 + br() * (H - hz - 140);
          g.fillStyle = '#9b1c1c'; g.beginPath(); g.ellipse(x + 20, y + 8, 70, 16, 0, 0, TAU); g.fill();
          ol(g, (k) => k.ellipse(x, y, 50, 18, 0.1, 0, TAU), bg.bodyColor ?? '#77735e', 5);
          ol(g, (k) => k.arc(x + 52, y - 4, 16, 0, TAU), '#f2efe8', 4);
        }
      }
      const gr = T.rng(T.hash(seed + 'g')); g.strokeStyle = rgba('#c8be78', 0.6); g.lineWidth = 4; g.lineCap = 'round';
      for (let i = 0; i < 90; i++) { const x = -OV + gr() * (W + OV * 2), y = H * 0.82 + gr() * H * 0.18; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 6, y - 26); g.moveTo(x, y); g.lineTo(x + 8, y - 22); g.stroke(); }
    });
    T.plane(ctx, env, { f: 0.8, live: true }, (g) => {
      if (bg.fires) { const fr = T.rng(T.hash(seed + 'f')); for (let i = 0; i < bg.fires; i++) { const x = -OV + fr() * (W + OV * 2), y = hz + 50 + fr() * (H - hz - 120), s = 70 + fr() * 70; T.lampPool(g, x, y - s * 0.4, s * 3, '#ff8a30', 0.45, lt, seed + 'fg' + i); T.softSmoke(g, x, y - s * 0.8, lt, { seed: seed + 'fs' + i, color: '#3a342e', size: s * 0.45, rise: 360, drift: 140, n: 7, alpha: 0.7 }); g.save(); g.translate(x, y); T.drawFlame(g, s, lt + i * 0.2, seed + 'fl' + i); g.restore(); } }
      fogBank(g, H * 0.72, lt, seed, T.mix(sky, '#d8c8a8', 0.4), 0.3);
    });
    if (bg.haze) { ctx.fillStyle = bg.haze === true ? 'rgba(217,164,65,0.22)' : bg.haze; ctx.fillRect(0, 0, W, H); }
  });

  // ---------- trench ----------
  function sandbags(ctx, x0, x1, y, seed, col) {
    const r = T.rng(T.hash(seed));
    for (let row = 0; row < 2; row++) for (let x = x0 + (row % 2) * 60; x < x1; x += 120) {
      const yy = y - row * 40 + r() * 6;
      ol(ctx, (k) => T.rrect(k, x, yy - 44, 128, 50, 22), T.shade(col, -0.05 * row + (r() - 0.5) * 0.08), 5, { shade: (k) => { if (T.PAINT) T.fillTexture(k, null, 'fabric', { rect: [x, yy - 44, 128, 50], alpha: 0.4, scale: 0.5 }); k.strokeStyle = rgba('#2a2014', 0.5); k.lineWidth = 3; k.beginPath(); k.moveTo(x + 14, yy - 20); k.quadraticCurveTo(x + 64, yy - 12, x + 114, yy - 20); k.stroke(); } });
    }
  }
  T.richBg('trench', (ctx, bg, lt, env) => {
    const night = !!bg.night, seed = env.seed + 'trench', hz = (bg.horizon ?? 0.5) * H, lip = (bg.lip ?? 0.62) * H, preset = night ? 'night' : bg.preset ?? 'sepia';
    const { pal } = T.richSky(ctx, bg, lt, env, { preset, horizon: hz }), hc = hazeCol(bg, preset), sky = pal.stops[pal.stops.length - 1];
    T.plane(ctx, env, { f: 0.4, key: key('trench', env, bg, 'far'), haze: 0.4, hazeColor: hc }, (g) => {
      T.hillBand(g, hz, 110, 0.002, seed + 'm', night ? '#2c3456' : '#a89a78', { strokes: 30 });
      const r = T.rng(T.hash(seed + 'ft')); for (let i = 0; i < 7; i++) T.deadTree(g, r() * (W + OV) - OV / 2, hz + 10, 100 + r() * 80, seed + 'd' + i, night ? '#1a1e2c' : '#4a4038');
    });
    T.plane(ctx, env, { f: 0.65, key: key('trench', env, bg, 'nml') }, (g) => {
      const ground = night ? '#2a3046' : '#6b5f3a';
      g.fillStyle = ground; g.fillRect(-OV, hz + 20, W + OV * 2, H);
      T.fillTexture(g, null, 'stone', { rect: [-OV, hz + 20, W + OV * 2, H], alpha: 0.3, scale: 1.2 });
      const cr = T.rng(T.hash(seed + 'c'));
      for (let i = 0; i < 9; i++) crater(g, -OV + cr() * (W + OV * 2), T.lerp(hz + 40, lip - 20, cr()), 40 + cr() * 60, night ? '#1f2438' : '#4a4128', cr() < 0.3, sky);
      if (bg.wire !== false) wireLine(g, -OV, W + OV, lip - 30, seed + 'w', 50);
      const lipPath = (k) => { k.moveTo(-OV, H + OV); for (let x = -OV; x <= W + OV; x += 40) k.lineTo(x, lip + T.noise(x * 0.01, seed + 'lip') * 16); k.lineTo(W + OV, H + OV); k.closePath(); };
      g.fillStyle = night ? '#2a2f45' : '#7d7a45'; g.beginPath(); lipPath(g); g.fill();
      T.fillTexture(g, null, 'grass', { rect: [-OV, lip - 20, W + OV * 2, H], alpha: 0.4 });
      g.strokeStyle = INK; g.lineWidth = 6; g.beginPath(); lipPath(g); g.stroke();
      sandbags(g, -OV, W + OV, lip + 18, seed + 'sb', night ? '#5a5a6a' : '#a89a7a');
    });
    T.plane(ctx, env, { f: 0.65, live: true }, (g) => {
      if (bg.burning) { for (let i = 0; i < 9; i++) { const x = -OV + ((i + 0.5) / 9) * (W + OV * 2); T.lampPool(g, x, lip - 20, 220, '#ff8a30', 0.4, lt, seed + 'b' + i); g.save(); g.translate(x, lip + 4); T.drawFlame(g, 100 + (T.hash(seed + i) % 40), lt + i * 0.13, seed + 'f' + i); g.restore(); } T.softSmoke(g, W * 0.5, lip - 60, lt, { n: 10, color: '#5a524a', seed: seed + 's', rise: 380, size: 60, drift: 160, alpha: 0.5 }); }
      if (night) { const p = (lt % 4) / 4, fx = W * 0.62 + p * 220, fy = hz - 260 + Math.pow(p - 0.5, 2) * 500; T.lampPool(g, fx, fy, 520, '#e8f0ff', 0.35 * (1 - p * 0.6)); g.fillStyle = '#ffffff'; g.beginPath(); g.arc(fx, fy, 8, 0, TAU); g.fill(); } // drifting flare
      fogBank(g, lip - 40, lt, seed, night ? '#4a5470' : T.mix(sky, '#d8c8a8', 0.4), 0.28);
    });
    if (bg.back !== false) T.plane(ctx, env, { f: 0.9, key: key('trench', env, bg, 'back') }, (g) => {
      const top = lip + 40, wood = night ? '#4a4a58' : '#7a5a3a';
      g.fillStyle = night ? '#252a3c' : '#4b3d2a'; g.fillRect(-OV, top - 30, W + OV * 2, H + OV);
      for (let y = top; y < H + OV; y += 54) T.texBox(g, -OV, y, W + OV * 2, 50, T.shade(wood, ((y / 54) % 3) * 0.05 - 0.05), 'wood', { line: 4 }); // plank revetment
      for (let x = -OV + 80; x < W + OV; x += 320) T.texBox(g, x - 22, top - 60, 44, H + OV, T.shade(wood, -0.25), 'wood', { line: 5, rot: 90 }); // posts
      const lx = W * 0.72; for (const d of [-1, 1]) T.texBox(g, lx + d * 50 - 10, top - 140, 20, H, '#8a6a42', 'wood', { line: 4, rot: 90 }); for (let y = top - 110; y < H; y += 70) T.texBox(g, lx - 50, y, 100, 14, '#8a6a42', 'wood', { line: 3 }); // ladder
      sandbags(g, -OV, W + OV, top - 10, seed + 'back', night ? '#4a4a5a' : '#968866');
      const mud = g.createLinearGradient(0, H * 0.8, 0, H); mud.addColorStop(0, rgba('#2a1e10', 0)); mud.addColorStop(1, rgba('#2a1e10', 0.5)); g.fillStyle = mud; g.fillRect(-OV, H * 0.8, W + OV * 2, H * 0.4);
    });
  });

  // ---------- harbor ----------
  function boat(ctx, s, hull, sail, mast) {
    ol(ctx, (k) => { k.moveTo(-150 * s, -30 * s); k.lineTo(160 * s, -30 * s); k.quadraticCurveTo(140 * s, 25 * s, 90 * s, 34 * s); k.lineTo(-100 * s, 34 * s); k.quadraticCurveTo(-140 * s, 18 * s, -150 * s, -30 * s); k.closePath(); }, hull, 4, { shade: (k) => { k.fillStyle = '#f2ead8'; k.fillRect(-160 * s, -30 * s, 330 * s, 9 * s); if (T.PAINT) T.fillTexture(k, null, 'wood', { rect: [-160 * s, -30 * s, 330 * s, 70 * s], alpha: 0.5 }); } });
    if (mast) { ol(ctx, (k) => k.rect(-5 * s, -260 * s, 10 * s, 230 * s), '#4a3424', 3); if (sail) ol(ctx, (k) => { k.moveTo(8 * s, -250 * s); k.lineTo(120 * s, -50 * s); k.lineTo(8 * s, -50 * s); k.closePath(); }, sail, 3); ctx.strokeStyle = rgba(INK, 0.7); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -258 * s); ctx.lineTo(-145 * s, -32 * s); ctx.moveTo(0, -258 * s); ctx.lineTo(155 * s, -32 * s); ctx.stroke(); }
  }
  T.richBg('harbor', (ctx, bg, lt, env) => {
    const time = bg.night ? 'night' : bg.time ?? 'sunset', P = T.HARBOR[time];
    if (!P) throw new Error(`bg harbor: unknown time "${time}" (known: ${Object.keys(T.HARBOR).join(', ')})`);
    const hz = H * (bg.horizon ?? 0.55), seed = env.seed + 'harbor', night = time === 'night', sx = W * 0.7, sy = hz - 60, vx = W * (bg.pierX ?? 0.5);
    T.plane(ctx, env, { f: 0.15, key: key('harbor', env, bg, 'sky') }, (g) => {
      const gr = g.createLinearGradient(0, -OV, 0, hz); P.sky.forEach((c, i) => gr.addColorStop(i / (P.sky.length - 1), c)); g.fillStyle = gr; g.fillRect(-OV, -OV, W + OV * 2, H + OV * 2);
      if (night) { const r = T.rng(T.hash(seed + 'st')); g.fillStyle = '#fff'; for (let i = 0; i < 120; i++) g.fillRect(r() * W, r() * hz * 0.8, 2 + r() * 2, 2 + r() * 2); g.fillStyle = P.sun; g.beginPath(); g.arc(W * 0.8, H * 0.2, 60, 0, TAU); g.fill(); }
      else { T.lampPool(g, sx, sy, 600, P.sun, 0.6); g.fillStyle = P.sun; g.beginPath(); g.arc(sx, sy, 70, 0, TAU); g.fill(); }
      if (T.PAINT) T.paintSky.atmosphere(g, { stops: P.sky, glow: P.sun }, [sx / W, sy / H], hz);
      const hill = T.mix(P.sky[0], '#2a2030', 0.45);
      T.hillBand(g, hz + 6, 110, 0.004, seed + 'hl', hill, { strokes: 0, texture: 'grass', texAlpha: 0.3 });
      T.cityline(g, hz + 4, seed + 'town', T.mix(hill, '#000000', 0.15), { h: 70, windowAlpha: night ? 0.8 : 0.2, windowColor: '#ffd890' });
      const lx = W * 0.12; ol(g, (k) => { k.moveTo(lx - 22, hz - 10); k.lineTo(lx - 14, hz - 170); k.lineTo(lx + 14, hz - 170); k.lineTo(lx + 22, hz - 10); k.closePath(); }, '#f2ead8', 4, { shade: (k) => { k.fillStyle = '#c0392b'; k.fillRect(lx - 30, hz - 120, 60, 26); k.fillRect(lx - 30, hz - 64, 60, 26); } });
      ol(g, (k) => k.rect(lx - 18, hz - 200, 36, 30), '#ffe8a0', 3); ol(g, (k) => { k.moveTo(lx - 24, hz - 200); k.lineTo(lx, hz - 226); k.lineTo(lx + 24, hz - 200); k.closePath(); }, '#3a3a3a', 3);
    });
    T.plane(ctx, env, { f: 0.6, key: key('harbor', env, bg, 'sea') }, (g) => {
      T.waterBody(g, hz, H + OV, P.sea, { sky: P.sky[2] });
      if (!night) { g.fillStyle = rgba(P.sun, 0.4); for (let i = 0; i < 12; i++) g.fillRect(sx - 70 + Math.sin(i * 1.7) * 30, hz + 8 + i * 20, 140 - i * 9, 6); }
    });
    const boats = [[0.16, 0.74, 0.55, '#7a3a2a', '#f2ead8', true], [0.3, 0.86, 0.75, '#2a5a7a', null, true], [0.72, 0.84, 0.7, '#a8442a', '#e8d8b0', true], [0.88, 0.76, 0.5, '#3a6a4a', null, false]];
    T.plane(ctx, env, { f: 0.6, live: true }, (g) => {
      T.waterGlints(g, hz + 4, H + 20, lt, seed, { n: 50, flow: 0.5, color: night ? '#c8d8ff' : '#ffffff' });
      if (night) T.lampPool(g, W * 0.12, hz - 186, 300, '#ffe8a0', 0.4 + 0.3 * Math.max(0, Math.sin(lt * 2)));
      if (bg.ship !== false) { const x = W * (bg.shipX ?? 0.22), y = hz + 40 + Math.sin((lt / 2.2) * TAU) * 4; g.save(); g.translate(x, y); g.rotate(Math.sin((lt / 2.2) * TAU + 1) * 0.015); T.drawSprite(g, env, `hship|${night}|${bg.sail}`, [-280, -360, 560, 420], (k) => boat(k, 1.4, '#3a2620', night ? '#2a2a3a' : bg.sail ?? '#f2ead8', true)); g.restore(); }
      for (const [bx, by, s, hull, sail, mast] of boats) { const ph = bx * 9, y = by * H + Math.sin(lt * 1.6 + ph) * 5 * s; g.save(); g.translate(bx * W, y); g.rotate(Math.sin(lt * 1.3 + ph) * 0.03); T.drawSprite(g, env, `hboat|${bx}|${night}`, [-200 * s, -280 * s, 400 * s, 340 * s], (k) => boat(k, s, hull, sail, mast)); g.restore(); }
      for (let i = 0; i < 4; i++) { const t = (lt * 0.08 + i * 0.27) % 1, x = -100 + t * (W + 200), y = H * (0.12 + i * 0.05) + Math.sin(lt * 2 + i) * 14, f = Math.sin(lt * 9 + i * 2) * 8; g.strokeStyle = night ? '#c8c8d8' : '#3a3a3a'; g.lineWidth = 3; g.beginPath(); g.moveTo(x - 16, y - f); g.quadraticCurveTo(x - 8, y - 8, x, y); g.quadraticCurveTo(x + 8, y - 8, x + 16, y - f); g.stroke(); } // gulls
    });
    T.plane(ctx, env, { f: 1, key: key('harbor', env, bg, 'pier') }, (g) => {
      const wood = night ? '#4a4050' : '#8a5a3a', vy = hz;
      T.texShape(g, (k) => { k.moveTo(vx - 30, vy + 30); k.lineTo(vx + 30, vy + 30); k.lineTo(W * 0.88 + OV, H + OV); k.lineTo(W * 0.12 - OV, H + OV); k.closePath(); }, wood, 'wood', { line: 4, rot: 90, alpha: 0.6, detail: (k) => { k.strokeStyle = rgba('#2a1a10', 0.55); k.lineWidth = 3; for (let i = 0; i < 18; i++) { const f = Math.pow(i / 18, 2), y = vy + 30 + f * (H + OV - vy); k.beginPath(); k.moveTo(-OV, y); k.lineTo(W + OV, y); k.stroke(); } for (let i = -6; i <= 6; i++) { k.beginPath(); k.moveTo(vx + i * 5, vy + 30); k.lineTo(vx + i * 140, H + OV); k.stroke(); } } });
      for (let i = 1; i < 8; i++) { const f = Math.pow(i / 8, 2), y = vy + 30 + f * (H + 120 - vy), w = 6 + f * 40, h = 20 + f * 220; for (const d of [-1, 1]) { const x = vx + d * (30 + f * (W * 0.5)); T.texBox(g, x - w / 2, y - h, w, h + 30, T.shade(wood, -0.35), 'wood', { line: 3, rot: 90 }); if (i % 2 === 0) { g.strokeStyle = '#c8b080'; g.lineWidth = 2 + f * 4; g.beginPath(); g.moveTo(x, y - h * 0.7); g.quadraticCurveTo(x + d * 60 * f, y - h * 0.2, x + d * 140 * f, y + 10); g.stroke(); } } }
      for (const d of [-1, 1]) { const x = vx + d * W * 0.3, y = H * 0.9; ol(g, (k) => { k.moveTo(x - 30, y); k.lineTo(x - 22, y - 60); k.quadraticCurveTo(x, y - 76, x + 22, y - 60); k.lineTo(x + 30, y); k.closePath(); }, '#2a2a2e', 4); for (let j = 0; j < 3; j++) { g.strokeStyle = '#c8b080'; g.lineWidth = 6; g.beginPath(); g.ellipse(x + d * 70, y - 6 - j * 8, 40 - j * 6, 12 - j * 2, 0, 0, TAU); g.stroke(); } } // bollards, rope coils
      T.SET_PARTS.crates.draw(g, { color: '#a8784a' }, env, { x: vx + W * 0.24, y: H * 0.98, s: 0.55, seed: seed + 'cr' });
      for (const d of [-1, 1]) { const x = vx + d * W * 0.2, y = H * 0.8; ol(g, (k) => k.rect(x - 6, y - 300, 12, 300), '#2a2a2e', 3); ol(g, (k) => { k.moveTo(x - 22, y - 300); k.lineTo(x - 14, y - 346); k.lineTo(x + 14, y - 346); k.lineTo(x + 22, y - 300); k.closePath(); }, night ? '#ffe8a0' : '#e8e0c0', 3); }
    });
    if (night) T.plane(ctx, env, { f: 1, live: true }, (g) => { for (const d of [-1, 1]) T.lampPool(g, vx + d * W * 0.2, H * 0.8 - 322, 300, '#ffd890', 0.5, lt, seed + 'pl' + d); });
    if (time === 'fog') { ctx.fillStyle = 'rgba(220,226,228,0.35)'; ctx.fillRect(-OV, -OV, W + OV * 2, H + OV * 2); }
    T.PLACE.vignette(ctx, night ? 0.5 : 0.3);
  });
})();
