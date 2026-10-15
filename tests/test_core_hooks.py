"""Core hooks: swap, blur and rack focus, jitter, swing, letterbox, camera jumps, overlays, sub-shots, enter registry."""
from __future__ import annotations

import copy
import json
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from spec import validate  # noqa: E402

GRAB = "async (t)=>{window.renderFrame(t);return window.__canvas.toDataURL('image/png');}"

BASE = {
    "seed": 3,
    "cast": {"hero": {"robe": "#3a6ea5"}},
    "shots": [
        {"id": "a", "dur": 2, "bg": {"kind": "sky", "preset": "day"},
         "camera": {"zoom": [1, 1], "letterbox": {"at": 1.0, "h": 0.12}, "jump": [{"at": 1.5, "zoom": 1.4, "focus": [0.4, 0.4]}]},
         "focus": [{"at": 0.5, "on": "hero", "px": 8}],
         "layers": [
             {"type": "bean", "id": "hero", "who": "hero", "x": 0.4, "y": 0.85, "size": 500,
              "swap": [{"at": 1.0, "look": {"robe": "#c8323a"}}], "jitter": {"amp": 4}},
             {"type": "prop", "id": "coin", "kind": "coin", "x": 0.7, "y": 0.4, "swing": {"amp": 20}},
         ]},
        {"id": "b", "dur": 2, "bg": {"kind": "flat", "color": "#223344"},
         "layers": [{"type": "prop", "kind": "scroll", "x": 0.5, "y": 0.5, "blur": [{"at": 0, "v": 0}, {"at": 1, "v": 12}]}]},
    ],
    "overlays": [{"from": 0.5, "to": 3.5, "layer": {"type": "title", "text": "QUEST", "x": 0.5, "y": 0.1, "size": 60}}],
}


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


def test_v4_core_spec_validates_and_rejects_bad_fields():
    assert validate(BASE) == []
    bad = copy.deepcopy(BASE)
    bad["shots"][0]["focus"] = [{"at": 0, "on": "nobody"}]
    bad["shots"][0]["layers"][0]["swap"] = [{"look": {"robe": "red"}}]
    bad["overlays"] = [{"from": 2, "to": 1, "layer": {"type": "nope"}}]
    errors = "\n".join(validate(bad))
    for needle in ("focus[0]", "numeric at", "to must be", "unknown layer type"):
        assert needle in errors, (needle, errors)


def test_v4_core_hooks_change_the_frame_and_stay_deterministic():
    times = [0.2, 0.9, 1.2, 1.7, 2.2, 3.5, 3.9]
    first = _frames(BASE, times)
    again = _frames(BASE, list(reversed(times)))[::-1]
    assert first == again, "core-hook frames depend on render order"
    assert len(set(first)) == len(first), "swap / focus / letterbox / jump / blur / overlay should all change pixels"
    no_overlay = copy.deepcopy(BASE)
    no_overlay["overlays"] = []
    assert _frames(no_overlay, [3.0])[0] != _frames(BASE, [3.0])[0], "overlay must persist into the next shot"


def test_subshot_rejects_self_reference():
    from playwright.sync_api import sync_playwright
    import render as R

    srv = R.serve(set())
    try:
        with sync_playwright() as pw:
            browser, page, _ = R.open_page(pw, BASE, srv.server_address[1], 0.25)
            msg = page.evaluate("""() => {
                const env = {dpr: 0.25, seed: 1, spec: window.FILM_SPEC, cast: {}, style: {}};
                TOON.layers.__selfie = (ctx, L, lt, e) => { TOON.subShot('a', lt, e); };
                const spec = JSON.parse(JSON.stringify(window.FILM_SPEC));
                spec.shots[0].layers.push({type: '__selfie'});
                env.spec = spec;
                try { TOON.subShot('a', 0.5, env); return 'no error'; } catch (e) { return String(e.message); }
            }""")
            browser.close()
    finally:
        srv.shutdown()
    assert "nests deeper" in msg, msg


def test_vocab_enter_kinds_exist_in_engine():
    import spec as S
    from playwright.sync_api import sync_playwright
    import render as R

    builtin = {"none", "fade", "pop", "drop", "rise", "slide-left", "slide-right", "slide-up", "slide-down", "spin",
               "drop-squash", "pop-tilt", "slam"}
    srv = R.serve(set())
    try:
        with sync_playwright() as pw:
            browser, page, _ = R.open_page(pw, BASE, srv.server_address[1], 0.25)
            registered = set(page.evaluate("() => Object.keys(TOON.ENTERS)"))
            browser.close()
    finally:
        srv.shutdown()
    assert S.KNOWN_ENTER - builtin == registered, sorted((S.KNOWN_ENTER - builtin) ^ registered)


# Detects the two determinism leaks a code review found: RNG consumed inside a T.outlined path callback (the path is
# built twice, fill then stroke) and pooled scratch state that makes a frame depend on what was rendered before it.
RNG_PATCH = """() => {
  const T = window.TOON; window.__viol = {};
  let seq = 0, inside = null; const rng0 = T.rng;
  T.rng = (...a) => { const f = rng0(...a), id = ++seq; return (...b) => {
    if (inside !== null && id <= inside) { const k = (new Error().stack.split('\\n')[2] || '').trim(); window.__viol[k] = (window.__viol[k] || 0) + 1; }
    return f(...b); }; };
  const o0 = T.outlined;
  T.outlined = (ctx, fn, ...r) => o0(ctx, (k) => { const prev = inside; inside = seq; try { return fn(k); } finally { inside = prev; } }, ...r);
}"""
HASH = "async (t) => { window.renderFrame(t); return window.__canvas.toDataURL('image/png').slice(-4000); }"


@pytest.mark.parametrize("path", sorted((ROOT / "examples").glob("*/spec.json")), ids=lambda p: p.parent.name)
def test_examples_are_order_independent_and_paths_do_not_use_rng(path):
    import random
    from playwright.sync_api import sync_playwright
    import render as R
    from spec import load

    spec = load(path)
    page_spec, allowed = R.prepare_spec(path, spec)
    srv = R.serve(allowed)
    try:
        with sync_playwright() as pw:
            browser, page, errors = R.open_page(pw, page_spec, srv.server_address[1], 0.2)
            page.evaluate(RNG_PATCH)
            shots = page.evaluate("window.__shots")  # every shot twice: toolkit examples show one feature per shot
            times = [round(sh["start"] + sh["dur"] * f, 3) for sh in shots for f in (0.35, 0.8)]
            forward = {t: page.evaluate(HASH, t) for t in times}
            random.Random(7).shuffle(times)
            moved = sorted(t for t in times if page.evaluate(HASH, t) != forward[t])
            viol = page.evaluate("window.__viol")
            browser.close()
    finally:
        srv.shutdown()
    assert errors == [], errors
    assert moved == [], f"frames depend on render order at {moved}"
    assert viol == {}, f"rng consumed inside T.outlined paths: {viol}"
