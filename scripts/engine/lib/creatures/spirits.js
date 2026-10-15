// spirits.js — non-quadruped creatures for the `creature` layer: reaper (death figure: skull mask with fangs, black
// ragged robe ending in a ghost tail, light-grey rim so it reads on dark), raven and dove (perch, head snap, flap),
// skeleton (bean rig with skull head + rib outfit). Measured on "The God of Horror" (0:38, 5:50, 13:03, 16:05).
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL;
  const shade = (c, k) => T.shade(c, k);
  const inWin = (wins, lt) => (wins || []).some(([a, b]) => lt >= a && lt <= b);
  const step2 = (lt) => Math.floor(lt * 15);

  // Reaper: units like a bean (600 tall incl. tail). expr: neutral | smile | menace. pose: idle | reach | sign.
  // Fields: hold (prop kind or 'scythe'), rim (outline color), robe, mask.
  function reaper(ctx, L, lt) {
    const k = (L.size ?? 460) / 600, rim = L.rim ?? '#8a8a8a', robe = L.robe ?? '#141416', mask = L.mask ?? '#f2f0ec';
    const bob = Math.sin((lt * Math.PI * 2) / 1.6) * 8, sway = Math.sin(lt * 1.4) * 0.03;
    ctx.scale(k, k); ctx.translate(0, bob); ctx.rotate(sway);
    const ink = { ink: rim, line: 9 };
    // ghost tail + robe (ragged hem spikes)
    T.outlined(ctx, (c) => {
      c.moveTo(-120, -360); c.quadraticCurveTo(-180, -200, -170, -110);
      const hem = [[-170, -110], [-130, -60], [-110, -100], [-70, -30], [-40, -90], [0, 0], [30, -80], [70, -40], [100, -100], [150, -70]];
      hem.forEach(([x, y]) => c.lineTo(x, y + Math.sin(lt * 4 + x) * 4));
      c.quadraticCurveTo(170, -220, 120, -360); c.closePath();
    }, robe, { ...ink, shade: (c) => { c.fillStyle = shade(robe, 0.12); c.fillRect(30, -380, 60, 300); } });
    // hood
    T.outlined(ctx, (c) => c.ellipse(0, -470, 196, 186, 0, 0, Math.PI * 2), robe, ink);
    // zig-zag "smoke" antenna above the hood, wiggles at 4 fps
    const w = Math.floor(lt * 4) % 2 ? 10 : -10;
    ctx.strokeStyle = rim; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, -656); ctx.lineTo(-24 + w, -700); ctx.lineTo(18 - w, -736); ctx.lineTo(-10 + w, -776); ctx.stroke();
    // skull mask: dome, fangs along the lower edge, left-half shading
    T.outlined(ctx, (c) => {
      c.moveTo(-150, -470); c.bezierCurveTo(-150, -650, 150, -650, 150, -470);
      const teeth = [[110, -380], [90, -330], [60, -380], [30, -300], [0, -372], [-30, -310], [-60, -380], [-90, -336], [-110, -380]];
      teeth.forEach(([x, y]) => c.lineTo(x, y)); c.closePath();
    }, mask, { shade: (c) => { c.fillStyle = shade(mask, -0.18); c.fillRect(-170, -660, 120, 320); } });
    const expr = T.timed(L.expr ?? 'neutral', lt).cur;
    ctx.fillStyle = '#121214'; ctx.strokeStyle = '#121214'; ctx.lineWidth = 12;
    [-58, 58].forEach((ex) => {
      if (expr === 'smile') { ctx.beginPath(); ctx.moveTo(ex - 26, -486); ctx.quadraticCurveTo(ex, -526, ex + 26, -486); ctx.stroke(); }
      else if (expr === 'menace') { ctx.beginPath(); ctx.ellipse(ex, -486, 34, 16, ex > 0 ? -0.35 : 0.35, 0, Math.PI * 2); ctx.fill(); }
      else { ctx.beginPath(); ctx.ellipse(ex, -490, 30, 40, 0, 0, Math.PI * 2); ctx.fill(); }
    });
    ctx.beginPath(); ctx.ellipse(0, -424, 14, 18, 0, 0, Math.PI * 2); ctx.fill();
    if (expr === 'smile') { ctx.beginPath(); ctx.moveTo(-50, -410); ctx.quadraticCurveTo(0, -372, 50, -410); ctx.stroke(); }
    // long-fingered gloves
    const pose = T.timed(L.pose ?? 'idle', lt).cur;
    const hands = pose === 'reach' ? [[-210, -470, -0.6], [210, -470, 0.6]] : pose === 'sign' ? [[-150, -260, 0], [170, -420, 0.4]] : [[-160, -250, -0.2], [160, -250, 0.2]];
    hands.forEach(([x, y, a], i) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(a + (pose === 'reach' ? Math.sin(lt * 2 + i) * 0.05 : 0));
      for (let f = 0; f < 4; f++) T.outlined(ctx, (c) => T.rrect(c, -30 + f * 18, -96, 16, 80, 8), '#f4f2ee', { line: 6 });
      T.outlined(ctx, (c) => c.ellipse(0, -10, 40, 36, 0, 0, Math.PI * 2), '#f4f2ee', { line: 7 });
      ctx.restore();
    });
    if (L.hold === 'scythe') {
      ctx.save(); ctx.translate(160, -250); ctx.rotate(0.1);
      T.outlined(ctx, (c) => T.rrect(c, -10, -420, 20, 560, 10), '#6b4423', { line: 7 });
      T.outlined(ctx, (c) => { c.moveTo(0, -420); c.quadraticCurveTo(-200, -470, -280, -330); c.quadraticCurveTo(-190, -410, 0, -380); c.closePath(); }, '#cfd5da', { line: 7 });
      ctx.restore();
    } else if (L.hold && T.drawProp) { ctx.save(); ctx.translate(170, -470); T.drawProp(ctx, L.hold, 200, lt, L); ctx.restore(); }
  }

  // Bird rig shared by raven and dove. Fields: flap (windows) or fly (bool), headTurn (bool, snaps every ~1.7 s), perch.
  function bird(ctx, L, lt, colors) {
    const k = (L.size ?? 160) / 240, flapping = L.fly || inWin(L.flap, lt);
    ctx.scale(k, k);
    const body = colors.body, hi = colors.hi;
    if (L.perch !== false && !flapping) { ctx.strokeStyle = '#3a3a3a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-6, -40); ctx.lineTo(-12, 0); ctx.moveTo(14, -40); ctx.lineTo(10, 0); ctx.stroke(); }
    const up = flapping && step2(lt) % 4 < 2;
    if (flapping) T.outlined(ctx, (c) => { c.moveTo(-20, -120); c.quadraticCurveTo(-60, up ? -280 : -40, -150, up ? -300 : -10); c.quadraticCurveTo(-60, up ? -200 : -80, 20, -110); c.closePath(); }, shade(body, -0.15)); // far wing
    T.outlined(ctx, (c) => { c.moveTo(-130, -90); c.lineTo(-170, -60); c.lineTo(-150, -110); c.quadraticCurveTo(-40, -180, 50, -150); c.quadraticCurveTo(90, -80, 20, -40); c.quadraticCurveTo(-60, -40, -130, -90); c.closePath(); }, body, { shade: (c) => { c.fillStyle = hi; c.beginPath(); c.ellipse(0, -140, 50, 20, -0.2, 0, Math.PI * 2); c.fill(); } });
    const turned = L.headTurn && Math.floor((lt + (T.hash(L.id ?? 'bird') % 7) / 3) / 1.7) % 2 === 1;
    const hd = turned ? -1 : 1;
    T.outlined(ctx, (c) => c.arc(48, -170, 44, 0, Math.PI * 2), body);
    T.outlined(ctx, (c) => { c.moveTo(48 + hd * 36, -184); c.lineTo(48 + hd * 96, -170); c.lineTo(48 + hd * 36, -156); c.closePath(); }, colors.beak, { line: 6 });
    ctx.fillStyle = colors.eye; ctx.beginPath(); ctx.arc(48 + hd * 16, -180, 8, 0, Math.PI * 2); ctx.fill();
    if (flapping) T.outlined(ctx, (c) => { c.moveTo(-20, -110); c.quadraticCurveTo(-40, up ? -300 : -20, -110, up ? -320 : 20); c.quadraticCurveTo(-20, up ? -220 : -60, 30, -100); c.closePath(); }, body); // near wing
    else T.outlined(ctx, (c) => { c.moveTo(-90, -100); c.quadraticCurveTo(-10, -150, 30, -110); c.quadraticCurveTo(-20, -70, -90, -100); c.closePath(); }, shade(body, 0.08), { line: 6 });
  }

  T.CREATURES = T.CREATURES || {};
  T.CREATURES.reaper = reaper;
  T.CREATURES.raven = (ctx, L, lt) => bird(ctx, L, lt, { body: L.color ?? '#1e1e22', hi: '#3a3a44', beak: '#8a8a8a', eye: '#ffffff' });
  T.CREATURES.dove = (ctx, L, lt) => bird(ctx, { fly: true, ...L }, lt, { body: L.color ?? '#f6f4f0', hi: '#ffffff', beak: '#e0a050', eye: '#2a1c15' });
  // Skeleton: the bean rig with a skull head and rib outfit; accepts every bean field (pose, talk, walk...).
  T.CREATURES.skeleton = (ctx, L, lt, env) => T.layers.bean(ctx, { ...L, type: 'bean', look: { outfit: 'skeleton', headShape: 'skull', hair: 'bald', ...(L.look || {}) } }, lt, env);
})();
