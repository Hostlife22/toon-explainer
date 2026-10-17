// set-kit.js — the modular set: bg kind `set` ({wall, floor, floorY, preset, parts: [{kind, x, y, scale, z, ...}]})
// and layer type `set` (the same parts drawn as a layer, e.g. furniture in front of the characters). Parts come from
// T.SET_PARTS (set-parts.js, set-furniture.js); presets (T.SET_PRESETS) are ready-made rooms. In the painted look
// each depth plane (parts sharing a `z`) is cached and its animated details (fire, lamps, dust, sway) draw live.
(function () {
  'use strict';
  const T = window.TOON, W = T.W, H = T.H;

  // Parts whose animation sits inside the part (later parts must cover it); the rest animate as plane overlays.
  for (const k of ['fireplace', 'table', 'desk', 'clock', 'flasks', 'curtain', 'banner']) T.SET_PARTS[k].inPlace = true;
  const partOf = (kind) => {
    const P = T.SET_PARTS[kind];
    if (!P) throw new Error(`set: unknown part "${kind}" (known: ${Object.keys(T.SET_PARTS).join(', ')})`);
    return P;
  };
  const stateOf = (p, i, env) => ({ x: (p.x ?? 0.5) * W, y: (p.y ?? 0.78) * H, s: p.scale ?? 1, seed: `${env.seed}:set:${i}:${p.kind}` });

  // Draw parts in order: static draws, then (unless o.live === false) their animated details.
  T.drawSetParts = (ctx, parts, lt, env, o = {}) => {
    const S = (p, i) => stateOf(p, (o.base ?? 0) + i, env);
    parts.forEach((p, i) => { const P = partOf(p.kind); if (o.still !== false) P.draw(ctx, p, env, S(p, i)); if (o.live !== false && P.live && P.inPlace) P.live(ctx, p, lt, env, S(p, i)); });
    if (o.live !== false) parts.forEach((p, i) => { const P = partOf(p.kind); if (P.live && !P.inPlace) P.live(ctx, p, lt, env, S(p, i)); });
  };

  const PRESETS = {
    throne: { wall: 'stone', floor: 'stone', wallColor: '#a89c88', floorY: 0.8, parts: [
      { kind: 'window', x: 0.5, y: 0.06, w: 0.12, h: 0.3, arch: true, light: true, sky: 'day', mullions: [2, 4] },
      { kind: 'column', x: 0.08, y: 0.8, h: 0.78 }, { kind: 'column', x: 0.32, y: 0.8, h: 0.78 }, { kind: 'column', x: 0.68, y: 0.8, h: 0.78 }, { kind: 'column', x: 0.92, y: 0.8, h: 0.78 },
      { kind: 'banner', x: 0.2, y: 0.08, color: '#8a1a2a', emblem: 'crown' }, { kind: 'banner', x: 0.8, y: 0.08, color: '#8a1a2a', emblem: 'crown' },
      { kind: 'lamp', x: 0.32, y: 0.4, style: 'sconce' }, { kind: 'lamp', x: 0.68, y: 0.4, style: 'sconce' },
      { kind: 'rug', x: 0.5, y: 0.93, w: 760, color: '#9a1a24', trim: '#e2b23c' },
      { kind: 'throne', x: 0.5, y: 0.82, scale: 0.75 },
    ] },
    lab: { wall: 'tile', floor: 'tile', floorY: 0.78, floorColors: ['#d8dcd4', '#7a8a84'], parts: [
      { kind: 'pipes', rows: [0.1, 0.17], drops: [0.06, 0.94] },
      { kind: 'window', x: 0.5, y: 0.12, w: 0.16, h: 0.3, light: true, sky: 'overcast', mullions: [3, 3] },
      { kind: 'shelf', x: 0.18, y: 0.78, items: ['jars', 'books', 'jars', 'scrolls'], color: '#5a4a3a' },
      { kind: 'cabinet', x: 0.33, y: 0.78, color: '#8a9488', drawers: 3 },
      { kind: 'clock', x: 0.66, y: 0.78, scale: 0.8 },
      { kind: 'flasks', x: 0.8, y: 0.86, scale: 1.0 },
      { kind: 'lamp', x: 0.4, y: 0.26, style: 'hanging', shade: '#4a6a5a' },
    ] },
    courtroom: { wall: 'wood', floor: 'wood', wallColor: '#7a4a2a', floorY: 0.76, parts: [
      { kind: 'window', x: 0.2, y: 0.08, w: 0.1, h: 0.36, arch: true, light: true, mullions: [2, 4] },
      { kind: 'window', x: 0.8, y: 0.08, w: 0.1, h: 0.36, arch: true, light: true, mullions: [2, 4] },
      { kind: 'column', x: 0.06, y: 0.76, h: 0.74, color: '#8a5a36' }, { kind: 'column', x: 0.94, y: 0.76, h: 0.74, color: '#8a5a36' },
      { kind: 'painting', x: 0.5, y: 0.08, w: 0.1, h: 0.18, subject: 'portrait' },
      { kind: 'banner', x: 0.36, y: 0.06, color: '#2a3a7a', emblem: 'star', h: 0.34 }, { kind: 'banner', x: 0.64, y: 0.06, color: '#2a3a7a', emblem: 'star', h: 0.34 },
      { kind: 'desk', x: 0.5, y: 0.8, w: 640, scale: 1.25, color: '#5a3018', items: ['books', 'papers', 'inkwell'], front: true },
      { kind: 'bench', x: 0.18, y: 0.98, w: 520, z: 1.05 }, { kind: 'bench', x: 0.82, y: 0.98, w: 520, z: 1.05 },
    ] },
    library: { wall: 'wood', floor: 'carpet', wallColor: '#6a4024', floorColor: '#5a2a2a', floorY: 0.8, parts: [
      { kind: 'shelf', x: 0.09, y: 0.8, scale: 1.25, w: 260, items: ['books', 'books', 'mixed', 'books'] },
      { kind: 'shelf', x: 0.26, y: 0.8, scale: 1.25, w: 260, items: ['books', 'scrolls', 'books', 'books'] },
      { kind: 'window', x: 0.5, y: 0.08, w: 0.13, h: 0.38, arch: true, light: true, sky: 'dusk', mullions: [2, 4] },
      { kind: 'shelf', x: 0.74, y: 0.8, scale: 1.25, w: 260, items: ['books', 'books', 'jars', 'books'] },
      { kind: 'shelf', x: 0.91, y: 0.8, scale: 1.25, w: 260, items: ['mixed', 'books', 'books', 'scrolls'] },
      { kind: 'rug', x: 0.5, y: 0.92, w: 900, color: '#2a4a3a' },
      { kind: 'globe', x: 0.62, y: 0.86, scale: 0.9 },
      { kind: 'table', x: 0.38, y: 0.9, items: ['books', 'candle', 'papers'] },
    ] },
    tavern: { wall: 'wood', floor: 'wood', wallColor: '#7a4e2e', floorY: 0.78, dark: 0.3, parts: [
      { kind: 'roof', y: 0.1, count: 6 },
      { kind: 'shelf', x: 0.24, y: 0.7, w: 360, h: 300, items: ['jars', 'jars'], rows: 2 },
      { kind: 'fireplace', x: 0.78, y: 0.78, material: 'brick', color: '#8a4a32' },
      { kind: 'lamp', x: 0.5, y: 0.32, style: 'sconce' },
      { kind: 'crates', x: 0.1, y: 0.86, scale: 0.8 },
      { kind: 'table', x: 0.46, y: 0.92, w: 420, items: ['jug', 'candle', 'bottle'] },
    ] },
    study: { wall: 'wallpaper', floor: 'wood', wallColor: '#7a6a48', floorY: 0.78, parts: [
      { kind: 'shelf', x: 0.13, y: 0.78, scale: 1.1, items: ['books', 'mixed', 'books', 'books'] },
      { kind: 'painting', x: 0.36, y: 0.14, w: 0.11, h: 0.16, subject: 'sea' },
      { kind: 'window', x: 0.78, y: 0.12, w: 0.13, h: 0.34, light: true, sky: 'sunset', mullions: [2, 3] },
      { kind: 'curtain', x: 0.78, y: 0.08, w: 0.2, y1: 0.66, color: '#6a2a2a' },
      { kind: 'clock', x: 0.95, y: 0.78, scale: 0.9 },
      { kind: 'rug', x: 0.52, y: 0.92, w: 760 },
      { kind: 'plant', x: 0.62, y: 0.79, scale: 0.9 },
      { kind: 'desk', x: 0.48, y: 0.9, items: ['lamp', 'papers', 'inkwell'] },
    ] },
    office: { wall: 'plaster', floor: 'carpet', wallColor: '#cdbb98', floorColor: '#6a2a22', floorY: 0.78, parts: [
      { kind: 'cabinet', x: 0.08, y: 0.78 }, { kind: 'shelf', x: 0.22, y: 0.78, items: ['books', 'books', 'mixed', 'books'] },
      { kind: 'painting', x: 0.44, y: 0.16, w: 0.1, h: 0.14, subject: 'landscape' },
      { kind: 'window', x: 0.72, y: 0.12, w: 0.15, h: 0.36, light: true, mullions: [3, 4] },
      { kind: 'plant', x: 0.92, y: 0.8 }, { kind: 'lamp', x: 0.4, y: 0.24, style: 'hanging' },
      { kind: 'desk', x: 0.52, y: 0.92, items: ['papers', 'lamp', 'books'] },
    ] },
  };
  T.SET_PRESETS = PRESETS;

  // Resolve a set background (preset + overrides) into planes [{z, parts}] sorted far to near. Parts with `front: true`
  // go to separate front planes drawn over the actors (set-front.js puts that pass into the layer order).
  const toPlanes = (items, z0) => {
    const planes = new Map();
    items.forEach((it) => { const z = it.p.z ?? z0; if (!planes.has(z)) planes.set(z, []); planes.get(z).push(it); });
    return [...planes.entries()].sort((a, b) => a[0] - b[0]);
  };
  function resolve(bg) {
    const pre = bg.preset != null ? PRESETS[bg.preset] : {};
    if (!pre) throw new Error(`bg set: unknown preset "${bg.preset}" (known: ${Object.keys(PRESETS).join(', ')})`);
    const d = { ...pre, ...bg }, fy = d.floorY ?? 0.78, z0 = d.z ?? 0.9;
    const base = [];
    if (d.wall !== false) base.push({ kind: 'wall', material: d.wall ?? 'plaster', color: d.wallColor, trim: d.trim, y: fy });
    if (d.floor !== false) base.push({ kind: 'floor', material: d.floor ?? 'wood', color: d.floorColor, colors: d.floorColors, y: fy });
    const items = [...base, ...(pre.parts || []), ...(bg.parts || [])].map((p, i) => ({ p, i }));
    const back = items.filter(({ p }) => !p.front), front = items.filter(({ p }) => p.front);
    const frontY = front.length ? Math.min(...front.map(({ p }) => p.y ?? 0.78)) : null;
    return { fy, dark: T.clamp(d.dark ?? 0), planes: toPlanes(back, z0), front: toPlanes(front, z0), frontY };
  }
  const resolved = new WeakMap();
  const resolvedOf = (bg) => { let R = resolved.get(bg); if (!R) { R = resolve(bg); resolved.set(bg, R); } return R; };
  // Draw resolved planes. A plane is split into runs after each part whose animation belongs between it and the parts
  // drawn later (fire, candles, pendulum, cloth): run = cached statics, then that run's in-place animation. Light
  // effects (window shafts, lamp pools, steam) are overlays drawn once over the whole plane.
  function drawPlanes(ctx, bg, planes, lt, env, R, tag) {
    const e = { ...env, setFloorY: R.fy * H };
    planes.forEach(([z, list], gi) => {
      const runs = [[]];
      list.forEach((it, j) => { runs[runs.length - 1].push(it); if (T.SET_PARTS[it.p.kind].inPlace && j < list.length - 1) runs.push([]); });
      const live = (g, items, inPlace) => items.forEach(({ p, i }) => { const P = T.SET_PARTS[p.kind]; if (P.live && !!P.inPlace === inPlace) P.live(g, p, lt, e, stateOf(p, i, e)); });
      runs.forEach((run, ri) => {
        // dark: the room's ambient level (0..1), baked over the static parts so lamps and fire glow against it
        T.plane(ctx, env, { f: z, key: `${tag}|${env.seed}|${T.bgKey(bg)}|${gi}.${ri}`, haze: R.dark, hazeColor: '#120a16' }, (g) => run.forEach(({ p, i }) => T.SET_PARTS[p.kind].draw(g, p, e, stateOf(p, i, e))));
        if (run.some(({ p }) => T.SET_PARTS[p.kind].live && T.SET_PARTS[p.kind].inPlace)) T.plane(ctx, env, { f: z, live: true }, (g) => live(g, run, true));
      });
      if (list.some(({ p }) => T.SET_PARTS[p.kind].live && !T.SET_PARTS[p.kind].inPlace)) T.plane(ctx, env, { f: z, live: true }, (g) => live(g, list, false));
    });
  }
  // Front parts of a set background: the smallest `y` among them (null = none) and their drawing, used by the fg kind
  // bg-front and by the automatic front pass (set-front.js). Full-frame context: each plane applies its own camera.
  T.setFrontY = (bg) => (bg && bg.kind === 'set' ? resolvedOf(bg).frontY : null);
  T.BG_FRONT.set = (ctx, bg, lt, env) => { const R = resolvedOf(bg); if (R.front.length) drawPlanes(ctx, bg, R.front, lt, env, R, 'setfront'); };
  T.bgs.set = (ctx, bg, lt, env) => {
    const R = resolvedOf(bg);
    drawPlanes(ctx, bg, R.planes, lt, env, R, 'set');
    if (bg.vignette !== 0) { // corners of the room fall into shadow
      const g = ctx.createRadialGradient(W / 2, H * 0.45, H * 0.35, W / 2, H * 0.45, W * 0.75);
      g.addColorStop(0, 'rgba(20,10,6,0)'); g.addColorStop(1, `rgba(20,10,6,${(bg.vignette ?? 0.35).toFixed(3)})`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
  };

  // Layer: the same parts as world-positioned set dressing (the layer's x/y/scale/rot pivot around its anchor).
  T.layers.set = (ctx, L, lt, env) => {
    const pre = L.preset != null ? PRESETS[L.preset] : null;
    if (L.preset != null && !pre) throw new Error(`set layer: unknown preset "${L.preset}"`);
    const parts = [...((pre && pre.parts) || []), ...(L.parts || [])];
    ctx.translate(-(L.x ?? 0.5) * W, -(L.y ?? 0.5) * H); // undo the resting anchor only: move, bob and entrances still apply
    T.drawSetParts(ctx, parts, lt, { ...env, setFloorY: (L.floorY ?? 0.78) * H });
  };
  T.DEFAULT_ENTER.set = 'none';
})();
