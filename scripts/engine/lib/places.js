// places.js — war and dread backgrounds from the reference studies: trench (close-up), trench-section (cutaway),
// battlefield (no-man's-land / aftermath), sea, underwater, corridor (one-point stone tunnel) and void (flesh pillars,
// spotlight stage, boiling purple, spots, black). All draw their own parallax planes through env.cam.
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL, W = T.W, H = T.H, OV = 260;
  const cam = (ctx, env, f, fn) => { ctx.save(); T.applyCam(ctx, env.cam, f); fn(); ctx.restore(); };
  const fill = (ctx, color) => { ctx.fillStyle = color; ctx.fillRect(-OV, -OV, W + OV * 2, H + OV * 2); };
  const skyOnly = (ctx, bg, lt, env, preset, horizon) =>
    T.bgs.sky(ctx, { preset, clouds: bg.clouds ?? 4, hills: 0, ground: false, horizon, cloudStyle: bg.cloudStyle, palette: bg.palette, stars: bg.stars }, lt, env);

  // Jagged angular earth plates with a lit top bevel and cracks (trench walls, rock faces).
  T.slabs = (ctx, x0, x1, yTop, yBot, seed, col = '#3d3222', bevel = '#6e5c3c') => {
    const r = T.rng(T.hash(seed));
    let x = x0;
    while (x < x1) {
      const w = 110 + r() * 170, t0 = yTop + r() * 70, t1 = yTop + r() * 70, mid = yTop - 40 + r() * 60;
      const pts = [[x, yBot], [x, t0], [x + w * 0.45, mid], [x + w, t1], [x + w, yBot]];
      const path = (k) => { k.moveTo(pts[0][0], pts[0][1]); pts.slice(1).forEach(([px, py]) => k.lineTo(px, py)); k.closePath(); };
      T.outlined(ctx, path, col, {
        line: 7, shade: (k) => {
          k.fillStyle = bevel; k.beginPath(); k.moveTo(x, t0); k.lineTo(x + w * 0.45, mid); k.lineTo(x + w, t1); k.lineTo(x + w, t1 + 26); k.lineTo(x + w * 0.45, mid + 24); k.lineTo(x, t0 + 26); k.closePath(); k.fill();
          k.strokeStyle = 'rgba(20,12,6,0.55)'; k.lineWidth = 4;
          for (let i = 0; i < 2; i++) { const cx = x + w * (0.25 + r() * 0.5); k.beginPath(); k.moveTo(cx, mid + 40); k.lineTo(cx + (r() - 0.5) * 30, mid + 120 + r() * 120); k.stroke(); }
        },
      });
      x += w;
    }
  };

  function flameStrip(ctx, y, lt, seed, n = 12, size = 120) {
    for (let i = 0; i < n; i++) { ctx.save(); ctx.translate(-OV + ((i + 0.5) / n) * (W + OV * 2), y); T.drawFlame(ctx, size * (0.8 + (T.hash(seed + i) % 40) / 100), lt + i * 0.13, seed + i); ctx.restore(); }
  }

  function craters(ctx, y0, y1, n, seed, col) {
    const r = T.rng(T.hash(seed));
    for (let i = 0; i < n; i++) {
      const x = -OV + r() * (W + OV * 2), y = T.lerp(y0, y1, r()), rx = 50 + r() * 90 * (0.5 + (y - y0) / (y1 - y0 + 1));
      ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y, rx, rx * 0.28, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,240,200,0.18)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(x, y - 4, rx, rx * 0.28, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
    }
  }

  T.deadTree = (ctx, x, y, h, seed, col = '#1d1712') => {
    const r = T.rng(T.hash(seed));
    ctx.strokeStyle = col; ctx.lineCap = 'round';
    const branch = (bx, by, len, ang, w, depth) => {
      const ex = bx + Math.sin(ang) * len, ey = by - Math.cos(ang) * len;
      ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ex, ey); ctx.stroke();
      if (depth > 0) for (const d of [-1, 1]) branch(ex, ey, len * (0.55 + r() * 0.2), ang + d * (0.4 + r() * 0.4), w * 0.6, depth - 1);
    };
    branch(x, y, h * 0.5, (r() - 0.5) * 0.2, h * 0.06, 3);
  };

  T.barbedWire = (ctx, x0, x1, y, seed, h = 70) => {
    ctx.strokeStyle = '#2a2420'; ctx.lineWidth = 6;
    for (let x = x0; x <= x1; x += 200) { ctx.beginPath(); ctx.moveTo(x - 30, y); ctx.lineTo(x + 30, y - h); ctx.moveTo(x + 30, y); ctx.lineTo(x - 30, y - h); ctx.stroke(); }
    ctx.lineWidth = 3; ctx.beginPath();
    for (let x = x0; x <= x1; x += 6) { const ph = (x - x0) / 38; ctx.lineTo(x + Math.cos(ph * Math.PI * 2) * 12, y - h * 0.55 + Math.sin(ph * Math.PI * 2) * 22); }
    ctx.stroke();
  };

  // ---------- trench (close-up from inside) ----------
  T.bgs.trench = (ctx, bg, lt, env) => {
    const night = !!bg.night, seed = env.seed + 'trench', horizon = (bg.horizon ?? 0.5) * H, lip = (bg.lip ?? 0.62) * H;
    skyOnly(ctx, bg, lt, env, night ? 'night' : bg.preset ?? 'sepia', horizon);
    cam(ctx, env, 0.4, () => T.ridge(ctx, horizon, 110, 0.002, seed + 'm', night ? '#2c3456' : '#b7a98a', night ? '#3a4670' : '#efe6cf', 0.3));
    cam(ctx, env, 0.65, () => {
      ctx.fillStyle = night ? '#2a3046' : '#6b5f3a'; ctx.fillRect(-OV, horizon + 20, W + OV * 2, H);
      craters(ctx, horizon + 30, lip - 10, 9, seed + 'c', night ? '#1f2438' : '#4a4128');
      if (bg.wire !== false) T.barbedWire(ctx, -OV, W + OV, lip - 30, seed + 'w', 50);
      ctx.fillStyle = night ? '#2a2f45' : '#7d7a45';
      ctx.beginPath(); ctx.moveTo(-OV, H + OV);
      for (let x = -OV; x <= W + OV; x += 40) ctx.lineTo(x, lip + T.noise(x * 0.01, seed + 'lip') * 16);
      ctx.lineTo(W + OV, H + OV); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = P.ink; ctx.lineWidth = 6; ctx.stroke();
      if (bg.burning) { flameStrip(ctx, lip + 8, lt, seed + 'f', 14, 110); T.smokePuffs(ctx, W * 0.5, lip - 60, lt, { n: 10, color: '#2b2620', seed: seed + 's', rise: 320, size: 70, drift: 120 }); }
    });
    if (bg.back !== false) cam(ctx, env, 0.9, () => T.slabs(ctx, -OV, W + OV, lip + 40, H + OV, seed + 'back', night ? '#252a3c' : '#4b3d2a', night ? '#3a4260' : '#6e5c3c'));
  };

  // ---------- trench cross-section (side cutaway) ----------
  T.bgs['trench-section'] = (ctx, bg, lt, env) => {
    const seed = env.seed + 'ts', surf = (bg.horizon ?? 0.36) * H;
    skyOnly(ctx, bg, lt, env, bg.preset ?? 'sepia', surf);
    cam(ctx, env, 1, () => {
      ctx.fillStyle = '#4b3a26'; ctx.fillRect(-OV, surf, W + OV * 2, H + OV);
      const r = T.rng(T.hash(seed)); ctx.fillStyle = 'rgba(20,10,4,0.25)';
      for (let i = 0; i < 70; i++) ctx.fillRect(-OV + r() * (W + OV * 2), surf + r() * H, 30 + r() * 60, 6);
      const tx = (bg.trenchX ?? 0.5) * W, tw = W * 0.34, td = H * 0.16;
      T.outlined(ctx, (k) => { k.moveTo(tx - tw / 2, surf - 2); k.lineTo(tx - tw / 2 + 30, surf + td); k.lineTo(tx + tw / 2 - 60, surf + td); k.lineTo(tx + tw / 2 - 60, surf + td * 0.6); k.lineTo(tx + tw / 2, surf + td * 0.6); k.lineTo(tx + tw / 2, surf - 2); k.closePath(); }, '#2e2216', { line: 7 });
      if (bg.dugout !== false) {
        const dx = tx - tw / 2 + 60, dy = surf + td + 60;
        T.outlined(ctx, (k) => T.rrect(k, dx, dy, 300, 150, 30), '#1c140c', { line: 7 });
        const g = ctx.createRadialGradient(dx + 150, dy + 70, 0, dx + 150, dy + 70, 160); g.addColorStop(0, 'rgba(255,200,90,0.55)'); g.addColorStop(1, 'rgba(255,200,90,0)');
        ctx.fillStyle = g; ctx.fillRect(dx, dy, 300, 150);
        T.outlined(ctx, (k) => k.arc(dx + 150, dy + 40, 12, 0, Math.PI * 2), '#ffd860', { line: 4 });
      }
      ctx.strokeStyle = P.ink; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-OV, surf); ctx.lineTo(W + OV, surf); ctx.stroke();
      ctx.fillStyle = '#7d7a45'; ctx.fillRect(-OV, surf - 10, W + OV * 2, 12);
    });
  };

  // ---------- battlefield / no-man's-land / aftermath ----------
  T.bgs.battlefield = (ctx, bg, lt, env) => {
    const seed = env.seed + 'bf', horizon = (bg.horizon ?? 0.5) * H, pal = { ground: bg.ground ?? '#6b5f3a', crater: bg.crater ?? '#4a4128' };
    skyOnly(ctx, bg, lt, env, bg.preset ?? 'sepia', horizon);
    cam(ctx, env, 0.45, () => T.ridge(ctx, horizon, 90, 0.0022, seed + 'h', bg.hill ?? '#8a7a50', '#efe6cf', 0.3));
    cam(ctx, env, 0.8, () => {
      ctx.fillStyle = pal.ground; ctx.fillRect(-OV, horizon + 10, W + OV * 2, H + OV);
      craters(ctx, horizon + 30, H * 0.95, bg.craters ?? 14, seed + 'c', pal.crater);
      const r = T.rng(T.hash(seed + 'tr'));
      for (let i = 0; i < (bg.trees ?? 4); i++) T.deadTree(ctx, -OV + r() * (W + OV * 2), horizon + 40 + r() * 80, 260 + r() * 200, seed + 't' + i);
      if (bg.wire) T.barbedWire(ctx, -OV, W + OV, H * 0.78, seed + 'w', 70);
      if (bg.fires) { const fr = T.rng(T.hash(seed + 'f')); for (let i = 0; i < bg.fires; i++) { ctx.save(); ctx.translate(-OV + fr() * (W + OV * 2), horizon + 50 + fr() * (H - horizon - 120)); T.drawFlame(ctx, 70 + fr() * 70, lt + i * 0.2, seed + 'fl' + i); ctx.restore(); } }
      if (bg.bodies) {
        const br = T.rng(T.hash(seed + 'b'));
        for (let i = 0; i < bg.bodies; i++) {
          const x = -OV * 0.5 + br() * (W + OV), y = horizon + 80 + br() * (H - horizon - 140);
          ctx.fillStyle = '#9b1c1c'; ctx.beginPath(); ctx.ellipse(x + 20, y + 8, 70, 16, 0, 0, Math.PI * 2); ctx.fill();
          T.outlined(ctx, (k) => k.ellipse(x, y, 50, 18, 0.1, 0, Math.PI * 2), bg.bodyColor ?? '#77735e', { line: 5 });
          T.outlined(ctx, (k) => k.arc(x + 52, y - 4, 16, 0, Math.PI * 2), '#f2efe8', { line: 4 });
        }
      }
      const gr = T.rng(T.hash(seed + 'g')); ctx.strokeStyle = 'rgba(200,190,120,0.6)'; ctx.lineWidth = 4;
      for (let i = 0; i < 60; i++) { const x = -OV + gr() * (W + OV * 2), y = H * 0.85 + gr() * H * 0.15; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 6, y - 26); ctx.moveTo(x, y); ctx.lineTo(x + 8, y - 22); ctx.stroke(); }
    });
    if (bg.haze) { ctx.fillStyle = bg.haze === true ? 'rgba(217,164,65,0.22)' : bg.haze; ctx.fillRect(0, 0, W, H); }
  };

  // ---------- sea ----------
  const SEA = {
    turquoise: { sky: 'day', top: '#2fc4c0', bot: '#12a9a4', crest: 'rgba(255,255,255,0.8)' },
    storm: { sky: 'storm', top: '#3a4a52', bot: '#1c262c', crest: 'rgba(220,230,235,0.6)' },
    fog: { sky: 'overcast', top: '#8a9aa0', bot: '#5d6e74', crest: 'rgba(240,244,246,0.5)' },
    night: { sky: 'night', top: '#1f2c4a', bot: '#0c1428', crest: 'rgba(170,190,230,0.45)' },
    sunset: { sky: 'sunset', top: '#e98a6a', bot: '#3d5a8a', crest: 'rgba(255,230,190,0.7)' },
  };
  T.SEA = SEA;
  T.bgs.sea = (ctx, bg, lt, env) => {
    const p = SEA[bg.preset ?? 'turquoise'], seed = env.seed + 'sea', hz = (bg.horizon ?? 0.55) * H;
    if (!p) throw new Error('Unknown sea preset: ' + bg.preset);
    skyOnly(ctx, bg, lt, env, p.sky, hz);
    cam(ctx, env, 0.5, () => {
      for (const side of bg.cliffs === 'both' ? ['left', 'right'] : bg.cliffs ? [bg.cliffs] : []) {
        const d = side === 'left' ? -1 : 1, x = d > 0 ? W * 0.72 : -OV;
        T.outlined(ctx, (k) => { k.moveTo(x, hz + 10); k.lineTo(x, hz - 170); k.lineTo(x + W * 0.28 + OV * (d < 0 ? 1 : 0), hz - 190); k.lineTo(x + W * 0.28 + OV, hz - 180); k.lineTo(x + W * 0.28 + OV, hz + 10); k.closePath(); }, bg.cliffColor ?? '#d9b77a', { line: 7, shade: (k) => { k.fillStyle = 'rgba(90,50,10,0.25)'; k.fillRect(x, hz - 120, W, 130); } });
      }
      if (bg.islet) {
        const ix = bg.islet[0] * W, iy = hz + 6;
        T.outlined(ctx, (k) => k.ellipse(ix, iy, 160, 40, 0, Math.PI, 0), '#8a7a5a', { line: 6 });
        T.outlined(ctx, (k) => T.rrect(k, ix - 30, iy - 180, 60, 150, 10), '#e9e2d2', { line: 6, shade: (k) => { k.fillStyle = '#c8bfae'; k.fillRect(ix, iy - 180, 30, 150); } });
        T.outlined(ctx, (k) => { k.moveTo(ix - 42, iy - 180); k.lineTo(ix, iy - 230); k.lineTo(ix + 42, iy - 180); k.closePath(); }, P.red, { line: 6 });
      }
    });
    cam(ctx, env, 0.85, () => {
      const g = ctx.createLinearGradient(0, hz, 0, H); g.addColorStop(0, p.top); g.addColorStop(1, p.bot);
      ctx.fillStyle = g; ctx.fillRect(-OV, hz, W + OV * 2, H + OV);
      ctx.strokeStyle = P.ink; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-OV, hz); ctx.lineTo(W + OV, hz); ctx.stroke();
      const r = T.rng(T.hash(seed + 'w')); ctx.strokeStyle = p.crest; ctx.lineCap = 'round';
      for (let i = 0; i < (bg.waves ?? 40); i++) {
        const y = hz + 20 + Math.pow(r(), 1.4) * (H - hz), sc = 0.4 + (y - hz) / (H - hz), x = -OV + ((r() * (W + OV * 2) + lt * 20 * sc) % (W + OV * 2));
        ctx.lineWidth = 3 + sc * 4; ctx.beginPath(); ctx.moveTo(x - 30 * sc, y); ctx.quadraticCurveTo(x, y - 14 * sc, x + 30 * sc, y); ctx.stroke();
      }
      if (bg.mist || bg.preset === 'fog' || bg.preset === 'storm') { const m = ctx.createLinearGradient(0, hz - 120, 0, hz + 160); m.addColorStop(0, 'rgba(220,226,230,0)'); m.addColorStop(0.5, 'rgba(220,226,230,0.45)'); m.addColorStop(1, 'rgba(220,226,230,0)'); ctx.fillStyle = m; ctx.fillRect(-OV, hz - 120, W + OV * 2, 280); }
    });
  };

  T.bgs.underwater = (ctx, bg, lt, env) => {
    const seed = env.seed + 'uw';
    cam(ctx, env, 0.3, () => { const g = ctx.createLinearGradient(0, -OV, 0, H); g.addColorStop(0, bg.top ?? '#4fb4e0'); g.addColorStop(1, bg.bottom ?? '#123a6a'); ctx.fillStyle = g; ctx.fillRect(-OV, -OV, W + OV * 2, H + OV * 2); T.drawRays(ctx, W * 0.5, -H * 0.4, lt, { color: 'rgba(220,245,255,0.08)', count: 8, spin: 0.01, seed }); });
    cam(ctx, env, 0.8, () => {
      ctx.fillStyle = '#d9c48a'; ctx.beginPath(); ctx.moveTo(-OV, H + OV); for (let x = -OV; x <= W + OV; x += 40) ctx.lineTo(x, H * 0.86 + T.noise(x * 0.004, seed) * 30); ctx.lineTo(W + OV, H + OV); ctx.fill();
      const r = T.rng(T.hash(seed + 'sw'));
      for (let i = 0; i < 9; i++) { const x = -OV + r() * (W + OV * 2), h = 160 + r() * 220; ctx.strokeStyle = '#2f7a4a'; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, H * 0.9); for (let k = 1; k <= 6; k++) ctx.lineTo(x + Math.sin(lt * 1.5 + k + i) * 16, H * 0.9 - (h * k) / 6); ctx.stroke(); }
      const b = T.rng(T.hash(seed + 'bu')); ctx.strokeStyle = 'rgba(230,250,255,0.7)'; ctx.lineWidth = 3;
      for (let i = 0; i < 30; i++) { const x = b() * W, y = H - ((lt * (60 + b() * 80) + b() * H) % H), rr = 4 + b() * 10; ctx.beginPath(); ctx.arc(x + Math.sin(lt * 3 + i) * 8, y, rr, 0, Math.PI * 2); ctx.stroke(); }
    });
  };

  // ---------- corridor: one-point stone tunnel with torches ----------
  T.bgs.corridor = (ctx, bg, lt, env) => {
    const vx = (bg.vp ?? [0.5, 0.46])[0] * W, vy = (bg.vp ?? [0.5, 0.46])[1] * H, stone = bg.stone ?? '#5b554a', seed = env.seed + 'cor';
    cam(ctx, env, 0.9, () => {
      fill(ctx, '#151412');
      ctx.fillStyle = bg.sky ?? '#1c2a3a'; ctx.beginPath(); ctx.moveTo(vx - 40, vy - 30); ctx.lineTo(vx + 40, vy - 30); ctx.lineTo(W * 0.62, -OV); ctx.lineTo(W * 0.38, -OV); ctx.fill();
      for (const d of [-1, 1]) {
        const outerX = d < 0 ? -OV : W + OV;
        ctx.fillStyle = d < 0 ? stone : T.shade(stone, -0.18);
        ctx.beginPath(); ctx.moveTo(vx + d * 40, vy - 30); ctx.lineTo(outerX, -OV); ctx.lineTo(outerX, H + OV); ctx.lineTo(vx + d * 40, vy + 30); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(20,16,12,0.7)'; ctx.lineWidth = 4;
        for (let i = 1; i < 9; i++) { const f = Math.pow(i / 9, 1.6), x = T.lerp(vx + d * 40, outerX, f); ctx.beginPath(); ctx.moveTo(x, T.lerp(vy - 30, -OV, f)); ctx.lineTo(x, T.lerp(vy + 30, H + OV, f)); ctx.stroke(); } // block joints
        for (let j = 1; j < 7; j++) { const t = j / 7; ctx.beginPath(); ctx.moveTo(vx + d * 40, T.lerp(vy - 30, vy + 30, t)); ctx.lineTo(outerX, T.lerp(-OV, H + OV, t)); ctx.stroke(); }
      }
      ctx.fillStyle = bg.floor ?? '#4a4640'; ctx.beginPath(); ctx.moveTo(vx - 40, vy + 30); ctx.lineTo(vx + 40, vy + 30); ctx.lineTo(W + OV, H + OV); ctx.lineTo(-OV, H + OV); ctx.closePath(); ctx.fill();
      if (bg.thread) { ctx.strokeStyle = '#f2efe8'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(W * 0.46, H + 20); ctx.quadraticCurveTo(W * 0.52, H * 0.7, vx, vy + 30); ctx.stroke(); }
      const torches = bg.torches ?? 2;
      for (let i = 0; i < torches; i++) for (const d of [-1, 1]) {
        const f = 0.35 + (i / Math.max(1, torches)) * 0.5, x = T.lerp(vx + d * 40, d < 0 ? 0 : W, f), y = T.lerp(vy, H * 0.38, f), s = 40 + f * 90;
        const g = ctx.createRadialGradient(x, y, 0, x, y, s * 4); g.addColorStop(0, 'rgba(255,190,80,0.45)'); g.addColorStop(1, 'rgba(255,190,80,0)');
        ctx.fillStyle = g; ctx.fillRect(x - s * 4, y - s * 4, s * 8, s * 8);
        ctx.save(); ctx.translate(x, y); T.drawFlame(ctx, s, lt + i + d, seed + i + d); ctx.restore();
      }
      const fog = ctx.createRadialGradient(vx, vy, 0, vx, vy, W * 0.25); fog.addColorStop(0, 'rgba(0,0,0,0.95)'); fog.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = fog; ctx.fillRect(-OV, -OV, W + OV * 2, H + OV * 2);
    });
  };

  // ---------- void: horror / inner-mind stages ----------
  T.bgs.void = (ctx, bg, lt, env) => {
    const v = bg.variant ?? 'black', seed = env.seed + 'void';
    if (v === 'black') { fill(ctx, bg.color ?? '#0a0908'); return; }
    if (v === 'spots') {
      fill(ctx, bg.color ?? '#2f8f9a');
      const r = T.rng(T.hash(seed)); ctx.fillStyle = bg.spot ?? 'rgba(10,30,40,0.35)';
      for (let i = 0; i < 40; i++) { ctx.beginPath(); ctx.ellipse(r() * W, r() * H, 10 + r() * 60, 8 + r() * 40, r() * 3, 0, Math.PI * 2); ctx.fill(); }
      return;
    }
    if (v === 'boil') {
      fill(ctx, bg.color ?? '#3a0c34');
      const r = T.rng(T.hash(seed + Math.floor(lt * 15)));
      for (let i = 0; i < 26; i++) {
        const cx = r() * W, cy = r() * H, rad = 140 + r() * 220, g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
        g.addColorStop(0, `rgba(${Math.round(120 + r() * 60)},${Math.round(20 + r() * 30)},${Math.round(110 + r() * 60)},0.35)`); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
      }
      return;
    }
    if (v === 'flesh') {
      cam(ctx, env, 0.3, () => { const g = ctx.createRadialGradient(W / 2, H * 0.45, 0, W / 2, H * 0.45, W * 0.7); g.addColorStop(0, '#4a1a1e'); g.addColorStop(1, '#1a0709'); ctx.fillStyle = g; ctx.fillRect(-OV, -OV, W + OV * 2, H + OV * 2); });
      const r = T.rng(T.hash(seed + 'p'));
      for (let i = 0; i < (bg.pillars ?? 6); i++) {
        const n = bg.pillars ?? 6, f = 0.4 + r() * 0.6, x = ((i + 0.3 + r() * 0.4) / n) * W, w = 55 + r() * 60;
        cam(ctx, env, f, () => {
          // bulbous organic column: width swells and pinches along its height, melting wider at the base
          const rows = 9, left = [], right = [];
          for (let j = 0; j <= rows; j++) {
            const y = -OV + ((H + OV * 2) * j) / rows, bulge = 1 + 0.35 * Math.sin(j * 1.7 + i) + (j / rows) * 0.8, cx = x + T.noise(j * 0.7, seed + i) * 40;
            left.push([cx - (w / 2) * bulge, y]); right.unshift([cx + (w / 2) * bulge, y]);
          }
          const pts = left.concat(right);
          T.outlined(ctx, (k) => { k.moveTo(pts[0][0], pts[0][1]); for (let q = 1; q < pts.length - 1; q++) k.quadraticCurveTo(pts[q][0], pts[q][1], (pts[q][0] + pts[q + 1][0]) / 2, (pts[q][1] + pts[q + 1][1]) / 2); k.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]); k.closePath(); }, '#5a2226', {
            line: 6, ink: '#1a0709', shade: (k) => { k.fillStyle = '#8a3a3a'; k.fillRect(x - w * 1.3, -OV, w * 0.5, H + OV * 2); k.strokeStyle = 'rgba(20,4,6,0.45)'; k.lineWidth = 5; for (let j = 1; j < rows; j++) { const yy = -OV + ((H + OV * 2) * j) / rows; k.beginPath(); k.moveTo(x - w, yy); k.quadraticCurveTo(x, yy + 24, x + w, yy); k.stroke(); } },
          });
          ctx.strokeStyle = '#a01020'; ctx.lineWidth = 5; ctx.lineCap = 'round';
          for (let d = 0; d < 2; d++) { const dx = x + (r() - 0.5) * w * 0.5, len = 60 + ((lt * 30 + r() * 200) % 220); ctx.beginPath(); ctx.moveTo(dx, -10); ctx.lineTo(dx, len); ctx.stroke(); }
        });
      }
      return;
    }
    if (v === 'stage') {
      fill(ctx, '#0a0908');
      const cx = (bg.at ?? 0.5) * W, fy = H * 0.8;
      cam(ctx, env, 0.9, () => {
        const r = T.rng(T.hash(seed + 'cob'));
        ctx.save(); ctx.beginPath(); ctx.ellipse(cx, fy, W * 0.3, H * 0.12, 0, 0, Math.PI * 2); ctx.clip();
        ctx.fillStyle = '#4a4640'; ctx.fillRect(cx - W * 0.3, fy - H * 0.12, W * 0.6, H * 0.24);
        for (let i = 0; i < 120; i++) { ctx.fillStyle = r() > 0.5 ? '#7a7670' : '#6a665f'; ctx.beginPath(); ctx.ellipse(cx + (r() - 0.5) * W * 0.6, fy + (r() - 0.5) * H * 0.24, 24 + r() * 14, 12 + r() * 6, 0, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
        const g = ctx.createLinearGradient(0, -OV, 0, fy); g.addColorStop(0, 'rgba(232,224,208,0.05)'); g.addColorStop(1, 'rgba(232,224,208,0.28)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(cx - 120, -OV); ctx.lineTo(cx + 120, -OV); ctx.lineTo(cx + W * 0.3, fy); ctx.lineTo(cx - W * 0.3, fy); ctx.closePath(); ctx.fill();
      });
      return;
    }
    throw new Error('Unknown void variant: ' + v);
  };
})();
