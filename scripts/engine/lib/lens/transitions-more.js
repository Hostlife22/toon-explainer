// transitions-more.js — burn, swarm, squeeze and carry transitions measured on the reference library.
// Contract as in transitions.js: T.transitions[kind](ctx, a, b, p, tr) with ctx the physical output canvas,
// a / b the previous / next shot canvases, p = 0..1 over tr.dur.
(function () {
  'use strict';
  const T = window.TOON, W = T.W, H = T.H, FPS = 30;
  const sc = (ctx) => ctx.canvas.width / W;
  const pt = (v, def) => (Array.isArray(v) && v.length >= 2 && v.every((x) => typeof x === 'number') ? v : def);
  const rect4 = (v, def) => (Array.isArray(v) && v.length === 4 && v.every((x) => typeof x === 'number') ? v : def);
  function draw(ctx, src, alpha = 1, filter = null) {
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = alpha; if (filter) ctx.filter = filter;
    ctx.drawImage(src, 0, 0); ctx.restore();
  }
  function oneOf(v, allowed, def, what) {
    if (v == null) return def;
    if (!allowed.includes(v)) throw new Error(`${what} must be one of ${allowed.join(', ')} (got ${JSON.stringify(v)})`);
    return v;
  }

  // ---------- burn: a ragged burning edge eats the old shot and uncovers the new one ----------
  // Reference: a fire rises from the bottom and burns a banner away to reveal the next shot (~1 s). tr.from = side the
  // fire starts on (bottom | top | left | right), tr.char (#2a1408) colours the charred rim, tr.flames (true).
  function burn(ctx, a, b, p, tr) {
    const from = oneOf(tr.from, ['bottom', 'top', 'left', 'right'], 'bottom', 'burn.from');
    const s = sc(ctx), vert = from === 'bottom' || from === 'top', len = vert ? H : W, across = vert ? W : H;
    const e = T.ease.inOut(p) * (len + 160) - 80, seed = 'burn:' + (tr.seed ?? 0), boil = Math.floor(p * (tr.dur ?? 0.9) * 15);
    // ragged edge as offsets along the cross axis, re-seeded on twos so the rim boils
    const n = 24, r = T.rng(T.hash(seed + ':' + boil)), off = Array.from({ length: n + 1 }, () => (r() - 0.5) * 70);
    const edge = (k) => { const u = (k / n) * across, d = e + off[k]; return from === 'bottom' ? [u, H - d] : from === 'top' ? [u, d] : from === 'left' ? [d, u] : [W - d, u]; };
    draw(ctx, b);
    ctx.save(); ctx.setTransform(s, 0, 0, s, 0, 0);
    // the old shot survives on the unburnt side of the edge
    ctx.beginPath();
    const far = from === 'bottom' ? [[W, -10], [0, -10]] : from === 'top' ? [[W, H + 10], [0, H + 10]] : from === 'left' ? [[W + 10, H], [W + 10, 0]] : [[-10, H], [-10, 0]];
    const p0 = edge(0); ctx.moveTo(p0[0], p0[1]);
    for (let k = 1; k <= n; k++) { const q = edge(k); ctx.lineTo(q[0], q[1]); }
    far.forEach(([x, y]) => ctx.lineTo(x, y));
    ctx.closePath();
    ctx.save(); ctx.clip(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(a, 0, 0); ctx.restore();
    // charred rim: a dark band and a glowing orange line along the edge
    for (const [w, col] of [[34, tr.char ?? '#2a1408'], [10, '#ff8a2a'], [4, '#ffe08a']]) {
      ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineJoin = 'round'; ctx.beginPath();
      const q0 = edge(0); ctx.moveTo(q0[0], q0[1]); for (let k = 1; k <= n; k++) { const q = edge(k); ctx.lineTo(q[0], q[1]); } ctx.stroke();
    }
    if (tr.flames !== false && T.drawFlame && p > 0.02 && p < 0.98) {
      for (let k = 0; k <= n; k += 2) {
        const q = edge(k); ctx.save(); ctx.translate(q[0], q[1]);
        ctx.rotate(from === 'bottom' ? 0 : from === 'top' ? Math.PI : from === 'left' ? Math.PI / 2 : -Math.PI / 2);
        T.drawFlame(ctx, 90 + (k % 4) * 20, p * (tr.dur ?? 0.9) + k * 0.05, seed + k); ctx.restore();
      }
    }
    ctx.restore();
  }

  // ---------- swarm: bats or birds sweep across, cover the frame, then thin out over the new shot ----------
  // Reference: bats fill the frame over ~12 f, full black for ~3 f, thin out over ~20 f (a 1.2 s cut).
  // tr.creature (bat | bird), tr.count (120), tr.color (#120c09), tr.dir (1 = left to right, -1 = right to left).
  function flyer(ctx, kind, x, y, size, flap, col) {
    ctx.save(); ctx.translate(x, y); ctx.scale(size / 100, size / 100); ctx.fillStyle = col; ctx.beginPath();
    if (kind === 'bat') {
      const up = flap ? -1 : 1;
      ctx.moveTo(0, -8); ctx.lineTo(-14, -2);
      ctx.quadraticCurveTo(-36, -24 * up, -58, -10 * up); ctx.lineTo(-48, 2); ctx.lineTo(-38, -4 * up); ctx.lineTo(-30, 8); ctx.lineTo(-18, 4);
      ctx.lineTo(0, 14); ctx.lineTo(18, 4); ctx.lineTo(30, 8); ctx.lineTo(38, -4 * up); ctx.lineTo(48, 2);
      ctx.lineTo(58, -10 * up); ctx.quadraticCurveTo(36, -24 * up, 14, -2); ctx.closePath();
      ctx.moveTo(-6, -8); ctx.lineTo(-4, -16); ctx.lineTo(0, -10); ctx.lineTo(4, -16); ctx.lineTo(6, -8); ctx.closePath();
    } else {
      const k = flap ? 18 : -14;
      ctx.moveTo(-50, k); ctx.quadraticCurveTo(-24, -6, 0, 6); ctx.quadraticCurveTo(24, -6, 50, k);
      ctx.quadraticCurveTo(24, 6, 0, 16); ctx.quadraticCurveTo(-24, 6, -50, k); ctx.closePath();
    }
    ctx.fill(); ctx.restore();
  }
  function swarm(ctx, a, b, p, tr) {
    const kind = oneOf(tr.creature, ['bat', 'bird'], 'bat', 'swarm.creature'), n = tr.count ?? 120, col = tr.color ?? '#120c09', dir = tr.dir ?? 1;
    const s = sc(ctx), t = p * (tr.dur ?? 1.2), r = T.rng(T.hash('swarm:' + (tr.seed ?? 0)));
    draw(ctx, p < 0.4 ? a : b);
    ctx.save(); ctx.setTransform(s, 0, 0, s, 0, 0);
    // each flyer crosses the frame on its own lane; launches are spread so coverage peaks around p 0.35-0.45
    for (let i = 0; i < n; i++) {
      const lane = r(), start = r() * 0.4, speed = 0.45 + r() * 0.3, size = 140 + r() * 200, phase = Math.floor(r() * 4);
      const q = (p - start) / speed;
      if (q <= 0 || q >= 1) continue;
      const x = dir > 0 ? -150 + q * (W + 300) : W + 150 - q * (W + 300);
      const y = lane * (H + 120) - 60 + Math.sin((q * 6 + lane * 9)) * 30;
      flyer(ctx, kind, x, y, size, (Math.floor(t * FPS / 2) + phase) % 2 === 0, col);
    }
    // the dense middle closes completely for a few frames (the cut happens under it)
    const cover = T.clamp(1 - Math.abs(p - 0.4) / 0.07);
    if (cover > 0) { ctx.globalAlpha = cover; ctx.fillStyle = col; ctx.fillRect(0, 0, W, H); }
    ctx.restore();
  }

  // ---------- squeeze: the old shot collapses into a bright line, the new one pulls back into place, blurred ----------
  // Reference: a horizontal squeeze to a line, then a blurred pull-back onto a map (~15 f). tr.axis (horizontal |
  // vertical: the direction of the line), tr.color (#fffaf0) of the line.
  function squeeze(ctx, a, b, p, tr) {
    const axis = oneOf(tr.axis, ['horizontal', 'vertical'], 'horizontal', 'squeeze.axis'), w = ctx.canvas.width, h = ctx.canvas.height;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);
    if (p < 0.45) {
      const k = Math.max(0.004, 1 - T.ease.in(p / 0.45));
      ctx.translate(w / 2, h / 2); axis === 'horizontal' ? ctx.scale(1 + (1 - k) * 0.15, k) : ctx.scale(k, 1 + (1 - k) * 0.15);
      ctx.translate(-w / 2, -h / 2); ctx.drawImage(a, 0, 0);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const glow = T.ease.in(p / 0.45), thick = Math.max(2, 10 * glow * sc(ctx));
      ctx.globalAlpha = glow; ctx.fillStyle = tr.color ?? '#fffaf0';
      axis === 'horizontal' ? ctx.fillRect(0, h / 2 - thick / 2, w, thick) : ctx.fillRect(w / 2 - thick / 2, 0, thick, h);
    } else {
      const q = T.ease.outCubic((p - 0.45) / 0.55), z = 2 - q, blur = (1 - q) * 14 * sc(ctx);
      ctx.translate(w / 2, h / 2); ctx.scale(z, z); ctx.translate(-w / 2, -h / 2);
      if (blur > 0.3) ctx.filter = `blur(${blur.toFixed(2)}px)`;
      ctx.drawImage(b, 0, 0);
    }
    ctx.restore();
  }

  // ---------- carry: a rectangle of the old shot grows to fill the frame, then shrinks into a rectangle of the new ----------
  // Reference: a round locator badge zooms up to fill the frame and lands as the badge of the next scene (~14 f).
  // tr.from / tr.to = [x, y, w, h] in frame fractions (default: the centre third); tr.round (false) draws round windows.
  function carry(ctx, a, b, p, tr) {
    const fr = rect4(tr.from, [0.33, 0.33, 0.34, 0.34]), to = rect4(tr.to, fr), w = ctx.canvas.width, h = ctx.canvas.height;
    const out = p < 0.5, src = out ? a : b, r = out ? fr : to, q = out ? T.ease.in(p * 2) : 1 - T.ease.out((p - 0.5) * 2);
    // rect fractions are of the visible frame: the whole canvas, or the centred strip of a vertical film
    const vw = w * (T.STRIP_W ?? W) / W, vx = (w - vw) / 2;
    // zoom so the rect grows from its own size (q 0) to covering the visible frame (q 1)
    const zFull = Math.max(1 / r[2], 1 / r[3]), z = T.lerp(1, zFull, q);
    const cx = vx + (r[0] + r[2] / 2) * vw, cy = (r[1] + r[3] / 2) * h;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(src, 0, 0); // the same shot, dimmed, around the window (p 0 equals A, p 1 equals B)
    ctx.fillStyle = 'rgba(0,0,0,' + (0.35 * q).toFixed(3) + ')'; ctx.fillRect(0, 0, w, h);
    // window: the rect, scaled about its centre and moved toward the frame centre as it grows
    const ww = r[2] * vw * z, wh = r[3] * h * z, wx = T.lerp(cx, w / 2, q) - ww / 2, wy = T.lerp(cy, h / 2, q) - wh / 2;
    const windowPath = () => {
      ctx.beginPath();
      if (tr.round) ctx.ellipse(wx + ww / 2, wy + wh / 2, ww / 2 * (1 + q * 0.5), wh / 2 * (1 + q * 0.5), 0, 0, Math.PI * 2);
      else ctx.rect(wx, wy, ww, wh);
    };
    ctx.save(); windowPath(); ctx.clip();
    ctx.translate(wx + ww / 2, wy + wh / 2); ctx.scale(z, z); ctx.translate(-cx, -cy);
    ctx.drawImage(src, 0, 0);
    ctx.restore();
    // a white rim with an ink edge keeps the window readable as a badge or an inset until it fills the frame
    const k = ctx.canvas.width / W, rim = 1 - q;
    if (rim > 0.02) { windowPath(); ctx.lineWidth = 16 * k * rim; ctx.strokeStyle = tr.rim ?? '#f7f3ea'; ctx.stroke(); ctx.lineWidth = 5 * k * rim; ctx.strokeStyle = '#2a1c15'; ctx.stroke(); }
    ctx.restore();
  }

  Object.assign(T.TRANSITION_DUR, { burn: 0.9, swarm: 1.2, squeeze: 0.5, carry: 0.5 });
  Object.assign(T.transitions, { burn, swarm, squeeze, carry });
})();
