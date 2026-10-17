"""Engine backlog, places and props: set parts in front of the actors (courtroom bench), obj contact shadows and the
stone material texture, an unlit candle, a smaller poof with an optional word, and the new props (scales, microscope,
paintbrush, newspaper, rope, pulley, fridge, spray-can)."""
from __future__ import annotations

import base64
import io
import json
import sys
from pathlib import Path

import numpy as np
import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from spec import KNOWN_PROPS, validate  # noqa: E402

GRAB = "async (t)=>{window.renderFrame(t);return window.__canvas.toDataURL('image/png');}"
SCALE = 0.5


def _spec(shots, look="painted", cast=None):
    return {"seed": 4, "style": {"look": look} if look else {},
            "cast": cast or {"judge": {"outfit": "suit", "robe": "#26262c", "hair": "bald"}}, "shots": shots}


def _frames(spec: dict, times: list[float]) -> list[np.ndarray]:
    from PIL import Image
    from playwright.sync_api import sync_playwright
    import render as R

    srv = R.serve(set())
    try:
        with sync_playwright() as pw:
            browser, page, errors = R.open_page(pw, spec, srv.server_address[1], SCALE)
            urls = [page.evaluate(GRAB, t) for t in times]
            browser.close()
    finally:
        srv.shutdown()
    assert errors == [], errors
    return [np.asarray(Image.open(io.BytesIO(base64.b64decode(u.split(",", 1)[1]))).convert("RGB")).astype(int) for u in urls]


def _region(img: np.ndarray, x0: float, y0: float, x1: float, y1: float) -> np.ndarray:
    h, w = img.shape[:2]
    return img[int(y0 * h):int(y1 * h), int(x0 * w):int(x1 * w)]


def _diff(a: np.ndarray, b: np.ndarray, box) -> float:
    return float(np.abs(_region(a, *box) - _region(b, *box)).mean())


# ---------- courtroom: set parts in front of the actors ----------
JUDGE = {"type": "bean", "who": "judge", "x": 0.5, "y": 0.74, "size": 340, "view": "front"}
WITNESS = {"type": "bean", "who": "judge", "x": 0.5, "y": 1.0, "size": 420, "view": "3q"}
COURT = {"kind": "set", "preset": "courtroom"}
DESK_BOX = (0.42, 0.66, 0.58, 0.74)    # the judge's lower body, behind the bench front
HEAD_BOX = (0.45, 0.36, 0.55, 0.5)     # the judge's head, above the bench


def _court(layers, bg=None, look="painted"):
    return _spec([{"id": "court", "dur": 2, "bg": bg or COURT, "layers": layers}], look=look)


@pytest.mark.parametrize("look", ["painted", None])
def test_courtroom_bench_covers_the_judge_behind_it(look):
    empty, judge = (_frames(_court(layers, look=look), [1.0])[0] for layers in ([], [JUDGE]))
    assert _diff(empty, judge, HEAD_BOX) > 20, "the judge's head must show above the bench"
    assert _diff(empty, judge, DESK_BOX) < 1.5, "the bench must hide the judge's lower body"


def test_actor_in_front_of_the_bench_stays_in_front():
    empty, witness = (_frames(_court(layers), [1.0])[0] for layers in ([], [WITNESS]))
    assert _diff(empty, witness, (0.45, 0.62, 0.55, 0.74)) > 20, "a figure standing in front of the bench must cover it"


def test_explicit_bg_front_layer_places_the_front_parts():
    fg = {"type": "fg", "kind": "bg-front"}
    a = _frames(_court([JUDGE, fg]), [1.0])[0]
    b = _frames(_court([fg, JUDGE]), [1.0])[0]
    empty = _frames(_court([]), [1.0])[0]
    assert _diff(empty, a, DESK_BOX) < 1.5, "front parts drawn where the bg-front layer sits (after the judge)"
    assert _diff(empty, b, DESK_BOX) > 8, "a bg-front layer listed before the judge puts the bench behind him"


def test_front_flag_on_custom_set_parts():
    bg = {"kind": "set", "wall": "plaster", "floor": "wood", "parts": [
        {"kind": "table", "x": 0.5, "y": 0.84, "w": 700, "front": True, "items": ["papers"]}]}
    judge = {**JUDGE, "y": 0.8}
    assert validate(_court([judge], bg=bg)) == []
    empty, full = (_frames(_court(layers, bg=bg), [1.0])[0] for layers in ([], [judge]))
    assert _diff(empty, full, (0.45, 0.69, 0.55, 0.715)) < 1.5, "a front table top covers the figure behind it"


