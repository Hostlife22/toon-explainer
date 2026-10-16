#!/usr/bin/env python3
"""Render a toon-explainer film spec to MP4 (or stills / a contact sheet) with headless Chromium.

  uv run --with playwright python scripts/render.py film/spec.json --out film/out.mp4 [--audio film/vo.mp3]
  uv run --with playwright python scripts/render.py film/spec.json --sheet film/sheet.jpg        # one still per shot
  uv run --with playwright python scripts/render.py film/spec.json --stills 1.5,4.2 --out film/stills
  uv run --with playwright python scripts/render.py film/spec.json --shot k07 --out k07.mp4     # one shot only
  uv run --with playwright python scripts/render.py film/spec.json --serve                       # browser preview
  Options: --scale 0.5 (fast preview), --fps 30, --workers 4 (parallel chunks), --from/--to seconds, --crf 18.

The page is scripts/engine/index.html. Images in the spec are resolved relative to the spec file and served read-only.
Page errors (bad layer, missing glyph, failed image) give a non-zero exit code and the partial video is deleted.
"""
from __future__ import annotations

import argparse
import base64
import functools
import http.server
import json
import shutil
import socketserver
import subprocess
import sys
import tempfile
import threading
import time
import urllib.parse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from spec import SpecError, image_refs, load  # noqa: E402
from spec_characters import check_lipsync  # noqa: E402

ENGINE = Path(__file__).parent / "engine"


def parse_args(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("spec")
    ap.add_argument("--out")
    ap.add_argument("--audio")
    ap.add_argument("--fps", type=int)
    ap.add_argument("--from", dest="t0", type=float, default=0.0)
    ap.add_argument("--to", dest="t1", type=float)
    ap.add_argument("--shot", help="render only these shot ids (comma separated, consecutive)")
    ap.add_argument("--stills", help="comma separated global times → PNGs in --out directory")
    ap.add_argument("--sheet", help="contact sheet JPG with one labeled still per shot")
    ap.add_argument("--sheet-at", type=float, default=0.75, help="where inside each shot to sample (0..1)")
    ap.add_argument("--scale", type=float, default=1.0, help="render scale (0.5 = 960x540 preview)")
    ap.add_argument("--crf", type=int, default=18)
    ap.add_argument("--workers", type=int, default=1)
    ap.add_argument("--serve", action="store_true", help="serve an interactive preview (space = play, arrows = step)")
    ap.add_argument("--port", type=int, default=8765)
    ap.add_argument("--frames", help=argparse.SUPPRESS)  # internal: "n0:n1" for worker chunks
    return ap.parse_args(argv)


def inline_lipsync(spec_path: Path, lip: dict) -> dict:
    """Replace lipsync.src (an envelope written by scripts/lipsync.py) with its levels and fps."""
    f = (spec_path.parent / lip["src"]).resolve()
    try:
        env = json.loads(f.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise SystemExit(f"lipsync envelope {lip['src']!r} could not be read: {exc}") from exc
    if not isinstance(env, dict) or not isinstance(env.get("levels"), str):
        raise SystemExit(f"lipsync envelope {lip['src']!r} has no levels string (make it with scripts/lipsync.py)")
    out = {k: v for k, v in lip.items() if k != "src"}
    out["levels"] = env["levels"]
    out.setdefault("fps", env.get("fps", 30))
    errors: list[str] = []
    check_lipsync(out, f"lipsync envelope {lip['src']!r}", errors)
    if errors:
        raise SystemExit("\n".join(errors))
    return out


def prepare_spec(spec_path: Path, spec: dict) -> tuple[dict, set[str]]:
    """Rewrite local image paths to /__file__/<abs> URLs and return the allow-list for the server."""
    allowed: set[str] = set()
    mapping = {}
    for ref in image_refs(spec):
        if ref.startswith(("data:", "http:", "https:")):
            continue
        f = str((spec_path.parent / ref).resolve())
        allowed.add(f)
        mapping[ref] = "/__file__/" + urllib.parse.quote(f)

    def walk(v, key=""):
        if isinstance(v, list):
            return [walk(x, key) for x in v]
        if isinstance(v, dict):
            if key == "lipsync" and isinstance(v.get("src"), str):
                return inline_lipsync(spec_path, v)
            return {k: walk(x, k) for k, x in v.items()}
        if isinstance(v, str) and key in ("src", "image", "idle", "talk", "blink"):
            return mapping.get(v, v)
        return v

    return walk(spec), allowed


def serve(allowed: set[str], spec: dict | None = None, port: int = 0):
    payload = json.dumps(spec, ensure_ascii=False).encode() if spec is not None else None

    class Handler(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *args):
            pass

        def do_GET(self):
            if payload is not None and self.path.split("?")[0] == "/__spec__.json":
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(payload)))
                self.end_headers()
                self.wfile.write(payload)
                return
            super().do_GET()

        def translate_path(self, path):
            if path.startswith("/__file__/"):
                f = urllib.parse.unquote(path[len("/__file__/"):].split("?")[0])
                return f if f in allowed else "/nonexistent"
            return super().translate_path(path)

    srv = socketserver.ThreadingTCPServer(("127.0.0.1", port), functools.partial(Handler, directory=str(ENGINE)))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv


