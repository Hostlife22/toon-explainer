// props-lab.js — laboratory glassware drawn with the glass / liquid materials (props-paint.js): flask (Erlenmeyer),
// round-flask, beaker, test-tube, tube-rack, retort and a Bunsen burner. Centred at the origin, `size` = height.
// Fields: color (glass tint), liquid (hex), fill (0..1 or [{at, v}] timeline), bubbles (true | count), boil (true:
// bubbles + a tremble), fumes (true | particles preset: steam, smoke, gas, bubbles) rising from the mouth.
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL, TAU = Math.PI * 2;
  const LW = (s) => Math.max(3, s * 0.02);
  const fillOf = (o, lt, def) => T.clamp(T.num(o.fill ?? def, lt, def));
  const fumeCache = new Map();
  // Fumes from the mouth at (x, y): a cached particles emitter (closed form, so it is safe to call every frame).
  function fumes(ctx, o, s, lt, x, y) {
    if (!o.fumes) return;
    const preset = o.fumes === true ? 'steam' : o.fumes, k = s / 220, key = (o.id ?? 'lab') + preset + k.toFixed(2) + (o.fumeColor ?? '');
    let e = fumeCache.get(key);
    if (!e) { e = { preset, id: key, rate: 7, w: s * 0.08, prewarm: true, size: [26 * k, 46 * k], speed: 90 * k, color: o.fumeColor }; fumeCache.set(key, e); }
    ctx.save(); ctx.translate(x, y); T.drawParticles(ctx, e, lt); ctx.restore();
  }
  const liquid = (o, s, level, lt, extra = {}) => ({ level, color: o.liquid ?? '#5fd06a', bubbles: o.boil ? 10 : o.bubbles, seed: o.id ?? 'lab', ...extra });
  const tremble = (ctx, o, s, lt) => { if (o.boil) { const f = Math.floor(lt * 15); ctx.translate((T.h32(7, f, 1) - 0.5) * s * 0.012, (T.h32(7, f, 2) - 0.5) * s * 0.008); } };
  const lip = (ctx, s, x0, x1, y) => T.matGlass(ctx, (k) => T.rrect(k, x0, y - s * 0.025, x1 - x0, s * 0.05, s * 0.02), { tint: '#dff1f5', line: LW(s) * 0.8, alpha: 0.7 });

  const LAB = {
    flask(ctx, s, lt, o) {
      tremble(ctx, o, s, lt);
      const body = (k) => { k.moveTo(-s * 0.08, -s * 0.46); k.lineTo(-s * 0.08, -s * 0.16); k.lineTo(-s * 0.34, s * 0.38); k.quadraticCurveTo(-s * 0.37, s * 0.46, -s * 0.28, s * 0.46); k.lineTo(s * 0.28, s * 0.46); k.quadraticCurveTo(s * 0.37, s * 0.46, s * 0.34, s * 0.38); k.lineTo(s * 0.08, -s * 0.16); k.lineTo(s * 0.08, -s * 0.46); k.closePath(); };
      const f = fillOf(o, lt, 0.45);
      T.matGlass(ctx, body, { tint: o.color ?? '#dff1f5', line: LW(s), lt, liquid: f > 0.01 ? liquid(o, s, s * 0.46 - f * s * 0.6, lt) : null });
      lip(ctx, s, -s * 0.11, s * 0.11, -s * 0.46);
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = Math.max(1.5, s * 0.008);
      for (let i = 0; i < 4; i++) { const y = s * (0.3 - i * 0.1); ctx.beginPath(); ctx.moveTo(s * 0.06, y); ctx.lineTo(s * 0.14, y); ctx.stroke(); }
      fumes(ctx, o, s, lt, 0, -s * 0.48);
    },
    'round-flask'(ctx, s, lt, o) {
      tremble(ctx, o, s, lt);
      const r = s * 0.3, cy = s * 0.17, a = Math.asin((s * 0.075) / r);
      const body = (k) => { k.moveTo(-s * 0.075, -s * 0.47); k.lineTo(-s * 0.075, cy - r * Math.cos(a)); k.arc(0, cy, r, -Math.PI / 2 - a, -Math.PI / 2 + a, true); k.lineTo(s * 0.075, -s * 0.47); k.closePath(); };
      const f = fillOf(o, lt, 0.5);
      T.matGlass(ctx, body, { tint: o.color ?? '#dff1f5', line: LW(s), lt, liquid: f > 0.01 ? liquid(o, s, cy + r - f * r * 1.6, lt) : null });
      lip(ctx, s, -s * 0.1, s * 0.1, -s * 0.47);
      fumes(ctx, o, s, lt, 0, -s * 0.49);
    },
    beaker(ctx, s, lt, o) {
      tremble(ctx, o, s, lt);
      const w = s * 0.33, body = (k) => { k.moveTo(-w - s * 0.05, -s * 0.44); k.quadraticCurveTo(-w, -s * 0.44, -w, -s * 0.38); k.lineTo(-w, s * 0.42); k.quadraticCurveTo(-w, s * 0.46, -w + s * 0.04, s * 0.46); k.lineTo(w - s * 0.04, s * 0.46); k.quadraticCurveTo(w, s * 0.46, w, s * 0.42); k.lineTo(w, -s * 0.44); k.closePath(); };
      const f = fillOf(o, lt, 0.55);
      T.matGlass(ctx, body, { tint: o.color ?? '#dff1f5', line: LW(s), lt, liquid: f > 0.01 ? liquid(o, s, s * 0.46 - f * s * 0.82, lt) : null });
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = Math.max(1.5, s * 0.009); ctx.fillStyle = 'rgba(255,255,255,0.7)';
      for (let i = 0; i < 6; i++) { const y = s * (0.34 - i * 0.12), l = i % 2 ? s * 0.06 : s * 0.11; ctx.beginPath(); ctx.moveTo(-w * 0.15, y); ctx.lineTo(-w * 0.15 + l, y); ctx.stroke(); }
      fumes(ctx, o, s, lt, 0, -s * 0.46);
    },
    'test-tube'(ctx, s, lt, o) {
      tremble(ctx, o, s, lt);
      const w = s * 0.085, body = (k) => { k.moveTo(-w, -s * 0.46); k.lineTo(-w, s * 0.38); k.arc(0, s * 0.38, w, Math.PI, 0, true); k.lineTo(w, -s * 0.46); k.closePath(); };
      const f = fillOf(o, lt, 0.5);
      T.matGlass(ctx, body, { tint: o.color ?? '#dff1f5', line: LW(s) * 0.8, lt, liquid: f > 0.01 ? liquid(o, s, s * 0.46 - f * s * 0.84, lt) : null });
      lip(ctx, s, -w - s * 0.02, w + s * 0.02, -s * 0.46);
      fumes(ctx, o, s, lt, 0, -s * 0.48);
    },
    'tube-rack'(ctx, s, lt, o) {
      const cols = o.liquids ?? ['#5fd06a', '#e8603a', '#5fa8e8', '#e8c84a'], n = cols.length, span = s * 0.9;
      T.matWood(ctx, (k) => T.rrect(k, -span / 2 - s * 0.06, s * 0.3, span + s * 0.12, s * 0.12, s * 0.02), '#a8743a', { line: LW(s), grain: s / 900 });
      cols.forEach((c, i) => {
        const x = -span / 2 + ((i + 0.5) / n) * span;
        ctx.save(); ctx.translate(x, -s * 0.04); LAB['test-tube'](ctx, s * 0.78, lt + i * 0.37, { ...o, liquid: c, id: (o.id ?? 'rack') + i, fill: o.fill ?? 0.35 + ((i * 37) % 5) * 0.08, fumes: i === (o.fumesAt ?? -1) ? o.fumes ?? 'steam' : false }); ctx.restore();
      });
      T.matWood(ctx, (k) => T.rrect(k, -span / 2 - s * 0.06, -s * 0.06, span + s * 0.12, s * 0.08, s * 0.02), '#b8844a', { line: LW(s), grain: s / 900 });
      for (const sx of [-1, 1]) T.matWood(ctx, (k) => k.rect(sx * (span / 2 + s * 0.03) - s * 0.03, -s * 0.06, s * 0.06, s * 0.4), '#a8743a', { line: LW(s), rot: 90, grain: 0.3 });
    },
    retort(ctx, s, lt, o) {
      tremble(ctx, o, s, lt);
      const r = s * 0.26, cx = -s * 0.18, cy = s * 0.16;
      const body = (k) => { k.moveTo(cx + r * 0.55, cy - r * 0.84); k.quadraticCurveTo(s * 0.18, -s * 0.24, s * 0.5, s * 0.06); k.lineTo(s * 0.47, s * 0.1); k.quadraticCurveTo(s * 0.16, -s * 0.12, cx + r * 0.92, cy - r * 0.38); k.arc(cx, cy, r, -0.4, -1.0 + TAU, false); k.closePath(); };
      const f = fillOf(o, lt, 0.5);
      T.matGlass(ctx, body, { tint: o.color ?? '#dff1f5', line: LW(s), lt, liquid: f > 0.01 ? liquid(o, s, cy + r - f * r * 1.5, lt) : null });
      fumes(ctx, o, s, lt, s * 0.5, s * 0.08);
    },
    burner(ctx, s, lt, o) {
      const fl = Math.floor(lt * 15), j = (T.h32(11, fl, 1) - 0.5) * 0.08, hgt = s * (0.42 + j) * (o.flame ?? 1);
      if (o.flame !== 0) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createRadialGradient(0, -s * 0.22, 0, 0, -s * 0.22, s * 0.4); g.addColorStop(0, 'rgba(120,170,255,0.5)'); g.addColorStop(1, 'rgba(80,120,255,0)');
        ctx.fillStyle = g; ctx.fillRect(-s * 0.4, -s * 0.7, s * 0.8, s * 0.8);
        ctx.fillStyle = 'rgba(110,160,255,0.75)'; ctx.beginPath(); ctx.moveTo(-s * 0.06, -s * 0.06); ctx.quadraticCurveTo(-s * 0.07, -s * 0.06 - hgt * 0.6, 0, -s * 0.06 - hgt); ctx.quadraticCurveTo(s * 0.07, -s * 0.06 - hgt * 0.6, s * 0.06, -s * 0.06); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(200,230,255,0.9)'; ctx.beginPath(); ctx.moveTo(-s * 0.03, -s * 0.06); ctx.quadraticCurveTo(0, -s * 0.06 - hgt * 0.55, s * 0.03, -s * 0.06); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      T.matMetal(ctx, (k) => T.rrect(k, -s * 0.05, -s * 0.08, s * 0.1, s * 0.46, s * 0.02), '#a8adb4', { line: LW(s) });
      T.matMetal(ctx, (k) => T.rrect(k, -s * 0.08, s * 0.1, s * 0.16, s * 0.07, s * 0.02), '#8a8f96', { line: LW(s) * 0.8 });
      T.matMetal(ctx, (k) => { k.moveTo(-s * 0.26, s * 0.46); k.lineTo(-s * 0.2, s * 0.36); k.lineTo(s * 0.2, s * 0.36); k.lineTo(s * 0.26, s * 0.46); k.closePath(); }, '#3e4248', { line: LW(s), axis: 'y' });
      ctx.strokeStyle = P.ink; ctx.lineWidth = s * 0.05; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(s * 0.08, s * 0.28); ctx.quadraticCurveTo(s * 0.32, s * 0.3, s * 0.4, s * 0.46); ctx.stroke();
      ctx.strokeStyle = '#c84a2a'; ctx.lineWidth = s * 0.028; ctx.stroke();
    },
  };
  Object.assign(T.PROPS, LAB);
  Object.assign(T.PROP_FOOT || (T.PROP_FOOT = {}), { flask: 0.34, 'round-flask': 0.28, beaker: 0.36, 'test-tube': 0.1, 'tube-rack': 0.52, retort: 0.3, burner: 0.28 });
})();
