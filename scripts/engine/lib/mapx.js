// mapx.js — map v3: parchment or flat "atlas" style, extruded land, regions that grow / recolor / get conquered /
// whiteout-annexed / fade out, halftone neutral land, living regions (faces, accessories, weapon arms), labels with
// strike-and-rename. Overlays (fronts, tokens, cities, crosses, punch, rivers, pencil, wall, routes, pins, armies,
// year label) are drawn by mapx2.js through T.MAP_OVERLAYS. Coordinates are normalized to the map box.
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL, W = T.W, H = T.H;
  T.DEFAULT_ENTER.map = 'none';
  const STYLE = {
    parchment: { sea: P.sea, coast: 'rgba(200,220,245,0.85)', land: P.land, landInk: '#8a5a20', extrude: 7, border: 6, waves: 26 },
    atlas: { sea: '#5b72d6', coast: '#9db0ef', land: '#d4bd7a', landInk: '#3a2a1a', extrude: 3, border: 5, waves: 0, dots: true },
  };
  const twos = (lt) => Math.floor(lt * 15) / 15;

  let dotTile = null;
  T.mapDots = (ctx, color = 'rgba(90,60,20,0.28)', step = 14) => {
    if (!dotTile) { dotTile = document.createElement('canvas'); dotTile.width = dotTile.height = step; }
    const g = dotTile.getContext('2d');
    g.clearRect(0, 0, step, step); g.fillStyle = color; g.beginPath(); g.arc(step / 2, step / 2, step * 0.18, 0, Math.PI * 2); g.fill();
    return ctx.createPattern(dotTile, 'repeat');
  };
  const centroid = (pts) => [pts.reduce((a, q) => a + q[0], 0) / pts.length, pts.reduce((a, q) => a + q[1], 0) / pts.length];
  const bbox = (pts) => { const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]); return { w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) }; };
  T.mapGeom = { centroid, bbox };

  // ---------- region face: { mood, at, accessory:'sunglasses'|'crown'|'tear'|'bandage' } ----------
  function regionFace(ctx, cx, cy, s, F, lt) {
    const q = T.ease.outBack(T.prog(lt, F.at ?? 0, 0.25));
    if (q <= 0) return;
    const mood = T.timed(F.mood ?? 'neutral', lt).cur;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(q * s / 100, q * s / 100);
    ctx.strokeStyle = P.ink; ctx.fillStyle = P.ink; ctx.lineWidth = 12; ctx.lineCap = 'round';
    const blink = (lt + cx * 0.01) % 3.3 < 0.1;
    for (const d of [-1, 1]) {
      const ex = d * 42;
      if (blink || mood === 'sleepy') { ctx.beginPath(); ctx.moveTo(ex - 16, 0); ctx.lineTo(ex + 16, 0); ctx.stroke(); }
      else if (mood === 'happy') { ctx.beginPath(); ctx.moveTo(ex - 18, 6); ctx.quadraticCurveTo(ex, -22, ex + 18, 6); ctx.stroke(); }
      else if (mood === 'strain') { ctx.beginPath(); ctx.moveTo(ex - d * 16, -14); ctx.lineTo(ex + d * 12, 0); ctx.lineTo(ex - d * 16, 14); ctx.stroke(); }
      else if (mood === 'shock') { T.outlined(ctx, (k) => k.arc(ex, 0, 20, 0, Math.PI * 2), '#fff', { line: 7 }); ctx.fillStyle = P.ink; ctx.beginPath(); ctx.arc(ex, 0, 6, 0, Math.PI * 2); ctx.fill(); }
      else { ctx.beginPath(); ctx.ellipse(ex, 0, 9, 15, 0, 0, Math.PI * 2); ctx.fill(); }
      if (mood === 'angry') { ctx.beginPath(); ctx.moveTo(ex - d * 22, -38); ctx.lineTo(ex + d * 22, -24); ctx.stroke(); }
      if (mood === 'sad' || mood === 'cry' || mood === 'worried') { ctx.beginPath(); ctx.moveTo(ex - d * 22, -24); ctx.lineTo(ex + d * 22, -38); ctx.stroke(); }
    }
    ctx.beginPath();
    if (mood === 'happy') { ctx.moveTo(-26, 34); ctx.quadraticCurveTo(0, 62, 26, 34); }
    else if (mood === 'angry' || mood === 'sad' || mood === 'cry' || mood === 'worried') { ctx.moveTo(-24, 54); ctx.quadraticCurveTo(0, 34, 24, 54); }
    else if (mood === 'shock') { ctx.ellipse(0, 46, 12, 16, 0, 0, Math.PI * 2); }
    else if (mood === 'smug') { ctx.moveTo(-20, 44); ctx.quadraticCurveTo(10, 54, 30, 34); }
    else { ctx.moveTo(-18, 44); ctx.lineTo(18, 44); }
    ctx.stroke();
    const acc = F.accessory;
    if (acc === 'sunglasses') { ctx.fillStyle = '#111'; for (const d of [-1, 1]) { ctx.beginPath(); T.rrect(ctx, d * 42 - 30, -18, 60, 34, 12); ctx.fill(); } ctx.fillRect(-14, -8, 28, 8); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(-60, -12, 16, 6); }
    if (acc === 'crown') { ctx.save(); ctx.translate(0, -70); ctx.scale(0.5, 0.5); T.outlined(ctx, (k) => { k.moveTo(-90, 40); k.lineTo(-110, -50); k.lineTo(-50, -5); k.lineTo(0, -70); k.lineTo(50, -5); k.lineTo(110, -50); k.lineTo(90, 40); k.closePath(); }, P.gold, { line: 12 }); ctx.restore(); }
    if (acc === 'tear' || mood === 'cry') { const f = (lt * 1.2) % 1; ctx.fillStyle = '#7fd0f0'; ctx.beginPath(); ctx.ellipse(-42, 24 + f * 50, 8, 12, 0, 0, Math.PI * 2); ctx.fill(); }
    if (acc === 'bandage') { ctx.save(); ctx.rotate(-0.5); T.outlined(ctx, (k) => T.rrect(k, -70, -60, 140, 34, 10), '#f2c9a0', { line: 6 }); ctx.restore(); }
    ctx.restore();
  }

  // ---------- region arms holding a weapon, swinging on twos: { weapon:'sword'|'spear'|'torch'|null, swing } ----------
  function regionArms(ctx, cx, cy, bw, col, A, lt) {
    const q = T.ease.outBack(T.prog(lt, A.at ?? 0, 0.25));
    if (q <= 0) return;
    for (const d of A.sides ?? [-1, 1]) {
      const sx = cx + d * bw * 0.42, sy = cy + 10, ang = (d * 50 + (A.swing === false ? 0 : Math.sin(twos(lt) * 9 + d) * 25)) * T.DEG;
      const hx = sx + Math.sin(ang) * 90 * q * d, hy = sy - Math.cos(ang) * 90 * q;
      ctx.lineCap = 'round';
      ctx.strokeStyle = P.ink; ctx.lineWidth = 34; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(hx, hy); ctx.stroke();
      ctx.strokeStyle = col; ctx.lineWidth = 22; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(hx, hy); ctx.stroke();
      if (A.weapon && T.PROPS[A.weapon]) { ctx.save(); ctx.translate(hx, hy); ctx.rotate(ang * d * 0.6); T.drawProp(ctx, A.weapon, A.size ?? 130, lt, {}); ctx.restore(); }
      T.outlined(ctx, (k) => k.arc(hx, hy, 18, 0, Math.PI * 2), '#fff', { line: 6 });
    }
  }

  function regionLabel(ctx, cx, cy, R, lt) {
    const lab = typeof R.label === 'string' ? { text: R.label } : R.label;
    const sl = R.strikeLabel;
    const size = lab?.size ?? R.labelSize ?? 46, dy = lab?.dy ?? (R.face ? -size * 1.9 : 0);
    if (lab && !sl) {
      const q = T.ease.outBack(T.prog(lt, lab.at ?? R.at ?? 0, 0.25));
      if (q > 0) { ctx.save(); ctx.translate(cx, cy + dy); ctx.rotate((lab.tilt ?? 0) * T.DEG); ctx.scale(q, q); T.toonText(ctx, lab.text, 0, 0, { size, fill: lab.color ?? '#fff' }); ctx.restore(); }
    }
    if (sl) {
      const at = sl.at ?? 1;
      T.toonText(ctx, sl.old, cx, cy + dy, { size, fill: '#fff' });
      const p = T.ease.out(T.prog(lt, at, 0.2));
      if (p > 0) {
        const w = T.measure(ctx, sl.old, size);
        ctx.strokeStyle = '#d0312d'; ctx.lineWidth = size * 0.16; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(cx - w / 2 - 10, cy + dy - size * 0.32); ctx.lineTo(cx - w / 2 - 10 + (w + 20) * p, cy + dy - size * 0.38); ctx.stroke();
      }
      const q = T.ease.outBack(T.prog(lt, at + 0.25, 0.25));
      if (q > 0) { ctx.save(); ctx.translate(cx, cy + dy + size * 1.05); ctx.rotate(-4 * T.DEG); ctx.scale(q, q); T.toonText(ctx, sl.new, 0, 0, { size, fill: sl.color ?? P.gold }); ctx.restore(); }
    }
  }

  function drawRegion(ctx, R, g, lt) {
    const { X, Y, st, byId } = g;
    const grow = T.ease.outCubic(T.prog(lt, R.at ?? 0, R.dur ?? 1.2));
    const fade = R.out != null ? 1 - T.prog(lt, R.out, R.outDur ?? 0.5) : 1;
    if (grow <= 0 || fade <= 0) return;
    const pts = R.pts.map(([x, y]) => [X(x), Y(y)]);
    const [cx, cy] = centroid(pts), { w: bw, h: bh } = bbox(pts);
    const rad = Math.max(...pts.map(([x, y]) => Math.hypot(x - cx, y - cy))) * 1.05;
    let col = R.color ?? P.red;
    if (R.recolor) { const q = T.prog(lt, R.recolor.at ?? 1, R.recolor.dur ?? 0.8); if (q > 0) col = T.mix(col, R.recolor.color, q); }
    const neutral = R.halftone;
    const slab = (fill, line = st.border) => {
      ctx.save(); ctx.translate(0, st.extrude + 2); T.outlined(ctx, (k) => T.smoothPath(k, pts), T.shade(neutral ? st.land : fill, -0.42), { line: 0 }); ctx.restore();
      T.outlined(ctx, (k) => T.smoothPath(k, pts), neutral ? st.land : fill, {
        line, ink: R.border ?? R.ink ?? (g.style === 'atlas' ? '#2a1c15' : T.shade(fill, -0.55)),
        shade: (k) => {
          if (neutral) { k.fillStyle = T.mapDots(k, R.dotColor); k.fillRect(cx - rad, cy - rad, rad * 2, rad * 2); }
          else { k.fillStyle = 'rgba(255,255,255,0.12)'; k.fillRect(cx - rad, cy - rad, rad * 2, rad * 0.6); }
        },
      });
    };
    ctx.save(); ctx.globalAlpha *= fade;
    ctx.save(); ctx.beginPath(); const from = R.from ? [X(R.from[0]), Y(R.from[1])] : [cx, cy];
    ctx.arc(from[0], from[1], (R.from ? rad * 2.2 : rad) * grow, 0, Math.PI * 2); ctx.clip();
    slab(col, R.borderWidth ?? st.border);
    // conquest: attacker colour floods in from the attacker's centroid (or `from`)
    if (R.conquer) {
      const c = R.conquer, q = T.ease.inOut(T.prog(lt, c.at ?? 1, c.dur ?? 0.8));
      if (q > 0) {
        const att = byId[c.by];
        const acol = att ? att.color ?? P.red : c.by ?? c.color ?? P.red;
        const o = c.from ? [X(c.from[0]), Y(c.from[1])] : att ? centroid(att.pts.map(([x, y]) => [X(x), Y(y)])) : [cx, cy];
        const reach = Math.max(...pts.map(([x, y]) => Math.hypot(x - o[0], y - o[1]))) * 1.05;
        ctx.save(); ctx.beginPath(); ctx.arc(o[0], o[1], reach * q, 0, Math.PI * 2); ctx.clip(); slab(acol); ctx.restore();
      }
    }
    if (R.whiteout) {
      const q = T.prog(lt, R.whiteout.at ?? 1, R.whiteout.dur ?? 0.5);
      if (q > 0) { ctx.globalAlpha *= 1; T.outlined(ctx, (k) => T.smoothPath(k, pts), `rgba(250,250,246,${q})`, { line: 8 * q, ink: R.whiteout.rim ?? '#50c8c8' }); }
    }
    ctx.restore();
    if (R.pulse) { ctx.strokeStyle = T.shade(col, 0.3); ctx.lineWidth = 8 + Math.sin(lt * 5) * 4; ctx.globalAlpha *= 0.6 + Math.sin(lt * 5) * 0.3; ctx.beginPath(); T.smoothPath(ctx, pts); ctx.stroke(); }
    ctx.restore();
    const conquered = R.conquer && T.prog(lt, R.conquer.at ?? 1, R.conquer.dur ?? 0.8) >= 1;
    const fcx = cx + (R.faceOffset?.[0] ?? 0) * bw, fcy = cy + (R.faceOffset?.[1] ?? 0) * bh;
    if (R.arms && fade > 0.5) regionArms(ctx, fcx, fcy, bw, col, R.arms, lt);
    if (R.face && fade > 0.5) {
      const squash = conquered ? 0.7 : 1;
      ctx.save(); ctx.translate(fcx, fcy); ctx.scale(1, squash); ctx.translate(-fcx, -fcy);
      regionFace(ctx, fcx, fcy, Math.min(bw, bh) * (R.face.scale ?? 0.32), conquered ? { ...R.face, mood: R.conquer.mood ?? 'cry' } : R.face, lt);
      ctx.restore();
    }
    if ((R.label || R.strikeLabel) && fade > 0.5) regionLabel(ctx, cx, cy, R, lt);
  }

  // ---------- the layer ----------
  // { style:'parchment'|'atlas', image?, w, h, sea, coast, landColor, land:[[cx,cy,rx,ry]], regions:[...], desaturate:{at,dur}, ... overlays }
  T.layers.map = (ctx, L, lt, env) => {
    const style = L.style === 'atlas' ? 'atlas' : 'parchment', st = { ...STYLE[style] };
    if (L.extrude != null) st.extrude = L.extrude;
    const mw = (L.w ?? 1.1) * W, mh = (L.h ?? 1.1) * H;
    const X = (x) => (x - 0.5) * mw, Y = (y) => (y - 0.5) * mh;
    const byId = {};
    for (const R of L.regions || []) if (R.id) byId[R.id] = R;
    const g = { X, Y, mw, mh, st, style, byId, env, L };
    if (L.image) ctx.drawImage(T.img(L.image), -mw / 2, -mh / 2, mw, mh);
    else {
      ctx.fillStyle = L.sea ?? st.sea; ctx.fillRect(-mw / 2, -mh / 2, mw, mh);
      const wr = T.rng(T.hash(env.seed + 'waves'));
      ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      for (let i = 0; i < (L.waves ?? st.waves); i++) { const x = (wr() - 0.5) * mw, y = (wr() - 0.5) * mh + Math.sin(lt * 1.5 + i) * 3; ctx.beginPath(); ctx.moveTo(x - 16, y); ctx.quadraticCurveTo(x - 8, y - 8, x, y); ctx.quadraticCurveTo(x + 8, y + 8, x + 16, y); ctx.stroke(); }
      (L.land || []).forEach(([cx, cy, rx, ry], i) => {
        const pts = T.blobPts(X(cx), Y(cy), rx * mw, ry * mh, env.seed + 'land' + i, 22, 0.22);
        ctx.save(); ctx.strokeStyle = L.coast ?? st.coast; ctx.lineWidth = style === 'atlas' ? 26 : 30; ctx.beginPath(); T.smoothPath(ctx, pts); ctx.stroke(); ctx.restore();
        ctx.save(); ctx.translate(0, st.extrude); T.outlined(ctx, (k) => T.smoothPath(k, pts), T.shade(L.landColor ?? st.land, -0.4), { line: 0 }); ctx.restore();
        T.outlined(ctx, (k) => T.smoothPath(k, pts), L.landColor ?? st.land, {
          line: style === 'atlas' ? 5 : 7, ink: st.landInk,
          shade: st.dots && L.dots !== false ? (k) => { k.fillStyle = T.mapDots(k); k.fillRect(-mw / 2, -mh / 2, mw, mh); } : null,
        });
      });
    }
    const ov = T.MAP_OVERLAYS || {};
    for (const R of L.regions || []) drawRegion(ctx, R, g, lt);
    for (const name of ['rivers', 'wall', 'fronts', 'routes', 'cities', 'crosses', 'armies', 'tokens', 'punch', 'pencil', 'pins', 'yearLabel']) {
      if (L[name] != null && ov[name]) ov[name](ctx, L[name], g, lt);
    }
    if (L.desaturate) {
      const q = T.prog(lt, L.desaturate.at ?? 0, L.desaturate.dur ?? 0.5);
      if (q > 0) { ctx.save(); ctx.globalCompositeOperation = 'saturation'; ctx.globalAlpha *= q * (L.desaturate.strength ?? 1); ctx.fillStyle = '#808080'; ctx.fillRect(-mw / 2, -mh / 2, mw, mh); ctx.restore(); }
    }
  };
})();
