// gags.js — acting and gags: the off-screen arm (rubber arm, giant hand, spring / piston glove, stomping foot,
// fishing hook) that takes things, poof clouds, hats that drop / pass / fly / stack, micro-acting marks, sweat and tear
// emitters, the "no X" sign, and eight measured entrances / exits (tumble, zip, ground, peek, stretch, spit,
// silhouette-in, pivot-fall). Timing comes from frame counts of the reference videos at 30 fps.
// Registries: T.layers.arm + T.ARMS, T.FX, T.PROPS.prohibit, T.ENTERS / T.ENTER_DUR. T.drawLayer is wrapped (chained)
// so taken layers hide, and so entrances can draw what they leave behind (holes, dust trails, flying hats).
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL, W = T.W, H = T.H, D = T.DEG, FPS = 30;
  const VIEW_SHIFT = { front: 0, '3q': 0.24, side: 0.42, back: 0 };
  const frame = (t) => Math.floor(t * FPS + 1e-6);
  const twos = (lt) => Math.floor(lt * 15);
  const isHex = (v) => typeof v === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(v);

  // ---------- context: the shot being drawn (FX draw functions only receive (ctx, L, lt)) ----------
  let CUR = null; // {env, cam, lt: shot time}
  const findLayer = (env, id) => (id && env && env.shot ? (env.shot.layers || []).find((l) => l.id === id) : null) || null;
  const lookOf = (env, L) => ({ ...((env && env.cast) || {})[L.who] || {}, ...(L.look || {}) });

  // World pose of another layer at shot time slt: {L (swapped), st, k = px per rig unit, z, hud}.
  function poseOf(env, id, slt) {
    const L0 = findLayer(env, id); if (!L0) return null;
    const L = T.effLayer(L0, slt), st = T.layerState(L, slt);
    if (!st) return null;
    const size = L.size ?? (L.type === 'bean' ? 420 : 160);
    return { L, st, k: (size / 600) * st.s, size: size * st.s, z: L.z ?? 1, hud: !!L.hud };
  }
  // Reset ctx to the world space of the shot (camera with parallax z), keeping globalAlpha.
  function toWorld(ctx, env, z = 1, hud = false) {
    const k = (env && env.dpr) || T.DPR || 1;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    if (!hud && env && env.cam) T.applyCam(ctx, env.cam, z);
  }
  // Into a bean's own rig units (600 tall, feet at 0, head centre (0,-450)).
  function toRig(ctx, { st, k }) {
    ctx.translate(st.x, st.y); ctx.rotate(st.r); ctx.scale(k * st.flip * st.sx, k * st.sy);
  }
  const headWorld = (pose, units = 450, d = units * pose.k * pose.st.sy) => [pose.st.x + d * Math.sin(pose.st.r), pose.st.y - d * Math.cos(pose.st.r)];
  // FX helper: move ctx into the target's rig units, or (no target) treat the fx point as the head centre of a
  // 300 px character. Returns the pose (or null when the target is not on screen).
  function onTarget(ctx, L) {
    if (L.target && CUR) {
      const pose = poseOf(CUR.env, L.target, CUR.lt);
      if (!pose) return null;
      toWorld(ctx, CUR.env, pose.z, pose.hud); toRig(ctx, pose);
      return pose;
    }
    const s = 0.5 * (L.size ?? 1);
    ctx.scale(s, s); ctx.translate(0, 450);
    return { st: { x: 0, y: 0, s: 1, r: 0, flip: 1, sx: 1, sy: 1 }, k: s, L: {}, local: true };
  }
  const boxOf = (L) => {
    if (L.type === 'bean' || L.type === 'creature' || L.type === 'crowd') { const h = L.size ?? 420; return { w: h * 0.62, h, feet: true }; }
    const s = L.size ?? 200;
    return { w: L.w ?? s, h: L.h ?? s, feet: false };
  };

  // ---------- small drawing pieces ----------
  const puff = (ctx, x, y, r, fill = '#e8dcb8', shade = '#c8b890', line = 5) =>
    T.outlined(ctx, (k) => k.arc(x, y, Math.max(0.5, r), 0, Math.PI * 2), fill, { line, shade: (k) => { k.fillStyle = shade; k.fillRect(x - r, y + r * 0.25, r * 2, r); } });
  // A dust cluster of 3-5 lobes (zip trails, landings, falls).
  function dustCluster(ctx, x, y, r, seed, fill, shade) {
    const g = T.rng(T.hash(seed)), n = 3 + Math.floor(g() * 3), lobes = [];
    for (let i = 0; i < n; i++) lobes.push([x + (g() - 0.5) * r * 1.6, y + (g() - 0.5) * r * 0.8, r * (0.55 + g() * 0.45)]);
    const path = (k) => { for (const [cx, cy, rr] of lobes) { k.moveTo(cx + rr, cy); k.arc(cx, cy, rr, 0, Math.PI * 2); } };
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineWidth = 10; ctx.strokeStyle = P.ink;
    ctx.beginPath(); path(ctx); ctx.stroke();
    ctx.fillStyle = fill ?? '#e8dcb8'; ctx.beginPath(); path(ctx); ctx.fill();
    ctx.save(); ctx.beginPath(); path(ctx); ctx.clip(); ctx.fillStyle = shade ?? '#c8b890'; ctx.fillRect(x - r * 2, y + r * 0.2, r * 4, r * 2); ctx.restore();
    ctx.restore();
  }
  // Ink-outlined white arcs (whoosh / motion marks) centred on (cx, cy).
  function arcs(ctx, cx, cy, r0, a0, a1, n, alpha, w = 6) {
    ctx.save(); ctx.globalAlpha *= alpha; ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const r = r0 + i * w * 3;
      for (const [col, lw] of [[P.ink, w + 4], ['#ffffff', w]]) { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath(); ctx.arc(cx, cy, r, Math.min(a0, a1), Math.max(a0, a1)); ctx.stroke(); }
    }
    ctx.restore();
  }
  // Headwear sprite in rig units (head centre (0,-450)); sx / sy squash about the brim line.
  function hatSprite(ctx, kind, look, lt, view = '3q', sx = 1, sy = 1) {
    const fn = T.HEADWEAR && T.HEADWEAR[kind];
    if (!fn) throw new Error(`hat: unknown headwear "${kind}" (see T.HEADWEAR)`);
    ctx.save(); ctx.translate(0, -560); ctx.scale(sx, sy); ctx.translate(0, 560);
    fn(ctx, look, lt, VIEW_SHIFT[view] ?? 0.24, view);
    ctx.restore();
  }
  // Head opening of a loose hat [brim y, rx, ry] in rig units: without a head inside, the hollow must read as dark
  // lining, or a helmet's notched underside turns into a crescent (banana) shape while it spins.
  const RIM = { crown: [-572, 116, 22], helmet: [-452, 152, 46], 'imperial-helmet': [-484, 156, 48], dome: [-440, 160, 44] };
  const rimOf = (kind) => RIM[kind] ?? [-466, 150, 40];
  // Same sprite placed in world space: head centre (cx, cy), k px per rig unit. `loose` adds the dark lining.
  function hatAt(ctx, kind, look, lt, cx, cy, k, rot = 0, flip = 1, sx = 1, sy = 1, view = '3q', loose = false) {
    ctx.save(); ctx.translate(cx, cy - 150 * k); ctx.rotate(rot); ctx.scale(k * flip, k); ctx.translate(0, 600);
    if (loose) {
      const [y, rx, ry] = rimOf(kind), ox = (VIEW_SHIFT[view] ?? 0.24) * 30;
      ctx.save(); ctx.translate(0, -560); ctx.scale(sx, sy); ctx.translate(0, 560);
      if (kind === 'helmet') T.outlined(ctx, (c) => c.ellipse(-ox, -640, 128, 36, 0, 0, Math.PI * 2), look.headColor ?? '#a9aeb4', { line: 6 }); // crest seat (worn, the head hides the gap)
      T.outlined(ctx, (c) => c.ellipse(ox, y, rx, ry, 0, 0, Math.PI * 2), '#3a2a22', { line: 7, shade: (c) => { c.fillStyle = '#1e1511'; c.fillRect(ox - rx, y - ry, rx * 2, ry); } });
      ctx.restore();
    }
    hatSprite(ctx, kind, look, lt, view, sx, sy);
    ctx.restore();
  }
  // ========== ARM — an arm whose owner is never seen enters from a frame edge, does one thing and leaves.
  const ARM_DEF = {
    rubber: { width: 36, color: '#f4f1ea', ext: 'outCubic', dur: 0.12, back: 0.17 },
    hand: { width: 110, color: '#f4f1ea', ext: 'outCubic', dur: 0.12, back: 0.17 },
    'glove-spring': { width: 18, color: '#ffffff', ext: 'outCubic', dur: 0.067, hold: 0.1, back: 0.1, impact: true, bend: 0.06 },
    'glove-piston': { width: 14, color: '#b8893a', ext: 'linear', dur: 0.067, hold: 0.1, back: 0.1, impact: true, bend: 0 },
    foot: { width: 96, color: '#f4f1ea', ext: 'in', dur: 0.2, hold: 1.2, back: 0.2, impact: true, bend: 0 },
    hook: { width: 3, color: '#3a3a3a', ext: 'linear', dur: 0.9, hold: 0.2, back: 0.4, bend: 0 },
  };
  const STATES = ['open', 'fist', 'point', 'pinch', 'grab', 'thumb', 'flat'];
  const kindOf = (L) => { const k = L.kind ?? 'rubber';
    if (!ARM_DEF[k]) throw new Error(`arm: unknown kind "${k}" (use ${Object.keys(ARM_DEF).join(', ')})`);
    return k; };

  // Reach entries in layer time; spring / piston gloves repeat `count` punches every `every` s, feet expand `stomp`.
  function reachList(L, kind) {
    const d = ARM_DEF[kind], pt = (p) => (Array.isArray(p) ? [p[0] * W, p[1] * H] : [W * 0.5, H * 0.6]);
    const norm = (r) => ({ at: r.at ?? 0, to: pt(r.to), dur: r.dur ?? d.dur, hold: r.hold ?? d.hold ?? 0.5, back: r.back ?? d.back });
    let list = (Array.isArray(L.reach) ? L.reach : L.reach ? [L.reach] : []).map(norm);
    if (kind === 'foot' && Array.isArray(L.stomp)) list = L.stomp.map((t) => norm({ to: L.reach?.[0]?.to ?? L.to, at: t - d.dur }));
    if ((kind === 'glove-spring' || kind === 'glove-piston') && list.length === 1 && (L.count ?? 3) > 1) {
      const first = list[0], every = L.every ?? 0.37; // measured 11-frame cycle: rest 3, out 2, hold 3, back 3
      const n = L.count ?? 3; // `lastHold` keeps the final punch out (the knockout pose the viewer reads)
      list = Array.from({ length: n }, (_, i) => ({ ...first, at: first.at + i * every, hold: i === n - 1 && L.lastHold != null ? L.lastHold : first.hold }));
    }
    if (!list.length) list = [norm({ to: L.to })];
    return list.sort((a, b) => a.at - b.at);
  }
  // Extension u (0 = hand at the root, 1 = at target) at layer time lt.
  function reachAt(list, lt, kind) {
    let e = null;
    for (const r of list) if (lt >= r.at) e = r;
    if (!e) return { u: 0, e: list[0], phase: 'rest', t: 0 };
    const t = lt - e.at, ext = T.easeBy(ARM_DEF[kind].ext);
    if (t < e.dur) return { u: ext(t / e.dur), e, phase: 'ext', t };
    if (t < e.dur + e.hold) return { u: 1, e, phase: 'hold', t: t - e.dur };
    if (t < e.dur + e.hold + e.back) return { u: 1 - T.ease.in((t - e.dur - e.hold) / e.back), e, phase: 'back', t };
    return { u: 0, e, phase: 'gone', t };
  }
  // Inverse of T.applyCam: a screen point (frame edge) into world space, so the root stays off-frame under zoom.
  function screenToWorld(cam, f, x, y) { if (!cam) return [x, y];
    const z = 1 + (cam.z - 1) * f, a = -cam.rot * f;
    const dx = x - cam.fx - cam.sx, dy = y - cam.fy - cam.sy;
    return [(dx * Math.cos(a) - dy * Math.sin(a)) / z + cam.fx + cam.px * f, (dx * Math.sin(a) + dy * Math.cos(a)) / z + cam.fy + cam.py * f];
  }
  function armRoot(L, kind, env, target) {
    const from = kind === 'hook' ? 'top' : L.from ?? 'right', off = 140 + (L.width ?? ARM_DEF[kind].width);
    const ny = L.y ?? target[1] / H, nx = L.x ?? target[0] / W;
    const pts = { left: [-off, ny * H], right: [W + off, ny * H], top: [nx * W, -off], bottom: [nx * W, H + off], tl: [-off, -off], tr: [W + off, -off], bl: [-off, H + off], br: [W + off, H + off] };
    if (!pts[from]) throw new Error(`arm: from "${from}" must be one of ${Object.keys(pts).join(', ')}`);
    return screenToWorld(env.cam, L.z ?? 1, ...pts[from]);
  }
  // Quadratic tube root -> hand sampled as a polyline; control bulges "up" by bend x length.
  function tubePts(root, hand, bend) {
    const dx = hand[0] - root[0], dy = hand[1] - root[1], len = Math.hypot(dx, dy) || 1;
    let nx = -dy / len, ny = dx / len;
    if (ny > 0 || (ny === 0 && nx > 0)) { nx = -nx; ny = -ny; }
    const c = [(root[0] + hand[0]) / 2 + nx * bend * len, (root[1] + hand[1]) / 2 + ny * bend * len], out = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24, a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, e = t * t;
      out.push([a * root[0] + b * c[0] + e * hand[0], a * root[1] + b * c[1] + e * hand[1]]);
    }
    return { pts: out, len, nx, ny, ang: Math.atan2(hand[1] - c[1], hand[0] - c[0]) };
  }
  const poly = (k, pts, from = 0, to = pts.length - 1) => { k.beginPath(); k.moveTo(pts[from][0], pts[from][1]); for (let i = from + 1; i <= to; i++) k.lineTo(pts[i][0], pts[i][1]); };
  // Ink, shade, fill strokes; the fill is nudged toward the light so a shade strip stays on the lower side.
  function tube(ctx, tb, w, fill, line = 6, from = 0, to = tb.pts.length - 1) {
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = P.ink; ctx.lineWidth = w + line * 2; poly(ctx, tb.pts, from, to); ctx.stroke();
    ctx.strokeStyle = T.shade(fill, -0.18); ctx.lineWidth = w; poly(ctx, tb.pts, from, to); ctx.stroke();
    ctx.translate(tb.nx * w * 0.16, tb.ny * w * 0.16);
    ctx.strokeStyle = fill; ctx.lineWidth = w * 0.66; poly(ctx, tb.pts, from, to); ctx.stroke();
    ctx.restore();
  }
  // Text along the tube middle, kept upright.
  function tubeLabel(ctx, tb, text, size, at = 0.5, fill = P.ink) {
    const i = Math.round(at * 24), a = tb.pts[Math.max(0, i - 1)], b = tb.pts[Math.min(24, i + 1)];
    let ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    if (ang > Math.PI / 2 || ang < -Math.PI / 2) ang += Math.PI;
    ctx.save(); ctx.translate(tb.pts[i][0], tb.pts[i][1]); ctx.rotate(ang);
    T.toonText(ctx, String(text).toUpperCase(), 0, size * 0.36, { size, fill, stroke: fill === P.ink ? 0 : size * 0.18, shadow: false });
    ctx.restore();
  }
  const handState = (L, lt) => { const v = T.timed(L.state ?? 'open', lt, 0).cur;
    if (!STATES.includes(v)) throw new Error(`arm: state "${v}" must be one of ${STATES.join(', ')}`);
    return v === 'flat' ? 'open' : v; };
  // Layer time when `take` items attach: first grab/pinch state, or the hook reaching its target.
  function grabTime(L) {
    if (Array.isArray(L.state)) { const g = L.state.find((s) => s.v === 'grab' || s.v === 'pinch'); if (g) return g.at ?? 0; }
    if (typeof L.state === 'string' && (L.state === 'grab' || L.state === 'pinch')) return 0;
    if ((L.kind ?? 'rubber') === 'hook') { const r = reachList(L, 'hook')[0]; return r.at + r.dur; }
    return Infinity;
  }

  // Per-kind drawing at the arm tip. A = {tb, hand, ang, size, L, lt, state, col}
  const ARMS = {
    rubber(ctx, A) {
      const w = A.w;
      tube(ctx, A.tb, w, A.col);
      if (A.L.label) tubeLabel(ctx, A.tb, A.L.label, A.L.labelSize ?? 26);
      return glove(ctx, A, w * 2.8);
    },
    hand(ctx, A) {
      const w = A.w, L = A.L;
      tube(ctx, A.tb, w, A.col, 7);
      if (isHex(L.sleeve)) tube(ctx, A.tb, w * 1.12, L.sleeve, 7, 0, 10);
      if (L.label && !L.bracelet) tubeLabel(ctx, A.tb, L.label, L.labelSize ?? 40, 0.45, '#fff');
      const tip = glove(ctx, A, w * 1.75);
      if (L.bracelet) { // gold cuff band across the wrist, label inside
        const i = 21, p = A.tb.pts[i], q = A.tb.pts[i + 1], ang = Math.atan2(q[1] - p[1], q[0] - p[0]);
        const col = isHex(L.bracelet) ? L.bracelet : '#e8b52c', bl = Math.max(120, L.label ? String(L.label).length * 22 + 40 : 120);
        ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(ang > Math.PI / 2 || ang < -Math.PI / 2 ? ang + Math.PI : ang);
        T.outlined(ctx, (k) => T.rrect(k, -bl / 2, -w * 0.56, bl, w * 1.12, 16), col, { line: 6, shade: (k) => { k.fillStyle = T.shade(col, -0.22); k.fillRect(-bl, w * 0.18, bl * 2, w); } });
        if (L.label) T.toonText(ctx, String(L.label).toUpperCase(), 0, 12, { size: L.labelSize ?? 34, fill: '#fff6d8', stroke: 6, shadow: false });
        ctx.restore();
      }
      return tip;
    },
    'glove-spring'(ctx, A) { // steel coil spring along the tube (T.drawCoil, props-gags.js), boxing glove at the end
      T.drawCoil(ctx, A.tb.pts, { r: A.L.coil ?? Math.max(44, A.w * 3), pitch: A.L.pitch ?? 84, len: A.tb.len, color: isHex(A.L.color) ? A.L.color : '#c9ccd2' });
      return boxingGlove(ctx, A);
    },
    'glove-piston'(ctx, A) { // brass rod, two dark collars
      tube(ctx, A.tb, A.w, A.col, 4);
      for (const f of [0.55, 0.8]) {
        const p = A.tb.pts[Math.round(f * 24)];
        ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(A.ang);
        T.outlined(ctx, (k) => T.rrect(k, -7, -A.w * 0.95, 14, A.w * 1.9, 4), '#5a4320', { line: 4 });
        ctx.restore();
      }
      return boxingGlove(ctx, A);
    },
    foot(ctx, A) { // leg tube + side-profile foot (or a sole toward camera for map stomps)
      tube(ctx, A.tb, A.w, isHex(A.L.leg) ? A.L.leg : A.col, 7);
      return foot(ctx, A);
    },
    hook(ctx, A) { // thin line from above, J hook with a highlight
      const [hx, hy] = A.hand, bob = A.phase === 'ext' ? Math.sin(A.lt * 9) * 2 : 0, x = hx + bob;
      ctx.save(); ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(A.root[0], A.root[1]); ctx.lineTo(x, hy - 58 * (A.L.hookSize ?? 1.6)); ctx.stroke();
      const z = A.L.hookSize ?? 1.6, j = (k) => { k.beginPath(); k.moveTo(x, hy - 60 * z); k.lineTo(x, hy + 10 * z); k.arc(x - 26 * z, hy + 10 * z, 26 * z, 0, Math.PI * 0.95); k.lineTo(x - 54 * z, hy - 6 * z); };
      ctx.lineCap = 'round';
      for (const [c, lw, dx] of [[P.ink, 14, 0], [A.col, 8, 0], ['#9a9a9a', 2.5, -2]]) { ctx.save(); ctx.translate(dx, 0); ctx.strokeStyle = c; ctx.lineWidth = lw; j(ctx); ctx.stroke(); ctx.restore(); }
      T.outlined(ctx, (k) => k.arc(x, hy - 66 * (A.L.hookSize ?? 1.6), 9, 0, Math.PI * 2), '#9a9a9a', { line: 3 });
      ctx.restore();
      return [x - 26, hy + 34];
    },
  };
  T.ARMS = ARMS;

  // White cartoon glove with its cuff on the tube end; returns the grip point.
  function glove(ctx, A, size) {
    const s = size / 120, [hx, hy] = A.hand, ca = Math.cos(A.ang), sa = Math.sin(A.ang);
    const gx = hx + ca * 40 * s, gy = hy + sa * 40 * s;
    if (A.L.hold && T.drawProp) { ctx.save(); ctx.translate(gx + ca * 30 * s, gy + sa * 30 * s); T.drawProp(ctx, A.L.hold, A.L.holdSize ?? size * 1.2, A.lt, {}); ctx.restore(); }
    T.drawGlove(ctx, gx, gy, A.ang + Math.PI / 2, A.state, { size, skin: A.L.skin ?? '#fbfaf6', cuff: A.L.cuff ?? '#f4f1ea', line: Math.max(4, 6 * Math.min(1.4, s)) });
    return [gx + ca * 18 * s, gy + sa * 18 * s];
  }
  // Red boxing glove (rounded mitt + thumb bulge + white cuff band) along the tube direction.
  function boxingGlove(ctx, A) {
    const G = A.L.gloveSize ?? 140, col = isHex(A.L.gloveColor) ? A.L.gloveColor : '#c8302a', [hx, hy] = A.hand;
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(A.ang);
    const flip = Math.abs(A.ang) > Math.PI / 2 ? -1 : 1; ctx.scale(1, flip);
    T.outlined(ctx, (k) => T.rrect(k, -G * 0.08, -G * 0.3, G * 0.32, G * 0.6, G * 0.1), '#f4f1ea', { line: 6, shade: (k) => { k.fillStyle = '#d6d0c6'; k.fillRect(-G, G * 0.12, G * 2, G); } });
    T.outlined(ctx, (k) => k.ellipse(G * 0.62, 0, G * 0.42, G * 0.4, 0, 0, Math.PI * 2), col, { line: 6, shade: (k) => { k.fillStyle = T.shade(col, -0.25); k.fillRect(0, G * 0.14, G * 2, G); } });
    T.outlined(ctx, (k) => k.ellipse(G * 0.42, -G * 0.34, G * 0.24, G * 0.15, -0.35, 0, Math.PI * 2), col, { line: 6 });
    if (isHex(A.L.badge)) T.outlined(ctx, (k) => k.arc(G * 0.7, -G * 0.04, G * 0.13, 0, Math.PI * 2), A.L.badge, { line: 4 });
    ctx.restore();
    return [hx + Math.cos(A.ang) * G, hy + Math.sin(A.ang) * G];
  }
  function foot(ctx, A) {
    const L = A.L, w = A.w, [hx, hy] = A.hand, boot = isHex(L.boot) ? L.boot : null;
    const col = boot ?? (isHex(L.color) ? L.color : '#f3a3c0'), toes = L.toes ?? (hx < W / 2 ? 1 : -1);
    ctx.save(); ctx.translate(hx, hy);
    if (L.sole) { // sole toward camera, toes toward the far end
      ctx.rotate(A.ang - Math.PI / 2);
      T.outlined(ctx, (k) => k.ellipse(0, w * 0.9, w * 0.62, w * 1.05, 0, 0, Math.PI * 2), col, { line: 7, shade: (k) => { k.fillStyle = T.shade(col, -0.18); k.beginPath(); k.ellipse(0, w * 1.1, w * 0.35, w * 0.55, 0, 0, Math.PI * 2); k.fill(); } });
      if (!boot) [-0.42, -0.14, 0.14, 0.4].forEach((x, i) => T.outlined(ctx, (k) => k.arc(x * w, w * 1.95 + Math.abs(x) * w * 0.3, w * (i === 0 ? 0.2 : 0.15), 0, Math.PI * 2), col, { line: 6 }));
    } else { // side profile flat on the ground, toes pointing toward the frame centre
      ctx.scale(toes, 1);
      const sole = (k) => { k.moveTo(-w * 0.5, -w * 0.2); k.lineTo(-w * 0.56, w * 0.45); k.lineTo(w * 1.3, w * 0.45); k.quadraticCurveTo(w * 1.6, w * 0.42, w * 1.5, w * 0.05); k.quadraticCurveTo(w * 1.3, -w * 0.3, w * 0.45, -w * 0.32); k.closePath(); };
      T.outlined(ctx, sole, col, { line: 7, shade: (k) => { k.fillStyle = T.shade(col, -0.22); k.fillRect(-w, w * 0.22, w * 3, w); if (boot) { k.fillStyle = T.shade(col, 0.25); k.beginPath(); k.ellipse(w * 1.05, -w * 0.06, w * 0.24, w * 0.08, -0.25, 0, Math.PI * 2); k.fill(); } } });
      if (boot) T.outlined(ctx, (k) => T.rrect(k, -w * 0.58, w * 0.34, w * 2.05, w * 0.16, 6), '#1e1612', { line: 5 });
      else [0, 1, 2, 3].forEach((i) => T.outlined(ctx, (k) => k.arc(w * 1.38 - i * w * 0.2, w * 0.02 - i * w * 0.05, w * (i ? 0.1 : 0.13), 0, Math.PI * 2), col, { line: 5 }));
    }
    ctx.restore();
    return [hx, hy + w * 0.45];
  }

  // The arm layer. Draws in world space (the layer's own x / y are ignored; `from` + `reach` place it).
  T.DEFAULT_ENTER.arm = 'none';
  T.layers.arm = (ctx, L, lt, env) => {
    const kind = kindOf(L), def = ARM_DEF[kind], list = reachList(L, kind), R = reachAt(list, lt, kind);
    if (R.u <= 0.001) return;
    toWorld(ctx, env, L.z ?? 1, !!L.hud);
    const root = armRoot(L, kind, env, R.e.to);
    const to = kind === 'foot' && !L.sole ? [R.e.to[0], R.e.to[1] - (L.width ?? def.width) * 0.45] : R.e.to;
    let hand = [T.lerp(root[0], to[0], R.u), T.lerp(root[1], to[1], R.u)];
    if (R.phase === 'hold') { const r = T.rng(T.hash((L.id ?? 'arm') + ':tr:' + twos(lt))); hand = [hand[0] + (r() - 0.5) * 3, hand[1] + (r() - 0.5) * 3]; }
    const tb = tubePts(root, hand, kind === 'glove-piston' || kind === 'hook' ? 0 : L.bend ?? def.bend ?? 0.15);
    const A = { tb, hand, root, ang: tb.ang, lt, phase: R.phase, L, w: L.width ?? def.width, col: isHex(L.color) && kind !== 'foot' ? L.color : def.color, state: handState(L, lt) };
    // taken layers ride under the hand (drawn first so the fingers close over them)
    const taken = L.take && lt >= grabTime(L) ? [].concat(L.take) : [];
    const tip0 = kind === 'hook' ? [hand[0] - 26 * (L.hookSize ?? 1.6), hand[1] + 40 * (L.hookSize ?? 1.6)] : [hand[0] + Math.cos(tb.ang) * 0.6 * A.w * 1.6, hand[1] + Math.sin(tb.ang) * 0.6 * A.w * 1.6];
    for (const id of taken) drawTaken(ctx, env, id, tip0, L.grip);
    ARMS[kind](ctx, A);
    const imp = L.impact ?? def.impact;
    if (imp && R.phase === 'hold' && R.t < 0.1) { // contact star, 3 frames
      const [ix, iy] = kind === 'foot' ? [hand[0], hand[1] + A.w * 0.3] : [hand[0] + Math.cos(tb.ang) * 120, hand[1] + Math.sin(tb.ang) * 120];
      T.starburst(ctx, ix, iy, 20 * (L.impactSize ?? 1), 80 * (L.impactSize ?? 1), 10, (L.id ?? 'arm') + R.e.at, isHex(L.impactColor) ? L.impactColor : '#ffe14a');
    }
  };
  // Draw another layer of the shot attached to the hand tip (grip = offset from the tip to the layer anchor).
  function drawTaken(ctx, env, id, tip, grip) {
    const slt = CUR ? CUR.lt : 0, L0 = findLayer(env, id);
    if (!L0 || !T.layers[L0.type]) return;
    const L = T.effLayer(L0, slt), b = boxOf(L), s = L.scale ?? 1;
    const g = Array.isArray(grip) ? grip : [0, b.feet ? b.h * 0.9 * s : b.h * 0.42 * s];
    ctx.save(); ctx.translate(tip[0] + g[0], tip[1] + g[1]); ctx.scale(s * (L.flip ? -1 : 1), s);
    T.layers[L0.type](ctx, L, slt - (L.at ?? 0), { ...env, st: null, lt: slt });
    ctx.restore();
  }
  // Shot time from which a layer id is held by an arm (cached per shot layer list).
  const takenCache = new WeakMap();
  function takenAt(shot, id) {
    const layers = shot.layers || [];
    let m = takenCache.get(layers);
    if (!m) {
      m = new Map();
      for (const a of layers) if (a.type === 'arm' && a.take) for (const t of [].concat(a.take)) m.set(t, Math.min(m.get(t) ?? Infinity, (a.at ?? 0) + grabTime(a)));
      takenCache.set(layers, m);
    }
    return m.get(id) ?? Infinity;
  }
  // ========== FX — poof, hat, marks, sweat-spray, tear-stream, prohibit
  // Fade a group as one flat sheet (overlapping lobes must not show through each other).
  function flat(ctx, alpha, fn) {
    if (alpha >= 1) { fn(ctx); return; }
    if (alpha <= 0) return;
    const [c, k] = T.scratch('act:flat', ctx.canvas.width, ctx.canvas.height);
    k.clearRect(0, 0, c.width, c.height); k.setTransform(ctx.getTransform()); fn(k);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha *= alpha; ctx.drawImage(c, 0, 0); ctx.restore();
  }
  // Poof: cloud covers the subject in 2 frames, boils, then dissolves into flying stray puffs (19 frames total).
  function poof(ctx, L, lt) {
    const f = lt * FPS, w = L.w ?? 420, h = L.h ?? 300, seed = (L.id ?? 'poof') + ':' + (L.at ?? 0);
    const holdF = (L.hold ?? 0.17) * FPS, endF = 2 + holdF + 12;
    if (f > endF) return;
    const col = L.color ?? '#f4f1ea', sh = L.shade ?? '#d6d0c6';
    if ((L.mode ?? 'band') === 'column') return poofColumn(ctx, L, f, w, h, seed, col, sh);
    const sc = f < 2 ? T.lerp(0.6, 1.05, T.ease.outBack(f / 2)) : T.lerp(1.05, 1.3, T.ease.outCubic(T.clamp((f - 2) / (endF - 2))));
    const fade = 1 - T.ease.in(T.clamp((f - 2 - holdF) / 12));
    const g = T.rng(T.hash(seed + ':stray')), n = L.puffs ?? 5, fly = T.ease.outCubic(T.clamp((f - 2) / (endF - 2)));
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + g() * 0.8, d0 = w * 0.5, d = d0 + (80 + g() * 60) * fly, r = h * (0.08 + g() * 0.06);
      if (f < 2 + holdF * 0.5) continue;
      ctx.save(); ctx.globalAlpha *= 1 - T.clamp((f - endF + 8) / 8);
      puff(ctx, Math.cos(a) * d, Math.sin(a) * d * 0.7 - 20 * fly, r * (1 - fly * 0.4), col, sh, 5);
      ctx.restore();
    }
    flat(ctx, fade, (k) => T.drawCloud(k, 0, 0, w * sc, h * sc, seed, { count: L.count ?? 7, color: col, shade: sh, line: 6, boil: lt }));
    if (L.word !== null && f >= 1) {
      const ws = T.lerp(0.5, 1.2, T.ease.outCubic(T.clamp((f - 1) / (endF - 1))));
      ctx.save(); ctx.globalAlpha *= 1 - T.clamp((f - endF + 5) / 5); ctx.rotate(-8 * D); ctx.scale(ws, ws);
      T.toonText(ctx, L.word ?? 'POOF!', 0, w * 0.06, { size: w * 0.16 * (L.wordSize ?? 1), fill: L.wordColor ?? '#e8c860', stroke: 12, shadow: false });
      ctx.restore();
    }
  }
  // Column (ran away): 2-3 stacked clouds grow upward from the feet over 8 frames, hold 4, fade 12.
  function poofColumn(ctx, L, f, w, h, seed, col, sh) {
    const n = L.count && L.count <= 4 ? L.count : 3, fade = 1 - T.clamp((f - 12) / 12);
    flat(ctx, fade, (k) => {
    for (let i = 0; i < n; i++) {
      const p = T.ease.outBack(T.clamp((f - i * 2) / 6)), cw = w * (0.62 - i * 0.12) * Math.max(0.01, p);
      if (p <= 0) continue;
      T.drawCloud(k, 0, -h * 0.35 - i * h * 0.62 * p, cw, cw * 0.8, seed + i, { count: 6, color: col, shade: sh, line: 6, boil: f / FPS });
    }
    });
  }

  // Hat: drop / give / fly / stack a headwear sprite onto (or off) the target's head.
  function hat(ctx, L, lt) {
    if (!CUR) return;
    const env = CUR.env, slt = CUR.lt, start = slt - lt, mode = L.mode ?? 'drop', kind = L.head ?? 'crown';
    const pose = poseOf(env, L.target, slt), base = pose || poseOf(env, L.target, start) || poseOf(env, L.target, start - 1 / FPS);
    if (!base) { if (L.target) return; throw new Error('hat: needs a "target" layer id (a bean)'); }
    const own = lookOf(env, base.L), look = { ...own, ...(own.head !== kind ? { headColor: undefined, headColor2: undefined } : {}), ...(isHex(L.color) ? { headColor: L.color } : {}), ...(isHex(L.color2) ? { headColor2: L.color2 } : {}) };
    const view = base.L.view ?? look.view ?? '3q', flip = base.st.flip, f = lt * FPS;
    toWorld(ctx, env, base.z, base.hud);
    const worn = () => pose && pose.L.look && pose.L.look.head === kind; // the target's own swap has taken over
    const [hx, hy] = headWorld(pose || base);
    if (mode === 'drop' || mode === 'stack') {
      const n = mode === 'stack' ? L.stack ?? 1 : 0, fallF = mode === 'stack' ? 5 : 2, k = (pose || base).k;
      if (mode === 'drop' && f >= fallF && worn()) return;
      const p = T.clamp(f / fallF), e = mode === 'stack' ? T.ease.in(p) : p;
      const restY = hy - n * 98 * k, y = restY - (1 - e) * (L.from ?? 600);
      const sq = f >= fallF && f < fallF + 2;
      const tilt = n ? (n % 2 ? 6 : -6) * D : 0;
      if (f < fallF + 4 && mode === 'drop') swoosh(ctx, hx, y, restY, k, f / (fallF + 4));
      hatAt(ctx, kind, look, lt, hx, y, k, (pose || base).st.r + tilt, flip, sq ? (n ? 1.1 : 1.06) : 1, sq ? (n ? 0.85 : 0.9) : 1, view);
      if (L.bonk && f >= fallF && f < fallF + 4) T.starburst(ctx, hx + 70 * k * 2, restY - 160 * k, 10, 30, 6, (L.id ?? 'hat') + 'bonk', '#fff6c8', P.ink, 4);
      return;
    }
    if (mode === 'give') {
      const giver = poseOf(env, L.from, start) || base, [gx, gy] = headWorld(giver), q = T.ease.outCubic(T.clamp(f / 12));
      if (f >= 12 && worn()) return;
      const x = T.lerp(gx, hx, q), y = T.lerp(gy, hy, q) - Math.sin(q * Math.PI) * (L.arc ?? 120);
      hatAt(ctx, kind, look, lt, x, y, T.lerp(giver.k, (pose || base).k, q), (1 - q) * -15 * D, flip, 1, 1, view);
      return;
    }
    if (mode === 'fly') return hatFly(ctx, L, lt, base, look, view, kind);
    if (mode === 'flat') return hatFlat(ctx, L, lt, base, look, view, kind);
    throw new Error(`hat: mode "${mode}" must be drop, give, fly, stack or flat`);
  }
  // Two yellow swoosh arcs along the drop path, 4 frames.
  function swoosh(ctx, x, y, restY, k, p) {
    ctx.save(); ctx.globalAlpha *= 1 - p; ctx.lineCap = 'round';
    for (const s of [-1, 1]) {
      const ox = s * 190 * k;
      for (const [c, lw] of [[P.ink, 10], ['#ffd84a', 5]]) { ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(x + ox * 0.7, restY - 420 * k); ctx.quadraticCurveTo(x + ox * 1.1, restY - 280 * k, x + ox * 0.85, restY - 180 * k); ctx.stroke(); }
    }
    ctx.restore();
  }
  // Helmet-pop / startle: up and spinning, lands beside the feet with one small bounce; `float` hovers in a figure 8.
  function hatFly(ctx, L, lt, base, look, view, kind) {
    const [hx, hy] = headWorld(base), k = base.k, dir = L.dir ?? -1;
    if (L.float) {
      const rise = T.ease.outCubic(T.clamp(lt / 0.2)), w = Math.PI * 2 * 0.7 * lt;
      hatAt(ctx, kind, look, lt, hx + Math.sin(w) * 70 * rise, hy - 160 * rise + Math.sin(2 * w) * 30 * rise, k, Math.sin(w) * 25 * D, base.st.flip, 1, 1, view);
      return;
    }
    // lands upright on its brim beside the feet (head centre sits (-450 - brim y) units below the ground line)
    const vy = L.vy ?? -900, g = L.g ?? 2500, vx = (L.vx ?? 220) * dir, ground = base.st.y + (-450 - rimOf(kind)[0] - rimOf(kind)[2] * 0.4) * k;
    const tl = (-vy + Math.sqrt(vy * vy + 2 * g * Math.max(0, ground - hy))) / g;
    const t = Math.min(lt, tl), x = hx + vx * t, y = hy + vy * t + 0.5 * g * t * t;
    const b = lt > tl ? -14 * Math.sin(T.clamp((lt - tl) / 0.2) * Math.PI) : 0;
    // whole turns only, so the spin ends upright; a 6 deg settle tilt after the landing
    const turns = Math.max(1, Math.round(((L.spin ?? 540) * tl) / 360)), rot = lt < tl ? dir * turns * 2 * Math.PI * T.ease.out(lt / tl) : dir * 6 * D;
    const sq = lt > tl && lt < tl + 0.07;
    hatAt(ctx, kind, look, lt, x, y + b, k, rot, base.st.flip, sq ? 1.12 : 1, sq ? 0.86 : 1, view, true);
  }
  // Flat: the hat left behind after a stomp / squash, pressed flat on the ground where the target stood.
  function hatFlat(ctx, L, lt, base, look, view, kind) {
    const k = base.k, f = lt * FPS, p = T.ease.outBack(T.clamp(f / 4));
    const [y0] = rimOf(kind), sy = L.flat ?? 0.42, cy = base.st.y + (-450 - y0) * k * sy;
    hatAt(ctx, kind, look, lt, base.st.x, cy, k, (L.tilt ?? -4) * D, base.st.flip, T.lerp(1.4, 1.15, p), T.lerp(0.2, sy, p), view, true);
    if (f < 14) { ctx.save(); ctx.globalAlpha *= 1 - T.clamp((f - 6) / 8); [-1, 1].forEach((s, i) => dustCluster(ctx, base.st.x + s * 190 * k, base.st.y - 14, 26, (L.id ?? 'hf') + i)); ctx.restore(); }
  }

  // Marks: micro-acting signs around the head, all on twos. Drawn in the target's rig units (1 px of a 300 px
  // character = 2 units). Sub-kind in `mark`.
  const MARK_DUR = { 'shout-jag': 0.5, ticks: 0.13, notice: 0.17, whoosh: 0.4 };
  const MARKS = {
    'shout-jag'(ctx, L, lt, side) {
      const r = T.rng(T.hash((L.id ?? 'jag') + twos(lt)));
      ctx.save(); ctx.strokeStyle = L.color ?? P.ink; ctx.lineWidth = 10; ctx.lineJoin = 'miter'; ctx.lineCap = 'round';
      for (const a of [-30, 0, 30]) {
        ctx.save(); ctx.translate(0, -450); ctx.rotate(a * D + side * 0.15); ctx.translate((r() - 0.5) * 12, -200 + (r() - 0.5) * 12);
        ctx.beginPath(); ctx.moveTo(0, 0); for (let i = 1; i <= 4; i++) ctx.lineTo(i % 2 ? 16 : -16, -i * 17); ctx.stroke(); ctx.restore();
      }
      ctx.restore();
    },
    ticks(ctx, L, lt, side) { // press / snap / realize / crunch
      const v = L.variant ?? 'realize', crunch = v === 'crunch';
      if (crunch && twos(lt) % 2) return;
      const [ox, oy] = crunch ? [side * 120, -382] : [side * 175, -560], col = L.color ?? (v === 'realize' ? '#ffe060' : '#ffd21a');
      const n = L.count ?? 4, g = T.rng(T.hash((L.id ?? 'tk') + twos(lt)));
      for (let i = 0; i < n; i++) {
        const a = (side > 0 ? -70 : -110) * D + (i - (n - 1) / 2) * 0.42, r0 = 26, r1 = r0 + 36 + g() * 8;
        tickStroke(ctx, ox + Math.cos(a) * r0, oy + Math.sin(a) * r0, ox + Math.cos(a) * r1, oy + Math.sin(a) * r1, col);
      }
    },
    notice(ctx, L, lt) { // "\ | /" fan above the head
      for (const a of [-25, 0, 25]) { const r = (a - 90) * D; tickStroke(ctx, Math.cos(r) * 190, -450 + Math.sin(r) * 190, Math.cos(r) * 236, -450 + Math.sin(r) * 236, L.color ?? '#ffe98a'); }
    },
    zzz(ctx, L, lt, side) { // a Z every 0.6 s rising 30 px/s, drifting, fading over 1.5 s
      const sizes = [60, 46, 34];
      for (let i = Math.max(0, Math.floor((lt - 1.5) / 0.6)); i * 0.6 <= lt; i++) {
        const a = lt - i * 0.6, sz = sizes[i % 3] * 2;
        ctx.save(); ctx.globalAlpha *= 1 - a / 1.5;
        T.toonText(ctx, 'Z', side * (200 + a * 20), -640 - a * 60, { size: sz, fill: L.color ?? '#ffffff', stroke: sz * 0.16, shadow: false });
        ctx.restore();
      }
    },
    'hat-drips'(ctx, L, lt) { // stress ticks hanging under a brim, one falls as a drop every 0.4 s
      const n = L.count ?? 8, g = T.rng(T.hash((L.id ?? 'hd') + twos(lt)));
      ctx.save(); ctx.strokeStyle = P.ink; ctx.lineWidth = 6; ctx.lineCap = 'round';
      for (let i = 0; i < n; i++) { const x = -120 + (240 * i) / (n - 1), len = 26 + (i % 3) * 6 + (g() - 0.5) * 12; ctx.beginPath(); ctx.moveTo(x, -548); ctx.lineTo(x, -548 + len); ctx.stroke(); }
      ctx.restore();
      const k = Math.floor(lt / 0.4), a = (lt % 0.4) / 0.4, x = -120 + (240 * ((k * 5) % n)) / (n - 1);
      ctx.save(); ctx.globalAlpha *= 1 - a; drop(ctx, x, -500 + a * a * 140, 0.7, '#9fdcf2'); ctx.restore();
    },
    gloom(ctx, L, lt) { // purple despair lines hanging from the forehead, grow over 8 frames
      const n = L.count ?? 8, grow = T.ease.outCubic(T.clamp(lt * FPS / 8)), g = T.rng(T.hash((L.id ?? 'gl') + ':g'));
      ctx.save(); ctx.strokeStyle = L.color ?? '#4a2a5a'; ctx.fillStyle = ctx.strokeStyle; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.globalAlpha *= 0.85;
      for (let i = 0; i < n; i++) {
        const x = -110 + (220 * i) / (n - 1) + 30, len = (60 + g() * 60) * grow, y0 = -578 + Math.abs(x - 30) * 0.25;
        ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y0 + len); ctx.stroke();
        ctx.beginPath(); ctx.arc(x, y0 + len + 4, 8 * grow, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    },
    stink(ctx, L, lt) { // three green wavy lines rising from the head
      const t = twos(lt) / 15;
      ctx.save(); ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        const x0 = (i - 1) * 70, rise = ((t * 0.8 + i * 0.33) % 1) * 120;
        for (const [c, lw] of [[P.ink, 12], [L.color ?? '#6aa84f', 7]]) {
          ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.beginPath();
          for (let s = 0; s <= 10; s++) { const y = -610 - rise - s * 12, x = x0 + Math.sin(s * 0.9 + t * Math.PI * 2) * 14; s ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
          ctx.stroke();
        }
      }
      ctx.restore();
    },
    whoosh(ctx, L, lt, side) { // white motion arcs beside the body: appear in 2 frames, fade over 10
      const a = T.clamp(lt * FPS / 2) * (1 - T.clamp((lt * FPS - 2) / 10));
      arcs(ctx, -side * 60, -300, 260, side > 0 ? Math.PI * 0.75 : -Math.PI * 0.25, side > 0 ? Math.PI * 1.25 : Math.PI * 0.25, L.count ?? 3, a, 10);
    },
    question(ctx, L, lt) { T.drawProp(ctx, 'question', 140, lt, {}); },
    exclaim(ctx, L, lt) { T.drawProp(ctx, 'exclaim', 140, lt, {}); },
    scribble(ctx, L, lt) { // black zigzag scribble cloud above the head
      const g = T.rng(T.hash((L.id ?? 'sc') + twos(lt)));
      ctx.save(); ctx.strokeStyle = L.color ?? '#1a1210'; ctx.lineWidth = 6; ctx.lineJoin = 'round'; ctx.beginPath();
      for (let i = 0; i < 26; i++) { const a = g() * Math.PI * 2, r = Math.sqrt(g()); const x = Math.cos(a) * r * 120, y = -700 + Math.sin(a) * r * 60; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke(); ctx.restore();
    },
  };
  // question / exclaim draw at the origin: lift them above the head with a 2 Hz bob.
  for (const q of ['question', 'exclaim']) { const fn = MARKS[q]; MARKS[q] = (ctx, L, lt) => { ctx.save(); ctx.translate(0, -700 + Math.sin(lt * Math.PI * 4) * 4); fn(ctx, L, lt); ctx.restore(); }; }
  T.ACT_MARKS = MARKS;
  function tickStroke(ctx, x0, y0, x1, y1, col) {
    ctx.save(); ctx.lineCap = 'round';
    for (const [c, lw] of [[P.ink, 18], [col, 10]]) { ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); }
    ctx.restore();
  }
  function marks(ctx, L, lt) {
    const fn = MARKS[L.mark ?? 'shout-jag'];
    if (!fn) throw new Error(`marks: unknown mark "${L.mark}" (use ${Object.keys(MARKS).join(', ')})`);
    const dur = L.dur ?? MARK_DUR[L.mark ?? 'shout-jag'] ?? Infinity;
    if (lt > dur + 0.2) return;
    ctx.save();
    const pose = onTarget(ctx, L);
    if (pose) {
      if (!pose.local && L.size) { ctx.translate(0, -450); ctx.scale(L.size, L.size); ctx.translate(0, 450); }
      if (Number.isFinite(dur) && lt > dur) ctx.globalAlpha *= 1 - T.clamp((lt - dur) / 0.2);
      fn(ctx, L, lt, L.side ?? 1);
    }
    ctx.restore();
  }

  // Teardrop pointing along `ang` (0 = falling down), rig units.
  function drop(ctx, x, y, s, fill, ang = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s);
    T.outlined(ctx, (k) => { k.moveTo(0, -34); k.quadraticCurveTo(24, 4, 0, 18); k.quadraticCurveTo(-24, 4, 0, -34); }, fill, { line: 6 });
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(-6, 2, 4, 7, 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  // Sweat spray: drops leave the head rim on gravity arcs, `rate` per second, 15 frames each; `stack` accumulates.
  function sweatSpray(ctx, L, lt) {
    const dur = L.dur ?? Infinity;
    if (lt > dur + 0.5) return;
    ctx.save();
    if (!onTarget(ctx, L)) { ctx.restore(); return; }
    const fill = L.color ?? '#9fdcf2', sz = L.size ?? 1;
    if (L.stack) {
      for (let i = 0; i <= Math.min(lt, dur); i++) drop(ctx, (L.side ?? 1) * (128 + (i % 3) * 14), -520 + (i % 2) * 30 + (lt - i) * 8, 2.3 * sz, fill);
      ctx.restore(); return;
    }
    const rate = L.rate ?? 3, life = 0.5, spread = (L.spread ?? 120) * D;
    for (let i = Math.max(0, Math.floor((lt - life) * rate)); i / rate <= Math.min(lt, dur); i++) {
      const a0 = i / rate, t = lt - a0, g = T.rng(T.hash((L.id ?? 'sw') + ':' + i));
      if (t < 0 || t > life) continue;
      const a = -Math.PI / 2 + (g() - 0.5) * 2 * spread, d = 160 + g() * 160, p = t / life;
      const x = Math.cos(a) * (165 + d * p), y = -450 + Math.sin(a) * (165 + d * p) + 700 * t * t;
      const vx = Math.cos(a) * d / life, vy = Math.sin(a) * d / life + 1400 * t;
      ctx.save(); ctx.globalAlpha *= 1 - p * p;
      drop(ctx, x, y, 2.5 * sz, fill, Math.atan2(vy, vx) - Math.PI / 2);
      ctx.restore();
    }
    ctx.restore();
  }
  // Tear stream: a light-blue ribbon from the lower lid to the chin, dash pattern scrolling 4 px per frame.
  function tearStream(ctx, L, lt) {
    const dur = L.dur ?? Infinity;
    if (lt > dur) return;
    ctx.save();
    const pose = onTarget(ctx, L);
    if (!pose) { ctx.restore(); return; }
    const view = pose.L.view ?? '3q', fx = (VIEW_SHIFT[view] ?? 0.24) * 150, sp = view === 'side' ? 0 : view === '3q' ? 40 : 52;
    const eyes = view === 'side' ? [fx + 18] : L.both === false ? [fx + sp] : [fx - sp, fx + sp];
    const w = (L.width ?? 10) * 2, grow = T.ease.outCubic(T.clamp(lt / 0.2)), len = 230 * grow, g = T.rng(T.hash((L.id ?? 'tear') + twos(lt)));
    for (const ex of eyes) {
      const pts = [];
      for (let s = 0; s <= 8; s++) pts.push([ex + (ex < fx ? -1 : 1) * s * 4 + (g() - 0.5) * 4, -436 + (s / 8) * len]);
      ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (const [c, lw] of [[P.ink, w + 8], [L.color ?? '#7fc4ff', w]]) { ctx.strokeStyle = c; ctx.lineWidth = lw; poly(ctx, pts); ctx.stroke(); }
      ctx.setLineDash([10, 22]); ctx.lineDashOffset = -lt * FPS * 8; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = w * 0.3; poly(ctx, pts); ctx.stroke();
      ctx.restore();
      const [bx, by] = pts[8];
      T.outlined(ctx, (k) => k.arc(bx, by + 6, w * 0.75, 0, Math.PI * 2), L.color ?? '#7fc4ff', { line: 5 });
    }
    ctx.restore();
  }

  // "No X" sign: red ring + 45 deg bar with a union ink outline, optional icon prop underneath.
  function prohibitSign(ctx, size, ringP, barP, o, lt) {
    const R = size / 2, rw = R * 0.14 * 2, Ri = R - rw, col = isHex(o.color) ? o.color : '#d42020', line = Math.max(3, size * 0.012);
    if (o.icon && T.PROPS[o.icon] && o.icon !== 'prohibit') { ctx.save(); ctx.filter = 'saturate(0.85)'; T.drawProp(ctx, o.icon, size * 0.6, lt, {}); ctx.restore(); }
    ctx.save(); ctx.scale(ringP, ringP);
    const ring = (k) => { k.moveTo(R, 0); k.arc(0, 0, R, 0, Math.PI * 2); k.moveTo(Ri, 0); k.arc(0, 0, Ri, 0, Math.PI * 2, true); };
    const bar = (k) => { k.save(); k.rotate(45 * D); k.rect(-Ri - 2, -rw / 2, (Ri + 2) * 2 * barP, rw); k.restore(); };
    ctx.lineJoin = 'round'; ctx.strokeStyle = P.ink; ctx.lineWidth = line * 2;
    ctx.beginPath(); ring(ctx); if (barP > 0) bar(ctx); ctx.stroke();
    ctx.fillStyle = col; ctx.beginPath(); ring(ctx); ctx.fill('evenodd');
    if (barP > 0) { ctx.beginPath(); bar(ctx); ctx.fill(); }
    if (o.highlight !== false) { ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = Math.max(2, size * 0.008); ctx.beginPath(); ctx.arc(0, 0, R - rw * 0.3, -2.6, -1.9); ctx.stroke(); }
    ctx.restore();
  }
  // Ring 0 -> 1.15 -> 1 over 7 frames with a 5 deg pop tilt, then the bar wipes along its length over 4 frames.
  function prohibitFx(ctx, L, lt) {
    const f = lt * FPS, size = L.size ?? 260;
    if (L.stamp) { if (f >= 1 || L.stamp === 'instant') { if (f < 3) ctx.translate((twos(lt) % 2 ? 4 : -4), 0); prohibitSign(ctx, size, 1, 1, L, lt); } return; }
    const ringP = Math.max(0.001, T.ease.outBack(T.clamp(f / 7))), barP = T.ease.outCubic(T.clamp((f - 7) / 4));
    ctx.rotate((1 - T.clamp(f / 7)) * 5 * D);
    if (L.jolt && f >= 11 && f < 13) ctx.translate(f < 12 ? 4 : -4, 0);
    prohibitSign(ctx, size, ringP, barP, L, lt);
  }

  Object.assign(T.FX, { poof, hat, marks, 'sweat-spray': sweatSpray, 'tear-stream': tearStream, prohibit: prohibitFx });
  T.PROPS.prohibit = (ctx, s, lt, o) => prohibitSign(ctx, s, 1, 1, o || {}, lt);
  // ========== ENTRANCES / EXITS (T.ENTERS) — fn(p, st, isExit, L); t = seconds in the kind's natural direction
  const durOf = (kind, isExit, L) => (isExit ? L.exitDur : L.enterDur) ?? T.ENTER_DUR[kind];
  function reg(kind, dur, natural, fn) {
    T.ENTER_DUR[kind] = dur;
    T.ENTERS[kind] = (p, st, isExit, L) => {
      const d = durOf(kind, isExit, L), q = (natural === 'exit') === isExit ? p : 1 - p;
      fn(q * d, st, L, d, isExit, p);
    };
  }
  const bbScale = (L, st) => { const b = boxOf(L); return { w: b.w * st.s, h: b.h * st.s, feet: b.feet }; };
  // Rotate about the body centre instead of the feet anchor.
  function aboutCentre(st, L, ang) {
    const b = bbScale(L, st);
    if (!b.feet) { st.r += ang; return; }
    const hh = b.h / 2;
    st.r += ang; st.x += -hh * Math.sin(ang); st.y += -hh + hh * Math.cos(ang);
  }

  reg('tumble', 0.5, 'exit', (t, st, L) => { // shove / kick launch: no anticipation, spin + gravity arc
    const o = L.tumble || {}, dir = o.dir ?? 1;
    aboutCentre(st, L, (o.spin ?? 18) * t * FPS * dir * D);
    st.x += (o.vx ?? 600) * t * dir; st.y += (o.vy ?? -500) * t + 0.5 * (o.g ?? 4000) * t * t;
  });
  reg('zip', 0.8, 'exit', (t, st, L) => { // 4-frame lean back, gone at frame 5 (the dust trail is drawn by the wrapper)
    const dir = (L.zip || {}).dir ?? 1, f = frame(t);
    if (f >= 5) { st.a = 0; return; }
    st.r += -dir * 8 * D * T.clamp(t * FPS / 4); st.sx *= 0.94;
  });
  reg('ground', 0.17, 'enter', (t, st) => { // hole for 3 frames, pop at 1.06, settle by frame 5 (hard frames)
    const f = frame(t);
    if (f < 3) st.a = 0; else if (f === 3) st.s *= 1.06; else if (f === 4) st.s *= 1.03;
  });
  T.ENTER_DUR.peek = 0.25;
  T.ENTERS.peek = (p, st, isExit, L) => { // lean in from a frame edge and keep the tilt
    const o = L.peek || {}, side = o.side ?? 'right', sg = side === 'left' || side === 'top' ? -1 : 1;
    const q = isExit ? 1 - T.ease.in(p) : T.ease.outBack(p), b = bbScale(L, st);
    if (side === 'left' || side === 'right') {
      st.x += sg * (o.dist ?? b.w * 1.15) * (1 - q);
      st.r += -sg * (o.tilt ?? 18) * D * Math.min(1, Math.max(0, q));
    } else st.y += sg * (o.dist ?? b.h * (o.depth ?? 0.45) * 1.3) * (1 - q);
  };
  reg('stretch', 0.1, 'enter', (t, st) => { // scaleY 0.3 -> 1.15 -> 1 on frames 0, 2, 3 (scaleX inverse)
    const k = [[0.3, 1.3], [0.72, 1.11], [1.15, 0.92], [1, 1]][Math.min(3, frame(t))];
    st.sy *= k[0]; st.sx *= k[1];
  });
  reg('spit', 0.6, 'enter', (t, st, L) => { // parabola out of a frame / portal over 10 frames, drop-squash landing
    const o = L.spit || {}, from = o.from ?? [0.5, 0.4], travel = 10 / FPS;
    if (t < travel) {
      const u = t / travel;
      st.x = T.lerp(from[0] * W, st.x, u); st.y = T.lerp(from[1] * H, st.y, u) - (o.arc ?? 400) * 4 * u * (1 - u);
      st.s *= T.lerp(0.3, 1, T.ease.outCubic(u)); return;
    }
    const f = (t - travel) * FPS;
    const [sy, sx] = f < 2 ? [0.85, 1.12] : f < 4 ? [1.05, 0.97] : [T.lerp(1.05, 1, T.clamp((f - 4) / 4)), T.lerp(0.97, 1, T.clamp((f - 4) / 4))];
    st.sy *= sy; st.sx *= sx;
  });
  reg('silhouette-in', 0.6, 'enter', (t, st, L, d) => { // slides in as a dark shape, colour crossfades over the last 30%
    const p = T.clamp(t / d), from = L.from ?? 'left', q = from === 'bottom' ? T.ease.out(p) : T.ease.outCubic(p);
    if (from === 'bottom') st.y += H * 0.7 * (1 - q);
    else if (from !== 'none') st.x += (from === 'right' ? 1 : -1) * W * 0.55 * (1 - q);
    if (!L._silo) st.a *= T.clamp((p - 0.7) / 0.3);
  });
  reg('pivot-fall', 1.2, 'exit', (t, st, L, d) => { // plank fall around the feet: 10 frames accelerating, 2-frame squash, stays down
    const o = L.fall || {}, dir = o.dir ?? 1, f = t * FPS;
    const ang = 90 * dir * D * (o.snap ? (f >= 1 ? 1 : 0) : T.ease.in(T.clamp(f / 10)));
    st.r += ang; st.y -= bbScale(L, st).w * 0.42 * Math.abs(Math.sin(ang)); // lie on the floor, not through it
    if (f >= 10 && f < 12) { st.sy *= 0.92; st.sx *= 1.04; }
    if (o.fade && t > d - 0.3) st.a *= T.clamp((d - t) / 0.3);
  });
  // ========== T.drawLayer wrapper: taken layers hide; ground holes, zip trails, fall dust, silhouettes and flying hats
  const baseDrawLayer = T.drawLayer;
  const restPose = (L, lt) => T.layerState({ ...L, enter: 'none', exit: 'none', out: undefined }, lt);
  function inWorld(ctx, L, cam, fn) { ctx.save(); if (!L.hud && cam) T.applyCam(ctx, cam, L.z ?? 1); fn(); ctx.restore(); }

  function groundBefore(ctx, L, lt, cam) {
    const t = lt - (L.at ?? 0), f = frame(t);
    if (f > 6 || t < 0) return;
    const st = restPose(L, lt), b = bbScale(L, st || { s: 1 });
    if (!st) return;
    const y = b.feet ? st.y : st.y + b.h / 2, k = f < 3 ? 1 : 1 - (f - 2) / 5, col = L.holeColor ?? '#3a2a20';
    inWorld(ctx, L, cam, () => T.outlined(ctx, (c) => c.ellipse(st.x, y, b.w * 0.7 * k, b.w * 0.16 * k, 0, 0, Math.PI * 2), col, { line: 5, shade: (c) => { c.fillStyle = T.shade(col, -0.35); c.fillRect(st.x - b.w, y - b.w, b.w * 2, b.w * 0.95); } }));
  }
  function groundAfter(ctx, L, lt, cam) {
    const t = lt - (L.at ?? 0), f = t * FPS;
    if (f < 3 || f > 15) return;
    const st = restPose(L, lt);
    if (!st) return;
    const b = bbScale(L, st), y = b.feet ? st.y : st.y + b.h / 2, p = (f - 3) / 12;
    inWorld(ctx, L, cam, () => {
      ctx.globalAlpha *= 1 - T.ease.in(p);
      [-1, 1, 0.2].forEach((s, i) => dustCluster(ctx, st.x + s * b.w * (0.45 + p * 0.3), y - 10 - p * 30 - i * 6, 22 * (1 - p * 0.5) * Math.min(2, b.h / 300), (L.id ?? 'g') + i));
    });
  }
  function zipAfter(ctx, L, lt, cam) {
    const t = lt - (L.out ?? Infinity), f = t * FPS;
    if (f < 4 || f > 26) return;
    const o = L.zip || {}, dir = o.dir ?? 1, st = restPose(L, L.out), b = bbScale(L, st || { s: 1 });
    if (!st) return;
    const n = o.puffs ?? 10, cy = b.feet ? st.y - b.h * 0.3 : st.y, g = T.rng(T.hash((L.id ?? 'zip') + ':z'));
    inWorld(ctx, L, cam, () => {
      if (o.hole) { ctx.save(); ctx.globalAlpha *= 0.8; T.outlined(ctx, (c) => T.smoothPath(c, T.blobPts(st.x, cy - b.h * 0.1, b.w * 0.45, b.h * 0.55, (L.id ?? 'zip') + 'h', 18, 0.22)), '#2a1c15', { line: 0 }); ctx.restore(); }
      for (let i = 0; i < n; i++) {
        const lag = Math.floor(g() * 2), q = T.clamp((f - 5 - 5 - lag) / 15), along = (i / (n - 1)) * (1.2 + g() * 0.8) * b.w;
        const r = (14 + g() * 16) * Math.max(0.6, b.h / 300) * (1 - T.ease.in(q));
        if (r < 1) continue;
        ctx.save(); ctx.globalAlpha *= 1 - q;
        dustCluster(ctx, st.x + dir * along - dir * b.w * 0.3, cy + (g() - 0.3) * b.h * 0.5, r, (L.id ?? 'zip') + i);
        ctx.restore();
      }
      for (let i = 0; i < 3; i++) { const a = f - 5, x = st.x + dir * (b.w * 1.4 + a * 10 * (i + 1)), y = cy - 40 + i * 30 + a * a * 0.4; ctx.save(); ctx.globalAlpha *= T.clamp(1 - a / 18); puff(ctx, x, y, 7, '#e8dcb8', '#c8b890', 4); ctx.restore(); }
    });
  }
  function fallAfter(ctx, L, lt, cam) {
    const t = lt - (L.out ?? Infinity), f = t * FPS, o = L.fall || {};
    if (f < 0 || f > 40) return;
    const st = restPose(L, L.out), dir = o.dir ?? 1;
    if (!st) return;
    const b = bbScale(L, st);
    inWorld(ctx, L, cam, () => {
      if (o.whoosh !== false && f < 12 && !o.snap) arcs(ctx, st.x, st.y, b.h * 0.95, -Math.PI / 2, -Math.PI / 2 + dir * Math.min(Math.PI / 2, T.ease.in(T.clamp(f / 10)) * Math.PI / 2), 3, 1 - T.clamp((f - 8) / 4), 6);
      if (o.puffs === false || f < 10) return;
      const q = f - 10, grow = T.ease.outCubic(T.clamp(q / 6)), fade = 1 - T.clamp((q - 4) / 12);
      ctx.globalAlpha *= fade;
      [[st.x + dir * b.h * 1.12, 0], [st.x - dir * b.h * 0.12, 1]].forEach(([x, i]) => dustCluster(ctx, x, st.y - 10 - q * 1.5, 30 * grow * Math.min(2, b.h / 300), (L.id ?? 'fall') + i));
    });
  }
  // Tumble with detach: the bean loses its headwear at `out`; the hat pops up 80 px, hangs 5 frames, falls at 60% g.
  function tumbleHat(ctx, L, lt, env, cam) {
    const o = L.tumble || {}, t = lt - L.out, look = lookOf(env, L);
    if (o.detach !== 'head' || !look.head || t < 0) return false;
    const st = restPose(L, L.out);
    if (!st) return false;
    const k = ((L.size ?? 420) / 600) * st.s, dir = o.dir ?? 1, f = t * FPS;
    const up = f < 5 ? T.ease.outCubic(f / 5) * 80 : 80, fallT = Math.max(0, t - 10 / FPS);
    // ... and lands on its brim where the bean stood, staying as the "what is left" beat of the shot
    const rest = st.y + (-450 - rimOf(look.head)[0] - rimOf(look.head)[2] * 0.4) * k, gy = 0.6 * (o.g ?? 4000);
    const y0 = st.y - 450 * k - up, yf = y0 + 0.5 * gy * fallT * fallT, landed = yf >= rest;
    const tLand = 10 / FPS + Math.sqrt(Math.max(0, 2 * (rest - (st.y - 450 * k - 80)) / gy)), x = st.x + dir * 40 * Math.min(t, tLand);
    const bounce = landed ? -10 * Math.sin(T.clamp((t - tLand) / 0.18) * Math.PI) : 0;
    const rot = landed ? dir * 4 * D : dir * 12 * D * Math.sin(t * 8); inWorld(ctx, L, cam, () => hatAt(ctx, look.head, look, lt, x, Math.min(yf, rest) + bounce, k, rot, st.flip, 1, 1, L.view ?? look.view ?? '3q', true));
    return true;
  }

  T.drawLayer = (ctx, L, lt, env, cam) => {
    const prev = CUR;
    CUR = { env: { ...env, cam: cam ?? null }, lt };
    try {
      if (env.shot && L.id && takenAt(env.shot, L.id) <= lt) return;
      const enter = L.enter, exit = L.exit, at = L.at ?? 0;
      if (enter === 'ground') groundBefore(ctx, L, lt, cam);
      if (enter === 'silhouette-in' && !L._silo && lt >= at && lt < at + durOf('silhouette-in', false, L)) {
        baseDrawLayer(ctx, { ...L, _silo: true, silhouette: L.silColor ?? (L.from === 'bottom' ? '#140f0c' : '#1d1414') }, lt, env, cam);
      }
      let LL = L;
      if (exit === 'tumble' && L.out != null && lt > L.out && L.type === 'bean' && (L.tumble || {}).detach === 'head') {
        LL = { ...L, look: { ...(L.look || {}), head: null } };
        tumbleHat(ctx, L, lt, env, cam);
      }
      baseDrawLayer(ctx, LL, lt, env, cam);
      if (enter === 'ground') groundAfter(ctx, L, lt, cam);
      if (exit === 'zip' && L.out != null) zipAfter(ctx, L, lt, cam);
      if (exit === 'pivot-fall' && L.out != null) fallAfter(ctx, L, lt, cam);
    } finally { CUR = prev; }
  };
})();
