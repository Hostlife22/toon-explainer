// map-overlays.js — map overlays (registered in T.MAP_OVERLAYS, drawn by map.js in a fixed order) and small map icons
// (T.MAP_ICONS): growing rivers, a crenellated wall strip, jagged animated front lines, dashed routes, city icons
// (optionally burning), grave crosses filling a region, dot armies, tokens travelling along paths, a punch hole with
// cracks, a pencil drawing a border, pins, a big year label, morphing lines and icons thrown in an arc.
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL;
  const twos = (lt) => Math.floor(lt * 15) / 15;

  // Point along a polyline at progress p (0..1) plus the heading angle.
  T.pathAt = (pts, p) => {
    const segs = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]));
    let left = segs.reduce((a, b) => a + b, 0) * T.clamp(p);
    for (let i = 0; i < segs.length; i++) {
      if (left <= segs[i] || i === segs.length - 1) {
        const f = segs[i] ? T.clamp(left / segs[i]) : 0;
        return { x: T.lerp(pts[i][0], pts[i + 1][0], f), y: T.lerp(pts[i][1], pts[i + 1][1], f), a: Math.atan2(pts[i + 1][1] - pts[i][1], pts[i + 1][0] - pts[i][0]), i, f };
      }
      left -= segs[i];
    }
    return { x: pts[0][0], y: pts[0][1], a: 0, i: 0, f: 0 };
  };
  const strokePartial = (ctx, pts, p) => {
    if (p <= 0 || pts.length < 2) return null;
    const end = T.pathAt(pts, p);
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i <= end.i; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.lineTo(end.x, end.y); ctx.stroke();
    return end;
  };
  const toPx = (g, pts) => pts.map(([x, y]) => [g.X(x), g.Y(y)]);
  const pop = (lt, at, d = 0.25) => T.ease.outBack(T.prog(lt, at ?? 0, d));

  // ---------- icons (centered, size s ~ height) ----------
  const ICONS = {
    ship(ctx, s, lt) {
      ctx.rotate(Math.sin(lt * 2.4) * 0.06);
      T.outlined(ctx, (k) => { k.moveTo(-s * 0.5, 0); k.lineTo(s * 0.5, 0); k.lineTo(s * 0.32, s * 0.22); k.lineTo(-s * 0.36, s * 0.22); k.closePath(); }, '#7a4a2a', { line: s * 0.06 });
      T.outlined(ctx, (k) => k.rect(-s * 0.03, -s * 0.62, s * 0.06, s * 0.62), '#5a3a22', { line: s * 0.04 });
      T.outlined(ctx, (k) => { k.moveTo(s * 0.03, -s * 0.58); k.quadraticCurveTo(s * 0.42, -s * 0.34, s * 0.03, -s * 0.08); k.closePath(); }, '#fbf6ea', { line: s * 0.05 });
    },
    train(ctx, s) {
      T.outlined(ctx, (k) => k.rect(-s * 0.6, -s * 0.4, s * 0.55, s * 0.36), '#c8323a', { line: s * 0.06 });
      T.outlined(ctx, (k) => k.rect(s * 0.02, -s * 0.34, s * 0.55, s * 0.3), '#3a6fb0', { line: s * 0.06 });
      T.outlined(ctx, (k) => k.rect(-s * 0.5, -s * 0.62, s * 0.14, s * 0.22), '#2a1c15', { line: s * 0.05 });
      for (const x of [-0.45, -0.15, 0.15, 0.45]) T.outlined(ctx, (k) => k.arc(x * s, 0, s * 0.1, 0, Math.PI * 2), '#2a1c15', { line: s * 0.04 });
    },
    helmet(ctx, s) {
      T.outlined(ctx, (k) => { k.ellipse(0, 0, s * 0.42, s * 0.36, 0, Math.PI, Math.PI * 2); k.lineTo(s * 0.55, 0); k.lineTo(-s * 0.55, 0); k.closePath(); }, '#6b6a3e', { line: s * 0.07 });
    },
    tank(ctx, s, lt) {
      T.outlined(ctx, (k) => { k.moveTo(-s * 0.6, 0); k.lineTo(-s * 0.4, -s * 0.3); k.lineTo(s * 0.45, -s * 0.3); k.lineTo(s * 0.6, 0); k.lineTo(s * 0.45, s * 0.22); k.lineTo(-s * 0.45, s * 0.22); k.closePath(); }, '#7d6a52', { line: s * 0.07 });
      ctx.strokeStyle = P.ink; ctx.lineWidth = s * 0.05; ctx.setLineDash([s * 0.08, s * 0.08]); ctx.lineDashOffset = -twos(lt) * 40; ctx.beginPath(); ctx.moveTo(-s * 0.5, s * 0.1); ctx.lineTo(s * 0.5, s * 0.1); ctx.stroke(); ctx.setLineDash([]);
    },
    mug(ctx, s) {
      T.outlined(ctx, (k) => T.rrect(k, -s * 0.28, -s * 0.36, s * 0.48, s * 0.66, s * 0.06), '#e8a83a', { line: s * 0.07 });
      T.outlined(ctx, (k) => T.smoothPath(k, T.blobPts(-s * 0.04, -s * 0.38, s * 0.3, s * 0.12, 'foam', 10, 0.3)), '#fff6e0', { line: s * 0.05 });
      ctx.strokeStyle = P.ink; ctx.lineWidth = s * 0.07; ctx.beginPath(); ctx.arc(s * 0.24, -s * 0.04, s * 0.14, -Math.PI / 2, Math.PI / 2); ctx.stroke();
    },
    pawn(ctx, s, lt, o) {
      const c = o.color ?? '#f4efe4';
      T.outlined(ctx, (k) => { k.moveTo(-s * 0.3, s * 0.3); k.lineTo(s * 0.3, s * 0.3); k.lineTo(s * 0.14, -s * 0.1); k.lineTo(-s * 0.14, -s * 0.1); k.closePath(); }, c, { line: s * 0.06 });
      T.outlined(ctx, (k) => k.arc(0, -s * 0.24, s * 0.18, 0, Math.PI * 2), c, { line: s * 0.06 });
    },
    castle(ctx, s) {
      const c = '#b9b2a4';
      T.outlined(ctx, (k) => { k.moveTo(-s * 0.45, s * 0.3); k.lineTo(-s * 0.45, -s * 0.25); for (let i = 0; i < 5; i++) { const x = -s * 0.45 + i * s * 0.225; k.lineTo(x, -s * 0.38); k.lineTo(x + s * 0.11, -s * 0.38); k.lineTo(x + s * 0.11, -s * 0.25); k.lineTo(x + s * 0.225, -s * 0.25); } k.lineTo(s * 0.45, s * 0.3); k.closePath(); }, c, { line: s * 0.05 });
      T.outlined(ctx, (k) => { k.moveTo(-s * 0.1, s * 0.3); k.lineTo(-s * 0.1, s * 0.05); k.arc(0, s * 0.05, s * 0.1, Math.PI, 0); k.lineTo(s * 0.1, s * 0.3); }, '#3a2a22', { line: s * 0.04 });
    },
    dome(ctx, s) {
      T.outlined(ctx, (k) => k.rect(-s * 0.4, -s * 0.05, s * 0.8, s * 0.35), '#e8d2a0', { line: s * 0.05 });
      T.outlined(ctx, (k) => { k.moveTo(-s * 0.28, -s * 0.05); k.quadraticCurveTo(-s * 0.3, -s * 0.5, 0, -s * 0.58); k.quadraticCurveTo(s * 0.3, -s * 0.5, s * 0.28, -s * 0.05); k.closePath(); }, '#3a8a7a', { line: s * 0.05 });
      T.outlined(ctx, (k) => k.rect(s * 0.32, -s * 0.5, s * 0.08, s * 0.5), '#e8d2a0', { line: s * 0.04 });
    },
    pagoda(ctx, s) {
      for (let i = 0; i < 3; i++) {
        const y = s * 0.3 - i * s * 0.26, w = s * (0.7 - i * 0.16);
        T.outlined(ctx, (k) => k.rect(-w * 0.32, y - s * 0.16, w * 0.64, s * 0.16), '#a03a2a', { line: s * 0.04 });
        T.outlined(ctx, (k) => { k.moveTo(-w / 2 - s * 0.06, y - s * 0.12); k.quadraticCurveTo(-w / 2, y - s * 0.18, -w * 0.32, y - s * 0.22); k.lineTo(w * 0.32, y - s * 0.22); k.quadraticCurveTo(w / 2, y - s * 0.18, w / 2 + s * 0.06, y - s * 0.12); k.closePath(); }, '#4a4a50', { line: s * 0.04 });
      }
    },
    house(ctx, s) {
      T.outlined(ctx, (k) => k.rect(-s * 0.3, -s * 0.05, s * 0.6, s * 0.35), '#d8c2a0', { line: s * 0.05 });
      T.outlined(ctx, (k) => { k.moveTo(-s * 0.4, -s * 0.05); k.lineTo(0, -s * 0.4); k.lineTo(s * 0.4, -s * 0.05); k.closePath(); }, '#b8553a', { line: s * 0.05 });
    },
    cross(ctx, s, lt, o) {
      const c = o.color ?? '#f2efe8';
      T.outlined(ctx, (k) => { k.rect(-s * 0.07, -s * 0.45, s * 0.14, s * 0.9); k.rect(-s * 0.3, -s * 0.25, s * 0.6, s * 0.13); }, c, { line: s * 0.06 });
    },
    flag(ctx, s, lt, o) {
      ctx.strokeStyle = P.ink; ctx.lineWidth = s * 0.06; ctx.beginPath(); ctx.moveTo(0, s * 0.4); ctx.lineTo(0, -s * 0.5); ctx.stroke();
      const wv = Math.sin(lt * 6) * s * 0.04;
      T.outlined(ctx, (k) => { k.moveTo(0, -s * 0.5); k.quadraticCurveTo(s * 0.25, -s * 0.5 + wv, s * 0.5, -s * 0.45); k.lineTo(s * 0.5, -s * 0.15); k.quadraticCurveTo(s * 0.25, -s * 0.2 + wv, 0, -s * 0.2); k.closePath(); }, o.color ?? P.red, { line: s * 0.05 });
    },
    army(ctx, s, lt, o) {
      const r = T.rng(T.hash('armyicon' + (o.color ?? '')));
      ctx.fillStyle = 'rgba(29,20,16,0.85)'; ctx.beginPath(); ctx.ellipse(0, 0, s * 0.6, s * 0.3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3a2a22'; for (let i = 0; i < 28; i++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()); ctx.beginPath(); ctx.arc(Math.cos(a) * d * s * 0.55, Math.sin(a) * d * s * 0.26, s * 0.05, 0, Math.PI * 2); ctx.fill(); }
      ctx.save(); ctx.translate(s * 0.2, -s * 0.1); ICONS.flag(ctx, s * 0.6, lt, o); ctx.restore();
    },
    // blast: flat cartoon explosion (orange jagged star, yellow core, white hot centre); o.seed varies the spikes
    blast(ctx, s, lt, o) {
      const seed = 'blast' + (o.seed ?? '');
      T.starburst(ctx, 0, 0, s * 0.34, s * 0.62, 9, seed, o.color ?? '#f0742a', P.ink, Math.max(2, s * 0.07));
      ctx.fillStyle = '#ffd23a'; ctx.beginPath(); T.starburstPath(ctx, 0, 0, s * 0.2, s * 0.4, 7, seed + ':in'); ctx.fill();
      ctx.fillStyle = '#fff8dc'; ctx.beginPath(); ctx.arc(0, 0, s * 0.13, 0, Math.PI * 2); ctx.fill();
    },
    // dot: infection / marker dot with one flat shadow tone
    dot(ctx, s, lt, o) {
      const c = o.color ?? '#c8202a';
      T.outlined(ctx, (k) => k.arc(0, 0, s * 0.3, 0, Math.PI * 2), c, { line: Math.max(2, s * 0.07), shade: (k) => { k.fillStyle = T.shade(c, -0.28); k.fillRect(-s, s * 0.1, s * 2, s); } });
    },
  };
  T.MAP_ICONS = ICONS;
  T.mapIcon = (ctx, kind, s, lt, o = {}) => { const fn = ICONS[kind]; if (!fn) throw new Error('Unknown map icon: ' + kind); ctx.save(); fn(ctx, s, lt, o); ctx.restore(); };

  // ---------- route marks: `drops` on anything that travels along a map path ----------
  // Reference: a toy car crossing a map leaves an explosion every ~0.5 s (pops in ~6 f, holds ~1 s, turns to smoke);
  // fight clouds plant flags along a trench line; a virus leaves infection dots. Marks live in map space.
  const FR = 1 / 30;
  const popScale = (age, n) => { // 0 -> 1.15 -> 1 over n frames, stepped per frame (first frame already visible)
    const q = (Math.floor(age * 30 + 1e-6) + 1) / n;
    return q >= 1 ? 1 : q < 0.6 ? 1.15 * T.ease.out(q / 0.6) : T.lerp(1.15, 1, (q - 0.6) / 0.4);
  };
  const markKind = (kind, what) => { if (!ICONS[kind] && !T.PROPS[kind]) throw new Error(`map drops: unknown ${what} "${kind}" (map icon or prop kind)`); };
  function markIcon(ctx, kind, size, lt, o) {
    if (ICONS[kind]) return T.mapIcon(ctx, kind, size, lt, o);
    ctx.save(); if (T.PROP_GROUND && T.PROP_GROUND.has(kind)) ctx.translate(0, size / 2); T.drawProp(ctx, kind, size, lt, o); ctx.restore();
  }
  function routeMark(ctx, o, i, age, lt, tag) {
    const size = o.size ?? 60, popN = Math.max(1, o.pop ?? 6), icon = o.icon ?? 'blast', after = o.after ?? 'smoke';
    const rot = (T.rng(T.hash(tag + ':rot:' + i))() - 0.5) * (o.spin ?? 30) * T.DEG, mo = { ...o, id: tag + ':' + i, seed: tag + ':' + i };
    const drawAs = (kind, q, o2 = mo) => { ctx.save(); ctx.rotate(rot); ctx.scale(q, q); markIcon(ctx, kind, size, lt, o2); ctx.restore(); };
    if (o.life == null || age < o.life) return drawAs(icon, popScale(age, popN));
    const a2 = age - o.life;
    if (a2 < 3 * FR) drawAs(icon, 1 - a2 / (3 * FR)); // the mark collapses in 3 frames as its after-state pops in
    if (after === 'smoke') {
      const q = popScale(a2, popN), rise = Math.min(a2, 2) * size * 0.08;
      T.drawCloud(ctx, 0, -size * 0.12 - rise, size * 1.1 * q, size * 0.85 * q, tag + ':smoke:' + i, { line: 3, count: 6, color: '#8a8580', shade: '#6c6763', boil: lt });
    } else if (after !== 'none') drawAs(after, popScale(a2, popN), { ...mo, color: o.afterColor }); // `color` tints the mark only
  }
  // D: {every 0.5, icon 'blast', size 60, life, after 'smoke'|'none'|kind, pop 6, spin 30, color, afterColor}; posAt(t) -> [x, y] in
  // flat map px; place(x, y) -> [px, py, scale] (identity on the flat map, the view projection for upright overlays).
  // A mark is dropped at t0, t0 + every, ... up to min(lt, t1), at the mover's position at that time.
  T.mapRouteMarks = (ctx, D, posAt, t0, t1, lt, tag, place = (x, y) => [x, y, 1]) => {
    if (!D || lt < t0) return;
    const o = D === true ? {} : D, every = o.every ?? 0.5;
    if (!(every > 0)) throw new Error('map drops: "every" must be a number > 0');
    markKind(o.icon ?? 'blast', 'icon'); if (o.after != null && o.after !== 'smoke' && o.after !== 'none') markKind(o.after, 'after');
    const n = Math.floor((Math.min(lt, t1) - t0) / every + 1e-6) + 1;
    for (let i = 0; i < n; i++) {
      const ti = t0 + i * every, pos = posAt(ti);
      if (!pos) continue;
      const [x, y, s] = place(pos[0], pos[1]);
      if (!(s > 0.01)) continue;
      ctx.save(); ctx.translate(x, y); ctx.scale(s, s); routeMark(ctx, o, i, lt - ti, lt, tag); ctx.restore();
    }
  };
  const pathMover = (pts, t0, dur, ease = (v) => v) => (t) => { const q = T.pathAt(pts, ease(T.prog(t, t0, dur))); return [q.x, q.y]; };
  T.mapPathMover = pathMover;

  const pip = (pts, x, y) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };

  T.MAP_OVERLAYS = {
    // rivers: [{pts, at, dur, color, width}] — a cyan line that grows along its path
    rivers(ctx, list, g, lt) {
      for (const R of list) { ctx.save(); ctx.strokeStyle = R.color ?? '#30c8e8'; ctx.lineWidth = R.width ?? 10; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; strokePartial(ctx, toPx(g, R.pts), T.ease.inOut(T.prog(lt, R.at ?? 0, R.dur ?? 1.2))); ctx.restore(); }
    },
    // wall: {pts, at, dur, color} — crenellated strip that snaps in segment by segment, towers every ~60 px
    wall(ctx, Wl, g, lt) {
      const pts = toPx(g, Wl.pts), p = T.prog(lt, Wl.at ?? 0, Wl.dur ?? 1.2), n = Wl.segments ?? 24;
      for (let i = 0; i < n * p; i++) {
        const a = T.pathAt(pts, i / n), b = T.pathAt(pts, (i + 1) / n), q = T.ease.outBack(T.clamp(n * p - i));
        ctx.save(); ctx.translate((a.x + b.x) / 2, (a.y + b.y) / 2); ctx.rotate(a.a); ctx.scale(1, q);
        const len = Math.hypot(b.x - a.x, b.y - a.y) + 2, hgt = Wl.height ?? 22;
        T.outlined(ctx, (k) => { k.rect(-len / 2, -hgt, len, hgt); k.rect(-len / 2, -hgt * 1.5, len * 0.4, hgt * 0.5); }, Wl.color ?? '#8a8a88', { line: 4 });
        if (i % 3 === 0) T.outlined(ctx, (k) => k.rect(-hgt * 0.5, -hgt * 2, hgt, hgt * 2), T.shade(Wl.color ?? '#8a8a88', -0.12), { line: 4 });
        ctx.restore();
      }
    },
    // fronts: [{pts, at, dur, color, width, jag}] — jagged front line that advances along its path
    fronts(ctx, list, g, lt) {
      for (const F of list) {
        const base = toPx(g, F.pts), r = T.rng(T.hash('front' + JSON.stringify(F.pts))), jag = F.jag ?? 14, pts = [];
        for (let i = 0; i < base.length - 1; i++) {
          const [x0, y0] = base[i], [x1, y1] = base[i + 1], n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / 26)), nx = -(y1 - y0), ny = x1 - x0, nl = Math.hypot(nx, ny) || 1;
          for (let k = 0; k < n; k++) { const f = k / n, o = (k % 2 ? 1 : -1) * jag * (0.5 + r() * 0.5); pts.push([T.lerp(x0, x1, f) + (nx / nl) * o, T.lerp(y0, y1, f) + (ny / nl) * o]); }
        }
        pts.push(base[base.length - 1]);
        const p = T.ease.inOut(T.prog(lt, F.at ?? 0, F.dur ?? 1.5));
        ctx.save(); ctx.lineJoin = 'miter'; ctx.lineCap = 'round';
        ctx.strokeStyle = P.ink; ctx.lineWidth = (F.width ?? 10) + 6; strokePartial(ctx, pts, p);
        ctx.strokeStyle = F.color ?? '#d0312d'; ctx.lineWidth = F.width ?? 10; strokePartial(ctx, pts, p);
        ctx.restore();
      }
    },
    // routes: [{pts, at, dur, color}] — dashed marching route (legacy)
    routes(ctx, list, g, lt) {
      for (const Rt of list) {
        const p = T.prog(lt, Rt.at ?? 0, Rt.dur ?? 1.2);
        ctx.save(); ctx.setLineDash([26, 18]); ctx.lineDashOffset = -lt * 60; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.strokeStyle = Rt.color ?? P.red;
        strokePartial(ctx, toPx(g, Rt.pts), p); ctx.restore();
        if (Rt.drops) T.mapRouteMarks(ctx, Rt.drops, pathMover(toPx(g, Rt.pts), Rt.at ?? 0, Rt.dur ?? 1.2), Rt.at ?? 0, (Rt.at ?? 0) + (Rt.dur ?? 1.2), lt, 'route' + JSON.stringify(Rt.pts[0]));
      }
    },
    // cities: [{x, y, icon:'castle'|'dome'|'pagoda'|'house', at, size, burning, label}]
    cities(ctx, list, g, lt) {
      for (const C of list) {
        const q = pop(lt, C.at);
        if (q <= 0) continue;
        ctx.save(); ctx.translate(g.X(C.x), g.Y(C.y)); ctx.scale(q, q);
        T.mapIcon(ctx, C.icon ?? 'castle', C.size ?? 90, lt, C);
        if (C.burning != null && lt >= (typeof C.burning === 'number' ? C.burning : 0)) { ctx.save(); ctx.translate(0, -(C.size ?? 90) * 0.2); T.drawFlame(ctx, (C.size ?? 90) * 0.9, lt, 'city' + C.x + C.y); ctx.restore(); }
        if (C.label) T.toonText(ctx, C.label, 0, (C.size ?? 90) * 0.75, { size: 36 });
        ctx.restore();
      }
    },
    // crosses: {region:id | pts, at, dur, count, size, color} — grave crosses pop in until the region is tiled
    crosses(ctx, C, g, lt) {
      const pts = toPx(g, C.pts ?? g.byId[C.region]?.pts ?? []);
      if (pts.length < 3) return;
      const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]), r = T.rng(T.hash('crosses' + (C.region ?? ''))), n = C.count ?? 60;
      const spots = [];
      for (let tries = 0; spots.length < n && tries < n * 40; tries++) { const x = T.lerp(Math.min(...xs), Math.max(...xs), r()), y = T.lerp(Math.min(...ys), Math.max(...ys), r()); if (pip(pts, x, y)) spots.push([x, y]); }
      spots.sort((a, b) => a[1] - b[1]);
      spots.forEach(([x, y], i) => { const q = pop(lt, (C.at ?? 0) + (i / n) * (C.dur ?? 1.5), 0.15); if (q > 0) { ctx.save(); ctx.translate(x, y); ctx.scale(q, q); T.mapIcon(ctx, 'cross', C.size ?? 34, lt, C); ctx.restore(); } });
    },
    // armies: [{x,y,rx,ry,count,at,dur,color}] — dot clusters popping in one by one (legacy)
    armies(ctx, list, g, lt) {
      for (const A of list) {
        const r = T.rng(T.hash(g.env.seed + 'army' + A.x + A.y)), n = A.count ?? 40;
        for (let i = 0; i < n; i++) {
          const a = r() * Math.PI * 2, d = Math.sqrt(r()), p = T.ease.outBack(T.prog(lt, (A.at ?? 0) + (i / n) * (A.dur ?? 0.6), 0.15));
          if (p <= 0) continue;
          ctx.fillStyle = A.color ?? '#1d1410'; ctx.beginPath();
          ctx.arc(g.X(A.x) + Math.cos(a) * d * (A.rx ?? 0.05) * g.mw, g.Y(A.y) + Math.sin(a) * d * (A.ry ?? 0.03) * g.mh, 7 * p, 0, Math.PI * 2); ctx.fill();
        }
      }
    },
    // tokens: [{icon, pts, at, dur, size, bob, count, every, color, face}] — icons travelling along a path (staggered copies)
    tokens(ctx, list, g, lt) {
      list.forEach((K, j) => { // marks first, so every token rides above the trail it leaves
        if (!K.drops) return;
        const pts = toPx(g, K.pts);
        for (let c = 0; c < (K.count ?? 1); c++) { const t0 = (K.at ?? 0) + c * (K.every ?? 0.3); T.mapRouteMarks(ctx, K.drops, pathMover(pts, t0, K.dur ?? 2, T.ease.inOut), t0, t0 + (K.dur ?? 2), lt, 'token' + j + ':' + c); }
      });
      for (const K of list) {
        const pts = toPx(g, K.pts);
        for (let c = 0; c < (K.count ?? 1); c++) {
          const t0 = (K.at ?? 0) + c * (K.every ?? 0.3), p = T.ease.inOut(T.prog(lt, t0, K.dur ?? 2));
          if (lt < t0) continue;
          const at = T.pathAt(pts, p), flip = Math.cos(at.a) < 0 ? -1 : 1;
          ctx.save(); ctx.translate(at.x, at.y + Math.sin(lt * Math.PI * 2 + c) * (K.bob ?? 3)); ctx.scale(flip, 1);
          T.mapIcon(ctx, K.icon ?? 'ship', K.size ?? 70, lt, K);
          ctx.restore();
        }
      }
    },
    // punch: {x, y, at, size} — black star hole with radial cracks
    punch(ctx, Pn, g, lt) {
      if (lt < (Pn.at ?? 0)) return;
      const x = g.X(Pn.x), y = g.Y(Pn.y), s = Pn.size ?? 120, r = T.rng(T.hash('punch' + Pn.x)), q = T.ease.outBack(T.prog(lt, Pn.at ?? 0, 0.12));
      ctx.save(); ctx.translate(x, y); ctx.scale(q, q);
      ctx.strokeStyle = '#1d1410'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      for (let i = 0; i < (Pn.cracks ?? 8); i++) { const a = (i / (Pn.cracks ?? 8)) * Math.PI * 2 + r() * 0.4, l = s * (1.4 + r() * 2.2); ctx.beginPath(); ctx.moveTo(0, 0); let px = 0, py = 0; for (let k = 1; k <= 3; k++) { px = Math.cos(a + (r() - 0.5) * 0.5) * l * k / 3; py = Math.sin(a + (r() - 0.5) * 0.5) * l * k / 3; ctx.lineTo(px, py); } ctx.stroke(); }
      ctx.fillStyle = '#120c09'; ctx.beginPath();
      for (let i = 0; i <= 16; i++) { const a = (i / 16) * Math.PI * 2, rr = i % 2 ? s * 0.45 : s * (0.85 + r() * 0.25); ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      ctx.fill(); ctx.restore();
    },
    // pencil: {pts, at, dur, color, width} — a pencil sprite draws a border line, sparks at the end
    pencil(ctx, Pc, g, lt) {
      const pts = toPx(g, Pc.pts), p = T.ease.inOut(T.prog(lt, Pc.at ?? 0, Pc.dur ?? 1.5));
      ctx.save(); ctx.strokeStyle = Pc.color ?? '#1d1410'; ctx.lineWidth = Pc.width ?? 8; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const end = strokePartial(ctx, pts, p); ctx.restore();
      if (!end) return;
      if (p < 1) {
        ctx.save(); ctx.translate(end.x, end.y); ctx.rotate(-0.6);
        T.outlined(ctx, (k) => { k.moveTo(0, 0); k.lineTo(18, -30); k.lineTo(-18, -30); k.closePath(); }, '#f2d3a0', { line: 5 });
        T.outlined(ctx, (k) => k.rect(-18, -230, 36, 200), '#f2c230', { line: 6 });
        T.outlined(ctx, (k) => k.rect(-18, -262, 36, 34), '#e88a9a', { line: 6 });
        ctx.restore();
      } else if (lt - (Pc.at ?? 0) - (Pc.dur ?? 1.5) < 0.6) T.FX.sparkle(ctx, { radius: 60, count: 5, id: 'pencil' }, lt);
    },
    // pins: [{x, y, at, label, color, size}]
    pins(ctx, list, g, lt) {
      for (const pin of list) {
        const p = pop(lt, pin.at, 0.3);
        if (p <= 0) continue;
        ctx.save(); ctx.translate(g.X(pin.x), g.Y(pin.y)); ctx.scale(p, p);
        if (pin.style === 'drop') T.outlined(ctx, (k) => { k.moveTo(0, 0); k.bezierCurveTo(-26, -30, -22, -62, 0, -62); k.bezierCurveTo(22, -62, 26, -30, 0, 0); }, pin.color ?? P.red, { line: 6 });
        else T.outlined(ctx, (k) => k.arc(0, 0, 18 * (1 + Math.sin(lt * 5) * 0.08), 0, Math.PI * 2), pin.color ?? P.red, { line: 6 });
        if (pin.label) T.toonText(ctx, pin.label, 0, pin.style === 'drop' ? -78 : -40, { size: pin.size ?? 48 });
        ctx.restore();
      }
    },
    // yearLabel: {text, at, x, y, size, color} — big bold year stamped on the map
    yearLabel(ctx, Y, g, lt) {
      const q = T.ease.outBack(T.prog(lt, Y.at ?? 0, 0.2));
      if (q <= 0) return;
      ctx.save(); ctx.translate(g.X(Y.x ?? 0.82), g.Y(Y.y ?? 0.16)); ctx.rotate((Y.tilt ?? -6) * T.DEG); ctx.scale(T.lerp(1.3, 1, q), T.lerp(1.3, 1, q));
      T.toonText(ctx, String(Y.text), 0, 0, { size: Y.size ?? 120, fill: Y.color ?? '#fff' }); ctx.restore();
    },
    // morphs: [{from:[[x,y]...], to:[[x,y]...], at, dur 0.6, color, width 6, dash false}] — a line that holds `from`,
    // then morphs into `to` (both resampled to the same point count by arc length), stepped on twos.
    morphs(ctx, list, g, lt) {
      for (const M of list) {
        if (!Array.isArray(M.from) || !Array.isArray(M.to) || M.from.length < 2 || M.to.length < 2) throw new Error('map morphs: from and to need at least 2 points each');
        const n = Math.max(M.from.length, M.to.length), a = resample(M.from, n), b = resample(M.to, n);
        const p = T.ease.inOut(T.prog(twos(lt), M.at ?? 0, M.dur ?? 0.6)), w = M.width ?? 6;
        const pts = toPx(g, a.map(([x, y], i) => [T.lerp(x, b[i][0], p), T.lerp(y, b[i][1], p)]));
        ctx.save(); ctx.strokeStyle = M.color ?? P.ink; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        if (M.dash) ctx.setLineDash(Array.isArray(M.dash) ? M.dash : [w * 3, w * 2]);
        ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
        ctx.restore();
      }
    },
    // throws: [{from:[x,y], to:[x,y], icon 'army' (map icon or prop kind), size 70, count 1, every 0.12, at, windup 0.3,
    // dur 0.37, arc 0.25, impact true, spin true}] — each copy winds up at `from` (9 f), flies a parabola (11 f) whose
    // peak is arc x distance above the line, and lands in a dust puff with a star flash (25 f).
    throws(ctx, list, g, lt) {
      list.forEach((Th, j) => {
        if (!Array.isArray(Th.from) || !Array.isArray(Th.to)) throw new Error('map throws: from and to must be [x, y] map fractions');
        const icon = Th.icon ?? 'army', isIcon = !!ICONS[icon];
        if (!isIcon && !T.PROPS[icon]) throw new Error('map throws: unknown icon or prop "' + icon + '"');
        const x0 = g.X(Th.from[0]), y0 = g.Y(Th.from[1]), x1 = g.X(Th.to[0]), y1 = g.Y(Th.to[1]), size = Th.size ?? 70;
        const wind = Th.windup ?? 0.3, dur = Th.dur ?? 0.37, dist = Math.hypot(x1 - x0, y1 - y0), dir = x1 >= x0 ? 1 : -1;
        for (let c = 0; c < (Th.count ?? 1); c++) {
          const t0 = (Th.at ?? 0) + c * (Th.every ?? 0.12), d = lt - t0;
          if (d < 0) continue;
          const tag = 'throw' + j + ':' + c;
          if (d < wind + dur) {
            let x = x0, y = y0, rot = 0, sx = 1, sy = 1;
            if (d < wind) { // wind-up: pull back away from the target and squash, then release
              const q = T.ease.out(T.clamp(d / wind)), back = Math.sin(q * Math.PI * 0.5) * size * 0.35;
              x -= ((x1 - x0) / (dist || 1)) * back; y -= ((y1 - y0) / (dist || 1)) * back; sx = 1 + 0.18 * q; sy = 1 - 0.18 * q; rot = -dir * 0.35 * q;
            } else {
              const u = T.clamp((d - wind) / dur);
              x = T.lerp(x0, x1, u); y = T.lerp(y0, y1, u) - 4 * (Th.arc ?? 0.25) * dist * u * (1 - u);
              rot = Th.spin === false ? 0 : dir * u * Math.PI * 2;
            }
            ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sx * (isIcon ? dir : 1), sy);
            if (isIcon) T.mapIcon(ctx, icon, size, lt, Th);
            else { if (T.PROP_GROUND && T.PROP_GROUND.has(icon)) ctx.translate(0, size / 2); T.drawProp(ctx, icon, size, lt, { id: tag }); }
            ctx.restore();
          } else if (Th.impact !== false) impactPuff(ctx, x1, y1, size, d - wind - dur, tag);
        }
      });
    },
  };
  T.MAP_OVERLAY_ORDER.push('morphs', 'throws');

  // Resample a polyline to n points evenly spaced by arc length (keeps both ends).
  function resample(pts, n) {
    if (pts.length === n) return pts;
    return Array.from({ length: n }, (_, i) => { const q = T.pathAt(pts, i / (n - 1)); return [q.x, q.y]; });
  }
  // Dust cloud at a throw's target: a 3-frame star flash, then seeded puffs swell and fade over 25 frames.
  function impactPuff(ctx, x, y, size, d, tag) {
    const life = 25 / 30;
    if (d > life) return;
    const p = d / life, r = T.rng(T.hash(tag + ':puff'));
    ctx.save(); ctx.translate(x, y);
    if (d < 0.1) T.starburst(ctx, 0, 0, size * 0.45, size * 1.05, 10, tag + ':flash', '#fff2a8', P.ink, 4);
    ctx.globalAlpha *= 1 - T.ease.in(p);
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + r() * 0.5, out = size * (0.25 + T.ease.outCubic(p) * (0.55 + r() * 0.35)), rr = size * (0.28 + r() * 0.14) * (0.7 + 0.5 * T.ease.outCubic(p));
      const px = Math.cos(a) * out, py = Math.sin(a) * out * 0.55 - p * size * 0.3;
      T.outlined(ctx, (k) => k.arc(px, py, rr, 0, Math.PI * 2), i % 2 ? '#d9cbb0' : '#c4b393', { line: 4 });
    }
    ctx.restore();
  }
})();
