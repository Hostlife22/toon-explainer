"""Route marks (`drops` on map movers, map icons blast / dot) and the bean hair `smear` on a sharp turn.

  uv run --with pytest --with playwright --with pillow --with numpy pytest tests/test_maps_hair.py -q
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from spec import validate  # noqa: E402

STYLE = {"vignette": False, "grain": False}
CAST = {"hero": {"robe": "#3a6ea5", "hair": "short"}, "curly": {"robe": "#a53a3a", "hair": "curly", "head": "crown"},
        "bald": {"robe": "#4a8a4a", "hair": "bald"}}
SEA = {"kind": "flat", "color": "#8ac8e8"}
REGIONS = [{"id": "a", "blob": [0.5, 0.5, 0.35, 0.3], "color": "#7fae4a", "dur": 0.001}]


def _map(**overlays):
    return {"type": "map", "regions": REGIONS, **overlays}


SHOTS = [
    {"id": "movers", "dur": 3, "bg": SEA, "layers": [_map(
        tokens=[{"icon": "tank", "pts": [[0.15, 0.3], [0.85, 0.35]], "dur": 2.5, "drops": {"every": 0.5, "life": 0.8}}],
        routes=[{"pts": [[0.15, 0.8], [0.85, 0.75]], "dur": 2, "drops": {"icon": "flag", "every": 0.4}}],
        trails=[{"pts": [[0.2, 0.2], [0.8, 0.2]], "dur": 2, "drops": {"icon": "dot", "every": 0.25, "after": "none", "life": 0.5}}],
        squads=[{"pts": [[0.2, 0.6], [0.8, 0.6]], "dur": 2.5, "count": 3, "drops": {"icon": "dot", "life": 0.6, "after": "cross"}}],
        camps=[{"x": 0.2, "y": 0.45, "size": 120, "move": {"to": [0.8, 0.45], "dur": 2}, "drops": True}],
        figures=[{"who": "hero", "path": [[0.3, 0.5], [0.7, 0.5]], "walk": [0.1, 2.1], "scale": 0.2, "drops": {"icon": "coin", "every": 0.6}}])]},
    {"id": "tilt", "dur": 2, "bg": SEA, "layers": [{**_map(
        squads=[{"pts": [[0.2, 0.4], [0.8, 0.45]], "dur": 1.5, "drops": {"every": 0.3, "life": 0.5}}],
        tokens=[{"icon": "ship", "pts": [[0.2, 0.6], [0.8, 0.6]], "dur": 1.5, "drops": {"icon": "blast"}}]), "view": "tilt"}]},
    {"id": "hair", "dur": 2, "bg": {"kind": "flat", "color": "#e8e0d0"}, "layers": [
        {"type": "bean", "who": "hero", "x": 0.2, "y": 0.9, "size": 520, "smear": [{"at": 0.5}]},
        {"type": "bean", "who": "curly", "x": 0.5, "y": 0.9, "size": 520, "smear": {"at": 0.5, "dir": -1, "strength": 1.2}},
        {"type": "bean", "who": "bald", "x": 0.8, "y": 0.9, "size": 520, "flip": True, "smear": [{"at": 0.5}]}]},
]


def _spec(shots):
    return {"seed": 5, "style": STYLE, "cast": CAST, "shots": shots}


def _render(tmp_path: Path, spec: dict, times: list[float], name: str = "o", ok: bool = True) -> list[Path]:
    p = tmp_path / f"{name}.json"
    p.write_text(json.dumps(spec))
    out = tmp_path / name
    r = subprocess.run([sys.executable, str(ROOT / "scripts" / "render.py"), str(p), "--stills", ",".join(f"{t:.3f}" for t in times),
                        "--scale", "0.25", "--out", str(out)], capture_output=True, text=True)
    if not ok:
        assert r.returncode != 0, "render should fail"
        return []
    assert r.returncode == 0, r.stdout[-1500:] + r.stderr[-1500:]
    return sorted(out.glob("*.png"))


def _px(path: Path) -> np.ndarray:
    return np.asarray(Image.open(path).convert("RGB")).astype(int)


def test_fields_validate():
    assert validate(_spec(SHOTS)) == []


def test_every_mover_and_smear_renders(tmp_path):
    # marks popping / turning to smoke on the flat map and under a tilt view; smear frame 0, mid-decay and settled
    times = [0.1, 1.3, 2.9, 3.6, 4.4, 5.5, 5.6, 5.9]
    assert len(_render(tmp_path, _spec(SHOTS), times)) == len(times)


def test_unknown_mark_icon_throws(tmp_path):
    bad = _spec([{"id": "s", "dur": 1, "bg": SEA, "layers": [_map(tokens=[{"pts": [[0.2, 0.5], [0.8, 0.5]], "drops": {"icon": "nope"}}])]}])
    _render(tmp_path, bad, [0.5], "bad", ok=False)


def _orange(img: np.ndarray) -> int:
    r, g, b = img[..., 0], img[..., 1], img[..., 2]
    return int(((r > 220) & (g > 90) & (g < 170) & (b < 90)).sum())


def test_marks_draw_blasts(tmp_path):
    # same shot with and without drops: only the drops version has the orange blast pixels
    shot = lambda drops: {"id": "d" if drops else "n", "dur": 1, "bg": SEA, "layers": [_map(
        tokens=[{"icon": "ship", "pts": [[0.2, 0.5], [0.8, 0.5]], "dur": 1, **({"drops": {"every": 0.25, "size": 90}} if drops else {})}])]}
    with_marks, without = _render(tmp_path, _spec([shot(True), shot(False)]), [0.9, 1.9])
    assert _orange(_px(with_marks)) > 200
    assert _orange(_px(without)) == 0


def test_smear_changes_hair_but_not_bald(tmp_path):
    def shot(who, smear):
        bean = {"type": "bean", "who": who, "x": 0.5, "y": 0.9, "size": 700, **({"smear": [{"at": 0.2}]} if smear else {})}
        return {"id": who + str(smear), "dur": 1, "bg": {"kind": "flat", "color": "#e8e0d0"}, "layers": [bean]}
    imgs = [_px(p) for p in _render(tmp_path, _spec([shot("hero", True), shot("hero", False), shot("bald", True), shot("bald", False)]),
                                    [0.25, 1.25, 2.25, 3.25])]
    assert (np.abs(imgs[0] - imgs[1]).sum(axis=2) > 60).sum() > 500  # streak copies behind the head
    assert np.array_equal(imgs[2], imgs[3])  # no hair: no-op
