// depth.js — Places 2.0 plumbing for the painted look: depth planes with parallax and atmospheric haze, a cache of
// static planes and sprites in offscreen canvases, ambience helpers (light shafts, dust motes, lamp pools, sway) and
// T.richBg, which gives a background kind a richer painted version while the classic look keeps its original function
// (T.CLASSIC_BGS). Every cached canvas is a pure function of its key, so frames never depend on render order.
(function () {
  'use strict';
  const T = window.TOON, W = T.W, H = T.H, TAU = Math.PI * 2;
  const M = 360; // plane margin around the frame (camera drift and zoom-out)
  T.PLANE_MARGIN = M;
  const rgba = (hex, a) => { const n = parseInt(T.hex6(hex).slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${T.clamp(a).toFixed(3)})`; };
  T.rgba = T.rgba || rgba;

  // ---------- offscreen cache (LRU by count and pixels) ----------
  const cache = new Map();
  let pixels = 0;
  const MAX_N = 48, MAX_PX = 64e6;
  const put = (key, c) => {
    cache.set(key, c); pixels += c.width * c.height;
    for (const [k, v] of cache) { if (cache.size <= MAX_N && pixels <= MAX_PX) break; if (k === key) continue; cache.delete(k); pixels -= v.width * v.height; }
  };
  const get = (key) => { const c = cache.get(key); if (c) { cache.delete(key); cache.set(key, c); } return c; };
  T.clearPlaneCache = () => { cache.clear(); pixels = 0; };
  T.planeCacheSize = () => cache.size;

  // Highest camera zoom of a shot (sampled), so cached planes keep their detail when the camera pushes in.
  const zooms = new WeakMap();
  const maxZoom = (shot) => {
    if (!shot) return 1;
    if (zooms.has(shot)) return zooms.get(shot);
    let z = 1;
    for (let i = 0; i <= 24; i++) { const c = T.cameraAt(shot.camera, (shot.dur * i) / 24, shot.dur); if (c && c.z > z) z = c.z; }
    zooms.set(shot, z);
    return z;
  };
  const lightKey = () => (T.PAINT ? JSON.stringify(T.PAINT.light) : 'classic');
  const keys = new WeakMap();
  T.bgKey = (bg) => { let k = keys.get(bg); if (!k) { k = JSON.stringify(bg); keys.set(bg, k); } return k; };

  // A depth plane: draw(ctx) in world coordinates under the camera at parallax factor o.f. In the painted look a plane
  // with a key is rendered once into an offscreen canvas (o.haze 0..1 bakes atmospheric haze of o.hazeColor over its
  // pixels; o.mist: [y0, y1] fades the haze in from y0 down to y1) and blitted every frame. o.live: draw every frame.
  T.plane = (ctx, env, o, draw) => {
    const f = o.f ?? 1;
    ctx.save();
    T.applyCam(ctx, env.cam, f);
    if (!T.PAINT || o.key == null || o.live) {
      draw(ctx);
      if (T.PAINT && o.haze > 0 && o.liveHaze) hazeRect(ctx, o, env);
      ctx.restore();
      return;
    }
    const fe = T.depthF(f), q = Math.min(2, Math.ceil((1 + (maxZoom(env.shot) - 1) * Math.max(0, fe)) * 8) / 8);
    const res = (env.dpr || 1) * q, haze = T.clamp(o.haze ?? 0), col = haze > 0 ? T.hex6(o.hazeColor ?? T.atmosColor(env)) : '';
    const key = `${o.key}|${res}|${lightKey()}|${haze.toFixed(3)}${col}|${o.mist || ''}`;
    let c = get(key);
    if (!c) {
      c = document.createElement('canvas');
      c.width = Math.ceil((W + M * 2) * res); c.height = Math.ceil((H + M * 2) * res);
      const g = c.getContext('2d');
      g.setTransform(res, 0, 0, res, M * res, M * res);
      draw(g);
      if (haze > 0) {
        g.save(); g.globalCompositeOperation = 'source-atop';
        if (o.mist) { const gr = g.createLinearGradient(0, o.mist[0], 0, o.mist[1]); gr.addColorStop(0, rgba(col, haze * 0.35)); gr.addColorStop(1, rgba(col, haze)); g.fillStyle = gr; }
        else g.fillStyle = rgba(col, haze);
        g.fillRect(-M, -M, W + M * 2, H + M * 2); g.restore();
      }
      put(key, c);
    }
    ctx.drawImage(c, -M, -M, W + M * 2, H + M * 2);
    ctx.restore();
  };
  function hazeRect(ctx, o, env) {
    ctx.fillStyle = rgba(o.hazeColor ?? T.atmosColor(env), o.haze); ctx.fillRect(-M, -M, W + M * 2, H + M * 2);
  }

  // A cached sprite: draw(g) in a local box [x0, y0, w, h] (anchor at 0, 0), rendered once at the frame's resolution
  // (times o.q for zoomed shots). T.drawSprite blits it under the current transform; use it for elements that only
  // move rigidly (swaying trees, lamps, boats bobbing).
  T.sprite = (key, box, draw, res) => {
    const k = `spr|${key}|${res}|${lightKey()}`;
    let c = get(k);
    if (!c) {
      const [x0, y0, w, h] = box;
      c = document.createElement('canvas');
      c.width = Math.max(1, Math.ceil(w * res)); c.height = Math.max(1, Math.ceil(h * res));
      const g = c.getContext('2d');
      g.setTransform(res, 0, 0, res, -x0 * res, -y0 * res);
      draw(g);
      c.box = box;
      put(k, c);
    }
    return c;
  };
  T.drawSprite = (ctx, env, key, box, draw) => {
    if (!T.PAINT) { draw(ctx); return; }
    const q = Math.min(2, Math.ceil(maxZoom(env.shot) * 4) / 4);
    const c = T.sprite(key, box, draw, (env.dpr || 1) * q);
    ctx.drawImage(c, box[0], box[1], box[2], box[3]);
  };

  // ---------- ambience (pure functions of time) ----------
  T.sway = (lt, seed, hz = 0.35, amp = 1) => (Math.sin(lt * TAU * hz + (T.hash(String(seed)) % 628) / 100) * 0.7 + Math.sin(lt * TAU * hz * 2.3 + (T.hash(seed + 'b') % 628) / 100) * 0.3) * amp;
  T.flicker = (lt, seed, amt = 0.08) => 1 + (T.noise(Math.floor(lt * 15) * 0.9, String(seed)) * 0.7 + Math.sin(lt * 23 + (T.hash(String(seed)) % 50)) * 0.3) * amt;

  // Light shaft from a window: quad from the window's lit edge [x0, y0]-[x1, y1] cast along (dx, dy) for len px,
  // fading out; screen-blended so it brightens whatever it falls on.
  T.lightShaft = (ctx, x0, y0, x1, y1, dx, dy, len, color = '#fff2c8', a = 0.22) => {
    const n = Math.hypot(dx, dy) || 1, ux = (dx / n) * len, uy = (dy / n) * len;
    const g = ctx.createLinearGradient((x0 + x1) / 2, (y0 + y1) / 2, (x0 + x1) / 2 + ux, (y0 + y1) / 2 + uy);
    g.addColorStop(0, rgba(color, a)); g.addColorStop(0.6, rgba(color, a * 0.45)); g.addColorStop(1, rgba(color, 0));
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.lineTo(x1 + ux, y1 + uy); ctx.lineTo(x0 + ux, y0 + uy); ctx.closePath(); ctx.fill();
    ctx.restore();
  };
  // Dust motes drifting in a region (optionally clipped to a path): closed-form positions, twinkling alpha.
  T.dustMotes = (ctx, x, y, w, h, lt, seed, o = {}) => {
    const r = T.rng(T.hash('dust' + seed)), n = o.n ?? 40, col = o.color ?? '#fff6dc', drift = o.drift ?? 14;
    ctx.save();
    if (o.clip) { ctx.beginPath(); o.clip(ctx); ctx.clip(); }
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < n; i++) {
      const u = r(), v = r(), sp = 0.4 + r(), ph = r() * TAU, s = (o.size ?? 3) * (0.5 + r());
      const px = x + ((((u * w + lt * drift * sp + Math.sin(lt * 0.7 + ph) * 18) % w) + w) % w);
      const py = y + ((((v * h - lt * drift * 0.45 * sp) % h) + h) % h);
      ctx.fillStyle = rgba(col, (o.alpha ?? 0.7) * (0.35 + 0.65 * Math.abs(Math.sin(lt * 1.3 * sp + ph))));
      ctx.beginPath(); ctx.arc(px, py, s, 0, TAU); ctx.fill();
    }
    ctx.restore();
  };
  // Soft rising smoke (chimneys, steam): looping puffs that grow, drift and fade, lit on one side; no outlines.
  T.softSmoke = (ctx, x, y, lt, o = {}) => {
    const r = T.rng(T.hash('smoke' + (o.seed ?? ''))), n = o.n ?? 6, col = T.hex6(o.color ?? '#d8d4cc'), size = o.size ?? 34, rise = o.rise ?? 220, drift = o.drift ?? 80;
    const lit = T.mix(col, '#fff8e8', 0.5), dark = T.shade(col, -0.25);
    for (let i = 0; i < n; i++) {
      const life = 2.2 + r() * 1.2, ph = (((lt + (i / n) * life) % life) + life) % life / life, jx = (r() - 0.5) * 16;
      const px = x + jx + ph * drift + Math.sin(lt * 0.8 + i) * 8 * ph, py = y - ph * rise, s = size * (0.45 + ph * 1.1), a = (o.alpha ?? 0.75) * Math.min(1, ph * 6) * (1 - ph);
      if (a <= 0.01) continue;
      for (const [c, dx, dy, k] of [[dark, s * 0.12, s * 0.12, 1], [col, 0, 0, 0.9], [lit, -s * 0.18, -s * 0.2, 0.55]]) {
        ctx.fillStyle = rgba(c, a); ctx.beginPath(); ctx.arc(px + dx, py + dy, s * k, 0, TAU); ctx.fill();
      }
    }
  };
  // Warm pool of light (lamps, fires): soft radial glow, optionally flickering, screen-blended.
  T.lampPool = (ctx, x, y, r, color = '#ffd890', a = 0.4, lt = 0, seed = null) => {
    const k = seed == null ? 1 : T.flicker(lt, seed, 0.06), rr = r * k;
    if (rr <= 0) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rr);
    g.addColorStop(0, rgba(color, a * k)); g.addColorStop(0.4, rgba(color, a * 0.45 * k)); g.addColorStop(1, rgba(color, 0));
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = g; ctx.fillRect(x - rr, y - rr, rr * 2, rr * 2); ctx.restore();
  };

  // ---------- rich painted versions of existing kinds ----------
  T.CLASSIC_BGS = T.CLASSIC_BGS || {};
  T.RICH_BGS = T.RICH_BGS || new Set();
  // rich(ctx, bg, lt, env, classic) draws the kind in the painted look; bg.rich: false keeps the Phase 1 painting.
  T.richBg = (kind, rich) => {
    const classic = T.CLASSIC_BGS[kind] || T.bgs[kind];
    if (!classic) throw new Error(`richBg: unknown bg kind "${kind}"`);
    T.CLASSIC_BGS[kind] = classic;
    T.RICH_BGS.add(kind);
    T.bgs[kind] = (ctx, bg, lt, env) => (T.PAINT && bg.rich !== false ? rich(ctx, bg, lt, env, classic) : classic(ctx, bg, lt, env));
  };
  T.isRich = (bg) => !!(T.PAINT && bg && bg.rich !== false && T.RICH_BGS.has(bg.kind || (bg.image ? 'image' : 'sky')) && !(bg.kind == null && bg.image) && !bg.timelapse);
  // Haze strength of a background: bg.haze multiplies the per-plane default (1).
  T.hazeOf = (bg, amount) => T.clamp(amount * (typeof bg.haze === "number" ? bg.haze : bg.haze === false ? 0 : 1));

  // bg-front honours each background's parallax multiplier, like the background pass in core.js.
  const front = T.FG['bg-front'];
  if (front) T.FG['bg-front'] = (ctx, L, lt, env) => {
    const bgs = Array.isArray(env.shot && env.shot.bg) ? env.shot.bg : [env.shot && env.shot.bg].filter(Boolean);
    const depth = T.BG_DEPTH;
    try {
      for (const bg of bgs) {
        if (!T.BG_FRONT[bg.kind]) continue;
        T.BG_DEPTH = bg.parallax ?? null;
        front(ctx, L, lt, { ...env, shot: { ...env.shot, bg } });
      }
    } finally { T.BG_DEPTH = depth; }
  };
})();
