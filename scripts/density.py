"""Density lint for film specs: non-fatal warnings about thin or repetitive staging.

    from density import lint
    for warning in lint(spec): print("warning:", warning)

The reference films stack a background, a middle ground with the actors and a foreground frame in almost every shot,
and they change shot size every cut or two. These checks point at shots that read as "a couple of elements on a flat
background". They never fail validation: `spec.py` prints them after the OK line.
"""
from __future__ import annotations

MIN_LAYERS = 4
SAME_SIZE_RUN = 3
CHARACTER_TYPES = {"bean", "crowd", "topbean", "creature", "obj"}
LETTERING_TYPES = {"title", "label", "caption", "date", "era", "counter", "timer", "doc", "subtitle", "timeline"}
CARD_BGS = {"flat", "burst", "parchment", "chalkboard", "corkboard", "parchment-panel", "blueprint", "mood"}
DEFAULT_ZOOM = (1.0, 1.04)  # core.js T.cameraAt


def _layers(shot: dict) -> list[dict]:
    out = []
    for key in ("layers", "pinned"):
        val = shot.get(key) or []
        if isinstance(val, list):
            out += [L for L in val if isinstance(L, dict)]
    return out


def _bgs(shot: dict) -> list[dict]:
    bg = shot.get("bg", {"kind": "sky"})
    return [b for b in (bg if isinstance(bg, list) else [bg]) if isinstance(b, dict)]


def is_title_card(shot: dict) -> bool:
    """A lettering-only shot (chapter card, date card, quote) on any background, or no actors on a card background."""
    layers = _layers(shot)
    if any(L.get("type") in CHARACTER_TYPES for L in layers):
        return False
    if layers and all(L.get("type") in LETTERING_TYPES for L in layers):
        return True
    return any(L.get("type") in LETTERING_TYPES for L in layers) and all(b.get("kind") in CARD_BGS for b in _bgs(shot))


def _frame_keys(shot: dict) -> list[dict]:
    cam = shot.get("camera") if isinstance(shot.get("camera"), dict) else {}
    f = cam.get("frame") or cam.get("follow")
    keys = f if isinstance(f, list) else [f] if f else []
    return [k if isinstance(k, dict) else {"target": k} for k in keys]


def _has_foreground(shot: dict) -> bool:
    if any(k.get("ots") for k in _frame_keys(shot)):  # over-the-shoulder framing adds a foreground shoulder
        return True
    for L in _layers(shot):
        z = L.get("z")
        dist = L.get("dist")
        near = isinstance(dist, (int, float)) and not isinstance(dist, bool) and 0 < dist < 1
        if L.get("type") == "fg" or L.get("fg") is True or near or (isinstance(z, (int, float)) and not isinstance(z, bool) and z > 1):
            return True
    return False


def _is_num(v) -> bool:
    return isinstance(v, (int, float)) and not isinstance(v, bool)


def _frame_size(k: dict) -> str:
    """One frame key as a shot size: its size name, explicit zoom, or the box height it fits."""
    if k.get("size"):
        return str(k["size"])
    if _is_num(k.get("zoom")):
        return f"zoom {round(float(k['zoom']), 2)}"
    box = k.get("box")
    if isinstance(box, list) and len(box) == 4 and all(_is_num(v) for v in box):
        return f"box {round(max(float(box[2]), float(box[3])), 2)}"  # camera-grammar.js: frame height = max(w, h) / 0.9
    return "follow"


def _zoom_values(zoom) -> tuple | None:
    """[from, to] pair or [{at, v}] keys -> rounded zoom values (start, end), or None when not a zoom."""
    if isinstance(zoom, list) and len(zoom) == 2 and all(_is_num(z) for z in zoom):
        vals = [zoom[0], zoom[1]]
    elif isinstance(zoom, list) and zoom and all(isinstance(k, dict) and _is_num(k.get("v")) for k in zoom):
        keys = sorted(zoom, key=lambda k: k.get("at", 0) if _is_num(k.get("at", 0)) else 0)
        vals = [keys[0]["v"], keys[-1]["v"]]
    else:
        return None
    return tuple(round(float(v), 2) for v in vals)


def _zoom_key(shot: dict):
    keys = _frame_keys(shot)
    if keys:  # shot-size framing: the sizes (or zooms) of its keys
        return tuple(_frame_size(k) for k in keys)
    cam = shot.get("camera") if isinstance(shot.get("camera"), dict) else {}
    return _zoom_values(cam.get("zoom")) or DEFAULT_ZOOM


def lint(spec: dict) -> list[str]:
    """Return density warnings (an empty list when the spec looks dense enough). Never raises on odd input."""
    shots = spec.get("shots") if isinstance(spec, dict) else None
    if not isinstance(shots, list):
        return []
    warnings: list[str] = []
    shots = [s for s in shots if isinstance(s, dict)]
    for shot in shots:
        sid = shot.get("id", "?")
        layers = _layers(shot)
        card = is_title_card(shot)
        if not card and len(layers) < MIN_LAYERS:
            warnings.append(f"shot {sid}: only {len(layers)} layers; stack background, actors and a foreground frame ({MIN_LAYERS}+)")
        if any(b.get("kind") == "void" for b in _bgs(shot)):
            warnings.append(f"shot {sid}: void background; give the scene a place (room, street, sky, set)")
        if not card and any(L.get("type") in CHARACTER_TYPES for L in layers) and not _has_foreground(shot):
            warnings.append(f"shot {sid}: characters but no foreground element (fg layer or a layer with z > 1)")
    run: list[str] = []
    prev = None
    for shot in shots + [None]:
        key = _zoom_key(shot) if shot is not None else None
        if shot is not None and key == prev:
            run.append(str(shot.get("id", "?")))
            continue
        if len(run) >= SAME_SIZE_RUN:
            warnings.append(f"shots {run[0]} .. {run[-1]}: {len(run)} cuts in a row with the same camera zoom {list(prev)}; vary the shot size")
        run = [str(shot.get("id", "?"))] if shot is not None else []
        prev = key
    return warnings
