"""Camera & acting (painted engine phase 4): shot-size framing of a target layer, over-the-shoulder, low / high angle,
moves (zoom keys with settle, handheld, whip with streak, rack focus, dolly zoom, follow with lag, orbit, roll), layer
`dist`, the acting director (lookAt, reaction takes, blink on cut, fidgets, expression kicks) and animating on twos."""
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
CATALOG = ROOT / "examples" / "camera_acting" / "spec.json"
BENCH = ROOT / "examples" / "painted_bench" / "spec.json"


def _bean(**kw):
    out = {"type": "bean", "id": "hero", "who": "hero", "x": 0.4, "y": 0.9, "size": 420}
    out.update(kw)
    return out


def _spec(layers, camera=None, look="painted", dur=3, **shot):
    s = {"id": "a", "dur": dur, "bg": {"kind": "sky"}, "layers": layers, **shot}
    if camera is not None:
        s["camera"] = camera
    return {"seed": 5, "style": {"look": look} if look else {}, "cast": {"hero": {"robe": "#3a6ea5"}, "pal": {"robe": "#a33"}},
            "shots": [s]}


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


# Camera at shot time t for shot 0, plus where world points land on screen through plane factor f.
CAM_JS = """([t, pts]) => {
  const T = TOON, shot = T.film.timeline.shots[0], cam = T.cameraAt(shot.camera, t, shot.dur, shot);
  const g = document.createElement('canvas').getContext('2d');
  const at = (p) => { g.setTransform(1, 0, 0, 1, 0, 0); T.applyCam(g, cam, p[2] ?? 1); const m = g.getTransform();
    const q = m.transformPoint(new DOMPoint(p[0], p[1])); return [q.x, q.y, Math.hypot(m.a, m.b), Math.hypot(m.c, m.d)]; };
  return { z: cam.z, rot: cam.rot, sx: cam.sx, sy: cam.sy, streak: cam.streak || null, pts: pts.map(at) };
}"""


def _cam(spec: dict, queries):
    return _page_eval(spec, lambda page: [page.evaluate(CAM_JS, q) for q in queries])


# ---------- validation ----------
GOOD_CAMERAS = [
    {"frame": {"target": "hero", "size": "cu"}},
    {"frame": [{"at": 0, "target": "hero", "size": "ws"}, {"at": 1, "target": "pal", "size": "mcu", "dur": 0.5, "overshoot": 0.2, "rack": True},
               {"at": 2, "target": "hero", "size": "ecu", "whip": True}, {"at": 2.5, "point": [0.5, 0.4], "zoom": 1.5, "ease": "outSettle"}]},
    {"frame": {"target": "hero", "size": "mcu", "ots": "pal", "place": [0.6, 0.45]}},
    {"follow": "hero"},
    {"follow": {"target": "hero", "lag": 0.4, "size": "ws", "axis": "x"}},
    {"handheld": True, "angle": "low", "roll": [{"at": 0, "v": 0}, {"at": 2, "v": -4, "ease": "inOut"}]},
    {"handheld": {"amp": 8, "hz": 0.7, "rot": 0.4, "at": 0.5, "dur": 2}, "angle": -0.5},
    {"dollyzoom": {"at": 0.2, "dur": 2, "amount": 0.4, "target": "hero"}, "orbit": {"amount": 140, "dur": 2}},
    {"zoom": [{"at": 0, "v": 1}, {"at": 1, "v": 1.6, "ease": "outSettle"}], "angle": [{"at": 0, "v": 0}, {"at": 1, "v": 1}]},
]


@pytest.mark.parametrize("camera", GOOD_CAMERAS)
def test_camera_fields_validate(camera):
    spec = _spec([_bean(), _bean(id="pal", who="pal", x=0.7)], camera=copy.deepcopy(camera))
    assert validate(spec) == []


