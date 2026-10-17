// vehicles-truck.js — turn views of the dump-truck: `view` (front | 3q | side | 3q-back | back) and `facing` timelines
// and path reversals turn it like the cars (vehicles-views.js). The side stays the classic drawing (vehicles-machines.js),
// so a truck without views draws exactly as before; with views it is a v2 vehicle whose side is that same drawing. The
// 3q views go through the car projection (vehicles-3q.js) with the chassis, cab and the tipping bed as extruded
// silhouettes; the front and back views are drawn here: cab, grille, lamps and bumper in front with the bed rising
// behind the cab as it tips; the tailgate, tail lights and plate from behind, the riders seen over the tailgate until they
// slide off and land behind the truck. Units: the classic drawing's (overall width 900, ground y = 0, facing +x).
(function () {
  'use strict';
  const T = window.TOON, VK = T.VK, P = T.PAL, TAU = Math.PI * 2, D = T.DEG, sh = VK.sh;
  const W = 900, COL = '#f2d02f', DRIVE_PX = 220, BED = [[0, 0], [560, 0], [580, -200], [-20, -200]];
  const side = T.VEHICLES['dump-truck']; // the classic side drawing
  if (!side) return;

  // The bed outline at a tilt (rad): it pivots on its rear bottom corner (-440, -100), as in the side drawing.
  const bedAt = (t) => BED.map(([x, y]) => [-440 + x * Math.cos(t) + y * Math.sin(t), -100 - x * Math.sin(t) + y * Math.cos(t)]);
  const CHASSIS = { pts: [[-440, -60], [-440, -100], [440, -100], [440, -60]], fill: '#3a2a20' };
  const CAB = { pts: [[180, -60], [180, -200], [420, -200], [430, -60]] };
  const GLASS = { pts: [[180, -200], [180, -320], [330, -320], [420, -200]], glass: true };
  const FRAME = [CHASSIS, CAB, GLASS, { pts: bedAt(0) }];
  const FACE = { front: 430, rear: 460, faceX: 424, rearX: 454, hw: 150, cabHw: 138, track: 116, tyre: 30, col: COL, back: 'plain',
    belt: [-200, -60], grille: { kind: 'wide', hw: 78, top: -178, bot: -112, color: '#3a3a3e' },
    lamps: { x: 108, y: -150, r: 17, color: '#fff2b0', rim: '#c9ced2' }, tail: { x: 118, y: -84, r: 11 },
    bumper: { y: -70, h: 22, hw: 146, color: '#5a5a60' }, cabin: { glass: '#bfe3f2' } };

  // The kind description the car views read (vehicles-3q.js), with the bed at the current tilt.
  function model(L, lt) {
    const tilt = T.num(L.tilt, lt, 0) * D;
    return { W, wb: 600, r: 54, wheels: [-300, -170, 300], lamp: [426, -150], tilt,
      wheel: { spokes: 6, rim: '#8a8f96', tyre: '#2a2a2e' },
      face: { ...FACE, col: L.color ?? COL, frame: FRAME, hull: [CHASSIS, CAB, GLASS, { pts: bedAt(tilt), topFill: sh(L.color ?? COL, -0.45) }] }, // open bed
      body: (ctx, L2, S2, env2) => side(ctx, L2, { size: W, lt: S2.lt, dist: S2.dist / DRIVE_PX, driving: S2.driving, noWheels: true,
        riderXf: S2.riderXf, riderView: S2.riderView }, env2) };
  }

  const tyre = (ctx, x, r, tw, color) => T.outlined(ctx, (c) => T.rrect(c, x - tw, -2 * r, 2 * tw, 2 * r, tw * 0.8), color, { line: 6 });
  // A bed rider seen from the front (over the cab) or from behind (over the tailgate).
  const rider = (ctx, L, env, lt, who, i, x, y, o) => {
    ctx.save(); ctx.translate(x, y);
    if (o.rot) ctx.rotate(o.rot);
    T.layers.bean(ctx, { type: 'bean', who, size: o.size ?? 260, legs: false, id: 'dt' + i, pose: o.pose, expr: o.expr, view: o.view, look: L.riderLook }, lt, { ...env, st: null });
    ctx.restore();
  };

  // Front or back view, centred on x = 0.
  function face(ctx, L, S, env, o, back) {
    const f = o.face, col = f.col, r = o.r, t = o.tilt, lt = S.lt, R = T.dumpTruckRiders(L, lt);
    if (T.CK) T.CK.shadow(ctx, L, 0, f.hw * 1.15, 0);
    for (const sx of [-1, 1]) tyre(ctx, sx * f.track, r, f.tyre, '#2a2a2e');
    const b = VK.bump(S, S.k, o.wb, L.terrain ?? 'road');
    ctx.save(); ctx.translate(0, b.dy - r * 0.12); ctx.rotate((b.f - b.r) * 0.002);
    T.outlined(ctx, (c) => T.rrect(c, -f.hw * 0.86, -100, 2 * f.hw * 0.86, 40, 6), '#3a2a20', { line: 6 }); // chassis
    const fy = (x, y) => -100 - x * Math.sin(t) + y * Math.cos(t); // y of a bed point (bed coordinates)
    const pose = R.slide == null ? 'idle' : 'panic', expr = R.slide == null ? 'neutral' : 'scream', spread = (i, n) => (i - (n - 1) / 2) * 92;
    const seated = R.list.filter((q) => !q.off);
    if (!back) {
      const top = fy(580, -200), bot = Math.max(fy(560, 0), top + 30); // the bed's front wall, rising behind the cab
      seated.forEach((q, j) => { if (R.slide == null) rider(ctx, L, env, lt, q.who, q.i, spread(j, seated.length), -190, { pose, expr, view: 'front' }); });
      if (bot < -300) { // tipped: the bed's underside and the ram between the cab roof and the raised front wall
        T.outlined(ctx, (c) => { c.moveTo(-f.hw * 0.92, bot); c.lineTo(f.hw * 0.92, bot); c.lineTo(f.hw * 0.8, -290); c.lineTo(-f.hw * 0.8, -290); c.closePath(); }, sh(col, -0.5), { line: 7 });
        T.outlined(ctx, (c) => T.rrect(c, -14, bot, 28, -280 - bot, 6), '#9aa0a6', { line: 6 });
      }
      T.outlined(ctx, (c) => T.rrect(c, -f.hw, top, 2 * f.hw, bot - top, 8), col, { line: 8, shade: (c) => { c.fillStyle = sh(col, -0.2); c.fillRect(-f.hw, bot - 30, 2 * f.hw, 30); } });
      const cw = f.cabHw;
      T.outlined(ctx, (c) => { c.moveTo(-cw, -200); c.lineTo(-cw * 0.9, -322); c.lineTo(cw * 0.9, -322); c.lineTo(cw, -200); c.closePath(); }, col, { line: 8 }); // cab top
      T.outlined(ctx, (c) => { c.moveTo(-cw + 18, -210); c.lineTo(-cw * 0.9 + 16, -304); c.lineTo(cw * 0.9 - 16, -304); c.lineTo(cw - 18, -210); c.closePath(); }, f.cabin.glass, { line: 5, paint: false });
      ctx.save(); ctx.globalAlpha *= 0.5; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 9; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-cw * 0.5, -290); ctx.lineTo(-cw * 0.15, -222); ctx.stroke(); ctx.restore();
      T.outlined(ctx, (c) => T.rrect(c, -cw, -204, 2 * cw, 144, 12), col, { line: 8, shade: (c) => { c.fillStyle = sh(col, -0.22); c.fillRect(-cw, -100, 2 * cw, 40); } });
      VK.frontEnd(ctx, f, col, !!L.lights);
    } else {
      T.outlined(ctx, (c) => T.rrect(c, -f.cabHw * 0.92, -322, 2 * f.cabHw * 0.92, 140, 10), sh(col, -0.12), { line: 7 }); // cab behind the bed
      const rearTop = fy(-20, -200), frontTop = fy(580, -200);
      if (frontTop < rearTop - 4) { // tipping: the bed floor shows, rising toward the cab
        T.outlined(ctx, (c) => { c.moveTo(-f.hw, rearTop); c.lineTo(-f.hw * 0.94, frontTop); c.lineTo(f.hw * 0.94, frontTop); c.lineTo(f.hw, rearTop); c.closePath(); }, sh(col, -0.38), { line: 7 });
      }
      seated.forEach((q, j) => { // riders slide back toward the tailgate as the bed tips
        const along = T.clamp((q.bx + 60 - R.d) / 640), y = T.lerp(rearTop, frontTop, along) + 110;
        rider(ctx, L, env, lt, q.who, q.i, spread(j, seated.length), y, { pose, expr, view: 'back' });
      });
      T.outlined(ctx, (c) => T.rrect(c, -f.hw, rearTop, 2 * f.hw, -100 - rearTop, 8), col, { line: 8, // tailgate
        shade: (c) => { c.strokeStyle = sh(col, -0.3); c.lineWidth = 5; for (const x of [-90, -30, 30, 90]) { c.beginPath(); c.moveTo(x, rearTop + 12); c.lineTo(x, -112); c.stroke(); } } });
      VK.rearEnd(ctx, f, col, sh(col, -0.5), o);
    }
    T.outlined(ctx, (c) => T.rrect(c, -f.bumper.hw, f.bumper.y, 2 * f.bumper.hw, f.bumper.h, f.bumper.h / 2), f.bumper.color, { line: 5 });
    ctx.restore();
    if (back) R.list.filter((q) => q.off).forEach((q, j) => rider(ctx, L, env, lt, q.who, q.i, -120 + j * 120, 40, { pose: 'panic', expr: 'dead', view: 'back', size: 240, rot: (j % 2 ? 80 : -80) * D }));
  }

  VK.register('dump-truck', (ctx, L, S, env) => {
    if (!S.view || S.view === 'side') { // the classic drawing, with the classic layer's bob
      if (S.driving) ctx.translate(0, -Math.abs(Math.sin(S.lt * Math.PI * 3)) * (L.bobAmp ?? 4));
      return side(ctx, L, { size: S.size, lt: S.lt, dist: S.dist / DRIVE_PX, driving: S.driving }, env);
    }
    const k = S.size / W, o = model(L, S.lt), S2 = { ...S, k, o };
    ctx.scale(k, k);
    if (S.view === 'front' || S.view === 'back') return face(ctx, L, S2, env, o, S.view === 'back');
    return VK.car3q(ctx, L, S2, env, o, k);
  }, W);
  VK.VIEW_ONLY.add('dump-truck');
  VK.VIEW_KINDS.add('dump-truck');
  VK.VIEW_COL['dump-truck'] = COL;
})();
