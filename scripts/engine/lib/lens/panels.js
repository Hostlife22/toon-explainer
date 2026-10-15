// panels.js — screen layouts and POV masks.
// `panel` layer: split screen (straight / slanted / jagged lightning seam + VS), comic grid, picture-in-picture, a
// shot inside a drawn frame (gilt painting, CRT TV, phone) and free custom cells. Each cell shows another shot of the
// film through T.subShot (live, or frozen with `t`). fg kinds `binoculars`, `spyglass`, `eye-pov`: POV masks with
// handheld drift, a lag behind camera pans, blinks and a wake-up bloom.
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL, W = T.W, H = T.H, FPS = 30, OV = 260;
  T.DEFAULT_ENTER.panel = 'none'; // cells animate themselves; a pop on the whole layer would reveal the scene under it

  function oneOf(v, allowed, def, what) {
    if (v == null) return def;
    if (!allowed.includes(v)) throw new Error(`${what} must be one of ${allowed.join(', ')} (got ${JSON.stringify(v)})`);
    return v;
  }
  const nums = (v, n) => Array.isArray(v) && v.length >= n && v.slice(0, n).every((x) => typeof x === 'number');

  // ---------- source-shot helpers ----------
  // Text layer types hidden by `labels: false` (a cell then shows the source shot without its own words, so a crop
  // never leaves letter fragments like "TA" at the cell edge).
  const TEXT_TYPES = new Set(['label', 'title', 'caption', 'subtitle', 'date', 'era']);
  const textless = new WeakMap(), TEXTLESS = Symbol('textless');
  function textlessSpec(spec) {
    if (!spec || spec[TEXTLESS]) return spec;
    if (!textless.has(spec)) {
      const strip = (list) => (list || []).filter((L) => !TEXT_TYPES.has(L.type));
      const shots = spec.shots.map((sh) => ({ ...sh, layers: strip(sh.layers), ...(sh.pinned ? { pinned: strip(sh.pinned) } : {}) }));
      textless.set(spec, { ...spec, shots, [TEXTLESS]: true });
    }
    return textless.get(spec);
  }
  const first = (v) => (Array.isArray(v) ? (v.length && typeof v[0] === 'object' ? v[0].v : undefined) : v);
  // focus "auto": centre the crop on the biggest bean of the source shot (head-and-chest height).
  function autoFocus(spec, id) {
    const shot = spec && spec.shots.find((s) => s.id === id);
    const beans = ((shot && shot.layers) || []).filter((L) => L.type === 'bean' && typeof first(L.size ?? 400) === 'number');
    if (!beans.length) return [0.5, 0.5];
    const L = beans.reduce((m, b) => (first(b.size ?? 400) > first(m.size ?? 400) ? b : m));
    const x = first(L.x ?? 0.5), y = first(L.y ?? 0.97), size = first(L.size ?? 400);
    return [typeof x === 'number' ? x : 0.5, (typeof y === 'number' ? y : 0.97) - (size * 0.6) / H];
  }

  // ---------- cell content: fit a sub-shot into a cw x ch box centred at the origin ----------
  // fit "cover" (default) crops around `focus`; fit "width" shows the whole width (a landscape clip in a portrait phone)
  // on a dark backing.
  // Default crop centre: the frame centre, or in a vertical film the source shot's own frame x (what its viewer saw).
  function defaultFocus(cell, lt, env) {
    if (T.FORMAT !== 'vertical') return [0.5, 0.5];
    const src = (env.spec.shots || []).find((s) => s.id === cell.shot);
    if (!src) return [0.5, 0.5];
    const t = T.clamp(cell.t ?? (cell.from ?? 0) + lt, 0, src.dur), half = T.STRIP_W / 2; // same clamps as subShot / frameShot
    return [T.clamp(T.num(src.frame, t, 0.5) * T.W, half, T.W - half) / T.W, 0.5];
  }
  function drawContent(ctx, cell, cw, ch, lt, env, push) {
    if (!cell.shot) { ctx.fillStyle = cell.color ?? '#3a2e28'; ctx.fillRect(-cw / 2 - 2, -ch / 2 - 2, cw + 4, ch + 4); return; }
    if (!T.subShot) throw new Error('panel: T.subShot is missing (helpers.js must load first)');
    const fit = oneOf(cell.fit, ['cover', 'width'], 'cover', 'panel cell fit');
    const opts = cell.t != null ? { t: cell.t } : {};
    if (cell.grade === false) opts.grade = false;
    const subEnv = cell.labels === false ? { ...env, spec: textlessSpec(env.spec) } : env;
    const src = T.subShot(cell.shot, (cell.from ?? 0) + lt, subEnv, opts), k = src.width / W;
    const z = (cell.zoom ?? 1) * Math.pow(cell.push ?? push, lt);
    if (fit === 'width') {
      ctx.fillStyle = cell.color ?? '#121014'; ctx.fillRect(-cw / 2 - 2, -ch / 2 - 2, cw + 4, ch + 4);
      const s = (cw / W) * z, dh = H * s;
      ctx.drawImage(src, (W - cw / s) / 2 * k, 0, (cw / s) * k, H * k, -cw / 2, -dh / 2 + (cell.offset ?? 0) * ch, cw, dh);
      return;
    }
    const s = Math.max(cw / W, ch / H) * z;
    const cropW = cw / s, cropH = ch / s, [fx, fy] = cell.focus === 'auto' ? autoFocus(env.spec, cell.shot) : nums(cell.focus, 2) ? cell.focus : defaultFocus(cell, lt, env);
    const cx = T.clamp(fx * W, cropW / 2, W - cropW / 2), cy = T.clamp(fy * H, cropH / 2, H - cropH / 2);
    ctx.drawImage(src, (cx - cropW / 2) * k, (cy - cropH / 2) * k, cropW * k, cropH * k, -cw / 2, -ch / 2, cw, ch);
  }

  // Slide-in from the nearest frame edge over 8 frames (outCubic), staggered by `every` per cell.
  function slideOffset(L, i, cx, cy, cw, ch, lt) {
    const delay = i * (L.every ?? 0.1), q = T.ease.outCubic(T.clamp((lt - delay) / (8 / FPS)));
    if (lt < delay) return null;
    if (L.slideIn === false || q >= 1) return [0, 0];
    const d = [[cx + cw / 2 + 40, -1, 0], [W - cx + cw / 2 + 40, 1, 0], [cy + ch / 2 + 40, 0, -1], [H - cy + ch / 2 + 40, 0, 1]];
    const near = [[cx, d[0]], [W - cx, d[1]], [cy * 1.6, d[2]], [(H - cy) * 1.6, d[3]]].sort((a, b) => a[0] - b[0])[0][1];
    return [near[1] * near[0] * (1 - q), near[2] * near[0] * (1 - q)];
  }

  function label(ctx, text, x, y, lt, at = 0.3) {
    if (!text || lt < at) return;
    const s = Math.max(0, T.ease.outBack(T.clamp((lt - at) / 0.2)));
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    T.toonText(ctx, String(text), 0, 0, { size: T.fitSize(ctx, String(text), 84, 820) });
    ctx.restore();
  }

  // ---------- generic boxed cell (grid, custom, pip, frame) ----------
  function boxCell(ctx, L, cell, i, lt, env, deco = {}) {
    const [x, y, w, h] = cell.rect, rot = cell.rect[4] ?? cell.rot ?? 0;
    let cw = w * W, ch = h * H;
    const cx = x * W + cw / 2, cy = y * H + ch / 2;
    if (deco.square) cw = ch = Math.min(cw, ch); // circle badge: a square cell centred in its rect
    const off = slideOffset(L, i, cx, cy, cw, ch, lt);
    if (!off) return;
    ctx.save();
    ctx.translate(cx + off[0], cy + off[1]); ctx.rotate(rot * T.DEG);
    if (deco.under) deco.under(ctx, cw, ch);
    ctx.save();
    const rad = typeof deco.radius === 'function' ? deco.radius(cw, ch) : deco.radius ?? 0;
    ctx.beginPath(); T.rrect(ctx, -cw / 2, -ch / 2, cw, ch, rad); ctx.clip();
    drawContent(ctx, cell, cw, ch, lt, env, L.push ?? 1);
    if (deco.screen) deco.screen(ctx, cw, ch, lt, cell);
    ctx.restore();
    const border = cell.border ?? L.border ?? deco.border ?? 0;
    if (border > 0) { ctx.strokeStyle = P.ink; ctx.lineWidth = border; ctx.beginPath(); T.rrect(ctx, -cw / 2, -ch / 2, cw, ch, rad); ctx.stroke(); }
    if (deco.over) deco.over(ctx, cw, ch);
    label(ctx, cell.label, 0, ch / 2 - 40, lt, cell.labelAt ?? 0.3);
    ctx.restore();
  }

  // ---------- split: two halves divided by a straight, slanted or jagged seam ----------
  function seamPoints(L, lt) {
    const seam = oneOf(L.seam, ['straight', 'slant', 'jagged'], 'straight', 'panel.seam');
    const ang = (seam === 'slant' ? L.angle ?? 8 : L.angle ?? 0) * T.DEG, mid = (L.pos ?? 0.5) * W, dx = Math.tan(ang) * H / 2;
    const top = [mid + dx, -20], bot = [mid - dx, H + 20];
    if (seam !== 'jagged') return { seam, pts: [top, bot] };
    const r = T.rng(T.hash((L.id ?? 'panel') + ':zig')), pts = [top], n = 8;
    for (let k = 1; k < n * 2; k++) { // 8 zig-zags, amplitude 30 px (Ch 9:21 lightning seam)
      const f = k / (n * 2), side = k % 2 ? 1 : -1;
      pts.push([T.lerp(top[0], bot[0], f) + side * (22 + r() * 16), T.lerp(top[1], bot[1], f) + (r() - 0.5) * 20]);
    }
    pts.push(bot);
    return { seam, pts };
  }
  function polyline(ctx, pts, upto = 1) {
    const n = pts.length - 1, end = upto * n;
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let k = 1; k <= n; k++) {
      if (k <= end) { ctx.lineTo(pts[k][0], pts[k][1]); continue; }
      const f = end - (k - 1);
      if (f > 0) ctx.lineTo(T.lerp(pts[k - 1][0], pts[k][0], f), T.lerp(pts[k - 1][1], pts[k][1], f));
      break;
    }
  }
  function drawSplit(ctx, L, cells, lt, env) {
    const { seam, pts } = seamPoints(L, lt), xs = pts.map((p) => p[0]), minX = Math.min(...xs), maxX = Math.max(...xs);
    const halves = [
      { cell: cells[0], edge: -W - 40, box: [0, maxX + 40] },
      { cell: cells[1], edge: 2 * W + 40, box: [minX - 40, W] },
    ];
    halves.forEach((hf, i) => {
      if (!hf.cell) return;
      const delay = i * (L.every ?? 0), q = L.slideIn === false ? (lt >= delay ? 1 : 0) : T.ease.outCubic(T.clamp((lt - delay) / (8 / FPS)));
      if (q <= 0) return;
      const ox = (i ? 1 : -1) * W * 0.6 * (1 - q), [b0, b1] = hf.box, cw = b1 - b0;
      ctx.save(); ctx.translate(ox, 0);
      ctx.beginPath(); ctx.moveTo(i ? W + 20 : -20, -20); pts.forEach(([x, y]) => ctx.lineTo(x, y)); ctx.lineTo(i ? W + 20 : -20, H + 20); ctx.closePath(); ctx.clip();
      ctx.translate(b0 + cw / 2, H / 2);
      drawContent(ctx, hf.cell, cw, H, lt, env, L.push ?? 1.01);
      ctx.restore();
      if (hf.cell.label) label(ctx, hf.cell.label, ox + (i ? (minX + W) / 2 : maxX / 2), H - 56, lt, hf.cell.labelAt ?? 0.4);
    });
    const draw = T.clamp(lt / (8 / FPS)); // the seam draws top to bottom over 8 frames
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (seam === 'jagged') {
      ctx.strokeStyle = P.ink; ctx.lineWidth = 18; polyline(ctx, pts, draw); ctx.stroke();
      ctx.strokeStyle = L.seamColor ?? '#ffd21e'; ctx.lineWidth = 10; polyline(ctx, pts, draw); ctx.stroke();
    } else {
      ctx.strokeStyle = L.gutterColor ?? '#0b0806'; ctx.lineWidth = L.gutter ?? 14; polyline(ctx, pts, draw); ctx.stroke();
    }
    if (L.vs && lt >= 8 / FPS) {
      const s = Math.max(0, T.ease.outBack(T.clamp((lt - 8 / FPS) / 0.2))), [bx] = pts[pts.length - 1];
      ctx.save(); ctx.translate(bx + (pts.length > 2 ? 0 : 0), H - 70); ctx.scale(s, s);
      T.toonText(ctx, typeof L.vs === 'string' ? L.vs : 'VS', 0, 38, { size: 110, stroke: 20, fill: '#ffffff' });
      ctx.restore();
    }
  }

  // ---------- grid / custom / pip / frame ----------
  function gridCells(L, cells) {
    const cols = Math.max(1, Math.round(L.cols ?? 2)), rows = Math.max(1, Math.round(L.rows ?? Math.ceil(cells.length / cols)));
    const g = (L.gutter ?? 12) / 2, r = T.rng(T.hash((L.id ?? 'grid') + ':tilt')), tilt = L.tilt ?? 0;
    return cells.map((c, i) => {
      if (nums(c.rect, 4)) return c;
      const cx = i % cols, cy = Math.floor(i / cols), x0 = (cx / cols) * W, y0 = (cy / rows) * H;
      const inset = (v, len, n, k) => [v + g + (k === 0 ? g : 0), len - 2 * g - (k === 0 ? g : 0) - (k === n - 1 ? g : 0)];
      const [x, w] = inset(x0, W / cols, cols, cx), [y, h] = inset(y0, H / rows, rows, cy);
      const rot = tilt ? (i % 2 ? 1 : -1) * tilt * (0.5 + r() * 0.5) : 0;
      return { ...c, rect: [x / W, y / H, w / W, h / H, rot] };
    });
  }
  // photo: a print with a white border and a deeper bottom margin (a polaroid held up, the past turned into a photograph);
  // circle: a round locator badge (shorts put a whole-country inset in the top corner of a cropped map).
  const FRAME_RECT = { gilt: [0.24, 0.12, 0.52, 0.6], tv: [0.26, 0.14, 0.48, 0.52], phone: [0.38, 0.08, 0.24, 0.8], none: [0.2, 0.15, 0.6, 0.6],
    photo: [0.3, 0.14, 0.4, 0.56, -3], circle: [0.41, 0.06, 0.18, 0.32] };
  const FRAMES = {
    gilt: (L) => ({
      under: (ctx, cw, ch) => {
        T.outlined(ctx, (k) => k.rect(-cw / 2 - 30, -ch / 2 - 30, cw + 60, ch + 60), '#d9a63a', { line: 6, shade: (k) => { k.fillStyle = '#b8862a'; k.fillRect(-cw / 2 - 30, ch / 2 - 4, cw + 60, 40); k.fillRect(cw / 2 - 4, -ch / 2 - 30, 40, ch + 60); } });
        ctx.fillStyle = '#f2d27a'; for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { ctx.beginPath(); ctx.arc(sx * (cw / 2 + 15), sy * (ch / 2 + 15), 9, 0, Math.PI * 2); ctx.fill(); }
        ctx.fillStyle = '#8a5a1a'; ctx.fillRect(-cw / 2 - 8, -ch / 2 - 8, cw + 16, ch + 16); // inner bevel
      },
      border: 4,
      over: (ctx, cw, ch) => {
        if (!L.plaque) return;
        const pw = Math.min(cw * 0.7, 420);
        T.outlined(ctx, (k) => T.rrect(k, -pw / 2, ch / 2 + 46, pw, 58, 8), '#c9a24a', { line: 5 });
        ctx.font = T.font(T.fitSize(ctx, String(L.plaque), 34, pw - 30, 800), 800); ctx.textAlign = 'center'; ctx.fillStyle = '#3a2410';
        ctx.fillText(String(L.plaque), 0, ch / 2 + 87);
      },
    }),
    tv: () => ({
      radius: 30,
      under: (ctx, cw, ch) => {
        T.outlined(ctx, (k) => T.rrect(k, -cw / 2 - 40, -ch / 2 - 40, cw + 80, ch + 150, 24), '#2a2a2e', { line: 7, shade: (k) => { k.fillStyle = '#1c1c20'; k.fillRect(-cw / 2 - 40, ch / 2 + 30, cw + 80, 90); } });
        for (const kx of [cw / 2 - 40, cw / 2 - 100]) T.outlined(ctx, (k) => k.arc(kx, ch / 2 + 66, 18, 0, Math.PI * 2), '#8a8a92', { line: 5 });
        for (const lx of [-cw / 3, cw / 3]) T.outlined(ctx, (k) => k.rect(lx - 14, ch / 2 + 110, 28, 40), '#2a2a2e', { line: 5 });
      },
      screen: (ctx, cw, ch) => {
        ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let y = -ch / 2; y < ch / 2; y += 3) ctx.fillRect(-cw / 2, y, cw, 1);
        const g = ctx.createRadialGradient(0, 0, Math.min(cw, ch) * 0.35, 0, 0, Math.hypot(cw, ch) * 0.55);
        g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.45)'); ctx.fillStyle = g; ctx.fillRect(-cw / 2, -ch / 2, cw, ch);
        ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.beginPath(); ctx.ellipse(-cw * 0.2, -ch * 0.28, cw * 0.32, ch * 0.12, -0.2, 0, Math.PI * 2); ctx.fill();
      },
      border: 6,
    }),
    phone: () => ({
      radius: 26,
      under: (ctx, cw, ch) => T.outlined(ctx, (k) => T.rrect(k, -cw / 2 - 20, -ch / 2 - 20, cw + 40, ch + 40, 46), '#141416', { line: 7 }),
      screen: (ctx, cw, ch, lt, cell) => { // video-app chrome around a fit-width clip: progress bar under it, comment lines below
        const vh = (cw * H) / W * (cell.zoom ?? 1), y = vh / 2 + 14;
        if (cell.fit !== 'width' || cell.offset || y + 40 > ch / 2) return;
        ctx.fillStyle = '#4a4a50'; ctx.fillRect(-cw / 2 + 16, y, cw - 32, 8);
        ctx.fillStyle = '#e8402a'; ctx.fillRect(-cw / 2 + 16, y, (cw - 32) * T.clamp(0.2 + lt / 12), 8);
        ctx.fillStyle = '#3a3a40';
        for (let i = 0; i < 4; i++) { const ly = y + 40 + i * 44; if (ly + 20 > ch / 2 - 10) break; ctx.beginPath(); T.rrect(ctx, -cw / 2 + 16, ly, (cw - 32) * (i % 2 ? 0.62 : 0.85), 20, 10); ctx.fill(); }
        ctx.beginPath(); T.rrect(ctx, -cw / 2 + 16, -vh / 2 - 44, (cw - 32) * 0.55, 22, 11); ctx.fill();
      },
      over: (ctx, cw, ch) => { ctx.fillStyle = '#141416'; ctx.beginPath(); T.rrect(ctx, -60, -ch / 2 - 4, 120, 26, 12); ctx.fill(); },
      border: 3,
    }),
    none: () => ({ border: 6 }),
    photo: (L) => ({
      under: (ctx, cw, ch) => {
        const m = Math.max(14, cw * 0.05), mb = m * 3.2;
        ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(-cw / 2 - m + 12, -ch / 2 - m + 14, cw + 2 * m, ch + m + mb);
        T.outlined(ctx, (k) => k.rect(-cw / 2 - m, -ch / 2 - m, cw + 2 * m, ch + m + mb), L.paper ?? '#f7f3ea', { line: 5 });
      },
      over: (ctx, cw, ch) => {
        if (!L.caption) return;
        const m = Math.max(14, cw * 0.05), size = T.fitSize(ctx, String(L.caption), Math.min(46, m * 1.6), cw - 20, 800);
        ctx.font = T.font(size, 800); ctx.textAlign = 'center'; ctx.fillStyle = '#3a2a20';
        ctx.fillText(String(L.caption), 0, ch / 2 + m * 1.9);
      },
      border: 4,
    }),
    circle: () => ({
      square: true,
      radius: (cw, ch) => Math.min(cw, ch) / 2,
      under: (ctx, cw, ch) => {
        const r = Math.min(cw, ch) / 2;
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.arc(8, 10, r + 12, 0, Math.PI * 2); ctx.fill();
        T.outlined(ctx, (k) => k.arc(0, 0, r + 12, 0, Math.PI * 2), '#f7f3ea', { line: 5 });
      },
      border: 5,
    }),
  };
  function pipDeco() {
    return {
      under: (ctx, cw, ch) => {
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(-cw / 2 - 6 + 8, -ch / 2 - 6 + 10, cw + 12, ch + 12);
        T.outlined(ctx, (k) => k.rect(-cw / 2 - 6, -ch / 2 - 6, cw + 12, ch + 12), '#ffffff', { line: 3 });
      },
    };
  }

  T.layers.panel = (ctx, L, lt, env) => {
    const layout = oneOf(L.layout, ['split', 'grid', 'pip', 'frame', 'custom'], 'split', 'panel.layout');
    const cells = (Array.isArray(L.cells) ? L.cells : []).map((c) => ({ labels: L.labels, ...(typeof c === 'string' ? { shot: c } : c) }));
    if (!cells.length) throw new Error(`panel: needs cells: [{shot: "<shot id>"}] (layer ${L.id ?? '?'})`);
    for (const c of cells) if (c.shot != null && env.shot && c.shot === env.shot.id) throw new Error(`panel: shot "${c.shot}" cannot show itself`);
    ctx.save();
    ctx.translate(-W / 2, -H / 2); // the layer anchor (default x/y 0.5) is the frame centre; cells use frame coordinates
    if (layout === 'split') drawSplit(ctx, L, cells, lt, env);
    else if (layout === 'grid' || layout === 'custom') {
      if (layout === 'grid' && L.gutterColor !== 'none') { ctx.fillStyle = L.gutterColor ?? '#0b0806'; ctx.fillRect(-OV, -OV, W + OV * 2, H + OV * 2); }
      const placed = layout === 'grid' ? gridCells(L, cells) : cells;
      placed.forEach((c, i) => {
        if (!nums(c.rect, 4)) throw new Error(`panel: custom cell ${i} needs rect [x, y, w, h, rotDeg] (frame fractions)`);
        boxCell(ctx, L, c, i, lt, env, { border: 5 });
      });
    } else if (layout === 'pip') {
      const c = cells[0];
      boxCell(ctx, L, { ...c, rect: nums(c.rect, 4) ? c.rect : [0.6, 0.07, 0.34, 0.34, -3] }, 0, lt, env, pipDeco());
    } else {
      const kind = oneOf(L.frame, ['gilt', 'tv', 'phone', 'photo', 'circle', 'none'], 'gilt', 'panel.frame'), c = { fit: kind === 'phone' ? 'width' : undefined, ...cells[0] };
      boxCell(ctx, L, { ...c, rect: nums(c.rect, 4) ? c.rect : FRAME_RECT[kind] }, 0, lt, env, FRAMES[kind](L));
    }
    ctx.restore();
  };

  // ---------- POV masks (fg kinds): frame filled except the hole, evenodd with one hole sub-path ----------
  function povOffset(L, lt, env) {
    const id = L.id ?? L.kind, amp = L.handheld ?? 2;
    let ox = T.noise(lt * 4, id + ':hx') * amp, oy = T.noise(lt * 4 + 9, id + ':hy') * amp;
    const shot = env.shot, lag = L.lag ?? 0.2;
    if (shot && shot.camera && lag > 0 && env.lt != null) { // mask trails camera pans by `lag` seconds
      const c0 = T.cameraAt(shot.camera, env.lt, shot.dur), c1 = T.cameraAt(shot.camera, env.lt - lag, shot.dur);
      ox += T.clamp((c1.px - c0.px) * 0.6, -120, 120); oy += T.clamp((c1.py - c0.py) * 0.6, -120, 120);
    }
    return [ox, oy];
  }
  function maskOut(ctx, L, hole) {
    ctx.fillStyle = L.color ?? '#050505';
    ctx.beginPath(); ctx.rect(-W / 2 - OV, -H / 2 - OV, W + OV * 2, H + OV * 2); hole(ctx); ctx.fill('evenodd');
  }
  // Union outline of two overlapping circles at (+-d, 0) with radius r (one sub-path, so evenodd keeps it a hole).
  function twinHole(k, d, r) {
    const hh = Math.sqrt(Math.max(0, r * r - d * d)), al = Math.atan2(hh, d);
    k.moveTo(0, -hh);
    k.arc(d, 0, r, -(Math.PI - al), Math.PI - al, false);
    k.arc(-d, 0, r, al, Math.PI * 2 - al, false);
    k.closePath();
  }
  function glare(ctx, x, y, r) {
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineCap = 'round'; ctx.lineWidth = 18;
    ctx.beginPath(); ctx.arc(x, y, r * 0.74, Math.PI * 1.12, Math.PI * 1.36); ctx.stroke();
    ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(x, y, r * 0.62, Math.PI * 1.16, Math.PI * 1.26); ctx.stroke(); ctx.restore();
  }

  function binoculars(ctx, L, lt, env) {
    if (L.reflect) return binocularReflect(ctx, L, lt, env);
    const [ox, oy] = povOffset(L, lt, env), d = 0.13 * W, r = 0.38 * H;
    ctx.save(); ctx.translate(ox, oy);
    const hole = (k) => twinHole(k, d, r);
    ctx.save(); ctx.beginPath(); hole(ctx); ctx.clip();
    ctx.fillStyle = 'rgba(154,216,224,0.12)'; ctx.fillRect(-W, -H, W * 2, H * 2);
    ctx.strokeStyle = '#151515'; ctx.lineWidth = 16; ctx.beginPath(); hole(ctx); ctx.stroke(); // 8 px inner rim
    ctx.strokeStyle = '#8c8c8c'; ctx.lineWidth = 2;
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(s * d, 0, r - 14, Math.PI * (s < 0 ? 0.62 : 1.62), Math.PI * (s < 0 ? 0.88 : 1.88)); ctx.stroke(); }
    ctx.restore();
    maskOut(ctx, L, hole);
    if (L.glare !== false) for (const s of [-1, 1]) glare(ctx, s * d, 0, r);
    ctx.restore();
  }

  // Reverse view (Fc 12:39): a face fills the frame, the scene is reflected in the two lens fronts.
  function binocularReflect(ctx, L, lt, env) {
    const rf = L.reflect === true ? {} : L.reflect, look = (env.cast && rf.who && env.cast[rf.who]) || {};
    const skin = rf.skin ?? look.skin ?? P.skin, r = 0.22 * H, xs = [-0.17 * W, 0.17 * W], y = 0.04 * H;
    T.outlined(ctx, (k) => k.rect(-W / 2 - OV, -H / 2 - OV, W + OV * 2, H + OV * 2), skin, { line: 0, shade: (k) => { k.fillStyle = T.shade(skin, -0.12); k.fillRect(-W / 2 - OV, H * 0.3, W + OV * 2, OV + H); } });
    T.outlined(ctx, (k) => T.rrect(k, -150, y - 70, 300, 140, 40), '#1d1d20', { line: 6 }); // bridge between the barrels
    const brow = rf.eyebrows ?? 'angry', tilt = { angry: 0.22, worried: -0.22, neutral: 0 }[brow] ?? 0;
    xs.forEach((x, i) => {
      const s = i ? 1 : -1;
      ctx.save(); ctx.translate(x, y - r - 90); ctx.rotate(s * tilt);
      T.outlined(ctx, (k) => T.rrect(k, -150, -24, 300, 48, 24), look.hairColor ?? P.hair, { line: 6 }); ctx.restore();
      T.outlined(ctx, (k) => k.arc(x, y, r + 30, 0, Math.PI * 2), '#151515', { line: 6 });
      ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.clip();
      if (rf.shot && T.subShot) {
        const src = T.subShot(rf.shot, (rf.from ?? 0) + lt, env, rf.t != null ? { t: rf.t } : {}), k = src.width / W, crop = H * 0.7;
        ctx.drawImage(src, (W / 2 - crop * 0.9 + s * 0.1 * W) * k, (H / 2 - crop / 2) * k, crop * 1.8 * k, crop * k, x - r * 1.8, y - r, r * 3.6, r * 2);
      } else { ctx.fillStyle = '#6a9ab0'; ctx.fillRect(x - r, y - r, r * 2, r * 2); }
      ctx.fillStyle = 'rgba(154,216,224,0.25)'; ctx.fillRect(x - r, y - r, r * 2, r * 2);
      ctx.restore();
      glare(ctx, x, y, r);
    });
    T.outlined(ctx, (k) => k.ellipse(0, H / 2 + 60, 120, 190, 0, 0, Math.PI * 2), skin, { line: 7, shade: (k) => { k.fillStyle = T.shade(skin, -0.22); k.fillRect(40, H * 0.2, 120, H); } }); // top of the nose
  }

  function spyglass(ctx, L, lt, env) {
    const [ox, oy] = povOffset(L, lt, env), r = T.clamp(L.r ?? 0.42, 0.05, 1) * H;
    ctx.save(); ctx.translate(ox, oy);
    const g = ctx.createRadialGradient(0, 0, Math.max(0, r - 40), 0, 0, r);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.75)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    maskOut(ctx, L, (k) => { k.moveTo(r, 0); k.arc(0, 0, r, 0, Math.PI * 2); });
    ctx.strokeStyle = P.ink; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(0, 0, r + 3, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = L.rim ?? '#b08a3a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 0, r + 3, 0, Math.PI * 2); ctx.stroke();
    if (L.glare !== false) glare(ctx, 0, 0, r);
    ctx.restore();
  }

  // Eyelid openness: blink = closed 2 frames framed by 2-frame slits; `wake` = closed until then, slit, open.
  function eyeOpen(L, lt) {
    const f2 = 2 / FPS;
    let open = 1;
    if (L.wake != null) open = lt < L.wake ? 0 : lt < L.wake + f2 ? 0.15 : 1;
    for (const b of Array.isArray(L.blink) ? L.blink : []) {
      if (lt >= b - f2 && lt < b) open = Math.min(open, 0.15);
      else if (lt >= b && lt < b + f2) open = 0;
      else if (lt >= b + f2 && lt < b + 2 * f2) open = Math.min(open, 0.15);
    }
    return open;
  }
  function eyePov(ctx, L, lt, env) {
    const [ox, oy] = povOffset(L, lt, env), hw = (L.w ?? 0.9) * W / 2, hh = (L.h ?? 0.7) * H / 2, open = eyeOpen(L, lt);
    ctx.save(); ctx.translate(ox, oy);
    const lid = (k, o) => { k.moveTo(-hw, 0); k.quadraticCurveTo(0, -hh * 2 * o, hw, 0); k.quadraticCurveTo(0, hh * 2 * o * 0.8, -hw, 0); k.closePath(); };
    if (open > 0) {
      if (L.bloom != null && lt >= L.bloom) { // wake-up / loading bloom: white for 2 frames, fades over 12
        const a = 1 - T.clamp((lt - L.bloom - 2 / FPS) / (12 / FPS));
        if (a > 0) { ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#ffffff'; ctx.beginPath(); lid(ctx, open); ctx.fill(); ctx.restore(); }
      }
      maskOut(ctx, L, (k) => lid(k, open));
      for (const s of [-1, 1]) { ctx.fillStyle = '#d89a9a'; ctx.beginPath(); ctx.ellipse(s * (hw - 40), 0, 46, 22 * Math.max(0.3, open), 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.strokeStyle = P.ink; ctx.lineWidth = 10; ctx.beginPath(); lid(ctx, open); ctx.stroke();
    } else { // closed: the lids glow faintly warm (light through the skin) so lid line and lashes read
      maskOut(ctx, L, () => {});
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, hw * 1.1);
      g.addColorStop(0, L.lidGlow ?? 'rgba(120,52,40,0.55)'); g.addColorStop(1, 'rgba(120,52,40,0)');
      ctx.fillStyle = g; ctx.fillRect(-W / 2 - OV, -H / 2 - OV, W + OV * 2, H + OV * 2);
      ctx.strokeStyle = '#8a5a4c'; ctx.lineWidth = 18; ctx.beginPath(); ctx.moveTo(-hw, 0); ctx.quadraticCurveTo(0, 30, hw, 0); ctx.stroke();
      ctx.strokeStyle = P.ink; ctx.lineWidth = 10; ctx.stroke();
    }
    // tapered lashes: 3 above the top lid, 3 below the bottom one
    ctx.fillStyle = P.ink;
    for (const [f, up] of [[0.3, 1], [0.5, 1], [0.7, 1], [0.35, -1], [0.5, -1], [0.65, -1]]) {
      if (open <= 0 && up < 0) continue;
      const u = f, x = (1 - u) * (1 - u) * -hw + u * u * hw, y = 2 * u * (1 - u) * (up > 0 ? -hh * 2 * open : hh * 2 * open * 0.8) + (open <= 0 ? 2 * u * (1 - u) * 30 : 0);
      const len = up > 0 ? 120 : 70, a = (up > 0 ? -Math.PI / 2 : Math.PI / 2) + (f - 0.5) * 1.4 * up;
      ctx.beginPath(); ctx.moveTo(x - 14, y); ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); ctx.lineTo(x + 14, y); ctx.closePath();
      ctx.strokeStyle = L.lashRim ?? '#8a5a4c'; ctx.lineWidth = 6; ctx.lineJoin = 'round'; ctx.stroke(); ctx.fill(); // lighter rim: lashes read on the dark mask
    }
    ctx.restore();
  }

  Object.assign(T.FG, { binoculars, spyglass, 'eye-pov': eyePov });
})();
