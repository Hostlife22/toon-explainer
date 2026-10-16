// paper-paint.js — painted paper for the doc layer and two new paper kinds.
// Under style.look "painted" every T.docPaper sheet (newspaper, document, chart, poster, ...) becomes aged paper: a
// soft drop shadow, a light-to-shade wash, burnt edges, paper-fibre texture, fold creases and coffee stains (doc layer
// fields folds: 0..3, stains: 0..3), and rubber stamps get uneven ink (grunge). Classic output is untouched.
// New kinds (both looks): front-page (newspaper front page with masthead, banner headline, photo, columns) and letter
// (handwritten letter: scribbled lines that write on, salutation, signature, wax seal).
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL, TAU = Math.PI * 2, h32 = T.h32;
  const INK = P.ink;
  let DOC = null; // {P, L} of the doc layer being drawn
  const baseLayer = T.layers.doc;
  T.layers.doc = (ctx, L, lt, env) => {
    const prev = DOC;
    DOC = { P: T.paintedState(env, L), L };
    try { return baseLayer(ctx, L, lt, env); } finally { DOC = prev; }
  };

  // ---------- painted sheet ----------
  const baseSheet = T.docPaper;
  T.docPaperClassic = baseSheet;
  function agedSheet(ctx, w, h, o) {
    const color = T.hex6(o.color ?? '#f6ecd2'), L = DOC.L || {}, seed = T.hash((L.id ?? L.kind ?? 'doc') + ':paper'), m = Math.min(w, h);
    for (let i = 3; i >= 1; i--) { ctx.fillStyle = `rgba(30,15,5,${(0.07 * (4 - i)).toFixed(3)})`; ctx.beginPath(); T.rrect(ctx, -w / 2 + i * 6, -h / 2 + i * 8, w, h, 12); ctx.fill(); } // soft drop shadow
    T.outlined(ctx, (k) => T.rrect(k, -w / 2, -h / 2, w, h, 10), color, { line: o.line ?? 8, paint: false, shade: (k) => {
      const g = k.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2); g.addColorStop(0, 'rgba(255,255,240,0.22)'); g.addColorStop(0.55, 'rgba(255,255,240,0)'); g.addColorStop(1, 'rgba(110,70,30,0.16)');
      k.fillStyle = g; k.fillRect(-w / 2, -h / 2, w, h);
      if (T.fillTexture) T.fillTexture(k, null, 'paper', { rect: [-w / 2, -h / 2, w, h], alpha: 0.75, scale: 0.8, seed: seed % 5 });
      const e = m * 0.07; // burnt / yellowed edges
      for (const [x0, y0, x1, y1, rx, ry, rw, rh] of [[-w / 2, 0, -w / 2 + e, 0, -w / 2, -h / 2, e, h], [w / 2, 0, w / 2 - e, 0, w / 2 - e, -h / 2, e, h], [0, -h / 2, 0, -h / 2 + e, -w / 2, -h / 2, w, e], [0, h / 2, 0, h / 2 - e, -w / 2, h / 2 - e, w, e]]) {
        const eg = k.createLinearGradient(x0, y0, x1, y1); eg.addColorStop(0, 'rgba(150,95,30,0.32)'); eg.addColorStop(1, 'rgba(150,95,30,0)'); k.fillStyle = eg; k.fillRect(rx, ry, rw, rh);
      }
      const folds = L.folds ?? 1; // creases: horizontal thirds / halves, then a vertical one
      const ys = folds >= 2 ? [-h / 6, h / 6] : folds >= 1 ? [0] : [];
      for (const y of ys) crease(k, -w / 2, y, w / 2, y + h * 0.004, m);
      if (folds >= 3) crease(k, 0, -h / 2, w * 0.004, h / 2, m);
      for (let i = 0; i < (L.stains ?? 1); i++) { // coffee rings
        const sx = (h32(seed, i, 1) - 0.5) * w * 0.7, sy = (h32(seed, i, 2) - 0.5) * h * 0.7, r = m * (0.07 + 0.06 * h32(seed, i, 3));
        k.fillStyle = 'rgba(150,95,40,0.08)'; k.beginPath(); k.arc(sx, sy, r, 0, TAU); k.fill();
        k.strokeStyle = 'rgba(130,80,30,0.26)'; k.lineWidth = r * 0.09; k.beginPath(); k.arc(sx, sy, r, h32(seed, i, 4) * TAU, h32(seed, i, 4) * TAU + TAU * 0.86); k.stroke();
      }
    } });
    if (o.curl) for (const s of [-1, 1]) T.outlined(ctx, (k) => T.rrect(k, -w / 2 - 14, s * h / 2 - 20, w + 28, 40, 18), '#d9c49a', { line: 7, paint: false, shade: (k) => { k.fillStyle = 'rgba(255,255,255,0.35)'; k.fillRect(-w / 2 - 14, s * h / 2 - 16, w + 28, 8); k.fillStyle = 'rgba(90,60,20,0.25)'; k.fillRect(-w / 2 - 14, s * h / 2 + 6, w + 28, 12); } });
  }
  function crease(k, x0, y0, x1, y1, m) {
    const lw = Math.max(1.5, m * 0.004), dx = x1 - x0, dy = y1 - y0, n = Math.hypot(dx, dy) || 1, nx = -dy / n, ny = dx / n;
    k.lineWidth = lw * 3; k.strokeStyle = 'rgba(110,70,30,0.12)'; k.beginPath(); k.moveTo(x0 + nx * lw * 2, y0 + ny * lw * 2); k.lineTo(x1 + nx * lw * 2, y1 + ny * lw * 2); k.stroke();
    k.lineWidth = lw; k.strokeStyle = 'rgba(90,55,20,0.35)'; k.beginPath(); k.moveTo(x0, y0); k.lineTo(x1, y1); k.stroke();
    k.strokeStyle = 'rgba(255,255,245,0.6)'; k.beginPath(); k.moveTo(x0 - nx * lw * 1.5, y0 - ny * lw * 1.5); k.lineTo(x1 - nx * lw * 1.5, y1 - ny * lw * 1.5); k.stroke();
  }
  T.docPaper = (ctx, w, h, o = {}) => (DOC && DOC.P ? agedSheet(ctx, w, h, o) : baseSheet(ctx, w, h, o));

  // ---------- grungy stamp ink ----------
  let grunge = null;
  function grungeTile() {
    if (grunge) return grunge;
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d');
    for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(0,0,0,${(0.25 + h32(17, i, 1) * 0.75).toFixed(3)})`; g.beginPath(); g.arc(h32(17, i, 2) * 128, h32(17, i, 3) * 128, 0.6 + h32(17, i, 4) * 2.4, 0, TAU); g.fill(); }
    for (let i = 0; i < 14; i++) { g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 1 + h32(18, i, 1) * 2; const x = h32(18, i, 2) * 128, y = h32(18, i, 3) * 128; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 10 + h32(18, i, 4) * 30, y + (h32(18, i, 5) - 0.5) * 6); g.stroke(); }
    grunge = c;
    return c;
  }
  const baseStamp = T.DOCS.stamp;
  T.DOCS.stamp = (ctx, L, lt, env) => {
    if (!(DOC && DOC.P) || lt < 0) return baseStamp(ctx, L, lt, env);
    T.filtered(ctx, 'opacity(0.95)', (g) => {
      g.save(); try { baseStamp(g, L, lt, env); } finally { g.restore(); } // the scratch context is reused: keep its state clean
      g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'destination-out';
      const pat = g.createPattern(grungeTile(), 'repeat'), r = T.hash(L.text ?? 'stamp');
      pat.setTransform(new DOMMatrix().translate(r % 97, (r >> 8) % 89).scale(Math.max(1, g.canvas.width / 1920) * 1.4));
      g.fillStyle = pat; g.globalAlpha = 0.7; g.fillRect(0, 0, g.canvas.width, g.canvas.height);
      g.restore();
    });
  };

  // ---------- front-page ----------
  // {masthead, date, price, edition, headline ("\n" splits lines), subhead, photo:{who | prop | color, caption}, stories:[{title}], w, h, grayscale}
  const bars = (ctx, x0, x1, y0, y1, step, seed, a = 0.5) => { ctx.fillStyle = `rgba(42,28,21,${a})`; let i = 0; for (let y = y0; y < y1; y += step, i++) ctx.fillRect(x0, y, (x1 - x0) * (h32(seed, i, 1) < 0.12 ? 0.55 : 0.82 + 0.18 * h32(seed, i, 2)), step * 0.36); };
  T.DOCS['front-page'] = (ctx, L, lt, env) => {
    if (L.grayscale) return T.filtered(ctx, 'grayscale(1) sepia(0.15)', (g) => { g.save(); try { T.DOCS['front-page'](g, { ...L, grayscale: false }, lt, env); } finally { g.restore(); } });
    T.docPop(ctx, lt);
    const w = L.w ?? 820, h = L.h ?? 1060, x0 = -w / 2 + 34, x1 = w / 2 - 34, seed = T.hash(L.id ?? 'front');
    T.docPaper(ctx, w, h, { color: L.color ?? '#efe8d6' });
    let y = -h / 2 + 44;
    ctx.fillStyle = INK; ctx.fillRect(x0, y, x1 - x0, 5);
    T.docText(ctx, L.masthead ?? 'THE DAILY HERALD', 0, y + 92, 92, { align: 'center', weight: 900, maxW: w - 80 });
    y += 112; ctx.fillRect(x0, y, x1 - x0, 7); ctx.fillRect(x0, y + 40, x1 - x0, 3);
    T.docText(ctx, L.date ?? '', x0 + 4, y + 30, 22, { weight: 800 });
    T.docText(ctx, L.price ?? 'ONE CENT', x1 - 4, y + 30, 22, { weight: 800, align: 'right' });
    T.docText(ctx, L.edition ?? 'LATE EDITION', 0, y + 30, 22, { weight: 900, align: 'center' });
    y += 50;
    const lines = String(L.headline ?? 'EXTRA! EXTRA!').split('\n');
    for (const ln of lines) { const sz = T.docText(ctx, ln, 0, y + 92, 104, { align: 'center', weight: 900, maxW: w - 70 }); y += sz * 0.98; }
    if (L.subhead) { T.docText(ctx, L.subhead, 0, y + 44, 34, { align: 'center', weight: 800, italic: true, maxW: w - 90 }); y += 52; }
    y += 22; ctx.fillStyle = INK; ctx.fillRect(x0, y, x1 - x0, 3); y += 18;
    const pw = (x1 - x0) * 0.62, ph = Math.min(h * 0.32, h / 2 - 150 - y), gap = 22;
    if (L.photo?.who) T.docPortrait(ctx, x0, y, pw, ph, L.photo.who, lt, env, 'gray', L.photo.bg ?? '#b9b2a4');
    else {
      ctx.save(); ctx.beginPath(); ctx.rect(x0, y, pw, ph); ctx.clip();
      ctx.fillStyle = L.photo?.color ?? '#a9a08c'; ctx.fillRect(x0, y, pw, ph);
      if (L.photo?.prop && T.PROPS[L.photo.prop]) { ctx.save(); ctx.translate(x0 + pw / 2, y + ph * (T.PROP_GROUND.has(L.photo.prop) ? 0.92 : 0.52)); T.drawProp(ctx, L.photo.prop, ph * 0.78, lt, {}); ctx.restore(); }
      ctx.fillStyle = 'rgba(42,28,21,0.16)'; // halftone screen
      for (let yy = y + 3; yy < y + ph; yy += 7) for (let xx = x0 + ((yy / 7) % 2) * 3.5; xx < x0 + pw; xx += 7) { ctx.beginPath(); ctx.arc(xx, yy, 1.6, 0, TAU); ctx.fill(); }
      ctx.restore(); ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.strokeRect(x0, y, pw, ph);
    }
    if (L.photo?.caption) T.docText(ctx, L.photo.caption, x0, y + ph + 26, 20, { weight: 800, italic: true, maxW: pw });
    const cx = x0 + pw + gap; // side column: a story title and text
    const st = (L.stories || [])[0];
    T.docText(ctx, st?.title ?? 'MORE INSIDE', cx, y + 26, 26, { weight: 900, maxW: x1 - cx });
    bars(ctx, cx, x1, y + 44, y + ph + 30, 18, seed);
    y += ph + 48; ctx.fillStyle = INK; ctx.fillRect(x0, y, x1 - x0, 3); y += 14;
    const ncol = 3, cw = (x1 - x0 - gap * (ncol - 1)) / ncol;
    for (let c = 0; c < ncol; c++) {
      const sx = x0 + c * (cw + gap), s2 = (L.stories || [])[c + 1];
      T.docText(ctx, s2?.title ?? ['WAR BONDS', 'WEATHER', 'MARKETS'][c], sx, y + 26, 24, { weight: 900, maxW: cw });
      bars(ctx, sx, sx + cw, y + 42, h / 2 - 34, 17, seed + c + 1);
      if (c) { ctx.fillStyle = 'rgba(42,28,21,0.5)'; ctx.fillRect(sx - gap / 2 - 1, y, 2, h / 2 - 40 - y); }
    }
  };

  // ---------- letter ----------
  // {title (salutation), lines: count or [strings], write (seconds to write all lines; 0 = already written), signature,
  //  seal (wax colour), color, ink, w, h, folds (default 2), stains}
  function scribble(ctx, x0, x1, y, seed, p, lw) {
    const xe = T.lerp(x0, x1, T.clamp(p));
    if (xe <= x0 + 1) return;
    ctx.beginPath(); ctx.moveTo(x0, y);
    for (let x = x0, i = 0; x <= xe; x += 5, i++) {
      const loop = h32(seed, Math.floor(i / 4), 1), up = loop < 0.22 ? -lw * 3.4 : loop > 0.9 ? lw * 2.2 : 0; // ascenders and descenders
      ctx.lineTo(x, y + Math.sin(i * 1.7 + seed) * lw * 1.3 + (i % 4 === 2 ? up : 0));
      if (h32(seed, i, 2) < 0.05) { x += 12; ctx.moveTo(x, y); } // word gap
    }
    ctx.stroke();
  }
  T.DOCS.letter = (ctx, L, lt, env) => {
    T.docPop(ctx, lt);
    const w = L.w ?? 760, h = L.h ?? 980, x0 = -w / 2 + 70, x1 = w / 2 - 70, seed = T.hash(L.id ?? 'letter'), ink = L.ink ?? '#22305a';
    const Lp = { ...L, folds: L.folds ?? 2 };
    const prev = DOC; if (DOC) DOC = { ...DOC, L: Lp };
    try { T.docPaper(ctx, w, h, { color: L.color ?? '#f4ecd8' }); } finally { DOC = prev; }
    let y = -h / 2 + 110;
    ctx.strokeStyle = 'rgba(120,140,170,0.25)'; ctx.lineWidth = 2; // ruled lines
    for (let yy = y + 70; yy < h / 2 - 150; yy += 54) { ctx.beginPath(); ctx.moveTo(x0 - 20, yy + 10); ctx.lineTo(x1 + 20, yy + 10); ctx.stroke(); }
    if (L.title) { T.docText(ctx, L.title, x0, y, 44, { weight: 700, italic: true, color: ink, maxW: x1 - x0 }); y += 70; } else y += 20;
    const texts = Array.isArray(L.lines) ? L.lines : null, n = texts ? texts.length : (L.lines ?? 9), wr = L.write ?? 0;
    ctx.strokeStyle = ink; ctx.fillStyle = ink; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 3.4;
    for (let i = 0; i < n && y < h / 2 - 170; i++, y += 54) {
      const p = wr > 0 ? T.clamp((lt - 0.25) / wr * n - i) : 1, end = i === n - 1 ? 0.55 : 0.86 + 0.14 * h32(seed, i, 7);
      if (texts) { ctx.save(); ctx.beginPath(); ctx.rect(x0 - 4, y - 50, (x1 - x0) * p + 8, 70); ctx.clip(); T.docText(ctx, texts[i], x0, y, 34, { weight: 600, italic: true, color: ink, maxW: x1 - x0 }); ctx.restore(); }
      else scribble(ctx, x0, T.lerp(x0, x1, end), y, seed + i * 31, p, 3.4);
    }
    const sp = wr > 0 ? T.clamp((lt - 0.25 - wr) / 0.6) : 1;
    if (L.signature !== false && sp > 0) {
      const sy = h / 2 - 150;
      T.docText(ctx, 'Yours faithfully,', x1 - 300, sy - 50, 26, { weight: 600, italic: true, color: ink });
      ctx.lineWidth = 4; scribble(ctx, x1 - 300, x1 - 40, sy, seed + 999, sp, 6);
      if (typeof L.signature === 'string') T.docText(ctx, L.signature, x1 - 300, sy + 46, 26, { weight: 800, color: ink, maxW: 260 });
    }
    if (L.seal) {
      const sx = x0 + 40, sy2 = h / 2 - 120, r = 54, col = T.hex6(L.seal === true ? '#a01822' : L.seal);
      T.outlined(ctx, (k) => T.smoothPath(k, T.blobPts(sx, sy2, r, r * 0.94, 'seal' + seed, 14, 0.12)), col, { line: 5, paint: false, shade: (k) => { k.fillStyle = T.shade(col, -0.25); k.beginPath(); k.arc(sx + 6, sy2 + 6, r * 0.66, 0, TAU); k.fill(); k.fillStyle = T.shade(col, 0.2); k.beginPath(); k.arc(sx, sy2, r * 0.62, 0, TAU); k.fill(); k.fillStyle = 'rgba(255,255,255,0.4)'; k.beginPath(); k.ellipse(sx - r * 0.3, sy2 - r * 0.36, r * 0.22, r * 0.1, -0.6, 0, TAU); k.fill(); } });
      T.docText(ctx, L.sealText ?? 'R', sx, sy2 + 16, 46, { align: 'center', weight: 900, color: T.shade(col, -0.4) });
    }
  };
})();
