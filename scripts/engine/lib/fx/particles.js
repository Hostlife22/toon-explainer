// particles.js — deterministic closed-form particle emitters. Every particle is a pure function of (seed, index, t):
// spawn time, launch angle, speed, size and tone come from an integer hash of (seed, index); its position is the
// analytic solution of launch velocity + gravity + wind under linear drag, plus smooth hashed turbulence. Nothing is
// stepped or stored, so a frame never depends on render order. Layer: {type:'fx', kind:'particles', preset, rate,
// spread, life, gravity, wind, dur, ...} (fields in references/toolkits/08_fx_and_tone.md). Painted rendering (soft
// multi-tone puffs, additive glows) is used under style.look "painted"; the classic look draws flat toon marks.
// Also defines T.paintedState / T.lookPainted (look of an fx or doc layer, which T.PAINT leaves flat) and T.lightLocal.
(function () {
  'use strict';
  const T = window.TOON, TAU = Math.PI * 2, D = T.DEG;

  // ---------- painted-look helpers shared by props, fx and paper ----------
  // The paint state of the layer being drawn: T.PAINT, or (for exempt types such as fx and doc) the shot's look.
  T.paintedState = (env, L) => {
    if (L && L.painted === false) return null;
    if (T.PAINT) return T.PAINT;
    return env && env.spec && env.shot && T.paintState ? T.paintState(env.spec, env.shot) : null;
  };
  T.lookPainted = (env, L) => !!T.paintedState(env, L);
  // Unit light direction (toward the light) in the current local frame; upper left when there is no painted light.
  T.lightLocal = (ctx, P = T.PAINT) => {
    if (!P) return { lx: -0.55, ly: -0.83 };
    const m = ctx.getTransform(), det = m.a * m.d - m.b * m.c;
    if (!det) return { lx: P.wx, ly: P.wy };
    let lx = (m.d * P.wx - m.c * P.wy) / det, ly = (-m.b * P.wx + m.a * P.wy) / det;
    const n = Math.hypot(lx, ly) || 1;
    lx /= n; ly /= n;
    return { lx, ly };
  };

  // ---------- hashing ----------
  // Integer hash of three ints -> [0, 1). Cheap enough for thousands of calls per frame (T.hash works on strings).
  const h32 = (a, b, c) => {
    let h = Math.imul(a ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul((b | 0) + 0x7f4a7c15, 0xc2b2ae35) ^ Math.imul((c | 0) + 0x165667b1, 0x27d4eb2f);
    h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d); h ^= h >>> 12; h = Math.imul(h, 0x297a2d39); h ^= h >>> 15;
    return (h >>> 0) / 4294967296;
  };
  const vnoise = (x, s, k) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return (h32(s, i, k) * (1 - u) + h32(s, i + 1, k) * u) * 2 - 1; };
  T.h32 = h32;

  // ---------- presets ----------
  // dir: launch direction in degrees (0 = right, -90 = up); spread: full cone in degrees; speed px/s; gravity px/s^2
  // (negative = buoyant); drag 1/s; wind px/s (the air speed particles drift toward); turb px; size [min, max] px;
  // grow: end size / start size; w, h: emitter box; oy: emitter offset (sky emitters sit above the frame).
  const PRESETS = {
    smoke: { rate: 7, life: 3.4, dir: -90, spread: 28, speed: 90, gravity: -60, drag: 0.6, wind: 26, turb: 30, size: [58, 104], grow: 2.6, w: 50, alpha: 0.78, draw: 'puff', colors: ['#8b857d', '#57524c', '#bcb5a9'] },
    dust: { rate: 28, life: 1.2, dir: -90, spread: 170, speed: 170, gravity: 70, drag: 2.6, wind: 0, turb: 10, size: [22, 46], grow: 2.3, w: 70, alpha: 0.82, draw: 'puff', colors: ['#d8c6a0', '#a48c66', '#f3e8cc'] },
    sparks: { rate: 55, life: 0.65, dir: -90, spread: 130, speed: 540, gravity: 950, drag: 0.8, turb: 0, size: [3.5, 7], grow: 0.6, w: 20, alpha: 1, draw: 'spark', glow: true, colors: ['#fff4b8', '#ffb43a', '#ff7a1a'] },
    fire: { rate: 42, life: 0.85, dir: -90, spread: 20, speed: 150, gravity: -150, drag: 1.3, turb: 20, size: [40, 70], grow: 0.35, w: 110, alpha: 0.9, draw: 'flame', colors: ['#ffe27a', '#ffb52e', '#ff7414', '#c4270c', '#5a1a0c'] },
    embers: { rate: 12, life: 2.4, dir: -90, spread: 50, speed: 120, gravity: -45, drag: 0.6, turb: 40, size: [3.5, 7.5], grow: 0.7, w: 160, alpha: 1, draw: 'glow', glow: true, colors: ['#ffe070', '#ff8a24', '#ff5410'] },
    steam: { rate: 10, life: 2.2, dir: -90, spread: 22, speed: 95, gravity: -25, drag: 0.9, wind: 14, turb: 26, size: [26, 46], grow: 3.2, w: 30, alpha: 0.55, draw: 'puff', colors: ['#eef1f4', '#b9c3cd', '#ffffff'] },
    splash: { rate: 46, life: 0.75, dir: -90, spread: 120, speed: 430, gravity: 1150, drag: 0.3, turb: 0, size: [7, 14], grow: 0.7, w: 40, alpha: 0.95, draw: 'drop', colors: ['#8fc6ee', '#4a86c0', '#e9f7ff'] },
    rain: { rate: 240, life: 0.8, dir: 96, spread: 2, speed: 1750, gravity: 0, drag: 0, turb: 0, size: [2.4, 4], grow: 1, w: 2300, oy: -640, alpha: 0.75, draw: 'streak', colors: ['#dfe9f5', '#b8c8dc'] },
    snow: { rate: 42, life: 6.5, dir: 90, spread: 24, speed: 70, gravity: 0, drag: 0, wind: 0, turb: 46, size: [5, 11], grow: 1, w: 2300, oy: -640, alpha: 0.95, draw: 'flake', colors: ['#ffffff', '#dce6f1'] },
    debris: { rate: 0, burst: 26, life: 1.7, dir: -90, spread: 150, speed: 580, gravity: 1500, drag: 0.25, turb: 0, size: [10, 24], grow: 1, w: 30, spin: 9, floor: 170, alpha: 1, draw: 'chunk', colors: ['#6e5a44', '#3f3126', '#9a856c'] },
    confetti: { rate: 42, life: 4.2, dir: 90, spread: 30, speed: 150, gravity: 60, drag: 1.4, turb: 70, size: [12, 19], grow: 1, w: 1700, oy: -600, spin: 6, alpha: 1, draw: 'paper', colors: ['#c8323a', '#f2c230', '#5fb0e8', '#7cc05a', '#f4f0e6', '#b04ec0'] },
    leaves: { rate: 6, life: 6.5, dir: 100, spread: 40, speed: 80, gravity: 22, drag: 1, wind: 40, turb: 90, size: [26, 40], grow: 1, w: 1900, oy: -600, spin: 2.2, alpha: 1, draw: 'leaf', colors: ['#c9762a', '#a8481c', '#e0a53a', '#7a8a2a'] },
    bubbles: { rate: 10, life: 2.6, dir: -90, spread: 16, speed: 80, gravity: -45, drag: 1, turb: 16, size: [8, 20], grow: 1.3, w: 60, alpha: 0.9, draw: 'bubble', colors: ['#d6f1fc', '#7ab8d8'] },
    gas: { rate: 6, life: 4.2, dir: -70, spread: 60, speed: 70, gravity: -22, drag: 0.5, wind: 34, turb: 44, size: [80, 150], grow: 2.3, w: 120, alpha: 0.62, draw: 'puff', colors: ['#a3b44c', '#69782a', '#d8e47e'] },
  };
  T.PARTICLE_PRESETS = PRESETS;
  T.PARTICLE_MAX_RATE = 2000; // per second (validated in scripts/props_fx.py)
  T.PARTICLE_MAX_BURST = 5000;

  // Merge preset + layer fields into an emitter description (cached per layer object).
  const emitters = new WeakMap();
  const tones = (hex) => [hex, T.mix(hex, '#1c1420', 0.38), T.mix(hex, '#ffffff', 0.4)];
  function emitter(o) {
    if (emitters.has(o)) return emitters.get(o);
    const p = PRESETS[o.preset ?? 'smoke'];
    if (!p) throw new Error(`Unknown particles preset "${o.preset}" (known: ${Object.keys(PRESETS).join(', ')})`);
    const size = o.size == null ? p.size : Array.isArray(o.size) ? o.size : [o.size * 0.75, o.size * 1.25];
    const raw = (o.colors ?? (o.color ? (p.draw === 'paper' || p.draw === 'leaf' ? [o.color] : p.colors.length > 3 ? [T.mix(o.color, '#ffffff', 0.6), o.color, T.mix(o.color, '#000000', 0.45)] : tones(T.hex6(o.color))) : p.colors)).map(T.hex6);
    if (!raw.length) throw new Error('particles: colors must not be empty');
    // every drawer reads up to three tones (base, shadow, light) or a ramp of at least two: expand short palettes
    const colors = raw.length >= 3 ? raw : raw.length === 2 ? [raw[0], raw[1], T.mix(raw[0], '#ffffff', 0.4)] : tones(raw[0]);
    const num = (v, def, lo, hi) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : def);
    const e = {
      ...p, size, colors,
      rate: num(o.rate ?? p.rate, 0, 0, T.PARTICLE_MAX_RATE), life: num(o.life ?? p.life, p.life, 0.01, 60), dir: o.dir ?? p.dir, spread: o.spread ?? p.spread, speed: o.speed ?? p.speed,
      gravity: o.gravity ?? p.gravity, drag: o.drag ?? p.drag ?? 0, wind: o.wind ?? p.wind ?? 0, turb: o.turb ?? p.turb ?? 0,
      grow: o.grow ?? p.grow ?? 1, w: o.w ?? p.w ?? 0, h: o.h ?? p.h ?? 0, ox: o.ox ?? 0, oy: o.oy ?? p.oy ?? 0, spin: o.spin ?? p.spin ?? 0,
      // `opacity` is the emitter's own particle opacity; the layer's `alpha` is applied once by core to the context
      floor: o.floor ?? p.floor ?? null, alpha: o.opacity ?? p.alpha ?? 1, burst: Math.round(num(o.burst ?? p.burst ?? 0, 0, 0, T.PARTICLE_MAX_BURST)), dur: num(o.dur, Infinity, 0, Infinity),
      seed: T.hash((o.seed ?? o.id ?? 'particles') + ':' + (o.preset ?? 'smoke')),
    };
    e.prewarm = o.prewarm === true ? e.life : num(o.prewarm, 0, 0, 60);
    e.emitEnd = e.prewarm + e.dur; // emitter time when emission stops (prewarm runs before layer time 0)
    e.count = e.burst > 0 ? e.burst : e.rate <= 0 ? 0 : e.dur === Infinity ? Infinity : Math.ceil(e.emitEnd * e.rate);
    emitters.set(o, e);
    return e;
  }

  // State of particle i at emitter-local time t, or null when it is not alive. Pure function of (o, i, t).
  function stateOf(e, i, t) {
    const s = e.seed, r0 = h32(s, i, 1);
    const t0 = e.burst > 0 ? r0 * 0.06 : (i + r0 * 0.9) / e.rate;
    if (e.burst <= 0 && t0 > e.emitEnd) return null; // exact emission cutoff
    const life = e.life * (0.7 + 0.6 * h32(s, i, 2)), a = t - t0;
    if (a < 0 || a > life) return null;
    const u = a / life, ang = (e.dir + (h32(s, i, 3) - 0.5) * e.spread) * D, sp = e.speed * (0.55 + 0.9 * h32(s, i, 4));
    const vx = Math.cos(ang) * sp, vy = Math.sin(ang) * sp, k = e.drag, g = e.gravity;
    let x = e.ox + (h32(s, i, 5) - 0.5) * e.w, y = e.oy + (h32(s, i, 6) - 0.5) * e.h, cvx, cvy;
    if (k > 1e-3) { // linear drag: v(a) = v0 e^-ka + (g/k + wind)(1 - e^-ka) on the axis that has them
      const ek = Math.exp(-k * a), E = (1 - ek) / k;
      x += vx * E + e.wind * (a - E); y += vy * E + (g / k) * (a - E);
      cvx = vx * ek + e.wind * (1 - ek); cvy = vy * ek + (g / k) * (1 - ek);
    } else {
      x += vx * a + e.wind * a; y += vy * a + 0.5 * g * a * a;
      cvx = vx + e.wind; cvy = vy + g * a;
    }
    if (e.turb) { const ramp = Math.min(1, a * 1.5); x += e.turb * vnoise(a * 0.9 + r0 * 9, s, i * 2 + 7) * ramp; y += e.turb * 0.6 * vnoise(a * 0.9 + r0 * 5, s, i * 2 + 8) * ramp; }
    let landed = false;
    if (e.floor != null && y > e.floor) { y = e.floor; landed = true; cvx = 0; cvy = 0; }
    const s0 = T.lerp(e.size[0], e.size[1], h32(s, i, 7)), size = s0 * T.lerp(1, e.grow, 1 - (1 - u) * (1 - u));
    const fadeIn = Math.min(1, a / 0.09), fadeOut = landed ? 1 - T.clamp((u - 0.7) / 0.3) : 1 - u * u;
    return { i, x, y, vx: cvx, vy: cvy, size, u, a, alpha: e.alpha * fadeIn * fadeOut, rot: h32(s, i, 8) * TAU + e.spin * a * (h32(s, i, 9) < 0.5 ? -1 : 1), tone: h32(s, i, 10), landed };
  }
  // Canonical emitter object for a parameter set: the full parameters are the cache identity (no lossy keys), so two
  // layers that differ in any field never share an emitter, whatever order frames render in.
  const canon = new Map();
  T.emitterOf = (params) => { const key = JSON.stringify(params); let e = canon.get(key); if (!e) { e = Object.freeze({ ...params }); canon.set(key, e); } return e; };
  T.particleAt = (o, i, t) => {
    const e = emitter(o);
    return i >= 0 && i < e.count ? stateOf(e, i, t + e.prewarm) : null;
  };

  // ---------- sprites (built once per colours / light; deterministic content) ----------
  const sprites = new Map();
  const canvas = (n) => { const c = document.createElement('canvas'); c.width = c.height = n; return c; };
  // Soft painted puff: lumpy base, a shadow band away from the light, a lit cap toward it, a feathered edge.
  function puffSprite(cols, lx, ly, v) {
    const key = 'puff' + cols.join() + lx.toFixed(1) + ly.toFixed(1) + v;
    let c = sprites.get(key);
    if (c) return c;
    const S = 128, R = S * 0.36, a = canvas(S), g = a.getContext('2d');
    const lobes = [[0, 0, 1]];
    for (let j = 0; j < 5; j++) { const an = (j / 5) * TAU + h32(v, j, 31) * 1.2, d = R * (0.42 + h32(v, j, 32) * 0.2); lobes.push([Math.cos(an) * d, Math.sin(an) * d, 0.48 + h32(v, j, 33) * 0.2]); }
    const blob = (dx, dy, k = 1) => { g.beginPath(); for (const [x, y, r] of lobes) { g.moveTo(S / 2 + x + dx + R * r * k, S / 2 + y + dy); g.arc(S / 2 + x + dx, S / 2 + y + dy, R * r * k, 0, TAU); } };
    g.fillStyle = cols[1]; blob(0, 0); g.fill();
    g.save(); blob(0, 0); g.clip();
    g.fillStyle = T.mix(cols[1], '#000000', 0.18); blob(-lx * R * 0.55, -ly * R * 0.55, 0.8); g.fill(); // core shadow
    g.fillStyle = cols[1]; blob(-lx * R * 0.1, -ly * R * 0.1, 0.92); g.fill();
    g.fillStyle = cols[0]; blob(lx * R * 0.26, ly * R * 0.26, 0.95); g.fill();
    g.globalAlpha = 0.9; g.fillStyle = cols[2]; blob(lx * R * 0.55, ly * R * 0.55, 0.6); g.fill();
    g.restore();
    c = canvas(S);
    const o = c.getContext('2d');
    o.filter = 'blur(1.6px)'; o.drawImage(a, 0, 0); o.filter = 'none';
    sprites.set(key, c);
    return c;
  }
  function glowSprite(col) {
    const key = 'glow' + col;
    let c = sprites.get(key);
    if (c) return c;
    c = canvas(64);
    const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32), n = parseInt(T.hex6(col).slice(1), 16);
    const rgb = `${n >> 16},${(n >> 8) & 255},${n & 255}`;
    gr.addColorStop(0, `rgba(${rgb},1)`); gr.addColorStop(0.35, `rgba(${rgb},0.55)`); gr.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    sprites.set(key, c);
    return c;
  }
  T.puffSprite = puffSprite;
  T.glowSprite = glowSprite;
  T.puffTones = (hex) => tones(T.hex6(hex));
  const ramp = (cols, u) => { const f = T.clamp(u) * (cols.length - 1), j = Math.min(cols.length - 2, Math.floor(f)); return T.mix(cols[j], cols[j + 1], f - j); };
  const rampKey = (cols, u) => ramp(cols, Math.round(T.clamp(u) * 8) / 8); // quantised: a few cached sprites per ramp

  // ---------- drawing ----------
  const INK = () => T.PAL.ink;
  const DRAW = {
    puff(ctx, p, e, look) {
      const col = e.colors, r = p.size / 2;
      if (look) { const v = Math.floor(p.tone * 4); ctx.globalAlpha = p.alpha * look.a0; ctx.drawImage(puffSprite(col, look.lx, look.ly, v), p.x - r * 1.4, p.y - r * 1.4, r * 2.8, r * 2.8); return; }
      ctx.globalAlpha = p.alpha * look0(ctx); ctx.fillStyle = col[p.tone < 0.25 ? 2 : 0]; ctx.strokeStyle = INK(); ctx.lineWidth = Math.max(2, r * 0.1);
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.fill(); ctx.stroke();
    },
    flame(ctx, p, e, look) {
      const r = p.size / 2, col = rampKey(e.colors, p.u);
      const a = p.alpha * (look ? look.a0 : look0(ctx)) * (1 - p.u * 0.5);
      if (look) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a * 0.22; ctx.drawImage(glowSprite(col), p.x - r * 2.2, p.y - r * 2.2, r * 4.4, r * 4.4); ctx.globalCompositeOperation = 'source-over'; }
      const ang = Math.atan2(p.vy, p.vx), tip = r * (1.6 + Math.min(1.4, Math.hypot(p.vx, p.vy) / 160));
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(ang); ctx.globalAlpha = look ? a * 0.85 : a; ctx.fillStyle = col;
      ctx.beginPath(); ctx.moveTo(tip, 0); ctx.quadraticCurveTo(r * 0.2, r * 0.95, -r * 0.8, 0); ctx.quadraticCurveTo(r * 0.2, -r * 0.95, tip, 0); ctx.fill();
      ctx.restore();
    },
    glow(ctx, p, e, look) {
      const r = p.size, col = rampKey(e.colors, p.u * 0.9);
      ctx.globalAlpha = p.alpha * (look ? look.a0 : look0(ctx));
      if (look) ctx.drawImage(glowSprite(col), p.x - r * 2.2, p.y - r * 2.2, r * 4.4, r * 4.4);
      ctx.fillStyle = look ? '#fff6d8' : col; ctx.beginPath(); ctx.arc(p.x, p.y, r * 0.5, 0, TAU); ctx.fill();
    },
    spark(ctx, p, e, look) {
      const sp = Math.hypot(p.vx, p.vy) || 1, len = Math.min(70, sp * 0.035 + p.size), ux = p.vx / sp, uy = p.vy / sp, col = rampKey(e.colors, p.u);
      ctx.globalAlpha = p.alpha * (look ? look.a0 : look0(ctx));
      if (look) ctx.drawImage(glowSprite(col), p.x - p.size * 3, p.y - p.size * 3, p.size * 6, p.size * 6);
      ctx.strokeStyle = look ? '#fff8de' : col; ctx.lineWidth = p.size * 0.6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(p.x - ux * len, p.y - uy * len); ctx.lineTo(p.x, p.y); ctx.stroke();
    },
    streak(ctx, p, e, look) {
      const sp = Math.hypot(p.vx, p.vy) || 1, len = sp * 0.04, ux = p.vx / sp, uy = p.vy / sp;
      ctx.globalAlpha = p.alpha * (look ? look.a0 : look0(ctx)) * (0.5 + p.tone * 0.5);
      ctx.strokeStyle = e.colors[p.tone < 0.5 ? 0 : e.colors.length - 1]; ctx.lineWidth = p.size; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(p.x - ux * len, p.y - uy * len); ctx.lineTo(p.x, p.y); ctx.stroke();
    },
    flake(ctx, p, e, look) {
      const r = p.size / 2;
      ctx.globalAlpha = p.alpha * (look ? look.a0 : look0(ctx));
      if (look) { ctx.drawImage(glowSprite(e.colors[0]), p.x - r * 2, p.y - r * 2, r * 4, r * 4); return; }
      ctx.fillStyle = e.colors[0]; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.fill();
    },
    drop(ctx, p, e, look) {
      const sp = Math.hypot(p.vx, p.vy) || 1, ang = Math.atan2(p.vy, p.vx), r = p.size / 2, st = Math.min(3, 1 + sp / 500);
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(ang); ctx.globalAlpha = p.alpha * (look ? look.a0 : look0(ctx));
      ctx.beginPath(); ctx.moveTo(r * 1.2, 0); ctx.quadraticCurveTo(0, r, -r * st * 1.6, 0); ctx.quadraticCurveTo(0, -r, r * 1.2, 0);
      ctx.fillStyle = e.colors[0]; ctx.fill();
      if (look) { ctx.fillStyle = e.colors[2] ?? '#ffffff'; ctx.beginPath(); ctx.arc(r * 0.3, -r * 0.3, r * 0.35, 0, TAU); ctx.fill(); } else { ctx.strokeStyle = INK(); ctx.lineWidth = Math.max(1.5, r * 0.3); ctx.stroke(); }
      ctx.restore();
    },
    chunk(ctx, p, e, look) {
      const r = p.size / 2, n = 5, pts = [];
      for (let j = 0; j < n; j++) { const a = (j / n) * TAU, k = 0.65 + h32(e.seed, p.i * 8 + j, 41) * 0.5; pts.push([Math.cos(a) * r * k, Math.sin(a) * r * k]); }
      const col = e.colors[Math.floor(p.tone * e.colors.length) % e.colors.length];
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.landed ? p.rot - e.spin * p.a * 0.5 : p.rot); ctx.globalAlpha = p.alpha * (look ? look.a0 : look0(ctx));
      ctx.beginPath(); pts.forEach(([x, y], j) => (j ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath();
      ctx.fillStyle = col; ctx.fill();
      if (look) { ctx.save(); ctx.clip(); ctx.fillStyle = T.mix(col, '#ffffff', 0.35); ctx.fillRect(-r, -r, r * 2, r * 0.8); ctx.fillStyle = T.mix(col, '#000000', 0.35); ctx.fillRect(-r, r * 0.35, r * 2, r); ctx.restore(); }
      ctx.strokeStyle = INK(); ctx.lineWidth = Math.max(1.5, r * 0.18); ctx.lineJoin = 'round'; ctx.stroke();
      ctx.restore();
    },
    paper(ctx, p, e, look) {
      const col = e.colors[Math.floor(p.tone * e.colors.length) % e.colors.length], flip = Math.cos(p.a * (4 + p.tone * 5) + p.rot);
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale(1, Math.max(0.08, Math.abs(flip)));
      ctx.globalAlpha = p.alpha * (look ? look.a0 : look0(ctx));
      ctx.fillStyle = look && flip < 0 ? T.mix(col, '#2a1c15', 0.3) : col; ctx.fillRect(-p.size / 2, -p.size * 0.32, p.size, p.size * 0.64);
      if (look) { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-p.size / 2, -p.size * 0.32, p.size, p.size * 0.14); }
      ctx.restore();
    },
    leaf(ctx, p, e, look) {
      const col = e.colors[Math.floor(p.tone * e.colors.length) % e.colors.length], r = p.size / 2, flutter = Math.sin(p.a * 3 + p.rot);
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot + flutter * 0.6); ctx.scale(1, 0.55 + 0.45 * Math.abs(flutter));
      ctx.globalAlpha = p.alpha * (look ? look.a0 : look0(ctx));
      ctx.beginPath(); ctx.moveTo(-r, 0); ctx.quadraticCurveTo(0, -r * 0.75, r, 0); ctx.quadraticCurveTo(0, r * 0.75, -r, 0);
      ctx.fillStyle = col; ctx.fill();
      if (look) { ctx.save(); ctx.clip(); ctx.fillStyle = T.mix(col, '#2a1c15', 0.28); ctx.fillRect(-r, 0, r * 2, r); ctx.restore(); }
      ctx.strokeStyle = INK(); ctx.lineWidth = Math.max(1.2, r * 0.12); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-r * 0.9, 0); ctx.lineTo(r * 0.8, 0); ctx.lineWidth *= 0.7; ctx.stroke();
      ctx.restore();
    },
    bubble(ctx, p, e, look) {
      const r = p.size / 2, x = p.x + Math.sin(p.a * 7 + p.rot) * r * 0.5;
      ctx.globalAlpha = p.alpha * (look ? look.a0 : look0(ctx));
      ctx.fillStyle = look ? 'rgba(214,241,252,0.25)' : e.colors[0]; ctx.strokeStyle = look ? e.colors[1] ?? '#7ab8d8' : INK();
      ctx.lineWidth = Math.max(1.5, r * 0.14); ctx.beginPath(); ctx.arc(x, p.y, r, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x - r * 0.35, p.y - r * 0.35, r * 0.22, 0, TAU); ctx.fill();
    },
  };
  let A0 = 1;
  const look0 = () => A0;

  // Draw an emitter (o: layer-like object) at emitter-local time lt into the current frame. opts: {painted: state|null}.
  T.drawParticles = (ctx, o, lt, opts = {}) => {
    const e = emitter(o), t = lt + e.prewarm;
    if (t < 0) return 0;
    const P = opts.painted === undefined ? T.PAINT : opts.painted, draw = DRAW[e.draw];
    const lifeMax = e.life * 1.3;
    if (!(e.count > 0)) return 0;
    let i0 = 0, i1 = e.count - 1;
    if (e.burst <= 0) { i0 = Math.max(0, Math.floor((t - lifeMax) * e.rate) - 1); i1 = Math.min(e.count - 1, Math.floor(t * e.rate)); }
    if (!(Number.isFinite(i0) && Number.isFinite(i1))) return 0;
    const n0 = Math.max(0, i1 - i0 + 1), N = Math.min(n0, 4000); // hard cap; integer counter so the loop always ends
    i0 = i1 - N + 1;
    const ll = P ? T.lightLocal(ctx, P) : null;
    const look = P ? { lx: Math.round(ll.lx * 4) / 4, ly: Math.round(ll.ly * 4) / 4, a0: ctx.globalAlpha } : null;
    ctx.save();
    A0 = ctx.globalAlpha;
    if (P && e.glow) ctx.globalCompositeOperation = 'lighter';
    let n = 0;
    for (let j = 0; j < N; j++) {
      const p = stateOf(e, i0 + j, t);
      if (!p || p.alpha <= 0.004 || p.size <= 0.2) continue;
      draw(ctx, p, e, look);
      n++;
    }
    ctx.restore();
    return n;
  };

  T.FX.particles = (ctx, L, lt, env) => { T.drawParticles(ctx, L, lt, { painted: T.paintedState(env, L) }); };
})();
