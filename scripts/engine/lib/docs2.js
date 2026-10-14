// docs2.js — more `doc` kinds: speech/thought/shout bubble, retro oval TV (and modern monitor), wooden year sign,
// hanging counter sign, "HELLO MY NAME IS" tag, ribbon banner, breaking-news lower third, mission title card.
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL, INK = P.ink;

  // ---------- bubble: { style:'speech'|'thought'|'shout', text, w, h, tail:[dx,dy], size, who } ----------
  T.DOCS.bubble = (ctx, L, lt, env) => {
    const p = T.ease.outBack(T.prog(lt, 0, 0.14)); // 0 -> 1.15 -> 1 pop
    ctx.scale(Math.max(0.001, p), Math.max(0.001, p));
    const w = L.w ?? 560, h = L.h ?? 240, style = L.style ?? 'speech', [tx, ty] = L.tail ?? [-w * 0.25, h * 0.75];
    if (style === 'thought') {
      const pts = T.blobPts(0, 0, w / 2, h / 2, (L.id ?? 'th') + 'b', 14, 0.12);
      T.outlined(ctx, (k) => { pts.forEach(([x, y]) => { k.moveTo(x + h * 0.22, y); k.arc(x, y, h * 0.22, 0, Math.PI * 2); }); k.ellipse(0, 0, w * 0.45, h * 0.42, 0, 0, Math.PI * 2); }, '#fff', { line: 0 });
      ctx.lineWidth = 7; ctx.strokeStyle = INK; pts.forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, h * 0.22, 0, Math.PI * 2); ctx.stroke(); });
      T.outlined(ctx, (k) => k.ellipse(0, 0, w * 0.47, h * 0.44, 0, 0, Math.PI * 2), '#fff', { line: 0 });
      [0.55, 0.78, 0.95].forEach((f, i) => T.outlined(ctx, (k) => k.arc(tx * f, ty * f, 22 - i * 6, 0, Math.PI * 2), '#fff', { line: 6 }));
    } else if (style === 'shout') {
      const n = 18, r = T.rng(T.hash(L.id ?? 'shout'));
      const star = (k) => { for (let i = 0; i <= n * 2; i++) { const a = (i / (n * 2)) * Math.PI * 2, rr = i % 2 ? 0.78 : 1 + r() * 0.12; k.lineTo(Math.cos(a) * w / 2 * rr, Math.sin(a) * h / 2 * rr); } k.closePath(); };
      T.outlined(ctx, star, L.color ?? '#ff5aa8', { line: 8 });
      T.outlined(ctx, (k) => k.ellipse(0, 0, w * 0.36, h * 0.3, 0, 0, Math.PI * 2), '#1d1410', { line: 0 });
    } else {
      T.outlined(ctx, (k) => { k.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2); }, '#fff', { line: 0 });
      T.outlined(ctx, (k) => { k.moveTo(tx * 0.25 - 26, ty * 0.25); k.lineTo(tx, ty); k.lineTo(tx * 0.25 + 26, ty * 0.25 - 10); }, '#fff', { line: 0 });
      ctx.lineWidth = 8; ctx.strokeStyle = INK;
      const a0 = Math.atan2(ty * 0.25, tx * 0.25) + 0.22, a1 = Math.atan2(ty * 0.25, tx * 0.25) - 0.22;
      ctx.beginPath(); ctx.ellipse(0, 0, w / 2, h / 2, 0, a0, a1 + Math.PI * 2); ctx.lineTo(tx, ty); ctx.closePath(); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(0, 0, w / 2 - 4, h / 2 - 4, 0, 0, Math.PI * 2); ctx.fill();
    }
    if (L.who && env && env.cast) { ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, w * 0.4, h * 0.36, 0, 0, Math.PI * 2); ctx.clip(); ctx.translate(0, h * 0.42); T.layers.bean(ctx, { type: 'bean', who: L.who, size: h * 0.8, expr: L.expr ?? 'happy', pose: L.pose ?? 'idle', blink: false }, lt, { ...env, st: null }); ctx.restore(); }
    if (L.text) {
      const lines = String(L.text).split('\n'), size = L.size ?? 46;
      lines.forEach((ln, i) => {
        const s = T.fitSize(ctx, ln, size, w * 0.78, 900), y = (i - (lines.length - 1) / 2) * size * 1.15 + s * 0.35;
        if (style === 'shout') T.toonText(ctx, ln, 0, y, { size: s, fill: '#fff', ink: '#c2186b' });
        else { ctx.font = T.font(s, 900); ctx.textAlign = 'center'; ctx.fillStyle = INK; ctx.fillText(ln, 0, y); }
      });
    }
  };

  // ---------- tv: { style:'oval'|'modern', w, who, text, grayscale, expr, talk } ----------
  T.DOCS.tv = (ctx, L, lt, env) => {
    T.docPop(ctx, lt);
    const w = L.w ?? 900, h = w * (L.style === 'modern' ? 0.6 : 0.62), modern = L.style === 'modern';
    const shell = L.color ?? (modern ? '#2b2d33' : '#e9cf8c');
    if (!modern) {
      ctx.strokeStyle = INK; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(-w * 0.05, -h / 2 + 10); ctx.lineTo(-w * 0.2, -h / 2 - 140); ctx.moveTo(w * 0.05, -h / 2 + 10); ctx.lineTo(w * 0.16, -h / 2 - 120); ctx.stroke();
      [[-w * 0.2, -h / 2 - 140], [w * 0.16, -h / 2 - 120]].forEach(([x, y]) => T.outlined(ctx, (k) => k.arc(x, y, 12, 0, Math.PI * 2), shell, { line: 5 }));
      for (const s of [-1, 1]) T.outlined(ctx, (k) => { k.moveTo(s * w * 0.25, h / 2 - 20); k.lineTo(s * w * 0.32, h / 2 + 70); k.lineTo(s * w * 0.27, h / 2 + 70); k.lineTo(s * w * 0.2, h / 2 - 10); k.closePath(); }, T.shade(shell, -0.3), { line: 6 });
      for (let i = 3; i >= 1; i--) { ctx.save(); ctx.translate(i * 8, i * 6); T.outlined(ctx, (k) => k.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2), T.shade(shell, -0.12 * i), { line: i === 3 ? 8 : 0 }); ctx.restore(); }
      T.outlined(ctx, (k) => k.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2), shell, { line: 8 });
    } else {
      T.outlined(ctx, (k) => T.rrect(k, -w / 2, -h / 2, w, h, 22), shell, { line: 8 });
      T.outlined(ctx, (k) => k.rect(-w * 0.08, h / 2, w * 0.16, 60), T.shade(shell, 0.1), { line: 6 });
      T.outlined(ctx, (k) => T.rrect(k, -w * 0.22, h / 2 + 50, w * 0.44, 26, 10), T.shade(shell, 0.1), { line: 6 });
    }
    const sw = modern ? w - 60 : w * 0.78, sh = modern ? h - 60 : h * 0.72;
    ctx.save();
    ctx.beginPath(); if (modern) ctx.rect(-sw / 2, -sh / 2, sw, sh); else ctx.ellipse(0, -h * 0.03, sw / 2, sh / 2, 0, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = L.screen ?? '#6c7472'; ctx.fillRect(-sw / 2, -sh / 2 - h * 0.03, sw, sh);
    if (L.who) {
      const draw = (g) => { g.translate(0, sh * 0.62); T.layers.bean(g, { type: 'bean', who: L.who, size: sh * 1.05, expr: L.expr ?? 'neutral', pose: L.pose ?? 'idle', talk: L.talk ?? [[0, 1e6]], view: L.view ?? '3q' }, lt, { ...env, st: null }); };
      if (L.grayscale !== false) T.filtered(ctx, 'grayscale(1) contrast(1.1)', draw);
      else { ctx.save(); draw(ctx); ctx.restore(); }
    }
    if (L.text) T.toonText(ctx, L.text, 0, sh * 0.15, { size: T.fitSize(ctx, L.text, 90, sw * 0.8), fill: '#fff' });
    ctx.fillStyle = 'rgba(0,0,0,0.16)'; for (let y = -sh / 2 - 40; y < sh / 2; y += 6) ctx.fillRect(-sw / 2, y, sw, 2);
    const g = ctx.createRadialGradient(0, 0, sh * 0.2, 0, 0, sw * 0.6); g.addColorStop(0, 'rgba(255,255,255,0.06)'); g.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = g; ctx.fillRect(-sw / 2, -sh / 2 - 40, sw, sh + 80);
    ctx.restore();
    if (!modern) for (const [x, c] of [[-w * 0.06, '#d03a2a'], [w * 0.06, '#8fbf3a']]) T.outlined(ctx, (k) => k.arc(x, h * 0.43, 12, 0, Math.PI * 2), c, { line: 5 });
  };

  // ---------- yearsign: plank on a post stuck in the sea { text:'YEAR', num, strike:{at,num}, splash } ----------
  T.DOCS.yearsign = (ctx, L, lt) => {
    const drop = T.ease.outBounce(T.prog(lt, 0, 0.3));
    ctx.translate(0, (1 - drop) * -500);
    T.outlined(ctx, (k) => k.rect(-16, -40, 32, 300), '#7a5232', { line: 7 });
    if (L.splash !== false) { const sp = Math.sin(lt * 4) * 4; ctx.strokeStyle = '#fff'; ctx.lineWidth = 6; ctx.lineCap = 'round'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 24, 255); ctx.quadraticCurveTo(s * 60, 228 + sp, s * 90, 250); ctx.stroke(); } }
    ctx.rotate((L.tilt ?? -14) * T.DEG);
    const w = L.w ?? 520, h = 210;
    T.outlined(ctx, (k) => T.rrect(k, -w / 2, -h - 40, w, h, 14), '#a8764a', { line: 9, shade: (k) => { k.strokeStyle = 'rgba(60,35,15,0.35)'; k.lineWidth = 4; for (let i = 1; i < 4; i++) { k.beginPath(); k.moveTo(-w / 2, -h - 40 + (i * h) / 4); k.lineTo(w / 2, -h - 40 + (i * h) / 4); k.stroke(); } } });
    T.toonText(ctx, L.text ?? 'YEAR', 0, -h + 16, { size: 52, fill: '#f4e4c4', stroke: 9, shadow: false });
    const st = L.strike, strikeP = st ? T.prog(lt, st.at ?? 1, 0.2) : 0;
    T.toonText(ctx, String(L.num ?? '711'), 0, -62, { size: 104, fill: '#f4e4c4', stroke: 14, shadow: false });
    if (strikeP > 0) {
      ctx.strokeStyle = '#c8141c'; ctx.lineWidth = 14; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-w * 0.32, -96); ctx.lineTo(-w * 0.32 + w * 0.64 * strikeP, -110); ctx.stroke();
      const q = T.ease.outBack(T.prog(lt, (st.at ?? 1) + 0.2, 0.25));
      if (q > 0) { ctx.save(); ctx.translate(w * 0.28, -h - 30); ctx.rotate(12 * T.DEG); ctx.scale(q, q); T.toonText(ctx, String(st.num), 0, 0, { size: 86, fill: '#ffe066' }); ctx.restore(); }
    }
  };

  // ---------- hangsign: board on two ropes { title, num, swap:{at,num} } — drops in with a decaying swing ----------
  T.DOCS.hangsign = (ctx, L, lt) => {
    const p = T.prog(lt, 0, 0.22), settle = lt > 0.22 ? Math.exp(-(lt - 0.22) * 5) : 1;
    const y = (1 - T.ease.in(p)) * -700 + Math.sin((lt - 0.22) * 14) * 24 * (lt > 0.22 ? settle : 0);
    const sway = Math.sin(lt * 6) * 3 * settle;
    const w = L.w ?? 620, h = L.h ?? 360;
    ctx.strokeStyle = '#b8955a'; ctx.lineWidth = 7;
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * w * 0.32, -1400); ctx.lineTo(s * w * 0.32, y - h / 2); ctx.stroke(); }
    ctx.translate(0, y); ctx.rotate(sway * T.DEG);
    T.outlined(ctx, (k) => T.rrect(k, -w / 2, -h / 2, w, h, 16), '#8a5a32', { line: 9, shade: (k) => { k.strokeStyle = 'rgba(40,20,5,0.35)'; k.lineWidth = 4; for (let i = 1; i < 5; i++) { k.beginPath(); k.moveTo(-w / 2, -h / 2 + (i * h) / 5); k.lineTo(w / 2, -h / 2 + (i * h) / 5); k.stroke(); } } });
    T.toonText(ctx, L.title ?? 'TIMES CHINA FELL APART', 0, -h / 2 + 70, { size: T.fitSize(ctx, L.title ?? '', 46, w - 50), fill: '#f4e4c4', stroke: 9, shadow: false });
    const card = (num, rot, a = 1) => { ctx.save(); ctx.globalAlpha *= a; ctx.rotate(rot * T.DEG); T.outlined(ctx, (k) => T.rrect(k, -90, -70, 180, 210, 12), '#fbf6ea', { line: 8 }); ctx.font = T.font(150, 900); ctx.textAlign = 'center'; ctx.fillStyle = INK; ctx.fillText(String(num), 0, 110); ctx.restore(); };
    ctx.translate(0, -10);
    const sw = L.swap, sp = sw ? T.prog(lt, sw.at ?? 1, 0.25) : 0;
    card(L.num ?? 0, 0);
    if (sp > 0) {
      ctx.strokeStyle = '#c8141c'; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(-70, 40); ctx.lineTo(-70 + 140 * T.clamp(sp * 2), 70); ctx.stroke();
      const q = T.clamp(sp * 2 - 1);
      if (q > 0) { ctx.save(); ctx.translate((1 - q) * 300, (1 - q) * -200); card(sw.num, 15, q); ctx.restore(); }
    }
  };

  // ---------- nametag: { name, header, sub, color } ----------
  T.DOCS.nametag = (ctx, L, lt) => {
    T.docPop(ctx, lt);
    const w = L.w ?? 420, h = L.h ?? 280, col = L.color ?? '#d0312d';
    ctx.rotate((L.tilt ?? -6) * T.DEG);
    T.outlined(ctx, (k) => T.rrect(k, -w / 2, -h / 2, w, h, 22), col, { line: 8 });
    T.docText(ctx, L.header ?? 'HELLO', 0, -h / 2 + 66, 58, { align: 'center', color: '#fff', weight: 900 });
    T.docText(ctx, L.sub ?? 'MY NAME IS', 0, -h / 2 + 100, 26, { align: 'center', color: '#fff', weight: 800 });
    ctx.fillStyle = '#fff'; ctx.fillRect(-w / 2 + 18, -h / 2 + 118, w - 36, h - 150);
    T.docText(ctx, L.name ?? 'NAME', 0, h / 2 - 50, 64, { align: 'center', color: L.nameColor ?? INK, weight: 900, maxW: w - 60 });
  };

  // ---------- ribbon: banner with folded tails { text, color, w } ----------
  T.DOCS.ribbon = (ctx, L, lt) => {
    const p = T.ease.outCubic(T.prog(lt, 0, 0.3)), w = (L.w ?? 1100) * p, h = L.h ?? 130, col = L.color ?? '#efdcae', dark = T.shade(col, -0.3);
    if (w < 10) return;
    for (const s of [-1, 1]) {
      T.outlined(ctx, (k) => { k.moveTo(s * (w / 2 - 20), -h / 2 + 30); k.lineTo(s * (w / 2 + 110), -h / 2 + 30); k.lineTo(s * (w / 2 + 70), 30); k.lineTo(s * (w / 2 + 110), h / 2 + 30); k.lineTo(s * (w / 2 - 20), h / 2 + 30); k.closePath(); }, dark, { line: 8 });
    }
    T.outlined(ctx, (k) => { k.moveTo(-w / 2, -h / 2); k.quadraticCurveTo(0, -h / 2 - 26, w / 2, -h / 2); k.lineTo(w / 2, h / 2); k.quadraticCurveTo(0, h / 2 - 26, -w / 2, h / 2); k.closePath(); }, col, { line: 9 });
    if (p > 0.7) T.docText(ctx, L.text ?? 'BANNER', 0, 20, T.fitSize(ctx, L.text ?? 'BANNER', L.size ?? 72, w * 0.85, 900), { align: 'center', weight: 900, color: L.textColor ?? INK });
  };

  // ---------- lowerthird: { tag:'BREAKING NEWS', headline, ticker } — HUD by default (bottom of frame) ----------
  T.DOCS.lowerthird = (ctx, L, lt, env) => {
    T.hudReset(ctx, L, env);
    const p = T.ease.outCubic(T.prog(lt, 0, 0.3)), W = T.W;
    ctx.translate((1 - p) * -W, 0);
    T.outlined(ctx, (k) => k.rect(-W / 2 + 60, -60, W - 120, 120), L.color ?? '#c8141c', { line: 8 });
    T.outlined(ctx, (k) => k.rect(-W / 2 + 60, -110, 420, 56), '#fff', { line: 7 });
    T.docText(ctx, L.tag ?? 'BREAKING NEWS', -W / 2 + 270, -68, 38, { align: 'center', color: '#c8141c', weight: 900 });
    T.docText(ctx, L.headline ?? 'HEADLINE', -W / 2 + 100, 22, 64, { color: '#fff', weight: 900, maxW: W - 260 });
    if (L.ticker) {
      ctx.save(); ctx.beginPath(); ctx.rect(-W / 2 + 60, 60, W - 120, 60); ctx.clip();
      ctx.fillStyle = '#1d2a5a'; ctx.fillRect(-W / 2 + 60, 60, W - 120, 60);
      ctx.font = T.font(36, 800); const tw = ctx.measureText(L.ticker + '   •   ').width;
      const off = -((lt * 160) % tw);
      ctx.fillStyle = '#ffe066'; ctx.textAlign = 'left';
      for (let x = -W / 2 + 60 + off; x < W / 2; x += tw) ctx.fillText(L.ticker + '   •   ', x, 103);
      ctx.restore();
    }
  };

  // ---------- mission: { small:'FIRST MISSION:', word } — huge bevelled word punches in over ~6 frames ----------
  T.DOCS.mission = (ctx, L, lt) => {
    const p = T.prog(lt, 0.12, 0.2), s = p <= 0 ? 0 : T.lerp(1.3, 1, T.ease.out(p));
    const word = String(L.word ?? 'SURVIVE'), size = T.fitSize(ctx, word, L.size ?? 220, T.W * 0.85);
    T.docText(ctx, L.small ?? 'MISSION:', 0, -size * 0.95, 54, { align: 'center', color: L.smallColor ?? '#c9c9c9', weight: 900 });
    if (s <= 0) return;
    ctx.save(); ctx.scale(s, s);
    for (let i = 6; i >= 1; i--) T.toonText(ctx, word, i * 3, i * 4, { size, fill: T.shade(L.color ?? '#ffffff', -0.45), shadow: false, stroke: size * 0.16 });
    T.toonText(ctx, word, 0, 0, { size, fill: L.color ?? '#ffffff' });
    ctx.restore();
  };
})();
