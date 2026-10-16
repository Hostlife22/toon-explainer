// lipsync.js — mouth shapes from a voiceover envelope. scripts/lipsync.py writes {fps, levels: "0137..."} (one digit
// 0..9 of loudness per frame); render.py inlines it as layer.lipsync.levels. Each frame maps to one of five shapes
// (rest = the expression's own mouth, ajar, mid, o, wide), held on twos and never skipping from rest straight to wide
// (the in-between shape is used for one drawing). Deterministic: a pure function of the levels and time.
// lipsync: {src | levels, fps 30, offset 0, align 'film' (envelope starts at film time 0) | 'layer', gain 1}
(function () {
  'use strict';
  const T = window.TOON;
  T.LIP_SHAPES = [null, 'ajar', 'mid', 'o', 'wide'];
  const CUTS = [0.08, 0.3, 0.55, 0.8];
  const rank = (x) => { let i = 0; while (i < CUTS.length && x >= CUTS[i]) i++; return i; };

  // Film time of the layer's start (shot start + layer at), from the running film timeline.
  function layerStart(L, env) {
    const tl = T.film && T.film.timeline, shot = env && env.shot;
    const s = tl && shot ? tl.shots.find((q) => q.id === shot.id) : null;
    return (s ? s.start : 0) + (L.at ?? 0);
  }
  const level = (lip, i) => {
    const lv = lip.levels || '';
    if (i < 0 || i >= lv.length) return 0;
    return T.clamp(((lv.charCodeAt(i) - 48) / 9) * (lip.gain ?? 1));
  };

  // Shape index 0..4 at layer time lt (0 = rest); exposed for tests and for crowd / topbean reuse.
  T.lipRank = (L, lt, env) => {
    const lip = L.lipsync;
    if (!lip || typeof lip.levels !== 'string') return 0;
    const fps = lip.fps ?? 30, base = (lip.align === 'layer' ? 0 : layerStart(L, env)) + (lip.offset ?? 0);
    const f = Math.floor((base + lt) * fps / 2 + 1e-6) * 2; // on twos
    const r = rank(Math.max(level(lip, f), level(lip, f + 1)));
    const p = rank(Math.max(level(lip, f - 2), level(lip, f - 1)));
    return Math.abs(r - p) >= 3 ? Math.round((r + p) / 2) : r; // a big jump gets the in-between shape first
  };
  T.lipMouth = (L, lt, env) => T.LIP_SHAPES[T.lipRank(L, lt, env)];
})();
