// motion.js — bean body acting (all pure functions of time): automatic anticipation before big pose changes and a
// spring overshoot + settle after them, breathing and weight shift in idle holds, squash & stretch on jumps, landings
// and impacts, IK reach toward world points / layer ids with arced hand paths, and spring secondary motion (hair,
// capes, ties, plumes, hems) computed in closed form from the layer's motion history. Acting is on by default in the
// painted look and opt-in (acting: true) for classic; acting: false or {antic, overshoot, breathe, shift, squash,
// turn: false} opts out. rig.js calls these; tests read them through T.RIG_PROBE.
(function () {
  'use strict';
  const T = window.TOON;
  const ANTIC = 4 / 30; // anticipation lead before a pose change
  const BIG = 50; // degrees of total arm travel (or any body change) that count as a big pose change

  T.actingOf = (L) => {
    if (L.acting === false || (L.acting == null && !T.PAINT)) return null;
    const o = typeof L.acting === 'object' && L.acting ? L.acting : {};
    const on = (k) => o[k] !== false;
    return { antic: on('antic'), overshoot: on('overshoot'), breathe: on('breathe'), shift: on('shift'), squash: on('squash'), turn: on('turn') };
  };

  // Under-damped step response (overshoots ~16 %, settles in ~0.3 s); poseBlend scales the speed.
  T.poseSpring = (since, blend = 0.07) => {
    if (since <= 0) return 0;
    const w = Math.PI * 2 * 4.5 * T.clamp(0.07 / Math.max(0.02, blend), 0.25, 1.5), z = 0.5, wd = w * Math.sqrt(1 - z * z);
    if (since * w > 40) return 1;
    return 1 - Math.exp(-z * w * since) * (Math.cos(wd * since) + (z * w / wd) * Math.sin(wd * since));
  };

  const angDiff = (a, b) => { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; };
  const boneAng = (x, y, px, py) => Math.atan2(x - px, y - py);
  // Blend two solved arms by bone angles; p may leave 0..1 (anticipation / overshoot).
  T.blendArm = (a, b, p, l1, l2) => {
    if (p === 1) return b;
    const a1 = boneAng(a.ex, a.ey, a.sx, a.sy), b1 = boneAng(b.ex, b.ey, b.sx, b.sy);
    const a2 = boneAng(a.hx, a.hy, a.ex, a.ey), b2 = boneAng(b.hx, b.hy, b.ex, b.ey);
    const s1 = a1 + angDiff(a1, b1) * p, s2 = a2 + angDiff(a2, b2) * p;
    const ex = b.sx + Math.sin(s1) * l1, ey = b.sy + Math.cos(s1) * l1;
    return { ...b, ex, ey, hx: ex + Math.sin(s2) * l2, hy: ey + Math.cos(s2) * l2, dir: s2, hand: p < 0.5 ? a.hand : b.hand };
  };
  // Total shoulder + elbow travel between two solved arm pairs, degrees.
  T.armTravel = (A0, A1) => A0.reduce((s, a, i) => {
    const b = A1[i];
    return s + Math.abs(angDiff(boneAng(a.ex, a.ey, a.sx, a.sy), boneAng(b.ex, b.ey, b.sx, b.sy))) / T.DEG
      + Math.abs(angDiff(boneAng(a.hx, a.hy, a.ex, a.ey), boneAng(b.hx, b.hy, b.ex, b.ey))) / T.DEG;
  }, 0);
  T.BIG_POSE = BIG;

  // Upcoming pose change within the anticipation lead: {amount 0..1, next, at} or null.
  T.anticOf = (L, lt, curName) => {
    if (!Array.isArray(L.pose)) return null;
    const next = L.pose.find((e) => (e.at ?? 0) > lt + 1e-9);
    if (!next || next.v === curName) return null;
    const d = (next.at ?? 0) - lt;
    if (d > ANTIC) return null;
    return { amount: Math.sin((Math.PI / 2) * (1 - d / ANTIC)), next: next.v, at: next.at ?? 0 };
  };

  // Idle life: breathing (b, -1..1) and a slow weight shift from foot to foot (lean degrees, hip x units).
  T.idleLife = (lt, seed, cfg) => {
    const h = T.hash(seed + ':idle'), ph = (h % 100) / 16;
    const b = cfg.breathe ? Math.sin(Math.PI * 2 * 0.28 * lt + ph) : 0;
    let lean = 0;
    if (cfg.shift) {
      const P = 3.2 + (h % 13) / 10, u = lt + (h % 37) / 10, seg = Math.floor(u / P), loc = (u - seg * P) / P;
      const sg = seg % 2 ? 1 : -1, s = T.clamp(loc / 0.22), e = s * s * (3 - 2 * s);
      lean = T.lerp(-sg, sg, e) * 2.2;
    }
    return { breath: b, lean, hipX: lean * 2.4 };
  };

  // Squash & stretch from jumps (shot time, the core jump field) and impacts (layer time): {sx, sy, lean}.
  T.bodySquash = (L, lt, shotT) => {
    let sy = 1, lean = 0, sxImp = 1;
    for (const j of L.jump || []) {
      const a = j.at ?? 0, d = j.dur ?? 0.45, t = shotT;
      if (t >= a - 0.13 && t < a) sy = Math.min(sy, 1 - 0.2 * Math.sin(((t - a + 0.13) / 0.13) * Math.PI / 2)); // crouch
      else if (t >= a && t < a + d * 0.3) sy = Math.max(sy, 1.16 - 0.16 * ((t - a) / (d * 0.3))); // launch stretch
      else if (t >= a + d * 0.72 && t < a + d) sy = Math.max(sy, 1.07); // falling stretch
      else if (t >= a + d && t < a + d + 0.35) { const s = t - a - d; sy = Math.min(sy, 1 - 0.22 * Math.exp(-9 * s) * Math.cos(Math.PI * 2 * 3.2 * s)); }
    }
    for (const im of L.impact || []) {
      const e = typeof im === 'number' ? { at: im } : im, s = lt - e.at;
      if (s < 0 || s > 0.4) continue;
      const k = T.clamp(Number(e.amount ?? 1) || 0, 0, 3) * Math.exp(-8 * s) * Math.cos(Math.PI * 2 * 3 * s);
      sxImp = Math.min(sxImp, Math.max(0.45, 1 - 0.18 * k)); // never folds through zero
      lean += -(e.dir === -1 ? -1 : 1) * 9 * T.clamp(e.amount ?? 1, 0, 3) * Math.exp(-6 * s);
    }
    const sx = sxImp * (1 / Math.sqrt(sy));
    return { sx, sy: sy / Math.sqrt(sxImp), lean };
  };

  // ---------- reach ----------
  // Active reach at layer time lt: {cur, prev, since} (entries are {x, y} | {target} | null = back to the pose).
  T.reachOf = (L, lt) => {
    const r = L.reach;
    if (!r) return null;
    if (!Array.isArray(r)) return { cur: r, prev: r, since: 1e9 };
    let i = -1;
    for (let k = 0; k < r.length; k++) if (lt >= (r[k].at ?? 0)) i = k;
    if (i < 0) return null;
    return { cur: r[i].v, prev: i > 0 ? r[i - 1].v : null, since: lt - (r[i].at ?? 0) };
  };
  // Layer-to-world base transform at the bean's entry: world point -> device point (null without a layer state).
  T.worldBase = (ctx, st) => {
    if (!st) return null;
    const m = ctx.getTransform();
    const trs = new DOMMatrix().translate(st.x, st.y).rotate(st.r / T.DEG).scale(st.s * st.flip * st.sx, st.s * st.sy);
    return m.multiply(trs.inverse());
  };
  // World point -> screen point through a shot camera (for pinned layers reaching into the world).
  let camCtx = null;
  function camPoint(cam, z, w) {
    if (!camCtx) camCtx = document.createElement('canvas').getContext('2d');
    camCtx.setTransform(1, 0, 0, 1, 0, 0); T.applyCam(camCtx, cam, z);
    const q = camCtx.getTransform().transformPoint(new DOMPoint(w[0], w[1]));
    return [q.x, q.y];
  }
  // A reach entry as a point in the current (arm) frame. dyE: the body drop already applied to that frame.
  T.reachPoint = (ctx, e, env, base, dyE) => {
    if (!e) return null;
    let w = null;
    if (typeof e.target === 'string') {
      const shot = env && env.shot, find = (list) => (list || []).find((q) => q.id === e.target);
      let L0 = shot && (find(shot.layers) || find(shot.pinned)), cam = null;
      if (!L0 && env && env.outerShot) { L0 = find(env.outerShot.layers); cam = env.outerCam; } // pinned bean -> world layer
      const st = L0 ? T.layerState(T.effLayer(L0, env.lt), env.lt) : null;
      if (!st) return null;
      w = [st.x + (e.dx ?? 0), st.y + (e.dy ?? 0)];
      if (cam) w = camPoint(cam, L0.z ?? 1, w);
    } else if ((e.space || 'world') === 'world') w = [e.x * T.W + (e.dx ?? 0), e.y * T.H + (e.dy ?? 0)];
    else return [e.x, e.y - dyE];
    if (!base) return null;
    const d = base.transformPoint(new DOMPoint(w[0], w[1])), q = ctx.getTransform().inverse().transformPoint(d);
    return [q.x, q.y];
  };
  // Point on an arc from a to b at progress p (may overshoot): the hand rises away from the straight chord.
  T.arcPoint = (a, b, p, arc = 0.25) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy);
    let nx = -dy / (d || 1), ny = dx / (d || 1);
    if (ny > 0) { nx = -nx; ny = -ny; } // bulge upward
    const bulge = arc * d * 4 * p * (1 - p);
    return [a[0] + dx * p + nx * bulge, a[1] + dy * p + ny * bulge];
  };

  // ---------- spring secondary motion ----------
  // Displacement (rig units) of a soft attachment (hair, cape, tie, plume) relative to the body, from the layer's
  // motion over the last 1.2 s: a damped spring driven by the anchor's acceleration plus air drag on the velocity.
  // Pure function of (L, shot time t); o: {size, scale, hz 1.4, zeta 0.32}.
  const DT = 1 / 30, WIN = 36;
  T.springLag = (L, t, o = {}) => {
    const k = (o.size ?? L.size ?? 420) / 600, w = Math.PI * 2 * (o.hz ?? 1.4), z = o.zeta ?? 0.32, wd = w * Math.sqrt(1 - z * z);
    const pos = [];
    for (let i = 0; i <= WIN + 1; i++) {
      const st = T.layerState(L, t - i * DT);
      pos.push(st ? [st.x / (k * Math.abs(st.s || 1)), st.y / (k * Math.abs(st.s || 1)), st.flip] : null);
    }
    const vel = (i) => (pos[i] && pos[i + 1] ? [(pos[i][0] - pos[i + 1][0]) / DT, (pos[i][1] - pos[i + 1][1]) / DT] : [0, 0]);
    let x = 0, y = 0;
    for (let i = 0; i < WIN; i++) {
      const v0 = vel(i), v1 = vel(i + 1), tau = (i + 0.5) * DT, g = Math.exp(-z * w * tau) * Math.sin(wd * tau) / wd;
      x -= g * (v0[0] - v1[0]); y -= g * (v0[1] - v1[1]);
    }
    const v = vel(0), f = pos[0] ? pos[0][2] || 1 : 1;
    x -= v[0] * 0.02; y -= v[1] * 0.01;
    const s = o.scale ?? 1;
    return { x: T.clamp(x * f * s, -80, 80), y: T.clamp(y * s, -60, 60) }; // x in the character's own facing frame
  };
})();
