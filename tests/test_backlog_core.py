"""Engine backlog, core / camera / motion: world labels under a framed pan, smooth paths that never reverse, density
zoom keys, the ortho globe backdrop order, xray out, move from / by, grade out and the blackout fx."""
from __future__ import annotations

import copy
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from density import lint  # noqa: E402
from spec import validate  # noqa: E402

GRAB = "async (t)=>{window.renderFrame(t);return window.__canvas.toDataURL('image/png');}"
# mean luminance of the frame (or of a box in frame fractions) at time t
LUMA = """async ([t, box]) => { window.renderFrame(t); const c = window.__canvas, k = c.getContext('2d');
  const [x, y, w, h] = box || [0, 0, 1, 1], d = k.getImageData(Math.floor(x * c.width), Math.floor(y * c.height),
    Math.max(1, Math.floor(w * c.width)), Math.max(1, Math.floor(h * c.height))).data;
  let s = 0; for (let i = 0; i < d.length; i += 4) s += d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
  return s / (d.length / 4); }"""


def _page_run(spec: dict, fn):
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


def _shot(layers, **kw):
    return {"id": kw.pop("id", "s"), "dur": kw.pop("dur", 4), "bg": kw.pop("bg", {"kind": "room"}), "layers": layers, **kw}


def _spec(*shots, look="painted"):
    return {"seed": 2, "style": {"look": look}, "cast": {"a": {"robe": "#3a6ea5"}, "b": {"robe": "#c8323a"}}, "shots": list(shots)}


BEANS = [{"type": "bean", "id": "a", "who": "a", "x": 0.25, "y": 0.85}, {"type": "bean", "id": "b", "who": "b", "x": 0.75, "y": 0.85}]


# ---------- 5. world labels stay glued to the world while a framed camera pans ----------
def test_world_label_keeps_its_world_position_while_a_frame_camera_pans():
    label = {"type": "label", "id": "lab", "text": "SPOT", "x": 0.32, "y": 0.45, "hud": False, "size": 50, "enter": "none"}
    cam = {"frame": [{"at": 0, "target": "a", "size": "mcu"}, {"at": 1, "target": "b", "size": "mcu", "dur": 2.5}]}
    spec = _spec(_shot([*BEANS, label], camera=cam))
    assert validate(spec) == []
    probe = """() => { const T = window.TOON, orig = T.keepInFrame, out = []; let shift = null;
      T.keepInFrame = (ctx, L, env, h) => { const a = ctx.getTransform(); orig(ctx, L, env, h); const b = ctx.getTransform();
        if (L.id === 'lab') shift = (b.e - a.e) / a.a; };
      for (let t = 0; t < 4; t += 0.25) { window.renderFrame(t); out.push(shift); }
      T.keepInFrame = orig; return out; }"""
    shifts = _page_run(spec, lambda page: page.evaluate(probe))
    assert len(shifts) == 16 and all(s is not None for s in shifts)
    assert max(abs(s - shifts[0]) for s in shifts) < 0.5, ("the safe-frame shift must not change while the camera pans", shifts)


# ---------- 8. smooth paths with uneven spacing never loop backwards ----------
def test_smooth_path_with_uneven_spacing_never_reverses_or_overshoots():
    car = {"type": "vehicle", "id": "car", "kind": "sedan1920", "x": 0.1, "y": 0.9, "size": 300,
           "path": {"pts": [[-0.2, 0.9], [0.3, 0.9], [0.33, 0.88], [0.36, 0.9], [1.2, 0.9]], "dur": 4, "ease": "linear"}}
    loop = {"type": "prop", "id": "orb", "kind": "coin", "path": {"pts": [[0.3, 0.3], [0.7, 0.3], [0.72, 0.31], [0.7, 0.7], [0.3, 0.7]], "loop": True}}
    spec = _spec(_shot([car, loop], bg={"kind": "street1920"}))
    assert validate(spec) == []
    probe = """() => { const T = window.TOON, [car, orb] = T.film.spec.shots[0].layers;
      const tb = T.pathTable(T.pathSpec(car)); let back = 0, ymin = 1e9, ymax = -1e9;
      for (let i = 1; i < tb.pts.length; i++) { if (tb.pts[i][0] < tb.pts[i - 1][0] - 1e-6) back++; ymin = Math.min(ymin, tb.pts[i][1]); ymax = Math.max(ymax, tb.pts[i][1]); }
      let squash = 1; for (let t = 0; t <= 4; t += 0.05) squash = Math.min(squash, T.motionAt(car, t).turn);
      const lt = T.pathTable(T.pathSpec(orb)), xs = lt.pts.map((p) => p[0]), ys = lt.pts.map((p) => p[1]);
      return { turns: tb.turns.length, back, ymin, ymax, squash, ox: [Math.min(...xs), Math.max(...xs)], oy: [Math.min(...ys), Math.max(...ys)] }; }"""
    r = _page_run(spec, lambda page: page.evaluate(probe))
    assert r["turns"] == 0 and r["back"] == 0, r
    assert r["squash"] == 1, "no turn squash on a path that only goes right"
    assert 0.88 * 1080 - 0.5 <= r["ymin"] and r["ymax"] <= 0.9 * 1080 + 0.5, ("no overshoot past the points", r)
    assert r["ox"][0] >= 0.3 * 1920 - 0.5 and r["ox"][1] <= 0.72 * 1920 + 0.5, ("closed loops stay inside their points", r)
    assert r["oy"][0] >= 0.3 * 1080 - 0.5 and r["oy"][1] <= 0.7 * 1080 + 0.5, r


