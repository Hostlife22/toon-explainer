"""Places 2.0 (painted look): modular set kit, depth planes with parallax and haze, cached static planes, rich
painted versions of common backgrounds, new landscape kinds and painted foreground framing."""
from __future__ import annotations

import copy
import json
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from spec import validate  # noqa: E402

GRAB = "async (t)=>{window.renderFrame(t);return window.__canvas.toDataURL('image/png');}"
CATALOG = ROOT / "examples" / "painted_places" / "spec.json"
NEW_BGS = ["set", "hills", "woods", "river", "dunes", "ancient", "castle"]
NEW_FG = ["foliage", "column", "window-frame", "silhouettes"]
RICH = ["office", "stage", "street1920", "room", "studio", "factory", "sky", "mountains", "gallery", "corkboard", "parchment",
        "battlefield", "trench", "harbor"]


def _shot(sid, bg, layers=None, camera=None, look=None):
    out = {"id": sid, "dur": 2, "bg": bg, "layers": layers or [{"type": "bean", "who": "hero", "x": 0.4, "y": 0.9, "size": 420}]}
    if camera is not None:
        out["camera"] = camera
    if look is not None:
        out["look"] = look
    return out


def _spec(shots, look="painted"):
    style = {"look": look} if look else {}
    return {"seed": 4, "style": style, "cast": {"hero": {"robe": "#3a6ea5"}}, "shots": shots}


SET_BG = {"kind": "set", "wall": "brick", "floor": "wood", "parts": [
    {"kind": "window", "x": 0.7, "y": 0.12, "w": 0.16, "h": 0.4, "light": True},
    {"kind": "shelf", "x": 0.2, "y": 0.78, "items": "books"},
    {"kind": "lamp", "x": 0.45, "y": 0.78, "style": "floor"},
    {"kind": "rug", "x": 0.5, "y": 0.9},
    {"kind": "fireplace", "x": 0.85, "y": 0.78, "scale": 0.8},
]}


# ---------- validation ----------
def test_set_parts_and_new_fields_validate():
    spec = _spec([
        _shot("a", SET_BG),
        _shot("b", {"kind": "set", "preset": "throne"}),
        _shot("c", {"kind": "hills", "parallax": 1.5, "haze": 0.6}),
        _shot("d", {"kind": "sky"}, layers=[{"type": "set", "parts": [{"kind": "table", "x": 0.5, "y": 0.95}]},
                                             {"type": "fg", "kind": "foliage"}]),
    ])
    assert validate(spec) == []


@pytest.mark.parametrize("bad, needle", [
    ({"kind": "set", "parts": [{"kind": "spaceship"}]}, "part"),
    ({"kind": "set", "parts": "window"}, "parts"),
    ({"kind": "set", "wall": "cheese"}, "wall"),
    ({"kind": "set", "preset": "moon-base"}, "preset"),
    ({"kind": "set", "parts": [{"kind": "lamp", "x": "left"}]}, "x"),
    ({"kind": "sky", "parallax": -1}, "parallax"),
    ({"kind": "hills", "haze": 4}, "haze"),
])
def test_bad_set_and_depth_fields_are_reported(bad, needle):
    errors = "\n".join(validate(_spec([_shot("a", bad)])))
    assert needle in errors, errors


def test_set_layer_parts_are_checked():
    spec = _spec([_shot("a", {"kind": "sky"}, layers=[{"type": "set", "parts": [{"kind": "nope"}]}])])
    assert "part" in "\n".join(validate(spec))


# ---------- engine ----------
def _page_eval(spec: dict, fn, scale=0.25):
    from playwright.sync_api import sync_playwright
    import render as R

    srv = R.serve(set())
    try:
        with sync_playwright() as pw:
            browser, page, errors = R.open_page(pw, spec, srv.server_address[1], scale)
            out = fn(page)
            browser.close()
    finally:
        srv.shutdown()
    assert errors == [], errors
    return out


