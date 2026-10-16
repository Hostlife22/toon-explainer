// crowd.js — crowds and army rows the way the reference builds them: one design duplicated N times with phase offsets,
// back rows smaller / desaturated, optional march cycle, raised arms, or black silhouettes for audiences.
// Layer: { type:'crowd', who | who:[...], count, rows, spread, size, march, pose, expr, view, silhouette, flipAlt,
//          mode:'lineup' (diagonal overlapping faces, 40% overlap, 5% scale step), creature:'horse' (animal members) }
(function () {
  'use strict';
  const T = window.TOON;

  T.layers.crowd = (ctx, L, lt, env) => {
    const who = Array.isArray(L.who) ? L.who : [L.who];
    const count = L.count ?? 7, rows = L.rows ?? 1, spread = L.spread ?? 1400, size = L.size ?? 300;
    const r = T.rng(T.hash(L.id ?? 'crowd' + count + who.join(',') + (L.x ?? '') + (L.y ?? '')));
    // Depth tint is baked into the colours (ctx.filter per draw call is ~10x slower at 1080p).
    const COLOR_KEYS = ['skin', 'skinShade', 'robe', 'robeShade', 'sleeve', 'trim', 'sash', 'belt', 'cape', 'armor', 'hairColor', 'beardColor', 'mustacheColor', 'headColor', 'crest', 'sandal', 'legColor'];
    const tinted = (name, depth) => {
      const base = { skin: T.PAL.skin, skinShade: '#c4c1cd', robe: T.PAL.red, hairColor: T.PAL.hair, ...(env.cast[name] || {}) };
      if (!L.silhouette && depth <= 0) return null;
      const fog = L.fog ?? '#8f9a9c', look = {};
      for (const k of COLOR_KEYS) {
        const v = base[k];
        if (typeof v !== 'string' || v[0] !== '#') continue;
        look[k] = L.silhouette ? T.shade(T.mix(v, '#000000', 0.82), 0) : T.shade(T.mix(v, fog, depth * 0.3), -depth * 0.12);
      }
      return look;
    };
    const members = [];
    if (L.mode === 'lineup') { // diagonal row of big overlapping faces (Fact-Checking 5:00): back first, each 5% smaller
      const dir = L.dir ?? 1, step = size * 0.5 * 0.6;
      for (let i = 0; i < count; i++) members.push({ i, row: 0, depth: i / Math.max(1, count - 1) * 0.6, x: -dir * i * step, y: -i * size * 0.04, s: Math.pow(0.95, i), who: who[i % who.length], off: r() * 3 });
    }
    for (let i = 0; i < (L.mode === 'lineup' ? 0 : count); i++) {
      const row = i % rows, perRow = Math.ceil(count / rows), col = Math.floor(i / rows);
      const depth = rows === 1 ? 0 : row / (rows - 1); // 0 = front
      members.push({
        i, row, depth,
        x: (perRow === 1 ? 0 : (col / (perRow - 1) - 0.5) * spread) + (row % 2) * (spread / perRow / 2) + (r() - 0.5) * (L.jitter ?? 30),
        y: -depth * size * 0.32,
        s: 1 - depth * 0.22,
        who: who[i % who.length],
        off: r() * 3,
      });
    }
    members.sort((a, b) => b.depth - a.depth); // back rows first
    for (const m of members) {
      ctx.save();
      ctx.translate(m.x, m.y);
      if (L.flipAlt && m.i % 2) ctx.scale(-1, 1);
      const bean = {
        type: 'bean', who: m.who, id: (L.id ?? 'crowd' + who.join(',') + (L.x ?? '')) + m.i, size: size * m.s,
        pose: L.pose ?? (L.armsUp ? (Math.floor((lt + m.off) * 4) % 2 ? 'arms-up' : 'idle') : 'idle'), // 2 Hz cheer
        expr: L.expr ?? 'neutral', view: L.view ?? '3q', rock: L.rock ?? 1.6,
        walk: L.march ? [[0, 1e6]] : undefined, gaitRate: L.gaitRate, hold: L.hold, holdL: L.holdL,
        poseBlend: 0.07, look: tinted(m.who, m.depth) || undefined,
      };
      const tl = lt + (L.march ? (L.inStep ? 0 : m.off * 0.05) : m.off);
      if (T.PAINT && !L.silhouette && L.contact !== false) T.layerContact(ctx, { type: 'bean', size: bean.size, contact: L.contact }, null); // painted look
      if (L.creature) T.layers.creature(ctx, { type: 'creature', kind: L.creature, id: bean.id, size: size * m.s, walk: bean.walk, run: L.gallop ? [[0, 1e6]] : undefined, rider: m.who, riderHold: L.hold, color: L.color }, tl, { ...env, st: null });
      else T.layers.bean(ctx, bean, tl, { ...env, st: null });
      ctx.restore();
    }
  };
})();
