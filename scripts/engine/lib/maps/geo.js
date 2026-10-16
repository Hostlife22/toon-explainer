// geo.js — real geography for the map layer. Decodes the bundled Natural Earth data (geo-data-lo.js = 110m,
// geo-data-hi.js = 50m, written by scripts/build_geo.py), projects lon/lat with T.GEO_PROJ (equirect, mercator,
// ortho) and runs the map prep step (T.MAP_PREP) that turns `geo` regions (iso codes, continents, lon/lat rings) and
// lon/lat overlay points into the normalized map-box coordinates the rest of the map pipeline already understands.
// Drawing lives in geo-base.js (land, coasts, globe) and map-paint.js (painted style).
(function () {
  'use strict';
  const T = window.TOON, W = T.W, H = T.H, DEG = Math.PI / 180;
  if (!T.MAP_PREP) throw new Error('geo.js needs map.js loaded first');
  const list = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
  const wrap180 = (d) => ((((d + 180) % 360) + 360) % 360) - 180;

  // ---------- decoding (zigzag varints, 64-letter alphabet; see scripts/build_geo.py) ----------
  const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/', VAL = {};
  for (let i = 0; i < ALPHA.length; i++) VAL[ALPHA[i]] = i;
  const reader = (s) => { let i = 0; return () => { let z = 0, mul = 1, c; do { c = VAL[s[i++]]; z += (c & 31) * mul; mul *= 32; } while (c & 32); return z % 2 ? -(z + 1) / 2 : z / 2; }; };
  const readLine = (s, q) => { const rd = reader(s), n = rd(); let x = rd(), y = rd(); const out = [[x / q, y / q]]; for (let j = 1; j < n; j++) { x += rd(); y += rd(); out.push([x / q, y / q]); } return out; };
  const levels = {};
  function level(lv) {
    if (levels[lv]) return levels[lv];
    const D = T.GEO_DATA && T.GEO_DATA[lv];
    if (!D) throw new Error(`map geo: geography level "${lv}" is not loaded (geo-data-${lv}.js)`);
    const q = D.q, rd = reader(D.arcs), na = rd(), arcs = [];
    for (let a = 0; a < na; a++) { const n = rd(); let x = rd(), y = rd(); const pts = [[x / q, y / q]]; for (let j = 1; j < n; j++) { x += rd(); y += rd(); pts.push([x / q, y / q]); } arcs.push(pts); }
    const use = new Array(na).fill(0), countries = [], byIso = {};
    for (const [iso, name, cont, lx, ly, enc] of D.countries) {
      const r = reader(enc), np = r(), polys = [], outer = [];
      for (let p = 0; p < np; p++) {
        const nr = r(), rings = [];
        for (let k = 0; k < nr; k++) {
          const nref = r(), ring = [], refs = [];
          for (let j = 0; j < nref; j++) {
            const ref = r(), idx = ref < 0 ? ~ref : ref; use[idx]++; refs.push(ref);
            const pts = ref < 0 ? arcs[idx].slice().reverse() : arcs[idx];
            for (let m = ring.length ? 1 : 0; m < pts.length; m++) ring.push(pts[m]);
          }
          if (ring.length > 1 && ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1]) ring.pop();
          rings.push(ring);
          if (k === 0) outer.push(refs);
        }
        polys.push(rings);
      }
      const c = byIso[iso] || { iso, name, cont, label: [lx / q, ly / q], polys: [], outer: [] };
      c.polys = c.polys.concat(polys); c.outer = c.outer.concat(outer);
      if (!byIso[iso]) { byIso[iso] = c; countries.push(c); }
    }
    const lakes = D.lakes.map(([name, enc]) => ({ name, ring: readLine(enc, q) }));
    const rivers = D.rivers.map(([name, rank, enc]) => ({ name, rank, line: readLine(enc, q) }));
    levels[lv] = { lv, arcs, use, countries, byIso, lakes, rivers };
    return levels[lv];
  }
  T.geoLevel = level;
  T.geoCountry = (iso, lv = 'hi') => {
    const c = level(lv).byIso[iso] || level(lv === 'hi' ? 'lo' : 'hi').byIso[iso];
    if (!c) throw new Error(`map geo: unknown country code "${iso}" (use ISO 3166 alpha-3, e.g. FRA, CHN; T.geoCountries() lists them)`);
    return c;
  };
  T.geoCountries = (lv = 'hi') => level(lv).countries.map((c) => c.iso);
  // Union of countries as lon/lat rings: arcs shared by two members are inner borders and drop out, the rest are
  // chained end to end (TopoJSON-style merge on the shared-arc topology). Returns null if a member is missing at lv.
  T.geoMerge = (isos, lv = 'hi') => {
    const D = level(lv), members = isos.map((iso) => D.byIso[iso]);
    if (members.some((c) => !c)) return null;
    const cnt = new Map(), refs = members.flatMap((c) => c.outer);
    for (const ring of refs) for (const ref of ring) { const i = ref < 0 ? ~ref : ref; cnt.set(i, (cnt.get(i) || 0) + 1); }
    const pieces = [];
    for (const ring of refs) for (const ref of ring) { const i = ref < 0 ? ~ref : ref; if (cnt.get(i) === 1) pieces.push(ref < 0 ? D.arcs[i].slice().reverse() : D.arcs[i]); }
    const key = (q) => q[0] + ',' + q[1], byStart = new Map(), byEnd = new Map();
    const index = (m, k, i) => { if (!m.has(k)) m.set(k, []); m.get(k).push(i); };
    pieces.forEach((pc, i) => { index(byStart, key(pc[0]), i); index(byEnd, key(pc[pc.length - 1]), i); });
    const used = new Array(pieces.length).fill(false), out = [];
    for (let s0 = 0; s0 < pieces.length; s0++) {
      if (used[s0]) continue;
      const ring = []; let i = s0;
      while (i != null && !used[i]) {
        used[i] = true; const pc = pieces[i];
        for (let m = ring.length ? 1 : 0; m < pc.length; m++) ring.push(pc[m]);
        const end = key(pc[pc.length - 1]); let next = (byStart.get(end) || []).find((j) => !used[j]);
        if (next == null) { next = (byEnd.get(end) || []).find((j) => !used[j]); if (next != null) pieces[next] = pieces[next].slice().reverse(); } // mixed winding
        i = next;
      }
      if (ring.length > 1 && key(ring[0]) === key(ring[ring.length - 1])) ring.pop();
      if (ring.length > 2) out.push(ring);
    }
    return out;
  };

  // ---------- projections ----------
  const merc = (lat) => Math.log(Math.tan(Math.PI / 4 + (T.clamp(lat, -85, 85) * DEG) / 2)) / DEG;
  T.GEO_PROJ = {
    equirect: { flat: true, fwd: (lon, lat) => [lon, lat] },
    mercator: { flat: true, fwd: (lon, lat) => [lon, merc(lat)] },
    ortho: { flat: false },
  };
  // Animatable geo value: constant or [{at, v, ease}] (eased inOut by default; lon/lat pairs take the short way round).
  function anim(v, lt, def) {
    if (v == null) return def;
    if (!Array.isArray(v) || !v.length || typeof v[0] !== 'object' || Array.isArray(v[0])) return v;
    if (lt <= (v[0].at ?? 0)) return v[0].v;
    for (let i = 1; i < v.length; i++) {
      const a = v[i - 1], b = v[i];
      if (lt < (b.at ?? 0)) {
        const e = T.easeBy(b.ease || 'inOut')(T.prog(lt, a.at ?? 0, (b.at ?? 0) - (a.at ?? 0)));
        if (Array.isArray(a.v)) return [a.v[0] + wrap180(b.v[0] - a.v[0]) * e, T.lerp(a.v[1], b.v[1], e)];
        return T.lerp(a.v, b.v, e);
      }
    }
    return v[v.length - 1].v;
  }
  T.geoAnim = anim;
  // geo: {proj, center:[lon, lat], span (degrees of longitude across the map box), zoom, rotate (deg), radius (ortho, of H)}
  T.geoProjector = (geo, mw, mh, lt) => {
    const name = geo.proj ?? 'equirect', P = T.GEO_PROJ[name];
    if (!P) throw new Error(`map geo: unknown proj "${name}" (known: ${Object.keys(T.GEO_PROJ).join(', ')})`);
    const c = anim(geo.center, lt, [0, 0]), lon0 = c[0], lat0 = c[1], zoom = anim(geo.zoom, lt, 1), rot = anim(geo.rotate, lt, 0) * DEG;
    const cr = Math.cos(rot), sr = Math.sin(rot);
    const out = (px, py, vis) => [0.5 + (px * cr - py * sr) / mw, 0.5 + (px * sr + py * cr) / mh, vis];
    if (P.flat) {
      const span = anim(geo.span, lt, 60) / zoom, k = mw / span, [cu, cv] = P.fwd(lon0, lat0);
      const at = (dl, lat) => { const [u, v] = P.fwd(lon0 + dl, lat); return out((u - cu) * k, -(v - cv) * k, true); };
      return {
        name, flat: true, k, span, center: [lon0, lat0], key: [name, lon0, lat0, span, rot, mw, mh].join(','),
        project: (lon, lat) => at(wrap180(lon - lon0), lat),
        // rings stay continuous across the antimeridian; rings that circle the globe (Antarctica) are not unwrapped
        ring(pts) {
          const d = new Array(pts.length); let lo = Infinity, hi = -Infinity;
          for (let i = 0; i < pts.length; i++) { d[i] = i ? d[i - 1] + wrap180(pts[i][0] - pts[i - 1][0]) : wrap180(pts[0][0] - lon0); lo = Math.min(lo, d[i]); hi = Math.max(hi, d[i]); }
          if (hi - lo > 300) return pts.map(([lon, lat]) => at(lon - lon0, lat));
          const shift = -360 * Math.round((lo + hi) / 720);
          return pts.map((p, i) => at(d[i] + shift, p[1]));
        },
      };
    }
    const R = (geo.radius ?? 0.42) * H * zoom, l0 = lon0 * DEG, p0 = lat0 * DEG, s0 = Math.sin(p0), c0 = Math.cos(p0);
    const project = (lon, lat) => {
      const l = lon * DEG - l0, p = lat * DEG, cp = Math.cos(p), sp = Math.sin(p), cl = Math.cos(l);
      let x = cp * Math.sin(l), y = c0 * sp - s0 * cp * cl; const vis = s0 * sp + c0 * cp * cl >= 0;
      if (!vis) { const n = Math.hypot(x, y) || 1; x /= n; y /= n; } // far side: pinned to the limb
      return out(x * R, -y * R, vis);
    };
    return { name, flat: false, R, center: [lon0, lat0], key: [name, lon0, lat0, R, rot, mw, mh].join(','), project, ring: (pts) => pts.map(([lon, lat]) => project(lon, lat)) };
  };
  T.geoDetail = (geo, pr) => (geo.detail === 'lo' || geo.detail === 'hi' ? geo.detail : pr.flat ? (pr.span < 110 ? 'hi' : 'lo') : pr.R > 0.75 * H ? 'hi' : 'lo');

  // ---------- great circles ----------
  const vec = ([lon, lat]) => [Math.cos(lat * DEG) * Math.cos(lon * DEG), Math.cos(lat * DEG) * Math.sin(lon * DEG), Math.sin(lat * DEG)];
  const unvec = ([x, y, z]) => [Math.atan2(y, x) / DEG, Math.atan2(z, Math.hypot(x, y)) / DEG];
  T.geoSlerp = (a, b, t) => {
    const A = vec(a), B = vec(b), d = Math.acos(T.clamp(A[0] * B[0] + A[1] * B[1] + A[2] * B[2], -1, 1));
    if (d < 1e-9) return a.slice();
    const s = Math.sin(d), ka = Math.sin((1 - t) * d) / s, kb = Math.sin(t * d) / s;
    return unvec([A[0] * ka + B[0] * kb, A[1] * ka + B[1] * kb, A[2] * ka + B[2] * kb]);
  };
  const densify = (pts) => {
    const out = [pts[0]];
    for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], d = Math.hypot(wrap180(b[0] - a[0]), b[1] - a[1]), n = Math.max(1, Math.ceil(d / 2));
      for (let j = 1; j <= n; j++) out.push(T.geoSlerp(a, b, j / n)); }
    return out;
  };

  // ---------- prep: lon/lat -> normalized map coordinates ----------
  const isLL = (p) => Array.isArray(p) && p.length >= 2 && typeof p[0] === 'number' && typeof p[1] === 'number';
  const ringArea = (pts) => { let a = 0; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) a += pts[j][0] * pts[i][1] - pts[i][0] * pts[j][1]; return Math.abs(a / 2); };
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

  function regionParts(R, lv, where) {
    const parts = [];
    if (R.lonlat != null) {
      const rings = isLL(R.lonlat[0]) ? [R.lonlat] : R.lonlat;
      rings.forEach((ring, k) => { if (!Array.isArray(ring) || ring.length < 3 || !ring.every(isLL)) throw new Error(`map ${where}: lonlat must be a ring of 3+ [lon, lat] points (or a list of rings)`);
        parts.push(R.rough === 0 ? ring : roughen(ring, T.hash(where + k), R.rough ?? 0.45)); });
    }
    let isos = list(R.iso);
    isos.forEach((iso) => T.geoCountry(iso, lv)); // throws a clear error for unknown codes
    if (R.continent != null) {
      const names = list(R.continent), hit = level(lv).countries.filter((c) => names.includes(c.cont));
      if (!hit.length) throw new Error(`map ${where}: unknown continent "${names.join(', ')}"`);
      isos = isos.concat(hit.map((c) => c.iso));
    }
    const merged = isos.length && R.merge !== false ? T.geoMerge(isos, lv) : null;
    if (merged) parts.push(...merged);
    else for (const iso of isos) for (const poly of T.geoCountry(iso, lv).polys) parts.push(poly[0]);
    return parts;
  }

  function prepRegion(R, i, cx) {
    const { pr, lv, mw, mh, P } = cx, where = `region ${R.id ?? i}`;
    const conv = (p) => (isLL(p) ? P(p) : p);
    const fix = (o) => (o && o.from != null ? { ...o, from: conv(o.from) } : o);
    let base = { ...R, from: R.from != null ? conv(R.from) : R.from, conquer: fix(R.conquer), wipe: fix(R.wipe), flood: fix(R.flood) };
    for (const k of ['iso', 'lonlat', 'continent', 'labelAt']) delete base[k];
    if (R.labelAt) base.anchor = conv(R.labelAt);
    if (R.lonlat != null && R.clip == null) base.clip = 'land'; // drawn lon/lat territories stop at the real coast
    if (R.iso == null && R.lonlat == null && R.continent == null) return [base];
    const rings = regionParts(R, lv, where).map((ring) => {
      const pts = pr.ring(ring), vis = pts.some((q) => q[2]) && onBox(pts, R.margin ?? 0);
      return { pts: pts.map((q) => [q[0], q[1]]), vis, area: ringArea(pts.map((q) => [q[0] * mw, q[1] * mh])) };
    });
    let shown = rings.filter((r) => r.vis && r.area > (R.minArea ?? 40));
    if (!shown.length) shown = rings.filter((r) => r.vis).sort((a, b) => b.area - a.area).slice(0, 1);
    const hidden = !shown.length;
    if (hidden) shown = rings.slice().sort((a, b) => b.area - a.area).slice(0, 1);
    shown.sort((a, b) => b.area - a.area);
    if (!base.anchor) {
      const single = list(R.iso).length === 1 && R.lonlat == null && R.continent == null;
      if (single) { const c = T.geoCountry(list(R.iso)[0], lv), q = pr.project(c.label[0], c.label[1]); if (q[2]) base.anchor = [q[0], q[1]]; }
      if (!base.anchor) { let ax = 0, ay = 0, aw = 0; for (const r of shown) { const c = r.pts.reduce((a, q) => [a[0] + q[0], a[1] + q[1]], [0, 0]); ax += (c[0] / r.pts.length) * r.area; ay += (c[1] / r.pts.length) * r.area; aw += r.area; }
        base.anchor = aw > 0 ? [ax / aw, ay / aw] : shown[0].pts[0]; }
    }
    // covers share one origin and one reach across all parts, so a group floods / wipes as one shape
    const all = shown.flatMap((r) => r.pts), pxOf = (q) => [(q[0] - 0.5) * mw, (q[1] - 0.5) * mh];
    const reach = (o) => { const a = pxOf(o); return Math.max(...all.map((q) => { const b = pxOf(q); return Math.hypot(b[0] - a[0], b[1] - a[1]); })) * 1.05; };
    if (base.flood) { const o = base.flood.from ?? base.anchor; base.flood = { ...base.flood, from: o, reach: reach(o) }; }
    if (base.wipe) { const o = base.wipe.from ?? base.anchor; base.wipe = { ...base.wipe, from: o, reach: reach(o), extent: all.map(pxOf) }; }
    if (base.conquer && base.conquer.from == null && typeof base.conquer.by !== 'string') base.conquer = { ...base.conquer, from: base.anchor };
    const main = { ...base, pts: shown[0].pts };
    if (hidden) Object.assign(main, { out: -1e9, outDur: 1e-6 });
    const extra = hidden ? [] : shown.slice(1).map((r, k) => ({ ...base, ...BARE_PART, id: R.id != null ? `${R.id}~${k + 1}` : undefined, pts: r.pts, anchor: undefined, drawOn: base.drawOn && { ...base.drawOn, pen: false } }));
    return [...extra, main]; // islands first, so the main part's face and label stay on top
  }

  // Walk overlay fields: {ll:[lon, lat]} -> [x, y]; {ll:[[lon, lat], ...], gc} -> [[x, y], ...]; {lon, lat, ...} -> adds x, y.
  function walk(v, P, depth) {
    if (depth > 8 || v == null || typeof v !== 'object') return v;
    if (Array.isArray(v)) return v.map((x) => walk(x, P, depth + 1));
    if (v.ll != null) {
      if (isLL(v.ll)) return P(v.ll);
      if (Array.isArray(v.ll) && v.ll.every(isLL)) return (v.gc ? densify(v.ll) : v.ll).map(P);
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
    for (const k of Object.keys(out)) if (!SKIP.has(k) && k !== 'regions' && out[k] && typeof out[k] === 'object') out[k] = walk(out[k], P, 0);
    return out;
  };
  T.MAP_PREP.push((L, lt, env) => T.geoPrepare(L, lt, env));
})();
