"""Review follow-ups for car views and rider objects: pure rider anchors (render order, parent identity, layer `at`,
3q geometry, classic car1910, hops), exhaust puffs mirrored at their emission time, the squash kept where a view turn
cannot draw, view "side" identical to no view, looping reversals, path orient in front views, rider field validation."""
from __future__ import annotations

import copy
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from spec import validate  # noqa: E402

GRAB = "async (t)=>{window.renderFrame(t);return window.__canvas.toDataURL('image/png');}"
UTURN = {"pts": [[0.15, 0.8], [0.7, 0.8], [0.85, 0.88], [0.7, 0.96], [0.15, 0.96]], "dur": 4, "ease": "linear"}
# records the facing timeline the director derives for every anchored rider: window.__seen[id] = facing keys
SPY = """() => { const T = TOON, base = T.directBean; window.__seen = {};
  T.directBean = (Ly, lt, env) => { const r = base(Ly, lt, env); if (Ly.__anchor) window.__seen[Ly.id] = r.L.facing; return r; }; }"""
PICK = "(a) => { const [id, t] = a, k = window.__seen[id]; if (!k) return null; let v = k[0].v; for (const x of k) if (t >= x.at) v = x.v; return v; }"


def film(layers, look="painted", dur=4):
    out = {"seed": 3, "cast": {"driver": {"robe": "#4a3a2a"}, "boss": {"robe": "#6c7078"}},
           "shots": [{"id": "s", "dur": dur, "bg": {"kind": "flat", "color": "#8a9aa8"}, "camera": {"zoom": [1, 1]},
                      "layers": [{"enter": "none", **layer} for layer in layers]}]}
    if look:
        out["style"] = {"look": look}
    return out


def _page(spec: dict, fn):
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


TARGET = {"type": "bean", "id": "ghost", "who": "boss", "x": 0.08, "y": 0.9, "size": 300}


def test_rider_acting_does_not_depend_on_render_order():
    car = {"type": "vehicle", "kind": "car1950", "x": 0.55, "y": 0.9, "size": 600, "facing": [{"at": 0, "v": "right"}, {"at": 1, "v": "left"}],
           "riders": [{"who": "driver", "lookAt": "ghost"}]}
    spec = film([TARGET, car])
    a = _page(spec, lambda p: [p.evaluate(GRAB, t) for t in (0.5, 2.0)])
    b = _page(spec, lambda p: [p.evaluate(GRAB, t) for t in (2.0, 0.5)][::-1])
    assert a == b
    def facing(order):
        def run(page):
            page.evaluate(SPY)
            for t in order:
                page.evaluate(GRAB, t)
            rid = page.evaluate("() => Object.keys(window.__seen)[0]")
            return [page.evaluate(PICK, [rid, t]) for t in (0.5, 2.0)]
        return _page(spec, run)
    # the ghost stays on the left: behind the driver (-1) while the car faces right, ahead (+1) once it faces left
    assert facing((0.5, 2.0)) == facing((2.0, 0.5)) == [-1, 1]


def test_anonymous_cars_facing_opposite_ways_get_their_own_rider_plans():
    cars = [{"type": "vehicle", "kind": "model-t", "x": 0.6, "y": 0.6 + 0.3 * i, "size": 400, "dir": d, "riders": [{"who": "driver", "lookAt": "ghost"}]}
            for i, d in enumerate((1, -1))]
    def run(page):
        page.evaluate(SPY); page.evaluate(GRAB, 1.0)
        return page.evaluate("() => Object.keys(window.__seen)")
    ids = _page(film([TARGET, *cars]), run)
    assert len(ids) == 2, ids
    # same layer fields except the facing: still two plans, each aiming through its own mirror
    same = [{**cars[0], "y": 0.6}, {**cars[0], "y": 0.6, "dir": -1}]
    def faces(page):
        page.evaluate(SPY); page.evaluate(GRAB, 1.0)
        return sorted(page.evaluate("() => Object.values(window.__seen).map((k) => k[k.length - 1].v)"))
    assert _page(film([TARGET, *same]), faces) == [-1, 1]


def test_exhaust_puffs_keep_their_place_when_the_car_turns_round():
    car = {"type": "vehicle", "kind": "car1950", "id": "car", "x": 0.5, "y": 0.9, "size": 500, "drive": [[0, 4]],
           "facing": [{"at": 0, "v": "right"}, {"at": 1, "v": "left"}]}
    js = """(t) => { const VK = TOON.VK, base = VK.puffList, out = {};
      VK.puffList = (L, slt, kind, lx, ly, o) => { const r = base(L, slt, kind, lx, ly, o); if (kind === 'exhaust') for (const q of r) out[q.i] = [q.bx, q.by]; return r; };
      window.renderFrame(t); VK.puffList = base; return out; }"""
    before, after = _page(film([car]), lambda p: [p.evaluate(js, 0.95), p.evaluate(js, 1.3)])
    shared = [i for i in before if i in after]
    assert shared, "puffs emitted before the turn are still alive after it"
    for i in shared:
        assert before[i] == pytest.approx(after[i], abs=1e-6), f"puff {i} moved when the car turned"