# ---------- 9. density uses the real zoom values ----------
def test_density_reads_keyed_zooms_and_frame_boxes():
    dense = [{"type": "prop", "kind": "coin"}] * 3 + [{"type": "fg", "kind": "grass"}]
    shot = lambda i, cam: {"id": f"z{i}", "dur": 2, "camera": cam, "layers": dense}  # noqa: E731
    keyed = [{"zoom": [{"at": 0, "v": v0}, {"at": 2, "v": v1}]} for v0, v1 in ((1, 1.1), (1.3, 1.4), (1, 1.2), (2, 2.1))]
    assert not any("same camera zoom" in w for w in lint({"shots": [shot(i, c) for i, c in enumerate(keyed)]}))
    same = [{"zoom": [{"at": 0, "v": 1.2}, {"at": 2, "v": 1.3}]}] * 3
    assert any("same camera zoom" in w for w in lint({"shots": [shot(i, c) for i, c in enumerate(same)]}))
    boxes = [{"frame": {"box": b}} for b in ([0.1, 0.1, 0.8, 0.8], [0.3, 0.3, 0.3, 0.3], [0.1, 0.2, 0.84, 0.7])]
    assert not any("same camera zoom" in w for w in lint({"shots": [shot(i, c) for i, c in enumerate(boxes)]}))
    mixed = [{}, {"zoom": [1, 1.04]}, {"zoom": [{"at": 0, "v": 1}, {"at": 3, "v": 1.04}]}]  # all the default size
    assert any("same camera zoom" in w for w in lint({"shots": [shot(i, c) for i, c in enumerate(mixed)]}))


# ---------- 10. the ortho globe's star backdrop stays behind earlier layers ----------
def test_ortho_globe_backdrop_stays_behind_layers_listed_before_the_map():
    globe = {"type": "map", "id": "globe", "x": 0.62, "geo": {"proj": "ortho", "radius": 0.4, "center": [10, 40]}}
    before = {"type": "prop", "id": "box", "kind": "crate", "x": 0.12, "y": 0.5, "size": 300}
    with_prop = _spec(_shot([before, globe], dur=2, bg={"kind": "flat", "color": "#334455"}))
    without = _spec(_shot([globe], dur=2, bg={"kind": "flat", "color": "#334455"}))
    assert validate(with_prop) == []
    box = [0.04, 0.38, 0.16, 0.24]
    a = _page_run(with_prop, lambda page: page.evaluate(LUMA, [1.0, box]))
    b = _page_run(without, lambda page: page.evaluate(LUMA, [1.0, box]))
    assert abs(a - b) > 8, ("the crate listed before the globe must be visible over the stars", a, b)


# ---------- xray out ----------
def test_xray_out_returns_the_layer_to_normal():
    bean = {"type": "bean", "id": "a", "who": "a", "x": 0.5, "y": 0.95, "size": 600, "view": "front", "xray": {"at": 99}}
    plain = _spec(_shot([bean], dur=3))  # an x-ray that never turns on: the same modifier route, normal pixels
    xr = copy.deepcopy(plain)
    xr["shots"][0]["layers"][0]["xray"] = {"at": 0.3, "dur": 0.3, "anatomy": True, "out": 1.5, "outDur": 0.4}
    assert validate(xr) == []
    bad = copy.deepcopy(xr)
    bad["shots"][0]["layers"][0]["xray"]["out"] = "later"
    assert any("xray out" in e for e in validate(bad))
    times = [1.0, 2.5]
    with_x = _page_run(xr, lambda page: [page.evaluate(GRAB, t) for t in times])
    without = _page_run(plain, lambda page: [page.evaluate(GRAB, t) for t in times])
    assert with_x[0] != without[0], "x-ray on at 1.0"
    assert with_x[1] == without[1], "x-ray fully off after out + outDur"


