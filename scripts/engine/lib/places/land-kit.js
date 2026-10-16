// land-kit.js — painted landscape pieces shared by the Places 2.0 kinds: a cached sky plane with live painted
// clouds (T.richSky), rolling grass hills with bushes and tree clumps (T.hillBand), foliage trees (T.foliageTree,
// 3-tone leaf clusters, sway via cached sprites), pines, bushes, swaying grass (T.grassTufts), a distant city
// silhouette (T.cityline), perspective cobbles (T.cobbles) and water with glints (T.waterBody).
(function () {
  'use strict';
  const T = window.TOON, W = T.W, H = T.H, TAU = Math.PI * 2, OV = 420;
  const INK = '#3a281c', rgba = T.rgba;

  // ---------- sky ----------
  T.skyPalette = (bg, preset) => ({ ...T.SKY[preset || bg.preset || 'day'], ...(bg.palette || {}) });
  T.richSky = (ctx, bg, lt, env, o = {}) => {
    const pal = T.skyPalette(bg, o.preset), hz = o.horizon ?? (bg.horizon ?? 0.62) * H, sun = bg.sun || pal.sun;
    T.plane(ctx, env, { f: 0.15, key: `sky|${env.seed}|${T.bgKey(bg)}|${o.preset}|${hz}` }, (g) => {
      const gr = g.createLinearGradient(0, -OV, 0, hz);
      pal.stops.forEach((c, i) => gr.addColorStop(i / (pal.stops.length - 1), c));
      g.fillStyle = gr; g.fillRect(-OV, -OV, W + OV * 2, H + OV * 2);
      const sx = sun[0] * W, sy = sun[1] * H, sg = g.createRadialGradient(sx, sy, 0, sx, sy, 620);
      sg.addColorStop(0, pal.glow); sg.addColorStop(0.25, pal.glow + 'cc'); sg.addColorStop(1, pal.glow + '00');
      g.fillStyle = sg; g.fillRect(-OV, -OV, W + OV * 2, H + OV * 2);
      if (T.PAINT) T.paintSky.atmosphere(g, pal, sun, hz);
      if (pal.stars || bg.stars) { const r = T.rng(T.hash('stars' + env.seed)); g.fillStyle = '#ffffff'; for (let i = 0; i < 160; i++) { const s = 1 + r() * 2.4; g.globalAlpha = 0.4 + r() * 0.6; g.fillRect(r() * (W + OV * 2) - OV, r() * hz * 0.9 - OV / 2, s, s); } g.globalAlpha = 1; }
    });
    const n = o.clouds ?? bg.clouds ?? 4;
    if (n) T.plane(ctx, env, { f: 0.3, live: true }, (g) => (T.PAINT ? T.paintSky.clouds(g, { ...bg, clouds: n }, pal, lt, env.seed + (bg.seed ?? '')) : T.cloudLayer(g, { ...bg, clouds: n }, pal, lt, env.seed)));
    return { pal, hz };
  };

  // ---------- hills ----------
  T.ridgePts = (baseY, amp, freq, seed, x0 = -OV, x1 = W + OV) => {
    const pts = [];
    for (let x = x0; x <= x1; x += 24) pts.push([x, baseY - (Math.abs(T.noise(x * freq, seed)) * 0.8 + T.noise(x * freq * 2.7, seed + 'd') * 0.2 + 0.2) * amp]);
    return pts;
  };
  const ySample = (pts, x) => { for (let i = 1; i < pts.length; i++) if (pts[i][0] >= x) { const [ax, ay] = pts[i - 1], [bx, by] = pts[i]; return ay + ((by - ay) * (x - ax)) / (bx - ax || 1); } return pts[pts.length - 1][1]; };
  T.ridgeY = ySample;
  // Rolling hill band: lit crest, darker base, grass strokes, optional bushes / tree clumps along the crest.
  T.hillBand = (ctx, baseY, amp, freq, seed, fill, o = {}) => {
    const pts = T.ridgePts(baseY, amp, freq, seed), bottom = o.bottom ?? H + OV;
    const path = (k) => { k.moveTo(-OV, bottom); pts.forEach(([x, y]) => k.lineTo(x, y)); k.lineTo(W + OV, bottom); k.closePath(); };
    ctx.fillStyle = fill; ctx.beginPath(); path(ctx); ctx.fill();
    ctx.save(); ctx.beginPath(); path(ctx); ctx.clip();
    const g = ctx.createLinearGradient(0, baseY - amp, 0, baseY + (o.depth ?? 260));
    g.addColorStop(0, rgba(T.mix(fill, '#fff4c8', 0.35), 0.55)); g.addColorStop(0.35, rgba(fill, 0)); g.addColorStop(1, rgba(T.shade(fill, -0.45), 0.55));
    ctx.fillStyle = g; ctx.fillRect(-OV, baseY - amp - 10, W + OV * 2, bottom - baseY + amp + 10);
    if (T.PAINT) T.fillTexture(ctx, null, o.texture ?? 'grass', { rect: [-OV, baseY - amp - 20, W + OV * 2, bottom - baseY + amp + 20], alpha: o.texAlpha ?? 0.6, scale: o.texScale ?? 0.9, seed: 4 });
    const r = T.rng(T.hash(seed + 'strk')); // brush strokes following the slope
    ctx.lineCap = 'round';
    for (let i = 0; i < (o.strokes ?? 60); i++) {
      const x = r() * (W + OV * 2) - OV, y = ySample(pts, x) + 14 + r() * (o.depth ?? 200), len = 20 + r() * 50;
      ctx.strokeStyle = r() < 0.5 ? rgba(T.shade(fill, -0.3), 0.45) : rgba(T.mix(fill, '#fff0b0', 0.4), 0.4); ctx.lineWidth = 3 + r() * 4;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + len / 2, y - 6, x + len, y - 2); ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle = rgba(INK, o.ink ?? 0.55); ctx.lineWidth = o.line ?? 4; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
    ctx.strokeStyle = rgba(T.mix(fill, '#fff4d0', 0.5), 0.8); ctx.lineWidth = 4; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y + 4) : ctx.moveTo(x, y + 4))); ctx.stroke();
    if (o.bushes) { const br = T.rng(T.hash(seed + 'bu')); for (let i = 0; i < o.bushes; i++) { const x = br() * (W + OV) - OV / 2, y = ySample(pts, x) + 6; T.bush(ctx, x, y, (o.bushSize ?? 60) * (0.6 + br() * 0.8), seed + 'b' + i, o.bushColor ?? T.shade(fill, -0.18)); } }
    if (o.trees) { const tr = T.rng(T.hash(seed + 'tr')); for (let i = 0; i < o.trees; i++) { const x = tr() * (W + OV) - OV / 2, y = ySample(pts, x) + 8, h = (o.treeSize ?? 120) * (0.7 + tr() * 0.6); T.foliageTree(ctx, x, y, h, seed + 'tr' + i, { leaf: o.treeColor ?? T.shade(fill, -0.12), line: 3 }); } }
    return pts;
  };

  // ---------- foliage ----------
  // Leaf cluster: dark base, mid body, lit crescents toward the light, a few leaf nicks.
  function cluster(ctx, x, y, rx, ry, seed, leaf, line) {
    const pts = T.blobPts(x, y, rx, ry, seed, 16, 0.2), lit = T.mix(leaf, '#f8f0b0', 0.38), dark = T.shade(leaf, -0.32);
    T.outlined(ctx, (k) => T.smoothPath(k, pts), leaf, { line, ink: INK, shade: (k) => {
      k.fillStyle = dark; k.beginPath(); k.ellipse(x + rx * 0.15, y + ry * 0.55, rx * 1.05, ry * 0.6, 0, 0, TAU); k.fill();
      k.fillStyle = lit; k.beginPath(); k.ellipse(x - rx * 0.25, y - ry * 0.35, rx * 0.55, ry * 0.42, -0.3, 0, TAU); k.fill();
      if (T.PAINT) T.fillTexture(k, null, 'grass', { rect: [x - rx, y - ry, rx * 2, ry * 2], alpha: 0.35, scale: 0.6, rot: 180 });
      const r = T.rng(T.hash(seed + 'nick')); k.strokeStyle = rgba(T.shade(leaf, -0.45), 0.7); k.lineWidth = Math.max(2, rx * 0.04); k.lineCap = 'round';
      for (let i = 0; i < 5; i++) { const cx = x + (r() - 0.5) * rx * 1.2, cy = y + (r() - 0.3) * ry * 0.9, s = rx * (0.1 + r() * 0.08); k.beginPath(); k.arc(cx, cy, s, Math.PI * 0.15, Math.PI * 0.85); k.stroke(); }
    } });
  }
  T.leafCluster = cluster;
  // Tree drawn at its base (x, y) with height h: trunk with two boughs, 5-7 clusters. o: {leaf, trunk, line, kind}
  T.foliageTree = (ctx, x, y, h, seed, o = {}) => {
    const leaf = o.leaf ?? '#5d7d32', trunk = o.trunk ?? '#5a3e28', line = o.line ?? Math.max(3, h * 0.025), r = T.rng(T.hash(seed + 'tree'));
    if (o.kind === 'pine') { T.pine(ctx, x, y, h, leaf, line); return; }
    if (o.kind === 'cypress') { T.outlined(ctx, (k) => k.rect(x - h * 0.03, y - h * 0.2, h * 0.06, h * 0.2), trunk, { line, ink: INK }); cluster(ctx, x, y - h * 0.58, h * 0.13, h * 0.42, seed + 'c', leaf, line); return; }
    T.outlined(ctx, (k) => { k.moveTo(x - h * 0.06, y); k.quadraticCurveTo(x - h * 0.03, y - h * 0.3, x - h * 0.04, y - h * 0.55); k.lineTo(x + h * 0.04, y - h * 0.55); k.quadraticCurveTo(x + h * 0.03, y - h * 0.3, x + h * 0.07, y); k.closePath(); }, trunk, { line, ink: INK });
    for (const d of [-1, 1]) T.outlined(ctx, (k) => { k.moveTo(x, y - h * 0.38); k.quadraticCurveTo(x + d * h * 0.12, y - h * 0.45, x + d * h * 0.2, y - h * 0.62); k.lineTo(x + d * h * 0.18, y - h * 0.64); k.quadraticCurveTo(x + d * h * 0.1, y - h * 0.5, x, y - h * 0.46); k.closePath(); }, trunk, { line: line * 0.7, ink: INK });
    const n = 5 + Math.floor(r() * 3), cs = [], k = o.crown ?? 1;
    for (let i = 0; i < n; i++) { const a = (i / (n - 1) - 0.5) * 2.6, d = 0.55 + r() * 0.25; cs.push([x + Math.sin(a) * h * 0.26 * d * k, y - h * 0.68 - Math.cos(a) * h * 0.2 * d * k, h * (0.16 + r() * 0.06) * k, h * (0.13 + r() * 0.05) * k]); }
    cs.sort((a, b) => b[1] - a[1]); // lower clusters first, the crown on top
    cs.forEach(([cx, cy, rx, ry], i) => cluster(ctx, cx, cy, rx, ry, seed + 'k' + i, i % 2 ? leaf : T.shade(leaf, 0.06), line));
    cluster(ctx, x, y - h * (0.68 + 0.14 * k), h * 0.2 * k, h * 0.15 * k, seed + "top", T.shade(leaf, 0.08), line);
  };
  // A swaying tree: cached sprite rotated about its base by a pure function of time.
  T.swayTree = (ctx, env, x, y, h, seed, o = {}, lt = 0) => {
    const a = T.sway(lt, seed, o.hz ?? 0.25, (o.amp ?? 1.2) * T.DEG);
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    T.drawSprite(ctx, env, `tree|${seed}|${h}|${o.leaf}|${o.kind}`, [-h * 0.55, -h * 1.05, h * 1.1, h * 1.1], (g) => T.foliageTree(g, 0, 0, h, seed, o));
    ctx.restore();
  };
  T.pine = (ctx, x, y, h, leaf = '#3e5a3a', line = 3) => {
    T.outlined(ctx, (k) => k.rect(x - h * 0.03, y - h * 0.18, h * 0.06, h * 0.18), '#5a3e28', { line, ink: INK });
    for (let i = 0; i < 3; i++) {
      const top = y - h * (1 - i * 0.22), base = y - h * (0.42 - i * 0.12), w = h * (0.18 + i * 0.08);
      T.outlined(ctx, (k) => { k.moveTo(x, top); k.lineTo(x + w, base); k.quadraticCurveTo(x, base - h * 0.04, x - w, base); k.closePath(); }, i % 2 ? leaf : T.shade(leaf, 0.08), { line, ink: INK, shade: (k) => { k.fillStyle = rgba('#f0f4d0', 0.18); k.beginPath(); k.moveTo(x, top); k.lineTo(x - w, base); k.lineTo(x - w * 0.2, base); k.closePath(); k.fill(); } });
    }
  };
  T.bush = (ctx, x, y, w, seed, col = '#4a6a2a') => {
    const r = T.rng(T.hash(seed + 'bush'));
    for (let i = 0; i < 3; i++) cluster(ctx, x + (i - 1) * w * 0.45, y - w * (0.3 + (i === 1 ? 0.15 : 0)), w * (0.42 + r() * 0.12), w * (0.34 + r() * 0.1), seed + i, i === 1 ? T.shade(col, 0.05) : col, Math.max(2, w * 0.04));
  };
  // Swaying grass tufts along a band (live): closed-form sway per tuft.
  T.grassTufts = (ctx, y0, y1, lt, seed, o = {}) => {
    const r = T.rng(T.hash(seed + 'tufts')), col = o.color ?? '#5a7a2a', lit = T.mix(col, '#f0e090', 0.4), dark = T.shade(col, -0.3);
    for (let i = 0; i < (o.n ?? 40); i++) {
      const x = r() * (W + OV) - OV / 2, d = r(), y = y0 + d * d * (y1 - y0), s = (o.size ?? 1) * (0.5 + d * 1.1), ph = r() * TAU;
      const sw = Math.sin(lt * 1.8 + ph) * 6 * s + Math.sin(lt * 0.7 + ph * 2) * 4 * s;
      for (const [c, off] of [[dark, 0], [lit, -3 * s]]) {
        ctx.fillStyle = c; ctx.beginPath();
        ctx.moveTo(x - 14 * s, y); ctx.quadraticCurveTo(x - 10 * s, y - 14 * s, x - 18 * s + off + sw * 0.7, y - 30 * s);
        ctx.quadraticCurveTo(x - 4 * s, y - 14 * s, x, y - 4 * s); ctx.quadraticCurveTo(x + 2 * s, y - 24 * s, x + off * 0.5 + sw, y - 40 * s);
        ctx.quadraticCurveTo(x + 8 * s, y - 18 * s, x + 6 * s, y - 4 * s); ctx.quadraticCurveTo(x + 12 * s, y - 14 * s, x + 20 * s + off + sw * 0.8, y - 26 * s);
        ctx.quadraticCurveTo(x + 14 * s, y - 8 * s, x + 14 * s, y); ctx.closePath(); ctx.fill();
      }
    }
  };

  // ---------- distant city silhouette ----------
  T.cityline = (ctx, baseY, seed, col, o = {}) => {
    const r = T.rng(T.hash(seed + 'city')), lit = T.mix(col, '#fff0c8', 0.25);
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-OV, baseY + 40);
    for (let x = -OV; x < W + OV;) {
      const w = 50 + r() * 110, h = (o.h ?? 160) * (0.35 + r() * 0.75), kind = r();
      ctx.lineTo(x, baseY - h);
      if (kind < 0.18) { ctx.lineTo(x + w * 0.5, baseY - h - w * 0.45); ctx.lineTo(x + w, baseY - h); } // gable
      else if (kind < 0.26 && o.domes !== false) { ctx.arc(x + w / 2, baseY - h, w / 2, Math.PI, 0); }
      else if (kind < 0.32) { ctx.lineTo(x + w * 0.4, baseY - h); ctx.lineTo(x + w * 0.4, baseY - h - 70); ctx.lineTo(x + w * 0.5, baseY - h - 110); ctx.lineTo(x + w * 0.6, baseY - h - 70); ctx.lineTo(x + w * 0.6, baseY - h); ctx.lineTo(x + w, baseY - h); } // spire
      else if (kind < 0.45) { ctx.lineTo(x + w * 0.7, baseY - h); ctx.lineTo(x + w * 0.7, baseY - h - 40); ctx.lineTo(x + w * 0.8, baseY - h - 40); ctx.lineTo(x + w * 0.8, baseY - h); ctx.lineTo(x + w, baseY - h); } // chimney
      else ctx.lineTo(x + w, baseY - h);
      x += w;
    }
    ctx.lineTo(W + OV, baseY + 40); ctx.closePath(); ctx.fill();
    if (o.windows !== false) { const wr = T.rng(T.hash(seed + 'cw')); ctx.fillStyle = rgba(o.windowColor ?? lit, o.windowAlpha ?? 0.5); for (let i = 0; i < 220; i++) { const x = wr() * (W + OV * 2) - OV, y = baseY - wr() * (o.h ?? 160) * 0.6; ctx.fillRect(x, y, 6, 8); } }
  };

  // ---------- cobbles ----------
  T.cobbles = (ctx, y0, y1, seed, col = '#9a8f80', o = {}) => {
    const r = T.rng(T.hash(seed + 'cob')), vx = o.vx ?? W / 2;
    ctx.fillStyle = T.shade(col, -0.35); ctx.fillRect(-OV, y0, W + OV * 2, y1 - y0);
    for (let row = 0, y = y0 + 4; y < y1; row++) {
      const t = (y - y0) / (H - y0 + 1), sh = 14 + t * 46, sw = 30 + t * 80;
      for (let x = -OV + (row % 2) * sw * 0.5 + (vx % sw); x < W + OV; x += sw) {
        const tone = T.shade(col, (r() - 0.5) * 0.24), cx = x + (r() - 0.5) * sw * 0.12;
        ctx.fillStyle = tone; ctx.beginPath(); ctx.ellipse(cx, y + sh / 2, sw * 0.44, sh * 0.42, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = rgba('#fff8e0', 0.22); ctx.beginPath(); ctx.ellipse(cx - sw * 0.06, y + sh * 0.36, sw * 0.28, sh * 0.16, 0, 0, TAU); ctx.fill();
      }
      y += sh;
    }
    if (T.PAINT) T.fillTexture(ctx, null, 'stone', { rect: [-OV, y0, W + OV * 2, y1 - y0], alpha: 0.25, scale: 1.4 });
    const near = ctx.createLinearGradient(0, y0, 0, y1); near.addColorStop(0, rgba('#140a06', 0.25)); near.addColorStop(0.2, rgba('#140a06', 0)); near.addColorStop(1, rgba('#140a06', 0.3));
    ctx.fillStyle = near; ctx.fillRect(-OV, y0, W + OV * 2, y1 - y0);
  };

  // ---------- water ----------
  // Static body (cached): gradient, texture, sky reflection band. Live glints: T.waterGlints.
  T.waterBody = (ctx, y0, y1, col = '#4a90b8', o = {}) => {
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, T.mix(col, o.sky ?? '#e8f4f8', 0.45)); g.addColorStop(0.25, col); g.addColorStop(1, T.shade(col, -0.35));
    ctx.fillStyle = g; ctx.fillRect(-OV, y0, W + OV * 2, y1 - y0);
    if (T.PAINT) T.fillTexture(ctx, null, 'water', { rect: [-OV, y0, W + OV * 2, y1 - y0], alpha: 0.7, scale: 1.2 });
    ctx.strokeStyle = rgba(INK, 0.5); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-OV, y0); ctx.lineTo(W + OV, y0); ctx.stroke();
  };
  T.waterGlints = (ctx, y0, y1, lt, seed, o = {}) => {
    const r = T.rng(T.hash(seed + 'gl')), n = o.n ?? 40;
    ctx.save(); ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const t = r(), y = y0 + 10 + t * t * (y1 - y0 - 10), len = 20 + t * 90 + r() * 30, ph = r() * TAU, sp = 6 + r() * 14;
      const x = ((r() * (W + OV * 2) + lt * sp * (o.flow ?? 1)) % (W + OV * 2)) - OV, a = 0.25 + 0.45 * Math.max(0, Math.sin(lt * 1.6 + ph));
      ctx.strokeStyle = rgba(o.color ?? '#ffffff', a); ctx.lineWidth = 2 + t * 4;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + len / 2, y - 3 - t * 3, x + len, y); ctx.stroke();
    }
    ctx.restore();
  };
})();
