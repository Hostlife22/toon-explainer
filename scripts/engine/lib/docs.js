// docs.js — paper graphics from the reference library: newspaper, document / checklist (ticks + red strikes),
// rubber stamp, hand-drawn chart, ID card, wanted/propaganda poster, quote card, wall statistic.
// Layer: { type:'doc', kind, ... }. Each kind animates its own entrance (the layer default enter is 'none').
// More kinds live in docs2.js (bubble, tv, yearsign, hangsign, nametag, ribbon, lowerthird, mission).
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL;
  T.DOCS = T.DOCS || {};
  T.DEFAULT_ENTER.doc = 'none';
  const INK = P.ink, PAPER = '#f6ecd2', PAPER_DARK = '#d9c49a';
  T.layers.doc = (ctx, L, lt, env) => {
    const fn = T.DOCS[L.kind];
    if (!fn) throw new Error('Unknown doc kind: ' + L.kind);
    fn(ctx, L, lt, env);
  };

  // ---------- shared helpers ----------
  T.docPaper = (ctx, w, h, { color = PAPER, curl = false, line = 8 } = {}) => {
    T.outlined(ctx, (k) => T.rrect(k, -w / 2, -h / 2, w, h, 10), color, {
      line, shade: (k) => { k.fillStyle = 'rgba(140,100,40,0.12)'; k.fillRect(w * 0.18, -h / 2, w * 0.32, h); },
    });
    if (curl) for (const s of [-1, 1]) T.outlined(ctx, (k) => T.rrect(k, -w / 2 - 14, s * h / 2 - 20, w + 28, 40, 18), PAPER_DARK, { line: 7 });
  };
  T.docText = (ctx, text, x, y, size, { color = INK, align = 'left', weight = 800, italic = false, maxW = 0 } = {}) => {
    const s = maxW ? T.fitSize(ctx, String(text), size, maxW, weight) : size;
    ctx.font = (italic ? 'italic ' : '') + T.font(s, weight);
    ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = color;
    ctx.fillText(String(text), x, y);
    return s;
  };
  // Entrance shared by most kinds: 0 -> 1.15 -> 1 pop in ~6 frames with a small settle rotation.
  T.docPop = (ctx, lt, dur = 0.22) => {
    const p = T.ease.outBack(T.prog(lt, 0, dur));
    ctx.scale(Math.max(0.001, p), Math.max(0.001, p));
    ctx.rotate((1 - T.clamp(p)) * 0.08);
  };
  // Portrait of a cast member: bean bust clipped to a box. tone: 'color'|'gray'|['#dark','#light'] duotone.
  T.docPortrait = (ctx, x, y, w, h, who, lt, env, tone = 'color', bg = '#c9d6dc') => {
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.fillStyle = bg; ctx.fillRect(x, y, w, h);
    if (who) {
      const draw = (g) => {
        g.translate(x + w / 2, y + h * 1.58); // head centred in the upper half, shoulders below
        T.layers.bean(g, { type: 'bean', who, size: h * 1.5, view: 'front', expr: 'neutral', blink: false, rock: 0, legs: false }, lt, { ...env, st: null });
      };
      if (tone !== 'color') T.filtered(ctx, 'grayscale(1) contrast(1.15)', draw);
      else { ctx.save(); draw(ctx); ctx.restore(); }
    }
    if (Array.isArray(tone)) {
      ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = tone[1] ?? '#9ab0d8'; ctx.fillRect(x, y, w, h);
      ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = T.shade(tone[0] ?? '#2a3a6a', -0.5); ctx.fillRect(x, y, w, h);
    }
    ctx.restore();
    ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.strokeRect(x, y, w, h);
  };
  const tick = (ctx, x, y, s, p, color) => {
    ctx.strokeStyle = color; ctx.lineWidth = s * 0.22; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x - s * 0.45, y);
    const a = T.clamp(p * 2), b = T.clamp(p * 2 - 1);
    ctx.lineTo(x - s * 0.45 + s * 0.35 * a, y + s * 0.35 * a);
    if (b > 0) ctx.lineTo(x - s * 0.1 + s * 0.65 * b, y + s * 0.35 - s * 0.85 * b);
    ctx.stroke();
  };
  const cross = (ctx, x, y, s, p, color) => {
    ctx.strokeStyle = color; ctx.lineWidth = s * 0.22; ctx.lineCap = 'round';
    const a = T.clamp(p * 2), b = T.clamp(p * 2 - 1);
    ctx.beginPath(); ctx.moveTo(x - s / 2, y - s / 2); ctx.lineTo(x - s / 2 + s * a, y - s / 2 + s * a);
    if (b > 0) { ctx.moveTo(x + s / 2, y - s / 2); ctx.lineTo(x + s / 2 - s * b, y - s / 2 + s * b); }
    ctx.stroke();
  };

  // ---------- newspaper: { masthead, headline, subhead, photo:{who|color}, w, h, grayscale, date } ----------
  T.DOCS.newspaper = (ctx, L, lt, env) => {
    if (L.grayscale) return T.filtered(ctx, 'grayscale(1)', (g) => T.DOCS.newspaper(g, { ...L, grayscale: false }, lt, env));
    T.docPop(ctx, lt);
    const w = L.w ?? 760, h = L.h ?? 980, gray = L.grayscale;
    ctx.save(); // grayscale is applied once by T.filtered above
    T.docPaper(ctx, w, h, { color: L.color ?? '#efe8d6' });
    const top = -h / 2 + 40;
    T.docText(ctx, L.masthead ?? 'THE DAILY TIMES', 0, top + 70, 78, { align: 'center', weight: 900, maxW: w - 60 });
    ctx.fillStyle = INK; ctx.fillRect(-w / 2 + 30, top + 92, w - 60, 6); ctx.fillRect(-w / 2 + 30, top + 132, w - 60, 3);
    T.docText(ctx, L.date ?? '', -w / 2 + 34, top + 124, 24, { weight: 800 });
    const hs = T.docText(ctx, L.headline ?? 'BREAKING NEWS', 0, top + 220, 84, { align: 'center', weight: 900, maxW: w - 60 });
    if (L.subhead) T.docText(ctx, L.subhead, 0, top + 220 + hs * 0.75, 34, { align: 'center', weight: 800, maxW: w - 80 });
    const py = top + 320, ph = h * 0.36, pw = w * 0.58;
    if (L.photo?.who) T.docPortrait(ctx, -w / 2 + 34, py, pw, ph, L.photo.who, lt, env, gray ? 'gray' : 'color', L.photo.bg);
    else { ctx.fillStyle = L.photo?.color ?? '#b9ad94'; ctx.fillRect(-w / 2 + 34, py, pw, ph); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.strokeRect(-w / 2 + 34, py, pw, ph); }
    ctx.fillStyle = 'rgba(42,28,21,0.45)';
    const r = T.rng(T.hash(L.id ?? 'news'));
    for (let y = py + 6; y < h / 2 - 40; y += 22) {
      const inPhoto = y < py + ph;
      const x0 = inPhoto ? -w / 2 + 34 + pw + 24 : -w / 2 + 34, x1 = w / 2 - 34;
      ctx.fillRect(x0, y, (x1 - x0) * (0.7 + r() * 0.3), 8);
    }
    ctx.restore();
  };

  // ---------- document / checklist ----------
  // { title, lines:[...], paper:'sheet'|'scroll', every (reveal), checks:[{row,at,mark}], strikes:[{row,at}],
  //   stamp:{text,at,color}, minimap:{color} }
  T.DOCS.document = (ctx, L, lt, env) => {
    T.docPop(ctx, lt);
    const lines = L.lines || [], w = L.w ?? (L.minimap ? 1100 : 860), rowH = L.rowH ?? 74;
    const h = L.h ?? Math.max(420, 200 + lines.length * rowH);
    T.docPaper(ctx, w, h, { curl: L.paper === 'scroll' });
    let y = -h / 2 + 100;
    if (L.title) { T.docText(ctx, L.title, 0, y, 62, { align: 'center', weight: 900, italic: true, color: L.titleColor ?? INK, maxW: w - 80 }); y += 40; }
    const boxes = L.checks || L.boxes;
    const left = -w / 2 + (boxes ? 120 : 60), textW = w - (boxes ? 180 : 120) - (L.minimap ? w * 0.27 : 0);
    lines.forEach((line, i) => {
      const yy = y + 50 + i * rowH;
      const p = T.prog(lt, 0.15 + i * (L.every ?? 0), 0.2);
      if (p <= 0) return;
      ctx.save(); ctx.globalAlpha *= p;
      if (boxes) { ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.strokeRect(left - 72, yy - 40, 46, 46); }
      T.docText(ctx, line, left, yy, L.lineSize ?? 44, { maxW: textW, weight: 800 });
      ctx.restore();
    });
    for (const c of L.checks || []) {
      const p = T.prog(lt, c.at ?? 0, 0.2);
      if (p > 0) (c.mark === 'x' ? cross : tick)(ctx, left - 49, y + 50 + c.row * rowH - 17, 52, p, c.color ?? (c.mark === 'x' ? '#c8141c' : '#2a8a3a'));
    }
    for (const s of L.strikes || []) {
      const p = T.ease.out(T.prog(lt, s.at ?? 0, 0.25));
      if (p <= 0) continue;
      const yy = y + 50 + s.row * rowH - 14;
      ctx.strokeStyle = s.color ?? '#c8141c'; ctx.lineWidth = 10; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(left - 10, yy + 4); ctx.lineTo(left - 10 + (textW + 20) * p, yy - 4 + Math.sin(p * 9) * 3); ctx.stroke();
    }
    if (L.minimap) {
      const mx = w / 2 - w * 0.15, my = 20, r = T.rng(T.hash(L.id ?? 'mini'));
      const pts = T.blobPts(mx, my, w * 0.1, h * 0.18, (L.id ?? 'doc') + 'mm', 14, 0.3);
      T.outlined(ctx, (k) => T.smoothPath(k, pts), '#d8c08a', { line: 5 });
      const red = T.blobPts(mx + w * 0.03 * (r() - 0.3), my, w * 0.05, h * 0.07, (L.id ?? 'doc') + 'mr', 10, 0.25);
      T.outlined(ctx, (k) => T.smoothPath(k, red), L.minimap.color ?? P.red, { line: 4 });
    }
    if (L.stamp) { ctx.save(); ctx.translate(w * 0.18, h * 0.3); T.DOCS.stamp(ctx, { ...L.stamp, size: L.stamp.size ?? 70 }, lt - (L.stamp.at ?? 0), env); ctx.restore(); }
  };
  T.DOCS.checklist = (ctx, L, lt, env) => T.DOCS.document(ctx, { boxes: true, ...L }, lt, env);

  // ---------- stamp: { text, color, size, tilt } — slams in 1.6 -> 1 over 3 frames with a tiny shake ----------
  T.DOCS.stamp = (ctx, L, lt) => {
    if (lt < 0) return;
    const s = lt < 0.1 ? T.lerp(1.6, 1, lt / 0.1) : 1, size = L.size ?? 110, col = L.color ?? '#c8141c';
    if (lt < 0.25) { const k = (0.25 - lt) * 40; ctx.translate(Math.sin(lt * 90) * k, Math.cos(lt * 70) * k * 0.6); }
    ctx.rotate((L.tilt ?? -12) * T.DEG); ctx.scale(s, s);
    ctx.globalAlpha *= T.clamp(lt / 0.05) * 0.9;
    ctx.font = T.font(size, 900);
    const tw = ctx.measureText(String(L.text ?? 'APPROVED')).width, bw = tw + size * 0.9, bh = size * 1.45;
    ctx.strokeStyle = col; ctx.lineWidth = size * 0.09; ctx.strokeRect(-bw / 2, -bh / 2, bw, bh);
    ctx.lineWidth = size * 0.04; ctx.strokeRect(-bw / 2 + size * 0.16, -bh / 2 + size * 0.16, bw - size * 0.32, bh - size * 0.32);
    ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(L.text ?? 'APPROVED'), 0, size * 0.04);
  };

  // ---------- chart: { chart:'line'|'bar', values, labels, yLabel, color, dur, icons:[{i,prop,at}], callouts:[{i,text,at}] } ----------
  T.DOCS.chart = (ctx, L, lt) => {
    T.docPop(ctx, lt);
    const w = L.w ?? 1100, h = L.h ?? 680, vals = L.values || [1, 2, 3], n = vals.length;
    T.docPaper(ctx, w, h, { color: L.paper === 'grid' ? '#eef5e6' : '#fbf7ee' });
    if (L.paper === 'grid') { ctx.strokeStyle = 'rgba(80,140,80,0.22)'; ctx.lineWidth = 2; for (let x = -w / 2 + 40; x < w / 2; x += 40) { ctx.beginPath(); ctx.moveTo(x, -h / 2 + 6); ctx.lineTo(x, h / 2 - 6); ctx.stroke(); } for (let y = -h / 2 + 40; y < h / 2; y += 40) { ctx.beginPath(); ctx.moveTo(-w / 2 + 6, y); ctx.lineTo(w / 2 - 6, y); ctx.stroke(); } }
    const x0 = -w / 2 + 120, y0 = h / 2 - 100, x1 = w / 2 - 70, y1 = -h / 2 + 90;
    ctx.strokeStyle = INK; ctx.fillStyle = INK; ctx.lineWidth = 9; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x0, y0 + 10); ctx.lineTo(x0, y1 - 20); ctx.moveTo(x0 - 10, y0); ctx.lineTo(x1 + 20, y0); ctx.stroke();
    for (const [ax, ay, dx, dy] of [[x0, y1 - 30, 0, -1], [x1 + 30, y0, 1, 0]]) { ctx.beginPath(); ctx.moveTo(ax + dx * 18, ay + dy * 18); ctx.lineTo(ax - dy * 14, ay + dx * 14); ctx.lineTo(ax + dy * 14, ay - dx * 14); ctx.fill(); }
    if (L.yLabel) { ctx.save(); ctx.translate(x0 - 60, (y0 + y1) / 2); ctx.rotate(-Math.PI / 2); T.docText(ctx, L.yLabel, 0, 0, 40, { align: 'center', weight: 900 }); ctx.restore(); }
    const max = Math.max(...vals) * 1.1 || 1, step = (x1 - x0) / Math.max(1, n - (L.chart === 'bar' ? 0 : 1));
    const px = (i) => (L.chart === 'bar' ? x0 + step * (i + 0.5) : x0 + 30 + i * ((x1 - x0 - 60) / Math.max(1, n - 1)));
    const py = (v) => y0 - (v / max) * (y0 - y1);
    (L.labels || []).forEach((lab, i) => T.docText(ctx, lab, px(i), y0 + 50, 30, { align: 'center', weight: 800 }));
    const prog = T.prog(lt, 0.25, L.dur ?? 1.5), col = L.color ?? '#c8141c';
    if (L.chart === 'bar') {
      vals.forEach((v, i) => {
        const p = T.ease.outBack(T.prog(lt, 0.25 + (i / n) * (L.dur ?? 1.5), 0.3));
        if (p <= 0) return;
        const bh = (y0 - py(v)) * p, bw = step * 0.6;
        T.outlined(ctx, (k) => k.rect(px(i) - bw / 2, y0 - bh, bw, bh), Array.isArray(col) ? col[i % col.length] : col, { line: 6 });
      });
    } else {
      const total = (n - 1) * prog;
      ctx.strokeStyle = col; ctx.lineWidth = 12; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(px(0), py(vals[0]));
      for (let i = 1; i <= Math.floor(total); i++) ctx.lineTo(px(i), py(vals[i]));
      const fi = Math.floor(total), fr = total - fi;
      let hx = px(fi), hy = py(vals[fi]);
      if (fi < n - 1 && fr > 0) { hx = T.lerp(px(fi), px(fi + 1), fr); hy = T.lerp(py(vals[fi]), py(vals[fi + 1]), fr); ctx.lineTo(hx, hy); }
      ctx.stroke();
      for (let i = 0; i <= fi; i++) T.outlined(ctx, (k) => k.arc(px(i), py(vals[i]), 11, 0, Math.PI * 2), '#fff', { line: 5 });
      if (prog >= 1 && L.arrowEnd !== false) { const a = Math.atan2(py(vals[n - 1]) - py(vals[n - 2] ?? vals[n - 1]), px(n - 1) - px(n - 2 ?? 0)); ctx.save(); ctx.translate(hx, hy); ctx.rotate(a); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(34, 0); ctx.lineTo(-6, -20); ctx.lineTo(-6, 20); ctx.fill(); ctx.restore(); }
    }
    for (const ic of L.icons || []) {
      const p = T.ease.outBack(T.prog(lt, ic.at ?? 0, 0.25));
      if (p <= 0) continue;
      ctx.save(); ctx.translate(px(ic.i), py(vals[ic.i]) - (ic.dy ?? 80)); ctx.scale(p, p); T.drawProp(ctx, ic.prop ?? 'coin', ic.size ?? 90, lt, {}); ctx.restore();
    }
    for (const c of L.callouts || []) {
      const p = T.ease.outBack(T.prog(lt, c.at ?? 0, 0.25));
      if (p <= 0) continue;
      ctx.save(); ctx.translate(px(c.i), py(vals[c.i]) - (c.dy ?? 130)); ctx.scale(p, p);
      T.DOCS.bubble(ctx, { text: c.text, w: c.w ?? 300, h: 110, tail: [0, (c.dy ?? 130) - 60], size: 34 }, 1, {});
      ctx.restore();
    }
  };

  // ---------- idcard: { name, sub, line, who, color } — slides in tilted ----------
  T.DOCS.idcard = (ctx, L, lt, env) => {
    const p = T.ease.outCubic(T.prog(lt, 0, 0.28));
    ctx.translate((1 - p) * -500, 0); ctx.rotate((L.tilt ?? -8) * T.DEG);
    const w = L.w ?? 760, h = L.h ?? 440;
    T.outlined(ctx, (k) => T.rrect(k, -w / 2, -h / 2, w, h, 26), L.color ?? '#f3e6c4', { line: 9 });
    ctx.fillStyle = L.band ?? '#3a6fb0'; ctx.fillRect(-w / 2 + 5, -h / 2 + 5, w - 10, 50);
    T.docText(ctx, L.header ?? 'IDENTITY CARD', -w / 2 + 30, -h / 2 + 42, 30, { color: '#fff', weight: 900 });
    T.docPortrait(ctx, -w / 2 + 34, -h / 2 + 80, w * 0.34, h - 120, L.who, lt, env, 'color');
    T.toonText(ctx, L.name ?? 'NAME', w * 0.17, -h * 0.02, { size: T.fitSize(ctx, L.name ?? 'NAME', 74, w * 0.56), fill: L.nameColor ?? P.gold, align: 'center' });
    if (L.sub) T.docText(ctx, L.sub, w * 0.17, h * 0.17, 38, { align: 'center', color: '#3a6fb0', weight: 900, maxW: w * 0.55 });
    if (L.line) T.docText(ctx, L.line, w * 0.17, h * 0.33, 28, { align: 'center', maxW: w * 0.55 });
  };

  // ---------- poster: { title:'WANTED', name, who, duotone:[dark,light], sub } ----------
  T.DOCS.poster = (ctx, L, lt, env) => {
    T.docPop(ctx, lt);
    const w = L.w ?? 600, h = L.h ?? 820;
    ctx.rotate((L.tilt ?? 2) * T.DEG);
    T.docPaper(ctx, w, h, { color: L.color ?? '#efdcae' });
    T.toonText(ctx, L.title ?? 'WANTED', 0, -h / 2 + 120, { size: T.fitSize(ctx, L.title ?? 'WANTED', 110, w - 60), fill: L.titleColor ?? '#c8141c', align: 'center' });
    T.docPortrait(ctx, -w * 0.36, -h / 2 + 160, w * 0.72, h * 0.48, L.who, lt, env, L.duotone ?? ['#2a3a6a', '#9ab0d8']);
    if (L.name) T.docText(ctx, L.name, 0, h * 0.25, 60, { align: 'center', weight: 900, maxW: w - 60 });
    if (L.sub) T.docText(ctx, L.sub, 0, h * 0.37, 36, { align: 'center', maxW: w - 60 });
    for (const [x, y] of [[-w / 2 + 26, -h / 2 + 26], [w / 2 - 26, -h / 2 + 26]]) T.outlined(ctx, (k) => k.arc(x, y, 12, 0, Math.PI * 2), '#c8323a', { line: 5 });
  };

  // ---------- quote: { who, text, author } — grey portrait + italic quote ----------
  T.DOCS.quote = (ctx, L, lt, env) => {
    T.docPop(ctx, lt);
    const w = L.w ?? 1300, h = L.h ?? 460;
    T.outlined(ctx, (k) => T.rrect(k, -w / 2, -h / 2, w, h, 20), L.color ?? '#2b2d33', { line: 8 });
    T.docPortrait(ctx, -w / 2 + 30, -h / 2 + 30, h - 60, h - 60, L.who, lt, env, 'gray', '#8a8d94');
    const tx = -w / 2 + h + 10, maxW = w - h - 50;
    const words = String(L.text ?? '').split(' '), lines = [];
    ctx.font = 'italic ' + T.font(L.size ?? 50, 800);
    let cur = '';
    for (const wd of words) { const t = cur ? cur + ' ' + wd : wd; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = wd; } else cur = t; }
    if (cur) lines.push(cur);
    const shown = Math.ceil(lines.length * T.prog(lt, 0.2, L.dur ?? 0.8));
    lines.slice(0, shown).forEach((ln, i) => T.docText(ctx, (i === 0 ? '“' : '') + ln + (i === lines.length - 1 ? '”' : ''), tx, -h / 2 + 100 + i * (L.size ?? 50) * 1.3, L.size ?? 50, { color: '#f2efe6', italic: true }));
    if (L.author && shown >= lines.length) T.docText(ctx, '– ' + L.author, w / 2 - 40, h / 2 - 40, 38, { color: P.gold, align: 'right', weight: 900 });
  };

  // ---------- stat: { value, words:[...], wall:'brick'|'plaster', color } — giant brush numeral on a wall ----------
  T.DOCS.stat = (ctx, L, lt) => {
    const w = L.w ?? 1500, h = L.h ?? 760;
    ctx.save(); ctx.beginPath(); ctx.rect(-w / 2, -h / 2, w, h); ctx.clip();
    ctx.fillStyle = L.wall === 'plaster' ? '#d9d2c4' : '#b8b0a4'; ctx.fillRect(-w / 2, -h / 2, w, h);
    if (L.wall !== 'plaster') { ctx.strokeStyle = 'rgba(70,60,55,0.35)'; ctx.lineWidth = 4; for (let y = -h / 2, r = 0; y < h / 2; y += 56, r++) { ctx.beginPath(); ctx.moveTo(-w / 2, y); ctx.lineTo(w / 2, y); ctx.stroke(); for (let x = -w / 2 + (r % 2) * 70; x < w / 2; x += 140) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 56); ctx.stroke(); } } }
    ctx.restore();
    const p = T.ease.outBack(T.prog(lt, 0.1, 0.3)), col = L.color ?? '#b3121c';
    ctx.save(); ctx.translate(-w * 0.12, h * 0.12); ctx.scale(p, p); ctx.rotate(-3 * T.DEG);
    ctx.font = T.font(L.size ?? 360, 900); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = col; ctx.fillText(String(L.value ?? '1.5'), 0, 0);
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; for (let i = 0; i < 6; i++) ctx.fillRect(-300 + i * 110, -250 + (i % 3) * 40, 60, 8);
    ctx.restore();
    (L.words || []).forEach((wd, i) => {
      const q = T.ease.outBack(T.prog(lt, 0.4 + i * 0.25, 0.25));
      if (q <= 0) return;
      ctx.save(); ctx.translate(w * 0.27, -h * 0.08 + i * 120); ctx.scale(q, q);
      ctx.font = T.font(96, 900); ctx.textAlign = 'center'; ctx.fillStyle = col; ctx.fillText(wd, 0, 0); ctx.restore();
    });
  };
})();
