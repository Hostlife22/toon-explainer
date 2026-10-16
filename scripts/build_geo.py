#!/usr/bin/env python3
"""Build the bundled world geography (scripts/engine/lib/maps/geo-data-*.js) from Natural Earth GeoJSON.

Natural Earth (https://www.naturalearthdata.com) is public domain. Download the GeoJSON files listed in SOURCES into
one folder outside the repository (for example from the natural-earth-vector project's `geojson/` folder), then run

  python3 scripts/build_geo.py ~/ne-raw            # writes geo-data-lo.js (110m) and geo-data-hi.js (50m)
  python3 scripts/build_geo.py ~/ne-raw --stats    # print point counts and file sizes only

The output is deterministic: the same input files always give byte-identical JS.

How the data is packed
  * Coordinates are quantized to 1/Q degree. Country rings are split into shared arcs (TopoJSON style), so two
    neighbours share one border line: arcs used by one ring are coastline, arcs used by two rings are land borders.
  * Each arc is simplified with Douglas-Peucker (endpoints kept), tiny islands are dropped.
  * Numbers are zigzag varints in a 64-letter alphabet (5 data bits per letter, the sixth bit means "more letters").
    The decoder is TOON.geoDecode in geo.js.
"""
from __future__ import annotations

import argparse
import json
import math
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "scripts" / "engine" / "lib" / "maps"
Q = 100  # quantization steps per degree
ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"

# level: (countries, lakes, rivers, DP tolerance in degrees, min island area in deg^2, river max scalerank, lake max scalerank)
LEVELS = {
    "lo": ("ne_110m_admin_0_countries", "ne_110m_lakes", "ne_110m_rivers_lake_centerlines", 0.10, 0.05, 99, 99),
    "hi": ("ne_50m_admin_0_countries", "ne_50m_lakes", "ne_50m_rivers_lake_centerlines", 0.02, 0.003, 6, 3),
}
SOURCES = sorted({name + ".geojson" for level in LEVELS.values() for name in level[:3]})


# ---------- encoding ----------
def zigzag(v: int) -> int:
    return v * 2 if v >= 0 else -v * 2 - 1


def varints(values) -> str:
    out = []
    for v in values:
        z = zigzag(int(v))
        while True:
            chunk = z & 31
            z >>= 5
            out.append(ALPHABET[chunk | (32 if z else 0)])
            if not z:
                break
    return "".join(out)


def ascii_name(s) -> str:
    s = unicodedata.normalize("NFKD", str(s or "")).encode("ascii", "ignore").decode()
    return s.replace("\\", "").replace("'", "")


# ---------- geometry ----------
def quantize(ring):
    out = []
    for lon, lat in ring:
        p = (round(lon * Q), round(lat * Q))
        if not out or out[-1] != p:
            out.append(p)
    if len(out) > 1 and out[0] == out[-1]:
        out.pop()
    return out


def area(ring) -> float:
    a = 0.0
    for i in range(len(ring)):
        x0, y0 = ring[i - 1]
        x1, y1 = ring[i]
        a += x0 * y1 - x1 * y0
    return a / 2 / (Q * Q)


def dp(points, tol):
    """Douglas-Peucker on an open polyline, endpoints kept (tolerance in quantized units)."""
    if len(points) < 3:
        return list(points)
    keep = [False] * len(points)
    keep[0] = keep[-1] = True
    stack = [(0, len(points) - 1)]
    while stack:
        a, b = stack.pop()
        ax, ay = points[a]
        bx, by = points[b]
        dx, dy = bx - ax, by - ay
        L = math.hypot(dx, dy)
        best, idx = -1.0, -1
        for i in range(a + 1, b):
            px, py = points[i]
            d = abs(dy * (px - ax) - dx * (py - ay)) / L if L else math.hypot(px - ax, py - ay)
            if d > best:
                best, idx = d, i
        if best > tol and idx > 0:
            keep[idx] = True
            stack += [(a, idx), (idx, b)]
    return [p for p, k in zip(points, keep) if k]