@pytest.mark.parametrize("camera,needle", [
    ({"frame": {"target": "hero", "size": "huge"}}, "size"),
    ({"frame": {"target": "nobody", "size": "cu"}}, "target"),
    ({"frame": {"size": "cu"}}, "target"),
    ({"frame": [{"at": "soon", "target": "hero"}]}, "frame"),
    ({"frame": {"target": "hero", "overshoot": 3}}, "overshoot"),
    ({"frame": {"target": "hero", "ots": "ghost"}}, "ots"),
    ({"frame": {"target": "hero", "ease": "wobbly"}}, "ease"),
    ({"follow": {"lag": 0.3}}, "follow"),
    ({"follow": "hero", "frame": {"target": "hero"}}, "follow"),
    ({"handheld": "lots"}, "handheld"),
    ({"angle": "sideways"}, "angle"),
    ({"angle": 3}, "angle"),
    ({"dollyzoom": {"amount": "big"}}, "dollyzoom"),
    ({"roll": "left"}, "roll"),
    ({"zoom": [{"at": 0, "v": "far"}]}, "zoom"),
])
def test_bad_camera_values_are_reported(camera, needle):
    spec = _spec([_bean(), _bean(id="pal", who="pal", x=0.7)], camera=camera)
    errors = "\n".join(validate(spec))
    assert needle in errors, errors


@pytest.mark.parametrize("field,value,needle", [
    ("lookAt", "nobody", "lookAt"),
    ("lookAt", [{"at": 0, "v": "nobody"}], "lookAt"),
    ("lookAt", {"x": "left"}, "lookAt"),
    ("takes", [{"at": 1, "kind": "triple"}], "take"),
    ("takes", [{"kind": "double"}], "take"),
    ("takes", [{"at": 1, "kind": "snap", "target": "ghost"}], "take"),
    ("onTwos", "yes", "onTwos"),
    ("dist", -1, "dist"),
    ("acting", {"fidget": "often"}, "acting"),
])
def test_bad_acting_values_are_reported(field, value, needle):
    spec = _spec([_bean(**{field: value}), _bean(id="pal", who="pal", x=0.7)])
    errors = "\n".join(validate(spec))
    assert needle in errors, errors


def test_acting_fields_validate():
    hero = _bean(lookAt=[{"at": 0, "v": "pal"}, {"at": 1, "v": [0.9, 0.2]}, {"at": 2, "v": None}],
                 takes=[{"at": 0.5, "kind": "double", "target": "pal", "expr": "shock"}, {"at": 1.5, "kind": "jolt"},
                        {"at": 2, "kind": "snap", "target": "pal"}, {"at": 2.5, "kind": "blink"}],
                 acting={"blink": True, "fidget": True, "react": False}, onTwos=True, dist=1.5)
    spec = _spec([hero, _bean(id="pal", who="pal", x=0.7, lookAt={"target": "hero", "turn": False})], onTwos=12)
    spec["style"]["onTwos"] = True
    assert validate(spec) == []
    bad = copy.deepcopy(spec)
    bad["shots"][0]["onTwos"] = 0
    assert any("onTwos" in e for e in validate(bad))


# ---------- easing ----------
def test_easing_library_has_anticipation_and_settle_curves():
    js = """() => { const E = TOON.ease, s = (f) => Array.from({length: 101}, (_, i) => f(i / 100));
      return Object.fromEntries(['inBack', 'inOutBack', 'outSettle', 'outElastic', 'inCubic'].map((k) => [k, E[k] ? s(E[k]) : null])); }"""
    out = _page_eval(_spec([_bean()]), lambda page: page.evaluate(js))
    for name, vals in out.items():
        assert vals is not None, name
        assert abs(vals[0]) < 1e-9 and abs(vals[-1] - 1) < 1e-9, name
    assert min(out["inBack"]) < -0.05, "inBack anticipates (goes below 0)"
    assert min(out["inOutBack"]) < -0.02 and max(out["inOutBack"]) > 1.02
    assert max(out["outSettle"]) > 1.08 and max(out["outElastic"]) > max(out["outSettle"])


# ---------- shot sizes ----------
def test_shot_sizes_frame_the_targets_head_and_body():
    head = [0.4 * 1920, 0.9 * 1080 - 450 * 0.7]  # size 420 -> 0.7 rig scale, head centre 450 units above the feet
    zs = {}
    for size in ("ecu", "cu", "mcu", "ms", "ws"):
        spec = _spec([_bean()], camera={"frame": {"target": "hero", "size": size, "clamp": False}})
        (res,) = _cam(spec, [[1.0, [head]]])
        zs[size] = res["z"]
        if size in ("cu", "ecu"):
            x, y = res["pts"][0][:2]
            assert abs(x - 960) < 3 and abs(y - 540) < 60, (size, x, y)
    assert zs["ecu"] > zs["cu"] > zs["mcu"] > zs["ms"] > zs["ws"] > 1, zs
    assert 1080 / zs["cu"] < 0.7 * 604 < 1080 / zs["ws"], "a close-up crops the figure, a wide shot shows all of it"


