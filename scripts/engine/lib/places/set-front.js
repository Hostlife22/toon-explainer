// set-front.js — the automatic front pass of a `set` background. Parts with `front: true` (the courtroom preset's
// bench) are left out of the background and drawn over the actors who stand behind them. The pass is inserted into
// the shot's layer order before the first layer that belongs in front of the part: an fg layer, lettering or screen
// furniture, a layer nearer than the subject plane (z > 1), or one standing lower on screen than the part (y greater
// than the part's y). An explicit {"type": "fg", "kind": "bg-front"} or "set-front" layer places the pass instead.
// Loaded after camera-grammar.js, whose T.shotLayers it wraps.
(function () {
  'use strict';
  const T = window.TOON;
  const OVER = new Set(['fg', 'label', 'title', 'caption', 'date', 'era', 'counter', 'timer', 'doc', 'hud', 'cursor', 'subtitle', 'timeline', 'panel']);

  // fg kind set-front (also the inserted pass): only the set backgrounds' front planes, with each bg's parallax.
  T.FG['set-front'] = (ctx, L, lt, env) => {
    const bgs = Array.isArray(env.shot && env.shot.bg) ? env.shot.bg : [env.shot && env.shot.bg].filter(Boolean);
    const depth = T.BG_DEPTH;
    ctx.save(); ctx.setTransform(env.dpr || 1, 0, 0, env.dpr || 1, 0, 0); // full-frame: the planes apply the camera
    try {
      for (const bg of bgs) {
        if (T.setFrontY(bg) == null) continue;
        T.BG_DEPTH = bg.parallax ?? null;
        T.BG_FRONT.set(ctx, bg, env.lt ?? lt, env);
      }
    } finally { T.BG_DEPTH = depth; ctx.restore(); }
  };

  const inFront = (L, y) => !!L && (OVER.has(L.type) || L.hud === true || (L.hud == null && T.HUD_DEFAULT[L.type]) ||
    T.layerZ(L) > 1 || (typeof L.y === 'number' && L.y > y + 1e-6));
  const PASS = Object.freeze({ type: 'fg', kind: 'set-front', enter: 'none', contact: false });
  const cache = new WeakMap();
  function withFront(shot, list) {
    const bgs = Array.isArray(shot.bg) ? shot.bg : [shot.bg].filter(Boolean);
    const ys = bgs.map((bg) => T.setFrontY(bg)).filter((y) => y != null);
    if (!ys.length || list.some((L) => L && L.type === 'fg' && (L.kind === 'bg-front' || L.kind === 'set-front'))) return list;
    let out = cache.get(list);
    if (!out) {
      const y = Math.min(...ys), i = list.findIndex((L) => inFront(L, y)), at = i < 0 ? list.length : i;
      out = [...list.slice(0, at), PASS, ...list.slice(at)];
      cache.set(list, out);
    }
    return out;
  }
  const base = T.shotLayers;
  T.shotLayers = (shot, lt) => withFront(shot, base ? base(shot, lt) : shot.layers || []);
})();
