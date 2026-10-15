// lens.js — v4 transitions measured on the reference library: cloud-wipe (and the POOF cut), drip (blood / censor
// curtain), black-beat, stage curtain, explosion-wipe, wave, bubble-wipe, portal, screen-dive, fg-pass (a giant figure
// crosses the lens), spin-zoom (emblem reveal), glow-open (and push-to-black), vignette-close.
// Contract (core.js): T.transitions[kind](ctx, a, b, p, tr) — ctx = physical output canvas, a/b = previous/next shot
// canvases (physical px), p = 0..1 over tr.dur, tr = the spec object (dur already resolved). A transition occupies the
// START of the shot it is set on while the previous shot keeps playing; black/white holds live inside p.
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL, W = T.W, H = T.H, FPS = 30;

  // fg-pass and portal peeks draw cast members: the film being rendered is T.film (set by T.init).
  const film = { get spec() { return T.film && T.film.spec; } };

  // ---------- helpers (identity transform, physical pixels) ----------
  const sc = (ctx) => ctx.canvas.width / W;
  const logical = (ctx) => { const s = sc(ctx); ctx.save(); ctx.setTransform(s, 0, 0, s, 0, 0); return s; };
  // Draw a shot canvas zoomed by z about the logical point (fx, fy), then shifted by (ox, oy) logical px.
  function blit(ctx, src, o = {}) {
    const s = sc(ctx), z = o.zoom ?? 1, fx = (o.fx ?? W / 2) * s, fy = (o.fy ?? H / 2) * s;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = o.alpha ?? 1;
    if (o.filter) ctx.filter = o.filter;
    ctx.translate(fx + (o.ox ?? 0) * s, fy + (o.oy ?? 0) * s);
    ctx.scale(z, z);
    ctx.translate(-fx, -fy);
    ctx.drawImage(src, 0, 0);
    ctx.restore();
  }
  function wash(ctx, color, alpha = 1) {
    if (alpha <= 0) return;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = T.clamp(alpha);
    ctx.fillStyle = color; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height); ctx.restore();
  }
  // Paint fn(k) (logical transform) on a scratch canvas and composite it once with `alpha`, so overlapping lobes fade
  // as one shape instead of showing their overlaps.
  function faded(ctx, alpha, fn) {
    const s = sc(ctx), [c, k] = T.scratch('lens:fade', ctx.canvas.width, ctx.canvas.height);
    k.clearRect(0, 0, c.width, c.height); k.setTransform(s, 0, 0, s, 0, 0);
    fn(k);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = T.clamp(alpha); ctx.drawImage(c, 0, 0); ctx.restore();
  }
  const rgba = (hex, a) => { const n = parseInt(T.hex6(hex).slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };
  const col = (v, def) => T.hex6(v ?? def);
  const seedOf = (tr) => tr.kind + ':' + (tr.seed ?? 0);
  const pt = (v, def) => (Array.isArray(v) && v.length >= 2 && v.every((x) => typeof x === 'number') ? v : def);
  const rect4 = (v, def) => (Array.isArray(v) && v.length === 4 && v.every((x) => typeof x === 'number') ? v : def);
  function oneOf(v, allowed, def, what) {
    if (v == null) return def;
    if (!allowed.includes(v)) throw new Error(`${what} must be one of ${allowed.join(', ')} (got ${JSON.stringify(v)})`);
    return v;
  }
  const secs = (tr, p) => p * (tr.dur || 0.0001);

  // ---------- cloud-wipe: cumulus clumps boil up, hold, part from `at` ----------
  // Six clumps on a 3x2 grid cover the frame (measured Ho 5:03: smoke rises ~12 frames, parts over ~15).
  function clumps(seed) {
    const r = T.rng(T.hash(seed + ':clumps'));
    return Array.from({ length: 6 }, (_, i) => ({
      x: ((i % 3) + 0.5) / 3 * W + (r() - 0.5) * 140, y: (Math.floor(i / 3) + 0.5) / 2 * H + (r() - 0.5) * 90,
      w: 900 + r() * 160, h: 760 + r() * 120, delay: r() * 0.12, id: seed + i,
    }));
  }
  function drawClump(ctx, c, x, y, s, t, o) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    T.drawCloud(ctx, 0, 0, c.w, c.h, c.id, { count: 4, color: o.color, shade: o.shade, line: o.line, ink: o.ink, boil: t });
    ctx.restore();
  }
  function poofCut(ctx, a, b, p, tr) {
    const f = secs(tr, p) * FPS, cs = clumps(seedOf(tr)), color = col(tr.color, '#f4f1ea');
    blit(ctx, f < 2 ? a : b);
    const grow = f < 3 ? T.lerp(0.6, 1.1, T.ease.outCubic(f / 3)) : 1.1 + (f - 3) * 0.015;
    const fade = 1 - T.ease.in(T.clamp((f - 3) / 6));
    if (fade <= 0) return;
    faded(ctx, fade, (k) => {
      k.translate(W / 2, H / 2 - (f > 3 ? (f - 3) * 6 : 0)); k.scale(grow, grow); k.translate(-W / 2, -H / 2);
      for (const c of cs) drawClump(k, c, c.x, c.y, 1, secs(tr, p), { color, shade: tr.shade ?? T.shade(color, -0.12), line: 5, ink: P.ink });
      k.translate(W / 2, H / 2); k.rotate(-6 * T.DEG);
      T.toonText(k, String(tr.word), 0, 70, { size: T.fitSize(k, String(tr.word), 230, 1100), fill: '#fff6c8' });
    });
  }
  function cloudWipe(ctx, a, b, p, tr) {
    if (tr.word) return poofCut(ctx, a, b, p, tr);
    const t = secs(tr, p), [ax, ay] = pt(tr.at, [0.5, 0.5]), cs = clumps(seedOf(tr));
    const from = oneOf(tr.from, ['bottom', 'top', 'left', 'right'], 'bottom', 'cloud-wipe.from');
    const color = col(tr.color, '#b7bcc2'), shade = col(tr.shade, '#9097a0');
    blit(ctx, p < 0.5 ? a : b);
    logical(ctx);
    // the solid underlay hides any gap between lobes while the frame is fully covered
    const cover = Math.min(T.clamp((p - 0.38) / 0.06), T.clamp((0.62 - p) / 0.06));
    if (cover > 0) { ctx.globalAlpha = cover; ctx.fillStyle = T.mix(color, shade, 0.4); ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
    const dx = { left: -1, right: 1, top: 0, bottom: 0 }[from], dy = { top: -1, bottom: 1, left: 0, right: 0 }[from];
    for (const c of cs) {
      let x = c.x, y = c.y, s = 1;
      if (p < 0.5) {
        const q = 1 - T.ease.outCubic(T.clamp((p - c.delay) / (0.45 - c.delay)));
        x += dx * q * 1.3 * W; y += dy * q * 1.2 * H;
      } else {
        const q = T.ease.in(T.clamp((p - 0.55) / 0.45)), vx = c.x - ax * W, vy = c.y - ay * H, d = Math.hypot(vx, vy) || 1;
        x += (vx / d) * q * 1.3 * W; y += (vy / d) * q * 1.3 * W; s = 1 - 0.45 * q;
      }
      drawClump(ctx, c, x, y, s, t, { color, shade, line: 3, ink: col(tr.ink, '#6d727a') });
    }
    ctx.restore();
  }

  // ---------- drip: blood columns descend (and tongues rise), hold solid, then pull apart ----------
  function dripColumns(seed, n) {
    const r = T.rng(T.hash(seed + ':cols'));
    const cols = Array.from({ length: n }, () => ({
      w: (W / n) * (0.7 + r() * 0.6), delay: r() * 0.12, len: 0.92 + r() * 0.16,
      thin: Array.from({ length: 1 + Math.floor(r() * 2) }, () => ({ fx: 0.15 + r() * 0.7, w: 8 + r() * 6, extra: 40 + r() * 110 })),
    }));
    const sum = cols.reduce((s, c) => s + c.w, 0);
    let x = -10;
    for (const c of cols) { c.w *= (W + 20) / sum; c.x = x; x += c.w; }
    return cols;
  }
  function dripTop(ctx, cols, reach, grow, color) {
    const sh = T.shade(color, -0.22);
    for (const c of cols) {
      const g = T.ease.in(T.clamp((grow - c.delay) / (1 - c.delay))), len = reach * c.len * g;
      if (len <= 2) continue;
      const path = (k) => {
        k.beginPath();
        k.rect(c.x, -20, c.w + 1, Math.max(0, len - c.w / 2) + 20);
        k.moveTo(c.x + c.w, len - c.w / 2); k.arc(c.x + c.w / 2, len - c.w / 2, c.w / 2, 0, Math.PI);
        for (const d of c.thin) {
          const dx = c.x + d.fx * c.w, dl = len + d.extra * g;
          k.rect(dx - d.w / 2, len - c.w, d.w, dl - len + c.w - d.w / 2);
          k.moveTo(dx + d.w / 2, dl - d.w / 2); k.arc(dx, dl - d.w / 2, d.w / 2, 0, Math.PI);
        }
      };
      ctx.save(); path(ctx); ctx.fillStyle = color; ctx.fill(); ctx.clip();
      ctx.fillStyle = sh; ctx.fillRect(c.x + c.w * 0.74, -20, c.w * 0.3, len + 200);
      ctx.restore();
    }
  }
  // Flame-like tongues rising from the bottom edge; control points boil +-18 px on twos.
  function dripBottom(ctx, seed, n, top, t, color) {
    const r = T.rng(T.hash(seed + ':tongues')), boil = T.rng(T.hash(seed + ':boil:' + Math.floor(t * 15)));
    const tongues = Array.from({ length: n }, () => ({ h: 60 + r() * 160, drops: 2 + Math.floor(r() * 2), dr: r() }));
    const tw = (W + 40) / n;
    ctx.beginPath(); ctx.moveTo(-20, H + 40); ctx.lineTo(-20, top);
    tongues.forEach((g, i) => {
      const x0 = -20 + i * tw, tipX = x0 + tw * (0.35 + boil() * 0.3), tipY = top - g.h + (boil() - 0.5) * 36;
      ctx.bezierCurveTo(x0 + tw * 0.2, top + (boil() - 0.5) * 36, tipX - tw * 0.25, tipY + g.h * 0.4, tipX, tipY);
      ctx.bezierCurveTo(tipX + tw * 0.2, tipY + g.h * 0.5, x0 + tw * 0.8, top + (boil() - 0.5) * 36, x0 + tw, top);
    });
    ctx.lineTo(W + 20, H + 40); ctx.closePath();
    ctx.fillStyle = color; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = '#5a0606'; ctx.stroke();
    tongues.forEach((g, i) => { // loose round drops flung above each tip
      const x = -20 + (i + 0.5) * tw;
      for (let d = 0; d < g.drops; d++) {
        const y = top - g.h - 30 - d * 46 - g.dr * 20, rad = 12 - d * 3;
        ctx.beginPath(); ctx.arc(x + (d % 2 ? 14 : -10), y, rad, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
    });
  }
  function drip(ctx, a, b, p, tr) {
    const t = secs(tr, p), dur = tr.dur, mode = oneOf(tr.mode, ['top', 'both'], 'both', 'drip.mode');
    const n = Math.round(T.clamp(tr.cols ?? 14, 4, 40)), color = col(tr.color, '#8b0000');
    const tc = Math.min(0.35, dur * 0.4), th = T.clamp(tr.hold ?? 0.3, 0, Math.max(0, dur - tc - 0.15)), to = Math.max(0.15, dur - tc - th);
    const opening = t >= tc + th, q = opening ? T.ease.inOut(T.clamp((t - tc - th) / to)) : 0, grow = T.clamp(t / tc);
    blit(ctx, opening ? b : a);
    logical(ctx);
    if (tr.glow && t < tc) { // muzzle glow first: radial 40 -> 120 px over 3 frames
      const [gx, gy] = pt(tr.at, [0.5, 0.45]), rad = T.lerp(40, 120, T.clamp((t * FPS) / 3)), g = ctx.createRadialGradient(gx * W, gy * H, 0, gx * W, gy * H, rad);
      g.addColorStop(0, 'rgba(255,250,200,1)'); g.addColorStop(0.5, 'rgba(255,214,60,0.8)'); g.addColorStop(1, 'rgba(255,180,40,0)');
      ctx.fillStyle = g; ctx.fillRect(gx * W - rad, gy * H - rad, rad * 2, rad * 2);
    }
    const seed = seedOf(tr), cols = dripColumns(seed, n);
    if (mode === 'top') {
      dripTop(ctx, cols, 1.25 * H * (1 - q), grow, color);
    } else {
      ctx.save(); ctx.translate(0, -q * (0.75 * H + 200)); dripTop(ctx, cols, 0.62 * H, grow, color); ctx.restore();
      const rise = T.ease.outCubic(T.clamp((t - 0.05) / Math.max(0.05, tc - 0.05)));
      if (rise > 0) dripBottom(ctx, seed, Math.max(4, Math.round(n * 0.6)), H - 0.56 * H * rise + q * (0.56 * H + 260), t, '#7a0000');
    }
    ctx.restore();
  }

  // ---------- black-beat: 1-frame cut to black, hold, hard cut (optional solemn title) ----------
  function blackBeat(ctx, a, b, p, tr) {
    const t = secs(tr, p);
    if (t < 1 / FPS / 2) { blit(ctx, a); return; }
    wash(ctx, col(tr.color, '#000000'));
    if (!tr.title) return;
    logical(ctx);
    ctx.globalAlpha = T.ease.inOut(T.clamp((t - 0.15) / (10 / FPS)));
    const txt = String(tr.title), size = T.fitSize(ctx, txt, tr.size ?? 96, W * 0.8);
    T.toonText(ctx, txt, W / 2, H / 2 + size * 0.35, { size, fill: '#ffffff', ink: '#000000', shadow: false });
    ctx.restore();
  }

  // ---------- curtain: velvet halves close, hold, part (stage acts) ----------
  function drape(ctx, x0, x1, color, side, t) {
    const lite = T.shade(color, 0.12), dark = T.shade(color, -0.42), fold = 80;
    ctx.save();
    ctx.beginPath(); ctx.rect(x0, -20, x1 - x0, H + 40); ctx.clip();
    ctx.fillStyle = color; ctx.fillRect(x0, -20, x1 - x0, H + 40);
    for (let x = x0 - fold, i = 0; x < x1 + fold; x += fold, i++) { // fold bands: light ridge + dark crease every 40 px
      const sway = Math.sin(t * 3 + i) * 3;
      ctx.fillStyle = lite; ctx.fillRect(x + 6 + sway, -20, 22, H + 40);
      ctx.fillStyle = dark; ctx.fillRect(x + 46 + sway, -20, 14, H + 40);
    }
    ctx.restore();
    const edge = side < 0 ? x1 : x0;
    ctx.strokeStyle = P.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(edge, -20); ctx.lineTo(edge, H + 20); ctx.stroke();
  }
  function valance(ctx, color, y) {
    const band = 90, sc8 = W / 12;
    T.outlined(ctx, (k) => {
      k.moveTo(-20, y - 40); k.lineTo(W + 20, y - 40); k.lineTo(W + 20, y + band);
      for (let x = W + 20; x > -20; x -= sc8) k.quadraticCurveTo(x - sc8 / 2, y + band + 46, x - sc8, y + band);
      k.closePath();
    }, T.shade(color, -0.12), { line: 4 });
    ctx.strokeStyle = '#d8a83a'; ctx.lineWidth = 8; ctx.beginPath();
    for (let x = -20; x <= W + 20; x += 20) ctx.lineTo(x, y + band - 22 + Math.sin(x / 40) * 7);
    ctx.stroke();
  }
  function curtain(ctx, a, b, p, tr) {
    const t = secs(tr, p), dur = tr.dur, mode = oneOf(tr.mode, ['close', 'open'], 'close', 'curtain.mode');
    const tc = mode === 'open' ? 0 : Math.min(10 / FPS, dur * 0.3);
    const th = T.clamp(tr.hold ?? (mode === 'open' ? 0.15 : 0.6), 0, Math.max(0, dur - tc - 0.2)), to = Math.max(0.2, dur - tc - th);
    const c = t < tc ? T.ease.inOut(t / tc) : t < tc + th ? 1 : 1 - T.ease.outCubic(T.clamp((t - tc - th) / to));
    blit(ctx, mode === 'close' && t < tc + th ? a : b);
    logical(ctx);
    const color = col(tr.color, '#a01818'), half = W / 2 + 12;
    drape(ctx, -20 - half * (1 - c), half * c, color, -1, t);
    drape(ctx, W - half * c, W + 20 + half * (1 - c), color, 1, t);
    if (tr.valance !== false) valance(ctx, color, -130 * (1 - T.clamp(c * 2.5)));
    ctx.restore();
  }

  // ---------- explosion-wipe: fireball covers the cut for 2 frames, then dissolves ----------
  function fireball(ctx, cx, cy, R, seed, text) {
    const r = T.rng(T.hash(seed + ':fire'));
    const rings = [['#5a3a30', 1], ['#c4361c', 0.8], ['#f58a1f', 0.6], ['#ffe04a', 0.4]].map(([c, k]) => ({
      c, lobes: Array.from({ length: 7 }, (_, i) => { const a = (i / 7) * Math.PI * 2 + r() * 0.5; return [Math.cos(a) * R * k * 0.35, Math.sin(a) * R * k * 0.35, R * k * 0.55 * (0.85 + r() * 0.3)]; }),
    }));
    const lobes = (k, ring) => { k.beginPath(); for (const [x, y, rad] of ring.lobes) { k.moveTo(cx + x + rad, cy + y); k.arc(cx + x, cy + y, rad, 0, Math.PI * 2); } };
    for (let i = 0; i < 6; i++) { // spark streaks under the cloud
      const a = r() * Math.PI * 2, r0 = R * 0.85, r1 = R * (1.15 + r() * 0.25);
      for (const [w, c] of [[16, P.ink], [8, '#ffe04a']]) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); ctx.stroke(); }
    }
    ctx.fillStyle = '#141010';
    for (let i = 0; i < 10; i++) { // debris chips
      const a = r() * Math.PI * 2, d = R * (1.02 + r() * 0.35), s = 10 + r() * 16, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
      ctx.beginPath(); ctx.moveTo(x - s, y - s * 0.4); ctx.lineTo(x + s * 0.6, y - s); ctx.lineTo(x + s, y + s * 0.5); ctx.lineTo(x - s * 0.3, y + s * 0.8); ctx.closePath(); ctx.fill();
    }
    ctx.lineWidth = 12; ctx.strokeStyle = P.ink; lobes(ctx, rings[0]); ctx.stroke();
    for (const ring of rings) { ctx.fillStyle = ring.c; lobes(ctx, ring); ctx.fill(); }
    if (text) {
      ctx.fillStyle = '#fffbe8'; ctx.beginPath(); ctx.arc(cx, cy, R * 0.24, 0, Math.PI * 2); ctx.fill();
      const s = T.fitSize(ctx, text, Math.min(130, R * 0.2), Math.min(W * 0.8, R * 1.1));
      T.toonText(ctx, text, cx, cy + s * 0.35, { size: s, fill: '#ffffff' });
    }
  }
  function explosionWipe(ctx, a, b, p, tr) {
    const f = secs(tr, p) * FPS, [ax, ay] = pt(tr.at, [0.5, 0.55]);
    blit(ctx, f < 3 ? a : b);
    const fadeLen = Math.max(4, tr.dur * FPS - 6);
    const alpha = f < 6 ? 1 : 1 - T.ease.in(T.clamp((f - 6) / fadeLen));
    if (alpha <= 0) return;
    const D = f < 4 ? T.lerp(0.2 * W, 1.6 * W, T.ease.outCubic(f / 4)) : 1.6 * W * (1 + 0.12 * T.clamp((f - 4) / fadeLen));
    faded(ctx, alpha, (k) => fireball(k, ax * W, ay * H, D / 2, seedOf(tr), tr.text ? String(tr.text) : null));
  }

  // ---------- wave: a curling flood front covers A, then recedes uncovering B ----------
  function waveEdge(p, seed) {
    const r = T.rng(T.hash(seed + ':bulge'));
    const bulges = Array.from({ length: 3 }, (_, i) => ({ y: (0.15 + i * 0.32 + r() * 0.1) * H, a: (i === 0 ? 140 : 60) + r() * 60, s: 110 + r() * 80 }));
    return (y) => Math.sin(y * 0.01 + p * 12) * 30 + bulges.reduce((s, g) => s + g.a * Math.exp(-(((y - g.y) / g.s) ** 2)), 0);
  }
  function waveBody(ctx, xf, edge, color, shade, seed, p) {
    const pts = [];
    for (let y = -30; y <= H + 30; y += 15) pts.push([xf + edge(y), y]);
    const body = (k) => { k.beginPath(); k.moveTo(-60, -30); pts.forEach(([x, y]) => k.lineTo(x, y)); k.lineTo(-60, H + 30); k.closePath(); };
    ctx.save(); body(ctx); ctx.fillStyle = color; ctx.fill(); ctx.clip();
    ctx.fillStyle = shade; ctx.fillRect(-60, H * 0.64, W * 2.5, H);
    const r = T.rng(T.hash(seed + ':swirl'));
    ctx.strokeStyle = P.ink; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (let i = 0; i < 5; i++) { // swirl strokes ride with the front
      const sx = xf - 160 - r() * 700, sy = (0.12 + r() * 0.76) * H, rad = 30 + r() * 40, a0 = p * 9 + r() * 6;
      ctx.beginPath(); for (let k = 0; k <= 24; k++) { const a = a0 + k * 0.32, rr = rad * (1 - k / 30); ctx.lineTo(sx + Math.cos(a) * rr, sy + Math.sin(a) * rr); } ctx.stroke();
    }
    ctx.fillStyle = 'rgba(233,251,255,0.85)';
    for (let i = 0; i < 18; i++) { const bx = xf - 40 - r() * 600, by = r() * H, br = 5 + r() * 9; ctx.beginPath(); ctx.arc(bx, by - p * 200 * r(), br, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    const rim = (k) => { k.beginPath(); pts.forEach(([x, y], i) => (i ? k.lineTo(x, y) : k.moveTo(x, y))); };
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = P.ink; ctx.lineWidth = 30; rim(ctx); ctx.stroke();
    ctx.strokeStyle = '#e9fbff'; ctx.lineWidth = 18; rim(ctx); ctx.stroke();
    for (let i = 0; i < 9; i++) { const [x, y] = pts[Math.floor((i + 0.5) / 9 * pts.length)], rad = 18 + ((i * 7) % 5) * 5; T.outlined(ctx, (k) => k.arc(x - 6, y, rad, 0, Math.PI * 2), '#e9fbff', { line: 4 }); }
  }
  function wave(ctx, a, b, p, tr) {
    const dir = oneOf(tr.dir, ['right', 'left'], 'right', 'wave.dir'), seed = seedOf(tr);
    const xf = p < 0.4 ? T.lerp(-0.2 * W, 1.1 * W, T.ease.inOut(p / 0.4)) : T.lerp(1.1 * W, -0.3 * W, T.ease.inOut((p - 0.4) / 0.6));
    blit(ctx, p < 0.4 ? a : b);
    logical(ctx);
    if (dir === 'left') { ctx.translate(W, 0); ctx.scale(-1, 1); }
    const color = col(tr.color, '#3fc6d8');
    waveBody(ctx, xf, waveEdge(p, seed), color, col(tr.shade, '#1e8fb0'), seed, p);
    ctx.restore();
  }

  // ---------- bubble-wipe: a screen of rising bubbles, switch at peak coverage ----------
  function bubbleWipe(ctx, a, b, p, tr) {
    blit(ctx, p < 0.5 ? a : b);
    logical(ctx);
    const r = T.rng(T.hash(seedOf(tr) + ':bub')), n = Math.round(T.clamp(tr.count ?? 90, 10, 300));
    ctx.globalAlpha = 0.9 * Math.sin(Math.PI * p) ** 3; ctx.fillStyle = col(tr.color, '#dff4fb'); ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
    for (let i = 0; i < n; i++) {
      const rad = 10 + 80 * r() ** 1.6, x = r() * W, y0 = H + rad + r() * H * 1.1, travel = y0 + rad + H * 0.15, y = y0 - T.ease.inOut(p) * travel * (0.95 + r() * 0.1);
      if (y < -rad || y > H + rad) continue;
      ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fill();
      ctx.lineWidth = Math.max(3, rad * 0.08); ctx.strokeStyle = '#ffffff'; ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, rad * 0.68, Math.PI * 1.1, Math.PI * 1.45); ctx.lineWidth = Math.max(2, rad * 0.12); ctx.lineCap = 'round'; ctx.stroke();
    }
    ctx.restore();
  }

  // ---------- portal: punch into a frame, a short flash, fall out of a hole at the top of B ----------
  function drawPeek(ctx, who, x, y, size, expr) {
    const cast = (film.spec && film.spec.cast) || {};
    if (!T.layers.bean || !cast[who]) return;
    const k = size / 600;
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI); ctx.translate(0, 450 * k);
    T.layers.bean(ctx, { type: 'bean', who, id: 'peek', size, expr: expr ?? 'shock', rock: 0, blink: false }, 0, { cast, seed: 'peek', dpr: 1 });
    ctx.restore();
  }
  // White flash length in frames: optional, capped at 2 so no transition holds a pure-white frame.
  const flashFrames = (tr, def) => T.clamp(Math.round(tr.flash ?? def), 0, 2);
  function portal(ctx, a, b, p, tr) {
    const f = secs(tr, p) * FPS, [rx, ry, rw, rh] = rect4(tr.frame, [0.35, 0.2, 0.3, 0.45]), cx = (rx + rw / 2) * W, cy = (ry + rh / 2) * H;
    const zf = Math.max(1 / rw, 1 / rh), fl = flashFrames(tr, 1), punch = 8;
    if (f < punch) { // push into the frame until its picture fills the screen
      const e = T.ease.in(f / punch);
      blit(ctx, a, { zoom: T.lerp(1, zf, e), fx: cx, fy: cy, ox: (W / 2 - cx) * e, oy: (H / 2 - cy) * e });
      if (f >= punch - 1) for (let i = 1; i < 3; i++) blit(ctx, a, { zoom: zf * (1 + i * 0.06), fx: cx, fy: cy, ox: W / 2 - cx, oy: H / 2 - cy, alpha: 0.3 });
      return;
    }
    if (f < punch + fl) { wash(ctx, '#ffffff'); return; }
    blit(ctx, b);
    wash(ctx, '#ffffff', 0.6 * (1 - (f - punch - fl) / 3));
    // the hole holds big for ~10 frames so the peeking character reads, then shrinks up and out of frame
    const hold = punch + fl + 10, q = T.ease.inOut(T.clamp((f - hold) / Math.max(6, tr.dur * FPS - hold))), s = (tr.hole ?? 1.35) * (1 - q);
    if (s <= 0.01) return;
    logical(ctx);
    ctx.translate(W / 2, H * 0.3 - q * H * 0.35); ctx.scale(s, s);
    const hole = (k) => { k.moveTo(-300, -150); k.lineTo(300, -150); k.lineTo(220, 150); k.lineTo(-220, 150); k.closePath(); };
    ctx.lineJoin = 'round'; ctx.strokeStyle = P.ink; ctx.lineWidth = 34; ctx.beginPath(); hole(ctx); ctx.stroke();
    ctx.strokeStyle = '#d9a63a'; ctx.lineWidth = 20; ctx.beginPath(); hole(ctx); ctx.stroke();
    ctx.fillStyle = '#3a2a1e'; ctx.beginPath(); hole(ctx); ctx.fill();
    if (tr.peek) { ctx.save(); ctx.beginPath(); hole(ctx); ctx.clip(); drawPeek(ctx, tr.peek, 0, 10, 820, tr.peekExpr); ctx.restore(); }
    ctx.restore();
  }

  // ---------- screen-dive: push into the screen (oval TV / rect) while B already plays inside it ----------
  // The screen hole is transformed with A, so B starts exactly where the screen was and grows to fill the frame.
  function screenDive(ctx, a, b, p, tr) {
    const f = secs(tr, p) * FPS, n = tr.dur * FPS, [rx, ry, rw, rh] = rect4(tr.frame, [0.4, 0.3, 0.2, 0.25]);
    const shape = oneOf(tr.shape, ['oval', 'rect'], 'oval', 'screen-dive.shape'), cx = (rx + rw / 2) * W, cy = (ry + rh / 2) * H;
    const fl = flashFrames(tr, 0), land = Math.max(4, n * 0.8 - fl);
    if (f >= land) { blit(ctx, b); if (f < land + fl) wash(ctx, '#ffffff', 0.85); return; }
    const e = T.ease.inOut(f / land), zf = Math.max(1 / rw, 1 / rh) * (shape === 'oval' ? 1.45 : 1.04), z = T.lerp(1, zf, e);
    const ox = (W / 2 - cx) * e, oy = (H / 2 - cy) * e;
    blit(ctx, a, { zoom: z, fx: cx, fy: cy, ox, oy });
    const s = sc(ctx), hx = cx + ox, hy = cy + oy, hw = (rw * W * z) / 2, hh = (rh * H * z) / 2, rad = 30 * z;
    const path = (k) => { k.beginPath(); if (shape === 'oval') k.ellipse(hx, hy, hw, hh, 0, 0, Math.PI * 2); else T.rrect(k, hx - hw, hy - hh, hw * 2, hh * 2, rad); };
    ctx.save(); ctx.setTransform(s, 0, 0, s, 0, 0);
    ctx.save(); path(ctx); ctx.clip();
    const bz = Math.max((hw * 2) / W, (hh * 2) / H); // B cover-fits the screen, like the TV panel showed it
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.translate(hx * s, hy * s); ctx.scale(bz, bz); ctx.translate(-W / 2 * s, -H / 2 * s); ctx.drawImage(b, 0, 0); ctx.restore();
    const lines = 1 - e; // scanlines and glass glare fade as we pass through the glass
    if (lines > 0) {
      ctx.fillStyle = `rgba(0,0,0,${(0.12 * lines).toFixed(3)})`; for (let y = hy - hh; y < hy + hh; y += 3 * z) ctx.fillRect(hx - hw, y, hw * 2, z);
      ctx.fillStyle = `rgba(255,255,255,${(0.1 * lines).toFixed(3)})`; ctx.beginPath(); ctx.ellipse(hx - hw * 0.4, hy - hh * 0.55, hw * 0.65, hh * 0.25, -0.2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle = P.ink; ctx.lineWidth = 6 * z; path(ctx); ctx.stroke();
    ctx.restore();
  }

  // ---------- fg-pass: a giant cast member walks across the lens, B is revealed behind them ----------
  function fgPass(ctx, a, b, p, tr) {
    const t = secs(tr, p), dir = (tr.dir ?? 1) < 0 ? -1 : 1, s = sc(ctx), size = tr.size ?? 1.7 * H;
    const xc = T.lerp(-0.8 * W, 1.6 * W, p), x = dir > 0 ? xc : W - xc, tilt = tr.tilt ?? 0.08;
    blit(ctx, a);
    const q = T.ease.outCubic(T.clamp((p - 0.35) / 0.65));
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.beginPath();
    if (dir > 0) ctx.rect(0, 0, Math.max(0, x * s), ctx.canvas.height); else ctx.rect(x * s, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.clip();
    blit(ctx, b, { zoom: 1 + tilt, oy: tilt * H * (1 - q) });
    ctx.restore();
    const [c, k] = T.scratch('lens:fgpass', ctx.canvas.width, ctx.canvas.height);
    k.clearRect(0, 0, c.width, c.height);
    k.setTransform(s, 0, 0, s, 0, 0);
    k.translate(x, H * 0.42 + 0.75 * size);
    if (dir < 0) k.scale(-1, 1);
    const cast = (film.spec && film.spec.cast) || {}, who = tr.who && cast[tr.who] ? tr.who : null;
    if (T.layers.bean) {
      const look = who ? undefined : { robe: '#3a3a48', hair: 'short' };
      T.layers.bean(k, { type: 'bean', who, look, id: 'fgpass', size, view: tr.view ?? 'side', walk: [[0, 99]], expr: tr.expr ?? 'neutral' }, t, { cast, seed: 'fgpass', dpr: s, lt: t });
    }
    if (tr.silhouette) { k.setTransform(1, 0, 0, 1, 0, 0); k.globalCompositeOperation = 'source-in'; k.fillStyle = col(tr.silhouette, '#1b1512'); k.fillRect(0, 0, c.width, c.height); }
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.filter = `blur(${(2.5 * s).toFixed(2)}px)`; ctx.drawImage(c, 0, 0); ctx.restore();
  }

  // ---------- spin-zoom: an emblem spins out of a sunburst and swallows the frame ----------
  function sunburst(ctx, t, c1, c2) {
    const [c, k] = T.scratch('lens:burst', ctx.canvas.width, ctx.canvas.height), s = sc(ctx), R = Math.hypot(W, H);
    k.setTransform(s, 0, 0, s, 0, 0);
    k.fillStyle = c1; k.fillRect(0, 0, W, H);
    k.translate(W / 2, H / 2); k.rotate(t * 4 * T.DEG);
    for (let i = 0; i < 16; i += 2) { k.fillStyle = c2; k.beginPath(); k.moveTo(0, 0); k.arc(0, 0, R, (i / 16) * Math.PI * 2, ((i + 1) / 16) * Math.PI * 2); k.closePath(); k.fill(); }
    k.lineWidth = 40;
    for (let i = 1; i <= 3; i++) { k.strokeStyle = i % 2 ? rgba(c2, 0.6) : rgba(c1, 0.6); k.beginPath(); k.arc(0, 0, i * 0.17 * W, 0, Math.PI * 2); k.stroke(); }
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.filter = `blur(${(18 * s).toFixed(2)}px)`; ctx.drawImage(c, 0, 0); ctx.restore();
  }
  function emblem(ctx, e, t) {
    const color = col(e.color, '#4a3aa8');
    if (Array.isArray(e.shape) && e.shape.length >= 3) {
      T.outlined(ctx, (k) => { e.shape.forEach(([x, y], i) => (i ? k.lineTo(x * 220, y * 220) : k.moveTo(x * 220, y * 220))); k.closePath(); }, color, { line: 8, shade: (k) => { k.fillStyle = T.shade(color, -0.22); k.fillRect(-300, 60, 600, 300); } });
    } else if (e.prop && T.PROPS && T.PROPS[e.prop]) {
      ctx.save(); ctx.translate(0, 150); T.drawProp(ctx, e.prop, 300, t, {}); ctx.restore();
    }
    if (e.text) {
      const txt = String(e.text), size = T.fitSize(ctx, txt, 150, W * 0.7);
      T.toonText(ctx, txt, 0, size * 0.35 + (e.shape || e.prop ? 240 : 0), { size, fill: e.fill ?? '#ffffff', stroke: 16, ink: e.text && !e.shape && !e.prop ? color : P.ink });
    }
  }
  function spinZoom(ctx, a, b, p, tr) {
    const t = secs(tr, p), bg = Array.isArray(tr.bg) && tr.bg.length >= 2 ? tr.bg : ['#f6b46a', '#fde3a0'];
    sunburst(ctx, t, col(bg[0]), col(bg[1]));
    const e = tr.emblem && typeof tr.emblem === 'object' ? tr.emblem : { text: tr.text ?? 'NEW ERA' };
    logical(ctx);
    ctx.translate(W / 2, H / 2);
    // spin in to readable size over the first 20%, hold (slow drift) so the emblem reads, then spin out and swallow
    const inP = T.clamp(p / 0.2), outP = T.clamp((p - 0.72) / 0.28);
    const z = p < 0.2 ? T.lerp(0.05, 0.9, T.ease.outBack(inP)) : p < 0.72 ? T.lerp(0.9, 1.15, (p - 0.2) / 0.52) : 1.15 * Math.pow(12, T.ease.in(outP));
    const rot = -300 * (1 - T.ease.outCubic(inP)) + 6 * Math.sin(p * 9) + 200 * T.ease.in(outP);
    ctx.rotate(rot * T.DEG);
    ctx.scale(z, z);
    emblem(ctx, e, t);
    ctx.restore();
  }

  // ---------- glow-open (torch orb grows into a light pool) and push-to-black ----------
  function glowOpen(ctx, a, b, p, tr) {
    const t = secs(tr, p), dur = tr.dur, mode = oneOf(tr.mode, ['glow', 'push'], 'glow', 'glow-open.mode');
    if (mode === 'push') {
      const tz = dur * 0.6, fadeIn = Math.min(18 / FPS, dur * 0.35);
      if (t < tz) { blit(ctx, a, { zoom: 1 + 0.6 * T.ease.in(t / tz) }); wash(ctx, '#000000', T.clamp((t - (tz - 12 / FPS)) / (12 / FPS))); return; }
      wash(ctx, '#000000');
      const q = T.clamp((t - (dur - fadeIn)) / fadeIn);
      if (q > 0) blit(ctx, b, { alpha: T.ease.inOut(q) });
      return;
    }
    const f = t * FPS, [ax, ay] = pt(tr.at, [0.5, 0.5]), cx = ax * W, cy = ay * H, color = col(tr.color, '#ffd04a');
    const span = Math.max(1, Math.min(20, dur * FPS - 4)), R = T.lerp(60, 1.6 * Math.hypot(W, H) / 2, T.ease.outCubic(T.clamp((f - 4) / span)));
    blit(ctx, b);
    logical(ctx);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    g.addColorStop(0, rgba(color, 0.45)); g.addColorStop(0.4, rgba(color, 0.1)); g.addColorStop(0.62, 'rgba(0,0,0,0)');
    g.addColorStop(0.85, 'rgba(0,0,0,0.6)'); g.addColorStop(1, 'rgba(0,0,0,0.85)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.rect(-10, -10, W + 20, H + 20); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill('evenodd');
    ctx.restore();
  }

  // ---------- vignette-close: darkness creeps in to a tight soft oval, hold, cut ----------
  function vignetteClose(ctx, a, b, p, tr) {
    const t = secs(tr, p), [ax, ay] = pt(tr.at, [0.5, 0.45]), r = T.clamp(tr.r ?? 0.22, 0.02, 1.5), tint = col(tr.tint, '#2a1040');
    const close = T.ease.inOut(T.clamp(t / Math.min(1, tr.dur)));
    const R = T.lerp(Math.hypot(W, H) * 0.75, r * H, close);
    blit(ctx, a);
    logical(ctx);
    ctx.translate(ax * W, ay * H); ctx.scale(1.3, 1);
    const g = ctx.createRadialGradient(0, 0, R * 0.55, 0, 0, R * 1.5);
    g.addColorStop(0, rgba(tint, 0)); g.addColorStop(0.4, rgba(tint, 0.7)); g.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = g; ctx.fillRect(-W * 2, -H * 2, W * 4, H * 4);
    ctx.restore();
  }

  Object.assign(T.TRANSITION_DUR, {
    'cloud-wipe': 0.9, drip: 1.2, 'black-beat': 0.4, curtain: 1.6, 'explosion-wipe': 0.7, wave: 0.7, 'bubble-wipe': 0.5,
    portal: 1.4, 'screen-dive': 0.7, 'fg-pass': 0.8, 'spin-zoom': 1.2, 'glow-open': 0.9, 'vignette-close': 1.0,
  });
  Object.assign(T.transitions, {
    'cloud-wipe': cloudWipe, drip, 'black-beat': blackBeat, curtain, 'explosion-wipe': explosionWipe, wave,
    'bubble-wipe': bubbleWipe, portal, 'screen-dive': screenDive, 'fg-pass': fgPass, 'spin-zoom': spinZoom,
    'glow-open': glowOpen, 'vignette-close': vignetteClose,
  });
})();
