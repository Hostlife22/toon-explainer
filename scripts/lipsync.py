#!/usr/bin/env python3
"""Voiceover envelope for lip-sync: per-frame loudness of an audio file as a compact JSON beside the spec.

    python3 scripts/lipsync.py film/vo.mp3 --out film/vo.lips.json          # 30 fps, levels 0..9
    python3 scripts/lipsync.py film/vo.wav --out film/vo.lips.json --fps 24 --gate 0.06

The audio is decoded with FFmpeg to 16 kHz mono PCM; each frame's RMS is normalised to the 95th percentile of the
voiced frames, gated (silence -> 0) and quantised to one digit per frame. Output:

    {"fps": 30, "dur": 12.4, "levels": "0001357886421000..."}

A bean layer maps it to mouth shapes with "lipsync": {"src": "vo.lips.json"} (references/toolkits/01_characters.md).
The engine never reads audio; render.py inlines the JSON into the spec. Standard library only (plus the ffmpeg binary).
"""
from __future__ import annotations

import argparse
import array
import json
import math
import shutil
import subprocess
import sys
from pathlib import Path

RATE = 16000
LEVELS = 9  # digits 0..9


def decode(path: Path, rate: int = RATE) -> array.array:
    """Decode any audio FFmpeg reads into signed 16-bit mono samples."""
    if not path.exists():
        raise SystemExit(f"audio not found: {path}")
    if shutil.which("ffmpeg") is None:
        raise SystemExit("ffmpeg is required to decode audio (brew install ffmpeg / apt install ffmpeg)")
    cmd = ["ffmpeg", "-v", "error", "-i", str(path), "-ac", "1", "-ar", str(rate), "-f", "s16le", "-"]
    proc = subprocess.run(cmd, capture_output=True, check=False)
    if proc.returncode != 0:
        raise SystemExit(f"ffmpeg could not decode {path}: {proc.stderr.decode(errors='replace').strip()}")
    samples = array.array("h")
    samples.frombytes(proc.stdout[: len(proc.stdout) // 2 * 2])
    if sys.byteorder == "big":
        samples.byteswap()
    return samples


def frame_rms(samples: array.array, fps: int, rate: int = RATE) -> list[float]:
    """Root-mean-square amplitude (0..1) of each video frame's slice of samples."""
    hop = rate / fps
    n = max(1, math.ceil(len(samples) / hop)) if samples else 0
    out = []
    for i in range(n):
        a, b = int(round(i * hop)), int(round((i + 1) * hop))
        chunk = samples[a:b]
        if not chunk:
            out.append(0.0)
            continue
        out.append(math.sqrt(sum(s * s for s in chunk) / len(chunk)) / 32768.0)
    return out


def quantise(rms: list[float], gate: float = 0.08) -> str:
    """Normalise to the 95th percentile of voiced frames, gate quiet frames and map to digits 0..9."""
    if not rms:
        return ""
    loud = sorted(v for v in rms if v > 1e-4)
    if not loud:
        return "0" * len(rms)
    ref = loud[min(len(loud) - 1, int(len(loud) * 0.95))] or loud[-1]
    digits = []
    for v in rms:
        x = min(1.0, v / ref)
        digits.append("0" if v <= 0 or x < gate else str(max(1, min(LEVELS, int(round(x * LEVELS))))))
    return "".join(digits)


def envelope(path: Path, fps: int = 30, gate: float = 0.08) -> dict:
    samples = decode(path)
    rms = frame_rms(samples, fps)
    return {"fps": fps, "dur": round(len(samples) / RATE, 3), "levels": quantise(rms, gate)}


def main(argv=None) -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("audio", type=Path)
    ap.add_argument("--out", type=Path, help="JSON path (default: <audio>.lips.json)")
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--gate", type=float, default=0.08, help="levels below this fraction of the peak count as silence")
    args = ap.parse_args(argv)
    if not (1 <= args.fps <= 120):
        raise SystemExit("--fps must be in 1..120")
    if not (0 <= args.gate < 1):
        raise SystemExit("--gate must be in 0..1")
    env = envelope(args.audio, args.fps, args.gate)
    out = args.out or args.audio.with_suffix(".lips.json")
    out.write_text(json.dumps(env, separators=(",", ":")) + "\n", encoding="utf-8")
    voiced = sum(1 for ch in env["levels"] if ch != "0")
    print(f"{out}: {len(env['levels'])} frames at {env['fps']} fps, {voiced} voiced")


if __name__ == "__main__":
    main()
