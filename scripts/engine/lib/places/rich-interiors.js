// rich-interiors.js — painted (Places 2.0) versions of the interiors used most: office (wood wall, bookshelf, filing
// cabinet, pictures, wall clock, window with a light shaft, banker's lamp, rich desk), gallery (moulded wall, gilt
// frames under picture lights, parquet, bench, rope barrier) and stage (velvet backdrop, gilt proscenium, valance,
// swaying curtains, footlights, spotlight cones with dust). Same fields as the classic kinds; classic look unchanged.
(function () {
  'use strict';
  const T = window.TOON, W = T.W, H = T.H, TAU = Math.PI * 2;
  const INK = '#3a281c', rgba = T.rgba;
  const ol = (ctx, path, fill, line = 4, o = {}) => T.outlined(ctx, path, fill, { line, ink: INK, ...o });
  const key = (kind, env, bg, plane) => `${kind}|${env.seed}|${T.bgKey(bg)}|${plane}`;
  const st = (p, i, env) => ({ x: (p.x ?? 0.5) * W, y: (p.y ?? 0.78) * H, s: p.scale ?? 1, seed: `${env.seed}:${p.kind}:${i}` });
  const drawParts = (ctx, parts, env) => parts.forEach((p, i) => T.SET_PARTS[p.kind].draw(ctx, p, env, st(p, i, env)));
  const liveParts = (ctx, parts, lt, env) => parts.forEach((p, i) => { const P = T.SET_PARTS[p.kind]; if (P.live) P.live(ctx, p, lt, env, st(p, i, env)); });

  // ---------- office ----------
  function wallClock(ctx, x, y, r) {
    ctx.fillStyle = rgba('#140a06', 0.25); ctx.beginPath(); ctx.arc(x + 8, y + 10, r + 8, 0, TAU); ctx.fill();
    ol(ctx, (k) => k.arc(x, y, r + 10, 0, TAU), '#5a3420', 5);
    ol(ctx, (k) => k.arc(x, y, r, 0, TAU), '#f4ecd6', 3, { shade: (k) => { k.fillStyle = INK; for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; k.fillRect(x + Math.cos(a) * r * 0.82 - 2, y + Math.sin(a) * r * 0.82 - 2, 4, 4); } k.strokeStyle = INK; k.lineWidth = 4; k.beginPath(); k.moveTo(x, y); k.lineTo(x + r * 0.5, y - r * 0.2); k.moveTo(x, y); k.lineTo(x - r * 0.1, y - r * 0.7); k.stroke(); } });
  }
  function officeParts(bg) {
    const fy = bg.floorY ?? 0.78, wx = bg.windowX ?? 0.72, side = wx > 0.5 ? 0 : 1, win = bg.window ?? 'porthole';
    const sx = side ? 0.86 : 0.13, parts = [
      { kind: 'wall', material: 'wood', color: bg.wall ?? '#a8673a', y: fy },
      { kind: 'floor', material: 'carpet', color: bg.carpet ?? '#7a2a22', y: fy },
      { kind: 'rug', x: bg.deskX ?? 0.5, y: fy + 0.13, w: 1250, color: T.shade(bg.carpet ?? '#7a2a22', -0.25), trim: '#c8963a' },
      { kind: 'shelf', x: sx, y: fy, scale: 1.15, items: ['books', 'mixed', 'books', 'jars'] },
      { kind: 'cabinet', x: sx + (side ? -0.13 : 0.13), y: fy, drawers: 4 },
      { kind: 'painting', x: side ? 0.62 : 0.4, y: 0.1, w: 0.09, h: 0.13, subject: 'portrait', frame: '#b88a2e' },
    ];
    if (win === 'arched' || win === 'grid') parts.push({ kind: 'window', x: wx, y: (0.62 * H - 420) / H, w: 300 / W, h: 420 / H, arch: win === 'arched', light: true, mullions: [2, 4] });
    if (win !== 'porthole') parts.push({ kind: 'plant', x: Math.min(0.95, wx + (wx > 0.85 ? -0.12 : 0.11)), y: fy, scale: 1.1 });
    else parts.push({ kind: 'painting', x: 0.62, y: 0.12, w: 0.08, h: 0.12, subject: 'sea' });
    return parts;
  }
  function porthole(ctx) {
    const x = W * 0.5, y = H * 0.2;
    ol(ctx, (k) => k.arc(x, y, 92, 0, TAU), '#7a4a2a', 7);
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, 66, 0, TAU); ctx.clip(); T.SET_VIEW(ctx, x - 66, y - 66, 132, 132, 'day', 'port'); ctx.restore();
    ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(x, y, 66, 0, TAU); ctx.stroke();
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; ol(ctx, (k) => k.arc(x + Math.cos(a) * 79, y + Math.sin(a) * 79, 5, 0, TAU), '#d8b048', 2); }
  }
  function officeDesk(ctx, bg, env) {
    const dx = W * (bg.deskX ?? 0.5), dy = H * 0.86, wood = bg.deskColor ?? '#7a4a2a';
    if (bg.chair !== false) { // tufted leather chair back
      T.texShape(ctx, (k) => T.rrect(k, dx - 150, dy - 520, 300, 420, 120), bg.chairColor ?? '#c89a4a', 'fabric', { line: 8, alpha: 0.25, detail: (k) => {
        k.strokeStyle = rgba('#5a3a10', 0.45); k.lineWidth = 3;
        for (let i = 0; i < 9; i++) { const bx = dx - 90 + (i % 3) * 90, by = dy - 440 + Math.floor(i / 3) * 100; k.beginPath(); k.arc(bx, by, 9, 0, TAU); k.stroke(); k.beginPath(); k.moveTo(bx - 40, by - 40); k.lineTo(bx, by); k.lineTo(bx + 40, by - 40); k.stroke(); }
      } });
    }
    T.contactShadow(ctx, dx, dy + 160, 380, 26, 0.5);
    T.texShape(ctx, (k) => k.rect(dx - 330, dy, 660, 160), T.shade(wood, -0.2), 'wood', { line: 8, detail: (k) => {
      for (const ox of [-220, 220]) { k.strokeStyle = rgba(INK, 0.7); k.lineWidth = 4; k.strokeRect(dx + ox - 80, dy + 26, 160, 110); k.strokeStyle = rgba('#ffe0b0', 0.2); k.lineWidth = 3; k.strokeRect(dx + ox - 74, dy + 32, 148, 98); k.fillStyle = '#d8b048'; k.fillRect(dx + ox - 16, dy + 70, 32, 8); }
      k.strokeStyle = rgba(INK, 0.6); k.lineWidth = 4; k.strokeRect(dx - 100, dy + 26, 200, 110);
    } });
    T.texShape(ctx, (k) => k.ellipse(dx, dy, 380, 70, 0, 0, TAU), wood, 'wood', { line: 8, rect: [dx - 380, dy - 70, 760, 140], detail: (k) => {
      k.fillStyle = rgba('#2a5a3a', 0.85); k.beginPath(); k.ellipse(dx, dy + 4, 190, 38, 0, 0, TAU); k.fill(); // leather blotter
      k.strokeStyle = rgba('#e2c070', 0.6); k.lineWidth = 3; k.beginPath(); k.ellipse(dx, dy + 4, 176, 32, 0, 0, TAU); k.stroke();
      k.fillStyle = rgba('#fff4d8', 0.18); k.beginPath(); k.ellipse(dx - 120, dy - 30, 160, 16, -0.05, 0, TAU); k.fill();
    } });
    if (bg.deskItems !== false) {
      for (const [ox, a] of [[-40, -0.12], [10, 0.08]]) { ctx.save(); ctx.translate(dx + ox, dy - 6); ctx.rotate(a); ol(ctx, (k) => k.rect(-70, -12, 140, 18), '#f6f0de', 3); ctx.restore(); }
      T.SET_ITEMS.inkwell(ctx, dx + 150, dy - 10, 1);
      T.SET_ITEMS.books(ctx, dx - 230, dy - 6, 0.9);
      T.SET_ITEMS.lamp(ctx, dx + 260, dy - 12, 1.1);
    }
  }
  T.richBg('office', (ctx, bg, lt, env) => {
    const fy = (bg.floorY ?? 0.78) * H, parts = officeParts(bg), e = { ...env, setFloorY: fy };
    T.plane(ctx, env, { f: 0.85, key: key('office', env, bg, 'room') }, (g) => {
      drawParts(g, parts, e);
      if ((bg.window ?? 'porthole') === 'porthole') porthole(g);
      wallClock(g, W * ((bg.windowX ?? 0.72) > 0.5 ? 0.53 : 0.47), H * 0.14, 44);
      if (bg.lamp) T.SET_PARTS.lamp.draw(g, { style: 'hanging', shade: '#2f5a3a' }, e, { x: W * 0.3, y: H * 0.2, s: 1, seed: 'olamp' });
    });
    T.plane(ctx, env, { f: 0.85, live: true }, (g) => {
      liveParts(g, parts, lt, e);
      if (bg.lamp) T.SET_PARTS.lamp.live(g, { style: 'hanging' }, lt, e, { x: W * 0.3, y: H * 0.2, s: 1, seed: env.seed + 'olamp' });
    });
    if (bg.desk !== false) T.plane(ctx, env, { f: 1, key: key('office', env, bg, 'desk') }, (g) => officeDesk(g, bg, env));
  });

  // ---------- gallery ----------
  function frameRich(ctx, f, i, env) {
    const x = f.x * W, y = f.y * H, w = f.w * W, h = f.h * H, b = 40, gold = f.frame ?? '#d8aa3a';
    ctx.fillStyle = rgba('#140a06', 0.3); ctx.fillRect(x - w / 2 - b + 14, y - h / 2 - b + 18, w + b * 2, h + b * 2);
    ol(ctx, (k) => k.rect(x - w / 2 - b, y - h / 2 - b, w + b * 2, h + b * 2), gold, 8, { shade: (k) => {
      k.strokeStyle = T.shade(gold, -0.45); k.lineWidth = 6; k.strokeRect(x - w / 2 - 18, y - h / 2 - 18, w + 36, h + 36);
      k.strokeStyle = rgba('#fff4b0', 0.6); k.lineWidth = 4; k.strokeRect(x - w / 2 - b + 8, y - h / 2 - b + 8, w + b * 2 - 16, h + b * 2 - 16);
      k.fillStyle = '#f6d878'; for (let c = 0; c < 4; c++) { k.beginPath(); k.arc(c < 2 ? x - w / 2 - 20 : x + w / 2 + 20, c % 2 ? y - h / 2 - 20 : y + h / 2 + 20, 13, 0, TAU); k.fill(); }
      for (let t = 0; t < 1; t += 0.08) { k.fillStyle = rgba('#7b5a10', 0.5); k.beginPath(); k.arc(x - w / 2 - b * 0.5 + t * (w + b), y - h / 2 - b * 0.5, 4, 0, TAU); k.arc(x - w / 2 - b * 0.5 + t * (w + b), y + h / 2 + b * 0.5, 4, 0, TAU); k.fill(); }
    } });
    ctx.save(); ctx.beginPath(); ctx.rect(x - w / 2, y - h / 2, w, h); ctx.clip();
    if (f.image) ctx.drawImage(T.img(f.image), x - w / 2, y - h / 2, w, h);
    else { const g = ctx.createLinearGradient(0, y - h / 2, 0, y + h / 2); g.addColorStop(0, f.top ?? '#86c3ee'); g.addColorStop(1, f.bottom ?? '#9fb86a'); ctx.fillStyle = g; ctx.fillRect(x - w / 2, y - h / 2, w, h); T.fillTexture(ctx, null, 'fabric', { rect: [x - w / 2, y - h / 2, w, h], alpha: 0.4, scale: 0.7, seed: i }); const sh = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0); sh.addColorStop(0, rgba('#ffffff', 0.12)); sh.addColorStop(0.5, rgba('#ffffff', 0)); ctx.fillStyle = sh; ctx.fillRect(x - w / 2, y - h / 2, w, h); }
    ctx.restore();
    ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.strokeRect(x - w / 2, y - h / 2, w, h);
    ol(ctx, (k) => T.rrect(k, x - 70, y - h / 2 - b - 40, 140, 24, 10), '#2a2622', 4); // picture light
    if (f.plaque) { ol(ctx, (k) => T.rrect(k, x - 150, y + h / 2 + 50, 300, 58, 6), '#e8cf88', 5, { shade: (k) => { k.strokeStyle = rgba('#7b5a10', 0.6); k.lineWidth = 3; k.strokeRect(x - 140, y + h / 2 + 58, 280, 42); } }); T.toonText(ctx, f.plaque, x, y + h / 2 + 91, { size: 30, fill: INK, stroke: 0, shadow: false }); }
  }
  T.richBg('gallery', (ctx, bg, lt, env) => {
    const fy = (bg.floorY ?? 0.82) * H, frames = bg.frames ?? [{ x: 0.5, y: 0.38, w: 0.36, h: 0.4 }];
    T.plane(ctx, env, { f: 0.9, key: key('gallery', env, bg, 'wall') }, (g) => {
      T.wallAt(g, 'plaster', [-420, -420, W + 840, fy + 420], { color: bg.wall ?? '#e9dcc0', trim: bg.dado ?? '#6b4a2e', seed: 'gal' });
      T.texBox(g, -420, H * 0.02, W + 840, 26, T.shade(bg.wall ?? '#e9dcc0', -0.12), null, { line: 4 }); // picture rail
      frames.forEach((f, i) => frameRich(g, f, i, env));
      T.floorAt(g, 'wood', fy, H + 420, { color: bg.floor ?? '#a8784d', seed: 'galf' });
      if (bg.bench !== false && frames.length < 3) T.SET_PARTS.bench.draw(g, { back: false, w: 460 }, env, { x: W * 0.5, y: fy + H * 0.1, s: 0.8, seed: 'gb' });
    });
    T.plane(ctx, env, { f: 0.9, live: true }, (g) => frames.forEach((f, i) => { // picture-light cones
      const x = f.x * W, y = f.y * H, w = f.w * W, h = f.h * H, top = y - h / 2 - 40 - 28, gr = g.createLinearGradient(0, top, 0, y + h / 2 + 60), k = T.flicker(lt, env.seed + 'pl' + i, 0.02);
      gr.addColorStop(0, rgba('#fff0c0', 0.36 * k)); gr.addColorStop(1, rgba('#fff0c0', 0));
      g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = gr; g.beginPath(); g.moveTo(x - 60, top); g.lineTo(x + 60, top); g.lineTo(x + w / 2 + 60, y + h / 2 + 60); g.lineTo(x - w / 2 - 60, y + h / 2 + 60); g.closePath(); g.fill(); g.restore();
    }));
    if (bg.ropes !== false) T.plane(ctx, env, { f: 1.08, key: key('gallery', env, bg, 'rope') }, (g) => {
      const y = fy + H * 0.08, posts = [0.06, 0.36, 0.64, 0.94];
      for (let i = 0; i < posts.length - 1; i++) { const a = posts[i] * W, b = posts[i + 1] * W; g.strokeStyle = INK; g.lineWidth = 16; g.beginPath(); g.moveTo(a, y - 110); g.quadraticCurveTo((a + b) / 2, y - 40, b, y - 110); g.stroke(); g.strokeStyle = '#a8202a'; g.lineWidth = 10; g.stroke(); }
      for (const px of posts) { const x = px * W; T.contactShadow(g, x, y, 50, 8, 0.45); ol(g, (k) => k.rect(x - 9, y - 120, 18, 120), '#c89a3a', 4); ol(g, (k) => k.ellipse(x, y - 4, 40, 10, 0, 0, TAU), '#b88a2e', 4); ol(g, (k) => k.arc(x, y - 126, 15, 0, TAU), '#e2b23c', 4); }
    });
  });

  // ---------- stage ----------
  T.richBg('stage', (ctx, bg, lt, env) => {
    const red = bg.color ?? '#8a1a1a', floorY = H * 0.8, spots = bg.spots ?? [0.35, 0.65];
    T.plane(ctx, env, { f: 0.9, key: key('stage', env, bg, 'back') }, (g) => {
      const back = bg.back ?? '#2a1210';
      g.fillStyle = back; g.fillRect(-420, -420, W + 840, H + 840);
      for (let x = -420, i = 0; x < W + 420; x += 90, i++) { // velvet backdrop folds
        const gr = g.createLinearGradient(x, 0, x + 90, 0); gr.addColorStop(0, rgba(T.shade(back, 0.18), 1)); gr.addColorStop(0.5, rgba(T.shade(back, -0.3), 1)); gr.addColorStop(1, rgba(T.shade(back, 0.18), 1));
        g.fillStyle = gr; g.fillRect(x, -420, 90, floorY + 420);
      }
      T.fillTexture(g, null, 'fabric', { rect: [-420, -420, W + 840, floorY + 420], alpha: 0.35 });
      T.floorAt(g, 'wood', floorY, H + 420, { color: bg.floor ?? '#8a5a32', seed: 'stage' });
      T.texBox(g, -420, floorY - 4, W + 840, 26, T.shade(bg.floor ?? '#8a5a32', -0.2), 'wood', { line: 5 }); // stage lip
      for (let x = 40; x < W; x += 150) { ol(g, (k) => T.rrect(k, x - 34, floorY + 34, 68, 26, 10), '#2a2622', 4); }
    });
    T.plane(ctx, env, { f: 0.9, live: true }, (g) => {
      for (let x = 40; x < W; x += 150) T.lampPool(g, x, floorY + 40, 120, '#ffe0a0', 0.5, lt, env.seed + 'foot' + x); // footlights
      for (const s of spots) {
        const x = s * W, gr = g.createLinearGradient(0, -100, 0, floorY + 60);
        gr.addColorStop(0, rgba('#fff4d0', 0.3)); gr.addColorStop(1, rgba('#fff4d0', 0.1));
        g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = gr;
        g.beginPath(); g.moveTo(x - 50 + (x - W / 2) * 0.1, -100); g.lineTo(x + 50 + (x - W / 2) * 0.1, -100); g.lineTo(x + 300, floorY + 40); g.lineTo(x - 300, floorY + 40); g.closePath(); g.fill();
        const pool = g.createRadialGradient(x, floorY + 50, 0, x, floorY + 50, 340); pool.addColorStop(0, rgba('#fff0c8', 0.5)); pool.addColorStop(1, rgba('#fff0c8', 0));
        g.fillStyle = pool; g.save(); g.translate(x, floorY + 50); g.scale(1, 0.26); g.translate(-x, -(floorY + 50)); g.fillRect(x - 340, floorY + 50 - 340, 680, 680); g.restore();
        g.restore();
        T.dustMotes(g, x - 300, 0, 600, floorY, lt, env.seed + 'sp' + s, { n: 26, clip: (k) => { k.moveTo(x - 50, -100); k.lineTo(x + 50, -100); k.lineTo(x + 300, floorY + 40); k.lineTo(x - 300, floorY + 40); k.closePath(); }, alpha: 0.6 });
      }
      T.curtain(g, -420, W * 0.2, -420, H + 40, red, lt, 'cl');
      T.curtain(g, W * 0.8, W + 420, -420, H + 40, red, lt, 'cr');
    });
    T.plane(ctx, env, { f: 0.9, key: key('stage', env, bg, 'arch') }, (g) => {
      const gold = bg.gold ?? '#d8a83a';
      T.texShape(g, (k) => { k.moveTo(-420, -420); k.lineTo(W + 420, -420); k.lineTo(W + 420, H * 0.1); for (let x = W + 420; x > -420; x -= 160) k.quadraticCurveTo(x - 80, H * 0.2, x - 160, H * 0.1); k.closePath(); }, T.shade(red, -0.1), 'fabric', { line: 5, alpha: 0.35, rect: [-420, -420, W + 840, H * 0.2 + 420], detail: (k) => {
        k.fillStyle = gold; k.fillRect(-420, H * 0.08, W + 840, 12);
        k.strokeStyle = rgba(T.shade(red, -0.5), 0.6); k.lineWidth = 5; for (let x = -340; x < W + 420; x += 160) { k.beginPath(); k.moveTo(x, -420); k.quadraticCurveTo(x + 6, H * 0.05, x - 4, H * 0.16); k.stroke(); }
      } });
      for (let x = -420 + 80; x < W + 420; x += 160) { g.strokeStyle = gold; g.lineWidth = 4; g.beginPath(); g.moveTo(x, H * 0.17); g.lineTo(x, H * 0.22); g.stroke(); ol(g, (k) => { k.moveTo(x - 10, H * 0.22); k.lineTo(x + 10, H * 0.22); k.lineTo(x + 14, H * 0.27); k.lineTo(x - 14, H * 0.27); k.closePath(); }, gold, 3); }
      for (const d of [-1, 1]) { const x = d < 0 ? 40 : W - 40; T.texShape(g, (k) => k.rect(x - 60, -420, 120, H + 460), gold, null, { line: 6, detail: (k) => { k.strokeStyle = T.shade(gold, -0.4); k.lineWidth = 5; k.strokeRect(x - 40, H * 0.2, 80, H * 0.7); for (let y = H * 0.25; y < H * 0.85; y += 90) { k.fillStyle = '#f6d878'; k.beginPath(); k.arc(x, y, 12, 0, TAU); k.fill(); } } }); }
      ol(g, (k) => { k.moveTo(W / 2 - 120, H * 0.0); k.quadraticCurveTo(W / 2, -H * 0.06, W / 2 + 120, H * 0.0); k.lineTo(W / 2 + 90, H * 0.09); k.lineTo(W / 2 - 90, H * 0.09); k.closePath(); }, gold, 5, { shade: (k) => { k.fillStyle = '#f6d878'; k.beginPath(); k.arc(W / 2, H * 0.04, 22, 0, TAU); k.fill(); } });
    });
  });
})();
