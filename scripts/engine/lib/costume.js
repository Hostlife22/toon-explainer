// costume.js — headwear registry T.HEADWEAR used by face.js (look.head). Every entry is view-aware: `sh` is the 3/4
// face shift (0 front/back, 0.24 three-quarter, 0.42 side), so visors and fringes sit on the face side and masses lean
// to the back of the head. Head units: centre (0,-450), half-width 150, crown top -604. Colors: headColor / headColor2.
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL;
  const HW = 150;
  const shade = (c, k) => T.shade(c, k);

  // Shared pieces -------------------------------------------------------------------------------------------------
  const brim = (ctx, cx, cy, rx, ry, col) => T.outlined(ctx, (k) => k.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2), col, { shade: (k) => { k.fillStyle = shade(col, -0.25); k.fillRect(cx - rx, cy, rx * 2, ry); } });
  const dome = (ctx, cx, base, w, h, col, hi = true) => T.outlined(ctx, (k) => { k.moveTo(cx - w, base); k.bezierCurveTo(cx - w, base - h * 1.35, cx + w, base - h * 1.35, cx + w, base); k.closePath(); }, col, {
    shade: (k) => { k.fillStyle = shade(col, -0.2); k.beginPath(); k.ellipse(cx - w * 0.75, base - h * 0.3, w * 0.45, h, 0, 0, Math.PI * 2); k.fill(); if (hi) { k.fillStyle = shade(col, 0.3); k.beginPath(); k.ellipse(cx + w * 0.2, base - h * 0.8, w * 0.32, h * 0.14, -0.3, 0, Math.PI * 2); k.fill(); } },
  });
  // Visor: a dark crescent that reaches toward the face side.
  const visor = (ctx, sh, y, w, col = '#1c1a18') => { const cx = sh * HW * 1.1; T.outlined(ctx, (k) => { k.moveTo(cx - w, y); k.quadraticCurveTo(cx + sh * 60, y + 46, cx + w + sh * 90, y + 6); k.quadraticCurveTo(cx, y + 14, cx - w, y); k.closePath(); }, col, { line: 7 }); };
  const band = (ctx, y0, y1, col, inset = 0) => T.outlined(ctx, (k) => { k.moveTo(-HW - 8 + inset, y1); k.quadraticCurveTo(0, y1 + 16, HW + 8 - inset, y1); k.lineTo(HW + 4 - inset, y0); k.quadraticCurveTo(0, y0 + 14, -HW - 4 + inset, y0); k.closePath(); }, col, { line: 7 });
  const badge = (ctx, x, y, r, col = P.gold) => T.outlined(ctx, (k) => k.arc(x, y, r, 0, Math.PI * 2), col, { line: 5 });

  const H = {};

  // Existing kinds (moved from face.js, unchanged look) --------------------------------------------------------------
  H.crown = (ctx, c, lt, sh) => {
    const g = c.headColor ?? P.gold;
    T.outlined(ctx, (k) => { k.moveTo(-112, -568); k.lineTo(-130, -680); k.lineTo(-70, -618); k.lineTo(-30, -700); k.lineTo(10, -622); k.lineTo(60, -698); k.lineTo(88, -616); k.lineTo(138, -672); k.lineTo(118, -568); k.closePath(); }, g, { shade: (k) => { k.fillStyle = shade(g, -0.2); k.fillRect(40, -720, 120, 170); } });
    [[-130, -686], [-30, -706], [60, -704], [138, -678]].forEach(([x, y]) => T.outlined(ctx, (k) => k.arc(x, y, 13, 0, Math.PI * 2), g, { line: 6 }));
    T.outlined(ctx, (k) => k.arc(sh * 40, -592, 16, 0, Math.PI * 2), c.headColor2 ?? P.red, { line: 6 });
  };
  H.laurel = (ctx, c, lt, sh) => {
    const g = c.headColor ?? '#6f9a3a', back = -sh * 30;
    for (const s of [-1, 1]) for (let i = 0; i < 6; i++) {
      const a = (200 + i * 22) * T.DEG, x = s * Math.cos(a) * -160 + back, y = -476 + Math.sin(a) * 150;
      ctx.save(); ctx.translate(x, y); ctx.rotate(s * (a + Math.PI / 2.4));
      T.outlined(ctx, (k) => k.ellipse(0, 0, 34, 15, 0, 0, Math.PI * 2), g, { line: 6 });
      ctx.restore();
    }
  };
  H.helmet = (ctx, c, lt, sh) => {
    const m = c.headColor ?? '#a9aeb4', back = -sh * 30;
    T.outlined(ctx, (k) => { k.moveTo(-166, -430); k.quadraticCurveTo(-172, -628, 0, -630); k.quadraticCurveTo(172, -628, 166, -430); k.lineTo(132 + sh * 20, -452); k.quadraticCurveTo(sh * 60, -525, -132 + sh * 30, -452); k.closePath(); }, m,
      { shade: (k) => { k.fillStyle = shade(m, -0.18); k.beginPath(); k.ellipse(-150, -520, 90, 150, 0, 0, Math.PI * 2); k.fill(); k.fillStyle = shade(m, 0.35); k.beginPath(); k.ellipse(30, -590, 50, 20, -0.3, 0, Math.PI * 2); k.fill(); } });
    const guards = sh > 0 ? [-HW * 0.98] : [-HW * 0.98, HW * 0.98 - 46]; // in 3/4 only the back cheek guard shows
    guards.forEach((gx) => T.outlined(ctx, (k) => T.rrect(k, gx, -478, 46, 128, 20), m, { line: 7 }));
    const crest = c.crest ?? P.red, sway = Math.sin(lt * 3) * 4;
    T.outlined(ctx, (k) => { k.moveTo(-130 + back, -605); k.quadraticCurveTo(back + sway, -780, 140 + back, -615); k.quadraticCurveTo(back, -690, -130 + back, -605); }, crest,
      { shade: (k) => { k.strokeStyle = shade(crest, -0.25); k.lineWidth = 5; for (let i = -4; i <= 4; i++) { k.beginPath(); k.moveTo(back + i * 26, -640); k.lineTo(back + i * 30, -740); k.stroke(); } } });
  };
  H.hood = (ctx, c, lt, sh, kind) => {
    const h = c.headColor ?? (kind === 'pontifex' ? '#f1eadb' : '#7d7a3e'), ox = sh * 50;
    T.outlined(ctx, (k) => { T.rrect(k, -190 - ox * 0.3, -652, 380, 410, 170); k.moveTo(130 + ox, -445); k.ellipse(ox, -445, 132, 128, 0, 0, Math.PI * 2, true); }, h,
      { shade: (k) => { k.fillStyle = shade(h, -0.22); k.fillRect(-230, -660, 140, 420); } });
  };
  H.pontifex = (ctx, c, lt, sh) => H.hood(ctx, c, lt, sh, 'pontifex');
  H.headband = (ctx, c) => { ctx.strokeStyle = c.headColor ?? '#e9e2d2'; ctx.lineWidth = 13; ctx.beginPath(); ctx.moveTo(-152, -540); ctx.quadraticCurveTo(0, -590, 152, -540); ctx.stroke(); };
  H.hat = (ctx, c) => {
    const h = c.headColor ?? '#b89a72';
    T.outlined(ctx, (k) => k.ellipse(0, -560, 230, 40, 0, 0, Math.PI * 2), h);
    T.outlined(ctx, (k) => { k.moveTo(-130, -566); k.quadraticCurveTo(-130, -690, 0, -690); k.quadraticCurveTo(130, -690, 130, -566); k.closePath(); }, h, { shade: (k) => { k.fillStyle = shade(h, -0.3); k.fillRect(-140, -600, 280, 30); } });
  };

  // Military: WWI / WWII / medieval ------------------------------------------------------------------------------------
  H.brodie = (ctx, c) => { // shallow dome + wide flat brim (tin hat)
    const m = c.headColor ?? '#6b6a3e';
    ctx.strokeStyle = shade(m, -0.4); ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-128, -565); ctx.quadraticCurveTo(-142, -420, -96, -330); ctx.stroke(); // chin strap
    brim(ctx, 0, -585, 196, 30, m);
    dome(ctx, 0, -588, 104, 70, m);
  };
  H.pickelhaube = (ctx, c, lt, sh) => { // tall leather dome over the forehead, front visor, brass spike
    const m = c.headColor ?? '#2e2a26', b = c.headColor2 ?? '#d4a83a';
    T.outlined(ctx, (k) => { k.moveTo(-160, -470); k.quadraticCurveTo(-170, -668, 0, -672); k.quadraticCurveTo(170, -668, 160, -470); k.quadraticCurveTo(sh * 80, -540, -160, -470); k.closePath(); }, m, { shade: (k) => { k.fillStyle = shade(m, 0.25); k.beginPath(); k.ellipse(20, -630, 60, 18, -0.3, 0, Math.PI * 2); k.fill(); } });
    visor(ctx, sh, -512, 80);
    T.outlined(ctx, (k) => { k.moveTo(-24, -664); k.lineTo(24, -664); k.lineTo(6, -748); k.lineTo(-6, -748); k.closePath(); }, b, { line: 6 });
    T.outlined(ctx, (k) => k.ellipse(0, -664, 38, 12, 0, 0, Math.PI * 2), b, { line: 5 });
    badge(ctx, sh * 110, -580, 24, b);
  };
  H.adrian = (ctx, c) => { // horizon-blue dome with a crest ridge and narrow brim
    const m = c.headColor ?? '#6d84a8';
    brim(ctx, 0, -584, 170, 22, m);
    dome(ctx, 0, -588, 112, 76, m);
    T.outlined(ctx, (k) => k.ellipse(0, -676, 22, 36, 0, 0, Math.PI * 2), m, { line: 6 });
  };
  H.dome = (ctx, c, lt, sh) => { // generic WWII dome helmet: deep bowl with a flared lip at the back and sides
    const m = c.headColor ?? '#5a6048';
    T.outlined(ctx, (k) => { k.moveTo(-178, -440); k.quadraticCurveTo(-190, -680, 0, -684); k.quadraticCurveTo(190, -680, 172, -470); k.lineTo(150 + sh * 30, -500); k.quadraticCurveTo(sh * 70, -548, -150, -500); k.closePath(); }, m,
      { shade: (k) => { k.fillStyle = shade(m, -0.2); k.beginPath(); k.ellipse(-150, -540, 80, 150, 0, 0, Math.PI * 2); k.fill(); k.fillStyle = shade(m, 0.28); k.beginPath(); k.ellipse(30, -640, 60, 18, -0.25, 0, Math.PI * 2); k.fill(); } });
  };
  H['officer-cap'] = (ctx, c, lt, sh) => { // wide flat crown, contrasting band, black visor, badge
    const m = c.headColor ?? '#2f3554', b = c.headColor2 ?? '#c8323a';
    band(ctx, -612, -560, b);
    T.outlined(ctx, (k) => k.ellipse(-sh * 20, -628, 196, 52, -0.04, 0, Math.PI * 2), m, { shade: (k) => { k.fillStyle = shade(m, -0.25); k.fillRect(-220, -628, 440, 60); } });
    visor(ctx, sh, -566, 100);
    badge(ctx, sh * 100, -604, 20, P.gold);
  };
  H.kepi = (ctx, c, lt, sh) => {
    const m = c.headColor ?? '#b8262a', b = c.headColor2 ?? '#2f3554';
    T.outlined(ctx, (k) => { k.moveTo(-122, -566); k.lineTo(-104, -700); k.lineTo(104 + sh * 30, -710); k.lineTo(122, -566); k.closePath(); }, m, { shade: (k) => { k.fillStyle = b; k.fillRect(-140, -600, 280, 40); } });
    T.outlined(ctx, (k) => k.ellipse(sh * 15, -705, 104, 20, -0.05, 0, Math.PI * 2), m, { line: 6 });
    visor(ctx, sh, -568, 90);
  };
  H.fez = (ctx, c, lt, sh) => {
    const m = c.headColor ?? '#b8262a', back = -sh * 120 - 30;
    T.outlined(ctx, (k) => { k.moveTo(-104, -572); k.lineTo(-84, -700); k.lineTo(84, -700); k.lineTo(104, -572); k.quadraticCurveTo(0, -556, -104, -572); k.closePath(); }, m, { shade: (k) => { k.fillStyle = shade(m, -0.25); k.fillRect(-120, -700, 70, 140); } });
    ctx.strokeStyle = P.ink; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, -700); ctx.quadraticCurveTo(back, -690, back - 10, -620); ctx.stroke();
    T.outlined(ctx, (k) => T.rrect(k, back - 22, -626, 24, 46, 10), c.headColor2 ?? '#1c1a18', { line: 5 });
  };
  H.ushanka = (ctx, c, lt, sh) => {
    const fur = c.headColor ?? '#8a8580', top = c.headColor2 ?? '#5a4a3a';
    for (const s of [-1, 1]) if (!(sh > 0 && s > 0)) T.outlined(ctx, (k) => T.rrect(k, s * HW - 36 - (s < 0 ? 10 : 0), -560, 72, 190, 30), fur, { line: 7 }); // ear flaps
    T.outlined(ctx, (k) => { k.moveTo(-160, -580); k.quadraticCurveTo(-170, -712, 0, -716); k.quadraticCurveTo(170, -712, 160, -580); k.closePath(); }, top);
    T.outlined(ctx, (k) => T.rrect(k, -176, -626, 352, 70, 32), fur, { shade: (k) => { k.strokeStyle = shade(fur, -0.3); k.lineWidth = 4; for (let x = -160; x < 170; x += 22) { k.beginPath(); k.moveTo(x, -620); k.lineTo(x + 8, -566); k.stroke(); } } });
  };
  H['great-helm'] = (ctx, c, lt, sh) => { // flat-topped cylinder over the whole head, eye slit and breath cross
    const m = c.headColor ?? '#5a5a60', fx = sh * HW;
    T.outlined(ctx, (k) => T.rrect(k, -168, -650, 336, 360, 46), m, { shade: (k) => { k.fillStyle = shade(m, -0.22); k.fillRect(-180, -660, 110, 380); k.fillStyle = shade(m, 0.3); k.fillRect(fx - 20, -650, 24, 360); } });
    ctx.fillStyle = '#121214';
    ctx.fillRect(fx - 130, -486, 260, 20); // eye slit
    ctx.fillRect(fx - 8, -460, 16, 110); ctx.fillRect(fx - 50, -420, 100, 14); // breath cross
    ctx.strokeStyle = P.ink; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-168, -600); ctx.lineTo(168, -600); ctx.stroke();
  };
  H['nasal-helm'] = (ctx, c, lt, sh) => { // conical spangenhelm with a rim ring and nose bar
    const m = c.headColor ?? '#b8b8bc', fx = sh * HW;
    T.outlined(ctx, (k) => { k.moveTo(-160, -520); k.quadraticCurveTo(-150, -650, sh * 30, -710); k.quadraticCurveTo(150, -650, 160, -520); k.closePath(); }, m, { shade: (k) => { k.fillStyle = shade(m, -0.22); k.beginPath(); k.ellipse(-130, -590, 70, 110, 0, 0, Math.PI * 2); k.fill(); } });
    band(ctx, -548, -514, shade(m, -0.15), 6);
    T.outlined(ctx, (k) => T.rrect(k, fx - 12, -530, 24, 120, 8), shade(m, -0.1), { line: 6 });
  };
  H.turban = (ctx, c, lt, sh) => { // 3-4 stacked wraps bulging toward the back; optional face veil
    const m = c.headColor ?? '#e9e2cf', back = -sh * 40;
    for (let i = 0; i < 4; i++) {
      const y = -560 - i * 38, w = 176 - i * 20;
      T.outlined(ctx, (k) => k.ellipse(back * (1 + i * 0.25), y, w, 46, (i % 2 ? 0.08 : -0.06), 0, Math.PI * 2), i % 2 ? shade(m, -0.08) : m, { line: 7 });
    }
    if (c.headColor2) T.outlined(ctx, (k) => k.arc(sh * 90, -600, 18, 0, Math.PI * 2), c.headColor2, { line: 5 }); // jewel
    if (c.veil) { // drawn after the face: covers mouth and chin
      const v = typeof c.veil === 'string' ? c.veil : '#3a3a40', fx = sh * HW;
      ctx.save(); ctx.beginPath(); T.BEAN_HEAD.headPath(ctx); ctx.clip();
      T.outlined(ctx, (k) => { k.moveTo(-200, -430); k.quadraticCurveTo(fx, -446, 200, -430); k.lineTo(200, -280); k.lineTo(-200, -280); k.closePath(); }, v, { shade: (k) => { k.fillStyle = shade(v, -0.25); k.fillRect(-200, -430, 90, 160); } });
      ctx.restore();
    }
  };

  // Civilian: 1800s-1900s --------------------------------------------------------------------------------------------
  H.tophat = (ctx, c) => {
    const m = c.headColor ?? '#1e1c1e';
    brim(ctx, 0, -578, 176, 30, m);
    T.outlined(ctx, (k) => T.rrect(k, -112, -830, 224, 256, 14), m, { shade: (k) => { k.fillStyle = c.headColor2 ?? '#8a1f27'; k.fillRect(-120, -620, 240, 34); k.fillStyle = shade(m, 0.25); k.fillRect(30, -820, 30, 190); } });
  };
  H.bowler = (ctx, c) => {
    const m = c.headColor ?? '#2a2624';
    brim(ctx, 0, -580, 168, 26, m);
    dome(ctx, 0, -584, 122, 88, m);
    T.outlined(ctx, (k) => T.rrect(k, -122, -604, 244, 22, 8), c.headColor2 ?? shade(m, -0.3), { line: 5 });
  };
  H.fedora = (ctx, c, lt, sh) => {
    const m = c.headColor ?? '#5a4a3c';
    T.outlined(ctx, (k) => k.ellipse(sh * 20, -580, 214, 36, -0.05, 0, Math.PI * 2), m, { shade: (k) => { k.fillStyle = shade(m, -0.25); k.fillRect(-230, -580, 460, 40); } });
    T.outlined(ctx, (k) => { k.moveTo(-126, -588); k.quadraticCurveTo(-136, -700, -40, -706); k.quadraticCurveTo(0, -680, 40, -706); k.quadraticCurveTo(136, -700, 126, -588); k.closePath(); }, m);
    T.outlined(ctx, (k) => T.rrect(k, -128, -616, 256, 28, 8), c.headColor2 ?? '#1c1814', { line: 5 });
  };
  H.beret = (ctx, c, lt, sh) => {
    const m = c.headColor ?? '#2a2a3a';
    T.outlined(ctx, (k) => k.ellipse(-30 - sh * 40, -600, 182, 60, -0.18, 0, Math.PI * 2), m, { shade: (k) => { k.fillStyle = shade(m, 0.2); k.beginPath(); k.ellipse(-10, -630, 90, 18, -0.2, 0, Math.PI * 2); k.fill(); } });
    T.outlined(ctx, (k) => T.rrect(k, -36, -676, 14, 22, 6), m, { line: 5 });
  };
  H.safari = (ctx, c) => {
    const m = c.headColor ?? '#c9b48a';
    brim(ctx, 0, -572, 206, 40, m);
    dome(ctx, 0, -580, 126, 96, m);
    T.outlined(ctx, (k) => T.rrect(k, -128, -604, 256, 22, 8), c.headColor2 ?? '#8a5a32', { line: 5 });
  };
  H['newsboy-cap'] = (ctx, c, lt, sh) => {
    const m = c.headColor ?? '#6b5a48';
    T.outlined(ctx, (k) => k.ellipse(sh * 60, -606, 190, 62, -0.05, 0, Math.PI * 2), m, { shade: (k) => { k.strokeStyle = shade(m, -0.3); k.lineWidth = 4; for (let i = -2; i <= 2; i++) { k.beginPath(); k.moveTo(i * 40 - 30, -660); k.quadraticCurveTo(i * 50, -610, i * 60 + 30, -560); k.stroke(); } } });
    visor(ctx, sh, -572, 80, shade(m, -0.15));
    T.outlined(ctx, (k) => k.arc(sh * 40, -664, 12, 0, Math.PI * 2), m, { line: 5 });
  };
  H.graduation = (ctx, c, lt) => {
    const m = c.headColor ?? '#1e1c1e', sw = Math.sin(lt * 3) * 6;
    T.outlined(ctx, (k) => T.rrect(k, -120, -640, 240, 80, 14), m);
    T.outlined(ctx, (k) => { k.moveTo(-230, -650); k.lineTo(0, -700); k.lineTo(230, -650); k.lineTo(0, -604); k.closePath(); }, m);
    ctx.strokeStyle = c.headColor2 ?? P.gold; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(0, -652); ctx.lineTo(150, -646); ctx.lineTo(160 + sw, -560); ctx.stroke();
  };
  H.jester = (ctx, c, lt) => { // three floppy points ending in bells
    const cols = [c.headColor ?? '#c8323a', c.headColor2 ?? '#f2c230', c.headColor ?? '#c8323a'];
    [[-1, -0.9], [0, 0], [1, 0.9]].forEach(([d, a], i) => {
      const tipX = d * 230, tipY = -700 + Math.abs(d) * 90 - (d === 0 ? 120 : 0) + Math.sin(lt * 4 + i) * 6;
      T.outlined(ctx, (k) => { k.moveTo(d * 60 - 60, -580); k.quadraticCurveTo(d * 120, -720, tipX, tipY); k.quadraticCurveTo(d * 120 + 40, -650, d * 60 + 60, -580); k.closePath(); }, cols[i]);
      T.outlined(ctx, (k) => k.arc(tipX, tipY, 18, 0, Math.PI * 2), P.gold, { line: 5 });
    });
    band(ctx, -600, -560, cols[1]);
  };

  // East Asia ---------------------------------------------------------------------------------------------------------
  H['straw-cone'] = (ctx, c) => { // douli: flat isosceles cone 1.6x head width
    const m = c.headColor ?? '#d8b888';
    T.outlined(ctx, (k) => { k.moveTo(-250, -570); k.lineTo(0, -730); k.lineTo(250, -570); k.quadraticCurveTo(0, -540, -250, -570); k.closePath(); }, m, {
      shade: (k) => { k.strokeStyle = shade(m, -0.3); k.lineWidth = 4; for (let i = -3; i <= 3; i++) { k.beginPath(); k.moveTo(0, -730); k.lineTo(i * 70, -560); k.stroke(); } k.fillStyle = shade(m, -0.2); k.fillRect(-260, -590, 140, 40); },
    });
  };
  H['official-cap'] = (ctx, c) => { // black cap + flat board on top; optional bead fringe (emperor)
    const m = c.headColor ?? '#1e1c1e';
    T.outlined(ctx, (k) => T.rrect(k, -104, -666, 208, 110, 20), m);
    if (c.headColor2) band(ctx, -600, -566, c.headColor2, 30);
    T.outlined(ctx, (k) => { k.moveTo(-200, -684); k.lineTo(200, -684); k.lineTo(190, -662); k.lineTo(-190, -662); k.closePath(); }, m, { line: 7 });
    if (c.fringe) { ctx.strokeStyle = c.fringe === true ? '#d9a84a' : c.fringe; ctx.lineWidth = 4; for (let x = -180; x <= 180; x += 36) { ctx.beginPath(); ctx.moveTo(x, -664); ctx.lineTo(x, -590); ctx.stroke(); ctx.beginPath(); ctx.arc(x, -588, 6, 0, Math.PI * 2); ctx.fillStyle = ctx.strokeStyle; ctx.fill(); } }
  };
  H['qing-hat'] = (ctx, c, lt, sh) => { // upturned black brim, red tassel dome, finial knob (queue braid comes from hair: 'queue')
    const m = c.headColor ?? '#1e1c1e', r = c.headColor2 ?? '#c8323a';
    T.outlined(ctx, (k) => { k.moveTo(-190, -586); k.lineTo(-150, -640); k.lineTo(150, -640); k.lineTo(190, -586); k.quadraticCurveTo(0, -566, -190, -586); k.closePath(); }, m);
    T.outlined(ctx, (k) => { k.moveTo(-140, -640); k.quadraticCurveTo(0, -760, 140, -640); k.closePath(); }, r, { shade: (k) => { k.strokeStyle = shade(r, -0.3); k.lineWidth = 4; for (let i = -3; i <= 3; i++) { k.beginPath(); k.moveTo(0, -730); k.lineTo(i * 40, -644); k.stroke(); } } });
    badge(ctx, 0, -742, 18, c.headColor3 ?? '#4a7ac8');
  };

  T.HEADWEAR = H;
})();