def _frames(spec: dict, times: list[float]) -> list[str]:
    return _page_eval(spec, lambda page: [page.evaluate(GRAB, t) for t in times])


def test_every_new_kind_renders_in_both_looks_and_differs():
    shots = [_shot(k, {"kind": k}) for k in NEW_BGS]
    shots += [_shot("fg_" + k, {"kind": "hills"}, layers=[{"type": "fg", "kind": k}]) for k in NEW_FG]
    times = [i * 2 + 1.0 for i in range(len(shots))]
    painted = _frames(_spec(shots), times)
    classic = _frames(_spec(shots, look=None), times)
    assert len(set(painted)) == len(painted), "every kind must draw something distinct"
    assert all(p != c for p, c in zip(painted[:len(NEW_BGS)], classic)), "the painted look must change the new kinds"


def test_classic_look_of_upgraded_kinds_is_untouched():
    """In the classic look every upgraded kind must draw exactly what its original function draws."""
    js = """(kinds) => {
      const out = {};
      for (const k of kinds) out[k] = typeof TOON.CLASSIC_BGS[k] === 'function';
      return out;
    }"""
    spec = _spec([_shot(k, {"kind": k}) for k in RICH], look=None)
    found = _page_eval(spec, lambda page: page.evaluate(js, RICH))
    assert all(found.values()), found
    swap = """async ([t, kinds]) => {
      window.renderFrame(t); const a = window.__canvas.toDataURL('image/png');
      const saved = {}; for (const k of kinds) { saved[k] = TOON.bgs[k]; TOON.bgs[k] = TOON.CLASSIC_BGS[k]; }
      window.renderFrame(t); const b = window.__canvas.toDataURL('image/png');
      for (const k of kinds) TOON.bgs[k] = saved[k];
      return a === b;
    }"""
    same = _page_eval(spec, lambda page: [page.evaluate(swap, [i * 2 + 1.0, RICH]) for i in range(len(RICH))])
    assert all(same), same


def test_rich_painted_kinds_differ_from_the_phase1_painted_versions():
    swap = """async ([t, kinds]) => {
      window.renderFrame(t); const a = window.__canvas.toDataURL('image/png');
      const saved = {}; for (const k of kinds) { saved[k] = TOON.bgs[k]; TOON.bgs[k] = TOON.CLASSIC_BGS[k]; }
      window.renderFrame(t); const b = window.__canvas.toDataURL('image/png');
      for (const k of kinds) TOON.bgs[k] = saved[k];
      return a !== b;
    }"""
    spec = _spec([_shot(k, {"kind": k}) for k in RICH])
    differ = _page_eval(spec, lambda page: [page.evaluate(swap, [i * 2 + 1.0, RICH]) for i in range(len(RICH))])
    assert all(differ), dict(zip(RICH, differ))


def test_plane_cache_is_deterministic_and_order_independent():
    shots = [_shot("set", SET_BG, camera={"zoom": [1, 1.2], "pan": [[0, 0], [60, 0]]}),
             _shot("hills", {"kind": "hills"}, camera={"pan": [[0, 0], [-80, 0]]}),
             _shot("street", {"kind": "street1920"})]
    spec = _spec(shots)
    times = [0.3, 1.7, 2.4, 3.9, 4.5, 5.6]
    first = _frames(spec, times)
    again = _frames(spec, list(reversed(times)))[::-1]
    assert first == again, "painted planes depend on render order"
    js = """async (ts) => { const a = ts.map((t) => { window.renderFrame(t); return window.__canvas.toDataURL('image/png'); });
      TOON.clearPlaneCache(); const b = ts.map((t) => { window.renderFrame(t); return window.__canvas.toDataURL('image/png'); });
      return a.every((x, i) => x === b[i]) && TOON.planeCacheSize() > 0; }"""
    assert _page_eval(spec, lambda page: page.evaluate(js, times))


