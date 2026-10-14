// text.js — on-screen lettering in the reference style: name labels with tag + arrow, titles, dates, era tag, counters, timer.
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL;

  T.drawArrow = (ctx, len = 150, w = 70, fill = '#fff') => {
    // Arrow pointing to +x, tail at origin.
    T.outlined(ctx, (k) => {
      k.moveTo(0, -w * 0.22); k.lineTo(len - w * 0.7, -w * 0.22); k.lineTo(len - w * 0.7, -w * 0.55);
      k.lineTo(len, 0); k.lineTo(len - w * 0.7, w * 0.55); k.lineTo(len - w * 0.7, w * 0.22); k.lineTo(0, w * 0.22); k.closePath();
    }, fill, { line: 10 });
  };
  // Safe frame: shift a centered text block horizontally so its screen extent stays inside a 3.5% margin.
  // Projects the layer through the camera (zoom/pan/focus, rotation ignored). Disable with keepInFrame:false.
  T.keepInFrame = (ctx, L, env, halfW) => {
    if (L.keepInFrame === false || !env.st) return;
    const c = env.cam, hud = L.hud ?? (L.type === 'era' || L.type === 'timer');
    const f = hud || !c ? 0 : L.z ?? 1, z = c ? 1 + (c.z - 1) * f : 1;
    const bx = env.st.bx ?? env.st.x; // anchor without slide-in offsets, so entrances are not cancelled
    const sx = (c && f ? c.fx + (bx - c.fx - c.px * f) * z : bx) + (c ? c.sx : 0);
    const m = T.W * 0.035, s = Math.abs(env.st.s) * z, left = sx - halfW * s, right = sx + halfW * s;
    let dx = 0;
    if (left < m) dx = (m - left) / s;
    else if (right > T.W - m) dx = (T.W - m - right) / s;
    if (dx) ctx.translate(dx * env.st.flip, 0);
  };
  const DIRS = { right: 0, 'down-right': 35, down: 90, 'down-left': 145, left: 180, 'up-left': 215, up: 270, 'up-right': 325 };
  const dirDeg = (d) => (typeof d === 'number' ? d : DIRS[d] ?? 0);

  // label: { text, tag, tagColor, size, arrow:'right'|deg, arrowLen }
  T.layers.label = (ctx, L, lt, env) => {
    const size = L.size ?? 96;
    T.keepInFrame(ctx, L, env, Math.max(T.measure(ctx, L.text, size), L.tag ? T.measure(ctx, L.tag, size * 0.5) : 0) / 2 + size * 0.15);
    ctx.rotate((L.tilt ?? -4) * T.DEG);
    if (L.tag) {
      const tp = T.ease.outBack(T.prog(lt, 0.08, 0.3));
      ctx.save(); ctx.translate(0, -size * 0.95); ctx.scale(tp, tp);
      T.toonText(ctx, L.tag, 0, 0, { size: size * 0.5, fill: L.tagColor ?? P.gold });
      ctx.restore();
    }
    T.toonText(ctx, L.text, 0, 0, { size, fill: L.color ?? '#fff' });
    if (L.arrow != null) {
      const ap = T.ease.outBack(T.prog(lt, L.arrowAt ?? 0.2, 0.3));
      const deg = dirDeg(L.arrow), a = deg * T.DEG, half = T.measure(ctx, L.text, size) / 2;
      const nudge = Math.sin(lt * 7) * 10;
      const ox = Math.cos(a) * (half * Math.abs(Math.cos(a)) + 40), oy = Math.sin(a) * (size * 0.6) + size * 0.25 + (Math.sin(a) > 0.3 ? size * 0.3 : 0);
      ctx.save(); ctx.translate(ox + Math.cos(a) * nudge, oy + Math.sin(a) * nudge); ctx.rotate(a); ctx.scale(ap, ap);
      T.drawArrow(ctx, L.arrowLen ?? size * 1.5, size * 0.75);
      ctx.restore();
    }
  };

  // title: big headline; letters pop one by one. { text, sub, color, size, stagger }
  T.layers.title = (ctx, L, lt, env) => {
    const text = String(L.text), st = L.stagger ?? 0.035;
    const size = T.fitSize(ctx, text, L.size ?? 120, T.W * 0.9);
    ctx.font = T.font(size);
    const total = T.measure(ctx, text, size);
    T.keepInFrame(ctx, L, env, total / 2);
    let x = -total / 2;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i], w = T.measure(ctx, ch, size);
      const p = T.ease.outBack(T.prog(lt, i * st, 0.28));
      if (p > 0) {
        ctx.save(); ctx.translate(x + w / 2, Math.sin(lt * 3 + i) * (L.jiggle ?? 2)); ctx.scale(p, p);
        T.toonText(ctx, ch, 0, 0, { size, fill: L.color ?? P.red, shadow: true });
        ctx.restore();
      }
      x += w;
    }
    if (L.sub) {
      const p = T.ease.outBack(T.prog(lt, text.length * st + 0.1, 0.3));
      ctx.save(); ctx.translate(0, size * 0.62); ctx.scale(p, p);
      T.toonText(ctx, L.sub, 0, 0, { size: size * 0.42, fill: L.subColor ?? '#fff' });
      ctx.restore();
    }
  };

  // date: "771" + small suffix "BC" (reference: white numerals, small trailing era mark).
  T.layers.date = (ctx, L, lt) => {
    const size = L.size ?? 110, text = String(L.text);
    const w = T.measure(ctx, text, size);
    const suffix = L.suffix ?? '';
    const sw = suffix ? T.measure(ctx, suffix, size * 0.45) : 0;
    T.toonText(ctx, text, -sw / 2, 0, { size, fill: L.color ?? '#fff' });
    if (suffix) T.toonText(ctx, suffix, w / 2 - sw / 2 + 10, -size * 0.02, { size: size * 0.45, fill: L.color ?? '#fff', align: 'left' });
  };

  // era: HUD tag bottom-left. { small, parts:[[text,color],...] }
  T.layers.era = (ctx, L) => {
    const size = L.size ?? 64;
    let x = 0;
    if (L.small) T.toonText(ctx, L.small, 0, -size * 0.95, { size: size * 0.38, align: 'left', stroke: size * 0.09 });
    for (const [text, color] of L.parts || [[L.text ?? '', P.red]]) {
      T.toonText(ctx, text, x, 0, { size, align: 'left', fill: color, stroke: size * 0.16 });
      x += T.measure(ctx, text + ' ', size);
    }
  };

  // counter: animated number. { from, to, dur, delay, prefix, suffix, size, color, decimals, sep }
  T.layers.counter = (ctx, L, lt, env) => {
    const p = T.easeBy(L.ease || 'outCubic')(T.prog(lt, L.delay ?? 0, L.dur ?? 1.5));
    const v = T.lerp(L.from ?? 0, L.to ?? 100, p);
    let s = v.toFixed(L.decimals ?? 0);
    if (L.sep !== false) { const [ip, fp] = s.split('.'); s = ip.replace(/\B(?=(\d{3})+(?!\d))/g, L.sep ?? ' ') + (fp ? '.' + fp : ''); }
    const size = L.size ?? 150, kick = p < 1 ? 1 + Math.sin(lt * 40) * 0.015 : 1;
    const text = (L.prefix ?? '') + s + (L.suffix ?? '');
    T.keepInFrame(ctx, L, env, T.measure(ctx, (L.prefix ?? '') + v.toFixed(L.decimals ?? 0).replace(/\d/g, '8') + (L.suffix ?? ''), size) / 2);
    ctx.scale(kick, kick);
    T.toonText(ctx, text, 0, 0, { size, fill: L.color ?? '#fff' });
  };

  // timer: speedrun LCD clock (reference HUD top-right). { start, rate }
  T.layers.timer = (ctx, L, lt) => {
    const v = (L.start ?? 0) + lt * (L.rate ?? 1);
    const m = Math.floor(v / 60), s = Math.floor(v % 60), cs = Math.floor((v * 100) % 100);
    const text = (m > 0 ? m + ':' + String(s).padStart(2, '0') : String(s)) + '.' + String(cs).padStart(2, '0');
    T.outlined(ctx, (k) => T.rrect(k, -150, -60, 300, 110, 14), '#3d4a3a', { line: 8 });
    T.outlined(ctx, (k) => T.rrect(k, -132, -46, 264, 82, 8), '#1f2a1e', { line: 4 });
    ctx.font = T.font(64, 800); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#7fe08a'; ctx.shadowColor = '#7fe08a'; ctx.shadowBlur = 12;
    ctx.fillText(text, 0, -2);
    ctx.shadowBlur = 0;
  };

  // caption: plain subtitle-like line in the lower third (only when a shot needs a quote on screen).
  T.layers.caption = (ctx, L) => {
    T.toonText(ctx, L.text, 0, 0, { size: L.size ?? 56, fill: L.color ?? '#fff', stroke: (L.size ?? 56) * 0.18 });
  };
})();
