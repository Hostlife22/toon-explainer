// closeup.js — close-up face detail for beans. When a head is large on screen (painted look: auto from ~230 px of head
// height; `detail: true` forces it, false turns it off, 'auto' works in either look) face.js hands eyes, brows, mouth
// and extras to T.CLOSEUP: irises with highlights under shaped lids, tapered brows, nose and cheek shading, wrinkles
// per mood (brow furrow, forehead, crow's feet, nasolabial folds, eye bags), sweat drops, tear streams, veins, blush
// and stubble, all in multi-tone paint. Mouths (teeth, tongue) live in closeup-mouth.js. Moods: T.CLOSEUP_MOODS.
// Face units (face.js): head centre (0, -450), half-width 150; eyes at y -458, brows -508, mouth -382.
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL;
  const EY = -458, BY = -508, HEAD_PX = 230;

  // brow: [inner dy, outer dy, arch] (+ = down), per-side override browL / browR; lid: upper lid cover 0..1 and
  // lidTilt (+ = droops toward the nose: anger); lower: lower-lid raise 0..1; pupil: iris scale; wr: wrinkle list.
  const M = (o) => ({ brow: [0, 0, 0.2], lid: 0.12, lidTilt: 0, lower: 0, pupil: 1, wr: [], ...o });
  T.CLOSEUP_MOODS = {
    neutral: M({}),
    happy: M({ brow: [-4, -2, 0.35], lower: 0.3, wr: ['crow'], blush: 0.5 }),
    content: M({ brow: [-2, 0, 0.3], lower: 0.25, blush: 0.35 }),
    sleepy: M({ lid: 0.62, brow: [2, 4, 0.1], wr: ['bags'] }),
    smug: M({ lid: 0.5, browL: [4, 2, 0.1], browR: [-4, -14, 0.5], wr: ['naso1'] }),
    angry: M({ brow: [16, -10, -0.1], lid: 0.32, lidTilt: 0.5, wr: ['furrow'] }),
    rage: M({ brow: [24, -16, -0.2], lid: 0.38, lidTilt: 0.8, pupil: 0.8, wr: ['furrow', 'naso', 'chin'], flush: 0.35, veins: true }),
    sad: M({ brow: [-14, 6, 0.1], lid: 0.28, lidTilt: -0.4, wr: ['forehead1'] }),
    worried: M({ brow: [-16, 4, 0.15], lid: 0.12, lidTilt: -0.3, wr: ['forehead'] }),
    shock: M({ brow: [-18, -16, 0.4], lid: 0, pupil: 0.72, wr: ['forehead'] }),
    scream: M({ brow: [-12, -10, 0.4], lid: 0, wr: ['forehead', 'naso'] }),
    cry: M({ brow: [-16, 8, 0.1], lid: 0.3, lidTilt: -0.4, lower: 0.2, blush: 0.6, wr: ['furrowUp', 'chin'] }),
    terror: M({ brow: [-22, 2, 0.15], lid: 0, pupil: 0.55, wr: ['forehead', 'furrowUp', 'naso'], pale: 0.25 }),
    disgust: M({ browL: [12, 6, 0], browR: [6, -10, 0.2], lid: 0.42, lidTilt: 0.3, lower: 0.3, wr: ['naso', 'scrunch'] }),
    awe: M({ brow: [-16, -18, 0.5], lid: 0, pupil: 1.3, sparkle: true, blush: 0.3 }),
    crying: M({ brow: [-18, 8, 0.1], lid: 0.32, lidTilt: -0.4, lower: 0.25, blush: 0.7, wr: ['furrowUp', 'chin'] }),
    laughing: M({ brow: [-8, -4, 0.4], lower: 0.5, wr: ['crow', 'naso1'], blush: 0.6 }),
    scheming: M({ brow: [14, -10, -0.05], lid: 0.55, lidTilt: 0.35, lower: 0.2, wr: ['naso1', 'furrow'] }),
    exhausted: M({ brow: [-6, 6, 0.05], lid: 0.62, lidTilt: -0.3, wr: ['bags', 'forehead1'], pale: 0.3 }),
  };
  const BROW_DEFAULT = { angry: [16, -10, -0.1], sad: [-14, 6, 0.1], worried: [-16, 4, 0.15], high: [-18, -16, 0.4], smug: [-2, -12, 0.3] };
  T.closeupMood = (name, e) => T.CLOSEUP_MOODS[name] || M(e && BROW_DEFAULT[e.brows] ? { brow: BROW_DEFAULT[e.brows] } : {});

  // Head height on screen (logical px) in the current frame -> whether to draw the detail level.
  T.closeupWanted = (ctx, detail) => {
    if (detail === false) return false;
    if (detail === true) return true;
    if (detail !== 'auto' && !T.PAINT) return false;
    const m = ctx.getTransform(), sc = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) / (T.DPR || 1);
    return 304 * sc >= HEAD_PX;
  };

  const wrinkleCol = (c) => T.mix(P.ink, c.skin ?? P.skin, 0.42);
  const stroke = (ctx, pts, w, col) => T.inkStroke(ctx, pts, { w, ink: col });
  const radial = (ctx, x, y, rx, ry, col, a) => {
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    g.addColorStop(0, T.mix(col, col, 0) + Math.round(a * 255).toString(16).padStart(2, '0'));
    g.addColorStop(1, T.hex6(col) + '00');
    ctx.save(); ctx.translate(x, y); ctx.scale(rx, ry); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  };

  // ---------- skin: soft cheek / jaw shading, nose, flush ----------
  function skin(ctx, c, s, a) {
    const mood = s.mood, sk = c.skin ?? P.skin, amb = T.PAINT ? T.PAINT.light.ambient : '#5a4a6a';
    const far = a.view === 'front' ? 1 : -1, cx = a.view === 'front' ? 0 : -40;
    radial(ctx, far * 120 + cx, -400, 120, 150, T.mix(sk, amb, 0.55), 0.32); // cheek turning away from the light
    radial(ctx, cx, -318, 120, 40, T.mix(sk, amb, 0.6), 0.28); // under the jaw line
    radial(ctx, cx, -548, 150, 40, T.mix(sk, amb, 0.5), 0.22); // occlusion under the hair line
    if (mood.flush) radial(ctx, cx, -470, 160, 120, '#d23a2a', mood.flush * 0.55);
    if (mood.pale) radial(ctx, cx, -470, 160, 150, '#9fb5a8', mood.pale * 0.6);
    const blush = Math.max(mood.blush || 0, c.blush ? 0.6 : 0);
    if (blush) a.eyes.forEach(([x]) => radial(ctx, x * 1.55 + (a.view === 'front' ? 0 : 6), -404, 38, 22, '#e2656a', blush * 0.55));
    if (a.view !== 'back') { // nose: a soft shadow under a highlight, no ink (the bean has no drawn nose)
      const nx = a.view === 'side' ? 44 : a.view === '3q' ? 14 : 0;
      radial(ctx, nx + 8, -414, 22, 12, T.mix(sk, amb, 0.6), 0.35);
      radial(ctx, nx - 4, -432, 12, 9, '#ffffff', 0.4);
    }
    if (c.beard === 'stubble' || c.stubble) { // a blue-grey jaw shadow with a light peppering of hairs
      const hc = c.hairColor ?? P.hair;
      radial(ctx, cx + 4, -332, 128, 58, T.mix(hc, '#6a7a90', 0.4), 0.34);
      const r = T.rng(T.hash((s.seed || '') + ':stubble'));
      ctx.fillStyle = T.mix(hc, sk, 0.35); ctx.globalAlpha *= 0.55;
      for (let i = 0; i < 70; i++) { const a = r() * Math.PI, d = 0.55 + r() * 0.45; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * 112 * d, -352 + Math.sin(a) * 52 * d, 2.2, 0, Math.PI * 2); ctx.fill(); }
      ctx.globalAlpha /= 0.55;
    }
  }

  // ---------- eyes ----------
  const IRIS = { dot: [16, 24], dotSmall: [13, 18], lid: [16, 24], ringed: [14, 20] };
  // Iris eye: a dark graded oval with two highlights, cut flat by the upper lid (tilted toward the nose by the mood)
  // and pushed up by the cheek (lower), with a heavy tapered lid line. The lids are clips, so the skin stays untouched.
  function irisEye(ctx, kind, x, y, sg, s, c) {
    const mood = s.mood, [rx0, ry0] = IRIS[kind], k = mood.pupil, rx = rx0 * Math.max(0.85, k), ry = ry0 * Math.min(1.15, Math.max(0.85, k));
    const lid = kind === 'lid' ? Math.max(0.55, mood.lid) : mood.lid, tilt = mood.lidTilt * 12 * sg; // + = inner corner lower
    const top = y - ry, ly = top + lid * ry * 2, w = rx + 10, by = y + ry - mood.lower * ry * 0.9;
    if (kind === 'ringed') radial(ctx, x, y + 8, 40, 40, '#46384f', 0.45);
    ctx.save();
    ctx.beginPath(); // visible part: below the lid line, above the lower lid
    ctx.moveTo(x - w, ly + tilt); ctx.quadraticCurveTo(x, ly - 2, x + w, ly - tilt);
    ctx.lineTo(x + w, by + 4); ctx.quadraticCurveTo(x, by - (mood.lower > 0.02 ? 10 : -30), x - w, by + 4); ctx.closePath(); ctx.clip();
    const g = ctx.createRadialGradient(x - rx * 0.3, y - ry * 0.35, 1, x, y, ry * 1.1);
    g.addColorStop(0, '#5b4440'); g.addColorStop(0.55, '#2c1c1a'); g.addColorStop(1, P.ink);
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
    const hy = Math.max(y - ry * 0.4, ly + ry * 0.3); // the big highlight drops under a heavy lid
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(x - rx * 0.3, hy, rx * 0.34, ry * 0.26, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha *= 0.85; ctx.beginPath(); ctx.arc(x + rx * 0.35, y + ry * 0.4, rx * 0.15, 0, Math.PI * 2); ctx.fill();
    if (mood.sparkle) { ctx.beginPath(); ctx.arc(x + rx * 0.12, y - ry * 0.02, rx * 0.13, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    if (lid > 0.04) stroke(ctx, [[x - w, ly + tilt + 2], [x - w * 0.35, ly + tilt * 0.3], [x + w * 0.35, ly - tilt * 0.3], [x + w, ly - tilt + 2]], 10, P.ink);
    if (mood.lower > 0.02) stroke(ctx, [[x - rx * 1.1, by + 7], [x, by - 3], [x + rx * 1.1, by + 7]], 4.5, wrinkleCol(c));
  }
  function wideEye(ctx, x, y, sg, s, c) {
    const mood = s.mood, rx = 27, ry = 31;
    T.outlined(ctx, (k) => k.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2), '#fbfaf6', { line: 6 });
    radial(ctx, x, y - ry * 0.6, rx, ry * 0.5, '#8a8098', 0.35); // the brow ridge shading the white
    const pr = 9 * (mood.pupil < 0.8 ? 0.85 : 1.1), px = x + sg * 3 + Math.sin(s.lt * 23) * 1.6, py = y + 1;
    const g = ctx.createRadialGradient(px - 2, py - 3, 0.5, px, py, pr * 1.1);
    g.addColorStop(0, '#5a4038'); g.addColorStop(1, P.ink);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(px - pr * 0.35, py - pr * 0.4, pr * 0.32, 0, Math.PI * 2); ctx.fill();
    stroke(ctx, [[x - rx - 2, y - 6], [x - rx * 0.5, y - ry - 2], [x + rx * 0.5, y - ry - 2], [x + rx + 2, y - 6]], 8, P.ink);
  }
  function closedEye(ctx, kind, x, y, sg, c) {
    const up = kind === 'arc', w = 20;
    const pts = up ? [[x - w, y + 8], [x - w * 0.4, y - 10], [x + w * 0.4, y - 10], [x + w, y + 8]] : [[x - w, y - 4], [x - w * 0.4, y + 10], [x + w * 0.4, y + 10], [x + w, y - 4]];
    stroke(ctx, pts, 11, P.ink);
    const e = up ? pts[3] : pts[0]; // a lash flick at the outer corner
    stroke(ctx, [[x + sg * w * 0.9, e[1]], [x + sg * (w + 9), e[1] - 7]], 5, P.ink);
  }

  // Detail eye; false = not handled here (face.js draws the classic kind).
  function eye(ctx, kind, x, y, sg, s, c) {
    if (IRIS[kind]) { irisEye(ctx, kind, x, y, sg, s, c); return true; }
    if (kind === 'wide') { wideEye(ctx, x, y, sg, s, c); return true; }
    if (kind === 'arc' || kind === 'arcDown' || kind === 'blink') { closedEye(ctx, kind === 'blink' ? 'arcDown' : kind, x, y, sg, c); return true; }
    return false;
  }

  // ---------- brows ----------
  function brows(ctx, eyes, s, c) {
    const mood = s.mood, col = T.mix(c.hairColor ?? P.hair, P.ink, 0.45);
    eyes.forEach(([x, sg]) => {
      const b = (sg < 0 ? mood.browL : mood.browR) || mood.brow, [bi, bo, arch] = b;
      const ix = x - sg * 24, ox = x + sg * 30, iy = BY + bi, oy = BY + 6 + bo, mx = (ix + ox) / 2, my = (iy + oy) / 2 - arch * 22;
      T.outlined(ctx, (k) => {
        k.moveTo(ix, iy - 9); k.quadraticCurveTo(mx, my - 11, ox, oy - 3);
        k.quadraticCurveTo(ox + sg * 4, oy + 1, ox - sg * 2, oy + 3);
        k.quadraticCurveTo(mx, my + 5, ix, iy + 8); k.closePath();
      }, col, { line: 4, paint: false });
    });
    return true;
  }

  // ---------- wrinkles, sweat, tears, veins ----------
  const WR = {
    furrow: (ctx, a, col) => { [-1, 1].forEach((d) => stroke(ctx, [[d * 9, -528], [d * 6, -508], [d * 8, -490]], 5, col)); },
    furrowUp: (ctx, a, col) => { [-1, 1].forEach((d) => stroke(ctx, [[d * 26, -540], [d * 10, -526], [d * 4, -510]], 4.5, col)); },
    forehead: (ctx, a, col) => { for (let i = 0; i < 3; i++) stroke(ctx, [[-50, -548 - i * 13], [-15, -553 - i * 13], [20, -549 - i * 13], [50, -553 - i * 13]], 4.2, col); },
    forehead1: (ctx, a, col) => stroke(ctx, [[-40, -552], [0, -558], [40, -552]], 4, col),
    crow: (ctx, a, col) => a.eyes.forEach(([x, sg]) => [-1, 0, 1].forEach((i) => stroke(ctx, [[x + sg * 30, -460 + i * 9], [x + sg * 44, -462 + i * 15]], 3.6, col))),
    naso: (ctx, a, col) => [-1, 1].forEach((d) => stroke(ctx, [[a.mouth[0] + d * 30, -430], [a.mouth[0] + d * 46, -400], [a.mouth[0] + d * 48, -372]], 5, col)),
    naso1: (ctx, a, col) => stroke(ctx, [[a.mouth[0] + 34, -428], [a.mouth[0] + 50, -398], [a.mouth[0] + 50, -376]], 4.6, col),
    bags: (ctx, a, col) => a.eyes.forEach(([x]) => { stroke(ctx, [[x - 18, -428], [x, -422], [x + 18, -428]], 4, col); stroke(ctx, [[x - 12, -418], [x, -414], [x + 12, -418]], 3, col); }),
    chin: (ctx, a, col) => stroke(ctx, [[a.mouth[0] - 16, -330], [a.mouth[0], -326], [a.mouth[0] + 16, -330]], 4, col),
    scrunch: (ctx, a, col) => [-1, 1].forEach((d) => stroke(ctx, [[a.mouth[0] + d * 6, -446], [a.mouth[0] + d * 16, -440]], 4, col)),
  };
  function drop(ctx, x, y, r) { // a sweat bead with gradient, outline and a highlight
    const g = ctx.createLinearGradient(x, y - r * 2, x, y + r);
    g.addColorStop(0, '#d8f2ff'); g.addColorStop(1, '#6fbfe6');
    T.outlined(ctx, (k) => { k.moveTo(x, y - r * 2); k.quadraticCurveTo(x + r * 1.1, y - r * 0.2, x, y + r); k.quadraticCurveTo(x - r * 1.1, y - r * 0.2, x, y - r * 2); }, g, { line: 4, paint: false });
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.ellipse(x - r * 0.3, y - r * 0.3, r * 0.22, r * 0.4, 0, 0, Math.PI * 2); ctx.fill();
  }
  function extras(ctx, c, s, a) {
    const mood = s.mood, e = a.e, col = wrinkleCol(c);
    (mood.wr || []).forEach((w) => WR[w] && WR[w](ctx, a, col));
    if (e.sweat || mood === T.CLOSEUP_MOODS.terror || mood === T.CLOSEUP_MOODS.exhausted) {
      [[-1, 0], [1, 0.45]].forEach(([d, off]) => {
        const ph = (s.lt * 0.7 + off) % 1;
        ctx.save(); ctx.globalAlpha *= 1 - ph * 0.5; drop(ctx, d * 112, -545 + ph * 90, 11); ctx.restore();
      });
    }
    if (e.tears || mood.tears) {
      a.eyes.forEach(([x, sg]) => {
        const flow = (s.lt * 2.2) % 1;
        ctx.save(); ctx.globalAlpha *= 0.85;
        const g = ctx.createLinearGradient(0, -440, 0, -310);
        g.addColorStop(0, 'rgba(150,215,250,0.95)'); g.addColorStop(1, 'rgba(110,190,240,0.55)');
        ctx.fillStyle = g; ctx.beginPath();
        ctx.moveTo(x + sg * 8, -438); ctx.quadraticCurveTo(x + sg * 26, -400, x + sg * 18, -330); ctx.lineTo(x + sg * 6, -330); ctx.quadraticCurveTo(x + sg * 12, -400, x - sg * 4, -438); ctx.closePath(); ctx.fill();
        ctx.restore();
        drop(ctx, x + sg * 14, -340 + flow * 30, 8);
      });
    }
    if (e.vein || mood.veins) { // throbbing cross mark at the temple and a raised vein on the forehead
      const p = 1 + Math.max(0, Math.sin(s.lt * 10)) * 0.15, tx = a.fx > 0 ? -80 : 80;
      ctx.save(); ctx.translate(tx, -560); ctx.scale(p, p); ctx.strokeStyle = '#c4202a'; ctx.lineWidth = 8; ctx.lineCap = 'round';
      for (let i = 0; i < 4; i++) { ctx.save(); ctx.rotate(i * Math.PI / 2); ctx.beginPath(); ctx.moveTo(7, -20); ctx.quadraticCurveTo(7, -7, 20, -7); ctx.stroke(); ctx.restore(); }
      ctx.restore();
      stroke(ctx, [[30, -580], [44, -560], [36, -540], [46, -522]], 6, T.mix(c.skin ?? P.skin, '#7a3040', 0.45));
    }
  }

  T.CLOSEUP = { skin, eye, brows, extras, HEAD_PX };
})();
