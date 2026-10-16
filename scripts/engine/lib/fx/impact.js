// impact.js — impact language: impact frames (1-2 frame inverted / flat two-tone flash), directional speed streaks,
// shockwave rings, a dust kick on landing (tracks a target layer's jumps and drop entrance), toxic gas clouds, a glow
// aura, and the `trail` layer field (motion smear: time-sampled ghost copies while a layer moves fast). All closed form
// in time; particles come from particles.js. Painted rendering follows the shot look (T.paintedState).
(function () {
  'use strict';
  const T = window.TOON, FX = T.FX, TAU = Math.PI * 2, W = T.W, H = T.H, h32 = T.h32;
  const INK = () => T.PAL.ink;
  const FPS = 30;

  // ---------- impact-frame: {mode 'invert'|'flat'|'flash', frames 2, color, accent, ink} ----------
  // Placed at the hit time (layer at). Works on the finished frame below it, in device pixels.
  T.IMPACT_MODES = ['invert', 'flat', 'flash'];
  FX['impact-frame'] = (ctx, L, lt) => {
    const frames = Math.max(1, Math.round(L.frames ?? 2));
    if (lt < 0 || lt >= frames / FPS - 1e-6) return;
    const mode = L.mode ?? 'invert', c = ctx.canvas;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
    if (mode === 'invert') { ctx.globalCompositeOperation = 'difference'; ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, c.width, c.height); }
    else if (mode === 'flash') { ctx.fillStyle = T.hex6(L.color ?? '#fffbea'); ctx.globalAlpha = 0.88; ctx.fillRect(0, 0, c.width, c.height); }
    else if (mode === 'flat') { // two- or three-tone poster frame: ink / accent / paper by luminance
      const img = ctx.getImageData(0, 0, c.width, c.height), d = img.data;
      const rgb = (h) => { const n = parseInt(T.hex6(h).slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
      const ink = rgb(L.ink ?? '#1a0f0b'), paper = rgb(L.color ?? '#f6efe2'), acc = L.accent === null ? null : rgb(L.accent ?? '#c8141c');
      const t0 = L.threshold ?? 0.36;
      for (let i = 0; i < d.length; i += 4) {
        const y = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) / 255;
        const q = y < t0 ? ink : acc && y < t0 + 0.2 ? acc : paper;
        d[i] = q[0]; d[i + 1] = q[1]; d[i + 2] = q[2];
      }
      ctx.putImageData(img, 0, 0);
    } else throw new Error(`impact-frame: unknown mode "${mode}" (known: ${T.IMPACT_MODES.join(', ')})`);
    ctx.restore();
  };

  // ---------- streaks: parallel speed lines {angle 180 (direction they travel, deg), count 36, speed 2600, w, h, len, width, color, ink} ----------
  FX.streaks = (ctx, L, lt, env) => {
    const P = T.paintedState(env, L), n = L.count ?? 36, span = (L.w ?? 2600) + 800, hh = L.h ?? 1300, sp = L.speed ?? 2600;
    const seed = T.hash(L.id ?? 'streaks'), col = T.hex6(L.color ?? (L.ink ? '#2a1c15' : '#ffffff')), len = L.len ?? [160, 560], wd = L.width ?? [3, 10];
    const n2 = parseInt(col.slice(1), 16), rgb = `${n2 >> 16},${(n2 >> 8) & 255},${n2 & 255}`;
    ctx.save(); ctx.rotate((L.angle ?? 180) * T.DEG);
    for (let i = 0; i < n; i++) {
      const off = (h32(seed, i, 1) - 0.5) * hh, l = T.lerp(len[0], len[1], h32(seed, i, 2)), w = T.lerp(wd[0], wd[1], h32(seed, i, 3));
      const x = ((h32(seed, i, 4) * span + lt * sp * (0.7 + 0.6 * h32(seed, i, 5))) % span) - span / 2;
      const a = (L.alpha ?? 0.8) * (0.45 + 0.55 * h32(seed, i, 6));
      if (P) { const g = ctx.createLinearGradient(x - l, 0, x, 0); g.addColorStop(0, `rgba(${rgb},0)`); g.addColorStop(1, `rgba(${rgb},${a.toFixed(3)})`); ctx.fillStyle = g; }
      else { ctx.fillStyle = col; ctx.globalAlpha = a; }
      ctx.beginPath(); ctx.moveTo(x - l, off); ctx.lineTo(x, off - w / 2); ctx.quadraticCurveTo(x + w, off, x, off + w / 2); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  };

  // ---------- shockwave: {size 420, dur 0.6, rings 2, color, squash (y scale), ground (squash 0.32 + dust ring), width} ----------
  const emitCache = new Map();
  const emitterFor = (key, make) => { let e = emitCache.get(key); if (!e) { e = make(); emitCache.set(key, e); } return e; };
  FX.shockwave = (ctx, L, lt, env) => {
    const P = T.paintedState(env, L), size = L.size ?? 420, dur = L.dur ?? 0.6, rings = L.rings ?? 2, sq = L.squash ?? (L.ground ? 0.32 : 1);
    const col = T.hex6(L.color ?? '#ffffff'), wid = L.width ?? size * 0.09;
    for (let k = 0; k < rings; k++) {
      const p = (lt - k * 0.09) / dur;
      if (p <= 0 || p >= 1) continue;
      const r = size * T.ease.outCubic(p) * (1 - k * 0.12), w = wid * (1 - p) + 1, a = (1 - p) * (k ? 0.6 : 1);
      ctx.save(); ctx.scale(1, sq);
      if (P) {
        const g = ctx.createRadialGradient(0, 0, Math.max(0, r - w * 1.6), 0, 0, r + w);
        const n = parseInt(col.slice(1), 16), rgb = `${n >> 16},${(n >> 8) & 255},${n & 255}`;
        g.addColorStop(0, `rgba(${rgb},0)`); g.addColorStop(0.62, `rgba(${rgb},${(0.9 * a).toFixed(3)})`); g.addColorStop(1, `rgba(${rgb},0)`);
        ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r + w, 0, TAU); ctx.fill();
        ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha *= a * 0.35; ctx.strokeStyle = INK(); ctx.lineWidth = Math.max(1, w * 0.18);
        ctx.beginPath(); ctx.arc(0, 0, Math.max(1, r - w * 1.2), 0, TAU); ctx.stroke(); // refraction edge inside the ring
      } else {
        ctx.globalAlpha *= a; ctx.lineWidth = w + 6; ctx.strokeStyle = INK(); ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
        ctx.lineWidth = w; ctx.strokeStyle = col; ctx.stroke();
      }
      ctx.restore();
    }
    if (L.ground && L.dust !== false) { // dust rolls out along the ground on both sides (no squash: puffs stay round)
      for (const side of [0, 180]) {
        const e = emitterFor((L.id ?? 'shock') + ':dust' + side + size, () => ({ preset: 'dust', id: (L.id ?? 'shock') + 'd' + side, burst: 12, dir: side, spread: 30, speed: size * 1.6, drag: 3.2, gravity: -60, h: 16, w: 40, life: 1.3, size: [size * 0.1, size * 0.2], grow: 2.2, color: L.dustColor }));
        T.drawParticles(ctx, e, lt, { painted: P });
      }
    }
  };

  // ---------- dustkick: {target (layer id) | times [s], size 1, color, side 'both'|'left'|'right'} ----------
  // Puffs roll out along the ground from the landing point and settle; pebbles hop. A target's landings are its jump
  // ends and the first touch of a drop / slam entrance, at the target's feet in world space (independent of the camera).
  function landings(L, env) {
    const out = [];
    for (const t of L.times ?? []) out.push({ t: t + (L.at ?? 0), x: null, y: null });
    if (!L.target || !env || !env.shot) return out.length ? out : [{ t: L.at ?? 0, x: null, y: null }];
    const Lt = (env.shot.layers || []).find((x) => x.id === L.target) || (env.shot.pinned || []).find((x) => x.id === L.target);
    if (!Lt) throw new Error(`dustkick: target "${L.target}" is not a layer id in shot ${env.shot.id}`);
    const ts = (Lt.jump || []).map((j) => j.at + (j.dur ?? 0.45));
    const ek = Lt.enter || T.DEFAULT_ENTER[Lt.type] || 'pop';
    if (ek === 'drop') ts.push((Lt.at ?? 0) + (Lt.enterDur ?? T.ENTER_DUR.drop ?? 0.5) / 2.75);
    if (ek === 'slam') ts.push((Lt.at ?? 0) + (Lt.enterDur ?? T.ENTER_DUR.slam ?? 0.2));
    for (const t of (L.times ? [] : ts)) {
      const st = T.layerState(Lt, t + 1e-3);
      if (!st) continue;
      const centred = Lt.type === 'prop' && !T.PROP_GROUND.has(Lt.kind); // centred props stand on their lower edge
      out.push({ t, x: st.x, y: st.y + (centred ? ((Lt.size ?? 160) / 2) * st.s : 0), w: (Lt.size ?? 300) * st.s });
    }
    return out;
  }
  FX.dustkick = (ctx, L, lt, env) => {
    const P = T.paintedState(env, L), k = L.size ?? 1, me = env && env.st;
    for (const [n, hit] of landings(L, env).entries()) {
      const a = env && env.lt != null ? env.lt - hit.t : lt - (hit.t - (L.at ?? 0));
      if (a < 0 || a > 1.6) continue;
      ctx.save();
      if (hit.x != null && me) ctx.translate((hit.x - me.x) / (me.s || 1), (hit.y - me.y) / (me.s || 1));
      const wk = hit.w ? Math.max(0.5, Math.min(2.2, hit.w / 360)) * k : k, id = (L.id ?? 'kick') + ':' + n;
      for (const side of L.side === 'left' ? [180] : L.side === 'right' ? [0] : [180, 0]) {
        const e = emitterFor(id + side + wk.toFixed(2) + (L.color ?? ''), () => ({ preset: 'dust', id: id + side, burst: 8, dir: side, spread: 26, speed: 420 * wk, drag: 3.4, gravity: -45, w: 30 * wk, h: 6, life: 1.15, size: [26 * wk, 50 * wk], grow: 2.4, color: L.color }));
        T.drawParticles(ctx, e, a, { painted: P });
      }
      const pe = emitterFor(id + 'peb' + wk.toFixed(2), () => ({ preset: 'debris', id: id + 'p', burst: 7, speed: 300 * wk, spread: 120, size: [5 * wk, 10 * wk], floor: 0, life: 0.9, w: 40 * wk }));
      T.drawParticles(ctx, pe, a, { painted: P });
      ctx.restore();
    }
  };

  // ---------- toxic-cloud: {size 320, color '#9fb34a', count 18, dur 2 (growth), ground, drift px/s, wisps} ----------
  FX['toxic-cloud'] = (ctx, L, lt, env) => {
    const P = T.paintedState(env, L), R = (L.size ?? 320) * (0.25 + 0.75 * T.ease.outCubic(T.clamp(lt / (L.dur ?? 2))));
    const col = T.hex6(L.color ?? '#9fb34a'), tones = T.puffTones(col), n = L.count ?? 18, seed = T.hash(L.id ?? 'toxic');
    const ground = !!L.ground, drift = (L.drift ?? 0) * lt, ll = P ? T.lightLocal(ctx, P) : null;
    if (P) { // sickly under-glow
      const g = ctx.createRadialGradient(drift, 0, 0, drift, 0, R * 1.5);
      g.addColorStop(0, T.mix(col, '#ffffff', 0.3) + '55'); g.addColorStop(1, col + '00');
      ctx.fillStyle = g; ctx.fillRect(drift - R * 1.6, -R * 1.6, R * 3.2, R * 3.2);
    }
    const puffs = [];
    for (let i = 0; i < n; i++) {
      const a0 = h32(seed, i, 1) * TAU, d = Math.sqrt(h32(seed, i, 2)) * R * 0.78, sp = (h32(seed, i, 3) < 0.5 ? -1 : 1) * (0.18 + h32(seed, i, 4) * 0.2);
      const ang = a0 + lt * sp, rr = R * (0.32 + 0.22 * h32(seed, i, 5)) * (0.88 + 0.12 * Math.sin(lt * 0.9 + i * 1.7));
      let x = Math.cos(ang) * d + drift, y = Math.sin(ang) * d * (ground ? 0.42 : 0.8);
      if (ground) y = -Math.abs(y) - rr * 0.35;
      puffs.push({ x, y, rr, v: i % 4, tone: h32(seed, i, 6) });
    }
    puffs.sort((p, q) => p.y - q.y || p.x - q.x);
    const a0 = ctx.globalAlpha * (L.alpha ?? 0.92);
    for (const p of puffs) {
      if (P) { ctx.globalAlpha = a0; ctx.drawImage(T.puffSprite(tones, Math.round(ll.lx * 4) / 4, Math.round(ll.ly * 4) / 4, p.v), p.x - p.rr * 1.4, p.y - p.rr * 1.4, p.rr * 2.8, p.rr * 2.8); }
      else { ctx.globalAlpha = a0; ctx.fillStyle = p.tone < 0.3 ? tones[2] : p.tone < 0.7 ? tones[0] : T.mix(tones[0], tones[1], 0.5); ctx.strokeStyle = INK(); ctx.lineWidth = Math.max(3, p.rr * 0.06); ctx.beginPath(); ctx.arc(p.x, p.y, p.rr, 0, TAU); ctx.fill(); ctx.stroke(); }
    }
    ctx.globalAlpha = a0;
    if (L.wisps !== false) {
      const e = emitterFor((L.id ?? 'toxic') + ':w' + col, () => ({ preset: 'gas', id: (L.id ?? 'toxic') + 'w', color: col, rate: 3, w: (L.size ?? 320) * 1.4, life: 3.5, size: [60, 110], prewarm: true, wind: 40 }));
      ctx.save(); ctx.translate(drift, ground ? -R * 0.3 : 0); T.drawParticles(ctx, e, lt, { painted: P }); ctx.restore();
    }
  };

  // ---------- aura: {radius 220, color '#ffe27a', pulse 0.08, rays 10, motes true} ----------
  FX.aura = (ctx, L, lt, env) => {
    const P = T.paintedState(env, L), R = (L.radius ?? 220) * (1 + Math.sin(lt * TAU * 0.6) * (L.pulse ?? 0.08)), col = T.hex6(L.color ?? '#ffe27a');
    const n = parseInt(col.slice(1), 16), rgb = `${n >> 16},${(n >> 8) & 255},${n & 255}`;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 1.4);
    g.addColorStop(0, `rgba(${rgb},0.55)`); g.addColorStop(0.45, `rgba(${rgb},0.25)`); g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R * 1.4, 0, TAU); ctx.fill();
    const rays = L.rays ?? 10, seed = T.hash(L.id ?? 'aura');
    for (let i = 0; i < rays; i++) {
      const a = (i / rays) * TAU + lt * 0.35 * (i % 2 ? 1 : -1) + h32(seed, i, 1), len = R * (1.3 + 0.5 * h32(seed, i, 2)) * (0.85 + 0.15 * Math.sin(lt * 3 + i)), w = 0.07 + 0.05 * h32(seed, i, 3);
      const rg = ctx.createLinearGradient(0, 0, Math.cos(a) * len, Math.sin(a) * len);
      rg.addColorStop(0, `rgba(${rgb},${P ? 0.42 : 0.5})`); rg.addColorStop(1, `rgba(${rgb},0)`);
      ctx.fillStyle = rg; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a - w) * len, Math.sin(a - w) * len); ctx.lineTo(Math.cos(a + w) * len, Math.sin(a + w) * len); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    if (L.motes !== false) {
      const e = emitterFor((L.id ?? 'aura') + ':m' + col + R.toFixed(0), () => ({ preset: 'embers', id: (L.id ?? 'aura') + 'm', color: col, w: (L.radius ?? 220) * 1.6, h: (L.radius ?? 220), rate: 9, speed: 50, prewarm: true, gravity: -30 }));
      T.drawParticles(ctx, e, lt, { painted: P || { wx: 0.5, wy: -0.8 } }); // glow motes in both looks
    }
  };

  // ---------- trail: motion smear for fast layers (any type): true | {frames 4, length 0.12 (s), alpha 0.5, min 6 (px)} ----------
  // Ghost copies of the layer at earlier times, drawn under it while it moves (time samples, so spins smear too).
  const baseDrawLayer = T.drawLayer;
  T.drawLayer = (ctx, L, lt, env, cam) => {
    if (L.trail && !L.__ghost) drawTrail(ctx, L, lt, env, cam);
    return baseDrawLayer(ctx, L, lt, env, cam);
  };
  function drawTrail(ctx, L, lt, env, cam) {
    const o = L.trail === true ? {} : L.trail, n = Math.max(1, Math.min(12, Math.round(o.frames ?? 4))), len = o.length ?? 0.12;
    const s0 = T.layerState(L, lt), s1 = T.layerState(L, lt - len);
    if (!s0 || !s1) return;
    const moved = Math.hypot(s0.x - s1.x, s0.y - s1.y) + Math.abs(s0.r - s1.r) * (L.size ?? 160) * 0.5;
    if (moved < (o.min ?? 6)) return;
    const G = { ...L, trail: null, __ghost: true, contact: false };
    for (let k = n; k >= 1; k--) {
      ctx.save(); ctx.globalAlpha *= (o.alpha ?? 0.5) * (1 - k / (n + 1));
      baseDrawLayer(ctx, G, lt - (k / n) * len, env, cam);
      ctx.restore();
    }
  }
})();
