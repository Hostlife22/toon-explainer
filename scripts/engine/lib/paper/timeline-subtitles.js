// timeline-subtitles.js — screen-locked overlays: `timeline` (year ruler with spans and a time-machine pointer) and `subtitle`
// (karaoke word fill with red-flagged words, the fact-check device). Both ignore the camera unless hud:false.
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL, W = T.W;
  T.DEFAULT_ENTER.timeline = 'none';
  T.DEFAULT_ENTER.subtitle = 'none';

  // Undo the camera for this layer but keep its own position/rotation/scale (core applies the camera first).
  T.hudReset = (ctx, L, env) => {
    if (L.hud === false || !env || !env.st) return;
    const st = env.st;
    ctx.setTransform(env.dpr, 0, 0, env.dpr, 0, 0);
    ctx.translate(st.x, st.y); ctx.rotate(st.r); ctx.scale(st.s * st.flip * (st.sx ?? 1), st.s * (st.sy ?? 1)); // keep squash entrances
  };

  // ---------- timeline: { from, to, w, spans:[{from,to,label,color,at}], marks:[{year,label,color,at}], pointer:{year,from,at,dur} } ----------
  T.layers.timeline = (ctx, L, lt, env) => {
    T.hudReset(ctx, L, env);
    const w = (L.w ?? 0.84) * W, from = L.from ?? 0, to = L.to ?? 2000, X = (yr) => -w / 2 + ((yr - from) / (to - from || 1)) * w;
    const p = T.ease.outCubic(T.prog(lt, 0, 0.35));
    const rows = Math.max(1, ...(L.spans || []).map((s, i) => (s.row ?? i % 3) + 1));
    if (L.panel !== false) T.outlined(ctx, (k) => T.rrect(k, -w / 2 - 50, -80 - rows * 62, w + 100, 160 + rows * 62, 24), L.panel ?? 'rgba(20,14,10,0.55)', { line: 0 });
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-w / 2, 0); ctx.lineTo(-w / 2 + w * p, 0); ctx.stroke();
    for (const [x, yr] of [[-w / 2, from], [w / 2, to]]) {
      if (p < 1 && x > -w / 2) continue;
      ctx.beginPath(); ctx.moveTo(x, -22); ctx.lineTo(x, 22); ctx.stroke();
      T.toonText(ctx, L.labels?.[yr] ?? `${L.prefix ?? 'YEAR'} ${yr}`, x, 64, { size: 30, align: 'center', stroke: 6 });
    }
    (L.spans || []).forEach((s, i) => {
      const q = T.ease.outBack(T.prog(lt, s.at ?? 0.4 + i, 0.3));
      if (q <= 0) return;
      const x0 = X(s.from), x1 = X(s.to), col = s.color ?? ['#d0312d', '#f08a30', '#6a5ae0', '#2e9e48'][i % 4];
      const grow = T.ease.outCubic(T.prog(lt, s.at ?? 0.4 + i, s.grow ?? 0.25));
      ctx.save(); ctx.translate((x0 + x1) / 2, -44 - (s.row ?? i % 3) * 62); ctx.scale(1, q);
      const ww = Math.max(24, (x1 - x0) * grow);
      T.outlined(ctx, (k) => T.rrect(k, -ww / 2, -24, ww, 48, 22), 'rgba(255,255,255,0.12)', { line: 7, ink: col });
      T.toonText(ctx, s.label ?? '', 0, 12, { size: T.fitSize(ctx, s.label ?? '', 30, Math.max(220, ww - 20)), fill: '#fff', ink: T.shade(col, -0.4), stroke: 7, shadow: false });
      ctx.restore();
    });
    for (const m of L.marks || []) {
      const q = T.ease.outBack(T.prog(lt, m.at ?? 0.5, 0.25));
      if (q <= 0) continue;
      ctx.save(); ctx.translate(X(m.year), 0); ctx.scale(q, q);
      T.outlined(ctx, (k) => k.arc(0, 0, 14, 0, Math.PI * 2), m.color ?? P.red, { line: 5 });
      if (m.label) T.toonText(ctx, m.label, 0, -30, { size: 30, fill: m.color ?? '#fff', stroke: 6 });
      ctx.restore();
    }
    if (L.pointer) {
      const pt = L.pointer, e = T.ease.inOut(T.prog(lt, pt.at ?? 0.3, pt.dur ?? 1.5));
      const yr = T.lerp(pt.from ?? from, pt.year ?? to, e), x = X(yr);
      ctx.save(); ctx.translate(x, -14);
      T.outlined(ctx, (k) => { k.moveTo(0, 0); k.lineTo(-22, -34); k.lineTo(22, -34); k.closePath(); }, '#fff', { line: 6 });
      T.toonText(ctx, `${Math.round(yr)}${pt.suffix ?? ''}`, 0, -50, { size: 40, fill: pt.color ?? '#ffe066', stroke: 8 });
      ctx.restore();
    }
  };

  // ---------- subtitle: { text, start, dur, fill, flag:[{word,color,at}], size, maxW, words:[{w,at}] } ----------
  // Words turn `fill` colour as they are "spoken" (char-weighted over [start, start+dur]); flagged words turn red.
  T.layers.subtitle = (ctx, L, lt, env) => {
    T.hudReset(ctx, L, env);
    const size = L.size ?? 54, maxW = (L.maxW ?? 0.82) * W;
    const words = L.words ? L.words.map((w) => ({ w: w.w, at: w.at })) : String(L.text ?? '').split(/\s+/).filter(Boolean).map((w) => ({ w }));
    if (!L.words) {
      const total = words.reduce((a, w) => a + w.w.length + 1, 0) || 1, start = L.start ?? 0, dur = L.dur ?? Math.max(1, words.length * 0.32);
      let acc = 0;
      for (const w of words) { w.at = start + (acc / total) * dur; acc += w.w.length + 1; }
    }
    const norm = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
    const flags = (L.flag || []).map((f) => ({ ...f, words: String(f.word).split(/\s+/).map(norm) }));
    ctx.font = T.font(size, 900);
    const space = ctx.measureText(' ').width, lines = [[]];
    let lineW = 0;
    for (const w of words) {
      const ww = ctx.measureText(w.w).width;
      if (lineW + ww > maxW && lines[lines.length - 1].length) { lines.push([]); lineW = 0; }
      lines[lines.length - 1].push({ ...w, ww }); lineW += ww + space;
    }
    const flat = lines.flat();
    flat.forEach((w, i) => {
      for (const f of flags) {
        const seq = f.words, hit = seq.every((s, k) => flat[i + k] && norm(flat[i + k].w) === s);
        if (hit) seq.forEach((_, k) => { flat[i + k].flagColor = f.color ?? '#ff2a2a'; flat[i + k].flagAt = f.at ?? (flat[i + seq.length - 1].at + 0.3); });
      }
    });
    lines.forEach((line, li) => {
      const total = line.reduce((a, w) => a + w.ww, 0) + space * (line.length - 1);
      let x = -total / 2;
      const y = (li - (lines.length - 1)) * size * 1.2;
      for (const w of line) {
        let col = L.base ?? '#ffffff';
        if (lt >= w.at) col = L.fill ?? '#7fe08a';
        if (w.flagColor && lt >= w.flagAt) col = w.flagColor;
        const pop = w.flagColor && lt >= w.flagAt ? 1 + 0.12 * Math.max(0, 1 - (lt - w.flagAt) / 0.2) : 1;
        ctx.save(); ctx.translate(x + w.ww / 2, y); ctx.scale(pop, pop);
        T.toonText(ctx, w.w, 0, 0, { size, fill: col, stroke: size * 0.16, align: 'center' });
        ctx.restore();
        x += w.ww + space;
      }
    });
  };
})();
