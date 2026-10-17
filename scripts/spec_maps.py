"""Map layer checks for spec.py: map points and paths (plain or lon/lat), region references and real-geography fields."""
from __future__ import annotations

import json
import re

from spec_vocab import HEX_RE, LAYER_KINDS, VOCAB_DIR


def _is_num(v) -> bool:
    return isinstance(v, (int, float)) and not isinstance(v, bool)


def _pair(v) -> bool:
    return isinstance(v, list) and len(v) == 2 and all(_is_num(x) for x in v)


def _map_icons() -> set:
    icons: set = set()
    for f in sorted(VOCAB_DIR.glob("*.json")):
        kinds = json.loads(f.read_text(encoding="utf-8")).get("kinds") or {}
        icons |= set(kinds.get("map_icon", []) if isinstance(kinds, dict) else [])
    return icons


def _lonlat(v) -> bool:
    return _pair(v) and -180 <= v[0] <= 180 and -90 <= v[1] <= 90


def _map_point(v, geo: bool) -> bool:
    """[x, y]; with map geo also {ll: [lon, lat]} or {lon, lat} (projected by geo-prep.js)."""
    if _pair(v):
        return True
    if not (geo and isinstance(v, dict)):
        return False
    return _lonlat(v.get("ll")) or (_is_num(v.get("lon")) and _is_num(v.get("lat")))


def _map_path(v, geo: bool, n: int) -> bool:
    """n+ points (each a _map_point); with map geo also {ll: [[lon, lat], ...], gc}."""
    if geo and isinstance(v, dict) and isinstance(v.get("ll"), list):
        return len(v["ll"]) >= n and all(_lonlat(q) for q in v["ll"])
    return isinstance(v, list) and len(v) >= n and all(_map_point(q, geo) for q in v)


def _check_map_refs(layer: dict, where: str, errors: list[str]) -> None:
    """Region references inside a map must name a region id (conquer.by may also be a hex colour)."""
    regions = [r for r in layer.get("regions", []) or [] if isinstance(r, dict)]
    rids = {r.get("id") for r in regions if r.get("id")}
    for r in regions:
        by = (r.get("conquer") or {}).get("by") if isinstance(r.get("conquer"), dict) else None
        if isinstance(by, str) and by not in rids and not HEX_RE.match(by):
            errors.append(f"{where}: region {r.get('id', '?')!r} conquer.by {by!r} is neither a region id nor a hex colour")
    for c in layer.get("crosses", []) or []:
        if isinstance(c, dict) and isinstance(c.get("region"), str) and c["region"] not in rids:
            errors.append(f"{where}: crosses region {c['region']!r} is not a region id")
    _check_geo_map(layer, regions, where, errors)


ISO3_RE = re.compile(r"^[A-Z]{3}$")


def _check_geo_map(layer: dict, regions: list[dict], where: str, errors: list[str]) -> None:
    """Geo maps (geo.js): projection and style names, range names, steps and sizes, iso codes, lon/lat rings, origins."""
    geo = layer.get("geo")
    style = layer.get("style")
    styles = LAYER_KINDS.get("map_style", set())
    if style is not None and not (isinstance(style, str) and style in styles):
        errors.append(f"{where}: unknown map style {style!r} (known: {sorted(styles)})")
    if geo is None:
        return
    if not isinstance(geo, dict):
        errors.append(f"{where}: map geo must be an object {{proj, center, span}}")
        return
    projs, known_ranges = LAYER_KINDS.get("map_proj", set()), LAYER_KINDS.get("map_range", set())
    proj = geo.get("proj", "equirect")
    if not (isinstance(proj, str) and proj in projs):
        errors.append(f"{where}: unknown map proj {proj!r} (known: {sorted(projs)})")
    ranges = geo.get("ranges")
    if ranges is not None and not isinstance(ranges, bool):
        for name in ranges if isinstance(ranges, list) else [ranges]:
            if not (isinstance(name, str) and name in known_ranges):
                errors.append(f"{where}: unknown map range {name!r} (known: {sorted(known_ranges)})")
    if geo.get("detail") not in (None, "auto", "lo", "hi"):
        errors.append(f"{where}: map geo detail must be auto, lo or hi")
    grat = geo.get("graticule")
    if grat is not None and not isinstance(grat, bool) and not (_is_num(grat) and grat >= 1):
        errors.append(f"{where}: map geo graticule must be true or a step of at least 1 degree")
    if geo.get("mountainSize") is not None and not (_is_num(geo["mountainSize"]) and geo["mountainSize"] > 0):
        errors.append(f"{where}: map geo mountainSize must be a number above 0")
    peaks = geo.get("mountains")
    if peaks is not None and not (isinstance(peaks, list) and all(_geo_peak(m) for m in peaks)):
        errors.append(f"{where}: map geo mountains must be [lon, lat] pairs or {{lon, lat, size > 0, snow}} objects")
    for i, r in enumerate(regions):
        _check_geo_region(r, f"{where}: region {r.get('id', i)!r}", errors)


def _geo_peak(m) -> bool:
    if _pair(m):
        return True
    return (isinstance(m, dict) and _is_num(m.get("lon")) and _is_num(m.get("lat"))
            and (m.get("size") is None or (_is_num(m["size"]) and m["size"] > 0)))


def _check_geo_region(r: dict, rw: str, errors: list[str]) -> None:
    isos = r.get("iso")
    if isinstance(isos, list) and not isos:
        errors.append(f"{rw} iso must name at least one country")
    for iso in (isos if isinstance(isos, list) else [isos] if isos is not None else []):
        if not (isinstance(iso, str) and ISO3_RE.match(iso)):
            errors.append(f"{rw} iso {iso!r} must be an ISO 3166 alpha-3 code like FRA")
    cont = r.get("continent")
    if cont is not None and not (isinstance(cont, str) or (isinstance(cont, list) and cont and all(isinstance(c, str) for c in cont))):
        errors.append(f"{rw} continent must be a name or a list of names")
    ll = r.get("lonlat")
    if ll is not None:
        rings = [ll] if isinstance(ll, list) and ll and _pair(ll[0]) else ll if isinstance(ll, list) else [None]
        if not rings or not all(isinstance(q, list) and len(q) >= 3 and all(_pair(p) for p in q) for q in rings):
            errors.append(f"{rw} lonlat must be a ring of 3+ [lon, lat] points (or a list of rings)")
    for key in ("flood", "wipe", "conquer"):
        cover = r.get(key)
        if isinstance(cover, dict) and cover.get("from") is not None and not _pair(cover["from"]):
            errors.append(f"{rw} {key} from must be [lon, lat] in a geo map")