# ---------- obj contact shadow and the stone material ----------
def _rock(**extra):
    rock = {"type": "obj", "shape": "blob", "x": 0.5, "y": 0.6, "size": 420, "color": "#7d6e5e", "face": False, **extra}
    return _spec([{"id": "rock", "dur": 2, "bg": {"kind": "flat", "color": "#cfc6b0"}, "layers": [rock]}])


def test_obj_contact_shadow_sits_under_the_object():
    plain, shadow = (_frames(_rock(**extra), [1.0])[0] for extra in ({"contact": False}, {"contact": True}))
    feet = (0.44, 0.6, 0.56, 0.625)   # the ground just under the blob (obj origin = its feet)
    below = (0.4, 0.7, 0.6, 0.85)     # where the shadow used to land, half a size too low
    assert _region(plain, *feet).mean() - _region(shadow, *feet).mean() > 6, "contact: true must darken the ground at the feet"
    assert _diff(plain, shadow, below) < 1, "no detached shadow below the object"


def _grain(img: np.ndarray, box) -> float:
    """High-frequency energy: mean absolute difference between the region and its 5x5 box blur."""
    from PIL import Image, ImageFilter
    reg = _region(img, *box).astype(np.uint8)
    blur = np.asarray(Image.fromarray(reg).filter(ImageFilter.BoxBlur(2))).astype(int)
    return float(np.abs(reg.astype(int) - blur)[3:-3, 3:-3].mean())


def test_stone_material_has_visible_texture():
    inner = (0.45, 0.33, 0.55, 0.52)
    plain, stone = (_frames(_rock(**extra), [1.0])[0] for extra in ({}, {"material": "stone"}))
    assert _grain(stone, inner) > 2 * max(0.5, _grain(plain, inner)), (_grain(stone, inner), _grain(plain, inner))


# ---------- candle flame and poof ----------
def _props(layers, look="painted", bg="#cfc6b0", dur=3):
    return _spec([{"id": "p", "dur": dur, "bg": {"kind": "flat", "color": bg},
                   "layers": [{"enter": "none", **L} for L in layers]}], look=look)


CANDLE = {"type": "prop", "kind": "candle", "x": 0.5, "y": 0.6, "size": 300}


@pytest.mark.parametrize("kind", ["candle", "oil-lamp", "lantern"])
def test_flame_false_and_timeline_put_the_flame_out(kind):
    lit = {**CANDLE, "kind": kind}
    timeline = {**lit, "flame": [{"at": 0, "v": True}, {"at": 1, "v": False}]}
    assert validate(_props([timeline])) == []
    a = _frames(_props([lit]), [0.5])[0]
    b, b_late = _frames(_props([{**lit, "flame": False}]), [0.5, 2.8])
    early, late = _frames(_props([timeline]), [0.5, 2.8])
    assert _diff(a, b, (0.4, 0.2, 0.6, 0.6)) > 1, "flame: false must draw no flame"
    assert _diff(a, early, (0, 0, 1, 1)) == 0, "a timeline before its switch draws the lit prop"
    assert _diff(b_late, late, (0, 0, 1, 1)) == 0, "after the switch (and its smoke wisp) the prop is unlit"


POOF = {"type": "fx", "kind": "poof", "x": 0.5, "y": 0.5, "at": 0}


def _changed(img: np.ndarray, base: np.ndarray) -> int:
    return int((np.abs(img - base).sum(axis=2) > 30).sum())


def test_poof_default_is_smaller_and_word_is_optional():
    t = [0.1]
    empty = _frames(_props([]), t)[0]
    default = _frames(_props([POOF]), t)[0]
    explicit = _frames(_props([{**POOF, "w": 420, "h": 300}]), t)[0]
    no_word = _frames(_props([{**POOF, "word": False}]), t)[0]
    null_word = _frames(_props([{**POOF, "word": None}]), t)[0]
    custom = _frames(_props([{**POOF, "word": "BAM!"}]), t)[0]
    assert _changed(default, empty) < 0.7 * _changed(explicit, empty), "the default poof must be smaller than 420 x 300"
    assert _diff(no_word, null_word, (0, 0, 1, 1)) == 0, "word: false hides the word like null"
    assert _diff(no_word, default, (0.4, 0.4, 0.6, 0.6)) > 2, "the default keeps a word"
    assert _diff(custom, default, (0.4, 0.4, 0.6, 0.6)) > 2, "custom text replaces POOF!"


