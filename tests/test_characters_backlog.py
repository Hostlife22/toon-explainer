"""Engine backlog, characters group: upright flail poses, clear spectacles, visible age swaps (crowds and beans),
high reaches without `stretch`, a sick face without blood, and a held bottle that tips back after pouring."""
from __future__ import annotations

import base64
import copy
import io
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from spec import validate  # noqa: E402

GRAB = "async (t)=>{window.renderFrame(t);return window.__canvas.toDataURL('image/png');}"
PROBE = ("(ts) => ts.map((t) => { TOON.RIG_PROBE = {}; window.renderFrame(t); const p = TOON.RIG_PROBE; "
         "TOON.RIG_PROBE = null; return JSON.parse(JSON.stringify(p)); })")
CAST = {"a": {"robe": "#3a6ea5", "hair": "short", "hairColor": "#3a2a20"},
        "b": {"robe": "#b85a6a", "hair": "bun", "hairColor": "#4a2a1a"}}
SIZE = 600


def _bean(**kw) -> dict:
    out = {"type": "bean", "id": "hero", "who": "a", "x": 0.5, "y": 0.95, "size": SIZE}
    out.update(kw)
    return out


def _spec(layers: list, look: str | None = "painted", dur: float = 3, cast: dict | None = None) -> dict:
    spec = {"seed": 5, "cast": copy.deepcopy(cast or CAST),
            "shots": [{"id": "a", "dur": dur, "bg": {"kind": "flat", "color": "#cfd8dc"}, "layers": layers}]}
    if look:
        spec["style"] = {"look": look}
    return spec


def _page_eval(spec: dict, fn):
    from playwright.sync_api import sync_playwright
    import render as R

    srv = R.serve(set())
    try:
        with sync_playwright() as pw:
            browser, page, errors = R.open_page(pw, spec, srv.server_address[1], 0.5)
            out = fn(page)
            browser.close()
    finally:
        srv.shutdown()
    assert errors == [], errors
    return out


def _frames(spec: dict, times: list[float]) -> list[str]:
    return _page_eval(spec, lambda page: [page.evaluate(GRAB, t) for t in times])


def _probe(spec: dict, times: list[float]) -> list[dict]:
    return _page_eval(spec, lambda page: page.evaluate(PROBE, times))


def _img(url: str):
    from PIL import Image

    return Image.open(io.BytesIO(base64.b64decode(url.split(",", 1)[1]))).convert("RGB")


def _box(img, cx: float, cy: float, r: float):
    """Pixels of a box around a world point (images are rendered at scale 0.5)."""
    s = img.width / 1920
    return img.crop((int((cx - r) * s), int((cy - r) * s), int((cx + r) * s), int((cy + r) * s)))


# ---------- 1. flail poses stand upright ----------
def test_flail_poses_are_upright_and_upended_keeps_the_old_flip():
    js = """() => ['flail', 'flail-b', 'upended', 'upended-b'].map((n) => {
      const e = TOON.POSES[n]; return [n, e && e.body ? (e.body.rot || 0) : 0];
    })"""
    rows = dict(_page_eval(_spec([]), lambda page: page.evaluate(js)))
    assert abs(rows["flail"]) <= 20 and abs(rows["flail-b"]) <= 20, rows
    assert rows["upended"] == 160 and rows["upended-b"] == 160, rows


def test_flail_raises_both_hands_above_the_shoulders():
    for pose in ("flail", "flail-b"):
        spec = _spec([_bean(pose=pose, expr="scream")])
        hands = _probe(spec, [0.8])[0]["hero"]["hands"]
        top = 0.95 * 1080 - SIZE * 292 / 600  # shoulder height in world px
        for hx, hy in hands:
            assert hy < top, (pose, hands)


# ---------- 2. glasses: true draws clear spectacles ----------
def _eye_luma(glasses) -> float:
    cast = copy.deepcopy(CAST)
    if glasses is not None:
        cast["a"]["glasses"] = glasses
    spec = _spec([_bean(view="front", blink=False, rock=0)], cast=cast)
    img = _img(_frames(spec, [0.5])[0])
    k = SIZE / 600
    lum = []
    for sx in (-1, 1):
        crop = _box(img, 960 + sx * 52 * k, 0.95 * 1080 - 458 * k, 22 * k)
        px = list(crop.getdata())
        lum.append(sum(0.3 * r + 0.59 * g + 0.11 * b for r, g, b in px) / len(px))
    return sum(lum) / 2


def test_glasses_true_draws_clear_spectacles_and_sun_stays_dark():
    bare, clear, sun = _eye_luma(None), _eye_luma(True), _eye_luma("sun")
    assert sun < bare * 0.55, (bare, sun)  # sunglasses black out the eyes
    assert clear > bare * 0.8, (bare, clear)  # spectacles: the eyes and skin show through
    cast = copy.deepcopy(CAST)
    cast["a"]["glasses"] = "clear"
    assert validate(_spec([_bean()], cast=cast)) == []


