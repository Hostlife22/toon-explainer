"""Validation of the `blackout` fx (lib/fx/tone-fx.js): timing, level and the `lights` that stay lit."""
from __future__ import annotations


def _num(v) -> bool:
    return isinstance(v, (int, float)) and not isinstance(v, bool)


def light_ids(lights) -> list[str]:
    """Layer ids named by a blackout `lights` list (strings or {id, ...} entries)."""
    if not isinstance(lights, list):
        return []
    return [q if isinstance(q, str) else q.get("id") for q in lights if isinstance(q, str) or (isinstance(q, dict) and isinstance(q.get("id"), str))]


def _check_light(q, where: str, ids: set, errors: list[str]) -> None:
    if isinstance(q, str):
        if q not in ids:
            errors.append(f"{where}: light {q!r} is not the id of a layer in this shot")
        return
    if not isinstance(q, dict) or not (isinstance(q.get("id"), str) or (_num(q.get("x")) and _num(q.get("y")))):
        errors.append(f"{where}: each blackout lights entry is a layer id, {{id, r, dx, dy}} or {{x, y, r}}")
        return
    if isinstance(q.get("id"), str) and q["id"] not in ids:
        errors.append(f"{where}: light {q['id']!r} is not the id of a layer in this shot")
    if q.get("r") is not None and not (_num(q["r"]) and q["r"] > 0):
        errors.append(f"{where}: light r must be a radius > 0 (px)")
    for k in ("dx", "dy"):
        if q.get(k) is not None and not _num(q[k]):
            errors.append(f"{where}: light {k} must be a number (px)")


def check_blackout(layer: dict, where: str, ids: set, errors: list[str]) -> None:
    """fx blackout fields: level 0..1, fade / dur / fadeOut >= 0, lights entries that name layers of this shot."""
    if layer.get("type") != "fx" or layer.get("kind") != "blackout":
        return
    if layer.get("level") is not None and not (_num(layer["level"]) and 0 <= layer["level"] <= 1):
        errors.append(f"{where}: blackout level must be 0..1")
    for k in ("fade", "dur", "fadeOut"):
        if layer.get(k) is not None and not (_num(layer[k]) and layer[k] >= 0):
            errors.append(f"{where}: blackout {k} must be a number >= 0 (seconds)")
    lights = layer.get("lights")
    if lights is None:
        return
    if not isinstance(lights, list):
        errors.append(f"{where}: blackout lights must be a list of layer ids, {{id, r, dx, dy}} or {{x, y, r}}")
        return
    for q in lights:
        _check_light(q, where, ids, errors)
