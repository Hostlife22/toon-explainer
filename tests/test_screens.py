"""Messenger, tier-board, ECG and narrated bar-growth contracts."""
from __future__ import annotations

import copy
import json
import subprocess
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from spec import LAYER_KINDS, validate  # noqa: E402


def film(layer, **extra):
    return {
        "seed": 7, "cast": {"hero": {"robe": "#365865"}}, **extra,
        "shots": [{"id": "screen", "dur": 8, "bg": {"kind": "flat", "color": "#ddd3be"},
                   "camera": {"zoom": [1, 1]}, "layers": [layer]}],
    }


CHAT = {"type": "doc", "kind": "chat", "title": "THE PLAN", "scale": 0.85,
        "messages": [{"from": "Alex", "text": "Everyone ready?", "at": 1, "side": "left", "who": "hero"},
                     {"from": "Sam", "text": "I invited the boss.", "at": 2.5, "side": "right", "color": "#bce3cb"}]}
TIER = {"type": "doc", "kind": "tierlist",
        "items": [{"row": "S", "prop": "coin", "text": "SAVE", "at": 1},
                  {"row": 4, "text": "SPEND", "at": 2}], "mark": {"row": "S", "at": 3}}
ECG = {"type": "hud", "kind": "ecg", "bpm": [{"at": 0, "v": 70}, {"at": 2, "v": 110}], "flatAt": 3}
BAR = {"type": "doc", "kind": "chart", "chart": "bar", "values": [10, 10, 10],
       "grow": {"i": 1, "from": 2, "to": 10, "at": 2, "dur": 2}}


@pytest.mark.parametrize("layer", [CHAT, TIER, ECG, BAR], ids=["chat", "tierlist", "ecg", "grow"])
def test_screen_specs_validate(layer):
    assert validate(film(layer)) == []


def test_screen_vocabulary_and_invalid_nested_cast():
    vocab = json.loads((ROOT / "scripts/vocab/screens.json").read_text())
    assert set(vocab["kinds"]["doc"]) == {"chat", "tierlist"}
    assert set(vocab["kinds"]["hud"]) == {"ecg"}
    for layer, kinds in vocab["kinds"].items():
        assert set(kinds) <= LAYER_KINDS[layer]
        errors = validate(film({"type": layer, "kind": "unknown-screen"}))
        assert any("unknown-screen" in error for error in errors)
    bad = copy.deepcopy(CHAT)
    bad["messages"][0]["who"] = "missing"
    assert any("missing" in error for error in validate(film(bad)))


@pytest.fixture
def page():
    from playwright.sync_api import sync_playwright
    import render as R

    srv = R.serve(set())
    try:
        with sync_playwright() as pw:
            browser, page, errors = R.open_page(pw, film({"type": "doc", "kind": "chat"}), srv.server_address[1], 0.25)
            try:
                yield page
                assert errors == [], errors
            finally:
                browser.close()
    finally:
        srv.shutdown()


# Use real Canvas drawing, recording text positions, bar paths, and trace segments.
# Offscreen rendering avoids film grain and camera motion masking timing assertions.
DRAW = """([L, t, frameX]) => {
  const T = TOON, c = document.createElement('canvas'); c.width = 1920; c.height = 1080;
  const ctx = c.getContext('2d'), texts = [], rects = [], segments = [], strokes = [];
  const env = {dpr: 1, seed: 7, cast: {hero: {robe: '#365865'}}, style: {}, spec: window.FILM_SPEC};
  const strip = T.STRIP_W;
  if (frameX != null) { env.frameX = frameX; T.STRIP_W = 607.5; }
  const text0 = ctx.fillText.bind(ctx), rect0 = ctx.rect.bind(ctx);
  const line0 = ctx.lineTo.bind(ctx), stroke0 = ctx.stroke.bind(ctx);
  ctx.fillText = (s,x,y,...a) => { const p = new DOMPoint(x,y).matrixTransform(ctx.getTransform());
    texts.push({text:String(s),x:p.x,y:p.y,color:ctx.fillStyle}); text0(s,x,y,...a); };
  ctx.rect = (x,y,w,h) => { rects.push([x,y,w,h]); rect0(x,y,w,h); };
  ctx.lineTo = (x,y) => { segments.push([x,y]); line0(x,y); };
  ctx.stroke = (...a) => { strokes.push(ctx.strokeStyle); stroke0(...a); };
  ctx.translate((L.x ?? 0.5) * 1920, (L.y ?? 0.5) * 1080); ctx.scale(L.scale ?? 1, L.scale ?? 1);
  try { (L.type === 'hud' ? T.HUD_KINDS : T.DOCS)[L.kind](ctx,L,t,env); }
  finally { T.STRIP_W = strip; }
  return {texts,rects,segments,strokes,png:c.toDataURL()};
}"""


def draw(page, layer, t, frame_x=None):
    return page.evaluate(DRAW, [layer, t, frame_x])


