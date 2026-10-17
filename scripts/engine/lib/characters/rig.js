// rig.js — bean character body: bell robe with lean & folds, 2-bone arms (angles or IK targets) with glove hands,
// hold-and-snap posing with settle, idle rock around the feet, tremble, walk/run cycles on twos, lagging cape, costume
// (armor, pleats, trim, sash, belt, cape, shield in the off hand). Head comes from face.js. Layer type: 'bean'.
// Pose registry (T.POSES, body poses with dy/rot/lean/legs), leg modes, antic/snapTilt, builds and ages
// (T.BUILDS), hooks T.BEAN_UNDER (before legs) and T.BEAN_EXTRAS (after the body). The layer itself is assembled in bean.js.
// Units: 600 tall, feet at (0,0). `size` = on-screen height in px.
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL, H = () => T.BEAN_HEAD;
  const SH = { x: 92, y: -292 }, L1 = 84, L2 = 80, ARM_W = 46, LEG_W = 50;

  T.shade = (hex, k = -0.22) => {
    const n = parseInt(T.hex6(hex).slice(1), 16);
    const f = (c) => Math.round(T.clamp(k < 0 ? c * (1 + k) : c + (255 - c) * k, 0, 255));
    return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => f(c).toString(16).padStart(2, '0')).join('');
  };

  // Constant or timeline [{at, v}] → {cur, prev, p, at}
  T.timed = (val, lt, blend = 0.18) => {
    if (!Array.isArray(val)) return { cur: val, prev: val, p: 1, at: -1e9 };
    if (!val.length) return { cur: undefined, prev: undefined, p: 1, at: -1e9 }; // empty timeline: no value
    let i = -1;
    for (let k = 0; k < val.length; k++) if (lt >= (val[k].at ?? 0)) i = k;
    if (i < 0) return { cur: val[0].v, prev: val[0].v, p: 1, at: -1e9 };
    const prev = i > 0 ? val[i - 1].v : val[i].v;
    return { cur: val[i].v, prev, p: T.ease.outCubic(T.prog(lt, val[i].at ?? 0, blend)), at: val[i].at ?? 0 };
  };
  const inWin = (wins, lt) => (wins || []).some(([a, b]) => lt >= a && lt <= b);
  const twos = (lt) => Math.floor(lt * 15) / 15; // animate "on twos" at 30 fps

  // Arm specs per pose, written for the RIGHT arm in "outward" degrees (0 = hanging, + = away from body/up).
  // {a, e, hand} = shoulder angle + elbow bend, or {to:[x,y], hand} = IK target (right-arm coordinates, mirrored for left).
  // A pose entry is either [left, right] (arms only) or {arms: [left, right], body: {dy, rot, lean, legs, front, pivot, view}}.
  const A = (a, e, hand = 'open') => ({ a, e, hand });
  const TO = (x, y, hand = 'open') => ({ to: [x, y], hand });
  const BP = (arms, body) => ({ arms, body });
  const KNEEL = { legs: 'kneel', dy: 40 };
  const POSES = {
    idle: [A(12, 8), A(12, 8)], point: [A(12, 8), A(96, 0, 'point')], 'point-up': [A(12, 8), A(160, 4, 'point')],
    'arms-up': [A(155, 12), A(155, 12)], shrug: [A(58, 92), A(58, 92)], facepalm: [A(12, 8), TO(28, -440)],
    think: [A(12, 8), TO(40, -338, 'fist')], wave: [A(12, 8), A(150, 28)], hold: [TO(70, -222, 'fist'), TO(70, -222, 'fist')],
    fist: [A(12, 8), A(162, -12, 'fist')], hips: [TO(122, -186, 'fist'), TO(122, -186, 'fist')],
    cross: [TO(-46, -244, 'fist'), TO(-30, -262, 'fist')], present: [A(12, 8), A(72, 18)],
    scared: [A(128, 44), A(128, 44)], 'hands-face': [TO(72, -398), TO(72, -398)], 'thumbs-up': [A(12, 8), A(58, 82, 'thumb')],
    'clutch-head': [TO(150, -540), TO(150, -540)], 'sword-up': [A(12, 8), A(165, 0, 'fist')], reach: [A(12, 8), A(85, -10)],
    // ---- hand and arm poses ----
    pray: BP([TO(8, -300), TO(8, -300)], { front: true }),
    steeple: BP([TO(10, -360), TO(10, -360)], { front: true }),
    cheeks: BP([TO(122, -400), TO(122, -400)], { front: true }),
    'cover-ears': BP([TO(150, -462), TO(150, -462)], { front: true }),
    'shade-eyes': BP([A(12, 8), TO(30, -500)], { front: true }),
    binoculars: BP([TO(45, -460, 'fist'), TO(45, -460, 'fist')], { front: true }),
    shove: BP([A(12, 8), A(92, 0)], { lean: 15 }),
    't-pose': [A(90, 0), A(90, 0)],
    spread: [A(110, 8), A(110, 8)],
    flex: [A(95, 85, 'fist'), A(95, 85, 'fist')],
    'flex-one': [A(12, 8), A(95, 85, 'fist')],
    'hands-up': BP([A(128, 40), A(128, 40)], { armScale: 1.3 }),
    beg: BP([TO(10, -338, 'fist'), TO(10, -338, 'fist')], { front: true }),
    offer: [TO(150, -330), TO(150, -330)],
    'hold-high': BP([A(152, 6, 'fist'), A(152, 6, 'fist')], { armScale: 1.9 }),
    hammer: BP([TO(12, -560, 'fist'), TO(12, -560, 'fist')], { front: true }),
    'throw-windup': BP([A(40, 20), A(150, 100, 'fist')], { lean: -10 }),
    throw: BP([A(30, 10), A(100, -20)], { lean: 12 }),
    eat: BP([A(12, 8), TO(40, -398, 'fist')], { front: true }),
    'phone-ear': BP([A(60, 40), TO(110, -470, 'fist')], { front: true }),
    'pinch-nose': BP([A(12, 8), TO(20, -440, 'point')], { front: true }),
    'clutch-chest': BP([A(12, 8), TO(-20, -250, 'fist')], { front: true }),
    'cover-mouth': BP([A(12, 8), TO(10, -372, 'fist')], { front: true }),
    hug: [TO(-130, -310), TO(160, -300)],
    'arm-around': [A(14, 8), TO(230, -330)],
    handshake: [A(12, 8), TO(150, -232)],
    grab: [TO(140, -262, 'fist'), TO(140, -262, 'fist')],
    'lean-table': BP([TO(150, -170), TO(150, -170)], { lean: 14 }),
    cradle: BP([TO(-60, -300), TO(-40, -250)], { front: true }),
    // ---- body poses (legs, drop, rotation) ----
    kneel: BP([TO(110, -170), TO(110, -170)], { ...KNEEL, lean: 10 }),
    'kneel-pray': BP([A(140, 16), A(140, 16)], { ...KNEEL, armScale: 1.35 }),
    'kneel-beg': BP([TO(10, -338, 'fist'), TO(10, -338, 'fist')], { ...KNEEL, front: true }),
    'kneel-offer': BP([TO(150, -330), TO(150, -330)], { ...KNEEL, lean: 12 }),
    sit: BP([TO(150, -120), TO(150, -120)], { legs: 'sit', dy: 15 }),
    'sit-floor': BP([TO(150, -205, 'fist'), TO(150, -205, 'fist')], { legs: 'tuck', dy: 55, front: true }),
    'sit-slump': BP([A(30, 10), A(30, 10)], { legs: 'splay', dy: 55, lean: -12 }),
    lie: BP([A(170, 0), A(170, 0)], { rot: -88 }),
    prostrate: BP([A(-150, 0), A(150, 0)], { legs: 'kneel', rot: 72, dy: 30, armScale: 1.6 }),
    crawl: BP([A(-44, 0), A(56, 0)], { legs: 'kneel', rot: 48, dy: 20 }),
    fly: BP([A(165, 0), A(172, 0)], { rot: 75, pivot: 'center', armScale: 1.7 }),
    // panicked flailing, upright: both arms thrown high and bent at odd angles; alternate flail / flail-b every 2-5 f
    flail: BP([A(125, 15), A(78, 72)], { lean: -5, armScale: 1.35 }),
    'flail-b': BP([A(82, 62), A(150, -15)], { lean: 5, armScale: 1.35 }),
    // upended: flipped head over heels with flailing arms (a slip on a banana peel); alternate upended / upended-b
    upended: BP([A(150, 30), A(110, 60)], { rot: 160, pivot: 'center', armScale: 1.4 }),
    'upended-b': BP([A(110, 60), A(150, 30)], { rot: 160, pivot: 'center', armScale: 1.4 }),
    hang: BP([A(158, 4, 'fist'), A(158, 4, 'fist')], { legs: 'dangle', armScale: 2 }),
    carry: BP([A(150, 14), A(150, 14)], { legs: 'squat', dy: 30, armScale: 1.9 }),
  };
  POSES['rub-hands'] = POSES.beg;
  POSES.drink = POSES.eat;
  const FRONT = { facepalm: 1, think: 1, cross: 1, 'hands-face': 1, 'clutch-head': 1 };
  T.POSES = POSES;
  T.POSE_FRONT = FRONT;
  // live list, so modules that add to T.POSES later are picked up
  Object.defineProperty(T, 'BEAN_POSES', { get: () => Object.keys(T.POSES), configurable: true, enumerable: true });
  T.BEAN_UNDER = T.BEAN_UNDER || []; // fn(ctx, c, view, lt, Ly, build) in torso units, before the legs
  T.BEAN_EXTRAS = T.BEAN_EXTRAS || []; // same signature, after the body (T.drawOutfitExtras stays inside body())

  const BODY0 = { dy: 0, rot: 0, lean: 0, legs: 'stand', front: false, pivot: 'ground', view: null, armScale: 1 };
  const poseOf = (name) => {
    const e = T.POSES[name] || T.POSES.idle;
    const arr = Array.isArray(e);
    const body = arr ? BODY0 : { ...BODY0, ...(e.body || {}) };
    return { arms: arr ? e : e.arms, body, front: !!(T.POSE_FRONT[name] || body.front) };
  };

  // ---------- builds and ages ----------
  // Ratios: head, bodyH, legH, armL (age wins). Widths: bodyW, legW, armW, hand (build wins).
  const B0 = { head: 1, bodyW: 1, bodyH: 1, legH: 1, legW: 1, armW: 1, armL: 1, hand: 1, lean: 0, headFwd: 0 };
  T.BUILDS = {
    adult: { ...B0 },
    child: { ...B0, bodyW: 0.85, bodyH: 0.62, legH: 0.7, legW: 0.85, armW: 0.85, armL: 0.75, hand: 0.85, eyeScale: 1.1, noBeard: true },
    toddler: { ...B0, bodyW: 0.9, bodyH: 0.5, legH: 0.5, legW: 0.9, armW: 0.8, armL: 0.65, hand: 0.8, eyeScale: 1.15, noBeard: true },
    baby: { ...B0, bodyW: 0.8, bodyH: 0.42, legH: 0, legW: 0.8, armW: 0.7, armL: 0.6, hand: 0.7, eyeScale: 1.2, noBeard: true, legs: 'none' },
    elder: { ...B0, bodyH: 0.97, lean: 6, headFwd: 0.06, hairColor: '#c8c8c8' },
    brute: { ...B0, head: 0.75, bodyW: 1.7, bodyH: 1.15, legH: 0.8, legW: 1.4, armW: 1.8, armL: 1.25, hand: 1.6 },
    fat: { ...B0, bodyW: 1.45, bodyH: 0.95, legH: 0.9, legW: 1.25, armW: 1.1, hand: 1.05 },
    thin: { ...B0, bodyW: 0.8, bodyH: 1.2, legH: 1.3, legW: 0.8, armW: 0.8, armL: 1.5, hand: 0.85 },
    muscle: { ...B0, head: 0.9, bodyW: 1.4, bodyH: 1.05, legW: 1.2, armW: 1.5, armL: 1.05, hand: 1.3 },
  };
  const RATIO_KEYS = ['head', 'bodyH', 'legH', 'armL', 'lean', 'headFwd', 'eyeScale', 'noBeard', 'legs', 'hairColor'];
  const WIDTH_KEYS = ['bodyW', 'legW', 'armW', 'hand'];
  // Resolved proportions for a look; `def` = plain adult (the original proportions, drawn unchanged).
  T.beanBuild = (c) => {
    const b = T.BUILDS[c.build], a = T.BUILDS[c.age];
    if (!b && !a) return { ...B0, def: true, offY: 0, neckY: -300 };
    const out = { ...B0, ...(b || {}) };
    if (a) {
      RATIO_KEYS.forEach((k) => { if (a[k] !== undefined) out[k] = a[k]; });
      if (!b) WIDTH_KEYS.forEach((k) => { out[k] = a[k]; });
    }
    out.def = WIDTH_KEYS.concat(['head', 'bodyH', 'legH', 'armL', 'lean', 'headFwd']).every((k) => out[k] === B0[k]) && !out.legs;
    out.offY = 59 * out.bodyH - 59 * out.legH; // keeps the robe hem resting on the (shorter or longer) legs
    out.neckY = -300 * out.bodyH + out.offY;
    return out;
  };
  // Rig geometry for arms: shoulder, bone lengths and a map from adult rig points to this build.
  const geomOf = (B) => {
    if (B.def) return { sx: SH.x, sy: SH.y, l1: L1, l2: L2, map: null };
    const map = (x, y) => (y < -300 ? [x * B.head + B.headFwd * 300, B.neckY + (y + 300) * B.head] : [x * B.bodyW, y * B.bodyH + B.offY]);
    const [sx, sy] = map(SH.x, SH.y);
    return { sx, sy, l1: L1 * B.armL, l2: L2 * B.armL, map };
  };

  const IK_BAND = 0.15; // |dy| / distance below which the elbow changes bend side (about +-9 deg around shoulder level)
  function ik(sx, sy, tx, ty, outward, l1 = L1, l2 = L2) {
    const dx = tx - sx, dy = ty - sy, d = T.clamp(Math.hypot(dx, dy), 10, l1 + l2 - 1);
    const base = Math.atan2(dx, dy); // 0 = down, + toward +x
    const k = Math.acos(T.clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
    // Keep the elbow on the outer side (away from the body): base + k bends outward for targets below the shoulder,
    // base - k for targets above it (otherwise raised hands fold the elbow across the chest). The bend side follows
    // the target's height through a narrow band around shoulder level, so the elbow swings through a straighter
    // arm instead of jumping between the two solutions.
    const side = T.clamp(dy / (d * IK_BAND), -1, 1), sm = side * side * (3 - 2 * Math.abs(side)) * Math.sign(side);
    const a1 = base + k * outward * sm;
    const ex = sx + Math.sin(a1) * l1, ey = sy + Math.cos(a1) * l1;
    const a2 = Math.atan2(tx - ex, ty - ey);
    return { ex, ey, hx: ex + Math.sin(a2) * l2, hy: ey + Math.cos(a2) * l2, dir: a2 };
  }

  // Resolve one arm (side = -1 left, +1 right) of a pose into joint positions.
  const G0 = { sx: SH.x, sy: SH.y, l1: L1, l2: L2, map: null };
  function solveArm(spec, side, g = G0) {
    const sx = g.sx * side, sy = g.sy;
    if (spec.to) {
      const [tx, ty] = g.map ? g.map(spec.to[0], spec.to[1]) : spec.to;
      return { sx, sy, ...ik(sx, sy, tx * side, ty, side, g.l1, g.l2), hand: spec.hand };
    }
    const a1 = spec.a * T.DEG * side, a2 = a1 + spec.e * T.DEG * side;
    const ex = sx + Math.sin(a1) * g.l1, ey = sy + Math.cos(a1) * g.l1;
    return { sx, sy, ex, ey, hx: ex + Math.sin(a2) * g.l2, hy: ey + Math.cos(a2) * g.l2, dir: a2, hand: spec.hand };
  }
  // Blend two solved arms by angle, so bones keep their length mid-blend (linear point lerp would shrink the arm).
  const lerpArm = (a, b, p, g = G0) => {
    if (p >= 1) return b;
    const ang = (j, x, y, px, py) => Math.atan2(x - px, y - py);
    const a1 = T.lerp(ang(a, a.ex, a.ey, a.sx, a.sy), ang(b, b.ex, b.ey, b.sx, b.sy), p);
    const ex = b.sx + Math.sin(a1) * g.l1, ey = b.sy + Math.cos(a1) * g.l1;
    const a2 = T.lerp(ang(a, a.hx, a.hy, a.ex, a.ey), ang(b, b.hx, b.hy, b.ex, b.ey), p);
    return { ...b, ex, ey, hx: ex + Math.sin(a2) * g.l2, hy: ey + Math.cos(a2) * g.l2, dir: a2, hand: p < 0.5 ? a.hand : b.hand };
  };
  // Swing a solved arm around its shoulder by `deg` (+ = outward for that side); used by the anticipation pose.
  const swingArm = (j, deg, side) => {
    const r = deg * T.DEG * side, rot = (x, y) => {
      const dx = x - j.sx, dy = y - j.sy, a = Math.atan2(dx, dy) + r, d = Math.hypot(dx, dy);
      return [j.sx + Math.sin(a) * d, j.sy + Math.cos(a) * d];
    };
    const [ex, ey] = rot(j.ex, j.ey), [hx, hy] = rot(j.hx, j.hy);
    return { ...j, ex, ey, hx, hy, dir: j.dir + r };
  };

  // ---------- drawing parts ----------
  // Hand shapes beyond the original four come from limbs.js (T.HANDS); the original four keep this drawing.
  function hand(ctx, x, y, dir, kind, skin, hs = 1) {
    if (T.drawHand && kind !== 'open' && kind !== 'fist' && kind !== 'point' && kind !== 'thumb' && T.HANDS[kind]) {
      return T.drawHand(ctx, x, y, dir, kind, skin, hs, (k) => legacyHand(ctx, x, y, dir, k, skin, hs));
    }
    return legacyHand(ctx, x, y, dir, kind, skin, hs);
  }
  function legacyHand(ctx, x, y, dir, kind, skin, hs = 1) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(-dir); // local +y = along forearm
    if (hs !== 1) ctx.scale(hs, hs);
    const finger = (fx, fy, len, ang) => { ctx.save(); ctx.translate(fx, fy); ctx.rotate(ang); T.outlined(ctx, (k) => T.rrect(k, -8, 0, 16, len, 8), skin, { line: 6 }); ctx.restore(); };
    if (kind === 'open') { [-0.5, -0.17, 0.17, 0.5].forEach((a, i) => finger(-15 + i * 10, 14, 30, a * 0.6)); finger(-22, 0, 22, 1.1); }
    if (kind === 'point') finger(4, 16, 44, 0);
    if (kind === 'thumb') finger(-6, -6, 30, Math.PI * 0.95);
    T.outlined(ctx, (k) => k.ellipse(0, 6, 27, 25, 0, 0, Math.PI * 2), skin, { line: 7 });
    if (kind !== 'open') { ctx.strokeStyle = P.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-12, 22); ctx.lineTo(-12, 12); ctx.moveTo(2, 25); ctx.lineTo(2, 14); ctx.stroke(); }
    ctx.restore();
  }

  // part: 'all' (default), 'sleeve' (the arm only) or 'grip' (the held prop and the hand), so a caller can draw the grip
  // later than the sleeve (bean.js draws a near hand's prop over the head).
  function arm(ctx, j, sleeve, skin, hold, lt = 0, w = ARM_W, hs = 1, holdSize = null, holdRot = 0, holdOpts = null, part = 'all') {
    if (part !== 'grip') sleeveOf(ctx, j, sleeve, w);
    if (part === 'sleeve') return null;
    return gripOf(ctx, j, skin, hold, lt, hs, holdSize, holdRot, holdOpts);
  }
  function sleeveOf(ctx, j, sleeve, w) {
    if (T.PAINT && T.paintLimb) T.paintLimb(ctx, [j.sx, j.sy], [j.ex, j.ey], [j.hx, j.hy], w, sleeve, { cuff: 0.84 }); // painted: shaded tube
    else {
      const path = () => { ctx.beginPath(); ctx.moveTo(j.sx, j.sy); ctx.quadraticCurveTo(j.ex, j.ey, (j.ex + j.hx) / 2, (j.ey + j.hy) / 2); ctx.lineTo(j.hx, j.hy); };
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = P.ink; ctx.lineWidth = w + T.LINE * 2; path(); ctx.stroke();
      ctx.strokeStyle = sleeve; ctx.lineWidth = w; path(); ctx.stroke();
      ctx.strokeStyle = T.shade(sleeve, -0.18); ctx.lineWidth = w * 0.35; ctx.beginPath(); ctx.moveTo(j.sx - 8, j.sy + 10); ctx.quadraticCurveTo(j.ex - 8, j.ey, j.ex - 6, j.ey + 6); ctx.stroke();
    }
  }
  // The held prop (its grip point in the palm, see grip.js) and the hand over it. Returns the grip point of the drawn
  // prop and the palm centre in canvas pixels (probe), or null without a prop.
  function gripOf(ctx, j, skin, hold, lt, hs, holdSize, holdRot, holdOpts) {
    let out = null;
    if (hold && T.drawProp) {
      const side = j.sx < 0 ? -1 : 1, size = T.heldSize(hold, holdSize);
      const g = T.gripOf(hold, holdSize, side, j.dir, (j.gripTilt || 0) + holdRot * T.DEG * side, !!j.gripAlt); // holdRot: tilt in the grip
      const [px, py] = g.entry ? T.palmOf(j, hs) : [j.hx, j.hy];
      const pin = ctx.getTransform().transformPoint(new DOMPoint(px, py));
      ctx.save(); ctx.translate(px, py); ctx.rotate(g.rot);
      if (g.flip) ctx.scale(-1, 1);
      // holdProps: grip [x, y] (size fractions) overrides the table; a prop that tips itself (a pouring bottle) turns
      // around the grip point, so the hand stays on it
      const at = holdOpts && holdOpts.grip ? [holdOpts.grip[0] * size, holdOpts.grip[1] * size] : holdOpts && !g.entry ? [0, 0.32 * size] : g.at;
      const tl = holdOpts && T.PROP_TILT?.[hold] ? T.PROP_TILT[hold](holdOpts, lt) : 0;
      const gx = at[0] * Math.cos(tl) - at[1] * Math.sin(tl), gy = at[0] * Math.sin(tl) + at[1] * Math.cos(tl);
      ctx.translate(-gx, -gy);
      const gp = ctx.getTransform().transformPoint(new DOMPoint(gx, gy));
      T.drawProp(ctx, hold, size, lt, holdOpts || {}); ctx.restore();
      out = { hold, grip: [gp.x, gp.y], palm: [pin.x, pin.y] };
    }
    hand(ctx, j.hx, j.hy, j.dir, j.hand, skin, hs);
    return out;
  }

  // Shoe or sandal in the standing-foot frame: leg comes down the -y axis, sole at y 0, toes toward +x.
  function foot(ctx, c, col) {
    if (c.shoes) T.outlined(ctx, (k) => { k.moveTo(-28, -2); k.lineTo(-28, -30); k.lineTo(14, -30); k.quadraticCurveTo(40, -24, 40, -2); k.closePath(); }, col ?? c.shoes, { line: 6 });
    else {
      const s = col ?? c.sandal ?? '#6b4423';
      ctx.strokeStyle = s; ctx.lineWidth = 9;
      ctx.beginPath(); ctx.moveTo(-22, -18); ctx.lineTo(22, -30); ctx.moveTo(-22, -42); ctx.lineTo(22, -54); ctx.stroke();
      T.outlined(ctx, (k) => T.rrect(k, -32, -13, 66, 15, 7), s, { line: 6 });
    }
  }

  function legs(ctx, c, gait) {
    for (const [i, x] of [[0, -46], [1, 46]]) {
      const off = gait ? gait.legs[i] : { dx: 0, dy: 0 };
      ctx.save(); ctx.translate(x + off.dx, off.dy);
      const legCol = c.legColor ?? c.skin;
      T.outlined(ctx, (k) => T.rrect(k, -25, -88, 50, 88, 20), legCol, { shade: (k) => {
        k.fillStyle = c.legColor ? T.shade(legCol, -0.2) : c.skinShade ?? (c.skin !== P.skin ? T.shade(c.skin, -0.22) : '#c4c1cd'); k.fillRect(-25, -88, 16, 88);
        if (c.puttees) { k.strokeStyle = typeof c.puttees === 'string' ? c.puttees : T.shade(legCol, -0.3); k.lineWidth = 6; for (let y = -70; y < -10; y += 14) { k.beginPath(); k.moveTo(-26, y + 8); k.lineTo(26, y - 4); k.stroke(); } }
      } });
      foot(ctx, c);
      ctx.restore();
    }
  }

  // ---------- leg modes ----------
  // Each leg: hip in body units, thigh and shin vectors. `world` modes keep their thigh/shin directions relative to the
  // ground when the whole bean rotates (kneel stays kneeling in a kowtow); the others turn with the body.
  const LEG_MODES = {
    kneel: { world: true, legs: [{ hip: [-10, -60], th: [-5, 35], sh: [-175, -12], back: true }, { hip: [15, -60], th: [-5, 35], sh: [-150, -8] }] },
    sit: { world: true, over: true, legs: [{ hip: [-10, -80], th: [150, -4], sh: [0, 84], back: true }, { hip: [20, -70], th: [150, 0], sh: [0, 70] }] },
    tuck: { world: true, over: true, legs: [{ hip: [10, -35], th: [85, -120], sh: [25, 155], back: true }, { hip: [35, -30], th: [85, -115], sh: [30, 145] }] },
    splay: { world: true, legs: [{ hip: [0, -45], th: [100, 2], sh: [100, 0], back: true }, { hip: [20, -30], th: [95, 0], sh: [100, 0] }] },
    kick: { legs: [{ hip: [-46, -88], th: [0, 44], sh: [0, 44], back: true }, { hip: [30, -70], th: [90, -25], sh: [90, -25] }] },
    squat: { world: true, legs: [{ hip: [-40, -80], th: [-70, 30], sh: [15, 50], back: true }, { hip: [40, -80], th: [70, 30], sh: [-15, 50] }] },
    dangle: { legs: [{ hip: [-40, -80], th: [-8, 50], sh: [-12, 55], toe: 55, back: true }, { hip: [40, -80], th: [8, 50], sh: [12, 55], toe: 55 }] },
    none: { legs: [] },
  };
  T.LEG_MODES = LEG_MODES;
  // Resolve a mode into joint points (body units) for a build and a body rotation (radians).
  function legGeom(mode, B, rot) {
    const m = LEG_MODES[mode];
    if (!m) return null;
    const cs = Math.cos(-rot), sn = Math.sin(-rot);
    const vec = ([x, y]) => { const sx = x * B.legW, sy = y * B.legH; return m.world ? [sx * cs - sy * sn, sx * sn + sy * cs] : [sx, sy]; };
    return m.legs.map((l) => {
      const hip = [l.hip[0] * B.legW, l.hip[1] * B.legH], t = vec(l.th), s = vec(l.sh);
      const knee = [hip[0] + t[0], hip[1] + t[1]], ft = [knee[0] + s[0], knee[1] + s[1]];
      return { hip, knee, ft, toe: l.toe ?? 0, back: !!l.back };
    });
  }
  function limbLeg(ctx, c, L, w, legCol, shadeCol) {
    const dx = L.ft[0] - L.knee[0], dy = L.ft[1] - L.knee[1], d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
    const end = [L.ft[0] - ux * 25, L.ft[1] - uy * 25];
    const pts = [L.hip, L.knee, end];
    const path = () => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); ctx.lineTo(pts[1][0], pts[1][1]); ctx.lineTo(pts[2][0], pts[2][1]); };
    const col = L.back ? shadeCol : legCol;
    if (T.PAINT && T.paintLimb) T.paintLimb(ctx, pts[0], pts[1], pts[2], w, L.back ? T.shade(legCol, -0.12) : legCol, { taper: 0.86 }); // painted: shaded tube
    else {
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = P.ink; ctx.lineWidth = w + T.LINE * 2; path(); ctx.stroke();
      ctx.strokeStyle = col; ctx.lineWidth = w; path(); ctx.stroke();
    }
    if (!L.back && !T.PAINT) { // one flat shadow strip along the back edge of each bone
      ctx.strokeStyle = shadeCol; ctx.lineWidth = w * 0.3; ctx.lineCap = 'butt';
      for (let i = 0; i < 2; i++) {
        const [a, b] = [pts[i], pts[i + 1]], sx = b[0] - a[0], sy = b[1] - a[1], sl = Math.hypot(sx, sy) || 1;
        const nx = sy / sl * w * 0.33, ny = -sx / sl * w * 0.33;
        ctx.beginPath(); ctx.moveTo(a[0] + nx, a[1] + ny); ctx.lineTo(b[0] + nx, b[1] + ny); ctx.stroke();
      }
      ctx.lineCap = 'round';
    }
    ctx.save(); ctx.translate(L.ft[0], L.ft[1]); ctx.rotate(Math.atan2(-ux, uy) + L.toe * T.DEG);
    if (w !== LEG_W) ctx.scale(w / LEG_W, w / LEG_W);
    foot(ctx, c, L.back ? T.shade(c.shoes ?? c.sandal ?? '#6b4423', -0.2) : undefined);
    ctx.restore();
  }
  function drawLegMode(ctx, c, geom, B) {
    const legCol = c.legColor ?? c.skin, shadeCol = c.legColor ? T.shade(legCol, -0.2) : c.skinShade ?? '#c4c1cd';
    geom.forEach((L) => limbLeg(ctx, c, L, LEG_W * B.legW, legCol, shadeCol));
  }

  function cape(ctx, c, lt, seed, wind) {
    if (!c.cape) return;
    const fl = Math.sin(lt * Math.PI * 2 * 3) * 10 * (0.3 + Math.abs(wind)), w = -wind * 150 + T.noise(lt * 0.9, seed + 'cape') * 16;
    T.outlined(ctx, (k) => {
      k.moveTo(-112, -310); k.lineTo(112, -310);
      k.quadraticCurveTo(170 + w * 0.5, -170 + fl, 190 + w, -40 - Math.abs(w) * 0.5 + fl);
      k.quadraticCurveTo(w * 0.8, -12 - Math.abs(w) * 0.6, -190 + w, -34 - Math.abs(w) * 0.5 - fl);
      k.quadraticCurveTo(-170 + w * 0.5, -170, -112, -310);
    }, c.cape, { shade: (k) => { k.fillStyle = T.shade(c.cape, -0.25); k.fillRect(-260 + w, -330, 200, 340); } });
  }

  // hem: secondary-motion offset of the robe hem in units (0 = the classic outline), seed: costume detail seed
  function body(ctx, c, view, hem = 0, seed = '') {
    const robe = c.robe ?? P.red, back = view === 'front' ? 1 : -1;
    const path = hem ? (k) => { k.moveTo(-100, -326); k.quadraticCurveTo(0, -342, 100, -326); k.quadraticCurveTo(130 + hem * 0.3, -210, 148 + hem, -70); k.quadraticCurveTo(hem, -48, -148 + hem, -70); k.quadraticCurveTo(-130 + hem * 0.3, -210, -100, -326); k.closePath(); }
      : (k) => { k.moveTo(-100, -326); k.quadraticCurveTo(0, -342, 100, -326); k.quadraticCurveTo(130, -210, 148, -70); k.quadraticCurveTo(0, -48, -148, -70); k.quadraticCurveTo(-130, -210, -100, -326); k.closePath(); };
    T.outlined(ctx, path, robe, {
      shade: (k) => {
        k.fillStyle = c.robeShade ?? T.shade(robe, -0.24);
        if (!T.PAINT) { k.beginPath(); k.ellipse(back * 160, -190, 95, 210, 0, 0, Math.PI * 2); k.fill(); } // painted: light-relative bands instead
        k.fillRect(-160, -112, 320, 50);
        if (c.pleats) { k.strokeStyle = T.shade(robe, -0.32); k.lineWidth = 5; for (let x = -120; x <= 120; x += 30) { k.beginPath(); k.moveTo(x * 0.92, -150); k.lineTo(x, -60); k.stroke(); } }
        if (c.folds !== false) { k.strokeStyle = T.shade(robe, -0.3); k.lineWidth = 5; k.beginPath(); k.moveTo(-40, -250); k.quadraticCurveTo(-55, -170, -70, -90); k.moveTo(50, -230); k.quadraticCurveTo(62, -160, 80, -95); k.stroke(); }
        if (c.trim) { k.fillStyle = c.trim; k.fillRect(-160, -96, 320, 30); }
        if (c.sash) { k.fillStyle = c.sash; k.beginPath(); k.moveTo(-100, -336); k.lineTo(-36, -336); k.lineTo(152, -126); k.lineTo(152, -64); k.closePath(); k.fill(); k.strokeStyle = T.shade(c.sash, -0.22); k.lineWidth = 5; k.stroke(); }
      },
    });
    const costume = T.paintCostume && (T.PAINT || c.patches);
    if (costume && !c.outfit) T.paintCostume(ctx, c, view, { path, sway: hem, seed, stage: 'under' }); // painted cloth folds
    if (c.outfit && T.OUTFITS && T.OUTFITS[c.outfit]) T.OUTFITS[c.outfit](ctx, c, view);
    if (T.drawOutfitExtras) T.drawOutfitExtras(ctx, c, view);
    if (costume) T.paintCostume(ctx, c, view, { path, sway: hem, seed, stage: 'over' }); // fabric weave over the outfit, patches
    if (c.belt && c.outfit !== 'tunic' && c.outfit !== 'surcoat') {
      if (T.PAINT && T.paintBelt) T.paintBelt(ctx, c.belt);
      else { ctx.strokeStyle = c.belt; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(-124, -186); ctx.quadraticCurveTo(0, -174, 124, -186); ctx.stroke(); }
    }
    if (c.armor) {
      T.outlined(ctx, (k) => { k.moveTo(-104, -320); k.quadraticCurveTo(0, -336, 104, -320); k.lineTo(116, -168); k.quadraticCurveTo(0, -150, -116, -168); k.closePath(); }, c.armor, {
        shade: (k) => { k.fillStyle = T.shade(c.armor, -0.2); k.fillRect(back * 50, -340, 90 * back, 200); k.strokeStyle = T.shade(c.armor, -0.38); k.lineWidth = 6; for (let y = -280; y < -170; y += 30) { k.beginPath(); k.moveTo(-110, y); k.quadraticCurveTo(0, y + 10, 110, y); k.stroke(); } },
      });
    }
  }

  // ---------- motion model ----------
  function gaitState(Ly, lt) {
    const run = inWin(Ly.run, lt), walk = !run && inWin(Ly.walk, lt);
    if (!run && !walk) return null;
    const period = (run ? 0.4 : 0.56) / (Ly.gaitRate ?? 1);
    const ph = (twos(lt) / period) % 1, s = Math.sin(ph * Math.PI * 2), stride = run ? 46 : 30, lift = run ? 34 : 18;
    return {
      run, bob: -Math.abs(Math.cos(ph * Math.PI * 2)) * (run ? 24 : 14), lean: run ? 9 : 2,
      legs: [{ dx: s * stride, dy: -Math.max(0, s) * lift }, { dx: -s * stride, dy: -Math.max(0, -s) * lift }],
      arms: run ? [A(18 + s * 38, 70, 'fist'), A(18 - s * 38, 70, 'fist')] : [A(10 + s * 24, 10), A(10 - s * 24, 10)],
    };
  }

  // Body fields blended with the pose blend: dy/rot/lean interpolate, legs and pivot switch at p 0.5.
  function bodyState(prev, cur, p) {
    const a = prev.body, b = cur.body, late = p >= 0.5;
    return { dy: T.lerp(a.dy, b.dy, p), rot: T.lerp(a.rot, b.rot, p), lean: T.lerp(a.lean, b.lean, p), armScale: T.lerp(a.armScale, b.armScale, p),
      legs: late ? b.legs : a.legs, pivot: late ? b.pivot : a.pivot, view: b.view };
  }
  // antic: 3-frame anticipation before the next pose change and a 2-frame overshoot after it. snapTilt: one tilted frame.
  function anticState(Ly, lt, pt, blend) {
    const out = { dy: 0, sy: 1, arm: 0, tilt: 0 };
    const changed = pt.at > -1e8 && pt.cur !== pt.prev, since = lt - pt.at;
    if (Ly.antic && Array.isArray(Ly.pose)) {
      const next = Ly.pose.find((e) => (e.at ?? 0) > lt);
      if (next && next.v !== pt.cur && (next.at ?? 0) - lt <= 3 / 30 + 1e-6) { out.dy = 12; out.sy = 0.94; out.arm = -15; }
      else if (changed && since >= blend && since < blend + 2 / 30) out.sy = 1.04;
    }
    if (Ly.snapTilt && changed && since >= 0 && since < 1 / 30) out.tilt = Ly.snapTilt;
    return out;
  }

  // Points that outline the figure (body units), used to keep a rotated bean on the ground (or centred in the air).
  function hullPoints(B, dy, geom, standLegs) {
    const pts = [];
    const tor = (x, y) => [x * B.bodyW, y * B.bodyH + B.offY + dy];
    const head = (x, y) => [x * B.head + B.headFwd * 300, B.neckY + (y + 300) * B.head + dy];
    [[-150, -62], [150, -62], [-110, -330], [110, -330]].forEach(([x, y]) => pts.push(tor(x, y)));
    [[-150, -450], [150, -450], [0, -604], [-105, -340], [105, -340]].forEach(([x, y]) => pts.push(head(x, y)));
    if (standLegs) [[-71, 0], [71, 0]].forEach(([x, y]) => pts.push([x * B.legW, y]));
    (geom || []).forEach((L) => [L.knee, L.ft].forEach(([x, y]) => pts.push([x - 25, y + 25], [x + 25, y + 25], [x, y - 25])));
    return pts;
  }
  function rotFit(pts, rot, pivot) {
    const ext = (r) => {
      const cs = Math.cos(r), sn = Math.sin(r);
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      pts.forEach(([x, y]) => { const X = x * cs - y * sn, Y = x * sn + y * cs; x0 = Math.min(x0, X); x1 = Math.max(x1, X); y0 = Math.min(y0, Y); y1 = Math.max(y1, Y); });
      return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, y1 };
    };
    const e0 = ext(0), e = ext(rot);
    return { x: e0.cx - e.cx, y: pivot === 'center' ? e0.cy - e.cy : e0.y1 - e.y1 };
  }

  // Parts and motion helpers for the layer assembly in bean.js (T.layers.bean).
  T.RIG = { A, poseOf, geomOf, solveArm, lerpArm, swingArm, ik, arm, legs, legGeom, drawLegMode, cape, body, gaitState, bodyState,
    anticState, hullPoints, rotFit, inWin, twos, ARM_W, LEG_W };
})();
