"""Validation of the Characters 2.0 fields (turnarounds, reach / IK, hand shapes, acting, gaits and paths, close-up
detail, lip-sync, costume detail). Imported by spec.py; the vocabulary lives in scripts/vocab/characters-v2.json.
Guide: references/toolkits/01_characters.md and 02_acting.md."""
from __future__ import annotations

import math

FACINGS = {"right", "left"}
REACH_ARMS = {"right", "left", "both"}
REACH_SPACES = {"world", "local"}
DETAIL = {"auto"}
LIP_ALIGN = {"film", "layer"}
LIP_DIGITS = set("0123456789")
ACTING_KEYS = {"antic", "overshoot", "breathe", "shift", "squash", "turn", "blink", "fidget", "react"}


def _num(v) -> bool:
    return isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v)


def _in(v, allowed) -> bool:
    """Membership that never raises on unhashable values (dicts, lists)."""
    return isinstance(v, str) and v in allowed


def _timed(value):
    """Plain values of a constant or a [{at, v}] timeline; None when the timeline shape itself is wrong."""
    if isinstance(value, list):
        if not value or not all(isinstance(k, dict) and _num(k.get("at", 0)) for k in value):
            return None
        return [k.get("v") for k in value]
    return [value]


def _windows_ok(wins) -> bool:
    return isinstance(wins, list) and all(isinstance(w, list) and len(w) == 2 and all(_num(x) for x in w) and w[0] <= w[1] for w in wins)


def _check_reach(entry, where: str, errors: list[str]) -> None:
    if entry is None:
        return
    if not isinstance(entry, dict):
        errors.append(f"{where}: reach must be {{x, y}} or {{target}} (or null in a timeline)")
        return
    has_xy = _num(entry.get("x")) and _num(entry.get("y"))
    if not has_xy and not isinstance(entry.get("target"), str):
        errors.append(f"{where}: reach needs numeric x and y or a target layer id")
    if entry.get("arm") is not None and not _in(entry["arm"], REACH_ARMS):
        errors.append(f"{where}: reach arm {entry['arm']!r} not in {sorted(REACH_ARMS)}")
    if entry.get("space") is not None and not _in(entry["space"], REACH_SPACES):
        errors.append(f"{where}: reach space {entry['space']!r} not in {sorted(REACH_SPACES)}")
    for k in ("dx", "dy", "arc", "dur"):
        if entry.get(k) is not None and not _num(entry[k]):
            errors.append(f"{where}: reach {k} must be a number")


def check_lipsync(lip, where: str, errors: list[str]) -> None:
    if not isinstance(lip, dict):
        errors.append(f"{where}: lipsync must be {{src | levels, fps, offset, align}}")
        return
    levels, src = lip.get("levels"), lip.get("src")
    if levels is None and not isinstance(src, str):
        errors.append(f"{where}: lipsync needs src (a JSON envelope from scripts/lipsync.py) or inline levels")
    if levels is not None and not (isinstance(levels, str) and set(levels) <= LIP_DIGITS):
        errors.append(f"{where}: lipsync levels must be a string of digits 0..9 (one per frame)")
    if lip.get("fps") is not None and not (_num(lip["fps"]) and 1 <= lip["fps"] <= 120):
        errors.append(f"{where}: lipsync fps must be 1..120")
    for k in ("offset", "gain"):
        if lip.get(k) is not None and not _num(lip[k]):
            errors.append(f"{where}: lipsync {k} must be a number")
    if lip.get("align") is not None and not _in(lip["align"], LIP_ALIGN):
        errors.append(f"{where}: lipsync align {lip['align']!r} not in {sorted(LIP_ALIGN)}")


def check_travel(layer: dict, where: str, gaits: set[str], errors: list[str]) -> None:
    """Any layer: floorY (normalised floor y for the painted contact shadow) and the bean gait name of an object `path`
    (the path shape itself is checked by motion_check.py)."""
    g = layer.get("floorY")
    if g is not None and not (_num(g) and -1 <= g <= 3):
        errors.append(f"{where}: floorY must be the normalised y of the floor under the layer (a number)")
    p = layer.get("path")
    if isinstance(p, dict) and "gait" in p and p["gait"] is not False and not _in(p["gait"], gaits):
        errors.append(f"{where}: path gait {p['gait']!r} not in {sorted(gaits)} (or false)")


