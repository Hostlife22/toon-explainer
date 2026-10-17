// vehicles.js — side-view vehicles in the toon style: tank, 1910 car, train, paddle steamer, submarine, junk, caravel,
// rowboat, biplane, cannon, cart. Layer: { type:'vehicle', kind, size, drive:[[t0,t1]], dir, burning, color, riders, fire }.
// Origin = ground/waterline contact point, centered. `size` = overall width in px. Wheels, treads, paddles and
// propellers animate only inside `drive` windows (layer time); moving across the frame uses the common `move` field.
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL;
  const inWin = (wins, lt) => (wins || []).some(([a, b]) => lt >= a && lt <= b);
  // Total driven seconds up to lt, so wheels stop where they were when a drive window ends.
  const driven = (wins, lt) => (wins || []).reduce((s, [a, b]) => s + Math.max(0, Math.min(lt, b) - a), 0);

  function wheel(ctx, x, y, r, ang, spokes = 8, rim = '#5a3a26', hub = '#c9a86a') {
    T.outlined(ctx, (k) => k.arc(x, y, r, 0, Math.PI * 2), rim, { line: 6 });
    T.outlined(ctx, (k) => k.arc(x, y, r * 0.78, 0, Math.PI * 2), '#d8c8a8', { line: 4 });
    ctx.strokeStyle = rim; ctx.lineWidth = Math.max(3, r * 0.1);
    for (let i = 0; i < spokes; i++) { const a = ang + (i / spokes) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * r * 0.78, y + Math.sin(a) * r * 0.78); ctx.stroke(); }
    T.outlined(ctx, (k) => k.arc(x, y, r * 0.2, 0, Math.PI * 2), hub, { line: 4 });
  }

  // Rising smoke puffs from (x, y); each puff loops on its own seeded period.
  T.smokePuffs = (ctx, x, y, lt, { n = 5, color = '#8f8a84', rise = 160, size = 34, seed = 'smk', drift = -60 } = {}) => {
    const r = T.rng(T.hash(seed)), a0 = ctx.globalAlpha;
    for (let i = 0; i < n; i++) {
      const life = 1.2 + r() * 0.8, ph = ((lt + r() * life) % life) / life, jx = (r() - 0.5) * 20; // rng outside the path fn
      ctx.globalAlpha = a0 * (1 - ph) * 0.85;
      T.outlined(ctx, (k) => k.arc(x + ph * drift + jx, y - ph * rise, size * (0.5 + ph), 0, Math.PI * 2), color, { line: 4 });
    }
    ctx.globalAlpha = a0;
  };

  // Points along a closed polyline at even spacing (for tread ticks).
  function along(pts, step, phase) {
    const out = [];
    let acc = -phase;
    for (let i = 0; i < pts.length; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length], len = Math.hypot(x1 - x0, y1 - y0);
      let d = ((step - (acc % step)) % step);
      for (; d < len; d += step) out.push([x0 + ((x1 - x0) * d) / len, y0 + ((y1 - y0) * d) / len, Math.atan2(y1 - y0, x1 - x0)]);
      acc += len;
    }
    return out;
  }

  // A seated rider's bean layer: `r` is a cast id or {who, expr, lookAt, pose, hold, holdL, talk, takes, gaze, look, view,
  // facing, scale}; its own fields win over the vehicle-wide ones in `base`. A rider that acts (lookAt / takes) gets
  // __anchor = anchorOf(B): (shot time t) -> {x, y, flip} of its head in the world, a pure function of t, so the acting
  // director aims from the seat; __px (screen px per seat unit) scales its hops; `at` = the vehicle's (layer -> shot
  // time); its id carries the vehicle's identity so two vehicles never share a director plan.
  const RIDER_OWN = new Set(['x', 'y', 'size', 'type', 'legs', 'id', 'scale']);
  T.vehicleRiderBean = (L, r, base, anchorOf, px) => {
    const B = { ...base };
    if (r && typeof r === 'object') {
      for (const [key, v] of Object.entries(r)) if (!RIDER_OWN.has(key)) B[key] = v;
      if (r.scale != null) B.size = base.size * r.scale;
    } else B.who = r;
    if ((B.lookAt != null || B.takes) && anchorOf) {
      B.__anchor = anchorOf(B);
      B.__px = px || 1;
      if (L.at) B.at = L.at;
      B.id = B.id + ':' + T.hash(JSON.stringify([L.kind, L.id, L.x, L.y, L.path, L.move, L.at, L.dir, L.flip, L.scale, L.size, L.facing, L.view, L.rot]));
    }
    return B;
  };

  const V = {
    tank(ctx, L, s) {
      const k = s.size / 540, col = L.color ?? '#7d6a52', tread = '#4a3b2c';
      ctx.scale(k, k);
      // Mark I lozenge: long flat top, steep raised front horn, track running round the whole hull.
      const outer = [[-270, -70], [-235, -215], [150, -245], [285, -135], [255, -10], [-205, 0]];
      const inner = [[-236, -78], [-210, -190], [140, -214], [246, -130], [224, -34], [-190, -28]];
      const poly = (pts) => (c) => { c.moveTo(pts[0][0], pts[0][1]); pts.slice(1).forEach(([x, y]) => c.lineTo(x, y)); c.closePath(); };
      ctx.lineJoin = 'round';
      T.outlined(ctx, poly(outer), tread, { line: 9 });
      ctx.fillStyle = '#2a1c15';
      for (const [x, y, a] of along(outer, 26, s.dist * 120)) { ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillRect(-4, -10, 8, 14); ctx.restore(); }
      T.outlined(ctx, poly(inner), col, {
        line: 7, shade: (c) => { c.fillStyle = T.shade(col, -0.22); c.fillRect(-240, -100, 500, 90); },
      });
      ctx.fillStyle = '#3a2e22';
      for (let x = -170; x <= 180; x += 40) for (const y of [-160, -46]) { ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill(); }
      T.outlined(ctx, (c) => T.rrect(c, -70, -150, 120, 86, 8), T.shade(col, 0.08), { line: 7 }); // sponson
      T.outlined(ctx, (c) => T.rrect(c, 46, -122, 110, 18, 6), '#5a5650', { line: 6 }); // gun
      T.outlined(ctx, (c) => T.rrect(c, -150, -140, 50, 70, 6), T.shade(col, -0.1), { line: 5 }); // door
      T.outlined(ctx, (c) => c.arc(-125, -120, 9, 0, Math.PI * 2), '#1d1a16', { line: 4 });
      if (L.burning) { ctx.save(); ctx.translate(0, -200); T.drawFlame(ctx, 220, s.lt, 'tankfire'); ctx.restore(); T.smokePuffs(ctx, 40, -320, s.lt, { color: '#2b2620', seed: 'tanksmoke' }); }
    },

    car1910(ctx, L, s, env) {
      const k = s.size / 380, col = L.color ?? '#2f3e5a';
      ctx.scale(k, k);
      const sg = L.dir === -1 ? -1 : 1, px = env && env.st ? Math.abs(env.st.s * env.st.sy) * k : k;
      (L.riders || []).forEach((r, i) => {
        const base = { type: 'bean', size: 250, legs: false, id: 'car' + i, talk: L.talk, ...(L.riderExpr != null ? { expr: L.riderExpr } : {}) };
        const anchorOf = (B) => (t) => { // the seat's head in the world at shot time t
          const w = T.VK && T.VK.worldPt(L, t, (-70 + i * 110) * k * sg, (-40 - (450 * B.size) / 600) * k);
          return w ? { x: w[0], y: w[1], flip: (w[2].flip || 1) * sg } : null;
        };
        ctx.save(); ctx.translate(-70 + i * 110, -40); T.layers.bean(ctx, T.vehicleRiderBean(L, r, base, anchorOf, px), s.lt, { ...env, st: null }); ctx.restore();
      });
      T.outlined(ctx, (c) => { c.moveTo(-180, -60); c.lineTo(-150, -150); c.lineTo(40, -150); c.lineTo(70, -110); c.lineTo(175, -100); c.lineTo(190, -60); c.closePath(); }, col, {
        line: 8, shade: (c) => { c.fillStyle = T.shade(col, -0.25); c.fillRect(-200, -90, 420, 40); c.fillStyle = P.gold; c.fillRect(-180, -118, 360, 6); },
      });
      T.outlined(ctx, (c) => T.rrect(c, 120, -130, 60, 34, 6), '#c9ced2', { line: 5 }); // radiator
      T.outlined(ctx, (c) => c.arc(178, -92, 12, 0, Math.PI * 2), '#fff3a0', { line: 4 }); // lamp
      ctx.strokeStyle = P.ink; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(30, -150); ctx.lineTo(10, -200); ctx.stroke();
      T.outlined(ctx, (c) => c.ellipse(10, -205, 20, 8, -0.3, 0, Math.PI * 2), '#3a2e22', { line: 4 });
      for (const x of [-120, 120]) {
        T.outlined(ctx, (c) => { c.moveTo(x - 66, -40); c.quadraticCurveTo(x, -110, x + 66, -40); c.closePath(); }, T.shade(col, -0.35), { line: 6 });
        wheel(ctx, x, -50, 50, s.dist * 7, 10);
      }
    },

    train(ctx, L, s) {
      const cars = L.cars ?? 3, k = s.size / (340 + cars * 300), col = L.color ?? '#6a6e74';
      ctx.scale(k, k);
      const total = 340 + cars * 300, x0 = -total / 2;
      for (let i = cars - 1; i >= 0; i--) {
        const cx = x0 + 340 + i * 300 + 10;
        T.outlined(ctx, (c) => T.rrect(c, cx, -210, 280, 160, 14), col, { line: 7, shade: (c) => { c.fillStyle = T.shade(col, -0.2); c.fillRect(cx, -90, 280, 40); } });
        T.outlined(ctx, (c) => T.rrect(c, cx - 8, -226, 296, 24, 10), T.shade(col, -0.35), { line: 6 });
        for (let w = 0; w < 4; w++) T.outlined(ctx, (c) => T.rrect(c, cx + 20 + w * 64, -186, 46, 50, 6), '#e8f2f4', { line: 5 });
        ctx.strokeStyle = P.ink; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(cx - 10, -70); ctx.lineTo(cx + 10, -70); ctx.stroke();
        for (const wx of [cx + 50, cx + 230]) wheel(ctx, wx, -36, 34, s.dist * 9, 6);
      }
      const ex = x0, eng = L.engineColor ?? '#2f3236';
      T.outlined(ctx, (c) => T.rrect(c, ex + 40, -180, 210, 110, 40), eng, { line: 8, shade: (c) => { c.fillStyle = '#4a4e54'; c.fillRect(ex + 40, -180, 210, 30); } }); // boiler
      T.outlined(ctx, (c) => T.rrect(c, ex + 230, -250, 110, 190, 10), '#8a2a22', { line: 8 }); // cab
      T.outlined(ctx, (c) => T.rrect(c, ex + 252, -228, 60, 54, 6), '#e8f2f4', { line: 5 });
      T.outlined(ctx, (c) => { c.moveTo(ex + 80, -180); c.lineTo(ex + 70, -260); c.lineTo(ex + 130, -260); c.lineTo(ex + 120, -180); c.closePath(); }, eng, { line: 7 }); // chimney
      T.outlined(ctx, (c) => { c.moveTo(ex + 40, -70); c.lineTo(ex - 10, -20); c.lineTo(ex + 40, -20); c.closePath(); }, '#8a2a22', { line: 6 }); // cowcatcher
      for (const wx of [ex + 80, ex + 170, ex + 280]) wheel(ctx, wx, -42, 40, s.dist * 8, 8, '#2a2522', '#c8323a');
      ctx.strokeStyle = '#8a8f96'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(ex + 80 + Math.cos(s.dist * 8) * 20, -42 + Math.sin(s.dist * 8) * 20); ctx.lineTo(ex + 280 + Math.cos(s.dist * 8) * 20, -42 + Math.sin(s.dist * 8) * 20); ctx.stroke();
      if (s.driving || L.smoke) T.smokePuffs(ctx, ex + 100, -270, s.lt, { seed: 'train', drift: -140, n: 6, color: '#b8b2aa' });
    },

    steamer(ctx, L, s) {
      const k = s.size / 520, col = L.color ?? '#2c2a30';
      ctx.scale(k, k);
      for (const fx of [-60, 40]) {
        T.outlined(ctx, (c) => T.rrect(c, fx - 22, -300, 44, 140, 6), '#b8322e', { line: 7, shade: (c) => { c.fillStyle = '#2a1c15'; c.fillRect(fx - 24, -300, 48, 22); } });
        T.smokePuffs(ctx, fx, -310, s.lt, { seed: 'stm' + fx, drift: -120, color: '#5a5650' });
      }
      T.outlined(ctx, (c) => T.rrect(c, -170, -200, 330, 60, 8), '#efe6d4', { line: 7, shade: (c) => { c.fillStyle = '#3a4a5a'; for (let x = -150; x < 140; x += 46) c.fillRect(x, -186, 26, 22); } });
      T.outlined(ctx, (c) => { c.moveTo(-260, -150); c.lineTo(250, -150); c.quadraticCurveTo(280, -100, 220, -10); c.lineTo(-210, -10); c.quadraticCurveTo(-250, -60, -260, -150); c.closePath(); }, col, { line: 8, shade: (c) => { c.fillStyle = '#c8323a'; c.fillRect(-270, -30, 560, 24); } });
      const a = s.dist * 3;
      ctx.save(); ctx.translate(30, -110);
      ctx.strokeStyle = '#5a3a26'; ctx.lineWidth = 10;
      for (let i = 0; i < 8; i++) { const b = a + (i / 8) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(b) * 70, Math.sin(b) * 70); ctx.stroke(); }
      ctx.restore();
      T.outlined(ctx, (c) => { c.moveTo(-52, -110); c.arc(30, -110, 82, Math.PI, 0); c.closePath(); }, '#e2b63a', { line: 7 }); // paddle box
    },

    submarine(ctx, L, s) {
      const k = s.size / 560, col = L.color ?? '#5d6a72';
      ctx.scale(k, k);
      T.outlined(ctx, (c) => T.rrect(c, -40, -230, 120, 90, 18), col, { line: 7 });
      ctx.strokeStyle = P.ink; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(30, -230); ctx.lineTo(30, -290); ctx.lineTo(60, -290); ctx.stroke();
      T.outlined(ctx, (c) => c.ellipse(0, -100, 280, 70, 0, 0, Math.PI * 2), col, { line: 8, shade: (c) => { c.fillStyle = T.shade(col, -0.25); c.fillRect(-300, -90, 600, 80); } });
      ctx.fillStyle = '#e8f2f4';
      for (let x = -160; x <= 120; x += 70) { T.outlined(ctx, (c) => c.arc(x, -112, 13, 0, Math.PI * 2), '#bfe3ef', { line: 4 }); }
      T.outlined(ctx, (c) => { c.moveTo(-270, -100); c.lineTo(-330, -150); c.lineTo(-330, -50); c.closePath(); }, T.shade(col, -0.1), { line: 6 });
      if (L.face) { ctx.fillStyle = P.ink; for (const x of [170, 220]) { ctx.beginPath(); ctx.ellipse(x, -126, 10, 15, 0, 0, Math.PI * 2); ctx.fill(); } ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(170, -88); ctx.quadraticCurveTo(200, L.face === 'angry' ? -100 : -72, 235, -88); ctx.stroke(); }
      const pa = s.dist * 20; ctx.fillStyle = 'rgba(200,220,230,0.5)'; ctx.beginPath(); ctx.ellipse(-340, -100, 10, 40 * Math.abs(Math.cos(pa)), 0, 0, Math.PI * 2); ctx.fill();
    },

    junk(ctx, L, s) {
      const k = s.size / 480, sail = L.color ?? '#b03030';
      ctx.scale(k, k);
      ctx.strokeStyle = P.ink; ctx.lineWidth = 9;
      for (const [mx, h] of [[-60, 330], [80, 260]]) { ctx.beginPath(); ctx.moveTo(mx, -60); ctx.lineTo(mx, -60 - h); ctx.stroke(); }
      for (const [mx, h, w] of [[-60, 300, 170], [80, 230, 140]]) {
        T.outlined(ctx, (c) => { c.moveTo(mx - 20, -90 - h); c.quadraticCurveTo(mx + w, -90 - h + 10, mx + w * 0.9, -100); c.lineTo(mx - 10, -100); c.closePath(); }, sail, {
          line: 6, shade: (c) => { c.strokeStyle = T.shade(sail, -0.35); c.lineWidth = 5; for (let i = 1; i < 7; i++) { const y = -100 - (h * i) / 7; c.beginPath(); c.moveTo(mx - 20, y); c.lineTo(mx + w, y + 6); c.stroke(); } },
        });
      }
      T.outlined(ctx, (c) => { c.moveTo(-240, -110); c.quadraticCurveTo(-200, -20, -120, -6); c.lineTo(160, -6); c.quadraticCurveTo(230, -30, 250, -130); c.lineTo(180, -80); c.lineTo(-170, -70); c.closePath(); }, '#b08a5a', {
        line: 8, shade: (c) => { c.strokeStyle = 'rgba(60,35,15,0.45)'; c.lineWidth = 4; for (let y = -60; y < 0; y += 14) { c.beginPath(); c.moveTo(-230, y); c.lineTo(240, y); c.stroke(); } },
      });
    },

    caravel(ctx, L, s) {
      const k = s.size / 500, sail = L.color ?? '#f1e6cc';
      ctx.scale(k, k);
      ctx.strokeStyle = '#5a3a26'; ctx.lineWidth = 10;
      for (const [mx, h] of [[-90, 300], [40, 380], [160, 260]]) { ctx.beginPath(); ctx.moveTo(mx, -90); ctx.lineTo(mx, -90 - h); ctx.stroke(); }
      [[-90, 230, 150], [40, 300, 190], [160, 200, 120]].forEach(([mx, h, w], i) => {
        T.outlined(ctx, (c) => { c.moveTo(mx - w / 2, -90 - h); c.quadraticCurveTo(mx, -80 - h + 30, mx + w / 2, -90 - h); c.quadraticCurveTo(mx + w / 2 + 20, -140 - h / 3, mx + w / 2, -120); c.quadraticCurveTo(mx, -100, mx - w / 2, -120); c.quadraticCurveTo(mx - w / 2 - 20, -140 - h / 3, mx - w / 2, -90 - h); c.closePath(); }, sail, {
          line: 6, shade: (c) => { if (i === 1 && L.cross !== false) { c.fillStyle = L.crossColor ?? P.red; c.fillRect(mx - 16, -90 - h + 30, 32, h - 80); c.fillRect(mx - w * 0.34, -90 - h / 2 - 30, w * 0.68, 32); } },
        });
      });
      T.outlined(ctx, (c) => { c.moveTo(-250, -170); c.lineTo(-170, -150); c.lineTo(170, -150); c.lineTo(250, -200); c.quadraticCurveTo(230, -40, 160, -8); c.lineTo(-150, -8); c.quadraticCurveTo(-230, -60, -250, -170); c.closePath(); }, '#7a4a2a', {
        line: 8, shade: (c) => { c.fillStyle = '#5a321c'; c.fillRect(-260, -60, 520, 60); c.strokeStyle = '#e2b63a'; c.lineWidth = 6; c.beginPath(); c.moveTo(-240, -130); c.lineTo(230, -150); c.stroke(); },
      });
    },

    rowboat(ctx, L, s, env) {
      const k = s.size / 300;
      ctx.scale(k, k);
      (L.riders || []).forEach((who, i) => { ctx.save(); ctx.translate(-40 + i * 90, -40); T.layers.bean(ctx, { type: 'bean', who, size: 220, legs: false, id: 'row' + i, talk: L.talk }, s.lt, { ...env, st: null }); ctx.restore(); });
      const oar = Math.sin(s.dist * 5) * 0.5;
      ctx.strokeStyle = '#8a5a32'; ctx.lineWidth = 9;
      for (const d of [-1, 1]) { ctx.save(); ctx.translate(d * 30, -70); ctx.rotate(0.9 * d + oar * d); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 120); ctx.stroke(); ctx.restore(); }
      T.outlined(ctx, (c) => { c.moveTo(-150, -80); c.lineTo(150, -80); c.quadraticCurveTo(130, -10, 90, -4); c.lineTo(-100, -4); c.quadraticCurveTo(-140, -20, -150, -80); c.closePath(); }, L.color ?? '#9a6a3a', { line: 8, shade: (c) => { c.fillStyle = 'rgba(0,0,0,0.18)'; c.fillRect(-160, -40, 320, 40); } });
    },

    biplane(ctx, L, s) {
      const k = s.size / 420, col = L.color ?? '#b8a070';
      ctx.scale(k, k);
      ctx.translate(0, -150);
      T.outlined(ctx, (c) => T.rrect(c, -190, -70, 360, 22, 10), T.shade(col, -0.1), { line: 7 }); // top wing
      ctx.strokeStyle = P.ink; ctx.lineWidth = 6; for (const x of [-140, -40, 60, 140]) { ctx.beginPath(); ctx.moveTo(x, -50); ctx.lineTo(x, 10); ctx.stroke(); }
      T.outlined(ctx, (c) => { c.moveTo(-200, 0); c.quadraticCurveTo(-60, -40, 150, -10); c.lineTo(180, 10); c.quadraticCurveTo(-40, 40, -200, 20); c.closePath(); }, col, { line: 7 }); // fuselage
      T.outlined(ctx, (c) => { c.moveTo(-200, 0); c.lineTo(-240, -50); c.lineTo(-210, 20); c.closePath(); }, T.shade(col, -0.15), { line: 6 }); // tail
      T.outlined(ctx, (c) => T.rrect(c, -170, 18, 340, 20, 10), col, { line: 7 }); // bottom wing
      for (const x of [-110, 110]) { T.outlined(ctx, (c) => c.arc(x, 28, 16, 0, Math.PI * 2), L.roundel ?? '#2d3f9a', { line: 4 }); T.outlined(ctx, (c) => c.arc(x, 28, 7, 0, Math.PI * 2), '#c8323a', { line: 3 }); }
      for (const x of [-30, 60]) wheel(ctx, x, 70, 18, s.dist * 6, 4);
      ctx.strokeStyle = P.ink; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-30, 52); ctx.lineTo(10, 20); ctx.lineTo(60, 52); ctx.stroke();
      T.outlined(ctx, (c) => c.arc(-40, -22, 22, Math.PI, 0), '#f6f2ea', { line: 5 }); // pilot head
      ctx.fillStyle = 'rgba(230,230,230,0.55)'; ctx.beginPath(); ctx.ellipse(186, 2, 8, 62, 0, 0, Math.PI * 2); ctx.fill(); // prop blur
      if (L.burning) { T.smokePuffs(ctx, -150, 0, s.lt, { seed: 'plane', drift: -220, rise: 40, color: '#2b2620' }); }
    },

    cannon(ctx, L, s) {
      const k = s.size / 320;
      ctx.scale(k, k);
      let recoil = 0;
      for (const t of L.fire || []) {
        const d = s.lt - t;
        if (d >= 0 && d < 0.5) recoil = Math.max(recoil, (1 - d / 0.5) * 30);
        // muzzle = barrel tip (190,-162) rotated by the barrel angle (-0.25 rad)
        if (d >= 0 && d < 1.4) T.smokePuffs(ctx, 170, -230, d, { seed: 'cn' + t, drift: 90, rise: 60, n: 4, color: '#cfc8bc', size: 40 });
        if (d >= 0 && d < 0.1) { ctx.fillStyle = '#ffd860'; ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2, rr = i % 2 ? 30 : 80; ctx.lineTo(180 + Math.cos(a) * rr, -214 + Math.sin(a) * rr); } ctx.fill(); }
      }
      ctx.save(); ctx.translate(-recoil, 0); ctx.rotate(-0.25);
      T.outlined(ctx, (c) => T.rrect(c, -40, -190, 230, 56, 24), L.color ?? '#3a3d42', { line: 8, shade: (c) => { c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(-30, -182, 210, 12); } });
      ctx.restore();
      T.outlined(ctx, (c) => { c.moveTo(-120, -40); c.lineTo(60, -40); c.lineTo(20, -130); c.lineTo(-60, -130); c.closePath(); }, '#7a5232', { line: 7 });
      wheel(ctx, -10 - recoil * 0.3, -50, 52, -recoil * 0.05, 10);
    },

    cart(ctx, L, s) {
      const k = s.size / 300, col = L.color ?? '#9a6a3a';
      ctx.scale(k, k);
      T.outlined(ctx, (c) => T.rrect(c, -140, -150, 280, 80, 6), col, { line: 7, shade: (c) => { c.strokeStyle = 'rgba(60,35,15,0.5)'; c.lineWidth = 4; for (let x = -100; x < 140; x += 46) { c.beginPath(); c.moveTo(x, -150); c.lineTo(x, -70); c.stroke(); } } });
      ctx.strokeStyle = '#5a3a26'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(140, -100); ctx.lineTo(230, -80); ctx.stroke();
      if (L.load) { T.drawProp(ctx, L.load, 110, s.lt, {}); }
      wheel(ctx, 0, -55, 55, s.dist * 6, 8);
    },
  };
  T.VEHICLES = V;

  T.layers.vehicle = (ctx, L, lt, env) => {
    const fn = V[L.kind];
    if (!fn) throw new Error('Unknown vehicle kind: ' + L.kind);
    const driving = inWin(L.drive, lt);
    const dist = driven(L.drive, lt) * (L.speed ?? 1);
    if (L.dir === -1) ctx.scale(-1, 1);
    const floating = ['steamer', 'submarine', 'junk', 'caravel', 'rowboat'].includes(L.kind);
    if (floating) { ctx.rotate(Math.sin(lt * 1.3) * (L.rock ?? 2.5) * T.DEG); ctx.translate(0, Math.sin(lt * 2.1) * 4); }
    else if (L.kind === 'biplane') ctx.translate(0, Math.sin(lt * 2.4) * 8);
    else if (driving) ctx.translate(0, -Math.abs(Math.sin(lt * Math.PI * 3)) * (L.bobAmp ?? 4));
    fn(ctx, L, { size: L.size ?? 480, lt, dist, driving }, env);
  };
})();
