// props-extra.js — claw crane, award rosette, meat on the bone, bucket, meat grinder, cobweb, banana peel, region.
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


  // ---------- cobweb: a web strung across one corner of the prop's box ----------
  // { corner 'tl' | 'tr' | 'bl' | 'br', color '#eef0f2', spider false } — reference: a storehouse re-used later in a
  // changed state, its door covered in cobwebs (siege short 0:32). Size = the side of the corner box.
  function cobweb(ctx, s, lt, o) {
    const corner = o.corner ?? 'tl', col = o.color ?? '#eef0f2';
    if (!['tl', 'tr', 'bl', 'br'].includes(corner)) throw new Error(`cobweb corner must be tl, tr, bl or br (got ${JSON.stringify(corner)})`);
    ctx.save();
    ctx.translate(corner.includes('l') ? -s / 2 : s / 2, corner[0] === 't' ? -s / 2 : s / 2);
    ctx.scale(corner.includes('l') ? 1 : -1, corner[0] === 't' ? 1 : -1); // draw for the top-left corner
    const spokes = 6, rings = 5, ang = (i) => (i / (spokes - 1)) * (PI / 2), R = s;
    const pt = (i, r) => [Math.cos(ang(i)) * r, Math.sin(ang(i)) * r];
    const web = (k) => {
      for (let i = 0; i < spokes; i++) { const [x, y] = pt(i, R); k.moveTo(0, 0); k.lineTo(x, y); }
      for (let j = 1; j <= rings; j++) {
        const r = (j / rings) * R * 0.92;
        for (let i = 0; i < spokes - 1; i++) { // each strand sags toward the corner between two spokes
          const [x0, y0] = pt(i, r), [x1, y1] = pt(i + 1, r), [mx, my] = pt(i + 0.5, r * 0.82);
          if (i === 0) k.moveTo(x0, y0);
          k.quadraticCurveTo(mx, my, x1, y1);
        }
      }
    };
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const [c, w, a] of [[P.ink, Math.max(3, s * 0.012), 0.35], [col, Math.max(2, s * 0.007), 0.95]]) {
      ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); web(ctx); ctx.stroke(); ctx.restore();
    }
    if (o.spider) { // a spider hangs on a thread from the middle of the web and bobs slowly
      const [ax, ay] = pt(2.5, R * 0.55), drop = s * (0.32 + 0.04 * Math.sin(lt * 2.4));
      ctx.strokeStyle = col; ctx.lineWidth = Math.max(2, s * 0.006); ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax, ay + drop); ctx.stroke();
      ctx.save(); ctx.translate(ax, ay + drop); ctx.scale(corner[0] === 't' ? 1 : -1, 1);
      const b = s * 0.05;
      ctx.strokeStyle = P.ink; ctx.lineWidth = Math.max(2, b * 0.18);
      for (const sd of [-1, 1]) for (let l = 0; l < 3; l++) { ctx.beginPath(); ctx.moveTo(0, b * (l - 1) * 0.5); ctx.quadraticCurveTo(sd * b * 1.4, b * (l - 1.6) * 0.6, sd * b * 1.6, b * (l - 0.6)); ctx.stroke(); }
      O(ctx, b * 4, (k) => ellipse(k, 0, 0, b * 0.7, b * 0.85), '#2a2026');
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(-b * 0.25, -b * 0.2, b * 0.16, 0, TAU); ctx.arc(b * 0.25, -b * 0.2, b * 0.16, 0, TAU); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  // ---------- banana-peel: a peel lying on the floor (ground prop: origin at the bottom centre) ----------
  // { color '#f2d23a' } — reference: the hazard is on the floor before the victim walks in (Rome 28:05).
  function bananaPeel(ctx, s, lt, o) {
    const col = o.color ?? '#f2d23a', inner = '#fbf1c4', brown = '#7a5230';
    ctx.fillStyle = 'rgba(42,28,21,0.22)'; ctx.beginPath(); ellipse(ctx, 0, -s * 0.01, s * 0.5, s * 0.08); ctx.fill();
    // three wide flaps splayed on the floor around a short standing core with a brown stem
    const flap = (ang, len) => (k) => {
      const c = Math.cos(ang), sn = Math.sin(ang), w = s * 0.16, tx = c * len, ty = -s * 0.04 + sn * len * 0.25;
      k.moveTo(-w * 0.55, -s * 0.16);
      k.quadraticCurveTo(tx * 0.45 - w * 0.4, -s * 0.2 + sn * len * 0.1, tx, ty - s * 0.03);
      k.quadraticCurveTo(tx * 1.02, ty + s * 0.03, tx * 0.9, ty + s * 0.035);
      k.quadraticCurveTo(tx * 0.45 + w * 0.3, -s * 0.02 + sn * len * 0.1, w * 0.55, -s * 0.08); k.closePath();
    };
    for (const [ang, len] of [[PI, s * 0.46], [0, s * 0.46], [PI * 0.5, s * 0.22]]) {
      O(ctx, s, flap(ang, len), col, (k) => { k.fillStyle = shadow(col); k.fillRect(-s, -s * 0.06, s * 2, s * 0.12); });
    }
    O(ctx, s, (k) => { k.moveTo(-s * 0.1, -s * 0.12); k.quadraticCurveTo(0, -s * 0.2, s * 0.1, -s * 0.12); k.quadraticCurveTo(0, -s * 0.06, -s * 0.1, -s * 0.12); k.closePath(); }, inner);
    O(ctx, s, (k) => T.rrect(k, -s * 0.05, -s * 0.36, s * 0.1, s * 0.24, s * 0.04), col, shade(col, s * 0.01, -s, s, s * 2));
    O(ctx, s * 0.8, (k) => T.rrect(k, -s * 0.035, -s * 0.41, s * 0.07, s * 0.07, s * 0.015), brown);
  }

  // ---------- region: a territory shape as a standalone object ----------
  // { pts [[x, y], ...] in -0.5..0.5 of size (default: a blob), color '#d9a54a', outline true, shade true, face
  //   (a mood string or {mood, accessory} like map region faces), label, labelSize } — layer modifiers such as
  //   material: 'gold' | 'stone', move steps and swap apply as on any layer.
  const BLOB = [[-0.42, -0.1], [-0.3, -0.36], [0.02, -0.42], [0.3, -0.3], [0.44, -0.02], [0.32, 0.3], [0.02, 0.42], [-0.3, 0.32], [-0.46, 0.12]];
  function region(ctx, s, lt, o) {
    const raw = Array.isArray(o.pts) && o.pts.length >= 3 ? o.pts : BLOB, col = o.color ?? '#d9a54a';
    // a coastline: every edge gets two seeded wobble points pushed in or out (o.rough 0..1, default 0.6)
    const rnd = T.rng(T.hash('region:' + (o.seed ?? JSON.stringify(raw)))), rough = (o.rough ?? 0.6) * s * 0.05, pts = [];
    raw.forEach(([x, y], i) => {
      const [nx, ny] = raw[(i + 1) % raw.length], ex = (nx - x) * s, ey = (ny - y) * s, len = Math.hypot(ex, ey) || 1;
      pts.push([x * s, y * s]);
      for (const f of [1 / 3, 2 / 3]) { const d = (rnd() - 0.5) * 2 * rough; pts.push([x * s + ex * f - (ey / len) * d, y * s + ey * f + (ex / len) * d]); }
    });
    const n = pts.length;
    const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const path = (k) => { // smooth closed curve through the midpoints, the points act as controls
      const m0 = mid(pts[n - 1], pts[0]); k.moveTo(m0[0], m0[1]);
      for (let i = 0; i < n; i++) { const m = mid(pts[i], pts[(i + 1) % n]); k.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]); }
      k.closePath();
    };
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const tone = o.shade === false ? null : (k) => { // one flat shadow tone: a rim on the lower-right edge (shape minus itself shifted up-left)
      k.save(); k.beginPath(); path(k); k.clip(); k.translate(-s * 0.05, -s * 0.06); k.fillStyle = shadow(col); k.beginPath();
      k.rect(minX - s, minY - s, (maxX - minX) + 2 * s, (maxY - minY) + 2 * s); path(k); k.fill('evenodd'); k.restore();
    };
    if (o.outline === false) { ctx.fillStyle = col; ctx.beginPath(); path(ctx); ctx.fill(); if (tone) tone(ctx); }
    else T.outlined(ctx, path, col, { line: Math.max(4, s * 0.018), shade: tone });
    if (o.face && T.regionFace) {
      const F = typeof o.face === 'string' ? { mood: o.face } : o.face;
      T.regionFace(ctx, (minX + maxX) / 2, (minY + maxY) / 2 - (o.label ? s * 0.1 : 0), Math.min(maxX - minX, maxY - minY) * (F.scale ?? (o.label ? 0.3 : 0.36)), F, lt);
    }
    if (o.label) {
      const size = o.labelSize ?? Math.max(28, s * 0.12);
      T.toonText(ctx, String(o.label).toUpperCase(), (minX + maxX) / 2, (minY + maxY) / 2 + (o.face ? s * 0.26 : size * 0.35), { size, fill: '#ffffff' });
    }
  }

  Object.assign(T.PROPS, { 'claw-crane': clawCrane, rosette, 'meat-bone': meatBone, bucket, 'meat-grinder': meatGrinder, cobweb, 'banana-peel': bananaPeel, region });
  T.PROP_GROUND.add('meat-grinder');
  T.PROP_GROUND.add('banana-peel');
})();
