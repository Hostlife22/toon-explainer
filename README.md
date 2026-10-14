# toon-explainer

Turn a narrated script into a cutout-cartoon explainer video with a coding agent. toon-explainer is a skill and a portable HTML Canvas engine for the look of history and science YouTube channels: bean-head characters in three-quarter view, painted skies, foreground framing, bold outlined lettering, maps, crowds, fire, rain and punch zooms.

**Script → JSON spec → deterministic Canvas render → MP4**

<img src="assets/showcase/hero.png" alt="Rendered toon-explainer frames: a king on a sunset balcony, legionaries marching through a rainy forest, an emperor in a palace seen over a soldier's shoulder, a cheering town, a city on fire and a fallen soldier after battle" width="100%" />

[Quick start](#quick-start) · [Showcase](#showcase) · [What the engine draws](#what-the-engine-draws) · [From script to film](#from-script-to-film) · [Documentation](#documentation)

## Quick start

### Use with your coding agent

Install the skill:

```sh
npx skills add Hostlife22/toon-explainer
```

Give your agent a storyboard and a brief:

> Use toon-explainer to animate this script. Cold, investigative tone, 3/4-view characters, a foreground plane in every shot. Render a contact sheet first.

The [skill](SKILL.md) turns each storyboard shot into a spec shot, picks a shot recipe for every line, renders a contact sheet for review and then the film. It also re-times the film to a recorded voiceover.

### Render locally

Install [uv](https://docs.astral.sh/uv/) and FFmpeg, then clone the repository and install Chromium:

```sh
git clone https://github.com/Hostlife22/toon-explainer.git
cd toon-explainer
uv run --with playwright playwright install chromium
```

Preview an example in the browser (space plays, arrow keys step frames):

```sh
uv run --with playwright python scripts/render.py examples/v2_showcase/spec.json --serve
```

Render a contact sheet and a video:

```sh
uv run --with playwright python scripts/render.py examples/v2_showcase/spec.json --sheet renders/sheet.jpg
uv run --with playwright python scripts/render.py examples/v2_showcase/spec.json --out renders/showcase.mp4 --workers 4
```

The renderer starts its own local server. Use `--scale 0.5` for fast previews, `--shot <id>` to render one shot and `--audio vo.mp3` to mux a voiceover.

## Showcase

All frames below were rendered by the engine from the specs in [`examples/`](examples/). The GIFs are silent and loop.

<table>
<tr>
<td width="50%"><img src="assets/showcase/forest-rain.gif" alt="A row of legionaries marches through a three-depth forest as rain and a cold grade fade in" width="100%" /><br/><strong>Forest march</strong> · crowd on twos, rain onset, grade</td>
<td width="50%"><img src="assets/showcase/palace-talk.gif" alt="An emperor talks and snaps from crossed arms to pointing, seen over a soldier's shoulder" width="100%" /><br/><strong>Palace</strong> · over-the-shoulder, hold-and-snap pose, talking mouth</td>
</tr>
<tr>
<td width="50%"><img src="assets/showcase/city-fire.gif" alt="A citizen screams with hands on the head while a night city burns behind" width="100%" /><br/><strong>City on fire</strong> · flipbook fire, smoke, explosion, tremble</td>
<td width="50%"><img src="assets/showcase/messenger-run.gif" alt="A messenger with a red cape runs across a meadow while tall grass rushes past" width="100%" /><br/><strong>Messenger</strong> · run cycle, lagging cape, foreground grass parallax</td>
</tr>
<tr>
<td width="50%"><img src="assets/showcase/map-armies.gif" alt="A parchment map: red and purple territories grow as raised slabs and an army of dots appears" width="100%" /><br/><strong>Map</strong> · extruded territories, coastal glow, dot army</td>
<td width="50%"><img src="assets/showcase/calendar-count.gif" alt="A tear-off calendar races to day 445 next to a counter on a teal burst background" width="100%" /><br/><strong>Numbers</strong> · flipping calendar, counter, punch zoom</td>
</tr>
</table>

## What the engine draws

| Area | Included |
| --- | --- |
| Characters | Bean-head rig in three-quarter, front, side and back views; 14 expressions; 19 poses with hold-and-snap timing; two-bone arms with glove hands; talking mouth, blink, idle rock, tremble, walk and run cycles; capes, armor, helmets, crowns, laurels, hoods, hats, hair and beards |
| Crowds | Duplicated designs with phase offsets, depth-tinted rows, marching armies, cheering towns, silhouette audiences |
| Backgrounds | Sunset, day, dusk, night, storm and teal skies; layered hills; three-depth forests; stone and wooden towns; palace interiors with light wedges; parchment; reaction bursts; image backgrounds |
| Depth | Foreground framing: bushes, canopy, ledges, tall grass, edge trunks, over-the-shoulder heads, rubble |
| Atmosphere | Flipbook fire, rain, light beams, birds, smoke, explosions, blood, lightning, arrow volleys, speed lines, splats, spotlights, per-shot color grades |
| Graphics | Name labels with tags and arrows, titles, dates, era tags, counters, timers, cards, signs, flipping calendars, extruded maps with pins, routes and dot armies |
| Camera and edit | Drift, focus zoom, pan, punch, shake, Dutch tilt and parallax; cut, dissolve, fade, zoom-punch, whip and iris transitions |

Every random choice is seeded, so two renders of the same frame are identical. The bundled Rubik typeface covers Latin and Cyrillic.

<details>
<summary>Character sheet: views, expressions, poses and costumes</summary>

Render it with `uv run --with playwright python scripts/render.py examples/character_sheet/spec.json --stills 0.5,1.5,2.5,3.5 --out renders/characters`.

<img src="assets/characters/character-sheet.jpg" alt="Character sheet: a king in four views, fourteen expressions on a citizen, nineteen poses on a scholar, and four costumes including a legionary with shield and sword" width="100%" />

</details>

## From script to film

1. **Write a storyboard.** Use one block per shot, with English or Russian labels:

   ```md
   **Shot 12** 🎬
   - Voiceover: "In 46 BC the Romans lived through a year of 445 days."
   - On screen: the Forum at sunset, a date pops in
   ```

2. **Generate the skeleton.** Durations come from words per minute, and an SRT is written alongside:

   ```sh
   python3 scripts/script2spec.py film/script.md --out film/spec.json
   ```

3. **Fill each shot** with a recipe from the [visual grammar](references/02-visual-grammar.md). Use a foreground plane, characters from `cast`, a rich background and the atmosphere the line needs. Validate the spec and review a contact sheet:

   ```sh
   python3 scripts/spec.py film/spec.json
   uv run --with playwright python scripts/render.py film/spec.json --sheet film/sheet.jpg
   ```

4. **Re-time to the real voiceover** without touching the layers:

   ```sh
   python3 scripts/script2spec.py film/script.md --srt vo.srt --merge film/spec.json
   ```

5. **Render** the final film:

   ```sh
   uv run --with playwright python scripts/render.py film/spec.json --out film/final.mp4 --audio vo.mp3 --workers 4
   ```

A spec shot looks like this:

```json
{ "id": "k05", "dur": 4.0, "transition": "zoom-punch", "grade": "gold",
  "bg": { "kind": "sky", "preset": "dusk", "clouds": 4, "rays": true },
  "camera": { "zoom": [1.0, 1.1], "focus": [0.62, 0.5], "ease": "out" },
  "layers": [
    { "type": "bean", "who": "caesar", "x": 0.62, "y": 0.97, "size": 700, "expr": "smug",
      "pose": [{ "at": 0, "v": "hips" }, { "at": 2.2, "v": "point" }], "talk": [[2.3, 3.6]] },
    { "type": "fg", "kind": "ots", "who": "senator", "side": "left", "z": 1.3 },
    { "type": "label", "tag": "DICTATOR", "text": "JULIUS CAESAR", "x": 0.28, "y": 0.36, "at": 1.0, "arrow": "down-right" } ] }
```

For unique characters or locations, generate cutouts with an image model and composite them with the `image` layer. See [AI assets](references/04-ai-assets.md).

## Documentation

| Guide | Contents |
| --- | --- |
| [SKILL.md](SKILL.md) | Task routing, commands and production rules for agents |
| [Reference breakdown](references/01-reference-breakdown.md) | Measured editing rhythm, character construction, animation timing and background structure of the studied style |
| [Visual grammar](references/02-visual-grammar.md) | Pacing rules, the three-plane depth rule and 16 shot recipes |
| [Spec reference](references/03-spec-reference.md) | Every field of the JSON spec, layer types, backgrounds, effects, grades and extension points |
| [AI assets](references/04-ai-assets.md) | Prompts, chroma keying and compositing for generated cutouts and backgrounds |
| [Workflow](references/05-workflow.md) | Script to film, voiceover alignment, rendering speed and the QA checklist |

## Project layout

```text
SKILL.md                  agent instructions
references/               method guides
examples/                 calendar_445, grammar, v2_showcase, character_sheet
scripts/engine/           index.html, core.js and lib/ (paint, bg, face, rig, crowd, scenery, text, props, widgets, fx, atmos)
scripts/render.py         MP4 / stills / contact sheet / preview server
scripts/spec.py           spec loading and validation
scripts/script2spec.py    storyboard → spec, SRT alignment, --merge
scripts/key_green.py      chroma key for AI-generated cutouts
scripts/analyze_ref.py    rhythm and frame strips of a new reference video
tests/                    pipeline, determinism and release tests
```

## Tests

```sh
python scripts/check_repository.py
uv run --with pytest --with playwright --with pillow --with numpy pytest tests -q
```

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md) and [ACCESSIBILITY.md](ACCESSIBILITY.md). Changes are recorded in [CHANGELOG.md](CHANGELOG.md).

## License

toon-explainer is released under the [MIT license](LICENSE). Bundled and adapted third-party material, including the Rubik typeface (SIL OFL 1.1), is listed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
