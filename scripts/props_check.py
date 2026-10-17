"""Validation of the everyday props' fields (engine/lib/props/props-everyday.js, props-house.js) and of the flame
switch on candle, oil-lamp and lantern. Called by spec.py for every layer state its swaps produce; a bean's held prop
is checked with its holdProps. Nested prop kinds (scales pans, fridge items, pulley load) must exist."""
from __future__ import annotations

from props_fx import _hex, _num, _timeline_ok

FLAME_KINDS = ("candle", "oil-lamp", "lantern")
TIMELINES = {"scales": ("tilt",), "fridge": ("open",), "pulley": ("lift",)}


def _flame_ok(v) -> bool:
    if v is None or isinstance(v, bool):
        return True
    return isinstance(v, list) and bool(v) and all(isinstance(k, dict) and _num(k.get("at", 0)) and isinstance(k.get("v"), bool) for k in v)


def _spray_ok(v) -> bool:
    if v is None or isinstance(v, bool) or _num(v):
        return True
    return isinstance(v, list) and bool(v) and all(
        isinstance(w, list) and len(w) == 2 and all(_num(t) for t in w) and w[0] <= w[1] for w in v)


def _kind_err(v, field: str, where: str, known: set, errors: list[str]) -> None:
    if not (isinstance(v, str) and v in known):
        errors.append(f"{where}: {field} {v!r} must be a prop kind")


def check_prop(kind: str, o: dict, where: str, errors: list[str], known: set) -> None:
    """Fields `o` of a prop of `kind` (a prop layer, an obj body or a held prop's holdProps)."""
    for key in TIMELINES.get(kind, ()):
        if not _timeline_ok(o.get(key)):
            errors.append(f"{where}: {key} must be a number or a [{{at, v}}] timeline")
    if kind in FLAME_KINDS and not _flame_ok(o.get("flame")):
        errors.append(f"{where}: flame must be true/false or a [{{at, v: true|false}}] timeline")
    if kind == "scales":
        for side in ("left", "right"):
            if o.get(side) is not None:
                _kind_err(o[side], side, where, known, errors)
    if kind == "fridge" and o.get("items") is not None:
        items = o["items"]
        if not isinstance(items, list):
            errors.append(f"{where}: items must be a list of prop kinds")
        else:
            for i, it in enumerate(items):
                _kind_err(it, f"items[{i}]", where, known, errors)
    if kind == "pulley":
        if o.get("load") not in (None, False):
            _kind_err(o["load"], "load", where, known, errors)
        if o.get("loadSize") is not None and not (_num(o["loadSize"]) and 0 < o["loadSize"] <= 1):
            errors.append(f"{where}: loadSize must be a fraction of size in (0, 1]")
    if kind == "spray-can":
        if not _spray_ok(o.get("spray")):
            errors.append(f"{where}: spray must be true/false, a start time or a list of [from, to] windows")
        if o.get("dir") is not None and not _num(o["dir"]):
            errors.append(f"{where}: dir must be a number (degrees)")
    for key in ("sprayColor", "labelColor", "sample", "paint"):
        v = o.get(key)
        if kind in ("spray-can", "microscope", "paintbrush") and v is not None and v is not False and not _hex(v):
            errors.append(f"{where}: {key} must be a hex colour")


def check_layer(layer: dict, where: str, errors: list[str], known: set) -> None:
    ltype = layer.get("type")
    if ltype == "prop" and isinstance(layer.get("kind"), str):
        check_prop(layer["kind"], layer, where, errors, known)
    if ltype == "obj" and isinstance(layer.get("prop"), str):
        check_prop(layer["prop"], layer, where, errors, known)
    if ltype in ("bean", "crowd"):
        hp = layer.get("holdProps")
        for key in ("hold", "holdL"):
            if isinstance(layer.get(key), str):
                check_prop(layer[key], hp if isinstance(hp, dict) else {}, f"{where}.holdProps", errors, known)
