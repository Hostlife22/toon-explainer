#!/usr/bin/env python3
"""Chroma-key AI-generated cutouts (character / prop on flat green) into transparent PNGs for `image` layers.

  uv run --with pillow --with numpy python scripts/key_green.py in.png out.png [--key 00ff00] [--tol 90] [--trim]
  uv run --with pillow --with numpy python scripts/key_green.py assets/raw/ assets/cut/      # whole folder

Removes the key colour, softens a 1-2 px edge, suppresses green spill on the dark outline, optionally trims to content.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image


def key(img: Image.Image, key_rgb=(0, 255, 0), tol: float = 90.0, soft: float = 40.0) -> Image.Image:
    rgb = np.asarray(img.convert("RGB")).astype(np.float32)
    dist = np.linalg.norm(rgb - np.array(key_rgb, np.float32), axis=2)
    alpha = np.clip((dist - tol) / max(1.0, soft), 0, 1)
    g = rgb[..., 1]
    limit = np.maximum(rgb[..., 0], rgb[..., 2])
    rgb[..., 1] = np.where(g > limit, limit + (g - limit) * 0.15, g)  # despill
    out = np.dstack([rgb, alpha * 255]).astype(np.uint8)
    return Image.fromarray(out, "RGBA")


def trim(img: Image.Image, pad: int = 8) -> Image.Image:
    bbox = img.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox()
    if not bbox:
        return img
    l, t, r, b = bbox
    return img.crop((max(0, l - pad), max(0, t - pad), min(img.width, r + pad), min(img.height, b + pad)))


def main(argv=None) -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("src")
    ap.add_argument("dst")
    ap.add_argument("--key", default="00ff00", help="hex key colour")
    ap.add_argument("--tol", type=float, default=90)
    ap.add_argument("--trim", action="store_true")
    a = ap.parse_args(argv)
    try:
        hexkey = a.key.lstrip("#")
        key_rgb = tuple(int(hexkey[i:i + 2], 16) for i in (0, 2, 4))
    except ValueError:
        sys.exit(f"❌ bad --key {a.key!r}, expected hex like 00ff00")
    src, dst = Path(a.src), Path(a.dst)
    if src.is_dir():
        pairs = [(f, dst / (f.stem + ".png")) for f in sorted(src.glob("*")) if f.suffix.lower() in (".png", ".jpg", ".jpeg", ".webp")]
    else:
        pairs = [(src, dst / (src.stem + ".png") if dst.is_dir() or not dst.suffix else dst)]
    if not pairs:
        sys.exit(f"❌ no images in {src}")
    for f, out in pairs:
        try:
            im = key(Image.open(f), key_rgb, a.tol)
        except OSError as err:
            sys.exit(f"❌ cannot read {f}: {err}")
        if a.trim:
            im = trim(im)
        out.parent.mkdir(parents=True, exist_ok=True)
        im.save(out)
        print(f"{f.name} → {out}  {im.width}x{im.height}")


if __name__ == "__main__":
    main()
