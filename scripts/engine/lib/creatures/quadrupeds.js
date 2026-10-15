// quadrupeds.js — layer type `creature` (registry T.CREATURES). This file: the quadruped rig shared by horse, bull,
// cow, camel and sheep (rounded body, neck, kind-specific head, 4 legs swinging in diagonal pairs on twos, tail).
// Units: back height ~420, hooves at y 0, facing +x (use flip to face left). `size` = on-screen height in px.
// Fields: kind, size, walk/run windows (layer time), gaitRate, rider (cast name), riderPose, riderExpr, riderScale,
// glow (true | color), color, color2, horns (bull/cow), spots (cow).
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL;
  const shade = (c, k) => T.shade(c, k);
  const inWin = (wins, lt) => (wins || []).some(([a, b]) => lt >= a && lt <= b);
  const twos = (lt) => Math.floor(lt * 15) / 15;
  T.CREATURES = T.CREATURES || {};

  const BASE = {
    horse: { body: '#7a5040', mane: '#2e1c14', neck: [[150, -300], [262, -470]], head: 'horse', len: 1 },
    bull: { body: '#f2f0ea', mane: '#d8d4cc', neck: [[160, -290], [250, -400]], head: 'bull', hump: 46, horns: 'long' },
    cow: { body: '#f4f1ea', mane: '#2a2624', neck: [[160, -290], [250, -400]], head: 'bull', horns: 'short', spots: true },
    camel: { body: '#d9b880', mane: '#b8955a', neck: [[160, -300], [300, -560]], head: 'camel', hump: 120 },
    sheep: { body: '#f4f1ea', mane: '#2a2624', neck: [[150, -270], [230, -360]], head: 'sheep', wool: true, legCol: '#2a2624' },
  };

  function gait(L, lt) {
    const run = inWin(L.run, lt), walk = !run && inWin(L.walk, lt);
    if (!run && !walk) return { a: 0, bob: 0, pitch: 0 };
    const period = (run ? 0.42 : 0.7) / (L.gaitRate ?? 1), ph = (twos(lt) / period) % 1, s = Math.sin(ph * Math.PI * 2);
    return { a: s * (run ? 34 : 18) * T.DEG, bob: run ? -Math.abs(Math.cos(ph * Math.PI * 2)) * 26 : -Math.abs(s) * 6, pitch: run ? s * 3 * T.DEG : 0, run };
  }

  function leg(ctx, x, ang, col, hoof, far, len = 200) {
    ctx.save(); ctx.translate(x, -200); ctx.rotate(ang);
    const c = far ? shade(col, -0.25) : col;
    T.outlined(ctx, (k) => { k.moveTo(-26, -10); k.lineTo(26, -10); k.lineTo(18, len - 20); k.lineTo(-18, len - 20); k.closePath(); }, c); // tapering leg
    T.outlined(ctx, (k) => T.rrect(k, -24, len - 26, 48, 30, 8), hoof, { line: 6 });
    ctx.restore();
  }

  function head(ctx, kind, cfg, col, lt, L) {
    const [, [hx, hy]] = cfg.neck;
    ctx.save(); ctx.translate(hx, hy);
    if (kind === 'horse') {
      ctx.rotate(0.5);
      T.outlined(ctx, (k) => T.rrect(k, -40, -40, 170, 82, 36), col, { shade: (k) => { k.fillStyle = shade(col, 0.15); k.fillRect(70, -40, 70, 82); } });
      for (const ex of [-20, 6]) T.outlined(ctx, (k) => { k.moveTo(ex, -36); k.lineTo(ex + 12, -84); k.lineTo(ex + 26, -34); k.closePath(); }, col, { line: 6 });
      ctx.fillStyle = P.ink; ctx.beginPath(); ctx.arc(30, -10, 9, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(116, 14, 7, 10, 0, 0, Math.PI * 2); ctx.fill();
    } else if (kind === 'bull') {
      const horn = L.hornColor ?? '#c9ccd2', big = cfg.horns === 'long';
      for (const s of [-1, 1]) T.outlined(ctx, (k) => { k.moveTo(20 * s, -60); k.quadraticCurveTo(80 * s + 30, big ? -130 : -90, 40 * s + 50, big ? -170 : -110); k.quadraticCurveTo(50 * s + 10, -90, 10 * s, -50); k.closePath(); }, horn, { line: 6 });
      T.outlined(ctx, (k) => { k.moveTo(-50, -70); k.lineTo(70, -70); k.lineTo(96, 40); k.quadraticCurveTo(40, 82, -6, 40); k.closePath(); }, col, { shade: (k) => { k.fillStyle = shade(col, -0.18); k.fillRect(-60, -70, 40, 120); } });
      T.outlined(ctx, (k) => k.ellipse(48, 40, 52, 30, 0, 0, Math.PI * 2), L.muzzle ?? T.mix(col, '#e8a0a0', 0.3), { line: 6 });
      ctx.fillStyle = P.ink; [30, 64].forEach((nx) => { ctx.beginPath(); ctx.ellipse(nx, 40, 6, 9, 0, 0, Math.PI * 2); ctx.fill(); });
      if (cfg.horns === 'long') { ctx.fillStyle = cfg.mane; ctx.beginPath(); ctx.moveTo(-30, -70); for (let i = 0; i <= 6; i++) ctx.lineTo(-30 + i * 14, -70 + (i % 2 ? 26 : 0)); ctx.closePath(); ctx.fill(); } // forelock
      T.drawCreatureEye(ctx, 26, -20, L);
    } else if (kind === 'camel') {
      ctx.rotate(0.35);
      T.outlined(ctx, (k) => T.rrect(k, -30, -40, 130, 70, 32), col);
      ctx.fillStyle = P.ink; ctx.beginPath(); ctx.ellipse(20, -12, 14, 8, 0, 0, Math.PI); ctx.fill(); // droopy lid
      ctx.strokeStyle = P.ink; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(4, -14); ctx.lineTo(36, -14); ctx.stroke();
      T.outlined(ctx, (k) => k.ellipse(100, 16, 24, 14, 0, 0, Math.PI * 2), shade(col, -0.1), { line: 6 });
    } else if (kind === 'sheep') {
      T.outlined(ctx, (k) => k.ellipse(20, 0, 54, 42, 0.3, 0, Math.PI * 2), cfg.mane);
      for (const s of [-1, 1]) T.outlined(ctx, (k) => k.ellipse(-6, -30 + s * 6, 26, 12, -0.5, 0, Math.PI * 2), cfg.mane, { line: 5 });
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(36, -10, 9, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
  // Eyes for big animals: tired lids by default, pathos tears via L.tear, red glow via L.eyes = 'evil'.
  T.drawCreatureEye = (ctx, x, y, L) => {
    if (L.eyes === 'evil') { ctx.save(); ctx.shadowColor = '#ff2a2a'; ctx.shadowBlur = (20) * T.DPR; ctx.fillStyle = '#ff2a2a'; ctx.beginPath(); ctx.ellipse(x, y, 16, 6, -0.2, 0, Math.PI * 2); ctx.fill(); ctx.restore(); return; }
    ctx.fillStyle = P.ink; ctx.beginPath(); ctx.ellipse(x, y, 9, 13, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = P.ink; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x - 16, y - 8); ctx.lineTo(x + 16, y - 12); ctx.stroke();
    if (L.tear) { ctx.fillStyle = 'rgba(110,190,240,0.9)'; ctx.beginPath(); ctx.ellipse(x + 4, y + 26, 6, 10, 0, 0, Math.PI * 2); ctx.fill(); }
  };

  function quadruped(ctx, L, lt, env) {
    const kind = L.kind, cfg = { ...BASE[kind], ...(L.horns ? { horns: L.horns } : {}) };
    const col = L.color ?? cfg.body, legCol = cfg.legCol ?? col, hoof = L.color2 ?? '#3a2a20';
    const g = gait(L, lt), seed = (L.id ?? kind) + (L.x ?? '');
    const k = (L.size ?? 360) / 420;
    ctx.scale(k, k);
    ctx.translate(0, g.bob);
    if (L.glow) { ctx.shadowColor = L.glow === true ? 'rgba(255,255,255,0.95)' : L.glow; ctx.shadowBlur = (50 + Math.sin(lt * Math.PI) * 8) * T.DPR; }
    // far legs, tail, body, near legs, neck, head
    leg(ctx, 118, -g.a, legCol, hoof, true); leg(ctx, -118, g.a, legCol, hoof, true);
    const sway = Math.sin(lt * 2.2 + (T.hash(seed) % 9)) * 0.25;
    ctx.save(); ctx.translate(-212, -290); ctx.rotate(0.5 + sway);
    ctx.strokeStyle = P.ink; ctx.lineWidth = 22; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-30, 70, -10, 140); ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = 10; ctx.stroke();
    T.outlined(ctx, (kk) => kk.ellipse(-10, 150, 18, 30, 0, 0, Math.PI * 2), cfg.mane, { line: 5 });
    ctx.restore();
    ctx.save(); ctx.rotate(g.pitch);
    if (cfg.wool) {
      const r = T.rng(T.hash(seed + 'wool')), puffs = [];
      for (let i = 0; i < 12; i++) puffs.push([-180 + (i % 6) * 72 + r() * 20, -300 + Math.floor(i / 6) * 80 + r() * 20, 62 + r() * 16]);
      ctx.fillStyle = P.ink; puffs.forEach(([x, y, rr]) => { ctx.beginPath(); ctx.arc(x, y, rr + T.LINE, 0, Math.PI * 2); ctx.fill(); });
      ctx.fillStyle = col; puffs.forEach(([x, y, rr]) => { ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.fill(); });
    } else {
      const hump = cfg.hump ?? 0;
      T.outlined(ctx, (kk) => { kk.moveTo(-220, -260); kk.quadraticCurveTo(-230, -350, -120, -352); kk.quadraticCurveTo(-30, -352 - hump, 70, -350); kk.quadraticCurveTo(200, -350, 210, -270); kk.quadraticCurveTo(220, -180, 120, -172); kk.quadraticCurveTo(0, -136, -140, -172); kk.quadraticCurveTo(-225, -175, -220, -260); kk.closePath(); }, col, {
        shade: (kk) => {
          kk.fillStyle = shade(col, -0.2); kk.beginPath(); kk.ellipse(0, -160, 260, 50, 0, 0, Math.PI * 2); kk.fill();
          if (cfg.spots || L.spots) { const r = T.rng(T.hash(seed + 'spots')); kk.fillStyle = L.spotColor ?? '#2a2624'; for (let i = 0; i < 5; i++) { kk.beginPath(); T.smoothPath(kk, T.blobPts(-160 + r() * 320, -320 + r() * 120, 30 + r() * 30, 22 + r() * 20, seed + 's' + i, 9, 0.3)); kk.fill(); } }
        },
      });
    }
    ctx.shadowBlur = 0;
    leg(ctx, 150, g.a, legCol, hoof, false); leg(ctx, -150, -g.a, legCol, hoof, false);
    const [[nx, ny], [hx, hy]] = cfg.neck;
    T.outlined(ctx, (kk) => { kk.moveTo(nx - 60, ny + 40); kk.quadraticCurveTo((nx + hx) / 2 - 40, (ny + hy) / 2 - 30, hx - 40, hy); kk.lineTo(hx + 40, hy + 30); kk.quadraticCurveTo((nx + hx) / 2 + 40, (ny + hy) / 2 + 30, nx + 60, ny + 70); kk.closePath(); }, col);
    if (kind === 'horse') { ctx.fillStyle = cfg.mane; ctx.beginPath(); ctx.moveTo(nx - 60, ny + 30); for (let i = 0; i <= 8; i++) ctx.lineTo(T.lerp(nx - 60, hx - 40, i / 8) - (i % 2 ? 26 : 0), T.lerp(ny + 30, hy, i / 8) - (i % 2 ? 10 : 0)); ctx.lineTo(hx - 10, hy + 10); ctx.closePath(); ctx.fill(); }
    head(ctx, cfg.head, cfg, col, lt, L);
    ctx.restore();
    ctx.shadowBlur = 0; // the glow belongs to the animal body only, not to the rider or saddle
    if (L.rider) { // the rider sits on the saddle; legs hidden, blanket drawn over the hem
      ctx.save(); ctx.translate(-10, -282 + (L.riderY ?? 0)); // rider hem rests on the back
      T.layers.bean(ctx, { type: 'bean', who: L.rider, id: (L.id ?? 'rider') + 'r', size: 400 * (L.riderScale ?? 1), legs: false, pose: L.riderPose ?? 'idle', expr: L.riderExpr ?? 'neutral', hold: L.riderHold, holdL: L.riderHoldL, rock: 0.6, view: L.riderView ?? '3q' }, lt, { ...env, st: null });
      ctx.restore();
      T.outlined(ctx, (kk) => T.rrect(kk, -110, -380, 220, 70, 16), L.saddle ?? '#8f1f27', { line: 7 });
    }
  }

  for (const kind of Object.keys(BASE)) T.CREATURES[kind] = quadruped;

  T.layers.creature = (ctx, L, lt, env) => {
    const fn = T.CREATURES[L.kind];
    if (!fn) throw new Error('Unknown creature kind: ' + L.kind);
    fn(ctx, L, lt, env);
  };
})();
