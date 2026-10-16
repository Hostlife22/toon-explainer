"""Creatures and vehicles 2.0: path motion, gait cycles, distance-driven wheels, v2 rigs and the example catalog."""
from __future__ import annotations

import copy
import json
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from spec import LAYER_KINDS, validate  # noqa: E402

CATALOG = ROOT / "examples" / "creatures_vehicles_v2" / "spec.json"
BENCH = ROOT / "examples" / "painted_bench" / "spec.json"
GRAB = "async (t)=>{window.renderFrame(t);return window.__canvas.toDataURL('image/png');}"
NEW_CREATURES = {"cat", "bear", "rat", "chicken", "bird", "fish", "snake"}
NEW_VEHICLES = {"model-t", "sedan1920", "car1950", "car-modern", "chariot", "wagon", "locomotive", "ship", "sailship",
                "plane", "zeppelin", "balloon", "rocket"}
V2_CREATURES = {"horse", "cow", "bull", "sheep", "pig", "camel", "elephant", "dog", "wolf"} | NEW_CREATURES
V2_VEHICLES = {"tank", "train", "biplane", "submarine", "car1910"} | NEW_VEHICLES


def film(layers, look=None, dur=3):
    out = {"seed": 3, "cast": {"rider": {"robe": "#8a2a2a"}},
           "shots": [{"id": "s", "dur": dur, "bg": {"kind": "sky", "ground": "grass"}, "camera": {"zoom": [1, 1]},
                      "layers": [{"enter": "none", **layer} for layer in layers]}]}
    if look:
        out["style"] = {"look": look}
    return out


# ---------- vocabulary and validation ----------
def test_new_kinds_are_in_the_vocabulary():
    assert NEW_CREATURES <= LAYER_KINDS["creature"]
    assert NEW_VEHICLES <= LAYER_KINDS["vehicle"]


def test_catalog_validates_and_shows_every_new_kind_and_path_motion():
    spec = json.loads(CATALOG.read_text(encoding="utf-8"))
    assert validate(spec) == []
    layers = [L for s in spec["shots"] for L in s["layers"]]
    used = {(L["type"], L.get("kind")) for L in layers}
    assert {("creature", k) for k in NEW_CREATURES} <= used
    assert {("vehicle", k) for k in NEW_VEHICLES} <= used
    assert sum(1 for L in layers if "path" in L) >= 6, "the catalog demonstrates path motion"
    def names(key):
        out = set()
        for L in layers:
            v = L.get(key)
            out |= {k["v"] for k in v} if isinstance(v, list) else {v}
        return out
    assert names("gait") >= {"walk", "trot", "gallop"}
    assert names("state") >= {"idle", "eat", "sleep", "scared"}


GOOD_PATH = {"type": "vehicle", "kind": "plane", "x": 0.5, "y": 0.4, "size": 400,
             "path": {"pts": [[0.1, 0.5], [0.5, 0.3], [0.9, 0.5]], "at": 0.2, "dur": 2, "ease": "linear",
                      "curve": "smooth", "orient": True, "face": True, "bank": 20}}


def test_path_and_gait_fields_validate():
    assert validate(film([GOOD_PATH])) == []
    assert any("pts" in e for e in validate(film([{**GOOD_PATH, "path": [[0.1, 0.5], [0.9, 0.5]]}]))), "plain arrays: fx / cursor / map only"
    assert validate(film([{"type": "creature", "kind": "horse", "gait": [{"at": 0, "v": "walk"}, {"at": 1, "v": "gallop"}],
                           "state": "idle", "path": {"pts": [[0.1, 0.9], [0.9, 0.9]]}}])) == []


def test_bad_vehicle_enums_are_reported_without_crashing():
    for bad in ({"terrain": []}, {"animal": {}}, {"terrain": "lava"}, {"dust": float("nan")}):
        assert validate(film([{"type": "vehicle", "kind": "wagon", "x": 0.5, "y": 0.9, **bad}])), bad