def test_framing_is_clamped_to_the_world_and_place_moves_the_subject():
    spec = _spec([_bean(x=0.05, y=0.95)], camera={"frame": {"target": "hero", "size": "ms"}})
    (res,) = _cam(spec, [[1.0, [[0, 0], [1920, 1080]]]])
    (x0, y0, *_), (x1, y1, *_) = res["pts"]
    assert x0 <= 0.5 and y0 <= 0.5 and x1 >= 1919.5 and y1 >= 1079.5, "clamped framing never shows past the world edge"
    placed = _spec([_bean()], camera={"frame": {"target": "hero", "size": "cu", "place": [0.35, 0.5], "clamp": False}})
    (res,) = _cam(placed, [[1.0, [[0.4 * 1920, 0.9 * 1080 - 450 * 0.7]]]])
    assert abs(res["pts"][0][0] - 0.35 * 1920) < 3


def test_frame_keys_dolly_with_overshoot_and_settle():
    keys = [{"at": 0, "target": "hero", "size": "ws"}, {"at": 1, "target": "hero", "size": "cu", "dur": 0.6, "overshoot": 0.25}]
    spec = _spec([_bean()], camera={"frame": keys})
    ts = [0.5, 1.0] + [1 + i / 30 for i in range(1, 40)]
    res = _cam(spec, [[t, []] for t in ts])
    zs = [r["z"] for r in res]
    end = zs[-1]
    assert abs(zs[0] - zs[1]) < 1e-6 and zs[0] < end
    assert max(zs) > end * 1.05, "the push overshoots the close-up"
    assert abs(zs[-1] - zs[-2]) < end * 0.01, "and settles"
    plain = _spec([_bean()], camera={"frame": [keys[0], {**keys[1], "overshoot": 0}]})
    assert max(r["z"] for r in _cam(plain, [[t, []] for t in ts])) <= end * 1.001


def test_zoom_keys_take_easings():
    spec = _spec([_bean()], camera={"zoom": [{"at": 0, "v": 1}, {"at": 1, "v": 1.5, "ease": "outSettle"}]})
    zs = [r["z"] for r in _cam(spec, [[t, []] for t in (0, 0.3, 0.45, 1.0, 2.0)])]
    assert zs[0] == 1 and max(zs) > 1.5 and abs(zs[-1] - 1.5) < 1e-6


# ---------- moves ----------
def test_handheld_is_a_bounded_pure_function_of_time():
    spec = _spec([_bean()], camera={"handheld": {"amp": 8, "rot": 0.4}, "zoom": [1.1, 1.1]})
    a = _cam(spec, [[t, []] for t in (0.3, 0.9, 1.7, 0.9)])
    assert a[1] == a[3], "same time, same camera"
    offs = [(r["sx"], r["sy"], r["rot"]) for r in a]
    assert len({o for o in offs}) == 3
    assert all(abs(x) <= 8.01 and abs(y) <= 8.01 and abs(r) <= 0.41 * 3.1416 / 180 for x, y, r in offs)
    calm = _spec([_bean()], camera={"zoom": [1.1, 1.1]})
    assert all(r["sx"] == 0 and r["rot"] == 0 for r in _cam(calm, [[0.9, []]]))


def test_whip_pans_between_targets_with_a_streak():
    layers = [_bean(x=0.2), _bean(id="pal", who="pal", x=0.8)]
    cam = {"frame": [{"at": 0, "target": "hero", "size": "mcu"}, {"at": 1, "target": "pal", "size": "mcu", "whip": True, "dur": 0.25}]}
    spec = _spec(layers, camera=cam)
    hero, pal = [0.2 * 1920, 0.9 * 1080 - 420], [0.8 * 1920, 0.9 * 1080 - 420]
    before, mid, after = _cam(spec, [[0.9, [hero, pal]], [1.12, [hero, pal]], [1.5, [hero, pal]]])
    assert abs(before["pts"][0][0] - 960) < 80 and abs(after["pts"][1][0] - 960) < 80
    assert before["streak"] is None and after["streak"] is None
    assert mid["streak"] and abs(mid["streak"][0]) > 20, mid["streak"]
    frames = _frames(spec, [1.12])
    plain = copy.deepcopy(spec)
    plain["shots"][0]["camera"]["frame"][1]["whip"] = False
    plain["shots"][0]["camera"]["frame"][1]["ease"] = "inOut"
    assert frames != _frames(plain, [1.12]), "the whip draws a motion streak"


