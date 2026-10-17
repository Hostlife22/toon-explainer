// vehicles-road.js — v2 land vehicles: cars of four eras (model-t ~1908, sedan1920, car1950, car-modern; car1910 maps
// to model-t in the painted look), the WW1 lozenge tank (tread links and road wheels driven by distance, rough-ground
// suspension, exhaust), and animal-drawn chariot and wagon (the team is the v2 creature rig, its gait locked to the
// vehicle's travel). All wheels turn with the distance travelled; bodies ride on VK.bump suspension; exhaust and dust
// are world-space trails (vehicles-kit.js). Units: `size` = overall width; ground y = 0; facing +x.
(function () {
  'use strict';
  const T = window.TOON, VK = T.VK, CK = T.CK, P = T.PAL, TAU = Math.PI * 2, sh = VK.sh;
  const blob = (pts) => (k) => T.smoothPath(k, pts);
  const poly = (pts) => (k) => { k.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) k.lineTo(pts[i][0], pts[i][1]); k.closePath(); };
  const shadow = (ctx, L, cx, hw) => CK && CK.shadow(ctx, L, cx, hw, 0);

  // Seated riders (cast ids or rider objects, see T.vehicleRiderBean). S.k: kind scale; S.o: the kind; S.riderSx / riderK
  // undo a squeezed view; S.riderOff moves the seats (3q: half the car's width in); S.riderView forces the riders' view.
  function riders(ctx, L, S, env, seats, size) {
    const px = env && env.st ? Math.abs(env.st.s * env.st.sy) * (S.k ?? 1) * (S.riderK ?? 1) : 1, off = S.riderOff || [0, 0];
    (L.riders || (L.rider ? [L.rider] : [])).forEach((r, i) => {
      const [x0, y] = seats[Math.min(i, seats.length - 1)], x = x0 + (i >= seats.length ? (i - seats.length + 1) * 40 : 0);
      ctx.save(); ctx.translate(x + off[0], y + off[1]);
      if (S.riderSx) ctx.scale(S.riderSx, S.riderK ?? 1);
      const anchorOf = VK.seatAnchor && S.o ? (B) => VK.seatAnchor(L, S.o, S.k ?? 1, i, B.size, seats) : null;
      const B = T.vehicleRiderBean(L, r, { type: 'bean', size, legs: false, id: (L.id ?? 'veh') + 'r' + i, talk: L.talk, expr: L.riderExpr, pose: L.riderPose, hold: L.riderHold }, anchorOf, px);
      if (S.riderView) B.view = S.riderView;
      T.layers.bean(ctx, B, S.lt, { ...env, st: null });
      ctx.restore();
    });
  }
  VK.riders = riders;
  // Shared car frame: shadow, suspension, wheels, then body(ctx, B) inside the sprung frame. A non-side `S.view`
  // (front, 3q, back, 3q-back) is drawn by vehicles-views.js from the kind's `face` description.
  function car(ctx, L, S0, env, o) {
    const k = S0.size / o.W, S = { ...S0, k, o };
    ctx.scale(k, k);
    if (S.view && S.view !== 'side' && o.face && VK.carView) return VK.carView(ctx, L, S, env, o, k);
    carSide(ctx, L, S, env, o, k);
  }
  function carSide(ctx, L, S, env, o, k) {
    const terrain = L.terrain ?? 'road';
    if (!S.noShadow) shadow(ctx, L, 0, o.W * 0.48);
    const b = VK.bump(S, k, o.wb, terrain), blur = S.speed / Math.max(1, k * S.px * o.r * 18);
    for (const x of o.wheels) VK.wheel(ctx, x, -o.r, o.r, VK.wheelAng(S, k, o.r), { ...o.wheel, blur });
    ctx.save(); ctx.translate(0, b.dy - o.r * 0.12); ctx.rotate(b.pitch * 0.6);
    o.body(ctx, L, S, env, k);
    if (L.lights && !S.noLights) VK.headlight(ctx, o.lamp[0], o.lamp[1], 520, 0.2);
    ctx.restore();
    if (o.front) for (const x of o.wheels) o.front(ctx, x);
  }
  VK.carSide = carSide;
  const trailsCar = (exh, lamp) => (L, S) => {
    const k = S.size / exh[2], out = [], xAt = VK.viewActive && VK.viewActive(L) ? (te) => VK.viewXAt(L, te) : undefined;
    if (L.exhaust !== false) out.push(['exhaust', exh[0] * k, exh[1] * k, { scaleAt: (te) => k * (1 + (S.moving ? T.vehicleMotion(L, te).speed : 0) / 300), ...(xAt ? { xAt } : {}) }]);
    if (L.dust ?? (L.terrain === 'dirt' || L.terrain === 'rough')) out.push(['dust', exh[0] * k * 0.6, -4, {}]);
    return out;
  };

  // ---------- model-t (~1908): tall black tourer, brass radiator and lamps, spoked wheels ----------
  VK.register('model-t', (ctx, L, S, env) => car(ctx, L, S, env, {
    W: 400, wb: 250, r: 46, wheels: [-125, 125], lamp: [190, -150], wheel: { spokes: 12, rim: '#d8c8a0', tyre: '#2a2624' },
    face: { front: 194, rear: 172, cowl: 100, tailX: -150, hw: 100, track: 88, tyre: 20, col: '#23252b', belt: [-172, -124], apron: true, fender: 'arch', back: 'plain',
      grille: { kind: 'radiator', hw: 28, top: -178, bot: -84, color: '#d8a838' }, lamps: { x: 64, y: -150, r: 13, color: '#fff2b0', rim: '#d8a838' },
      tail: { x: 64, y: -140, r: 9 }, cabin: { open: true, top: -312, hw: 108, post: 96, shield: -250 }, seat: { x: 44, y: -110, size: 220 },
      hull: [{ pts: [[-172, -66], [-172, -172], [-118, -172], [-100, -132], [104, -132], [104, -162], [172, -162], [172, -178], [194, -178], [194, -80], [176, -66]] },
        { pts: [[-150, -312], [60, -312], [60, -290], [-150, -290]] }] },
    body(ctx2, L2, S2, env2) {
      const col = L2.color ?? '#23252b', brass = '#d8a838';
      for (const x of [-130, 40]) T.outlined(ctx2, (c) => T.rrect(c, x, -300, 10, 140, 4), '#1a1a1e', { line: 5 }); // roof posts
      T.outlined(ctx2, (c) => T.rrect(c, -150, -312, 210, 22, 8), col, { line: 7 }); // canopy
      riders(ctx2, L2, S2, env2, [[-30, -110], [-110, -110]], 220);
      T.outlined(ctx2, poly([[-170, -70], [-170, -170], [-120, -170], [-100, -130], [60, -130], [80, -180], [104, -180], [104, -130], [170, -130], [178, -70]]), col, { line: 8,
        shade: (c) => { c.strokeStyle = sh(col, 0.3); c.lineWidth = 4; c.beginPath(); c.moveTo(-160, -100); c.lineTo(170, -100); c.stroke(); } });
      T.outlined(ctx2, (c) => T.rrect(c, 104, -160, 74, 70, 8), col, { line: 7 }); // hood
      T.outlined(ctx2, (c) => T.rrect(c, 172, -176, 22, 96, 6), brass, { line: 6 }); // radiator
      T.outlined(ctx2, (c) => c.arc(190, -150, 13, 0, TAU), '#fff2b0', { line: 5 }); // lamp
      ctx2.strokeStyle = P.ink; ctx2.lineWidth = 7; ctx2.beginPath(); ctx2.moveTo(70, -170); ctx2.lineTo(40, -230); ctx2.stroke(); // steering column
      T.outlined(ctx2, (c) => c.ellipse(40, -232, 22, 7, -0.3, 0, TAU), '#3a2e22', { line: 4 });
      for (const x of [-125, 125]) T.outlined(ctx2, (c) => { c.moveTo(x - 66, -66); c.quadraticCurveTo(x, -128, x + 66, -66); c.lineTo(x + 56, -60); c.quadraticCurveTo(x, -112, x - 56, -60); c.closePath(); }, col, { line: 6 }); // fenders
      T.outlined(ctx2, (c) => T.rrect(c, -64, -76, 128, 12, 4), '#2a2a2e', { line: 5 }); // running board
    },
  }), 400, trailsCar([-180, -70, 400]));

  // ---------- sedan1920: long hood, closed cabin, wire wheels, spare at the back ----------
  VK.register('sedan1920', (ctx, L, S, env) => car(ctx, L, S, env, {
    W: 440, wb: 280, r: 44, wheels: [-140, 140], lamp: [214, -148], wheel: { spokes: 16, rim: '#c9ced2', tyre: '#262224' },
    face: { front: 222, rear: 254, cowl: 76, tailX: -186, hw: 104, track: 90, tyre: 20, col: '#6a1e24', col2: '#1e1a1a', belt: [-176, -124], apron: true, fender: 'arch', fenderColor: 'col2', back: 'spare',
      grille: { kind: 'radiator', hw: 26, top: -160, bot: -72, color: '#c9ced2' }, lamps: { x: 70, y: -146, r: 13, color: '#fff2b0', rim: '#c9ced2' },
      tail: { x: 74, y: -150, r: 9 }, cabin: { top: -262, hw: 96, topHw: 86, glass: '#a8c8d8', roof: 'col2' }, seat: { x: 44, y: -130, size: 200 },
      hull: [{ pts: [[-204, -66], [-204, -176], [80, -176], [100, -150], [210, -146], [222, -156], [222, -68]] },
        { pts: [[-190, -172], [-176, -260], [40, -262], [70, -172]], fill: 'col2', glass: true }] },
    body(ctx2, L2, S2, env2) {
      const col = L2.color ?? '#6a1e24', roof = L2.color2 ?? '#1e1a1a';
      if (!S2.noTail) T.outlined(ctx2, (c) => c.arc(-214, -120, 40, 0, TAU), '#262224', { line: 7 }); // spare tyre (the rear face shows it in 3q-back)
      T.outlined(ctx2, poly([[-190, -170], [-176, -260], [40, -262], [70, -170]]), roof, { line: 8 });
      for (const [x0, x1] of [[-166, -70], [-56, 46]]) T.outlined(ctx2, poly([[x0, -176], [x0 + 6, -244], [x1 - 4, -244], [x1, -176]]), '#a8c8d8', { line: 5, paint: false });
      riders(ctx2, L2, S2, env2, [[0, -130], [-110, -130]], 200);
      T.outlined(ctx2, poly([[-200, -66], [-204, -176], [80, -176], [100, -150], [210, -146], [220, -70]]), col, { line: 8,
        shade: (c) => { c.fillStyle = sh(col, 0.25); c.fillRect(-200, -172, 420, 8); c.strokeStyle = sh(col, -0.35); c.lineWidth = 4; for (let x = 120; x < 200; x += 14) { c.beginPath(); c.moveTo(x, -140); c.lineTo(x, -96); c.stroke(); } } });
      T.outlined(ctx2, (c) => T.rrect(c, 204, -156, 18, 88, 5), '#c9ced2', { line: 6 });
      T.outlined(ctx2, (c) => c.arc(214, -148, 12, 0, TAU), '#fff2b0', { line: 5 });
      for (const x of [-140, 140]) T.outlined(ctx2, (c) => { c.moveTo(x - 68, -50); c.quadraticCurveTo(x - 50, -118, x, -116); c.quadraticCurveTo(x + 50, -118, x + 72, -60); c.lineTo(x + 60, -56); c.quadraticCurveTo(x, -100, x - 56, -48); c.closePath(); }, roof, { line: 6 });
      T.outlined(ctx2, (c) => T.rrect(c, -80, -64, 160, 12, 4), roof, { line: 5 });
    },
  }), 440, trailsCar([-210, -60, 440]));

  // ---------- car1950: rounded fenders, two-tone, chrome, whitewalls, tail fins ----------
  VK.register('car1950', (ctx, L, S, env) => car(ctx, L, S, env, {
    W: 460, wb: 290, r: 40, wheels: [-150, 150], lamp: [222, -110], wheel: { rim: '#e8ecee', tyre: '#1e1c1e', white: true },
    face: { front: 246, rear: 246, cowl: 96, tailX: -136, hw: 122, track: 98, tyre: 22, col: '#5ab0b8', col2: '#f4efe4', belt: [-156, -44], round: 40, fender: 'skirt', back: 'fins',
      grille: { kind: 'wide', hw: 64, top: -108, bot: -74, color: '#e8ecee' }, lamps: { x: 92, y: -112, r: 15, color: '#fff6c8', rim: '#e8ecee' },
      tail: { x: 100, y: -126, r: 12 }, bumper: { y: -70, h: 24, hw: 130, color: '#e8ecee' },
      cabin: { top: -232, hw: 100, topHw: 78, glass: '#a8d0de', roof: 'col2' }, seat: { x: 48, y: -110, size: 190 },
      hull: [{ smooth: true, pts: [[-232, -60], [-236, -120], [-210, -168], [-150, -156], [100, -158], [200, -140], [232, -110], [228, -56], [150, -40], [-150, -40]] },
        { smooth: true, pts: [[-140, -150], [-110, -228], [40, -232], [100, -150]], fill: 'col2', glass: true }] },
    body(ctx2, L2, S2, env2) {
      const col = L2.color ?? '#5ab0b8', roof = L2.color2 ?? '#f4efe4';
      T.outlined(ctx2, blob([[-140, -150], [-110, -228], [40, -232], [100, -150]]), roof, { line: 8 });
      T.outlined(ctx2, blob([[-120, -156], [-98, -214], [-24, -216], [-24, -156]]), '#a8d0de', { line: 5, paint: false });
      T.outlined(ctx2, blob([[-10, -156], [-10, -216], [34, -214], [84, -156]]), '#a8d0de', { line: 5, paint: false });
      riders(ctx2, L2, S2, env2, [[30, -110], [-70, -110]], 190);
      T.outlined(ctx2, blob([[-232, -60], [-236, -120], [-210, -168], [-150, -156], [100, -158], [200, -140], [232, -110], [228, -56], [150, -40], [-150, -40]]), col, { line: 8,
        shade: (c) => { c.fillStyle = roof; c.beginPath(); c.moveTo(-220, -110); c.quadraticCurveTo(-60, -126, 140, -112); c.lineTo(140, -100); c.quadraticCurveTo(-60, -112, -220, -98); c.closePath(); c.fill(); } });
      T.outlined(ctx2, (c) => T.rrect(c, 200, -72, 44, 22, 10), '#e8ecee', { line: 5 }); // bumper
      if (!S2.noTail) T.outlined(ctx2, (c) => T.rrect(c, -246, -72, 40, 22, 10), '#e8ecee', { line: 5 });
      T.outlined(ctx2, (c) => c.arc(222, -112, 13, 0, TAU), '#fff6c8', { line: 5 });
      if (!S2.noTail) T.outlined(ctx2, (c) => c.ellipse(-226, -130, 8, 14, 0, 0, TAU), '#e8403a', { line: 4 }); // tail light
      ctx2.strokeStyle = '#e8ecee'; ctx2.lineWidth = 6; ctx2.beginPath(); ctx2.moveTo(-190, -84); ctx2.quadraticCurveTo(0, -94, 190, -86); ctx2.stroke();
    },
    front(ctx2, x) { T.outlined(ctx2, (c) => { c.moveTo(x - 52, -42); c.quadraticCurveTo(x, -102, x + 52, -42); c.closePath(); }, '#1e1c1e', { line: 0, paint: false }); },
  }), 460, trailsCar([-236, -50, 460]));

  // ---------- car-modern: low hatch, alloy wheels, tinted glass, LED lamps ----------
  VK.register('car-modern', (ctx, L, S, env) => car(ctx, L, S, env, {
    W: 440, wb: 290, r: 46, wheels: [-145, 145], lamp: [212, -112], wheel: { rim: '#b8bec4', tyre: '#1c1c1e' },
    face: { front: 224, rear: 222, cowl: 86, tailX: -186, hw: 118, track: 96, tyre: 26, col: '#d8322e', belt: [-152, -42], round: 34, fender: 'flush', back: 'bar',
      grille: { kind: 'slim', hw: 52, top: -102, bot: -84, color: '#1c1c1e' }, lamps: { x: 84, y: -114, kind: 'led' },
      tail: { x: 84, y: -128 }, intake: { y: -70, h: 18, hw: 70 }, cabin: { top: -246, hw: 104, topHw: 80, glass: '#3a4a5a', roof: 'col' },
      seat: { x: 50, y: -120, size: 180 },
      hull: [{ smooth: true, pts: [[-214, -56], [-222, -150], [-140, -164], [80, -166], [200, -132], [222, -84], [214, -46], [-150, -40]] },
        { smooth: true, pts: [[-196, -150], [-170, -232], [-20, -246], [90, -160]], glass: true }] },
    body(ctx2, L2, S2, env2) {
      const col = L2.color ?? '#d8322e';
      T.outlined(ctx2, blob([[-196, -150], [-170, -232], [-20, -246], [90, -160]]), col, { line: 8 });
      T.outlined(ctx2, blob([[-170, -158], [-150, -220], [-40, -228], [-40, -158]]), '#3a4a5a', { line: 5, paint: false });
      T.outlined(ctx2, blob([[-26, -158], [-26, -226], [20, -222], [74, -158]]), '#3a4a5a', { line: 5, paint: false });
      riders(ctx2, L2, S2, env2, [[10, -120], [-100, -120]], 180);
      T.outlined(ctx2, blob([[-214, -56], [-222, -150], [-140, -164], [80, -166], [200, -132], [222, -84], [214, -46], [-150, -40]]), col, { line: 8,
        shade: (c) => { c.strokeStyle = sh(col, -0.35); c.lineWidth = 4; c.beginPath(); c.moveTo(-40, -150); c.lineTo(-40, -60); c.moveTo(-200, -110); c.quadraticCurveTo(0, -120, 200, -104); c.stroke(); } });
      T.outlined(ctx2, (c) => { c.moveTo(196, -124); c.lineTo(224, -110); c.lineTo(196, -102); c.closePath(); }, '#f6fbff', { line: 4 });
      if (!S2.noTail) T.outlined(ctx2, (c) => T.rrect(c, -224, -138, 16, 24, 6), '#e8303a', { line: 4 });
      for (const x of [-145, 145]) { ctx2.fillStyle = '#141416'; ctx2.beginPath(); ctx2.arc(x, -46, 58, Math.PI, 0); ctx2.lineTo(x + 58, -40); ctx2.lineTo(x - 58, -40); ctx2.fill(); }
    },
  }), 440, trailsCar([-214, -46, 440]));

  // car1910 in the painted look / with path: the model-t drawing with the classic colour
  VK.register('car1910', (ctx, L, S, env) => VK.FN['model-t'](ctx, { ...L, color: L.color ?? '#2f3e5a' }, { ...S, size: S.size * 1.05 }, env), 380, (L, S) => VK.TRAILS['model-t'](L, S));

  // ---------- tank: WW1 lozenge, tread links and road wheels driven by the distance ----------
  function along(pts, step, phase) {
    const out = []; let acc = -phase;
    for (let i = 0; i < pts.length; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length], len = Math.hypot(x1 - x0, y1 - y0);
      for (let d = ((step - (((acc % step) + step) % step)) % step); d < len; d += step) out.push([x0 + ((x1 - x0) * d) / len, y0 + ((y1 - y0) * d) / len, Math.atan2(y1 - y0, x1 - x0)]);
      acc += len;
    }
    return out;
  }
  VK.register('tank', (ctx, L, S) => {
    const k = S.size / 560, col = L.color ?? '#7d6a52', tread = '#4a3b2c';
    ctx.scale(k, k);
    shadow(ctx, L, 0, 290);
    const b = VK.bump(S, k, 420, L.terrain ?? 'rough');
    ctx.save(); ctx.translate(0, b.dy * 0.5); ctx.rotate(b.pitch * 0.5);
    const outer = [[-272, -72], [-236, -218], [150, -246], [288, -136], [258, -8], [-206, 0]], inner = [[-238, -80], [-212, -192], [140, -216], [248, -132], [226, -34], [-192, -28]];
    T.outlined(ctx, poly(outer), tread, { line: 9 });
    const d = S.dist / Math.max(1e-6, k * S.px);
    ctx.fillStyle = '#2a1c15';
    for (const [x, y, a] of along(outer, 26, -d)) { ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillRect(-5, -11, 10, 15); ctx.restore(); }
    for (const x of [-170, -100, -30, 40, 110, 180]) VK.wheel(ctx, x, -22, 16, d / 16, { rim: '#6a5a48', tyre: '#3a2e22', spokes: 4 });
    T.outlined(ctx, poly(inner), col, { line: 7, shade: (c) => { c.fillStyle = sh(col, -0.2); c.fillRect(-240, -96, 500, 70); if (T.fillTexture) T.fillTexture(c, poly(inner), 'stone', { alpha: 0.18, scale: 0.6 }); } });
    ctx.fillStyle = '#3a2e22';
    for (let x = -170; x <= 180; x += 40) for (const y of [-160, -52]) { ctx.beginPath(); ctx.arc(x, y, 4.5, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = sh(col, -0.35); ctx.lineWidth = 4; for (const x of [-120, 0, 120]) { ctx.beginPath(); ctx.moveTo(x, -200); ctx.lineTo(x, -40); ctx.stroke(); }
    T.outlined(ctx, (c) => T.rrect(c, -74, -154, 128, 92, 10), sh(col, 0.08), { line: 7 }); // sponson
    T.outlined(ctx, (c) => T.rrect(c, 46, -126, 116, 18, 6), '#5a5650', { line: 6 });
    T.outlined(ctx, (c) => T.rrect(c, -154, -146, 52, 74, 6), sh(col, -0.1), { line: 5 });
    T.outlined(ctx, (c) => T.rrect(c, -40, -262, 70, 34, 6), sh(col, -0.15), { line: 6 }); // cupola
    T.outlined(ctx, (c) => T.rrect(c, -150, -270, 20, 44, 4), '#3a3530', { line: 5 }); // exhaust stack
    if (L.burning && T.drawFlame) { ctx.save(); ctx.translate(0, -200); T.drawFlame(ctx, 220, S.lt, 'tankfire'); ctx.restore(); }
    ctx.restore();
  }, 560, (L, S) => { const k = S.size / 560; return [...(L.smoke !== false ? [['smoke', -140 * k, -276 * k, { color: L.burning ? '#2b2620' : '#6a6460', size: 18, every: L.burning ? 0.07 : 0.16 }]] : []), ...(L.dust !== false ? [['dust', -200 * k, -4, {}], ['dust', 200 * k, -4, {}]] : [])]; });

  // ---------- chariot and wagon: animal team + spoked wheels; the team trots / gallops with the travel ----------
  function team(ctx, L, S, env, k, front, o) {
    const n = L.team ?? o.team, animal = L.animal ?? o.animal, fn = T.CREATURES[animal];
    if (!fn) throw new Error('vehicle animal: unknown creature ' + animal);
    for (let i = n - 1; i >= 0; i--) { // far animals first, offset up and ahead
      const far = i % 2 === 1, row = Math.floor(i / 2);
      ctx.save(); ctx.translate(front + row * o.rowGap + (far ? 24 : 0), far ? -14 : 0); ctx.scale(1 / k, 1 / k);
      if (far) ctx.filter = 'brightness(0.82)';
      fn(ctx, { type: 'creature', kind: animal, id: (L.id ?? 'veh') + 'a' + i, size: o.animalSize * S.size / o.W, rig: 'v2', contact: L.contact, path: L.path, move: L.move, x: L.x, y: L.y,
        gait: L.gait ?? (S.moving ? undefined : S.driving ? 'trot' : 'idle'), color: (L.animalColors || [])[i] ?? L.animalColor, rider: null, tack: true, flip: L.flip, dir: L.dir, at: L.at }, S.lt, env);
      ctx.restore();
    }
  }
  VK.register('chariot', (ctx, L, S, env) => {
    const k = S.size / 640, col = L.color ?? '#b8862e', trim = L.color2 ?? '#7a1e1e';
    ctx.scale(k, k);
    shadow(ctx, L, -150, 120);
    team(ctx, L, S, env, k, 70, { team: 2, animal: 'horse', animalSize: 240, rowGap: 160, W: 640 });
    ctx.strokeStyle = '#5a3a20'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-110, -90); ctx.quadraticCurveTo(0, -120, 120, -186); ctx.stroke(); // pole to the yoke
    const b = VK.bump(S, k, 60, L.terrain ?? 'dirt'), a = VK.wheelAng(S, k, 72);
    ctx.save(); ctx.translate(0, b.dy);
    if (L.rider) { ctx.save(); ctx.translate(-190, -90); T.layers.bean(ctx, { type: 'bean', who: L.rider, size: 300, legs: false, id: (L.id ?? 'ch') + 'drv', pose: L.riderPose ?? 'point', expr: L.riderExpr, hold: L.riderHold }, S.lt, { ...env, st: null }); ctx.restore(); }
    T.outlined(ctx, (c) => { c.moveTo(-250, -80); c.lineTo(-250, -150); c.quadraticCurveTo(-200, -230, -100, -200); c.quadraticCurveTo(-90, -130, -100, -80); c.closePath(); }, col, { line: 8,
      shade: (c) => { c.strokeStyle = trim; c.lineWidth = 12; c.beginPath(); c.moveTo(-250, -112); c.quadraticCurveTo(-180, -120, -100, -116); c.stroke(); c.fillStyle = '#e8c860'; c.beginPath(); c.arc(-170, -160, 16, 0, TAU); c.fill(); } });
    ctx.restore();
    VK.wheel(ctx, -170, -72, 72, a, { spokes: 8, rim: '#c8a060', tyre: '#5a3a20', spokeColor: '#5a3a20' });
  }, 640, (L, S) => (L.dust !== false ? [['dust', -170 * S.size / 640, -4, {}], ['dust', 60 * S.size / 640, -4, { scale: 1.3 }]] : []));

  VK.register('wagon', (ctx, L, S, env) => {
    const k = S.size / 760, wood = L.color ?? '#8a5a32', canvas = L.color2 ?? '#efe6d0';
    ctx.scale(k, k);
    shadow(ctx, L, -120, 200);
    team(ctx, L, S, env, k, 130, { team: 2, animal: 'horse', animalSize: 250, rowGap: 160, W: 760 });
    ctx.strokeStyle = '#5a3a20'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(-10, -96); ctx.lineTo(160, -170); ctx.stroke();
    const b = VK.bump(S, k, 300, L.terrain ?? 'dirt');
    ctx.save(); ctx.translate(0, b.dy); ctx.rotate(b.pitch * 0.7);
    VK.wheel(ctx, -230, -66, 62, VK.wheelAng(S, k, 62), { spokes: 10, rim: '#b88a52', tyre: '#3a2a20', spokeColor: '#4a3020' }); // far wheels peek out
    if (L.rider) { ctx.save(); ctx.translate(-30, -150); T.layers.bean(ctx, { type: 'bean', who: L.rider, size: 260, legs: false, id: (L.id ?? 'wg') + 'drv', pose: L.riderPose ?? 'hold', expr: L.riderExpr, hold: L.riderHold }, S.lt, { ...env, st: null }); ctx.restore(); }
    if (L.cover !== false) T.outlined(ctx, (c) => { c.moveTo(-330, -150); c.quadraticCurveTo(-340, -330, -250, -320); c.quadraticCurveTo(-160, -360, -70, -320); c.quadraticCurveTo(10, -330, -10, -150); c.closePath(); }, canvas, { line: 8,
      shade: (c) => { c.strokeStyle = sh(canvas, -0.3); c.lineWidth = 5; for (const x of [-250, -170, -90]) { c.beginPath(); c.moveTo(x, -330); c.quadraticCurveTo(x + 6, -240, x, -150); c.stroke(); } } });
    else if (L.load && T.drawProp) { ctx.save(); ctx.translate(-170, -200); T.drawProp(ctx, L.load, 150, S.lt, {}); ctx.restore(); }
    T.outlined(ctx, (c) => T.rrect(c, -350, -160, 360, 80, 8), wood, { line: 8, shade: (c) => { if (T.fillTexture) T.fillTexture(c, (q) => T.rrect(q, -350, -160, 360, 80, 8), 'wood', { alpha: 0.4 }); c.strokeStyle = sh(wood, -0.35); c.lineWidth = 4; c.beginPath(); c.moveTo(-350, -120); c.lineTo(10, -120); c.stroke(); } });
    ctx.restore();
    VK.wheel(ctx, -290, -62, 62, VK.wheelAng(S, k, 62), { spokes: 10, rim: '#c89a62', tyre: '#3a2a20', spokeColor: '#4a3020' });
    VK.wheel(ctx, -50, -50, 50, VK.wheelAng(S, k, 50), { spokes: 10, rim: '#c89a62', tyre: '#3a2a20', spokeColor: '#4a3020' });
  }, 760, (L, S) => (L.dust !== false ? [['dust', -290 * S.size / 760, -4, {}], ['dust', 160 * S.size / 760, -4, { scale: 1.3 }]] : []));
})();
