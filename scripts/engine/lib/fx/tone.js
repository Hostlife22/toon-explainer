// tone.js — tone tools: pixel helpers, per-layer modifiers (glow / silhouette / lineart) and the comic and
// horror transitions measured on the reference library (inkblot, slash, peephole, sepia-to-color, torn-split,
// barwipe, flash-cut). FX kinds live in tone-fx.js.
(function () {
  'use strict';
  const T = window.TOON, W = T.W, H = T.H;

  // ---------- scratch canvases (cached by size) ----------
  const pool = {};
  T.scratch = (name, w, h) => {
    let c = pool[name];
    if (!c) { c = pool[name] = document.createElement('canvas'); }
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    const k = c.getContext('2d', { willReadFrequently: name.startsWith('px') });
    if (k.__saved) k.restore(); // drop any clip or state a previous user left behind
    k.save(); k.__saved = true;
    k.setTransform(1, 0, 0, 1, 0, 0);
    k.globalAlpha = 1;
    k.globalCompositeOperation = 'source-over';
    k.filter = 'none';
    return [c, k];
  };

  // Run fn(data, w, h) over the physical pixels of ctx's canvas (optionally a sub-rect in physical px).
  T.pixels = (ctx, fn, rect) => {
    const cv = ctx.canvas;
    const [x, y, w, h] = rect || [0, 0, cv.width, cv.height];
    if (w <= 0 || h <= 0) return;
    const img = ctx.getImageData(x, y, w, h);
    fn(img.data, w, h);
    ctx.putImageData(img, x, y);
  };

  // Copy of what has been drawn so far (physical size).
  T.snapshot = (ctx, name = 'snap') => {
    const [c, k] = T.scratch(name, ctx.canvas.width, ctx.canvas.height);
    k.clearRect(0, 0, c.width, c.height);
    k.drawImage(ctx.canvas, 0, 0);
    return c;
  };

  // ---------- per-layer modifiers ----------
  // L.glow: true | {color, blur, pulse}   — soft outer glow (gods, relics, ghosts)
  // L.silhouette: "#hex"                  — flat single-color shape (shadow figures, audience, threat in the dark)
  // L.lineart: true | {color, width}      — outline only on black (inverted line-art memory world)
  // Registered in core.js T.LAYER_MODS (order: silhouette 10, lineart 20, glow 90; blur from core.js is 95).
  T.LAYER_MODS.silhouette = {
    order: 10,
    when: (L) => !(L.type === 'crowd' && L.silhouette === true), // a crowd draws its own depth-tinted silhouettes
    apply: (c, L) => {
      const o = c.getContext('2d');
      o.globalCompositeOperation = 'source-in';
      o.fillStyle = L.silhouette;
      o.fillRect(0, 0, c.width, c.height);
      o.globalCompositeOperation = 'source-over';
      return c;
    },
  };
  T.LAYER_MODS.lineart = {
    order: 20,
    // Outline = dilated alpha minus alpha, computed at half resolution above 1000 px wide (8 full-size blits are slow).
    apply: (c, L, lt, env, depth) => {
      const w = c.width, h = c.height, k = env.dpr || 1;
      const hs = w > 1000 ? 0.5 : 1, ew = Math.round(w * hs), eh = Math.round(h * hs);
      const lw = Math.max(1, (L.lineart.width ?? 4) * k * hs);
      const [sm, so] = T.scratch('mod-small' + depth, ew, eh);
      so.clearRect(0, 0, ew, eh); so.drawImage(c, 0, 0, ew, eh);
      const [e, eo] = T.scratch('mod-edge' + depth, ew, eh);
      eo.clearRect(0, 0, ew, eh);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        eo.drawImage(sm, Math.cos(a) * lw, Math.sin(a) * lw);
      }
      eo.globalCompositeOperation = 'destination-out';
      eo.drawImage(sm, 0, 0);
      eo.globalCompositeOperation = 'source-in';
      eo.fillStyle = L.lineart.color ?? '#ffffff';
      eo.fillRect(0, 0, ew, eh);
      return e;
    },
  };
  T.LAYER_MODS.glow = {
    order: 90,
    under: (ctx, src, L, lt, env) => {
      const g = L.glow === true ? {} : L.glow, k = env.dpr || 1, w = ctx.canvas.width, h = ctx.canvas.height;
      const pulse = 1 + Math.sin(lt * Math.PI * 2 * 0.5) * (g.pulse ?? 0.1);
      ctx.filter = `drop-shadow(0 0 ${Math.round((g.blur ?? 34) * k * pulse)}px ${g.color ?? '#fffbe6'})`;
      ctx.drawImage(src, 0, 0, w, h);
      ctx.filter = 'none';
    },
  };

  // ---------- transitions (ctx = physical output, a/b = prev/next shot canvases, p = 0..1, tr = spec params) ----------
  const blit = (ctx, src, alpha = 1) => { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = alpha; ctx.drawImage(src, 0, 0); ctx.restore(); };
  const physical = (ctx) => { const s = ctx.canvas.width / W; ctx.save(); ctx.setTransform(s, 0, 0, s, 0, 0); return s; };

  // Splat with swirl arms (inkblot): radius r around (cx, cy), deterministic by seed.
  function splatPath(ctx, cx, cy, r, seed, keep = false) {
    const rr = T.rng(T.hash(seed)), n = 36, pts = [];
    const arms = [0, 1, 2, 3, 4].map(() => ({ a: rr() * Math.PI * 2, len: 0.35 + rr() * 0.5, w: 0.12 + rr() * 0.1 }));
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      let k = 0.8 + rr() * 0.25;
      for (const arm of arms) {
        const d = Math.atan2(Math.sin(a - arm.a), Math.cos(a - arm.a));
        k += arm.len * Math.exp(-(d * d) / (arm.w * arm.w));
      }
      pts.push([cx + Math.cos(a + k * 0.08) * r * k, cy + Math.sin(a + k * 0.08) * r * k]);
    }
    if (!keep) ctx.beginPath(); // keep=true appends the splat to the current path (for evenodd holes)
    T.smoothPath(ctx, pts);
  }

  Object.assign(T.TRANSITION_DUR, { inkblot: 0.8, slash: 0.35, peephole: 0.9, 'sepia-to-color': 1.0, 'torn-split': 0.35, barwipe: 0.6, 'flash-cut': 0.1 });

  Object.assign(T.transitions, {
    // Black ink splat grows from a point (default: frame center) and the next scene opens through its middle.
    inkblot: (ctx, a, b, p, tr = {}) => {
      const [fx, fy] = tr.at || [0.5, 0.5], cx = fx * W, cy = fy * H, R = Math.hypot(W, H) * 0.62;
      if (p < 0.5) {
        blit(ctx, a);
        physical(ctx);
        ctx.fillStyle = tr.color ?? '#050403';
        splatPath(ctx, cx, cy, R * T.ease.in(p * 2), 'inkblot' + fx + fy);
        ctx.fill();
        ctx.restore();
      } else {
        blit(ctx, b);
        physical(ctx);
        ctx.fillStyle = tr.color ?? '#050403';
        ctx.beginPath(); ctx.rect(-50, -50, W + 100, H + 100);
        splatPath(ctx, cx, cy, R * T.ease.out((p - 0.5) * 2) * 1.1, 'inkblot-hole' + fx, true);
        ctx.fill('evenodd');
        ctx.restore();
      }
    },

    // Three white blade streaks sweep the frame, a red jagged brush band covers the cut.
    slash: (ctx, a, b, p) => {
      blit(ctx, p < 0.55 ? a : b);
      physical(ctx);
      const e = T.ease.inOut(p);
      ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(-0.42);
      ctx.fillStyle = '#ffffff';
      [-120, 0, 110].forEach((dy, i) => {
        const x = T.lerp(-W * 1.2, W * 1.2, T.clamp(e * 1.6 - i * 0.12));
        ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.ellipse(x, dy, W * 0.35, 9 - i * 2, 0, 0, Math.PI * 2); ctx.fill();
      });
      const bw = H * 0.55 * Math.sin(Math.PI * T.clamp((p - 0.25) / 0.6));
      if (bw > 1) {
        const r = T.rng(T.hash('slash'));
        ctx.globalAlpha = 1; ctx.fillStyle = '#b3121a'; ctx.beginPath();
        ctx.moveTo(-W, -bw / 2);
        for (let x = -W; x <= W; x += 60) ctx.lineTo(x, -bw / 2 - r() * 40);
        for (let x = W; x >= -W; x -= 60) ctx.lineTo(x, bw / 2 + r() * 40);
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
      ctx.restore();
    },

    // Comic ellipse iris: closes on A with a thick rim and motion swooshes, holds black, opens on B.
    peephole: (ctx, a, b, p, tr = {}) => {
      const [fx, fy] = tr.at || [0.5, 0.5];
      const closing = p < 0.42, hold = p >= 0.42 && p < 0.58;
      const q = closing ? 1 - T.ease.in(p / 0.42) : hold ? 0 : T.ease.out((p - 0.58) / 0.42);
      blit(ctx, closing ? a : b);
      physical(ctx);
      const rx = W * 0.75 * q + 0.001, ry = H * 0.62 * q + 0.001;
      ctx.fillStyle = '#060504';
      ctx.beginPath(); ctx.rect(-50, -50, W + 100, H + 100); ctx.ellipse(fx * W, fy * H, rx, ry, 0, 0, Math.PI * 2); ctx.fill('evenodd');
      if (q > 0.02) {
        ctx.strokeStyle = '#060504'; ctx.lineWidth = 14; ctx.beginPath(); ctx.ellipse(fx * W, fy * H, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 6; ctx.lineCap = 'round';
        for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(fx * W, fy * H, rx + 28 + i * 18, ry + 28 + i * 18, 0, 0.15 + i * 0.05, 0.55 - i * 0.05); ctx.stroke(); }
      }
      ctx.restore();
    },

    // Sepia memory dissolves into the color scene; incoming layers start as blue-tinted ghosts.
    'sepia-to-color': (ctx, a, b, p) => {
      blit(ctx, a);
      const e = T.ease.inOut(p);
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = e;
      ctx.filter = `sepia(${(1 - e) * 0.9}) saturate(${0.4 + e * 0.6}) hue-rotate(${(1 - e) * 160}deg)`;
      ctx.drawImage(b, 0, 0);
      ctx.restore();
    },

    // Next scene slides in behind a jagged torn-paper edge.
    'torn-split': (ctx, a, b, p, tr = {}) => {
      blit(ctx, a);
      const dir = tr.from === 'left' ? -1 : 1, e = T.ease.outCubic(p);
      physical(ctx);
      const edge = dir > 0 ? W * (1 - e) : W * e, r = T.rng(T.hash('torn'));
      const pts = [];
      for (let y = -20; y <= H + 20; y += 28) pts.push([edge + (r() - 0.5) * 34, y]);
      ctx.beginPath();
      ctx.moveTo(dir > 0 ? W + 40 : -40, -20);
      pts.forEach(([x, y]) => ctx.lineTo(x, y));
      ctx.lineTo(dir > 0 ? W + 40 : -40, H + 20); ctx.closePath();
      ctx.save(); ctx.clip(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(b, 0, 0); ctx.restore();
      ctx.strokeStyle = '#f2ead8'; ctx.lineWidth = 10; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
      ctx.restore();
    },

    // Ragged dark bars rise from the bottom (staggered), then leave upward revealing B.
    barwipe: (ctx, a, b, p, tr = {}) => {
      blit(ctx, p < 0.5 ? a : b);
      physical(ctx);
      const r = T.rng(T.hash('bars')), n = 14;
      ctx.fillStyle = tr.color ?? '#3a2618';
      // all random values first, so bar shapes do not depend on which bars are visible this frame
      const bars = Array.from({ length: n }, () => ({ w: (W / n) * (0.7 + r() * 0.6), delay: r() * 0.18, j1: r() * 30, j2: r() * 30 }));
      let x = -10;
      for (const { w, delay, j1, j2 } of bars) {
        const up = T.ease.inOut(T.clamp((p - delay) / 0.45)), down = T.ease.inOut(T.clamp((p - 0.5 - delay * 0.5) / 0.45));
        const top = H - up * (H + 80), bottom = H + 40 - down * (H + 200);
        if (bottom > top) { ctx.beginPath(); ctx.moveTo(x, bottom); ctx.lineTo(x, top + j1); ctx.lineTo(x + w * 0.5, top); ctx.lineTo(x + w + 2, top + j2); ctx.lineTo(x + w + 2, bottom); ctx.fill(); }
        x += w;
      }
      ctx.restore();
    },

    // Hard cut through a 3-frame white flash.
    'flash-cut': (ctx, a, b, p) => {
      blit(ctx, p < 0.5 ? a : b);
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1 - Math.abs(p * 2 - 1) * 0.6; ctx.fillStyle = '#fffdf6'; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height); ctx.restore();
    },
  });
})();
