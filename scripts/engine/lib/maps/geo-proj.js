// geo-proj.js — projections for geo maps (T.GEO_PROJ: equirect, mercator, ortho), animatable geo values and great
// circles. T.geoProjector(geo, mw, mh, lt) maps lon/lat to normalized map-box coordinates:
//   project(lon, lat) -> [x, y, visible]            (far-side points are pinned to the globe's limb)
//   polygon(outer, holes) -> [{pts, holes}]          (flat: one copy per visible side of the seam; ortho: clipped
//                                                     at the horizon, the cut closed along the limb)
//   line(pts) -> [[[x, y, visible], ...], ...]       (open polylines; hidden points break the line)
(function () {
  'use strict';
  const T = window.TOON, H = T.H, DEG = Math.PI / 180;
  const wrap180 = (d) => ((((d + 180) % 360) + 360) % 360) - 180;
  T.geoWrap180 = wrap180;

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

  const bboxHits = (pts, m) => { let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity; for (const q of pts) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); } return x1 > -m && x0 < 1 + m && y1 > -m && y0 < 1 + m; };

  function flatProjector(name, P, lon0, lat0, mw, out, geo, lt, zoom, rot, mh) {
    const span = anim(geo.span, lt, 60) / zoom, k = mw / span, [cu, cv] = P.fwd(lon0, lat0);
    const at = (dl, lat) => { const [u, v] = P.fwd(lon0 + dl, lat); return out((u - cu) * k, -(v - cv) * k, true); };
    // longitude offsets kept continuous along the path (no jump at the antimeridian)
    const unwrap = (pts) => { const d = new Array(pts.length); let lo = Infinity, hi = -Infinity;
      for (let i = 0; i < pts.length; i++) { d[i] = i ? d[i - 1] + wrap180(pts[i][0] - pts[i - 1][0]) : wrap180(pts[0][0] - lon0); lo = Math.min(lo, d[i]); hi = Math.max(hi, d[i]); }
      return { d, lo, hi, global: hi - lo > 300 }; };
    const place = (pts, u, s) => pts.map((p, i) => at(u.d[i] + s, p[1]));
    // every 360-degree copy whose box touches the map box (margin 0.5): wide spans show both sides of the seam
    const copies = (u, project) => { if (u.global) return [0]; const base = -360 * Math.round((u.lo + u.hi) / 720), hits = [];
      for (const s of [base - 360, base, base + 360]) if (bboxHits(project(s), 0.5)) hits.push(s); return hits.length ? hits : [base]; };
    return {
      name, flat: true, k, span, center: [lon0, lat0], key: [name, lon0, lat0, span, rot, mw, mh].join(','),
      project: (lon, lat) => at(wrap180(lon - lon0), lat),
      polygon(outer, holes = []) {
        const u = unwrap(outer), proj = (s) => (u.global ? outer.map(([lon, lat]) => at(lon - lon0, lat)) : place(outer, u, s)), mid = (u.lo + u.hi) / 2;
        return copies(u, proj).map((s) => ({
          pts: proj(s),
          holes: holes.map((h) => { const v = unwrap(h); return place(h, v, s + 360 * Math.round((mid - (v.lo + v.hi) / 2) / 360)); }),
        }));
      },
      line(pts) { const u = unwrap(pts); return copies(u, (s) => place(pts, u, s)).map((s) => place(pts, u, s)); },
    };
  }

  // ---------- orthographic: rotate to the view frame, clip at z = 0, close cuts along the limb ----------
  function orthoProjector(name, lon0, lat0, geo, zoom, rot, out, mw, mh) {
    const R = (geo.radius ?? 0.42) * H * zoom, l0 = lon0 * DEG, s0 = Math.sin(lat0 * DEG), c0 = Math.cos(lat0 * DEG);
    const view = (lon, lat) => { const l = lon * DEG - l0, p = lat * DEG, cp = Math.cos(p), sp = Math.sin(p), cl = Math.cos(l);
      return [cp * Math.sin(l), c0 * sp - s0 * cp * cl, s0 * sp + c0 * cp * cl]; };
    const toMap = (x, y, vis) => out(x * R, -y * R, vis);
    const project = (lon, lat) => { let [x, y, z] = view(lon, lat); const vis = z >= 0;
      if (!vis) { const n = Math.hypot(x, y) || 1; x /= n; y /= n; } return toMap(x, y, vis); };
    // view vectors with long edges split along the great circle (every ~3 degrees) so the clip follows the curve
    const dense = (pts) => { const v = pts.map(([lon, lat]) => view(lon, lat)), outv = [];
      for (let i = 0; i < v.length; i++) { const a = v[i], b = v[(i + 1) % v.length], ang = Math.acos(T.clamp(a[0] * b[0] + a[1] * b[1] + a[2] * b[2], -1, 1)), n = Math.max(1, Math.ceil(ang / (3 * DEG)));
        for (let j = 0; j < n; j++) { const t = j / n, q = [T.lerp(a[0], b[0], t), T.lerp(a[1], b[1], t), T.lerp(a[2], b[2], t)], l = Math.hypot(q[0], q[1], q[2]) || 1; outv.push([q[0] / l, q[1] / l, q[2] / l]); } }
      return outv; };
    function clipRing(pts) {
      const v = dense(pts);
      if (v.every((q) => q[2] >= 0)) return v.map((q) => toMap(q[0], q[1], true));
      if (v.every((q) => q[2] < 0)) return null;
      const res = []; // [x, y, kind]: kind 0 = vertex, 1 = exit, 2 = entry
      for (let i = 0; i < v.length; i++) {
        const a = v[i], b = v[(i + 1) % v.length], av = a[2] >= 0, bv = b[2] >= 0;
        if (av) res.push([a[0], a[1], 0]);
        if (av !== bv) { const t = a[2] / (a[2] - b[2]), x = T.lerp(a[0], b[0], t), y = T.lerp(a[1], b[1], t), l = Math.hypot(x, y) || 1; res.push([x / l, y / l, av ? 1 : 2]); }
      }
      const outp = [];
      for (let i = 0; i < res.length; i++) {
        const p = res[i]; outp.push(toMap(p[0], p[1], true));
        if (p[2] !== 1) continue;
        const q = res[(i + 1) % res.length], a0 = Math.atan2(p[1], p[0]); let da = Math.atan2(q[1], q[0]) - a0;
        da = ((da + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; // shorter way round the limb
        const n = Math.ceil(Math.abs(da) / (5 * DEG));
        for (let j = 1; j < n; j++) { const a = a0 + (da * j) / n; outp.push(toMap(Math.cos(a), Math.sin(a), true)); }
      }
      return outp.length > 2 ? outp : null;
    }
    return {
      name, flat: false, R, center: [lon0, lat0], key: [name, lon0, lat0, R, rot, mw, mh].join(','), project,
      polygon(outer, holes = []) { const o = clipRing(outer); return o ? [{ pts: o, holes: holes.map(clipRing).filter(Boolean) }] : []; },
      line: (pts) => [pts.map(([lon, lat]) => project(lon, lat))],
    };
  }

  // geo: {proj, center:[lon, lat], span (degrees of longitude across the map box), zoom, rotate (deg), radius (ortho, of H)}
  T.geoProjector = (geo, mw, mh, lt) => {
    const name = geo.proj ?? 'equirect', P = T.GEO_PROJ[name];
    if (!P) throw new Error(`map geo: unknown proj "${name}" (known: ${Object.keys(T.GEO_PROJ).join(', ')})`);
    const c = anim(geo.center, lt, [0, 0]), zoom = anim(geo.zoom, lt, 1), rot = anim(geo.rotate, lt, 0) * DEG, cr = Math.cos(rot), sr = Math.sin(rot);
    const out = (px, py, vis) => [0.5 + (px * cr - py * sr) / mw, 0.5 + (px * sr + py * cr) / mh, vis];
    return P.flat ? flatProjector(name, P, c[0], c[1], mw, out, geo, lt, zoom, rot, mh) : orthoProjector(name, c[0], c[1], geo, zoom, rot, out, mw, mh);
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
  T.geoDensify = (pts) => {
    const out = [pts[0]];
    for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], d = Math.hypot(wrap180(b[0] - a[0]), b[1] - a[1]), n = Math.max(1, Math.ceil(d / 2));
      for (let j = 1; j <= n; j++) out.push(T.geoSlerp(a, b, j / n)); }
    return out;
  };
})();
