"""Maps 2.0: bundled Natural Earth geography, projections, ISO / lon-lat regions, globe, painted style, flood / wipe /
draw-on conquest and lon-lat overlays.

  uv run --with pytest --with playwright --with pillow --with numpy pytest tests/test_geo_maps.py -q
"""
from __future__ import annotations

import copy
import json
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from spec import validate  # noqa: E402

SCALE = 0.25
W, H = 1920, 1080
RED, GREEN, YELLOW = "#e02020", "#20b020", "#f0d000"
STYLE = {"vignette": False, "grain": False}
EUROPE = {"proj": "equirect", "center": [5, 45], "span": 40}  # 40 degrees of longitude across the map box


def _map(geo, regions=None, **extra):
    return {"type": "map", "style": "atlas", "geo": geo, "regions": regions or [], **extra}


def _spec(layers, dur=3):
    return {"seed": 5, "style": STYLE, "cast": {}, "shots": [{"id": "g", "dur": dur, "bg": {"kind": "flat", "color": "#000000"}, "layers": layers}]}


def _equirect_px(lon, lat, geo=EUROPE, w=1.1):
    """World pixel of lon/lat for a flat equirect map layer centred in the frame (independent of the engine)."""
    k = w * W / geo["span"]
    return W / 2 + (lon - geo["center"][0]) * k, H / 2 - (lat - geo["center"][1]) * k


class Page:
    def __init__(self, pw, port, spec):
        import render as R

        self.browser, self.page, self.errors = R.open_page(pw, spec, port, SCALE)

    def pixels(self, t, pts):
        js = """([t, pts]) => { window.renderFrame(t); const c = window.__canvas.getContext('2d');
          return pts.map(([x, y]) => Array.from(c.getImageData(Math.round(x), Math.round(y), 1, 1).data.slice(0, 3))); }"""
        return self.page.evaluate(js, [t, [[x * SCALE, y * SCALE] for x, y in pts]])

    def count(self, t, rgb, tol=40):
        js = """([t, rgb, tol]) => { window.renderFrame(t); const c = window.__canvas, d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
          let n = 0; for (let i = 0; i < d.length; i += 4) if (Math.abs(d[i] - rgb[0]) < tol && Math.abs(d[i + 1] - rgb[1]) < tol && Math.abs(d[i + 2] - rgb[2]) < tol) n++; return n; }"""
        return self.page.evaluate(js, [t, rgb, tol])

    def png(self, t):
        return self.page.evaluate("async (t)=>{window.renderFrame(t);return window.__canvas.toDataURL('image/png');}", t)

    def eval(self, js, arg=None):
        return self.page.evaluate(js, arg)


@pytest.fixture(scope="module")
def browser_env():
    from playwright.sync_api import sync_playwright
    import render as R

    srv = R.serve(set())
    with sync_playwright() as pw:
        yield pw, srv.server_address[1]
    srv.shutdown()


@pytest.fixture
def page_for(browser_env):
    pages = []

    def make(spec):
        p = Page(*browser_env, spec)
        pages.append(p)
        return p

    yield make
    for p in pages:
        p.browser.close()


def near(rgb, hexcol, tol=60):
    h = hexcol.lstrip("#")
    ref = [int(h[i:i + 2], 16) for i in (0, 2, 4)]
    return all(abs(a - b) <= tol for a, b in zip(rgb, ref))


def bluish(rgb):
    return rgb[2] > rgb[0] + 30


