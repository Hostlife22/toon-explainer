// places-sets.js — backgrounds: `mood` backdrops (ray bursts, swirl, vortex, smoke, bokeh, splat, grunge,
// streaks, action, nebula, ornament, collage), `palace` throne halls, `burning` city / inferno plain and `studio` sets.
// Shared helpers are exported as T.PLACE for places-rooms.js. Planes: sky 0.15, far 0.3-0.45, mid 0.6-0.8, ground/walls 1,
// foreground 1.2-1.3. Detail lines are thinner and lighter than the 5-6 px character ink; one key light upper-left.
(function () {
  'use strict';
  const T = window.TOON, W = T.W, H = T.H, OV = 320, DEG = Math.PI / 180, TAU = Math.PI * 2;
  const BINK = '#3a281c', DET = '#5a4030';
  const step2 = (lt) => Math.floor(lt * 15); // boil / flicker on twos at 30 fps

  // ---------- shared helpers (T.PLACE) ----------
  const cam = (ctx, env, f, fn) => { ctx.save(); T.applyCam(ctx, env.cam, f); fn(); ctx.restore(); };
  const full = (ctx, fill) => { ctx.fillStyle = fill; ctx.fillRect(-OV, -OV, W + OV * 2, H + OV * 2); };
  const vgrad = (ctx, y0, y1, stops) => {
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    stops.forEach((c, i) => g.addColorStop(i / Math.max(1, stops.length - 1), c));
    return g;
  };
  const rgba = (hex, a) => { const n = parseInt(T.hex6(hex).slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
  const glow = (ctx, x, y, r, hex, a) => {
    if (r <= 0) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(hex, a)); g.addColorStop(1, rgba(hex, 0));
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };
  // Screen-space edge darkening (k = 0..1).
  const vignette = (ctx, k = 0.35, hex = '#000000') => {
    if (k <= 0) return;
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.32, W / 2, H / 2, W * 0.72);
    g.addColorStop(0, rgba(hex, 0)); g.addColorStop(1, rgba(hex, Math.min(1, k)));
    ctx.fillStyle = g; ctx.fillRect(-OV, -OV, W + OV * 2, H + OV * 2);
  };
  // Diagonal key-light wedge from the upper-left (white 6-10 %) and its matching shadow wedge.
  const wedge = (ctx, x0, w, y1, hex = '#ffffff', a = 0.08, slant = 0.55) => {
    ctx.fillStyle = rgba(hex, a);
    ctx.beginPath(); ctx.moveTo(x0, -OV); ctx.lineTo(x0 + w, -OV); ctx.lineTo(x0 + w + (y1 + OV) * slant, y1); ctx.lineTo(x0 + (y1 + OV) * slant, y1); ctx.closePath(); ctx.fill();
  };
  const soft = (ctx, env, px, fn) => (px > 0.3 ? T.filtered(ctx, `blur(${(px * (env.dpr || 1)).toFixed(2)}px)`, fn) : fn(ctx));
  const ol = (ctx, path, fill, o = {}) => T.outlined(ctx, path, fill, { line: o.line ?? 4, ink: o.ink ?? BINK, shade: o.shade ?? null });
  const variantOf = (bg, list, def, kind) => {
    const v = bg.variant ?? def;
    if (!list.includes(v)) throw new Error(`bg ${kind}: unknown variant "${v}" (known: ${list.join(', ')})`);
    return v;
  };
  const seedOf = (env, kind, bg) => (env.seed || 1) + ':' + kind + ':' + (bg.seed ?? '');
  const lum = (hex) => { const n = parseInt(T.hex6(hex).slice(1), 16); return 0.3 * (n >> 16) + 0.59 * ((n >> 8) & 255) + 0.11 * (n & 255); };
  const xy = (v, def) => (Array.isArray(v) && v.length === 2 ? [v[0] * W, v[1] * H] : [def[0] * W, def[1] * H]);
  const flick = (lt, seed, amt = 0.08) => 1 + T.noise(step2(lt) * 0.9, seed) * amt;
  // Perspective floor: rows x cols quads converging to vx; colorFn(row, col) -> fill (null = skip).
  const perspFloor = (ctx, y0, y1, vx, rows, cols, colorFn, line = 2, spread = [90, 300]) => {
    for (let row = 0; row < rows; row++) for (let col = -cols; col < cols; col++) {
      const f0 = row / rows, f1 = (row + 1) / rows, ya = y0 + Math.pow(f0, 1.35) * (y1 - y0), yb = y0 + Math.pow(f1, 1.35) * (y1 - y0);
      const s0 = spread[0] + f0 * spread[1], s1 = spread[0] + f1 * spread[1], c = colorFn(row, col);
      if (!c) continue;
      ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(vx + col * s0, ya); ctx.lineTo(vx + (col + 1) * s0, ya); ctx.lineTo(vx + (col + 1) * s1, yb); ctx.lineTo(vx + col * s1, yb); ctx.closePath(); ctx.fill();
      if (line) { ctx.strokeStyle = rgba(DET, 0.55); ctx.lineWidth = line; ctx.stroke(); }
    }
  };
  // Seeded flame tongue row (no tween: heights re-seed on twos).
  const tongues = (ctx, x0, x1, y, o) => {
    const r = T.rng(T.hash(o.seed)), b = T.rng(T.hash(o.seed + ':' + step2(o.lt)));
    for (let x = x0; x < x1;) {
      const w = o.w[0] + r() * (o.w[1] - o.w[0]), h = (o.h[0] + r() * (o.h[1] - o.h[0])) * (0.82 + b() * 0.3), lean = (b() - 0.5) * w * 0.6;
      const cx = x + w / 2;
      ctx.fillStyle = o.color; ctx.beginPath(); ctx.moveTo(x - 4, y);
      ctx.quadraticCurveTo(x + w * 0.05, y - h * 0.55, cx + lean, y - h); ctx.quadraticCurveTo(x + w * 0.95, y - h * 0.5, x + w + 4, y); ctx.closePath(); ctx.fill();
      if (o.edge) { ctx.strokeStyle = o.edge; ctx.lineWidth = 2.5; ctx.stroke(); }
      x += w * (o.gap ?? 0.62);
    }
  };
  const textBlock = (ctx, text, x, y, size, color = '#2a1c15', weight = 900, align = 'center') => {
    ctx.save(); ctx.font = T.font(size, weight); ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(String(text), x, y); ctx.restore();
  };
  // A shot drawn into a rect (screens, TVs) when `src` names a shot; otherwise centred text. Returns true if drawn.
  const screenContent = (ctx, src, x, y, w, h, lt, env, o = {}) => {
    if (src == null || src === false) return false;
    const id = typeof src === 'object' ? src.shot : src;
    const shots = (env.spec && env.spec.shots) || [];
    if (id && shots.some((s) => s.id === id) && T.subShot) {
      const c = T.subShot(id, typeof src === 'object' && src.t != null ? src.t : lt, env, { grade: false });
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
      const sc = Math.max(w / W, h / H); ctx.drawImage(c, x + (w - W * sc) / 2, y + (h - H * sc) / 2, W * sc, H * sc); ctx.restore();
      return true;
    }
    const text = typeof src === 'object' ? src.text : src;
    if (text) textBlock(ctx, text, x + w / 2, y + h / 2, Math.min(h * 0.32, T.fitSize(ctx, String(text), h * 0.32, w * 0.86)), o.color ?? '#2a1c15');
    return true;
  };
  // Foreground plane of a background (benches, desks, bars, balustrades) redrawn OVER the characters by the fg layer
  // kind "bg-front" ({"type": "fg", "kind": "bg-front"}): bgs are always painted before layers, so a figure standing
  // behind a bench needs this second pass. The bg draws the same plane itself, so shots without the fg still look whole.
  T.BG_FRONT = T.BG_FRONT || {};
  T.FG['bg-front'] = (ctx, L, lt, env) => {
    const bgs = Array.isArray(env.shot && env.shot.bg) ? env.shot.bg : [env.shot && env.shot.bg].filter(Boolean);
    ctx.save(); ctx.setTransform(env.dpr || 1, 0, 0, env.dpr || 1, 0, 0); // full-frame: the front plane applies its own parallax
    for (const bg of bgs) { const fn = T.BG_FRONT[bg.kind]; if (fn) fn(ctx, bg, env.lt ?? lt, env); }
    ctx.restore();
  };
  T.PLACE = { OV, BINK, DET, step2, cam, full, vgrad, rgba, glow, vignette, wedge, soft, ol, variantOf, seedOf, lum, xy, flick, perspFloor, tongues, textBlock, screenContent };

  // ---------- mood backdrops ----------
  const RAY_PRESETS = {
    gold: ['#f6c341', '#e9a51e'], green: ['#5fe0a8', '#1d8a64'], blue: ['#58b8ff', '#1550a8'], purple: ['#c58ae6', '#5a2a78'],
    yellow: ['#ffe24a', '#ffb800'], crimson: ['#c0103a', '#7a0020'], cyan: ['#e8f8ff', '#2a8aa8'], lime: ['#f5f8a0', '#5f8a2a'],
  };
  const RAINBOW = ['#ff5a5a', '#ffb43a', '#ffe94a', '#5fe07a', '#4aa8ff', '#a86aff'];
  const wedgePath = (k, cx, cy, a0, a1, len = 2800) => { k.moveTo(cx, cy); k.lineTo(cx + Math.cos(a0) * len, cy + Math.sin(a0) * len); k.lineTo(cx + Math.cos(a1) * len, cy + Math.sin(a1) * len); k.closePath(); };

  const MOOD = {};
  MOOD.rays = (ctx, bg, lt, env) => {
    const pre = bg.preset ?? 'gold', n = Math.max(6, Math.round(bg.rays ?? 28)) & ~1;
    if (pre !== 'split' && pre !== 'rainbow' && !RAY_PRESETS[pre]) throw new Error(`mood rays: unknown preset "${pre}" (known: ${Object.keys(RAY_PRESETS).join(', ')}, split, rainbow)`);
    const [cx, cy] = xy(bg.center, [0.5, 0.5]), rot = (bg.spin ?? 4) * lt * DEG, step = TAU / n;
    const pair = bg.colors ?? RAY_PRESETS[pre] ?? ['#ffffff', '#2a2a2a'];
    const [light, dark] = lum(pair[0]) >= lum(pair[1]) ? pair : [pair[1], pair[0]];
    cam(ctx, env, 0.3, () => {
      if (pre === 'split') {
        const g = ctx.createLinearGradient(cx - 20, 0, cx + 20, 0); g.addColorStop(0, '#2a6ad0'); g.addColorStop(1, '#d0283a');
        ctx.fillStyle = g; ctx.fillRect(-OV, -OV, W + OV * 2, H + OV * 2);
      } else full(ctx, pre === 'rainbow' ? '#3a2a5a' : dark);
      soft(ctx, env, bg.soft ?? 6, (g) => {
        for (let i = 0; i < n; i++) {
          if (pre !== 'rainbow' && i % 2) continue;
          g.fillStyle = pre === 'rainbow' ? (i % 2 ? T.shade(RAINBOW[(i >> 1) % 6], -0.18) : RAINBOW[(i >> 1) % 6]) : pre === 'split' ? 'rgba(255,255,255,0.22)' : light;
          g.beginPath(); wedgePath(g, cx, cy, rot + i * step, rot + (i + 1) * step); g.fill();
        }
      });
      const pulse = bg.pulse ? 1 + 0.06 * Math.sin(lt * TAU) : 1;
      glow(ctx, cx, cy, (bg.bloom ?? 0.15) * W * pulse * 1.6, '#ffffff', 0.9);
    });
    vignette(ctx, bg.vignette ?? 0.35, T.shade(dark, -0.5));
  };

  // Log-spiral ribbon points around (cx, cy).
  const spiral = (cx, cy, a0, turns, r0, r1, n = 40) => {
    const pts = [];
    for (let i = 0; i <= n; i++) { const t = i / n, a = a0 + t * turns * TAU, r = r0 * Math.pow(r1 / r0, t); pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
    return pts;
  };
  const strokePts = (k, pts) => { k.beginPath(); pts.forEach(([x, y], i) => (i ? k.lineTo(x, y) : k.moveTo(x, y))); k.stroke(); };
  MOOD.swirl = (ctx, bg, lt, env) => {
    const [a, b] = bg.colors ?? ['#5fb6cf', '#2b6d86'], [cx, cy] = xy(bg.center, [0.5, 0.5]), seed = seedOf(env, 'swirl', bg);
    const r = T.rng(T.hash(seed)), bands = 7, widths = Array.from({ length: bands }, () => 160 + r() * 100);
    cam(ctx, env, 0.3, () => {
      full(ctx, b);
      soft(ctx, env, bg.soft ?? 12, (g) => {
        g.lineCap = 'round';
        for (let i = 0; i < bands; i++) {
          g.strokeStyle = i % 3 === 0 ? a : i % 3 === 1 ? T.mix(a, b, 0.45) : T.mix(a, '#ffffff', 0.28);
          g.lineWidth = widths[i];
          strokePts(g, spiral(cx, cy, (bg.spin ?? 4) * lt * DEG + (i / bands) * TAU, 0.9, 60, 1700));
        }
      });
      glow(ctx, cx, cy, 380, T.mix(a, '#ffffff', 0.5), 0.45);
    });
    vignette(ctx, bg.vignette ?? 0.5, T.shade(b, -0.6));
  };
  MOOD.vortex = (ctx, bg, lt, env) => {
    const c0 = bg.center ?? '#8c5ad0', c1 = bg.edge ?? '#2c1c5a', [cx, cy] = xy(bg.at, [0.5, 0.5]);
    cam(ctx, env, 0.3, () => {
      const g0 = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.75); g0.addColorStop(0, T.mix(c0, '#ffffff', 0.2)); g0.addColorStop(0.45, c0); g0.addColorStop(1, c1);
      ctx.fillStyle = g0; ctx.fillRect(-OV, -OV, W + OV * 2, H + OV * 2);
      soft(ctx, env, 18, (g) => {
        g.lineCap = 'round'; g.strokeStyle = rgba(T.mix(c0, '#ffffff', 0.45), 0.25);
        for (let i = 0; i < 5; i++) { g.lineWidth = 120 - i * 10; strokePts(g, spiral(cx, cy, (bg.spin ?? 4) * lt * DEG + (i / 5) * TAU, 1.1, 40, 1500)); }
      });
    });
    vignette(ctx, bg.vignette ?? 0.45, T.shade(c1, -0.5));
  };
  MOOD.smoke = (ctx, bg, lt, env) => {
    const c = bg.color ?? '#3a5aa8', seed = seedOf(env, 'smoke', bg), r = T.rng(T.hash(seed));
    const blobs = Array.from({ length: 16 }, (_, i) => ({ x: r() * W, y: r() * H, rad: 160 + r() * 260, dark: i >= 12, k: 0.12 + r() * 0.2 }));
    cam(ctx, env, 0.3, () => {
      full(ctx, c);
      soft(ctx, env, 20, (g) => blobs.forEach((bl, i) => {
        const dx = T.noise(lt * 0.15 + i, seed + 'x') * 60 + lt * 12, dy = T.noise(lt * 0.15 + i, seed + 'y') * 40;
        g.fillStyle = bl.dark ? T.shade(c, -0.3) : T.mix(c, '#ffffff', bl.k);
        g.beginPath(); g.arc(bl.x + dx, bl.y + dy, bl.rad, 0, TAU); g.fill();
      }));
    });
    vignette(ctx, bg.vignette ?? 0.45);
  };
  MOOD.bokeh = (ctx, bg, lt, env) => {
    const seed = seedOf(env, 'bokeh', bg), r = T.rng(T.hash(seed)), n = bg.count ?? 14;
    const discs = Array.from({ length: n }, () => ({ x: r() * (W + 200) - 100, y: r() * (H + 240), rad: 30 + r() * 80, a: 0.1 + r() * 0.15 }));
    cam(ctx, env, 0.3, () => {
      ctx.fillStyle = vgrad(ctx, -OV, H + OV, [bg.from ?? '#c86bd8', bg.to ?? '#f5d6f5']); ctx.fillRect(-OV, -OV, W + OV * 2, H + OV * 2);
      soft(ctx, env, 8, (g) => discs.forEach((d) => {
        const y = ((d.y - lt * 6) % (H + 240) + H + 240) % (H + 240) - 120;
        g.fillStyle = `rgba(255,255,255,${d.a})`; g.beginPath(); g.arc(d.x, y, d.rad, 0, TAU); g.fill();
        g.strokeStyle = `rgba(255,255,255,${d.a})`; g.lineWidth = 5; g.stroke();
      }));
    });
    if (bg.petals) {
      const p = T.rng(T.hash(seed + 'p'));
      for (let i = 0; i < 26; i++) {
        const x0 = p() * (W + 400) - 200, y0 = p() * (H + 200), v = 30 + p() * 20, s = 8 + p() * 12, ph = p() * TAU;
        const x = ((x0 + lt * v) % (W + 400) + W + 400) % (W + 400) - 200 + Math.sin(lt * Math.PI + ph) * 15;
        const y = ((y0 + lt * v * 0.8) % (H + 200)) - 100;
        ctx.fillStyle = i % 3 ? 'rgba(247,168,200,0.55)' : 'rgba(255,214,228,0.6)';
        ctx.beginPath(); ctx.ellipse(x, y, s, s * 0.7, ph + lt, 0, TAU); ctx.fill();
      }
    }
    vignette(ctx, bg.vignette ?? 0.2, '#5a2050');
  };
  MOOD.splat = (ctx, bg, lt, env) => {
    const cols = bg.colors ?? ['#f39aa0', '#f6c26b', '#ffd9e0'], seed = seedOf(env, 'splat', bg), r = T.rng(T.hash(seed));
    const splats = Array.from({ length: bg.count ?? 20 }, (_, i) => {
      const x = r() * (W + 200) - 100, y = r() * (H + 100) - 50, rad = 40 + r() * 110, c = cols[i % cols.length];
      const sats = Array.from({ length: 6 + Math.floor(r() * 5) }, () => { const a = r() * TAU, d = rad * (1.1 + r() * 0.8); return [x + Math.cos(a) * d, y + Math.sin(a) * d, rad * (0.08 + r() * 0.2)]; });
      const drips = Array.from({ length: 2 + Math.floor(r() * 2) }, () => [x + (r() - 0.5) * rad * 1.2, rad * (0.8 + r() * 1.4), 6 + r() * 10]);
      return { pts: T.blobPts(x, y, rad, rad * (0.8 + r() * 0.3), seed + i, 16, 0.22), sats, drips, x, y, c };
    });
    cam(ctx, env, 0.3, () => {
      full(ctx, bg.base ?? '#fbf3d8');
      for (const s of splats) {
        ctx.fillStyle = s.c; ctx.beginPath(); T.smoothPath(ctx, s.pts); ctx.fill();
        for (const [x, y, rr] of s.sats) { ctx.beginPath(); ctx.arc(x, y, rr, 0, TAU); ctx.fill(); }
        for (const [x, len, w] of s.drips) { ctx.beginPath(); T.rrect(ctx, x - w / 2, s.y, w, len, w / 2); ctx.fill(); ctx.beginPath(); ctx.arc(x, s.y + len, w * 0.8, 0, TAU); ctx.fill(); }
      }
    });
    vignette(ctx, bg.vignette ?? 0.12, '#8a5a3a');
  };
  MOOD.grunge = (ctx, bg, lt, env) => {
    const c = bg.color ?? '#e0502a', dark = bg.dark ?? '#7a2010', seed = seedOf(env, 'grunge', bg), r = T.rng(T.hash(seed));
    cam(ctx, env, 0.3, () => {
      full(ctx, c);
      glow(ctx, W * 0.42, H * 0.4, W * 0.55, T.mix(c, '#ffffff', 0.35), 0.8);
      soft(ctx, env, 14, (g) => { for (let i = 0; i < 9; i++) { g.fillStyle = rgba(dark, 0.22); g.beginPath(); g.arc(r() * W, r() * H, 60 + r() * 160, 0, TAU); g.fill(); } });
      ctx.fillStyle = rgba(dark, 0.3);
      for (let i = 0; i < 300; i++) { const s = 2 + r() * 4; ctx.beginPath(); ctx.arc(r() * (W + 200) - 100, r() * (H + 200) - 100, s, 0, TAU); ctx.fill(); }
      ctx.fillStyle = rgba(dark, 0.55);
      for (let i = 0; i < 26; i++) { const x = r() * W, y = r() * H; ctx.beginPath(); T.smoothPath(ctx, T.blobPts(x, y, 6 + r() * 10, 5 + r() * 8, seed + 'b' + i, 7, 0.4)); ctx.fill(); }
    });
    vignette(ctx, bg.vignette ?? 0.6, T.shade(dark, -0.5));
  };
  MOOD.streaks = (ctx, bg, lt, env) => {
    const cols = bg.colors ?? ['#b8202a', '#7a1018', '#8fc59a'], seed = seedOf(env, 'streaks', bg), r = T.rng(T.hash(seed));
    const base = cols.reduce((m, c) => (lum(c) < lum(m) ? c : m), cols[0]), rest = cols.filter((c) => c !== base);
    const span = W + OV * 2 + 900, dir = bg.dir ?? -1, v = bg.speed ?? 60;
    const bars = Array.from({ length: 52 }, () => ({ y: r() * (H + 200) - 100, h: 8 + r() * 22, len: 200 + r() * 700, x: r() * span, c: rest.length ? rest[Math.floor(r() * rest.length)] : T.mix(base, '#ffffff', 0.3), sp: 0.6 + r() * 0.8, a: 0.55 + r() * 0.45 }));
    cam(ctx, env, 0.3, () => {
      full(ctx, base);
      ctx.fillStyle = vgrad(ctx, 0, H, [rgba('#000000', 0), rgba('#000000', 0.25)]); ctx.fillRect(-OV, -OV, W + OV * 2, H + OV * 2);
      for (const b of bars) {
        const x = (((b.x + dir * v * b.sp * lt) % span) + span) % span - OV - 900;
        ctx.globalAlpha = b.a; ctx.fillStyle = b.c; ctx.beginPath(); T.rrect(ctx, x, b.y, b.len, b.h, b.h / 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    });
    vignette(ctx, bg.vignette ?? 0.4);
  };
  MOOD.action = (ctx, bg, lt, env) => {
    const base = bg.base ?? '#3a2a28', seed = seedOf(env, 'action', bg), r = T.rng(T.hash(seed)), boil = T.rng(T.hash(seed + ':' + step2(lt)));
    const puffs = Array.from({ length: 7 }, (_, i) => [(-0.05 + i * 0.18 + r() * 0.06) * W, H * (0.5 + (r() - 0.5) * 0.16), 190 + r() * 120]);
    cam(ctx, env, 0.4, () => {
      full(ctx, base);
      ctx.fillStyle = T.shade(base, 0.2); ctx.fillRect(-OV, H * 0.24, W + OV * 2, H * 0.52);
      const rs = puffs.map(() => 0.94 + boil() * 0.12);
      for (const [layer, col, dy] of [[0, '#e2781a', 26], [1, '#f6a623', 0], [2, '#ffd34d', -40]]) {
        ctx.fillStyle = col;
        puffs.forEach(([x, y, rad], i) => { ctx.beginPath(); ctx.arc(x + (layer === 2 ? -rad * 0.18 : 0), y + dy, rad * rs[i] * (layer === 2 ? 0.55 : 1), 0, TAU); ctx.fill(); });
      }
      const bolt = T.rng(T.hash(seed + 'bolt' + Math.floor(lt * 10))); // re-seed every 3 frames
      for (let i = 0; i < 8; i++) {
        let x = bolt() * W, y = H * (0.2 + bolt() * 0.6); const a = bolt() * TAU, len = 120 + bolt() * 120, pts = [[x, y]];
        for (let s = 0; s < 3; s++) { x += Math.cos(a + (s % 2 ? 0.9 : -0.9)) * len * 0.5; y += Math.sin(a + (s % 2 ? 0.9 : -0.9)) * len * 0.5; pts.push([x, y]); }
        ctx.lineJoin = 'miter'; ctx.lineCap = 'butt';
        ctx.strokeStyle = BINK; ctx.lineWidth = 24; strokePts(ctx, pts);
        ctx.strokeStyle = '#ffe14a'; ctx.lineWidth = 14; strokePts(ctx, pts);
      }
    });
    vignette(ctx, bg.vignette ?? 0.35);
  };
  const sparkle = (ctx, x, y, s) => { ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU, rr = i % 2 ? s * 0.22 : s; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); };
  MOOD.nebula = (ctx, bg, lt, env) => {
    const [c0, c1] = bg.colors ?? ['#7a2a7a', '#e0a0e0'], seed = seedOf(env, 'nebula', bg), r = T.rng(T.hash(seed));
    const blobs = Array.from({ length: 8 }, () => [r() * W, r() * H, 200 + r() * 260, r()]);
    const stars = Array.from({ length: bg.stars ?? 8 }, () => [r() * W, r() * H * 0.95, 14 + r() * 18, 1.2 + r() * 1.6, r() * 3]);
    cam(ctx, env, 0.3, () => {
      const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, c0); g.addColorStop(0.55, T.mix(c0, c1, 0.6)); g.addColorStop(1, c0);
      ctx.fillStyle = g; ctx.fillRect(-OV, -OV, W + OV * 2, H + OV * 2);
      soft(ctx, env, 40, (k) => blobs.forEach(([x, y, rad, t]) => { k.fillStyle = rgba(t > 0.4 ? c1 : T.shade(c0, -0.3), 0.45); k.beginPath(); k.arc(x, y, rad, 0, TAU); k.fill(); }));
      ctx.fillStyle = '#fffaf0';
      for (const [x, y, s, per, ph] of stars) {
        const u = ((lt + ph) % per), tw = u < 0.2 ? Math.sin((u / 0.2) * Math.PI) : 0; // 6-frame twinkle
        sparkle(ctx, x, y, s * (0.55 + tw * 0.75));
      }
    });
    vignette(ctx, bg.vignette ?? 0.3, T.shade(c0, -0.6));
  };
  MOOD.ornament = (ctx, bg, lt, env) => {
    const [c0, c1, c2] = bg.colors ?? ['#e8a33a', '#c86a1c', '#c0305a'], t = T.clamp(bg.tile ?? 96, 48, 200);
    cam(ctx, env, 0.5, () => {
      full(ctx, c1);
      ctx.lineWidth = 2;
      for (let y = -OV; y < H + OV; y += t) for (let x = -OV; x < W + OV; x += t) {
        const i = Math.round((x + OV) / t), j = Math.round((y + OV) / t), cx = x + t / 2, cy = y + t / 2;
        ctx.fillStyle = (i + j) % 2 ? c0 : c1; ctx.fillRect(x, y, t, t);
        ctx.strokeStyle = T.shade(c1, -0.35);
        ctx.beginPath(); ctx.moveTo(x + 6, y + t - 6); ctx.lineTo(x + 6, y + 6); ctx.lineTo(x + t - 6, y + 6); ctx.lineTo(x + t - 6, y + t * 0.6); ctx.lineTo(x + t * 0.3, y + t * 0.6); ctx.lineTo(x + t * 0.3, y + t * 0.3); ctx.stroke(); // meander
        ctx.fillStyle = c2; ctx.beginPath();
        for (let k = 0; k < 16; k++) { const a = (k / 16) * TAU + Math.PI / 16, rr = k % 2 ? t * 0.17 : t * 0.3; ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
        ctx.closePath(); ctx.fill(); ctx.strokeStyle = T.shade(c2, -0.35); ctx.stroke();
        ctx.fillStyle = c0; ctx.beginPath(); ctx.arc(cx, cy, t * 0.07, 0, TAU); ctx.fill();
      }
    });
    vignette(ctx, bg.vignette ?? 0.55, '#2a0a10');
  };
  MOOD.collage = (ctx, bg, lt, env) => {
    const pal = bg.palette ?? ['#f6c1c9', '#bfe3c0', '#f9e2a2', '#b9d6f2', '#e3c7f0'], seed = seedOf(env, 'collage', bg), r = T.rng(T.hash(seed));
    const items = Array.from({ length: 46 }, () => ({ x: r() * (W + 200) - 100, y: r() * (H + 200) - 100, s: 40 + r() * 70, c: pal[Math.floor(r() * pal.length)], leaf: r() < 0.4, a: r() * TAU }));
    cam(ctx, env, 0.4, () => {
      full(ctx, bg.base ?? '#fbf3e4');
      for (const it of items) {
        ctx.save(); ctx.translate(it.x, it.y); ctx.rotate(it.a);
        if (it.leaf) ol(ctx, (k) => { k.moveTo(-it.s, 0); k.quadraticCurveTo(0, -it.s * 0.6, it.s, 0); k.quadraticCurveTo(0, it.s * 0.6, -it.s, 0); }, T.mix(it.c, '#7ab070', 0.5), { line: 3, ink: DET });
        else {
          ol(ctx, (k) => { for (let p = 0; p < 5; p++) { const a = (p / 5) * TAU; k.moveTo(Math.cos(a) * it.s * 0.55 + it.s * 0.38, Math.sin(a) * it.s * 0.55); k.arc(Math.cos(a) * it.s * 0.55, Math.sin(a) * it.s * 0.55, it.s * 0.38, 0, TAU); } }, it.c, { line: 3, ink: DET });
          ol(ctx, (k) => k.arc(0, 0, it.s * 0.26, 0, TAU), '#f6d26a', { line: 3, ink: DET });
        }
        ctx.restore();
      }
    });
    vignette(ctx, bg.vignette ?? 0.15, '#8a6a4a');
  };
  const MOOD_ALIAS = { petals: (bg) => ({ ...bg, petals: true, variant: 'bokeh' }) };
  T.MOOD = MOOD;
  T.bgs.mood = (ctx, bg, lt, env) => {
    const v = bg.variant ?? 'rays';
    if (MOOD_ALIAS[v]) return MOOD.bokeh(ctx, MOOD_ALIAS[v](bg), lt, env);
    if (!MOOD[v]) throw new Error(`bg mood: unknown variant "${v}" (known: ${Object.keys(MOOD).join(', ')}, petals)`);
    MOOD[v](ctx, bg, lt, env);
  };

  // ---------- palace (throne hall) ----------
  const PALACE = {
    ochre: { wall: '#e2b35a', band: '#9a2a1c', col: '#d9a648', colSh: '#a8772c', floor: '#c9a26a', trim: '#f3d27a' },
    red: { wall: '#8a2a22', band: '#3a1612', col: '#a8322a', colSh: '#7e2420', floor: '#3a2420', trim: '#e2b23c', lattice: true },
    polychrome: { wall: '#efe2c4', band: '#2a5aa8', band2: '#b0303a', col: '#f4efe4', colSh: '#c8bfae', floor: '#e9dcc0', trim: '#e8b840' },
    gothic: { wall: '#cdb89a', band: '#7a5a3a', col: '#b8a07a', colSh: '#8a7050', floor: '#d8ccb4', trim: '#e2b23c' },
  };
  function column(ctx, x, y0, y1, w, fill, sh, o = {}) {
    const tw = (w * (o.top ?? 1)) / 2, bw = (w * (o.bot ?? 1)) / 2, flutes = o.flutes ?? 8;
    ol(ctx, (k) => { k.moveTo(x - tw, y0); k.lineTo(x + tw, y0); k.lineTo(x + bw, y1); k.lineTo(x - bw, y1); k.closePath(); }, fill, {
      line: 5,
      shade: (k) => {
        k.fillStyle = sh; k.beginPath(); k.moveTo(x + tw * 0.3, y0); k.lineTo(x + tw + 4, y0); k.lineTo(x + bw + 4, y1); k.lineTo(x + bw * 0.3, y1); k.fill();
        k.fillStyle = 'rgba(255,250,230,0.28)'; k.fillRect(x - Math.max(tw, bw) * 0.7, y0, Math.max(tw, bw) * 0.22, y1 - y0);
        k.strokeStyle = rgba(T.shade(sh, -0.25), 0.55); k.lineWidth = 2.5;
        for (let i = 1; i < flutes; i++) { const f = i / flutes - 0.5; k.beginPath(); k.moveTo(x + f * 2 * tw, y0); k.lineTo(x + f * 2 * bw, y1); k.stroke(); }
        if (o.band) { k.fillStyle = o.band; k.fillRect(x - w, y0 + 40, w * 2, 26); k.fillRect(x - w, y1 - 70, w * 2, 26); }
      },
    });
    const cap = o.cap ?? T.shade(fill, -0.05);
    ol(ctx, (k) => T.rrect(k, x - tw * 1.35, y0 - 30, tw * 2.7, 34, 6), cap, { line: 4, shade: (k) => { k.fillStyle = sh; k.fillRect(x + tw * 0.4, y0 - 30, tw * 2, 34); } });
    ol(ctx, (k) => T.rrect(k, x - bw * 1.35, y1 - 6, bw * 2.7, 30, 6), cap, { line: 4, shade: (k) => { k.fillStyle = sh; k.fillRect(x + bw * 0.4, y1 - 6, bw * 2, 30); } });
  }
  function throne(ctx, x, baseY, h, red, gold) {
    const w = h * 0.5, seatY = baseY - h * 0.36, top = baseY - h;
    for (const d of [-1, 1]) ol(ctx, (k) => k.rect(x + d * w * 0.42 - 14, seatY, 28, baseY - seatY), T.shade(gold, -0.15), { line: 4 });
    const back = (k, inset) => { const l = x - w / 2 + inset, r = x + w / 2 - inset; k.moveTo(l, seatY); k.lineTo(l, top + h * 0.3 + inset); k.quadraticCurveTo(l, top + inset * 1.4, x, top + inset * 1.6); k.quadraticCurveTo(r, top + inset * 1.4, r, top + h * 0.3 + inset); k.lineTo(r, seatY); k.closePath(); };
    ol(ctx, (k) => back(k, 0), gold, { line: 5, shade: (k) => { k.fillStyle = T.shade(gold, -0.22); k.fillRect(x + w * 0.3, top - 20, w, h); } });
    ol(ctx, (k) => back(k, 24), red, {
      line: 3, shade: (k) => {
        k.fillStyle = T.shade(red, -0.22); k.fillRect(x + w * 0.18, top, w, h);
        k.strokeStyle = rgba(T.shade(red, -0.4), 0.7); k.lineWidth = 2;
        for (let yy = top + 70; yy < seatY - 10; yy += 54) for (let xx = x - w / 2 + 50; xx < x + w / 2 - 30; xx += 54) { k.beginPath(); k.moveTo(xx, yy - 20); k.lineTo(xx + 20, yy); k.lineTo(xx, yy + 20); k.lineTo(xx - 20, yy); k.closePath(); k.stroke(); k.fillStyle = gold; k.beginPath(); k.arc(xx, yy, 4, 0, TAU); k.fill(); }
      },
    });
    ol(ctx, (k) => k.arc(x, top + 18, 16, 0, TAU), gold, { line: 4 });
    ol(ctx, (k) => T.rrect(k, x - w / 2 - 10, seatY - 30, w + 20, 54, 18), red, { line: 5, shade: (k) => { k.fillStyle = T.shade(red, -0.22); k.fillRect(x - w, seatY + 4, w * 2, 30); } });
    ol(ctx, (k) => k.rect(x - w / 2 - 6, seatY + 22, w + 12, 26), gold, { line: 4 });
    for (const d of [-1, 1]) ol(ctx, (k) => T.rrect(k, x + d * (w / 2 + 6) - 20, seatY - 110, 40, 120, 14), gold, { line: 4, shade: (k) => { k.fillStyle = T.shade(gold, -0.22); k.fillRect(x + d * (w / 2 + 6), seatY - 110, 30, 130); } });
  }
  function lattice(ctx, x, y, w, h, paper, line, lt, seed) {
    ol(ctx, (k) => k.rect(x, y, w, h), paper, { line: 6, ink: line });
    glow(ctx, x + w / 2, y + h / 2, Math.max(w, h) * 0.7 * flick(lt, seed, 0.05), '#fff2c0', 0.35);
    ctx.strokeStyle = line; ctx.lineWidth = 3;
    for (let gx = x + 40; gx < x + w; gx += 40) { ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx, y + h); ctx.stroke(); }
    for (let gy = y + 40; gy < y + h; gy += 40) { ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x + w, gy); ctx.stroke(); }
    ctx.strokeStyle = BINK; ctx.lineWidth = 10; ctx.strokeRect(x, y, w, h);
  }
  function lantern(ctx, x, y, lt, seed) {
    ctx.strokeStyle = BINK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, -OV); ctx.lineTo(x, y - 40); ctx.stroke();
    glow(ctx, x, y, 230 * flick(lt, seed), '#ffb050', 0.45);
    ol(ctx, (k) => k.ellipse(x, y, 34, 44, 0, 0, TAU), '#d8402a', { line: 4, shade: (k) => { k.fillStyle = '#ffd070'; k.fillRect(x - 10, y - 44, 18, 88); } });
    ol(ctx, (k) => { k.rect(x - 20, y - 52, 40, 12); k.rect(x - 20, y + 40, 40, 12); }, '#3a2618', { line: 3 });
  }
  function palaceGothic(ctx, bg, lt, env, pal, floorY) {
    const vx = W / 2, bx0 = W * 0.3, bx1 = W * 0.7, by0 = H * 0.06, byF = floorY - 70;
    cam(ctx, env, 0.6, () => {
      full(ctx, T.shade(pal.wall, -0.25));
      ol(ctx, (k) => k.rect(bx0, by0, bx1 - bx0, byF - by0), pal.wall, { line: 4 });
      for (const f of [0.38, 0.5, 0.62]) {
        const x = W * f, ww = 90, yT = by0 + 60, yB = byF - 120;
        ol(ctx, (k) => { k.moveTo(x - ww / 2, yB); k.lineTo(x - ww / 2, yT + 80); k.quadraticCurveTo(x - ww / 2, yT, x, yT - 20); k.quadraticCurveTo(x + ww / 2, yT, x + ww / 2, yT + 80); k.lineTo(x + ww / 2, yB); k.closePath(); }, '#fff2c8', { line: 5, shade: (k) => { k.strokeStyle = rgba(DET, 0.7); k.lineWidth = 3; k.beginPath(); k.moveTo(x, yT); k.lineTo(x, yB); k.moveTo(x - ww / 2, yT + 160); k.lineTo(x + ww / 2, yT + 160); k.stroke(); } });
      }
      for (const d of [-1, 1]) { // side walls receding
        const xo = d < 0 ? -OV : W + OV, xi = d < 0 ? bx0 : bx1;
        ol(ctx, (k) => { k.moveTo(xo, -OV); k.lineTo(xi, by0); k.lineTo(xi, byF); k.lineTo(xo, H + OV); k.closePath(); }, T.shade(pal.wall, d < 0 ? -0.08 : -0.18), { line: 4 });
        for (let i = 1; i < 4; i++) { const t = i / 4, x = T.lerp(xi, d < 0 ? 0 : W, t); ol(ctx, (k) => k.rect(x - 14 - t * 30, T.lerp(by0, -60, t), 28 + t * 60, T.lerp(byF, H + 40, t) - T.lerp(by0, -60, t)), pal.col, { line: 4, shade: (k) => { k.fillStyle = pal.colSh; k.fillRect(x + d * 4, -OV, 40 + t * 40, H + OV * 2); } }); }
      }
      wedge(ctx, W * 0.36, 70, byF, '#fff4d0', 0.16, 0.18); wedge(ctx, W * 0.48, 70, byF, '#fff4d0', 0.16, 0.12);
    });
    cam(ctx, env, 1, () => {
      ctx.fillStyle = vgrad(ctx, byF, H, [T.shade(pal.floor, -0.2), pal.floor]); ctx.beginPath(); ctx.moveTo(bx0, byF); ctx.lineTo(bx1, byF); ctx.lineTo(W + OV, H + OV); ctx.lineTo(-OV, H + OV); ctx.closePath(); ctx.fill();
      for (let i = 0; i < 3; i++) ol(ctx, (k) => k.rect(vx - 230 + i * 30, byF - 24 * (i + 1) + 24, 460 - i * 60, 26), T.shade(pal.floor, -0.1 * i), { line: 3 });
      ol(ctx, (k) => { k.moveTo(vx - 110, byF + 2); k.lineTo(vx + 110, byF + 2); k.lineTo(vx + 520, H + OV); k.lineTo(vx - 520, H + OV); k.closePath(); }, '#a8242a', { line: 4, shade: (k) => { k.strokeStyle = pal.trim; k.lineWidth = 8; k.beginPath(); k.moveTo(vx - 96, byF); k.lineTo(vx - 480, H + OV); k.moveTo(vx + 96, byF); k.lineTo(vx + 480, H + OV); k.stroke(); } });
      if (bg.throne !== false) throne(ctx, vx + ((bg.throne && bg.throne.x) ?? 0.5) * W - W / 2, byF - 60, (bg.throne && bg.throne.h) ?? 300, (bg.throne && bg.throne.color) ?? '#b3202a', pal.trim);
    });
  }
  const palOf = (bg, v) => (bg.night ? { ...PALACE[v], wall: '#1c2a5a', floor: '#141c3a', col: v === 'red' ? '#7a2420' : PALACE[v].col } : PALACE[v]);
  function palaceFront(ctx, bg, lt, env) {
    const v = bg.variant ?? 'ochre'; if (!PALACE[v]) return;
    const pal = palOf(bg, v);
    if (v === 'gothic' && bg.curtains !== false) cam(ctx, env, 1.2, () => { T.curtain(ctx, -OV, W * 0.08, -OV, H + 40, '#8a1a22', lt, 'pgl'); T.curtain(ctx, W * 0.92, W + OV, -OV, H + 40, '#8a1a22', lt, 'pgr'); ctx.fillStyle = pal.trim; ctx.fillRect(W * 0.08 - 10, -OV, 14, H + OV * 2); ctx.fillRect(W * 0.92 - 4, -OV, 14, H + OV * 2); });
  }
  T.BG_FRONT.palace = palaceFront;
  T.bgs.palace = (ctx, bg, lt, env) => {
    const v = variantOf(bg, Object.keys(PALACE), 'ochre', 'palace'), seed = seedOf(env, 'palace', bg);
    const night = !!bg.night, pal = palOf(bg, v);
    const floorY = H * (bg.floorY ?? 0.8), cols = bg.columns ?? [0.12, 0.34, 0.66, 0.88];
    if (v === 'gothic') { palaceGothic(ctx, bg, lt, env, pal, floorY); vignette(ctx, 0.35); palaceFront(ctx, bg, lt, env); return; }
    cam(ctx, env, 0.6, () => {
      ctx.fillStyle = vgrad(ctx, -OV, floorY, [T.shade(pal.wall, -0.12), pal.wall, T.shade(pal.wall, -0.06)]); ctx.fillRect(-OV, -OV, W + OV * 2, floorY + OV + 4);
      if (v === 'ochre') {
        for (const f of [1 / 3, 2 / 3]) { const y = -OV + (floorY + OV) * f; ctx.fillStyle = pal.band; ctx.fillRect(-OV, y - 22, W + OV * 2, 44); ctx.fillStyle = pal.trim; ctx.fillRect(-OV, y - 30, W + OV * 2, 8); ctx.fillRect(-OV, y + 22, W + OV * 2, 8); }
        ctx.fillStyle = T.shade(pal.wall, -0.2); for (let x = -OV; x < W + OV; x += 36) ctx.fillRect(x, H * 0.04, 20, 22);
        const nx = ((bg.throne && bg.throne.x) ?? 0.5) * W; // arched niche behind the throne
        ol(ctx, (k) => { k.moveTo(nx - 200, floorY); k.lineTo(nx - 200, H * 0.3); k.arc(nx, H * 0.3, 200, Math.PI, 0); k.lineTo(nx + 200, floorY); k.closePath(); }, T.shade(pal.wall, -0.18), { line: 4, shade: (k) => { k.fillStyle = T.shade(pal.wall, -0.3); k.fillRect(nx + 60, 0, 200, H); } });
      } else if (v === 'red') {
        ctx.fillStyle = pal.band; ctx.fillRect(-OV, -OV, W + OV * 2, OV + H * 0.1);
        const gaps = [-0.12, ...cols, 1.12];
        for (let i = 0; i < gaps.length - 1; i++) { const a = gaps[i] * W + 80, b = gaps[i + 1] * W - 80; if (b - a > 80) lattice(ctx, a, H * 0.16, b - a, floorY - H * 0.16 - 70, night ? '#2a3a72' : '#f6d79a', night ? '#121a3a' : '#7a2418', lt, seed + i); }
      } else {
        const bands = [pal.band, '#f4efe4', pal.band2, '#f4efe4', pal.band];
        bands.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(-OV, H * (0.06 + i * 0.05), W + OV * 2, H * 0.05 + 1); });
        for (let x = -OV; x < W + OV; x += 90) { ol(ctx, (k) => k.arc(x, H * 0.385, 28, 0, TAU), pal.band2, { line: 3 }); ctx.strokeStyle = '#f4efe4'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, H * 0.385, 14, 0, Math.PI * 1.5); ctx.stroke(); }
      }
      wedge(ctx, W * 0.02, W * 0.22, floorY, '#ffffff', night ? 0.03 : 0.09);
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.moveTo(W * 0.78, -OV); ctx.lineTo(W + OV, -OV); ctx.lineTo(W + OV, floorY); ctx.lineTo(W * 1.02, floorY); ctx.closePath(); ctx.fill();
    });
    cam(ctx, env, 1, () => {
      if (v === 'polychrome') perspFloor(ctx, floorY, H + OV, W / 2, 7, 14, (r, c) => ['#b0303a', '#f4efe4', '#2a5aa8'][(r + c + 42) % 3], 3);
      else {
        ctx.fillStyle = vgrad(ctx, floorY, H, [T.shade(pal.floor, -0.18), pal.floor, T.shade(pal.floor, 0.08)]); ctx.fillRect(-OV, floorY, W + OV * 2, H + OV);
        ctx.strokeStyle = rgba(DET, 0.35); ctx.lineWidth = 2;
        for (let i = -14; i <= 14; i++) { ctx.beginPath(); ctx.moveTo(W / 2 + i * 120, floorY); ctx.lineTo(W / 2 + i * 420, H + OV); ctx.stroke(); }
        for (const f of [0.06, 0.2, 0.42, 0.72]) { const y = floorY + (H - floorY) * f; ctx.beginPath(); ctx.moveTo(-OV, y); ctx.lineTo(W + OV, y); ctx.stroke(); }
      }
      for (const c of cols) { // floor reflections: mirrored, squashed column ghosts
        const g = ctx.createLinearGradient(0, floorY, 0, floorY + 240); g.addColorStop(0, rgba(pal.col, 0.3)); g.addColorStop(1, rgba(pal.col, 0));
        ctx.fillStyle = g; ctx.fillRect(c * W - 52, floorY + 24, 104, 240);
      }
      ctx.strokeStyle = BINK; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-OV, floorY); ctx.lineTo(W + OV, floorY); ctx.stroke();
      const cw = W * 0.06;
      for (const c of cols) column(ctx, c * W, -OV + 40, floorY, cw, pal.col, pal.colSh, { top: v === 'polychrome' ? 1.25 : 1, bot: v === 'polychrome' ? 0.85 : 1, band: v === 'red' ? '#2a1410' : null, flutes: v === 'red' ? 0 : 8 });
      if (v === 'red' || night) for (let i = 0; i < cols.length - 1; i++) lantern(ctx, ((cols[i] + cols[i + 1]) / 2) * W, H * 0.24, lt, seed + 'l' + i);
      if (bg.throne !== false) { const th = bg.throne || {}; throne(ctx, (th.x ?? 0.5) * W, floorY + (H - floorY) * 0.55, th.h ?? 600, th.color ?? '#b3202a', pal.trim); }
    });
    if (bg.fgColumns) cam(ctx, env, 1.2, () => { for (const c of bg.fgColumns) column(ctx, c * W, -OV, H + OV, W * 0.11, T.shade(pal.col, -0.15), T.shade(pal.colSh, -0.2), { band: v === 'red' ? '#2a1410' : null }); });
    if (bg.shafts) cam(ctx, env, 0.9, () => {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 3; i++) { const x = W * (0.18 + i * 0.22); ctx.fillStyle = rgba('#fff4d0', 0.14); ctx.beginPath(); ctx.moveTo(x, -OV); ctx.lineTo(x + 110, -OV); ctx.lineTo(x + 520, floorY + 60); ctx.lineTo(x + 360, floorY + 60); ctx.closePath(); ctx.fill(); }
      ctx.restore();
      const r = T.rng(T.hash(seed + 'dust')); ctx.fillStyle = 'rgba(255,248,220,0.6)';
      for (let i = 0; i < 40; i++) { const x = W * (0.2 + r() * 0.7), y = ((r() * H + lt * 14) % (H * 0.8)), s = 2 + r() * 3; ctx.fillRect(x + Math.sin(lt + i) * 10, y, s, s); }
    });
    vignette(ctx, night ? 0.55 : 0.3);
    palaceFront(ctx, bg, lt, env);
  };

  // ---------- burning (inferno plain / city on a hill / palace roofline) ----------
  // Union of circles as ONE silhouette: stroke every lobe (ink), fill every lobe in the shade tone, then the lit tone
  // on each lobe nudged up-left, clipped to the union, so every billow gets the same crescent shadow.
  function lobeMass(ctx, lobes, fill, o = {}) {
    const path = (dx = 0, dy = 0, k = 1) => { ctx.beginPath(); for (const [x, y, r] of lobes) { ctx.moveTo(x + dx * r + r * k, y + dy * r); ctx.arc(x + dx * r, y + dy * r, r * k, 0, TAU); } };
    ctx.save(); ctx.lineJoin = 'round';
    if (o.line) { ctx.lineWidth = o.line * 2; ctx.strokeStyle = o.ink ?? BINK; path(); ctx.stroke(); }
    ctx.fillStyle = o.shade ?? T.shade(fill, -0.22); path(); ctx.fill();
    path(); ctx.clip();
    ctx.fillStyle = fill; path(-0.18, -0.2, 0.9); ctx.fill();
    ctx.restore();
  }
  // Smoke ceiling: a flat dark top, then three rows of billows; each row is one merged mass, the front row outlined
  // with a fire-lit underside.
  function smokeCeiling(ctx, lt, seed, y, dark) {
    const r = T.rng(T.hash(seed)), span = W + OV * 2 + 400;
    ctx.fillStyle = T.shade(dark, -0.2); ctx.fillRect(-OV, -OV, W + OV * 2, y - 150 + OV);
    for (let row = 2; row >= 0; row--) { // back (darkest, highest) to front (lit underside)
      const lobes = [], n = row === 0 ? 26 : 18;
      for (let i = 0; i < n; i++) lobes.push([((r() * span + lt * (10 + row * 4)) % span) - OV - 200, y - row * 60 + r() * 50, (row === 0 ? 70 : 100) + r() * 70]);
      for (let x = -OV - 200; x < W + OV + 200; x += 140) lobes.push([x, y - row * 60 - 110, 130]); // closes the gaps to the flat top
      const fill = row === 0 ? T.shade(dark, 0.18) : row === 1 ? dark : T.shade(dark, -0.2);
      lobeMass(ctx, lobes, fill, { line: row === 0 ? 4 : 0, shade: row === 0 ? T.mix(fill, '#ff6a2a', 0.45) : T.shade(fill, -0.18) });
    }
  }
  // Rising smoke column from a fire up into the ceiling: lobes loop upward and widen; one outlined mass.
  function smokeColumn(ctx, x, y, top, lt, seed, color) {
    const r = T.rng(T.hash(seed)), n = 14, lobes = [];
    for (let i = 0; i < n; i++) {
      const q = ((i / n) + lt * 0.12) % 1, w = 40 + q * 80, sway = Math.sin(q * 5 + r() * 6) * 30 + q * 60;
      lobes.push([x + sway + (r() - 0.5) * 50, T.lerp(y, top, q), w * (0.8 + r() * 0.3)]);
    }
    lobeMass(ctx, lobes, color, { line: 4 });
  }
  function flameBand(ctx, x0, x1, y, lt, seed, scale = 1) {
    tongues(ctx, x0, x1, y, { seed: seed + 'b', lt, w: [30 * scale, 70 * scale], h: [70 * scale, 140 * scale], color: '#d05a1a', edge: '#8a2a10' });
    tongues(ctx, x0 + 18, x1, y, { seed: seed + 'm', lt, w: [26 * scale, 60 * scale], h: [50 * scale, 100 * scale], color: '#ff9a20' });
    tongues(ctx, x0 + 8, x1, y, { seed: seed + 'f', lt, w: [20 * scale, 44 * scale], h: [26 * scale, 56 * scale], color: '#ffd83a', gap: 0.9 });
  }
  // Battlefield debris (stand-in for the fallen, no gore): a dropped round shield, a helmet and a spear stuck at an
  // angle, mirrored and recoloured by seed so a row of heaps does not repeat.
  function xHeap(ctx, x, y, s, seed) {
    const r = T.rng(T.hash(seed)), m = r() < 0.5 ? -1 : 1, shield = ['#a8322a', '#3d5a8a', '#c89a3a'][Math.floor(r() * 3)], lean = (20 + r() * 25) * m;
    ctx.save(); ctx.translate(x, y); ctx.scale(m, 1);
    ctx.save(); ctx.translate(s * 0.9, 0); ctx.rotate(lean * T.DEG); // spear stuck in the ground
    ol(ctx, (k) => k.rect(-5, -s * 2.2, 10, s * 2.2), '#7a5232', { line: 3 });
    ol(ctx, (k) => { k.moveTo(0, -s * 2.6); k.quadraticCurveTo(14, -s * 2.35, 0, -s * 2.15); k.quadraticCurveTo(-14, -s * 2.35, 0, -s * 2.6); }, '#c8ccd0', { line: 3 });
    ctx.restore();
    ol(ctx, (k) => k.ellipse(0, -s * 0.12, s * 0.75, s * 0.32, -0.08, 0, TAU), shield, { line: 4, shade: (k) => { k.fillStyle = T.shade(shield, -0.25); k.fillRect(-s, -s * 0.05, s * 2, s); } });
    ol(ctx, (k) => k.ellipse(0, -s * 0.14, s * 0.2, s * 0.09, -0.08, 0, TAU), '#e0c060', { line: 3 }); // boss
    ol(ctx, (k) => { k.moveTo(-s * 0.95, 0); k.arc(-s * 0.6, 0, s * 0.35, Math.PI, 0); k.closePath(); }, '#8a8e92', { line: 3, shade: (k) => { k.fillStyle = '#6a6e72'; k.fillRect(-s * 0.6, -s, s, s); } }); // helmet
    ctx.restore();
  }
  function cityRoofline(ctx, cx, baseY, w, lt, seed) {
    const r = T.rng(T.hash(seed)), blocks = [];
    for (let x = cx - w / 2; x < cx + w / 2;) { const bw = 60 + r() * 90, bh = 70 + r() * 150; blocks.push([x, bw, bh, r() < 0.35]); x += bw * 0.85; }
    glow(ctx, cx, baseY - 80, w * 0.8 * flick(lt, seed, 0.06), '#ffb030', 0.4);
    for (const [x, bw, bh, roof] of blocks) {
      ol(ctx, (k) => { k.moveTo(x, baseY); k.lineTo(x, baseY - bh); if (roof) k.lineTo(x + bw / 2, baseY - bh - 50); k.lineTo(x + bw, baseY - bh); k.lineTo(x + bw, baseY); k.closePath(); }, '#2a1c1c', { line: 3 });
      ctx.fillStyle = '#ffb030'; for (let wy = baseY - bh + 24; wy < baseY - 20; wy += 40) ctx.fillRect(x + bw * 0.35, wy, 12, 16);
      tongues(ctx, x, x + bw, baseY - bh + 6, { seed: seed + 'o' + x, lt, w: [20, 40], h: [40, 90], color: '#e0601c', edge: '#8a2a10' });
      tongues(ctx, x + 6, x + bw - 6, baseY - bh + 6, { seed: seed + 'c' + x, lt, w: [14, 28], h: [20, 50], color: '#ffd23a' });
    }
  }
  T.bgs.burning = (ctx, bg, lt, env) => {
    const v = variantOf(bg, ['plain', 'city', 'palace'], 'plain', 'burning'), seed = seedOf(env, 'burning', bg), night = bg.night ?? true;
    const hz = H * (bg.horizon ?? (v === 'city' ? 0.5 : 0.6));
    cam(ctx, env, 0.15, () => {
      ctx.fillStyle = vgrad(ctx, -OV, hz, night ? ['#1a0a24', '#2a1030', '#8a1a3a', '#e0303a'] : ['#5a3a3a', '#a04a3a', '#e0803a', '#f6c060']); ctx.fillRect(-OV, -OV, W + OV * 2, H + OV * 2);
      glow(ctx, W / 2, hz, W * 0.7 * flick(lt, seed + 'g', 0.06), '#ff8030', 0.45);
      smokeCeiling(ctx, lt, seed + 'sm', H * (bg.smoke ?? 0.22), night ? '#2a2020' : '#4a3a36');
    });
    cam(ctx, env, 0.35, () => {
      T.ridge(ctx, hz - 30, 200, 0.0035, seed + 'm1', '#6a2040', '#e0603a', 0.1);
      T.ridge(ctx, hz + 10, 110, 0.006, seed + 'm2', '#8a3050', '#ff8040', 0);
      if (bg.temple != null && bg.temple !== false) {
        const tx = bg.temple * W, ty = hz - 70;
        ol(ctx, (k) => { k.moveTo(tx - 110, ty - 90); k.lineTo(tx, ty - 140); k.lineTo(tx + 110, ty - 90); k.closePath(); k.rect(tx - 110, ty - 90, 220, 14); k.rect(tx - 120, ty - 8, 240, 18); for (let i = 0; i < 5; i++) k.rect(tx - 96 + i * 44, ty - 76, 18, 70); }, '#3a1828', { line: 3 });
      }
    });
    if (v === 'city') cam(ctx, env, 0.7, () => {
      const cx = W * (bg.cityX ?? 0.66);
      ol(ctx, (k) => { k.moveTo(-OV, H + OV); k.lineTo(-OV, hz + 260); k.quadraticCurveTo(W * 0.3, hz + 40, cx, hz + 20); k.quadraticCurveTo(W * 0.95, hz + 30, W + OV, hz + 160); k.lineTo(W + OV, H + OV); k.closePath(); }, night ? '#3e4a2a' : '#6a7a3a', { line: 4, shade: (k) => glow(k, cx, hz + 60, 560 * flick(lt, seed + 'hg', 0.06), '#ff9a30', 0.4) });
      cityRoofline(ctx, cx, hz + 40, 560, lt, seed + 'city');
    });
    if (v === 'palace') cam(ctx, env, 0.7, () => {
      const y = hz + 40;
      smokeColumn(ctx, W * 0.3, y - 200, H * (bg.smoke ?? 0.22) + 60, lt, seed + 's1', night ? '#3a3030' : '#5a4a46');
      smokeColumn(ctx, W * 0.75, y - 200, H * (bg.smoke ?? 0.22) + 60, lt, seed + 's2', night ? '#3a3030' : '#5a4a46');
      ol(ctx, (k) => k.rect(-OV, y - 130, W + OV * 2, 170), '#c8b89a', { line: 4, shade: (k) => { k.fillStyle = '#5a2a22'; for (let x = -OV + 40; x < W + OV; x += 150) k.fillRect(x, y - 100, 60, 90); } });
      for (let x = -OV + 120; x < W + OV; x += 520) if (T.eaveRoof) T.eaveRoof(ctx, x + 180, y - 130, 460, 90, '#4a3a3a');
      flameBand(ctx, -OV, W + OV, y - 180, lt, seed + 'pf', 1.2);
    });
    cam(ctx, env, 1, () => {
      const gy = v === 'plain' ? hz : v === 'palace' ? hz + 80 : H * 0.86, gc = v === 'plain' ? '#c8662a' : v === 'palace' ? (night ? '#5a4a48' : '#c8b8a0') : night ? '#2e3a22' : '#5a6a32';
      ctx.fillStyle = vgrad(ctx, gy, H + OV, [T.shade(gc, 0.1), gc, T.shade(gc, -0.35)]); ctx.fillRect(-OV, gy, W + OV * 2, H + OV);
      if (v === 'palace') { ctx.strokeStyle = rgba(DET, 0.35); ctx.lineWidth = 2; for (let i = -12; i <= 12; i++) { ctx.beginPath(); ctx.moveTo(W / 2 + i * 110, gy); ctx.lineTo(W / 2 + i * 300, H + OV); ctx.stroke(); } for (const f of [0.12, 0.3, 0.55, 0.85]) { const y = gy + (H - gy) * f; ctx.beginPath(); ctx.moveTo(-OV, y); ctx.lineTo(W + OV, y); ctx.stroke(); } glow(ctx, W / 2, gy, W * 0.6 * flick(lt, seed + 'cg', 0.06), '#ff8a30', 0.25); }
      if (v === 'plain') {
        const r = T.rng(T.hash(seed + 'cr')); ctx.strokeStyle = '#8a3a1a'; ctx.lineWidth = 3;
        for (let i = 0; i < 18; i++) { let x = r() * W, y = gy + 40 + r() * (H - gy); ctx.beginPath(); ctx.moveTo(x, y); for (let s = 0; s < 4; s++) { x += 30 + r() * 60; y += (r() - 0.5) * 30; ctx.lineTo(x, y); } ctx.stroke(); }
        flameBand(ctx, -OV, W + OV, hz + 6, lt, seed + 'fb');
      }
      ctx.strokeStyle = BINK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-OV, gy); ctx.lineTo(W + OV, gy); ctx.stroke();
      const n = bg.bodies ?? 0, r2 = T.rng(T.hash(seed + 'bd'));
      for (let i = 0; i < n; i++) xHeap(ctx, W * (0.1 + (i / Math.max(1, n)) * 0.8 + r2() * 0.06), H * (0.9 + r2() * 0.04), 70, seed + 'h' + i);
    });
    vignette(ctx, 0.45, '#200008');
  };

  // ---------- studio sets ----------
  const STUDIO = {};
  const desk = (ctx, x, y, w, h, c) => ol(ctx, (k) => T.rrect(k, x, y, w, h, 10), c, { line: 5, shade: (k) => { k.fillStyle = T.shade(c, -0.22); k.fillRect(x + w * 0.62, y, w, h); k.fillStyle = 'rgba(255,255,255,0.18)'; k.fillRect(x, y + 10, w, 10); } });
  const heads = (ctx, y, seed, n = 9, col = '#141010') => {
    const r = T.rng(T.hash(seed));
    for (let i = 0; i < n; i++) { const x = -OV * 0.5 + (i / (n - 1)) * (W + OV), rr = 70 + r() * 20, yy = y + r() * 30; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, yy, rr, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(x, yy + rr * 1.6, rr * 1.5, rr, 0, Math.PI, 0); ctx.fill(); ctx.fillRect(x - rr * 1.5, yy + rr * 1.6, rr * 3, 300); }
  };
  STUDIO.gameshow = { back: (ctx, bg, lt, env) => {
    cam(ctx, env, 0.6, () => {
      ctx.fillStyle = vgrad(ctx, -OV, H, ['#8b5bd0', '#a77ce0', '#c9a2ec']); ctx.fillRect(-OV, -OV, W + OV * 2, H + OV * 2);
      const pulse = 0.4 + 0.1 * Math.sin(lt * Math.PI); // 0.5 Hz
      for (let x = -OV + 60; x < W + OV; x += 240) { ctx.fillStyle = `rgba(240,220,255,${pulse})`; ctx.fillRect(x, -OV, 120, H + OV * 2); ctx.fillStyle = `rgba(255,255,255,${pulse * 0.5})`; ctx.fillRect(x + 12, -OV, 18, H + OV * 2); }
      ctx.fillStyle = '#6a3aa8'; ctx.fillRect(-OV, H * 0.84, W + OV * 2, H);
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.moveTo(W * 0.15, -OV); ctx.lineTo(W * 0.3, -OV); ctx.lineTo(W * 0.85, H + OV); ctx.lineTo(W * 0.52, H + OV); ctx.closePath(); ctx.fill();
    });
  }, front: (ctx, bg, lt, env, seed) => {
    if (bg.podium !== false) cam(ctx, env, 1, () => {
      const px = W * (bg.podiumX ?? 0.74), py = H * 0.62;
      ol(ctx, (k) => { k.moveTo(px - 230, py); k.lineTo(px + 230, py); k.lineTo(px + 200, H + 40); k.lineTo(px - 200, H + 40); k.closePath(); }, '#e8e0f0', { line: 6, shade: (k) => { k.fillStyle = '#c8b8dc'; k.fillRect(px + 90, py, 200, H); } });
      ol(ctx, (k) => T.rrect(k, px - 250, py - 36, 500, 46, 10), '#b89adc', { line: 5 });
      ol(ctx, (k) => T.rrect(k, px - 180, py + 60, 360, 190, 12), '#2fb0a8', { line: 5, shade: (k) => { k.fillStyle = '#1f8a84'; k.fillRect(px - 180, py + 200, 360, 60); } });
      if (bg.sign) T.toonText(ctx, String(bg.sign), px, py + 175, { size: T.fitSize(ctx, String(bg.sign), 70, 320), shadow: false });
    });
    if (bg.confetti) cam(ctx, env, 1.1, () => { const r = T.rng(T.hash(seed + 'cf')); for (let i = 0; i < 60; i++) { const x = r() * W, y = ((r() * H + lt * (120 + r() * 80)) % (H + 40)) - 20; ctx.save(); ctx.translate(x + Math.sin(lt * 3 + i) * 20, y); ctx.rotate(lt * 4 + i); ctx.fillStyle = ['#ffe14a', '#ff5a8a', '#4ad8e8', '#ffffff'][i % 4]; ctx.fillRect(-8, -5, 16, 10); ctx.restore(); } });
  } };
  STUDIO.quiz = { back: (ctx, bg, lt, env) => {
    cam(ctx, env, 0.6, () => {
      full(ctx, '#3b78c8'); ctx.strokeStyle = '#5a92d8'; ctx.lineWidth = 2;
      for (let x = -OV; x < W + OV; x += 60) { ctx.beginPath(); ctx.moveTo(x, -OV); ctx.lineTo(x, H + OV); ctx.stroke(); }
      for (let y = -OV; y < H + OV; y += 60) { ctx.beginPath(); ctx.moveTo(-OV, y); ctx.lineTo(W + OV, y); ctx.stroke(); }
      for (const [cx, cy, a0] of [[-40, -40, 0], [W + 40, H + 40, Math.PI]]) ['#3a5fb0', '#f7d04a', '#f4a52a', '#e8562a'].forEach((c, i) => ol(ctx, (k) => { k.moveTo(cx, cy); k.arc(cx, cy, 330 - i * 70, a0, a0 + Math.PI / 2); k.closePath(); }, c, { line: 4 }));
      const sx = W / 2 - 550, sy = H * 0.1;
      ol(ctx, (k) => T.rrect(k, sx - 24, sy - 24, 1148, 608, 36), '#7ec0e8', { line: 6, shade: (k) => { k.fillStyle = '#5aa0d0'; k.fillRect(sx - 24, sy + 520, 1148, 80); } });
      ol(ctx, (k) => T.rrect(k, sx, sy, 1100, 560, 18), '#fbfbf6', { line: 6 });
      screenContent(ctx, bg.screen, sx + 12, sy + 12, 1076, 536, lt, env);
    });
  }, front: (ctx, bg, lt, env) => {
    cam(ctx, env, 1, () => {
      const px = W * (bg.podiumX ?? 0.9), py = H * 0.86, R0 = 170;
      ['#e8562a', '#f4a52a', '#f7d04a', '#3a5fb0'].forEach((c, i) => ol(ctx, (k) => { k.moveTo(px - R0 + i * 34, H + OV); k.lineTo(px - R0 + i * 34, py + i * 26); k.arc(px, py + i * 26, R0 - i * 34, Math.PI, 0); k.lineTo(px + R0 - i * 34, H + OV); }, c, { line: 5 }));
    });
  } };
  STUDIO.news = { back: (ctx, bg, lt, env, seed) => {
    cam(ctx, env, 0.45, () => {
      ctx.fillStyle = vgrad(ctx, -OV, H, ['#0a0f24', '#1a2440', '#3a3060']); ctx.fillRect(-OV, -OV, W + OV * 2, H + OV * 2);
      const r = T.rng(T.hash(seed + 'sky')), tick = Math.floor(lt * 2.5); // toggle 2% of windows every 12 frames
      for (let x = -OV; x < W + OV;) {
        const bw = 120 + r() * 120, bh = 260 + r() * 460, by = H * 0.8 - bh, tint = ['#f0d070', '#f06a5a', '#6ab0f0', '#f0d070'][Math.floor(r() * 4)];
        ctx.fillStyle = '#121a32'; ctx.fillRect(x, by, bw, bh + 400);
        for (let wy = by + 20; wy < H * 0.8; wy += 26) for (let wx = x + 14; wx < x + bw - 14; wx += 22) { const h = T.hash(seed + wx + ':' + wy); if (((h % 100) < 45) !== ((T.hash(h + ':' + tick) % 100) < 2)) { ctx.fillStyle = tint; ctx.fillRect(wx, wy, 10, 12); } }
        x += bw + 10 + r() * 30;
      }
      ctx.fillStyle = '#20284a'; ctx.fillRect(-OV, H * 0.8, W + OV * 2, H + OV);
    });
  }, front: (ctx, bg, lt, env) => {
    cam(ctx, env, 1, () => {
      ctx.fillStyle = '#20284a'; ctx.fillRect(-OV, H * 0.8, W + OV * 2, H);
      const dy = H * (bg.deskY ?? 0.8);
      ol(ctx, (k) => { k.moveTo(W * 0.12, dy + 40); k.quadraticCurveTo(W / 2, dy - 30, W * 0.88, dy + 40); k.lineTo(W * 0.9, H + 40); k.lineTo(W * 0.1, H + 40); k.closePath(); }, '#2a3a6a', { line: 6, shade: (k) => { k.fillStyle = '#1c2850'; k.fillRect(W * 0.6, dy - 40, W, H); k.fillStyle = '#5a8ad8'; k.fillRect(0, dy + 50, W, 14); } });
    });
    if (bg.tags !== false) {
      ol(ctx, (k) => T.rrect(k, 40, 40, 420, 70, 8), '#d02a2a', { line: 5 }); textBlock(ctx, bg.tag ?? 'BREAKING NEWS', 250, 76, 40, '#ffffff');
      ol(ctx, (k) => T.rrect(k, W - 200, 40, 160, 70, 8), '#d02a2a', { line: 5 }); textBlock(ctx, 'LIVE', W - 120, 76, 42, '#ffffff');
      if (Math.floor(lt * 2) % 2 === 0) { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(W - 176, 76, 9, 0, TAU); ctx.fill(); }
    }
  } };
  STUDIO.courtroom = { back: (ctx, bg, lt, env) => {
    cam(ctx, env, 0.6, () => {
      T.planks(ctx, -OV, -OV, W + OV, H + OV, '#6e4424', true, 110);
      for (let x = -OV + 60; x < W + OV; x += 220) column(ctx, x, H * 0.06, H * 0.62, 56, '#8a5a32', '#5a3a1e', { flutes: 4, cap: '#7a4e2a' });
      const wx = W * 0.5; glow(ctx, wx, H * 0.2, 460, '#fff0c0', 0.4);
      ol(ctx, (k) => { k.moveTo(wx - 150, H * 0.5); k.lineTo(wx - 150, H * 0.18); k.arc(wx, H * 0.18, 150, Math.PI, 0); k.lineTo(wx + 150, H * 0.5); k.closePath(); }, '#f6e2a8', { line: 6, shade: (k) => { k.strokeStyle = '#6e4424'; k.lineWidth = 8; k.beginPath(); k.moveTo(wx, 0); k.lineTo(wx, H); k.moveTo(0, H * 0.32); k.lineTo(W, H * 0.32); k.stroke(); } });
      wedge(ctx, W * 0.1, W * 0.2, H, '#ffffff', 0.06);
    });
  }, front: (ctx, bg, lt, env) => {
    cam(ctx, env, 1, () => {
      const by = H * (bg.benchY ?? 0.62);
      ol(ctx, (k) => k.rect(W * 0.22, by, W * 0.56, H), '#7a4e2a', { line: 6, shade: (k) => { k.fillStyle = '#5a3a1e'; for (let x = W * 0.25; x < W * 0.76; x += 150) k.fillRect(x, by + 60, 110, H); k.fillStyle = '#9a6a3a'; k.fillRect(W * 0.2, by, W * 0.6, 22); } });
      ol(ctx, (k) => k.rect(W * 0.8, H * 0.7, W * 0.25, H), '#6a4224', { line: 6, shade: (k) => { k.fillStyle = '#8a5a32'; k.fillRect(W * 0.8, H * 0.7, W, 20); } });
      ctx.fillStyle = '#4a2e18'; ctx.fillRect(-OV, H * 0.92, W + OV * 2, H);
    });
  } };
  STUDIO.auction = { back: (ctx, bg, lt, env) => {
    cam(ctx, env, 0.6, () => {
      full(ctx, '#8b1a1d'); ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let x = -OV; x < W + OV; x += 48) ctx.fillRect(x, -OV, 20, H + OV * 2);
      glow(ctx, W * 0.6, H * 0.35, 520, '#ffd8a0', 0.3);
      ol(ctx, (k) => k.rect(W * 0.58, H * 0.1, 360, 250), '#c89a3a', { line: 6 });
      ctx.fillStyle = vgrad(ctx, H * 0.1 + 24, H * 0.1 + 226, ['#8ac8e8', '#cfe8c0', '#7aa04a']); ctx.fillRect(W * 0.58 + 24, H * 0.1 + 24, 312, 202); ctx.strokeStyle = BINK; ctx.lineWidth = 3; ctx.strokeRect(W * 0.58 + 24, H * 0.1 + 24, 312, 202);
      ol(ctx, (k) => k.rect(W * 0.08, H * 0.12, 520, 680), '#f3ead6', { line: 8, shade: (k) => { k.fillStyle = '#ddd0b0'; k.fillRect(W * 0.08 + 440, H * 0.12, 100, 700); } });
      const t = String(bg.title ?? 'LOT 1').split('\n');
      t.forEach((ln, i) => textBlock(ctx, ln, W * 0.08 + 260, H * 0.12 + 160 + i * 140, T.fitSize(ctx, ln, 120, 460), '#2a1c15'));
      ctx.fillStyle = '#5a1012'; ctx.fillRect(-OV, H * 0.86, W + OV * 2, H);
    });
  }, front: (ctx, bg, lt, env, seed) => {
    cam(ctx, env, 1, () => desk(ctx, W * 0.6, H * 0.6, 420, 500, '#6e4424'));
    cam(ctx, env, 1.3, () => {
      heads(ctx, H * 0.86, seed + 'heads');
      for (const p of bg.paddles || []) {
        const e = T.ease.outBack(T.prog(lt, p.at ?? 0, 0.2)); if (e <= 0) continue; // 6-frame pop
        const x = (p.x ?? 0.5) * W, y = H * 0.82 - e * 260;
        ctx.fillStyle = '#141010'; ctx.fillRect(x - 18, y, 36, 400);
        ol(ctx, (k) => k.ellipse(x, y - 60, 90, 80, 0, 0, TAU), '#ffffff', { line: 6 });
        textBlock(ctx, p.num ?? '', x, y - 58, 64);
      }
    });
  } };
  STUDIO.podcast = { back: (ctx, bg, lt, env) => {
    cam(ctx, env, 0.6, () => {
      full(ctx, '#7a5232');
      for (let x = -OV; x < W + OV; x += 44) { ol(ctx, (k) => k.rect(x, -OV, 34, H + OV * 2), x % 88 ? '#9a6a42' : '#a8774a', { line: 2, ink: '#4a2e18' }); }
      glow(ctx, W * 0.3, H * 0.25, 600, '#ffe0a0', 0.25);
      for (const px of [0.06, 0.94]) { ol(ctx, (k) => k.rect(px * W - 70, H * 0.62, 140, 160), '#c8643a', { line: 5 }); for (let i = 0; i < 7; i++) ol(ctx, (k) => k.ellipse(px * W + (i - 3) * 30, H * 0.5 + Math.abs(i - 3) * 30, 34, 90, (i - 3) * 0.3, 0, TAU), i % 2 ? '#4a8a3a' : '#5aa04a', { line: 3 }); }
    });
  }, front: (ctx, bg, lt, env) => {
    cam(ctx, env, 1, () => {
      ol(ctx, (k) => { k.moveTo(W * 0.1, H * 0.72); k.lineTo(W * 0.9, H * 0.72); k.lineTo(W + 100, H + 40); k.lineTo(-100, H + 40); k.closePath(); }, '#c89a62', { line: 6, shade: (k) => { k.strokeStyle = 'rgba(90,60,30,0.3)'; k.lineWidth = 3; for (let i = 0; i < 8; i++) { k.beginPath(); k.moveTo(W * 0.1 + i * 200, H * 0.72); k.lineTo(-100 + i * 300, H); k.stroke(); } } });
      for (const mx of bg.mics ?? [0.44, 0.56]) { // boom arms from the table edge, heads at chin height beside the hosts
        const x = mx * W, d = mx < 0.5 ? -1 : 1, hy = H * 0.6; ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(x, H * 0.8); ctx.lineTo(x - d * 30, H * 0.7); ctx.lineTo(x + d * 40, hy + 40); ctx.stroke();
        ol(ctx, (k) => T.rrect(k, x + d * 40 - 30, hy - 50, 60, 96, 28), '#3a3a3a', { line: 5, shade: (k) => { k.strokeStyle = '#6a6a6a'; k.lineWidth = 3; for (let y = hy - 40; y < hy + 30; y += 12) { k.beginPath(); k.moveTo(x + d * 40 - 30, y); k.lineTo(x + d * 40 + 30, y); k.stroke(); } } });
      }
      ol(ctx, (k) => { k.moveTo(W * 0.45, H * 0.86); k.lineTo(W * 0.56, H * 0.84); k.lineTo(W * 0.58, H * 0.92); k.lineTo(W * 0.46, H * 0.94); k.closePath(); }, '#f4f0e6', { line: 4 });
      ol(ctx, (k) => { k.arc(W * 0.25, H * 0.82, 40, Math.PI, 0); k.lineTo(W * 0.25 + 46, H * 0.84); k.lineTo(W * 0.25 - 46, H * 0.84); k.closePath(); }, '#2a2a2a', { line: 5 });
    });
  } };
  STUDIO.classroom = { back: (ctx, bg, lt, env) => {
    cam(ctx, env, 0.6, () => {
      ctx.fillStyle = vgrad(ctx, -OV, H * 0.7, ['#d8cdb0', '#e8e0c8']); ctx.fillRect(-OV, -OV, W + OV * 2, H + OV * 2);
      ctx.fillStyle = '#a8865a'; ctx.fillRect(-OV, H * 0.62, W + OV * 2, H);
      ol(ctx, (k) => k.rect(W * 0.2, H * 0.08, W * 0.6, H * 0.46), '#8a5a32', { line: 6 });
      ctx.fillStyle = '#2f5a3a'; ctx.fillRect(W * 0.2 + 22, H * 0.08 + 22, W * 0.6 - 44, H * 0.46 - 44);
      ctx.fillStyle = 'rgba(255,255,255,0.05)'; for (let i = 0; i < 8; i++) ctx.fillRect(W * 0.22 + i * 140, H * 0.1, 50, H * 0.42);
      (bg.lines || []).forEach((ln, i) => {
        const o = typeof ln === 'string' ? { text: ln } : ln, p = T.prog(lt, o.at ?? i * 0.6, 0.4); if (p <= 0) return;
        const s = String(o.text ?? ''); ctx.fillStyle = '#f2f2e8'; ctx.font = T.font(o.size ?? 60, 700); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        ctx.fillText(s.slice(0, Math.ceil(s.length * p)), W * 0.24, H * 0.2 + i * (o.size ?? 60) * 1.4);
      });
      ol(ctx, (k) => k.rect(W * 0.2, H * 0.54, W * 0.6, 18), '#6b4426', { line: 4 });
      glow(ctx, W * 0.92, H * 0.3, 420, '#fff2c0', 0.35);
      ol(ctx, (k) => k.rect(W * 0.86, H * 0.12, 260, 360), '#fff2c8', { line: 6, shade: (k) => { k.strokeStyle = '#8a5a32'; k.lineWidth = 8; k.beginPath(); k.moveTo(W * 0.86 + 130, 0); k.lineTo(W * 0.86 + 130, H); k.moveTo(W * 0.8, H * 0.3); k.lineTo(W, H * 0.3); k.stroke(); } });
      wedge(ctx, W * 0.75, 160, H, '#fff4d0', 0.12, -0.5);
    });
    cam(ctx, env, 1, () => {
      ctx.fillStyle = vgrad(ctx, H * 0.7, H, ['#c8b48a', '#e0d0a8']); ctx.fillRect(-OV, H * 0.7, W + OV * 2, H);
    });
  }, front: (ctx, bg, lt, env) => {
    cam(ctx, env, 1, () => desk(ctx, W * 0.62, H * 0.62, 420, 200, '#7a4e2a'));
    cam(ctx, env, 1.3, () => { for (const x of [0.12, 0.38, 0.62, 0.88]) { desk(ctx, x * W - 150, H * 0.9, 300, 140, '#a8774a'); ol(ctx, (k) => k.rect(x * W - 120, H * 0.9 + 60, 18, 200), '#5a3a1e', { line: 3 }); } });
  } };
  T.STUDIO = STUDIO;
  T.bgs.studio = (ctx, bg, lt, env) => {
    const v = variantOf(bg, Object.keys(STUDIO), 'gameshow', 'studio'), seed = seedOf(env, 'studio', bg);
    STUDIO[v].back(ctx, bg, lt, env, seed);
    vignette(ctx, bg.vignette ?? 0.3);
    STUDIO[v].front(ctx, bg, lt, env, seed);
  };
  T.BG_FRONT.studio = (ctx, bg, lt, env) => { const v = bg.variant ?? 'gameshow'; if (STUDIO[v]) STUDIO[v].front(ctx, bg, lt, env, seedOf(env, 'studio', bg)); };
})();
