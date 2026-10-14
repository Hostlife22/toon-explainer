#!/usr/bin/env python3
"""Storyboard (MASTER_PROMPT step 5 format) → skeleton film spec + SRT.

  python3 scripts/script2spec.py script.md --out film/spec.json [--wpm 160] [--srt vo.srt] [--min 1.6]
  python3 scripts/script2spec.py script.md --srt vo.srt --merge film/spec.json   # re-time a filled spec, keep layers

Input format (Russian or English labels), one block per shot:

  **Кадр 12** 🎬
  — Озвучка: «Человек сделал 45 версий одного и того же соуса…»
  — На экране: учёный в лаборатории над колбами

Timing:
  * without --srt: duration = words / (wpm/60) + 0.25 s pause, at least --min seconds;
  * with --srt (VO transcription from Whisper / CapCut / YouTube): shot boundaries are aligned to the real voice by
    matching words, so every shot starts exactly when its first word is spoken.

Output: a valid spec whose shots carry `vo`, `screen`, `anim` and a placeholder layer set (bg + caption with the
on-screen note) — then Claude replaces placeholders with real layers per references/02-visual-grammar.md.
Also writes <out>.srt with the shot timings (useful for the editor and for burned subtitles).
"""
from __future__ import annotations

import argparse
import difflib
import json
import re
import sys
from pathlib import Path

SHOT_RE = re.compile(r"^\s*\**\s*(?:Кадр|Shot)\s*(\d+)\s*\**\s*(.*)$", re.IGNORECASE)
VO_RE = re.compile(r"^\s*[—–\-]?\s*(?:Озвучка|Voiceover|VO)\s*:\s*(.+)$", re.IGNORECASE)
SCREEN_RE = re.compile(r"^\s*[—–\-]?\s*(?:На экране|On screen|Screen)\s*:\s*(.+)$", re.IGNORECASE)
WORD_RE = re.compile(r"[\wё]+", re.IGNORECASE)
TS = r"(?:(\d+):)?(\d+):(\d+)[,.](\d+)"  # hh:mm:ss,mmm (SRT) or mm:ss.mmm (short VTT)
SRT_TIME = re.compile(TS + r"\s*-->\s*" + TS)


def strip_quotes(text: str) -> str:
    return text.strip().strip("«»\"“”„").strip()


def parse_storyboard(text: str) -> list[dict]:
    """Return [{n, anim, vo, screen}] in order. Raises ValueError on an empty or malformed storyboard."""
    shots: list[dict] = []
    cur = None
    for raw in text.splitlines():
        line = raw.strip()
        m = SHOT_RE.match(line)
        if m:
            cur = {"n": int(m.group(1)), "anim": "🎬" in m.group(2), "vo": "", "screen": ""}
            shots.append(cur)
            continue
        if cur is None:
            continue
        if (m := VO_RE.match(line)):
            cur["vo"] = strip_quotes(m.group(1))
        elif (m := SCREEN_RE.match(line)):
            cur["screen"] = m.group(1).strip()
    if not shots:
        raise ValueError("no shots found: expected blocks starting with '**Кадр N**' or '**Shot N**'")
    nums = [s["n"] for s in shots]
    dupes = sorted({n for n in nums if nums.count(n) > 1})
    if dupes:
        raise ValueError(f"duplicate shot numbers: {dupes}")
    empty = [s["n"] for s in shots if not s["vo"]]
    if empty:
        raise ValueError(f"shots without voiceover line: {empty}")
    return shots


def words(text: str) -> list[str]:
    return [w.lower().replace("ё", "е") for w in WORD_RE.findall(text)]


def estimate_durations(shots: list[dict], wpm: float, min_dur: float, pause: float = 0.25) -> list[float]:
    per_word = 60.0 / wpm
    return [round(max(min_dur, len(words(s["vo"])) * per_word + pause), 2) for s in shots]


def _secs(parts) -> float:
    h, m, s, frac = parts
    return int(h or 0) * 3600 + int(m) * 60 + int(s) + int(frac) / 10 ** len(frac)  # ".5" = 500 ms


def parse_srt(text: str) -> list[tuple[float, float, str]]:
    cues = []
    for block in re.split(r"\n\s*\n", text.strip()):
        lines = [ln for ln in block.splitlines() if ln.strip()]
        for i, ln in enumerate(lines):
            m = SRT_TIME.search(ln)
            if m:
                g = m.groups()
                start, end = _secs(g[0:4]), _secs(g[4:8])
                cues.append((start, end, " ".join(lines[i + 1:])))
                break
    if not cues:
        raise ValueError("SRT/VTT contains no cues")
    return cues


def srt_word_times(cues) -> list[tuple[str, float]]:
    """Spread each cue's duration over its words proportionally to word length → [(word, start_time)]."""
    out = []
    for start, end, text in cues:
        ws = words(text)
        total = sum(len(w) for w in ws) or 1
        t = start
        for w in ws:
            out.append((w, t))
            t += (end - start) * len(w) / total
    return out


