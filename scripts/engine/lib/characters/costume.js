// costume.js — painted costume detail on the bean robe: woven fabric texture, cloth folds as shaded wedges with light
// ridges that swing with the spring secondary motion, a hem shadow, a shaded belt with a buckle, and patches with
// stitches (look.patches, any look). Called from rig.js body() inside the torso frame (robe path units).
// Look fields: fabric (true | false | texture kind, painted default on), patches (true | count 0..8), folds (false = none).
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL;

  function folds(ctx, robe, sway, seed) {
    const r = T.rng(T.hash('folds:' + seed)), dark = T.shade(robe, -0.2), light = T.shade(robe, 0.14), hx = sway * 0.45;
    [-92, -38, 28, 86].forEach((x0) => {
      const x = x0 + (r() - 0.5) * 16, top = -215 + r() * 40, w = 12 + r() * 8;
      ctx.fillStyle = dark; ctx.globalAlpha = 0.6;
      ctx.beginPath(); ctx.moveTo(x, top); ctx.quadraticCurveTo(x + w * 0.4 + hx * 0.3, -130, x + w + hx, -58); ctx.lineTo(x - w * 0.5 + hx, -58); ctx.quadraticCurveTo(x - 2 + hx * 0.3, -130, x, top); ctx.fill();
      ctx.globalAlpha = 0.7; ctx.strokeStyle = light; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x + w * 0.9, top + 30); ctx.quadraticCurveTo(x + w * 1.2 + hx * 0.3, -120, x + w * 1.6 + hx, -66); ctx.stroke();
      ctx.globalAlpha = 1;
    });
    ctx.strokeStyle = T.shade(robe, -0.3); ctx.lineWidth = 5; ctx.beginPath(); // hem: a slightly wavy shadow edge
    for (let i = 0; i <= 12; i++) { const x = -150 + i * 25 + hx, y = -74 + Math.sin(i * 1.7) * 4; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke();
  }

  function patches(ctx, robe, n, seed) {
    const r = T.rng(T.hash('patch:' + seed)), col = T.mix(robe, '#c9a76c', 0.5);
    for (let i = 0; i < n; i++) {
      const x = -95 + r() * 170, y = -260 + r() * 170, w = 34 + r() * 22, h = 30 + r() * 18, a = (r() - 0.5) * 0.5;
      ctx.save(); ctx.translate(x, y); ctx.rotate(a);
      T.outlined(ctx, (k) => T.rrect(k, -w / 2, -h / 2, w, h, 6), col, { line: 4 });
      ctx.strokeStyle = T.shade(col, -0.4); ctx.lineWidth = 2.5; ctx.setLineDash([6, 6]);
      ctx.beginPath(); T.rrect(ctx, -w / 2 + 6, -h / 2 + 6, w - 12, h - 12, 3); ctx.stroke(); ctx.setLineDash([]);
      ctx.restore();
    }
  }

  // o: {path (robe path callback), sway (secondary motion x, units), seed, stage 'under' (folds, before the outfit) |
  // 'over' (fabric weave and patches, after the outfit)}
  T.paintCostume = (ctx, c, view, o) => {
    const robe = c.robe ?? P.red, seed = o.seed || robe;
    ctx.save(); ctx.beginPath(); o.path(ctx); ctx.clip();
    if (o.stage === 'under') { if (T.PAINT && c.folds !== false) folds(ctx, robe, o.sway || 0, seed); }
    else {
      if (T.PAINT && c.fabric !== false && T.fillTexture) T.fillTexture(ctx, o.path, typeof c.fabric === 'string' ? c.fabric : 'fabric', { alpha: 0.28, scale: 0.7 });
      if (c.patches) patches(ctx, robe, c.patches === true ? 2 : c.patches, seed);
    }
    ctx.restore();
  };

  // Shaded belt band with a buckle (painted look), following the waist curve.
  T.paintBelt = (ctx, col) => {
    const band = (k) => { k.moveTo(-126, -196); k.quadraticCurveTo(0, -182, 126, -196); k.lineTo(126, -176); k.quadraticCurveTo(0, -162, -126, -176); k.closePath(); };
    T.outlined(ctx, band, col, { line: 5 });
    T.outlined(ctx, (k) => T.rrect(k, 18, -196, 30, 30, 6), '#d8b24a', { line: 5 });
    ctx.strokeStyle = T.shade('#d8b24a', -0.35); ctx.lineWidth = 4; ctx.beginPath(); T.rrect(ctx, 26, -188, 14, 14, 3); ctx.stroke();
  };
})();
