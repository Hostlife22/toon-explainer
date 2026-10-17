"""Arm IK: the elbow bends outward (away from the body) for every target, including hands raised to the face."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

SPEC = {"seed": 1, "shots": [{"id": "a", "dur": 1, "bg": {"kind": "flat", "color": "#222222"}, "layers": []}]}

# For each side (-1 left, +1 right) and target, how far the elbow sits outward of the shoulder-to-hand line.
PROBE = """() => {
  const R = window.TOON.RIG, sx = 92, sy = -292, out = [];
  const targets = [[40, -398], [28, -440], [150, -330], [215, -440], [180, -150], [60, -120]];
  for (const side of [-1, 1]) for (const [tx, ty] of targets) {
    const j = R.ik(sx * side, sy, tx * side, ty, side);
    const outwardX = (j.ex - (sx * side + j.hx) / 2) * side;
    out.push({ side, tx, ty, outwardX });
  }
  return out;
}"""


def _probe() -> list[dict]:
    from playwright.sync_api import sync_playwright
    import render as R

    srv = R.serve(set())
    try:
        with sync_playwright() as pw:
            browser, page, errors = R.open_page(pw, SPEC, srv.server_address[1], 0.25)
            res = page.evaluate(PROBE)
            browser.close()
    finally:
        srv.shutdown()
    assert errors == [], errors
    return res


def test_elbow_bends_outward_for_raised_and_lowered_targets():
    for r in _probe():
        # the elbow must not cross to the body side of the line from the shoulder to the hand
        assert r["outwardX"] > -1e-6, r
