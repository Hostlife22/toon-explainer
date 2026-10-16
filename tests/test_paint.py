"""Painted look (style.look = "painted"): density lint, light / atmos / contact validation, paint core in the engine."""
from __future__ import annotations

import copy
import json
import subprocess
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from spec import lint, validate  # noqa: E402

GRAB = "async (t)=>{window.renderFrame(t);return window.__canvas.toDataURL('image/png');}"
BENCH = ROOT / "examples" / "painted_bench" / "spec.json"
ALL_EXAMPLES = sorted((ROOT / "examples").glob("*/spec.json"))


def _shot(sid, layers, bg=None, camera=None):
    out = {"id": sid, "dur": 2, "bg": bg or {"kind": "sky"}, "layers": layers}
    if camera is not None:
        out["camera"] = camera
    return out


BEAN = {"type": "bean", "who": "hero", "x": 0.5, "y": 0.9}
PROP = {"type": "prop", "kind": "coin", "x": 0.2, "y": 0.4}


# ---------- Phase 0: density lint ----------
def test_lint_flags_thin_shots_void_bgs_missing_foreground_and_repeated_sizes():
    spec = {"cast": {"hero": {}}, "shots": [
        _shot("thin", [BEAN]),
        _shot("void", [BEAN, PROP, PROP, {"type": "fg", "kind": "grass"}], bg={"kind": "void"}),
        _shot("same1", [PROP, PROP, PROP, PROP], camera={"zoom": [1, 1.1]}),
        _shot("same2", [PROP, PROP, PROP, PROP], camera={"zoom": [1, 1.1]}),
        _shot("same3", [PROP, PROP, PROP, PROP], camera={"zoom": [1, 1.1]}),
        _shot("card", [{"type": "title", "text": "PART ONE"}], bg={"kind": "flat"}),
    ]}
    assert validate(spec) == []
    warnings = "\n".join(lint(spec))
    assert "thin" in warnings and "layers" in warnings
    assert "void" in warnings
    assert "foreground" in warnings
    assert "same1" in warnings and "same3" in warnings and "camera" in warnings
    assert "card" not in warnings, "title cards are exempt from the layer count"


def test_lint_accepts_a_dense_shot_and_counts_parallax_foregrounds():
    shot = _shot("dense", [BEAN, PROP, PROP, {"type": "prop", "kind": "skull", "x": 0.8, "y": 0.9, "z": 1.3}])
    assert lint({"cast": {"hero": {}}, "shots": [shot]}) == []


def test_lint_never_breaks_existing_examples(capsys):
    for path in ALL_EXAMPLES:
        spec = json.loads(path.read_text(encoding="utf-8"))
        assert validate(spec) == [], path
        assert isinstance(lint(spec), list)
    r = subprocess.run([sys.executable, str(ROOT / "scripts" / "spec.py"), str(ROOT / "examples" / "showcase" / "spec.json")],
                       capture_output=True, text=True)
    assert r.returncode == 0, r.stderr
    assert r.stdout.startswith("OK:")


# ---------- Phase 1: validation of the painted fields ----------
PAINTED = {
    "seed": 5,
    "style": {"look": "painted", "light": {"dir": 50, "color": "#fff0d0", "rim": 0.6, "ambient": "#3a2d5a", "intensity": 0.6}},
    "cast": {"hero": {"robe": "#3a6ea5"}},
    "shots": [
        {"id": "a", "dur": 2, "bg": {"kind": "sky", "preset": "day", "clouds": 4}, "grade": "golden-hour",
         "light": {"dir": 140},
         "layers": [
             {"type": "bean", "id": "hero", "who": "hero", "x": 0.4, "y": 0.86, "size": 520},
             {"type": "prop", "id": "coin", "kind": "coin", "x": 0.6, "y": 0.3, "size": 200, "contact": True},
             {"type": "prop", "id": "far", "kind": "temple", "x": 0.8, "y": 0.6, "size": 260, "atmos": 0.5},
         ]},
        {"id": "b", "dur": 2, "bg": {"kind": "interior"}, "grade": "overcast", "look": "classic",
         "layers": [{"type": "bean", "who": "hero", "x": 0.5, "y": 0.9, "size": 500}]},
    ],
}


def test_painted_fields_validate_and_bad_values_are_reported():
    assert validate(PAINTED) == []
    bad = copy.deepcopy(PAINTED)
    bad["style"]["look"] = "oil"
    bad["style"]["light"]["dir"] = "left"
    bad["shots"][0]["light"] = {"color": "warm"}
    bad["shots"][0]["layers"][2]["atmos"] = 3
    bad["shots"][0]["layers"][1]["contact"] = "yes"
    errors = "\n".join(validate(bad))
    for needle in ("look", "light.dir", "light.color", "atmos", "contact"):
        assert needle in errors, (needle, errors)


# ---------- Phase 1: engine ----------
def _page_eval(spec: dict, fn):
    from playwright.sync_api import sync_playwright
    import render as R

    srv = R.serve(set())
    try:
        with sync_playwright() as pw:
            browser, page, errors = R.open_page(pw, spec, srv.server_address[1], 0.25)
            out = fn(page)
            browser.close()
    finally:
        srv.shutdown()
    assert errors == [], errors
    return out


def _frames(spec: dict, times: list[float]) -> list[str]:
    return _page_eval(spec, lambda page: [page.evaluate(GRAB, t) for t in times])


