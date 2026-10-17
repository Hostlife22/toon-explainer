// gags.js — acting and gags, part 1: shared helpers (T.GAG) and the off-screen arm (rubber arm, giant hand, spring /
// piston glove, stomping foot, fishing hook) that takes things. FX (poof, hat, marks, sweat / tear emitters, the "no X"
// sign) are in gags-fx.js; the eight measured entrances / exits and the T.drawLayer wrapper are in gags-enter.js.
// Timing comes from frame counts of the reference videos at 30 fps.
// Registries: T.layers.arm + T.ARMS; T.GAG is the helper kit the other gags files share.
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL, W = T.W, H = T.H, D = T.DEG, FPS = 30;
  const GK = (T.GAG = { cur: null }); // shared with gags-fx.js and gags-enter.js
  const VIEW_SHIFT = { front: 0, '3q': 0.24, side: 0.42, back: 0 };
  const frame = (t) => Math.floor(t * FPS + 1e-6);
  const twos = (lt) => Math.floor(lt * 15);
  const isHex = (v) => typeof v === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(v);

  // ---------- context: the shot being drawn (FX draw functions only receive (ctx, L, lt)) ----------
  // GK.cur = {env, cam, lt: shot time}, set by the T.drawLayer wrapper in gags-enter.js
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
    if (L.target && GK.cur) {
      const pose = poseOf(GK.cur.env, L.target, GK.cur.lt);
      if (!pose) return null;
      toWorld(ctx, GK.cur.env, pose.z, pose.hud); toRig(ctx, pose);
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
    const slt = GK.cur ? GK.cur.lt : 0, L0 = findLayer(env, id);
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
  Object.assign(GK, { FPS, VIEW_SHIFT, frame, twos, isHex, findLayer, lookOf, poseOf, toWorld, toRig, headWorld, onTarget, boxOf, puff, dustCluster, arcs, hatSprite, rimOf, hatAt, takenAt, poly });
})();
