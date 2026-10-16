// quad-rig.js — the v2 quadruped rig shared by horse, cow, bull, sheep, pig, camel, elephant, dog, cat, wolf, bear
// and rat. A species is a config (body outline, hip / shoulder pivots, 3-bone legs, neck, head drawer, tail, extras);
// CK.quad(cfg) returns the creature draw function. Legs: 2-bone IK from hip / shoulder to the ankle plus a pastern
// that folds in the swing, feet on the gait tables of creature-kit.js (planted while in stance). Body: gait bob and
// pitch, breathing, states idle / walk / trot / gallop / eat / sleep / scared / sit blended over 0.3 s. Secondary
// motion: tail and mane chains lag behind and stream with speed; ears flick, eyes blink on seeded schedules.
(function () {
  'use strict';
  const T = window.TOON, CK = T.CK, P = T.PAL, TAU = Math.PI * 2, D = T.DEG;
  const sh = CK.sh;
  const LEG_NAMES = ['nearHind', 'farHind', 'nearFore', 'farFore'];

  // Body transform: lift dy, pitch about pivot, x stretch about pivot (gallop spine flex).
  const bodyX = (B) => ([x, y]) => {
    const dx = (x - B.px) * B.sx, dy = y - B.py, c = Math.cos(B.pitch), s = Math.sin(B.pitch);
    return [B.px + dx * c - dy * s, B.py + dx * s + dy * c + B.dy];
  };
  const applyBody = (ctx, B) => { ctx.translate(B.px, B.py + B.dy); ctx.rotate(B.pitch); ctx.scale(B.sx, B.sy); ctx.translate(-B.px, -B.py); };

  function footTarget(cfg, mo, i, restX, F) {
    const g = T.GAIT;
    const one = (gait, ph, cyc) => { const f = g.foot(gait, i, ph); return { x: f.x * cyc, y: -f.y * cyc, flex: f.flex }; };
    let f = mo.amp > 0 ? one(mo.gait, mo.phase, mo.cyc) : { x: 0, y: 0, flex: 0 };
    if (mo.g2 && mo.bw > 0) { const f2 = one(mo.g2, mo.phase2, mo.cyc2); f = { x: T.lerp(f.x, f2.x, mo.bw), y: T.lerp(f.y, f2.y, mo.bw), flex: T.lerp(f.flex, f2.flex, mo.bw) }; }
    const a = mo.amp;
    let x = restX + f.x * a, y = f.y * a, flex = f.flex * a;
    const hind = i < 2;
    if (F.sleep > 0) { x = T.lerp(x, restX + (hind ? cfg.tuck[0] : cfg.tuck[1]), F.sleep); y *= 1 - F.sleep; flex = T.lerp(flex, 1, F.sleep); }
    if (F.sit > 0 && hind) { x = T.lerp(x, restX + cfg.sitFoot, F.sit); flex = T.lerp(flex, 0.6, F.sit); }
    if (F.scared > 0 && !hind) x += F.scared * cfg.legLen * 0.25;
    if (F.idleShift && a < 0.5) x += F.idleShift * (i % 2 ? -1 : 1) * (1 - a * 2);
    return { x, y, flex };
  }

  function drawLeg(ctx, cfg, B, i, mo, F, col) {
    const hind = i < 2, far = i % 2 === 1, bones = hind ? cfg.hindLeg : cfg.foreLeg, ws = hind ? cfg.hindW : cfg.foreW;
    const piv = hind ? cfg.hip : cfg.shoulder, fdx = far ? cfg.farDx : 0;
    const [hx, hy] = bodyX(B)([piv[0] + fdx, piv[1] - (far ? cfg.farDy : 0)]);
    const f = footTarget(cfg, mo, i, piv[0] + fdx + (hind ? cfg.hindStand : cfg.foreStand), F);
    const pa = (hind ? -0.25 : -0.35) + f.flex * (hind ? 1.25 : 1.6); // pastern angle from vertical (+ = ankle ahead)
    const ax = f.x + Math.sin(pa) * bones[2], ay = f.y - Math.cos(pa) * bones[2];
    const top = hind ? cfg.hindTop : cfg.foreTop;
    let chain = [[hx, hy]], sx = hx, sy = hy;
    if (top) { // fixed upper bone (thigh / upper arm) that swings a little with the foot
      const sw = Math.atan2(f.x - (piv[0] + fdx), cfg.legLen) * 0.45 + B.pitch, [tx, ty] = CK.rot(top[0], top[1], sw);
      sx = hx + tx; sy = hy + ty; chain.push([sx, sy]);
    }
    const knee = CK.ik2(sx, sy, ax, ay, bones[0], bones[1], hind ? 1 : -1);
    chain = chain.concat([knee, [ax, ay], [f.x, f.y]]);
    if (far) T.outlined(ctx, CK.tube(chain, ws), col, { line: cfg.line });
    else { // near leg grows out of the body: fill all of it, ink only below the thigh / upper arm
      const tp = CK.tubeParts(chain, ws, 1);
      T.outlined(ctx, tp.fill, col, { line: 0 });
      ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = P.ink; ctx.lineWidth = cfg.line; ctx.beginPath(); tp.edge(ctx); ctx.stroke();
      // contour of the thigh / shoulder mass on the body: an ink arc behind the joint (hind) or in front of it (fore)
      if (top && cfg.massLine !== false) {
        const r = ws[0] * 1.05, a0 = hind ? Math.PI * 0.55 : -Math.PI * 0.3, a1 = hind ? Math.PI * 1.35 : Math.PI * 0.45;
        const pts = []; for (let i = 0; i <= 8; i++) { const a = T.lerp(a0, a1, i / 8) + B.pitch; pts.push([hx + Math.cos(a) * r * (hind ? 1 : 0.9), hy + 10 + Math.sin(a) * r * 1.15]); }
        T.inkStroke(ctx, hind ? pts : pts.reverse(), { w: cfg.line * 0.75, ink: sh(col, -0.6) });
      }
    }
    if (cfg.wrinkles) { // skin folds across the knee
      ctx.strokeStyle = sh(col, -0.5); ctx.lineWidth = cfg.line * 0.4; ctx.lineCap = 'round';
      const [kx, ky] = knee, w = ws[2] * 0.8;
      for (const dy of [-10, 0, 10]) { ctx.beginPath(); ctx.moveTo(kx - w, ky + dy); ctx.quadraticCurveTo(kx, ky + dy + 6, kx + w * 0.7, ky + dy - 2); ctx.stroke(); }
    }
    cfg.foot(ctx, f.x, f.y, pa, far, F, ws[3]);
  }

  // Neck geometry (base on the body, angle by state / gait nod), head anchor F.headPt (head-local -> creature units).
  function neckPose(cfg, B, mo, F) {
    const G = T.GAIT.table[mo.gait], nod = mo.amp * G.nod * D * Math.sin(TAU * (mo.phase * (G.bobN || 1)) + 0.9);
    let ang = cfg.neckAng * D + nod;
    ang = T.lerp(ang, cfg.eatAng * D, F.eat); ang = T.lerp(ang, cfg.sleepAng * D, F.sleep); ang = T.lerp(ang, (cfg.neckAng - 18) * D, F.scared);
    ang = T.lerp(ang, cfg.runAng * D, mo.pose('gallop') * 0.8);
    ang += F.look * 4 * D + F.breathe * 1.5 * D * (1 - mo.amp);
    if (F.sit > 0) ang = T.lerp(ang, cfg.sitNeck * D, F.sit);
    const [bx, by] = bodyX(B)(cfg.neckBase), len = cfg.neckLen;
    const tip = [bx + Math.cos(ang) * len, by + Math.sin(ang) * len];
    const mid = [(bx + tip[0]) / 2 + Math.sin(ang) * cfg.neckArch, (by + tip[1]) / 2 - Math.cos(ang) * cfg.neckArch];
    F.neck = { base: [bx, by], mid, tip, ang };
    let a = ang + (cfg.headAng ?? 0) * D;
    if (cfg.headAbs != null) { // absolute head angle per state (muzzle direction), nodding with the gait
      a = cfg.headAbs * D + nod * 0.6 + F.look * 3 * D;
      a = T.lerp(a, cfg.eatHead * D, F.eat); a = T.lerp(a, cfg.sleepHead * D, F.sleep); a = T.lerp(a, cfg.runHead * D, mo.pose('gallop') * 0.8);
      a = T.lerp(a, (cfg.headAbs - 28) * D, F.scared);
      if (F.sit > 0) a = T.lerp(a, (cfg.sitHead ?? cfg.headAbs) * D, F.sit);
    }
    a += F.headTilt;
    F.headA = a;
    const hs = cfg.headScale ?? 1;
    F.headPt = ([x0, y0]) => { const x = x0 * hs, y = y0 * hs; return [tip[0] + x * Math.cos(a) - y * Math.sin(a), tip[1] + x * Math.sin(a) + y * Math.cos(a)]; };
  }
  const drawNeck = (ctx, cfg, F, col) => { if (cfg.neckW) T.outlined(ctx, CK.tube([F.neck.base, F.neck.mid, F.neck.tip], cfg.neckW), col, { line: cfg.line }); };
  function drawHead(ctx, cfg, F, mo) {
    if (cfg.mane) drawMane(ctx, cfg, F, mo);
    ctx.save(); ctx.translate(F.neck.tip[0], F.neck.tip[1]); ctx.rotate(F.headA); ctx.scale(cfg.headScale ?? 1, cfg.headScale ?? 1);
    cfg.head(ctx, F);
    ctx.restore();
  }

  function drawMane(ctx, cfg, F, mo) {
    const { base, mid, tip } = F.neck, M = cfg.mane, n = M.n, col = F.mane;
    for (let j = 0; j < n; j++) {
      const t = j / (n - 1), u = 1 - t;
      const x = u * u * base[0] + 2 * u * t * mid[0] + t * t * tip[0], y = u * u * base[1] + 2 * u * t * mid[1] + t * t * tip[1];
      const nx = Math.sin(F.neck.ang), ny = -Math.cos(F.neck.ang), rx = x + nx * M.off, ry = y + ny * M.off;
      const len = M.len * (0.75 + 0.35 * Math.sin(j * 2.3)), stream = T.clamp(mo.speed / (cfg.legLen * 6));
      const pts = CK.tailPts(rx, ry, 3, len / 3, { base: F.neck.ang + Math.PI * 0.62, t: F.lt, hz: 1.1, lag: 0.9, ph: j * 0.8, amp: 0.1 + stream * 0.12, stream, streamAng: Math.PI * 0.98 });
      T.outlined(ctx, CK.tube(pts, [M.w, M.w * 0.8, M.w * 0.45, 2]), col, { line: cfg.line * 0.7 });
    }
  }

  function drawTail(ctx, cfg, B, mo, F, col) {
    const Tl = cfg.tail;
    if (!Tl) return;
    const [x, y] = bodyX(B)(Tl.at), stream = T.clamp(mo.speed / (cfg.legLen * 5)) * (Tl.stream ?? 1);
    let base = Tl.base * D + B.pitch;
    base = T.lerp(base, (Tl.tuck ?? 110) * D, F.scared); base = T.lerp(base, (Tl.sleep ?? Tl.base) * D, F.sleep);
    if (F.sit > 0) base = T.lerp(base, (Tl.sit ?? 150) * D, F.sit);
    const pts = CK.tailPts(x, y, Tl.n, Tl.seg, { base, t: F.lt, hz: Tl.hz ?? 0.55, lag: Tl.lag ?? 0.6, amp: (Tl.amp ?? 0.07) * (1 - F.sleep * 0.8), curl: (Tl.curl ?? 0) * D,
      flick: F.tailFlick * (Tl.flick ?? 1), stream, streamAng: Math.PI * (Tl.streamAng ?? 0.96) });
    if (cfg.drawTail) return cfg.drawTail(ctx, pts, F, col);
    T.outlined(ctx, CK.tube(pts, Tl.w), Tl.color ? F[Tl.color] ?? Tl.color : col, { line: cfg.line * 0.85 });
  }

  // cfg defaults; species override what they need.
  const DEF = { unit: 400, size: 360, line: 8, farDx: 16, farDy: 6, hindStand: 0, foreStand: 0, tuck: [60, -40], sitFoot: 70,
    neckAng: -55, eatAng: 70, sleepAng: 20, runAng: -25, sitNeck: -70, neckArch: 10, headAng: 0, lieH: 0.45, breath: 0.012, sitPitch: -32 };

  CK.quad = (cfg0) => {
    const cfg = { ...DEF, ...cfg0 };
    return (ctx, L, lt, env) => {
      const k = (L.size ?? cfg.size) / cfg.unit, seed = String(L.id ?? L.kind) + (L.x ?? '');
      ctx.scale(k, k);
      const mo = CK.motion(L, lt, env, { k, legLen: cfg.legLen, cycleK: cfg.cycleK });
      const col = L.color ?? cfg.color, col2 = L.color2 ?? cfg.color2;
      const exprName = L.expr != null ? T.timed(L.expr, lt, 0).cur : null;
      const F = { L, lt, env, k, seed, col, col2, mane: L.mane ?? cfg.maneColor ?? sh(col, -0.45), cfg,
        sleep: mo.pose('sleep'), eat: mo.pose('eat'), scared: mo.pose('scared'), sit: cfg.canSit ? mo.pose('sit') : 0,
        blink: CK.blink(seed, lt), earFlick: CK.flick(seed + 'ear', lt, 2.7), tailFlick: CK.flick(seed + 'tail', lt, 3.6),
        look: T.noise(lt * 0.35, seed + 'look'), breathe: Math.sin((lt * TAU) / (mo.pose('scared') > 0.5 ? 0.9 : 2.8)), mo };
      F.e = CK.expr(F.sleep > 0.5 ? 'sleep' : exprName ?? (F.scared > 0.5 ? 'scared' : 'neutral'));
      F.chew = F.eat > 0.5 ? Math.max(0, Math.sin(lt * TAU * 2.2)) : 0;
      F.talk = CK.inWin(L.talk, lt) && Math.floor(lt * 10) % 2 === 0;
      F.headTilt = F.scared * -0.12 + (F.eat > 0 ? Math.sin(lt * TAU * 0.4) * 0.04 * F.eat : 0);
      F.idleShift = mo.amp < 0.5 ? T.noise(lt * 0.25, seed + 'shift') * 6 : 0;
      const G = T.GAIT.table[mo.gait];
      // body motion
      const gb = (g, ph) => { const Gg = T.GAIT.table[g]; return { dy: Gg.bob * cfg.legLen * Math.cos(TAU * Gg.bobN * ph), pitch: Gg.pitch * D * Math.sin(TAU * ph + 1.2) }; };
      let b = gb(mo.gait, mo.phase);
      if (mo.g2 && mo.bw > 0) { const b2 = gb(mo.g2, mo.phase2); b = { dy: T.lerp(b.dy, b2.dy, mo.bw), pitch: T.lerp(b.pitch, b2.pitch, mo.bw) }; }
      const hipH = -cfg.hip[1];
      const B = { px: cfg.pivot[0], py: cfg.pivot[1], sx: 1, sy: 1 + F.breathe * cfg.breath * (1 - mo.amp),
        dy: b.dy * mo.amp + F.sleep * hipH * (1 - cfg.lieH) + F.sit * hipH * 0.42 + F.scared * 6,
        pitch: b.pitch * mo.amp - F.scared * 7 * D + F.sit * cfg.sitPitch * D };
      if (cfg.flex) B.sx = 1 + mo.pose('gallop') * cfg.flex * Math.sin(TAU * mo.phase + 2.4);
      if (F.scared > 0.3) { const r = T.rng(T.hash(seed + ':tr:' + Math.floor(lt * 15))); B.dy += (r() - 0.5) * 5 * F.scared; B.px += (r() - 0.5) * 6 * F.scared; }
      F.B = B; F.bodyPt = bodyX(B);
      const spanX = cfg.span ?? Math.abs(cfg.shoulder[0] - cfg.hip[0]) * 0.75 + 60;
      CK.shadow(ctx, L, (cfg.hip[0] + cfg.shoulder[0]) / 2, spanX, CK.lift(env, k));
      if (L.glow) { ctx.shadowColor = L.glow === true ? 'rgba(255,255,255,0.95)' : L.glow; ctx.shadowBlur = (50 + Math.sin(lt * Math.PI) * 8) * T.DPR; }
      const farCol = sh(col, -0.28), legCol = cfg.legColor ? F[cfg.legColor] ?? cfg.legColor : col;
      const farLeg = cfg.legColor ? sh(legCol, -0.28) : farCol;
      if (cfg.extraBack) cfg.extraBack(ctx, F);
      drawLeg(ctx, cfg, B, 1, mo, F, farLeg); drawLeg(ctx, cfg, B, 3, mo, F, farLeg);
      if (cfg.legsUnder) { drawLeg(ctx, cfg, B, 0, mo, F, legCol); drawLeg(ctx, cfg, B, 2, mo, F, legCol); } // legs hidden under a fleece
      if (!cfg.tailFront) drawTail(ctx, cfg, B, mo, F, col);
      neckPose(cfg, B, mo, F);
      drawNeck(ctx, cfg, F, col);
      ctx.save(); applyBody(ctx, B);
      T.outlined(ctx, cfg.body, col, { line: cfg.line, shade: cfg.bodyShade ? (c) => cfg.bodyShade(c, F) : null });
      if (cfg.bodyOver) cfg.bodyOver(ctx, F);
      if (cfg.lines) { for (const ln of cfg.lines) T.inkStroke ? T.inkStroke(ctx, ln, { w: cfg.line * 0.6, ink: sh(col, -0.55) }) : null; }
      ctx.restore();
      ctx.shadowBlur = 0;
      if (cfg.tailFront) drawTail(ctx, cfg, B, mo, F, col);
      if (!cfg.legsUnder) { drawLeg(ctx, cfg, B, 0, mo, F, legCol); drawLeg(ctx, cfg, B, 2, mo, F, legCol); }
      if (cfg.extraMid) cfg.extraMid(ctx, F);
      drawHead(ctx, cfg, F, mo);
      if (L.rider && cfg.seat) drawRider(ctx, cfg, L, lt, env, B, F, mo);
      if (F.sleep > 0.6 && cfg.zzz) CK.zzz(ctx, ...F.headPt(cfg.zzz), lt, 26);
      if (F.scared > 0.6 && cfg.sweat) CK.sweat(ctx, ...F.headPt(cfg.sweat), lt, 9);
    };
  };

  function drawRider(ctx, cfg, L, lt, env, B, F, mo) {
    const [sx, sy] = bodyX(B)(cfg.seat), [ax, ay] = bodyX(B)(cfg.saddle ?? [cfg.seat[0], cfg.seat[1] - 64]);
    const bounce = mo.amp * Math.max(0, -Math.cos(TAU * mo.phase * 2)) * 8 * (1 - mo.pose('walk') * 0.6);
    CK.rider(ctx, L, lt, env, sx, sy - bounce + (L.riderY ?? 0), cfg.riderSize / 400, { lean: B.pitch * 0.6 - mo.pose('gallop') * 0.1 });
    ctx.save(); ctx.translate(ax, ay); ctx.rotate(B.pitch);
    const sw = cfg.saddleW, sc = L.saddle ?? '#8f1f27';
    T.outlined(ctx, (k) => { k.moveTo(-sw / 2, -6); k.quadraticCurveTo(0, -16, sw / 2, -6); k.lineTo(sw / 2 - 6, 54); k.quadraticCurveTo(0, 64, -sw / 2 + 6, 54); k.closePath(); }, sc, { line: 7 });
    ctx.strokeStyle = '#e2b63a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-sw / 2 + 10, 44); ctx.quadraticCurveTo(0, 54, sw / 2 - 10, 44); ctx.stroke();
    T.outlined(ctx, (k) => T.rrect(k, -sw / 2 + 6, -20, sw - 12, 20, 9), '#6a3a22', { line: 6 });
    ctx.restore();
    CK.riderLeg(ctx, L, ax + 4, ay - 4, cfg.riderSize / 400, Math.sin(TAU * mo.phase) * mo.amp);
    if (F.bit) { // reins from the bit to the rider's hands
      ctx.strokeStyle = L.tackColor ?? '#5a2e1c'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(F.bit[0], F.bit[1]); ctx.quadraticCurveTo((F.bit[0] + ax) / 2 + 10, Math.max(F.bit[1], ay) + 20, ax + 40, ay - 50); ctx.stroke();
    }
  }

  // ---------- feet ----------
  CK.FEET = {
    hoof: (ctx, x, y, pa, far, F, w) => { // keratin hoof with a lighter coronet band
      ctx.save(); ctx.translate(x, y); ctx.rotate(pa * 0.6);
      const col = far ? sh(F.cfg.hoofColor ?? '#3a2a20', -0.2) : F.cfg.hoofColor ?? '#3a2a20';
      T.outlined(ctx, (k) => { k.moveTo(-w * 1.05, -w * 1.25); k.lineTo(w * 1.05, -w * 1.25); k.lineTo(w * 1.35, 0); k.lineTo(-w * 1.25, 0); k.closePath(); }, col, { line: F.cfg.line * 0.8 });
      ctx.restore();
    },
    cloven: (ctx, x, y, pa, far, F, w) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(pa * 0.6);
      const col = far ? sh(F.cfg.hoofColor ?? '#2e2622', -0.2) : F.cfg.hoofColor ?? '#2e2622';
      T.outlined(ctx, (k) => { k.moveTo(-w, -w * 1.1); k.lineTo(w, -w * 1.1); k.lineTo(w * 1.3, 0); k.lineTo(-w * 1.15, 0); k.closePath(); }, col, { line: F.cfg.line * 0.8 });
      ctx.strokeStyle = P.ink; ctx.lineWidth = F.cfg.line * 0.5; ctx.beginPath(); ctx.moveTo(w * 0.15, -w * 0.9); ctx.lineTo(w * 0.25, 0); ctx.stroke();
      ctx.restore();
    },
    paw: (ctx, x, y, pa, far, F, w) => { // rounded paw with toe lines, toes pointing forward
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.max(0, pa) * 0.5);
      const col = far ? sh(F.legCol ?? F.col, -0.28) : F.cfg.pawColor ? F[F.cfg.pawColor] ?? F.cfg.pawColor : F.col;
      T.outlined(ctx, (k) => { k.moveTo(-w * 0.9, -w * 0.2); k.quadraticCurveTo(-w * 1.1, -w * 1.5, w * 0.3, -w * 1.4); k.quadraticCurveTo(w * 2, -w * 1.2, w * 1.9, -w * 0.15); k.quadraticCurveTo(w * 1.8, 0, w * 0.9, 0); k.lineTo(-w * 0.6, 0); k.closePath(); }, col, { line: F.cfg.line * 0.8 });
      ctx.strokeStyle = P.ink; ctx.lineWidth = F.cfg.line * 0.45; ctx.lineCap = 'round';
      for (const tx of [0.55, 1.15]) { ctx.beginPath(); ctx.moveTo(w * tx, -w * 0.05); ctx.lineTo(w * tx - w * 0.1, -w * 0.55); ctx.stroke(); }
      if (F.cfg.claws) { ctx.strokeStyle = '#e8e2d4'; ctx.lineWidth = F.cfg.line * 0.4; for (const tx of [1.4, 1.9]) { ctx.beginPath(); ctx.moveTo(w * tx, -w * 0.3); ctx.lineTo(w * tx + w * 0.35, w * 0.05); ctx.stroke(); } }
      ctx.restore();
    },
    pad: (ctx, x, y, pa, far, F, w) => { // elephant foot: round pad with toenails
      ctx.save(); ctx.translate(x, y);
      const col = far ? sh(F.col, -0.28) : F.col;
      T.outlined(ctx, (k) => { k.moveTo(-w * 1.1, -w * 0.8); k.lineTo(w * 1.1, -w * 0.8); k.quadraticCurveTo(w * 1.3, 0, w * 1.1, 0); k.lineTo(-w * 1.1, 0); k.quadraticCurveTo(-w * 1.3, 0, -w * 1.1, -w * 0.8); k.closePath(); }, col, { line: F.cfg.line * 0.8 });
      for (const tx of [-0.4, 0.3, 0.95]) T.outlined(ctx, (k) => k.ellipse(w * tx, -w * 0.2, w * 0.24, w * 0.18, 0, 0, TAU), '#efe6d2', { line: F.cfg.line * 0.4, paint: false });
      ctx.restore();
    },
  };
  CK.LEG_NAMES = LEG_NAMES;
  CK.bodyX = bodyX;
})();
