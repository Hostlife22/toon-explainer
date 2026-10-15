"""burn / swarm / squeeze / carry transitions, crack / petrify overlays, title arc, and the vertical-format fixes
(strip-only drawing, text shrink-to-fit, pinned fx on world targets, panels of vertical shots)."""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from spec import validate  # noqa: E402

pytest.importorskip("playwright")
Image = pytest.importorskip("PIL.Image")


def _stills(tmp: Path, spec: dict, times: str, name: str = "s") -> list[Path]:
    p = tmp / f"{name}.json"
    p.write_text(json.dumps(spec))
    out = tmp / name
    r = subprocess.run([sys.executable, str(ROOT / "scripts" / "render.py"), str(p), "--stills", times, "--scale", "0.25", "--out", str(out)],
                       capture_output=True, text=True)
    assert r.returncode == 0, r.stdout[-800:] + r.stderr[-800:]
    return sorted(out.glob("*.png"))


def _pair(kind: dict, fmt: str | None = None) -> dict:
    spec = {"style": {"vignette": False, "grain": False}, "shots": [
        {"id": "a", "dur": 1, "bg": {"kind": "flat", "color": "#ff0000"}},
        {"id": "b", "dur": 1.5, "transition": kind, "bg": {"kind": "flat", "color": "#0000ff"}}]}
    if fmt:
        spec["format"] = fmt
    return spec


@pytest.mark.parametrize("tr", [{"kind": "burn"}, {"kind": "burn", "from": "left"}, {"kind": "swarm"}, {"kind": "swarm", "creature": "bird", "dir": -1},
                                {"kind": "squeeze"}, {"kind": "squeeze", "axis": "vertical"}, {"kind": "carry", "from": [0.6, 0.1, 0.2, 0.3], "to": [0.1, 0.6, 0.2, 0.3], "round": True}],
                         ids=lambda t: t["kind"] + "-" + "-".join(str(v) for k, v in t.items() if k != "kind"))
def test_new_transitions_start_on_a_and_end_on_b(tmp_path, tr):
    spec = _pair(tr)
    assert validate(spec) == []
    first, last = _stills(tmp_path, spec, "1.0,2.4")
    for path, (want_red, want_blue) in ((first, (True, False)), (last, (False, True))):
        r, _, b = Image.open(path).convert("RGB").getpixel((5, 5))
        assert (r > 150) == want_red and (b > 150) == want_blue, (path.name, r, b)


def test_transition_enum_errors_are_reported(tmp_path):
    spec = _pair({"kind": "burn", "from": "diagonal"})
    p = tmp_path / "bad.json"
    p.write_text(json.dumps(spec))
    r = subprocess.run([sys.executable, str(ROOT / "scripts" / "render.py"), str(p), "--stills", "1.2", "--scale", "0.25", "--out", str(tmp_path / "o")],
                       capture_output=True, text=True)
    assert r.returncode != 0 and "burn.from" in (r.stdout + r.stderr)


def test_crack_petrify_and_title_arc_render(tmp_path):
    spec = {"shots": [{"id": "a", "dur": 3, "bg": {"kind": "city"}, "layers": [
        {"type": "bean", "x": 0.5, "y": 0.95, "size": 500},
        {"type": "fx", "kind": "crack", "x": 0.5, "y": 0.4, "size": 300, "at": 0.2},
        {"type": "fx", "kind": "petrify", "at": 0.5, "stage2": 1.5},
        {"type": "title", "text": "ARCHED", "x": 0.5, "y": 0.2, "arc": 60}]}]}
    assert validate(spec) == []
    before, after = _stills(tmp_path, spec, "0.1,2.8")
    np = pytest.importorskip("numpy")
    def sat(path):
        return float(np.asarray(Image.open(path).convert("HSV"))[..., 1].mean())
    assert sat(after) < sat(before) * 0.6  # the stone wash drains the colour


