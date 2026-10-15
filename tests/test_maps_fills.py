"""Map throws/morphs overlays, pile and flood fx, redeyes close, the xray modifier, the aperture fg and two props.

  uv run --with pytest --with playwright --with pillow --with numpy pytest tests/test_maps_fills.py -q
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
CAST = {"hero": {"robe": "#3a6ea5"}}

SHOTS = [
    {"id": "map", "dur": 2, "bg": {"kind": "flat", "color": "#8ac8e8"}, "layers": [
        {"type": "map", "regions": [{"id": "a", "blob": [0.3, 0.5, 0.18, 0.25], "color": "#d9a441"},
                                    {"id": "b", "blob": [0.72, 0.5, 0.18, 0.25], "color": "#7fae4a"}],
         "morphs": [{"from": [[0.5, 0.25], [0.5, 0.75]],
                     "to": [[0.5, 0.25], [0.55, 0.4], [0.45, 0.55], [0.5, 0.75]], "at": 0.2, "dash": True}],
         "throws": [{"from": [0.3, 0.5], "to": [0.72, 0.45], "count": 3, "at": 0.1},
                    {"from": [0.3, 0.6], "to": [0.7, 0.6], "icon": "coin", "at": 0.5, "spin": False}]}]},
    {"id": "pile", "dur": 2, "bg": {"kind": "flat", "color": "#000000"}, "layers": [
        {"type": "fx", "kind": "pile", "prop": "coin", "dur": 1.0, "level": 0.6}]},
    {"id": "flood", "dur": 2, "bg": {"kind": "flat", "color": "#000000"}, "layers": [
        {"type": "fx", "kind": "flood", "dur": 1.0, "level": 0.6, "color": "#e8b440"}]},
    {"id": "eyes", "dur": 2, "bg": {"kind": "flat", "color": "#0a0808"}, "layers": [
        {"type": "fx", "kind": "redeyes", "x": 0.5, "y": 0.5, "close": {"at": 0.3, "dur": 0.8}}]},
    {"id": "xray", "dur": 2, "bg": {"kind": "flat", "color": "#e8e0d0"}, "layers": [
        {"type": "prop", "kind": "moneybag", "x": 0.3, "y": 0.5, "size": 400, "xray": True},
        {"type": "bean", "who": "hero", "x": 0.7, "y": 0.92, "size": 600, "xray": {"at": 0.2, "inner": "coin"}}]},
    {"id": "frame", "dur": 2, "bg": {"kind": "sky", "preset": "day"}, "layers": [
        {"type": "fg", "kind": "aperture", "hole": [0.2, 0.15, 0.6, 0.6], "radius": 40, "bars": 2}]},
    {"id": "props", "dur": 2, "bg": {"kind": "flat", "color": "#e8e0d0"}, "layers": [
        {"type": "prop", "kind": "coin-gavel", "x": 0.25, "y": 0.5, "size": 500, "strike": [0.1]},
        {"type": "prop", "kind": "iso-tile", "x": 0.55, "y": 0.75, "size": 380, "building": "tower", "owner": "#c8302a"},
        {"type": "prop", "kind": "iso-tile", "x": 0.82, "y": 0.75, "size": 380, "building": "house"}]},
]


def _spec(shots, **extra):
    return {"seed": 4, "style": STYLE, "cast": CAST, "shots": shots, **extra}


def _stills(tmp_path: Path, spec: dict, times: list[float], name: str = "o") -> list[Path]:
    p = tmp_path / f"{name}.json"
    p.write_text(json.dumps(spec))
    out = tmp_path / name
    r = subprocess.run([sys.executable, str(ROOT / "scripts" / "render.py"), str(p), "--stills", ",".join(f"{t:.2f}" for t in times),
                        "--scale", "0.25", "--out", str(out)], capture_output=True, text=True)
    assert r.returncode == 0, r.stdout[-1500:] + r.stderr[-1500:]
    return sorted(out.glob("*.png"))


def test_new_kinds_validate():
    assert validate(_spec(SHOTS)) == []


def test_unknown_names_are_rejected():
    bad = _spec([{"id": "s", "dur": 1, "layers": [{"type": "fx", "kind": "piles"}, {"type": "fg", "kind": "apperture"},
                                                   {"type": "prop", "kind": "iso_tile"}]}])
    errs = " | ".join(validate(bad))
    for needle in ("piles", "apperture", "iso_tile"):
        assert needle in errs, errs


def test_every_feature_renders(tmp_path):
    # mid-throw / impact, pile and flood mid-fill, eyes closing, xray, aperture, props mid-strike
    times = [0.35, 0.75, 2.6, 4.5, 6.6, 9.0, 11.0, 12.15]
    assert len(_stills(tmp_path, _spec(SHOTS), times)) == len(times)


@pytest.mark.parametrize("shot,t", [("pile", 3.9), ("flood", 5.9)])
def test_fill_covers_the_bottom_of_the_frame(tmp_path, shot, t):
    Image = pytest.importorskip("PIL.Image")
    np = pytest.importorskip("numpy")
    one = [s for s in SHOTS if s["id"] == shot]
    lt = t - [s["id"] for s in SHOTS].index(shot) * 2
    img = np.asarray(Image.open(_stills(tmp_path, _spec(one), [lt])[0]).convert("RGB")).astype(int)
    h = img.shape[0]
    bottom, top = img[int(h * 0.85):], img[: int(h * 0.15)]
    covered = bottom.max(axis=-1) > 30  # anything but the black background (ink outlines count as covered)
    assert covered.mean() > 0.98, covered.mean()
    r, g, b = bottom.reshape(-1, 3).mean(axis=0)
    assert r > 120 and r > g > b, (r, g, b)  # mostly gold / beer
    assert top.mean() < 40  # the top of the frame is still the black background (level 0.6)


def test_redeyes_close_turns_the_eyes_off(tmp_path):
    np = pytest.importorskip("numpy")
    Image = pytest.importorskip("PIL.Image")
    eyes = [s for s in SHOTS if s["id"] == "eyes"]
    on, off = (np.asarray(Image.open(p).convert("RGB")).astype(int) for p in _stills(tmp_path, _spec(eyes), [0.1, 1.5]))
    assert on[..., 0].max() > 150 and off[..., 0].max() < 40


def test_vertical_fills_and_aperture_use_the_visible_strip(tmp_path):
    np = pytest.importorskip("numpy")
    Image = pytest.importorskip("PIL.Image")
    shots = [{"id": "v", "dur": 2, "frame": 0.3, "bg": {"kind": "flat", "color": "#000000"}, "layers": [
        {"type": "fg", "kind": "aperture", "hole": [0.1, 0.1, 0.8, 0.3], "color": "#202020", "edge": False},
        {"type": "fx", "kind": "flood", "dur": 0.5, "level": 0.4, "foam": ""}]}]
    img = np.asarray(Image.open(_stills(tmp_path, _spec(shots, format="vertical"), [1.5])[0]).convert("RGB")).astype(int)
    h, w = img.shape[:2]
    assert img[int(h * 0.95), w // 2, 0] > 120  # flood across the strip
    assert abs(img[int(h * 0.25), w // 2] - 0).max() < 10  # inside the hole: the black bg
    assert abs(img[int(h * 0.05), w // 2] - 0x20).max() < 10  # above the hole: the frame colour
