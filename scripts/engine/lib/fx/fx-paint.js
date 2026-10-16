// fx-paint.js — painted versions of the classic smoke, fire, explosion, dust, puff and gas effects, built on the
// closed-form particles (particles.js). Under style.look "painted" (T.paintedState) each kind draws soft multi-tone
// puffs, additive glows, debris and shock rings; the classic look calls the original function untouched (kept in
// T.FX_CLASSIC, so tests can prove classic frames are pixel-identical).
(function () {
  'use strict';
  const T = window.TOON, FX = T.FX, TAU = Math.PI * 2;
  T.FX_CLASSIC = T.FX_CLASSIC || {};
  // Stable emitter objects: the full parameter set is the identity (T.emitterOf), so no layer field can be left out.
  const em = (_L, _role, make) => T.emitterOf(make());
  const hexOr = (c, def) => (typeof c === 'string' && /^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(c) ? T.hex6(c) : def);
  const paint = (kind, fn) => {
    const base = FX[kind];
    if (!base) throw new Error('fx-paint: missing classic fx ' + kind);
    T.FX_CLASSIC[kind] = base;
    FX[kind] = (ctx, L, lt, env) => { const P = T.paintedState(env, L); return P ? fn(ctx, L, lt, env, P, base) : base(ctx, L, lt, env); };
  };

  // smoke: a drifting band of soft, lit puffs (w, color, rise, count as in the classic kind).
  paint('smoke', (ctx, L, lt, env, P) => {
    const w = L.w ?? 1400, rise = L.rise ?? 220, n = L.count ?? 14, life = 4.2;
    const e = em(L, 'smoke', () => ({ preset: 'smoke', id: (L.id ?? 'smoke') + 'p', w, h: 40, rate: (n / life) * 1.5, life, prewarm: true, speed: 30, spread: 50, drag: 0.6, gravity: -((rise * 0.6) / life) * 1.4, wind: 28, size: [95, 160], grow: 1.9, opacity: 0.62, color: hexOr(L.color, undefined) }));
    T.drawParticles(ctx, e, lt, { painted: P });
  });

  // Painted flame: four nested tongues (deep red rim, orange, yellow, a white-hot core), each a vertical gradient that
  // cools toward its tips, a dark rim line for the toon read and an additive heat bloom at the base. Shapes re-seed every
  // `step` frames like the classic flipbook (T.drawFlame).
  function paintedFlame(ctx, size, lt, seed, step) {
    const k = Math.floor(lt * 30 / step + 1e-6) % 4, r = T.rng(T.hash(seed + ':' + k));
    const tongue = (scale, c0, c1, n = 5) => {
      const pts = [];
      for (let i = 0; i <= n; i++) {
        const x = (i / n - 0.5) * size * 0.8 * scale, top = i % 2 ? 0.55 : 1;
        pts.push([x, -size * scale * top * (0.75 + r() * 0.35)]);
        if (i < n) pts.push([x + (size * 0.8 * scale) / n / 2, -size * scale * (0.3 + r() * 0.2)]);
      }
      ctx.beginPath(); ctx.moveTo(-size * 0.42 * scale, 0);
      pts.forEach(([x, y], i) => { const [px, py] = pts[i - 1] || [-size * 0.42 * scale, 0]; ctx.quadraticCurveTo(px, py, (px + x) / 2, (py + y) / 2); });
      ctx.quadraticCurveTo(size * 0.45 * scale, -size * 0.1 * scale, size * 0.42 * scale, 0);
      ctx.quadraticCurveTo(0, size * 0.12 * scale, -size * 0.42 * scale, 0);
      const g = ctx.createLinearGradient(0, 0, 0, -size * scale); g.addColorStop(0, c0); g.addColorStop(1, c1);
      ctx.fillStyle = g; ctx.fill();
      return true;
    };
    ctx.save();
    tongue(1.08, '#c4300c', '#7a1a08'); ctx.strokeStyle = 'rgba(70,16,6,0.55)'; ctx.lineWidth = Math.max(2, size * 0.02); ctx.lineJoin = 'round'; ctx.stroke();
    tongue(0.86, '#ff7a14', '#d8400c');
    tongue(0.62, '#ffd23a', '#ff9a1a', 4);
    tongue(0.34, '#fffbe0', '#ffe06a', 3);
    ctx.globalCompositeOperation = 'lighter';
    const b = ctx.createRadialGradient(0, -size * 0.18, 0, 0, -size * 0.18, size * 0.55); b.addColorStop(0, 'rgba(255,200,90,0.45)'); b.addColorStop(1, 'rgba(255,140,40,0)');
    ctx.fillStyle = b; ctx.fillRect(-size * 0.6, -size * 0.8, size * 1.2, size);
    ctx.restore();
  }

  // fire: a dark heat-smoke column behind, the classic flame tongues, additive licking flames, glow and embers.
  paint('fire', (ctx, L, lt, env, P, base) => {
    const n = L.count ?? 5, w = L.w ?? 600, s = L.size ?? 220;
    const smoke = em(L, 'fsmoke', () => ({ preset: 'smoke', id: (L.id ?? 'fire') + 's', w: w * 0.7, oy: -s * 0.9, rate: 2 + n * 0.9, prewarm: true, colors: ['#5a4d43', '#2f2722', '#7c6c5e'], opacity: 0.5, size: [s * 0.45, s * 0.8], speed: 60, gravity: -70 }));
    T.drawParticles(ctx, smoke, lt, { painted: P });
    if (L.glow !== false) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const fl = 1 + 0.06 * Math.sin(lt * 13) + 0.04 * Math.sin(lt * 31), g = ctx.createRadialGradient(0, -s * 0.3, 0, 0, -s * 0.3, w * 0.75 * fl);
      g.addColorStop(0, 'rgba(255,170,60,0.5)'); g.addColorStop(0.5, 'rgba(255,120,30,0.18)'); g.addColorStop(1, 'rgba(255,100,20,0)');
      ctx.fillStyle = g; ctx.fillRect(-w, -s * 2.2, w * 2, s * 3.2); ctx.restore();
    }
    const r = T.rng(T.hash((L.id ?? 'fire') + 'pos')), step = Math.max(1, Math.round(L.step ?? 2));
    for (let i = 0; i < n; i++) { ctx.save(); ctx.translate((n === 1 ? 0 : i / (n - 1) - 0.5) * w, r() * 20); paintedFlame(ctx, s * (0.7 + r() * 0.6), lt + i * 0.07, (L.id ?? 'fire') + i, step); ctx.restore(); }
    const flames = em(L, 'flames', () => ({ preset: 'fire', id: (L.id ?? 'fire') + 'f', w: w * 0.85, oy: -s * 0.15, rate: 14 + n * 9, prewarm: true, size: [s * 0.22, s * 0.4], speed: s * 0.9, gravity: -s * 0.8 }));
    T.drawParticles(ctx, flames, lt, { painted: P });
    if ((L.embers ?? 18) > 0) {
      const emb = em(L, 'embers', () => ({ preset: 'embers', id: (L.id ?? 'fire') + 'e', w: w * 0.8, oy: -s * 0.6, rate: (L.embers ?? 18) / 2, prewarm: true, speed: s * 0.7 }));
      T.drawParticles(ctx, emb, lt, { painted: P });
    }
  });

  // explosion: flash, starburst, fireball puffs over a dark smoke billow, sparks, debris and a shock ring (~2.4 s).
  paint('explosion', (ctx, L, lt, env, P) => {
    const s = L.size ?? 320, id = L.id ?? 'boom';
    const smoke = em(L, 'xsmoke', () => ({ preset: 'smoke', id: id + 's', burst: 16, dir: -90, spread: 360, speed: s * 2, drag: 2.8, gravity: -110, wind: 20, w: s * 0.3, h: s * 0.2, life: 2.6, size: [s * 0.42, s * 0.7], grow: 2.1, colors: ['#5b514a', '#2f2925', '#857767'], opacity: 0.9 }));
    const ball = em(L, 'xball', () => ({ preset: 'smoke', id: id + 'b', burst: 14, dir: -90, spread: 360, speed: s * 2.3, drag: 4.2, gravity: -60, w: s * 0.2, h: s * 0.2, life: 0.95, size: [s * 0.36, s * 0.6], grow: 1.8, colors: ['#ffb43a', '#d2501a', '#ffe98e'], opacity: 1, turb: 10 }));
    const sparks = em(L, 'xsparks', () => ({ preset: 'sparks', id: id + 'k', burst: 34, spread: 360, speed: s * 2.6, gravity: 700, life: 0.8, w: s * 0.2, h: s * 0.2 }));
    const debris = em(L, 'xdebris', () => ({ preset: 'debris', id: id + 'd', burst: 18, speed: s * 2.1, floor: s * 0.75, size: [s * 0.03, s * 0.08], color: hexOr(L.debris, undefined) }));
    T.drawParticles(ctx, smoke, lt - 0.06, { painted: P });
    if (lt < 0.45) { // starburst, the classic toon read
      const p = T.clamp(lt / 0.45), r = s * T.ease.outBack(Math.min(1, p * 3)), rr = T.rng(T.hash(id));
      ctx.save(); ctx.globalAlpha *= 1 - p * p;
      for (const [k, col] of [[1, '#e0500a'], [0.7, '#ff9a00'], [0.42, '#ffe066']]) {
        ctx.fillStyle = col; ctx.beginPath();
        for (let i = 0; i <= 24; i++) { const a = (i / 24) * TAU, q = i % 2 ? r * k * 0.55 : r * k * (0.9 + rr() * 0.2); ctx.lineTo(Math.cos(a) * q, Math.sin(a) * q); }
        ctx.fill();
      }
      ctx.restore();
    }
    T.drawParticles(ctx, ball, lt, { painted: P });
    T.drawParticles(ctx, sparks, lt, { painted: P });
    T.drawParticles(ctx, debris, lt, { painted: P });
    FX.shockwave(ctx, { id: id + 'w', size: s * 1.7, dur: 0.55, rings: 1, painted: L.painted }, lt, env);
    if (lt < 0.12) { // flash
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha *= 1 - lt / 0.12;
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 2.2); g.addColorStop(0, 'rgba(255,250,220,1)'); g.addColorStop(1, 'rgba(255,220,140,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, s * 2.2, 0, TAU); ctx.fill(); ctx.restore();
    }
  });

  // dust: a burst of lit dust puffs rolling up and out (count, color).
  paint('dust', (ctx, L, lt, env, P) => {
    const e = em(L, 'dust', () => ({ preset: 'dust', id: (L.id ?? 'dust') + 'p', burst: Math.round((L.count ?? 9) * 1.6), dir: -90, spread: 190, speed: 360, drag: 2.9, gravity: 40, life: 1.05, w: 50, h: 10, size: [32, 62], grow: 2.1, color: hexOr(L.color, undefined) }));
    T.drawParticles(ctx, e, lt, { painted: P });
  });

  // puff: the swap-cover cloud as multi-tone puffs with a thin ink rim (size, color).
  paint('puff', (ctx, L, lt, env, P) => {
    const p = T.clamp(lt / 0.45), r = T.rng(T.hash(L.id ?? 'puff')), s = L.size ?? 260, tones = T.puffTones(hexOr(L.color, '#efe2c8'));
    const ll = T.lightLocal(ctx, P), lx = Math.round(ll.lx * 4) / 4, ly = Math.round(ll.ly * 4) / 4;
    ctx.save(); ctx.globalAlpha *= p < 0.3 ? 1 : 1 - (p - 0.3) / 0.7;
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * TAU + r(), d = s * (0.2 + p * 0.5), rad = s * (0.28 + r() * 0.16) * (0.6 + p * 0.6), x = Math.cos(a) * d, y = Math.sin(a) * d * 0.7;
      ctx.drawImage(T.puffSprite(tones, lx, ly, i % 4), x - rad * 1.4, y - rad * 1.4, rad * 2.8, rad * 2.8);
    }
    ctx.restore();
  });

  // gas: the creeping cloud front as lit billows (from, dur, h, count, color).
  paint('gas', (ctx, L, lt, env, P) => {
    const dir = L.from === 'left' ? 1 : -1, front = T.ease.inOut(T.prog(lt, 0, L.dur ?? 3)), r = T.rng(T.hash(L.id ?? 'gas'));
    const reach = T.W * 1.3 * front, h = (L.h ?? 220) * (0.6 + front * 0.8), tones = T.puffTones(hexOr(L.color, '#7fae4a'));
    const ll = T.lightLocal(ctx, P), lx = Math.round(ll.lx * 4) / 4, ly = Math.round(ll.ly * 4) / 4, a0 = ctx.globalAlpha;
    for (let i = 0; i < (L.count ?? 26); i++) {
      const u = r(), x = dir < 0 ? T.W / 2 + 200 - u * reach : -T.W / 2 - 200 + u * reach, y = (r() - 0.5) * h + Math.sin(lt * 1.2 + i) * 12, rad = (120 + r() * 140) * 0.75;
      ctx.globalAlpha = a0 * 0.78; ctx.drawImage(T.puffSprite(tones, lx, ly, i % 4), x - rad * 1.4, y - rad * 1.4, rad * 2.8, rad * 2.8);
    }
    ctx.globalAlpha = a0;
  });
})();
