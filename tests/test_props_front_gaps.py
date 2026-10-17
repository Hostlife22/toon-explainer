"""Engine gaps, props and front pass: held props get a natural size, ground fx slot among set front parts by depth,
and front parts come from every visible background (several sets, a parts-only set over a landscape, `frontY` planes)."""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
sys.path.insert(0, str(ROOT / "tests"))

from spec import validate  # noqa: E402
from test_places_props_backlog import COURT, DESK_BOX, HEAD_BOX, JUDGE, _diff, _frames, _spec  # noqa: E402


def _shot(layers, bg=None, look="painted"):
    return _spec([{"id": "s", "dur": 2, "bg": bg or COURT, "layers": layers}], look=look)


def _one(layers, bg=None, look="painted"):
    spec = _shot(layers, bg, look)
    assert validate(spec) == [], validate(spec)
    return _frames(spec, [1.0])[0]


# ---------- held props: natural size ----------
HOLDER = {"type": "bean", "x": 0.5, "y": 0.92, "size": 520, "pose": "hold", "view": "3q"}
HAND_BOX = (0.36, 0.3, 0.72, 0.95)
NATURAL = {"newspaper": 280, "paintbrush": 250, "scales": 270, "microscope": 260, "spray-can": 190, "rope": 230,
           "broom": 330, "shovel": 320, "placard": 260}


@pytest.mark.parametrize("prop", ["newspaper", "paintbrush", "scales", "microscope", "spray-can", "rope", "broom"])
def test_held_prop_draws_at_its_natural_size(prop):
    plain = _one([{**HOLDER, "hold": prop}])
    natural = _one([{**HOLDER, "hold": prop, "holdScale": NATURAL[prop] / 170}])
    classic_size = _one([{**HOLDER, "hold": prop, "holdScale": 1}])
    assert _diff(plain, natural, HAND_BOX) < 0.005, "without holdScale the prop takes its natural held size"
    assert _diff(plain, classic_size, HAND_BOX) > 0.03, "the natural size is larger than the old default 170"


def test_classic_look_keeps_the_default_held_size():
    plain = _one([{**HOLDER, "hold": "newspaper"}], look=None)
    old = _one([{**HOLDER, "hold": "newspaper", "holdScale": 1}], look=None)
    assert _diff(plain, old, HAND_BOX) < 0.005


def test_explicit_hold_scale_still_scales_the_classic_size():
    a = _one([{**HOLDER, "hold": "newspaper", "holdScale": 1.5}])
    b = _one([{**HOLDER, "hold": "newspaper", "holdScale": 1.5, "acting": False}])
    assert _diff(a, b, (0.6, 0.45, 0.72, 0.75)) < 4, "holdScale 1.5 is 255 units whether acting is on or not"


# ---------- fx among the front parts ----------
DUST_BEHIND = {"type": "fx", "kind": "dust", "id": "dust", "x": 0.5, "y": 0.74, "count": 12, "at": 0.8}
LOW_DESK = (0.42, 0.68, 0.58, 0.76)


def test_ground_fx_behind_the_bench_is_hidden_by_it():
    empty, dust = _one([JUDGE]), _one([JUDGE, DUST_BEHIND])
    assert _diff(empty, dust, LOW_DESK) < 1.0, "dust at the judge's feet stays behind the bench"


def test_fx_front_over_keeps_the_old_order():
    empty, dust = _one([JUDGE]), _one([JUDGE, {**DUST_BEHIND, "front": "over"}])
    assert _diff(empty, dust, LOW_DESK) > 4, 'front: "over" draws the fx over the bench'


def test_ground_fx_in_front_of_the_bench_and_screen_fx_stay_over():
    empty = _one([JUDGE])
    near = _one([JUDGE, {**DUST_BEHIND, "y": 0.9, "x": 0.5}])
    flash = _one([JUDGE, {"type": "fx", "kind": "flash", "id": "fl", "at": 0.9, "dur": 0.4}])
    assert _diff(empty, near, (0.42, 0.78, 0.58, 0.92)) > 4, "dust lower on screen than the bench is in front of it"
    assert _diff(empty, flash, LOW_DESK) > 4, "a screen-wide fx stays over the bench"


def test_fx_front_values_are_validated():
    assert validate(_shot([{**DUST_BEHIND, "front": "behind"}]))
    assert validate(_shot([{**DUST_BEHIND, "front": "depth"}])) == []


# ---------- front parts from several backgrounds ----------
PARTS_ONLY = {"kind": "set", "wall": False, "floor": False, "vignette": 0,
              "parts": [{"kind": "bench", "x": 0.5, "y": 0.99, "w": 700, "front": True}]}


def test_every_visible_set_contributes_front_parts():
    bg = [COURT, PARTS_ONLY]
    empty, judge = _one([], bg=bg), _one([JUDGE], bg=bg)
    assert _diff(empty, judge, HEAD_BOX) > 20
    assert _diff(empty, judge, DESK_BOX) < 1.5, "the courtroom desk still covers the judge under a parts-only set"
    witness = {"type": "bean", "x": 0.5, "y": 0.96, "size": 420, "view": "3q"}
    w = _one([witness], bg=bg)
    assert _diff(empty, w, (0.44, 0.77, 0.56, 0.85)) < 1.5, "the overlay set's bench covers the figure behind it"


def test_parts_only_set_over_a_landscape():
    bg = [{"kind": "forest"}, {**PARTS_ONLY, "parts": [{"kind": "desk", "x": 0.5, "y": 0.86, "w": 620, "front": True}]}]
    bean = {"type": "bean", "x": 0.5, "y": 0.8, "size": 380, "view": "front"}
    empty, full = _one([], bg=bg), _one([bean], bg=bg)
    assert _diff(empty, full, (0.46, 0.72, 0.54, 0.8)) < 1.5, "the desk covers the bean's legs"


def test_a_covering_background_after_the_set_drops_its_front_parts():
    bg = [COURT, {"kind": "flat", "color": "#334455"}]
    empty, judge = _one([], bg=bg), _one([JUDGE], bg=bg)
    assert _diff(empty, judge, DESK_BOX) > 8, "the room is covered: nothing redraws its desk over the judge"


def test_front_plane_background_opts_in_with_front_y():
    studio = {"kind": "studio", "variant": "courtroom"}
    judge = {**JUDGE, "y": 0.72}
    box = (0.45, 0.68, 0.55, 0.8)
    empty = _one([], bg={**studio, "frontY": 0.8})
    auto, plain = _one([judge], bg={**studio, "frontY": 0.8}), _one([judge], bg=studio)
    assert _diff(empty, auto, box) < 1.5, "with frontY the studio bench covers the judge behind it"
    assert _diff(empty, plain, box) > 4, "without frontY the judge stays over the background (unchanged)"
    assert validate(_shot([], bg={"kind": "forest", "frontY": 0.8})), "frontY only works on front-plane backgrounds"
