// props-machines.js — machines with moving parts, all closed-form functions of layer time: gears (a meshing train),
// piston (crank, connecting rod and piston in a cylinder, with exhaust puffs), gauge (dial whose needle follows `value`
// with a damped wobble), valve (hand wheel that turns while `open` changes) and fuel-pump (a vintage petrol pump with a
// lit glass globe and a counter). Centred at the origin, `size` = height.
// Fields: speed (turns per second; gears, piston), count (gears), color, value (gauge 0..1 or [{at, v}] timeline),
// label / text, danger (gauge red zone start, 0.8), open (valve 0..1 timeline), globe / brand / price (fuel-pump),
// running (fuel-pump: digits roll), exhaust (piston: puffs, default true).
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL, TAU = Math.PI * 2;
  const LW = (s) => Math.max(3, s * 0.02);
  const gearPath = (r, teeth, depth) => (k) => {
    const n = teeth * 4;
    for (let i = 0; i <= n; i++) { const a = (i / n) * TAU, q = i % 4, rr = q === 1 || q === 2 ? r : r - depth; i ? k.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : k.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    k.closePath();
  };
  function gear(ctx, s, r, teeth, angle, col) {
    ctx.save(); ctx.rotate(angle);
    T.matMetal(ctx, gearPath(r, teeth, r * 0.16), col, { line: LW(s) });
    T.outlined(ctx, (k) => k.arc(0, 0, r * 0.62, 0, TAU), T.shade(col, -0.18), { line: LW(s) * 0.6 });
    ctx.fillStyle = T.shade(col, -0.45);
    for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; ctx.beginPath(); ctx.arc(Math.cos(a) * r * 0.38, Math.sin(a) * r * 0.38, r * 0.11, 0, TAU); ctx.fill(); }
    T.matMetal(ctx, (k) => k.arc(0, 0, r * 0.18, 0, TAU), T.shade(col, 0.1), { line: LW(s) * 0.6 });
    ctx.restore();
  }

  const MACH = {
    // gears: count 3 meshing gears in a zigzag train; each turns the other way at the tooth ratio of its neighbour.
    gears(ctx, s, lt, o) {
      const n = Math.max(1, Math.min(5, Math.round(o.count ?? 3))), cols = [o.color ?? '#c99a3a', '#9aa0a8', '#b8743a', '#8a8f96', '#d0a84a'];
      const radii = [0.3, 0.2, 0.26, 0.17, 0.24].slice(0, n).map((r) => r * s), teeth = radii.map((r) => Math.max(8, Math.round(r / (s * 0.024))));
      const pos = [[0, 0]], phi = [0];
      for (let i = 1; i < n; i++) {
        const d = radii[i - 1] + radii[i] - radii[i] * 0.16, dy = (i % 2 ? -1 : 1) * s * 0.1, dx = Math.sqrt(Math.max(0, d * d - dy * dy));
        pos.push([pos[i - 1][0] + dx, pos[i - 1][1] + dy]); phi.push(Math.atan2(dy, dx));
      }
      const mid = pos[n - 1][0] / 2;
      let th = lt * (o.speed ?? 0.25) * TAU;
      for (let i = 0; i < n; i++) {
        if (i) th = phi[i] + Math.PI - (th - phi[i]) * (teeth[i - 1] / teeth[i]) + Math.PI / teeth[i];
        ctx.save(); ctx.translate(pos[i][0] - mid, pos[i][1]); gear(ctx, s, radii[i], teeth[i], th, cols[i]); ctx.restore();
      }
    },
    piston(ctx, s, lt, o) {
      const th = lt * (o.speed ?? 1) * TAU, cr = s * 0.11, L = s * 0.34, cy = s * 0.26, col = o.color ?? '#9aa0a8';
      const px = Math.sin(th) * cr, py = cy - Math.cos(th) * cr, yP = cy - Math.cos(th) * cr - Math.sqrt(Math.max(0, L * L - px * px)) ; // piston pin height
      T.matMetal(ctx, (k) => k.rect(-s * 0.2, -s * 0.48, s * 0.4, s * 0.56), '#5a5f66', { line: LW(s) }); // cylinder block
      ctx.save(); ctx.beginPath(); ctx.rect(-s * 0.15, -s * 0.46, s * 0.3, s * 0.54); ctx.clip();
      ctx.fillStyle = '#2a2c30'; ctx.fillRect(-s * 0.15, -s * 0.46, s * 0.3, s * 0.54);
      T.matMetal(ctx, (k) => k.rect(-s * 0.14, yP - s * 0.12, s * 0.28, s * 0.16), col, { line: LW(s) * 0.8 });
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; for (const d of [0.03, 0.07]) ctx.fillRect(-s * 0.14, yP - s * 0.12 + s * d, s * 0.28, s * 0.012);
      ctx.restore();
      for (let i = 0; i < 4; i++) T.matMetal(ctx, (k) => k.rect(-s * 0.24, -s * 0.44 + i * s * 0.06, s * 0.48, s * 0.03), '#6a6f76', { line: LW(s) * 0.5, axis: 'y' }); // cooling fins
      const ang = Math.atan2(px, py - yP), rl = Math.hypot(px, py - yP);
      ctx.save(); ctx.translate(0, yP); ctx.rotate(-ang);
      T.matMetal(ctx, (k) => T.rrect(k, -s * 0.03, 0, s * 0.06, rl, s * 0.03), '#b9c0c8', { line: LW(s) * 0.7 });
      ctx.restore();
      ctx.save(); ctx.translate(0, cy); ctx.rotate(th);
      T.matMetal(ctx, (k) => { k.arc(0, 0, s * 0.17, 0, TAU); }, '#4a4e54', { line: LW(s) }); // flywheel
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = s * 0.012; ctx.beginPath(); ctx.arc(0, 0, s * 0.13, 0.3, 1.4); ctx.stroke();
      T.matMetal(ctx, (k) => k.arc(0, -cr, s * 0.035, 0, TAU), '#c99a3a', { line: LW(s) * 0.6 });
      T.matMetal(ctx, (k) => k.arc(0, 0, s * 0.04, 0, TAU), '#8a8f96', { line: LW(s) * 0.6 });
      ctx.restore();
      if (o.exhaust !== false) {
        const e = T.emitterOf({ preset: 'smoke', id: (o.id ?? 'piston') + ':exhaust', rate: 3 * (o.speed ?? 1), w: s * 0.04, speed: s * 0.5, size: [s * 0.08, s * 0.14], prewarm: true, life: 2, wind: 40, opacity: 0.6 });
        ctx.save(); ctx.translate(s * 0.22, -s * 0.42); T.drawParticles(ctx, e, lt); ctx.restore();
        T.matMetal(ctx, (k) => k.rect(s * 0.18, -s * 0.46, s * 0.07, s * 0.14), '#4a4e54', { line: LW(s) * 0.6 });
      }
    },
    gauge(ctx, s, lt, o) {
      const v = T.clamp(T.num(o.value ?? 0.3, lt, 0.3)), vPrev = T.clamp(T.num(o.value ?? 0.3, lt - 0.12, 0.3));
      const wob = (v - vPrev) * 0.6 * Math.sin(lt * 40) + (v > (o.danger ?? 0.8) ? Math.sin(lt * 50) * 0.012 : 0); // overshoot shiver while it moves
      const r = s * 0.42, a0 = Math.PI * 0.75, span = Math.PI * 1.5, ang = a0 + span * T.clamp(v + wob, -0.02, 1.02);
      T.matMetal(ctx, (k) => k.arc(0, 0, r, 0, TAU), o.color ?? '#c99a3a', { line: LW(s) });
      T.outlined(ctx, (k) => k.arc(0, 0, r * 0.84, 0, TAU), '#f6f0e0', { line: LW(s) * 0.7, paint: 0.4 });
      const dz = o.danger ?? 0.8;
      ctx.strokeStyle = '#c8202a'; ctx.lineWidth = r * 0.1; ctx.beginPath(); ctx.arc(0, 0, r * 0.7, a0 + span * dz, a0 + span); ctx.stroke();
      ctx.strokeStyle = P.ink; ctx.lineCap = 'round';
      for (let i = 0; i <= 10; i++) { const a = a0 + (span * i) / 10, big = i % 5 === 0; ctx.lineWidth = big ? r * 0.04 : r * 0.02; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * (big ? 0.6 : 0.68), Math.sin(a) * r * (big ? 0.6 : 0.68)); ctx.lineTo(Math.cos(a) * r * 0.78, Math.sin(a) * r * 0.78); ctx.stroke(); }
      if (o.label ?? o.text) T.toonText(ctx, o.label ?? o.text, 0, r * 0.45, { size: r * 0.2, fill: P.ink, stroke: 0, shadow: false });
      ctx.save(); ctx.rotate(ang);
      T.outlined(ctx, (k) => { k.moveTo(-r * 0.12, -r * 0.04); k.lineTo(r * 0.72, 0); k.lineTo(-r * 0.12, r * 0.04); k.closePath(); }, '#c8202a', { line: LW(s) * 0.6, paint: false });
      ctx.restore();
      T.matMetal(ctx, (k) => k.arc(0, 0, r * 0.09, 0, TAU), '#4a4e54', { line: LW(s) * 0.6 });
      ctx.save(); ctx.beginPath(); ctx.arc(0, 0, r * 0.84, 0, TAU); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.beginPath(); ctx.ellipse(-r * 0.25, -r * 0.4, r * 0.55, r * 0.25, -0.5, 0, TAU); ctx.fill(); ctx.restore(); // glass glare
    },
    valve(ctx, s, lt, o) {
      const open = T.num(o.open ?? 0, lt, 0), col = o.color ?? '#c8202a';
      T.matMetal(ctx, (k) => k.rect(-s * 0.5, s * 0.2, s, s * 0.18), '#8a8f96', { line: LW(s), axis: 'y' }); // pipe
      T.matMetal(ctx, (k) => T.rrect(k, -s * 0.14, s * 0.08, s * 0.28, s * 0.36, s * 0.04), '#6a6f76', { line: LW(s) });
      T.matMetal(ctx, (k) => k.rect(-s * 0.03, -s * 0.12, s * 0.06, s * 0.22), '#b9c0c8', { line: LW(s) * 0.7 });
      ctx.save(); ctx.translate(0, -s * 0.18); ctx.scale(1, 0.42); ctx.rotate(open * TAU * 1.5);
      T.matMetal(ctx, (k) => { k.arc(0, 0, s * 0.32, 0, TAU); k.arc(0, 0, s * 0.25, 0, TAU, true); }, col, { line: LW(s) * 1.6 });
      for (let i = 0; i < 4; i++) { ctx.save(); ctx.rotate((i / 4) * TAU); T.matMetal(ctx, (k) => k.rect(0, -s * 0.03, s * 0.27, s * 0.06), col, { line: LW(s) * 1.2 }); ctx.restore(); }
      T.matMetal(ctx, (k) => k.arc(0, 0, s * 0.07, 0, TAU), T.shade(col, -0.2), { line: LW(s) * 1.4 });
      ctx.restore();
    },
    'fuel-pump'(ctx, s, lt, o) {
      const body = o.color ?? '#c8202a', run = o.running ? lt : 0;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(0, -s * 0.38, 0, 0, -s * 0.38, s * 0.32); g.addColorStop(0, 'rgba(255,240,200,0.45)'); g.addColorStop(1, 'rgba(255,220,160,0)');
      ctx.fillStyle = g; ctx.fillRect(-s * 0.4, -s * 0.72, s * 0.8, s * 0.7); ctx.restore();
      T.matGlass(ctx, (k) => k.arc(0, -s * 0.38, s * 0.12, 0, TAU), { tint: o.globe ?? '#fff4dc', alpha: 0.95, line: LW(s), contents: (k, bb) => { k.fillStyle = 'rgba(255,250,230,0.8)'; k.fillRect(bb.x, bb.y, bb.w, bb.h); } });
      if (o.brand) T.toonText(ctx, o.brand, 0, -s * 0.355, { size: T.fitSize(ctx, o.brand, s * 0.07, s * 0.2), fill: body, stroke: 0, shadow: false });
      T.matMetal(ctx, (k) => T.rrect(k, -s * 0.07, -s * 0.27, s * 0.14, s * 0.04, s * 0.01), '#4a4e54', { line: LW(s) * 0.7 });
      T.outlined(ctx, (k) => T.rrect(k, -s * 0.17, -s * 0.24, s * 0.34, s * 0.7, s * 0.06), body, { line: LW(s), shade: (k) => { k.fillStyle = 'rgba(255,255,255,0.18)'; k.fillRect(-s * 0.12, -s * 0.24, s * 0.04, s * 0.7); } });
      T.outlined(ctx, (k) => T.rrect(k, -s * 0.12, -s * 0.18, s * 0.24, s * 0.16, s * 0.02), '#f6f0e0', { line: LW(s) * 0.7, paint: 0.4 });
      const cents = Math.floor(run * 40), digits = String(Math.floor(cents / 100)).padStart(2, '0') + '.' + String(cents % 100).padStart(2, '0');
      T.toonText(ctx, o.text ?? digits, 0, -s * 0.07, { size: s * 0.07, fill: P.ink, stroke: 0, shadow: false });
      if (o.price) T.toonText(ctx, o.price, 0, s * 0.06, { size: s * 0.05, fill: '#f6f0e0', stroke: 0, shadow: false });
      T.matMetal(ctx, (k) => T.rrect(k, -s * 0.21, s * 0.42, s * 0.42, s * 0.06, s * 0.02), '#4a4e54', { line: LW(s) });
      ctx.strokeStyle = P.ink; ctx.lineWidth = s * 0.04; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(s * 0.17, s * 0.1); ctx.bezierCurveTo(s * 0.34, s * 0.12, s * 0.36, s * 0.42, s * 0.26, s * 0.4); ctx.stroke(); ctx.strokeStyle = '#2a2c30'; ctx.lineWidth = s * 0.022; ctx.stroke();
      T.matMetal(ctx, (k) => { k.moveTo(s * 0.17, s * 0.02); k.lineTo(s * 0.25, s * 0.02); k.lineTo(s * 0.27, s * 0.14); k.lineTo(s * 0.19, s * 0.14); k.closePath(); }, '#8a8f96', { line: LW(s) * 0.7 });
    },
  };
  Object.assign(T.PROPS, MACH);
  Object.assign(T.PROP_FOOT || (T.PROP_FOOT = {}), { piston: 0.3, valve: 0.5, 'fuel-pump': 0.28 });
})();