def align_durations(shots: list[dict], cues, tail: float = 0.6) -> list[float]:
    """Shot start = time of its first word in the real VO (difflib word alignment). Last shot ends at last cue + tail."""
    timed = srt_word_times(cues)
    srt_words = [w for w, _ in timed]
    script_words, first_idx = [], []
    for s in shots:
        first_idx.append(len(script_words))
        script_words.extend(words(s["vo"]))
    mapping = {}
    for a, b, size in difflib.SequenceMatcher(None, script_words, srt_words, autojunk=False).get_matching_blocks():
        for k in range(size):
            mapping[a + k] = b + k
    starts = []
    for i, idx in enumerate(first_idx):
        end_idx = first_idx[i + 1] if i + 1 < len(first_idx) else len(script_words)
        hit = next((mapping[j] for j in range(idx, end_idx) if j in mapping), None)
        starts.append(timed[hit][1] if hit is not None else None)
    # Fill unmatched shots by interpolation between neighbours.
    for i, st in enumerate(starts):
        if st is None:
            prev = next((starts[j] for j in range(i - 1, -1, -1) if starts[j] is not None), 0.0)
            nxt = next((starts[j] for j in range(i + 1, len(starts)) if starts[j] is not None), cues[-1][1])
            starts[i] = (prev + nxt) / 2
    starts[0] = 0.0  # shot 1 also covers any leading silence: the film and the VO both start at 0
    min_dur = 0.4
    for i in range(1, len(starts)):  # keep starts monotonic with a minimum shot length; total stays = VO length
        starts[i] = max(starts[i], starts[i - 1] + min_dur)
    end = max(cues[-1][1] + tail, starts[-1] + min_dur)
    ends = starts[1:] + [end]
    return [round(e - s, 3) for s, e in zip(starts, ends)]


def fmt_ts(t: float) -> str:
    ms = int(round(t * 1000))
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


def to_srt(shots: list[dict], durs: list[float]) -> str:
    out, t = [], 0.0
    for i, (s, d) in enumerate(zip(shots, durs), 1):
        out.append(f"{i}\n{fmt_ts(t)} --> {fmt_ts(t + d)}\n{s['vo']}\n")
        t += d
    return "\n".join(out)


def build_spec(shots: list[dict], durs: list[float], title: str = "") -> dict:
    spec_shots = []
    for s, d in zip(shots, durs):
        spec_shots.append({
            "id": f"k{s['n']:02d}",
            "dur": d,
            "vo": s["vo"],
            "screen": s["screen"],
            "anim": s["anim"],
            "bg": {"kind": "sky", "preset": "day", "clouds": 4},
            "camera": {"zoom": [1.0, 1.05]},
            "layers": [{"type": "caption", "text": (s["screen"] or s["vo"])[:60], "x": 0.5, "y": 0.9, "size": 44, "todo": True}],
        })
    return {"title": title, "fps": 30, "seed": 1, "style": {"grain": True, "vignette": 0.28}, "cast": {}, "shots": spec_shots}


def merge_durations(spec: dict, shots: list[dict], durs: list[float]) -> tuple[dict, list[str]]:
    """Return a copy of spec with dur replaced for shots whose id matches the storyboard (kNN); report unmatched ids."""
    by_id = {f"k{s['n']:02d}": d for s, d in zip(shots, durs)}
    new_shots, missing = [], []
    for shot in spec["shots"]:
        if shot["id"] in by_id:
            new_shots.append({**shot, "dur": by_id[shot["id"]]})
        else:
            new_shots.append(shot)
            missing.append(shot["id"])
    return {**spec, "shots": new_shots}, missing


def main(argv=None) -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("storyboard")
    ap.add_argument("--out")
    ap.add_argument("--merge", help="existing filled spec: only update dur by shot id (written in place)")
    ap.add_argument("--wpm", type=float, default=160)
    ap.add_argument("--min", dest="min_dur", type=float, default=1.6)
    ap.add_argument("--srt", help="real VO timings (SRT or VTT)")
    ap.add_argument("--title", default="")
    a = ap.parse_args(argv)
    try:
        shots = parse_storyboard(Path(a.storyboard).read_text(encoding="utf-8"))
        durs = align_durations(shots, parse_srt(Path(a.srt).read_text(encoding="utf-8"))) if a.srt else estimate_durations(shots, a.wpm, a.min_dur)
    except (OSError, ValueError) as err:
        sys.exit(f"❌ {err}")
    if a.merge:
        target = Path(a.merge)
        try:
            spec = json.loads(target.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as err:
            sys.exit(f"❌ cannot read {target}: {err}")
        merged, missing = merge_durations(spec, shots, durs)
        target.write_text(json.dumps(merged, ensure_ascii=False, indent=2), encoding="utf-8")
        target.with_suffix(".srt").write_text(to_srt(shots, durs), encoding="utf-8")
        note = f" · not in storyboard, kept: {', '.join(missing)}" if missing else ""
        print(f"OK: re-timed {len(spec['shots']) - len(missing)} shots in {target} · {sum(durs):.1f}s{note}")
        return
    if not a.out:
        sys.exit("❌ --out is required (or use --merge)")
    out = Path(a.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(build_spec(shots, durs, a.title), ensure_ascii=False, indent=2), encoding="utf-8")
    out.with_suffix(".srt").write_text(to_srt(shots, durs), encoding="utf-8")
    anim = sum(s["anim"] for s in shots)
    print(f"OK: {len(shots)} shots · {sum(durs):.1f}s · {anim} marked 🎬 → {out} (+ {out.with_suffix('.srt').name})")


if __name__ == "__main__":
    main()