# ---------- move from / by ----------
def test_move_from_and_by_slide_a_layer():
    curtain = {"type": "prop", "id": "c", "kind": "crate", "x": 0.5, "y": 0.5, "enter": "none",
               "move": [{"at": 1, "dur": 1, "by": [-0.3, 0], "ease": "linear"}]}
    arrive = {"type": "prop", "id": "d", "kind": "crate", "x": 0.6, "y": 0.4, "enter": "none",
              "move": [{"at": 1, "dur": 1, "from": [0.1, 0.4], "ease": "linear"}, {"at": 3, "dur": 1, "from": [0.9, 0.9], "to": [0.9, 0.5], "ease": "linear"}]}
    legacy = {"type": "prop", "id": "e", "kind": "crate", "x": 0.5, "y": 0.5, "enter": "none", "move": [{"at": 1, "dur": 1, "to": [0.7, 0.5], "ease": "linear"}]}
    spec = _spec(_shot([curtain, arrive, legacy], dur=5))
    assert validate(spec) == []
    bad = copy.deepcopy(spec)
    bad["shots"][0]["layers"][0]["move"][0]["to"] = [0.1, 0.1]
    bad["shots"][0]["layers"][1]["move"][0]["from"] = [0.1]
    errs = "\n".join(validate(bad))
    assert "to or by" in errs and "move[0].from" in errs, errs
    probe = """() => { const T = window.TOON, Ls = T.film.spec.shots[0].layers, out = {};
      for (const L of Ls) out[L.id] = [0, 1.5, 2.5, 3.5, 4.5].map((t) => { const s = T.layerState(L, t); return [Math.round(s.x), Math.round(s.y)]; });
      return out; }"""
    r = _page_run(spec, lambda page: page.evaluate(probe))
    assert r["c"][0] == [960, 540] and r["c"][1] == [672, 540] and r["c"][2] == [384, 540], r["c"]
    assert r["d"][0] == [192, 432], ("an arriving step holds at from before it starts", r["d"])
    assert r["d"][1] == [672, 432] and r["d"][2] == [1152, 432], r["d"]
    assert r["d"][3] == [1728, 756] and r["d"][4] == [1728, 540], ("a later from step jumps to its start when it begins", r["d"])
    assert r["e"][0] == [960, 540] and r["e"][1] == [1152, 540] and r["e"][2] == [1344, 540], ("to-only moves unchanged", r["e"])


# ---------- grade out ----------
def test_grade_out_ends_the_grade_with_a_fade():
    plain = _spec(_shot(BEANS, dur=3), look="classic")
    graded = copy.deepcopy(plain)
    graded["shots"][0]["grade"] = {"preset": "horror", "at": 0.5, "dur": 0.3, "out": 1.5, "outDur": 0.5}
    assert validate(graded) == []
    bad = copy.deepcopy(graded)
    bad["shots"][0]["grade"]["out"] = 0.2
    assert any("must not be before" in e for e in validate(bad))
    times = [1.0, 1.75, 2.5]
    g = _page_run(graded, lambda page: [page.evaluate(GRAB, t) for t in times])
    p = _page_run(plain, lambda page: [page.evaluate(GRAB, t) for t in times])
    assert g[0] != p[0] and g[1] != p[1], "graded while on and while fading"
    assert g[2] == p[2], "no grade after out + outDur"


# ---------- blackout fx ----------
def test_blackout_darkens_the_frame_keeps_lights_and_comes_back():
    lamp = {"type": "prop", "id": "lamp", "kind": "candle", "x": 0.75, "y": 0.6, "size": 200}
    fx = {"type": "fx", "kind": "blackout", "at": 0.5, "fade": 0.2, "dur": 1.5, "level": 0.95, "lights": [{"id": "lamp", "r": 260, "dy": -60}]}
    spec = _spec(_shot([*BEANS, lamp, fx], dur=3))
    assert validate(spec) == []

    def run(page):
        return [page.evaluate(LUMA, [t, None]) for t in (0.2, 1.2, 2.8)] + [page.evaluate(LUMA, [1.2, [0.69, 0.4, 0.12, 0.16]]), page.evaluate(LUMA, [1.2, [0.2, 0.3, 0.1, 0.2]])]

    before, dark, after, lit, unlit = _page_run(spec, run)
    assert dark < before * 0.4, (before, dark)
    assert abs(after - before) < 1.0, ("lights back on after dur + fadeOut", before, after)
    assert lit > unlit * 3, ("the light keeps a bright hole around the lamp", lit, unlit)