# ---------- 6. age swaps are visible on crowds and beans ----------
def _crowd(**kw) -> dict:
    out = {"type": "crowd", "id": "c", "who": ["a", "b"], "count": 4, "x": 0.5, "y": 0.9, "size": 320}
    out.update(kw)
    return out


def test_crowd_age_swap_and_look_change_the_members():
    swap = _spec([_crowd(swap=[{"at": 0.5, "look": {"age": "child"}}])])
    plain = _spec([_crowd()])
    s0, s1 = _frames(swap, [0.3, 0.8])
    p0, p1 = _frames(plain, [0.3, 0.8])
    assert s0 == p0  # before the swap nothing changes
    assert s1 != p1  # after it the crowd members are children
    look = _spec([_crowd(look={"age": "child"})])
    assert _frames(look, [0.8])[0] == s1  # a static crowd `look` is the same as the swapped one
    assert validate(swap) == [] and validate(look) == []


def test_bean_age_swap_shrinks_the_bean():
    spec = _spec([_bean(swap=[{"at": 0.5, "look": {"age": "child"}}], reach={"x": 0.5, "y": 0.0})])
    before, after = _probe(spec, [0.3, 0.8])
    assert before["hero"]["hands"][1][1] < after["hero"]["hands"][1][1] - 20, (before, after)


# ---------- 11. a high reach extends the arm without stretch ----------
def test_high_reach_lifts_the_hand_above_the_head_without_stretch():
    spec = _spec([_bean(x=0.4, reach={"x": 0.45, "y": 0.05}),
                  _bean(id="both", x=0.75, view="front", reach={"x": 0.75, "y": 0.02, "arm": "both"})])
    p = _probe(spec, [0.5])[0]
    feet = 0.95 * 1080
    eyes = feet - 458 * SIZE / 600
    assert p["hero"]["hands"][1][1] < eyes - 40, p["hero"]["hands"]
    for hx, hy in p["both"]["hands"]:
        assert hy < eyes - 40, p["both"]["hands"]


def test_level_reach_keeps_the_arm_length():
    k = SIZE / 600
    spec = _spec([_bean(rock=0, reach={"x": 0.95, "y": 0.95 - 292 * k / 1080})])
    hx, hy = _probe(spec, [0.5])[0]["hero"]["hands"][1]
    sx, sy = 960 + 92 * k, 0.95 * 1080 - 292 * k
    dist = ((hx - sx) ** 2 + (hy - sy) ** 2) ** 0.5
    assert dist < (84 + 80) * k * 1.04, (hx, hy, dist)  # a level target out of reach is not stretched toward


# ---------- 12. sick reads as sick, not as bleeding ----------
def _face(expr: str, look: str | None):
    spec = _spec([_bean(view="front", expr=expr, blink=False, rock=0)], look=look)
    img = _img(_frames(spec, [0.5])[0])
    k = SIZE / 600
    return _box(img, 960, 0.95 * 1080 - 440 * k, 130 * k)


def test_sick_face_has_no_red_drips_and_a_green_tint():
    for look in ("painted", None):
        sick, neutral = _face("sick", look), _face("neutral", look)
        reds = sum(1 for r, g, b in sick.getdata() if r > 130 and g < 70 and b < 80)
        assert reds == 0, (look, reds)

        def green(img):
            px = list(img.getdata())
            return sum(g - (r + b) / 2 for r, g, b in px) / len(px)

        assert green(sick) > green(neutral) + 3, (look, green(sick), green(neutral))


# ---------- missing feature: a held bottle tips back after pouring ----------
def test_bottle_pour_tilt_returns_upright():
    js = """() => {
      const f = TOON.PROP_TILT.bottle, D = 180 / Math.PI, at = (o, t) => +(f(o, t) * D).toFixed(2);
      const ev = { pour: { at: 0.3, dur: 0.6, back: 1.6 } };
      const evDur = { pour: { at: 0.3, dur: 0.6, back: 1.6, backDur: 0.2 } };
      const tl = { pour: [{ at: 0, v: 0 }, { at: 0.5, v: 1 }, { at: 1.5, v: 1 }, { at: 2, v: 0.25 }] };
      return { ev: [at(ev, 0.1), at(ev, 1.2), at(ev, 2.5)], evDur: [at(evDur, 1.7), at(evDur, 1.85)],
               tl: [at(tl, 0), at(tl, 1), at(tl, 2.5)], old: [at({ pour: { at: 0.3, dur: 0.6 } }, 5)] };
    }"""
    r = _page_eval(_spec([]), lambda page: page.evaluate(js))
    assert r["ev"] == [0, 110, 0], r
    assert 0 < r["evDur"][0] < 110 and r["evDur"][1] == 0, r
    assert r["tl"] == [0, 110, 27.5], r
    assert r["old"] == [110], r  # without `back` the bottle stays tipped, as before


