// paint.js — shared toon drawing primitives: palette, outlined shapes, toon text, blobs, film grain.
(function () {
  'use strict';
  const T = window.TOON;

  // Palette measured from the reference frames (dark brown ink, warm whites, saturated robes).
  T.PAL = {
    ink: '#2a1c15',
    skin: '#f6f2ea',
    skinShade: '#d8d0c4',
    red: '#c8323a',
    redDark: '#8f1f27',
    gold: '#f2c230',
    goldDark: '#b8861b',
    green: '#6f8a3a',
    olive: '#8a8b4a',
    brown: '#5a3a26',
    hair: '#4a2e1f',
    white: '#ffffff',
    paper: '#efdcae',
    paperDark: '#c9a86a',
    sea: '#8fa8d8',
    seaDark: '#6c86bd',
    land: '#e3b964',
  };
  T.LINE = 9; // base outline width in character units (≈6px on a 400px tall character)

  // Normalise '#rgb' → '#rrggbb'; colours must be hex (validated in spec.py).
  T.hex6 = (c) => {
    const s = String(c);
    if (/^#[0-9a-f]{3}$/i.test(s)) return '#' + s.slice(1).split('').map((x) => x + x).join('');
    if (/^#[0-9a-f]{6}$/i.test(s)) return s;
    throw new Error('Colour must be #rgb or #rrggbb: ' + s);
  };
  T.mix = (a, b, t) => {
    const pa = parseInt(T.hex6(a).slice(1), 16), pb = parseInt(T.hex6(b).slice(1), 16);
    const ch = (n, sh) => (n >> sh) & 255;
    return '#' + [16, 8, 0].map((sh) => Math.round(T.lerp(ch(pa, sh), ch(pb, sh), t)).toString(16).padStart(2, '0')).join('');
  };

  // Draw fn(g) on a scratch canvas with the current transform, then composite it once through a CSS filter.
  // ctx.filter on many small draw calls is ~10x slower; clips and globalAlpha of ctx still apply. Nesting is safe.
  const scratch = [];
  let depth = 0;
  T.filtered = (ctx, filter, fn) => {
    const c = ctx.canvas, s = scratch[depth] || (scratch[depth] = document.createElement('canvas'));
    if (s.width !== c.width || s.height !== c.height) { s.width = c.width; s.height = c.height; }
    const g = s.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, s.width, s.height);
    g.setTransform(ctx.getTransform());
    depth++;
    try { fn(g); } finally { depth--; }
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.filter = filter; ctx.drawImage(s, 0, 0); ctx.restore();
  };

  T.font = (size, weight = 900) => `${Math.round(size)}px "Rubik-${weight}", "Arial Black", sans-serif`;

  // Outlined shape: fill, optional `shade(ctx)` details clipped to the shape, ink outline. In the painted look
  // (T.PAINT set by core.js) the fill gets light-relative shadow bands, a rim light and variable-width ink (shade.js):
  // paint: false keeps one shape flat, a number 0..1 scales its shading (faces use 0.45). pathFn runs several times,
  // so it must not consume RNG values.
  T.outlined = (ctx, pathFn, fill, { line = T.LINE, ink = T.PAL.ink, shade = null, paint = true } = {}) => {
    const info = fill && paint !== false && T.PAINT && T.paintPrep ? T.paintPrep(ctx, pathFn, typeof paint === 'number' ? paint : 1) : null;
    if (info && line > 0) T.inkUnder(ctx, pathFn, line, ink, info); // heavier ink on the shadow side
    ctx.beginPath();
    pathFn(ctx);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (info) T.shadeFill(ctx, pathFn, fill, info);
    if (shade) { ctx.save(); if (info) { ctx.beginPath(); pathFn(ctx); } ctx.clip(); shade(ctx); ctx.restore(); }
    if (line > 0) {
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.lineWidth = info && info.full && info.M * info.ll.scale >= 100 ? line * 0.8 : line;
      ctx.strokeStyle = ink;
      ctx.beginPath();
      pathFn(ctx);
      ctx.stroke();
    }
  };

  T.rrect = (ctx, x, y, w, h, r) => {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  };

  // Closed smooth blob through points (quadratic midpoints).
  T.smoothPath = (ctx, pts) => {
    const n = pts.length;
    const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const m0 = mid(pts[n - 1], pts[0]);
    ctx.moveTo(m0[0], m0[1]);
    for (let i = 0; i < n; i++) {
      const p = pts[i], m = mid(p, pts[(i + 1) % n]);
      ctx.quadraticCurveTo(p[0], p[1], m[0], m[1]);
    }
    ctx.closePath();
  };

  // Irregular round blob (clouds, splats, bushes) — deterministic by seed.
  T.blobPts = (cx, cy, rx, ry, seed, n = 14, jag = 0.18) => {
    const r = T.rng(T.hash(seed));
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, k = 1 + (r() * 2 - 1) * jag;
      pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
    }
    return pts;
  };

  // Bold toon text: white fill, thick dark stroke, offset drop shadow (as in the reference labels).
  T.toonText = (ctx, text, x, y, o = {}) => {
    const size = o.size ?? 90;
    ctx.save();
    ctx.font = T.font(size, o.weight ?? 900);
    ctx.textAlign = o.align ?? 'center';
    ctx.textBaseline = o.baseline ?? 'alphabetic';
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    const sw = o.stroke ?? size * 0.2;
    if (o.shadow !== false) {
      ctx.fillStyle = 'rgba(20,10,5,0.45)';
      ctx.strokeStyle = 'rgba(20,10,5,0.45)';
      ctx.lineWidth = sw;
      ctx.strokeText(text, x + size * 0.05, y + size * 0.07);
    }
    ctx.lineWidth = sw;
    ctx.strokeStyle = o.ink ?? T.PAL.ink;
    ctx.strokeText(text, x, y);
    ctx.fillStyle = o.fill ?? '#fff';
    ctx.fillText(text, x, y);
    ctx.restore();
    return ctx.measureText ? measure(ctx, text, size, o.weight) : 0;
  };
  function measure(ctx, text, size, weight) {
    ctx.save();
    ctx.font = T.font(size, weight ?? 900);
    const w = ctx.measureText(text).width;
    ctx.restore();
    return w;
  }
  T.measure = measure;

  // Fit text into maxW by shrinking the size.
  T.fitSize = (ctx, text, size, maxW, weight) => {
    const w = measure(ctx, text, size, weight);
    return w > maxW ? size * (maxW / w) : size;
  };

  // Light cel highlight / shadow helpers.
  T.shadeSide = (ctx, x0, y0, w, h, color, side = 1) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x0 + side * w * 0.55, y0, w * 0.6, h, 0, 0, Math.PI * 2);
    ctx.fill();
  };

  // ---------- film grain + vignette (post) ----------
  let grain = null, paperGrain = null;
  // Painted look: the same grain with the paper-fibre texture baked in, so the tooth costs no extra full-frame pass.
  function paperGrainTile() {
    if (paperGrain) return paperGrain;
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d');
    g.drawImage(grainTile(), 0, 0);
    g.globalAlpha = 0.45; g.drawImage(T.textureTile('paper', 9), 0, 0);
    paperGrain = c;
    return c;
  }
  function grainTile() {
    if (grain) return grain;
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d');
    const img = g.createImageData(256, 256);
    const r = T.rng(1234);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 128 + (r() - 0.5) * 90;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 22;
    }
    g.putImageData(img, 0, 0);
    grain = c;
    return c;
  }
  T.post = (ctx, lt, env) => {
    const st = env.style || {};
    if (T.PAINT && T.paintPost) T.paintPost(ctx, lt, env); // painted look: light wash + canvas tooth, under the grade
    if (T.grade) T.grade(ctx, lt, env);
    // shot.vignette: {strength, x, y, radius, color} overrides the film vignette (heavy horror vignettes reach 0.85)
    const sv = env.shot && env.shot.vignette;
    if (sv) {
      const cx = (sv.x ?? 0.5) * T.W, cy = (sv.y ?? 0.5) * T.H, rad = (sv.radius ?? 0.55) * T.H;
      const g = ctx.createRadialGradient(cx, cy, rad * 0.55, cx, cy, rad * 1.9);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, sv.color ?? `rgba(6,3,2,${sv.strength ?? 0.8})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, T.W, T.H);
    } else if (st.vignette !== false) {
      // Centred on the visible frame (vertical films see a strip at env.frameX); radii follow its half-diagonal.
      const [lo, vw] = T.visibleSpan(env), cx = lo + vw / 2, d = Math.hypot(vw / 2, T.H / 2);
      const g = env.frameX == null ? ctx.createRadialGradient(T.W / 2, T.H / 2, T.H * 0.45, T.W / 2, T.H / 2, T.H * 1.05)
        : ctx.createRadialGradient(cx, T.H / 2, d * 0.44, cx, T.H / 2, d * 1.03);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, `rgba(30,10,0,${st.vignette ?? 0.28})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, T.W, T.H);
    }
    if (st.grain !== false || T.PAINT) {
      const tile = T.PAINT && T.textureTile ? paperGrainTile() : grainTile();
      const step = Math.floor(lt * 12);
      const r = T.rng(T.hash(env.seed + step));
      const ox = Math.floor(r() * 256), oy = Math.floor(r() * 256);
      ctx.save();
      ctx.translate(-ox, -oy);
      ctx.fillStyle = ctx.createPattern(tile, 'repeat');
      ctx.fillRect(0, 0, T.W + 256, T.H + 256);
      ctx.restore();
    }
  };
})();
