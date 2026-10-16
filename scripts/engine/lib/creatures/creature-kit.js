// creature-kit.js — shared toolkit of the v2 creature rigs (quad-rig.js, beasts-*.js): gait tables with planted feet
// (T.GAIT), 2-bone IK, tapered limb tubes, seeded periodic events (blinks, ear and tail flicks), toon eyes / brows /
// mouths by expression, tails and manes with lagged secondary motion, sleep "z" marks, sweat drops, contact shadows,
// riders, and the rig dispatch: T.creatureRig(L, painted) decides between the classic drawing of an existing kind and
// its v2 rig (painted look, a new field such as gait / state / path, or rig: "v2"). Everything is a pure function of
// (layer, time, seed). Units: creature-local, ground at y = 0, facing +x.
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL, TAU = Math.PI * 2, D = T.DEG;
  const CK = (T.CK = T.CK || {});
  T.CREATURES = T.CREATURES || {};
  const fract = (x) => x - Math.floor(x);
  const smooth = (e0, e1, x) => { const t = T.clamp((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };
  CK.smooth = smooth;
  CK.fract = fract;
  CK.inWin = (wins, lt) => (wins || []).some(([a, b]) => lt >= a && lt <= b);
  CK.sh = (c, k = -0.22) => T.shade(c, k);

  // ---------- gaits ----------
  // Legs: 0 near hind, 1 far hind, 2 near fore, 3 far fore. off = phase at which each foot plants; duty = stance
  // fraction. Foot x is measured in cycle lengths (the body travels 1 per cycle), so a planted foot moves back at
  // exactly the travel speed (no sliding). cycle = stride length in leg lengths; cadence = cycles/s on the spot.
  const GAITS = {
    walk: { off: [0, 0.5, 0.25, 0.75], duty: 0.62, cycle: 1.5, cadence: 0.9, lift: 0.1, bob: 0.025, bobN: 2, pitch: 1.2, nod: 5 },
    trot: { off: [0, 0.5, 0.5, 0], duty: 0.42, cycle: 2.2, cadence: 1.35, lift: 0.13, bob: 0.05, bobN: 2, pitch: 1.5, nod: 3 },
    gallop: { off: [0, 0.12, 0.5, 0.62], duty: 0.3, cycle: 3.4, cadence: 1.9, lift: 0.12, bob: 0.09, bobN: 1, pitch: 6, nod: 9 },
  };
  T.GAIT = {
    table: GAITS,
    offset: (g, leg) => GAITS[g].off[leg],
    // {x (cycle lengths, + forward of the rest point), y (lift, cycle lengths), stance, flex 0..1 (swing fold)}
    foot(g, leg, phase) {
      const G = GAITS[g], u = fract(phase - G.off[leg]);
      if (u < G.duty) return { x: G.duty * (0.5 - u / G.duty), y: 0, stance: true, flex: 0, u };
      const s = (u - G.duty) / (1 - G.duty), e = s * s * (3 - 2 * s);
      return { x: G.duty * (-0.5 + e), y: G.lift * Math.sin(Math.PI * s) * 1.6, stance: false, flex: Math.sin(Math.PI * Math.min(1, s * 1.15)), u };
    },
  };
  const GAIT_ALIAS = { run: 'gallop', walk: 'walk', trot: 'trot', gallop: 'gallop' };

  // ---------- geometry ----------
  // Knee of a 2-bone chain from hip (hx, hy) to target (fx, fy); bend +1 / -1 picks the side the joint points to.
  CK.ik2 = (hx, hy, fx, fy, l1, l2, bend) => {
    const dx = fx - hx, dy = fy - hy, d = T.clamp(Math.hypot(dx, dy), Math.abs(l1 - l2) + 1e-3, l1 + l2 - 1e-3);
    const a = Math.acos(T.clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1)), base = Math.atan2(dy, dx) + bend * a;
    return [hx + Math.cos(base) * l1, hy + Math.sin(base) * l1];
  };
  // Catmull-Rom resample of a polyline (rounded joints); widths interpolated alongside.
  function resample(pts, ws, n = 4) {
    if (pts.length < 3) return [pts, ws];
    const P2 = [], W2 = [], at = (i) => pts[Math.max(0, Math.min(pts.length - 1, i))];
    for (let i = 0; i < pts.length - 1; i++) for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t, p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
      P2.push([0, 1].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
      W2.push(T.lerp(ws[i], ws[i + 1], t));
    }
    P2.push(pts[pts.length - 1]); W2.push(ws[ws.length - 1]);
    return [P2, W2];
  }
  // Closed outline of a tube along pts with half-widths ws (round caps). Returns a path callback.
  CK.tube = (pts0, ws0, smoothJoints = true) => {
    const [pts, ws] = smoothJoints ? resample(pts0, ws0) : [pts0, ws0], n = pts.length, Lf = [], Rt = [];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
      const nx = -dy / d, ny = dx / d, w = ws[i];
      Lf.push([pts[i][0] + nx * w, pts[i][1] + ny * w]); Rt.push([pts[i][0] - nx * w, pts[i][1] - ny * w]);
    }
    const a0 = Math.atan2(pts[1][1] - pts[0][1], pts[1][0] - pts[0][0]), a1 = Math.atan2(pts[n - 1][1] - pts[n - 2][1], pts[n - 1][0] - pts[n - 2][0]);
    return (k) => {
      k.moveTo(Lf[0][0], Lf[0][1]);
      for (let i = 1; i < n; i++) k.lineTo(Lf[i][0], Lf[i][1]);
      k.arc(pts[n - 1][0], pts[n - 1][1], ws[n - 1], a1 + Math.PI / 2, a1 - Math.PI / 2, true);
      for (let i = n - 1; i >= 0; i--) k.lineTo(Rt[i][0], Rt[i][1]);
      k.arc(pts[0][0], pts[0][1], ws[0], a0 - Math.PI / 2, a0 + Math.PI / 2, true);
      k.closePath();
    };
  };
  // Tube whose outline skips the first `skip` segments (a limb growing out of the body: no seam over the body).
  // Returns {fill, edge}: fill the whole tube, stroke only the edge (open path).
  CK.tubeParts = (pts0, ws0, skip = 1) => {
    const [pts, ws] = resample(pts0, ws0), n = pts.length, j0 = Math.min(n - 2, skip * 4), Lf = [], Rt = [];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
      Lf.push([pts[i][0] - (dy / d) * ws[i], pts[i][1] + (dx / d) * ws[i]]); Rt.push([pts[i][0] + (dy / d) * ws[i], pts[i][1] - (dx / d) * ws[i]]);
    }
    const a1 = Math.atan2(pts[n - 1][1] - pts[n - 2][1], pts[n - 1][0] - pts[n - 2][0]);
    const edge = (k) => {
      k.moveTo(Lf[j0][0], Lf[j0][1]);
      for (let i = j0 + 1; i < n; i++) k.lineTo(Lf[i][0], Lf[i][1]);
      k.arc(pts[n - 1][0], pts[n - 1][1], ws[n - 1], a1 + Math.PI / 2, a1 - Math.PI / 2, true);
      for (let i = n - 1; i >= j0; i--) k.lineTo(Rt[i][0], Rt[i][1]);
    };
    return { fill: CK.tube(pts0, ws0), edge };
  };
  // Point list of a chain from base, segment length seg, absolute angles angs[i].
  CK.chain = (x, y, seg, angs) => { const out = [[x, y]]; for (const a of angs) { x += Math.cos(a) * seg; y += Math.sin(a) * seg; out.push([x, y]); } return out; };
  CK.rot = (x, y, a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];

  // ---------- seeded events ----------
  // Progress 0..1 of the event active at lt (events every `period` s, shifted by up to `jitter` s), or -1.
  CK.event = (seed, lt, period, jitter, dur) => {
    const k0 = Math.floor(lt / period);
    for (let k = k0; k >= k0 - 1; k--) {
      const t0 = k * period + T.rng(T.hash(seed + ':' + k))() * jitter;
      if (lt >= t0 && lt < t0 + dur) return (lt - t0) / dur;
    }
    return -1;
  };
  const tri = (p) => (p < 0 ? 0 : 1 - Math.abs(p * 2 - 1));
  CK.blink = (seed, lt) => tri(CK.event(seed + 'blink', lt, 3.1, 1.6, 0.16));
  CK.flick = (seed, lt, period = 3.4) => { const p = CK.event(seed + 'flick', lt, period, 2.2, 0.3); return p < 0 ? 0 : Math.sin(p * Math.PI * 2) * (1 - p); };

  // ---------- expressions ----------
  // lid: upper-lid cover 0..1; pupil: pupil radius / eye radius; brow: inner-end tilt (+ angry, - sad / worried); arc: happy closed arc
  const EXPR = {
    neutral: { lid: 0.22, pupil: 0.56, brow: null }, happy: { arc: true, brow: -0.1 }, content: { arc: true, brow: null },
    angry: { lid: 0.42, pupil: 0.5, brow: 0.55 }, mad: { lid: 0.42, pupil: 0.5, brow: 0.55 }, rage: { lid: 0.2, pupil: 0.32, brow: 0.7 },
    evil: { lid: 0.5, pupil: 0.42, brow: 0.6, red: true }, sad: { lid: 0.38, pupil: 0.6, brow: -0.55, tear: true },
    cry: { lid: 0.4, pupil: 0.6, brow: -0.6, tear: true }, worried: { lid: 0.12, pupil: 0.5, brow: -0.45 },
    scared: { lid: 0, pupil: 0.3, brow: -0.5, wide: true }, shock: { lid: 0, pupil: 0.26, brow: -0.2, wide: true },
    scream: { lid: 0, pupil: 0.26, brow: -0.5, wide: true }, sleepy: { lid: 0.62, pupil: 0.56, brow: null },
    sleep: { closed: true }, smug: { lid: 0.48, pupil: 0.5, brow: 0.15 }, dead: { cross: true },
  };
  CK.EXPR = EXPR;
  CK.expr = (name) => EXPR[name] || EXPR.neutral;
  // Toon eye at (x, y) radius r: sclera, pupil looking toward look [-1..1, -1..1], specular, upper lid, brow.
  CK.eye = (ctx, x, y, r, o = {}) => {
    const e = o.e || EXPR.neutral, blink = Math.max(o.blink ?? 0, e.closed ? 1 : 0), lw = Math.max(2.5, r * 0.26);
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (e.cross) {
      ctx.strokeStyle = P.ink; ctx.lineWidth = lw;
      ctx.beginPath(); ctx.moveTo(x - r * 0.7, y - r * 0.7); ctx.lineTo(x + r * 0.7, y + r * 0.7); ctx.moveTo(x + r * 0.7, y - r * 0.7); ctx.lineTo(x - r * 0.7, y + r * 0.7); ctx.stroke();
      ctx.restore(); return;
    }
    if (blink > 0.55 || e.arc) { // closed: a curved lash line (happy closes upward)
      ctx.strokeStyle = P.ink; ctx.lineWidth = lw;
      ctx.beginPath();
      if (e.arc && blink <= 0.55) ctx.arc(x, y + r * 0.35, r * 0.85, Math.PI + 0.35, -0.35);
      else ctx.arc(x, y - r * 0.25, r * 0.9, 0.3, Math.PI - 0.3);
      ctx.stroke();
      drawBrow(ctx, x, y, r, e, o);
      ctx.restore(); return;
    }
    const ry = r * (e.wide ? 1.15 : 1), rx = r * (o.narrow ?? 0.82);
    T.outlined(ctx, (k) => k.ellipse(x, y, rx, ry, 0, 0, TAU), o.white ?? '#fbf8f0', { line: lw, paint: false });
    ctx.save(); ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.clip();
    const [lx, ly] = o.look || [0.35, 0], pr = r * (e.pupil ?? 0.55);
    const px = x + lx * (rx - pr) * 0.8, py = y + ly * (ry - pr) * 0.8;
    ctx.fillStyle = e.red ? '#c81e1e' : o.iris ?? '#2a1a12';
    ctx.beginPath(); ctx.ellipse(px, py, pr, pr * 1.08, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(px + pr * 0.32, py - pr * 0.38, Math.max(1.2, pr * 0.3), 0, TAU); ctx.fill();
    const lid = T.clamp((e.lid ?? 0.2) + blink * (1 - (e.lid ?? 0.2)) * 1.8 + (o.lid ?? 0));
    if (lid > 0.01) { // the upper lid in the body colour, slanted by the brow
      const tilt = (e.brow ?? 0) * 0.5 * (o.side ?? 1), ly0 = y - ry + lid * ry * 2;
      ctx.fillStyle = o.lidColor ?? '#c9b8a0';
      ctx.beginPath(); ctx.moveTo(x - rx * 1.2, y - ry * 1.3); ctx.lineTo(x + rx * 1.2, y - ry * 1.3);
      ctx.lineTo(x + rx * 1.2, ly0 + tilt * ry); ctx.lineTo(x - rx * 1.2, ly0 - tilt * ry); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = P.ink; ctx.lineWidth = lw * 0.9; ctx.beginPath(); ctx.moveTo(x - rx * 1.2, ly0 - tilt * ry); ctx.lineTo(x + rx * 1.2, ly0 + tilt * ry); ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle = P.ink; ctx.lineWidth = lw; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.stroke();
    drawBrow(ctx, x, y, r, e, o);
    if (e.tear) { ctx.fillStyle = 'rgba(120,190,240,0.95)'; ctx.beginPath(); ctx.ellipse(x - r * 0.2, y + r * 1.5, r * 0.22, r * 0.36, 0, 0, TAU); ctx.fill(); }
    ctx.restore();
  };
  function drawBrow(ctx, x, y, r, e, o) {
    if (e.brow == null || o.brow === false) return;
    const t = e.brow * (o.side ?? 1), by = y - r * (e.wide ? 1.75 : 1.5);
    ctx.strokeStyle = P.ink; ctx.lineWidth = Math.max(3, r * 0.34); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - r, by - t * r * 0.6); ctx.quadraticCurveTo(x, by - r * 0.25, x + r, by + t * r * 0.6); ctx.stroke();
  }

  // ---------- marks ----------
  CK.zzz = (ctx, x, y, lt, size = 30) => { // three rising "z" letters drawn as ink strokes, 1.8 s loop
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let i = 0; i < 3; i++) {
      const p = fract(lt / 1.8 + i / 3), s = size * (0.6 + p * 0.6), zx = x + p * size * 1.6 + Math.sin(p * 5 + i) * 6, zy = y - p * size * 3.2;
      ctx.globalAlpha = Math.sin(p * Math.PI);
      ctx.strokeStyle = P.ink; ctx.lineWidth = s * 0.22;
      ctx.beginPath(); ctx.moveTo(zx - s / 2, zy - s / 2); ctx.lineTo(zx + s / 2, zy - s / 2); ctx.lineTo(zx - s / 2, zy + s / 2); ctx.lineTo(zx + s / 2, zy + s / 2); ctx.stroke();
    }
    ctx.restore();
  };
  CK.sweat = (ctx, x, y, lt, r = 10) => { // two drops popping off the brow on a 0.7 s loop
    for (let i = 0; i < 2; i++) {
      const p = fract(lt / 0.7 + i * 0.5), dx = (i ? 1 : -0.4) * p * r * 3, dy = -Math.sin(p * Math.PI) * r * 2 + p * r * 2;
      ctx.save(); ctx.globalAlpha = 1 - p * 0.7;
      T.outlined(ctx, (k) => { k.moveTo(x + dx, y + dy - r * 1.4); k.quadraticCurveTo(x + dx + r, y + dy, x + dx, y + dy + r * 0.6); k.quadraticCurveTo(x + dx - r, y + dy, x + dx, y + dy - r * 1.4); k.closePath(); }, '#bfe4f6', { line: Math.max(2, r * 0.3), paint: false });
      ctx.restore();
    }
  };
  // Contact shadow on the ground (local y = 0) honouring layer.contact; painted look only.
  CK.shadow = (ctx, L, cx, halfW, lift = 0) => {
    if (!T.PAINT || L.contact === false || !T.contactShadow) return;
    const o = typeof L.contact === 'object' && L.contact ? L.contact : { w: typeof L.contact === 'number' ? L.contact : 1 };
    const k = 1 / (1 + Math.max(0, lift) / (halfW * 1.2));
    T.contactShadow(ctx, cx, 0, halfW * (o.w ?? 1) * k, halfW * (o.h ?? 0.13) * k, (o.alpha ?? 0.55) * k);
  };

  // ---------- secondary motion ----------
  // A hanging / streaming chain (tail, mane lock): segment angles relax from base toward `stream` (0..1 = speed),
  // with a travelling wave lagging along the chain. Returns the points.
  CK.tailPts = (x, y, n, seg, o) => {
    const angs = [];
    let a = o.base;
    for (let i = 0; i < n; i++) {
      const f = (i + 1) / n, wave = Math.sin(o.t * TAU * (o.hz ?? 0.8) - i * (o.lag ?? 0.7) + (o.ph ?? 0)) * (o.amp ?? 0.12) * (0.4 + f);
      a += (o.curl ?? 0) / n + wave + (o.flick ?? 0) * Math.sin(f * Math.PI) * 0.9 / n * 3;
      const target = T.lerp(a, o.streamAng ?? Math.PI, T.clamp(o.stream ?? 0) * f);
      angs.push(target);
    }
    return CK.chain(x, y, seg, angs);
  };

  // ---------- locomotion state ----------
  // Resolves what the animal is doing at lt: {mode: idle|walk|trot|gallop|eat|sleep|scared|sit|..., gait, amp 0..1
  // (leg swing), phase (gait phase), blend {g2, w} (cross-fade between gaits), pose amount 0..1 (eased into the state),
  // speed (local units/s), travel (layer travel)}. cfg.legLen (local units), k (local -> px scale), opts.states.
  CK.motion = (L, lt, env, cfg) => {
    const slt = env && env.lt != null ? env.lt : lt; // shot time (paths and moves are keyed on it)
    const tr = env && env.st && (env.st.path || L.path || L.move) ? T.layerTravel(L, slt) : { dist: 0, speed: 0 };
    const px = Math.max(1e-6, cfg.k * Math.abs(env && env.st ? env.st.s : 1)), dist = tr.dist / px, speed = tr.speed / px;
    const moving = !!(L.path || (L.move && L.move.length));
    const st = L.state != null ? T.timed(L.state, lt, 0.3) : null, gt = L.gait != null ? T.timed(L.gait, lt, 0.3) : null;
    let mode, prev = null, w = 1;
    if (st) { mode = st.cur; prev = st.prev; w = st.p; }
    else if (gt) { mode = gt.cur; prev = gt.prev; w = gt.p; }
    else if (L.pose === 'sit') mode = 'sit';
    else if (CK.inWin(L.run, lt)) mode = 'gallop';
    else if (CK.inWin(L.walk, lt)) mode = 'walk';
    else if (moving) mode = 'auto';
    else mode = 'idle';
    const auto = (v) => { // speed in leg lengths per second -> gait with a cross-fade band
      const r = v / cfg.legLen;
      if (r < 0.12) return ['idle', 'walk', smooth(0.04, 0.12, r)];
      if (r < 2.4) return ['walk', 'trot', smooth(2.0, 2.4, r)];
      if (r < 5.2) return ['trot', 'gallop', smooth(4.6, 5.2, r)];
      return ['gallop', 'gallop', 0];
    };
    const norm = (m) => (m === 'auto' || m == null ? null : GAIT_ALIAS[m] || m);
    let cur = norm(mode), pv = norm(prev), bw = 1 - w;
    if (mode === 'auto' || (gt && gt.cur === 'auto')) { const [a, b, f] = auto(speed); cur = a; pv = b; bw = f; }
    if (pv === cur) bw = 0;
    const gait = GAITS[cur] ? cur : null, g2 = GAITS[pv] ? pv : null;
    const ampOf = (m) => (GAITS[m] ? 1 : 0);
    const amp = T.lerp(ampOf(cur), ampOf(pv), bw);
    const cyc = (g) => cfg.legLen * GAITS[g].cycle * (cfg.cycleK ?? 1);
    const phaseOf = (g) => (moving ? dist / cyc(g) : lt * GAITS[g].cadence * (L.gaitRate ?? 1));
    return {
      mode: cur, prev: pv, bw, gait: gait || g2 || 'walk', g2, amp, speed, dist, travel: tr, moving,
      phase: phaseOf(gait || g2 || 'walk'), phase2: g2 ? phaseOf(g2) : 0, cyc: cyc(gait || g2 || 'walk'), cyc2: g2 ? cyc(g2) : 0,
      pose: (name) => (cur === name ? 1 - bw : 0) + (pv === name ? bw : 0),
    };
  };

  // ---------- rider ----------
  // Seated cast member (legs hidden) with a near leg + boot hanging along the flank, as on the classic horse.
  CK.rider = (ctx, L, lt, env, x, y, scale, o = {}) => {
    if (!L.rider || !T.layers.bean) return;
    ctx.save(); ctx.translate(x, y); ctx.rotate(o.lean ?? 0);
    T.layers.bean(ctx, { type: 'bean', who: L.rider, id: (L.id ?? 'rider') + 'r', size: 400 * scale * (L.riderScale ?? 1), legs: false,
      pose: L.riderPose ?? 'idle', expr: L.riderExpr ?? 'neutral', hold: L.riderHold, holdL: L.riderHoldL, rock: 0.6, view: L.riderView ?? '3q' }, lt, { ...env, st: null });
    ctx.restore();
  };
  CK.riderLeg = (ctx, L, x, y, scale, swing = 0) => {
    if (!L.rider) return;
    const s = scale * (L.riderScale ?? 1), col = L.riderLeg ?? '#4a3a32', boot = L.riderBoot ?? '#2a1d17';
    const knee = [x + 26 * s, y + 70 * s], foot = [x + 6 * s + swing * 6 * s, y + 132 * s];
    T.outlined(ctx, CK.tube([[x, y], knee, foot], [20 * s, 17 * s, 14 * s]), col, { line: 6 * s + 2 });
    T.outlined(ctx, (k) => { k.moveTo(foot[0] - 16 * s, foot[1] - 22 * s); k.lineTo(foot[0] + 14 * s, foot[1] - 22 * s); k.quadraticCurveTo(foot[0] + 40 * s, foot[1] - 4 * s, foot[0] + 38 * s, foot[1] + 8 * s); k.lineTo(foot[0] - 18 * s, foot[1] + 8 * s); k.closePath(); }, boot, { line: 6 * s + 2 });
  };

  // ---------- dispatch ----------
  CK.V2 = new Set(); // kinds that have a v2 rig
  CK.LEGACY = {}; // classic drawing of existing kinds
  CK.SIT = new Set(); // v2 kinds that can sit
  const NEW_FIELDS = ['gait', 'state', 'path', 'flock', 'school'];
  T.creatureRig = (L, painted) => {
    if (!CK.V2.has(L.kind)) return 'legacy';
    if (!CK.LEGACY[L.kind]) return 'v2';
    if (L.rig === 'classic' || L.pose === 'biped' || L.tower) return 'legacy';
    if (L.pose === 'sit' && !CK.SIT.has(L.kind)) return 'legacy';
    if (L.rig === 'v2' || painted || NEW_FIELDS.some((f) => L[f] != null)) return 'v2';
    return 'legacy';
  };
  // Register a v2 drawing; an existing kind keeps its classic drawing for classic specs.
  CK.register = (kind, fn, o = {}) => {
    const legacy = T.CREATURES[kind];
    if (legacy && !CK.LEGACY[kind]) CK.LEGACY[kind] = legacy;
    CK.V2.add(kind);
    if (o.sit) CK.SIT.add(kind);
    T.CREATURES[kind] = (ctx, L, lt, env) => (T.creatureRig(L, !!T.PAINT) === 'v2' ? fn(ctx, L, lt, env || {}) : CK.LEGACY[kind](ctx, L, lt, env));
  };
  // The engine's own contact shadow skips creatures and vehicles: their rigs draw shadows under the actual feet / wheels.
  // Classic-drawn creatures and vehicles stand on their origin, so an explicit contact sits at dy 0 (not mid-size).
  const baseContact = T.layerContact;
  if (baseContact) T.layerContact = (ctx, L, st) => {
    if (L.type === 'creature' && T.creatureRig(L, true) === 'v2') return;
    if (L.type === 'vehicle' && T.vehicleRig && T.vehicleRig(L, true) === 'v2') return;
    if ((L.type === 'creature' || L.type === 'vehicle') && L.contact) {
      const o = typeof L.contact === 'object' ? L.contact : { w: L.contact === true ? 1 : L.contact };
      baseContact(ctx, { ...L, contact: { ...o, dy: o.dy ?? 0 } }, st); return;
    }
    baseContact(ctx, L, st);
  };
  CK.D = D;
})();
