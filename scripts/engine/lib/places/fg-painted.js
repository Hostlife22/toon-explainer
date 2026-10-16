// fg-painted.js — painted foreground framing (fg layer kinds): `foliage` (leaf clusters and hanging boughs in the
// corners, swaying), `column` (a huge cropped column at one edge), `window-frame` (looking out through a window:
// textured wall, deep reveal, open shutters, sill with a pot) and `silhouettes` (backs of heads and shoulders along
// the bottom edge, rim-lit). Same contract as scenery.js: full-frame coordinates centred on the layer origin.
(function () {
  'use strict';
  const T = window.TOON, W = T.W, H = T.H, TAU = Math.PI * 2, OV = 300;
  const INK = '#3a281c', rgba = T.rgba;
  const ol = (ctx, path, fill, line = 4, o = {}) => T.outlined(ctx, path, fill, { line, ink: INK, ...o });

  // Canopy hugging a top corner: a dense mass in the corner tapering along the top edge, a bough and hanging sprigs.
  function bough(ctx, x, y, dir, len, leaf, seed) {
    const r = T.rng(T.hash(seed));
    ctx.strokeStyle = INK; ctx.lineWidth = 22; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y + 140); ctx.quadraticCurveTo(x + dir * len * 0.45, y + 170, x + dir * len * 0.85, y + 90); ctx.stroke();
    ctx.strokeStyle = '#4a3424'; ctx.lineWidth = 14; ctx.stroke();
    for (const t of [0.45, 0.72]) { const sx = x + dir * len * t, sy = y + 150; ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(sx + dir * 20, sy + 80, sx + dir * 6, sy + 170); ctx.stroke(); for (let j = 0; j < 4; j++) T.leafCluster(ctx, sx + dir * (8 + (j % 2) * 18), sy + 60 + j * 36, 30, 22, seed + 'sp' + t + j, j % 2 ? leaf : T.shade(leaf, 0.1), 3); }
    for (let i = 0; i < 11; i++) {
      const t = i / 10, cx = x + dir * (len * t + (r() - 0.5) * 40), cy = y + 70 + (1 - t) * 120 + Math.sin(t * 7) * 24 + r() * 30, rx = (230 - t * 140) * (0.85 + r() * 0.3);
      T.leafCluster(ctx, cx, cy, rx, rx * 0.72, seed + i, i % 3 === 0 ? T.shade(leaf, -0.06) : i % 3 === 1 ? leaf : T.shade(leaf, 0.08), 6);
    }
  }
  // Visible frame edges in the layer's local x (vertical films show a strip of the world).
  const span = (L, env) => { const [lo, vw] = T.visibleSpan(env), ox = (L.x ?? 0.5) * W; return { l: lo - ox, r: lo + vw - ox, w: vw }; };
  const FGP = {
    foliage(ctx, L, lt, env) {
      const leaf = L.color ?? '#3a5a26', sides = L.sides ?? ['tl', 'tr', 'bl'], S = span(L, env), SW = S.w;
      for (const side of sides) {
        const dx = side.includes('l') ? -1 : 1, top = side.includes('t'), x = dx < 0 ? S.l - 40 : S.r + 40, y = top ? -H / 2 - 40 : H / 2 + 40;
        const a = T.sway(lt, (L.id ?? 'fol') + side, 0.3, 1.6 * T.DEG);
        ctx.save(); ctx.translate(x, y); ctx.rotate(a * (top ? 1 : -0.6));
        const box = top ? [-SW * 0.45 * (dx > 0 ? 1 : 0) - 200, -200, SW * 0.45 + 400, 760] : [-W * 0.4 * (dx > 0 ? 1 : 0) - 200, -700, W * 0.4 + 400, 900];
        T.drawSprite(ctx, env, `fol|${L.id ?? ''}|${side}|${leaf}|${SW}`, box, (g) => {
          if (top) bough(g, 0, 0, -dx, SW * 0.42, leaf, (L.id ?? 'fol') + side);
          else for (let i = 0; i < 4; i++) T.leafCluster(g, -dx * (60 + i * 150), -60 - (i % 2) * 90 - i * 30, 200 - i * 26, 150 - i * 18, (L.id ?? 'fol') + side + i, i % 2 ? leaf : T.shade(leaf, 0.08), 7);
        });
        ctx.restore();
      }
    },
    column(ctx, L, lt, env) {
      const S = span(L, env), d = (L.side ?? 'left') === 'left' ? -1 : 1, x = d < 0 ? S.l + (L.inset ?? 60) : S.r - (L.inset ?? 60), w = L.width ?? (S.w < W ? 200 : 300);
      T.drawColumn(ctx, x, H / 2 + 120, H + 500, w, T.mix(L.color ?? '#d8cfbc', '#2a2030', L.tone ?? 0.25)); // nearer than the light: a darker tone
    },
    'window-frame'(ctx, L, lt, env) {
      const S = span(L, env), hole = L.hole ?? [0.2, 0.12, 0.6, 0.62], x = S.l + hole[0] * S.w, y = -H / 2 + hole[1] * H, w = hole[2] * S.w, h = hole[3] * H, wall = L.wall ?? '#cdbb98', fr = L.frame ?? '#6a4428', depth = L.depth ?? 46;
      const outer = (k) => { k.rect(S.l - OV, -H / 2 - OV, S.w + OV * 2, H + OV * 2); k.rect(x + w, y, -w, h); };
      ctx.save(); ctx.beginPath(); outer(ctx); ctx.fillStyle = wall; ctx.fill('evenodd');
      ctx.clip('evenodd'); if (T.PAINT) T.fillTexture(ctx, null, 'plaster', { rect: [S.l - OV, -H / 2 - OV, S.w + OV * 2, H + OV * 2], alpha: 0.6 });
      const cx = S.l + S.w / 2, g = ctx.createRadialGradient(cx, 0, Math.min(w, h) * 0.5, cx, 0, Math.max(S.w, H) * 0.8); g.addColorStop(0, rgba('#140a06', 0)); g.addColorStop(1, rgba('#140a06', 0.45)); ctx.fillStyle = g; ctx.fillRect(S.l - OV, -H / 2 - OV, S.w + OV * 2, H + OV * 2);
      ctx.restore();
      ol(ctx, (k) => { k.moveTo(x - depth, y - depth); k.lineTo(x, y); k.lineTo(x, y + h); k.lineTo(x - depth, y + h + depth); k.closePath(); }, T.shade(wall, -0.25), 4);
      ol(ctx, (k) => { k.moveTo(x - depth, y - depth); k.lineTo(x + w + depth, y - depth); k.lineTo(x + w, y); k.lineTo(x, y); k.closePath(); }, T.shade(wall, -0.35), 4);
      ol(ctx, (k) => { k.moveTo(x + w + depth, y - depth); k.lineTo(x + w, y); k.lineTo(x + w, y + h); k.lineTo(x + w + depth, y + h + depth); k.closePath(); }, T.shade(wall, -0.1), 4);
      T.texBox(ctx, x - depth - 30, y + h, w + depth * 2 + 60, depth + 30, T.shade(wall, 0.08), 'stone', { line: 5, alpha: 0.3 });
      ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.strokeRect(x, y, w, h);
      if (L.shutters !== false) for (const d of [-1, 1]) {
        const sx = d < 0 ? x - depth - w * 0.26 : x + w + depth, sw = w * 0.26, sway = Math.sin(lt * 0.9 + d) * 2;
        T.texBox(ctx, sx, y - depth + sway, sw, h + depth, L.shutter ?? '#3a6a4a', 'wood', { line: 5, rot: 90, detail: (k) => { k.strokeStyle = rgba(INK, 0.5); k.lineWidth = 3; for (let yy = y; yy < y + h; yy += 22) { k.beginPath(); k.moveTo(sx + 12, yy); k.lineTo(sx + sw - 12, yy + 8); k.stroke(); } } });
      }
      if (L.pot !== false) { const px = x + w * 0.82, py = y + h; ol(ctx, (k) => { k.moveTo(px - 50, py - 70); k.lineTo(px + 50, py - 70); k.lineTo(px + 36, py); k.lineTo(px - 36, py); k.closePath(); }, '#b8603a', 4); for (let i = 0; i < 5; i++) T.leafCluster(ctx, px + (i - 2) * 26, py - 100 - (i % 2) * 24, 34, 26, 'pot' + i, '#4a7a3a', 3); for (let i = 0; i < 3; i++) ol(ctx, (k) => k.arc(px - 30 + i * 30, py - 120 - (i % 2) * 20, 12, 0, TAU), '#e84a5a', 3); }
    },
    // Backs of an audience (heads from the character rig in back view, darkened), bobbing slightly.
    silhouettes(ctx, L, lt, env) {
      const S = span(L, env);
      const n = L.count ?? 3, dark = L.tone ?? 0.55, r = T.rng(T.hash(L.id ?? 'sil')), who = L.who ? [].concat(L.who) : [];
      const HAIR = ['short', 'long', 'curly', 'bun', 'bald'], HC = ['#3a2a1e', '#5a3a22', '#2a2220', '#7a5a3a', '#4a3a30'], ROBE = ['#4a5a7a', '#6a3a3a', '#3a5a4a', '#5a4a6a'];
      for (let i = 0; i < n; i++) {
        const x = S.l + ((i + 0.5) / n) * S.w + (r() - 0.5) * Math.min(140, S.w * 0.07), s = (L.size ?? 1) * (1.05 + r() * 0.3), y = H / 2 - 150 * s + Math.sin(lt * 1.3 + i * 2) * 5;
        const base = { hair: HAIR[i % 5], hairColor: HC[(i * 3) % 5], robe: ROBE[i % 4], ...((who[i] && env.cast[who[i]]) || {}), ...(L.look || {}) };
        const c = { ...base, skin: T.shade(base.skin ?? T.PAL.skin, -dark), skinShade: T.shade('#c4c1cd', -dark), hairColor: T.shade(base.hairColor ?? T.PAL.hair, -dark * 0.7) };
        ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
        T.outlined(ctx, (k) => { k.moveTo(-250, 420); k.quadraticCurveTo(-230, 70, 0, 50); k.quadraticCurveTo(230, 70, 250, 420); k.closePath(); }, T.shade(c.robe ?? T.PAL.red, -dark), { line: 8 });
        ctx.translate(0, 450); T.BEAN_HEAD.draw(ctx, c, { view: 'back', expr: 'neutral', lt, seed: 'sil' + i });
        ctx.restore();
      }
    },
  };
  Object.assign(T.FG, FGP);
})();
