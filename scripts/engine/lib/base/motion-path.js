// motion-path.js — `path` on any layer: travel along a smooth curve through points at constant speed (arc length),
// with automatic facing (flip) from the direction of travel. core.js T.layerState calls T.travelAt; the bean gait reads
// T.travelSpeed to match its stride to the ground speed. Pure functions of (path, t): tables are cached per path object.
// path: {pts: [[x, y], ...] (normalised, 2+), at 0, dur, ease 'linear' | 'inOut' | 'in' | 'out', face true, gait}
(function () {
  'use strict';
  const T = window.TOON;
  const STEPS = 48; // samples per segment for the arc-length table

  // Catmull-Rom point on segment i (p1 -> p2) at s in 0..1, world px.
  function cr(P, i, s) {
    const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
    const s2 = s * s, s3 = s2 * s;
    const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * s + (2 * a - 5 * b + 4 * c - d) * s2 + (-a + 3 * b - 3 * c + d) * s3);
    return [f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])];
  }

  const tables = new WeakMap();
  function table(path) {
    let tb = tables.get(path);
    if (tb) return tb;
    const P = path.pts.map(([x, y]) => [x * T.W, y * T.H]);
    const pts = [P[0]], len = [0];
    for (let i = 0; i < P.length - 1; i++) {
      for (let k = 1; k <= STEPS; k++) {
        const q = cr(P, i, k / STEPS), last = pts[pts.length - 1];
        len.push(len[len.length - 1] + Math.hypot(q[0] - last[0], q[1] - last[1]));
        pts.push(q);
      }
    }
    tb = { pts, len, total: len[len.length - 1] || 1 };
    tables.set(path, tb);
    return tb;
  }

  // Point at arc-length fraction u (0..1) by binary search on the table.
  function at(tb, u) {
    const d = T.clamp(u) * tb.total, L = tb.len;
    let lo = 0, hi = L.length - 1;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (L[mid] <= d) lo = mid; else hi = mid; }
    const seg = L[hi] - L[lo] || 1, f = (d - L[lo]) / seg, a = tb.pts[lo], b = tb.pts[hi];
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
  }

  const progress = (path, lt) => T.easeBy(path.ease || 'linear')(T.prog(lt, path.at ?? 0, path.dur ?? 1));

  // Facing from the direction of travel at u: +1 right, -1 left; looks back along the path while it moves vertically.
  function facingAt(tb, u) {
    for (let k = 0; k < 40; k++) {
      const a = Math.max(0, u - (k + 1) * 0.004), b = Math.min(1, u + 0.002), dx = at(tb, b)[0] - at(tb, a)[0];
      if (Math.abs(dx) > 0.5) return dx > 0 ? 1 : -1;
      if (a <= 0) break;
    }
    const first = tb.pts.find((p) => Math.abs(p[0] - tb.pts[0][0]) > 0.5);
    return first && first[0] < tb.pts[0][0] ? -1 : 1;
  }

  // The layer's travel path, or null. A plain list of points is a layer type's own path field (fx, game-ui, map figures).
  T.travelPath = (L) => (L && L.path && !Array.isArray(L.path) && Array.isArray(L.path.pts) ? L.path : null);
  // {x, y, flip} at shot time lt (flip null when path.face === false).
  T.travelAt = (path, lt) => {
    if (!path || !Array.isArray(path.pts) || path.pts.length < 2) return null;
    const tb = table(path), u = progress(path, lt), [x, y] = at(tb, u);
    return { x, y, u, flip: path.face === false ? null : facingAt(tb, u) };
  };
  // Ground speed in world px / s at shot time lt (0 outside the travel window).
  T.travelSpeed = (path, lt) => {
    if (!path || !Array.isArray(path.pts)) return 0;
    const a = path.at ?? 0, d = path.dur ?? 1;
    if (lt < a || lt > a + d) return 0;
    const h = 1 / 60, p0 = T.travelAt(path, Math.max(a, lt - h)), p1 = T.travelAt(path, Math.min(a + d, lt + h));
    const dt = Math.min(a + d, lt + h) - Math.max(a, lt - h);
    return dt > 0 ? Math.hypot(p1.x - p0.x, p1.y - p0.y) / dt : 0;
  };
})();