def test_vertical_text_shrinks_to_the_strip(tmp_path):
    spec = {"format": "vertical", "style": {"vignette": False, "grain": False}, "shots": [{"id": "a", "dur": 1, "bg": {"kind": "flat", "color": "#000000"},
        "pinned": [{"type": "label", "text": "A VERY LONG NAME THAT WOULD OVERFLOW", "x": 0.5, "y": 0.5, "size": 90, "color": "#ffffff", "at": 0, "enter": "none"}]}]}
    img = Image.open(_stills(tmp_path, spec, "0.8")[0]).convert("L")
    w, h = img.size
    row = [img.getpixel((x, y)) for y in range(h // 2 - 15, h // 2 + 15) for x in (0, 1, w - 2, w - 1)]
    assert max(row) < 60  # nothing white touches the side edges
    assert max(img.getpixel((x, h // 2)) for x in range(w)) > 200  # but the text is there


def test_pinned_fx_can_target_a_world_layer_and_follows_it(tmp_path):
    base = {"format": "vertical", "style": {"vignette": False, "grain": False}, "shots": [{"id": "s", "dur": 2, "frame": 0.25, "camera": {"zoom": [1, 1]},
            "bg": {"kind": "flat", "color": "#000000"}, "layers": [{"type": "bean", "id": "hero", "x": 0.25, "y": 0.9, "size": 420}]}]}
    pinned = json.loads(json.dumps(base))
    pinned["shots"][0]["pinned"] = [{"type": "fx", "kind": "marks", "mark": "zzz", "target": "hero"}]
    world = json.loads(json.dumps(base))
    world["shots"][0]["layers"].append({"type": "fx", "kind": "marks", "mark": "zzz", "target": "hero"})
    assert validate(pinned) == []
    a = _stills(tmp_path, pinned, "1.5", "p")[0].read_bytes()
    b = _stills(tmp_path, world, "1.5", "w")[0].read_bytes()
    assert a == b


def test_panel_shows_a_vertical_shot_as_framed(tmp_path):
    spec = {"format": "vertical", "style": {"vignette": False, "grain": False}, "shots": [
        {"id": "src", "dur": 1, "frame": 0.2, "camera": {"zoom": [1, 1]}, "bg": {"kind": "flat", "color": "#000000"},
         "layers": [{"type": "prop", "kind": "coin", "x": 0.2, "y": 0.5, "size": 300}]},
        {"id": "p", "dur": 1, "bg": {"kind": "flat", "color": "#000000"},
         "layers": [{"type": "panel", "layout": "frame", "frame": "none", "cells": [{"shot": "src", "t": 0.5, "rect": [0.342, 0.0, 0.316, 1.0]}]}]}]}
    img = Image.open(_stills(tmp_path, spec, "1.5")[0]).convert("RGB")
    w, h = img.size
    r, g, _ = img.getpixel((w // 2, h // 2))
    assert r > 150 and g > 100  # the gold coin from the source's frame sits in the middle of the cell


@pytest.mark.parametrize("layer, message", [
    ({"type": "fx", "kind": "pile", "prop": "con"}, "pile prop"),
    ({"type": "prop", "kind": "iso-tile", "building": "hut"}, "iso-tile building"),
    ({"type": "prop", "kind": "coin", "xray": {"inner": "con"}}, "xray inner"),
    ({"type": "doc", "kind": "chat", "messages": {}}, "chat messages"),
    ({"type": "doc", "kind": "tierlist", "rows": [None]}, "tierlist rows"),
    ({"type": "prop", "kind": "coin-gavel", "strike": 1}, "coin-gavel strike"),
    ({"type": "map", "morphs": [{"from": [[0, 0], None], "to": [[0, 0], [1, 1]]}]}, "map morphs"),
    ({"type": "fx", "kind": "glitch", "style": "melt"}, "glitch style"),
    ({"type": "fx", "kind": "pile", "swap": [{"at": 1, "prop": "con"}]}, "pile prop"),
    ({"type": "fx", "kind": "rays", "swap": [{"at": 0.2, "kind": "pile"}, {"at": 0.4, "prop": "con"}]}, "pile prop"),
    ({"type": "fx", "kind": "pile", "prop": []}, "pile prop"),
    ({"type": "map", "morphs": 1}, "map morphs"),
    ({"type": "map", "throws": [{"from": [0, 0], "to": [1, 1], "icon": "con"}]}, "map throws icon"),
    ({"type": "prop", "kind": "claw-crane", "load": "crown"}, "claw-crane load"),
    ({"type": "prop", "kind": "meat-grinder", "feed": "con"}, "meat-grinder feed"),
    ({"type": "bean", "smear": {"at": "x"}}, "smear must be"),
    ({"type": "map", "tokens": [{"pts": [[0, 0], [1, 1]], "drops": {"icon": "con"}}]}, "drops icon"),
    ({"type": "bean", "smear": {}}, "smear must be"),
    ({"type": "prop", "kind": "meat-grinder", "crank": [None]}, "crank must be"),
    ({"type": "map", "tokens": [{"pts": [[0.2, 0.5], [0.8, 0.5]], "drops": {"every": 0}}]}, "drops every"),
    ({"type": "map", "tokens": 42}, "tokens must be a list"),
    ({"type": "map", "camps": {"pts": [[0, 0]], "drops": {"icon": "con"}}}, "drops icon"),
    ({"type": "prop", "kind": "cobweb", "corner": "middle"}, "cobweb corner"),
    ({"type": "prop", "kind": "region", "pts": [[0, 0], [1, 1]]}, "region pts"),
])
def test_validator_checks_new_fields(layer, message):
    errors = validate({"shots": [{"id": "a", "dur": 1, "layers": [layer]}]})
    assert any(message in e for e in errors), errors


def test_validator_checks_new_transition_enums_and_pinned_target_lists():
    tr = validate({"shots": [{"id": "a", "dur": 1}, {"id": "b", "dur": 1, "transition": {"kind": "swarm", "creature": "moth"}}]})
    assert any("swarm.creature" in e for e in tr), tr
    mixed = validate({"shots": [{"id": "a", "dur": 1, "layers": [{"type": "bean", "id": "w"}],
                                 "pinned": [{"type": "bean", "id": "p"}, {"type": "fx", "kind": "shock", "target": "w", "swap": [{"at": 1, "target": "p"}]}]}]})
    assert any("mix world layers and pinned layers" in e for e in mixed), mixed


def test_pinned_follow_reaches_world_layer_and_redeyes_close_zero(tmp_path):
    spec = {"shots": [{"id": "a", "dur": 1, "bg": {"kind": "void"}, "layers": [{"type": "bean", "id": "hero", "x": 0.5, "y": 0.95, "size": 400}],
                       "pinned": [{"type": "fx", "kind": "lightpool", "follow": "hero"}]},
                      {"id": "b", "dur": 1, "bg": {"kind": "flat", "color": "#000000"}, "layers": [{"type": "fx", "kind": "redeyes", "x": 0.5, "y": 0.5, "close": 0, "size": 60}]}]}
    assert validate(spec) == []
    img = Image.open(_stills(tmp_path, spec, "0.5,1.95")[1]).convert("RGB")
    assert max(px[0] for px in [img.getpixel((x, img.height // 2)) for x in range(img.width)]) < 60  # close: 0 means closing from 0 over 0.8 s


def test_vertical_tear_glitch_does_not_depend_on_render_order(tmp_path):
    spec = {"format": "vertical", "shots": [
        {"id": "a", "dur": 1, "bg": {"kind": "flat", "color": "#ff0000"}, "layers": [{"type": "fx", "kind": "glitch", "looks": ["tear"], "dur": 1}]},
        {"id": "b", "dur": 1, "frame": 0.44, "bg": {"kind": "flat", "color": "#0000ff"}}]}
    first = _stills(tmp_path, spec, "0.2", "x")[0].read_bytes()
    again = _stills(tmp_path, spec, "1.5,0.2", "y")
    assert [p for p in again if p.name.startswith("t0000.20")][0].read_bytes() == first


def test_odd_types_return_errors_and_fx_chains_in_pinned_render(tmp_path):
    bad = {"shots": [{"id": "a", "dur": 1}, {"id": "b", "dur": 1, "transition": {"kind": "burn", "from": []}, "layers": [{"type": "fx", "kind": "pile", "swap": 1}]}]}
    errors = validate(bad)
    assert any("burn.from" in e for e in errors) and any("swap must be a list" in e for e in errors), errors
    chain = {"shots": [{"id": "s", "dur": 1, "bg": {"kind": "void"}, "layers": [{"type": "bean", "id": "w", "x": 0.5, "y": 0.95, "size": 400}],
                        "pinned": [{"type": "fx", "id": "lamp", "kind": "lightpool", "follow": "w"}, {"type": "fx", "kind": "shock", "target": "lamp", "at": 0.3}]}]}
    assert validate(chain) == []
    assert _stills(tmp_path, chain, "0.6")


def test_vertical_fg_pass_meter_and_camcorder(tmp_path):
    spec = _pair({"kind": "fg-pass", "axis": "vertical", "dur": 0.9})
    spec["shots"][0]["layers"] = [{"type": "hud", "kind": "meter", "orient": "vertical", "value": 0.8, "label": "FUEL"},
                                  {"type": "fx", "kind": "cctv", "variant": "camcorder", "start": 65}]
    assert validate(spec) == []
    assert any("fg-pass.axis" in e for e in validate(_pair({"kind": "fg-pass", "axis": "diagonal"})))
    first, last = _stills(tmp_path, spec, "0.5,2.3")
    r, _, b = Image.open(last).convert("RGB").getpixel((5, 5))
    assert b > 150 and r < 100  # the rise has uncovered B
    assert Image.open(first).convert("RGB").getpixel((5, 5))[0] > 150


def test_vertical_meter_default_anchor_is_inside_the_strip(tmp_path):
    spec = {"format": "vertical", "style": {"vignette": False, "grain": False}, "shots": [{"id": "a", "dur": 1, "bg": {"kind": "flat", "color": "#000000"},
        "layers": [{"type": "hud", "kind": "meter", "orient": "vertical", "value": 1, "style": "solid", "color": "#00ff00"}]}]}
    img = Image.open(_stills(tmp_path, spec, "0.8")[0]).convert("RGB")
    assert any(img.getpixel((x, y))[1] > 150 and img.getpixel((x, y))[0] < 100 for x in range(img.width // 3) for y in range(0, img.height, 4))


def test_blueprint_erase_carousel_snap_grid_and_hatch(tmp_path):
    np = pytest.importorskip("numpy")
    spec = {"style": {"vignette": False, "grain": False}, "shots": [
        {"id": "bp", "dur": 2, "camera": {"zoom": [1, 1]}, "bg": {"kind": "blueprint", "clear": [1.0], "sketch": [{"line": [[0.1, 0.5], [0.9, 0.5]], "at": 0, "dur": 0.2}]}},
        {"id": "car", "dur": 1, "layers": [{"type": "doc", "kind": "carousel", "snap": True, "items": [{"prop": "sword", "label": "A"}, {"prop": "bomb", "label": "B"}],
                                            "select": [{"at": 0.3, "i": 1}]}]},
        {"id": "gr", "dur": 1, "bg": {"kind": "grid", "speed": 2}},
        {"id": "h", "dur": 1, "bg": {"kind": "forest"}, "layers": [{"type": "fx", "kind": "hatch", "wash": "#ffd6e0", "washAt": 0.3, "from": "all"}]}]}
    assert validate(spec) == []
    drawn, wiped, *_ = _stills(tmp_path, spec, "0.5,1.5,2.4,3.5,4.9")
    def chalk(path):  # near-white pixels on the middle row of the sheet
        row = np.asarray(Image.open(path).convert("RGB"))
        mid = row[row.shape[0] // 2 - 2: row.shape[0] // 2 + 3]
        return int(((mid > 220).all(axis=2)).sum())
    assert chalk(drawn) > 50 and chalk(wiped) < 5


def test_cobweb_banana_peel_and_region_render(tmp_path):
    spec = {"shots": [{"id": "a", "dur": 1, "bg": {"kind": "interior"}, "layers": [
        {"type": "prop", "kind": "cobweb", "x": 0.1, "y": 0.2, "size": 300, "corner": "tl", "spider": True},
        {"type": "prop", "kind": "banana-peel", "x": 0.3, "y": 0.9, "size": 240},
        {"type": "prop", "kind": "region", "x": 0.6, "y": 0.5, "size": 400, "face": "angry", "label": "X", "material": "gold"}]}]}
    assert validate(spec) == []
    assert _stills(tmp_path, spec, "0.5")
