// vehicles-views.js — front, three-quarter and back views of the v2 cars (model-t, car1910, sedan1920, car1950,
// car-modern) and the turn between them. `view` (front | 3q | side | back | 3q-back) and `facing` (right | left) are
// constants or [{at, v}] timelines (layer time): a change turns the car through the views in between, `turn.frames`
// drawings each (default 2 at 30 fps), squashed a little and with a smear. A car on a `path` that reverses (face: true)
// turns through 3q and front (path heading down the frame) or 3q-back and back (heading up) around the reversal instead
// of the squash other layers get; `turn: false` keeps the squash. The 3q views are the side drawing squeezed and
// sheared, joined to a squeezed front / back face; the face comes from the kind's `face` description (vehicles-road.js).
// Without `view` / `facing` and without a reversal the side drawing is unchanged. Pure functions of (layer, time).
(function () {
  'use strict';
  const T = window.TOON, VK = T.VK, P = T.PAL, TAU = Math.PI * 2, sh = VK.sh;
  const FPS = 30, Q_SIDE = 0.7, Q_FACE = 0.62, SH_SIDE = 0.07, SH_FACE = 0.1;
  VK.VIEW_KINDS = new Set(['model-t', 'car1910', 'sedan1920', 'car1950', 'car-modern']);
  VK.VIEW_COL = { 'model-t': '#23252b', car1910: '#2f3e5a', sedan1920: '#6a1e24', car1950: '#5ab0b8', 'car-modern': '#d8322e' };
  const ANG = { front: 0, '3q': 45, side: 90, '3q-back': 135, back: 180 };
  VK.VIEW_NAMES = Object.keys(ANG);
  const X_AT = { side: 1, '3q': 0.72, '3q-back': 0.72, front: 0.05, back: 0.05 };

  // ---------- which view, when ----------
  const wrap = (a) => { let x = ((a % 360) + 360) % 360; if (x > 180) x -= 360; return x; };
  const faceNum = (v) => (v === 'left' || v === -1 ? -1 : 1);
  function keyAt(val, lt) { // value at lt + time of the last change at or before lt (null: never changed)
    if (!Array.isArray(val)) return { v: val, at: null };
    let i = -1;
    for (let k = 0; k < val.length; k++) if (lt >= (val[k].at ?? 0)) i = k;
    if (i < 0) return { v: val.length ? val[0].v : undefined, at: null };
    let j = i;
    while (j > 0 && val[j - 1].v === val[i].v) j--;
    return { v: val[i].v, at: j > 0 ? val[j].at ?? 0 : null };
  }
  function poseAt(L, lt) {
    const v = keyAt(L.view, lt), f = keyAt(L.facing, lt), name = (T.VIEW_ALIAS && T.VIEW_ALIAS[v.v]) || v.v || 'side';
    return { view: ANG[name] == null ? 'side' : name, facing: faceNum(f.v), at: Math.max(v.at ?? -1e9, f.at ?? -1e9) };
  }
  function viewOfAngle(a, fb) {
    const x = wrap(a), m = Math.abs(x);
    const view = m < 22.5 ? 'front' : m < 67.5 ? '3q' : m <= 112.5 ? 'side' : m < 157.5 ? '3q-back' : 'back';
    return { view, facing: m > 1e-6 && m < 180 - 1e-6 ? Math.sign(x) : fb };
  }
  const cfgOf = (L) => (L.turn === false ? null : (typeof L.turn === 'object' && L.turn) || {});
  function explicitView(L, lt) {
    const cur = poseAt(L, lt), out = { view: cur.view, facing: cur.facing, sx: 1, sy: 1, smear: 0, dir: 0 }, cfg = cfgOf(L);
    if (!cfg || cur.at < -1e8) return out;
    const prev = poseAt(L, cur.at - 1e-6);
    if (prev.view === cur.view && prev.facing === cur.facing) return out;
    const a0 = ANG[prev.view] * prev.facing, a1 = ANG[cur.view] * cur.facing;
    let d = wrap(a1 - a0);
    if (Math.abs(Math.abs(d) - 180) < 1e-6) d = (a0 > 0 ? -1 : 1) * (cfg.via === 'back' ? -1 : 1) * 180; // half turn: via the front unless via: back
    const sign = d >= 0 ? 1 : -1, stops = [];
    for (let k = 1; k * 45 < Math.abs(d) - 1e-6; k++) {
      const s = viewOfAngle(a0 + sign * k * 45, cur.facing), last = stops[stops.length - 1] || prev;
      if (!(s.view === last.view && s.facing === last.facing)) stops.push(s);
    }
    if (!stops.length) stops.push(cur); // adjacent views: the new view, squashed, for the in-between frames
    const per = Math.max(0, Math.min(6, cfg.frames ?? 2)), f = Math.floor((lt - cur.at) * FPS + 1e-6), n = stops.length * per;
    out.dir = sign;
    if (f < n) { const s = stops[Math.floor(f / per)]; out.view = s.view; out.facing = s.facing; if (cfg.squash !== false) { out.sx = 0.95; out.sy = 1.03; } }
    if (f <= n && cfg.smear !== false) out.smear = 1 - f / (n + 1);
    return out;
  }
  // Path reversals: the view from the arc distance to the nearest change of direction.
  const hasTurns = (L) => { const S = T.pathSpec(L); return !!S && S.face && T.pathTable(S).turns.length > 0; };
  T.pathTurnViews = (L) => !!L && L.type === 'vehicle' && L.turn !== false && VK.VIEW_KINDS.has(L.kind) && hasTurns(L);
  function pathView(L, t) {
    const p = T.motionAt(L, t), cfg = cfgOf(L) || {};
    if (!p || !Number.isFinite(p.turnOff)) return 'side';
    const span = Math.max(60, (L.size ?? VK.SIZE[L.kind] ?? 420) * (cfg.span ?? 0.5)), phi = 1 - Math.abs(p.turnOff) / span;
    if (phi < 0.34) return 'side';
    const toward = cfg.via ? cfg.via !== 'back' : p.turnDy > 0;
    return phi < 0.8 ? (toward ? '3q' : '3q-back') : toward ? 'front' : 'back';
  }
  const explicit = (L) => L.view != null || L.facing != null;
  // {view, facing (+1 / -1, on top of dir / path flip), sx, sy (in-between squash), smear (0..1), dir} or null (plain side)
  VK.viewOf = (L, lt, slt) => {
    if (!VK.VIEW_KINDS.has(L.kind)) return null;
    if (explicit(L)) return explicitView(L, lt);
    if (!T.pathTurnViews(L)) return null;
    const view = pathView(L, slt), out = { view, facing: 1, sx: 1, sy: 1, smear: 0, dir: 1 };
    for (let k = 1; k <= 2; k++) if (pathView(L, slt - k / FPS) !== view) { out.smear = k === 1 ? 1 : 0.55; if (k === 1 && (cfgOf(L) || {}).squash !== false) { out.sx = 0.95; out.sy = 1.03; } break; }
    return out;
  };
  // Exhaust x factor of the view at shot time te (the pipe moves behind the car in front / back views).
  VK.viewActive = (L) => VK.VIEW_KINDS.has(L.kind) && (explicit(L) || T.pathTurnViews(L));
  VK.viewXAt = (L, te) => X_AT[explicit(L) ? explicitView(L, te - (L.at ?? 0)).view : pathView(L, te)] ?? 1;

  // ---------- drawing ----------
  const pick = (c, col, col2) => (c === 'col' ? col : c === 'col2' ? col2 : c);
  function tyre(ctx, x, r, tw, color, ang) {
    T.outlined(ctx, (c) => T.rrect(c, x - tw, -2 * r, 2 * tw, 2 * r, tw * 0.9), color, { line: 6 });
    ctx.save(); ctx.strokeStyle = sh(color, 0.35); ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) { // tread bars rolling over the visible half of the tyre
      const a = ang + (i * TAU) / 4, c = Math.cos(a);
      if (c <= 0.15) continue;
      const y = -r - Math.sin(a) * r * 0.86;
      ctx.beginPath(); ctx.moveTo(x - tw * 0.55, y); ctx.lineTo(x + tw * 0.55, y); ctx.stroke();
    }
    ctx.restore();
  }
  function lamps(ctx, f, glow) {
    const lp = f.lamps;
    for (const sx of [-1, 1]) {
      const x = sx * lp.x;
      if (lp.kind === 'led') T.outlined(ctx, (c) => { c.moveTo(x - sx * 30, lp.y - 8); c.lineTo(x + sx * 26, lp.y - 12); c.lineTo(x + sx * 30, lp.y + 2); c.lineTo(x - sx * 26, lp.y + 8); c.closePath(); }, '#f6fbff', { line: 4 });
      else {
        if (lp.rim) T.outlined(ctx, (c) => c.arc(x, lp.y, lp.r + 5, 0, TAU), lp.rim, { line: 5 });
        T.outlined(ctx, (c) => c.arc(x, lp.y, lp.r, 0, TAU), lp.color ?? '#fff2b0', { line: 4 });
      }
      if (glow) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createRadialGradient(x, lp.y, 0, x, lp.y, 90); g.addColorStop(0, '#fff6d0cc'); g.addColorStop(1, '#fff2b800');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, lp.y, 90, 0, TAU); ctx.fill(); ctx.restore();
      }
    }
  }
  function tails(ctx, f, back) {
    const tl = f.tail || { x: f.lamps.x, y: f.lamps.y, r: 10 };
    if (back === 'bar') {
      for (const sx of [-1, 1]) T.outlined(ctx, (c) => T.rrect(c, sx > 0 ? f.hw - 70 : -f.hw + 8, tl.y - 9, 62, 18, 8), '#e8303a', { line: 4 });
      ctx.fillStyle = '#b8202a'; ctx.fillRect(-f.hw + 70, tl.y - 3, 2 * f.hw - 140, 6);
      return;
    }
    for (const sx of [-1, 1]) T.outlined(ctx, (c) => (back === 'fins' ? c.ellipse(sx * tl.x, tl.y, tl.r * 0.7, tl.r * 1.5, 0, 0, TAU) : c.arc(sx * tl.x, tl.y, tl.r, 0, TAU)), '#e8403a', { line: 4 });
  }
  function cabin(ctx, L, S, env, o, back, col, col2, withRiders) {
    const f = o.face, cb = f.cabin, b0 = f.belt[0], roof = pick(cb.roof ?? 'col', col, col2);
    const seats = f.seat, front = back ? [[-seats.x, seats.y], [seats.x, seats.y]] : [[seats.x, seats.y], [-seats.x, seats.y]];
    const rid = () => withRiders && VK.riders(ctx, L, { ...S, riderView: back ? 'back' : 'front' }, env, front, seats.size);
    if (cb.open) { // posts, riders, windscreen, canopy
      for (const sx of [-1, 1]) T.outlined(ctx, (c) => T.rrect(c, sx * cb.post - 5, cb.top + 10, 10, b0 - cb.top - 10, 4), '#1a1a1e', { line: 5 });
      rid();
      if (!back) {
        ctx.save(); ctx.globalAlpha *= 0.22; ctx.fillStyle = '#dff0f6'; ctx.fillRect(-cb.post + 14, cb.shield, 2 * cb.post - 28, b0 - cb.shield); ctx.restore();
        ctx.strokeStyle = f.lamps.rim ?? P.ink; ctx.lineWidth = 6; ctx.strokeRect(-cb.post + 14, cb.shield, 2 * cb.post - 28, b0 - cb.shield);
      }
      T.outlined(ctx, (c) => T.rrect(c, -cb.hw, cb.top, 2 * cb.hw, 22, 8), col, { line: 7 });
      return;
    }
    const shape = (inset) => (c) => {
      const t = cb.top + inset, w0 = cb.hw - inset, w1 = cb.topHw - inset;
      c.moveTo(-w0, b0); c.lineTo(-w1, t + 14); c.quadraticCurveTo(-w1, t, -w1 + 14, t); c.lineTo(w1 - 14, t); c.quadraticCurveTo(w1, t, w1, t + 14); c.lineTo(w0, b0); c.closePath();
    };
    if (withRiders) { // full front / back view: roof frame and the dark interior the riders sit in
      T.outlined(ctx, shape(0), roof, { line: 8 });
      T.outlined(ctx, shape(13), sh(roof, -0.6), { line: 0, paint: false });
      rid();
    } else { // 3q: the riders of the side drawing show through a framed pane (the side roof sits behind them)
      ctx.strokeStyle = roof; ctx.lineWidth = 10; ctx.lineJoin = 'round'; ctx.beginPath(); shape(8)(ctx); ctx.stroke();
    }
    ctx.save(); ctx.globalAlpha *= 0.32; T.outlined(ctx, shape(13), cb.glass, { line: 0, paint: false }); ctx.restore();
    ctx.save(); ctx.globalAlpha *= 0.5; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 9; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-cb.topHw * 0.55, cb.top + 30); ctx.lineTo(-cb.hw * 0.2, b0 - 16); ctx.stroke(); ctx.restore();
    ctx.strokeStyle = P.ink; ctx.lineWidth = 5; ctx.beginPath(); shape(withRiders ? 13 : 3)(ctx); ctx.stroke();
    if (!withRiders) { ctx.beginPath(); shape(13)(ctx); ctx.stroke(); }
  }
  function frontEnd(ctx, f, col, glow) {
    const g = f.grille;
    if (g.kind === 'radiator') {
      T.outlined(ctx, (c) => T.rrect(c, -g.hw, g.top, 2 * g.hw, g.bot - g.top, 6), g.color, { line: 6 });
      T.outlined(ctx, (c) => T.rrect(c, -g.hw + 7, g.top + 9, 2 * g.hw - 14, g.bot - g.top - 18, 3), '#3a3226', { line: 0, paint: false,
        shade: (c) => { c.strokeStyle = sh(g.color, -0.3); c.lineWidth = 2; for (let y = g.top + 16; y < g.bot - 10; y += 8) { c.beginPath(); c.moveTo(-g.hw + 8, y); c.lineTo(g.hw - 8, y); c.stroke(); } } });
    } else if (g.kind === 'wide') {
      T.outlined(ctx, (c) => T.rrect(c, -g.hw, g.top, 2 * g.hw, g.bot - g.top, 12), g.color, { line: 6,
        shade: (c) => { c.fillStyle = '#2a2a2e'; for (let i = 0; i < 3; i++) c.fillRect(-g.hw + 10, g.top + 8 + i * 9, 2 * g.hw - 20, 4); } });
    } else T.outlined(ctx, (c) => T.rrect(c, -g.hw, g.top, 2 * g.hw, g.bot - g.top, 8), g.color, { line: 5 });
    lamps(ctx, f, glow);
    if (f.intake) T.outlined(ctx, (c) => T.rrect(c, -f.intake.hw, f.intake.y, 2 * f.intake.hw, f.intake.h, 8), '#1c1c1e', { line: 5 });
  }
  function rearEnd(ctx, f, col, col2, o) {
    if (f.back === 'spare') {
      T.outlined(ctx, (c) => c.arc(0, f.belt[0] + 50, 38, 0, TAU), (o.wheel && o.wheel.tyre) || '#262224', { line: 7 });
      T.outlined(ctx, (c) => c.arc(0, f.belt[0] + 50, 22, 0, TAU), (o.wheel && o.wheel.rim) || '#c9ced2', { line: 4 });
    } else if (f.back === 'fins') {
      ctx.strokeStyle = sh(col, -0.35); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-f.hw * 0.7, f.belt[0] + 26); ctx.quadraticCurveTo(0, f.belt[0] + 18, f.hw * 0.7, f.belt[0] + 26); ctx.stroke();
      T.outlined(ctx, (c) => c.arc(0, f.belt[0] + 44, 8, 0, TAU), '#e8ecee', { line: 3 });
    }
    tails(ctx, f, f.back);
    const py = f.bumper ? f.bumper.y - 26 : f.belt[1] - 34;
    T.outlined(ctx, (c) => T.rrect(c, -30, py, 60, 22, 3), '#f2ecd8', { line: 4 }); // plate
  }
  // One face (front or back) centred on x = 0; skip: 'left' / 'right' hides the near tyre in a 3q view; cab: null (no
  // cabin) or {off (x offset of the windscreen / rear window plane, face units), riders}.
  function drawFace(ctx, L, S, env, o, back, skip, cab, tone = 0) { // tone: shade of the face plane in a 3q view
    const f = o.face, col = tone ? sh(L.color ?? f.col, tone) : L.color ?? f.col, col2 = L.color2 ?? f.col2 ?? sh(col, -0.5), r = o.r;
    const tyreC = (o.wheel && o.wheel.tyre) || '#242224', ang = VK.wheelAng(S, S.k, r) * (back ? -1 : 1);
    if (T.CK) T.CK.shadow(ctx, L, 0, f.hw * 1.12, 0);
    const b = VK.bump(S, S.k, o.wb, L.terrain ?? 'road');
    for (const sx of [-1, 1]) if (!((sx < 0 && skip === 'left') || (sx > 0 && skip === 'right'))) tyre(ctx, sx * f.track, r, f.tyre, tyreC, ang);
    ctx.save(); ctx.translate(0, b.dy - r * 0.12); ctx.rotate((b.f - b.r) * 0.002);
    if (cab) { ctx.save(); ctx.translate(cab.off, 0); cabin(ctx, L, S, env, o, back, col, col2, cab.riders); ctx.restore(); }
    if (f.apron) T.outlined(ctx, (c) => T.rrect(c, -f.track + f.tyre, f.belt[1] - 4, 2 * (f.track - f.tyre), r * 0.9, 6), sh(col, -0.55), { line: 5 });
    T.outlined(ctx, (c) => T.rrect(c, -f.hw, f.belt[0], 2 * f.hw, f.belt[1] - f.belt[0], f.round ?? 12), col, { line: 8,
      shade: (c) => { c.fillStyle = sh(col, -0.22); c.fillRect(-f.hw, f.belt[1] - (f.belt[1] - f.belt[0]) * 0.32, 2 * f.hw, 60); } });
    if (f.fender === 'arch') {
      const fc = pick(f.fenderColor ?? 'col', col, col2);
      for (const sx of [-1, 1]) {
        if ((sx < 0 && skip === 'left') || (sx > 0 && skip === 'right')) continue;
        const x = sx * f.track, w = f.tyre + 14, y0 = -r * 0.95, top = -2 * r - 26;
        T.outlined(ctx, (c) => { c.moveTo(x - w, y0); c.quadraticCurveTo(x - w, top, x, top); c.quadraticCurveTo(x + w, top, x + w, y0); c.lineTo(x + w - 9, y0); c.quadraticCurveTo(x + w - 9, top + 14, x, top + 14); c.quadraticCurveTo(x - w + 9, top + 14, x - w + 9, y0); c.closePath(); }, fc, { line: 6 });
      }
    }
    if (back) rearEnd(ctx, f, col, col2, o);
    else frontEnd(ctx, f, col, !!L.lights);
    if (f.bumper) T.outlined(ctx, (c) => T.rrect(c, -f.bumper.hw, f.bumper.y, 2 * f.bumper.hw, f.bumper.h, f.bumper.h / 2), f.bumper.color, { line: 5 });
    ctx.restore();
  }
  VK.drawFace = drawFace;

  // Draws a car in S.view (front, back, 3q, 3q-back) in kind units (ctx already scaled by k).
  VK.carView = (ctx, L, S, env, o, k) => {
    const f = o.face, v = S.view;
    if (v === 'front' || v === 'back') return drawFace(ctx, L, S, env, o, v === 'back', null, { off: 0, riders: true });
    const fwd = v === '3q', dirF = fwd ? 1 : -1, sideLen = (f.front + f.rear) * Q_SIDE, faceW = 2 * f.hw * Q_FACE, lap = sideLen * 0.09;
    const jx = (dirF * (sideLen - faceW)) / 2 + dirF * lap / 2; // centres the drawing on the layer origin
    // the windscreen (rear window) stands at the cowl (tail) of the side drawing, set back from the face plane
    const cabX = fwd ? (f.cowl - f.front) * Q_SIDE + lap : (f.tailX + f.rear) * Q_SIDE - lap;
    ctx.save(); ctx.translate(jx, 0); ctx.transform(1, SH_SIDE * dirF, 0, 1, 0, 0); ctx.scale(Q_SIDE, 1); ctx.translate(fwd ? -f.front : f.rear, 0);
    VK.carSide(ctx, L, { ...S, riderSx: 0.9 / Q_SIDE, riderK: 0.9, noLights: !fwd }, env, o, k);
    ctx.restore();
    ctx.save(); ctx.translate(jx - dirF * lap, 0); ctx.transform(1, -SH_FACE * dirF, 0, 1, 0, 0); ctx.scale(Q_FACE, 1); ctx.translate(dirF * f.hw, 0);
    drawFace(ctx, L, S, env, o, !fwd, fwd ? 'left' : 'right', { off: cabX / Q_FACE, riders: false }, -0.1);
    ctx.restore();
  };

  // Turn smear: streaks trailing the body for the in-between frames (layer units, after the facing mirror).
  VK.turnSmear = (ctx, L, S, vs) => {
    const w = S.size, col = L.color ?? VK.VIEW_COL[L.kind] ?? '#888888';
    ctx.save(); ctx.globalAlpha *= 0.5 * vs.smear; ctx.lineCap = 'round'; ctx.strokeStyle = col;
    for (let i = 0; i < 3; i++) {
      const y = -w * (0.1 + i * 0.09), x0 = -w * (0.36 + i * 0.03), len = w * (0.26 - i * 0.05) * vs.smear;
      ctx.lineWidth = w * (0.026 - i * 0.005); ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 - len, y); ctx.stroke();
    }
    ctx.restore();
  };
})();
