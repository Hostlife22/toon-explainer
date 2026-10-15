// game-ui.js — game-UI kit measured on the reference library: HUD widgets (`hud` layer: system log, hazard meter,
// pickup counter, warning banner, score popup, survival hearts, player marker, quest chip, LCD speedrun timer), a
// `cursor` layer (path, clicks, drag-select marquee, carry, RTS selection) and game-screen `doc` kinds (VS card,
// challenger, joins-the-battle, sequel strips, menus, pause, loading, insert disk, weapon wheel, item carousel, RPG
// dialog, OS error, upgrade button, kill feed, highscore, meanwhile, to-be-continued, trade offer, slides).
// The reference draws game UI flat (cold ink, bevels, white caps), not in the cartoon ink style. Timing in frames @30.
(function () {
  'use strict'; const T = window.TOON, P = T.PAL, W = T.W, H = T.H, F = 1 / 30;
  const UI = '#1a1a1f'; // UI ink: darker and colder than the character ink
  T.HUD_KINDS = T.HUD_KINDS || {}; T.DOCS = T.DOCS || {}; const HUD = T.HUD_KINDS, D = T.DOCS; T.DEFAULT_ENTER.hud = 'none'; T.DEFAULT_ENTER.cursor = 'none';

  // ---------- shared helpers ----------
  // Screen-lock (HUD default) unless hud:false; keeps the layer's own position/scale.
  const screen = (ctx, L, env) => { if (L.hud !== false && T.hudReset) T.hudReset(ctx, L, env); };
  // Absolute frame coordinates (layer position ignored), optionally with the camera for world-space widgets.
  const abs = (ctx, env, cam = null, z = 1) => { ctx.setTransform(env.dpr, 0, 0, env.dpr, 0, 0); if (cam) T.applyCam(ctx, cam, z); };
  // Default anchor of a kind when the spec gives no x/y (layer x/y default to the centre).
  const place = (ctx, L, x, y) => ctx.translate(L.x == null ? (x - 0.5) * W : 0, L.y == null ? (y - 0.5) * H : 0);
  const pop = (lt, at = 0, dur = 6 * F) => Math.max(0.001, T.ease.outBack(T.prog(lt, at, dur))); const frames = (lt) => Math.floor(lt * 30 + 1e-6);
  const arr = (v) => (Array.isArray(v) ? v : v == null ? [] : [v]);
  // [{at, v}] keys: hold each value and ease into the next over `dur` (hold-and-snap); numbers pass through.
  const keyAt = (v, lt) => { let i = -1; for (let k = 0; k < v.length; k++) if (lt >= (v[k].at ?? 0)) i = k; return i; };
  const snapNum = (v, lt, dur = 8 * F, ease = T.ease.outBack) => {
    if (!Array.isArray(v)) return Number(v ?? 0); if (!v.length) return 0; const i = keyAt(v, lt); if (i <= 0) return v[0].v;
    return T.lerp(v[i - 1].v, v[i].v, ease(T.prog(lt, v[i].at ?? 0, dur)));
  };
  // White caps with a dark outline (stroke first, fill second) — the reference's game lettering.
  const uiText = (ctx, text, x, y, size, o = {}) => {
    ctx.save(); ctx.font = o.font ?? (o.italic ? 'italic ' : '') + T.font(size, o.weight ?? 900);
    ctx.textAlign = o.align ?? 'center'; ctx.textBaseline = o.base ?? 'middle'; ctx.lineJoin = 'round'; ctx.miterLimit = 2; const sw = o.stroke ?? size * 0.14;
    if (sw > 0) { ctx.lineWidth = sw; ctx.strokeStyle = o.ink ?? UI; ctx.strokeText(text, x, y); }
    ctx.fillStyle = o.fill ?? '#fff'; ctx.fillText(text, x, y); ctx.restore();
  };
  const textW = (ctx, text, size, weight = 900, font = null) => { ctx.save(); ctx.font = font ?? T.font(size, weight); const w = ctx.measureText(text).width; ctx.restore(); return w; };
  // Bevelled button: darker bottom band + thin white top line + UI-ink outline.
  const button = (ctx, x, y, w, h, fill, o = {}) => {
    ctx.save(); ctx.beginPath(); T.rrect(ctx, x, y, w, h, o.r ?? 14); ctx.fillStyle = fill; ctx.fill(); ctx.save(); ctx.clip();
    ctx.fillStyle = T.shade(fill, -0.35); ctx.fillRect(x, y + h - (o.bevel ?? 8), w, 40);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x, y + 3, w, 2); ctx.restore();
    ctx.lineWidth = o.line ?? 4; ctx.strokeStyle = o.ink ?? UI; ctx.lineJoin = 'round'; ctx.stroke(); ctx.restore();
  };
  const warnTri = (ctx, x, y, s, fill = '#f5c518', mark = '#1a1a1a') => {
    ctx.save(); ctx.translate(x, y); ctx.beginPath(); ctx.moveTo(0, -s * 0.5); ctx.lineTo(s * 0.55, s * 0.45); ctx.lineTo(-s * 0.55, s * 0.45); ctx.closePath();
    ctx.lineJoin = 'round'; ctx.lineWidth = s * 0.16; ctx.strokeStyle = UI; ctx.stroke(); ctx.fillStyle = fill; ctx.fill();
    ctx.fillStyle = mark; ctx.fillRect(-s * 0.06, -s * 0.2, s * 0.12, s * 0.38); ctx.fillRect(-s * 0.06, s * 0.24, s * 0.12, s * 0.11); ctx.restore();
  };
  // "Pixel" lettering: Rubik 900 at 1/4 size on a scratch canvas, scaled up without smoothing (blocky arcade look).
  const pixelText = (ctx, text, x, y, size, fill, ink = UI) => {
    const k = 4, s = size / k, pad = Math.ceil(s * 0.3) + 2; const w = Math.ceil(textW(ctx, text, s)) + pad * 2, h = Math.ceil(s * 1.3) + pad * 2;
    const [c, g] = T.scratch('gamepix', w, h); g.clearRect(0, 0, w, h);
    g.font = T.font(s, 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'miter';
    g.lineWidth = Math.max(1.5, s * 0.22); g.strokeStyle = ink; g.strokeText(text, w / 2, h / 2); g.fillStyle = fill; g.fillText(text, w / 2, h / 2);
    ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(c, x - (w * k) / 2, y - (h * k) / 2, w * k, h * k); ctx.restore();
    return w * k;
  };
  // Icon-style prop: long props (drawn from the hilt/foot up) are centred and tilted like an inventory icon.
  const LONG = { sword: 0.5, spear: 0.5, flag: 0.5, torch: 0.3 };
  const prop = (ctx, kind, size, lt, x = 0, y = 0) => {
    ctx.save(); ctx.translate(x, y);
    if (LONG[kind] != null) { ctx.rotate(35 * T.DEG); ctx.translate(0, LONG[kind] * size); }
    T.drawProp(ctx, kind, size, lt, {}); ctx.restore();
  };
  // Bean bust for cards (feet below the frame). o: {who, x, y, size, flip, pose, expr, view}
  const bust = (ctx, o, lt, env) => {
    ctx.save(); ctx.translate(o.x ?? 0, o.y ?? 0); if (o.flip) ctx.scale(-1, 1);
    T.layers.bean(ctx, { type: 'bean', who: o.who, look: o.look, size: o.size ?? 900, view: o.view ?? '3q', pose: o.pose ?? 'idle', expr: o.expr ?? 'angry', rock: 0, legs: false, blink: false }, lt, { ...env, st: null });
    ctx.restore();
  };
  const wrap = (ctx, text, maxW) => {
    const out = [];
    for (const para of String(text).split('\n')) {
      let line = '';
      for (const w of para.split(/\s+/).filter(Boolean)) {
        const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t;
      }
      out.push(line);
    }
    return out;
  };
  const backdrop = (ctx, env, color) => { ctx.save(); abs(ctx, env); ctx.fillStyle = color; ctx.fillRect(-4, -4, W + 8, H + 8); ctx.restore(); };

  // ---------- cursor sprite (shared by the cursor layer, menus and slides) ----------
  const ARROW = [[0, 0], [0, 27], [6.5, 21], [10.5, 30.5], [14.5, 28.8], [10.6, 19.6], [19, 19.6]];
  const drawCursor = (ctx, style, x, y, size = 34, squash = 1) => {
    ctx.save(); ctx.translate(x, y); ctx.scale(squash, squash);
    if (style === 'hand' || style === 'grab') {
      const s = (size * 1.76) / 120, dir = -0.35, tip = [14 * s, -98 * s];
      const ox = -(tip[0] * Math.cos(dir) - tip[1] * Math.sin(dir)), oy = -(tip[0] * Math.sin(dir) + tip[1] * Math.cos(dir));
      T.drawGlove(ctx, ox, oy, dir, style === 'grab' ? 'grab' : 'point', { size: size * 1.76, line: 5 });
    } else {
      const k = size / 30, path = (g) => { g.beginPath(); ARROW.forEach(([px, py], i) => (i ? g.lineTo(px * k, py * k) : g.moveTo(px * k, py * k))); g.closePath(); };
      ctx.save(); ctx.translate(3, 4); path(ctx); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill(); ctx.restore();
      path(ctx); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineJoin = 'miter'; ctx.lineWidth = 2.4; ctx.strokeStyle = '#000'; ctx.stroke();
      ctx.save(); ctx.translate(2.2 * k, 4.5 * k); ctx.scale(0.72, 0.72); path(ctx); ctx.lineWidth = 1.2; ctx.strokeStyle = '#b8b8b8'; ctx.stroke(); ctx.restore();
    }
    ctx.restore();
  };
  const clickRing = (ctx, x, y, age) => {
    if (age < 0 || age > 8 * F) return; const p = age / (8 * F); ctx.save(); ctx.globalAlpha *= 1 - p; ctx.lineWidth = 3; ctx.strokeStyle = '#fff';
    ctx.beginPath(); ctx.arc(x, y, 10 + 20 * T.ease.outCubic(p), 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  };
  // Hand cursor hopping between button rects: clicks [{at, i}], 10-frame inOut hop ending on the click, 2-frame press.
  const hopCursor = (ctx, clicks, rects, lt, style = 'hand') => {
    if (!clicks.length || !rects.length) return -1;
    const pt = (i) => { const r = rects[T.clamp(i, 0, rects.length - 1)]; return [r[0] + r[2] * 0.93, r[1] + r[3] * 0.6]; };
    let pos = [pt(clicks[0].i ?? 0)[0] + 60, pt(clicks[0].i ?? 0)[1] + 170], pressed = -1, squash = 1;
    for (const c of clicks) {
      const to = pt(c.i ?? 0), e = T.ease.inOut(T.prog(lt, c.at - 10 * F, 10 * F)); pos = [T.lerp(pos[0], to[0], e), T.lerp(pos[1], to[1], e)]; const d = lt - c.at;
      if (d >= 0 && d < 2 * F) { squash = 0.9; pressed = c.i ?? 0; }
    }
    for (const c of clicks) clickRing(ctx, ...pt(c.i ?? 0), lt - c.at); drawCursor(ctx, style, pos[0], pos[1], 56, squash);
    return pressed;
  };

  // ---------- hud layer ----------
  T.layers.hud = (ctx, L, lt, env) => {
    const fn = HUD[L.kind]; if (!fn) throw new Error(`Unknown hud kind "${L.kind}" (known: ${Object.keys(HUD).join(', ')})`);
    if (L.kind !== 'marker') screen(ctx, L, env); fn(ctx, L, lt, env);
  };
  // notice: { lines:[{at,text,color,icon}], life 1.5, size 26, max 4 } — system log, newest line at the anchor (x 0.02, y 0.94)
  HUD.notice = (ctx, L, lt) => {
    place(ctx, L, 0.02, 0.94); const size = L.size ?? 26, lh = size * 1.7, life = L.life ?? 1.5, max = L.max ?? 4;
    const lines = L.lines || (L.text ? [{ at: 0, text: L.text }] : []);
    lines.forEach((ln, i) => {
      const age = lt - (ln.at ?? 0); if (age < 0 || age > life + 10 * F) return; let rise = 0;
      for (let j = i + 1; j < lines.length; j++) rise += T.ease.outCubic(T.prog(lt, lines[j].at ?? 0, 6 * F));
      const a = (1 - T.prog(age, life, 10 * F)) * T.clamp(max - rise) * T.clamp(age / (2 * F)); if (a <= 0) return;
      const text = String(ln.text ?? '').toUpperCase(), ic = ln.icon ? lh * 0.8 + 8 : 0; const w = textW(ctx, text, size, 800) + 24 + ic;
      ctx.save(); ctx.globalAlpha *= a; ctx.translate(-30 * (1 - T.ease.outCubic(T.prog(age, 0, 6 * F))), -rise * (lh + 6));
      ctx.beginPath(); T.rrect(ctx, 0, -lh, w, lh, 8); ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.fill();
      if (ln.icon) prop(ctx, ln.icon, lh * 0.8, lt, 12 + lh * 0.4, -lh / 2);
      uiText(ctx, text, 12 + ic, -lh / 2 + 1, size, { align: 'left', weight: 800, stroke: 0, fill: ln.color ?? L.color ?? '#fff' }); ctx.restore();
    });
  };

  // meter: { label, value (0..1 or keys), w 520, h 44, style 'hazard'|'solid', color, labelColor, warnAt 0.9 } (x 0.04, y 0.08 = bar top-left)
  // orient 'vertical': the bar stands on the side edge and fills bottom-up (w = thickness, h = length; defaults 44 x 520).
  HUD.meter = (ctx, L, lt, env) => {
    const vert = L.orient === 'vertical', [lo, vw] = T.visibleSpan(env); // default anchor inside the visible frame
    place(ctx, L, (lo + (vert ? 0.06 : 0.04) * vw) / W, vert ? 0.3 : 0.1);
    const w = vert ? L.h ?? 520 : L.w ?? 520, h = vert ? L.w ?? 44 : L.h ?? 44, warnAt = L.warnAt ?? 0.9, v = T.clamp(snapNum(L.value ?? 0, lt), 0, 1);
    if (v >= 0.999) { const r = T.rng(T.hash((L.id || 'meter') + frames(lt / 2))); ctx.translate((r() - 0.5) * 6, (r() - 0.5) * 6); } // overload shake on twos
    const s = pop(lt), px = vert ? h / 2 : w / 2, py = vert ? w / 2 : h / 2; ctx.translate(px, py); ctx.scale(s, s); ctx.translate(-px, -py);
    if (L.label) uiText(ctx, String(L.label).toUpperCase(), 0, -32, L.labelSize ?? 40, { align: 'left', fill: L.labelColor ?? '#e0313a', stroke: 10 });
    ctx.save(); if (vert) { ctx.translate(0, w); ctx.rotate(-Math.PI / 2); } // the bar's length axis points up
    ctx.beginPath(); T.rrect(ctx, 0, 0, w, h, 10); ctx.fillStyle = '#3a3a3a'; ctx.fill(); ctx.save(); ctx.clip();
    ctx.beginPath(); ctx.rect(0, 0, w * v, h); ctx.clip();
    if ((L.style ?? 'hazard') === 'hazard') {
      ctx.fillStyle = L.color ?? '#f5c518'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#1a1a1a'; const off = frames(lt) % 22;
      for (let x = -h - 22 + off; x < w + h; x += 22) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 11, 0); ctx.lineTo(x + 11 - h, h); ctx.lineTo(x - h, h); ctx.closePath(); ctx.fill(); }
    } else { ctx.fillStyle = L.color ?? '#5ad84a'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(0, 4, w, h * 0.22); }
    ctx.restore(); ctx.beginPath(); T.rrect(ctx, 0, 0, w, h, 10); ctx.lineWidth = 4; ctx.strokeStyle = UI; ctx.stroke();
    ctx.restore();
    if (v >= warnAt && frames(lt) % 12 < 6) warnTri(ctx, vert ? h + 38 : w + 38, vert ? 23 : h / 2, 46, '#d8262a', '#fff');
  };

  const fmtNum = (v, L, n = Math.round(v)) => { if (L.compact) { for (const [d, u] of [[1e9, 'B'], [1e6, 'M'], [1e3, 'K']]) if (Math.abs(n) >= d) return (n / d).toFixed(n / d < 10 ? 1 : 0).replace(/\.0$/, '') + u; return String(n); } return L.sep ? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, L.sep) : String(n); };
  // counter: { icon 'coin', value (keys), prefix 'x', size 64, sep ','|' ', compact (2.1B / 340M / 12K) } (x 0.05, y 0.08 = icon centre)
  HUD.counter = (ctx, L, lt) => {
    place(ctx, L, 0.05, 0.08); const size = L.size ?? 64, keys = Array.isArray(L.value) ? L.value : null;
    const i = keys ? Math.max(0, keyAt(keys, lt)) : 0, val = keys ? keys[i].v : Number(L.value ?? 0);
    const since = keys && i > 0 ? lt - (keys[i].at ?? 0) : 1; const s = pop(lt); ctx.scale(s, s);
    if (L.icon !== false) {
      if (since < 3 * F) T.filtered(ctx, 'brightness(3.5)', (g) => prop(g, L.icon ?? 'coin', size, lt)); else prop(ctx, L.icon ?? 'coin', size, lt);
    }
    const x0 = size * 0.62; uiText(ctx, L.prefix ?? 'x', x0 + size * 0.2, size * 0.08, size * 0.6, { stroke: size * 0.14 });
    const k = 1 + 0.4 * (1 - T.ease.outCubic(T.prog(since, 0, 6 * F))); ctx.save(); ctx.translate(x0 + size * 0.48, 0); ctx.scale(k, k);
    uiText(ctx, fmtNum(val, L) + (L.suffix ?? ''), 0, 0, size * 0.95, { align: 'left', stroke: 12 }); ctx.restore();
  };

  // warning: { text, tilt -4, glitch, w 880, h 110, color } (x 0.5, y 0.2)
  HUD.warning = (ctx, L, lt) => {
    place(ctx, L, 0.5, 0.2); const w = L.w ?? 880, h = L.h ?? 110, p = T.prog(lt, 0, 7 * F), col = L.color ?? '#d8262a';
    ctx.rotate(((L.tilt ?? -4) + (1 - p) * -8) * T.DEG); const s = pop(lt, 0, 7 * F); ctx.scale(s, s);
    const banner = (g) => {
      g.beginPath(); T.rrect(g, -w / 2, -h / 2, w, h, 18); g.fillStyle = col; g.fill();
      g.save(); g.clip(); g.fillStyle = T.shade(col, -0.25); g.fillRect(-w / 2, h / 2 - 8, w, 8); g.restore();
      g.lineWidth = 6; g.strokeStyle = UI; g.stroke(); for (const sx of [-1, 1]) warnTri(g, sx * (w / 2 - 68), 2, 70);
      uiText(g, String(L.text ?? 'WARNING').toUpperCase(), 0, 4, T.fitSize(g, String(L.text ?? 'WARNING').toUpperCase(), 64, w - 280), { stroke: 12 });
    };
    const f = frames(lt), on = L.glitch && (lt < 0.5 || (lt - 0.5) % 1.2 < 4 * F); if (!on) return banner(ctx);
    const r = T.rng(T.hash((L.id || 'warn') + ':g:' + Math.floor(f / 2)));
    for (let b = 0; b < 3; b++) {
      const y0 = -h / 2 - 30 + (b * (h + 60)) / 3; ctx.save(); ctx.beginPath(); ctx.rect(-w, y0, w * 2, (h + 60) / 3 + 0.5); ctx.clip();
      ctx.translate((r() - 0.5) * 40, 0); banner(ctx); ctx.restore();
    }
  };

  // score: { text '+100', sub, color '#ffe84a', size 72, rise 40, pixels 7, style 'pixel'|'bold', life 0.8 } — usually hud:false
  HUD.score = (ctx, L, lt) => {
    const life = L.life ?? 0.8, size = L.size ?? 72, f = lt * 30, col = L.color ?? '#ffe84a'; if (lt > life) return;
    const s = f < 4 ? T.lerp(0.6, 1.2, f / 4) : f < 6 ? T.lerp(1.2, 1, (f - 4) / 2) : 1;
    ctx.translate(0, -(L.rise ?? 40) * T.ease.outCubic(T.prog(lt, 0, 12 * F))); ctx.globalAlpha *= 1 - T.prog(lt, life - 6 * F, 6 * F);
    const r = T.rng(T.hash((L.id || 'score') + (L.text ?? ''))); const q = T.ease.outCubic(T.prog(lt, 0, 5 * F)), fade = 1 - T.prog(lt, 3 * F, 5 * F);
    if (fade > 0) for (let i = 0; i < (L.pixels ?? 7); i++) {
      const a = (i / (L.pixels ?? 7)) * Math.PI * 2 + r() * 0.6, d = (30 + r() * 30) * q + size * 0.4;
      ctx.fillStyle = `rgba(255,255,255,${fade})`; ctx.fillRect(Math.cos(a) * d * 1.4 - 4, Math.sin(a) * d - 4, 8, 8);
    }
    ctx.scale(s, s); const text = String(L.text ?? '+100');
    const tw = (L.style ?? 'pixel') === 'pixel' ? pixelText(ctx, text, 0, 0, size, col) : (uiText(ctx, text, 0, 0, size, { fill: col, stroke: 12 }), textW(ctx, text, size));
    if (L.sub) uiText(ctx, String(L.sub), tw / 2 + size * 0.1, size * 0.18, size * 0.45, { align: 'left', fill: col, stroke: 8 });
  };

  // hearts: { count 10, value (keys), cell 5, hunger, hotbar 9, selected 0, items:[prop] } (x 0.5, y 0.95 = bottom centre)
  const HEART = ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'];
  const MEAT = ['....XXX', '...XXXX', '..XXXXX', '..XXXX.', '.BXX...', 'B.B....', 'BB.....'];
  const pixIcon = (ctx, pat, x, y, c, fill, dark, hi) => {
    const rows = pat.length, cols = pat[0].length, ox = x - (cols * c) / 2, oy = y - (rows * c) / 2; ctx.fillStyle = dark;
    pat.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== '.') ctx.fillRect(ox + (i - 1) * c, oy + (j - 1) * c, c * 3, c * 3); }));
    pat.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== '.') { ctx.fillStyle = ch === 'B' ? '#efe6d6' : fill; ctx.fillRect(ox + i * c, oy + j * c, c + 0.5, c + 0.5); } }));
    if (hi) { ctx.fillStyle = hi; ctx.fillRect(ox + c, oy + c, c, c); }
  };
  HUD.hearts = (ctx, L, lt) => {
    place(ctx, L, 0.5, 0.95); const n = L.count ?? 10, c = L.cell ?? 6, step = c * 9, keys = Array.isArray(L.value) ? L.value : null;
    const i = keys ? keyAt(keys, lt) : -1, val = keys ? (i < 0 ? keys[0].v : keys[i].v) : Number(L.value ?? n);
    const prevV = keys && i > 0 ? keys[i - 1].v : val, since = keys && i > 0 ? lt - (keys[i].at ?? 0) : 9;
    const slot = 60, bar = L.hotbar ? (L.hotbar === true ? 9 : L.hotbar) : 0, barW = bar * (slot + 4); let y = 0;
    if (bar) {
      y -= slot / 2 + 4;
      for (let k = 0; k < bar; k++) {
        const x = -barW / 2 + k * (slot + 4) + slot / 2, sel = k === (L.selected ?? 0);
        ctx.fillStyle = 'rgba(58,58,58,0.85)'; ctx.fillRect(x - slot / 2, y - slot / 2, slot, slot);
        ctx.lineWidth = 4; ctx.strokeStyle = sel ? '#ffffff' : '#8a8a8a'; ctx.strokeRect(x - slot / 2 + 2, y - slot / 2 + 2, slot - 4, slot - 4);
        if (L.items && L.items[k]) prop(ctx, L.items[k], slot * 0.62, lt, x, y);
      }
      y -= slot / 2 + c * 6;
    }
    const rowW = n * step, x0 = bar ? -barW / 2 + step / 2 : -rowW / 2 + step / 2; const shake = val < prevV && since < 8 * F ? (frames(lt) % 2 ? 2 : -2) : 0;
    for (let k = 0; k < n; k++) {
      const lost = k >= val, fresh = lost && k < prevV && since < 2 * F && since >= 0;
      pixIcon(ctx, HEART, x0 + k * step + shake, y, c, fresh ? '#ffffff' : lost ? '#4a4a4a' : '#e02a2a', lost && !fresh ? '#1e1e1e' : '#5a0a0a', lost ? null : '#ffd0d0');
    }
    if (L.hunger) {
      const hv = snapNum(L.hunger === true ? n : L.hunger, lt, 0), hx = bar ? barW / 2 - step / 2 : rowW / 2 - step / 2;
      for (let k = 0; k < n; k++) pixIcon(ctx, MEAT, hx - k * step, y - c * 10, c, k < hv ? '#b5652a' : '#4a4a4a', '#3a1a08', null);
    }
  };

  // marker: { follow: <layer id>, text 'P1', color '#d83a2a', dx 0, dy -40, size 1 } — tag above a character, world space
  HUD.marker = (ctx, L, lt, env) => {
    const src = (env.shot?.layers || []).find((l) => l.id === L.follow);
    if (!src) throw new Error(`hud marker: follow "${L.follow}" is not a layer id in this shot`);
    const tl = env.lt ?? lt, tgt = T.effLayer(src, tl), st = T.layerState(tgt, tl); if (!st) return;
    abs(ctx, env, L.hud === true || tgt.hud ? null : env.cam, tgt.z ?? 1);
    const top = st.y - (tgt.size ?? (tgt.type === 'bean' ? 420 : 160)) * st.s * (tgt.type === 'bean' ? 1.14 : 0.6); // beans: feet anchor, hats included
    const k = L.size ?? 1, bob = Math.sin(lt * Math.PI * 2) * 2; ctx.globalAlpha *= T.prog(lt, L.delay ?? 10 * F, 6 * F);
    ctx.translate(st.x + (L.dx ?? 0), top + (L.dy ?? -40) + bob); ctx.scale(k, k); const col = L.color ?? '#d83a2a';
    ctx.beginPath(); ctx.moveTo(-22, -34); ctx.quadraticCurveTo(-22, -46, -10, -46); ctx.lineTo(10, -46); ctx.quadraticCurveTo(22, -46, 22, -34);
    ctx.lineTo(22, -16); ctx.quadraticCurveTo(14, -4, 0, 0); ctx.quadraticCurveTo(-14, -4, -22, -16); ctx.closePath();
    ctx.lineJoin = 'round'; ctx.lineWidth = 8; ctx.strokeStyle = UI; ctx.stroke(); ctx.fillStyle = col; ctx.fill();
    ctx.beginPath(); ctx.moveTo(-8, 8); ctx.lineTo(8, 8); ctx.lineTo(0, 18); ctx.closePath(); ctx.lineWidth = 5; ctx.stroke(); ctx.fill();
    uiText(ctx, String(L.text ?? 'P1'), 0, -24, T.fitSize(ctx, String(L.text ?? 'P1'), 24, 38), { stroke: 0 });
  };

  // chip: { text, key, corner 'tr', slot 0, answerAt, size 30, w } — quest / open-question tracker (use as an overlay)
  HUD.chip = (ctx, L, lt, env) => {
    const size = L.size ?? 30, h = size * 2, corner = L.corner ?? 'tr', slot = L.slot ?? 0, text = String(L.text ?? '').toUpperCase();
    const cond = 0.86, tw = textW(ctx, text, size * 1.05, 800) * cond, w = L.w ?? h + 14 + tw + 18;
    const [lo, vw] = T.visibleSpan(env), m = 40, left = corner.includes('l'), x = left ? lo + m : lo + vw - m - w, y = corner[0] === 't' ? m + slot * (h + 8) : H - m - h - slot * (h + 8); // 3.5 % safe margin
    abs(ctx, env); const e = T.ease.outCubic(T.prog(lt, 0, 6 * F)), s = pop(lt);
    ctx.translate(x + w / 2 + (left ? -40 : 40) * (1 - e), y + h / 2); ctx.scale(s, s); ctx.translate(-w / 2, -h / 2);
    ctx.beginPath(); T.rrect(ctx, 0, 0, w, h, 8); ctx.fillStyle = '#1c1c22'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#3a2a1a'; ctx.stroke();
    const at = L.answerAt ?? Infinity, fp = T.prog(lt, at, 6 * F), done = lt >= at + 3 * F, b = h - 8;
    ctx.save(); ctx.translate(4 + b / 2, h / 2); ctx.scale(Math.max(0.04, Math.abs(Math.cos(Math.PI * fp))), 1);
    ctx.fillStyle = done ? '#3fae3a' : '#d8262a'; ctx.fillRect(-b / 2, -b / 2, b, b);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = b * 0.14; ctx.lineCap = 'round'; ctx.beginPath();
    if (done) { ctx.moveTo(-b * 0.28, 0); ctx.lineTo(-b * 0.08, b * 0.22); ctx.lineTo(b * 0.3, -b * 0.24); }
    else { ctx.moveTo(-b * 0.25, -b * 0.25); ctx.lineTo(b * 0.25, b * 0.25); ctx.moveTo(b * 0.25, -b * 0.25); ctx.lineTo(-b * 0.25, b * 0.25); }
    ctx.stroke();
    if (lt >= at && lt < at + 4 * F) { ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillRect(-b / 2 - 2, -b / 2 - 2, b + 4, b + 4); }
    ctx.restore();
    // text with the key word in red; condensed by a horizontal squeeze
    const key = L.key ? String(L.key).toUpperCase() : '', ki = key ? text.indexOf(key) : -1;
    const parts = ki < 0 ? [[text, '#fff']] : [[text.slice(0, ki), '#fff'], [key, L.keyColor ?? '#e03030'], [text.slice(ki + key.length), '#fff']];
    ctx.save(); ctx.translate(h + 10, h / 2 + 1); ctx.scale(cond, 1); let px = 0;
    for (const [t, c] of parts) { if (!t) continue; uiText(ctx, t, px, 0, size * 1.05, { align: 'left', weight: 800, stroke: 0, fill: c }); px += textW(ctx, t, size * 1.05, 800); }
    ctx.restore();
  };

  // timer-lcd: { start 0, stop, format, corner 'tr', w 300, h 92 } — 7-segment timer; after `stop` blinks full/35 % for 36 f
  const SEG = { 0: 'abcdef', 1: 'bc', 2: 'abdeg', 3: 'abcdg', 4: 'bcfg', 5: 'acdfg', 6: 'acdefg', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg', '-': 'g' };
  const seg7 = (ctx, ch, x, y, w, h, col, ba = 1) => {
    const t = w * 0.2, hh = h / 2, on = SEG[ch] || '';
    const bars = { a: [0, 0, 1], g: [0, hh, 1], d: [0, h, 1], f: [0, 0, 0], b: [w, 0, 0], e: [0, hh, 0], c: [w, hh, 0] };
    for (const [k, [bx, by, horiz]] of Object.entries(bars)) {
      ctx.globalAlpha = on.includes(k) ? ba : 0.07; ctx.fillStyle = col; ctx.beginPath();
      if (horiz) { ctx.moveTo(x + bx + t * 0.6, y + by); ctx.lineTo(x + bx + t, y + by - t / 2); ctx.lineTo(x + w - t, y + by - t / 2); ctx.lineTo(x + w - t * 0.6, y + by); ctx.lineTo(x + w - t, y + by + t / 2); ctx.lineTo(x + t, y + by + t / 2); }
      else { ctx.moveTo(x + bx, y + by + t * 0.6); ctx.lineTo(x + bx + t / 2, y + by + t); ctx.lineTo(x + bx + t / 2, y + by + hh - t); ctx.lineTo(x + bx, y + by + hh - t * 0.6); ctx.lineTo(x + bx - t / 2, y + by + hh - t); ctx.lineTo(x + bx - t / 2, y + by + t); }
      ctx.closePath(); ctx.fill();
    }
    ctx.globalAlpha = 1;
  };
  const fmtTime = (t, fmt) => {
    const cs = Math.floor(t * 100 + 1e-6), c = String(cs % 100).padStart(2, '0'), sec = Math.floor(cs / 100), m = Math.floor(sec / 60), s = String(sec % 60).padStart(2, '0');
    if (fmt === 'ss.cc') return [String(sec).padStart(2, '0'), c];
    if (fmt === 'h:mm:ss') return [`${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}:${s}`, ''];
    return [`${m}:${s}`, c];
  };
  HUD['timer-lcd'] = (ctx, L, lt, env) => {
    const w = L.w ?? 300, h = L.h ?? 92, stop = L.stop ?? Infinity;
    if (L.x == null && L.y == null) { abs(ctx, env); const c = L.corner ?? 'tr', [lo, vw] = T.visibleSpan(env); ctx.translate(c.includes('l') ? lo + 40 + w / 2 : lo + vw - 40 - w / 2, c[0] === 't' ? 40 + h / 2 : H - 40 - h / 2); }
    const blinkOff = lt > stop && lt < stop + 36 * F && frames(lt - stop) % 12 >= 6; const t = Math.max(0, Math.min(lt, stop) - (L.start ?? 0));
    ctx.beginPath(); T.rrect(ctx, -w / 2, -h / 2, w, h, 12); ctx.fillStyle = '#3a3f44'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = UI; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(-w / 2 + 10, -h / 2 + 2, w - 20, 2);
    ctx.beginPath(); T.rrect(ctx, -w / 2 + 8, -h / 2 + 8, w - 16, h - 16, 6); ctx.fillStyle = '#1c2a22'; ctx.fill();
    const [main, small] = fmtTime(t, L.format ?? 'm:ss.cc'), col = L.color ?? '#7ef0a0', dh = h - 30, dw = dh * 0.5, gap = dw * 0.42;
    const glyphW = (str, k) => [...str].reduce((a, ch) => a + (/[0-9-]/.test(ch) ? dw * k + gap * k : gap * k * 0.9), 0);
    const total = glyphW(main, 1) + (small ? gap * 0.9 + glyphW(small, 0.6) : 0); ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = 6 * env.dpr;
    let x = -total / 2 + gap / 2;
    const run = (str, k, base) => {
      for (const ch of str) {
        if (/[0-9-]/.test(ch)) { seg7(ctx, ch, x, base - dh * k, dw * k, dh * k, col, blinkOff ? 0.35 : 1); x += dw * k + gap * k; }
        else { ctx.fillStyle = col; ctx.globalAlpha = blinkOff ? 0.35 : 1; const r = dw * 0.11; for (const yy of ch === ':' ? [base - dh * 0.72, base - dh * 0.28] : [base - r]) ctx.fillRect(x - r, yy - r, r * 2, r * 2); ctx.globalAlpha = 1; x += gap * k * 0.9; }
      }
    };
    run(main, 1, dh / 2);
    if (small) { run('.', 1, dh / 2); run(small, 0.6, dh / 2); }
    ctx.restore();
  };

  // ---------- cursor layer ----------
  // { style 'arrow'|'hand'|'grab', path [[x,y,t]], clicks [t], drag {from,to,at,dur}, carry <id>, then 'delete'|'none',
  //   select [{x,y,rx,ry,at,out}], size 34, wiggle 6, drift 2 } — frame coords 0..1, screen space unless hud:false
  const pathAt = (pts, lt) => {
    if (lt <= pts[0][2]) return [pts[0][0], pts[0][1]];
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0, t0] = pts[i - 1], [x1, y1, t1] = pts[i];
      if (lt < t1) { const e = T.ease.inOut(T.prog(lt, t0, t1 - t0)); return [T.lerp(x0, x1, e), T.lerp(y0, y1, e)]; }
    }
    const l = pts[pts.length - 1]; return [l[0], l[1]];
  };
  T.layers.cursor = (ctx, L, lt, env) => {
    const pts = (L.path && L.path.length ? L.path : [[L.x ?? 0.5, L.y ?? 0.5, 0]]).map((p) => {
      if (!Array.isArray(p) || p.length < 2) throw new Error('cursor path points must be [x, y, t] (frame fractions, layer seconds)');
      return [p[0] * W, p[1] * H, p[2] ?? 0];
    });
    const world = L.hud === false; abs(ctx, env, world ? env.cam : null, L.z ?? 1); const seed = L.id || 'cursor';
    let [cx, cy] = pathAt(pts, lt), style = L.style ?? 'arrow', grabbing = false;
    for (const sel of arr(L.select)) { // RTS selection ellipse under a unit
      const q = T.ease.outBack(T.prog(lt, sel.at ?? 0, 5 * F)); if (q <= 0.001 || (sel.out != null && lt > sel.out)) continue;
      ctx.save(); ctx.translate(sel.x * W, sel.y * H); ctx.scale(q, q); ctx.beginPath(); ctx.ellipse(0, 0, sel.rx ?? 110, sel.ry ?? 34, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(90,216,74,0.18)'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = sel.color ?? '#5ad84a'; ctx.setLineDash([18, 10]); ctx.lineDashOffset = -lt * 40; ctx.stroke();
      ctx.restore();
    }
    const d = L.drag;
    if (d) {
      const at = d.at ?? 0, dur = d.dur ?? 10 * F, end = at + dur, wig = end + 12 * F, gone = L.then === 'delete' ? wig : (d.hold ?? wig);
      const [fx, fy] = [(d.from?.[0] ?? 0.4) * W, (d.from?.[1] ?? 0.4) * H], [tx, ty] = [(d.to?.[0] ?? 0.6) * W, (d.to?.[1] ?? 0.6) * H];
      if (lt >= at) {
        const e = T.ease.inOut(T.prog(lt, at, dur)), mx = T.lerp(fx, tx, e), my = T.lerp(fy, ty, e);
        if (lt <= end || !pts.some((p) => p[2] > end)) { cx = mx; cy = my; grabbing = lt <= end; } // holds at drag.to unless the path continues
        if (L.carry && lt < gone) { // a copy of the carried layer follows the marquee corner (hide the original with out/exitDur 0)
          const src = (env.shot?.layers || []).find((l) => l.id === L.carry); if (!src) throw new Error(`cursor carry: "${L.carry}" is not a layer id in this shot`);
          const copy = { ...src, id: src.id + ':carry', at: 0, out: undefined, enter: 'none', x: (src.x ?? 0.5) + (mx - fx) / W, y: (src.y ?? 0.5) + (my - fy) / H };
          ctx.save(); abs(ctx, env); T.drawLayer(ctx, copy, env.lt ?? lt, env, env.cam); ctx.restore();
        }
        if (lt < gone) {
          ctx.save(); ctx.beginPath(); ctx.rect(Math.min(fx, mx), Math.min(fy, my), Math.abs(mx - fx), Math.abs(my - fy));
          ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.fill(); ctx.setLineDash([8, 6]); ctx.lineWidth = 3; ctx.strokeStyle = '#2a1d17'; ctx.stroke();
          ctx.translate(1, 1); ctx.lineWidth = 1; ctx.strokeStyle = '#fff'; ctx.stroke(); ctx.restore();
        }
        if (lt > end && lt < wig) { const r = T.rng(T.hash(seed + ':w:' + frames(lt / 2))); cx += (r() - 0.5) * 2 * (L.wiggle ?? 6); cy += (r() - 0.5) * 2 * (L.wiggle ?? 6); }
        if (L.then === 'delete' && lt >= wig && lt < wig + 6 * F) { // 1-frame pop then a small white burst where the selection was
          const q = T.prog(lt, wig, 6 * F); ctx.save(); ctx.globalAlpha *= 1 - q;
          T.starburst(ctx, (fx + tx) / 2, (fy + ty) / 2, 30 + 60 * q, 60 + 110 * q, 10, seed + ':pop', '#ffffff', UI, 5); ctx.restore();
        }
      }
    }
    if (L.drift !== false) { cx += T.noise(lt * 1.3, seed + 'dx') * (L.drift ?? 2); cy += T.noise(lt * 1.3, seed + 'dy') * (L.drift ?? 2); }
    let squash = 1;
    for (const c of arr(L.clicks)) { clickRing(ctx, cx, cy, lt - c); if (lt >= c && lt < c + 2 * F) squash = 0.9; }
    if (grabbing && style === 'hand') style = 'grab'; drawCursor(ctx, style, cx, cy, L.size ?? 34, squash);
  };

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
  D.carousel = (ctx, L, lt, env) => {
    if (L.dim !== 0) backdrop(ctx, env, `rgba(20,20,26,${L.dim ?? 0.85})`); screen(ctx, L, env); const items = arr(L.items), sel = arr(L.select);
    let pos = L.start ?? 0, bounce = 1;
    for (const c of sel) {
      if (lt < c.at) break; const e = T.ease.outCubic(T.prog(lt, c.at, 8 * F)); pos = T.lerp(pos, c.i ?? 0, e);
      bounce = 1 + 0.05 * Math.sin(Math.PI * T.prog(lt, c.at + 8 * F, 6 * F));
    }
    const order = items.map((_, i) => i).sort((a, b) => Math.abs(b - pos) - Math.abs(a - pos));
    for (const i of order) {
      const d = i - pos, ad = Math.abs(d); if (ad > 1.6) continue;
      const sz = T.lerp(360, 250, Math.min(1, ad)) * (ad < 0.5 ? bounce : 1), x = d * 470; ctx.save(); ctx.translate(x, -30);
      ctx.beginPath(); T.rrect(ctx, -sz / 2, -sz / 2, sz, sz, 14); ctx.fillStyle = '#34343e'; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = '#ffffff'; ctx.stroke();
      if (items[i].prop) prop(ctx, items[i].prop, sz * 0.55, lt);
      if (ad > 0.05) { ctx.fillStyle = `rgba(0,0,0,${0.4 * Math.min(1, ad)})`; ctx.beginPath(); T.rrect(ctx, -sz / 2 - 4, -sz / 2 - 4, sz + 8, sz + 8, 14); ctx.fill(); }
      uiText(ctx, String(items[i].label ?? '').toUpperCase(), 0, sz / 2 + 54, 48, { stroke: 8, fill: ad < 0.5 ? '#fff' : '#9a9aa4' }); ctx.restore();
    }
    for (const sx of [-1, 1]) uiText(ctx, sx < 0 ? '<' : '>', sx * 800, -30, 90, { stroke: 12 });
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
