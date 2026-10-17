"""Validation of the Camera & acting fields (engine: lib/lens/camera-grammar.js, camera-moves.js and
lib/acting/director.js): shot-size framing (`camera.frame`), `follow`, `handheld`, `dollyzoom`, `orbit`, `roll`,
`angle`, zoom / pan keys, shot and style `onTwos`, and the layer fields `dist`, `onTwos`, `lookAt` and `takes`.
Called from spec.py; shot sizes and take kinds come from scripts/vocab/camera-acting.json.
Guide: references/toolkits/09_transitions_and_lens.md and 02_acting.md."""
from __future__ import annotations

import math

ANGLES = {"low", "high", "eye"}
FOLLOW_AXES = {"x", "y", "xy"}
FRAME_KEYS = {"at", "target", "point", "box", "size", "place", "zoom", "dur", "ease", "overshoot", "lag", "whip", "rack",
              "ots", "clamp", "axis"}
LOOK_KEYS = {"target", "x", "y", "turn", "head", "eyes"}


def _num(v) -> bool:
    return isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v)


def _pair(v) -> bool:
    return isinstance(v, list) and len(v) == 2 and all(_num(x) for x in v)


def _keys_ok(value, ok_value) -> bool:
    """A nonempty [{at, v, ease?}] timeline whose values pass ok_value."""
    return isinstance(value, list) and bool(value) and all(
        isinstance(k, dict) and _num(k.get("at", 0)) and ok_value(k.get("v")) for k in value)


def _check_ease(name, where: str, eases: set, errors: list[str]) -> None:
    if name is not None and not (isinstance(name, str) and name in eases):
        errors.append(f"{where}: ease {name!r} not in {sorted(eases)}")


def _check_window(o: dict, where: str, errors: list[str]) -> None:
    for k in ("at", "dur"):
        if o.get(k) is not None and not (_num(o[k]) and o[k] >= 0):
            errors.append(f"{where}: {k} must be a number >= 0")


def _check_frame_key(key, where: str, ids: set, sizes: set, eases: set, errors: list[str]) -> None:
    if not isinstance(key, dict):
        errors.append(f"{where}: frame keys must be objects {{at, target, size, ...}}")
        return
    if key.get("at") is not None and not _num(key["at"]):
        errors.append(f"{where}: frame at must be a number (shot time)")
    unknown = set(key) - FRAME_KEYS
    if unknown:
        errors.append(f"{where}: unknown frame fields {sorted(unknown)} (known: {sorted(FRAME_KEYS)})")
    target = key.get("target")
    if target is not None and target not in ids:
        errors.append(f"{where}: frame target {target!r} is not the id of a layer in this shot")
    if target is None and not _pair(key.get("point")) and not (isinstance(key.get("box"), list) and len(key["box"]) == 4
                                                                and all(_num(x) for x in key["box"])):
        errors.append(f"{where}: a frame key needs a target layer id, a point [x, y] or a box [x, y, w, h]")
    size = key.get("size")
    if size is not None and not (isinstance(size, str) and size in sizes):
        errors.append(f"{where}: frame size {size!r} not in {sorted(sizes)}")
    if key.get("place") is not None and not _pair(key["place"]):
        errors.append(f"{where}: frame place must be [x, y] (frame fractions)")
    for k, lo, hi in (("zoom", 0.2, 20), ("overshoot", 0, 0.9), ("lag", 0, 3), ("dur", 0, 30)):
        v = key.get(k)
        if v is not None and not (_num(v) and lo <= v <= hi):
            errors.append(f"{where}: frame {k} must be a number in {lo}..{hi}")
    _check_ease(key.get("ease"), where, eases, errors)
    for k in ("whip", "clamp"):
        if key.get(k) is not None and not isinstance(key[k], bool):
            errors.append(f"{where}: frame {k} must be true or false")
    rack = key.get("rack")
    if rack is not None and not (isinstance(rack, bool) or (_num(rack) and rack >= 0)):
        errors.append(f"{where}: frame rack must be true or a blur in px")
    if rack and target is None:
        errors.append(f"{where}: frame rack needs a target layer id")
    ots = key.get("ots")
    if ots is not None:
        oid = ots.get("id") if isinstance(ots, dict) else ots
        if not (isinstance(oid, str) and oid in ids):
            errors.append(f"{where}: frame ots {oid!r} must name the listener layer (an id in this shot)")
        if isinstance(ots, dict):
            if ots.get("side") is not None and ots["side"] not in ("left", "right"):
                errors.append(f"{where}: ots side must be 'left' or 'right'")
            for k in ("blur", "tone"):
                if ots.get(k) is not None and not (_num(ots[k]) and ots[k] >= 0):
                    errors.append(f"{where}: ots {k} must be a number >= 0")
    if key.get("axis") is not None and key["axis"] not in FOLLOW_AXES:
        errors.append(f"{where}: frame axis must be one of {sorted(FOLLOW_AXES)}")


