"""xray.anatomy: a body x-ray (skeleton, lungs, heart, vessels) with lead specks that appear over time."""
from __future__ import annotations

import copy
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from spec import validate  # noqa: E402

GRAB = "async (t)=>{window.renderFrame(t);return window.__canvas.toDataURL('image/png');}"
BASE = {"seed": 4, "style": {"look": "painted"}, "cast": {"you": {"robe": "#4a7a9a"}},
        "shots": [{"id": "a", "dur": 2, "bg": {"kind": "flat", "color": "#1a2230"},
                   "layers": [{"type": "bean", "id": "you", "who": "you", "x": 0.5, "y": 0.95, "size": 700,
                               "view": "front", "xray": {"at": 0, "dur": 0.1}}]}]}


def _frames(spec: dict, times: list[float]) -> list[str]:
    from playwright.sync_api import sync_playwright
    import render as R

    srv = R.serve(set())
    try:
        with sync_playwright() as pw:
            browser, page, errors = R.open_page(pw, spec, srv.server_address[1], 0.25)
            out = [page.evaluate(GRAB, t) for t in times]
            browser.close()
    finally:
        srv.shutdown()
    assert errors == [], errors
    return out


def test_xray_anatomy_draws_and_specks_appear_deterministically():
    ana = copy.deepcopy(BASE)
    ana["shots"][0]["layers"][0]["xray"] = {"at": 0, "dur": 0.1, "anatomy": True, "specks": 24, "specksAt": 0.5,
                                            "specksDur": 0.8}
    assert validate(ana) == []
    plain = _frames(BASE, [1.0])[0]
    a1, a2, a3 = _frames(ana, [0.3, 1.0, 1.0])
    assert a2 != plain  # anatomy is drawn
    assert a1 != a2  # specks appear over time
    assert a2 == a3  # deterministic


def test_xray_anatomy_fields_are_validated():
    bad = copy.deepcopy(BASE)
    bad["shots"][0]["layers"][0]["xray"] = {"anatomy": "yes", "specks": -3}
    errs = "\n".join(validate(bad))
    assert "anatomy" in errs and "specks" in errs
