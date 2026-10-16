// rich-rooms.js — painted (Places 2.0) dressing for the variant sets `room` and `studio` (extra pictures, sconces,
// window light shafts with dust, wall textures only where the wall is bare), a rebuilt `corkboard` board (framed
// cork with texture, desk-lamp pool) and an aged `parchment` (fibres, burnt edges, creases, stains; cached).
(function () {
  'use strict';
  const T = window.TOON, W = T.W, H = T.H, TAU = Math.PI * 2, OV = 420;
  const INK = '#3a281c', rgba = T.rgba;
  const ol = (ctx, path, fill, line = 4, o = {}) => T.outlined(ctx, path, fill, { line, ink: INK, ...o });
  const key = (kind, env, bg, plane) => `${kind}|${env.seed}|${T.bgKey(bg)}|${plane}`;
  const part = (ctx, kind, p, env, i = 0) => T.SET_PARTS[kind].draw(ctx, p, env, { x: (p.x ?? 0.5) * W, y: (p.y ?? 0.78) * H, s: p.scale ?? 1, seed: env.seed + kind + i });
  const texRects = (ctx, kind, rects, alpha = 0.45) => { if (T.PAINT) for (const r of rects) T.fillTexture(ctx, null, kind, { rect: r, alpha }); };
  // A light shaft from a window rect [x, y, w, h] down to the floor line fy, with dust (live).
  const shaft = (ctx, [x, y, w, h], fy, lt, seed, col = '#fff0c8', a = 0.22) => {
    const lean = -(T.PAINT ? T.PAINT.wx : 0.5) * 260, sy = y + h * 0.3, end = fy + H * 0.14;
    const poly = (k) => { k.moveTo(x, sy); k.lineTo(x + w, sy); k.lineTo(x + w + lean + w * 0.5, end); k.lineTo(x + lean - w * 0.2, end); k.closePath(); };
    const g = ctx.createLinearGradient(0, sy, 0, end); g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0));
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = g; ctx.beginPath(); poly(ctx); ctx.fill(); ctx.restore();
    T.dustMotes(ctx, Math.min(x, x + lean) - w * 0.3, sy, w * 1.8 + Math.abs(lean), end - sy, lt, seed, { n: 30, clip: poly, size: 2.6 });
  };

  // Per-variant dressing: still (cached, drawn after the variant's back plane) and live overlays.
  const DRESS = {
    hospital: {
      still(ctx, env) {
        texRects(ctx, 'plaster', [[-OV, -OV, W * 0.46 + OV, H * 0.62 + OV], [W * 0.5 + 640, -OV, W, H * 0.62 + OV]], 0.5);
        ol(ctx, (k) => k.rect(W * 0.3 - 70, H * 0.2, 140, 180), '#c8a878', 4, { shade: (k) => { k.fillStyle = '#f4f2ea'; k.fillRect(W * 0.3 - 56, H * 0.2 + 30, 112, 140); k.fillStyle = rgba('#3a4a6a', 0.6); for (let i = 0; i < 6; i++) k.fillRect(W * 0.3 - 44, H * 0.2 + 50 + i * 20, 60 + (i % 3) * 14, 5); k.strokeStyle = '#c84a3a'; k.lineWidth = 3; k.beginPath(); k.moveTo(W * 0.3 - 40, H * 0.2 + 165); for (let i = 0; i < 6; i++) k.lineTo(W * 0.3 - 40 + i * 16, H * 0.2 + 160 - (i % 2) * 20 - i * 3); k.stroke(); } });
        ol(ctx, (k) => k.rect(W * 0.3 - 20, H * 0.2 - 12, 40, 18), '#8a8a8a', 3);
        T.texBox(ctx, W * 0.86, H * 0.2, 200, 260, '#e8eef0', null, { line: 5, detail: (k) => { k.fillStyle = rgba('#a8c8d8', 0.5); k.fillRect(W * 0.86 + 16, H * 0.2 + 16, 168, 110); for (let i = 0; i < 5; i++) { k.fillStyle = ['#c84a3a', '#4a8ac8', '#e8c860', '#6ab06a', '#f4f4f4'][i]; k.fillRect(W * 0.86 + 26 + i * 32, H * 0.2 + 60, 20, 60); } k.strokeStyle = rgba(INK, 0.5); k.lineWidth = 3; k.strokeRect(W * 0.86 + 16, H * 0.2 + 140, 168, 100); } });
        if (T.PAINT) T.fillTexture(ctx, null, 'stone', { rect: [-OV, H * 0.62, W + OV * 2, H], alpha: 0.2, scale: 1.4 });
      },
      live(ctx, env, lt) { shaft(ctx, [W * 0.5, H * 0.08, 520, 420], H * 0.62, lt, env.seed + 'hs', '#fffaf0', 0.2); },
    },
    parlour: {
      still(ctx, env) {
        texRects(ctx, 'paper', [[W * 0.22, -OV, W * 0.2, H * 0.55 + OV], [W * 0.58, -OV, W * 0.12, H * 0.42 + OV], [W * 0.9, -OV, W * 0.1 + OV, H * 0.55 + OV]], 0.5);
        part(ctx, 'painting', { x: 0.32, y: 0.1, w: 0.08, h: 0.14, subject: 'portrait' }, env, 1);
        part(ctx, 'painting', { x: 0.64, y: 0.12, w: 0.06, h: 0.09, subject: 'landscape' }, env, 2);
        for (const x of [0.42, 0.58]) part(ctx, 'lamp', { x, y: 0.32, style: 'sconce' }, env, x);
      },
      live(ctx, env, lt) {
        shaft(ctx, [W * 0.08, H * 0.08, 260, 420], H * 0.8, lt, env.seed + 'ps', '#ffe8c0', 0.24);
        for (const x of [0.42, 0.58]) T.lampPool(ctx, x * W, H * 0.3, 260, '#ffd890', 0.4, lt, env.seed + x);
      },
    },
    bedroom: {
      still(ctx, env) {
        texRects(ctx, 'paper', [[W * 0.17, -OV, W * 0.6, H * 0.3 + OV], [W * 0.93, -OV, W * 0.07 + OV, H * 0.46 + OV]], 0.45);
        part(ctx, 'painting', { x: 0.5, y: 0.08, w: 0.1, h: 0.12, subject: 'sea' }, env, 1);
        part(ctx, 'painting', { x: 0.24, y: 0.12, w: 0.05, h: 0.08, subject: 'portrait' }, env, 2);
        part(ctx, 'painting', { x: 0.7, y: 0.14, w: 0.05, h: 0.07, subject: 'landscape' }, env, 3);
      },
      live(ctx, env, lt, bg) { const night = (bg.window ?? 'night') === 'night'; shaft(ctx, [W * 0.78, H * 0.12, 280, 300], H * 0.8, lt, env.seed + 'bs', night ? '#b8c8ff' : '#fff0c8', night ? 0.16 : 0.22); },
    },
    living: {
      still(ctx, env) {
        part(ctx, 'painting', { x: 0.3, y: 0.08, w: 0.07, h: 0.11, subject: 'landscape' }, env, 1);
        part(ctx, 'painting', { x: 0.6, y: 0.06, w: 0.06, h: 0.09, subject: 'abstract' }, env, 2);
      },
      live(ctx, env, lt) { shaft(ctx, [W * 0.08, H * 0.12, 300, 340], H * 0.72, lt, env.seed + 'ls', '#ffe0b0', 0.22); },
    },
    gamer: {
      still() {},
      live(ctx, env, lt) { T.dustMotes(ctx, W * 0.3, H * 0.2, W * 0.5, H * 0.6, lt, env.seed + 'gd', { n: 30, color: '#c8e0ff', alpha: 0.5, size: 2.2 }); },
    },
  };
  T.ROOM_DRESS = DRESS;
  T.richBg('room', (ctx, bg, lt, env) => {
    const PL = T.PLACE, v = PL.variantOf(bg, Object.keys(T.ROOM), 'gamer', 'room'), d = DRESS[v];
    T.ROOM[v](ctx, bg, lt, env, PL.seedOf(env, 'room', bg));
    if (d) {
      T.plane(ctx, env, { f: 0.6, key: key('room', env, bg, v) }, (g) => d.still(g, env, bg));
      T.plane(ctx, env, { f: 0.6, live: true }, (g) => d.live(g, env, lt, bg));
    }
    PL.vignette(ctx, bg.vignette ?? 0.35);
    T.BG_FRONT.room(ctx, bg, lt, env);
  });

  T.richBg('studio', (ctx, bg, lt, env) => {
    const PL = T.PLACE, v = PL.variantOf(bg, Object.keys(T.STUDIO), 'gameshow', 'studio'), seed = PL.seedOf(env, 'studio', bg);
    T.STUDIO[v].back(ctx, bg, lt, env, seed);
    if (v === 'courtroom') {
      T.plane(ctx, env, { f: 0.6, key: key('studio', env, bg, v) }, (g) => {
        for (const x of [350, 1450]) T.SET_PARTS.banner.draw(g, { y: 0.06 }, env, { x, y: 0, s: 0.8, seed: 'cb' + x });
        ol(g, (k) => k.arc(W * 0.5, H * 0.56, 70, 0, TAU), '#d8a83a', 6, { shade: (k) => { k.strokeStyle = '#8a6a1a'; k.lineWidth = 5; k.beginPath(); k.arc(W * 0.5, H * 0.56, 52, 0, TAU); k.stroke(); k.fillStyle = '#8a6a1a'; k.fillRect(W * 0.5 - 4, H * 0.56 - 36, 8, 60); k.fillRect(W * 0.5 - 34, H * 0.56 - 30, 68, 6); } }); // seal of the court
      });
      T.plane(ctx, env, { f: 0.6, live: true }, (g) => {
        for (const x of [350, 1450]) T.SET_PARTS.banner.live(g, { y: 0.06, color: '#2a3a7a', emblem: 'star', h: 0.3 }, lt, env, { x, y: 0, s: 0.8, seed: env.seed + 'cb' + x });
        shaft(g, [W * 0.5 - 150, H * 0.05, 300, H * 0.45], H * 0.62, lt, env.seed + 'cs', '#fff0c0', 0.24);
      });
    } else T.plane(ctx, env, { f: 0.6, live: true }, (g) => { // generic stage haze: soft overhead cone with dust
      const gr = g.createLinearGradient(0, -100, 0, H); gr.addColorStop(0, rgba('#fff8e0', 0.16)); gr.addColorStop(1, rgba('#fff8e0', 0));
      g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = gr; g.beginPath(); g.moveTo(W * 0.42, -100); g.lineTo(W * 0.58, -100); g.lineTo(W * 0.78, H); g.lineTo(W * 0.22, H); g.closePath(); g.fill(); g.restore();
      T.dustMotes(g, W * 0.2, 0, W * 0.6, H * 0.9, lt, seed + 'st', { n: 28, alpha: 0.55 });
    });
    PL.vignette(ctx, bg.vignette ?? 0.3);
    T.STUDIO[v].front(ctx, bg, lt, env, seed);
  });

  // ---------- corkboard ----------
  T.richBg('corkboard', (ctx, bg, lt, env, classic) => {
    const felt = bg.board === 'felt', base = felt ? '#5c7d92' : '#b98a52';
    T.plane(ctx, env, { f: 1, key: key('cork', env, bg, 'board') }, (g) => {
      T.wallAt(g, 'wood', [-OV, -OV, W + OV * 2, H + OV * 2], { color: '#5a3a22', seed: 'corkwall' });
      const x = -OV * 0.4 + 20, y = H * 0.02 - 40, w = W + OV * 0.8 - 40, h = H * 0.96 + 80;
      T.texBox(g, x - 40, y - 40, w + 80, h + 80, '#7a4a2a', 'wood', { line: 6 });
      T.texBox(g, x, y, w, h, base, felt ? 'fabric' : 'paper', { line: 5, alpha: 0.8, scale: 1.3, detail: (k) => {
        const r = T.rng(T.hash(env.seed + 'cork')); for (let i = 0; i < 2200; i++) { k.fillStyle = r() > 0.5 ? rgba(T.shade(base, -0.35), 0.45) : rgba(T.mix(base, '#ffffff', 0.3), 0.35); k.fillRect(x + r() * w, y + r() * h, 2 + r() * 3, 2 + r() * 3); }
        const sh = k.createLinearGradient(0, y, 0, y + 60); sh.addColorStop(0, rgba('#140a06', 0.4)); sh.addColorStop(1, rgba('#140a06', 0)); k.fillStyle = sh; k.fillRect(x, y, w, 60);
        for (let i = 0; i < 14; i++) { k.fillStyle = rgba('#3a2010', 0.35); k.beginPath(); k.arc(x + r() * w, y + r() * h, 3, 0, TAU); k.fill(); } // old pin holes
      } });
    });
    classic(ctx, bg, lt, { ...env, richBase: true });
    T.lampPool(ctx, W * 0.18, H * 0.12, 900, '#ffe0a0', 0.22, lt, env.seed + 'desk');
  });

  // ---------- parchment ----------
  T.richBg('parchment', (ctx, bg, lt, env, classic) => {
    T.plane(ctx, env, { f: bg.z ?? 1, key: key('parch', env, bg, 'sheet') }, (g) => {
      classic(g, bg, lt, { ...env, cam: null });
      T.fillTexture(g, null, 'paper', { rect: [-OV, -OV, W + OV * 2, H + OV * 2], alpha: 0.85, scale: 1.6 });
      const r = T.rng(T.hash(env.seed + 'parchment'));
      for (const [x0, y0, x1, y1] of [[W * 0.5, -OV, W * 0.5, H + OV], [-OV, H * 0.5, W + OV, H * 0.5]]) { // fold creases
        g.strokeStyle = rgba('#6a4a1a', 0.22); g.lineWidth = 6; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
        g.strokeStyle = rgba('#fff8e0', 0.35); g.lineWidth = 3; g.beginPath(); g.moveTo(x0 + 4, y0 + 4); g.lineTo(x1 + 4, y1 + 4); g.stroke();
      }
      for (let i = 0; i < 3; i++) { const x = r() * W, y = r() * H, rad = 40 + r() * 60; g.strokeStyle = rgba('#7a4a1a', 0.18); g.lineWidth = 5; g.beginPath(); g.arc(x, y, rad, 0, TAU); g.stroke(); } // stain rings
      for (let i = 0; i < 18; i++) { g.fillStyle = rgba('#3a2010', 0.25); g.beginPath(); g.arc(r() * W, r() * H, 1.5 + r() * 3, 0, TAU); g.fill(); }
      const e = g.createRadialGradient(W / 2, H / 2, H * 0.5, W / 2, H / 2, W * 0.66); // scorched, darker edges
      e.addColorStop(0, rgba('#5a3008', 0)); e.addColorStop(0.75, rgba('#5a3008', 0.25)); e.addColorStop(1, rgba('#2a1404', 0.6));
      g.fillStyle = e; g.fillRect(-OV, -OV, W + OV * 2, H + OV * 2);
    });
  });
})();