def test_rider_on_a_late_vehicle_aims_in_shot_time():
    car = {"type": "vehicle", "kind": "car1950", "id": "car", "at": 2, "size": 400,
           "path": {"pts": [[0.1, 0.8], [0.9, 0.8]], "at": 2, "dur": 1, "ease": "linear"},
           "riders": [{"who": "driver", "lookAt": "post"}]}
    post = {"type": "bean", "id": "post", "who": "boss", "x": 0.5, "y": 0.9, "size": 300}
    def run(page):
        page.evaluate(SPY); page.evaluate(GRAB, 3.5)
        rid = page.evaluate("() => Object.keys(window.__seen)[0]")
        return [page.evaluate(PICK, [rid, t]) for t in (0.1, 1.2)]
    start, end = _page(film([post, car]), run)
    assert start == 1 and end == -1, (start, end)


def test_rider_anchor_follows_the_drawn_head_in_a_3q_view():
    car = {"type": "vehicle", "kind": "model-t", "id": "car", "x": 0.55, "y": 0.9, "size": 800, "scale": 1.5, "dir": -1, "view": "3q",
           "riders": [{"who": "driver", "lookAt": [0.1, 0.5], "scale": 2}]}
    js = """() => { const T = TOON, base = T.layers.bean; let got = null;
      T.layers.bean = (ctx, Ly, lt, env) => { if (Ly.__anchor && !got) { const m = ctx.getTransform(), y = -450 * Ly.size / 600;
        got = {draw: [m.c * y + m.e, m.d * y + m.f], anchor: Ly.__anchor(1.0), w: ctx.canvas.width}; } return base(ctx, Ly, lt, env); };
      window.renderFrame(1.0); T.layers.bean = base; return got; }"""
    got = _page(film([car], look=None), lambda p: p.evaluate(js))
    s = got["w"] / 1920
    drawn = [v / s for v in got["draw"]]
    assert abs(drawn[0] - got["anchor"]["x"]) < 40 and abs(drawn[1] - got["anchor"]["y"]) < 40, (drawn, got["anchor"])


def test_classic_car1910_rider_aims_from_its_seat():
    car = {"type": "vehicle", "kind": "car1910", "x": 0.6, "y": 0.9, "size": 500, "riders": [{"who": "driver", "lookAt": "ghost"}]}
    def run(page):
        page.evaluate(SPY); page.evaluate(GRAB, 1.0)
        return page.evaluate("() => Object.values(window.__seen).map((k) => k[k.length - 1].v)")
    assert _page(film([TARGET, car], look=None), run) == [-1]


def test_rider_takes_hop():
    rider = lambda takes: {"type": "vehicle", "kind": "car1950", "x": 0.5, "y": 0.9, "size": 600, "riders": [{"who": "driver", "takes": takes}]}
    a = _page(film([rider([{"at": 0.3, "kind": "jolt"}])], look=None), lambda p: p.evaluate(GRAB, 0.41))
    b = _page(film([rider([{"at": 3.5, "kind": "jolt"}])], look=None), lambda p: p.evaluate(GRAB, 0.41))
    assert a != b, "a jolt take lifts the seated rider"


def test_squash_stays_where_no_view_turn_is_drawn_and_view_side_is_plain():
    js = """(P) => { const T = TOON, ts = Array.from({length: 120}, (_, i) => 1.5 + i / 60), sx = (L) => Math.min(...ts.map((t) => T.layerState(L, t).sx));
      const classic = {type: 'vehicle', kind: 'car1910', rig: 'classic', size: 400, path: P};
      const side = {type: 'vehicle', kind: 'model-t', size: 400, path: P, view: 'side'}, plain = {...side, view: undefined};
      const seq = (L) => ts.map((t) => { const v = T.VK.viewOf(L, t, t); return v ? v.view : 'side'; });
      return {classic: sx(classic), side: [sx(side), seq(side)], plain: [sx(plain), seq(plain)],
              rig: [T.vehicleRig({kind: 'car1910', view: 'side'}, false), T.vehicleRig({kind: 'car1910', view: 'front'}, false)]}; }"""
    out = _page(film([{"type": "vehicle", "kind": "model-t", "x": 0.5, "y": 0.9}]), lambda p: p.evaluate(js, UTURN))
    assert out["classic"] < 0.9, "a classic car1910 cannot turn through views: it keeps the squash"
    assert out["side"] == out["plain"]
    assert out["rig"] == ["legacy", "v2"]
    spec = film([{"type": "vehicle", "kind": "car1910", "x": 0.5, "y": 0.9, "size": 500, "riders": ["driver"]}], look=None)
    side = copy.deepcopy(spec)
    side["shots"][0]["layers"][0]["view"] = "side"
    assert _page(spec, lambda p: p.evaluate(GRAB, 1.0)) == _page(side, lambda p: p.evaluate(GRAB, 1.0))


