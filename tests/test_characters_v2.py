"""Characters 2.0: turnarounds, IK reach and arcs, hand shapes, body acting, gait cycles along paths, spring secondary
motion, close-up faces, lip-sync from a voiceover envelope, painted costume detail."""
from __future__ import annotations

import copy
import json
import math
import struct
import subprocess
import sys
import wave
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from spec import validate  # noqa: E402

GRAB = "async (t)=>{window.renderFrame(t);return window.__canvas.toDataURL('image/png');}"
CATALOG = ROOT / "examples" / "characters_v2" / "spec.json"


def _bean(**kw):
    out = {"type": "bean", "id": "hero", "who": "hero", "x": 0.4, "y": 0.9, "size": 520}
    out.update(kw)
    return out


def _spec(layers, look="painted", dur=3, bg=None):
    return {"seed": 3, "style": {"look": look} if look else {}, "cast": {"hero": {"robe": "#3a6ea5", "hair": "long", "cape": "#a33"}},
            "shots": [{"id": "a", "dur": dur, "bg": bg or {"kind": "sky"}, "layers": layers}]}


# ---------- validation ----------
GOOD_LAYERS = [
    _bean(view=[{"at": 0, "v": "3q"}, {"at": 1, "v": "profile"}, {"at": 2, "v": "back"}], facing=[{"at": 0, "v": "right"}, {"at": 1.5, "v": "left"}],
          turn={"frames": 1}, reach={"x": 0.7, "y": 0.4, "arm": "right", "hand": "grab"}, hand="peace", handL=[{"at": 0, "v": "three"}],
          acting={"antic": True, "overshoot": False}, detail="auto", secondary=0.8, impact=[1.2],
          lipsync={"levels": "0123456789", "fps": 30, "offset": 0.2}, expr=[{"at": 0, "v": "terror"}, {"at": 1, "v": "scheming"}],
          sneak=[[0, 1]], march=[[1, 2]]),
    {"type": "bean", "id": "walker", "who": "hero", "x": 0.2, "y": 0.9, "size": 300,
     "path": {"pts": [[0.2, 0.9], [0.5, 0.85], [0.8, 0.9]], "at": 0, "dur": 2.5, "gait": "walk"},
     "reach": [{"at": 0, "v": {"target": "hero", "dx": 10}}, {"at": 1, "v": None}], "expr": "laughing"},
    {"type": "prop", "id": "coin", "kind": "coin", "x": 0.5, "y": 0.5, "path": {"pts": [[0.5, 0.5], [0.6, 0.3]], "dur": 1, "face": False}},
]


def test_v2_fields_validate():
    spec = _spec(copy.deepcopy(GOOD_LAYERS))
    spec["cast"]["hero"].update(patches=2, fabric=True)
    for e in ("rage", "terror", "smug", "disgust", "awe", "crying", "laughing", "scheming", "exhausted"):
        spec["shots"][0]["layers"][0]["expr"] = e
        assert validate(spec) == [], e


@pytest.mark.parametrize("field,value,needle", [
    ("view", "diagonal", "view"),
    ("view", [{"at": 0, "v": "sideways"}], "view"),
    ("facing", "up", "facing"),
    ("reach", {"y": 0.3}, "reach"),
    ("reach", {"x": 0.3, "y": 0.2, "arm": "third"}, "reach"),
    ("reach", {"target": "nobody"}, "reach"),
    ("hand", "claw", "hand"),
    ("handL", [{"at": 0, "v": "six"}], "hand"),
    ("acting", "yes", "acting"),
    ("detail", "max", "detail"),
    ("lipsync", {"fps": 30}, "lipsync"),
    ("lipsync", {"levels": "01a", "fps": 30}, "lipsync"),
    ("sneak", [[1]], "sneak"),
    ("path", {"pts": [[0.1, 0.2]], "dur": 1}, "path"),
    ("path", {"pts": [[0.1, 0.2], [0.3, 0.4]], "dur": 0}, "path"),
    ("path", {"pts": [[0.1, 0.2], [0.3, 0.4]], "dur": 1, "gait": "skip"}, "path"),
    ("turn", {"frames": 9}, "turn"),
    ("impact", [{"x": 1}], "impact"),
    ("secondary", -1, "secondary"),
])
def test_v2_bad_values_are_reported(field, value, needle):
    spec = _spec([_bean(**{field: value})])
    errors = "\n".join(validate(spec))
    assert needle in errors, (field, errors)


