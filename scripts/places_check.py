"""Validation of the Places 2.0 fields: the modular set kit (bg kind `set`, layer type `set`) and the depth fields
every background accepts (`parallax`, `haze`). spec.py calls these with the vocabulary it merged from scripts/vocab."""
from __future__ import annotations

PART_NUMS = ("x", "y", "w", "h", "scale", "z")


def _num(v) -> bool:
    return isinstance(v, (int, float)) and not isinstance(v, bool)


def check_depth(bg: dict, where: str, errors: list[str]) -> None:
    """bg.parallax: depth multiplier for every plane (0 = flat, 1 = as drawn, 2 = deeper); bg.haze: far-plane haze 0..2."""
    p = bg.get("parallax")
    if p is not None and not (_num(p) and 0 <= p <= 3):
        errors.append(f"{where}: parallax must be a number in 0..3 (0 = no depth, 1 = default)")
    h = bg.get("haze")
    if h is not None and not isinstance(h, (str, bool)) and not (_num(h) and 0 <= h <= 2):  # battlefield: haze on/off
        errors.append(f"{where}: haze must be a number in 0..2 (far-plane atmosphere, 1 = default)")


def check_parts(parts, where: str, kinds: dict, errors: list[str]) -> None:
    """A list of set parts: [{kind, x, y, w, h, scale, z, ...}] with kinds from TOON.SET_PARTS."""
    if parts is None:
        return
    if not isinstance(parts, list):
        errors.append(f"{where}: parts must be a list of {{kind, x, y, ...}} objects")
        return
    known = kinds.get("set_part", set())
    for i, part in enumerate(parts):
        at = f"{where}.parts[{i}]"
        if not isinstance(part, dict):
            errors.append(f"{at}: must be an object {{kind, x, y, ...}}")
            continue
        if known and part.get("kind") not in known:
            errors.append(f"{at}: unknown set part {part.get('kind')!r} (known: {sorted(known)})")
        for key in PART_NUMS:
            if key in part and not _num(part[key]):
                errors.append(f"{at}: {key} must be a number")
        if part.get("kind") == "wall" and part.get("material") is not None:
            _material(part["material"], "set_wall", at + ".material", kinds, errors)
        if part.get("kind") == "floor" and part.get("material") is not None:
            _material(part["material"], "set_floor", at + ".material", kinds, errors)


def _material(value, group: str, where: str, kinds: dict, errors: list[str]) -> None:
    known = kinds.get(group, set())
    if known and value not in known:
        errors.append(f"{where}: {value!r} not in {sorted(known)}")


def check_set_bg(bg: dict, where: str, kinds: dict, errors: list[str]) -> None:
    preset = bg.get("preset")
    presets = kinds.get("set_preset", set())
    if preset is not None and presets and preset not in presets:
        errors.append(f"{where}: set preset {preset!r} not in {sorted(presets)}")
    if bg.get("wall") is not None:
        _material(bg["wall"], "set_wall", where + ": wall", kinds, errors)
    if bg.get("floor") is not None:
        _material(bg["floor"], "set_floor", where + ": floor", kinds, errors)
    fy = bg.get("floorY")
    if fy is not None and not (_num(fy) and 0.3 <= fy <= 1):
        errors.append(f"{where}: floorY must be a number in 0.3..1")
    check_parts(bg.get("parts"), where, kinds, errors)


def check_set_layer(layer: dict, where: str, kinds: dict, errors: list[str]) -> None:
    if not layer.get("parts") and layer.get("preset") is None:
        errors.append(f"{where}: set layer needs parts")
    check_parts(layer.get("parts"), where, kinds, errors)
