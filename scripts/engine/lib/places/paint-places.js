// paint-places.js — painted look for places: 3-tone painted clouds, sun bloom and horizon haze, textured ground,
// surface textures per background kind (plaster walls, wood floors, cobbles, carpets), the frame light wash, and the
// grade presets dusk and overcast (golden-hour and night live in action-fx.js and atmosphere.js). Paper fibres join
// the film grain tile in paint.js. Hooks are called by core.js (T.paintBg after the backgrounds), paint.js
// (T.paintPost) and backgrounds.js (T.paintSky.*), only while T.PAINT is set.
(function () {
  'use strict';
  const T = window.TOON, W = T.W, H = T.H, TAU = Math.PI * 2;
  const OV = () => T.OVERSCAN ?? 260;
  const rgba = (hex, a) => { const n = parseInt(T.hex6(hex).slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${T.clamp(a).toFixed(3)})`; };

  // ---------- grades ----------
  Object.assign(T.GRADE_PRESETS, {
    dusk: [['multiply', '#d9b8cf'], ['soft-light', '#4a2a6a', 0.5], ['bloom', '#ff9f80', 0.22], ['vignette', '#140818', 0.45]],
    overcast: [['saturation', '#808080', 0.4], ['multiply', '#d8dde2'], ['soft-light', '#5a6a78', 0.35]],
  });

  // ---------- painted sky pieces (called from backgrounds.js) ----------
  const lobesOf = (x, y, w, seed) => { // same lobe layout as the classic cumulus, plus the flat base
    const r = T.rng(T.hash(seed)), n = 5 + Math.floor(r() * 3), cs = [];
    for (let i = 0; i < n; i++) { const t = i / (n - 1) - 0.5; cs.push([x + t * w, y - w * (0.12 + r() * 0.1) * (1 - Math.abs(t) * 1.3), w * (0.16 + r() * 0.08) * (1 - Math.abs(t) * 0.8)]); }
    return cs;
  };
  // Painted cumulus: the classic inked cloud, then soft 3-tone light inside it: a warm lit cap toward the light,
  // a soft volume falloff away from the light and a darker flat underside.
  function cumulus(ctx, x, y, w, seed, pal, P) {
    const under = pal.cloudUnder ?? T.shade(pal.stops[1], -0.08);
    T.cumulusCloud(ctx, x, y, w, seed, pal.cloud, under);
    const cs = lobesOf(x, y, w, seed), lx = P.wx, ly = Math.min(P.wy, -0.35); // clouds are lit from above
    const path = (k, sx = 0, sy = 0, d = 0) => { k.beginPath(); cs.forEach(([cx, cy, rr]) => { k.moveTo(cx + sx + rr + d, cy + sy); k.arc(cx + sx, cy + sy, rr + d, 0, TAU); }); };
    ctx.save();
    path(ctx); ctx.rect(x - w * 0.5, y - w * 0.08, w, w * 0.12); ctx.clip();
    const cx = x + lx * w * 0.16, cy = y - w * 0.12 + ly * w * 0.2, vol = ctx.createRadialGradient(cx, cy, w * 0.12, cx, cy, w * 0.62);
    vol.addColorStop(0, rgba(under, 0)); vol.addColorStop(1, rgba(under, 0.6)); // soft volume away from the light
    ctx.fillStyle = vol; ctx.fillRect(x - w, y - w * 0.6, w * 2, w * 0.8);
    ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.5;
    ctx.fillStyle = T.mix(pal.cloud, P.light.color, 0.85); path(ctx, lx * w * 0.12, ly * w * 0.16, -w * 0.03); ctx.fill(); // warm lit cap
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    const g = ctx.createLinearGradient(0, y - w * 0.12, 0, y + w * 0.05); // soft, darker underside
    g.addColorStop(0, rgba(P.light.ambient, 0)); g.addColorStop(1, rgba(P.light.ambient, 0.3));
    ctx.fillStyle = g; ctx.fillRect(x - w, y - w * 0.12, w * 2, w * 0.2);
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
  }
  function wisp(ctx, x, y, len, color, seed) {
    const r = T.rng(T.hash(seed)), th = 10 + r() * 14;
    ctx.fillStyle = color; ctx.globalAlpha = 0.55;
    ctx.beginPath(); ctx.moveTo(x - len / 2, y); ctx.quadraticCurveTo(x, y - th * 2.2, x + len / 2, y - th * 0.6); ctx.quadraticCurveTo(x, y - th * 0.4, x - len / 2, y); ctx.fill();
    ctx.globalAlpha = 1;
  }

  T.paintSky = {
    // Sun bloom and a warm haze band along the horizon (atmospheric depth).
    atmosphere(ctx, pal, sun, horizon) {
      const P = T.PAINT, o = OV(), sx = sun[0] * W, sy = sun[1] * H;
      if (sy > -H * 0.2) {
        ctx.save(); ctx.globalCompositeOperation = 'screen';
        const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, 900);
        g.addColorStop(0, rgba(P.light.color, 0.35)); g.addColorStop(0.2, rgba(pal.glow, 0.16)); g.addColorStop(1, rgba(pal.glow, 0));
        ctx.fillStyle = g; ctx.fillRect(-o, -o, W + o * 2, H + o * 2);
        ctx.restore();
      }
      const hz = ctx.createLinearGradient(0, horizon - 160, 0, horizon + 20), haze = T.mix(pal.stops[pal.stops.length - 1], pal.glow, 0.4);
      hz.addColorStop(0, rgba(haze, 0)); hz.addColorStop(1, rgba(haze, 0.35));
      ctx.fillStyle = hz; ctx.fillRect(-o, horizon - 160, W + o * 2, 180);
      const zen = ctx.createLinearGradient(0, -o, 0, horizon * 0.65); // deeper zenith: richer, painted sky
      zen.addColorStop(0, rgba(T.shade(pal.stops[0], -0.3), 0.45)); zen.addColorStop(1, rgba(pal.stops[0], 0));
      ctx.fillStyle = zen; ctx.fillRect(-o, -o, W + o * 2, horizon * 0.65 + o);
    },
    clouds(ctx, bg, pal, lt, seed) {
      const n = bg.clouds === true ? 6 : bg.clouds | 0;
      if (!n) return;
      const r = T.rng(T.hash(seed + 'cl')), speed = bg.wind ?? 8, o = OV(), span = W + o * 2 + 600, P = T.PAINT;
      for (let i = 0; i < n; i++) {
        const x = ((r() * span + lt * speed * (0.6 + r())) % span) - o - 300, y = H * (0.08 + r() * 0.34), w = 300 + r() * 300;
        cumulus(ctx, x, y, w * (0.8 + (y / H) * 0.6), seed + 'c' + i, pal, P); // lower clouds are nearer: larger
      }
      for (let i = 0; i < n * 2; i++) {
        const x = ((r() * (W + o * 2) + lt * speed * 1.6) % (W + o * 2)) - o;
        wisp(ctx, x, H * (0.05 + r() * 0.5), 120 + r() * 220, pal.wisp, seed + 'w' + i);
      }
    },
    // Ridge texture: grass strokes fading with distance.
    ridge(ctx, path, haze) { T.fillTexture(ctx, path, 'grass', { alpha: 0.55 * (1 - haze), scale: 0.8, seed: 2 }); },
    // Ground: lit near the horizon, darker toward the camera, grass strokes, AO under the horizon line, 2-tone tufts.
    ground(ctx, bg, pal, gy, seed) {
      const P = T.PAINT, o = OV(), kind = bg.ground ?? 'grass';
      const tex = { grass: 'grass', sand: 'paper', stone: 'stone', dirt: 'stone', snow: 'paper', paddy: 'water' }[kind] || 'grass';
      const g = ctx.createLinearGradient(0, gy, 0, H + 40); // nearer ground falls into shade (multiply keeps saturation)
      const amb = T.shade(P.light.ambient, -0.2);
      g.addColorStop(0, rgba(amb, 0)); g.addColorStop(0.3, rgba(amb, 0)); g.addColorStop(1, rgba(amb, 0.35));
      ctx.fillStyle = g; ctx.fillRect(-o, gy, W + o * 2, H - gy + o);
      T.fillTexture(ctx, null, tex, { rect: [-o, gy, W + o * 2, H - gy + o], alpha: 0.75, scale: 1.1, seed: 3 });
      const ao = ctx.createLinearGradient(0, gy, 0, gy + 46);
      ao.addColorStop(0, rgba('#1a1020', 0.28)); ao.addColorStop(1, rgba('#1a1020', 0));
      ctx.fillStyle = ao; ctx.fillRect(-o, gy, W + o * 2, 46);
      if (kind !== 'grass') return;
      const r = T.rng(T.hash(seed + 'tufts')), dark = T.shade(pal.ground, -0.3), light = T.mix(pal.ground, P.light.color, 0.45);
      for (let i = 0; i < 64; i++) {
        const x = r() * (W + o * 2) - o, d = r(), y = gy + 8 + d * d * (H - gy), s = 0.5 + d * 1.2;
        for (const [c, off] of [[dark, 0], [light, -3 * s]]) {
          ctx.fillStyle = c; ctx.beginPath();
          ctx.moveTo(x - 14 * s, y); ctx.quadraticCurveTo(x - 10 * s, y - 14 * s, x - 16 * s + off, y - 28 * s);
          ctx.quadraticCurveTo(x - 4 * s, y - 14 * s, x, y - 4 * s); ctx.quadraticCurveTo(x + 2 * s, y - 22 * s, x + off * 0.5, y - 36 * s);
          ctx.quadraticCurveTo(x + 8 * s, y - 18 * s, x + 6 * s, y - 4 * s); ctx.quadraticCurveTo(x + 12 * s, y - 14 * s, x + 18 * s + off, y - 24 * s);
          ctx.quadraticCurveTo(x + 14 * s, y - 8 * s, x + 14 * s, y); ctx.closePath(); ctx.fill();
        }
      }
    },
  };

  // Surface texture for a rect inside a background function (drawn before the set dressing on top of it).
  // Walls get a ceiling falloff as well. kind: a T.TEXTURES name.
  T.paintSurface = (ctx, kind, rect, bg = {}) => {
    if (kind === 'plaster') {
      const g = ctx.createLinearGradient(0, rect[1], 0, rect[1] + rect[3]);
      g.addColorStop(0, rgba('#2a1408', 0.28)); g.addColorStop(0.55, rgba('#2a1408', 0));
      ctx.fillStyle = g; ctx.fillRect(rect[0], rect[1], rect[2], rect[3]);
    }
    T.fillTexture(ctx, null, kind, { rect, alpha: kind === 'plaster' ? 0.45 : 0.6, scale: kind === 'wood' ? 1.2 : 1, seed: bg.seed ?? 0 });
  };

  // ---------- surfaces per background kind (textures in the background's own camera plane) ----------
  const cam = (ctx, env, f, fn) => { ctx.save(); T.applyCam(ctx, env.cam, f); fn(); ctx.restore(); };
  const band = (y0, y1) => [-OV() - 200, y0, W + OV() * 2 + 400, y1 - y0];
  const tex = (ctx, kind, rect, o = {}) => T.fillTexture(ctx, null, kind, { rect, alpha: 0.55, ...o });
  T.BG_SURFACES = {
    office: (ctx, bg, env) => cam(ctx, env, 0.85, () => tex(ctx, 'fabric', band((bg.floorY ?? 0.78) * H, H + OV()), { alpha: 0.6 })),
    room: (ctx, bg, env) => cam(ctx, env, 0.85, () => tex(ctx, 'plaster', band(-OV(), H * 0.7), { alpha: 0.5 })),
    palace: (ctx, bg, env) => cam(ctx, env, 0.85, () => tex(ctx, 'plaster', band(-OV(), H * 0.75), { alpha: 0.5 })),
    hospital: (ctx, bg, env) => cam(ctx, env, 0.85, () => tex(ctx, 'plaster', band(-OV(), H * 0.75), { alpha: 0.45 })),
    cell: (ctx, bg, env) => cam(ctx, env, 0.85, () => tex(ctx, 'stone', band(-OV(), H + OV()), { alpha: 0.45 })),
    corridor: (ctx, bg, env) => cam(ctx, env, 0.85, () => tex(ctx, 'plaster', band(-OV(), H + OV()), { alpha: 0.4 })),
    stage: (ctx, bg, env) => cam(ctx, env, 0.9, () => tex(ctx, 'fabric', band(-OV(), H * 0.8), { alpha: 0.4 })),
    factory: (ctx, bg, env) => cam(ctx, env, 1, () => tex(ctx, 'stone', band(H * (bg.horizon ?? 0.72) + 30, H + OV()), { alpha: 0.7 })),
    street1920: (ctx, bg, env) => cam(ctx, env, 1, () => tex(ctx, 'stone', band(H * (bg.horizon ?? 0.7), H + OV()), { alpha: 0.75, scale: 0.9 })),
    city: (ctx, bg, env) => cam(ctx, env, 1, () => tex(ctx, 'stone', band(H * 0.8, H + OV()), { alpha: 0.5 })),
    sea: (ctx, bg, env) => cam(ctx, env, 1, () => tex(ctx, 'water', band(H * 0.55, H + OV()), { alpha: 0.6 })),
    harbor: (ctx, bg, env) => cam(ctx, env, 1, () => tex(ctx, 'water', band(H * 0.7, H + OV()), { alpha: 0.5 })),
    parchment: (ctx, bg, env) => cam(ctx, env, bg.z ?? 1, () => tex(ctx, 'paper', band(-OV(), H + OV()), { alpha: 0.9, scale: 1.4 })),
    desert: (ctx, bg, env) => cam(ctx, env, 1, () => tex(ctx, 'paper', band(H * 0.66, H + OV()), { alpha: 0.6, scale: 1.6 })),
    battlefield: (ctx, bg, env) => cam(ctx, env, 1, () => tex(ctx, 'grass', band(H * 0.66, H + OV()), { alpha: 0.5 })),
  };

  // Floor line (fraction of H) of interior sets: the wall-floor contact gets an occlusion band.
  T.BG_FLOOR = { interior: (bg) => bg.floorY ?? 0.78, office: (bg) => bg.floorY ?? 0.78, stage: () => 0.8, palace: () => 0.78, hospital: () => 0.78, bar: () => 0.8 };

  // After the backgrounds (core.js): per-kind surface textures and the floor occlusion band of interior sets.
  T.paintBg = (ctx, shot, lt, env) => {
    const P = T.PAINT, k = P.light.intensity, bgs = Array.isArray(shot.bg) ? shot.bg : [shot.bg || { kind: 'sky' }];
    for (const bg of bgs) {
      if (T.isRich && T.isRich(bg)) continue; // Places 2.0 kinds texture their own surfaces under the set dressing
      const kind = bg.kind || (bg.image ? 'image' : 'sky'), f = T.BG_SURFACES[kind], fl = T.BG_FLOOR[kind];
      const depth = T.BG_DEPTH;
      T.BG_DEPTH = bg.parallax ?? null; // the surface moves with its background's planes
      try {
      if (f) { ctx.save(); f(ctx, bg, env); ctx.restore(); }
      if (fl) cam(ctx, env, 0.85, () => {
        const fy = fl(bg) * H, o = OV(), up = ctx.createLinearGradient(0, fy - 90, 0, fy), dn = ctx.createLinearGradient(0, fy, 0, fy + 70);
        up.addColorStop(0, rgba('#1a1020', 0)); up.addColorStop(1, rgba('#1a1020', 0.32));
        dn.addColorStop(0, rgba('#1a1020', 0.38)); dn.addColorStop(1, rgba('#1a1020', 0));
        ctx.fillStyle = up; ctx.fillRect(-o, fy - 90, W + o * 2, 90); ctx.fillStyle = dn; ctx.fillRect(-o, fy, W + o * 2, 70);
      });
      } finally { T.BG_DEPTH = depth; }
    }
  };

  // Whole frame, before the grade: key-light wash on the light side falling off to a cool, darker far side.
  T.paintPost = (ctx, lt, env) => {
    const P = T.PAINT, k = P.light.intensity, [lo, vw] = T.visibleSpan(env), cx = lo + vw / 2, cy = H / 2, R = Math.hypot(vw, H) * 0.55;
    const g = ctx.createLinearGradient(cx + P.wx * R, cy + P.wy * R, cx - P.wx * R, cy - P.wy * R); // one pass: warm key -> cool far side
    const amb = T.shade(P.light.ambient, -0.25);
    g.addColorStop(0, rgba(P.light.color, 0.08 * k)); g.addColorStop(0.35, rgba(P.light.color, 0)); g.addColorStop(0.5, rgba(amb, 0)); g.addColorStop(1, rgba(amb, 0.42 * k));
    ctx.fillStyle = g; ctx.fillRect(lo, 0, vw, H);
  };
})();
