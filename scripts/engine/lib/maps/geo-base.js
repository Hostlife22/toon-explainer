// geo-base.js — paints the sea and real land of a `geo` map (map.js base hook): coast halo or painted ripples, land on
// its drop side, country borders, lakes, rivers, graticule, relief tint and mountain glyphs; for `proj: "ortho"` a
// globe on a starfield with an atmosphere glow, sphere shading and an inked rim (post hook, after the regions).
// Projected geometry is cached per projector key, so static maps project once and spinning globes stay pure.
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL, W = T.W, H = T.H, TAU = Math.PI * 2;
  if (!T.MAP_BASE_HOOKS || !T.geoProjector || !T.MAP_PAINT) throw new Error('geo-base.js needs map.js, geo.js and map-paint.js loaded first');
  const list = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
  const cache = new Map(), CACHE_MAX = 6;

  const addRing = (path, pts) => { path.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) path.lineTo(pts[i][0], pts[i][1]); path.closePath(); };
  // open polyline, broken where the point is on the far side of the globe
  const addLine = (path, pts) => { let pen = false; for (const q of pts) { if (!q[2]) { pen = false; continue; } if (pen) path.lineTo(q[0], q[1]); else path.moveTo(q[0], q[1]); pen = true; } };
  const box = (pts) => { let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for (const q of pts) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); } return { x0, y0, x1, y1 }; };
  const area = (pts) => { let a = 0; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) a += pts[j][0] * pts[i][1] - pts[i][0] * pts[j][1]; return Math.abs(a / 2); };

  function geometry(G) {
    const key = G.pr.key + '|' + G.lv;
    if (cache.has(key)) return cache.get(key);
    const D = T.geoLevel(G.lv), { pr, mw, mh } = G, lim = { x0: -mw * 0.75, y0: -mh * 0.75, x1: mw * 0.75, y1: mh * 0.75 };
    const px = (q) => [(q[0] - 0.5) * mw, (q[1] - 0.5) * mh, q[2] ?? true];
    const onMap = (pts) => { if (!pts.some((q) => q[2])) return false; const b = box(pts); return b.x1 > lim.x0 && b.x0 < lim.x1 && b.y1 > lim.y0 && b.y0 < lim.y1; };
    // polys: visible closed rings (clipped at the globe horizon, copied across the seam); lines: open polylines
    const polys = (pts) => pr.polygon(pts).map((c) => c.pts.map(px)).filter((r) => r.length > 2 && onMap(r));
    const lines = (pts) => pr.line(pts).map((l) => l.map(px)).filter(onMap);
    const land = new Path2D(), coast = new Path2D(), border = new Path2D(), lakes = new Path2D();
    for (const c of D.countries) for (const poly of c.polys) for (const r of polys(poly[0])) addRing(land, r);
    D.arcs.forEach((a, i) => { for (const l of lines(a)) addLine(D.use[i] > 1 ? border : coast, l); });
    for (const lk of D.lakes) for (const r of polys(lk.ring)) if (area(r) > 60) addRing(lakes, r);
    const rivers = D.rivers.flatMap((rv) => lines(rv.line).map((pts) => ({ name: rv.name, rank: rv.rank, pts })));
    const geomOut = { land, coast, border, lakes, rivers, polys, lines, px };
    if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
    cache.set(key, geomOut);
    return geomOut;
  }

  // frame bounds in layer space (for the space backdrop)
  const frameBox = (g) => { const st = g.env.st || { x: W / 2, y: H / 2, s: 1 }, s = st.s || 1, m = 600; return { x0: -st.x / s - m, y0: -st.y / s - m, x1: (W - st.x) / s + m, y1: (H - st.y) / s + m }; };
  function space(ctx, geo, g, lt) {
    const f = frameBox(g), bd = geo.backdrop ?? 'stars';
    if (bd === 'none') return;
    if (bd !== 'stars') { ctx.fillStyle = bd; ctx.fillRect(f.x0, f.y0, f.x1 - f.x0, f.y1 - f.y0); return; }
    const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(f.x1 - f.x0, f.y1 - f.y0) * 0.6);
    gr.addColorStop(0, '#1a2a66'); gr.addColorStop(1, '#070b22'); ctx.fillStyle = gr; ctx.fillRect(f.x0, f.y0, f.x1 - f.x0, f.y1 - f.y0);
    const r = T.rng(T.hash('geo-stars'));
    for (let i = 0; i < (geo.stars ?? 160); i++) {
      const x = T.lerp(f.x0, f.x1, r()), y = T.lerp(f.y0, f.y1, r()), rad = 0.8 + r() * 2.4, tw = r() < 0.35 ? 0.55 + 0.45 * T.noise(lt * 2, i) : 1, a = (0.35 + r() * 0.65) * tw;
      ctx.fillStyle = `rgba(255,248,225,${a.toFixed(3)})`; ctx.beginPath(); ctx.arc(x, y, rad, 0, TAU); ctx.fill();
      if (rad > 2.6) { ctx.strokeStyle = `rgba(255,248,225,${(a * 0.6).toFixed(3)})`; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x - rad * 3, y); ctx.lineTo(x + rad * 3, y); ctx.moveTo(x, y - rad * 3); ctx.lineTo(x, y + rad * 3); ctx.stroke(); }
    }
  }
  // The globe's space backdrop fills the whole frame, so it is painted right after the shot backgrounds, with the map
  // layer's own transform and alpha: layers listed before the map stay in front of it. Maps drawn outside a shot pass
  // (pinned layers, overlays) paint it inline. The map layer's modifiers (T.LAYER_MODS: blur, material, rack focus ...)
  // apply to the backdrop too, as they did when it was part of the layer.
  const orthoMap = (L) => L && L.type === 'map' && L.geo && !(T.GEO_PROJ[L.geo.proj ?? 'equirect'] || { flat: true }).flat && (L.geo.backdrop ?? 'stars') !== 'none';
  T.AFTER_BG.push((ctx, shot, lt, env, cam) => {
    env.geoSpaceDone = true;
    const focus = T.focusBlur ? T.focusBlur(shot, lt) : null;
    for (const L0 of shot.layers || []) {
      if (!L0 || L0.type !== 'map') continue;
      let L = T.effLayer(L0, lt); // swaps first: a map may swap to (or away from) an ortho globe or its backdrop
      if (!orthoMap(L)) continue;
      L = focusBlur(L, lt, focus);
      if (L.dist != null && T.distLayer) L = T.distLayer(L);
      const llt = T.twosLt ? T.twosLt(L, lt, shot, env) : lt;
      if (Array.isArray(L.blur)) L = T.layerWith(L, { blur: T.num(L.blur, llt) }); // keyed blur on the layer's own clock, as drawLayer
      const st = T.layerState(L, llt);
      if (!st) continue;
      // painted look opt-out exactly as drawLayer: painted: false (or an exempt type) draws the backdrop flat
      const saved = T.PAINT, flat = saved && (L.painted === false || (L.painted !== true && T.PAINT_EXEMPT && T.PAINT_EXEMPT.has(L.type)));
      if (flat) T.PAINT = null;
      ctx.save();
      try {
        ctx.globalAlpha *= st.a;
        backdrop(ctx, L, llt, env, cam);
      } finally { ctx.restore(); T.PAINT = saved; }
    }
  });
  // The backdrop with the layer's modifiers. A blurred one fades out at the frame edges, so it is laid over a sharp copy
  // (as drawShot does for backgrounds); both go to one scratch first, so the layer alpha applies once.
  function backdrop(ctx, L, llt, env, cam) {
    const paint = (c) => {
      c.save();
      const s = T.layerTransform(c, L, llt, cam);
      if (s) space(c, L.geo, { env: { ...env, st: s } }, llt - (L.at ?? 0));
      c.restore();
    };
    if (!(T.num(L.blur, llt) >= 0.3)) { T.modLayer(ctx, L, llt, env, paint); return; }
    T.modLayer(ctx, { type: L.type }, llt, env, (o) => {
      T.modLayer(o, { ...L, blur: 0 }, llt, env, paint);
      T.modLayer(o, L, llt, env, paint);
    }, true);
  }
  // Rack focus blur the map layer gets in drawShot (on the shot clock), so its backdrop matches.
  function focusBlur(L, lt, focus) {
    if (!focus || !L.id || L.sharp) return L;
    const fb = focus(L.id), own = T.num(L.blur, lt) || 0;
    return fb >= 0.3 || own ? T.layerWith(L, { blur: Math.max(fb, own) }) : L;
  }
  function graticule(ctx, G, Gm, step, col) {
    if (!(Number.isFinite(step) && step >= 1)) throw new Error(`map geo: graticule must be true or a step of at least 1 degree (got ${step})`);
    const path = new Path2D();
    for (let lon = -180; lon < 180; lon += step) { const pts = []; for (let lat = -80; lat <= 80; lat += 4) pts.push([lon, lat]); for (const l of Gm.lines(pts)) addLine(path, l); }
    for (let lat = -60; lat <= 60; lat += step) { const pts = []; for (let lon = -180; lon <= 180; lon += 4) pts.push([lon, lat]); for (const l of Gm.lines(pts)) addLine(path, l); }
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 1.6; ctx.stroke(path); ctx.restore();
  }
  function rivers(ctx, Gm, opt, seaCol, k) {
    const o = opt === true ? {} : Array.isArray(opt) ? { names: opt } : opt, maxRank = o.rank ?? 5, col = o.color ?? T.shade(seaCol, 0.18);
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    for (const pass of [0, 1]) for (const rv of Gm.rivers) {
      if (o.names ? !o.names.includes(rv.name) : rv.rank > maxRank) continue;
      const w = (o.width ?? 4.5) * Math.max(0.45, 1 - rv.rank * 0.11) * k, path = new Path2D(); addLine(path, rv.pts);
      ctx.strokeStyle = pass ? col : 'rgba(42,28,21,0.55)'; ctx.lineWidth = pass ? w : w + 3; ctx.stroke(path);
    }
    ctx.restore();
  }
  // highland tint along range spines and sand over deserts (clipped to land by the caller)
  function relief(ctx, G, Gm, geo, landCol, k) {
    const mode = geo.relief ?? true; if (mode === false) return;
    const dk = G.pr.flat ? G.pr.k : G.pr.R / 57.3;
    for (const [name, D] of Object.entries(T.GEO_DESERTS || {})) {
      for (const pts of Gm.polys(D.ring)) T.MAP_PAINT.softFill(ctx, pts, D.color === 'highland' ? '#b48d58' : '#efd590', 2.5 * dk, D.color === 'highland' ? 0.45 : 0.7);
    }
    for (const [, R] of Object.entries(T.GEO_RANGES || {})) {
      for (const l of Gm.lines(R.pts)) for (const run of T.MAP_PAINT.runs(l.map((q) => (q[2] ? q : null)))) T.MAP_PAINT.softStroke(ctx, run, '#b08a55', R.w * dk * 1.5, 0.11);
    }
  }
  const sizeOk = (v, what) => { if (!(Number.isFinite(v) && v > 0)) throw new Error(`map geo: ${what} must be a number above 0 (got ${v})`); return v; };
  function rangeSpines(Gm, geo) {
    const sel = geo.ranges, names = sel === true ? Object.keys(T.GEO_RANGES) : sel === false || sel == null ? [] : list(sel);
    const spines = names.flatMap((n) => { const R = T.GEO_RANGES[n]; if (!R) throw new Error(`map geo: unknown range "${n}" (known: ${Object.keys(T.GEO_RANGES).join(', ')})`);
      return Gm.lines(R.pts).map((l, c) => ({ name: n + (c ? '#' + c : ''), snow: !!R.snow, pts: l.map((q) => (q[2] ? q : null)) })); });
    for (const [i, m] of list(geo.mountains).entries()) {
      const ll = Array.isArray(m) ? m : [m.lon, m.lat], size = m.size != null ? sizeOk(m.size, 'mountains size') : undefined;
      for (const l of Gm.lines([ll, [ll[0] + 0.01, ll[1]]])) spines.push({ name: 'peak' + i, snow: !!m.snow, size, pts: l.map((p) => (p[2] ? p : null)) });
    }
    return spines;
  }
  // peak glyphs depend only on the projection and the selection, so static maps place them once
  const glyphCache = new Map();
  function rangeGlyphs(G, Gm, geo, size) {
    const key = [G.pr.key, G.lv, JSON.stringify(geo.ranges ?? null), JSON.stringify(geo.mountains ?? null), size].join('|');
    if (glyphCache.has(key)) return glyphCache.get(key);
    const m = size * 2, bounds = { x0: -G.mw / 2 - m, y0: -G.mh / 2 - m, x1: G.mw / 2 + m, y1: G.mh / 2 + m };
    const glyphs = T.MAP_PAINT.peakGlyphs(rangeSpines(Gm, geo), size, bounds);
    if (glyphCache.size >= CACHE_MAX) glyphCache.delete(glyphCache.keys().next().value);
    glyphCache.set(key, glyphs);
    return glyphs;
  }

  T.MAP_BASE_HOOKS.unshift((ctx, L, g, lt) => {
    const G = L.__geo; if (!G) return false;
    const geo = L.geo, st = g.st, painted = !!st.paint, Gm = geometry(G), ortho = !G.pr.flat, { mw, mh } = g;
    const seaCol = L.sea ?? st.sea, landCol = L.landColor ?? (painted && geo.relief === 'lush' ? '#b3c47c' : st.land), coastCol = L.coast ?? st.coast, ink = st.landInk;
    const k = T.clamp((G.pr.flat ? G.pr.k / 50 : G.pr.R / 2600), 0.6, 1.8); // line weight follows the zoom a little
    g.landClip = new Path2D(); g.landClip.addPath(Gm.land); g.landClip.addPath(Gm.land, new DOMMatrix().translate(0, st.extrude + 2));
    g.coastPath = Gm.coast; g.coastWidth = (painted ? 4 : 3.5) * k;
    const seaArea = ortho ? (c) => c.arc(0, 0, G.pr.R, 0, TAU) : (c) => c.rect(-mw / 2, -mh / 2, mw, mh);
    if (ortho) {
      if (!(g.env && g.env.geoSpaceDone)) space(ctx, geo, g, lt); // a shot draws it after its backgrounds (AFTER_BG below)
      const R = G.pr.R, glow = ctx.createRadialGradient(0, 0, R * 0.92, 0, 0, R * 1.16);
      glow.addColorStop(0, 'rgba(150,200,255,0.75)'); glow.addColorStop(0.35, 'rgba(120,180,255,0.32)'); glow.addColorStop(1, 'rgba(120,180,255,0)');
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(0, 0, R * 1.16, 0, TAU); ctx.fill();
      ctx.save(); ctx.beginPath(); seaArea(ctx); ctx.clip(); g.globeClip = true; // restored by the post hook, after the regions
    }
    if (painted) T.MAP_PAINT.sea(ctx, seaArea, seaCol);
    else { ctx.fillStyle = seaCol; ctx.beginPath(); seaArea(ctx); ctx.fill(); }
    if (geo.graticule) graticule(ctx, G, Gm, geo.graticule === true ? 15 : geo.graticule, T.MAP_PAINT.rgba(T.shade(seaCol, 0.4), 0.45));
    if (painted) T.MAP_PAINT.ripples(ctx, Gm.land, seaCol, coastCol, geo.ripples ?? 3, 15 * k, 22 * k);
    else { ctx.save(); ctx.lineJoin = 'round'; ctx.strokeStyle = coastCol; ctx.lineWidth = (g.style === 'atlas' ? 22 : 26) * k; ctx.stroke(Gm.land); ctx.restore(); }
    if (painted) {
      T.MAP_PAINT.landSlab(ctx, Gm.land, landCol, ink, st.extrude, { tint: (c) => relief(c, G, Gm, geo, landCol, k), edge: Gm.coast });
    } else {
      ctx.save(); ctx.translate(0, st.extrude); ctx.fillStyle = T.shade(landCol, -0.4); ctx.fill(Gm.land); ctx.restore();
      ctx.fillStyle = landCol; ctx.fill(Gm.land);
      if (st.dots && L.dots !== false) { ctx.save(); ctx.clip(Gm.land); ctx.fillStyle = T.mapDots(ctx); ctx.fillRect(-mw, -mh, mw * 2, mh * 2); ctx.restore(); }
    }
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (geo.lakes !== false) { ctx.fillStyle = seaCol; ctx.fill(Gm.lakes); ctx.strokeStyle = ink; ctx.lineWidth = 2 * k; ctx.stroke(Gm.lakes); }
    if (geo.rivers) rivers(ctx, Gm, geo.rivers, seaCol, k);
    if (geo.borders !== false) { ctx.strokeStyle = T.MAP_PAINT.rgba(ink, painted ? 0.7 : 0.55); ctx.lineWidth = (painted ? 2.4 : 2) * k; if (geo.borders === 'dashed') ctx.setLineDash([10 * k, 7 * k]); ctx.stroke(Gm.border); ctx.setLineDash([]); }
    ctx.strokeStyle = ink; ctx.lineWidth = (painted ? 4 : 3.5) * k; ctx.stroke(Gm.coast);
    ctx.restore();
    if (geo.ranges || geo.mountains) T.MAP_PAINT.drawGlyphs(ctx, rangeGlyphs(G, Gm, geo, sizeOk(geo.mountainSize ?? 40, 'mountainSize') * Math.min(k, 1.3)));
    return true;
  });

  T.MAP_POST_HOOKS.push((ctx, L, g) => {
    const G = L.__geo; if (!G || G.pr.flat || !g.globeClip) return; // only when the base hook opened the globe clip
    g.globeClip = false;
    const R = G.pr.R, geo = L.geo, lx = -R * 0.38, ly = -R * 0.42;
    if (geo.shade !== false) {
      const sh = ctx.createRadialGradient(lx, ly, R * 0.05, lx * 0.4, ly * 0.4, R * 1.25);
      sh.addColorStop(0, 'rgba(255,250,230,0.22)'); sh.addColorStop(0.42, 'rgba(255,250,230,0)'); sh.addColorStop(0.78, 'rgba(12,22,70,0.22)'); sh.addColorStop(1, 'rgba(8,14,50,0.62)');
      ctx.fillStyle = sh; ctx.fillRect(-R, -R, R * 2, R * 2);
      if (geo.night) { ctx.fillStyle = 'rgba(6,10,40,0.5)'; ctx.beginPath(); ctx.rect(-R, -R, R * 2, R * 2); ctx.arc(-R * 0.55, -R * 0.1, R * 1.25, 0, TAU, true); ctx.fill(); }
      ctx.strokeStyle = 'rgba(200,230,255,0.35)'; ctx.lineWidth = R * 0.03; ctx.beginPath(); ctx.arc(0, 0, R - R * 0.015, 0, TAU); ctx.stroke();
    }
    ctx.restore(); // the clip opened by the base hook
    ctx.strokeStyle = P.ink; ctx.lineWidth = Math.max(5, R * 0.012); ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.stroke();
  });
})();