# ---------- review follow-ups ----------
def test_blackout_is_render_order_independent_with_a_translucent_colour():
    lamp = {"type": "prop", "id": "lamp", "kind": "candle", "x": 0.7, "y": 0.6, "size": 200, "enter": "none"}
    fx = {"type": "fx", "kind": "blackout", "color": "#00000080", "fade": 0.01, "lights": ["lamp"]}
    spec = _spec(_shot([*BEANS, lamp, fx], dur=2))
    assert validate(spec) == []
    first = _page_run(spec, lambda page: [page.evaluate(GRAB, t) for t in (0.5, 0.5, 0.5)])
    assert first[0] == first[1] == first[2], "the blackout scratch must not accumulate across renders"


def test_a_later_from_step_does_not_hold_before_earlier_steps():
    L = {"type": "prop", "id": "p", "kind": "crate", "x": 0.5, "y": 0.5, "enter": "none",
         "move": [{"at": 1, "dur": 1, "to": [0.7, 0.5], "ease": "linear"}, {"at": 3, "dur": 1, "from": [0.9, 0.5], "to": [0.1, 0.5], "ease": "linear"}]}
    spec = _spec(_shot([L], dur=5))
    probe = """() => { const T = window.TOON, L = T.film.spec.shots[0].layers[0];
      return [0, 1.5, 2.5, 3.0, 3.5].map((t) => Math.round(T.layerState(L, t).x)); }"""
    xs = _page_run(spec, lambda page: page.evaluate(probe))
    assert xs == [960, 1152, 1344, 1344, 960], xs  # held where the first step ended until the from step begins


def test_globe_backdrop_follows_swaps_to_ortho():
    flat = {"type": "map", "id": "m", "x": 0.6, "geo": {"proj": "equirect", "center": [10, 40], "span": 60},
            "swap": [{"at": 0.5, "geo": {"proj": "ortho", "radius": 0.35, "center": [10, 40]}}]}
    spec = _spec(_shot([flat], dur=2, bg={"kind": "flat", "color": "#e8dcc0"}))
    assert validate(spec) == []
    corner = [0.0, 0.0, 0.12, 0.12]
    before, after = _page_run(spec, lambda page: [page.evaluate(LUMA, [t, corner]) for t in (0.2, 1.2)])
    assert after < 80, ("the swapped-in globe paints its starfield", before, after)


def test_vertical_world_label_shift_uses_each_samples_frame_centre():
    label = {"type": "label", "id": "lab", "text": "MARKET SQUARE", "x": 0.5, "y": 0.4, "hud": False, "size": 60, "enter": "none"}
    shot = _shot([*BEANS, label], dur=3, camera={"zoom": [2, 2]}, frame=[{"at": 0, "v": 0.2}, {"at": 3, "v": 0.8}])
    spec = {**_spec(shot), "format": "vertical"}
    assert validate(spec) == []
    probe = """() => { const T = window.TOON, orig = T.keepInFrame, out = []; let shift = null;
      T.keepInFrame = (ctx, L, env, h) => { const a = ctx.getTransform(); orig(ctx, L, env, h); const b = ctx.getTransform();
        if (L.id === 'lab') shift = (b.e - a.e) / a.a; };
      for (let t = 0; t < 3; t += 0.3) { shift = null; window.renderFrame(t); out.push(shift); }
      T.keepInFrame = orig; return out; }"""
    shifts = [s for s in _page_run(spec, lambda page: page.evaluate(probe)) if s is not None]
    assert shifts and max(abs(s - shifts[0]) for s in shifts) < 0.5, shifts


def test_pinned_blackout_lights_a_world_layer():
    lamp = {"type": "prop", "id": "lamp", "kind": "candle", "x": 0.75, "y": 0.6, "size": 200, "enter": "none"}
    fx = {"type": "fx", "kind": "blackout", "fade": 0.01, "lights": [{"id": "lamp", "r": 260}]}
    spec = _spec(_shot([*BEANS, lamp], dur=2, pinned=[fx]))
    assert validate(spec) == []
    lit, unlit = _page_run(spec, lambda page: [page.evaluate(LUMA, [1.0, b]) for b in ([0.7, 0.5, 0.1, 0.15], [0.2, 0.3, 0.1, 0.2])])
    assert lit > unlit * 3, (lit, unlit)