def check_bean(layer: dict, where: str, views: set[str], hands: set[str], gaits: set[str], errors: list[str]) -> None:
    """Bean-only Characters 2.0 fields."""
    vals = _timed(layer.get("view"))
    if vals is None or any(v is not None and not _in(v, views) for v in vals):
        errors.append(f"{where}: view must be one of {sorted(views)} or a [{{at, v}}] timeline of them")
    vals = _timed(layer.get("facing"))
    if vals is None or any(v is not None and not _in(v, FACINGS) for v in vals):
        errors.append(f"{where}: facing must be 'right' / 'left' or a [{{at, v}}] timeline of them")
    turn = layer.get("turn")
    if turn is not None and turn is not False and turn is not True:
        if not (isinstance(turn, dict) and (turn.get("frames") is None or (isinstance(turn["frames"], int) and 0 <= turn["frames"] <= 4))):
            errors.append(f"{where}: turn must be true/false or {{frames 0..4, smear, squash}}")
    for hk in ("hand", "handL"):
        vals = _timed(layer.get(hk))
        if vals is None or any(v is not None and not _in(v, hands) for v in vals):
            errors.append(f"{where}: {hk} must be a hand shape in {sorted(hands)} or a timeline of them")
    reach = layer.get("reach")
    if isinstance(reach, list):
        if not all(isinstance(k, dict) and _num(k.get("at", 0)) and "v" in k for k in reach):
            errors.append(f"{where}: reach timeline entries need at and v ({{x, y}} | {{target}} | null)")
        else:
            for k in reach:
                _check_reach(k["v"], where, errors)
    else:
        _check_reach(reach, where, errors)
    acting = layer.get("acting")
    if acting is not None and not isinstance(acting, bool):
        if not (isinstance(acting, dict) and set(acting) <= ACTING_KEYS and all(isinstance(v, bool) for v in acting.values())):
            errors.append(f"{where}: acting must be true/false or {{{', '.join(sorted(ACTING_KEYS))}: bool}}")
    detail = layer.get("detail")
    if detail is not None and not isinstance(detail, bool) and not _in(detail, DETAIL):
        errors.append(f"{where}: detail must be true, false or 'auto'")
    _check_hold_size(layer, where, errors)
    sway = layer.get("secondary")
    if sway is not None and not (_num(sway) and 0 <= sway <= 3):
        errors.append(f"{where}: secondary must be a number 0..3 (spring secondary-motion strength)")
    for key in ("sneak", "march"):
        if layer.get(key) is not None and not _windows_ok(layer[key]):
            errors.append(f"{where}: {key} windows must be [[start, end], ...]")
    imp = layer.get("impact")
    ok_imp = lambda x: _num(x) or (isinstance(x, dict) and _num(x.get("at")) and x.get("dir", 1) in (1, -1)
                                   and not isinstance(x.get("dir", 1), bool)
                                   and (x.get("amount") is None or (_num(x["amount"]) and 0 <= x["amount"] <= 3)))
    if imp is not None and not (isinstance(imp, list) and all(ok_imp(x) for x in imp)):
        errors.append(f"{where}: impact must be a list of times or {{at, dir 1 | -1, amount 0..3}}")
    if layer.get("lipsync") is not None:
        check_lipsync(layer["lipsync"], where, errors)


def _check_hold_size(obj: dict, where: str, errors: list[str]) -> None:
    v = obj.get("holdScale")
    if v is not None and not (_num(v) and 0 < v <= 5):
        errors.append(f"{where}: holdScale must be a number in 0..5 (1 = the classic held-prop size)")
    hp = obj.get("holdProps")
    if hp is not None and not isinstance(hp, dict):
        errors.append(f"{where}: holdProps must be an object of prop fields for the held prop (e.g. {{pour: {{at, dur}}}})")
    r = obj.get("holdRot")
    if r is not None:
        keys = r if isinstance(r, list) else None
        ok = _num(r) or (keys and all(isinstance(k, dict) and _num(k.get("v")) and _num(k.get("at", 0)) for k in keys))
        if not ok:
            errors.append(f"{where}: holdRot must be degrees or a [{{at, v}}] timeline of degrees (tilt of the held prop)")


def check_look(look: dict, where: str, textures: set[str], errors: list[str]) -> None:
    """Costume detail look fields: patches (true or a count 0..8), fabric (true/false or a texture kind)."""
    _check_hold_size(look, where, errors)
    p = look.get("patches")
    if p is not None and not (isinstance(p, bool) or (isinstance(p, int) and 0 <= p <= 8)):
        errors.append(f"{where}: patches must be true/false or a count 0..8")
    f = look.get("fabric")
    if f is not None and not isinstance(f, bool) and not _in(f, textures):
        errors.append(f"{where}: fabric must be true/false or a texture kind in {sorted(textures)}")


def check_refs(layer: dict, where: str, ids: set, errors: list[str]) -> None:
    """reach.target must name a layer in the same shot."""
    reach = layer.get("reach")
    entries = [k.get("v") for k in reach if isinstance(k, dict)] if isinstance(reach, list) else [reach]
    for e in entries:
        if isinstance(e, dict) and isinstance(e.get("target"), str) and e["target"] not in ids:
            errors.append(f"{where}: reach target {e['target']!r} is not the id of a layer in this shot")
