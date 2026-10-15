// fill-fx.js — pile-fill and flood effects that fill the frame from the bottom. Both draw in full-frame logical
// coordinates (they ignore the layer position and the camera) across the visible span, so vertical films fill their
// strip. Times are layer-local: the pour or the rise starts at the layer's `at`.
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL, W = T.W, H = T.H, FX = T.FX;
  const twos = (lt) => Math.floor(lt * 15) / 15;
  // Full-frame logical transform regardless of the layer transform (canvas may be a modifier scratch copy).
  const full = (ctx) => { const s = ctx.canvas.width / W; ctx.save(); ctx.setTransform(s, 0, 0, s, 0, 0); };
  const FALL = 0.3, BOUNCE = 0.2; // seconds: drop from above the frame, then a small squash-bounce on landing
  const BODY = { coin: '#b8860b', moneybag: '#8a6234', bread: '#a8692e', skull: '#9a9184' };

  // Slots of a hex-packed pile filling [lo, lo + vw] from the bottom edge up to `level`, bottom row first,
  // seeded order within each row. Each slot: {x, y, rot, t (landing time), row}.
  function pileSlots(L, lo, vw, seed) {
    const level = T.clamp(L.level ?? 0.85, 0.05, 1.2), dur = Math.max(0.05, L.dur ?? 1.2), top = H * (1 - level);
    let s = L.size ?? 110;
    const fit = (sz) => { const cols = Math.ceil(vw / (sz * 0.82)) + 1, rows = Math.max(1, Math.ceil((H - top) / (sz * 0.7))); return { cols, rows }; };
    let { cols, rows } = fit(s);
    if (L.count != null && L.count > 0 && L.count < cols * rows) { s *= Math.sqrt((cols * rows) / L.count); ({ cols, rows } = fit(s)); }
    const r = T.rng(T.hash(seed)), slots = [];
    for (let row = 0; row < rows; row++) {
      const order = Array.from({ length: cols }, (_, i) => ({ i, k: r() }));
      order.sort((a, b) => a.k - b.k);
      order.forEach(({ i }, n) => {
        const x = lo + (i + (row % 2 ? 0.5 : 0) - 0.25) * (vw / (cols - 1)) + (r() - 0.5) * s * 0.18;
        const y = H - s * 0.32 - row * s * 0.7 + (r() - 0.5) * s * 0.12;
        const t = dur * ((row + n / cols) / rows) * (0.92 + r() * 0.08);
        slots.push({ x, y, rot: (r() - 0.5) * 1.1, spin: (r() - 0.5) * 8, t, row, drop: H * (0.15 + r() * 0.25) });
      });
    }
    return { slots, size: s, rows, top };
  }

  // pile: {prop 'coin', count (auto: enough `size` objects to reach level), dur 1.2, size 110, level 0.85, seed,
  // body (pile fill colour)} — objects rain from above the frame and settle row by row with a small bounce.
  FX.pile = (ctx, L, lt, env) => {
    const kind = L.prop ?? 'coin';
    if (!T.PROPS[kind]) throw new Error(`fx pile: unknown prop "${kind}"`);
    const [lo, vw] = T.visibleSpan(env), seed = 'pile:' + (L.seed ?? L.id ?? 'pile'); // slots follow the visible span; the seed must not
    const { slots, size, rows } = pileSlots(L, lo, vw, seed), ground = T.PROP_GROUND && T.PROP_GROUND.has(kind);
    full(ctx);
    // Pile body: covers the gaps between settled objects up to half a row below the settled surface.
    const settled = slots.filter((o) => lt >= o.t + FALL).reduce((m, o) => Math.max(m, o.row + 1), 0) - 1;
    if (settled >= 0) {
      const yTop = H - size * 0.32 - Math.min(settled, rows - 1) * size * 0.7 + size * 0.15;
      ctx.fillStyle = L.body ?? BODY[kind] ?? '#5a4030'; ctx.fillRect(lo - 20, yTop, vw + 40, H - yTop + 20);
    }
    for (const o of slots) {
      const d = lt - o.t;
      if (d < 0) continue;
      let y = o.y, rot = o.rot, sx = 1, sy = 1;
      if (d < FALL) { const q = T.ease.in(d / FALL); y = T.lerp(-size - o.drop, o.y, q); rot = o.rot + o.spin * (1 - q); }
      else if (d < FALL + BOUNCE) { const u = (d - FALL) / BOUNCE; y = o.y - Math.sin(u * Math.PI) * size * 0.12; const sq = Math.sin(u * Math.PI * 2) * 0.1 * (1 - u); sx = 1 + sq; sy = 1 - sq; }
      ctx.save(); ctx.translate(o.x, y); ctx.rotate(rot); ctx.scale(sx, sy);
      if (ground) ctx.translate(0, size / 2);
      T.drawProp(ctx, kind, size, twos(lt), { id: seed + o.x });
      ctx.restore();
    }
    ctx.restore();
  };

  // flood: {level 0.85, dur 1.5, color '#e8b440', foam '#fff6dc', bubbles true, wave 18} — liquid rises from the bottom
  // edge (ease.out) with a scalloped foam crest that rolls on twos and seeded bubbles rising inside.
  FX.flood = (ctx, L, lt, env) => {
    const [lo, vw] = T.visibleSpan(env), id = String(L.id ?? 'flood'), t2 = twos(lt);
    const rise = T.ease.out(T.prog(lt, 0, L.dur ?? 1.5)), surf = H - (H * T.clamp(L.level ?? 0.85, 0, 1.2) + 40) * rise;
    if (rise <= 0) return;
    const col = L.color ?? '#e8b440', foam = L.foam ?? '#fff6dc', amp = L.wave ?? 18, x0 = lo - 60, x1 = lo + vw + 60;
    const yAt = (x, ph = 0) => surf + Math.sin(x / 140 + t2 * 5 + ph) * amp + Math.sin(x / 61 - t2 * 3) * amp * 0.4;
    const body = (k, ph, dy) => { k.moveTo(x0, H + 40); for (let x = x0; x <= x1; x += 24) k.lineTo(x, yAt(x, ph) + dy); k.lineTo(x1, H + 40); k.closePath(); };
    full(ctx);
    const deep = Math.max(70 + amp, (H - surf) * 0.55); // one shadow tone: the lower part of the liquid
    T.outlined(ctx, (k) => body(k, 0, 0), col, { line: 7, shade: (k) => { k.fillStyle = T.shade(col, -0.16); k.beginPath(); body(k, 1.7, deep); k.fill(); } });
    if (L.bubbles !== false) {
      const r = T.rng(T.hash(id + ':bub')), depth = H - surf;
      for (let i = 0; i < (L.count ?? 26); i++) {
        const bx = lo + r() * vw, sp = 120 + r() * 160, ph = r(), rr = 6 + r() * 12, travel = (ph * depth + t2 * sp) % Math.max(1, depth);
        const by = H - travel;
        if (by < yAt(bx) + rr * 2) continue;
        ctx.strokeStyle = T.shade(col, 0.45); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(bx + Math.sin(t2 * 6 + i) * 5, by, rr, 0, Math.PI * 2); ctx.stroke();
      }
    }
    if (foam) { // foam crest: overlapping bumps riding the surface, rolling on twos
      const step = 70, off = (t2 * 60) % step, r = T.rng(T.hash(id + ':foam'));
      const bumps = [];
      for (let x = x0 - step + off, i = 0; x <= x1 + step; x += step, i++) bumps.push([x, yAt(x) - 4, 38 + r() * 18]);
      const lip = (x) => yAt(x, 0.6) + 48; // wavy bottom edge of the foam band
      const band = (k, dy) => { k.moveTo(x0, yAt(x0) - 10); k.lineTo(x1, yAt(x1) - 10); for (let x = x1; x >= x0; x -= 24) k.lineTo(x, lip(x) + dy); k.closePath(); };
      ctx.fillStyle = foam; ctx.beginPath(); band(ctx, 0); for (const [bx, by, br] of bumps) { ctx.moveTo(bx + br, by); ctx.arc(bx, by, br, 0, Math.PI * 2); } ctx.fill();
      ctx.fillStyle = T.shade(foam, -0.1); ctx.beginPath(); for (let x = x0; x <= x1; x += 24) ctx.lineTo(x, lip(x) - 12); for (let x = x1; x >= x0; x -= 24) ctx.lineTo(x, lip(x)); ctx.fill();
      ctx.strokeStyle = P.ink; ctx.lineWidth = 6; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.beginPath(); for (const [bx, by, br] of bumps) { ctx.moveTo(bx + Math.cos(Math.PI * 1.08) * br, by + Math.sin(Math.PI * 1.08) * br); ctx.arc(bx, by, br, Math.PI * 1.08, Math.PI * 1.92); } ctx.stroke();
      ctx.beginPath(); for (let x = x0; x <= x1; x += 24) ctx.lineTo(x, lip(x)); ctx.stroke();
    }
    ctx.restore();
  };
})();
