"""Fixes from the review of the path-motion integration (3f5fca6): object paths on fx / map layers, move.to versus
path, stable seeds for anonymous path layers, contact settings of creature crowds, geographic overlay validation."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from spec import validate  # noqa: E402

GRAB = "async (t)=>{window.renderFrame(t);return window.__canvas.toDataURL('image/png');}"


def _spec(layers, look="painted"):
    return {"seed": 2, "style": {"look": look} if look else {}, "cast": {"rider": {"robe": "#a33"}},
            "shots": [{"id": "a", "dur": 3, "bg": {"kind": "flat", "color": "#8a7a66"}, "layers": layers}]}


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


PATH = {"pts": [[0.1, 0.5], [0.9, 0.5]], "at": 0, "dur": 2, "ease": "linear"}


def test_object_paths_move_fx_and_map_layers_but_legacy_lists_stay_theirs():
    js = """(P) => [
      TOON.layerState({type: 'fx', kind: 'sparkle', path: P}, 2).x,
      TOON.layerState({type: 'map', path: P}, 2).x,
      TOON.layerState({type: 'fx', kind: 'sparkle', x: 0.3, path: [[0.1, 0.5], [0.9, 0.5]]}, 2).x]"""
    fx, mp, legacy = _page_eval(_spec([]), lambda page: page.evaluate(js, PATH))
    assert abs(fx - 0.9 * 1920) < 1 and abs(mp - 0.9 * 1920) < 1
    assert abs(legacy - 0.3 * 1920) < 1, "a plain list stays the fx's own trail"
    good = _spec([{"type": "fx", "kind": "sparkle", "path": PATH}])
    assert validate(good) == []
    bad = _spec([{"type": "fx", "kind": "sparkle", "path": {"pts": [[0.1, 0.5]], "dur": 1}}])
    assert any("path" in e for e in validate(bad))


def test_path_position_wins_over_move_to():
    js = """(P) => { const L = {type: 'prop', kind: 'coin', path: P, move: [{at: 0, dur: 1, to: [0.1, 0.9], scale: 2}]};
      const st = TOON.layerState(L, 2), m = TOON.motionAt(L, 2); return [st.x, m.x, st.s]; }"""
    x, mx, s = _page_eval(_spec([]), lambda page: page.evaluate(js, PATH))
    assert abs(x - mx) < 1e-6 and abs(x - 0.9 * 1920) < 1
    assert abs(s - 2) < 1e-6, "other move fields still apply"


def test_anonymous_path_layers_keep_one_seed():
    js = """(P) => { const L = {type: 'prop', kind: 'coin', path: P, bob: 20, wobble: 6};
      const a = TOON.layerState(L, 1), b = TOON.layerState(L, 1.0001), m0 = TOON.motionAt(L, 1), m1 = TOON.motionAt(L, 1.0001);
      return [(a.y - m0.y) - (b.y - m1.y)]; }"""
    (dy,) = _page_eval(_spec([]), lambda page: page.evaluate(js, PATH))
    assert abs(dy) < 0.5, dy


def test_creature_crowds_forward_contact_settings():
    crowd = {"type": "crowd", "creature": "horse", "who": "rider", "count": 3, "x": 0.5, "y": 0.85, "size": 260}
    on = _spec([dict(crowd)])
    off = _spec([dict(crowd, contact=False)])
    a = _page_eval(on, lambda page: page.evaluate(GRAB, 1.0))
    b = _page_eval(off, lambda page: page.evaluate(GRAB, 1.0))
    assert a != b, "contact: false removes the creature members' shadows"


def test_geo_overlay_forms_validate():
    geo = {"proj": "mercator", "center": [10, 50], "span": 30}
    layer = {"type": "map", "geo": geo,
             "fights": [{"path": {"ll": [[2, 48], [13, 52]], "gc": True}, "dur": 2}, {"path": [{"ll": [2, 48]}, {"lon": 13, "lat": 52}]}],
             "morphs": [{"from": {"ll": [[0, 45], [10, 45], [5, 50]]}, "to": [[0.1, 0.1], [0.2, 0.2]]}],
             "throws": [{"from": {"ll": [2, 48]}, "to": {"lon": 13, "lat": 52}}]}
    assert validate(_spec([layer])) == []
    flat = {"type": "map", "fights": [{"path": {"ll": [[2, 48], [13, 52]]}}]}
    assert any("fights" in e for e in validate(_spec([flat]))), "geo forms need map geo"
    broken = dict(layer, fights=[{"path": {"ll": [[2, 48]]}}])
    assert any("fights" in e for e in validate(_spec([broken])))


def test_geo_lon_lat_points_render_on_fights_morphs_and_throws():
    geo = {"proj": "mercator", "center": [10, 50], "span": 30}
    layer = {"type": "map", "geo": geo,
             "fights": [{"path": [{"lon": 2, "lat": 48}, {"lon": 13, "lat": 52}], "dur": 2}],
             "morphs": [{"from": [{"lon": 0, "lat": 45}, {"lon": 10, "lat": 45}, {"lon": 5, "lat": 50}], "to": [[0.1, 0.1], [0.2, 0.2], [0.3, 0.1]]}],
             "throws": [{"from": {"lon": 2, "lat": 48}, "to": {"ll": [13, 52]}}]}
    spec = _spec([layer])
    assert validate(spec) == []
    frame = _page_eval(spec, lambda page: page.evaluate(GRAB, 1.0))
    assert frame.startswith("data:image/png")
