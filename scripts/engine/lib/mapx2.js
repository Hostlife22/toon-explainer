// mapx2.js — map overlays (registered in T.MAP_OVERLAYS, drawn by mapx.js in a fixed order) and small map icons
// (T.MAP_ICONS): growing rivers, a crenellated wall strip, jagged animated front lines, dashed routes, city icons
// (optionally burning), grave crosses filling a region, dot armies, tokens travelling along paths, a punch hole with
// cracks, a pencil drawing a border, pins and a big year label.
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
  };
  T.MAP_ICONS = ICONS;
  T.mapIcon = (ctx, kind, s, lt, o = {}) => { const fn = ICONS[kind]; if (!fn) throw new Error('Unknown map icon: ' + kind); ctx.save(); fn(ctx, s, lt, o); ctx.restore(); };

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
  };
})();
