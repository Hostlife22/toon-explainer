// set-parts.js — the set kit's architecture parts (T.SET_PARTS): wall, floor, window (view, mullions, light shaft
// with dust motes), door, arch, column, roof beams, stairs, fireplace (fire + glow), curtain (sway), painting, lamp
// (floor / table / hanging / sconce, warm pool), chandelier, banner (wave) and pipes (steam). A part is
// {draw(ctx, p, env, S), live?(ctx, p, lt, env, S)}: draw is static (cached with its plane in the painted look),
// live runs every frame. S = {x, y, s, seed} in world px. Wall-hung parts use y = top edge; standing parts y = floor.
(function () {
  'use strict';
  const T = window.TOON, W = T.W, H = T.H, TAU = Math.PI * 2;
  const INK = '#3a281c', rgba = T.rgba;
  const ol = (ctx, path, fill, line = 4, o = {}) => T.outlined(ctx, path, fill, { line, ink: INK, ...o });
  const floorOf = (env) => (env && env.setFloorY) || H * 0.78;

  // ---------- window ----------
  const SKIES = { day: ['#6fb2e6', '#d6eef8', '#8fb070'], dusk: ['#3a3a7a', '#f0a070', '#4a4a5a'], sunset: ['#d0607a', '#f8d080', '#7a6a4a'], night: ['#0a1030', '#2a3a6a', '#141c30'], overcast: ['#8a96a0', '#d0d6da', '#6a7a6a'] };
  function view(ctx, x, y, w, h, kind, seed) {
    const [a, b, gnd] = SKIES[kind] || SKIES.day, g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, a); g.addColorStop(1, b); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    if (kind === 'night') { ctx.fillStyle = '#fff6d0'; ctx.beginPath(); ctx.arc(x + w * 0.7, y + h * 0.25, h * 0.07, 0, TAU); ctx.fill(); for (let i = 0; i < 14; i++) { ctx.fillRect(x + ((i * 97) % w), y + ((i * 53) % (h * 0.5)), 2.5, 2.5); } }
    else T.lampPool(ctx, x + w * 0.3, y + h * 0.3, h * 0.5, '#fff8d8', 0.5);
    const r = T.rng(T.hash(seed + 'view'));
    for (const [k, c] of [[0, T.mix(gnd, b, 0.55)], [1, gnd]]) {
      ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x, y + h);
      for (let i = 0; i <= 8; i++) ctx.lineTo(x + (w * i) / 8, y + h * (0.62 + k * 0.12) - r() * h * 0.08);
      ctx.lineTo(x + w, y + h); ctx.fill();
    }
    ctx.fillStyle = T.shade(gnd, -0.25);
    for (let i = 0; i < 4; i++) { const tx = x + r() * w, ty = y + h * (0.74 + r() * 0.06), tr = h * (0.05 + r() * 0.05); ctx.beginPath(); ctx.arc(tx, ty - tr, tr, 0, TAU); ctx.fill(); ctx.fillRect(tx - 2, ty - tr, 4, tr * 1.6); }
  }
  function winGeom(p) {
    const w = (p.w ?? 0.14) * W, h = (p.h ?? 0.34) * H, x = p.x * W - w / 2, y = (p.y ?? 0.14) * H;
    return { x, y, w, h, arch: !!p.arch, path: (k) => { if (p.arch) { k.moveTo(x, y + h); k.lineTo(x, y + w / 2); k.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); k.lineTo(x + w, y + h); k.closePath(); } else k.rect(x, y, w, h); } };
  }
  const windowPart = {
    draw(ctx, p, env, S) {
      const g = winGeom(p), fr = p.frame ?? '#6a4428', bw = 22;
      const outer = (k) => { if (g.arch) { k.moveTo(g.x - bw, g.y + g.h + bw); k.lineTo(g.x - bw, g.y + g.w / 2); k.arc(g.x + g.w / 2, g.y + g.w / 2, g.w / 2 + bw, Math.PI, 0); k.lineTo(g.x + g.w + bw, g.y + g.h + bw); k.closePath(); } else k.rect(g.x - bw, g.y - bw, g.w + bw * 2, g.h + bw * 2); };
      ctx.fillStyle = rgba('#140a06', 0.25); ctx.save(); ctx.translate(10, 14); ctx.beginPath(); outer(ctx); ctx.fill(); ctx.restore(); // cast shadow on the wall
      T.texShape(ctx, outer, fr, 'wood', { line: 5, rect: [g.x - bw, g.y - bw - g.w, g.w + bw * 2, g.h + bw * 2 + g.w] });
      ctx.save(); ctx.beginPath(); g.path(ctx); ctx.clip(); view(ctx, g.x, g.y, g.w, g.h, p.sky ?? 'day', S.seed);
      ctx.fillStyle = rgba('#ffffff', 0.14); ctx.beginPath(); ctx.moveTo(g.x + g.w * 0.15, g.y); ctx.lineTo(g.x + g.w * 0.4, g.y); ctx.lineTo(g.x + g.w * 0.05, g.y + g.h); ctx.lineTo(g.x - g.w * 0.2, g.y + g.h); ctx.fill();
      const [cols, rows] = p.mullions ?? [2, 3];
      ctx.strokeStyle = fr; ctx.lineWidth = 10; ctx.beginPath();
      for (let i = 1; i < cols; i++) { const mx = g.x + (g.w * i) / cols; ctx.moveTo(mx, g.y - g.w); ctx.lineTo(mx, g.y + g.h); }
      for (let j = 1; j < rows; j++) { const my = g.y + (g.h * j) / rows; ctx.moveTo(g.x, my); ctx.lineTo(g.x + g.w, my); }
      ctx.stroke(); ctx.strokeStyle = rgba(INK, 0.55); ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
      ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); g.path(ctx); ctx.stroke();
      T.texBox(ctx, g.x - bw - 18, g.y + g.h + bw - 4, g.w + bw * 2 + 36, 22, T.shade(fr, 0.12), 'wood', { line: 4 });
    },
    live(ctx, p, lt, env, S) {
      if (!p.light || !T.PAINT) return;
      const g = winGeom(p), P = T.PAINT, fy = floorOf(env), lean = p.lean ?? -P.wx * 280, end = fy + H * 0.16, col = p.lightColor ?? (p.sky === 'night' ? '#b8c8ff' : '#fff0c8');
      const a = (p.sky === 'night' ? 0.16 : 0.26) * (p.lightAmount ?? 1);
      const sy = g.y + g.h * (g.arch ? 0.45 : 0.2), poly = (k) => { k.moveTo(g.x, sy); k.lineTo(g.x + g.w, sy); k.lineTo(g.x + g.w + lean + g.w * 0.5, end); k.lineTo(g.x + lean - g.w * 0.25, end); k.closePath(); };
      const gr = ctx.createLinearGradient(0, g.y, 0, end);
      gr.addColorStop(0, rgba(col, a)); gr.addColorStop(0.7, rgba(col, a * 0.5)); gr.addColorStop(1, rgba(col, 0));
      ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = gr; ctx.beginPath(); poly(ctx); ctx.fill();
      const px = g.x + g.w / 2 + lean * 0.95 + g.w * 0.12, pg = ctx.createRadialGradient(px, fy + 60, 0, px, fy + 60, g.w * 1.1);
      pg.addColorStop(0, rgba(col, a * 0.9)); pg.addColorStop(1, rgba(col, 0)); ctx.fillStyle = pg; ctx.save(); ctx.translate(px, fy + 60); ctx.scale(1, 0.28); ctx.translate(-px, -(fy + 60)); ctx.fillRect(px - g.w * 1.1, fy + 60 - g.w * 1.1, g.w * 2.2, g.w * 2.2); ctx.restore();
      ctx.restore();
      if (p.dust !== false) T.dustMotes(ctx, Math.min(g.x, g.x + lean) - g.w * 0.3, g.y, g.w * 1.8 + Math.abs(lean), end - g.y, lt, S.seed, { n: 34, clip: poly, alpha: 0.75, size: 2.6 });
    },
  };

  // ---------- door / arch ----------
  const door = { draw(ctx, p, env, S) {
    const s = S.s, w = 210 * s, h = 400 * s, x = S.x - w / 2, y = S.y - h, c = p.color ?? '#6e4424';
    T.texBox(ctx, x - 22 * s, y - 24 * s, w + 44 * s, h + 24 * s, T.shade(c, -0.2), 'wood', { line: 5 });
    if (p.open) { ol(ctx, (k) => k.rect(x, y, w, h), '#1c120c', 4, { paint: false }); T.texShape(ctx, (k) => { k.moveTo(x, y); k.lineTo(x - w * 0.35, y + 20 * s); k.lineTo(x - w * 0.35, y + h + 10 * s); k.lineTo(x, y + h); k.closePath(); }, c, 'wood', { line: 5, rot: 90 }); return; }
    T.texBox(ctx, x, y, w, h, c, 'wood', { line: 5, rot: 90, detail: (k) => {
      for (const [px, py, pw, ph] of [[0.14, 0.06, 0.72, 0.38], [0.14, 0.52, 0.72, 0.42]]) { k.strokeStyle = rgba(T.shade(c, -0.5), 0.9); k.lineWidth = 4; k.strokeRect(x + px * w, y + py * h, pw * w, ph * h); k.strokeStyle = rgba('#ffe8c0', 0.25); k.lineWidth = 3; k.strokeRect(x + px * w + 5, y + py * h + 5, pw * w - 10, ph * h - 10); }
    } });
    ol(ctx, (k) => k.arc(x + w * 0.84, y + h * 0.52, 11 * s, 0, TAU), '#d8b048', 3);
  } };
  const arch = { draw(ctx, p, env, S) {
    const s = S.s, w = 340 * s, h = 520 * s, x = S.x - w / 2, y = S.y - h, c = p.color ?? '#b8ab94', t = 46 * s;
    const hole = (k) => { k.moveTo(x, S.y); k.lineTo(x, y + w / 2); k.arc(S.x, y + w / 2, w / 2, Math.PI, 0); k.lineTo(x + w, S.y); k.closePath(); };
    ctx.save(); ctx.beginPath(); hole(ctx); ctx.clip();
    if (p.view) view(ctx, x, y, w, h, p.view, S.seed); else { const g = ctx.createLinearGradient(0, y, 0, S.y); g.addColorStop(0, '#1a120e'); g.addColorStop(1, '#3a2a20'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h); }
    ctx.restore();
    T.texShape(ctx, (k) => { k.moveTo(x - t, S.y); k.lineTo(x - t, y + w / 2); k.arc(S.x, y + w / 2, w / 2 + t, Math.PI, 0); k.lineTo(x + w + t, S.y); k.lineTo(x + w, S.y); k.lineTo(x + w, y + w / 2); k.arc(S.x, y + w / 2, w / 2, 0, Math.PI, true); k.lineTo(x, S.y); k.closePath(); }, c, 'stone', { line: 5, rect: [x - t, y - t, w + t * 2, h + t] });
    for (let i = 1; i < 8; i++) { const a = Math.PI + (i * Math.PI) / 8; ctx.strokeStyle = rgba(INK, 0.6); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(S.x + Math.cos(a) * w / 2, y + w / 2 + Math.sin(a) * w / 2); ctx.lineTo(S.x + Math.cos(a) * (w / 2 + t), y + w / 2 + Math.sin(a) * (w / 2 + t)); ctx.stroke(); }
    ol(ctx, (k) => { k.moveTo(S.x - 22 * s, y - t - 6 * s); k.lineTo(S.x + 22 * s, y - t - 6 * s); k.lineTo(S.x + 15 * s, y + 4 * s); k.lineTo(S.x - 15 * s, y + 4 * s); k.closePath(); }, T.shade(c, 0.1), 4);
  } };

  // ---------- column ----------
  T.drawColumn = (ctx, cx, base, h, w, c, o = {}) => {
    const capH = w * 0.38, top = base - h;
    ol(ctx, (k) => k.rect(cx - w * 0.68, base - w * 0.3, w * 1.36, w * 0.3), T.shade(c, -0.08), 4);
    T.texShape(ctx, (k) => { k.moveTo(cx - w / 2, base - w * 0.3); k.lineTo(cx - w * 0.44, top + capH); k.lineTo(cx + w * 0.44, top + capH); k.lineTo(cx + w / 2, base - w * 0.3); k.closePath(); }, c, o.tex ?? 'stone', { line: 5, alpha: 0.3, rect: [cx - w, top, w * 2, h], detail: (k) => {
      k.strokeStyle = rgba(T.shade(c, -0.4), 0.55); k.lineWidth = Math.max(2, w * 0.035);
      for (let i = 1; i < 5; i++) { const fx = cx - w * 0.47 + (i * w * 0.94) / 5; k.beginPath(); k.moveTo(fx, base - w * 0.3); k.lineTo(fx + (cx - fx) * 0.06, top + capH); k.stroke(); }
    } });
    ol(ctx, (k) => { k.moveTo(cx - w * 0.5, top + capH); k.lineTo(cx - w * 0.72, top + capH * 0.4); k.lineTo(cx - w * 0.72, top); k.lineTo(cx + w * 0.72, top); k.lineTo(cx + w * 0.72, top + capH * 0.4); k.lineTo(cx + w * 0.5, top + capH); k.closePath(); }, T.shade(c, 0.06), 5);
    T.contactShadow(ctx, cx, base, w * 0.9, w * 0.12, 0.4);
  };
  const column = { draw(ctx, p, env, S) { T.drawColumn(ctx, S.x, S.y, (p.h ?? 0.66) * H * S.s, 96 * S.s, p.color ?? '#d8cfbc'); } };

  // ---------- roof beams ----------
  const roof = { draw(ctx, p) {
    const c = p.color ?? '#5a3a22', y = (p.y ?? 0.1) * H, n = p.count ?? 7, OV = 400;
    T.texBox(ctx, -OV, -OV, W + OV * 2, y + OV - 30, T.shade(c, -0.25), 'wood', { line: 0 });
    for (let i = 0; i < n; i++) { const x = -OV + ((i + 0.5) / n) * (W + OV * 2); T.texShape(ctx, (k) => { k.moveTo(x - 34, -OV); k.lineTo(x + 34, -OV); k.lineTo(x + 30, y); k.lineTo(x - 30, y); k.closePath(); }, c, 'wood', { line: 5, rot: 90, rect: [x - 40, -OV, 80, y + OV] }); }
    T.texBox(ctx, -OV, y - 40, W + OV * 2, 48, T.shade(c, 0.08), 'wood', { line: 5 });
    const g = ctx.createLinearGradient(0, y + 8, 0, y + 90); g.addColorStop(0, rgba('#140a06', 0.4)); g.addColorStop(1, rgba('#140a06', 0));
    ctx.fillStyle = g; ctx.fillRect(-OV, y + 8, W + OV * 2, 82);
  } };

  // ---------- stairs ----------
  const stairs = { draw(ctx, p, env, S) {
    const s = S.s, n = p.steps ?? 8, sw = 70 * s, sh = 48 * s, d = p.dir === 'left' ? -1 : 1, w = 260 * s, c = p.color ?? '#8a5a32';
    for (let i = n - 1; i >= 0; i--) {
      const x = S.x + d * i * sw, y = S.y - (i + 1) * sh;
      T.texBox(ctx, d > 0 ? x : x - sw, y, sw + 4, (i + 1) * sh, T.shade(c, -0.18), 'wood', { line: 4 });
      T.texBox(ctx, (d > 0 ? x : x - sw) - 8, y - 10 * s, sw + 16, 14 * s, T.shade(c, 0.1), 'wood', { line: 3 });
    }
    ctx.strokeStyle = INK; ctx.lineWidth = 8 * s; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(S.x - d * 10, S.y - 160 * s); ctx.lineTo(S.x + d * n * sw, S.y - n * sh - 160 * s); ctx.stroke();
    ctx.strokeStyle = T.shade(c, -0.1); ctx.lineWidth = 5 * s; ctx.stroke();
    for (let i = 0; i <= n; i += 2) { const x = S.x + d * i * sw, y = S.y - i * sh; ctx.strokeStyle = INK; ctx.lineWidth = 5 * s; ctx.beginPath(); ctx.moveTo(x, y - sh * 0.2); ctx.lineTo(x, y - 160 * s); ctx.stroke(); }
    void w;
  } };

  // ---------- fireplace ----------
  const fireplace = {
    draw(ctx, p, env, S) {
      const s = S.s, w = 440 * s, h = 380 * s, x = S.x - w / 2, y = S.y - h, c = p.color ?? '#a8988a', mat = p.material === 'brick' ? 'brick' : 'stone';
      T.texBox(ctx, x, y, w, h, c, mat, { line: 5, alpha: 0.6, scale: 0.6 });
      ol(ctx, (k) => { k.moveTo(S.x - 130 * s, S.y); k.lineTo(S.x - 130 * s, S.y - 180 * s); k.arc(S.x, S.y - 180 * s, 130 * s, Math.PI, 0); k.lineTo(S.x + 130 * s, S.y); k.closePath(); }, '#1a100c', 5, { paint: false });
      for (const [lx, a] of [[-50, 0.15], [40, -0.2]]) { ctx.save(); ctx.translate(S.x + lx * s, S.y - 22 * s); ctx.rotate(a); ol(ctx, (k) => T.rrect(k, -70 * s, -16 * s, 140 * s, 32 * s, 14 * s), '#6a4224', 3); ctx.restore(); }
      T.texBox(ctx, x - 34 * s, y - 34 * s, w + 68 * s, 38 * s, T.shade(c, -0.25), 'wood', { line: 5 });
      for (const [ix, ih] of [[-0.36, 60], [0.38, 46]]) { const cx = S.x + ix * w; ol(ctx, (k) => k.rect(cx - 9 * s, y - 34 * s - ih * s, 18 * s, ih * s), '#f4ecd8', 3); }
      ol(ctx, (k) => k.arc(S.x, y - 74 * s, 34 * s, 0, TAU), '#d8b048', 4, { shade: (k) => { k.fillStyle = '#f6f0dc'; k.beginPath(); k.arc(S.x, y - 74 * s, 25 * s, 0, TAU); k.fill(); k.strokeStyle = INK; k.lineWidth = 3; k.beginPath(); k.moveTo(S.x, y - 74 * s); k.lineTo(S.x, y - 92 * s); k.moveTo(S.x, y - 74 * s); k.lineTo(S.x + 12 * s, y - 70 * s); k.stroke(); } });
    },
    live(ctx, p, lt, env, S) {
      const s = S.s, w = 440 * s, h = 380 * s;
      T.lampPool(ctx, S.x, S.y - 60 * s, 520 * s, '#ff9a40', 0.42, lt, S.seed + 'fire');
      ctx.save(); ctx.translate(S.x, S.y - 18 * s); T.drawFlame(ctx, 150 * s, lt, S.seed + 'fl'); ctx.restore();
      for (const ix of [-0.36, 0.38]) { const cx = S.x + ix * w, top = S.y - h - 34 * s - (ix < 0 ? 60 : 46) * s; ctx.save(); ctx.translate(cx, top); T.drawFlame(ctx, 22 * s, lt, S.seed + 'c' + ix); ctx.restore(); T.lampPool(ctx, cx, top - 10 * s, 70 * s, '#ffd070', 0.35, lt, S.seed + ix); }
    },
  };

  // ---------- curtain (sways) ----------
  const curtain = {
    draw(ctx, p) { const w = (p.w ?? 0.12) * W, y0 = (p.y ?? 0.06) * H; ol(ctx, (k) => T.rrect(k, p.x * W - w * 0.7, y0 - 16, w * 1.4, 18, 8), '#c89a3a', 4); },
    live(ctx, p, lt, env, S) {
      const w = (p.w ?? 0.12) * W, y0 = (p.y ?? 0.06) * H + 2, y1 = (p.y1 ?? 0.74) * H, c = p.color ?? '#8a2a2a', x = p.x * W, open = p.closed ? 0.08 : 0.36;
      T.curtain(ctx, x - w * 0.6, x - w * open, y0, y1, c, lt, S.seed + 'l');
      T.curtain(ctx, x + w * open, x + w * 0.6, y0, y1, c, lt + 0.7, S.seed + 'r');
      for (const d of [-1, 1]) ol(ctx, (k) => T.rrect(k, x + d * w * (open + 0.6) / 2 - 30, y0 + (y1 - y0) * 0.55, 60, 18, 8), '#d8b048', 3);
    },
  };

  // ---------- painting ----------
  const SUBJECT = {
    landscape: (ctx, x, y, w, h, seed) => view(ctx, x, y, w, h, 'day', seed),
    sea: (ctx, x, y, w, h) => { const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#9ac8e0'); g.addColorStop(0.55, '#e8f0e8'); g.addColorStop(0.56, '#3a7aa0'); g.addColorStop(1, '#1a4a6a'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#f4f0e0'; ctx.beginPath(); ctx.moveTo(x + w * 0.5, y + h * 0.2); ctx.lineTo(x + w * 0.62, y + h * 0.5); ctx.lineTo(x + w * 0.5, y + h * 0.5); ctx.fill(); ctx.fillStyle = '#5a3a22'; ctx.fillRect(x + w * 0.4, y + h * 0.5, w * 0.3, h * 0.06); },
    portrait: (ctx, x, y, w, h) => { ctx.fillStyle = '#3a2a22'; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#5a3a2a'; ctx.beginPath(); ctx.ellipse(x + w / 2, y + h * 1.02, w * 0.42, h * 0.4, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#e8d0b0'; ctx.beginPath(); ctx.ellipse(x + w / 2, y + h * 0.42, w * 0.2, h * 0.2, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#4a3020'; ctx.beginPath(); ctx.ellipse(x + w / 2, y + h * 0.3, w * 0.22, h * 0.1, 0, Math.PI, 0); ctx.fill(); },
    abstract: (ctx, x, y, w, h, seed) => { const r = T.rng(T.hash(seed)); ctx.fillStyle = '#e8dcc0'; ctx.fillRect(x, y, w, h); for (let i = 0; i < 5; i++) { ctx.fillStyle = ['#c0392b', '#2a5a9a', '#e2b23c', '#2a2a2a'][i % 4]; ctx.fillRect(x + r() * w * 0.7, y + r() * h * 0.7, w * (0.1 + r() * 0.3), h * (0.1 + r() * 0.3)); } },
    dark: (ctx, x, y, w, h) => { ctx.fillStyle = '#2e2a30'; ctx.fillRect(x, y, w, h); },
  };
  const painting = { draw(ctx, p, env, S) {
    const w = (p.w ?? 0.1) * W, h = (p.h ?? 0.14) * H, x = p.x * W - w / 2, y = (p.y ?? 0.2) * H, fr = p.frame ?? '#c8962e', b = Math.max(16, w * 0.09);
    ctx.fillStyle = rgba('#140a06', 0.3); ctx.fillRect(x - b + 10, y - b + 14, w + b * 2, h + b * 2);
    ol(ctx, (k) => k.rect(x - b, y - b, w + b * 2, h + b * 2), fr, 5, { shade: (k) => { k.strokeStyle = rgba(T.shade(fr, -0.45), 0.9); k.lineWidth = 3; k.strokeRect(x - b * 0.55, y - b * 0.55, w + b * 1.1, h + b * 1.1); k.strokeStyle = rgba('#fff0b0', 0.5); k.lineWidth = 3; k.beginPath(); k.moveTo(x - b + 4, y + h + b - 4); k.lineTo(x - b + 4, y - b + 4); k.lineTo(x + w + b - 4, y - b + 4); k.stroke(); } });
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); (SUBJECT[p.subject ?? 'landscape'] || SUBJECT.landscape)(ctx, x, y, w, h, S.seed);
    if (T.PAINT) T.fillTexture(ctx, null, 'fabric', { rect: [x, y, w, h], alpha: 0.35, scale: 0.6 });
    ctx.restore();
    ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.strokeRect(x, y, w, h);
    if (p.plaque) { ol(ctx, (k) => T.rrect(k, p.x * W - 90, y + h + b + 16, 180, 40, 5), '#e8d088', 3); T.toonText(ctx, String(p.plaque), p.x * W, y + h + b + 44, { size: 24, fill: INK, stroke: 0, shadow: false }); }
  } };

  // ---------- lamps ----------
  function lampGeom(p, S) {
    const s = S.s, style = p.style ?? 'floor';
    if (style === 'hanging') return { style, s, hx: S.x, hy: S.y, top: -400 };
    if (style === 'sconce') return { style, s, hx: S.x, hy: S.y };
    if (style === 'table') return { style, s, hx: S.x, hy: S.y - 120 * s };
    return { style, s, hx: S.x, hy: S.y - 330 * s };
  }
  const lamp = {
    draw(ctx, p, env, S) {
      const g = lampGeom(p, S), s = g.s, shade = p.shade ?? (g.style === 'hanging' ? '#2f5a3a' : '#f0d28a'), metal = '#3a2e26';
      if (g.style === 'hanging') { ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(g.hx, g.top); ctx.lineTo(g.hx, g.hy - 60 * s); ctx.stroke(); ol(ctx, (k) => { k.moveTo(g.hx - 80 * s, g.hy); k.lineTo(g.hx - 30 * s, g.hy - 64 * s); k.lineTo(g.hx + 30 * s, g.hy - 64 * s); k.lineTo(g.hx + 80 * s, g.hy); k.closePath(); }, shade, 5); return; }
      if (g.style === 'sconce') { ol(ctx, (k) => T.rrect(k, g.hx - 14 * s, g.hy, 28 * s, 60 * s, 8 * s), '#b8902e', 3); ol(ctx, (k) => { k.moveTo(g.hx - 34 * s, g.hy + 8 * s); k.lineTo(g.hx - 22 * s, g.hy - 40 * s); k.lineTo(g.hx + 22 * s, g.hy - 40 * s); k.lineTo(g.hx + 34 * s, g.hy + 8 * s); k.closePath(); }, shade, 4); return; }
      const base = S.y;
      if (g.style === 'floor') { ol(ctx, (k) => k.rect(g.hx - 6 * s, g.hy, 12 * s, base - g.hy), metal, 3); ol(ctx, (k) => k.ellipse(g.hx, base - 6 * s, 60 * s, 14 * s, 0, 0, TAU), metal, 3); T.contactShadow(ctx, g.hx, base, 70 * s, 10 * s, 0.4); }
      else { ol(ctx, (k) => { k.moveTo(g.hx - 34 * s, base); k.quadraticCurveTo(g.hx - 40 * s, g.hy + 40 * s, g.hx - 8 * s, g.hy + 8 * s); k.lineTo(g.hx + 8 * s, g.hy + 8 * s); k.quadraticCurveTo(g.hx + 40 * s, g.hy + 40 * s, g.hx + 34 * s, base); k.closePath(); }, '#7a3a2a', 4); }
      ol(ctx, (k) => { k.moveTo(g.hx - 70 * s, g.hy + 10 * s); k.lineTo(g.hx - 42 * s, g.hy - 76 * s); k.lineTo(g.hx + 42 * s, g.hy - 76 * s); k.lineTo(g.hx + 70 * s, g.hy + 10 * s); k.closePath(); }, shade, 4);
    },
    live(ctx, p, lt, env, S) {
      if (p.on === false) return;
      const g = lampGeom(p, S), s = g.s, col = p.light ?? '#ffd890', k = T.flicker(lt, S.seed, p.flicker ?? 0.05);
      T.lampPool(ctx, g.hx, g.hy - 10 * s, (p.radius ?? (g.style === 'hanging' ? 520 : 380)) * s * k, col, 0.42 * k);
      if (g.style !== 'sconce') { // cone of light under the shade
        const y0 = g.hy + 6 * s, y1 = g.style === 'hanging' ? floorOf(env) + 40 : S.y + 20 * s, gr = ctx.createLinearGradient(0, y0, 0, y1);
        gr.addColorStop(0, rgba(col, 0.24 * k)); gr.addColorStop(1, rgba(col, 0));
        ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(g.hx - 66 * s, y0); ctx.lineTo(g.hx + 66 * s, y0); ctx.lineTo(g.hx + 66 * s + (y1 - y0) * 0.45, y1); ctx.lineTo(g.hx - 66 * s - (y1 - y0) * 0.45, y1); ctx.closePath(); ctx.fill(); ctx.restore();
      }
    },
  };
  const chandelier = {
    draw(ctx, p, env, S) {
      const s = S.s, y = S.y;
      ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(S.x, -400); ctx.lineTo(S.x, y - 60 * s); ctx.stroke();
      ol(ctx, (k) => { k.moveTo(S.x - 160 * s, y); k.quadraticCurveTo(S.x, y + 70 * s, S.x + 160 * s, y); k.lineTo(S.x + 150 * s, y + 14 * s); k.quadraticCurveTo(S.x, y + 90 * s, S.x - 150 * s, y + 14 * s); k.closePath(); }, '#c8962e', 4);
      ol(ctx, (k) => k.ellipse(S.x, y - 30 * s, 26 * s, 40 * s, 0, 0, TAU), '#d8a83a', 4);
      for (let i = 0; i < 5; i++) { const cx = S.x + (i - 2) * 72 * s, cy = y - 6 * s + Math.abs(i - 2) * -10 * s; ol(ctx, (k) => k.rect(cx - 7 * s, cy - 40 * s, 14 * s, 40 * s), '#f4ecd8', 3); }
    },
    live(ctx, p, lt, env, S) {
      const s = S.s, y = S.y;
      T.lampPool(ctx, S.x, y, 600 * s, '#ffd890', 0.38, lt, S.seed);
      for (let i = 0; i < 5; i++) { const cx = S.x + (i - 2) * 72 * s, cy = y - 46 * s + Math.abs(i - 2) * -10 * s; ctx.save(); ctx.translate(cx, cy); T.drawFlame(ctx, 22 * s, lt, S.seed + i); ctx.restore(); }
    },
  };

  // ---------- banner (waves) ----------
  const EMBLEM = {
    circle: (k, x, y, r) => { k.beginPath(); k.arc(x, y, r, 0, TAU); k.fill(); },
    star: (k, x, y, r) => { k.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r; k.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } k.closePath(); k.fill(); },
    cross: (k, x, y, r) => { k.fillRect(x - r * 0.2, y - r, r * 0.4, r * 2); k.fillRect(x - r, y - r * 0.2, r * 2, r * 0.4); },
    crown: (k, x, y, r) => { k.beginPath(); k.moveTo(x - r, y + r * 0.5); k.lineTo(x - r, y - r * 0.4); k.lineTo(x - r * 0.5, y + r * 0.05); k.lineTo(x, y - r * 0.7); k.lineTo(x + r * 0.5, y + r * 0.05); k.lineTo(x + r, y - r * 0.4); k.lineTo(x + r, y + r * 0.5); k.closePath(); k.fill(); },
  };
  const banner = {
    draw(ctx, p, env, S) { const s = S.s, y = (p.y ?? 0.08) * H; ol(ctx, (k) => T.rrect(k, S.x - 110 * s, y - 14 * s, 220 * s, 18 * s, 8 * s), '#c89a3a', 4); },
    live(ctx, p, lt, env, S) {
      const s = S.s, y = (p.y ?? 0.08) * H, w = 170 * s, h = (p.h ?? 0.4) * H, c = p.color ?? '#8a1a1a', wv = T.sway(lt, S.seed, 0.3, 10 * s);
      const path = (k) => { k.moveTo(S.x - w / 2, y); k.lineTo(S.x + w / 2, y); k.quadraticCurveTo(S.x + w / 2 + wv, y + h * 0.5, S.x + w / 2 + wv * 1.4, y + h); k.lineTo(S.x + wv * 1.2, y + h - 50 * s); k.lineTo(S.x - w / 2 + wv * 1.4, y + h); k.quadraticCurveTo(S.x - w / 2 + wv, y + h * 0.5, S.x - w / 2, y); k.closePath(); };
      T.texShape(ctx, path, c, 'fabric', { line: 5, rect: [S.x - w, y, w * 2, h], alpha: 0.4, detail: (k) => {
        k.fillStyle = p.trim ?? '#e2b23c'; k.fillRect(S.x - w / 2, y + 18 * s, w + 30, 10 * s);
        if (p.emblem !== 'none') { k.fillStyle = p.trim ?? '#e2b23c'; (EMBLEM[p.emblem] || EMBLEM.circle)(k, S.x + wv * 0.6, y + h * 0.42, 40 * s); }
      } });
    },
  };

  // ---------- pipes (steam) ----------
  const pipes = {
    draw(ctx, p) {
      const c = p.color ?? '#7a6a5a', OV = 400;
      for (const [i, y] of (p.rows ?? [0.16, 0.24]).entries()) {
        const py = y * H, d = 26 - i * 6;
        ol(ctx, (k) => k.rect(-OV, py - d, W + OV * 2, d * 2), c, 4, { shade: (k) => { k.fillStyle = rgba('#ffffff', 0.25); k.fillRect(-OV, py - d + 5, W + OV * 2, 6); } });
        for (let x = -OV + 160 + i * 90; x < W + OV; x += 380) { ol(ctx, (k) => k.rect(x - 14, py - d - 8, 28, d * 2 + 16), T.shade(c, -0.15), 4); }
      }
      for (const vx of p.drops ?? [0.12, 0.86]) { const x = vx * W; ol(ctx, (k) => k.rect(x - 18, (p.rows ?? [0.16])[0] * H, 36, H * 0.7), c, 4, { shade: (k) => { k.fillStyle = rgba('#ffffff', 0.22); k.fillRect(x - 12, 0, 6, H); } }); ol(ctx, (k) => k.arc(x, (p.rows ?? [0.16])[0] * H + H * 0.28, 30, 0, TAU), '#a83a2a', 4); }
    },
    live(ctx, p, lt, env, S) {
      if (p.steam === false) return;
      for (const vx of p.drops ?? [0.12, 0.86]) T.softSmoke(ctx, vx * W + 34, (p.rows ?? [0.16])[0] * H + H * 0.28, lt, { seed: S.seed + vx, color: '#eef2f4', rise: 140, size: 22, drift: 70, n: 5, alpha: 0.6 });
    },
  };

  // ---------- wall and floor as parts ----------
  const OV = 420;
  const wall = { draw(ctx, p, env, S) { T.wallAt(ctx, p.material ?? 'plaster', [-OV, -OV, W + OV * 2, (p.y ?? 0.78) * H + OV], { color: p.color, seed: S.seed, trim: p.trim }); } };
  const floor = { draw(ctx, p, env, S) { T.floorAt(ctx, p.material ?? 'wood', (p.y ?? 0.78) * H, H + OV, { color: p.color, colors: p.colors, seed: S.seed, vx: p.vx != null ? p.vx * W : undefined }); } };

  T.SET_PARTS = Object.assign(T.SET_PARTS || {}, { wall, floor, window: windowPart, door, arch, column, roof, stairs, fireplace, curtain, painting, lamp, chandelier, banner, pipes });
  T.SET_VIEW = view;
})();