@pytest.mark.parametrize("bad, message", [
    ({"path": {"pts": [[0.1, 0.5]]}}, "path"),
    ({"path": {"pts": [[0.1, float("nan")], [0.2, 0.5]]}}, "path"),
    ({"path": {"pts": [[0.1, 0.5], [0.2, 0.5]], "dur": float("inf")}}, "dur"),
    ({"path": {"pts": [[0.1, 0.5], [0.2, 0.5]], "bank": float("nan")}}, "bank"),
    ({"path": {"pts": [[0.1, 0.5], [0.2, 0.5]], "curve": []}}, "curve"),
    ({"path": {"pts": [[0.1, 0.5], [0.2, 0.5]], "ease": {}}}, "ease"),
    ({"gait": []}, "gait"),
    ({"gait": ["walk"]}, "gait"),
    ({"gait": {}}, "gait"),
    ({"gait": [{"at": "x", "v": "walk"}]}, "gait"),
    ({"state": [{"at": 0}]}, "state"),
    ({"path": {"pts": [[0.1, 0.5], "x"]}}, "path"),
    ({"path": {"pts": [[0.1, 0.5], [0.2, 0.5]], "dur": 0}}, "dur"),
    ({"path": {"pts": [[0.1, 0.5], [0.2, 0.5]], "ease": "wobbly"}}, "ease"),
    ({"path": {"pts": [[0.1, 0.5], [0.2, 0.5]], "curve": "spiral"}}, "curve"),
    ({"path": {"pts": [[0.1, 0.5], [0.2, 0.5], [0.3, 0.4]], "curve": "bezier"}}, "bezier"),
    ({"path": {"pts": [[0.1, 0.5], [0.2, 0.5]], "orient": "yes"}}, "orient"),
    ({"gait": "moonwalk"}, "gait"),
    ({"state": "dancing"}, "state"),
])
def test_bad_motion_fields_are_reported(bad, message):
    layer = {"type": "creature", "kind": "dog", "x": 0.5, "y": 0.9, **bad}
    errors = validate(film([layer]))
    assert any(message in e for e in errors), errors


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


def test_path_motion_is_uniform_exact_at_the_ends_and_faces_travel():
    js = """() => {
      const P = {pts: [[0.1, 0.6], [0.4, 0.3], [0.8, 0.5]], at: 0.5, dur: 2, ease: 'linear'};
      const L = {type: 'vehicle', kind: 'plane', path: P};
      const at = (t) => TOON.motionAt(L, t);
      const speeds = [];
      for (let t = 0.6; t < 2.45; t += 0.1) { const a = at(t), b = at(t + 0.02); speeds.push(Math.hypot(b.x - a.x, b.y - a.y) / 0.02); }
      const back = TOON.motionAt({path: {...P, pts: [...P.pts].reverse()}}, 1.5);
      const st = TOON.layerState({...L, path: {...P, orient: true}}, 1.5), p = at(1.5);
      return {start: at(0), end: at(9), speeds, dir: at(1.5).dir, backDir: back.dir, st: [st.x, st.y, st.r, st.flip], p: [p.x, p.y, p.ang],
              dist: at(2.5).dist, total: TOON.pathTable(TOON.pathSpec(L)).total};
    }"""
    out = _page_eval(film([GOOD_PATH]), lambda page: page.evaluate(js))
    assert out["start"]["x"] == pytest.approx(0.1 * 1920) and out["start"]["y"] == pytest.approx(0.6 * 1080)
    assert out["end"]["x"] == pytest.approx(0.8 * 1920, abs=0.5) and out["end"]["y"] == pytest.approx(0.5 * 1080, abs=0.5)
    sp = out["speeds"]
    assert max(sp) / min(sp) < 1.06, "constant speed along the curve (arc-length parametrisation)"
    assert out["dir"] == 1 and out["backDir"] == -1
    assert out["st"][0] == pytest.approx(out["p"][0]) and out["st"][1] == pytest.approx(out["p"][1])
    assert out["st"][2] == pytest.approx(out["p"][2], abs=1e-6), "orient rotates the layer to the tangent"
    assert out["dist"] == pytest.approx(out["total"], rel=1e-3)


def test_planted_feet_do_not_slide_and_gaits_differ():
    js = """() => {
      const G = TOON.GAIT, out = {};
      for (const g of ['walk', 'trot', 'gallop']) {
        let slip = 0, stanceSamples = 0, airborne = 0;
        const legs = [0, 1, 2, 3];
        for (let i = 0; i < 400; i++) {
          const ph = i / 400, d = 1e-4;
          let any = false;
          for (const leg of legs) {
            const a = G.foot(g, leg, ph), b = G.foot(g, leg, ph + d);
            if (a.stance && b.stance) { slip = Math.max(slip, Math.abs((b.x - a.x) + d)); stanceSamples++; any = true; }
          }
          if (!any) airborne++;
        }
        out[g] = {slip, stanceSamples, airborne, offsets: legs.map((l) => G.offset(g, l))};
      }
      return out;
    }"""
    out = _page_eval(film([GOOD_PATH]), lambda page: page.evaluate(js))
    for g, o in out.items():
        assert o["stanceSamples"] > 100, g
        assert o["slip"] < 1e-6, f"{g}: a planted foot slides by {o['slip']}"
    walk, trot, gallop = out["walk"]["offsets"], out["trot"]["offsets"], out["gallop"]["offsets"]
    assert len({round(x, 3) for x in walk}) == 4, "walk is a four-beat gait"
    assert len({round(x, 3) for x in trot}) == 2, "trot moves diagonal pairs together"
    assert out["gallop"]["airborne"] > 0, "a gallop has a moment of suspension"
    assert out["walk"]["airborne"] == 0


