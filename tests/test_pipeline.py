"""Tests for the script → spec → render pipeline.

  uv run --with pytest --with playwright --with pillow --with numpy pytest tests -q
"""
from __future__ import annotations

import copy
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import script2spec as s2s  # noqa: E402
from spec import SpecError, load, validate  # noqa: E402

STORYBOARD = """
### Script

**Shot 1**
- Voiceover: "In 46 BC the Roman year lasted four hundred and forty five days."
- On screen: the Roman Forum at sunset, the date 46 BC

**Shot 2** 🎬
— Voiceover: «And it was no mistake.»
— On screen: a calendar flips wildly

**Shot 3**
- Voiceover: "Priests controlled the calendar."
- On screen: pontifex with a scroll
"""

SRT = """1
00:00:00,000 --> 00:00:03,900
In 46 BC the Roman year lasted four hundred and forty five days.

2
00:00:04,200 --> 00:00:05,600
And it was no mistake.

3
00:00:06,000 --> 00:00:08,000
Priests controlled the calendar.
"""

DEMO = ROOT / "examples" / "calendar_445" / "spec.json"
ALL_EXAMPLES = sorted((ROOT / "examples").glob("*/spec.json"))


# ---------- storyboard parsing ----------
def test_parse_storyboard_reads_all_shots_and_flags():
    shots = s2s.parse_storyboard(STORYBOARD)
    assert [s["n"] for s in shots] == [1, 2, 3]
    assert [s["anim"] for s in shots] == [False, True, False]
    assert shots[1]["vo"] == "And it was no mistake."
    assert shots[2]["screen"] == "pontifex with a scroll"


def test_parse_storyboard_rejects_empty_and_missing_vo():
    with pytest.raises(ValueError, match="no shots"):
        s2s.parse_storyboard("just some text")
    with pytest.raises(ValueError, match="without voiceover"):
        s2s.parse_storyboard("**Shot 1**\n- On screen: something")


def test_estimate_durations_follow_wpm_with_floor():
    shots = s2s.parse_storyboard(STORYBOARD)
    durs = s2s.estimate_durations(shots, wpm=160, min_dur=1.6)
    assert durs[0] == pytest.approx(13 * 60 / 160 + 0.25, abs=0.01)  # 13 words
    assert durs[1] == pytest.approx(5 * 60 / 160 + 0.25, abs=0.01)  # 5 words → 2.13 s, above the floor
    short = s2s.estimate_durations([{"vo": "Yes."}], wpm=160, min_dur=1.6)
    assert short == [1.6]


def test_align_durations_snaps_to_real_voice():
    shots = s2s.parse_storyboard(STORYBOARD)
    durs = s2s.align_durations(shots, s2s.parse_srt(SRT), tail=0.5)
    assert durs[0] == pytest.approx(4.2, abs=0.01)  # shot 2 starts when "And" is spoken at 4.2 s
    assert durs[1] == pytest.approx(1.8, abs=0.01)
    assert sum(durs) == pytest.approx(8.5, abs=0.01)


def test_build_spec_is_valid_and_srt_matches():
    shots = s2s.parse_storyboard(STORYBOARD)
    durs = s2s.estimate_durations(shots, 160, 1.6)
    spec = s2s.build_spec(shots, durs)
    assert validate(spec) == []
    srt = s2s.to_srt(shots, durs)
    assert srt.count("-->") == 3
    assert "00:00:00,000 -->" in srt


def test_cli_writes_spec_and_srt(tmp_path):
    md = tmp_path / "script.md"
    md.write_text(STORYBOARD, encoding="utf-8")
    out = tmp_path / "film" / "spec.json"
    s2s.main([str(md), "--out", str(out)])
    assert json.loads(out.read_text(encoding="utf-8"))["shots"][0]["id"] == "k01"
    assert out.with_suffix(".srt").exists()


# ---------- spec validation ----------
def test_demo_spec_is_valid():
    assert load(DEMO)["shots"]


@pytest.mark.parametrize("mutate, message", [
    (lambda s: s["shots"][0].update(dur=0), "dur must be a positive"),
    (lambda s: s["shots"][0]["layers"].append({"type": "laser"}), "unknown layer type"),
    (lambda s: s["shots"][1].update(transition="spin-cube"), "transition"),
    (lambda s: s["shots"][2]["layers"][0].update(who="nobody"), "not defined in spec.cast"),
    (lambda s: s["shots"][2]["layers"][0].update(pose="moonwalk"), "pose"),
    (lambda s: s["shots"][1].update(id="k01"), "duplicate id"),
    (lambda s: s.update(width=1280), "width must be 1920"),
])
def test_validate_catches_mistakes(mutate, message):
    spec = copy.deepcopy(json.loads(DEMO.read_text(encoding="utf-8")))
    mutate(spec)
    assert any(message in e for e in validate(spec)), validate(spec)


