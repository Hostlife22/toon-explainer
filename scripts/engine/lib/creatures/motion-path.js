// motion-path.js — path motion for any layer (creatures, vehicles, beans, props): `path` moves the layer along a
// curve at constant speed (arc-length parametrised), eased over [at, at + dur] of shot time (like `move`), optionally facing the
// direction of travel (auto flip with a squash through the turn), rotating to the tangent (orient) and leaning into
// curves (bank). Pure functions of (layer, time): samples are cached per path object, nothing depends on render order.
//   path: [[x, y], ...]   (normalised frame coords; shorthand for {pts})
//   path: {pts, at: 0, dur: 3, ease: 'inOut', curve: 'smooth' | 'linear' | 'bezier', orient: false | true | maxDeg,
//          face: true, bank: 0 (deg of lean / roll at full turn), loop: false | true | laps}
// T.layerState is wrapped: the base state is computed at the path point, so enter / exit / bob / jump / jitter still
// apply on top. The state gains st.path = {x, y, ang, dir, dist, speed, curv, bank, turn}. T.layerTravel(L, lt) gives
// {dist, speed} for path and `move` layers alike (wheels, gait phase). Layer types that own a `path` field of their own
// (fx brawl trails, cursor keys, maps) are left alone.
(function () {
  'use strict';
  const T = window.TOON, TAU = Math.PI * 2;
  T.PATH_OWNERS = new Set(['fx', 'cursor', 'map']);
  T.PATH_CURVES = ['smooth', 'linear', 'bezier'];
  T.PATH_LEAN = { vehicle: 0 }; // fraction of `bank` applied as a body lean per layer type (vehicles draw their own roll)
  const SEG = 40; // samples per curve segment
  const TURN_PX = 46; // half-width of the squash through a change of direction

  const specs = new WeakMap();
  T.pathSpec = (L) => {
    const p = L && L.path;
    if (!p || typeof p !== 'object' || T.PATH_OWNERS.has(L.type)) return null;
    let s = specs.get(p);
    if (s) return s;
    const o = Array.isArray(p) ? { pts: p } : p;
    if (!Array.isArray(o.pts) || o.pts.length < 2) throw new Error('path needs 2+ [x, y] points');
    const curve = o.curve ?? 'smooth';
    if (!T.PATH_CURVES.includes(curve)) throw new Error(`Unknown path curve "${curve}" (known: ${T.PATH_CURVES.join(', ')})`);
    s = { pts: o.pts, at: o.at ?? 0, dur: Math.max(1e-3, o.dur ?? 3), ease: o.ease ?? 'inOut', curve, orient: o.orient ?? false,
      face: o.face ?? true, bank: o.bank ?? 0, loop: o.loop ?? false };
    specs.set(p, s);
    return s;
  };

  // ---------- sampling ----------
  const cr = (p0, p1, p2, p3, t) => { // uniform Catmull-Rom
    const t2 = t * t, t3 = t2 * t;
    return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
  };
  const bez = (a, b, c, d, t) => { const u = 1 - t; return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d; };
  function samplePts(S) {
    const P = S.pts.map(([x, y]) => [x * T.W, y * T.H]), n = P.length, out = [];
    if (S.curve === 'linear' || n === 2) {
      const Q = S.loop ? [...P, P[0]] : P;
      for (let i = 0; i < Q.length - 1; i++) for (let k = 0; k < SEG; k++) { const t = k / SEG; out.push([T.lerp(Q[i][0], Q[i + 1][0], t), T.lerp(Q[i][1], Q[i + 1][1], t)]); }
      out.push(Q[Q.length - 1]);
      return out;
    }
    if (S.curve === 'bezier') {
      for (let i = 0; i + 3 < n; i += 3) for (let k = 0; k < SEG; k++) { const t = k / SEG; out.push([0, 1].map((j) => bez(P[i][j], P[i + 1][j], P[i + 2][j], P[i + 3][j], t))); }
      out.push(P[n - 1 - ((n - 1) % 3)]);
      return out;
    }
    const at = (i) => (S.loop ? P[((i % n) + n) % n] : P[Math.max(0, Math.min(n - 1, i))]);
    const segs = S.loop ? n : n - 1;
    for (let i = 0; i < segs; i++) for (let k = 0; k < SEG; k++) { const t = k / SEG; out.push([0, 1].map((j) => cr(at(i - 1)[j], at(i)[j], at(i + 1)[j], at(i + 2)[j], t))); }
    out.push(S.loop ? P[0] : P[n - 1]);
    return out;
  }
  const tables = new WeakMap();
  // {pts, s (cumulative arc length), dir (+1 / -1 facing per sample), turns (arc positions of direction changes), total}
  T.pathTable = (S) => {
    let tb = tables.get(S);
    if (tb) return tb;
    const pts = samplePts(S), s = [0];
    for (let i = 1; i < pts.length; i++) s.push(s[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    // facing: sign of the horizontal motion; near-vertical stretches keep the nearest decided direction
    const raw = pts.map((p, i) => {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], d = Math.hypot(dx, b[1] - a[1]);
      return d > 1e-9 && Math.abs(dx) > 0.2 * d ? Math.sign(dx) : 0;
    });
    const dir = raw.slice();
    let last = raw.find((v) => v) || 1;
    for (let i = 0; i < dir.length; i++) { if (dir[i]) last = dir[i]; else dir[i] = last; }
    const turns = [];
    for (let i = 1; i < dir.length; i++) if (dir[i] !== dir[i - 1]) turns.push((s[i] + s[i - 1]) / 2);
    tb = { pts, s, dir, turns, total: s[s.length - 1] };
    tables.set(S, tb);
    return tb;
  };
  function locate(tb, d) { // position, sample index at arc length d
    const { s, pts } = tb;
    if (d <= 0) return { x: pts[0][0], y: pts[0][1], i: 0 };
    if (d >= tb.total) { const p = pts[pts.length - 1]; return { x: p[0], y: p[1], i: pts.length - 1 }; }
    let lo = 0, hi = s.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (s[m] <= d) lo = m; else hi = m; }
    const f = (d - s[lo]) / Math.max(1e-9, s[hi] - s[lo]);
    return { x: T.lerp(pts[lo][0], pts[hi][0], f), y: T.lerp(pts[lo][1], pts[hi][1], f), i: lo };
  }
  const angAt = (tb, d) => {
    const h = 5, a = locate(tb, Math.max(0, Math.min(tb.total - 2 * h, d - h))), b = locate(tb, Math.max(2 * h, Math.min(tb.total, d + h)));
    return Math.atan2(b.y - a.y, b.x - a.x);
  };
  const wrapA = (a) => Math.atan2(Math.sin(a), Math.cos(a));

  // Arc length travelled at layer time lt (loops add whole laps).
  function distAt(S, tb, lt) {
    const u = (lt - S.at) / S.dur;
    if (u <= 0) return 0;
    const e = T.easeBy(S.ease);
    if (!S.loop) return e(Math.min(1, u)) * tb.total;
    const laps = S.loop === true ? Infinity : S.loop;
    if (u >= laps) return laps * tb.total;
    const k = Math.floor(u);
    return (k + e(u - k)) * tb.total;
  }

  T.motionAt = (L, lt) => {
    const S = T.pathSpec(L);
    if (!S) return null;
    const tb = T.pathTable(S), h = 1 / 120;
    const dist = distAt(S, tb, lt), dLap = S.loop ? ((dist % tb.total) + tb.total) % tb.total : dist;
    const p = locate(tb, dLap);
    const speed = (distAt(S, tb, lt + h) - distAt(S, tb, Math.max(S.at, lt - h))) / (lt + h - Math.max(S.at, lt - h));
    const ang = angAt(tb, dLap);
    const curv = wrapA(angAt(tb, dLap + 14) - angAt(tb, dLap - 14)) / 28; // signed, rad per px
    const bank = S.bank ? Math.tanh((speed * speed * curv) / 900) * S.bank * T.DEG : 0;
    let turn = 1;
    for (const tp of tb.turns) turn = Math.min(turn, Math.abs(dLap - tp) / TURN_PX);
    return { x: p.x, y: p.y, ang, dir: tb.dir[p.i], dist, speed: Math.max(0, speed), curv, bank, turn: Math.max(0.12, turn) };
  };

  // ---------- travel of `move` layers (sequential steps; each starts where the previous one ends) ----------
  function moveDist(L, lt) {
    let x = (L.x ?? 0.5) * T.W, y = (L.y ?? 0.5) * T.H, d = 0;
    const face = (L.flip ? -1 : 1) * (L.dir === -1 ? -1 : 1);
    for (const m of L.move || []) {
      if (!m.to) continue;
      const tx = m.to[0] * T.W, ty = m.to[1] * T.H, len = Math.hypot(tx - x, ty - y);
      const sg = Math.abs(tx - x) < 1e-6 ? 1 : Math.sign(tx - x) * face;
      d += sg * len * T.easeBy(m.ease || 'inOut')(T.prog(lt, m.at ?? 0, m.dur ?? 0.6));
      x = tx; y = ty;
    }
    return d;
  }
  // {dist (px along the direction the layer faces), speed (px/s, >= 0), path (pathAt or null)}
  T.layerTravel = (L, lt) => {
    const p = T.motionAt(L, lt);
    if (p) return { dist: p.dist, speed: p.speed, path: p };
    if (!L.move || !L.move.length) return { dist: 0, speed: 0, path: null };
    const h = 1 / 120, a = Math.max(0, lt - h);
    return { dist: moveDist(L, lt), speed: Math.abs(moveDist(L, lt + h) - moveDist(L, a)) / (lt + h - a), path: null };
  };

  // ---------- layer state ----------
  const base = T.layerState;
  T.layerState = (L, lt) => {
    const S = T.pathSpec(L);
    if (!S) return base(L, lt);
    const p = T.motionAt(L, lt);
    const st = base({ ...L, x: p.x / T.W, y: p.y / T.H }, lt);
    if (!st) return st;
    if (S.face) { st.flip = p.dir * (L.flip ? -1 : 1); st.sx *= p.turn; }
    if (S.orient) {
      let a = S.face && p.dir < 0 ? wrapA(p.ang - Math.PI) : p.ang;
      if (typeof S.orient === 'number') a = T.clamp(a, -S.orient * T.DEG, S.orient * T.DEG);
      st.r += a;
    }
    if (p.bank) st.r += p.bank * (T.PATH_LEAN[L.type] ?? 0.35) * (S.face ? p.dir : 1);
    st.path = p;
    return st;
  };
  T.wrapAngle = wrapA;
  T.TAU = T.TAU || TAU;
})();
