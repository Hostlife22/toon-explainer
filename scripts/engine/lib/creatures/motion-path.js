// motion-path.js — generic path motion for any layer (creatures, vehicles, beans, props): `path` moves the layer along
// a curve at constant speed (arc-length parametrised), eased over [at, at + dur] of shot time (like `move`), facing the
// direction of motion (auto flip with a squash through a turn), rotating to the tangent (orient) and leaning into
// curves (bank). Pure functions of (layer, time): samples are cached per path object, nothing depends on render order.
//   path: {pts: [[x, y], ...] (normalised frame coords), at: 0, dur: 3, ease: 'inOut', curve: 'smooth' | 'linear' |
//          'bezier' (3n+1 points), orient: false | true | maxDeg, face: true, bank: 0 (deg at a full turn), loop: false | true | laps}
// A plain list of points is NOT a path here: fx (brawl trail), cursor (keys) and map keep their own list `path` meaning;
// an object path moves any layer, those included.
// API: T.pathSpec(L) -> normalised spec | null; T.pathTable(spec) -> samples; T.motionAt(L, t) -> {x, y, ang, tang, dir,
// dist, vel, speed, curv, bank, turn, turnOff, turnDy}; T.layerTravel(L, t) -> {dist (signed distance the rig walked / rolled forward),
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
      const last = n - 1 - ((n - 1) % 3), Q = P.slice(0, last + 1);
      if (S.loop && Math.hypot(Q[last][0] - Q[0][0], Q[last][1] - Q[0][1]) > 1e-6) { // close smoothly: mirror the end tangents
        Q.push([2 * Q[last][0] - Q[last - 1][0], 2 * Q[last][1] - Q[last - 1][1]], [2 * Q[0][0] - Q[1][0], 2 * Q[0][1] - Q[1][1]], Q[0]);
      }
      for (let i = 0; i + 3 < Q.length; i += 3) for (let k = 0; k < SEG; k++) { const t = k / SEG; out.push([0, 1].map((j) => bez(Q[i][j], Q[i + 1][j], Q[i + 2][j], Q[i + 3][j], t))); }
      out.push(Q[Q.length - 1]);
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
    if (S.loop && dir.length > 1 && dir[0] !== dir[dir.length - 1]) turns.push(0); // a loop that reverses across its seam
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
    let turn = 1, turnOff = null, turnDy = 1;
    for (const tp of tb.turns) {
      let off = dLap - tp; // a loop wraps: the nearest turn may sit across the lap seam
      if (S.loop) off -= Math.round(off / tb.total) * tb.total;
      turn = Math.min(turn, Math.abs(off) / TURN_PX);
      if (turnOff == null || Math.abs(off) < Math.abs(turnOff)) {
        const a = locate(tb, tp - 6), b = locate(tb, tp + 6);
        turnOff = off * sg; turnDy = (b.y - a.y) * sg < 0 ? -1 : 1; // +1: the turn swings toward the camera
      }
    }
    // turnOff: signed arc px from the nearest change of direction (negative before it; null without one); turnDy: +1 when the path heads
    // down the frame (toward the camera) there, -1 when it heads up
    return { x: p.x, y: p.y, ang, tang, dir: tb.dir[p.i] * sg, dist, vel, speed, curv, bank, turn: Math.max(0.12, turn), turnOff, turnDy };
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
      if (!m.to) continue;
      const tx = m.to[0] * T.W, ty = m.to[1] * T.H, len = Math.hypot(tx - x, ty - y);
      const sg = Math.abs(tx - x) < 1e-6 ? 1 : Math.sign(tx - x) * face;
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
    const move = L.move && L.move.some((m) => m && m.to) ? L.move.map(({ to, ...m }) => m) : L.move;
    const st = base({ ...L, x: p.x / T.W, y: p.y / T.H, move, __seed: L.id ? undefined : L.type + (L.x ?? 0) + (L.y ?? 0) }, lt);
    if (!st) return st;
    if (S.face) { st.flip = p.dir * (L.flip ? -1 : 1); if (!(T.pathTurnViews && T.pathTurnViews(L))) st.sx *= p.turn; } // rigs with views turn through them instead of squashing
    if (S.orient) {
      let a = !S.face ? p.tang : p.dir < 0 ? wrapA(p.ang - Math.PI) : p.ang;
      if (typeof S.orient === 'number') a = T.clamp(a, -S.orient * T.DEG, S.orient * T.DEG);
      st.r += a; st.orientR = a;
    }
    if (p.bank) st.r += p.bank * (T.PATH_LEAN[L.type] ?? 0.35) * (S.face ? p.dir : 1);
    st.path = p;
    return st;
  };
  T.wrapAngle = wrapA;
  T.TAU = T.TAU || TAU;
})();
