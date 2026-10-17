// grip.js — how a bean's hand holds a prop (`hold` / `holdL`): the grip point of every handheld prop (the fist closes
// on a pole, a handle, an edge or a neck instead of the middle of the drawing), the hand shape while holding, which hand
// mirrors a prop, and the face-clearance fit: a near hand whose prop would cover the eyes or the mouth tilts the prop
// outward, moves the hand out or lowers it, the cheapest natural combination first (the elbow stays bent).
// Rig units (600 tall, feet at 0, the character faces +x). Used by rig.js (drawing) and bean.js (fit, draw order, probe).
(function () {
  'use strict';
  const T = window.TOON;

  // Grip table. at: [x, y] point of the upright prop drawing held in the fist, in fractions of the prop size from the
  // prop's own origin. hand: hand shape while holding ('fist' when omitted, 'pinch' for small things held by an edge).
  // mirror: 'left' | 'right' = the drawing is mirrored in that hand (a flag's cloth flies outward, a mug's handle faces
  // the hand). alt: the prop may also be held by its other side when that keeps it off the face (true: the other edge,
  // the drawing unmirrored so print stays readable; 'mirror': the drawing mirrors, a mug turns its handle). level: never
  // tilted to clear the face (stacks, cups, lamps would spill), only moved. rot: turn of the drawing in the hand, degrees
  // (a chain hangs). follow: the blade follows the forearm (sword). upright: the shaft stays near vertical (spear, torch).
  // Props hung by a neck, handle or ring (moneybag, sack, bucket, lantern, scales) hang below the fist.
  const G = (x, y, o = {}) => ({ at: [x, y], ...o });
  const PINCH = { hand: 'pinch' }, ALT = { alt: true }, LEVEL = { level: true };
  T.HOLD_GRIP = {
    // symbols and small things: the fist under the bottom edge, small flat things pinched
    coin: G(0, 0.42, PINCH), question: G(0, 0.4), exclaim: G(0, 0.4), heart: G(0, 0.3), skull: G(0, 0.3),
    bulb: G(0, 0.36), pin: G(0, 0.3), pawn: G(0, 0.38), bread: G(0, 0.22), croissant: G(0, 0.05), apple: G(0, 0.35),
    cheese: G(0, 0.28), grenade: G(0, 0.15), bomb: G(0, 0.3), key: G(0, -0.33, PINCH), bandage: G(0, 0.1, PINCH),
    rosette: G(0, -0.35, PINCH), chain: G(-0.48, 0, { hand: 'pinch', rot: 90 }), 'test-tube': G(0, -0.2, PINCH),
    banknotes: G(0.3, 0.2, { hand: 'pinch', alt: true }), whistle: G(0.12, 0.1), remote: G(0, 0.25),
    teacup: G(0.47, -0.05, { hand: 'pinch', mirror: 'left', alt: 'mirror', level: true }),
    smartphone: G(0, 0.25), phone: G(0, 0.25), 'spray-can': G(0, 0.15), canister: G(0, 0.1), binoculars: G(-0.06, 0.2),
    // flat things: the bottom edge, a newspaper by its side edge, a scroll by a rod
    book: G(0, 0.4), 'book-stack': G(0, 0.42, LEVEL), 'paper-stack': G(0, 0.42, LEVEL), 'gold-bars': G(0, 0.35, LEVEL),
    'wall-calendar': G(0, 0.42),
    hourglass: G(0, 0.48), telephone: G(0, 0.3), inkwell: G(0, 0.3, LEVEL), gauge: G(0, 0.4), candle: G(0, 0.42, LEVEL),
    newspaper: G(0.36, 0.2, ALT), scroll: G(0.66, 0.12, ALT),
    // by the handle or the neck; hung things below the fist
    mug: G(0.42, 0, { mirror: 'left', alt: 'mirror', level: true }), bottle: G(0, 0.32), flask: G(0, -0.38, LEVEL),
    'round-flask': G(0, -0.38, LEVEL),
    beaker: G(0, 0.15, LEVEL), retort: G(-0.18, 0.2), amphora: G(0, -0.38), 'oil-lamp': G(-0.43, 0.06),
    moneybag: G(0, -0.42), sack: G(0, -0.4), bucket: G(0, -0.45, LEVEL), lantern: G(0, -0.46, LEVEL), scales: G(0, -0.47, LEVEL),
    rope: G(0, -0.42), magnet: G(0, -0.38), microscope: G(-0.15, -0.05), banner: G(0, -0.48), fish: G(0.42, 0),
    microphone: G(0, 0.3), 'boxing-glove': G(0, 0.38), megaphone: G(-0.19, 0.2), magnifier: G(-0.42, 0.42, { mirror: 'left' }),
    scissors: G(-0.38, 0), paintbrush: G(0, 0.25), 'meat-bone': G(0.33, -0.15),
    // poles, shafts and tool handles: the fist around the shaft
    flag: G(0.03, -0.22, { mirror: 'right' }), 'white-flag': G(-0.31, 0.3, { mirror: 'left' }), placard: G(0, 0.1),
    cross: G(0, 0.38), broom: G(0, -0.15), shovel: G(0, -0.1), pitchfork: G(0, 0.15), pickaxe: G(0, 0.3), axe: G(0, 0.35),
    hammer: G(0, 0.35), mallet: G(0, 0.35), 'coin-gavel': G(0, 0.35), wrench: G(0, 0.12), dagger: G(0, 0.3),
    saw: G(0.38, 0, { mirror: 'right' }), cleaver: G(-0.38, 0), rifle: G(0.02, 0.15), musket: G(-0.2, 0.04),
    pistol: G(-0.1, 0.2), bow: G(0.18, 0),
    // props that place themselves in the hand
    sword: G(0, 0, { follow: true }), spear: G(0, -160 / 420, { upright: true }), torch: G(0, -40 / 170, { upright: true }),
    shield: G(0, 0),
  };
  const DEFAULT_SIZE = { shield: 260, spear: 420 };
  T.heldSize = (hold, size) => size ?? DEFAULT_SIZE[hold] ?? 170;

  // Grip of a prop in a hand: { at: [x, y] rig units in the prop drawing, rot (radians), flip, hand }. side -1 left, +1
  // right; dir = forearm direction of the solved arm; tilt = the fit's tilt (radians), user = the layer's holdRot
  // (radians, applied as given). Props without an entry keep the classic placement (centre 60 units above the wrist).
  const UPRIGHT = 0.35; // a spear or torch leans at most this far (radians, about 20 degrees) unless holdRot says so
  T.gripOf = (hold, size, side, dir = 0, tilt = 0, alt = false, user = 0) => {
    const s = T.heldSize(hold, size), e = T.HOLD_GRIP[hold];
    if (!e) return { at: [0, 60 * Math.min(1, s / 170)], rot: tilt + user, flip: false, hand: null, entry: null };
    let rot = user + (e.rot || 0) * T.DEG;
    if (e.follow) rot += tilt + Math.PI - dir; // the blade follows the forearm
    else if (e.upright) rot += T.clamp(-Math.sin(dir) * UPRIGHT + tilt, -UPRIGHT, UPRIGHT); // shafts stay near vertical
    else rot += tilt;
    const swap = alt && e.alt === true, turn = alt && e.alt === 'mirror';
    const flip = (e.mirror === (side < 0 ? 'left' : 'right')) !== turn;
    return { at: [(swap ? -1 : 1) * e.at[0] * s, e.at[1] * s], rot, flip, hand: e.hand ?? 'fist', entry: e };
  };
  // Hand shape a holding hand takes (the pose's open / point / wave hand would pass its fingers through the prop).
  T.gripHand = (hold) => (T.HOLD_GRIP[hold] ? T.HOLD_GRIP[hold].hand ?? 'fist' : null);
  // Where the grip point goes: the centre of the palm (6 units along the forearm from the wrist), or the meeting
  // finger tips of a pinch (36 units), scaled by the hand size.
  T.palmOf = (j, hs = 1) => { const d = (j.hand === 'pinch' ? 36 : 6) * hs; return [j.hx + Math.sin(j.dir) * d, j.hy + Math.cos(j.dir) * d]; };

  // ---------- face clearance ----------
  // The drawn shape of a prop: points (prop-drawing units) on a grid over the opaque pixels of an off-stage drawing at
  // time 0, measured once per prop and whole size in the flat look (the painted light only shades and inks the same
  // silhouette), then scaled to the exact size. A pure function of (prop, size), so render order never matters.
  const SHAPES = new Map(), SAMPLE = 10; // grid step of the measured shape, rig units (at most)
  function measure(hold, size) {
    const key = `${hold}|${size}`;
    if (SHAPES.has(key)) return SHAPES.get(key);
    const n = Math.ceil(size * 3), cv = document.createElement('canvas');
    cv.width = cv.height = n;
    const k = cv.getContext('2d', { willReadFrequently: true }), paint = T.PAINT;
    let pts = null;
    T.PAINT = null;
    try {
      k.translate(n / 2, n / 2); T.drawProp(k, hold, size, 0, {});
      const d = k.getImageData(0, 0, n, n).data, step = T.clamp(Math.round(size / 28), 4, SAMPLE);
      pts = [];
      for (let y = 0; y < n; y += step) for (let x = 0; x < n; x += step) if (d[(y * n + x) * 4 + 3] > 40) pts.push([x - n / 2, y - n / 2]);
    } catch (e) { pts = null; } finally { T.PAINT = paint; } // a prop that cannot draw off-stage keeps the pose's grip
    SHAPES.set(key, pts);
    return pts;
  }
  function shapeOf(hold, size) {
    const r = Math.max(1, Math.round(size)), pts = measure(hold, r);
    return pts && r !== size ? pts.map(([x, y]) => [x * size / r, y * size / r]) : pts;
  }
  T.heldShape = shapeOf;

  // Eyes, brows and mouth of the head in rig units for a view (null when no face shows).
  const FEATURES = { front: [-84, 84], '3q': [-36, 108], side: [48, 136] };
  T.faceBox = (B, view) => {
    const fx = FEATURES[view];
    if (!fx) return null;
    const X = (x) => x * B.head + B.headFwd * 300, Y = (y) => B.neckY + (y + 300) * B.head;
    return { x0: X(fx[0]), x1: X(fx[1]), y0: Y(-540), y1: Y(-336) };
  };
  // Head rotation (bean.js): rig points into the unrotated head frame, so the face box follows a tilted or nodding head.
  T.headFrame = (B, deg, dy = 0) => {
    const px = B.headFwd * 300, py = B.neckY + dy, c = Math.cos(-deg * T.DEG), s = Math.sin(-deg * T.DEG);
    return deg ? ([x, y]) => [px + (x - px) * c - (y - py) * s, py + (x - px) * s + (y - py) * c] : (q) => q;
  };
  // World (rig) points of a held prop for a hand and a grip.
  const placed = (pts, palm, g) => {
    const c = Math.cos(g.rot), s = Math.sin(g.rot), f = g.flip ? -1 : 1;
    return pts.map(([x, y]) => { const lx = f * (x - g.at[0]), ly = y - g.at[1]; return [palm[0] + lx * c - ly * s, palm[1] + lx * s + ly * c]; });
  };
  const inHead = (B) => {
    const cx = B.headFwd * 300, cy = B.neckY - 150 * B.head, rx = 150 * B.head, ry = 152 * B.head;
    return ([x, y]) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 1;
  };
  const hits = (pts, box) => pts.reduce((n, [x, y]) => n + (x > box.x0 && x < box.x1 && y > box.y0 && y < box.y1 ? 1 : 0), 0);
  const TILTS = [0, 8, 16, 24], DXS = [0, -16, -32, 16, 32, 48, 64, 80, 96, 112, 128], DYS = [0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200];
  // Poses that bring the held thing to the face on purpose.
  T.TO_FACE_POSES = new Set(['eat', 'drink', 'phone-ear', 'binoculars']);
  const AT_FACE = 190; // largest prop (rig units) a pose may bring to the face
  const extentOf = (pts) => {
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    pts.forEach(([x, y]) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); });
    return Math.max(x1 - x0, y1 - y0);
  };
  const REACH = 0.88, LAST_REACH = 0.96; // a fitted hand stays within this fraction of the arm's length (a bent elbow)
  // Fit a near hand so its prop clears the face: returns the arm (re-solved by IK when the hand moves) with gripTilt
  // (radians, outward), or the arm unchanged when the prop already clears, the hand is at the face on purpose (eat,
  // phone-ear, toFace) or the prop places itself (sword). geo = {sx, sy, l1, l2} of the arm, ik = the rig's IK solver.
  T.gripFit = (j, hold, size, B, side, view, geo, ik, hs = 1, toFace = false, toHead = (q) => q) => {
    const face = T.faceBox(B, view), e = T.HOLD_GRIP[hold];
    if (!face || !hold || !T.drawProp || (e && e.follow)) return j;
    const s = T.heldSize(hold, size), pts = shapeOf(hold, s);
    if (!pts || !pts.length) return j;
    // a pose that brings the held thing to the face (eat, drink, phone-ear) puts a hand-sized prop there on purpose; a
    // big one (a placard, a broom) still clears the face
    if (toFace && extentOf(pts) <= AT_FACE) return j;
    const at = (q, tilt, alt = false) => placed(pts, T.palmOf(q, hs), T.gripOf(hold, size, side, q.dir, tilt * T.DEG * side, alt)).map(toHead);
    const m = SAMPLE + 4, box = { x0: face.x0 - m, x1: face.x1 + m, y0: face.y0 - m, y1: face.y1 }; // the shape is sampled on a grid
    if (!hits(at(j, 0), box)) return j;
    const tilts = e && e.level ? [0] : e && e.upright ? TILTS.slice(0, 3) : TILTS, alts = e && e.alt ? [false, true] : [false];
    const head = inHead(B), over = (q) => q.reduce((n, p) => n + (head(p) ? 1 : 0), 0) / q.length;
    let best = null;
    // a moved hand keeps the elbow bent (REACH), even when the pose's arm is straight; only when no bent arm clears the
    // face may it reach further (LAST_REACH), so a big prop never covers the mouth of a tilted head
    for (const k of [REACH, LAST_REACH]) {
      const reach = (geo.l1 + geo.l2) * k;
      for (const dy of DYS) for (const dx of DXS) {
        const tx = j.hx + dx * side, ty = j.hy + dy;
        if ((dx || dy) && Math.hypot(tx - j.sx, ty - j.sy) > reach) continue;
        if (best && !best.n && Math.abs(dx) / 18 + dy / 30 >= best.cost) continue; // a clear fit that costs less is found
        const q = dx || dy ? { ...j, ...ik(j.sx, j.sy, tx, ty, side, geo.l1, geo.l2) } : j;
        if (q !== j && Math.hypot(q.hx - j.sx, q.hy - j.sy) > reach) continue; // the IK lands near shoulder level too
        for (const alt of alts) for (const tl of tilts) {
          // cost: moving the hand (the arm straightens) > tilting > lowering; a prop over the head reads cluttered
          const w = at(q, tl, alt), n = hits(w, box), cost = Math.abs(dx) / 18 + dy / 30 + tl / 10 + over(w) * 2 + (alt ? 1 : 0);
          if (!best || n < best.n || (n === best.n && cost < best.cost)) best = { n, cost, q, tl, alt };
          if (!n) break; // more tilt only costs more
        }
      }
      if (!best.n) break;
    }
    return { ...best.q, gripTilt: best.tl * T.DEG * side, gripAlt: best.alt };
  };
})();
