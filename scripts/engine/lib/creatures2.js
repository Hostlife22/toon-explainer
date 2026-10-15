// creatures2.js — v4 living things: the personified `obj` layer (a face, tube arms with gloves, legs and a hat on any
// prop, vehicle or built-in shape) and creatures v4 for TOON.CREATURES: wolf, dog, elephant, pig, rabbit, turtle, goat,
// snail, kangaroo. Creature units: 400 tall, feet at (0,0), facing +x (flip to face left); `size` = on-screen height.
// Poses: stand (quadruped), sit (haunches), biped (bean-proportioned animal that can `hold` a prop). Times layer-local.
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL, D = T.DEG, PI = Math.PI, TAU = Math.PI * 2;
  const U = T.PROP3, { stick, O, LW, inWin, F, two, fillR, ell } = U;
  const sh = (c, k = -0.22) => T.shade(c, k);
  const twos = (lt) => Math.floor(lt * 15) / 15;
  const driven = (wins, lt) => (wins || []).reduce((a, [x, y]) => a + Math.max(0, Math.min(lt, y) - x), 0);

  // ---------- obj: personified object layer (feature 24) ----------
  const SHAPES = {
    blob: (ctx, s, L) => O(ctx, s, (k) => T.smoothPath(k, T.blobPts(0, -s / 2, s * 0.5, s * 0.46, (L.id || 'obj') + ':blob', 22, 0.18)), L.color ?? '#7fb2e5', fillR(sh(L.color ?? '#7fb2e5'), s * 0.12, -s * 1.2, s, s * 1.4)),
    disc: (ctx, s, L) => O(ctx, s, (k) => k.arc(0, -s / 2, s / 2, 0, TAU), L.color ?? '#f2c230', (k) => { k.fillStyle = sh(L.color ?? '#f2c230'); k.beginPath(); k.arc(s * 0.1, -s * 0.42, s / 2, 0, TAU); k.fill(); k.fillStyle = L.color ?? '#f2c230'; k.beginPath(); k.arc(-s * 0.02, -s * 0.52, s * 0.42, 0, TAU); k.fill(); }),
    globe(ctx, s, L) {
      const r = T.rng(T.hash((L.id || 'obj') + ':land')), blobs = [...Array(5)].map((_, i) => T.blobPts((r() - 0.5) * s * 0.8, -s / 2 + (r() - 0.5) * s * 0.7, s * (0.12 + r() * 0.12), s * (0.09 + r() * 0.1), (L.id || 'obj') + 'c' + i, 12, 0.35));
      O(ctx, s, (k) => k.arc(0, -s / 2, s / 2, 0, TAU), L.color ?? '#3b62c9', (k) => { k.fillStyle = L.land ?? '#4aa84a'; for (const b of blobs) { k.beginPath(); T.smoothPath(k, b); k.fill(); } k.fillStyle = 'rgba(0,0,0,0.18)'; k.beginPath(); k.arc(s * 0.12, -s * 0.42, s / 2, 0, TAU); k.arc(-s * 0.04, -s * 0.54, s * 0.44, 0, TAU, true); k.fill(); });
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = s * 0.03; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, -s / 2, s * 0.4, PI * 1.1, PI * 1.4); ctx.stroke();
    },
    heart: (ctx, s, L) => O(ctx, s, (k) => { k.moveTo(0, 0); k.bezierCurveTo(-s * 0.75, -s * 0.42, -s * 0.5, -s * 1.08, 0, -s * 0.78); k.bezierCurveTo(s * 0.5, -s * 1.08, s * 0.75, -s * 0.42, 0, 0); k.closePath(); }, L.color ?? '#f3c9e6', fillR(L.shade ?? '#d9a6cf', 0, -s, s, s)),
    footstool(ctx, s, L) { // tufted cushion on a wooden apron with four turned legs (reads as a stool, not a blob)
      const wood = L.wood ?? '#a8743a', cu = L.color ?? '#9a1e2a';
      for (const x of [-0.22, 0.22, -0.4, 0.4]) { const far = Math.abs(x) < 0.3, c = far ? sh(wood, -0.2) : wood;
        O(ctx, s, (k) => { k.moveTo(s * x - s * 0.05, -s * 0.26); k.lineTo(s * x + s * 0.05, -s * 0.26); k.quadraticCurveTo(s * x + s * 0.07, -s * 0.15, s * x + s * 0.025, -s * 0.03); k.lineTo(s * x - s * 0.025, -s * 0.03); k.quadraticCurveTo(s * x - s * 0.07, -s * 0.15, s * x - s * 0.05, -s * 0.26); k.closePath(); }, c, fillR(sh(c), s * x, -s, s, s));
        O(ctx, s, (k) => ell(k, s * x, -s * 0.03, s * 0.04, s * 0.02), sh(wood, -0.35)); }
      O(ctx, s, (k) => T.rrect(k, -s * 0.47, -s * 0.36, s * 0.94, s * 0.12, s * 0.03), wood, (k) => { k.fillStyle = sh(wood); k.fillRect(-s, -s * 0.29, s * 2, s); k.strokeStyle = sh(wood, -0.35); k.lineWidth = s * 0.008; for (const x of [-0.3, 0, 0.3]) { k.beginPath(); k.arc(s * x, -s * 0.3, s * 0.025, 0, TAU); k.stroke(); } });
      O(ctx, s, (k) => { k.moveTo(-s * 0.48, -s * 0.36); k.quadraticCurveTo(-s * 0.52, -s * 0.6, 0, -s * 0.62); k.quadraticCurveTo(s * 0.52, -s * 0.6, s * 0.48, -s * 0.36); k.closePath(); }, cu, fillR(sh(cu), -s, -s * 0.44, s * 2, s));
      ctx.fillStyle = sh(cu, -0.4); for (const [x, y] of [[-0.24, -0.5], [0, -0.53], [0.24, -0.5], [-0.12, -0.43], [0.12, -0.43]]) { ctx.beginPath(); ctx.arc(s * x, s * y, s * 0.02, 0, TAU); ctx.fill(); }
      ctx.strokeStyle = sh(cu, -0.3); ctx.lineWidth = s * 0.008; ctx.lineCap = 'round'; for (const [x, y] of [[-0.12, -0.5], [0.12, -0.5]]) { ctx.beginPath(); ctx.moveTo(s * (x - 0.08), s * y); ctx.lineTo(s * (x + 0.08), s * (y + 0.06)); ctx.stroke(); }
    },
  };
  function objBody(ctx, L, s, lt, env) {
    if (L.vehicle) {
      const fn = T.VEHICLES[L.vehicle]; if (!fn) throw new Error('obj: unknown vehicle ' + L.vehicle);
      ctx.save(); fn(ctx, { ...L, kind: L.vehicle }, { size: s, lt, dist: driven(L.drive, lt) * (L.speed ?? 1), driving: inWin(L.drive, lt) }, env); ctx.restore(); return;
    }
    if (L.prop) {
      if (!T.PROPS[L.prop]) throw new Error('obj: unknown prop ' + L.prop);
      ctx.save(); if (!T.PROP_GROUND.has(L.prop)) ctx.translate(0, -s / 2); T.drawProp(ctx, L.prop, s, lt, L); ctx.restore(); return;
    }
    const fn = SHAPES[L.shape ?? 'blob']; if (!fn) throw new Error('obj: unknown shape ' + L.shape + ' (blob|disc|globe|heart|footstool)');
    fn(ctx, s, L);
  }
  // Fallback mini face built from the bean eye / mouth kinds (scaled head units) so objects match the cast.
  function miniBrows(ctx, kind, r, lt) {
    const tilt = { angry: 0.35, sad: -0.35, worried: -0.25, high: 0, smug: 0.12 }[kind];
    if (tilt == null) return;
    ctx.strokeStyle = P.ink; ctx.lineWidth = 12; ctx.lineCap = 'round';
    for (const d of [-1, 1]) { const y = -520 - (kind === 'high' ? 30 : 0); ctx.beginPath(); ctx.moveTo(d * 78, y - tilt * 40); ctx.lineTo(d * 20, y + tilt * 30); ctx.stroke(); }
  }
  function miniFace(ctx, x, y, r, mood, lt, seed, o) {
    const H = T.BEAN_HEAD, e = (T.EXPR && T.EXPR[mood]) || (T.EXPR && T.EXPR.neutral);
    ctx.save(); ctx.translate(x, y);
    if (!H || !e) { ctx.fillStyle = P.ink; for (const d of [-1, 1]) { ctx.beginPath(); ctx.arc(d * r * 0.35, -r * 0.1, r * 0.06 * 2, 0, TAU); ctx.fill(); } ctx.lineWidth = r * 0.06; ctx.strokeStyle = P.ink; ctx.beginPath(); ctx.moveTo(-r * 0.2, r * 0.35); ctx.lineTo(r * 0.2, r * 0.35); ctx.stroke(); ctx.restore(); return; }
    ctx.scale(r / 150, r / 150); ctx.translate(0, 450);
    const base = o.eyes ?? e.eyes, ek = o.blink && !T.NO_BLINK_EYES.includes(base) ? 'blink' : base;
    for (const [ex, sg] of [[-52, -1], [52, 1]]) H.eye(ctx, ek, ex, -458, sg, lt, {});
    if (e.brows) { if (T.BROW_KINDS[e.brows]) for (const [ex, sg] of [[-52, -1], [52, 1]]) T.BROW_KINDS[e.brows](ctx, ex, -508, sg, lt, {}); else miniBrows(ctx, e.brows, r, lt); }
    H.mouth(ctx, o.mouth ?? (o.talking ? H.talkMouth(mood, lt, seed) : e.mouth), 0, -382, lt, {}, 'front');
    ctx.restore();
  }
  function objFace(ctx, L, s, lt) {
    if (L.face === false) return;
    const f = L.face && typeof L.face === 'object' ? L.face : {}, [px, py] = f.pos ?? [0, -0.55], seed = L.id || 'obj';
    const r = s * 0.3 * (f.scale ?? 1), mood = T.timed(f.mood ?? 'neutral', lt, 0).cur, talking = inWin(L.talk, lt);
    const blink = L.blink !== false && (lt + (T.hash(seed) % 300) / 100) % 3 < 0.1; // ~every 3 s for 3 frames
    if (T.drawMiniFace) T.drawMiniFace(ctx, px * s, py * s, r, mood, lt, seed, { eyes: f.eyes, mouth: f.mouth ?? (talking && T.BEAN_HEAD ? T.BEAN_HEAD.talkMouth(mood, lt, seed) : undefined), color: f.color, blink });
    else miniFace(ctx, px * s, py * s, r, mood, lt, seed, { eyes: f.eyes, mouth: f.mouth, talking, blink });
  }
  // Arm pose -> [elbow, hand] offsets from the shoulder (units of s), hand state. side -1 = screen left.
  function armPose(pose, side, lt, A) {
    const out = (x, y) => [side * x, y], idle = { e: out(0.12, 0.14), h: out(0.16, 0.32), g: 'open' };
    if (pose === 'flex') return { e: out(0.26, 0), h: out(0.27, -0.24), g: 'fist', bicep: true };
    if (pose === 'crossed') return { e: out(0.1, 0.16), h: [-side * 0.14, 0.12], g: 'fist' };
    if (pose === 'hold') return { e: out(0.16, 0.14), h: out(0.2, -0.02), g: 'grab' };
    if (side < 0) return pose === 'punch' ? { e: out(0.12, 0.08), h: out(0.06, -0.06), g: 'fist' } : idle;
    if (pose === 'wave') { const a = Math.sin(twos(lt) * 14) * 0.45; return { e: out(0.22, -0.12), h: [0.22 + Math.sin(a) * 0.2, -0.12 - Math.cos(a) * 0.2], g: 'open' }; }
    if (pose === 'point') return { e: out(0.22, -0.04), h: out(0.44, -0.08), g: 'point' };
    if (pose === 'punch') { // 11-frame cycle: extend 2, hold 3, retract 3, rest 3
      const f = F(lt - (A.at ?? 0)), n = A.count ?? 1e9, c = f < 0 || f >= n * 11 ? 99 : f % 11, ex = c < 2 ? c / 2 : c < 5 ? 1 : c < 8 ? 1 - (c - 5) / 3 : 0;
      return { e: [T.lerp(0.14, 0.32, ex), T.lerp(0.1, -0.04, ex)], h: [T.lerp(0.12, 0.62, ex), T.lerp(0.02, -0.06, ex)], g: 'fist' };
    }
    return idle;
  }
  function objArms(ctx, L, s, lt) {
    const A = L.arms === true ? {} : L.arms, pose = T.timed(A.pose ?? 'idle', lt, 0).cur, col = A.color ?? '#ffffff', at = A.at ?? 0;
    const span = (A.span ?? 0.42) * s, sy = (A.y ?? -0.45) * s, w = s * (A.w ?? 0.075);
    for (const side of [-1, 1]) {
      let g = 1;
      if (A.sprout) { const f = F(lt - at - (side > 0 ? 10 / 30 : 0)); g = f < 0 ? 0 : f < 3 ? T.ease.outBack(f / 3) : 1; } // grow in 3 frames, second arm 10 frames later
      if (g <= 0) continue;
      const p = armPose(pose, side, lt, A), S = [side * span, sy], E = [S[0] + p.e[0] * s * g, sy + p.e[1] * s * g], Hd = [S[0] + p.h[0] * s * g, sy + p.h[1] * s * g];
      stick(ctx, s, [S, E, Hd], w, col);
      if (p.bicep) { const f = F(lt - at), pulse = A.sprout && f > 13 ? 1 + 0.08 * Math.max(0, Math.sin(((f - 13) / 12) * TAU)) : 1; O(ctx, s, (k) => k.arc((S[0] + E[0]) / 2, sy - s * 0.04 * g, s * 0.06 * g * pulse, 0, TAU), col); }
      const ang = Math.atan2(Hd[1] - E[1], Hd[0] - E[0]), gs = s * 0.2 * g * (A.hand ?? 1);
      if (A.hold && side > 0 && T.PROPS[A.hold]) { ctx.save(); ctx.translate(Hd[0], Hd[1] - gs * 0.3); T.drawProp(ctx, A.hold, s * (A.holdSize ?? 0.5), lt, {}); ctx.restore(); }
      T.drawGlove(ctx, Hd[0] + Math.cos(ang) * gs * 0.3, Hd[1] + Math.sin(ang) * gs * 0.3, ang + PI / 2, p.g, { size: gs, line: Math.max(3, gs * 0.05) * (120 / gs), skin: A.glove ?? '#fbfaf6' });
    }
  }
  function objLegs(ctx, L, s, lt) {
    const walk = inWin(L.walk, lt), ph = walk ? Math.sin((twos(lt) / 0.56) * TAU) : 0, col = L.legColor ?? '#f4f1ea';
    for (const d of [-1, 1]) { const dx = d * ph * s * 0.06, x = d * s * 0.16; stick(ctx, s, [[x, -s * 0.3], [x + dx, -s * 0.04]], s * 0.12, col); O(ctx, s, (k) => ell(k, x + dx + s * 0.04, -s * 0.03, s * 0.09, s * 0.045), L.shoeColor ?? '#6b4423'); }
  }
  function objExtras(ctx, L, s, lt) {
    const f = L.face && typeof L.face === 'object' ? L.face : {}, [px, py] = f.pos ?? [0, -0.55];
    if (L.cracked) {
      const r = T.rng(T.hash((L.id || 'obj') + ':crack')), cracks = [...Array(3)].map(() => { const a = r() * TAU, pts = [[Math.cos(a) * s * 0.45, -s / 2 + Math.sin(a) * s * 0.42]]; for (let i = 0; i < 4; i++) { const [x, y] = pts[pts.length - 1]; pts.push([x * 0.8 + (r() - 0.5) * s * 0.08, -s / 2 + (y + s / 2) * 0.8 + (r() - 0.5) * s * 0.08]); } return pts; });
      ctx.strokeStyle = P.ink; ctx.lineWidth = Math.max(2, s * 0.012); ctx.lineJoin = 'round';
      for (const c of cracks) { ctx.beginPath(); c.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); }
    }
    if (L.bandage) for (const a of [35, -35]) { ctx.save(); ctx.translate((px + 0.24) * s, (py - 0.16) * s); ctx.rotate(a * D); O(ctx, s, (k) => T.rrect(k, -s * 0.14, -s * 0.035, s * 0.28, s * 0.07, s * 0.02), '#e8c79a'); ctx.fillStyle = '#c9a070'; for (const x of [-0.08, -0.04, 0.04, 0.08]) { ctx.beginPath(); ctx.arc(s * x, 0, s * 0.008, 0, TAU); ctx.fill(); } ctx.restore(); }
    const hw = L.head && T.HEADWEAR && T.HEADWEAR[L.head];
    if (hw) { const k = ((L.headSize ?? 0.35) * s) / 150; ctx.save(); ctx.translate((L.headX ?? 0) * s, (L.headY ?? -1) * s); ctx.rotate((L.headTilt ?? 0) * D); ctx.scale(k, k); ctx.translate(0, 560); hw(ctx, { headColor: L.headColor, headColor2: L.headColor2 }, lt, 0.24, '3q'); ctx.restore(); }
  }
  T.layers.obj = (ctx, L, lt, env) => T.withPropEnv(env, () => {
    const s = L.size ?? 200, seed = L.id || 'obj', lift = L.legs ? s * 0.26 : 0;
    const b = Math.sin(lt * 0.6 * TAU + (T.hash(seed) % 7)) * 0.015; // idle breathing squash about the feet
    if (L.legs) objLegs(ctx, L, s, lt);
    ctx.save(); ctx.translate(0, -lift); ctx.scale(1 - b * 0.5, 1 + b);
    objBody(ctx, L, s, lt, env);
    objExtras(ctx, L, s, lt);
    objFace(ctx, L, s, lt);
    if (L.arms) objArms(ctx, L, s, lt);
    ctx.restore();
  });

  // ---------- creatures v4 (feature 66) ----------
  const EXPRS = { angry: [0.4, 'dot'], sad: [-0.4, 'dot'], happy: [0, 'arc'], neutral: [null, 'dot'], scared: [-0.3, 'wide'], shock: [-0.1, 'wide'] };
  function eye(ctx, x, y, r, L, lt) { // profile eye + brow by expr, blink every ~2.7 s
    const [brow, kind] = EXPRS[L.expr ?? 'neutral'] ?? EXPRS.neutral, blink = (lt + (T.hash(L.id || L.kind) % 200) / 100) % 2.7 < 0.1;
    ctx.fillStyle = P.ink; ctx.strokeStyle = P.ink; ctx.lineCap = 'round'; ctx.lineWidth = r * 0.5;
    if (blink || kind === 'arc') { ctx.beginPath(); ctx.arc(x, y + (blink ? 0 : r * 0.4), r, PI + 0.3, -0.3); ctx.stroke(); }
    else if (kind === 'wide') { T.outlined(ctx, (k) => k.arc(x, y, r * 1.6, 0, TAU), '#ffffff', { line: r * 0.35 }); ctx.beginPath(); ctx.arc(x + r * 0.3, y, r * 0.6, 0, TAU); ctx.fill(); }
    else if (L.goatEye) { T.outlined(ctx, (k) => ell(k, x, y, r * 1.5, r * 1.1), '#f2d27a', { line: r * 0.35 }); ctx.fillRect(x - r * 0.9, y - r * 0.25, r * 1.8, r * 0.5); }
    else { ctx.beginPath(); ell(ctx, x, y, r * 0.75, r * 1.05); ctx.fill(); }
    if (brow != null) { ctx.lineWidth = r * 0.45; ctx.beginPath(); ctx.moveTo(x - r * 1.4, y - r * 2 - brow * r * 1.2); ctx.lineTo(x + r * 1.3, y - r * 2 + brow * r * 1.2); ctx.stroke(); }
  }
  const talkOpen = (L, lt) => inWin(L.talk, lt) && Math.floor(lt * 10) % 2 === 0;
  const twitch = (L, lt) => ((lt + (T.hash(L.id || L.kind) % 100) / 50) % 2 < 2 / 30 ? 10 * D : 0); // ear twitch every ~2 s, 2 frames
  const HEADS = {
    canine(ctx, L, c, c2, lt) {
      const tw = twitch(L, lt), flop = L.kind === 'dog';
      for (const ex of [-26, 8]) { ctx.save(); ctx.translate(ex, -46); ctx.rotate(flop ? 0.5 + tw : -0.1 + tw); O(ctx, 300, flop ? (k) => ell(k, -6, 30, 18, 38, 0.3) : (k) => { k.moveTo(-20, 6); k.lineTo(2, -52); k.lineTo(22, 6); k.closePath(); }, flop ? sh(c, -0.25) : c); ctx.restore(); }
      if (talkOpen(L, lt)) O(ctx, 300, (k) => { k.moveTo(30, 20); k.lineTo(110, 40); k.lineTo(40, 55); k.closePath(); }, '#7a2a2a');
      O(ctx, 300, (k) => { k.moveTo(-60, -20); k.quadraticCurveTo(-50, -62, 10, -56); k.quadraticCurveTo(50, -50, 70, -20); k.lineTo(118, 6); k.quadraticCurveTo(122, 26, 100, 30); k.lineTo(40, 40); k.quadraticCurveTo(-40, 64, -60, -20); k.closePath(); }, c, (k) => { k.fillStyle = c2; k.beginPath(); ell(k, 30, 40, 70, 22); k.fill(); });
      ctx.fillStyle = P.ink; ctx.beginPath(); ell(ctx, 112, 10, 13, 10); ctx.fill();
      eye(ctx, 26, -18, 8, L, lt);
    },
    goat(ctx, L, c, c2, lt) {
      O(ctx, 300, (k) => { k.moveTo(-30, -40); k.quadraticCurveTo(-70, -110, -110, -90); k.quadraticCurveTo(-70, -84, -50, -30); k.closePath(); }, '#b8a888');
      ctx.save(); ctx.translate(-30, -30); ctx.rotate(0.6 + twitch(L, lt)); O(ctx, 300, (k) => ell(k, -30, 0, 34, 12), c); ctx.restore();
      O(ctx, 300, (k) => { k.moveTo(-50, -30); k.quadraticCurveTo(-30, -66, 20, -50); k.lineTo(96, 20); k.quadraticCurveTo(100, 46, 70, 46); k.quadraticCurveTo(-20, 50, -50, -30); k.closePath(); }, c);
      O(ctx, 300, (k) => { k.moveTo(50, 44); k.lineTo(70, 44); k.lineTo(56, talkOpen(L, lt) ? 110 : 96); k.closePath(); }, c2);
      eye(ctx, 18, -14, 8, { ...L, goatEye: true }, lt);
      ctx.fillStyle = P.ink; ctx.beginPath(); ctx.arc(88, 22, 5, 0, TAU); ctx.fill();
    },
    pig(ctx, L, c, c2, lt) {
      for (const ex of [-40, 0]) { ctx.save(); ctx.translate(ex, -58); ctx.rotate(0.5 + twitch(L, lt)); O(ctx, 300, (k) => { k.moveTo(-16, 0); k.lineTo(20, -10); k.lineTo(28, 30); k.closePath(); }, sh(c, -0.1)); ctx.restore(); }
      O(ctx, 300, (k) => k.arc(0, 0, 70, 0, TAU), c, fillR(sh(c), -80, 30, 160, 60));
      O(ctx, 300, (k) => ell(k, 72, 12, 24, 30), c2);
      ctx.fillStyle = P.ink; for (const y of [2, 24]) { ctx.beginPath(); ell(ctx, 78, y, 5, 7); ctx.fill(); }
      if (talkOpen(L, lt)) O(ctx, 300, (k) => ell(k, 40, 50, 16, 10), '#7a2a2a');
      eye(ctx, 26, -20, 8, L, lt);
    },
    elephant(ctx, L, c, c2, lt) {
      ctx.save(); ctx.translate(-50, 10); ctx.rotate(Math.sin(lt * 2) * 0.06 + twitch(L, lt)); O(ctx, 300, (k) => ell(k, 0, 0, 78, 100), c, (k) => { k.fillStyle = c2; k.beginPath(); ell(k, 10, 4, 52, 72); k.fill(); }); ctx.restore();
      O(ctx, 300, (k) => k.arc(30, -10, 90, 0, TAU), c, fillR(sh(c), -80, 40, 220, 80));
      ctx.save(); ctx.translate(100, 30); ctx.rotate(Math.sin(lt * 1.6) * 0.08);
      O(ctx, 300, (k) => { k.moveTo(-20, -30); k.quadraticCurveTo(50, 40, 30, 150); k.quadraticCurveTo(26, 190, 60, 180); k.quadraticCurveTo(70, 160, 54, 160); k.quadraticCurveTo(70, 50, 20, -40); k.closePath(); }, c);
      ctx.restore();
      O(ctx, 300, (k) => { k.moveTo(70, 60); k.quadraticCurveTo(120, 100, 150, 70); k.quadraticCurveTo(120, 84, 84, 50); k.closePath(); }, '#f3ead2');
      eye(ctx, 70, -30, 9, L, lt);
    },
  };
  const TAILS = {
    bushy: (ctx, c, lt) => { ctx.rotate(0.9 + Math.sin(lt * TAU) * 0.15); O(ctx, 300, (k) => { k.moveTo(0, 0); k.quadraticCurveTo(-40, 60, -10, 140); k.quadraticCurveTo(30, 70, 0, 0); k.closePath(); }, c, fillR('#e8e6e0', -40, 110, 80, 40)); },
    thin: (ctx, c, lt) => { ctx.rotate(0.5 + Math.sin(lt * TAU) * 0.2); stick(ctx, 300, [[0, 0], [-14, 70], [-4, 120]], 12, c); },
    curl: (ctx, c, lt) => { ctx.rotate(Math.sin(lt * TAU) * 0.15); ctx.strokeStyle = P.ink; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-40, -10, -40, -50, -16, -46); ctx.bezierCurveTo(4, -40, -6, -20, -22, -26); ctx.stroke(); ctx.strokeStyle = c; ctx.lineWidth = 8; ctx.stroke(); },
    stub: (ctx, c) => O(ctx, 300, (k) => ell(k, -6, -10, 18, 26, -0.6), c),
  };
  const QUAD = {
    wolf: { col: '#8a8a92', col2: '#e8e6e0', rx: 150, ry: 66, cy: -215, leg: 175, lw: 30, bx: 100, head: 'canine', hp: [170, -300], tail: 'bushy' },
    dog: { col: '#d9a441', col2: '#f2e2c0', rx: 140, ry: 64, cy: -200, leg: 160, lw: 30, bx: 95, head: 'canine', hp: [160, -285], tail: 'thin' },
    goat: { col: '#f0ece4', col2: '#d8d2c6', rx: 135, ry: 60, cy: -235, leg: 195, lw: 24, bx: 95, head: 'goat', hp: [160, -320], tail: 'stub' },
    pig: { col: '#f2a0b0', col2: '#f8c4d0', rx: 155, ry: 92, cy: -170, leg: 95, lw: 34, bx: 92, head: 'pig', hp: [170, -210], tail: 'curl' },
    elephant: { col: '#8d8f96', col2: '#a9abb2', rx: 195, ry: 120, cy: -250, leg: 150, lw: 64, bx: 118, head: 'elephant', hp: [180, -300], tail: 'thin' },
  };
  function gait(L, lt, period = 0.7) {
    if (!inWin(L.walk, lt) && !inWin(L.run, lt)) return 0;
    return Math.sin(((twos(lt) / (inWin(L.run, lt) ? period * 0.6 : period)) % 1) * TAU);
  }
  function qleg(ctx, x, top, len, w, a, col, far) {
    ctx.save(); ctx.translate(x, top); ctx.rotate(a);
    O(ctx, 300, (k) => { k.moveTo(-w / 2, 0); k.lineTo(w / 2, 0); k.lineTo(w * 0.38, len - 8); k.lineTo(-w * 0.38, len - 8); k.closePath(); }, far ? sh(col, -0.25) : col);
    O(ctx, 300, (k) => T.rrect(k, -w * 0.45, len - 18, w * 0.9, 20, 6), '#3a2a20');
    ctx.restore();
  }
  function rider(ctx, L, lt, env, x, y) {
    if (!L.rider) return;
    ctx.save(); ctx.translate(x, y); T.layers.bean(ctx, { type: 'bean', who: L.rider, id: (L.id ?? 'cr') + 'r', size: 380 * (L.riderScale ?? 1), legs: false, pose: L.riderPose ?? 'idle', expr: L.riderExpr ?? 'neutral', hold: L.riderHold, rock: 0.6 }, lt, { ...env, st: null }); ctx.restore();
  }
  function quad(ctx, L, lt, env, cfg) {
    const c = L.color ?? cfg.col, c2 = L.color2 ?? cfg.col2, g = gait(L, lt), a = g * 18 * D, legTop = cfg.cy + cfg.ry * 0.3;
    if (L.pose === 'sit') return sitting(ctx, L, lt, cfg, c, c2);
    qleg(ctx, cfg.bx + 10, legTop, -legTop, cfg.lw, -a, c, true); qleg(ctx, -cfg.bx + 10, legTop, -legTop, cfg.lw, a, c, true);
    ctx.save(); ctx.translate(-cfg.rx * 0.92, cfg.cy - cfg.ry * 0.3); TAILS[cfg.tail](ctx, c, lt); ctx.restore();
    O(ctx, 300, (k) => ell(k, 0, cfg.cy, cfg.rx, cfg.ry), c, (k) => { k.fillStyle = sh(c, -0.2); k.beginPath(); ell(k, 0, cfg.cy + cfg.ry * 0.9, cfg.rx * 1.1, cfg.ry * 0.5); k.fill(); if (cfg.head === 'canine') { k.fillStyle = c2; k.beginPath(); ell(k, cfg.rx * 0.8, cfg.cy + cfg.ry * 0.3, cfg.rx * 0.3, cfg.ry * 0.7); k.fill(); } });
    qleg(ctx, cfg.bx, legTop, -legTop, cfg.lw, a, c); qleg(ctx, -cfg.bx, legTop, -legTop, cfg.lw, -a, c);
    if (L.kind === 'elephant' && L.tower) {
      rider(ctx, { ...L, riderScale: (L.riderScale ?? 1) * 0.7 }, lt, env, -10, cfg.cy - cfg.ry - 20); // rider stands in the tower, box hides the legs
      O(ctx, 300, (k) => k.rect(-110, cfg.cy - cfg.ry - 110, 200, 120), '#8a5a2a', fillR('#6e4620', 30, -1000, 100, 1000));
      for (let i = 0; i < 4; i++) O(ctx, 300, (k) => k.rect(-110 + i * 56, cfg.cy - cfg.ry - 140, 32, 34), '#8a5a2a');
      O(ctx, 300, (k) => T.rrect(k, -150, cfg.cy - cfg.ry + 4, 280, 40, 10), L.saddle ?? '#b8202c');
    } else rider(ctx, L, lt, env, -10, cfg.cy - cfg.ry * 0.7);
    const [hx, hy] = cfg.hp;
    if (cfg.head !== 'elephant') O(ctx, 300, (k) => { k.moveTo(cfg.rx * 0.5, cfg.cy - cfg.ry * 0.6); k.quadraticCurveTo(hx - 30, hy + 10, hx - 20, hy - 20); k.lineTo(hx + 40, hy + 10); k.quadraticCurveTo(hx, cfg.cy, cfg.rx * 0.9, cfg.cy + cfg.ry * 0.3); k.closePath(); }, c);
    ctx.save(); ctx.translate(hx, hy); HEADS[cfg.head](ctx, L, c, c2, lt); ctx.restore();
  }
  function sitting(ctx, L, lt, cfg, c, c2) { // haunches: rear on the ground, front legs straight, body tilted up
    ctx.save(); ctx.translate(-cfg.rx * 0.6, -30); TAILS[cfg.tail](ctx, c, lt); ctx.restore();
    O(ctx, 300, (k) => ell(k, -30, -cfg.ry * 0.9, cfg.rx * 0.6, cfg.ry * 0.9), sh(c, -0.12));
    O(ctx, 300, (k) => ell(k, 30, -cfg.ry - cfg.rx * 0.55, cfg.ry * 1.05, cfg.rx * 0.75, -0.25), c, (k) => { k.fillStyle = c2; k.beginPath(); ell(k, 80, -cfg.ry - cfg.rx * 0.5, cfg.ry * 0.45, cfg.rx * 0.6, -0.25); k.fill(); });
    for (const x of [60, 100]) qleg(ctx, x, -cfg.ry - cfg.rx * 0.2, cfg.ry + cfg.rx * 0.2, cfg.lw, 0, c, x === 60);
    O(ctx, 300, (k) => ell(k, -50, -14, 60, 16), sh(c, -0.25));
    ctx.save(); ctx.translate(90, -cfg.ry - cfg.rx * 1.3); HEADS[cfg.head](ctx, L, c, c2, lt); ctx.restore();
  }
  function biped(ctx, L, lt, env, cfg, head, hscale = 0.85) {
    const c = L.color ?? cfg.col, c2 = L.color2 ?? cfg.col2, g = gait(L, lt, 0.56);
    for (const d of [-1, 1]) stick(ctx, 300, [[d * 40, -70], [d * 40 + d * g * 18, -8]], 42, sh(c, d < 0 ? -0.2 : 0));
    O(ctx, 300, (k) => { k.moveTo(-100, -40); k.quadraticCurveTo(-110, -230, -50, -250); k.lineTo(50, -250); k.quadraticCurveTo(110, -230, 100, -40); k.quadraticCurveTo(0, -20, -100, -40); k.closePath(); }, c, (k) => { k.fillStyle = c2; k.beginPath(); ell(k, 14, -130, 50, 80); k.fill(); k.fillStyle = sh(c); k.fillRect(-120, -260, 50, 260); });
    stick(ctx, 300, [[-60, -220], [-90, -150], [-80, -100]], 30, sh(c, -0.15));
    const hold = L.hold && T.PROPS[L.hold], hand = hold ? [110, -190] : [96, -110];
    stick(ctx, 300, [[60, -220], [100, -170], hand], 30, c);
    if (hold) { ctx.save(); ctx.translate(hand[0], hand[1] - 50); T.drawProp(ctx, L.hold, 150, lt, {}); ctx.restore(); }
    O(ctx, 300, (k) => k.arc(hand[0], hand[1], 18, 0, TAU), sh(c, -0.1));
    ctx.save(); ctx.translate(0, -330); ctx.scale(hscale, hscale); ctx.translate(-30, 0); head(ctx, L, c, c2, lt); ctx.restore();
  }
  // ---------- lean quadruped rig (wolf, dog, goat): one body silhouette with chest and rump masses, jointed legs
  // with real thickness (thigh / shoulder mass + tapered limb + paw or hoof), measured on creatures.js horse / bull.
  const LEAN = { // hip / shoulder pivots, joint chains relative to them, body depth
    wolf: { w: 40, foot: 'paw', ruff: true },
    dog: { w: 36, foot: 'paw' },
    goat: { w: 30, foot: 'hoof', beard: true, lean: true }, // lean: no thigh masses, legs tuck under the body
  };
  const rotAbout = ([px, py], a) => ([x, y]) => [px + (x - px) * Math.cos(a) - (y - py) * Math.sin(a), py + (x - px) * Math.sin(a) + (y - py) * Math.cos(a)];
  function limb(ctx, pts, w, col, foot) {
    stick(ctx, 300, pts, w, col);
    const [x, y] = pts[pts.length - 1];
    if (foot === 'hoof') O(ctx, 300, (k) => T.rrect(k, x - w * 0.62, y - 16, w * 1.24, 24, 6), '#3a2a20');
    else if (foot === 'paw') O(ctx, 300, (k) => ell(k, x + w * 0.4, y - w * 0.32, w * 0.85, w * 0.42), col, fillR(sh(col), x - w, y - w * 0.2, w * 3, w));
  }
  const HIND = [[-112, -200], [-86, -122], [-138, -70], [-120, -8]], FORE = [[108, -196], [112, -120], [110, -44], [116, -8]];
  function leanLegs(ctx, cfg, c, a, far, part = 'all') {
    const col = far ? sh(c, -0.22) : c, dx = far ? 22 : 0, sg = far ? -1 : 1;
    const hind = HIND.map(rotAbout(HIND[0], sg * a)).map(([x, y]) => [x + dx, y]), fore = FORE.map(rotAbout(FORE[0], -sg * a)).map(([x, y]) => [x + dx, y]);
    if (part !== 'mass') { limb(ctx, hind, cfg.w, col, cfg.foot); limb(ctx, fore, cfg.w * 0.92, col, cfg.foot); } // one stroke per leg
    if (part === 'legs' || cfg.lean) return;
    O(ctx, 300, (k) => ell(k, hind[0][0] - 4, hind[0][1] + 8, 60, 66, -0.3), col, fillR(sh(col), -300, hind[0][1] + 40, 600, 200)); // thigh
    O(ctx, 300, (k) => ell(k, fore[0][0], fore[0][1], 42, 54), col, fillR(sh(col), -300, fore[0][1] + 30, 600, 200)); // shoulder
  }
  const leanBody = (k) => { k.moveTo(-168, -212); k.quadraticCurveTo(-174, -268, -110, -270); k.quadraticCurveTo(0, -252, 92, -272); k.quadraticCurveTo(168, -272, 174, -204); k.quadraticCurveTo(172, -148, 112, -150); k.quadraticCurveTo(20, -138, -60, -158); k.quadraticCurveTo(-170, -160, -168, -212); k.closePath(); };
  function lean(ctx, L, lt, env, kind) {
    const q = QUAD[kind], cfg = LEAN[kind], c = L.color ?? q.col, c2 = L.color2 ?? q.col2, a = gait(L, lt) * 20 * D;
    if (L.pose === 'sit') return leanSit(ctx, L, lt, q, cfg, c, c2);
    leanLegs(ctx, cfg, c, a, true); leanLegs(ctx, cfg, c, a, false, 'legs');
    ctx.save(); ctx.translate(-160, -246); TAILS[q.tail](ctx, c, lt); ctx.restore();
    O(ctx, 300, leanBody, c, (k) => { k.fillStyle = sh(c); k.beginPath(); ell(k, 0, -146, 210, 34); k.fill(); k.fillStyle = c2; k.beginPath(); ell(k, 156, -196, 26, 44); k.fill(); });
    leanLegs(ctx, cfg, c, a, false, 'mass');
    leanHead(ctx, L, lt, q, cfg, c, c2, [92, -262], q.hp);
  }
  function leanHead(ctx, L, lt, q, cfg, c, c2, base, [hx, hy]) {
    O(ctx, 300, (k) => { k.moveTo(base[0] - 30, base[1]); k.quadraticCurveTo(hx - 50, hy - 20, hx - 20, hy - 34); k.lineTo(hx + 26, hy + 24); k.quadraticCurveTo(hx - 10, base[1] + 50, base[0] + 80, base[1] + 66); k.closePath(); }, c, (k) => { k.fillStyle = c2; k.beginPath(); ell(k, base[0] + 74, base[1] + 30, 30, 50, -0.5); k.fill(); });
    if (cfg.ruff) O(ctx, 300, (k) => { k.moveTo(hx - 70, hy + 10); for (let i = 0; i <= 6; i++) k.lineTo(hx - 70 + i * 16 + (i % 2 ? -6 : 0), hy + 30 + i * 22 + (i % 2 ? 22 : 0)); k.lineTo(hx + 10, hy + 40); k.closePath(); }, c2);
    ctx.save(); ctx.translate(hx, hy); ctx.scale(1.12, 1.12); HEADS[q.head](ctx, L, c, c2, lt);
    if (cfg.beard) O(ctx, 300, (k) => { k.moveTo(40, 40); k.lineTo(70, 42); k.lineTo(48, 92); k.closePath(); }, c2);
    ctx.restore();
  }
  function leanSit(ctx, L, lt, q, cfg, c, c2) { // haunch mass on the ground, upright chest, straight forelegs, tail curled on the floor
    const dark = sh(c, -0.22);
    ctx.save(); ctx.translate(-130, -40); ctx.rotate(0.6); TAILS[q.tail](ctx, c, lt); ctx.restore(); // lies along the floor
    limb(ctx, [[96, -170], [104, -10]], cfg.w * 0.85, dark, cfg.foot);
    O(ctx, 300, (k) => { k.moveTo(-150, -40); k.quadraticCurveTo(-160, -170, -60, -210); k.quadraticCurveTo(10, -330, 90, -330); k.quadraticCurveTo(160, -320, 150, -230); k.quadraticCurveTo(140, -150, 120, -60); k.quadraticCurveTo(100, -6, 0, -6); k.lineTo(-120, -6); k.quadraticCurveTo(-152, -10, -150, -40); k.closePath(); }, c, (k) => { k.fillStyle = c2; k.beginPath(); ell(k, 130, -230, 28, 70, -0.15); k.fill(); k.fillStyle = sh(c); k.fillRect(-200, -40, 400, 40); });
    O(ctx, 300, (k) => ell(k, -62, -92, 92, 84, -0.2), c, fillR(sh(c), -200, -60, 300, 80)); // haunch
    O(ctx, 300, (k) => ell(k, 6, -16, 52, 18), c, fillR(sh(c), -60, -12, 120, 30)); // hind paw in front of the haunch
    limb(ctx, [[120, -180], [126, -10]], cfg.w * 0.9, c, cfg.foot);
    leanHead(ctx, L, lt, q, cfg, c, c2, [110, -312], [150, -380]);
  }
  const C = {};
  for (const kind of Object.keys(QUAD)) C[kind] = (ctx, L, lt, env) => (L.pose === 'biped' ? biped(ctx, L, lt, env, QUAD[kind], HEADS[QUAD[kind].head], kind === 'elephant' ? 0.75 : 0.95) : LEAN[kind] ? lean(ctx, L, lt, env, kind) : quad(ctx, L, lt, env, QUAD[kind]));
  function longEars(ctx, L, c, inner, lt, h = 150) {
    for (const ex of [-20, 14]) { ctx.save(); ctx.translate(ex, -40); ctx.rotate(-0.25 + (ex > 0 ? twitch(L, lt) : 0)); O(ctx, 300, (k) => ell(k, 0, -h / 2, 22, h / 2), c, (k) => { k.fillStyle = inner; k.beginPath(); ell(k, 2, -h / 2, 10, h / 2 - 16); k.fill(); }); ctx.restore(); }
  }
  const rabbitHead = (ctx, L, c, c2, lt) => { longEars(ctx, L, c, '#f2a0b0', lt); O(ctx, 300, (k) => ell(k, 10, 0, 64, 52), c, fillR(sh(c), -60, 26, 140, 40)); ctx.fillStyle = '#f28aa0'; ctx.beginPath(); ctx.arc(70, 6, 9, 0, TAU); ctx.fill(); eye(ctx, 30, -12, 8, L, lt); if (talkOpen(L, lt)) O(ctx, 300, (k) => ell(k, 56, 32, 10, 8), '#7a2a2a'); };
  C.rabbit = (ctx, L, lt, env) => {
    const c = L.color ?? '#f6eef0', hop = inWin(L.walk, lt) ? -Math.abs(Math.sin((lt / 0.5) * PI)) * 60 : 0;
    if (L.pose === 'biped') return biped(ctx, L, lt, env, { col: c, col2: '#ffffff' }, rabbitHead, 0.9);
    ctx.translate(0, hop);
    O(ctx, 300, (k) => ell(k, -100, -60, 26, 24), '#ffffff');
    O(ctx, 300, (k) => ell(k, -20, -90, 110, 90), c, fillR(sh(c), -140, -40, 260, 60));
    O(ctx, 300, (k) => ell(k, -60, -26, 60, 26), sh(c, -0.08));
    for (const x of [60, 90]) O(ctx, 300, (k) => T.rrect(k, x - 14, -80, 28, 80, 14), c);
    ctx.save(); ctx.translate(90, -190); rabbitHead(ctx, L, c, '#ffffff', lt); ctx.restore();
  };
  C.kangaroo = (ctx, L, lt, env) => {
    const c = L.color ?? '#c9925a', c2 = L.color2 ?? '#e8c08a', hop = inWin(L.walk, lt) ? -Math.abs(Math.sin((lt / 0.5) * PI)) * 70 : 0;
    ctx.translate(0, hop);
    O(ctx, 300, (k) => { k.moveTo(-40, -110); k.quadraticCurveTo(-160, -40, -260, -6); k.lineTo(-250, 8); k.quadraticCurveTo(-120, -10, 0, -60); k.closePath(); }, c);
    O(ctx, 300, (k) => ell(k, 50, -12, 90, 20), sh(c, -0.15));
    O(ctx, 300, (k) => ell(k, -10, -100, 80, 100), c, fillR(sh(c), -100, -60, 200, 80));
    O(ctx, 300, (k) => ell(k, 40, -230, 70, 110, 0.2), c, (k) => { k.fillStyle = c2; k.beginPath(); ell(k, 66, -210, 36, 80, 0.2); k.fill(); });
    ctx.strokeStyle = P.ink; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(70, -180, 40, 0.2, PI - 0.6); ctx.stroke();
    const hold = L.hold && T.PROPS[L.hold];
    stick(ctx, 300, [[80, -280], [130, -240], [140, -210]], 22, c);
    if (hold) { ctx.save(); ctx.translate(140, -260); T.drawProp(ctx, L.hold, 140, lt, {}); ctx.restore(); }
    ctx.save(); ctx.translate(80, -360); ctx.rotate(0.15); longEars(ctx, L, c, '#a8704a', lt, 90);
    O(ctx, 300, (k) => { k.moveTo(-40, -20); k.quadraticCurveTo(0, -60, 50, -24); k.lineTo(110, 10); k.quadraticCurveTo(110, 34, 80, 34); k.quadraticCurveTo(-30, 50, -40, -20); k.closePath(); }, c);
    ctx.fillStyle = P.ink; ctx.beginPath(); ell(ctx, 104, 12, 8, 6); ctx.fill(); eye(ctx, 26, -14, 8, L, lt); ctx.restore();
  };
  C.turtle = (ctx, L, lt) => {
    const c = L.color ?? '#7a9a4a', shell = L.color2 ?? '#b89a5a', g = inWin(L.walk, lt) ? Math.sin((twos(lt) / 1.2) * TAU) : 0;
    for (const [x, d] of [[-110, 1], [90, -1], [-60, -1], [130, 1]]) O(ctx, 300, (k) => T.rrect(k, x - 22 + d * g * 14, -70, 44, 70, 18), x === -60 || x === 130 ? sh(c, -0.2) : c);
    const hb = Math.sin(lt * 1.2) * 6;
    O(ctx, 300, (k) => { k.moveTo(150, -80); k.quadraticCurveTo(200, -150 + hb, 250, -130 + hb); k.quadraticCurveTo(290, -100 + hb, 250, -80 + hb); k.quadraticCurveTo(200, -60, 150, -50); k.closePath(); }, c);
    eye(ctx, 252, -116 + hb, 7, L, lt);
    const r = T.rng(T.hash((L.id || 'turtle') + ':hex')), hexes = [...Array(7)].map((_, i) => [-120 + (i % 4) * 80 + (i > 3 ? 40 : 0), i > 3 ? -150 : -90, 30 + r() * 6]);
    O(ctx, 300, (k) => { k.moveTo(-200, -50); k.quadraticCurveTo(-190, -260, 0, -260); k.quadraticCurveTo(190, -260, 200, -50); k.closePath(); }, shell, (k) => { k.strokeStyle = sh(shell, -0.35); k.lineWidth = 6; for (const [x, y, rr] of hexes) { k.beginPath(); for (let i = 0; i <= 6; i++) k.lineTo(x + Math.cos((i * PI) / 3) * rr, y + Math.sin((i * PI) / 3) * rr); k.stroke(); } k.fillStyle = sh(shell); k.fillRect(-220, -90, 440, 60); });
    O(ctx, 300, (k) => T.rrect(k, -210, -60, 420, 22, 10), sh(shell, -0.3));
  };
  C.snail = (ctx, L, lt) => {
    const c = L.color ?? '#9aa0a6', shell = L.color2 ?? '#c98a4a', w = driven(L.walk, lt), k0 = (L.size ?? 300) / 400, pulse = inWin(L.walk, lt) ? 1 + (two(lt) % 2) * 0.04 : 1;
    if (w > 0) { ctx.fillStyle = 'rgba(200,230,240,0.6)'; ctx.fillRect(-170 - (w * 30) / k0, -12, (w * 30) / k0, 12); }
    ctx.save(); ctx.scale(pulse, 1);
    O(ctx, 300, (k) => { k.moveTo(-180, 0); k.quadraticCurveTo(-180, -40, -60, -40); k.lineTo(120, -40); k.quadraticCurveTo(150, -150, 190, -120); k.quadraticCurveTo(220, -60, 200, 0); k.closePath(); }, c, fillR(sh(c), -200, -16, 420, 30));
    for (const [x, y] of [[170, -230], [215, -205]]) { stick(ctx, 300, [[175, -110], [x, y]], 10, c); O(ctx, 300, (k) => k.arc(x, y, 16, 0, TAU), '#ffffff'); ctx.fillStyle = P.ink; ctx.beginPath(); ctx.arc(x + 4, y + 2, 7, 0, TAU); ctx.fill(); }
    if (inWin(L.talk, lt) && Math.floor(lt * 10) % 2 === 0) O(ctx, 300, (k) => ell(k, 205, -60, 12, 9), '#5a2a2a');
    ctx.restore();
    O(ctx, 300, (k) => k.arc(-30, -150, 125, 0, TAU), shell, (k) => { k.fillStyle = sh(shell); k.fillRect(-160, -110, 260, 110); k.strokeStyle = sh(shell, -0.4); k.lineWidth = 8; k.beginPath(); for (let a = 0; a < 4.2 * PI; a += 0.2) { const rr = 110 - a * 7.5; k.lineTo(-30 + Math.cos(a) * rr, -150 + Math.sin(a) * rr); } k.stroke(); });
    const hw = L.head && T.HEADWEAR && T.HEADWEAR[L.head];
    if (hw) { ctx.save(); ctx.translate(192, -255); ctx.scale(0.42, 0.42); ctx.translate(0, 560); hw(ctx, { headColor: L.headColor }, lt, 0.24, '3q'); ctx.restore(); }
  };

  // Shared wrapper: scale to `size`, idle bob 2 px at 0.6 Hz; registered into the v3 creature registry.
  for (const [kind, fn] of Object.entries(C)) {
    T.CREATURES[kind] = (ctx, L, lt, env) => { const k = (L.size ?? 300) / 400; ctx.scale(k, k); ctx.translate(0, (Math.sin(lt * 0.6 * TAU) * 2) / k); fn(ctx, L, lt, env); };
  }
})();