# ---------- new props ----------
NEW_PROPS = {"scales", "microscope", "paintbrush", "newspaper", "spray-can", "fridge", "rope", "pulley"}
ANIMATED = [
    {"kind": "scales", "tilt": [{"at": 0, "v": -15}, {"at": 2, "v": 15}], "left": "coin-pile", "right": "apple"},
    {"kind": "fridge", "open": [{"at": 0, "v": 0}, {"at": 2, "v": 1}]},
    {"kind": "pulley", "lift": [{"at": 0, "v": 0}, {"at": 2, "v": 1}], "load": "barrel"},
    {"kind": "spray-can", "spray": [[1, 3]]},
]


def test_new_props_are_in_the_vocabulary():
    vocab = json.loads((ROOT / "scripts/vocab/props-everyday.json").read_text())
    assert set(vocab["props"]) == NEW_PROPS
    assert NEW_PROPS <= KNOWN_PROPS


@pytest.mark.parametrize("fields", ANIMATED, ids=lambda f: f["kind"])
def test_new_prop_animation_fields_change_the_frame(fields):
    spec = _props([{"type": "prop", "x": 0.5, "y": 0.5, "size": 600, **fields}])
    assert validate(spec) == []
    a, b = _frames(spec, [0.5, 2.5])
    assert _diff(a, b, (0.3, 0.1, 0.7, 0.95)) > 1.5


@pytest.mark.parametrize("kind", sorted(NEW_PROPS))
@pytest.mark.parametrize("look", ["painted", None])
def test_new_props_draw_in_both_looks(kind, look):
    spec = _props([{"type": "prop", "kind": kind, "x": 0.5, "y": 0.5, "size": 500}], look=look)
    empty = _frames(_props([], look=look), [1.0])[0]
    assert _changed(_frames(spec, [1.0])[0], empty) > 2000


@pytest.mark.parametrize("kind, props", [("newspaper", {"headline": "EXTRA!"}), ("paintbrush", {}),
                                         ("spray-can", {"spray": True}), ("rope", {})])
def test_handheld_props_work_with_a_bean_hold(kind, props):
    bean = {"type": "bean", "who": "judge", "x": 0.5, "y": 0.9, "size": 420, "pose": "hold"}
    held = {**bean, "hold": kind, "holdProps": props, "holdScale": 1.5}
    spec = _props([held])
    assert validate(spec) == []
    plain, holding = _frames(_props([bean]), [1.0])[0], _frames(spec, [1.0])[0]
    assert _changed(holding, plain) > 100


# ---------- review fixes: the front pass follows the layers frame by frame ----------
def test_front_pass_follows_motion_and_swaps():
    empty = _frames(_court([]), [1.0])[0]
    moved = {**JUDGE, "move": [{"at": 0, "dur": 0.01, "to": [0.5, 0.97]}]}
    swapped = {**JUDGE, "swap": [{"at": 0.5, "y": 0.97}]}
    for judge in (moved, swapped):
        assert validate(_court([judge])) == []
        img = _frames(_court([judge]), [1.0])[0]
        assert _diff(empty, img, (0.45, 0.62, 0.55, 0.74)) > 8, "a judge who walks to the front is drawn over the bench"
    hud = {**JUDGE, "swap": [{"at": 0.5, "z": 1.2}]}
    img = _frames(_court([hud]), [1.0])[0]
    assert _diff(empty, img, DESK_BOX) > 8, "a judge swapped to a near plane is in front of the bench"


def test_inactive_explicit_front_layer_keeps_the_automatic_pass():
    empty = _frames(_court([]), [1.0, 2.0])
    late = _frames(_court([JUDGE, {"type": "fg", "kind": "set-front", "at": 2}]), [1.0])[0]
    gone = _frames(_court([{"type": "fg", "kind": "set-front", "out": 0.5}, JUDGE]), [2.0])[0]
    assert _diff(empty[0], late, DESK_BOX) < 1.5, "before an explicit front layer starts, the automatic pass hides the judge"
    assert _diff(empty[1], gone, DESK_BOX) < 1.5, "after it ends, too"


def test_front_parts_depth_sort_among_actors():
    bg = {"kind": "set", "wall": "plaster", "floor": "wood", "parts": [
        {"kind": "table", "x": 0.5, "y": 0.7, "w": 700, "front": True},
        {"kind": "table", "x": 0.5, "y": 0.9, "w": 900, "front": True}]}
    actor = {**JUDGE, "y": 0.8, "size": 420}
    empty, full = (_frames(_court(layers, bg=bg), [1.0])[0] for layers in ([], [actor]))
    assert _diff(empty, full, (0.46, 0.57, 0.54, 0.6)) > 8, "the actor stands in front of the far table"
    assert _diff(empty, full, (0.45, 0.765, 0.55, 0.785)) < 1.5, "the near table covers the actor"


