// turn.js — bean turnarounds. `view` (front | 3q | side | profile | back) and `facing` (right | left) are constants or
// [{at, v}] timelines (layer time). A change turns the character through the views in between, one drawing each
// (`turn.frames`, default 1 frame at 30 fps), squashed sideways and with an automatic hair smear; adjacent views get one
// squashed drawing of the new view. A flip from `move` / `path` gets the same treatment through the front view.
// T.turnState(L, lt) -> {view, facing (+1 right / -1 left), inBetween, sx, sy, changeAt, dir}. Pure function of (L, lt).
(function () {
  'use strict';
  const T = window.TOON;
  T.VIEW_ALIAS = { profile: 'side' };
  const ANG = { front: 0, '3q': 45, side: 90, back: 180 };
  const FPS = 30, SQUASH = 0.9, STRETCH = 1.04;
  const normView = (v) => T.VIEW_ALIAS[v] || v;
  const faceNum = (v) => (v === 'left' || v === -1 ? -1 : 1);

  // Value of a constant / timeline at lt, plus the time of the last change at or before lt (null = never changed).
  function keyAt(val, lt) {
    if (!Array.isArray(val)) return { v: val, at: null };
    let i = -1;
    for (let k = 0; k < val.length; k++) if (lt >= (val[k].at ?? 0)) i = k;
    if (i < 0) return { v: val.length ? val[0].v : undefined, at: null };
    let j = i; // walk back over keys that repeat the same value: they are not changes
    while (j > 0 && val[j - 1].v === val[i].v) j--;
    return { v: val[i].v, at: j > 0 ? val[j].at ?? 0 : null };
  }

  const angleOf = (view, f) => (view === 'front' ? 0 : view === 'back' ? 180 : ANG[view] * f);
  const wrap = (a) => { let x = ((a % 360) + 360) % 360; if (x > 180) x -= 360; return x; };
  function viewOfAngle(a, fallbackFacing) {
    const x = wrap(a), m = Math.abs(x);
    const view = m < 22.5 ? 'front' : m < 67.5 ? '3q' : m < 135 ? 'side' : 'back';
    return { view, facing: x > 0 && m < 180 ? 1 : x < 0 ? -1 : fallbackFacing };
  }

  // The resolved pose (view + facing) at lt from the layer's own fields; the base view comes from `def` (look / pose).
  function poseAt(L, lt, def) {
    const v = keyAt(L.view, lt), f = keyAt(L.facing, lt);
    const view = normView(v.v ?? def ?? '3q');
    return { view: ANG[view] === undefined ? '3q' : view, facing: faceNum(f.v), at: Math.max(v.at ?? -1e9, f.at ?? -1e9) };
  }

  T.turnState = (L, lt, def) => {
    const cur = poseAt(L, lt, def);
    const out = { view: cur.view, facing: cur.facing, inBetween: false, sx: 1, sy: 1, changeAt: null, dir: 0 };
    const cfg = L.turn === false ? null : typeof L.turn === 'object' && L.turn ? L.turn : {};
    if (!cfg || cur.at < -1e8) return out;
    const prev = poseAt(L, cur.at - 1e-6, def);
    const a0 = angleOf(prev.view, prev.facing), a1 = angleOf(cur.view, cur.facing);
    let d = wrap(a1 - a0);
    if (Math.abs(d) >= 180) d = 180 * cur.facing;
    if (prev.view === cur.view && prev.facing === cur.facing) return out;
    const sign = d >= 0 ? 1 : -1, stops = [];
    for (let k = 1; k * 45 < Math.abs(d) - 1e-6; k++) {
      const s = viewOfAngle(a0 + sign * k * 45, cur.facing);
      const last = stops[stops.length - 1] || prev;
      if ((s.view === last.view && s.facing === last.facing) || (s.view === cur.view && s.facing === cur.facing)) continue;
      if (s.view === 'back' && (last.view === 'back' || cur.view === 'back')) continue;
      stops.push(s);
    }
    const per = Math.max(0, Math.min(4, cfg.frames ?? 1)), f = Math.floor((lt - cur.at) * FPS + 1e-6);
    out.changeAt = cur.at; out.dir = sign;
    if (!per || f < 0) return out;
    const n = Math.max(1, stops.length) * per;
    if (f >= n) return out;
    if (stops.length) { const s = stops[Math.floor(f / per)]; out.view = s.view; out.facing = s.facing; }
    out.inBetween = true;
    if (cfg.squash !== false) { out.sx = SQUASH; out.sy = STRETCH; }
    return out;
  };

  // In-between for a flip that comes from the layer's motion (move flip, path facing): returns a turnState-like object
  // when the flip changed within the last `frames` frames (shot time), else null. env.lt = shot time.
  T.flipTurn = (L, env, view) => {
    if (!env || !env.st || !(L.move || T.travelPath(L)) || L.turn === false || view === 'front' || view === 'back') return null;
    const per = Math.max(1, Math.min(4, (L.turn && L.turn.frames) || 1)) + 1;
    const now = env.st.flip;
    for (let k = 1; k <= per; k++) {
      const st = T.layerState(L, env.lt - k / FPS);
      if (st && st.flip !== now) return { view: k <= per - 1 ? 'front' : view, inBetween: true, sx: SQUASH, sy: STRETCH, dir: now };
    }
    return null;
  };
})();
