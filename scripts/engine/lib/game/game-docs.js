// game-docs.js — game-UI kit, part 2: game-screen `doc` kinds (VS card, challenger, joins-the-battle, sequel strips,
// menus, pause, loading, insert disk, weapon wheel, item carousel, RPG dialog, OS error, upgrade button, kill feed,
// highscore, meanwhile, to-be-continued, trade offer, slides), merged into T.DOCS. Helpers come from game-ui.js (T.GAME_UI).
(function () {
  'use strict'; const T = window.TOON, P = T.PAL, W = T.W, H = T.H, F = 1 / 30;
  const UI = '#1a1a1f'; // UI ink: darker and colder than the character ink
  const D = T.DOCS;
  const { screen, abs, pop, frames, arr, uiText, textW, button, warnTri, prop, bust, wrap, backdrop, drawCursor, clickRing, hopCursor } = T.GAME_UI;

  // ---------- doc kinds: splash cards ----------
  const rays = (ctx, n, c1, c2, core = '#ffffff', rot = 0) => {
    ctx.fillStyle = c2; ctx.fillRect(-W, -H, W * 2, H * 2); ctx.fillStyle = c1;
    for (let i = 0; i < n; i += 2) {
      const a0 = rot + (i / n) * Math.PI * 2, a1 = rot + ((i + 1) / n) * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a0) * W * 1.5, Math.sin(a0) * W * 1.5); ctx.lineTo(Math.cos(a1) * W * 1.5, Math.sin(a1) * W * 1.5); ctx.closePath(); ctx.fill();
    }
    if (core) { const g = ctx.createRadialGradient(0, 0, 0, 0, 0, W * 0.3); g.addColorStop(0, core); g.addColorStop(0.5, T.mix(core, c1, 0.4) + 'aa'); g.addColorStop(1, c1 + '00'); ctx.fillStyle = g; ctx.fillRect(-W, -H, W * 2, H * 2); }
  };
  const eyeGlow = (ctx, x, y, color, lt) => {
    const r = 30 * (1 + 0.08 * Math.sin(lt * 20));
    const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, '#ffffff'); g.addColorStop(0.18, color); g.addColorStop(1, color + '00');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  };
  // versus: { left:{who,name,eyeGlow,bg,pose,expr,look}, right:{...}, seam 'none'|'jagged', bg 'burst'|'none', vsColor, push 0.02, size 1000 }
  D.versus = (ctx, L, lt, env) => {
    screen(ctx, L, env); const k = 1 + (L.push ?? 0.02) * Math.max(0, lt - 0.4); ctx.scale(k, k); const jag = L.seam === 'jagged', size = L.size ?? 1000, zig = [];
    for (let i = 0; i <= 16; i++) zig.push([i % 2 ? 30 : -30, -H / 2 - 20 + (i * (H + 40)) / 16]);
    const half = (side, o, delay) => {
      ctx.save();
      if (jag) { ctx.beginPath(); ctx.moveTo(side * W, -H); zig.forEach(([x, y]) => ctx.lineTo(x, y)); ctx.lineTo(side * W, H); ctx.closePath(); ctx.clip(); }
      if (L.bg !== 'none' && (jag || side < 0)) { const c = o.bg ?? '#ffb800'; rays(ctx, 24, jag && o.bg ? T.shade(c, 0.25) : '#ffe24a', c, jag ? null : '#ffffff', 0.13); }
      const e = T.prog(lt, 3 * F + delay, 5 * F), ov = e < 1 ? T.ease.outBack(e) : 1; const x = side * W * 0.26 + side * (1 - ov) * W * 0.7;
      if (e > 0 && o.who) {
        const by = -H * 0.1 + size * 0.85; bust(ctx, { ...o, x, y: by, size, flip: side > 0, expr: o.expr ?? 'angry', pose: o.pose ?? 'fist' }, lt, env);
        if (o.eyeGlow) eyeGlow(ctx, x - side * size * 0.11 + (o.eyeX ?? 0), by - size * 0.77 + (o.eyeY ?? 0), o.eyeGlow === true ? '#ff2a2a' : o.eyeGlow, lt);
      }
      if (o.name && e > 0) uiText(ctx, String(o.name).toUpperCase(), side * W * 0.26, H * 0.36, 88, { stroke: 14, italic: true }); ctx.restore();
    };
    half(-1, L.left || {}, 2 * F); half(1, L.right || {}, 0);
    if (jag) {
      const p = T.prog(lt, 3 * F, 8 * F), n = Math.max(1, Math.ceil(p * 16));
      if (p > 0) {
        ctx.save(); ctx.lineJoin = 'miter'; ctx.beginPath(); zig.slice(0, n + 1).forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.lineWidth = 18; ctx.strokeStyle = UI; ctx.stroke(); ctx.lineWidth = 10; ctx.strokeStyle = '#ffd21e'; ctx.stroke(); ctx.restore();
      }
    }
    const vy = H * 0.32 + 200 * (1 - T.ease.outCubic(T.prog(lt, 2 * F, 8 * F)));
    if (lt >= 2 * F) uiText(ctx, 'VS', 0, vy, 260, { italic: true, stroke: 28, fill: L.vsColor ?? '#ffffff', ink: '#000' });
  };

  // challenger: { who, title 'CHALLENGER\nAPPROACHING', sub, color '#d40000', dur 3.5, look, pose, expr }
  D.challenger = (ctx, L, lt, env) => {
    screen(ctx, L, env); ctx.fillStyle = '#000'; ctx.fillRect(-W / 2 - 4, -H / 2 - 4, W + 8, H + 8);
    const r = H * 0.375, out = (L.dur ?? 3.5) - 0.6, sil = T.prog(lt, out, 6 * F), shrink = 1 - T.ease.in(T.prog(lt, out + 6 * F, 8 * F));
    const cx = T.lerp(W / 2 + r, W * 0.18, T.prog(lt, 0, 2 * F));
    if (shrink > 0.001) {
      ctx.save(); ctx.translate(cx, 0); ctx.scale(shrink, shrink);
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fillStyle = L.color ?? '#d40000'; ctx.fill(); ctx.save(); ctx.clip();
      if (L.who && lt >= 2 * F) {
        const s = T.lerp(0.9, 1, T.prog(lt, 2 * F, 3 * F)), o = { who: L.who, look: L.look, pose: L.pose ?? 'idle', expr: L.expr ?? 'smug', size: r * 2.4, x: 0, y: r * 1.55, view: L.view };
        ctx.scale(s, s); bust(ctx, o, lt, env);
        if (sil > 0) { ctx.save(); ctx.globalAlpha *= sil; T.filtered(ctx, 'brightness(0)', (g) => bust(g, o, lt, env)); ctx.restore(); }
      }
      ctx.restore(); ctx.lineWidth = 8; ctx.strokeStyle = '#1a0a0a'; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    }
    // title: alternating big/small caps in gold, typed over 2 frames
    const lines = String(L.title ?? 'CHALLENGER\nAPPROACHING').toUpperCase().split('\n'), total = lines.join('').length;
    const shown = lt < F ? 0 : lt < 2 * F ? Math.ceil(total / 2) : total; let count = 0;
    lines.forEach((line, li) => {
      let x = -W / 2 + 70 + li * 30; const y = -H / 2 + 150 + li * 80;
      [...line].forEach((ch, i) => {
        if (count++ >= shown) return; const sz = i % 2 ? 48 : 64;
        uiText(ctx, ch, x, y, sz, { align: 'left', base: 'alphabetic', fill: L.titleColor ?? '#f2b01a', stroke: 6, ink: '#3a2400' }); x += textW(ctx, ch, sz);
      });
    });
    if (L.sub !== '' && lt >= 2 * F) {
      const q = T.ease.outCubic(T.prog(lt, 2 * F, 12 * F)), font = `italic ${30}px Georgia, "Times New Roman", serif`;
      ctx.save(); ctx.translate(cx - r * 0.95, r * 0.62); ctx.rotate(T.lerp(-90, -15, q) * T.DEG); ctx.scale(T.lerp(0.5, 1, q), T.lerp(0.5, 1, q));
      uiText(ctx, String(L.sub ?? 'A NEW CHARACTER HAS APPEARED!').toUpperCase(), 0, 0, 30, { font, align: 'right', stroke: 0, fill: '#ffffff' }); ctx.restore();
    }
  };

  // joins: { name, sub 'JOINS THE BATTLE!', who, sky '#7ec8f0', pose 'arms-up', expr, size 1150, look }
  D.joins = (ctx, L, lt, env) => {
    screen(ctx, L, env); const g = ctx.createLinearGradient(0, -H / 2, 0, H / 2); g.addColorStop(0, L.sky ?? '#7ec8f0'); g.addColorStop(1, '#e8f6ff');
    ctx.fillStyle = g; ctx.fillRect(-W / 2 - 4, -H / 2 - 4, W + 8, H + 8);
    for (const [x, y, w] of [[-0.3, 0.3, 520], [0.32, 0.36, 640], [0.05, 0.44, 700]]) T.drawCloud(ctx, x * W, y * H, w, w * 0.32, 'joins' + x, { color: '#ffffff', shade: '#e2f0fa', line: 0 });
    if (L.who) bust(ctx, { who: L.who, look: L.look, x: W * (L.whoX ?? 0.16), y: -H * 0.02 + (L.size ?? 900) * 0.85, size: L.size ?? 900, pose: L.pose ?? 'arms-up', expr: L.expr ?? 'angry', flip: L.flip }, lt, env);
    const sp = T.prog(lt, 3 * F, 5 * F), sx = -W / 2 + 60, sy = -H * 0.18;
    if (sp > 0) {
      ctx.save(); ctx.translate(sx + 10, sy + 125); ctx.rotate(-6 * T.DEG); ctx.beginPath(); ctx.rect(-20, -90, 960 * sp, 200); ctx.clip();
      const streak = (dx, dy, col) => { ctx.beginPath(); ctx.moveTo(dx, dy - 40); for (let i = 1; i <= 12; i++) ctx.lineTo(dx + i * 75, dy - 50 + (i % 2 ? 14 : -6)); ctx.lineTo(dx + 900, dy + 30); for (let i = 12; i >= 0; i--) ctx.lineTo(dx + i * 75, dy + 50 + (i % 2 ? -12 : 6)); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); };
      streak(10, 10, '#1a1a1a'); streak(0, 0, L.streak ?? '#c8202a');
      uiText(ctx, String(L.sub ?? 'JOINS THE BATTLE!').toUpperCase(), 30, 2, 54, { align: 'left', italic: true, fill: '#3fd0ff', stroke: 10, ink: '#0a1a2a' });
      ctx.restore();
    }
    if (lt >= 2 * F) {
      const k = T.lerp(1.3, 1, T.ease.outCubic(T.prog(lt, 2 * F, 4 * F))); ctx.save(); ctx.translate(sx, sy); ctx.scale(k, k);
      uiText(ctx, String(L.name ?? 'NEW PLAYER').toUpperCase(), 0, 0, T.fitSize(ctx, String(L.name ?? '').toUpperCase(), 120, W * 0.5), { align: 'left', italic: true, stroke: 20 });
      ctx.restore();
    }
    if (lt < 3 * F) { ctx.fillStyle = `rgba(255,255,255,${lt < 2 * F ? 1 : 0.6})`; ctx.fillRect(-W / 2 - 4, -H / 2 - 4, W + 8, H + 8); }
  };

  // sequel: { titles [...], every 0.2, w 1300, h 150, size 110 } — torn grey strips slam in from alternating sides
  D.sequel = (ctx, L, lt, env) => {
    screen(ctx, L, env); const titles = arr(L.titles), w = L.w ?? 1300, h = L.h ?? 150, gap = 18, total = titles.length * h + (titles.length - 1) * gap;
    titles.forEach((t, i) => {
      const at = i * (L.every ?? 0.2), p = T.prog(lt, at, 5 * F); if (lt < at) return;
      const side = i % 2 ? 1 : -1, land = lt - at - 5 * F, shake = land >= 0 && land < 3 * F ? (frames(land) % 2 ? 6 : -6) : 0;
      const r = T.rng(T.hash((L.id || 'sequel') + i)), top = [], bot = [];
      for (let x = -w / 2; x <= w / 2; x += 30) { top.push([x, -h / 2 + (r() - 0.5) * 20]); bot.push([x, h / 2 + (r() - 0.5) * 20]); }
      const specks = Array.from({ length: 70 }, () => [(r() - 0.5) * w, (r() - 0.5) * h, 3 + r() * 9]);
      ctx.save(); ctx.translate(side * (1 - T.ease.outCubic(p)) * W * 1.2, -total / 2 + h / 2 + i * (h + gap) + shake); ctx.rotate(side * 2 * T.DEG);
      const path = (k) => { k.moveTo(top[0][0] - 12, top[0][1]); top.forEach(([x, y]) => k.lineTo(x, y)); k.lineTo(w / 2 + 14, 0); bot.slice().reverse().forEach(([x, y]) => k.lineTo(x, y)); k.lineTo(-w / 2 - 16, 6); k.closePath(); };
      T.outlined(ctx, path, L.color ?? '#b0b0b0', { line: 5, ink: UI, shade: (k) => { k.fillStyle = 'rgba(0,0,0,0.15)'; specks.forEach(([x, y, s]) => k.fillRect(x, y, s, s * 0.6)); } });
      const size = T.fitSize(ctx, String(t), L.size ?? 110, w - 120), grad = ctx.createLinearGradient(0, -size / 2, 0, size / 2);
      grad.addColorStop(0, '#ffe14a'); grad.addColorStop(1, '#e0302a');
      uiText(ctx, String(t).toUpperCase(), 0, 4, size, { italic: true, fill: grad, stroke: 16, ink: '#000' }); ctx.restore();
    });
  };

  // ---------- doc kinds: menus ----------
  // Stack of centred buttons; returns their rects (in this layer's space) for the hand cursor.
  const buttonRects = (n, y0, w = 520, h = 90, gap = 22) => Array.from({ length: n }, (_, i) => [-w / 2, y0 + i * (h + gap), w, h]);
  const plank = (ctx, x, y, w, h, seed) => {
    const r = T.rng(T.hash(seed)), grain = Array.from({ length: 4 }, () => [y + 14 + r() * (h - 28), r() * w * 0.3, w * (0.4 + r() * 0.5)]);
    T.outlined(ctx, (k) => T.rrect(k, x, y, w, h, 8), '#a8743a', { line: 6, shade: (k) => { k.strokeStyle = '#7e5226'; k.lineWidth = 3; grain.forEach(([gy, gx, gw]) => { k.beginPath(); k.moveTo(x + gx, gy); k.lineTo(x + gx + gw, gy); k.stroke(); }); k.fillStyle = '#8e5f2c'; k.fillRect(x, y + h - 10, w, 10); } });
  };
  const menuButtons = (ctx, L, lt, labels, y0, pressed, style) => {
    const rects = buttonRects(labels.length, y0, L.bw ?? 520, L.bh ?? 90);
    rects.forEach(([x, y, w, h], i) => {
      const s = pop(lt, 4 * F + i * 3 * F); if (lt < 4 * F + i * 3 * F) return;
      ctx.save(); ctx.translate(0, y + h / 2); ctx.scale(s, s); ctx.translate(0, -(y + h / 2)); const down = pressed === i;
      if (style === 'plank') plank(ctx, x, y, w, h, (L.id || 'pause') + i);
      else button(ctx, x, y + (down ? 3 : 0), w, h, down ? T.shade(L.buttonColor ?? '#f3ead2', -0.25) : L.buttonColor ?? '#f3ead2', { line: 4, r: 16 });
      const label = String(labels[i]).toUpperCase(), size = T.fitSize(ctx, label, 46, w - 40);
      ctx.save(); ctx.translate(0, y + h / 2 + (down ? 3 : 0)); if (L.mirror) ctx.scale(-1, 1);
      if (style === 'plank') uiText(ctx, label, 0, 2, size, { stroke: 10 });
      else uiText(ctx, label, 0, 2, size, { stroke: 0, fill: L.textColor ?? '#2a2622' }); ctx.restore(); ctx.restore();
    });
    return rects;
  };
  const pressedAt = (clicks, lt) => { for (const c of clicks) if (lt >= c.at && lt < c.at + 2 * F) return c.i ?? 0; return -1; };
  // menu: { title, buttons [...], click [{at,i}], titleColor '#f5c430', size 160 }
  D.menu = (ctx, L, lt, env) => {
    screen(ctx, L, env);
    const title = String(L.title ?? 'MAIN MENU').toUpperCase(), size = T.fitSize(ctx, title, L.size ?? 160, W * 0.8), s = pop(lt, 0, 7 * F), col = L.titleColor ?? '#f5c430';
    ctx.save(); ctx.translate(0, -H * 0.26); ctx.scale(s, s);
    for (let d = 6; d >= 1; d--) uiText(ctx, title, d * 0.7, d, size, { fill: '#b88a10', stroke: 16, ink: UI });
    uiText(ctx, title, 0, 0, size, { fill: col, stroke: 16, ink: UI });
    ctx.save(); ctx.beginPath(); ctx.rect(-W, -size, W * 2, size * 0.42); ctx.clip(); uiText(ctx, title, 0, 0, size, { fill: T.shade(col, 0.35), stroke: 0 }); ctx.restore();
    ctx.restore();
    const clicks = arr(L.click), rects = menuButtons(ctx, L, lt, arr(L.buttons ?? ['START GAME', 'LOAD', 'QUIT']), -H * 0.06, pressedAt(clicks, lt), L.style);
    hopCursor(ctx, clicks, rects, lt, L.cursor ?? 'hand');
  };
  // pause: { title 'PAUSE', buttons [...], style 'button'|'plank', mirror, dim 0.5, click [{at,i}] }
  D.pause = (ctx, L, lt, env) => {
    if (L.dim !== 0) backdrop(ctx, env, `rgba(0,0,0,${L.dim ?? 0.5})`); screen(ctx, L, env);
    const title = String(L.title ?? 'PAUSE'), r = T.rng(T.hash((L.id || 'pause') + title)), size = L.size ?? 150;
    ctx.save(); ctx.translate(0, -H * 0.27); if (L.mirror) ctx.scale(-1, 1); let x = -textW(ctx, title, size) / 2;
    for (const ch of title) { const cw = textW(ctx, ch, size); ctx.save(); ctx.translate(x + cw / 2, (r() - 0.5) * 14); ctx.rotate((r() - 0.5) * 10 * T.DEG); uiText(ctx, ch, 0, 0, size, { stroke: 18 }); ctx.restore(); x += cw; }
    ctx.restore();
    const clicks = arr(L.click), rects = menuButtons(ctx, L, lt, arr(L.buttons ?? ['RESUME', 'SAVE', 'MAIN MENU']), -H * 0.1, pressedAt(clicks, lt), L.style ?? 'plank');
    hopCursor(ctx, clicks, rects, lt, L.cursor ?? 'hand');
  };
  // loading: { text 'Loading..', full true, color '#111', size 1 } — put bean layers AFTER it to stage a waiting character
  D.loading = (ctx, L, lt, env) => {
    if (L.full !== false) backdrop(ctx, env, L.color ?? '#111111'); screen(ctx, L, env); const k = L.full === false ? 0 : 1, z = L.size ?? 1;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2, age = (((lt * 12 - i) % 12) + 12) % 12; ctx.fillStyle = `rgba(230,230,230,${0.15 + 0.85 * Math.max(0, 1 - age / 10)})`;
      ctx.beginPath(); ctx.arc(Math.cos(a) * 96 * z, Math.sin(a) * 96 * z, 15 * z, 0, Math.PI * 2); ctx.fill();
    }
    const dots = '.'.repeat(1 + (frames(lt) >> 3) % 3), text = String(L.text ?? 'Loading..').replace(/\.+$/, '') + dots; // dots cycle every 8 f
    uiText(ctx, text, (-W / 2 + 80) * k - 150 * z * (1 - k), (H / 2 - 90) * k + 170 * z * (1 - k), 64 * z, { align: 'left', weight: 800, stroke: 0, fill: '#b4b4b4' });
  };
  // insert: { text 'INSERT DISK #2', drip true, size 96, color '#151515' } — the last number drips red
  D.insert = (ctx, L, lt, env) => {
    if (L.full !== false) backdrop(ctx, env, L.color ?? '#151515'); screen(ctx, L, env);
    const text = String(L.text ?? 'INSERT DISK #2'), size = L.size ?? 96, m = text.match(/^(.*?)(\d+)(\D*)$/);
    const pre = m ? m[1] : text, num = m ? m[2] : '', post = m ? m[3] : '';
    const wPre = textW(ctx, pre, size), wNum = textW(ctx, num, size), x0 = -(wPre + wNum + textW(ctx, post, size)) / 2;
    uiText(ctx, pre, x0, 0, size, { align: 'left', stroke: 0 }); if (!num) return;
    uiText(ctx, post, x0 + wPre + wNum, 0, size, { align: 'left', stroke: 0 });
    const col = L.numColor ?? '#d21f1f'; if (L.drip !== false) { // 2-4 drips hang from the numeral's baseline (drawn first, the numeral covers their roots)
      const r = T.rng(T.hash((L.id || 'insert') + num)), n = Math.max(2, Math.min(4, Math.round(wNum / (size * 0.28)))), u = size / 96;
      ctx.fillStyle = col;
      for (let i = 0; i < n; i++) { // each grows 30-70 px over 0.6 s, thin stem + round bead
        const x = x0 + wPre + wNum * ((i + 0.35 + r() * 0.3) / n), len = (30 + r() * 40) * u * T.ease.out(T.prog(lt, 0.15 + r() * 0.3, 0.6)), w = (6 + r() * 3) * u;
        ctx.beginPath(); T.rrect(ctx, x - w / 2, size * 0.2, w, size * 0.14 + len, w / 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x, size * 0.34 + len, w * 0.75, 0, Math.PI * 2); ctx.fill();
      }
    }
    uiText(ctx, num, x0 + wPre, 0, size, { align: 'left', stroke: size * 0.06, ink: '#151515', fill: col });
  };

  // wheel: { items [prop | {prop,label}], steps [i...], every 0.4, size 230, dim 0.4 } — weapon wheel, hard snaps
  D.wheel = (ctx, L, lt, env) => {
    if (L.dim !== 0) backdrop(ctx, env, `rgba(0,0,0,${L.dim ?? 0.4})`); screen(ctx, L, env);
    const items = arr(L.items).map((it) => (typeof it === 'string' ? { prop: it } : it)), n = Math.max(1, items.length), R = L.size ?? 230, r0 = R * 0.6;
    const steps = arr(L.steps ?? [0]), every = L.every ?? 0.4, k = Math.min(steps.length - 1, Math.floor(lt / every + 1e-6)), act = steps[Math.max(0, k)];
    const lastAt = (steps.length - 1) * every, pulse = lt >= lastAt ? 1 + 0.08 * Math.abs(Math.sin((Math.PI * T.prog(lt, lastAt, 12 * F)) * 2)) : 1;
    const s = pop(lt); ctx.scale(s, s);
    for (let i = 0; i < n; i++) {
      const span = (Math.PI * 2) / n, g = 6 / (R * 0.8), a0 = -Math.PI / 2 + (i - 0.5) * span + g / 2, a1 = a0 + span - g, on = i === act;
      ctx.save(); if (on) ctx.scale(pulse, pulse); ctx.beginPath(); ctx.arc(0, 0, R, a0, a1); ctx.arc(0, 0, r0, a1, a0, true); ctx.closePath();
      ctx.fillStyle = on ? L.activeColor ?? '#2f7fd6' : 'rgba(125,125,130,0.92)'; ctx.fill();
      ctx.lineJoin = 'round'; ctx.lineWidth = 8; ctx.strokeStyle = UI; ctx.stroke(); ctx.lineWidth = 3; ctx.strokeStyle = '#c9a33a'; ctx.stroke();
      const am = (a0 + a1) / 2; if (items[i]?.prop) prop(ctx, items[i].prop, R * 0.4, lt, Math.cos(am) * R * 0.8, Math.sin(am) * R * 0.8); ctx.restore();
    }
    const label = items[act]?.label ?? String(items[act]?.prop ?? '').toUpperCase();
    if (label) uiText(ctx, label, 0, 0, T.fitSize(ctx, label, 34, r0 * 1.6), { stroke: 8 });
  };
  // carousel: { items [{prop,label}], select [{at,i}], start 0 } — item cards slide 8 frames per selection
  // snap: true — the reference menu (WW1 4:09): a card lands in 1 frame, the arrows flash for 3 frames and the selected
  // card's border flashes red for 2 frames, instead of the 8-frame slide with a bounce.
  D.carousel = (ctx, L, lt, env) => {
    if (L.dim !== 0) backdrop(ctx, env, `rgba(20,20,26,${L.dim ?? 0.85})`); screen(ctx, L, env); const items = arr(L.items), sel = arr(L.select);
    let pos = L.start ?? 0, bounce = 1, since = Infinity;
    for (const c of sel) {
      if (lt < c.at) break; since = lt - c.at;
      if (L.snap) { pos = c.i ?? 0; continue; }
      const e = T.ease.outCubic(T.prog(lt, c.at, 8 * F)); pos = T.lerp(pos, c.i ?? 0, e);
      bounce = 1 + 0.05 * Math.sin(Math.PI * T.prog(lt, c.at + 8 * F, 6 * F));
    }
    const f = frames(since), chevronFlash = L.snap && f < 3, redFlash = L.snap && f >= 1 && f < 3;
    const order = items.map((_, i) => i).sort((a, b) => Math.abs(b - pos) - Math.abs(a - pos));
    for (const i of order) {
      const d = i - pos, ad = Math.abs(d); if (ad > 1.6) continue;
      const sz = T.lerp(360, 250, Math.min(1, ad)) * (ad < 0.5 ? bounce : 1), x = d * 470; ctx.save(); ctx.translate(x, -30);
      ctx.beginPath(); T.rrect(ctx, -sz / 2, -sz / 2, sz, sz, 14); ctx.fillStyle = '#34343e'; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = redFlash && ad < 0.5 ? '#e0302a' : '#ffffff'; ctx.stroke();
      if (items[i].prop) prop(ctx, items[i].prop, sz * 0.55, lt);
      if (ad > 0.05) { ctx.fillStyle = `rgba(0,0,0,${0.4 * Math.min(1, ad)})`; ctx.beginPath(); T.rrect(ctx, -sz / 2 - 4, -sz / 2 - 4, sz + 8, sz + 8, 14); ctx.fill(); }
      uiText(ctx, String(items[i].label ?? '').toUpperCase(), 0, sz / 2 + 54, 48, { stroke: 8, fill: ad < 0.5 ? '#fff' : '#9a9aa4' }); ctx.restore();
    }
    for (const sx of [-1, 1]) uiText(ctx, sx < 0 ? '<' : '>', sx * 800, -30, chevronFlash ? 110 : 90, { stroke: 12, fill: chevronFlash ? '#ffe066' : '#fff' });
  };

  // ---------- doc kinds: boxes and panels ----------
  // dialog: { text, cps 30, speaker, w 1700, h 200, size 34 } (bottom of frame unless y given)
  D.dialog = (ctx, L, lt, env) => {
    screen(ctx, L, env); const w = L.w ?? 1700, h = L.h ?? 200, size = L.size ?? 34; if (L.y == null) ctx.translate(0, H / 2 - 40 - h / 2);
    const s = T.lerp(0.92, 1, T.ease.outCubic(T.prog(lt, 0, 4 * F))); ctx.scale(s, s);
    ctx.beginPath(); T.rrect(ctx, -w / 2, -h / 2, w, h, 18); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#2a2a2a'; ctx.stroke();
    ctx.beginPath(); T.rrect(ctx, -w / 2 + 9, -h / 2 + 9, w - 18, h - 18, 12); ctx.lineWidth = 3; ctx.strokeStyle = '#c4c4c4'; ctx.stroke();
    if (L.speaker) {
      const sw = textW(ctx, L.speaker, 30, 800) + 40; ctx.beginPath(); T.rrect(ctx, -w / 2 + 30, -h / 2 - 34, sw, 50, 12); ctx.fillStyle = '#2a2a2a'; ctx.fill();
      uiText(ctx, String(L.speaker), -w / 2 + 50, -h / 2 - 9, 30, { align: 'left', weight: 800, stroke: 0 });
    }
    ctx.font = T.font(size, 800);
    const lines = wrap(ctx, L.text ?? '', w - 100), total = lines.join('').length, n = Math.floor((frames(lt) * (L.cps ?? 30)) / 30); let left = n;
    lines.forEach((ln, i) => {
      if (left <= 0) return;
      uiText(ctx, ln.slice(0, left), -w / 2 + 50, -h / 2 + 56 + i * size * 1.35, size, { align: 'left', weight: 800, stroke: 0, fill: '#1a1a1a' });
      left -= ln.length;
    });
    if (n >= total && frames(lt) % 15 < 8) { ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.moveTo(w / 2 - 70, h / 2 - 50); ctx.lineTo(w / 2 - 40, h / 2 - 50); ctx.lineTo(w / 2 - 55, h / 2 - 32); ctx.closePath(); ctx.fill(); }
  };
  // error: { title 'ERROR', text, button 'OK', w 520, h 150 } — OS popup: pop, shake, blink twice
  D.error = (ctx, L, lt, env) => {
    screen(ctx, L, env); const f = frames(lt), w = L.w ?? 520, h = L.h ?? 150, bar = 32;
    if (f >= 6 && f < 22 && Math.floor((f - 6) / 4) % 2 === 0) return; const s = T.lerp(0.8, 1, T.ease.outCubic(T.prog(lt, 0, 3 * F)));
    ctx.translate(f < 6 ? Math.sin(f * 2.4) * 4 : 0, 0); ctx.scale(s, s);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(-w / 2 + 8, -h / 2 - bar + 10, w, h + bar);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(-w / 2, -h / 2 - bar, w, h + bar); ctx.fillStyle = L.barColor ?? '#2f6fd0'; ctx.fillRect(-w / 2, -h / 2 - bar, w, bar);
    ctx.lineWidth = 3; ctx.strokeStyle = UI; ctx.strokeRect(-w / 2, -h / 2 - bar, w, h + bar);
    uiText(ctx, String(L.title ?? 'ERROR'), -w / 2 + 12, -h / 2 - bar / 2 + 1, 20, { align: 'left', weight: 800, stroke: 0 });
    button(ctx, w / 2 - 30, -h / 2 - bar + 6, 22, 20, '#d8402a', { r: 4, line: 2, bevel: 3 }); warnTri(ctx, -w / 2 + 56, -h / 2 + 52, 56, '#d8262a', '#ffffff');
    const msg = String(L.text ?? 'SOMETHING WENT WRONG'), size = T.fitSize(ctx, msg, 30, w - 140, 800);
    uiText(ctx, msg, -w / 2 + 100, -h / 2 + 52, size, { align: 'left', weight: 800, stroke: 0, fill: '#111' });
    button(ctx, -48, h / 2 - 50, 96, 36, '#e4e4e8', { r: 6, line: 2, bevel: 4 });
    uiText(ctx, String(L.button ?? 'OK'), 0, h / 2 - 32, 20, { weight: 800, stroke: 0, fill: '#111' });
  };
  // upgrade: { text 'UPGRADE\nAVAILABLE', pressAt, color '#c8302a', costs [{x,y,text,at}], tag 1.8 (cost tag scale) }
  D.upgrade = (ctx, L, lt, env) => {
    screen(ctx, L, env); const press = L.pressAt ?? Infinity;
    for (const c of arr(L.costs)) {
      const q = pop(lt, c.at ?? 0); if (lt < (c.at ?? 0)) continue;
      ctx.save(); abs(ctx, env); ctx.translate((c.x ?? 0.5) * W, (c.y ?? 0.5) * H + Math.sin((lt - (c.at ?? 0)) * Math.PI * 2) * 4); ctx.scale(q * (L.tag ?? 1.8), q * (L.tag ?? 1.8));
      ctx.beginPath(); T.rrect(ctx, -62, -18, 124, 36, 18); ctx.fillStyle = '#5a5a62'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = UI; ctx.stroke();
      ctx.beginPath(); ctx.arc(-38, 0, 12, 0, Math.PI * 2); ctx.fillStyle = '#f2c230'; ctx.fill(); ctx.lineWidth = 2.5; ctx.stroke();
      uiText(ctx, String(c.text ?? ''), 12, 1, T.fitSize(ctx, String(c.text ?? ''), 24, 80), { stroke: 0 }); ctx.restore();
    }
    if (lt >= press + 2 * F) {
      if (lt < press + 8 * F) { const q = T.prog(lt, press + 2 * F, 6 * F); ctx.globalAlpha *= 1 - q; T.starburst(ctx, 0, 0, 40 + 80 * q, 90 + 120 * q, 10, 'upg', '#ffffff', UI, 5); }
      return;
    }
    const col = L.color ?? '#c8302a', w = 300, h = 90; const s = pop(lt, 0, 7 * F) * (lt >= press ? 0.9 : 1 + 0.05 * Math.max(0, Math.sin(lt * Math.PI * 3)));
    ctx.rotate(((L.tilt ?? -6) + (1 - T.prog(lt, 0, 7 * F)) * -6) * T.DEG); ctx.scale(s, s);
    button(ctx, -w / 2, -h / 2, w, h, col, { r: 14, line: 5 }); const lines = String(L.text ?? 'UPGRADE\nAVAILABLE').toUpperCase().split('\n');
    lines.forEach((ln, i) => uiText(ctx, ln, 0, -4 + (i - (lines.length - 1) / 2) * 34, T.fitSize(ctx, ln, 32, w - 30), { stroke: 6 }));
  };
  // killfeed: { entries [{a, icon, v, at}], size 40, life } (top-right unless x/y given)
  D.killfeed = (ctx, L, lt, env) => {
    screen(ctx, L, env);
    if (L.x == null && L.y == null) { abs(ctx, env); const [lo, vw] = T.visibleSpan(env); ctx.translate(lo + vw - 40, 40); }
    const es = arr(L.entries), size = L.size ?? 40, h = 34 * (size / 24);
    es.forEach((e, i) => {
      const at = e.at ?? 0; if (lt < at || (L.life != null && lt > at + L.life + 0.3)) return; let down = 0;
      for (let j = i + 1; j < es.length; j++) down += T.ease.outCubic(T.prog(lt, es[j].at ?? 0, 6 * F));
      const a = String(e.a ?? '').toUpperCase(), v = String(e.v ?? '').toUpperCase(), aw = textW(ctx, a, size, 800), vw = textW(ctx, v, size, 800), ic = h * 0.9;
      const w = Math.max(L.w ?? 0, aw + vw + ic + 56), slide = (1 - T.ease.outCubic(T.prog(lt, at, 6 * F))) * (w + 40);
      ctx.save(); ctx.translate(slide, down * (h + 6)); if (L.life != null) ctx.globalAlpha *= 1 - T.prog(lt, at + L.life, 0.3);
      ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fillRect(-w, 0, w, h); ctx.lineWidth = 3; ctx.strokeStyle = UI; ctx.strokeRect(-w, 0, w, h);
      uiText(ctx, a, -w + 16, h / 2 + 1, size, { align: 'left', weight: 800, stroke: 0, fill: '#c02a2a' });
      if (e.icon) prop(ctx, e.icon, ic * 0.8, lt, -w + 28 + aw + ic / 2, h / 2);
      uiText(ctx, v, -16, h / 2 + 1, size, { align: 'right', weight: 800, stroke: 0, fill: '#333333' }); ctx.restore();
    });
  };

  // highscore: { top 'NEW HIGHSCORE!', bottom 'CONTINUE?', countdown 10, confetti true, size 120 }
  D.highscore = (ctx, L, lt, env) => {
    screen(ctx, L, env);
    if (L.confetti !== false) {
      const r = T.rng(T.hash((L.id || 'hs') + ':confetti')), cols = ['#ff4a4a', '#ffd23a', '#4ad0ff', '#7cf05a', '#ff7ae0', '#ffffff'];
      for (let i = 0; i < 70; i++) {
        const x = (r() - 0.5) * W, v = 120 + r() * 160, y = ((((r() * H + lt * v) % (H + 40)) + H + 40) % (H + 40)) - H / 2 - 20, rot = r() * 6 + lt * (r() * 8 - 4), c = cols[Math.floor(r() * cols.length)];
        ctx.save(); ctx.translate(x + Math.sin(lt * 3 + i) * 12, y); ctx.rotate(rot); ctx.fillStyle = c; ctx.fillRect(-6, -3.5, 12, 7); ctx.restore();
      }
    }
    const top = String(L.top ?? 'NEW HIGHSCORE!'), size = T.fitSize(ctx, top, L.size ?? 120, W * 0.85); let x = -textW(ctx, top, size) / 2;
    [...top].forEach((ch, i) => {
      const cw = textW(ctx, ch, size), q = pop(lt, i * 2 * F, 6 * F);
      if (lt >= i * 2 * F) { ctx.save(); ctx.translate(x + cw / 2, -H * 0.3); ctx.scale(q, q); uiText(ctx, ch, 0, 0, size, { stroke: 16 }); ctx.restore(); }
      x += cw;
    });
    // CONTINUE? blinks (0.6 s on / 0.4 off) on the line under the title; the countdown sits right of it, always on
    const t0 = top.length * 2 * F + 0.2, bot = String(L.bottom ?? 'CONTINUE?'), bs = size * 0.7, cy = -H * 0.3 + size * 1.05;
    const cd = L.countdown ? String(Math.max(0, L.countdown - Math.floor(lt - t0))) : '', bw = textW(ctx, bot, bs), cw = cd ? textW(ctx, cd, bs * 1.2) + 30 : 0;
    if (lt >= t0 && (lt - t0) % 1 < 0.6) uiText(ctx, bot, -cw / 2, cy, bs, { stroke: 12 });
    if (cd && lt >= t0) uiText(ctx, cd, bw / 2 - cw / 2 + 30, cy, bs * 1.2, { align: 'left', stroke: 14, fill: '#ffd23a' });
  };
  // meanwhile: { text 'MEANWHILE...', palette [...], color '#e0302a', size 150 }
  D.meanwhile = (ctx, L, lt, env) => {
    screen(ctx, L, env); const pal = arr(L.palette ?? ['#f6c6d6', '#bfe3c4', '#f8e3a0', '#c8d8f4']), r = T.rng(T.hash((L.id || 'meanwhile') + ':collage'));
    ctx.fillStyle = T.mix(pal[0], '#ffffff', 0.4); ctx.fillRect(-W / 2 - 4, -H / 2 - 4, W + 8, H + 8);
    for (let i = 0; i < 56; i++) {
      const x = (r() - 0.5) * W * 1.05, y = (r() - 0.5) * H * 1.05, s = 50 + r() * 70, c = pal[Math.floor(r() * pal.length)], rot = r() * 6, flower = r() < 0.55;
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
      if (flower) {
        T.outlined(ctx, (k) => { for (let j = 0; j < 5; j++) { const a = (j / 5) * Math.PI * 2; k.moveTo(Math.cos(a) * s * 0.42 + s * 0.3, Math.sin(a) * s * 0.42); k.arc(Math.cos(a) * s * 0.42, Math.sin(a) * s * 0.42, s * 0.3, 0, Math.PI * 2); } }, c, { line: 3, ink: P.ink });
        T.outlined(ctx, (k) => k.arc(0, 0, s * 0.2, 0, Math.PI * 2), T.mix(c, '#ffd23a', 0.6), { line: 3, ink: P.ink });
      } else T.outlined(ctx, (k) => { k.moveTo(-s * 0.6, 0); k.quadraticCurveTo(0, -s * 0.45, s * 0.6, 0); k.quadraticCurveTo(0, s * 0.45, -s * 0.6, 0); k.closePath(); }, T.shade(c, -0.12), { line: 3, ink: P.ink });
      ctx.restore();
    }
    const text = String(L.text ?? 'MEANWHILE...'), size = T.fitSize(ctx, text, L.size ?? 150, W * 0.85), jr = T.rng(T.hash((L.id || 'mw') + ':' + Math.floor(lt * 15)));
    let x = -textW(ctx, text, size) / 2; const s = pop(lt, 0, 6 * F); ctx.scale(s, s);
    for (const ch of text) { const cw = textW(ctx, ch, size); ctx.save(); ctx.translate(x + cw / 2, (jr() - 0.5) * 12); ctx.rotate((jr() - 0.5) * 6 * T.DEG); uiText(ctx, ch, 0, 0, size, { fill: L.color ?? '#e0302a', stroke: 16, ink: P.ink }); ctx.restore(); x += cw; }
  };
  // tbc: { text 'To Be Continued', words [...], every 0.27, sepia true } — arrow banner bottom-left + stacked pop words
  D.tbc = (ctx, L, lt, env) => {
    if (L.sepia !== false) {
      ctx.save(); abs(ctx, env); ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = '#e6c590'; ctx.fillRect(0, 0, W, H); ctx.restore();
    }
    screen(ctx, L, env); const e = T.ease.outCubic(T.prog(lt, 0, 10 * F)), bw = 700, bh = 110; ctx.save(); ctx.translate(-W / 2 + 70 + (1 - e) * W, H / 2 - 130);
    T.outlined(ctx, (k) => { k.moveTo(0, 0); k.lineTo(bh * 0.6, -bh / 2); k.lineTo(bw, -bh / 2); k.lineTo(bw, bh / 2); k.lineTo(bh * 0.6, bh / 2); k.closePath(); }, '#efe2c0', { line: 6, ink: P.ink, shade: (k) => { k.fillStyle = '#d8c69c'; k.fillRect(0, bh * 0.28, bw, bh); } });
    uiText(ctx, String(L.text ?? 'To Be Continued'), bh * 0.6 + (bw - bh * 0.6) / 2, 4, 54, { font: 'italic 700 54px Georgia, "Times New Roman", serif', stroke: 0, fill: '#3a2a1a' });
    ctx.restore(); const cols = ['#ff4a4a', '#ffd23a', '#4ad0ff', '#7cf05a', '#ff7ae0'], r = T.rng(T.hash((L.id || 'tbc') + ':words'));
    arr(L.words).forEach((wd, i) => {
      const at = 10 * F + i * (L.every ?? 0.27), tilt = (r() - 0.5) * 24, dx = (r() - 0.5) * 120; if (lt < at) return; const q = pop(lt, at, 6 * F), size = 96;
      ctx.save(); ctx.translate(W * 0.2 + dx, -H * 0.36 + i * 120); ctx.rotate(tilt * T.DEG); ctx.scale(q, q);
      uiText(ctx, String(wd), 0, 0, T.fitSize(ctx, String(wd), size, 760), { fill: cols[i % cols.length], stroke: 14, ink: UI }); ctx.restore();
    });
  };
  // trade: { title 'TRADE OFFER', get [...] (I RECEIVE), give [...] (YOU RECEIVE); item {prop|text|map|layer, label, at, scale} }
  const tradeItem = (ctx, it, x, y, lt, env) => {
    if (lt < (it.at ?? 0)) return; const q = pop(lt, it.at ?? 0); ctx.save(); ctx.translate(x, y); ctx.scale(q, q);
    const inner = it.map ? { type: 'map', ...it.map } : it.layer;
    if (inner) {
      const bw = 420, bh = 236, k = it.scale ?? 0.22;
      ctx.save(); ctx.beginPath(); ctx.rect(-bw / 2, -bh / 2, bw, bh); ctx.clip(); ctx.fillStyle = '#dfe8f0'; ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
      ctx.scale(k, k); const draw = T.layers[inner.type]; if (!draw) throw new Error(`trade item: unknown layer type "${inner.type}"`);
      if (inner.type === 'map') ctx.translate(-W / 2, -H / 2); draw(ctx, inner, lt - (it.at ?? 0), { ...env, st: null, cam: null });
      ctx.restore(); ctx.lineWidth = 4; ctx.strokeStyle = UI; ctx.strokeRect(-bw / 2, -bh / 2, bw, bh);
    } else if (it.prop) { prop(ctx, it.prop, 120, lt, 0, -10); }
    else uiText(ctx, String(it.text ?? '').toUpperCase(), 0, 0, T.fitSize(ctx, String(it.text ?? '').toUpperCase(), 62, 440), { stroke: 0, fill: it.color ?? '#1a1a1a' });
    if (it.label) uiText(ctx, String(it.label).toUpperCase(), 0, inner ? 150 : 80, 32, { stroke: 0, fill: '#1a1a1a' }); ctx.restore();
  };
  D.trade = (ctx, L, lt, env) => {
    screen(ctx, L, env); const w = L.w ?? 1100, h = L.h ?? 620, s = pop(lt); ctx.scale(s, s);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(-w / 2 + 12, -h / 2 + 14, w, h);
    ctx.beginPath(); T.rrect(ctx, -w / 2, -h / 2, w, h, 10); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = UI; ctx.stroke();
    ctx.beginPath(); T.rrect(ctx, -w / 2, -h / 2, w, 92, 10); ctx.fillStyle = L.color ?? '#c8202a'; ctx.fill(); ctx.stroke();
    warnTri(ctx, -w / 2 + 60, -h / 2 + 46, 56); uiText(ctx, String(L.title ?? 'TRADE OFFER').toUpperCase(), 30, -h / 2 + 48, 58, { stroke: 10 });
    ctx.fillStyle = '#d0d0d0'; ctx.fillRect(-2, -h / 2 + 120, 4, h - 150);
    [[L.getTitle ?? 'I RECEIVE:', arr(L.get), -w / 4], [L.giveTitle ?? 'YOU RECEIVE:', arr(L.give), w / 4]].forEach(([title, items, cx]) => {
      uiText(ctx, String(title).toUpperCase(), cx, -h / 2 + 150, 40, { stroke: 0, fill: '#111' }); const step = (h - 230) / Math.max(1, items.length);
      items.forEach((it, i) => tradeItem(ctx, it, cx, -h / 2 + 210 + step * (i + 0.5) - (it.map || it.layer ? 20 : 0), lt, env));
    });
  };

  // slides: { slides [{shot, t 0.5, year, title, layer}], every 1.2, transition 'cut'|'slide' } — presentation fast-forward
  const subCache = new Map();
  const shotThumb = (id, t, env, w, h) => {
    const key = [id, t, env.dpr, Math.round(w), Math.round(h), env.spec?.seed].join('|'); let c = subCache.get(key);
    if (!c) {
      const src = T.subShot(id, t, env, { t });
      c = document.createElement('canvas'); c.width = Math.max(2, Math.round(w * env.dpr)); c.height = Math.max(2, Math.round(h * env.dpr));
      const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(src, 0, 0, c.width, c.height);
      if (subCache.size > 64) subCache.clear(); subCache.set(key, c);
    }
    return c;
  };
  const slideContent = (ctx, sl, x, y, w, h, lt, env) => {
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.fillStyle = sl.color ?? '#ffffff'; ctx.fillRect(x, y, w, h);
    if (sl.shot) ctx.drawImage(shotThumb(sl.shot, sl.t ?? 0.5, env, w, h), x, y, w, h);
    else if (sl.layer) {
      const draw = T.layers[sl.layer.type]; if (!draw) throw new Error(`slides: unknown layer type "${sl.layer.type}"`);
      ctx.translate(x + w / 2, y + h / 2); ctx.scale(w / W, h / H); draw(ctx, sl.layer, lt, { ...env, st: null, cam: null });
    }
    ctx.restore();
  };
  D.slides = (ctx, L, lt, env) => {
    screen(ctx, L, env); const sl = arr(L.slides), n = sl.length, every = L.every ?? 1.2, k = Math.min(n - 1, Math.floor(lt / every + 1e-6));
    if (!n) throw new Error('slides: needs at least one slide'); const w = 1600, h = 900, x0 = -w / 2, y0 = -h / 2, s = pop(lt, 0, 6 * F);
    ctx.scale(s, s); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x0 + 14, y0 + 16, w, h);
    ctx.fillStyle = '#fafafa'; ctx.fillRect(x0, y0, w, h); ctx.lineWidth = 4; ctx.strokeStyle = UI; ctx.strokeRect(x0, y0, w, h);
    ctx.fillStyle = '#e3e5ea'; ctx.fillRect(x0, y0, w, 44);
    for (let i = 0; i < 9; i++) { ctx.fillStyle = i < 3 ? ['#e85a50', '#f0c040', '#5ac05a'][i] : '#b8bcc6'; ctx.beginPath(); i < 3 ? ctx.arc(x0 + 22 + i * 24, y0 + 22, 7, 0, Math.PI * 2) : T.rrect(ctx, x0 + 60 + i * 52, y0 + 12, 40, 20, 5); ctx.fill(); }
    const tw = 210, th = tw * 9 / 16, first = Math.max(0, Math.min(k - 2, n - 5));
    for (let i = first; i < Math.min(n, first + 5); i++) {
      const ty = y0 + 70 + (i - first) * (th + 30); uiText(ctx, String(i + 1), x0 + 22, ty + 14, 18, { weight: 800, stroke: 0, fill: '#777' });
      slideContent(ctx, sl[i], x0 + 40, ty, tw, th, lt, env);
      ctx.lineWidth = i === k ? 4 : 1.5; ctx.strokeStyle = i === k ? '#2f7fd6' : '#a0a4ac'; ctx.strokeRect(x0 + 40 - (i === k ? 3 : 0), ty - (i === k ? 3 : 0), tw + (i === k ? 6 : 0), th + (i === k ? 6 : 0));
    }
    const mx = x0 + 290, my = y0 + 80, mw = w - 330, mh = mw * 9 / 16 > h - 180 ? h - 180 : mw * 9 / 16, mw2 = mh * 16 / 9, mxx = mx + (mw - mw2) / 2;
    const since = lt - k * every, slideOff = L.transition === 'slide' && k > 0 && since < 4 * F ? (1 - since / (4 * F)) * mw2 : 0;
    ctx.save(); ctx.beginPath(); ctx.rect(mxx, my, mw2, mh); ctx.clip(); if (slideOff) slideContent(ctx, sl[k - 1], mxx + slideOff - mw2, my, mw2, mh, lt, env);
    slideContent(ctx, sl[k], mxx + slideOff, my, mw2, mh, lt, env); ctx.restore();
    ctx.lineWidth = 5; ctx.strokeStyle = '#9cc4ec'; ctx.strokeRect(mxx, my, mw2, mh); const cur = sl[k];
    if (cur.title) uiText(ctx, String(cur.title).toUpperCase(), mxx + mw2 / 2, my + 60, 56, { stroke: 10 });
    if (cur.year != null) { const yw = textW(ctx, String(cur.year), 46) + 40; ctx.beginPath(); T.rrect(ctx, mxx + mw2 - yw - 20, my + 20, yw, 64, 12); ctx.fillStyle = '#2a3a7a'; ctx.fill(); uiText(ctx, String(cur.year), mxx + mw2 - yw / 2 - 20, my + 53, 46, { stroke: 0 }); }
    const by = my + mh + 50, btn = [[mxx + mw2 / 2 - 70, by, -1], [mxx + mw2 / 2 + 70, by, 1]];
    for (const [bx, byy, dir] of btn) {
      ctx.beginPath(); ctx.arc(bx, byy, 32, 0, Math.PI * 2); ctx.fillStyle = '#2a3a7a'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = UI; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx - dir * 8, byy - 13); ctx.lineTo(bx + dir * 9, byy); ctx.lineTo(bx - dir * 8, byy + 13); ctx.lineWidth = 6; ctx.strokeStyle = '#fff'; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
    }
    // cursor: rests near the slide, eases to "next" over 0.4 s, clicks on each switch
    if (L.cursor === false) return; const nb = btn[1], rest = [mxx + mw2 * 0.78, my + mh * 0.72], next = (k + 1) * every; let p = 0, squash = 1;
    if (k + 1 < n) p = T.ease.inOut(T.prog(lt, next - 0.4, 0.4));
    if (k > 0 && since < 0.45) { p = since < 2 * F ? 1 : 1 - T.ease.inOut(T.prog(since, 0.15, 0.3)); if (since < 2 * F) squash = 0.9; clickRing(ctx, nb[0], nb[1], since); }
    drawCursor(ctx, 'arrow', T.lerp(rest[0], nb[0], p), T.lerp(rest[1], nb[1], p), 38, squash);
  };
})();