def test_rack_focus_keys_come_from_frame_keys():
    layers = [_bean(x=0.3), _bean(id="pal", who="pal", x=0.7)]
    cam = {"frame": [{"at": 0, "target": "hero", "size": "ms", "rack": True}, {"at": 1.5, "target": "pal", "size": "ms", "rack": 6, "dur": 0.4}]}
    js = """() => { const s = TOON.film.timeline.shots[0]; return TOON.focusKeysOf(s); }"""
    keys = _page_eval(_spec(layers, camera=cam), lambda page: page.evaluate(js))
    assert [k["on"] for k in keys] == ["hero", "pal"] and keys[1]["px"] == 6 and keys[1]["at"] == 1.5


def test_dolly_zoom_keeps_the_subject_and_moves_the_background():
    spec = _spec([_bean()], camera={"dollyzoom": {"at": 0, "dur": 2, "amount": 0.5, "target": "hero"}, "zoom": [1.2, 1.2]})
    start, end = _cam(spec, [[0, [[0, 0, 1], [0, 0, 0.3], [0, 0, 1.4]]], [2, [[0, 0, 1], [0, 0, 0.3], [0, 0, 1.4]]]])
    subj0, bg0, fg0 = (p[2] for p in start["pts"])
    subj1, bg1, fg1 = (p[2] for p in end["pts"])
    assert abs(subj1 - subj0) < 1e-6
    assert bg1 < bg0 * 0.9 and fg1 > fg0 * 1.05, (bg0, bg1, fg0, fg1)


def test_follow_lags_behind_a_moving_target_and_catches_up():
    mover = _bean(move=[{"at": 0.5, "dur": 1.0, "to": [0.8, 0.9], "ease": "linear"}], x=0.2)
    spec = _spec([mover], camera={"follow": {"target": "hero", "lag": 0.3, "size": "ws"}}, dur=4)
    res = _cam(spec, [[t, [[0, 0]]] for t in (0.2, 1.0, 3.5)])

    def centre(r):  # world x under the screen centre: the inverse of x -> x * s + tx
        s, tx = r["pts"][0][2], r["pts"][0][0]
        return (960 - tx) / s

    c0, c1, c2 = (centre(r) for r in res)
    target_mid = (0.2 + 0.6 * 0.5) * 1920
    assert c1 < target_mid - 40, ("the camera lags", c1, target_mid)
    assert abs(c2 - 0.8 * 1920) < 60 or c2 > c1 + 300, ("and catches up", c0, c1, c2)


def test_orbit_slides_planes_in_opposite_directions():
    spec = _spec([_bean()], camera={"orbit": {"at": 0, "dur": 2, "amount": 150}, "zoom": [1.2, 1.2]})
    a, b = _cam(spec, [[0, [[960, 540, 0.3], [960, 540, 1], [960, 540, 1.4]]], [2, [[960, 540, 0.3], [960, 540, 1], [960, 540, 1.4]]]])
    d = [b["pts"][i][0] - a["pts"][i][0] for i in range(3)]
    assert abs(d[1]) < 1e-6 and d[0] * d[2] < 0, d


def test_low_and_high_angles_shift_the_background_and_loom_the_subject():
    def run(angle):
        spec = _spec([_bean()], camera={"angle": angle, "zoom": [1, 1]})
        return _cam(spec, [[1, [[960, 500, 0.3], [960, 900, 1]]]])[0]["pts"]
    flat, low, high = run(0), run("low"), run("high")
    assert low[0][1] > flat[0][1] + 20 and high[0][1] < flat[0][1] - 20, "the horizon drops for a low angle"
    assert low[1][3] > flat[1][3] > high[1][3], "the subject looms in a low angle"


