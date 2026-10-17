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


HOLD = {"seed": 2, "style": {"look": "painted"}, "cast": {"h": {"robe": "#3a6ea5"}},
        "shots": [{"id": "a", "dur": 1, "bg": {"kind": "flat", "color": "#223344"},
                   "layers": [{"type": "bean", "id": "h", "who": "h", "x": 0.5, "y": 0.9, "size": 600,
                               "pose": "drink", "hold": "bottle"}]}]}
GRAB = "async (t)=>{window.renderFrame(t);return window.__canvas.toDataURL('image/png');}"


def _frames(spec: dict, times: list[float]) -> list[str]:
    from playwright.sync_api import sync_playwright
    import render as R

    srv = R.serve(set())
    try:
        with sync_playwright() as pw:
            browser, page, errors = R.open_page(pw, spec, srv.server_address[1], 0.25)
            out = [page.evaluate(GRAB, t) for t in times]
            browser.close()
    finally:
        srv.shutdown()
    assert errors == [], errors
    return out


def test_hold_rot_tilts_the_held_prop_and_validates():
    import copy
    from spec import validate

    tilted = copy.deepcopy(HOLD)
    tilted["shots"][0]["layers"][0]["holdRot"] = [{"at": 0, "v": 0}, {"at": 0.5, "v": -40}]
    assert validate(tilted) == []
    bad = copy.deepcopy(HOLD)
    bad["shots"][0]["layers"][0]["holdRot"] = "tilt"
    assert any("holdRot" in e for e in validate(bad))
    zero = copy.deepcopy(HOLD)
    zero["shots"][0]["layers"][0]["holdRot"] = 0
    plain, z = _frames(HOLD, [0.8])[0], _frames(zero, [0.8])[0]
    assert plain == z  # 0 = the old drawing
    a, b = _frames(tilted, [0.1, 0.8])
    assert a != b and b != plain


SWEEP = """() => {
  const R = window.TOON.RIG, sx = 92, sy = -292, out = [];
  for (const side of [-1, 1]) for (const tx of [150, 192, 230]) {
    let prev = null, worst = 0;
    for (let ty = -340; ty <= -240; ty += 0.5) {
      const j = R.ik(sx * side, sy, tx * side, ty, side);
      if (prev) worst = Math.max(worst, Math.hypot(j.ex - prev.ex, j.ey - prev.ey));
      prev = j;
    }
    out.push({ side, tx, worst });
  }
  return out;
}"""


def test_elbow_moves_continuously_when_the_target_crosses_shoulder_height():
    from playwright.sync_api import sync_playwright
    import render as R

    srv = R.serve(set())
    try:
        with sync_playwright() as pw:
            browser, page, errors = R.open_page(pw, SPEC, srv.server_address[1], 0.25)
            rows = page.evaluate(SWEEP)
            browser.close()
    finally:
        srv.shutdown()
    assert errors == [], errors
    for r in rows:  # a 0.5-unit target step never makes the elbow jump
        assert r["worst"] < 8, r


def test_hold_props_pass_fields_to_the_held_prop():
    import copy
    from spec import validate

    pour = copy.deepcopy(HOLD)
    pour["shots"][0]["layers"][0].update(pose="hold", holdProps={"pour": {"at": 0.2, "dur": 0.4}, "liquid": "#e8f0f2"})
    assert validate(pour) == []
    bad = copy.deepcopy(HOLD)
    bad["shots"][0]["layers"][0]["holdProps"] = "pour"
    assert any("holdProps" in e for e in validate(bad))
    still = copy.deepcopy(HOLD)
    still["shots"][0]["layers"][0]["pose"] = "hold"
    a, b = _frames(pour, [0.1, 0.9])
    (c,) = _frames(still, [0.9])
    assert a != b and b != c  # the held bottle tips and pours


def test_hold_props_grip_the_prop_centre():
    import copy

    a = copy.deepcopy(HOLD)
    a["shots"][0]["layers"][0].update(pose="hold")
    b = copy.deepcopy(a)
    b["shots"][0]["layers"][0]["holdProps"] = {}
    x, y = _frames(a, [0.5])[0], _frames(b, [0.5])[0]
    assert x != y  # the grip point moves from the prop's base to its centre