def check_camera(cam, where: str, ids: set, sizes: set, eases: set, errors: list[str]) -> None:
    """shot.camera: the new fields only (zoom / pan pairs, punch, shake, rot, jump and letterbox are older)."""
    if cam is None:
        return
    if not isinstance(cam, dict):
        errors.append(f"{where}: camera must be an object")
        return
    w = f"{where}.camera"
    frame = cam.get("frame")
    if frame is not None:
        keys = frame if isinstance(frame, list) else [frame]
        if not keys:
            errors.append(f"{w}: frame must be a key object or a nonempty list of keys")
        for i, k in enumerate(keys):
            _check_frame_key(k, f"{w}.frame[{i}]", ids, sizes, eases, errors)
    follow = cam.get("follow")
    if follow is not None:
        if frame is not None:
            errors.append(f"{w}: use follow or frame, not both (a frame key with lag follows too)")
        f = {"target": follow} if isinstance(follow, str) else follow
        if not (isinstance(f, dict) and isinstance(f.get("target"), str)):
            errors.append(f"{w}: follow must be a layer id or {{target, lag, size, zoom, place, axis}}")
        else:
            _check_frame_key({"lag": 0.3, **f}, f"{w}.follow", ids, sizes, eases, errors)
    hh = cam.get("handheld")
    if hh is not None and not (isinstance(hh, bool) or (_num(hh) and hh >= 0)):
        if not isinstance(hh, dict):
            errors.append(f"{w}: handheld must be true, an amplitude in px or {{amp, hz, rot, at, dur}}")
        else:
            for k in ("amp", "hz", "rot"):
                if hh.get(k) is not None and not (_num(hh[k]) and hh[k] >= 0):
                    errors.append(f"{w}: handheld {k} must be a number >= 0")
            _check_window(hh, f"{w}.handheld", errors)
    for name in ("dollyzoom", "orbit"):
        v = cam.get(name)
        if v is None:
            continue
        if not isinstance(v, dict) or (v.get("amount") is not None and not _num(v["amount"])):
            errors.append(f"{w}: {name} must be {{at, dur, amount (number), ease}}")
            continue
        _check_window(v, f"{w}.{name}", errors)
        _check_ease(v.get("ease"), f"{w}.{name}", eases, errors)
        if name == "dollyzoom" and v.get("target") is not None and v["target"] not in ids:
            errors.append(f"{w}: dollyzoom target {v['target']!r} is not the id of a layer in this shot")
    roll = cam.get("roll")
    if roll is not None and not (_num(roll) or _keys_ok(roll, _num)):
        errors.append(f"{w}: roll must be degrees or a [{{at, v, ease}}] timeline of degrees")
    if isinstance(roll, list):
        for k in roll:
            if isinstance(k, dict):
                _check_ease(k.get("ease"), f"{w}.roll", eases, errors)
    angle = cam.get("angle")
    ok_angle = lambda v: (isinstance(v, str) and v in ANGLES) or (_num(v) and -1 <= v <= 1)  # noqa: E731
    if angle is not None and not (ok_angle(angle) or _keys_ok(angle, lambda v: _num(v) and -1 <= v <= 1)):
        errors.append(f"{w}: angle must be 'low', 'high', 'eye', a number -1..1 or a [{{at, v}}] timeline of numbers")
    for name, ok in (("zoom", lambda v: _num(v) and v > 0), ("pan", _pair)):
        v = cam.get(name)
        if isinstance(v, list) and v and isinstance(v[0], dict):
            if not _keys_ok(v, ok):
                errors.append(f"{w}: {name} keys must be [{{at, v, ease}}] with numeric values")
            for k in v:
                if isinstance(k, dict):
                    _check_ease(k.get("ease"), f"{w}.{name}", eases, errors)


def check_twos(value, where: str, errors: list[str]) -> None:
    """style / shot / layer onTwos: true, false or a frame rate (1..30) for character motion."""
    if value is None or isinstance(value, bool):
        return
    if not (_num(value) and 1 <= value <= 30):
        errors.append(f"{where}: onTwos must be true, false or a frame rate 1..30")


def _look_ok(v, ids: set) -> bool:
    if v is None:
        return True
    if isinstance(v, str):
        return v in ids
    if _pair(v):
        return True
    if isinstance(v, dict) and set(v) <= LOOK_KEYS:
        if isinstance(v.get("target"), str):
            return v["target"] in ids
        return _num(v.get("x")) and _num(v.get("y"))
    return False


def check_layer(layer: dict, where: str, ids: set, takes: set, exprs: set, errors: list[str]) -> None:
    """Layer fields: dist and onTwos on any layer; lookAt and takes on beans."""
    dist = layer.get("dist")
    if dist is not None and not (_num(dist) and 0.1 <= dist <= 20):
        errors.append(f"{where}: dist must be a number 0.1..20 (camera distance: 1 = the subject plane, 2 = twice as far)")
    check_twos(layer.get("onTwos"), where, errors)
    look = layer.get("lookAt")
    if look is not None:
        if isinstance(look, list) and look and isinstance(look[0], dict) and "v" in look[0]:
            ok = all(isinstance(k, dict) and _num(k.get("at", 0)) and _look_ok(k.get("v"), ids) for k in look)
        else:
            ok = _look_ok(look, ids)
        if not ok:
            errors.append(f"{where}: lookAt must be a layer id in this shot, [x, y], {{target | x, y, turn, head, eyes}} "
                          "or a [{at, v}] timeline of those")
    tk = layer.get("takes")
    if tk is not None:
        if not isinstance(tk, list):
            errors.append(f"{where}: takes must be a list of {{at, kind, target, expr}}")
            return
        for i, t in enumerate(tk):
            if not (isinstance(t, dict) and _num(t.get("at")) and t.get("kind") in takes):
                errors.append(f"{where}.takes[{i}]: a take needs a numeric at (layer time) and kind in {sorted(takes)}")
                continue
            if t.get("target") is not None and t["target"] not in ids:
                errors.append(f"{where}.takes[{i}]: take target {t['target']!r} is not the id of a layer in this shot")
            if t.get("expr") is not None and t["expr"] not in exprs:
                errors.append(f"{where}.takes[{i}]: take expr {t['expr']!r} not in {sorted(exprs)}")
