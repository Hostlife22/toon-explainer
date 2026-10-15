// backgrounds.js — painted backgrounds: sky landscapes, interiors, parchment, reaction bursts, flat color, images.
// Every background draws its own parallax planes through env.cam so camera drift feels layered.
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL, W = T.W, H = T.H;
  const OVER = 260; // overscan so camera moves never show edges

  const SKY = {
    sunset: { cloudStyle: 'streak', stops: ['#b84a63', '#e57a5c', '#f6b765', '#fde3a0'], sun: [0.18, 0.62], glow: '#fff1c4', hills: ['#b9774f', '#8c5a3c', '#6e4a2f'], ground: '#9a8a3e', cloud: '#f2a1a0', cloudHi: '#ffd9b5', wisp: '#fff0b8' },
    day: { stops: ['#4f9fe0', '#86c3ee', '#c7e6f6', '#eef8fb'], sun: [0.8, 0.18], glow: '#ffffff', hills: ['#9fb86a', '#7c9a4c', '#5d7d3a'], ground: '#7fa047', cloud: '#ffffff', cloudHi: '#ffffff', wisp: '#ffffff' },
    dusk: { cloudStyle: 'streak', stops: ['#2d3561', '#6c4a8c', '#c8697a', '#f3a37a'], sun: [0.5, 0.7], glow: '#ffd2a0', hills: ['#5b4470', '#433256', '#2e2440'], ground: '#3d3450', cloud: '#8e5f8f', cloudHi: '#d48a9a', wisp: '#f5b6a0' },
    night: { stops: ['#070b1f', '#121c40', '#22305f', '#3a4a7a'], sun: [0.78, 0.2], glow: '#dfe8ff', hills: ['#25304f', '#1b2440', '#121a30'], ground: '#1a2238', cloud: '#2c3a66', cloudHi: '#4a5a8a', wisp: '#6070a0', stars: true },
    storm: { stops: ['#2f353d', '#4a525c', '#6c757e', '#9aa2a8'], sun: [0.5, -0.5], glow: '#c8d0d6', hills: ['#56605a', '#434c47', '#323936'], ground: '#4b5446', cloud: '#5a626c', cloudHi: '#7c858e', wisp: '#9aa3ab' },
    sepia: { stops: ['#b9a273', '#c9b48a', '#ddcca4', '#efe6cf'], sun: [0.7, 0.3], glow: '#fff6dc', hills: ['#b7a98a', '#8f8160', '#6b5f3a'], ground: '#6b5f3a', cloud: '#f3ead3', cloudHi: '#fffaf0', cloudUnder: '#a89070', wisp: '#f3ead3' },
    overcast: { stops: ['#7d8790', '#98a2aa', '#b4bcc2', '#ccd2d6'], sun: [0.5, -0.5], glow: '#dfe4e8', hills: ['#8a9096', '#6f767c', '#555c62'], ground: '#5d6458', cloud: '#c8ced2', cloudHi: '#e2e6e8', cloudUnder: '#8f979e', wisp: '#d2d8dc' },
    teal: { stops: ['#123c45', '#1f6670', '#3f9a9a', '#8ccfc4'], sun: [0.5, 0.5], glow: '#d8fff4', hills: ['#2f5d55', '#244a44', '#183632'], ground: '#2c4f45', cloud: '#2f7a7a', cloudHi: '#5fb0a8', wisp: '#a8e0d4' },
  };
  T.SKY = SKY;

  function skyGradient(ctx, stops, horizonY) {
    const g = ctx.createLinearGradient(0, -OVER, 0, horizonY);
    stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c));
    ctx.fillStyle = g;
    ctx.fillRect(-OVER, -OVER, W + OVER * 2, H + OVER * 2);
  }

  function sunGlow(ctx, x, y, color, r = 620) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(0.25, color + 'cc');
    g.addColorStop(1, color + '00');
    ctx.fillStyle = g;
    ctx.fillRect(-OVER, -OVER, W + OVER * 2, H + OVER * 2);
  }

  T.drawRays = (ctx, x, y, lt, { color = 'rgba(255,250,220,0.22)', count = 9, len = 2600, spin = 0.03, seed = 'rays' } = {}) => {
    const r = T.rng(T.hash(seed));
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = color;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + r() * 0.4 + lt * spin, w = 0.035 + r() * 0.05;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a - w) * len, y + Math.sin(a - w) * len);
      ctx.lineTo(x + Math.cos(a + w) * len, y + Math.sin(a + w) * len);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  };

  function stars(ctx, lt, seed) {
    const r = T.rng(T.hash(seed + 'stars'));
    for (let i = 0; i < 140; i++) {
      const x = r() * (W + OVER * 2) - OVER, y = r() * H * 0.7 - OVER / 2, s = 1 + r() * 2.6;
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(lt * (1 + r() * 2) + i);
      ctx.fillStyle = '#fff';
      ctx.fillRect(x, y, s, s);
    }
    ctx.globalAlpha = 1;
  }

  // Puffy toon cloud: row of circles on a flat base, lighter cap on top.
  function puffCloud(ctx, x, y, w, seed, fill, hi) {
    const r = T.rng(T.hash(seed));
    const n = 4 + Math.floor(r() * 3), circles = [];
    for (let i = 0; i < n; i++) {
      const cx = x + (i / (n - 1) - 0.5) * w, rad = w * (0.13 + r() * 0.12) * (1 - Math.abs(i / (n - 1) - 0.5));
      circles.push([cx, y - rad * 0.4, rad + w * 0.06]);
    }
    const path = () => { ctx.beginPath(); circles.forEach(([cx, cy, rr]) => { ctx.moveTo(cx + rr, cy); ctx.arc(cx, cy, rr, 0, Math.PI * 2); }); ctx.rect(x - w / 2, y - 2, w, w * 0.12); };
    ctx.fillStyle = fill;
    path(); ctx.fill();
    ctx.save(); path(); ctx.clip();
    ctx.fillStyle = hi;
    circles.forEach(([cx, cy, rr]) => { ctx.beginPath(); ctx.arc(cx - rr * 0.15, cy - rr * 0.35, rr * 0.7, 0, Math.PI * 2); ctx.fill(); });
    ctx.restore();
  }

  // Swoosh wisp (thin crescent streaks seen across the reference skies).
  function wisp(ctx, x, y, len, color, seed) {
    const r = T.rng(T.hash(seed));
    ctx.fillStyle = color;
    ctx.beginPath();
    const th = 10 + r() * 14;
    ctx.moveTo(x - len / 2, y);
    ctx.quadraticCurveTo(x, y - th * 2.2, x + len / 2, y - th * 0.6);
    ctx.quadraticCurveTo(x, y - th * 0.4, x - len / 2, y);
    ctx.fill();
  }

  // Sunset/dusk "banana slice" streak cloud: body + bright rim along its lower edge (reference 0:12, 4:48, 35:28).
  function streakCloud(ctx, x, y, len, seed, fill, rim) {
    const r = T.rng(T.hash(seed)), th = 18 + r() * 22;
    const shape = (dy) => { ctx.beginPath(); ctx.moveTo(x - len / 2, y + dy); ctx.quadraticCurveTo(x - len * 0.1, y - th * 1.6 + dy, x + len / 2, y - th * 0.3 + dy); ctx.quadraticCurveTo(x, y + th * 0.25 + dy, x - len / 2, y + dy); ctx.fill(); };
    ctx.fillStyle = rim; shape(7);
    ctx.fillStyle = fill; shape(0);
  }
  // Day cumulus: inked outline, darker blue-grey underside, curled "C" highlight strokes (reference 9:56, 1:56).
  function cumulus(ctx, x, y, w, seed, fill, under) {
    const r = T.rng(T.hash(seed)), n = 5 + Math.floor(r() * 3), cs = [];
    for (let i = 0; i < n; i++) { const t = i / (n - 1) - 0.5; cs.push([x + t * w, y - w * (0.12 + r() * 0.1) * (1 - Math.abs(t) * 1.3), w * (0.16 + r() * 0.08) * (1 - Math.abs(t) * 0.8)]); }
    const path = () => { ctx.beginPath(); cs.forEach(([cx, cy, rr]) => { ctx.moveTo(cx + rr, cy); ctx.arc(cx, cy, rr, 0, Math.PI * 2); }); ctx.rect(x - w * 0.5, y - w * 0.08, w, w * 0.12); };
    ctx.fillStyle = 'rgba(42,28,21,0.75)'; ctx.save(); ctx.translate(0, 0); cs.forEach(([cx, cy, rr]) => { ctx.beginPath(); ctx.arc(cx, cy, rr + 5, Math.PI, Math.PI * 2); ctx.fill(); }); ctx.restore();
    ctx.fillStyle = fill; path(); ctx.fill();
    ctx.save(); path(); ctx.clip();
    ctx.fillStyle = under; ctx.fillRect(x - w, y - w * 0.06, w * 2, w);
    ctx.strokeStyle = T.shade(under, -0.1); ctx.lineWidth = 4; ctx.lineCap = 'round';
    cs.forEach(([cx, cy, rr]) => { ctx.beginPath(); ctx.arc(cx - rr * 0.1, cy + rr * 0.1, rr * 0.45, Math.PI * 0.9, Math.PI * 1.6); ctx.stroke(); });
    ctx.restore();
  }

  function clouds(ctx, bg, pal, lt, seed) {
    const n = bg.clouds === true ? 6 : bg.clouds | 0;
    if (!n) return;
    const r = T.rng(T.hash(seed + 'cl'));
    const speed = bg.wind ?? 8, style = bg.cloudStyle ?? pal.cloudStyle ?? 'cumulus';
    const span = W + OVER * 2 + 600;
    for (let i = 0; i < n; i++) {
      const x = ((r() * span + lt * speed * (0.6 + r())) % span) - OVER - 300;
      const y = H * (0.08 + r() * 0.34);
      if (style === 'streak') {
        for (let j = 0; j < 3; j++) streakCloud(ctx, x + (j - 1) * 120 + r() * 60, y + j * 26, 180 + r() * 220, seed + 's' + i + j, pal.cloud, pal.cloudHi);
      } else cumulus(ctx, x, y, 300 + r() * 300, seed + 'c' + i, pal.cloud, pal.cloudUnder ?? T.shade(pal.stops[1], -0.08));
    }
    for (let i = 0; i < n * 2; i++) {
      const x = ((r() * (W + OVER * 2) + lt * speed * 1.6) % (W + OVER * 2)) - OVER;
      wisp(ctx, x, H * (0.05 + r() * 0.5), 120 + r() * 220, pal.wisp, seed + 'w' + i);
    }
  }

  // Hill band: atmospheric fade toward the horizon colour, lit top rim, darker base, brushy texture (reference 4:08, 6:56).
  function ridge(ctx, baseY, amp, freq, seed, fill, rim, haze = 0) {
    const col = haze > 0 ? T.mix(fill, rim || '#ffffff', haze) : fill;
    const pts = [];
    for (let x = -OVER; x <= W + OVER; x += 30) pts.push([x, baseY - Math.abs(T.noise(x * freq, seed)) * amp - T.noise(x * freq * 3.1, seed + 'd') * amp * 0.18]);
    const path = (k) => { k.moveTo(-OVER, H + OVER); pts.forEach(([x, y]) => k.lineTo(x, y)); k.lineTo(W + OVER, H + OVER); k.closePath(); };
    T.outlined(ctx, path, col, {
      line: 0,
      shade: (k) => {
        const g = k.createLinearGradient(0, baseY - amp, 0, baseY + 140);
        g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(30,15,5,0.28)');
        k.fillStyle = g; k.fillRect(-OVER, baseY - amp * 1.3, W + OVER * 2, H);
        const r = T.rng(T.hash(seed + 'br')); k.lineCap = 'round';
        for (let i = 0; i < 40; i++) {
          const [x, y] = pts[Math.floor(r() * pts.length)], yy = y + 20 + r() * 120;
          k.strokeStyle = r() > 0.5 ? 'rgba(255,240,200,0.12)' : 'rgba(40,20,10,0.12)'; k.lineWidth = 4 + r() * 6;
          k.beginPath(); k.moveTo(x, yy); k.quadraticCurveTo(x + 30, yy - 8, x + 60 + r() * 50, yy - 2); k.stroke();
        }
      },
    });
    ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(42,28,21,0.55)';
    ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
    ctx.lineWidth = 6; ctx.strokeStyle = T.mix(col, '#fff4d0', 0.35);
    ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x - 3, y + 6) : ctx.moveTo(x - 3, y + 6))); ctx.stroke();
  }

  T.drawTree = (ctx, x, y, h, seed, leaf = '#7a8f3a', leafHi = '#a4b450') => {
    T.outlined(ctx, (c) => { c.moveTo(x - h * 0.05, y); c.lineTo(x - h * 0.03, y - h * 0.5); c.lineTo(x + h * 0.03, y - h * 0.5); c.lineTo(x + h * 0.05, y); c.closePath(); }, '#6b4a30', { line: 5 });
    const pts = T.blobPts(x, y - h * 0.7, h * 0.32, h * 0.3, seed, 16, 0.14);
    T.outlined(ctx, (c) => T.smoothPath(c, pts), leaf, {
      line: 5,
      shade: (c) => { c.fillStyle = leafHi; c.beginPath(); c.ellipse(x - h * 0.08, y - h * 0.82, h * 0.22, h * 0.16, 0, 0, Math.PI * 2); c.fill(); },
    });
  };

  function ground(ctx, bg, pal, groundY, seed) {
    const kind = bg.ground ?? 'grass';
    if (kind === 'paddy' && T.paddy) { T.paddy(ctx, groundY, seed); return; }
    const col = { grass: pal.ground, sand: '#d9b77a', stone: '#9b9184', dirt: '#8a6a45', snow: '#eef2f6' }[kind] || kind;
    ctx.fillStyle = col;
    ctx.fillRect(-OVER, groundY, W + OVER * 2, H - groundY + OVER);
    ctx.strokeStyle = 'rgba(42,28,21,0.5)';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-OVER, groundY); ctx.lineTo(W + OVER, groundY); ctx.stroke();
    const r = T.rng(T.hash(seed + 'gr'));
    ctx.strokeStyle = 'rgba(40,30,10,0.22)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 120; i++) {
      const x = r() * (W + OVER * 2) - OVER, y = groundY + 10 + r() * (H - groundY);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 14 + r() * 26, y - 2 - r() * 4); ctx.stroke();
    }
    if (kind === 'grass') {
      ctx.fillStyle = 'rgba(190,200,90,0.5)';
      for (let i = 0; i < 70; i++) {
        const x = r() * (W + OVER * 2) - OVER, y = groundY + r() * 30;
        ctx.beginPath(); ctx.moveTo(x - 8, y + 6); ctx.lineTo(x, y - 18 - r() * 16); ctx.lineTo(x + 8, y + 6); ctx.fill();
      }
    }
  }

  function water(ctx, wy, lt, seed, color = '#5fa8d0') {
    ctx.fillStyle = color;
    ctx.fillRect(-OVER, wy, W + OVER * 2, H - wy + OVER);
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    const r = T.rng(T.hash(seed + 'wa'));
    for (let i = 0; i < 26; i++) {
      const y = wy + 20 + r() * (H - wy), x0 = r() * (W + OVER * 2) - OVER + Math.sin(lt * 1.3 + i) * 18, len = 40 + r() * 90;
      ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + len, y); ctx.stroke();
    }
  }

  // ---------- kinds ----------
  // Shared helpers for other background modules (places*.js).
  T.ridge = (...a) => ridge(...a);
  T.groundBand = (ctx, bg, pal, gy, seed) => ground(ctx, bg, pal, gy, seed);
  T.waterBand = (...a) => water(...a);
  T.cloudLayer = (ctx, bg, pal, lt, seed) => clouds(ctx, bg, pal, lt, seed);
  T.OVERSCAN = OVER;

  // Time-lapse sky: a smiling sun crosses on an arc, then a crescent moon; the gradient blends day <-> night.
  // bg.timelapse = { cycles, dayDur (s per full day), shades (moon sunglasses) }
  function timelapse(ctx, tl, lt, horizon) {
    const dayDur = tl.dayDur ?? 1.6, ph = ((lt / dayDur) % 1 + 1) % 1, isDay = ph < 0.5, q = isDay ? ph * 2 : (ph - 0.5) * 2;
    const edge = Math.min(1, Math.sin(q * Math.PI) * 3); // 0 at sunrise/sunset, 1 mid-day / mid-night
    const night = isDay ? 1 - edge : edge;
    const day = ['#4fb0e8', '#8ee3f0', '#f7d08a', '#f7a23a'], nite = ['#0b1430', '#1b2547', '#3a3a6a', '#e8c9a0'];
    skyGradient(ctx, day.map((c, i) => T.mix(c, nite[i], night)), horizon);
    const x = T.lerp(W * 0.05, W * 0.95, q), y = horizon - Math.sin(q * Math.PI) * horizon * 0.85;
    if (isDay) {
      sunGlow(ctx, x, y, '#fff3c4', 360);
      ctx.strokeStyle = '#f2a51a'; ctx.lineWidth = 10; ctx.lineCap = 'round';
      for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2 + lt; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * 100, y + Math.sin(a) * 100); ctx.lineTo(x + Math.cos(a) * 130, y + Math.sin(a) * 130); ctx.stroke(); }
      T.outlined(ctx, (k) => k.arc(x, y, 80, 0, Math.PI * 2), '#ffd84a', { line: 8 });
      ctx.fillStyle = P.ink; for (const d of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + d * 26, y - 10, 8, 12, 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(x, y + 8, 30, 0.2, Math.PI - 0.2); ctx.stroke();
    } else {
      for (let i = 0; i < 60; i++) { ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect((i * 331) % W, (i * 173) % (horizon * 0.8), 3, 3); }
      T.outlined(ctx, (k) => { k.arc(x, y, 70, 0, Math.PI * 2); k.moveTo(x + 30 + 60, y - 20); k.arc(x + 30, y - 20, 60, 0, Math.PI * 2, true); }, '#f4efd8', { line: 7 });
      if (tl.shades) { ctx.fillStyle = '#111'; ctx.fillRect(x - 70, y - 14, 80, 24); }
    }
  }

  T.bgs.sky = (ctx, bg, lt, env) => {
    const pal = { ...SKY[bg.preset || 'day'], ...(bg.palette || {}) };
    const horizon = (bg.horizon ?? 0.62) * H, seed = env.seed + (bg.seed ?? '');
    ctx.save();
    T.applyCam(ctx, env.cam, 0.15);
    if (bg.timelapse) timelapse(ctx, bg.timelapse === true ? {} : bg.timelapse, lt, horizon);
    else skyGradient(ctx, pal.stops, horizon);
    const sun = bg.sun || pal.sun;
    if (!bg.timelapse) sunGlow(ctx, sun[0] * W, sun[1] * H, pal.glow);
    if (pal.stars || bg.stars) stars(ctx, lt, seed);
    if (bg.rays) T.drawRays(ctx, sun[0] * W, sun[1] * H, lt, { seed });
    ctx.restore();
    ctx.save();
    T.applyCam(ctx, env.cam, 0.3);
    clouds(ctx, bg, pal, lt, seed);
    ctx.restore();
    const hills = bg.hills === false ? 0 : bg.hills ?? 3;
    for (let k = 0; k < hills; k++) {
      ctx.save();
      T.applyCam(ctx, env.cam, 0.45 + k * 0.18);
      ridge(ctx, horizon + k * 38, 150 - k * 35, 0.0022 + k * 0.0012, seed + 'h' + k, pal.hills[k % pal.hills.length], pal.stops[pal.stops.length - 1], Math.max(0, 0.45 - k * 0.2));
      ctx.restore();
    }
    ctx.save();
    T.applyCam(ctx, env.cam, 1);
    const gy = (bg.groundY ?? 0.8) * H;
    for (const tr of bg.trees || []) T.drawTree(ctx, tr[0] * W, tr[1] * H, (tr[2] ?? 0.35) * H, seed + 't' + tr[0]);
    if (bg.water) water(ctx, (bg.water.y ?? 0.82) * H, lt, seed, bg.water.color);
    if (bg.ground !== false) ground(ctx, bg, pal, gy, seed);
    ctx.restore();
  };

  T.bgs.interior = (ctx, bg, lt, env) => {
    const wall = bg.wall ?? '#e9c99a', trim = bg.trim ?? P.red, floorY = (bg.floorY ?? 0.78) * H;
    ctx.save();
    T.applyCam(ctx, env.cam, 0.85);
    ctx.fillStyle = wall;
    ctx.fillRect(-OVER, -OVER, W + OVER * 2, floorY + OVER);
    const g = ctx.createLinearGradient(0, 0, 0, floorY);
    g.addColorStop(0, 'rgba(60,30,10,0.25)');
    g.addColorStop(1, 'rgba(255,240,200,0.12)');
    ctx.fillStyle = g;
    ctx.fillRect(-OVER, -OVER, W + OVER * 2, floorY + OVER);
    if (bg.window) {
      const [wx, wy, ww, wh] = bg.window.map((v, i) => v * (i % 2 ? H : W));
      const sg = ctx.createLinearGradient(0, wy, 0, wy + wh);
      SKY[bg.windowSky || 'day'].stops.forEach((c, i, a) => sg.addColorStop(i / (a.length - 1), c));
      T.outlined(ctx, (c) => T.rrect(c, wx, wy, ww, wh, 10), sg, { line: 10 });
    }
    if (bg.lattice) { ctx.lineWidth = 12; ctx.strokeStyle = trim; [0.14, 0.2].forEach((f) => { ctx.beginPath(); ctx.moveTo(-OVER, f * H); ctx.lineTo(W + OVER, f * H); ctx.stroke(); }); for (let x = -OVER; x < W + OVER; x += 260) { ctx.beginPath(); ctx.moveTo(x, 0.14 * H); ctx.lineTo(x, floorY); ctx.stroke(); } }
    if (bg.dado !== false) { // dark red band at the bottom of the wall with a gold trim line (palace interiors 13:00, 26:36, 29:12)
      const top = floorY - H * (bg.dadoH ?? 0.2);
      ctx.fillStyle = bg.dado ?? '#7a1a14'; ctx.fillRect(-OVER, top, W + OVER * 2, floorY - top);
      ctx.fillStyle = bg.dadoTrim ?? '#d9a84a'; ctx.fillRect(-OVER, top - 8, W + OVER * 2, 10);
      ctx.fillRect(-OVER, 0.1 * H, W + OVER * 2, 8);
    }
    if (bg.light !== false) { // big diagonal window-light wedges, ~12% darker shadow bands at ~30°
      ctx.fillStyle = 'rgba(40,15,0,0.14)';
      for (const [x0, w] of bg.wedges || [[0.15, 0.18], [0.55, 0.12], [0.82, 0.08]]) { ctx.beginPath(); ctx.moveTo(x0 * W, -OVER); ctx.lineTo((x0 + w) * W, -OVER); ctx.lineTo((x0 + w) * W - floorY * 0.58, floorY); ctx.lineTo(x0 * W - floorY * 0.58, floorY); ctx.closePath(); ctx.fill(); }
    }
    for (const cx of bg.columns || []) column(ctx, cx * W, floorY, floorY - H * 0.04, bg.columnColor);
    for (const dx of bg.drapes || []) drape(ctx, dx * W, lt, env.seed + dx, trim);
    ctx.fillStyle = bg.floor ?? '#a8784d';
    ctx.fillRect(-OVER, floorY, W + OVER * 2, H - floorY + OVER);
    ctx.strokeStyle = 'rgba(42,28,21,0.35)';
    ctx.lineWidth = 4;
    for (let i = -8; i <= 8; i++) { ctx.beginPath(); ctx.moveTo(W / 2 + i * 60, floorY); ctx.lineTo(W / 2 + i * 260, H + OVER); ctx.stroke(); }
    if (bg.shine !== false) { ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 18; for (const x of [0.3, 0.36, 0.7]) { ctx.beginPath(); ctx.moveTo(x * W, floorY + 20); ctx.lineTo(x * W - 160, H + OVER); ctx.stroke(); } }
    ctx.lineWidth = 8;
    ctx.strokeStyle = P.ink;
    ctx.beginPath(); ctx.moveTo(-OVER, floorY); ctx.lineTo(W + OVER, floorY); ctx.stroke();
    ctx.restore();
  };

  function column(ctx, x, baseY, h, color = '#efe6d4') {
    const w = 110, dark = T.shade(color, -0.18);
    T.outlined(ctx, (c) => c.rect(x - w / 2, baseY - h, w, h), color, {
      line: 8,
      shade: (c) => { c.fillStyle = dark; c.fillRect(x + w * 0.15, baseY - h, w * 0.35, h); c.strokeStyle = 'rgba(42,28,21,0.3)'; c.lineWidth = 4; for (let k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(x + k * 26, baseY - h); c.lineTo(x + k * 26, baseY); c.stroke(); } },
    });
    T.outlined(ctx, (c) => c.rect(x - w * 0.75, baseY - h - 40, w * 1.5, 44), color, { line: 8 });
    T.outlined(ctx, (c) => c.rect(x - w * 0.7, baseY - 34, w * 1.4, 34), dark, { line: 8 });
  }

  function drape(ctx, x, lt, seed, color) {
    const sway = Math.sin(lt * 1.2 + T.hash(seed) % 7) * 10;
    T.outlined(ctx, (c) => { c.moveTo(x - 90, -40); c.lineTo(x + 90, -40); c.quadraticCurveTo(x + 70 + sway, H * 0.4, x + 40 + sway, H * 0.7); c.lineTo(x - 50 + sway, H * 0.7); c.quadraticCurveTo(x - 80 + sway, H * 0.4, x - 90, -40); }, color, { line: 8 });
  }

  T.bgs.parchment = (ctx, bg, lt, env) => {
    ctx.save();
    T.applyCam(ctx, env.cam, bg.z ?? 1);
    ctx.fillStyle = bg.color ?? P.paper;
    ctx.fillRect(-OVER, -OVER, W + OVER * 2, H + OVER * 2);
    const r = T.rng(T.hash(env.seed + 'parch'));
    for (let i = 0; i < 26; i++) {
      const x = r() * W, y = r() * H, rad = 80 + r() * 260;
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
      g.addColorStop(0, `rgba(140,95,40,${0.05 + r() * 0.08})`);
      g.addColorStop(1, 'rgba(140,95,40,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    const e = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H);
    e.addColorStop(0, 'rgba(90,50,10,0)');
    e.addColorStop(1, 'rgba(90,50,10,0.45)');
    ctx.fillStyle = e;
    ctx.fillRect(-OVER, -OVER, W + OVER * 2, H + OVER * 2);
    ctx.restore();
  };

  // Reaction background: flat radial gradient, slowly turning wedges and drifting specks.
  T.bgs.burst = (ctx, bg, lt, env) => {
    const c = bg.color ?? '#2f8f8a', cx = (bg.at ?? [0.5, 0.5])[0] * W, cy = (bg.at ?? [0.5, 0.5])[1] * H;
    ctx.save();
    T.applyCam(ctx, env.cam, 0.3);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.8);
    g.addColorStop(0, bg.center ?? '#bfe8d8');
    g.addColorStop(0.45, c);
    g.addColorStop(1, bg.edge ?? '#0f2f35');
    ctx.fillStyle = g;
    ctx.fillRect(-OVER, -OVER, W + OVER * 2, H + OVER * 2);
    if (bg.wedges !== false) T.drawRays(ctx, cx, cy, lt, { color: 'rgba(255,255,255,0.07)', count: 14, spin: 0.08, seed: env.seed + 'bw' });
    const r = T.rng(T.hash(env.seed + 'specks'));
    ctx.fillStyle = 'rgba(15,25,25,0.55)';
    for (let i = 0; i < 60; i++) {
      const x = (r() * W + lt * (20 + r() * 40)) % (W + 40) - 20, y = (r() * H - lt * (8 + r() * 14) + H) % H, s = 2 + r() * 5;
      ctx.beginPath(); ctx.arc(x, y, s, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  };

  T.bgs.flat = (ctx, bg) => {
    ctx.fillStyle = bg.color ?? '#fff';
    ctx.fillRect(0, 0, W, H);
  };

  T.bgs.image = (ctx, bg, lt, env) => {
    const im = T.img(bg.image || bg.src);
    const k = Math.max(W / im.width, H / im.height) * (bg.overscan ?? 1.08);
    ctx.save();
    T.applyCam(ctx, env.cam, bg.z ?? 1);
    if (bg.filter) ctx.filter = bg.filter;
    ctx.drawImage(im, W / 2 - (im.width * k) / 2, H / 2 - (im.height * k) / 2, im.width * k, im.height * k);
    ctx.restore();
  };
})();
