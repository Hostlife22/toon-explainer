// props-world.js — more reusable props (drawn centered at origin, `size` ≈ height): rifle, grenade, gravestone, cross,
// pagoda, castle, dome, tent, mug, croissant, pawn, pin, bomb, canister, teacup, telephone, microphone, crate, barrel,
// banner (generic disc emblem), placard. Registered into T.PROPS so `prop`, `hold` and map icons can use them.
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL;
  const add = {
    rifle(ctx, s) {
      ctx.rotate(-Math.PI / 2);
      T.outlined(ctx, (k) => { k.moveTo(-s * 0.5, -s * 0.03); k.lineTo(-s * 0.1, -s * 0.04); k.lineTo(-s * 0.02, s * 0.06); k.lineTo(-s * 0.48, s * 0.08); k.closePath(); }, '#8a5a32', { line: s * 0.02 });
      T.outlined(ctx, (k) => k.rect(-s * 0.12, -s * 0.035, s * 0.62, s * 0.035), '#4a4e54', { line: s * 0.015 });
      T.outlined(ctx, (k) => k.rect(s * 0.02, -s * 0.06, s * 0.06, s * 0.03), '#3a3d42', { line: s * 0.012 });
    },
    grenade(ctx, s) {
      T.outlined(ctx, (k) => k.ellipse(0, s * 0.08, s * 0.28, s * 0.36, 0, 0, Math.PI * 2), '#5a5a3a', { line: s * 0.04, shade: (k) => { k.strokeStyle = '#3a3a24'; k.lineWidth = s * 0.025; for (let i = -1; i <= 1; i++) { k.beginPath(); k.moveTo(-s * 0.3, s * (0.08 + i * 0.14)); k.lineTo(s * 0.3, s * (0.08 + i * 0.14)); k.stroke(); k.beginPath(); k.moveTo(i * s * 0.12, -s * 0.3); k.lineTo(i * s * 0.12, s * 0.45); k.stroke(); } } });
      T.outlined(ctx, (k) => k.rect(-s * 0.08, -s * 0.36, s * 0.16, s * 0.12), '#8a8f96', { line: s * 0.03 });
      ctx.strokeStyle = P.ink; ctx.lineWidth = s * 0.03; ctx.beginPath(); ctx.arc(s * 0.14, -s * 0.36, s * 0.08, 0, Math.PI * 2); ctx.stroke();
    },
    gravestone(ctx, s, lt, o) {
      const w = s * 0.62, col = o.color ?? '#aab0bc';
      T.outlined(ctx, (k) => { k.moveTo(-w / 2, s / 2); k.lineTo(-w / 2, -s / 2 + w / 2); k.arc(0, -s / 2 + w / 2, w / 2, Math.PI, 0); k.lineTo(w / 2, s / 2); k.closePath(); }, col, { line: s * 0.03, shade: (k) => { k.fillStyle = T.shade(col, -0.22); k.fillRect(w * 0.2, -s / 2, w, s); } });
      T.toonText(ctx, o.title ?? 'R.I.P', 0, -s * 0.12, { size: s * 0.14, fill: '#4a4e58', stroke: 0, shadow: false });
      if (o.text) T.toonText(ctx, o.text, 0, s * 0.1, { size: T.fitSize(ctx, o.text, s * 0.1, w * 0.8), fill: '#4a4e58', stroke: 0, shadow: false });
      ctx.fillStyle = '#4f6a3a'; ctx.fillRect(-w * 0.7, s / 2 - s * 0.04, w * 1.4, s * 0.06);
    },
    cross(ctx, s, lt, o) {
      ctx.strokeStyle = P.ink; ctx.lineWidth = s * 0.14; ctx.lineCap = 'butt';
      ctx.beginPath(); ctx.moveTo(0, s / 2); ctx.lineTo(0, -s / 2); ctx.moveTo(-s * 0.3, -s * 0.2); ctx.lineTo(s * 0.3, -s * 0.2); ctx.stroke();
      ctx.strokeStyle = o.color ?? '#f2efe8'; ctx.lineWidth = s * 0.09; ctx.stroke();
    },
    pagoda(ctx, s, lt, o) { T.drawPagoda(ctx, 0, s / 2, s * 0.62, o.tiers ?? 4, o.roof ?? '#4a4a50', o.color ?? '#a03a2a'); },
    castle(ctx, s, lt, o) {
      const col = o.color ?? '#9a9a96', w = s * 0.9;
      const crenels = (x, y, ww) => { for (let i = 0; i < 4; i++) T.outlined(ctx, (k) => k.rect(x + (i * ww) / 4 + ww * 0.04, y - s * 0.08, ww * 0.16, s * 0.08), col, { line: s * 0.02 }); };
      T.outlined(ctx, (k) => k.rect(-w / 2, -s * 0.15, w, s * 0.65), col, { line: s * 0.025, shade: (k) => { k.fillStyle = T.shade(col, -0.2); k.fillRect(0, -s * 0.15, w / 2, s * 0.65); } });
      for (const tx of [-w / 2 - s * 0.05, w / 2 - s * 0.2]) { T.outlined(ctx, (k) => k.rect(tx, -s * 0.42, s * 0.25, s * 0.92), col, { line: s * 0.025 }); crenels(tx, -s * 0.42, s * 0.25); }
      crenels(-w / 2, -s * 0.15, w);
      T.outlined(ctx, (k) => { k.moveTo(-s * 0.1, s / 2); k.lineTo(-s * 0.1, s * 0.25); k.arc(0, s * 0.25, s * 0.1, Math.PI, 0); k.lineTo(s * 0.1, s / 2); k.closePath(); }, '#3a2a1c', { line: s * 0.02 });
      if (o.flag !== false) { ctx.strokeStyle = P.ink; ctx.lineWidth = s * 0.02; ctx.beginPath(); ctx.moveTo(-w / 2 + s * 0.07, -s * 0.5); ctx.lineTo(-w / 2 + s * 0.07, -s * 0.72); ctx.stroke(); T.outlined(ctx, (k) => k.rect(-w / 2 + s * 0.07, -s * 0.72, s * 0.18, s * 0.1), o.flagColor ?? P.red, { line: s * 0.015 }); }
    },
    dome(ctx, s, lt, o) {
      const col = o.color ?? '#e8d8b0';
      T.outlined(ctx, (k) => k.rect(-s * 0.36, -s * 0.05, s * 0.72, s * 0.55), col, { line: s * 0.025, shade: (k) => { k.fillStyle = '#3a2a1c'; k.beginPath(); k.moveTo(-s * 0.08, s / 2); k.lineTo(-s * 0.08, s * 0.2); k.quadraticCurveTo(0, s * 0.08, s * 0.08, s * 0.2); k.lineTo(s * 0.08, s / 2); k.fill(); } });
      T.outlined(ctx, (k) => { k.moveTo(-s * 0.3, -s * 0.05); k.bezierCurveTo(-s * 0.36, -s * 0.36, -s * 0.05, -s * 0.38, 0, -s * 0.52); k.bezierCurveTo(s * 0.05, -s * 0.38, s * 0.36, -s * 0.36, s * 0.3, -s * 0.05); k.closePath(); }, o.domeColor ?? '#3a8a7a', { line: s * 0.025 });
      T.outlined(ctx, (k) => k.rect(s * 0.38, -s * 0.5, s * 0.1, s), col, { line: s * 0.02 });
    },
    tent(ctx, s, lt, o) {
      const col = o.color ?? '#8a6a3a';
      T.outlined(ctx, (k) => { k.moveTo(-s * 0.6, s / 2); k.lineTo(0, -s / 2); k.lineTo(s * 0.6, s / 2); k.closePath(); }, col, { line: s * 0.03, shade: (k) => { k.fillStyle = T.shade(col, -0.25); k.beginPath(); k.moveTo(0, -s / 2); k.lineTo(s * 0.6, s / 2); k.lineTo(0, s / 2); k.fill(); } });
      T.outlined(ctx, (k) => { k.moveTo(-s * 0.12, s / 2); k.lineTo(0, s * 0.05); k.lineTo(s * 0.12, s / 2); k.closePath(); }, '#2a1c15', { line: s * 0.02 });
    },
    mug(ctx, s) {
      T.outlined(ctx, (k) => { k.arc(s * 0.3, -s * 0.15, s * 0.16, -Math.PI / 2, Math.PI / 2); }, null, { line: s * 0.08 });
      T.outlined(ctx, (k) => T.rrect(k, -s * 0.3, -s * 0.5, s * 0.6, s * 0.75, s * 0.06), '#e8a83a', { line: s * 0.04, shade: (k) => { k.fillStyle = 'rgba(255,255,255,0.35)'; k.fillRect(-s * 0.22, -s * 0.42, s * 0.08, s * 0.6); } });
      T.outlined(ctx, (k) => T.smoothPath(k, T.blobPts(0, -s * 0.52, s * 0.36, s * 0.14, 'foam', 10, 0.25)), '#fff6e0', { line: s * 0.03 });
    },
    croissant(ctx, s) {
      T.outlined(ctx, (k) => { k.moveTo(-s * 0.55, s * 0.1); k.quadraticCurveTo(0, -s * 0.6, s * 0.55, s * 0.1); k.quadraticCurveTo(0, -s * 0.15, -s * 0.55, s * 0.1); k.closePath(); }, '#d99a4e', { line: s * 0.04, shade: (k) => { k.strokeStyle = '#a8682a'; k.lineWidth = s * 0.03; for (const x of [-0.25, 0, 0.25]) { k.beginPath(); k.moveTo(s * x, -s * 0.3); k.lineTo(s * (x + 0.05), 0); k.stroke(); } } });
    },
    pawn(ctx, s, lt, o) {
      const col = o.color ?? '#2a2a2e';
      T.outlined(ctx, (k) => { k.moveTo(-s * 0.3, s / 2); k.lineTo(-s * 0.12, -s * 0.05); k.lineTo(s * 0.12, -s * 0.05); k.lineTo(s * 0.3, s / 2); k.closePath(); }, col, { line: s * 0.03 });
      T.outlined(ctx, (k) => k.arc(0, -s * 0.22, s * 0.2, 0, Math.PI * 2), col, { line: s * 0.03, shade: (k) => { k.fillStyle = 'rgba(255,255,255,0.25)'; k.beginPath(); k.arc(-s * 0.06, -s * 0.28, s * 0.07, 0, Math.PI * 2); k.fill(); } });
    },
    pin(ctx, s, lt, o) {
      T.outlined(ctx, (k) => { k.moveTo(0, s / 2); k.bezierCurveTo(-s * 0.4, 0, -s * 0.36, -s / 2, 0, -s / 2); k.bezierCurveTo(s * 0.36, -s / 2, s * 0.4, 0, 0, s / 2); k.closePath(); }, o.color ?? P.red, { line: s * 0.04 });
      T.outlined(ctx, (k) => k.arc(0, -s * 0.2, s * 0.12, 0, Math.PI * 2), '#ffffff', { line: s * 0.03 });
    },
    bomb(ctx, s, lt) {
      T.outlined(ctx, (k) => k.arc(0, s * 0.08, s * 0.38, 0, Math.PI * 2), '#2a2a2e', { line: s * 0.04, shade: (k) => { k.fillStyle = 'rgba(255,255,255,0.25)'; k.beginPath(); k.arc(-s * 0.14, -s * 0.06, s * 0.1, 0, Math.PI * 2); k.fill(); } });
      T.outlined(ctx, (k) => k.rect(-s * 0.1, -s * 0.38, s * 0.2, s * 0.12), '#5a5a5e', { line: s * 0.03 });
      ctx.strokeStyle = '#8a5a32'; ctx.lineWidth = s * 0.04; ctx.beginPath(); ctx.moveTo(0, -s * 0.38); ctx.quadraticCurveTo(s * 0.1, -s * 0.52, s * 0.22, -s * 0.48); ctx.stroke();
      if (Math.floor(lt * 15) % 2 === 0) { ctx.fillStyle = '#ffd860'; ctx.beginPath(); ctx.arc(s * 0.24, -s * 0.5, s * 0.06, 0, Math.PI * 2); ctx.fill(); }
    },
    canister(ctx, s, lt, o) {
      const col = o.color ?? '#6a7a4a';
      T.outlined(ctx, (k) => T.rrect(k, -s * 0.22, -s * 0.45, s * 0.44, s * 0.95, s * 0.08), col, { line: s * 0.04, shade: (k) => { k.fillStyle = '#e8d84a'; k.fillRect(-s * 0.22, -s * 0.05, s * 0.44, s * 0.12); } });
      T.outlined(ctx, (k) => k.rect(-s * 0.08, -s * 0.55, s * 0.16, s * 0.12), '#8a8f96', { line: s * 0.03 });
    },
    teacup(ctx, s) {
      T.outlined(ctx, (k) => k.ellipse(0, s * 0.3, s * 0.48, s * 0.1, 0, 0, Math.PI * 2), '#f4f0e6', { line: s * 0.03 });
      T.outlined(ctx, (k) => { k.moveTo(-s * 0.34, -s * 0.15); k.quadraticCurveTo(-s * 0.32, s * 0.3, 0, s * 0.3); k.quadraticCurveTo(s * 0.32, s * 0.3, s * 0.34, -s * 0.15); k.closePath(); }, '#f4f0e6', { line: s * 0.035, shade: (k) => { k.fillStyle = '#3b62a8'; k.fillRect(-s * 0.4, -s * 0.05, s * 0.8, s * 0.06); } });
      ctx.strokeStyle = P.ink; ctx.lineWidth = s * 0.04; ctx.beginPath(); ctx.arc(s * 0.38, 0, s * 0.1, -1.2, 1.2); ctx.stroke();
    },
    telephone(ctx, s) {
      T.outlined(ctx, (k) => T.rrect(k, -s * 0.4, -s * 0.1, s * 0.8, s * 0.5, s * 0.12), '#1e1e22', { line: s * 0.04 });
      T.outlined(ctx, (k) => k.arc(0, s * 0.16, s * 0.16, 0, Math.PI * 2), '#e8e2d2', { line: s * 0.03 });
      T.outlined(ctx, (k) => { k.moveTo(-s * 0.5, -s * 0.2); k.quadraticCurveTo(0, -s * 0.42, s * 0.5, -s * 0.2); k.lineTo(s * 0.4, -s * 0.08); k.quadraticCurveTo(0, -s * 0.26, -s * 0.4, -s * 0.08); k.closePath(); }, '#1e1e22', { line: s * 0.04 });
    },
    microphone(ctx, s) {
      ctx.strokeStyle = P.ink; ctx.lineWidth = s * 0.05; ctx.beginPath(); ctx.moveTo(0, s * 0.5); ctx.lineTo(0, -s * 0.05); ctx.stroke();
      T.outlined(ctx, (k) => T.rrect(k, -s * 0.12, -s * 0.5, s * 0.24, s * 0.42, s * 0.12), '#8a8f96', { line: s * 0.035, shade: (k) => { k.strokeStyle = '#5a5e64'; k.lineWidth = s * 0.02; for (let y = -0.45; y < -0.1; y += 0.07) { k.beginPath(); k.moveTo(-s * 0.12, s * y); k.lineTo(s * 0.12, s * y); k.stroke(); } } });
      T.outlined(ctx, (k) => k.ellipse(0, s * 0.5, s * 0.22, s * 0.05, 0, 0, Math.PI * 2), '#3a3d42', { line: s * 0.03 });
    },
    crate(ctx, s, lt, o) {
      const col = o.color ?? '#9a6a3a';
      T.outlined(ctx, (k) => k.rect(-s * 0.5, -s * 0.45, s, s * 0.9), col, { line: s * 0.035, shade: (k) => { k.strokeStyle = T.shade(col, -0.35); k.lineWidth = s * 0.05; k.strokeRect(-s * 0.42, -s * 0.37, s * 0.84, s * 0.74); k.beginPath(); k.moveTo(-s * 0.42, -s * 0.37); k.lineTo(s * 0.42, s * 0.37); k.stroke(); } });
      if (o.text) T.toonText(ctx, o.text, 0, s * 0.08, { size: s * 0.16, fill: '#2a1c15', stroke: 0, shadow: false });
    },
    barrel(ctx, s, lt, o) {
      const col = o.color ?? '#8a5a32';
      T.outlined(ctx, (k) => { k.moveTo(-s * 0.32, -s * 0.45); k.quadraticCurveTo(-s * 0.45, 0, -s * 0.32, s * 0.45); k.lineTo(s * 0.32, s * 0.45); k.quadraticCurveTo(s * 0.45, 0, s * 0.32, -s * 0.45); k.closePath(); }, col, { line: s * 0.035, shade: (k) => { k.fillStyle = '#5a5e64'; for (const y of [-0.3, 0.3]) k.fillRect(-s * 0.45, s * y - s * 0.03, s * 0.9, s * 0.06); } });
    },
    // Generic hanging banner with a plain disc emblem (for regimes, parties, factions — no real symbols).
    banner(ctx, s, lt, o) {
      const w = s * 0.42, col = o.color ?? '#b8262a';
      ctx.strokeStyle = P.ink; ctx.lineWidth = s * 0.02; ctx.beginPath(); ctx.moveTo(-w * 0.7, -s / 2); ctx.lineTo(w * 0.7, -s / 2); ctx.stroke();
      const sway = Math.sin(lt * 1.1) * s * 0.01;
      T.outlined(ctx, (k) => { k.moveTo(-w / 2, -s / 2); k.lineTo(w / 2, -s / 2); k.lineTo(w / 2 + sway, s / 2); k.lineTo(sway, s * 0.42); k.lineTo(-w / 2 + sway, s / 2); k.closePath(); }, col, { line: s * 0.02, shade: (k) => { k.fillStyle = T.shade(col, -0.22); k.fillRect(w * 0.15, -s / 2, w * 0.35, s); } });
      T.outlined(ctx, (k) => k.arc(sway / 2, -s * 0.12, w * 0.3, 0, Math.PI * 2), o.emblem ?? '#f2efe8', { line: s * 0.015 });
      if (o.text) T.toonText(ctx, o.text, sway / 2, -s * 0.08, { size: w * 0.26, fill: P.ink, stroke: 0, shadow: false });
    },
    placard(ctx, s, lt, o) {
      ctx.strokeStyle = '#7a5232'; ctx.lineWidth = s * 0.05; ctx.beginPath(); ctx.moveTo(0, s / 2); ctx.lineTo(0, -s * 0.1); ctx.stroke();
      T.outlined(ctx, (k) => k.rect(-s * 0.42, -s / 2, s * 0.84, s * 0.44), o.color ?? '#f6efe0', { line: s * 0.03 });
      if (o.text) T.toonText(ctx, o.text, 0, -s * 0.22, { size: T.fitSize(ctx, o.text, s * 0.14, s * 0.76), fill: o.textColor ?? P.red, stroke: 0, shadow: false });
    },
  };
  Object.assign(T.PROPS, add);
})();
