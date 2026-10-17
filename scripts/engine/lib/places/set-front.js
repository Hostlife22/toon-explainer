// set-front.js — the front pass of a `set` background. Parts with `front: true` (the courtroom preset's bench) are
// left out of the background and drawn over the actors who stand behind them. Every frame each front part is slotted
// into the shot's layer order on its own, from the layers' current state (swaps, move, path, jumps, z, hud): before
// the first active layer that belongs in front of it — an fg layer, lettering or screen furniture, a layer nearer than
// the subject plane (z > 1), or one standing lower on screen than the part (ground y greater than the part's y). Parts
// that land in the same slot draw far (smaller y) first. Only the topmost background contributes front parts, and only
// when it is a set (a background listed after the set would cover the room). While an explicit {"type": "fg", "kind":
// "bg-front" | "set-front"} layer of the shot's `layers` is active, it places all the front parts instead (in `pinned`,
// set-front draws nothing: front parts live in the world). Loaded after camera-grammar.js, whose T.shotLayers it wraps.
(function () {
  'use strict';
  const T = window.TOON, H = T.H;
  const OVER = new Set(['fg', 'label', 'title', 'caption', 'date', 'era', 'counter', 'timer', 'doc', 'hud', 'cursor', 'subtitle', 'timeline', 'panel']);
  const bgsOf = (shot) => (Array.isArray(shot && shot.bg) ? shot.bg : [shot && shot.bg].filter(Boolean));
  // The background whose front parts draw: the last one, when it is a set with front parts.
  const frontBg = (shot) => { const bgs = bgsOf(shot), bg = bgs[bgs.length - 1]; return bg && T.setFrontParts(bg).length ? bg : null; };

  function draw(ctx, items, lt, env) {
    const bg = frontBg(env.outerShot ? null : env.shot);
    if (!bg || !env.cam) return; // pinned / overlay contexts have no world camera
    const depth = T.BG_DEPTH;
    ctx.save(); ctx.setTransform(env.dpr || 1, 0, 0, env.dpr || 1, 0, 0); // full-frame: the planes apply the camera
    try { T.BG_DEPTH = bg.parallax ?? null; T.drawSetFront(ctx, bg, items || T.setFrontParts(bg), env.lt ?? lt, env); }
    finally { T.BG_DEPTH = depth; ctx.restore(); }
  }
  // fg set-front: all front parts here; the automatic pass carries its own parts in __parts.
  T.FG['set-front'] = (ctx, L, lt, env) => draw(ctx, L.__parts, lt, env);
  const bgFront = T.FG['bg-front'];
  T.FG['bg-front'] = (ctx, L, lt, env) => { bgFront(ctx, L, lt, env); draw(ctx, null, lt, env); };

  const active = (L0, lt) => { if (!L0) return null; const L = T.effLayer(L0, lt), st = T.layerState(L, lt); return st ? { L, st } : null; };
  const inFront = ({ L, st }, y) => OVER.has(L.type) || L.hud === true || (L.hud == null && !!T.HUD_DEFAULT[L.type]) ||
    T.layerZ(L) > 1 || (st.by ?? st.y) + (st.jy || 0) > y * H + 1e-6;
  const passes = new WeakMap(); // one stable pass layer per front part
  const passOf = (bg, it) => {
    let m = passes.get(bg);
    if (!m) { m = new Map(); passes.set(bg, m); }
    if (!m.has(it.i)) m.set(it.i, Object.freeze({ type: 'fg', kind: 'set-front', enter: 'none', contact: false, __parts: [it] }));
    return m.get(it.i);
  };
  function withFront(shot, list, lt) {
    const bg = frontBg(shot);
    if (!bg) return list;
    const states = list.map((L0) => active(L0, lt));
    if (states.some((s) => s && s.L.type === 'fg' && (s.L.kind === 'bg-front' || s.L.kind === 'set-front'))) return list;
    const slots = T.setFrontParts(bg).map((it) => {
      const y = it.p.y ?? 0.78, j = states.findIndex((s) => s && inFront(s, y));
      return { it, y, at: j < 0 ? list.length : j };
    }).sort((a, b) => a.at - b.at || a.y - b.y || a.it.i - b.it.i);
    const out = [];
    let k = 0;
    list.forEach((L, j) => { while (k < slots.length && slots[k].at === j) out.push(passOf(bg, slots[k++].it)); out.push(L); });
    while (k < slots.length) out.push(passOf(bg, slots[k++].it));
    return out;
  }
  const base = T.shotLayers;
  T.shotLayers = (shot, lt) => withFront(shot, base ? base(shot, lt) : shot.layers || [], lt);
})();
