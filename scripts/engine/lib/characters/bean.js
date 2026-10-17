// bean.js — the `bean` layer: assembles rig.js parts (T.RIG) with the Characters 2.0 motion: turnarounds (turn.js),
// gait cycles (gait.js), acting, squash & stretch, reach and springs (motion.js), close-up faces (closeup.js) and
// lip-sync (lipsync.js). Without acting (classic look, no acting field) and without the new fields the drawing is the
// classic one, call for call. Tests read the solved rig through T.RIG_PROBE = {} (layer id -> state).
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL, R = () => T.RIG, H = () => T.BEAN_HEAD;
  T.RIG_PROBE = null;
  T.CHAR_SWAY = null; // secondary motion of the bean being drawn ({x, y} units) for hair / headwear / outfit modules
  T.swayX = (k = 1) => (T.CHAR_SWAY ? T.CHAR_SWAY.x * k : 0);

  // Arm targets from `reach` in the current (arm) frame: replaces the solved pose arms with IK arms.
  // A target above the shoulder and out of reach lengthens the arm up to REACH_UP x (straight up; the armScale of
  // hold-high), so a raised hand clears the big head; `stretch: true` reaches any distance, `stretch: false` never extends.
  const REACH_UP = 1.9;
  function applyReach(ctx, Ly, lt, env, base, dyE, arms, G, act) {
    const r = T.reachOf(Ly, lt);
    if (!r) return arms;
    if (!r.cur && !r.prev) return arms;
    const dur = (r.cur && r.cur.dur) ?? (r.prev && r.prev.dur) ?? 0.35;
    const p = r.since > 1e8 ? 1 : act && act.overshoot ? T.poseSpring(r.since, dur * 0.25) : T.ease.inOut(T.prog(r.since, 0, dur));
    const armsOf = (e) => (!e ? [] : e.arm === 'left' ? [0] : e.arm === 'both' ? [0, 1] : [1]);
    const inPrev = armsOf(r.prev), inCur = armsOf(r.cur), out = arms.slice();
    // Each arm travels from where it was (the previous target, or its pose wrist) to where it goes (the new target, or
    // back to the pose): switching arms releases the old one and lifts the new one, nothing snaps.
    [0, 1].forEach((i) => {
      const was = inPrev.includes(i), will = inCur.includes(i);
      if (!was && !will) return;
      if (!will && r.since >= dur * 2.5) return; // released: back on the pose
      const side = i ? 1 : -1;
      const at = (e, list) => {
        if (!e || !list.includes(i)) return [arms[i].hx, arms[i].hy];
        const q = T.reachPoint(ctx, e, env, base, dyE), off = list.length > 1 ? side * 26 : 0;
        return q ? [q[0] + off, q[1]] : [arms[i].hx, arms[i].hy];
      };
      const a = at(r.prev, inPrev), b = at(r.cur, inCur), ref = will ? r.cur : r.prev;
      const [tx, ty] = T.arcPoint(a, b, p, ref.arc ?? 0.25);
      let l1 = G.l1, l2 = G.l2;
      const d = Math.hypot(tx - G.sx * side, ty - G.sy), full = (l1 + l2) * 0.98;
      if (ref.stretch && d > full) { const s = d / full; l1 *= s; l2 *= s; } // rubber-hose reach
      else if (ref.stretch !== false && d > full && ty < G.sy) { // high target: the arm extends like the hands-up poses
        const s = Math.min(d / full, 1 + (REACH_UP - 1) * T.clamp((G.sy - ty) / d, 0, 1)); // more the steeper it points
        l1 *= s; l2 *= s;
      }
      const j = R().ik(G.sx * side, G.sy, tx, ty, side, l1, l2);
      const hand = will ? r.cur.hand || (r.cur.target ? 'grab' : arms[i].hand) : p < 0.5 ? r.prev.hand || (r.prev.target ? 'grab' : arms[i].hand) : arms[i].hand;
      out[i] = { sx: G.sx * side, sy: G.sy, ...j, hand };
    });
    return out;
  }

  // Held prop sizes (rig units) used with acting; classic keeps 170 for everything but shields and spears.
  T.HOLD_SIZE = { coin: 80, bulb: 100, heart: 100, question: 110, exclaim: 110, bread: 110, scroll: 120, book: 120,
    skull: 120, hourglass: 120, moneybag: 140 };
  const over = (m) => !!(T.LEG_MODES[m] && T.LEG_MODES[m].over); // leg modes drawn over the robe (sit, tuck)

  T.layers.bean = (ctx, Ly, lt, env) => {
    const RG = R(), own = { ...(env.cast[Ly.who] || {}), ...(Ly.look || {}) };
    // outfit defaults (e.g. suit = dark trousers + shoes) sit between the base look and the cast's own values
    let c = { skin: P.skin, robe: P.red, hair: 'short', ...((T.OUTFIT_DEFAULTS || {})[own.outfit] || {}), ...own };
    const B = T.beanBuild(c), G = RG.geomOf(B);
    if (!B.def) {
      c = { ...c };
      if (B.noBeard) { c.beard = null; c.mustache = null; }
      if (B.hairColor && own.hairColor == null) c.hairColor = B.hairColor;
      if (B.eyeScale && c.eyeScale == null) c.eyeScale = B.eyeScale;
    }
    const seed = (Ly.who || 'bean') + (Ly.id || '') + (Ly.x ?? '');
    const k = (Ly.size ?? 420) / 600;
    const phase = (T.hash(seed) % 100) / 16;
    const act = T.actingOf(Ly);
    const shotT = env.lt ?? lt + (Ly.at ?? 0);
    const probe = T.RIG_PROBE && Ly.id ? {} : null;
    const base = (Ly.reach || probe) && env.st ? T.worldBase(ctx, env.st) : null;

    // gait: the new cycles for sneak / march / path gaits and, with acting, for walk / run; else the classic cycle
    const gKind = T.gaitKind(Ly, lt);
    const gait2 = gKind && (act || gKind === 'sneak' || gKind === 'march' || T.travelPath(Ly)) ? T.gaitCycle(Ly, lt, env, B, k) : null;
    const gait = gait2 ? null : RG.gaitState(Ly, lt);
    const moving = gait || gait2;
    const lipOn = !!(Ly.lipsync && T.lipRank);
    const lipRank = lipOn ? T.lipRank(Ly, lt, env) : 0;
    const talking = lipOn ? lipRank > 0 : RG.inWin(Ly.talk, lt);

    // hold-and-snap: poses swap in ~2 frames, then the body settles with a small squash (reference: 1-frame swaps + settle).
    // Acting: a spring overshoot replaces the settle and big changes anticipate.
    const blend = Ly.poseBlend ?? 0.07;
    const pt = T.timed(Ly.pose ?? 'idle', lt, blend);
    const since = lt - pt.at;
    const pp = act && act.overshoot && pt.at > -1e8 ? T.poseSpring(since, blend) : pt.p;
    const settle = !act && since >= 0 && since < 0.2 && pt.at > -1e8 ? Math.sin((since / 0.2) * Math.PI) * 0.045 * (1 - since / 0.2) : 0;
    const cur = RG.poseOf(pt.cur), prev = RG.poseOf(pt.prev);
    const bs = RG.bodyState(prev, cur, pp);
    const an = RG.anticState(Ly, lt, pt, blend);
    const ts = T.turnState(Ly, lt, bs.view ?? c.view ?? '3q');
    const ft = (act ? act.turn : T.travelPath(Ly)) ? T.flipTurn(Ly, env, ts.view) : null;
    // 3q-back (back3q.js): body, outfit, hair and headwear draw as in the back view, the arms as in 3/4, the head turns
    const shownView = ft ? ft.view : ts.view, qb = shownView === '3q-back';
    const view = qb ? 'back' : shownView, armView = qb ? '3q' : view;
    const specs = moving && !Ly.keepArms ? (gait2 || gait).arms : null;
    const reachS = (g, m) => (m === 1 ? g : { ...g, l1: g.l1 * m, l2: g.l2 * m }); // armScale: stretchy reach
    const gPrev = reachS(G, prev.body.armScale), gCur = reachS(G, cur.body.armScale), gMix = reachS(G, bs.armScale);
    const solvePair = (pose, g) => [-1, 1].map((side, i) => RG.solveArm(pose.arms[i], side, g));
    let arms;
    if (specs) arms = [-1, 1].map((side, i) => RG.solveArm(specs[i], side, G));
    else if (act) { const a0 = solvePair(prev, gPrev), a1 = solvePair(cur, gCur); arms = a0.map((a, i) => (pp === 1 ? a1[i] : T.blendArm(a, a1[i], pp, gMix.l1, gMix.l2))); }
    else arms = [-1, 1].map((side, i) => RG.lerpArm(RG.solveArm(prev.arms[i], side, gPrev), RG.solveArm(cur.arms[i], side, gCur), pt.p, gMix));
    if (pt.cur === 'wave') arms[1] = RG.solveArm(RG.A(150, 28 + Math.sin(RG.twos(lt) * 14) * 26), 1, G);
    if (an.arm) arms = arms.map((j, i) => RG.swingArm(j, an.arm, i ? 1 : -1));
    // automatic anticipation: a big upcoming change swings the arms against their coming motion and dips the body
    let antic = 0;
    if (act && act.antic && !Ly.antic && !moving) {
      const nx = T.anticOf(Ly, lt, pt.cur);
      if (nx) {
        const np = RG.poseOf(nx.next), na = solvePair(np, reachS(G, np.body.armScale));
        const bodyDiff = np.body.legs !== cur.body.legs || Math.abs(np.body.dy - cur.body.dy) > 8 || Math.abs(np.body.rot - cur.body.rot) > 8;
        if (bodyDiff || T.armTravel(arms, na) > T.BIG_POSE) {
          antic = nx.amount;
          arms = arms.map((j, i) => {
            const sh = (q) => Math.atan2(q.ex - q.sx, q.ey - q.sy), side = i ? 1 : -1;
            let d = (sh(na[i]) - sh(j)) / T.DEG; while (d > 180) d -= 360; while (d < -180) d += 360;
            return RG.swingArm(j, T.clamp(-d * 0.16, -20, 20) * antic * side, side);
          });
        }
      }
    }
    const handOf = (v) => (v == null ? null : T.timed(v, lt).cur);
    const hR = handOf(Ly.hand), hL = handOf(Ly.handL);
    if (hR) arms[1] = { ...arms[1], hand: hR };
    if (hL) arms[0] = { ...arms[0], hand: hL };

    // wind for the cape: layer velocity (shot time) + running; acting adds the spring secondary motion
    let wind = gait?.run || gait2?.run ? 1 : moving ? 0.4 : 0;
    if (env.st && Ly.move && !act) {
      const prevSt = T.layerState(Ly, env.lt - 0.1);
      if (prevSt) wind += T.clamp((env.st.x - prevSt.x) / 0.1 / 700, -1, 1) * (env.st.flip || 1);
    }
    let sway = null;
    if (act && (Ly.secondary ?? 1) > 0) {
      sway = env.st ? T.springLag(Ly, shotT, { size: Ly.size ?? 420, scale: Ly.secondary ?? 1 }) : { x: 0, y: 0 };
      if (ts.changeAt != null && lt - ts.changeAt < 0.8) { const s = lt - ts.changeAt; sway = { ...sway, x: sway.x - ts.dir * 34 * Math.exp(-5 * s) * Math.sin(Math.PI * 2 * 1.6 * s + 0.6) }; }
      if (gait2) sway = { ...sway, x: sway.x - (gait2.run ? 26 : 10) + Math.sin(gait2.phase * Math.PI * 4) * 4 };
      wind -= sway.x / 150;
    }

    // leg mode and upper-body drop
    let legMode = moving ? (gait2 ? 'gait' : 'stand') : bs.legs;
    if (B.legs) legMode = B.legs;
    if (Ly.legs === false) legMode = 'none'; // riders hide their legs
    const rot = moving ? 0 : bs.rot * T.DEG;
    const geom = legMode === 'gait' ? gait2.legs : legMode === 'stand' ? null : RG.legGeom(legMode, B, rot);
    const sq = act && act.squash ? T.bodySquash(Ly, lt, shotT) : { sx: 1, sy: 1, lean: 0 };
    const life = act && !moving ? T.idleLife(lt, seed, act) : { breath: 0, lean: 0, hipX: 0 };
    const dyE = (gait2 ? gait2.dy : gait ? 0 : bs.dy) * (gait2 ? 1 : B.legH) + an.dy + antic * 10;

    ctx.scale(k, k);
    if (ts.facing < 0) ctx.scale(-1, 1); // facing left: the rig mirrors itself (on top of any layer flip)
    if (rot) { const f = RG.rotFit(RG.hullPoints(B, dyE, geom, legMode === 'stand'), rot, bs.pivot); ctx.translate(f.x, f.y); ctx.rotate(rot); }
    // idle rock around the feet, tremble on twos, gait bob/lean, settle squash
    const rock = (Ly.rock ?? 1.6) * Math.sin(lt * Math.PI * 2 / 1.7 + phase);
    const extraLean = (moving ? 0 : bs.lean) + B.lean + an.tilt + sq.lean + life.lean;
    ctx.rotate((rock + (moving ? (gait2 || gait).lean : 0) + (Ly.lean ?? 0) + extraLean) * T.DEG);
    if (RG.inWin(Ly.tremble, lt)) { const r = T.rng(T.hash(seed + Math.floor(lt * 15))); ctx.translate((r() - 0.5) * 12, (r() - 0.5) * 8); }
    if (gait) ctx.translate(0, gait.bob);
    const tsx = ft ? ft.sx : ts.sx, tsy = ft ? ft.sy : ts.sy, anticSy = 1 - antic * 0.05;
    ctx.scale((1 + settle * 0.6) * sq.sx * tsx, (1 - settle) * (1 + Math.sin(lt * Math.PI * 2 * 0.55 + phase) * 0.012) * an.sy * sq.sy * tsy * anticSy);

    const front = cur.front && !moving;
    const torso = (fn) => { if (B.def) return fn(); ctx.save(); ctx.translate(0, B.offY); ctx.scale(B.bodyW, B.bodyH); fn(); ctx.restore(); };
    const hooks = (list) => (list || []).forEach((fn) => fn(ctx, c, view, lt, Ly, B));
    const prevSway = T.CHAR_SWAY;
    T.CHAR_SWAY = sway;
    try {
      if (T.BEAN_UNDER.length) { ctx.save(); if (dyE) ctx.translate(0, dyE); torso(() => hooks(T.BEAN_UNDER)); ctx.restore(); }
      if (legMode === 'stand') {
        if (B.def) RG.legs(ctx, c, gait);
        else if (B.legH > 0) { ctx.save(); ctx.scale(B.legW, B.legH); RG.legs(ctx, c, gait); ctx.restore(); }
      } else if (geom && (legMode === 'gait' || !over(legMode))) RG.drawLegMode(ctx, c, geom, B);

      ctx.save();
      if (dyE) ctx.translate(0, dyE);
      if (life.hipX) ctx.translate(life.hipX, 0);
      torso(() => RG.cape(ctx, c, lt, seed, wind));
      if (Ly.reach) arms = applyReach(ctx, Ly, lt, env, base, dyE, arms, G, act);
      const breathY = -2.5 * life.breath; // breathing lifts the shoulders and the head

      if (breathY) arms = arms.map((j) => ({ ...j, sy: j.sy + breathY, ey: j.ey + breathY * 0.6 }));
      const sleeve = c.sleeve ?? c.robe;
      const armW = (c.sleeveW ?? RG.ARM_W) * B.armW;
      const noArms = c.arms === false || (c.age === 'baby' && c.arms !== true); // swaddled babies hide their arms
      const holdOf = (i) => (i ? Ly.hold || c.hold : Ly.holdL || c.holdL);
      // held prop size: holdScale x the classic size, else with acting a size that suits the prop (a coin is not a shield)
      const holdSz = (i) => {
        const h = holdOf(i), k = Ly.holdScale ?? c.holdScale, base = h === 'shield' ? 260 : h === 'spear' ? 420 : 170;
        return k != null ? base * k : act ? T.HOLD_SIZE[h] ?? null : null;
      };
      const holdRot = T.num(Ly.holdRot ?? c.holdRot ?? 0, lt) || 0; // tilt of held props in the grip, degrees
      const drawArm = (i) => noArms ? null : RG.arm(ctx, arms[i], sleeve, c.skin, holdOf(i), lt, armW, B.hand, holdSz(i), holdRot, Ly.holdProps ?? c.holdProps ?? null);
      // acting: a near arm raised above the shoulders is drawn over the head, so arms-up / point-up stay visible
      // (front view: an arm whose hand ends over the head's width would cross the face, so it stays behind the head)
      const overFace = (i) => armView === 'front' && Math.abs(arms[i].hx) < 110 * B.head;
      const raised = (i) => !!act && !front && armView !== 'back' && arms[i].hy < B.neckY - 40 && !overFace(i);
      const late = [];
      // back arm (character's left, screen-left in 3/4) goes behind the body unless the pose brings it to the face
      if (armView !== 'front' && !front) drawArm(0);
      if (armView === 'back') drawArm(1);
      torso(() => { RG.body(ctx, c, view, sway ? sway.x * 0.6 : 0, seed); hooks(T.BEAN_EXTRAS); });
      if (geom && legMode !== 'gait' && over(legMode)) { ctx.save(); if (dyE) ctx.translate(0, -dyE); RG.drawLegMode(ctx, c, geom, B); ctx.restore(); }
      const drawFrontArms = () => {
        const one = (i) => (raised(i) ? late.push(i) : drawArm(i));
        if (armView === 'front' || front) one(0);
        if (armView !== 'back') one(1);
      };
      if (!front) drawFrontArms();

      if (T.PAINT) T.contactShadow(ctx, B.headFwd * 300, B.neckY + 24, 120 * B.bodyW, 30, 0.38); // painted: the head's shadow on the torso
      ctx.save();
      const talkBob = lipOn ? lipRank * 0.7 : talking ? Math.sin(lt * 9) * 1.6 : 0;
      const tilt = -rock * 1.6 + talkBob + (Ly.headTilt ?? 0) + (gait2 ? gait2.nod : 0);
      ctx.translate(B.headFwd * 300, B.neckY + breathY * 1.4); ctx.rotate(tilt * T.DEG);
      if (B.head !== 1) ctx.scale(B.head, B.head);
      ctx.translate(0, 300);
      const expr = T.timed(Ly.expr ?? 'neutral', lt).cur;
      const blinkPhase = (lt + (T.hash(seed) % 300) / 100) % (2.8 + (T.hash(seed) % 17) / 10);
      const blinkNow = Ly.blink !== false && (blinkPhase < 0.09 || (!!Ly.blinkAt && T.forcedBlink(Ly, lt))); // director blinks (director.js)
      const detail = T.closeupWanted(ctx, Ly.detail);
      let smear = Ly.smear;
      if (ts.inBetween && ts.changeAt != null && !(Ly.turn && Ly.turn.smear === false)) smear = [...(smear ? (Array.isArray(smear) ? smear : [smear]) : []), { at: ts.changeAt, dur: 0.23, dir: 1, strength: 0.7 }];
      const mouthKind = lipOn ? T.LIP_SHAPES[lipRank] : talking ? H().talkMouth(expr, lt, seed) : null;
      H().draw(ctx, c, {
        view, expr, lt, seed,
        blink: blinkNow,
        gazeX: Ly.gaze ?? 0, smear,
        mouthKind, detail, mood: detail ? T.closeupMood(expr, T.EXPR[expr]) : null, sway,
      });
      if (qb && T.headBack3q) T.headBack3q(ctx, c);
      ctx.restore();
      if (front) drawFrontArms();
      late.forEach(drawArm);
      if (probe) record(probe, ctx, base, arms, { view: shownView, facing: ts.facing, inBetween: !!(ts.inBetween || ft), sx: sq.sx * tsx, sy: sq.sy * tsy * anticSy,
        antic, overshoot: act && pt.at > -1e8 && since < 0.6 ? pp - 1 : 0, gait: gait2 ? gait2.kind : gait ? (gait.run ? 'run' : 'walk') : null,
        feet: geom && legMode === 'gait' ? geom.map((L) => L.ft.map((v) => Math.round(v))) : gait ? gait.legs.map((l) => [Math.round(l.dx), Math.round(l.dy)]) : null,
        detail, mouth: mouthKind, sway, tilt: Ly.headTilt ?? 0, gaze: Ly.gaze ?? 0, blink: blinkNow });
      ctx.restore();
    } finally { T.CHAR_SWAY = prevSway; }
    if (probe) T.RIG_PROBE[Ly.id] = probe;
  };

  // Probe: solved state plus the wrists in world coordinates (layer base transform undone).
  function record(probe, ctx, base, arms, o) {
    Object.assign(probe, o);
    if (!base) return;
    const inv = base.inverse(), m = ctx.getTransform();
    probe.hands = arms.map((j) => { const d = m.transformPoint(new DOMPoint(j.hx, j.hy)), w = inv.transformPoint(d); return [w.x, w.y]; });
  }
})();
