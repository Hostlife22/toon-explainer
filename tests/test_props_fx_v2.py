"""Props & FX 2.0: painted props and materials, new prop kinds, closed-form particles, impact language, painted paper."""
from __future__ import annotations

import copy
import json
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import spec as S  # noqa: E402
from spec import validate  # noqa: E402

GRAB = "async (t)=>{window.renderFrame(t);return window.__canvas.toDataURL('image/png');}"
EXAMPLE = ROOT / "examples" / "props_fx_v2" / "spec.json"

NEW_PROPS = ["flask", "round-flask", "beaker", "test-tube", "tube-rack", "retort", "burner",
             "book-stack", "paper-stack", "coin-pile", "banknotes", "gold-bars", "amphora", "apple", "cheese", "fish",
             "chair", "stool", "oil-lamp", "lantern", "inkwell",
             "hammer", "wrench", "saw", "shovel", "pickaxe", "anvil", "axe", "bow", "pistol", "musket", "cannon",
             "gears", "piston", "gauge", "valve", "fuel-pump"]
PAINTED_OVERRIDES = ["bottle", "crate", "barrel", "coin", "moneybag", "sack", "hourglass", "bulb", "book", "scroll",
                     "sword", "shield"]
NEW_FX = ["particles", "impact-frame", "streaks", "shockwave", "dustkick", "toxic-cloud", "aura"]
PAINTED_FX = ["smoke", "fire", "explosion", "dust", "puff", "gas"]
PRESETS = ["smoke", "dust", "sparks", "fire", "embers", "steam", "splash", "rain", "snow", "debris", "confetti",
           "leaves", "bubbles", "gas"]
NEW_DOCS = ["front-page", "letter"]


def _spec(layers, look=None, dur=2.0, bg=None):
    out = {"seed": 3, "cast": {"hero": {}},
           "shots": [{"id": "a", "dur": dur, "bg": bg or {"kind": "flat", "color": "#d8cdb4"}, "layers": layers}]}
    if look:
        out["style"] = {"look": look}
    return out


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


def _frames(spec: dict, times: list[float]) -> list[str]:
    return _page_eval(spec, lambda page: [page.evaluate(GRAB, t) for t in times])


# ---------- vocabulary and validation ----------
def test_vocab_lists_every_new_name():
    assert set(NEW_PROPS) <= S.KNOWN_PROPS, sorted(set(NEW_PROPS) - S.KNOWN_PROPS)
    assert set(NEW_FX) <= S.KNOWN_FX, sorted(set(NEW_FX) - S.KNOWN_FX)
    assert set(NEW_DOCS) <= S.LAYER_KINDS["doc"]
    assert S.LAYER_KINDS["particle_preset"] == set(PRESETS)


def test_particle_and_impact_fields_validate():
    good = _spec([
        {"type": "fx", "kind": "particles", "preset": "smoke", "x": 0.5, "y": 0.8, "rate": 20, "spread": 40,
         "life": 2, "gravity": -30, "wind": 20, "dur": 1.5},
        {"type": "fx", "kind": "impact-frame", "mode": "flat", "frames": 2, "at": 1},
        {"type": "fx", "kind": "streaks", "angle": 0, "count": 30},
        {"type": "prop", "id": "box", "kind": "crate", "x": 0.3, "y": 0.8, "trail": True},
        {"type": "fx", "kind": "dustkick", "target": "box"},
        {"type": "prop", "kind": "gauge", "x": 0.7, "y": 0.5, "value": [{"at": 0, "v": 0.1}, {"at": 1, "v": 0.9}]},
    ])
    assert validate(good) == []
    bad = copy.deepcopy(good)
    layers = bad["shots"][0]["layers"]
    layers[0].update(preset="lava", rate=-1, life=0, spread="wide")
    layers[1].update(mode="sepia", frames=0)
    layers[3]["trail"] = "long"
    layers[4]["target"] = "nobody"
    errors = "\n".join(validate(bad))
    for needle in ("particles preset", "rate", "life", "spread", "impact-frame mode", "frames", "trail", "nobody"):
        assert needle in errors, (needle, errors)


# ---------- engine ----------
def test_engine_registers_props_fx_docs_and_presets():
    js = """(a) => ({
      props: a.props.filter((k) => !TOON.PROPS[k]),
      fx: a.fx.filter((k) => !TOON.FX[k]),
      docs: a.docs.filter((k) => !TOON.DOCS[k]),
      presets: Object.keys(TOON.PARTICLE_PRESETS).sort(),
      classicProps: a.over.filter((k) => typeof TOON.PROPS_CLASSIC[k] !== 'function'),
      classicFx: a.pfx.filter((k) => typeof TOON.FX_CLASSIC[k] !== 'function'),
      api: ['particleAt', 'drawParticles', 'matGlass', 'matLiquid', 'matMetal', 'matWood', 'lookPainted'].filter((k) => typeof TOON[k] !== 'function'),
    })"""
    arg = {"props": NEW_PROPS, "fx": NEW_FX, "docs": NEW_DOCS, "over": PAINTED_OVERRIDES, "pfx": PAINTED_FX}
    out = _page_eval(_spec([]), lambda page: page.evaluate(js, arg))
    assert out["props"] == [] and out["fx"] == [] and out["docs"] == [], out
    assert out["presets"] == sorted(PRESETS)
    assert out["classicProps"] == [] and out["classicFx"] == [] and out["api"] == [], out


