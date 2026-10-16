"""Validation of the Props & FX 2.0 fields (particles, impact language, trail, animated prop fields, paper kinds).

Called by spec.py for every layer (and every state its swaps produce). The engine is the source of truth: these checks
mirror engine/lib/fx/particles.js, fx/impact.js, props/props-*.js and paper/paper-paint.js so typos fail before render.
"""
from __future__ import annotations

IMPACT_MODES = {"invert", "flat", "flash"}
HEX_CHARS = set("0123456789abcdefABCDEF")
_LAB = ("flask", "round-flask", "beaker", "test-tube", "tube-rack", "retort", "bottle")
TIMELINE_FIELDS = {**{k: ("fill",) for k in _LAB}, "gauge": ("value",), "valve": ("open",), "bow": ("draw",)}


def _num(v) -> bool:
    return isinstance(v, (int, float)) and not isinstance(v, bool)


def _hex(v) -> bool:
    return isinstance(v, str) and v.startswith("#") and len(v) in (4, 7) and set(v[1:]) <= HEX_CHARS


def _timeline_ok(v) -> bool:
    if v is None or _num(v):
        return True
    return isinstance(v, list) and bool(v) and all(isinstance(k, dict) and _num(k.get("at", 0)) and _num(k.get("v")) for k in v)


def _check_particles(layer: dict, where: str, presets: set, errors: list[str]) -> None:
    preset = layer.get("preset", "smoke")
    if preset not in presets:
        errors.append(f"{where}: particles preset {preset!r} not in {sorted(presets)}")
    positive = ("rate", "life", "dur", "speed")
    for key in positive:
        v = layer.get(key)
        if v is not None and not (_num(v) and v > 0):
            errors.append(f"{where}: particles {key} must be a number > 0")
    for key in ("spread", "dir", "gravity", "wind", "drag", "turb", "grow", "w", "h", "ox", "oy", "spin", "floor"):
        v = layer.get(key)
        if v is not None and not _num(v):
            errors.append(f"{where}: particles {key} must be a number")
    for key in ("w", "h", "drag", "turb"):
        if _num(layer.get(key)) and layer[key] < 0:
            errors.append(f"{where}: particles {key} must be >= 0")
    burst = layer.get("burst")
    if burst is not None and not (_num(burst) and burst >= 1):
        errors.append(f"{where}: particles burst must be a count >= 1")
    size = layer.get("size")
    if size is not None and not ((_num(size) and size > 0) or (isinstance(size, list) and len(size) == 2 and all(_num(x) and x > 0 for x in size))):
        errors.append(f"{where}: particles size must be a number or [min, max] > 0")
    if layer.get("color") is not None and not _hex(layer["color"]):
        errors.append(f"{where}: particles color must be a hex colour")
    colors = layer.get("colors")
    if colors is not None and not (isinstance(colors, list) and colors and all(_hex(c) for c in colors)):
        errors.append(f"{where}: particles colors must be a list of hex colours")
    pre = layer.get("prewarm")
    if pre is not None and not (isinstance(pre, bool) or (_num(pre) and pre >= 0)):
        errors.append(f"{where}: particles prewarm must be true or seconds >= 0")


def _check_fx(layer: dict, where: str, presets: set, errors: list[str]) -> None:
    kind = layer.get("kind")
    if kind == "particles":
        _check_particles(layer, where, presets, errors)
    elif kind == "impact-frame":
        if layer.get("mode", "invert") not in IMPACT_MODES:
            errors.append(f"{where}: impact-frame mode {layer.get('mode')!r} not in {sorted(IMPACT_MODES)}")
        fr = layer.get("frames")
        if fr is not None and not (isinstance(fr, int) and not isinstance(fr, bool) and 1 <= fr <= 6):
            errors.append(f"{where}: impact-frame frames must be an integer 1..6")
    elif kind in ("shockwave", "toxic-cloud", "aura", "streaks"):
        for key in ("size", "dur", "radius", "count", "speed"):
            v = layer.get(key)
            if v is not None and not (_num(v) and v > 0):
                errors.append(f"{where}: {kind} {key} must be a number > 0")
        for key in ("color",):
            if layer.get(key) is not None and not _hex(layer[key]):
                errors.append(f"{where}: {kind} color must be a hex colour")
    elif kind == "dustkick":
        times = layer.get("times")
        if times is not None and not (isinstance(times, list) and all(_num(t) for t in times)):
            errors.append(f"{where}: dustkick times must be a list of seconds")
        if layer.get("side") not in (None, "both", "left", "right"):
            errors.append(f"{where}: dustkick side must be both, left or right")


def _check_trail(layer: dict, where: str, errors: list[str]) -> None:
    trail = layer.get("trail")
    if trail is None or isinstance(trail, bool):
        return
    if not isinstance(trail, dict):
        errors.append(f"{where}: trail must be true/false or {{frames, length, alpha, min}}")
        return
    fr = trail.get("frames")
    if fr is not None and not (_num(fr) and 1 <= fr <= 12):
        errors.append(f"{where}: trail frames must be 1..12")
    for key in ("length", "min"):
        if trail.get(key) is not None and not (_num(trail[key]) and trail[key] > 0):
            errors.append(f"{where}: trail {key} must be a number > 0")
    if trail.get("alpha") is not None and not (_num(trail["alpha"]) and 0 <= trail["alpha"] <= 1):
        errors.append(f"{where}: trail alpha must be 0..1")


def check_layer(layer: dict, where: str, errors: list[str], presets: set) -> None:
    """Validate the Props & FX 2.0 fields of one layer state."""
    ltype = layer.get("type")
    if ltype == "fx":
        _check_fx(layer, where, presets, errors)
    _check_trail(layer, where, errors)
    if ltype in ("prop", "obj"):
        kind = layer.get("kind") if ltype == "prop" else layer.get("prop")
        keys = TIMELINE_FIELDS.get(kind, ())  # other kinds use these names for their own meaning (door open, ...)
        for key in keys:
            if not _timeline_ok(layer.get(key)):
                errors.append(f"{where}: {key} must be a number or a [{{at, v}}] timeline")
        fumes = layer.get("fumes")
        if fumes is not None and not (isinstance(fumes, bool) or fumes in presets):
            errors.append(f"{where}: fumes must be true/false or a particles preset")
        fire = layer.get("fire")
        if fire is not None and not (_num(fire) or (isinstance(fire, list) and all(_num(t) for t in fire))):
            errors.append(f"{where}: fire must be a time in seconds or a list of times")
    if ltype == "doc":
        for key in ("folds", "stains"):
            v = layer.get(key)
            if v is not None and not (isinstance(v, int) and not isinstance(v, bool) and 0 <= v <= 3):
                errors.append(f"{where}: {key} must be an integer 0..3")
