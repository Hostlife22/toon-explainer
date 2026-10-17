// camera-grammar.js — shot-size grammar for the camera: `camera.frame` keys frame a target layer (bean head / body
// extents, or a layer's box) at a shot size (ecu, cu, mcu, ms, ws, ews), move between framings (eased, spring
// overshoot, whip pans), follow a moving target with a critically damped lag, synthesise rack-focus keys (`rack`) and
// over-the-shoulder shots (`ots`: the listener becomes a blurred foreground shoulder). Everything is a pure function of
// (shot, shot time). camera-moves.js adds handheld, dolly zoom, orbit, roll and low / high angles on top.
(function () {
  'use strict';
  const T = window.TOON, W = T.W, H = T.H;

  // Frame height and centre for each size. Beans: rig units above the feet (head 604..300, eyes 458, mouth 382).
  // Other layers: g = frame height as a multiple of the layer's height, gy = centre offset in layer heights.
  T.SHOT_SIZES = {
    ecu: { h: 250, cy: -440, g: 0.32, gy: -0.3 },
    cu: { h: 400, cy: -445, g: 0.55, gy: -0.25 },
    mcu: { h: 540, cy: -400, g: 0.85, gy: -0.15 },
    ms: { h: 700, cy: -340, g: 1.2, gy: -0.05 },
    ws: { h: 940, cy: -300, g: 1.7, gy: 0 },
    ews: { h: 2600, cy: -300, g: 4.5, gy: 0 },
  };
  const GROUNDED = new Set(['crowd', 'creature', 'vehicle', 'obj']); // drawn up from their anchor (feet, wheels)
  const MAX_Z = 12;

  // Bounds of a layer at shot time lt: {x, y (box centre), h, rig: {foot, k}} in world px, or null when hidden.
  T.BOUNDS = T.BOUNDS || {};
  T.BOUNDS.bean = (L, st) => ({ rig: { foot: st.y, k: ((L.size ?? 420) / 600) * Math.abs(st.s) }, x: st.x, y: st.y - 302 * ((L.size ?? 420) / 600) * Math.abs(st.s), h: 604 * ((L.size ?? 420) / 600) * Math.abs(st.s) });
  const findLayer = (shot, id) => (shot && ((shot.layers || []).find((q) => q && q.id === id) || (shot.pinned || []).find((q) => q && q.id === id))) || null;
  T.findShotLayer = findLayer;
  T.layerBounds = (shot, id, lt) => {
    const L0 = findLayer(shot, id);
    if (!L0) return null;
    const L = T.effLayer(L0, lt), st = T.layerState(L, lt);
    if (!st) return null;
    if (T.BOUNDS[L.type]) return T.BOUNDS[L.type](L, st);
    const h = (L.size ?? 300) * Math.abs(st.s);
    return { x: st.x, y: GROUNDED.has(L.type) ? st.y - h * 0.45 : st.y, h };
  };

  // ---------- frame keys ----------
  const keyCache = new WeakMap();
  T.frameKeys = (c) => {
    if (!c || !(c.frame || c.follow)) return null;
    if (keyCache.has(c)) return keyCache.get(c);
    let keys;
    if (c.frame) keys = (Array.isArray(c.frame) ? c.frame : [c.frame]).map((k) => ({ ...k }));
    else {
      const f = typeof c.follow === 'string' ? { target: c.follow } : c.follow;
      keys = [{ ...f, lag: f.lag ?? 0.3, zoom: f.zoom ?? (f.size ? undefined : 1.35) }];
    }
    keys.sort((a, b) => (a.at ?? 0) - (b.at ?? 0));
    keyCache.set(c, keys);
    return keys;
  };

  // Target point and frame height of a key at lt (no lag), or null.
  function rawFraming(k, lt, shot) {
    const S = T.SHOT_SIZES[k.size] || null;
    let x, y, fh = null;
    if (k.target) {
      const b = T.layerBounds(shot, k.target, lt);
      if (!b) return null;
      if (b.rig) {
        const s = S || T.SHOT_SIZES.ws;
        x = b.x; y = b.rig.foot + s.cy * b.rig.k; if (S) fh = s.h * b.rig.k;
      } else { x = b.x; y = b.y + (S ? S.gy * b.h : 0); if (S) fh = S.g * b.h; }
    } else if (k.box) {
      x = (k.box[0] + k.box[2] / 2) * W; y = (k.box[1] + k.box[3] / 2) * H;
      fh = S ? S.g * k.box[3] * H : Math.max(k.box[3] * H, (k.box[2] * W * H) / viewSpan()[1]) / 0.9; // width fit in the visible span
    } else if (k.point) {
      x = k.point[0] * W; y = k.point[1] * H; if (S) fh = S.g * 400;
    } else return null;
    return { x, y, fh };
  }
  // Critically damped follow: the input convolved with the spring's impulse response (mean delay = lag).
  function lagged(k, lt, shot) {
    const lag = k.lag, Tc = lag / 2, N = 24, span = lag * 5, d = span / N;
    let sx = 0, sy = 0, sw = 0, fh = null;
    for (let j = 0; j < N; j++) {
      const tau = (j + 0.5) * d, w = tau * Math.exp(-tau / Tc), r = rawFraming(k, Math.max(0, lt - tau), shot);
      if (!r) continue;
      sx += r.x * w; sy += r.y * w; sw += w; if (j === 0) fh = r.fh;
    }
    if (!sw) return rawFraming(k, lt, shot);
    const now = rawFraming(k, lt, shot);
    return { x: sx / sw, y: sy / sw, fh: now ? now.fh : fh };
  }
  // A key resolved to {z, x, y, place} (zoom without punch / jump multipliers), or null.
  function framing(k, lt, shot, baseZ) {
    const r = k.lag > 0 ? lagged(k, lt, shot) : rawFraming(k, lt, shot);
    if (!r) return null;
    const z = k.zoom ?? (r.fh ? T.clamp(H / r.fh, 1, MAX_Z) : baseZ);
    let x = r.x, y = r.y;
    if (k.axis === 'x' || k.axis === 'y') { // track one axis; the other holds where the target was at the key
      const r0 = rawFraming(k, k.at ?? 0, shot) || r;
      if (k.axis === 'x') y = r0.y; else x = r0.x;
    }
    return { z, x, y, place: k.place || autoPlace(k, shot) };
  }
  // Over-the-shoulder keys leave room for the shoulder: the speaker goes opposite the listener.
  function autoPlace(k, shot) {
    if (!k.ots) return [0.5, 0.5];
    return otsSide(k, shot) === 'right' ? [0.38, 0.52] : [0.62, 0.52];
  }
  function otsSide(k, shot) {
    const o = typeof k.ots === 'object' ? k.ots : { id: k.ots };
    if (o.side) return o.side;
    const a = findLayer(shot, k.target), b = findLayer(shot, o.id);
    return b && a && (b.x ?? 0.5) < (a.x ?? 0.5) ? 'left' : 'right';
  }

  // Step response of a spring with the given overshoot ratio that settles within about dur.
  function springStep(t, dur, os) {
    if (t <= 0) return 0;
    const L = Math.log(T.clamp(os, 0.01, 0.9)), z = -L / Math.sqrt(Math.PI * Math.PI + L * L), w = 4.6 / (z * Math.max(0.05, dur));
    if (z * w * t > 30) return 1;
    const wd = w * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + (z / Math.sqrt(1 - z * z)) * Math.sin(wd * t));
  }
  const keyProgress = (k, since) => {
    if (k.ots && k.dur == null) return 1; // a reverse shot cuts: the old speaker is already hidden behind the new shoulder
    if (k.whip) return T.ease.inOut(T.prog(since, 0, k.dur ?? 0.25));
    if (k.overshoot > 0) return springStep(since, k.dur ?? 0.6, k.overshoot);
    return T.easeBy(k.ease || 'inOut')(T.prog(since, 0, k.dur ?? 0.6));
  };

  // The framed camera centre at lt: {z, x, y, place, key} or null (before the first key).
  function frameAt(keys, out, lt, shot, zMul) {
    let i = -1;
    for (let j = 0; j < keys.length; j++) if (lt >= (keys[j].at ?? 0) - 1e-9) i = j;
    if (i < 0) return null;
    const k = keys[i], baseZ = out.z / zMul;
    const cur = framing(k, lt, shot, baseZ);
    if (!cur) return null;
    const at = k.at ?? 0;
    if (i === 0 && at <= 0) return { ...cur, key: k, p: 1 };
    const prev = i > 0 ? framing(keys[i - 1], lt, shot, baseZ) : null;
    const from = prev || { z: baseZ, x: out.fx + out.px + (viewSpan()[0] + viewSpan()[1] / 2 - out.fx) / out.z, y: out.fy + out.py + (H / 2 - out.fy) / out.z, place: [0.5, 0.5] };
    const p = keyProgress(k, lt - at);
    if (p === 1) return { ...cur, key: k, p: 1 }; // eased overshoot (outBack, outSettle...) keeps p > 1
    const lz = Math.exp(T.lerp(Math.log(from.z), Math.log(cur.z), p));
    return { z: lz, x: T.lerp(from.x, cur.x, p), y: T.lerp(from.y, cur.y, p),
      place: [T.lerp(from.place[0], cur.place[0], p), T.lerp(from.place[1], cur.place[1], p)], key: k, p };
  }

  // Applies the framing to a core camera {z, px, py, fx, fy, ...}; zMul = punch / jump multipliers on top.
  // [left, width] of the world strip the viewer sees: the whole width, or the vertical film's strip at shot.frame.
  let VIEW = null;
  function viewSpan() {
    if (VIEW) return VIEW;
    if (T.FORMAT !== 'vertical') return [0, W];
    return [W / 2 - T.STRIP_W / 2, T.STRIP_W];
  }
  const stripOf = (shot, lt) => {
    if (T.FORMAT !== 'vertical') return [0, W];
    const S = T.STRIP_W, c = T.clamp(T.num(shot && shot.frame, lt, 0.5) * W, S / 2, W - S / 2);
    return [c - S / 2, S];
  };
  T.frameStrip = stripOf;
  function solve(out, f, k, zMul) {
    const z = Math.max(1, f.z) * zMul, [a0, span] = viewSpan(), a1 = a0 + span;
    const ax = a0 + f.place[0] * span, ay = f.place[1] * H;
    let x = f.x, y = f.y;
    if (k.clamp !== false) { // never show past the world edge (subject plane) inside the visible span
      const left = (ax - a0) / z, right = (a1 - ax) / z, top = ay / z, bot = (H - ay) / z;
      x = left + right >= W ? W / 2 : T.clamp(x, left, W - right);
      y = top + bot >= H ? H / 2 : T.clamp(y, top, H - bot);
    }
    const fx = a0 + span / 2, fy = H / 2;
    return { ...out, z, fx, fy, px: x - fx - (ax - fx) / z, py: y - fy - (ay - fy) / z, framed: true };
  }
  T.frameCamera = (out, c, lt, dur, shot, zMul = 1) => {
    const keys = shot ? T.frameKeys(c) : null;
    if (!keys) return out;
    VIEW = stripOf(shot, lt);
    try { return frameCamera(out, keys, lt, shot, zMul); } finally { VIEW = null; }
  };
  function frameCamera(out, keys, lt, shot, zMul) {
    const f = frameAt(keys, out, lt, shot, zMul);
    if (!f) return out;
    let res = solve(out, f, f.key, zMul);
    const k = f.key, since = lt - (k.at ?? 0);
    if (k.whip && since >= 0 && since < (k.dur ?? 0.25)) { // screen motion of the content over the last frame
      const g = frameAt(keys, out, lt - 1 / 30, shot, zMul);
      if (g) {
        const prev = solve(out, g, g.key, zMul);
        const sx = (prev.px - res.px) * res.z, sy = (prev.py - res.py) * res.z;
        if (Math.hypot(sx, sy) > 2) res = { ...res, streak: [sx, sy] };
      }
    }
    return res;
  }
  // Shot-time world point of a layer used as a camera anchor (dolly zoom centre): its framing centre.
  T.targetPoint = (shot, id, lt, size = 'mcu') => rawFraming({ target: id, size }, lt, shot);

  // ---------- rack focus from frame keys ----------
  const focusCache = new WeakMap();
  T.focusKeysOf = (shot) => {
    if (focusCache.has(shot)) return focusCache.get(shot);
    const keys = T.frameKeys(shot.camera || null) || [];
    const rack = keys.filter((k) => k.rack && k.target).map((k) => ({ at: k.at ?? 0, on: k.target, dur: k.whip ? k.dur ?? 0.25 : k.dur ?? 0.4, px: k.rack === true ? 8 : k.rack }));
    const out = rack.length ? [...(shot.focus || []), ...rack].sort((a, b) => (a.at ?? 0) - (b.at ?? 0)) : shot.focus;
    focusCache.set(shot, out);
    return out;
  };

  // ---------- over the shoulder ----------
  const LETTERING = new Set(['label', 'title', 'caption', 'date', 'era', 'counter', 'timer', 'doc', 'subtitle', 'hud', 'cursor']);
  const otsCache = new WeakMap();
  function otsPlan(shot) {
    if (otsCache.has(shot)) return otsCache.get(shot);
    const keys = T.frameKeys(shot.camera || null) || [];
    const plan = [];
    keys.forEach((k, i) => {
      if (!k.ots) return;
      const o = typeof k.ots === 'object' ? k.ots : { id: k.ots }, who = findLayer(shot, o.id);
      if (!who) return;
      const from = k.at ?? 0, to = i + 1 < keys.length ? keys[i + 1].at ?? 0 : Infinity;
      const layer = { type: 'fg', kind: 'ots', id: '__ots' + i, who: who.who, look: who.look, side: otsSide(k, shot), tone: o.tone ?? 0.5,
        blur: o.blur ?? 5, hud: true, sharp: true, enter: 'none', at: from, exit: 'none', exitDur: 1e-4 };
      if (Number.isFinite(to)) layer.out = to - 1e-4;
      plan.push({ from, to, hide: o.id, layer });
    });
    const first = (shot.layers || []).find((L) => L && LETTERING.has(L.type)) || null; // the shoulder goes under the lettering
    const res = plan.length ? { plan, first } : null;
    otsCache.set(shot, res);
    return res;
  }
  // Vertical films: the shoulder is scaled to the visible strip and sits on its bottom edge (fg ots draws its head
  // 0.36 of the width off centre, 786 units below its origin at scale 1).
  function stripShoulder(L, shot, lt) {
    if (T.FORMAT !== 'vertical') return L;
    const [a0, span] = stripOf(shot, lt), s = span / W;
    return { ...L, x: (a0 + span / 2) / W, y: (H + 20 - 786 * s) / H, scale: s };
  }
  T.shotLayers = (shot, lt) => {
    const P = otsPlan(shot), list = shot.layers || [];
    if (!P) return list;
    const on = P.plan.filter((q) => lt >= q.from - 1e-9 && lt < q.to), hidden = new Set(on.map((q) => q.hide));
    const kept = list.filter((L) => !(L && hidden.has(L.id))), i = P.first ? kept.indexOf(P.first) : -1, at = i < 0 ? kept.length : i;
    return [...kept.slice(0, at), ...on.map((q) => stripShoulder(q.layer, shot, lt)), ...kept.slice(at)];
  };
})();
