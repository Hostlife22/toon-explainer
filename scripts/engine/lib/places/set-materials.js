// set-materials.js — painted surfaces for the set kit and the rich backgrounds: walls (T.SET_WALLS: plaster, brick,
// wood, stone, wallpaper, tile) and perspective floors (T.SET_FLOORS: wood, stone, tile, carpet, dirt), plus
// T.texBox / T.texShape, outlined shapes that carry a material texture inside their outline. All seeded, no clock.
(function () {
  'use strict';
  const T = window.TOON, TAU = Math.PI * 2;
  const INK = '#3a281c';
  const rgba = T.rgba;

  // Outlined shape with a texture clipped inside it (painted look only) and an optional detail callback.
  T.texShape = (ctx, path, fill, tex, o = {}) => {
    T.outlined(ctx, path, fill, {
      line: o.line ?? 4, ink: o.ink ?? INK, paint: o.paint ?? true,
      shade: (k) => {
        if (tex && T.PAINT) T.fillTexture(k, null, tex, { rect: o.rect, alpha: o.alpha ?? 0.5, scale: o.scale ?? 0.8, rot: o.rot ?? 0, seed: o.seed ?? 1 });
        if (o.detail) o.detail(k);
      },
    });
  };
  T.texBox = (ctx, x, y, w, h, fill, tex, o = {}) => T.texShape(ctx, (k) => (o.r ? T.rrect(k, x, y, w, h, o.r) : k.rect(x, y, w, h)), fill, tex, { rect: [x - 4, y - 4, w + 8, h + 8], ...o });

  // Soft vertical falloff over a rect: darker toward the ceiling (and a little toward the floor).
  const falloff = (ctx, x, y, w, h, top = 0.32, bottom = 0.12) => {
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, rgba('#1c0c04', top)); g.addColorStop(0.45, rgba('#1c0c04', 0)); g.addColorStop(0.85, rgba('#1c0c04', 0)); g.addColorStop(1, rgba('#1c0c04', bottom));
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  };
  const tex = (ctx, kind, rect, o = {}) => { if (T.PAINT) T.fillTexture(ctx, null, kind, { rect, alpha: 0.5, ...o }); };
  // Wainscot: wood panelling with a chair rail across the bottom of a wall.
  function wainscot(ctx, x, y, w, h, color, seed) {
    const wh = Math.min(h * 0.3, 240), top = y + h - wh, c = T.hex6(color);
    ctx.fillStyle = c; ctx.fillRect(x, top, w, y + h - top);
    tex(ctx, 'wood', [x, top, w, y + h - top], { alpha: 0.55 });
    const pw = 210;
    for (let px = x + 30; px < x + w - 40; px += pw) {
      ctx.fillStyle = T.shade(c, 0.1); ctx.fillRect(px, top + 34, pw - 40, wh - 70);
      ctx.strokeStyle = rgba(T.shade(c, -0.45), 0.9); ctx.lineWidth = 4; ctx.strokeRect(px, top + 34, pw - 40, wh - 70);
      ctx.strokeStyle = rgba('#fff2d0', 0.25); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px + 3, top + wh - 39); ctx.lineTo(px + 3, top + 37); ctx.lineTo(px + pw - 43, top + 37); ctx.stroke();
    }
    T.outlined(ctx, (k) => k.rect(x - 10, top - 14, w + 20, 22), T.shade(c, 0.12), { line: 4, ink: INK });
    T.outlined(ctx, (k) => k.rect(x - 10, y + h - 26, w + 20, 26), T.shade(c, -0.15), { line: 4, ink: INK });
  }
  function cracks(ctx, x, y, w, h, seed, n = 5) {
    const r = T.rng(T.hash(seed + 'cr'));
    ctx.strokeStyle = rgba('#2a1408', 0.3); ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      let px = x + r() * w, py = y + r() * h * 0.7;
      ctx.beginPath(); ctx.moveTo(px, py);
      for (let j = 0; j < 4; j++) { px += (r() - 0.5) * 50; py += 12 + r() * 26; ctx.lineTo(px, py); }
      ctx.stroke();
    }
    for (let i = 0; i < 4; i++) { // damp stains
      const sx = x + r() * w, sy = y + r() * h * 0.6, rad = 60 + r() * 120, g = ctx.createRadialGradient(sx, sy, 0, sx, sy, rad);
      g.addColorStop(0, rgba('#5a3a1a', 0.1)); g.addColorStop(1, rgba('#5a3a1a', 0)); ctx.fillStyle = g; ctx.fillRect(sx - rad, sy - rad, rad * 2, rad * 2);
    }
  }

  // ---------- walls: fn(ctx, [x, y, w, h], {color, seed, trim}) ----------
  T.SET_WALLS = {
    plaster(ctx, [x, y, w, h], o) {
      ctx.fillStyle = o.color ?? '#d9c7a4'; ctx.fillRect(x, y, w, h);
      tex(ctx, 'plaster', [x, y, w, h], { alpha: 0.6, seed: 2 });
      cracks(ctx, x, y, w, h, o.seed);
      falloff(ctx, x, y, w, h);
      if (o.trim !== false) wainscot(ctx, x, y, w, h, o.trim ?? '#6b4426', o.seed);
    },
    brick(ctx, [x, y, w, h], o) {
      const c = o.color ?? '#9a5a40';
      ctx.fillStyle = c; ctx.fillRect(x, y, w, h);
      if (T.PAINT) T.fillTexture(ctx, null, 'brick', { rect: [x, y, w, h], alpha: 0.85, scale: 0.9, seed: 1 });
      const r = T.rng(T.hash(o.seed + 'patch'));
      for (let i = 0; i < 7; i++) { const px = x + r() * w, py = y + r() * h, rad = 80 + r() * 160, g = ctx.createRadialGradient(px, py, 0, px, py, rad); const d = r() < 0.5; g.addColorStop(0, rgba(d ? '#2a1008' : '#f0d0b0', 0.16)); g.addColorStop(1, rgba(d ? '#2a1008' : '#f0d0b0', 0)); ctx.fillStyle = g; ctx.fillRect(px - rad, py - rad, rad * 2, rad * 2); }
      falloff(ctx, x, y, w, h, 0.42, 0.18);
    },
    wood(ctx, [x, y, w, h], o) {
      const c = T.hex6(o.color ?? '#8a5a3a'), r = T.rng(T.hash(o.seed + 'pl')), pw = 96;
      for (let px = x, i = 0; px < x + w; px += pw, i++) {
        ctx.fillStyle = T.shade(c, (r() - 0.5) * 0.16); ctx.fillRect(px, y, pw, h);
      }
      tex(ctx, 'wood', [x, y, w, h], { alpha: 0.45, rot: 90, scale: 1.1 });
      ctx.strokeStyle = rgba(T.shade(c, -0.55), 0.85); ctx.lineWidth = 4;
      for (let px = x; px < x + w; px += pw) { ctx.beginPath(); ctx.moveTo(px, y); ctx.lineTo(px, y + h); ctx.stroke(); }
      ctx.strokeStyle = rgba('#ffe8c0', 0.16); ctx.lineWidth = 3;
      for (let px = x + 4; px < x + w; px += pw) { ctx.beginPath(); ctx.moveTo(px, y); ctx.lineTo(px, y + h); ctx.stroke(); }
      ctx.fillStyle = rgba('#2a1408', 0.5);
      for (let px = x + pw / 2; px < x + w; px += pw) for (const ny of [y + 60, y + h * 0.5, y + h - 40]) { ctx.beginPath(); ctx.arc(px, ny + ((T.hash(o.seed + px) % 9) - 4), 3, 0, TAU); ctx.fill(); }
      falloff(ctx, x, y, w, h, 0.38, 0.15);
    },
    stone(ctx, [x, y, w, h], o) {
      const c = T.hex6(o.color ?? '#9c9384'), r = T.rng(T.hash(o.seed + 'ash')), rh = 92;
      ctx.fillStyle = T.shade(c, -0.35); ctx.fillRect(x, y, w, h);
      for (let py = y, row = 0; py < y + h; py += rh, row++) for (let px = x - (row % 2) * 70; px < x + w;) {
        const bw = 130 + r() * 110, t = (r() - 0.5) * 0.18, f = T.shade(c, t);
        ctx.fillStyle = f; ctx.beginPath(); T.rrect(ctx, px + 4, py + 4, bw - 8, rh - 8, 8); ctx.fill();
        ctx.fillStyle = rgba('#fff4dc', 0.16); ctx.fillRect(px + 8, py + 6, bw - 18, 6);
        ctx.fillStyle = rgba('#1a1008', 0.18); ctx.fillRect(px + 8, py + rh - 16, bw - 16, 8);
        px += bw;
      }
      tex(ctx, 'plaster', [x, y, w, h], { alpha: 0.7, scale: 1.2 });
      const sr = T.rng(T.hash(o.seed + 'chip'));
      ctx.fillStyle = rgba('#1a1008', 0.22);
      for (let i = 0; i < 260; i++) { ctx.beginPath(); ctx.arc(x + sr() * w, y + sr() * h, 1 + sr() * 2.2, 0, TAU); ctx.fill(); }
      falloff(ctx, x, y, w, h, 0.4, 0.2);
    },
    wallpaper(ctx, [x, y, w, h], o) {
      const c = T.hex6(o.color ?? '#b8a27a'), s = 70;
      ctx.fillStyle = c; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = rgba(T.shade(c, -0.25), 0.35);
      for (let px = x; px < x + w; px += s * 2) ctx.fillRect(px, y, s * 0.7, h);
      ctx.fillStyle = rgba(T.shade(c, 0.25), 0.45);
      for (let px = x + s; px < x + w; px += s * 2) for (let py = y + 40; py < y + h; py += 110) { ctx.beginPath(); ctx.moveTo(px + s * 0.5, py - 22); ctx.lineTo(px + s * 0.8, py); ctx.lineTo(px + s * 0.5, py + 22); ctx.lineTo(px + s * 0.2, py); ctx.closePath(); ctx.fill(); }
      tex(ctx, 'paper', [x, y, w, h], { alpha: 0.6, scale: 1.5 });
      falloff(ctx, x, y, w, h);
      if (o.trim !== false) wainscot(ctx, x, y, w, h, o.trim ?? '#5a3a22', o.seed);
    },
    tile(ctx, [x, y, w, h], o) {
      const c = T.hex6(o.color ?? '#dfe8e2'), s = 64, top = y + h * 0.42;
      ctx.fillStyle = o.upper ?? '#e8e2d2'; ctx.fillRect(x, y, w, top - y);
      tex(ctx, 'plaster', [x, y, w, top - y], { alpha: 0.5 });
      for (let py = top, row = 0; py < y + h; py += s, row++) for (let px = x; px < x + w; px += s) {
        ctx.fillStyle = T.shade(c, ((T.hash(o.seed + px + ':' + py) % 9) - 4) * 0.012); ctx.fillRect(px, py, s, s);
        ctx.fillStyle = rgba('#ffffff', 0.35); ctx.fillRect(px + 6, py + 6, s * 0.35, 5);
      }
      ctx.strokeStyle = rgba(T.shade(c, -0.4), 0.8); ctx.lineWidth = 3;
      for (let px = x; px < x + w; px += s) { ctx.beginPath(); ctx.moveTo(px, top); ctx.lineTo(px, y + h); ctx.stroke(); }
      for (let py = top; py < y + h; py += s) { ctx.beginPath(); ctx.moveTo(x, py); ctx.lineTo(x + w, py); ctx.stroke(); }
      T.outlined(ctx, (k) => k.rect(x - 10, top - 12, w + 20, 16), T.shade(c, -0.2), { line: 3, ink: INK });
      falloff(ctx, x, y, w, h, 0.3, 0.12);
    },
  };

  // ---------- perspective floors: fn(ctx, y0, y1, {color, seed, vx}) between the wall line y0 and y1 ----------
  const OVX = 900;
  const row = (y0, y1, t) => y0 + Math.pow(t, 1.4) * (y1 - y0);
  const spread = (t) => 0.55 + t * 1.45; // horizontal scale of the floor grid from far (t = 0) to near (t = 1)
  const quad = (ctx, vx, y0, y1, a0, a1, t0, t1) => {
    const ya = row(y0, y1, t0), yb = row(y0, y1, t1), sa = spread(t0), sb = spread(t1);
    ctx.beginPath(); ctx.moveTo(vx + a0 * sa, ya); ctx.lineTo(vx + a1 * sa, ya); ctx.lineTo(vx + a1 * sb, yb); ctx.lineTo(vx + a0 * sb, yb); ctx.closePath();
  };
  const floorShade = (ctx, y0, y1) => {
    const ao = ctx.createLinearGradient(0, y0, 0, y0 + 60); ao.addColorStop(0, rgba('#140a06', 0.45)); ao.addColorStop(1, rgba('#140a06', 0));
    ctx.fillStyle = ao; ctx.fillRect(-OVX, y0, T.W + OVX * 2, 60);
    const near = ctx.createLinearGradient(0, y0, 0, y1); near.addColorStop(0, rgba('#140a06', 0)); near.addColorStop(1, rgba('#140a06', 0.28));
    ctx.fillStyle = near; ctx.fillRect(-OVX, y0, T.W + OVX * 2, y1 - y0);
    ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-OVX, y0); ctx.lineTo(T.W + OVX, y0); ctx.stroke();
  };
  T.SET_FLOORS = {
    wood(ctx, y0, y1, o) {
      const c = T.hex6(o.color ?? '#9a6438'), vx = o.vx ?? T.W / 2, r = T.rng(T.hash(o.seed + 'fl')), rows = 9, bw = 120;
      for (let i = 0; i < rows; i++) for (let a = -26; a < 26; a++) {
        const t0 = i / rows, t1 = (i + 1) / rows;
        ctx.fillStyle = T.shade(c, (r() - 0.5) * 0.2); quad(ctx, vx, y0, y1, a * bw, (a + 1) * bw, t0, t1); ctx.fill();
      }
      tex(ctx, 'wood', [-OVX, y0, T.W + OVX * 2, y1 - y0], { alpha: 0.55, scale: 1.3 });
      ctx.strokeStyle = rgba(T.shade(c, -0.55), 0.8); ctx.lineWidth = 3;
      for (let a = -26; a <= 26; a++) { ctx.beginPath(); ctx.moveTo(vx + a * bw * spread(0), y0); ctx.lineTo(vx + a * bw * spread(1), y1); ctx.stroke(); }
      ctx.lineWidth = 2;
      for (let i = 1; i < rows; i++) for (let a = -26 + (i % 2); a < 26; a += 2) { const t = i / rows, y = row(y0, y1, t), s = spread(t); ctx.beginPath(); ctx.moveTo(vx + a * bw * s, y); ctx.lineTo(vx + (a + 1) * bw * s, y); ctx.stroke(); }
      const sh = ctx.createLinearGradient(0, y0, 0, y1); sh.addColorStop(0, rgba('#fff0d0', 0.14)); sh.addColorStop(0.5, rgba('#fff0d0', 0)); // sheen of the varnish
      ctx.fillStyle = sh; ctx.fillRect(-OVX, y0, T.W + OVX * 2, y1 - y0);
      floorShade(ctx, y0, y1);
    },
    stone(ctx, y0, y1, o) {
      const c = T.hex6(o.color ?? '#9a9286'), vx = o.vx ?? T.W / 2, r = T.rng(T.hash(o.seed + 'fs')), rows = 6, bw = 210;
      ctx.fillStyle = T.shade(c, -0.4); ctx.fillRect(-OVX, y0, T.W + OVX * 2, y1 - y0);
      for (let i = 0; i < rows; i++) for (let a = -12; a < 12; a++) {
        const off = (i % 2) * 0.5, t0 = i / rows + 0.01, t1 = (i + 1) / rows - 0.01;
        ctx.fillStyle = T.shade(c, (r() - 0.5) * 0.22); quad(ctx, vx, y0, y1, (a + off) * bw + 5, (a + off + 1) * bw - 5, t0, t1); ctx.fill();
      }
      tex(ctx, 'stone', [-OVX, y0, T.W + OVX * 2, y1 - y0], { alpha: 0.45, scale: 1.3 });
      floorShade(ctx, y0, y1);
    },
    tile(ctx, y0, y1, o) {
      const [a1, b1] = o.colors ?? [o.color ?? '#e8e0cc', '#5a4a3a'], vx = o.vx ?? T.W / 2, rows = 8, bw = 150;
      for (let i = 0; i < rows; i++) for (let a = -16; a < 16; a++) { ctx.fillStyle = (i + a) % 2 ? a1 : b1; quad(ctx, vx, y0, y1, a * bw, (a + 1) * bw, i / rows, (i + 1) / rows); ctx.fill(); }
      tex(ctx, 'stone', [-OVX, y0, T.W + OVX * 2, y1 - y0], { alpha: 0.25, scale: 1.4 });
      const sh = ctx.createLinearGradient(0, y0, 0, y1); sh.addColorStop(0, rgba('#ffffff', 0.18)); sh.addColorStop(0.4, rgba('#ffffff', 0));
      ctx.fillStyle = sh; ctx.fillRect(-OVX, y0, T.W + OVX * 2, y1 - y0);
      floorShade(ctx, y0, y1);
    },
    carpet(ctx, y0, y1, o) {
      const c = o.color ?? '#7a2a22';
      ctx.fillStyle = c; ctx.fillRect(-OVX, y0, T.W + OVX * 2, y1 - y0);
      tex(ctx, 'fabric', [-OVX, y0, T.W + OVX * 2, y1 - y0], { alpha: 0.5, scale: 0.8 });
      floorShade(ctx, y0, y1);
    },
    dirt(ctx, y0, y1, o) {
      const c = T.hex6(o.color ?? '#8a6a48'), r = T.rng(T.hash(o.seed + 'dirt'));
      ctx.fillStyle = c; ctx.fillRect(-OVX, y0, T.W + OVX * 2, y1 - y0);
      tex(ctx, 'stone', [-OVX, y0, T.W + OVX * 2, y1 - y0], { alpha: 0.35, scale: 1.6 });
      for (let i = 0; i < 90; i++) { const t = r(), x = r() * (T.W + 600) - 300, y = row(y0, y1, t), s = (3 + r() * 6) * spread(t); ctx.fillStyle = r() < 0.5 ? T.shade(c, -0.3) : T.shade(c, 0.2); ctx.beginPath(); ctx.ellipse(x, y, s * 1.4, s * 0.7, 0, 0, TAU); ctx.fill(); }
      floorShade(ctx, y0, y1);
    },
  };
  T.wallAt = (ctx, material, rect, o = {}) => {
    const fn = T.SET_WALLS[material];
    if (!fn) throw new Error(`set wall: unknown material "${material}" (known: ${Object.keys(T.SET_WALLS).join(', ')})`);
    fn(ctx, rect, { seed: 'wall', ...o });
  };
  T.floorAt = (ctx, material, y0, y1, o = {}) => {
    const fn = T.SET_FLOORS[material];
    if (!fn) throw new Error(`set floor: unknown material "${material}" (known: ${Object.keys(T.SET_FLOORS).join(', ')})`);
    fn(ctx, y0, y1, { seed: 'floor', ...o });
  };
})();
