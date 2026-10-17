// camera-moves.js — camera moves on top of core.js and camera-grammar.js: eased zoom / pan keys, `handheld` (layered
// noise), `roll`, `dollyzoom` (the subject plane holds its size while farther planes shrink and nearer ones grow),
// `orbit` (a parallax slide around the subject plane), `angle` (low / high: the horizon planes shift and the subject
// looms or shrinks), the whip-pan motion streak, layer `dist` (parallax and haze from a camera distance) and animating
// characters on twos. All pure functions of shot time; T.CAM_EXT plugs them into T.cameraAt.
(function () {
  'use strict';
  const T = window.TOON, W = T.W, H = T.H, DEG = T.DEG;

  // ---------- eased keys ----------
  // [{at, v, ease}] (v a number or [x, y]); each segment eases with the later key's ease (default inOut).
  T.CAM_KEYS = (keys, lt) => {
    const val = (k) => k.v;
    const mix = (a, b, p) => (Array.isArray(a) ? a.map((x, i) => T.lerp(x, b[i], p)) : T.lerp(a, b, p));
    if (lt <= (keys[0].at ?? 0)) return val(keys[0]);
    for (let i = 1; i < keys.length; i++) {
      const a = keys[i - 1], b = keys[i];
      if (lt < (b.at ?? 0)) return mix(val(a), val(b), T.easeBy(b.ease || 'inOut')(T.prog(lt, a.at ?? 0, (b.at ?? 0) - (a.at ?? 0))));
    }
    return val(keys[keys.length - 1]);
  };
  const keyed = (v) => Array.isArray(v) && v.length > 0 && v[0] && typeof v[0] === 'object' && !Array.isArray(v[0]);
  const numOrKeys = (v, lt, def = 0) => (v == null ? def : typeof v === 'number' ? v : keyed(v) ? T.CAM_KEYS(v, lt) : def);
  const win = (o, lt, dur) => T.easeBy(o.ease || 'inOut')(T.prog(lt, o.at ?? 0, o.dur ?? dur));

  // ---------- handheld ----------
  // Three octaves of seeded value noise per axis (0.62 / 0.28 / 0.1 of the amplitude): bounded by amp, pure in t.
  const HH = [[1, 0.62], [2.7, 0.28], [6.1, 0.1]];
  function handheld(o, lt) {
    const h = o === true ? {} : typeof o === 'number' ? { amp: o } : o;
    let env = 1;
    if (h.at != null || h.dur != null) {
      const a = h.at ?? 0, d = h.dur ?? Infinity, fade = 0.25;
      if (lt < a || lt > a + d) return null;
      env = Math.min(1, (lt - a) / fade, Number.isFinite(d) ? (a + d - lt) / fade : 1);
    }
    const hz = h.hz ?? 0.55, oct = (seed) => HH.reduce((s, [m, w]) => s + w * T.noise(lt * hz * m + m * 3.1, 'hh' + seed + m), 0);
    return { x: (h.amp ?? 6) * env * oct('x'), y: (h.amp ?? 6) * env * oct('y') * 0.8, r: (h.rot ?? 0.3) * env * oct('r') * DEG };
  }

  T.ANGLES = { low: 1, high: -1, eye: 0 };
  T.CAM_EXT = {
    wants: (c) => !!(c.frame || c.follow || c.handheld || c.dollyzoom || c.orbit || c.roll != null || c.angle != null),
    apply: (out, c, lt, dur, shot, zMul) => {
      let cam = T.frameCamera ? T.frameCamera(out, c, lt, dur, shot, zMul) : out;
      if (c.handheld) { const h = handheld(c.handheld, lt); if (h) cam = { ...cam, sx: cam.sx + h.x, sy: cam.sy + h.y, rot: cam.rot + h.r }; }
      if (c.roll != null) cam = { ...cam, rot: cam.rot + numOrKeys(c.roll, lt) * DEG };
      const ext = {};
      if (c.dollyzoom) {
        const d = c.dollyzoom, amt = (d.amount ?? 0.35) * win(d, lt, dur);
        if (amt) {
          ext.dz = amt;
          const p = d.target && shot && T.targetPoint ? T.targetPoint(shot, d.target, lt) : null;
          ext.dzc = p ? [cam.fx + cam.z * (p.x - cam.fx - cam.px), cam.fy + cam.z * (p.y - cam.fy - cam.py)] : [cam.fx, cam.fy];
        }
      }
      if (c.orbit) { const o = (c.orbit.amount ?? 160) * win(c.orbit, lt, dur); if (o) ext.ob = o; }
      if (c.angle != null) {
        const a = typeof c.angle === 'string' ? T.ANGLES[c.angle] ?? 0 : numOrKeys(c.angle, lt);
        if (a) ext.ang = T.clamp(a, -1, 1);
      }
      return Object.keys(ext).length ? { ...cam, ext } : cam;
    },
  };

  // Plane transform with the extra moves. Screen point = orbit + angle(dolly(core camera(world point))).
  T.applyCamExt = (ctx, cam, f) => {
    const e = cam.ext, z = T.planeZoom(cam, f);
    if (e.ob) ctx.translate(e.ob * (f - 1), 0);
    if (e.ang) { // low angle (+): far planes drop (lower horizon), near planes rise and loom; high angle the reverse
      const a = e.ang, fc = T.clamp(f, 0, 2), ky = 1 + a * 0.06 * (fc - 0.4);
      ctx.translate(0, a * H * 0.11 * (1 - fc));
      ctx.translate(0, H); ctx.scale(1, ky); ctx.translate(0, -H);
    }
    // a far plane shrinks at most into its painted margins (no black edges): its scale stays >= 0.8 / its own zoom
    if (e.dz) { const m = Math.max(Math.pow(1 + e.dz, f - 1), f < 1 ? 0.8 / z : 0); ctx.translate(e.dzc[0], e.dzc[1]); ctx.scale(m, m); ctx.translate(-e.dzc[0], -e.dzc[1]); }
    ctx.translate(cam.fx + cam.sx, cam.fy + cam.sy);
    ctx.rotate(cam.rot * f);
    ctx.scale(z, z);
    ctx.translate(-cam.fx - cam.px * f, -cam.fy - cam.py * f);
  };

  // ---------- whip streak ----------
  // Directional motion blur over the finished layers: offset copies of the frame along the content's motion.
  T.camStreak = (ctx, cam, env) => {
    const [vx, vy] = cam.streak, n = 12, k = env.dpr || 1, cv = ctx.canvas;
    const [c, g] = T.scratch('cam-streak', cv.width, cv.height);
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height); g.drawImage(cv, 0, 0);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (let i = 1; i <= n; i++) {
      const s = i / n;
      ctx.globalAlpha = 0.42 / (i * 0.6 + 0.6);
      ctx.drawImage(c, -vx * s * 1.2 * k, -vy * s * 1.2 * k);
    }
    ctx.restore();
  };

  // ---------- layer dist: parallax 1 / dist (core T.layerZ) and atmospheric haze for far layers ----------
  T.distLayer = (L) => (L.dist > 1 && L.atmos == null ? { ...L, atmos: T.clamp((L.dist - 1) * 0.2, 0, 0.6) } : L);

  // ---------- on twos ----------
  // style.onTwos / shot.onTwos (true = 12 fps, or a rate) samples character layers on a coarser clock while the camera
  // and everything else stay on ones; a layer's own onTwos (true, false or a rate) wins.
  T.TWOS_TYPES = new Set(['bean', 'crowd', 'creature', 'obj', 'arm']);
  T.twosLt = (L, lt, shot, env) => {
    if (L.onTwos === false) return lt;
    const rate = L.onTwos != null ? L.onTwos : T.TWOS_TYPES.has(L.type) ? shot.onTwos ?? (env.style && env.style.onTwos) : null;
    if (!rate) return lt;
    const fps = rate === true ? 12 : rate;
    return Math.floor(lt * fps + 1e-6) / fps;
  };
})();