def test_bad_costume_fields_are_reported():
    spec = _spec([_bean()])
    spec["cast"]["hero"].update(patches="many", fabric="silk")
    errors = "\n".join(validate(spec))
    assert "patches" in errors and "fabric" in errors, errors


# ---------- lip-sync envelope ----------
def _tone_wav(path: Path, parts):
    rate = 16000
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        frames = bytearray()
        for dur, amp in parts:
            for i in range(int(dur * rate)):
                frames += struct.pack("<h", int(amp * 32767 * math.sin(2 * math.pi * 220 * i / rate)))
        w.writeframes(bytes(frames))


def test_lipsync_script_writes_a_compact_per_frame_envelope(tmp_path):
    wav = tmp_path / "vo.wav"
    _tone_wav(wav, [(1.0, 0.0), (1.0, 0.6), (0.5, 0.15), (0.5, 0.0)])
    out = tmp_path / "vo.lips.json"
    r = subprocess.run([sys.executable, str(ROOT / "scripts" / "lipsync.py"), str(wav), "--out", str(out)], capture_output=True, text=True)
    assert r.returncode == 0, r.stderr
    env = json.loads(out.read_text())
    assert env["fps"] == 30 and abs(env["dur"] - 3.0) < 0.01
    lv = env["levels"]
    assert len(lv) == 90 and set(lv) <= set("0123456789")
    assert set(lv[:29]) == {"0"} and set(lv[-14:]) == {"0"}
    assert min(int(c) for c in lv[32:58]) >= 8, lv
    assert 1 <= max(int(c) for c in lv[62:73]) <= 4, lv


def test_lipsync_script_rejects_missing_audio(tmp_path):
    r = subprocess.run([sys.executable, str(ROOT / "scripts" / "lipsync.py"), str(tmp_path / "none.wav")], capture_output=True, text=True)
    assert r.returncode != 0 and "not found" in (r.stderr + r.stdout)


def test_render_inlines_the_lipsync_file(tmp_path):
    import render as R
    (tmp_path / "vo.lips.json").write_text(json.dumps({"fps": 30, "dur": 1, "levels": "0369"}))
    spec = _spec([_bean(lipsync={"src": "vo.lips.json", "offset": 0.5})])
    (tmp_path / "spec.json").write_text(json.dumps(spec))
    assert validate(spec) == []
    out, _ = R.prepare_spec(tmp_path / "spec.json", spec)
    lip = out["shots"][0]["layers"][0]["lipsync"]
    assert lip["levels"] == "0369" and lip["fps"] == 30 and lip["offset"] == 0.5


# ---------- engine ----------
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


def _probe(spec: dict, times: list[float]) -> list[dict]:
    js = "(ts) => ts.map((t) => { TOON.RIG_PROBE = {}; window.renderFrame(t); const p = TOON.RIG_PROBE; TOON.RIG_PROBE = null; return JSON.parse(JSON.stringify(p)); })"
    return _page_eval(spec, lambda page: page.evaluate(js, times))


def _frames(spec: dict, times: list[float]) -> list[str]:
    return _page_eval(spec, lambda page: [page.evaluate(GRAB, t) for t in times])


def test_turn_inserts_in_between_views_and_mirrors_for_facing():
    js = """() => {
      const L = { view: [{at: 0, v: '3q'}, {at: 1, v: 'profile'}, {at: 2, v: 'back'}, {at: 3, v: '3q'}, {at: 4, v: 'front'}],
                  facing: [{at: 0, v: 'right'}, {at: 3, v: 'left'}] };
      const at = (t) => { const s = TOON.turnState(L, t); return [s.view, s.facing, s.inBetween, +s.sx.toFixed(3)]; };
      return { t05: at(0.5), t1: at(1 + 0.5 / 30), t12: at(1.2), t2: at(2 + 0.5 / 30), t25: at(2.5), t3: at(3 + 0.5 / 30), t36: at(3.6),
        t4: at(4 + 0.5 / 30), t46: at(4.6), snap: TOON.turnState({ ...L, turn: false }, 1 + 0.5 / 30) };
    }"""
    out = _page_eval(_spec([_bean()]), lambda page: page.evaluate(js))
    assert out["t05"][:3] == ["3q", 1, False]
    assert out["t1"][2] is True and out["t1"][3] < 1, out  # adjacent views: one squashed turn frame
    assert out["t12"][:3] == ["side", 1, False]
    assert out["t2"][2] is True and out["t25"][:2] == ["back", 1]
    assert out["t3"][:3] == ["side", -1, True], out  # back -> 3q facing left passes through the left profile
    assert out["t36"][:3] == ["3q", -1, False]
    assert out["t46"][0] == "front"
    assert out["snap"]["view"] == "side" and out["snap"]["inBetween"] is False


