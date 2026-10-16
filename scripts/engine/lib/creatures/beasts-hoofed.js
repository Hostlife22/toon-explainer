// beasts-hoofed.js — v2 rigs (quad-rig.js) of the hoofed and heavy animals: horse (walk / trot / gallop, rider with
// saddle, bridle and reins, flowing mane and tail), cow and bull (horns, spots, udder), sheep (wool), pig, camel
// (hump) and elephant (ears, trunk, tusks). Existing kinds keep their classic drawing in classic specs (creature-kit.js
// T.creatureRig). Units: 400 per `size`, ground y = 0, facing +x.
(function () {
  'use strict';
  const T = window.TOON, CK = T.CK, P = T.PAL, TAU = Math.PI * 2, D = T.DEG, sh = CK.sh;
  const blob = (pts) => (k) => T.smoothPath(k, pts);
  const leaf = (x0, y0, x1, y1, w) => (k) => { // pointed leaf from (x0,y0) to (x1,y1), half width w
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, a = Math.atan2(y1 - y0, x1 - x0), nx = -Math.sin(a) * w, ny = Math.cos(a) * w;
    k.moveTo(x0, y0); k.quadraticCurveTo(mx + nx, my + ny, x1, y1); k.quadraticCurveTo(mx - nx, my - ny, x0, y0); k.closePath();
  };
  CK.leaf = leaf;
  const eyeOpts = (F, extra = {}) => ({ e: F.e, blink: F.blink, look: [0.45 + F.look * 0.3, 0.15], lidColor: F.col, ...extra });

  // ---------- horse ----------
  function horseHead(ctx, F) {
    const c = F.col, L = F.L, ear = F.earFlick * 0.35 + F.scared * 0.7, line = 8;
    for (const [ex, far] of [[-6, true], [8, false]]) { // ears: far one darker, behind the skull
      ctx.save(); ctx.translate(ex, -30); ctx.rotate(-0.35 + ear + (far ? -0.15 : 0));
      T.outlined(ctx, leaf(0, 0, -10, -62, 15), far ? sh(c, -0.3) : c, { line });
      if (!far) T.outlined(ctx, leaf(-1, -8, -8, -50, 6), sh(c, -0.45), { line: 0 });
      ctx.restore();
    }
    const open = (F.chew + (F.talk ? 1 : 0) + F.scared * 0.6) * 10;
    T.outlined(ctx, blob([[-34, -26], [10, -46], [70, -32], [128, -20], [160, 0], [158, 26], [130, 38 + open], [70, 42], [16, 56], [-26, 36]]), c, { line });
    T.outlined(ctx, blob([[96, -18], [150, -10], [164, 12], [152, 34 + open], [110, 34], [92, 10]]), F.cfg.muzzle ? F.cfg.muzzle : sh(c, -0.12), { line: 0 }); // muzzle tone
    if (L.blaze) T.outlined(ctx, blob([[0, -34], [60, -30], [130, -14], [130, -2], [60, -16], [4, -22]]), '#f4efe6', { line: 0 });
    ctx.strokeStyle = P.ink; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(150, 30 + open * 0.5); ctx.quadraticCurveTo(130, 34 + open, 112, 30 + open * 0.6); ctx.stroke(); // mouth
    ctx.beginPath(); ctx.ellipse(146, 4, 6, 9, 0.5, 0, TAU); ctx.fillStyle = P.ink; ctx.fill(); // nostril
    ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(20, 18, 26, -0.2, 1.4); ctx.stroke(); // cheek
    CK.eye(ctx, 30, -12, 13, eyeOpts(F));
    // forelock
    const fl = F.mane;
    for (let i = 0; i < 3; i++) T.outlined(ctx, leaf(-8 + i * 8, -40, 22 + i * 10 + Math.sin(F.lt * 3 + i) * 3, -6 + i * 4, 7), fl, { line: 5 });
    if (L.rider || L.tack) { // bridle: cheek strap, noseband, bit ring
      ctx.strokeStyle = L.tackColor ?? '#5a2e1c'; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(-6, -30); ctx.lineTo(56, 34); ctx.moveTo(100, -22); ctx.quadraticCurveTo(110, 10, 100, 40); ctx.moveTo(-18, -22); ctx.lineTo(102, -18); ctx.stroke();
      T.outlined(ctx, (k) => k.arc(118, 34, 8, 0, TAU), '#c9a24a', { line: 4, paint: false });
      F.bit = F.headPt([118, 34]);
    }
  }
  const HORSE = {
    size: 360, unit: 400, legLen: 215, color: '#8a5236', maneColor: '#2e1c14', hoofColor: '#3a2a20',
    hip: [-140, -268], shoulder: [124, -262], pivot: [0, -270], hindTop: [34, 64], foreTop: [-4, 52],
    hindLeg: [92, 84, 28], foreLeg: [86, 86, 28], hindW: [58, 36, 17, 12, 12], foreW: [46, 30, 16, 12, 12],
    body: blob([[-150, -338], [-200, -320], [-222, -268], [-206, -200], [-140, -166], [0, -156], [112, -166], [180, -200], [206, -262], [174, -328], [104, -348], [20, -326], [-70, -334]]),
    neckBase: [150, -296], neckLen: 150, neckAng: -62, neckW: [70, 52, 40], neckArch: 20, headAbs: 48, eatHead: 98, sleepHead: 30, runHead: 22,
    eatAng: 58, sleepAng: -2, runAng: -30, sitNeck: -60,
    head: horseHead, headScale: 1.18, mane: { n: 9, off: 32, len: 66, w: 16 },
    tail: { at: [-210, -312], n: 6, seg: 32, w: [17, 25, 30, 28, 22, 13, 3], base: 100, hz: 0.5, amp: 0.06, stream: 1.2, streamAng: 0.97 },
    seat: [8, -272], riderSize: 330, saddleW: 124, foot: CK.FEET.hoof, tuck: [80, -70], lieH: 0.4, zzz: [10, -70], sweat: [40, -50],
    lines: [[[150, -300], [130, -258], [140, -206]], [[-108, -318], [-170, -268], [-160, -214]]],
  };

  // ---------- cow / bull ----------
  function bovineHead(horns) {
    return (ctx, F) => {
      const c = F.col, L = F.L, line = 8, ear = F.earFlick * 0.4 + F.scared * 0.5, horn = L.hornColor ?? '#e8dcc0';
      const big = (L.horns ?? horns) === 'long';
      for (const s of [-1, 1]) { // horns curve up and forward from the poll
        ctx.save(); ctx.translate(-6 + s * 4, -40);
        T.outlined(ctx, (k) => { k.moveTo(-10, 6); k.quadraticCurveTo(-30, big ? -60 : -30, s > 0 ? 10 : -16, big ? -84 : -48); k.quadraticCurveTo(4, big ? -50 : -26, 12, 2); k.closePath(); }, s > 0 ? horn : sh(horn, -0.25), { line: 6 });
        ctx.restore();
      }
      ctx.save(); ctx.translate(-10, -18); ctx.rotate(1.2 + ear); T.outlined(ctx, leaf(0, 0, 0, -58, 18), c, { line }); T.outlined(ctx, leaf(0, -8, 0, -48, 8), '#e8a8a8', { line: 0 }); ctx.restore();
      const open = (F.chew + (F.talk ? 1 : 0)) * 9;
      T.outlined(ctx, blob([[-36, -34], [30, -48], [86, -30], [118, 4], [116, 40], [70, 52 + open], [10, 50], [-34, 30]]), c, { line, shade: L.spots || F.cfg.spots ? (k) => { k.fillStyle = L.spotColor ?? '#2a2624'; k.beginPath(); T.smoothPath(k, T.blobPts(-6, -16, 30, 24, F.seed + 'hs', 8, 0.3)); k.fill(); } : null });
      T.outlined(ctx, (k) => k.ellipse(98, 28, 36, 30, 0.2, 0, TAU), L.muzzle ?? '#e9b2a6', { line: 6 });
      ctx.fillStyle = P.ink; for (const ny of [18, 36]) { ctx.beginPath(); ctx.ellipse(116, ny, 5, 7, 0.3, 0, TAU); ctx.fill(); }
      ctx.strokeStyle = P.ink; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(110, 56 + open); ctx.quadraticCurveTo(84, 58 + open, 70, 50); ctx.stroke();
      if (F.cfg.forelock) { ctx.fillStyle = F.mane; ctx.beginPath(); for (let i = 0; i <= 6; i++) ctx.lineTo(-24 + i * 10, -40 + (i % 2 ? 22 : 0)); ctx.closePath(); ctx.fill(); }
      CK.eye(ctx, 26, -8, 12, eyeOpts(F, { e: L.eyes === 'evil' ? CK.EXPR.evil : F.e }));
      if (L.tear) { ctx.fillStyle = 'rgba(110,190,240,0.9)'; ctx.beginPath(); ctx.ellipse(28, 20, 5, 9, 0, 0, TAU); ctx.fill(); }
      if (L.ring) T.outlined(ctx, (k) => { k.arc(118, 48, 12, 0, TAU); k.arc(118, 48, 6, 0, TAU, true); }, '#d8b040', { line: 4, paint: false });
    };
  }
  const spotsShade = (k, F) => {
    if (!(F.L.spots ?? F.cfg.spots)) return;
    const r = T.rng(T.hash(F.seed + 'spots')), prev = k.globalCompositeOperation;
    k.globalCompositeOperation = T.PAINT ? 'multiply' : 'source-over'; k.fillStyle = F.L.spotColor ?? '#2a2624';
    for (let i = 0; i < 6; i++) { k.beginPath(); T.smoothPath(k, T.blobPts(-170 + r() * 330, -320 + r() * 120, 34 + r() * 30, 26 + r() * 20, F.seed + 's' + i, 9, 0.3)); k.fill(); }
    k.globalCompositeOperation = prev;
  };
  const COW = {
    size: 360, unit: 400, legLen: 200, color: '#f4f1ea', maneColor: '#2a2624', hoofColor: '#2e2622', spots: true,
    hip: [-140, -210], shoulder: [130, -206], pivot: [0, -240],
    hindLeg: [100, 84, 26], foreLeg: [96, 84, 26], hindW: [44, 20, 15, 14], foreW: [36, 19, 15, 14],
    body: blob([[-160, -322], [-214, -300], [-228, -236], [-196, -170], [-110, -148], [0, -140], [120, -150], [186, -186], [206, -250], [176, -312], [100, -330], [0, -318], [-80, -324]]),
    neckBase: [168, -270], neckLen: 70, neckAng: -15, neckW: [70, 60, 50], neckArch: 6, headAng: 40, eatAng: 75, sleepAng: 30, runAng: 0,
    head: bovineHead('short'), headScale: 1.2, bodyShade: spotsShade,
    tail: { at: [-218, -296], n: 6, seg: 32, w: [8, 7, 6, 6, 6, 8, 12], base: 95, hz: 0.45, amp: 0.1, flick: 1.6, streamAng: 0.9 },
    drawTail: (ctx, pts, F, c) => { T.outlined(ctx, CK.tube(pts, [8, 7, 6, 6, 6, 5, 4]), c, { line: 6 }); const [x, y] = pts[pts.length - 1]; T.outlined(ctx, leaf(x, y - 6, x + 4, y + 40, 12), F.mane, { line: 5 }); },
    extraMid: (ctx, F) => { if (F.cfg.udder && !F.sleep) { const [x, y] = F.bodyPt([-70, -150]); T.outlined(ctx, (k) => k.ellipse(x, y + 8, 34, 22, 0, 0, TAU), '#efb0a8', { line: 6 }); } },
    udder: true, foot: CK.FEET.cloven, tuck: [60, -50], lieH: 0.5, zzz: [20, -60], sweat: [40, -46], seat: [0, -326], riderSize: 340, saddleW: 120,
    lines: [[[-120, -300], [-170, -250], [-160, -186]]],
  };
  const BULL = { ...COW, color: '#3a2a26', spots: false, udder: false, head: bovineHead('long'), forelock: true, maneColor: '#1e1614',
    body: blob([[-160, -318], [-214, -296], [-228, -236], [-196, -170], [-110, -150], [0, -142], [120, -150], [190, -190], [214, -260], [180, -340], [80, -360], [0, -330], [-80, -324]]) };

  // ---------- sheep ----------
  function sheepHead(ctx, F) {
    const fc = F.cfg.faceColor, line = 7, ear = F.earFlick * 0.4 + F.scared * 0.5, open = (F.chew + (F.talk ? 1 : 0)) * 6;
    ctx.save(); ctx.translate(-4, -8); ctx.rotate(1.5 + ear); T.outlined(ctx, leaf(0, 0, 0, -46, 13), fc, { line }); ctx.restore();
    T.outlined(ctx, blob([[-26, -30], [30, -34], [74, -12], [84, 14], [64, 34 + open], [10, 36], [-26, 18]]), fc, { line });
    T.outlined(ctx, blob(T.blobPts(-6, -30, 40, 26, F.seed + 'tuft', 9, 0.3)), F.col, { line: 6 }); // wool cap
    ctx.fillStyle = '#c9b8b0'; ctx.beginPath(); ctx.ellipse(74, 6, 4, 6, 0, 0, TAU); ctx.fill();
    CK.eye(ctx, 26, -4, 10, eyeOpts(F, { lidColor: fc }));
  }
  const woolPuffs = (seed) => { const r = T.rng(T.hash(seed + 'wool')), out = []; for (let i = 0; i < 14; i++) out.push([-170 + (i % 7) * 56 + r() * 14, -300 + Math.floor(i / 7) * 74 + r() * 16, 44 + r() * 12]); return out; };
  const SHEEP = {
    size: 300, unit: 400, legLen: 170, color: '#f4f1ea', faceColor: '#2c2624', legColor: '#2c2624', hoofColor: '#1e1a18',
    hip: [-120, -178], shoulder: [110, -176], pivot: [0, -230],
    hindLeg: [84, 72, 22], foreLeg: [82, 72, 22], hindW: [20, 13, 10, 11], foreW: [18, 12, 10, 11],
    body: (k) => { k.moveTo(-190, -230); k.quadraticCurveTo(-200, -320, -100, -330); k.quadraticCurveTo(0, -350, 100, -328); k.quadraticCurveTo(200, -310, 196, -230); k.quadraticCurveTo(190, -160, 100, -158); k.quadraticCurveTo(0, -140, -100, -158); k.quadraticCurveTo(-196, -160, -190, -230); k.closePath(); },
    bodyOver: (ctx, F) => { // fleece: overlapping puffs with their own shading
      const pts = woolPuffs(F.seed);
      for (const [x, y, r] of pts) T.outlined(ctx, (k) => k.arc(x, y, r, 0, TAU), F.col, { line: 6, paint: 0.7 });
    },
    neckBase: [150, -270], neckLen: 50, neckAng: -30, neckW: [40, 34, 28], headAng: 50, eatAng: 80, sleepAng: 30, runAng: -10,
    head: sheepHead, tail: { at: [-196, -268], n: 3, seg: 18, w: [16, 16, 14, 10], base: 110, hz: 0.6, amp: 0.15 },
    foot: CK.FEET.cloven, tuck: [50, -40], lieH: 0.55, zzz: [10, -50], sweat: [30, -40],
  };

  // ---------- pig ----------
  function pigHead(ctx, F) {
    const c = F.col, line = 8, ear = F.earFlick * 0.4 + F.scared * 0.4, open = (F.chew + (F.talk ? 1 : 0)) * 10;
    ctx.save(); ctx.translate(0, -36); ctx.rotate(0.3 + ear); T.outlined(ctx, (k) => { k.moveTo(-16, 0); k.lineTo(26, -12); k.quadraticCurveTo(34, 18, 14, 34); k.closePath(); }, sh(c, -0.08), { line }); ctx.restore();
    T.outlined(ctx, blob([[-40, -30], [20, -50], [76, -30], [98, 4], [86, 40 + open], [30, 54], [-30, 40]]), c, { line });
    T.outlined(ctx, (k) => k.ellipse(98, 10, 20, 26, 0, 0, TAU), F.col2, { line: 6 });
    ctx.fillStyle = sh(F.col2, -0.5); for (const ny of [2, 20]) { ctx.beginPath(); ctx.ellipse(102, ny, 4, 6, 0, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = P.ink; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(84, 40 + open); ctx.quadraticCurveTo(60, 48 + open, 46, 36); ctx.stroke();
    CK.eye(ctx, 34, -10, 10, eyeOpts(F));
  }
  const PIG = {
    size: 260, unit: 400, legLen: 120, color: '#f2a0b0', color2: '#f8c4d0', hoofColor: '#5a3a3a',
    hip: [-130, -128], shoulder: [128, -126], pivot: [0, -200],
    hindLeg: [60, 46, 18], foreLeg: [58, 46, 18], hindW: [44, 26, 20, 16], foreW: [40, 24, 19, 16],
    body: blob([[-170, -290], [-230, -240], [-236, -170], [-190, -112], [-80, -96], [60, -96], [170, -116], [222, -170], [214, -250], [150, -296], [40, -306], [-80, -304]]),
    neckBase: [196, -220], neckLen: 30, neckAng: 0, neckW: null, headAng: 10, eatAng: 50, sleepAng: 30, runAng: 0,
    head: pigHead, headScale: 1.35, tail: { at: [-232, -230], n: 5, seg: 12, w: [7, 6, 6, 5, 5, 4], base: 200, curl: 560, hz: 1.4, amp: 0.2 },
    foot: CK.FEET.cloven, tuck: [40, -30], lieH: 0.6, zzz: [20, -50], sweat: [30, -40],
    lines: [[[-150, -260], [-190, -200], [-170, -140]]],
  };

  // ---------- camel ----------
  function camelHead(ctx, F) {
    const c = F.col, line = 8, open = (F.chew + (F.talk ? 1 : 0)) * 8;
    ctx.save(); ctx.translate(-10, -26); ctx.rotate(-0.6 + F.earFlick * 0.4); T.outlined(ctx, leaf(0, 0, -4, -28, 10), c, { line: 6 }); ctx.restore();
    T.outlined(ctx, blob([[-30, -28], [30, -34], [90, -22], [124, 0], [122, 26 + open], [80, 34], [20, 34], [-28, 20]]), c, { line });
    T.outlined(ctx, blob([[86, 14], [128, 14], [128, 36 + open], [92, 40]]), sh(c, -0.1), { line: 0 }); // drooping lip
    ctx.fillStyle = P.ink; ctx.beginPath(); ctx.ellipse(116, -2, 4, 7, 0.4, 0, TAU); ctx.fill();
    CK.eye(ctx, 22, -10, 11, eyeOpts(F, { e: { ...F.e, lid: Math.max(0.5, F.e.lid ?? 0.5) } }));
    ctx.strokeStyle = P.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(8, -26); ctx.lineTo(38, -28); ctx.stroke(); // heavy lashes
  }
  const CAMEL = {
    size: 400, unit: 400, legLen: 250, color: '#d4ae78', maneColor: '#a4804a', hoofColor: '#6a5640',
    hip: [-110, -252], shoulder: [110, -250], pivot: [0, -280],
    hindLeg: [126, 104, 26], foreLeg: [120, 106, 26], hindW: [30, 15, 12, 18], foreW: [26, 14, 12, 18],
    body: blob([[-140, -300], [-180, -280], [-176, -226], [-110, -196], [0, -190], [110, -200], [160, -240], [150, -300], [90, -330], [40, -420], [-30, -430], [-90, -360]]),
    neckBase: [140, -270], neckLen: 170, neckAng: -15, neckW: [44, 32, 28], neckArch: -40, headAng: -10, eatAng: 75, sleepAng: 20, runAng: 0,
    head: camelHead, headScale: 1.2, tail: { at: [-172, -282], n: 4, seg: 22, w: [8, 7, 6, 8, 12], base: 100, hz: 0.6, amp: 0.1 },
    foot: CK.FEET.pad, tuck: [60, -50], lieH: 0.3, zzz: [20, -50], sweat: [30, -40], seat: [20, -420], riderSize: 330, saddleW: 110,
  };

  // ---------- elephant ----------
  function elephantHead(ctx, F) {
    const c = F.col, line = 9, flap = Math.sin(F.lt * 1.7) * 0.08 + F.earFlick * 0.2 + F.scared * 0.3;
    const trunk = F.eat > 0.5 ? 0.9 : Math.sin(F.lt * 1.2) * 0.25 + F.scared * -0.6, open = F.talk ? 10 : 0;
    const tp = CK.tailPts(70, 30, 6, 30, { base: 1.4, t: F.lt, hz: 0.5, lag: 0.5, amp: 0.08, curl: (trunk * 120 + 30) });
    T.outlined(ctx, blob([[-40, -60], [30, -76], [96, -40], [104, 30], [60, 70 + open], [0, 56], [-40, 20]]), c, { line });
    T.outlined(ctx, CK.tube(tp, [26, 22, 19, 16, 14, 12, 11]), c, { line });
    ctx.save(); ctx.translate(10, -20); ctx.rotate(flap); // big ear over the side of the head
    T.outlined(ctx, blob([[0, -70], [-70, -70], [-96, 0], [-80, 80], [-30, 110], [0, 60]]), c, { line, shade: (k) => { k.fillStyle = sh(c, -0.12); k.beginPath(); T.smoothPath(k, [[-10, -50], [-60, -50], [-78, 0], [-66, 64], [-30, 84], [-12, 40]]); k.fill(); } });
    ctx.restore();
    ctx.strokeStyle = sh(c, -0.5); ctx.lineWidth = 3; // trunk wrinkles
    for (let i = 1; i < 6; i++) { const [x, y] = tp[i], [x2, y2] = tp[i + 1], a = Math.atan2(y2 - y, x2 - x) + Math.PI / 2, w = 14; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * w, y + Math.sin(a) * w); ctx.lineTo(x - Math.cos(a) * w * 0.5, y - Math.sin(a) * w * 0.5); ctx.stroke(); }
    if (F.cfg.tusks !== false && F.L.tusks !== false) T.outlined(ctx, (k) => { k.moveTo(56, 42); k.quadraticCurveTo(110, 90, 134, 60); k.quadraticCurveTo(110, 70, 74, 34); k.closePath(); }, '#f3ead2', { line: 6 });
    CK.eye(ctx, 40, -14, 11, eyeOpts(F));
  }
  const ELEPHANT = {
    size: 360, unit: 400, legLen: 160, color: '#8d8f96', color2: '#a9abb2', cycleK: 0.9,
    hip: [-118, -168], shoulder: [118, -170], pivot: [0, -250],
    hindLeg: [80, 64, 20], foreLeg: [80, 66, 20], hindW: [48, 38, 34, 36], foreW: [48, 38, 34, 36],
    body: blob([[-150, -330], [-214, -290], [-232, -210], [-200, -140], [-100, -124], [0, -122], [110, -128], [190, -160], [214, -240], [190, -320], [100, -360], [0, -350], [-80, -350]]),
    neckBase: [196, -260], neckLen: 40, neckAng: -10, neckW: null, headAng: 10, eatAng: 30, sleepAng: 20, runAng: 0,
    head: elephantHead, headScale: 1.45, tail: { at: [-226, -266], n: 5, seg: 20, w: [7, 6, 5, 5, 6, 10], base: 100, hz: 0.5, amp: 0.15, flick: 1.4 },
    foot: CK.FEET.pad, tuck: [40, -30], lieH: 0.6, zzz: [30, -90], sweat: [40, -80], seat: [0, -350], riderSize: 330, saddleW: 150,
    lines: [[[-150, -300], [-190, -230], [-180, -160]], [[120, -320], [150, -250], [140, -170]]],
  };

  CK.register('horse', CK.quad(HORSE));
  CK.register('cow', CK.quad(COW));
  CK.register('bull', CK.quad(BULL));
  CK.register('sheep', CK.quad(SHEEP));
  CK.register('pig', CK.quad(PIG));
  CK.register('camel', CK.quad(CAMEL));
  CK.register('elephant', CK.quad(ELEPHANT));
  CK.SPECIES = { ...(CK.SPECIES || {}), horse: HORSE, cow: COW, bull: BULL, sheep: SHEEP, pig: PIG, camel: CAMEL, elephant: ELEPHANT };
})();