def test_looping_reversal_turns_across_the_lap_seam():
    js = """() => { const L = {type: 'vehicle', kind: 'car1950', size: 420, path: {pts: [[0.2, 0.8], [0.8, 0.8]], loop: true, dur: 4, ease: 'linear'}};
      return [3.97, 4.0, 4.03, 1.0].map((t) => TOON.VK.viewOf(L, t, t).view); }"""
    out = _page(film([{"type": "vehicle", "kind": "car1950", "x": 0.5, "y": 0.9}]), lambda p: p.evaluate(js))
    assert out[0] == out[1] == out[2] != "side" and out[3] == "side", out


def test_front_view_on_an_oriented_path_stands_upright():
    car = lambda orient: {"type": "vehicle", "kind": "car1950", "size": 420, "exhaust": False, "path": {**UTURN, "orient": orient}}
    find = "() => { const L = TOON.film.timeline.shots[0].layers[0]; for (let i = 0; i < 120; i++) { const t = i / 30; const v = TOON.VK.viewOf(L, t, t); if (v && v.view === 'front') return t; } return null; }"
    t = _page(film([car(True)]), lambda p: p.evaluate(find))
    assert t is not None, "the U-turn passes through the front view"
    a = _page(film([car(True)]), lambda p: p.evaluate(GRAB, t))
    b = _page(film([car(False)]), lambda p: p.evaluate(GRAB, t))
    assert a == b


@pytest.mark.parametrize("rider, needle", [
    ({"who": "driver", "takes": 42}, "takes"),
    ({"who": "driver", "talk": "oops"}, "talk"),
    ({"who": "driver", "lookAt": "nobody"}, "lookAt"),
    ({"who": "driver", "expr": {}}, "expr"),
    ({"who": "driver", "expr": [42]}, "expr"),
    ({"who": "driver", "hold": {}}, "hold"),
    ({"who": "driver", "hold": [{"at": 0, "v": "scroll"}]}, "hold"),
    ({"who": "driver", "takes": [{"at": 1, "kind": "jolt", "target": "nobody"}]}, "take target"),
    (7, "rider"),
])
def test_bad_rider_fields_are_reported_without_crashing(rider, needle):
    spec = film([{"type": "vehicle", "kind": "car1950", "x": 0.5, "y": 0.9, "riders": [rider]}])
    errors = validate(spec)
    assert any(needle in e for e in errors), errors


def test_rear_three_quarter_shows_one_tail_end_and_riders_from_behind():
    js = """(view) => { const T = TOON, base = T.layers.bean, out = T.outlined; const views = [], tails = [0];
      T.layers.bean = (ctx, Ly, lt, env) => { views.push(Ly.view || '3q'); return base(ctx, Ly, lt, env); };
      T.outlined = (ctx, fn, fill, o) => { if (fill === '#e8403a') tails[0]++; return out(ctx, fn, fill, o); };
      const c = document.createElement('canvas'); c.width = 800; c.height = 500; const ctx = c.getContext('2d'); ctx.translate(400, 450);
      const F = T.film, env = {spec: F.spec, cast: F.spec.cast, style: {}, shot: F.timeline.shots[0], seed: 3, dpr: 1, lt: 1,
                               st: {x: 400, y: 450, s: 1, flip: 1, sx: 1, sy: 1, r: 0, a: 1}};
      T.layers.vehicle(ctx, {type: 'vehicle', kind: 'car1950', size: 600, riders: ['driver', 'boss'], view}, 1, env);
      T.layers.bean = base; T.outlined = out; return {views, tails: tails[0]}; }"""
    spec = film([{"type": "vehicle", "kind": "car1950", "x": 0.5, "y": 0.9}])
    back, fwd = _page(spec, lambda p: [p.evaluate(js, "3q-back"), p.evaluate(js, "3q")])
    assert set(back["views"]) == {"3q-back"} and set(fwd["views"]) != {"3q-back"}, "riders in 3q-back use the bean's rear three-quarter view"
    assert back["tails"] == 2, "the rear face's two tail lights, not the side drawing's as well"