GRAB = """async ([t, label]) => {
  window.renderFrame(t);
  if (label) { const c = window.__canvas.getContext('2d'); c.save(); c.setTransform(1,0,0,1,0,0);
    c.fillStyle='rgba(0,0,0,.7)'; c.fillRect(0,0,c.canvas.width*0.36,c.canvas.height*0.08);
    c.fillStyle='#ffe066'; c.font=Math.round(c.canvas.height*0.05)+'px sans-serif'; c.fillText(label, c.canvas.width*0.01, c.canvas.height*0.06); c.restore(); }
  return window.__canvas.toDataURL('image/png').split(',')[1];
}"""


def open_page(pw, spec: dict, port: int, scale: float):
    browser = pw.chromium.launch(args=["--disable-web-security", "--ignore-gpu-blocklist"])
    w, h = (1080, 1920) if spec.get("format") == "vertical" else (1920, 1080)
    page = browser.new_page(viewport={"width": int(w * scale), "height": int(h * scale) + 80})
    errors: list[str] = []
    page.on("console", lambda m: (print("[page]", m.text), errors.append(m.text)) if m.type == "error" else None)
    page.on("pageerror", lambda e: (print("[pageerror]", e), errors.append(str(e))))
    page.on("requestfailed", lambda r: (print("[requestfailed]", r.url), errors.append("request failed: " + r.url)))
    page.add_init_script("window.FILM_SPEC = " + json.dumps(spec, ensure_ascii=False) + ";")
    page.goto(f"http://127.0.0.1:{port}/index.html?render=1&scale={scale}")
    page.wait_for_function("window.__ready === true || !!window.__bootFailed", timeout=120000)
    failed = page.evaluate("window.__bootFailed || null")
    if failed:
        browser.close()
        raise SystemExit("❌ engine failed to boot:\n" + failed)
    return browser, page, errors


def shot_range(shots: list[dict], ids: str) -> tuple[float, float]:
    wanted = [s.strip() for s in ids.split(",") if s.strip()]
    hit = [s for s in shots if s["id"] in wanted]
    if len(hit) != len(wanted):
        missing = set(wanted) - {s["id"] for s in hit}
        raise SystemExit(f"❌ unknown shot id(s): {', '.join(sorted(missing))}")
    return min(s["start"] for s in hit), max(s["start"] + s["dur"] for s in hit)


def encode_cmd(fps: int, crf: int, out: str) -> list[str]:
    return ["ffmpeg", "-y", "-v", "error", "-f", "image2pipe", "-framerate", str(fps), "-c:v", "png", "-i", "-",
            "-c:v", "libx264", "-preset", "medium", "-crf", str(crf), "-pix_fmt", "yuv420p", "-movflags", "+faststart", out]


def render_frames(page, fps: int, n0: int, n1: int, out: str, crf: int) -> None:
    ff = subprocess.Popen(encode_cmd(fps, crf, out), stdin=subprocess.PIPE)
    start = time.time()
    try:
        for i in range(n0, n1):
            ff.stdin.write(base64.b64decode(page.evaluate(GRAB, [i / fps, None])))
            if (i - n0) % (fps * 5) == 0:
                done = i - n0
                eta = (time.time() - start) / max(1, done) * (n1 - i)
                print(f"  frame {i}/{n1}  eta {eta:.0f}s", flush=True)
    finally:
        ff.stdin.close()
        if ff.wait() != 0:
            raise SystemExit("❌ ffmpeg encoding failed")


