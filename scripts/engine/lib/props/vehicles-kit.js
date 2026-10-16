// vehicles-kit.js — motion toolkit and dispatch of the v2 vehicles (vehicles-road.js, vehicles-rail-sea.js,
// vehicles-air.js): travel-driven wheels (T.vehicleMotion: the distance actually travelled along `path` / `move`, so
// wheels never skid), suspension bounce over seeded terrain, world-space trails emitted along the past positions of
// the layer (smoke, exhaust, dust, steam, contrails, ship wakes: each puff is a pure function of its emission time, so
// frames do not depend on render order), headlight cones, wave heave / pitch for ships, painted wheels.
// T.vehicleRig(L, painted): 'v2' for new kinds, and for tank / train / biplane / submarine / car1910 in the painted
// look or with path / rig: "v2"; classic specs keep the classic drawing (vehicles.js) pixel for pixel.
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL, TAU = Math.PI * 2, D = T.DEG;
  const VK = (T.VK = T.VK || {});
  const inWin = (wins, lt) => (wins || []).some(([a, b]) => lt >= a && lt <= b);
  const driven = (wins, lt) => (wins || []).reduce((s, [a, b]) => s + Math.max(0, Math.min(lt, b) - a), 0);
  VK.inWin = inWin;
  VK.sh = (c, k = -0.22) => T.shade(c, k);
  const DRIVE_PX = 220; // px/s of "virtual" travel inside drive windows when the layer itself does not move

  // ---------- motion ----------
  T.vehicleMotion = (L, slt) => {
    const tr = T.layerTravel(L, slt);
    return { dist: tr.dist, speed: tr.speed, path: tr.path, moving: !!(L.path || (L.move && L.move.length)) };
  };
  // Wheel angle (rad) for a wheel of radius r local units, k local->px scale.
  VK.wheelAng = (S, k, r) => S.dist / Math.max(1e-6, k * S.px * r);
  const TERRAIN = { smooth: [0.6, 300], road: [1.6, 220], rail: [0.8, 120], cobble: [3.5, 60], dirt: [5, 160], rough: [10, 120] };
  // Suspension: heights of front / rear contact from seeded noise along the distance -> body lift and pitch.
  VK.bump = (S, k, wb, terrain) => {
    const [amp, len] = TERRAIN[terrain] || TERRAIN.road, d = S.dist / Math.max(1e-6, k * S.px), seed = S.seed + 'bump';
    const h = (x) => T.noise(x / len, seed) * amp + T.noise(x / (len * 0.31), seed + 'f') * amp * 0.4;
    const f = h(d + wb / 2) * T.clamp(S.speed / 60), r = h(d - wb / 2) * T.clamp(S.speed / 60);
    const idle = S.engine ? Math.sin(S.lt * TAU * 13) * 0.8 : 0; // engine shiver
    return { dy: -(f + r) / 2 + idle, pitch: -Math.atan2(f - r, wb), f, r };
  };
  // Heave and pitch of a hull of length len on the shot's swell (two crossing sine trains).
  VK.wave = (lt, x) => Math.sin(x * 0.006 - lt * 1.7) * 9 + Math.sin(x * 0.013 + lt * 2.3 + 1.3) * 4;
  VK.rock = (S, k, len, amp = 1) => {
    const wx = S.slt * 40, a = VK.wave(S.lt, wx - len * k / 2), b = VK.wave(S.lt, wx + len * k / 2);
    return { dy: ((a + b) / 2) / k * amp, pitch: Math.atan2(a - b, len * k) * amp * 1.4 + Math.sin(S.lt * 1.1) * 1.2 * D * amp };
  };

  // ---------- drawing helpers ----------
  // Spoked / disc wheel at (x, y), radius r, angle a. o: {spokes, rim, tyre, hub, disc, white (whitewall)}
  VK.wheel = (ctx, x, y, r, a, o = {}) => {
    const tyre = o.tyre ?? '#262224', rim = o.rim ?? '#c9ced2', line = Math.max(4, r * 0.1);
    T.outlined(ctx, (k) => k.arc(x, y, r, 0, TAU), tyre, { line });
    if (o.white) T.outlined(ctx, (k) => k.arc(x, y, r * 0.78, 0, TAU), '#f2efe6', { line: line * 0.6, paint: false });
    T.outlined(ctx, (k) => k.arc(x, y, r * (o.white ? 0.6 : 0.74), 0, TAU), rim, { line: line * 0.7 });
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    if (o.spokes) {
      ctx.strokeStyle = o.spokeColor ?? VK.sh(rim, -0.4); ctx.lineWidth = Math.max(2, r * 0.07); ctx.lineCap = 'round';
      for (let i = 0; i < o.spokes; i++) { const b = (i / o.spokes) * TAU; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(b) * r * 0.72, Math.sin(b) * r * 0.72); ctx.stroke(); }
    } else { // disc: bolt ring and a highlight that turns, so rotation reads
      ctx.fillStyle = VK.sh(rim, -0.35);
      for (let i = 0; i < 5; i++) { const b = (i / 5) * TAU; ctx.beginPath(); ctx.arc(Math.cos(b) * r * 0.36, Math.sin(b) * r * 0.36, r * 0.07, 0, TAU); ctx.fill(); }
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = r * 0.08; ctx.beginPath(); ctx.arc(0, 0, r * 0.55, -0.4, 0.5); ctx.stroke();
    }
    ctx.restore();
    T.outlined(ctx, (k) => k.arc(x, y, r * 0.18, 0, TAU), o.hub ?? VK.sh(rim, -0.2), { line: line * 0.5, paint: false });
    if (o.blur && Math.abs(o.blur) > 0.4) { ctx.save(); ctx.globalAlpha = T.clamp(Math.abs(o.blur) - 0.4) * 0.6; ctx.fillStyle = VK.sh(rim, -0.2); ctx.beginPath(); ctx.arc(x, y, r * 0.72, 0, TAU); ctx.fill(); ctx.restore(); }
  };
  // Additive headlight cone from (x, y) forward (+x), length len, half-angle spread (rad).
  VK.headlight = (ctx, x, y, len, spread = 0.22, color = '#fff2b8') => {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(x, y, x + len, y);
    g.addColorStop(0, color + 'aa'); g.addColorStop(0.4, color + '44'); g.addColorStop(1, color + '00');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x, y - 6); ctx.lineTo(x + len, y - Math.tan(spread) * len * 0.6); ctx.lineTo(x + len, y + Math.tan(spread) * len * 1.2); ctx.lineTo(x, y + 6); ctx.closePath(); ctx.fill();
    const h = ctx.createRadialGradient(x, y, 0, x, y, 40); h.addColorStop(0, '#ffffffee'); h.addColorStop(1, color + '00');
    ctx.fillStyle = h; ctx.beginPath(); ctx.arc(x, y, 40, 0, TAU); ctx.fill();
    ctx.restore();
  };
  // Propeller disc seen from the side: a translucent blur ellipse with two smeared blades.
  VK.propBlur = (ctx, x, y, r, lt, o = {}) => {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = 'rgba(235,235,230,0.38)'; ctx.beginPath(); ctx.ellipse(0, 0, r * (o.flat ?? 0.16), r, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(60,50,45,0.45)'; ctx.lineWidth = r * 0.14; ctx.lineCap = 'round';
    for (const off of [0, Math.PI]) { const a = lt * 47 + off; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * r * (o.flat ?? 0.16), Math.sin(a) * r); ctx.stroke(); }
    ctx.restore();
    T.outlined(ctx, (k) => k.ellipse(x, y, r * 0.12, r * 0.16, 0, 0, TAU), o.spinner ?? '#3a3a3a', { line: 5 });
  };

  // ---------- world-space trails ----------
  // A local point (layer units, before the kind's own scale k) of the layer at shot time te, in world coordinates.
  function worldPt(L, te, lx, ly) {
    const st = T.layerState(L, te);
    if (!st) return null;
    const fx = st.flip * st.sx * st.s, fy = st.sy * st.s, c = Math.cos(st.r), s = Math.sin(st.r), x = lx * fx, y = ly * fy;
    return [st.x + x * c - y * s, st.y + x * s + y * c, st];
  }
  VK.worldPt = worldPt;
  const PUFF = {
    smoke: { every: 0.1, life: 2.4, size: 15, grow: 2.3, rise: 230, color: '#8f8a86', alpha: 0.85, min: -1 },
    steam: { every: 0.09, life: 1.4, size: 20, grow: 3, rise: 120, color: '#f2f2ee', alpha: 0.9, min: -1 },
    exhaust: { every: 0.09, life: 0.7, size: 6, grow: 2.2, rise: 30, color: '#a8a4a0', alpha: 0.7, min: -1 },
    dust: { every: 0.07, life: 0.9, size: 18, grow: 2.4, rise: 34, color: '#c8a878', alpha: 0.75, min: 40 },
    wake: { every: 0.08, life: 2.2, size: 12, grow: 5, rise: 0, color: '#f4fbff', alpha: 0.85, min: 20, flat: true },
    fire: { every: 0.06, life: 0.5, size: 14, grow: 1.2, rise: 60, color: '#ffb030', alpha: 0.9, min: -1 },
  };
  VK.PUFF = PUFF;
  // Emit puffs of `kind` from local point [lx, ly] (layer units incl. the kind scale) for the layer's past positions.
  // Draws in world space: call with the context in the world (camera) frame — see VK.inWorld.
  VK.puffs = (ctx, L, slt, kind, lx, ly, o = {}) => {
    const p = { ...PUFF[kind], ...o }, seed = String(L.id ?? L.kind) + kind + lx;
    const n0 = Math.floor((slt - p.life) / p.every), n1 = Math.floor(slt / p.every), a0 = ctx.globalAlpha;
    const wind = o.wind ?? -30;
    for (let i = Math.max(n0, 0); i <= n1; i++) {
      const te = i * p.every, age = slt - te;
      if (age < 0 || age > p.life) continue;
      if (o.when && !o.when(te)) continue;
      if (p.min >= 0) { const sp = T.vehicleMotion(L, te).speed; if (sp < p.min) continue; }
      const w = worldPt(L, te, lx, ly);
      if (!w) continue;
      const r = T.rng(T.hash(seed + ':' + i)), f = age / p.life, sc = Math.abs(w[2].s);
      const x = w[0] + (wind * age + (r() - 0.5) * (20 + 50 * f)) * sc, y = w[1] - (p.rise * (1 - (1 - f) * (1 - f)) + (r() - 0.5) * 10) * sc;
      const rad = p.size * (1 + f * p.grow) * (0.8 + r() * 0.4) * sc * (o.scale ?? 1);
      ctx.globalAlpha = a0 * p.alpha * (1 - f) * (f < 0.1 ? f / 0.1 : 1);
      if (p.flat) T.outlined(ctx, (k) => k.ellipse(x, y, rad * 1.8, rad * 0.35, 0, 0, TAU), p.color, { line: 0, paint: false });
      else T.outlined(ctx, (k) => k.arc(x, y, rad, 0, TAU), T.mix(p.color, '#ffffff', r() * 0.25), { line: Math.max(2, Math.min(6, rad * 0.08)), paint: f < 0.6 ? 0.7 : false, ink: VK.sh(p.color, -0.4) });
    }
    ctx.globalAlpha = a0;
  };
  // Continuous contrail: the local point's past positions as a tapered fading white ribbon.
  VK.contrail = (ctx, L, slt, lx, ly, o = {}) => {
    const life = o.life ?? 2.4, step = 1 / 30, pts = [];
    for (let te = Math.max(0, slt - life); te <= slt + 1e-6; te += step) { const w = worldPt(L, te, lx, ly); if (w) pts.push([w[0], w[1], (slt - te) / life, Math.abs(w[2].s)]); }
    ctx.save(); ctx.lineCap = 'round';
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0, f0, s0] = pts[i - 1], [x1, y1] = pts[i], spread = 1 + f0 * 3;
      ctx.strokeStyle = `rgba(255,255,255,${(0.75 * (1 - f0)).toFixed(3)})`; ctx.lineWidth = (o.w ?? 10) * spread * s0;
      ctx.beginPath(); ctx.moveTo(x0, y0 - T.noise(f0 * 6, 'ct' + i % 7) * 0); ctx.lineTo(x1, y1); ctx.stroke();
    }
    ctx.restore();
  };
  // Run fn(ctx) in the world (camera) frame: undoes the layer transform applied by core.drawLayer.
  VK.inWorld = (ctx, env, fn) => {
    const st = env && env.st;
    if (!st) return;
    ctx.save();
    ctx.scale(1 / (st.s * st.flip * st.sx), 1 / (st.s * st.sy)); ctx.rotate(-st.r); ctx.translate(-st.x, -st.y);
    fn(ctx);
    ctx.restore();
  };

  // ---------- dispatch ----------
  VK.FN = {}; // kind -> v2 draw(ctx, L, S, env)
  VK.SIZE = {};
  VK.LEGACY_V2 = new Set(['tank', 'train', 'biplane', 'submarine', 'car1910']);
  const NEW_FIELDS = ['path', 'terrain', 'lights', 'dust', 'exhaust', 'wake', 'contrail', 'spray', 'animal', 'team'];
  T.vehicleRig = (L, painted) => {
    if (!VK.FN[L.kind]) return 'legacy';
    if (!VK.LEGACY_V2.has(L.kind)) return 'v2';
    if (L.rig === 'classic') return 'legacy';
    if (L.rig === 'v2' || painted || NEW_FIELDS.some((f) => L[f] != null)) return 'v2';
    return 'legacy';
  };
  // S: {size, lt (layer), slt (shot), dist (px travelled, forward), speed (px/s), driving, engine, path, bank, px (layer scale), seed}
  VK.state = (L, lt, env, size) => {
    const slt = env && env.lt != null ? env.lt : lt, moving = !!(L.path || (L.move && L.move.length));
    const tr = moving ? T.vehicleMotion(L, slt) : null, drive = inWin(L.drive, lt);
    const dist = moving ? tr.dist : driven(L.drive, lt) * (L.speed ?? 1) * DRIVE_PX, speed = moving ? tr.speed : drive ? DRIVE_PX * (L.speed ?? 1) : 0;
    return { size, lt, slt, dist, speed, driving: speed > 2, engine: L.engine !== false, path: tr && tr.path, bank: (tr && tr.path && tr.path.bank) || 0,
      px: Math.abs((env && env.st && env.st.s) || 1), seed: String(L.id ?? L.kind), moving };
  };
  // trails(L, S) -> [[puff kind | 'contrail', lx, ly, opts], ...] in layer units (the kind scale applied, facing +x)
  VK.TRAILS = {};
  VK.register = (kind, fn, size, trails) => {
    VK.FN[kind] = fn; VK.SIZE[kind] = size;
    if (trails) VK.TRAILS[kind] = trails;
    if (!T.VEHICLES[kind]) T.VEHICLES[kind] = (ctx, L, s, env) => fn(ctx, L, { ...VK.state(L, s.lt, null, s.size ?? size), dist: s.dist * DRIVE_PX, speed: s.driving ? DRIVE_PX : 0, driving: s.driving }, env || {}); // obj layer / legacy callers
  };
  const legacyLayer = T.layers.vehicle;
  T.layers.vehicle = (ctx, L, lt, env) => {
    if (T.vehicleRig(L, !!T.PAINT) !== 'v2') return legacyLayer(ctx, L, lt, env);
    const S = VK.state(L, lt, env, L.size ?? VK.SIZE[L.kind] ?? 480), sg = !L.path && L.dir === -1 ? -1 : 1;
    const tr = VK.TRAILS[L.kind] && env && env.st ? VK.TRAILS[L.kind](L, S) : null;
    if (tr && tr.length) VK.inWorld(ctx, env, (c) => { // trails stay where they were emitted: drawn in the world, behind the body
      for (const [kind, lx, ly, o] of tr) {
        if (kind === 'contrail') VK.contrail(c, L, S.slt, lx * sg, ly, o);
        else VK.puffs(c, L, S.slt, kind, lx * sg, ly, { wind: -30 * sg, ...o });
      }
    });
    if (sg < 0) ctx.scale(-1, 1);
    VK.FN[L.kind](ctx, L, S, env || {});
  };
  VK.D = D; VK.P = P;
})();
