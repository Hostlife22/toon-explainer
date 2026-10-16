"""Validation of the motion fields shared by creatures and vehicles (engine: lib/creatures/motion-path.js,
creature-kit.js, lib/props/vehicles-kit.js): `path` on any layer, creature `gait` / `state`, vehicle `terrain`,
`animal` and the trail switches. Called from spec._check_layer; kept here so spec.py stays focused.

`path` is always an object {pts, at, dur, ease, curve, orient, face, bank, loop}. A plain list of points is the
older, type-specific meaning of `path` on fx (brawl trail), cursor (keys) and map layers, which are not checked here.
"""
from __future__ import annotations

import math

CURVES = {"smooth", "linear", "bezier"}
GAITS = {"walk", "trot", "gallop", "run", "auto"}
STATES = {"idle", "walk", "trot", "run", "gallop", "eat", "sleep", "scared", "sit", "swim", "glide", "fly", "auto"}
TERRAINS = {"road", "dirt", "rough", "cobble", "rail", "smooth"}
SWITCHES = ("lights", "dust", "exhaust", "wake", "contrail", "smoke", "steam", "spray")
PATH_OWNERS = {"fx", "cursor", "map"}  # layer types whose `path` field means something else (brawl trail, cursor keys)


def _num(v) -> bool:
    return isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v)


def _pair(v) -> bool:
    return isinstance(v, list) and len(v) == 2 and all(_num(x) for x in v)


def _name_in(v, names) -> bool:
    return isinstance(v, str) and v in names


def _check_names(value, names: set, what: str, where: str, errors: list[str]) -> None:
    """A constant name or a nonempty [{at, v}] timeline of names."""
    if isinstance(value, list):
        if not value or not all(isinstance(k, dict) and _num(k.get("at", 0)) and _name_in(k.get("v"), names) for k in value):
            errors.append(f"{where}: {what} timeline must be a nonempty list of {{at (number), v in {sorted(names)}}}")
        return
    if not _name_in(value, names):
        errors.append(f"{where}: {what} {value!r} not in {sorted(names)}")


def check_path(path, where: str, errors: list[str], ease_names: set) -> None:
    if not isinstance(path, dict):
        errors.append(f"{where}: path must be an object {{pts: [[x, y], ...], at, dur, ease, curve, orient, face, bank, loop}}")
        return
    pts = path.get("pts")
    if not (isinstance(pts, list) and len(pts) >= 2 and all(_pair(p) for p in pts)):
        errors.append(f"{where}: path needs pts: 2+ [x, y] points with finite numbers")
        return
    curve = path.get("curve", "smooth")
    if not _name_in(curve, CURVES):
        errors.append(f"{where}: path curve {curve!r} not in {sorted(CURVES)}")
    elif curve == "bezier" and (len(pts) < 4 or (len(pts) - 1) % 3):
        errors.append(f"{where}: a bezier path needs 3n+1 points (start, then control, control, end per segment)")
    if path.get("at") is not None and not (_num(path["at"]) and path["at"] >= 0):
        errors.append(f"{where}: path at must be a finite number >= 0 (shot time, like move)")
    if path.get("dur") is not None and not (_num(path["dur"]) and path["dur"] > 0):
        errors.append(f"{where}: path dur must be a finite number above 0")
    if path.get("ease") is not None and not _name_in(path["ease"], ease_names):
        errors.append(f"{where}: path ease {path['ease']!r} not in {sorted(ease_names)}")
    orient = path.get("orient")
    if orient is not None and not (isinstance(orient, bool) or (_num(orient) and 0 <= orient <= 180)):
        errors.append(f"{where}: path orient must be true/false or a max tilt in degrees (0..180)")
    if path.get("face") is not None and not isinstance(path["face"], bool):
        errors.append(f"{where}: path face must be true or false")
    if path.get("bank") is not None and not _num(path["bank"]):
        errors.append(f"{where}: path bank must be a finite number (degrees of lean on turns)")
    loop = path.get("loop")
    if loop is not None and not (isinstance(loop, bool) or (_num(loop) and loop >= 1)):
        errors.append(f"{where}: path loop must be true or a lap count >= 1")


def check_motion(layer: dict, where: str, errors: list[str], ease_names: set, creature_kinds: set | None) -> None:
    kind = layer.get("type")
    if layer.get("path") is not None and kind not in PATH_OWNERS:
        check_path(layer["path"], where, errors, ease_names)
    if kind in ("creature", "vehicle"):
        if layer.get("gait") is not None:
            _check_names(layer["gait"], GAITS, "gait", where, errors)
        if layer.get("state") is not None:
            _check_names(layer["state"], STATES, "state", where, errors)
    if kind == "vehicle":
        if layer.get("terrain") is not None and not _name_in(layer["terrain"], TERRAINS):
            errors.append(f"{where}: terrain {layer['terrain']!r} not in {sorted(TERRAINS)}")
        for key in SWITCHES:
            v = layer.get(key)
            if v is not None and not (isinstance(v, bool) or (_num(v) and v >= 0)):
                errors.append(f"{where}: {key} must be true/false or a finite amount >= 0")
        animal = layer.get("animal")
        if animal is not None and not (isinstance(animal, str) and (not creature_kinds or animal in creature_kinds)):
            errors.append(f"{where}: vehicle animal {animal!r} not in {sorted(creature_kinds or [])}")
        team = layer.get("team")
        if team is not None and not (isinstance(team, int) and not isinstance(team, bool) and 1 <= team <= 4):
            errors.append(f"{where}: team must be 1..4 animals")
    if kind == "creature" and layer.get("dust") is not None and not (isinstance(layer["dust"], bool) or (_num(layer["dust"]) and layer["dust"] >= 0)):
        errors.append(f"{where}: dust must be true/false or a finite amount >= 0")
    for key in ("flock", "school"):
        v = layer.get(key)
        if v is not None and not (isinstance(v, int) and not isinstance(v, bool) and 1 <= v <= 40):
            errors.append(f"{where}: {key} must be a count 1..40")
