// helpers.js — helpers shared by the modules: animated numbers, bottle pour progress, outlined clouds, starbursts, thick arrows,
// cartoon gloves and sub-shot rendering (a shot drawn inside another: panels, TVs, bubbles, paintings).
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL;

  // Number or [{at, v, ease?}] timeline with linear (or per-key eased) interpolation between keys.
  T.num = (v, lt, def = 0) => {
    if (v == null) return def;
    if (typeof v === 'number') return v;
    if (!Array.isArray(v) || !v.length) return def;
    if (lt <= (v[0].at ?? 0)) return v[0].v;
    for (let i = 1; i < v.length; i++) {
      const a = v[i - 1], b = v[i];
      if (lt < (b.at ?? 0)) return T.lerp(a.v, b.v, T.easeBy(b.ease || 'linear')(T.prog(lt, a.at ?? 0, (b.at ?? 0) - (a.at ?? 0))));
    }
    return v[v.length - 1].v;
  };

  const pourEvt = (v) => (v == null || v === false ? null : v === true ? {} : typeof v === 'number' ? { at: v } : v);
  // Pour progress 0..1 (0 upright, 1 tipped 110 deg): an event {at, dur, back, backDur} tips over `dur` and, with `back`,
  // returns upright from that time over `backDur` (default `dur`); a [{at, v, ease}] timeline gives the fraction directly.
  T.pourAmount = (v, lt) => {
    if (Array.isArray(v)) return T.clamp(T.num(v, lt, 0));
    const pr = pourEvt(v);
    if (!pr) return 0;
    const dur = pr.dur ?? 0.5, p = T.ease.inOut(T.prog(lt, pr.at ?? 0, dur));
    return typeof pr.back === 'number' ? p * (1 - T.ease.inOut(T.prog(lt, pr.back, pr.backDur ?? dur))) : p;
  };
  // How far the pour has emptied the bottle (0..1): the deepest tip so far, so liquid stays poured once it tips back.
  T.pourSpent = (v, lt) => {
    if (!Array.isArray(v)) { const pr = pourEvt(v); return pr ? T.ease.inOut(T.prog(lt, pr.at ?? 0, pr.dur ?? 0.5)) : 0; }
    let m = T.pourAmount(v, lt);
    for (const k of v) if ((k.at ?? 0) <= lt) m = Math.max(m, T.clamp(+k.v || 0));
    return m;
  };

  // Seeded lobes of a cloud as [x, y, r]; `boil` (layer time) re-seeds the radii on twos.
  T.cloudLobes = (x, y, w, h, seed, count = 9, boil = null) => {
    const r = T.rng(T.hash(seed)), out = [];
    const b = boil == null ? null : T.rng(T.hash(seed + ':boil:' + Math.floor(boil * 15)));
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + r() * 0.4;
      const rad = w * (0.18 + r() * 0.14) * (b ? 0.94 + b() * 0.12 : 1);
      out.push([x + Math.cos(a) * w * 0.32, y + Math.sin(a) * h * 0.3, rad]);
    }
    out.push([x, y, Math.min(w, h) * 0.36]);
    return out;
  };

  // Union of circles drawn as one outlined shape: stroke every lobe, fill every lobe, shade the lower part.
  T.drawCloud = (ctx, x, y, w, h, seed, o = {}) => {
    const lobes = T.cloudLobes(x, y, w, h, seed, o.count ?? 9, o.boil ?? null);
    const path = (k) => { k.beginPath(); for (const [cx, cy, r] of lobes) { k.moveTo(cx + r, cy); k.arc(cx, cy, r, 0, Math.PI * 2); } };
    ctx.save();
    if (o.line !== 0) { ctx.lineWidth = (o.line ?? 6) * 2; ctx.strokeStyle = o.ink ?? P.ink; ctx.lineJoin = 'round'; path(ctx); ctx.stroke(); }
    ctx.fillStyle = o.color ?? '#f4f1ea'; path(ctx); ctx.fill();
    if (o.shade !== false) {
      ctx.save(); path(ctx); ctx.clip();
      ctx.fillStyle = o.shade ?? '#d6d0c6'; ctx.fillRect(x - w, y + h * 0.15, w * 2, h);
      ctx.restore();
    }
    ctx.restore();
    return lobes;
  };

  // Jagged n-spike star (impact stars, splats, comic booms).
  T.starburstPath = (ctx, x, y, rIn, rOut, n, seed) => {
    const r = T.rng(T.hash(seed));
    ctx.moveTo(x + rOut, y);
    for (let i = 0; i < n * 2; i++) {
      const a = (i / (n * 2)) * Math.PI * 2, rad = i % 2 ? rIn * (0.85 + r() * 0.3) : rOut * (0.8 + r() * 0.4);
      ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
    }
    ctx.closePath();
  };
  T.starburst = (ctx, x, y, rIn, rOut, n, seed, fill = '#fff6c8', ink = P.ink, line = 6) =>
    T.outlined(ctx, (k) => T.starburstPath(k, x, y, rIn, rOut, n, seed), fill, { line, ink });

  // Thick cartoon arrow along a polyline (2+ points, quadratic smoothing): body, head(s), outline, lower shade, label.
  T.drawThickArrow = (ctx, pts, o = {}) => {
    if (!pts || pts.length < 2) return;
    const w = o.w ?? 34, head = o.head ?? w * 1.9, fill = o.fill ?? '#e8562a';
    const n = pts.length, [ex, ey] = pts[n - 1], [px, py] = pts[n - 2];
    const ang = Math.atan2(ey - py, ex - px);
    const sang = Math.atan2(pts[1][1] - pts[0][1], pts[1][0] - pts[0][0]);
    const trim = (p, a, d) => [p[0] - Math.cos(a) * d, p[1] - Math.sin(a) * d];
    const body = pts.map((p) => p.slice());
    body[n - 1] = trim(pts[n - 1], ang, head * 0.8);
    if (o.double) body[0] = trim(pts[0], sang + Math.PI, head * 0.8);
    const line = (k) => {
      k.beginPath(); k.moveTo(body[0][0], body[0][1]);
      for (let i = 1; i < n - 1; i++) k.quadraticCurveTo(body[i][0], body[i][1], (body[i][0] + body[i + 1][0]) / 2, (body[i][1] + body[i + 1][1]) / 2);
      k.lineTo(body[n - 1][0], body[n - 1][1]);
    };
    const tri = (k, x, y, a) => {
      k.moveTo(x, y);
      k.lineTo(x - Math.cos(a - 0.5) * head, y - Math.sin(a - 0.5) * head);
      k.lineTo(x - Math.cos(a + 0.5) * head, y - Math.sin(a + 0.5) * head);
      k.closePath();
    };
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = o.ink ?? P.ink; ctx.lineWidth = w + (o.line ?? 7) * 2; line(ctx); ctx.stroke();
    ctx.beginPath(); tri(ctx, ex, ey, ang); if (o.double) tri(ctx, pts[0][0], pts[0][1], sang + Math.PI);
    ctx.lineWidth = (o.line ?? 7) * 2; ctx.stroke();
    ctx.strokeStyle = fill; ctx.lineWidth = w; line(ctx); ctx.stroke();
    ctx.fillStyle = fill; ctx.beginPath(); tri(ctx, ex, ey, ang); if (o.double) tri(ctx, pts[0][0], pts[0][1], sang + Math.PI); ctx.fill();
    if (o.shade !== false) { ctx.strokeStyle = o.shade ?? T.shade(fill, -0.22); ctx.lineWidth = w * 0.3; ctx.save(); ctx.translate(0, w * 0.28); line(ctx); ctx.stroke(); ctx.restore(); }
    if (o.label) {
      const mid = pts[Math.floor((n - 1) / 2)], nxt = pts[Math.floor((n - 1) / 2) + 1];
      const mx = (mid[0] + nxt[0]) / 2, my = (mid[1] + nxt[1]) / 2;
      let a = Math.atan2(nxt[1] - mid[1], nxt[0] - mid[0]);
      if (a > Math.PI / 2 || a < -Math.PI / 2) a += Math.PI;
      ctx.translate(mx, my); ctx.rotate(a);
      T.toonText(ctx, o.label, 0, -w * 0.9, { size: o.labelSize ?? w * 1.15 });
    }
    ctx.restore();
  };

  // White four-finger cartoon glove at (x, y), `dir` = radians the wrist points from (0 = cuff below, hand up).
  // state: open | fist | point | pinch | grab | thumb. size = glove height in px.
  T.drawGlove = (ctx, x, y, dir, state = 'open', o = {}) => {
    const s = (o.size ?? 120) / 120, skin = o.skin ?? '#fbfaf6', line = o.line ?? 6;
    ctx.save(); ctx.translate(x, y); ctx.rotate(dir); ctx.scale(s, s);
    const finger = (fx, fy, len, a) => { ctx.save(); ctx.translate(fx, fy); ctx.rotate(a); T.outlined(ctx, (k) => T.rrect(k, -11, -len, 22, len, 11), skin, { line }); ctx.restore(); };
    if (state === 'open' || state === 'grab') {
      const curl = state === 'grab' ? 0.55 : 1;
      [-0.28, -0.09, 0.1, 0.28].forEach((a, i) => finger(-27 + i * 18, -30, 50 * curl, a));
      finger(-38, 8, 40 * curl, -1.1);
    }
    if (state === 'point') finger(14, -36, 62, 0.05);
    if (state === 'thumb') finger(-30, -26, 44, -0.15);
    if (state === 'pinch') { finger(-8, -36, 48, 0.35); finger(-30, -10, 40, -0.4); }
    T.outlined(ctx, (k) => k.ellipse(0, -10, 42, 40, 0, 0, Math.PI * 2), skin, { line, shade: (k) => { k.fillStyle = '#dcd8cf'; k.fillRect(-60, 8, 120, 40); } });
    if (state !== 'open' && state !== 'grab') { ctx.strokeStyle = P.ink; ctx.lineWidth = 4; ctx.beginPath(); for (const fx of [-16, 2, 20]) { ctx.moveTo(fx, -42); ctx.lineTo(fx, -26); } ctx.stroke(); }
    T.outlined(ctx, (k) => T.rrect(k, -34, 22, 68, 26, 10), o.cuff ?? '#f4f1ea', { line });
    ctx.restore();
  };

  // Render another shot of the film into a cached canvas (physical size). opts: {t: freeze at this shot time, grade: false}.
  // Nesting is limited to 2 levels so a shot that shows itself fails loudly instead of recursing forever.
  let subDepth = 0;
  const timelines = new WeakMap();
  const timelineOf = (spec) => { if (!timelines.has(spec)) timelines.set(spec, T.buildTimeline(spec)); return timelines.get(spec); };
  T.subShot = (id, lt, env, opts = {}) => {
    const tl = T.film && T.film.spec === env.spec ? T.film.timeline : timelineOf(env.spec);
    const shot0 = tl.shots.find((s) => s.id === id), shot = shot0 && T.resolvePinned ? T.resolvePinned(shot0) : shot0;
    if (!shot) throw new Error(`subShot: no shot with id "${id}"`);
    if (subDepth >= 2) throw new Error(`subShot: "${id}" nests deeper than 2 levels (does a shot show itself?)`);
    const w = Math.round((T.W * env.dpr) / 2) * 2, h = Math.round((T.H * env.dpr) / 2) * 2;
    const [c, k] = T.scratch('sub:' + id + ':' + subDepth, w, h);
    subDepth++;
    try {
      const t = T.clamp(opts.t ?? lt, 0, shot.dur), sub = { ...env, noPost: opts.grade === false, cam: undefined, frameX: undefined }; // the cell shows the whole source frame
      if (T.FORMAT === 'vertical') {
        // Vertical film: draw the source as its viewer saw it, with its frame x moved to the centre of the cell's world.
        const half = T.STRIP_W / 2, fx = T.clamp(T.num(shot.frame, t, 0.5) * T.W, half, T.W - half), cam = shot.camera || {};
        const framed = cam.focus ? shot : { ...shot, camera: { ...cam, focus: [fx / T.W, 0.5] } };
        // The whole world is drawn (no black margins); panels crop the cell around this frame x (panels.js).
        T.drawShot(k, framed, t, { ...sub, frameX: fx });
        if (T.drawPinned && shot.pinned && shot.pinned.length) {
          const [c2, k2] = T.scratch('sub2:' + id + ':' + subDepth, w, h);
          k2.setTransform(1, 0, 0, 1, 0, 0); k2.clearRect(0, 0, w, h);
          T.drawPinned(k2, shot, t, { ...sub, frameX: T.W / 2 });
          k.save(); k.setTransform(1, 0, 0, 1, 0, 0); k.drawImage(c2, Math.round((fx - T.W / 2) * env.dpr), 0); k.restore();
        }
      } else {
        T.drawShot(k, shot, t, sub);
        if (T.drawPinned) T.drawPinned(k, shot, t, sub);
      }
    } finally { subDepth--; }
    return c;
  };
})();