def test_blackout_lights_are_validated():
    def errs(lights):
        fx = {"type": "fx", "kind": "blackout", "lights": lights}
        return "\n".join(validate(_spec(_shot([*BEANS, fx], dur=2))))
    assert "lights" in errs(True)
    assert "r must be" in errs([{"x": 0.5, "y": 0.5, "r": -1}])
    assert "not the id" in errs(["nobody"])
    assert "lights" in errs([{"r": 100}])
    assert errs(["a", {"id": "b", "r": 200, "dy": -40}, {"x": 0.2, "y": 0.3}]) == ""


def test_grade_with_null_at_validates():
    spec = _spec(_shot(BEANS, dur=2, grade={"preset": "horror", "at": None, "out": 1}))
    assert validate(spec) == []


def test_density_box_zoom_accounts_for_the_vertical_strip():
    dense = [{"type": "prop", "kind": "coin"}] * 3 + [{"type": "fg", "kind": "grass"}]
    shots = [{"id": f"v{i}", "dur": 2, "camera": {"frame": {"box": [0.4, 0.3, w, 0.3]}}, "layers": dense} for i, w in enumerate((0.09, 0.16, 0.24))]
    assert not any("same camera zoom" in w for w in lint({"format": "vertical", "shots": shots}))
    assert any("same camera zoom" in w for w in lint({"shots": shots})), "landscape: all three fit the 0.3 height"


# ---------- integration review ----------
SHIFT_PROBE = """([t0, t1, dt, sub]) => { const T = window.TOON, orig = T.keepInFrame, out = []; let shift = null;
  T.keepInFrame = (ctx, L, env, h) => { const a = ctx.getTransform(); orig(ctx, L, env, h); const b = ctx.getTransform();
    if (L.id === 'lab') shift = Math.round((b.e - a.e) / a.a); };
  const env = { dpr: T.DPR, seed: 1, spec: T.film.spec, cast: T.film.spec.cast || {}, style: T.film.spec.style || {} };
  for (let t = t0; t <= t1 + 1e-9; t += dt) { shift = null; if (sub) T.subShot(sub, t, env); else window.renderFrame(t); out.push(shift); }
  T.keepInFrame = orig; return out; }"""


def test_moving_world_label_samples_its_own_position_over_time():
    label = {"type": "label", "id": "lab", "text": "ARRIVING", "x": -0.2, "y": 0.4, "hud": False, "size": 60, "enter": "none",
             "move": [{"at": 0, "dur": 2, "to": [0.7, 0.4], "ease": "linear"}]}
    spec = _spec(_shot([*BEANS, label], dur=3, camera={"zoom": [1, 1]}))
    shifts = [s for s in _page_run(spec, lambda page: page.evaluate(SHIFT_PROBE, [0, 2.8, 0.4, None])) if s is not None]
    assert shifts and all(s == 0 for s in shifts), ("a label that ends fully in frame slides in unclamped", shifts)


def test_subshot_vertical_world_label_shift_matches_core():
    label = {"type": "label", "id": "lab", "text": "MARKET", "x": 0.3, "y": 0.4, "hud": False, "size": 60, "enter": "none"}
    src = _shot([*BEANS, label], id="src", dur=3, camera={"zoom": [2, 2]}, frame=[{"at": 0, "v": 0.3}, {"at": 3, "v": 0.7}])
    other = _shot(BEANS, id="other", dur=1)
    spec = {**_spec(src, other), "format": "vertical"}
    assert validate(spec) == []
    shifts = [s for s in _page_run(spec, lambda page: page.evaluate(SHIFT_PROBE, [0, 2.8, 0.4, "src"])) if s is not None]
    assert shifts and max(shifts) - min(shifts) <= 1, shifts


def test_swapped_states_are_validated_for_refs_blackout_and_riders():
    fx = {"type": "fx", "kind": "blackout", "swap": [{"at": 1, "lights": ["missing"]}]}
    errs = "\n".join(validate(_spec(_shot([*BEANS, fx], dur=2))))
    assert "missing" in errs, errs
    car = {"type": "vehicle", "id": "car", "kind": "model-t", "x": 0.5, "y": 0.9, "riders": ["a"],
           "swap": [{"at": 1, "riders": [{"who": "nobody"}, {"who": "a", "lookAt": [{"at": 1.2, "v": "ghost"}]}]}]}
    errs = "\n".join(validate(_spec(_shot([*BEANS, car], dur=2))))
    assert "nobody" in errs and "riders[1]: lookAt" in errs, errs
