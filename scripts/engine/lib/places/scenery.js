// scenery.js — the depth the reference gets from framing: foreground layer `fg` (bushes, canopy, ledge, tall grass,
// edge trunk, over-the-shoulder head, rubble) and richer backgrounds: `forest` (3 trunk depths, scalloped leaf masses,
// haze, glow spots) and `city` (stone/wood houses, temple, round trees, plaza). All coordinates are full-frame.
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL, W = T.W, H = T.H, OV = 260;

  // Leaf mass with crescent "C" highlight strokes (reference forests 2:48, 21:00).
  T.leafMass = (ctx, x, y, rx, ry, seed, fill, hi, line = 6) => {
    const pts = T.blobPts(x, y, rx, ry, seed, 18, 0.16);
    T.outlined(ctx, (k) => T.smoothPath(k, pts), fill, {
      line,
      shade: (k) => {
        k.fillStyle = T.shade(fill, -0.22); k.beginPath(); k.ellipse(x, y + ry * 0.75, rx * 1.1, ry * 0.5, 0, 0, Math.PI * 2); k.fill();
        const r = T.rng(T.hash(seed + 'hi')); k.strokeStyle = hi; k.lineWidth = Math.max(3, rx * 0.05); k.lineCap = 'round';
        for (let i = 0; i < 6; i++) { const cx = x + (r() - 0.5) * rx * 1.3, cy = y + (r() - 0.7) * ry * 0.9, s = rx * (0.12 + r() * 0.1); k.beginPath(); k.arc(cx, cy, s, Math.PI * 1.05, Math.PI * 1.75); k.stroke(); }
      },
    });
  };

  // ---------- foreground framing layer ----------
  const FG = {
    bushes(ctx, L) {
      const col = L.color ?? '#3e4b2a', hi = L.hi ?? '#5d6e3a';
      for (const side of L.sides ?? ['bl', 'br']) {
        const dx = side.includes('l') ? 1 : -1, top = side.includes('t'), sx = -dx * W / 2;
        for (let i = 0; i < 3; i++) {
          const y = top ? -H / 2 + 50 - i * 40 : H / 2 - 50 + i * 45; // biggest, highest clump in the corner
          T.leafMass(ctx, sx + dx * (40 + i * 165), y, 220 - i * 35, 150 - i * 25, (L.id ?? 'bush') + side + i, col, hi, 8);
        }
      }
    },
    canopy(ctx, L) {
      const col = L.color ?? '#2f3a22', hi = L.hi ?? '#4c5c33';
      for (let i = 0; i < 7; i++) T.leafMass(ctx, -W / 2 + i * (W / 6), -H / 2 - 40 + (i % 2) * 50, 220, 130, (L.id ?? 'can') + i, col, hi, 8);
    },
    ledge(ctx, L) {
      const stone = (L.surface ?? 'stone') !== 'grass', col = L.color ?? (stone ? '#c9b49a' : '#6e7a34'), side = L.side ?? 'left';
      const d = side === 'left' ? 1 : -1, x0 = d * -W / 2 - d * OV, y0 = H / 2 - (L.h ?? 0.22) * H;
      T.outlined(ctx, (k) => { k.moveTo(x0, y0 - 60); k.lineTo(d * W * 0.12, y0 + 60); k.lineTo(d * W * 0.34, H / 2 + OV); k.lineTo(x0, H / 2 + OV); k.closePath(); }, col, {
        line: 9, shade: (k) => { k.fillStyle = T.shade(col, -0.35); k.beginPath(); k.moveTo(x0, y0 - 20); k.lineTo(d * W * 0.12, y0 + 100); k.lineTo(d * W * 0.34, H / 2 + OV); k.lineTo(x0, H / 2 + OV); k.closePath(); k.fill(); },
      });
      if (!stone) FG.grass(ctx, { ...L, along: [x0, y0 - 60, d * W * 0.12, y0 + 60] });
    },
    grass(ctx, L, lt = 0) {
      const r = T.rng(T.hash(L.id ?? 'grass')), col = L.color ?? '#5a6a2a', lit = L.hi ?? '#e8b23a';
      const [ax, ay, bx, by] = L.along ?? [-W / 2 - 40, H / 2 + 10, W / 2 + 40, H / 2 + 10];
      for (let i = 0; i < (L.count ?? 26); i++) {
        const t = r(), x = T.lerp(ax, bx, t), y = T.lerp(ay, by, t), h = (L.h ?? 150) * (0.6 + r() * 0.8);
        const sway = Math.sin(lt * 1.6 + i) * 6;
        for (let b = 0; b < 4; b++) {
          const a = (b - 1.5) * 0.28 + (r() - 0.5) * 0.2;
          T.outlined(ctx, (k) => { k.moveTo(x - 9, y); k.quadraticCurveTo(x + Math.sin(a) * h * 0.5, y - h * 0.5, x + Math.sin(a) * h + sway, y - h * Math.cos(a)); k.quadraticCurveTo(x + Math.sin(a) * h * 0.5 + 6, y - h * 0.5, x + 9, y); k.closePath(); }, b % 2 ? col : lit, { line: 4 });
        }
      }
    },
    trunk(ctx, L) {
      const d = (L.side ?? 'left') === 'left' ? -1 : 1, x = d * (W / 2 - (L.inset ?? 90)), col = L.color ?? '#4a3a2c';
      T.outlined(ctx, (k) => { k.moveTo(x - 80, H / 2 + OV); k.quadraticCurveTo(x - 60, 0, x - 70, -H / 2 - OV); k.lineTo(x + 70, -H / 2 - OV); k.quadraticCurveTo(x + 50, 0, x + 90, H / 2 + OV); k.closePath(); }, col, {
        line: 10, shade: (k) => { k.fillStyle = T.shade(col, -0.3); k.fillRect(x + d * 10, -H, 80 * d, H * 2); k.strokeStyle = T.shade(col, -0.45); k.lineWidth = 5; for (let i = 0; i < 6; i++) { const y = -H / 2 + i * 190; k.beginPath(); k.moveTo(x - 40, y); k.quadraticCurveTo(x, y + 30, x + 30, y + 70); k.stroke(); } },
      });
    },
    // Over-the-shoulder: big dark back of a head (+shoulder) cropping the frame edge (reference 29:32, 35:28, 36:08).
    ots(ctx, L, lt, env) {
      const c = { ...(env.cast[L.who] || {}), ...(L.look || {}) };
      const d = (L.side ?? 'left') === 'left' ? -1 : 1, x = d * W * 0.36, y = H * 0.2, dark = L.tone ?? 0.45;
      ctx.save(); ctx.translate(x, y); ctx.scale(d * -1.9, 1.9); // mirrored so the head looks into the frame
      T.outlined(ctx, (k) => { k.moveTo(-220, 300); k.quadraticCurveTo(-200, 60, 0, 40); k.quadraticCurveTo(200, 60, 220, 300); k.closePath(); }, T.shade(c.robe ?? P.red, -dark), { line: 8 });
      ctx.save(); ctx.translate(0, 450); T.BEAN_HEAD.draw(ctx, { ...c, skin: T.shade(c.skin ?? P.skin, -dark), skinShade: T.shade('#c4c1cd', -dark), hairColor: T.shade(c.hairColor ?? P.hair, -dark * 0.6) }, { view: 'back', expr: 'neutral', lt, seed: 'ots' }); ctx.restore();
      ctx.restore();
    },
    rubble(ctx, L) {
      const r = T.rng(T.hash(L.id ?? 'rub'));
      for (let i = 0; i < (L.count ?? 9); i++) {
        const x = (r() - 0.5) * W * 1.1, y = H / 2 - r() * 40, s = 30 + r() * 60;
        T.outlined(ctx, (k) => T.smoothPath(k, T.blobPts(x, y, s, s * 0.6, (L.id ?? 'rub') + i, 7, 0.3)), L.color ?? '#8e8578', { line: 6 });
      }
    },
  };
  T.FG = FG;
  T.layers.fg = (ctx, L, lt, env) => {
    const fn = FG[L.kind];
    if (!fn) throw new Error('Unknown fg kind: ' + L.kind);
    fn(ctx, L, lt, env);
  };

  // ---------- forest background ----------
  T.bgs.forest = (ctx, bg, lt, env) => {
    const seed = env.seed + (bg.seed ?? 'forest'), r = T.rng(T.hash(seed));
    const sky = bg.sky ?? '#e9e6b8', haze = bg.haze ?? '#9aa86a', leaf = bg.leaf ?? '#5a7a2a', hi = bg.hi ?? '#8a9a58';
    ctx.save(); T.applyCam(ctx, env.cam, 0.2);
    const g = ctx.createLinearGradient(0, -OV, 0, H);
    g.addColorStop(0, T.shade(leaf, -0.2)); g.addColorStop(0.45, sky); g.addColorStop(1, haze);
    ctx.fillStyle = g; ctx.fillRect(-OV, -OV, W + OV * 2, H + OV * 2);
    ctx.restore();
    const planes = [[0.35, 12, 0.08, '#6c7a5a'], [0.6, 8, 0.11, '#55604a'], [0.85, 4, 0.16, bg.trunk ?? '#4a4436']];
    planes.forEach(([f, n, wd, col], pi) => {
      ctx.save(); T.applyCam(ctx, env.cam, f);
      const fog = 1 - pi / 2.4;
      for (let i = 0; i < n; i++) {
        const x = -OV + (i + r() * 0.6) * ((W + OV * 2) / n), w = W * wd * (0.6 + r() * 0.5);
        T.outlined(ctx, (k) => { k.moveTo(x - w / 2, H + OV); k.quadraticCurveTo(x - w * 0.3, H * 0.4, x - w * 0.35, -OV); k.lineTo(x + w * 0.35, -OV); k.quadraticCurveTo(x + w * 0.3, H * 0.4, x + w / 2, H + OV); k.closePath(); }, col, {
          line: pi === 2 ? 8 : 4, ink: pi === 2 ? P.ink : 'rgba(42,28,21,0.45)',
          shade: (k) => { k.fillStyle = T.shade(col, -0.22); k.fillRect(x + w * 0.05, -OV, w * 0.4, H + OV * 2); },
        });
        if (pi === 2 && r() > 0.4) { const by = H * (0.3 + r() * 0.2), d = r() > 0.5 ? 1 : -1; T.outlined(ctx, (k) => { k.moveTo(x, by); k.quadraticCurveTo(x + d * w, by - 60, x + d * w * 1.8, by - 150); k.lineTo(x + d * w * 1.8 + 14, by - 130); k.quadraticCurveTo(x + d * w, by - 30, x + 6, by + 40); k.closePath(); }, col, { line: 6 }); }
      }
      for (let i = 0; i < (pi === 2 ? 6 : 9); i++) T.leafMass(ctx, -OV + r() * (W + OV * 2), -OV * 0.3 + r() * H * 0.28, 160 + r() * 140 - pi * 10, 100 + r() * 60, seed + pi + 'l' + i, T.shade(leaf, -0.12 * (2 - pi) + 0.05), T.shade(hi, -0.1 * (2 - pi)), pi === 2 ? 7 : 4);
      if (fog > 0.2) { ctx.fillStyle = haze; ctx.globalAlpha = 0.18 * fog; ctx.fillRect(-OV, -OV, W + OV * 2, H + OV * 2); ctx.globalAlpha = 1; }
      ctx.restore();
    });
    ctx.save(); T.applyCam(ctx, env.cam, 1);
    const gy = (bg.groundY ?? 0.84) * H;
    ctx.fillStyle = bg.ground ?? '#4d5a2c'; ctx.fillRect(-OV, gy, W + OV * 2, H - gy + OV);
    ctx.strokeStyle = P.ink; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-OV, gy); ctx.lineTo(W + OV, gy); ctx.stroke();
    if (bg.path !== false) T.outlined(ctx, (k) => { k.moveTo(W * 0.42, gy); k.lineTo(W * 0.58, gy); k.lineTo(W * 0.85, H + OV); k.lineTo(W * 0.15, H + OV); k.closePath(); }, '#8a6a45', { line: 5 });
    const gr = T.rng(T.hash(seed + 'glow'));
    for (let i = 0; i < 7; i++) { const x = gr() * W, y = H * (0.3 + gr() * 0.4); const gg = ctx.createRadialGradient(x, y, 0, x, y, 60); gg.addColorStop(0, 'rgba(220,240,170,0.5)'); gg.addColorStop(1, 'rgba(220,240,170,0)'); ctx.fillStyle = gg; ctx.fillRect(x - 60, y - 60, 120, 120); }
    ctx.restore();
    if (bg.rays !== false) T.drawRays(ctx, W * 0.15, -H * 0.1, lt, { color: 'rgba(240,255,210,0.12)', count: 6, spin: 0.01, seed });
  };

  // ---------- city / village background ----------
  function house(ctx, x, baseY, w, h, style, seed) {
    const r = T.rng(T.hash(seed)), wall = style === 'wood' ? '#9a6a42' : '#d8c2a0', roof = style === 'wood' ? '#6a3a2a' : '#b8553a';
    T.outlined(ctx, (k) => k.rect(x - w / 2, baseY - h, w, h), wall, {
      line: 6, shade: (k) => {
        k.fillStyle = T.shade(wall, -0.25); k.fillRect(x + w * 0.2, baseY - h, w * 0.3, h);
        if (style === 'wood') { k.strokeStyle = T.shade(wall, -0.4); k.lineWidth = 3; for (let y = baseY - h + 22; y < baseY; y += 22) { k.beginPath(); k.moveTo(x - w / 2, y); k.lineTo(x + w / 2, y); k.stroke(); } k.fillStyle = '#6a6a66'; k.fillRect(x - w / 2, baseY - 26, w, 26); }
      },
    });
    for (let i = 0; i < 2; i++) if (r() > 0.3) T.outlined(ctx, (k) => k.rect(x - w * 0.3 + i * w * 0.38, baseY - h * 0.62, w * 0.2, h * 0.24), '#3a2a22', { line: 4 });
    T.outlined(ctx, (k) => { k.moveTo(x - w * 0.62, baseY - h); k.lineTo(x, baseY - h - w * (style === 'wood' ? 0.42 : 0.3)); k.lineTo(x + w * 0.62, baseY - h); k.closePath(); }, roof, { line: 6, shade: (k) => { k.fillStyle = T.shade(roof, -0.25); k.fillRect(x, baseY - h - w, w, w); } });
  }

  T.bgs.city = (ctx, bg, lt, env) => {
    T.bgs.sky(ctx, { preset: bg.preset ?? 'day', clouds: bg.clouds ?? 4, hills: 2, ground: false, horizon: 0.55, palette: bg.palette }, lt, env);
    const seed = env.seed + (bg.seed ?? 'city'), r = T.rng(T.hash(seed)), style = bg.style ?? 'stone';
    const gy = (bg.groundY ?? 0.78) * H;
    for (const [f, scale, base, n] of [[0.55, 0.55, gy - 70, 9], [0.8, 0.85, gy - 10, 6]]) {
      ctx.save(); T.applyCam(ctx, env.cam, f);
      for (let i = 0; i < n; i++) {
        const x = -OV + (i + 0.3 + r() * 0.4) * ((W + OV * 2) / n);
        if (bg.temple !== false && f > 0.7 && i === Math.floor(n / 2)) { ctx.save(); ctx.translate(x, base); T.drawProp(ctx, 'temple', 360 * scale, lt); ctx.restore(); continue; }
        if (r() > 0.75) T.drawTree(ctx, x, base, 220 * scale, seed + 't' + i);
        else house(ctx, x, base, (150 + r() * 80) * scale, (110 + r() * 90) * scale, style, seed + f + i);
      }
      if (f < 0.7) { ctx.fillStyle = 'rgba(205,232,238,0.35)'; ctx.fillRect(-OV, -OV, W + OV * 2, H + OV * 2); }
      ctx.restore();
    }
    ctx.save(); T.applyCam(ctx, env.cam, 1);
    ctx.fillStyle = bg.ground ?? (style === 'wood' ? '#5d7a3a' : '#d8cbb0'); ctx.fillRect(-OV, gy, W + OV * 2, H - gy + OV);
    ctx.strokeStyle = 'rgba(42,28,21,0.3)'; ctx.lineWidth = 3;
    if (style !== 'wood') for (let i = -10; i <= 10; i++) { ctx.beginPath(); ctx.moveTo(W / 2 + i * 70, gy); ctx.lineTo(W / 2 + i * 240, H + OV); ctx.stroke(); }
    for (let y = gy + 40; y < H + OV; y += 60 + (y - gy) * 0.3) { ctx.beginPath(); ctx.moveTo(-OV, y); ctx.lineTo(W + OV, y); ctx.stroke(); }
    ctx.strokeStyle = P.ink; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-OV, gy); ctx.lineTo(W + OV, gy); ctx.stroke();
    ctx.restore();
  };
})();
