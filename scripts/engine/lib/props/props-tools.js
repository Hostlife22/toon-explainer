// props-tools.js — tools and weapons drawn with the painted materials (props-paint.js): hammer, wrench, saw, shovel,
// pickaxe, anvil, axe, bow, pistol, musket, cannon. Centred at the origin, `size` = largest dimension; handheld tools
// stand upright (head up) so bean `hold` keeps working. Fields: color (metal), wood, fire (cannon / pistol / musket:
// shot time in layer seconds — a muzzle flash, smoke puff and recoil), draw (bow: 0..1 or timeline).
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL, TAU = Math.PI * 2;
  const LW = (s) => Math.max(3, s * 0.02);
  const STEEL = '#b9c0c8', IRON = '#5a5f66', WOOD = '#9a6236';
  const handle = (ctx, s, x, y0, y1, w, wood) => T.matWood(ctx, (k) => T.rrect(k, x - w / 2, y0, w, y1 - y0, w / 2), wood, { line: LW(s), rot: 90, grain: Math.max(0.2, s / 1200) });
  const smokeCache = new Map();
  // Muzzle flash + smoke + recoil after o.fire (layer seconds) at muzzle (mx, my) pointing along +x.
  function firing(ctx, o, s, lt, mx, my) {
    if (o.fire == null) return 0;
    const shots = Array.isArray(o.fire) ? o.fire : [o.fire];
    let recoil = 0;
    shots.forEach((t0, n) => {
      const a = lt - t0;
      if (a < 0 || a > 2.5) return;
      recoil = Math.max(recoil, Math.exp(-a * 9) * (a < 0.05 ? a / 0.05 : 1));
      const key = (o.id ?? 'gun') + n + s.toFixed(0);
      let e = smokeCache.get(key);
      if (!e) { e = { preset: 'smoke', id: key, burst: 9, dir: 0, spread: 50, speed: s * 1.4, drag: 3, gravity: -40, life: 2.2, size: [s * 0.12, s * 0.22], grow: 2.4, w: 4, h: 4, colors: ['#cfc8bc', '#8f877c', '#f1ece2'] }; smokeCache.set(key, e); }
      ctx.save(); ctx.translate(mx, my); T.drawParticles(ctx, e, a);
      if (a < 0.1) { // 3-frame star flash
        const r = s * 0.22 * (1 - a / 0.1 * 0.4);
        ctx.fillStyle = '#ffd040'; ctx.beginPath(); for (let i = 0; i <= 16; i++) { const an = (i / 16) * TAU, q = i % 2 ? r * 0.4 : r * (i % 4 ? 0.8 : 1.4); ctx.lineTo(Math.cos(an) * q + r * 0.6, Math.sin(an) * q * 0.7); } ctx.fill();
        ctx.fillStyle = '#fff6c8'; ctx.beginPath(); ctx.ellipse(r * 0.5, 0, r * 0.4, r * 0.25, 0, 0, TAU); ctx.fill();
      }
      ctx.restore();
    });
    return recoil;
  }

  const TOOLS = {
    hammer(ctx, s, lt, o) {
      handle(ctx, s, 0, -s * 0.3, s * 0.5, s * 0.08, o.wood ?? WOOD);
      T.matMetal(ctx, (k) => { k.moveTo(-s * 0.26, -s * 0.48); k.lineTo(s * 0.18, -s * 0.48); k.quadraticCurveTo(s * 0.3, -s * 0.44, s * 0.34, -s * 0.5); k.lineTo(s * 0.3, -s * 0.3); k.quadraticCurveTo(s * 0.24, -s * 0.36, s * 0.18, -s * 0.3); k.lineTo(-s * 0.26, -s * 0.3); k.closePath(); }, o.color ?? IRON, { line: LW(s), axis: 'y' });
      T.matMetal(ctx, (k) => k.rect(-s * 0.32, -s * 0.47, s * 0.08, s * 0.16), T.shade(o.color ?? IRON, 0.1), { line: LW(s) });
    },
    wrench(ctx, s, lt, o) {
      const col = o.color ?? STEEL;
      T.matMetal(ctx, (k) => { k.moveTo(-s * 0.05, -s * 0.28); k.lineTo(s * 0.05, -s * 0.28); k.lineTo(s * 0.06, s * 0.4); k.quadraticCurveTo(0, s * 0.5, -s * 0.06, s * 0.4); k.closePath(); }, col, { line: LW(s) });
      T.matMetal(ctx, (k) => { const r = s * 0.16, cy = -s * 0.34; k.arc(0, cy, r, -Math.PI / 2 + 0.42, -Math.PI / 2 - 0.42 + TAU); k.lineTo(-s * 0.055, cy - r * 0.2); k.lineTo(s * 0.055, cy - r * 0.2); k.closePath(); }, col, { line: LW(s) }); // open-end jaw
      T.matMetal(ctx, (k) => k.arc(0, s * 0.36, s * 0.035, 0, TAU), T.shade(col, -0.35), { line: LW(s) * 0.6 });
    },
    saw(ctx, s, lt, o) {
      T.matMetal(ctx, (k) => { k.moveTo(-s * 0.5, -s * 0.06); k.lineTo(s * 0.22, -s * 0.16); k.lineTo(s * 0.22, s * 0.12); for (let i = 0; i <= 18; i++) { const x = s * 0.22 - (i / 18) * s * 0.72; k.lineTo(x, s * (i % 2 ? 0.16 : 0.12) - (i / 18) * s * 0.04 * 0 + (1 - i / 18) * 0); } k.lineTo(-s * 0.5, s * 0.04); k.closePath(); }, o.color ?? STEEL, { line: LW(s) * 0.8, axis: 'y' });
      T.matWood(ctx, (k) => { k.moveTo(s * 0.2, -s * 0.2); k.quadraticCurveTo(s * 0.5, -s * 0.24, s * 0.5, s * 0.02); k.quadraticCurveTo(s * 0.48, s * 0.2, s * 0.2, s * 0.16); k.closePath(); }, o.wood ?? WOOD, { line: LW(s), grain: 0.3 });
      T.outlined(ctx, (k) => k.ellipse(s * 0.36, -s * 0.02, s * 0.07, s * 0.08, 0, 0, TAU), '#3a2418', { line: LW(s) * 0.7, paint: false });
    },
    shovel(ctx, s, lt, o) {
      handle(ctx, s, 0, -s * 0.5, s * 0.12, s * 0.06, o.wood ?? WOOD);
      T.matWood(ctx, (k) => T.rrect(k, -s * 0.1, -s * 0.52, s * 0.2, s * 0.06, s * 0.03), o.wood ?? WOOD, { line: LW(s), grain: 0.2 });
      T.matMetal(ctx, (k) => { k.moveTo(-s * 0.05, s * 0.06); k.lineTo(s * 0.05, s * 0.06); k.lineTo(s * 0.16, s * 0.14); k.quadraticCurveTo(s * 0.18, s * 0.42, 0, s * 0.5); k.quadraticCurveTo(-s * 0.18, s * 0.42, -s * 0.16, s * 0.14); k.closePath(); }, o.color ?? '#7a7f86', { line: LW(s) });
    },
    pickaxe(ctx, s, lt, o) {
      handle(ctx, s, 0, -s * 0.36, s * 0.5, s * 0.07, o.wood ?? WOOD);
      T.matMetal(ctx, (k) => { k.moveTo(-s * 0.5, -s * 0.22); k.quadraticCurveTo(-s * 0.2, -s * 0.5, 0, -s * 0.48); k.quadraticCurveTo(s * 0.2, -s * 0.5, s * 0.5, -s * 0.22); k.quadraticCurveTo(s * 0.2, -s * 0.4, 0, -s * 0.36); k.quadraticCurveTo(-s * 0.2, -s * 0.4, -s * 0.5, -s * 0.22); k.closePath(); }, o.color ?? IRON, { line: LW(s), axis: 'y' });
    },
    anvil(ctx, s, lt, o) {
      const col = o.color ?? '#4a4e56';
      T.matMetal(ctx, (k) => { k.moveTo(-s * 0.28, s * 0.46); k.lineTo(-s * 0.2, s * 0.3); k.lineTo(s * 0.2, s * 0.3); k.lineTo(s * 0.28, s * 0.46); k.closePath(); }, col, { line: LW(s), axis: 'y' });
      T.matMetal(ctx, (k) => { k.moveTo(-s * 0.12, s * 0.3); k.lineTo(-s * 0.15, -s * 0.02); k.lineTo(s * 0.15, -s * 0.02); k.lineTo(s * 0.12, s * 0.3); k.closePath(); }, T.shade(col, -0.1), { line: LW(s) });
      T.matMetal(ctx, (k) => { k.moveTo(-s * 0.5, -s * 0.16); k.quadraticCurveTo(-s * 0.36, -s * 0.18, -s * 0.28, -s * 0.2); k.lineTo(s * 0.4, -s * 0.2); k.lineTo(s * 0.4, -s * 0.02); k.lineTo(-s * 0.22, -s * 0.02); k.quadraticCurveTo(-s * 0.38, -s * 0.06, -s * 0.5, -s * 0.16); k.closePath(); }, col, { line: LW(s), axis: 'y' });
      ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fillRect(-s * 0.2, -s * 0.2, s * 0.5, s * 0.02);
    },
    axe(ctx, s, lt, o) {
      handle(ctx, s, 0, -s * 0.4, s * 0.5, s * 0.07, o.wood ?? WOOD);
      T.matMetal(ctx, (k) => { k.moveTo(-s * 0.04, -s * 0.44); k.lineTo(s * 0.16, -s * 0.42); k.quadraticCurveTo(s * 0.36, -s * 0.5, s * 0.4, -s * 0.36); k.quadraticCurveTo(s * 0.44, -s * 0.18, s * 0.36, -s * 0.06); k.quadraticCurveTo(s * 0.32, -s * 0.18, s * 0.16, -s * 0.22); k.lineTo(-s * 0.04, -s * 0.24); k.closePath(); }, o.color ?? '#8a9098', { line: LW(s) });
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = s * 0.018; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(s * 0.37, -s * 0.38); ctx.quadraticCurveTo(s * 0.41, -s * 0.22, s * 0.35, -s * 0.1); ctx.stroke();
    },
    bow(ctx, s, lt, o) {
      const d = T.clamp(T.num(o.draw ?? 0, lt, 0)), pull = s * 0.32 * d;
      ctx.strokeStyle = P.ink; ctx.lineWidth = s * 0.075; ctx.lineCap = 'round';
      const arc = (k) => { k.beginPath(); k.moveTo(-s * 0.04, -s * 0.48); k.quadraticCurveTo(s * (0.42 + d * 0.08), 0, -s * 0.04, s * 0.48); };
      arc(ctx); ctx.stroke(); ctx.strokeStyle = o.wood ?? WOOD; ctx.lineWidth = s * 0.045; arc(ctx); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = s * 0.012; arc(ctx); ctx.stroke();
      ctx.strokeStyle = '#efe6cf'; ctx.lineWidth = Math.max(1.5, s * 0.01); ctx.beginPath(); ctx.moveTo(-s * 0.04, -s * 0.48); ctx.lineTo(-pull, 0); ctx.lineTo(-s * 0.04, s * 0.48); ctx.stroke();
      if (o.arrow !== false) { T.matWood(ctx, (k) => k.rect(-pull, -s * 0.012, s * 0.62, s * 0.024), '#c9a06a', { line: LW(s) * 0.5 }); T.matMetal(ctx, (k) => { k.moveTo(s * 0.62 - pull, -s * 0.04); k.lineTo(s * 0.72 - pull, 0); k.lineTo(s * 0.62 - pull, s * 0.04); k.closePath(); }, STEEL, { line: LW(s) * 0.5 }); T.outlined(ctx, (k) => { k.moveTo(-pull, 0); k.lineTo(-pull + s * 0.08, -s * 0.05); k.lineTo(-pull + s * 0.1, 0); k.lineTo(-pull + s * 0.08, s * 0.05); k.closePath(); }, P.red, { line: LW(s) * 0.5 }); }
    },
    pistol(ctx, s, lt, o) {
      const rc = firing(ctx, o, s, lt, s * 0.5, -s * 0.18);
      ctx.rotate(-rc * 0.35);
      T.matWood(ctx, (k) => { k.moveTo(-s * 0.18, -s * 0.12); k.lineTo(s * 0.02, -s * 0.12); k.lineTo(-s * 0.14, s * 0.36); k.quadraticCurveTo(-s * 0.3, s * 0.4, -s * 0.36, s * 0.3); k.closePath(); }, o.wood ?? '#7a4a26', { line: LW(s), grain: 0.25 });
      T.matMetal(ctx, (k) => k.rect(-s * 0.2, -s * 0.24, s * 0.7, s * 0.12), o.color ?? IRON, { line: LW(s), axis: 'y' });
      T.matMetal(ctx, (k) => k.ellipse(-s * 0.06, -s * 0.12, s * 0.1, s * 0.08, 0, 0, TAU), '#8a8f96', { line: LW(s) * 0.8 });
      ctx.strokeStyle = P.ink; ctx.lineWidth = LW(s); ctx.beginPath(); ctx.arc(-s * 0.02, -s * 0.02, s * 0.08, 0.2, Math.PI - 0.2); ctx.stroke();
    },
    musket(ctx, s, lt, o) {
      const rc = firing(ctx, o, s, lt, s * 0.5, -s * 0.04);
      ctx.translate(-rc * s * 0.05, 0);
      T.matWood(ctx, (k) => { k.moveTo(-s * 0.5, s * 0.02); k.lineTo(-s * 0.2, -s * 0.03); k.lineTo(s * 0.32, -s * 0.03); k.lineTo(s * 0.32, s * 0.02); k.lineTo(-s * 0.16, s * 0.03); k.lineTo(-s * 0.46, s * 0.11); k.closePath(); }, o.wood ?? '#8a5a32', { line: LW(s) * 0.6, grain: 0.2 });
      T.matMetal(ctx, (k) => k.rect(-s * 0.18, -s * 0.06, s * 0.68, s * 0.03), o.color ?? IRON, { line: LW(s) * 0.5, axis: 'y' });
      for (const x of [0.02, 0.24]) T.matMetal(ctx, (k) => k.rect(s * x, -s * 0.065, s * 0.02, s * 0.09), '#c99a3a', { line: LW(s) * 0.35 });
      T.matMetal(ctx, (k) => { k.moveTo(-s * 0.16, -s * 0.03); k.lineTo(-s * 0.13, -s * 0.09); k.lineTo(-s * 0.1, -s * 0.03); k.closePath(); }, IRON, { line: LW(s) * 0.35 });
    },
    cannon(ctx, s, lt, o) {
      const rc = firing(ctx, o, s, lt, s * 0.52, -s * 0.2), col = o.color ?? '#3e4248';
      ctx.save(); ctx.translate(-rc * s * 0.08, 0);
      T.matMetal(ctx, (k) => { k.moveTo(-s * 0.42, -s * 0.06); k.quadraticCurveTo(-s * 0.48, -s * 0.2, -s * 0.36, -s * 0.3); k.lineTo(s * 0.46, -s * 0.28); k.lineTo(s * 0.46, -s * 0.12); k.lineTo(-s * 0.3, -s * 0.02); k.closePath(); }, col, { line: LW(s), axis: 'y' });
      for (const x of [-0.2, 0.1, 0.42]) T.matMetal(ctx, (k) => k.rect(s * x, -s * 0.31, s * 0.05, s * (0.24 - (x + 0.2) * 0.1)), T.shade(col, 0.12), { line: LW(s) * 0.6 });
      ctx.restore();
      const wood = o.wood ?? '#8a5a32';
      T.matWood(ctx, (k) => { k.moveTo(-s * 0.5, s * 0.3); k.lineTo(-s * 0.3, -s * 0.06); k.lineTo(s * 0.18, -s * 0.06); k.lineTo(s * 0.26, s * 0.3); k.closePath(); }, wood, { line: LW(s), grain: 0.3 });
      ctx.save(); ctx.translate(0, s * 0.24); ctx.rotate(-lt * 0 - rc * 0.6);
      T.matWood(ctx, (k) => k.arc(0, 0, s * 0.22, 0, TAU), T.shade(wood, 0.08), { line: LW(s), grain: 0.3 });
      ctx.strokeStyle = P.ink; ctx.lineWidth = LW(s) * 0.8; for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a) * s * 0.05, Math.sin(a) * s * 0.05); ctx.lineTo(Math.cos(a) * s * 0.2, Math.sin(a) * s * 0.2); ctx.stroke(); }
      T.matMetal(ctx, (k) => { k.arc(0, 0, s * 0.22, 0, TAU); k.arc(0, 0, s * 0.18, 0, TAU, true); }, IRON, { line: LW(s) * 0.6 });
      T.matMetal(ctx, (k) => k.arc(0, 0, s * 0.05, 0, TAU), IRON, { line: LW(s) * 0.6 });
      ctx.restore();
    },
  };
  Object.assign(T.PROPS, TOOLS);
  Object.assign(T.PROP_FOOT || (T.PROP_FOOT = {}), { anvil: 0.42, cannon: 0.5 });
})();
