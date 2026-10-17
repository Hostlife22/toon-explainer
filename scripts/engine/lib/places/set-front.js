// set-front.js — the automatic front pass. Front pieces of the shot's backgrounds are drawn again over the actors who
// stand behind them. Sources (frontSources): every `set` background with `front: true` parts, and every background with
// a front plane (T.BG_FRONT: room, cell, antique, palace, studio) that opts in with `frontY` (the plane's ground y). A
// background is a source only while no covering background is listed after it; every background covers the earlier
// ones except a `set` with neither wall nor floor (`wall: false, floor: false`: parts only, see T.bgCovers).
// Every frame each front piece is slotted into the shot's layer order on its own, from the layers' current state (swaps,
// move, path, jumps, z, hud): before the first active layer that belongs in front of it — an fg layer, lettering or
// screen furniture, a screen-wide fx, a layer nearer than the subject plane (z > 1), or one standing lower on screen than
// the piece (ground y greater than the piece's y). Local fx (T.FX_GROUND kinds placed at a spot: dust at the judge's feet)
// count as standing at their y; `front: "over"` keeps any fx above the front pieces, `front: "depth"` slots any placed fx
// by its y. Pieces that land in the same slot draw far (smaller y) first. While an explicit {"type": "fg", "kind":
// "bg-front" | "set-front"} layer of the shot's `layers` is active, it places all the front pieces instead (in `pinned`,
// set-front draws nothing: front parts live in the world). Layer states are taken at the time core draws the layer
// (on twos); front pieces get the background's grade (target "bg") and rack-focus blur, and draw in sub-shot replays
// with that shot's camera. Loaded after camera-grammar.js, whose T.shotLayers it wraps.
(function () {
  'use strict';
  const T = window.TOON, H = T.H;
  const OVER = new Set(['fg', 'label', 'title', 'caption', 'date', 'era', 'counter', 'timer', 'doc', 'hud', 'cursor', 'subtitle', 'timeline', 'panel']);
  // fx kinds whose x / y is a spot in the world (their y is where they touch the ground): slotted by depth like actors.
  T.FX_GROUND = T.FX_GROUND || new Set();
  ['dust', 'dustkick', 'poof', 'puff', 'smoke', 'fire', 'blood', 'pool', 'spill', 'toxic-cloud'].forEach((k) => T.FX_GROUND.add(k));
  const bgsOf = (shot) => (Array.isArray(shot && shot.bg) ? shot.bg : [shot && shot.bg].filter(Boolean));
  // Whether a background hides the backgrounds listed before it (a parts-only set does not).
  T.bgCovers = (bg) => !(bg && bg.kind === 'set' && T.setCovers && !T.setCovers(bg));
  const planeOf = (bg) => (typeof bg.frontY === 'number' && T.BG_FRONT && T.BG_FRONT[bg.kind] ? bg.frontY : null);
  // Front pieces per visible background: [{bg, items: [{p: {y}, i}]}] (a plane is one item with i 'plane').
  function frontSources(shot) {
    const bgs = bgsOf(shot), out = [];
    bgs.forEach((bg, j) => {
      if (!bg || bgs.slice(j + 1).some(T.bgCovers)) return;
      const parts = T.setFrontParts(bg), y = planeOf(bg);
      if (parts.length) out.push({ bg, items: parts });
      else if (y != null) out.push({ bg, items: [{ p: { y }, i: 'plane' }], plane: true });
    });
    return out;
  }
  T.frontSources = frontSources;

  const bgGraded = (shot) => { const g = shot && shot.grade; return (Array.isArray(g) ? g : [g]).some((x) => x && typeof x === 'object' && x.target === 'bg'); };
  function paint(ctx, groups, lt, env) {
    const depth = T.BG_DEPTH;
    ctx.save(); ctx.setTransform(env.dpr || 1, 0, 0, env.dpr || 1, 0, 0); // full-frame: the planes apply the camera
    try {
      for (const { bg, items, plane } of groups) {
        T.BG_DEPTH = bg.parallax ?? null;
        if (plane) { ctx.save(); T.BG_FRONT[bg.kind](ctx, bg, lt, env); ctx.restore(); } else T.drawSetFront(ctx, bg, items, lt, env);
      }
    } finally { T.BG_DEPTH = depth; ctx.restore(); }
  }
  // Front pieces get the background's own processing: the bg-target grade and the rack-focus background blur.
  function draw(ctx, groups, lt, env) {
    if (!groups.length || !env.cam) return; // pinned and overlay layers have no world camera: front pieces live in the world
    const t = env.lt ?? lt, focus = T.focusBlur ? T.focusBlur(env.shot, t) : null, blur = focus ? focus('@bg') : 0;
    const graded = !env.noPost && T.gradeBg && bgGraded(env.shot);
    if (!graded && blur < 0.3) { paint(ctx, groups, t, env); return; }
    const w = ctx.canvas.width, h = ctx.canvas.height, d = env.dpr || 1;
    const [a, ka] = T.scratch('setfront:parts', w, h);
    ka.setTransform(1, 0, 0, 1, 0, 0); ka.clearRect(0, 0, w, h);
    paint(ka, groups, t, env);
    let src = a;
    if (graded) { // grade a copy, then keep only the pieces' own pixels
      const [b, kb] = T.scratch('setfront:graded', w, h);
      kb.setTransform(1, 0, 0, 1, 0, 0); kb.clearRect(0, 0, w, h); kb.drawImage(a, 0, 0);
      kb.save(); kb.setTransform(d, 0, 0, d, 0, 0); T.gradeBg(kb, env.shot, t, env); kb.restore();
      kb.save(); kb.setTransform(1, 0, 0, 1, 0, 0); kb.globalCompositeOperation = 'destination-in'; kb.drawImage(a, 0, 0); kb.restore();
      src = b;
    }
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (blur >= 0.3) ctx.filter = `blur(${(blur * d).toFixed(2)}px) brightness(0.96)`;
    ctx.drawImage(src, 0, 0); ctx.restore();
  }
  const setGroups = (shot) => frontSources(shot).filter((g) => !g.plane);
  // fg set-front: every set front part here; the automatic pass carries its own piece in __front.
  T.FG['set-front'] = (ctx, L, lt, env) => draw(ctx, L.__front || setGroups(env.shot), lt, env);
  const bgFront = T.FG['bg-front']; // draws every background's front plane (opted in or not)
  T.FG['bg-front'] = (ctx, L, lt, env) => { bgFront(ctx, L, lt, env); draw(ctx, setGroups(env.shot), lt, env); };

  // A layer's state at the time core draws it (on twos: the held frame), after its swaps.
  const active = (L0, lt, shot, env) => {
    if (!L0) return null;
    const L = T.effLayer(L0, lt), st = T.layerState(L, T.twosLt ? T.twosLt(L, lt, shot, env || {}) : lt);
    return st ? { L, st } : null;
  };
  // An fx stands in the world (slotted by its y) when it is a ground kind placed at a spot, or when it asks for depth.
  const placed = (L) => L.y != null || !!(L.move && L.move.length) || !!L.path || typeof L.target === 'string';
  const fxInWorld = (L) => (L.front === 'over' ? false : L.front === 'depth' ? placed(L) : T.FX_GROUND.has(L.kind) && placed(L));
  // Ground y of a layer state; a targeted ground fx (dustkick on a walker) stands where its target stands.
  const groundY = ({ L, st }, byId) => {
    const s = L.type === 'fx' && L.y == null && typeof L.target === 'string' ? byId.get(L.target) || { st } : { st };
    return (s.st.by ?? s.st.y) + (s.st.jy || 0);
  };
  const inFront = (s, y, byId) => {
    const { L } = s;
    if (L.type === 'fx' && !fxInWorld(L)) return true;
    return OVER.has(L.type) || L.hud === true || (L.hud == null && !!T.HUD_DEFAULT[L.type]) || T.layerZ(L) > 1 || groundY(s, byId) > y * H + 1e-6;
  };
  const passes = new WeakMap(); // one stable pass layer per front piece
  const passOf = (src, it) => {
    let m = passes.get(src.bg);
    if (!m) { m = new Map(); passes.set(src.bg, m); }
    if (!m.has(it.i)) m.set(it.i, Object.freeze({ type: 'fg', kind: 'set-front', enter: 'none', contact: false, __front: [{ ...src, items: [it] }] }));
    return m.get(it.i);
  };
  function withFront(shot, list, lt, env) {
    const srcs = frontSources(shot);
    if (!srcs.length) return list;
    const states = list.map((L0) => active(L0, lt, shot, env));
    if (states.some((s) => s && s.L.type === 'fg' && (s.L.kind === 'bg-front' || s.L.kind === 'set-front'))) return list;
    const byId = new Map();
    states.forEach((s) => { if (s && s.L.id != null) byId.set(s.L.id, s); });
    const slots = [];
    srcs.forEach((src, si) => src.items.forEach((it) => {
      const y = it.p.y ?? 0.78, j = states.findIndex((s) => s && inFront(s, y, byId));
      slots.push({ src, it, y, si, at: j < 0 ? list.length : j });
    }));
    slots.sort((a, b) => a.at - b.at || a.y - b.y || a.si - b.si || (a.it.i === 'plane' ? 0 : a.it.i) - (b.it.i === 'plane' ? 0 : b.it.i));
    const out = [];
    let k = 0;
    list.forEach((L, j) => { while (k < slots.length && slots[k].at === j) out.push(passOf(slots[k].src, slots[k++].it)); out.push(L); });
    while (k < slots.length) out.push(passOf(slots[k].src, slots[k++].it));
    return out;
  }
  const base = T.shotLayers;
  T.shotLayers = (shot, lt, env) => withFront(shot, base ? base(shot, lt, env) : shot.layers || [], lt, env);
})();
