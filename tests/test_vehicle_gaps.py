"""Engine gaps, vehicles and riders: dump-truck turn views, the projected three-quarter car views, the bean's rear
three-quarter view (`3q-back`, standing and riding), rider anchors that follow the suspension, and vehicle `riderLook`."""
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
VIEWS = ["front", "3q", "side", "3q-back", "back"]


def film(layers, look="painted", dur=3):
    out = {"seed": 3, "cast": {"driver": {"robe": "#4a3a2a", "hair": "short"}, "boss": {"robe": "#6c7078", "mustache": True}},
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


# draws one vehicle layer on a scratch canvas at layer time 1 and returns the PNG
DRAW = """(L) => { const T = TOON, F = T.film;
  const env = {spec: F.spec, cast: F.spec.cast, style: F.spec.style || {}, shot: F.timeline.shots[0], seed: 3, dpr: 1, lt: 1,
               st: {x: 400, y: 450, s: 1, flip: 1, sx: 1, sy: 1, r: 0, a: 1}};
  const c = document.createElement('canvas'); c.width = 900; c.height = 560; const ctx = c.getContext('2d'); ctx.translate(450, 480);
  T.layers.vehicle(ctx, L, 1, env); return c.toDataURL(); }"""


# ---------- 1. dump-truck turn views ----------
@pytest.mark.parametrize("look", ["painted", None])
def test_dump_truck_draws_five_views_and_keeps_its_classic_side(look):
    truck = {"type": "vehicle", "kind": "dump-truck", "size": 700, "riders": ["driver", "boss"], "tilt": 10}
    def run(page):
        out = {v: page.evaluate(DRAW, {**truck, "view": v}) for v in VIEWS}
        out["plain"] = page.evaluate(DRAW, truck)
        out["rig"] = page.evaluate("""() => [TOON.vehicleRig({kind: 'dump-truck'}, true), TOON.vehicleRig({kind: 'dump-truck', view: '3q'}, false),
          TOON.vehicleRig({kind: 'dump-truck', view: 'front', rig: 'classic'}, true)]""")
        return out
    out = _page(film([{**truck, "x": 0.5, "y": 0.9}], look), run)
    assert len({out[v] for v in VIEWS}) == 5, "every view is its own drawing"
    assert out["side"] == out["plain"], "view side is the classic drawing"
    assert out["rig"] == ["legacy", "v2", "legacy"]


def test_dump_truck_turns_through_views_on_a_timeline_and_a_path_reversal():
    js = """(P) => { const T = TOON, VK = T.VK, seq = (L, f) => { const out = []; for (let t = 0; t < 4; t += 1 / 30) { const v = f(L, t); out.push(v ? v.view : 'side'); } return out.filter((v, i, a) => !i || a[i - 1] !== v); };
      const tl = {type: 'vehicle', kind: 'dump-truck', view: [{at: 0, v: 'side'}, {at: 1, v: 'front'}]};
      const path = {type: 'vehicle', kind: 'dump-truck', size: 500, path: P};
      return {tl: seq(tl, (L, t) => VK.viewOf(L, t, t)), path: seq(path, (L, t) => VK.viewOf(L, t, t)),
              squash: Math.min(...Array.from({length: 120}, (_, i) => { const st = T.layerState(path, i / 30); return st ? st.sx : 1; })), rig: T.vehicleRig(path, false)}; }"""
    out = _page(film([{"type": "vehicle", "kind": "dump-truck", "x": 0.5, "y": 0.9}]), lambda p: p.evaluate(js, UTURN))
    assert out["tl"] == ["side", "3q", "front"], out["tl"]
    assert out["path"] == ["side", "3q", "front", "3q", "side"], out["path"]
    assert out["rig"] == "v2" and out["squash"] == 1, "a reversing truck turns through its views instead of squashing"


def test_dump_truck_views_validate_and_render_with_a_tipping_bed():
    truck = {"type": "vehicle", "kind": "dump-truck", "x": 0.5, "y": 0.9, "size": 600, "riders": ["driver", "boss"],
             "tilt": [{"at": 0, "v": 0}, {"at": 0.4, "v": 0}, {"at": 1.4, "v": 45}],
             "view": [{"at": 0, "v": "3q"}, {"at": 1.6, "v": "back"}]}
    spec = film([truck], dur=3)
    assert validate(spec) == []
    frames = _page(spec, lambda p: [p.evaluate(GRAB, t) for t in (0.2, 1.2, 2.6)])
    assert len(set(frames)) == 3


# ---------- 2. projected three-quarter views ----------
def test_three_quarter_projection_is_a_real_turn_with_upright_riders():
    js = """() => { const T = TOON, VK = T.VK, out = {};
      for (const kind of ['model-t', 'sedan1920', 'car1950', 'car-modern']) {
        let o = null; const base = VK.car3q; VK.car3q = (ctx, L, S, env, oo, k) => { o = oo; return base(ctx, L, S, env, oo, k); };
        const c = document.createElement('canvas'); c.width = 800; c.height = 500; const ctx = c.getContext('2d'); ctx.translate(400, 450);
        const F = T.film, env = {spec: F.spec, cast: F.spec.cast, style: {}, shot: F.timeline.shots[0], seed: 3, dpr: 1, lt: 1, st: {x: 400, y: 450, s: 1, flip: 1, sx: 1, sy: 1, r: 0, a: 1}};
        const beans = [], bean = T.layers.bean;
        T.layers.bean = (cx, Ly, lt, e) => { const m = cx.getTransform(); beans.push([m.a, m.b, m.c, m.d, Ly.view || null]); return bean(cx, Ly, lt, e); };
        T.layers.vehicle(ctx, {type: 'vehicle', kind, size: 600, riders: ['driver', 'boss'], view: '3q'}, 1, env);
        T.layers.vehicle(ctx, {type: 'vehicle', kind, size: 600, riders: ['driver', 'boss'], view: '3q-back'}, 1, env);
        T.layers.bean = bean; VK.car3q = base;
        const g = VK.geo3q(o, true), w = o.wheels, hw = o.face.hw;
        out[kind] = {frontLow: g.proj(w[w.length - 1], 0, hw)[1] - g.proj(w[0], 0, hw)[1], farUp: g.proj(0, 0, -hw)[1] - g.proj(0, 0, hw)[1],
                     faceRight: g.proj(o.face.front, -100, -hw)[0] - g.proj(o.face.front, -100, hw)[0], shear: g.side[1], beans};
      }
      return out; }"""
    out = _page(film([{"type": "vehicle", "kind": "car1950", "x": 0.5, "y": 0.9}]), lambda p: p.evaluate(js))
    for kind, o in out.items():
        assert o["frontLow"] > 5, f"{kind}: the near side runs down toward the front (seen from above)"
        assert o["farUp"] < -5, f"{kind}: the far side sits higher than the near side"
        assert o["faceRight"] > 20, f"{kind}: the front face shows to the right of the near corner"
        assert o["shear"] > 0.05, f"{kind}: the side plane is turned, not just squeezed"
        for a, b, c, d, view in o["beans"]:
            assert abs(b) < 1e-6 * abs(a) + 1e-9 and abs(c) < 1e-6 * abs(d) + 1e-9 and abs(a - d) < 1e-6 * abs(a), f"{kind}: riders stay upright"
        assert {v for *_, v in o["beans"]} >= {"3q-back"}, f"{kind}: riders in 3q-back are seen from behind"


def test_three_quarter_views_render_in_both_looks_deterministically():
    layers = [{"type": "vehicle", "kind": k, "x": 0.15 + i * 0.23, "y": 0.6 + (i % 2) * 0.3, "size": 380, "riders": ["driver", "boss"], "lights": True,
               "view": [{"at": 0, "v": "3q"}, {"at": 1, "v": "3q-back"}], "path": {"pts": [[0.15 + i * 0.23, 0.9], [0.2 + i * 0.23, 0.9]], "dur": 2}}
              for i, k in enumerate(["model-t", "sedan1920", "car1950", "car-modern"])]
    for look in ("painted", None):
        spec = film(layers, look)
        def grab(page):
            return [page.evaluate(GRAB, t) for t in (0.5, 1.5)], [page.evaluate(GRAB, t) for t in (1.5, 0.5)][::-1]
        a, b = _page(spec, grab)
        assert a == b and a[0] != a[1]


# ---------- 3. the bean's rear three-quarter view ----------
def test_bean_3q_back_is_its_own_view_for_standing_characters():
    beans = [{"type": "bean", "id": "b" + v, "who": "driver", "x": 0.1 + i * 0.2, "y": 0.9, "size": 400, "view": v} for i, v in enumerate(VIEWS)]
    spec = film(beans, look=None)
    assert validate(spec) == []
    assert any("view" in e for e in validate(film([{**beans[0], "view": "3q-front"}])))
    js = """() => { const T = TOON, F = T.film, out = {};
      const env = {spec: F.spec, cast: F.spec.cast, style: {}, shot: F.timeline.shots[0], seed: 3, dpr: 1, lt: 1, st: null};
      for (const view of ['front', '3q', 'side', '3q-back', 'back']) {
        const c = document.createElement('canvas'); c.width = 500; c.height = 500; const ctx = c.getContext('2d'); ctx.translate(250, 480);
        T.layers.bean(ctx, {type: 'bean', who: 'driver', size: 420, view}, 1, env); out[view] = c.toDataURL();
      }
      const seq = (L) => { const o = []; for (let t = 0.95; t < 1.3; t += 1 / 30) o.push(T.turnState(L, t).view); return o.filter((v, i, a) => !i || a[i - 1] !== v); };
      out.toQB = seq({view: [{at: 0, v: '3q'}, {at: 1, v: '3q-back'}]});
      out.toBack = seq({view: [{at: 0, v: '3q'}, {at: 1, v: 'back'}]});
      out.qbLeft = seq({view: '3q-back', facing: [{at: 0, v: 'right'}, {at: 1, v: 'left'}]});
      return out; }"""
    out = _page(spec, lambda p: p.evaluate(js))
    assert len({out[v] for v in VIEWS}) == 5, "3q-back differs from back and 3q"
    assert out["toQB"] == ["3q", "side", "3q-back"], out["toQB"]
    assert out["toBack"] == ["3q", "side", "back"], "turns that do not involve 3q-back keep their stops"
    assert out["qbLeft"] == ["3q-back", "back", "3q-back"], out["qbLeft"]


def test_bean_3q_back_turns_the_head_and_keeps_classic_views():
    js = """() => { const T = TOON, F = T.film, base = T.headBack3q; let calls = 0; T.headBack3q = (...a) => { calls++; return base(...a); };
      const env = {spec: F.spec, cast: F.spec.cast, style: {}, shot: F.timeline.shots[0], seed: 3, dpr: 1, lt: 1, st: null};
      const c = document.createElement('canvas'); c.width = 500; c.height = 500; const ctx = c.getContext('2d'); ctx.translate(250, 480);
      for (const view of ['front', '3q', 'side', 'back']) T.layers.bean(ctx, {type: 'bean', who: 'driver', size: 420, view}, 1, env);
      const before = calls; T.layers.bean(ctx, {type: 'bean', who: 'driver', size: 420, view: '3q-back'}, 1, env);
      T.headBack3q = base; return [before, calls]; }"""
    assert _page(film([{"type": "bean", "who": "driver", "x": 0.5, "y": 0.9}], look=None), lambda p: p.evaluate(js)) == [0, 1]


# ---------- 4. rider anchors with the suspension, riderLook ----------
ANCHOR = """(times) => { const T = TOON, base = T.layers.bean, got = {};
  T.layers.bean = (ctx, Ly, lt, env) => { if (Ly.__anchor) { const m = ctx.getTransform(), y = -450 * Ly.size / 600, s = ctx.canvas.width / 1920;
    got[Ly.id] = {draw: [(m.c * y + m.e) / s, (m.d * y + m.f) / s], anchor: Ly.__anchor(window.__t)}; } return base(ctx, Ly, lt, env); };
  const out = [];
  for (const t of times) { window.__t = t; window.renderFrame(t); out.push(Object.values(got).map((g) => [g.draw[0] - g.anchor.x, g.draw[1] - g.anchor.y])); }
  T.layers.bean = base; return out; }"""


@pytest.mark.parametrize("view", ["side", "3q", "front", "3q-back"])
def test_rider_anchor_follows_the_suspension(view):
    car = {"type": "vehicle", "kind": "sedan1920", "id": "car", "size": 700, "terrain": "rough", "view": view,
           "path": {"pts": [[0.2, 0.85], [0.8, 0.85]], "dur": 3, "ease": "linear"},
           "riders": [{"who": "driver", "lookAt": [0.98, 0.3]}, {"who": "boss", "lookAt": [0.02, 0.3]}]}
    out = _page(film([car], look=None), lambda p: p.evaluate(ANCHOR, [0.7, 1.3, 1.9, 2.4]))
    errs = [abs(v) for frame in out for d in frame for v in d]
    assert errs and max(errs) < 0.6, f"the anchor is where the head is drawn: {out}"


def test_classic_car1910_anchor_follows_the_drive_bob():
    car = {"type": "vehicle", "kind": "car1910", "id": "c", "x": 0.5, "y": 0.85, "size": 600, "drive": [[0, 3]],
           "riders": [{"who": "driver", "lookAt": [0.98, 0.3]}]}
    out = _page(film([car], look=None), lambda p: p.evaluate(ANCHOR, [0.1, 0.27, 0.5]))
    errs = [abs(v) for frame in out for d in frame for v in d]
    assert errs and max(errs) < 0.6, out


def test_vehicle_rider_look_validates_merges_and_swaps():
    car = {"type": "vehicle", "kind": "car1950", "x": 0.5, "y": 0.9, "size": 600, "riderLook": {"age": "child"},
           "riders": ["driver", {"who": "boss", "look": {"hairColor": "#20a020"}}]}
    assert validate(film([car])) == []
    for bad in ({"riderLook": {"age": "ancient"}}, {"riderLook": 5}, {"swap": [{"at": 1, "riderLook": {"hair": "zzz"}}]}):
        assert any("riderLook" in e for e in validate(film([{**car, **bad}]))), bad
    assert any("riderLook" in e for e in validate(film([{"type": "creature", "kind": "horse", "x": 0.5, "y": 0.9, "rider": "driver", "riderLook": {"age": "x"}}])))
    js = """() => { const T = TOON, base = T.layers.bean, seen = []; T.layers.bean = (c, Ly, lt, e) => { seen.push([Ly.who, Ly.look || null]); return base(c, Ly, lt, e); };
      window.renderFrame(0.5); T.layers.bean = base; return seen; }"""
    seen = _page(film([car]), lambda p: p.evaluate(js))
    assert ["driver", {"age": "child"}] in seen and ["boss", {"age": "child", "hairColor": "#20a020"}] in seen, seen
    plain = film([{k: v for k, v in car.items() if k != "riderLook"}])
    swapped = film([{**{k: v for k, v in car.items() if k != "riderLook"}, "swap": [{"at": 1, "riderLook": {"age": "elder"}}]}])
    a = _page(plain, lambda p: [p.evaluate(GRAB, t) for t in (0.5, 1.5)])
    b = _page(swapped, lambda p: [p.evaluate(GRAB, t) for t in (0.5, 1.5)])
    assert a[0] == b[0] and a[1] != b[1], "a riderLook swap ages the riders from its time on"
    layers = [{"type": "vehicle", "kind": k, "size": 500, "rider": "driver", "riders": ["driver"]} for k in ("dump-truck", "bicycle", "wagon", "locomotive", "balloon")]
    pairs = _page(film([{**layers[0], "x": 0.5, "y": 0.8}]), lambda p: [[p.evaluate(DRAW, L), p.evaluate(DRAW, {**L, "riderLook": {"age": "child"}})] for L in layers])
    for L, (x, y) in zip(layers, pairs):
        assert x != y, f"{L['kind']}: riderLook reaches the rider"