def polygons_of(geom):
    if geom["type"] == "Polygon":
        return [geom["coordinates"]]
    if geom["type"] == "MultiPolygon":
        return geom["coordinates"]
    return []


def country_code(p) -> str:
    iso = p.get("ISO_A3")
    return iso if iso and iso != "-99" else p["ADM0_A3"]


# ---------- topology: split rings into shared arcs ----------
def build_topology(rings):
    """rings: list of quantized closed rings (no repeated last point). Returns (arcs, ring_arc_refs)."""
    neigh = {}
    for ring in rings:
        n = len(ring)
        for i, p in enumerate(ring):
            pair = frozenset((ring[i - 1], ring[(i + 1) % n]))
            neigh.setdefault(p, set()).add(pair)
    count = {}
    for ring in rings:
        for p in ring:
            count[p] = count.get(p, 0) + 1
    junction = {p for p, pairs in neigh.items() if len(pairs) > 1}
    arcs, index, refs = [], {}, []
    for ring in rings:
        js = [i for i, p in enumerate(ring) if p in junction]
        if not js:
            k = min(range(len(ring)), key=lambda i: ring[i])  # canonical rotation for closed arcs
            pieces = [ring[k:] + ring[:k] + [ring[k]]]
        else:
            start = js[0]
            rot = ring[start:] + ring[:start]
            cut = [i - start if i >= start else i - start + len(ring) for i in js] + [len(ring)]
            rot = rot + [rot[0]]
            pieces = [rot[cut[j]:cut[j + 1] + 1] for j in range(len(cut) - 1)]
        ring_refs = []
        for piece in pieces:
            key = tuple(piece)
            if key in index:
                ring_refs.append(index[key])
                continue
            rkey = tuple(reversed(piece))
            if rkey in index:
                ring_refs.append(~index[rkey])
                continue
            if piece[0] == piece[-1] and not js:  # a closed ring may match a reversed rotation
                rr = list(reversed(piece[:-1]))
                k = min(range(len(rr)), key=lambda i: rr[i])
                alt = tuple(rr[k:] + rr[:k] + [rr[k]])
                if alt in index:
                    ring_refs.append(~index[alt])
                    continue
            index[key] = len(arcs)
            arcs.append(list(piece))
            ring_refs.append(index[key])
        refs.append(ring_refs)
    return arcs, refs


def simplify_arc(arc, tol):
    if arc[0] == arc[-1] and len(arc) > 4:  # closed: split at the farthest point so both halves keep their shape
        far = max(range(len(arc)), key=lambda i: (arc[i][0] - arc[0][0]) ** 2 + (arc[i][1] - arc[0][1]) ** 2)
        a = dp(arc[: far + 1], tol)
        b = dp(arc[far:], tol)
        return a + b[1:]
    return dp(arc, tol)


