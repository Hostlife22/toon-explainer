// overlays-fx.js — full-frame overlays: cracked glass and petrify (the viewer is turned to stone).
// Measured on the reference library: a framed portrait's glass cracks in a single frame for a death elsewhere (horror
// biography 5:57); the myth film ends by covering the whole frame with a two-stage cracked-stone overlay (21:23).
(function () {
  'use strict';
  const T = window.TOON, W = T.W, H = T.H, FX = T.FX, INK = T.PAL.ink;
  const full = (ctx) => { const s = ctx.canvas.width / W; ctx.save(); ctx.setTransform(s, 0, 0, s, 0, 0); };

  // Seeded crack network around (0, 0): `spokes` jagged radial lines and `rings` broken concentric arcs.
  function crackPaths(seed, radius, spokes, rings) {
    const r = T.rng(T.hash(seed)), lines = [];
    const angles = Array.from({ length: spokes }, (_, i) => (i / spokes) * Math.PI * 2 + (r() - 0.5) * 0.5);
    for (const a of angles) {
      const pts = [[0, 0]], len = radius * (0.55 + r() * 0.45), steps = 5 + Math.floor(r() * 3);
      for (let k = 1; k <= steps; k++) {
        const d = (k / steps) * len, wob = (r() - 0.5) * 0.35;
        pts.push([Math.cos(a + wob) * d, Math.sin(a + wob) * d]);
      }
      lines.push(pts);
    }
    for (let j = 1; j <= rings; j++) {
      const rad = radius * (0.18 + 0.26 * j) * (0.9 + r() * 0.2);
      for (let i = 0; i < angles.length; i++) {
        if (r() < 0.35) continue; // broken rings: some segments missing
        const a0 = angles[i], a1 = angles[(i + 1) % angles.length] + (i + 1 === angles.length ? Math.PI * 2 : 0);
        lines.push([[Math.cos(a0) * rad, Math.sin(a0) * rad], [Math.cos((a0 + a1) / 2) * rad * (0.92 + r() * 0.1), Math.sin((a0 + a1) / 2) * rad * (0.92 + r() * 0.1)], [Math.cos(a1) * rad, Math.sin(a1) * rad]]);
      }
    }
    return lines;
  }
  function strokeLines(ctx, lines, upto, color, width) {
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    for (const [w, c] of [[width + 4, INK], [width, color]]) {
      ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath();
      for (const pts of lines) {
        const n = Math.max(1, Math.round((pts.length - 1) * upto));
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (let k = 1; k <= n; k++) ctx.lineTo(pts[k][0], pts[k][1]);
      }
      ctx.stroke();
    }
  }

  // ---------- crack: glass cracks from the impact point (layer x, y) ----------
  // { size 420 (radius px), spokes 9, rings 2, dur 0.07 (2 frames to spread), color #f4fbff, shade 0.18 (milky tint) }
  FX.crack = (ctx, L, lt) => {
    if (lt < 0) return;
    const R = L.size ?? 420, upto = T.clamp(lt / (L.dur ?? 0.07));
    const lines = crackPaths((L.id ?? 'crack') + ':c', R, L.spokes ?? 9, L.rings ?? 2);
    if ((L.shade ?? 0.18) > 0) {
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R);
      g.addColorStop(0, `rgba(235,245,255,${L.shade ?? 0.18})`); g.addColorStop(1, 'rgba(235,245,255,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill();
    }
    strokeLines(ctx, lines, upto, L.color ?? '#f4fbff', 3);
    // impact star: a small bright knot at the centre
    ctx.fillStyle = L.color ?? '#f4fbff'; ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill();
  };

  // ---------- petrify: the whole visible frame turns to cracked stone, in two stages ----------
  // { dur 0.4 (stage 1 ramp), stage2 (time of the second, heavier stage; default dur + 0.8), color #8e8a84, strength 0.85 }
  FX.petrify = (ctx, L, lt, env) => {
    if (lt < 0) return;
    const [lo, vw] = T.visibleSpan(env), cx = lo + vw / 2, s2 = L.stage2 ?? (L.dur ?? 0.4) + 0.8;
    const p1 = T.ease.out(T.clamp(lt / (L.dur ?? 0.4))), p2 = T.clamp((lt - s2) / 0.1);
    full(ctx);
    // stone wash: drain colour, then a flat grey multiply that deepens on stage two
    ctx.globalCompositeOperation = 'saturation'; ctx.globalAlpha = p1; ctx.fillStyle = '#808080'; ctx.fillRect(lo, 0, vw, H);
    ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = (L.strength ?? 0.85) * (0.55 * p1 + 0.45 * p2); ctx.fillStyle = L.color ?? '#8e8a84'; ctx.fillRect(lo, 0, vw, H);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    // speckle grain of the stone (seeded, fixed per layer so it does not shimmer)
    const r = T.rng(T.hash((L.id ?? 'petrify') + ':g'));
    ctx.fillStyle = 'rgba(42,28,21,0.22)';
    for (let i = 0; i < 260 * p1; i++) { const x = lo + r() * vw, y = r() * H; ctx.fillRect(x, y, 3 + r() * 4, 3 + r() * 4); }
    // cracks creep in from the frame edges (stage 1) and split across the middle (stage 2)
    const edges = [[lo, H * 0.3], [lo + vw, H * 0.62], [cx - vw * 0.1, 0], [cx + vw * 0.15, H]];
    edges.forEach(([x, y], i) => {
      ctx.save(); ctx.translate(x, y);
      strokeLines(ctx, crackPaths((L.id ?? 'petrify') + ':e' + i, Math.max(vw, H) * 0.45, 4, 0), p1 * 0.6 + p2 * 0.4, '#5a544e', 4);
      ctx.restore();
    });
    if (p2 > 0) { ctx.save(); ctx.translate(cx, H * 0.48); strokeLines(ctx, crackPaths((L.id ?? 'petrify') + ':m', Math.max(vw, H) * 0.7, 7, 1), p2, '#4a4540', 5); ctx.restore(); }
    ctx.restore();
  };
  // ---------- hatch: a cross-hatch net closes over the frame (the "render collapse" of a game world, WW1 30:23) ----------
  // { dur 0.4 (the net spreads in from `from`), from 'left' | 'right' | 'all', spacing 26, width 3, color #2a1c15,
  //   wash (a colour washed over the frame first, e.g. #ffd6e0), washAt (seconds before the net; 1.0) }; the layer `alpha` scales it
  FX.hatch = (ctx, L, lt, env) => {
    if (lt < 0) return;
    const [lo, vw] = T.visibleSpan(env), washAt = L.washAt ?? (L.wash ? 1.0 : 0), t = lt - washAt, a0 = ctx.globalAlpha; // keeps exit fades
    full(ctx);
    if (L.wash) { // the wash creeps over the first half of the frame, then the whole frame
      const pw = T.clamp(lt / Math.max(0.01, washAt || 0.4));
      ctx.globalAlpha = a0 * 0.85; ctx.fillStyle = L.wash; ctx.fillRect(lo, 0, vw * (0.5 + 0.5 * T.clamp(t / 0.3 + 1)) * pw, H); ctx.globalAlpha = a0;
    }
    if (t >= 0) {
      const p = T.ease.out(T.clamp(t / (L.dur ?? 0.4))), from = L.from ?? 'left', sp = Math.max(6, Number(L.spacing) || 26);
      ctx.save(); ctx.beginPath();
      if (from === 'all') ctx.rect(lo, 0, vw, H);
      else if (from === 'right') ctx.rect(lo + vw * (1 - p), 0, vw * p, H);
      else ctx.rect(lo, 0, vw * p, H);
      ctx.clip();
      ctx.globalAlpha = a0 * 0.85 * (from === 'all' ? p : 1); // the layer's own `alpha` already sits in a0
      ctx.strokeStyle = L.color ?? INK; ctx.lineWidth = L.width ?? 3;
      ctx.beginPath();
      for (let x = lo - H; x < lo + vw + H; x += sp) { ctx.moveTo(x, 0); ctx.lineTo(x + H, H); ctx.moveTo(x + H, 0); ctx.lineTo(x, H); }
      ctx.stroke(); ctx.restore();
    }
    ctx.restore();
  };
})();
