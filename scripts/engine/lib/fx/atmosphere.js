// atmosphere.js — atmosphere & action FX measured on the full reference: flipbook fire (shapes swap every 2 frames) with
// embers, two-layer rain, corner light beam, bird flocks, smoke band, smoke-puff swap, explosion, blood, lightning,
// arrow volleys — and per-shot colour grading (shot.grade) that can fade in mid-shot (rain onset at 22:43.9).
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL, W = T.W, H = T.H;
  const step2 = (lt) => Math.floor(lt * 15); // "on twos" at 30 fps

  // One flame: 3 nested tongue silhouettes (edge / mid / core), redrawn from a new seed every 2 frames, no tweening.
  // `step` (frames per drawing, default 2) picks a new shape every `step` frames.
  T.drawFlame = (ctx, size, lt, seed = 'fl', step = 2) => {
    const k = (step === 2 ? step2(lt) : Math.floor(lt * 30 / step + 1e-6)) % 4, r = T.rng(T.hash(seed + ':' + k));
    const tongue = (scale, color) => {
      const n = 5, pts = [];
      for (let i = 0; i <= n; i++) {
        const x = (i / n - 0.5) * size * 0.8 * scale, top = i % 2 ? 0.55 : 1;
        pts.push([x, -size * scale * top * (0.75 + r() * 0.35)]);
        if (i < n) pts.push([x + (size * 0.8 * scale) / n / 2, -size * scale * (0.3 + r() * 0.2)]);
      }
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.moveTo(-size * 0.42 * scale, 0);
      pts.forEach(([x, y], i) => { const [px, py] = pts[i - 1] || [-size * 0.42 * scale, 0]; ctx.quadraticCurveTo(px, py, (px + x) / 2, (py + y) / 2); });
      ctx.quadraticCurveTo(size * 0.45 * scale, -size * 0.1 * scale, size * 0.42 * scale, 0);
      ctx.quadraticCurveTo(0, size * 0.12 * scale, -size * 0.42 * scale, 0); ctx.fill();
    };
    tongue(1, '#e0500a'); tongue(0.72, '#ff9a00'); tongue(0.42, '#ffd21a');
  };

  const FX = T.FX;

  // fire: { w, count, size, embers, glow, step }. step = frames per flame drawing (default 2; the reference boils a
  // large blaze every 4-6 frames and a furnace on threes): the tongues hold each shape for `step` frames.
  FX.fire = (ctx, L, lt) => {
    const n = L.count ?? 5, w = L.w ?? 600, s = L.size ?? 220, step = Math.max(1, Math.round(L.step ?? 2));
    if (L.glow !== false) { const g = ctx.createRadialGradient(0, -s * 0.3, 0, 0, -s * 0.3, w * 0.9); g.addColorStop(0, 'rgba(255,190,60,0.45)'); g.addColorStop(1, 'rgba(255,150,40,0)'); ctx.fillStyle = g; ctx.fillRect(-w, -s * 2, w * 2, s * 3); }
    const r = T.rng(T.hash((L.id ?? 'fire') + 'pos'));
    for (let i = 0; i < n; i++) { ctx.save(); ctx.translate((n === 1 ? 0 : i / (n - 1) - 0.5) * w, r() * 20); T.drawFlame(ctx, s * (0.7 + r() * 0.6), lt + i * 0.07, (L.id ?? 'fire') + i, step); ctx.restore(); }
    const er = T.rng(T.hash((L.id ?? 'fire') + 'emb'));
    ctx.fillStyle = '#ffd860';
    const a0 = ctx.globalAlpha;
    for (let i = 0; i < (L.embers ?? 18); i++) {
      const life = 1.4 + er() * 1.2, ph = ((lt + er() * life) % life) / life;
      const x = (er() - 0.5) * w + Math.sin(lt * 3 + i) * 20, y = -s * 0.5 - ph * s * 2.2;
      ctx.globalAlpha = a0 * (1 - ph); ctx.fillRect(x, y, 6, 6);
    }
    ctx.globalAlpha = a0;
  };

  // rain: full-frame two-layer vertical streaks. { density, angle, color }
  FX.rain = (ctx, L, lt) => {
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    const sc = ctx.canvas.width / W; ctx.scale(sc, sc);
    const n = L.density ?? 90, slant = (L.angle ?? 4) * T.DEG;
    for (const [layer, len, alpha, speed, wdt] of [[0, 60, 0.35, 1500, 2], [1, 30, 0.7, 2100, 3]]) {
      const r = T.rng(T.hash('rain' + layer));
      ctx.strokeStyle = `rgba(230,240,255,${alpha})`; ctx.lineWidth = wdt;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const x0 = r() * (W + 200) - 100, y = ((r() * (H + 200) + lt * speed) % (H + 200)) - 100;
        ctx.moveTo(x0 + Math.sin(slant) * y, y); ctx.lineTo(x0 + Math.sin(slant) * (y + len), y + len);
      }
      ctx.stroke();
    }
    ctx.restore();
  };

  // beam: diagonal light wedge from a corner that grows over ~10 frames and flickers. { from:'tl'|'tr', width, color }
  FX.beam = (ctx, L, lt) => {
    const grow = T.ease.outCubic(T.clamp(lt / 0.33)), fl = 1 + Math.sin(lt * 17) * 0.06;
    const fx = L.from === 'tr' ? W / 2 : -W / 2, dir = L.from === 'tr' ? -1 : 1;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha *= (L.strength ?? 0.28) * fl;
    const g = ctx.createLinearGradient(fx, -H / 2, fx + dir * W * 0.6, H / 2);
    g.addColorStop(0, L.color ?? '#fff6d0'); g.addColorStop(1, 'rgba(255,246,208,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(fx, -H / 2 - 40);
    const w = (L.width ?? 260) * grow, len = 2200 * grow;
    ctx.lineTo(fx + dir * (len * 0.6 + w), -H / 2 + len * 0.8); ctx.lineTo(fx + dir * (len * 0.6 - w), -H / 2 + len * 0.8 + w); ctx.closePath(); ctx.fill();
    ctx.restore();
  };

  // birds: V-flock of "m" shapes gliding across, wings flap on twos. { count, speed, dir, size }
  FX.birds = (ctx, L, lt) => {
    const n = L.count ?? 5, dir = L.dir ?? 1, sp = L.speed ?? 90, s = L.size ?? 26;
    ctx.strokeStyle = L.color ?? '#1d1410'; ctx.lineWidth = s * 0.22; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let i = 0; i < n; i++) {
      const row = Math.ceil(i / 2), side = i % 2 ? 1 : -1;
      const x = dir * lt * sp - dir * row * s * 2.2, y = side * row * s * 1.4 * (i ? 1 : 0) + Math.sin(lt * 2 + i) * 4;
      const flap = (step2(lt) + i) % 4 < 2 ? 0.55 : -0.15;
      ctx.beginPath(); ctx.moveTo(x - s, y - s * flap); ctx.quadraticCurveTo(x - s * 0.45, y - s * 0.55, x, y); ctx.quadraticCurveTo(x + s * 0.45, y - s * 0.55, x + s, y - s * flap); ctx.stroke();
    }
  };

  // smoke: drifting band of grey puffs. { w, color, rise }
  FX.smoke = (ctx, L, lt) => {
    const r = T.rng(T.hash(L.id ?? 'smoke')), w = L.w ?? 1400, a0 = ctx.globalAlpha;
    for (let i = 0; i < (L.count ?? 14); i++) {
      const life = 3 + r() * 2, ph = ((lt + r() * life) % life) / life, x = (r() - 0.5) * w + ph * 60, y = -ph * (L.rise ?? 220);
      ctx.globalAlpha = a0 * 0.55 * Math.sin(ph * Math.PI);
      ctx.fillStyle = L.color ?? '#8a8580'; ctx.beginPath(); ctx.arc(x, y, 60 + ph * 90 + r() * 30, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = a0;
  };

  // puff: cream cloud that covers a character swap for ~4 frames (reference 35:37). Put it at the swap time.
  FX.puff = (ctx, L, lt) => {
    const p = T.clamp(lt / 0.45), r = T.rng(T.hash(L.id ?? 'puff')), s = L.size ?? 260;
    ctx.globalAlpha *= p < 0.3 ? 1 : 1 - (p - 0.3) / 0.7;
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + r(), d = s * (0.2 + p * 0.5), rad = s * (0.28 + r() * 0.16) * (0.6 + p * 0.6);
      T.outlined(ctx, (k) => k.arc(Math.cos(a) * d, Math.sin(a) * d * 0.7, rad, 0, Math.PI * 2), L.color ?? '#efe2c8', { line: 6 });
    }
  };

  // explosion: orange starburst + debris particles, ~0.6 s.
  FX.explosion = (ctx, L, lt) => {
    const p = T.clamp(lt / 0.6), s = (L.size ?? 320) * T.ease.outBack(Math.min(1, p * 2.5)), r = T.rng(T.hash(L.id ?? 'boom'));
    ctx.globalAlpha *= 1 - T.ease.in(p);
    const star = (rad, col, n = 12) => { ctx.fillStyle = col; ctx.beginPath(); for (let i = 0; i <= n * 2; i++) { const a = (i / (n * 2)) * Math.PI * 2, rr = i % 2 ? rad * 0.55 : rad * (0.9 + r() * 0.2); ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.fill(); };
    star(s, '#e0500a'); star(s * 0.7, '#ff9a00'); star(s * 0.42, '#ffe066');
    ctx.fillStyle = L.debris ?? '#5a4a30';
    for (let i = 0; i < 16; i++) { const a = r() * Math.PI * 2, d = s * 0.4 + p * (300 + r() * 300); ctx.fillRect(Math.cos(a) * d, Math.sin(a) * d + p * p * 200, 12, 12); }
  };

  // blood: irregular dark-red pool (flat, under bodies) or splat. { w, shape:'pool'|'splat' } (kind is always 'blood')
  FX.blood = (ctx, L, lt) => {
    const p = T.ease.outCubic(T.clamp(lt / (L.dur ?? 0.8))), w = (L.w ?? 220) * (L.shape === 'splat' ? 1 : p);
    const pts = T.blobPts(0, 0, w, w * (L.shape === 'splat' ? 0.7 : 0.28), (L.id ?? 'blood'), 18, 0.3);
    T.outlined(ctx, (k) => T.smoothPath(k, pts), '#8a0f12', { line: 0 });
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.ellipse(-w * 0.3, -w * 0.06, w * 0.18, w * 0.04, 0, 0, Math.PI * 2); ctx.fill();
  };

  // lightning: jagged bolts that re-randomize every 2 frames. { h, count, color }
  FX.lightning = (ctx, L, lt) => {
    const r = T.rng(T.hash((L.id ?? 'zap') + step2(lt))), h = L.h ?? 500;
    ctx.strokeStyle = L.color ?? '#fff7a0'; ctx.lineWidth = 12; ctx.lineJoin = 'miter'; ctx.shadowColor = '#bff4ff'; ctx.shadowBlur = (30) * T.DPR;
    for (let b = 0; b < (L.count ?? 2); b++) {
      ctx.beginPath(); let x = (r() - 0.5) * 200, y = -h / 2; ctx.moveTo(x, y);
      while (y < h / 2) { x += (r() - 0.5) * 110; y += 40 + r() * 50; ctx.lineTo(x, y); }
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  };

  // arrows: volley crossing the frame horizontally in ~5 frames each. { count, dir, every }
  FX.arrows = (ctx, L, lt) => {
    const dir = L.dir ?? 1;
    for (let i = 0; i < (L.count ?? 6); i++) {
      const ri = T.rng(T.hash((L.id ?? 'arrows') + ':' + i)); // per-arrow stream: independent of which arrows are on screen
      const t0 = i * (L.every ?? 0.18) + ri() * 0.1, yy = (ri() - 0.5) * H * 0.6, p = (lt - t0) / 0.17;
      if (p < 0 || p > 1) continue;
      const x = dir * (-W * 0.7 + p * W * 1.4), y = yy;
      ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1);
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-220, 0); ctx.lineTo(-60, 0); ctx.stroke();
      ctx.strokeStyle = P.ink; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-70, 0); ctx.lineTo(40, 0); ctx.stroke();
      ctx.fillStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(56, 0); ctx.lineTo(34, -10); ctx.lineTo(34, 10); ctx.fill();
      ctx.restore();
    }
  };

  // ---------- per-shot colour grade ----------
  // shot.grade = "preset" | { preset, at, dur, strength, out, outDur, target } | [ entry, entry, ... ] (applied in order).
  // target "bg" entries are applied by T.gradeBg right after the backgrounds; all others by T.grade inside T.post.
  // Presets are op lists [op, color, alpha, arg]: op = a canvas composite mode | 'vignette' | 'bloom' | 'pixel'
  // ('pixel' runs T.GRADE_PIXEL[color](data, k, arg, w, h) over the physical pixels).
  const GRADES = {
    serious: [['saturation', '#808080', 0.3], ['multiply', '#9fb2aa'], ['soft-light', '#1d4a4a', 0.6]], // Teutoburg: desaturated teal-green
    storm: [['saturation', '#808080', 0.35], ['multiply', '#a3b0b5']],
    night: [['multiply', '#7f8fc0'], ['soft-light', '#10204a', 0.5]],
    solemn: [['saturation', '#808080', 0.55], ['multiply', '#b8a898']], // grey-brown dusty (crucifixion hill)
    warm: [['soft-light', '#ff9a50'], ['multiply', '#fff0dc']],
    gold: [['soft-light', '#ffd070'], ['screen', '#2a1600']],
    // reference library: memory / horror / grief / myth
    sepia: [['saturation', '#808080', 0.85], ['multiply', '#d9b07a'], ['soft-light', '#5a3410', 0.5], ['vignette', '#3b2410', 0.55]],
    horror: [['saturation', '#808080', 0.3], ['multiply', '#d49a96'], ['soft-light', '#2a0f12', 0.45], ['vignette', '#050202', 0.6]],
    cold: [['saturation', '#808080', 0.6], ['multiply', '#9aa6b4'], ['soft-light', '#1c2433', 0.4]],
    divine: [['bloom', '#fffbe6', 0.55], ['soft-light', '#fff2c0', 0.4]],
    'mono-red': [['pixel', 'mono-red']], // grayscale world, only blood / roses keep their red
  };
  T.GRADE_PRESETS = GRADES; // mutable: later modules add presets here
  Object.defineProperty(T, 'GRADES', { get: () => Object.keys(T.GRADE_PRESETS), enumerable: true, configurable: true });

  const hexRgb = (hex) => {
    const h = String(hex).replace('#', ''), f = h.length === 3 ? h.split('').map((ch) => ch + ch).join('') : h;
    const n = parseInt(f.slice(0, 6), 16);
    if (!Number.isFinite(n)) throw new Error('GRADE_PIXEL: bad colour ' + hex);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  // Pixel grades: fn(data, k, arg, w, h) edits RGBA bytes in place; k = 0..1 strength. Integer maths only (deterministic).
  T.GRADE_PIXEL = {
    // Keep strong reds, desaturate everything else by k (one pass over the physical pixels, ~20 ms at 1080p).
    'mono-red': (d, k) => {
      const kk = Math.round(k * 256);
      for (let i = 0, n = d.length; i < n; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        if (r > 90 && r * 10 > g * 17 && r * 10 > b * 17) continue;
        const y = (r * 77 + g * 150 + b * 29) >> 8;
        d[i] = r + (((y - r) * kk) >> 8); d[i + 1] = g + (((y - g) * kk) >> 8); d[i + 2] = b + (((y - b) * kk) >> 8);
      }
    },
    // Luminance -> 3-stop ramp [shadow, mid, highlight] (hex), blended over the image by k.
    ramp3: (d, k, stops) => {
      if (!Array.isArray(stops) || stops.length !== 3) throw new Error('GRADE_PIXEL.ramp3 needs [shadow, mid, highlight]');
      const [s0, s1, s2] = stops.map(hexRgb), kk = Math.round(k * 256), lut = new Uint8Array(768);
      for (let y = 0; y < 256; y++) {
        const [a, b, t] = y < 128 ? [s0, s1, y * 2] : [s1, s2, (y - 128) * 2];
        for (let c = 0; c < 3; c++) lut[y * 3 + c] = a[c] + (((b[c] - a[c]) * t) >> 8);
      }
      for (let i = 0, n = d.length; i < n; i += 4) {
        const y = (d[i] * 77 + d[i + 1] * 150 + d[i + 2] * 29) >> 8;
        for (let c = 0; c < 3; c++) d[i + c] += ((lut[y * 3 + c] - d[i + c]) * kk) >> 8;
      }
    },
  };

  function gradeOp(ctx, op, color, a, k, arg) {
    if (op === 'pixel') {
      const fn = T.GRADE_PIXEL[color];
      if (!fn) throw new Error('Unknown pixel grade: ' + color);
      const kk = k * a;
      T.pixels(ctx, (d, w, h) => fn(d, kk, arg, w, h));
      return;
    }
    if (op === 'vignette') {
      const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.95);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, color);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = a * k; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); return;
    }
    if (op === 'bloom') {
      const g = ctx.createRadialGradient(W / 2, H * 0.45, 0, W / 2, H * 0.45, H * 0.9);
      g.addColorStop(0, color); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = a * k; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); return;
    }
    ctx.globalCompositeOperation = op; ctx.globalAlpha = a * k; ctx.fillStyle = color; ctx.fillRect(0, 0, W, H);
  }

  const GRADE_TARGETS = ['frame', 'bg'];
  const strengthAt = (v, lt) => (Array.isArray(v) ? (T.num ? T.num(v, lt) : Number(v[0]?.v ?? 1)) : v ?? 1);
  function applyGrade(ctx, g, lt) {
    const name = typeof g === 'string' ? g : g.preset;
    const ops = T.GRADE_PRESETS[name];
    if (!ops) throw new Error('Unknown grade preset: ' + name);
    const p = typeof g === 'string' ? 1 : T.ease.inOut(T.prog(lt, g.at ?? 0, g.dur ?? 0.001));
    const q = typeof g === 'string' || g.out == null ? 1 : 1 - T.ease.inOut(T.prog(lt, g.out, g.outDur ?? g.dur ?? 0.001));
    const k = p * q * (typeof g === 'string' ? 1 : strengthAt(g.strength, lt));
    if (k <= 0) return;
    ctx.save();
    for (const [op, color, a = 1, arg] of ops) gradeOp(ctx, op, color, a, k, arg);
    ctx.restore();
  }
  const targetOf = (g) => {
    const t = (typeof g === 'object' && g && g.target) || 'frame';
    if (!GRADE_TARGETS.includes(t)) throw new Error(`Unknown grade target "${t}" (use "frame" or "bg")`);
    return t;
  };
  function gradePass(ctx, grade, lt, target) {
    if (!grade) return;
    for (const g of Array.isArray(grade) ? grade : [grade]) if (g && targetOf(g) === target) applyGrade(ctx, g, lt);
  }
  // Whole-frame grade, called from T.post (paint.js).
  T.grade = (ctx, lt, env) => gradePass(ctx, env.shot && env.shot.grade, lt, 'frame');
  // Background-only grade: call right after the shot backgrounds are drawn, before the layers.
  T.gradeBg = (ctx, shot, lt, env) => gradePass(ctx, shot && shot.grade, lt, 'bg');
})();
