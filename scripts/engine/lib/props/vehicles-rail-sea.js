// vehicles-rail-sea.js — v2 rail and sea vehicles. locomotive (and `train` in the painted look): steam engine whose
// driving wheels, coupling and connecting rods turn with the distance, chimney smoke and cylinder steam as world
// trails, `cars` carriages that sway with a lag. ship (`style`: liner | warship | steamer): funnels with smoke, hull
// heave and pitch on the swell, bow wave and spray, a foam wake left on the water. sailship: bellied sails and
// streaming pennants. submarine: conning tower, periscope, prop blur, bubbles; `depth` (0 surfaced .. 1 under).
// Units: `size` = overall width; rails / waterline at y = 0; facing +x.
(function () {
  'use strict';
  const T = window.TOON, VK = T.VK, CK = T.CK, P = T.PAL, TAU = Math.PI * 2, D = T.DEG, sh = VK.sh;
  const blob = (pts) => (k) => T.smoothPath(k, pts);
  const poly = (pts) => (k) => { k.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) k.lineTo(pts[i][0], pts[i][1]); k.closePath(); };

  // ---------- locomotive ----------
  const ENG = 380, CAR = 300; // engine length, carriage pitch (local units)
  function locoWidth(L) { return ENG + 140 + (L.cars ?? 2) * CAR; }
  function locomotive(ctx, L, S, env) {
    const cars = L.cars ?? 2, W = locoWidth(L), k = S.size / W, col = L.color ?? '#2c2e34', red = L.color2 ?? '#a8282a';
    ctx.scale(k, k);
    const x0 = W / 2 - ENG; // engine's rear x (the engine leads at the right)
    if (CK) CK.shadow(ctx, L, 0, W * 0.5);
    const d = S.dist / Math.max(1e-6, k * S.px), sway = (i) => Math.sin(d / 90 + i * 1.3) * Math.min(1, S.speed / 200) * 2.5;
    ctx.strokeStyle = '#3a3a3e'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-W / 2 - 40, -2); ctx.lineTo(W / 2 + 40, -2); ctx.stroke(); // rail
    for (let i = cars - 1; i >= 0; i--) { // carriages behind the tender
      const cx = x0 - 140 - (i + 1) * CAR + 10, cc = L.carColor ?? '#5a3a2a';
      ctx.save(); ctx.translate(0, sway(i)); ctx.rotate(sway(i + 0.5) * 0.002);
      T.outlined(ctx, (c) => T.rrect(c, cx, -232, 280, 176, 14), cc, { line: 7, shade: (c) => { c.fillStyle = sh(cc, -0.25); c.fillRect(cx, -96, 280, 40); if (T.fillTexture) T.fillTexture(c, null, 'wood', { rect: [cx, -232, 280, 176], alpha: 0.3 }); } });
      T.outlined(ctx, (c) => { c.moveTo(cx - 12, -230); c.quadraticCurveTo(cx + 140, -272, cx + 292, -230); c.closePath(); }, sh(cc, -0.4), { line: 6 });
      for (let w = 0; w < 4; w++) T.outlined(ctx, (c) => T.rrect(c, cx + 22 + w * 64, -206, 44, 56, 6), '#f2e2b0', { line: 5, paint: false });
      ctx.restore();
      ctx.strokeStyle = P.ink; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(cx + 280, -76); ctx.lineTo(cx + 310, -76); ctx.stroke();
      for (const wx of [cx + 50, cx + 230]) VK.wheel(ctx, wx, -34, 32, d / 32, { spokes: 6, rim: '#2a2626', tyre: '#1a1818', spokeColor: '#5a5a5e' });
    }
    // tender
    const tx = x0 - 140;
    T.outlined(ctx, (c) => T.rrect(c, tx, -200, 130, 150, 8), col, { line: 7 });
    T.outlined(ctx, blob(T.blobPts(tx + 65, -204, 60, 20, 'coal', 8, 0.3)), '#1a1a1c', { line: 5 });
    for (const wx of [tx + 32, tx + 98]) VK.wheel(ctx, wx, -30, 28, d / 28, { spokes: 6, rim: '#2a2626', tyre: '#1a1818', spokeColor: '#5a5a5e' });
    // engine: cab, boiler, smokebox, chimney, dome, cowcatcher
    const ex = x0;
    T.outlined(ctx, (c) => T.rrect(c, ex, -292, 110, 236, 10), red, { line: 8 });
    T.outlined(ctx, (c) => T.rrect(c, ex - 10, -306, 130, 22, 8), col, { line: 7 });
    T.outlined(ctx, (c) => T.rrect(c, ex + 22, -262, 62, 58, 6), '#f2e2b0', { line: 5, paint: false });
    if (L.rider) { ctx.save(); ctx.translate(ex + 56, -150); T.layers.bean(ctx, { type: 'bean', who: L.rider, size: 170, legs: false, id: (L.id ?? 'loco') + 'drv', look: L.riderLook }, S.lt, { ...env, st: null }); ctx.restore(); T.outlined(ctx, (c) => T.rrect(c, ex, -204, 110, 30, 4), red, { line: 6 }); }
    T.outlined(ctx, (c) => T.rrect(c, ex + 100, -222, 250, 116, 52), col, { line: 8, shade: (c) => { c.fillStyle = sh(col, 0.25); c.fillRect(ex + 100, -212, 250, 18); c.strokeStyle = '#c9a24a'; c.lineWidth = 6; for (const bx of [ex + 170, ex + 250]) { c.beginPath(); c.moveTo(bx, -222); c.lineTo(bx, -106); c.stroke(); } } });
    T.outlined(ctx, (c) => T.rrect(c, ex + 320, -236, 60, 136, 14), sh(col, -0.15), { line: 7 });
    T.outlined(ctx, (c) => { c.moveTo(ex + 326, -236); c.lineTo(ex + 316, -306); c.lineTo(ex + 378, -306); c.lineTo(ex + 366, -236); c.closePath(); }, col, { line: 7 });
    T.outlined(ctx, (c) => c.arc(ex + 220, -226, 26, Math.PI, 0), '#c9a24a', { line: 6 });
    T.outlined(ctx, (c) => c.arc(ex + 372, -168, 14, 0, TAU), '#fff2b0', { line: 5 });
    T.outlined(ctx, poly([[ex + 360, -96], [ex + 420, -14], [ex + 360, -14]]), red, { line: 6 });
    T.outlined(ctx, (c) => T.rrect(c, ex + 300, -120, 70, 46, 10), sh(col, 0.1), { line: 6 }); // cylinder
    // driving wheels + rods (crank pin at 0.55 r, phase locked to the wheel angle)
    const R = 52, a = d / R, wheels = [ex + 140, ex + 252], pin = (x) => [x + Math.cos(a) * R * 0.55, -R - 4 + Math.sin(a) * R * 0.55];
    for (const wx of wheels) VK.wheel(ctx, wx, -R - 4, R, a, { spokes: 12, rim: red, tyre: '#1a1818', spokeColor: sh(red, -0.4) });
    VK.wheel(ctx, ex + 340, -34, 30, d / 30, { spokes: 8, rim: red, tyre: '#1a1818', spokeColor: sh(red, -0.4) });
    const [p0, p1] = wheels.map(pin);
    ctx.lineCap = 'round';
    for (const [w, c] of [[16, P.ink], [9, '#b8bcc2']]) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(...p0); ctx.lineTo(...p1); ctx.stroke(); ctx.beginPath(); ctx.moveTo(...p1); ctx.lineTo(ex + 330, -97); ctx.stroke(); }
    if (L.lights) VK.headlight(ctx, ex + 372, -168, 600, 0.18);
  }
  const locoTrails = (L, S) => {
    const W = locoWidth(L), k = S.size / W, ex = W / 2 - ENG;
    const out = [];
    const speedAt = (te) => (S.moving ? T.vehicleMotion(L, te).speed : VK.inWin(L.drive, te - (S.slt - S.lt)) ? 220 : 0);
    if (L.smoke !== false) out.push(['smoke', (ex + 347) * k, -312 * k, { color: L.smokeColor ?? '#6e6a68', scale: k * 1.5, rise: 240, every: 0.08, keep: (te) => 1 - 0.45 * T.clamp(speedAt(te) / 300) }]);
    if (L.steam !== false) out.push(['steam', (ex + 330) * k, -84 * k, { scale: k * 1.4, every: 0.25, life: 0.8, rise: 20, wind: -60, when: (te) => speedAt(te) > 2 }]);
    return out;
  };
  VK.register('locomotive', locomotive, 900, locoTrails);
  VK.register('train', locomotive, 900, locoTrails);

  // ---------- ships ----------
  function sea(ctx, L, S, k, len) { // rock on the swell; returns the hull frame transform already applied
    const r = VK.rock(S, k, len, L.rock != null ? L.rock / 2.5 : 1);
    ctx.translate(0, r.dy); ctx.rotate(r.pitch);
    return r;
  }
  function bowWave(ctx, x, S, k, lt) { // foam curl at the bow, bigger with speed; spray droplets on a 0.6 s loop
    const v = T.clamp(S.speed / (220 * k * S.px + 1e-6)), h = 14 + v * 34;
    T.outlined(ctx, (c) => { c.moveTo(x - 60, 0); c.quadraticCurveTo(x, -h, x + 22 + v * 30, -6); c.quadraticCurveTo(x + 10, 10, x - 60, 10); c.closePath(); }, '#f4fbff', { line: 5, paint: false });
    if (v > 0.15) for (let i = 0; i < 6; i++) { const p = CK.fract(lt / 0.6 + i / 6), r = T.rng(T.hash('spray' + i))(); ctx.save(); ctx.globalAlpha *= (1 - p) * v; T.outlined(ctx, (c) => c.arc(x + 10 + p * (40 + r * 60), -h - p * (50 + r * 40) + p * p * 90, 5 + r * 5, 0, TAU), '#ffffff', { line: 3, paint: false }); ctx.restore(); }
  }
  function ship(ctx, L, S, env) {
    const style = L.style ?? 'liner', k = S.size / 720, hull = L.color ?? (style === 'warship' ? '#6a7078' : '#1e1e24'), top = L.color2 ?? (style === 'warship' ? '#8a9098' : '#f2efe6');
    ctx.scale(k, k);
    ctx.save(); sea(ctx, L, S, k, 700);
    const funnel = L.funnel ?? (style === 'warship' ? '#5a6068' : '#d8a03a');
    if (style === 'warship') {
      T.outlined(ctx, poly([[-170, -150], [-150, -230], [60, -230], [80, -150]]), top, { line: 7 });
      T.outlined(ctx, (c) => T.rrect(c, -40, -300, 60, 70, 6), top, { line: 6 });
      ctx.strokeStyle = P.ink; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-10, -300); ctx.lineTo(-10, -400); ctx.moveTo(-40, -370); ctx.lineTo(20, -370); ctx.stroke();
      for (const [x, dir] of [[180, 1], [-250, -1]]) { T.outlined(ctx, (c) => c.ellipse(x, -150, 50, 26, 0, Math.PI, 0), top, { line: 6 }); T.outlined(ctx, (c) => T.rrect(c, x + (dir > 0 ? 20 : -130), -170, 110, 14, 6), '#4a4e54', { line: 5 }); }
      for (const fx of [-90, 0]) T.outlined(ctx, (c) => T.rrect(c, fx - 22, -300, 44, 80, 6), funnel, { line: 6 });
    } else {
      for (const [y, w] of [[-150, 520], [-205, 400], [-255, 270]]) T.outlined(ctx, (c) => T.rrect(c, -w / 2 - 40, y - 56, w, 60, 6), top, { line: 7, shade: (c) => { c.fillStyle = '#3a4a5a'; for (let x = -w / 2 - 20; x < w / 2 - 50; x += 34) c.fillRect(x, y - 40, 18, 18); } });
      for (const fx of [-170, -60, 50]) T.outlined(ctx, (c) => T.rrect(c, fx - 28, -400, 56, 120, 8), funnel, { line: 7, shade: (c) => { c.fillStyle = '#1e1a18'; c.fillRect(fx - 30, -400, 60, 26); } });
    }
    T.outlined(ctx, (c) => { c.moveTo(-360, -150); c.lineTo(330, -150); c.lineTo(370, -170); c.quadraticCurveTo(350, -60, 300, 0); c.lineTo(-320, 0); c.quadraticCurveTo(-360, -60, -360, -150); c.closePath(); }, hull, { line: 9,
      shade: (c) => { c.fillStyle = L.boot ?? '#a8282a'; c.fillRect(-380, -34, 760, 40); c.fillStyle = sh(hull, 0.25); for (let x = -300; x < 300; x += 46) { c.beginPath(); c.arc(x, -110, 7, 0, TAU); c.fill(); } } });
    if (L.name) T.toonText && T.toonText(ctx, L.name, 250, -100, { size: 22, color: '#f2efe6' });
    if (L.wake !== false) bowWave(ctx, 330, S, k, S.lt);
    ctx.restore();
    T.outlined(ctx, (c) => c.ellipse(0, 4, 380, 12, 0, 0, TAU), 'rgba(244,251,255,0.55)', { line: 0, paint: false }); // waterline foam
  }
  const shipTrails = (L, S) => {
    const k = S.size / 720, out = [], warship = (L.style ?? 'liner') === 'warship';
    if (L.smoke !== false) for (const fx of warship ? [-90, 0] : [-170, -60, 50]) out.push(['smoke', fx * k, (warship ? -305 : -405) * k, { color: L.smokeColor ?? '#55504c', scale: k * 1.4, rise: 180, wind: -50 }]);
    if (L.wake !== false) out.push(['wake', -330 * k, 4, { scale: k * 3 }]);
    return out;
  };
  VK.register('ship', ship, 720, shipTrails);

  function sailship(ctx, L, S) {
    const k = S.size / 600, sail = L.color ?? '#f1e6cc', hull = L.color2 ?? '#7a4a2a';
    ctx.scale(k, k);
    ctx.save(); sea(ctx, L, S, k, 520);
    const wind = 0.6 + T.clamp(S.speed / 200) * 0.4, flut = (i) => Math.sin(S.lt * 9 + i) * 6;
    ctx.strokeStyle = '#5a3a26'; ctx.lineWidth = 11; ctx.lineCap = 'round';
    for (const [mx, h] of [[-120, 330], [30, 420], [170, 290]]) { ctx.beginPath(); ctx.moveTo(mx, -120); ctx.lineTo(mx, -120 - h); ctx.stroke(); }
    [[-120, 260, 160], [30, 340, 200], [170, 230, 130]].forEach(([mx, h, w], i) => { // bellied square sails, two tiers
      for (const [y0, y1] of [[-120 - h, -120 - h * 0.52], [-120 - h * 0.48, -150]]) {
        const bell = (y1 - y0) * 0.22 * wind;
        T.outlined(ctx, (c) => { c.moveTo(mx - w / 2, y0); c.lineTo(mx + w / 2, y0); c.quadraticCurveTo(mx + w / 2 + bell, (y0 + y1) / 2, mx + w / 2 - 4, y1); c.quadraticCurveTo(mx, y1 + bell * 0.4, mx - w / 2 + 4, y1); c.quadraticCurveTo(mx - w / 2 + bell, (y0 + y1) / 2, mx - w / 2, y0); c.closePath(); }, sail, { line: 6,
          shade: (c) => { if (i === 1 && L.cross) { c.fillStyle = L.crossColor ?? P.red; c.fillRect(mx - 14, y0 + 20, 28, y1 - y0 - 40); c.fillRect(mx - w * 0.3, (y0 + y1) / 2 - 14, w * 0.6, 28); } } });
      }
      T.outlined(ctx, (c) => { c.moveTo(mx, -125 - h - 70); c.lineTo(mx - 70, -125 - h - 70 + flut(i)); c.lineTo(mx, -125 - h - 50); c.closePath(); }, L.flag ?? '#c8323a', { line: 4 }); // pennant streams back
    });
    T.outlined(ctx, (c) => { c.moveTo(-300, -190); c.lineTo(-220, -170); c.lineTo(200, -150); c.lineTo(300, -200); c.quadraticCurveTo(270, -40, 190, -6); c.lineTo(-200, -6); c.quadraticCurveTo(-280, -70, -300, -190); c.closePath(); }, hull, { line: 9,
      shade: (c) => { if (T.fillTexture) T.fillTexture(c, null, 'wood', { rect: [-310, -210, 620, 210], alpha: 0.45 }); c.strokeStyle = '#e2b63a'; c.lineWidth = 6; c.beginPath(); c.moveTo(-280, -140); c.lineTo(270, -150); c.stroke(); c.fillStyle = '#2a1a10'; for (let x = -200; x < 200; x += 60) c.fillRect(x, -110, 22, 16); } });
    if (L.wake !== false) bowWave(ctx, 270, S, k, S.lt);
    ctx.restore();
  }
  VK.register('sailship', sailship, 600, (L, S) => (L.wake !== false ? [['wake', -260 * S.size / 600, 4, { scale: S.size / 600 * 3 }]] : []));

  // submarine (v2): depth 0..1 lowers it under a translucent water tint; bubbles and prop blur
  VK.register('submarine', (ctx, L, S) => {
    const k = S.size / 620, col = L.color ?? '#5d6a72', depth = T.num(L.depth, S.lt, 0);
    ctx.scale(k, k);
    ctx.save(); ctx.translate(0, depth * 160); sea(ctx, L, S, k, 560 * (1 - depth * 0.8));
    T.outlined(ctx, (c) => T.rrect(c, -40, -236, 130, 96, 18), col, { line: 7 });
    ctx.strokeStyle = P.ink; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(40, -236); ctx.lineTo(40, -300 - (L.periscope ? 40 : 0)); ctx.lineTo(70, -300 - (L.periscope ? 40 : 0)); ctx.stroke();
    T.outlined(ctx, (c) => c.ellipse(0, -100, 290, 72, 0, 0, TAU), col, { line: 8, shade: (c) => { c.strokeStyle = sh(col, -0.3); c.lineWidth = 4; for (let x = -200; x <= 200; x += 80) { c.beginPath(); c.moveTo(x, -170); c.lineTo(x, -30); c.stroke(); } c.fillStyle = sh(col, 0.25); for (let x = -220; x <= 200; x += 36) { c.beginPath(); c.arc(x, -150, 4, 0, TAU); c.fill(); } } });
    T.outlined(ctx, poly([[-280, -100], [-340, -160], [-330, -100], [-340, -40]]), sh(col, -0.1), { line: 6 });
    if (L.face) { CK.eye(ctx, 190, -124, 16, { e: CK.expr(L.face === 'angry' ? 'angry' : 'neutral'), blink: CK.blink(L.id ?? 'sub', S.lt), look: [0.6, 0], lidColor: col }); ctx.strokeStyle = P.ink; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(170, -84); ctx.quadraticCurveTo(210, L.face === 'angry' ? -96 : -70, 250, -86); ctx.stroke(); }
    VK.propBlur(ctx, -350, -100, 46, S.lt * (0.4 + T.clamp(S.speed / 200)), { flat: 0.2 });
    for (let i = 0; i < 6; i++) { const p = CK.fract(S.lt / 1.4 + i / 6); ctx.save(); ctx.globalAlpha *= 1 - p; T.outlined(ctx, (c) => c.arc(-360 - p * 120, -100 - p * 140 + Math.sin(p * 8 + i) * 10, 6 + p * 10, 0, TAU), 'rgba(220,240,255,0.5)', { line: 3, paint: false }); ctx.restore(); }
    ctx.restore();
    if (depth > 0) { ctx.save(); ctx.globalAlpha *= T.clamp(depth) * 0.55; ctx.fillStyle = L.water ?? '#2a6a8a'; ctx.fillRect(-420, -6, 840, 400); ctx.restore(); }
  }, 620, (L, S) => (L.wake !== false ? [['wake', -300 * S.size / 620, 4, { scale: S.size / 620 * 2.5, when: (te) => T.num(L.depth, te - (S.slt - S.lt), 0) < 0.3 }]] : []));
})();
