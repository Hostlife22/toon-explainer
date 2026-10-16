// wardrobe.js — wardrobe: 29 headwear kinds (T.HEADWEAR), 20 outfits (T.OUTFITS + T.OUTFIT_DEFAULTS, back pieces
// through T.BEAN_UNDER), 7 hair kinds (T.HAIR_KINDS) and the bushy beard (T.BEARD_KINDS).
// Head units: centre (0,-450), half-width 150, crown top -604, chin -300; `sh` = 0 front/back, 0.24 3q, 0.42 side and
// the face side is +x. Body units: shoulders y -326, hem y -70, feet at 0. Colours: headColor / headColor2 / headColor3.
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL;
  const HW = 150, D = T.DEG;
  const shade = (c, k = -0.22) => T.shade(c, k);
  const circ = (k, x, y, r) => { k.moveTo(x + r, y); k.arc(x, y, r, 0, Math.PI * 2); };
  const ell = (k, x, y, rx, ry, rot = 0) => { k.moveTo(x + rx * Math.cos(rot), y + rx * Math.sin(rot)); k.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); };
  const iso = (ctx, fn) => { ctx.save(); try { fn(); } finally { ctx.restore(); } };
  const headPath = (k) => T.BEAN_HEAD.headPath(k);
  // Ring of circles drawn as one mass: all ink discs first, then all fills (no inner outlines), then highlights.
  const lumps = (ctx, list, col, hi = true) => {
    ctx.fillStyle = P.ink; list.forEach(([x, y, r]) => { ctx.beginPath(); circ(ctx, x, y, r + T.LINE / 2 + 1); ctx.fill(); });
    ctx.fillStyle = col; list.forEach(([x, y, r]) => { ctx.beginPath(); circ(ctx, x, y, r); ctx.fill(); });
    if (hi) { ctx.fillStyle = shade(col, 0.16); list.forEach(([x, y, r]) => { ctx.beginPath(); circ(ctx, x - r * 0.3, y - r * 0.32, r * 0.34); ctx.fill(); }); }
  };
  const star5 = (k, x, y, r, inner = 0.45, rot = 0) => { for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + rot + (i * Math.PI) / 5, rr = i % 2 ? r * inner : r; k[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr); } k.closePath(); };

  // Local copies of the headwear.js pieces (they are not exported) -------------------------------------------------------
  const brim = (ctx, cx, cy, rx, ry, col, rot = 0) => T.outlined(ctx, (k) => ell(k, cx, cy, rx, ry, rot), col, { shade: (k) => { k.fillStyle = shade(col, -0.25); k.fillRect(cx - rx - 10, cy + ry * 0.1, rx * 2 + 20, ry * 2); } });
  const dome = (ctx, cx, base, w, h, col) => T.outlined(ctx, (k) => { k.moveTo(cx - w, base); k.bezierCurveTo(cx - w, base - h * 1.35, cx + w, base - h * 1.35, cx + w, base); k.closePath(); }, col, {
    shade: (k) => { k.fillStyle = shade(col, -0.2); k.beginPath(); k.ellipse(cx - w * 0.75, base - h * 0.3, w * 0.45, h, 0, 0, Math.PI * 2); k.fill(); k.fillStyle = shade(col, 0.3); k.beginPath(); k.ellipse(cx + w * 0.2, base - h * 0.8, w * 0.32, h * 0.14, -0.3, 0, Math.PI * 2); k.fill(); },
  });
  const visor = (ctx, sh, y, w, col = '#1c1a18') => { const cx = sh * HW * 1.1; T.outlined(ctx, (k) => { k.moveTo(cx - w, y); k.quadraticCurveTo(cx + sh * 60, y + 46, cx + w + sh * 90, y + 6); k.quadraticCurveTo(cx, y + 14, cx - w, y); k.closePath(); }, col, { line: 7 }); };
  const band = (ctx, y0, y1, col, inset = 0) => T.outlined(ctx, (k) => { k.moveTo(-HW - 8 + inset, y1); k.quadraticCurveTo(0, y1 + 16, HW + 8 - inset, y1); k.lineTo(HW + 4 - inset, y0); k.quadraticCurveTo(0, y0 + 14, -HW - 4 + inset, y0); k.closePath(); }, col, { line: 7 });
  const cylinder = (ctx, x0, x1, top, base, col, o = {}) => T.outlined(ctx, (k) => { k.moveTo(x0, base); k.lineTo(x0 + (o.taper ?? 0), top + 10); k.quadraticCurveTo((x0 + x1) / 2, top - 8, x1 - (o.taper ?? 0), top + 10); k.lineTo(x1, base); k.quadraticCurveTo((x0 + x1) / 2, base + 14, x0, base); k.closePath(); }, col, {
    shade: (k) => { k.fillStyle = shade(col, -0.2); k.fillRect(x0 - 10, top - 20, (x1 - x0) * 0.28, base - top + 40); if (o.hi !== false) { k.fillStyle = shade(col, 0.25); k.fillRect(x1 - (x1 - x0) * 0.3, top + 14, 18, base - top - 30); } },
  });
  // Hood with a face opening (even-odd hole); used by mail-coif, hood-dark and hijab.
  const hoodPath = (k, sh, o) => { o.outer(k); const ox = sh * HW * (o.shift ?? 0.33); k.moveTo(ox + o.rx, o.cy); k.ellipse(ox, o.cy, o.rx, o.ry, 0, 0, Math.PI * 2, true); };

  const H = T.HEADWEAR || (T.HEADWEAR = {});

  // ---- P1 kinds -----------------------------------------------------------------------------------------------------
  H.mianguan = (ctx, c, lt, sh, view) => { // imperial cap with a flat board and bead strings swinging in front of the face
    const cap = c.headColor ?? '#1e1a18', board = c.headColor2 ?? '#2a2228', gold = c.headColor3 ?? '#e8c64a';
    const tilt = view === 'front' || view === 'back' ? 0 : 6 * D, sw = Math.sin(lt * 2.2 - 0.4) * 3 * D;
    T.outlined(ctx, (k) => T.rrect(k, -100 + sh * 20, -650, 200, 96, 14), cap, { shade: (k) => { k.fillStyle = shade(cap, 0.18); k.fillRect(-60 + sh * 40, -640, 22, 80); } });
    iso(ctx, () => {
      ctx.translate(sh * 40, -668); ctx.rotate(tilt);
      const strings = view === 'front' ? [-140, -100, -60, -20, 20, 60, 100, 140] : view === 'back' ? [-140, -80, 80, 140] : [-150, -125, -100, 74, 98, 122, 146, 170];
      strings.forEach((x) => iso(ctx, () => {
        ctx.translate(x, 12); ctx.rotate(sw);
        ctx.strokeStyle = shade(gold, -0.35); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 72); ctx.stroke();
        for (let i = 1; i <= 5; i++) T.outlined(ctx, (k) => circ(k, 0, i * 14, 6), gold, { line: 3 });
      }));
      T.outlined(ctx, (k) => T.rrect(k, -170, -12, 340, 24, 6), board, { shade: (k) => { k.fillStyle = gold; k.fillRect(-180, 4, 360, 10); } });
    });
  };
  H['winged-helm'] = (ctx, c, lt, sh) => { // dome with two swept gold wings (back wing full, face-side wing foreshortened)
    const m = c.headColor ?? '#d8c8a0', w = c.headColor2 ?? '#f2b51c', back = -sh * 30;
    const wing = (s, k0) => iso(ctx, () => {
      ctx.translate(s * 150 + back, -590); ctx.scale(s * k0, 1);
      [[120, -0.95], [90, -0.6], [60, -0.25]].forEach(([len, a]) => T.outlined(ctx, (k) => { k.moveTo(0, -6); k.quadraticCurveTo(len * 0.5, -len * 0.9 + a * 30, len, -len * 0.55 + a * 40); k.quadraticCurveTo(len * 0.45, -len * 0.25 + a * 14, 0, 18); k.closePath(); }, w, { line: 6, shade: (k) => { k.fillStyle = shade(w, -0.2); k.fillRect(0, -len * 0.4 + a * 20, len * 1.2, len); } }));
    });
    wing(-1, sh > 0 ? 1.05 : 1);
    dome(ctx, back * 0.5, -560, 162, 92, m);
    band(ctx, -586, -552, shade(m, -0.12), 4);
    wing(1, sh > 0 ? 0.6 : 1);
  };
  H['bucket-hat'] = (ctx, c, lt, sh) => { // soft crown + floppy brim that droops at the front
    const m = c.headColor ?? '#c9a989', b = c.headColor2 ?? '#8a6a4a', x = sh * 30;
    T.outlined(ctx, (k) => { k.moveTo(x - 215, -580); k.quadraticCurveTo(x - 200, -612, x, -612); k.quadraticCurveTo(x + 210, -612, x + 222, -574); k.quadraticCurveTo(x + 230, -540, x + 200, -536); k.quadraticCurveTo(x, -548, x - 196, -540); k.quadraticCurveTo(x - 232, -548, x - 215, -580); k.closePath(); }, m, { shade: (k) => { k.fillStyle = shade(m, -0.25); k.fillRect(x - 240, -570, 480, 40); } });
    T.outlined(ctx, (k) => { k.moveTo(x - 132, -580); k.quadraticCurveTo(x - 124, -664, x, -664); k.quadraticCurveTo(x + 124, -664, x + 132, -580); k.closePath(); }, m, { shade: (k) => { k.fillStyle = shade(m, -0.2); k.fillRect(x - 140, -664, 70, 90); } });
    T.outlined(ctx, (k) => { k.moveTo(x - 132, -580); k.lineTo(x - 128, -606); k.quadraticCurveTo(x, -596, x + 128, -606); k.lineTo(x + 132, -580); k.quadraticCurveTo(x, -570, x - 132, -580); k.closePath(); }, b, { line: 6 });
  };
  H['dotted-cap'] = (ctx, c, lt, sh) => { // tall studded leather cap with cheek flaps and a swaying plume
    const m = c.headColor ?? '#7b2b3c', st = c.headColor2 ?? '#e7c35a', pl = c.headColor3 ?? '#5a3a22', back = -sh * 40;
    const sway = Math.sin(lt * Math.PI * 2) * 6;
    ctx.strokeStyle = P.ink; ctx.lineWidth = 28; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(back, -700); ctx.quadraticCurveTo(back - 70, -790 + sway, back - 140 + sway, -720); ctx.stroke();
    ctx.strokeStyle = pl; ctx.lineWidth = 14; ctx.stroke();
    for (const s of sh > 0 ? [-1] : [-1, 1]) T.outlined(ctx, (k) => T.rrect(k, s * HW - 26 - (s < 0 ? 4 : 0), -540, 52, 96, 22), m, { line: 7 });
    T.outlined(ctx, (k) => { k.moveTo(-166, -520); k.bezierCurveTo(-176, -760, 176, -760, 166, -520); k.quadraticCurveTo(sh * 80, -548, -166, -520); k.closePath(); }, m, { shade: (k) => { k.fillStyle = shade(m, -0.22); k.beginPath(); k.ellipse(-150, -600, 70, 130, 0, 0, Math.PI * 2); k.fill(); } });
    [[6, -560, 140], [5, -610, 110], [4, -655, 70]].forEach(([n, y, w]) => { for (let i = 0; i < n; i++) T.outlined(ctx, (k) => circ(k, back * 0.4 + sh * 30 + (n === 1 ? 0 : -w + (2 * w * i) / (n - 1)), y, 9), st, { line: 4 }); });
  };
  H['kettle-hat'] = (ctx, c, lt, sh) => { // wide iron brim + low dome
    const m = c.headColor ?? '#9a7a3a';
    brim(ctx, sh * 20, -560, 232, 40, m, 3 * D);
    dome(ctx, sh * 10, -566, 140, 70, m);
    ctx.strokeStyle = shade(m, 0.35); ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(sh * 20, -562, 214, 30, 3 * D, Math.PI * 0.15, Math.PI * 0.75); ctx.stroke();
  };
  H['mail-coif'] = (ctx, c, lt, sh) => { // chain-mail hood: rows of small arcs, face opening
    const m = c.headColor ?? '#8a7a68';
    const o = { outer: (k) => T.rrect(k, -176 - sh * 20, -640, 352, 420, 150), cy: -445, rx: 122, ry: 126, shift: 0.33 };
    T.outlined(ctx, (k) => hoodPath(k, sh, o), m, { shade: (k) => {
      k.fillStyle = shade(m, -0.22); k.fillRect(-230, -660, 120, 460);
      k.strokeStyle = shade(m, -0.32); k.lineWidth = 3;
      for (let y = -630, r = 0; y < -220; y += 14, r++) for (let x = -200 + (r % 2) * 8; x < 200; x += 16) { k.beginPath(); k.arc(x, y, 8, 0.15 * Math.PI, 0.85 * Math.PI); k.stroke(); }
    } });
    if (c.crownOver && H.crown) iso(ctx, () => { ctx.translate(0, -40); H.crown(ctx, { ...c, headColor: c.headColor2 }, lt, sh); });
  };
  H['visor-helmet'] = (ctx, c, lt, sh) => { // full dome over the face, dark visor band with two eye lights (red = glowing)
    const m = c.headColor ?? '#9a9a9f', fx = sh * HW, eye = c.eyeColor ?? '#ffffff';
    if (c.crest) T.outlined(ctx, (k) => { k.moveTo(-170, -560); k.quadraticCurveTo(-120, -760, 60, -700); k.quadraticCurveTo(-60, -680, -120, -560); k.closePath(); }, c.crest, { line: 7 });
    T.outlined(ctx, (k) => { k.moveTo(-172, -400); k.quadraticCurveTo(-190, -650, 0, -654); k.quadraticCurveTo(190, -650, 172, -400); k.quadraticCurveTo(0, -370, -172, -400); k.closePath(); }, m, { shade: (k) => { k.fillStyle = shade(m, -0.2); k.beginPath(); k.ellipse(-170, -520, 80, 160, 0, 0, Math.PI * 2); k.fill(); k.fillStyle = shade(m, 0.3); k.beginPath(); k.ellipse(fx + 20, -610, 60, 18, -0.2, 0, Math.PI * 2); k.fill(); } });
    T.outlined(ctx, (k) => { k.moveTo(fx - 160 + sh * 60, -484); k.quadraticCurveTo(fx, -496, fx + 168, -484); k.lineTo(fx + 166, -430); k.quadraticCurveTo(fx, -418, fx - 156 + sh * 60, -430); k.closePath(); }, '#141216', { line: 7 });
    const glow = !/^#f/i.test(eye);
    iso(ctx, () => {
      if (glow) { ctx.shadowColor = eye; ctx.shadowBlur = 30 * T.DPR; }
      ctx.fillStyle = eye; const sp = sh > 0.3 ? [24] : [-44 + sh * 20, 44];
      sp.forEach((ex) => { ctx.beginPath(); ctx.ellipse(fx + ex, -457, 22, 14, 0, 0, Math.PI * 2); ctx.fill(); });
    });
  };
  H['hood-dark'] = (ctx, c, lt, sh, view) => { // deep hood: the face sinks into shadow, only glowing eyes survive
    const m = c.headColor ?? '#5a4a3a', fx = sh * HW;
    const o = { outer: (k) => { k.moveTo(-200 - sh * 30, -260); k.quadraticCurveTo(-216, -700, sh * 60, -700); k.quadraticCurveTo(206, -690, 196, -260); k.closePath(); }, cy: -440, rx: 128, ry: 134, shift: 0.33 };
    if (view !== 'back') iso(ctx, () => {
      ctx.beginPath(); headPath(ctx); ctx.clip();
      ctx.fillStyle = 'rgba(27,21,18,0.9)'; ctx.beginPath(); ctx.ellipse(fx * 0.8, -560, 190, 165, 0, 0, Math.PI * 2); ctx.fill();
      const ex = T.charsState && T.charsState(c);
      if (c.eyeGlow || (ex && /menace|evil|roar/.test(ex.expr))) {
        ctx.shadowColor = c.eyeColor ?? '#ff2a2a'; ctx.shadowBlur = 22 * T.DPR; ctx.fillStyle = c.eyeColor ?? '#ff2a2a';
        (view === 'side' ? [18] : [-40, 40]).forEach((x, i) => { ctx.beginPath(); ctx.ellipse(fx + x, -458, 22, 7, (i ? -1 : 1) * 0.22, 0, Math.PI * 2); ctx.fill(); });
      }
    });
    T.outlined(ctx, (k) => hoodPath(k, view === 'back' ? 0 : sh, view === 'back' ? { ...o, rx: 0.1, ry: 0.1 } : o), m, { shade: (k) => { k.fillStyle = shade(m, -0.24); k.fillRect(-240, -720, 130, 480); k.strokeStyle = shade(m, -0.34); k.lineWidth = 5; k.beginPath(); k.moveTo(-150, -640); k.quadraticCurveTo(-120, -500, -160, -320); k.stroke(); } });
  };
  H.hijab = (ctx, c, lt, sh, view) => { // smooth oval wrap with a face cut and a cape falling over the shoulders
    const m = c.headColor ?? '#d65a86';
    T.outlined(ctx, (k) => { k.moveTo(-160, -330); k.lineTo(160, -330); k.lineTo(186, -232); k.quadraticCurveTo(0, -214, -186, -232); k.closePath(); }, m, { shade: (k) => { k.fillStyle = shade(m, -0.22); k.fillRect(-200, -340, 110, 120); } });
    const o = { outer: (k) => ell(k, -sh * 10, -455, 178, 192), cy: -450, rx: view === 'back' ? 0.1 : 118, ry: view === 'back' ? 0.1 : 128, shift: 0.35 };
    T.outlined(ctx, (k) => hoodPath(k, sh, o), m, { shade: (k) => { k.fillStyle = shade(m, -0.22); k.beginPath(); k.ellipse(-180, -460, 80, 200, 0, 0, Math.PI * 2); k.fill(); k.fillStyle = shade(m, 0.2); k.beginPath(); k.ellipse(40, -610, 70, 16, -0.2, 0, Math.PI * 2); k.fill(); } });
  };
  H['veil-wrap'] = (ctx, c, lt, sh, view) => { // desert wrap: head wrap + lower-face cloth, only an eye band shows; tail flutters
    const m = c.headColor ?? '#5a4136', fx = sh * HW, fl = (i) => Math.sin(lt * Math.PI * 4 + i * 1.3) * 10;
    ctx.strokeStyle = P.ink; ctx.lineWidth = 44; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const tail = () => { ctx.beginPath(); ctx.moveTo(-140, -480); ctx.quadraticCurveTo(-210, -460 + fl(0), -250, -420 + fl(1)); ctx.quadraticCurveTo(-280, -380 + fl(2), -300, -350 + fl(3)); };
    tail(); ctx.stroke(); ctx.strokeStyle = shade(m, -0.15); ctx.lineWidth = 28; tail(); ctx.stroke();
    if (view !== 'back') iso(ctx, () => {
      ctx.beginPath(); headPath(ctx); ctx.clip();
      T.outlined(ctx, (k) => { k.moveTo(-220, -430); k.quadraticCurveTo(fx, -440, 220, -430); k.lineTo(220, -260); k.lineTo(-220, -260); k.closePath(); }, m, { shade: (k) => { k.fillStyle = shade(m, -0.24); k.fillRect(-220, -440, 100, 200); k.strokeStyle = shade(m, -0.32); k.lineWidth = 5; for (let i = 0; i < 3; i++) { k.beginPath(); k.moveTo(fx - 90 + i * 60, -420); k.lineTo(fx - 40 + i * 70, -310); k.stroke(); } } });
    });
    T.outlined(ctx, (k) => { k.moveTo(-170, -470); k.bezierCurveTo(-190, -700, 186, -700, 168, -470); k.quadraticCurveTo(sh * 60, -506, -170, -470); k.closePath(); }, m, { shade: (k) => {
      k.fillStyle = shade(m, -0.22); k.beginPath(); k.ellipse(-160, -540, 70, 130, 0, 0, Math.PI * 2); k.fill();
      k.strokeStyle = shade(m, -0.34); k.lineWidth = 6; for (let i = 0; i < 3; i++) { k.beginPath(); k.moveTo(-180, -530 - i * 46); k.quadraticCurveTo(sh * 40, -600 - i * 40, 190, -500 - i * 52); k.stroke(); }
    } });
  };
  H['clown-wig'] = (ctx, c, lt, sh, view) => { // orange puff wig + red ball nose + painted smile outline
    const m = c.headColor ?? '#f05a1a', fx = sh * HW, r = T.rng(T.hash('clown' + (c.seed ?? '')));
    const list = [];
    for (let i = 0; i < 9; i++) { const a = (160 + i * 27.5) * D; list.push([Math.cos(a) * 160 - sh * 40, -470 + Math.sin(a) * 160, 40 + r() * 15]); }
    lumps(ctx, list, m);
    if (view === 'back') return;
    const nx = fx + (view === 'side' ? 56 : view === '3q' ? 12 : 0);
    ctx.strokeStyle = c.headColor2 ?? '#e02a2a'; ctx.lineWidth = 10; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(nx - 70, -400); ctx.quadraticCurveTo(nx, -320, nx + 70, -400); ctx.stroke();
    T.outlined(ctx, (k) => circ(k, nx + (view === 'front' ? 0 : 10), -420, 24), c.headColor2 ?? '#e02a2a', { line: 6, shade: (k) => { k.fillStyle = '#ffb0a8'; k.beginPath(); k.arc(nx + 2, -430, 7, 0, Math.PI * 2); k.fill(); } });
  };
  H['hard-hat'] = (ctx, c, lt, sh) => {
    const m = c.headColor ?? '#e98a2c', x = sh * 30;
    T.outlined(ctx, (k) => { k.moveTo(x - 180, -552); k.quadraticCurveTo(x, -585, x + 196 + sh * 60, -548); k.quadraticCurveTo(x + 200, -530, x + 170, -530); k.quadraticCurveTo(x, -548, x - 176, -536); k.closePath(); }, m, { shade: (k) => { k.fillStyle = shade(m, -0.25); k.fillRect(x - 200, -545, 420, 30); } });
    dome(ctx, x * 0.6, -556, 160, 100, m);
    T.outlined(ctx, (k) => { k.moveTo(x * 0.6 - 18, -558); k.quadraticCurveTo(x * 0.6 - 22, -684, x * 0.6 + 10, -690); k.quadraticCurveTo(x * 0.6 + 40, -684, x * 0.6 + 30, -558); k.closePath(); }, shade(m, 0.12), { line: 6 });
  };
  H['star-tophat'] = (ctx, c) => { // showman top hat: red/white stripes and a blue star band
    const w = c.headColor ?? '#f4f2ea', r = c.headColor2 ?? '#c82a2a', b = c.headColor3 ?? '#2a3a8a';
    brim(ctx, 0, -578, 176, 30, b);
    T.outlined(ctx, (k) => T.rrect(k, -110, -820, 220, 250, 14), w, { shade: (k) => {
      k.fillStyle = r; for (let i = 0; i < 6; i++) if (i % 2 === 0) k.fillRect(-110 + i * 36.6, -830, 36.6, 260);
      k.fillStyle = b; k.fillRect(-120, -650, 240, 46);
      k.fillStyle = '#ffffff'; for (let i = 0; i < 5; i++) { k.beginPath(); star5(k, -80 + i * 40, -627, 13); k.fill(); }
      k.fillStyle = 'rgba(0,0,0,0.12)'; k.fillRect(-120, -830, 44, 260);
    } });
  };
  H['party-hat'] = (ctx, c, lt, sh) => { // tilted cone with stripes and a pom-pom; optional number via hatText
    const m = c.headColor ?? '#f07aa0', d = c.headColor2 ?? '#f8e36a';
    iso(ctx, () => {
      ctx.translate(sh * HW + 30, -598); ctx.rotate(15 * D);
      T.outlined(ctx, (k) => { k.moveTo(-60, 0); k.lineTo(0, -160); k.lineTo(60, 0); k.quadraticCurveTo(0, 14, -60, 0); k.closePath(); }, m, { shade: (k) => {
        k.strokeStyle = d; k.lineWidth = 12; for (let i = 0; i < 3; i++) { k.beginPath(); k.moveTo(-60, -20 - i * 46); k.lineTo(60, -50 - i * 46); k.stroke(); }
        k.fillStyle = shade(m, -0.22); k.fillRect(-70, -170, 40, 190);
      } });
      if (c.hatText != null) T.toonText(ctx, String(c.hatText), 0, -26, { size: 40, shadow: false, stroke: 7 });
      T.outlined(ctx, (k) => circ(k, 0, -166, 15), d, { line: 5 });
    });
  };
  H.halo = (ctx, c, lt) => { // gold ring floating above the head, slow bob, soft glow
    const g = c.headColor ?? '#f1c84b', y = -660 + Math.sin(lt * Math.PI * 2 * 0.8) * 4;
    iso(ctx, () => { ctx.globalAlpha *= 0.3; ctx.shadowColor = g; ctx.shadowBlur = 20 * T.DPR; ctx.strokeStyle = g; ctx.lineWidth = 24; ctx.beginPath(); ctx.ellipse(0, y, 112, 26, 0, 0, Math.PI * 2); ctx.stroke(); });
    ctx.strokeStyle = P.ink; ctx.lineWidth = 14; ctx.beginPath(); ctx.ellipse(0, y, 112, 26, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = g; ctx.lineWidth = 8; ctx.stroke();
    ctx.strokeStyle = '#fff6c8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, y, 112, 26, 0, Math.PI * 1.1, Math.PI * 1.45); ctx.stroke();
  };

  // ---- P2 kinds -----------------------------------------------------------------------------------------------------
  H['imperial-helmet'] = (ctx, c, lt, sh) => { // legion helmet: cheek guards both sides, neck flare, transverse crest
    const m = c.headColor ?? '#a6a6ad', crest = c.crest ?? '#d1262c', fx = sh * HW, sway = Math.sin(lt * 3) * 4 + T.swayX(0.5);
    T.outlined(ctx, (k) => { k.moveTo(-150 + fx * 0.2, -690); k.quadraticCurveTo(fx * 0.5 + sway, -820, 150 + fx * 0.6, -690); k.quadraticCurveTo(fx * 0.4, -650, -150 + fx * 0.2, -690); k.closePath(); }, crest, { shade: (k) => { k.strokeStyle = shade(crest, -0.25); k.lineWidth = 5; for (let i = -4; i <= 4; i++) { k.beginPath(); k.moveTo(fx * 0.4 + i * 30, -680); k.lineTo(fx * 0.5 + i * 36 + sway, -790); k.stroke(); } } });
    T.outlined(ctx, (k) => { k.moveTo(-160, -470); k.lineTo(-206, -410); k.lineTo(-150, -420); k.closePath(); }, m, { line: 7 });
    T.outlined(ctx, (k) => { k.moveTo(-170, -440); k.quadraticCurveTo(-176, -660, 0, -664); k.quadraticCurveTo(176, -660, 168, -470); k.lineTo(136 + sh * 20, -490); k.quadraticCurveTo(sh * 60, -556, -136 + sh * 30, -490); k.closePath(); }, m,
      { shade: (k) => { k.fillStyle = shade(m, -0.18); k.beginPath(); k.ellipse(-150, -540, 90, 150, 0, 0, Math.PI * 2); k.fill(); k.fillStyle = shade(m, 0.35); k.beginPath(); k.ellipse(fx, -630, 50, 16, -0.3, 0, Math.PI * 2); k.fill(); } });
    band(ctx, -560, -530, shade(m, -0.1), 8);
    [fx - 150, fx + 104].forEach((gx, i) => T.outlined(ctx, (k) => T.rrect(k, gx + (i && sh ? -10 : 0), -500, 46, 128, 20), m, { line: 7, shade: (k) => { k.fillStyle = shade(m, -0.15); k.fillRect(gx, -420, 60, 40); } }));
  };
  H['crested-bronze'] = (ctx, c, lt, sh) => { // bronze helm with nose guard and a front-to-back plume
    const m = c.headColor ?? '#d9a648', pl = c.crest ?? '#c0282d', fx = sh * HW, sway = Math.sin(lt * 2.6) * 5 + T.swayX(0.5);
    T.outlined(ctx, (k) => { k.moveTo(fx + 40, -640); k.quadraticCurveTo(fx - 40 + sway, -800, -200, -620); k.quadraticCurveTo(-120, -660, fx + 40, -640); k.closePath(); }, pl, { shade: (k) => { k.strokeStyle = shade(pl, -0.25); k.lineWidth = 5; for (let i = 0; i < 7; i++) { k.beginPath(); k.moveTo(fx - i * 34, -650); k.lineTo(fx - i * 38 + sway, -730 + i * 6); k.stroke(); } } });
    T.outlined(ctx, (k) => { k.moveTo(-170, -380); k.quadraticCurveTo(-186, -664, 0, -668); k.quadraticCurveTo(178, -664, 166, -500); k.lineTo(fx + 100, -508); k.quadraticCurveTo(fx, -540, fx - 110, -500); k.lineTo(fx - 120, -390); k.quadraticCurveTo(-140, -370, -170, -380); k.closePath(); }, m,
      { shade: (k) => { k.fillStyle = shade(m, -0.22); k.beginPath(); k.ellipse(-160, -520, 70, 170, 0, 0, Math.PI * 2); k.fill(); k.fillStyle = shade(m, 0.35); k.beginPath(); k.ellipse(fx, -630, 56, 16, -0.25, 0, Math.PI * 2); k.fill(); } });
    T.outlined(ctx, (k) => T.rrect(k, fx - 11, -540, 22, 84, 8), m, { line: 6 });
  };
  H['court-hat'] = (ctx, c, lt, sh) => cylinder(ctx, -112 + sh * 10, 112 + sh * 10, -770, -526, c.headColor ?? '#3a3a40', { taper: -6 });
  H['phoenix-crown'] = (ctx, c, lt, sh) => { // red cap, gold ray crest, flower discs at the temples, bead drops
    const r = c.headColor ?? '#c8202c', g = c.headColor2 ?? '#e2b23c', x = sh * 40;
    for (let i = 0; i < 5; i++) iso(ctx, () => { ctx.translate(x, -640); ctx.rotate((-50 + i * 25) * D); T.outlined(ctx, (k) => { k.moveTo(-12, 0); k.lineTo(0, -90); k.lineTo(12, 0); k.closePath(); }, g, { line: 6 }); T.outlined(ctx, (k) => circ(k, 0, -92, 10), r, { line: 4 }); });
    dome(ctx, x, -560, 158, 76, r);
    band(ctx, -590, -556, g, 6);
    for (const s of [-1, 1]) {
      const tx = s * 150 + x * 0.5;
      ctx.strokeStyle = g; ctx.lineWidth = 3; for (let j = -1; j <= 1; j++) { ctx.beginPath(); ctx.moveTo(tx + j * 12, -560); ctx.lineTo(tx + j * 12, -510); ctx.stroke(); T.outlined(ctx, (k) => circ(k, tx + j * 12, -506, 6), g, { line: 3 }); }
      T.outlined(ctx, (k) => { for (let p = 0; p < 5; p++) circ(k, tx + Math.cos(p * 1.257) * 16, -572 + Math.sin(p * 1.257) * 16, 13); }, r, { line: 5 });
      T.outlined(ctx, (k) => circ(k, tx, -572, 9), g, { line: 4 });
    }
  };
  H['fur-cap'] = (ctx, c, lt, sh) => { // big white scallop cloud framing the face, green brow lining
    const m = c.headColor ?? '#f2efe6', lin = c.headColor2 ?? '#3a7a4a', list = [];
    for (let i = 0; i < 8; i++) { const a = (170 + i * 28.6) * D; list.push([Math.cos(a) * 150 - sh * 30, -500 + Math.sin(a) * 150, 46]); }
    list.push([-sh * 30, -640, 70]);
    lumps(ctx, list, m);
    T.outlined(ctx, (k) => { k.moveTo(-142, -540); k.quadraticCurveTo(sh * 40, -590, 146, -540); k.lineTo(140, -520); k.quadraticCurveTo(sh * 40, -566, -136, -520); k.closePath(); }, lin, { line: 6 });
  };
  H.deerstalker = (ctx, c, lt, sh) => { // two brims, ear flaps tied on top, check grid
    const m = c.headColor ?? '#c79a6a', g = c.headColor2 ?? '#8a6440', x = sh * 20;
    const grid = (k) => { k.strokeStyle = g; k.lineWidth = 3; k.beginPath(); for (let i = -200; i < 200; i += 24) { k.moveTo(i, -720); k.lineTo(i, -520); } for (let y = -712; y < -540; y += 24) { k.moveTo(-200, y); k.lineTo(200, y); } k.stroke(); };
    T.outlined(ctx, (k) => { k.moveTo(x - 210, -560); k.quadraticCurveTo(x - 160, -590, x - 120, -580); k.lineTo(x + 120, -580); k.quadraticCurveTo(x + 170, -590, x + 222, -556); k.quadraticCurveTo(x + 160, -540, x + 110, -552); k.lineTo(x - 110, -552); k.quadraticCurveTo(x - 170, -540, x - 210, -560); k.closePath(); }, shade(m, -0.1), { line: 7 });
    T.outlined(ctx, (k) => { k.moveTo(x - 134, -566); k.bezierCurveTo(x - 134, -720, x + 134, -720, x + 134, -566); k.closePath(); }, m, { shade: (k) => { grid(k); k.fillStyle = 'rgba(60,30,10,0.18)'; k.fillRect(x - 150, -720, 60, 170); } });
    for (const s of [-1, 1]) T.outlined(ctx, (k) => { k.moveTo(x + s * 80, -640); k.quadraticCurveTo(x + s * 120, -690, x + s * 30, -690); k.closePath(); }, m, { line: 6 });
    T.outlined(ctx, (k) => { k.moveTo(x - 30, -700); k.lineTo(x - 2, -684); k.lineTo(x - 30, -668); k.closePath(); k.moveTo(x + 30, -700); k.lineTo(x + 2, -684); k.lineTo(x + 30, -668); k.closePath(); }, g, { line: 4 });
  };
  H['straw-boater'] = (ctx, c, lt, sh) => {
    const m = c.headColor ?? '#d9a441', b = c.headColor2 ?? '#c0392b', x = sh * 30;
    brim(ctx, x, -584, 232, 28, m);
    cylinder(ctx, x - 104, x + 104, -656, -588, m, { hi: false });
    T.outlined(ctx, (k) => T.rrect(k, x - 106, -620, 212, 22, 4), b, { line: 5 });
    ctx.strokeStyle = shade(m, -0.3); ctx.lineWidth = 3; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(x, -584, 140 + i * 24, 16 + i * 3, 0, 0.1, Math.PI - 0.1); ctx.stroke(); }
  };
  H['chef-hat'] = (ctx, c, lt, sh) => {
    const m = c.headColor ?? '#f6f4ee', x = sh * 30;
    lumps(ctx, [[x - 70, -680, 52], [x + 10, -720, 60], [x + 80, -676, 50], [x - 10, -660, 56]], m, false);
    T.outlined(ctx, (k) => T.rrect(k, x - 112, -640, 224, 82, 14), m, { shade: (k) => { k.fillStyle = shade(m, -0.12); k.fillRect(x - 120, -640, 60, 90); k.strokeStyle = shade(m, -0.2); k.lineWidth = 4; for (let i = -2; i <= 2; i++) { k.beginPath(); k.moveTo(x + i * 40, -636); k.lineTo(x + i * 40, -566); k.stroke(); } } });
  };
  H.shako = (ctx, c, lt, sh) => {
    const m = c.headColor ?? '#3a4148', pom = c.headColor2 ?? '#e6e0d0', x = sh * 20;
    cylinder(ctx, x - 108, x + 108, -760, -560, m, { taper: 6 });
    T.outlined(ctx, (k) => T.rrect(k, x - 110, -600, 220, 18, 4), c.headColor3 ?? P.gold, { line: 5 });
    T.outlined(ctx, (k) => circ(k, x + sh * 40, -650, 20), c.headColor3 ?? P.gold, { line: 5 });
    visor(ctx, sh, -566, 90);
    T.outlined(ctx, (k) => ell(k, x + 10, -790, 22, 32), pom, { line: 6 });
  };
  H.phrygian = (ctx, c, lt, sh) => { // soft cap whose tip curls forward; long feather streaming back
    const m = c.headColor ?? '#6a8a5a', f = c.headColor2 ?? '#c0282d', fx = sh * HW, fl = Math.sin(lt * Math.PI * 2 / 0.6) * 10;
    ctx.strokeStyle = P.ink; ctx.lineWidth = 30; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-80, -640); ctx.quadraticCurveTo(-170, -700 + fl, -250, -640 - fl); ctx.stroke();
    ctx.strokeStyle = f; ctx.lineWidth = 16; ctx.stroke();
    T.outlined(ctx, (k) => { k.moveTo(-160, -540); k.quadraticCurveTo(-170, -690, -20, -716); k.quadraticCurveTo(fx + 70, -730, fx + 70, -690); k.quadraticCurveTo(fx + 30, -700, fx + 30, -660); k.quadraticCurveTo(150, -640, 156, -540); k.quadraticCurveTo(0, -566, -160, -540); k.closePath(); }, m, { shade: (k) => { k.fillStyle = shade(m, -0.22); k.beginPath(); k.ellipse(-150, -600, 70, 100, 0, 0, Math.PI * 2); k.fill(); } });
  };
  H['barrister-wig'] = (ctx, c, lt, sh) => { // off-white mass with stacked roll curls at each side
    const m = c.headColor ?? '#eee6d6', back = -sh * 40;
    T.outlined(ctx, (k) => { k.moveTo(-176 + back, -420); k.quadraticCurveTo(-190 + back, -650, back * 0.5, -650); k.quadraticCurveTo(186, -650, 170, -520); k.quadraticCurveTo(sh * 60, -580, -120, -520); k.closePath(); }, m, { shade: (k) => { k.strokeStyle = shade(m, -0.18); k.lineWidth = 4; for (let i = 0; i < 6; i++) { k.beginPath(); k.moveTo(-120 + i * 50, -640); k.quadraticCurveTo(-110 + i * 50, -600, -130 + i * 50, -560); k.stroke(); } } });
    for (const s of sh > 0 ? [-1, 1] : [-1, 1]) for (const y of [-520, -480, -440]) T.outlined(ctx, (k) => T.rrect(k, (s < 0 ? -176 + back : 132) - 4, y - 14, 50, 28, 14), m, { line: 6, shade: (k) => { k.fillStyle = shade(m, -0.15); k.fillRect(-200, y + 4, 400, 12); } });
  };
  H.nightcap = (ctx, c, lt, sh) => { // floppy cone draping to the back, pom-pom
    const m = c.headColor ?? '#5a7ab0', sw = Math.sin(lt * 2) * 6;
    T.outlined(ctx, (k) => { k.moveTo(-156, -540); k.quadraticCurveTo(-120, -700, 20, -680); k.quadraticCurveTo(-140, -690, -250 + sw, -520); k.quadraticCurveTo(-200, -560, -156, -540); k.moveTo(-156, -540); k.quadraticCurveTo(-130, -660, 20, -680); k.quadraticCurveTo(140, -660, 156, -540); k.quadraticCurveTo(0, -566, -156, -540); k.closePath(); }, m, { shade: (k) => { k.fillStyle = shade(m, -0.22); k.fillRect(-260, -620, 120, 120); } });
    T.outlined(ctx, (k) => T.rrect(k, -160, -566, 320, 34, 16), c.headColor2 ?? '#f2efe6', { line: 6 });
    T.outlined(ctx, (k) => circ(k, -254 + sw, -510, 20), c.headColor2 ?? '#f2efe6', { line: 5 });
  };
  H['bucket-helmet'] = (ctx, c, lt) => { // bucket over the whole head: antenna with a blinking bulb, stencil text
    const m = c.headColor ?? '#9a9a9f', on = Math.floor(lt * 2) % 2 === 0;
    ctx.strokeStyle = P.ink; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(30, -640); ctx.lineTo(40, -730); ctx.stroke();
    T.outlined(ctx, (k) => circ(k, 40, -736, 11), on ? '#ff3a2a' : '#8a2a22', { line: 5 });
    T.outlined(ctx, (k) => { k.moveTo(-100, -644); k.lineTo(100, -644); k.lineTo(160, -380); k.quadraticCurveTo(0, -362, -160, -380); k.closePath(); }, m, { shade: (k) => { k.fillStyle = shade(m, -0.2); k.fillRect(-180, -660, 90, 300); k.strokeStyle = shade(m, -0.3); k.lineWidth = 5; [-600, -420].forEach((y) => { k.beginPath(); k.moveTo(-170, y); k.quadraticCurveTo(0, y + 10, 170, y); k.stroke(); }); } });
    ctx.fillStyle = '#141216'; ctx.fillRect(-60, -520, 120, 18);
    if (c.headText) iso(ctx, () => { ctx.font = T.font(30); ctx.textAlign = 'center'; ctx.fillStyle = shade(m, -0.5); ctx.fillText(String(c.headText).toUpperCase().slice(0, 8), 10, -440); });
  };
  H['wide-brim'] = (ctx, c, lt, sh, view) => { // villain hat: wide brim, low crown, shadow band over the eyes
    const m = c.headColor ?? '#1a1a1e';
    if (view !== 'back') iso(ctx, () => { ctx.beginPath(); headPath(ctx); ctx.clip(); ctx.fillStyle = 'rgba(20,16,24,0.85)'; ctx.fillRect(-200, -550, 400, 116); });
    brim(ctx, sh * 20, -540, 262, 32, m);
    T.outlined(ctx, (k) => { k.moveTo(-120, -548); k.quadraticCurveTo(-126, -650, -20, -654); k.quadraticCurveTo(0, -630, 20, -654); k.quadraticCurveTo(126, -650, 120, -548); k.closePath(); }, m, { shade: (k) => { k.fillStyle = c.headColor2 ?? '#4a2a2a'; k.fillRect(-130, -584, 260, 26); } });
  };

  // ---- outfits ------------------------------------------------------------------------------------------------------
  const torso = (k) => { k.moveTo(-100, -326); k.quadraticCurveTo(0, -342, 100, -326); k.quadraticCurveTo(130, -210, 148, -70); k.quadraticCurveTo(0, -48, -148, -70); k.quadraticCurveTo(-130, -210, -100, -326); k.closePath(); };
  const clipTorso = (ctx, fn) => iso(ctx, () => { ctx.beginPath(); torso(ctx); ctx.clip(); fn(); });
  const nx = (view) => (view === 'front' || view === 'back' ? 0 : 22); // neckline leans to the face side in 3/4
  const buttons = (ctx, x, ys, col, r = 8) => ys.forEach((y) => T.outlined(ctx, (k) => circ(k, x, y, r), col, { line: 4 }));
  const folds = (ctx, col, list, w = 5) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; list.forEach(([x0, y0, cx, cy, x1, y1]) => { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(cx, cy, x1, y1); ctx.stroke(); }); };
  const SK = '#f6f2ea', SHOE = '#1e1a16';
  Object.assign(T.OUTFIT_DEFAULTS || (T.OUTFIT_DEFAULTS = {}), {
    toga: { robe: '#efe6d3', folds: false }, chiton: { robe: '#ece6d8', folds: false }, dress: { robe: '#efe9dc', folds: false },
    cuirass: { robe: '#c8232b', folds: false }, cloak: { robe: '#d8c6a6', cape: '#3f5d4a', folds: false },
    'robe-royal': { robe: '#b82a2a', trim: '#e2b23c', folds: false }, habit: { robe: '#6b3f33', folds: false },
    frockcoat: { robe: '#2a2a30', legColor: '#2a2a30', shoes: SHOE, folds: false }, labcoat: { robe: '#f4f4f0', legColor: '#3a3a40', shoes: SHOE, folds: false },
    overalls: { robe: '#e8dcc4', legColor: '#d0302a', shoes: '#5a3a26', folds: false }, jersey: { robe: '#1e1e22', folds: false },
    rags: { robe: '#d9c3a0', folds: false }, 'fur-vest': { robe: SK, legColor: '#6a4a2a', shoes: '#4a3020', folds: false },
    stripes: { robe: '#efefef', legColor: '#1d1d1d', shoes: SHOE, folds: false }, boxers: { robe: SK, folds: false },
    'cow-suit': { robe: '#f2f0ea', legColor: '#f2f0ea', shoes: '#2a2422', folds: false }, gown: { robe: '#f6f4f0', folds: false },
    tracht: { robe: '#efe3b8', legColor: SK, shoes: '#5a3a26', folds: false }, 'party-tunic': { robe: '#6f6b4c', legColor: '#5f5c42', shoes: SHOE, folds: false },
    'judge-robe': { robe: '#1e1e22', folds: false, pleats: true },
  });
  const O = T.OUTFITS || (T.OUTFITS = {});
  const sash = (ctx, col, edge) => clipTorso(ctx, () => T.outlined(ctx, (k) => { k.moveTo(-120, -350); k.lineTo(-40, -350); k.lineTo(170, -160); k.lineTo(170, -60); k.closePath(); }, col, { line: 7, shade: (k) => {
    k.fillStyle = shade(col, -0.18); k.beginPath(); k.moveTo(-120, -350); k.lineTo(-90, -350); k.lineTo(170, -110); k.lineTo(170, -60); k.closePath(); k.fill();
    if (edge) { k.strokeStyle = edge; k.lineWidth = 14; k.beginPath(); k.moveTo(-40, -350); k.lineTo(170, -160); k.stroke(); }
    folds(k, shade(col, -0.3), [[-60, -300, 0, -270, 40, -270], [0, -250, 60, -210, 100, -210], [50, -190, 100, -150, 140, -150]]);
  } }));
  O.toga = (ctx, c, view) => {
    if (view === 'back') return folds(ctx, shade(c.robe, -0.3), [[-60, -300, -80, -200, -70, -90], [50, -280, 70, -180, 80, -90]]);
    folds(ctx, shade(c.robe, -0.28), [[-80, -220, -90, -150, -100, -90], [30, -120, 40, -100, 60, -80]]);
    sash(ctx, c.drapeColor ?? c.robe, c.trim ?? null);
  };
  O.chiton = (ctx, c, view) => { // belted short tunic, blousing over a cord belt; optional himation via drapeColor
    folds(ctx, shade(c.robe, -0.28), [[-70, -300, -80, -250, -60, -210], [60, -300, 70, -250, 50, -210], [-90, -180, -100, -120, -110, -80], [-10, -180, 0, -120, 10, -70], [80, -180, 90, -120, 100, -80]]);
    clipTorso(ctx, () => { ctx.fillStyle = c.belt ?? '#c9a24a'; ctx.fillRect(-170, -206, 340, 14); });
    if (c.drapeColor && view !== 'back') sash(ctx, c.drapeColor, null);
    if (view !== 'back') T.outlined(ctx, (k) => circ(k, -60, -318, 12), '#c9a24a', { line: 5 });
  };
  O.dress = (ctx, c, view) => { // long dress: belt with hanging strap, optional bodice panel (bodice)
    folds(ctx, shade(c.robe, -0.26), [[-80, -170, -100, -120, -120, -76], [-20, -170, -24, -110, -30, -64], [50, -170, 60, -110, 70, -66], [110, -160, 120, -120, 130, -80]]);
    if (c.bodice && view !== 'back') T.outlined(ctx, (k) => { k.moveTo(nx(view) - 60, -320); k.lineTo(nx(view) + 60, -320); k.lineTo(nx(view) + 50, -230); k.lineTo(nx(view), -200); k.lineTo(nx(view) - 50, -230); k.closePath(); }, c.bodice, { line: 6 });
    const b = c.belt ?? '#5a3a2a';
    clipTorso(ctx, () => { ctx.fillStyle = b; ctx.fillRect(-170, -232, 340, 24); ctx.fillStyle = shade(b, -0.3); ctx.fillRect(-170, -214, 340, 6); });
    if (view !== 'back') T.outlined(ctx, (k) => T.rrect(k, nx(view) + 30, -224, 18, 70, 6), b, { line: 5 });
  };
  O.cuirass = (ctx, c, view) => { // segmented plate, shoulder plates, leather strips over a pleated tunic skirt
    const pl = c.plateColor ?? '#a6a6ad', lea = '#5a3a22';
    clipTorso(ctx, () => { ctx.strokeStyle = shade(c.robe, -0.3); ctx.lineWidth = 5; for (let x = -130; x <= 130; x += 26) { ctx.beginPath(); ctx.moveTo(x, -150); ctx.lineTo(x * 1.05, -60); ctx.stroke(); } });
    for (let i = 0; i < 7; i++) T.outlined(ctx, (k) => T.rrect(k, -94 + i * 27, -176, 22, 66, 6), lea, { line: 5 });
    T.outlined(ctx, (k) => { k.moveTo(-108, -326); k.quadraticCurveTo(0, -342, 108, -326); k.lineTo(122, -178); k.quadraticCurveTo(0, -162, -122, -178); k.closePath(); }, pl, { shade: (k) => {
      k.fillStyle = shade(pl, -0.25); k.fillRect(view === 'front' ? 50 : -140, -340, 90, 180);
      k.strokeStyle = shade(pl, -0.4); k.lineWidth = 6; for (let y = -296; y < -180; y += 30) { k.beginPath(); k.moveTo(-124, y); k.quadraticCurveTo(0, y + 12, 124, y); k.stroke(); }
      if (view !== 'back') { k.strokeStyle = shade(pl, 0.35); k.lineWidth = 5; k.beginPath(); k.moveTo(nx(view) + 30, -300); k.lineTo(nx(view) + 56, -276); k.moveTo(nx(view) + 56, -300); k.lineTo(nx(view) + 30, -276); k.stroke(); }
    } });
    for (const s of [-1, 1]) T.outlined(ctx, (k) => ell(k, s * 96, -322, 46, 26, s * 0.25), shade(pl, 0.08), { line: 6 });
  };
  O.cloak = (ctx, c, view) => { // half-cape front flap on the back shoulder, brooch, bandolier strap
    const cp = c.cape ?? '#3f5d4a', x = nx(view);
    if (view !== 'back') clipTorso(ctx, () => { ctx.strokeStyle = P.ink; ctx.lineWidth = 30; ctx.beginPath(); ctx.moveTo(-110, -330); ctx.lineTo(160, -120); ctx.stroke(); ctx.strokeStyle = c.belt ?? '#8a5a34'; ctx.lineWidth = 16; ctx.stroke(); });
    T.outlined(ctx, (k) => { k.moveTo(-104, -336); k.quadraticCurveTo(x - 20, -350, x - 30, -320); k.quadraticCurveTo(x - 60, -230, -90, -150); k.quadraticCurveTo(-140, -170, -150, -200); k.quadraticCurveTo(-140, -280, -104, -336); k.closePath(); }, cp, { shade: (k) => { k.fillStyle = shade(cp, -0.25); k.fillRect(-170, -340, 70, 200); } });
    if (view !== 'back') T.outlined(ctx, (k) => circ(k, x - 40, -312, 13), '#d9a441', { line: 5 });
  };
  O['robe-royal'] = (ctx, c, view) => { // mantle collar with gold trim and three buttons
    const g = c.trim ?? '#e2b23c', x = nx(view);
    folds(ctx, shade(c.robe, -0.28), [[-60, -200, -80, -140, -100, -90], [40, -200, 54, -140, 70, -90]]);
    if (view !== 'back') buttons(ctx, x, [-250, -210, -170], g, 9);
    T.outlined(ctx, (k) => { k.moveTo(-132, -326); k.quadraticCurveTo(0, -352, 132, -326); k.quadraticCurveTo(150, -270, 120, -250); k.quadraticCurveTo(x, -230, -120, -250); k.quadraticCurveTo(-150, -270, -132, -326); k.closePath(); }, c.robe, { shade: (k) => { k.strokeStyle = g; k.lineWidth = 28; k.beginPath(); k.moveTo(-150, -262); k.quadraticCurveTo(x, -236, 150, -262); k.stroke(); k.fillStyle = shade(c.robe, -0.22); k.fillRect(-160, -340, 60, 120); } });
  };
  O.habit = (ctx, c, view) => { // monk habit: hood fold, rope belt with hanging knot, wooden pendant
    const r = c.belt ?? '#d8c08a', x = nx(view);
    T.outlined(ctx, (k) => { k.moveTo(-120, -320); k.quadraticCurveTo(-60, -360, 60, -340); k.quadraticCurveTo(-20, -300, -110, -290); k.closePath(); }, shade(c.robe, -0.1), { line: 6 });
    folds(ctx, shade(c.robe, -0.3), [[-60, -180, -70, -120, -90, -76], [30, -180, 40, -120, 50, -70]]);
    clipTorso(ctx, () => { ctx.strokeStyle = P.ink; ctx.lineWidth = 18; ctx.beginPath(); ctx.moveTo(-170, -196); ctx.quadraticCurveTo(0, -182, 170, -196); ctx.stroke(); ctx.strokeStyle = r; ctx.lineWidth = 10; ctx.stroke(); });
    if (view === 'back') return;
    ctx.strokeStyle = P.ink; ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(x + 40, -190); ctx.quadraticCurveTo(x + 46, -150, x + 40, -120); ctx.stroke(); ctx.strokeStyle = r; ctx.lineWidth = 7; ctx.stroke();
    T.outlined(ctx, (k) => circ(k, x + 40, -118, 9), r, { line: 4 });
    ctx.strokeStyle = shade(c.robe, -0.5); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 40, -334); ctx.lineTo(x, -276); ctx.lineTo(x + 40, -334); ctx.stroke();
    T.outlined(ctx, (k) => { k.rect(x - 5, -284, 10, 34); k.rect(x - 14, -274, 28, 9); }, c.pendant ?? '#8a5a2a', { line: 4 });
  };
  O.frockcoat = (ctx, c, view) => { // lapels, waistcoat V, shirt and bow tie (tails come from the BEAN_UNDER hook)
    if (view === 'back') return;
    const x = nx(view), vest = c.vest ?? '#5a4a3a';
    T.outlined(ctx, (k) => { k.moveTo(x - 52, -334); k.lineTo(x + 52, -334); k.lineTo(x + 24, -170); k.lineTo(x - 24, -170); k.closePath(); }, vest, { line: 6 });
    T.outlined(ctx, (k) => { k.moveTo(x - 34, -336); k.lineTo(x + 34, -336); k.lineTo(x, -262); k.closePath(); }, c.shirt ?? '#f4f2ea', { line: 5 });
    buttons(ctx, x, [-240, -210, -180], shade(vest, 0.3), 6);
    for (const s of [-1, 1]) T.outlined(ctx, (k) => { k.moveTo(x + s * 56, -336); k.lineTo(x + s * 28, -230); k.lineTo(x + s * 46, -236); k.lineTo(x + s * 70, -300); k.closePath(); }, shade(c.robe, 0.12), { line: 5 });
    if (c.bowtie !== false) T.outlined(ctx, (k) => { k.moveTo(x - 32, -330); k.lineTo(x + 32, -306); k.lineTo(x + 32, -340); k.lineTo(x - 32, -316); k.closePath(); }, c.tie ?? '#a0262c', { line: 5 });
  };
  O.labcoat = (ctx, c, view) => { // white coat: centre seam, lapels, pockets with a pen, tie
    const x = nx(view);
    clipTorso(ctx, () => { ctx.strokeStyle = shade(c.robe, -0.3); ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, -240); ctx.lineTo(x * 1.4, -50); ctx.stroke(); });
    if (view === 'back') return;
    T.outlined(ctx, (k) => { k.moveTo(x - 40, -334); k.lineTo(x + 40, -334); k.lineTo(x, -240); k.closePath(); }, c.shirt ?? '#8fb0d8', { line: 5 });
    T.outlined(ctx, (k) => { k.moveTo(x - 10, -330); k.lineTo(x + 10, -330); k.lineTo(x + 13, -256); k.lineTo(x, -242); k.lineTo(x - 13, -256); k.closePath(); }, c.tie ?? '#2a3a6a', { line: 4 });
    for (const s of [-1, 1]) T.outlined(ctx, (k) => { k.moveTo(x + s * 46, -336); k.lineTo(x + s * 4, -236); k.lineTo(x + s * 30, -250); k.lineTo(x + s * 72, -310); k.closePath(); }, shade(c.robe, -0.06), { line: 5 });
    for (const [px, py] of [[x - 92, -160], [x + 50, -160], [x + 40, -290]]) T.outlined(ctx, (k) => T.rrect(k, px, py, py < -200 ? 40 : 52, py < -200 ? 34 : 42, 6), shade(c.robe, -0.06), { line: 5 });
    ctx.strokeStyle = '#2a5ac8'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(x + 52, -294); ctx.lineTo(x + 52, -318); ctx.stroke();
  };
  O.overalls = (ctx, c, view) => { // bib + straps over a shirt; the lower torso becomes trousers
    const b = c.bibColor ?? c.legColor ?? '#d0302a', x = nx(view) * 0.6;
    clipTorso(ctx, () => { ctx.fillStyle = P.ink; ctx.fillRect(-180, -186, 360, 140); ctx.fillStyle = b; ctx.fillRect(-180, -180, 360, 140); ctx.fillStyle = shade(b, -0.22); ctx.fillRect(view === 'front' ? 70 : -180, -180, 110, 140); ctx.fillStyle = shade(b, -0.3); ctx.fillRect(x - 3, -150, 6, 110); });
    if (c.stripeColor) clipTorso(ctx, () => { ctx.fillStyle = c.stripeColor; for (let y = -330; y < -186; y += 28) ctx.fillRect(-180, y, 360, 10); });
    if (view === 'back') return;
    for (const s of [-1, 1]) { ctx.strokeStyle = P.ink; ctx.lineWidth = 22; ctx.beginPath(); ctx.moveTo(x + s * 50, -296); ctx.lineTo(x + s * 76, -334); ctx.stroke(); ctx.strokeStyle = b; ctx.lineWidth = 12; ctx.stroke(); }
    T.outlined(ctx, (k) => T.rrect(k, x - 60, -300, 120, 124, 10), b, { shade: (k) => { k.strokeStyle = shade(b, -0.3); k.lineWidth = 4; k.strokeRect(x - 30, -270, 60, 46); } });
    buttons(ctx, x - 46, [-288], '#e8c64a', 8); buttons(ctx, x + 46, [-288], '#e8c64a', 8);
  };
  O.jersey = (ctx, c, view) => { // sports shirt: collar and cuffs in trim2, big number (jerseyNum)
    const t = c.trim2 ?? '#c8302a', x = nx(view);
    T.outlined(ctx, (k) => { k.moveTo(x - 56, -338); k.quadraticCurveTo(x, -290, x + 56, -338); k.lineTo(x + 40, -340); k.quadraticCurveTo(x, -306, x - 40, -340); k.closePath(); }, t, { line: 6 });
    clipTorso(ctx, () => { ctx.fillStyle = t; ctx.fillRect(-180, -96, 360, 20); });
    const n = c.jerseyNum ?? 10;
    T.toonText(ctx, String(n).slice(0, 3), view === 'back' ? 0 : x + 6, -170, { size: 96, fill: c.numColor ?? '#ffd23a', stroke: 14, shadow: false });
  };
  O.rags = (ctx, c, view) => { // frayed hem teeth hanging below the robe, stitched patches
    const r = c.robe, sd = shade(r, -0.18), rng = T.rng(T.hash('rags' + (c.patchSeed ?? '')));
    T.outlined(ctx, (k) => { k.moveTo(-148, -76); for (let i = 0; i <= 8; i++) { const x = -148 + i * 37; k.lineTo(x, -76); if (i < 8) k.lineTo(x + 18, -48 + (i % 3) * 6); } k.lineTo(148, -76); k.closePath(); }, sd, { line: 6 });
    const pts = [[-90, -260], [60, -170], [-40, -130]];
    pts.slice(0, view === 'back' ? 1 : 3).forEach(([x, y], i) => {
      const w = 46 + rng() * 14, h = 40 + rng() * 10, col = ['#a88a5a', '#8a7a5a', '#b89a7a'][i];
      iso(ctx, () => { ctx.translate(x, y); ctx.rotate((rng() - 0.5) * 0.4); T.outlined(ctx, (k) => k.rect(-w / 2, -h / 2, w, h), col, { line: 5 }); ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 3; for (let j = -w / 2 + 6; j < w / 2; j += 10) { ctx.beginPath(); ctx.moveTo(j, -h / 2 - 5); ctx.lineTo(j + 3, -h / 2 + 5); ctx.moveTo(j, h / 2 - 5); ctx.lineTo(j + 3, h / 2 + 5); ctx.stroke(); } });
    });
  };
  O['fur-vest'] = (ctx, c, view) => { // open vest with scalloped fur trim over a bare chest; tooth necklace
    const v = c.vest ?? '#6b4a33', f = c.furColor ?? '#c9b08a', x = nx(view);
    if (view !== 'back') { ctx.strokeStyle = shade(c.robe, -0.25); ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x - 50, -270); ctx.quadraticCurveTo(x - 20, -250, x, -270); ctx.quadraticCurveTo(x + 20, -250, x + 50, -270); ctx.stroke(); }
    const panel = (s) => (k) => { k.moveTo(s * 100, -328); k.quadraticCurveTo(s * 132, -210, s * 150, -70); k.lineTo(x + s * 60, -64); k.quadraticCurveTo(x + s * 50, -200, x + s * 54, -332); k.closePath(); };
    for (const s of [-1, 1]) clipTorso(ctx, () => T.outlined(ctx, panel(s), v, { shade: (k) => { k.fillStyle = shade(v, -0.2); k.fillRect(s < 0 ? -170 : 120, -340, 60, 300); } }));
    if (view !== 'back') for (const s of [-1, 1]) for (let i = 0; i < 9; i++) { const t = i / 8; T.outlined(ctx, (k) => circ(k, x + s * T.lerp(54, 60, t) - s * 4 * (t * (1 - t)), T.lerp(-326, -74, t), 15), f, { line: 5 }); }
    clipTorso(ctx, () => { ctx.fillStyle = shade(c.legColor ?? '#6a4a2a', 0); ctx.fillRect(-180, -96, 360, 60); });
    if (view === 'back') return;
    ctx.strokeStyle = P.ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 50, -330); ctx.quadraticCurveTo(x, -280, x + 50, -330); ctx.stroke();
    for (let i = -2; i <= 2; i++) { const tx = x + i * 18, ty = -300 + Math.abs(i) * -6 + 4; T.outlined(ctx, (k) => { k.moveTo(tx - 6, ty); k.lineTo(tx + 6, ty); k.lineTo(tx, ty + 18); k.closePath(); }, '#f6f2e6', { line: 3 }); }
  };
  O.stripes = (ctx, c) => clipTorso(ctx, () => { ctx.fillStyle = c.stripeColor ?? '#1d1d1d'; for (let y = -330; y < -40; y += 54) ctx.fillRect(-180, y, 360, 26); });
  O.boxers = (ctx, c, view) => { // bare torso + white shorts with red dots and a waistband
    const w = c.shortsColor ?? '#f8f6f0', d = c.dotColor ?? '#e05a6a', r = T.rng(T.hash('boxers'));
    if (view !== 'back') { ctx.strokeStyle = shade(c.robe, -0.22); ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(nx(view) - 30, -270, 26, 0.2, 2.6); ctx.arc(nx(view) + 40, -270, 26, 0.5, 2.9); ctx.stroke(); T.outlined(ctx, (k) => circ(k, nx(view) + 4, -200, 5), shade(c.robe, -0.3), { line: 3 }); }
    clipTorso(ctx, () => {
      ctx.fillStyle = P.ink; ctx.fillRect(-180, -176, 360, 130); ctx.fillStyle = w; ctx.fillRect(-180, -170, 360, 130);
      ctx.fillStyle = d; for (let i = 0; i < 16; i++) { ctx.beginPath(); ctx.arc(-150 + r() * 300, -150 + r() * 90, 8, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = shade(w, -0.12); ctx.fillRect(-180, -170, 360, 18); ctx.fillStyle = shade(w, -0.2); ctx.fillRect(view === 'front' ? 90 : -180, -152, 90, 120);
    });
  };
  O['cow-suit'] = (ctx, c, view) => { // spotted onesie with a bell on the collar (ears/horns/muzzle are face extras)
    const sp = c.spotColor ?? '#1e1c1e', r = T.rng(T.hash('cow' + (c.spotSeed ?? '')));
    clipTorso(ctx, () => { ctx.fillStyle = sp; for (let i = 0; i < 6; i++) { ctx.beginPath(); T.smoothPath(ctx, T.blobPts(-120 + r() * 240, -300 + r() * 220, 30 + r() * 20, 22 + r() * 14, 'cs' + i + (c.spotSeed ?? ''), 7, 0.3)); ctx.fill(); } });
    if (view === 'back') return;
    ctx.strokeStyle = P.ink; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(-90, -328); ctx.quadraticCurveTo(0, -300, 100, -328); ctx.stroke(); ctx.strokeStyle = '#8a3a2a'; ctx.lineWidth = 9; ctx.stroke();
    T.outlined(ctx, (k) => { k.moveTo(nx(view) - 20, -314); k.lineTo(nx(view) + 20, -314); k.lineTo(nx(view) + 30, -270); k.quadraticCurveTo(nx(view), -262, nx(view) - 30, -270); k.closePath(); }, '#e2b23c', { line: 5 });
  };
  O.gown = (ctx, c, view) => folds(ctx, shade(c.robe, -0.16), view === 'back' ? [] : [[-60, -220, -80, -140, -110, -76], [0, -220, 0, -140, -4, -64], [60, -220, 74, -140, 100, -76]]);
  O.tracht = (ctx, c, view) => { // cream shirt, green suspenders with yellow stitch, leather shorts
    const sus = c.suspenders ?? '#3d8a3a', lea = c.shortsColor ?? '#6a4a2a', x = nx(view) * 0.6;
    clipTorso(ctx, () => { ctx.fillStyle = P.ink; ctx.fillRect(-180, -176, 360, 130); ctx.fillStyle = lea; ctx.fillRect(-180, -170, 360, 130); ctx.fillStyle = shade(lea, -0.22); ctx.fillRect(view === 'front' ? 80 : -180, -170, 100, 130); });
    for (const s of [-1, 1]) {
      const path = () => { ctx.beginPath(); ctx.moveTo(x + s * 70, -334); ctx.lineTo(x + s * 50, -176); };
      ctx.strokeStyle = P.ink; ctx.lineWidth = 32; path(); ctx.stroke(); ctx.strokeStyle = sus; ctx.lineWidth = 22; path(); ctx.stroke();
      ctx.strokeStyle = '#e0c040'; ctx.lineWidth = 3; ctx.setLineDash([8, 8]); path(); ctx.stroke(); ctx.setLineDash([]);
    }
    if (view !== 'back') T.outlined(ctx, (k) => T.rrect(k, x - 70, -262, 140, 26, 6), sus, { line: 6 });
  };
  O['party-tunic'] = (ctx, c, view) => { // plain high-collar tunic: stand collar, four flap pockets, button row
    const x = nx(view), sd = shade(c.robe, -0.18);
    T.outlined(ctx, (k) => T.rrect(k, x - 60, -350, 120, 32, 10), sd, { line: 6 });
    if (view === 'back') return;
    for (const [px, py] of [[-56, -296], [56, -296], [-62, -170], [62, -170]]) { T.outlined(ctx, (k) => T.rrect(k, x + px - 28, py, 56, 52, 6), shade(c.robe, -0.06), { line: 5 }); T.outlined(ctx, (k) => T.rrect(k, x + px - 30, py - 4, 60, 18, 5), sd, { line: 5 }); }
    buttons(ctx, x, [-300, -260, -220, -180, -140], shade(c.robe, -0.4), 7);
  };
  O['judge-robe'] = (ctx, c, view) => { // black robe with white bib tabs at the collar
    if (view === 'back') return;
    const x = nx(view);
    for (const s of [-1, 1]) T.outlined(ctx, (k) => T.rrect(k, x + s * 11 - 8, -332, 16, 46, 3), '#f6f4ee', { line: 4 });
  };

  // Back pieces drawn behind the body and legs: frock-coat tails, dress veil cape, bridal veil.
  T.BEAN_UNDER = T.BEAN_UNDER || [];
  T.BEAN_UNDER.push((ctx, c, view) => {
    if (c.outfit === 'frockcoat') for (const s of view === 'front' ? [-1, 1] : [-1]) T.outlined(ctx, (k) => { k.moveTo(s * 60, -180); k.lineTo(s * 150, -130); k.lineTo(s * 130 + (s < 0 ? -30 : 30), -26); k.lineTo(s * 40, -110); k.closePath(); }, shade(c.robe, -0.1), { line: 7 });
    const veil = c.outfit === 'gown' ? c.veilColor ?? '#e6eef4' : c.outfit === 'dress' && c.veilColor ? c.veilColor : null;
    if (!veil) return;
    iso(ctx, () => {
      if (c.outfit === 'gown') ctx.globalAlpha *= 0.55;
      const back = view === 'front' ? 0 : -40;
      T.outlined(ctx, (k) => { k.moveTo(-140 + back, -600); k.quadraticCurveTo(-240 + back, -350, -210 + back, -110); k.quadraticCurveTo(back, -80, 190 + back, -120); k.quadraticCurveTo(220 + back, -360, 120 + back, -600); k.closePath(); }, veil, { line: 6, shade: (k) => { k.fillStyle = shade(veil, -0.15); k.fillRect(-260 + back, -620, 120, 540); } });
    });
  });

  // ---- hair -------------------------------------------------------------------------------------------------------
  const HK = T.HAIR_KINDS || (T.HAIR_KINDS = {});
  const hcol = (c, def) => c.hairColor ?? def ?? P.hair;
  const builtin = (ctx, c, kind, seed, sh, view) => T.BEAN_HEAD.hairFront(ctx, { ...c, hair: kind }, seed, sh, view);
  const backView = (ctx, c, view) => { if (view === 'back') { T.BEAN_HEAD.hairBackView(ctx, c); return true; } return false; };
  const plait = (ctx, col, x0, y0, y1, n = 5) => {
    for (let i = 0; i < n; i++) { const t = i / (n - 1), y = T.lerp(y0, y1, t); T.outlined(ctx, (k) => ell(k, x0 + Math.sin(i * 1.4) * 3, y, 19 - t * 3, 15), col, { line: 6, shade: (k) => { k.fillStyle = shade(col, -0.2); k.fillRect(x0 - 30, y + 4, 60, 20); } }); }
    T.outlined(ctx, (k) => T.rrect(k, x0 - 14, y1 + 12, 28, 12, 4), '#c8323a', { line: 4 });
    T.outlined(ctx, (k) => { k.moveTo(x0 - 12, y1 + 24); k.lineTo(x0 + 12, y1 + 24); k.lineTo(x0 + 6, y1 + 56); k.lineTo(x0 - 6, y1 + 56); k.closePath(); }, col, { line: 5 });
  };
  HK.braids = {
    back: (ctx, c, seed, sh) => plait(ctx, hcol(c), -122 - sh * 40, -410, -250),
    front: (ctx, c, seed, sh, view) => { if (backView(ctx, c, view)) return; builtin(ctx, c, 'short', seed, sh, view); if (sh < 0.4) plait(ctx, hcol(c), view === 'front' ? 128 : 112 + sh * 40, -400, -250); },
  };
  const curlRing = (c, seed, from, to, n, rad, rr, cx, cy, ry) => { const r = T.rng(T.hash(seed + 'cb' + from)), out = []; for (let i = 0; i < n; i++) { const a = T.lerp(from, to, i / (n - 1)) * D; out.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * ry, rr + r() * 20]); } return out; };
  HK['curly-big'] = {
    back: (ctx, c, seed, sh) => lumps(ctx, curlRing(c, seed, 120, 420, 9, 170, 60, -sh * 60, -470, 170).concat([[-sh * 60, -520, 150]]), hcol(c)),
    front: (ctx, c, seed, sh, view) => { if (backView(ctx, c, view)) return; lumps(ctx, curlRing(c, seed, 205 - sh * 30, 330 - sh * 50, 5, 140, 36, -sh * 30, -470, 120), hcol(c)); },
  };
  HK.volute = {
    back: (ctx, c, seed, sh) => { const col = hcol(c), b = -sh * 70; T.outlined(ctx, (k) => { k.moveTo(-150 + b, -560); for (let i = 0; i <= 4; i++) k.quadraticCurveTo(-230 + b + (i % 2) * 30, -500 + i * 85, -200 + b + (i % 2 ? -10 : 10), -470 + i * 85); k.lineTo(-200 + b, -150); k.quadraticCurveTo(b, -120, 190 + b * 0.2, -150); for (let i = 4; i >= 0; i--) k.quadraticCurveTo(220 + b * 0.2 - (i % 2) * 30, -500 + i * 85, 190 + b * 0.2, -540 + i * 85); k.closePath(); }, col, { shade: (k) => { k.fillStyle = shade(col, -0.2); k.fillRect(-260 + b, -560, 120, 440); k.strokeStyle = shade(col, -0.28); k.lineWidth = 5; for (let i = 0; i < 4; i++) { k.beginPath(); k.moveTo(-120 + b + i * 80, -330); k.quadraticCurveTo(-140 + b + i * 80, -240, -110 + b + i * 80, -160); k.stroke(); } } }); },
    front: (ctx, c, seed, sh, view) => { if (backView(ctx, c, view)) return; builtin(ctx, c, 'short', seed, sh, view); const g = c.headColor3 ?? '#d39a2a'; (sh > 0.3 ? [-1] : [-1, 1]).forEach((s) => { const x = s < 0 ? -146 - sh * 10 : 146; T.outlined(ctx, (k) => circ(k, x, -470, 22), g, { line: 5, shade: (k) => { k.fillStyle = shade(g, -0.4); k.beginPath(); k.arc(x, -470, 8, 0, Math.PI * 2); k.fill(); } }); }); },
  };
  HK['long-straight'] = {
    back: (ctx, c, seed, sh) => { const col = hcol(c), b = -sh * 70, f = 160 - sh * 120; T.outlined(ctx, (k) => { k.moveTo(-160 + b, -560); k.quadraticCurveTo(-200 + b, -440, -186 + b, -316); k.quadraticCurveTo(-120 + b, -296, -60 + b * 0.5, -318); k.lineTo(f - 10, -318); k.quadraticCurveTo(f + 24, -330, f + 20, -440); k.lineTo(f, -560); k.closePath(); }, col, { shade: (k) => { k.fillStyle = shade(col, -0.2); k.fillRect(-240 + b, -560, 100, 260); } }); },
    front: (ctx, c, seed, sh, view) => {
      if (backView(ctx, c, view)) return;
      const col = hcol(c), px = sh * HW * 0.4;
      iso(ctx, () => {
        ctx.beginPath(); T.BEAN_HEAD.headPathS(ctx, 1.07); ctx.clip();
        T.outlined(ctx, (k) => { k.moveTo(-200, -700); k.lineTo(200, -700); k.lineTo(200, view === 'front' ? -420 : -480); k.quadraticCurveTo(px + 90, -520, px, -580); k.quadraticCurveTo(px - 90, -520, view === 'front' ? -200 : -120, view === 'front' ? -420 : -400); k.lineTo(-200, -380); k.closePath(); }, col, { shade: (k) => { k.fillStyle = shade(col, 0.15); k.beginPath(); k.ellipse(px + 50, -600, 60, 16, -0.2, 0, Math.PI * 2); k.fill(); } });
      });
    },
  };
  HK.ponytail = {
    back: (ctx, c, seed, sh) => { const col = hcol(c), st = T.charsState && T.charsState(c), sw = st ? Math.sin(st.lt * 2.4) * 4 : 0; iso(ctx, () => { ctx.translate(-70 - sh * 40, -610); ctx.rotate(sw * D); T.outlined(ctx, (k) => { k.moveTo(-10, -20); k.quadraticCurveTo(-170, -40, -150, 160); k.quadraticCurveTo(-140, 260, -110, 290); k.quadraticCurveTo(-100, 200, -70, 130); k.quadraticCurveTo(-40, 40, 30, 20); k.closePath(); }, col, { shade: (k) => { k.fillStyle = shade(col, -0.2); k.fillRect(-200, 100, 80, 200); } }); T.outlined(ctx, (k) => ell(k, 0, 0, 26, 20, -0.4), c.headColor3 ?? '#c8323a', { line: 5 }); }); },
    front: (ctx, c, seed, sh, view) => { if (backView(ctx, c, view)) return; builtin(ctx, c, 'short', seed, sh, view); },
  };
  const tufts = (ctx, col, seed, from, to, n, r0, r1, cx, cy, rad) => {
    const r = T.rng(T.hash(seed + 'tuft' + from));
    const tf = Array.from({ length: n }, () => [r(), r(), r()]); // drawn before T.outlined: its path runs twice
    T.outlined(ctx, (k) => {
      for (let i = 0; i < n; i++) {
        const a = T.lerp(from, to, i / (n - 1)) * D, len = r0 + tf[i][0] * (r1 - r0), w = 0.22 + tf[i][1] * 0.1;
        const bx = cx + Math.cos(a) * rad, by = cy + Math.sin(a) * rad;
        k.moveTo(cx + Math.cos(a - w) * rad * 0.8, cy + Math.sin(a - w) * rad * 0.8);
        k.lineTo(bx + Math.cos(a + (tf[i][2] - 0.5) * 0.5) * len, by + Math.sin(a + (tf[i][2] - 0.5) * 0.5) * len);
        k.lineTo(cx + Math.cos(a + w) * rad * 0.8, cy + Math.sin(a + w) * rad * 0.8); k.closePath();
      }
      k.moveTo(cx + rad, cy); k.arc(cx, cy, rad * 0.98, 0, Math.PI * 2);
    }, col, { shade: (k) => { k.fillStyle = shade(col, -0.2); k.fillRect(cx - rad * 2, cy + rad * 0.3, rad * 4, rad * 2); } });
  };
  HK.wild = {
    back: (ctx, c, seed, sh) => tufts(ctx, hcol(c, '#c8c8c8'), seed, 130, 410, 9, 50, 85, -sh * 50, -480, 150),
    front: (ctx, c, seed, sh, view) => { const cc = { ...c, hairColor: hcol(c, '#c8c8c8') }; if (backView(ctx, cc, view)) return; builtin(ctx, cc, 'short', seed, sh, view); },
  };
  HK.spikes = {
    back: (ctx, c, seed, sh) => tufts(ctx, hcol(c), seed, 150, 390, 11, 70, 100, -sh * 30, -470, 148),
    front: (ctx, c, seed, sh, view) => { if (backView(ctx, c, view)) return; builtin(ctx, c, 'short', seed, sh, view); },
  };

  // ---- beards -----------------------------------------------------------------------------------------------------
  const BK = T.BEARD_KINDS || (T.BEARD_KINDS = {});
  BK.bushy = (ctx, c, fx, view) => { // cloud of scallops over the jaw; mouth is drawn on top
    if (view === 'back') return;
    const col = c.beardColor ?? c.hairColor ?? '#3a2e2a', o = fx * 0.6, list = [];
    for (let i = 0; i < 7; i++) { const a = (10 + i * 26.7) * D; list.push([o + Math.cos(a) * 140, -400 + Math.sin(a) * 110, 50]); }
    list.push([o, -360, 110]);
    iso(ctx, () => { ctx.beginPath(); ctx.rect(-400, -436, 800, 400); ctx.clip(); lumps(ctx, list, col, false); });
    ctx.strokeStyle = c.beardHi ?? shade(col, 0.22); ctx.lineWidth = 6; ctx.lineCap = 'round';
    [[-80, -330], [-30, -300], [40, -305], [90, -340]].forEach(([x, y]) => { ctx.beginPath(); ctx.moveTo(o + x - 10, y - 14); ctx.quadraticCurveTo(o + x + 6, y - 4, o + x, y + 12); ctx.stroke(); });
  };
})();
