// geo-anim.js — animated conquest for map regions (geo or blob): `flood` (an organic, boiling front spreading from a
// point and clipped to the region, with a bright leading edge) through T.MAP_COVERS, and the `drawOn` border trace
// (T.mapTraceBorder, called by map.js: an ink line runs round the border with a pen dot, then the fill fades in).
// For geo maps, geo.js converts flood.from from lon/lat and shares one origin and reach across all parts of a region.
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL, TAU = Math.PI * 2, N = 120;
  if (!T.MAP_COVERS) throw new Error('geo-anim.js needs map.js loaded first');

  // radius of the flood front at angle a: never below the base reach, lobed by seeded noise that boils on twos
  function front(o, reach, e, seed, edge, lt) {
    const pts = [], amp = edge === 'circle' ? 0 : 0.22, boil = Math.floor(lt * 15) * 0.07;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * TAU, n = T.noise(Math.cos(a) * 2.2 + 7 + boil, seed) * 0.6 + T.noise(Math.sin(a) * 4.1 + 3 - boil, seed + 1) * 0.4;
      const r = reach * e * (1 + amp + amp * n);
      pts.push([o[0] + Math.cos(a) * r, o[1] + Math.sin(a) * r]);
    }
    return pts;
  }
  const trace = (k, pts) => { k.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) k.lineTo(pts[i][0], pts[i][1]); k.closePath(); };

  T.MAP_COVERS.push((ctx, R, g, lt, pts, slab) => {
    const F = R.flood; if (!F) return;
    const p = T.prog(lt, F.at ?? 0, F.dur ?? 1.5); if (p <= 0) return;
    const e = T.ease[F.ease ?? 'inOut'] ? T.ease[F.ease ?? 'inOut'](p) : p;
    const o = F.from ? [g.X(F.from[0]), g.Y(F.from[1])] : g.centroid(R);
    const reach = F.reach ?? Math.max(...pts.map(([x, y]) => Math.hypot(x - o[0], y - o[1]))) * 1.05;
    const byR = typeof F.by === 'string' ? g.byId[F.by] : null, col = F.color ?? (byR ? g.color(byR, lt) : F.by) ?? P.red;
    const seed = T.hash(String(F.seed ?? R.id ?? 'flood')) % 997, fr = front(o, reach, e, seed, F.edge, lt);
    ctx.save(); ctx.beginPath(); trace(ctx, fr); ctx.clip(); slab(col); ctx.restore();
    if (p < 1 && F.foam !== false) {
      ctx.save(); ctx.beginPath(); T.smoothPath(ctx, pts); ctx.clip(); ctx.lineJoin = 'round';
      ctx.strokeStyle = T.shade(col, 0.45); ctx.globalAlpha *= 0.85; ctx.lineWidth = 12; ctx.beginPath(); trace(ctx, fr); ctx.stroke();
      ctx.strokeStyle = T.shade(col, -0.5); ctx.globalAlpha = 1; ctx.lineWidth = 3; ctx.beginPath(); trace(ctx, fr); ctx.stroke();
      ctx.restore();
    }
  });

  // drawOn: {at, dur, color, width}; p = 0..1 of the trace (map.js fades the fill in over the last part)
  T.mapTraceBorder = (ctx, pts, p, D, col) => {
    if (p <= 0 || pts.length < 2) return;
    const ring = pts.concat([pts[0]]); let len = 0;
    for (let i = 1; i < ring.length; i++) len += Math.hypot(ring[i][0] - ring[i - 1][0], ring[i][1] - ring[i - 1][1]);
    const w = D.width ?? 6, ink = D.color ?? P.ink;
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = ink; ctx.lineWidth = w;
    ctx.setLineDash([len * p, len * 2]); ctx.beginPath(); trace(ctx, pts); ctx.stroke(); ctx.setLineDash([]);
    if (p < 1 && D.pen !== false) { const e = T.pathAt(ring, p); T.outlined(ctx, (k) => k.arc(e.x, e.y, w * 1.4, 0, TAU), D.dot ?? col, { line: 3, ink }); }
    ctx.restore();
  };
})();
