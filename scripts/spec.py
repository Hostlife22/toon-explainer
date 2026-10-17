#!/usr/bin/env python3
"""Film spec loading and validation for toon-explainer.

    python3 scripts/spec.py film/spec.json          # validate, print summary, exit 1 on errors

The JS engine is the source of truth for drawing; this module mirrors its vocabulary so mistakes are caught
before a long render starts. Keep the KNOWN_* sets in sync with scripts/engine (T.layers / T.bgs / T.transitions).
"""
from __future__ import annotations

import json
import math
import re
import sys
from pathlib import Path

from density import lint  # noqa: F401  (re-exported: non-fatal density warnings, printed by the CLI)
import props_fx  # Props & FX 2.0 field checks (particles, impact language, trail, paper)
from motion_check import check_motion, check_riders
from places_check import check_depth, check_set_bg, check_set_layer
import spec_characters as SC
import camera_check as CC

KNOWN_LAYERS = {"bean", "image", "label", "title", "date", "era", "counter", "timer", "caption",
                "prop", "card", "sign", "calendar", "map", "fx", "fg", "crowd"}
KNOWN_BGS = {"sky", "interior", "parchment", "burst", "flat", "image", "forest", "city"}
KNOWN_TRANSITIONS = {"cut", "dissolve", "fade-white", "fade-black", "zoom-punch", "whip", "iris"}
KNOWN_ENTER = {"none", "fade", "pop", "drop", "rise", "slide-left", "slide-right", "slide-up", "slide-down", "spin"}
KNOWN_PROPS = {"coin", "moneybag", "scroll", "sword", "flag", "question", "exclaim", "bread", "temple", "skull",
               "heart", "book", "hourglass", "shield", "spear", "torch", "bulb"}
KNOWN_FX = {"rays", "speedlines", "sweat", "anger", "splat", "flash", "dust", "sparkle", "confetti", "spotlight",
            "fire", "rain", "beam", "birds", "smoke", "puff", "explosion", "blood", "lightning", "arrows"}
KNOWN_FG = {"bushes", "canopy", "ledge", "grass", "trunk", "ots", "rubble"}
KNOWN_VIEWS = {"front", "3q", "side", "back"}
KNOWN_GRADES = {"serious", "storm", "night", "solemn", "warm", "gold"}
KNOWN_POSES = {"idle", "point", "point-up", "arms-up", "shrug", "facepalm", "think", "wave", "hold", "fist", "hips",
               "cross", "present", "scared", "hands-face", "thumbs-up", "clutch-head", "sword-up", "reach"}
KNOWN_EXPR = {"neutral", "happy", "content", "sleepy", "smug", "angry", "rage", "sad", "worried", "shock", "scream",
              "squint", "cry", "dead"}
KNOWN_SKY = {"sunset", "day", "dusk", "night", "storm", "teal"}
KNOWN_HAIR = {"short", "long", "curly", "bun", "bald", "bald-sides"}
KNOWN_BEARD = {"full", "goatee", "stubble"}
KNOWN_HEAD = {"crown", "laurel", "helmet", "hood", "headband", "pontifex", "hat"}
KNOWN_OUTFIT: set[str] = set()
KNOWN_MASK: set[str] = set()
KNOWN_HEADSHAPE: set[str] = set()
KNOWN_FLAG: set[str] = set()
KNOWN_CROWD_MODE: set[str] = set()
KNOWN_BUILD: set[str] = set()  # body proportions (rig.js T.BUILDS), filled from scripts/vocab
KNOWN_AGE: set[str] = set()
COLOR_KEYS = ("skin", "skinShade", "robe", "robeShade", "sleeve", "trim", "sash", "belt", "cape", "armor", "hairColor",
              "beardColor", "mustacheColor", "headColor", "crest", "sandal", "legColor")
HEX_RE = re.compile(r"^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$")
IMAGE_KEYS = ("src", "image", "idle", "talk", "blink")

# ---------- vocabulary extensions ----------
# Each engine module may ship scripts/vocab/<module>.json, so new layer types, kinds and costume values extend the
# validator without editing this file:
#   {"layers": [...], "bgs": [...], "fx": [...], "props": [...], "fg": [...], "transitions": [...], "grades": [...],
#    "enter": [...], "poses": [...], "expr": [...], "head": [...], "hair": [...], "beard": [...], "sky": [...],
#    "color_keys": [...],
#    "kinds": {"<layer type>": ["kind", ...]},            # layer.kind must be one of these for that type
#    "registry": {"<layer type or set name>": "TOON.<registry>"}}  # checked against the engine by tests
VOCAB_DIR = Path(__file__).parent / "vocab"
LAYER_KINDS: dict[str, set[str]] = {}
REGISTRIES: dict[str, str] = {}


# Output formats: width x height of the rendered video. The world is always 1920x1080 (see core.js T.FORMATS).
FORMATS = {"landscape": (1920, 1080), "vertical": (1080, 1920)}