def test_roll_eases_between_keys():
    spec = _spec([_bean()], camera={"roll": [{"at": 0, "v": 0}, {"at": 2, "v": -6, "ease": "inOut"}]})
    rots = [r["rot"] for r in _cam(spec, [[t, []] for t in (0, 1, 2)])]
    assert rots[0] == 0 and -0.06 < rots[1] < -0.04 and abs(rots[2] + 6 * 3.14159 / 180) < 1e-4


def test_layer_dist_sets_parallax_and_haze():
    js = """() => [TOON.layerZ({dist: 2}), TOON.layerZ({dist: 0.5}), TOON.layerZ({z: 0.7, dist: 3}), TOON.layerZ({})]"""
    assert _page_eval(_spec([_bean()]), lambda page: page.evaluate(js)) == [0.5, 2, 0.7, 1]
    near = _spec([{"type": "prop", "kind": "barrel", "x": 0.5, "y": 0.8, "size": 300}])
    far = copy.deepcopy(near)
    far["shots"][0]["layers"][0]["dist"] = 3
    assert _frames(near, [1]) != _frames(far, [1])


# ---------- over the shoulder ----------
def test_ots_adds_a_blurred_foreground_shoulder_and_hides_the_listener():
    layers = [_bean(x=0.35), _bean(id="pal", who="pal", x=0.7)]
    cam = {"frame": [{"at": 0, "target": "hero", "size": "mcu", "ots": "pal"}, {"at": 1.5, "target": "pal", "size": "mcu", "ots": "hero"}]}
    js = """(t) => TOON.shotLayers(TOON.film.timeline.shots[0], t).map((L) => [L.type, L.kind || null, L.id || null, L.who || null, L.hud || false, L.side || null, !!L.blur])"""
    early, late = _page_eval(_spec(layers, camera=cam), lambda page: [page.evaluate(js, t) for t in (0.5, 2.0)])
    assert ["bean", None, "pal", "pal", False, None, False] not in early, "the listener is replaced by the shoulder"
    ots = [L for L in early if L[1] == "ots"]
    assert ots and ots[0][3] == "pal" and ots[0][4] and ots[0][5] == "right" and ots[0][6], early
    ots2 = [L for L in late if L[1] == "ots"]
    assert ots2 and ots2[0][3] == "hero" and ots2[0][5] == "left", late
    (res,) = _cam(_spec(layers, camera=cam), [[0.5, [[0.35 * 1920, 0.9 * 1080 - 420]]]])
    assert res["pts"][0][0] < 960, "the speaker is placed opposite the listener's shoulder"


# ---------- acting director ----------
PROBE_JS = "(ts) => ts.map((t) => { TOON.RIG_PROBE = {}; window.renderFrame(t); const p = TOON.RIG_PROBE; TOON.RIG_PROBE = null; return JSON.parse(JSON.stringify(p)); })"


def _probe(spec, times):
    return _page_eval(spec, lambda page: page.evaluate(PROBE_JS, times))


def test_look_at_turns_the_character_toward_the_target():
    layers = [_bean(x=0.7, lookAt=[{"at": 0, "v": "pal"}, {"at": 1.5, "v": [0.95, 0.1]}]), _bean(id="pal", who="pal", x=0.2)]
    p = _probe(_spec(layers), [1.0, 2.5])
    assert p[0]["hero"]["facing"] == -1, "pal stands on the left"
    assert p[1]["hero"]["facing"] == 1 and p[1]["hero"]["tilt"] < -2, "looking up and right"
    still = _probe(_spec([_bean(x=0.7), _bean(id="pal", who="pal", x=0.2)]), [1.0])
    assert still[0]["hero"]["facing"] == 1


def test_look_at_head_snap_overshoots():
    layers = [_bean(x=0.5, lookAt=[{"at": 0, "v": [0.9, 0.9]}, {"at": 1, "v": [0.9, 0.0]}]), _bean(id="pal", who="pal", x=0.2)]
    ts = [0.9] + [1 + i / 30 for i in range(1, 30)]
    tilts = [p["hero"]["tilt"] for p in _probe(_spec(layers), ts)]
    assert min(tilts) < tilts[-1] - 0.5, ("the head snaps past its new angle", tilts)