def test_parallax_scales_plane_motion():
    cam = {"pan": [[0, 0], [220, 0]]}
    base = _spec([_shot("a", {"kind": "hills"}, camera=cam, layers=[])])
    flat = copy.deepcopy(base)
    flat["shots"][0]["bg"]["parallax"] = 0
    deep = copy.deepcopy(base)
    deep["shots"][0]["bg"]["parallax"] = 2
    a, b, c = (_frames(s, [1.9])[0] for s in (base, flat, deep))
    assert a != b and a != c and b != c
    classic = _spec([_shot("a", {"kind": "sky"}, camera=cam, layers=[])], look=None)
    classic_flat = copy.deepcopy(classic)
    classic_flat["shots"][0]["bg"]["parallax"] = 0
    assert _frames(classic, [1.9]) != _frames(classic_flat, [1.9]), "parallax works for existing kinds too"


def test_ambience_animates_over_time():
    spec = _spec([_shot("a", SET_BG, layers=[]), _shot("b", {"kind": "woods"}, layers=[])])
    f = _frames(spec, [0.2, 0.9, 2.2, 2.9])
    assert f[0] != f[1], "lamp flicker / dust motes / fire must move"
    assert f[2] != f[3], "trees and grass must sway"


def test_set_layer_draws_parts_over_characters():
    plain = _spec([_shot("a", {"kind": "set", "preset": "lab"})])
    front = copy.deepcopy(plain)
    front["shots"][0]["layers"].append({"type": "set", "parts": [{"kind": "table", "x": 0.42, "y": 0.98, "scale": 1.2}]})
    assert _frames(plain, [1.0]) != _frames(front, [1.0])


def test_set_registries_are_exposed():
    js = """() => ({ parts: Object.keys(TOON.SET_PARTS || {}), presets: Object.keys(TOON.SET_PRESETS || {}),
      api: ['plane', 'clearPlaneCache', 'planeCacheSize', 'drawSetParts', 'dustMotes', 'lightShaft'].filter((k) => typeof TOON[k] !== 'function') })"""
    out = _page_eval(_spec([_shot("a", {"kind": "set"})]), lambda page: page.evaluate(js))
    need = {"wall", "floor", "window", "door", "column", "shelf", "rug", "table", "bed", "painting", "lamp", "roof",
            "stairs", "fireplace", "curtain"}
    assert need <= set(out["parts"]), sorted(need - set(out["parts"]))
    assert {"throne", "lab", "courtroom"} <= set(out["presets"])
    assert out["api"] == []


# ---------- review fixes ----------
def test_surface_suppression_validates():
    bg = {"kind": "set", "wall": False, "floor": False, "parts": [{"kind": "lamp", "x": 0.5}]}
    assert validate(_spec([_shot("a", bg)])) == []


@pytest.mark.parametrize("bad, needle", [
    ({"kind": "set", "parts": [{"kind": []}]}, "part"),
    ({"kind": "set", "preset": {"x": 1}}, "preset"),
    ({"kind": "set", "wall": ["brick"]}, "wall"),
    ({"kind": "set", "parts": [{"kind": "window", "x": 0.5, "h": float("nan")}]}, "h"),
    ({"kind": "set", "parts": [{"kind": "window", "x": 0.5, "w": float("inf")}]}, "w"),
    ({"kind": "hills", "preset": "typo"}, "preset"),
    ({"kind": "castle", "preset": "typo"}, "preset"),
])
def test_malformed_set_and_landscape_fields_are_errors_not_crashes(bad, needle):
    errors = "\n".join(validate(_spec([_shot("a", bad)])))
    assert needle in errors, errors


def test_set_layer_follows_its_move():
    part = [{"kind": "table", "x": 0.5, "y": 0.95}]
    still = _spec([_shot("a", {"kind": "flat", "color": "#334455"}, layers=[{"type": "set", "parts": part}])])
    moved = copy.deepcopy(still)
    moved["shots"][0]["layers"][0]["move"] = [{"at": 0, "to": [0.8, 0.5], "dur": 0.5}]
    assert _frames(still, [1.5]) != _frames(moved, [1.5]), "a set layer must follow its own move"