def _load_vocab() -> None:
    global COLOR_KEYS
    targets = {"layers": KNOWN_LAYERS, "bgs": KNOWN_BGS, "transitions": KNOWN_TRANSITIONS, "enter": KNOWN_ENTER,
               "props": KNOWN_PROPS, "fx": KNOWN_FX, "fg": KNOWN_FG, "grades": KNOWN_GRADES, "poses": KNOWN_POSES,
               "expr": KNOWN_EXPR, "sky": KNOWN_SKY, "hair": KNOWN_HAIR, "beard": KNOWN_BEARD, "head": KNOWN_HEAD,
               "views": KNOWN_VIEWS, "outfit": KNOWN_OUTFIT, "mask": KNOWN_MASK, "headShape": KNOWN_HEADSHAPE,
               "flag": KNOWN_FLAG, "crowd_mode": KNOWN_CROWD_MODE,
               "build": KNOWN_BUILD, "age": KNOWN_AGE}
    extra_colors: list[str] = []
    for path in sorted(VOCAB_DIR.glob("*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        for key, values in data.items():
            if key in targets:
                targets[key].update(values)
            elif key == "color_keys":
                extra_colors += values
            elif key == "kinds":
                for layer_type, kinds in values.items():
                    LAYER_KINDS.setdefault(layer_type, set()).update(kinds)
            elif key == "registry":
                REGISTRIES.update(values)
            elif not key.startswith("_"):
                raise ValueError(f"{path.name}: unknown vocabulary key {key!r}")
    COLOR_KEYS = tuple(dict.fromkeys(list(COLOR_KEYS) + extra_colors))


_load_vocab()


class SpecError(ValueError):
    """Raised when a spec fails validation; message lists every problem found."""


def _timed_values(value):
    """Yield plain values from a constant or a [{at, v}] timeline."""
    if isinstance(value, list):
        for item in value:
            if isinstance(item, dict):
                yield item.get("v")
    elif value is not None:
        yield value


def _check_look(look, where: str, errors: list[str]) -> None:
    """Validate a character look (cast entry or a layer's `look` override)."""
    if not isinstance(look, dict):
        errors.append(f"{where}: must be an object")
        return
    for key, allowed in (("hair", KNOWN_HAIR), ("beard", KNOWN_BEARD), ("head", KNOWN_HEAD), ("view", KNOWN_VIEWS),
                         ("outfit", KNOWN_OUTFIT), ("mask", KNOWN_MASK), ("headShape", KNOWN_HEADSHAPE),
                         ("build", KNOWN_BUILD), ("age", KNOWN_AGE)):
        if look.get(key) is not None and allowed and look[key] not in allowed:
            errors.append(f"{where}: {key} {look[key]!r} not in {sorted(allowed)}")
    SC.check_look(look, where, LAYER_KINDS.get("texture", set()), errors)
    flag = look.get("flag")
    if flag is not None:
        if not isinstance(flag, dict):
            errors.append(f"{where}: flag must be an object like {{\"pattern\": \"h3\", \"colors\": [...]}}")
        else:
            if KNOWN_FLAG and flag.get("pattern") not in KNOWN_FLAG:
                errors.append(f"{where}: flag pattern {flag.get('pattern')!r} not in {sorted(KNOWN_FLAG)}")
            for c in flag.get("colors", []) or []:
                if not (isinstance(c, str) and HEX_RE.match(c)):
                    errors.append(f"{where}: flag colors must be hex, got {c!r}")
    for hk in ("hold", "holdL"):
        if look.get(hk) is not None and look[hk] not in KNOWN_PROPS:
            errors.append(f"{where}: {hk} {look[hk]!r} not in {sorted(KNOWN_PROPS)}")
    for ck in COLOR_KEYS:
        v = look.get(ck)
        if v is not None and not (isinstance(v, str) and HEX_RE.match(v)):
            errors.append(f"{where}: {ck} must be a hex colour like #c8323a, got {v!r}")


def _ease_names() -> set:
    src = (Path(__file__).parent / "engine" / "core.js").read_text(encoding="utf-8")
    block = src[src.index("T.ease = {"):]
    block = block[:block.index("};")]
    return set(re.findall(r"^\s*'?([A-Za-z]+)'?\s*:", block, re.M))


TRANSITION_ENUMS = {"burn": {"from": {"bottom", "top", "left", "right"}}, "swarm": {"creature": {"bat", "bird"}},
                    "squeeze": {"axis": {"horizontal", "vertical"}}, "whip": {"dir": {"left", "right", "up", "down"}},
                    "fg-pass": {"axis": {"horizontal", "vertical"}}}
GLITCH_STYLES = {"corrupt", "stepped"}
ISO_BUILDINGS = {"none", "house", "tower"}


def _pair(v) -> bool:
    return isinstance(v, list) and len(v) == 2 and all(_is_num(x) for x in v)


def _swap_states(layer: dict) -> list[dict]:
    """The layer as it is at each swap time, applied cumulatively like the engine (look merges, null deletes)."""
    states, cur = [layer], dict(layer)
    swaps = layer.get("swap")
    if not isinstance(swaps, list):
        return states
    for sw in sorted((x for x in swaps if isinstance(x, dict)), key=lambda x: x.get("at", 0) if _is_num(x.get("at", 0)) else 0):
        cur = dict(cur)
        for k, v in sw.items():
            if k == "at":
                continue
            if k == "look" and isinstance(v, dict):
                cur["look"] = {**(cur.get("look") if isinstance(cur.get("look"), dict) else {}), **v}
            elif v is None:
                cur.pop(k, None)
            else:
                cur[k] = v
        states.append(cur)
    return states


def _map_icons() -> set:
    icons: set = set()
    for f in sorted(VOCAB_DIR.glob("*.json")):
        kinds = json.loads(f.read_text(encoding="utf-8")).get("kinds") or {}
        icons |= set(kinds.get("map_icon", []) if isinstance(kinds, dict) else [])
    return icons


def _check_extensions(layer: dict, where: str, errors: list[str]) -> None:
    """Names and shapes of the fields added with pile, xray, iso-tile, coin-gavel, chat, tierlist, map throws / morphs
    and glitch styles (the engine would throw at render time), checked for every state the layer's swaps produce."""
    def name_in(v, allowed, label):
        if v is not None and (not isinstance(v, str) or v not in allowed):
            errors.append(f"{where}: {label} {v!r} is not one of the allowed names")
    for entry in _swap_states(layer):
        kind, ltype = entry.get("kind"), entry.get("type")
        if ltype == "fx" and kind == "pile":
            name_in(entry.get("prop"), KNOWN_PROPS, "pile prop")
        if ltype == "fx" and kind == "hatch" and entry.get("spacing") is not None and not (_is_num(entry["spacing"]) and entry["spacing"] >= 6):
            errors.append(f"{where}: hatch spacing must be a number >= 6")
        if ltype == "fx" and kind == "glitch":
            name_in(entry.get("style"), GLITCH_STYLES, "glitch style")
        if ltype != "fx" and entry.get("xray") is not None and not isinstance(entry["xray"], bool):
            if isinstance(entry["xray"], dict):
                name_in(entry["xray"].get("inner"), KNOWN_PROPS, "xray inner")
                xr = entry["xray"]
                if xr.get("anatomy") is not None and not isinstance(xr["anatomy"], bool):
                    errors.append(f"{where}: xray anatomy must be true or false")
                if xr.get("specks") is not None and not (_is_num(xr["specks"]) and 0 <= xr["specks"] <= 200):
                    errors.append(f"{where}: xray specks must be a count 0..200")
                for k in ("specksAt", "specksDur"):
                    if xr.get(k) is not None and not (_is_num(xr[k]) and xr[k] >= 0):
                        errors.append(f"{where}: xray {k} must be a number >= 0 (seconds)")
            else:
                errors.append(f"{where}: xray must be true or an object {{at, dur, inner, color, anatomy, specks}}")
        if ltype == "bean" and entry.get("smear") is not None:
            sm = entry["smear"] if isinstance(entry["smear"], list) else [entry["smear"]]
            if not all(isinstance(x, dict) and _is_num(x.get("at")) and x.get("dir", 1) in (1, -1) for x in sm):
                errors.append(f"{where}: smear must be {{at, dur, dir 1|-1, strength}} or a list of them")
        if ltype == "map":
            movers = []
            for key in ("tokens", "figures", "squads", "camps", "routes", "trails", "fights"):
                val = entry.get(key)
                if val is None:
                    continue
                if isinstance(val, dict):
                    val = [val]  # the engine accepts a single object too
                if not isinstance(val, list):
                    errors.append(f"{where}: map {key} must be a list of objects")
                    continue
                movers += [m for m in val if isinstance(m, dict)]
            fights = entry.get("fights")
            for f in ([fights] if isinstance(fights, dict) else fights if isinstance(fights, list) else []):
                if not (isinstance(f, dict) and _map_path(f.get("path"), bool(entry.get("geo")), 2)):
                    errors.append(f"{where}: map fights need a path of 2+ [x, y] points (or lon/lat forms with geo)")
                    continue
                if f.get("dur") is not None and not (_is_num(f["dur"]) and f["dur"] > 0):
                    errors.append(f"{where}: map fights dur must be above 0")
                name_in(f.get("ease"), _ease_names(), "map fights ease")
                for k in ("size", "count", "heads"):
                    if f.get(k) is not None and not (_is_num(f[k]) and f[k] >= 0):
                        errors.append(f"{where}: map fights {k} must be a number >= 0")
            for m in movers:
                d = m.get("drops")
                if d is None or d is True:
                    continue
                if not isinstance(d, dict):
                    errors.append(f"{where}: drops must be true or {{every, icon, size, life, after}}")
                    continue
                name_in(d.get("icon"), KNOWN_PROPS | _map_icons(), "drops icon")
                if d.get("every") is not None and not (_is_num(d["every"]) and d["every"] > 0):
                    errors.append(f"{where}: drops every must be a number of seconds above 0")
                if d.get("after") not in (None, "smoke", "none"):
                    name_in(d.get("after"), KNOWN_PROPS | _map_icons(), "drops after")
        if ltype == "prop" and kind == "cobweb":
            name_in(entry.get("corner"), {"tl", "tr", "bl", "br"}, "cobweb corner")
        if ltype == "prop" and kind == "region" and entry.get("pts") is not None:
            pts = entry["pts"]
            if not (isinstance(pts, list) and len(pts) >= 3 and all(_pair(q) for q in pts)):
                errors.append(f"{where}: region pts must be a list of at least 3 [x, y] points")
        if ltype == "prop" and kind == "claw-crane":
            name_in(entry.get("load"), KNOWN_PROPS, "claw-crane load")
        if ltype == "prop" and kind == "meat-grinder":
            name_in(entry.get("feed"), KNOWN_PROPS, "meat-grinder feed")
            crank = entry.get("crank")
            if crank is not None and not (isinstance(crank, list) and all(_pair(w) for w in crank)):
                errors.append(f"{where}: meat-grinder crank must be a list of [start, end] windows")
        if ltype == "prop" and kind == "iso-tile":
            name_in(entry.get("building"), ISO_BUILDINGS, "iso-tile building")
        if ltype == "prop" and kind == "coin-gavel" and entry.get("strike") is not None and not (isinstance(entry["strike"], list) and all(_is_num(t) for t in entry["strike"])):
            errors.append(f"{where}: coin-gavel strike must be a list of times")
        if ltype == "doc" and kind == "chat":
            msgs = entry.get("messages", [])
            if not (isinstance(msgs, list) and all(isinstance(m, dict) and isinstance(m.get("text", ""), str) for m in msgs)):
                errors.append(f"{where}: chat messages must be a list of {{from, text, at, side}} objects")
        if ltype == "doc" and kind == "tierlist":
            rows, items = entry.get("rows", []), entry.get("items", [])
            if not (isinstance(rows, list) and all(isinstance(r, dict) for r in rows)):
                errors.append(f"{where}: tierlist rows must be a list of {{label, color}} objects")
            if not (isinstance(items, list) and all(isinstance(i, dict) for i in items)):
                errors.append(f"{where}: tierlist items must be a list of {{row, text | prop, at}} objects")
            else:
                for it in items:
                    name_in(it.get("prop"), KNOWN_PROPS, "tierlist item prop")
        if ltype == "map":
            morphs, throws = entry.get("morphs", []) or [], entry.get("throws", []) or []
            geo = bool(entry.get("geo"))
            if not isinstance(morphs, list) or not all(isinstance(m, dict) and all(_map_path(m.get(k), geo, 2) for k in ("from", "to")) for m in morphs):
                errors.append(f"{where}: map morphs need from and to as lists of [x, y] points (or lon/lat forms with geo)")
            if not isinstance(throws, list) or not all(isinstance(t, dict) and _map_point(t.get("from"), geo) and _map_point(t.get("to"), geo) for t in throws):
                errors.append(f"{where}: map throws need from and to as [x, y] (or lon/lat forms with geo)")
            else:
                for t in throws:
                    name_in(t.get("icon"), KNOWN_PROPS | _map_icons(), "map throws icon")


def _lonlat(v) -> bool:
    return _pair(v) and -180 <= v[0] <= 180 and -90 <= v[1] <= 90


def _map_point(v, geo: bool) -> bool:
    """[x, y]; with map geo also {ll: [lon, lat]} or {lon, lat} (projected by geo-prep.js)."""
    if _pair(v):
        return True
    if not (geo and isinstance(v, dict)):
        return False
    return _lonlat(v.get("ll")) or (_is_num(v.get("lon")) and _is_num(v.get("lat")))


def _map_path(v, geo: bool, n: int) -> bool:
    """n+ points (each a _map_point); with map geo also {ll: [[lon, lat], ...], gc}."""
    if geo and isinstance(v, dict) and isinstance(v.get("ll"), list):
        return len(v["ll"]) >= n and all(_lonlat(q) for q in v["ll"])
    return isinstance(v, list) and len(v) >= n and all(_map_point(q, geo) for q in v)


def _check_director(layer: dict, where: str, ids: set, errors: list[str]) -> None:
    """Camera & acting layer fields (camera_check.py) in every state the layer's swaps produce."""
    seen: set[str] = set()
    for state in _swap_states(layer):
        found: list[str] = []
        CC.check_layer(state, where, ids, LAYER_KINDS.get("take", set()), KNOWN_EXPR, found)
        errors.extend(e for e in found if not (e in seen or seen.add(e)))


def _fx_refs(layer: dict) -> list[str]:
    swaps = layer.get("swap") if isinstance(layer.get("swap"), list) else []
    vals = [layer.get("target"), layer.get("follow")] + [x for sw in swaps if isinstance(sw, dict) for x in (sw.get("target"), sw.get("follow"))]
    return [v for v in vals if isinstance(v, str)]


def _check_transition(tr, where: str, errors: list[str]) -> None:
    if not isinstance(tr, dict):
        return
    for field, allowed in TRANSITION_ENUMS.get(tr.get("kind"), {}).items():
        if tr.get(field) is not None and (not isinstance(tr[field], str) or tr[field] not in allowed):
            errors.append(f"{where}: {tr.get('kind')}.{field} {tr[field]!r} not in {sorted(allowed)}")
    if tr.get("kind") == "carry":
        for field in ("from", "to"):
            v = tr.get(field)
            if v is not None and not (isinstance(v, list) and len(v) == 4 and all(_is_num(x) for x in v)):
                errors.append(f"{where}: carry.{field} must be [x, y, w, h]")


def _check_layer(layer: dict, where: str, cast: dict, errors: list[str]) -> None:
    _check_extensions(layer, where, errors)
    kind = layer.get("type")
    if kind not in KNOWN_LAYERS:
        errors.append(f"{where}: unknown layer type {kind!r} (known: {sorted(KNOWN_LAYERS)})")
        return
    for key in ("enter", "exit"):
        if key in layer and layer[key] not in KNOWN_ENTER:
            errors.append(f"{where}: {key}={layer[key]!r} not in {sorted(KNOWN_ENTER)}")
    for key in ("x", "y"):
        if key in layer and not isinstance(layer[key], (int, float)):
            errors.append(f"{where}: {key} must be a number (normalized 0..1)")
    if kind == "bean":
        who = layer.get("who")
        if who and who not in cast:
            errors.append(f"{where}: bean.who={who!r} is not defined in spec.cast")
        for pose in _timed_values(layer.get("pose")):
            if pose not in KNOWN_POSES:
                errors.append(f"{where}: pose {pose!r} not in {sorted(KNOWN_POSES)}")
        for expr in _timed_values(layer.get("expr")):
            if expr not in KNOWN_EXPR:
                errors.append(f"{where}: expr {expr!r} not in {sorted(KNOWN_EXPR)}")
        for hk in ("hold", "holdL"):
            if layer.get(hk) and layer[hk] not in KNOWN_PROPS:
                errors.append(f"{where}: {hk} {layer[hk]!r} not in {sorted(KNOWN_PROPS)}")
        SC.check_bean(layer, where, KNOWN_VIEWS, LAYER_KINDS.get("hand", set()), LAYER_KINDS.get("gait", set()), errors)
        if layer.get("look") is not None:
            _check_look(layer["look"], f"{where}.look", errors)
        for key in ("walk", "run", "tremble"):
            for win in layer.get(key, []) or []:
                if not (isinstance(win, list) and len(win) == 2 and all(isinstance(v, (int, float)) for v in win)):
                    errors.append(f"{where}: {key} windows must be [[start, end], ...]")
    if kind == "crowd":
        whos = layer.get("who") if isinstance(layer.get("who"), list) else [layer.get("who")]
        for who in whos:
            if who is not None and who not in cast:
                errors.append(f"{where}: crowd.who {who!r} is not defined in spec.cast")
        for hk in ("hold", "holdL"):
            if layer.get(hk) and layer[hk] not in KNOWN_PROPS:
                errors.append(f"{where}: {hk} {layer[hk]!r} not in {sorted(KNOWN_PROPS)}")
        if layer.get("view") and layer["view"] not in KNOWN_VIEWS:
            errors.append(f"{where}: view {layer['view']!r} not in {sorted(KNOWN_VIEWS)}")
        if layer.get("pose") and layer["pose"] not in KNOWN_POSES:
            errors.append(f"{where}: pose {layer['pose']!r} not in {sorted(KNOWN_POSES)}")
        if layer.get("expr") and layer["expr"] not in KNOWN_EXPR:
            errors.append(f"{where}: expr {layer['expr']!r} not in {sorted(KNOWN_EXPR)}")
        if layer.get("mode") and KNOWN_CROWD_MODE and layer["mode"] not in KNOWN_CROWD_MODE:
            errors.append(f"{where}: crowd mode {layer['mode']!r} not in {sorted(KNOWN_CROWD_MODE)}")
        if layer.get("creature") and "creature" in LAYER_KINDS and layer["creature"] not in LAYER_KINDS["creature"]:
            errors.append(f"{where}: crowd creature {layer['creature']!r} not in {sorted(LAYER_KINDS['creature'])}")
    if kind in LAYER_KINDS and layer.get("kind") not in LAYER_KINDS[kind]:
        errors.append(f"{where}: {kind} kind {layer.get('kind')!r} not in {sorted(LAYER_KINDS[kind])}")
    if kind == "fg" and layer.get("kind") not in KNOWN_FG:
        errors.append(f"{where}: fg kind {layer.get('kind')!r} not in {sorted(KNOWN_FG)}")
    if kind == "fg" and layer.get("kind") == "ots" and layer.get("who") and layer["who"] not in cast:
        errors.append(f"{where}: ots.who {layer['who']!r} is not defined in spec.cast")
    if kind == "obj":  # a personified prop or vehicle: the nested kind must exist too
        if layer.get("prop") is not None and layer["prop"] not in KNOWN_PROPS:
            errors.append(f"{where}: obj prop {layer['prop']!r} not in {sorted(KNOWN_PROPS)}")
        if layer.get("vehicle") is not None and "vehicle" in LAYER_KINDS and layer["vehicle"] not in LAYER_KINDS["vehicle"]:
            errors.append(f"{where}: obj vehicle {layer['vehicle']!r} not in {sorted(LAYER_KINDS['vehicle'])}")
        hold = (layer.get("arms") or {}).get("hold") if isinstance(layer.get("arms"), dict) else None
        if hold is not None and hold not in KNOWN_PROPS:
            errors.append(f"{where}: obj arms.hold {hold!r} not in {sorted(KNOWN_PROPS)}")
    load = layer.get("load")
    if isinstance(load, dict) and load.get("prop") is not None and load["prop"] not in KNOWN_PROPS:
        errors.append(f"{where}: load prop {load['prop']!r} not in {sorted(KNOWN_PROPS)}")
    if kind == "prop" and layer.get("kind") not in KNOWN_PROPS:
        errors.append(f"{where}: prop kind {layer.get('kind')!r} not in {sorted(KNOWN_PROPS)}")
    if kind == "fx" and layer.get("kind") not in KNOWN_FX:
        errors.append(f"{where}: fx kind {layer.get('kind')!r} not in {sorted(KNOWN_FX)}")
    if kind in ("label", "title", "caption", "sign", "date") and not str(layer.get("text", "")).strip():
        errors.append(f"{where}: {kind} needs non-empty text")
    if kind == "image" and not (layer.get("src") or (layer.get("frames") or {}).get("idle")):
        errors.append(f"{where}: image needs src or frames.idle")
    _check_common(layer, where, cast, errors)
    _check_paint_fields(layer, where, errors)
    seen: set[str] = set()
    for state in _swap_states(layer):
        found: list[str] = []
        props_fx.check_layer(state, where, found, LAYER_KINDS.get("particle_preset", set()))
        errors.extend(e for e in found if not (e in seen or seen.add(e)))
    check_motion(layer, where, errors, _ease_names(), LAYER_KINDS.get("creature"))
    check_riders(layer, where, errors, cast, KNOWN_EXPR, KNOWN_PROPS)
    if kind == "set":
        check_set_layer(layer, where, LAYER_KINDS, errors)
    for win in layer.get("talk", []) or []:
        if not (isinstance(win, list) and len(win) == 2 and all(isinstance(v, (int, float)) for v in win) and win[0] <= win[1]):
            errors.append(f"{where}: talk windows must be [[start, end], ...] with start <= end")


def _is_num(v) -> bool:
    return isinstance(v, (int, float)) and not isinstance(v, bool)


def _check_number_or_timeline(value, where: str, errors: list[str]) -> None:
    if value is None or _is_num(value):
        return
    if isinstance(value, list) and all(isinstance(k, dict) and _is_num(k.get("at", 0)) and _is_num(k.get("v")) for k in value):
        return
    errors.append(f"{where}: must be a number or a [{{at, v}}] timeline of numbers")


def _check_common(layer: dict, where: str, cast: dict, errors: list[str]) -> None:
    """Fields every layer type accepts: swap, blur, jitter, swing."""
    swaps = layer.get("swap")
    if swaps is not None:  # the doc hangsign keeps its own object form {at, num}
        if not isinstance(swaps, list):
            if not (layer.get("type") == "doc" and isinstance(swaps, dict)):
                errors.append(f"{where}: swap must be a list of {{at, ...fields}}")
        else:
            for k, entry in enumerate(swaps):
                if not (isinstance(entry, dict) and _is_num(entry.get("at"))):
                    errors.append(f"{where}.swap[{k}]: needs a numeric at (shot time)")
                    continue
                if "type" in entry:
                    errors.append(f"{where}.swap[{k}]: type cannot be swapped; use two layers with at/out")
                if isinstance(entry.get("look"), dict):
                    _check_look({kk: vv for kk, vv in entry["look"].items() if vv is not None}, f"{where}.swap[{k}].look", errors)
                merged = {**{kk: vv for kk, vv in layer.items() if kk != "swap"}, **{kk: vv for kk, vv in entry.items() if kk not in ("at", "look") and vv is not None}}
                if any(kk in entry for kk in ("kind", "pose", "expr", "hold", "holdL", "view", "who")):
                    _check_layer({**merged, "swap": None}, f"{where}.swap[{k}]", cast, errors)
    _check_number_or_timeline(layer.get("blur"), f"{where}: blur", errors)
    SC.check_travel(layer, where, LAYER_KINDS.get("gait", set()), errors)
    for key in ("move", "shake", "jump"):
        if layer.get(key) is not None and not (isinstance(layer[key], list) and all(isinstance(x, dict) for x in layer[key])):
            errors.append(f"{where}: {key} must be a list of objects like [{{\"at\": 1.0, ...}}]")
    jit = layer.get("jitter")
    if jit is not None and not (isinstance(jit, dict) or _is_num(jit) or jit is True):
        errors.append(f"{where}: jitter must be true, a number (px) or {{amp, on, from, to}}")
    sw = layer.get("swing")
    if sw is not None and not (sw is True or isinstance(sw, dict)):
        errors.append(f"{where}: swing must be an object {{at, amp, period, decay}}")


def _check_map_refs(layer: dict, where: str, errors: list[str]) -> None:
    """Region references inside a map must name a region id (conquer.by may also be a hex colour)."""
    regions = [r for r in layer.get("regions", []) or [] if isinstance(r, dict)]
    rids = {r.get("id") for r in regions if r.get("id")}
    for r in regions:
        by = (r.get("conquer") or {}).get("by") if isinstance(r.get("conquer"), dict) else None
        if isinstance(by, str) and by not in rids and not HEX_RE.match(by):
            errors.append(f"{where}: region {r.get('id', '?')!r} conquer.by {by!r} is neither a region id nor a hex colour")
    for c in layer.get("crosses", []) or []:
        if isinstance(c, dict) and isinstance(c.get("region"), str) and c["region"] not in rids:
            errors.append(f"{where}: crosses region {c['region']!r} is not a region id")
    _check_geo_map(layer, regions, where, errors)


ISO3_RE = re.compile(r"^[A-Z]{3}$")


def _check_geo_map(layer: dict, regions: list[dict], where: str, errors: list[str]) -> None:
    """Geo maps (geo.js): projection and style names, range names, steps and sizes, iso codes, lon/lat rings, origins."""
    geo = layer.get("geo")
    style = layer.get("style")
    styles = LAYER_KINDS.get("map_style", set())
    if style is not None and not (isinstance(style, str) and style in styles):
        errors.append(f"{where}: unknown map style {style!r} (known: {sorted(styles)})")
    if geo is None:
        return
    if not isinstance(geo, dict):
        errors.append(f"{where}: map geo must be an object {{proj, center, span}}")
        return
    projs, known_ranges = LAYER_KINDS.get("map_proj", set()), LAYER_KINDS.get("map_range", set())
    proj = geo.get("proj", "equirect")
    if not (isinstance(proj, str) and proj in projs):
        errors.append(f"{where}: unknown map proj {proj!r} (known: {sorted(projs)})")
    ranges = geo.get("ranges")
    if ranges is not None and not isinstance(ranges, bool):
        for name in ranges if isinstance(ranges, list) else [ranges]:
            if not (isinstance(name, str) and name in known_ranges):
                errors.append(f"{where}: unknown map range {name!r} (known: {sorted(known_ranges)})")
    if geo.get("detail") not in (None, "auto", "lo", "hi"):
        errors.append(f"{where}: map geo detail must be auto, lo or hi")
    grat = geo.get("graticule")
    if grat is not None and not isinstance(grat, bool) and not (_is_num(grat) and grat >= 1):
        errors.append(f"{where}: map geo graticule must be true or a step of at least 1 degree")
    if geo.get("mountainSize") is not None and not (_is_num(geo["mountainSize"]) and geo["mountainSize"] > 0):
        errors.append(f"{where}: map geo mountainSize must be a number above 0")
    peaks = geo.get("mountains")
    if peaks is not None and not (isinstance(peaks, list) and all(_geo_peak(m) for m in peaks)):
        errors.append(f"{where}: map geo mountains must be [lon, lat] pairs or {{lon, lat, size > 0, snow}} objects")
    for i, r in enumerate(regions):
        _check_geo_region(r, f"{where}: region {r.get('id', i)!r}", errors)


def _geo_peak(m) -> bool:
    if _pair(m):
        return True
    return (isinstance(m, dict) and _is_num(m.get("lon")) and _is_num(m.get("lat"))
            and (m.get("size") is None or (_is_num(m["size"]) and m["size"] > 0)))


def _check_geo_region(r: dict, rw: str, errors: list[str]) -> None:
    isos = r.get("iso")
    if isinstance(isos, list) and not isos:
        errors.append(f"{rw} iso must name at least one country")
    for iso in (isos if isinstance(isos, list) else [isos] if isos is not None else []):
        if not (isinstance(iso, str) and ISO3_RE.match(iso)):
            errors.append(f"{rw} iso {iso!r} must be an ISO 3166 alpha-3 code like FRA")
    cont = r.get("continent")
    if cont is not None and not (isinstance(cont, str) or (isinstance(cont, list) and cont and all(isinstance(c, str) for c in cont))):
        errors.append(f"{rw} continent must be a name or a list of names")
    ll = r.get("lonlat")
    if ll is not None:
        rings = [ll] if isinstance(ll, list) and ll and _pair(ll[0]) else ll if isinstance(ll, list) else [None]
        if not rings or not all(isinstance(q, list) and len(q) >= 3 and all(_pair(p) for p in q) for q in rings):
            errors.append(f"{rw} lonlat must be a ring of 3+ [lon, lat] points (or a list of rings)")
    for key in ("flood", "wipe", "conquer"):
        cover = r.get(key)
        if isinstance(cover, dict) and cover.get("from") is not None and not _pair(cover["from"]):
            errors.append(f"{rw} {key} from must be [lon, lat] in a geo map")


def _nested_whos(value):
    """Cast names referenced inside nested objects of a doc layer (versus sides, challenger, joins, bubbles)."""
    if isinstance(value, dict):
        for k, v in value.items():
            if k == "who" and isinstance(v, str):
                yield v
            else:
                yield from _nested_whos(v)
    elif isinstance(value, list):
        for v in value:
            yield from _nested_whos(v)


# Backgrounds that paint a sky behind themselves and pass `preset` to it (other kinds use `preset` for their own variants).
SKY_BACKED_BGS = {"sky", "city", "battlefield", "desert", "eastcity", "factory", "graveyard", "karst", "mountains",
                  "street1920", "trench", "hills", "woods", "river", "dunes", "ancient", "castle"}  # + Places 2.0 landscapes


def _check_bg(bg, where: str, errors: list[str]) -> None:
    if not isinstance(bg, dict):
        errors.append(f"{where}: bg must be an object like {{\"kind\": \"sky\"}}")
        return
    kind = bg.get("kind") or ("image" if bg.get("image") else "sky")
    if kind not in KNOWN_BGS:
        errors.append(f"{where}: unknown bg kind {kind!r} (known: {sorted(KNOWN_BGS)})")
    if kind in SKY_BACKED_BGS and bg.get("preset", "day") not in KNOWN_SKY:
        errors.append(f"{where}: sky preset {bg.get('preset')!r} not in {sorted(KNOWN_SKY)}")
    for tr in bg.get("trees") if isinstance(bg.get("trees"), list) else []:  # some bgs take a tree count instead
        if isinstance(tr, list) and len(tr) >= 3 and _is_num(tr[2]) and tr[2] > 1.5:
            errors.append(f"{where}: trees [x, y, h] use fractions of the frame (h {tr[2]} looks like pixels; 0.35 = a third of the height)")
    tl = bg.get("timelapse")
    if isinstance(tl, dict):
        d = tl.get("dayDur")
        if d is not None and not ((_is_num(d) and d >= 0.05) or (isinstance(d, list) and d and all(isinstance(k, dict) and _is_num(k.get("v")) and k["v"] >= 0.05 and _is_num(k.get("at", 0)) for k in d))):
            errors.append(f"{where}: timelapse dayDur must be a number >= 0.05 or [{{at, v}}] keys with v >= 0.05")
        a = tl.get("accel")
        if a is not None and not (isinstance(a, dict) and all(_is_num(a.get(k)) and a[k] > 0 for k in ("from", "to", "over"))):
            errors.append(f"{where}: timelapse accel must be {{from, to, over}} with values > 0")
        elif a is not None and a.get("ease") is not None and a["ease"] not in _ease_names():
            errors.append(f"{where}: timelapse accel ease {a['ease']!r} is not an engine ease")
    clear = bg.get("clear")
    if clear is not None and not (isinstance(clear, list) and all(_is_num(t) for t in clear)):
        errors.append(f"{where}: blueprint clear must be a list of times")
    if kind == "image" and not (bg.get("image") or bg.get("src")):
        errors.append(f"{where}: image bg needs image")
    if kind == "interior" and bg.get("windowSky", "day") not in KNOWN_SKY:
        errors.append(f"{where}: windowSky {bg.get('windowSky')!r} not in {sorted(KNOWN_SKY)}")
    check_depth(bg, where, errors)
    if kind == "set":
        check_set_bg(bg, where, LAYER_KINDS, errors)


KNOWN_LOOKS = {"classic", "painted"}  # shade.js T.LOOKS
LIGHT_NUMS = {"dir": (-360, 720), "rim": (0, 1), "intensity": (0, 1)}


def _check_light(light, where: str, errors: list[str]) -> None:
    """style.light / shot.light: {dir (deg toward the light, 0 = right, 90 = up), color, rim, ambient, intensity}."""
    if light is None:
        return
    if not isinstance(light, dict):
        errors.append(f"{where}: light must be an object {{dir, color, rim, ambient, intensity}}")
        return
    for key, (lo, hi) in LIGHT_NUMS.items():
        v = light.get(key)
        if v is not None and not (_is_num(v) and lo <= v <= hi):
            errors.append(f"{where}: light.{key} must be a number in {lo}..{hi}")
    for key in ("color", "ambient"):
        v = light.get(key)
        if v is not None and not (isinstance(v, str) and HEX_RE.match(v)):
            errors.append(f"{where}: light.{key} must be a hex colour, got {v!r}")


def _check_look_name(look, where: str, errors: list[str]) -> None:
    if look is not None and (not isinstance(look, str) or look not in KNOWN_LOOKS):
        errors.append(f"{where}: look {look!r} not in {sorted(KNOWN_LOOKS)}")


CONTACT_KEYS = {"w": (0, None), "h": (0, None), "dy": (None, None), "alpha": (0, 1)}


def _check_paint_fields(layer: dict, where: str, errors: list[str]) -> None:
    """Per-layer painted-look fields, for the layer and every state its swaps produce: atmos (atmospheric
    perspective), contact (ground shadow), painted (opt out)."""
    states = _swap_states(layer)
    for k, entry in enumerate(states):
        at = where if k == 0 else f"{where} (after swap {k})"
        atmos = entry.get("atmos")
        amount = atmos.get("amount", 0.5) if isinstance(atmos, dict) else atmos
        if atmos is not None and not (_is_num(amount) and 0 <= amount <= 1):
            errors.append(f"{at}: atmos must be 0..1 or {{amount 0..1, color}}")
        if isinstance(atmos, dict) and atmos.get("color") is not None and not (isinstance(atmos["color"], str) and HEX_RE.match(atmos["color"])):
            errors.append(f"{at}: atmos color must be a hex colour")
        contact = entry.get("contact")
        if isinstance(contact, dict):
            for key, val in contact.items():
                lo, hi = CONTACT_KEYS.get(key, (None, None))
                if key not in CONTACT_KEYS:
                    errors.append(f"{at}: contact {key} is not a contact field (w, h, dy, alpha)")
                elif not (_is_num(val) and math.isfinite(val) and (lo is None or val >= lo) and (hi is None or val <= hi)):
                    errors.append(f"{at}: contact {key} must be a number" + (f" in {lo}..{hi}" if hi is not None else " >= 0" if lo is not None else ""))
        elif contact is not None and not (isinstance(contact, bool) or (_is_num(contact) and math.isfinite(contact) and contact >= 0)):
            errors.append(f"{at}: contact must be true/false, a width scale >= 0 or {{w, h, alpha, dy}}")
        if entry.get("painted") is not None and not isinstance(entry["painted"], bool):
            errors.append(f"{at}: painted must be true or false")


def _check_layer_refs(layer: dict, where: str, ids: set, cast: dict, errors: list[str]) -> None:
    """Cross-references inside one shot (fx target, map refs, doc arrowTo and nested who), shared by layers and pinned."""
    kind = layer.get("type")
    SC.check_refs(layer, where, ids, errors)
    target = layer.get("target")
    if kind == "fx" and isinstance(target, str) and target not in ids:
        errors.append(f"{where}<fx>: target {target!r} is not the id of a layer in this shot")
    if kind == "map":
        _check_map_refs(layer, f"{where}<map>", errors)
    if kind == "doc" and isinstance(layer.get("arrowTo"), str) and layer["arrowTo"] not in ids:
        errors.append(f"{where}<doc>: arrowTo {layer['arrowTo']!r} is not the id of a layer in this shot")
    if kind == "doc":
        for who in _nested_whos(layer):
            if who not in cast:
                errors.append(f"{where}<doc>: who {who!r} is not defined in spec.cast")


def validate(spec: dict) -> list[str]:
    """Return a list of human-readable problems (empty list = valid)."""
    errors: list[str] = []
    if not isinstance(spec, dict):
        return ["spec must be a JSON object"]
    fmt = spec.get("format", "landscape")
    if not isinstance(fmt, str) or fmt not in FORMATS:
        errors.append(f"format {fmt!r} not in {sorted(FORMATS)}")
        fmt = "landscape"
    for key, default in zip(("width", "height"), FORMATS[fmt]):
        if spec.get(key, default) != default:
            errors.append(f"{key} must be {default} for format {fmt!r}: the engine draws a fixed 1920x1080 world (use --scale for previews)")
    fps = spec.get("fps", 30)
    if not isinstance(fps, int) or not 1 <= fps <= 60:
        errors.append("fps must be an integer 1..60")
    style = spec.get("style") or {}
    if not isinstance(style, dict):
        errors.append("style must be an object")
        style = {}
    _check_look_name(style.get("look"), "style", errors)
    _check_light(style.get("light"), "style", errors)
    CC.check_twos(style.get("onTwos"), "style", errors)
    cast = spec.get("cast", {}) or {}
    if not isinstance(cast, dict):
        errors.append("cast must be an object {name: look}")
        cast = {}
    for name, look in cast.items():
        _check_look(look, f"cast.{name}", errors)
    shots = spec.get("shots")
    if not isinstance(shots, list) or not shots:
        return errors + ["shots must be a non-empty list"]
    seen: set[str] = set()
    for i, shot in enumerate(shots):
        where = f"shots[{i}]({shot.get('id', '?') if isinstance(shot, dict) else '?'})"
        if not isinstance(shot, dict):
            errors.append(f"{where}: must be an object")
            continue
        sid = shot.get("id")
        if not sid:
            errors.append(f"{where}: missing id")
        elif sid in seen:
            errors.append(f"{where}: duplicate id {sid!r}")
        seen.add(sid)
        dur = shot.get("dur")
        if not isinstance(dur, (int, float)) or dur <= 0:
            errors.append(f"{where}: dur must be a positive number of seconds")
        tr = shot.get("transition", "cut")
        tr_kind = tr.get("kind", "cut") if isinstance(tr, dict) else tr
        _check_transition(tr, f"{where}.transition", errors)
        if tr_kind not in KNOWN_TRANSITIONS:
            errors.append(f"{where}: transition {tr_kind!r} not in {sorted(KNOWN_TRANSITIONS)}")
        _check_look_name(shot.get("look"), where, errors)
        _check_light(shot.get("light"), where, errors)
        grade = shot.get("grade")
        for g in (grade if isinstance(grade, list) else [grade] if grade is not None else []):
            if isinstance(g, dict) and g.get("target", "frame") not in ("frame", "bg"):
                errors.append(f"{where}: grade target {g.get('target')!r} must be 'frame' or 'bg'")
            g = g.get("preset") if isinstance(g, dict) else g
            if g not in KNOWN_GRADES:
                errors.append(f"{where}: grade {g!r} not in {sorted(KNOWN_GRADES)}")
        layer_list = shot.get("layers", []) or []
        if not isinstance(layer_list, list):
            errors.append(f"{where}: layers must be a list of layers")
            layer_list = []
        pinned_list = shot.get("pinned", []) or []
        ids = {L.get("id") for L in layer_list if isinstance(L, dict) and L.get("id")}
        pinned_ids = {L.get("id") for L in pinned_list if isinstance(L, dict) and L.get("id")} if isinstance(pinned_list, list) else set()
        for k, f in enumerate(shot.get("focus", []) or []):
            if not (isinstance(f, dict) and _is_num(f.get("at", 0)) and (f.get("on") in ids or f.get("on") == "bg")):
                errors.append(f"{where}.focus[{k}]: needs at and on=<id of a layer in this shot>")
        CC.check_camera(shot.get("camera"), where, ids, LAYER_KINDS.get("shot_size", set()), _ease_names(), errors)
        CC.check_twos(shot.get("onTwos"), where, errors)
        if "frame" in shot:
            if fmt != "vertical":
                errors.append(f"{where}: frame only applies to vertical films (spec.format = 'vertical')")
            _check_number_or_timeline(shot["frame"], f"{where}.frame", errors)
        pinned = shot.get("pinned", []) or []
        if not isinstance(pinned, list):
            errors.append(f"{where}: pinned must be a list of layers")
            pinned = []
        # pinned fx that target world layers (directly or through another moved fx) are drawn in the world pass
        world_ids = set(ids)
        for _ in range(len(pinned) + 1):
            grown = {L.get("id") for L in pinned if isinstance(L, dict) and L.get("type") == "fx" and L.get("id") and any(r in world_ids for r in _fx_refs(L))}
            if grown <= world_ids:
                break
            world_ids |= grown
        for j, layer in enumerate(pinned):
            if not isinstance(layer, dict):
                errors.append(f"{where}.pinned[{j}]: must be an object")
                continue
            _check_layer(layer, f"{where}.pinned[{j}]<{layer.get('type')}>", cast, errors)
            _check_layer_refs(layer, f"{where}.pinned[{j}]", pinned_ids | ids, cast, errors)  # a pinned fx may target either list
            _check_director(layer, f"{where}.pinned[{j}]<{layer.get('type')}>", pinned_ids | ids, errors)
            if layer.get("type") == "fx":
                refs = _fx_refs(layer)
                if any(r in world_ids for r in refs) and any(r in pinned_ids and r not in world_ids for r in refs):
                    errors.append(f"{where}.pinned[{j}]<fx>: its targets mix world layers and pinned layers; keep them in one list")
        bgs = shot.get("bg", {"kind": "sky"})
        for j, bg in enumerate(bgs if isinstance(bgs, list) else [bgs]):
            _check_bg(bg, f"{where}.bg[{j}]", errors)
        for j, layer in enumerate(layer_list):
            if not isinstance(layer, dict):
                errors.append(f"{where}.layers[{j}]: must be an object")
                continue
            _check_layer(layer, f"{where}.layers[{j}]<{layer.get('type')}>", cast, errors)
            _check_layer_refs(layer, f"{where}.layers[{j}]", ids, cast, errors)
            _check_director(layer, f"{where}.layers[{j}]<{layer.get('type')}>", ids, errors)
    overlays = spec.get("overlays", []) or []
    if not isinstance(overlays, list):
        errors.append("overlays must be a list of {from, to, layer}")
        overlays = []
    for k, ov in enumerate(overlays):
        where = f"overlays[{k}]"
        if not (isinstance(ov, dict) and _is_num(ov.get("from", 0)) and isinstance(ov.get("layer"), dict)):
            errors.append(f"{where}: needs from (film seconds) and a layer object")
            continue
        if ov.get("to") is not None and not (_is_num(ov["to"]) and ov["to"] > ov.get("from", 0)):
            errors.append(f"{where}: to must be a number greater than from")
        _check_layer(ov["layer"], f"{where}.layer<{ov['layer'].get('type')}>", cast, errors)
    return errors


def image_refs(spec: dict) -> list[str]:
    """All image paths referenced anywhere in the spec (same keys the JS preloader walks)."""
    found: list[str] = []

    def walk(value, key=""):
        if isinstance(value, list):
            for item in value:
                walk(item, key)
        elif isinstance(value, dict):
            for k, v in value.items():
                walk(v, k)
        elif isinstance(value, str) and key in IMAGE_KEYS:
            found.append(value)

    walk(spec)
    return sorted(set(found))


def lipsync_refs(spec: dict) -> list[str]:
    """Envelope files named by bean lipsync.src fields (render.py inlines them)."""
    found: list[str] = []

    def walk(value):
        if isinstance(value, list):
            for item in value:
                walk(item)
        elif isinstance(value, dict):
            lip = value.get("lipsync")
            if isinstance(lip, dict) and isinstance(lip.get("src"), str):
                found.append(lip["src"])
            for v in value.values():
                walk(v)

    walk(spec)
    return sorted(set(found))


def load(path: str | Path) -> dict:
    """Load and validate a spec; raise SpecError listing every problem (including missing image files)."""
    path = Path(path)
    try:
        spec = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise SpecError(f"spec not found: {path}") from exc
    except json.JSONDecodeError as exc:
        raise SpecError(f"{path}: invalid JSON at line {exc.lineno}: {exc.msg}") from exc
    errors = validate(spec)
    for ref in lipsync_refs(spec):
        if not (path.parent / ref).exists():
            errors.append(f"lipsync envelope not found: {ref} (relative to {path.parent}; make it with scripts/lipsync.py)")
    for ref in image_refs(spec):
        if not ref.startswith(("data:", "http:", "https:")) and not (path.parent / ref).exists():
            errors.append(f"image not found: {ref} (relative to {path.parent})")
    if errors:
        raise SpecError(f"{path}: {len(errors)} problem(s)\n  - " + "\n  - ".join(errors))
    return spec


def summary(spec: dict) -> str:
    shots = spec["shots"]
    total = sum(s["dur"] for s in shots)
    layers = sum(len(s.get("layers", [])) for s in shots)
    return f"{len(shots)} shots · {total:.1f}s · {layers} layers · cast: {', '.join(spec.get('cast', {})) or '—'}"


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("usage: spec.py path/to/spec.json")
    try:
        loaded = load(sys.argv[1])
        print("OK:", summary(loaded))
        for warning in lint(loaded):
            print("warning:", warning)
    except SpecError as err:
        sys.exit(f"❌ {err}")
