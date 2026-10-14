// atmos3.js — v3 FX measured on the reference library: horror (glitch, rgbsplit, redeyes, eyes-white, wallshadow,
// darkness, eyelids, inkburst), surveillance (alarm, cctv), weather & myth (mist, whirlpool, flameshape, paperstorm)
// and war (gas, muzzle, shellburst). Full-frame effects ignore the layer position; place them with "hud": true.
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL, W = T.W, H = T.H, FX = T.FX;
  const f30 = (lt) => Math.floor(lt * 30);
  const twos = (lt) => Math.floor(lt * 15);
  // Draw in full-frame logical coordinates regardless of the layer transform.
  const full = (ctx) => { const s = ctx.canvas.width / W; ctx.save(); ctx.setTransform(s, 0, 0, s, 0, 0); };

  // ---------- glitch: 1-3 frame looks (gray+slices, thermal, half hue, posterize) then back to normal ----------
  const THERMAL = (() => {
    const stops = [[0, [10, 0, 30]], [0.3, [110, 0, 140]], [0.55, [220, 30, 40]], [0.75, [255, 140, 0]], [1, [255, 245, 150]]];
    const lut = new Uint8Array(256 * 3);
    for (let i = 0; i < 256; i++) {
      const v = i / 255;
      let k = 0;
      while (k < stops.length - 2 && v > stops[k + 1][0]) k++;
      const [a, ca] = stops[k], [b, cb] = stops[k + 1], t = (v - a) / (b - a);
      for (let c = 0; c < 3; c++) lut[i * 3 + c] = ca[c] + (cb[c] - ca[c]) * t;
    }
    return lut;
  })();
  const LOOKS = ['gray-slice', 'gray-slice', 'thermal', 'thermal', 'normal', 'halfhue', 'posterize', 'posterize', 'gray-slice'];
  function slices(ctx, seed, n) {
    const cv = ctx.canvas, [c, k] = T.scratch('glitch', cv.width, cv.height), r = T.rng(T.hash(seed));
    k.drawImage(cv, 0, 0);
    for (let i = 0; i < n; i++) {
      const y = Math.floor(r() * cv.height), h = Math.floor(cv.height * (0.04 + r() * 0.12)), dx = Math.round((r() - 0.5) * 80 * (cv.width / W));
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(c, 0, y, cv.width, h, dx, y, cv.width, h); ctx.restore();
    }
  }
  FX.glitch = (ctx, L, lt) => {
    const dur = L.dur ?? 0.6;
    if (lt > dur) return;
    const f = f30(lt), look = (L.looks || LOOKS)[f % (L.looks || LOOKS).length], seed = (L.id ?? 'glitch') + f;
    if (look === 'normal') return;
    if (look === 'gray-slice' || look === 'thermal' || look === 'posterize') {
      T.pixels(ctx, (d) => {
        for (let i = 0; i < d.length; i += 4) {
          const y = (d[i] * 77 + d[i + 1] * 150 + d[i + 2] * 29) >> 8;
          if (look === 'gray-slice') { d[i] = d[i + 1] = d[i + 2] = y; }
          else if (look === 'thermal') { d[i] = THERMAL[y * 3]; d[i + 1] = THERMAL[y * 3 + 1]; d[i + 2] = THERMAL[y * 3 + 2]; }
          else { d[i] = (d[i] >> 6) * 70; d[i + 1] = Math.min(255, (d[i + 1] >> 6) * 85 + 30); d[i + 2] = Math.min(255, (d[i + 2] >> 6) * 85 + 40); }
        }
      });
    }
    if (look === 'gray-slice' || look === 'posterize') slices(ctx, seed, 3);
    if (look === 'halfhue') {
      full(ctx); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = '#7a3ac8';
      ctx.fillRect(f % 2 ? 0 : W / 2, 0, W / 2, H); ctx.restore();
    }
  };

  // ---------- rgbsplit: cyan / magenta ghosts of everything drawn so far + slice jumps ----------
  FX.rgbsplit = (ctx, L, lt) => {
    if (lt > (L.dur ?? 0.8)) return;
    const cv = ctx.canvas, snap = T.snapshot(ctx, 'rgb-src'), off = (L.offset ?? 5) * (cv.width / W) * (1 + (f30(lt) % 3) * 0.4);
    const tint = (name, color) => {
      const [c, k] = T.scratch(name, cv.width, cv.height);
      k.clearRect(0, 0, c.width, c.height); k.drawImage(snap, 0, 0);
      k.globalCompositeOperation = 'multiply'; k.fillStyle = color; k.fillRect(0, 0, c.width, c.height);
      return c;
    };
    const cyan = tint('rgb-c', '#00ffff'), mag = tint('rgb-m', '#ff00ff');
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = L.strength ?? 0.55; ctx.globalCompositeOperation = 'screen';
    ctx.drawImage(cyan, -off, 0); ctx.drawImage(mag, off, 0); ctx.restore();
    if (f30(lt) % 4 === 0) slices(ctx, (L.id ?? 'rgb') + f30(lt), 2);
  };

  // ---------- alarm strobe (5 frames on / 3 off) and CCTV overlay ----------
  FX.alarm = (ctx, L, lt) => {
    if (f30(lt) % (L.period ?? 8) >= (L.on ?? 5)) return;
    full(ctx); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha *= L.strength ?? 0.7;
    ctx.fillStyle = L.color ?? '#ff1010'; ctx.fillRect(0, 0, W, H); ctx.restore();
  };
  FX.cctv = (ctx, L, lt) => {
    full(ctx);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 6; ctx.lineCap = 'square';
    const m = 60, len = 90;
    [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]].forEach(([x, y, dx, dy]) => { ctx.beginPath(); ctx.moveTo(x, y + dy * len); ctx.lineTo(x, y); ctx.lineTo(x + dx * len, y); ctx.stroke(); });
    ctx.font = T.font(44, 800); ctx.fillStyle = '#ffffff'; ctx.textAlign = 'left'; ctx.fillText(L.label ?? 'CAM 1', m + 30, m + 70);
    if (Math.floor(lt * 2) % 2 === 0) { ctx.fillStyle = '#ff2a2a'; ctx.beginPath(); ctx.arc(W - m - 150, m + 56, 14, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.fillText('REC', W - m - 124, m + 70); }
    ctx.globalAlpha = 0.08; ctx.fillStyle = '#000';
    for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 2);
    ctx.restore();
  };

  // ---------- mist wisps rising from water / ground ----------
  FX.mist = (ctx, L, lt) => {
    const r = T.rng(T.hash(L.id ?? 'mist')), w = L.w ?? 1400, n = L.count ?? 9, a0 = ctx.globalAlpha;
    for (let i = 0; i < n; i++) {
      const life = 4 + r() * 3, ph = ((lt + r() * life) % life) / life, x = (r() - 0.5) * w + Math.sin(lt * 0.7 + i) * 40;
      const y = -ph * (L.rise ?? 320), rx = 180 + r() * 160, ry = 50 + r() * 40;
      const g = ctx.createRadialGradient(x, y, 0, x, y, rx);
      g.addColorStop(0, `rgba(235,240,245,${0.5 * Math.sin(ph * Math.PI)})`); g.addColorStop(1, 'rgba(235,240,245,0)');
      ctx.globalAlpha = a0; ctx.fillStyle = g; ctx.save(); ctx.translate(x, y); ctx.scale(1, ry / rx); ctx.translate(-x, -y);
      ctx.beginPath(); ctx.arc(x, y, rx, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    ctx.globalAlpha = a0;
  };

  // ---------- whirlpool: top-down rotating, contracting rings ----------
  FX.whirlpool = (ctx, L, lt) => {
    const R = L.size ?? 420;
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R);
    g.addColorStop(0, '#0a1a3a'); g.addColorStop(0.6, '#1f4f8a'); g.addColorStop(1, 'rgba(60,120,180,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, R, R * 0.6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(220,240,255,0.7)'; ctx.lineCap = 'round';
    for (let i = 0; i < 7; i++) {
      const k = ((i / 7 + lt * 0.25) % 1), rr = R * (1 - k) * 0.95, a = lt * (2 + i * 0.3) + i;
      ctx.lineWidth = 3 + (1 - k) * 6; ctx.beginPath(); ctx.ellipse(0, 0, rr, rr * 0.6, 0, a, a + Math.PI * 1.2); ctx.stroke();
    }
  };

  // ---------- eyes in the dark ----------
  // redeyes: { gap, size, color, on:[[a,b]] (visible windows), blink:[t...] }
  FX.redeyes = (ctx, L, lt) => {
    if (L.on && !L.on.some(([a, b]) => lt >= a && lt <= b)) return;
    if ((L.blink || []).some((t) => lt >= t && lt < t + 0.12)) return;
    const gap = L.gap ?? 60, s = L.size ?? 22, col = L.color ?? '#ff2a2a';
    ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = ((L.bloom ?? 26) * (1 + Math.sin(lt * 6) * 0.15)) * T.DPR;
    ctx.fillStyle = col;
    for (const dx of [-gap / 2, gap / 2]) { ctx.beginPath(); ctx.ellipse(dx, Math.sin(lt * 2) * 3, s, s * 0.42, dx < 0 ? 0.18 : -0.18, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  };
  FX['eyes-white'] = (ctx, L, lt) => FX.redeyes(ctx, { ...L, color: L.color ?? '#ffffff', bloom: L.bloom ?? 10, size: L.size ?? 26 }, lt);

  // wallshadow: a silhouette cast on the wall that swells 0.8 -> 1.1, sprouts horns, then its eyes pop on.
  FX.wallshadow = (ctx, L, lt) => {
    const grow = T.ease.inOut(T.prog(lt, 0, L.grow ?? 1.0)), s = (L.size ?? 520) * (0.8 + 0.3 * grow);
    const horns = T.ease.outBack(T.prog(lt, L.hornsAt ?? 0.6, 0.3));
    ctx.save(); ctx.globalAlpha *= L.alpha ?? 0.88; ctx.fillStyle = L.color ?? '#120c0a';
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.62, s * 0.3, s * 0.34, 0, 0, Math.PI * 2);
    ctx.moveTo(-s * 0.55, s * 0.2); ctx.quadraticCurveTo(-s * 0.5, -s * 0.3, 0, -s * 0.32); ctx.quadraticCurveTo(s * 0.5, -s * 0.3, s * 0.55, s * 0.2); ctx.closePath();
    for (const d of [-1, 1]) { ctx.moveTo(d * s * 0.18, -s * 0.86); ctx.quadraticCurveTo(d * s * (0.28 + 0.1 * horns), -s * (0.9 + 0.35 * horns), d * s * (0.36 + 0.06 * horns), -s * (0.95 + 0.45 * horns)); ctx.lineTo(d * s * 0.28, -s * 0.8); }
    ctx.fill(); ctx.restore();
    if (lt >= (L.eyesAt ?? 1.2)) { // eyes pop on in one frame with a short glow flash
      ctx.save(); ctx.translate(0, -s * 0.64);
      FX['eyes-white'](ctx, { gap: s * 0.22, size: s * 0.05, color: L.eyeColor, bloom: lt - (L.eyesAt ?? 1.2) < 0.07 ? 40 : 12 }, lt);
      ctx.restore();
    }
  };

  // darkness: soft black blobs creeping in from the frame edges over `dur`.
  FX.darkness = (ctx, L, lt) => {
    const p = T.ease.inOut(T.prog(lt, 0, L.dur ?? 4)), r = T.rng(T.hash(L.id ?? 'dark'));
    full(ctx);
    for (let i = 0; i < (L.count ?? 10); i++) {
      const a = r() * Math.PI * 2, d0 = 1300, d1 = 380 + r() * 260, d = T.lerp(d0, d1, p), x = W / 2 + Math.cos(a) * d, y = H / 2 + Math.sin(a) * d * 0.6, rad = 380 + r() * 220;
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
      g.addColorStop(0, `rgba(4,3,3,${0.95 * (L.strength ?? 1)})`); g.addColorStop(1, 'rgba(4,3,3,0)');
      ctx.fillStyle = g; ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    ctx.restore();
  };

  // eyelids: POV almond lids. mode 'close' | 'open' | 'blink' over `dur` (24 frames by default).
  FX.eyelids = (ctx, L, lt) => {
    const dur = L.dur ?? 0.8, mode = L.mode ?? 'close';
    let k = T.ease.inOut(T.prog(lt, 0, dur));
    if (mode === 'open') k = 1 - k;
    if (mode === 'blink') k = Math.sin(T.prog(lt, 0, dur) * Math.PI);
    if (k <= 0) return;
    full(ctx);
    ctx.fillStyle = '#050403';
    const gap = (1 - k) * H * 0.62;
    ctx.globalAlpha *= 0.25 + 0.75 * k; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath(); ctx.moveTo(-40, H / 2); ctx.quadraticCurveTo(W / 2, H / 2 - gap * 1.25, W + 40, H / 2); ctx.quadraticCurveTo(W / 2, H / 2 + gap * 1.25, -40, H / 2); ctx.fill();
    ctx.restore();
  };

  // inkburst: blobs erupt outward/up over 8 frames, splat, puddle spreads over 20 frames. bursts:[t...]
  FX.inkburst = (ctx, L, lt) => {
    const col = L.color ?? '#3b2a7a';
    for (const t0 of L.bursts || [0]) {
      const d = lt - t0;
      if (d < 0) continue;
      const r = T.rng(T.hash((L.id ?? 'ink') + t0)), fly = T.ease.outCubic(T.clamp(d / 0.27)), pud = T.ease.out(T.clamp((d - 0.2) / 0.67));
      ctx.fillStyle = col;
      ctx.beginPath(); T.smoothPath(ctx, T.blobPts(0, 30, 60 + pud * (L.puddle ?? 260), 14 + pud * 40, (L.id ?? 'ink') + 'p' + t0, 16, 0.3)); ctx.fill();
      for (let i = 0; i < (L.count ?? 9); i++) {
        const a = -Math.PI * (0.1 + r() * 0.8), sp = (L.spread ?? 300) * (0.5 + r()), x = Math.cos(a) * sp * fly, y = Math.sin(a) * sp * fly + fly * fly * 120, s = 16 + r() * 26;
        ctx.beginPath(); T.smoothPath(ctx, T.blobPts(x, y, s, s * (fly < 1 ? 0.8 : 0.45), (L.id ?? 'ink') + i + t0, 9, 0.35)); ctx.fill();
      }
    }
  };

  // paperstorm: sheets drifting outward and rotating around the layer point.
  FX.paperstorm = (ctx, L, lt) => {
    const r = T.rng(T.hash(L.id ?? 'papers'));
    for (let i = 0; i < (L.count ?? 14); i++) {
      const a = r() * Math.PI * 2, sp = 60 + r() * 120, d = 120 + ((lt * sp + r() * 600) % 700), rot = lt * (0.5 + r() * 1.5) * (r() > 0.5 ? 1 : -1) + r() * 6;
      ctx.save(); ctx.translate(Math.cos(a) * d, Math.sin(a) * d * 0.6); ctx.rotate(rot);
      T.outlined(ctx, (k) => k.rect(-40, -52, 80, 104), L.color ?? '#f3ead6', { line: 5, ink: L.ink ?? P.ink });
      ctx.strokeStyle = 'rgba(42,28,21,0.4)'; ctx.lineWidth = 3;
      for (let y = -34; y < 40; y += 16) { ctx.beginPath(); ctx.moveTo(-28, y); ctx.lineTo(24, y); ctx.stroke(); }
      ctx.restore();
    }
  };

  // ---------- flameshape: a fire grows, then morphs into an emblem silhouette with a flickering outline ----------
  const EMBLEMS = {
    bull: [[-1.05, -1.0], [-0.9, -0.62], [-0.62, -0.42], [-0.95, -0.3], [-0.55, -0.18], [-0.42, 0.25], [-0.3, 0.6], [-0.12, 0.72], [0.12, 0.72], [0.3, 0.6], [0.42, 0.25], [0.55, -0.18], [0.95, -0.3], [0.62, -0.42], [0.9, -0.62], [1.05, -1.0], [0.55, -0.55], [0.25, -0.5], [-0.25, -0.5], [-0.55, -0.55]],
    skull: [[-0.6, -0.2], [-0.55, -0.7], [0, -0.95], [0.55, -0.7], [0.6, -0.2], [0.4, 0.2], [0.35, 0.6], [-0.35, 0.6], [-0.4, 0.2]],
    eye: [[-1, 0], [-0.5, -0.45], [0, -0.55], [0.5, -0.45], [1, 0], [0.5, 0.45], [0, 0.55], [-0.5, 0.45]],
    crown: [[-0.8, 0.5], [-0.9, -0.6], [-0.45, -0.1], [0, -0.8], [0.45, -0.1], [0.9, -0.6], [0.8, 0.5]],
    man: [[-0.2, -0.95], [0.2, -0.95], [0.25, -0.6], [0.7, -0.35], [0.6, -0.2], [0.25, -0.35], [0.3, 0.9], [0.08, 0.9], [0, 0.3], [-0.08, 0.9], [-0.3, 0.9], [-0.25, -0.35], [-0.6, -0.2], [-0.7, -0.35], [-0.25, -0.6]],
  };
  FX.flameshape = (ctx, L, lt) => {
    const s = L.size ?? 320, morph = L.morphAt ?? 1.2, grow = T.ease.outCubic(T.prog(lt, 0, morph));
    if (lt < morph + 0.2) { ctx.save(); ctx.globalAlpha *= lt < morph ? 1 : 1 - (lt - morph) / 0.2; T.drawFlame(ctx, s * (0.4 + grow * 0.9), lt, 'flameshape'); ctx.restore(); }
    if (lt < morph) return;
    const pts = (EMBLEMS[L.emblem] || EMBLEMS.bull), k = T.ease.outBack(T.prog(lt, morph, 0.3)), r = T.rng(T.hash('fs' + twos(lt)));
    const shape = pts.map(([x, y]) => [x * s * 0.7 * k + (r() - 0.5) * 6, (y * s * 0.7 - s * 0.55) * k + (r() - 0.5) * 6]);
    ctx.save(); ctx.shadowColor = '#ffb030'; ctx.shadowBlur = (30) * T.DPR;
    ctx.fillStyle = L.color ?? '#f08a1a'; ctx.beginPath(); T.smoothPath(ctx, shape); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 7; ctx.beginPath(); T.smoothPath(ctx, shape); ctx.stroke();
    for (let i = 0; i < shape.length; i += 2) { const [x, y] = shape[i]; if (y < -s * 0.5) { ctx.save(); ctx.translate(x, y); T.drawFlame(ctx, 60, lt + i * 0.1, 'tongue' + i); ctx.restore(); } }
  };

  // ---------- war ----------
  // gas: green band drifting in from a side along the horizon and swelling; covers what is under it.
  FX.gas = (ctx, L, lt) => {
    const dir = L.from === 'left' ? 1 : -1, front = T.ease.inOut(T.prog(lt, 0, L.dur ?? 3)), r = T.rng(T.hash(L.id ?? 'gas'));
    const reach = W * 1.3 * front, h = (L.h ?? 220) * (0.6 + front * 0.8), a0 = ctx.globalAlpha;
    for (let i = 0; i < (L.count ?? 26); i++) {
      const u = r(), x = dir < 0 ? W / 2 + 200 - u * reach : -W / 2 - 200 + u * reach, y = (r() - 0.5) * h + Math.sin(lt * 1.2 + i) * 12, rad = 120 + r() * 140;
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
      g.addColorStop(0, L.color ?? 'rgba(127,174,74,0.75)'); g.addColorStop(1, 'rgba(127,174,74,0)');
      ctx.globalAlpha = a0; ctx.fillStyle = g; ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    ctx.globalAlpha = a0;
  };

  // muzzle: a line of shooters (count, spacing) firing in turn: 4-point star flash + tracer streak, 2-3 frames each.
  FX.muzzle = (ctx, L, lt) => {
    const n = L.count ?? 6, sp = L.spacing ?? 220, dir = L.dir ?? 1, every = L.every ?? 0.12, r = T.rng(T.hash(L.id ?? 'muzzle'));
    const order = Array.from({ length: n }, (_, i) => ({ i, off: r() * every * n, y: (r() - 0.5) * 30 }));
    for (const o of order) {
      const local = (lt + o.off) % (every * n);
      if (local > 0.09) continue;
      const x = (o.i - (n - 1) / 2) * sp, y = o.y, s = 46 * (1 - local / 0.09 * 0.4);
      ctx.save(); ctx.translate(x, y);
      ctx.fillStyle = '#ffcf4a'; ctx.beginPath();
      for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2, rr = k % 2 ? s * 0.25 : s; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      ctx.fill();
      ctx.fillStyle = '#fff6c0'; ctx.beginPath(); ctx.arc(0, 0, s * 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,207,74,0.85)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(dir * s, 0); ctx.lineTo(dir * (s + 260 + local * 3000), -8); ctx.stroke();
      ctx.restore();
    }
  };

  // shellburst: mushroom flashes popping behind a lip every `every` s across width `w` (pair with camera.shake).
  FX.shellburst = (ctx, L, lt) => {
    const every = L.every ?? 0.4, w = L.w ?? 1600;
    for (let k = Math.max(0, Math.floor(lt / every) - 2); k <= Math.floor(lt / every); k++) {
      const d = lt - k * every;
      if (d < 0 || d > 0.6) continue;
      const r = T.rng(T.hash((L.id ?? 'shell') + k)), x = (r() - 0.5) * w, p = T.clamp(d / 0.2), fade = 1 - T.clamp((d - 0.2) / 0.4), s = (L.size ?? 200) * (0.7 + r() * 0.6);
      ctx.save(); ctx.translate(x, 0); ctx.globalAlpha *= fade;
      ctx.fillStyle = '#3a2f24'; ctx.beginPath(); ctx.ellipse(0, -s * 1.1 * p, s * 0.8 * p, s * 0.45 * p, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffb030'; ctx.beginPath(); ctx.moveTo(-s * 0.25 * p, 0); ctx.quadraticCurveTo(-s * 0.15, -s * 0.6 * p, -s * 0.55 * p, -s * 1.0 * p); ctx.quadraticCurveTo(0, -s * 1.5 * p, s * 0.55 * p, -s * 1.0 * p); ctx.quadraticCurveTo(s * 0.15, -s * 0.6 * p, s * 0.25 * p, 0); ctx.fill();
      ctx.fillStyle = '#fff2a8'; ctx.beginPath(); ctx.ellipse(0, -s * 0.9 * p, s * 0.28 * p, s * 0.2 * p, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  };
})();