def test_reach_ik_puts_the_hand_on_world_and_layer_targets():
    layers = [_bean(reach={"x": 0.5, "y": 0.62}),
              {"type": "bean", "id": "pal", "who": "hero", "x": 0.75, "y": 0.9, "size": 520, "reach": {"target": "coin", "arm": "left"}},
              {"type": "prop", "id": "coin", "kind": "coin", "x": 0.68, "y": 0.6, "size": 80}]
    p = _probe(_spec(layers), [1.0])[0]
    hx, hy = p["hero"]["hands"][1]
    assert math.hypot(hx - 0.5 * 1920, hy - 0.62 * 1080) < 4, p["hero"]
    lx, ly = p["pal"]["hands"][0]
    assert math.hypot(lx - 0.68 * 1920, ly - 0.6 * 1080) < 4, p["pal"]


def test_reach_moves_along_an_arc_not_a_straight_line():
    layer = _bean(reach=[{"at": 0, "v": {"x": 0.4, "y": 0.62}}, {"at": 1, "v": {"x": 0.5, "y": 0.62}}], acting=False)
    ps = _probe(_spec([layer]), [0.9, 1.15, 1.6])
    a, m, b = (p["hero"]["hands"][1] for p in ps)
    assert math.hypot(b[0] - 0.5 * 1920, b[1] - 0.62 * 1080) < 4
    assert m[1] < min(a[1], b[1]) - 15, (a, m, b)  # the hand arcs up between two targets at the same height


def test_jump_squash_stretch_and_auto_anticipation():
    layer = _bean(jump=[{"at": 1.0, "dur": 0.5, "h": 160}], pose=[{"at": 0, "v": "idle"}, {"at": 2, "v": "arms-up"}])
    times = [0.5, 0.95, 1.05, 1.53, 1.92, 2.15]
    ps = [p["hero"] for p in _probe(_spec([layer]), times)]
    rest, crouch, launch, land, antic, over = ps
    assert crouch["sy"] < 0.93 and land["sy"] < 0.93, (crouch, land)
    assert launch["sy"] > 1.05
    assert abs(rest["sy"] - 1) < 0.03
    assert antic["antic"] > 0 and over["overshoot"] != 0, (antic, over)
    off = [p["hero"] for p in _probe(_spec([{**layer, "acting": False}]), times)]
    assert all(abs(p["sy"] - 1) < 0.03 for p in off[:4]), off


def test_path_moves_the_layer_flips_facing_and_drives_the_gait():
    layer = {"type": "bean", "id": "w", "who": "hero", "x": 0.2, "y": 0.9, "size": 300,
             "path": {"pts": [[0.2, 0.9], [0.8, 0.9], [0.4, 0.88]], "at": 0, "dur": 3, "gait": "walk"}}
    js = """() => { const L = window.FILM_SPEC.shots[0].layers[0]; const s = (t) => { const st = TOON.layerState(L, t); return [st.x, st.y, st.flip]; };
      return [s(0), s(1.0), s(2.6), s(3.2)]; }"""
    out = _page_eval(_spec([layer], dur=4), lambda page: page.evaluate(js))
    assert abs(out[0][0] - 0.2 * 1920) < 1 and out[0][2] == 1
    assert out[1][0] > 0.2 * 1920 and out[1][2] == 1
    assert out[2][2] == -1
    assert abs(out[3][0] - 0.4 * 1920) < 1
    ps = [p["w"] for p in _probe(_spec([layer], dur=4), [0.5, 0.6, 3.5])]
    assert ps[0]["gait"] == "walk" and ps[2]["gait"] is None
    assert ps[0]["feet"] != ps[1]["feet"]