def test_wheels_turn_with_distance_travelled_not_time():
    js = """() => {
      const L = {type: 'vehicle', kind: 'model-t', size: 400, path: {pts: [[0.1, 0.8], [0.9, 0.8]], at: 0, dur: 2, ease: 'inOut'}};
      const m = (t) => TOON.vehicleMotion(L, t);
      const still = {type: 'vehicle', kind: 'model-t', size: 400, x: 0.5, y: 0.8};
      return {a: m(0.5), b: m(1.0), c: m(3), d: m(4), still: [TOON.vehicleMotion(still, 0.5).dist, TOON.vehicleMotion(still, 2).dist],
              p: [TOON.motionAt(L, 0.5).dist, TOON.motionAt(L, 1.0).dist]};
    }"""
    out = _page_eval(film([GOOD_PATH]), lambda page: page.evaluate(js))
    assert out["b"]["dist"] - out["a"]["dist"] == pytest.approx(out["p"][1] - out["p"][0], rel=1e-6)
    assert out["c"]["dist"] == out["d"]["dist"], "wheels stop when the path ends"
    assert out["still"] == [0, 0]
    assert out["b"]["speed"] > out["a"]["speed"], "ease-in: the car accelerates"


def test_legacy_rigs_stay_in_classic_and_upgrade_when_painted_or_using_new_fields():
    js = """() => ({
      plain: TOON.creatureRig({kind: 'horse', walk: [[0, 1]]}, false),
      painted: TOON.creatureRig({kind: 'horse'}, true),
      gait: TOON.creatureRig({kind: 'horse', gait: 'trot'}, false),
      goat: TOON.creatureRig({kind: 'goat'}, true),
      biped: TOON.creatureRig({kind: 'dog', pose: 'biped'}, true),
      cat: TOON.creatureRig({kind: 'cat'}, false),
      tank: TOON.vehicleRig({kind: 'tank', drive: [[0, 1]]}, false),
      tankP: TOON.vehicleRig({kind: 'tank'}, true),
      tankPath: TOON.vehicleRig({kind: 'tank', path: [[0, 0.8], [1, 0.8]]}, false),
      cart: TOON.vehicleRig({kind: 'cart'}, true),
      kinds: [Object.keys(TOON.CREATURES), Object.keys(TOON.VEHICLES)],
    })"""
    out = _page_eval(film([GOOD_PATH]), lambda page: page.evaluate(js))
    assert out["plain"] == "legacy" and out["painted"] == "v2" and out["gait"] == "v2"
    assert out["goat"] == "legacy" and out["biped"] == "legacy" and out["cat"] == "v2"
    assert out["tank"] == "legacy" and out["tankP"] == "v2" and out["tankPath"] == "v2" and out["cart"] == "legacy"
    assert V2_CREATURES <= set(out["kinds"][0]) and V2_VEHICLES <= set(out["kinds"][1])


def _catalog_times(spec, frac=(0.3, 0.75)):
    times, t = [], 0.0
    for shot in spec["shots"]:
        times += [t + shot["dur"] * f for f in frac]
        t += shot["dur"]
    return times


def test_catalog_renders_deterministically_in_any_order():
    spec = json.loads(CATALOG.read_text(encoding="utf-8"))
    times = _catalog_times(spec)

    def grab(page):
        first = [page.evaluate(GRAB, t) for t in times]
        again = [page.evaluate(GRAB, t) for t in reversed(times)][::-1]
        return first, again
    first, again = _page_eval(spec, grab)
    assert first == again, "trails, dust and gaits must not depend on render order"
    assert len(set(first)) == len(first), "every sampled frame differs (things move)"


def test_classic_catalog_renders_without_errors():
    spec = json.loads(CATALOG.read_text(encoding="utf-8"))
    spec = copy.deepcopy(spec)
    spec["style"] = {k: v for k, v in (spec.get("style") or {}).items() if k != "look"}
    times = _catalog_times(spec, (0.5,))
    frames = _page_eval(spec, lambda page: [page.evaluate(GRAB, t) for t in times])
    assert len(frames) == len(times)


