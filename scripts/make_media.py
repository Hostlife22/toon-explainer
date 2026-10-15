#!/usr/bin/env python3
"""Rebuild the README media (showcase GIFs, contact sheets, still grids) from assets/media.json.

Every picture under assets/ is rendered by the engine from a spec in examples/, so the README never drifts from the
code. Each manifest entry names its output and how to render it:

  {"out": "showcase/forest-rain.gif", "spec": "examples/showcase/spec.json", "shot": "s02_forest_march",
   "trim": [0.5, 4.0], "width": 640, "fps": 12}
  {"out": "sheets/places_tour.jpg", "sheet": "examples/places_tour/spec.json"}
  {"out": "showcase/hero.png", "grid": [["examples/showcase/spec.json", 2.0], ...], "cols": 3, "width": 1920}

GIF sources: `shot` (comma separated consecutive ids) or `from`/`to` (film seconds); `trim` cuts [start, end] seconds
out of that clip; `style` overrides the spec style (grain is off by default for GIFs). Usage:

  uv run --with playwright --with pillow python scripts/make_media.py            # everything
  uv run --with playwright --with pillow python scripts/make_media.py brawl hero # outputs whose name contains a word
  python3 scripts/make_media.py --list
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
MANIFEST = ASSETS / "media.json"
RENDER = [sys.executable, str(ROOT / "scripts" / "render.py")]
GIF_WIDTH, GIF_FPS, GIF_COLORS = 480, 10, 160
GIF_STYLE = {"grain": False}  # film grain changes every pixel every frame and triples the GIF size


def load_manifest(path: Path = MANIFEST) -> list[dict]:
    entries = json.loads(path.read_text(encoding="utf-8"))["media"]
    for e in entries:
        kinds = [k for k in ("spec", "sheet", "grid") if k in e]
        if "out" not in e or len(kinds) != 1:
            raise SystemExit(f"❌ media entry needs `out` and exactly one of spec/sheet/grid: {e}")
        if "spec" in e and not (("shot" in e) ^ ("from" in e)):
            raise SystemExit(f"❌ {e['out']}: a GIF needs either `shot` or `from`/`to`")
        if "from" in e and not (isinstance(e.get("to"), (int, float)) and 0 <= e["from"] < e["to"]):
            raise SystemExit(f"❌ {e['out']}: `from`/`to` must satisfy 0 <= from < to")
        if "trim" in e and not (len(e["trim"]) == 2 and 0 <= e["trim"][0] < e["trim"][1]):
            raise SystemExit(f"❌ {e['out']}: `trim` must be [start, end] with 0 <= start < end")
    return entries


def run(cmd: list[str]) -> None:
    result = subprocess.run(cmd, capture_output=True, text=True, cwd=ROOT)
    log = result.stdout + result.stderr
    if result.returncode != 0 or "[pageerror]" in log:
        raise SystemExit(f"❌ {' '.join(cmd[:4])} ...\n{log[-2000:]}")


def spec_width(spec: str) -> int:
    return 1080 if json.loads((ROOT / spec).read_text(encoding="utf-8")).get("format") == "vertical" else 1920


def styled_copy(spec: str, style: dict, name: str) -> Path:
    """A copy of the spec with a style override, next to it so relative image paths still resolve."""
    src = ROOT / spec
    data = json.loads(src.read_text(encoding="utf-8"))
    copy = src.with_name(f".media_{name}_{os.getpid()}.json")  # unique per process: parallel builds must not share it
    copy.write_text(json.dumps({**data, "style": {**data.get("style", {}), **style}}), encoding="utf-8")
    return copy


def make_gif(e: dict, out: Path, tmp: Path) -> None:
    width, fps = e.get("width", GIF_WIDTH), e.get("fps", GIF_FPS)
    clip = tmp / "clip.mp4"
    src = ["--shot", e["shot"]] if "shot" in e else ["--from", str(e["from"]), "--to", str(e["to"])]
    scale = min(1.0, round(width * 2 / spec_width(e["spec"]), 3))  # render at 2x the GIF width, then downscale
    spec = styled_copy(e["spec"], {**GIF_STYLE, **e.get("style", {})}, out.stem)
    try:
        run(RENDER + [str(spec), *src, "--fps", str(fps), "--scale", str(scale), "--crf", "14", "--out", str(clip)])
    finally:
        spec.unlink(missing_ok=True)
    trim = []
    if "trim" in e:
        a, b = e["trim"]
        dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(clip)],
                                   capture_output=True, text=True, check=True).stdout)
        if b > dur + 0.05:
            raise SystemExit(f"❌ {e['out']}: trim end {b} s is past the end of the {dur:.2f} s clip")
        trim = ["-ss", str(a), "-t", str(b - a)]
    colors = e.get("colors", GIF_COLORS)
    vf = (f"scale={width}:-2:flags=lanczos,split[a][b];[a]palettegen=max_colors={colors}:stats_mode=diff[p];"
          f"[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle")
    run(["ffmpeg", "-y", "-v", "error", *trim, "-i", str(clip), "-filter_complex", vf, "-loop", "0", str(out)])


def make_sheet(e: dict, out: Path, tmp: Path) -> None:
    run(RENDER + [e["sheet"], "--sheet", str(out), "--scale", str(e.get("scale", 0.5))])


def make_grid(e: dict, out: Path, tmp: Path) -> None:
    from PIL import Image

    width, cols, gap = e.get("width", 1920), e.get("cols", 3), e.get("gap", 6)
    tiles = []
    for i, (spec, t) in enumerate(e["grid"]):
        d = tmp / f"g{i}"
        run(RENDER + [spec, "--stills", str(t), "--scale", str(e.get("scale", 0.5)), "--out", str(d)])
        tiles.append(Image.open(next(d.glob("*.png"))).convert("RGB"))
    tw = (width - gap * (cols - 1)) // cols
    th = round(tiles[0].height * tw / tiles[0].width)
    rows = -(-len(tiles) // cols)
    sheet = Image.new("RGB", (width, rows * th + gap * (rows - 1)), e.get("bg", "#1a120d"))
    for i, im in enumerate(tiles):
        sheet.paste(im.resize((tw, th), Image.LANCZOS), ((i % cols) * (tw + gap), (i // cols) * (th + gap)))
    if out.suffix == ".jpg":
        sheet.save(out, quality=e.get("quality", 85), optimize=True, progressive=True)
    else:
        sheet.save(out, optimize=True)


def build(e: dict) -> Path:
    out = ASSETS / e["out"]
    out.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="toon_media_") as t:
        maker = make_gif if "spec" in e else make_sheet if "sheet" in e else make_grid
        maker(e, out, Path(t))
    return out


def main(argv=None) -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("only", nargs="*", help="build only outputs whose path contains one of these words")
    ap.add_argument("--list", action="store_true", help="list the manifest and exit")
    args = ap.parse_args(argv)
    entries = [e for e in load_manifest() if not args.only or any(w in e["out"] for w in args.only)]
    if not entries:
        raise SystemExit("❌ nothing matches")
    for e in entries:
        if args.list:
            print(e["out"])
            continue
        out = build(e)
        print(f"{out.relative_to(ROOT)}  {out.stat().st_size // 1024} KB")
    if not args.list:
        from make_gallery import main as gallery
        gallery([])


if __name__ == "__main__":
    main()
