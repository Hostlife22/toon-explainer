// face.js — bean head v2: egg-shaped head (wide cheeks), 3/4 · front · side · back views, big cool back-shadow,
// expression sheet (eyes / brows / mouth / extras) and a 3-shape talking mouth. Measured on the reference 0:00–38:29.
// Units: head centre (0,-450), half-width 150. Called from rig.js as T.BEAN_HEAD.draw(ctx, look, s).
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL;
  const HW = 150, TOP = -604, BOT = -300, CY = -450;
  const VIEW_SHIFT = { front: 0, '3q': 0.24, side: 0.42, back: 0 };
  const SHADOW = '#c4c1cd';

  // Head outline, optionally inflated around its centre (s > 1) — used to give hair volume past the skull.
  const headPathS = (k, s = 1) => {
    const X = (x) => x * s, Y = (y) => CY + (y - CY) * s;
    k.moveTo(X(0), Y(TOP));
    k.bezierCurveTo(X(HW * 0.95), Y(TOP), X(HW * 1.06), Y(CY - 30), X(HW), Y(CY + 40));
    k.bezierCurveTo(X(HW * 0.95), Y(BOT - 12), X(HW * 0.45), Y(BOT), X(0), Y(BOT));
    k.bezierCurveTo(X(-HW * 0.45), Y(BOT), X(-HW * 0.95), Y(BOT - 12), X(-HW), Y(CY + 40));
    k.bezierCurveTo(X(-HW * 1.06), Y(CY - 30), X(-HW * 0.95), Y(TOP), X(0), Y(TOP));
    k.closePath();
  };
  const headPath = (k) => headPathS(k, 1);

  // Expression sheet: eyes, brows, rest mouth, talking mouth set, extras.
  const EXPR = {
    neutral: { eyes: 'dot', mouth: 'closed', talk: ['closed', 'mid', 'wide'] },
    happy: { eyes: 'arc', mouth: 'smileOpen', talk: ['smile', 'mid', 'wide'] },
    content: { eyes: 'arc', mouth: 'smile', talk: ['smile', 'mid', 'wide'] },
    sleepy: { eyes: 'lid', mouth: 'small', talk: ['small', 'mid'] },
    smug: { eyes: 'lid', brows: 'smug', mouth: 'smirk', talk: ['smirk', 'mid', 'wide'] },
    angry: { eyes: 'dotSmall', brows: 'angry', mouth: 'grimace', talk: ['grimace', 'wide', 'mid'] },
    rage: { eyes: 'dotSmall', brows: 'angry', mouth: 'wide', talk: ['wide', 'grimace'], vein: true },
    sad: { eyes: 'dot', brows: 'sad', mouth: 'frown', talk: ['frown', 'mid'] },
    worried: { eyes: 'dot', brows: 'worried', mouth: 'wobble', talk: ['wobble', 'mid'], sweat: true },
    shock: { eyes: 'wide', brows: 'high', mouth: 'o', talk: ['o', 'wide'] },
    scream: { eyes: 'squint', brows: 'high', mouth: 'scream', talk: ['scream', 'wide'] },
    squint: { eyes: 'squint', mouth: 'grimace', talk: ['grimace', 'wide'] },
    cry: { eyes: 'arcDown', brows: 'sad', mouth: 'wobbleOpen', talk: ['wobbleOpen', 'wide'], tears: true },
    dead: { eyes: 'x', mouth: 'o', talk: ['o'] },
    mad: { eyes: 'spiral', mouth: 'grin', talk: ['grin', 'wide'] }, // madness: rotating spirals + wobbly grin (Horror 12:20)
    evil: { eyes: 'slit', brows: 'angry', mouth: 'smirk', talk: ['smirk', 'wide'] }, // glowing red slits
    sick: { eyes: 'ringed', brows: 'worried', mouth: 'frown', talk: ['frown', 'mid'], blood: true },
  };
  T.BEAN_EXPR = Object.keys(EXPR);

  function eye(ctx, kind, x, y, s, lt) {
    ctx.fillStyle = P.ink; ctx.strokeStyle = P.ink; ctx.lineWidth = 10; ctx.lineCap = 'round';
    switch (kind) {
      case 'blink': ctx.beginPath(); ctx.moveTo(x - 16, y + 4); ctx.quadraticCurveTo(x, y + 12, x + 16, y + 4); ctx.stroke(); return;
      case 'arc': ctx.beginPath(); ctx.moveTo(x - 18, y + 8); ctx.quadraticCurveTo(x, y - 20, x + 18, y + 8); ctx.stroke(); return;
      case 'arcDown': ctx.beginPath(); ctx.moveTo(x - 18, y - 4); ctx.quadraticCurveTo(x, y + 16, x + 18, y - 4); ctx.stroke(); return;
      case 'lid':
        ctx.beginPath(); ctx.ellipse(x, y + 6, 13, 11, 0, 0, Math.PI); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x - 20, y + 4); ctx.lineTo(x + 20, y + 4); ctx.stroke(); return;
      case 'wide':
        T.outlined(ctx, (k) => k.ellipse(x, y, 28, 32, 0, 0, Math.PI * 2), '#fff', { line: 7 });
        ctx.fillStyle = P.ink; ctx.beginPath(); ctx.arc(x + s * 3 + Math.sin(lt * 23) * 2, y, 8, 0, Math.PI * 2); ctx.fill(); return;
      case 'squint': ctx.beginPath(); ctx.moveTo(x - s * 20, y - 18); ctx.lineTo(x + s * 14, y); ctx.lineTo(x - s * 20, y + 16); ctx.stroke(); return;
      case 'x': ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(x - 15, y - 15); ctx.lineTo(x + 15, y + 15); ctx.moveTo(x + 15, y - 15); ctx.lineTo(x - 15, y + 15); ctx.stroke(); return;
      case 'dotSmall': ctx.beginPath(); ctx.ellipse(x, y + 2, 11, 15, 0, 0, Math.PI * 2); ctx.fill(); return;
      case 'spiral': {
        ctx.lineWidth = 6; ctx.beginPath();
        for (let i = 0; i <= 48; i++) { const a = (i / 48) * Math.PI * 6 + lt * Math.PI * 2 * s, r = 2 + (i / 48) * 24; ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * r, y + Math.sin(a) * r); }
        ctx.stroke(); return;
      }
      case 'slit':
        ctx.save(); ctx.shadowColor = '#ff2a2a'; ctx.shadowBlur = (24) * T.DPR; ctx.fillStyle = '#ff2a2a';
        ctx.beginPath(); ctx.ellipse(x, y, 24, 7, s * -0.3, 0, Math.PI * 2); ctx.fill(); ctx.restore(); return;
      case 'ringed':
        ctx.fillStyle = 'rgba(70,60,80,0.35)'; ctx.beginPath(); ctx.ellipse(x, y + 6, 28, 32, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = P.ink; ctx.beginPath(); ctx.ellipse(x, y, 11, 16, 0, 0, Math.PI * 2); ctx.fill(); return;
      case 'flag': // countryball eyes: white ovals, no pupils
        T.outlined(ctx, (k) => k.ellipse(x, y, 24, 30, 0, 0, Math.PI * 2), '#ffffff', { line: 7 }); return;
      default: ctx.beginPath(); ctx.ellipse(x, y, 13, 20, 0, 0, Math.PI * 2); ctx.fill();
    }
  }

  function brows(ctx, kind, xs, y) {
    if (!kind) return;
    const S = { angry: [16, -12], sad: [-14, 8], worried: [-16, 6], high: [-10, -14], smug: [-2, -12] }[kind];
    if (!S) return;
    const yy = kind === 'high' ? y - 26 : y;
    ctx.strokeStyle = P.ink; ctx.lineWidth = 13; ctx.lineCap = 'round';
    xs.forEach(([x, s]) => { ctx.beginPath(); ctx.moveTo(x - s * 24, yy + S[0]); ctx.lineTo(x + s * 26, yy + S[1]); ctx.stroke(); });
  }

  const MOUTH_DARK = '#4a1715', TONGUE = '#e8828a';
  function dMouth(ctx, mx, my, w, h, teeth = true) {
    T.outlined(ctx, (k) => { k.moveTo(mx - w, my - h * 0.25); k.quadraticCurveTo(mx, my - h * 0.42, mx + w, my - h * 0.25); k.quadraticCurveTo(mx + w * 0.85, my + h, mx, my + h); k.quadraticCurveTo(mx - w * 0.85, my + h, mx - w, my - h * 0.25); k.closePath(); }, MOUTH_DARK, {
      line: 8,
      shade: (k) => {
        k.fillStyle = TONGUE; k.beginPath(); k.ellipse(mx + w * 0.1, my + h * 0.95, w * 0.62, h * 0.42, 0, 0, Math.PI * 2); k.fill();
        if (teeth) { k.fillStyle = '#fff'; k.fillRect(mx - w, my - h * 0.5, w * 2, h * 0.32); }
      },
    });
  }
  function mouth(ctx, kind, mx, my) {
    ctx.strokeStyle = P.ink; ctx.lineWidth = 9; ctx.lineCap = 'round';
    const line = (fn) => { ctx.beginPath(); fn(); ctx.stroke(); };
    switch (kind) {
      case 'mid': return dMouth(ctx, mx, my, 26, 26, false);
      case 'wide': return dMouth(ctx, mx, my, 40, 46);
      case 'scream': return dMouth(ctx, mx, my + 6, 56, 74);
      case 'smileOpen': return dMouth(ctx, mx, my - 4, 42, 34);
      case 'o': return T.outlined(ctx, (k) => k.ellipse(mx, my + 6, 18, 24, 0, 0, Math.PI * 2), MOUTH_DARK, { line: 8 });
      case 'grimace':
        T.outlined(ctx, (k) => T.rrect(k, mx - 46, my - 14, 92, 30, 9), '#fff', { line: 8 });
        ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(mx - 44, my + 1); ctx.lineTo(mx + 44, my + 1);
        for (let x = -30; x <= 30; x += 15) { ctx.moveTo(mx + x, my - 13); ctx.lineTo(mx + x, my + 15); }
        ctx.stroke(); return;
      case 'wobbleOpen':
        T.outlined(ctx, (k) => { k.moveTo(mx - 34, my + 10); for (let i = 0; i <= 6; i++) k.lineTo(mx - 34 + i * 11.3, my - 6 + (i % 2) * 8); k.quadraticCurveTo(mx, my + 40, mx - 34, my + 10); k.closePath(); }, MOUTH_DARK, { line: 7 });
        return;
      case 'wobble': return line(() => { ctx.moveTo(mx - 28, my + 6); for (let i = 1; i <= 6; i++) ctx.lineTo(mx - 28 + i * 9.3, my + 6 - (i % 2) * 9); });
      case 'smile': return line(() => { ctx.moveTo(mx - 32, my - 6); ctx.quadraticCurveTo(mx, my + 26, mx + 32, my - 6); });
      case 'frown': return line(() => { ctx.moveTo(mx - 26, my + 12); ctx.quadraticCurveTo(mx, my - 12, mx + 26, my + 12); });
      case 'smirk': return line(() => { ctx.moveTo(mx - 24, my + 4); ctx.quadraticCurveTo(mx + 10, my + 14, mx + 34, my - 10); });
      case 'small': return line(() => { ctx.moveTo(mx - 12, my); ctx.lineTo(mx + 12, my); });
      case 'grin':
        T.outlined(ctx, (k) => { k.moveTo(mx - 56, my - 14); for (let i = 1; i <= 8; i++) k.lineTo(mx - 56 + i * 14, my - 14 + (i % 2 ? -6 : 4)); k.quadraticCurveTo(mx, my + 56, mx - 56, my - 14); k.closePath(); }, '#fff', { line: 7 });
        return;
      default: return line(() => { ctx.moveTo(mx - 22, my); ctx.quadraticCurveTo(mx, my + 8, mx + 22, my); });
    }
  }

  function extras(ctx, e, fx, lt) {
    if (e.vein) {
      ctx.save(); ctx.translate(fx + 70, -555); const p = 1 + Math.max(0, Math.sin(lt * 10)) * 0.15; ctx.scale(p, p);
      ctx.strokeStyle = P.red; ctx.lineWidth = 9; ctx.lineCap = 'round';
      for (let i = 0; i < 4; i++) { ctx.save(); ctx.rotate(i * Math.PI / 2); ctx.beginPath(); ctx.moveTo(8, -24); ctx.quadraticCurveTo(8, -8, 24, -8); ctx.stroke(); ctx.restore(); }
      ctx.restore();
    }
    if (e.tears) {
      ctx.fillStyle = 'rgba(110,190,240,0.9)';
      for (const s of [-1, 1]) {
        const x = fx + s * 40 - 8, flow = (lt * 3) % 1;
        ctx.beginPath(); ctx.moveTo(x, -445); ctx.lineTo(x + 16, -445); ctx.lineTo(x + 20 + flow * 4, -300); ctx.lineTo(x - 4, -300); ctx.closePath(); ctx.fill();
      }
    }
    if (e.blood) { // trickle from the mouth corner
      ctx.fillStyle = '#a01020'; ctx.beginPath(); ctx.moveTo(fx + 30, -380); ctx.quadraticCurveTo(fx + 40, -350, fx + 34, -326); ctx.quadraticCurveTo(fx + 24, -350, fx + 22, -378); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.arc(fx + 34, -326, 8, 0, Math.PI * 2); ctx.fill();
    }
    if (e.sweat) {
      const ph = (lt * 0.8) % 1;
      ctx.save(); ctx.globalAlpha *= 1 - ph * 0.6; ctx.translate(-HW * 0.9, -560 + ph * 60);
      T.outlined(ctx, (k) => { k.moveTo(0, -26); k.quadraticCurveTo(20, 0, 0, 14); k.quadraticCurveTo(-20, 0, 0, -26); }, '#7fd0f0', { line: 6 });
      ctx.restore();
    }
  }

  // ---------- hair / beard / headwear (view-aware: masses shift toward the back of the head) ----------
  function curls(ctx, col, seed, from, to, n, rad, inset, back) {
    const r = T.rng(T.hash(seed + from));
    const list = [];
    for (let i = 0; i < n; i++) {
      const a = (from + ((to - from) * i) / (n - 1)) * T.DEG;
      const rr = rad + r() * 16;
      list.push([Math.cos(a) * (HW + inset) + back, CY - 20 + Math.sin(a) * (150 + inset), rr]);
    }
    ctx.fillStyle = P.ink; list.forEach(([x, y, rr]) => { ctx.beginPath(); ctx.arc(x, y, rr + T.LINE, 0, Math.PI * 2); ctx.fill(); });
    ctx.fillStyle = col; list.forEach(([x, y, rr]) => { ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.fill(); });
    ctx.fillStyle = T.shade(col, 0.16); list.forEach(([x, y, rr]) => { ctx.beginPath(); ctx.arc(x - rr * 0.3, y - rr * 0.32, rr * 0.36, 0, Math.PI * 2); ctx.fill(); });
  }

  function hairBack(ctx, c, seed, sh) {
    const col = c.hairColor ?? P.hair, back = -sh * HW * 0.5;
    if (c.hair === 'long') T.outlined(ctx, (k) => { k.moveTo(-160 + back, -520); k.quadraticCurveTo(-225 + back, -380, -185 + back, -270); k.lineTo(sh > 0 ? -20 : 185, -270); k.quadraticCurveTo(sh > 0 ? 0 : 225, -380, 160, -520); k.closePath(); }, col);
    if (c.hair === 'curly') curls(ctx, col, seed, 150, 390, 13, 42, 6, back);
    if (c.hair === 'queue') { // long braid hanging down the back (Qing)
      ctx.strokeStyle = P.ink; ctx.lineWidth = 34; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-130 + back, -480); ctx.quadraticCurveTo(-200 + back, -330, -170 + back, -170); ctx.stroke();
      ctx.strokeStyle = col; ctx.lineWidth = 22; ctx.stroke();
    }
  }

  function hairFront(ctx, c, seed, sh, view) {
    const col = c.hairColor ?? P.hair, back = -sh * HW * 0.55;
    if (view === 'back' && c.hair && c.hair !== 'bald') { T.outlined(ctx, headPath, col, { shade: (k) => { k.fillStyle = T.shade(col, 0.14); k.beginPath(); k.ellipse(-40, -560, 70, 30, -0.3, 0, Math.PI * 2); k.fill(); } }); return; }
    if (c.hair === 'curly') return curls(ctx, col, seed, 188 - sh * 40, 345 - sh * 70, 9, 46, -10, back * 0.6);
    if (c.hair === 'short' || c.hair === 'long' || c.hair === 'bun') {
      // Hair = top of the head + the BACK side down to ear level; zig-zag fringe stops at the face side (reference 3/4 heads).
      const front = HW * 1.3, fringeY = -528, nape = view === 'front' ? -430 : c.hair === 'long' ? -330 : -392;
      const poly = (k) => {
        k.moveTo(front, TOP - 80); k.lineTo(front, view === 'front' ? -440 : fringeY + 20);
        const f0 = view === 'front' ? HW * 0.95 : HW * (0.75 + sh * 0.3), f1 = view === 'front' ? -HW * 0.95 : -HW * (0.25 - sh * 0.5);
        if (view === 'front') k.lineTo(f0, -450);
        for (let i = 0; i <= 6; i++) k.lineTo(T.lerp(f0, f1, i / 6), fringeY + (i % 2 ? 22 : -4));
        if (view === 'front') { k.lineTo(-HW * 0.95, -450); k.lineTo(-front, -440); }
        else { k.quadraticCurveTo(-HW * 0.55, -470, -HW * 0.72, nape); k.lineTo(-front, nape + 10); }
        k.lineTo(-front, TOP - 80); k.closePath();
      };
      const inflate = 1.07;
      ctx.save(); ctx.beginPath(); headPathS(ctx, inflate); ctx.clip();
      T.outlined(ctx, poly, col, { shade: (k) => { k.fillStyle = T.shade(col, 0.15); k.beginPath(); k.ellipse(sh * 40, -585, 85, 20, -0.12, 0, Math.PI * 2); k.fill(); k.fillStyle = T.shade(col, -0.2); k.beginPath(); k.ellipse(-HW * 1.05, -470, 60, 160, 0, 0, Math.PI * 2); k.fill(); } });
      ctx.restore();
      ctx.save(); ctx.beginPath(); poly(ctx); ctx.clip();
      ctx.beginPath(); headPathS(ctx, inflate); ctx.lineWidth = T.LINE; ctx.strokeStyle = P.ink; ctx.stroke();
      ctx.restore();
      if (c.hair === 'bun') T.outlined(ctx, (k) => k.arc(back * 0.8 - 30, -630, 50, 0, Math.PI * 2), col);
    }
    if (c.hair === 'queue') T.outlined(ctx, (k) => { k.moveTo(-HW * 1.02, -400); k.quadraticCurveTo(-HW * 1.1, -560, -HW * 0.2, -600); k.quadraticCurveTo(-HW * 0.6, -520, -HW * 0.75, -400); k.closePath(); }, col);
    if (c.hair === 'bald-sides') T.outlined(ctx, (k) => k.ellipse(-150 + back * 0.3, -440, 34, 64, 0, 0, Math.PI * 2), col);
  }

  function beard(ctx, c, fx, view) {
    if (view === 'back') return;
    const col = c.beardColor ?? c.hairColor ?? P.hair, o = fx * 0.55;
    if (c.beard === 'full') {
      // starts below the eye line (-458) so the eyes stay readable; mouth is drawn on top of it
      T.outlined(ctx, (k) => { k.moveTo(-148 + o * 0.2, -420); k.quadraticCurveTo(-150 + o, -310, -60 + o, -272); k.quadraticCurveTo(o, -236, 60 + o, -272); k.quadraticCurveTo(150 + o, -310, 148, -420); k.quadraticCurveTo(110 + o, -395, 60 + o, -404); k.quadraticCurveTo(o, -420, -60 + o, -404); k.quadraticCurveTo(-110 + o, -395, -148 + o * 0.2, -420); }, col,
        { shade: (k) => { k.fillStyle = T.shade(col, -0.2); k.beginPath(); k.ellipse(-120, -330, 80, 120, 0, 0, Math.PI * 2); k.fill(); } });
    } else if (c.beard === 'goatee') T.outlined(ctx, (k) => k.ellipse(fx, -314, 40, 34, 0, 0, Math.PI * 2), col);
    else if (c.beard === 'stubble') {
      const r = T.rng(77); ctx.fillStyle = T.shade(c.skin ?? P.skin, -0.38);
      for (let i = 0; i < 40; i++) { const a = Math.PI * (0.15 + r() * 0.7); ctx.fillRect(fx + Math.cos(a) * 110 * r(), -450 + Math.sin(a) * 130, 4, 4); }
    }
    if (c.beard === 'long') {
      const g = c.beardColor ?? '#d9d3c7';
      T.outlined(ctx, (k) => { k.moveTo(-140 + o * 0.2, -420); k.quadraticCurveTo(-150 + o, -260, o * 1.2, -150); k.quadraticCurveTo(150 + o, -260, 140, -420); k.quadraticCurveTo(o, -390, -140 + o * 0.2, -420); k.closePath(); }, g,
        { shade: (k) => { k.strokeStyle = T.shade(g, -0.2); k.lineWidth = 5; for (let i = -2; i <= 2; i++) { k.beginPath(); k.moveTo(o + i * 30, -380); k.quadraticCurveTo(o + i * 26, -280, o + i * 14, -190); k.stroke(); } } });
    }
    if (c.beard === 'walrus') T.outlined(ctx, (k) => { k.moveTo(fx - 120, -350); k.quadraticCurveTo(fx - 90, -440, fx, -410); k.quadraticCurveTo(fx + 90, -440, fx + 120, -350); k.quadraticCurveTo(fx + 60, -390, fx, -380); k.quadraticCurveTo(fx - 60, -390, fx - 120, -350); k.closePath(); }, c.mustacheColor ?? col);
    if (c.mustache) T.outlined(ctx, (k) => { k.moveTo(fx - 70, -398); k.quadraticCurveTo(fx - 10, -448, fx, -414); k.quadraticCurveTo(fx + 10, -448, fx + 70, -398); k.quadraticCurveTo(fx, -400, fx - 70, -398); }, c.mustacheColor ?? col);
  }

  // Headwear lives in costume.js (T.HEADWEAR); unknown kinds draw nothing.
  function headwear(ctx, c, lt, sh, view) {
    const fn = c.head && T.HEADWEAR && T.HEADWEAR[c.head];
    if (fn) fn(ctx, c, lt, sh, view);
  }

  // s: { view, expr, mouthKind (talk override), blink, gazeX, lt, seed }
  function draw(ctx, c, s) {
    const view = s.view, sh = VIEW_SHIFT[view] ?? 0.24, fx = sh * HW + (view === 'front' ? s.gazeX : s.gazeX * 0.4);
    const e = EXPR[s.expr] || EXPR.neutral;
    if (c.headShape && T.drawAltHead && T.drawAltHead(ctx, c, s)) { headwear(ctx, c, s.lt, sh, view); return; }
    hairBack(ctx, c, s.seed, sh);
    if (c.flag && T.drawFlagHead) T.drawFlagHead(ctx, c, headPath, sh);
    else T.outlined(ctx, headPath, c.skin, {
      shade: (k) => {
        k.fillStyle = c.skinShade ?? SHADOW;
        if (view === 'front') { k.beginPath(); k.ellipse(HW * 1.15, CY, HW * 0.55, 190, 0, 0, Math.PI * 2); k.fill(); }
        else { k.beginPath(); k.ellipse(-HW * (1.05 - sh * 0.4), CY + 10, HW * (0.7 + sh * 0.3), 200, 0, 0, Math.PI * 2); k.fill(); }
      },
    });
    beard(ctx, c, fx, view);
    if (c.tint && T.drawFaceTint) T.drawFaceTint(ctx, c, headPath, s.lt);
    if (c.mask === 'gas' && T.drawGasMask) T.drawGasMask(ctx, c, fx, view);
    else if (view !== 'back') {
      ctx.save(); ctx.translate(fx, 0);
      const sp = view === 'side' ? 0 : view === '3q' ? 40 : 52;
      const eyes = view === 'side' ? [[18, 1]] : [[-sp, -1], [sp, 1]];
      const baseEyes = c.flag && c.flagEyes !== false && e.eyes === 'dot' ? 'flag' : e.eyes;
      const ek = s.blink && !['wide', 'squint', 'x', 'arc', 'arcDown', 'spiral', 'slit'].includes(baseEyes) ? 'blink' : baseEyes;
      eyes.forEach(([x, sg]) => eye(ctx, ek, x, -458, sg, s.lt));
      brows(ctx, e.brows, eyes.map(([x, sg]) => [x, sg]), -508);
      if (!(c.flag && c.flagMouth === false)) mouth(ctx, s.mouthKind || e.mouth, view === 'side' ? 26 : view === '3q' ? 10 : 0, -382);
      if (c.blush) { ctx.fillStyle = 'rgba(230,120,120,0.35)'; eyes.forEach(([x]) => { ctx.beginPath(); ctx.ellipse(x * 1.8, -410, 26, 14, 0, 0, Math.PI * 2); ctx.fill(); }); }
      ctx.restore();
      extras(ctx, e, fx, s.lt);
    }
    hairFront(ctx, c, s.seed, sh, view);
    headwear(ctx, c, s.lt, sh, view);
  }

  // Talking mouth: changes every ~3 frames (10 Hz), never the same shape twice in a row (reference: 2–3 shapes on 2s/3s).
  function talkMouth(expr, lt, seed) {
    const set = (EXPR[expr] || EXPR.neutral).talk;
    const step = Math.floor(lt * 10);
    const r = T.rng(T.hash(seed + 'tm' + step))();
    const prev = Math.floor(T.rng(T.hash(seed + 'tm' + (step - 1)))() * set.length);
    let i = Math.floor(r * set.length);
    if (i === prev) i = (i + 1) % set.length;
    return set[i];
  }

  T.BEAN_HEAD = { draw, talkMouth, headPath, HW, CY };
})();
