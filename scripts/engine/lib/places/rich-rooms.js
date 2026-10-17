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
    if (!T.frontRouted(bg)) T.BG_FRONT.room(ctx, bg, lt, env);
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
    if (!T.frontRouted(bg)) T.STUDIO[v].front(ctx, bg, lt, env, seed);
  });

  // ---------- corkboard ----------
  // Background clutter of an investigation board (drawn under the spec's own notes): clippings, photos, a map scrap,
  // index cards and sticky notes, each pinned, plus red yarn between some of them.
  function pin(ctx, x, y, col) {
    ctx.fillStyle = rgba('#140a06', 0.35); ctx.beginPath(); ctx.ellipse(x + 7, y + 9, 9, 6, 0.4, 0, TAU); ctx.fill();
    ol(ctx, (k) => k.arc(x, y, 10, 0, TAU), col, 3); ctx.fillStyle = rgba('#ffffff', 0.7); ctx.beginPath(); ctx.arc(x - 3, y - 3, 3.5, 0, TAU); ctx.fill();
  }
  const DECOR = {
    clipping(k, w, h, r) { k.fillStyle = '#ece4d0'; k.fillRect(-w / 2, -h / 2, w, h); k.fillStyle = '#2a2622'; k.fillRect(-w / 2 + 14, -h / 2 + 14, w - 28, 22); k.fillStyle = '#9a948a'; k.fillRect(-w / 2 + 14, -h / 2 + 46, w * 0.45, h * 0.32); k.fillStyle = rgba('#3a3630', 0.55); for (let i = 0; i < 9; i++) k.fillRect(i < 4 ? 8 : -w / 2 + 14, -h / 2 + 50 + i * 16, (i < 4 ? w / 2 - 22 : w - 28) * (0.7 + r() * 0.3), 5); },
    photo(k, w, h, r) { k.fillStyle = '#f6f4ee'; k.fillRect(-w / 2, -h / 2, w, h); k.fillStyle = ['#7a8a90', '#8a7a6a', '#6a7a6a'][Math.floor(r() * 3)]; k.fillRect(-w / 2 + 12, -h / 2 + 12, w - 24, h - 50); k.fillStyle = '#3a3a40'; k.beginPath(); k.arc(0, -h / 2 + 12 + (h - 50) * 0.42, w * 0.15, 0, TAU); k.fill(); k.beginPath(); k.ellipse(0, -h / 2 + h - 38, w * 0.3, (h - 50) * 0.3, 0, Math.PI, 0); k.fill(); },
    map(k, w, h) { k.fillStyle = '#e4d6b0'; k.fillRect(-w / 2, -h / 2, w, h); k.strokeStyle = '#5a8ab0'; k.lineWidth = 6; k.beginPath(); k.moveTo(-w / 2, -h * 0.1); k.bezierCurveTo(-w * 0.1, -h * 0.4, w * 0.1, h * 0.3, w / 2, h * 0.1); k.stroke(); k.strokeStyle = rgba('#7a6a4a', 0.5); k.lineWidth = 2; for (let i = 1; i < 4; i++) { k.beginPath(); k.moveTo(-w / 2, -h / 2 + (i * h) / 4); k.lineTo(w / 2, -h / 2 + (i * h) / 4); k.moveTo(-w / 2 + (i * w) / 4, -h / 2); k.lineTo(-w / 2 + (i * w) / 4, h / 2); k.stroke(); } k.strokeStyle = '#c0392b'; k.lineWidth = 6; k.beginPath(); k.moveTo(w * 0.1, -h * 0.05); k.lineTo(w * 0.22, h * 0.12); k.moveTo(w * 0.22, -h * 0.05); k.lineTo(w * 0.1, h * 0.12); k.stroke(); },
    card(k, w, h) { k.fillStyle = '#fbf8f0'; k.fillRect(-w / 2, -h / 2, w, h); k.strokeStyle = rgba('#7aa0c8', 0.7); k.lineWidth = 2; for (let y = -h / 2 + 34; y < h / 2; y += 18) { k.beginPath(); k.moveTo(-w / 2, y); k.lineTo(w / 2, y); k.stroke(); } k.strokeStyle = '#d04a4a'; k.beginPath(); k.moveTo(-w / 2, -h / 2 + 26); k.lineTo(w / 2, -h / 2 + 26); k.stroke(); k.strokeStyle = rgba('#2a2a5a', 0.7); k.lineWidth = 3; for (let y = -h / 2 + 30; y < h / 2 - 10; y += 18) { k.beginPath(); for (let x = -w / 2 + 12; x < w / 2 - 20; x += 10) k.lineTo(x, y + Math.sin(x * 0.7 + y) * 3); k.stroke(); } },
    sticky(k, w) { k.fillStyle = '#f2d86a'; k.fillRect(-w / 2, -w / 2, w, w); k.fillStyle = rgba('#000000', 0.08); k.fillRect(-w / 2, -w / 2, w, 16); k.strokeStyle = rgba('#3a2a1a', 0.7); k.lineWidth = 3; k.beginPath(); k.moveTo(-w * 0.3, -w * 0.1); k.lineTo(w * 0.3, -w * 0.12); k.moveTo(-w * 0.3, w * 0.12); k.lineTo(w * 0.15, w * 0.1); k.stroke(); },
  };
  const DSIZE = { clipping: [240, 300], photo: [190, 220], map: [320, 230], card: [230, 150], sticky: [130, 130] };
  function corkDecor(ctx, seed) {
    const r = T.rng(T.hash(seed)), kinds = Object.keys(DECOR), pins = [];
    for (let i = 0; i < 20; i++) {
      const kind = kinds[i % kinds.length], [w, h] = DSIZE[kind], x = W * (0.04 + r() * 0.92), y = H * (0.1 + r() * 0.8), a = (r() - 0.5) * 0.3;
      ctx.save(); ctx.translate(x, y); ctx.rotate(a);
      ctx.fillStyle = rgba('#140a06', 0.3); ctx.fillRect(-w / 2 + 8, -h / 2 + 10, w, h);
      DECOR[kind](ctx, w, h, r);
      if (T.PAINT) T.fillTexture(ctx, null, 'paper', { rect: [-w / 2, -h / 2, w, h], alpha: 0.6 });
      ctx.strokeStyle = rgba('#3a281c', 0.6); ctx.lineWidth = 2.5; ctx.strokeRect(-w / 2, -h / 2, w, h);
      ctx.restore();
      const px = x + Math.sin(a) * h * 0.42, py = y - Math.cos(a) * h * 0.42;
      pins.push([px, py]); pin(ctx, px, py, ['#c0392b', '#2a6ac0', '#2a9a5a', '#e2b23c'][Math.floor(r() * 4)]);
    }
    ctx.strokeStyle = rgba('#b02a22', 0.85); ctx.lineWidth = 4;
    for (let i = 0; i < 7; i++) { const [a, b] = [pins[Math.floor(r() * pins.length)], pins[Math.floor(r() * pins.length)]]; if (a === b) continue; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 30, b[0], b[1]); ctx.stroke(); }
  }
  T.richBg('corkboard', (ctx, bg, lt, env, classic) => {
    const felt = bg.board === 'felt', base = felt ? '#5c7d92' : '#b98a52';
    T.plane(ctx, env, { f: 1, key: key('cork', env, bg, 'board') }, (g) => {
      T.wallAt(g, 'wood', [-OV, -OV, W + OV * 2, H + OV * 2], { color: '#5a3a22', seed: 'corkwall' });
      const x = -OV * 0.4 + 20, y = H * 0.02 - 40, w = W + OV * 0.8 - 40, h = H * 0.96 + 80;
      T.texBox(g, x - 40, y - 40, w + 80, h + 80, '#7a4a2a', 'wood', { line: 6 });
      T.texBox(g, x, y, w, h, base, felt ? 'fabric' : 'paper', { line: 5, alpha: 0.6, scale: 1.3, detail: (k) => {
        const r = T.rng(T.hash(env.seed + 'cork'));
        for (let i = 0; i < 26; i++) { const px = x + r() * w, py = y + r() * h, rad = 80 + r() * 200, gr = k.createRadialGradient(px, py, 0, px, py, rad), d = r() < 0.5; gr.addColorStop(0, rgba(d ? T.shade(base, -0.3) : T.mix(base, '#fff0d0', 0.3), 0.25)); gr.addColorStop(1, rgba(base, 0)); k.fillStyle = gr; k.fillRect(px - rad, py - rad, rad * 2, rad * 2); }
        if (!felt) for (let i = 0; i < 6500; i++) { // cork granules: small chips in three tones
          const t = r(); k.fillStyle = t < 0.4 ? rgba(T.shade(base, -0.4), 0.55) : t < 0.75 ? rgba(T.shade(base, -0.15), 0.5) : rgba(T.mix(base, '#fff4dc', 0.4), 0.5);
          k.beginPath(); k.ellipse(x + r() * w, y + r() * h, 1.5 + r() * 3.5, 1 + r() * 2.5, r() * 3, 0, TAU); k.fill();
        }
        else for (let i = 0; i < 2200; i++) { k.fillStyle = r() > 0.5 ? rgba(T.shade(base, -0.35), 0.45) : rgba(T.mix(base, '#ffffff', 0.3), 0.35); k.fillRect(x + r() * w, y + r() * h, 2 + r() * 3, 2 + r() * 3); }
        for (let i = 0; i < 30; i++) { k.fillStyle = rgba('#3a2010', 0.45); k.beginPath(); k.arc(x + r() * w, y + r() * h, 2.5, 0, TAU); k.fill(); } // old pin holes
      } });
      if (bg.decor !== false) corkDecor(g, env.seed + 'decor');
      const fr = '#6a4026', b = 34; // the board's wooden frame along the frame edges
      for (const [fx, fy, fw, fh] of [[-OV, -OV, W + OV * 2, OV + b], [-OV, H - b, W + OV * 2, OV + b], [-OV, -OV, OV + b, H + OV * 2], [W - b, -OV, OV + b, H + OV * 2]]) T.texBox(g, fx, fy, fw, fh, fr, 'wood', { line: 6, rot: fw > fh ? 0 : 90 });
      const sh = g.createLinearGradient(0, b, 0, b + 70); sh.addColorStop(0, rgba('#140a06', 0.45)); sh.addColorStop(1, rgba('#140a06', 0)); g.fillStyle = sh; g.fillRect(b, b, W - b * 2, 70);
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
      for (let i = 0; i < 3; i++) { const x = r() * W, y = r() * H, rad = 40 + r() * 60; g.fillStyle = rgba('#8a5a20', 0.08); g.beginPath(); g.arc(x, y, rad, 0, TAU); g.fill(); g.strokeStyle = rgba('#7a4a1a', 0.3); g.lineWidth = 6; g.beginPath(); g.arc(x, y, rad, 0, TAU); g.stroke(); } // stain rings
      for (let i = 0; i < 18; i++) { g.fillStyle = rgba('#3a2010', 0.25); g.beginPath(); g.arc(r() * W, r() * H, 1.5 + r() * 3, 0, TAU); g.fill(); }
      if (bg.ruled !== false) { g.strokeStyle = rgba('#7a5a2a', 0.09); g.lineWidth = 2; for (let y = 120; y < H - 90; y += 46) { g.beginPath(); g.moveTo(110, y); g.lineTo(W - 110, y); g.stroke(); } }
      if (bg.ornament !== false) { // double rule border with corner flourishes, faded ink
        g.strokeStyle = rgba('#5a3a14', 0.32); g.lineWidth = 4; g.strokeRect(70, 60, W - 140, H - 120); g.lineWidth = 2; g.strokeRect(86, 76, W - 172, H - 152);
        for (const [cx, cy, sx, sy] of [[86, 76, 1, 1], [W - 86, 76, -1, 1], [86, H - 76, 1, -1], [W - 86, H - 76, -1, -1]]) {
          g.save(); g.translate(cx, cy); g.scale(sx, sy); g.lineWidth = 3;
          g.beginPath(); g.moveTo(0, 70); g.bezierCurveTo(10, 30, 30, 10, 70, 0); g.moveTo(14, 60); g.bezierCurveTo(40, 50, 30, 20, 60, 14); g.stroke();
          g.beginPath(); g.arc(28, 28, 9, 0, TAU); g.stroke(); g.fillStyle = rgba('#5a3a14', 0.3); g.beginPath(); g.arc(28, 28, 4, 0, TAU); g.fill();
          g.restore();
        }
        for (const x of [W / 2]) for (const y of [60, H - 60]) { g.fillStyle = rgba('#5a3a14', 0.32); g.beginPath(); g.moveTo(x - 30, y); g.lineTo(x, y - 9); g.lineTo(x + 30, y); g.lineTo(x, y + 9); g.closePath(); g.fill(); }
      }
      // aged edge band: blotchy darkening that wanders along the border
      for (let i = 0; i < 90; i++) { const t = i / 90, side = i % 4, along = (side < 2 ? W : H) * (r() * 1.1 - 0.05), x = side === 0 ? along : side === 1 ? along : side === 2 ? -10 + r() * 30 : W + 10 - r() * 30, y = side === 0 ? -10 + r() * 30 : side === 1 ? H + 10 - r() * 30 : along, rad = 50 + r() * 90, gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, rgba('#5a3008', 0.32)); gr.addColorStop(1, rgba('#5a3008', 0)); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); void t; }
      for (const [cx, cy] of [[0, 0], [W, 0], [0, H], [W, H]]) { // burnt corners: charred core, scorched halo, ragged edge
        if (bg.burnt === false) continue;
        const rad = 200 + (T.hash(env.seed + cy + ':' + cx) % 110), halo = g.createRadialGradient(cx, cy, rad * 0.4, cx, cy, rad * 1.6);
        halo.addColorStop(0, rgba('#3a1a04', 0.6)); halo.addColorStop(1, rgba('#3a1a04', 0)); g.fillStyle = halo; g.fillRect(cx - rad * 2, cy - rad * 2, rad * 4, rad * 4);
        const pts = T.blobPts(cx, cy, rad * 0.75, rad * 0.75, env.seed + 'burn' + cx + cy, 16, 0.3); g.strokeStyle = rgba('#c8501a', 0.7); g.lineWidth = 10; g.beginPath(); T.smoothPath(g, pts); g.stroke(); g.fillStyle = '#1e140c'; g.beginPath(); T.smoothPath(g, pts); g.fill(); // ember rim, charred hole
      }
      const e = g.createRadialGradient(W / 2, H / 2, H * 0.5, W / 2, H / 2, W * 0.66); // scorched, darker edges
      e.addColorStop(0, rgba('#5a3008', 0)); e.addColorStop(0.75, rgba('#5a3008', 0.25)); e.addColorStop(1, rgba('#2a1404', 0.6));
      g.fillStyle = e; g.fillRect(-OV, -OV, W + OV * 2, H + OV * 2);
    });
  });
})();
