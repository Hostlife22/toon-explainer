// props-everyday.js — everyday explainer props drawn with the painted materials (props-paint.js): scales (balance
// scales), microscope, paintbrush, newspaper and spray-can. Centred at the origin, `size` = height (paintbrush: length).
// The paintbrush, newspaper and spray-can are handheld and stand upright, so a bean `hold` keeps working (holdProps
// passes their fields). Fields: scales tilt (degrees, + = right pan down; number or [{at, v}]), left / right (prop kinds
// in the pans), color; microscope color, light (lamp under the stage), sample (slide colour); paintbrush color
// (handle), paint (tip colour, false = clean); newspaper title, headline (text, \n for lines; absent = grey bars),
// date, photo (false hides), color; spray-can color, label, labelColor, spray (true | seconds | [[from, to], ...]),
// sprayColor, dir (spray direction in degrees, 0 = right).
(function () {
  'use strict';
  const T = window.TOON, P = T.PAL, TAU = Math.PI * 2, D = T.DEG;
  const { words } = T.PROP3;
  const LW = (s) => Math.max(3, s * 0.02);
  const BRASS = '#c99a3a', CHROME = '#c9ced4';
  const ring = (k, x, y, rx, ry) => k.ellipse(x, y, Math.abs(rx), Math.abs(ry), 0, 0, TAU);
  // Thin cord from a to b: ink underlay and a light core.
  const cord = (ctx, s, a, b, col = '#8a7a5a', w = 0.008) => {
    ctx.save(); ctx.lineCap = 'round';
    for (const [c, k] of [[P.ink, 2.2], [col, 1]]) { ctx.strokeStyle = c; ctx.lineWidth = Math.max(1.5, s * w * k); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
    ctx.restore();
  };

  // ---------- scales: brass balance with two hanging pans ----------
  function scales(ctx, s, lt, o) {
    const brass = o.color ?? BRASS, tilt = T.clamp(T.num(o.tilt, lt, 0), -30, 30) * D, py = -s * 0.33, arm = s * 0.4;
    T.matMetal(ctx, (k) => { k.moveTo(-s * 0.2, s * 0.5); k.lineTo(-s * 0.13, s * 0.4); k.lineTo(s * 0.13, s * 0.4); k.lineTo(s * 0.2, s * 0.5); k.closePath(); }, brass, { line: LW(s), axis: 'y' });
    T.matMetal(ctx, (k) => T.rrect(k, -s * 0.24, s * 0.46, s * 0.48, s * 0.05, s * 0.02), T.shade(brass, -0.12), { line: LW(s) });
    T.matMetal(ctx, (k) => k.rect(-s * 0.022, py, s * 0.044, s * 0.42 - py), brass, { line: LW(s) * 0.8 });
    for (const y of [0.02, 0.3]) T.matMetal(ctx, (k) => T.rrect(k, -s * 0.045, s * y, s * 0.09, s * 0.035, s * 0.015), brass, { line: LW(s) * 0.7 });
    const ends = [-1, 1].map((d) => [d * arm * Math.cos(tilt), py + d * arm * Math.sin(tilt)]);
    // pans hang level below the beam ends (strings first, so the bowls cover their lower ends)
    ends.forEach(([ex, ey], i) => {
      const cy = ey + s * 0.36, side = i ? o.right : o.left;
      for (const dx of [-0.15, 0, 0.15]) cord(ctx, s, [ex, ey], [ex + dx * s, cy - (dx ? 0 : s * 0.02)], '#a88a4a', 0.006);
      if (side && T.PROPS[side]) { ctx.save(); ctx.translate(ex, cy - s * 0.07); T.drawProp(ctx, side, s * 0.16, lt, {}); ctx.restore(); }
      T.matMetal(ctx, (k) => { k.moveTo(ex - s * 0.17, cy); k.quadraticCurveTo(ex - s * 0.15, cy + s * 0.09, ex, cy + s * 0.09); k.quadraticCurveTo(ex + s * 0.15, cy + s * 0.09, ex + s * 0.17, cy); k.closePath(); }, brass, { line: LW(s) * 0.8, axis: 'y' });
      T.outlined(ctx, (k) => ring(k, ex, cy, s * 0.17, s * 0.025), T.shade(brass, 0.18), { line: LW(s) * 0.6 });
    });
    ctx.save(); ctx.translate(0, py); ctx.rotate(tilt);
    T.matMetal(ctx, (k) => { k.moveTo(-arm - s * 0.02, -s * 0.008); k.quadraticCurveTo(0, -s * 0.045, arm + s * 0.02, -s * 0.008); k.lineTo(arm + s * 0.02, s * 0.012); k.quadraticCurveTo(0, -s * 0.005, -arm - s * 0.02, s * 0.012); k.closePath(); }, brass, { line: LW(s) * 0.8, axis: 'y' });
    for (const d of [-1, 1]) T.matMetal(ctx, (k) => k.arc(d * arm, 0, s * 0.02, 0, TAU), brass, { line: LW(s) * 0.5 });
    // pointer (needle) pivots with the beam over a small scale arc
    T.matMetal(ctx, (k) => { k.moveTo(-s * 0.008, 0); k.lineTo(0, -s * 0.13); k.lineTo(s * 0.008, 0); k.closePath(); }, T.shade(brass, -0.2), { line: LW(s) * 0.4 });
    ctx.restore();
    T.matMetal(ctx, (k) => k.arc(0, py, s * 0.035, 0, TAU), T.shade(brass, 0.1), { line: LW(s) * 0.7 });
    T.matMetal(ctx, (k) => k.arc(0, py - s * 0.15, s * 0.03, 0, TAU), brass, { line: LW(s) * 0.6 });
  }

  // ---------- microscope: enamel stand, chrome tube, stage with a slide, lamp ----------
  function microscope(ctx, s, lt, o) {
    const body = o.color ?? '#33434f', chrome = CHROME;
    T.outlined(ctx, (k) => { k.moveTo(-s * 0.3, s * 0.5); k.lineTo(-s * 0.26, s * 0.38); k.quadraticCurveTo(0, s * 0.33, s * 0.26, s * 0.38); k.lineTo(s * 0.3, s * 0.5); k.closePath(); }, body, { line: LW(s) });
    T.outlined(ctx, (k) => T.rrect(k, -s * 0.21, s * 0.1, s * 0.09, s * 0.3, s * 0.03), T.shade(body, -0.08), { line: LW(s) });
    // curved arm from the pillar up and over to the tube
    T.outlined(ctx, (k) => { k.moveTo(-s * 0.22, s * 0.14); k.bezierCurveTo(-s * 0.32, -s * 0.06, -s * 0.24, -s * 0.3, -s * 0.02, -s * 0.33); k.lineTo(s * 0.04, -s * 0.24); k.bezierCurveTo(-s * 0.14, -s * 0.2, -s * 0.18, -s * 0.04, -s * 0.1, s * 0.14); k.closePath(); }, body, { line: LW(s) });
    for (const [r, x, y] of [[0.065, -0.16, 0.12], [0.04, -0.16, -0.06]]) { // coarse and fine focus knobs
      T.matMetal(ctx, (k) => k.arc(s * x, s * y, s * r, 0, TAU), chrome, { line: LW(s) * 0.8 });
      ctx.strokeStyle = 'rgba(42,28,21,0.45)'; ctx.lineWidth = Math.max(1, s * 0.005);
      for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; ctx.beginPath(); ctx.moveTo(s * x + Math.cos(a) * s * r * 0.55, s * y + Math.sin(a) * s * r * 0.55); ctx.lineTo(s * x + Math.cos(a) * s * r * 0.9, s * y + Math.sin(a) * s * r * 0.9); ctx.stroke(); }
    }
    // lamp under the stage
    if (o.light !== false) {
      const g = ctx.createRadialGradient(s * 0.1, s * 0.2, 0, s * 0.1, s * 0.2, s * 0.16);
      g.addColorStop(0, 'rgba(255,244,190,0.75)'); g.addColorStop(1, 'rgba(255,230,150,0)');
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(-s * 0.1, 0, s * 0.4, s * 0.4); ctx.restore();
    }
    T.matMetal(ctx, (k) => { k.moveTo(s * 0.02, s * 0.3); k.lineTo(s * 0.04, s * 0.2); k.lineTo(s * 0.16, s * 0.2); k.lineTo(s * 0.18, s * 0.3); k.closePath(); }, chrome, { line: LW(s) * 0.8, axis: 'y' });
    T.outlined(ctx, (k) => ring(k, s * 0.1, s * 0.2, s * 0.055, s * 0.016), o.light === false ? '#8a96a0' : '#fff4c0', { line: LW(s) * 0.5, paint: false });
    // stage, slide and clips
    T.outlined(ctx, (k) => T.rrect(k, -s * 0.1, s * 0.12, s * 0.4, s * 0.045, s * 0.012), T.shade(body, 0.05), { line: LW(s) });
    T.matGlass(ctx, (k) => k.rect(-s * 0.01, s * 0.1, s * 0.24, s * 0.022), { tint: '#cfe8f2', line: LW(s) * 0.5, alpha: 0.8 });
    T.outlined(ctx, (k) => ring(k, s * 0.11, s * 0.111, s * 0.025, s * 0.007), o.sample ?? '#c84a7a', { line: 0, paint: false });
    for (const x of [-0.02, 0.2]) T.matMetal(ctx, (k) => k.rect(s * x, s * 0.095, s * 0.035, s * 0.012), chrome, { line: LW(s) * 0.4 });
    // body tube, eyepiece and the nosepiece with its objectives
    T.matMetal(ctx, (k) => T.rrect(k, s * 0.04, -s * 0.36, s * 0.13, s * 0.3, s * 0.02), chrome, { line: LW(s) });
    ctx.save(); ctx.translate(s * 0.105, -s * 0.36); ctx.rotate(-22 * D);
    T.matMetal(ctx, (k) => T.rrect(k, -s * 0.045, -s * 0.12, s * 0.09, s * 0.13, s * 0.015), chrome, { line: LW(s) * 0.9 });
    T.outlined(ctx, (k) => T.rrect(k, -s * 0.055, -s * 0.15, s * 0.11, s * 0.04, s * 0.012), P.ink, { line: LW(s) * 0.5, paint: false });
    ctx.restore();
    T.outlined(ctx, (k) => { k.moveTo(s * 0.03, -s * 0.06); k.lineTo(s * 0.18, -s * 0.06); k.lineTo(s * 0.16, -s * 0.01); k.lineTo(s * 0.05, -s * 0.01); k.closePath(); }, T.shade(body, 0.12), { line: LW(s) * 0.8 });
    for (const [x, a, l] of [[0.07, 14, 0.07], [0.105, 0, 0.09], [0.14, -14, 0.06]]) {
      ctx.save(); ctx.translate(s * x, -s * 0.01); ctx.rotate(a * D);
      T.matMetal(ctx, (k) => T.rrect(k, -s * 0.018, 0, s * 0.036, s * l, s * 0.008), chrome, { line: LW(s) * 0.5 });
      ctx.restore();
    }
  }

  // ---------- paintbrush: lacquered handle, crimped ferrule, bristles with a paint tip ----------
  function paintbrush(ctx, s, lt, o) {
    const col = o.color ?? '#b8322c', paint = o.paint === false ? null : o.paint ?? '#2f6fb0';
    T.outlined(ctx, (k) => { k.moveTo(-s * 0.035, -s * 0.13); k.quadraticCurveTo(-s * 0.04, s * 0.1, -s * 0.022, s * 0.47); k.quadraticCurveTo(0, s * 0.51, s * 0.022, s * 0.47); k.quadraticCurveTo(s * 0.04, s * 0.1, s * 0.035, -s * 0.13); k.closePath(); }, col, { line: LW(s) * 0.8, shade: (k) => {
      k.strokeStyle = 'rgba(255,255,255,0.55)'; k.lineWidth = s * 0.008; k.lineCap = 'round'; k.beginPath(); k.moveTo(-s * 0.016, -s * 0.08); k.quadraticCurveTo(-s * 0.02, s * 0.12, -s * 0.01, s * 0.4); k.stroke();
    } });
    T.matMetal(ctx, (k) => { k.moveTo(-s * 0.038, -s * 0.12); k.lineTo(-s * 0.042, -s * 0.29); k.lineTo(s * 0.042, -s * 0.29); k.lineTo(s * 0.038, -s * 0.12); k.closePath(); }, CHROME, { line: LW(s) * 0.7, shade: (k) => {
      k.strokeStyle = 'rgba(42,28,21,0.5)'; k.lineWidth = Math.max(1, s * 0.005); for (const y of [-0.15, -0.165]) { k.beginPath(); k.moveTo(-s * 0.05, s * y); k.lineTo(s * 0.05, s * y); k.stroke(); }
    } });
    const tuft = (k) => { k.moveTo(-s * 0.042, -s * 0.28); k.bezierCurveTo(-s * 0.06, -s * 0.36, -s * 0.03, -s * 0.45, 0, -s * 0.5); k.bezierCurveTo(s * 0.03, -s * 0.45, s * 0.06, -s * 0.36, s * 0.042, -s * 0.28); k.closePath(); };
    T.outlined(ctx, tuft, '#d9c39c', { line: LW(s) * 0.7, shade: (k) => {
      if (paint) { k.fillStyle = paint; k.beginPath(); k.moveTo(-s * 0.08, -s * 0.37); k.quadraticCurveTo(0, -s * 0.33, s * 0.08, -s * 0.38); k.lineTo(s * 0.08, -s * 0.55); k.lineTo(-s * 0.08, -s * 0.55); k.closePath(); k.fill(); }
      k.strokeStyle = 'rgba(42,28,21,0.3)'; k.lineWidth = Math.max(1, s * 0.004);
      for (const x of [-0.025, -0.01, 0.006, 0.02]) { k.beginPath(); k.moveTo(s * x, -s * 0.29); k.quadraticCurveTo(s * x * 0.8, -s * 0.4, s * x * 0.2, -s * 0.48); k.stroke(); }
      if (paint) { k.fillStyle = 'rgba(255,255,255,0.45)'; k.beginPath(); k.ellipse(-s * 0.014, -s * 0.42, s * 0.008, s * 0.03, 0.2, 0, TAU); k.fill(); }
    } });
  }

  // ---------- newspaper: folded broadsheet, masthead, headline, photo and columns ----------
  function newspaper(ctx, s, lt, o) {
    const paper = o.color ?? '#efe9da', w = s * 0.72, x0 = -w / 2, y0 = -s / 2, ink = '#2a2622', grey = 'rgba(60,54,48,0.42)';
    T.matPaper(ctx, (k) => k.rect(x0 + s * 0.025, y0 + s * 0.02, w, s), T.shade(paper, -0.12), { line: LW(s) * 0.6, grain: 0.3 }); // the sheet behind
    T.matPaper(ctx, (k) => k.rect(x0, y0, w, s), paper, { line: LW(s) * 0.7, grain: 0.3, fold: 0.52 });
    words(ctx, o.title ?? 'THE DAILY NEWS', 0, y0 + s * 0.075, w * 0.86, s * 0.075, ink, { maxH: s * 0.08 });
    ctx.fillStyle = ink;
    ctx.fillRect(x0 + w * 0.05, y0 + s * 0.125, w * 0.9, Math.max(1.5, s * 0.007)); ctx.fillRect(x0 + w * 0.05, y0 + s * 0.138, w * 0.9, Math.max(1, s * 0.003));
    if (o.date) words(ctx, o.date, 0, y0 + s * 0.158, w * 0.6, s * 0.022, grey, { stroke: 0 });
    let y = y0 + s * 0.18;
    if (o.headline) { words(ctx, o.headline, 0, y + s * 0.09, w * 0.88, s * 0.12, ink, { maxH: s * 0.2 }); y += s * 0.2; }
    else { ctx.fillStyle = 'rgba(42,38,34,0.85)'; ctx.fillRect(x0 + w * 0.06, y + s * 0.02, w * 0.88, s * 0.05); ctx.fillRect(x0 + w * 0.06, y + s * 0.09, w * 0.6, s * 0.05); y += s * 0.17; }
    const cols = 3, gap = w * 0.04, cw = (w * 0.88 - gap * (cols - 1)) / cols;
    for (let c = 0; c < cols; c++) {
      const cx = x0 + w * 0.06 + c * (cw + gap);
      let ly = y + s * 0.02;
      if (c === 0 && o.photo !== false) { // halftone photo with a figure
        const ph = s * 0.2;
        T.outlined(ctx, (k) => k.rect(cx, ly, cw * 2 + gap, ph), '#b8b2a6', { line: Math.max(1.5, s * 0.004), paint: false, shade: (k) => {
          k.fillStyle = 'rgba(60,54,48,0.5)'; k.beginPath(); k.arc(cx + cw * 0.9, ly + ph * 0.42, ph * 0.16, 0, TAU); k.fill();
          k.beginPath(); k.ellipse(cx + cw * 0.9, ly + ph * 1.02, ph * 0.3, ph * 0.42, 0, 0, TAU); k.fill();
          k.fillStyle = 'rgba(255,255,255,0.18)'; for (let i = 0; i < 9; i++) for (let j = 0; j < 5; j++) { k.beginPath(); k.arc(cx + (i + 0.5) * (cw * 2 + gap) / 9, ly + (j + 0.5) * ph / 5, s * 0.004, 0, TAU); k.fill(); }
        } });
      }
      if (c < 2 && o.photo !== false) ly += s * 0.23;
      ctx.fillStyle = grey;
      for (; ly < s / 2 - s * 0.04; ly += s * 0.028) { const short = (Math.round(ly / s * 100) + c * 7) % 9 === 0; ctx.fillRect(cx, ly, short ? cw * 0.6 : cw, Math.max(1, s * 0.009)); }
    }
  }

  // ---------- spray-can: aerosol with a label, actuator and an optional mist ----------
  const sprayOn = (o, lt) => {
    const v = o.spray;
    if (!v) return null;
    if (v === true) return { t0: 0, t1: Infinity };
    const wins = typeof v === 'number' ? [[v, Infinity]] : v;
    let hit = null;
    for (const [a, b] of wins) if (lt >= a) hit = { t0: a, t1: b };
    return hit;
  };
  function sprayCan(ctx, s, lt, o) {
    const col = o.color ?? '#c8323a', w = s * 0.15, win = sprayOn(o, lt), pressing = win && lt <= win.t1;
    const shell = (k) => { k.moveTo(-w, -s * 0.28); k.lineTo(-w, s * 0.44); k.quadraticCurveTo(-w, s * 0.48, -w + s * 0.03, s * 0.48); k.lineTo(w - s * 0.03, s * 0.48); k.quadraticCurveTo(w, s * 0.48, w, s * 0.44); k.lineTo(w, -s * 0.28); k.closePath(); };
    T.matMetal(ctx, shell, col, { line: LW(s) });
    T.outlined(ctx, (k) => k.rect(-w, -s * 0.1, w * 2, s * 0.36), o.labelColor ?? '#f2e8d0', { line: LW(s) * 0.6, shade: (k) => {
      k.fillStyle = T.shade(col, -0.05); k.beginPath(); k.moveTo(-w, s * 0.2); k.quadraticCurveTo(0, s * 0.12, w, s * 0.2); k.lineTo(w, s * 0.26); k.lineTo(-w, s * 0.26); k.closePath(); k.fill();
    } });
    words(ctx, o.label ?? 'SPRAY', 0, s * 0.05, w * 1.7, s * 0.08, T.shade(col, -0.3), { stroke: 0 });
    T.matMetal(ctx, (k) => { k.moveTo(-w, -s * 0.28); k.quadraticCurveTo(-w, -s * 0.37, -s * 0.06, -s * 0.38); k.lineTo(s * 0.06, -s * 0.38); k.quadraticCurveTo(w, -s * 0.37, w, -s * 0.28); k.closePath(); }, CHROME, { line: LW(s) * 0.9, axis: 'y' });
    const dip = pressing ? s * 0.012 : 0;
    T.outlined(ctx, (k) => T.rrect(k, -s * 0.055, -s * 0.45 + dip, s * 0.11, s * 0.075, s * 0.02), '#f4f1ea', { line: LW(s) * 0.8 });
    ctx.fillStyle = P.ink; ctx.beginPath(); ctx.arc(s * 0.045, -s * 0.415 + dip, s * 0.01, 0, TAU); ctx.fill();
    if (!win) return;
    const dir = o.dir ?? -4, mist = T.hex6(o.sprayColor ?? col), dur = Math.max(0.05, win.t1 - win.t0);
    const e = T.emitterOf({ preset: 'steam', id: (o.id ?? 'spray') + ':mist', rate: 70, life: 0.6, dir, spread: 26, speed: s * 2.4, drag: 3, gravity: 0, wind: 0, turb: s * 0.03,
      size: [s * 0.03, s * 0.065], grow: 3.2, w: 2, h: 2, opacity: 0.75, colors: [mist, T.mix(mist, '#1c1420', 0.3), T.mix(mist, '#ffffff', 0.45)], dur: dur === Infinity ? undefined : dur });
    ctx.save(); ctx.translate(s * 0.06, -s * 0.415 + dip); T.drawParticles(ctx, e, lt - win.t0); ctx.restore();
  }

  Object.assign(T.PROPS, { scales, microscope, paintbrush, newspaper, 'spray-can': sprayCan });
  Object.assign(T.PROP_FOOT || (T.PROP_FOOT = {}), { scales: 0.3, microscope: 0.32, 'spray-can': 0.17 });
  Object.assign(T.HOLD_SIZE || (T.HOLD_SIZE = {}), { paintbrush: 150, newspaper: 160, 'spray-can': 110 });
})();
