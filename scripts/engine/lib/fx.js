// fx.js — emphasis effects from the reference: god rays, anime speed lines, sweat drops, anger mark, ink splat with text,
// white flash, dust puffs, sparkles, confetti. Layer: { type:'fx', kind, ...params }; drawn at the layer position.
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL, W = T.W, H = T.H;

  const FX = {
    rays(ctx, L, lt) { T.drawRays(ctx, 0, 0, lt, { color: L.color ?? 'rgba(255,248,215,0.25)', count: L.count ?? 10, spin: L.spin ?? 0.05, seed: L.id ?? 'fxrays' }); },

    // Radial speed lines around the layer point, re-randomized every 1/12 s (on-twos flicker).
    speedlines(ctx, L, lt) {
      const step = Math.floor(lt * 12), r = T.rng(T.hash((L.id ?? 'sl') + step));
      const inner = L.inner ?? 380, n = L.count ?? 70;
      ctx.fillStyle = L.color ?? 'rgba(255,255,255,0.85)';
      for (let i = 0; i < n; i++) {
        const a = r() * Math.PI * 2, w = 0.004 + r() * 0.01, r0 = inner + r() * 140, r1 = 2400;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
        ctx.lineTo(Math.cos(a - w) * r1, Math.sin(a - w) * r1);
        ctx.lineTo(Math.cos(a + w) * r1, Math.sin(a + w) * r1);
        ctx.closePath(); ctx.fill();
      }
    },

    sweat(ctx, L, lt) {
      const n = L.count ?? 3;
      for (let i = 0; i < n; i++) {
        const ph = ((lt * (L.speed ?? 1.4)) + i / n) % 1, x = (i - (n - 1) / 2) * 46, y = ph * 120;
        ctx.save(); ctx.globalAlpha *= 1 - ph; ctx.translate(x, y);
        T.outlined(ctx, (k) => { k.moveTo(0, -30); k.quadraticCurveTo(22, 0, 0, 16); k.quadraticCurveTo(-22, 0, 0, -30); }, '#7fd0f0', { line: 5 });
        ctx.restore();
      }
    },

    anger(ctx, L, lt) {
      const p = 1 + Math.max(0, Math.sin(lt * 10)) * 0.15;
      ctx.scale(p, p);
      ctx.strokeStyle = P.red; ctx.lineWidth = 14; ctx.lineCap = 'round';
      for (let i = 0; i < 4; i++) {
        ctx.save(); ctx.rotate(i * Math.PI / 2);
        ctx.beginPath(); ctx.moveTo(14, -40); ctx.quadraticCurveTo(14, -14, 40, -14); ctx.stroke();
        ctx.restore();
      }
    },

    // Ink splat that slams in, with optional text (e.g. "K.O.", "GOTCHA"). Reference: black splatter + red/white letter.
    splat(ctx, L, lt) {
      const p = T.ease.outBack(T.prog(lt, 0, 0.18)), s = (L.size ?? 360) * p;
      const pts = T.blobPts(0, 0, s, s * 0.62, (L.id ?? 'splat') + 'b', 26, 0.38);
      T.outlined(ctx, (k) => T.smoothPath(k, pts), L.color ?? '#1a0f0b', { line: 0 });
      const r = T.rng(T.hash((L.id ?? 'splat') + 'd'));
      ctx.fillStyle = L.color ?? '#1a0f0b';
      for (let i = 0; i < 14; i++) { const a = r() * Math.PI * 2, d = s * (1.05 + r() * 0.5); ctx.beginPath(); ctx.arc(Math.cos(a) * d, Math.sin(a) * d * 0.7, 6 + r() * 20 * p, 0, Math.PI * 2); ctx.fill(); }
      if (L.text) T.toonText(ctx, L.text, 0, s * 0.18, { size: (L.textSize ?? 170) * p, fill: L.textColor ?? '#f0e6e6', ink: '#000' });
    },

    flash(ctx, L, lt) {
      ctx.globalAlpha *= T.clamp(1 - lt / (L.dur ?? 0.3)) * (L.strength ?? 0.9);
      ctx.fillStyle = L.color ?? '#fff';
      ctx.fillRect(-W * 3, -H * 3, W * 6, H * 6);
    },

    dust(ctx, L, lt) {
      const r = T.rng(T.hash(L.id ?? 'dust')), n = L.count ?? 9;
      for (let i = 0; i < n; i++) {
        const a = Math.PI + r() * Math.PI, sp = 120 + r() * 220, rad = 20 + r() * 34, p = T.ease.outCubic(T.clamp(lt / 0.8));
        ctx.save(); ctx.globalAlpha *= 1 - p;
        // outlined() calls the path twice — no rng inside the path function
        T.outlined(ctx, (k) => k.arc(Math.cos(a) * sp * p, Math.sin(a) * sp * p * 0.5, rad * (0.6 + p), 0, Math.PI * 2), L.color ?? '#e8dcc4', { line: 5 });
        ctx.restore();
      }
    },

    sparkle(ctx, L, lt) {
      const r = T.rng(T.hash(L.id ?? 'spk')), n = L.count ?? 6, rad = L.radius ?? 160;
      for (let i = 0; i < n; i++) {
        const x = (r() * 2 - 1) * rad, y = (r() * 2 - 1) * rad, s = (18 + r() * 22) * Math.max(0, Math.sin(lt * 4 + i * 1.7));
        if (s <= 0.5) continue;
        T.outlined(ctx, (k) => { k.moveTo(x, y - s); k.quadraticCurveTo(x, y, x + s, y); k.quadraticCurveTo(x, y, x, y + s); k.quadraticCurveTo(x, y, x - s, y); k.quadraticCurveTo(x, y, x, y - s); }, L.color ?? '#fff6b0', { line: 4 });
      }
    },

    confetti(ctx, L, lt) {
      const r = T.rng(T.hash(L.id ?? 'conf')), cols = [P.red, P.gold, '#5fb0e8', '#7cc05a', '#fff'];
      for (let i = 0; i < (L.count ?? 60); i++) {
        const x = (r() - 0.5) * W, y0 = -H * 0.6 - r() * 300, v = 300 + r() * 300, y = y0 + lt * v;
        ctx.save(); ctx.translate(x + Math.sin(lt * 3 + i) * 30, y); ctx.rotate(lt * (2 + r() * 4));
        ctx.fillStyle = cols[i % cols.length]; ctx.fillRect(-10, -6, 20, 12); ctx.restore();
      }
    },

    // Dark vignette spotlight around the layer point — "investigation" focus.
    spotlight(ctx, L, lt) {
      ctx.save();
      const rad = (L.radius ?? 420) * (1 + Math.sin(lt * 2) * 0.02);
      const g = ctx.createRadialGradient(0, 0, rad * 0.6, 0, 0, rad * 1.6);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, `rgba(5,3,2,${L.strength ?? 0.82})`);
      ctx.fillStyle = g;
      ctx.fillRect(-W * 2, -H * 2, W * 4, H * 4);
      ctx.restore();
    },
  };
  T.FX = FX;
  T.layers.fx = (ctx, L, lt, env) => {
    const fn = FX[L.kind];
    if (!fn) throw new Error('Unknown fx kind: ' + L.kind);
    fn(ctx, L, lt, env); // env: shot env (layers, cast, camera) for fx that track other layers
  };
})();
