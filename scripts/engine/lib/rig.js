// rig.js — bean character v2 body: bell robe with lean & folds, 2-bone arms (angles or IK targets) with glove hands,
// hold-and-snap posing with settle, idle rock around the feet, tremble, walk/run cycles on twos, lagging cape, costume
// (armor, pleats, trim, sash, belt, cape, shield in the off hand). Head comes from face.js. Layer type: 'bean'.
// Units: 600 tall, feet at (0,0). `size` = on-screen height in px.
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL, H = () => T.BEAN_HEAD;
  const SH = { x: 92, y: -292 }, L1 = 84, L2 = 80, ARM_W = 46;

  T.shade = (hex, k = -0.22) => {
    const n = parseInt(T.hex6(hex).slice(1), 16);
    const f = (c) => Math.round(T.clamp(k < 0 ? c * (1 + k) : c + (255 - c) * k, 0, 255));
    return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => f(c).toString(16).padStart(2, '0')).join('');
  };

  // Constant or timeline [{at, v}] → {cur, prev, p, at}
  T.timed = (val, lt, blend = 0.18) => {
    if (!Array.isArray(val)) return { cur: val, prev: val, p: 1, at: -1e9 };
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
  const A = (a, e, hand = 'open') => ({ a, e, hand });
  const TO = (x, y, hand = 'open') => ({ to: [x, y], hand });
  const POSES = {
    idle: [A(12, 8), A(12, 8)], point: [A(12, 8), A(96, 0, 'point')], 'point-up': [A(12, 8), A(160, 4, 'point')],
    'arms-up': [A(155, 12), A(155, 12)], shrug: [A(58, 92), A(58, 92)], facepalm: [A(12, 8), TO(28, -440)],
    think: [A(12, 8), TO(40, -338, 'fist')], wave: [A(12, 8), A(150, 28)], hold: [TO(70, -222, 'fist'), TO(70, -222, 'fist')],
    fist: [A(12, 8), A(162, -12, 'fist')], hips: [TO(122, -186, 'fist'), TO(122, -186, 'fist')],
    cross: [TO(-46, -244, 'fist'), TO(-30, -262, 'fist')], present: [A(12, 8), A(72, 18)],
    scared: [A(128, 44), A(128, 44)], 'hands-face': [TO(72, -398), TO(72, -398)], 'thumbs-up': [A(12, 8), A(58, 82, 'thumb')],
    'clutch-head': [TO(150, -540), TO(150, -540)], 'sword-up': [A(12, 8), A(165, 0, 'fist')], reach: [A(12, 8), A(85, -10)],
  };
  const FRONT = { facepalm: 1, think: 1, cross: 1, 'hands-face': 1, 'clutch-head': 1 };
  T.BEAN_POSES = Object.keys(POSES);

  function ik(sx, sy, tx, ty, outward) {
    const dx = tx - sx, dy = ty - sy, d = T.clamp(Math.hypot(dx, dy), 10, L1 + L2 - 1);
    const base = Math.atan2(dx, dy); // 0 = down, + toward +x
    const k = Math.acos(T.clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
    const a1 = base + k * outward;
    const ex = sx + Math.sin(a1) * L1, ey = sy + Math.cos(a1) * L1;
    const a2 = Math.atan2(tx - ex, ty - ey);
    return { ex, ey, hx: ex + Math.sin(a2) * L2, hy: ey + Math.cos(a2) * L2, dir: a2 };
  }

  // Resolve one arm (side = -1 left, +1 right) of a pose into joint positions.
  function solveArm(spec, side) {
    const sx = SH.x * side, sy = SH.y;
    if (spec.to) return { sx, sy, ...ik(sx, sy, spec.to[0] * side, spec.to[1], side), hand: spec.hand };
    const a1 = spec.a * T.DEG * side, a2 = a1 + spec.e * T.DEG * side;
    const ex = sx + Math.sin(a1) * L1, ey = sy + Math.cos(a1) * L1;
    return { sx, sy, ex, ey, hx: ex + Math.sin(a2) * L2, hy: ey + Math.cos(a2) * L2, dir: a2, hand: spec.hand };
  }
  // Blend two solved arms by angle, so bones keep their length mid-blend (linear point lerp would shrink the arm).
  const lerpArm = (a, b, p) => {
    if (p >= 1) return b;
    const ang = (j, x, y, px, py) => Math.atan2(x - px, y - py);
    const a1 = T.lerp(ang(a, a.ex, a.ey, a.sx, a.sy), ang(b, b.ex, b.ey, b.sx, b.sy), p);
    const ex = b.sx + Math.sin(a1) * L1, ey = b.sy + Math.cos(a1) * L1;
    const a2 = T.lerp(ang(a, a.hx, a.hy, a.ex, a.ey), ang(b, b.hx, b.hy, b.ex, b.ey), p);
    return { ...b, ex, ey, hx: ex + Math.sin(a2) * L2, hy: ey + Math.cos(a2) * L2, dir: a2, hand: p < 0.5 ? a.hand : b.hand };
  };

  // ---------- drawing parts ----------
  function hand(ctx, x, y, dir, kind, skin) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(-dir); // local +y = along forearm
    const finger = (fx, fy, len, ang) => { ctx.save(); ctx.translate(fx, fy); ctx.rotate(ang); T.outlined(ctx, (k) => T.rrect(k, -8, 0, 16, len, 8), skin, { line: 6 }); ctx.restore(); };
    if (kind === 'open') { [-0.5, -0.17, 0.17, 0.5].forEach((a, i) => finger(-15 + i * 10, 14, 30, a * 0.6)); finger(-22, 0, 22, 1.1); }
    if (kind === 'point') finger(4, 16, 44, 0);
    if (kind === 'thumb') finger(-6, -6, 30, Math.PI * 0.95);
    T.outlined(ctx, (k) => k.ellipse(0, 6, 27, 25, 0, 0, Math.PI * 2), skin, { line: 7 });
    if (kind !== 'open') { ctx.strokeStyle = P.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-12, 22); ctx.lineTo(-12, 12); ctx.moveTo(2, 25); ctx.lineTo(2, 14); ctx.stroke(); }
    ctx.restore();
  }

  function arm(ctx, j, sleeve, skin, hold, lt = 0, w = ARM_W) {
    const path = () => { ctx.beginPath(); ctx.moveTo(j.sx, j.sy); ctx.quadraticCurveTo(j.ex, j.ey, (j.ex + j.hx) / 2, (j.ey + j.hy) / 2); ctx.lineTo(j.hx, j.hy); };
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = P.ink; ctx.lineWidth = w + T.LINE * 2; path(); ctx.stroke();
    ctx.strokeStyle = sleeve; ctx.lineWidth = w; path(); ctx.stroke();
    ctx.strokeStyle = T.shade(sleeve, -0.18); ctx.lineWidth = w * 0.35; ctx.beginPath(); ctx.moveTo(j.sx - 8, j.sy + 10); ctx.quadraticCurveTo(j.ex - 8, j.ey, j.ex - 6, j.ey + 6); ctx.stroke();
    if (hold && T.drawProp) {
      ctx.save(); ctx.translate(j.hx, j.hy);
      if (hold === 'sword') ctx.rotate(Math.PI - j.dir); // blade follows the forearm
      else if (hold === 'spear' || hold === 'torch') { ctx.rotate(T.clamp(-Math.sin(j.dir) * 0.35, -0.35, 0.35)); ctx.translate(0, hold === 'spear' ? 160 : 40); } // shafts stay upright
      else ctx.translate(0, hold === 'shield' ? 0 : -60);
      T.drawProp(ctx, hold, hold === 'shield' ? 260 : hold === 'spear' ? 420 : 170, lt, {}); ctx.restore();
    }
    hand(ctx, j.hx, j.hy, j.dir, j.hand, skin);
  }

  function legs(ctx, c, gait) {
    for (const [i, x] of [[0, -46], [1, 46]]) {
      const off = gait ? gait.legs[i] : { dx: 0, dy: 0 };
      ctx.save(); ctx.translate(x + off.dx, off.dy);
      const legCol = c.legColor ?? c.skin;
      T.outlined(ctx, (k) => T.rrect(k, -25, -88, 50, 88, 20), legCol, { shade: (k) => {
        k.fillStyle = c.legColor ? T.shade(legCol, -0.2) : c.skinShade ?? '#c4c1cd'; k.fillRect(-25, -88, 16, 88);
        if (c.puttees) { k.strokeStyle = typeof c.puttees === 'string' ? c.puttees : T.shade(legCol, -0.3); k.lineWidth = 6; for (let y = -70; y < -10; y += 14) { k.beginPath(); k.moveTo(-26, y + 8); k.lineTo(26, y - 4); k.stroke(); } }
      } });
      if (c.shoes) T.outlined(ctx, (k) => { k.moveTo(-28, -2); k.lineTo(-28, -30); k.lineTo(14, -30); k.quadraticCurveTo(40, -24, 40, -2); k.closePath(); }, c.shoes, { line: 6 });
      else {
        ctx.strokeStyle = c.sandal ?? '#6b4423'; ctx.lineWidth = 9;
        ctx.beginPath(); ctx.moveTo(-22, -18); ctx.lineTo(22, -30); ctx.moveTo(-22, -42); ctx.lineTo(22, -54); ctx.stroke();
        T.outlined(ctx, (k) => T.rrect(k, -32, -13, 66, 15, 7), c.sandal ?? '#6b4423', { line: 6 });
      }
      ctx.restore();
    }
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

  function body(ctx, c, view) {
    const robe = c.robe ?? P.red, back = view === 'front' ? 1 : -1;
    const path = (k) => { k.moveTo(-100, -326); k.quadraticCurveTo(0, -342, 100, -326); k.quadraticCurveTo(130, -210, 148, -70); k.quadraticCurveTo(0, -48, -148, -70); k.quadraticCurveTo(-130, -210, -100, -326); k.closePath(); };
    T.outlined(ctx, path, robe, {
      shade: (k) => {
        k.fillStyle = c.robeShade ?? T.shade(robe, -0.24);
        k.beginPath(); k.ellipse(back * 160, -190, 95, 210, 0, 0, Math.PI * 2); k.fill();
        k.fillRect(-160, -112, 320, 50);
        if (c.pleats) { k.strokeStyle = T.shade(robe, -0.32); k.lineWidth = 5; for (let x = -120; x <= 120; x += 30) { k.beginPath(); k.moveTo(x * 0.92, -150); k.lineTo(x, -60); k.stroke(); } }
        if (c.folds !== false) { k.strokeStyle = T.shade(robe, -0.3); k.lineWidth = 5; k.beginPath(); k.moveTo(-40, -250); k.quadraticCurveTo(-55, -170, -70, -90); k.moveTo(50, -230); k.quadraticCurveTo(62, -160, 80, -95); k.stroke(); }
        if (c.trim) { k.fillStyle = c.trim; k.fillRect(-160, -96, 320, 30); }
        if (c.sash) { k.fillStyle = c.sash; k.beginPath(); k.moveTo(-100, -336); k.lineTo(-36, -336); k.lineTo(152, -126); k.lineTo(152, -64); k.closePath(); k.fill(); k.strokeStyle = T.shade(c.sash, -0.22); k.lineWidth = 5; k.stroke(); }
      },
    });
    if (c.outfit && T.OUTFITS && T.OUTFITS[c.outfit]) T.OUTFITS[c.outfit](ctx, c, view);
    if (T.drawOutfitExtras) T.drawOutfitExtras(ctx, c, view);
    if (c.belt && c.outfit !== 'tunic' && c.outfit !== 'surcoat') { ctx.strokeStyle = c.belt; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(-124, -186); ctx.quadraticCurveTo(0, -174, 124, -186); ctx.stroke(); }
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

  T.layers.bean = (ctx, Ly, lt, env) => {
    const own = { ...(env.cast[Ly.who] || {}), ...(Ly.look || {}) };
    // outfit defaults (e.g. suit = dark trousers + shoes) sit between the base look and the cast's own values
    const c = { skin: P.skin, robe: P.red, hair: 'short', ...((T.OUTFIT_DEFAULTS || {})[own.outfit] || {}), ...own };
    const seed = (Ly.who || 'bean') + (Ly.id || '') + (Ly.x ?? '');
    const view = Ly.view ?? c.view ?? '3q';
    const k = (Ly.size ?? 420) / 600;
    const phase = (T.hash(seed) % 100) / 16;
    const gait = gaitState(Ly, lt);
    const talking = inWin(Ly.talk, lt);

    // hold-and-snap: poses swap in ~2 frames, then the body settles with a small squash (reference: 1-frame swaps + settle)
    const blend = Ly.poseBlend ?? 0.07;
    const pt = T.timed(Ly.pose ?? 'idle', lt, blend);
    const since = lt - pt.at;
    const settle = since >= 0 && since < 0.2 && pt.at > -1e8 ? Math.sin((since / 0.2) * Math.PI) * 0.045 * (1 - since / 0.2) : 0;
    const cur = POSES[pt.cur] || POSES.idle, prev = POSES[pt.prev] || POSES.idle;
    let specs = gait && !Ly.keepArms ? gait.arms : null;
    const arms = [-1, 1].map((side, i) => {
      const sp = specs ? specs[i] : null;
      if (sp) return solveArm(sp, side);
      return lerpArm(solveArm(prev[i], side), solveArm(cur[i], side), pt.p);
    });
    if (pt.cur === 'wave') arms[1] = solveArm(A(150, 28 + Math.sin(twos(lt) * 14) * 26), 1);

    // wind for the cape: layer velocity (shot time) + running
    let wind = gait?.run ? 1 : gait ? 0.4 : 0;
    if (env.st && Ly.move) {
      const prevSt = T.layerState(Ly, env.lt - 0.1);
      if (prevSt) wind += T.clamp((env.st.x - prevSt.x) / 0.1 / 700, -1, 1) * (env.st.flip || 1);
    }

    ctx.scale(k, k);
    // idle rock around the feet, tremble on twos, gait bob/lean, settle squash
    const rock = (Ly.rock ?? 1.6) * Math.sin(lt * Math.PI * 2 / 1.7 + phase);
    ctx.rotate((rock + (gait ? gait.lean : 0) + (Ly.lean ?? 0)) * T.DEG);
    if (inWin(Ly.tremble, lt)) { const r = T.rng(T.hash(seed + Math.floor(lt * 15))); ctx.translate((r() - 0.5) * 12, (r() - 0.5) * 8); }
    if (gait) ctx.translate(0, gait.bob);
    ctx.scale(1 + settle * 0.6, (1 - settle) * (1 + Math.sin(lt * Math.PI * 2 * 0.55 + phase) * 0.012));

    const front = FRONT[pt.cur] && !gait;
    if (Ly.legs !== false) legs(ctx, c, gait); // riders hide their legs
    cape(ctx, c, lt, seed, wind);
    const sleeve = c.sleeve ?? c.robe;
    // back arm (character's left, screen-left in 3/4) goes behind the body unless the pose brings it to the face
    if (view !== 'front' && !front) arm(ctx, arms[0], sleeve, c.skin, Ly.holdL || c.holdL, lt, c.sleeveW ?? ARM_W);
    if (view === 'back') arm(ctx, arms[1], sleeve, c.skin, Ly.hold || c.hold, lt, c.sleeveW ?? ARM_W);
    body(ctx, c, view);
    const drawFrontArms = () => {
      if (view === 'front' || front) arm(ctx, arms[0], sleeve, c.skin, Ly.holdL || c.holdL, lt, c.sleeveW ?? ARM_W);
      if (view !== 'back') arm(ctx, arms[1], sleeve, c.skin, Ly.hold || c.hold, lt, c.sleeveW ?? ARM_W);
    };
    if (!front) drawFrontArms();

    ctx.save();
    const tilt = -rock * 1.6 + (talking ? Math.sin(lt * 9) * 1.6 : 0) + (Ly.headTilt ?? 0);
    ctx.translate(0, -300); ctx.rotate(tilt * T.DEG); ctx.translate(0, 300);
    const expr = T.timed(Ly.expr ?? 'neutral', lt).cur;
    const blinkPhase = (lt + (T.hash(seed) % 300) / 100) % (2.8 + (T.hash(seed) % 17) / 10);
    H().draw(ctx, c, {
      view, expr, lt, seed,
      blink: Ly.blink !== false && blinkPhase < 0.09,
      gazeX: Ly.gaze ?? 0,
      mouthKind: talking ? H().talkMouth(expr, lt, seed) : null,
    });
    ctx.restore();
    if (front) drawFrontArms();
  };
})();
