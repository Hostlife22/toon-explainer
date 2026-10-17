"""Held props (grip.js): the fist closes on each prop's grip point (a pole runs through it, a sign is held by its stick,
a mug by its handle), a near hand's prop draws over the head instead of sinking into it, a prop that would cover the
eyes or the mouth is tilted, moved out or lowered, a prop behind the body stays behind it, and the measured prop shapes
never depend on render order."""
from __future__ import annotations

import base64
import io
import sys
from pathlib import Path

import numpy as np
import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from spec import validate  # noqa: E402

GRAB = "async (t)=>{window.renderFrame(t);return window.__canvas.toDataURL('image/png');}"
PROBE = ("(t) => { TOON.RIG_PROBE = {}; window.renderFrame(t); const p = TOON.RIG_PROBE; TOON.RIG_PROBE = null; "
         "return JSON.parse(JSON.stringify(p)); }")
SCALE = 0.5
X, Y, SIZE = 0.5, 0.95, 520
K = SIZE / 600  # world px per rig unit
# eyes, brows and mouth in rig units per view (grip.js T.faceBox for the adult build), shrunk by a margin
# eyes (y -458) and mouth (y -382) in rig units per view (face.js), checked through boxes around each
EYES = {"front": (-52, 52), "3q": (-4, 76), "side": (81,)}
MOUTH = {"front": 0, "3q": 46, "side": 89}
BG = np.array([0xe8, 0xdc, 0xc0])


def _bean(**kw) -> dict:
    out = {"type": "bean", "id": "b", "x": X, "y": Y, "size": SIZE, "pose": "hold", "view": "3q", "rock": 0}
    out.update(kw)
    return out


def _spec(shots_layers, look="painted") -> dict:
    shots = [{"id": f"s{i}", "dur": 1, "bg": {"kind": "flat", "color": "#e8dcc0"}, "layers": ly}
             for i, ly in enumerate(shots_layers)]
    spec = {"seed": 4, "style": {"look": look} if look else {}, "shots": shots}
    assert validate(spec) == [], validate(spec)
    return spec


def _grab(page, t: float, probe: bool):
    from PIL import Image

    url = page.evaluate(GRAB, t)
    img = np.asarray(Image.open(io.BytesIO(base64.b64decode(url.split(",", 1)[1]))).convert("RGB")).astype(int)
    return img, page.evaluate(PROBE, t) if probe else None


def _session(fn):
    from playwright.sync_api import sync_playwright
    import render as R

    srv = R.serve(set())
    try:
        with sync_playwright() as pw:
            return fn(lambda spec: R.open_page(pw, spec, srv.server_address[1], SCALE))
    finally:
        srv.shutdown()


def _render(spec: dict, times: list[float], probe: bool = False):
    """Frames of one spec in one page (shots differ in their paper grain: compare frames of one shot id)."""
    def run(open_page):
        browser, page, errors = open_page(spec)
        out = [_grab(page, t, probe) for t in times]
        browser.close()
        assert errors == [], errors
        return out
    return _session(run)


def _each(layer_sets, look="painted", probe: bool = False):
    """Each layer set alone in the same one-shot spec, so frames compare pixel for pixel."""
    def run(open_page):
        out = []
        for layers in layer_sets:
            browser, page, errors = open_page(_spec([layers], look))
            out.append(_grab(page, 0.5, probe))
            browser.close()
            assert errors == [], errors
        return out
    return _session(run)


def _px(u: float, v: float) -> tuple[int, int]:
    """Rig units of the test bean (facing right) -> image pixels."""
    return int((X * 1920 + u * K) * SCALE), int((Y * 1080 + v * K) * SCALE)


def _rig_box(img, u0, v0, u1, v1):
    (x0, y0), (x1, y1) = _px(u0, v0), _px(u1, v1)
    return img[y0:y1, x0:x1]


def _face(img, view):
    """Eyes, brows and mouth of the test bean, as one strip of pixels."""
    boxes = [(x - 26, -500, x + 26, -432) for x in EYES[view]] + [(MOUTH[view] - 30, -398, MOUTH[view] + 30, -368)]
    return np.concatenate([_rig_box(img, *b).reshape(-1, 3) for b in boxes])


