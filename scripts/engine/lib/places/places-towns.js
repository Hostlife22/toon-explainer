// places-towns.js — interiors and towns: stage (curtains), bar / beerhall, hospital ward, factory skyline, street1920
// (palazzi, domes, obelisk), minoan palace hall, olympus cloud throne, chalkboard classroom.
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL, W = T.W, H = T.H, OV = 260;
  const cam = (ctx, env, f, fn) => { ctx.save(); T.applyCam(ctx, env.cam, f); fn(); ctx.restore(); };
  const skyOnly = (ctx, bg, lt, env, preset, horizon) =>
    T.bgs.sky(ctx, { preset, clouds: bg.clouds ?? 4, hills: 0, ground: false, horizon, palette: bg.palette, cloudStyle: bg.cloudStyle }, lt, env);

  T.curtain = (ctx, x0, x1, y0, y1, color, lt, seed) => {
    const folds = Math.max(3, Math.round((x1 - x0) / 70)), fw = (x1 - x0) / folds;
    for (let i = 0; i < folds; i++) {
      const x = x0 + i * fw, sway = Math.sin(lt * 0.8 + i + (T.hash(seed) % 7)) * 4;
      T.outlined(ctx, (k) => { k.moveTo(x, y0); k.lineTo(x + fw, y0); k.quadraticCurveTo(x + fw + sway, (y0 + y1) / 2, x + fw + sway * 2, y1); k.lineTo(x + sway * 2, y1); k.quadraticCurveTo(x + sway, (y0 + y1) / 2, x, y0); k.closePath(); }, i % 2 ? color : T.shade(color, -0.18), { line: 4 });
    }
  };

  T.bgs.stage = (ctx, bg, lt, env) => {
    const red = bg.color ?? '#8a1a1a', floorY = H * 0.8;
    cam(ctx, env, 0.9, () => {
      ctx.fillStyle = bg.back ?? '#2a1210'; ctx.fillRect(-OV, -OV, W + OV * 2, H + OV * 2);
      T.planks(ctx, -OV, floorY, W + OV, H + OV, bg.floor ?? '#8a5a32', false, 60);
      for (const s of bg.spots ?? [0.35, 0.65]) { const g = ctx.createRadialGradient(s * W, floorY, 0, s * W, floorY, 360); g.addColorStop(0, 'rgba(255,240,200,0.4)'); g.addColorStop(1, 'rgba(255,240,200,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(s * W, floorY + 40, 360, 90, 0, 0, Math.PI * 2); ctx.fill(); }
      T.curtain(ctx, -OV, W * 0.2, -OV, H + 40, red, lt, 'cl');
      T.curtain(ctx, W * 0.8, W + OV, -OV, H + 40, red, lt, 'cr');
      T.outlined(ctx, (k) => { k.moveTo(-OV, -OV); k.lineTo(W + OV, -OV); k.lineTo(W + OV, H * 0.1); for (let x = W + OV; x > -OV; x -= 160) k.quadraticCurveTo(x - 80, H * 0.18, x - 160, H * 0.1); k.closePath(); }, T.shade(red, -0.1), { line: 5, shade: (k) => { k.fillStyle = P.gold; k.fillRect(-OV, H * 0.08, W + OV * 2, 10); } });
    });
  };

  // Bar / beerhall: plank wall, bottle shelves, pendant lamps, counter band in front (bg.counter).
  T.bgs.bar = (ctx, bg, lt, env) => {
    cam(ctx, env, 0.85, () => {
      if (bg.brick) { ctx.fillStyle = '#b8836a'; ctx.fillRect(-OV, -OV, W + OV * 2, H + OV * 2); ctx.strokeStyle = 'rgba(80,40,20,0.45)'; ctx.lineWidth = 4; for (let y = -OV, row = 0; y < H + OV; y += 46, row++) { ctx.beginPath(); ctx.moveTo(-OV, y); ctx.lineTo(W + OV, y); ctx.stroke(); for (let x = -OV + (row % 2) * 60; x < W + OV; x += 120) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 46); ctx.stroke(); } } }
      else T.planks(ctx, -OV, -OV, W + OV, H + OV, bg.wall ?? '#8a5a32', true, 70);
      for (const y of [H * 0.32, H * 0.5]) {
        T.outlined(ctx, (k) => k.rect(-OV, y, W + OV * 2, 18), '#5a3520', { line: 5 });
        const cols = ['#3a7a4a', '#7a3a2a', '#c8a040', '#3a4a7a'];
        for (let x = -OV + 30; x < W + OV; x += 46) { const c = cols[Math.abs(Math.round(x)) % 4], h = 70 + ((x * 7) % 30); T.outlined(ctx, (k) => { k.rect(x - 12, y - h + 22, 24, h - 22); k.rect(x - 5, y - h, 10, 26); }, c, { line: 3 }); }
      }
      for (const lx of bg.lamps ?? [0.25, 0.5, 0.75]) {
        const x = lx * W; ctx.strokeStyle = P.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, -OV); ctx.lineTo(x, H * 0.12); ctx.stroke();
        T.outlined(ctx, (k) => { k.moveTo(x - 50, H * 0.18); k.quadraticCurveTo(x, H * 0.08, x + 50, H * 0.18); k.closePath(); }, '#f5c060', { line: 5 });
        const g = ctx.createRadialGradient(x, H * 0.2, 0, x, H * 0.2, 340); g.addColorStop(0, 'rgba(255,200,110,0.32)'); g.addColorStop(1, 'rgba(255,200,110,0)'); ctx.fillStyle = g; ctx.fillRect(x - 340, H * 0.2 - 340, 680, 680);
      }
    });
    if (bg.counter !== false) cam(ctx, env, 1.1, () => {
      const cy = H * (bg.counterY ?? 0.78);
      T.outlined(ctx, (k) => k.rect(-OV, cy, W + OV * 2, H), '#6b4426', { line: 8, shade: (k) => { k.fillStyle = '#8a5a32'; k.fillRect(-OV, cy, W + OV * 2, 26); } });
      for (const mx of bg.mugs ?? [0.18, 0.62, 0.86]) { ctx.save(); ctx.translate(mx * W, cy + 4); T.drawProp(ctx, 'mug', 110, lt, {}); ctx.restore(); }
    });
  };

  T.bgs.hospital = (ctx, bg, lt, env) => {
    const floorY = H * 0.62;
    cam(ctx, env, 0.9, () => {
      ctx.fillStyle = bg.wall ?? '#cfe0d4'; ctx.fillRect(-OV, -OV, W + OV * 2, floorY + OV);
      ctx.fillStyle = '#a8c4b2'; ctx.fillRect(-OV, floorY - 90, W + OV * 2, 90);
      for (const wx of [0.2, 0.5, 0.8]) T.outlined(ctx, (k) => T.rrect(k, wx * W - 90, H * 0.12, 180, 230, 10), '#e8f4f8', { line: 7, shade: (k) => { k.strokeStyle = '#7a8a90'; k.lineWidth = 5; k.beginPath(); k.moveTo(wx * W, H * 0.12); k.lineTo(wx * W, H * 0.12 + 230); k.stroke(); } });
      ctx.fillStyle = bg.floor ?? '#b9c0c4'; ctx.fillRect(-OV, floorY, W + OV * 2, H + OV);
      // beds seen from the foot end, two rows receding toward the centre
      const n = bg.beds ?? 3;
      for (let i = n - 1; i >= 0; i--) for (const d of [-1, 1]) {
        const f = 1 - i / n, sc = 0.45 + f * 0.75, x = W / 2 + d * (220 + f * 480), y = floorY + 40 + f * 300;
        ctx.strokeStyle = '#6a7278'; ctx.lineWidth = 8 * sc;
        ctx.beginPath(); ctx.moveTo(x - 150 * sc, y + 40 * sc); ctx.lineTo(x - 150 * sc, y - 120 * sc); ctx.moveTo(x + 150 * sc, y + 40 * sc); ctx.lineTo(x + 150 * sc, y - 120 * sc); ctx.moveTo(x - 150 * sc, y - 100 * sc); ctx.lineTo(x + 150 * sc, y - 100 * sc); ctx.stroke();
        T.outlined(ctx, (k) => k.ellipse(x, y - 90 * sc, 110 * sc, 30 * sc, 0, 0, Math.PI * 2), '#c8c0e0', { line: 5 });
        T.outlined(ctx, (k) => T.rrect(k, x - 145 * sc, y - 70 * sc, 290 * sc, 90 * sc, 20 * sc), '#f4f4f4', { line: 6, shade: (k) => { k.fillStyle = '#dde2e6'; k.fillRect(x - 145 * sc, y, 290 * sc, 30 * sc); } });
      }
    });
  };

  T.bgs.factory = (ctx, bg, lt, env) => {
    const hz = H * (bg.horizon ?? 0.72), seed = env.seed + 'fac';
    skyOnly(ctx, bg, lt, env, bg.preset ?? 'overcast', hz);
    cam(ctx, env, 0.7, () => {
      const r = T.rng(T.hash(seed));
      for (let i = 0; i < 5; i++) {
        const x = -OV + ((i + 0.2) / 5) * (W + OV * 2), w = 280 + r() * 160, h = 260 + r() * 160, col = bg.color ?? '#3c3f45';
        T.outlined(ctx, (k) => k.rect(x, hz - h, w, h + 40), col, { line: 6, shade: (k) => { k.fillStyle = '#1c1e22'; for (let wx = x + 30; wx < x + w - 30; wx += 54) for (let wy = hz - h + 40; wy < hz - 20; wy += 64) k.fillRect(wx, wy, 30, 36); } });
        if (r() > 0.3) { const cx = x + w * 0.7, ch = 220 + r() * 120; T.outlined(ctx, (k) => k.rect(cx - 22, hz - h - ch, 44, ch), '#5a4a42', { line: 6 }); T.smokePuffs(ctx, cx, hz - h - ch - 10, lt, { seed: seed + i, color: '#6a6a6a', drift: 120, rise: 220, size: 50 }); }
      }
      if (bg.banner) { T.outlined(ctx, (k) => k.rect(W * 0.4, hz - 300, 220, 320), bg.banner, { line: 6 }); T.outlined(ctx, (k) => k.arc(W * 0.4 + 110, hz - 160, 50, 0, Math.PI * 2), '#f2efe8', { line: 5 }); }
    });
    cam(ctx, env, 1, () => { ctx.fillStyle = '#4a4d52'; ctx.fillRect(-OV, hz + 30, W + OV * 2, H + OV); });
  };

  // street1920: ochre palazzi with rows of arched windows, optional domes and an obelisk, cobbled square.
  T.bgs.street1920 = (ctx, bg, lt, env) => {
    const hz = H * (bg.horizon ?? 0.7), grey = !!bg.grey, seed = env.seed + 'st';
    skyOnly(ctx, bg, lt, env, grey ? 'overcast' : bg.preset ?? 'day', hz);
    cam(ctx, env, 0.6, () => {
      for (const dx of bg.domes ?? [0.3, 0.7]) { const x = dx * W; T.outlined(ctx, (k) => { k.rect(x - 90, hz - 380, 180, 200); }, grey ? '#9a9a96' : '#d8c2a0', { line: 6 }); T.outlined(ctx, (k) => { k.moveTo(x - 110, hz - 380); k.quadraticCurveTo(x - 110, hz - 560, x, hz - 580); k.quadraticCurveTo(x + 110, hz - 560, x + 110, hz - 380); k.closePath(); }, grey ? '#6d6f73' : '#8a6a5a', { line: 6, shade: (k) => { k.strokeStyle = 'rgba(30,15,5,0.4)'; k.lineWidth = 4; for (let i = -2; i <= 2; i++) { k.beginPath(); k.moveTo(x + i * 40, hz - 380); k.quadraticCurveTo(x + i * 20, hz - 520, x, hz - 580); k.stroke(); } } }); }
      if (bg.obelisk) { const x = bg.obelisk * W; T.outlined(ctx, (k) => { k.moveTo(x - 30, hz); k.lineTo(x - 18, hz - 520); k.lineTo(x, hz - 570); k.lineTo(x + 18, hz - 520); k.lineTo(x + 30, hz); k.closePath(); }, grey ? '#b0aea8' : '#e9dcc0', { line: 6 }); }
    });
    cam(ctx, env, 0.85, () => {
      const r = T.rng(T.hash(seed + 'b'));
      for (let i = 0; i < 6; i++) {
        const x = -OV + (i / 6) * (W + OV * 2), w = (W + OV * 2) / 6 - 10, h = 300 + r() * 120, col = grey ? T.mix('#c9a070', '#8a96a0', 0.6) : ['#c9a070', '#d8b088', '#b88a5a'][i % 3];
        if (i === 2 || i === 3) continue;
        T.outlined(ctx, (k) => k.rect(x, hz - h, w, h + 20), col, { line: 6, shade: (k) => { for (let wx = x + 30; wx < x + w - 40; wx += 70) for (let wy = hz - h + 40; wy < hz - 60; wy += 100) { k.fillStyle = '#3a2a22'; k.beginPath(); k.moveTo(wx, wy + 60); k.lineTo(wx, wy + 20); k.arc(wx + 18, wy + 20, 18, Math.PI, 0); k.lineTo(wx + 36, wy + 60); k.closePath(); k.fill(); } } });
      }
    });
    cam(ctx, env, 1, () => {
      ctx.fillStyle = grey ? '#7a7670' : '#9a8f80'; ctx.fillRect(-OV, hz, W + OV * 2, H + OV);
      ctx.strokeStyle = 'rgba(42,28,21,0.3)'; ctx.lineWidth = 3;
      for (let y = hz + 30, row = 0; y < H + OV; y += 26 + row * 6, row++) for (let x = -OV + (row % 2) * 30; x < W + OV; x += 60 + row * 6) { ctx.beginPath(); ctx.ellipse(x, y, 24 + row * 2, 9 + row, 0, 0, Math.PI * 2); ctx.stroke(); }
      if (grey) { ctx.fillStyle = 'rgba(160,170,180,0.25)'; ctx.fillRect(-OV, -OV, W + OV * 2, H + OV * 2); }
    });
  };

  // Minoan hall: striped wall bands, disc frieze, downward-tapering red columns, perspective checker floor.
  T.bgs.minoan = (ctx, bg, lt, env) => {
    const floorY = H * 0.72;
    cam(ctx, env, 0.9, () => {
      const bands = ['#e9d9bd', '#a8443a', '#e9d9bd', '#c8a070', '#e9d9bd'];
      bands.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(-OV, -OV + (i * (floorY + OV)) / bands.length, W + OV * 2, (floorY + OV) / bands.length + 1); });
      for (let x = -OV; x < W + OV; x += 70) { T.outlined(ctx, (k) => k.arc(x, H * 0.1, 22, 0, Math.PI * 2), (x / 70) % 2 ? '#c24b3c' : '#3b62a8', { line: 4 }); }
      for (const cx of bg.columns ?? [0.12, 0.38, 0.62, 0.88]) {
        const x = cx * W;
        T.outlined(ctx, (k) => { k.moveTo(x - 60, H * 0.16); k.lineTo(x + 60, H * 0.16); k.lineTo(x + 38, floorY); k.lineTo(x - 38, floorY); k.closePath(); }, '#a8322a', { line: 7, shade: (k) => { k.fillStyle = '#7a2018'; k.fillRect(x + 10, H * 0.16, 60, floorY); } });
        T.outlined(ctx, (k) => T.rrect(k, x - 80, H * 0.13, 160, 40, 16), '#1c1410', { line: 6 });
      }
    });
    cam(ctx, env, 1, () => {
      const vx = W / 2;
      for (let row = 0; row < 7; row++) for (let col = -12; col < 12; col++) {
        const f0 = row / 7, f1 = (row + 1) / 7, y0 = floorY + Math.pow(f0, 1.4) * (H - floorY + 80), y1 = floorY + Math.pow(f1, 1.4) * (H - floorY + 80);
        const sp0 = 90 + f0 * 260, sp1 = 90 + f1 * 260;
        ctx.fillStyle = ['#a8443a', '#e9d9bd', '#3b62a8'][(row + col + 30) % 3];
        ctx.beginPath(); ctx.moveTo(vx + col * sp0, y0); ctx.lineTo(vx + (col + 1) * sp0, y0); ctx.lineTo(vx + (col + 1) * sp1, y1); ctx.lineTo(vx + col * sp1, y1); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = P.ink; ctx.lineWidth = 4; ctx.stroke();
      }
    });
  };

  // Olympus: cloud floor, marble throne on stepped stone, broken column.
  T.bgs.olympus = (ctx, bg, lt, env) => {
    cam(ctx, env, 0.3, () => { const g = ctx.createLinearGradient(0, -OV, 0, H); g.addColorStop(0, '#9fd2f0'); g.addColorStop(1, '#f4f8ff'); ctx.fillStyle = g; ctx.fillRect(-OV, -OV, W + OV * 2, H + OV * 2); T.drawRays(ctx, W / 2, H * 0.3, lt, { color: 'rgba(255,250,220,0.18)', count: 10, spin: 0.02, seed: 'oly' }); });
    cam(ctx, env, 0.8, () => {
      if (bg.throne !== false) {
        const x = W * (bg.throneX ?? 0.5), base = H * 0.66;
        for (let i = 0; i < 3; i++) T.outlined(ctx, (k) => k.rect(x - 300 + i * 50, base - i * 40, 600 - i * 100, 44), '#aab4c4', { line: 6 });
        T.outlined(ctx, (k) => { k.moveTo(x - 140, base - 120); k.lineTo(x - 140, base - 470); k.quadraticCurveTo(x, base - 540, x + 140, base - 470); k.lineTo(x + 140, base - 120); k.closePath(); }, '#d8dce4', { line: 7, shade: (k) => { k.fillStyle = '#b8bfcc'; k.fillRect(x + 60, base - 540, 90, 420); } });
        T.outlined(ctx, (k) => k.rect(x - 180, base - 200, 360, 80), '#c8ccd6', { line: 7 });
      }
      if (bg.column !== false) T.outlined(ctx, (k) => { k.moveTo(W * 0.15 - 60, H * 0.7); k.lineTo(W * 0.15 - 60, H * 0.36); k.lineTo(W * 0.15 - 10, H * 0.32); k.lineTo(W * 0.15 + 20, H * 0.38); k.lineTo(W * 0.15 + 60, H * 0.34); k.lineTo(W * 0.15 + 60, H * 0.7); k.closePath(); }, '#eef0f4', { line: 7 });
    });
    cam(ctx, env, 1, () => {
      const r = T.rng(T.hash('olycloud'));
      for (let i = 0; i < 14; i++) { const x = -OV + (i / 13) * (W + OV * 2), y = H * 0.74 + r() * 50, rr = 110 + r() * 70; T.outlined(ctx, (k) => k.arc(x + Math.sin(lt * 0.4 + i) * 6, y, rr, 0, Math.PI * 2), '#ffffff', { line: 6, ink: '#9fb4d0', shade: (k) => { k.fillStyle = '#dbe8f6'; k.beginPath(); k.arc(x, y + rr * 0.5, rr, 0, Math.PI * 2); k.fill(); } }); }
      ctx.fillStyle = '#ffffff'; ctx.fillRect(-OV, H * 0.82, W + OV * 2, H);
    });
  };

  // Chalkboard on a wall, with progressive chalk lines: bg.lines: [{ text, at, size }]
  T.bgs.chalkboard = (ctx, bg, lt, env) => {
    cam(ctx, env, 0.9, () => {
      ctx.fillStyle = bg.wall ?? '#d8c8a0'; ctx.fillRect(-OV, -OV, W + OV * 2, H + OV * 2);
      T.outlined(ctx, (k) => k.rect(W * 0.08, H * 0.08, W * 0.84, H * 0.7), '#7a5232', { line: 8 });
      ctx.fillStyle = bg.board ?? '#3c4a3a'; ctx.fillRect(W * 0.1, H * 0.11, W * 0.8, H * 0.64);
      ctx.fillStyle = 'rgba(255,255,255,0.05)'; for (let i = 0; i < 12; i++) ctx.fillRect(W * 0.1 + i * 130, H * 0.11, 60, H * 0.64);
      ctx.fillStyle = '#f2f2e8'; ctx.font = T.font(64, 800); ctx.textAlign = 'left';
      (bg.lines || []).forEach((ln, i) => { const p = T.prog(lt, ln.at ?? i * 0.6, 0.4); if (p <= 0) return; ctx.save(); ctx.globalAlpha *= p; ctx.font = T.font(ln.size ?? 64, 800); ctx.fillText(ln.text.slice(0, Math.ceil(ln.text.length * p)), W * 0.14, H * 0.22 + i * (ln.size ?? 64) * 1.4); ctx.restore(); });
      T.outlined(ctx, (k) => k.rect(W * 0.08, H * 0.76, W * 0.84, 26), '#6b4426', { line: 6 });
      ctx.fillStyle = bg.floor ?? '#8a6a45'; ctx.fillRect(-OV, H * 0.86, W + OV * 2, H);
    });
  };
})();