def test_sneak_and_march_cycles_differ_from_walk():
    def feet(kind):
        layer = _bean(**{kind: [[0, 3]]})
        return [p["hero"]["feet"] for p in _probe(_spec([layer]), [0.4, 0.55])]
    w, s, m = feet("walk"), feet("sneak"), feet("march")
    assert w != s and w != m and s != m


def test_spring_secondary_motion_is_a_pure_function_of_time():
    layer = _bean(move=[{"at": 0.3, "dur": 0.4, "to": [0.7, 0.9], "ease": "linear"}])
    js = """() => { const L = window.FILM_SPEC.shots[0].layers[0];
      const f = (t) => TOON.springLag(L, t, { size: 520 });
      const a = [0.2, 0.75, 0.9, 1.3, 3.0].map(f); const b = [3.0, 1.3, 0.9, 0.75, 0.2].map(f).reverse();
      return { a, same: JSON.stringify(a) === JSON.stringify(b) }; }"""
    out = _page_eval(_spec([layer]), lambda page: page.evaluate(js))
    a = out["a"]
    assert out["same"]
    assert a[0]["x"] == 0
    assert abs(a[1]["x"]) > 5, a  # the hair/cape keeps going after the stop
    assert abs(a[4]["x"]) < 1, a  # and settles


def test_closeup_detail_is_automatic_on_large_painted_faces_only():
    big, small = _bean(id="big", size=1500, y=1.6), _bean(id="small", size=300, x=0.8)
    p = _probe(_spec([big, small]), [1.0])[0]
    assert p["big"]["detail"] is True and p["small"]["detail"] is False
    p = _probe(_spec([big, {**small, "detail": True}], look=None), [1.0])[0]
    assert p["big"]["detail"] is False and p["small"]["detail"] is True


def test_lipsync_maps_the_envelope_to_mouth_shapes():
    layer = _bean(lipsync={"levels": "000011223355779999000", "fps": 30, "align": "layer"}, size=900)
    ps = [p["hero"]["mouth"] for p in _probe(_spec([layer]), [0.05, 0.2, 0.42, 0.5, 0.53])]
    assert ps[0] is None  # silence: the expression's rest mouth
    assert ps[1] is not None and ps[3] in ("wide", "o") and len(set(ps[1:4])) >= 2, ps
    assert ps[4] == ps[3]  # held on twos


def test_new_features_change_pixels_but_classic_beans_stay_identical():
    classic = _spec([_bean(pose=[{"at": 0, "v": "idle"}, {"at": 1, "v": "point"}], walk=[[1.5, 2.5]], talk=[[0, 1]])], look=None)
    off = copy.deepcopy(classic)
    off["shots"][0]["layers"][0].update(acting=False, detail=False, secondary=0)
    times = [0.8, 1.1, 2.0]
    assert _frames(classic, times) == _frames(off, times), "new behaviour must be opt-in for the classic look"
    on = copy.deepcopy(classic)
    on["shots"][0]["layers"][0].update(acting=True, hand="peace")
    assert all(a != b for a, b in zip(_frames(classic, times), _frames(on, times)))


def test_catalog_validates_and_renders_deterministically():
    import render as R
    spec = json.loads(CATALOG.read_text(encoding="utf-8"))
    assert validate(spec) == []
    spec, _ = R.prepare_spec(CATALOG, spec)  # inlines the lipsync envelope
    assert any(isinstance(L.get("lipsync", {}).get("levels"), str) for s in spec["shots"] for L in s["layers"])
    ids = [s["id"] for s in spec["shots"]]
    for needle in ("turn", "reach", "walk", "jump", "face", "lipsync", "hands"):
        assert any(needle in i for i in ids), (needle, ids)
    t0, total = 0.0, []
    for s in spec["shots"]:
        total.append(t0 + s["dur"] * 0.55)
        t0 += s["dur"]
    first = _frames(spec, total)
    again = _frames(spec, list(reversed(total)))[::-1]
    assert first == again, "characters_v2 frames depend on render order"