def test_painted_bench_vehicle_shot_travels_a_path():
    spec = json.loads(BENCH.read_text(encoding="utf-8"))
    shot = next(s for s in spec["shots"] if s["id"] == "b07_vehicle")
    assert any(L.get("type") in ("vehicle", "creature") and "path" in L for L in shot["layers"])


def test_motion_edge_cases_stay_finite_and_signed():
    js = """() => {
      const T = TOON, fin = (o) => Object.values(o).every((v) => typeof v !== 'number' || Number.isFinite(v));
      const zero = T.motionAt({path: {pts: [[0.5, 0.5], [0.5, 0.5]], loop: true, dur: 1}}, 0.7);
      const early = T.motionAt({path: {pts: [[0.1, 0.5], [0.9, 0.5]], at: 1 / 120, dur: 1}}, 0);
      // outBack overshoots the end and comes back: the velocity turns negative near the end
      const P = {pts: [[0.1, 0.5], [0.9, 0.5]], at: 0, dur: 1, ease: 'outBack'};
      let back = null;
      for (let t = 0.3; t < 1; t += 0.01) { const m = T.motionAt({path: P}, t); if (m.vel < -1) { back = m; break; } }
      // leftward path with face: false -> the rig (facing right) walks backward: signed travel is negative
      const left = {type: 'creature', kind: 'horse', path: {pts: [[0.9, 0.8], [0.1, 0.8]], dur: 2, ease: 'linear', face: false}};
      const lt1 = T.layerTravel(left, 1), right = T.layerTravel({...left, path: {...left.path, face: true}}, 1);
      // a looping bezier closes: the point just before the wrap is near the start
      const B = {pts: [[0.1, 0.5], [0.3, 0.2], [0.6, 0.2], [0.8, 0.5]], curve: 'bezier', loop: true, dur: 2, ease: 'linear'};
      const end = T.motionAt({path: B}, 1.999), start = T.motionAt({path: B}, 0);
      const mo = T.CK.motion({kind: 'horse', state: 'sleep', gait: 'auto', path: {pts: [[0.1, 0.8], [0.9, 0.8]], dur: 1}}, 0.5,
                             {lt: 0.5, st: {s: 1, path: {}}}, {k: 1, legLen: 200});
      return {zero: fin(zero), early: [early.speed, fin(early)], back: back && [back.speed, back.dir], lt1: lt1.dist, right: right.dist,
              gap: Math.hypot(end.x - start.x, end.y - start.y), mode: mo.mode,
              tank: T.VK.TRAILS.tank({kind: 'tank', smoke: false, dust: false}, {size: 500}).length};
    }"""
    out = _page_eval(film([GOOD_PATH]), lambda page: page.evaluate(js))
    assert out["zero"], "zero-length loops stay finite"
    assert out["early"] == [0, True], "no speed before the path starts"
    assert out["back"] and out["back"][0] > 1 and out["back"][1] == -1, "moving back along the path: positive speed, facing back"
    assert out["lt1"] < 0 < out["right"], "face: false travel is signed by the rig's facing"
    assert out["gap"] < 30, "a looping bezier closes back to its start"
    assert out["mode"] == "sleep", "an explicit state wins over gait auto"
    assert out["tank"] == 0, "smoke: false and dust: false switch the tank trails off"


def test_smoke_history_does_not_change_when_the_engine_speeds_up():
    js = """() => {
      const VK = TOON.VK, L = {type: 'vehicle', kind: 'locomotive', size: 900, path: {pts: [[0.1, 0.8], [0.9, 0.8]], dur: 3, ease: 'in'}};
      const at = (t) => {
        const S = VK.state(L, t, {lt: t, st: {s: 1}}, 900), [kind, lx, ly, o] = VK.TRAILS.locomotive(L, S)[0];
        return VK.puffList(L, t, kind, lx, ly, o).map((p) => [p.i, Math.round(p.bx), Math.round(p.by), p.r.toFixed(3)].join(':'));
      };
      const a = at(1.6), b = at(2.2), sb = new Set(b), ib = new Set(b.map((k) => k.split(':')[0]));
      const common = a.filter((k) => ib.has(k.split(':')[0]));
      return {common: common.length, same: common.filter((k) => sb.has(k)).length};
    }"""
    out = _page_eval(film([GOOD_PATH]), lambda page: page.evaluate(js))
    assert out["common"] > 3
    assert out["same"] == out["common"], "puffs emitted earlier keep their emission point and size as the train accelerates"
