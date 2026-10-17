// expressions.js — characters: expression pack (T.EXPR + eye/mouth/brow kinds), face extras (liar nose, tear streams, blush,
// dread, gloom, tape, bruise, bandage, eye mask, glasses, labels, stickers, horns), build/age overlays (T.BEAN_EXTRAS),
// wings and devil tail (T.BEAN_UNDER), the top-down `topbean` layer and T.drawMiniFace for faces on objects.
// Head units: centre (0,-450), half-width 150, eyes y -458, mouth y -382. Body units: shoulders -326, hem -70, feet 0.
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL, D = T.DEG, INK = P.ink;
  const iso = (ctx, fn) => { ctx.save(); try { fn(); } finally { ctx.restore(); } };
  const circ = (k, x, y, r) => { k.moveTo(x + r, y); k.arc(x, y, r, 0, Math.PI * 2); };
  const ell = (k, x, y, rx, ry, rot = 0) => { k.moveTo(x + rx * Math.cos(rot), y + rx * Math.sin(rot)); k.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); };
  const line = (ctx, col, w, fn) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); fn(ctx); ctx.stroke(); };
  const twos = (lt) => Math.floor(lt * 15);
  const star5 = (k, x, y, r, inner = 0.45, rot = 0) => { for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + rot + (i * Math.PI) / 5, rr = i % 2 ? r * inner : r; k[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr); } k.closePath(); };
  const heartPath = (k, x, y, w) => { const s = w / 40; k.moveTo(x, y + 14 * s); k.bezierCurveTo(x - 26 * s, y - 2 * s, x - 18 * s, y - 22 * s, x, y - 10 * s); k.bezierCurveTo(x + 18 * s, y - 22 * s, x + 26 * s, y - 2 * s, x, y + 14 * s); k.closePath(); };

  // ---- per-character state ------------------------------------------------------------------------------------------
  // rig.js passes the same look object to the body hooks and to the head, so a WeakMap carries the layer, its time and
  // the moment the current expression started (for 1-shot face animations: jaw drop, dying slit, vision pop).
  const STATE = new WeakMap();
  T.charsState = (c) => (c && STATE.get(c)) || null;
  const since = (c) => { const st = STATE.get(c); return st ? st.lt - st.exprAt : 1e9; };
  T.BEAN_UNDER = T.BEAN_UNDER || [];
  T.BEAN_UNDER.unshift((ctx, c, view, lt, Ly, B) => {
    const ex = T.timed(Ly.expr ?? 'neutral', lt);
    STATE.set(c, { Ly, lt, view, B, expr: ex.cur, exprAt: ex.at > -1e8 ? ex.at : -1e9 });
  });

  // ---- eye kinds (drawn at each eye centre; ink fill/stroke and width 10 are preset) ------------------------------
  const E = T.EYE_KINDS;
  E.dash = (ctx, x, y, s) => { // squeezed cringe eye + crease ticks over the outer corner
    ctx.beginPath(); ctx.moveTo(x - 17, y + 6); ctx.quadraticCurveTo(x, y - 10, x + 17, y + 6); ctx.stroke();
    line(ctx, INK, 5, (k) => { k.moveTo(x + s * 18, y - 14); k.lineTo(x + s * 30, y - 24); k.moveTo(x + s * 24, y - 4); k.lineTo(x + s * 38, y - 8); });
  };
  E.star = (ctx, x, y, s, lt) => T.outlined(ctx, (k) => star5(k, x, y, 34, 0.45, (twos(lt) % 2 ? 10 : 0) * D), '#ffd21a', { line: 5 });
  E.sparkle = (ctx, x, y) => {
    ctx.beginPath(); ctx.ellipse(x, y, 22, 28, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x + 8, y - 11, 9, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(x - 8, y + 11, 4, 0, Math.PI * 2); ctx.fill();
    line(ctx, INK, 5, (k) => { k.moveTo(x - 18, y + 36); k.quadraticCurveTo(x, y + 44, x + 18, y + 36); });
  };
  E.hollow = (ctx, x, y, s, lt, c) => {
    const k = s > 0 ? 1.15 : 1;
    T.outlined(ctx, (p) => ell(p, x, y, 22 * k, 27 * k), '#fff', { line: 7 });
    if (c.pupils) { ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill(); }
  };
  E.lidSide = (ctx, x, y, s, lt, c) => { // pupils slid to one side under a flat lid
    const g = (c.sideGaze ?? -1) * 10;
    iso(ctx, () => { ctx.beginPath(); ctx.rect(x - 30, y - 7, 60, 40); ctx.clip(); ctx.beginPath(); ctx.ellipse(x + g, y + 2, 13, 19, 0, 0, Math.PI * 2); ctx.fill(); });
    line(ctx, INK, 9, (k) => { k.moveTo(x - 22, y - 7); k.lineTo(x + 22, y - 7); });
  };
  E.closedArc = (ctx, x, y) => { ctx.beginPath(); ctx.moveTo(x - 18, y - 2); ctx.quadraticCurveTo(x, y + 12, x + 18, y - 2); ctx.stroke(); };
  E.chevron = (ctx, x, y, s) => {
    const d = -s; // tip points toward the nose
    line(ctx, INK, 10, (k) => { k.moveTo(x + d * 13, y - 14); k.lineTo(x - d * 11, y); k.lineTo(x + d * 13, y + 14); });
    line(ctx, INK, 4, (k) => { for (const a of [-30, 0, 30]) { const r = a * D; k.moveTo(x - d * (22 + Math.cos(r) * 2), y + Math.sin(r) * 18); k.lineTo(x - d * (34 + Math.cos(r) * 4), y + Math.sin(r) * 26); } });
  };
  const slit = (ctx, x, y, s, h, col = '#ff2a2a') => iso(ctx, () => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, 40); g.addColorStop(0, 'rgba(255,42,42,0.5)'); g.addColorStop(1, 'rgba(255,42,42,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 40, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 16 * T.DPR; ctx.beginPath(); ctx.ellipse(x, y, 22, Math.max(0.5, h), s * -12 * D, 0, Math.PI * 2); ctx.fill();
  });
  E.glowSlit = (ctx, x, y, s, lt, c) => slit(ctx, x, y, s, 8, c.eyeColor ?? '#ff2a2a');
  E.dyingSlit = (ctx, x, y, s, lt, c) => { // the glow narrows over 18 frames, then the eye closes
    const h = 8 * (1 - T.clamp(since(c) / 0.6));
    if (h > 0.4) slit(ctx, x, y, s, h, c.eyeColor ?? '#ff2a2a'); else E.closedArc(ctx, x, y);
  };
  E.wailEye = (ctx, x, y) => {
    ctx.beginPath(); ctx.moveTo(x - 18, y - 6); ctx.quadraticCurveTo(x, y + 10, x + 18, y - 6); ctx.stroke();
    line(ctx, INK, 4, (k) => { k.moveTo(x - 16, y + 14); for (let i = 1; i <= 4; i++) k.lineTo(x - 16 + i * 8, y + 14 + (i % 2 ? 4 : 0)); });
  };
  E.bill = (ctx, x, y) => {
    T.outlined(ctx, (k) => T.rrect(k, x - 30, y - 19, 60, 38, 5), '#7cb85a', { line: 5, shade: (k) => { k.strokeStyle = '#4a7a3a'; k.lineWidth = 3; k.strokeRect(x - 23, y - 12, 46, 24); } });
    ctx.font = T.font(28); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2a4a1a'; ctx.fillText('$', x, y + 2);
  };
  E.heart = (ctx, x, y, s, lt) => { const p = 1 + Math.max(0, Math.sin(lt * Math.PI * 4)) * 0.12; T.outlined(ctx, (k) => heartPath(k, x, y, 44 * p), '#e2324a', { line: 5, shade: (k) => { k.fillStyle = '#ff8090'; k.beginPath(); k.ellipse(x - 9 * p, y - 6 * p, 5 * p, 3 * p, -0.6, 0, Math.PI * 2); k.fill(); } }); };
  E.window = (ctx, x, y, s, lt, c) => { // vision eye: a porthole showing the thing the character is obsessed with
    const r = 46 * (since(c) < 1 / 30 ? 0.9 : 1);
    iso(ctx, () => {
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill(); ctx.clip();
      ctx.globalAlpha *= 0.6; ctx.fillStyle = c.visionTint ?? '#e7b3c0'; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.globalAlpha /= 0.6;
      if (c.vision && T.PROPS && T.PROPS[c.vision]) { ctx.translate(x, y + 30); T.drawProp(ctx, c.vision, 70, lt, {}); }
      else if (c.vision) iso(ctx, () => { ctx.font = T.font(30); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = INK; ctx.fillText(String(c.vision).slice(0, 4).toUpperCase(), x, y); });
    });
    line(ctx, '#fff', 4, (k) => k.arc(x - 4, y - 4, r - 12, 1.1 * Math.PI, 1.45 * Math.PI));
    ctx.strokeStyle = INK; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  };
  T.NO_BLINK_EYES.push('dash', 'star', 'sparkle', 'hollow', 'closedArc', 'chevron', 'glowSlit', 'dyingSlit', 'wailEye', 'bill', 'heart', 'window');

  // ---- mouth kinds (x already includes the view offset) --------------------------------------------------------------
  const M = T.MOUTH_KINDS;
  const teeth = (ctx, x, y, w, h) => {
    T.outlined(ctx, (k) => T.rrect(k, x - w / 2, y - h / 2, w, h, h * 0.3), '#f6f3ee', { line: 7 });
    line(ctx, INK, 3, (k) => { k.moveTo(x - w / 2 + 4, y); k.lineTo(x + w / 2 - 4, y); for (let i = 1; i < 8; i++) { const tx = x - w / 2 + (w * i) / 8; k.moveTo(tx, y - h / 2 + 3); k.lineTo(tx, y + h / 2 - 3); } });
  };
  M['teeth-wide'] = (ctx, x, y) => teeth(ctx, x, y + 4, 150, 64);
  M['teeth-mid'] = (ctx, x, y) => teeth(ctx, x, y + 2, 116, 46);
  M.wavy = (ctx, x, y) => line(ctx, INK, 6, (k) => { for (let i = 0; i <= 24; i++) k[i ? 'lineTo' : 'moveTo'](x - 25 + i * (50 / 24), y + Math.sin((i / 24) * Math.PI * 6) * 4); });
  M['grin-dark'] = (ctx, x, y) => {
    T.outlined(ctx, (k) => { k.moveTo(x - 62, y - 18); k.quadraticCurveTo(x, y + 2, x + 62, y - 18); k.quadraticCurveTo(x, y + 52, x - 62, y - 18); k.closePath(); }, '#f6f3ee', { line: 7 });
    line(ctx, INK, 3, (k) => { for (let i = -2; i <= 2; i++) { k.moveTo(x + i * 22, y - 8 + Math.abs(i) * -2); k.lineTo(x + i * 20, y + 22 - Math.abs(i) * 7); } });
  };
  M.trapezoid = (ctx, x, y, lt, c) => { // wailing mouth: the bottom edge re-rolls its width every 3 frames
    const r = T.rng(T.hash('trap' + Math.floor(lt * 10)))(), bw = 62 + (r - 0.5) * 12;
    T.outlined(ctx, (k) => { k.moveTo(x - 36, y - 22); k.lineTo(x + 36, y - 22); k.lineTo(x + bw, y + 56); k.quadraticCurveTo(x, y + 66, x - bw, y + 56); k.closePath(); }, '#5b1414', { line: 8, shade: (k) => {
      k.fillStyle = '#f6f3ee'; k.fillRect(x - 70, y - 24, 140, 12); k.fillStyle = '#e0707a'; k.beginPath(); k.ellipse(x, y + 52, 34, 16, 0, 0, Math.PI * 2); k.fill();
    } });
  };
  M.jaw = (ctx, x, y, lt, c) => { // jaw drops past the chin over 4 frames (outCubic), skin bars on the sides
    const drop = (c.jawDrop ?? 1) * T.ease.outCubic(T.clamp(since(c) / (4 / 30))), h = 30 + drop * 260;
    T.outlined(ctx, (k) => { k.rect(x - 56, y - 18, 12, h); k.rect(x + 44, y - 18, 12, h); }, c.skin ?? P.skin, { line: 6 });
    T.outlined(ctx, (k) => T.rrect(k, x - 45, y - 18, 90, h, 14), '#3a1418', { line: 7, shade: (k) => { k.fillStyle = '#e0707a'; k.beginPath(); k.ellipse(x, y - 18 + h - 10, 36, 16, 0, 0, Math.PI * 2); k.fill(); k.fillStyle = '#f6f3ee'; k.fillRect(x - 46, y - 20, 92, 10); } });
  };
  M.fangs = (ctx, x, y) => {
    T.outlined(ctx, (k) => ell(k, x, y + 14, 60, 48), '#3a0a0a', { line: 8, shade: (k) => {
      k.fillStyle = '#f6f3ee';
      for (const s of [-1, 1]) { k.beginPath(); k.moveTo(x + s * 42, y - 34); k.lineTo(x + s * 18, y - 34); k.lineTo(x + s * 30, y - 6); k.closePath(); k.fill(); k.beginPath(); k.moveTo(x + s * 40, y + 62); k.lineTo(x + s * 20, y + 62); k.lineTo(x + s * 30, y + 40); k.closePath(); k.fill(); }
    } });
  };
  M.cat = (ctx, x, y) => line(ctx, INK, 6, (k) => { k.moveTo(x - 20, y - 4); k.quadraticCurveTo(x - 10, y + 12, x, y - 2); k.quadraticCurveTo(x + 10, y + 12, x + 20, y - 4); });
  M['o-small'] = (ctx, x, y) => T.outlined(ctx, (k) => ell(k, x, y + 4, 11, 13), '#4a1715', { line: 7 });

  // ---- brow kinds --------------------------------------------------------------------------------------------------
  T.BROW_KINDS.flat = (ctx, x, y, s) => line(ctx, INK, 9, (k) => { k.moveTo(x - 20, y + 6); k.lineTo(x + 20, y + 6); });
  T.BROW_KINDS.heavy = (ctx, x, y, s) => line(ctx, INK, 14, (k) => { const t = Math.tan(8 * D) * 26; k.moveTo(x + s * 26, y - t); k.lineTo(x - s * 26, y + t); });

  // ---- expression pack ---------------------------------------------------------------------------------------------
  Object.assign(T.EXPR, {
    grimace: { eyes: 'dash', brows: 'worried', mouth: 'teeth-wide', talk: ['teeth-wide', 'teeth-mid'] },
    'star-eyes': { eyes: 'star', brows: 'high', mouth: 'smileOpen', talk: ['smile', 'wide'] },
    sparkle: { eyes: 'sparkle', brows: 'sad', mouth: 'wobble', talk: ['small', 'mid'] },
    hollow: { eyes: 'hollow', mouth: 'o-small', talk: ['o-small', 'mid'] },
    'side-eye': { eyes: 'lidSide', brows: 'flat', mouth: 'wavy', talk: ['wavy', 'mid'] },
    'smug-closed': { eyes: 'closedArc', brows: 'smug', mouth: 'smirk', talk: ['smirk', 'mid'] },
    squeeze: { eyes: 'chevron', brows: 'high', mouth: 'o', talk: ['o', 'wide'] },
    menace: { eyes: 'glowSlit', brows: 'angry', mouth: 'grin-dark', talk: ['grin-dark', 'wide'], extra: { shadow: true } },
    wail: { eyes: 'wailEye', brows: 'sad', mouth: 'trapezoid', talk: ['trapezoid'], extra: { stream: true } },
    bruised: { eyes: 'dot', brows: 'angry', mouth: 'teeth-mid', talk: ['teeth-mid', 'mid'], extra: { bruise: 'right' } },
    'jaw-drop': { eyes: 'wide', brows: 'high', mouth: 'jaw', talk: ['jaw'] },
    'sleep-drool': { eyes: 'closedArc', mouth: 'o-small', talk: ['o-small'], extra: { drool: true } },
    dollar: { eyes: 'bill', brows: 'high', mouth: 'smileOpen', talk: ['smile', 'wide'] },
    heart: { eyes: 'heart', brows: 'high', mouth: 'smile', talk: ['smile', 'mid'] },
    vision: { eyes: 'window', brows: 'high', mouth: 'o', talk: ['o'] },
    roar: { eyes: 'glowSlit', brows: 'heavy', mouth: 'fangs', talk: ['fangs'] },
    dying: { eyes: 'dyingSlit', brows: 'sad', mouth: 'closed', talk: ['closed'] },
    cute: { eyes: 'arc', mouth: 'cat', talk: ['cat', 'mid'], extra: { blush: true } },
  });
  const extra = (a) => (a && a.e && a.e.extra) || {};

  // ---- face extras (face-shifted space; head space = translate(-a.fx, 0)) ----------------------------------------------
  const headClip = (ctx, a) => { ctx.translate(-a.fx, 0); ctx.beginPath(); T.BEAN_HEAD.headPath(ctx); ctx.clip(); ctx.translate(a.fx, 0); };
  const before = (fn) => { fn.before = true; return fn; };
  const FX = T.FACE_EXTRAS;
  FX.push(before((ctx, c, s, a) => { // villain shadow band over the brow; glowing eyes are drawn over it
    if (!extra(a).shadow) return;
    headClip(ctx, a); ctx.fillStyle = 'rgba(20,16,24,0.85)'; ctx.fillRect(-a.fx - 220, -640, 440, 210);
  }));
  FX.push(before((ctx, c, s, a) => { // purple swelling under one or both eyes
    const b = c.bruise ?? extra(a).bruise;
    if (!b) return;
    a.eyes.forEach(([x, y], i) => {
      const sd = a.sides[i];
      if (b !== 'both' && !((b === 'right' && sd > 0) || (b === 'left' && sd < 0) || a.eyes.length === 1)) return;
      T.outlined(ctx, (k) => ell(k, x, y + 4, 32, 36), '#8a5aa8', { line: 5, shade: (k) => { k.fillStyle = '#b48ad0'; k.beginPath(); k.ellipse(x - 10, y - 12, 16, 10, -0.5, 0, Math.PI * 2); k.fill(); } });
    });
  }));
  FX.push(before((ctx, c, s, a) => { // burglar eye mask: band with holes, eyes drawn on top
    if (c.mask !== 'eye') return;
    T.outlined(ctx, (k) => { k.moveTo(-a.fx - 160, -500); k.quadraticCurveTo(0, -520, -a.fx + 162, -500); k.lineTo(-a.fx + 160, -424); k.quadraticCurveTo(0, -406, -a.fx - 160, -424); k.closePath(); a.eyes.forEach(([x, y]) => { k.moveTo(x + 24, y); k.ellipse(x, y, 24, 22, 0, 0, Math.PI * 2, true); }); }, c.maskColor ?? '#1d1d1d', { line: 6 });
  }));
  FX.push(before((ctx, c, s, a) => { // cow-suit muzzle around the mouth
    if (c.outfit !== 'cow-suit') return;
    T.outlined(ctx, (k) => ell(k, a.mouth[0], a.mouth[1] + 4, 74, 50), c.muzzle ?? '#f0b0b8', { line: 6, shade: (k) => { k.fillStyle = INK; [-26, 26].forEach((dx) => { k.beginPath(); k.ellipse(a.mouth[0] + dx, a.mouth[1] - 20, 7, 10, 0, 0, Math.PI * 2); k.fill(); }); } });
  }));
  // Tear streams: a wobbly band from each lower eye corner, travelling highlights, a drip that detaches every 18 frames.
  const stream = (ctx, x0, lt, col) => {
    const y0 = -440, y1 = -300, cx = (y) => x0 + Math.sin(((y - y0) / (y1 - y0)) * Math.PI * 4) * 4;
    T.outlined(ctx, (k) => { k.moveTo(cx(y0) - 7, y0); for (let y = y0; y <= y1; y += 10) k.lineTo(cx(y) - 7, y); for (let y = y1; y >= y0; y -= 10) k.lineTo(cx(y) + 7, y); k.closePath(); }, col, { line: 4, ink: '#3a6a9a' });
    line(ctx, '#ffffff', 3, (k) => { for (let i = 0; i < 3; i++) { const y = y0 + (((lt * 60 + i * 46) % 140)); k.moveTo(cx(y) - 3, y); k.lineTo(cx(y + 12) - 3, y + 12); } });
    const ph = (lt % 0.6) / 0.6, dy = T.ease.in ? T.ease.in(ph) * 40 : ph * ph * 40;
    iso(ctx, () => { ctx.globalAlpha *= 1 - ph; T.outlined(ctx, (k) => circ(k, cx(y1), y1 + 8 + dy, 9), col, { line: 4, ink: '#3a6a9a' }); });
    T.outlined(ctx, (k) => circ(k, cx(y1), y1 + 4, 9), col, { line: 4, ink: '#3a6a9a' });
  };
  const drop = (ctx, x, y, col, w = 16) => T.outlined(ctx, (k) => { k.moveTo(x, y - w * 0.75); k.quadraticCurveTo(x + w * 0.6, y + w * 0.1, x, y + w * 0.75); k.quadraticCurveTo(x - w * 0.6, y + w * 0.1, x, y - w * 0.75); k.closePath(); }, col, { line: 4, ink: '#3a6a9a' });
  FX.push((ctx, c, s, a) => {
    const kind = c.tears ?? (extra(a).stream ? 'stream' : null);
    if (!kind) return;
    const col = c.tearColor ?? '#9fd0f0';
    a.eyes.forEach(([x, y], i) => {
      const sd = a.sides[i], ox = x + sd * 14;
      if (kind === 'stream') stream(ctx, ox, s.lt, col);
      else if (kind === 'bead') T.outlined(ctx, (k) => { k.moveTo(x - 18, y + 22); k.quadraticCurveTo(x, y + 36, x + 18, y + 22); k.closePath(); }, c.tearColor ?? '#bfe3f7', { line: 3, ink: '#3a6a9a' });
      else if (kind === 'drop' || kind === 'joy') { if (kind === 'drop' || sd > 0) drop(ctx, x + sd * 30, y + 26 + ((s.lt * 0.8) % 1) * 20, col); }
    });
  });
  FX.push((ctx, c, s, a) => { // blush styles; plain blush is face.js, `cute` forces it on
    const b = c.blush ?? (extra(a).blush ? true : null);
    if (!b) return;
    a.eyes.forEach(([x], i) => {
      const bx = x * 1.8 + (a.eyes.length === 1 ? 20 : 0), by = -410;
      if (!c.blush) { ctx.fillStyle = 'rgba(240,160,168,0.45)'; ctx.beginPath(); ctx.ellipse(bx, by, 28, 15, 0, 0, Math.PI * 2); ctx.fill(); }
      if (b === 'squiggle') line(ctx, '#e04050', 3, (k) => { for (let j = 0; j <= 8; j++) k[j ? 'lineTo' : 'moveTo'](bx - 20 + j * 5, by + (j % 2 ? -5 : 5)); });
      if (b === 'hatch') line(ctx, '#f08aa0', 4, (k) => { for (let j = -1; j <= 1; j++) { k.moveTo(bx + j * 12 - 4, by + 7); k.lineTo(bx + j * 12 + 4, by - 7); } });
    });
  });
  // Marks that must read on any background get a pale rim under the ink: `rim: false` drops it, `rim: "#hex"` recolours.
  const rimOf = (o) => (o && o.rim === false ? null : (o && typeof o.rim === 'string' ? o.rim : '#f4eefc'));
  const rimLine = (ctx, rim, col, w, fn) => { if (rim) line(ctx, rim, w + 8, fn); line(ctx, INK, w + 4, fn); line(ctx, col, w, fn); };
  FX.push((ctx, c, s, a) => { // dread: hatch on the back cheek + two sweat streaks and a sweat drop at the temple
    if (!c.dread) return;
    const o = typeof c.dread === 'object' ? c.dread : {}, rim = rimOf(o), col = o.color ?? '#7fbfe8', bx = a.view === 'front' ? -60 : -96;
    rimLine(ctx, rim, o.hatch ?? '#6a5a8a', 4, (k) => { for (let i = 0; i < 5; i++) { k.moveTo(bx + i * 13, -456); k.lineTo(bx + i * 13 - 4, -414); } });
    rimLine(ctx, rim, col, 6, (k) => { k.moveTo(40, -536); k.lineTo(40, -492); k.moveTo(68, -528); k.lineTo(68, -498); });
    const ph = (s.lt % 0.8) / 0.8, dx = 110, dy = -500 + ph * 40;
    const dropPath = (k) => { k.moveTo(dx, dy - 18); k.quadraticCurveTo(dx + 14, dy + 4, dx, dy + 12); k.quadraticCurveTo(dx - 14, dy + 4, dx, dy - 18); k.closePath(); };
    if (rim) iso(ctx, () => { ctx.strokeStyle = rim; ctx.lineWidth = 12; ctx.lineJoin = 'round'; ctx.beginPath(); dropPath(ctx); ctx.stroke(); });
    T.outlined(ctx, dropPath, col, { line: 4 });
  });
  FX.push((ctx, c, s, a) => { // liar nose: grows linearly over the `grow` window (layer time)
    const n = c.nose;
    if (!n || typeof n !== 'object') return;
    const [t0, t1] = n.grow ?? [0, 0.001], st = T.charsState(c), lt = st ? st.lt : s.lt;
    let p = T.clamp((lt - t0) / Math.max(1e-3, t1 - t0));
    if (n.pops && p > 0 && p < 1 && (lt - t0) % 0.5 < 2 / 30) p *= 1.03;
    const len = 20 + (n.len ?? 0.45) * 300 * p, [nx, ny] = a.nose, dir = a.view === 'front' ? 1 : 1;
    iso(ctx, () => {
      ctx.translate(nx + (a.view === 'side' ? 0 : 6), ny); ctx.rotate((n.tilt ?? -8) * D); ctx.scale(dir, 1);
      T.outlined(ctx, (k) => { k.moveTo(0, -14); k.lineTo(len, -6); k.arc(len, 2, 9, -Math.PI / 2, Math.PI / 2); k.lineTo(0, 14); k.quadraticCurveTo(-10, 0, 0, -14); k.closePath(); }, c.skin ?? P.skin, { line: 6, shade: (k) => { k.fillStyle = c.skinShade ?? T.shade(c.skin ?? P.skin, -0.18); k.fillRect(-10, 4, len + 20, 12); } });
    });
  });
  FX.push((ctx, c, s, a) => { // taped mouth: two black strips crossing as an X (slight tilt)
    if (!c.mouthTape) return;
    const [mx, my] = a.mouth;
    for (const r of [20, -16]) iso(ctx, () => { ctx.translate(mx, my); ctx.rotate(r * D); T.outlined(ctx, (k) => T.rrect(k, -50, -11, 100, 22, 4), '#1e1a18', { line: 5, shade: (k) => { k.fillStyle = '#3a3430'; k.fillRect(-50, -11, 100, 6); } }); });
  });
  FX.push((ctx, c, s, a) => { // eyes bandage band
    if (c.bandage !== 'eyes') return;
    T.outlined(ctx, (k) => { k.moveTo(-a.fx - 162, -494); k.quadraticCurveTo(0, -504, -a.fx + 162, -494); k.lineTo(-a.fx + 162, -428); k.quadraticCurveTo(0, -418, -a.fx - 162, -428); k.closePath(); }, '#efe6d6', { line: 6, shade: (k) => line(k, '#c9bca6', 4, (q) => { q.moveTo(-200, -470); q.lineTo(200, -464); q.moveTo(-200, -448); q.lineTo(200, -444); }) });
  });
  FX.push((ctx, c, s, a) => { // drool from the mouth corner (sleep-drool)
    if (!extra(a).drool) return;
    const x = a.mouth[0] + 14, y = a.mouth[1] + 14, len = 50 + Math.sin(s.lt * 3) * 10;
    line(ctx, '#bfe6f5', 5, (k) => { k.moveTo(x, y); k.lineTo(x + 2, y + len); });
    T.outlined(ctx, (k) => circ(k, x + 2, y + len + 4, 7), '#bfe6f5', { line: 3, ink: '#5a8aaa' });
  });
  FX.push((ctx, c, s, a) => { // grimace crease ticks between the brows
    if (s.expr !== 'grimace') return;
    line(ctx, INK, 4, (k) => { k.moveTo(-6, -520); k.lineTo(-2, -500); k.moveTo(8, -520); k.lineTo(4, -500); });
  });
  FX.push((ctx, c, s, a) => { // age and weight details on the face
    if (c.age === 'elder') {
      line(ctx, '#5a463a', 4, (k) => {
        [[-6, -540, 90], [-4, -525, 44], [0, -510, 70]].forEach(([x, y, w]) => { k.moveTo(x - w / 2, y); k.quadraticCurveTo(x, y - 8, x + w / 2, y); });
        a.eyes.forEach(([x, y], i) => { const sd = a.sides[i]; for (const t of [-30, 15]) { const r = t * D; k.moveTo(x + sd * 28, y + 2); k.lineTo(x + sd * (28 + Math.cos(r) * 14), y + 2 + Math.sin(r) * 14); } k.moveTo(x - 16, y + 32); k.quadraticCurveTo(x, y + 40, x + 16, y + 32); });
      });
    }
    if (c.build === 'fat') line(ctx, T.shade(c.skin ?? P.skin, -0.3), 5, (k) => { k.moveTo(-60, -318); k.quadraticCurveTo(0, -298, 60, -318); });
  });
  FX.push((ctx, c, s, a) => { // glasses and monocle (side view: one lens + an arm to the ear)
    const g = c.glasses === true || c.glasses === 'spectacles' ? 'clear' : c.glasses; // true = plain spectacles
    if (g) {
      const col = c.glassesColor ?? (g === 'shutter' ? '#2a6ad0' : g === 'round' || g === 'clear' ? INK : '#141414');
      const lens = (x, y) => {
        if (g === 'clear') { // clear spectacles: thin rounded frames, a faint glass sheen and a glint; the eyes show through
          const rim = (k) => T.rrect(k, x - 36, y - 26, 72, 54, 20);
          T.outlined(ctx, rim, 'rgba(214,236,246,0.22)', { line: 6, ink: col, paint: false, shade: (k) => line(k, 'rgba(255,255,255,0.75)', 4, (q) => { q.moveTo(x - 22, y + 10); q.lineTo(x - 8, y - 14); }) });
          return;
        }
        if (g === 'round') T.outlined(ctx, (k) => circ(k, x, y, 32), c.opaque ? '#f6f6f6' : null, { line: 6, shade: c.opaque ? (k) => { k.fillStyle = '#c8ccd2'; k.beginPath(); k.moveTo(x - 30, y + 10); k.lineTo(x + 6, y - 32); k.lineTo(x + 22, y - 24); k.lineTo(x - 18, y + 26); k.closePath(); k.fill(); } : null });
        else T.outlined(ctx, (k) => { k.moveTo(x - 38, y - 22); k.lineTo(x + 38, y - 22); k.quadraticCurveTo(x + 36, y + 24, x, y + 24); k.quadraticCurveTo(x - 36, y + 24, x - 38, y - 22); k.closePath(); }, col, { line: 5, shade: (k) => {
          if (g === 'shutter') { k.fillStyle = '#ffffff'; for (let j = 0; j < 5; j++) k.fillRect(x - 40, y - 18 + j * 9, 80, 4); }
          else line(k, '#ffffff', 3, (q) => { q.moveTo(x - 18, y + 8); q.lineTo(x - 2, y - 14); });
        } });
      };
      a.eyes.forEach(([x, y]) => lens(x, y));
      if (a.eyes.length === 2) line(ctx, g === 'shutter' ? col : INK, 7, (k) => { k.moveTo(a.eyes[0][0] + 34, a.eyes[0][1] - 10); k.quadraticCurveTo((a.eyes[0][0] + a.eyes[1][0]) / 2, a.eyes[0][1] - 18, a.eyes[1][0] - 34, a.eyes[1][1] - 10); });
      if (a.view !== 'front') line(ctx, INK, 6, (k) => { k.moveTo(a.eyes[0][0] - 36, a.eyes[0][1] - 12); k.lineTo(-a.fx - 130, -470); });
    }
    if (c.monocle) {
      const [x, y] = a.eyes[a.eyes.length - 1];
      line(ctx, '#c9a24a', 3, (k) => { k.moveTo(x, y + 30); k.quadraticCurveTo(x + 30, y + 90, x - 10, -330); });
      ctx.strokeStyle = INK; ctx.lineWidth = 11; ctx.beginPath(); ctx.arc(x, y, 30, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = '#c9a24a'; ctx.lineWidth = 5; ctx.stroke();
    }
  });
  FX.push((ctx, c, s, a) => { // cheek stickers
    for (const st of stickerList(c)) if (st.anchor === 'cheek') sticker(ctx, st, a.view === 'side' ? 40 : 70, -420, c);
  });

  // ---- head extras (after hair and headwear, every view) --------------------------------------------------------------
  T.HEAD_EXTRAS = T.HEAD_EXTRAS || [];
  const HX = T.HEAD_EXTRAS;
  HX.push((ctx, c, s, h) => { // devil horns
    if (!(c.devil || c.horns === 'devil')) return;
    const col = c.devilColor ?? '#d2232a';
    for (const sd of [-1, 1]) {
      const bx = h.fx * 0.6 + sd * 70;
      T.outlined(ctx, (k) => { k.moveTo(bx - 16, -580); k.quadraticCurveTo(bx + sd * 6, -640, bx + sd * 34, -664); k.quadraticCurveTo(bx + sd * 10, -620, bx + 16, -576); k.closePath(); }, col, { line: 6, shade: (k) => { k.fillStyle = T.shade(col, -0.3); k.fillRect(bx + (sd < 0 ? -40 : 4), -680, 40, 110); } });
    }
  });
  HX.push((ctx, c, s, h) => { // gloom drips from the brow (or the hat brim): grow over 10 frames, then boil on twos
    const g = c.gloom;
    if (!g || h.view === 'back') return;
    const st = T.charsState(c), lt = st ? st.lt : s.lt, t = lt - (g.at ?? 0);
    if (t < 0) return;
    const n = g.count ?? 8, y0 = c.head ? -548 : -566, grow = T.ease.outCubic(T.clamp(t / (10 / 30)));
    const base = T.rng(T.hash('gloom' + s.seed)), boil = T.rng(T.hash('gloomb' + s.seed + twos(lt)));
    iso(ctx, () => { ctx.beginPath(); T.BEAN_HEAD.headPath(ctx); ctx.clip(); const gr = ctx.createLinearGradient(0, -604, 0, -430); gr.addColorStop(0, 'rgba(58,40,90,0.55)'); gr.addColorStop(1, 'rgba(58,40,90,0)'); ctx.globalAlpha *= grow; ctx.fillStyle = gr; ctx.fillRect(-200, -620, 400, 200); });
    const col = g.color ?? '#6a4ab0', rim = rimOf(g);
    for (let i = 0; i < n; i++) { // ink-outlined drips with a pale rim so they read on dark scenes too
      const x = h.fx * 0.5 - 120 + (240 * i) / (n - 1), len = (30 + base() * 30 + (boil() - 0.5) * 6) * grow;
      const drip = (k) => { k.moveTo(x - 5, y0); k.lineTo(x - 5, y0 + len); k.arc(x, y0 + len, 8, Math.PI, 0, true); k.lineTo(x + 5, y0); k.closePath(); };
      if (rim) iso(ctx, () => { ctx.strokeStyle = rim; ctx.lineWidth = 13; ctx.lineJoin = 'round'; ctx.beginPath(); drip(ctx); ctx.stroke(); });
      T.outlined(ctx, drip, col, { line: 5 });
      if (i % 3 === 1 && grow >= 1) {
        const ph = ((t + i * 0.13) % 0.4) / 0.4, yy = y0 + len + 14 + ph * 50;
        iso(ctx, () => { ctx.globalAlpha *= 1 - ph; if (rim) { ctx.fillStyle = rim; ctx.beginPath(); ctx.arc(x, yy, 10, 0, Math.PI * 2); ctx.fill(); } T.outlined(ctx, (k) => circ(k, x, yy, 6), col, { line: 4 }); });
      }
    }
  });
  HX.push((ctx, c, s, h) => { // forehead label strip, curved along the head
    if (!c.label || h.view === 'back') return;
    const x = h.fx * 0.8, txt = String(typeof c.label === 'object' ? c.label.text ?? '' : c.label).toUpperCase();
    T.outlined(ctx, (k) => { k.moveTo(x - 90, -530); k.quadraticCurveTo(x, -556, x + 90, -530); k.lineTo(x + 90, -486); k.quadraticCurveTo(x, -512, x - 90, -486); k.closePath(); }, '#ffffff', { line: 4 });
    iso(ctx, () => { ctx.translate(x, -510); ctx.font = T.font(30); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = c.labelColor ?? '#c8323a'; ctx.fillText(txt.slice(0, 8), 0, 2, 168); });
  });
  HX.push((ctx, c, s, h) => { // head bandages
    const b = c.bandage;
    if (b === 'head') {
      T.outlined(ctx, (k) => { k.moveTo(-158, -560); k.quadraticCurveTo(0, -590, 158, -560); k.lineTo(156, -520); k.quadraticCurveTo(0, -546, -156, -520); k.closePath(); }, '#efe6d6', { line: 6 });
      for (const r of [-0.5, 0.4]) T.outlined(ctx, (k) => ell(k, -170 - h.sh * 20, -540, 26, 13, r), '#efe6d6', { line: 5 });
    }
    if (b === 'cross' && h.view !== 'back') for (const r of [35, -35]) iso(ctx, () => {
      ctx.translate(h.fx + 40, -540); ctx.rotate(r * D);
      T.outlined(ctx, (k) => T.rrect(k, -36, -11, 72, 22, 6), '#e8c79a', { line: 5 });
      ctx.fillStyle = '#b8945e'; [-14, 0, 14].forEach((dx) => { ctx.beginPath(); ctx.arc(dx, 0, 2.5, 0, Math.PI * 2); ctx.fill(); });
    });
  });
  HX.push((ctx, c, s, h) => { // cow-suit ears + stubby horns, gown flower circlet
    if (c.outfit === 'cow-suit') {
      for (const sd of [-1, 1]) T.outlined(ctx, (k) => { k.moveTo(sd * 70, -600); k.quadraticCurveTo(sd * 90, -640, sd * 110, -610); k.closePath(); }, '#efe7cf', { line: 5 });
      for (const sd of [-1, 1]) T.outlined(ctx, (k) => ell(k, sd * 172 - h.sh * 30, -540, 46, 20, sd * 0.4), '#f2f0ea', { line: 6, shade: (k) => { k.fillStyle = '#f0b0b8'; k.beginPath(); k.ellipse(sd * 172 - h.sh * 30, -538, 26, 9, sd * 0.4, 0, Math.PI * 2); k.fill(); } });
    }
    if (c.outfit === 'gown' && h.view !== 'back') for (let i = 0; i < 7; i++) {
      const ang = (200 + i * 23) * D, x = Math.cos(ang) * 150 + h.fx * 0.3, y = -480 + Math.sin(ang) * 120;
      T.outlined(ctx, (k) => { for (let p = 0; p < 5; p++) circ(k, x + Math.cos(p * 1.257) * 9, y + Math.sin(p * 1.257) * 9, 7); }, ['#f4a6c0', '#ffffff', '#f6d06a'][i % 3], { line: 3 });
    }
  });
  HX.push((ctx, c, s, h) => { // forehead stickers
    if (h.view === 'back') return;
    for (const st of stickerList(c)) if (st.anchor === 'forehead') sticker(ctx, st, h.fx, -560, c);
  });

  // ---- stickers, badges, signs, stains (body extras) -----------------------------------------------------------------
  const stickerList = (c) => (Array.isArray(c.stickers) ? c.stickers : c.stickers ? [c.stickers] : []).map((st) => (typeof st === 'string' ? { kind: st, anchor: 'chest' } : { anchor: 'chest', ...st }));
  const STICKERS = {
    star: (k) => star5(k, 0, 0, 34, 0.48), heart: (k) => heartPath(k, 0, 4, 64), check: (k) => T.rrect(k, -30, -30, 60, 60, 12),
    mug: (k) => { T.rrect(k, -26, -28, 44, 56, 8); circ(k, 26, 0, 12); }, skull: (k) => { k.moveTo(-28, 4); k.arc(0, -4, 28, Math.PI, 0); k.lineTo(28, 4); k.lineTo(16, 30); k.lineTo(-16, 30); k.closePath(); },
  };
  const STICK_COL = { star: '#f6c33a', heart: '#e2324a', check: '#3aa65a', mug: '#8a5a3a', skull: '#f2efe6' };
  function sticker(ctx, st, x, y, c) {
    const now = T.charsState(c)?.lt ?? 0, t = st.at != null ? now - st.at : 1;
    if (t < 0) return;
    const p = T.clamp(t / (3 / 30)), k = 1.4 - 0.4 * T.ease.outCubic(p), wig = t < 5 / 30 ? (twos(t * 2) % 2 ? 8 : -8) : 0;
    iso(ctx, () => {
      ctx.translate(x, y); ctx.rotate(((st.rot ?? -8) + wig) * D); ctx.scale(k * (st.size ?? 1), k * (st.size ?? 1));
      const shape = STICKERS[st.kind];
      if (shape) {
        iso(ctx, () => { ctx.lineJoin = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 22; ctx.beginPath(); shape(ctx); ctx.stroke(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 12; ctx.stroke(); });
        T.outlined(ctx, shape, st.color ?? STICK_COL[st.kind], { line: 0 });
        if (st.kind === 'check') line(ctx, '#ffffff', 9, (q) => { q.moveTo(-14, 0); q.lineTo(-3, 12); q.lineTo(16, -12); });
        if (st.kind === 'skull') { ctx.fillStyle = INK; [-10, 10].forEach((ex) => { ctx.beginPath(); ctx.arc(ex, -4, 7, 0, Math.PI * 2); ctx.fill(); }); }
      } else if (T.PROPS && T.PROPS[st.kind]) {
        T.outlined(ctx, (q) => circ(q, 0, 0, 38), '#ffffff', { line: 5 }); ctx.translate(0, 26); T.drawProp(ctx, st.kind, 56, now, {});
      }
      line(ctx, 'rgba(255,255,255,0.7)', 4, (q) => { q.moveTo(-16, -22); q.lineTo(-4, -28); });
    });
  }
  const nx = (view) => (view === 'front' ? 0 : 22);
  function badge(ctx, c, view) {
    const b = typeof c.badge === 'string' ? { text: c.badge } : c.badge;
    const st = T.charsState(c), swaps = b.badgeSwap || c.badgeSwap || [];
    let text = b.text ?? '', at = null;
    for (const sw of swaps) if (st && st.lt >= (sw.at ?? 0)) { text = sw.text; at = sw.at; }
    const squash = at != null && st && st.lt - at < 1 / 30 ? 0.9 : 1, style = b.style ?? 'hello', x = nx(view) + 20;
    iso(ctx, () => {
      ctx.translate(x, style === 'plank' ? -200 : -250); ctx.scale(1, squash);
      const txt = String(text).toUpperCase();
      if (style === 'plank') {
        T.outlined(ctx, (k) => T.rrect(k, -130, -30, 260, 60, 6), c.badgeColor ?? '#b07a3c', { line: 6, shade: (k) => line(k, T.shade(c.badgeColor ?? '#b07a3c', -0.25), 3, (q) => { q.moveTo(-120, -10); q.lineTo(120, -12); q.moveTo(-120, 14); q.lineTo(110, 12); }) });
        ctx.font = T.font(34); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = INK; ctx.fillText(txt, 0, 2, 240);
      } else if (style === 'tag') {
        T.outlined(ctx, (k) => T.rrect(k, -60, -25, 120, 50, 6), c.badgeColor ?? '#f4e04a', { line: 5 });
        ctx.font = T.font(28); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = INK; ctx.fillText(txt, 0, 2, 108);
      } else {
        T.outlined(ctx, (k) => T.rrect(k, -75, -45, 150, 90, 8), '#ffffff', { line: 5, shade: (k) => { k.fillStyle = c.badgeColor ?? '#d0302a'; k.fillRect(-80, -50, 160, 33); } });
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ffffff'; ctx.font = T.font(12); ctx.fillText('HELLO MY NAME IS', 0, -32, 140);
        ctx.fillStyle = INK; ctx.font = T.font(26); ctx.fillText(txt, 0, 14, 136);
      }
    });
  }
  T.BEAN_EXTRAS = T.BEAN_EXTRAS || [];
  T.BEAN_EXTRAS.push((ctx, c, view, lt) => { // accessories on the torso
    if (view === 'back') return;
    if (c.bowtie && c.outfit !== 'suit' && c.outfit !== 'frockcoat') { const x = nx(view); T.outlined(ctx, (k) => { k.moveTo(x - 36, -334); k.lineTo(x - 36, -300); k.lineTo(x, -317); k.lineTo(x + 36, -300); k.lineTo(x + 36, -334); k.lineTo(x, -317); k.closePath(); }, c.tie ?? '#a0262c', { line: 5 }); T.outlined(ctx, (k) => T.rrect(k, x - 9, -326, 18, 18, 4), T.shade(c.tie ?? '#a0262c', -0.2), { line: 4 }); }
    if (c.stains) {
      const s = c.stains === true ? {} : c.stains, r = T.rng(T.hash('stain' + (s.seed ?? ''))), col = s.color ?? c.stainColor ?? '#b0151a';
      iso(ctx, () => { ctx.beginPath(); ctx.moveTo(-100, -326); ctx.quadraticCurveTo(0, -342, 100, -326); ctx.quadraticCurveTo(130, -210, 148, -70); ctx.quadraticCurveTo(0, -48, -148, -70); ctx.quadraticCurveTo(-130, -210, -100, -326); ctx.clip();
        ctx.fillStyle = col;
        for (let i = 0; i < (s.count ?? 5); i++) { const x = -100 + r() * 200, y = -300 + r() * 200, rr = 14 + r() * 16; ctx.beginPath(); T.smoothPath(ctx, T.blobPts(x, y, rr, rr, 'st' + i + (s.seed ?? ''), 6, 0.35)); ctx.fill(); if (r() < 0.6) { ctx.beginPath(); ctx.ellipse(x + 3, y + rr + 10 + r() * 14, 5, 12 + r() * 10, 0, 0, Math.PI * 2); ctx.fill(); } }
      });
    }
    if (c.badge) badge(ctx, c, view);
    if (c.sign) {
      const txt = String(typeof c.sign === 'object' ? c.sign.text : c.sign).toUpperCase(), sw = Math.sin(lt * Math.PI * 2) * 2;
      iso(ctx, () => {
        ctx.translate(nx(view) * 0.4, -300); ctx.rotate(sw * D);
        line(ctx, '#e0c060', 4, (k) => { k.moveTo(-50, -30); k.lineTo(-60, 30); k.moveTo(50, -30); k.lineTo(60, 30); });
        T.outlined(ctx, (k) => T.rrect(k, -85, 26, 170, 96, 4), '#c9a06a', { line: 6, shade: (k) => { k.fillStyle = '#b08a56'; k.fillRect(-90, 100, 180, 30); } });
        ctx.font = T.font(30, 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = INK; ctx.fillText(txt.slice(0, 10), 0, 74, 156);
      });
    }
    for (const st of stickerList(c)) if (st.anchor === 'chest' || st.anchor === 'belly') sticker(ctx, st, st.anchor === 'chest' ? nx(view) + 20 : 0, st.anchor === 'chest' ? -260 : -170, c);
  });

  // ---- build / age overlays ----------------------------------------------------------------------------------------
  T.BEAN_EXTRAS.unshift((ctx, c, view) => {
    const robe = c.robe ?? P.red, skin = c.skin ?? P.skin, sd = view === 'front' ? 1 : -1;
    if (c.build === 'muscle' && view !== 'back') {
      line(ctx, T.shade(robe, -0.35), 5, (k) => {
        for (const s of [-1, 1]) { k.moveTo(s * 70, -300); k.quadraticCurveTo(s * 35, -258, 0, -290); }
        k.moveTo(0, -290); k.lineTo(0, -196);
        for (const y of [-250, -220, -190]) for (const s of [-1, 1]) { k.moveTo(s * 10, y); k.lineTo(s * 34, y - 2); }
      });
    }
    if (c.build === 'brute') {
      const bare = !!c.bare, fill = bare ? skin : robe, sh = T.shade(fill, -0.2);
      if (bare) T.outlined(ctx, (k) => { k.moveTo(-100, -326); k.quadraticCurveTo(0, -342, 100, -326); k.quadraticCurveTo(130, -210, 140, -150); k.lineTo(-140, -150); k.quadraticCurveTo(-130, -210, -100, -326); k.closePath(); }, skin, { line: 0, shade: (k) => { k.fillStyle = c.skinShade ?? '#c4c1cd'; k.beginPath(); k.ellipse(sd * 150, -220, 70, 160, 0, 0, Math.PI * 2); k.fill(); } });
      if (view !== 'back') {
        T.outlined(ctx, (k) => { T.rrect(k, -98, -318, 92, 66, 28); T.rrect(k, 6, -318, 92, 66, 28); }, sh, { line: 5 });
        for (let r = 0; r < 3; r++) for (const s of [-1, 1]) T.outlined(ctx, (k) => T.rrect(k, s > 0 ? 4 : -44, -238 + r * 36, 40, 30, 10), sh, { line: 4 });
      }
      if (c.plates) {
        const pc = c.plateColor ?? '#6f7078';
        for (const s of [-1, 1]) T.outlined(ctx, (k) => ell(k, s * 112, -322, 60, 34, s * 0.3), pc, { line: 6, shade: (k) => { k.fillStyle = T.shade(pc, -0.3); k.fillRect(s * 112 - 70, -318, 140, 40); } });
        for (let i = -1; i <= 1; i++) T.outlined(ctx, (k) => T.rrect(k, i * 54 - 25, -172, 50, 36, 6), pc, { line: 5 });
      }
    }
    if (c.build === 'fat') {
      T.outlined(ctx, (k) => ell(k, 6, -150, 142, 92), robe, { shade: (k) => { k.fillStyle = c.robeShade ?? T.shade(robe, -0.24); k.beginPath(); k.ellipse(sd * 120, -140, 70, 110, 0, 0, Math.PI * 2); k.fill(); } });
      if (c.belt) line(ctx, c.belt, 14, (k) => { k.moveTo(-136, -130); k.quadraticCurveTo(0, -60, 140, -130); });
      if (view !== 'back') line(ctx, T.shade(robe, -0.35), 5, (k) => { k.moveTo(nx(view) - 8, -150); k.quadraticCurveTo(nx(view), -140, nx(view) + 8, -150); });
    }
    if (c.age === 'toddler') T.outlined(ctx, (k) => T.rrect(k, -110, -150, 220, 110, 44), c.diaper ?? '#f2f0ee', { shade: (k) => { k.fillStyle = '#cfc9d6'; k.fillRect(sd > 0 ? 40 : -120, -150, 80, 120); } });
    if (c.age === 'baby') {
      const sw = c.swaddle ?? '#f0ece4', fold = T.shade(sw, -0.18);
      T.outlined(ctx, (k) => ell(k, 0, -190, 176, 158), sw, { shade: (k) => {
        k.fillStyle = T.shade(sw, -0.1); k.beginPath(); k.ellipse(sd * 120, -190, 90, 190, 0, 0, Math.PI * 2); k.fill();
        line(k, fold, 7, (q) => { q.moveTo(-120, -300); q.quadraticCurveTo(0, -250, 110, -140); q.moveTo(-140, -200); q.quadraticCurveTo(-40, -150, 40, -60); q.moveTo(80, -330); q.quadraticCurveTo(140, -260, 150, -200); });
      } });
    }
  });

  // ---- wings and devil tail (behind the body) ------------------------------------------------------------------------
  const WING = { bird: { span: 1.8, color: '#f1e6d2' }, angel: { span: 1.1, color: '#ffffff' }, insect: { span: 1, color: '#a7e0d8' } };
  const wingSpec = (c) => { const w = c.wings; if (!w) return null; const o = typeof w === 'string' ? { kind: w } : { kind: 'bird', ...w }; const base = WING[o.kind]; if (!base) throw new Error(`Unknown wings kind "${o.kind}" (bird | angel | insect)`); return { ...base, ...o, color: o.color ?? c.wingColor ?? base.color }; };
  const inWin = (wins, lt) => (Array.isArray(wins) ? wins : []).some(([a, b]) => lt >= a && lt <= b);
  // One feathered wing in local space: x outward, leading edge rising to the tip; 3 rows drawn back to front.
  // Wax melt (from melt.at): over 1 s the feathers soften and hang lower while wax beads run and drip; then every other
  // primary (tip first, one per 6 frames) loosens and flutters down, fading out - the wing keeps its shape, only thinner.
  const meltOf = (w, lt) => (w.melt ? lt - (w.melt.at ?? 0) : -1);
  function featherWing(ctx, W, col, lt, w) {
    const sh = T.shade(col, -0.16), ink = '#4a2a1a', lw = Math.max(4, W * 0.014);
    const melt = meltOf(w, lt), sag = melt > 0 ? T.ease.outCubic(T.clamp(melt / 1.2)) : 0;
    const edge = (t) => [t * W, -Math.sin(t * Math.PI * 0.9) * W * 0.1 * (1 - sag * 0.6) - t * W * 0.04 + sag * t * t * W * 0.07];
    const feather = (x, y, len, wid, ang, fill) => iso(ctx, () => { ctx.translate(x, y); ctx.rotate(ang); T.outlined(ctx, (k) => { k.moveTo(-wid, 0); k.quadraticCurveTo(-wid * 1.15, len * 0.7, 0, len); k.quadraticCurveTo(wid * 1.15, len * 0.7, wid, 0); k.closePath(); }, fill, { line: lw, ink, shade: (k) => line(k, T.shade(fill, -0.25), Math.max(2, lw * 0.6), (q) => { q.moveTo(0, len * 0.08); q.lineTo(0, len * 0.8); }) }); });
    for (let i = 7; i >= 0; i--) { // primaries; melting turns them toward straight down and stretches them a little
      const t = 0.42 + (i / 7) * 0.58, [x, y] = edge(t), len = W * (0.3 + 0.22 * t) * (1 + sag * 0.12), ang = -(8 + 34 * t) * D * (1 - sag * 0.45);
      const order = (7 - i) >> 1, ft = melt - 1 - order * (6 / 30);
      if (i % 2 === 1 && ft >= 0) { // loosened: flutters down with a sine sway, fades over 1.2 s
        if (ft > 1.2) continue;
        iso(ctx, () => { ctx.globalAlpha *= 1 - T.clamp((ft - 0.8) / 0.4); ctx.translate(x + Math.sin(ft * 5) * 50, y + ft * 160 + ft * ft * 140); ctx.rotate((-55 + Math.sin(ft * 6) * 40) * D); ctx.scale(0.7, 0.7); feather(0, 0, len, W * 0.08, 0, col); }); // tumbles flat-ish, smaller
        continue;
      }
      feather(x, y, len, W * 0.06, ang, i % 2 ? col : sh);
    }
    for (let i = 6; i >= 0; i--) { const t = 0.08 + (i / 6) * 0.6, [x, y] = edge(t); feather(x, y, W * 0.24 * (1 + sag * 0.1), W * 0.055, -(4 + 16 * t) * D * (1 - sag * 0.6), i % 2 ? sh : col); }
    for (let i = 5; i >= 0; i--) { const [x, y] = edge(0.04 + (i / 5) * 0.56); T.outlined(ctx, (k) => circ(k, x, y + W * 0.035, W * 0.065), col, { line: lw, ink }); }
    const band = (k) => { for (let i = 0; i <= 12; i++) { const [x, y] = edge(i / 12); k[i ? 'lineTo' : 'moveTo'](x, y); } };
    line(ctx, ink, W * 0.07 + lw * 2, band); line(ctx, col, W * 0.07, band);
    if (w.wax) waxBeads(ctx, edge, W, melt, lw);
  }
  // Wax beads on the arm bone; melting stretches them into runs and sheds drops every 0.5 s.
  function waxBeads(ctx, edge, W, melt, lw) {
    const wax = '#efc14a', run = melt > 0 ? T.clamp(melt / 1.2) : 0, r = W * 0.026;
    for (let i = 0; i < 6; i++) {
      const [x, y0] = edge(0.15 + i * 0.15), y = y0 + W * 0.03, len = r + run * W * (0.06 + 0.03 * (i % 3));
      T.outlined(ctx, (k) => { k.moveTo(x - r, y); k.arc(x, y, r, Math.PI, 0); k.lineTo(x + r * 0.7, y + len); k.arc(x, y + len, r * 0.7, 0, Math.PI); k.closePath(); }, wax, { line: lw * 0.8, ink: '#6a4a1a', shade: (k) => { k.fillStyle = '#fff3c0'; k.beginPath(); k.ellipse(x - r * 0.35, y - r * 0.3, r * 0.3, r * 0.2, -0.6, 0, Math.PI * 2); k.fill(); } });
      if (melt > 0.3) {
        const ph = ((melt + i * 0.17) % 0.5) / 0.5, dy = y + len + ph * ph * W * 0.5;
        iso(ctx, () => { ctx.globalAlpha *= 1 - ph * 0.8; T.outlined(ctx, (k) => { k.moveTo(x, dy - r); k.quadraticCurveTo(x + r * 0.8, dy + r * 0.3, x, dy + r * 0.7); k.quadraticCurveTo(x - r * 0.8, dy + r * 0.3, x, dy - r); k.closePath(); }, wax, { line: lw * 0.7, ink: '#6a4a1a' }); });
      }
    }
  }
  T.BEAN_UNDER.push((ctx, c, view, lt, Ly) => {
    const w = wingSpec(c);
    if (w) {
      const flapping = inWin(c.flap ?? (Ly && Ly.flap), lt), W = (w.span * 600) / 2; // flap windows on the look or the layer
      for (const s of [-1, 1]) iso(ctx, () => {
        ctx.translate(s * (view === 'front' || view === 'back' ? 80 : 50) - (view === '3q' ? 20 : 0), -300); ctx.scale(s * (view === '3q' && s > 0 ? 0.75 : 1), 1);
        if (w.kind === 'insect') {
          const up = flapping ? (twos(lt) % 2 ? 18 : -10) : 6;
          ctx.globalAlpha *= 0.7;
          for (const [a, len, wd] of [[-58 - up, 190 * w.span, 46 * w.span], [-8 - up * 0.5, 150 * w.span, 36 * w.span]]) iso(ctx, () => { ctx.rotate(a * D); T.outlined(ctx, (k) => { k.moveTo(0, 0); k.quadraticCurveTo(len * 0.55, -wd, len, 0); k.quadraticCurveTo(len * 0.55, wd, 0, 0); k.closePath(); }, w.color, { line: 5, shade: (k) => line(k, '#ffffff', 5, (q) => { q.moveTo(len * 0.15, -wd * 0.25); q.quadraticCurveTo(len * 0.5, -wd * 0.55, len * 0.85, -wd * 0.1); }) }); });
          return;
        }
        const rest = w.kind === 'angel' ? 34 : 24, m = meltOf(w, lt), droop = m > 0 ? 20 * T.ease.outCubic(T.clamp(m / 1.2)) : 0;
        const ang = flapping && m <= 0 ? (Math.floor(lt * 5) % 2 ? rest + 30 : rest - 26) : rest - droop; // two flap poses, 6 frames each; melting wings sag
        ctx.rotate(-ang * D);
        featherWing(ctx, W, w.color, lt, w);
      });
    }
    if (c.devil || c.tail === 'devil') { // S-curve tail behind the body, sways at 1 Hz
      const col = c.devilColor ?? '#d2232a', sw = Math.sin(lt * Math.PI * 2) * 10 * D;
      iso(ctx, () => {
        ctx.translate(-40, -110); ctx.rotate(sw);
        const p = (k) => { k.moveTo(0, 0); k.bezierCurveTo(-60, 30, -80, -50, -130, 30); k.quadraticCurveTo(-150, 60, -150, 40); };
        line(ctx, INK, 26, p); line(ctx, col, 14, p);
        T.outlined(ctx, (k) => { k.moveTo(-150, 40); k.lineTo(-178, 22); k.lineTo(-160, 72); k.closePath(); }, col, { line: 6 });
      });
    }
  });

  // ---- topbean: overhead character -----------------------------------------------------------------------------------
  const facingAt = (v, lt) => { // snaps; a turn of more than 90 degrees gets two in-between frames
    const f = T.timed(v ?? 0, lt, 0.001), d = f.cur - f.prev, t = lt - f.at;
    if (Math.abs(d) > 90 && t >= 0 && t < 2 / 30) return f.prev + d * (Math.floor(t * 30) + 1) / 3;
    return f.cur;
  };
  const capsule = (ctx, x0, y0, x1, y1, w, col) => { const p = (k) => { k.moveTo(x0, y0); k.lineTo(x1, y1); }; line(ctx, INK, w + T.LINE * 2, p); line(ctx, col, w, p); };
  function topHat(ctx, c) {
    const h = c.head;
    if (!h || h === 'halo') return;
    const col = c.headColor ?? (h === 'crown' ? P.gold : /helm|dome|brodie|adrian/.test(h) ? '#a6a6ad' : '#5a4a3c');
    if (h === 'crown') {
      ctx.strokeStyle = INK; ctx.lineWidth = 24; ctx.beginPath(); ctx.arc(0, -6, 42, 0, Math.PI * 2); ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = 14; ctx.stroke();
      for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 + 0.3; T.outlined(ctx, (k) => circ(k, Math.cos(a) * 50, -6 + Math.sin(a) * 50, 10), col, { line: 5 }); }
      return;
    }
    const brimmed = /hat|brim|boater|fedora|safari|cone|bowler|brodie|kettle/.test(h), cy = brimmed ? -20 : 4;
    if (brimmed) T.outlined(ctx, (k) => circ(k, 0, -20, 104), T.shade(col, -0.1));
    T.outlined(ctx, (k) => circ(k, 0, cy, brimmed ? 62 : 60), col, { shade: (k) => { k.fillStyle = T.shade(col, 0.2); k.beginPath(); k.ellipse(-18, cy - 24, 26, 14, -0.5, 0, Math.PI * 2); k.fill(); } });
    if (/helm/.test(h) || c.crest) { const crest = (k) => { k.moveTo(0, cy - 60); k.lineTo(0, cy + 64); }; line(ctx, INK, 30, crest); line(ctx, c.crest ?? '#d1262c', 20, crest); }
  }
  T.layers.topbean = (ctx, L, lt, env) => {
    const c = { skin: P.skin, robe: P.red, hair: 'short', ...((T.OUTFIT_DEFAULTS || {})[(env.cast[L.who] || {}).outfit] || {}), ...(env.cast[L.who] || {}), ...(L.look || {}) };
    const s = (L.size ?? 260) / 260, face = facingAt(L.facing, lt), walk = inWin(L.walk, lt);
    const step = walk ? Math.sin((Math.floor(lt * 15) / 15 / 0.56) * Math.PI * 2) : 0;
    const breathe = 1 + Math.sin(lt * Math.PI) * 0.01 + 0.01;
    const expr = T.timed(L.expr ?? 'neutral', lt).cur, e = T.EXPR[expr] || T.EXPR.neutral;
    const robe = c.robe, sleeve = c.sleeve ?? robe, hair = c.hairColor ?? P.hair, seed = (L.id || L.who || 'top') + '';
    ctx.scale(s, s);
    iso(ctx, () => { // flat shadow, offset down-right in screen space whatever the facing
      ctx.translate(22, 26); ctx.rotate(face * D); ctx.fillStyle = 'rgba(30,16,10,0.28)'; ctx.beginPath(); ctx.ellipse(0, L.lie ? 90 : -10, L.lie ? 104 : 130, L.lie ? 200 : 96, 0, 0, Math.PI * 2); ctx.fill();
    });
    ctx.rotate(face * D);
    if (L.lie) { // lying on the back: whole body behind the head, limbs splayed
      for (const sd of [-1, 1]) capsule(ctx, sd * 30, 200, sd * 90, 330, 46, c.legColor ?? c.skin);
      for (const sd of [-1, 1]) { capsule(ctx, sd * 50, 70, sd * 150, -10, 40, sleeve); T.outlined(ctx, (k) => circ(k, sd * 150, -10, 22), c.skin, { line: 6 }); }
      T.outlined(ctx, (k) => T.rrect(k, -66, 40, 132, 210, 50), robe, { shade: (k) => { k.fillStyle = T.shade(robe, -0.22); k.fillRect(30, 40, 50, 220); } });
      T.outlined(ctx, (k) => ell(k, 0, -40, 92, 70), hair);
      T.outlined(ctx, (k) => circ(k, 0, -10, 70), c.skin, { shade: (k) => { k.fillStyle = c.skinShade ?? '#c4c1cd'; k.beginPath(); k.arc(40, 10, 60, 0, Math.PI * 2); k.fill(); } });
      T.drawMiniFace(ctx, 0, -6, 64, expr, { lt, seed });
      return;
    }
    ctx.scale(breathe, breathe);
    standingTop(ctx, c, L, lt, e, step, hair, robe, sleeve);
  };
  // Standing figure seen from above (front = -y): shoes peek out in front, arms hang at the sides with hands forward,
  // the head disc shows hair over the back 2/3, a face crescent with eyes and a nose bump at the front edge.
  function standingTop(ctx, c, L, lt, e, step, hair, robe, sleeve) {
    const shoe = c.shoeColor ?? '#3a2a22';
    for (const sd of [-1, 1]) T.outlined(ctx, (k) => ell(k, sd * 40, -58 - sd * step * 22, 24, 34), shoe, { line: 6 });
    ctx.rotate(step * 4 * D);
    if (c.cape) T.outlined(ctx, (k) => { k.moveTo(-112, 4); k.quadraticCurveTo(-120, 130, 0, 136); k.quadraticCurveTo(120, 130, 112, 4); k.quadraticCurveTo(0, 50, -112, 4); k.closePath(); }, c.cape, { shade: (k) => { k.fillStyle = T.shade(c.cape, -0.22); k.fillRect(-140, 90, 280, 60); } });
    for (const sd of [-1, 1]) iso(ctx, () => { // arms swing opposite to each other on twos
      ctx.translate(sd * 104, 6); ctx.rotate(sd * step * 14 * D);
      capsule(ctx, 0, 0, sd * 6, -52, 42, sleeve);
      T.outlined(ctx, (k) => circ(k, sd * 6, -66, 24), c.skin, { line: 6 });
    });
    const torso = (k) => { k.moveTo(-124, -8); k.quadraticCurveTo(-130, -46, -70, -50); k.lineTo(70, -50); k.quadraticCurveTo(130, -46, 124, -8); k.quadraticCurveTo(128, 54, 0, 60); k.quadraticCurveTo(-128, 54, -124, -8); k.closePath(); };
    T.outlined(ctx, torso, robe, { shade: (k) => { k.fillStyle = T.shade(robe, -0.24); k.fillRect(-140, 18, 280, 60); } });
    const helm = /helm|helmet|dome|brodie|adrian/.test(c.head || '');
    T.outlined(ctx, (k) => circ(k, 0, -98, 13), c.skin, { line: 5 }); // nose bump: the facing cue
    iso(ctx, () => { // head: face crescent at the front edge, hair (or helmet) covers the rest
      ctx.beginPath(); ctx.arc(0, -20, 72, 0, Math.PI * 2); ctx.fillStyle = c.skin; ctx.fill(); ctx.clip();
      ctx.fillStyle = c.skinShade ?? '#c4c1cd'; ctx.beginPath(); ctx.arc(30, 0, 70, 0, Math.PI * 2); ctx.fill();
      if (!helm && c.hair !== 'bald' && c.hair !== 'bald-sides') {
        ctx.fillStyle = hair; ctx.beginPath(); ctx.arc(0, 30, 86, 0, Math.PI * 2); ctx.fill();
        line(ctx, T.shade(hair, -0.25), 5, (k) => { for (const dx of [-30, 0, 30]) { k.moveTo(dx, -40); k.quadraticCurveTo(dx * 1.3, 0, dx * 1.5, 50); } });
        ctx.fillStyle = T.shade(hair, 0.18); ctx.beginPath(); ctx.ellipse(-26, 0, 26, 12, -0.4, 0, Math.PI * 2); ctx.fill();
      }
    });
    ctx.strokeStyle = INK; ctx.lineWidth = T.LINE; ctx.beginPath(); ctx.arc(0, -20, 72, 0, Math.PI * 2); ctx.stroke();
    if (L.face !== false) iso(ctx, () => {
      ctx.translate(0, -66); ctx.scale(0.42, 0.42);
      for (const sd of [-1, 1]) T.BEAN_HEAD.eye(ctx, e.eyes === 'arc' || e.eyes === 'dot' || T.EYE_KINDS[e.eyes] ? e.eyes : 'dot', sd * 58, 0, sd, lt, c);
    });
    topHat(ctx, c);
  }

  // ---- mini face for props, suns, regions --------------------------------------------------------------------------
  // T.drawMiniFace(ctx, x, y, r, mood, opts) or (ctx, x, y, r, mood, lt, seed, opts). r = face radius in px.
  // opts: {eyes, mouth (kind overrides), lt, seed, blink (true/false = blink now; omitted = own ~3 s blink),
  // brows (default true), color (brow ink), look (passed to eye/mouth kinds)}.
  const MINI_BROWS = { angry: [16, -12], sad: [-14, 8], worried: [-16, 6], high: [-10, -14], smug: [-2, -12] };
  T.drawMiniFace = (ctx, x, y, r, mood = 'neutral', a5, a6, a7) => {
    const o = a5 && typeof a5 === 'object' ? a5 : a7 || {};
    const lt = typeof a5 === 'number' ? a5 : o.lt ?? 0, seed = String(a6 ?? o.seed ?? 'mini');
    if (!(r > 0)) return;
    const e = T.EXPR[mood] || T.EXPR.neutral, c = { skin: P.skin, ...(o.look || {}) };
    const ph = (lt + (T.hash(seed) % 300) / 100) % 3;
    let ek = o.eyes ?? e.eyes;
    const blinkNow = typeof o.blink === 'boolean' ? o.blink : ph < 2 / 30; // a boolean is the caller's own blink state
    if (blinkNow && !T.NO_BLINK_EYES.includes(ek)) ek = 'blink';
    iso(ctx, () => {
      ctx.translate(x, y); ctx.scale(r / 150, r / 150); ctx.translate(0, 450);
      for (const sd of [-1, 1]) T.BEAN_HEAD.eye(ctx, ek, sd * 52, -465, sd, lt, c);
      const bk = e.brows;
      if (bk && o.brows !== false) {
        if (T.BROW_KINDS[bk]) for (const sd of [-1, 1]) iso(ctx, () => T.BROW_KINDS[bk](ctx, sd * 52, -515, sd, lt, c));
        else if (MINI_BROWS[bk]) { const S = MINI_BROWS[bk], yy = bk === 'high' ? -541 : -515; line(ctx, o.color ?? INK, 13, (k) => { for (const sd of [-1, 1]) { k.moveTo(sd * 52 - sd * 24, yy + S[0]); k.lineTo(sd * 52 + sd * 26, yy + S[1]); } }); }
      }
      T.BEAN_HEAD.mouth(ctx, o.mouth ?? e.mouth, 0, -397, lt, c, 'front');
      if (e.extra && e.extra.blush) { ctx.fillStyle = 'rgba(240,160,168,0.45)'; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sd * 94, -415, 26, 14, 0, 0, Math.PI * 2); ctx.fill(); } }
    });
  };
})();
