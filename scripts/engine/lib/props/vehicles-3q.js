// vehicles-3q.js — three-quarter views of the v2 cars (view 3q: front three-quarter, 3q-back: rear three-quarter) as a
// real projection: the car turned YAW degrees toward the viewer (3q-back: away), seen from a little above (PITCH) with a
// mild perspective. The kind's body and cabin silhouettes (`face.hull`, side coordinates) are extruded across the car's
// width (a hull's `topFill` paints its top planes, e.g. the open bed of a truck); the strips whose normal faces the camera
// are depth-sorted, inked as one silhouette (stroke all, then fill all) and shaded per surface (tops lit, faces in
// shade, glass dark). The near side is the kind's own side drawing mapped onto the near side plane (so its wheels
// become ellipses and its lines run toward the vanishing side), the grille, lamps, tail lights and bumper are mapped
// onto the front (rear) face plane, the four tyres are cylinders (the far pair peeks out under the body), riders sit
// on the car's centre line behind the glass, upright. Pure drawing: a function of (layer, state).
(function () {
  'use strict';
  const T = window.TOON, VK = T.VK, P = T.PAL, TAU = Math.PI * 2, sh = VK.sh, D = Math.PI / 180;
  const YAW = 36, PITCH = 15, PERSP = 3.4, RK = 0.92, TYRE_STEPS = 5;

  // Projection of a kind for the front (fwd) or rear three-quarter. X along the car (front +), Y canvas y (up -), Z across
  // (near side +). proj(X, Y, Z) -> [x, y, toward] (toward: distance toward the camera). plane(...) -> canvas affine.
  VK.geo3q = (o, fwd) => {
    const f = o.face, a = (fwd ? YAW : -YAW) * D, p = PITCH * D, ca = Math.cos(a), sa = Math.sin(a), cp = Math.cos(p), sp = Math.sin(p);
    const ref = f.frame || f.hull; // the measuring silhouette (a moving part such as a tipping bed must not shift the view)
    const roof = Math.min(...ref.flatMap((h) => h.pts.map((q) => q[1]))), Yc = roof * 1.3, F = PERSP * o.W, hw = f.hw;
    const raw = (X, Y, Z) => {
      const dz = X * sa + Z * ca, toward = dz * cp - Y * sp, s = F / (F - toward);
      return [(X * ca - Z * sa) * s, Yc + (Y * cp + dz * sp - Yc) * s, toward];
    };
    let minX = Infinity, maxX = -Infinity;
    for (const h of ref) for (const [x, y] of h.pts) for (const z of [-hw, hw]) { const q = raw(x, y, z); minX = Math.min(minX, q[0]); maxX = Math.max(maxX, q[0]); }
    const centre = (minX + maxX) / 2;
    const proj = (X, Y, Z) => { const q = raw(X, Y, Z); return [q[0] - centre, q[1], q[2]]; };
    // affine of a plane through c (3D) spanned by unit vectors u and v (3D): canvas = M * (s, t) for s along u, t along v
    const plane = (c, u, v) => {
      const o0 = proj(...c), du = proj(c[0] + u[0], c[1] + u[1], c[2] + u[2]), dv = proj(c[0] + v[0], c[1] + v[1], c[2] + v[2]);
      return [du[0] - o0[0], du[1] - o0[1], dv[0] - o0[0], dv[1] - o0[1], o0[0], o0[1]];
    };
    const midY = (roof + 0) / 2;
    // the near side plane z = hw in side coordinates (x, y) -> canvas: an affine around the body's middle
    const sideAt = (z) => { const m = plane([0, midY, z], [1, 0, 0], [0, 1, 0]); return [m[0], m[1], m[2], m[3], m[4] - midY * m[2], m[5] - midY * m[3]]; };
    const side = sideAt(hw);
    const det = side[0] * side[3] - side[1] * side[2];
    // riders: from the side plane to the centre line (z = 0), drawn upright at the scale RK (inverse of the side shear)
    const c0 = proj(0, midY, 0), c1 = proj(0, midY, hw), dx = c0[0] - c1[0], dy = c0[1] - c1[1];
    const off = [(side[3] * dx - side[2] * dy) / det, (-side[1] * dx + side[0] * dy) / det];
    const mul = RK * (F / (F - c0[2])); // side * riderXf = mul * identity
    const riderXf = [side[3] * mul / det, -side[1] * mul / det, -side[2] * mul / det, side[0] * mul / det];
    return { fwd, a, ca, sa, cp, sp, hw, proj, plane, side, off, riderXf, rk: mul, centre, half: (maxX - minX) / 2,
      toward: [sa * cp, -sp, ca * cp] };
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
  const poly = (pts) => (c) => { c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); };

  // Visible extruded strips of every hull, far to near: runs of consecutive edges of one surface class (top plane,
  // face, glass) whose outward normal faces the camera, so a surface fills without seams; plus the creases between runs.
  function pieces(o, g, col, col2) {
    const out = [], creases = [], [vx, vy] = [g.toward[0], g.toward[1]];
    for (const h of o.face.hull) {
      const pts = sample(h), n = pts.length, fill = pick(h.fill ?? 'col', col, col2);
      let area = 0;
      for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; area += a[0] * b[1] - b[0] * a[1]; }
      out.push({ depth: -1e9, pts: pts.map(([x, y]) => g.proj(x, y, -g.hw)), color: sh(fill, -0.34) }); // far side, behind all
      const cls = pts.map((a, i) => {
        const b = pts[(i + 1) % n], ex = b[0] - a[0], ey = b[1] - a[1], len = Math.hypot(ex, ey);
        if (len < 1e-6) return null;
        const nx = (area > 0 ? ey : -ey) / len, ny = (area > 0 ? -ex : ex) / len;
        if (nx * vx + ny * vy <= 0.02) return null;
        return -ny > Math.abs(nx) * 0.7 ? 'top' : h.glass ? 'glass' : 'face';
      });
      let start = cls.findIndex((c, i) => c !== cls[(i - 1 + n) % n]); // begin at a class change so no run wraps
      if (start < 0) start = 0;
      let run = null;
      for (let j = 0; j < n; j++) {
        const i = (start + j) % n, c = cls[i], a = pts[i], b = pts[(i + 1) % n];
        if (run && run.cls !== c) { if (c && run.cls) creases.push(a); run = null; }
        if (!c) continue;
        if (!run) out.push((run = { cls: c, side: [a], fill, color: c === 'glass' ? sh(fill, -0.62) : c === 'top' ? h.topFill ?? sh(fill, 0.16) : sh(fill, -0.16) }));
        run.side.push(b);
      }
    }
    for (const p of out) if (p.side) {
      const near = p.side.map(([x, y]) => g.proj(x, y, g.hw)), far = p.side.map(([x, y]) => g.proj(x, y, -g.hw));
      p.near = near; p.far = far; p.pts = [...near, ...far.reverse()];
      p.depth = p.pts.reduce((s0, q) => s0 + q[2], 0) / p.pts.length;
    }
    out.sort((p, q) => p.depth - q.depth);
    return { list: out, creases: creases.map(([x, y]) => [g.proj(x, y, g.hw), g.proj(x, y, -g.hw)]), glass: out.filter((p) => p.cls === 'glass') };
  }

  // A tyre as a cylinder between z0 and z1 at side position x: stacked discs, inked once as a silhouette, then filled.
  function tyre(ctx, g, x, r, z0, z1, color) {
    const discs = [];
    for (let i = 0; i <= TYRE_STEPS; i++) discs.push(g.plane([x, -r, T.lerp(z0, z1, i / TYRE_STEPS)], [1, 0, 0], [0, 1, 0]));
    const disc = (m) => (c) => { c.save(); c.transform(...m); c.moveTo(r, 0); c.arc(0, 0, r, 0, TAU); c.restore(); };
    ctx.save(); ctx.strokeStyle = P.ink; ctx.lineWidth = 12;
    for (const m of discs) { ctx.beginPath(); disc(m)(ctx); ctx.stroke(); }
    ctx.fillStyle = color;
    for (const m of discs) { ctx.beginPath(); disc(m)(ctx); ctx.fill(); }
    ctx.restore();
    return discs[discs.length - 1];
  }

  VK.car3q = (ctx, L, S, env, o, k) => {
    const f = o.face, fwd = S.view === '3q', g = VK.geo3q(o, fwd), r = o.r, hw = f.hw, tw = f.tyre;
    const col = L.color ?? f.col, col2 = L.color2 ?? f.col2 ?? sh(col, -0.5), tyreC = (o.wheel && o.wheel.tyre) || '#242224';
    const b = VK.bump(S, k, o.wb, L.terrain ?? 'road'), lift = (b.dy - r * 0.12) * g.side[3];
    if (T.CK && T.PAINT && L.contact !== false) { // ground shadow under the footprint
      const fp = [[f.front, hw], [f.front, -hw], [-f.rear, -hw], [-f.rear, hw]].map(([x, z]) => g.proj(x, 0, z));
      const xs = fp.map((q) => q[0]), ys = fp.map((q) => q[1]);
      const co = typeof L.contact === 'object' && L.contact ? L.contact : { w: typeof L.contact === 'number' ? L.contact : 1 }; // as CK.shadow
      T.contactShadow(ctx, (Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2 + r * 0.1,
        (Math.max(...xs) - Math.min(...xs)) * 0.55 * (co.w ?? 1), Math.max(18, (Math.max(...ys) - Math.min(...ys)) * 0.6) * ((co.h ?? 0.13) / 0.13), co.alpha ?? 0.5);
    }
    // far tyres (inner face toward us), behind the body
    for (const x of o.wheels) {
      const m = tyre(ctx, g, x, r, -hw, -hw + 2 * tw, sh(tyreC, 0.08));
      T.outlined(ctx, (c) => { c.save(); c.transform(...m); c.moveTo(r * 0.45, 0); c.arc(0, 0, r * 0.45, 0, TAU); c.restore(); }, sh(tyreC, -0.2), { line: 4, paint: false });
    }
    const { list, creases, glass } = pieces(o, g, col, col2);
    ctx.save(); ctx.translate(0, lift);
    ctx.lineJoin = 'round'; ctx.strokeStyle = P.ink; ctx.lineWidth = 14;
    for (const p of list) { ctx.beginPath(); poly(p.pts)(ctx); ctx.stroke(); } // one silhouette: stroke all, then fill all
    for (const p of list) T.outlined(ctx, poly(p.pts), p.color, { line: 0, paint: p.cls === 'glass' ? false : 0.6 });
    ctx.strokeStyle = P.ink; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (const [a, c] of creases) { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(c[0], c[1]); ctx.stroke(); }
    ctx.restore();
    // near tyres' treads (their outer faces come with the side drawing)
    for (const x of o.wheels) tyre(ctx, g, x, r, hw - 2 * tw, hw - 1, tyreC);
    // the front (rear) face: details mapped onto the face plane, u in [-hw, hw] across the car (front: u = -z, rear: u = z)
    const xs = f.hull[0].pts.map((q) => q[0]); // on the body's own front (rear) end, not past it (a spare tyre, a bumper)
    const x0 = fwd ? (f.faceX ?? Math.max(...xs) - 4) : -(f.rearX ?? 4 - Math.min(...xs)), m = g.plane([x0, 0, 0], [0, 0, fwd ? -1 : 1], [0, 1, 0]);
    ctx.save(); ctx.translate(0, lift); ctx.transform(...m);
    if (fwd) VK.frontEnd(ctx, f, sh(col, -0.16), !!L.lights);
    else VK.rearEnd(ctx, f, sh(col, -0.16), col2, o);
    if (f.bumper) { const bw = Math.min(f.bumper.hw, hw); T.outlined(ctx, (c) => T.rrect(c, -bw, f.bumper.y, 2 * bw, f.bumper.h, f.bumper.h / 2), f.bumper.color, { line: 5 }); }
    ctx.restore();
    // riders upright on the centre line, behind the near side; then the kind's side drawing on the side plane; then the
    // riders again, faded, through the near side's glass
    const RS = { ...S, noShadow: true, riderXf: g.riderXf, riderK: g.rk, riderOff: g.off, noLights: !fwd, noTail: !fwd, ...(fwd ? {} : { riderView: '3q-back' }) };
    const seated = () => { ctx.save(); ctx.transform(...g.side); ctx.translate(0, b.dy - r * 0.12); ctx.rotate(b.pitch * 0.6); VK.riders(ctx, L, RS, env, o.seats, o.riderSize); ctx.restore(); };
    if (o.seats) seated();
    ctx.save(); ctx.transform(...g.side);
    VK.carSide(ctx, L, { ...RS, noRiders: !!o.seats }, env, o, k);
    ctx.restore();
    const pane = o.seats && f.hull.find((h) => h.glass);
    if (pane) {
      ctx.save(); ctx.translate(0, lift); ctx.beginPath(); poly(sample(pane).map(([x, y]) => g.proj(x, y, hw)))(ctx); ctx.clip(); ctx.translate(0, -lift);
      ctx.globalAlpha *= 0.5; seated(); ctx.restore();
    }
    // glass over the riders: tint, a highlight
    ctx.save(); ctx.translate(0, lift);
    for (const p of glass) {
      ctx.save(); ctx.globalAlpha *= 0.24; T.outlined(ctx, poly(p.pts), f.cabin.glass ?? '#a8c8d8', { line: 0, paint: false }); ctx.restore();
      const n0 = p.near[0], n1 = p.near[p.near.length - 1], f0 = p.far[p.far.length - 1], f1 = p.far[0]; // far is reversed
      const at = (u, v) => [T.lerp(T.lerp(n0[0], n1[0], u), T.lerp(f0[0], f1[0], u), v), T.lerp(T.lerp(n0[1], n1[1], u), T.lerp(f0[1], f1[1], u), v)];
      const [h0, h1] = [at(0.3, 0.25), at(0.62, 0.6)];
      ctx.save(); ctx.globalAlpha *= 0.45; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 7; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(h0[0], h0[1]); ctx.lineTo(h1[0], h1[1]); ctx.stroke(); ctx.restore();
    }
    ctx.restore();
  };
})();