def run_workers(args, fps: int, n0: int, n1: int) -> None:
    """Split [n0, n1) into chunks rendered by child processes, then concat losslessly."""
    tmp = Path(tempfile.mkdtemp(prefix="toon_parts_"))
    chunk = -(-(n1 - n0) // args.workers)
    procs, parts = [], []
    for k in range(args.workers):
        a, b = n0 + k * chunk, min(n1, n0 + (k + 1) * chunk)
        if a >= b:
            break
        part = tmp / f"part{k:02d}.mp4"
        parts.append(part)
        cmd = [sys.executable, __file__, args.spec, "--out", str(part), "--frames", f"{a}:{b}",
               "--fps", str(fps), "--scale", str(args.scale), "--crf", str(args.crf)]
        procs.append(subprocess.Popen(cmd))
    try:
        codes = [p.wait() for p in procs]  # wait for every worker, no orphans
        if any(codes) or not parts:
            raise SystemExit(f"❌ render worker(s) failed: exit codes {codes}")
        lst = tmp / "list.txt"
        lst.write_text("".join(f"file '{p}'\n" for p in parts))
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", args._video_out], check=True)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def mux_audio(video: str, audio: str, t0: float, dur: float, out: str) -> None:
    # Pad audio with silence and cut at the video length: a VO shorter than the film must not truncate the picture.
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", video, "-ss", str(t0), "-i", audio,
                    "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-af", "apad", "-c:a", "aac", "-b:a", "192k", "-t", f"{dur:.3f}", out], check=True)


def main(argv=None) -> None:
    args = parse_args(argv)
    spec_path = Path(args.spec).resolve()
    try:
        spec = load(spec_path)
    except SpecError as err:
        raise SystemExit(f"❌ {err}")
    fps = args.fps or spec.get("fps", 30)
    page_spec, allowed = prepare_spec(spec_path, spec)
    if args.serve:
        srv = serve(allowed, page_spec, args.port)
        print(f"preview → http://127.0.0.1:{srv.server_address[1]}/index.html?spec=/__spec__.json&scale=0.5   (Ctrl+C to stop)")
        try:
            threading.Event().wait()
        except KeyboardInterrupt:
            srv.shutdown()
        return
    srv = serve(allowed)
    from playwright.sync_api import sync_playwright

    with sync_playwright() as pw:
        browser, page, errors = open_page(pw, page_spec, srv.server_address[1], args.scale)
        total = page.evaluate("window.__total")
        shots = page.evaluate("window.__shots")
        if args.sheet:
            tmp = Path(tempfile.mkdtemp(prefix="toon_sheet_"))
            for i, s in enumerate(shots):
                t = s["start"] + s["dur"] * args.sheet_at
                (tmp / f"{i:04d}.png").write_bytes(base64.b64decode(page.evaluate(GRAB, [t, f"{s['id']} @{t:.1f}s"])))
            cols = 4 if len(shots) > 6 else 3
            rows = -(-len(shots) // cols)
            Path(args.sheet).parent.mkdir(parents=True, exist_ok=True)
            subprocess.run(["ffmpeg", "-y", "-v", "error", "-pattern_type", "glob", "-i", str(tmp / "*.png"),
                            "-vf", f"scale={270 if spec.get('format') == 'vertical' else 480}:-2,tile={cols}x{rows}:padding=4:color=black", "-frames:v", "1", "-q:v", "3", args.sheet], check=True)
            shutil.rmtree(tmp, ignore_errors=True)
            print("sheet ->", args.sheet)
        elif args.stills:
            out = Path(args.out or "stills")
            out.mkdir(parents=True, exist_ok=True)
            for s in args.stills.split(","):
                (out / f"t{float(s):07.2f}.png").write_bytes(base64.b64decode(page.evaluate(GRAB, [float(s), None])))
            print("stills ->", out)
        else:
            if not args.out:
                raise SystemExit("❌ --out is required for video")
            if args.frames:
                n0, n1 = map(int, args.frames.split(":"))
            else:
                t0, t1 = shot_range(shots, args.shot) if args.shot else (args.t0, args.t1 if args.t1 is not None else total)
                n0, n1 = round(t0 * fps), round(min(t1, total) * fps)
            Path(args.out).parent.mkdir(parents=True, exist_ok=True)
            args._video_out = args.out if not args.audio else args.out + ".noaudio.mp4"
            print(f"render {n1 - n0} frames @ {fps}fps scale {args.scale} → {args.out}")
            if n1 <= n0:
                raise SystemExit("❌ empty frame range")
            try:
                if args.workers > 1 and not args.frames:
                    browser.close()
                    run_workers(args, fps, n0, n1)
                else:
                    render_frames(page, fps, n0, n1, args._video_out, args.crf)
                if errors:
                    raise SystemExit(f"❌ {len(errors)} page error(s), see [page]/[pageerror] above")
                if args.audio:
                    mux_audio(args._video_out, args.audio, n0 / fps, (n1 - n0) / fps, args.out)
                    Path(args._video_out).unlink()
            except BaseException:
                for f in {args._video_out, args.out}:  # never leave a partial film behind
                    Path(f).unlink(missing_ok=True)
                raise
            print("done ->", args.out)
        try:
            browser.close()
        except Exception:  # already closed in worker mode
            pass
    srv.shutdown()
    if errors:
        raise SystemExit(f"❌ {len(errors)} page error(s), see [page]/[pageerror] above")


if __name__ == "__main__":
    main()