def test_load_reports_missing_images(tmp_path):
    spec = {"shots": [{"id": "a", "dur": 1, "bg": {"kind": "image", "image": "nope.png"}}]}
    p = tmp_path / "spec.json"
    p.write_text(json.dumps(spec))
    with pytest.raises(SpecError, match="image not found"):
        load(p)


# ---------- render smoke + determinism ----------
playwright = pytest.importorskip("playwright")


def _still(tmp: Path, name: str) -> bytes:
    out = tmp / name
    subprocess.run([sys.executable, str(ROOT / "scripts" / "render.py"), str(DEMO), "--stills", "13.0", "--scale", "0.25", "--out", str(out)],
                   check=True, capture_output=True)
    return next(out.glob("*.png")).read_bytes()


def test_render_is_deterministic(tmp_path):
    a, b = _still(tmp_path, "a"), _still(tmp_path, "b")
    assert len(a) > 5000
    assert hashlib.sha256(a).digest() == hashlib.sha256(b).digest()


# ---------- re-timing and keying ----------
def test_merge_durations_keeps_layers_and_reports_unknown_ids():
    shots = s2s.parse_storyboard(STORYBOARD)
    spec = {"shots": [{"id": "k01", "dur": 9, "layers": [{"type": "title", "text": "X"}]}, {"id": "extra", "dur": 2}]}
    merged, missing = s2s.merge_durations(spec, shots, [4.2, 1.8, 2.5])
    assert merged["shots"][0]["dur"] == 4.2
    assert merged["shots"][0]["layers"] == spec["shots"][0]["layers"]
    assert spec["shots"][0]["dur"] == 9  # input not mutated
    assert missing == ["extra"]


def test_key_green_makes_background_transparent():
    np = pytest.importorskip("numpy")
    Image = pytest.importorskip("PIL.Image")
    import key_green

    img = Image.new("RGB", (40, 40), (0, 255, 0))
    img.paste((200, 30, 40), (10, 10, 30, 30))
    out = key_green.trim(key_green.key(img))
    a = np.asarray(out)[..., 3]
    assert a.min() == 0 and a.max() == 255
    assert out.size[0] < 40  # trimmed to the red square plus padding


# ---------- review regressions ----------
def test_parse_srt_accepts_short_vtt_and_fractions():
    cues = s2s.parse_srt("WEBVTT\n\n00:01.5 --> 00:02.250\nHello world\n")
    assert cues == [(1.5, 2.25, "Hello world")]


def test_align_never_drifts_past_vo_length():
    shots = [{"n": i, "vo": v, "screen": "", "anim": False} for i, v in enumerate(["one", "two", "three"], 1)]
    cues = [(0.0, 0.1, "one two three")]  # absurdly fast VO forces the 0.4 s floor
    durs = s2s.align_durations(shots, cues, tail=0.6)
    assert all(d >= 0.4 - 1e-9 for d in durs)
    assert sum(durs) == pytest.approx(1.2, abs=1e-6)  # 3 × floor, no extra drift beyond what the floor requires


def test_duplicate_shot_numbers_rejected():
    with pytest.raises(ValueError, match="duplicate"):
        s2s.parse_storyboard("**Shot 1**\n- Voiceover: a\n**Shot 1**\n- Voiceover: b")


def test_validator_catches_bad_window_sky_and_bg_type():
    spec = {"shots": [{"id": "a", "dur": 1, "bg": [{"kind": "interior", "windowSky": "noon"}, "sky"]}]}
    errs = validate(spec)
    assert any("windowSky" in e for e in errs) and any("bg must be an object" in e for e in errs)


def _render(args, tmp: Path):
    return subprocess.run([sys.executable, str(ROOT / "scripts" / "render.py"), str(DEMO), *args], capture_output=True, text=True, cwd=tmp)


def _duration(path: Path) -> float:
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)], capture_output=True, text=True, check=True)
    return float(out.stdout)


