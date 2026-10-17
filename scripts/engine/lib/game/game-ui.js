// game-ui.js — game-UI kit measured on the reference library, part 1: shared helpers (T.GAME_UI), HUD widgets (`hud`
// layer: system log, hazard meter, pickup counter, warning banner, score popup, survival hearts, player marker, quest
// chip, LCD speedrun timer) and a `cursor` layer (path, clicks, drag-select marquee, carry, RTS selection). The
// game-screen `doc` kinds are in game-docs.js.
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

  T.GAME_UI = { screen, abs, pop, frames, arr, uiText, textW, button, warnTri, prop, bust, wrap, backdrop, drawCursor, clickRing, hopCursor }; // helpers shared with game-docs.js
})();
