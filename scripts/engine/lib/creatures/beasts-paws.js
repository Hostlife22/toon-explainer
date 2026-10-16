// beasts-paws.js — v2 rigs (quad-rig.js) of the padded-foot animals: dog, cat, wolf, bear and rat. Flexible spine in
// the gallop (bound), toon heads with ears that flick and flatten when scared, wagging / curling tails, `sit` state.
// dog and wolf keep their classic drawing in classic specs; cat, bear and rat are new kinds. Units: 400 per `size`.
(function () {
  'use strict';
  const T = window.TOON, CK = T.CK, P = T.PAL, TAU = Math.PI * 2, sh = CK.sh, leaf = CK.leaf;
  const blob = (pts) => (k) => T.smoothPath(k, pts);
  const eyeOpts = (F, extra = {}) => ({ e: F.e, blink: F.blink, look: [0.45 + F.look * 0.3, 0.1], lidColor: F.col, ...extra });

  // Generic muzzle head; o: {snout (length), ears: 'point'|'flop'|'round'|'cat', earLen, nose, whiskers, teeth}
  function pawHead(o) {
    return (ctx, F) => {
      const c = F.col, c2 = F.col2, line = 8, ear = F.earFlick * 0.4 + F.scared * 0.9, open = (F.chew + (F.talk ? 1 : 0)) * 10 + (F.e.wide ? 6 : 0);
      const sn = o.snout, el = o.earLen;
      for (const [ex, far] of [[-18, true], [4, false]]) {
        ctx.save(); ctx.translate(ex, -34);
        if (o.ears === 'flop') { ctx.rotate(0.5 + ear * 0.6 + (far ? -0.2 : 0)); T.outlined(ctx, blob([[-6, 0], [14, 4], [12, el * 0.8], [-6, el]]), far ? sh(c, -0.35) : sh(c, -0.15), { line }); }
        else if (o.ears === 'round') { ctx.rotate(-0.3 + ear * 0.4); T.outlined(ctx, (k) => k.arc(0, -10, el * 0.5, 0, TAU), far ? sh(c, -0.3) : c, { line }); }
        else { ctx.rotate(-0.25 - ear + (far ? -0.25 : 0)); T.outlined(ctx, leaf(0, 6, -6, -el, el * 0.36), far ? sh(c, -0.3) : c, { line }); if (!far) T.outlined(ctx, leaf(-1, -2, -5, -el * 0.75, el * 0.16), o.inner ?? '#e8a8a8', { line: 0 }); }
        ctx.restore();
      }
      T.outlined(ctx, blob([[-44, -34], [10, -50], [50, -30], [50 + sn, -10], [56 + sn, 14], [40 + sn, 30 + open * 0.3], [10, 44], [-40, 26]]), c, { line });
      T.outlined(ctx, blob([[20, 6], [40 + sn, 4], [54 + sn, 18], [36 + sn, 34 + open], [10, 36]]), c2, { line: 0 });
      if (open > 1) T.outlined(ctx, (k) => { k.moveTo(18 + sn * 0.3, 28); k.quadraticCurveTo(30 + sn, 30, 44 + sn, 24); k.quadraticCurveTo(30 + sn, 30 + open * 1.4, 18 + sn * 0.3, 28); k.closePath(); }, '#7a2a2a', { line: 5 });
      if (o.teeth && (F.e.brow ?? 0) > 0.3) { ctx.fillStyle = '#fff'; for (const tx of [26, 40]) { ctx.beginPath(); ctx.moveTo(tx + sn * 0.5, 26); ctx.lineTo(tx + 5 + sn * 0.5, 38); ctx.lineTo(tx + 10 + sn * 0.5, 26); ctx.fill(); } }
      ctx.strokeStyle = P.ink; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(48 + sn, 22 + open * 0.3); ctx.quadraticCurveTo(30 + sn * 0.6, 32 + open * 0.3, 16 + sn * 0.3, 26); ctx.stroke();
      T.outlined(ctx, (k) => k.ellipse(52 + sn, 0, o.nose ?? 11, (o.nose ?? 11) * 0.8, 0, 0, TAU), o.noseColor ?? '#2a1c18', { line: 4, paint: false });
      if (o.whiskers) { ctx.lineWidth = 2.5; ctx.strokeStyle = sh(c, -0.6); for (const wy of [12, 20]) { ctx.beginPath(); ctx.moveTo(30 + sn, wy); ctx.lineTo(70 + sn + 10, wy - 8 + (wy - 12) * 1.2); ctx.stroke(); } }
      CK.eye(ctx, 18, -14, o.eye ?? 12, eyeOpts(F, o.slit ? { iris: '#3a5a1a' } : {}));
    };
  }
  // Flexible-spine body: rump, waist, chest masses joined in one smooth outline.
  const furBody = (len, depth, chest, rump, top) => blob([[-len, -top - depth * 0.2], [-len * 1.05, -top + depth * 0.4], [-len * 0.75, -top + depth * 0.95], [-len * 0.1, -top + depth * 0.8],
    [len * 0.6, -top + depth * 1.0], [len * 1.02, -top + depth * 0.55], [len * 0.92, -top - depth * 0.05 - chest], [len * 0.4, -top - depth * 0.05], [-len * 0.4, -top - depth * 0.02 - rump * 0.3], [-len * 0.85, -top - depth * 0.05 - rump]]);
  const TAIL = (at, base, o = {}) => ({ at, n: o.n ?? 6, seg: o.seg ?? 20, w: o.w ?? [10, 10, 9, 8, 7, 6, 3], base, hz: o.hz ?? 0.8, amp: o.amp ?? 0.12, lag: 0.7, curl: o.curl ?? 0, stream: 1, streamAng: o.streamAng ?? 0.92, tuck: o.tuck ?? 120, sit: o.sit ?? 175, flick: o.flick ?? 1 });
  const common = { unit: 400, foot: CK.FEET.paw, canSit: true, flex: 0.07, line: 8, lieH: 0.42, tuck: [80, -40], sitFoot: 90, zzz: [10, -60], sweat: [20, -50], sitHead: 20 };

  const DOG = { ...common, size: 300, legLen: 150, color: '#d9a441', color2: '#f2e2c0', cycleK: 0.9,
    hip: [-118, -168], shoulder: [100, -164], pivot: [0, -200], hindTop: [26, 40], foreTop: [0, 30],
    hindLeg: [60, 56, 16], foreLeg: [56, 58, 16], hindW: [42, 26, 13, 10, 10], foreW: [34, 22, 12, 10, 10],
    body: furBody(150, 80, 14, 8, 230), neckBase: [118, -238], neckLen: 70, neckAng: -50, neckW: [40, 34, 30], headAbs: 0, eatHead: 70, sleepHead: 10, runHead: 10, eatAng: 50, sleepAng: 10, runAng: -20, sitNeck: -80,
    headScale: 1.3, head: pawHead({ snout: 50, ears: 'flop', earLen: 60 }), tail: TAIL([-150, -248], -40, { amp: 0.35, hz: 2.2, curl: 40, tuck: 140 }), sitPitch: -38 };
  const WOLF = { ...DOG, size: 320, color: '#8a8a92', color2: '#e8e6e0', legLen: 165, hip: [-124, -182], shoulder: [106, -178], pivot: [0, -214],
    hindLeg: [66, 62, 18], foreLeg: [62, 64, 18], body: furBody(158, 82, 22, 6, 246), neckBase: [124, -254], headScale: 1.05,
    head: pawHead({ snout: 64, ears: 'point', earLen: 52, teeth: true, inner: '#5a5a62' }), tail: TAIL([-160, -258], 120, { w: [14, 20, 22, 20, 16, 10, 4], amp: 0.1, hz: 0.6, tuck: 130 }),
    extraMid: (ctx, F) => { const [x, y] = F.bodyPt([132, -224]); T.outlined(ctx, blob(T.blobPts(x, y, 36, 46, F.seed + 'ruff', 10, 0.3)), F.col2, { line: 6 }); } };
  const CAT = { ...common, size: 200, legLen: 140, color: '#e08a3a', color2: '#f6e6d0', flex: 0.1, cycleK: 0.85,
    hip: [-110, -160], shoulder: [96, -150], pivot: [0, -190], hindTop: [28, 34], foreTop: [0, 24],
    hindLeg: [56, 54, 18], foreLeg: [52, 56, 14], hindW: [40, 22, 10, 9, 9], foreW: [26, 16, 9, 9, 9],
    body: furBody(140, 70, 8, 14, 212), neckBase: [108, -222], neckLen: 50, neckAng: -60, neckW: [32, 28, 26], headAbs: 0, headScale: 1.5, eatHead: 70, sleepHead: 10, runHead: 10, eatAng: 50, sleepAng: 10, runAng: -20, sitNeck: -85,
    head: pawHead({ snout: 14, ears: 'point', earLen: 44, nose: 7, noseColor: '#d86a7a', whiskers: true, eye: 14, slit: true }),
    tail: TAIL([-140, -236], -80, { n: 7, seg: 22, w: [9, 9, 9, 9, 9, 8, 8, 6], amp: 0.18, hz: 0.5, curl: 90, tuck: 150, sit: 190 }),
    bodyShade: (k, F) => { if (F.L.stripes === false) return; k.strokeStyle = sh(F.col, -0.25); k.lineWidth = 12; k.lineCap = 'round'; for (const x of [-100, -60, -20, 20]) { k.beginPath(); k.moveTo(x, -290); k.quadraticCurveTo(x + 10, -250, x - 4, -224); k.stroke(); } } };
  const BEAR = { ...common, size: 340, legLen: 140, color: '#6a4a32', color2: '#c8a07a', flex: 0.05, cycleK: 0.9, claws: true,
    hip: [-130, -160], shoulder: [120, -156], pivot: [0, -220], hindTop: [26, 34], foreTop: [0, 30],
    hindLeg: [58, 52, 16], foreLeg: [56, 54, 16], hindW: [56, 40, 26, 22, 22], foreW: [52, 36, 26, 22, 22],
    body: furBody(170, 130, 30, 0, 290), neckBase: [150, -260], neckLen: 50, neckAng: -20, neckW: [64, 58, 52], headAbs: 10, headScale: 1.3, eatHead: 70, sleepHead: 20, runHead: 10, eatAng: 50, sleepAng: 20, runAng: 0, sitNeck: -80,
    head: pawHead({ snout: 30, ears: 'round', earLen: 34, nose: 13, teeth: true }), tail: { at: [-176, -270], n: 2, seg: 12, w: [16, 14, 8], base: 160, hz: 0.5, amp: 0.1 }, sitPitch: -48 };
  const RAT = { ...common, size: 110, legLen: 90, color: '#8a8580', color2: '#c8c0b8', flex: 0.12, cycleK: 0.8, canSit: false,
    hip: [-96, -112], shoulder: [86, -100], pivot: [0, -150], hindTop: [24, 26], foreTop: [0, 18],
    hindLeg: [38, 34, 14], foreLeg: [32, 34, 10], hindW: [32, 16, 8, 7, 7], foreW: [18, 11, 7, 7, 7],
    body: furBody(130, 80, 4, 30, 180), neckBase: [96, -170], neckLen: 30, neckAng: -30, neckW: [36, 32, 28], headAbs: 12, headScale: 1.1, eatHead: 60, sleepHead: 20, runHead: 15, eatAng: 30, sleepAng: 20, runAng: 0,
    head: pawHead({ snout: 46, ears: 'round', earLen: 40, nose: 7, noseColor: '#d86a7a', whiskers: true, eye: 10, teeth: true }),
    tail: TAIL([-128, -150], 160, { n: 8, seg: 24, w: [8, 7, 6, 5, 4, 4, 3, 2, 1.5], amp: 0.14, hz: 0.9, curl: -40, streamAng: 1, tuck: 120 }),
    drawTail: (ctx, pts, F, c) => T.outlined(ctx, CK.tube(pts, [8, 7, 6, 5, 4, 4, 3, 2, 1.5]), '#d8a8a0', { line: 5 }) };

  CK.register('dog', CK.quad(DOG), { sit: true });
  CK.register('wolf', CK.quad(WOLF), { sit: true });
  CK.register('cat', CK.quad(CAT), { sit: true });
  CK.register('bear', CK.quad(BEAR), { sit: true });
  CK.register('rat', CK.quad(RAT));
  CK.SPECIES = { ...(CK.SPECIES || {}), dog: DOG, wolf: WOLF, cat: CAT, bear: BEAR, rat: RAT };
})();
