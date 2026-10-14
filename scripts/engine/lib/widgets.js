// widgets.js — image cutouts (AI-generated characters/props), paper cards, signposts, flipping calendar, parchment map.
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL, W = T.W, H = T.H;
  const inWindows = (wins, lt) => (wins || []).some(([a, b]) => lt >= a && lt <= b);

  // image: { src | frames:{idle,talk,blink}, w, anchor:[ax,ay], talk:[[a,b]], squash }
  // Use for AI-generated cutouts (transparent PNG). Talking swaps to frames.talk at ~8 Hz and adds a tiny squash.
  T.layers.image = (ctx, L, lt, env) => {
    const fr = L.frames || {};
    let src = L.src || fr.idle;
    const talking = inWindows(L.talk, lt); // layer-local time, same rule as bean
    if (talking && fr.talk && Math.floor(lt * 8) % 2 === 0) src = fr.talk;
    const blinkPhase = (lt + (T.hash(src) % 300) / 100) % 3.1;
    if (fr.blink && blinkPhase < 0.12) src = fr.blink;
    const im = T.img(src);
    const w = L.w ?? im.width, h = (im.height / im.width) * w;
    const [ax, ay] = L.anchor ?? [0.5, 1];
    const sq = L.squash !== false ? 1 + Math.sin(lt * Math.PI * 2 * 0.55) * 0.01 + (talking ? Math.abs(T.noise(lt * 8, src)) * 0.015 : 0) : 1;
    ctx.translate(0, (1 - ay) * h);
    ctx.scale(1 / Math.sqrt(sq), sq);
    ctx.translate(0, -(1 - ay) * h);
    if (L.shadow !== false && ay >= 0.95) { ctx.fillStyle = 'rgba(30,15,5,0.25)'; ctx.beginPath(); ctx.ellipse(0, 0, w * 0.35, w * 0.05, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.drawImage(im, -ax * w, -ay * h, w, h);
  };

  // card: parchment note with a title and lines that appear one by one. { w, h, title, lines, every, color }
  T.layers.card = (ctx, L, lt) => {
    const w = L.w ?? 760, h = L.h ?? 460;
    T.outlined(ctx, (k) => T.rrect(k, -w / 2, -h / 2, w, h, 18), L.color ?? '#f6e7c1', { line: 10, shade: (k) => { k.fillStyle = 'rgba(150,100,40,0.18)'; k.fillRect(w * 0.3, -h / 2, w * 0.2, h); } });
    let y = -h / 2 + 90;
    if (L.title) { const ts = T.fitSize(ctx, L.title, 64, w * 0.88); T.toonText(ctx, L.title, 0, y, { size: ts, fill: L.titleColor ?? P.red, stroke: ts * 0.19 }); y += 80; }
    (L.lines || []).forEach((line, i) => {
      const p = T.ease.outCubic(T.prog(lt, 0.25 + i * (L.every ?? 0.45), 0.25));
      if (p <= 0) return;
      ctx.save(); ctx.globalAlpha *= p; ctx.translate((1 - p) * -30, 0);
      ctx.font = T.font(T.fitSize(ctx, line, L.lineSize ?? 46, w * 0.88, 800), 800); ctx.fillStyle = P.ink; ctx.textAlign = 'center';
      ctx.fillText(line, 0, y); ctx.restore();
      y += (L.lineSize ?? 46) * 1.35;
    });
  };

  // sign: wooden board on a post. { text, w }
  T.layers.sign = (ctx, L) => {
    const w = L.w ?? 360, h = 150;
    T.outlined(ctx, (k) => k.rect(-18, -h - 160, 36, h + 160), '#7a5232', { line: 8 });
    ctx.save(); ctx.rotate(-0.05);
    T.outlined(ctx, (k) => T.rrect(k, -w / 2, -h - 230, w, h, 12), '#a8764a', { line: 9, shade: (k) => { k.strokeStyle = 'rgba(60,35,15,0.35)'; k.lineWidth = 4; for (let i = 1; i < 4; i++) { k.beginPath(); k.moveTo(-w / 2, -h - 230 + (i * h) / 4); k.lineTo(w / 2, -h - 230 + (i * h) / 4); k.stroke(); } } });
    const lines = String(L.text).split('\n');
    lines.forEach((ln, i) => T.toonText(ctx, ln, 0, -h - 230 + h / 2 + 18 + (i - (lines.length - 1) / 2) * 52, { size: T.fitSize(ctx, ln, 54, w - 40), fill: '#f4e4c4', stroke: 9, shadow: false }));
    ctx.restore();
  };

  // calendar: page-a-day block. Pages tear off and fly away.
  // { pages:[{head,num}] , every: seconds per page, size, headColor } or { head, from, to, dur } for fast counting.
  T.layers.calendar = (ctx, L, lt) => {
    const s = L.size ?? 420, w = s * 0.86, h = s;
    let pages = L.pages;
    let idx, frac;
    if (!pages) {
      const p = T.easeBy(L.ease || 'outCubic')(T.prog(lt, L.delay ?? 0, L.dur ?? 3)); // same default curve as counter
      const from = L.from ?? 1, to = L.to ?? 31, v = Math.round(T.lerp(from, to, p));
      const dir = Math.sign(to - from) || 1, nextNum = dir > 0 ? Math.min(to, v + 1) : Math.max(to, v - 1);
      pages = [{ head: L.head, num: v }, { head: L.head, num: nextNum }];
      idx = 0; frac = p > 0 && p < 1 ? (lt * 10) % 1 : 0; // tear only while counting
    } else {
      const every = L.every ?? 0.6;
      const pos = Math.max(0, (lt - (L.delay ?? 0)) / every);
      idx = Math.min(pages.length - 1, Math.floor(pos));
      frac = idx >= pages.length - 1 ? 0 : pos - idx;
    }
    const drawPage = (pg, alpha = 1) => {
      ctx.save(); ctx.globalAlpha *= alpha;
      T.outlined(ctx, (k) => T.rrect(k, -w / 2, -h / 2, w, h, 16), '#fbf6ea', { line: 10 });
      T.outlined(ctx, (k) => T.rrect(k, -w / 2, -h / 2, w, h * 0.26, 16), pg.headColor ?? L.headColor ?? P.red, { line: 10 });
      if (pg.head) T.toonText(ctx, String(pg.head), 0, -h / 2 + h * 0.18, { size: T.fitSize(ctx, String(pg.head), h * 0.15, w * 0.85), fill: '#fff', stroke: h * 0.025, shadow: false });
      const num = String(pg.num ?? '');
      ctx.font = T.font(h * 0.46); ctx.textAlign = 'center'; ctx.fillStyle = P.ink;
      ctx.font = T.font(T.fitSize(ctx, num, h * 0.46, w * 0.85));
      ctx.fillText(num, 0, h * 0.28);
      ctx.restore();
    };
    for (const x of [-w * 0.28, w * 0.28]) T.outlined(ctx, (k) => T.rrect(k, x - 14, -h / 2 - 34, 28, 64, 12), '#8a8f96', { line: 7 });
    const next = pages[Math.min(pages.length - 1, idx + 1)];
    if (frac > 0.55 && next) {
      drawPage(next);
      const q = T.ease.in((frac - 0.55) / 0.45);
      ctx.save(); ctx.translate(q * w * 1.2, -q * h * 0.9); ctx.rotate(q * 0.9);
      drawPage(pages[idx], 1 - q * 0.6);
      ctx.restore();
    } else drawPage(pages[idx]);
  };

  // map: parchment-style map. Coordinates are normalized to the map box (default = full frame, centered).
  // { image?, w, h, land:[[cx,cy,rx,ry]], regions:[{pts,color,at,dur}], pins:[{x,y,at,label}], routes:[{pts,at,dur,color}] }
  T.layers.map = (ctx, L, lt, env) => {
    const mw = (L.w ?? 1.1) * W, mh = (L.h ?? 1.1) * H;
    const X = (x) => (x - 0.5) * mw, Y = (y) => (y - 0.5) * mh;
    const EXT = L.extrude ?? 7; // raised-slab look: darker copy shifted down under every land/territory shape
    if (L.image) {
      const im = T.img(L.image);
      ctx.drawImage(im, -mw / 2, -mh / 2, mw, mh);
    } else {
      ctx.fillStyle = L.sea ?? P.sea; ctx.fillRect(-mw / 2, -mh / 2, mw, mh);
      const wr = T.rng(T.hash(env.seed + 'waves')); ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      for (let i = 0; i < (L.waves ?? 26); i++) { const x = (wr() - 0.5) * mw, y = (wr() - 0.5) * mh + Math.sin(lt * 1.5 + i) * 3; ctx.beginPath(); ctx.moveTo(x - 16, y); ctx.quadraticCurveTo(x - 8, y - 8, x, y); ctx.quadraticCurveTo(x + 8, y + 8, x + 16, y); ctx.stroke(); }
      (L.land || []).forEach(([cx, cy, rx, ry], i) => {
        const pts = T.blobPts(X(cx), Y(cy), rx * mw, ry * mh, env.seed + 'land' + i, 22, 0.22);
        ctx.save(); ctx.strokeStyle = L.coast ?? 'rgba(200,220,245,0.85)'; ctx.lineWidth = 30; ctx.beginPath(); T.smoothPath(ctx, pts); ctx.stroke(); ctx.restore(); // coastal glow
        ctx.save(); ctx.translate(0, EXT); T.outlined(ctx, (k) => T.smoothPath(k, pts), T.shade(L.landColor ?? P.land, -0.4), { line: 0 }); ctx.restore();
        T.outlined(ctx, (k) => T.smoothPath(k, pts), L.landColor ?? P.land, { line: 7, ink: '#8a5a20' });
      });
    }
    for (const R of L.regions || []) {
      const p = T.ease.outCubic(T.prog(lt, R.at ?? 0, R.dur ?? 1.2));
      const fade = R.out != null ? 1 - T.prog(lt, R.out, 0.5) : 1;
      if (p <= 0 || fade <= 0) continue;
      const pts = R.pts.map(([x, y]) => [X(x), Y(y)]);
      const cx = pts.reduce((a, q) => a + q[0], 0) / pts.length, cy = pts.reduce((a, q) => a + q[1], 0) / pts.length;
      const rad = Math.max(...pts.map(([x, y]) => Math.hypot(x - cx, y - cy))) * 1.05;
      const col = R.color ?? P.red;
      ctx.save(); ctx.globalAlpha *= fade;
      ctx.beginPath(); ctx.arc(cx, cy, rad * p, 0, Math.PI * 2); ctx.clip();
      ctx.save(); ctx.translate(0, EXT + 2); T.outlined(ctx, (k) => T.smoothPath(k, pts), T.shade(col, -0.42), { line: 0 }); ctx.restore();
      T.outlined(ctx, (k) => T.smoothPath(k, pts), col, { line: 6, ink: R.ink ?? T.shade(col, -0.55), shade: (k) => { k.fillStyle = 'rgba(255,255,255,0.12)'; k.fillRect(cx - rad, cy - rad, rad * 2, rad * 0.6); } });
      if (R.pulse) { ctx.strokeStyle = T.shade(col, 0.3); ctx.lineWidth = 8 + Math.sin(lt * 5) * 4; ctx.globalAlpha *= 0.6 + Math.sin(lt * 5) * 0.3; ctx.beginPath(); T.smoothPath(ctx, pts); ctx.stroke(); }
      ctx.restore();
    }
    // armies: oval clusters of dots that pop in one by one (reference 20:32, 32:36)
    for (const A of L.armies || []) {
      const r = T.rng(T.hash(env.seed + 'army' + A.x + A.y)), n = A.count ?? 40;
      for (let i = 0; i < n; i++) {
        const a = r() * Math.PI * 2, d = Math.sqrt(r()), p = T.ease.outBack(T.prog(lt, (A.at ?? 0) + (i / n) * (A.dur ?? 0.6), 0.15));
        if (p <= 0) continue;
        ctx.fillStyle = A.color ?? '#1d1410'; ctx.beginPath();
        ctx.arc(X(A.x) + Math.cos(a) * d * (A.rx ?? 0.05) * mw, Y(A.y) + Math.sin(a) * d * (A.ry ?? 0.03) * mh, 7 * p, 0, Math.PI * 2); ctx.fill();
      }
    }
    for (const Rt of L.routes || []) {
      const p = T.prog(lt, Rt.at ?? 0, Rt.dur ?? 1.2);
      if (p <= 0) continue;
      const pts = Rt.pts.map(([x, y]) => [X(x), Y(y)]);
      const segs = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]));
      let left = segs.reduce((a, b) => a + b, 0) * p;
      ctx.save(); ctx.setLineDash([26, 18]); ctx.lineDashOffset = -lt * 60; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.strokeStyle = Rt.color ?? P.red;
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 0; i < segs.length && left > 0; i++) {
        const f = Math.min(1, left / segs[i]);
        ctx.lineTo(T.lerp(pts[i][0], pts[i + 1][0], f), T.lerp(pts[i][1], pts[i + 1][1], f));
        left -= segs[i];
      }
      ctx.stroke(); ctx.restore();
    }
    for (const pin of L.pins || []) {
      const p = T.ease.outBack(T.prog(lt, pin.at ?? 0, 0.3));
      if (p <= 0) continue;
      ctx.save(); ctx.translate(X(pin.x), Y(pin.y)); ctx.scale(p, p);
      const pulse = 1 + Math.sin(lt * 5) * 0.08;
      T.outlined(ctx, (k) => k.arc(0, 0, 18 * pulse, 0, Math.PI * 2), pin.color ?? P.red, { line: 6 });
      if (pin.label) T.toonText(ctx, pin.label, 0, -40, { size: pin.size ?? 48 });
      ctx.restore();
    }
  };
})();
