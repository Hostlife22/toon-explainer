"""Engine backlog, creatures and vehicles: the reaper's held prop clears its face, car views (front / 3q / back) and the
turn through them (view timeline or a path reversal), and riders as objects (own expr, lookAt, talk)."""
from __future__ import annotations

import copy
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from spec import validate  # noqa: E402

GRAB = "async (t)=>{window.renderFrame(t);return window.__canvas.toDataURL('image/png');}"
CARS = ["model-t", "car1910", "sedan1920", "car1950", "car-modern"]
UTURN = {"pts": [[0.15, 0.8], [0.7, 0.8], [0.85, 0.88], [0.7, 0.96], [0.15, 0.96]], "dur": 4, "ease": "linear"}


def film(layers, look="painted", dur=3):
    out = {"seed": 3, "cast": {"driver": {"robe": "#4a3a2a"}, "boss": {"robe": "#6c7078", "mustache": True}},
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


# ---------- reaper ----------
def test_reaper_hold_keeps_the_skull_mask_clear():
    js = """() => {
      const T = TOON, draw = (L) => {
        const c = document.createElement('canvas'); c.width = 1000; c.height = 1000;
        const ctx = c.getContext('2d'); ctx.translate(500, 950);
        T.CREATURES.reaper(ctx, {type: 'creature', kind: 'reaper', size: 600, ...L}, 0.5);
        return ctx.getImageData(380, 290, 240, 270).data; // the mask: x -120..120, y -660..-390 (above the fangs)
      };
      const out = {};
      for (const pose of ['idle', 'sign', 'reach']) for (const hold of ['scroll', 'hourglass', 'book']) {
        const a = draw({pose}), b = draw({pose, hold});
        let n = 0; for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) n++;
        out[pose + '/' + hold] = n;
      }
      return out;
    }"""
    out = _page(film([{"type": "creature", "kind": "reaper", "x": 0.5, "y": 0.9}]), lambda p: p.evaluate(js))
    assert all(n == 0 for n in out.values()), f"the held prop covers the face: {out}"


# ---------- views: validation ----------
def test_view_fields_validate_and_bad_values_are_reported():
    good = {"type": "vehicle", "kind": "car1950", "x": 0.5, "y": 0.9, "view": [{"at": 0, "v": "side"}, {"at": 1, "v": "front"}],
            "facing": "left", "turn": {"frames": 3, "via": "back", "span": 0.6, "smear": False},
            "riders": ["driver", {"who": "boss", "expr": [{"at": 0, "v": "happy"}, {"at": 1, "v": "shock"}], "lookAt": [0.1, 0.5], "hold": "scroll"}]}
    assert validate(film([good])) == []
    for bad, needle in [({"view": "top"}, "vehicle view"), ({"facing": "up"}, "vehicle facing"), ({"turn": {"frames": 9}}, "turn.frames"),
                        ({"turn": {"via": "side"}}, "turn.via"), ({"turn": 3}, "vehicle turn"),
                        ({"riders": [{"who": "nobody"}]}, "rider who"), ({"riders": [{"who": "boss", "expr": "zzz"}]}, "expr"),
                        ({"riders": [{"who": "boss", "wings": 1}]}, "unknown rider fields"), ({"riders": "boss"}, "riders must be a list")]:
        errors = validate(film([{**good, **bad}]))
        assert any(needle in e for e in errors), (bad, errors)


# ---------- views: engine ----------
def test_view_timeline_turns_through_the_views_in_between():
    js = """() => {
      const VK = TOON.VK, seq = (L, t0, t1) => { const out = []; for (let t = t0; t < t1; t += 1 / 30) { const v = VK.viewOf(L, t, t); out.push([v.view, v.facing, v.smear > 0, v.sx]); } return out; };
      const side2front = {type: 'vehicle', kind: 'car1950', view: [{at: 0, v: 'side'}, {at: 1, v: 'front'}]};
      const uturn = {type: 'vehicle', kind: 'model-t', facing: [{at: 0, v: 'right'}, {at: 1, v: 'left'}]};
      const back = {...uturn, turn: {via: 'back', frames: 1}};
      return {a: seq(side2front, 0.9, 1.3), b: seq(uturn, 0.99, 1.4), c: seq(back, 0.99, 1.2),
              snap: VK.viewOf({...side2front, turn: false}, 1.01, 1.01), plain: VK.viewOf({type: 'vehicle', kind: 'car1950'}, 1, 1),
              tank: VK.viewOf({type: 'vehicle', kind: 'tank', view: 'front'}, 1, 1)};
    }"""
    out = _page(film([{"type": "vehicle", "kind": "car1950", "x": 0.5, "y": 0.9}]), lambda p: p.evaluate(js))
    views = [v[0] for v in out["a"]]
    assert views[:3] == ["side"] * 3 and views[3:5] == ["3q", "3q"] and set(views[5:]) == {"front"}, views
    assert out["a"][3][2] and out["a"][3][3] < 1, "in-betweens are squashed and smeared"
    assert not out["a"][-1][2] and out["a"][-1][3] == 1
    turn = [(v, f if v != "front" else 0) for v, f, _, _ in out["b"]]  # the front drawing is the same either way
    order = [list(x) for i, x in enumerate(turn) if i == 0 or turn[i - 1] != x]
    assert order == [["side", 1], ["3q", 1], ["front", 0], ["3q", -1], ["side", -1]], order
    border = [x[0] for i, x in enumerate(out["c"]) if i == 0 or out["c"][i - 1][0] != x[0]]
    assert border == ["side", "3q-back", "back", "3q-back", "side"], border
    assert out["snap"]["view"] == "front" and out["plain"] is None and out["tank"] is None


def test_path_reversal_turns_a_car_through_views_instead_of_squashing():
    js = """(P) => {
      const T = TOON, car = {type: 'vehicle', kind: 'model-t', size: 420, path: P}, tank = {...car, kind: 'tank'};
      const up = {...car, path: {...P, pts: P.pts.map(([x, y]) => [x, 1.76 - y])}};
      const out = {views: [], upViews: [], sx: [], tankSx: [], flips: []};
      for (let t = 1.5; t < 3.5; t += 1 / 30) {
        out.views.push(T.VK.viewOf(car, t, t).view); out.upViews.push(T.VK.viewOf(up, t, t).view);
        out.sx.push(T.layerState(car, t).sx); out.tankSx.push(T.layerState(tank, t).sx); out.flips.push(T.layerState(car, t).flip);
      }
      out.straight = T.VK.viewOf({...car, path: {pts: [[0.1, 0.8], [0.9, 0.8]]}}, 1, 1);
      out.off = T.VK.viewOf({...car, turn: false}, 2.5, 2.5);
      return out;
    }"""
    out = _page(film([{"type": "vehicle", "kind": "model-t", "path": UTURN}]), lambda p: p.evaluate(js, UTURN))
    assert min(out["sx"]) == 1, "a car with views does not squash through the turn"
    assert min(out["tankSx"]) < 0.5, "kinds without views keep the squash"
    order = [v for i, v in enumerate(out["views"]) if i == 0 or out["views"][i - 1] != v]
    assert order == ["side", "3q", "front", "3q", "side"], order
    assert set(out["flips"]) == {1, -1}
    up = [v for i, v in enumerate(out["upViews"]) if i == 0 or out["upViews"][i - 1] != v]
    assert up == ["side", "3q-back", "back", "3q-back", "side"], up
    assert out["straight"] is None and out["off"] is None


@pytest.mark.parametrize("look", ["painted", None])
def test_every_car_draws_distinct_views_and_side_is_unchanged(look):
    js = """(kinds) => {
      const T = TOON, out = {}, F = T.film, views = [null, 'front', '3q', 'back', '3q-back'];
      const env = {spec: F.spec, cast: F.spec.cast, style: F.spec.style || {}, shot: F.timeline.shots[0], seed: 3, dpr: 1, lt: 1,
                   st: {x: 400, y: 450, s: 1, flip: 1, sx: 1, sy: 1, r: 0, a: 1}};
      for (const kind of kinds) for (const view of views) {
        const c = document.createElement('canvas'); c.width = 800; c.height = 500;
        const ctx = c.getContext('2d'); ctx.translate(400, 450);
        T.layers.vehicle(ctx, {type: 'vehicle', kind, size: 600, riders: ['driver', 'boss'], ...(view ? {view} : {})}, 1, env);
        out[kind + '/' + view] = c.toDataURL();
      }
      return out;
    }"""
    frames = _page(film([{"type": "vehicle", "kind": "car1950", "x": 0.5, "y": 0.9}], look), lambda p: p.evaluate(js, CARS))
    for k in CARS:
        drawn = [v for key, v in frames.items() if key.startswith(k + "/")]
        assert len(set(drawn)) == len(drawn) == 5, f"{k}: every view is a different drawing"
    for k in ("model-t", "car1950"):  # same shot, with and without view: "side" is the plain drawing
        layer = {"type": "vehicle", "kind": k, "x": 0.5, "y": 0.85, "size": 600, "riders": ["driver"], "lights": True,
                 "path": {"pts": [[0.3, 0.85], [0.6, 0.85]], "dur": 2}}
        a, b = (_page(film([{**layer, **extra}], look), lambda p: p.evaluate(GRAB, 1.0)) for extra in ({}, {"view": "side"}))
        assert a == b, f"{k}: view side is the plain drawing"


def test_view_turn_renders_deterministically_in_any_order():
    spec = film([{"type": "vehicle", "kind": "sedan1920", "id": "car", "size": 420, "path": UTURN, "riders": ["driver"]},
                 {"type": "vehicle", "kind": "car-modern", "x": 0.3, "y": 0.6, "size": 300, "lights": True,
                  "view": [{"at": 0, "v": "side"}, {"at": 0.5, "v": "front"}, {"at": 1.5, "v": "back"}], "riders": ["boss"]}], dur=4)
    times = [0.4, 0.52, 0.6, 1.55, 2.6, 2.75, 2.9, 3.1]
    def grab(page):
        first = [page.evaluate(GRAB, t) for t in times]
        again = [page.evaluate(GRAB, t) for t in reversed(times)][::-1]
        return first, again
    first, again = _page(spec, grab)
    assert first == again


# ---------- riders ----------
def test_rider_objects_take_their_own_expr_and_look_at_a_target():
    spec = film([
        {"type": "bean", "id": "ghost", "who": "boss", "x": 0.08, "y": 0.9, "size": 300},
        {"type": "vehicle", "kind": "car1950", "id": "car", "x": 0.6, "y": 0.9, "size": 700,
         "riders": [{"who": "driver", "expr": [{"at": 0, "v": "happy"}, {"at": 1.5, "v": "shock"}],
                     "lookAt": [{"at": 0, "v": [0.98, 0.5]}, {"at": 1.5, "v": "ghost"}]}, "boss"]},
        {"type": "vehicle", "kind": "model-t", "x": 0.6, "y": 0.5, "size": 400, "dir": -1,
         "riders": [{"who": "driver", "lookAt": [{"at": 0, "v": [0.02, 0.5]}, {"at": 1.5, "v": [0.98, 0.5]}]}]},
    ])
    js = """() => {
      const T = TOON, seen = {}, base = T.directBean;
      T.directBean = (Ly, lt, env) => { const r = base(Ly, lt, env); if (Ly.__anchor) seen[Ly.id] = {facing: r.L.facing, expr: Ly.expr}; return r; };
      const pick = (keys, t) => { let v = keys[0].v; for (const k of keys) if (t >= k.at) v = k.v; return v; };
      window.renderFrame(2.5);
      const out = {};
      for (const [id, s] of Object.entries(seen)) out[id] = {start: pick(s.facing, 0.2), end: pick(s.facing, 2.5), expr: s.expr};
      T.directBean = base;
      return out;
    }"""
    out = _page(spec, lambda p: p.evaluate(js))
    car = next(v for k, v in out.items() if k.startswith("carr0:"))
    assert car["start"] == 1 and car["end"] == -1, f"the driver turns from the road ahead to the ghost behind: {car}"
    assert car["expr"][1]["v"] == "shock"
    anon = [v for k, v in out.items() if k.startswith("vehr0:")]
    assert len(anon) == 1, out
    # the model-t faces left (dir -1): looking left is its own forward (+1), looking right is behind it (-1)
    assert anon[0]["start"] == 1 and anon[0]["end"] == -1, anon


def test_rider_objects_render_in_classic_and_painted_cars():
    riders = [{"who": "driver", "expr": "angry", "talk": [[0, 1]]}, {"who": "boss", "scale": 0.9, "expr": "sad"}]
    for look in ("painted", None):
        spec = film([{"type": "vehicle", "kind": k, "x": 0.5, "y": 0.9, "size": 500, "riders": riders} for k in ("car1910", "sedan1920")], look)
        plain = copy.deepcopy(spec)
        for L in plain["shots"][0]["layers"]:
            L["riders"] = ["driver", "boss"]
        a = _page(spec, lambda p: p.evaluate(GRAB, 0.5))
        b = _page(plain, lambda p: p.evaluate(GRAB, 0.5))
        assert a != b, f"{look}: rider expressions change the drawing"
