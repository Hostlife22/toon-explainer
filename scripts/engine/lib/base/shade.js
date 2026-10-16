// shade.js — painted look core: per-shot light, multi-tone cel shading for any path callback (base, shadow and deep
// bands relative to the light, a soft form wash and a rim on the lit edge), variable-width ink, tapered ink strokes,
// contact shadows and atmospheric perspective. Active only when style.look (or shot.look) is "painted": core.js sets
// T.PAINT per shot from T.paintState, and T.outlined (paint.js) calls T.paintPrep, T.inkUnder and T.shadeFill while it is set.
// Textures live in textures.js; painted skies and backgrounds in paint-places.js.
(function () {
  'use strict';
  const T = window.TOON;

  T.LOOKS = ['classic', 'painted'];
  // dir: degrees toward the light (0 = from the right, 90 = from straight above); color: highlight / rim tint;
  // rim: rim-light strength 0..1; ambient: the shadow tint (cool, desaturated); intensity: shadow depth 0..1.
  T.LIGHT_DEFAULT = { dir: 58, color: '#fff0cf', rim: 0.55, ambient: '#3c2f5c', intensity: 0.6 };
  T.PAINT = null;
  // Lettering and screen furniture keep their flat graphic look in the painted film (opt in with painted: true).
  T.PAINT_EXEMPT = new Set(['label', 'title', 'caption', 'date', 'era', 'counter', 'timer', 'doc', 'hud', 'cursor', 'subtitle', 'timeline', 'panel', 'fx']);
  // Layer types standing on the ground at their origin: they get a contact shadow unless contact: false.
  T.CONTACT_DEFAULT = { bean: 1, topbean: 1 };

  const num = (v, def, lo, hi, what) => {
    if (v == null) return def;
    if (typeof v !== 'number' || !Number.isFinite(v) || v < lo || v > hi) throw new Error(`light.${what} must be a number in ${lo}..${hi}`);
    return v;
  };
  const col = (v, def, what) => {
    if (v == null) return def;
    try { return T.hex6(v); } catch (e) { throw new Error(`light.${what} must be a hex colour (got ${JSON.stringify(v)})`); }
  };
  const mulHex = (a, b) => {
    const pa = parseInt(T.hex6(a).slice(1), 16), pb = parseInt(T.hex6(b).slice(1), 16);
    return '#' + [16, 8, 0].map((s) => Math.round((((pa >> s) & 255) * ((pb >> s) & 255)) / 255).toString(16).padStart(2, '0')).join('');
  };
  T.mulHex = mulHex;

  // A sky with a visible sun lights the shot from the sun (kept at least ~14 degrees above the horizon), unless a
  // light dir is given. Sky-backed kinds pass their preset to the sky (spec.py SKY_BACKED_BGS).
  T.SUN_LIT_BGS = new Set(['sky', 'city', 'battlefield', 'desert', 'eastcity', 'factory', 'graveyard', 'karst', 'mountains', 'street1920', 'trench', 'hills', 'woods', 'river', 'dunes', 'ancient', 'castle']);
  function sunDir(shot) {
    const bg = shot && (Array.isArray(shot.bg) ? shot.bg[0] : shot.bg || { kind: 'sky' });
    if (!bg || !T.SUN_LIT_BGS.has(bg.kind || 'sky') || bg.timelapse || !T.SKY) return null;
    const pal = T.SKY[bg.preset || 'day'], sun = bg.sun || (pal && pal.sun);
    if (!sun || sun[1] > 0.95 || sun[1] < -0.2) return null; // below the frame or far above it: keep the default key
    const dx = (sun[0] - 0.5) * T.W, dy = (0.5 - sun[1]) * T.H; // world space: the frame is 16:9
    return Math.atan2(Math.max(0.25 * Math.abs(dx), dy), dx) / T.DEG;
  }

  // Resolved paint state for a shot, or null for the classic look. Pure function of (spec, shot): cached per shot object.
  const states = new WeakMap();
  T.paintState = (spec, shot) => {
    if (shot && states.has(shot)) return states.get(shot);
    const st = (spec && spec.style) || {}, look = (shot && shot.look) ?? st.look ?? 'classic';
    if (!T.LOOKS.includes(look)) throw new Error(`Unknown look "${look}" (known: ${T.LOOKS.join(', ')})`);
    let out = null;
    if (look === 'painted') {
      const L = { ...T.LIGHT_DEFAULT, ...(st.light || {}), ...((shot && shot.light) || {}) }, D = T.LIGHT_DEFAULT;
      if ((st.light || {}).dir == null && ((shot && shot.light) || {}).dir == null) { const sd = sunDir(shot); if (sd != null) L.dir = sd; }
      const light = { dir: num(L.dir, D.dir, -360, 720, 'dir'), color: col(L.color, D.color, 'color'), rim: num(L.rim, D.rim, 0, 1, 'rim'),
        ambient: col(L.ambient, D.ambient, 'ambient'), intensity: num(L.intensity, D.intensity, 0, 1, 'intensity') };
      const a = light.dir * T.DEG, k = light.intensity;
      out = {
        light, wx: Math.cos(a), wy: -Math.sin(a),
        shadow: T.mix('#ffffff', light.ambient, 0.62 * k), // multiplied over the base: first shadow band
        deep: T.mix('#ffffff', light.ambient, 0.42 * k), // multiplied again: the core shadow on the far edge
        form: T.mix('#ffffff', light.ambient, 0.32 * k), // soft gradient over the whole shape (roundness)
        rim: light.color, rimA: light.rim,
      };
    }
    if (shot) states.set(shot, out);
    return out;
  };

  // ---------- path bounds (a recorder that runs the path callback without drawing) ----------
  const B = { x0: 0, y0: 0, x1: 0, y1: 0, n: 0 };
  const add = (x, y) => { if (!(Number.isFinite(x) && Number.isFinite(y))) return; if (!B.n++) { B.x0 = B.x1 = x; B.y0 = B.y1 = y; return; } if (x < B.x0) B.x0 = x; if (x > B.x1) B.x1 = x; if (y < B.y0) B.y0 = y; if (y > B.y1) B.y1 = y; };
  const rec = {
    moveTo: add, lineTo: add,
    quadraticCurveTo: (a, b, x, y) => { add(a, b); add(x, y); },
    bezierCurveTo: (a, b, c, d, x, y) => { add(a, b); add(c, d); add(x, y); },
    arcTo: (a, b, c, d) => { add(a, b); add(c, d); },
    arc: (x, y, r) => { add(x - r, y - r); add(x + r, y + r); },
    ellipse: (x, y, rx, ry) => { const m = Math.max(rx, ry); add(x - m, y - m); add(x + m, y + m); },
    rect: (x, y, w, h) => { add(x, y); add(x + w, y + h); },
    roundRect: (x, y, w, h) => { add(x, y); add(x + w, y + h); },
  };
  const noop = () => {};
  // State and drawing calls a path callback might make are ignored; an unknown method throws and the shape stays flat.
  for (const k of ['beginPath', 'closePath', 'save', 'restore', 'translate', 'rotate', 'scale', 'transform', 'setTransform', 'fill', 'stroke', 'clip', 'fillRect', 'strokeRect']) rec[k] = noop;
  T.pathBounds = (pathFn) => {
    B.n = 0;
    try { pathFn(rec); } catch (e) { return null; }
    return B.n ? { x: B.x0, y: B.y0, w: B.x1 - B.x0, h: B.y1 - B.y0 } : null;
  };

  // Light direction in the current local frame (flips, rotations and scales of the layer are undone).
  function localLight(ctx, P) {
    const m = ctx.getTransform(), det = m.a * m.d - m.b * m.c;
    if (!det) return null;
    let lx = (m.d * P.wx - m.c * P.wy) / det, ly = (-m.b * P.wx + m.a * P.wy) / det;
    const n = Math.hypot(lx, ly) || 1;
    lx /= n; ly /= n;
    return { lx, ly, scale: Math.sqrt(Math.abs(det)) / (T.DPR || 1) }; // logical px per local unit
  }
  const MIN_PX = 18; // shapes smaller than this on screen keep the classic flat fill
  const FULL_PX = 64; // below this: one shadow band only (no deep band, falloff, rim or ink weight), for speed
  // Only opaque hex fills are shaded: gradients, patterns and rgba fills keep their own look and transparency.
  const opaque = new Map();
  T.opaqueFill = (fill) => {
    if (typeof fill !== 'string') return false;
    let v = opaque.get(fill);
    if (v === undefined) { try { T.hex6(fill); v = true; } catch (e) { v = false; } opaque.set(fill, v); }
    return v;
  };
  // Band colours per (fill, strength), cached: hex fills get their shadow tones precomputed, so the bands are plain
  // source-over fills (blend modes are several times slower in the software rasteriser used for renders).
  const tones = new Map();
  const tonesFor = (P, fill, k) => {
    const key = [P.shadow, P.deep, P.form, P.light.ambient, P.light.color, P.rimA, fill, k].join('|'); // every input of the tones
    let t = tones.get(key);
    if (!t) {
      const sh = T.mix('#ffffff', P.shadow, k), both = mulHex(sh, T.mix('#ffffff', P.deep, k));
      let hex = null;
      if (typeof fill === 'string') { try { hex = T.hex6(fill); } catch (e) { hex = null; } }
      t = { sh, both, hex, shadow: hex && mulHex(hex, sh), deep: hex && mulHex(hex, both),
        form: rgba(P.light.ambient, 0.3 * k), clear: rgba(P.light.ambient, 0), rim: rgba(P.light.color, 0.75 * P.rimA * k), rim0: rgba(P.light.color, 0) };
      tones.set(key, t);
    }
    return t;
  };
  const rgba = (hex, a) => { const n = parseInt(T.hex6(hex).slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${T.clamp(a).toFixed(3)})`; };

  // Bounds, local light and size class of a shape about to be painted; null when it is too small to shade.
  T.paintPrep = (ctx, pathFn, strength = 1) => {
    const P = T.PAINT, k = T.clamp(strength ?? 1);
    if (!P || k <= 0) return null;
    const bb = T.pathBounds(pathFn);
    if (!bb) return null;
    const ll = localLight(ctx, P);
    if (!ll) return null;
    const m = Math.min(bb.w, bb.h), M = Math.max(bb.w, bb.h);
    if (m * ll.scale < MIN_PX || M * ll.scale < MIN_PX * 1.5) return null;
    return { bb, ll, m, M, k, full: M * ll.scale >= FULL_PX };
  };

  // Ink weight on the shadow side: the outline stroked once, shifted away from the light, BEFORE the fill. The fill
  // hides the inner half, so only the far side shows a heavier line (no clip needed). Pair with a 0.8 x final stroke.
  T.inkUnder = (ctx, pathFn, line, ink, info) => {
    if (!info || !info.full || info.M * info.ll.scale < 100) return; // small shapes: the weight would not read
    const d = line * 0.45;
    ctx.save();
    ctx.translate(-info.ll.lx * d, -info.ll.ly * d);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = ink; ctx.lineWidth = line;
    ctx.beginPath(); pathFn(ctx); ctx.stroke();
    ctx.restore();
  };

  // Unit gradients per tone set, placed with a transform (creating gradients per shape is slow).
  const unitGrads = new Map();
  const gradsFor = (ctx, tn) => {
    let g = unitGrads.get(tn);
    if (!g) {
      const form = ctx.createRadialGradient(0, 0, 0.35, 0, 0, 1.15);
      form.addColorStop(0, tn.clear); form.addColorStop(1, tn.form);
      const rim = ctx.createLinearGradient(0, 0, 1, 0);
      rim.addColorStop(0, tn.rim); rim.addColorStop(0.7, tn.rim0);
      g = { form, rim };
      unitGrads.set(tn, g);
    }
    return g;
  };

  // Multi-tone shading of an already filled path: deep band on the far edge, shadow band, base on the lit side, an
  // airbrushed falloff toward the far edges and a rim light inside the lit edge. Bands come from shifted copies of the
  // path, so any path callback works (unions of circles too); only opaque hex fills are shaded (T.opaqueFill). Small shapes get one band only. o: an info from T.paintPrep, or options
  // {strength 0..1 (1), band (fraction of the short side, 0.3), maxBand (px, 64), form: false, rim: false}.
  T.shadeFill = (ctx, pathFn, fill, o = {}) => {
    const P = T.PAINT;
    if (!P || !T.opaqueFill(fill)) return null;
    const info = o.bb ? o : T.paintPrep(ctx, pathFn, o.strength);
    if (!info) return null;
    const { bb, ll, m, M, k, full } = info;
    const cap = (o.maxBand ?? 64) / ll.scale; // bands stay brush-sized on huge shapes (walls, hills)
    const ds = Math.min(m * (o.band ?? 0.3), cap), dd = ds * 0.38, tn = tonesFor(P, fill, k);
    const at = (d) => { ctx.save(); ctx.translate(ll.lx * d, ll.ly * d); ctx.beginPath(); pathFn(ctx); ctx.restore(); };
    const pad = ds + 4 / ll.scale;
    ctx.save();
    ctx.beginPath(); pathFn(ctx); ctx.clip();
    if (!full) { // small shape: a single shadow band
      ctx.fillStyle = tn.shadow; ctx.fillRect(bb.x - pad, bb.y - pad, bb.w + pad * 2, bb.h + pad * 2); ctx.fillStyle = fill; at(ds); ctx.fill();
      ctx.restore();
      return info;
    }
    ctx.fillStyle = tn.deep; ctx.fillRect(bb.x - pad, bb.y - pad, bb.w + pad * 2, bb.h + pad * 2);
    ctx.fillStyle = tn.shadow; at(dd); ctx.fill();
    ctx.fillStyle = fill; at(ds); ctx.fill();
    const cx = bb.x + bb.w / 2, cy = bb.y + bb.h / 2, ug = gradsFor(ctx, tn);
    if (o.form !== false && M * ll.scale >= 100) { // airbrushed falloff: clean toward the light, darker toward the far edges (roundness)
      const r = M * 0.62;
      ctx.save(); ctx.translate(cx + ll.lx * M * 0.18, cy + ll.ly * M * 0.18); ctx.scale(r, r);
      ctx.fillStyle = ug.form; ctx.fillRect(-1.6, -1.6, 3.2, 3.2);
      ctx.restore();
    }
    if (o.rim !== false && P.rimA > 0 && M * ll.scale >= 110) { // rim light hugging the lit edge
      const w = Math.min(m * 0.1, 7 / ll.scale), r = M / 2;
      ctx.beginPath(); pathFn(ctx);
      ctx.save(); ctx.translate(cx + ll.lx * r, cy + ll.ly * r); ctx.rotate(Math.atan2(-ll.ly, -ll.lx)); ctx.scale(r, r);
      ctx.strokeStyle = ug.rim; ctx.lineWidth = (w * 2) / r; ctx.lineJoin = 'round'; ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
    return info;
  };

  // Tapered ink stroke along a polyline: width grows from w0 to w (middle) and back to w1. pts: [[x, y], ...].
  T.inkStroke = (ctx, pts, o = {}) => {
    if (!pts || pts.length < 2) return;
    const w = o.w ?? 8, w0 = o.w0 ?? w * 0.15, w1 = o.w1 ?? w * 0.15, n = pts.length;
    const len = [0];
    for (let i = 1; i < n; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const total = len[n - 1] || 1, L = [], Rr = [];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
      const t = len[i] / total, ww = (t < 0.5 ? T.lerp(w0, w, Math.sin(t * Math.PI)) : T.lerp(w1, w, Math.sin(t * Math.PI))) / 2;
      L.push([pts[i][0] - (dy / d) * ww, pts[i][1] + (dx / d) * ww]); Rr.push([pts[i][0] + (dy / d) * ww, pts[i][1] - (dx / d) * ww]);
    }
    ctx.save();
    ctx.fillStyle = o.ink ?? T.PAL.ink;
    ctx.beginPath(); ctx.moveTo(L[0][0], L[0][1]);
    for (let i = 1; i < n; i++) ctx.lineTo(L[i][0], L[i][1]);
    for (let i = n - 1; i >= 0; i--) ctx.lineTo(Rr[i][0], Rr[i][1]);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  };

  const contactGrads = new Map();
  // Soft ambient-occlusion ellipse on the ground (contact shadow) centred at (x, y), radii rx, ry.
  T.contactShadow = (ctx, x, y, rx, ry, alpha = 0.42, color = null) => {
    if (!(rx > 0 && ry > 0) || alpha <= 0) return;
    const c = T.hex6(color ?? (T.PAINT ? T.mix('#1a1020', T.PAINT.light.ambient, 0.4) : '#1a1020'));
    alpha = Math.round(T.clamp(alpha) * 255) / 255; // quantise first: the key and the stops come from the same value
    const key = c + ':' + alpha;
    let g = contactGrads.get(key);
    if (!g) {
      g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
      g.addColorStop(0, c + Math.round(alpha * 255).toString(16).padStart(2, '0'));
      g.addColorStop(0.45, c + Math.round(alpha * 0.75 * 255).toString(16).padStart(2, '0'));
      g.addColorStop(1, c + '00');
      contactGrads.set(key, g);
    }
    ctx.save();
    ctx.translate(x, y); ctx.scale(rx, ry);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  };
  // Called by core.js in the layer's local frame (origin = the layer's anchor) before the layer draws.
  // contact: true | width scale | {w, h, alpha, dy (fraction of size below the anchor; 0 for beans, 0.5 otherwise)}
  T.layerContact = (ctx, L, st) => {
    if (!T.PAINT) return;
    const c = L.contact ?? T.CONTACT_DEFAULT[L.type];
    if (!c) return;
    const o = typeof c === 'object' ? c : { w: c === true ? 1 : c };
    const size = (L.size ?? (L.type === 'bean' || L.type === 'topbean' ? 420 : 200)) * (o.w ?? 1);
    const lift = Math.max(0, (st && st.jy) || 0) / Math.max(0.05, st ? st.s : 1); // airborne: shadow stays down, shrinks
    const k = 1 / (1 + lift / (size * 0.6));
    const dy = o.dy ?? (T.CONTACT_DEFAULT[L.type] ? 0 : 0.5); // centred layers (props) stand on their lower edge
    T.contactShadow(ctx, 0, lift + dy * (L.size ?? 200), size * 0.34 * k, size * (o.h ?? 0.05) * k, (o.alpha ?? 0.6) * k);
  };

  // ---------- atmospheric perspective: layer.atmos = 0..1 | {amount, color} ----------
  T.atmosColor = (env) => {
    const sky = env && env.shot && (Array.isArray(env.shot.bg) ? env.shot.bg[0] : env.shot.bg);
    if (sky && sky.atmos) return T.hex6(sky.atmos);
    const preset = sky && T.SKY && T.SKY[sky.preset || 'day'];
    if (preset && (sky.kind || 'sky') === 'sky') return T.mix(preset.stops[preset.stops.length - 1], preset.stops[1], 0.35);
    return T.PAINT ? T.mix('#c9d3dc', T.PAINT.light.color, 0.35) : '#c9d3dc';
  };
  T.LAYER_MODS.atmos = {
    order: 80,
    apply: (c, L, lt, env) => {
      const a = typeof L.atmos === 'object' ? L.atmos : { amount: L.atmos };
      const amount = T.clamp(a.amount ?? 0.5);
      if (amount <= 0) return c;
      const o = c.getContext('2d');
      o.save(); o.setTransform(1, 0, 0, 1, 0, 0);
      o.globalCompositeOperation = 'source-atop'; o.globalAlpha = amount * 0.85;
      o.fillStyle = a.color ? T.hex6(a.color) : T.atmosColor(env); o.fillRect(0, 0, c.width, c.height);
      o.restore();
      return c;
    },
  };
})();