def test_double_take_turns_away_then_back_with_a_shock():
    layers = [_bean(x=0.5, takes=[{"at": 1, "kind": "double", "target": "pal"}]), _bean(id="pal", who="pal", x=0.15)]
    ts = [0.9, 1.1, 1.45, 1.8, 2.5]
    facings = [p["hero"]["facing"] for p in _probe(_spec(layers), ts)]
    assert facings == [1, -1, 1, -1, -1], facings


def test_jolt_take_hops_and_blink_on_cut():
    layers = [_bean(x=0.5, takes=[{"at": 1, "kind": "jolt"}])]
    p = _probe(_spec(layers), [0.1, 0.5, 1.08])
    assert p[0]["hero"]["blink"] and not p[1]["hero"]["blink"], "painted beans blink just after the cut"
    assert p[2]["hero"]["hop"] > 5
    classic = _probe(_spec([_bean(x=0.5)], look=None), [0.1])
    assert not classic[0]["hero"]["blink"]


def test_expression_change_kicks_the_head_and_idle_fidgets():
    layers = [_bean(x=0.5, expr=[{"at": 0, "v": "neutral"}, {"at": 1, "v": "angry"}])]
    p = _probe(_spec(layers), [0.95, 1.08])
    assert abs(p[1]["hero"]["tilt"] - p[0]["hero"]["tilt"]) > 1.5
    idle = _spec([_bean(x=0.5, acting={"fidget": True})], dur=12)
    gaze = [q["hero"]["gaze"] for q in _probe(idle, [i * 0.25 for i in range(48)])]
    assert len({round(g) for g in gaze}) > 2, "fidgets glance around in long idle holds"
    calm = _spec([_bean(x=0.5, acting={"fidget": False})], dur=12)
    assert all(q["hero"]["gaze"] == 0 for q in _probe(calm, [i * 0.5 for i in range(24)]))


# ---------- on twos ----------
def test_on_twos_steps_characters_but_not_the_camera():
    mover = _bean(move=[{"at": 0, "dur": 2, "to": [0.8, 0.9], "ease": "linear"}], x=0.2)
    still_cam = {"zoom": [1, 1]}
    flat = {"kind": "flat", "color": "#8a7a66"}  # a still background: only the character moves
    twos = _spec([copy.deepcopy(mover)], camera=still_cam, onTwos=True, bg=flat)
    ones = _spec([copy.deepcopy(mover)], camera=still_cam, bg=flat)
    a = _frames(twos, [1.0, 1.0 + 1 / 30])
    b = _frames(ones, [1.0, 1.0 + 1 / 30])
    assert a[0] == a[1] and b[0] != b[1]
    moving_cam = _spec([copy.deepcopy(mover)], camera={"zoom": [1, 1.3]}, onTwos=True, bg=flat)
    c = _frames(moving_cam, [1.0, 1.0 + 1 / 30])
    assert c[0] != c[1], "the camera stays smooth on ones"
    styled = _spec([copy.deepcopy(mover)], camera=still_cam, bg=flat)
    styled["style"]["onTwos"] = True
    assert _frames(styled, [1.0, 1.0 + 1 / 30]) == a
    opt_out = _spec([{**copy.deepcopy(mover), "onTwos": False}], camera=still_cam, onTwos=True, bg=flat)
    d = _frames(opt_out, [1.0, 1.0 + 1 / 30])
    assert d[0] != d[1]


# ---------- compatibility and catalog ----------
def test_classic_specs_without_new_fields_render_as_before():
    js = """() => { const T = TOON, s = T.film.timeline.shots[0];
      return [T.shotLayers(s, 1) === s.layers, T.focusKeysOf(s) === s.focus, !T.cameraAt(s.camera, 1, s.dur, s).ext]; }"""
    spec = _spec([_bean(), {"type": "fg", "kind": "grass"}], camera={"zoom": [1, 1.1], "punch": [{"at": 1, "amount": 0.1}]}, look=None)
    spec["shots"][0]["focus"] = [{"at": 0, "on": "hero"}]
    assert _page_eval(spec, lambda page: page.evaluate(js)) == [True, True, True]


