// places-rooms.js — backgrounds: `room` interiors (gamer, living, bedroom, hospital, parlour), top-down `floor`,
// `cell` dungeon, `harbor` pier, night `alley`, `antique` sets (colonnade, balcony, temple-square, bath),
// `parchment-panel`, `corkboard` and `vehicle-interior` with a scrolling window. Helpers come from places-sets.js (T.PLACE).
(function () {
  'use strict';
  const T = window.TOON, W = T.W, H = T.H, TAU = Math.PI * 2, DEG = Math.PI / 180;
  const { OV, BINK, DET, step2, cam, full, vgrad, rgba, glow, vignette, wedge, soft, ol, variantOf, seedOf, flick, perspFloor, tongues, textBlock, screenContent } = T.PLACE;

  // ---------- shared interior pieces ----------
  // Window view: sky by `kind` (day | dusk | night | garden | sunset); `cycle` alternates day and night every second
  // (22 frames hold + 8 frames crossfade) for "night after night".
  function skyIn(ctx, x, y, w, h, kind, lt) {
    const S = { day: ['#7ac0ec', '#cfeaf6'], garden: ['#8ccaf0', '#dff0f6'], dusk: ['#3a3a7a', '#e88a6a'], sunset: ['#d85a6a', '#f6d27a'], night: ['#0a1030', '#2a3a6a'] }[kind] || ['#7ac0ec', '#cfeaf6'];
    ctx.fillStyle = vgrad(ctx, y, y + h, S); ctx.fillRect(x, y, w, h);
    if (kind === 'night') { ctx.fillStyle = '#fff6d0'; ctx.beginPath(); ctx.arc(x + w * 0.7, y + h * 0.3, h * 0.12, 0, TAU); ctx.fill(); ctx.fillStyle = S[0]; ctx.beginPath(); ctx.arc(x + w * 0.7 + h * 0.05, y + h * 0.27, h * 0.11, 0, TAU); ctx.fill(); }
    else { glow(ctx, x + w * 0.3, y + h * 0.35, h * 0.4, '#fff8d0', 0.8); ctx.fillStyle = '#fff4c0'; ctx.beginPath(); ctx.arc(x + w * 0.3, y + h * 0.35, h * 0.08, 0, TAU); ctx.fill(); }
    ctx.fillStyle = kind === 'night' ? '#1a2a3a' : kind === 'garden' ? '#5a9a4a' : T.mix(S[1], '#4a6a3a', 0.6);
    ctx.beginPath(); ctx.moveTo(x, y + h); ctx.quadraticCurveTo(x + w * 0.3, y + h * 0.62, x + w * 0.6, y + h * 0.8); ctx.quadraticCurveTo(x + w * 0.85, y + h * 0.66, x + w, y + h * 0.75); ctx.lineTo(x + w, y + h); ctx.fill();
    if (kind === 'garden') for (let i = 0; i < 4; i++) T.drawTree(ctx, x + w * (0.15 + i * 0.25), y + h, h * 0.55, 'gw' + i);
  }
  function windowView(ctx, x, y, w, h, kind, lt, o = {}) {
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    if (o.cycle) {
      const per = 1, ph = lt % per, idx = Math.floor(lt / per) % 2, fade = T.clamp((ph - 22 / 30) / (8 / 30));
      skyIn(ctx, x, y, w, h, idx ? 'night' : 'day', lt);
      if (fade > 0) { ctx.globalAlpha = fade; skyIn(ctx, x, y, w, h, idx ? 'day' : 'night', lt); ctx.globalAlpha = 1; }
    } else skyIn(ctx, x, y, w, h, kind, lt);
    ctx.restore();
    ol(ctx, (k) => k.rect(x, y, w, h), null, { line: 14, ink: o.frame ?? '#5a3a22' });
    ctx.strokeStyle = o.frame ?? '#5a3a22'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + h); ctx.moveTo(x, y + h * 0.45); ctx.lineTo(x + w, y + h * 0.45); ctx.stroke();
  }
  function crt(ctx, x, y, w, h, bg, lt, env, seed) {
    ol(ctx, (k) => T.rrect(k, x - 30, y - 30, w + 60, h + 60, 26), '#4a4450', { line: 6, shade: (k) => { k.fillStyle = '#35303a'; k.fillRect(x + w * 0.7, y - 40, w, h + 80); } });
    ctx.save(); ctx.beginPath(); T.rrect(ctx, x, y, w, h, 20); ctx.clip();
    if (!screenContent(ctx, bg.screen, x, y, w, h, lt, env, { color: '#e8f8ff' })) { ctx.fillStyle = vgrad(ctx, y, y + h, ['#4a8ac8', '#2a4a8a']); ctx.fillRect(x, y, w, h); }
    ctx.fillStyle = 'rgba(0,0,0,0.06)'; for (let sy = y; sy < y + h; sy += 6) ctx.fillRect(x, sy, w, 3);
    ctx.fillStyle = `rgba(255,255,255,${0.06 + 0.05 * T.noise(step2(lt), seed)})`; ctx.fillRect(x, y, w, h);
    ctx.restore();
    ol(ctx, (k) => T.rrect(k, x, y, w, h, 20), null, { line: 5 });
    glow(ctx, x + w / 2, y + h / 2, w * 1.1 * flick(lt, seed, 0.05), '#8ac8ff', 0.18);
  }
  function lamp(ctx, x, y, on, shade = '#f6e2a0') {
    if (on > 0) glow(ctx, x, y - 70, 380, '#ffd890', 0.4 * on);
    ol(ctx, (k) => k.rect(x - 6, y - 60, 12, 60), '#3a2a20', { line: 3 });
    ol(ctx, (k) => { k.moveTo(x - 70, y - 60); k.lineTo(x - 44, y - 150); k.lineTo(x + 44, y - 150); k.lineTo(x + 70, y - 60); k.closePath(); }, on > 0.5 ? shade : T.shade(shade, -0.45), { line: 4 });
  }
  function fireplace(ctx, x, y, lt, seed, stone = '#a89a8a') {
    ol(ctx, (k) => k.rect(x - 200, y - 330, 400, 330), stone, { line: 5, shade: (k) => { k.strokeStyle = rgba(DET, 0.4); k.lineWidth = 2; for (let yy = y - 300; yy < y; yy += 40) { k.beginPath(); k.moveTo(x - 200, yy); k.lineTo(x + 200, yy); k.stroke(); } } });
    ol(ctx, (k) => k.rect(x - 230, y - 360, 460, 36), T.shade(stone, -0.2), { line: 5 });
    ol(ctx, (k) => { k.moveTo(x - 120, y); k.lineTo(x - 120, y - 170); k.arc(x, y - 170, 120, Math.PI, 0); k.lineTo(x + 120, y); k.closePath(); }, '#1a1210', { line: 5 });
    glow(ctx, x, y - 60, 340 * flick(lt, seed), '#ffa040', 0.45);
    ctx.save(); ctx.translate(x, y - 14); T.drawFlame(ctx, 150, lt, seed + 'f'); ctx.restore();
  }
  // Light-switch dim: lampsOff [t...] darkens the room 40 % over 4 frames per lamp.
  const dimAt = (offs, lt) => (offs || []).reduce((d, t) => d + 0.4 * T.prog(lt, t, 4 / 30), 0);

  // ---------- room ----------
  const ROOM = {}, ROOM_FRONT = {};
  ROOM.gamer = (ctx, bg, lt, env, seed) => {
    cam(ctx, env, 0.6, () => {
      full(ctx, '#2a2560'); ctx.fillStyle = vgrad(ctx, 0, H, ['rgba(0,0,0,0.2)', 'rgba(0,0,0,0)']); ctx.fillRect(-OV, -OV, W + OV * 2, H + OV * 2);
      const r = T.rng(T.hash(seed + 'post'));
      for (const [px, py] of [[0.1, 0.16], [0.3, 0.1], [0.82, 0.14]]) {
        ctx.save(); ctx.translate(px * W, py * H); ctx.rotate((r() - 0.5) * 0.16);
        ol(ctx, (k) => k.rect(0, 0, 200, 270), ['#e8562a', '#f7d04a', '#4ac8a8'][Math.floor(r() * 3)], { line: 4 });
        ctx.fillStyle = 'rgba(30,20,40,0.75)'; ctx.fillRect(20, 30, 160, 34); ctx.fillRect(20, 80, 110, 20); ctx.beginPath(); ctx.arc(100, 180, 50, 0, TAU); ctx.fill();
        ctx.restore();
      }
      if (bg.neon) { const s = String(bg.neon), fs = T.fitSize(ctx, s, 120, W * 0.5); glow(ctx, W * 0.5, H * 0.14, 520, '#c040ff', 0.4 * flick(lt, seed + 'n', 0.06)); ctx.save(); ctx.font = T.font(fs, 900); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 14; ctx.strokeStyle = 'rgba(192,64,255,0.5)'; ctx.strokeText(s, W / 2, H * 0.14); ctx.fillStyle = '#f6d0ff'; ctx.fillText(s, W / 2, H * 0.14); ctx.restore(); }
      T.curtain(ctx, W * 0.9, W + OV, -OV, H * 0.8, '#a8242a', lt, seed + 'cur');
      ctx.fillStyle = '#3a2a4a'; ctx.fillRect(-OV, H * 0.78, W + OV * 2, H);
      if (bg.lamp !== false) { ol(ctx, (k) => k.rect(W * 0.12 - 6, H * 0.35, 12, H * 0.45), '#2a2a2a', { line: 3 }); lamp(ctx, W * 0.12, H * 0.38, 1); wedge(ctx, W * 0.06, 220, H, '#ffd890', 0.12, 0.2); }
    });
    cam(ctx, env, 1, () => {
      if (bg.tv !== false) {
        ol(ctx, (k) => k.rect(W * 0.4, H * 0.66, 440, 220), '#5a3a2a', { line: 5, shade: (k) => { k.fillStyle = '#3a2418'; k.fillRect(W * 0.4 + 300, H * 0.66, 200, 240); } });
        crt(ctx, W * 0.4 + 60, H * 0.36, 320, 230, bg, lt, env, seed + 'tv');
        ol(ctx, (k) => T.rrect(k, W * 0.4 + 120, H * 0.62, 200, 42, 8), '#6a3a9a', { line: 4 });
      }
      for (const [bx, c] of [[0.2, '#7a3a7a'], [0.78, '#5a3a8a']]) ol(ctx, (k) => k.ellipse(bx * W, H * 0.88, 200, 110, 0, 0, TAU), c, { line: 6, shade: (k) => { k.fillStyle = T.shade(c, -0.22); k.fillRect(bx * W - 200, H * 0.9, 400, 200); k.fillStyle = rgba('#ffffff', 0.15); k.beginPath(); k.ellipse(bx * W - 60, H * 0.84, 70, 30, -0.3, 0, TAU); k.fill(); } });
    });
  };
  ROOM.living = (ctx, bg, lt, env, seed) => {
    cam(ctx, env, 0.6, () => {
      T.planks(ctx, -OV, -OV, W + OV, H * 0.74, bg.wall ?? '#9a6a42', true, 90);
      ctx.fillStyle = '#6a4a2a'; ctx.fillRect(-OV, H * 0.72, W + OV * 2, H);
      ol(ctx, (k) => { k.ellipse(W * 0.5, H * 0.9, W * 0.42, 120, 0, 0, TAU); }, '#8d2d2a', { line: 4, shade: (k) => { k.strokeStyle = '#d8a040'; k.lineWidth = 6; k.beginPath(); k.ellipse(W * 0.5, H * 0.9, W * 0.38, 100, 0, 0, TAU); k.stroke(); } });
      if (bg.window !== false) windowView(ctx, W * 0.08, H * 0.12, 300, 340, bg.window ?? 'dusk', lt, { cycle: bg.cycle });
      fireplace(ctx, W * 0.78, H * 0.74, lt, seed + 'fp');
      if (bg.tv !== false) { ol(ctx, (k) => k.rect(W * 0.36, H * 0.58, 460, 140), '#7a4e2a', { line: 5 }); crt(ctx, W * 0.36 + 80, H * 0.3, 300, 210, bg, lt, env, seed + 'tv'); }
      wedge(ctx, W * 0.12, 200, H, '#fff4d0', 0.08);
    });
  };
  ROOM_FRONT.living = (ctx, bg, lt, env) => {
    cam(ctx, env, 1.3, () => {
      if (bg.sofa !== false) ol(ctx, (k) => { k.moveTo(-OV, H + OV); k.lineTo(-OV, H * 0.9); k.quadraticCurveTo(W * 0.3, H * 0.8, W * 0.62, H * 0.9); k.lineTo(W * 0.62, H + OV); k.closePath(); }, '#5a7a4a', { line: 7, shade: (k) => { k.fillStyle = '#466238'; k.fillRect(-OV, H * 0.95, W, H); } });
    });
  };
  ROOM.bedroom = (ctx, bg, lt, env) => {
    const dim = dimAt(bg.lampsOff, lt), offs = bg.lampsOff || [];
    cam(ctx, env, 0.6, () => {
      full(ctx, '#7a7088'); ctx.fillStyle = '#5a4a5a'; ctx.fillRect(-OV, H * 0.46, W + OV * 2, 20);
      ctx.strokeStyle = 'rgba(40,30,50,0.25)'; ctx.lineWidth = 3; for (let x = -OV; x < W + OV; x += 36) { ctx.beginPath(); ctx.moveTo(x, H * 0.47); ctx.lineTo(x, H); ctx.stroke(); }
      ol(ctx, (k) => k.rect(W * 0.04, H * 0.18, 240, H * 0.62), '#3a2a2a', { line: 5, shade: (k) => { k.fillStyle = '#d8b040'; k.beginPath(); k.arc(W * 0.04 + 200, H * 0.52, 12, 0, TAU); k.fill(); } });
      windowView(ctx, W * 0.78, H * 0.12, 280, 300, bg.window ?? 'night', lt, { cycle: bg.cycle });
      ctx.fillStyle = '#4a4050'; ctx.fillRect(-OV, H * 0.8, W + OV * 2, H);
    });
    cam(ctx, env, 1, () => {
      ol(ctx, (k) => { k.moveTo(W * 0.3, H * 0.54); k.quadraticCurveTo(W * 0.3, H * 0.3, W * 0.5, H * 0.3); k.quadraticCurveTo(W * 0.7, H * 0.3, W * 0.7, H * 0.54); k.closePath(); }, '#5a3a2a', { line: 6 });
      ol(ctx, (k) => T.rrect(k, W * 0.27, H * 0.52, W * 0.46, H * 0.4, 30), '#7a3a6a', { line: 6, shade: (k) => { k.fillStyle = '#5e2a52'; k.fillRect(W * 0.27, H * 0.78, W, H); k.strokeStyle = 'rgba(40,10,40,0.4)'; k.lineWidth = 4; for (let i = 0; i < 4; i++) { k.beginPath(); k.moveTo(W * (0.3 + i * 0.12), H * 0.56); k.quadraticCurveTo(W * (0.33 + i * 0.12), H * 0.7, W * (0.3 + i * 0.12), H * 0.9); k.stroke(); } } });
      for (const [i, d] of [[0, 0.18], [1, 0.82]]) {
        ol(ctx, (k) => k.rect(d * W - 110, H * 0.6, 220, 200), '#5a3a2a', { line: 5 });
        lamp(ctx, d * W, H * 0.6, offs[i] != null && lt >= offs[i] ? 0 : 1);
      }
    });
    if (dim > 0) { ctx.fillStyle = `rgba(10,10,30,${Math.min(0.8, dim)})`; ctx.fillRect(-OV, -OV, W + OV * 2, H + OV * 2); }
  };
  ROOM_FRONT.bedroom = (ctx, bg, lt, env) => { // quilt pulled over figures sitting up in bed (opt-in: quilt: true)
    if (!bg.quilt) return;
    cam(ctx, env, 1, () => ol(ctx, (k) => T.rrect(k, W * 0.27, H * 0.7, W * 0.46, H * 0.22, 30), '#7a3a6a', { line: 6, shade: (k) => { k.fillStyle = '#5e2a52'; k.fillRect(W * 0.27, H * 0.82, W, H); k.fillStyle = '#f4ecf0'; k.fillRect(W * 0.27, H * 0.7, W * 0.46, 30); } }));
    const dim = dimAt(bg.lampsOff, lt); if (dim > 0) cam(ctx, env, 1, () => { ctx.fillStyle = `rgba(10,10,30,${Math.min(0.8, dim)})`; ctx.beginPath(); T.rrect(ctx, W * 0.27 - 4, H * 0.7 - 4, W * 0.46 + 8, H * 0.22 + 8, 32); ctx.fill(); });
  };
  ROOM.hospital = (ctx, bg, lt, env, seed) => {
    cam(ctx, env, 0.6, () => {
      full(ctx, '#9aaab8'); ctx.fillStyle = '#7a8a9a'; ctx.fillRect(-OV, H * 0.62, W + OV * 2, H);
      windowView(ctx, W * 0.5, H * 0.08, 520, 420, 'garden', lt, { frame: '#dfe6ea', cycle: bg.cycle });
      for (const d of [-1, 1]) T.curtain(ctx, W * 0.5 + (d < 0 ? -110 : 520 - 30), W * 0.5 + (d < 0 ? 30 : 630), H * 0.04, H * 0.62, '#f4f6f8', lt, seed + d);
      wedge(ctx, W * 0.4, 260, H, '#ffffff', 0.08, -0.4);
    });
    cam(ctx, env, 1, () => {
      if (bg.bed !== false) { ol(ctx, (k) => k.rect(W * 0.3, H * 0.5, 22, H * 0.4), '#c8d0d6', { line: 4 }); ol(ctx, (k) => T.rrect(k, W * 0.31, H * 0.6, 300, 170, 50), '#f4f6f8', { line: 6 }); }
      if (bg.iv !== false) { // IV stand: pole on a wheeled base, hook bar, a half-full bag and a tube looping toward the bed
        const ix = W * 0.08, top = H * 0.2;
        ol(ctx, (k) => k.rect(ix - 7, top, 14, H * 0.72), '#b8c0c6', { line: 3 });
        ol(ctx, (k) => { k.moveTo(ix - 70, H * 0.93); k.lineTo(ix + 70, H * 0.93); k.lineTo(ix + 50, H * 0.9); k.lineTo(ix - 50, H * 0.9); k.closePath(); }, '#8a9298', { line: 3 });
        ol(ctx, (k) => k.rect(ix - 60, top - 8, 120, 12), '#b8c0c6', { line: 3 });
        ol(ctx, (k) => T.rrect(k, ix + 10, top + 10, 90, 140, 22), 'rgba(236,246,250,0.95)', { line: 4, shade: (k) => { k.fillStyle = '#e8c860'; k.fillRect(ix + 10, top + 70, 90, 90); k.fillStyle = '#ffffff'; k.fillRect(ix + 28, top + 84, 54, 30); } });
        ctx.fillStyle = '#c84a3a'; ctx.fillRect(ix + 44, top + 92, 22, 6); ctx.fillRect(ix + 52, top + 84, 6, 22); // red cross label
        ctx.strokeStyle = 'rgba(200,220,230,0.95)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(ix + 55, top + 150); ctx.bezierCurveTo(ix + 60, H * 0.6, ix + 200, H * 0.45, W * 0.3, H * 0.62); ctx.stroke();
        ctx.strokeStyle = BINK; ctx.lineWidth = 2; ctx.stroke();
      }
      if (bg.monitor !== false) {
        const mx = W * 0.18; ol(ctx, (k) => k.rect(mx - 8, H * 0.5, 16, H * 0.4), '#8a9298', { line: 3 });
        ol(ctx, (k) => T.rrect(k, mx - 120, H * 0.3, 240, 170, 14), '#c8d0d6', { line: 5 }); ctx.fillStyle = '#10241c'; ctx.fillRect(mx - 100, H * 0.32, 200, 130);
        ctx.strokeStyle = '#4af08a'; ctx.lineWidth = 4; ctx.beginPath();
        for (let i = 0; i <= 40; i++) { const u = (i / 40 + lt * 0.8) % 1, beat = u > 0.45 && u < 0.55 ? Math.sin((u - 0.45) * 10 * TAU) * 40 : 0; i ? ctx.lineTo(mx - 100 + i * 5, H * 0.32 + 65 - beat) : ctx.moveTo(mx - 100, H * 0.32 + 65); }
        ctx.stroke();
      }
    });
  };
  ROOM_FRONT.hospital = (ctx, bg, lt, env) => {
    if (bg.bed === false) return;
    cam(ctx, env, 1.3, () => {
      ol(ctx, (k) => T.rrect(k, W * 0.36, H * 0.74, W * 0.7, 400, 40), '#3a6aa8', { line: 7, shade: (k) => { k.fillStyle = '#2a5088'; k.fillRect(W * 0.36, H * 0.86, W, H); } });
    });
  };
  ROOM.parlour = (ctx, bg, lt, env, seed) => {
    const wear = T.clamp(bg.wear ?? 0);
    cam(ctx, env, 0.6, () => {
      full(ctx, '#d9cdb0');
      ctx.strokeStyle = 'rgba(140,110,70,0.25)'; ctx.lineWidth = 10; for (let x = -OV; x < W + OV; x += 60) { ctx.beginPath(); ctx.moveTo(x, -OV); ctx.lineTo(x, H * 0.55); ctx.stroke(); }
      ol(ctx, (k) => k.rect(-OV, H * 0.55, W + OV * 2, H * 0.22), '#8a6a44', { line: 4, shade: (k) => { k.strokeStyle = rgba(DET, 0.5); k.lineWidth = 3; for (let x = -OV + 40; x < W + OV; x += 220) k.strokeRect(x, H * 0.58, 180, H * 0.15); } });
      const r = T.rng(T.hash(seed + 'wear'));
      for (let i = 0; i < Math.round(wear * 14); i++) { const x = r() * W, y = r() * H * 0.5; ctx.fillStyle = 'rgba(120,96,60,0.35)'; ctx.beginPath(); T.smoothPath(ctx, T.blobPts(x, y, 40 + r() * 60, 30 + r() * 50, seed + 'w' + i, 10, 0.35)); ctx.fill(); }
      glow(ctx, W * 0.16, H * 0.3, 520, '#ffe0a0', 0.4);
      windowView(ctx, W * 0.08, H * 0.08, 260, 420, bg.window ?? 'sunset', lt, { cycle: bg.cycle });
      T.curtain(ctx, W * 0.08 - 70, W * 0.08 + 40, -40, H * 0.66, '#8a3a2a', lt, seed + 'c1'); T.curtain(ctx, W * 0.08 + 220, W * 0.08 + 330, -40, H * 0.66, '#8a3a2a', lt, seed + 'c2');
      ol(ctx, (k) => k.ellipse(W * 0.5, H * 0.3, 130, 170, 0, 0, TAU), '#c8a040', { line: 5 }); ol(ctx, (k) => k.ellipse(W * 0.5, H * 0.3, 104, 144, 0, 0, TAU), '#b8c8cc', { line: 3, shade: (k) => { k.fillStyle = 'rgba(255,255,255,0.4)'; k.fillRect(W * 0.5 - 70, H * 0.1, 30, 300); } });
      fireplace(ctx, W * 0.8, H * 0.8, lt, seed + 'fp', '#b8a890');
      wedge(ctx, W * 0.2, 240, H, '#fff4d0', 0.1, 0.4);
    });
    cam(ctx, env, 1, () => {
      T.planks(ctx, -OV, H * 0.8, W + OV, H + OV, '#8a5a32', false, 60);
      ol(ctx, (k) => k.rect(W * 0.38, H * 0.58, 480, 240), '#6e4424', { line: 5, shade: (k) => { k.strokeStyle = rgba(DET, 0.7); k.lineWidth = 3; for (let i = 1; i < 3; i++) { k.beginPath(); k.moveTo(W * 0.38, H * 0.58 + i * 80); k.lineTo(W * 0.38 + 480, H * 0.58 + i * 80); k.stroke(); } } });
      const cx = W * 0.38 + 380; glow(ctx, cx, H * 0.5, 200 * flick(lt, seed + 'cd'), '#ffd070', 0.5);
      ol(ctx, (k) => k.rect(cx - 12, H * 0.5, 24, 60), '#f4ecd8', { line: 3 }); ctx.save(); ctx.translate(cx, H * 0.5); T.drawFlame(ctx, 34, lt, seed + 'cf'); ctx.restore();
    });
  };
  T.ROOM = ROOM;
  T.bgs.room = (ctx, bg, lt, env) => {
    const v = variantOf(bg, Object.keys(ROOM), 'gamer', 'room');
    ROOM[v](ctx, bg, lt, env, seedOf(env, 'room', bg));
    vignette(ctx, bg.vignette ?? 0.35);
    if (ROOM_FRONT[v]) ROOM_FRONT[v](ctx, bg, lt, env);
  };
  T.BG_FRONT.room = (ctx, bg, lt, env) => { const f = ROOM_FRONT[bg.variant ?? 'gamer']; if (f) f(ctx, bg, lt, env); };

  // ---------- floor (top-down) ----------
  const R = 760; // half-extent covering any rotation of the frame
  const FLOOR = {
    planks: (ctx, bg, r) => { for (let y = -R, i = 0; y < H + R; y += 90, i++) { ctx.fillStyle = T.mix('#b8744a', i % 2 ? '#a8663e' : '#c4805a', 0.5 + r() * 0.3); ctx.fillRect(-R, y, W + R * 2, 90); ctx.strokeStyle = '#7d4a2b'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-R, y); ctx.lineTo(W + R, y); for (let x = -R + (i % 3) * 140; x < W + R; x += 420) { ctx.moveTo(x, y); ctx.lineTo(x, y + 90); } ctx.stroke(); ctx.strokeStyle = 'rgba(90,50,20,0.2)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-R, y + 30 + r() * 30); ctx.bezierCurveTo(0, y + 20, W, y + 70, W + R, y + 40); ctx.stroke(); } },
    tiles: (ctx, bg) => { const [a, b] = bg.colors ?? ['#e8e0cc', '#8a6a4a'], s = bg.tile ?? 120; for (let y = -R; y < H + R; y += s) for (let x = -R; x < W + R; x += s) { ctx.fillStyle = (Math.round((x + R) / s) + Math.round((y + R) / s)) % 2 ? a : b; ctx.fillRect(x, y, s, s); } ctx.strokeStyle = rgba(DET, 0.4); ctx.lineWidth = 2; for (let x = -R; x < W + R; x += s) { ctx.beginPath(); ctx.moveTo(x, -R); ctx.lineTo(x, H + R); ctx.stroke(); } },
    rug: (ctx, bg, r) => { FLOOR.planks(ctx, bg, r); rugRect(ctx, W * 0.15, H * 0.12, W * 0.7, H * 0.76, '#8d2d2a'); },
    grass: (ctx, bg, r) => { for (let x = -R, i = 0; x < W + R; x += 80, i++) { ctx.fillStyle = i % 2 ? '#7a9a3a' : '#6a8a32'; ctx.fillRect(x, -R, 80, H + R * 2); } ctx.strokeStyle = 'rgba(40,70,20,0.35)'; ctx.lineWidth = 3; for (let i = 0; i < 260; i++) { const x = r() * (W + R) - R / 2, y = r() * (H + R) - R / 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 4, y - 14); ctx.moveTo(x + 6, y); ctx.lineTo(x + 8, y - 12); ctx.stroke(); } },
    flowers: (ctx, bg, r) => { ctx.fillStyle = '#4a7a3a'; ctx.fillRect(-R, -R, W + R * 2, H + R * 2); const cols = bg.colors ?? ['#f2c230', '#e86f8a', '#9ad3f0', '#f4f0e6']; for (let i = 0; i < 420; i++) { const x = r() * (W + R * 1.2) - R * 0.6, y = r() * (H + R * 1.2) - R * 0.6, s = 18 + r() * 26, c = cols[Math.floor(r() * cols.length)], a = r() * TAU; ctx.fillStyle = '#3a6a2a'; ctx.beginPath(); ctx.ellipse(x + s, y + s * 0.4, s * 0.9, s * 0.35, a, 0, TAU); ctx.fill(); for (let p = 0; p < 6; p++) { const pa = a + (p / 6) * TAU; ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x + Math.cos(pa) * s * 0.55, y + Math.sin(pa) * s * 0.55, s * 0.5, s * 0.26, pa, 0, TAU); ctx.fill(); ctx.strokeStyle = rgba(T.shade(c, -0.4), 0.6); ctx.lineWidth = 2; ctx.stroke(); } ctx.fillStyle = '#8a4a1a'; ctx.beginPath(); ctx.arc(x, y, s * 0.24, 0, TAU); ctx.fill(); } },
    dirt: (ctx, bg, r) => { ctx.fillStyle = '#8a6a48'; ctx.fillRect(-R, -R, W + R * 2, H + R * 2); for (let i = 0; i < 220; i++) { const x = r() * (W + R) - R / 2, y = r() * (H + R) - R / 2; ctx.fillStyle = r() > 0.5 ? '#6e5236' : '#a8865e'; ctx.beginPath(); ctx.ellipse(x, y, 5 + r() * 12, 4 + r() * 8, r() * 3, 0, TAU); ctx.fill(); } if (bg.pit !== false) { const [px, py] = bg.pit ?? [0.5, 0.5]; ol(ctx, (k) => k.ellipse(px * W, py * H, 260, 170, 0, 0, TAU), '#5a3e26', { line: 5 }); ol(ctx, (k) => k.ellipse(px * W + 14, py * H + 14, 210, 130, 0, 0, TAU), '#2a1a10', { line: 0 }); } },
    coffers: (ctx) => { // flat-top hex grid: columns 1.5 r apart, odd columns shifted half a row
      const rr = 110, dy = Math.sqrt(3) * rr; ctx.fillStyle = '#7a3418'; ctx.fillRect(-R, -R, W + R * 2, H + R * 2);
      for (let col = 0, x = -R; x < W + R; x += 1.5 * rr, col++) for (let y = -R + (col % 2) * dy / 2; y < H + R; y += dy) {
        const hex = (k, q, ox = 0, oy = 0) => { k.beginPath(); for (let i = 0; i < 6; i++) k.lineTo(x + ox + Math.cos(i * Math.PI / 3) * q, y + oy + Math.sin(i * Math.PI / 3) * q); k.closePath(); };
        ctx.fillStyle = '#a8441f'; hex(ctx, rr * 0.8); ctx.fill(); ctx.fillStyle = '#c8562d'; hex(ctx, rr * 0.66, 4, 5); ctx.fill(); ctx.fillStyle = '#d87a4a'; hex(ctx, rr * 0.4, 6, 8); ctx.fill();
        ctx.strokeStyle = rgba('#3a1408', 0.6); ctx.lineWidth = 2.5; hex(ctx, rr * 0.8); ctx.stroke();
      } },
    water: (ctx, bg, r, lt) => { const g = ctx.createLinearGradient(0, -R, W, H + R); g.addColorStop(0, '#0e3a48'); g.addColorStop(0.5, '#1fb3a3'); g.addColorStop(1, '#0e5a60'); ctx.fillStyle = g; ctx.fillRect(-R, -R, W + R * 2, H + R * 2); ctx.lineCap = 'round'; for (let i = 0; i < 140; i++) { const x0 = r() * (W + R * 2) - R, y = r() * (H + R * 2) - R, len = 60 + r() * 160, x = ((x0 + lt * 15 + R) % (W + R * 2)) - R; ctx.strokeStyle = `rgba(200,255,245,${0.18 + r() * 0.2})`; ctx.lineWidth = 6 + r() * 8; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y); ctx.stroke(); }
      for (let i = 0; i < 7; i++) { const cx = r() * W, cy = r() * H, n = 3 + Math.floor(r() * 3), a0 = lt * 0.4 + r() * TAU; for (let j = 1; j <= n; j++) { ctx.strokeStyle = `rgba(200,255,245,${0.28 - j * 0.04})`; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(cx, cy, j * 34, a0 + j, a0 + j + 4.2); ctx.stroke(); } } },
    stone: (ctx, bg, r) => { ctx.fillStyle = '#6a665e'; ctx.fillRect(-R, -R, W + R * 2, H + R * 2); for (let y = -R, row = 0; y < H + R; y += 110, row++) for (let x = -R - (row % 2) * 70; x < W + R;) { const w = 120 + r() * 90; ctx.fillStyle = T.mix('#9a958a', '#b8b2a4', r()); ctx.beginPath(); T.rrect(ctx, x + 5, y + 5, w - 10, 100, 14); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(x + w * 0.6, y + 60, w * 0.35, 40); x += w; } },
  };
  function rugRect(ctx, x, y, w, h, c) {
    ol(ctx, (k) => k.rect(x, y, w, h), c, { line: 5, shade: (k) => { k.strokeStyle = '#e2b23c'; k.lineWidth = 10; k.strokeRect(x + 30, y + 30, w - 60, h - 60); k.strokeStyle = T.shade(c, -0.3); k.lineWidth = 5; k.strokeRect(x + 60, y + 60, w - 120, h - 120); k.fillStyle = '#e2b23c'; k.beginPath(); k.moveTo(x + w / 2, y + h * 0.3); k.lineTo(x + w * 0.6, y + h / 2); k.lineTo(x + w / 2, y + h * 0.7); k.lineTo(x + w * 0.4, y + h / 2); k.closePath(); k.fill(); } });
  }
  const TOPPROPS = {
    bed: (ctx, c) => { ol(ctx, (k) => T.rrect(k, -170, -260, 340, 520, 20), '#6e4424', { line: 5 }); ol(ctx, (k) => T.rrect(k, -150, -240, 300, 120, 30), '#f4f0e6', { line: 4 }); ol(ctx, (k) => T.rrect(k, -160, -100, 320, 350, 20), c ?? '#5a7ab8', { line: 5, shade: (k) => { k.strokeStyle = rgba('#1a2a4a', 0.35); k.lineWidth = 4; for (let i = 0; i < 4; i++) { k.beginPath(); k.moveTo(-150, -40 + i * 80); k.quadraticCurveTo(0, -10 + i * 80, 150, -40 + i * 80); k.stroke(); } } }); },
    chair: (ctx, c) => { // seen from above: leg nubs, cushioned seat, curved spindle back, armrests
      const f = c ?? '#8a5a32';
      for (const [x, y] of [[-78, -78], [78, -78], [-78, 78], [78, 78]]) ol(ctx, (k) => k.arc(x, y, 14, 0, TAU), T.shade(f, -0.35), { line: 4 });
      ol(ctx, (k) => T.rrect(k, -80, -80, 160, 160, 22), f, { line: 5, shade: (k) => { k.fillStyle = T.shade(f, -0.2); k.fillRect(30, -80, 60, 170); } });
      ol(ctx, (k) => T.rrect(k, -56, -50, 112, 112, 26), '#b8423a', { line: 4, shade: (k) => { k.fillStyle = '#962f2a'; k.fillRect(-56, 20, 112, 50); } });
      ctx.fillStyle = BINK; ctx.beginPath(); ctx.arc(0, 6, 6, 0, TAU); ctx.fill();
      ol(ctx, (k) => { k.moveTo(-96, -80); k.quadraticCurveTo(0, -150, 96, -80); k.lineTo(80, -64); k.quadraticCurveTo(0, -122, -80, -64); k.closePath(); }, T.shade(f, -0.1), { line: 5 });
      for (const sx of [-1, 1]) ol(ctx, (k) => T.rrect(k, sx * 92 - 14, -60, 28, 130, 12), T.shade(f, -0.15), { line: 4 });
    },
    table: (ctx, c) => { ol(ctx, (k) => T.rrect(k, -220, -140, 440, 280, 16), c ?? '#9a6a3a', { line: 6, shade: (k) => { k.strokeStyle = 'rgba(80,40,20,0.3)'; k.lineWidth = 3; for (let y = -100; y < 140; y += 40) { k.beginPath(); k.moveTo(-220, y); k.lineTo(220, y); k.stroke(); } } }); for (const [x, y, a] of [[-90, -30, -0.2], [60, 20, 0.15]]) { ctx.save(); ctx.translate(x, y); ctx.rotate(a); ol(ctx, (k) => k.rect(-60, -80, 120, 160), '#f4f0e6', { line: 3 }); ctx.fillStyle = 'rgba(60,40,30,0.5)'; for (let i = 0; i < 5; i++) ctx.fillRect(-44, -60 + i * 26, 70 + (i % 2) * 18, 6); ctx.restore(); } },
    box: (ctx, c) => { // open cardboard box from above: dark inside, folded flaps, a few belongings showing
      const f = c ?? '#c8925a';
      ol(ctx, (k) => k.rect(-110, -110, 220, 220), T.shade(f, -0.45), { line: 5 });
      ol(ctx, (k) => T.rrect(k, -80, -70, 90, 120, 8), '#e8e0cc', { line: 3, shade: (k) => { k.fillStyle = '#5a7ab8'; k.fillRect(-80, -70, 18, 120); } }); // book
      ol(ctx, (k) => k.arc(45, 30, 42, 0, TAU), '#d8a03a', { line: 3, shade: (k) => { k.fillStyle = '#b8802a'; k.fillRect(45, 0, 60, 80); } }); // ball of yarn / bread
      ol(ctx, (k) => T.rrect(k, 10, -90, 80, 50, 10), '#7a9a5a', { line: 3 }); // folded cloth
      for (const [a, b, cc, d] of [[-110, -110, 220, -70], [-110, 110, 220, 70]]) ol(ctx, (k) => { k.moveTo(a, b); k.lineTo(a + cc, b); k.lineTo(a + cc - 20, b + d); k.lineTo(a + 20, b + d); k.closePath(); }, f, { line: 4 });
      for (const sx of [-1, 1]) ol(ctx, (k) => { k.moveTo(sx * 110, -110); k.lineTo(sx * 160, -90); k.lineTo(sx * 160, 90); k.lineTo(sx * 110, 110); k.closePath(); }, T.shade(f, -0.12), { line: 4 });
      ctx.fillStyle = 'rgba(240,230,200,0.7)'; ctx.fillRect(-14, -180, 28, 70); ctx.fillRect(-14, 110, 28, 70); // tape
    },
    rug: (ctx, c) => rugRect(ctx, -300, -200, 600, 400, c ?? '#8d2d2a'),
  };
  T.bgs.floor = (ctx, bg, lt, env) => {
    const mat = bg.material ?? 'planks', seed = seedOf(env, 'floor', bg);
    if (!FLOOR[mat]) throw new Error(`bg floor: unknown material "${mat}" (known: ${Object.keys(FLOOR).join(', ')})`);
    cam(ctx, env, 1, () => {
      ctx.translate(W / 2, H / 2); ctx.rotate(T.num(bg.rot, lt, 0) * DEG); ctx.translate(-W / 2, -H / 2);
      FLOOR[mat](ctx, bg, T.rng(T.hash(seed + mat)), lt);
      for (const p of bg.props || []) {
        const fn = TOPPROPS[p.kind]; if (!fn) throw new Error(`bg floor: unknown prop "${p.kind}" (known: ${Object.keys(TOPPROPS).join(', ')})`);
        ctx.save(); ctx.translate((p.x ?? 0.5) * W, (p.y ?? 0.5) * H); ctx.rotate((p.rot ?? 0) * DEG); ctx.scale(p.scale ?? 1, p.scale ?? 1);
        ctx.save(); ctx.translate(16, 20); ctx.globalAlpha *= 0.28; ctx.filter = 'brightness(0)'; fn(ctx, p.color); ctx.restore(); // drop shadow down-right (light upper-left)
        fn(ctx, p.color); ctx.restore();
      }
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const L of bg.light || []) { // [x, y, w, h, angle]: window patch with a cross of mullions
        const [x, y, w, h, a] = L; ctx.save(); ctx.translate(x * W, y * H); ctx.rotate((a ?? 30) * DEG); ctx.fillStyle = rgba('#fff4d0', 0.3);
        const pw = (w * W) / 2, ph = (h * H) / 2; for (const [ox, oy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) ctx.fillRect(-pw + ox * (pw + 8), -ph + oy * (ph + 8), pw - 8, ph - 8); ctx.restore();
      }
      ctx.restore();
    });
    vignette(ctx, bg.vignette ?? 0.3);
  };

  // ---------- cell (dungeon) ----------
  T.bgs.cell = (ctx, bg, lt, env) => {
    const seed = seedOf(env, 'cell', bg), [wx, wy] = bg.window ?? [0.72, 0.2], floorY = H * (bg.floorY ?? 0.8), warm = bg.cold ? '#c8dcff' : '#ffe0a0';
    cam(ctx, env, 0.8, () => {
      full(ctx, '#151a1e');
      const r = T.rng(T.hash(seed + 'blk'));
      for (let y = -OV, row = 0; y < floorY; y += 62, row++) for (let x = -OV - (row % 2) * 60; x < W + OV; x += 122) { ctx.fillStyle = T.mix('#2a3238', '#1e252a', r()); ctx.beginPath(); T.rrect(ctx, x + 3, y + 3, 116, 56, 8); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(x + 6, y + 6, 100, 8); }
      ctx.fillStyle = vgrad(ctx, floorY, H, ['#1a2026', '#262e34']); ctx.fillRect(-OV, floorY, W + OV * 2, H + OV);
      if (bg.window !== false) { const x = wx * W, y = wy * H; ctx.fillStyle = vgrad(ctx, y - 60, y + 60, bg.cold ? ['#2a3a6a', '#5a6a9a'] : ['#f6d27a', '#fff2c0']); ctx.fillRect(x - 70, y - 60, 140, 120); ol(ctx, (k) => k.rect(x - 70, y - 60, 140, 120), null, { line: 8, ink: '#0e1214' }); ctx.fillStyle = '#0e1214'; for (let i = 1; i < 4; i++) ctx.fillRect(x - 70 + i * 35 - 4, y - 60, 8, 120); }
      if (bg.torch !== false) {
        const tx = (bg.torch ?? 0.2) * W, ty = H * 0.42;
        glow(ctx, tx, ty - 60, 420 * (1 + 0.05 * T.noise(step2(lt), seed + 't')), '#ffa040', 0.45);
        ol(ctx, (k) => { k.moveTo(tx - 20, ty); k.lineTo(tx + 20, ty); k.lineTo(tx + 10, ty + 110); k.lineTo(tx - 10, ty + 110); k.closePath(); }, '#4a3020', { line: 4 });
        ol(ctx, (k) => k.rect(tx - 26, ty - 6, 52, 18), '#5a5a5a', { line: 3 });
        ctx.save(); ctx.translate(tx, ty); T.drawFlame(ctx, 90, lt, seed + 'tf'); ctx.restore();
      }
    });
    if (bg.shaft !== false && bg.window !== false) cam(ctx, env, 0.9, () => { // barred light shaft falling to the floor
      const x = wx * W, y = wy * H, dx = -W * 0.22, ex = x + dx, ey = floorY + 60;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rgba(warm, 0.22);
      ctx.beginPath(); ctx.moveTo(x - 70, y - 60); ctx.lineTo(x + 70, y + 60); ctx.lineTo(ex + 160, ey + 40); ctx.lineTo(ex - 220, ey - 30); ctx.closePath(); ctx.fill(); ctx.restore();
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      for (let i = 1; i < 4; i++) { const f = i / 4; ctx.beginPath(); ctx.moveTo(x - 70 + f * 140 - 4, y - 60 + f * 120); ctx.lineTo(x - 70 + f * 140 + 4, y - 60 + f * 120); ctx.lineTo(ex - 220 + f * 380 + 10, ey - 30 + f * 70); ctx.lineTo(ex - 220 + f * 380 - 14, ey - 30 + f * 70); ctx.closePath(); ctx.fill(); }
    });
    vignette(ctx, 0.6);
    cellBars(ctx, bg, lt, env);
  };
  function cellBars(ctx, bg, lt, env) {
    if (bg.bars !== false) cam(ctx, env, 1.3, () => {
      const c = bg.barColor ?? '#8a6a2a', tx = (bg.torch ?? 0.2) * W;
      for (let x = -OV + 40; x < W + OV; x += 110) ol(ctx, (k) => k.rect(x - 9, -OV, 18, H + OV * 2), c, { line: 4, shade: (k) => { k.fillStyle = T.shade(c, -0.3); k.fillRect(x + 2, -OV, 8, H + OV * 2); k.fillStyle = rgba('#ffc060', 0.6 * T.clamp(1 - Math.abs(x - tx) / 900)); k.fillRect(x - 9, -OV, 5, H + OV * 2); } });
      ol(ctx, (k) => { k.rect(-OV, H * 0.08, W + OV * 2, 22); k.rect(-OV, H * 0.88, W + OV * 2, 22); }, c, { line: 4 });
    });
  }
  T.BG_FRONT.cell = cellBars;

  // ---------- harbor (pier) ----------
  const HARBOR = T.HARBOR = { sunset: { sky: ['#7a3a6a', '#d85a6a', '#f6d27a'], sea: '#6a4a9a', sun: '#fff0b0' }, day: { sky: ['#5aa8e0', '#9ad8f0', '#e0f4fa'], sea: '#2ec4b6', sun: '#ffffff' }, night: { sky: ['#0a1428', '#1d2b46', '#3a4a6a'], sea: '#1a2a4a', sun: '#f0f0d8' }, fog: { sky: ['#9aa4a8', '#c4cacc', '#dde0e0'], sea: '#7a8a8c', sun: '#ffffff' } };
  function ship(ctx, x, y, s, lt, sail) {
    const bob = Math.sin((lt / 2.2) * TAU) * 4;
    ctx.save(); ctx.translate(x, y + bob); ctx.scale(s, s);
    ol(ctx, (k) => { k.moveTo(-220, -40); k.lineTo(240, -40); k.quadraticCurveTo(200, 30, 140, 40); k.lineTo(-160, 40); k.quadraticCurveTo(-210, 20, -220, -40); k.closePath(); }, '#3a2620', { line: 4 });
    ol(ctx, (k) => k.rect(-6, -330, 12, 290), '#3a2620', { line: 3 });
    ol(ctx, (k) => { k.moveTo(-130, -300); k.quadraticCurveTo(0, -330, 130, -300); k.quadraticCurveTo(150, -180, 130, -80); k.quadraticCurveTo(0, -100, -130, -80); k.quadraticCurveTo(-110, -190, -130, -300); k.closePath(); }, sail, { line: 4 });
    ctx.strokeStyle = '#3a2620'; ctx.lineWidth = 3; for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.moveTo(-180 + i * 44, -10); ctx.lineTo(-200 + i * 44, 60); ctx.stroke(); }
    ctx.restore();
  }
  T.bgs.harbor = (ctx, bg, lt, env) => {
    const time = bg.night ? 'night' : bg.time ?? 'sunset', P = HARBOR[time];
    if (!P) throw new Error(`bg harbor: unknown time "${time}" (known: ${Object.keys(HARBOR).join(', ')})`);
    const hz = H * (bg.horizon ?? 0.55), seed = seedOf(env, 'harbor', bg), sx = W * 0.7, sy = hz - 60;
    cam(ctx, env, 0.15, () => {
      ctx.fillStyle = vgrad(ctx, -OV, hz, P.sky); ctx.fillRect(-OV, -OV, W + OV * 2, H + OV * 2);
      if (time === 'night') { const r = T.rng(T.hash(seed + 'st')); ctx.fillStyle = '#fff'; for (let i = 0; i < 90; i++) ctx.fillRect(r() * W, r() * hz * 0.8, 2 + r() * 2, 2 + r() * 2); ctx.fillStyle = P.sun; ctx.beginPath(); ctx.arc(W * 0.8, H * 0.2, 60, 0, TAU); ctx.fill(); ctx.fillStyle = P.sky[0]; ctx.beginPath(); ctx.arc(W * 0.8 + 26, H * 0.2 - 14, 54, 0, TAU); ctx.fill(); }
      else {
        glow(ctx, sx, sy, 520, P.sun, 0.7); ctx.fillStyle = rgba(P.sun, 0.5); ctx.fillRect(-OV, sy - 8, W + OV * 2, 16);
        ctx.fillStyle = P.sun; ctx.beginPath(); ctx.arc(sx, sy, 70, 0, TAU); ctx.fill();
        if (bg.flare !== false) { ctx.strokeStyle = rgba(P.sun, 0.35); ctx.lineWidth = 4; for (const rr of [140, 210]) { ctx.beginPath(); ctx.arc(sx, sy, rr, 0, TAU); ctx.stroke(); } for (const [f, rr] of [[0.4, 40], [0.7, 24], [1.1, 60]]) { ctx.fillStyle = rgba(P.sun, 0.18); ctx.beginPath(); ctx.arc(sx - f * 700, sy + f * 380, rr, 0, TAU); ctx.fill(); } }
      }
      T.ridge(ctx, hz + 6, 110, 0.004, seed + 'hl', T.mix(P.sky[0], '#2a2030', 0.45), P.sky[2], 0.25);
    });
    cam(ctx, env, 0.6, () => {
      ctx.fillStyle = vgrad(ctx, hz, H, [T.mix(P.sea, P.sky[2], 0.3), P.sea, T.shade(P.sea, -0.3)]); ctx.fillRect(-OV, hz, W + OV * 2, H + OV);
      const r = T.rng(T.hash(seed + 'wv')); ctx.lineCap = 'round';
      for (let i = 0; i < 60; i++) { const f = r(), y = hz + 10 + f * f * (H - hz), len = 30 + f * 120, x = ((r() * (W + OV * 2) + lt * 15 * (0.4 + f)) % (W + OV * 2)) - OV; ctx.strokeStyle = rgba(T.mix(P.sea, '#ffffff', 0.5), 0.5); ctx.lineWidth = 2 + f * 5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y); ctx.stroke(); }
      if (time !== 'night') { ctx.fillStyle = rgba(P.sun, 0.35); for (let i = 0; i < 9; i++) ctx.fillRect(sx - 60 + Math.sin(i * 1.7 + lt) * 30, hz + 10 + i * 22, 120 - i * 8, 6); }
      if (bg.ship !== false) ship(ctx, W * (bg.shipX ?? 0.22), hz + 40, 0.9, lt, time === 'night' ? '#2a2a3a' : bg.sail ?? '#f2ead8');
    });
    cam(ctx, env, 1, () => { // pier receding to a vanishing point on the horizon
      const vx = W * (bg.pierX ?? 0.5), vy = hz, bl = W * 0.12, br = W * 0.88, wood = time === 'night' ? '#3a3040' : '#8a5a3a';
      ol(ctx, (k) => { k.moveTo(vx - 30, vy + 30); k.lineTo(vx + 30, vy + 30); k.lineTo(br + OV, H + OV); k.lineTo(bl - OV, H + OV); k.closePath(); }, wood, { line: 4, shade: (k) => { k.strokeStyle = rgba('#2a1a10', 0.55); k.lineWidth = 3; for (let i = 0; i < 16; i++) { const f = Math.pow(i / 16, 2), y = vy + 30 + f * (H + OV - vy); k.beginPath(); k.moveTo(-OV, y); k.lineTo(W + OV, y); k.stroke(); } k.fillStyle = rgba('#ffffff', 0.08); k.beginPath(); k.moveTo(vx - 30, vy + 30); k.lineTo(vx - 10, vy + 30); k.lineTo(bl - OV + 300, H + OV); k.lineTo(bl - OV, H + OV); k.fill(); } });
      for (let i = 1; i < 8; i++) { const f = Math.pow(i / 8, 2), y = vy + 30 + f * (H + 120 - vy), w = 6 + f * 40, h = 20 + f * 220; for (const d of [-1, 1]) { const x = vx + d * (30 + f * (W * 0.5)); ol(ctx, (k) => k.rect(x - w / 2, y - h, w, h + 30), T.shade(wood, -0.35), { line: 3 }); } }
    });
    if (time === 'fog') { ctx.fillStyle = 'rgba(220,226,228,0.35)'; ctx.fillRect(-OV, -OV, W + OV * 2, H + OV * 2); }
    vignette(ctx, time === 'night' ? 0.5 : 0.3);
  };

  // ---------- alley (night) ----------
  T.bgs.alley = (ctx, bg, lt, env) => {
    const seed = seedOf(env, 'alley', bg), vx = W / 2, vy = H * 0.42, gx = W * 0.36, gx1 = W * 0.64;
    cam(ctx, env, 0.3, () => {
      ctx.fillStyle = vgrad(ctx, -OV, vy, ['#05081a', '#141c3a', '#2a3060']); ctx.fillRect(gx - 40, -OV, gx1 - gx + 80, vy + OV + 200);
      const r = T.rng(T.hash(seed + 'st')); ctx.fillStyle = '#fff'; for (let i = 0; i < 40; i++) ctx.fillRect(gx + r() * (gx1 - gx), r() * vy, 2, 2);
    });
    cam(ctx, env, 0.85, () => {
      const r = T.rng(T.hash(seed + 'win')), frac = bg.windows ?? 0.4;
      for (const d of [-1, 1]) {
        const xi = d < 0 ? gx : gx1, xo = d < 0 ? -OV : W + OV;
        ol(ctx, (k) => { k.moveTo(xo, -OV); k.lineTo(xi, -OV); k.lineTo(xi, vy + 150); k.lineTo(xo, H + OV); k.closePath(); }, d < 0 ? '#3a3020' : '#2e2618', { line: 4 });
        ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 2;
        for (let i = 0; i < 18; i++) { const f = i / 18, x = T.lerp(xi, xo, f * f); ctx.beginPath(); ctx.moveTo(x, -OV); ctx.lineTo(x, T.lerp(vy + 150, H + OV, f * f)); ctx.stroke(); }
        for (let c = 0; c < 5; c++) for (let rr = 0; rr < 4; rr++) {
          const f0 = 0.08 + c * 0.17, f1 = f0 + 0.08, x0 = T.lerp(xi, xo, f0 * f0), x1 = T.lerp(xi, xo, f1 * f1), yTop = (f) => T.lerp(vy - 300, -OV * 0.5, f * f) + rr * T.lerp(70, 210, f * f);
          const lit = r() < frac; ctx.fillStyle = lit ? '#f0d070' : '#1a1610';
          ctx.beginPath(); ctx.moveTo(x0, yTop(f0)); ctx.lineTo(x1, yTop(f1)); ctx.lineTo(x1, yTop(f1) + T.lerp(40, 120, f1 * f1)); ctx.lineTo(x0, yTop(f0) + T.lerp(40, 120, f0 * f0)); ctx.closePath(); ctx.fill();
          if (lit) glow(ctx, (x0 + x1) / 2, yTop(f0) + 30, 60 + f1 * 120, '#f0c050', 0.25);
        }
      }
      ol(ctx, (k) => k.rect(W * 0.2, -OV, 18, H * 0.8 + OV), '#4a4a44', { line: 3 }); // drainpipe
      ctx.fillStyle = vgrad(ctx, vy + 150, H, ['#1a1612', '#2e2820']); ctx.beginPath(); ctx.moveTo(gx, vy + 150); ctx.lineTo(gx1, vy + 150); ctx.lineTo(W + OV, H + OV); ctx.lineTo(-OV, H + OV); ctx.closePath(); ctx.fill();
    });
    cam(ctx, env, 1, () => {
      const bx = W * (bg.barrelX ?? 0.5), by = H * 0.86, k8 = flick(lt, seed + 'b', 0.08);
      if (bg.barrel !== false) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rgba('#e8c040', 0.22 * k8); ctx.beginPath(); ctx.moveTo(bx, by - 220); ctx.lineTo(bx - 900, H + OV); ctx.lineTo(bx + 900, H + OV); ctx.closePath(); ctx.fill(); ctx.restore();
        glow(ctx, bx, by - 220, 640 * k8, '#ffb040', 0.35);
      }
      if (bg.boxes !== false) {
        ol(ctx, (k) => k.rect(W * 0.08, H * 0.74, 220, 160), '#a87a4a', { line: 4, shade: (k) => { k.fillStyle = '#8a6038'; k.fillRect(W * 0.08 + 150, H * 0.74, 80, 170); } });
        ol(ctx, (k) => k.rect(W * 0.12, H * 0.62, 160, 120), '#b88a5a', { line: 4 });
        ol(ctx, (k) => k.rect(W * 0.82, H * 0.66, 130, 210), '#5a6060', { line: 4, shade: (k) => { k.strokeStyle = '#3a4040'; k.lineWidth = 3; for (let y = H * 0.7; y < H * 0.86; y += 30) { k.beginPath(); k.moveTo(W * 0.82, y); k.lineTo(W * 0.82 + 130, y); k.stroke(); } } });
        ol(ctx, (k) => k.ellipse(W * 0.82 + 65, H * 0.66, 76, 20, 0, 0, TAU), '#6a7070', { line: 4 });
      }
      if (bg.barrel !== false) {
        ol(ctx, (k) => T.rrect(k, bx - 80, by - 200, 160, 210, 12), '#2a2420', { line: 5, shade: (k) => { k.fillStyle = '#4a3a2a'; k.fillRect(bx - 80, by - 150, 160, 14); k.fillRect(bx - 80, by - 60, 160, 14); k.fillStyle = rgba('#ffb040', 0.35); k.fillRect(bx - 80, by - 200, 50, 210); } });
        ctx.save(); ctx.translate(bx, by - 196); T.drawFlame(ctx, 140, lt, seed + 'fl'); ctx.restore();
      }
    });
    if (bg.snow) { const r = T.rng(T.hash(seed + 'sn')); ctx.fillStyle = 'rgba(240,244,255,0.85)'; for (let i = 0; i < 120; i++) { const x = (r() * W + Math.sin(lt + i) * 20), y = ((r() * H + lt * (40 + r() * 40)) % H), s = 2 + r() * 4; ctx.beginPath(); ctx.arc(x, y, s, 0, TAU); ctx.fill(); } }
    vignette(ctx, bg.vignette ?? 0.8);
  };

  // ---------- antique sets ----------
  function flutedCol(ctx, x, y0, y1, w, fill = '#d8b88a', sh = '#9c7a52') {
    ol(ctx, (k) => k.rect(x - w / 2, y0, w, y1 - y0), fill, { line: 5, shade: (k) => { k.fillStyle = sh; k.fillRect(x + w * 0.12, y0, w, y1 - y0); k.strokeStyle = rgba(T.shade(sh, -0.3), 0.6); k.lineWidth = 3; for (let i = 1; i < 6; i++) { k.beginPath(); k.moveTo(x - w / 2 + (i * w) / 6, y0); k.lineTo(x - w / 2 + (i * w) / 6, y1); k.stroke(); } } });
    ol(ctx, (k) => { k.rect(x - w * 0.7, y0 - 34, w * 1.4, 34); k.rect(x - w * 0.65, y1, w * 1.3, 30); }, T.shade(fill, -0.05), { line: 5 });
  }
  const ANTIQUE = {};
  ANTIQUE.colonnade = (ctx, bg, lt, env, seed) => {
    T.bgs.sky(ctx, { preset: bg.sky ?? 'sunset', clouds: 3, hills: 2, ground: false, horizon: 0.7 }, lt, env);
    cam(ctx, env, 0.8, () => {
      ctx.save(); ctx.beginPath(); ctx.rect(-OV, -OV, W * 0.7 + OV, H + OV * 2); ctx.clip();
      full(ctx, '#d8c7a6'); ctx.strokeStyle = 'rgba(140,110,70,0.5)'; ctx.lineWidth = 1.5;
      for (let y = -OV, row = 0; y < H; y += 40, row++) { ctx.beginPath(); ctx.moveTo(-OV, y); ctx.lineTo(W, y); ctx.stroke(); for (let x = -OV + (row % 2) * 60; x < W; x += 120) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 40); ctx.stroke(); } }
      ctx.fillStyle = 'rgba(70,40,20,0.22)'; for (let i = 0; i < 4; i++) { const x = -OV + i * 420; ctx.beginPath(); ctx.moveTo(x, -OV); ctx.lineTo(x + 160, -OV); ctx.lineTo(x + 160 + 700, H); ctx.lineTo(x + 700, H); ctx.closePath(); ctx.fill(); }
      ctx.restore();
      ctx.fillStyle = '#b89a72'; ctx.fillRect(-OV, H * 0.8, W + OV * 2, H);
      ol(ctx, (k) => k.rect(-OV, H * 0.78, W + OV * 2, 40), '#cdb08a', { line: 4 });
      const n = bg.columns ?? 3; for (let i = 0; i < n; i++) flutedCol(ctx, W * (0.18 + i * (0.7 / Math.max(1, n))), H * 0.08, H * 0.78, 110);
      for (const px of [0.08, 0.92]) { ol(ctx, (k) => { k.moveTo(px * W - 60, H * 0.78); k.lineTo(px * W - 80, H * 0.66); k.lineTo(px * W + 80, H * 0.66); k.lineTo(px * W + 60, H * 0.78); k.closePath(); }, '#c8643a', { line: 4 }); T.leafMass ? T.leafMass(ctx, px * W, H * 0.58, 90, 70, seed + px, '#5a8a3a', '#7aa84a', 4) : 0; }
    });
  };
  ANTIQUE.balcony = (ctx, bg, lt, env) => {
    T.bgs.sky(ctx, { preset: bg.sky ?? 'sunset', clouds: 4, hills: 3, ground: false, horizon: 0.82 }, lt, env);
    cam(ctx, env, 0.3, () => { T.drawRays(ctx, W * 0.88, H * 0.08, lt, { color: 'rgba(255,240,200,0.16)', count: 9, spin: 0.01, seed: 'bal' }); glow(ctx, W * 0.9, H * 0.1, 700, '#fff0c0', 0.6); });
  };
  const ANTIQUE_FRONT = {};
  ANTIQUE_FRONT.balcony = (ctx, bg, lt, env) => {
    cam(ctx, env, 1.3, () => { // diagonal balustrade slab cutting characters at the waist
      const y0 = H * (bg.slabY ?? 0.74), y1 = y0 - H * 0.13;
      ol(ctx, (k) => { k.moveTo(-OV, y0 + 60); k.lineTo(W + OV, y1 + 60); k.lineTo(W + OV, H + OV); k.lineTo(-OV, H + OV); k.closePath(); }, '#e8dcc4', { line: 6, shade: (k) => { k.fillStyle = '#b9a989'; k.beginPath(); k.moveTo(-OV, y0 + 130); k.lineTo(W + OV, y1 + 130); k.lineTo(W + OV, H + OV); k.lineTo(-OV, H + OV); k.fill(); k.strokeStyle = rgba(DET, 0.6); k.lineWidth = 3; for (const o of [96, 112, 170]) { k.beginPath(); k.moveTo(-OV, y0 + o); k.lineTo(W + OV, y1 + o); k.stroke(); } } });
      ol(ctx, (k) => { k.moveTo(-OV, y0 + 20); k.lineTo(W + OV, y1 + 20); k.lineTo(W + OV, y1 + 66); k.lineTo(-OV, y0 + 66); k.closePath(); }, '#f4ead6', { line: 6, shade: (k) => { k.fillStyle = 'rgba(255,190,120,0.45)'; k.beginPath(); k.moveTo(-OV, y0 + 20); k.lineTo(W + OV, y1 + 20); k.lineTo(W + OV, y1 + 30); k.lineTo(-OV, y0 + 30); k.fill(); } });
    });
  };
  ANTIQUE['temple-square'] = (ctx, bg, lt, env) => {
    T.bgs.sky(ctx, { preset: bg.sky ?? 'day', clouds: 4, hills: 0, ground: false, horizon: 0.7 }, lt, env);
    cam(ctx, env, 0.5, () => {
      for (const [x, w, h, c] of [[0.04, 220, 200, '#e8d4b0'], [0.16, 180, 260, '#d8bc90'], [0.82, 240, 220, '#e0c8a0'], [0.94, 200, 180, '#d4b48a']]) { const bx = x * W, by = H * 0.7; ol(ctx, (k) => k.rect(bx - w / 2, by - h, w, h), c, { line: 4, shade: (k) => { k.fillStyle = T.shade(c, -0.18); k.fillRect(bx + w * 0.2, by - h, w, h); k.fillStyle = '#5a3a2a'; k.fillRect(bx - 20, by - 90, 40, 90); } }); ol(ctx, (k) => { k.moveTo(bx - w / 2 - 10, by - h); k.lineTo(bx, by - h - 90); k.lineTo(bx + w / 2 + 10, by - h); k.closePath(); }, '#b8543a', { line: 4 }); }
    });
    cam(ctx, env, 0.75, () => { // 3/4 temple: stepped base, column rows, pediment
      const x0 = W * 0.3, x1 = W * 0.74, by = H * 0.68, top = H * 0.3, skew = 60;
      for (let i = 0; i < 3; i++) ol(ctx, (k) => { k.moveTo(x0 - 40 - i * 20, by + i * 26); k.lineTo(x1 + 40 + i * 20, by + i * 26 - skew * 0.3); k.lineTo(x1 + 40 + i * 20, by + 26 + i * 26 - skew * 0.3); k.lineTo(x0 - 40 - i * 20, by + 26 + i * 26); k.closePath(); }, T.shade('#e8dcc0', -0.06 * i), { line: 4 });
      ol(ctx, (k) => k.rect(x0, top + 70, x1 - x0, by - top - 70), '#5a4a3a', { line: 4 });
      const n = 9; for (let i = 0; i < n; i++) { const x = T.lerp(x0 + 24, x1 - 24, i / (n - 1)); flutedCol(ctx, x, top + 90, by - 30, 38, '#efe4cc', '#c8b898'); }
      ol(ctx, (k) => k.rect(x0 - 20, top + 30, x1 - x0 + 40, 50), '#e8dcc0', { line: 4 });
      ol(ctx, (k) => { k.moveTo(x0 - 30, top + 30); k.lineTo((x0 + x1) / 2, top - 70); k.lineTo(x1 + 30, top + 30); k.closePath(); }, '#efe4cc', { line: 5, shade: (k) => { k.fillStyle = '#d0c0a0'; k.beginPath(); k.moveTo((x0 + x1) / 2, top - 40); k.lineTo(x1 - 20, top + 22); k.lineTo((x0 + x1) / 2, top + 22); k.fill(); } });
    });
    cam(ctx, env, 1, () => { perspFloor(ctx, H * 0.78, H + OV, W / 2, 6, 12, (r, c) => ((r + c) % 2 ? '#d8c8a8' : '#c8b490'), 2, [110, 320]); });
  };
  ANTIQUE.bath = (ctx, bg, lt, env, seed) => {
    T.bgs.sky(ctx, { preset: bg.sky ?? 'day', clouds: 3, hills: 2, ground: false, horizon: 0.6 }, lt, env);
    cam(ctx, env, 0.6, () => {
      const y = H * 0.56; ctx.fillStyle = '#c8a878';
      ol(ctx, (k) => { k.rect(-OV, y - 260, W + OV * 2, 60); for (let x = -OV; x < W + OV; x += 260) { k.moveTo(x, y); k.lineTo(x, y - 200); k.lineTo(x + 40, y - 200); k.lineTo(x + 40, y); } }, '#d8bc90', { line: 4 });
      for (let x = -OV; x < W + OV; x += 260) ol(ctx, (k) => { k.moveTo(x + 40, y - 200); k.arc(x + 150, y - 200, 110, Math.PI, 0, true); k.lineTo(x + 260, y - 200); k.lineTo(x + 260, y - 220); k.lineTo(x + 40, y - 220); k.closePath(); }, '#d8bc90', { line: 4 });
      ctx.fillStyle = '#c8b090'; ctx.fillRect(-OV, y, W + OV * 2, H);
    });
    cam(ctx, env, 1, () => {
      const px = W * 0.12, py = H * 0.68, pw = W * 0.76, ph = H * 0.22;
      ol(ctx, (k) => k.rect(px - 40, py - 40, pw + 80, ph + 80), '#e8dcc4', { line: 5, shade: (k) => { k.fillStyle = '#c4b494'; k.fillRect(px - 40, py + ph, pw + 80, 40); } });
      ol(ctx, (k) => k.rect(px, py, pw, ph), '#4ab8d8', { line: 5, shade: (k) => { k.fillStyle = '#2a90b8'; k.fillRect(px, py, pw, 30); k.strokeStyle = 'rgba(255,255,255,0.5)'; k.lineWidth = 4; for (let i = 0; i < 12; i++) { const x = px + ((i * 157 + lt * 20) % pw); k.beginPath(); k.moveTo(x, py + 50 + (i % 3) * 50); k.lineTo(x + 70, py + 50 + (i % 3) * 50); k.stroke(); } } });
      const r = T.rng(T.hash(seed + 'stm')); // steam rises 20 px/s
      for (let i = 0; i < 9; i++) { const x = px + r() * pw, ph0 = r() * 3, u = ((lt + ph0) % 3) / 3; ctx.strokeStyle = `rgba(255,255,255,${0.45 * (1 - u)})`; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, py - u * 60); ctx.bezierCurveTo(x + 30, py - 40 - u * 60, x - 30, py - 80 - u * 60, x + 10, py - 120 - u * 60); ctx.stroke(); }
    });
  };
  T.ANTIQUE = ANTIQUE;
  T.bgs.antique = (ctx, bg, lt, env) => {
    const v = variantOf(bg, Object.keys(ANTIQUE), 'colonnade', 'antique');
    ANTIQUE[v](ctx, bg, lt, env, seedOf(env, 'antique', bg));
    vignette(ctx, bg.vignette ?? 0.3);
    if (ANTIQUE_FRONT[v]) ANTIQUE_FRONT[v](ctx, bg, lt, env);
  };
  T.BG_FRONT.antique = (ctx, bg, lt, env) => { const f = ANTIQUE_FRONT[bg.variant ?? 'colonnade']; if (f) f(ctx, bg, lt, env); };

  // ---------- parchment-panel (engraving backstory) ----------
  T.bgs['parchment-panel'] = (ctx, bg, lt, env) => {
    const seed = seedOf(env, 'parch', bg), c = bg.color ?? '#d9a06a', fr = bg.frame !== false ? 26 : 0;
    cam(ctx, env, 1, () => {
      full(ctx, '#3a2618');
      const x0 = fr + 20, y0 = fr + 20, x1 = W - fr - 20, y1 = H - fr - 20, r = T.rng(T.hash(seed + 'edge')), pts = [];
      const edge = (ax, ay, bx, by) => { const n = Math.ceil(Math.hypot(bx - ax, by - ay) / 24); for (let i = 0; i < n; i++) { const t = i / n; pts.push([T.lerp(ax, bx, t) + (bg.torn !== false ? (r() - 0.5) * 16 : 0), T.lerp(ay, by, t) + (bg.torn !== false ? (r() - 0.5) * 16 : 0)]); } };
      edge(x0, y0, x1, y0); edge(x1, y0, x1, y1); edge(x1, y1, x0, y1); edge(x0, y1, x0, y0);
      const path = (k) => { pts.forEach(([x, y], i) => (i ? k.lineTo(x, y) : k.moveTo(x, y))); k.closePath(); };
      ctx.save(); ctx.beginPath(); path(ctx); ctx.clip();
      const g = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, W * 0.62); g.addColorStop(0, T.mix(c, '#ffffff', 0.12)); g.addColorStop(1, '#a8704a'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const ig = ctx.createRadialGradient(0, H, 0, 0, H, W * 0.5); ig.addColorStop(0, 'rgba(122,88,104,0.35)'); ig.addColorStop(1, 'rgba(122,88,104,0)'); ctx.fillStyle = ig; ctx.fillRect(0, 0, W, H);
      const gr = T.rng(T.hash(seed + 'grain')); for (let i = 0; i < 900; i++) { ctx.fillStyle = gr() > 0.5 ? 'rgba(255,240,210,0.08)' : 'rgba(60,30,10,0.08)'; ctx.fillRect(gr() * W, gr() * H, 1 + gr() * 2, 1 + gr() * 2); }
      ctx.restore();
      ctx.strokeStyle = 'rgba(60,30,10,0.55)'; ctx.lineWidth = 3; ctx.beginPath(); path(ctx); ctx.stroke();
      if (fr) { ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = 6; ctx.strokeRect(fr / 2, fr / 2, W - fr, H - fr); }
      if (bg.ornament !== false) { ol(ctx, (k) => k.arc(W - 80, 80, 60, 0, TAU), '#b8863a', { line: 5 }); ol(ctx, (k) => k.arc(W - 80, 80, 40, 0, TAU), '#e8c070', { line: 3, shade: (k) => { k.strokeStyle = '#8a5a2a'; k.lineWidth = 3; for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; k.beginPath(); k.moveTo(W - 80, 80); k.lineTo(W - 80 + Math.cos(a) * 40, 80 + Math.sin(a) * 40); k.stroke(); } } }); }
    });
  };

  // ---------- corkboard (conspiracy board) ----------
  T.bgs.corkboard = (ctx, bg, lt, env) => {
    const seed = seedOf(env, 'cork', bg), felt = bg.board === 'felt', base = felt ? '#5c7d92' : '#b98a52';
    if (bg.board != null && !['cork', 'felt'].includes(bg.board)) throw new Error(`bg corkboard: board must be "cork" or "felt", got "${bg.board}"`);
    const spec = Array.isArray(bg.notes) ? bg.notes.map((x) => (typeof x === 'string' ? { text: x } : x || {})) : null, r = T.rng(T.hash(seed + 'notes'));
    const n = spec ? spec.length : Math.max(0, Math.round(bg.notes ?? 12)), cols = Math.min(4, Math.max(1, n)), rows = Math.ceil(n / cols);
    const KINDS = ['#f2ede0', '#e9d27a', '#cfe2f0', 'photo'];
    const notes = Array.from({ length: n }, (_, i) => ({ x: W * (0.12 + ((i % cols) + r() * 0.4) * (0.76 / cols)), y: H * (0.14 + (Math.floor(i / cols) + r() * 0.3) * (0.7 / Math.max(1, rows))), w: 120 + r() * 80, h: 120 + r() * 70, a: (r() - 0.5) * 16 * DEG, k: KINDS[Math.floor(r() * 4)], lines: 2 + Math.floor(r() * 2), ...(spec ? { text: spec[i].text, at: spec[i].at, ...(spec[i].color ? { k: spec[i].color } : {}) } : {}) }));
    const pinAt = (nt) => [nt.x + nt.w / 2, nt.y + 14];
    cam(ctx, env, 1, () => {
      if (!env.richBase) { // the painted (Places 2.0) corkboard draws its own board and frame underneath
        full(ctx, '#5a3a22');
        ol(ctx, (k) => k.rect(-OV * 0.4, H * 0.02 - 60, W + OV * 0.8, H * 0.96 + 120), base, { line: 0, shade: (k) => { const g = T.rng(T.hash(seed + 'gr')); for (let i = 0; i < 1600; i++) { k.fillStyle = g() > 0.5 ? rgba(T.shade(base, -0.3), 0.5) : rgba(T.mix(base, '#ffffff', 0.3), 0.4); k.fillRect(g() * (W + 200) - 100, g() * (H + 120) - 60, 2 + g() * 3, 2 + g() * 3); } } });
      }
      notes.forEach((nt, i) => {
        const p = nt.at != null ? T.ease.outBack(T.prog(lt, nt.at, 0.2)) : 1; if (p <= 0) return; // pop-tilt in (6 frames)
        ctx.save(); ctx.translate(nt.x + nt.w / 2, nt.y + nt.h / 2); ctx.rotate(nt.a * (2 - p)); ctx.scale(p, p);
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(-nt.w / 2 + 8, -nt.h / 2 + 10, nt.w, nt.h);
        ol(ctx, (k) => k.rect(-nt.w / 2, -nt.h / 2, nt.w, nt.h), nt.k === 'photo' ? '#f4f2ec' : nt.k, { line: 3, ink: DET });
        if (nt.k === 'photo') { ctx.fillStyle = '#9aa3a8'; ctx.fillRect(-nt.w / 2 + 12, -nt.h / 2 + 12, nt.w - 24, nt.h - 40); ctx.fillStyle = '#5a6268'; ctx.beginPath(); ctx.arc(0, -10, nt.h * 0.18, 0, TAU); ctx.fill(); }
        else if (nt.text) { const words = String(nt.text).split('\n'); words.forEach((ln, l) => textBlock(ctx, ln, 0, (l - (words.length - 1) / 2) * 40, T.fitSize(ctx, ln, 40, nt.w - 24, 700), '#2a1c15', 700)); }
        else { ctx.strokeStyle = 'rgba(70,70,80,0.6)'; ctx.lineWidth = 3; for (let l = 0; l < nt.lines; l++) { const y = -nt.h / 2 + 34 + l * 26; ctx.beginPath(); ctx.moveTo(-nt.w / 2 + 16, y); for (let x = -nt.w / 2 + 16; x < nt.w / 2 - 20; x += 14) ctx.lineTo(x, y + (T.hash(seed + i + ':' + l + ':' + x) % 5) - 2); ctx.stroke(); } }
        ctx.restore();
      });
      for (const s of bg.strings || []) { // [i, j, at]: red string drawn from note i to note j over 0.3 s
        const [a, b, at] = s, na = notes[a], nb = notes[b]; if (!na || !nb) throw new Error(`bg corkboard: string ${JSON.stringify(s)} refers to a missing note (have ${n})`);
        const p = T.ease.inOut(T.prog(lt, at ?? 0, 0.3)); if (p <= 0) continue;
        const [x0, y0] = pinAt(na), [x1, y1] = pinAt(nb), mx = (x0 + x1) / 2, my = (y0 + y1) / 2 + 30;
        ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x0, y0);
        for (let i = 1; i <= 20; i++) { const t = (i / 20) * p, u = 1 - t; ctx.lineTo(u * u * x0 + 2 * u * t * mx + t * t * x1, u * u * y0 + 2 * u * t * my + t * t * y1); }
        ctx.stroke();
      }
      notes.forEach((nt) => { if (nt.at != null && lt < nt.at) return; const [x, y] = pinAt(nt); ol(ctx, (k) => k.arc(x, y, 9, 0, TAU), '#c0392b', { line: 3 }); ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 4, y - 5, 3, 3); });
      if (bg.sign) { const s = String(bg.sign), x = W * 0.5, y = H * 0.12; ctx.save(); ctx.translate(x, y); ctx.rotate(-3 * DEG); ol(ctx, (k) => k.rect(-260, -60, 520, 120), '#c8a06a', { line: 5, shade: (k) => { k.fillStyle = '#b08850'; k.fillRect(-260, 30, 520, 30); } }); textBlock(ctx, s, 0, 4, T.fitSize(ctx, s, 74, 470, 700), '#2a1c15', 700); ctx.restore(); }
    });
    vignette(ctx, bg.vignette ?? 0.35);
  };

  // ---------- vehicle-interior (scrolling window) ----------
  const SCENERY = {
    mountains: (ctx, x, y, w, h, off, seed) => { for (const [k, c, amp, sp] of [[0, '#e8dcc0', 0.5, 0.3], [1, '#c9b892', 0.32, 0.6]]) { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x, y + h); for (let i = 0; i <= w; i += 20) ctx.lineTo(x + i, y + h * (0.9 - amp) - Math.abs(T.noise((i + off * sp) * 0.004, seed + k)) * h * amp); ctx.lineTo(x + w, y + h); ctx.closePath(); ctx.fill(); } ctx.fillStyle = '#9ab060'; ctx.fillRect(x, y + h * 0.82, w, h); },
    city: (ctx, x, y, w, h, off, seed) => { for (let i = -1; i < w / 90 + 2; i++) { const id = Math.floor(off * 0.5 / 90) + i, bh = h * (0.3 + (T.hash(seed + id) % 40) / 100), bx = x + i * 90 - ((off * 0.5) % 90); ctx.fillStyle = id % 2 ? '#7a8aa8' : '#8a9ab8'; ctx.fillRect(bx, y + h - bh, 80, bh); ctx.fillStyle = '#f0e0a0'; for (let wy = y + h - bh + 14; wy < y + h - 10; wy += 26) ctx.fillRect(bx + 14, wy, 12, 12); } },
    sea: (ctx, x, y, w, h, off) => { ctx.fillStyle = '#3a9ac8'; ctx.fillRect(x, y + h * 0.55, w, h); ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 3; for (let i = 0; i < 12; i++) { const xx = x + ((i * 97 - off * 0.6) % w + w) % w, yy = y + h * (0.62 + (i % 4) * 0.09); ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx + 40, yy); ctx.stroke(); } },
    steppe: (ctx, x, y, w, h, off, seed) => { ctx.fillStyle = '#c8b870'; ctx.beginPath(); ctx.moveTo(x, y + h); for (let i = 0; i <= w; i += 20) ctx.lineTo(x + i, y + h * 0.66 - T.noise((i + off * 0.3) * 0.003, seed) * h * 0.06); ctx.lineTo(x + w, y + h); ctx.fill(); ctx.fillStyle = '#a89a50'; ctx.fillRect(x, y + h * 0.8, w, h); },
  };
  function windowScroll(ctx, x, y, w, h, bg, lt, seed, oval) {
    const v = bg.speed ?? 60, off = lt * v, kind = bg.scenery ?? 'mountains';
    if (!SCENERY[kind]) throw new Error(`bg vehicle-interior: unknown scenery "${kind}" (known: ${Object.keys(SCENERY).join(', ')})`);
    ctx.save(); ctx.beginPath(); oval ? T.rrect(ctx, x, y, w, h, Math.min(w, h) / 2) : ctx.rect(x, y, w, h); ctx.clip();
    ctx.fillStyle = vgrad(ctx, y, y + h, ['#7ac0ec', '#d8f0f8']); ctx.fillRect(x, y, w, h);
    if (bg.vehicle === 'plane') { const r = T.rng(T.hash(seed + 'cl')); for (let i = 0; i < 6; i++) { const cx = x + (((r() * w * 2 - off * (0.8 + r())) % (w * 1.6)) + w * 1.6) % (w * 1.6) - w * 0.3, cy = y + h * (0.3 + r() * 0.6); ctx.fillStyle = 'rgba(255,255,255,0.9)'; for (let j = 0; j < 4; j++) { ctx.beginPath(); ctx.arc(cx + j * 40, cy - (j % 2) * 20, 40, 0, TAU); ctx.fill(); } } }
    else {
      SCENERY[kind](ctx, x, y, w, h, off, seed);
      // near tree / pole silhouettes every ~0.5 s, crossing in 6 frames with 4 motion-blur copies
      const per = 0.5, i0 = Math.floor(lt / per);
      for (let i = i0 - 1; i <= i0; i++) {
        const jit = (T.hash(seed + 'p' + i) % 10) / 100, t0 = i * per + jit, p = (lt - t0) / 0.2; if (p < 0 || p > 1) continue;
        const px = x + w * 1.1 - p * w * 1.4, tree = T.hash(seed + 't' + i) % 2;
        for (let c = 0; c < 4; c++) { ctx.globalAlpha = c ? 0.15 : 0.5; ctx.fillStyle = '#2a3a2a'; const bx = px + c * 12; if (tree) { ctx.fillRect(bx - 8, y + h * 0.3, 16, h); ctx.beginPath(); ctx.arc(bx, y + h * 0.3, h * 0.22, 0, TAU); ctx.fill(); } else { ctx.fillRect(bx - 5, y - 10, 10, h + 20); ctx.fillRect(bx - 30, y + h * 0.12, 60, 8); } }
        ctx.globalAlpha = 1;
      }
    }
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.moveTo(x + w * 0.1, y); ctx.lineTo(x + w * 0.3, y); ctx.lineTo(x + w * 0.1, y + h); ctx.lineTo(x - w * 0.1, y + h); ctx.fill();
    ctx.restore();
    ol(ctx, (k) => (oval ? T.rrect(k, x, y, w, h, Math.min(w, h) / 2) : k.rect(x, y, w, h)), null, { line: 14, ink: '#3a2618' });
  }
  T.bgs['vehicle-interior'] = (ctx, bg, lt, env) => {
    const veh = bg.vehicle ?? 'train', seed = seedOf(env, 'vint', bg);
    if (!['train', 'bus', 'plane'].includes(veh)) throw new Error(`bg vehicle-interior: vehicle must be train, bus or plane, got "${veh}"`);
    const wall = veh === 'plane' ? '#e8e4dc' : veh === 'bus' ? '#c8b890' : '#8a5a3a', seat = bg.seat ?? '#3c8f8a';
    const sway = (bg.sway ?? 1.5) * Math.sin(lt * 0.8 * TAU) * DEG, wins = bg.windows ?? (veh === 'plane' ? [[0.3, 0.22, 0.12, 0.3], [0.62, 0.22, 0.12, 0.3]] : [[0.55, 0.25, 0.35, 0.35]]);
    cam(ctx, env, 1, () => {
      ctx.translate(W / 2, H * 1.3); ctx.rotate(sway); ctx.translate(-W / 2, -H * 1.3);
      full(ctx, wall);
      if (veh === 'train') { ctx.strokeStyle = 'rgba(60,30,10,0.35)'; ctx.lineWidth = 3; for (let y = -OV; y < H + OV; y += 46) { ctx.beginPath(); ctx.moveTo(-OV, y); ctx.lineTo(W + OV, y); ctx.stroke(); } }
      ctx.fillStyle = T.shade(wall, -0.2); ctx.fillRect(-OV, H * 0.72, W + OV * 2, H);
      ctx.fillStyle = T.shade(wall, 0.12); ctx.fillRect(-OV, -OV, W + OV * 2, OV + H * 0.06);
      for (const [x, y, w, h] of wins) windowScroll(ctx, x * W, y * H, w * W, h * H, bg, lt, seed, veh === 'plane');
      if (veh === 'train' && bg.picture !== false) { ol(ctx, (k) => k.rect(W * 0.14, H * 0.2, 220, 160), '#c89a3a', { line: 5 }); ctx.fillStyle = vgrad(ctx, H * 0.2 + 18, H * 0.2 + 142, ['#9ad0e8', '#7aa04a']); ctx.fillRect(W * 0.14 + 18, H * 0.2 + 18, 184, 124); }
      if (veh === 'bus') { ctx.strokeStyle = '#8a8a8a'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(-OV, H * 0.1); ctx.lineTo(W + OV, H * 0.1); ctx.stroke(); for (let x = 200; x < W; x += 320) { ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, H * 0.1); ctx.lineTo(x, H * 0.18); ctx.stroke(); ol(ctx, (k) => k.ellipse(x, H * 0.2, 22, 26, 0, 0, TAU), null, { line: 6, ink: '#6a6a6a' }); } }
      for (const sx of veh === 'plane' ? [0.12, 0.88] : [0.08, 0.92]) {
        ol(ctx, (k) => T.rrect(k, sx * W - 170, H * 0.42, 340, H * 0.5, 50), seat, { line: 6, shade: (k) => { k.fillStyle = bg.seatShade ?? T.shade(seat, -0.22); k.fillRect(sx * W + 60, H * 0.4, 200, H); k.fillStyle = rgba('#ffffff', 0.15); k.fillRect(sx * W - 140, H * 0.46, 30, H * 0.4); } });
        if (veh === 'plane') ol(ctx, (k) => T.rrect(k, sx * W - 120, H * 0.36, 240, 90, 30), '#f4f2ec', { line: 4 });
      }
      wedge(ctx, W * 0.5, 260, H, '#fff8e0', 0.08, 0.5);
    });
    vignette(ctx, bg.vignette ?? 0.3);
  };
})();
