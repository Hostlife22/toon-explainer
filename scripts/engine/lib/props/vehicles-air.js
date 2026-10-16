// vehicles-air.js — v2 aircraft and lighter-than-air craft. plane (single-engine monoplane) and biplane: propeller
// blur, roll on turns from the path's bank (the wings foreshorten and show their underside), engine smoke when
// `burning`, `contrail`. zeppelin: ribbed envelope, gondola, prop blurs, slow pitch. balloon: striped envelope,
// basket, burner flame bursts on a seeded schedule, pendulum sway. rocket: fins, flickering exhaust flame, smoke
// column as a world trail, launch shake. Origin: the craft's centre (ground contact for balloon / rocket on the pad).
(function () {
  'use strict';
  const T = window.TOON, VK = T.VK, CK = T.CK, P = T.PAL, TAU = Math.PI * 2, D = T.DEG, sh = VK.sh;
  const blob = (pts) => (k) => T.smoothPath(k, pts);
  const poly = (pts) => (k) => { k.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) k.lineTo(pts[i][0], pts[i][1]); k.closePath(); };
  const roll = (S) => T.clamp(S.bank / (60 * D), -1, 1); // -1..1

  function pilot(ctx, L, S, env, x, y, size) {
    if (L.rider && T.layers.bean) { ctx.save(); ctx.translate(x, y); T.layers.bean(ctx, { type: 'bean', who: L.rider, size, legs: false, id: (L.id ?? 'air') + 'p', expr: L.riderExpr, head: 'pilot' }, S.lt, { ...env, st: null }); ctx.restore(); }
    else T.outlined(ctx, (c) => c.arc(x, y - size * 0.22, size * 0.12, Math.PI, 0), '#6a4a2a', { line: 5 });
  }
  // Wing seen edge-on to slightly from below / above as the plane rolls: thickness and offset follow the roll.
  function wing(ctx, x, y, w, t, rl, col, under) {
    const h = t + Math.abs(rl) * w * 0.32, dy = rl * w * 0.12;
    T.outlined(ctx, (c) => c.ellipse(x, y + dy, w / 2, h / 2, 0, 0, TAU), rl > 0.15 ? under : col, { line: 7,
      shade: (c) => { if (Math.abs(rl) > 0.3) { c.fillStyle = L_ROUNDEL; c.beginPath(); c.ellipse(x + w * 0.3, y + dy, h * 0.3, h * 0.3, 0, 0, TAU); c.fill(); } } });
  }
  let L_ROUNDEL = '#2d3f9a';

  VK.register('plane', (ctx, L, S, env) => {
    const k = S.size / 460, col = L.color ?? '#7a8a5a', rl = roll(S);
    L_ROUNDEL = L.roundel ?? '#2d3f9a';
    ctx.scale(k, k); ctx.translate(0, Math.sin(S.lt * 2.2) * 6);
    if (rl <= 0) wing(ctx, 10, 10, 340, 26, rl, col, sh(col, 0.2)); // far side down: wing behind the body
    T.outlined(ctx, poly([[-200, -10], [-250, -86], [-214, -86], [-170, -20]]), sh(col, -0.1), { line: 7 }); // fin
    T.outlined(ctx, (c) => c.ellipse(-210, 4, 60, 12 + Math.abs(rl) * 18, 0, 0, TAU), sh(col, -0.05), { line: 6 }); // tailplane
    T.outlined(ctx, blob([[-230, -6], [-120, -34], [60, -44], [170, -30], [200, 0], [170, 28], [40, 36], [-140, 18], [-230, 6]]), col, { line: 8,
      shade: (c) => { c.fillStyle = sh(col, 0.2); c.fillRect(-200, -40, 380, 10); c.strokeStyle = sh(col, -0.35); c.lineWidth = 3; for (const x of [-100, 0, 100]) { c.beginPath(); c.moveTo(x, -38); c.lineTo(x, 32); c.stroke(); } } });
    T.outlined(ctx, (c) => c.ellipse(170, 0, 30, 30, 0, 0, TAU), sh(col, -0.25), { line: 7 }); // cowling
    T.outlined(ctx, blob([[10, -36], [40, -74], [100, -70], [110, -38]]), '#b8d8e8', { line: 6, paint: false }); // canopy
    pilot(ctx, L, S, env, 64, -26, 120);
    if (rl > 0) wing(ctx, 10, 10, 340, 26, rl, col, sh(col, 0.2)); // near side down: wing in front
    T.outlined(ctx, (c) => c.arc(-150, 0, 13, 0, TAU), L_ROUNDEL, { line: 4 }); T.outlined(ctx, (c) => c.arc(-150, 0, 6, 0, TAU), '#c8323a', { line: 3 });
    VK.propBlur(ctx, 206, 0, 70, S.lt);
    if (L.gear !== false && !S.moving) for (const x of [70, 120]) VK.wheel(ctx, x, 58, 16, 0, { rim: '#8a8f96' });
  }, 460, (L, S) => { const k = S.size / 460, out = []; if (L.contrail) out.push(['contrail', -230 * k, 0, { w: 8 * k * 2 }]); if (L.burning) out.push(['smoke', 140 * k, -10 * k, { color: '#2b2620', every: 0.05, rise: 30, scale: k * 2 }], ['fire', 160 * k, -10 * k, { scale: k * 2 }]); return out; });

  VK.register('biplane', (ctx, L, S, env) => {
    const k = S.size / 440, col = L.color ?? '#b8a070', rl = roll(S);
    L_ROUNDEL = L.roundel ?? '#2d3f9a';
    ctx.scale(k, k); ctx.translate(0, -150 + Math.sin(S.lt * 2.4) * 6);
    if (rl <= 0) { wing(ctx, 0, -64, 380, 22, rl, sh(col, -0.08), sh(col, 0.15)); }
    T.outlined(ctx, poly([[-196, 0], [-246, -64], [-212, -60], [-170, -6]]), sh(col, -0.15), { line: 6 });
    T.outlined(ctx, (c) => c.ellipse(-206, 8, 52, 10 + Math.abs(rl) * 14, 0, 0, TAU), sh(col, -0.08), { line: 6 });
    T.outlined(ctx, blob([[-210, 2], [-60, -34], [130, -22], [176, 0], [140, 24], [-60, 30], [-210, 14]]), col, { line: 8, shade: (c) => { if (T.fillTexture) T.fillTexture(c, null, 'fabric', { rect: [-220, -40, 400, 80], alpha: 0.35 }); } });
    pilot(ctx, L, S, env, -40, -10, 120);
    ctx.strokeStyle = P.ink; ctx.lineWidth = 6; for (const x of [-120, -30, 50, 130]) { ctx.beginPath(); ctx.moveTo(x, -54 + rl * 40); ctx.lineTo(x, 14 - rl * 10); ctx.stroke(); }
    if (rl > 0) wing(ctx, 0, -64, 380, 22, rl, sh(col, -0.08), sh(col, 0.15));
    wing(ctx, -10, 22, 350, 20, rl, col, sh(col, 0.15));
    for (const x of [-110, 110]) { T.outlined(ctx, (c) => c.arc(x, 22 + rl * 40, 15, 0, TAU), L_ROUNDEL, { line: 4 }); T.outlined(ctx, (c) => c.arc(x, 22 + rl * 40, 7, 0, TAU), '#c8323a', { line: 3 }); }
    if (!S.moving || L.gear) { ctx.strokeStyle = P.ink; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-30, 30); ctx.lineTo(0, 70); ctx.lineTo(50, 30); ctx.stroke(); for (const x of [-10, 30]) VK.wheel(ctx, x, 70, 18, VK.wheelAng(S, k, 18), { spokes: 4, rim: '#8a8f96' }); }
    VK.propBlur(ctx, 182, 0, 62, S.lt);
  }, 440, (L, S) => { const k = S.size / 440, out = []; if (L.contrail) out.push(['contrail', -220 * k, -150 * k, { w: 6 * k * 2 }]); if (L.burning) out.push(['smoke', -120 * k, -150 * k, { color: '#2b2620', every: 0.05, rise: 30, scale: k * 2 }]); return out; });

  VK.register('zeppelin', (ctx, L, S, env) => {
    const k = S.size / 700, col = L.color ?? '#b8b4a8';
    ctx.scale(k, k); ctx.translate(0, -160 + Math.sin(S.lt * 0.9) * 8); ctx.rotate(Math.sin(S.lt * 0.6) * 1.5 * D);
    T.outlined(ctx, poly([[-300, -40], [-360, -120], [-320, -40]]), sh(col, -0.15), { line: 6 });
    T.outlined(ctx, poly([[-300, 40], [-360, 120], [-320, 40]]), sh(col, -0.25), { line: 6 });
    T.outlined(ctx, (c) => c.ellipse(0, 0, 340, 96, 0, 0, TAU), col, { line: 9, shade: (c) => { c.strokeStyle = sh(col, -0.25); c.lineWidth = 4; for (let x = -280; x <= 280; x += 56) { const h = 96 * Math.sqrt(1 - (x / 340) ** 2); c.beginPath(); c.moveTo(x, -h); c.quadraticCurveTo(x + 10, 0, x, h); c.stroke(); } c.beginPath(); c.moveTo(-330, 0); c.lineTo(330, 0); c.stroke(); } });
    T.outlined(ctx, poly([[-330, -10], [-390, -60], [-380, 0], [-390, 60], [-330, 10]]), sh(col, -0.1), { line: 6 });
    T.outlined(ctx, (c) => T.rrect(c, -40, 90, 140, 46, 16), '#6a5a4a', { line: 7, shade: (c) => { c.fillStyle = '#e8e0b8'; for (let x = -24; x < 90; x += 30) c.fillRect(x, 102, 18, 16); } });
    if (L.mark) { ctx.fillStyle = L.mark; ctx.fillRect(140, -40, 70, 70); }
    for (const x of [-180, 180]) { T.outlined(ctx, (c) => T.rrect(c, x - 24, 80, 48, 26, 8), '#5a5a5e', { line: 5 }); VK.propBlur(ctx, x - 30, 93, 26, S.lt); }
  }, 700, (L) => (L.burning ? [['smoke', 0, -40, { color: '#2b2620', every: 0.05 }], ['fire', 40, -60, {}]] : []));

  VK.register('balloon', (ctx, L, S, env) => {
    const k = S.size / 300, cols = L.colors ?? [L.color ?? '#d8322e', L.color2 ?? '#f2d03a'], sway = Math.sin(S.lt * 1.3) * 3 * D;
    ctx.scale(k, k); ctx.rotate(sway);
    const burn = CK.event((L.id ?? 'bal') + 'burn', S.lt, 2.2, 1.2, 0.6);
    const env0 = (c) => { c.moveTo(-60, -170); c.bezierCurveTo(-170, -260, -160, -470, 0, -480); c.bezierCurveTo(160, -470, 170, -260, 60, -170); c.closePath(); };
    T.outlined(ctx, env0, cols[0], { line: 8, shade: (c) => { c.fillStyle = cols[1]; for (let i = -2; i <= 2; i += 2) { c.beginPath(); c.moveTo(i * 26, -170); c.quadraticCurveTo(i * 80, -330, i * 28, -480); c.quadraticCurveTo(i * 80 + 30, -330, i * 26 + 24, -170); c.closePath(); c.fill(); } } });
    ctx.strokeStyle = P.ink; ctx.lineWidth = 4; for (const x of [-56, -20, 20, 56]) { ctx.beginPath(); ctx.moveTo(x, -172); ctx.lineTo(x * 0.6, -80); ctx.stroke(); }
    if (burn >= 0) { const f = Math.sin(burn * Math.PI), fl = Math.floor(S.lt * 15) % 2; T.outlined(ctx, (c) => { c.moveTo(-12, -110); c.quadraticCurveTo(-18 - fl * 4, -150, 0, -160 - f * 50); c.quadraticCurveTo(18, -150, 12, -110); c.closePath(); }, '#ffb030', { line: 4, paint: false }); }
    if (L.rider) { ctx.save(); ctx.translate(0, -30); T.layers.bean(ctx, { type: 'bean', who: L.rider, size: 160, legs: false, id: (L.id ?? 'bal') + 'p', pose: L.riderPose ?? 'wave', expr: L.riderExpr }, S.lt, { ...env, st: null }); ctx.restore(); }
    T.outlined(ctx, (c) => T.rrect(c, -50, -86, 100, 86, 10), '#a8743a', { line: 7, shade: (c) => { if (T.fillTexture) T.fillTexture(c, null, 'fabric', { rect: [-50, -86, 100, 86], alpha: 0.5, scale: 0.7 }); } });
  }, 300);

  VK.register('rocket', (ctx, L, S, env) => {
    const k = S.size / 200, col = L.color ?? '#eeeae2', trim = L.color2 ?? '#c8323a', fire = S.moving ? S.speed > 2 || L.ignite : !!L.ignite;
    ctx.scale(k, k);
    if (fire) { const r = T.rng(T.hash('rk' + Math.floor(S.lt * 30))); ctx.translate((r() - 0.5) * 4, (r() - 0.5) * 3); } // launch shake on every frame
    if (!L.path) { ctx.translate(0, -122); ctx.rotate(-Math.PI / 2); } // stands on its fins; a path orients it nose-first instead
    if (fire) { // flame: three flickering tongues (on ones)
      const fl = T.rng(T.hash('fl' + Math.floor(S.lt * 30)));
      for (const [c, s] of [['#ff7a1a', 1], ['#ffd040', 0.7], ['#fff6d0', 0.4]]) { const len = (160 + fl() * 70) * s; T.outlined(ctx, (q) => { q.moveTo(-110, -30 * s); q.quadraticCurveTo(-110 - len * 0.6, -20 * s, -110 - len, 0); q.quadraticCurveTo(-110 - len * 0.6, 20 * s, -110, 30 * s); q.closePath(); }, c, { line: s > 0.9 ? 5 : 0, paint: false }); }
    }
    for (const s of [-1, 1]) T.outlined(ctx, poly([[-60, s * 34], [-120, s * 80], [-120, s * 34]]), trim, { line: 7 });
    T.outlined(ctx, (c) => { c.moveTo(-110, -36); c.lineTo(90, -36); c.quadraticCurveTo(160, -30, 190, 0); c.quadraticCurveTo(160, 30, 90, 36); c.lineTo(-110, 36); c.closePath(); }, col, { line: 8, shade: (c) => { c.fillStyle = trim; c.fillRect(110, -40, 20, 80); c.fillRect(-60, -40, 14, 80); } });
    T.outlined(ctx, (c) => c.arc(40, 0, 18, 0, TAU), '#8ac8e8', { line: 6 });
    T.outlined(ctx, poly([[-40, -2], [-120, -10], [-120, 10]]), trim, { line: 6 });
  }, 200, (L, S) => (S.speed > 2 || L.ignite ? [['smoke', L.path ? -120 * S.size / 200 : 0, L.path ? 0 : -4, { color: '#d8d2c8', every: 0.04, life: 2.6, rise: -10, wind: 0, scale: S.size / 200 * 1.5 }]] : []));
})();
