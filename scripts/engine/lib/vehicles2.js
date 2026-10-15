// vehicles2.js — v4 vehicles and machines. Vehicles (TOON.VEHICLES): galley (oars + square sail), bicycle (with a
// pedalling rider), dump-truck (tilting bed that drops its riders), helicopter (rotor blur + pendulum cable load).
// Machine props (T.PROPS, they share props3.js helpers via T.PROP3): crt / monitor screens that show another shot,
// wall-calendar, window-cycle, clock, emblem3d, stat-block, prize-wheel, coin-flip. Vehicle origin = ground contact
// point, `size` = overall width; times are layer-local, frame counts at 30 fps.
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL, D = T.DEG, PI = Math.PI, TAU = Math.PI * 2;
  const U = T.PROP3, { stick, words, O, LW, evt, F, two, fillR, ell, screen } = U;
  const sh = (c, k = -0.22) => T.shade(c, k);
  const bean = (ctx, who, size, lt, env, extra = {}) => T.layers.bean(ctx, { type: 'bean', who, size, legs: false, id: 'v2' + who, ...extra }, lt, { ...env, st: null });

  // ---------- vehicles (feature 100) ----------
  function wheel(ctx, x, y, r, ang, spokes, rim = '#2a2a2e') {
    ctx.lineWidth = r * 0.16 + 8; ctx.strokeStyle = P.ink; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
    ctx.lineWidth = r * 0.16; ctx.strokeStyle = rim; ctx.stroke();
    ctx.strokeStyle = '#8a8f96'; ctx.lineWidth = 2;
    for (let i = 0; i < spokes; i++) { const a = ang + (i / spokes) * TAU; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * r * 0.92, y + Math.sin(a) * r * 0.92); ctx.stroke(); }
    T.outlined(ctx, (k) => k.arc(x, y, r * 0.12, 0, TAU), '#c9ced2', { line: 4 });
  }
  const V = {};
  V.galley = (ctx, L, s) => {
    const k = s.size / 900, col = L.color ?? '#5a3a22', sail = L.sail ?? '#d8c49a', lt = s.lt;
    ctx.scale(k, k); ctx.translate(0, Math.sin((lt / 2.2) * TAU) * 4); ctx.rotate(Math.sin((lt / 2.2) * TAU + 1) * 1.5 * D);
    ctx.strokeStyle = P.ink; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(20, -120); ctx.lineTo(20, -600); ctx.stroke();
    ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = 7; ctx.stroke();
    for (const y of [-560, -300]) stick(ctx, 900, [[-150, y], [190, y]], 12, '#8a5a2a');
    O(ctx, 400, (c) => { c.moveTo(-140, -560); c.quadraticCurveTo(20, -500, 180, -560); c.quadraticCurveTo(220, -430, 180, -300); c.quadraticCurveTo(20, -270, -140, -300); c.quadraticCurveTo(-110, -430, -140, -560); c.closePath(); }, sail, fillR(sh(sail, sail === '#1a1a1a' ? 0.12 : -0.2), 60, -600, 200, 340));
    const crew = L.crew ?? 4;
    for (let i = 0; i < crew; i++) { const x = -260 + (i * 460) / Math.max(1, crew - 1); O(ctx, 400, (c) => c.arc(x, -165, 26, 0, TAU), P.skin); ctx.fillStyle = P.ink; ctx.beginPath(); ctx.arc(x + 8, -168, 4, 0, TAU); ctx.fill(); }
    const rowing = L.row !== false && s.driving, n = L.oars ?? 12, ph = Math.floor(lt * 15) / 15, sw = rowing ? Math.sin((ph / (L.rowPeriod ?? 0.75)) * TAU) * 20 * D : 0;
    for (let i = 0; i < n; i++) { const x = -330 + (i * 620) / (n - 1); ctx.save(); ctx.translate(x, -70); ctx.rotate(0.75 + sw); stick(ctx, 400, [[0, 0], [0, 190]], 7, '#c99a5a'); ctx.restore(); }
    O(ctx, 600, (c) => { c.moveTo(-450, -150); c.quadraticCurveTo(-470, -260, -400, -240); c.quadraticCurveTo(-360, -230, -390, -200); c.lineTo(-350, -150); c.lineTo(400, -150); c.lineTo(470, -110); c.lineTo(420, -90); c.quadraticCurveTo(300, 0, 0, 0); c.quadraticCurveTo(-330, 0, -450, -150); c.closePath(); }, col, (c) => {
      c.fillStyle = '#3a2416'; c.fillRect(-500, -120, 1000, 26);
      c.strokeStyle = sh(col, -0.35); c.lineWidth = 4; for (const y of [-80, -50, -25]) { c.beginPath(); c.moveTo(-420, y); c.quadraticCurveTo(0, y + 20, 420, y - 30); c.stroke(); }
      c.fillStyle = '#e2b23c'; c.beginPath(); c.arc(-405, -228, 10, 0, TAU); c.fill();
    });
  };
  V.bicycle = (ctx, L, s, env) => {
    const k = s.size / 360, ang = s.dist * 9, lt = s.lt;
    ctx.scale(k, k); ctx.translate(0, s.driving ? -Math.abs(Math.sin(lt * PI * 3)) * 2 : 0);
    const cr = (Math.floor(F(s.dist)) / 10) * TAU; // pedal cycle: 10 frames per turn, stepped
    const bb = [-5, -54], ped = [0, PI].map((o) => [bb[0] + Math.cos(cr + o) * 26, bb[1] + Math.sin(cr + o) * 26]);
    const hip = [-38, -150];
    if (L.rider) { const knee = (p) => [(hip[0] + p[0]) / 2 + 22, (hip[1] + p[1]) / 2 - 18]; stick(ctx, 360, [hip, knee(ped[1]), ped[1]], 22, sh(L.legColor ?? '#3a3a44', -0.2)); }
    for (const x of [-110, 110]) wheel(ctx, x, -54, 54, ang, 12);
    const col = L.color ?? '#b8282c', fr = [[-110, -54], [-5, -54], [-40, -140], [-110, -54]], fr2 = [[-5, -54], [80, -138], [-40, -140]];
    stick(ctx, 360, fr, 9, col); stick(ctx, 360, fr2, 9, col); stick(ctx, 360, [[80, -138], [110, -54]], 9, col);
    stick(ctx, 360, [[80, -138], [86, -164], [64, -170]], 7, '#3a3a3e');
    O(ctx, 360, (c) => ell(c, -44, -150, 26, 8), '#2a2a2e');
    if (L.rider) {
      ctx.save(); ctx.translate(hip[0] + 4, hip[1] + 12); ctx.rotate(12 * D); bean(ctx, L.rider, 300 * (L.riderScale ?? 1), lt, env, { pose: L.riderPose ?? 'hold', expr: L.riderExpr, talk: L.talk, rock: 0.4, hold: L.riderHold }); ctx.restore();
      const knee = (p) => [(hip[0] + p[0]) / 2 + 22, (hip[1] + p[1]) / 2 - 18]; stick(ctx, 360, [hip, knee(ped[0]), ped[0]], 22, L.legColor ?? '#3a3a44');
    }
    for (const p of ped) O(ctx, 360, (c) => T.rrect(c, p[0] - 14, p[1] - 4, 28, 8, 3), '#3a3a3e');
    stick(ctx, 360, [bb, ped[0]], 6, '#8a8f96');
  };
  // First layer time where a numeric timeline passes `v` (sampled per frame; used for the dump-truck slide).
  const crossing = (val, v, lt) => { for (let t = 0; t <= lt; t += 1 / 30) if (T.num(val, t) > v) return t; return null; };
  V['dump-truck'] = (ctx, L, s, env) => {
    const k = s.size / 900, lt = s.lt, tilt = T.num(L.tilt, lt, 0) * D, col = L.color ?? '#f2d02f';
    ctx.scale(k, k);
    if (s.driving) ctx.translate(T.noise(lt * 20, 'dtx') * 1.5, T.noise(lt * 20, 'dty') * 1.5);
    const riders = L.riders || [], t25 = riders.length ? crossing(L.tilt, 25, lt) : null, slide = t25 == null ? null : lt - t25;
    const off = [];
    ctx.save(); ctx.translate(-440, -100); ctx.rotate(-tilt);
    riders.forEach((who, i) => { const bx = 120 + i * 110, d = slide == null ? 0 : 0.5 * 1400 * slide * slide; if (bx + 60 - d < 0) { off.push([who, i]); return; } ctx.save(); ctx.translate(bx + 60 - d, -90); bean(ctx, who, 260, lt, env, { pose: slide == null ? 'idle' : 'panic', expr: slide == null ? 'neutral' : 'scream', id: 'dt' + i }); ctx.restore(); });
    O(ctx, 600, (c) => { c.moveTo(0, 0); c.lineTo(560, 0); c.lineTo(580, -200); c.lineTo(-20, -200); c.closePath(); }, col, (c) => { c.fillStyle = sh(col, -0.2); c.fillRect(-40, -60, 640, 60); c.strokeStyle = sh(col, -0.3); c.lineWidth = 5; for (let i = 0; i < 5; i++) c.strokeRect(10 + i * 110, -180, 90, 150); });
    ctx.restore();
    const px = [-440 + Math.cos(-tilt) * 380, -100 + Math.sin(-tilt) * 380];
    stick(ctx, 600, [[-120, -80], [px[0], px[1] + 6]], 14, '#9aa0a6');
    O(ctx, 600, (c) => T.rrect(c, -440, -100, 880, 40, 8), '#3a2a20');
    O(ctx, 600, (c) => { c.moveTo(180, -60); c.lineTo(180, -320); c.lineTo(330, -320); c.lineTo(420, -200); c.lineTo(430, -60); c.closePath(); }, col, fillR(sh(col, -0.2), 180, -140, 260, 80));
    O(ctx, 600, (c) => { c.moveTo(250, -300); c.lineTo(320, -300); c.lineTo(390, -205); c.lineTo(250, -205); c.closePath(); }, '#bfe3f2');
    for (const x of [-300, -170, 300]) wheel(ctx, x, -54, 54, s.dist * 6, 6, '#2a2a2e');
    off.forEach(([who, i], j) => { ctx.save(); ctx.translate(-560 - j * 70, -10 - j * 30); ctx.rotate(-80 * D); bean(ctx, who, 240, lt, env, { pose: 'panic', expr: 'dead', id: 'dto' + i }); ctx.restore(); });
  };
  V.helicopter = (ctx, L, s) => {
    const k = s.size / 700, lt = s.lt, col = L.color ?? '#5a7a4a';
    ctx.scale(k, k); ctx.rotate(Math.sin(lt * 1.7) * 2 * D);
    const ld = L.load;
    if (ld && ld.prop) {
      const cab = (ld.cable ?? 220) / k, a = Math.sin((lt / 1.6) * TAU) * 6 * D, ps = ld.size ?? 300;
      ctx.save(); ctx.translate(20, -110); ctx.rotate(a); stick(ctx, 300, [[0, 0], [0, cab]], 4, '#3a3a3e');
      ctx.translate(0, cab); ctx.scale(1 / k, 1 / k); if (!T.PROP_GROUND.has(ld.prop)) ctx.translate(0, ps / 2); else ctx.translate(0, ps);
      T.drawProp(ctx, ld.prop, ps, lt, ld); ctx.restore();
    }
    for (const x of [-60, 110]) stick(ctx, 700, [[x, -120], [x - 10, -60]], 8, '#3a3a3e');
    stick(ctx, 700, [[-130, -60], [190, -60], [210, -76]], 10, '#3a3a3e');
    O(ctx, 700, (c) => { c.moveTo(-150, -200); c.lineTo(-420, -210); c.lineTo(-420, -180); c.lineTo(-150, -150); c.closePath(); }, col);
    O(ctx, 700, (c) => T.rrect(c, -440, -260, 50, 80, 14), sh(col, -0.1));
    O(ctx, 700, (c) => { c.moveTo(-160, -150); c.quadraticCurveTo(-170, -270, 20, -270); c.quadraticCurveTo(200, -270, 230, -170); c.quadraticCurveTo(220, -110, 120, -110); c.lineTo(-100, -110); c.quadraticCurveTo(-160, -110, -160, -150); c.closePath(); }, col, fillR(sh(col), -200, -160, 460, 60));
    O(ctx, 700, (c) => { c.moveTo(90, -258); c.quadraticCurveTo(200, -255, 220, -175); c.lineTo(110, -175); c.closePath(); }, '#bfe3f2');
    stick(ctx, 700, [[20, -270], [20, -300]], 12, '#3a3a3e');
    const f = Math.floor(F(lt)) % 2;
    ctx.save(); ctx.globalAlpha *= 0.55; ctx.fillStyle = '#3a3a3e'; ctx.beginPath(); ell(ctx, 20, -302, 340, f ? 14 : 20, f ? 0.03 : -0.03); ctx.fill();
    ctx.strokeStyle = '#2a2a2e'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(20 - 330, -302 + (f ? 8 : -8)); ctx.lineTo(20 + 330, -302 - (f ? 8 : -8)); ctx.stroke();
    ctx.beginPath(); ctx.arc(-415, -220, 46, 0, TAU); ctx.fillStyle = '#5a5a60'; ctx.globalAlpha *= 0.6; ctx.fill(); ctx.restore();
  };
  Object.assign(T.VEHICLES, V);

  // ---------- machine props: screens (feature 96) ----------
  // Pull-back: the prop starts scaled so its screen fills the frame (centred) and eases to its place in 20 frames.
  function pullback(ctx, o, lt, sw, shh) {
    const pb = evt(o.pullback); if (!pb) return;
    const e = T.ease.outCubic(T.prog(lt, pb.at ?? 0, pb.dur ?? 0.66)); if (e >= 1) return;
    const m = ctx.getTransform(), dpr = (U.env() && U.env().dpr) || T.DPR || 1, eff = Math.hypot(m.a, m.b) / dpr;
    const s0 = Math.max(T.W / (sw * eff), T.H / (shh * eff)) * 1.04;
    ctx.translate((((T.W * dpr) / 2 - m.e) / m.a) * (1 - e), (((T.H * dpr) / 2 - m.f) / m.d) * (1 - e)); ctx.scale(T.lerp(s0, 1, e), T.lerp(s0, 1, e));
  }
  function powered(ctx, o, lt, x, y, w, h) { // `on`: dark, 2-frame white line, image fades up through heavy scanlines over 8 frames
    const on = evt(o.on); if (!on) return true;
    const f = F(lt - (on.at ?? 0));
    if (f >= 10) return true;
    if (f < 2 || f < 0) { ctx.fillStyle = '#0c0f12'; ctx.fillRect(x, y, w, h); if (f >= 0) { ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y + h / 2 - 3, w, 6); } return false; }
    ctx.save(); ctx.globalAlpha *= 1 - (f - 2) / 8; ctx.fillStyle = '#0c0f12'; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#ffffff'; for (let yy = y; yy < y + h; yy += 6) ctx.fillRect(x, yy, w, 2); ctx.restore();
    return true;
  }
  const M = {};
  M.crt = (ctx, s, lt, o) => {
    const sw = s * 0.62, shh = s * 0.47, col = o.color ?? '#1c1c22';
    pullback(ctx, o, lt, sw, shh);
    for (const d of [-1, 1]) stick(ctx, s, [[s * 0.06 + d * s * 0.04, -s * 0.33], [s * 0.06 + d * s * 0.2, -s * 0.56]], s * 0.012, '#5a5a60');
    for (const d of [-1, 1]) stick(ctx, s, [[s * 0.08 + d * s * 0.3, s * 0.32], [s * 0.08 + d * s * 0.36, s * 0.48]], s * 0.03, '#3a3a40');
    O(ctx, s, (k) => T.rrect(k, -s * 0.4, -s * 0.34, s, s * 0.68, s * 0.06), col, fillR(sh(col, 0.15), -s * 0.4, -s * 0.34, s, s * 0.05));
    for (const y of [-0.12, 0.06]) O(ctx, s, (k) => k.arc(s * 0.46, s * y, s * 0.04, 0, TAU), '#8a8f96');
    ctx.fillStyle = sh(col, 0.25); for (let i = 0; i < 4; i++) ctx.fillRect(s * 0.38, s * (0.16 + i * 0.035), s * 0.16, s * 0.012);
    screen(ctx, s, o, lt, -sw / 2, -shh / 2, sw, shh, s * 0.06);
    powered(ctx, o, lt, -sw / 2, -shh / 2, sw, shh);
    ctx.lineWidth = LW(s); ctx.strokeStyle = P.ink; ctx.beginPath(); T.rrect(ctx, -sw / 2, -shh / 2, sw, shh, s * 0.06); ctx.stroke();
  };
  M.monitor = (ctx, s, lt, o) => {
    const sw = s * 0.62, shh = s * 0.47, col = o.color ?? '#e8dca8';
    pullback(ctx, o, lt, sw, shh);
    const g = ctx.createRadialGradient(0, 0, s * 0.2, 0, 0, s * 1.1); g.addColorStop(0, 'rgba(232,244,255,0.25)'); g.addColorStop(1, 'rgba(232,244,255,0)'); ctx.fillStyle = g; ctx.fillRect(-s * 1.1, -s * 1.1, s * 2.2, s * 2.2);
    O(ctx, s, (k) => { k.moveTo(s * 0.4, -s * 0.36); k.lineTo(s * 0.56, -s * 0.28); k.lineTo(s * 0.56, s * 0.24); k.lineTo(s * 0.4, s * 0.34); k.closePath(); }, sh(col, -0.2));
    O(ctx, s, (k) => T.rrect(k, -s * 0.06, s * 0.34, s * 0.3, s * 0.1, s * 0.02), sh(col, -0.1));
    O(ctx, s, (k) => T.rrect(k, -s * 0.3, s * 0.42, s * 0.7, s * 0.08, s * 0.03), col);
    O(ctx, s, (k) => T.rrect(k, -s * 0.4, -s * 0.36, s * 0.8, s * 0.7, s * 0.04), col, fillR(sh(col, -0.1), -s * 0.4, s * 0.27, s * 0.8, s * 0.1));
    screen(ctx, s, { ...o, screenColor: o.screenColor ?? '#1a3a4a' }, lt, -sw / 2, -shh / 2 - s * 0.03, sw, shh, s * 0.03);
    powered(ctx, o, lt, -sw / 2, -shh / 2 - s * 0.03, sw, shh);
  };

  // ---------- wall-calendar, window-cycle, clock (feature 97) ----------
  M['wall-calendar'] = (ctx, s, lt, o) => {
    const w = s * 0.78, h = s, top = -h / 2, days = o.days ?? 31, red = '#d0202a';
    O(ctx, s, (k) => k.rect(-w / 2, top, w, h), o.paper ?? '#f3ead2', fillR('#e2d6b8', w * 0.3, top, w, h));
    O(ctx, s, (k) => k.rect(-w / 2, top, w, h * 0.2), o.color ?? '#c0392b');
    words(ctx, o.title ?? 'MONTH', 0, top + h * 0.1, w * 0.84, h * 0.11, '#ffffff', { maxH: h * 0.16 });
    for (let i = 0; i < 8; i++) { ctx.lineWidth = s * 0.012; ctx.strokeStyle = '#5a5a60'; ctx.beginPath(); ctx.arc(-w * 0.42 + (i * w * 0.84) / 7, top, s * 0.025, PI, 0); ctx.stroke(); }
    const gx = -w * 0.44, gy = top + h * 0.25, cw = (w * 0.88) / 7, rh = (h * 0.7) / Math.ceil(days / 7);
    const cr = evt(o.cross), every = (cr && cr.every) ?? 0.05, count = (cr && cr.count) ?? 0, from = (cr && cr.from) ?? 1;
    for (let d = 1; d <= days; d++) {
      const cx = gx + ((d - 1) % 7) * cw + cw / 2, cy = gy + Math.floor((d - 1) / 7) * rh + rh / 2;
      ctx.fillStyle = '#5a4a3a'; ctx.font = T.font(rh * 0.34, 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(d), cx, cy);
      const idx = d - from;
      if (cr && idx >= 0 && idx < count) {
        const f = F(lt - (cr.at ?? 0) - idx * every); if (f < 0) continue;
        ctx.strokeStyle = red; ctx.lineWidth = Math.max(3, s * 0.012); ctx.lineCap = 'round'; const r = Math.min(cw, rh) * 0.36;
        for (const [j, sx] of [[0, 1], [1, -1]]) { const p = T.clamp((f - j * 2) / 2); if (p <= 0) continue; ctx.beginPath(); ctx.moveTo(cx - r * sx, cy - r); ctx.lineTo(cx - r * sx + 2 * r * sx * p, cy - r + 2 * r * p); ctx.stroke(); }
      }
    }
    const ci = evt(o.circle);
    if (ci && ci.day) { const p = T.clamp(F(lt - (ci.at ?? 0)) / 6); if (p > 0) { const d = ci.day, cx = gx + ((d - 1) % 7) * cw + cw / 2, cy = gy + Math.floor((d - 1) / 7) * rh + rh / 2; ctx.strokeStyle = red; ctx.lineWidth = Math.max(3, s * 0.012); ctx.beginPath(); ctx.ellipse(cx, cy, cw * 0.55, rh * 0.5, -0.15, -PI / 2, -PI / 2 + p * TAU * 1.08); ctx.stroke(); } }
  };
  const SKY = { day: ['#5fd0c8', '#c8f0e8'], dusk: ['#f08a2a', '#f8c870'], night: ['#1d3a4a', '#2e5468'] }, ORDER = ['day', 'dusk', 'night'];
  function celestial(ctx, s, st, lt, w, h) {
    if (st === 'night') {
      for (let i = 0; i < 6; i++) { const r = T.rng(T.hash('wstar' + i)), x = (r() - 0.5) * w * 0.8, y = -h * 0.4 + r() * h * 0.5, tw = 0.5 + 0.5 * Math.sin(lt * 5 + i * 2); ctx.fillStyle = `rgba(255,250,220,${0.4 + tw * 0.6})`; ctx.beginPath(); ctx.arc(x, y, s * 0.008 * (1 + tw), 0, TAU); ctx.fill(); }
      O(ctx, s, (k) => { k.arc(w * 0.1, -h * 0.15, s * 0.15, 0.3 * PI, 1.7 * PI); k.quadraticCurveTo(w * 0.02, -h * 0.15, w * 0.1 + Math.cos(0.3 * PI) * s * 0.15, -h * 0.15 + Math.sin(0.3 * PI) * s * 0.15); }, '#cfe0e8');
      ctx.strokeStyle = P.ink; ctx.lineWidth = Math.max(2, s * 0.008); ctx.beginPath(); ctx.arc(w * 0.0, -h * 0.2, s * 0.02, 0.1, PI - 0.1); ctx.stroke(); return;
    }
    const y = st === 'dusk' ? h * 0.05 : -h * 0.18, r = s * 0.17 * 0.75;
    ctx.fillStyle = st === 'dusk' ? '#ff9a3a' : '#ffd34a';
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU + lt * 0.5; ctx.beginPath(); ctx.moveTo(Math.cos(a - 0.12) * r * 1.15, y + Math.sin(a - 0.12) * r * 1.15); ctx.lineTo(Math.cos(a) * r * 1.6, y + Math.sin(a) * r * 1.6); ctx.lineTo(Math.cos(a + 0.12) * r * 1.15, y + Math.sin(a + 0.12) * r * 1.15); ctx.fill(); }
    O(ctx, s, (k) => k.arc(0, y, r, 0, TAU), st === 'dusk' ? '#ff9a3a' : '#ffd34a');
    ctx.strokeStyle = P.ink; ctx.lineWidth = Math.max(2, s * 0.008); for (const d of [-1, 1]) { ctx.beginPath(); ctx.arc(d * r * 0.35, y - r * 0.05, r * 0.15, PI + 0.3, -0.3); ctx.stroke(); } ctx.beginPath(); ctx.arc(0, y + r * 0.15, r * 0.35, 0.3, PI - 0.3); ctx.stroke();
  }
  M['window-cycle'] = (ctx, s, lt, o) => {
    const w = s * 0.8, h = s, per = o.period ?? 1.0, n = (o.cycles ?? 3) * 3, i0 = Math.max(0, ORDER.indexOf(o.start ?? 'day'));
    const u = lt / per, idx = Math.min(n - 1, Math.floor(u)), fr = idx >= n - 1 ? 0 : T.clamp(((u - idx) * 30 - 22) / 8);
    const sa = ORDER[(i0 + idx) % 3], sb = ORDER[(i0 + idx + 1) % 3];
    O(ctx, s, (k) => k.rect(-w / 2 - s * 0.06, -h / 2 - s * 0.06, w + s * 0.12, h + s * 0.12), o.frame ?? '#5a4a3a');
    ctx.save(); ctx.beginPath(); ctx.rect(-w / 2, -h / 2, w, h); ctx.clip();
    for (const [st, a] of [[sa, 1], [sb, fr]]) { if (a <= 0) continue; ctx.save(); ctx.globalAlpha *= a; const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2); g.addColorStop(0, SKY[st][0]); g.addColorStop(1, SKY[st][1]); ctx.fillStyle = g; ctx.fillRect(-w / 2, -h / 2, w, h); celestial(ctx, s, st, lt, w, h); ctx.restore(); }
    ctx.restore();
    stick(ctx, s, [[0, -h / 2], [0, h / 2]], s * 0.035, o.frame ?? '#5a4a3a'); stick(ctx, s, [[-w / 2, 0], [w / 2, 0]], s * 0.035, o.frame ?? '#5a4a3a');
    O(ctx, s, (k) => k.rect(-w / 2 - s * 0.1, h / 2 + s * 0.04, w + s * 0.2, s * 0.06), sh(o.frame ?? '#5a4a3a', 0.15));
  };
  M.clock = (ctx, s, lt, o) => {
    const wall = o.style === 'wall', col = o.color ?? '#6a3a22', r = wall ? s * 0.48 : s * 0.13, cy = wall ? -s * 0.5 : -s * 0.84;
    if (!wall) {
      O(ctx, s, (k) => T.rrect(k, -s * 0.18, -s * 0.2, s * 0.36, s * 0.2, s * 0.02), col, fillR(sh(col), s * 0.06, -s, s, s));
      O(ctx, s, (k) => k.rect(-s * 0.13, -s * 0.72, s * 0.26, s * 0.54), col, fillR(sh(col), s * 0.05, -s, s, s));
      O(ctx, s, (k) => T.rrect(k, -s * 0.07, -s * 0.66, s * 0.14, s * 0.4, s * 0.06), '#2a1a12');
      const pa = Math.sin((lt / 1.2) * TAU) * 12 * D;
      ctx.save(); ctx.beginPath(); T.rrect(ctx, -s * 0.07, -s * 0.66, s * 0.14, s * 0.4, s * 0.06); ctx.clip(); ctx.translate(0, -s * 0.66); ctx.rotate(pa); stick(ctx, s, [[0, 0], [0, s * 0.3]], s * 0.01, '#c9a040'); O(ctx, s, (k) => k.arc(0, s * 0.31, s * 0.04, 0, TAU), '#e2b23c'); ctx.restore();
      O(ctx, s, (k) => { k.moveTo(-s * 0.18, -s * 0.7); k.lineTo(-s * 0.18, -s * 0.96); k.quadraticCurveTo(0, -s * 1.06, s * 0.18, -s * 0.96); k.lineTo(s * 0.18, -s * 0.7); k.closePath(); }, col, fillR(sh(col), s * 0.06, -s * 1.1, s, s));
    }
    O(ctx, s, (k) => k.arc(0, cy, r, 0, TAU), '#f3ead2', (k) => { k.strokeStyle = '#c9a040'; k.lineWidth = r * 0.08; k.beginPath(); k.arc(0, cy, r * 0.92, 0, TAU); k.stroke(); });
    ctx.strokeStyle = P.ink; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(2, r * 0.05);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 0.72, cy + Math.sin(a) * r * 0.72); ctx.lineTo(Math.cos(a) * r * 0.82, cy + Math.sin(a) * r * 0.82); ctx.stroke(); }
    const fast = evt(o.fast), [h0, m0] = o.time ?? [10, 8], hrs = h0 + m0 / 60 + (fast ? Math.max(0, lt - (fast.at ?? 0)) * (fast.rate ?? 2) : lt / 3600);
    for (const [a, len, w] of [[(hrs / 12) * TAU, 0.5, 0.08], [(hrs % 1) * TAU, 0.75, 0.05]]) { ctx.lineWidth = Math.max(2, r * w); ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(Math.sin(a) * r * len, cy - Math.cos(a) * r * len); ctx.stroke(); }
    ctx.fillStyle = P.ink; ctx.beginPath(); ctx.arc(0, cy, r * 0.07, 0, TAU); ctx.fill();
  };

  // ---------- emblem3d, stat-block (feature 98) ----------
  const SHAPES = {
    star: (k, r) => { for (let i = 0; i < 10; i++) { const a = -PI / 2 + (i * PI) / 5, rr = i % 2 ? r * 0.45 : r; if (i) k.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); else k.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } k.closePath(); },
    crown: (k, r) => { k.moveTo(-r * 0.9, r * 0.5); k.lineTo(-r, -r * 0.6); k.lineTo(-r * 0.45, -r * 0.05); k.lineTo(0, -r * 0.85); k.lineTo(r * 0.45, -r * 0.05); k.lineTo(r, -r * 0.6); k.lineTo(r * 0.9, r * 0.5); k.closePath(); },
    shield: (k, r) => { k.moveTo(-r * 0.8, -r * 0.85); k.lineTo(r * 0.8, -r * 0.85); k.lineTo(r * 0.8, -r * 0.1); k.quadraticCurveTo(r * 0.7, r * 0.6, 0, r); k.quadraticCurveTo(-r * 0.7, r * 0.6, -r * 0.8, -r * 0.1); k.closePath(); },
    heart: (k, r) => { k.moveTo(0, r * 0.85); k.bezierCurveTo(-r * 1.5, -r * 0.1, -r * 0.6, -r * 1.2, 0, -r * 0.5); k.bezierCurveTo(r * 0.6, -r * 1.2, r * 1.5, -r * 0.1, 0, r * 0.85); k.closePath(); },
    coin: (k, r) => { k.moveTo(r, 0); k.arc(0, 0, r, 0, TAU); },
    disc: (k, r) => { k.moveTo(r, 0); k.arc(0, 0, r, 0, TAU); },
    'cross-plain': (k, r) => { const a = r * 0.3; k.moveTo(-a, -r); k.lineTo(a, -r); k.lineTo(a, -a); k.lineTo(r, -a); k.lineTo(r, a); k.lineTo(a, a); k.lineTo(a, r); k.lineTo(-a, r); k.lineTo(-a, a); k.lineTo(-r, a); k.lineTo(-r, -a); k.lineTo(-a, -a); k.closePath(); },
  };
  T.EMBLEM_SHAPES = SHAPES;
  function extruded(ctx, s, path, col, depth) {
    const n = 8, dx = 0.4 * depth / Math.hypot(0.4, 0.9), dy = 0.9 * depth / Math.hypot(0.4, 0.9);
    ctx.save(); ctx.translate(dx, dy); T.outlined(ctx, path, sh(col, -0.4), { line: LW(s) * 1.6 }); ctx.restore();
    for (let i = n - 1; i > 0; i--) { ctx.save(); ctx.translate((dx * i) / n, (dy * i) / n); ctx.fillStyle = sh(col, -0.4); ctx.beginPath(); path(ctx); ctx.fill(); ctx.restore(); }
    T.outlined(ctx, path, col, { line: LW(s) * 1.2 });
    ctx.save(); ctx.globalAlpha *= 0.6; ctx.translate(-2, -2); ctx.strokeStyle = sh(col, 0.35); ctx.lineWidth = Math.max(2, s * 0.006); ctx.beginPath(); path(ctx); ctx.stroke(); ctx.restore();
  }
  // Delivery drop (5-frame fall, 1-frame squash, dust) and topple (90 deg about the base corner in 7 frames + shake).
  function delivered(ctx, s, lt, o, half) {
    const dv = evt(o.deliver), tp = evt(o.topple);
    if (dv && (dv.by ?? 'drop') === 'drop') { const f = F(lt - (dv.at ?? 0)); if (f < 0) return false; if (f < 5) ctx.translate(0, -(1 - T.ease.in(f / 5)) * 1300); else if (f < 6) ctx.scale(1.1, 0.92); if (f >= 5 && f < 11) dust(ctx, s, f - 5, o); }
    if (dv && dv.by === 'helicopter') stick(ctx, s, [[0, -s], [0, -s - 2400]], 4, '#3a3a3e');
    if (tp) { const t = lt - (tp.at ?? 0), dir = tp.dir ?? 1; if (t > 0) { const p = T.ease.in(T.clamp(F(t) / 7)), f2 = F(t) - 7; if (f2 > 0 && f2 < 6) ctx.translate((two(lt) % 2 ? 1 : -1) * 6, 0); ctx.translate(dir * half, 0); ctx.rotate(dir * p * PI / 2); ctx.translate(-dir * half, 0); if (f2 >= 0 && f2 < 8 && T.drawCloud) { ctx.save(); ctx.rotate(-dir * PI / 2); ctx.globalAlpha *= 0.85 * (1 - f2 / 8); T.drawCloud(ctx, dir * s * 0.75, -s * 0.04, s * 0.5, s * 0.14, (o.id || 'emb') + 'dust', { color: '#d8cfc0', line: 4, boil: lt }); ctx.restore(); } } }
    return true;
  }
  function dust(ctx, s, f, o) { const r = T.rng(T.hash((o.id || 'dust') + ':specks')); ctx.fillStyle = '#a8957a'; for (let i = 0; i < 10; i++) { const a = PI + r() * PI, v = s * (0.3 + r() * 0.4) * (f / 6); ctx.beginPath(); ctx.arc(Math.cos(a) * v * 1.4, Math.sin(a) * v * 0.3, s * 0.015 * (1 - f / 7), 0, TAU); ctx.fill(); } }
  M.emblem3d = (ctx, s, lt, o) => {
    const fn = SHAPES[o.shape ?? 'star']; if (!fn) throw new Error('emblem3d: unknown shape ' + o.shape + ' (star|crown|shield|heart|coin|disc|cross-plain)');
    if (!delivered(ctx, s, lt, o, s * 0.45)) return;
    const r = s / 2, col = o.color ?? '#c8213a';
    ctx.save(); ctx.translate(0, -r); extruded(ctx, s, (k) => fn(k, r), col, o.depth ?? 22);
    if (o.shape === 'coin') { ctx.strokeStyle = sh(col, -0.3); ctx.lineWidth = s * 0.02; ctx.beginPath(); ctx.arc(0, 0, r * 0.75, 0, TAU); ctx.stroke(); }
    if (o.text) words(ctx, o.text, 0, 0, r * 1.1, r * 0.4, o.textColor ?? '#ffffff', { stroke: r * 0.05, ink: P.ink });
    ctx.restore();
  };
  M['stat-block'] = (ctx, s, lt, o) => {
    const col = o.color ?? '#9a2a5a', fw = s * 0.6, fh = s * 0.55, dx = s * 0.28, dy = s * 0.14, x0 = -s * 0.44, r = T.rng(T.hash((o.id || 'stat') + ':lumps'));
    if (!delivered(ctx, s, lt, o, s * 0.3)) return;
    const lump = [...Array(12)].map(() => (r() - 0.5) * s * 0.012), sp = [...Array(30)].map(() => [r(), r(), r()]), drips = [...Array(4)].map(() => [r(), 0.04 + r() * 0.1]);
    O(ctx, s, (k) => { k.moveTo(x0 + fw, -fh); k.lineTo(x0 + fw + dx, -fh - dy + lump[0]); k.lineTo(x0 + fw + dx + lump[1], -dy); k.lineTo(x0 + fw, 0); k.closePath(); }, sh(col, -0.3));
    O(ctx, s, (k) => { k.moveTo(x0, -fh); k.lineTo(x0 + dx + lump[2], -fh - dy); k.lineTo(x0 + fw + dx, -fh - dy + lump[0]); k.lineTo(x0 + fw, -fh); k.closePath(); }, sh(col, 0.2));
    O(ctx, s, (k) => { k.moveTo(x0, -fh); k.lineTo(x0 + fw * 0.5, -fh + lump[3]); k.lineTo(x0 + fw, -fh); k.lineTo(x0 + fw + lump[4], -fh * 0.5); k.lineTo(x0 + fw, 0); k.lineTo(x0, 0); k.lineTo(x0 + lump[5], -fh * 0.5); k.closePath(); }, col, (k) => { k.fillStyle = sh(col, -0.15); for (const [a, b, c] of sp) { k.beginPath(); k.arc(x0 + a * fw, -b * fh, s * (0.004 + c * 0.006), 0, TAU); k.fill(); } });
    for (const [a, l] of drips) O(ctx, s * 0.5, (k) => T.rrect(k, x0 + fw * (0.1 + a * 0.8), -fh - s * 0.01, s * 0.025, s * l, s * 0.012), col);
    const tg = o.tag;
    if (tg) { ctx.save(); ctx.translate(x0 + fw * 0.5, -fh * 0.5); ctx.rotate(-6 * D); const w = fw * 0.72, h = fh * 0.48; O(ctx, s, (k) => T.rrect(k, -w / 2, -h / 2, w, h, s * 0.012), '#ffffff'); O(ctx, s, (k) => T.rrect(k, -w / 2, -h / 2, w, h * 0.34, s * 0.012), '#d0202a'); words(ctx, tg.header ?? 'HELLO, I AM', 0, -h / 2 + h * 0.17, w * 0.86, h * 0.2, '#ffffff', { maxH: h * 0.26 }); words(ctx, tg.name ?? '', 0, h * 0.17, w * 0.88, h * 0.3, '#2a1c15', { maxH: h * 0.5 }); ctx.restore(); }
    const cp = o.companion;
    if (cp) { const p = Math.max(0, T.ease.outBack(T.prog(lt, cp.at ?? 0, 0.25))); if (p > 0) { const cs = cp.size ?? s * 0.18; ctx.save(); ctx.translate(x0 + fw + dx + cs * 0.9, 0); ctx.scale(p, p); O(ctx, cs, (k) => k.rect(-cs / 2, -cs, cs, cs), col, fillR(sh(col, -0.3), cs * 0.25, -cs, cs, cs)); words(ctx, cp.text ?? '', 0, -cs * 1.35, cs * 2.4, cs * 0.4, cp.textColor ?? '#ffd21a', { stroke: cs * 0.06, ink: P.ink }); ctx.restore(); } }
  };

  // ---------- prize-wheel, coin-flip (feature 99) ----------
  function wheelAngle(o, lt, segs, total) {
    const sp = evt(o.spin); if (!sp) return 0;
    const u = T.prog(lt, sp.at ?? 0, sp.dur ?? 3.2), land = T.clamp(sp.land ?? 0, 0, segs.length - 1);
    let acc = 0; for (let i = 0; i < land; i++) acc += segs[i].w ?? 1;
    const c = ((acc + (segs[land].w ?? 1) / 2) / total) * 360, segDeg = ((segs[land].w ?? 1) / total) * 360;
    const fin = (sp.turns ?? 3.5) * 360 + (360 - c) - ((sp.turns ?? 3.5) * 360 % 360), over = fin + (sp.overshoot ?? 0.4) * segDeg; // deterministic: no RNG
    if (u <= 0.85) return (over * (1 - Math.exp((-5 * u) / 0.85))) / (1 - Math.exp(-5));
    return T.lerp(over, fin, T.ease.outBack((u - 0.85) / 0.15));
  }
  M['prize-wheel'] = (ctx, s, lt, o) => {
    const segs = o.segments ?? [{ label: 'WIN', color: '#9ad43a' }, { label: 'LOSE', color: '#d63a4a' }, { label: 'AGAIN', color: '#3a8ad6' }, { label: 'LOSE', color: '#f2a63a' }, { label: 'WIN', color: '#9a5ad6' }, { label: 'LOSE', color: '#d63a4a' }];
    const total = segs.reduce((a, g) => a + (g.w ?? 1), 0), r = s / 2, cy = -s * 0.82, rot = wheelAngle(o, lt, segs, total) * D;
    for (const d of [-1, 1]) stick(ctx, s, [[0, cy], [d * s * 0.3, 0]], s * 0.05, '#7a4a2a');
    O(ctx, s, (k) => T.rrect(k, -s * 0.4, -s * 0.04, s * 0.8, s * 0.06, s * 0.02), '#5a3a22');
    ctx.save(); ctx.translate(0, cy); ctx.rotate(rot);
    let a0 = -PI / 2;
    segs.forEach((g, i) => {
      const a1 = a0 + ((g.w ?? 1) / total) * TAU, col = g.color ?? (i % 2 ? '#f2efe9' : '#d63a4a');
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r, a0, a1); ctx.closePath(); ctx.fill();
      ctx.fillStyle = sh(col, -0.15); ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r, (a0 + a1) / 2, a1); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = P.ink; ctx.lineWidth = LW(s) * 0.6; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a0) * r, Math.sin(a0) * r); ctx.stroke();
      if (g.label) { ctx.save(); ctx.rotate((a0 + a1) / 2); const arc = r * (a1 - a0) * 0.62; ctx.lineWidth = 1; T.toonText(ctx, g.label, r * 0.6, 0, { size: Math.min(T.fitSize(ctx, g.label, r * 0.16, r * 0.62), arc * 0.8), fill: '#ffffff', baseline: 'middle', shadow: false }); ctx.restore(); }
      a0 = a1;
    });
    ctx.restore();
    ctx.lineWidth = s * 0.02 + LW(s) * 2; ctx.strokeStyle = P.ink; ctx.beginPath(); ctx.arc(0, cy, r, 0, TAU); ctx.stroke();
    ctx.lineWidth = s * 0.02; ctx.strokeStyle = '#e2b23c'; ctx.stroke();
    O(ctx, s, (k) => k.arc(0, cy, s * 0.06, 0, TAU), '#e2b23c');
    O(ctx, s, (k) => { k.moveTo(-s * 0.05, cy - r - s * 0.07); k.lineTo(s * 0.05, cy - r - s * 0.07); k.lineTo(0, cy - r + s * 0.05); k.closePath(); }, '#ffd21a');
  };
  function coinFace(ctx, s, r, face, edge) {
    if (edge < 0.12) { O(ctx, s, (k) => T.rrect(k, -r, -s * 0.02 - r * edge, 2 * r, s * 0.04 + 2 * r * edge, s * 0.02), '#9c7a1e'); return; }
    ctx.save(); ctx.scale(1, edge);
    O(ctx, s, (k) => k.arc(0, 0, r, 0, TAU), '#e8c040', (k) => { k.strokeStyle = '#b8902a'; k.lineWidth = r * 0.12; k.beginPath(); k.arc(0, 0, r * 0.94, 0, TAU); k.stroke(); k.lineWidth = r * 0.04; k.beginPath(); k.arc(0, 0, r * 0.7, 0, TAU); k.stroke(); });
    if (SHAPES[face]) { ctx.fillStyle = '#a07c20'; ctx.beginPath(); SHAPES[face](ctx, r * 0.5); ctx.fill(); } else words(ctx, face, 0, 0, r, r * 0.8, '#a07c20');
    ctx.restore();
  }
  M['coin-flip'] = (ctx, s, lt, o) => {
    const dur = o.dur ?? 1.6, u = T.clamp(lt / dur), [fx, fy] = o.from ?? [0.3, 0.7], [g0, g1] = o.grow ?? [0.6, 1.6], faces = o.faces ?? ['star', 'crown'];
    const x = fx * T.W * (1 - u), y = (1 - u) * fy * T.H - 4 * u * (1 - u) * T.H * 0.5, f = F(Math.min(lt, dur)), half = 7;
    const nEnd = Math.floor(F(dur) / half + 0.5), off = ((o.land === 'B' ? 1 : 0) - nEnd + 64) % 2, face = faces[(Math.floor(f / half + 0.5) + off) % 2];
    const edge = u >= 1 ? 1 : Math.abs(Math.cos((PI * f) / half)), r = s / 2;
    ctx.translate(x, y); ctx.scale(T.lerp(g0, g1, u), T.lerp(g0, g1, u));
    const sp = evt(o.split), sf = sp ? F(lt - (sp.at ?? dur)) : -1;
    if (sf < 0) { coinFace(ctx, s, r, face, edge); return; }
    if (sf < 1) { O(ctx, s, (k) => k.arc(0, 0, r, 0, TAU), '#ffffff'); return; }
    const cut = [[-r * 1.2, -r * 1.1], [-r * 0.3, -r * 0.2], [-r * 0.1, -r * 0.45], [r * 0.25, r * 0.15], [r * 0.1, r * 0.3], [r * 1.2, r * 1.1]], t = (sf - 1) / 30;
    for (const d of [-1, 1]) {
      // halves drop onto an invisible floor (`floor` px below, default 1.9 r) and settle tilted, so the end frame keeps them
      const fl = o.floor ?? r * 1.9, tl = Math.sqrt(fl / 1500), bt = t > tl ? Math.sin(T.clamp((t - tl) / 0.25) * PI) * r * 0.12 : 0;
      ctx.save(); ctx.translate(d * 200 * Math.min(1, (sf - 1) / 12), Math.min(fl, 1500 * t * t) - bt); ctx.rotate(d * Math.min(t, tl) * 1.5);
      ctx.beginPath(); ctx.moveTo(cut[0][0], cut[0][1]); cut.forEach(([a, b]) => ctx.lineTo(a, b)); ctx.lineTo(d < 0 ? -r * 1.3 : r * 1.3, d < 0 ? r * 1.3 : -r * 1.3); ctx.closePath(); ctx.clip();
      coinFace(ctx, s, r, face, 1); ctx.restore();
    }
  };
  Object.assign(T.PROPS, M);
})();