def test_particles_are_a_pure_function_of_seed_index_and_time():
    js = """(presets) => presets.map((preset) => {
      const o = { preset, id: 'p-' + preset, rate: 30, life: 1.5, dur: 3 };
      const pick = (t) => { const out = []; for (let i = 0; i < 60; i++) { const p = TOON.particleAt(o, i, t); out.push(p && [p.x, p.y, p.size, p.alpha].map((v) => v.toFixed(4)).join(',')); } return out.join('|'); };
      const a = pick(1.3); pick(0.2); pick(2.9);
      return { preset, same: a === pick(1.3), alive: a.split('|').filter((x) => x).length };
    })"""
    out = _page_eval(_spec([]), lambda page: page.evaluate(js, PRESETS))
    for row in out:
        assert row["same"], row
        assert row["alive"] > 0, row


def test_every_preset_draws_something_different_and_frames_ignore_render_order():
    layers = [{"type": "fx", "kind": "particles", "id": f"p{i}", "preset": p, "x": 0.08 + (i % 7) * 0.14,
               "y": 0.3 if i < 7 else 0.75, "rate": 25, "life": 1.2, "w": 80} for i, p in enumerate(PRESETS)]
    spec = _spec(layers, dur=3)
    times = [0.4, 1.1, 2.2]
    first = _frames(spec, times)
    again = _frames(spec, list(reversed(times)))[::-1]
    assert first == again, "particle frames depend on render order"
    empty = _frames(_spec([], dur=3), [1.1])[0]
    assert first[1] != empty
    singles = []
    for p in ("smoke", "sparks", "rain", "confetti"):
        singles.append(_frames(_spec([{"type": "fx", "kind": "particles", "preset": p, "x": 0.5, "y": 0.5}]), [1.0])[0])
    assert len(set(singles)) == len(singles)


def _classic_swap_equal(spec: dict, t: float) -> bool:
    js = """(t) => {
      window.renderFrame(t); const a = window.__canvas.toDataURL('image/png');
      const saveP = { ...TOON.PROPS }, saveF = { ...TOON.FX };
      Object.assign(TOON.PROPS, TOON.PROPS_CLASSIC); Object.assign(TOON.FX, TOON.FX_CLASSIC);
      window.renderFrame(t); const b = window.__canvas.toDataURL('image/png');
      Object.assign(TOON.PROPS, saveP); Object.assign(TOON.FX, saveF);
      return a === b;
    }"""
    return _page_eval(spec, lambda page: page.evaluate(js, t))


OVERRIDE_LAYERS = [{"type": "prop", "kind": k, "x": 0.07 + (i % 6) * 0.17, "y": 0.25 if i < 6 else 0.7, "size": 150}
                   for i, k in enumerate(PAINTED_OVERRIDES)]
FX_LAYERS = [{"type": "fx", "kind": k, "x": 0.15 + i * 0.14, "y": 0.6, "size": 120, "w": 200} for i, k in enumerate(PAINTED_FX)]


def test_classic_look_is_pixel_identical_to_the_original_props_and_fx():
    assert _classic_swap_equal(_spec(OVERRIDE_LAYERS + FX_LAYERS), 0.45)


def test_painted_look_repaints_props_and_fx():
    assert not _classic_swap_equal(_spec(OVERRIDE_LAYERS, look="painted"), 0.9)
    assert not _classic_swap_equal(_spec(FX_LAYERS, look="painted"), 0.45)


def test_impact_frame_holds_for_its_frames_only():
    base = _spec([{"type": "prop", "kind": "anvil", "x": 0.5, "y": 0.6, "size": 300}])
    hit = copy.deepcopy(base)
    hit["shots"][0]["layers"].append({"type": "fx", "kind": "impact-frame", "at": 1.0, "frames": 2, "mode": "invert"})
    times = [0.95, 1.0 + 1 / 60, 1.0 + 1 / 30 + 1 / 60, 1.0 + 3 / 30]
    a, b = _frames(base, times), _frames(hit, times)
    assert a[0] == b[0] and a[3] == b[3]
    assert a[1] != b[1] and a[2] != b[2]


def test_trail_modifier_draws_only_while_the_layer_moves():
    mover = {"type": "prop", "kind": "coin", "x": 0.2, "y": 0.5, "size": 140, "move": [{"at": 0.5, "dur": 0.5, "to": [0.8, 0.5], "ease": "linear"}]}
    plain, trail = _spec([mover]), _spec([{**mover, "trail": True}])
    a, b = _frames(plain, [0.25, 0.75, 1.5]), _frames(trail, [0.25, 0.75, 1.5])
    assert a[0] == b[0] and a[2] == b[2]
    assert a[1] != b[1]


def test_new_props_draw_in_both_looks_and_docs_get_painted_paper():
    layers = [{"type": "prop", "kind": k, "x": 0.05 + (i % 10) * 0.1, "y": 0.15 + (i // 10) * 0.25, "size": 120}
              for i, k in enumerate(NEW_PROPS)]
    for look in (None, "painted"):
        assert validate(_spec(layers, look=look)) == []
        _frames(_spec(layers, look=look), [0.2, 1.0])
    doc = [{"type": "doc", "kind": "document", "title": "MEMO", "lines": ["one", "two"], "x": 0.5, "y": 0.5}]
    classic, painted = _frames(_spec(doc), [1.0])[0], _frames(_spec(doc, look="painted"), [1.0])[0]
    assert classic != painted, "documents must get painted paper under the painted look"


def test_props_fx_v2_catalog_validates_and_renders():
    spec = json.loads(EXAMPLE.read_text(encoding="utf-8"))
    assert validate(spec) == []
    assert spec["style"]["look"] == "painted"
    kinds = {L.get("kind") for sh in spec["shots"] for L in sh["layers"]}
    assert {"particles", "impact-frame", "shockwave", "toxic-cloud", "front-page"} <= kinds
    starts, t = [], 0.0
    for sh in spec["shots"]:
        starts.append(t + sh["dur"] * 0.6)
        t += sh["dur"]
    _frames(spec, starts)
