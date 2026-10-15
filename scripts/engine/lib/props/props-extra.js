// props-extra.js — claw crane, award rosette, meat on the bone, bucket, meat grinder.
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL, PI = Math.PI, TAU = PI * 2;
  const line = (s) => Math.max(3, s * 0.02);
  const shadow = (color) => T.shade(color, -0.22);
  const shade = (color, x, y, w, h) => (k) => { k.fillStyle = shadow(color); k.fillRect(x, y, w, h); };
  const O = (ctx, s, path, color, tone) => T.outlined(ctx, path, color, { line: line(s), shade: tone });
  const ellipse = (k, x, y, rx, ry) => k.ellipse(x, y, rx, ry, 0, 0, TAU);
  const progress = (t, at, dur) => dur <= 0 ? (t >= at ? 1 : 0) : T.clamp((t - at) / dur);

  function tube(ctx, s, points, width, color) {
    const path = () => { ctx.beginPath(); ctx.moveTo(...points[0]); for (const p of points.slice(1)) ctx.lineTo(...p); };
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const [c, w] of [[P.ink, width + line(s)], [color, width]]) {
      ctx.strokeStyle = c; ctx.lineWidth = w; path(); ctx.stroke();
    }
    ctx.restore();
  }

  // Nested kinds use their normal size/origin convention, centred in the jaws or over the hopper.
  function nested(ctx, kind, s, lt, x, y) {
    ctx.save(); ctx.translate(x, y + (T.PROP_GROUND.has(kind) ? s / 2 : 0));
    try { T.drawProp(ctx, kind, s, lt, {}); } finally { ctx.restore(); }
  }

  function clawCrane(ctx, s, lt, o) {
    // `from` is a fraction of size. No integration/state: seeking backwards gives identical poses.
    const drop = o.drop || {}, at = drop.at ?? 0, dur = drop.dur ?? 0.53;
    const travel = Math.max(0, drop.from ?? 0.6) * s, release = o.releaseAt ?? at + dur;
    const down = T.ease.inOut(progress(lt, at, dur));
    const rise = T.ease.inOut(progress(lt, release, 0.4));
    const released = lt >= release, dy = released ? -travel * rise : -travel * (1 - down);
    const color = o.color ?? '#d0d4dc', open = released ? progress(lt, release, 0.1) : 0;
    // Map the physical canvas top into prop coordinates, including vertical crops, camera and layer transforms.
    const m = ctx.getTransform(), top = m.inverse().transformPoint({ x: m.e, y: 0 });
    tube(ctx, s, [[top.x, top.y], [0, dy - s * 0.34]], s * 0.018, shadow(color));
    if (o.load) nested(ctx, o.load, s * 0.5, lt, 0, released ? 0 : dy);
    ctx.save(); ctx.translate(0, dy);
    O(ctx, s, (k) => T.rrect(k, -s * 0.12, -s * 0.39, s * 0.24, s * 0.16, s * 0.04), color,
      shade(color, 0, -s * 0.4, s, s));
    for (const d of [-1, 1]) {
      // Broad angular fingers read as a mechanical claw even when the load is absent.
      const spread = open * s * 0.15;
      O(ctx, s, (k) => {
        k.moveTo(d * s * 0.08, -s * 0.26); k.lineTo(d * (s * 0.28 + spread), -s * 0.1);
        k.lineTo(d * (s * 0.26 + spread), s * 0.2); k.lineTo(d * (s * 0.12 + spread * 1.5), s * 0.28);
        k.lineTo(d * (s * 0.18 + spread), s * 0.13); k.lineTo(d * (s * 0.19 + spread), -s * 0.06);
        k.lineTo(d * s * 0.04, -s * 0.2); k.closePath();
      }, color, shade(color, -s, s * 0.08, s * 2, s));
      O(ctx, s * 0.6, (k) => k.arc(d * s * 0.075, -s * 0.25, s * 0.035, 0, TAU), '#9aa3ab');
    }
    ctx.restore();
  }

  function rosette(ctx, s, lt, o) {
    const color = o.color ?? '#c8323a', ribbon = o.ribbon ?? o.ribbonColor ?? color;
    // `swing: true` uses the shared layer pendulum; do not apply it twice here.
    for (const d of [-1, 1]) O(ctx, s, (k) => {
      k.moveTo(d * s * 0.03, s * 0.02); k.lineTo(d * s * 0.24, s * 0.02);
      k.lineTo(d * s * 0.29, s * 0.49); k.lineTo(d * s * 0.17, s * 0.42);
      k.lineTo(d * s * 0.08, s * 0.51); k.closePath();
    }, ribbon, shade(ribbon, -s, s * 0.29, s * 2, s));
    O(ctx, s, (k) => {
      for (let i = 0; i < 40; i++) {
        const a = i * TAU / 40, r = s * (i % 2 ? 0.29 : 0.35), x = Math.cos(a) * r, y = -s * 0.12 + Math.sin(a) * r;
        if (i === 0) k.moveTo(x, y); else k.lineTo(x, y);
      }
      k.closePath();
    }, color, shade(color, -s, -s * 0.06, s * 2, s));
    ctx.strokeStyle = shadow(color); ctx.lineWidth = Math.max(2, s * 0.012);
    for (let i = 0; i < 20; i++) {
      const a = i * TAU / 20; ctx.beginPath();
      ctx.moveTo(Math.cos(a) * s * 0.23, -s * 0.12 + Math.sin(a) * s * 0.23);
      ctx.lineTo(Math.cos(a) * s * 0.32, -s * 0.12 + Math.sin(a) * s * 0.32); ctx.stroke();
    }
    O(ctx, s * 0.7, (k) => k.arc(0, -s * 0.12, s * 0.235, 0, TAU), '#f6e8bd',
      shade('#f6e8bd', -s, -s * 0.02, s * 2, s));
    // Explicit \n breaks win; otherwise wrap into the 1-3 balanced lines that allow the biggest letters.
    const raw = String(o.text ?? 'AWARD'), fitLines = (lines) => {
      let f = Math.min(s * 0.12, s * 0.33 / lines.length);
      for (const line of lines) f = Math.min(f, T.fitSize(ctx, line, f, s * 0.39));
      return f;
    };
    const split = (n) => {
      const ws = raw.split(/\s+/).filter(Boolean), per = Math.ceil(ws.length / n), out = [];
      for (let i = 0; i < ws.length; i += per) out.push(ws.slice(i, i + per).join(' '));
      return out;
    };
    const options = raw.includes('\n') ? [raw.split('\n')] : [1, 2, 3].map(split);
    const words = options.reduce((best, opt) => (fitLines(opt) > fitLines(best) ? opt : best), options[0]);
    const fs = fitLines(words);
    ctx.font = T.font(fs); ctx.fillStyle = P.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    words.forEach((word, i) => ctx.fillText(word, 0, -s * 0.12 + (i - (words.length - 1) / 2) * fs * 1.08));
  }

  function meatBone(ctx, s, lt, o) {
    const color = o.color ?? '#c0503a', bone = '#f3e9d3';
    ctx.rotate(-20 * T.DEG);
    O(ctx, s, (k) => {
      k.moveTo(s * 0.05, -s * 0.07); k.lineTo(s * 0.34, -s * 0.07);
      k.bezierCurveTo(s * 0.31, -s * 0.25, s * 0.57, -s * 0.2, s * 0.48, 0);
      k.bezierCurveTo(s * 0.57, s * 0.2, s * 0.31, s * 0.25, s * 0.34, s * 0.07);
      k.lineTo(s * 0.05, s * 0.07); k.closePath();
    }, bone, shade(bone, -s, s * 0.025, s * 2, s));
    O(ctx, s, (k) => {
      k.moveTo(s * 0.17, -s * 0.14); k.bezierCurveTo(-s * 0.02, -s * 0.39, -s * 0.49, -s * 0.35, -s * 0.49, 0);
      k.bezierCurveTo(-s * 0.49, s * 0.35, -s * 0.02, s * 0.39, s * 0.17, s * 0.14); k.closePath();
    }, color, shade(color, -s, s * 0.07, s * 2, s));
    O(ctx, s * 0.65, (k) => ellipse(k, s * 0.12, 0, s * 0.095, s * 0.16), color,
      shade(color, -s, s * 0.04, s * 2, s));
  }

  function bucket(ctx, s, lt, o) {
    const color = o.color ?? '#9aa3ab';
    ctx.rotate((T.num(o.tilt, lt, 0) + (o.upside ? 180 : 0)) * T.DEG);
    // Complete silhouette, including the handle, is centred and one size tall for bean hold/holdL.
    const handle = () => { ctx.beginPath(); ctx.ellipse(0, -s * 0.12, s * 0.32, s * 0.37, 0, PI, TAU); };
    for (const [c, w] of [[P.ink, line(s) + s * 0.025], [color, s * 0.025]]) {
      ctx.strokeStyle = c; ctx.lineWidth = w; handle(); ctx.stroke();
    }
    O(ctx, s, (k) => {
      k.moveTo(-s * 0.36, -s * 0.12); k.lineTo(-s * 0.25, s * 0.42);
      k.quadraticCurveTo(0, s * 0.52, s * 0.25, s * 0.42); k.lineTo(s * 0.36, -s * 0.12); k.closePath();
    }, color, shade(color, s * 0.08, -s, s, s * 2));
    O(ctx, s, (k) => ellipse(k, 0, -s * 0.12, s * 0.36, s * 0.095), color,
      shade(color, -s, -s * 0.12, s * 2, s));
    O(ctx, s * 0.55, (k) => ellipse(k, 0, -s * 0.12, s * 0.28, s * 0.045), shadow(color));
    for (const d of [-1, 1]) O(ctx, s * 0.5, (k) => k.arc(d * s * 0.3, -s * 0.03, s * 0.023, 0, TAU), color);
  }

  // Union windows before measuring active time: overlaps cannot double the crank speed.
  function crankTime(windows, lt) {
    let end = -Infinity, active = 0;
    for (const [a, b] of (windows || []).slice().sort((u, v) => u[0] - v[0])) {
      const start = Math.max(a, end), stop = Math.min(b, lt);
      if (stop > start) active += stop - start;
      end = Math.max(end, b);
    }
    return Math.floor((active + 1e-9) * 15) / 15;
  }

  function sausage(ctx, s, length, color) {
    if (length <= 0) return;
    const r = Math.min(24, s * 0.05), n = Math.max(2, Math.ceil(length / 5));
    const radius = (x) => r * (0.27 + 0.73 * Math.pow(Math.abs(Math.sin(PI * x / 90)), 0.55)) * Math.sqrt(Math.min(1, (length - x) / Math.max(1, r * 0.5)));
    O(ctx, s * 0.6, (k) => {
      k.moveTo(0, -radius(0));
      for (let i = 1; i <= n; i++) { const x = length * i / n; k.lineTo(x, -radius(x)); }
      for (let i = n; i >= 0; i--) { const x = length * i / n; k.lineTo(x, radius(x)); }
      k.closePath();
    }, color, shade(color, 0, 0, length, r));
    ctx.strokeStyle = P.ink; ctx.lineWidth = Math.max(2, s * 0.008);
    for (let x = 90; x < length - 3; x += 90) { ctx.beginPath(); ctx.moveTo(x, -r * 0.35); ctx.lineTo(x, r * 0.35); ctx.stroke(); }
  }

  function meatGrinder(ctx, s, lt, o) {
    const steel = '#9aa3ab', dark = shadow(steel), wood = '#8a5a34';
    // Feet and upright stand use bottom-centre ground origin.
    tube(ctx, s, [[0, -s * 0.52], [0, -s * 0.06]], s * 0.12, steel);
    O(ctx, s, (k) => T.rrect(k, -s * 0.34, -s * 0.09, s * 0.68, s * 0.09, s * 0.025), wood,
      shade(wood, -s, -s * 0.035, s * 2, s));
    const ex = o.extrude;
    if (ex) {
      ctx.save(); ctx.translate(s * 0.43, -s * 0.55);
      sausage(ctx, s, Math.max(0, ex.len ?? 600) * progress(lt, ex.at ?? 0, ex.dur ?? 2), ex.color ?? '#c0503a'); ctx.restore();
    }
    // Clip the input at the hopper mouth: it sinks behind the front wall, then disappears.
    if (o.feed && lt < (o.feedAt ?? 0) + 0.53) {
      const p = progress(lt, o.feedAt ?? 0, 0.53);
      ctx.save(); ctx.beginPath(); ctx.rect(-s, -s * 2, s * 2, s * 1.1); ctx.clip();
      nested(ctx, o.feed, s * 0.3, lt, -s * 0.08, -s * 1.15 + p * s * 0.45); ctx.restore();
    }
    O(ctx, s, (k) => T.rrect(k, -s * 0.36, -s * 0.71, s * 0.7, s * 0.33, s * 0.1), steel,
      shade(steel, -s, -s * 0.53, s * 2, s));
    O(ctx, s, (k) => T.rrect(k, s * 0.28, -s * 0.65, s * 0.18, s * 0.2, s * 0.025), steel,
      shade(steel, -s, -s * 0.54, s * 2, s));
    O(ctx, s * 0.65, (k) => ellipse(k, s * 0.46, -s * 0.55, s * 0.035, s * 0.11), dark);
    O(ctx, s, (k) => {
      k.moveTo(-s * 0.32, -s); k.lineTo(s * 0.18, -s); k.lineTo(s * 0.06, -s * 0.71);
      k.lineTo(-s * 0.21, -s * 0.71); k.closePath();
    }, steel, shade(steel, 0, -s * 1.1, s, s));
    O(ctx, s * 0.7, (k) => ellipse(k, -s * 0.07, -s, s * 0.25, s * 0.055), dark);
    ctx.save(); ctx.translate(-s * 0.29, -s * 0.55); ctx.rotate(crankTime(o.crank, lt) * TAU / 0.6);
    tube(ctx, s, [[0, 0], [-s * 0.18, 0], [-s * 0.18, s * 0.1]], s * 0.04, steel);
    O(ctx, s * 0.7, (k) => T.rrect(k, -s * 0.23, s * 0.04, s * 0.1, s * 0.15, s * 0.035), wood,
      shade(wood, -s * 0.18, 0, s, s));
    ctx.restore();
    O(ctx, s * 0.65, (k) => k.arc(-s * 0.29, -s * 0.55, s * 0.07, 0, TAU), steel,
      shade(steel, -s, -s * 0.55, s * 2, s));
  }

  Object.assign(T.PROPS, { 'claw-crane': clawCrane, rosette, 'meat-bone': meatBone, bucket, 'meat-grinder': meatGrinder });
  T.PROP_GROUND.add('meat-grinder');
})();
