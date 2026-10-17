// props-house.js — fridge (opening door, lit shelves), rope (a coil to carry), pulley (a hanging rope-and-pulley rig
// that lifts a load) and unlit flames: `flame: false` or a [{at, v}] timeline on candle, oil-lamp and lantern (a lamp
// that goes out leaves a smoke wisp for 1.5 s). Centred at the origin, `size` = height. Fields: fridge color, open
// (0..1 or timeline), items (prop kinds on the shelves), light (false = dark inside); rope color; pulley lift (0..1 or
// timeline), load (prop kind, false = an empty hook), loadSize (fraction of size), color (rope), wood (beam).
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL, TAU = Math.PI * 2, D = T.DEG;
  const { O, fillR, ell, stick } = T.PROP3;
  const LW = (s) => Math.max(3, s * 0.02);
  const CHROME = '#c9ced4', ROPE = '#c9a46a';

  // ---------- unlit flames ----------
  const flameOf = (o, lt) => { const f = T.timed(o.flame ?? true, lt, 0); return { lit: f.cur !== false, out: f.cur === false && f.prev !== false && f.at > -1e8 ? lt - f.at : null }; };
  // Thin curling smoke from the wick (x, y) during the 1.5 s after the flame went out.
  function wisp(ctx, s, x, y, age) {
    if (age == null || age < 0 || age > 1.5) return;
    const a = (1 - age / 1.5) * 0.7, len = s * (0.15 + age * 0.35);
    ctx.save(); ctx.lineCap = 'round';
    for (const [w, c] of [[0.03, `rgba(170,165,160,${(a * 0.35).toFixed(3)})`], [0.012, `rgba(215,210,205,${a.toFixed(3)})`]]) {
      ctx.strokeStyle = c; ctx.lineWidth = s * w; ctx.beginPath();
      for (let i = 0; i <= 16; i++) { const q = i / 16, yy = y - q * len, xx = x + Math.sin(q * 7 - age * 5) * s * 0.035 * q; i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
      ctx.stroke();
    }
    ctx.restore();
  }
  function unlitCandle(ctx, s, o) { // the classic candle without its flame and glow; the wick is charred
    O(ctx, s, (k) => ell(k, 0, s * 0.42, s * 0.3, s * 0.07), '#c9a040', fillR('#a07c20', -s, s * 0.44, s * 2, s));
    O(ctx, s, (k) => { k.moveTo(-s * 0.11, -s * 0.22); k.lineTo(s * 0.11, -s * 0.22); k.lineTo(s * 0.11, s * 0.4); k.lineTo(-s * 0.11, s * 0.4); k.closePath(); }, o.color ?? '#efe6cf', fillR('#d6ccb2', s * 0.04, -s, s, s * 2));
    for (const [x, l] of [[-0.06, 0.12], [0.07, 0.2]]) O(ctx, s, (k) => T.rrect(k, s * x - s * 0.025, -s * 0.24, s * 0.05, s * l, s * 0.025), o.color ?? '#efe6cf');
    stick(ctx, s, [[0, -s * 0.22], [s * 0.008, -s * 0.275]], s * 0.012, '#1a1210');
  }
  const LIT = { candle: T.PROPS.candle, 'oil-lamp': T.PROPS['oil-lamp'], lantern: T.PROPS.lantern };
  for (const k of Object.keys(LIT)) if (!LIT[k]) throw new Error('props-house: missing prop ' + k);
  T.PROPS.candle = (ctx, s, lt, o) => {
    const f = flameOf(o, lt);
    if (f.lit) return LIT.candle(ctx, s, lt, o);
    unlitCandle(ctx, s, o); wisp(ctx, s, s * 0.008, -s * 0.28, f.out);
  };
  T.PROPS['oil-lamp'] = (ctx, s, lt, o) => { const f = flameOf(o, lt); LIT['oil-lamp'](ctx, s, lt, { ...o, flame: f.lit }); if (!f.lit) wisp(ctx, s, s * 0.46, -s * 0.07, f.out); };
  T.PROPS.lantern = (ctx, s, lt, o) => { const f = flameOf(o, lt); LIT.lantern(ctx, s, lt, { ...o, flame: f.lit }); if (!f.lit) wisp(ctx, s, 0, -s * 0.42, f.out); };

  // ---------- fridge: rounded retro cabinet, freezer door, main door that swings open ----------
  function fridge(ctx, s, lt, o) {
    const col = o.color ?? '#e9e3d3', w = s * 0.56, x0 = -w / 2, top = -s * 0.5, split = -s * 0.2, bot = s * 0.45;
    const open = T.clamp(T.num(o.open, lt, 0)), th = open * 115 * D, light = o.light !== false;
    for (const x of [-0.2, 0.2]) T.matMetal(ctx, (k) => T.rrect(k, s * x - s * 0.035, bot - s * 0.01, s * 0.07, s * 0.06, s * 0.015), '#4a4e54', { line: LW(s) * 0.6 });
    T.outlined(ctx, (k) => { k.moveTo(x0, bot); k.lineTo(x0, top + s * 0.1); k.quadraticCurveTo(x0, top, x0 + s * 0.1, top); k.lineTo(-x0 - s * 0.1, top); k.quadraticCurveTo(-x0, top, -x0, top + s * 0.1); k.lineTo(-x0, bot); k.closePath(); }, col, { line: LW(s) });
    // freezer door (stays shut) with its chrome handle and badge
    T.outlined(ctx, (k) => T.rrect(k, x0 + s * 0.02, top + s * 0.03, w - s * 0.04, split - top - s * 0.04, s * 0.06), T.shade(col, 0.04), { line: LW(s) * 0.6 });
    T.matMetal(ctx, (k) => T.rrect(k, x0 + s * 0.05, split - s * 0.08, s * 0.035, s * 0.06, s * 0.015), CHROME, { line: LW(s) * 0.6 });
    T.matMetal(ctx, (k) => T.rrect(k, -s * 0.06, top + s * 0.05, s * 0.12, s * 0.03, s * 0.012), CHROME, { line: LW(s) * 0.5 });
    const iy0 = split + s * 0.01, iy1 = bot - s * 0.02, ix0 = x0 + s * 0.02, ix1 = -x0 - s * 0.02;
    if (open > 0.001) { // the lit inside: liner, shelves and items, then a glow
      T.outlined(ctx, (k) => k.rect(ix0, iy0, ix1 - ix0, iy1 - iy0), light ? '#f6f2e2' : '#8f8c84', { line: LW(s) * 0.6, paint: false, shade: (k) => {
        const g = k.createLinearGradient(0, iy0, 0, iy1); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(40,30,20,0.22)'); k.fillStyle = g; k.fillRect(ix0, iy0, ix1 - ix0, iy1 - iy0);
      } });
      const items = [].concat(o.items ?? ['bottle', 'cheese', 'apple', 'fish']), shelves = [0.34, 0.62];
      shelves.forEach((f, si) => {
        const y = iy0 + (iy1 - iy0) * f;
        items.filter((_, i) => i % 2 === si).forEach((kind, j, row) => {
          if (!T.PROPS[kind]) throw new Error('fridge: unknown item prop ' + kind);
          const x = T.lerp(ix0, ix1, (j + 0.5) / row.length), sz = s * 0.13;
          ctx.save(); ctx.translate(x, y - (T.PROP_GROUND.has(kind) ? 0 : sz * 0.48)); T.drawProp(ctx, kind, sz, lt, { id: (o.id ?? 'fridge') + ':' + kind }); ctx.restore();
        });
        T.matGlass(ctx, (k) => k.rect(ix0, y - s * 0.006, ix1 - ix0, s * 0.012), { tint: '#e8f2f4', line: LW(s) * 0.4, alpha: 0.8 });
      });
      if (light) { const g = ctx.createRadialGradient(0, iy0 + s * 0.06, 0, 0, iy0 + s * 0.06, s * 0.5); g.addColorStop(0, 'rgba(255,250,215,0.45)'); g.addColorStop(1, 'rgba(255,250,215,0)'); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(ix0, iy0, ix1 - ix0, iy1 - iy0); ctx.restore(); }
    }
    // main door hinged on the right edge: front face while it turns toward us, then its liner with door bins
    const hx = ix1 + s * 0.01, dw = (hx - x0 - s * 0.01) * Math.cos(th), grow = 1 + 0.12 * Math.sin(th), fx = hx - dw, cy = (iy0 + iy1) / 2, hh = (iy1 - iy0) / 2;
    const door = (k) => { k.moveTo(hx, iy0); k.lineTo(fx, cy - hh * grow); k.lineTo(fx, cy + hh * grow); k.lineTo(hx, iy1); k.closePath(); };
    if (open <= 0.001) T.outlined(ctx, (k) => T.rrect(k, ix0, iy0, ix1 - ix0, iy1 - iy0, s * 0.03), T.shade(col, 0.04), { line: LW(s) * 0.6 });
    else if (dw > 0) T.outlined(ctx, door, T.shade(col, 0.04), { line: LW(s) * 0.8 });
    else T.outlined(ctx, door, '#ece8da', { line: LW(s) * 0.8, shade: (k) => {
      k.strokeStyle = 'rgba(42,28,21,0.4)'; k.lineWidth = Math.max(1.5, s * 0.008);
      for (const f of [0.3, 0.55, 0.8]) { k.beginPath(); k.moveTo(hx, T.lerp(iy0, iy1, f)); k.lineTo(fx, cy + (T.lerp(iy0, iy1, f) - cy) * grow); k.stroke(); }
    } });
    if (dw > 0) { const hxp = T.lerp(hx, fx, 0.88), k2 = grow * 0.6 + 0.4; T.matMetal(ctx, (k) => T.rrect(k, hxp - s * 0.018, cy - hh * 0.55 * k2, s * 0.036, hh * 0.5 * k2, s * 0.015), CHROME, { line: LW(s) * 0.7 }); }
  }

  // ---------- rope: a carried coil with a loose end ----------
  function ropeStroke(ctx, s, path, col, w) {
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = P.ink; ctx.lineWidth = w + LW(s) * 1.6; path(ctx); ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = w; path(ctx); ctx.stroke();
    ctx.strokeStyle = T.shade(col, -0.3); ctx.lineWidth = w * 0.22; ctx.setLineDash([w * 0.5, w * 0.7]); path(ctx); ctx.stroke(); // twist of the strands
    ctx.setLineDash([]); ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = w * 0.2; ctx.translate(-w * 0.18, -w * 0.18); path(ctx); ctx.stroke();
    ctx.restore();
  }
  function rope(ctx, s, lt, o) {
    const col = o.color ?? ROPE, w = s * 0.055;
    ropeStroke(ctx, s, (k) => { k.beginPath(); k.moveTo(s * 0.18, s * 0.2); k.bezierCurveTo(s * 0.32, s * 0.3, s * 0.2, s * 0.42, s * 0.34, s * 0.48); }, col, w);
    for (let i = 0; i < 4; i++) { const dy = (i - 1.5) * s * 0.035, dx = (i - 1.5) * s * 0.012; ropeStroke(ctx, s, (k) => { k.beginPath(); k.ellipse(dx, dy, s * 0.3, s * 0.36, 0.12, 0, TAU); }, i % 2 ? col : T.shade(col, -0.06), w); }
    T.outlined(ctx, (k) => T.rrect(k, -s * 0.06, -s * 0.44, s * 0.12, s * 0.1, s * 0.03), T.shade(col, -0.15), { line: LW(s) * 0.7 }); // binding wrap
  }

  // ---------- pulley: beam, hanging block with a wheel, rope over it lifting a load ----------
  function pulley(ctx, s, lt, o) {
    const col = o.color ?? ROPE, lift = T.clamp(T.num(o.lift, lt, 0)), r = s * 0.085, wy = -s * 0.34, travel = s * 0.5, w = s * 0.022;
    const loadTop = s * 0.18 - lift * travel, freeEnd = s * 0.02 + lift * travel;
    T.matWood(ctx, (k) => k.rect(-s * 0.28, -s * 0.5, s * 0.56, s * 0.06), o.wood ?? '#8a5a32', { line: LW(s), grain: 0.3 });
    T.matMetal(ctx, (k) => { k.moveTo(-s * 0.03, -s * 0.44); k.lineTo(s * 0.03, -s * 0.44); k.lineTo(s * 0.02, wy - r - s * 0.02); k.lineTo(-s * 0.02, wy - r - s * 0.02); k.closePath(); }, '#5a5f66', { line: LW(s) * 0.7 });
    // side plates of the block behind the wheel
    T.matMetal(ctx, (k) => T.rrect(k, -r * 1.25, wy - r * 1.3, r * 2.5, r * 2.3, r * 0.6), '#4a4e54', { line: LW(s) * 0.8 });
    ctx.save(); ctx.translate(0, wy); ctx.rotate(-(lift * travel) / r); // the wheel turns as the rope runs
    T.matMetal(ctx, (k) => k.arc(0, 0, r * 1.02, 0, TAU), '#8a8f96', { line: LW(s) * 0.7 });
    T.outlined(ctx, (k) => k.arc(0, 0, r * 0.62, 0, TAU), '#6a6f76', { line: LW(s) * 0.5 });
    ctx.strokeStyle = P.ink; ctx.lineWidth = Math.max(2, s * 0.008);
    for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 0.15, Math.sin(a) * r * 0.15); ctx.lineTo(Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.6); ctx.stroke(); }
    ctx.restore();
    ropeStroke(ctx, s, (k) => { k.beginPath(); k.moveTo(-r, loadTop); k.lineTo(-r, wy); k.arc(0, wy, r, Math.PI, 0); k.lineTo(r, freeEnd); }, col, w);
    T.matMetal(ctx, (k) => k.arc(0, wy, r * 0.18, 0, TAU), CHROME, { line: LW(s) * 0.5 });
    T.outlined(ctx, (k) => ell(k, r, freeEnd + s * 0.02, s * 0.022, s * 0.03), T.shade(col, -0.2), { line: LW(s) * 0.6 }); // knot at the free end
    // hook and load
    ctx.strokeStyle = P.ink; ctx.lineWidth = s * 0.02; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-r, loadTop); ctx.lineTo(-r, loadTop + s * 0.025); ctx.arc(-r + s * 0.02, loadTop + s * 0.04, s * 0.02, Math.PI, Math.PI * 0.1, true); ctx.stroke();
    ctx.strokeStyle = '#8a8f96'; ctx.lineWidth = s * 0.009; ctx.stroke();
    if (o.load === false) return;
    const kind = o.load ?? 'crate', ls = s * (o.loadSize ?? 0.24);
    if (!T.PROPS[kind]) throw new Error('pulley: unknown load prop ' + kind);
    for (const d of [-1, 1]) { ctx.strokeStyle = P.ink; ctx.lineWidth = Math.max(2, s * 0.006); ctx.beginPath(); ctx.moveTo(-r, loadTop + s * 0.05); ctx.lineTo(-r + d * ls * 0.38, loadTop + s * 0.05 + ls * 0.22); ctx.stroke(); } // sling
    ctx.save(); ctx.translate(-r, loadTop + s * 0.05 + ls * 0.22 + (T.PROP_GROUND.has(kind) ? ls : ls * 0.5)); T.drawProp(ctx, kind, ls, lt, { id: (o.id ?? 'pulley') + ':load' }); ctx.restore();
  }

  Object.assign(T.PROPS, { fridge, rope, pulley });
  Object.assign(T.PROP_FOOT || (T.PROP_FOOT = {}), { fridge: 0.32, rope: 0.36 });
  Object.assign(T.HOLD_SIZE || (T.HOLD_SIZE = {}), { rope: 230 });
})();
