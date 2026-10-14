// outfit.js — body outfits (look.outfit) drawn over the bell body by rig.js, plus head modes used by face.js:
// countryball flag fill (look.flag), gas mask (look.mask), face tint (look.tint) and animal/skull heads (look.headShape).
// Body units: shoulders y -326, hem y -70, feet at 0. Head units: centre (0,-450), half-width 150.
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL;
  const shade = (c, k) => T.shade(c, k);
  const SHOES = '#1e1a16';

  // Defaults merged under the cast look (cast values win). Lets `outfit:"suit"` imply dark trousers and shoes.
  T.OUTFIT_DEFAULTS = {
    suit: { robe: '#2f3238', legColor: '#2a2c30', shoes: SHOES, folds: false },
    tunic: { robe: '#77735e', legColor: '#5f5c4a', shoes: SHOES, belt: '#6b4426', folds: false },
    greatcoat: { robe: '#cfc2a5', legColor: '#6a604a', shoes: SHOES, folds: false },
    hanfu: { robe: '#2a2228', trim: null, folds: false, sleeveW: 64 },
    kimono: { robe: '#3a4a4a', folds: false, sleeveW: 60 },
    lamellar: { robe: '#5a2a2a', folds: false },
    surcoat: { robe: '#f2efe6', sleeve: '#8a8f96', legColor: '#8a8f96', shoes: '#4a4a4e', folds: false },
    hivis: { robe: '#3a4a6a', legColor: '#2a3448', shoes: SHOES, folds: false },
    skeleton: { robe: '#f2efe6', skin: '#f2efe6', legColor: '#f2efe6', folds: false, headShape: 'skull', hair: 'bald' },
  };

  const torso = (k) => { k.moveTo(-100, -326); k.quadraticCurveTo(0, -342, 100, -326); k.quadraticCurveTo(130, -210, 148, -70); k.quadraticCurveTo(0, -48, -148, -70); k.quadraticCurveTo(-130, -210, -100, -326); k.closePath(); };
  const clipTorso = (ctx, fn) => { ctx.save(); ctx.beginPath(); torso(ctx); ctx.clip(); fn(); ctx.restore(); };
  const buttons = (ctx, x, ys, col = P.gold, r = 9) => ys.forEach((y) => T.outlined(ctx, (k) => k.arc(x, y, r, 0, Math.PI * 2), col, { line: 4 }));
  const fx = (view) => (view === 'front' ? 0 : view === 'back' ? 0 : 22); // neckline leans to the face side in 3/4

  const O = {};
  O.suit = (ctx, c, view) => {
    if (view === 'back') return;
    const x = fx(view), shirt = c.shirt ?? '#f4f2ea';
    T.outlined(ctx, (k) => { k.moveTo(x - 46, -334); k.lineTo(x + 46, -334); k.lineTo(x, -214); k.closePath(); }, shirt, { line: 6 });
    if (c.bowtie) T.outlined(ctx, (k) => { k.moveTo(x - 34, -318); k.lineTo(x + 34, -298); k.lineTo(x + 34, -336); k.lineTo(x - 34, -316); k.closePath(); }, c.tie ?? '#1c1a18', { line: 5 });
    else T.outlined(ctx, (k) => { k.moveTo(x - 12, -330); k.lineTo(x + 12, -330); k.lineTo(x + 16, -236); k.lineTo(x, -216); k.lineTo(x - 16, -236); k.closePath(); }, c.tie ?? '#b8262a', { line: 5 });
    ctx.strokeStyle = shade(c.robe, -0.45); ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(x - 50, -334); ctx.lineTo(x - 18, -200); ctx.moveTo(x + 50, -334); ctx.lineTo(x + 18, -200); ctx.stroke();
    buttons(ctx, x, [-180, -136], shade(c.robe, -0.5), 7);
  };
  O.tunic = (ctx, c, view) => {
    const x = fx(view), b = c.buttonColor ?? '#c9a24a';
    T.outlined(ctx, (k) => T.rrect(k, -70, -344, 140, 30, 10), shade(c.robe, -0.15), { line: 6 }); // stand collar
    for (const s of [-1, 1]) T.outlined(ctx, (k) => T.rrect(k, s * 74 - 20, -330, 40, 22, 6), shade(c.robe, -0.25), { line: 5 }); // shoulder straps
    if (view !== 'back') {
      buttons(ctx, x, [-300, -262, -224, -150, -112], b, 8);
      for (const s of [-1, 1]) T.outlined(ctx, (k) => T.rrect(k, x + s * 52 - 26, -290, 52, 46, 8), shade(c.robe, -0.08), { line: 5 });
    }
    const belt = c.belt ?? '#6b4426';
    clipTorso(ctx, () => { ctx.fillStyle = belt; ctx.fillRect(-170, -196, 340, 26); });
    for (const px of [-86, -40, 62]) T.outlined(ctx, (k) => T.rrect(k, px, -200, 34, 40, 6), shade(belt, 0.1), { line: 5 }); // ammo pouches
  };
  O.greatcoat = (ctx, c, view) => {
    const col = c.robe, x = fx(view);
    T.outlined(ctx, (k) => { k.moveTo(-104, -326); k.quadraticCurveTo(0, -340, 104, -326); k.quadraticCurveTo(150, -150, 166, -18); k.quadraticCurveTo(0, 0, -166, -18); k.quadraticCurveTo(-150, -150, -104, -326); k.closePath(); }, col, { shade: (k) => { k.fillStyle = shade(col, -0.22); k.beginPath(); k.ellipse(-170, -160, 90, 220, 0, 0, Math.PI * 2); k.fill(); } });
    T.outlined(ctx, (k) => { k.moveTo(-90, -334); k.lineTo(x, -250); k.lineTo(90, -334); k.lineTo(60, -360); k.lineTo(x, -300); k.lineTo(-60, -360); k.closePath(); }, shade(col, -0.12), { line: 6 }); // fold-down collar
    if (view !== 'back') { buttons(ctx, x - 34, [-260, -210, -160, -110], shade(col, -0.45), 7); buttons(ctx, x + 34, [-260, -210, -160, -110], shade(col, -0.45), 7); }
    clipTorso(ctx, () => { ctx.fillStyle = shade(col, -0.3); ctx.fillRect(-170, -200, 340, 18); });
  };
  const crossCollar = (ctx, c, view, col) => {
    const x = fx(view) * 0.6;
    ctx.save(); ctx.beginPath(); torso(ctx); ctx.clip();
    ctx.strokeStyle = P.ink; ctx.lineWidth = 34; ctx.lineCap = 'butt';
    ctx.beginPath(); ctx.moveTo(-90, -344); ctx.lineTo(x + 50, -190); ctx.moveTo(90, -344); ctx.lineTo(x - 20, -250); ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = 24;
    ctx.beginPath(); ctx.moveTo(90, -344); ctx.lineTo(x - 20, -250); ctx.moveTo(-90, -344); ctx.lineTo(x + 50, -190); ctx.stroke();
    ctx.restore();
  };
  O.hanfu = (ctx, c, view) => {
    crossCollar(ctx, c, view, c.trim2 ?? c.headColor2 ?? '#d9a84a');
    const sash = c.sashColor ?? '#c8323a';
    clipTorso(ctx, () => { ctx.fillStyle = sash; ctx.fillRect(-170, -200, 340, 34); });
    if (view !== 'back') T.outlined(ctx, (k) => { k.moveTo(-26, -168); k.lineTo(26, -168); k.lineTo(34, -70); k.lineTo(-34, -70); k.closePath(); }, c.apron ?? '#e0a030', { line: 6 }); // hanging tassel panel
  };
  O.kimono = (ctx, c, view) => {
    crossCollar(ctx, c, view, c.trim2 ?? '#efe6d4');
    clipTorso(ctx, () => { ctx.fillStyle = c.sashColor ?? '#c9a24a'; ctx.fillRect(-170, -224, 340, 64); ctx.fillStyle = shade(c.sashColor ?? '#c9a24a', -0.3); ctx.fillRect(-170, -200, 340, 8); });
  };
  O.lamellar = (ctx, c) => {
    const a = c.armor ?? '#8a8a88';
    T.outlined(ctx, (k) => { k.moveTo(-108, -326); k.quadraticCurveTo(0, -342, 108, -326); k.lineTo(124, -150); k.quadraticCurveTo(0, -132, -124, -150); k.closePath(); }, a, {
      shade: (k) => { for (let y = -320, row = 0; y < -150; y += 26, row++) for (let x = -130; x < 130; x += 24) { k.fillStyle = (row + x / 24) % 2 ? shade(a, -0.28) : shade(a, 0.08); k.fillRect(x + (row % 2) * 12, y, 20, 22); } },
    });
    for (const s of [-1, 1]) T.outlined(ctx, (k) => T.rrect(k, s * 100 - 44, -340, 88, 70, 18), shade(a, -0.1), { line: 6 }); // shoulder flaps
    if (c.scarf !== false) T.outlined(ctx, (k) => T.rrect(k, -80, -350, 160, 30, 14), c.scarf ?? '#c8323a', { line: 6 });
  };
  O.surcoat = (ctx, c, view) => {
    const cross = c.crossColor ?? '#c8323a', x = fx(view) * 0.5;
    clipTorso(ctx, () => {
      ctx.fillStyle = c.sleeve ?? '#8a8f96'; ctx.fillRect(-170, -360, 340, 40); // mail at the neck
      ctx.fillStyle = cross; ctx.fillRect(x - 22, -320, 44, 230); ctx.fillRect(x - 90, -260, 180, 40);
    });
    clipTorso(ctx, () => { ctx.fillStyle = c.belt ?? '#6b4426'; ctx.fillRect(-170, -186, 340, 18); });
  };
  O.hivis = (ctx, c) => {
    const v = c.vest ?? '#d8e060';
    T.outlined(ctx, (k) => { k.moveTo(-96, -326); k.lineTo(-30, -326); k.lineTo(0, -260); k.lineTo(30, -326); k.lineTo(96, -326); k.lineTo(130, -110); k.quadraticCurveTo(0, -92, -130, -110); k.closePath(); }, v, {
      shade: (k) => { k.fillStyle = '#e8eef0'; k.fillRect(-160, -210, 320, 18); k.fillRect(-160, -150, 320, 18); },
    });
  };
  O.skeleton = (ctx, c) => { // ribs drawn over a bone-white body
    ctx.fillStyle = '#1e1c1e';
    clipTorso(ctx, () => { ctx.fillRect(-170, -360, 340, 320); });
    ctx.strokeStyle = '#f2efe6'; ctx.lineWidth = 16; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, -330); ctx.lineTo(0, -120); ctx.stroke();
    for (let i = 0; i < 5; i++) { const y = -300 + i * 36, w = 96 - i * 8; ctx.beginPath(); ctx.moveTo(-w, y + 16); ctx.quadraticCurveTo(0, y - 18, w, y + 16); ctx.stroke(); }
    T.outlined(ctx, (k) => k.ellipse(0, -100, 86, 34, 0, 0, Math.PI * 2), '#f2efe6', { line: 6 }); // pelvis
  };
  T.OUTFITS = O;

  // Extras that combine with any outfit: medals, apron, tiered skirt.
  T.drawOutfitExtras = (ctx, c, view) => {
    if (c.skirt === 'tiered') {
      const cols = c.skirtColors ?? ['#a8443a', '#efe6d4', '#6a2a3a'];
      clipTorso(ctx, () => cols.forEach((col, i) => { ctx.fillStyle = col; ctx.fillRect(-170, -190 + i * 44, 340, 44); }));
    }
    if (c.apron && !T.OUTFITS[c.outfit]?.usesApron && c.outfit !== 'hanfu') T.outlined(ctx, (k) => T.rrect(k, -62, -230, 124, 170, 16), c.apron, { line: 6 });
    if (c.medals && view !== 'back') {
      const n = typeof c.medals === 'number' ? c.medals : 3, cols = ['#c8323a', '#2f6db8', '#f2c230', '#2e9e48', '#7a3a8f'];
      for (let i = 0; i < n; i++) {
        const x = -70 + (i % 3) * 28, y = -276 + Math.floor(i / 3) * 34;
        T.outlined(ctx, (k) => T.rrect(k, x, y, 24, 16, 3), cols[i % cols.length], { line: 4 });
        T.outlined(ctx, (k) => k.arc(x + 12, y + 26, 8, 0, Math.PI * 2), P.gold, { line: 3 });
      }
    }
  };

  // ---------- head modes ----------
  // Countryball flag clipped to the head. pattern: h3 v3 disc cross nordic crescent stripes.
  T.drawFlagHead = (ctx, c, headPath, sh) => {
    const f = c.flag, cols = f.colors ?? ['#ffffff', '#2f6db8', '#c8323a'];
    ctx.save(); ctx.beginPath(); headPath(ctx); ctx.clip();
    const X0 = -170, Y0 = -620, W = 340, H = 340;
    const pat = f.pattern ?? 'h3';
    if (pat === 'h3' || pat === 'stripes') { const n = pat === 'h3' ? 3 : f.count ?? 7; for (let i = 0; i < n; i++) { ctx.fillStyle = cols[i % cols.length]; ctx.fillRect(X0, Y0 + (H * i) / n, W, H / n + 1); } }
    else if (pat === 'v3') for (let i = 0; i < 3; i++) { ctx.fillStyle = cols[i % cols.length]; ctx.fillRect(X0 + (W * i) / 3, Y0, W / 3 + 1, H); }
    else {
      ctx.fillStyle = cols[0]; ctx.fillRect(X0, Y0, W, H);
      ctx.fillStyle = cols[1] ?? '#c8323a';
      if (pat === 'disc') { ctx.beginPath(); ctx.arc(sh * 150, -450, 70, 0, Math.PI * 2); ctx.fill(); }
      if (pat === 'cross') { ctx.fillRect(-30 + sh * 60, Y0, 60, H); ctx.fillRect(X0, -480, W, 60); }
      if (pat === 'nordic') { ctx.fillRect(-60 - sh * 40, Y0, 54, H); ctx.fillRect(X0, -478, W, 54); }
      if (pat === 'crescent') { ctx.beginPath(); ctx.arc(sh * 150 - 10, -450, 66, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = cols[0]; ctx.beginPath(); ctx.arc(sh * 150 + 14, -450, 54, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = cols[1] ?? '#ffffff'; star(ctx, sh * 150 + 56, -450, 22); }
    }
    ctx.lineWidth = 34; ctx.strokeStyle = 'rgba(20,10,30,0.18)'; ctx.beginPath(); headPath(ctx); ctx.stroke(); // shaded rim
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.ellipse(40, -560, 70, 26, -0.3, 0, Math.PI * 2); ctx.fill();
    if (c.flagCrack) { ctx.strokeStyle = P.ink; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(10, -604); ctx.lineTo(-20, -520); ctx.lineTo(30, -460); ctx.lineTo(-10, -380); ctx.lineTo(20, -300); ctx.stroke(); }
    ctx.restore();
    ctx.lineWidth = T.LINE; ctx.strokeStyle = P.ink; ctx.beginPath(); headPath(ctx); ctx.stroke();
  };
  function star(ctx, x, y, r) { ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); }

  // Gas mask: face plate, two goggles and a drooping canister snout (WWI 11:12).
  T.drawGasMask = (ctx, c, fxh, view) => {
    if (view === 'back') return;
    const m = c.maskColor ?? '#6a6a52', sp = view === 'side' ? 0 : view === '3q' ? 40 : 52;
    T.outlined(ctx, (k) => T.rrect(k, fxh - 124, -530, 248, 210, 80), m, { shade: (k) => { k.fillStyle = shade(m, -0.25); k.fillRect(fxh - 140, -530, 60, 220); } });
    const eyes = view === 'side' ? [18] : [-sp, sp];
    eyes.forEach((ex) => { T.outlined(ctx, (k) => k.arc(fxh + ex, -470, 34, 0, Math.PI * 2), '#d8e4e6', { line: 12 }); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.ellipse(fxh + ex - 10, -480, 10, 6, -0.5, 0, Math.PI * 2); ctx.fill(); });
    T.outlined(ctx, (k) => k.arc(fxh + 10, -366, 44, 0, Math.PI * 2), shade(m, -0.15), { shade: (k) => { k.strokeStyle = shade(m, -0.4); k.lineWidth = 5; for (let i = -2; i <= 2; i++) { k.beginPath(); k.moveTo(fxh + 10 + i * 16, -406); k.lineTo(fxh + 10 + i * 16, -326); k.stroke(); } } });
    ctx.strokeStyle = P.ink; ctx.lineWidth = 26; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(fxh + 10, -330); ctx.quadraticCurveTo(fxh + 40, -270, fxh + 10, -230); ctx.stroke();
    ctx.strokeStyle = shade(m, -0.3); ctx.lineWidth = 16; ctx.stroke();
    T.outlined(ctx, (k) => T.rrect(k, fxh - 30, -250, 80, 70, 16), shade(m, 0.1), { line: 6 });
  };

  // Face tint (gas green, sickly grey): multiply over the head only, 0.5 s fade via look.tintAt.
  T.drawFaceTint = (ctx, c, headPath, lt) => {
    const a = (c.tintAlpha ?? 0.5) * (c.tintAt != null ? T.clamp((lt - c.tintAt) / 0.5) : 1);
    if (a <= 0) return;
    ctx.save(); ctx.beginPath(); headPath(ctx); ctx.clip();
    ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha *= a; ctx.fillStyle = c.tint; ctx.fillRect(-200, -640, 400, 380);
    ctx.restore();
  };

  // Animal / skull heads replace the egg head entirely (minotaur, skeleton). Return true when drawn.
  T.drawAltHead = (ctx, c, s) => {
    const sh = { front: 0, '3q': 0.24, side: 0.42, back: 0 }[s.view] ?? 0.24, fxh = sh * 150;
    if (c.headShape === 'skull') {
      const b = c.skin ?? '#f2efe6';
      T.outlined(ctx, (k) => { k.arc(0, -470, 150, Math.PI * 0.9, Math.PI * 2.1); k.lineTo(90 + fxh * 0.3, -330); k.lineTo(-90 + fxh * 0.3, -330); k.closePath(); }, b, { shade: (k) => { k.fillStyle = shade(b, -0.18); k.beginPath(); k.ellipse(-130, -470, 60, 140, 0, 0, Math.PI * 2); k.fill(); } });
      if (s.view !== 'back') {
        ctx.fillStyle = '#1e1c1e';
        [-48, 48].forEach((ex) => { ctx.beginPath(); ctx.ellipse(fxh + ex, -462, 34, 40, 0, 0, Math.PI * 2); ctx.fill(); });
        ctx.beginPath(); ctx.moveTo(fxh - 12, -400); ctx.lineTo(fxh + 12, -400); ctx.lineTo(fxh, -380); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#1e1c1e'; ctx.lineWidth = 5; for (let x = -60; x <= 60; x += 24) { ctx.beginPath(); ctx.moveTo(fxh * 0.3 + x, -356); ctx.lineTo(fxh * 0.3 + x, -330); ctx.stroke(); }
      }
      return true;
    }
    if (c.headShape === 'bull') {
      const hide = c.skin ?? '#7d8077', horn = c.hornColor ?? '#c9ccd2', d = sh > 0 ? 1 : 0;
      for (const sd of [-1, 1]) T.outlined(ctx, (k) => { k.moveTo(sd * 110, -560); k.quadraticCurveTo(sd * 250, -580, sd * 230, -720); k.quadraticCurveTo(sd * 200, -620, sd * 90, -600); k.closePath(); }, horn, { shade: (k) => { k.strokeStyle = shade(horn, -0.3); k.lineWidth = 5; for (let i = 0; i < 4; i++) { k.beginPath(); k.moveTo(sd * (130 + i * 26), -560 - i * 10); k.lineTo(sd * (150 + i * 26), -610 - i * 20); k.stroke(); } } });
      for (const sd of [-1, 1]) T.outlined(ctx, (k) => k.ellipse(sd * 165, -520, 50, 24, sd * 0.4, 0, Math.PI * 2), hide); // ears
      T.outlined(ctx, (k) => { k.moveTo(-130, -600); k.quadraticCurveTo(0, -640, 130, -600); k.lineTo(110, -420); k.quadraticCurveTo(fxh + 70, -300, fxh * 1.4, -296); k.quadraticCurveTo(fxh - 90, -300, -110, -420); k.closePath(); }, hide, { shade: (k) => { k.fillStyle = shade(hide, -0.2); k.fillRect(-160, -640, 80, 360); } });
      T.outlined(ctx, (k) => k.ellipse(fxh * 1.3, -340, 80, 46, 0, 0, Math.PI * 2), shade(hide, 0.2), { line: 7 }); // muzzle
      ctx.fillStyle = '#1e1c1e'; [-26, 26].forEach((nx) => { ctx.beginPath(); ctx.ellipse(fxh * 1.3 + nx, -340, 9, 14, 0, 0, Math.PI * 2); ctx.fill(); });
      if (c.noseRing !== false) { ctx.strokeStyle = P.gold; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(fxh * 1.3, -306, 22, 0.1, Math.PI - 0.1); ctx.stroke(); }
      if (s.view !== 'back') { // red glowing slit eyes (reference: Greek Myths 17:20)
        ctx.save(); ctx.shadowColor = '#ff2a2a'; ctx.shadowBlur = (22) * T.DPR; ctx.fillStyle = c.eyeColor ?? '#ff2a2a';
        [-50, 50].forEach((ex) => { ctx.beginPath(); ctx.ellipse(fxh + ex, -490, 22, 7, ex > 0 ? -0.25 : 0.25, 0, Math.PI * 2); ctx.fill(); });
        ctx.restore();
      }
      return true;
    }
    return false;
  };
})();