# ---------- data and projections ----------
def test_bundled_geography_decodes_with_sane_country_boxes(page_for):
    p = page_for(_spec([]))
    js = """(iso) => ['lo', 'hi'].map((lv) => { const c = window.TOON.geoCountry(iso, lv); let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      const main = c.polys.reduce((a, q) => (q[0].length > a[0].length ? q : a));
      for (const [lon, lat] of main[0]) { x0 = Math.min(x0, lon); x1 = Math.max(x1, lon); y0 = Math.min(y0, lat); y1 = Math.max(y1, lat); }
      return [c.name, x0, x1, y0, y1, c.polys.length]; })"""
    for lv in p.eval(js, "FRA"):  # boxes are of the largest part (mainland), overseas parts are listed too
        assert lv[0] == "France" and -5.5 < lv[1] < -4 and 7 < lv[2] < 8.5, lv
    boxes = {iso: p.eval(js, iso) for iso in ("ESP", "PRT", "ITA", "CHN", "EGY", "DEU")}
    for iso, (lo, hi) in boxes.items():
        for name, x0, x1, y0, y1, n in (lo, hi):
            assert x0 < x1 and y0 < y1 and n >= 1, iso
    assert -10 < boxes["PRT"][1][1] < -6 and 36 < boxes["PRT"][1][3] < 38, boxes["PRT"]
    assert 73 < boxes["CHN"][1][1] < 74.5 and 134 < boxes["CHN"][1][2] < 135.5, boxes["CHN"]
    assert p.eval("() => window.TOON.geoCountries('lo').length") >= 170
    assert p.eval("() => window.TOON.geoCountries('hi').length") >= 230
    assert sorted(p.eval("() => Object.keys(window.TOON.GEO_PROJ)")) == ["equirect", "mercator", "ortho"]
    assert p.errors == []


def test_projections_put_the_center_mid_frame_and_hide_the_far_side(page_for):
    p = page_for(_spec([]))
    js = """([geo, pts]) => { const pr = window.TOON.geoProjector(geo, 2112, 1188, 0); return pts.map(([lon, lat]) => pr.project(lon, lat)); }"""
    for proj in ("equirect", "mercator", "ortho"):
        (x, y, vis), = p.eval(js, [{"proj": proj, "center": [20, 30], "span": 60}, [[20, 30]]])
        assert abs(x - 0.5) < 1e-6 and abs(y - 0.5) < 1e-6 and vis, proj
    (ex, ey, _), (wx, wy, _) = p.eval(js, [{"proj": "equirect", "center": [0, 0], "span": 60}, [[30, 0], [0, 30]]])
    assert abs(ex - 1.0) < 1e-6 and abs(ey - 0.5) < 1e-6  # 30 degrees east = half the 60-degree span
    assert abs(wx - 0.5) < 1e-6 and wy < 0.5  # north is up
    _, my, _ = p.eval(js, [{"proj": "mercator", "center": [0, 0], "span": 60}, [[0, 60]]])[0]
    _, qy, _ = p.eval(js, [{"proj": "equirect", "center": [0, 0], "span": 60}, [[0, 60]]])[0]
    assert my < qy, "mercator stretches high latitudes"
    (_, _, front), (_, _, back) = p.eval(js, [{"proj": "ortho", "center": [0, 0]}, [[10, 10], [170, 0]]])
    assert front and not back


# ---------- regions ----------
def test_iso_group_and_lonlat_regions_fill_real_places(page_for):
    regions = [{"id": "fr", "iso": "FRA", "color": RED, "dur": 0.001},
               {"id": "ib", "iso": ["ESP", "PRT"], "color": GREEN, "dur": 0.001},
               {"id": "x", "lonlat": [[-2, 36.5], [8, 36.5], [3, 40.5]], "clip": False, "color": YELLOW, "dur": 0.001}]
    p = page_for(_spec([_map(EUROPE, regions)]))
    paris, madrid, lisbon, sahara, biscay, bern = (_equirect_px(*q) for q in ((2.5, 47.2), (-3.7, 40.4), (-8.0, 39.6), (3, 37.5), (-6, 45.5), (8.0, 46.9)))
    px = p.pixels(1.0, [paris, madrid, lisbon, sahara, biscay, bern])
    assert near(px[0], RED), px
    assert near(px[1], GREEN) and near(px[2], GREEN), px
    assert near(px[3], YELLOW), px
    assert bluish(px[4]), px  # Bay of Biscay is sea
    assert not near(px[5], RED) and not near(px[5], GREEN), px  # Switzerland is plain land
    assert p.errors == []


