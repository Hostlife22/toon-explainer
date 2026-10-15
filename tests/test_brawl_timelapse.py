"""Map `fights` (a brawl cloud travelling along a path, with route marks) and the accelerating sky time-lapse.

  uv run --with pytest --with playwright --with pillow --with numpy pytest tests/test_brawl_timelapse.py -q
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from spec import validate  # noqa: E402

STYLE = {"vignette": False, "grain": False}
FIELD = [{"id": "field", "pts": [[0.0, 0.0], [1.0, 0.0], [1.0, 1.0], [0.0, 1.0]], "color": "#c9b47a"}]
STILL_CAM = {"zoom": [1, 1]}
FIGHT_DUR = 3.0

RACE = {"id": "race", "dur": 4, "camera": STILL_CAM, "bg": {"kind": "flat", "color": "#8ac8e8"}, "layers": [
    {"type": "map", "regions": FIELD, "fights": [
        {"id": "a", "path": [[0.4, 0.85], [0.42, 0.5], [0.4, 0.15]], "at": 0, "dur": FIGHT_DUR, "trail": True,
         "drops": {"every": 0.5, "icon": "flag", "size": 50, "color": "#c8323a"}, "skins": ["#c8323a"]},
        {"id": "b", "path": [[0.6, 0.85], [0.6, 0.15]], "at": 0, "dur": FIGHT_DUR, "heads": 8, "out": 3.2,
         "trail": {"dash": True}, "drops": {"every": 0.5, "icon": "flag", "size": 50, "color": "#4f7fb8"}}]}]}
TILT = {"id": "tilt", "dur": 2, "bg": {"kind": "flat", "color": "#8ac8e8"}, "layers": [
    {"type": "map", "view": "tilt", "regions": FIELD,
     "fights": {"path": [[0.15, 0.7], [0.85, 0.3]], "dur": 1.5, "size": 160, "ease": "inOut", "drops": True}}]}
KEYS = [{"at": 0, "v": 9}, {"at": 4.5, "v": 9}, {"at": 4.55, "v": 1.6}, {"at": 5.3, "v": 1.6}, {"at": 5.4, "v": 1.1}]
SKY = {"id": "sky", "dur": 8, "bg": {"kind": "sky", "hills": 1, "clouds": 0, "timelapse": {"dayDur": KEYS}}, "layers": []}
ACCEL = {"id": "accel", "dur": 4, "bg": {"kind": "sky", "hills": 1, "clouds": 0,
                                         "timelapse": {"accel": {"from": 6, "to": 1, "over": 3}, "shades": True, "phase": 0.1}}, "layers": []}


def _spec(shots, **extra):
    return {"seed": 5, "style": STYLE, "shots": shots, **extra}


def _run(tmp_path: Path, spec: dict, times: list[float], name: str):
    p = tmp_path / f"{name}.json"
    p.write_text(json.dumps(spec))
    out = tmp_path / name
    r = subprocess.run([sys.executable, str(ROOT / "scripts" / "render.py"), str(p), "--stills", ",".join(f"{t:.2f}" for t in times),
                        "--scale", "0.25", "--out", str(out)], capture_output=True, text=True)
    return r, out


def _stills(tmp_path: Path, spec: dict, times: list[float], name: str = "o") -> dict[float, Path]:
    r, out = _run(tmp_path, spec, times, name)
    assert r.returncode == 0, r.stdout[-1500:] + r.stderr[-1500:]
    return {t: out / f"t{t:07.2f}.png" for t in times}


def _rgb(path: Path):
    np = pytest.importorskip("numpy")
    Image = pytest.importorskip("PIL.Image")
    return np.asarray(Image.open(path).convert("RGB")).astype(int)


def test_fights_and_timelapse_validate():
    assert validate(_spec([RACE, TILT, SKY, ACCEL])) == []


def test_every_feature_renders(tmp_path):
    # mid race, after the race (hold on the lines), tilt view mid travel, sky day / night / fast days, accel ramp
    times = [1.5, 3.8, 5.0, 6.5, 10.9, 15.0, 17.0]
    stills = _stills(tmp_path, _spec([RACE, TILT, SKY, ACCEL]), times)
    assert all(p.exists() for p in stills.values())


def test_fight_cloud_travels_up_the_field(tmp_path):
    np = pytest.importorskip("numpy")
    one = {**RACE, "layers": [{**RACE["layers"][0], "fights": [{**RACE["layers"][0]["fights"][0], "drops": None, "trail": False}]}]}
    early, late = (_rgb(p) for p in _stills(tmp_path, _spec([one]), [0.3, 2.8]).values())
    white = lambda img: (img.min(axis=-1) > 225)  # the cloud body is near-white; the field and sky are not
    h = early.shape[0]
    rows = lambda m: np.nonzero(m.any(axis=1))[0]
    e, l = rows(white(early)), rows(white(late))
    assert len(e) and len(l), "no cloud found"
    assert e.mean() > h * 0.5 > l.mean(), (e.mean(), l.mean(), h)


def test_fight_drops_stay_after_the_cloud_leaves(tmp_path):
    np = pytest.importorskip("numpy")
    img = _rgb(_stills(tmp_path, _spec([RACE]), [3.8])[3.8])
    w = img.shape[1]
    blue = (img[..., 2] > 150) & (img[..., 0] < 120)  # blue flags of fight b (its cloud faded out at 3.2 s)
    red = (img[..., 0] > 170) & (img[..., 1] < 80) & (img[..., 2] < 80)
    assert blue[:, w // 2:].sum() > 40 and red[:, : w // 2].sum() > 40, (blue.sum(), red.sum())


def test_render_does_not_depend_on_frame_order(tmp_path):
    # the accelerating sky integrates its phase from the shot start; fight dust / heads / drops are seeded by time
    spec = _spec([RACE, SKY])
    times = [9.3, 1.7]
    jumbled = _stills(tmp_path, spec, times, "jumbled")
    for t in times:
        alone = _stills(tmp_path, spec, [t], f"alone{int(t * 10)}")[t]
        assert alone.read_bytes() == jumbled[t].read_bytes(), t


def test_timelapse_keys_set_day_and_night(tmp_path):
    # keys: day half lasts 4.5 s, the night 0.83 s, then 1.1 s per day (the constant 1.6 s default would be night at 4.4)
    sky_only = {**SKY, "camera": STILL_CAM}
    t0 = 0.0
    stills = _stills(tmp_path, _spec([sky_only]), [t0 + 2.25, t0 + 4.9, t0 + 5.6])
    top = {t: _rgb(p)[: _rgb(p).shape[0] // 4].mean() for t, p in stills.items()}
    noon, night, next_noon = top[2.25], top[4.9], top[5.6]
    assert night < noon * 0.6 and night < next_noon * 0.6, top


@pytest.mark.parametrize("bad", [
    {"fights": {"path": [[0.5, 0.5]]}},
    {"fights": {"path": [[0.1, 0.5], [0.9, 0.5]], "ease": "wobble"}},
])
def test_bad_fights_fail_the_render(tmp_path, bad):
    shot = {"id": "s", "dur": 1, "bg": {"kind": "flat", "color": "#8ac8e8"}, "layers": [{"type": "map", "regions": FIELD, **bad}]}
    r, _ = _run(tmp_path, _spec([shot]), [0.5], "bad")
    assert r.returncode != 0


@pytest.mark.parametrize("tl", [{"dayDur": 0}, {"dayDur": [{"at": 0, "v": -1}]}, {"accel": {"from": 2, "to": 0, "over": 1}}])
def test_bad_timelapse_fails_the_render(tmp_path, tl):
    shot = {"id": "s", "dur": 1, "bg": {"kind": "sky", "timelapse": tl}, "layers": []}
    r, _ = _run(tmp_path, _spec([shot]), [0.5], "bad")
    assert r.returncode != 0


def _one(layer=None, bg=None):
    return _spec([{"id": "s", "dur": 1, "bg": bg or {"kind": "flat", "color": "#8ac8e8"}, "layers": [layer] if layer else []}])


@pytest.mark.parametrize("spec, needle", [
    (_one({"type": "map", "regions": FIELD, "fights": {"path": [[0.1, 0.5], [0.9, 0.5]], "dur": 0}}), "fights dur"),
    (_one({"type": "map", "regions": FIELD, "fights": {"path": [[0.1, 0.5], [0.9, 0.5]], "ease": "wobble"}}), "fights ease"),
    (_one({"type": "map", "regions": FIELD, "fights": {"path": [[0.1, 0.5], [0.9, 0.5]], "count": -1}}), "fights count"),
    (_one({"type": "fx", "kind": "hatch", "spacing": 0}), "hatch spacing"),
    (_one(bg={"kind": "sky", "timelapse": {"dayDur": [{"at": "late", "v": 1}]}}), "dayDur"),
    (_one(bg={"kind": "sky", "timelapse": {"accel": {"from": 6, "to": 1, "over": 3, "ease": "wobble"}}}), "accel ease"),
    (_one(bg={"kind": "blueprint", "clear": 1}), "blueprint clear"),
])
def test_validator_rejects_bad_new_fields(spec, needle):
    assert any(needle in e for e in validate(spec)), validate(spec)


def test_sky_phase_matches_the_integral_and_stays_cheap():
    pytest.importorskip("playwright")
    from playwright.sync_api import sync_playwright
    import render as R

    srv = R.serve(set())
    try:
        with sync_playwright() as pw:
            browser, page, errors = R.open_page(pw, _spec([SKY]), srv.server_address[1], 0.25)
            try:
                # one day of 2 s after a 1 s ramp from 4 s: 1/4 + (ramp integral) + 10/2 days
                got = page.evaluate("""() => {
                  const d = [{at: 0, v: 4}, {at: 1, v: 4}, {at: 2, v: 2}];
                  const t0 = performance.now();
                  const far = window.TOON.skyPhase({dayDur: d}, 3600);
                  return {near: window.TOON.skyPhase({dayDur: d}, 12), far, ms: performance.now() - t0,
                          spring: window.TOON.skyPhase({dayDur: [{at: 0, v: 0.05}, {at: 1, v: 0.05}]}, 1)};
                }""")
                ramp = 1 / 2 * __import__("math").log(2)  # integral of 1/(4 - 2u) du over [0, 1]
                assert got["near"] == pytest.approx(0.25 + ramp + 10 / 2, rel=1e-3)
                assert got["far"] == pytest.approx(0.25 + ramp + 3598 / 2, rel=1e-3)
                assert got["ms"] < 50 and got["spring"] == pytest.approx(20, rel=1e-3)
                assert errors == [], errors
            finally:
                browser.close()
    finally:
        srv.shutdown()
