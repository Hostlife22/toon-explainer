// textures.js — seeded procedural texture tiles for the painted look: grass strokes, wood grain, stone, brick,
// plaster mottling, fabric weave, paper fibre and water ripples. Each tile is a 256 px seamless canvas of light and
// dark marks on transparent pixels, built once per (kind, seed) from T.rng and cached, so the pixels never depend on
// render order. T.fillTexture overlays a tile (plain alpha blending by default) on a path or a rect in the current frame.
(function () {
  'use strict';
  const T = window.TOON, S = 256, TAU = Math.PI * 2;
  const DARK = (a) => `rgba(0,0,0,${a.toFixed(3)})`, LIGHT = (a) => `rgba(255,255,255,${a.toFixed(3)})`;
  // Draw fn at the 9 wrap offsets so marks crossing an edge continue on the other side (seamless tile).
  const wrap = (g, fn) => { for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) { g.save(); g.translate(dx, dy); fn(g); g.restore(); } };

  const TEX = {
    grass(g, r) { // upward blade strokes, darker roots, light tips
      g.lineCap = 'round';
      for (let i = 0; i < 520; i++) {
        const x = r() * S, y = r() * S, h = 8 + r() * 18, lean = (r() - 0.5) * 10, dark = r() < 0.68;
        const st = dark ? DARK(0.18 + r() * 0.22) : LIGHT(0.1 + r() * 0.16), w = 1.2 + r() * 2;
        wrap(g, (k) => { k.strokeStyle = st; k.lineWidth = w; k.beginPath(); k.moveTo(x, y); k.quadraticCurveTo(x + lean * 0.2, y - h * 0.6, x + lean, y - h); k.stroke(); });
      }
    },
    wood(g, r) { // horizontal grain: wavy lines whose phase repeats every tile, plus knots
      for (let i = 0; i < 46; i++) {
        const y0 = r() * S, amp = 1.5 + r() * 4, f = (1 + Math.floor(r() * 3)) * TAU / S, ph = r() * TAU, dark = r() < 0.62;
        g.strokeStyle = dark ? DARK(0.12 + r() * 0.2) : LIGHT(0.1 + r() * 0.14); g.lineWidth = 0.8 + r() * 2.2;
        for (const dy of [-S, 0, S]) { g.beginPath(); for (let x = 0; x <= S; x += 4) { const y = y0 + dy + Math.sin(x * f + ph) * amp; x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
      }
      for (let i = 0; i < 3; i++) {
        const x = r() * S, y = r() * S, rx = 6 + r() * 10, ry = 2.5 + r() * 3;
        wrap(g, (k) => { for (let j = 0; j < 3; j++) { k.strokeStyle = DARK(0.3 - j * 0.07); k.lineWidth = 1.4; k.beginPath(); k.ellipse(x, y, rx + j * 5, ry + j * 2.2, 0, 0, TAU); k.stroke(); } });
      }
    },
    stone(g, r) { // cobbles: rounded blobs with a dark lower rim and a light top edge, grit between them
      for (let i = 0; i < 26; i++) {
        const x = r() * S, y = r() * S, rad = 14 + r() * 16, pts = T.blobPts(0, 0, rad * 1.2, rad * 0.85, 'st' + i + ':' + r(), 9, 0.22);
        const tone = r() < 0.5 ? DARK(0.06 + r() * 0.12) : LIGHT(0.05 + r() * 0.12);
        wrap(g, (k) => {
          k.save(); k.translate(x, y);
          k.beginPath(); T.smoothPath(k, pts); k.fillStyle = tone; k.fill();
          k.strokeStyle = DARK(0.32); k.lineWidth = 2; k.stroke();
          k.save(); k.clip(); k.strokeStyle = LIGHT(0.28); k.lineWidth = 3; k.translate(1.5, 2.5); k.beginPath(); T.smoothPath(k, pts); k.stroke(); k.restore();
          k.restore();
        });
      }
      for (let i = 0; i < 300; i++) { g.fillStyle = r() < 0.5 ? DARK(0.25) : LIGHT(0.2); g.fillRect(r() * S, r() * S, 1.5, 1.5); }
    },
    brick(g, r) { // 64 x 32 running bond: per-brick tone, mortar lines, chipped corners
      const bw = 64, bh = 32;
      for (let row = 0; row < S / bh; row++) for (let c = -1; c < S / bw + 1; c++) {
        const x = c * bw + (row % 2) * bw / 2, y = row * bh, v = r();
        g.fillStyle = v < 0.5 ? DARK(0.05 + v * 0.18) : LIGHT((v - 0.5) * 0.24);
        g.fillRect(x + 2, y + 2, bw - 4, bh - 4);
        g.fillStyle = LIGHT(0.18); g.fillRect(x + 3, y + 3, bw - 8, 3);
        g.fillStyle = DARK(0.2); g.fillRect(x + 3, y + bh - 6, bw - 6, 3);
        if (r() < 0.3) { g.fillStyle = DARK(0.25); g.beginPath(); g.arc(x + 4 + r() * (bw - 8), y + 4 + r() * (bh - 8), 2 + r() * 3, 0, TAU); g.fill(); }
      }
      g.strokeStyle = DARK(0.38); g.lineWidth = 3;
      for (let row = 0; row <= S / bh; row++) { g.beginPath(); g.moveTo(0, row * bh); g.lineTo(S, row * bh); g.stroke(); }
      for (let row = 0; row < S / bh; row++) for (let c = 0; c <= S / bw; c++) { const x = c * bw + (row % 2) * bw / 2; g.beginPath(); g.moveTo(x % S, row * bh); g.lineTo(x % S, row * bh + bh); g.stroke(); }
    },
    plaster(g, r) { // soft mottled patches and fine specks (stucco walls)
      for (let i = 0; i < 34; i++) {
        const x = r() * S, y = r() * S, rad = 20 + r() * 60, a = 0.05 + r() * 0.1, dark = r() < 0.55;
        wrap(g, (k) => { const gr = k.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, dark ? DARK(a) : LIGHT(a)); gr.addColorStop(1, dark ? DARK(0) : LIGHT(0)); k.fillStyle = gr; k.fillRect(x - rad, y - rad, rad * 2, rad * 2); });
      }
      for (let i = 0; i < 420; i++) { g.fillStyle = r() < 0.6 ? DARK(0.12 + r() * 0.12) : LIGHT(0.15); g.fillRect(r() * S, r() * S, 1 + r() * 1.5, 1 + r() * 1.5); }
      for (let i = 0; i < 5; i++) { const x = r() * S, y = r() * S, l = 10 + r() * 24, a = r() * TAU; wrap(g, (k) => { k.strokeStyle = DARK(0.2); k.lineWidth = 1; k.beginPath(); k.moveTo(x, y); k.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); k.lineTo(x + Math.cos(a + 0.6) * l * 1.6, y + Math.sin(a + 0.6) * l * 1.6); k.stroke(); }); }
    },
    fabric(g, r) { // plain weave: alternating light / dark thread segments on a 6 px grid, slubs
      const p = 6;
      for (let y = 0; y < S; y += p) for (let x = 0; x < S; x += p) {
        const over = ((x + y) / p) % 2 === 0;
        g.fillStyle = over ? LIGHT(0.12 + r() * 0.05) : DARK(0.12 + r() * 0.05);
        g.fillRect(x, y, over ? p : p - 1, over ? p - 1 : p);
      }
      for (let i = 0; i < 40; i++) { g.fillStyle = r() < 0.5 ? DARK(0.12) : LIGHT(0.12); g.fillRect(Math.floor(r() * S / p) * p, r() * S, 2, 10 + r() * 30); }
    },
    paper(g, r) { // fibres and tooth (the medium the whole painted frame sits on)
      for (let i = 0; i < 900; i++) { g.fillStyle = r() < 0.5 ? DARK(0.07 + r() * 0.08) : LIGHT(0.07 + r() * 0.1); g.fillRect(r() * S, r() * S, 1 + r() * 2, 1 + r() * 2); }
      g.lineCap = 'round';
      for (let i = 0; i < 90; i++) {
        const x = r() * S, y = r() * S, l = 6 + r() * 18, a = r() * TAU, st = r() < 0.5 ? DARK(0.1) : LIGHT(0.12), w = 0.6 + r() * 0.8;
        wrap(g, (k) => { k.strokeStyle = st; k.lineWidth = w; k.beginPath(); k.moveTo(x, y); k.quadraticCurveTo(x + Math.cos(a + 0.5) * l * 0.5, y + Math.sin(a + 0.5) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l); k.stroke(); });
      }
    },
    water(g, r) { // horizontal ripple dashes, light crests over darker troughs
      g.lineCap = 'round';
      for (let i = 0; i < 70; i++) {
        const x = r() * S, y = r() * S, l = 18 + r() * 46, crest = r() < 0.55, w = 1.5 + r() * 2.5, a = crest ? LIGHT(0.22 + r() * 0.25) : DARK(0.12 + r() * 0.16);
        wrap(g, (k) => { k.strokeStyle = a; k.lineWidth = w; k.beginPath(); k.moveTo(x, y); k.quadraticCurveTo(x + l / 2, y - 3, x + l, y); k.stroke(); });
      }
    },
  };
  T.TEXTURES = TEX; // registry: kind -> fn(g, rng) drawing one tile (vocab: scripts/vocab/paint.json)

  const cache = new Map();
  T.textureTile = (kind, seed = 0) => {
    const fn = TEX[kind];
    if (!fn) throw new Error(`Unknown texture "${kind}" (known: ${Object.keys(TEX).join(', ')})`);
    const key = kind + ':' + seed;
    let c = cache.get(key);
    if (c) return c;
    c = document.createElement('canvas');
    c.width = c.height = S;
    const g = c.getContext('2d');
    fn(g, T.rng(T.hash('tex:' + key)));
    cache.set(key, c);
    return c;
  };

  // Overlay a texture on a path (pathFn) or rect ([x, y, w, h]) in the current frame.
  // o: {scale 1, rot 0 (deg), alpha 0.5, comp 'source-over' (the marks are black / white with alpha), seed 0, rect, ox, oy}
  T.fillTexture = (ctx, pathFn, kind, o = {}) => {
    const tile = T.textureTile(kind, o.seed ?? 0);
    let rect = o.rect;
    if (!rect && pathFn && T.pathBounds) { const b = T.pathBounds(pathFn); if (b) rect = [b.x, b.y, b.w, b.h]; }
    if (!rect) rect = [-T.OVERSCAN - 200, -T.OVERSCAN - 200, T.W + T.OVERSCAN * 2 + 400, T.H + T.OVERSCAN * 2 + 400];
    const pat = ctx.createPattern(tile, 'repeat');
    const sc = o.scale ?? 1;
    pat.setTransform(new DOMMatrix().translate(o.ox ?? 0, o.oy ?? 0).rotate(o.rot ?? 0).scale(sc, sc));
    ctx.save();
    if (pathFn) { ctx.beginPath(); pathFn(ctx); ctx.clip(); }
    if (o.comp) ctx.globalCompositeOperation = o.comp;
    ctx.globalAlpha *= o.alpha ?? 0.5;
    ctx.fillStyle = pat;
    ctx.fillRect(rect[0], rect[1], rect[2], rect[3]);
    ctx.restore();
  };
})();
