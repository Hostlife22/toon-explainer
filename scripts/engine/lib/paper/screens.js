// screens.js — chat thread, tier list, ECG monitor (doc/hud kinds) and the linear grow option for charts.
(function () {
  'use strict';
})();
// screens.js — narrated messenger threads, tier boards and a deterministic heart-monitor HUD.
(function () {
  'use strict';
  const T = window.TOON, INK = T.PAL.ink, POP = 6 / 30;
  const C = { paper: '#fbf7ee', header: '#365865', left: '#eee5d3', right: '#bce3cb',
    avatars: ['#e4a35a', '#7db3d1', '#c39bcf', '#8bb878'], monitor: '#14251e',
    grid: '#284a38', green: '#3fe07a', red: '#ef514d', mark: '#f2c230' };
  const CHAT = { pad: 24, header: 92, avatar: 54, gap: 16, inset: 20, size: 32, line: 42, name: 26 };
  const TIERS = [
    { label: 'S', color: '#f18b88' }, { label: 'A', color: '#efb27c' },
    { label: 'B', color: '#efda85' }, { label: 'C', color: '#a8d49a' }, { label: 'D', color: '#90b9d5' },
  ];
  const pop = (t) => Math.max(0.001, T.ease.outBack(T.prog(t, 0, POP)));
  const box = (ctx, x, y, w, h, color, radius = 16, line = 5) =>
    T.outlined(ctx, (k) => T.rrect(k, x, y, w, h, radius), color, { line });
  const ordered = (items) => items.map((item, i) => ({ ...item, order: i }))
    .sort((a, b) => (a.at ?? 0) - (b.at ?? 0) || a.order - b.order);
  // Preserve explicit line breaks and split long unbroken words to fit a phone card.
  const wrap = (ctx, text, width) => {
    const lines = [];
    for (const para of String(text).split('\n')) {
      let line = '';
      for (const word of para.split(/\s+/).filter(Boolean)) {
        if (line && ctx.measureText(line + ' ' + word).width <= width) { line += ' ' + word; continue; }
        if (line) { lines.push(line); line = ''; }
        for (const ch of word) {
          if (line && ctx.measureText(line + ch).width > width) { lines.push(line); line = ''; }
          line += ch;
        }
      }
      lines.push(line);
    }
    return lines;
  };
  const avatar = (ctx, m, x, y, lt, env) => {
    const r = CHAT.avatar / 2, color = m.color ?? C.avatars[T.hash(String(m.from ?? '')) % C.avatars.length];
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.clip();
    if (m.who) T.docPortrait(ctx, x - r, y - r, r * 2, r * 2, m.who, lt, env, 'color', color);
    else {
      ctx.fillStyle = color; ctx.fillRect(x - r, y - r, r * 2, r * 2);
      T.docText(ctx, String(m.from ?? '?').slice(0, 1).toUpperCase(), x, y + 10, 30, { align: 'center' });
    }
    ctx.restore(); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.stroke();
  };

  T.DOCS.chat = (ctx, L, lt, env) => {
    const w = L.w ?? 620, h = L.h ?? 900, g = CHAT;
    box(ctx, -w / 2, -h / 2, w, h, C.paper, 26, 7);
    const top = -h / 2 + g.header + g.pad, bottom = h / 2 - g.pad;
    const maxW = Math.max(60, w - 2 * g.pad - g.avatar - g.gap);
    ctx.font = T.font(g.size, 800);
    const entries = ordered(L.messages ?? []).flatMap((m) => {
      const at = m.at ?? 0, typing = L.typing !== false && lt < at && lt >= at - 0.6;
      if (lt < at && !typing) return [];
      const lines = typing ? [] : wrap(ctx, m.text ?? '', maxW - 2 * g.inset);
      const bw = typing ? 132 : Math.min(maxW, Math.max(100, ...lines.map((s) => ctx.measureText(s).width + 2 * g.inset)));
      const bh = typing ? 64 : lines.length * g.line + 2 * g.inset;
      return [{ m, typing, lines, bw, bh, height: g.name + 12 + bh + g.gap }];
    });
    // Recompute the whole stack at every time; seeking backwards cannot retain scroll state.
    const total = entries.reduce((s, e) => s + e.height, 0);
    let y = top - Math.max(0, total - (bottom - top));
    ctx.save(); ctx.beginPath(); ctx.rect(-w / 2 + 6, top - g.pad, w - 12, bottom - top + g.pad); ctx.clip();
    for (const e of entries) {
      const { m, typing, lines, bw, bh } = e, right = m.side === 'right';
      const ax = right ? w / 2 - g.pad - g.avatar / 2 : -w / 2 + g.pad + g.avatar / 2;
      const bx = right ? ax - g.avatar / 2 - g.gap - bw : ax + g.avatar / 2 + g.gap;
      const by = y + g.name + 12;
      avatar(ctx, m, ax, by + g.avatar / 2, lt, env);
      T.docText(ctx, m.from ?? '', right ? bx + bw : bx, y + g.name, g.name, { align: right ? 'right' : 'left', maxW: bw });
      ctx.save(); const pivot = right ? bx + bw : bx;
      ctx.translate(pivot, by + bh); const p = typing ? 1 : pop(lt - (m.at ?? 0)); ctx.scale(p, p); ctx.translate(-pivot, -by - bh);
      box(ctx, bx, by, bw, bh, m.color ?? (right ? C.right : C.left));
      if (typing) {
        for (let i = 0; i < 3; i++) {
          const dy = -4 * Math.sin((lt - (m.at ?? 0) + 0.6) * 12 - i * 0.8);
          ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(bx + 36 + i * 30, by + bh / 2 + dy, 7, 0, Math.PI * 2); ctx.fill();
        }
      } else lines.forEach((line, i) => T.docText(ctx, line, bx + g.inset, by + g.inset + g.size + i * g.line, g.size));
      ctx.restore(); y += e.height;
    }
    ctx.restore();
    ctx.save(); ctx.beginPath(); T.rrect(ctx, -w / 2 + 4, -h / 2 + 4, w - 8, h - 8, 22); ctx.clip();
    ctx.fillStyle = C.header; ctx.fillRect(-w / 2, -h / 2, w, g.header);
    ctx.fillStyle = T.shade(C.header, -0.25); ctx.fillRect(-w / 2, -h / 2 + g.header - 8, w, 8);
    T.docText(ctx, L.title ?? 'GROUP CHAT', 0, -h / 2 + 60, 40, { align: 'center', color: '#ffffff', maxW: w - 2 * g.pad });
    ctx.restore();
  };

  T.DOCS.tierlist = (ctx, L, lt) => {
    const w = L.w ?? 1100, h = L.h ?? 700, rows = L.rows?.length ? L.rows : TIERS;
    const pad = 12, labelW = Math.min(130, w * 0.2), rowH = (h - pad * 2) / rows.length;
    const rowIndex = (v) => typeof v === 'number' ? v : rows.findIndex((r) => r.label === v);
    const items = ordered(L.items ?? []);
    box(ctx, -w / 2, -h / 2, w, h, C.paper, 14, 7);
    rows.forEach((row, ri) => {
      const x = -w / 2 + pad, y = -h / 2 + pad + ri * rowH;
      const color = row.color ?? TIERS[ri % TIERS.length].color;
      box(ctx, x, y, labelW, rowH, color, 3, 4);
      box(ctx, x + labelW, y, w - 2 * pad - labelW, rowH, C.left, 3, 4);
      T.docText(ctx, row.label ?? '', x + labelW / 2, y + rowH * 0.67, Math.min(68, rowH * 0.5), { align: 'center', maxW: labelW - 16, weight: 900 });
      const members = items.filter((it) => rowIndex(it.row) === ri);
      const available = w - 2 * pad - labelW - 16, cell = Math.min(rowH - 16, available / Math.max(1, members.length));
      // Text-only items are chips as wide as their word (font ~44 px); a crowded row shrinks all of its items evenly.
      const fs = Math.min(44, rowH * 0.32), gap = 10;
      const widths = members.map((it) => (it.prop || it.text == null ? cell : Math.max(cell, T.measure(ctx, String(it.text).toUpperCase(), fs) + 36)));
      const total = widths.reduce((a, b) => a + b + gap, -gap), fit = total > available ? available / total : 1;
      let run = x + labelW + 8;
      members.forEach((it, j) => {
        const cw = widths[j] * fit, ch = cell * fit, cx = run + cw / 2, cy = y + rowH / 2;
        run += cw + gap * fit;
        if (lt < (it.at ?? 0)) return;
        ctx.save(); ctx.translate(cx, cy); const p = pop(lt - (it.at ?? 0)); ctx.scale(p, p);
        box(ctx, -cw * 0.47, -ch * 0.45, cw * 0.94, ch * 0.9, C.paper, 8, 3);
        if (it.prop) {
          ctx.save(); ctx.translate(0, it.text ? -ch * 0.1 : 0);
          // Hilt/foot-anchored props need a small lift of their origin to centre the icon.
          if (['sword', 'spear', 'flag', 'torch'].includes(it.prop)) ctx.translate(0, ch * 0.22);
          T.drawProp(ctx, it.prop, ch * (it.text ? 0.48 : 0.6), lt, {}); ctx.restore();
        }
        if (it.text != null) {
          const size = it.prop ? Math.min(32, ch * 0.3) : fs * fit;
          T.docText(ctx, it.text, 0, it.prop ? ch * 0.33 : size * 0.36, size, { align: 'center', maxW: cw * 0.88 });
        }
        ctx.restore();
      });
      if (L.mark && rowIndex(L.mark.row) === ri && lt >= (L.mark.at ?? 0)) {
        ctx.strokeStyle = C.mark; ctx.lineWidth = 9;
        ctx.strokeRect(x + 5, y + 5, w - 2 * pad - 10, rowH - 10);
      }
    });
  };

  // Integrate T.num on fixed subdivisions of each key interval. Linear keys integrate exactly;
  // eased keys remain deterministic and the trace phase never jumps when the BPM changes.
  const beats = (bpm, time) => {
    if (time <= 0) return 0;
    if (!Array.isArray(bpm)) return Math.max(0, T.num(bpm, time, 70)) * time / 60;
    const cuts = [0, ...bpm.map((k) => k.at ?? 0).filter((t) => t > 0 && t < time), time].sort((a, b) => a - b);
    let sum = 0;
    for (let i = 1; i < cuts.length; i++) {
      const a = cuts[i - 1], dt = (cuts[i] - a) / 8;
      for (let j = 0; j < 8; j++) sum += Math.max(0, T.num(bpm, a + (j + 0.5) * dt, 70)) * dt / 60;
    }
    return sum;
  };
  const wave = (phase) => {
    const points = [[0, 0], [0.12, 0], [0.18, -0.12], [0.24, 0], [0.34, 0], [0.38, 0.22],
      [0.42, -1], [0.47, 0.45], [0.52, 0], [0.63, 0], [0.72, -0.25], [0.82, 0], [1, 0]];
    const p = ((phase % 1) + 1) % 1;
    for (let i = 1; i < points.length; i++) if (p <= points[i][0]) {
      const [a, v] = points[i - 1], [b, u] = points[i]; return T.lerp(v, u, (p - a) / (b - a));
    }
    return 0;
  };
  T.HUD_KINDS.ecg = (ctx, L, lt, env) => {
    const w = L.w ?? 700, h = L.h ?? 220;
    if (L.x == null && L.y == null) {
      const [left, width] = T.visibleSpan(env), dpr = env.dpr ?? 1, m = ctx.getTransform();
      const bw = (Math.abs(m.a) * w + Math.abs(m.c) * h) / dpr;
      const bh = (Math.abs(m.b) * w + Math.abs(m.d) * h) / dpr;
      const fit = Math.min(1, Math.max(1, width - 80) / Math.max(1, bw), (T.H - 80) / Math.max(1, bh));
      // Anchor the transformed bounds too, so scale/rotation keep the same corner inset.
      ctx.setTransform(m.a * fit, m.b * fit, m.c * fit, m.d * fit,
        (left + width - 40 - bw * fit / 2) * dpr, (T.H - 40 - bh * fit / 2) * dpr);
    }
    const flatAt = L.flatAt ?? Infinity, flat = lt >= flatAt, col = flat ? C.red : (L.color ?? C.green);
    box(ctx, -w / 2, -h / 2, w, h, C.monitor, 18, 7);
    const pad = 20, x0 = -w / 2 + pad, x1 = w / 2 - pad, y0 = -h / 2 + 76, y1 = h / 2 - pad;
    if (L.grid !== false) {
      ctx.strokeStyle = C.grid; ctx.lineWidth = 2; ctx.beginPath();
      for (let x = x0; x <= x1; x += 28) { ctx.moveTo(x, y0); ctx.lineTo(x, y1); }
      for (let y = y0; y <= y1; y += 28) { ctx.moveTo(x0, y); ctx.lineTo(x1, y); }
      ctx.stroke();
    }
    const bpm = Math.max(0, T.num(L.bpm, lt, 70));
    const shown = Math.round(bpm * T.clamp((flatAt - lt) / 0.6));
    T.docText(ctx, shown + ' BPM', x1, -h / 2 + 50, 38, { align: 'right', color: col, maxW: w * 0.52 });
    T.docText(ctx, flat ? 'FLAT' : 'ECG', x0 + 28, -h / 2 + 49, 32, { color: col, maxW: w * 0.3 });
    const phase = beats(L.bpm, lt), pulse = flat || phase % 1 < 0.16;
    ctx.fillStyle = pulse ? col : C.grid; ctx.beginPath(); ctx.arc(x0 + 7, -h / 2 + 38, 8, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, y1 - y0); ctx.clip();
    ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.beginPath();
    const mid = (y0 + y1) / 2, amp = (y1 - y0) * 0.42, speed = 160;
    for (let x = x0; x <= x1; x += 2) {
      const t = lt - (x1 - x) / speed;
      const y = mid + (flat || t < 0 ? 0 : wave(beats(L.bpm, t))) * amp;
      if (x === x0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke(); ctx.restore();
  };
})();
