// places-world.js — more settings: office, graveyard, eastcity (pagodas, upturned eaves), karst (mist peaks + paddies),
// gallery (gilt frames), blueprint (chalk sketch board), desert, mountains (peaks / cave / gorge).
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL, W = T.W, H = T.H, OV = 260;
  const cam = (ctx, env, f, fn) => { ctx.save(); T.applyCam(ctx, env.cam, f); fn(); ctx.restore(); };
  const skyOnly = (ctx, bg, lt, env, preset, horizon) =>
    T.bgs.sky(ctx, { preset, clouds: bg.clouds ?? 4, hills: 0, ground: false, horizon, cloudStyle: bg.cloudStyle, palette: bg.palette, stars: bg.stars, sun: bg.sun }, lt, env);

  function planks(ctx, x0, y0, x1, y1, color, vertical = true, step = 90) {
    ctx.fillStyle = color; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    ctx.strokeStyle = T.shade(color, -0.35); ctx.lineWidth = 5;
    if (vertical) for (let x = x0; x < x1; x += step) { ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke(); }
    else for (let y = y0; y < y1; y += step * 0.6) { ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(60,30,10,0.25)'; ctx.lineWidth = 3;
    for (let i = 0; i < 18; i++) { const x = x0 + ((i * 397) % (x1 - x0)), y = y0 + ((i * 211) % (y1 - y0)); ctx.beginPath(); ctx.ellipse(x, y, 26, 8, vertical ? Math.PI / 2 : 0, 0, Math.PI * 2); ctx.stroke(); }
    if (T.PAINT) { // painted look: alternating plank tones and wood grain along the boards
      ctx.fillStyle = 'rgba(30,12,0,0.12)';
      if (vertical) for (let x = x0, i = 0; x < x1; x += step, i++) { if (i % 3 === 1) ctx.fillRect(x + 3, y0, step - 6, y1 - y0); }
      else for (let y = y0, i = 0; y < y1; y += step * 0.6, i++) { if (i % 3 === 1) ctx.fillRect(x0, y + 3, x1 - x0, step * 0.6 - 6); }
      T.fillTexture(ctx, null, 'wood', { rect: [x0, y0, x1 - x0, y1 - y0], rot: vertical ? 90 : 0, alpha: 0.75 });
    }
  }
  T.planks = planks;

  // Upturned-eave roof slab (corners curl up) — the East Asian roof unit.
  T.eaveRoof = (ctx, cx, y, w, h, color = '#4a4a50') => {
    T.outlined(ctx, (k) => { k.moveTo(cx - w / 2 - w * 0.08, y - h * 0.35); k.quadraticCurveTo(cx - w * 0.42, y, cx - w * 0.3, y); k.lineTo(cx + w * 0.3, y); k.quadraticCurveTo(cx + w * 0.42, y, cx + w / 2 + w * 0.08, y - h * 0.35); k.quadraticCurveTo(cx + w * 0.3, y - h * 0.6, cx + w * 0.22, y - h); k.lineTo(cx - w * 0.22, y - h); k.quadraticCurveTo(cx - w * 0.3, y - h * 0.6, cx - w / 2 - w * 0.08, y - h * 0.35); k.closePath(); }, color, {
      line: 6, shade: (k) => { k.strokeStyle = T.shade(color, -0.3); k.lineWidth = 3; for (let x = cx - w * 0.3; x < cx + w * 0.3; x += 14) { k.beginPath(); k.moveTo(x, y - h * 0.95); k.lineTo(x + (x - cx) * 0.2, y); k.stroke(); } },
    });
  };
  T.drawPagoda = (ctx, x, baseY, w, tiers = 5, roof = '#4a4a50', wall = '#a03a2a') => {
    let y = baseY, tw = w;
    for (let i = 0; i < tiers; i++) {
      const wh = w * 0.32;
      T.outlined(ctx, (k) => k.rect(x - tw * 0.32, y - wh, tw * 0.64, wh), wall, { line: 5, shade: (k) => { k.fillStyle = 'rgba(255,230,180,0.6)'; k.fillRect(x - tw * 0.08, y - wh * 0.8, tw * 0.16, wh * 0.6); } });
      y -= wh;
      T.eaveRoof(ctx, x, y + 6, tw, w * 0.22, roof);
      y -= w * 0.2; tw *= 0.85;
    }
    ctx.strokeStyle = P.ink; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - w * 0.3); ctx.stroke();
  };
  function hall(ctx, x, baseY, w, roof, wall = '#f0e6d0') {
    const h = w * 0.45;
    T.outlined(ctx, (k) => k.rect(x - w * 0.42, baseY - h, w * 0.84, h), wall, { line: 6 });
    for (let i = 0; i < 5; i++) T.outlined(ctx, (k) => k.rect(x - w * 0.4 + (i * w * 0.8) / 4 - 8, baseY - h, 16, h), '#a8322a', { line: 4 });
    T.eaveRoof(ctx, x, baseY - h + 6, w * 1.05, w * 0.3, roof);
  }

  // ---------- office ----------
  T.bgs.office = (ctx, bg, lt, env) => {
    const floorY = (bg.floorY ?? 0.78) * H;
    cam(ctx, env, 0.85, () => {
      planks(ctx, -OV, -OV, W + OV, floorY, bg.wall ?? '#a8673a', bg.planks !== 'horizontal', 110);
      const win = bg.window ?? 'porthole';
      if (win === 'porthole') { T.outlined(ctx, (k) => k.arc(W * 0.5, H * 0.2, 90, 0, Math.PI * 2), '#5a3520', { line: 8 }); T.outlined(ctx, (k) => k.arc(W * 0.5, H * 0.2, 66, 0, Math.PI * 2), '#cfe8ef', { line: 6 }); }
      if (win === 'arched' || win === 'grid') {
        const wx = W * (bg.windowX ?? 0.72), ww = 300, wh = 420;
        T.outlined(ctx, (k) => { k.moveTo(wx - ww / 2, H * 0.62); k.lineTo(wx - ww / 2, H * 0.62 - wh + ww / 2); if (win === 'arched') k.arc(wx, H * 0.62 - wh + ww / 2, ww / 2, Math.PI, 0); else k.lineTo(wx + ww / 2, H * 0.62 - wh + ww / 2 - ww / 2); k.lineTo(wx + ww / 2, H * 0.62); k.closePath(); }, '#cfe8ef', { line: 9 });
        ctx.strokeStyle = '#5a3520'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(wx, H * 0.62); ctx.lineTo(wx, H * 0.62 - wh); for (let y = H * 0.62 - 100; y > H * 0.62 - wh + 60; y -= 110) { ctx.moveTo(wx - ww / 2, y); ctx.lineTo(wx + ww / 2, y); } ctx.stroke();
      }
      ctx.fillStyle = bg.carpet ?? '#7a2a22'; ctx.fillRect(-OV, floorY, W + OV * 2, H - floorY + OV);
      ctx.strokeStyle = P.ink; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(-OV, floorY); ctx.lineTo(W + OV, floorY); ctx.stroke();
      if (bg.lamp) { ctx.strokeStyle = P.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(W * 0.3, -OV); ctx.lineTo(W * 0.3, H * 0.12); ctx.stroke(); T.outlined(ctx, (k) => { k.moveTo(W * 0.3 - 60, H * 0.2); k.lineTo(W * 0.3 - 26, H * 0.12); k.lineTo(W * 0.3 + 26, H * 0.12); k.lineTo(W * 0.3 + 60, H * 0.2); k.closePath(); }, '#2f5a3a', { line: 5 }); const g = ctx.createRadialGradient(W * 0.3, H * 0.24, 0, W * 0.3, H * 0.24, 420); g.addColorStop(0, 'rgba(255,220,140,0.35)'); g.addColorStop(1, 'rgba(255,220,140,0)'); ctx.fillStyle = g; ctx.fillRect(-OV, -OV, W + OV * 2, H + OV * 2); }
    });
    if (bg.desk !== false) cam(ctx, env, 1, () => {
      const dx = W * (bg.deskX ?? 0.5), dy = H * 0.86;
      if (bg.chair !== false) T.outlined(ctx, (k) => T.rrect(k, dx - 150, dy - 520, 300, 420, 120), '#e9cf7a', { line: 8, shade: (k) => { k.fillStyle = '#f6eccf'; for (let i = 0; i < 6; i++) { k.beginPath(); k.arc(dx - 90 + (i % 3) * 90, dy - 430 + Math.floor(i / 3) * 110, 10, 0, Math.PI * 2); k.fill(); } } });
      T.outlined(ctx, (k) => k.ellipse(dx, dy, 380, 70, 0, 0, Math.PI * 2), '#7a4a2a', { line: 8 });
      T.outlined(ctx, (k) => k.rect(dx - 330, dy, 660, 160), '#5a3520', { line: 8 });
    });
  };

  // ---------- graveyard ----------
  T.bgs.graveyard = (ctx, bg, lt, env) => {
    const hz = (bg.horizon ?? 0.62) * H, seed = env.seed + 'grave';
    skyOnly(ctx, bg, lt, env, bg.preset ?? 'night', hz);
    cam(ctx, env, 0.5, () => T.ridge(ctx, hz, 120, 0.002, seed + 'h', bg.hill ?? '#1f2a44', '#3a4a7a', 0.2));
    cam(ctx, env, 0.85, () => {
      ctx.fillStyle = bg.ground ?? '#1a2238'; ctx.fillRect(-OV, hz + 30, W + OV * 2, H + OV);
      const r = T.rng(T.hash(seed + 's'));
      for (let row = 0; row < 3; row++) for (let i = 0; i < 9; i++) {
        const sc = 0.5 + row * 0.25, x = -OV + ((i + r() * 0.5) / 9) * (W + OV * 2), y = hz + 60 + row * 110, w = 70 * sc, h = 110 * sc, col = bg.stone ?? '#8a96aa';
        ctx.save(); ctx.translate(x, y); ctx.rotate((r() - 0.5) * 0.15);
        if (r() > 0.75) { ctx.strokeStyle = P.ink; ctx.lineWidth = 16 * sc; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -h * 1.2); ctx.moveTo(-w * 0.5, -h * 0.85); ctx.lineTo(w * 0.5, -h * 0.85); ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = 9 * sc; ctx.stroke(); }
        else T.outlined(ctx, (k) => { k.moveTo(-w / 2, 0); k.lineTo(-w / 2, -h + w / 2); k.arc(0, -h + w / 2, w / 2, Math.PI, 0); k.lineTo(w / 2, 0); k.closePath(); }, col, { line: 5, shade: (k) => { k.fillStyle = T.shade(col, -0.25); k.fillRect(w * 0.15, -h, w, h); } });
        ctx.restore();
      }
      if (bg.fence !== false) { ctx.strokeStyle = '#0e1220'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-OV, hz + 20); ctx.lineTo(W + OV, hz + 20); for (let x = -OV; x < W + OV; x += 40) { ctx.moveTo(x, hz + 40); ctx.lineTo(x, hz - 40); } ctx.stroke(); }
      const m = ctx.createLinearGradient(0, H * 0.75, 0, H); m.addColorStop(0, 'rgba(180,190,220,0)'); m.addColorStop(1, 'rgba(180,190,220,0.35)'); ctx.fillStyle = m; ctx.fillRect(-OV, H * 0.75, W + OV * 2, H * 0.4);
    });
  };

  // ---------- eastcity: halls and pagodas ----------
  T.bgs.eastcity = (ctx, bg, lt, env) => {
    const hz = (bg.horizon ?? 0.62) * H, seed = env.seed + 'east', roof = bg.roof ?? '#4a4a50';
    skyOnly(ctx, bg, lt, env, bg.preset ?? 'day', hz);
    cam(ctx, env, 0.35, () => T.ridge(ctx, hz - 20, 160, 0.002, seed + 'm', '#7c9a8a', '#eef8fb', 0.4));
    cam(ctx, env, 0.65, () => {
      const r = T.rng(T.hash(seed + 'b'));
      for (let i = 0; i < 6; i++) { const x = -OV + ((i + 0.5) / 6) * (W + OV * 2); if (i === 2 && bg.pagoda !== false) T.drawPagoda(ctx, x, hz + 40, 200, 5, roof); else hall(ctx, x, hz + 40, 240 + r() * 80, r() > 0.5 && bg.gold ? '#e8b840' : roof); }
    });
    cam(ctx, env, 1, () => {
      const gy = hz + 40;
      ctx.fillStyle = bg.ground ?? '#d8cbb0'; ctx.fillRect(-OV, gy, W + OV * 2, H + OV);
      ctx.strokeStyle = 'rgba(42,28,21,0.25)'; ctx.lineWidth = 3; for (let y = gy + 40; y < H + OV; y += 60) { ctx.beginPath(); ctx.moveTo(-OV, y); ctx.lineTo(W + OV, y); ctx.stroke(); }
      if (bg.balustrade !== false) { ctx.fillStyle = '#f2efe8'; ctx.fillRect(-OV, gy + 20, W + OV * 2, 18); ctx.strokeStyle = P.ink; ctx.lineWidth = 5; ctx.strokeRect(-OV, gy + 20, W + OV * 2, 18); for (let x = -OV; x < W + OV; x += 70) { ctx.strokeRect(x, gy + 38, 14, 46); } }
    });
  };

  // ---------- karst: misty pointed peaks (+ optional paddies, pagoda, river) ----------
  T.bgs.karst = (ctx, bg, lt, env) => {
    const sunset = bg.preset === 'sunset', hz = (bg.horizon ?? 0.66) * H, seed = env.seed + 'karst';
    skyOnly(ctx, bg, lt, env, sunset ? 'sunset' : bg.preset ?? 'overcast', hz);
    [[0.25, 0.6, '#9aa6ac', 7], [0.45, 0.8, '#7a8a92', 5], [0.7, 1.0, '#5f6f76', 4]].forEach(([f, sc, col, n], li) => cam(ctx, env, f, () => {
      const r = T.rng(T.hash(seed + li));
      for (let i = 0; i < n; i++) {
        const x = -OV + ((i + r() * 0.6) / n) * (W + OV * 2), w = (160 + r() * 140) * sc, h = (300 + r() * 260) * sc, base = hz + li * 30;
        T.outlined(ctx, (k) => { k.moveTo(x - w / 2, base); k.bezierCurveTo(x - w * 0.45, base - h * 0.7, x - w * 0.15, base - h, x, base - h); k.bezierCurveTo(x + w * 0.2, base - h, x + w * 0.45, base - h * 0.6, x + w / 2, base); k.closePath(); }, sunset ? T.mix(col, '#e98a6a', 0.35) : col, { line: 4, ink: 'rgba(42,28,21,0.5)', shade: (k) => { k.fillStyle = 'rgba(255,255,255,0.12)'; k.fillRect(x - w / 2, base - h, w * 0.3, h); } });
      }
      const g = ctx.createLinearGradient(0, hz - 60 + li * 30, 0, hz + 60 + li * 30); g.addColorStop(0, 'rgba(235,238,240,0)'); g.addColorStop(0.5, 'rgba(235,238,240,0.7)'); g.addColorStop(1, 'rgba(235,238,240,0)');
      ctx.fillStyle = g; ctx.fillRect(-OV, hz - 60 + li * 30, W + OV * 2, 120);
    }));
    cam(ctx, env, 1, () => {
      const gy = hz + 70;
      ctx.fillStyle = bg.ground ?? '#8a9a78'; ctx.fillRect(-OV, gy, W + OV * 2, H + OV);
      if (bg.paddy !== false) T.paddy(ctx, gy, seed);
      if (bg.river !== false) { ctx.strokeStyle = sunset ? '#f0b080' : '#bcd6e0'; ctx.lineWidth = 40; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(W * 0.55, gy); ctx.bezierCurveTo(W * 0.35, gy + 120, W * 0.75, gy + 220, W * 0.4, H + OV); ctx.stroke(); }
      if (bg.pagoda) T.drawPagoda(ctx, bg.pagoda[0] * W, gy + 10, 170, 5, '#4a4a50');
    });
  };

  // Flat grey-green paddy terraces with dikes and rows of seedlings (also usable as sky ground: "ground":"paddy").
  T.paddy = (ctx, gy, seed) => {
    const r = T.rng(T.hash(seed + 'pad'));
    for (let row = 0; row < 5; row++) {
      const y0 = gy + Math.pow(row / 5, 1.3) * (H - gy + 60), y1 = gy + Math.pow((row + 1) / 5, 1.3) * (H - gy + 60);
      ctx.fillStyle = row % 2 ? '#8a9a88' : '#7f9080'; ctx.fillRect(-OV, y0, W + OV * 2, y1 - y0);
      ctx.strokeStyle = '#5a6a50'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-OV, y0); ctx.lineTo(W + OV, y0); ctx.stroke();
      ctx.strokeStyle = 'rgba(220,235,230,0.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-OV, y0 + 4); ctx.lineTo(W + OV, y0 + 4); ctx.stroke();
      ctx.strokeStyle = '#4f7a3a'; ctx.lineWidth = 3;
      const step = 40 + row * 16;
      for (let x = -OV + r() * step; x < W + OV; x += step) for (let j = 0; j < 2; j++) { const yy = T.lerp(y0, y1, 0.35 + j * 0.3); ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x - 3, yy - 8 - row * 3); ctx.moveTo(x, yy); ctx.lineTo(x + 3, yy - 8 - row * 3); ctx.stroke(); }
    }
  };

  // ---------- gallery: wall with gilt frames ----------
  T.bgs.gallery = (ctx, bg, lt, env) => {
    const floorY = (bg.floorY ?? 0.82) * H;
    cam(ctx, env, 0.9, () => {
      ctx.fillStyle = bg.wall ?? '#e9dcc0'; ctx.fillRect(-OV, -OV, W + OV * 2, floorY + OV);
      ctx.fillStyle = bg.dado ?? '#6b4a2e'; ctx.fillRect(-OV, floorY - H * 0.16, W + OV * 2, H * 0.16);
      for (const f of bg.frames ?? [{ x: 0.5, y: 0.38, w: 0.36, h: 0.4 }]) {
        const x = f.x * W, y = f.y * H, w = f.w * W, h = f.h * H;
        T.outlined(ctx, (k) => k.rect(x - w / 2 - 34, y - h / 2 - 34, w + 68, h + 68), '#e2b63a', { line: 8, shade: (k) => { k.strokeStyle = '#7b5a10'; k.lineWidth = 6; k.strokeRect(x - w / 2 - 16, y - h / 2 - 16, w + 32, h + 32); for (let i = 0; i < 4; i++) { k.fillStyle = '#f6d878'; k.beginPath(); k.arc(i < 2 ? x - w / 2 - 17 : x + w / 2 + 17, i % 2 ? y - h / 2 - 17 : y + h / 2 + 17, 12, 0, Math.PI * 2); k.fill(); } } });
        if (f.image) { ctx.drawImage(T.img(f.image), x - w / 2, y - h / 2, w, h); }
        else { const g = ctx.createLinearGradient(0, y - h / 2, 0, y + h / 2); g.addColorStop(0, f.top ?? '#86c3ee'); g.addColorStop(1, f.bottom ?? '#9fb86a'); ctx.fillStyle = g; ctx.fillRect(x - w / 2, y - h / 2, w, h); }
        ctx.strokeStyle = P.ink; ctx.lineWidth = 6; ctx.strokeRect(x - w / 2, y - h / 2, w, h);
        if (f.plaque) { T.outlined(ctx, (k) => T.rrect(k, x - 140, y + h / 2 + 50, 280, 56, 6), '#f3e3b0', { line: 5 }); T.toonText(ctx, f.plaque, x, y + h / 2 + 90, { size: 30, fill: P.ink, stroke: 0, shadow: false }); }
      }
      ctx.fillStyle = bg.floor ?? '#a8784d'; ctx.fillRect(-OV, floorY, W + OV * 2, H + OV);
      ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(-OV, floorY, W + OV * 2, 40);
      ctx.strokeStyle = P.ink; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(-OV, floorY); ctx.lineTo(W + OV, floorY); ctx.stroke();
    });
  };

  // ---------- blueprint: blue sheet on a wood table with progressive chalk sketch ----------
  // bg.sketch: [{ line:[[x,y],...], at, dur } | { circle:[x,y,r], at } | { text, x, y, size, at }] (normalized to the sheet)
  // Erasing (the board replaces whole drawings per beat): an item's `out` wipes it over `eraseDur` (0.15 s);
  // bg.clear: [t, ...] wipes every item drawn before t.
  T.bgs.blueprint = (ctx, bg, lt, env) => {
    cam(ctx, env, 1, () => {
      planks(ctx, -OV, -OV, W + OV, H + OV, '#7a5232', false, 120);
      const sx = W * 0.08, sy = H * 0.08, sw = W * 0.84, sh = H * 0.84;
      ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate((bg.tilt ?? -1.5) * T.DEG); ctx.translate(-W / 2, -H / 2);
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(sx + 14, sy + 18, sw, sh);
      ctx.fillStyle = bg.color ?? '#3d7fd0'; ctx.fillRect(sx, sy, sw, sh);
      ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 2;
      for (let x = sx; x < sx + sw; x += 48) { ctx.beginPath(); ctx.moveTo(x, sy); ctx.lineTo(x, sy + sh); ctx.stroke(); }
      for (let y = sy; y < sy + sh; y += 48) { ctx.beginPath(); ctx.moveTo(sx, y); ctx.lineTo(sx + sw, y); ctx.stroke(); }
      const X = (v) => sx + v * sw, Y = (v) => sy + v * sh;
      ctx.strokeStyle = '#f4f8ff'; ctx.fillStyle = '#f4f8ff'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const clears = (bg.clear || []).filter((t) => typeof t === 'number');
      for (const it of bg.sketch || []) {
        const p = T.prog(lt, it.at ?? 0, it.dur ?? 0.8);
        if (p <= 0) continue;
        const gone = [it.out, ...clears.filter((t) => t > (it.at ?? 0))].filter((t) => typeof t === 'number' && lt >= t);
        const fade = gone.length ? 1 - T.prog(lt, Math.min(...gone), it.eraseDur ?? 0.15) : 1;
        if (fade <= 0) continue;
        ctx.save(); ctx.globalAlpha *= fade;
        if (it.line) {
          const pts = it.line.map(([x, y]) => [X(x), Y(y)]), segs = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]));
          let left = segs.reduce((a, b) => a + b, 0) * p; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
          for (let i = 0; i < segs.length && left > 0; i++) { const f = Math.min(1, left / segs[i]); ctx.lineTo(T.lerp(pts[i][0], pts[i + 1][0], f), T.lerp(pts[i][1], pts[i + 1][1], f)); left -= segs[i]; }
          ctx.stroke();
        } else if (it.circle) { ctx.beginPath(); ctx.arc(X(it.circle[0]), Y(it.circle[1]), it.circle[2] * sw, 0, Math.PI * 2 * p); ctx.stroke(); }
        else if (it.text) { ctx.save(); ctx.globalAlpha *= p; ctx.font = T.font(it.size ?? 54, 800); ctx.textAlign = 'center'; ctx.fillText(it.text, X(it.x), Y(it.y)); ctx.restore(); }
        ctx.restore();
      }
      if (bg.stamp) { ctx.save(); ctx.translate(sx + sw - 220, sy + 70); ctx.rotate(-0.06); ctx.strokeStyle = '#f4f8ff'; ctx.lineWidth = 5; ctx.strokeRect(-180, -40, 360, 80); ctx.font = T.font(34, 800); ctx.textAlign = 'center'; ctx.fillText(bg.stamp, 0, 12); ctx.restore(); }
      ctx.restore();
      ctx.save(); ctx.translate(W * 0.9, H * 0.88); ctx.rotate(-0.5);
      T.outlined(ctx, (k) => k.rect(-120, -14, 220, 28), '#f2c230', { line: 5 }); T.outlined(ctx, (k) => { k.moveTo(100, -14); k.lineTo(140, 0); k.lineTo(100, 14); k.closePath(); }, '#e8d0a0', { line: 5 });
      ctx.restore();
    });
  };

  // ---------- desert ----------
  T.bgs.desert = (ctx, bg, lt, env) => {
    const hz = (bg.horizon ?? 0.6) * H, seed = env.seed + 'des';
    skyOnly(ctx, bg, lt, env, bg.preset ?? 'day', hz);
    [['#e8c890', 0.4, 0], ['#d9b070', 0.65, 50], ['#c8985a', 0.9, 110]].forEach(([col, f, dy], i) => cam(ctx, env, f, () => T.ridge(ctx, hz + dy, 90 - i * 20, 0.0016 + i * 0.0008, seed + i, col, '#fff0c8', 0)));
    if (bg.cacti) cam(ctx, env, 1, () => {
      const r = T.rng(T.hash(seed + 'c'));
      for (let i = 0; i < bg.cacti; i++) {
        const x = r() * W, y = hz + 140 + r() * 200, h = 150 + r() * 120;
        for (const [ox, oy, w, hh] of [[0, 0, 40, h], [-46, -h * 0.4, 26, h * 0.35], [46, -h * 0.55, 26, h * 0.3]]) T.outlined(ctx, (k) => T.rrect(k, x + ox - w / 2, y + oy - hh, w, hh, w / 2), '#5d8a3a', { line: 6 });
      }
    });
  };

  // ---------- mountains: snow peaks, cave mouth or gorge ----------
  T.bgs.mountains = (ctx, bg, lt, env) => {
    const v = bg.variant ?? 'peaks', hz = (bg.horizon ?? 0.66) * H, seed = env.seed + 'mt';
    skyOnly(ctx, bg, lt, env, bg.preset ?? 'day', hz);
    [[0.3, 0.7, '#8a8f98'], [0.55, 1.0, '#6a5848']].forEach(([f, sc, col], li) => cam(ctx, env, f, () => {
      const r = T.rng(T.hash(seed + li));
      for (let i = 0; i < 6; i++) {
        const x = -OV + ((i + r() * 0.5) / 6) * (W + OV * 2), w = (360 + r() * 240) * sc, h = (360 + r() * 240) * sc, base = hz + li * 40;
        const peak = [x + (r() - 0.5) * 60, base - h];
        T.outlined(ctx, (k) => { k.moveTo(x - w / 2, base); k.lineTo(peak[0], peak[1]); k.lineTo(x + w / 2, base); k.closePath(); }, col, { line: 6, shade: (k) => { k.fillStyle = T.shade(col, -0.22); k.beginPath(); k.moveTo(peak[0], peak[1]); k.lineTo(x + w / 2, base); k.lineTo(peak[0] + 20, base); k.closePath(); k.fill(); } });
        T.outlined(ctx, (k) => { k.moveTo(peak[0], peak[1]); k.lineTo(peak[0] - w * 0.16, peak[1] + h * 0.3); k.lineTo(peak[0] - w * 0.06, peak[1] + h * 0.24); k.lineTo(peak[0], peak[1] + h * 0.33); k.lineTo(peak[0] + w * 0.07, peak[1] + h * 0.22); k.lineTo(peak[0] + w * 0.16, peak[1] + h * 0.3); k.closePath(); }, '#f4f8fa', { line: 5 });
      }
    }));
    cam(ctx, env, 1, () => {
      if (v === 'gorge') {
        for (const d of [-1, 1]) {
          const inner = d < 0 ? W * 0.3 : W * 0.7, outer = d < 0 ? -OV : W + OV, top = H * 0.08;
          T.outlined(ctx, (k) => { k.moveTo(outer, H + OV); k.lineTo(outer, top); k.lineTo(inner, top + 20); k.lineTo(inner - d * 60, H * 0.5); k.lineTo(inner + d * 30, H + OV); k.closePath(); }, '#7a6340', {
            line: 8, shade: (k) => { k.fillStyle = '#5e4a2e'; k.beginPath(); k.moveTo(inner, top + 20); k.lineTo(inner - d * 60, H * 0.5); k.lineTo(inner + d * 30, H + OV); k.lineTo(inner + d * 130, H + OV); k.lineTo(inner + d * 80, top + 20); k.closePath(); k.fill(); k.strokeStyle = 'rgba(40,25,10,0.35)'; k.lineWidth = 6; for (let y = top + 90; y < H; y += 110) { k.beginPath(); k.moveTo(outer, y + 40); k.lineTo(inner, y); k.stroke(); } },
          });
          ctx.fillStyle = '#6a8a3a'; ctx.fillRect(Math.min(outer, inner), top - 16, Math.abs(inner - outer), 20);
        }
        ctx.fillStyle = '#6a7a40'; ctx.fillRect(-OV, H * 0.88, W + OV * 2, H * 0.3);
      } else {
        ctx.fillStyle = bg.ground ?? '#7f9a5a'; ctx.fillRect(-OV, hz + 60, W + OV * 2, H + OV);
        if (v === 'cave') {
          const cx = (bg.at ?? 0.5) * W;
          T.outlined(ctx, (k) => { k.moveTo(cx - 520, H + OV); k.quadraticCurveTo(cx - 600, H * 0.1, cx, H * 0.06); k.quadraticCurveTo(cx + 600, H * 0.1, cx + 520, H + OV); k.closePath(); }, '#cfc09a', { line: 8 });
          T.outlined(ctx, (k) => { k.moveTo(cx - 320, H + OV); k.quadraticCurveTo(cx - 340, H * 0.3, cx, H * 0.28); k.quadraticCurveTo(cx + 340, H * 0.3, cx + 320, H + OV); k.closePath(); }, '#1c140c', { line: 8 });
        }
      }
    });
  };
})();
