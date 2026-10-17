// gait.js — walk / run / sneak / march cycles for beans with contact, down, passing and up poses: planted feet that
// slide back under the body during stance, a lifted swing leg (2-bone leg, knee forward), body bob lowest just after
// contact and highest at passing, counter-swinging arms, a lagging head nod. Animated on twos. Used for `sneak` /
// `march` windows and, with acting on (painted look or acting: true), for `walk` / `run` windows and `path.gait`.
// Stride follows the ground speed (path or move) so feet do not skate. Registry: T.GAITS (vocab kinds.gait).
(function () {
  'use strict';
  const T = window.TOON;
  const A = (a, e, hand = 'open') => ({ a, e, hand });
  // period s, stance fraction, stride S and lift (rig units), body bob, lean (deg), crouch dy, toe angles, arm swing fn
  T.GAITS = {
    walk: { period: 0.62, stance: 0.6, stride: 64, lift: 24, bob: 9, lean: 3, dy: 0, toeOff: -18,
      arms: (c) => [A(12 + 24 * c, 16), A(12 + 24 * c, 16)] },
    run: { period: 0.4, stance: 0.38, stride: 96, lift: 42, bob: 18, lean: 12, dy: 8, toeOff: -28,
      arms: (c) => [A(24 + 42 * c, 92, 'fist'), A(24 + 42 * c, 92, 'fist')] },
    sneak: { period: 1.05, stance: 0.66, stride: 58, lift: 46, bob: 7, lean: 14, dy: 42, toeOff: -34, tiptoe: true,
      arms: (c) => [A(70 + 8 * c, 110, 'grab'), A(84 - 8 * c, 104, 'grab')] },
    march: { period: 0.64, stance: 0.52, stride: 70, lift: 62, bob: 6, lean: -2, dy: 0, toeOff: -10, stiff: true,
      arms: (c) => [A(8 + 46 * c, 4, 'fist'), A(8 + 46 * c, 4, 'fist')] },
  };
  const twos = (lt) => Math.floor(lt * 15) / 15;
  const inWin = (wins, lt) => (wins || []).some(([a, b]) => lt >= a && lt <= b);

  // The layer's travel path spec (creatures/motion-path.js), or null: a plain list of points is a layer type's own
  // `path` (fx, cursor, map figures), never travel.
  T.travelPath = (L) => (L && L.path && typeof L.path === 'object' && !Array.isArray(L.path) && T.pathSpec ? T.pathSpec(L) : null);
  // Travel window of a path in layer time: [start, end] (a looping path travels until its laps end).
  const travelSpan = (L, S) => {
    const a = S.at - (L.at ?? 0), laps = S.loop === true ? Infinity : S.loop || 1;
    return [a, a + S.dur * laps];
  };

  // Which gait runs at layer time lt (path gait during its window, then run > walk > sneak > march windows).
  T.gaitKind = (L, lt) => {
    const S = T.travelPath(L), g = L.path && L.path.gait;
    if (S && g !== false && T.GAITS[g || 'walk']) {
      const [a, b] = travelSpan(L, S); // path times are shot time, gait windows layer time
      if (lt >= a && lt <= b) return g || 'walk';
    }
    for (const k of ['run', 'walk', 'sneak', 'march']) if (inWin(L[k], lt)) return k;
    return null;
  };

  // Ground speed of the layer in rig units / s at shot time t (path, else move); 0 when it walks in place or has no state.
  function speedAt(L, t, k, hasState) {
    if (!hasState || !k) return 0;
    const st = T.layerState(L, t);
    if (!st) return 0;
    const s = Math.abs(st.s || 1) * k;
    if (T.travelPath(L)) { const m = T.motionAt(L, t); return m ? m.speed / s : 0; }
    if (!L.move) return 0;
    const a = T.layerState(L, t - 1 / 60), b = T.layerState(L, t + 1 / 60);
    return a && b ? Math.hypot(b.x - a.x, b.y - a.y) * 30 / s : 0;
  }
  // Start (layer time) of the gait span running at lt.
  function spanStart(L, lt) {
    const S = T.travelPath(L);
    if (S && !(L.path.gait === false)) { const [a, b] = travelSpan(L, S); if (lt >= a && lt <= b) return a; }
    for (const k of ['run', 'walk', 'sneak', 'march']) for (const [a, b] of L[k] || []) if (lt >= a && lt <= b) return a;
    return 0;
  }
  const cadence = (g, rate, v) => Math.max(rate / g.period, (v * g.stance) / (g.stride * 1.5)); // cycles per second
  // Accumulated gait cycles at layer time lt: the cadence (natural, or faster when the stride would pass 1.5 x its
  // natural length) integrated from the start of the span, so speed changes never re-phase the legs. Pure fn of time.
  T.gaitPhase = (L, lt, env, k) => {
    const kind = T.gaitKind(L, lt);
    if (!kind) return 0;
    const g = T.GAITS[kind], rate = L.gaitRate ?? 1, a = spanStart(L, lt), at = L.at ?? 0, has = !!(env && env.st);
    if (!has || !(T.travelPath(L) || L.move)) return ((lt - a) * rate) / g.period; // walking in place: constant cadence
    const h = 1 / 30, n =Math.max(0, Math.floor((lt - a) / h + 1e-9));
    let ph = 0, prev = cadence(g, rate, speedAt(L, a + at, k, has));
    for (let i = 1; i <= n; i++) { const c = cadence(g, rate, speedAt(L, a + i * h + at, k, has)); ph += (prev + c) * h / 2; prev = c; }
    const rest = lt - a - n * h;
    if (rest > 0) ph += cadence(g, rate, speedAt(L, lt + at, k, has)) * rest;
    return ph;
  };

  // Two-bone leg: hip -> foot with the knee pushed forward (+x); returns the knee point.
  function knee(h, f, l1, l2, fwd) {
    const dx = f[0] - h[0], dy = f[1] - h[1], d = T.clamp(Math.hypot(dx, dy), 1, l1 + l2 - 0.5);
    const base = Math.atan2(dx, dy), c = Math.acos(T.clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
    const a = base + c * fwd;
    return [h[0] + Math.sin(a) * l1, h[1] + Math.cos(a) * l1];
  }

  // Cycle state: {kind, phase, bob, lean, dy, legs (LEG_MODES-style joints, body units), arms (arm specs), nod}.
  T.gaitCycle = (L, lt, env, B, k) => {
    const kind = T.gaitKind(L, lt);
    if (!kind) return null;
    const g = T.GAITS[kind], rate = L.gaitRate ?? 1;
    const v = speedAt(L, lt + (L.at ?? 0), k, !!(env && env.st));
    const S = v > 1 ? Math.min(v * g.stance * g.period / rate, g.stride * 1.5) : g.stride; // stride matched to the speed
    const ph = T.gaitPhase(L, twos(lt), env, k) % 1;
    const lh = 88 * B.legH, l1 = lh * 0.5, l2 = lh * 0.5, hipY = -78 * B.legH;
    const dy = g.dy * B.legH + g.bob * B.legH * Math.cos(Math.PI * 4 * (ph - 0.08));
    const legs = [0, 1].map((i) => {
      const q = (ph + i * 0.5) % 1, hx = (i ? 26 : -26) * B.legW;
      let fx, fy, toe;
      if (q < g.stance) { // planted: slides back under the body; heel strike -> flat -> push off
        const r = q / g.stance;
        fx = hx + S * (0.5 - r); fy = 0; toe = r < 0.15 ? 14 * (1 - r / 0.15) : r > 0.75 ? g.toeOff * (r - 0.75) / 0.25 : 0;
        if (g.tiptoe) toe = Math.min(toe, -20);
      } else { // swing: lifted through the passing pose
        const r = (q - g.stance) / (1 - g.stance), e = T.ease.inOut(r);
        fx = hx + S * (e - 0.5); fy = -g.lift * B.legH * Math.sin(Math.PI * r); toe = g.stiff ? 20 * Math.sin(Math.PI * r) : -12 * Math.sin(Math.PI * r);
      }
      const hip = [hx, hipY + dy], ft = [fx, fy];
      const kn = g.stiff && q < g.stance ? [(hip[0] + ft[0]) / 2, (hip[1] + ft[1]) / 2] : knee(hip, ft, l1, l2, 1);
      return { hip, knee: kn, ft, toe, back: i === 0 };
    });
    const c = Math.cos(Math.PI * 2 * ph);
    return { kind, phase: ph, bob: 0, dy, lean: g.lean, legs, arms: g.arms(c), nod: Math.sin(Math.PI * 4 * (ph - 0.16)) * 1.4, run: kind === 'run' };
  };
})();
