// closeup-mouth.js — close-up mouths (dark graded interior, tongue with a highlight, upper / lower teeth rows with gaps,
// tapered lips, chin crease) for the detail level, the new expressions (terror, disgust, awe, crying, laughing,
// scheming, exhausted) and the classic mouth / brow kinds they need (ajar, sly, disgust).
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL;
  const DARK = '#2a0c10', DARK2 = '#5c1a20', TONGUE = '#e07a86', TEETH = '#fbf7ee';

  // ---------- new expressions (classic kinds; the detail level adds the moods in closeup.js) ----------
  Object.assign(T.EXPR, {
    terror: { eyes: 'wide', brows: 'worried', mouth: 'scream', talk: ['scream', 'wide'], sweat: true },
    disgust: { eyes: 'dotSmall', brows: 'disgust', mouth: 'disgust', talk: ['disgust', 'mid'] },
    awe: { eyes: 'wide', brows: 'high', mouth: 'o', talk: ['o', 'mid'] },
    crying: { eyes: 'arcDown', brows: 'sad', mouth: 'wobbleOpen', talk: ['wobbleOpen', 'wide'], tears: true },
    laughing: { eyes: 'arc', brows: 'high', mouth: 'smileOpen', talk: ['smileOpen', 'wide', 'mid'] },
    scheming: { eyes: 'lid', brows: 'angry', mouth: 'sly', talk: ['sly', 'mid'] },
    exhausted: { eyes: 'lid', brows: 'sad', mouth: 'ajar', talk: ['ajar', 'mid'], sweat: true },
  });

  const line = (ctx, fn, w = 9) => { ctx.strokeStyle = P.ink; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); fn(); ctx.stroke(); };
  T.MOUTH_KINDS.ajar = (ctx, mx, my) => T.outlined(ctx, (k) => k.ellipse(mx, my + 4, 18, 8, 0, 0, Math.PI * 2), '#4a1715', { line: 7 });
  T.MOUTH_KINDS.sly = (ctx, mx, my) => {
    T.outlined(ctx, (k) => { k.moveTo(mx - 50, my - 16); k.quadraticCurveTo(mx, my + 10, mx + 54, my - 24); k.quadraticCurveTo(mx + 4, my + 40, mx - 50, my - 16); k.closePath(); }, TEETH, { line: 7 });
    line(ctx, () => { for (let x = -24; x <= 30; x += 18) { ctx.moveTo(mx + x, my - 4 - x * 0.12); ctx.lineTo(mx + x, my + 12 - x * 0.1); } }, 3.5);
  };
  T.MOUTH_KINDS.disgust = (ctx, mx, my) => {
    T.outlined(ctx, (k) => { k.moveTo(mx - 38, my + 8); k.lineTo(mx - 14, my - 2); k.lineTo(mx + 10, my + 4); k.lineTo(mx + 40, my - 14); k.quadraticCurveTo(mx + 30, my + 16, mx - 38, my + 8); k.closePath(); }, '#4a1715', { line: 7 });
  };
  T.BROW_KINDS.disgust = (ctx, x, y, s) => line(ctx, () => { const tilt = s > 0 ? -14 : 10; ctx.moveTo(x - s * 24, y + 8); ctx.quadraticCurveTo(x, y - 6 + tilt * 0.5, x + s * 26, y + tilt); }, 13);

  // ---------- detail mouths ----------
  // Open mouth: D-shaped (or round) cavity with a graded interior, tongue, teeth rows and tapered lips.
  function open(ctx, mx, my, w, h, o, c) {
    const round = o.shape === 'o';
    const path = round ? (k) => k.ellipse(mx, my + h * 0.3, w, h, 0, 0, Math.PI * 2)
      : (k) => { k.moveTo(mx - w, my - h * 0.25); k.quadraticCurveTo(mx, my - h * (o.smile ? 0.1 : 0.45), mx + w, my - h * 0.25); k.quadraticCurveTo(mx + w * 0.88, my + h, mx, my + h); k.quadraticCurveTo(mx - w * 0.88, my + h, mx - w, my - h * 0.25); k.closePath(); };
    const g = ctx.createLinearGradient(0, my - h * 0.5, 0, my + h);
    g.addColorStop(0, DARK); g.addColorStop(1, DARK2);
    ctx.save(); ctx.beginPath(); path(ctx); ctx.fillStyle = g; ctx.fill(); ctx.clip();
    ctx.fillStyle = TONGUE; ctx.beginPath(); ctx.ellipse(mx + w * 0.08, my + h * 0.98, w * 0.66, h * 0.46, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = T.mix(TONGUE, '#ffffff', 0.35); ctx.beginPath(); ctx.ellipse(mx - w * 0.15, my + h * 0.72, w * 0.22, h * 0.1, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = T.shade(TONGUE, -0.3); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(mx + w * 0.08, my + h * 0.68); ctx.lineTo(mx + w * 0.08, my + h * 0.95); ctx.stroke();
    if (o.teeth !== 'none') teethRow(ctx, mx, my - h * (round ? 0.6 : 0.08), w, h * 0.26, 1);
    if (o.teeth === 'both') teethRow(ctx, mx, my + h * 0.66, w * 0.85, h * 0.22, -1);
    ctx.restore();
    T.outlined(ctx, path, null, { line: 7 });
    T.inkStroke(ctx, [[mx - w * 0.6, my + h + 7], [mx, my + h + 12], [mx + w * 0.6, my + h + 7]], { w: 6, ink: T.mix(P.ink, c.skin ?? P.skin, 0.45) }); // lower-lip crease
    if (o.smile) [-1, 1].forEach((d) => T.inkStroke(ctx, [[mx + d * w * 0.98, my - h * 0.3], [mx + d * (w + 10), my - h * 0.5]], { w: 5 }));
  }
  // A row of teeth whose biting edge sits at y (dir 1: upper row hanging down to y; -1: lower row rising from y).
  function teethRow(ctx, mx, y, w, h, dir) {
    const y0 = dir > 0 ? y - h * 4 : y, y1 = dir > 0 ? y : y + h * 4, n = 6, tw = (w * 2.2) / n;
    ctx.fillStyle = TEETH;
    ctx.beginPath(); // slightly scalloped biting edge
    ctx.moveTo(mx - w * 1.1, dir > 0 ? y0 : y1);
    for (let i = 0; i < n; i++) { const x = mx - w * 1.1 + i * tw; ctx.lineTo(x, y + dir * -1.5); ctx.quadraticCurveTo(x + tw / 2, y + dir * 3, x + tw, y + dir * -1.5); }
    ctx.lineTo(mx + w * 1.1, dir > 0 ? y0 : y1); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(110,100,125,0.28)'; ctx.fillRect(mx - w * 1.1, dir > 0 ? y - h * 0.35 : y, w * 2.2, h * 0.35); // shade near the edge
    ctx.strokeStyle = 'rgba(90,80,90,0.5)'; ctx.lineWidth = 2.5; ctx.beginPath();
    for (let i = 1; i < n; i++) { const x = mx - w * 1.1 + i * tw; ctx.moveTo(x, y - dir * h); ctx.lineTo(x, y + dir * 1); }
    ctx.stroke();
  }
  function lips(ctx, pts, c, w = 9) { T.inkStroke(ctx, pts, { w, w0: w * 0.3, w1: w * 0.3 }); }
  function clenched(ctx, mx, my) {
    T.outlined(ctx, (k) => T.rrect(k, mx - 48, my - 16, 96, 32, 12), TEETH, { line: 8, paint: false });
    ctx.fillStyle = 'rgba(120,110,130,0.3)'; ctx.fillRect(mx - 44, my + 6, 88, 8);
    ctx.strokeStyle = 'rgba(70,60,70,0.7)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(mx - 46, my); ctx.lineTo(mx + 46, my);
    for (let x = -30; x <= 30; x += 15) { ctx.moveTo(mx + x, my - 15); ctx.lineTo(mx + x, my + 15); }
    ctx.stroke();
    [-1, 1].forEach((d) => T.inkStroke(ctx, [[mx + d * 50, my - 10], [mx + d * 58, my], [mx + d * 50, my + 10]], { w: 5 }));
  }

  // Detail mouth; false = not handled (face.js draws the classic kind).
  T.CLOSEUP.mouth = (ctx, kind, mx, my, s, c, view, e) => {
    const mood = s.mood, teethBoth = mood === T.CLOSEUP_MOODS.rage || mood === T.CLOSEUP_MOODS.terror ? 'both' : 'top';
    switch (kind) {
      case 'ajar': open(ctx, mx, my + 2, 20, 12, { teeth: 'top' }, c); return true;
      case 'mid': open(ctx, mx, my, 26, 26, { teeth: 'top' }, c); return true;
      case 'wide': open(ctx, mx, my, 40, 46, { teeth: teethBoth }, c); return true;
      case 'scream': open(ctx, mx, my + 6, 56, 74, { teeth: teethBoth }, c); return true;
      case 'smileOpen': open(ctx, mx, my - 4, 44, 36, { teeth: 'top', smile: true }, c); return true;
      case 'o': open(ctx, mx, my, 19, 24, { teeth: 'none', shape: 'o' }, c); return true;
      case 'grimace': clenched(ctx, mx, my); return true;
      case 'smile': lips(ctx, [[mx - 34, my - 8], [mx - 14, my + 12], [mx + 14, my + 12], [mx + 34, my - 8]], c); [-1, 1].forEach((d) => lips(ctx, [[mx + d * 32, my - 2], [mx + d * 38, my - 12]], c, 5)); return true;
      case 'frown': lips(ctx, [[mx - 28, my + 12], [mx - 10, my - 6], [mx + 10, my - 6], [mx + 28, my + 12]], c); return true;
      case 'smirk': lips(ctx, [[mx - 26, my + 4], [mx, my + 12], [mx + 22, my + 2], [mx + 36, my - 12]], c); lips(ctx, [[mx + 34, my - 4], [mx + 42, my - 14]], c, 5); return true;
      case 'small': lips(ctx, [[mx - 14, my], [mx, my + 2], [mx + 14, my]], c, 8); return true;
      case 'closed': case undefined: lips(ctx, [[mx - 24, my], [mx, my + 6], [mx + 24, my]], c); return true;
      default: return false;
    }
  };
})();
