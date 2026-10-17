// materials.js — layer modifiers (T.LAYER_MODS): materials (ghost, stone, gold, engrave, ice), freeze block, die-cut
// sticker and split-in-two; the ghost wisp tail (T.BEAN_UNDER); and the fx kinds that repaint another layer of the
// shot: shock, disintegrate, memory. Mods work on the physical-pixel offscreen copy of the layer (see core.js modLayer).
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL, W = T.W, H = T.H, MODS = T.LAYER_MODS, INK = P.ink;
  const f30 = (t) => Math.floor(t * 30);

  // ---------- pixel helpers ----------
  const blank = (src, name) => { const [c, k] = T.scratch(name, src.width, src.height); k.clearRect(0, 0, c.width, c.height); return [c, k]; };
  // Alpha bounds of a canvas in physical px, measured on a 1/8 copy (cheap enough to run every frame).
  function alphaBox(src, name) {
    const sw = Math.max(1, Math.ceil(src.width / 8)), sh = Math.max(1, Math.ceil(src.height / 8));
    const [, k] = T.scratch('px-fx4box' + name, sw, sh);
    k.clearRect(0, 0, sw, sh); k.drawImage(src, 0, 0, sw, sh);
    const d = k.getImageData(0, 0, sw, sh).data;
    let x0 = sw, y0 = sh, x1 = -1, y1 = -1;
    for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
      if (d[(y * sw + x) * 4 + 3] < 12) continue;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    if (x1 < 0) return null;
    const fx = src.width / sw, fy = src.height / sh;
    return { x: x0 * fx, y: y0 * fy, w: (x1 - x0 + 1) * fx, h: (y1 - y0 + 1) * fy, cx: ((x0 + x1 + 1) / 2) * fx, cy: ((y0 + y1 + 1) / 2) * fy };
  }
  // Dilated alpha of src (n copies on a circle of r px) filled with one colour: rims and sticker borders.
  function dilate(k, src, r, n, color) {
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; k.drawImage(src, Math.cos(a) * r, Math.sin(a) * r); }
    k.drawImage(src, 0, 0);
    k.globalCompositeOperation = 'source-in'; k.fillStyle = color; k.fillRect(0, 0, k.canvas.width, k.canvas.height);
    k.globalCompositeOperation = 'source-over';
  }
  // Blend a colour over the opaque pixels only (multiply alone would also paint the transparent area), then re-mask.
  function tint(k, mask, color, alpha = 1, op = 'multiply') {
    k.save();
    k.globalCompositeOperation = op; k.globalAlpha = alpha; k.fillStyle = color; k.fillRect(0, 0, k.canvas.width, k.canvas.height);
    k.globalCompositeOperation = 'destination-in'; k.globalAlpha = 1; k.drawImage(mask, 0, 0);
    k.restore();
  }
  const filteredCopy = (k, src, filter) => { k.filter = filter; k.drawImage(src, 0, 0); k.filter = 'none'; };
  function glint(k, x, y, s, color = '#ffffff') {
    k.fillStyle = color; k.beginPath(); k.moveTo(x, y - s);
    k.quadraticCurveTo(x, y, x + s * 0.7, y); k.quadraticCurveTo(x, y, x, y + s); k.quadraticCurveTo(x, y, x - s * 0.7, y); k.quadraticCurveTo(x, y, x, y - s); k.fill();
  }
  const optsOf = (v, key = 'kind') => (v === true ? {} : typeof v === 'string' ? { [key]: v } : typeof v === 'object' && v ? v : {});

  // ---------- material ----------
  // "material": "ghost" | "stone" | "gold" | "engrave" | "ice" | {kind, at, dur, ...per-kind fields}
  const MAT = {
    // Pale, desaturated, see-through, light rim; bobs at 0.5 Hz. Beans also lose their legs for a wisp tail.
    ghost(k, src, m, lt, d, seed, tag) {
      const [b, bk] = blank(src, 'afxghost' + tag);
      filteredCopy(bk, src, 'saturate(0.15) brightness(1.08)');
      bk.globalCompositeOperation = 'source-atop'; bk.globalAlpha = 0.6; bk.fillStyle = m.tint ?? '#b9c2c8'; bk.fillRect(0, 0, b.width, b.height);
      const [r, rk] = blank(src, 'afxghostrim' + tag);
      dilate(rk, src, 3 * d, 8, m.rim ?? '#eef3f6');
      rk.drawImage(b, 0, 0);
      k.globalAlpha = m.alpha ?? 0.55;
      k.drawImage(r, 0, Math.sin(lt * Math.PI) * (m.bob ?? 5) * d);
      k.globalAlpha = 1;
    },
    // Weathered statue: grayscale, warm stone multiply, seeded cracks, optional plinth under the feet.
    stone(k, src, m, lt, d, seed, tag) {
      const box = alphaBox(src, tag);
      if (box && m.plinth) plinth(k, box, m, d);
      const [b, bk] = blank(src, 'afxstone' + tag);
      filteredCopy(bk, src, 'grayscale(1) contrast(0.55) brightness(1.5)');
      tint(bk, src, m.color ?? '#c9bea8');
      if (box) cracks(bk, box, m.cracks ?? 3, seed, m.crack ?? '#8f846f', d);
      bk.globalCompositeOperation = 'destination-in'; bk.drawImage(src, 0, 0); bk.globalCompositeOperation = 'source-over';
      k.drawImage(b, 0, 0);
    },
    // Gold statue / trophy: grayscale -> gold multiply, warm screen lift, four twinkling glints.
    gold(k, src, m, lt, d, seed, tag) {
      const [b, bk] = blank(src, 'px-fx4gold' + tag);
      bk.drawImage(src, 0, 0);
      T.pixels(bk, (data) => T.GRADE_PIXEL.ramp3(data, 1, m.ramp ?? ['#6a4210', '#e0a828', '#fff4b0']));
      k.drawImage(b, 0, 0);
      const box = alphaBox(src, tag);
      if (!box) return;
      const r = T.rng(T.hash(seed + ':glint'));
      for (let i = 0; i < (m.glints ?? 4); i++) {
        const x = box.x + box.w * (0.15 + r() * 0.7), y = box.y + box.h * (0.1 + r() * 0.6), ph = r() * 6;
        const s = Math.max(0, Math.sin(lt * 3 + ph)) * box.w * 0.06;
        if (s > 0.5) glint(k, x, y, s);
      }
    },
    // Sepia engraving: luminance mapped so ink lines turn light and fills turn dark brown, faint grain, paper shows through.
    engrave(k, src, m, lt, d, seed, tag) {
      const [b, bk] = blank(src, 'px-fx4engrave' + tag);
      bk.drawImage(src, 0, 0);
      T.pixels(bk, (data) => T.GRADE_PIXEL.ramp3(data, 1, m.ramp ?? ['#e2b57a', '#6e4b2c', '#4a3322']));
      const box = alphaBox(src, tag);
      if (box) { // seeded grain specks, +-8% luminance
        const r = T.rng(T.hash(seed + ':grain')), s = Math.max(1, 1.5 * d);
        bk.globalCompositeOperation = 'source-atop';
        for (let i = 0; i < 260; i++) { bk.fillStyle = r() < 0.5 ? 'rgba(255,230,190,0.08)' : 'rgba(20,10,0,0.08)'; bk.fillRect(box.x + r() * box.w, box.y + r() * box.h, s * (1 + r() * 2), s); }
        bk.globalCompositeOperation = 'source-over';
      }
      k.globalAlpha = m.alpha ?? 0.9;
      k.drawImage(b, 0, 0);
      k.globalAlpha = 1;
    },
    // Frosted: the freeze tint without the block.
    ice(k, src, m, lt, d, seed, tag) {
      iceTint(k, src, m);
      const box = alphaBox(src, tag);
      if (box) gloss(k, box, d, 0.5);
    },
  };
  function iceTint(k, src, m = {}) {
    filteredCopy(k, src, 'saturate(0.4) brightness(1.05)');
    tint(k, src, m.tint ?? '#bfe8ea', 0.5);
    tint(k, src, '#ffffff', 0.12, 'screen');
  }
  function gloss(k, box, d, a = 1) {
    k.save(); k.strokeStyle = `rgba(255,255,255,${0.85 * a})`; k.lineCap = 'round';
    const x = box.x + box.w * 0.14, y = box.y + box.h * 0.1, L = Math.min(box.w, box.h) * 0.22;
    k.lineWidth = 6 * d; k.beginPath(); k.moveTo(x, y + L); k.lineTo(x + L, y); k.stroke();
    k.lineWidth = 3 * d; k.beginPath(); k.moveTo(x + L * 0.25, y + L * 1.35); k.lineTo(x + L * 1.35, y + L * 0.25); k.stroke();
    k.restore();
  }
  function plinth(k, box, m, d) {
    const w = box.w * 1.1, h = Math.max(30 * d, box.h * 0.14), x = box.cx - w / 2, y = box.y + box.h - 6 * d, col = m.plinthColor ?? '#a59d8f';
    k.save(); k.lineJoin = 'round';
    k.fillStyle = col; k.fillRect(x, y, w, h);
    k.fillStyle = T.shade(col, -0.2); k.fillRect(x + w * 0.72, y, w * 0.28, h);
    k.fillStyle = T.shade(col, 0.15); k.fillRect(x - w * 0.04, y - h * 0.18, w * 1.08, h * 0.22);
    k.strokeStyle = INK; k.lineWidth = 5 * d; k.strokeRect(x, y, w, h); k.strokeRect(x - w * 0.04, y - h * 0.18, w * 1.08, h * 0.22);
    k.restore();
  }
  function cracks(k, box, n, id, color, d) {
    const r = T.rng(T.hash(id + ':cracks'));
    k.save(); k.strokeStyle = color; k.lineWidth = Math.max(2, 3 * d); k.lineJoin = 'round';
    for (let i = 0; i < n; i++) {
      let x = box.x + box.w * (0.25 + r() * 0.5), y = box.y + box.h * (0.15 + r() * 0.6);
      k.beginPath(); k.moveTo(x, y);
      for (let s = 0; s < 4; s++) { x += (r() - 0.5) * box.w * 0.14; y += box.h * (0.03 + r() * 0.05); k.lineTo(x, y); }
      k.stroke();
    }
    k.restore();
  }
  const MAT_KINDS = Object.keys(MAT);
  const matOf = (v) => {
    const m = optsOf(v);
    if (!MAT_KINDS.includes(m.kind)) throw new Error(`Unknown material "${m.kind}" (use ${MAT_KINDS.join(', ')})`);
    return m;
  };
  // Crossfade between the plain layer and its modded copy (p = 0..1).
  function mixed(src, c, p, name, scale = 1) {
    if (p >= 1 && scale === 1) return c;
    const [o, ok] = blank(src, name);
    ok.globalAlpha = 1 - Math.min(1, p); ok.drawImage(src, 0, 0);
    ok.globalAlpha = Math.min(1, p);
    if (scale !== 1) { ok.translate(o.width / 2, o.height / 2); ok.scale(scale, scale); ok.translate(-o.width / 2, -o.height / 2); }
    ok.drawImage(c, 0, 0);
    return o;
  }
  const layerId = (L) => String(L.id ?? L.who ?? L.type);

  MODS.material = {
    order: 30,
    apply(src, L, lt, env, depth) {
      const m = matOf(L.material), p = m.at == null ? 1 : T.ease.inOut(T.prog(lt, m.at, m.dur ?? 0.5));
      if (p <= 0) return src;
      const [c, k] = blank(src, 'afxmat' + depth);
      MAT[m.kind](k, src, m, lt - (L.at ?? 0), env.dpr || 1, layerId(L), String(depth));
      return mixed(src, c, p, 'afxmatmix' + depth);
    },
  };

  // ---------- freeze: frosted figure inside a translucent ice block ----------
  // "freeze": {at: 1.0, dur: 0.2, pad: 0.08} — fades in over `dur` (6 frames) with a 2% outBack pop, then holds.
  MODS.freeze = {
    order: 32,
    apply(src, L, lt, env, depth) {
      const f = optsOf(L.freeze), at = f.at ?? 0, dur = f.dur ?? 0.2, d = env.dpr || 1;
      const p = T.prog(lt, at, dur);
      if (lt < at) return src;
      const box = alphaBox(src, 'frz' + depth);
      const [c, k] = blank(src, 'afxfreeze' + depth);
      iceTint(k, src, f);
      if (box) {
        const pad = (f.pad ?? 0.08) * Math.max(box.w, box.h);
        iceBlock(k, box.x - pad, box.y - pad, box.w + pad * 2, box.h + pad * 2, d, f.color);
      }
      const pop = p < 1 ? 1 + 0.02 * Math.sin(p * Math.PI) : 1;
      return mixed(src, c, T.ease.outCubic(p), 'afxfreezemix' + depth, pop);
    },
  };

  // Faceted ice block in physical px: translucent front face over the figure, lighter top and darker side faces in a
  // shallow three-quarter view, ink edges, facet lines, highlight streaks and a frosty rim.
  function iceBlock(k, x, y, w, h, d, color) {
    const dd = Math.min(w, h) * 0.14, lw = 5 * d;
    const quad = (pts, fill) => { k.beginPath(); pts.forEach(([px, py], i) => (i ? k.lineTo(px, py) : k.moveTo(px, py))); k.closePath(); k.fillStyle = fill; k.fill(); k.stroke(); };
    k.save(); k.lineJoin = 'round'; k.strokeStyle = INK; k.lineWidth = lw;
    quad([[x, y], [x + dd, y - dd], [x + w + dd, y - dd], [x + w, y]], 'rgba(228,250,252,0.85)'); // top face
    quad([[x + w, y], [x + w + dd, y - dd], [x + w + dd, y + h - dd], [x + w, y + h]], 'rgba(120,192,206,0.75)'); // side face
    quad([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], color ?? 'rgba(178,226,234,0.5)'); // front face
    k.save(); k.beginPath(); k.rect(x, y, w, h); k.clip(); // facets and highlights stay inside the front face
    k.fillStyle = 'rgba(255,255,255,0.22)';
    k.beginPath(); k.moveTo(x, y + h * 0.55); k.lineTo(x + w * 0.45, y); k.lineTo(x + w * 0.7, y); k.lineTo(x, y + h * 0.85); k.closePath(); k.fill();
    k.fillStyle = 'rgba(70,140,160,0.18)';
    k.beginPath(); k.moveTo(x + w, y + h * 0.35); k.lineTo(x + w * 0.55, y + h); k.lineTo(x + w, y + h); k.closePath(); k.fill();
    k.strokeStyle = 'rgba(255,255,255,0.75)'; k.lineWidth = 3 * d;
    k.beginPath(); k.moveTo(x + w * 0.62, y + h * 0.12); k.lineTo(x + w * 0.78, y + h * 0.3); k.lineTo(x + w * 0.74, y + h * 0.42); k.stroke();
    k.restore();
    k.strokeStyle = 'rgba(255,255,255,0.9)'; k.lineCap = 'round';
    k.lineWidth = 7 * d; k.beginPath(); k.moveTo(x + w * 0.1, y + h * 0.3); k.lineTo(x + w * 0.1, y + h * 0.08); k.lineTo(x + w * 0.3, y + h * 0.08); k.stroke();
    k.lineWidth = 4 * d; k.beginPath(); k.moveTo(x + w * 0.1, y + h * 0.38); k.lineTo(x + w * 0.1, y + h * 0.46); k.stroke();
    k.beginPath(); k.moveTo(x + dd * 0.4, y - dd * 0.4); k.lineTo(x + w * 0.5, y - dd * 0.4); k.stroke(); // top edge glint
    k.restore();
  }

  // ---------- sticker: die-cut white border + soft drop shadow ----------
  // "sticker": true | {width: 6, color: "#ffffff", shadow: 0.25, hover: false}
  MODS.sticker = {
    order: 80,
    apply(src, L, lt, env, depth) {
      const s = optsOf(L.sticker), d = env.dpr || 1, llt = lt - (L.at ?? 0);
      const [b, bk] = blank(src, 'afxstkb' + depth);
      dilate(bk, src, (s.width ?? 6) * d, 12, s.color ?? '#ffffff');
      const [c, k] = blank(src, 'afxstk' + depth);
      let dx = 0, dy = 0;
      if (s.hover) { // +-3 px bob every 0.8 s plus a 1 px boil on twos
        const r = T.rng(T.hash(layerId(L) + ':stk:' + Math.floor(llt * 15)));
        dy = Math.sin((llt / 0.8) * Math.PI * 2) * 3 * d + (r() - 0.5) * 2 * d; dx = (r() - 0.5) * 2 * d;
      }
      const [sh, shk] = blank(src, 'afxstks' + depth);
      shk.filter = `blur(${(6 * d).toFixed(1)}px)`; shk.drawImage(b, dx + 4 * d, dy + 6 * d); shk.filter = 'none';
      shk.globalCompositeOperation = 'source-in'; shk.fillStyle = `rgba(0,0,0,${s.shadow ?? 0.25})`; shk.fillRect(0, 0, sh.width, sh.height);
      k.drawImage(sh, 0, 0);
      k.drawImage(b, dx, dy);
      k.drawImage(src, dx, dy);
      return c;
    },
  };

  // ---------- split: the layer cracks along a jagged line and the halves spring apart ----------
  // "split": {at: 1.2, gap: 0.18, angle: 90, jag: 0.06, rot: 6, label: {text, color}}
  function cutLine(box, sp, id) {
    const r = T.rng(T.hash(id + ':cut')), a = (sp.angle ?? 90) * T.DEG, ux = Math.cos(a), uy = Math.sin(a);
    const R = Math.hypot(box.w, box.h) * 0.6, n = 6 + Math.floor(r() * 4), amp = (sp.jag ?? 0.06) * box.w, pts = [];
    for (let i = 0; i <= n; i++) {
      const s = -R + (2 * R * i) / n, o = i === 0 || i === n ? 0 : (i % 2 ? 1 : -1) * amp * (0.5 + r() * 0.5);
      pts.push([box.cx + ux * s - uy * o, box.cy + uy * s + ux * o]);
    }
    return { pts, nx: -uy, ny: ux };
  }
  function halfPath(k, cut, side, far) {
    const { pts, nx, ny } = cut, n = pts.length;
    k.beginPath(); k.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < n; i++) k.lineTo(pts[i][0], pts[i][1]);
    k.lineTo(pts[n - 1][0] + nx * far * side, pts[n - 1][1] + ny * far * side);
    k.lineTo(pts[0][0] + nx * far * side, pts[0][1] + ny * far * side);
    k.closePath();
  }
  const strokeCut = (k, pts, w, color) => { k.strokeStyle = color; k.lineWidth = w; k.lineJoin = 'round'; k.beginPath(); pts.forEach(([x, y], i) => (i ? k.lineTo(x, y) : k.moveTo(x, y))); k.stroke(); };
  MODS.split = {
    order: 60,
    apply(src, L, lt, env, depth) {
      const sp = optsOf(L.split), at = sp.at ?? 0, d = env.dpr || 1;
      if (lt < at - 1 / 30) return src;
      const box = alphaBox(src, 'spl' + depth);
      if (!box) return src;
      const cut = cutLine(box, sp, layerId(L)), lw = Math.max(3 * d, box.w * 0.012);
      const [c, k] = blank(src, 'afxsplit' + depth);
      if (lt < at) { k.drawImage(src, 0, 0); k.globalCompositeOperation = 'source-atop'; strokeCut(k, cut.pts, lw, INK); k.globalCompositeOperation = 'source-over'; return c; } // 1-frame crack line first
      const t = lt - at, sq = t < 1 / 30;
      const q = sq ? 0 : T.ease.outBack(T.prog(t, 1 / 30, 3 / 30)) * 0.92 + (t > 4 / 30 ? 0.08 * (1 - T.ease.out(T.prog(t, 4 / 30, 0.2))) : 0);
      const off = q * (sp.gap ?? 0.18) * box.w, bob = t > 0.2 ? Math.sin(t * Math.PI * 3) * d : 0;
      for (const side of [-1, 1]) {
        k.save();
        if (sq) { k.translate(box.cx, box.y + box.h); k.scale(1.1, 0.85); k.translate(-box.cx, -box.y - box.h); }
        k.translate(cut.nx * off * side, cut.ny * off * side + bob * side);
        k.translate(box.cx, box.cy); k.rotate(side * q * (sp.rot ?? 6) * T.DEG); k.translate(-box.cx, -box.cy);
        halfPath(k, cut, side, box.w * 2); k.clip();
        k.drawImage(src, 0, 0);
        k.globalCompositeOperation = 'source-atop'; // the crack edge exists only where the layer has pixels
        strokeCut(k, cut.pts, box.w * 0.05, 'rgba(0,0,0,0.15)');
        strokeCut(k, cut.pts, lw * 2, INK);
        k.restore();
      }
      if (sp.label && !sq) ribbon(k, box, sp.label, q, d);
      return c;
    },
  };
  // DOCS-style ribbon (folded tails, white text) across the gap.
  function ribbon(k, box, lab, q, d) {
    const o = optsOf(lab, 'text'), size = Math.max(30 * d, Math.min(box.w * 0.18, box.h * 0.14)), col = o.color ?? '#c8202a';
    k.save(); k.translate(box.cx, box.cy); k.scale(Math.min(1, q), Math.min(1, q));
    k.font = T.font(size); const tw = k.measureText(String(o.text ?? '')).width, w = tw + size * 1.4, h = size * 1.5;
    k.lineJoin = 'round'; k.strokeStyle = INK; k.lineWidth = 4 * d;
    for (const s of [-1, 1]) { // folded tails
      k.beginPath(); k.moveTo(s * w * 0.42, -h * 0.2); k.lineTo(s * (w * 0.5 + h * 0.7), -h * 0.2); k.lineTo(s * (w * 0.5 + h * 0.4), h * 0.3); k.lineTo(s * (w * 0.5 + h * 0.7), h * 0.8); k.lineTo(s * w * 0.42, h * 0.8); k.closePath();
      k.fillStyle = T.shade(col, -0.3); k.fill(); k.stroke();
    }
    k.beginPath(); k.rect(-w / 2, -h / 2, w, h); k.fillStyle = col; k.fill(); k.stroke();
    k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillStyle = '#ffffff'; k.fillText(String(o.text ?? ''), 0, size * 0.06);
    k.restore();
  }

  // ---------- ghost tail (beans with material ghost) ----------
  const isGhost = (Ly) => { const m = Ly && Ly.material; return m === 'ghost' || (!!m && typeof m === 'object' && m.kind === 'ghost' && m.wisp !== false); };
  // Tapering S-shaped wisp from the robe hem, tip sways at 0.8 Hz. Torso units, drawn before the legs (which are hidden).
  function ghostTail(ctx, c, view, lt) {
    const sway = Math.sin(lt * Math.PI * 2 * 0.8) * 22, tx = 46 + sway, robe = c.robe ?? P.red;
    const path = (k) => {
      k.moveTo(-146, -90);
      k.bezierCurveTo(-150, 30, tx - 110, 70, tx - 20, 120);
      k.quadraticCurveTo(tx + 10, 140, tx + 28, 196);
      k.quadraticCurveTo(tx + 34, 120, tx + 70, 60);
      k.bezierCurveTo(130, 10, 150, -30, 146, -90);
      k.closePath();
    };
    T.outlined(ctx, path, robe, { shade: (k) => { k.fillStyle = T.shade(robe, -0.24); k.fillRect(-160, 40, 400, 200); } });
  }
  T.BEAN_UNDER = T.BEAN_UNDER || []; // rig.js loads first and owns the list; tolerate either order
  T.BEAN_UNDER.push((ctx, c, view, lt, Ly) => { if (isGhost(Ly)) ghostTail(ctx, c, view, lt); });
  const baseBean = T.layers.bean;
  if (baseBean) T.layers.bean = (ctx, Ly, lt, env) => baseBean(ctx, isGhost(Ly) && Ly.legs == null ? { ...Ly, legs: false } : Ly, lt, env);

  // ---------- fx that repaint another layer of the shot ----------
  // Paints layer `id` of the current shot as it would appear now (ignoring its own hiding: out, alpha 0) into a
  // physical-size scratch canvas. Returns {c, box (logical px)} or null when it is off.
  function paintTarget(id, env, name) {
    if (!env || !env.shot) throw new Error('fx target needs the shot env (core T.layers.fx wrapper missing)');
    const L0 = (env.shot.layers || []).find((l) => l.id === id);
    if (!L0) throw new Error(`fx target "${id}" is not a layer id in shot ${env.shot.id}`);
    if (L0.type === 'fx' && ['shock', 'disintegrate'].includes(L0.kind)) throw new Error(`fx target "${id}" cannot be another ${L0.kind} fx`);
    const E = T.effLayer(L0, env.lt), L = { ...E, swap: null, out: null, exit: null, alpha: E.alpha ? E.alpha : 1 };
    const cv = env.canvasSize, [c, k] = T.scratch('afxtgt' + name, cv[0], cv[1]);
    k.clearRect(0, 0, c.width, c.height);
    k.setTransform(env.dpr, 0, 0, env.dpr, 0, 0);
    T.drawLayer(k, L, env.lt, env, env.cam);
    k.setTransform(1, 0, 0, 1, 0, 0);
    const b = alphaBox(c, name);
    if (!b) return null;
    const s = 1 / env.dpr;
    return { c, box: { x: b.x * s, y: b.y * s, w: b.w * s, h: b.h * s, cx: b.cx * s, cy: b.cy * s } };
  }
  // Draw in physical pixels / logical frame space regardless of the fx layer's own position.
  const phys = (ctx) => ctx.setTransform(1, 0, 0, 1, 0, 0);
  const logical = (ctx, env) => ctx.setTransform(env.dpr, 0, 0, env.dpr, 0, 0);
  const envOf = (ctx, env) => ({ ...env, dpr: env.dpr || T.DPR, canvasSize: [ctx.canvas.width, ctx.canvas.height] });
  function recolor(src, color, name, alpha = 1) {
    const [c, k] = blank(src, name);
    k.drawImage(src, 0, 0); k.globalCompositeOperation = 'source-in'; k.globalAlpha = alpha; k.fillStyle = color; k.fillRect(0, 0, c.width, c.height);
    return c;
  }
  const FX = T.FX;

  // shock: {target, dur 0.8, color "#4fd2ff", xray true, spikes true} — the target alternates normal / white / x-ray
  // black / half-alpha looks on a seeded 2-3 frame cycle inside zigzag bolts. Hide the target for the same window.
  function shockLooks(id) {
    const r = T.rng(T.hash(id + ':seq')), out = [];
    let prev = -1;
    for (let i = 0; i < 40; i++) { let v = Math.floor(r() * 4); if (v === prev) v = (v + 1) % 4; prev = v; const n = 2 + Math.floor(r() * 2); for (let j = 0; j < n; j++) out.push(v); }
    return out;
  }
  FX.shock = (ctx, L, lt, env0) => {
    const dur = L.dur ?? 0.8;
    if (lt > dur || !L.target) return;
    const env = envOf(ctx, env0), tg = paintTarget(L.target, env, 'shock');
    if (!tg) return;
    const { c, box } = tg, id = String(L.id ?? 'shock'), f = f30(lt), seq = shockLooks(id), look = seq[f % seq.length];
    ctx.save(); logical(ctx, env);
    const rOut = T.clamp(box.h * 0.42, 160, 260);
    T.starburst(ctx, box.cx, box.cy, rOut * 0.62, rOut, 14, id + ':sb:' + Math.floor(f / 2), look === 1 ? '#7fdcff' : look === 2 ? '#bff3ff' : '#ffffff', INK, 5);
    ctx.save(); phys(ctx);
    if (look === 0) ctx.drawImage(c, 0, 0);
    if (look === 1) ctx.drawImage(recolor(c, '#ffffff', 'afxshk'), 0, 0);
    if (look === 2) ctx.drawImage(recolor(c, '#141414', 'afxshk'), 0, 0);
    if (look === 3) { ctx.globalAlpha *= 0.5; ctx.drawImage(c, 0, 0); }
    ctx.restore();
    const hx = box.cx, hy = box.y + box.h * 0.2, hr = Math.min(box.w * 0.34, box.h * 0.17);
    if (L.spikes !== false) { // static hair standing up
      ctx.fillStyle = look === 1 ? '#ffffff' : look === 2 ? '#141414' : INK;
      ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = -Math.PI * (0.85 - (i / 7) * 0.7), bx = hx + Math.cos(a) * hr * 1.05, by = hy - hr * 0.2 + Math.sin(a) * hr * 1.05; ctx.moveTo(bx - 9, by + 4); ctx.lineTo(hx + Math.cos(a) * hr * 1.6, hy - hr * 0.2 + Math.sin(a) * hr * 1.6); ctx.lineTo(bx + 9, by + 4); } ctx.fill();
    }
    if (look === 2 && L.xray !== false) xray(ctx, box, hx, hy, hr);
    bolts(ctx, box, id + ':b:' + Math.floor(f / 2), L.color ?? '#4fd2ff', L.count ?? 6);
    ctx.restore();
  };
  function xray(ctx, box, hx, hy, hr) {
    ctx.save(); ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#ffffff'; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(hx, hy, hr * 0.7, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(hx - hr * 0.38, hy + hr * 0.45, hr * 0.76, hr * 0.32); // jaw
    ctx.fillStyle = '#141414';
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(hx + s * hr * 0.28, hy - hr * 0.02, hr * 0.17, hr * 0.2, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillRect(hx - hr * 0.3, hy + hr * 0.55, hr * 0.6, hr * 0.05);
    const sy0 = hy + hr * 0.9, sy1 = box.y + box.h * 0.82;
    ctx.lineWidth = Math.max(6, hr * 0.14); ctx.beginPath(); ctx.moveTo(hx, sy0); ctx.lineTo(hx, sy1); ctx.stroke();
    ctx.lineWidth = Math.max(4, hr * 0.09);
    for (let i = 0; i < 4; i++) { const y = sy0 + (sy1 - sy0) * (0.18 + i * 0.13); ctx.beginPath(); ctx.ellipse(hx, y, hr * (0.75 - i * 0.07), hr * 0.22, 0, Math.PI * 0.08, Math.PI * 0.92); ctx.stroke(); }
    ctx.restore();
  }
  function bolts(ctx, box, seed, color, n) {
    const r = T.rng(T.hash(seed));
    ctx.save(); ctx.lineJoin = 'miter'; ctx.lineCap = 'round';
    for (let b = 0; b < n; b++) {
      const a = r() * Math.PI * 2, rx = box.w * 0.62, ry = box.h * 0.55, segs = 6 + Math.floor(r() * 5), len = 70 + r() * 90, pts = [];
      let x = box.cx + Math.cos(a) * rx, y = box.cy + Math.sin(a) * ry, dir = a + Math.PI / 2;
      for (let i = 0; i <= segs; i++) { pts.push([x, y]); dir += (r() - 0.5) * 2.2; x += Math.cos(dir) * len / segs * 1.6; y += Math.sin(dir) * len / segs * 1.6; }
      for (const [w, col] of [[6, color], [2, '#ffffff']]) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.stroke(); }
    }
    ctx.restore();
  }

  // disintegrate: {target, pieces 20, ash true, stinger false} — shards drift out (4 frames), turn black and fall into an
  // ash pile with a smoke stem (12 frames), then the pile holds. Hide the target from the fx `at`.
  FX.disintegrate = (ctx, L, lt, env0) => {
    if (!L.target) return;
    const env = envOf(ctx, env0), id = String(L.id ?? 'dis'), F = lt * 30;
    const tg = paintTarget(L.target, env, 'dis');
    if (!tg) return;
    const { c, box } = tg, d = env.dpr;
    ctx.save(); phys(ctx);
    if (L.stinger && F < 2) { ctx.drawImage(recolor(c, '#2a6ad0', 'afxdis-st'), 0, 0); ctx.restore(); return; }
    const black = recolor(c, '#141414', 'afxdis-bk'), n = Math.max(6, L.pieces ?? 20), cols = Math.max(2, Math.round(Math.sqrt(n * box.w / box.h))), rows = Math.max(2, Math.ceil(n / cols));
    const r = T.rng(T.hash(id + ':grid')), jit = [];
    for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) jit.push([(i > 0 && i < cols ? (r() - 0.5) * 0.6 : 0), (j > 0 && j < rows ? (r() - 0.5) * 0.6 : 0)]);
    const pt = (i, j) => { const o = jit[j * (cols + 1) + i]; return [(box.x + ((i + o[0]) / cols) * box.w) * d, (box.y + ((j + o[1]) / rows) * box.h) * d]; };
    const ground = (box.y + box.h) * d, fall = T.clamp((F - 4) / 12);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const q = [pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1)], cx = (q[0][0] + q[2][0]) / 2, cy = (q[0][1] + q[2][1]) / 2;
      const rr = T.rng(T.hash(id + ':' + i + ':' + j)), drift = T.ease.outCubic(T.clamp(F / 4)), spin = (rr() - 0.5) * 1.2;
      const dx = (cx - box.cx * d) * 0.12 * drift + (rr() - 0.5) * 20 * d * drift, dy = -(10 + rr() * 22) * d * drift + (ground - cy) * T.ease.in(fall);
      const sc = 1 - 0.7 * fall;
      ctx.save(); ctx.translate(cx + dx, cy + dy); ctx.rotate(spin * fall); ctx.scale(sc, sc); ctx.translate(-cx, -cy);
      ctx.beginPath(); q.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.clip();
      ctx.globalAlpha *= 1 - T.clamp((F - 12) / 4);
      ctx.drawImage(F < 4 ? c : black, 0, 0);
      if (F < 4) { ctx.globalAlpha *= T.clamp(F / 4); ctx.drawImage(black, 0, 0); }
      ctx.restore();
    }
    ctx.restore();
    if (L.ash !== false && F > 8) ashPile(ctx, env, box, T.ease.outCubic(T.clamp((F - 8) / 10)), lt, id);
  };
  function ashPile(ctx, env, box, p, lt, id) {
    ctx.save(); logical(ctx, env);
    const x = box.cx, y = box.y + box.h, w = box.w * 0.7 * p, h = box.w * 0.24 * p;
    T.outlined(ctx, (k) => { k.moveTo(x - w, y); k.quadraticCurveTo(x - w * 0.5, y - h * 1.1, x, y - h); k.quadraticCurveTo(x + w * 0.5, y - h * 1.1, x + w, y); k.closePath(); }, '#3a3532', { line: 6 });
    ctx.globalAlpha *= 0.7 * p; ctx.strokeStyle = '#8a8580'; ctx.lineWidth = 10; ctx.lineCap = 'round';
    const sw = Math.sin(lt * 2.4) * 18;
    ctx.beginPath(); ctx.moveTo(x, y - h); ctx.bezierCurveTo(x + 30 + sw, y - h - 60, x - 30 - sw, y - h - 120, x + sw, y - h - 190); ctx.stroke();
    ctx.restore();
  }

  // memory: a tinted cast bean inside a thought bubble (or a framed frozen sub-shot, or a dimmed giant face) beside the
  // present scene. {who, pose, expr, look, view, x, y, size 520, alpha 0.85, tint "#8fa6d8", backdrop fire|rays,
  // bubble true, tail [x, y] (frame point the bubble's trail points at), dur 0.66 fade}
  // {shot, t, rect [x, y, w, h]} | {who, face: true, scale 1.6, expr, dim 0.45}
  FX.memory = (ctx, L, lt, env0) => {
    const env = envOf(ctx, env0), fade = T.ease.outCubic(T.prog(lt, 0, L.dur ?? 0.66));
    if (fade <= 0) return;
    if (L.face) return memoryFace(ctx, L, lt, env, fade);
    const cv = env.canvasSize, [c, k] = T.scratch('afxmem', cv[0], cv[1]);
    k.clearRect(0, 0, cv[0], cv[1]);
    let rect = null;
    if (L.shot) {
      const rc = L.rect ?? [0.55, 0.1, 0.42, 0.8];
      rect = rc.map((v, i) => v * (i % 2 ? H : W) * env.dpr);
      k.drawImage(T.subShot(L.shot, L.t ?? 0, env), rect[0], rect[1], rect[2], rect[3]);
    } else {
      if (!L.who) throw new Error('memory fx needs who (a cast name), shot, or face');
      k.setTransform(env.dpr, 0, 0, env.dpr, 0, 0); k.translate((L.x ?? 0.75) * W, (L.y ?? 0.9) * H);
      if (L.flip) k.scale(-1, 1);
      T.layers.bean(k, { type: 'bean', id: (L.id ?? 'mem') + ':bean', who: L.who, pose: L.pose, expr: L.expr, look: L.look, view: L.view, size: L.size ?? 520, legs: L.legs }, lt, env);
      k.setTransform(1, 0, 0, 1, 0, 0);
    }
    const [g, gk] = blank(c, 'afxmemtint');
    filteredCopy(gk, c, 'saturate(0.35)');
    tint(gk, c, L.tint ?? '#8fa6d8');
    ctx.save(); logical(ctx, env);
    const lobes = !L.shot && L.bubble !== false ? thoughtBubble(ctx, L, fade) : null;
    if (lobes) { ctx.beginPath(); for (const [x, y, r] of lobes) { ctx.moveTo(x + r - 8, y); ctx.arc(x, y, r - 8, 0, Math.PI * 2); } ctx.clip(); } // inside the ink rim
    if (L.backdrop && !L.shot) backdrop(ctx, L, lt, fade * (lobes ? 0.85 : 1));
    phys(ctx);
    ctx.globalAlpha *= (L.alpha ?? (lobes ? 0.85 : 0.45)) * fade;
    if (rect) { ctx.save(); ctx.beginPath(); T.rrect(ctx, rect[0], rect[1], rect[2], rect[3], 24 * env.dpr); ctx.clip(); ctx.drawImage(g, 0, 0); ctx.restore(); ctx.strokeStyle = INK; ctx.lineWidth = 6 * env.dpr; ctx.beginPath(); T.rrect(ctx, rect[0], rect[1], rect[2], rect[3], 24 * env.dpr); ctx.stroke(); }
    else ctx.drawImage(g, 0, 0);
    ctx.restore();
  };
  // Pale outlined thought cloud around the memory (pops in with the fade) plus three shrinking circles trailing to
  // `tail`; returns the cloud lobes so the memory can be clipped inside it.
  function thoughtBubble(ctx, L, fade) {
    const s = L.size ?? 520, x = (L.x ?? 0.75) * W, y = (L.y ?? 0.9) * H - s * 0.5, sc = T.lerp(0.6, 1, T.ease.outBack(T.clamp(fade)));
    const w = s * 1.05 * sc, h = s * 0.95 * sc, [tx, ty] = L.tail ? [L.tail[0] * W, L.tail[1] * H] : [W / 2, H * 0.35];
    const ang = Math.atan2(ty - y, tx - x), edge = Math.min(w, h) * 0.62;
    ctx.save(); ctx.globalAlpha *= T.clamp(fade * 1.5);
    for (let i = 0; i < 3; i++) { const d = edge + 40 + i * 46, r = (24 - i * 7) * sc; T.outlined(ctx, (k) => k.arc(x + Math.cos(ang) * d, y + Math.sin(ang) * d, r, 0, Math.PI * 2), '#e9edf7', { line: 5 }); }
    const lobes = T.drawCloud(ctx, x, y, w, h, String(L.id ?? 'mem') + ':bubble', { count: 11, color: '#e9edf7', shade: '#d3d9ea', line: 7 });
    ctx.restore();
    return lobes;
  }
  function backdrop(ctx, L, lt, fade) {
    const x = (L.x ?? 0.75) * W, y = (L.y ?? 0.9) * H, s = L.size ?? 520;
    ctx.save(); ctx.globalAlpha *= fade;
    if (L.backdrop === 'rays' && T.drawRays) T.drawRays(ctx, x, y - s * 0.5, lt, { color: 'rgba(255,240,200,0.35)', count: 12, seed: (L.id ?? 'mem') + 'r' });
    else for (let i = 0; i < 7; i++) { ctx.save(); ctx.translate(x + (i / 6 - 0.5) * s * 1.5, y + 10); T.drawFlame(ctx, s * (0.45 + (i % 3) * 0.12), lt + i * 0.13, (L.id ?? 'mem') + 'f' + i); ctx.restore(); }
    ctx.restore();
  }
  function memoryFace(ctx, L, lt, env, fade) {
    if (!L.who) throw new Error('memory face needs who (a cast name)');
    const size = (L.size ?? 600) * (L.scale ?? 1.6), k0 = size / 600, cx = (L.x ?? 0.5) * W, cy = (L.y ?? 0.42) * H;
    const cv = env.canvasSize, [c, k] = T.scratch('afxmemface', cv[0], cv[1]);
    k.clearRect(0, 0, cv[0], cv[1]);
    k.setTransform(env.dpr, 0, 0, env.dpr, 0, 0);
    k.save(); // the pooled scratch keeps its clip between fetches otherwise
    k.beginPath(); k.arc(cx, cy, 215 * k0, 0, Math.PI * 2); k.clip();
    k.translate(cx, cy + 450 * k0);
    T.layers.bean(k, { type: 'bean', id: (L.id ?? 'memf') + ':face', who: L.who, expr: L.expr ?? 'evil', look: L.look, view: L.view ?? 'front', size, rock: 0 }, lt, env);
    k.restore();
    k.setTransform(1, 0, 0, 1, 0, 0);
    ctx.save(); logical(ctx, env);
    const a0 = ctx.globalAlpha;
    ctx.globalAlpha = a0 * (L.dim ?? 0.45) * fade; ctx.fillStyle = '#000'; ctx.fillRect(-20, -20, W + 40, H + 40);
    phys(ctx); ctx.globalAlpha = a0 * (L.alpha ?? 0.65) * fade; ctx.filter = 'saturate(0) brightness(0.85)';
    ctx.drawImage(c, 0, 0);
    ctx.restore();
  }
  // Anatomy inside an x-rayed body (physical px, box = the body's alpha box): the head is the top ~58 % of a bean.
  // Bones are pale and soft, lungs pink, the heart beats at 1.2 Hz, vessels branch from it; `specks` dark lead grains
  // settle into the bones one by one from `specksAt` over `specksDur` (seeded by the layer id, pure in time).
  function xrayAnatomy(k, box, t, x, id, d) {
    const cx = box.cx, w = box.w, h = box.h, top = box.y;
    const hx = cx, hy = top + h * 0.3, hr = Math.min(w * 0.3, h * 0.2);
    const ty0 = top + h * 0.6, ty1 = top + h * 0.93, tw = w * 0.42; // torso band
    const bone = 'rgba(240,248,255,0.78)', boneEdge = 'rgba(160,200,235,0.9)';
    k.save(); k.lineCap = 'round'; k.lineJoin = 'round';
    if (x.anatomy) {
      // lungs
      for (const s of [-1, 1]) {
        k.fillStyle = 'rgba(255,140,165,0.42)'; k.strokeStyle = 'rgba(255,120,150,0.7)'; k.lineWidth = 2 * d;
        k.beginPath(); k.ellipse(cx + s * tw * 0.42, ty0 + (ty1 - ty0) * 0.38, tw * 0.3, (ty1 - ty0) * 0.36, s * 0.12, 0, Math.PI * 2);
        k.fill(); k.stroke();
      }
      // vessels from the heart
      const hcx = cx - tw * 0.12, hcy = ty0 + (ty1 - ty0) * 0.5;
      k.strokeStyle = 'rgba(220,40,60,0.55)'; k.lineWidth = 3 * d;
      const r = T.rng(T.hash(id + ':vessels'));
      for (let i = 0; i < 7; i++) {
        const a = -Math.PI / 2 + (i - 3) * 0.55 + (r() - 0.5) * 0.3, len = h * (0.18 + r() * 0.2);
        k.beginPath(); k.moveTo(hcx, hcy);
        k.quadraticCurveTo(hcx + Math.cos(a) * len * 0.5 + (r() - 0.5) * 30 * d, hcy + Math.sin(a) * len * 0.5, hcx + Math.cos(a) * len, hcy + Math.sin(a) * len);
        k.stroke();
      }
      // skull, spine, ribs
      k.fillStyle = bone; k.strokeStyle = boneEdge; k.lineWidth = 2 * d;
      k.beginPath(); k.ellipse(hx, hy, hr * 0.78, hr * 0.86, 0, 0, Math.PI * 2); k.fill(); k.stroke();
      k.beginPath(); k.roundRect ? k.roundRect(hx - hr * 0.42, hy + hr * 0.62, hr * 0.84, hr * 0.42, hr * 0.12) : k.rect(hx - hr * 0.42, hy + hr * 0.62, hr * 0.84, hr * 0.42); k.fill(); k.stroke();
      k.fillStyle = 'rgba(20,40,70,0.75)';
      for (const s of [-1, 1]) { k.beginPath(); k.ellipse(hx + s * hr * 0.3, hy + hr * 0.05, hr * 0.17, hr * 0.21, 0, 0, Math.PI * 2); k.fill(); }
      k.beginPath(); k.moveTo(hx, hy + hr * 0.3); k.lineTo(hx - hr * 0.08, hy + hr * 0.48); k.lineTo(hx + hr * 0.08, hy + hr * 0.48); k.fill();
      k.strokeStyle = bone; k.lineWidth = Math.max(5 * d, hr * 0.12);
      k.beginPath(); k.moveTo(hx, hy + hr * 1.05); k.lineTo(hx, ty1); k.stroke();
      k.lineWidth = Math.max(3 * d, hr * 0.07);
      for (let i = 0; i < 5; i++) {
        const y = ty0 + (ty1 - ty0) * (0.08 + i * 0.13);
        k.beginPath(); k.ellipse(hx, y, tw * (0.62 - i * 0.04), (ty1 - ty0) * 0.08, 0, Math.PI * 0.05, Math.PI * 0.95); k.stroke();
      }
      // heart, beating
      const beat = 1 + 0.12 * Math.pow(Math.max(0, Math.sin(t * Math.PI * 2 * 1.2)), 6), hs = tw * 0.13 * beat;
      k.fillStyle = 'rgba(225,40,60,0.85)';
      k.beginPath(); k.moveTo(hcx, hcy + hs * 0.9);
      k.bezierCurveTo(hcx - hs * 1.4, hcy, hcx - hs * 0.8, hcy - hs * 1.1, hcx, hcy - hs * 0.35);
      k.bezierCurveTo(hcx + hs * 0.8, hcy - hs * 1.1, hcx + hs * 1.4, hcy, hcx, hcy + hs * 0.9); k.fill();
    }
    const n = Math.round(x.specks ?? 0);
    if (n > 0) { // lead grains settling into skull, spine and ribs
      const r = T.rng(T.hash(id + ':specks')), t0 = x.specksAt ?? 0, span = x.specksDur ?? 1;
      for (let i = 0; i < n; i++) {
        const where = r(), u = r(), v = r(), sz = (5 + r() * 4) * d;
        const appear = t0 + (i / Math.max(1, n - 1)) * span, p = T.clamp((t - appear) / 0.12, 0, 1);
        let px, py;
        if (where < 0.35) { const a = u * Math.PI * 2, rr = Math.sqrt(v) * hr * 0.7; px = hx + Math.cos(a) * rr; py = hy + Math.sin(a) * rr * 1.1; }
        else if (where < 0.6) { px = hx + (u - 0.5) * hr * 0.14; py = hy + hr * 1.05 + v * (ty1 - hy - hr * 1.05); }
        else { const ri = Math.floor(u * 5), y = ty0 + (ty1 - ty0) * (0.08 + ri * 0.13), a = Math.PI * (0.08 + v * 0.84);
          px = hx + Math.cos(a) * tw * (0.62 - ri * 0.04); py = y + Math.sin(a) * (ty1 - ty0) * 0.08; }
        if (p <= 0) continue;
        k.fillStyle = 'rgba(40,44,52,0.95)';
        k.beginPath(); k.arc(px, py, sz * (p < 1 ? 1 + (1 - p) * 0.8 : 1), 0, Math.PI * 2); k.fill();
      }
    }
    k.restore();
  }

  // ---------- xray: see-through blue silhouette with ink edges and an optional prop inside ----------
  // "xray": true | {at 0, dur 0.2, inner (prop kind), innerSize (0.5 of the shorter side), color '#7fd0ff'} — from `at`
  // (shot time, like freeze) the layer crossfades over `dur` into a translucent tinted body with a light inner rim,
  // scan stripes and an ink outline; `inner` is drawn at the body's centre. Fx layers keep `xray` for their own use.
  MODS.xray = {
    order: 34,
    when: (L) => L.type !== 'fx',
    apply(src, L, lt, env, depth) {
      const x = optsOf(L.xray, 'inner'), at = x.at ?? 0, d = env.dpr || 1;
      if (lt < at) return src;
      const box = alphaBox(src, 'xry' + depth), col = x.color ?? '#7fd0ff';
      const [c, k] = blank(src, 'afxxray' + depth);
      dilate(k, src, 5 * d, 12, INK); // ink edge: the dilated outline, the body is painted over it
      const [b, bk] = blank(src, 'afxxraybody' + depth);
      bk.fillStyle = T.mix(col, '#0b4a8a', 0.3); bk.fillRect(0, 0, b.width, b.height);
      bk.globalAlpha = 0.16; filteredCopy(bk, src, 'grayscale(1) contrast(1.6)'); bk.globalAlpha = 1; // faint inner structure
      bk.globalCompositeOperation = 'destination-in'; bk.drawImage(src, 0, 0); bk.globalCompositeOperation = 'source-over';
      k.globalCompositeOperation = 'destination-out'; k.drawImage(src, 0, 0); k.globalCompositeOperation = 'source-over';
      k.globalAlpha = x.alpha ?? 0.8; k.drawImage(b, 0, 0); k.globalAlpha = 1;
      const [r, rk] = blank(src, 'afxxrayrim' + depth); // light inner rim: the body minus a shrunken copy of itself
      rk.drawImage(src, 0, 0); rk.globalCompositeOperation = 'source-in'; rk.fillStyle = col; rk.fillRect(0, 0, r.width, r.height);
      if (box) {
        rk.globalCompositeOperation = 'destination-out'; const f = 0.86;
        rk.drawImage(src, box.cx * (1 - f), box.cy * (1 - f), src.width * f, src.height * f);
        rk.globalCompositeOperation = 'destination-in'; rk.drawImage(src, 0, 0);
        rk.globalCompositeOperation = 'source-over';
        rk.fillStyle = 'rgba(255,255,255,0.12)'; // scan stripes, clipped to the body by the final mask below
        for (let y = box.y + ((Math.floor(lt * 15) * 3 * d) % (18 * d)); y < box.y + box.h; y += 18 * d) rk.fillRect(box.x, y, box.w, 6 * d);
        rk.globalCompositeOperation = 'destination-in'; rk.drawImage(src, 0, 0); rk.globalCompositeOperation = 'source-over';
      }
      k.globalAlpha = 0.85; k.drawImage(r, 0, 0); k.globalAlpha = 1;
      if ((x.anatomy || x.specks) && box) { // body x-ray: bones, lungs, heart, vessels, specks, clipped to the body
        const [a, ak] = blank(src, 'afxxrayana' + depth);
        xrayAnatomy(ak, box, lt - at, x, layerId(L), d);
        ak.globalCompositeOperation = 'destination-in'; ak.drawImage(src, 0, 0); ak.globalCompositeOperation = 'source-over';
        k.drawImage(a, 0, 0);
      }
      if (x.inner && box) {
        if (!T.PROPS[x.inner]) throw new Error(`xray: unknown inner prop "${x.inner}"`);
        const size = x.innerSize ?? (Math.min(box.w, box.h) / d) * 0.5;
        k.save(); k.setTransform(d, 0, 0, d, box.cx, box.cy);
        if (T.PROP_GROUND.has(x.inner)) k.translate(0, size / 2);
        T.drawProp(k, x.inner, size, lt - (L.at ?? 0), { id: layerId(L) + ':xray' });
        k.restore();
      }
      return mixed(src, c, T.ease.outCubic(T.prog(lt, at, x.dur ?? 0.2)), 'afxxraymix' + depth);
    },
  };
})();
