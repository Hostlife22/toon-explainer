"""Spec vocabulary: the KNOWN_* name sets the validator checks against, extended by every scripts/vocab/*.json file
at import (layer kinds and engine registries too). spec.py re-exports all of these names."""
from __future__ import annotations

import json
import re
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
