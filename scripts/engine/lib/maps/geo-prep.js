// geo-prep.js — the map prep step for `geo` maps (T.MAP_PREP): turns geo regions (iso codes, continents, lon/lat
// rings) into map-box `pts` (+ `holes`) parts the region pipeline already draws, converts region cover origins and
// lon/lat overlay points, and bends lon/lat arrows along the great circle. Pure function of (layer, time).
(function () {
  'use strict';
  const T = window.TOON, W = T.W, H = T.H;
  if (!T.MAP_PREP || !T.geoProjector || !T.geoMerge) throw new Error('geo-prep.js needs map.js, geo.js and geo-proj.js loaded first');
  const list = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
  const wrap180 = T.geoWrap180;
  const isLL = (p) => Array.isArray(p) && p.length >= 2 && typeof p[0] === 'number' && typeof p[1] === 'number';
  const ringArea = (pts) => { let a = 0; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) a += pts[j][0] * pts[i][1] - pts[i][0] * pts[j][1]; return a / 2; };
  // a part counts when its bounding box overlaps the map box (grown by `margin`, a fraction of the box)
  const onBox = (pts, m) => { let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity; for (const q of pts) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); } return x1 > -m && x0 < 1 + m && y1 > -m && y0 < 1 + m; };
  // Hand-drawn border for a few-point lon/lat ring: edges split every ~0.6 degrees and wobbled by seeded noise
  // (amplitude `rough` degrees, fading to zero at the given corners so they stay put).
  function roughen(ring, seed, rough) {
    const out = [];
    ring.forEach((a, i) => {
      const b = ring[(i + 1) % ring.length], dx = wrap180(b[0] - a[0]), dy = b[1] - a[1], len = Math.hypot(dx, dy), n = Math.max(1, Math.ceil(len / 0.6));
      for (let j = 0; j < n; j++) {
        const t = j / n, w = rough * Math.sin(Math.PI * t) * Math.min(1, len / 3), o = T.noise(i * 7.3 + t * len * 0.9, seed % 1000) * w;
        out.push([a[0] + dx * t - (dy / (len || 1)) * o, a[1] + dy * t + (dx / (len || 1)) * o]);
      }
    });
    return out;
  }
  const BARE_PART = { face: null, label: null, strikeLabel: null, arms: null, figures: null };

  // [{outer, holes}] in lon/lat for a region's selection
  function regionParts(R, lv, where) {
    const parts = [];
    if (R.lonlat != null) {
      const rings = isLL(R.lonlat[0]) ? [R.lonlat] : R.lonlat;
      if (!Array.isArray(rings) || !rings.length) throw new Error(`map ${where}: lonlat must be a ring of 3+ [lon, lat] points (or a list of rings)`);
      rings.forEach((ring, k) => { if (!Array.isArray(ring) || ring.length < 3 || !ring.every(isLL)) throw new Error(`map ${where}: lonlat must be a ring of 3+ [lon, lat] points (or a list of rings)`);
        parts.push({ outer: R.rough === 0 ? ring : roughen(ring, T.hash(where + k), R.rough ?? 0.45), holes: [] }); });
    }
    let isos = list(R.iso);
    isos.forEach((iso) => T.geoCountry(iso, lv)); // throws a clear error for unknown codes
    if (R.continent != null) {
      const names = list(R.continent), hit = T.geoLevel(lv).countries.filter((c) => names.includes(c.cont));
      if (!hit.length) throw new Error(`map ${where}: unknown continent "${names.join(', ')}"`);
      isos = isos.concat(hit.map((c) => c.iso));
    }
    isos = [...new Set(isos)];
    const merged = isos.length && R.merge !== false ? T.geoMerge(isos, lv) : null;
    if (merged) parts.push(...merged);
    else for (const iso of isos) for (const poly of T.geoCountry(iso, lv).polys) parts.push({ outer: poly[0], holes: poly.slice(1) });
    if (!parts.length) throw new Error(`map ${where}: iso / continent / lonlat select no geometry (give at least one country or ring)`);
    return parts;
  }

  // holes wound against their outer ring, so the default nonzero fill leaves them open
  const orient = (outer, holes) => { const s = Math.sign(ringArea(outer)); return holes.map((h) => (Math.sign(ringArea(h)) === s ? h.slice().reverse() : h)); };

  function prepRegion(R, i, cx) {
    const { pr, lv, mw, mh, P } = cx, where = `region ${R.id ?? i}`;
    const conv = (p) => (isLL(p) ? P(p) : p);
    const fix = (o) => (o && o.from != null ? { ...o, from: conv(o.from) } : o);
    const base = { ...R, from: R.from != null ? conv(R.from) : R.from, conquer: fix(R.conquer), wipe: fix(R.wipe), flood: fix(R.flood) };
    for (const k of ['iso', 'lonlat', 'continent', 'labelAt']) delete base[k];
    if (R.labelAt) base.anchor = conv(R.labelAt);
    if (R.lonlat != null && R.clip == null) base.clip = 'land'; // drawn lon/lat territories stop at the real coast
    if (R.iso == null && R.lonlat == null && R.continent == null) return [base];
    const src = regionParts(R, lv, where), px2 = (q) => [q[0] * mw, q[1] * mh];
    const rings = src.flatMap((part) => pr.polygon(part.outer, part.holes)).map((c) => {
      const pts = c.pts.map((q) => [q[0], q[1]]);
      return { pts, holes: orient(pts, c.holes.map((h) => h.map((q) => [q[0], q[1]]))), vis: onBox(pts, R.margin ?? 0), area: Math.abs(ringArea(pts.map(px2))) };
    });
    let shown = rings.filter((r) => r.vis && r.area > (R.minArea ?? 40));
    if (!shown.length) shown = rings.filter((r) => r.vis).sort((a, b) => b.area - a.area).slice(0, 1);
    const hidden = !shown.length;
    if (hidden) { const o = src[0].outer; shown = [{ pts: o.map(([lon, lat]) => P([lon, lat])), holes: [], area: 0 }]; } // placeholder: keeps the id usable
    shown.sort((a, b) => b.area - a.area);
    if (!base.anchor) {
      const single = list(R.iso).length === 1 && R.lonlat == null && R.continent == null;
      if (single) { const c = T.geoCountry(list(R.iso)[0], lv), q = pr.project(c.label[0], c.label[1]); if (q[2]) base.anchor = [q[0], q[1]]; }
      if (!base.anchor) { let ax = 0, ay = 0, aw = 0; for (const r of shown) { const c = r.pts.reduce((a, q) => [a[0] + q[0], a[1] + q[1]], [0, 0]); ax += (c[0] / r.pts.length) * r.area; ay += (c[1] / r.pts.length) * r.area; aw += r.area; }
        base.anchor = aw > 0 ? [ax / aw, ay / aw] : shown[0].pts[0]; }
    }
    // covers share one origin, one reach and one noise seed across all parts, so a group floods / wipes as one shape
    const all = shown.flatMap((r) => r.pts), pxOf = (q) => [(q[0] - 0.5) * mw, (q[1] - 0.5) * mh];
    const reach = (o) => { const a = pxOf(o); return Math.max(...all.map((q) => { const b = pxOf(q); return Math.hypot(b[0] - a[0], b[1] - a[1]); })) * 1.05; };
    if (base.flood) { const o = base.flood.from ?? base.anchor; base.flood = { ...base.flood, from: o, reach: reach(o), seed: base.flood.seed ?? R.id ?? where }; }
    if (base.wipe) { const o = base.wipe.from ?? base.anchor; base.wipe = { ...base.wipe, from: o, reach: reach(o), extent: all.map(pxOf) }; }
    if (base.conquer && base.conquer.from == null && typeof base.conquer.by !== 'string') base.conquer = { ...base.conquer, from: base.anchor };
    const main = { ...base, pts: shown[0].pts, holes: shown[0].holes };
    if (hidden) Object.assign(main, { out: -1e9, outDur: 1e-6 });
    const extra = hidden ? [] : shown.slice(1).map((r, k) => ({ ...base, ...BARE_PART, id: R.id != null ? `${R.id}~${k + 1}` : undefined, pts: r.pts, holes: r.holes, anchor: undefined, drawOn: base.drawOn && { ...base.drawOn, pen: false } }));
    return [...extra, main]; // islands first, so the main part's face and label stay on top
  }

  // Walk overlay fields: {ll:[lon, lat]} -> [x, y]; {ll:[[lon, lat], ...], gc} -> [[x, y], ...]; {lon, lat, ...} -> adds x, y.
  function walk(v, P, depth) {
    if (depth > 8 || v == null || typeof v !== 'object') return v;
    if (Array.isArray(v)) return v.map((x) => walk(x, P, depth + 1));
    if (v.ll != null) {
      if (isLL(v.ll)) return P(v.ll);
      if (Array.isArray(v.ll) && v.ll.every(isLL)) return (v.gc ? T.geoDensify(v.ll) : v.ll).map(P);
      throw new Error('map geo: ll must be [lon, lat] or a list of [lon, lat] points');
    }
    const out = {};
    for (const [k, x] of Object.entries(v)) out[k] = walk(x, P, depth + 1);
    if (typeof v.lon === 'number' && typeof v.lat === 'number') { const q = P([v.lon, v.lat]); out.x = q[0]; out.y = q[1]; }
    return out;
  }
  // Arrow between two lon/lat ends: bend so the curve's middle sits on the great-circle midpoint.
  function gcArrow(A, cx) {
    const ends = [A.from, A.to].map((e) => (e && isLL(e.ll) ? e.ll : e && typeof e.lon === 'number' ? [e.lon, e.lat] : null));
    if (A.bend != null || A.gc === false || !ends[0] || !ends[1]) return A;
    const px = (ll) => { const q = cx.P(ll); return [(q[0] - 0.5) * cx.mw, (q[1] - 0.5) * cx.mh]; };
    const a = px(ends[0]), b = px(ends[1]), m = px(T.geoSlerp(ends[0], ends[1], 0.5)), dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
    let bend = (2 * ((m[0] - (a[0] + b[0]) / 2) * (dy / len) + (m[1] - (a[1] + b[1]) / 2) * (-dx / len))) / len;
    if (Math.abs(bend) < 0.06) bend = bend < 0 ? -0.06 : 0.06;
    return { ...A, bend };
  }

  const SKIP = new Set(['type', 'id', 'geo', 'regions', 'style', 'land', 'view', 'tilt', 'globe', 'table', 'image', 'x', 'y', 'w', 'h', 'move', 'swap', '__geo']);
  T.geoPrepare = (L, lt, env) => {
    if (!L.geo) return L;
    const mw = (L.w ?? 1.1) * W, mh = (L.h ?? 1.1) * H, pr = T.geoProjector(L.geo, mw, mh, lt), lv = T.geoDetail(L.geo, pr);
    const P = (ll) => { const q = pr.project(ll[0], ll[1]); return [q[0], q[1]]; };
    const cx = { pr, lv, mw, mh, P };
    const out = { ...L, __geo: { pr, lv, mw, mh } };
    out.regions = (L.regions || []).flatMap((R, i) => prepRegion(R, i, cx));
    if (L.arrows) out.arrows = list(L.arrows).map((A) => gcArrow(A, cx));
    for (const k of Object.keys(out)) if (!SKIP.has(k) && out[k] && typeof out[k] === 'object') out[k] = walk(out[k], P, 0);
    // {lon, lat} points come back as objects with x, y: fights, morphs and throws draw from plain [x, y] arrays
    const xy = (v) => (v && !Array.isArray(v) && typeof v === 'object' && typeof v.x === 'number' && typeof v.y === 'number' ? [v.x, v.y] : v);
    const pts = (v) => (Array.isArray(v) ? v.map(xy) : v);
    const each = (v, fn) => (v == null ? v : Array.isArray(v) ? v.map(fn) : fn(v));
    if (out.fights) out.fights = each(out.fights, (F) => (F && typeof F === 'object' ? { ...F, path: pts(F.path) } : F));
    if (out.morphs) out.morphs = each(out.morphs, (Mo) => (Mo && typeof Mo === 'object' ? { ...Mo, from: pts(Mo.from), to: pts(Mo.to) } : Mo));
    if (out.throws) out.throws = each(out.throws, (Th) => (Th && typeof Th === 'object' ? { ...Th, from: xy(Th.from), to: xy(Th.to) } : Th));
    return out;
  };
  T.MAP_PREP.push((L, lt, env) => T.geoPrepare(L, lt, env));
})();