# ---------- build one level ----------
def build_level(src: Path, level: str):
    cfile, lfile, rfile, tol_deg, min_area, river_rank, lake_rank = LEVELS[level]
    tol = tol_deg * Q
    feats = json.loads((src / f"{cfile}.geojson").read_text(encoding="utf-8"))["features"]
    feats.sort(key=lambda f: country_code(f["properties"]))
    rings, owners = [], []  # owners: (country index, polygon index, is hole)
    countries = []
    for ci, f in enumerate(feats):
        p = f["properties"]
        polys = polygons_of(f["geometry"])
        biggest = max(range(len(polys)), key=lambda i: abs(area(quantize(polys[i][0])))) if polys else -1
        kept = 0
        for pi, poly in enumerate(polys):
            outer = quantize(poly[0])
            if len(outer) < 3 or (abs(area(outer)) < min_area and pi != biggest):
                continue
            kept += 1
            for hi, ring in enumerate(poly):
                q = quantize(ring)
                if len(q) < 3 or (hi > 0 and abs(area(q)) < min_area):
                    continue
                rings.append(q)
                owners.append((ci, pi, hi > 0))
        countries.append({"iso": country_code(p), "name": ascii_name(p.get("NAME_EN") or p.get("NAME")),
                          "cont": ascii_name(p.get("CONTINENT")), "label": (p.get("LABEL_X"), p.get("LABEL_Y"))})
    arcs, refs = build_topology(rings)
    arcs = [simplify_arc(a, tol) for a in arcs]
    # assemble countries: [[ring refs...] per polygon] ; polygons keep their outer ring first
    per = {}
    for (ci, pi, hole), r in zip(owners, refs):
        per.setdefault(ci, {}).setdefault(pi, []).append(r)
    out_c = []
    for ci, c in enumerate(countries):
        polys = [per[ci][pi] for pi in sorted(per.get(ci, {}))]
        if not polys:
            continue
        nums = [len(polys)]
        for poly in polys:
            nums.append(len(poly))
            for ring in poly:
                nums.append(len(ring))
                nums += ring
        lx, ly = c["label"]
        out_c.append([c["iso"], c["name"], c["cont"], round((lx or 0) * Q), round((ly or 0) * Q), varints(nums)])
    arc_nums = [len(arcs)]
    for a in arcs:
        arc_nums.append(len(a))
        arc_nums += [a[0][0], a[0][1]]
        for (x0, y0), (x1, y1) in zip(a, a[1:]):
            arc_nums += [x1 - x0, y1 - y0]
    lakes = []
    for f in json.loads((src / f"{lfile}.geojson").read_text(encoding="utf-8"))["features"]:
        p = f["properties"]
        if (p.get("scalerank") or 0) > lake_rank:
            continue
        for poly in polygons_of(f["geometry"]):
            q = dp(quantize(poly[0]) + [quantize(poly[0])[0]], tol)
            if len(q) >= 4 and abs(area(q)) >= min_area * 2:
                lakes.append([ascii_name(p.get("name")), line_nums(q[:-1])])
    lakes.sort()
    rivers = []
    for f in json.loads((src / f"{rfile}.geojson").read_text(encoding="utf-8"))["features"]:
        p = f["properties"]
        rank = p.get("scalerank") or 0
        if rank > river_rank or f["geometry"] is None:
            continue
        lines = f["geometry"]["coordinates"] if f["geometry"]["type"] == "MultiLineString" else [f["geometry"]["coordinates"]]
        for line in lines:
            q = dp(quantize(line), tol)
            if len(q) >= 2:
                rivers.append([ascii_name(p.get("name_en") or p.get("name")), rank, line_nums(q)])
    rivers.sort()
    data = {"q": Q, "arcs": varints(arc_nums), "countries": out_c, "lakes": lakes, "rivers": rivers}
    stats = {"arcs": len(arcs), "points": sum(len(a) for a in arcs), "countries": len(out_c), "lakes": len(lakes), "rivers": len(rivers)}
    return data, stats


def line_nums(pts):
    nums = [len(pts), pts[0][0], pts[0][1]]
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        nums += [x1 - x0, y1 - y0]
    return varints(nums)


def to_js(level: str, data: dict) -> str:
    head = (f"// geo-data-{level}.js - GENERATED by scripts/build_geo.py from Natural Earth (public domain,\n"
            "// naturalearthdata.com). Do not edit by hand; see THIRD_PARTY_NOTICES.md. Decoded by geo.js.\n")
    body = json.dumps(data, separators=(",", ":"), ensure_ascii=True)
    return head + f"(window.TOON.GEO_DATA = window.TOON.GEO_DATA || {{}})['{level}'] = {body};\n"


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("src", type=Path, help="folder with the Natural Earth GeoJSON files: " + ", ".join(SOURCES))
    ap.add_argument("--stats", action="store_true", help="print sizes without writing files")
    args = ap.parse_args(argv)
    missing = [s for s in SOURCES if not (args.src / s).exists()]
    if missing:
        raise SystemExit("missing Natural Earth files in " + str(args.src) + ": " + ", ".join(missing))
    for level in LEVELS:
        data, stats = build_level(args.src, level)
        js = to_js(level, data)
        print(f"{level}: {stats} -> {len(js) / 1024:.0f} KB")
        if not args.stats:
            (OUT_DIR / f"geo-data-{level}.js").write_text(js, encoding="utf-8")


if __name__ == "__main__":
    sys.exit(main())
