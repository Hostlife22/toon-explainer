"""Engine gaps: both cold-sweat beads of a `sick` face read in every view and hair kind; an ortho map's layer
modifiers (blur, material) reach its starfield while the starfield stays behind earlier layers."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from spec import validate  # noqa: E402

# Pale-blue bead pixels in a box (frame fractions): returns the x columns (canvas px) that hold any.
BEAD_COLS = """async ([t, box]) => { window.renderFrame(t); const c = window.__canvas, k = c.getContext('2d');
  const x0 = Math.floor(box[0] * c.width), y0 = Math.floor(box[1] * c.height), w = Math.floor(box[2] * c.width), h = Math.floor(box[3] * c.height);
  const d = k.getImageData(x0, y0, w, h).data, cols = new Set();
  for (let i = 0; i < d.length; i += 4) { const r = d[i], g = d[i + 1], b = d[i + 2];
    if (b > 205 && g > 200 && b - r >= 8) cols.add((i / 4) % w); }
  return [...cols].sort((a, b) => a - b); }"""
# Mean luminance (and spread) of a box in frame fractions.
LUMA = """async ([t, box]) => { window.renderFrame(t); const c = window.__canvas, k = c.getContext('2d');
  const [x, y, w, h] = box, d = k.getImageData(Math.floor(x * c.width), Math.floor(y * c.height), Math.max(1, Math.floor(w * c.width)), Math.max(1, Math.floor(h * c.height))).data;
  let s = 0, s2 = 0, n = d.length / 4; for (let i = 0; i < d.length; i += 4) { const l = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114; s += l; s2 += l * l; }
  return [s / n, Math.sqrt(Math.max(0, s2 / n - (s / n) ** 2))]; }"""
# Bright star points in a box: pixels with luminance above 110 (the space backdrop is far darker).
STARS = """async ([t, box]) => { window.renderFrame(t); const c = window.__canvas, k = c.getContext('2d');
  const [x, y, w, h] = box, d = k.getImageData(Math.floor(x * c.width), Math.floor(y * c.height), Math.floor(w * c.width), Math.floor(h * c.height)).data;
  let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114 > 110) n++; return n; }"""


def _page_run(spec: dict, fn, scale: float = 0.5):
    from playwright.sync_api import sync_playwright
    import render as R

    srv = R.serve(set())
    try:
        with sync_playwright() as pw:
            browser, page, errors = R.open_page(pw, spec, srv.server_address[1], scale)
            out = fn(page)
            browser.close()
    finally:
        srv.shutdown()
    assert errors == [], errors
    return out


def _runs(cols: list[int]) -> int:
    """Number of separate column runs (a gap of 3+ px splits two beads)."""
    runs, last = 0, None
    for x in cols:
        if last is None or x - last > 3:
            runs += 1
        last = x
    return runs


# ---------- sick face: both sweat beads read with every hair kind in front, 3q and side ----------
def test_sick_sweat_beads_both_read_in_every_view_and_hair_kind():
    hairs = ["short", "curly", "curly-big", "spikes", "volute", "wild", "long-straight", "bun"]
    views = ["front", "3q", "side"]
    shots = []
    for hair in hairs:
        for view in views:
            bean = {"type": "bean", "id": "b", "x": 0.5, "y": 0.95, "size": 900, "view": view, "expr": "sick", "enter": "none",
                    "look": {"hair": hair, "hairColor": "#5a3a22"}}
            shots.append({"id": f"{hair}_{view}".replace("-", "_"), "dur": 1, "bg": {"kind": "flat", "color": "#e8dcc0"}, "layers": [bean]})
    for look in ("painted", "classic"):
        spec = {"seed": 4, "style": {"look": look}, "shots": shots}
        assert validate(spec) == []
        box = [0.3, 0.05, 0.4, 0.45]  # the head
        cols = _page_run(spec, lambda page: [page.evaluate(BEAD_COLS, [i + 0.02, box]) for i in range(len(shots))])
        bad = [(s["id"], _runs(c)) for s, c in zip(shots, cols) if _runs(c) < 2]
        assert not bad, (look, "both sweat beads must show", bad)


def test_sick_back_view_draws_no_sweat_beads():
    bean = {"type": "bean", "id": "b", "x": 0.5, "y": 0.95, "size": 900, "view": "back", "expr": "sick", "enter": "none", "look": {"hair": "short"}}
    spec = {"seed": 4, "shots": [{"id": "s", "dur": 1, "bg": {"kind": "flat", "color": "#e8dcc0"}, "layers": [bean]}]}
    cols = _page_run(spec, lambda page: page.evaluate(BEAD_COLS, [0.02, [0.3, 0.05, 0.4, 0.45]]))
    assert cols == [], "the face is turned away"


# ---------- ortho globe: layer modifiers reach the starfield, which stays behind earlier layers ----------
def _globe_spec(mods: dict, before: list | None = None):
    globe = {"type": "map", "id": "globe", "x": 0.62, "geo": {"proj": "ortho", "radius": 0.3, "center": [10, 40], "stars": 400}, **mods}
    layers = [*(before or []), globe]
    return {"seed": 2, "style": {"look": "painted"}, "shots": [{"id": "s", "dur": 2, "bg": {"kind": "flat", "color": "#e8dcc0"}, "layers": layers}]}


CORNER = [0.0, 0.0, 0.25, 0.3]  # space only (the globe sits right of centre)


def test_ortho_starfield_takes_the_map_blur():
    sharp = _globe_spec({})
    blurred = _globe_spec({"blur": 8})
    assert validate(sharp) == [] and validate(blurred) == []
    n_sharp = _page_run(sharp, lambda page: page.evaluate(STARS, [1.0, CORNER]))
    n_blur = _page_run(blurred, lambda page: page.evaluate(STARS, [1.0, CORNER]))
    assert n_sharp > 8 and n_blur < n_sharp * 0.2, ("a blurred globe blurs its stars too", n_sharp, n_blur)
    edge = [0.0, 0.0, 0.005, 0.3]  # no pale fringe where the blur meets the frame edge
    l_sharp, _ = _page_run(sharp, lambda page: page.evaluate(LUMA, [1.0, edge]))
    l_blur, _ = _page_run(blurred, lambda page: page.evaluate(LUMA, [1.0, edge]))
    assert abs(l_blur - l_sharp) < 12, ("the blurred backdrop keeps a dark frame edge", l_sharp, l_blur)


def test_ortho_starfield_takes_the_map_material():
    plain = _globe_spec({})
    gold = _globe_spec({"material": "gold"})
    assert validate(gold) == []
    l_plain, _ = _page_run(plain, lambda page: page.evaluate(LUMA, [1.0, CORNER]))
    l_gold, _ = _page_run(gold, lambda page: page.evaluate(LUMA, [1.0, CORNER]))
    assert abs(l_gold - l_plain) > 15, ("the material recolours the space backdrop too", l_plain, l_gold)


def test_ortho_starfield_with_a_modifier_stays_behind_earlier_layers():
    card = {"type": "prop", "id": "crate", "kind": "crate", "x": 0.12, "y": 0.2, "size": 300, "enter": "none"}
    with_card = _globe_spec({"blur": 6}, [card])
    assert validate(with_card) == []
    box = [0.09, 0.12, 0.06, 0.08]  # the crate's face
    luma, _ = _page_run(with_card, lambda page: page.evaluate(LUMA, [1.0, box]))
    assert luma > 60, ("a layer listed before the globe stays in front of its blurred starfield", luma)


# ---------- review follow-ups: alpha once, the twos clock, painted: false ----------
def test_blurred_ortho_backdrop_takes_the_layer_alpha_once():
    def spec_of(mods):
        spec = _globe_spec(mods)
        spec["shots"][0]["layers"][-1]["geo"]["backdrop"] = "#000000"
        spec["shots"][0]["bg"] = {"kind": "flat", "color": "#ffffff"}
        spec["style"] = {"look": "classic"}
        assert validate(spec) == []
        return spec
    box = [0.05, 0.1, 0.1, 0.2]
    sharp, _ = _page_run(spec_of({"alpha": 0.5}), lambda page: page.evaluate(LUMA, [1.0, box]))
    blurred, _ = _page_run(spec_of({"alpha": 0.5, "blur": 8, "blurDim": 0}), lambda page: page.evaluate(LUMA, [1.0, box]))
    assert sharp > 80 and abs(blurred - sharp) < 4, ("a blurred half-transparent backdrop covers as much as a sharp one", sharp, blurred)


def test_keyed_backdrop_blur_follows_the_layers_twos_clock():
    sharp = _globe_spec({"onTwos": True})
    keyed = _globe_spec({"onTwos": True, "blur": [{"at": 0, "v": 0}, {"at": 0.08, "v": 8}]})
    assert validate(keyed) == []
    t = 2 / 30  # on twos (12 fps) the layer clock is still 0: no blur yet
    n_sharp = _page_run(sharp, lambda page: page.evaluate(STARS, [t, CORNER]))
    n_keyed = _page_run(keyed, lambda page: page.evaluate(STARS, [t, CORNER]))
    assert n_sharp > 8 and n_keyed == n_sharp, ("the backdrop is as sharp as the globe", n_sharp, n_keyed)


def test_backdrop_modifiers_honour_painted_false():
    spec = _globe_spec({"painted": False, "material": "stone"})
    assert validate(spec) == []
    probe = """() => { const T = window.TOON, M = T.LAYER_MODS.material, orig = M.apply, seen = [];
      M.apply = function (...a) { seen.push(!!T.PAINT); return orig.apply(this, a); };
      window.renderFrame(1.0); M.apply = orig; return seen; }"""
    seen = _page_run(spec, lambda page: page.evaluate(probe))
    assert len(seen) >= 2 and not any(seen), ("globe and backdrop both drawn without the painted look", seen)
