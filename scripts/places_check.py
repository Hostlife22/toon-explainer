"""Validation of the Places 2.0 fields: the modular set kit (bg kind `set`, layer type `set`) and the depth fields
every background accepts (`parallax`, `haze`). spec.py calls these with the vocabulary it merged from scripts/vocab."""
from __future__ import annotations

import math

PART_NUMS = ("x", "y", "w", "h", "scale", "z")


def _num(v) -> bool:
    return isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v)


def check_depth(bg: dict, where: str, errors: list[str]) -> None:
    """bg.parallax: depth multiplier for every plane (0 = flat, 1 = as drawn, 2 = deeper); bg.haze: far-plane haze 0..2."""
    p = bg.get("parallax")
    if p is not None and not (_num(p) and 0 <= p <= 3):
        errors.append(f"{where}: parallax must be a number in 0..3 (0 = no depth, 1 = default)")
    h = bg.get("haze")
    if h is not None and not isinstance(h, (str, bool)) and not (_num(h) and 0 <= h <= 2):  # battlefield: haze on/off
        errors.append(f"{where}: haze must be a number in 0..2 (far-plane atmosphere, 1 = default)")


def _enum(value, group: str, label: str, where: str, kinds: dict, errors: list[str]) -> None:
    known = kinds.get(group, set())
    if not isinstance(value, str) or (known and value not in known):
        errors.append(f"{where}: {label} {value!r} not in {sorted(known)}")


def check_parts(parts, where: str, kinds: dict, errors: list[str]) -> None:
    """A list of set parts: [{kind, x, y, w, h, scale, z, ...}] with kinds from TOON.SET_PARTS."""
    if parts is None:
        return
    if not isinstance(parts, list):
        errors.append(f"{where}: parts must be a list of {{kind, x, y, ...}} objects")
        return
    for i, part in enumerate(parts):
        at = f"{where}.parts[{i}]"
        if not isinstance(part, dict):
            errors.append(f"{at}: must be an object {{kind, x, y, ...}}")
            continue
        _enum(part.get("kind"), "set_part", "unknown set part", at, kinds, errors)
        for key in PART_NUMS:
            if key in part and not _num(part[key]):
                errors.append(f"{at}: {key} must be a finite number")
        if part.get("kind") == "wall" and part.get("material") is not None:
            _enum(part["material"], "set_wall", "material", at, kinds, errors)
        if part.get("kind") == "floor" and part.get("material") is not None:
            _enum(part["material"], "set_floor", "material", at, kinds, errors)


def check_set_bg(bg: dict, where: str, kinds: dict, errors: list[str]) -> None:
    if bg.get("preset") is not None:
        _enum(bg["preset"], "set_preset", "set preset", where, kinds, errors)
    for key, group in (("wall", "set_wall"), ("floor", "set_floor")):
        if bg.get(key) is not None and bg[key] is not False:  # false leaves the surface out
            _enum(bg[key], group, key, where, kinds, errors)
    fy = bg.get("floorY")
    if fy is not None and not (_num(fy) and 0.3 <= fy <= 1):
        errors.append(f"{where}: floorY must be a number in 0.3..1")
    dark = bg.get("dark")
    if dark is not None and not (_num(dark) and 0 <= dark <= 1):
        errors.append(f"{where}: dark must be a number in 0..1")
    check_parts(bg.get("parts"), where, kinds, errors)


def check_set_layer(layer: dict, where: str, kinds: dict, errors: list[str]) -> None:
    if layer.get("preset") is not None:
        _enum(layer["preset"], "set_preset", "set preset", where, kinds, errors)
    elif not layer.get("parts"):
        errors.append(f"{where}: set layer needs parts")
    check_parts(layer.get("parts"), where, kinds, errors)
