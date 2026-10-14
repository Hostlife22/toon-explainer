// core.js — toon-explainer runtime: math helpers, seeded noise, timeline, camera, layer motion, transitions, renderFrame(t).
// All drawing happens in a fixed 1920×1080 logical space; the physical canvas may be scaled for previews.
(function () {
  'use strict';
  const T = (window.TOON = window.TOON || {});
  T.W = 1920;
  T.H = 1080;
  T.DEG = Math.PI / 180;
  T.DPR = 1;
  T.layers = T.layers || {}; // type → draw(ctx, L, lt, env)
  T.bgs = T.bgs || {}; // kind → draw(ctx, bg, lt, env)
  T.images = {};

  // ---------- math ----------
  T.clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  T.lerp = (a, b, p) => a + (b - a) * p;
  T.prog = (t, at, dur) => T.clamp((t - at) / Math.max(1e-6, dur));
  T.ease = {
    linear: (p) => p,
    in: (p) => p * p,
    out: (p) => 1 - (1 - p) * (1 - p),
    inOut: (p) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2),
    outCubic: (p) => 1 - Math.pow(1 - p, 3),
    outBack: (p) => {
      const c = 1.9;
      return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2);
    },
    outBounce: (p) => {
      const n = 7.5625, d = 2.75;
      if (p < 1 / d) return n * p * p;
      if (p < 2 / d) return n * (p -= 1.5 / d) * p + 0.75;
      if (p < 2.5 / d) return n * (p -= 2.25 / d) * p + 0.9375;
      return n * (p -= 2.625 / d) * p + 0.984375;
    },
  };
  T.easeBy = (name) => T.ease[name] || T.ease.inOut;

  // ---------- deterministic randomness ----------
  T.hash = (str) => {
    let h = 2166136261 >>> 0;
    const s = String(str);
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };
  T.rng = (seed) => {
    let a = seed >>> 0 || 1;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  const cell = (i, seed) => T.rng(T.hash(seed + ':' + i))();
  // Smooth 1D value noise in [-1, 1].
  T.noise = (x, seed = 0) => {
    const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
    return T.lerp(cell(i, seed), cell(i + 1, seed), u) * 2 - 1;
  };

  // ---------- timeline ----------
  T.TRANSITION_DUR = { cut: 0, dissolve: 0.35, 'fade-white': 0.4, 'fade-black': 0.5, 'zoom-punch': 0.3, whip: 0.3, iris: 0.5 };
  T.buildTimeline = (spec) => {
    let start = 0;
    const shots = spec.shots.map((s, i) => {
      const tr = typeof s.transition === 'string' ? { kind: s.transition } : s.transition || { kind: 'cut' };
      const kind = tr.kind || 'cut';
      const shot = { ...s, index: i, start, transition: { ...tr, kind, dur: tr.dur ?? T.TRANSITION_DUR[kind] ?? 0 } };
      start += s.dur;
      return shot;
    });
    return { shots, total: start };
  };
  T.shotAt = (tl, t) => {
    const { shots } = tl;
    for (let i = shots.length - 1; i >= 0; i--) if (t >= shots[i].start - 1e-6) return i; // starts are float sums
    return 0;
  };

  // ---------- camera ----------
  // camera: { zoom:[from,to], pan:[[x0,y0],[x1,y1]] (px), focus:[nx,ny], ease, punch:[{at,amount}], shake:[{at,dur,amp}], rot:[from,to] }
  T.cameraAt = (cam, lt, dur) => {
    const c = cam || {};
    const e = T.easeBy(c.ease || 'linear')(T.prog(lt, c.at ?? 0, c.dur ?? dur));
    const zoom = c.zoom || [1, 1.04];
    let z = T.lerp(zoom[0], zoom[1], e);
    const pan = c.pan || [[0, 0], [0, 0]];
    const px = T.lerp(pan[0][0], pan[1][0], e), py = T.lerp(pan[0][1], pan[1][1], e);
    for (const k of c.punch || []) {
      const d = lt - k.at;
      if (d >= 0) z *= 1 + (k.amount ?? 0.15) * (d < 0.08 ? d / 0.08 : Math.exp(-(d - 0.08) * 7));
    }
    let sx = 0, sy = 0;
    for (const s of c.shake || []) {
      const d = lt - s.at;
      if (d >= 0 && d <= s.dur) {
        const amp = (s.amp ?? 18) * (1 - d / s.dur);
        sx += T.noise(lt * 30, 'sx' + s.at) * amp;
        sy += T.noise(lt * 30, 'sy' + s.at) * amp;
      }
    }
    const rot = c.rot ? T.lerp(c.rot[0], c.rot[1], e) * T.DEG : 0;
    const focus = c.focus || [0.5, 0.5];
    return { z, px, py, sx, sy, rot, fx: focus[0] * T.W, fy: focus[1] * T.H };
  };
  // Apply camera with a parallax factor f (0 = locked to screen, 1 = full camera).
  T.applyCam = (ctx, cam, f = 1) => {
    if (!cam || f === 0) return;
    const z = 1 + (cam.z - 1) * f;
    ctx.translate(cam.fx + cam.sx, cam.fy + cam.sy);
    ctx.rotate(cam.rot * f);
    ctx.scale(z, z);
    ctx.translate(-cam.fx - cam.px * f, -cam.fy - cam.py * f);
  };

  // ---------- layer motion ----------
  const ENTER_DUR = 0.32;
  // Entrances with their own measured timing (reference: drop + squash settles in ~12 frames, pop-tilt in 6, slam in 3).
  const ENTER_DUR_BY_KIND = { 'drop-squash': 0.5, 'pop-tilt': 0.22, slam: 0.12 };
  // Default entrance per layer type (measured: characters/backgrounds are already there at the cut; lettering pops).
  T.DEFAULT_ENTER = { bean: 'none', image: 'none', map: 'none', fx: 'none', sign: 'none', timer: 'none', title: 'none', era: 'slide-left', caption: 'fade' };
  function enterExit(kind, p, st, isExit) {
    const q = isExit ? 1 - p : p;
    switch (kind) {
      case 'drop-squash': { // 2-frame fall, impact squash 150/55, rebound 85/115, settle
        if (isExit) { st.a *= q; return; }
        const t = p * 0.5;
        if (t < 0.067) { st.y -= (1 - t / 0.067) * T.H * 0.9; return; }
        const k = (t - 0.067) / 0.433, d = Math.exp(-k * 5) * Math.cos(k * Math.PI * 3);
        st.sx *= 1 + 0.5 * d; st.sy *= 1 - 0.45 * d; return;
      }
      case 'pop-tilt': st.s *= isExit ? T.ease.in(q) : Math.max(0, T.ease.outBack(q)); st.r += (1 - q) * (st.flip > 0 ? -5 : 5) * T.DEG; return;
      case 'slam': {
        if (isExit) { st.a *= q; return; }
        st.s *= 1 + 0.6 * (1 - T.ease.outCubic(q));
        if (q >= 1) return;
        st.a *= Math.min(1, q * 3); return;
      }
      case 'none': return;
      case 'fade': st.a *= q; return;
      case 'pop': st.s *= isExit ? T.ease.in(q) : Math.max(0, T.ease.outBack(q)); return;
      case 'drop': st.y -= (1 - (isExit ? q : T.ease.outBounce(q))) * T.H * 0.8; return;
      case 'rise': st.y += (1 - T.ease.outCubic(q)) * T.H * 0.7; return;
      case 'slide-left': st.x -= (1 - T.ease.outCubic(q)) * T.W * 0.7; return;
      case 'slide-right': st.x += (1 - T.ease.outCubic(q)) * T.W * 0.7; return;
      case 'slide-up': st.y -= (1 - T.ease.outCubic(q)) * T.H * 0.7; return;
      case 'slide-down': st.y += (1 - T.ease.outCubic(q)) * T.H * 0.7; return;
      case 'spin': st.s *= T.ease.outBack(q); st.r += (1 - q) * Math.PI * 2; return;
      default: st.s *= Math.max(0, T.ease.outBack(q));
    }
  }
  // Returns {x,y,s,r,a,flip} for a layer at shot-local time lt, or null when not visible.
  T.layerState = (L, lt) => {
    const at = L.at ?? 0, out = L.out ?? Infinity;
    const enterKind = L.enter || T.DEFAULT_ENTER[L.type] || 'pop';
    const ed = L.enterDur ?? ENTER_DUR_BY_KIND[enterKind] ?? ENTER_DUR, xd = L.exitDur ?? 0.25;
    if (lt < at || lt > out + xd) return null;
    const st = { x: (L.x ?? 0.5) * T.W, y: (L.y ?? 0.5) * T.H, s: L.scale ?? 1, r: (L.rot ?? 0) * T.DEG, a: L.alpha ?? 1, flip: L.flip ? -1 : 1, sx: 1, sy: 1 };
    for (const m of L.move || []) {
      const p = T.easeBy(m.ease || 'inOut')(T.prog(lt, m.at ?? 0, m.dur ?? 0.6));
      if (p <= 0) continue;
      if (m.to) { st.x = T.lerp(st.x, m.to[0] * T.W, p); st.y = T.lerp(st.y, m.to[1] * T.H, p); }
      if (m.scale != null) st.s = T.lerp(st.s, m.scale, p);
      if (m.rot != null) st.r = T.lerp(st.r, m.rot * T.DEG, p);
      if (m.alpha != null) st.a = T.lerp(st.a, m.alpha, p);
      if (m.flip != null && p >= 1) st.flip = m.flip ? -1 : 1;
    }
    const seed = L.id || L.type + (L.x ?? 0) + (L.y ?? 0);
    if (L.bob) st.y += Math.sin((lt + (T.hash(seed) % 100) / 37) * Math.PI * 2 * (L.bobHz ?? 0.8)) * L.bob;
    if (L.sway) st.r += Math.sin(lt * Math.PI * 2 * (L.swayHz ?? 0.5)) * L.sway * T.DEG;
    if (L.wobble) { st.x += T.noise(lt * 6, seed + 'wx') * L.wobble; st.y += T.noise(lt * 6, seed + 'wy') * L.wobble; }
    for (const s of L.shake || []) {
      const d = lt - s.at;
      if (d >= 0 && d <= (s.dur ?? 0.4)) st.x += Math.sin(d * 70) * (s.amp ?? 12) * (1 - d / (s.dur ?? 0.4));
    }
    for (const j of L.jump || []) {
      const p = T.prog(lt, j.at, j.dur ?? 0.45);
      if (p > 0 && p < 1) st.y -= Math.sin(p * Math.PI) * (j.h ?? 120);
    }
    st.bx = st.x; st.by = st.y; // anchor before entrance/exit offsets (used by the safe-frame clamp)
    enterExit(enterKind, T.prog(lt, at, ed), st, false);
    if (enterKind === 'slam') { const d = lt - at - ed; if (d >= 0 && d < 0.2) { st.x += Math.sin(d * 90) * 14 * (1 - d / 0.2); st.y += Math.cos(d * 70) * 8 * (1 - d / 0.2); } }
    if (lt > out) enterExit(L.exit || 'fade', T.prog(lt, out, xd), st, true);
    return st.a <= 0 || st.s <= 0 ? null : st;
  };

  // ---------- drawing a shot ----------
  const HUD_DEFAULT = { era: true, timer: true, date: false, title: false };
  T.drawShot = (ctx, shot, lt, env) => {
    ctx.save();
    ctx.setTransform(env.dpr, 0, 0, env.dpr, 0, 0);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, T.W, T.H);
    const cam = T.cameraAt(shot.camera, lt, shot.dur);
    const shotEnv = { ...env, cam, shot, seed: (env.seed || 1) + ':' + shot.id };
    const bgs = Array.isArray(shot.bg) ? shot.bg : [shot.bg || { kind: 'sky' }];
    for (const bg of bgs) {
      const draw = T.bgs[bg.kind || (bg.image ? 'image' : 'sky')];
      if (!draw) throw new Error(`Unknown bg kind "${bg.kind}" in shot ${shot.id}`);
      ctx.save();
      draw(ctx, bg, lt, shotEnv);
      ctx.restore();
    }
    for (const L of shot.layers || []) {
      const draw = T.layers[L.type];
      if (!draw) throw new Error(`Unknown layer type "${L.type}" in shot ${shot.id}`);
      const st = T.layerState(L, lt);
      if (!st) continue;
      const hud = L.hud ?? HUD_DEFAULT[L.type] ?? false;
      const paint = (c) => {
        c.save();
        if (!hud) T.applyCam(c, cam, L.z ?? 1);
        c.translate(st.x, st.y);
        c.rotate(st.r);
        c.scale(st.s * st.flip * st.sx, st.s * st.sy);
        draw(c, L, lt - (L.at ?? 0), { ...shotEnv, st, lt });
        c.restore();
      };
      ctx.save();
      ctx.globalAlpha *= st.a;
      if ((L.glow || L.silhouette || L.lineart) && T.modLayer) T.modLayer(ctx, L, lt, env, paint);
      else paint(ctx);
      ctx.restore();
    }
    if (T.post) T.post(ctx, lt, shotEnv);
    ctx.restore();
  };

  // ---------- transitions ----------
  function blit(ctx, src, alpha = 1, sx = 1, ox = 0, oy = 0) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = alpha;
    const w = ctx.canvas.width, h = ctx.canvas.height;
    ctx.translate(w / 2 + ox, h / 2 + oy);
    ctx.scale(sx, sx);
    ctx.drawImage(src, -w / 2, -h / 2, w, h);
    ctx.restore();
  }
  function overlay(ctx, color, alpha) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = T.clamp(alpha);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.restore();
  }
  T.transitions = {
    dissolve: (ctx, a, b, p) => { blit(ctx, a); blit(ctx, b, T.ease.inOut(p)); },
    'fade-white': (ctx, a, b, p) => { blit(ctx, p < 0.5 ? a : b); overlay(ctx, '#fffaf0', 1 - Math.abs(p * 2 - 1)); },
    'fade-black': (ctx, a, b, p) => { blit(ctx, p < 0.5 ? a : b); overlay(ctx, '#000', 1 - Math.abs(p * 2 - 1)); },
    'zoom-punch': (ctx, a, b, p) => {
      if (p < 0.5) { const q = p * 2; blit(ctx, a, 1, 1 + T.ease.in(q) * 0.9); overlay(ctx, '#fff', q * 0.85); }
      else { const q = (p - 0.5) * 2; blit(ctx, b, 1, 1.25 - T.ease.outCubic(q) * 0.25); overlay(ctx, '#fff', (1 - q) * 0.85); }
    },
    whip: (ctx, a, b, p) => {
      const w = ctx.canvas.width, e = T.ease.inOut(p);
      for (let k = 0; k < 5; k++) {
        const o = (k - 2) * w * 0.025;
        blit(ctx, a, 0.3, 1, -e * w + o);
        blit(ctx, b, 0.3, 1, (1 - e) * w + o);
      }
    },
    iris: (ctx, a, b, p) => {
      blit(ctx, a);
      const w = ctx.canvas.width, h = ctx.canvas.height;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, T.ease.inOut(p) * Math.hypot(w, h) * 0.55, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(b, 0, 0);
      ctx.restore();
    },
  };

  // ---------- frame entry point ----------
  T.init = (spec, canvas, opts = {}) => {
    const scale = opts.scale ?? 1;
    T.DPR = scale; // shadowBlur and other device-pixel values must be multiplied by this
    canvas.width = Math.round((T.W * scale) / 2) * 2; // even sizes: libx264 yuv420p rejects odd dimensions
    canvas.height = Math.round((T.H * scale) / 2) * 2;
    const mk = () => { const c = document.createElement('canvas'); c.width = canvas.width; c.height = canvas.height; return c; };
    const bufA = mk(), bufB = mk();
    const tl = T.buildTimeline(spec);
    const env = { dpr: scale, seed: spec.seed ?? 1, spec, cast: spec.cast || {}, style: spec.style || {} };
    const ctx = canvas.getContext('2d');
    const render = (t) => {
      t = T.clamp(t, 0, Math.max(0, tl.total - 1e-6));
      const i = T.shotAt(tl, t), shot = tl.shots[i], lt = Math.max(0, t - shot.start);
      const tr = shot.transition;
      if (i > 0 && tr.dur > 0 && lt < tr.dur && T.transitions[tr.kind]) {
        const prev = tl.shots[i - 1];
        T.drawShot(bufA.getContext('2d'), prev, prev.dur + lt, env);
        T.drawShot(bufB.getContext('2d'), shot, lt, env);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height); // start from a clean frame: semi-transparent transitions (whip) must not show the previous render
        T.transitions[tr.kind](ctx, bufA, bufB, lt / tr.dur, tr);
      } else {
        T.drawShot(ctx, shot, lt, env);
      }
      return { shot: shot.id, index: i, lt };
    };
    return { render, timeline: tl };
  };

  // ---------- assets ----------
  T.collectImages = (spec) => {
    const out = new Set();
    const walk = (v, key) => {
      if (Array.isArray(v)) v.forEach((x) => walk(x, key));
      else if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => walk(x, k));
      else if (typeof v === 'string' && ['src', 'image', 'idle', 'talk', 'blink'].includes(key)) out.add(v);
    };
    walk(spec, '');
    return [...out];
  };
  T.loadImages = (srcs) => Promise.all(srcs.map((src) => new Promise((ok, fail) => {
    const im = new Image();
    im.onload = () => { T.images[src] = im; ok(); };
    im.onerror = () => fail(new Error('Image failed to load: ' + src));
    im.src = src;
  })));
  T.img = (src) => {
    const im = T.images[src];
    if (!im) throw new Error('Image not preloaded: ' + src);
    return im;
  };
})();
