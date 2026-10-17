"""Engine gaps, integration review: the authored vehicle reference survives every layer copy (focus, keyed blur,
distance), and gag hats on a rear three-quarter bean use the bean's own headwear view."""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from spec import validate  # noqa: E402

GRAB = "async (t)=>{window.renderFrame(t);return window.__canvas.toDataURL('image/png');}"


def film(layers, shot_extra=None, dur=3, look="painted"):
    shot = {"id": "s", "dur": dur, "bg": {"kind": "flat", "color": "#8a9aa8"}, "camera": {"zoom": [1, 1]},
            "layers": [{"enter": "none", **layer} for layer in layers], **(shot_extra or {})}
    out = {"seed": 3, "cast": {"driver": {"robe": "#4a3a2a", "hair": "short"}, "monk": {"robe": "#5a4a3a"}}, "shots": [shot]}
    if look:
        out["style"] = {"look": look}
    return out


def _page(spec: dict, fn):
    from playwright.sync_api import sync_playwright
    import render as R

    assert validate(spec) == [], validate(spec)
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


# ---------- 1. the authored vehicle behind focus / blur / distance copies ----------
CAR = {"type": "vehicle", "kind": "car1950", "id": "car", "x": 0.2, "y": 0.85, "size": 600,
       "swap": [{"at": 1, "x": 0.8}], "riders": [{"who": "driver", "lookAt": [0.5, 0.2]}]}
VARIANTS = {
    "plain": ({}, {}),
    "focus": ({}, {"focus": [{"at": 0, "dur": 0.01, "on": "bg", "px": 8}]}),
    "keyed-blur": ({"blur": [{"at": 0, "v": 2}, {"at": 3, "v": 4}]}, {}),
    "distance": ({"dist": 2}, {}),
    "all": ({"blur": [{"at": 0, "v": 2}, {"at": 3, "v": 4}], "dist": 2}, {"focus": [{"at": 0, "dur": 0.01, "on": "bg", "px": 8}]}),
}
# facing of the rider at t (as the director plans it) and its anchor before the swap, from the frame at t
SPY = """(t) => { const T = TOON, base = T.layers.bean; let out = null;
  T.layers.bean = (ctx, Ly, lt, env) => { if (Ly.__anchor && !out) { const a = Ly.__anchor(0.5); out = {x: a.x, facing: T.directBean(Ly, lt, env).L.facing ?? null}; }
    return base(ctx, Ly, lt, env); };
  window.renderFrame(t); T.layers.bean = base; return out; }"""


@pytest.mark.parametrize("name", list(VARIANTS))
def test_rider_probe_resolves_the_authored_vehicle_through_layer_copies(name):
    extra, shot = VARIANTS[name]
    spec = film([{**CAR, **extra}], shot)
    got = _page(spec, lambda p: [p.evaluate(SPY, t) for t in (1.02, 0.5, 1.02)])
    ref = _page(film([CAR]), lambda p: p.evaluate(SPY, 1.02))
    assert got[0]["x"] < 960, f"{name}: the anchor at 0.5 s sits on the authored (pre-swap) car: {got}"
    assert got[0]["facing"] == ref["facing"] == got[2]["facing"], f"{name}: facing follows the authored history: {got} vs {ref}"


def test_rider_frames_do_not_depend_on_render_order_with_focus_blur_and_distance():
    spec = film([{**CAR, **VARIANTS["all"][0]}], VARIANTS["all"][1])
    times = (0.5, 1.02, 1.6)
    fwd = _page(spec, lambda p: [p.evaluate(GRAB, t) for t in times])
    rev = _page(spec, lambda p: [p.evaluate(GRAB, t) for t in reversed(times)])[::-1]
    assert fwd == rev


def test_swap_base_survives_spreads_and_stays_out_of_json():
    js = """() => { const T = TOON, L = {type: 'vehicle', kind: 'car1950', x: 0.2, swap: [{at: 1, x: 0.8}]};
      const E = T.effLayer(L, 2), F = {...E, blur: 3}, G = T.distLayer({...F, dist: 2}), H = T.effLayer(G, 2);
      const P = {...L, blur: 2};
      return [T.swapBase(E) === L, T.swapBase(F) === L, T.swapBase(G) === L, T.swapBase(H) === L, JSON.stringify(F).includes('swap'),
              Object.keys(F).sort().join(','), T.swapBase(P) === P]; }"""
    out = _page(film([{"type": "bean", "who": "driver", "x": 0.5, "y": 0.9}]), lambda p: p.evaluate(js))
    assert out[:4] == [True] * 4, out
    assert out[4] is True and out[5] == "blur,kind,swap,type,x", out
    assert out[6] is True, out
