// gags-enter.js — acting and gags, part 3: eight measured entrances / exits (tumble, zip, ground, peek, stretch, spit,
// silhouette-in, pivot-fall) in T.ENTERS / T.ENTER_DUR, and the chained T.drawLayer wrapper (taken layers hide; holes, dust, hats).
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL, W = T.W, H = T.H, D = T.DEG, GK = T.GAG;
  const { FPS, frame, lookOf, boxOf, puff, dustCluster, arcs, rimOf, hatAt, takenAt } = GK;
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
  // dropShadow: N seconds before a drop / drop-squash lands, a ground shadow grows on the empty spot (reference: ~10 f
  // of growing shadow on an empty frame, the body falls in within 3 f); it shrinks under the body as it lands.
  function dropShadowBefore(ctx, L, lt, cam) {
    const at = L.at ?? 0, lead = L.dropShadow === true ? 0.33 : L.dropShadow;
    if (!(lead > 0) || lt < at - lead || lt > at + 0.2) return;
    const st = restPose(L, at);
    if (!st) return;
    const b = bbScale(L, st), y = b.feet ? st.y : st.y + b.h / 2;
    const k = lt < at ? T.ease.out(T.clamp((lt - at + lead) / lead)) : 1 - T.clamp((lt - at) / 0.2);
    inWorld(ctx, L, cam, () => {
      ctx.globalAlpha *= 0.35 * k;
      ctx.fillStyle = L.shadowColor ?? '#2a1c15';
      ctx.beginPath(); ctx.ellipse(st.x, y, b.w * 0.55 * (0.4 + 0.6 * k), b.w * 0.12 * (0.4 + 0.6 * k), 0, 0, Math.PI * 2); ctx.fill();
    });
  }
  // zip.rev: the last N seconds before a zip exit, the legs spin as blurred wheels (reference: 15 f crouch, ~10 f rev).
  function zipRev(ctx, L, lt, cam) {
    const o = L.zip || {}, rev = o.rev === true ? 0.35 : o.rev, out = L.out;
    if (!(rev > 0) || lt < out - rev || lt > out) return;
    const st = T.layerState(L, lt);
    if (!st) return;
    const b = bbScale(L, st), dir = o.dir ?? 1, y = b.feet ? st.y - b.h * 0.07 : st.y + b.h * 0.43, r = b.w * 0.26;
    const spin = (lt - out + rev) * 40 * dir;
    inWorld(ctx, L, cam, () => {
      for (const sx of [-0.18, 0.18]) {
        const x = st.x + sx * b.w;
        ctx.save(); ctx.globalAlpha *= 0.9; ctx.fillStyle = '#f4efe4';
        ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.85, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#2a1c15'; ctx.lineWidth = Math.max(3, r * 0.08); ctx.stroke();
        for (let i = 0; i < 3; i++) { const a0 = spin + i * 2.1; ctx.beginPath(); ctx.arc(x, y, r * 0.62, a0, a0 + 1.1); ctx.stroke(); }
        ctx.restore();
      }
      dustCluster(ctx, st.x - dir * b.w * 0.45, y + r * 0.4, r * (0.6 + 0.2 * Math.sin(spin * 2)), (L.id ?? 'rev') + ':d');
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
    const prev = GK.cur;
    GK.cur = { env: { ...env, cam: cam ?? null }, lt };
    try {
      if (env.shot && L.id && takenAt(env.shot, L.id) <= lt) return;
      const enter = L.enter, exit = L.exit, at = L.at ?? 0;
      if (enter === 'ground') groundBefore(ctx, L, lt, cam);
      if ((enter === 'drop' || enter === 'drop-squash') && L.dropShadow) dropShadowBefore(ctx, L, lt, cam);
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
      if (exit === 'zip' && L.out != null) { zipRev(ctx, L, lt, cam); zipAfter(ctx, L, lt, cam); }
      if (exit === 'pivot-fall' && L.out != null) fallAfter(ctx, L, lt, cam);
    } finally { GK.cur = prev; }
  };
})();