def test_catalog_validates_and_renders_deterministically():
    spec = json.loads(CATALOG.read_text(encoding="utf-8"))
    assert validate(spec) == []
    ids = [s["id"] for s in spec["shots"]]
    for needle in ("ecu", "cu", "ots", "low", "dolly", "handheld", "whip", "rack", "dollyzoom", "follow", "orbit", "roll",
                   "look", "take", "twos", "dist", "fidget"):
        assert any(needle in i for i in ids), (needle, ids)
    t0, times = 0.0, []
    for s in spec["shots"]:
        times.append(t0 + s["dur"] * 0.6)
        t0 += s["dur"]
    first = _frames(spec, times)
    again = _frames(spec, list(reversed(times)))[::-1]
    assert first == again, "camera_acting frames depend on render order"


def test_painted_bench_uses_shot_sizes():
    spec = json.loads(BENCH.read_text(encoding="utf-8"))
    cams = {s["id"]: s.get("camera", {}) for s in spec["shots"]}

    def keys(c):
        f = c.get("frame")
        return f if isinstance(f, list) else [f] if f else []

    assert any(k.get("size") == "ecu" for k in keys(cams["b06_face"]))
    assert any(k.get("ots") for c in cams.values() for k in keys(c))
    assert cams["b07_vehicle"].get("follow")
    assert cams["b08_crowd"].get("angle") == "low"


def test_density_lint_counts_shot_sizes_and_ots():
    from density import lint
    shot = lambda i, cam: {"id": f"s{i}", "dur": 2, "bg": {"kind": "sky"}, "camera": cam,  # noqa: E731
                           "layers": [_bean(), _bean(id="pal", who="pal", x=0.7), {"type": "fg", "kind": "grass"}, {"type": "prop", "kind": "coin"}]}
    sizes = [{"frame": {"target": "hero", "size": s}} for s in ("ws", "cu", "ecu", "ms")]
    spec = {"shots": [shot(i, c) for i, c in enumerate(sizes)]}
    assert not any("same camera zoom" in w for w in lint(spec))
    same = {"shots": [shot(i, {"frame": {"target": "hero", "size": "cu"}}) for i in range(3)]}
    assert any("same camera zoom" in w for w in lint(same))
    ots = {"shots": [{"id": "o", "dur": 2, "camera": {"frame": {"target": "hero", "ots": "pal"}}, "layers": [_bean(), _bean(id="pal", who="pal")]}]}
    assert not any("no foreground" in w for w in lint(ots))


# ---------- review fixes ----------
def test_dolly_zoom_amount_domain():
    spec = _spec([_bean()], camera={"dollyzoom": {"amount": -1.2}})
    assert any("dollyzoom" in e for e in validate(spec))
    ok = _spec([_bean()], camera={"dollyzoom": {"amount": -0.8, "ease": "outElastic", "dur": 1}, "zoom": [1.2, 1.2]})
    res = _cam(ok, [[t, [[100, 100, 0.3], [100, 100, 1.4]]] for t in (0.1, 0.3, 0.6, 1.0)])
    assert all(all(v == v and abs(v) < 1e6 for p in r["pts"] for v in p) for r in res), "finite scales"


def test_vertical_framing_honours_place_and_clamp():
    spec = _spec([_bean(x=0.01)], camera={"frame": {"target": "hero", "size": "ws"}})
    spec["format"] = "vertical"
    (res,) = _cam(spec, [[1.0, [[0, 540]]]])
    strip_left = 960 - 1080 * 1080 / 1920 / 2
    assert res["pts"][0][0] <= strip_left + 0.5, ("the world edge stays at or left of the strip edge", res["pts"][0][0])
    placed = _spec([_bean(x=0.5)], camera={"frame": {"target": "hero", "size": "cu", "place": [0.3, 0.5], "clamp": False}})
    placed["format"] = "vertical"
    (res,) = _cam(placed, [[1.0, [[960, 0.9 * 1080 - 450 * 0.7]]]])
    assert abs(res["pts"][0][0] - (strip_left + 0.3 * 607.5)) < 4, res["pts"][0][0]