def test_python_vocabulary_matches_engine(tmp_path):
    import spec as S
    from playwright.sync_api import sync_playwright
    import render as R

    srv = R.serve(set())
    try:
        with sync_playwright() as pw:
            browser, page, _ = R.open_page(pw, json.loads(DEMO.read_text(encoding="utf-8")), srv.server_address[1], 0.25)
            js = page.evaluate("""() => ({layers:Object.keys(TOON.layers), bgs:Object.keys(TOON.bgs), props:Object.keys(TOON.PROPS),
                fx:Object.keys(TOON.FX), tr:Object.keys(TOON.transitions), poses:TOON.BEAN_POSES,
                expr:TOON.BEAN_EXPR, fg:Object.keys(TOON.FG), grades:TOON.GRADES})""")
            browser.close()
    finally:
        srv.shutdown()
    assert set(js["layers"]) == S.KNOWN_LAYERS
    assert set(js["bgs"]) == S.KNOWN_BGS
    assert set(js["props"]) == S.KNOWN_PROPS
    assert set(js["fx"]) == S.KNOWN_FX
    assert set(js["tr"]) | {"cut"} == S.KNOWN_TRANSITIONS
    assert set(js["poses"]) == S.KNOWN_POSES
    assert set(js["expr"]) == S.KNOWN_EXPR
    assert set(js["fg"]) == S.KNOWN_FG
    assert set(js["grades"]) == S.KNOWN_GRADES


def test_odd_scale_and_short_audio_keep_full_length(tmp_path):
    audio = tmp_path / "beep.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", "sine=f=440:d=0.5", str(audio)], check=True)
    out = tmp_path / "clip.mp4"
    r = _render(["--to", "1.0", "--scale", "0.333", "--audio", str(audio), "--out", str(out)], tmp_path)
    assert r.returncode == 0, r.stderr
    assert _duration(out) == pytest.approx(1.0, abs=0.05)


@pytest.mark.parametrize("path", ALL_EXAMPLES, ids=lambda p: p.parent.name)
def test_every_example_is_valid(path):
    assert load(path)["shots"]


def test_every_example_renders_without_page_errors(tmp_path):
    for path in ALL_EXAMPLES:
        spec = json.loads(path.read_text(encoding="utf-8"))
        times, t = [], 0.0
        for shot in spec["shots"]:
            times.append(t + shot["dur"] * 0.6)
            t += shot["dur"]
        out = tmp_path / path.parent.name
        r = subprocess.run([sys.executable, str(ROOT / "scripts" / "render.py"), str(path), "--stills", ",".join(f"{x:.2f}" for x in times),
                            "--scale", "0.25", "--out", str(out)], capture_output=True, text=True)
        assert r.returncode == 0, f"{path.parent.name}: {r.stdout[-800:]} {r.stderr[-800:]}"


# ---------- v2 review regressions ----------
def test_validator_checks_colours_crowd_props_and_city_preset():
    spec = {
        "cast": {"a": {"robe": "red", "hair": "curley"}},
        "shots": [{"id": "s", "dur": 1, "bg": {"kind": "city", "preset": "noon"},
                   "layers": [{"type": "crowd", "who": "a", "hold": "sowrd"},
                              {"type": "bean", "who": "a", "look": {"hold": "laser"}}]}],
    }
    errs = " | ".join(validate(spec))
    for needle in ("robe must be a hex colour", "hair 'curley'", "hold 'sowrd'", "look: hold 'laser'", "sky preset 'noon'"):
        assert needle in errs, errs


def test_short_hex_colours_render(tmp_path):
    spec = {"cast": {"a": {"robe": "#c33", "hairColor": "#420"}},
            "shots": [{"id": "s", "dur": 1, "layers": [{"type": "crowd", "who": "a", "rows": 2, "count": 4}]}]}
    p = tmp_path / "spec.json"
    p.write_text(json.dumps(spec))
    r = subprocess.run([sys.executable, str(ROOT / "scripts" / "render.py"), str(p), "--stills", "0.5", "--scale", "0.25", "--out", str(tmp_path / "o")],
                       capture_output=True, text=True)
    assert r.returncode == 0, r.stdout + r.stderr


def test_extra_labels_parse_another_language_and_fold_diacritics():
    text = "**Plano 1**\n- Narración: «Él llegó.»\n- Pantalla: una sala"
    with pytest.raises(ValueError, match="no shots"):
        s2s.parse_storyboard(text)
    shots = s2s.parse_storyboard(text, {"shot": ["Plano"], "voiceover": ["Narración"], "screen": ["Pantalla"]})
    assert shots[0]["vo"] == "Él llegó." and shots[0]["screen"] == "una sala"
    assert s2s.words("Él llegó") == s2s.words("el llego")
    with pytest.raises(ValueError, match="labels"):
        s2s.parse_storyboard(text, {"title": ["x"]})


def test_repository_text_is_english_only():
    """Docs, code and examples must not contain Cyrillic; localized storyboards go through --labels."""
    cyrillic = re.compile("[\u0400-\u04ff]")
    suffixes = {".md", ".py", ".js", ".html", ".json", ".yml", ".txt"}
    hits = [str(p.relative_to(ROOT)) for p in ROOT.rglob("*")
            if p.is_file() and p.suffix in suffixes and ".git" not in p.parts
            and cyrillic.search(p.read_text(encoding="utf-8", errors="ignore"))]
    assert hits == [], hits
