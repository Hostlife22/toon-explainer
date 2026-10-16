"""Validation of the motion fields shared by creatures and vehicles (engine: lib/creatures/motion-path.js,
creature-kit.js, lib/props/vehicles-kit.js): `path` on any layer, creature `gait` / `state`, vehicle `terrain`,
`animal` and the trail switches. Called from spec._check_layer; kept here so spec.py stays focused.
"""
from __future__ import annotations

CURVES = {"smooth", "linear", "bezier"}
GAITS = {"walk", "trot", "gallop", "run", "auto"}
STATES = {"idle", "walk", "trot", "run", "gallop", "eat", "sleep", "scared", "sit", "swim", "glide", "fly"}
TERRAINS = {"road", "dirt", "rough", "cobble", "rail", "smooth"}
SWITCHES = ("lights", "dust", "exhaust", "wake", "contrail", "smoke", "spray")
PATH_OWNERS = {"fx", "cursor", "map"}  # layer types whose `path` field means something else (brawl trail, cursor keys)


def _num(v) -> bool:
    return isinstance(v, (int, float)) and not isinstance(v, bool)


def _pair(v) -> bool:
    return isinstance(v, list) and len(v) == 2 and all(_num(x) for x in v)


def _names(value) -> list:
    """A constant or a [{at, v}] timeline of names -> the names used (non-strings are returned as-is to be flagged)."""
    if isinstance(value, list):
        return [k.get("v") if isinstance(k, dict) else k for k in value]
    return [value]


def check_path(path, where: str, errors: list[str], ease_names: set) -> None:
    obj = path if isinstance(path, dict) else {"pts": path}
    pts = obj.get("pts")
    if not (isinstance(pts, list) and len(pts) >= 2 and all(_pair(p) for p in pts)):
        errors.append(f"{where}: path needs 2+ [x, y] points (a list, or {{pts, at, dur, ease, curve, orient, face, bank, loop}})")
        return
    curve = obj.get("curve", "smooth")
    if curve not in CURVES:
        errors.append(f"{where}: path curve {curve!r} not in {sorted(CURVES)}")
    elif curve == "bezier" and (len(pts) < 4 or (len(pts) - 1) % 3):
        errors.append(f"{where}: a bezier path needs 3n+1 points (start, then control, control, end per segment)")
    if obj.get("at") is not None and not (_num(obj["at"]) and obj["at"] >= 0):
        errors.append(f"{where}: path at must be a number >= 0 (shot time, like move)")
    if obj.get("dur") is not None and not (_num(obj["dur"]) and obj["dur"] > 0):
        errors.append(f"{where}: path dur must be above 0")
    if obj.get("ease") is not None and obj["ease"] not in ease_names:
        errors.append(f"{where}: path ease {obj['ease']!r} not in {sorted(ease_names)}")
    orient = obj.get("orient")
    if orient is not None and not (isinstance(orient, bool) or (_num(orient) and 0 <= orient <= 180)):
        errors.append(f"{where}: path orient must be true/false or a max tilt in degrees (0..180)")
    for key in ("face",):
        if obj.get(key) is not None and not isinstance(obj[key], bool):
            errors.append(f"{where}: path {key} must be true or false")
    if obj.get("bank") is not None and not _num(obj["bank"]):
        errors.append(f"{where}: path bank must be a number (degrees of lean on turns)")
    loop = obj.get("loop")
    if loop is not None and not (isinstance(loop, bool) or (_num(loop) and loop >= 1)):
        errors.append(f"{where}: path loop must be true or a lap count >= 1")


def check_motion(layer: dict, where: str, errors: list[str], ease_names: set, creature_kinds: set | None) -> None:
    if layer.get("path") is not None and layer.get("type") not in PATH_OWNERS:
        check_path(layer["path"], where, errors, ease_names)
    kind = layer.get("type")
    if kind in ("creature", "vehicle"):
        for g in _names(layer.get("gait")) if layer.get("gait") is not None else []:
            if g not in GAITS:
                errors.append(f"{where}: gait {g!r} not in {sorted(GAITS)}")
        for s in _names(layer.get("state")) if layer.get("state") is not None else []:
            if s not in STATES:
                errors.append(f"{where}: state {s!r} not in {sorted(STATES)}")
    if kind == "vehicle":
        if layer.get("terrain") is not None and layer["terrain"] not in TERRAINS:
            errors.append(f"{where}: terrain {layer['terrain']!r} not in {sorted(TERRAINS)}")
        for key in SWITCHES:
            v = layer.get(key)
            if v is not None and not (isinstance(v, bool) or (_num(v) and v >= 0)):
                errors.append(f"{where}: {key} must be true/false or an amount >= 0")
        animal = layer.get("animal")
        if animal is not None and creature_kinds and animal not in creature_kinds:
            errors.append(f"{where}: vehicle animal {animal!r} not in {sorted(creature_kinds)}")
        team = layer.get("team")
        if team is not None and not (isinstance(team, int) and not isinstance(team, bool) and 1 <= team <= 4):
            errors.append(f"{where}: team must be 1..4 animals")
    for key in ("flock", "school"):
        v = layer.get(key)
        if v is not None and not (isinstance(v, int) and not isinstance(v, bool) and 1 <= v <= 40):
            errors.append(f"{where}: {key} must be a count 1..40")