def test_chat_typing_arrivals_wrap_scroll_and_seek(page):
    layer = {"type": "doc", "kind": "chat", "h": 400, "messages": [
        {"from": "A", "text": "First line", "at": 1},
        {"from": "B", "text": "Last line", "at": 3, "side": "right"}]}
    before, typing, arrived = [draw(page, layer, t) for t in (0.3, 0.5, 1.2)]
    assert before["png"] != typing["png"] != arrived["png"]
    assert "First line" not in [v["text"] for v in typing["texts"]]
    first = next(v for v in arrived["texts"] if v["text"] == "First line")
    final = draw(page, layer, 3.2)
    shifted = next(v for v in final["texts"] if v["text"] == "First line")
    last = next(v for v in final["texts"] if v["text"] == "Last line")
    assert shifted["y"] < first["y"] < last["y"]
    assert last["x"] > shifted["x"]
    assert draw(page, layer, 1.2)["png"] == arrived["png"]
    no_typing = {**layer, "typing": False}
    assert draw(page, no_typing, 0.3)["png"] == draw(page, no_typing, 0.8)["png"]
    long = {**layer, "messages": [{"from": "A", "at": 0, "text": "longword" * 20 + "\nEND"}]}
    lines = draw(page, long, 1)["texts"]
    assert len(lines) > 4 and any(v["text"] == "END" for v in lines)


def test_tier_arrival_order_custom_rows_and_mark(page):
    layer = {"type": "doc", "kind": "tierlist", "rows": [{"label": "BEST", "color": "#eecc88"}],
             "items": [{"row": "BEST", "text": "LATE", "prop": "sword", "at": 2},
                       {"row": 0, "text": "EARLY", "at": 1}]}
    early = draw(page, layer, 1.2)
    assert "EARLY" in [v["text"] for v in early["texts"]]
    assert "LATE" not in [v["text"] for v in early["texts"]]
    full = draw(page, layer, 2.2)
    positions = {v["text"]: v["x"] for v in full["texts"]}
    assert positions["EARLY"] < positions["LATE"]
    marked = {**layer, "mark": {"row": "BEST", "at": 3}}
    assert draw(page, marked, 2.9)["png"] == full["png"]
    assert draw(page, marked, 3.1)["png"] != full["png"]
    assert draw(page, layer, 1.2)["png"] == early["png"]


def test_ecg_countdown_flatline_determinism_and_anchor(page):
    active, countdown, flat = [draw(page, ECG, t) for t in (2.2, 2.7, 3)]
    assert "110 BPM" in [v["text"] for v in active["texts"]]
    assert "55 BPM" in [v["text"] for v in countdown["texts"]]
    assert "0 BPM" in [v["text"] for v in flat["texts"]]
    assert "FLAT" in [v["text"] for v in flat["texts"]]
    assert flat["strokes"][-1] == "#ef514d"
    assert len({p[1] for p in flat["segments"][-329:]}) == 1
    assert len({p[1] for p in active["segments"][-329:]}) > 5
    assert draw(page, ECG, 2.2)["png"] == active["png"]
    assert draw(page, {**ECG, "grid": False}, 2.2)["png"] != active["png"]
    # A panned vertical frame is narrower than the default monitor: fit and anchor within it.
    x = 1250
    vertical = draw(page, ECG, 2.2, x)
    number = next(v for v in vertical["texts"] if v["text"] == "110 BPM")
    assert x < number["x"] < x + 607.5 / 2
    assert number["y"] > 800
    smaller = draw(page, {**ECG, "scale": 0.5}, 2.2, x)
    smaller_number = next(v for v in smaller["texts"] if v["text"] == "110 BPM")
    assert number["x"] < smaller_number["x"] < x + 607.5 / 2
    assert smaller_number["y"] > number["y"]
    explicit = {**ECG, "x": 0.5, "y": 0.5}
    assert draw(page, explicit, 2.2, x)["texts"] == draw(page, explicit, 2.2)["texts"]


def test_only_selected_bar_grows_linearly_and_holds(page):
    def heights(layer, t):
        # T.outlined builds each bar twice (fill and stroke).
        return [r[3] for r in draw(page, layer, t)["rects"]][::2]

    samples = [heights(BAR, t) for t in (1.8, 2, 2.5, 3, 3.5, 4, 5)]
    assert all(len(s) == 3 for s in samples)
    assert samples[0] == samples[1] and samples[-1] == samples[-2]
    assert len({s[0] for s in samples}) == 1 and len({s[2] for s in samples}) == 1
    increments = [samples[i + 1][1] - samples[i][1] for i in range(1, 5)]
    assert increments == pytest.approx([increments[0]] * 4)
    ordinary = {k: v for k, v in BAR.items() if k != "grow"}
    assert heights(ordinary, 2) == pytest.approx([samples[-1][1]] * 3)
    assert len(heights(ordinary, 0.4)) == 1  # Original staggered entrance survives.
    line = {**ordinary, "chart": "line"}
    assert draw(page, line, 2)["png"] == draw(page, {**line, "grow": BAR["grow"]}, 2)["png"]


@pytest.mark.parametrize("layer", [CHAT, TIER, ECG, BAR], ids=["chat", "tierlist", "ecg", "grow"])
def test_screens_render_without_page_errors(tmp_path, layer):
    spec = film(layer, format="vertical") if layer["kind"] in {"chat", "ecg"} else film(layer)
    path = tmp_path / "spec.json"
    path.write_text(json.dumps(spec))
    out = tmp_path / "stills"
    result = subprocess.run(
        [sys.executable, str(ROOT / "scripts/render.py"), str(path), "--stills", "0.3,0.6,1.2,2.7,3.5,5",
         "--scale", "0.25", "--out", str(out)], capture_output=True, text=True,
    )
    assert result.returncode == 0, result.stdout + result.stderr
    assert "[pageerror]" not in result.stdout and "[pageerror]" not in result.stderr
    assert len(list(out.glob("*.png"))) == 6