# ---------- the fist closes on the prop's grip point ----------
GRIP_CASES = [("flag", "3q"), ("placard", "3q"), ("broom", "front"), ("axe", "side"), ("mug", "3q"), ("newspaper", "3q"),
              ("scroll", "front"), ("moneybag", "3q"), ("coin", "3q"), ("sword", "3q"), ("spear", "3q"), ("pistol", "side")]


@pytest.fixture(scope="module")
def grips():
    layers = [[_bean(hold=p, view=v)] for p, v in GRIP_CASES]
    spec = _spec(layers)
    return _render(spec, [i + 0.5 for i in range(len(layers))], probe=True)


@pytest.mark.parametrize("i", range(len(GRIP_CASES)), ids=[f"{p}-{v}" for p, v in GRIP_CASES])
def test_the_drawn_grip_point_sits_in_the_palm(grips, i):
    prop, _ = GRIP_CASES[i]
    probe = grips[i][1]["b"]
    g = probe["grips"][1]
    assert g and g["hold"] == prop, probe.get("grips")
    assert np.hypot(g["grip"][0] - g["palm"][0], g["grip"][1] - g["palm"][1]) < 1.0, g
    wrist = probe["hands"][1]
    assert np.hypot(g["palm"][0] - wrist[0], g["palm"][1] - wrist[1]) < 40 * K, "the grip is at the hand"


def test_holding_hands_close_on_the_prop():
    """A pose's open / pointing hand would pass its fingers through the prop: holding, it closes (a coin is pinched);
    an explicit `hand` still wins."""
    layers = [[_bean(pose="present", hold="placard")], [_bean(pose="point", hold="coin")],
              [_bean(pose="present", hold="placard", hand="open")]]
    shots = _render(_spec(layers), [0.5, 1.5, 2.5], probe=True)
    assert shots[0][1]["b"]["handShapes"][1] == "fist"
    assert shots[1][1]["b"]["handShapes"][1] == "pinch"
    assert shots[2][1]["b"]["handShapes"][1] == "open"


@pytest.mark.parametrize("prop", ["flag", "placard"])
def test_a_pole_runs_through_the_fist(prop):
    """The pole or stick continues below the fist (the classic placement hung a flag's pole bottom on top of it)."""
    (empty, _), (held, probe) = _each([[_bean(view="front")], [_bean(view="front", hold=prop)]], probe=True)
    px, py = probe["b"]["grips"][1]["palm"]
    r = 27 * K  # fist radius in world px
    x0, x1 = int((px - r * 0.5) * SCALE), int((px + r * 0.5) * SCALE)
    below = slice(int((py + r * 1.15) * SCALE), int((py + r * 1.6) * SCALE))
    assert np.abs(held[below, x0:x1] - empty[below, x0:x1]).mean() > 8, f"the {prop} shows below the fist"


# ---------- face clearance and draw order ----------
TALL = ["placard", "flag", "white-flag", "broom", "axe", "pitchfork", "newspaper", "rifle", "spear", "mug"]


@pytest.mark.parametrize("look", ["painted", None])
@pytest.mark.parametrize("view", ["front", "3q", "side"])
def test_tall_held_props_keep_the_eyes_and_mouth_clear(view, look):
    layers = [[_bean(view=view)]] + [[_bean(view=view, hold=p)] for p in TALL]
    frames = [r[0] for r in _each(layers, look)]
    bad = {p: round(float(np.abs(_face(f, view) - _face(frames[0], view)).mean()), 2) for p, f in zip(TALL, frames[1:])}
    assert all(v < 2.0 for v in bad.values()), f"props over the face: {bad}"


