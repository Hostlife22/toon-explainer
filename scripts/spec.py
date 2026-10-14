#!/usr/bin/env python3
"""Film spec loading and validation for toon-explainer.

    python3 scripts/spec.py film/spec.json          # validate, print summary, exit 1 on errors

The JS engine is the source of truth for drawing; this module mirrors its vocabulary so mistakes are caught
before a long render starts. Keep the KNOWN_* sets in sync with scripts/engine (T.layers / T.bgs / T.transitions).
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

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


def _load_vocab() -> None:
    global COLOR_KEYS
    targets = {"layers": KNOWN_LAYERS, "bgs": KNOWN_BGS, "transitions": KNOWN_TRANSITIONS, "enter": KNOWN_ENTER,
               "props": KNOWN_PROPS, "fx": KNOWN_FX, "fg": KNOWN_FG, "grades": KNOWN_GRADES, "poses": KNOWN_POSES,
               "expr": KNOWN_EXPR, "sky": KNOWN_SKY, "hair": KNOWN_HAIR, "beard": KNOWN_BEARD, "head": KNOWN_HEAD,
               "views": KNOWN_VIEWS, "outfit": KNOWN_OUTFIT, "mask": KNOWN_MASK, "headShape": KNOWN_HEADSHAPE,
               "flag": KNOWN_FLAG, "crowd_mode": KNOWN_CROWD_MODE}
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
                         ("outfit", KNOWN_OUTFIT), ("mask", KNOWN_MASK), ("headShape", KNOWN_HEADSHAPE)):
        if look.get(key) is not None and allowed and look[key] not in allowed:
            errors.append(f"{where}: {key} {look[key]!r} not in {sorted(allowed)}")
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


def _check_layer(layer: dict, where: str, cast: dict, errors: list[str]) -> None:
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
        if layer.get("view") and layer["view"] not in KNOWN_VIEWS:
            errors.append(f"{where}: view {layer['view']!r} not in {sorted(KNOWN_VIEWS)}")
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
    if kind == "prop" and layer.get("kind") not in KNOWN_PROPS:
        errors.append(f"{where}: prop kind {layer.get('kind')!r} not in {sorted(KNOWN_PROPS)}")
    if kind == "fx" and layer.get("kind") not in KNOWN_FX:
        errors.append(f"{where}: fx kind {layer.get('kind')!r} not in {sorted(KNOWN_FX)}")
    if kind in ("label", "title", "caption", "sign", "date") and not str(layer.get("text", "")).strip():
        errors.append(f"{where}: {kind} needs non-empty text")
    if kind == "image" and not (layer.get("src") or (layer.get("frames") or {}).get("idle")):
        errors.append(f"{where}: image needs src or frames.idle")
    for win in layer.get("talk", []) or []:
        if not (isinstance(win, list) and len(win) == 2 and all(isinstance(v, (int, float)) for v in win) and win[0] <= win[1]):
            errors.append(f"{where}: talk windows must be [[start, end], ...] with start <= end")


def _check_bg(bg, where: str, errors: list[str]) -> None:
    if not isinstance(bg, dict):
        errors.append(f"{where}: bg must be an object like {{\"kind\": \"sky\"}}")
        return
    kind = bg.get("kind") or ("image" if bg.get("image") else "sky")
    if kind not in KNOWN_BGS:
        errors.append(f"{where}: unknown bg kind {kind!r} (known: {sorted(KNOWN_BGS)})")
    if kind in ("sky", "city") and bg.get("preset", "day") not in KNOWN_SKY:
        errors.append(f"{where}: sky preset {bg.get('preset')!r} not in {sorted(KNOWN_SKY)}")
    if kind == "image" and not (bg.get("image") or bg.get("src")):
        errors.append(f"{where}: image bg needs image")
    if kind == "interior" and bg.get("windowSky", "day") not in KNOWN_SKY:
        errors.append(f"{where}: windowSky {bg.get('windowSky')!r} not in {sorted(KNOWN_SKY)}")


def validate(spec: dict) -> list[str]:
    """Return a list of human-readable problems (empty list = valid)."""
    errors: list[str] = []
    if not isinstance(spec, dict):
        return ["spec must be a JSON object"]
    for key, default in (("width", 1920), ("height", 1080)):
        if spec.get(key, default) != default:
            errors.append(f"{key} must be {default}: the engine draws in fixed 1920x1080 space (use --scale for previews)")
    fps = spec.get("fps", 30)
    if not isinstance(fps, int) or not 1 <= fps <= 60:
        errors.append("fps must be an integer 1..60")
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
        if tr_kind not in KNOWN_TRANSITIONS:
            errors.append(f"{where}: transition {tr_kind!r} not in {sorted(KNOWN_TRANSITIONS)}")
        grade = shot.get("grade")
        if grade is not None:
            g = grade.get("preset") if isinstance(grade, dict) else grade
            if g not in KNOWN_GRADES:
                errors.append(f"{where}: grade {g!r} not in {sorted(KNOWN_GRADES)}")
        bgs = shot.get("bg", {"kind": "sky"})
        for j, bg in enumerate(bgs if isinstance(bgs, list) else [bgs]):
            _check_bg(bg, f"{where}.bg[{j}]", errors)
        for j, layer in enumerate(shot.get("layers", []) or []):
            if not isinstance(layer, dict):
                errors.append(f"{where}.layers[{j}]: must be an object")
                continue
            _check_layer(layer, f"{where}.layers[{j}]<{layer.get('type')}>", cast, errors)
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
        print("OK:", summary(load(sys.argv[1])))
    except SpecError as err:
        sys.exit(f"❌ {err}")