def test_groups_merge_into_one_outline_and_drawn_regions_stop_at_the_coast(page_for):
    p = page_for(_spec([]))
    js = """(isos) => { const T = window.TOON, area = (r) => { let a = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += r[j][0] * r[i][1] - r[i][0] * r[j][1]; return Math.abs(a / 2); };
      const m = T.geoMerge(isos, 'hi'), parts = isos.map((iso) => area(T.geoCountry(iso, 'hi').polys[0][0]));
      return [m.length, Math.max(...m.map(area)), parts.reduce((a, b) => a + b, 0)]; }"""
    rings, merged, total = p.eval(js, ["AUT", "HUN", "CZE", "SVK"])
    assert rings == 1 and abs(merged - total) < 0.02 * total, (rings, merged, total)
    region = {"id": "gaul", "lonlat": [[-6, 43], [3, 43], [3, 49], [-6, 49]], "color": RED, "dur": 0.001}
    q = page_for(_spec([_map(EUROPE, [region])]))
    land, sea = _equirect_px(0.5, 46.5), _equirect_px(-4.5, 45.5)
    px = q.pixels(1.0, [land, sea])
    assert near(px[0], RED) and bluish(px[1]), px


def test_unknown_iso_and_projection_fail_loudly(page_for):
    for bad, needle in (({"proj": "equirect", "center": [0, 0], "span": 30}, "XXX"), ({"proj": "conic", "center": [0, 0], "span": 30}, "conic")):
        regions = [{"iso": "XXX" if needle == "XXX" else "FRA"}]
        with pytest.raises(SystemExit, match=needle):
            page_for(_spec([_map(bad, regions)]))


def test_flood_spreads_from_a_lonlat_point_and_wipe_follows_a_direction(page_for):
    regions = [{"id": "fr", "iso": "FRA", "color": GREEN, "dur": 0.001,
                "flood": {"at": 0.5, "dur": 1.0, "from": [-4.4, 48.2], "color": RED}},
               {"id": "es", "iso": "ESP", "color": GREEN, "dur": 0.001,
                "wipe": {"at": 0.5, "dur": 1.0, "dir": "right", "by": "#2040e0", "shape": "line"}}]
    p = page_for(_spec([_map(EUROPE, regions)]))
    brittany, strasbourg = _equirect_px(-2.5, 48.0), _equirect_px(7.2, 48.4)
    galicia, catalonia = _equirect_px(-7.5, 42.6), _equirect_px(1.4, 41.9)
    before = p.pixels(0.4, [brittany, strasbourg, galicia, catalonia])
    mid = p.pixels(0.95, [brittany, strasbourg, galicia, catalonia])
    after = p.pixels(2.0, [brittany, strasbourg, galicia, catalonia])
    assert all(near(c, GREEN) for c in before), before
    assert near(mid[0], RED) and near(mid[1], GREEN), mid
    assert near(mid[2], "#2040e0") and near(mid[3], GREEN), mid
    assert near(after[0], RED) and near(after[1], RED) and near(after[3], "#2040e0"), after
    assert p.errors == []


def test_draw_on_traces_the_border_before_the_fill(page_for):
    regions = [{"id": "fr", "iso": "FRA", "color": RED, "dur": 0.001, "drawOn": {"at": 0.2, "dur": 1.0}}]
    p = page_for(_spec([_map(EUROPE, regions)]))
    paris = _equirect_px(2.5, 47.2)
    assert not near(p.pixels(0.1, [paris])[0], RED)
    assert not near(p.pixels(0.5, [paris])[0], RED)
    assert near(p.pixels(2.0, [paris])[0], RED)
    assert p.count(0.1, [32, 32, 32], 60) < p.count(1.0, [32, 32, 32], 60) or p.png(0.4) != p.png(0.1)


