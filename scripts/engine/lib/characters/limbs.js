// limbs.js — hand shapes (T.HANDS registry) and painted limbs. Hands are drawn in the hand frame: origin at the wrist,
// +y along the forearm toward the fingertips, palm ellipse at (0, 6). The four original shapes (open, fist, point,
// thumb) keep their exact classic drawing in rig.js; the rest live here. Painted look: arms and legs become tapered
// tubes (shoulder -> elbow -> wrist, hip -> knee -> ankle) shaded through T.outlined (bands, rim, ink weight) with a
// cuff band and an elbow / knee crease. Vocabulary: scripts/vocab/characters-v2.json (kinds.hand).
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL;

  const finger = (ctx, skin, fx, fy, len, ang, w = 16) => {
    ctx.save(); ctx.translate(fx, fy); ctx.rotate(ang);
    T.outlined(ctx, (k) => T.rrect(k, -w / 2, 0, w, len, w / 2), skin, { line: 6 });
    ctx.restore();
  };
  // A two-joint finger bent toward the palm (grab / claw).
  const curled = (ctx, skin, fx, fy, ang, l1 = 30, l2 = 18, bend = 1.25) => {
    ctx.save(); ctx.translate(fx, fy); ctx.rotate(ang);
    T.outlined(ctx, (k) => T.rrect(k, -8, 0, 16, l1 + 6, 8), skin, { line: 6 });
    ctx.translate(0, l1); ctx.rotate(bend);
    T.outlined(ctx, (k) => T.rrect(k, -7.5, -2, 15, l2, 7.5), skin, { line: 6 });
    ctx.restore();
  };
  const palm = (ctx, skin) => T.outlined(ctx, (k) => k.ellipse(0, 6, 27, 25, 0, 0, Math.PI * 2), skin, { line: 7 });
  const knuckles = (ctx, xs) => {
    ctx.strokeStyle = P.ink; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath();
    xs.forEach((x) => { ctx.moveTo(x, 24); ctx.lineTo(x, 14); });
    ctx.stroke();
  };
  const thumbIn = (ctx, skin) => finger(ctx, skin, -18, 2, 22, 0.55); // thumb folded across the palm
  const thumbOut = (ctx, skin, spread = 1.1) => finger(ctx, skin, -22, 0, 22, spread);

  // Counting hands: n fingers up from the index side, the rest folded (knuckle marks), thumb out on five.
  const COUNT_X = [-16, -5, 6, 17], COUNT_A = [-0.3, -0.1, 0.1, 0.3], COUNT_L = [54, 58, 54, 44];
  const counting = (n) => (ctx, skin) => {
    for (let i = 0; i < Math.min(4, n); i++) finger(ctx, skin, COUNT_X[i], 16, COUNT_L[i], COUNT_A[i]);
    if (n >= 5) thumbOut(ctx, skin, 1.0); else thumbIn(ctx, skin);
    palm(ctx, skin);
    if (n < 4) knuckles(ctx, COUNT_X.slice(n).map((x) => x + 1));
  };

  // kind -> fn(ctx, skin, o); o.legacy(kind) draws one of the original four shapes.
  T.HANDS = {
    open: (ctx, skin, o) => o.legacy('open'),
    fist: (ctx, skin, o) => o.legacy('fist'),
    point: (ctx, skin, o) => o.legacy('point'),
    thumb: (ctx, skin, o) => o.legacy('thumb'),
    'thumbs-up': (ctx, skin, o) => o.legacy('thumb'),
    grab: (ctx, skin) => { // half-closed claw ready to take something
      [-15, -5, 5, 15].forEach((x, i) => curled(ctx, skin, x, 16, (i - 1.5) * 0.12));
      finger(ctx, skin, -22, 2, 24, 0.75);
      palm(ctx, skin);
    },
    wave: (ctx, skin) => { // open palm, fingers fanned wide
      [-0.75, -0.25, 0.25, 0.75].forEach((a, i) => finger(ctx, skin, -15 + i * 10, 16, 44, a * 0.7));
      thumbOut(ctx, skin, 1.45);
      palm(ctx, skin);
    },
    pinch: (ctx, skin) => { // thumb and index meet at the tip (a coin, a key, a cup handle), the rest folded
      finger(ctx, skin, 8, 16, 30, 0.42); finger(ctx, skin, -20, 4, 28, -0.5);
      palm(ctx, skin); knuckles(ctx, [-2, 10]);
    },
    peace: (ctx, skin) => {
      finger(ctx, skin, -9, 16, 58, -0.34); finger(ctx, skin, 6, 16, 58, 0.3);
      thumbIn(ctx, skin); palm(ctx, skin); knuckles(ctx, [10, 18]);
    },
    one: counting(1), two: counting(2), three: counting(3), four: counting(4), five: counting(5),
  };

  const LEGACY = new Set(['open', 'fist', 'point', 'thumb', 'thumbs-up']);
  // Draw a hand of any kind at (x, y) with forearm direction dir; legacy(kind) is rig.js's original drawing.
  T.drawHand = (ctx, x, y, dir, kind, skin, hs, legacy) => {
    const fn = T.HANDS[kind];
    if (!fn || LEGACY.has(kind)) return legacy(kind === 'thumbs-up' ? 'thumb' : fn ? kind : 'open');
    ctx.save(); ctx.translate(x, y); ctx.rotate(-dir);
    if (hs !== 1) ctx.scale(hs, hs);
    fn(ctx, skin, { legacy });
    ctx.restore();
  };

  // ---------- painted tubes ----------
  // Closed outline of a tube along a polyline of centre points with per-point half widths and round caps.
  T.tubePath = (pts, half) => (k) => {
    const n = pts.length, L = [], R = [];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d;
      L.push([pts[i][0] + nx * half[i], pts[i][1] + ny * half[i]]); R.push([pts[i][0] - nx * half[i], pts[i][1] - ny * half[i]]);
    }
    const ang = (p, q) => Math.atan2(q[1] - p[1], q[0] - p[0]);
    k.moveTo(L[0][0], L[0][1]);
    for (let i = 1; i < n; i++) k.lineTo(L[i][0], L[i][1]);
    const e = pts[n - 1], ae = ang(e, L[n - 1]);
    k.arc(e[0], e[1], half[n - 1], ae, ae - Math.PI, true);
    for (let i = n - 1; i >= 0; i--) k.lineTo(R[i][0], R[i][1]);
    const s = pts[0], as = ang(s, R[0]);
    k.arc(s[0], s[1], half[0], as, as - Math.PI, true);
    k.closePath();
  };
  // Centre line of a bent limb: quadratic from the root through the joint to the mid forearm, then straight.
  function limbLine(a, j, b) {
    const m = [(j[0] + b[0]) / 2, (j[1] + b[1]) / 2], out = [];
    for (let i = 0; i <= 8; i++) {
      const t = i / 8, u = 1 - t;
      out.push([u * u * a[0] + 2 * u * t * j[0] + t * t * m[0], u * u * a[1] + 2 * u * t * j[1] + t * t * m[1]]);
    }
    for (let i = 1; i <= 3; i++) out.push([m[0] + (b[0] - m[0]) * i / 3, m[1] + (b[1] - m[1]) * i / 3]);
    return out;
  }
  const bendOf = (a, j, b) => {
    const v1 = [j[0] - a[0], j[1] - a[1]], v2 = [b[0] - j[0], b[1] - j[1]];
    return Math.abs(Math.atan2(v1[0] * v2[1] - v1[1] * v2[0], v1[0] * v2[0] + v1[1] * v2[1]));
  };
  // Painted limb: tapered shaded tube, a darker cuff near the end (cuff: 0..1 position or null), crease at the joint.
  T.paintLimb = (ctx, a, j, b, w, col, o = {}) => {
    const pts = limbLine(a, j, b), n = pts.length;
    const half = pts.map((_, i) => (w / 2) * T.lerp(1, o.taper ?? 0.8, i / (n - 1)));
    T.outlined(ctx, T.tubePath(pts, half), col, { line: o.line ?? T.LINE });
    if (o.cuff != null) {
      const i = Math.round(o.cuff * (n - 1)), p = pts[i], q = pts[Math.max(0, i - 1)], d = Math.hypot(p[0] - q[0], p[1] - q[1]) || 1;
      const nx = -(p[1] - q[1]) / d, ny = (p[0] - q[0]) / d, hw = half[i] * 0.98;
      ctx.save(); ctx.lineCap = 'butt'; ctx.strokeStyle = T.shade(col, -0.22); ctx.lineWidth = Math.max(4, w * 0.16);
      ctx.beginPath(); ctx.moveTo(p[0] + nx * hw, p[1] + ny * hw); ctx.lineTo(p[0] - nx * hw, p[1] - ny * hw); ctx.stroke(); ctx.restore();
    }
    const bend = bendOf(a, j, b);
    if (bend > 0.45 && T.inkStroke) { // crease on the inner side of the joint
      const v1 = [j[0] - a[0], j[1] - a[1]], v2 = [b[0] - j[0], b[1] - j[1]], cross = v1[0] * v2[1] - v1[1] * v2[0];
      const d = Math.hypot(v1[0], v1[1]) || 1, nx = (-v1[1] / d) * Math.sign(cross || 1), ny = (v1[0] / d) * Math.sign(cross || 1);
      const c = [j[0] + nx * w * 0.32, j[1] + ny * w * 0.32], t = [v1[0] / d, v1[1] / d];
      T.inkStroke(ctx, [[c[0] - t[0] * w * 0.35, c[1] - t[1] * w * 0.35], [c[0], c[1]], [c[0] + v2[0] / (Math.hypot(v2[0], v2[1]) || 1) * w * 0.3, c[1] + v2[1] / (Math.hypot(v2[0], v2[1]) || 1) * w * 0.3]],
        { w: Math.min(7, w * 0.14), ink: T.mix(P.ink, col, 0.35) });
    }
  };
})();
