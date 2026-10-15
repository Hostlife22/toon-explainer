// action-fx.js — action effects: brawl cloud (T.drawBrawl), blood stand-ins (wipe, streaks, splash, pool), mob silhouettes (fg)
// and shadow hands, comic boom + onomatopoeia, word-shatter, crackle / beam-clash / duel, light kit (lightpool, shafts,
// godbeam, spotcone), spill / ink-creep, and more grade presets. Timings are measured at 30 fps on the references.
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL, W = T.W, H = T.H, FX = T.FX, INK = P.ink;
  const twos = (lt) => Math.floor(lt * 15);
  const fr = (lt) => lt * 30;

  // ---------- frame-space helpers ----------
  // Full-frame kinds draw in 1920x1080 frame coordinates: camera applied unless the layer is hud.
  function frameSpace(ctx, L, env) {
    const d = (env && env.dpr) || T.DPR;
    ctx.setTransform(d, 0, 0, d, 0, 0);
    if (!L.hud && env && env.cam) T.applyCam(ctx, env.cam, L.z ?? 1);
  }
  const fp = (p, def) => { const v = p ?? def; return [v[0] * W, v[1] * H]; };
  const poly = (k, pts) => { k.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) k.lineTo(pts[i][0], pts[i][1]); };
  const star4 = (ctx, x, y, s, fill, line = 4) => T.outlined(ctx, (k) => { k.moveTo(x, y - s); k.quadraticCurveTo(x, y, x + s, y); k.quadraticCurveTo(x, y, x, y + s); k.quadraticCurveTo(x, y, x - s, y); k.quadraticCurveTo(x, y, x, y - s); }, fill, { line });
  // Draw fn opaque into a scratch copy, then composite it once at `alpha`: fading smoke and clouds stay one merged
  // silhouette instead of showing every overlapping lobe and its outline through the others.
  function group(ctx, alpha, name, fn) {
    if (alpha <= 0) return;
    if (alpha >= 0.999) { fn(ctx); return; }
    const cv = ctx.canvas, [c, k] = T.scratch(name, cv.width, cv.height);
    k.setTransform(1, 0, 0, 1, 0, 0); k.clearRect(0, 0, c.width, c.height);
    k.setTransform(ctx.getTransform());
    fn(k);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha *= alpha; ctx.drawImage(c, 0, 0); ctx.restore();
  }
  // Seeded lobed blob radius at angle index i (periodic, so the outline closes smoothly).
  const lobed = (i, n, seed, amp = 0.18) => 1 + amp * (0.6 * T.noise((i / n) * 6, seed) + 0.4 * Math.sin((i / n) * Math.PI * 2 * 3 + (T.hash(seed) % 7)));

  // ---------- brawl ----------
  // T.drawBrawl(ctx, x, y, size, lt, seed, o): white fight cloud with limbs, weapons, helmets, an angry face, stars
  // and pebbles; everything re-seeds on twos. o: {limbs, skins (hex), stars 5, dust true, line 6}. Used by MAP brawls.
  const LIMBS = ['fist', 'boot', 'sword', 'spear'];
  T.drawBrawl = (ctx, x, y, size, lt, seed, o = {}) => {
    const b = T.rng(T.hash(seed + ':brawl:' + twos(lt))), r = T.rng(T.hash(seed + ':base'));
    const limbs = o.limbs && o.limbs.length ? o.limbs : LIMBS, skins = o.skins && o.skins.length ? o.skins : ['#c8323a', '#4f7fb8'];
    const cx = x + (b() - 0.5) * 12, cy = y + (b() - 0.5) * 12, rx = size * 0.5, ry = size * 0.36;
    ctx.save();
    if (o.dust !== false) { ctx.fillStyle = 'rgba(90,58,40,0.6)'; ctx.beginPath(); ctx.ellipse(cx, cy + ry * 0.85, rx * 1.1, ry * 0.3, 0, 0, Math.PI * 2); ctx.fill(); }
    const n = 3 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++) { // limbs behind the cloud, only their ends stick out
      const a = -Math.PI * 0.95 + (i / Math.max(1, n - 1)) * Math.PI * 1.25 + (r() - 0.5) * 0.3 + (b() - 0.5) * 50 * T.DEG;
      const kind = limbs[i % limbs.length], skin = skins[i % skins.length];
      ctx.save(); ctx.translate(cx + Math.cos(a) * rx * 0.55, cy + Math.sin(a) * ry * 0.55); ctx.rotate(a + Math.PI / 2);
      limb(ctx, kind, size, skin);
      ctx.restore();
    }
    for (let i = 0; i < 2 + Math.floor(r() * 3); i++) { // helmet heads peeking over the rim
      const a = -Math.PI * (0.2 + r() * 0.6), hx = cx + Math.cos(a) * rx * 0.78 + (b() - 0.5) * 10, hy = cy + Math.sin(a) * ry * 0.95;
      helmetHead(ctx, hx, hy, size * 0.09, skins[i % skins.length]);
    }
    const lw = (o.line ?? 6) * Math.max(0.7, size / 480);
    T.drawCloud(ctx, cx, cy, size, size * 0.72, seed + ':cloud', { count: 12, boil: lt, color: '#f6f3ee', shade: '#d6d0c6', line: lw });
    angryFace(ctx, cx + (r() - 0.5) * rx * 0.6, cy - ry * 0.05, size * 0.12);
    const ns = o.stars ?? 5, f = Math.floor(fr(lt));
    for (let i = 0; i < ns; i++) { // stars pop 0 -> 1 -> 0 over 6 frames, staggered
      const ph = (f + i * 3) % 10, s = ph < 6 ? Math.sin((ph / 6) * Math.PI) : 0;
      const a = r() * Math.PI * 2, d = 0.9 + r() * 0.35;
      if (s > 0.05) star4(ctx, cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d, size * 0.07 * s, '#ffd23a', 4);
    }
    ctx.fillStyle = '#8a8580';
    for (let i = 0; i < 6; i++) { const a = b() * Math.PI * 2, d = 1 + b() * 0.4; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d, size * (0.012 + b() * 0.012), 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  };
  function limb(ctx, kind, size, skin) {
    const w = size * 0.06, len = size * 0.42;
    T.outlined(ctx, (k) => T.rrect(k, -w / 2, -len, w, len, w / 2), skin, { line: 5 });
    ctx.translate(0, -len);
    if (kind === 'fist') T.drawGlove(ctx, 0, 0, 0, 'fist', { size: size * 0.16, line: 5 });
    else if (kind === 'boot') T.outlined(ctx, (k) => { k.moveTo(-w * 0.7, w * 0.4); k.lineTo(-w * 0.7, -w * 0.9); k.quadraticCurveTo(w * 2.2, -w * 1.1, w * 2.2, -w * 0.1); k.lineTo(w * 2.2, w * 0.4); k.closePath(); }, '#3a2a20', { line: 5 });
    else if (T.PROPS && T.PROPS[kind]) { T.drawGlove(ctx, 0, 0, 0, 'fist', { size: size * 0.14, line: 5 }); ctx.translate(0, -size * 0.03); T.drawProp(ctx, kind, size * 0.42, 0, {}); }
    else T.drawGlove(ctx, 0, 0, 0, 'open', { size: size * 0.16, line: 5 });
  }
  function helmetHead(ctx, x, y, r, crest) {
    T.outlined(ctx, (k) => k.arc(x, y, r, 0, Math.PI * 2), P.skin, { line: 5 });
    T.outlined(ctx, (k) => { k.arc(x, y - r * 0.05, r * 1.08, Math.PI, 0); k.lineTo(x + r * 1.35, y); k.lineTo(x - r * 1.35, y); k.closePath(); }, '#5d6066', { line: 5 });
    ctx.fillStyle = crest; ctx.fillRect(x - r * 0.2, y - r * 1.5, r * 0.4, r * 0.5);
  }
  function angryFace(ctx, x, y, s) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = s * 0.14; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - s, y - s * 0.55); ctx.lineTo(x - s * 0.2, y - s * 0.2); ctx.moveTo(x + s, y - s * 0.55); ctx.lineTo(x + s * 0.2, y - s * 0.2); ctx.stroke();
    ctx.fillStyle = INK; for (const sx of [-0.55, 0.55]) { ctx.beginPath(); ctx.arc(x + sx * s, y + s * 0.05, s * 0.13, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); T.rrect(ctx, x - s * 0.6, y + s * 0.4, s * 1.2, s * 0.42, s * 0.12); ctx.fill(); ctx.stroke();
    ctx.lineWidth = s * 0.07; ctx.beginPath(); for (const gx of [-0.2, 0.2]) { ctx.moveTo(x + gx * s, y + s * 0.4); ctx.lineTo(x + gx * s, y + s * 0.82); } ctx.stroke();
    ctx.restore();
  }
  // brawl fx: {size 480, path [[x,y],...] (frame coords), dur (travel + end), end pop|puffs, limbs, skins (hex or cast
  // names), stars 5, haze false, dust true}
  FX.brawl = (ctx, L, lt, env) => {
    const size = L.size ?? 480, seed = String(L.id ?? 'brawl'), dur = L.dur ?? Infinity, cast = (env && env.cast) || {};
    const skins = (L.skins || []).map((s) => (String(s).startsWith('#') ? s : (cast[s] && (cast[s].robe ?? cast[s].sleeve)) ?? P.red));
    let x = 0, y = 0;
    if (L.path && L.path.length > 1) {
      const pts = L.path.map((p) => fp(p)), ox = (L.x ?? 0.5) * W, oy = (L.y ?? 0.5) * H;
      const u = T.clamp(lt / (L.travel ?? (Number.isFinite(dur) ? dur : 1.5))) * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(u)), q = u - i;
      x = T.lerp(pts[i][0], pts[i + 1][0], q) - ox; y = T.lerp(pts[i][1], pts[i + 1][1], q) - oy;
      if (L.haze) { // dust haze trailing the travelled path, growing with time
        const g = ctx.createLinearGradient(pts[0][0] - ox, 0, x, 0);
        g.addColorStop(0, 'rgba(120,100,60,0)'); g.addColorStop(1, `rgba(120,100,60,${0.5 * T.clamp(lt / 1.5)})`);
        ctx.fillStyle = g; ctx.fillRect(Math.min(pts[0][0] - ox, x), y - size * 0.4, Math.abs(x - (pts[0][0] - ox)), size * 0.75);
      }
    }
    let s = 1;
    if (lt > dur) {
      const p = T.clamp((lt - dur) / 0.2);
      if (p >= 1) return;
      if (L.end === 'puffs') { puffs(ctx, x, y, size, p, seed); return; }
      s = 1 - T.ease.in(p);
    }
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    T.drawBrawl(ctx, 0, 0, size, lt, seed, { limbs: L.limbs, skins, stars: L.stars, dust: L.dust });
    ctx.restore();
  };
  function puffs(ctx, x, y, size, p, seed) {
    const r = T.rng(T.hash(seed + ':puffs'));
    const lobes = [];
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + r(), d = size * (0.2 + p * 0.45), rad = size * (0.14 + r() * 0.06) * (1 - p * 0.4); lobes.push([x + Math.cos(a) * d, y + Math.sin(a) * d * 0.6, rad]); }
    group(ctx, 1 - p, 'afxpuffs', (k) => lobes.forEach(([lx, ly, rad]) => T.outlined(k, (q) => q.arc(lx, ly, rad, 0, Math.PI * 2), '#f6f3ee', { line: 5 })));
  }

  // ---------- blood stand-ins (implied, never shown) ----------
  // blood-wipe: {from bottom|top|both, color, count 9, drips 5, dur 2, cover false} — flame tongues rise in 3 frames,
  // boil on twos, thin drips grow from the opposite edge; cover fills the frame over the last 6 frames.
  FX['blood-wipe'] = (ctx, L, lt, env) => {
    const col = L.color ?? '#8a0a0a', seed = String(L.id ?? 'bw'), rise = T.ease.out(T.clamp(fr(lt) / 3)), sides = L.from === 'both' ? [1, -1] : L.from === 'top' ? [-1] : [1];
    ctx.save(); frameSpace(ctx, L, env);
    ctx.fillStyle = col; ctx.strokeStyle = '#5a0606'; ctx.lineWidth = 2;
    for (const side of sides) {
      const r = T.rng(T.hash(seed + side)), bo = T.rng(T.hash(seed + side + ':' + twos(lt))), n = L.count ?? 9;
      const edge = side > 0 ? H + 20 : -20, up = (v) => edge - side * v;
      for (let i = 0; i < n; i++) {
        const bw = 120 + r() * 140, x0 = -60 + (i / n) * (W + 120) + (r() - 0.5) * 60, h = (0.5 + r() * 0.35) * H * rise * (sides.length > 1 ? 0.55 : 1);
        const curl = (r() - 0.5) * bw * 1.2, j = () => (bo() - 0.5) * 36, tip = [x0 + bw / 2 + curl, up(h)];
        ctx.beginPath(); ctx.moveTo(x0, edge);
        ctx.bezierCurveTo(x0 + bw * 0.1 + j(), up(h * 0.5), tip[0] - curl * 0.6 + j(), up(h * 0.9), tip[0], tip[1]);
        ctx.bezierCurveTo(tip[0] + bw * 0.3 + j(), up(h * 0.6), x0 + bw * 0.95 + j(), up(h * 0.3), x0 + bw, edge);
        ctx.closePath(); ctx.fill(); ctx.stroke();
      }
      const dr = T.rng(T.hash(seed + 'drip' + side)), opp = side > 0 ? -10 : H + 10;
      for (let i = 0; i < (L.drips ?? 5); i++) { // thin drips from the opposite edge, 6 px per frame
        const x = 80 + dr() * (W - 160), w = 8 + dr() * 6, len = Math.min(80 + dr() * 220, fr(lt) * 6);
        const y1 = opp + side * -1 * -len;
        ctx.beginPath(); ctx.rect(x - w / 2, Math.min(opp, y1), w, Math.abs(y1 - opp)); ctx.arc(x, y1, w * 0.75, 0, Math.PI * 2); ctx.fill();
      }
    }
    if (L.cover) {
      const p = T.ease.inOut(T.clamp((lt - (L.dur ?? 2) + 0.2) / 0.2));
      if (p > 0) { ctx.fillStyle = col; if (sides[0] > 0) ctx.fillRect(-20, H * (1 - p) - 20, W + 40, H * p + 40); else ctx.fillRect(-20, -20, W + 40, H * p + 40); }
    }
    ctx.restore();
  };
  // blood-streaks: {count 7, color} — diagonal brush strokes, each sweeps in 2 frames, staggered 1 frame.
  FX['blood-streaks'] = (ctx, L, lt, env) => {
    const r = T.rng(T.hash(String(L.id ?? 'bs'))), col = L.color ?? '#8a0a14', n = L.count ?? 7;
    ctx.save(); frameSpace(ctx, L, env);
    for (let i = 0; i < n; i++) {
      const p = T.clamp((fr(lt) - i) / 2);
      const x0 = r() * W * 0.9 - W * 0.1, y0 = r() * H * 0.5 - H * 0.1, len = 600 + r() * 700, a = (25 + r() * 25) * T.DEG, bend = (r() - 0.5) * 220;
      if (p <= 0) continue;
      const pts = [], m = 18;
      for (let s = 0; s <= m * p; s++) {
        const t = s / m, x = x0 + Math.cos(a) * len * t - Math.sin(a) * bend * 4 * t * (1 - t), y = y0 + Math.sin(a) * len * t + Math.cos(a) * bend * 4 * t * (1 - t);
        pts.push([x, y, T.lerp(40, 4, t)]);
      }
      if (pts.length < 2) continue;
      ctx.beginPath();
      pts.forEach(([x, y, w], k) => { const [nx, ny] = norm(pts, k); k ? ctx.lineTo(x + nx * w / 2, y + ny * w / 2) : ctx.moveTo(x + nx * w / 2, y + ny * w / 2); });
      for (let k = pts.length - 1; k >= 0; k--) { const [x, y, w] = pts[k], [nx, ny] = norm(pts, k); ctx.lineTo(x - nx * w / 2, y - ny * w / 2); }
      ctx.closePath(); ctx.fillStyle = col; ctx.fill();
      ctx.strokeStyle = L.inner ?? '#c02030'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); poly(ctx, pts.slice(0, Math.max(2, pts.length - 4))); ctx.stroke();
    }
    ctx.restore();
  };
  function norm(pts, k) {
    const a = pts[Math.max(0, k - 1)], b = pts[Math.min(pts.length - 1, k + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    return [-dy / l, dx / l];
  }
  // blood-splash: {from left|right, count 6, spread 220, size 1} — teardrops fly in on decelerating arcs (10 frames) and
  // land as spiky splats ringed by droplets; each splat grows a drip that runs down 60 px over 1.5 s. Layer position.
  FX['blood-splash'] = (ctx, L, lt) => {
    const id = String(L.id ?? 'bsp'), r = T.rng(T.hash(id)), dir = L.from === 'right' ? 1 : -1, n = L.count ?? 6, sp = L.spread ?? 220, k0 = L.size ?? 1;
    const sx = dir < 0 ? -(L.x ?? 0.5) * W - 80 : (1 - (L.x ?? 0.5)) * W + 80, p = T.ease.outCubic(T.clamp(fr(lt) / 10));
    for (let i = 0; i < n; i++) {
      const tx = (r() - 0.5) * sp * 2, ty = (r() - 0.5) * sp * 1.1, s = (34 + r() * 40) * k0 * (i === 0 ? 1.6 : 1), arc = -(80 + r() * 120);
      const x = T.lerp(sx, tx, p), y = T.lerp(ty * 0.4, ty, p) + arc * Math.sin(p * Math.PI);
      ctx.save(); ctx.translate(x, y);
      if (p < 1) { ctx.rotate(Math.atan2(ty - ty * 0.4, tx - sx)); teardrop(ctx, s); } else splat(ctx, s, id + i, T.clamp((lt - 0.33) / 1.5));
      ctx.restore();
    }
  };
  const BLOOD = '#b0202a', BLOOD_HI = '#e86a5a';
  function teardrop(ctx, s) { // round head leading, tail streaming back, two trailing droplets
    T.outlined(ctx, (k) => { k.moveTo(-s * 2.2, 0); k.quadraticCurveTo(-s * 0.4, -s * 0.7, 0, -s * 0.6); k.arc(0, 0, s * 0.6, -Math.PI / 2, Math.PI / 2); k.quadraticCurveTo(-s * 0.4, s * 0.7, -s * 2.2, 0); k.moveTo(-s * 2.5 + s * 0.22, -s * 0.5); k.arc(-s * 2.5, -s * 0.5, s * 0.22, 0, Math.PI * 2); k.moveTo(-s * 3.1 + s * 0.14, s * 0.3); k.arc(-s * 3.1, s * 0.3, s * 0.14, 0, Math.PI * 2); }, BLOOD, { line: 4 });
    ctx.fillStyle = BLOOD_HI; ctx.beginPath(); ctx.ellipse(s * 0.1, -s * 0.25, s * 0.22, s * 0.1, 0, 0, Math.PI * 2); ctx.fill();
  }
  // Spiky splat: lobed core with pointed spikes, satellite droplets, and a drip (q = 0..1) running from its lower rim.
  function splat(ctx, s, seed, q) {
    const r = T.rng(T.hash(seed + ':splat')), n = 16, pts = [], drops = [];
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, rad = i % 2 ? s * (0.75 + r() * 0.2) : s * (r() < 0.5 ? 1.5 + r() * 0.5 : 1.0 + r() * 0.15); pts.push([Math.cos(a) * rad, Math.sin(a) * rad * 0.8]); }
    for (let i = 0; i < 5; i++) { const a = r() * Math.PI * 2, d = s * (1.9 + r() * 0.7); drops.push([Math.cos(a) * d, Math.sin(a) * d * 0.8, s * (0.1 + r() * 0.14)]); }
    const dx = (r() - 0.5) * s * 0.6, len = s * 0.6 + 60 * T.ease.out(q), dw = s * 0.16;
    T.outlined(ctx, (k) => {
      T.smoothPath(k, pts); k.closePath();
      k.moveTo(dx - dw, s * 0.5); k.lineTo(dx - dw, s * 0.5 + len); k.arc(dx, s * 0.5 + len, dw, Math.PI, 0, true); k.lineTo(dx + dw, s * 0.5); k.closePath();
      for (const [x, y, rad] of drops) { k.moveTo(x + rad, y); k.arc(x, y, rad, 0, Math.PI * 2); }
    }, BLOOD, { line: 4, shade: (k) => { k.fillStyle = T.shade(BLOOD, -0.25); k.fillRect(-s * 3, s * 0.3, s * 6, s * 4); } });
    ctx.fillStyle = BLOOD_HI; ctx.beginPath(); ctx.ellipse(-s * 0.3, -s * 0.3, s * 0.3, s * 0.13, -0.4, 0, Math.PI * 2); ctx.fill();
  }
  // Lobed seeded blob (pool, spill): radius R, y squash `flat`, rim, gloss, optional tendrils growing 1.4x faster.
  function blob(ctx, R, o) {
    const n = 24, pts = [], tails = [];
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, k = lobed(i, n, o.seed); pts.push([Math.cos(a) * R * k, Math.sin(a) * R * k * o.flat]); }
    const tr = T.rng(T.hash(o.seed + ':t'));
    for (let i = 0; i < (o.tendrils || 0); i++) tails.push([tr() * Math.PI * 2, R * (1.2 + tr() * 0.6) * o.tg, R * 0.16, (tr() - 0.5) * 0.8]);
    const path = (k) => { // core + tendrils as one subpath set: stroked once, filled once, so it reads as one stain
      k.beginPath(); T.smoothPath(k, pts); k.closePath();
      for (const [a, len, w, bend] of tails) {
        const c = Math.cos(a), s = Math.sin(a), P2 = (x, y) => [x * c - y * s, (x * s + y * c) * o.flat];
        const q = [P2(R * 0.6, -w), P2(len * 0.7, -w * 0.6 + bend * len * 0.3), P2(len, bend * len * 0.3), P2(len * 0.7, w * 0.6 + bend * len * 0.3), P2(R * 0.6, w)];
        k.moveTo(q[0][0], q[0][1]); k.quadraticCurveTo(q[1][0], q[1][1], q[2][0], q[2][1]); k.quadraticCurveTo(q[3][0], q[3][1], q[4][0], q[4][1]); k.closePath();
      }
    };
    ctx.save(); ctx.lineJoin = 'round';
    path(ctx); ctx.strokeStyle = INK; ctx.lineWidth = 10; ctx.stroke();
    ctx.fillStyle = o.color; ctx.fill('nonzero');
    ctx.save(); ctx.clip(); ctx.fillStyle = T.shade(o.color, -0.25); ctx.fillRect(-R * 3, R * 0.35 * o.flat, R * 6, R * 3); ctx.restore();
    ctx.strokeStyle = o.gloss; ctx.lineWidth = Math.max(3, R * 0.05); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.ellipse(-R * 0.15, -R * 0.2 * o.flat, R * 0.55, R * 0.45 * o.flat, 0, Math.PI * 1.1, Math.PI * 1.45); ctx.stroke();
    ctx.restore();
  }
  // pool: {size 260, dur 6, color} — flat lobed pool that spreads (outCubic) under a body; place it before the bean.
  FX.pool = (ctx, L, lt) => {
    const R = (L.size ?? 260) * T.ease.outCubic(T.clamp(lt / (L.dur ?? 6)));
    if (R > 1) blob(ctx, R, { seed: String(L.id ?? 'pool'), flat: L.flat ?? 0.32, color: L.color ?? '#5a0a10', gloss: '#8a1a1a' });
  };
  // spill: {size 300, dur 2, color (wine #7a1420, ink #2b2050), tendrils 0-8, flood false, flat 1} — stain spreading on a
  // document or desk; flood keeps growing until the frame is covered by dur + 1.5 s (cut on it).
  FX.spill = (ctx, L, lt) => {
    const size = L.size ?? 300, dur = L.dur ?? 2, g = T.ease.outCubic(T.clamp(lt / dur));
    let R = size * g;
    if (L.flood) R += (Math.hypot(W, H) * 1.1 - size) * T.ease.in(T.clamp((lt - dur) / 1.5));
    if (R > 1) blob(ctx, R, { seed: String(L.id ?? 'spill'), flat: L.flat ?? 1, color: L.color ?? '#7a1420', gloss: 'rgba(255,255,255,0.25)', tendrils: L.tendrils ?? 0, tg: T.clamp(g * 1.4) });
  };

  // ---------- mob silhouettes (fg) and shadow hands ----------
  // fg mob: {items [pitchfork, torch, spear, scimitar, banner, arm], count 8, color "#141010", h [200, 320], rise 0.27,
  // sway 8} — raised arms rise from below the frame (8 frames, staggered 2), sway on twos; torch flames are the colour.
  const MOB_ITEMS = ['pitchfork', 'torch', 'spear', 'scimitar', 'banner', 'arm'];
  T.FG.mob = (ctx, L, lt) => {
    const n = L.count ?? 8, col = L.color ?? '#141010', items = L.items && L.items.length ? L.items : MOB_ITEMS, hr = L.h ?? [200, 320];
    const r = T.rng(T.hash(String(L.id ?? 'mob'))), base = H / 2 - 40, people = [];
    for (let i = 0; i < n; i++) people.push({ i, x: -W / 2 + ((i + 0.5) / n) * W + (r() - 0.5) * 60, h: T.lerp(hr[0], hr[1], r()), lean: (r() - 0.5) * 24 * T.DEG, ph: r() * 6, sc: 0.85 + r() * 0.3, side: r() < 0.5 ? -1 : 1, hat: Math.floor(r() * 3), back: i % 2 });
    // two rows: odd people stand a step behind (higher, smaller) so heads and shoulders overlap like a crowd
    for (const p of [...people.filter((q) => q.back), ...people.filter((q) => !q.back)]) {
      const up = T.ease.outCubic(T.clamp((lt - (p.i * 2) / 30) / (L.rise ?? 0.27)));
      const sw = Math.sin(twos(lt) / 15 * Math.PI * 2 * 0.8 + p.ph) * (L.sway ?? 8), sc = p.sc * (p.back ? 0.82 : 1);
      ctx.save(); ctx.translate(p.x + sw * 0.4, base - (p.back ? 70 : 0) + (1 - up) * (p.h + 520)); ctx.scale(sc, sc);
      mobPerson(ctx, p, col, sw);
      ctx.translate(p.side * 96, -96);
      const ex = p.side * 40, ey = -p.h * 0.45, hx = p.side * 18 + Math.sin(p.lean) * p.h, hy = -p.h;
      ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 46;
      ctx.beginPath(); ctx.moveTo(0, 30); ctx.lineTo(ex, ey); ctx.lineTo(hx + sw * 0.6, hy); ctx.stroke(); // raised arm, bent at the elbow
      ctx.translate(hx + sw * 0.6, hy); ctx.rotate(p.lean * 0.5 + sw * 0.004);
      mobItem(ctx, items[p.i % items.length], col, lt, String(L.id ?? 'mob') + p.i);
      ctx.restore();
    }
  };
  // Head-and-shoulders silhouette: rounded torso running off the bottom of the frame, neck, head, one of three hats.
  function mobPerson(ctx, p, col, sw) {
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.moveTo(-150, 420); ctx.lineTo(-140, 10); ctx.quadraticCurveTo(-130, -100, -40, -110); ctx.lineTo(40, -110); ctx.quadraticCurveTo(130, -100, 140, 10); ctx.lineTo(150, 420); ctx.closePath(); ctx.fill();
    ctx.fillRect(-30, -160, 60, 70);
    const hx = sw * 0.3, hy = -215;
    ctx.beginPath(); ctx.ellipse(hx, hy, 66, 74, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(hx + p.side * -60, hy + 6, 14, 22, 0, 0, Math.PI * 2); ctx.fill(); // ear
    if (p.hat === 1) { ctx.beginPath(); ctx.moveTo(hx - 80, hy - 30); ctx.quadraticCurveTo(hx, hy - 140, hx + 30 * p.side, hy - 150); ctx.quadraticCurveTo(hx + 40, hy - 70, hx + 80, hy - 30); ctx.closePath(); ctx.fill(); } // floppy cap
    if (p.hat === 2) { ctx.beginPath(); ctx.ellipse(hx, hy - 40, 110, 20, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); T.rrect(ctx, hx - 56, hy - 110, 112, 76, 20); ctx.fill(); } // brimmed hat
  }
  function mobItem(ctx, kind, col, lt, seed) {
    if (!MOB_ITEMS.includes(kind)) throw new Error(`Unknown mob item "${kind}" (use ${MOB_ITEMS.join(', ')})`);
    ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineCap = 'round';
    if (kind === 'arm') { ctx.beginPath(); ctx.arc(0, -6, 34, 0, Math.PI * 2); ctx.fill(); [-24, -8, 8, 24].forEach((fx) => { ctx.beginPath(); T.rrect(ctx, fx - 7, -78, 14, 60, 7); ctx.fill(); }); ctx.beginPath(); T.rrect(ctx, -46, -30, 30, 14, 7); ctx.fill(); return; }
    ctx.beginPath(); ctx.arc(0, 0, 32, 0, Math.PI * 2); ctx.fill(); // fist
    if (kind === 'scimitar') { ctx.beginPath(); ctx.moveTo(-6, -20); ctx.quadraticCurveTo(70, -120, 10, -230); ctx.quadraticCurveTo(40, -110, -14, -20); ctx.fill(); ctx.fillRect(-26, -26, 52, 10); return; }
    ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(0, 90); ctx.lineTo(0, -230); ctx.stroke(); // shaft
    if (kind === 'pitchfork') { ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(-40, -230); ctx.lineTo(40, -230); for (const tx of [-40, 0, 40]) { ctx.moveTo(tx, -230); ctx.lineTo(tx, -310); } ctx.stroke(); }
    if (kind === 'spear') { ctx.beginPath(); ctx.moveTo(0, -330); ctx.quadraticCurveTo(32, -270, 0, -222); ctx.quadraticCurveTo(-32, -270, 0, -330); ctx.fill(); }
    if (kind === 'banner') { const wv = Math.sin(lt * 5 + seed.length) * 10; ctx.beginPath(); ctx.moveTo(0, -225); ctx.quadraticCurveTo(60, -235 + wv, 120, -222); ctx.lineTo(120, -140); ctx.quadraticCurveTo(60, -152 - wv, 0, -140); ctx.fill(); }
    if (kind === 'torch') { ctx.save(); ctx.translate(0, -225); T.drawFlame(ctx, 110, lt, seed + 't'); ctx.restore(); }
  }
  // shadow-hands: {count 5, dur 1.2, alpha 0.55, weapons true, darken 0.4} — grasping arm shadows (clawed fingers, every
  // other one gripping a spear) slide in from the frame edges (outCubic, staggered 0.1 s) over a darkening frame, then
  // sway 2 px at 2 Hz and flex their fingers on twos. Drawn as one silhouette so overlaps do not darken.
  FX['shadow-hands'] = (ctx, L, lt, env) => {
    const dur = L.dur ?? 1.2, n = L.count ?? 5, r = T.rng(T.hash(String(L.id ?? 'sh'))), arms = [];
    for (let i = 0; i < n; i++) arms.push({ i, side: i % 2 ? 1 : -1, y: H * (0.3 + r() * 0.5), ang: (10 + r() * 22) * T.DEG, len: W * (0.26 + r() * 0.12) });
    ctx.save(); frameSpace(ctx, L, env);
    const a0 = ctx.globalAlpha;
    ctx.globalAlpha = a0 * (L.darken ?? 0.4) * T.ease.inOut(T.clamp(lt / dur)); ctx.fillStyle = '#000'; ctx.fillRect(-40, -40, W + 80, H + 80);
    ctx.globalAlpha = a0;
    group(ctx, L.alpha ?? 0.55, 'afxshadow', (k) => {
      k.fillStyle = '#050303'; k.strokeStyle = '#050303'; k.lineCap = 'round'; k.lineJoin = 'round';
      for (const a of arms) {
        const p = T.ease.outCubic(T.clamp((lt - a.i * 0.1) / dur)), sw = Math.sin(lt * Math.PI * 4 + a.i) * 2, flex = (twos(lt) + a.i) % 4 < 2 ? 0 : 0.12;
        k.save(); k.translate(a.side < 0 ? -40 : W + 40, a.y + sw); k.scale(-a.side, 1); k.rotate(-a.ang); k.translate(-a.len * (1 - p), 0);
        shadowArm(k, a.len, L.weapons !== false && a.i % 2 === 1, flex);
        k.restore();
      }
    });
    ctx.restore();
  };
  // One reaching arm in local space: shoulder off-frame at x < 0, wrist at x = len, fingers clawing forward.
  function shadowArm(k, len, spear, flex) {
    k.beginPath(); k.moveTo(-80, -70); k.quadraticCurveTo(len * 0.5, -46, len, -30); k.lineTo(len, 30); k.quadraticCurveTo(len * 0.5, 50, -80, 80); k.closePath(); k.fill(); // tapered forearm
    k.beginPath(); k.ellipse(len + 48, 0, 66, 56, 0, 0, Math.PI * 2); k.fill(); // palm
    if (spear) { // fist closed on a spear shaft
      k.lineWidth = 18; k.beginPath(); k.moveTo(len + 10, 260); k.lineTo(len + 110, -420); k.stroke();
      k.beginPath(); k.moveTo(len + 128, -540); k.quadraticCurveTo(len + 152, -470, len + 116, -410); k.quadraticCurveTo(len + 88, -470, len + 128, -540); k.fill();
      k.lineWidth = 34; for (let f = 0; f < 4; f++) { k.beginPath(); k.moveTo(len + 70, -36 + f * 24); k.lineTo(len + 112, -30 + f * 24); k.stroke(); }
      return;
    }
    const fingers = [[-0.62, 150], [-0.22, 175], [0.16, 165], [0.5, 135]];
    fingers.forEach(([ang, fl]) => { // long clawed fingers: two segments, the tip curling down
      const a = ang * (1 - flex), bx = len + 70 + Math.cos(a) * 40, by = Math.sin(a) * 40;
      const mx = bx + Math.cos(a) * fl * 0.55, my = by + Math.sin(a) * fl * 0.55, c = a + 0.55 + flex * 2;
      const tx = mx + Math.cos(c) * fl * 0.5, ty = my + Math.sin(c) * fl * 0.5;
      k.lineWidth = 30; k.beginPath(); k.moveTo(bx, by); k.lineTo(mx, my); k.stroke();
      k.lineWidth = 22; k.beginPath(); k.moveTo(mx, my); k.lineTo(tx, ty); k.stroke();
      k.beginPath(); k.moveTo(tx - 9, ty - 4); k.lineTo(tx + Math.cos(c) * 30, ty + Math.sin(c) * 30); k.lineTo(tx + 9, ty + 4); k.fill(); // claw tip
    });
    k.lineWidth = 30; k.beginPath(); k.moveTo(len + 40, 40); k.quadraticCurveTo(len + 80, 120, len + 140, 110); k.stroke(); // thumb
  }

  // ---------- comic boom and onomatopoeia ----------
  // boom: {size 420, style puff|mushroom, text "", debris 8} — puff: spark (frame 0), white-hot core grows (1-15),
  // yellow then orange at full size with debris (16-30), brown smoke with embers fading (31-42). text: full-frame card.
  FX.boom = (ctx, L, lt, env) => {
    if (L.text) return boomCard(ctx, L, lt, env);
    const f = fr(lt), s = L.size ?? 420, seed = String(L.id ?? 'boom');
    if (L.style === 'mushroom') { if (f <= 72) mushroom(ctx, s, f, lt, seed); return; }
    if (f > 42) return;
    if (f < 1) { T.starburst(ctx, 0, 0, s * 0.05, s * 0.14, 8, seed + 'sp', '#fff6e0', INK, 4); return; }
    const grow = T.ease.outCubic(T.clamp((f - 1) / 14)), size = f < 16 ? s * (0.15 + 0.45 * grow) : s * (0.6 + 0.4 * T.ease.outCubic(T.clamp((f - 16) / 4)));
    const stage = f < 16 ? ['#fff6e0', '#ffe9a8'] : f < 23 ? ['#ffd84a', '#f2a630'] : f < 31 ? ['#ff9a3a', '#e07a28'] : ['#6b3a1d', '#5a3a30'];
    const core = f < 16 ? null : f < 23 ? '#fff3b0' : f < 31 ? '#ffd84a' : '#8a5a34';
    group(ctx, f >= 31 ? 1 - T.clamp((f - 30) / 12) : 1, 'afxboom', (k) => {
      if (f < 22) { // spark streaks
        k.strokeStyle = '#fff3b0'; k.lineWidth = 8; k.lineCap = 'round'; const r = T.rng(T.hash(seed + 'st'));
        for (let i = 0; i < 6; i++) { const a = r() * Math.PI * 2, d0 = size * 0.45, d1 = size * (0.7 + grow * 0.4); k.beginPath(); k.moveTo(Math.cos(a) * d0, Math.sin(a) * d0); k.lineTo(Math.cos(a) * d1, Math.sin(a) * d1); k.stroke(); }
      }
      const lobes = T.drawCloud(k, 0, 0, size, size * 0.85, seed + 'c', { count: 7, boil: lt, color: stage[0], shade: stage[1], line: Math.max(6, s / 50) });
      if (core) { // hot inner core clipped to the cloud, so the ball reads as fire rather than a flat blob
        k.save(); k.beginPath(); for (const [cx, cy, rr] of lobes) { k.moveTo(cx + rr, cy); k.arc(cx, cy, rr, 0, Math.PI * 2); } k.clip();
        T.drawCloud(k, -size * 0.04, -size * 0.1, size * 0.55, size * 0.45, seed + 'core', { count: 6, boil: lt, color: core, shade: false, line: 0 });
        k.restore();
      }
      if (f >= 16) debris(k, s, f - 16, seed, L.debris ?? 8);
      if (f >= 31) embers(k, s, f - 31, seed);
    });
  };
  function debris(ctx, s, t, seed, n) {
    const r = T.rng(T.hash(seed + 'db'));
    ctx.fillStyle = '#1a1210';
    for (let i = 0; i < n; i++) { const a = -Math.PI * (0.1 + r() * 0.8), v = s * (0.03 + r() * 0.03); ctx.save(); ctx.translate(Math.cos(a) * (s * 0.4 + v * t), Math.sin(a) * (s * 0.4 + v * t) + 0.5 * 1.4 * t * t); ctx.rotate(t * 0.4 + i); ctx.fillRect(-10, -7, 20, 14); ctx.restore(); }
  }
  function embers(ctx, s, t, seed) {
    const r = T.rng(T.hash(seed + 'em'));
    ctx.fillStyle = '#ffb030';
    for (let i = 0; i < 10; i++) { const x = (r() - 0.5) * s, y = (r() - 0.5) * s * 0.4 - t * (3 + r() * 4); ctx.fillRect(x, y, 6, 6); }
  }
  // Stem, cap and ground ring composited as one opaque group, then faded: the cap never shows its lobes through itself.
  function mushroom(ctx, s, f, lt, seed) {
    const g = T.ease.outCubic(T.clamp(f / 15)), fade = 1 - T.clamp((f - 54) / 18); // grows 15 frames, holds, fades 18
    const sh = s * 0.9 * g, cw = s * 0.9 * (0.4 + 0.6 * g), ch = s * 0.5 * (0.4 + 0.6 * g), line = Math.max(6, s / 60);
    group(ctx, fade, 'afxmush', (k) => {
      T.drawCloud(k, 0, -s * 0.02, s * 0.8 * g, s * 0.22 * g, seed + 'base', { count: 8, boil: lt, color: '#e8c890', shade: '#c8864a', line });
      T.outlined(k, (q) => { q.moveTo(-s * 0.13, -s * 0.04); q.quadraticCurveTo(-s * 0.06, -sh * 0.5, -s * 0.1, -sh); q.lineTo(s * 0.1, -sh); q.quadraticCurveTo(s * 0.06, -sh * 0.5, s * 0.13, -s * 0.04); q.closePath(); }, '#f3c27a', { line, shade: (q) => { q.fillStyle = '#e8963a'; q.fillRect(s * 0.02, -sh, s * 0.2, sh); } });
      T.drawCloud(k, 0, -sh, cw, ch, seed + 'cap', { count: 9, boil: lt, color: '#f6e4a4', shade: '#e8963a', line });
      T.drawCloud(k, 0, -sh - ch * 0.05, cw * 0.5, ch * 0.45, seed + 'hot', { count: 6, boil: lt, color: '#fff3c0', shade: false, line: 0 });
    });
  }
  // Interruption card: full-frame yellow/orange explosion cloud with a black smoke rim and a white disc of heavy text.
  function boomCard(ctx, L, lt, env) {
    const p = T.ease.outBack(T.clamp(fr(lt) / 6)), seed = String(L.id ?? 'card');
    ctx.save(); frameSpace(ctx, { ...L, hud: true }, env);
    ctx.translate(W / 2, H / 2); ctx.scale(Math.max(0.01, p), Math.max(0.01, p));
    ctx.fillStyle = '#ff8a1a'; ctx.fillRect(-W, -H, W * 2, H * 2);
    T.drawCloud(ctx, 0, 0, W * 1.0, H * 1.2, seed + 'rim', { count: 14, boil: lt, color: '#1a1412', shade: false, line: 0 });
    T.drawCloud(ctx, 0, 0, W * 0.82, H * 0.98, seed + 'c', { count: 14, boil: lt, color: '#ffd21a', shade: '#ffb21a', line: 8 });
    const R = H * 0.34;
    T.outlined(ctx, (k) => k.arc(0, 0, R, 0, Math.PI * 2), '#ffffff', { line: 10 });
    const lines = String(L.text).toUpperCase().split('\n'), fs = Math.min(R * 0.42, (R * 1.7) / Math.max(...lines.map((l) => l.length)) * 1.6);
    lines.forEach((line, i) => T.toonText(ctx, line, 0, (i - (lines.length - 1) / 2) * fs * 1.05 + fs * 0.36, { size: fs, fill: INK, ink: INK, stroke: 0, shadow: false }));
    ctx.restore();
  }
  // onomatopoeia: {text "BOOOM", size 360, score "", dur 1.5} — grey smoke cloud with a flickering star and bouncing
  // graffiti letters; scales 0.8 -> 1.1 over 12 frames, fades over the last 8; score pops up green.
  FX.onomatopoeia = (ctx, L, lt) => {
    const s = L.size ?? 360, f = fr(lt), dur = L.dur ?? 1.5, seed = String(L.id ?? 'ono'), text = String(L.text ?? 'BOOOM');
    const sc = T.lerp(0.8, 1.1, T.ease.outCubic(T.clamp(f / 12))), fade = 1 - T.clamp((lt - dur + 0.27) / 0.27);
    if (fade <= 0) return;
    ctx.save(); ctx.globalAlpha *= fade; ctx.scale(sc, sc);
    T.drawCloud(ctx, 0, 0, s * 1.5, s * 0.8, seed + 'c', { count: 9, boil: lt, color: '#4b4b4f', shade: false, line: 6 });
    const flick = twos(lt) % 2 ? 1 : 0.88;
    T.starburst(ctx, 0, 0, s * 0.25 * flick, s * 0.5 * flick, 12, seed + 's' + (twos(lt) % 3), '#c8321e', INK, 5);
    T.starburst(ctx, 0, 0, s * 0.18 * flick, s * 0.38 * flick, 12, seed + 's2' + (twos(lt) % 3), '#f27a1c', INK, 0);
    T.starburst(ctx, 0, 0, s * 0.12, s * 0.26, 10, seed + 's3', '#ffd23a', INK, 0);
    const fs = Math.min(s * 0.42, (s * 2.6) / Math.max(1, text.length)), r = T.rng(T.hash(seed + 'l'));
    ctx.font = T.font(fs); const widths = [...text].map((ch) => ctx.measureText(ch).width * 0.92), total = widths.reduce((a, b) => a + b, 0);
    let x = -total / 2;
    [...text].forEach((ch, i) => {
      const rot = (r() - 0.5) * 16 * T.DEG, bounce = Math.sin(lt * 9 + i * 1.3) * 6;
      ctx.save(); ctx.translate(x + widths[i] / 2, fs * 0.35 + bounce); ctx.rotate(rot);
      T.toonText(ctx, ch, 0, 0, { size: fs, fill: '#ecebe6', stroke: 12, shadow: false });
      ctx.restore(); x += widths[i];
    });
    ctx.restore();
    if (L.score) { // rises 40 px over 12 frames, overshoot 1.2 at frame 4
      const q = T.clamp(f / 12), pop = f < 4 ? T.lerp(0.3, 1.2, f / 4) : T.lerp(1.2, 1, T.clamp((f - 4) / 8));
      ctx.save(); ctx.globalAlpha *= fade; ctx.translate(s * 0.55, -s * 0.5 - 40 * T.ease.outCubic(q)); ctx.scale(pop, pop);
      T.toonText(ctx, String(L.score), 0, 0, { size: s * 0.2, fill: '#8cf05a' });
      ctx.restore();
    }
  };

  // ---------- word-shatter ----------
  // {text, color "#d8242a", size 140, angle -18, vx 240 (px/s), burstAt 0.9} — extruded word pops in (0.4 -> 1.1 -> 1.0 by
  // frame 5), drifts and turns until burstAt, then every glyph flies off with spin and gravity behind a yellow puff.
  FX['word-shatter'] = (ctx, L, lt) => {
    const text = String(L.text ?? 'ORDERS'), size = L.size ?? 140, col = L.color ?? '#d8242a', f = fr(lt), bt = L.burstAt ?? 0.9, seed = String(L.id ?? 'ws');
    const tt = Math.min(lt, bt), pop = f < 2 ? T.lerp(0.4, 1.1, f / 2) : T.lerp(1.1, 1, T.clamp((f - 2) / 3));
    ctx.save(); ctx.translate((L.vx ?? 240) * tt, 0); ctx.rotate(((L.angle ?? -18) + Math.min(f, bt * 30) * 0.4) * T.DEG); ctx.scale(pop, pop);
    ctx.font = T.font(size); const widths = [...text].map((ch) => ctx.measureText(ch).width), total = widths.reduce((a, b) => a + b, 0);
    const bf = (lt - bt) * 30, r = T.rng(T.hash(seed + 'g'));
    if (bf > 0 && bf < 18) { // one outlined yellow dust puff at the burst point, fading over 12 frames
      const g = T.lerp(0.6, 1.2, T.clamp(bf / 6));
      group(ctx, 1 - T.clamp((bf - 6) / 12), 'afxwspuff', (k) => T.drawCloud(k, 0, 0, total * 0.8 * g, size * 1.1 * g, seed + 'puff', { count: 8, boil: lt, color: '#f6c21c', shade: '#e08a10', line: 6 }));
    }
    let x = -total / 2;
    [...text].forEach((ch, i) => {
      const gx = x + widths[i] / 2; x += widths[i];
      const sp = 18 + r() * 12, a = Math.atan2(-0.6 - r() * 0.8, gx / (total / 2) + (r() - 0.5) * 0.4), spin = (6 + r() * 6) * (r() < 0.5 ? -1 : 1);
      ctx.save();
      if (bf > 0) { ctx.translate(Math.cos(a) * sp * bf, Math.sin(a) * sp * bf + 0.5 * 1.2 * bf * bf); ctx.rotate(spin * bf * T.DEG); }
      extruded(ctx, ch, gx, size, col);
      ctx.restore();
    });
    ctx.restore();
  };
  function extruded(ctx, ch, x, size, col) {
    ctx.font = T.font(size); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    ctx.fillStyle = T.shade(col, -0.45);
    for (let i = 6; i >= 1; i--) ctx.fillText(ch, x + i, i);
    ctx.lineWidth = 10; ctx.strokeStyle = INK; ctx.strokeText(ch, x, 0);
    ctx.fillStyle = col; ctx.fillText(ch, x, 0);
  }

  // ---------- crackle, beam-clash, duel ----------
  // Jagged electric line between two frame points, re-seeded every frame, glowing.
  function crackleLine(ctx, a, b, seed, o = {}) {
    const r = T.rng(T.hash(seed)), n = 12, pts = [];
    for (let i = 0; i <= n; i++) { const t = i / n, j = i === 0 || i === n ? 0 : (r() - 0.5) * 2 * (o.jitter ?? 10); pts.push([T.lerp(a[0], b[0], t) + j * 0.4, T.lerp(a[1], b[1], t) + j]); }
    ctx.save(); ctx.lineJoin = 'miter'; ctx.lineCap = 'round';
    ctx.shadowColor = o.color ?? '#ffe14a'; ctx.shadowBlur = (o.glow ?? 12) * T.DPR;
    ctx.strokeStyle = o.color ?? '#ffe14a'; ctx.lineWidth = o.width ?? 4; ctx.beginPath(); poly(ctx, pts); ctx.stroke();
    ctx.shadowBlur = 0; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(1, (o.width ?? 4) * 0.35); ctx.stroke();
    ctx.restore();
    return pts;
  }
  // Frame position of a bean's eyes (layer id) in the current shot: head centre ~(0,-450) rig units, eyes at y -458,
  // the near eye 40 units toward `towardX`. A [x, y] pair (0..1) is taken as frame coords.
  function eyeOf(ref, env, towardX) {
    if (Array.isArray(ref)) return fp(ref);
    const tg = ((env && env.shot && env.shot.layers) || []).find((l) => l.id === ref);
    if (!tg) throw new Error(`eye anchor "${ref}" is not a layer id in this shot`);
    const st = T.layerState(T.effLayer(tg, env.lt), env.lt);
    if (!st) return [W / 2, H / 2];
    const k = ((tg.size ?? 420) * st.s) / 600, dir = towardX == null ? 0 : Math.sign(towardX - st.x);
    return [st.x + dir * 40 * k, st.y - 458 * k];
  }
  const eyePair = (a, b, env) => { const pa = eyeOf(a, env), pb = eyeOf(b, env); return [eyeOf(a, env, pb[0]), eyeOf(b, env, pa[0])]; };
  // Bold stare beam between two eye points: a glowing jagged core with a white-hot centre and a spark star mid-way.
  function stareBeam(ctx, a, b, seed, f, o = {}) {
    const w = o.width ?? 14, col = o.color ?? '#ffe14a';
    crackleLine(ctx, a, b, seed, { color: col, width: w, glow: o.glow ?? 26, jitter: o.jitter ?? 16 });
    for (const p of [a, b]) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(p[0], p[1], w * 0.9, 0, Math.PI * 2); ctx.fill(); }
    star4(ctx, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + (f % 2 ? -4 : 4), w * 3 + (f % 3) * 6, '#fff6b0', 4);
  }
  // crackle: {from [x,y] | layer id, to [x,y] | layer id, color "#ffe14a", width 4, glow 12} — with layer ids the line
  // runs eye to eye between two beans (place it after them) and draws as a bold stare beam (width 14).
  FX.crackle = (ctx, L, lt, env) => {
    ctx.save(); frameSpace(ctx, L, env);
    const f = Math.floor(fr(lt)), byId = typeof L.from === 'string' || typeof L.to === 'string';
    if (byId) { const [a, b] = eyePair(L.from ?? [0.38, 0.42], L.to ?? [0.62, 0.42], env); stareBeam(ctx, a, b, String(L.id ?? 'cr') + f, f, L); ctx.restore(); return; }
    const a = fp(L.from, [0.38, 0.42]), b = fp(L.to, [0.62, 0.42]);
    crackleLine(ctx, a, b, String(L.id ?? 'cr') + f, L);
    star4(ctx, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + (f % 2 ? -3 : 3), 16 + (f % 3) * 4, '#fff6b0', 3);
    ctx.restore();
  };
  // beam-clash: {from, to, flash true, color "#7fe6ff", bg "#2a2650"} — rivalry backdrop: purple field with scrolling
  // speed streaks, two jagged beams meeting at an orb that drifts +-80 px (1.3 s) and toggles orb/ring/sparkle on twos.
  FX['beam-clash'] = (ctx, L, lt, env) => {
    const a = fp(L.from, [0.15, 0.5]), b = fp(L.to, [0.85, 0.5]), seed = String(L.id ?? 'bc'), col = L.color ?? '#7fe6ff', f = Math.floor(fr(lt));
    ctx.save(); frameSpace(ctx, { ...L, hud: true }, env);
    ctx.fillStyle = L.bg ?? '#2a2650'; ctx.fillRect(-20, -20, W + 40, H + 40);
    const r = T.rng(T.hash(seed + 'st'));
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    for (let i = 0; i < 40; i++) { const y = r() * H, len = 200 + r() * 400, x = ((r() * (W + len) - lt * 1800) % (W + len) + W + len) % (W + len) - len; ctx.fillRect(x, y, len, 3 + r() * 4); }
    const u = 0.5 + Math.sin((lt / 1.3) * Math.PI * 2) * (80 / Math.max(1, Math.hypot(b[0] - a[0], b[1] - a[1]))), o = [T.lerp(a[0], b[0], u), T.lerp(a[1], b[1], u)];
    for (const [p0, k] of [[a, 0], [b, 1]]) beam(ctx, p0, o, seed + k + ':' + Math.floor(f / 2), col);
    const mode = Math.floor(f / 2.5) % 3, R = 50;
    if (mode !== 1) { const g = ctx.createRadialGradient(o[0], o[1], 0, o[0], o[1], R * (mode === 2 ? 1.3 : 1)); g.addColorStop(0, '#e8ffff'); g.addColorStop(1, '#3fb8ff'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(o[0], o[1], R * (mode === 2 ? 1.3 : 1), 0, Math.PI * 2); ctx.fill(); }
    else { ctx.strokeStyle = '#e8ffff'; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(o[0], o[1], R * 1.2, 0, Math.PI * 2); ctx.stroke(); }
    if (mode === 2) for (let i = 0; i < 4; i++) star4(ctx, o[0] + Math.cos(i * 1.7) * R * 1.6, o[1] + Math.sin(i * 1.7) * R * 1.4, 14, '#ffffff', 0);
    for (let i = 0; i < 3; i++) { const ang = (i / 3) * Math.PI * 2 + f; crackleLine(ctx, o, [o[0] + Math.cos(ang) * R * 2, o[1] + Math.sin(ang) * R * 2], seed + 'arc' + i + f, { color: '#e8ffff', width: 3, glow: 10, jitter: 8 }); }
    if (L.flash !== false && f < 5) { ctx.fillStyle = `rgba(255,255,255,${1 - f / 5})`; ctx.fillRect(-20, -20, W + 40, H + 40); }
    ctx.restore();
  };
  function beam(ctx, a, b, seed, col) {
    const r = T.rng(T.hash(seed)), n = 6 + Math.floor(r() * 3), pts = [];
    for (let i = 0; i <= n; i++) { const t = i / n, j = i === 0 || i === n ? 0 : (r() - 0.5) * 50; pts.push([T.lerp(a[0], b[0], t), T.lerp(a[1], b[1], t) + j]); }
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.shadowColor = col; ctx.shadowBlur = 20 * T.DPR; ctx.strokeStyle = col; ctx.lineWidth = 10; ctx.beginPath(); poly(ctx, pts); ctx.stroke();
    ctx.shadowBlur = 0; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
  }
  // duel: {left 0.22, right 0.78, rim "#6b4a8a", eyes [idA, idB] | [[x,y],[x,y]], width 14, h 0.62} — two black masses
  // bristling with blades behind the rivals (place after the bg, before the beans), inner rim light, a bold stare beam
  // between the eyes. The beans cover a beam drawn here: set eyes false and add a crackle {from: idA, to: idB} after them.
  FX.duel = (ctx, L, lt, env) => {
    const seed = String(L.id ?? 'duel'), f = Math.floor(fr(lt));
    ctx.save(); frameSpace(ctx, { ...L, hud: true }, env);
    for (const [cx, side] of [[(L.left ?? 0.22) * W, 1], [(L.right ?? 0.78) * W, -1]]) {
      const path = massPath(cx, (L.h ?? 0.62) * H, seed + side);
      ctx.save(); ctx.translate(side * 6, 0); ctx.fillStyle = L.rim ?? '#6b4a8a'; ctx.beginPath(); path(ctx); ctx.fill(); ctx.restore();
      ctx.fillStyle = L.color ?? '#0d0a0c'; ctx.beginPath(); path(ctx); ctx.fill();
    }
    if (L.eyes !== false) { // eyes: two layer ids (anchored to the beans' eyes) or two frame points
      const e = L.eyes ?? [[0.38, 0.5], [0.62, 0.5]];
      if (!Array.isArray(e) || e.length !== 2) throw new Error('duel.eyes must be two layer ids or two [x, y] points');
      const [a, b] = eyePair(e[0], e[1], env);
      stareBeam(ctx, a, b, seed + f, f, { color: L.spark ?? '#ffe14a', width: L.width ?? 14 });
    }
    ctx.restore();
  };
  function massPath(cx, h, seed) {
    const r = T.rng(T.hash(seed)), w = W * 0.4, top = H - h, n = 6 + Math.floor(r() * 4), spikes = [];
    for (let i = 0; i < n; i++) spikes.push([cx - w / 2 + ((i + 0.5) / n) * w + (r() - 0.5) * 30, top + (r() - 0.3) * 60, 120 + r() * 140, (r() - 0.5) * 0.5]);
    return (k) => {
      k.moveTo(cx - w * 0.65, H + 20);
      k.quadraticCurveTo(cx - w * 0.62, top + 40, cx - w / 2, top + 60);
      for (const [x, y, len, tilt] of spikes) { // sword-shaped spikes: blade tip, crossguard notch
        const tx = x + Math.sin(tilt) * len, ty = y - Math.cos(tilt) * len;
        k.lineTo(x - 26, y + 10); k.lineTo(x - 12, y); k.lineTo(tx - 6, ty + 18); k.lineTo(tx, ty); k.lineTo(tx + 6, ty + 18); k.lineTo(x + 12, y); k.lineTo(x + 26, y + 10);
      }
      k.quadraticCurveTo(cx + w * 0.62, top + 40, cx + w * 0.65, H + 20);
      k.closePath();
    };
  }

  // ---------- light kit ----------
  // lightpool: {follow <layer id>, part hand|head|center, r 420, color "#ffd04a", dark 0.85, open {at, dur 0.66}} —
  // darkness with a warm hole around a character (torch in a labyrinth); radius flickers +-5% on twos.
  FX.lightpool = (ctx, L, lt, env) => {
    let cx = (L.x ?? 0.5) * W, cy = (L.y ?? 0.5) * H, z = L.z ?? 1;
    if (L.follow) {
      const tg = ((env && env.shot && env.shot.layers) || []).find((l) => l.id === L.follow);
      if (!tg) throw new Error(`lightpool.follow "${L.follow}" is not a layer id in this shot`);
      const st = T.layerState(T.effLayer(tg, env.lt), env.lt);
      if (st) { const s = ((tg.size ?? 420) * st.s) / 600, part = L.part ?? 'center'; cx = st.x + (part === 'hand' ? 230 * s * st.flip : 0); cy = st.y - (part === 'head' ? 450 : part === 'hand' ? 260 : 300) * s; }
      z = tg.z ?? 1;
    }
    const op = L.open ? T.ease.outCubic(T.prog(lt, L.open.at ?? 0, L.open.dur ?? 0.66)) : 1, fl = 1 + (T.rng(T.hash(String(L.id) + twos(lt)))() - 0.5) * 0.1;
    const R = T.lerp(60, L.r ?? 420, op) * fl;
    const cv = ctx.canvas, [c, k] = T.scratch('afxpool', cv.width, cv.height);
    k.clearRect(0, 0, c.width, c.height); frameSpace(k, { ...L, z }, env);
    k.fillStyle = `rgba(0,0,0,${L.dark ?? 0.85})`; k.fillRect(-W, -H, W * 3, H * 3);
    k.globalCompositeOperation = 'destination-out';
    const g = k.createRadialGradient(cx, cy, R * 0.45, cx, cy, R); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    k.fillStyle = g; k.beginPath(); k.arc(cx, cy, R, 0, Math.PI * 2); k.fill();
    k.globalCompositeOperation = 'lighter';
    const g2 = k.createRadialGradient(cx, cy, 0, cx, cy, R * 0.8); g2.addColorStop(0, hexA(L.color ?? '#ffd04a', 0.5)); g2.addColorStop(1, hexA(L.color ?? '#ffd04a', 0));
    k.fillStyle = g2; k.beginPath(); k.arc(cx, cy, R, 0, Math.PI * 2); k.fill();
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(c, 0, 0); ctx.restore();
  };
  const hexA = (hex, a) => { const n = parseInt(T.hex6(hex).slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };
  // shafts: {items [{x, w, angle}], bars 4, color "#fff4d0", alpha 0.28} — window light falling across the scene; draw
  // it over the characters so it lights them, with soft bar shadows that fade out by mid-frame (prison windows).
  FX.shafts = (ctx, L, lt, env) => {
    ctx.save(); frameSpace(ctx, L, env);
    const col = L.color ?? '#fff4d0', drift = lt * 0.01 * W;
    for (const it of L.items ?? [{ x: 0.7, w: 0.12, angle: 25 }]) {
      const x = (it.x ?? 0.5) * W + drift, w = (it.w ?? 0.12) * W, sk = Math.tan((it.angle ?? 25) * T.DEG) * H;
      const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
      g.addColorStop(0, hexA(col, 0)); g.addColorStop(0.2, hexA(col, L.alpha ?? 0.28)); g.addColorStop(0.8, hexA(col, L.alpha ?? 0.28)); g.addColorStop(1, hexA(col, 0));
      ctx.save(); ctx.transform(1, 0, -sk / H, 1, sk, 0); // shear: top at x, bottom shifted left by the angle
      ctx.fillStyle = g; ctx.fillRect(x - w / 2, -20, w, H + 40);
      const nb = L.bars ?? 4, bg = ctx.createLinearGradient(0, 0, 0, H); // soft bar shadows near the window only
      bg.addColorStop(0, 'rgba(0,0,0,0.22)'); bg.addColorStop(0.45, 'rgba(0,0,0,0.08)'); bg.addColorStop(0.7, 'rgba(0,0,0,0)');
      ctx.fillStyle = bg;
      for (let i = 1; i <= nb; i++) ctx.fillRect(x - w / 2 + (i / (nb + 1)) * w - w * 0.02, -20, w * 0.04, H + 40);
      ctx.restore();
    }
    ctx.restore();
  };
  // godbeam: {from tl|tr|t, target [x,y], color "#fff6b0", alpha 0.6, width 220} — one miracle beam grows over 10 frames.
  FX.godbeam = (ctx, L, lt, env) => {
    ctx.save(); frameSpace(ctx, L, env);
    const src = { tl: [0.04, -0.05], tr: [0.96, -0.05], t: [0.5, -0.05] }[L.from ?? 'tl'];
    if (!src) throw new Error(`godbeam.from must be tl, tr or t (got "${L.from}")`);
    const a = fp(src), tg = fp(L.target, [0.55, 0.7]), g = T.ease.outCubic(T.clamp(fr(lt) / 10)), b = [T.lerp(a[0], tg[0], g), T.lerp(a[1], tg[1], g)];
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]) + Math.PI / 2, w0 = 20, w1 = ((L.width ?? 220) / 2) * (0.3 + 0.7 * g), col = L.color ?? '#fff6b0';
    T.filtered(ctx, `blur(${(10 * T.DPR).toFixed(1)}px)`, (k) => {
      k.globalAlpha = L.alpha ?? 0.6; k.fillStyle = col;
      k.beginPath(); k.moveTo(a[0] + Math.cos(ang) * w0, a[1] + Math.sin(ang) * w0); k.lineTo(b[0] + Math.cos(ang) * w1, b[1] + Math.sin(ang) * w1);
      k.lineTo(b[0] - Math.cos(ang) * w1, b[1] - Math.sin(ang) * w1); k.lineTo(a[0] - Math.cos(ang) * w0, a[1] - Math.sin(ang) * w0); k.closePath(); k.fill();
      k.globalAlpha = (L.alpha ?? 0.6) * g; k.beginPath(); k.ellipse(b[0], b[1], w1 * 1.3, w1 * 0.35, 0, 0, Math.PI * 2); k.fill();
    });
    ctx.restore();
  };
  // spotcone: {x 0.5, top 0, floor 0.86, w 0.32, alpha 0.18, dark 0.85} — stage cone in a black room.
  FX.spotcone = (ctx, L, lt, env) => {
    const cx = (L.x ?? 0.5) * W, top = (L.top ?? 0) * H, fy = (L.floor ?? 0.86) * H, fw = (L.w ?? 0.32) * W / 2, tw = fw * 0.3;
    const cone = (k) => { k.moveTo(cx - tw, top - 20); k.lineTo(cx + tw, top - 20); k.lineTo(cx + fw, fy); k.ellipse(cx, fy, fw, fw * 0.18, 0, 0, Math.PI); k.closePath(); };
    const cv = ctx.canvas, [c, k] = T.scratch('afxcone', cv.width, cv.height);
    k.clearRect(0, 0, c.width, c.height); frameSpace(k, L, env);
    k.fillStyle = `rgba(0,0,0,${L.dark ?? 0.85})`; k.fillRect(-W, -H, W * 3, H * 3);
    k.globalCompositeOperation = 'destination-out'; k.beginPath(); cone(k); k.fill(); k.beginPath(); k.ellipse(cx, fy, fw, fw * 0.18, 0, 0, Math.PI * 2); k.fill();
    k.globalCompositeOperation = 'source-over'; k.fillStyle = `rgba(255,240,220,${L.alpha ?? 0.18})`; k.beginPath(); cone(k); k.fill();
    k.fillStyle = `rgba(255,240,220,${(L.alpha ?? 0.18) * 1.5})`; k.beginPath(); k.ellipse(cx, fy, fw, fw * 0.18, 0, 0, Math.PI * 2); k.fill();
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(c, 0, 0); ctx.restore();
  };

  // ---------- grade presets (op lists, see atmosphere.js; strength / at / dur / out ramps come from shot.grade) ----------
  const SAT = '#808080';
  // CRT scanlines: darken the lower half of every 4-row band (1080p) by arg * k, integer maths only.
  T.GRADE_PIXEL.scanlines = (d, k, arg, w, h) => {
    const period = Math.max(2, Math.round(h / 270)), keep = 256 - Math.round((arg ?? 0.3) * k * 256);
    for (let y = 0; y < h; y++) {
      if (y % period < period / 2) continue;
      for (let i = y * w * 4, e = i + w * 4; i < e; i += 4) { d[i] = (d[i] * keep) >> 8; d[i + 1] = (d[i + 1] * keep) >> 8; d[i + 2] = (d[i + 2] * keep) >> 8; }
    }
  };
  Object.assign(T.GRADE_PRESETS, {
    rage: [['pixel', 'ramp3', 1, ['#3a0812', '#b8323a', '#f08060']], ['vignette', '#1a0206', 0.5]],
    inferno: [['pixel', 'ramp3', 1, ['#3a0508', '#d0506a', '#f6b0c0']], ['vignette', '#1a0204', 0.45]],
    'golden-hour': [['soft-light', '#ffc070', 0.7], ['multiply', '#fff0c8'], ['bloom', '#fff0c8', 0.35]],
    moonlit: [['saturation', SAT, 0.4], ['multiply', '#7f8fc8'], ['soft-light', '#0e1f2a', 0.5]],
    'night-violet': [['saturation', SAT, 0.45], ['multiply', '#8a84c0'], ['soft-light', '#1a1040', 0.6], ['vignette', '#05030a', 0.6]],
    gaslight: [['saturation', SAT, 0.4], ['multiply', '#c8b07a'], ['soft-light', '#2a1a08', 0.55], ['vignette', '#0a0604', 0.6]],
    pink: [['soft-light', '#ff5a96', 1], ['multiply', '#ffc8dc', 0.7], ['screen', '#4a1030', 0.3], ['vignette', '#8a1a4a', 0.35]],
    'purple-neon': [['multiply', '#9a6ad0'], ['soft-light', '#c040ff', 0.5], ['vignette', '#0a0010', 0.5]],
    'crt-cyan': [['saturation', SAT, 1], ['multiply', '#8ec4cc'], ['screen', '#0a3038', 0.35], ['pixel', 'scanlines', 1, 0.3], ['vignette', '#02080a', 0.65]],
    'dusk-blue': [['saturation', SAT, 0.6], ['multiply', '#6a7aa0'], ['soft-light', '#101828', 0.6]],
    'red-flash': [['multiply', '#c4141a', 0.85]],
    'sunset-epic': [['soft-light', '#ff9a60', 0.6], ['multiply', '#ffd0a0', 0.25], ['screen', '#3a0a2a', 0.2]],
  });
})();
