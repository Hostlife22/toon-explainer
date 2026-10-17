// geo.js — real geography for the map layer: decodes the bundled Natural Earth data (geo-data-lo.js = 110m,
// geo-data-hi.js = 50m, written by scripts/build_geo.py) and merges countries on their shared-arc topology.
// Projections live in geo-proj.js, the map prep step (lon/lat -> map box) in geo-prep.js, drawing in geo-base.js
// (land, coasts, globe) and map-paint.js (painted style).
(function () {
  'use strict';
  const T = window.TOON;

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
      const r = reader(enc), np = r(), polys = [], refsAll = [];
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
          refsAll.push(refs);
        }
        polys.push(rings);
      }
      const c = byIso[iso] || { iso, name, cont, label: [lx / q, ly / q], polys: [], refs: [] };
      c.polys = c.polys.concat(polys); c.refs = c.refs.concat(refsAll);
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
  // Union of countries as [{outer, holes}] lon/lat polygons: arcs used twice inside the selection are inner borders
  // (or a hole filled by another member) and drop out; the rest are chained end to end (TopoJSON-style merge), then
  // rings are nested by containment (odd depth = hole). Cached per selection; null if a member is missing at lv.
  const pip = (pts, x, y) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
  const ringArea = (r) => { let a = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += r[j][0] * r[i][1] - r[i][0] * r[j][1]; return Math.abs(a / 2); };
  T.geoNest = (rings) => {
    const area = rings.map(ringArea), polys = [], parent = rings.map(() => -1), depth = rings.map(() => 0);
    rings.forEach((r, i) => { let best = -1; rings.forEach((o, j) => { if (j !== i && area[j] > area[i] && pip(o, r[0][0], r[0][1])) { depth[i]++; if (best < 0 || area[j] < area[best]) best = j; } }); parent[i] = best; });
    const at = new Map();
    rings.forEach((r, i) => { if (depth[i] % 2 === 0) { at.set(i, polys.length); polys.push({ outer: r, holes: [] }); } });
    rings.forEach((r, i) => { if (depth[i] % 2 === 1 && at.has(parent[i])) polys[at.get(parent[i])].holes.push(r); });
    return polys;
  };
  const merged = new Map();
  T.geoMerge = (isos, lv = 'hi') => {
    const sel = [...new Set(isos)], key = lv + ':' + sel.join(',');
    if (merged.has(key)) return merged.get(key);
    const D = level(lv), members = sel.map((iso) => D.byIso[iso]);
    if (members.some((c) => !c)) return null;
    const cnt = new Map(), refs = members.flatMap((c) => c.refs);
    for (const ring of refs) for (const ref of ring) { const i = ref < 0 ? ~ref : ref; cnt.set(i, (cnt.get(i) || 0) + 1); }
    const pieces = [];
    for (const ring of refs) for (const ref of ring) { const i = ref < 0 ? ~ref : ref; if (cnt.get(i) === 1) pieces.push(ref < 0 ? D.arcs[i].slice().reverse() : D.arcs[i]); }
    const pkey = (q) => q[0] + ',' + q[1], byStart = new Map(), byEnd = new Map();
    const index = (m, k, i) => { if (!m.has(k)) m.set(k, []); m.get(k).push(i); };
    pieces.forEach((pc, i) => { index(byStart, pkey(pc[0]), i); index(byEnd, pkey(pc[pc.length - 1]), i); });
    const used = new Array(pieces.length).fill(false), rings = [];
    for (let s0 = 0; s0 < pieces.length; s0++) {
      if (used[s0]) continue;
      const ring = []; let i = s0;
      while (i != null && !used[i]) {
        used[i] = true; const pc = pieces[i];
        for (let m = ring.length ? 1 : 0; m < pc.length; m++) ring.push(pc[m]);
        const end = pkey(pc[pc.length - 1]); let next = (byStart.get(end) || []).find((j) => !used[j]);
        if (next == null) { next = (byEnd.get(end) || []).find((j) => !used[j]); if (next != null) pieces[next] = pieces[next].slice().reverse(); } // mixed winding
        i = next;
      }
      if (ring.length > 1 && pkey(ring[0]) === pkey(ring[ring.length - 1])) ring.pop();
      if (ring.length > 2) rings.push(ring);
    }
    const out = T.geoNest(rings);
    merged.set(key, out);
    return out;
  };

})();