def test_parallax_state_does_not_leak_between_draws():
    spec = _spec([_shot("a", {"kind": "hills", "parallax": 2}, camera={"pan": [[0, 0], [200, 0]]},
                        layers=[{"type": "prop", "kind": "coin", "x": 0.5, "y": 0.5, "z": 0.5}])])
    js = """(t) => { window.renderFrame(t); const a = window.__canvas.toDataURL('image/png');
      TOON.BG_DEPTH = 3; window.renderFrame(t); const b = window.__canvas.toDataURL('image/png');
      const left = TOON.BG_DEPTH; TOON.BG_DEPTH = null; return a === b && left === 3; }"""
    assert _page_eval(spec, lambda page: page.evaluate(js, 1.5))


def test_fg_column_is_visible_in_vertical_format():
    base = _spec([_shot("a", {"kind": "flat", "color": "#334455"}, layers=[])])
    base["format"] = "vertical"
    col = copy.deepcopy(base)
    col["shots"][0]["layers"] = [{"type": "fg", "kind": "column", "side": "left"}]
    import base64
    import io
    from PIL import Image

    def left_strip(url):
        im = Image.open(io.BytesIO(base64.b64decode(url.split(",", 1)[1]))).convert("RGB")
        return im.crop((0, 0, im.width // 5, im.height)).tobytes()
    assert left_strip(_frames(base, [1.0])[0]) != left_strip(_frames(col, [1.0])[0]), "column must show at the strip's edge"


def test_animation_stays_behind_later_parts_of_the_same_plane():
    """Fire in a fireplace hidden behind a shelf listed after it must not show through the shelf."""
    import base64
    import io
    from PIL import Image

    bg = {"kind": "set", "wall": "plaster", "floor": "wood", "vignette": 0, "parts": [
        {"kind": "fireplace", "x": 0.5, "y": 0.78}, {"kind": "shelf", "x": 0.5, "y": 0.8, "scale": 2.2}]}
    spec = _spec([_shot("a", bg, layers=[{"type": "prop", "kind": "coin", "x": 0.05, "y": 0.05, "size": 20}], camera={"zoom": [1, 1]})], look=None)  # classic: no animated paper grain
    spec["style"]["grain"] = False
    spec["style"]["vignette"] = 0

    def centre(url):
        im = Image.open(io.BytesIO(base64.b64decode(url.split(",", 1)[1]))).convert("RGB")
        return im.crop((im.width * 45 // 100, im.height * 55 // 100, im.width * 55 // 100, im.height * 70 // 100)).tobytes()
    a, b = _frames(spec, [0.2, 0.9])
    assert centre(a) == centre(b), "the fire flickers through the shelf in front of it"


@pytest.mark.parametrize("kind", ["street1920", "factory"])
def test_custom_haze_colour_is_used(kind):
    plain = _spec([_shot("a", {"kind": kind}, layers=[])])
    red = copy.deepcopy(plain)
    red["shots"][0]["bg"]["haze"] = "#ff0000"
    assert _frames(plain, [1.0]) != _frames(red, [1.0])


def test_catalog_covers_every_new_kind_and_is_painted():
    spec = json.loads(CATALOG.read_text(encoding="utf-8"))
    assert validate(spec) == []
    assert spec["style"]["look"] == "painted"
    kinds = {(s["bg"] if isinstance(s["bg"], dict) else s["bg"][0]).get("kind") for s in spec["shots"]}
    assert set(NEW_BGS) <= kinds, sorted(set(NEW_BGS) - kinds)
    fgs = {L.get("kind") for s in spec["shots"] for L in s.get("layers", []) if L.get("type") == "fg"}
    assert set(NEW_FG) <= fgs, sorted(set(NEW_FG) - fgs)
    presets = {s["bg"].get("preset") for s in spec["shots"] if isinstance(s["bg"], dict) and s["bg"].get("kind") == "set"}
    assert {"throne", "lab", "courtroom"} <= presets
