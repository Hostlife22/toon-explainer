#!/usr/bin/env python3
"""Measure a reference video's editing rhythm and grab evidence sheets (used to build references/01).

  uv run --with numpy python scripts/analyze_ref.py ref.mp4 --out breakdown/ [--windows 0:120,1000:120] [--samples 20]

Outputs in --out:
  rhythm.json        cuts per window, mean/median shot length, share of static frames (camera drift only)
  sheet_overview.jpg evenly spaced keyframes over the whole video (4x5)
  strip_<t>.jpg      2 fps strips (9 s) starting at each window, with timestamps — shows camera moves and pop-ins
Cut detection: mean abs grayscale difference on 192x96 frames > 18 with 6-frame debounce. Clusters of "cuts"
0.23 s apart are usually fast zooms / flashes, not real cuts — check the strips before trusting the numbers.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

W, H = 192, 96


def probe_duration(video: str) -> float:
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", video],
                         capture_output=True, text=True, check=True)
    return float(out.stdout.strip())


def window_stats(video: str, ss: float, dur: float, thr: float = 18.0) -> dict:
    p = subprocess.run(["ffmpeg", "-v", "error", "-ss", str(ss), "-t", str(dur), "-i", video,
                        "-vf", f"scale={W}:{H},format=gray", "-r", "30", "-f", "rawvideo", "-"], capture_output=True, check=True)  # resampled to 30 fps
    frames = np.frombuffer(p.stdout, np.uint8).reshape(-1, H, W).astype(np.float32)
    d = np.abs(np.diff(frames, axis=0)).mean(axis=(1, 2))
    cuts, last = [], -20
    for i, v in enumerate(d):
        if v > thr and i - last > 6:
            cuts.append(round(ss + (i + 1) / 30, 2))
            last = i
    segs = np.diff([ss] + cuts + [ss + dur])
    return {
        "window": [ss, dur], "cuts": len(cuts),
        "mean_shot_s": round(float(segs.mean()), 2), "median_shot_s": round(float(np.median(segs)), 2),
        "static_share": round(float((d < 0.5).mean()), 3), "small_motion_share": round(float(((d >= 0.5) & (d < 4)).mean()), 3),
        "cut_times": cuts,
    }


def main(argv=None) -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("video")
    ap.add_argument("--out", required=True)
    ap.add_argument("--windows", default="0:120")
    ap.add_argument("--samples", type=int, default=20)
    a = ap.parse_args(argv)
    if not Path(a.video).exists():
        sys.exit(f"❌ video not found: {a.video}")
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    total = probe_duration(a.video)
    try:
        windows = [tuple(map(float, w.split(":"))) for w in a.windows.split(",")]
    except ValueError:
        sys.exit("❌ --windows must look like 0:120,1000:120")
    bad = [ss for ss, _ in windows if ss >= total]
    if bad:
        sys.exit(f"❌ window start(s) {bad} beyond video length {total:.1f}s")
    stats = [window_stats(a.video, ss, min(dur, total - ss)) for ss, dur in windows]
    (out / "rhythm.json").write_text(json.dumps({"duration": total, "windows": stats}, indent=2))
    step = total / (a.samples + 1)
    tmp = out / "_overview"
    tmp.mkdir(exist_ok=True)
    for i in range(a.samples):  # seek by time: correct for any frame rate
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{(i + 1) * step:.2f}", "-i", a.video, "-frames:v", "1",
                        "-vf", "scale=427:-2", str(tmp / f"{i:03d}.jpg")], check=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-pattern_type", "glob", "-i", str(tmp / "*.jpg"),
                    "-vf", f"tile=4x{-(-a.samples // 4)}", "-frames:v", "1", "-q:v", "3", str(out / "sheet_overview.jpg")], check=True)
    for f in tmp.glob("*.jpg"):
        f.unlink()
    tmp.rmdir()
    for ss, _ in windows:
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(ss), "-t", "9", "-i", a.video, "-vf",
                        "fps=2,scale=320:-2,tile=6x3", "-frames:v", "1", str(out / f"strip_{int(ss)}.jpg")], check=True)
    for s in stats:
        print(f"[{s['window'][0]:.0f}s +{s['window'][1]:.0f}s] cuts={s['cuts']} mean={s['mean_shot_s']}s median={s['median_shot_s']}s static={s['static_share']}")
    print("→", out)


if __name__ == "__main__":
    main()