def test_held_bottle_draws_upright_again_after_back():
    base = _bean(pose="hold", hold="bottle", rock=0, blink=False)
    ev = {"pour": {"at": 0.3, "dur": 0.6, "back": 1.4, "backDur": 0.4}, "liquid": "#e8f0f2"}
    keys = {"pour": [{"at": 0, "v": 0}, {"at": 0.5, "v": 1}, {"at": 1.2, "v": 1}, {"at": 1.6, "v": 0}]}
    # classic look (no liquid level): upright again afterwards, drawn the same as a bottle that never poured
    pour, tl = _spec([{**base, "holdProps": ev}], look=None), _spec([{**base, "holdProps": keys}], look=None)
    still = _spec([{**base, "holdProps": {}}], look=None)
    assert validate(pour) == [] and validate(tl) == []
    a, b = _frames(pour, [1.0, 2.5])
    c, d = _frames(tl, [1.0, 2.5])
    (e,) = _frames(still, [2.5])
    assert a != e and c != e  # tipped mid-pour
    assert b == e and d == e  # upright again afterwards
    # painted look: upright again, but the poured liquid stays poured (lower level than a full bottle)
    pp, ps = _spec([{**base, "holdProps": ev}]), _spec([{**base, "holdProps": {}}])
    f, g = _frames(pp, [1.0, 2.5])
    (h,) = _frames(ps, [2.5])
    assert f != g and g != h
    bad = _spec([{**base, "holdProps": {"pour": {"at": 0.3, "back": "later"}}}])
    assert any("pour" in x for x in validate(bad))


# ---------- review follow-ups ----------
def test_pour_spent_is_the_running_max_of_the_eased_tip_curve():
    js = """() => {
      const tl = [{ at: 0, v: 0 }, { at: 1, v: 0.8, ease: 'outBack' }], out = [];
      for (let i = 0; i <= 200; i++) { const t = i / 100; out.push([TOON.pourAmount(tl, t), TOON.pourSpent(tl, t)]); }
      return out;
    }"""
    rows = _page_eval(_spec([]), lambda page: page.evaluate(js))
    peak = max(a for a, _ in rows)
    spent = [s for _, s in rows]
    assert all(b >= a - 1e-9 for a, b in zip(spent, spent[1:])), "spent must never fall (liquid would rise again)"
    assert peak > 0.85 and abs(spent[-1] - peak) < 0.01, (peak, spent[-1])
    assert all(s >= a - 0.01 for a, s in rows)


def test_pour_back_starts_from_the_tip_reached_at_back():
    js = """() => {
      const ev = { at: 0, dur: 2, back: 1, backDur: 0.5 }, out = [];
      for (let i = 0; i <= 250; i++) { const t = i / 100; out.push([t, TOON.pourAmount(ev, t), TOON.pourSpent(ev, t)]); }
      return out;
    }"""
    rows = _page_eval(_spec([]), lambda page: page.evaluate(js))
    at_back = next(a for t, a, _ in rows if abs(t - 1) < 1e-9)
    after = [a for t, a, _ in rows if t >= 1]
    assert all(b <= a + 1e-9 for a, b in zip(after, after[1:])), "the bottle must only tip back after `back`"
    assert max(a for _, a, _ in rows) <= at_back + 1e-9
    assert after[-1] == 0
    assert abs(rows[-1][2] - at_back) < 1e-6, (rows[-1][2], at_back)  # spent stops at the real maximum


def test_crowd_look_is_validated_like_a_bean_look():
    for look in ({"skin": "green"}, {"age": "ancient"}):
        bad = _spec([_crowd(look=look)])
        assert any("look" in e for e in validate(bad)), look
        swapped = _spec([_crowd(swap=[{"at": 0.5, "look": look}])])
        assert any("look" in e for e in validate(swapped)), look


def test_bottle_prop_pour_is_validated():
    for pour in ([None], "soon", {"at": "x"}, [{"at": 0, "v": 2}]):
        bad = _spec([{"type": "prop", "kind": "bottle", "x": 0.5, "y": 0.5, "pour": pour}])
        assert any("pour" in e for e in validate(bad)), pour
    good = _spec([{"type": "prop", "kind": "bottle", "x": 0.5, "y": 0.5, "pour": [{"at": 0, "v": 0}, {"at": 1, "v": 1}]}])
    assert validate(good) == []


def test_mounted_crowd_riders_take_the_crowd_look():
    mounted = dict(creature="horse", count=2, size=300)
    swap = _spec([_crowd(swap=[{"at": 0.5, "look": {"age": "child"}}], **mounted)])
    plain = _spec([_crowd(**mounted)])
    s0, s1 = _frames(swap, [0.3, 0.8])
    p0, p1 = _frames(plain, [0.3, 0.8])
    assert s0 == p0 and s1 != p1