@pytest.mark.parametrize("pose", ["think", "beg", "wave", "point-up"])
def test_poses_near_the_face_keep_a_big_prop_off_it(pose):
    """A pose whose hand passes the face (think, beg, wave) does not press a placard or a newspaper over it; eat,
    drink and phone-ear still bring a hand-sized prop to the face on purpose."""
    # references: the same pose without arms (a fitted hand leaves the face with its prop) and with its empty fist (a
    # hand the pose itself puts beside the eyes, as in wave)
    layers = [[_bean(pose=pose, look={"arms": False})], [_bean(pose=pose, hand="fist")],
              [_bean(pose=pose, hold="placard")], [_bean(pose=pose, hold="newspaper")]]
    bare, fist, *held = (r[0] for r in _each(layers))
    for name, f in zip(["placard", "newspaper"], held):
        d = min(np.abs(_face(f, "3q") - _face(ref, "3q")).mean() for ref in (bare, fist))
        assert d < 3.0, f"{name} over the face in {pose}: {d:.1f}"


def test_eat_brings_a_small_prop_to_the_mouth():
    layers = [[_bean(pose="eat", hand="fist")], [_bean(pose="eat", hold="bread")]]
    empty, held = (r[0] for r in _each(layers))
    assert np.abs(_face(held, "3q") - _face(empty, "3q")).mean() > 3.0, "the bread goes to the mouth"


@pytest.mark.parametrize("prop,look", [("flag", "painted"), ("spear", "painted"), ("pitchfork", "painted"), ("spear", None)])
def test_a_near_hands_prop_draws_over_the_head(prop, look):
    """Where a held pole crosses the head beside the face, the pole is in front: the head no longer hides it."""
    layers = [[_bean(view="front")], [_bean(view="front", hold=prop)]]
    empty, held = (r[0] for r in _each(layers, look))
    head_side = _rig_box(empty, 90, -560, 150, -360)
    is_head = np.abs(head_side - BG).sum(-1) > 60  # head pixels (not background)
    changed = np.abs(_rig_box(held, 90, -560, 150, -360) - head_side).sum(-1) > 60
    assert (changed & is_head).sum() > 40, f"the {prop} shows over the side of the head"


@pytest.mark.parametrize("case", [dict(view="3q", holdL="placard"), dict(view="3q", holdL="book"),
                                  dict(view="3q-back", hold="placard"), dict(view="back", hold="book")],
                         ids=["3q-left-placard", "3q-left-book", "3q-back-placard", "back-book"])
def test_props_behind_the_body_stay_behind_it(case):
    # reference: the same pose without the prop; in 3/4 back without arms (the holding arm goes behind the back)
    ref = _bean(view=case["view"], look={"arms": False}) if case["view"] == "3q-back" else _bean(view=case["view"])
    layers = [[ref], [_bean(**case)]]
    empty, held = (r[0] for r in _each(layers))
    torso = (-70, -280, 70, -120)
    assert np.abs(_rig_box(held, *torso) - _rig_box(empty, *torso)).mean() < 1.5, "the prop is hidden by the body"


# ---------- tables and determinism ----------
def test_grip_table_names_real_props_and_covers_the_held_sizes():
    js = """() => ({ grips: Object.keys(TOON.HOLD_GRIP), props: Object.keys(TOON.PROPS), sizes: Object.keys(TOON.HOLD_SIZE),
      hands: Object.values(TOON.HOLD_GRIP).map((e) => e.hand || 'fist'), known: Object.keys(TOON.HANDS) })"""
    def run(open_page):
        browser, page, _ = open_page(_spec([[]]))
        d = page.evaluate(js)
        browser.close()
        return d
    d = _session(run)
    assert set(d["grips"]) <= set(d["props"]), set(d["grips"]) - set(d["props"])
    assert set(d["sizes"]) <= set(d["grips"]), set(d["sizes"]) - set(d["grips"])
    assert set(d["hands"]) <= set(d["known"])


def test_prop_shapes_do_not_depend_on_render_order():
    layers = [[_bean(hold="placard", view="front")], [_bean(hold="placard", pose="present"), _bean(id="c", x=0.2, hold="flag")]]
    spec = _spec(layers)
    alone = _render(spec, [1.5])[0][0]
    after = _render(spec, [0.5, 1.5])[1][0]
    assert np.array_equal(alone, after)
