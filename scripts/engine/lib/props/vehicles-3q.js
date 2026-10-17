// vehicles-3q.js — three-quarter views of the v2 cars (view 3q: front three-quarter, 3q-back: rear three-quarter) as one
// oblique projection: the near side is the side drawing foreshortened (x * CX); the body and cabin silhouettes of the
// kind (`face.hull`, side coordinates) are swept across the car's width along d = (+-ZX, ZY) * width, so the bonnet,
// roof and boot show their top planes and the front (or rear) face is the swept front (rear) edge, with the grille,
// lamps and bumper mapped onto it by an affine transform; the far wheels peek out under the far side; the swept pieces
// are inked as one silhouette (stroke all, then fill all) with creases where a top plane meets a face. Riders sit half
// the car's width in, behind the glass. Pure drawing: a function of (layer, state).
(function () {
  'use strict';
  const T = window.TOON, VK = T.VK, P = T.PAL, TAU = Math.PI * 2, sh = VK.sh;
  const CX = 0.74, ZX = 0.5, ZY = -0.2, RK = 0.92;

  // Projection of a kind for the front (fwd) or rear three-quarter: foreshortening, sweep vector, centring, rider seat shift.
  VK.geo3q = (o, fwd) => {
    const f = o.face, wd = 2 * f.hw, dx = wd * ZX * (fwd ? 1 : -1), dy = wd * ZY;
    const minX = Math.min(-f.rear * CX, -f.rear * CX + dx), maxX = Math.max(f.front * CX, f.front * CX + dx);
    return { cx: CX, dx, dy, wd, fwd, centre: (minX + maxX) / 2, half: (maxX - minX) / 2, offX: dx / 2 / CX, offY: dy / 2, rk: RK };
  };

  // Closed polygon of a hull (side coordinates); smooth hulls follow T.smoothPath (quadratics through the midpoints).
  const samples = new WeakMap();
  function sample(h) {
    let out = samples.get(h);
    if (out) return out;
    if (!h.smooth) out = h.pts;
    else {
      const Q = h.pts, n = Q.length, mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      out = [];
      for (let i = 0; i < n; i++) {
        const a = mid(Q[(i - 1 + n) % n], Q[i]), c = Q[i], b = mid(Q[i], Q[(i + 1) % n]);
        for (let s = 0; s < 6; s++) { const t = s / 6, u = 1 - t; out.push([u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]); }
      }
    }
    samples.set(h, out);
    return out;
  }
  const pick = (c, col, col2) => (c === 'col' ? col : c === 'col2' ? col2 : c);

  // Visible swept pieces, back to front: the far silhouette, then strips of consecutive edges whose outward normal faces
  // the sweep, one strip per surface class (top plane, face, glass) so a surface fills without seams.
  function pieces(o, g, col, col2) {
    const out = [], creases = [], dirF = g.fwd ? 1 : -1, d = [g.dx, g.dy], far = ([x, y]) => [x + d[0], y + d[1]];
    for (const h of o.face.hull) {
      const pts = sample(h).map(([x, y]) => [x * g.cx, y]), n = pts.length, fill = pick(h.fill ?? 'col', col, col2);
      let area = 0;
      for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; area += a[0] * b[1] - b[0] * a[1]; }
      out.push({ depth: -1e9, pts: pts.map(far), color: sh(fill, -0.34) });
      const cls = pts.map((a, i) => {
        const b = pts[(i + 1) % n], ex = b[0] - a[0], ey = b[1] - a[1];
        if (Math.hypot(ex, ey) < 1e-6) return null;
        const nx = area > 0 ? ey : -ey, ny = area > 0 ? -ex : ex;
        if (nx * d[0] + ny * d[1] <= 1e-6) return null;
        return -ny > Math.abs(nx) * 0.7 ? 'top' : h.glass ? 'glass' : 'face';
      });
      let start = cls.findIndex((c, i) => c !== cls[(i - 1 + n) % n]); // begin at a class change so no run wraps
      if (start < 0) start = 0;
      let run = null;
      for (let j = 0; j < n; j++) {
        const i = (start + j) % n, c = cls[i], a = pts[i], b = pts[(i + 1) % n];
        if (run && run.cls !== c) { if (c && run.cls) creases.push(a); run = null; }
        if (!c) continue;
        if (!run) out.push((run = { cls: c, near: [a], fill, color: c === 'glass' ? sh(fill, -0.62) : c === 'top' ? sh(fill, 0.16) : sh(fill, -0.14) }));
        run.near.push(b);
      }
    }
    for (const p of out) if (p.near) {
      p.pts = [...p.near, ...p.near.map(far).reverse()];
      p.depth = (p.near.reduce((s0, q) => s0 + q[0], 0) / p.near.length) * dirF;
    }
    out.sort((p, q) => p.depth - q.depth);
    return { list: out, creases, glass: out.filter((p) => p.cls === 'glass') };
  }
  const poly = (pts) => (c) => { c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); };

  VK.car3q = (ctx, L, S, env, o, k) => {
    const f = o.face, fwd = S.view === '3q', g = VK.geo3q(o, fwd), r = o.r;
    const col = L.color ?? f.col, col2 = L.color2 ?? f.col2 ?? sh(col, -0.5), tyreC = (o.wheel && o.wheel.tyre) || '#242224';
    const b = VK.bump(S, k, o.wb, L.terrain ?? 'road'), lift = b.dy - r * 0.12;
    ctx.save(); ctx.translate(-g.centre, 0);
    if (T.CK) T.CK.shadow(ctx, L, g.centre, g.half * 0.96, 0);
    for (const x of o.wheels) T.outlined(ctx, (c) => c.ellipse(x * g.cx + g.dx, -r + g.dy, r * g.cx, r, 0, 0, TAU), sh(tyreC, 0.1), { line: 6 }); // far wheels
    const { list, creases, glass } = pieces(o, g, col, col2);
    ctx.save(); ctx.translate(0, lift);
    ctx.lineJoin = 'round'; ctx.strokeStyle = P.ink; ctx.lineWidth = 14;
    for (const p of list) { ctx.beginPath(); poly(p.pts)(ctx); ctx.stroke(); } // one silhouette: stroke all, then fill all
    for (const p of list) T.outlined(ctx, poly(p.pts), p.color, { line: 0, paint: p.cls === 'glass' ? false : 0.6 });
    ctx.strokeStyle = P.ink; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (const a of creases) { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(a[0] + g.dx, a[1] + g.dy); ctx.stroke(); }
    // the front (rear) face: details mapped onto the swept face plane, u in [-hw, hw] across the car
    const x0 = fwd ? (f.faceX ?? f.front - 6) * g.cx : -(f.rearX ?? f.rear - 6) * g.cx;
    ctx.save(); ctx.transform(g.dx / g.wd, g.dy / g.wd, 0, 1, x0 + g.dx / 2, g.dy / 2);
    if (fwd) VK.frontEnd(ctx, f, sh(col, -0.14), !!L.lights);
    else VK.rearEnd(ctx, f, sh(col, -0.14), col2, o);
    if (f.bumper) T.outlined(ctx, (c) => T.rrect(c, -f.bumper.hw, f.bumper.y, 2 * f.bumper.hw, f.bumper.h, f.bumper.h / 2), f.bumper.color, { line: 5 });
    ctx.restore();
    ctx.restore();
    // near side, foreshortened; riders half the width in, behind the glass
    ctx.save(); ctx.scale(g.cx, 1);
    VK.carSide(ctx, L, { ...S, noShadow: true, riderSx: g.rk / g.cx, riderK: g.rk, riderOff: [g.offX, g.offY], noLights: !fwd }, env, o, k);
    ctx.restore();
    // glass over the riders: tint, a highlight, pillars in the cabin colour
    ctx.save(); ctx.translate(0, lift);
    for (const p of glass) {
      ctx.save(); ctx.globalAlpha *= 0.24; T.outlined(ctx, poly(p.pts), f.cabin.glass ?? '#a8c8d8', { line: 0, paint: false }); ctx.restore();
      ctx.strokeStyle = p.fill; ctx.lineWidth = 6; ctx.beginPath(); poly(p.pts)(ctx); ctx.stroke();
      ctx.strokeStyle = P.ink; ctx.lineWidth = 3; ctx.beginPath(); poly(p.pts)(ctx); ctx.stroke();
    }
    ctx.restore();
    ctx.restore();
  };
})();
