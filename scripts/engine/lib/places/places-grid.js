// places-grid.js — the out-of-bounds void: a perspective grid floor under an empty sky (the "render collapse" of a
// game-world frame story, WW1 30:29: players run on a white wireframe grid). The floor can scroll toward the camera.
(function () {
  'use strict';
  const T = window.TOON, W = T.W, H = T.H, OV = 200;

  // bg.grid: { color '#f4f2ec' (void), line '#2a1c15', accent (one horizontal line colour, e.g. '#d03030'), horizon 0.42,
  //           cells 16 (columns across the near edge), rows 14, speed 0 (rows per second rushing toward the camera),
  //           glow true (a soft band at the horizon) }
  T.bgs.grid = (ctx, bg, lt, env) => {
    const cam = env.cam, hz = (bg.horizon ?? 0.42) * H, col = bg.color ?? '#f4f2ec', line = bg.line ?? '#2a1c15';
    ctx.save();
    if (cam) T.applyCam(ctx, cam, 0.6);
    ctx.fillStyle = col; ctx.fillRect(-OV, -OV, W + 2 * OV, H + 2 * OV);
    if (bg.glow !== false) {
      const g = ctx.createLinearGradient(0, hz - 120, 0, hz + 40);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.8, 'rgba(255,255,255,0.9)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.fillRect(-OV, hz - 120, W + 2 * OV, 160);
    }
    ctx.strokeStyle = line; ctx.lineCap = 'round';
    // converging columns from the horizon vanishing point
    const vx = W / 2, cells = bg.cells ?? 16, span = W * 2.4;
    for (let i = 0; i <= cells; i++) {
      const x = vx - span / 2 + (i / cells) * span;
      ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(vx + (x - vx) * 0.02, hz); ctx.lineTo(x, H + OV); ctx.stroke();
    }
    // rows: spacing grows toward the camera (1 / depth); `speed` scrolls them toward the viewer
    const rows = bg.rows ?? 14, shift = ((lt * (bg.speed ?? 0)) % 1 + 1) % 1;
    for (let k = 0; k < rows + 1; k++) {
      const d = (k + shift) / rows, y = hz + Math.pow(d, 2.2) * (H + OV - hz);
      if (y <= hz + 1) continue;
      ctx.lineWidth = 1.5 + 3 * d; ctx.beginPath(); ctx.moveTo(-OV, y); ctx.lineTo(W + OV, y); ctx.stroke();
    }
    ctx.lineWidth = 4; ctx.strokeStyle = bg.accent ?? line; ctx.beginPath(); ctx.moveTo(-OV, hz); ctx.lineTo(W + OV, hz); ctx.stroke();
    ctx.restore();
  };
})();