def test_set_front_in_pinned_is_rejected_and_draws_nothing():
    cam = {"pan": [[-120, 0], [120, 0]]}
    plain = _court([JUDGE])
    pinned = _court([JUDGE])
    for spec in (plain, pinned):
        spec["shots"][0]["camera"] = cam
    pinned["shots"][0]["pinned"] = [{"type": "fg", "kind": "set-front"}]
    assert any("set-front" in e for e in validate(pinned))
    assert _diff(_frames(plain, [1.0])[0], _frames(pinned, [1.0])[0], (0, 0, 1, 1)) == 0


def test_only_the_topmost_set_contributes_front_parts():
    library = {"kind": "set", "preset": "library"}
    covered = _frames(_court([JUDGE], bg=[COURT, library]), [1.0])[0]
    alone = _frames(_court([JUDGE], bg=[library]), [1.0])[0]
    assert _diff(covered, alone, (0, 0, 1, 1)) < 0.05, "a set covered by a later background adds no front parts"
    on_top = _frames(_court([JUDGE], bg=[library, COURT]), [1.0])[0]
    empty = _frames(_court([], bg=[library, COURT]), [1.0])[0]
    assert _diff(empty, on_top, DESK_BOX) < 1.5


# ---------- review fixes: props ----------
SPRAY = {"type": "prop", "kind": "spray-can", "x": 0.4, "y": 0.6, "size": 400}


def test_spray_zero_and_overlapping_windows():
    dry = _frames(_props([SPRAY]), [1.0, 0.35])
    assert _diff(dry[0], _frames(_props([{**SPRAY, "spray": 0}]), [1.0])[0], (0.4, 0.2, 0.9, 0.7)) > 1, "spray: 0 sprays from 0 s"
    second = _frames(_props([{**SPRAY, "spray": [[0.3, 0.5]]}]), [0.35])[0]
    both = _frames(_props([{**SPRAY, "spray": [[0, 0.2], [0.3, 0.5]]}]), [0.35])[0]
    assert _diff(second, both, (0.4, 0.1, 1, 0.7)) > 0.3, "the first plume is still in the air at 0.35 s"


@pytest.mark.parametrize("layer, needle", [
    ({"kind": "fridge", "items": "apple"}, "items"),
    ({"kind": "fridge", "items": ["unicorn"]}, "items[0]"),
    ({"kind": "pulley", "load": "unicorn"}, "load"),
    ({"kind": "pulley", "lift": "up"}, "lift"),
    ({"kind": "spray-can", "spray": [1]}, "spray"),
    ({"kind": "scales", "left": "unicorn"}, "left"),
    ({"kind": "candle", "flame": "off"}, "flame"),
])
def test_new_prop_fields_are_validated(layer, needle):
    errors = "\n".join(validate(_props([{"type": "prop", "x": 0.5, "y": 0.5, **layer}])))
    assert needle in errors, errors
    held = {"type": "bean", "who": "judge", "hold": "spray-can", "holdProps": {"spray": [1]}}
    assert any("spray" in e for e in validate(_props([held])))


def test_fridge_ground_items_stand_on_the_shelf():
    fridge = {"type": "prop", "kind": "fridge", "x": 0.5, "y": 0.5, "size": 1000, "open": 1}
    bare = _frames(_props([{**fridge, "items": []}]), [1.0])[0]
    heap = _frames(_props([{**fridge, "items": ["coin-heap"]}]), [1.0])[0]
    rows = np.where((np.abs(heap - bare).sum(axis=2) > 40).any(axis=1))[0]
    shelf = (0.5 + 0.0208 * 1000 / 1080) * bare.shape[0]
    assert abs(rows.max() - shelf) < 6, (rows.max(), shelf)


def test_obj_contact_true_uses_the_wider_obj_shadow():
    one, wide, true = (_frames(_rock(contact=c), [1.0])[0] for c in ({"w": 1}, {"w": 1.3}, True))
    assert _diff(wide, true, (0, 0, 1, 1)) == 0, "contact: true uses the obj default width 1.3 (CONTACT_W)"
    assert _diff(one, true, (0, 0, 1, 1)) > 0