# ---------- globe ----------
def test_ortho_globe_spins_regions_into_view(page_for):
    geo = {"proj": "ortho", "center": [{"at": 0, "v": [0, 10]}, {"at": 1.5, "v": [-100, 40]}], "radius": 0.42}
    regions = [{"id": "us", "iso": "USA", "color": RED, "dur": 0.001}]
    p = page_for(_spec([_map(geo, regions, style="painted")]))
    assert p.count(0.0, [224, 32, 32], 50) < 20
    assert p.count(2.0, [224, 32, 32], 70) > 500
    corner, centre = (60, 60), (W / 2, H / 2)
    px = p.pixels(2.0, [corner, centre])
    assert sum(px[0]) < 200, px  # space backdrop around the globe
    assert p.errors == []


# ---------- painted style ----------
def test_painted_style_is_textured_and_render_order_independent(page_for):
    geo = {"proj": "mercator", "center": [15, 42], "span": 34, "ranges": True, "rivers": True}
    regions = [{"id": "it", "iso": "ITA", "color": RED, "dur": 0.001, "face": {"mood": "happy"}, "label": "ITALY"}]
    spec = _spec([_map(geo, regions, style="painted", compass={"x": 0.9, "y": 0.82})])
    p = page_for(spec)
    times = [0.3, 1.2, 2.4]
    first = [p.png(t) for t in times]
    again = [p.png(t) for t in reversed(times)][::-1]
    assert first == again
    flat = copy.deepcopy(spec)
    flat["shots"][0]["layers"][0]["style"] = "atlas"
    q = page_for(flat)
    assert q.png(1.2) != first[1]
    assert p.errors == [] and q.errors == []


# ---------- overlays in lon/lat ----------
def test_lonlat_overlays_and_great_circle_arrows(page_for):
    p = page_for(_spec([]))
    L = _map({"proj": "equirect", "center": [-35, 45], "span": 90},
             [{"id": "fr", "iso": "FRA", "color": RED}],
             pins=[{"lon": 2.35, "lat": 48.85, "label": "Paris"}],
             routes=[{"pts": {"ll": [[-74, 40.7], [-9.1, 38.7]], "gc": True}}],
             arrows=[{"from": {"ll": [-74, 40.7]}, "to": {"ll": [2.35, 48.85]}}])
    out = p.eval("(L) => window.TOON.geoPrepare(L, 0, { seed: 1 })", L)
    pin = out["pins"][0]
    k = 1.1 * W / 90
    assert abs((pin["x"] - 0.5) * 1.1 * W - (2.35 + 35) * k) < 1.5
    assert abs((pin["y"] - 0.5) * 1.1 * H + (48.85 - 45) * k) < 1.5
    assert len(out["routes"][0]["pts"]) > 8, "gc routes are densified along the great circle"
    assert out["arrows"][0]["bend"] > 0.06, "the New York - Paris great circle bows north"
    region = out["regions"][0]
    assert len(region["pts"]) > 10 and all(0 <= x <= 1 for x, _ in region["pts"])
    assert p.errors == []


# ---------- validator ----------
def test_validator_checks_geo_fields():
    good = _spec([_map(EUROPE, [{"iso": "FRA"}, {"iso": ["ESP", "PRT"]}, {"lonlat": [[0, 0], [1, 0], [1, 1]]}])])
    assert validate(good) == []
    bad = _spec([_map({"proj": "conic", "center": [0, 0], "ranges": ["alps", "narnia"]},
                      [{"iso": "fr"}, {"lonlat": [[0, 0], [1, 1]]}, {"iso": "FRA", "flood": {"from": "x"}}])])
    errors = "\n".join(validate(bad))
    for needle in ("map proj", "narnia", "iso", "lonlat", "flood from"):
        assert needle in errors, (needle, errors)
