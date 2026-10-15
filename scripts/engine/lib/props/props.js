// props.js — code-drawn objects in the toon style. Each prop is drawn centered at origin, `size` ≈ its height in px.
// Layer: { type:'prop', kind, size, text?, color?, spin? }. Also used by bean hands via T.drawProp(ctx, kind, size, lt).
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL;

  const PROPS = {
    coin(ctx, s, lt, o) {
      const sx = o.spin ? Math.cos(lt * 6) : 1;
      ctx.scale(Math.abs(sx) < 0.08 ? 0.08 : sx, 1);
      T.outlined(ctx, (k) => k.arc(0, 0, s / 2, 0, Math.PI * 2), P.gold, { line: s * 0.06, shade: (k) => { k.fillStyle = P.goldDark; k.beginPath(); k.arc(s * 0.12, s * 0.1, s / 2, 0, Math.PI * 2); k.fill(); k.fillStyle = P.gold; k.beginPath(); k.arc(0, 0, s * 0.36, 0, Math.PI * 2); k.fill(); } });
      T.toonText(ctx, o.text ?? '$', 0, s * 0.16, { size: s * 0.45, fill: P.goldDark, stroke: s * 0.03, shadow: false });
    },
    moneybag(ctx, s) {
      T.outlined(ctx, (k) => { k.moveTo(-s * 0.18, -s * 0.32); k.quadraticCurveTo(-s * 0.5, s * 0.05, -s * 0.38, s * 0.38); k.quadraticCurveTo(0, s * 0.52, s * 0.38, s * 0.38); k.quadraticCurveTo(s * 0.5, s * 0.05, s * 0.18, -s * 0.32); k.closePath(); }, '#c99a5b', { line: s * 0.05, shade: (k) => { k.fillStyle = '#a77a43'; k.fillRect(s * 0.1, -s * 0.4, s * 0.4, s); } });
      T.outlined(ctx, (k) => { k.moveTo(-s * 0.2, -s * 0.32); k.lineTo(-s * 0.3, -s * 0.5); k.lineTo(s * 0.3, -s * 0.5); k.lineTo(s * 0.2, -s * 0.32); k.closePath(); }, '#c99a5b', { line: s * 0.05 });
      T.toonText(ctx, '$', 0, s * 0.25, { size: s * 0.42, fill: P.gold, stroke: s * 0.06, shadow: false });
    },
    scroll(ctx, s, lt, o) {
      const w = s * 1.3, h = s * 0.8;
      T.outlined(ctx, (k) => k.rect(-w / 2, -h / 2, w, h), P.paper, { line: s * 0.04, shade: (k) => { k.strokeStyle = 'rgba(90,60,30,0.5)'; k.lineWidth = s * 0.025; for (let i = 0; i < 4; i++) { const y = -h * 0.25 + i * h * 0.17; k.beginPath(); k.moveTo(-w * 0.35, y); k.lineTo(w * 0.35 - (i === 3 ? w * 0.3 : 0), y); k.stroke(); } } });
      for (const sx of [-1, 1]) T.outlined(ctx, (k) => T.rrect(k, sx * w / 2 - s * 0.09, -h / 2 - s * 0.08, s * 0.18, h + s * 0.16, s * 0.08), P.paperDark, { line: s * 0.04 });
      if (o.text) T.toonText(ctx, o.text, 0, s * 0.06, { size: s * 0.2, fill: P.ink, stroke: 0, shadow: false });
    },
    sword(ctx, s) {
      T.outlined(ctx, (k) => { k.moveTo(-s * 0.05, -s * 0.15); k.lineTo(-s * 0.05, -s * 0.85); k.lineTo(0, -s); k.lineTo(s * 0.05, -s * 0.85); k.lineTo(s * 0.05, -s * 0.15); k.closePath(); }, '#d7dde2', { line: s * 0.03, shade: (k) => { k.fillStyle = '#aeb6bd'; k.fillRect(0, -s, s * 0.06, s); } });
      T.outlined(ctx, (k) => T.rrect(k, -s * 0.16, -s * 0.17, s * 0.32, s * 0.06, s * 0.03), P.gold, { line: s * 0.03 });
      T.outlined(ctx, (k) => T.rrect(k, -s * 0.04, -s * 0.12, s * 0.08, s * 0.18, s * 0.03), P.brown, { line: s * 0.03 });
    },
    flag(ctx, s, lt, o) {
      T.outlined(ctx, (k) => T.rrect(k, -s * 0.03, -s, s * 0.06, s, s * 0.03), P.brown, { line: s * 0.03 });
      T.outlined(ctx, (k) => k.arc(0, -s, s * 0.05, 0, Math.PI * 2), P.gold, { line: s * 0.025 });
      const w = s * 0.8, h = s * 0.45, wave = (x) => Math.sin(x / w * 5 - lt * 6) * s * 0.03 * (x / w);
      T.outlined(ctx, (k) => { k.moveTo(-s * 0.03, -s * 0.95); for (let x = 0; x <= w; x += w / 10) k.lineTo(-x, -s * 0.95 + wave(x)); for (let x = w; x >= 0; x -= w / 10) k.lineTo(-x, -s * 0.95 + h + wave(x)); k.closePath(); }, o.color ?? '#fff', { line: s * 0.03 });
      if (o.text) T.toonText(ctx, o.text, -w / 2, -s * 0.95 + h * 0.62, { size: s * 0.15, fill: P.ink, stroke: 0, shadow: false });
    },
    question(ctx, s, lt) { ctx.rotate(Math.sin(lt * 3) * 0.12); T.toonText(ctx, '?', 0, s * 0.35, { size: s, fill: '#fff' }); },
    exclaim(ctx, s, lt) { ctx.rotate(Math.sin(lt * 8) * 0.08); T.toonText(ctx, '!', 0, s * 0.35, { size: s, fill: P.red }); },
    bread(ctx, s) {
      T.outlined(ctx, (k) => k.ellipse(0, 0, s * 0.6, s * 0.32, 0, 0, Math.PI * 2), '#d99a4e', { line: s * 0.04, shade: (k) => { k.fillStyle = '#b6762f'; k.beginPath(); k.ellipse(0, s * 0.2, s * 0.6, s * 0.2, 0, 0, Math.PI * 2); k.fill(); } });
      ctx.strokeStyle = P.ink; ctx.lineWidth = s * 0.03;
      for (const x of [-0.3, 0, 0.3]) { ctx.beginPath(); ctx.moveTo(s * (x - 0.08), -s * 0.12); ctx.lineTo(s * (x + 0.08), s * 0.08); ctx.stroke(); }
    },
    temple(ctx, s) {
      const w = s * 1.5;
      T.outlined(ctx, (k) => { k.moveTo(-w * 0.55, -s * 0.72); k.lineTo(0, -s); k.lineTo(w * 0.55, -s * 0.72); k.closePath(); }, '#efe6d4', { line: s * 0.02 });
      T.outlined(ctx, (k) => k.rect(-w * 0.55, -s * 0.72, w * 1.1, s * 0.08), '#e2d6be', { line: s * 0.02 });
      for (let i = 0; i < 6; i++) { const x = -w * 0.45 + (i * w * 0.9) / 5; T.outlined(ctx, (k) => k.rect(x - s * 0.04, -s * 0.64, s * 0.08, s * 0.56), '#efe6d4', { line: s * 0.018, shade: (k) => { k.fillStyle = '#cfc3ad'; k.fillRect(x, -s * 0.64, s * 0.04, s * 0.56); } }); }
      T.outlined(ctx, (k) => k.rect(-w * 0.6, -s * 0.08, w * 1.2, s * 0.08), '#e2d6be', { line: s * 0.02 });
    },
    skull(ctx, s) {
      T.outlined(ctx, (k) => { k.arc(0, -s * 0.1, s * 0.38, Math.PI * 0.85, Math.PI * 2.15); k.lineTo(s * 0.2, s * 0.35); k.lineTo(-s * 0.2, s * 0.35); k.closePath(); }, '#f1ece0', { line: s * 0.05 });
      ctx.fillStyle = P.ink; [-1, 1].forEach((d) => { ctx.beginPath(); ctx.ellipse(d * s * 0.15, -s * 0.05, s * 0.09, s * 0.11, 0, 0, Math.PI * 2); ctx.fill(); });
    },
    heart(ctx, s, lt) {
      const b = 1 + Math.max(0, Math.sin(lt * 8)) * 0.08; ctx.scale(b, b);
      T.outlined(ctx, (k) => { k.moveTo(0, s * 0.35); k.bezierCurveTo(-s * 0.7, -s * 0.1, -s * 0.3, -s * 0.6, 0, -s * 0.25); k.bezierCurveTo(s * 0.3, -s * 0.6, s * 0.7, -s * 0.1, 0, s * 0.35); }, P.red, { line: s * 0.05 });
    },
    book(ctx, s, lt, o) {
      T.outlined(ctx, (k) => T.rrect(k, -s * 0.4, -s * 0.5, s * 0.8, s, s * 0.05), o.color ?? '#7a3b2e', { line: s * 0.04, shade: (k) => { k.fillStyle = '#f1e6c8'; k.fillRect(s * 0.3, -s * 0.46, s * 0.1, s * 0.92); } });
      if (o.text) T.toonText(ctx, o.text, -s * 0.05, 0, { size: s * 0.16, fill: P.gold, stroke: s * 0.03, shadow: false });
    },
    hourglass(ctx, s, lt) {
      const p = (lt * 0.3) % 1;
      T.outlined(ctx, (k) => { k.moveTo(-s * 0.3, -s * 0.5); k.lineTo(s * 0.3, -s * 0.5); k.lineTo(s * 0.05, 0); k.lineTo(s * 0.3, s * 0.5); k.lineTo(-s * 0.3, s * 0.5); k.lineTo(-s * 0.05, 0); k.closePath(); }, '#dff1f5', { line: s * 0.04, shade: (k) => { k.fillStyle = P.gold; k.fillRect(-s * 0.3, -s * 0.5 + p * s * 0.45, s * 0.6, s * 0.45 * (1 - p)); k.fillRect(-s * 0.3, s * 0.5 - p * s * 0.45, s * 0.6, p * s * 0.45); } });
      for (const y of [-0.5, 0.5]) T.outlined(ctx, (k) => T.rrect(k, -s * 0.38, s * y - s * 0.05, s * 0.76, s * 0.1, s * 0.04), P.brown, { line: s * 0.035 });
    },
    // Legionary scutum: tall curved red board, yellow boss + wings emblem (reference 22:36, 10:00).
    shield(ctx, s, lt, o) {
      const w = s * 0.62, h = s;
      T.outlined(ctx, (k) => T.rrect(k, -w / 2, -h / 2, w, h, s * 0.1), o.color ?? '#c8141c', { line: s * 0.035, shade: (k) => { k.fillStyle = T.shade(o.color ?? '#c8141c', -0.25); k.fillRect(w * 0.18, -h / 2, w * 0.32, h); k.strokeStyle = P.gold; k.lineWidth = s * 0.025; k.strokeRect(-w / 2 + s * 0.05, -h / 2 + s * 0.05, w - s * 0.1, h - s * 0.1); } });
      ctx.fillStyle = P.gold; ctx.strokeStyle = P.ink; ctx.lineWidth = s * 0.02;
      for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, -s * 0.02); ctx.quadraticCurveTo(d * w * 0.3, -s * 0.2, d * w * 0.38, -s * 0.05); ctx.quadraticCurveTo(d * w * 0.2, -s * 0.06, 0, s * 0.04); ctx.fill(); ctx.stroke(); }
      T.outlined(ctx, (k) => k.arc(0, 0, s * 0.09, 0, Math.PI * 2), P.gold, { line: s * 0.025 });
    },
    spear(ctx, s) {
      T.outlined(ctx, (k) => T.rrect(k, -s * 0.018, -s * 0.85, s * 0.036, s, s * 0.018), '#8a5a32', { line: s * 0.015 });
      T.outlined(ctx, (k) => { k.moveTo(0, -s); k.lineTo(s * 0.05, -s * 0.85); k.lineTo(-s * 0.05, -s * 0.85); k.closePath(); }, '#cfd5da', { line: s * 0.015 });
    },
    torch(ctx, s, lt) {
      T.outlined(ctx, (k) => T.rrect(k, -s * 0.05, -s * 0.55, s * 0.1, s * 0.6, s * 0.04), '#7a5232', { line: s * 0.03 });
      ctx.save(); ctx.translate(0, -s * 0.55); T.drawFlame(ctx, s * 0.5, lt, 'torch'); ctx.restore();
    },
    bulb(ctx, s, lt) {
      const g = ctx.createRadialGradient(0, -s * 0.1, 0, 0, -s * 0.1, s * 0.9); g.addColorStop(0, 'rgba(255,240,150,0.7)'); g.addColorStop(1, 'rgba(255,240,150,0)');
      ctx.fillStyle = g; ctx.fillRect(-s, -s, s * 2, s * 2);
      T.outlined(ctx, (k) => { k.arc(0, -s * 0.12, s * 0.3, Math.PI * 0.8, Math.PI * 2.2); k.lineTo(s * 0.12, s * 0.25); k.lineTo(-s * 0.12, s * 0.25); k.closePath(); }, '#fff27a', { line: s * 0.04 });
      T.outlined(ctx, (k) => T.rrect(k, -s * 0.14, s * 0.24, s * 0.28, s * 0.16, s * 0.04), '#9aa0a6', { line: s * 0.035 });
      ctx.strokeStyle = P.ink; ctx.lineWidth = s * 0.04; ctx.lineCap = 'round';
      for (let i = 0; i < 7; i++) { const a = -Math.PI * 0.95 + i * (Math.PI * 0.9 / 6), r0 = s * 0.42, r1 = s * (0.52 + 0.04 * Math.sin(lt * 9 + i)); ctx.beginPath(); ctx.moveTo(Math.cos(a) * r0, -s * 0.12 + Math.sin(a) * r0); ctx.lineTo(Math.cos(a) * r1, -s * 0.12 + Math.sin(a) * r1); ctx.stroke(); }
    },
  };
  T.PROPS = PROPS;

  T.drawProp = (ctx, kind, size, lt, o = {}) => {
    const fn = PROPS[kind];
    if (!fn) throw new Error('Unknown prop kind: ' + kind);
    ctx.save();
    fn(ctx, size, lt, o);
    ctx.restore();
  };
  T.layers.prop = (ctx, L, lt) => T.drawProp(ctx, L.kind, L.size ?? 160, lt, L);
})();
