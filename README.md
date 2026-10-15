# toon-explainer

Turn a narrated script into a cutout-cartoon explainer video with a coding agent. toon-explainer is a skill and a portable HTML Canvas engine for the look of history and science YouTube channels: bean-head characters in three-quarter view, painted skies, foreground framing, bold outlined lettering, maps, crowds, fire, rain and punch zooms.

**Script → JSON spec → deterministic Canvas render → MP4**

<img src="assets/showcase/hero.png" alt="Rendered toon-explainer frames: a king on a sunset balcony, legionaries marching through a rainy forest, an emperor in a palace seen over a soldier's shoulder, a cheering town, a city on fire and a fallen soldier after battle" width="100%" />

[Quick start](#quick-start) · [Showcase](#showcase) · [Toolkits for any topic](#toolkits-for-any-topic) · [What the engine draws](#what-the-engine-draws) · [From script to film](#from-script-to-film) · [Documentation](#documentation)

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
uv run --with playwright python scripts/render.py examples/showcase/spec.json --serve
```

Render a contact sheet and a video:

```sh
uv run --with playwright python scripts/render.py examples/showcase/spec.json --sheet renders/sheet.jpg
uv run --with playwright python scripts/render.py examples/showcase/spec.json --out renders/showcase.mp4 --workers 4
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

## Toolkits for any topic

The style grammar was learned from eight studied explainer videos: Rome, China, the Reconquista, World War I, the road to World War II, a speech fact-check show, a Greek myth and a horror biography. Each one added a toolkit, so one engine covers wars of every era, long dynastic histories, mythology, fact-checks and horror. The [reference library](references/06-reference-library.md) maps each film type to its backgrounds, characters, graphics and tone tools.

<table>
<tr>
<td width="33%"><img src="assets/showcase/trench-attack.gif" alt="Soldiers in tin helmets advance across a sepia no-man's-land with craters, dead trees and barbed wire" width="100%" /><br/><strong>World War I</strong> · trenches, no-man's-land, uniforms</td>
<td width="33%"><img src="assets/showcase/tank.gif" alt="A rhomboid tank rolls across a cratered battlefield with scrolling treads" width="100%" /><br/><strong>Vehicles</strong> · tank, train, ships, biplane, cannon</td>
<td width="33%"><img src="assets/showcase/cavalry.gif" alt="Knights in great helms gallop on horses across a sunset plain" width="100%" /><br/><strong>Medieval</strong> · great helms, horses, gallop on twos</td>
</tr>
<tr>
<td width="33%"><img src="assets/showcase/atlas-map.gif" alt="Two territories with faces fight on an atlas map while an animated front line advances" width="100%" /><br/><strong>Living maps</strong> · faces, weapon arms, fronts, conquests</td>
<td width="33%"><img src="assets/showcase/countryballs.gif" alt="Characters with national-flag heads and era headwear on a teal burst" width="100%" /><br/><strong>Nations as people</strong> · flag heads, era headwear</td>
<td width="33%"><img src="assets/showcase/eastcity.gif" alt="Court officials in hanfu walk past pagodas and golden-roofed halls" width="100%" /><br/><strong>East Asia</strong> · pagodas, eaves, hanfu, karst mist</td>
</tr>
<tr>
<td width="33%"><img src="assets/showcase/tv-quote.gif" alt="An oval retro TV plays a speech while karaoke subtitles flag false words in red" width="100%" /><br/><strong>Fact-check</strong> · TV quote player, flagged subtitles, stamps</td>
<td width="33%"><img src="assets/showcase/horror-lurker.gif" alt="A shadowy figure with red eyes fades in behind an unaware man in a dark study" width="100%" /><br/><strong>Horror</strong> · lurker, heavy vignette, slow dread</td>
<td width="33%"><img src="assets/showcase/timelapse.gif" alt="A sun with a face and a crescent moon cross the sky in a day-night time-lapse over a waiting army" width="100%" /><br/><strong>Time compression</strong> · day/night time-lapse, timeline HUD, year signs</td>
</tr>
</table>

## Directing and vertical shorts

A third pass studied twenty videos by the channel, eight long films and twelve vertical shorts. Every frame was decoded for cut detection, contact sheets covered each video end to end, and 274 frame strips were cut at 30 fps (coverage in [06-reference-library](references/06-reference-library.md)). It added a planning method, [09-directing](references/09-directing.md): topic → central question → arc → meaning events → visible actions → shot cards. It also added a [technique library](references/10-technique-library.md) indexed by what a scene must do, and a 9:16 format ([11-vertical-shorts](references/11-vertical-shorts.md); `"format": "vertical"`). Two films built with the method show it on non-historical topics: [`examples/vertical_short`](examples/vertical_short/spec.json) ("Why Ice Floats", 9:16) and [`examples/money_film`](examples/money_film/spec.json) ("Why Printing Money Raises Prices", 16:9).

## Acting, staging and story

A second, frame-dense pass over the same eight videos (1 frame per second, motion strips, transcripts) filled in acting, staging and story tools, collected in the [toolkit cards](references/08-toolkits.md) and a [story-craft guide](references/07-story-craft.md) that maps narration to shot recipes. The film below was made by an agent that had only the skill's docs and a one-paragraph brief: [`examples/coffee_film`](examples/coffee_film/spec.json), "How Coffee Conquered the World", 24 shots, 73 s.

<table>
<tr>
<td colspan="3"><img src="assets/showcase/coffee-film.gif" alt="A pope tastes coffee in a blurred gothic hall, the screen bursts gold, an APPROVED stamp lands and the coffee mug with a face gets a halo while a cup counter keeps running in the corner" width="100%" /><br/><strong>A whole film from a brief</strong> · rack focus, swap, stamps, a running counter and quest chip across cuts</td>
</tr>
<tr>
<td width="33%"><img src="assets/showcase/poof-swap.gif" alt="A cartoon smoke cloud with POOF lettering covers a character, who reappears in a new costume" width="100%" /><br/><strong>Acting and gags</strong> · poof swaps, giant arms, hat gags, 46 poses</td>
<td width="33%"><img src="assets/showcase/map-split.gif" alt="A territory cracks into two halves with angry faces that punch each other" width="100%" /><br/><strong>Living maps</strong> · split, shatter, tilt and globe views, war arrows</td>
<td width="33%"><img src="assets/showcase/palace.gif" alt="A red lacquer throne hall with glowing lattice windows and lanterns, an emperor on the throne" width="100%" /><br/><strong>Places</strong> · palaces, studios, rooms, harbor, mood backdrops</td>
</tr>
<tr>
<td width="33%"><img src="assets/showcase/versus.gif" alt="Split screen with a jagged lightning seam and a VS badge between two rivals" width="100%" /><br/><strong>Lens</strong> · split screens, comic grids, 13 transitions, POV masks</td>
<td width="33%"><img src="assets/showcase/brawl.gif" alt="A boiling cartoon fight cloud with fists, boots and stars" width="100%" /><br/><strong>FX</strong> · brawl cloud, materials, stand-ins, booms, 12 grades</td>
<td width="33%"><img src="assets/showcase/challenger.gif" alt="A fighting-game style CHALLENGER APPROACHING card with a portrait in a red disc" width="100%" /><br/><strong>Game parodies</strong> · HUD, cursor, VS cards, menus, quest chips</td>
</tr>
<tr>
<td width="33%"><img src="assets/showcase/picto-bubble.gif" alt="A speech bubble fills with icons joined by arrows, one icon struck out with a red no sign" width="100%" /><br/><strong>Paper and lettering</strong> · picture bubbles, nameplates, stat cards, graffiti</td>
<td width="33%"><img src="assets/showcase/wings.gif" alt="Characters with feathered wings, a halo and devil horns and tail flapping on a sky background" width="100%" /><br/><strong>Characters</strong> · 18 expressions, 29 headwear, 20 outfits, wings, kids and elders</td>
<td width="33%" valign="top"><br/><strong>Every feature has a demo film</strong>: each <a href="references/08-toolkits.md">toolkit card</a> names its catalog film in <code>examples/</code>, one shot per feature. Render any of them with <code>--sheet</code> to browse the toolkit.</td>
</tr>
</table>

<details>
<summary>Contact sheets of the toolkit examples</summary>

<img src="assets/demo_places_tour.jpg" alt="Contact sheet: a tour of the war, world and town backgrounds and the vehicles, from trenches and seas to pagodas, voids, offices and stages" width="100%" />
<img src="assets/demo_paper_and_maps.jpg" alt="Contact sheet: newspapers, checklists, stamps, charts, speech bubbles, a TV quote, signs, a mission card, news, a timeline and maps" width="100%" />
<img src="assets/demo_tone_and_horror.jpg" alt="Contact sheet: glitch, mono-red, lurker, jump scare, wall shadow, line art, divine glow, flame shape, ink, mist, sepia memory, CCTV alarm, gas, shell bursts and entrances" width="100%" />
<img src="assets/demo_eras_wardrobe.jpg" alt="Contact sheet: headwear of every era, outfits, flag heads, masks, a herd of animals, cavalry, the reaper, a minotaur and a skeleton" width="100%" />

</details>

## What the engine draws

| Area | Included |
| --- | --- |
| Characters | Bean-head rig in three-quarter, front, side and back views; 17 expressions; 19 poses with hold-and-snap timing; two-bone arms with glove hands; talking mouth, blink, idle rock, tremble, walk and run cycles; 29 headwear kinds from laurels to tin hats, great helms, turbans and officer caps; outfits (suit, tunic, greatcoat, hanfu, kimono, lamellar, surcoat); flag heads, gas masks, animal and skull heads |
| Creatures | Horse, bull, cow, camel and sheep with walk and gallop cycles and riders; reaper, raven, dove and skeleton |
| Vehicles | Tank, 1910 car, train, paddle steamer, submarine, junk, caravel, rowboat, biplane, cannon, cart |
| Crowds | Duplicated designs with phase offsets, depth-tinted rows, marching armies, cheering towns, cavalry, face lineups, silhouette audiences |
| Backgrounds | Skies with day/night time-lapse; hills, forests, towns and palaces; trenches, battlefields, seas, underwater, stone corridors, horror voids, offices, graveyards, East Asian cities, karst mist, galleries, blueprints, deserts, mountains and caves, stages, bars, hospitals, factories, 1920s streets, Minoan halls, Olympus, chalkboards; parchment; reaction bursts; image backgrounds |
| Depth | Foreground framing: bushes, canopy, ledges, tall grass, edge trunks, over-the-shoulder heads, rubble, sandbags, trench walls, window grids, prison bars, barbed wire, curtains, first-person hands |
| Atmosphere | Flipbook fire, rain, light beams, birds, smoke, explosions, blood, lightning, arrows, gas clouds, muzzle flashes, shell bursts, mist, whirlpools, red eyes in the dark, wall shadows, ink bursts, glitch and RGB split, CCTV alarm, eyelids POV; grades including sepia, horror, cold, divine and mono-red; glow, silhouette and line-art layer modifiers |
| Graphics | Labels, titles, dates, era tags, counters, calendars; newspapers, documents and checklists, stamps, line and bar charts, speech bubbles, retro TVs, ID cards, posters, quotes, stat walls, year signs, hanging counters, name tags, ribbons, news lower thirds, mission cards; timeline HUD; karaoke subtitles with flagged words; parchment and atlas maps with faces, conquests, fronts, tokens, burning cities, crosses, rivers and walls |
| Camera and edit | Drift, focus zoom, pan, punch, shake, Dutch tilt and parallax; cut, dissolve, fade, zoom-punch, whip, iris, ink-blot, slash, peephole, sepia-to-color, torn split, bar wipe and flash-cut transitions; drop-squash, pop-tilt and slam entrances |

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
| [Reference library](references/06-reference-library.md) | The eight studied videos, constants across them, the topic → toolkit matrix and rules for dark material |
| [Story craft](references/07-story-craft.md) | Pacing, hooks, comedy devices, dark-beat rules, motion timing and sentence → shot recipes |
| [Toolkits](references/08-toolkits.md) | Catalog of the nine toolkit cards and how to choose between them |
| [Characters](references/toolkits/01_characters.md) | Looks of every era, headwear, outfits, expressions, face gags, poses, body types, crowds |
| [Acting and gags](references/toolkits/02_acting.md) | Off-screen arms, poof changes, hat gags, marks, entrances and exits |
| [Props, creatures and vehicles](references/toolkits/03_props_creatures_vehicles.md) | Props, furniture, screens, objects with faces, animals, spirits, vehicles, cutouts and cards |
| [Places](references/toolkits/04_places.md) | Skies, interiors, war and dread settings, palaces, studios, rooms, foreground framing |
| [Maps](references/toolkits/05_maps.md) | Living regions, conquests, fronts, overlays, figures and map views |
| [Paper and lettering](references/toolkits/06_paper_and_lettering.md) | Labels, titles, counters, documents, bubbles, cards, timelines and subtitles |
| [Game UI](references/toolkits/07_game_ui.md) | HUD widgets, cursors, VS cards, menus and persistent overlays |
| [FX and tone](references/toolkits/08_fx_and_tone.md) | Effects, stand-ins for violence, materials, layer modifiers and grades |
| [Transitions and lens](references/toolkits/09_transitions_and_lens.md) | Every transition, panels, POV masks, rack focus and camera tricks |

## Project layout

```text
SKILL.md                  agent instructions
references/               numbered guides 01–11 (09 directing, 10 technique library, 11 vertical shorts) and toolkits/
examples/                 story films (coffee_film, vertical_short, money_film, calendar_445, showcase, grammar) and one catalog film per toolkit
scripts/engine/           index.html, core.js and lib/<domain>/ (base, characters, acting, creatures, props, places, maps,
                          paper, game, fx, lens)
scripts/vocab/            validator vocabulary per engine module
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
