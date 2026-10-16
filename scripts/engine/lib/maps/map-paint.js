// map-paint.js — the painted map style (`style: "painted"`): mottled sea with brush texture, concentric coast ripples,
// land on a deep inked drop side with a bevel, highland / desert tint, paper grain, mountain glyphs and hill hatching,
// painted region slabs, plus the `compass` and `signs` overlays. Self-contained; geo-base.js calls these for geo maps
// and the base hook below paints blob `land` the same way. Pattern tiles are seeded and cached by their inputs only.
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL, TAU = Math.PI * 2;
  if (!T.MAP_BASE_HOOKS || !T.MAP_OVERLAYS) throw new Error('map-paint.js needs map.js and map-overlays.js loaded first');
  const tiles = {};
  const rgba = (hex, a) => { const h = T.hex6(hex).slice(1); return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`; };

  // ---------- seamless pattern tiles ----------
  function tile(key, size, paint) {
    if (tiles[key]) return tiles[key];
    const c = document.createElement('canvas'); c.width = c.height = size;
    const k = c.getContext('2d');
    for (const dx of [-size, 0, size]) for (const dy of [-size, 0, size]) { k.save(); k.translate(dx, dy); paint(k, T.rng(T.hash(key))); k.restore(); }
    tiles[key] = c; return c;
  }
  const pattern = (ctx, c, scale = 1) => { const p = ctx.createPattern(c, 'repeat'); if (scale !== 1 && p.setTransform) p.setTransform(new DOMMatrix().scale(scale)); return p; };
  // soft light/dark blotches and short brush ticks in the sea colour family
  const seaTile = (sea) => tile('sea:' + sea, 320, (k, r) => {
    for (let i = 0; i < 26; i++) {
      const x = r() * 320, y = r() * 320, rad = 30 + r() * 70, light = r() < 0.5, g = k.createRadialGradient(x, y, 0, x, y, rad);
      g.addColorStop(0, rgba(light ? T.shade(sea, 0.35) : T.shade(sea, -0.3), 0.22)); g.addColorStop(1, rgba(sea, 0));
      k.fillStyle = g; k.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    k.lineCap = 'round';
    for (let i = 0; i < 34; i++) {
      const x = r() * 320, y = r() * 320, l = 8 + r() * 16; k.strokeStyle = rgba(T.shade(sea, 0.45), 0.18 + r() * 0.12); k.lineWidth = 2;
      k.beginPath(); k.moveTo(x - l, y); k.quadraticCurveTo(x, y - 4, x + l, y); k.stroke();
    }
  });
  // paper grain: fibres and specks, neutral so it works on any colour (drawn with low alpha)
  const grainTile = () => tile('grain', 192, (k, r) => {
    for (let i = 0; i < 420; i++) { const dark = r() < 0.55; k.fillStyle = dark ? 'rgba(60,35,10,0.5)' : 'rgba(255,250,230,0.6)'; k.fillRect(r() * 192, r() * 192, 1 + r() * 1.6, 1 + r() * 1.6); }
    k.lineWidth = 1;
    for (let i = 0; i < 26; i++) { const x = r() * 192, y = r() * 192, a = r() * TAU, l = 6 + r() * 14; k.strokeStyle = 'rgba(80,50,20,0.35)';
      k.beginPath(); k.moveTo(x, y); k.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); k.stroke(); }
  });

  // ---------- base pieces ----------
  // area: fn(k) adding the sea area to a path (rect or disc)
  function sea(ctx, area, col) {
    ctx.fillStyle = col; ctx.beginPath(); area(ctx); ctx.fill();
    ctx.save(); ctx.beginPath(); area(ctx); ctx.clip(); ctx.fillStyle = pattern(ctx, seaTile(col), 1.4); ctx.beginPath(); area(ctx); ctx.fill(); ctx.restore();
  }
  // concentric ripple lines hugging the coast (land drawn afterwards covers their inner half), then a pale halo
  function ripples(ctx, land, seaCol, coastCol, n = 3, gap = 15, halo = 22) {
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    for (let i = n; i >= 1; i--) {
      const w = halo + i * gap * 2;
      ctx.strokeStyle = rgba(T.shade(seaCol, 0.42), 0.75 - i * 0.14); ctx.lineWidth = w; ctx.stroke(land);
      ctx.strokeStyle = seaCol; ctx.lineWidth = w - 5; ctx.stroke(land);
    }
    ctx.strokeStyle = rgba(coastCol, 0.9); ctx.lineWidth = halo; ctx.stroke(land);
    ctx.restore();
  }
  // land slab: inked drop side, top fill, highlight / shade bevel inside the edge, paper grain
  // opts: tint(ctx) paints relief inside the land, edge = the path to bevel (coastline only, so borders stay flat)
  function landSlab(ctx, land, col, ink, depth, opts = {}) {
    ctx.save(); ctx.translate(0, depth); ctx.fillStyle = T.shade(col, -0.48); ctx.fill(land);
    ctx.lineJoin = 'round'; ctx.strokeStyle = ink; ctx.lineWidth = 3.5; ctx.stroke(land); ctx.restore();
    ctx.fillStyle = col; ctx.fill(land);
    ctx.save(); ctx.clip(land);
    if (opts.tint) opts.tint(ctx);
    bevel(ctx, opts.edge ?? land, col, opts.bevel ?? 5);
    ctx.globalAlpha *= 0.22; ctx.fillStyle = pattern(ctx, grainTile(), 1.5); ctx.fill(land);
    ctx.restore();
  }
  // inner light along the top/left edges and inner shade along the bottom/right (path drawn shifted, clipped inside)
  function bevel(ctx, path, col, d) {
    ctx.save(); ctx.lineJoin = 'round';
    ctx.translate(d * 0.6, d); ctx.strokeStyle = rgba(T.shade(col, 0.45), 0.85); ctx.lineWidth = d * 1.6; ctx.stroke(path);
    ctx.translate(-d * 1.2, -d * 2); ctx.strokeStyle = rgba(T.shade(col, -0.35), 0.7); ctx.lineWidth = d * 1.6; ctx.stroke(path);
    ctx.restore();
  }
  // soft tint stroke: wide translucent passes stand in for a blur (cheap and deterministic)
  function softStroke(ctx, pts, col, w, a = 0.2) {
    if (pts.length < 2) return; ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = col;
    for (const f of [1.7, 1.25, 0.85, 0.5]) { ctx.globalAlpha = a; ctx.lineWidth = w * f; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (const q of pts.slice(1)) ctx.lineTo(q[0], q[1]); ctx.stroke(); }
    ctx.restore();
  }
  function softFill(ctx, ring, col, edge, a = 0.5) {
    if (ring.length < 3) return; ctx.save(); ctx.lineJoin = 'round'; ctx.fillStyle = col; ctx.strokeStyle = col;
    const path = () => { ctx.beginPath(); T.smoothPath(ctx, ring); };
    for (const f of [1, 0.6, 0.3]) { ctx.globalAlpha = a * 0.34; ctx.lineWidth = edge * f; path(); ctx.fill(); ctx.stroke(); }
    ctx.restore();
  }

  // ---------- mountains: peak glyphs along a spine, hill humps on both flanks ----------
  function peak(ctx, x, y, s, snow, r) {
    const lean = (r() - 0.5) * s * 0.25, ax = x + lean, ay = y - s, bw = s * (0.55 + r() * 0.15);
    const body = (k) => { k.moveTo(x - bw, y); k.lineTo(ax - s * 0.08, ay + s * 0.08); k.quadraticCurveTo(ax, ay - s * 0.04, ax + s * 0.08, ay + s * 0.08); k.lineTo(x + bw, y); k.closePath(); };
    T.outlined(ctx, body, '#c9a46a', { line: 0 });
    ctx.save(); ctx.beginPath(); body(ctx); ctx.clip();
    ctx.fillStyle = '#8c6a40'; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(x + bw + 2, y + 2); ctx.lineTo(x + s * 0.05, y + 2); ctx.closePath(); ctx.fill();
    if (snow) { ctx.fillStyle = '#fbf7ee'; ctx.beginPath(); ctx.moveTo(ax - s * 0.3, ay + s * 0.36); ctx.lineTo(ax - s * 0.12, ay + s * 0.3); ctx.lineTo(ax, ay + s * 0.4); ctx.lineTo(ax + s * 0.14, ay + s * 0.28); ctx.lineTo(ax + s * 0.3, ay + s * 0.36); ctx.lineTo(ax, ay - 2); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    ctx.lineJoin = 'round'; ctx.strokeStyle = '#4a2e16'; ctx.lineWidth = Math.max(2, s * 0.07); ctx.beginPath(); body(ctx); ctx.stroke();
  }
  function hill(ctx, x, y, s) {
    ctx.strokeStyle = 'rgba(74,46,22,0.75)'; ctx.lineWidth = Math.max(1.5, s * 0.09); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - s * 0.6, y); ctx.quadraticCurveTo(x, y - s * 0.7, x + s * 0.6, y); ctx.stroke();
    ctx.lineWidth *= 0.7; ctx.beginPath(); ctx.moveTo(x + s * 0.1, y - s * 0.2); ctx.lineTo(x + s * 0.3, y - s * 0.02); ctx.stroke();
  }
  // spines: [{name, pts:[[x, y], ...] in px (null where hidden), snow, size}] -> glyphs inside `bounds` ({x0, y0, x1, y1}).
  // Each sample has its own seed (spine, run, segment, index) and segments outside the bounds are skipped without
  // sampling, so the work follows what is on screen and a glyph never moves when the view grows.
  function peakGlyphs(spines, size = 34, bounds = null) {
    const glyphs = [];
    for (const S of spines) {
      const s0 = S.size ?? size;
      if (!(s0 > 0)) throw new Error(`map mountains: size must be above 0 (got ${s0})`);
      runs(S.pts).forEach((run, ri) => {
        const step = s0 * 0.72, pad = s0 * 2; let carry = 0;
        for (let i = 1; i < run.length; i++) {
          const [ax, ay] = run[i - 1], [bx, by] = run[i], l = Math.hypot(bx - ax, by - ay), nx = -(by - ay) / (l || 1), ny = (bx - ax) / (l || 1);
          const out = bounds && (Math.max(ax, bx) < bounds.x0 - pad || Math.min(ax, bx) > bounds.x1 + pad || Math.max(ay, by) < bounds.y0 - pad || Math.min(ay, by) > bounds.y1 + pad);
          for (let d = carry, j = 0; !out && d < l; d += step, j++) {
            const r = T.rng(T.hash(`peaks:${S.name}:${ri}:${i}:${j}`));
            const t = d / l, x = T.lerp(ax, bx, t), y = T.lerp(ay, by, t), s = s0 * (0.75 + r() * 0.55), o = (r() - 0.5) * s0 * 0.7;
            glyphs.push({ k: 'peak', x: x + nx * o, y: y + ny * o, s, snow: S.snow && s > s0 * 0.9, seed: r() });
            if (r() < 0.6) { const s2 = s * (0.6 + r() * 0.2), o2 = o + (r() < 0.5 ? -1 : 1) * s0 * 0.45; glyphs.push({ k: 'peak', x: x + nx * o2 + s0 * 0.3, y: y + ny * o2 - s0 * 0.12, s: s2, snow: S.snow && s2 > s0 * 0.9, seed: r() }); }
            for (const side of [-1, 1]) if (r() < 0.45) glyphs.push({ k: 'hill', x: x + nx * side * s0 * (1 + r() * 0.5), y: y + ny * side * s0 * (1 + r() * 0.5) + s0 * 0.3, s: s0 * (0.35 + r() * 0.2) });
          }
          carry = ((carry - l) % step + step) % step;
        }
      });
    }
    return glyphs.sort((a, b) => a.y - b.y || a.x - b.x);
  }
  function drawGlyphs(ctx, glyphs) { for (const G of glyphs) { if (G.k === 'peak') peak(ctx, G.x, G.y, G.s, G.snow, T.rng(T.hash('pk' + G.seed))); else hill(ctx, G.x, G.y, G.s); } }
  const mountains = (ctx, spines, size, bounds) => drawGlyphs(ctx, peakGlyphs(spines, size, bounds));
  // split a polyline at null (hidden) points
  function runs(pts) { const out = []; let cur = []; for (const q of pts) { if (q) cur.push(q); else { if (cur.length > 1) out.push(cur); cur = []; } } if (cur.length > 1) out.push(cur); return out; }

  // ---------- painted region slab (called by map.js drawRegion for style "painted") ----------
  // path: fn(ctx) adding the region outline (and its holes) to the current path
  function regionSlab(ctx, path, fill, line, ink, st, cx, cy, rad) {
    const depth = st.extrude;
    ctx.save(); ctx.translate(0, depth); T.outlined(ctx, path, T.shade(fill, -0.45), { line: line * 0.8, ink }); ctx.restore();
    T.outlined(ctx, path, fill, {
      line, ink,
      shade: (k) => {
        const g = k.createLinearGradient(0, cy - rad, 0, cy + rad); g.addColorStop(0, 'rgba(255,255,255,0.16)'); g.addColorStop(0.55, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,0.12)');
        k.fillStyle = g; k.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
        const p2 = new Path2D(); path(p2); bevel(k, p2, fill, 4);
        k.save(); k.globalAlpha *= 0.16; k.fillStyle = pattern(k, grainTile(), 1.5); k.fillRect(cx - rad, cy - rad, rad * 2, rad * 2); k.restore();
      },
    });
  }

  T.MAP_PAINT = { sea, ripples, landSlab, bevel, softStroke, softFill, mountains, peakGlyphs, drawGlyphs, runs, regionSlab, grainTile, seaTile, pattern, rgba };

  // ---------- painted blob land (maps without `geo`) ----------
  T.MAP_BASE_HOOKS.push((ctx, L, g, lt) => {
    if (L.__geo || !g.st.paint) return false;
    const { mw, mh, st, X, Y } = g, seaCol = L.sea ?? st.sea, landCol = L.landColor ?? st.land, land = new Path2D();
    (L.land || []).forEach(([cx, cy, rx, ry], i) => T.smoothPath(land, T.blobPts(X(cx), Y(cy), rx * mw, ry * mh, g.env.seed + 'land' + i, 22, 0.22)));
    sea(ctx, (k) => k.rect(-mw / 2, -mh / 2, mw, mh), seaCol);
    ripples(ctx, land, seaCol, L.coast ?? st.coast);
    landSlab(ctx, land, landCol, st.landInk, st.extrude);
    ctx.save(); ctx.lineJoin = 'round'; ctx.strokeStyle = st.landInk; ctx.lineWidth = 5; ctx.stroke(land); ctx.restore();
    return true;
  });

  // ---------- overlays: compass rose and wooden sign posts ----------
  const list = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
  T.MAP_OVERLAYS.compass = (ctx, C, g, lt) => {
    const o = C === true ? {} : C, q = T.ease.outBack(T.prog(lt, o.at ?? 0, 0.3));
    if (q <= 0) return;
    const s = o.size ?? 110; ctx.save(); ctx.translate(g.X(o.x ?? 0.9), g.Y(o.y ?? 0.8)); ctx.scale(q, q); ctx.rotate((o.rot ?? 0) * T.DEG);
    T.outlined(ctx, (k) => k.arc(0, 0, s * 0.62, 0, TAU), '#efe0b8', { line: 5, ink: P.ink });
    ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, s * 0.5, 0, TAU); ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU - Math.PI / 2, long = i % 2 === 0, l = s * (long ? 0.95 : 0.55), w = s * (long ? 0.16 : 0.11);
      for (const side of [-1, 1]) T.outlined(ctx, (k) => { k.moveTo(0, 0); k.lineTo(Math.cos(a) * l, Math.sin(a) * l); k.lineTo(Math.cos(a + side * Math.PI / 2) * w, Math.sin(a + side * Math.PI / 2) * w); k.closePath(); },
        side < 0 ? (i === 0 ? '#c8323a' : '#f6efdc') : (i === 0 ? '#8f1f27' : '#6a5030'), { line: 3, ink: P.ink });
    }
    T.toonText(ctx, 'N', 0, -s * 1.12, { size: s * 0.34, fill: '#fff' });
    ctx.restore();
  };
  T.MAP_OVERLAYS.signs = (ctx, arr, g, lt) => {
    for (const S of list(arr)) {
      const q = T.ease.outBack(T.prog(lt, S.at ?? 0, 0.3)); if (q <= 0 || (S.out != null && lt > S.out)) continue;
      const [x, y, k] = g.project(S.x ?? 0.5, S.y ?? 0.5), s = (S.size ?? 160) * k, dir = S.dir === 'left' ? -1 : 1;
      ctx.save(); ctx.translate(x, y); ctx.scale(q, q);
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(0, 0, s * 0.22, s * 0.06, 0, 0, TAU); ctx.fill();
      T.outlined(ctx, (c) => c.rect(-s * 0.04, -s, s * 0.08, s), '#7a5230', { line: 4, ink: P.ink });
      const text = String(S.text ?? ''), size = S.textSize ?? s * 0.2, tw = Math.max(s * 0.6, T.measure(ctx, text, size) + s * 0.2), by = -s * 0.86;
      T.outlined(ctx, (c) => { c.moveTo(-dir * s * 0.1, by); c.lineTo(dir * (tw - s * 0.08), by); c.lineTo(dir * tw, by + s * 0.13); c.lineTo(dir * (tw - s * 0.08), by + s * 0.26); c.lineTo(-dir * s * 0.1, by + s * 0.26); c.closePath(); },
        S.color ?? '#b07a44', { line: 4, ink: P.ink, shade: (c) => { c.fillStyle = 'rgba(0,0,0,0.16)'; c.fillRect(-tw - s, by + s * 0.17, tw * 2 + s * 2, s * 0.1); } });
      if (text) T.toonText(ctx, text, dir * (tw / 2 - s * 0.04), by + s * 0.13 + size * 0.36, { size, fill: S.textColor ?? '#fff6dc', shadow: false, stroke: size * 0.16 });
      ctx.restore();
    }
  };
  T.MAP_OVERLAYS.signs.upright = true;
  T.MAP_OVERLAY_ORDER.push('compass', 'signs');
})();
