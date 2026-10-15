# Contributing to toon-explainer

Contributions are welcome: new layer types, props and effects, better character drawing, new shot recipes, clearer documentation, rendering fixes and accessibility improvements. Keep changes focused and include enough context for another person to reproduce and review them.

## Before you start

Check the [open issues](https://github.com/Hostlife22/toon-explainer/issues) for related work. For a substantial new feature, dependency or change to the shared engine, open an issue describing the problem and proposed approach first. Small fixes can go straight to a pull request.

Report security vulnerabilities through [SECURITY.md](SECURITY.md). For accessibility issues, follow [ACCESSIBILITY.md](ACCESSIBILITY.md).

## Local setup

Fork the repository, clone your fork and create a branch for your change. Install [uv](https://docs.astral.sh/uv/), FFmpeg and the browser used by the renderer:

```sh
uv run --with playwright playwright install chromium
uv run --with playwright python scripts/render.py examples/showcase/spec.json --serve
```

The preview prints a local URL. Space plays and pauses, the arrow keys step one frame, and the slider scrubs the film.

## Project conventions

- Write documentation, comments and visible captions in English. Example films may use any language for on-screen text; the bundled font covers Latin and Cyrillic. Use ASCII names for new files and directories.
- Draw in the fixed 1920×1080 logical space. Seed every random choice with `T.rng(T.hash(...))` or `T.noise`, so the same timestamp always produces the same frame. Never call `Math.random` or read the clock.
- Path functions passed to `T.outlined` run twice (fill and stroke), so they must not consume random numbers.
- Keep the reference look consistent: dark-brown ink outlines, one flat shadow tone per color, three-quarter views by default and hold-and-snap posing. See [references/01-reference-breakdown.md](references/01-reference-breakdown.md).
- Do not add designs, likenesses or material copied from a real channel, film or person. Include sources, licenses and generation prompts for any added asset.
- Keep credentials, private media and rendered video/audio out of pull requests. Commit showcase images only when they document the change.
- Follow the [accessibility contribution guidance](ACCESSIBILITY.md#contribution-guidance) for controls, captions, motion and text contrast.

## Adding a layer, prop, effect or background

Register the drawing function in the relevant registry: `T.layers`, `T.PROPS`, `T.FX`, `T.FG`, `T.bgs` or the pose table in `scripts/engine/lib/characters/rig.js`. Add the new name to the matching `KNOWN_*` set in `scripts/spec.py`; a test compares both vocabularies. Document every field in [references/03-spec-reference.md](references/03-spec-reference.md) and add a recipe to [references/02-visual-grammar.md](references/02-visual-grammar.md) when it enables a new kind of shot.

Design and inspect a still before animating. Use an example spec and a contact sheet:

```sh
uv run --with playwright python scripts/render.py examples/character_sheet/spec.json --stills 0.5,1.5,2.5,3.5 --out renders/review
uv run --with playwright python scripts/render.py examples/showcase/spec.json --sheet renders/review/sheet.jpg
```

## Validate your change

Run the source, JSON and local-link checks used by CI:

```sh
python scripts/check_repository.py
```

This check requires Node.js. Then run the tests, which include determinism checks and a smoke render of every example:

```sh
uv run --with pytest --with playwright --with pillow --with numpy pytest tests -q
git diff --check
```

Inspect the film as well as the tests. Check identity, movement, text readability, framing, occlusion and transitions. Explain intentional flicker in your pull request.

## Submit a pull request

Describe the concrete problem, the resulting behavior and how you verified it. Include a before/after frame or short clip for visual changes. Update affected guides, examples and showcase assets, and add a changelog entry for a user-visible change. Every picture in `assets/` is listed in `assets/media.json`; after an engine change that alters how an example looks, rebuild the affected pictures with `uv run --with playwright --with pillow python scripts/make_media.py <name>` (a word from the output path), and add a manifest entry for any new README picture.

Contribute only material you can submit under the project's [MIT license](LICENSE), with any separately licensed assets clearly identified. Review feedback should be specific, respectful and focused on the work.

## Releases

The [CI and release workflow](.github/workflows/release.yml) runs on pull requests, pushes to `main` and all pushed tags. A tag creates a GitHub Release only after validation, tests, smoke rendering and packaging succeed.

After merging the release changes and updating your checkout, create and push a tag:

```sh
git tag -a v1.0.0 -m "toon-explainer v1.0.0"
git push origin v1.0.0
```

Use your next version number. Tags such as `v1.0.0-rc.1` are marked as prereleases. Release assets are `toon-explainer.zip`, `toon-explainer.tar.gz` and `SHA256SUMS`, built from the tagged commit; each archive contains a `toon-explainer/` directory with the skill, documentation, engine, examples and tracked assets. Rendered MP4s are not part of releases.

To check packaging locally, commit your release files first, then run:

```sh
python scripts/build_release.py --ref HEAD --out dist
```

The packager reads committed files rather than uncommitted edits.
