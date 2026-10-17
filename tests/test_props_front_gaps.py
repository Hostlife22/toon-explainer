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


# ---------- review fixes: the slot reads the position the fx renders at ----------
ORDER = "(lt) => TOON.shotLayers(TOON.film.spec.shots[0], lt, {}).map((L) => L.kind === 'set-front' ? 'FRONT' : (L.id || L.type))"


def _order(layers, t, bg=None):
    from playwright.sync_api import sync_playwright
    import render as R

    spec = _shot(layers, bg)
    assert validate(spec) == [], validate(spec)
    srv = R.serve(set())
    try:
        with sync_playwright() as pw:
            browser, page, errors = R.open_page(pw, spec, srv.server_address[1], 0.25)
            out = page.evaluate(ORDER, t)
            browser.close()
    finally:
        srv.shutdown()
    assert errors == [], errors
    return out


def _behind(order, fid):
    """True when the fx comes before (behind) the courtroom desk's front pass."""
    return order.index(fid) < order.index("FRONT")


LANDER = {"type": "bean", "id": "lander", "x": 0.5, "y": 0.95, "size": 300, "jump": [{"at": 0.1, "h": 60, "dur": 0.4}],
          "move": [{"at": 0.6, "dur": 0.1, "to": [0.5, 0.74]}]}
KICK = {"type": "fx", "kind": "dustkick", "id": "kick", "target": "lander"}


def test_targeted_dustkick_slots_at_its_landing_point():
    assert not _behind(_order([LANDER, KICK], 0.9), "kick"), "dust that landed in front of the desk stays in front"
    back = {**LANDER, "y": 0.74, "move": [{"at": 0.6, "dur": 0.1, "to": [0.5, 0.95]}]}
    # (the dust is listed first: a front piece is slotted before the first layer in front of it, list order kept)
    assert _behind(_order([{**KICK, "y": 0.95}, back], 0.9), "kick"), "dust that landed behind the desk stays behind"


def test_brawl_path_sets_its_depth():
    brawl = {"type": "fx", "kind": "brawl", "id": "br", "front": "depth", "path": [[0.5, 0.9], [0.5, 0.9]], "dur": 2}
    assert not _behind(_order([brawl], 1.0), "br"), "a brawl drawn at y 0.9 stands in front of the desk"


def test_non_positional_move_does_not_place_an_fx():
    smoke = {"type": "fx", "kind": "smoke", "id": "sm", "move": [{"at": 0, "dur": 1, "alpha": 0.5}]}
    assert not _behind(_order([smoke], 0.5), "sm"), "an alpha-only move keeps an unplaced smoke over the front parts"


def test_explicit_set_front_layer_places_front_y_planes():
    studio = {"kind": "studio", "variant": "courtroom", "frontY": 0.8}
    box = (0.45, 0.68, 0.55, 0.8)
    empty = _one([], bg=studio)
    placed = _one([{**JUDGE, "y": 0.72}, {"type": "fg", "kind": "set-front"}], bg=studio)
    assert _diff(empty, placed, box) < 1.5, "an explicit set-front layer draws the frontY plane over the judge"


def test_front_y_plane_is_drawn_once():
    studio = {"kind": "studio", "variant": "courtroom"}
    pin = {"type": "prop", "kind": "book", "id": "pin", "x": 0.04, "y": 0.15, "size": 40}
    box = (0.2, 0.6, 0.8, 0.95)
    for focus in (None, [{"at": 0, "dur": 0.01, "on": "pin", "bg": 14}]):
        shots = [{"id": "s", "dur": 2, "bg": bg, "layers": [pin], **({"focus": focus} if focus else {})}
                 for bg in (studio, {**studio, "frontY": 0.8})]
        a, b = (_frames(_spec([s]), [1.0])[0] for s in shots)
        assert _diff(a, b, box) < 0.3, f"with frontY the plane is drawn once (focus {focus})"


def test_fx_front_is_validated_across_swaps():
    assert validate(_shot([{**DUST_BEHIND, "swap": [{"at": 1, "front": "behind"}]}]))
