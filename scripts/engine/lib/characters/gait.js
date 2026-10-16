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

  // Which gait runs at layer time lt (path gait during its window, then run > walk > sneak > march windows).
  T.gaitKind = (L, lt) => {
    const p = T.travelPath(L);
    if (p && p.gait !== false && T.GAITS[p.gait || 'walk']) {
      const a = (p.at ?? 0) - (L.at ?? 0); // path times are shot time, gait windows layer time
      if (lt >= a && lt <= a + (p.dur ?? 1)) return p.gait || 'walk';
    }
    for (const k of ['run', 'walk', 'sneak', 'march']) if (inWin(L[k], lt)) return k;
    return null;
  };

  // Ground speed of the layer in rig units / s (path, else move), or 0 when it walks in place.
  function speedUnits(L, env, k) {
    const st = env && env.st;
    if (!st || !k) return 0;
    const s = Math.abs(st.s || 1) * k;
    if (T.travelPath(L)) return T.travelSpeed(L.path, env.lt) / s;
    if (!L.move) return 0;
    const a = T.layerState(L, env.lt - 1 / 30), b = T.layerState(L, env.lt + 1 / 30);
    return a && b ? Math.hypot(b.x - a.x, b.y - a.y) * 15 / s : 0;
  }

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
    let period = g.period / rate, S = g.stride;
    const v = speedUnits(L, env, k);
    if (v > 1) { // match the stride to the travel speed, speeding the cadence up past 1.5 x the natural stride
      S = v * g.stance * period;
      if (S > g.stride * 1.5) { S = g.stride * 1.5; period = S / (v * g.stance); }
    }
    const ph = (twos(lt) / period) % 1;
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