def test_painted_look_changes_the_frame_and_is_deterministic():
    classic = copy.deepcopy(PAINTED)
    classic["style"] = {}
    times = [0.5, 1.5, 2.5]
    first = _frames(PAINTED, times)
    again = _frames(PAINTED, list(reversed(times)))[::-1]
    assert first == again, "painted frames depend on render order"
    plain = _frames(classic, times)
    assert first[0] != plain[0] and first[1] != plain[1], "painted look must change the frame"
    assert first[2] == plain[2], "a shot with look: classic must match the classic render"


def test_light_atmos_and_contact_each_change_pixels():
    base = _frames(PAINTED, [1.0])[0]
    variants = []
    for mutate in (lambda s: s["shots"][0].update(light={"dir": 300}),
                   lambda s: s["shots"][0]["layers"][2].pop("atmos"),
                   lambda s: s["shots"][0]["layers"][1].pop("contact"),
                   lambda s: s["shots"][0]["layers"][0].update(contact=False)):
        spec = copy.deepcopy(PAINTED)
        mutate(spec)
        variants.append(_frames(spec, [1.0])[0])
    assert all(v != base for v in variants)


def test_texture_tiles_are_cached_deterministic_and_distinct():
    js = """() => {
      const kinds = Object.keys(TOON.TEXTURES).sort();
      const a = kinds.map((k) => TOON.textureTile(k, 7).toDataURL());
      window.renderFrame(1.2);
      const b = kinds.map((k) => TOON.textureTile(k, 7).toDataURL());
      return { kinds, same: a.every((x, i) => x === b[i]), distinct: new Set(a).size === a.length,
               cached: TOON.textureTile('wood', 7) === TOON.textureTile('wood', 7),
               grades: ['golden-hour', 'dusk', 'night', 'overcast'].every((g) => TOON.GRADES.includes(g)) };
    }"""
    out = _page_eval(PAINTED, lambda page: page.evaluate(js))
    assert set(out["kinds"]) >= {"grass", "wood", "stone", "brick", "plaster", "fabric", "paper", "water"}
    assert out["same"] and out["distinct"] and out["cached"] and out["grades"], out


def test_shading_api_is_exposed():
    js = """() => ['shadeFill', 'inkStroke', 'contactShadow', 'fillTexture', 'textureTile', 'paintState', 'atmosColor']
      .filter((k) => typeof TOON[k] !== 'function')"""
    assert _page_eval(PAINTED, lambda page: page.evaluate(js)) == []


def test_painted_bench_is_dense_and_painted():
    spec = json.loads(BENCH.read_text(encoding="utf-8"))
    assert validate(spec) == []
    assert spec["style"]["look"] == "painted"
    assert len(spec["shots"]) >= 8


# ---------- review fixes ----------
def test_validator_rejects_bad_contact_members_swapped_paint_fields_and_non_string_looks():
    bad = copy.deepcopy(PAINTED)
    bad["shots"][0]["layers"][1]["contact"] = {"alpha": 2}
    bad["shots"][0]["layers"][0]["contact"] = {"w": "wide"}
    bad["shots"][0]["layers"][2]["swap"] = [{"at": 0.5, "atmos": {"color": "oops"}}]
    errors = "\n".join(validate(bad))
    assert "contact alpha" in errors and "contact w" in errors, errors
    assert "swap" in errors and "atmos color" in errors, errors
    for where in ("style", "shot"):
        weird = copy.deepcopy(PAINTED)
        (weird["style"] if where == "style" else weird["shots"][0])["look"] = [] if where == "style" else {}
        assert any("look" in e for e in validate(weird))


def test_tone_cache_and_background_passes_follow_the_shot():
    two = copy.deepcopy(PAINTED)
    two["shots"][1] = copy.deepcopy(two["shots"][0])
    two["shots"][1].update(id="b", light={"dir": 140, "color": "#80c0ff", "rim": 1.0})
    a = _frames(two, [0.5, 2.5])
    b = _frames(two, [2.5, 0.5])[::-1]
    assert a == b, "a cached tone leaked between shots with different rim light"
    covered = copy.deepcopy(PAINTED)
    covered["shots"] = [{"id": "c", "dur": 1, "bg": [{"kind": "interior"}, {"kind": "flat", "color": "#334455"}], "layers": []}]
    flat_only = copy.deepcopy(covered)
    flat_only["shots"][0]["bg"] = [{"kind": "flat", "color": "#334455"}]
    assert _frames(covered, [0.5]) == _frames(flat_only, [0.5]), "an opaque later background must hide earlier paint passes"


def test_sun_direction_uses_world_aspect_and_contact_alpha_is_order_free():
    js = """() => {
      const T = TOON, dir = T.paintState({style: {look: 'painted'}}, {id: 'x', bg: {kind: 'sky', preset: 'day'}}).light.dir;
      const c = document.createElement('canvas'); c.width = c.height = 64; const k = c.getContext('2d');
      const draw = (as) => { k.clearRect(0, 0, 64, 64); for (const a of as) T.contactShadow(k, 32, 32, 30, 10, a); return c.toDataURL(); };
      const one = draw([0.4996]), two = (draw([0.5004]), draw([0.4996]));
      return {dir, same: one === two};
    }"""
    out = _page_eval(PAINTED, lambda page: page.evaluate(js))
    assert abs(out["dir"] - 30.96) < 0.1, out
    assert out["same"], out