def test_vertical_ots_shoulder_sits_in_the_strip():
    layers = [_bean(x=0.4), _bean(id="pal", who="pal", x=0.6)]
    spec = _spec(layers, camera={"frame": {"target": "hero", "size": "mcu", "ots": "pal"}})
    spec["format"] = "vertical"
    js = "(t) => TOON.shotLayers(TOON.film.timeline.shots[0], t).filter((L) => L.kind === 'ots').map((L) => [L.x, L.scale ?? 1])"
    (o,) = _page_eval(spec, lambda page: page.evaluate(js, 1.0))
    assert abs(o[0] - 0.5) < 0.01 and o[1] < 0.5, o


def test_box_fit_keeps_a_wide_box_whole():
    spec = _spec([_bean()], camera={"frame": {"box": [0.1, 0.45, 0.8, 0.1]}})
    (res,) = _cam(spec, [[1.0, [[0.1 * 1920, 540], [0.9 * 1920, 540]]]])
    assert res["pts"][0][0] >= -1 and res["pts"][1][0] <= 1921, res["pts"]


def test_frame_key_easing_overshoot_is_kept():
    keys = [{"at": 0, "target": "hero", "size": "ws"}, {"at": 1, "target": "hero", "size": "cu", "dur": 0.6, "ease": "outSettle"}]
    zs = [r["z"] for r in _cam(_spec([_bean()], camera={"frame": keys}), [[1 + i / 60, []] for i in range(1, 50)])]
    assert max(zs) > zs[-1] * 1.03, "outSettle passes the framing"


def test_look_at_follows_the_current_flip():
    hero = _bean(x=0.5, lookAt="pal", move=[{"at": 1, "dur": 0.1, "flip": True}])
    p = _probe(_spec([hero, _bean(id="pal", who="pal", x=0.15)]), [0.5, 2.0])
    # pal is on the left: unflipped the rig faces -1; once flipped by move, the rig must face +1 (screen left again)
    assert p[0]["hero"]["facing"] == -1 and p[1]["hero"]["facing"] == 1, p


def test_pinned_layers_step_on_twos():
    mover = _bean(move=[{"at": 0, "dur": 2, "to": [0.8, 0.9], "ease": "linear"}], x=0.2)
    spec = _spec([], camera={"zoom": [1, 1]}, onTwos=True, bg={"kind": "flat", "color": "#8a7a66"}, pinned=[mover])
    a = _frames(spec, [1.0, 1.0 + 1 / 30])
    assert a[0] == a[1]


def test_acting_plan_is_cached_across_transient_copies():
    hero = _bean(x=0.5, lookAt="pal", dist=1.5)
    js = """() => { const T = TOON, s = T.film.timeline.shots[0], L = s.layers[0];
      const env = {shot: s, cast: T.film.spec.cast, style: {}, lt: 1, st: T.layerState(L, 1)};
      T.directBean({...L}, 1, env); const n0 = T.directorCompiles; T.directBean({...L}, 1.1, {...env, shot: {...s}}); return T.directorCompiles - n0; }"""
    assert _page_eval(_spec([hero, _bean(id="pal", who="pal", x=0.15)]), lambda page: page.evaluate(js)) == 0


@pytest.mark.parametrize("camera", [
    {"frame": {"target": [], "size": "cu"}}, {"frame": {"target": "hero", "axis": []}}, {"frame": {"target": "hero", "size": []}},
    {"dollyzoom": {"target": {}}}, {"frame": {"target": "hero", "ots": {"id": "pal", "side": []}}}, {"angle": []},
])
def test_camera_check_reports_wrong_types(camera):
    errors = validate(_spec([_bean(), _bean(id="pal", who="pal", x=0.7)], camera=camera))
    assert errors


@pytest.mark.parametrize("field,value", [("takes", [{"at": 1, "kind": []}]), ("takes", [{"at": 1, "kind": "snap", "target": []}]),
                                          ("takes", [{"at": 1, "kind": "jolt", "expr": []}]), ("lookAt", {"target": []})])
def test_acting_check_reports_wrong_types(field, value):
    assert validate(_spec([_bean(**{field: value})]))


def test_acting_fields_in_swaps_are_checked():
    hero = _bean(swap=[{"at": 1, "takes": {"kind": "blink", "at": 0}}])
    assert any("takes" in e for e in validate(_spec([hero])))
    ok = _bean(swap=[{"at": 1, "lookAt": "pal"}])
    assert validate(_spec([ok, _bean(id="pal", who="pal", x=0.7)])) == []
