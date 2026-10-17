// back3q.js — the bean's rear three-quarter view (`view: "3q-back"`): the character turned away and to its facing side.
// bean.js draws the body, the outfit, the hair and the headwear as in the back view (every module that knows "back"
// keeps working), places the arms as in 3/4 (the near arm in front), and then calls T.headBack3q in the head frame to
// turn the skull: the hair mass of the back view keeps the back of the head, while the cheek and jaw of the face side
// show as a skin crescent with the ear in front of the hairline. Head units: centre (0, -450), half-width 150.
// Pure drawing; no RNG.
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL, TAU = Math.PI * 2;
  // headwear that wraps the cheeks: nothing of the face shows from behind
  const COVERED = new Set(['hood', 'hood-dark', 'hijab', 'veil-wrap', 'great-helm', 'mail-coif', 'visor-helmet', 'bucket-helmet']);
  const CHEEK = { x: 150 * 1.02, y: -384, rx: 150 * 0.56, ry: 140 }; // the face side's cheek and jaw, past the hairline
  const EAR = { x: 150 * 0.5, y: -442, rx: 21, ry: 33 };

  T.headBack3q = (ctx, c) => {
    const H = T.BEAN_HEAD;
    if (!H || c.headShape || c.flag || COVERED.has(c.head)) return;
    const skin = c.skin ?? P.skin, shadow = c.skinShade ?? T.shade(skin, -0.16), line = T.LINE ?? 8;
    const cheek = (k) => k.ellipse(CHEEK.x, CHEEK.y, CHEEK.rx, CHEEK.ry, -0.12, 0, TAU);
    ctx.save();
    ctx.beginPath(); H.headPath(ctx); ctx.clip();
    if (c.hair && c.hair !== 'bald') { // the cheek past the hair: skin, a soft shadow under the jaw, the hairline inked
      T.outlined(ctx, cheek, skin, { line: 0, paint: 0.45, shade: (k) => { k.fillStyle = shadow; k.beginPath(); k.ellipse(CHEEK.x - 10, CHEEK.y + 92, CHEEK.rx, 50, -0.12, 0, TAU); k.fill(); } });
      ctx.strokeStyle = P.ink; ctx.lineWidth = line; ctx.beginPath(); cheek(ctx); ctx.stroke();
    } else { // bald: the jaw turns away into shadow
      ctx.fillStyle = shadow; ctx.globalAlpha *= 0.6; ctx.beginPath(); ctx.ellipse(CHEEK.x + 20, CHEEK.y + 60, CHEEK.rx, 90, -0.12, 0, TAU); ctx.fill();
    }
    ctx.restore();
    ctx.save(); ctx.beginPath(); H.headPath(ctx); ctx.clip(); // the head's outline, redrawn over the crescent's edge
    ctx.strokeStyle = P.ink; ctx.lineWidth = line * 2; ctx.beginPath(); H.headPath(ctx); ctx.stroke();
    ctx.restore();
    T.outlined(ctx, (k) => k.ellipse(EAR.x, EAR.y, EAR.rx, EAR.ry, 0.12, 0, TAU), skin, { line: 6, paint: 0.45 });
    ctx.strokeStyle = shadow; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(EAR.x + 2, EAR.y + 2, EAR.rx * 0.5, -1.9, 1.2); ctx.stroke();
  };
})();
