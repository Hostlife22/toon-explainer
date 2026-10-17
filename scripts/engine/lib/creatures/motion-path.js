// motion-path.js — generic path motion for any layer (creatures, vehicles, beans, props): `path` moves the layer along
// a curve at constant speed (arc-length parametrised), eased over [at, at + dur] of shot time (like `move`), facing the
// direction of motion (auto flip with a squash through a turn), rotating to the tangent (orient) and leaning into
// curves (bank). Pure functions of (layer, time): samples are cached per path object, nothing depends on render order.
//   path: {pts: [[x, y], ...] (normalised frame coords), at: 0, dur: 3, ease: 'inOut', curve: 'smooth' | 'linear' |
//          'bezier' (3n+1 points), orient: false | true | maxDeg, face: true, bank: 0 (deg at a full turn), loop: false | true | laps}
// A plain list of points is NOT a path here: fx (brawl trail), cursor (keys) and map keep their own list `path` meaning;
// an object path moves any layer, those included.
// API: T.pathSpec(L) -> normalised spec | null; T.pathTable(spec) -> samples; T.motionAt(L, t) -> {x, y, ang, tang, dir,
// dist, vel, speed, curv, bank, turn}; T.layerTravel(L, t) -> {dist (signed distance the rig walked / rolled forward),
// speed, path} for path and `move` layers; T.layerState is wrapped (enter / exit / bob / jump / jitter still apply on top)
// and the state gains st.path. All times are shot time.
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
    if (!p || typeof p !== 'object' || (Array.isArray(p) && T.PATH_OWNERS.has(L.type))) return null; // fx / cursor / map lists are theirs
    let s = specs.get(p);
    if (s) return s;
    if (Array.isArray(p)) throw new Error('path must be an object {pts: [[x, y], ...], ...} (a plain list is fx / cursor / map only)');
    if (!Array.isArray(p.pts) || p.pts.length < 2) throw new Error('path needs 2+ [x, y] points');
    const curve = p.curve ?? 'smooth';
    if (!T.PATH_CURVES.includes(curve)) throw new Error(`Unknown path curve "${curve}" (known: ${T.PATH_CURVES.join(', ')})`);
    s = { pts: p.pts, at: p.at ?? 0, dur: Math.max(1e-3, p.dur ?? 3), ease: p.ease ?? 'inOut', curve, orient: p.orient ?? false,
      face: p.face ?? true, bank: p.bank ?? 0, loop: p.loop ?? false };
    specs.set(p, s);
    return s;
  };

  // ---------- sampling ----------
  // Smooth curve: centripetal Catmull-Rom tangents (knot spacing sqrt(chord), so uneven point spacing makes no cusps or
  // loops), limited per axis as in monotone cubic interpolation (Fritsch-Carlson): between two points the curve never
  // runs back past either of them along x or y, so a path whose points advance one way never reverses.
  function smoothTangents(P, loop) {
    const n = P.length, at = (i) => (loop ? P[((i % n) + n) % n] : i < 0 ? ghost(0, 1) : i >= n ? ghost(n - 1, n - 2) : P[i]);
    const ghost = (a, b) => [2 * P[a][0] - P[b][0], 2 * P[a][1] - P[b][1]]; // open ends: mirror the neighbour
    const gap = (a, b) => Math.max(1e-3, Math.sqrt(Math.hypot(b[0] - a[0], b[1] - a[1])));
    return P.map((p1, i) => {
      const p0 = at(i - 1), p2 = at(i + 1), d0 = gap(p0, p1), d1 = gap(p1, p2), open = !loop && (i === 0 || i === n - 1);
      const v = [0, 1].map((j) => {
        const s0 = (p1[j] - p0[j]) / d0, s1 = (p2[j] - p1[j]) / d1; // secant slopes per knot unit
        const c = s0 - (p2[j] - p0[j]) / (d0 + d1) + s1; // centripetal Catmull-Rom velocity
        const lim = open ? (i === 0 ? s1 : s0) : s0 * s1 > 0 ? (Math.abs(s0) < Math.abs(s1) ? s0 : s1) : 0;
        return c * lim <= 0 ? 0 : Math.sign(c) * Math.min(Math.abs(c), 3 * Math.abs(lim));
      });
      return { v, d1 };
    });
  }
  const herm = (a, b, ma, mb, t) => { // cubic Hermite with end tangents per segment
    const t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * a + (t3 - 2 * t2 + t) * ma + (-2 * t3 + 3 * t2) * b + (t3 - t2) * mb;
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
      const last = n - 1 - ((n - 1) % 3), Q = P.slice(0, last + 1);
      if (S.loop && Math.hypot(Q[last][0] - Q[0][0], Q[last][1] - Q[0][1]) > 1e-6) { // close smoothly: mirror the end tangents
        Q.push([2 * Q[last][0] - Q[last - 1][0], 2 * Q[last][1] - Q[last - 1][1]], [2 * Q[0][0] - Q[1][0], 2 * Q[0][1] - Q[1][1]], Q[0]);
      }
      for (let i = 0; i + 3 < Q.length; i += 3) for (let k = 0; k < SEG; k++) { const t = k / SEG; out.push([0, 1].map((j) => bez(Q[i][j], Q[i + 1][j], Q[i + 2][j], Q[i + 3][j], t))); }
      out.push(Q[Q.length - 1]);
      return out;
    }
    const tg = smoothTangents(P, S.loop), segs = S.loop ? n : n - 1;
    for (let i = 0; i < segs; i++) {
      const a = P[i], b = P[(i + 1) % n], len = tg[i].d1; // segment length in knot units scales the tangents
      for (let k = 0; k < SEG; k++) { const t = k / SEG; out.push([0, 1].map((j) => herm(a[j], b[j], tg[i].v[j] * len, tg[(i + 1) % n].v[j] * len, t))); }
    }
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
  const lapOf = (tb, d) => ((d % tb.total) + tb.total) % tb.total;

  // Arc length travelled at shot time lt (loops add whole laps; overshooting eases may exceed the ends).
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

  const still = (tb) => ({ x: tb.pts[0][0], y: tb.pts[0][1], ang: 0, tang: 0, dir: 1, dist: 0, vel: 0, speed: 0, curv: 0, bank: 0, turn: 1 });
  // ang: direction of motion; tang: forward tangent; dir: +1 / -1 screen facing of the motion; vel: signed px/s along the path
  T.motionAt = (L, lt) => {
    const S = T.pathSpec(L);
    if (!S) return null;
    const tb = T.pathTable(S), h = 1 / 120;
    if (!(tb.total > 1e-6)) return still(tb);
    const dist = distAt(S, tb, lt), dLap = S.loop ? lapOf(tb, dist) : dist;
    const p = locate(tb, dLap);
    let vel = 0;
    if (lt > S.at) { const a = Math.max(S.at, lt - h), b = lt + h; vel = (distAt(S, tb, b) - distAt(S, tb, a)) / (b - a); }
    let sg = vel > 1e-3 ? 1 : vel < -1e-3 ? -1 : 0;
    if (!sg) sg = dist - distAt(S, tb, Math.max(S.at, lt - 0.08)) < -1e-6 ? -1 : 1; // at rest: the way it last went
    const tang = angAt(tb, dLap), ang = sg < 0 ? wrapA(tang + Math.PI) : tang;
    const curv = wrapA(angAt(tb, dLap + 14) - angAt(tb, dLap - 14)) / 28; // signed, rad per px
    const speed = Math.abs(vel), bank = S.bank ? Math.tanh((speed * speed * curv) / 900) * S.bank * T.DEG * sg : 0;
    let turn = 1;
    for (const tp of tb.turns) turn = Math.min(turn, Math.abs(dLap - tp) / TURN_PX);
    return { x: p.x, y: p.y, ang, tang, dir: tb.dir[p.i] * sg, dist, vel, speed, curv, bank, turn: Math.max(0.12, turn) };
  };

  // Distance the rig walked / rolled forward, integrated over the eased motion (overshoots and reversals stay locked):
  //   face (default): the rig always faces its motion -> total distance covered;
  //   face: false + orient: the rig follows the tangent -> signed arc length;
  //   face: false: the rig keeps its facing -> signed by the path's horizontal direction against the rig's facing.
  function rigTravel(L, S, tb, lt) {
    if (!(tb.total > 1e-6) || lt <= S.at) return 0;
    const laps = S.loop === true ? Infinity : S.loop || 1, u = Math.min((lt - S.at) / S.dur, laps);
    const n = Math.min(4096, Math.max(2, Math.ceil(u * 64))), facing = L.flip ? -1 : 1;
    let out = 0, prev = 0;
    for (let i = 1; i <= n; i++) {
      const d = distAt(S, tb, S.at + (u * S.dur * i) / n), dd = d - prev;
      if (S.face) out += Math.abs(dd);
      else if (S.orient) out += dd;
      else out += dd * facing * tb.dir[locate(tb, S.loop ? lapOf(tb, (prev + d) / 2) : (prev + d) / 2).i];
      prev = d;
    }
    return out;
  }

  // ---------- travel of `move` layers (sequential steps; each starts where the previous one ends) ----------
  function moveDist(L, lt) {
    let x = (L.x ?? 0.5) * T.W, y = (L.y ?? 0.5) * T.H, d = 0;
    const face = (L.flip ? -1 : 1) * (L.dir === -1 ? -1 : 1);
    for (const m of L.move || []) {
      const seg = T.moveSeg(m, x, y);
      if (!seg) continue;
      const [x0, y0, tx, ty] = seg, len = Math.hypot(tx - x0, ty - y0);
      const sg = Math.abs(tx - x0) < 1e-6 ? 1 : Math.sign(tx - x0) * face;
      d += sg * len * T.easeBy(m.ease || 'inOut')(T.prog(lt, m.at ?? 0, m.dur ?? 0.6));
      x = tx; y = ty;
    }
    return d;
  }
  // {dist (signed px the rig moved forward), speed (px/s, >= 0), path (motionAt or null)}
  T.layerTravel = (L, lt) => {
    const p = T.motionAt(L, lt);
    if (p) { const S = T.pathSpec(L); return { dist: rigTravel(L, S, T.pathTable(S), lt), speed: p.speed, path: p }; }
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
    // the path owns the position: move keeps its scale / rot / alpha / flip but not `to`; an anonymous layer keeps the
    // noise seed of its authored anchor (bob, wobble, jitter) instead of one derived from the moving point
    const move = L.move && L.move.some((m) => m && (m.to || m.by || m.from)) ? L.move.map(({ to, by, from, ...m }) => m) : L.move;
    const st = base({ ...L, x: p.x / T.W, y: p.y / T.H, move, __seed: L.id ? undefined : L.type + (L.x ?? 0) + (L.y ?? 0) }, lt);
    if (!st) return st;
    if (S.face) { st.flip = p.dir * (L.flip ? -1 : 1); st.sx *= p.turn; }
    if (S.orient) {
      let a = !S.face ? p.tang : p.dir < 0 ? wrapA(p.ang - Math.PI) : p.ang;
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
