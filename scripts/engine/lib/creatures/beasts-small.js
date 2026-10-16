// beasts-small.js — v2 creatures with their own rigs: chicken (two-leg walk with the head-stabilising bob, pecking,
// flapping when scared), bird (flap / glide cycle, perch, `flock` of n birds), fish (body wave whose tail beat
// follows the swim speed, `school` of n fish) and snake (slither: a travelling wave locked to the distance moved, so
// the body does not slide; tongue flicks). Units: 400 per `size`, ground (or the swim / flight centre) at y = 0.
(function () {
  'use strict';
  const T = window.TOON, CK = T.CK, P = T.PAL, TAU = Math.PI * 2, D = T.DEG, sh = CK.sh, leaf = CK.leaf;
  const blob = (pts) => (k) => T.smoothPath(k, pts);
  const seedOf = (L) => String(L.id ?? L.kind) + (L.x ?? '');
  const exprOf = (L, lt, def = 'neutral') => CK.expr(L.expr != null ? T.timed(L.expr, lt, 0).cur : def);
  const travelOf = (L, lt, env, k) => {
    const tr = env && env.st && (env.st.path || L.path || L.move) ? T.layerTravel(L, env.lt ?? lt) : { dist: 0, speed: 0 };
    const px = Math.max(1e-6, k * Math.abs(env && env.st ? env.st.s : 1));
    return { dist: tr.dist / px, speed: tr.speed / px, moving: !!(L.path || (L.move && L.move.length)) };
  };
  const stateOf = (L, lt, fallback) => (L.state != null ? T.timed(L.state, lt, 0).cur : fallback);

  // ---------- chicken ----------
  function chicken(ctx, L, lt, env) {
    const k = (L.size ?? 160) / 400, seed = seedOf(L);
    ctx.scale(k, k);
    const tr = travelOf(L, lt, env, k), st = stateOf(L, lt, tr.moving && tr.speed > 8 ? 'walk' : CK.inWin(L.walk, lt) ? 'walk' : 'idle');
    const walking = st === 'walk' || st === 'run', run = st === 'run', scared = st === 'scared', eat = st === 'eat', sleep = st === 'sleep';
    const cyc = run ? 150 : 110, ph = tr.moving ? tr.dist / cyc : lt * (run ? 3.4 : 2.2);
    const col = L.color ?? '#f4efe4', comb = L.color2 ?? '#d8322e', e = exprOf(L, lt, scared ? 'scared' : sleep ? 'sleep' : 'neutral');
    CK.shadow(ctx, L, 0, 120);
    const bob = walking ? -Math.abs(Math.sin(ph * TAU)) * 10 : sleep ? 60 : 0;
    // legs: two-beat walk, planted foot slides back at the travel speed
    for (const [i, far] of [[1, true], [0, false]]) {
      const u = CK.fract(ph + i * 0.5), stance = u < 0.55;
      const fx = walking ? (stance ? cyc * 0.55 * (0.5 - u / 0.55) : cyc * 0.55 * (-0.5 + CK.smooth(0, 1, (u - 0.55) / 0.45))) : (i ? -18 : 18);
      const fy = walking && !stance ? -Math.sin(((u - 0.55) / 0.45) * Math.PI) * 30 : 0;
      if (sleep) continue;
      const hip = [far ? 10 : -6, -150 + bob], knee = CK.ik2(hip[0], hip[1], fx, fy - 10, 80, 72, -1);
      ctx.strokeStyle = P.ink; ctx.lineWidth = 15; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const legc = far ? sh('#e8a030', -0.25) : '#e8a030';
      ctx.beginPath(); ctx.moveTo(...hip); ctx.lineTo(...knee); ctx.lineTo(fx, fy - 10); ctx.stroke();
      ctx.strokeStyle = legc; ctx.lineWidth = 8; ctx.stroke();
      ctx.strokeStyle = P.ink; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(fx - 22, fy); ctx.lineTo(fx + 28, fy); ctx.moveTo(fx, fy - 10); ctx.lineTo(fx + 20, fy - 2); ctx.stroke();
    }
    ctx.save(); ctx.translate(0, bob);
    const flap = scared ? Math.sin(lt * TAU * 6) : 0;
    T.outlined(ctx, (c) => { c.moveTo(-110, -230); c.quadraticCurveTo(-170, -320, -150, -360); c.quadraticCurveTo(-120, -300, -60, -250); c.closePath(); }, sh(col, -0.08), { line: 8 }); // tail plume
    T.outlined(ctx, blob([[-130, -250], [-80, -300], [20, -290], [90, -250], [96, -180], [40, -126], [-60, -124], [-120, -170]]), col, { line: 8 });
    ctx.save(); ctx.translate(-20, -220); ctx.rotate(-flap * 0.8 - (scared ? 0.6 : 0));
    T.outlined(ctx, blob([[-70, -10], [10, -30], [60, 0], [10, 34], [-60, 24]]), sh(col, -0.12), { line: 7 }); ctx.restore();
    // head: stabilised while walking (holds still in space, then snaps forward), pecks when eating
    const hold = walking ? -(CK.fract(ph * 2) - 0.5) * cyc * 0.5 : 0, peck = eat ? Math.max(0, Math.sin(lt * TAU * 1.6)) : 0;
    ctx.save(); ctx.translate(70 + hold * 0.6, -290 + peck * 150); ctx.rotate(peck * 1.2);
    T.outlined(ctx, (c) => { c.moveTo(-6, -40); for (let i = 0; i < 3; i++) c.quadraticCurveTo(-10 + i * 22, -84, 10 + i * 22, -44); c.closePath(); }, comb, { line: 6 });
    T.outlined(ctx, (c) => c.arc(0, 0, 46, 0, TAU), col, { line: 8 });
    T.outlined(ctx, (c) => { c.moveTo(38, -10); c.lineTo(84, 6); c.lineTo(38, 20); c.closePath(); }, '#f0b030', { line: 6 });
    T.outlined(ctx, (c) => c.ellipse(36, 34, 10, 18, 0, 0, TAU), comb, { line: 5 });
    CK.eye(ctx, 12, -8, 11, { e, blink: CK.blink(seed, lt), look: [0.6, 0], lidColor: col });
    ctx.restore();
    ctx.restore();
    if (sleep) CK.zzz(ctx, 100, -360, lt, 22);
    if (scared) CK.sweat(ctx, 110, -340, lt, 8);
  }

  // ---------- bird ----------
  // One bird at the origin (body centre), facing +x; flap in 0..1 (wing up 0 -> down 1), glide pose when flap is null.
  function birdBody(ctx, o) {
    const { col, belly, beak, e, blink, flapA, perch, wing } = o;
    const wingPath = (up) => (c) => { const tipY = T.lerp(-170, 110, up), midY = T.lerp(-90, 50, up); c.moveTo(-30, -10); c.quadraticCurveTo(-60, midY, -150 + Math.abs(up - 0.5) * 60, tipY); c.quadraticCurveTo(-40, midY * 0.4 + 10, 30, 0); c.closePath(); };
    if (wing) T.outlined(ctx, wingPath(T.clamp(flapA + 0.08)), sh(col, -0.3), { line: 7 }); // far wing
    T.outlined(ctx, (c) => { c.moveTo(-90, -6); c.lineTo(-170, -30); c.lineTo(-160, 10); c.lineTo(-170, 34); c.lineTo(-90, 16); c.closePath(); }, sh(col, -0.12), { line: 7 }); // tail
    T.outlined(ctx, blob([[-100, 0], [-40, -44], [40, -46], [90, -20], [80, 30], [0, 44], [-80, 26]]), col, { line: 8, shade: (c) => { c.fillStyle = belly; c.beginPath(); c.ellipse(20, 30, 70, 26, 0, 0, TAU); c.fill(); } });
    T.outlined(ctx, (c) => c.arc(84, -38, 40, 0, TAU), col, { line: 8 });
    T.outlined(ctx, (c) => { c.moveTo(114, -50); c.lineTo(166, -34); c.lineTo(114, -22); c.closePath(); }, beak, { line: 6 });
    CK.eye(ctx, 96, -44, 11, { e, blink, look: [0.6, 0], lidColor: col });
    if (perch) { ctx.strokeStyle = '#3a3a3a'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-6, 40); ctx.lineTo(-12, 80); ctx.moveTo(18, 40); ctx.lineTo(14, 80); ctx.stroke(); }
    if (wing) T.outlined(ctx, wingPath(flapA), col, { line: 7 });
    else T.outlined(ctx, blob([[-70, -10], [0, -30], [50, -6], [0, 18]]), sh(col, 0.06), { line: 6 });
  }
  function bird(ctx, L, lt, env) {
    const k = (L.size ?? 120) / 400, seed = seedOf(L);
    ctx.scale(k, k);
    const tr = travelOf(L, lt, env, k), st = stateOf(L, lt, tr.moving || L.fly || CK.inWin(L.flap, lt) ? 'fly' : 'idle');
    const col = L.color ?? '#3a4a6a', belly = L.color2 ?? '#e8dcc8', beak = L.beakColor ?? '#f0a830', e = exprOf(L, lt);
    const n = L.flock ?? 1, r = T.rng(T.hash(seed + 'flock')), spread = L.spread ?? 1;
    const members = [];
    for (let i = 0; i < n; i++) { // V-ish formation behind the leader with seeded jitter; each drifts on its own noise
      const row = Math.ceil(i / 2), side = i % 2 ? 1 : -1;
      members.push({ dx: -row * 260 * spread + (r() - 0.5) * 80, dy: side * row * 120 * spread + (r() - 0.5) * 60, ph: r(), s: 0.8 + r() * 0.3, id: i });
    }
    members.sort((a, b) => a.dy - b.dy);
    for (const m of members) {
      const lt2 = lt + m.ph * 3, drift = [T.noise(lt * 0.6, seed + m.id + 'x') * 30, T.noise(lt * 0.7, seed + m.id + 'y') * 30];
      ctx.save(); ctx.translate(m.dx + drift[0], m.dy + drift[1]); ctx.scale(m.s, m.s);
      let flapA = 0.5, wing = st !== 'idle';
      if (st === 'fly') { // 1.1 s of flapping then 0.7 s glide, per bird
        const cyc = CK.fract(lt2 / 1.8), hz = 3.2 + T.clamp(tr.speed / 900) * 2;
        flapA = cyc < 0.62 || L.glide === false ? 0.5 - 0.5 * Math.cos(lt2 * TAU * hz) : 0.35 + Math.sin(lt2 * 3) * 0.04;
        ctx.translate(0, -Math.sin(lt2 * TAU * hz) * 10 * (cyc < 0.62 ? 1 : 0));
      } else if (st === 'glide') flapA = 0.35 + Math.sin(lt2 * 2) * 0.05;
      if (st === 'idle' && L.perch === false) wing = false;
      birdBody(ctx, { col, belly, beak, e, blink: CK.blink(seed + m.id, lt), flapA, perch: st === 'idle' && L.perch !== false, wing });
      ctx.restore();
    }
  }

  // ---------- fish ----------
  function fish(ctx, L, lt, env) {
    const k = (L.size ?? 160) / 400, seed = seedOf(L);
    ctx.scale(k, k);
    const tr = travelOf(L, lt, env, k), hz = 1.2 + T.clamp(tr.speed / 600) * 3, col = L.color ?? '#e8823a', fin = L.color2 ?? sh(col, -0.2), e = exprOf(L, lt);
    const n = L.school ?? 1, r = T.rng(T.hash(seed + 'school')), list = [];
    for (let i = 0; i < n; i++) list.push({ dx: i ? (r() - 0.6) * 700 : 0, dy: i ? (r() - 0.5) * 500 : 0, ph: r(), s: i ? 0.7 + r() * 0.4 : 1, id: i });
    list.sort((a, b) => a.s - b.s);
    for (const f of list) {
      const t = lt + f.ph * 2, w = (x) => Math.sin(t * TAU * hz - x * 0.012) * (x < 0 ? -x * 0.08 : 2); // body wave grows toward the tail
      ctx.save(); ctx.translate(f.dx + T.noise(lt * 0.5, seed + f.id) * 20, f.dy + T.noise(lt * 0.4, seed + f.id + 'y') * 20); ctx.scale(f.s, f.s);
      const top = [], bot = [];
      for (let x = 150; x >= -150; x -= 20) { const h = 80 * Math.sqrt(Math.max(0, 1 - ((x - 10) / 165) ** 2)) + 10; top.push([x, -h + w(x)]); bot.unshift([x, h * 0.85 + w(x)]); }
      const tailY = w(-170), tail = (c) => { c.moveTo(-140, tailY); c.lineTo(-230, tailY - 70 + w(-230)); c.quadraticCurveTo(-200, tailY + w(-210), -230, tailY + 70 + w(-230)); c.closePath(); };
      T.outlined(ctx, tail, fin, { line: 7 });
      T.outlined(ctx, (c) => { c.moveTo(-40, -80 + w(-40)); c.quadraticCurveTo(-10, -150, 60, -86); c.closePath(); }, fin, { line: 6 });
      T.outlined(ctx, (c) => { top.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); bot.forEach(([x, y]) => c.lineTo(x, y)); c.closePath(); }, col, { line: 8,
        shade: (c) => { c.strokeStyle = sh(col, -0.25); c.lineWidth = 5; for (const sx of [-90, -50, -10]) { c.beginPath(); c.arc(sx, w(sx), 60, -0.6, 0.6); c.stroke(); } } });
      ctx.save(); ctx.translate(-10, 30 + w(-10)); ctx.rotate(0.4 + Math.sin(t * TAU * hz * 1.3) * 0.3); T.outlined(ctx, leaf(0, 0, -50, 26, 14), fin, { line: 5 }); ctx.restore();
      CK.eye(ctx, 100, -20, 16, { e, blink: CK.blink(seed + f.id, lt), look: [0.5, 0], lidColor: col });
      ctx.strokeStyle = P.ink; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(150, 20, 16, 2.2, 3.4); ctx.stroke();
      if (L.bubbles !== false && f.id === 0) for (let i = 0; i < 3; i++) { const p = CK.fract(lt / 1.6 + i / 3); ctx.globalAlpha = 1 - p; T.outlined(ctx, (c) => c.arc(170 + Math.sin(p * 9 + i) * 10, -40 - p * 220, 8 + p * 8, 0, TAU), 'rgba(220,240,255,0.6)', { line: 3, paint: false }); ctx.globalAlpha = 1; }
      ctx.restore();
    }
  }

  // ---------- snake ----------
  function snake(ctx, L, lt, env) {
    const k = (L.size ?? 160) / 400, seed = seedOf(L);
    ctx.scale(k, k);
    const tr = travelOf(L, lt, env, k), st = stateOf(L, lt, tr.moving ? 'walk' : 'idle'), col = L.color ?? '#5a9a3a', belly = L.color2 ?? '#e8d890', e = exprOf(L, lt);
    const wl = 260, len = L.length ?? 900, amp = st === 'idle' ? 26 : 46;
    // the wave is fixed to the ground: it moves back through the body exactly as fast as the snake moves forward
    const ph = tr.moving ? tr.dist / wl : lt * 0.6, pts = [];
    for (let s = 0; s <= len; s += 30) { const x = -s, fade = Math.min(1, s / 160); pts.push([x, -30 - Math.sin((x / wl) * TAU + ph * TAU) * amp * fade]); }
    const ws = pts.map((_, i) => { const f = i / (pts.length - 1); return 30 * (1 - f * f) + 3; });
    CK.shadow(ctx, L, -len / 2, len / 2 + 40);
    T.outlined(ctx, CK.tube(pts, ws, false), col, { line: 8, shade: (c) => { c.fillStyle = sh(col, -0.3); for (let i = 2; i < pts.length - 2; i += 2) { c.beginPath(); c.ellipse(pts[i][0], pts[i][1] - ws[i] * 0.3, 12, ws[i] * 0.45, 0, 0, TAU); c.fill(); } } });
    const lift = st === 'scared' || L.raised ? 120 : 34, hx = 26, hy = -30 - lift;
    T.outlined(ctx, CK.tube([[0, pts[0][1]], [14, -30 - lift * 0.6], [hx, hy]], [30, 28, 26], false), col, { line: 8 });
    const flick = CK.event(seed + 'tongue', lt, 1.4, 0.8, 0.35);
    if (flick >= 0) { ctx.strokeStyle = '#d8323a'; ctx.lineWidth = 5; ctx.lineCap = 'round'; const tl = Math.sin(flick * Math.PI) * 50; ctx.beginPath(); ctx.moveTo(hx + 60, hy + 10); ctx.lineTo(hx + 60 + tl, hy + 10); ctx.lineTo(hx + 70 + tl, hy); ctx.moveTo(hx + 60 + tl, hy + 10); ctx.lineTo(hx + 70 + tl, hy + 20); ctx.stroke(); }
    T.outlined(ctx, blob([[hx - 30, hy - 26], [hx + 30, hy - 34], [hx + 70, hy - 10], [hx + 66, hy + 22], [hx + 10, hy + 30], [hx - 30, hy + 16]]), col, { line: 8, shade: (c) => { c.fillStyle = belly; c.beginPath(); c.ellipse(hx + 20, hy + 26, 40, 10, 0, 0, TAU); c.fill(); } });
    CK.eye(ctx, hx + 26, hy - 14, 11, { e, blink: CK.blink(seed, lt), look: [0.6, 0], lidColor: col, iris: '#2a3a10' });
  }

  for (const [kind, fn] of Object.entries({ chicken, bird, fish, snake })) CK.register(kind, fn);
})();
