// cards.js — `doc` kinds for text and paper: nameplate (rank / big / hand / slant name labels with hook arrows,
// rename strike, sub-line, bullets), timeskip ("N YEARS LATER"), pictobubble (icons, arrows, strikes, a mini scene,
// a growing list, nested thoughts), statstack, unitcards, bigyear, band, graffiti (brush / blood / paint lettering,
// roller cover, eraser, rewrite), scorecard, tally, list (strike and retitle, pencil hand) and crayon (child's plan).
// Every kind animates its own entrance (doc layers default to enter:none). Times are layer-local, 30 fps frame counts.
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL, INK = P.ink, F = 1 / 30;
  T.DOCS = T.DOCS || {};

  // ---------- shared helpers ----------
  const num = (v, d) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
  const oneOf = (v, list, def, what) => { // invalid enum values fail loudly; missing ones take the default
    if (v != null && !list.includes(v)) throw new Error(`doc ${what}: "${v}" is not one of ${list.join(', ')}`);
    return v ?? def;
  };
  const arr = (v) => (Array.isArray(v) ? v : v == null ? [] : [v]);
  const popS = (lt, at, dur = 0.2) => { const p = T.prog(lt, at, dur); return p <= 0 ? 0 : Math.max(0.001, T.ease.outBack(p)); };
  // 1.15 -> 1 settle right after something "lands" (marks, scribbled digits)
  const kick = (lt, at, dur, k = 0.15) => (lt < at ? 1 : 1 + k * (1 - T.prog(lt, at, dur)));
  const seedOf = (L, s = '') => (L.id ?? L.kind ?? 'doc') + ':' + s;

  // Heavy caps: drop shadow, ink outline stroked first (round joins), optional inner stroke, then the fill.
  // `stroke` is the visible outline width in px; `fill` may be a gradient; `cond` squeezes the letters horizontally.
  function inkText(ctx, text, x, y, o = {}) {
    const size = o.size ?? 80, sw = o.stroke ?? 7; ctx.save();
    ctx.font = (o.italic ? 'italic ' : '') + T.font(size, o.weight ?? 900);
    ctx.textAlign = o.align ?? 'center'; ctx.textBaseline = o.baseline ?? 'alphabetic';
    ctx.lineJoin = 'round'; ctx.miterLimit = 2;
    if (o.cond) { ctx.translate(x, y); ctx.scale(o.cond, 1); x = 0; y = 0; }
    if (o.shadow !== false && o.shadow !== undefined) {
      const [dx, dy, a] = o.shadow === true ? [4, 4, 0.35] : o.shadow;
      ctx.fillStyle = ctx.strokeStyle = `rgba(0,0,0,${a})`; ctx.lineWidth = sw * 2;
      if (sw > 0) ctx.strokeText(text, x + dx, y + dy);
      ctx.fillText(text, x + dx, y + dy);
    }
    if (sw > 0) { ctx.strokeStyle = o.ink ?? INK; ctx.lineWidth = sw * 2; ctx.strokeText(text, x, y); }
    if (o.inner) { ctx.strokeStyle = o.inner[0]; ctx.lineWidth = o.inner[1] * 2; ctx.strokeText(text, x, y); }
    ctx.fillStyle = o.fill ?? '#fff'; ctx.fillText(text, x, y);
    const w = ctx.measureText(text).width * (o.cond ?? 1);
    ctx.restore(); return w;
  }

  // Hand-lettered layout: one entry per letter with a seeded rotation (+-jit deg) and y offset (+-3 px at 88 px).
  // Multi-line text (\n) stacks lines `lh` apart. Returns glyphs {ch, x, y, w, rot, line, word} and the block width.
  function handLayout(ctx, text, size, seed, o = {}) {
    const r = T.rng(T.hash(seed)), weight = o.weight ?? 800, jit = o.jit ?? 4, lh = o.lh ?? size * 1.05;
    const lines = String(text).split('\n'), out = []; let maxW = 0, word = 0;
    ctx.save(); ctx.font = T.font(size, weight);
    lines.forEach((ln, li) => {
      const ws = [...ln].map((ch) => ctx.measureText(ch).width * (o.track ?? 1.02));
      const tw = ws.reduce((a, b) => a + b, 0); maxW = Math.max(maxW, tw);
      let x = o.align === 'left' ? 0 : -tw / 2;
      [...ln].forEach((ch, i) => {
        if (ch === ' ') word++;
        out.push({ ch, x: x + ws[i] / 2, y: li * lh + (r() * 2 - 1) * 3 * (size / 88) * (jit / 4), w: ws[i], rot: (r() * 2 - 1) * jit * T.DEG, line: li, word, k: 1 + (r() * 2 - 1) * (o.sizeJit ?? 0) });
        x += ws[i];
      });
      word++; // words never span lines
    });
    ctx.restore(); return { glyphs: out, w: maxW, lines: lines.length };
  }
  // Draw glyphs [0, n): whole letters below floor(n); the next letter is revealed by a left-to-right clip sweep.
  function handDraw(ctx, glyphs, n, paint) {
    const full = Math.floor(n), frac = n - full;
    glyphs.forEach((g, i) => {
      if (i > full || (i === full && frac <= 0) || g.ch === ' ') return;
      ctx.save(); ctx.translate(g.x, g.y); ctx.rotate(g.rot);
      if (i === full) { ctx.beginPath(); ctx.rect(-g.w, -g.w * 4, g.w * 2 * frac, g.w * 8); ctx.clip(); }
      paint(ctx, g, i); ctx.restore();
    });
  }
  const penAt = (glyphs, n) => { const g = glyphs[Math.min(glyphs.length - 1, Math.max(0, Math.floor(n)))]; return g ? [g.x - g.w / 2 + g.w * (n % 1), g.y] : null; };

  // Origin helpers (the layer origin is the layer x/y; rotation of the layer is ignored for these offsets).
  const toLocal = (env, wx, wy) => (env && env.st ? [(wx - (env.st.bx ?? env.st.x)) / (env.st.s * env.st.flip || 1), (wy - (env.st.by ?? env.st.y)) / (env.st.s || 1)] : [0, 0]);
  // Head of another bean layer in this shot (world px): [x, y_center, radius] or null.
  function headOf(env, id) {
    const shot = env && env.shot; if (!shot || !id) return null;
    const B = (shot.layers || []).find((l) => l.id === id), st = B && T.layerState(B, env.lt ?? 0);
    if (!st) return null;
    const sz = (B.size ?? 420) * st.s; return [st.x, st.y - sz * 0.75, sz * 0.25];
  }

  // Curved hook arrow: quadratic from -> to bulging by `bend` (signed, px), drawn on to `p`; open V head of 2 strokes.
  function hookArrow(ctx, a, b, bend, p, o = {}) {
    if (p <= 0) return;
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
    const c = [(a[0] + b[0]) / 2 - (dy / len) * bend, (a[1] + b[1]) / 2 + (dx / len) * bend];
    const at = (t) => [(1 - t) ** 2 * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0], (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1]];
    const n = 24, pts = []; for (let i = 0; i <= n; i++) pts.push(at((i / n) * p));
    const [ex, ey] = pts[n], [qx, qy] = pts[n - 1], ang = Math.atan2(ey - qy, ex - qx), hl = o.head ?? 26;
    const path = (k) => {
      k.beginPath(); k.moveTo(pts[0][0], pts[0][1]); pts.forEach(([x, y]) => k.lineTo(x, y));
      for (const s of [-1, 1]) { k.moveTo(ex, ey); k.lineTo(ex - Math.cos(ang + s * 0.55) * hl, ey - Math.sin(ang + s * 0.55) * hl); }
    };
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = o.ink ?? INK; ctx.lineWidth = (o.w ?? 7) + (o.line ?? 4) * 2; path(ctx); ctx.stroke();
    ctx.strokeStyle = o.fill ?? '#fff'; ctx.lineWidth = o.w ?? 7; path(ctx); ctx.stroke();
    ctx.restore();
  }
  // Hand-drawn tick / cross that draws stroke by stroke (p 0..1).
  function mark(ctx, x, y, s, p, kind, color) {
    if (p <= 0) return;
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = s * 0.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const a = T.clamp(p * 2), b = T.clamp(p * 2 - 1); ctx.beginPath();
    if (kind === 'x') {
      ctx.moveTo(x - s / 2, y - s / 2); ctx.lineTo(x - s / 2 + s * a, y - s / 2 + s * a);
      if (b > 0) { ctx.moveTo(x + s / 2, y - s / 2); ctx.lineTo(x + s / 2 - s * b, y - s / 2 + s * b); }
    } else {
      ctx.moveTo(x - s * 0.45, y); ctx.lineTo(x - s * 0.45 + s * 0.35 * a, y + s * 0.35 * a);
      if (b > 0) ctx.lineTo(x - s * 0.1 + s * 0.65 * b, y + s * 0.35 - s * 0.85 * b);
    }
    ctx.stroke(); ctx.restore();
  }
  // Union of shapes with one outline: stroke all, then fill all (inner edges vanish).
  function union(ctx, shapes, fill, line, ink = INK) {
    ctx.save(); ctx.lineJoin = 'round';
    if (line > 0) { ctx.lineWidth = line * 2; ctx.strokeStyle = ink; for (const f of shapes) { ctx.beginPath(); f(ctx); ctx.stroke(); } }
    ctx.fillStyle = fill; for (const f of shapes) { ctx.beginPath(); f(ctx); ctx.fill(); } ctx.restore();
  }
  // Bust of a cast member centred at (x, y) in a box of `s` px (clipped).
  function bust(ctx, who, x, y, s, lt, env, o = {}) {
    if (!env || !env.cast) return;
    ctx.save(); ctx.beginPath(); ctx.rect(x - s / 2, y - s * 0.62, s, s * 1.1); ctx.clip();
    const size = s * (o.zoom ?? 1.25); ctx.translate(x, y + size * 0.62);
    T.layers.bean(ctx, { type: 'bean', who, size, view: o.view ?? 'front', expr: o.expr ?? 'neutral', pose: o.pose ?? 'idle', blink: false, rock: 0 }, lt, { ...env, st: null });
    ctx.restore();
  }
  // Any icon: {prop} | {who} | {creature} | {text}; centred, about `s` px tall.
  function icon(ctx, it, s, lt, env) {
    if (it.who) return bust(ctx, it.who, 0, 0, s, lt, env, it);
    if (it.creature && T.CREATURES && T.CREATURES[it.creature]) { ctx.save(); ctx.translate(0, s * 0.45); T.layers.creature(ctx, { kind: it.creature, size: s * 0.85, flip: it.flip }, lt, env); ctx.restore(); return; }
    if (it.prop) return T.drawProp(ctx, it.prop, s * (it.size ?? 0.9), lt, it);
    if (it.text != null) inkText(ctx, String(it.text), 0, s * 0.3, { size: s * 0.8, fill: it.color ?? '#fff', stroke: s * 0.06 });
  }
  // Red prohibition ring + 45 degree bar, stamped in 1 frame.
  function prohibit(ctx, r, lt) {
    if (lt < 0) return;
    ctx.save(); ctx.scale(lt < F ? 1.3 : 1, lt < F ? 1.3 : 1); ctx.strokeStyle = '#d0202a'; ctx.lineWidth = Math.max(6, r * 0.16); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.moveTo(-r * 0.7, -r * 0.7); ctx.lineTo(r * 0.7, r * 0.7); ctx.stroke(); ctx.restore();
  }
  // Number in a string counting up from 0 (keeps the original thousands separator and decimals).
  function countText(value, p) {
    const s = String(value), m = s.match(/\d[\d ,.]*\d|\d/); if (!m || p >= 1) return s;
    const raw = m[0], sep = /\d \d/.test(raw) ? ' ' : /\d,\d{3}/.test(raw) ? ',' : '';
    const digits = raw.replace(/[ ,]/g, ''), dec = digits.includes('.') ? digits.split('.')[1].length : 0;
    let out = (parseFloat(digits) * p).toFixed(dec);
    if (sep) { const [i, f] = out.split('.'); out = i.replace(/\B(?=(\d{3})+(?!\d))/g, sep) + (f ? '.' + f : ''); }
    return s.replace(raw, out);
  }
  const glove = (ctx, x, y, dir, state, size) => { if (T.drawGlove) T.drawGlove(ctx, x, y, dir, state, { size }); };

  // ================================ nameplate ================================
  // { style: rank|big|hand|slant, name, rank, sub, bullets[], bulletEvery, arrow: none|hook-left|hook-right|hook-down|
  //   straight, arrowTo: [x,y] (frame fraction) | "<bean layer id>", anchor: free|bottom-left|head, who, in: rise|pop|
  //   slide|none, hold, fadeTo, fadeDur, tilt, strike: {at, new, color}, gradient: [top, bottom], size, color }
  const NP_TILT = { rank: 0, big: 0, hand: -10, slant: -6 };
  function nameGlyphs(ctx, text, style, size, L, salt) {
    const hand = style === 'hand';
    return handLayout(ctx, text, size, seedOf(L, 'np' + salt), { weight: hand ? 800 : 900, jit: hand ? 4 : 0, align: L.anchor === 'bottom-left' ? 'left' : 'center', track: style === 'big' ? 0.9 : 1.0 });
  }
  function paintName(ctx, G, n, style, size, L) {
    const grad = style === 'slant' ? (() => { const g = ctx.createLinearGradient(0, -size * 0.75, 0, size * 0.05); const [a, b] = L.gradient ?? ['#ffe27a', '#f08a1e']; g.addColorStop(0, a); g.addColorStop(1, b); return g; })() : null;
    const o = { size, weight: style === 'hand' ? 800 : 900, fill: grad ?? L.color ?? '#fff', stroke: style === 'big' ? 7 : size * 0.08, shadow: style === 'hand' ? false : style === 'big' ? [6, 6, 0.4] : [4, 4, 0.35], cond: style === 'big' ? 0.9 : null };
    handDraw(ctx, G.glyphs, n, (k, g) => inkText(k, g.ch, 0, 0, o));
  }
  T.DOCS.nameplate = (ctx, L, lt, env) => {
    const style = oneOf(L.style, ['rank', 'big', 'hand', 'slant'], 'rank', 'nameplate style');
    const size = num(L.size, style === 'big' ? 110 : 88), anchor = oneOf(L.anchor, ['free', 'bottom-left', 'head'], 'free', 'nameplate anchor');
    const left = anchor === 'bottom-left';
    const extra = (L.sub ? 0.5 : 0) + arr(L.bullets).length * 0.5; // bottom-left: stack sub-lines upward from the anchor
    if (anchor === 'bottom-left' && L.x == null && L.y == null) ctx.translate(...toLocal(env, 72, T.H - 90 - extra * size));
    if (anchor === 'head') { const h = headOf(env, L.who); if (h) ctx.translate(...toLocal(env, h[0], h[1] - h[2] - size * 0.45)); }
    // arrow target is resolved before the entrance/tilt transforms
    let target = null;
    if (typeof L.arrowTo === 'string') { // point at the side of that bean's head that faces the arrow
      const h = headOf(env, L.arrowTo), k = L.arrow ?? 'hook-right';
      if (h) target = toLocal(env, h[0] + (k === 'hook-left' ? -1.25 : k === 'hook-down' ? 0 : 1.25) * h[2], h[1] + (k === 'hook-down' ? -1.2 : 0.35) * h[2]);
    }
    else if (Array.isArray(L.arrowTo)) target = toLocal(env, L.arrowTo[0] * T.W, L.arrowTo[1] * T.H);
    const base = ctx.getTransform();
    const ent = oneOf(L.in, ['rise', 'pop', 'slide', 'none'], style === 'big' ? 'pop' : style === 'slant' ? 'slide' : 'rise', 'nameplate in');
    const land = { rise: 8 * F, pop: 4 * F, slide: 5 * F, none: 0 }[ent];
    let a = 1;
    if (ent === 'rise') { const p = T.ease.outCubic(T.prog(lt, 0, land)); ctx.translate(0, (1 - p) * 80); a = p; }
    if (ent === 'pop') { const s = T.lerp(1.25, 1, T.ease.out(T.prog(lt, 0, land))); ctx.scale(s, s); }
    if (ent === 'slide') ctx.translate((1 - T.ease.outCubic(T.prog(lt, 0, land))) * T.W * 0.6, 0);
    const fadeTo = num(L.fadeTo, 1); // big names stay readable; set fadeTo (e.g. 0.4) only when the character changes pose
    a *= T.lerp(1, fadeTo, T.ease.inOut(T.prog(lt, land + num(L.hold, style === 'big' ? 0.33 : 0.6), num(L.fadeDur, 1))));
    ctx.globalAlpha *= a; const tilt = num(L.tilt, NP_TILT[style]) * T.DEG; ctx.rotate(tilt);
    if (style === 'slant') ctx.transform(1, 0, -0.18, 1, 0, 0);
    const name = String(L.name ?? 'NAME'), G = nameGlyphs(ctx, name, style, size, L, 'a');
    const x0 = left ? 0 : -G.w / 2, x1 = x0 + G.w;
    // strike + rename: line 6 f, hold 8 f, old name fades 6 f, new name writes 2 f per letter
    const sk = L.strike, sAt = sk ? num(sk.at, 1.5) : Infinity;
    const oldA = 1 - T.prog(lt, sAt + 14 * F, 6 * F);
    if (L.rank && oldA > 0) inkText(ctx, String(L.rank), 0, -size * 0.9, { size: size * 0.42, align: left ? 'left' : 'center', fill: L.rankColor ?? '#e0302a', stroke: 5, inner: ['#fff', 2.5] });
    if (oldA > 0) {
      ctx.save(); ctx.globalAlpha *= oldA; paintName(ctx, G, Infinity, style, size, L);
      const sp = T.prog(lt, sAt, 6 * F);
      if (sp > 0) {
        ctx.strokeStyle = sk.color ?? '#141414'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath();
        for (let i = 0; i <= 20 * sp; i++) { const x = x0 - 20 + (G.w + 40) * (i / 20); ctx[i ? 'lineTo' : 'moveTo'](x, -size * 0.32 + Math.sin(i * 0.9) * 4); }
        ctx.stroke();
      }
      ctx.restore();
    }
    let nameW = G.w;
    if (sk && sk.new && lt >= sAt + 20 * F) {
      const G2 = nameGlyphs(ctx, String(sk.new), style, size, L, 'b');
      paintName(ctx, G2, (lt - sAt - 20 * F) / (2 * F), style, size, L);
      nameW = G2.w; }
    let y = size * 0.2;
    if (L.sub) { y += size * 0.5; ctx.save(); ctx.globalAlpha *= 0.9; inkText(ctx, String(L.sub), 0, y, { size: size * 0.5, align: left ? 'left' : 'center', stroke: 5, shadow: [3, 3, 0.3], weight: style === 'hand' ? 800 : 900 }); ctx.restore(); }
    arr(L.bullets).forEach((b, i) => {
      const t0 = land + 0.2 + i * num(L.bulletEvery, 0.6), n = Math.floor((lt - t0) * 24); // 2 letters per 2.5 f
      if (n <= 0) return; y += size * 0.56;
      inkText(ctx, String(b).slice(0, n), left ? 0 : -nameW / 2, y, { size: size * 0.46, align: 'left', stroke: 4, weight: 800 });
    });
    drawNameArrow(ctx, L, lt - land - 2 * F, size, left ? 0 : -nameW / 2, left ? nameW : nameW / 2, target, base, tilt);
  };
  function drawNameArrow(ctx, L, t, size, x0, x1, target, base, tilt) {
    const kind = oneOf(L.arrow, ['none', 'hook-left', 'hook-right', 'hook-down', 'straight'], target ? 'hook-right' : 'none', 'nameplate arrow');
    if (kind === 'none' || t <= 0) return;
    const p = T.ease.out(T.prog(t, 0, 7 * F)), top = -size * 0.4;
    let end = null;
    if (target) { // express the target in the current (entered, tilted) frame
      const cur = ctx.getTransform().inverse().multiply(base);
      const q = cur.transformPoint(new DOMPoint(target[0], target[1]));
      end = [q.x, q.y]; }
    const starts = { 'hook-left': [x0 - 24, top], 'hook-right': [x1 + 24, top], 'hook-down': [(x0 + x1) / 2 + size * 0.6, size * 0.45], straight: [x1 + 24, top] };
    const start = starts[kind];
    end = end ?? { 'hook-left': [start[0] - 60, start[1] - size * 1.6], 'hook-right': [start[0] + 60, start[1] - size * 1.6], 'hook-down': [start[0] + 40, start[1] + size * 1.5], straight: [start[0] + size * 2, start[1] - size * 1.2] }[kind];
    if (kind === 'straight') {
      const e = [T.lerp(start[0], end[0], p), T.lerp(start[1], end[1], p)];
      if (Math.hypot(e[0] - start[0], e[1] - start[1]) > 30) T.drawThickArrow(ctx, [start, e], { w: 18, head: 40, fill: '#fff', line: 5, shade: false });
      return;
    }
    const len = Math.hypot(end[0] - start[0], end[1] - start[1]), mid = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2];
    const perp = [-(end[1] - start[1]) / len, (end[0] - start[0]) / len], cx = (x0 + x1) / 2;
    const out = (mid[0] - cx) * perp[0] + (mid[1] + size * 0.3) * perp[1] >= 0 ? 1 : -1; // bulge away from the name
    hookArrow(ctx, start, end, -out * len * 0.45, p, { w: 7, line: 4, head: 24 });
  }

  // ================================ timeskip ================================
  // { text, style: black|cloud|inline, color, bg, rotFrom, rotTo, scaleFrom, scaleTo, size, dur, hud (true) }
  T.DOCS.timeskip = (ctx, L, lt, env) => {
    const style = oneOf(L.style, ['black', 'cloud', 'inline'], 'black', 'timeskip style');
    if (L.hud !== false && T.hudReset) T.hudReset(ctx, L, env);
    const dur = num(L.dur, L.out != null ? L.out - (L.at ?? 0) : 2), text = String(L.text ?? '9 MONTHS LATER');
    const lin = T.clamp(lt / Math.max(0.1, dur));
    if (style === 'black') {
      ctx.save(); ctx.setTransform(env.dpr, 0, 0, env.dpr, 0, 0); ctx.fillStyle = L.bg ?? '#000'; ctx.fillRect(0, 0, T.W, T.H); ctx.restore();
      ctx.globalAlpha *= T.ease.out(T.prog(lt, 0, 15 * F)) * (1 - T.prog(lt, dur - 10 * F, 10 * F));
      ctx.rotate(T.lerp(num(L.rotFrom, -6), num(L.rotTo, -2), lin) * T.DEG);
      const s = T.lerp(num(L.scaleFrom, 0.96), num(L.scaleTo, 1.04), lin); ctx.scale(s, s);
      const size = T.fitSize(ctx, text, num(L.size, 64), T.W * 0.8, 900);
      inkText(ctx, text, 0, size * 0.35, { size, fill: L.color ?? '#f2f2f2', stroke: 0 });
      return;
    }
    if (style === 'inline') {
      ctx.globalAlpha *= T.ease.out(T.prog(lt, 0, 10 * F)) * (1 - T.prog(lt, dur - 10 * F, 10 * F));
      inkText(ctx, text, 0, 0, { size: num(L.size, 72), fill: L.color ?? '#fff', stroke: 7, shadow: [4, 4, 0.35] });
      return;
    }
    const s = lt < 4 * F ? T.lerp(0.05, 1.1, lt / (4 * F)) : T.lerp(1.1, 1, T.prog(lt, 4 * F, 2 * F));
    ctx.scale(s, s);
    T.drawCloud(ctx, 0, 0, num(L.w, 1000), num(L.h, 300), seedOf(L, 'cloud'), { color: '#ffffff', shade: '#efece6', line: 6, count: 13 });
    const size = T.fitSize(ctx, text, num(L.size, 120), num(L.w, 1000) * 0.95, 900);
    ctx.rotate(-8 * T.DEG);
    const G = handLayout(ctx, text, size, seedOf(L, 'ts'), { weight: 900, jit: 4 });
    handDraw(ctx, G.glyphs, Infinity, (k, g) => brushGlyph(k, g, size, L.color ?? '#d8242a', seedOf(L, 'tb')));
  };

  // ================================ pictobubble ================================
  // { style: speech|thought|shout, w, h, tail:[dx,dy]|false, icons:[{prop|who|creature|text|arrow, at, strike, size}],
  //   every, scene:{shot, t, scale}, list:[...], listEvery, listAt, text, size, child:{...bubble, at, dx, dy},
  //   appear: pop|cut, grow (shout), tilt, iconSize, maxH, color }
  function bubbleShapes(style, w, h, tail, seed) {
    if (style === 'speech') {
      const shapes = [(k) => T.rrect(k, -w / 2, -h / 2, w, h, Math.min(40, h / 2))];
      if (tail) {
        const c = [T.clamp(tail[0] * 0.5, -w / 2 + 70, w / 2 - 70), T.clamp(tail[1] * 0.5, -h / 2 + 30, h / 2 - 30)];
        const d = Math.hypot(tail[0] - c[0], tail[1] - c[1]) || 1, nx = -(tail[1] - c[1]) / d, ny = (tail[0] - c[0]) / d;
        shapes.push((k) => { k.moveTo(c[0] + nx * 34, c[1] + ny * 34); k.lineTo(tail[0], tail[1]); k.lineTo(c[0] - nx * 34, c[1] - ny * 34); k.closePath(); });
      }
      return shapes;
    }
    const r = T.rng(T.hash(seed)), n = style === 'shout' ? 13 : 9 + Math.floor(r() * 4), shapes = [(k) => k.ellipse(0, 0, w * 0.44, h * 0.4, 0, 0, Math.PI * 2)];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + r() * 0.2, rr = h * (style === 'shout' ? 0.2 + r() * 0.1 : 0.17 + r() * 0.06);
      const x = Math.cos(a) * (w / 2 - rr), y = Math.sin(a) * (h / 2 - rr);
      shapes.push((k) => { k.moveTo(x + rr, y); k.arc(x, y, rr, 0, Math.PI * 2); });
    }
    return shapes;
  }
  function shoutDeco(ctx, w, h, lt, seed) {
    const r = T.rng(T.hash(seed + 'sh')), n = 5 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++) { // black spike shards, popping 1 f apart
      const a = (i / n) * Math.PI * 2 + r() * 0.5, len = w * (0.3 + r() * 0.2), q = popS(lt, i * F, 3 * F);
      if (q <= 0) continue;
      const tip = [Math.cos(a) * (w / 2 + len * 0.5) * q, Math.sin(a) * (h / 2 + len * 0.5) * q], b = 0.09;
      ctx.fillStyle = '#141014'; ctx.beginPath(); ctx.moveTo(Math.cos(a - b) * w * 0.3, Math.sin(a - b) * h * 0.3); ctx.lineTo(tip[0], tip[1]); ctx.lineTo(Math.cos(a + b) * w * 0.3, Math.sin(a + b) * h * 0.3); ctx.fill();
    }
    const q = popS(lt, 2 * F, 3 * F); if (q <= 0) return;
    ctx.save(); ctx.globalAlpha *= 0.6; ctx.fillStyle = '#e0204a';
    const rx = w * 0.5 * (0.8 + 0.4 * q), ry = h * 0.5 * (0.8 + 0.4 * q); // halo ring hugging the bubble (under it)
    for (let x = -rx * 1.2; x <= rx * 1.2; x += 22) for (let y = -ry * 1.3; y <= ry * 1.3; y += 22) { const d = Math.hypot(x / rx, y / ry); if (d < 0.8 || d > 1.25) continue;
      ctx.beginPath(); ctx.arc(x, y, 8 * (1.25 - d) / 0.45 + 1, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }
  function listLayout(ctx, B, w, h, lt) {
    const items = arr(B.list), every = num(B.listEvery, 1.0), at0 = num(B.listAt, 0.3);
    const shown = items.filter((_, i) => lt >= at0 + i * every).length;
    let size = num(B.size, 40);
    const need = (n, s) => 70 + n * s * 1.3, maxH = num(B.maxH, h * 2.2);
    for (let i = 0; i < 8 && need(items.length, size) > maxH; i++) if (need(shown, size) > maxH) size *= 0.9;
    const prevH = Math.max(h, need(Math.max(0, shown - 1), size)), nextH = Math.max(h, need(shown, size));
    const hh = T.lerp(prevH, nextH, T.ease.out(T.prog(lt, at0 + (shown - 1) * every, 6 * F)));
    return { items, shown, size, hh, every, at0 };
  }
  function drawBubble(ctx, B, lt, env, seed) {
    if (lt < 0) return;
    const style = oneOf(B.style, ['speech', 'thought', 'shout'], 'speech', 'pictobubble style');
    const w = num(B.w, 620), h0 = num(B.h, 300);
    const lay = B.list ? listLayout(ctx, B, w, h0, lt) : null, h = lay ? lay.hh : h0;
    ctx.save(); ctx.rotate(num(B.tilt, 0) * T.DEG);
    if (style === 'shout') {
      const g = T.ease.outCubic(T.prog(lt, 0, 30 * F)); ctx.scale(T.lerp(0.3, num(B.grow, 1.6), g), T.lerp(0.3, num(B.grow, 1.6), g)); ctx.rotate(-8 * g * T.DEG);
      if (g > 0.65) shoutDeco(ctx, w, h, lt - 0.65 * 30 * F, seed);
    } else if (B.appear !== 'cut') { const s = popS(lt, 0, 6 * F); ctx.scale(s, s); }
    ctx.translate(0, -(h - h0) / 2); // list growth keeps the bottom edge (and the tail) in place
    const tail = B.tail === false ? null : B.tail ?? [-w * 0.2, h0 * 0.85];
    const tl = tail && [tail[0], tail[1] + (h - h0) / 2];
    const shapes = bubbleShapes(style, w, h, style === 'speech' ? tl : null, seed);
    union(ctx, shapes, style === 'shout' ? B.color ?? '#f4b6c4' : '#fff', 6, style === 'shout' ? '#4a1a2c' : INK);
    if (style === 'thought' && tl) { const e = 1 / Math.hypot(tl[0] / (w / 2), tl[1] / (h / 2)); [[0.4, 20], [0.85, 11]].forEach(([f, r]) => { const k2 = e + (1 - e) * f; T.outlined(ctx, (k) => k.arc(tl[0] * k2, tl[1] * k2, r, 0, Math.PI * 2), '#fff', { line: 6 }); }); }
    const clipIn = (k) => { k.beginPath(); if (style === 'speech') T.rrect(k, -w / 2 + 8, -h / 2 + 8, w - 16, h - 16, 32); else k.ellipse(0, 0, w * 0.46, h * 0.43, 0, 0, Math.PI * 2); };
    if (B.scene && B.scene.shot) {
      const c = T.subShot(B.scene.shot, B.scene.t ?? lt, env, { grade: B.scene.grade });
      const sc = num(B.scene.scale, Math.max((w * 0.95) / T.W, (h * 0.95) / T.H));
      ctx.save(); clipIn(ctx); ctx.clip(); ctx.drawImage(c, -T.W * sc / 2 + num(B.scene.dx, 0), -T.H * sc / 2 + num(B.scene.dy, 0), T.W * sc, T.H * sc); ctx.restore();
      ctx.save(); ctx.lineWidth = 6; ctx.strokeStyle = INK; clipIn(ctx); ctx.stroke(); ctx.restore();
    }
    if (B.icons) drawIcons(ctx, B, w, h, lt, env);
    if (lay) drawList(ctx, lay, w, h, lt);
    if (B.text != null && !B.icons && !lay) {
      const lines = String(B.text).split('\n'), size = num(B.size, 46);
      lines.forEach((ln, i) => {
        const s = T.fitSize(ctx, ln, size, w * 0.78, 900), y = (i - (lines.length - 1) / 2) * size * 1.15 + s * 0.35;
        if (style === 'shout') inkText(ctx, ln, 0, y, { size: s, italic: true, fill: '#fff', stroke: 4, ink: '#4a1a2c' });
        else inkText(ctx, ln, 0, y, { size: s, fill: INK, stroke: 0 });
      });
    }
    if (B.child) {
      const C = B.child, at = num(C.at, 1.5), cw = num(C.w, w * 0.7), ch = num(C.h, h0 * 0.75);
      const cx = num(C.dx, w * 0.32), cy = num(C.dy, -h / 2 - ch / 2 - 70), from = [w * 0.12, -h / 2 + 10];
      [[0.3, 10], [0.6, 17]].forEach(([f, r], i) => { const q = popS(lt, at + i * 3 * F, 4 * F); if (q > 0) T.outlined(ctx, (k) => k.arc(T.lerp(from[0], cx, f), T.lerp(from[1], cy + ch * 0.3, f), r * q, 0, Math.PI * 2), '#fff', { line: 5 }); });
      ctx.save(); ctx.translate(cx, cy); drawBubble(ctx, { style: 'thought', tail: false, ...C, w: cw, h: ch }, lt - at - 6 * F, env, seed + ':c'); ctx.restore();
    }
    ctx.restore();
  }
  function drawIcons(ctx, B, w, h, lt, env) {
    const items = arr(B.icons), every = num(B.every, 0.5);
    const units = items.map((it) => (it.arrow ? 0.6 : 1)), tot = units.reduce((a, b) => a + b, 0) || 1;
    const isz = num(B.iconSize, Math.min(h * 0.58, (w * 0.84) / tot));
    let x = (-tot * isz) / 2;
    items.forEach((it, i) => {
      const uw = units[i] * isz, cx = x + uw / 2; x += uw;
      const at = num(it.at, 0.25 + i * every), q = popS(lt, at, 5 * F);
      if (q <= 0) return;
      ctx.save(); ctx.translate(cx, 0);
      const st = it.strike != null ? num(it.strike, 1) : Infinity;
      if (lt >= st && lt < st + 2 * F) ctx.translate(((T.hash(i + ':' + Math.floor(lt * 30)) % 9) - 4), 0); // 4 px stamp shake
      ctx.scale(q, q);
      if (it.arrow) T.drawThickArrow(ctx, [[-uw * 0.4, 0], [uw * 0.4, 0]], { w: 18, head: 38, fill: it.color ?? '#f0a020', line: 4, shade: false });
      else icon(ctx, it, isz * 0.9, lt, env);
      if (lt >= st) prohibit(ctx, isz * 0.46, lt - st);
      ctx.restore();
    });
  }
  function drawList(ctx, lay, w, h, lt) {
    const x0 = -w * 0.4, y0 = -h / 2 + 50 + lay.size * 0.9;
    lay.items.forEach((ln, i) => {
      const t0 = lay.at0 + i * lay.every; if (lt < t0) return;
      const s = String(ln), n = Math.ceil(s.length * T.prog(lt, t0, Math.min(0.5, s.length * 0.035)));
      inkText(ctx, s.slice(0, n), x0, y0 + i * lay.size * 1.3, { size: T.fitSize(ctx, s, lay.size, w * 0.8, 900), align: 'left', fill: INK, stroke: 0 });
    });
  }
  T.DOCS.pictobubble = (ctx, L, lt, env) => drawBubble(ctx, L, lt, env, seedOf(L, 'pb'));

  // ================================ statstack ================================
  // { main:{value,label}, lines:[{at,value,label}], countUp (true), countDur 0.6, size 96, anchor: bottom-left|free,
  //   numColor '#ffd94a', lineColor '#e33333', hud (true) }
  T.DOCS.statstack = (ctx, L, lt, env) => {
    if (L.hud !== false && T.hudReset) T.hudReset(ctx, L, env);
    if ((L.anchor ?? 'bottom-left') === 'bottom-left' && L.x == null && L.y == null) ctx.translate(...toLocal(env, 60, T.H - 60));
    const size = num(L.size, 96), s2 = size * 0.42, lh = s2 * 1.3, cd = num(L.countDur, 0.6);
    const row = (v, lab, y, sz, numCol, at) => {
      const p = T.ease.out(T.prog(lt, at, 8 * F)); if (p <= 0) return;
      ctx.save(); ctx.globalAlpha *= p; ctx.translate(0, (1 - p) * 40);
      const txt = L.countUp === false ? String(v) : countText(v, T.ease.outCubic(T.prog(lt, at, cd)));
      const nw = inkText(ctx, txt, 0, y, { size: sz, align: 'left', fill: numCol, stroke: sz * 0.075, shadow: [4, 4, 0.35] });
      inkText(ctx, ' ' + String(lab ?? ''), nw, y, { size: sz, align: 'left', fill: '#fff', stroke: sz * 0.075, shadow: [4, 4, 0.35] });
      ctx.restore();
    };
    const M = L.main ?? {};
    row(M.value ?? '0', M.label, 0, size, L.numColor ?? '#ffd94a', num(M.at, 0));
    const lines = arr(L.lines).map((l, i) => ({ ...l, at: num(l.at, 1 + i) }));
    lines.forEach((l) => {
      const push = lines.reduce((acc, o) => acc + (o.at > l.at ? T.ease.out(T.prog(lt, o.at, 6 * F)) : 0), 0);
      row(l.value ?? '0', l.label, -size * 0.95 - push * lh, s2, l.color ?? L.lineColor ?? '#e33333', l.at);
    });
  };

  // ================================ unitcards ================================
  // { cards:[{who|creature|prop, n:"x50,000", at, bg, label}], w 280, gap 40, every 0.8 }
  T.DOCS.unitcards = (ctx, L, lt, env) => {
    const cards = arr(L.cards), w = num(L.w, 280), h = w * (320 / 280), gap = num(L.gap, 40);
    const total = cards.length * w + (cards.length - 1) * gap;
    cards.forEach((c, i) => {
      const q = popS(lt, num(c.at, i * num(L.every, 0.8)), 6 * F); if (q <= 0) return;
      ctx.save(); ctx.translate(-total / 2 + w / 2 + i * (w + gap), 0); ctx.scale(q, q); ctx.rotate((i % 2 ? 2 : -2) * T.DEG);
      T.outlined(ctx, (k) => T.rrect(k, -w / 2, -h / 2, w, h, 18), '#efe4c8', { line: 6, shade: (k) => { k.fillStyle = '#ddd0ae'; k.fillRect(w * 0.3, -h / 2, w, h); } });
      ctx.save(); ctx.beginPath(); T.rrect(ctx, -w / 2 + 14, -h / 2 + 14, w - 28, h - 28, 12); ctx.clip();
      ctx.fillStyle = c.bg ?? '#c9b98f'; ctx.fillRect(-w / 2, -h / 2, w, h);
      if (c.who) bust(ctx, c.who, 0, h * 0.02, w * 0.92, lt, env, { ...c, zoom: 1.35 });
      else icon(ctx, c, h * 0.55, lt, env);
      ctx.restore();
      ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.beginPath(); T.rrect(ctx, -w / 2 + 14, -h / 2 + 14, w - 28, h - 28, 12); ctx.stroke();
      if (c.label) inkText(ctx, String(c.label), 0, -h / 2 + 50, { size: T.fitSize(ctx, String(c.label), 34, w - 40, 900), stroke: 4 });
      if (c.n != null) {
        ctx.save(); ctx.translate(w * 0.5, h * 0.42); ctx.rotate(-8 * T.DEG);
        const sz = T.fitSize(ctx, String(c.n), w * 0.34, w * 1.1, 900);
        inkText(ctx, String(c.n), 0, 0, { size: sz, align: 'right', italic: true, fill: '#e0302a', stroke: 10 + 6, inner: ['#fff', 6], shadow: [5, 5, 0.35] });
        ctx.restore();
      }
      ctx.restore();
    });
  };

  // ================================ bigyear ================================
  // { text, size 300, face:[top,bottom], side, depth 12, grow 1.15, growDur 2, fade:{at,to,dur} }
  T.DOCS.bigyear = (ctx, L, lt) => {
    const keys = [[0, 0.05], [3 * F, 0.4], [6 * F, 0.9], [8 * F, 1]];
    let s = 1;
    if (lt < 8 * F) { for (let i = 1; i < keys.length; i++) if (lt < keys[i][0]) { s = T.lerp(keys[i - 1][1], keys[i][1], T.prog(lt, keys[i - 1][0], keys[i][0] - keys[i - 1][0])); break; } }
    else s = T.lerp(1, num(L.grow, 1.15), T.prog(lt, 8 * F, num(L.growDur, 2)));
    const fd = L.fade; if (fd) ctx.globalAlpha *= T.lerp(1, num(fd.to, 0.3), T.prog(lt, num(fd.at, 2.5), num(fd.dur, 0.5)));
    ctx.scale(s, s); const text = String(L.text ?? '1212'), size = T.fitSize(ctx, text, num(L.size, 300), T.W * 0.8, 900), depth = Math.round(num(L.depth, 12) * size / 300);
    ctx.font = 'italic ' + T.font(size, 900); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    ctx.strokeStyle = INK; ctx.lineWidth = 12; ctx.strokeText(text, depth, depth);
    ctx.fillStyle = L.side ?? '#b48a2a'; for (let i = depth; i >= 1; i--) ctx.fillText(text, i, i);
    ctx.strokeText(text, 0, 0);
    const [a, b] = L.face ?? ['#f3d65a', '#e2b83a'], g = ctx.createLinearGradient(0, -size * 0.4, 0, size * 0.4);
    g.addColorStop(0, a); g.addColorStop(1, b); ctx.fillStyle = g; ctx.fillText(text, 0, 0);
    ctx.save(); ctx.beginPath(); ctx.rect(-T.W, -size, T.W * 2, size * 0.95); ctx.clip();
    ctx.strokeStyle = '#fff3b0'; ctx.lineWidth = 3; ctx.strokeText(text, -1, -1); ctx.restore();
  };

  // ================================ band ================================
  // { y 0.18, h 0.22, header, sub, items[], every 1, retireAt, retireColor, outAt, alpha 0.45, headerFrom, headerTo,
  //   headerSize 72, itemSize 110, subColor } — full-width, screen-locked (hud false = centred on the layer)
  T.DOCS.band = (ctx, L, lt, env) => {
    if (L.hud !== false) { ctx.setTransform(env.dpr, 0, 0, env.dpr, 0, 0); ctx.translate(T.W / 2, 0); } else ctx.translate(0, -num(L.y, 0.18) * T.H - num(L.h, 0.22) * T.H / 2);
    const y = num(L.y, 0.18) * T.H, h = num(L.h, 0.22) * T.H, items = arr(L.items);
    ctx.globalAlpha *= 1 - (L.outAt != null ? T.prog(lt, L.outAt, 10 * F) : 0);
    ctx.fillStyle = `rgba(0,0,0,${num(L.alpha, 0.45) * T.prog(lt, 0, 4 * F)})`; ctx.fillRect(-T.W / 2, y, T.W, h);
    const hs = num(L.headerSize, 72), is = num(L.itemSize, 110), hasItems = items.length > 0;
    const hy = hasItems ? y + hs * 0.95 : y + h / 2 + (L.sub ? -hs * 0.05 : hs * 0.35);
    if (L.header) inkText(ctx, String(L.header), 0, hy, { size: T.fitSize(ctx, String(L.header), hs, T.W * 0.9, 900), fill: T.mix(L.headerFrom ?? '#c3161f', L.headerTo ?? '#ffe94a', T.prog(lt, 0, 6 * F)), stroke: 6, shadow: [4, 4, 0.35] });
    if (L.sub) { const q = T.ease.out(T.prog(lt, 0.25, 8 * F)); ctx.save(); ctx.globalAlpha *= q; inkText(ctx, String(L.sub), 0, hy + hs * 0.85, { size: T.fitSize(ctx, String(L.sub), hs * 0.6, T.W * 0.85, 900), fill: L.subColor ?? '#ffd94a', stroke: 5 }); ctx.restore(); }
    const retire = L.retireAt != null ? T.prog(lt, L.retireAt, 10 * F) : 0, fill = T.mix('#ffffff', '#ffd6cf', retire);
    const span = T.W * 0.8, iy = y + h - (h - hs * 1.2) / 2 + is * 0.1;
    items.forEach((it, i) => {
      const at = 0.3 + i * num(L.every, 1), q = popS(lt, at, 8 * F); if (q <= 0) return;
      ctx.save(); ctx.translate(items.length === 1 ? 0 : -span / 2 + (span * (i + 0.5)) / items.length, Math.min(iy, y + h - is * 0.12)); ctx.rotate((1 - T.prog(lt, at, 8 * F)) * -5 * T.DEG); ctx.scale(q, q);
      inkText(ctx, String(it), 0, 0, { size: is, fill, stroke: 7, shadow: [4, 4, 0.35] });
      const sp = L.retireAt != null ? T.ease.out(T.prog(lt, L.retireAt + i * 3 * F, 6 * F)) : 0; // strikes land 3 f apart
      if (sp > 0) { ctx.font = T.font(is, 900); const hw = ctx.measureText(String(it)).width / 2 + 16, sy = -is * 0.32;
        ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-hw, sy + 6); ctx.lineTo(-hw + 2 * hw * sp, sy - 6 * sp + 6 * (1 - sp));
        ctx.strokeStyle = INK; ctx.lineWidth = 22; ctx.stroke(); ctx.strokeStyle = L.retireColor ?? '#e0302a'; ctx.lineWidth = 13; ctx.stroke(); }
      ctx.restore();
    });
  };

  // ================================ graffiti ================================
  // { text, style: brush|blood|paint, color, size 170, wall: brick|parchment|plaster|none, w, h, tilt -4,
  //   write:{at,dur}, cover:{at,dur,color,tool:roller|eraser,line}, erase:{word,at,dur}, rewrite:{text,at,perLetter,color},
  //   hands, flood:{at,dur,to}, thumb:{at} }
  const WALLS = { brick: '#d9d9d6', parchment: '#e8d8c0', plaster: '#d9cdb0' };
  function wall(ctx, kind, w, h, base, seed) {
    if (kind === 'none') return; ctx.fillStyle = base; ctx.fillRect(-w / 2, -h / 2, w, h);
    const r = T.rng(T.hash(seed + 'wall'));
    ctx.fillStyle = 'rgba(70,60,50,0.035)';
    for (let i = 0; i < 30; i++) { const rr = 40 + r() * 140; ctx.beginPath(); ctx.ellipse(-w / 2 + r() * w, -h / 2 + r() * h, rr, rr * (0.6 + r() * 0.3), r() * 3, 0, Math.PI * 2); ctx.fill(); }
    ctx.strokeStyle = kind === 'brick' ? 'rgba(110,108,104,0.45)' : 'rgba(110,90,60,0.25)'; ctx.lineWidth = kind === 'brick' ? 4 : 2;
    if (kind === 'brick') for (let y = -h / 2, row = 0; y < h / 2; y += 64, row++) {
      ctx.beginPath(); ctx.moveTo(-w / 2, y); ctx.lineTo(w / 2, y);
      for (let x = -w / 2 + (row % 2) * 80; x < w / 2; x += 160) { ctx.moveTo(x, y); ctx.lineTo(x, y + 64); }
      ctx.stroke();
    } else for (let i = 0; i < 5; i++) { let x = -w / 2 + r() * w, y = -h / 2 + r() * h; ctx.beginPath(); ctx.moveTo(x, y); for (let j = 0; j < 5; j++) { x += (r() - 0.5) * 80; y += 20 + r() * 40; ctx.lineTo(x, y); } ctx.stroke(); }
  }
  // Brush glyph: the letter painted 3 times with seeded +-2 px offsets for a rough dry edge.
  function brushGlyph(ctx, g, size, color, seed) {
    const r = T.rng(T.hash(seed + g.ch + g.x)); ctx.font = T.font(size * g.k, 900); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = color;
    for (let i = 0; i < 3; i++) ctx.fillText(g.ch, (r() - 0.5) * 4, (r() - 0.5) * 4);
  }
  function bloodGlyph(ctx, g, size, color) {
    ctx.font = T.font(size * g.k, 900); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.strokeStyle = '#8a0a10'; ctx.lineWidth = 3; ctx.strokeText(g.ch, 3, 3); ctx.fillStyle = '#8a0a10'; ctx.fillText(g.ch, 3, 3);
    ctx.fillStyle = color; ctx.fillText(g.ch, 0, 0);
  }
  function drips(ctx, G, size, color, seed, lt, revealAt, perGlyph) {
    const r = T.rng(T.hash(seed + 'drip'));
    G.forEach((g, i) => {
      if (g.ch === ' ') return;
      const n = perGlyph === 2 ? 1 + Math.floor(r() * 2) : r() < 0.5 ? 1 : 0;
      for (let j = 0; j < n; j++) {
        const x = g.x + (r() - 0.5) * g.w * 0.6, len = (30 + r() * 90) * (size / 170), wd = 6 + r() * 5;
        const p = T.ease.out(T.prog(lt, revealAt(i + 1), 1.5)); if (p <= 0) continue;
        const y0 = g.y - size * 0.05, y1 = y0 + len * p;
        ctx.fillStyle = color; ctx.beginPath(); T.rrect(ctx, x - wd / 2, y0 - 8, wd, y1 - y0 + 8, wd / 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x, y1, wd * 0.8, 0, Math.PI * 2); ctx.fill();
      }
    });
  }
  function regionOf(G, pick, size) {
    const gs = G.filter((g) => g.ch !== ' ' && pick(g)); if (!gs.length) return null;
    const x0 = Math.min(...gs.map((g) => g.x - g.w / 2)), x1 = Math.max(...gs.map((g) => g.x + g.w / 2));
    const y1 = Math.max(...gs.map((g) => g.y)) + size * 0.2, y0 = Math.min(...gs.map((g) => g.y)) - size * 0.82;
    return [x0 - size * 0.25, y0, x1 + size * 0.25, y1];
  }
  // Sweep that covers a region right-to-left with a ragged leading edge; roller or eraser rides the edge.
  function sweep(ctx, reg, p, color, tool, lt, seed) {
    if (p <= 0) return null;
    const [x0, y0, x1, y1] = reg, ex = T.lerp(x1, x0, p), n = 16;
    const edge = (i) => { const y = T.lerp(y0, y1, i / n); return [ex + Math.sin(y * 0.045) * 10 + T.noise(y * 0.03, seed) * 10, y]; };
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x1 + 6, y0 + T.noise(1, seed) * 6);
    for (let i = 0; i <= n; i++) { const [x, y] = edge(i); ctx.lineTo(Math.min(x, x1 + 6), y + (i === 0 ? T.noise(x * 0.02, seed) * 6 : i === n ? T.noise(x * 0.02, seed + 'b') * 6 : 0)); }
    ctx.lineTo(x1 + 6, y1); ctx.closePath(); ctx.fill();
    const my = (y0 + y1) / 2, hh = y1 - y0;
    if (p >= 1) return [ex, my];
    if (tool === 'eraser') {
      const wob = Math.sin(lt * 40) * hh * 0.18;
      ctx.save(); ctx.translate(ex + 30, my + wob); ctx.rotate(12 * T.DEG);
      T.outlined(ctx, (k) => T.rrect(k, -40, -60, 80, 120, 14), '#f2a3b4', { line: 6, shade: (k) => { k.fillStyle = '#d98698'; k.fillRect(10, -60, 40, 120); } });
      ctx.restore(); glove(ctx, ex + 70, my + wob + 60, -2.3, 'grab', 150);
    } else {
      ctx.save(); ctx.translate(ex + 30, my);
      ctx.strokeStyle = INK; ctx.lineWidth = 16; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(30, 0); ctx.lineTo(70, 0); ctx.lineTo(160, hh * 0.9); ctx.stroke();
      ctx.strokeStyle = '#9a9ea6'; ctx.lineWidth = 8; ctx.stroke();
      T.outlined(ctx, (k) => T.rrect(k, -30, -hh * 0.48, 60, hh * 0.96, 18), '#f5d020', { line: 6, shade: (k) => { k.fillStyle = '#d8b414'; k.fillRect(10, -hh, 30, hh * 2); } });
      ctx.restore(); glove(ctx, ex + 200, my + hh * 0.95, -0.7, 'grab', 160);
    }
    return [ex, my];
  }
  T.DOCS.graffiti = (ctx, L, lt, env) => {
    const style = oneOf(L.style, ['brush', 'blood', 'paint'], 'brush', 'graffiti style');
    const wk = oneOf(L.wall, ['brick', 'parchment', 'plaster', 'none'], 'brick', 'graffiti wall'), seed = seedOf(L, 'gr');
    const w = num(L.w, 2000), h = num(L.h, 1140), size = num(L.size, 170);
    const fl = L.flood, flood = fl ? T.prog(lt, num(fl.at, 2), num(fl.dur, 1)) : 0, base = WALLS[wk] ?? '#d9d9d6';
    wall(ctx, wk, w, h, T.mix(base, (fl && fl.to) ?? '#e02020', flood * 0.55), seed);
    ctx.save(); ctx.translate(num(L.tx, 0), num(L.ty, 0)); ctx.rotate(num(L.tilt, -4) * T.DEG);
    const color = L.color ?? (style === 'blood' ? '#c8141c' : '#e0202a');
    const G = handLayout(ctx, String(L.text ?? 'TEXT'), size, seed, { weight: 900, jit: 4, lh: size * 1.12, sizeJit: style === 'paint' ? 0.05 : 0 });
    const lines = G.lines; G.glyphs.forEach((g) => (g.y -= ((lines - 1) * size * 1.12) / 2 - size * 0.35));
    const wr = L.write ?? {}, wAt = num(wr.at, 0.2), wDur = num(wr.dur, 1.2), N = G.glyphs.length;
    const n = T.clamp((lt - wAt) / wDur) * N, revealAt = (i) => wAt + (i / N) * wDur;
    if (style !== 'brush') drips(ctx, G.glyphs, size, color, seed, lt, revealAt, style === 'blood' ? 2 : 1);
    if (style === 'blood') { // spatter dots appear with their nearest letter
      const r = T.rng(T.hash(seed + 'sp')), cnt = 30 + Math.floor(r() * 30), xs = G.w / 2 + size * 0.5;
      ctx.fillStyle = color;
      for (let i = 0; i < cnt; i++) { const x = (r() * 2 - 1) * xs, y = (r() * 2 - 1) * size * lines * 0.75, rad = 2 + r() * 7, gi = Math.floor(((x + xs) / (2 * xs)) * N); if (n >= gi + 1) { ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill(); } }
    }
    handDraw(ctx, G.glyphs, n, (k, g) => (style === 'blood' ? bloodGlyph(k, g, size, color) : brushGlyph(k, g, size, color, seed)));
    const pen = n > 0 && n < N ? penAt(G.glyphs, n) : null;
    const cv = L.cover, er = L.erase;
    let reg = null;
    if (cv) {
      const line = num(cv.line, lines - 1); reg = regionOf(G.glyphs, (g) => g.line === line, size);
      if (reg) sweep(ctx, reg, T.prog(lt, num(cv.at, 2), num(cv.dur, 1.2)), cv.color ?? '#f5d020', cv.tool ?? 'roller', lt, seed + 'cv');
    }
    if (er) { const r2 = regionOf(G.glyphs, (g) => g.word === num(er.word, 0), size); if (r2) sweep(ctx, r2, T.prog(lt, num(er.at, 2), num(er.dur, 0.8)), T.mix(base, (fl && fl.to) ?? '#e02020', flood * 0.55), 'eraser', lt, seed + 'er'); }
    const rw = L.rewrite;
    if (rw && reg) {
      const rs = (reg[3] - reg[1]) * 0.55, R = handLayout(ctx, String(rw.text ?? 'RELOCATED!!'), rs, seed + 'rw', { weight: 900, jit: 5 });
      const fit = Math.min(1, (reg[2] - reg[0]) * 0.95 / R.w), m = (lt - num(rw.at, 3.4)) / num(rw.perLetter, 0.2);
      if (m > 0) {
        ctx.save(); ctx.translate((reg[0] + reg[2]) / 2, (reg[1] + reg[3]) / 2 + rs * 0.35); ctx.scale(fit, fit);
        handDraw(ctx, R.glyphs, m, (k, g) => brushGlyph(k, g, rs, rw.color ?? INK, seed + 'rwb'));
        const pp = m < R.glyphs.length ? penAt(R.glyphs, m) : null;
        if (pp) { // brush prop held by a glove at the current letter
          ctx.translate(pp[0], pp[1] - rs * 0.3); ctx.rotate(Math.PI * 0.8); ctx.translate(0, -30);
          ctx.fillStyle = '#7a4a26'; ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.beginPath(); ctx.rect(-8, -230, 16, 190); ctx.fill(); ctx.stroke();
          T.outlined(ctx, (k) => k.rect(-12, -50, 24, 30), '#b8bcc4', { line: 5 }); T.outlined(ctx, (k) => { k.moveTo(-12, -20); k.quadraticCurveTo(0, 30, 12, -20); k.closePath(); }, '#2a1c15', { line: 4 });
          glove(ctx, 0, -150, Math.PI * 0.95, 'grab', 120);
        }
        ctx.restore();
      }
    }
    ctx.restore();
    if (L.hands) { // two gloves from the bottom corners; the right one follows the writing point
      glove(ctx, -w * 0.38, h * 0.36, 0.5, 'open', 220);
      const hp = pen ? [pen[0] + 40, pen[1] + size * 0.3] : [w * 0.36, h * 0.36];
      glove(ctx, hp[0], hp[1], -0.6, pen ? 'point' : 'open', 220);
    }
    if (L.thumb) { const q = T.ease.outBack(T.prog(lt, num(L.thumb.at, 5), 8 * F)); if (q > 0) glove(ctx, T.lerp(w * 0.7, w * 0.3, q), T.lerp(h * 0.7, h * 0.22, q), -0.25, 'thumb', 300); }
  };

  // ================================ scorecard ================================
  // { title, rows 6, cols:[STATEMENT, TRUE, FALSE], marks:[{row, col:'true'|'false'|index, at, kind}], stand, tilt 4,
  //   verdict:{text, at, color}, w 420, h 520 }
  T.DOCS.scorecard = (ctx, L, lt, env) => {
    T.docPop(ctx, lt);
    const w = num(L.w, 420), h = num(L.h, 520), rows = Math.max(1, num(L.rows, 6)), cols = arr(L.cols).length ? arr(L.cols) : ['STATEMENT', 'TRUE', 'FALSE'];
    ctx.rotate(num(L.tilt, 4) * T.DEG);
    if (L.stand !== false) { T.outlined(ctx, (k) => k.rect(-4, h / 2 - 10, 8, 170), '#8a6a3a', { line: 4 }); T.outlined(ctx, (k) => k.ellipse(0, h / 2 + 165, 70, 14, 0, 0, Math.PI * 2), '#6a4a24', { line: 5 }); }
    T.outlined(ctx, (k) => k.rect(-w / 2, -h / 2, w, h), '#ffffff', { line: 6, shade: (k) => { k.fillStyle = '#e6e1d6'; k.fillRect(w * 0.38, -h / 2, w, h); } });
    const G = handLayout(ctx, String(L.title ?? 'The Speech'), 40, seedOf(L, 'sct'), { weight: 800, jit: 3 });
    ctx.save(); ctx.translate(0, -h / 2 + 58); handDraw(ctx, G.glyphs, Infinity, (k, g) => inkText(k, g.ch, 0, 0, { size: Math.min(40, (w * 0.85) / Math.max(1, G.w) * 40), weight: 800, fill: INK, stroke: 0 })); ctx.restore();
    const tx = -w / 2 + 20, ty = -h / 2 + 90, tw = w - 40, th = h - 110, cw = [0.7, 0.15, 0.15], hr = 34, rh = (th - hr) / rows;
    const cx = (c) => tx + tw * cw.slice(0, c).reduce((a, b) => a + b, 0);
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath();
    for (let r = 0; r <= rows + 1; r++) { const y = r === 0 ? ty : ty + hr + (r - 1) * rh; ctx.moveTo(tx, y); ctx.lineTo(tx + tw, y); }
    for (let c = 0; c <= 3; c++) { ctx.moveTo(cx(c), ty); ctx.lineTo(cx(c), ty + th); }
    ctx.stroke();
    cols.slice(0, 3).forEach((c, i) => inkText(ctx, String(c), cx(i) + tw * cw[i] / 2, ty + hr * 0.72, { size: T.fitSize(ctx, String(c), 20, tw * cw[i] - 8, 900), fill: INK, stroke: 0 }));
    const r = T.rng(T.hash(seedOf(L, 'scs')));
    ctx.strokeStyle = '#9a9590'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let i = 0; i < rows; i++) for (let s = 0, n = 2 + Math.floor(r() * 2); s < n; s++) {
      const y = ty + hr + i * rh + rh * (0.3 + s * 0.22), x1 = cx(1) - 10 - r() * tw * 0.25;
      ctx.beginPath(); ctx.moveTo(tx + 10, y); for (let x = tx + 10; x < x1; x += 12) ctx.lineTo(x, y + (r() - 0.5) * 4); ctx.stroke();
    }
    for (const m of arr(L.marks)) {
      const col = m.col === 'true' ? 1 : m.col === 'false' ? 2 : num(m.col, 2), at = num(m.at, 0.4), kind = m.kind ?? (col === 1 ? 'tick' : 'x');
      const x = cx(col) + tw * cw[col] / 2, y = ty + hr + num(m.row, 0) * rh + rh / 2, s = kick(lt, at + 8 * F, 5 * F);
      ctx.save(); ctx.translate(x, y); ctx.scale(s, s); mark(ctx, 0, 0, Math.min(rh, tw * 0.15) * 0.62, T.prog(lt, at, 8 * F), kind, m.color ?? (kind === 'x' ? '#d4202a' : '#2fa84a')); ctx.restore();
    }
    if (L.verdict) { ctx.save(); ctx.translate(0, h * 0.3); T.DOCS.stamp(ctx, { size: 64, tilt: -14, ...L.verdict, text: L.verdict.text ?? 'FALSE' }, lt - num(L.verdict.at, 3), env); ctx.restore(); }
  };

  // ================================ tally ================================
  // { title, value "0", scribble:{at, text, every 0.1, color}, easel (true), w 640, h 480 }
  T.DOCS.tally = (ctx, L, lt) => {
    T.docPop(ctx, lt);
    const w = num(L.w, 640), h = num(L.h, 480);
    if (L.easel !== false) {
      const leg = (x0, x1, c) => T.outlined(ctx, (k) => { k.moveTo(x0 - 12, -h / 2 - 60); k.lineTo(x0 + 12, -h / 2 - 60); k.lineTo(x1 + 14, h / 2 + 280); k.lineTo(x1 - 14, h / 2 + 280); k.closePath(); }, c, { line: 6 });
      leg(0, 0, '#6e4520'); leg(-w * 0.12, -w * 0.42, '#8a5a2a'); leg(w * 0.12, w * 0.42, '#8a5a2a');
      T.outlined(ctx, (k) => k.rect(-w * 0.55, h / 2 - 6, w * 1.1, 26), '#8a5a2a', { line: 6 });
    }
    T.outlined(ctx, (k) => k.rect(-w / 2, -h / 2, w, h), '#fbf7ee', { line: 7, shade: (k) => { k.fillStyle = 'rgba(140,100,40,0.1)'; k.fillRect(w * 0.3, -h / 2, w, h); } });
    const title = String(L.title ?? 'AMOUNT PRODUCED:');
    inkText(ctx, title, 0, -h / 2 + 64, { size: T.fitSize(ctx, title, 34, w - 50, 900), fill: INK, stroke: 0 });
    const vs = 160, value = String(L.value ?? '0'), vx = -w / 2 + 40;
    const vw = inkText(ctx, value, vx, -h / 2 + 90 + vs * 0.8, { size: vs, align: 'left', fill: INK, stroke: 0 });
    const sc = L.scribble; if (!sc) return;
    const chars = [...String(sc.text ?? '999999')], every = num(sc.every, 0.1), r = T.rng(T.hash(seedOf(L, 'tal')));
    let x = vx + vw + 6, y = -h / 2 + 90 + vs * 0.8;
    chars.forEach((ch, i) => {
      const sz = vs * (0.85 + Math.min(0.3, i * 0.025) * r()) , rot = (r() - 0.5) * 12 * T.DEG, cw = T.measure(ctx, ch, sz, 800);
      if (x + cw > w / 2 - 20) { x = -w / 2 + 30; y += vs * 0.95; }
      const at = num(sc.at, 1) + i * every;
      if (lt >= at) { ctx.save(); ctx.translate(x + cw / 2, y); ctx.rotate(rot); const s = lt < at + 2 * F ? T.lerp(1.2, 1, (lt - at) / (2 * F)) : 1; ctx.scale(s, s); inkText(ctx, ch, 0, 0, { size: sz, weight: 800, fill: sc.color ?? '#1a2a8a', stroke: 0 }); ctx.restore(); }
      x += cw * 0.92;
    });
  };

  // ================================ list ================================
  // { paper: scroll|sheet, title, items[], every 0.3, itemsAt 0.3, size 40, w 620, rowH 64, strike:[{item|'title',at,color}],
  //   retitle:{text,at,color}, ticks:[{item,at}], insertTitle:{text,at}, pencil, spill:{at}|true }
  function pencilHand(ctx, x, y, bob) {
    ctx.save(); ctx.translate(x, y + bob); ctx.rotate(25 * T.DEG);
    T.outlined(ctx, (k) => { k.moveTo(0, 0); k.lineTo(-11, -34); k.lineTo(11, -34); k.closePath(); }, '#f0d9b0', { line: 5 });
    ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-4, -12); ctx.lineTo(4, -12); ctx.fill();
    T.outlined(ctx, (k) => k.rect(-11, -200, 22, 166), '#f2c24a', { line: 5, shade: (k) => { k.fillStyle = '#d9a52c'; k.fillRect(3, -200, 8, 166); } });
    T.outlined(ctx, (k) => T.rrect(k, -11, -232, 22, 34, 8), '#f29ab0', { line: 5 });
    ctx.restore();
    glove(ctx, x + 40, y + bob - 90, Math.PI * 0.85, 'grab', 120);
  }
  T.DOCS.list = (ctx, L, lt) => {
    T.docPop(ctx, lt);
    const paper = oneOf(L.paper, ['scroll', 'sheet'], 'sheet', 'list paper'), items = arr(L.items).map(String);
    const size = num(L.size, 40), rowH = num(L.rowH, 64), w = num(L.w, 620), ins = L.insertTitle;
    const h = num(L.h, 170 + (items.length + (ins ? 1 : 0)) * rowH), seed = seedOf(L, 'li');
    const sp = L.spill ? (L.spill === true ? 0 : num(L.spill.at, 0)) : Infinity;
    if (lt >= sp) { // swaps in 1 frame to a long paper spilling to the floor in wavy fold bands
      const len = num(L.spill.len, 900);
      for (let y = h / 2 - 20, i = 0; y < h / 2 + len; y += 70, i++) {
        const wv = (yy) => Math.sin(yy * 0.012 + i) * 18;
        T.outlined(ctx, (k) => { k.moveTo(-w / 2 + wv(y), y); k.lineTo(w / 2 + wv(y), y); k.lineTo(w / 2 + wv(y + 72) + i * 6, y + 72); k.lineTo(-w / 2 + wv(y + 72) - i * 6, y + 72); k.closePath(); }, i % 2 ? '#e6d6ae' : '#efe2c0', { line: 5 });
        ctx.fillStyle = 'rgba(42,28,21,0.35)'; for (let j = 0; j < 2; j++) ctx.fillRect(-w / 2 + 60 + wv(y), y + 22 + j * 24, w * (0.4 + ((i * 7 + j * 3) % 5) * 0.08), 6);
      }
    }
    T.outlined(ctx, (k) => k.rect(-w / 2, -h / 2, w, h), paper === 'scroll' ? '#efe2c0' : '#fbf7ee', { line: 7, shade: (k) => { k.fillStyle = 'rgba(140,100,40,0.1)'; k.fillRect(w * 0.3, -h / 2, w, h); } });
    if (paper === 'scroll') for (const s of [-1, 1]) if (s < 0 || lt < sp) T.outlined(ctx, (k) => T.rrect(k, -w / 2 - 26, s * h / 2 - 26, w + 52, 52, 24), '#d8c49a', { line: 7, shade: (k) => { k.fillStyle = '#c4ad7e'; k.fillRect(-w, s * h / 2 + 4, w * 2, 30); } });
    const insP = ins ? T.ease.out(T.prog(lt, num(ins.at, 0.5), 6 * F)) : 0;
    const x0 = -w / 2 + 70, ty = -h / 2 + 80 + insP * rowH, col = INK, ink = { weight: 800, fill: col, stroke: 0 };
    let pen = null, letters = 0;
    const write = (text, x, y, sz, t0, dur, o = {}) => {
      const G = handLayout(ctx, text, sz, seed + text + y, { align: 'left', jit: 3 });
      const n = T.clamp((lt - t0) / dur) * G.glyphs.length;
      ctx.save(); ctx.translate(x, y); ctx.rotate((o.rot ?? 0) * T.DEG); handDraw(ctx, G.glyphs, n, (k, g) => inkText(k, g.ch, 0, 0, { ...ink, size: sz, fill: o.color ?? col }));
      if (n > 0 && n < G.glyphs.length) { const p = penAt(G.glyphs, n); const m = ctx.getTransform(); ctx.restore(); const q = ctx.getTransform().inverse().multiply(m).transformPoint(new DOMPoint(p[0], p[1])); pen = [q.x, q.y]; letters = Math.floor(n); return G.w; }
      ctx.restore(); return G.w;
    };
    if (ins) write(String(ins.text ?? 'TO DO LIST:'), x0 - 30, -h / 2 + 80, size * 1.2, num(ins.at, 0.5) + 6 * F, 0.7);
    const titleW = L.title ? write(String(L.title), x0 - 30, ty, size * 1.3, 0, 0.001) : 0;
    const every = num(L.every, 0.3), at0 = num(L.itemsAt, 0.3), rowY = (i) => ty + (i + 1) * rowH + 10;
    const widths = items.map((it, i) => write(it, x0, rowY(i), size, at0 + i * every, Math.min(every * 0.9, it.length * 0.04)));
    for (const tk of arr(L.ticks)) { const i = num(tk.item, 0), p = T.prog(lt, num(tk.at, 1), 5 * F); mark(ctx, x0 - 34, rowY(i) - size * 0.3, 34, p, 'tick', tk.color ?? '#2fa84a'); if (p > 0 && p < 1) pen = [x0 - 34, rowY(i) - size * 0.3]; }
    for (const sk of arr(L.strike)) {
      const isT = sk.item === 'title', y = isT ? ty - size * 0.4 : rowY(num(sk.item, 0)) - size * 0.32, wd = isT ? titleW : widths[num(sk.item, 0)] ?? 200;
      const xs = isT ? x0 - 40 : x0 - 10, p = T.prog(lt, num(sk.at, 1), 6 * F); if (p <= 0) continue;
      ctx.strokeStyle = sk.color ?? '#c8141c'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(xs, y); ctx.lineTo(xs + (wd + 20) * p, y - 4 + Math.sin(p * 8) * 3); ctx.stroke();
      if (p < 1) pen = [xs + (wd + 20) * p, y];
    }
    if (L.retitle) write(String(L.retitle.text ?? 'MENU'), x0 + titleW * 0.35, ty - size * 1.2, size * 1.3, num(L.retitle.at, 2.8), 12 * F, { color: L.retitle.color ?? '#c8141c', rot: -5 });
    if (L.pencil && pen) pencilHand(ctx, pen[0], pen[1], letters % 2 ? -2 : 0);
  };

  // ================================ crayon ================================
  // { outline:[[x,y]...] (0..1 of the sheet), items:[figure|rocket|$|box|castle|heart|star|sun|crown|<text>], caption,
  //   color, recolor:{at,color}, paper, w 900, h 640, drawAt 0.2, drawDur 1.0, cut:{at} }
  const CRAYON = { // unit strokes (polylines in -0.5..0.5)
    figure: () => [circ(0, -0.32, 0.12, 10), [[0, -0.2], [0, 0.15]], [[-0.25, -0.05], [0, -0.1], [0.25, -0.05]], [[-0.18, 0.45], [0, 0.15], [0.18, 0.45]]],
    rocket: () => [[[0, -0.5], [0.14, -0.25], [0.14, 0.25], [-0.14, 0.25], [-0.14, -0.25], [0, -0.5]], [[-0.14, 0.1], [-0.28, 0.32], [-0.14, 0.25]], [[0.14, 0.1], [0.28, 0.32], [0.14, 0.25]], [[-0.08, 0.3], [-0.04, 0.48], [0, 0.32], [0.04, 0.48], [0.08, 0.3]], circ(0, -0.12, 0.06, 8)],
    $: () => [[[0.2, -0.28], [0, -0.36], [-0.2, -0.26], [-0.18, -0.06], [0.18, 0.06], [0.2, 0.26], [0, 0.36], [-0.22, 0.26]], [[0, -0.48], [0, 0.48]]],
    box: () => { const z = [[-0.35, -0.3], [0.35, -0.3], [0.35, 0.3], [-0.35, 0.3], [-0.35, -0.3]], s = []; for (let i = 0; i < 7; i++) s.push([-0.32 + i * 0.1, i % 2 ? -0.26 : 0.26]); return [z, s]; },
    castle: () => [[[-0.4, 0.4], [-0.4, -0.2], [-0.3, -0.2], [-0.3, -0.3], [-0.2, -0.3], [-0.2, -0.2], [-0.05, -0.2], [-0.05, -0.3], [0.05, -0.3], [0.05, -0.2], [0.2, -0.2], [0.2, -0.3], [0.3, -0.3], [0.3, -0.2], [0.4, -0.2], [0.4, 0.4], [-0.4, 0.4]], [[-0.1, 0.4], [-0.1, 0.15], [0, 0.05], [0.1, 0.15], [0.1, 0.4]], [[0, -0.3], [0, -0.55], [0.18, -0.48], [0, -0.42]]],
    heart: () => [[[0, 0.35], [-0.35, 0], [-0.35, -0.2], [-0.2, -0.32], [0, -0.18], [0.2, -0.32], [0.35, -0.2], [0.35, 0], [0, 0.35]]],
    star: () => [Array.from({ length: 11 }, (_, i) => { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 0.18 : 0.45; return [Math.cos(a) * r, Math.sin(a) * r]; })],
    sun: () => { const s = [circ(0, 0, 0.22, 12)]; for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4; s.push([[Math.cos(a) * 0.3, Math.sin(a) * 0.3], [Math.cos(a) * 0.46, Math.sin(a) * 0.46]]); } return s; },
    crown: () => [[[-0.4, 0.25], [-0.4, -0.25], [-0.2, 0], [0, -0.35], [0.2, 0], [0.4, -0.25], [0.4, 0.25], [-0.4, 0.25]]],
  };
  function circ(cx, cy, r, n) { return Array.from({ length: n + 1 }, (_, i) => [cx + Math.cos((i / n) * Math.PI * 2) * r, cy + Math.sin((i / n) * Math.PI * 2) * r]); }
  const inPoly = (pt, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) c = !c; } return c; };
  function crayonStrokes(L, w, h, seed) {
    const r = T.rng(T.hash(seed)), wob = (pts, k = 3) => pts.map(([x, y]) => [x + (r() - 0.5) * 2 * k, y + (r() - 0.5) * 2 * k]);
    const ol = arr(L.outline).length >= 3 ? L.outline : [[0.2, 0.3], [0.8, 0.25], [0.75, 0.8], [0.25, 0.75]];
    const poly = ol.map(([x, y]) => [(x - 0.5) * w, (y - 0.5) * h]), strokes = [wob([...poly, poly[0]])];
    const xs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]), placed = [], isz = num(L.itemSize, Math.min(w, h) * 0.22), texts = [];
    for (const it of arr(L.items)) {
      let pt = null;
      for (let t = 0; t < 40 && !pt; t++) { const c = [Math.min(...xs) + r() * (Math.max(...xs) - Math.min(...xs)), Math.min(...ys) + r() * (Math.max(...ys) - Math.min(...ys))]; if (inPoly(c, poly) && placed.every((p) => Math.hypot(p[0] - c[0], p[1] - c[1]) > isz * 0.9)) pt = c; }
      pt = pt ?? [(r() - 0.5) * w * 0.4, (r() - 0.5) * h * 0.3]; placed.push(pt);
      const fn = CRAYON[it];
      if (fn) for (const s of fn()) strokes.push(wob(s.map(([x, y]) => [pt[0] + x * isz, pt[1] + y * isz]), 2));
      else texts.push({ text: String(it), x: pt[0], y: pt[1] });
    }
    return { strokes, texts, isz };
  }
  function crayonDraw(ctx, S, p, color, isz, seed) {
    const lens = S.strokes.map((s) => s.slice(1).reduce((a, q, i) => a + Math.hypot(q[0] - s[i][0], q[1] - s[i][1]), 0)), total = lens.reduce((a, b) => a + b, 0) || 1;
    let left = total * p;
    ctx.save(); ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    S.strokes.forEach((s) => {
      if (left <= 0) return;
      for (let i = 1; i < s.length && left > 0; i++) {
        const [ax, ay] = s[i - 1], [bx, by] = s[i], d = Math.hypot(bx - ax, by - ay) || 1, f = Math.min(1, left / d); left -= d;
        const gap = i % 3 === 2 ? 2 / d : 0; // waxy gaps
        for (const [lw, al, off] of [[6, 0.85, 0], [3, 0.4, 2]]) { ctx.globalAlpha = al; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(ax + off, ay + off); ctx.lineTo(T.lerp(ax, bx, Math.max(0, f - gap)) + off, T.lerp(ay, by, Math.max(0, f - gap)) + off); ctx.stroke(); }
      }
    });
    ctx.restore();
    if (p >= 1) S.texts.forEach((t) => { const G = handLayout(ctx, t.text, isz * 0.5, seed + t.text, { jit: 8 }); ctx.save(); ctx.translate(t.x, t.y); handDraw(ctx, G.glyphs, Infinity, (k, g) => inkText(k, g.ch, 0, 0, { size: isz * 0.5, weight: 800, fill: color, stroke: 0 })); ctx.restore(); });
  }
  function scissors(ctx, x, y, open) {
    ctx.save(); ctx.translate(x, y);
    for (const s of [-1, 1]) {
      ctx.save(); ctx.rotate(s * open);
      T.outlined(ctx, (k) => { k.moveTo(0, -10 * s); k.lineTo(300, -2 * s); k.lineTo(0, 12 * s); k.closePath(); }, '#cfd6dc', { line: 6, shade: (k) => { k.fillStyle = '#aab3ba'; k.fillRect(0, 0, 320, 14 * s); } });
      T.outlined(ctx, (k) => { k.ellipse(-80, 22 * s, 58, 36, 0, 0, Math.PI * 2); k.moveTo(-60, 22 * s); k.ellipse(-80, 22 * s, 28, 16, 0, 0, Math.PI * 2, true); }, '#d0202a', { line: 6 });
      ctx.restore();
    }
    T.outlined(ctx, (k) => k.arc(0, 0, 10, 0, Math.PI * 2), '#8a9097', { line: 5 });
    ctx.restore();
  }
  T.DOCS.crayon = (ctx, L, lt) => {
    T.docPop(ctx, lt);
    const w = num(L.w, 900), h = num(L.h, 640), seed = seedOf(L, 'cr'), S = crayonStrokes(L, w, h, seed), color = L.color ?? '#e050c0';
    const p = T.ease.inOut(T.prog(lt, num(L.drawAt, 0.2), num(L.drawDur, 1.0)));
    const sheet = (k) => {
      T.outlined(k, (q) => q.rect(-w / 2, -h / 2, w, h), L.paper ?? '#f6f1e4', { line: 6, shade: (q) => { q.fillStyle = 'rgba(140,100,40,0.08)'; q.fillRect(w * 0.3, -h / 2, w, h); } });
      for (const s of [-1, 1]) { k.save(); k.translate(s * w * 0.4, -h / 2); k.rotate(s * 0.4); k.fillStyle = 'rgba(240,232,200,0.75)'; k.fillRect(-60, -18, 120, 36); k.restore(); }
      crayonDraw(k, S, p, color, S.isz, seed);
      const rc = L.recolor; if (rc && lt >= num(rc.at, 1.5)) crayonDraw(k, S, T.prog(lt, num(rc.at, 1.5), 10 * F), rc.color ?? '#3a6ae0', S.isz, seed);
      if (L.caption && p >= 1) { const G = handLayout(k, String(L.caption), 40, seed + 'cap', { jit: 7, sizeJit: 0.15 }); k.save(); k.translate(0, h / 2 - 40); handDraw(k, G.glyphs, Infinity, (q, g) => inkText(q, g.ch, 0, 0, { size: 40 * g.k, weight: 800, fill: (rc && lt >= num(rc.at, 1.5) ? rc.color : null) ?? color, stroke: 0 })); k.restore(); }
    };
    const cut = L.cut; if (!cut || lt < num(cut.at, 3)) { sheet(ctx); return; }
    const t = lt - num(cut.at, 3), slide = T.ease.outCubic(T.clamp(t / (8 * F))), snap = T.prog(t, 8 * F, 5 * F), fall = Math.max(0, t - 13 * F);
    for (const s of [-1, 1]) { // top / bottom halves fall apart after the snap
      ctx.save(); ctx.translate(0, fall * fall * (s < 0 ? 500 : 1400)); ctx.rotate(fall * (s < 0 ? -0.25 : 0.4));
      ctx.beginPath(); ctx.rect(-w, s < 0 ? -h : 0, w * 2, h); ctx.clip(); sheet(ctx); ctx.restore();
    }
    if (snap < 1 || fall < 0.4) { ctx.save(); ctx.globalAlpha *= 1 - T.prog(fall, 0.2, 0.2); scissors(ctx, T.lerp(-w / 2 - 420, -w * 0.05, slide), 0, (1 - snap) * 0.32); ctx.restore(); }
  };
})();
