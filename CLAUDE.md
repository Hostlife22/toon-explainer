# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

toon-explainer is an agent skill (`SKILL.md`) plus a deterministic HTML Canvas engine that turns a narrated storyboard into a cutout-cartoon explainer video: **script → JSON spec → Canvas render in headless Chromium → MP4**. There is no package.json or build step. The engine is plain browser JS, and the tooling is standard-library Python run through `uv`. `SKILL.md` contains the agent-facing production rules and task routing. Read it before you author or change a film spec; `references/09-directing.md` is the planning method and `references/10-technique-library.md` the technique catalog from the reference study.

## Commands

Requirements: `uv`, FFmpeg, Node.js (only for `check_repository.py`) and Chromium for Playwright (`uv run --with playwright playwright install chromium`).

```sh
# CI source checks: node --check on JS, Python AST, JSON parsing, local Markdown links/anchors
python scripts/check_repository.py

# Full test suite (pipeline, determinism, smoke render of every example, release packaging)
uv run --with pytest --with playwright --with pillow --with numpy pytest tests -q
# Single test
uv run --with pytest --with playwright --with pillow --with numpy pytest tests/test_pipeline.py::test_render_is_deterministic -q

# Validate a spec
python3 scripts/spec.py examples/showcase/spec.json

# Render: interactive preview / contact sheet / stills / video
uv run --with playwright python scripts/render.py examples/showcase/spec.json --serve
uv run --with playwright python scripts/render.py examples/showcase/spec.json --sheet renders/sheet.jpg --scale 0.5
uv run --with playwright python scripts/render.py examples/character_sheet/spec.json --stills 0.5,1.5 --out renders/review
uv run --with playwright python scripts/render.py examples/showcase/spec.json --shot s02_forest_march --scale 0.25 --out renders/forest.mp4

# Storyboard → spec skeleton + SRT; re-time an existing spec to a real voiceover
python3 scripts/script2spec.py film/script.md --out film/spec.json
python3 scripts/script2spec.py film/script.md --srt vo.srt --merge film/spec.json

# Release archives (reads committed files only, not the working tree)
python scripts/build_release.py --ref HEAD --out dist
```

`renders/` and `dist/` are output directories. Don't commit rendered video or audio.

## Architecture

**Engine (`scripts/engine/`).** `index.html` loads `core.js`, then every `lib/<domain>/*.js` file through ordered `<script>` tags. Each module adds itself to the global `window.TOON` (aliased `T`). There are no imports or bundler, so a new module only loads once you add its `<script>` tag to `index.html`, after the modules it depends on. `core.js` owns the math and easing helpers, seeded randomness (`T.hash`, `T.rng`, `T.noise`), the timeline, the camera, layer motion and enter animations, transitions, and `T.drawShot`/render-frame. Everything else plugs into registries:
- `T.layers[type]` and `T.bgs[kind]`, with signature `draw(ctx, L, lt, env)`, where `lt` is the shot-local time and `env` carries `dpr`, `seed`, `spec`, `cast`, `style` and `cam`.
- `T.PROPS`, `T.FX`, `T.FG`, `T.transitions`, `T.HEADWEAR`, the pose table in `lib/characters/rig.js`, and per-module registries such as `TOON.VEHICLES`.
- `lib/` is split by domain: `base/` (paint, helpers, text, widgets), `characters/`, `acting/`, `creatures/`, `props/`, `places/`, `maps/`, `paper/`, `game/`, `fx/`, `lens/`. Several files can fill the same registry (for example every `places/*.js` adds to `T.bgs`).
- Core registries that modules plug into: `T.LAYER_MODS` (per-layer modifiers such as `blur`, `material`), `T.ENTERS`/`T.ENTER_DUR`, `T.POSES`, `T.BUILDS`, `T.EXPR` and the face/hair/beard kind registries, `T.GRADE_PRESETS`/`T.GRADE_PIXEL`, `T.MAP_VIEWS`/`T.MAP_REGION_HOOKS`/`T.MAP_OVERLAY_ORDER`, `T.HUD_DEFAULT`. Core also provides `swap`, `jitter`, `swing`, shot `focus`, film `overlays`, `T.subShot` and `T.film`.

All drawing happens in a fixed 1920×1080 logical space (the world). `--scale` only changes the physical canvas. `"format": "vertical"` renders 1080×1920 by drawing each shot in the world, shifting it so the shot's `frame` x is centred, and cropping a 607.5-wide strip (`T.init` in `core.js`); code that anchors to frame edges must use `T.visibleSpan(env)` instead of `0..T.W`, and shot `pinned` layers are drawn without the camera by `T.drawPinned`.

**Python pipeline (`scripts/`).**
- `spec.py` loads and validates specs. It mirrors the engine vocabulary in `KNOWN_*` sets, and every `scripts/vocab/*.json` file is merged into those sets at import. Vocab files may also declare `kinds` (allowed `kind` values per layer type) and `registry` (`{"vehicle": "TOON.VEHICLES"}`). A test opens the engine in Chromium and asserts that each declared registry's keys exactly match the vocab `kinds`.
- `render.py` runs a local HTTP server (serving only the engine and the spec's referenced images), drives Chromium through Playwright, steps frames and pipes them to FFmpeg. `--workers` splits frame ranges across processes and concatenates the chunks. It also produces stills, contact sheets and audio muxing.
- `script2spec.py` parses storyboard blocks (`Shot N / Voiceover / On screen`; `--labels` handles other languages), estimates durations from words per minute, writes an SRT, and `--merge` re-times shots by id without touching their layers.

**Specs (`examples/*/spec.json`).** Top level: `seed`, `cast` (recurring characters, referenced with `who`) and `shots[]`. Each shot has `id`, `dur`, `transition`, `grade`, `bg`, `camera` and `layers[]`. Animatable fields take a constant or a `[{at, v}]` timeline. The full field reference is in `references/03-spec-reference.md`.

## Invariants that tests enforce

- **Determinism.** Never use `Math.random`, `Date` or the clock in the engine. Seed every random choice with `T.rng(T.hash(...))` or `T.noise`. Tests check that two renders are byte-identical and that frames don't depend on render order.
- Path callbacks passed to `T.outlined` run twice (fill, then stroke), so they must not consume RNG values.
- **English only.** A test fails on any Cyrillic in `.md/.py/.js/.html/.json/.yml/.txt` files. Localized storyboards go through `--labels`.
- Every example must validate and render without page errors.

## Adding a layer, background, prop, effect or similar

1. Register the draw function in the matching `T.*` registry, and add a `<script>` tag to `index.html` if it's a new file.
2. Add the new names to the module's `scripts/vocab/<module>.json`. Prefer this over editing `KNOWN_*` in `spec.py`; CONTRIBUTING.md still describes the older approach. For a new registry, add `kinds` and `registry` entries so the parity test covers it.
3. Document the fields in the toolkit card of their domain (`references/toolkits/`, catalog in `references/08-toolkits.md`); core fields go in `references/03-spec-reference.md`. `scripts/check_repository.py` fails if a vocabulary name is documented nowhere. Add a shot recipe to `references/02-visual-grammar.md` if the change enables a new kind of shot.
4. Review a still or a contact sheet visually, not just the tests. Add a `CHANGELOG.md` entry for user-visible changes.

If code and docs disagree, trust the code and fix the docs.

## Style constraints

Keep the reference look: dark-brown ink outlines, one flat shadow tone per color, three-quarter views by default, and hold-and-snap posing (`references/01-reference-breakdown.md`). Don't copy designs or likenesses from real channels, films or people, and don't add extremist symbols. Use ASCII file names.
