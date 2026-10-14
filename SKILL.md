---
name: toon-explainer
description: "Turn a narrated script/storyboard into a cutout-cartoon explainer video in the style of history/science YouTube channels (Historically-style bean-head characters, painted skies, bold outlined lettering, maps, counters, punch-zooms). Script → JSON spec → deterministic Canvas render → MP4. Use when the user wants to animate a script, generate shots from a storyboard (the companion master prompt's step 5 format «Shot N — Voiceover — On screen», other languages via --labels), recreate this reference style, or render/preview/re-time such a film."
---

# Toon Explainer

You are the director, animator and editor. The script becomes a **spec** (JSON with shots and layers), and the spec becomes a video. Code draws every frame in the browser (Canvas 2D, Playwright, ffmpeg); AI can optionally generate unique characters and backgrounds (see 04).

The style grammar comes from frame-by-frame studies of **eight** videos by one history/myth explainer channel: Rome, China, the Reconquista, World War I, the road to World War II, a speech fact-check show, a Greek myth and a horror biography (about 3.5 hours). v1–v2 came from the Rome breakdown (`references/01-reference-breakdown.md`). v3 added the toolkits from the other seven: eras, creatures, vehicles, places, documents, living maps, horror and war effects. See `references/06-reference-library.md`.

## Route the task

| Request | Workflow | Read |
|---|---|---|
| "Animate this script" / a storyboard exists | `script2spec.py` → fill in layers → sheet → render | 05 → 02 → 03 |
| Make a single shot or scene | Recipe from 02, check with `--stills` | 02, 03 |
| Custom character / unique location | `bean` in `cast`, or an AI cutout + `key_green.py` + an `image` layer | 03 (bean), 04 |
| Fit to an existing voiceover | SRT → `script2spec.py --srt … --merge spec.json` | 05 §4 |
| New reference style | `analyze_ref.py` → frame strips → extend 01 and the library | 01 |
| Pick a toolkit for a new topic | Film type → backgrounds, characters, graphics and tone tools | 06 "Topic → toolkit matrix" |
| War film (ancient, medieval, WWI, WWII) | Trenches, battlefields, fronts on atlas maps, uniforms, vehicles, muzzle/shell/gas FX | 07-places, 07-characters, 07-graphics, 07-fx-and-tone |
| Long-span history (centuries, dynasties) | Timeline HUD, year sign, hanging counter, living territories, time-lapse sky | 07-graphics, 07-places |
| Fact-check / myth vs truth | TV quote player, karaoke subtitles with flagged words, stamps, checklists, stat blocks | 07-graphics |
| Mythology | Creatures, glow, flame shapes, sea/corridor/olympus, sepia backstory | 07-characters, 07-places, 07-fx-and-tone |
| Horror / dark biography | Reaper lurker, voids, glitch, mono-red, jump-scare recipe, ink-blot/peephole transitions | 07-fx-and-tone, 07-characters |
| New layer type / prop / effect | Register in the engine + `scripts/vocab/<module>.json` (no `spec.py` edit) | 03 "Extending" |

## Commands (run from the skill folder)

```sh
python3 scripts/script2spec.py film/script.md --out film/spec.json            # skeleton + .srt
python3 scripts/spec.py film/spec.json                                         # validation
uv run --with playwright python scripts/render.py film/spec.json --sheet film/sheet.jpg
uv run --with playwright python scripts/render.py film/spec.json --serve       # preview in the browser
uv run --with playwright python scripts/render.py film/spec.json --out film/preview.mp4 --scale 0.5 --workers 4
uv run --with playwright python scripts/render.py film/spec.json --out film/final.mp4 --audio vo.mp3 --workers 4
uv run --with pytest --with playwright --with pillow --with numpy pytest tests -q
```

Dependencies: `uv`, `ffmpeg`, Chromium for Playwright (`uv run --with playwright playwright install chromium`). The Rubik 800/900 font (OFL, includes Cyrillic) lives in `scripts/engine/lib/fonts/`.

Examples:
- `examples/calendar_445/spec.json` — 25 s based on the idea "The year that lasted 445 days";
- `examples/grammar/spec.json` — recipe catalog: reveal, map, villain, episode, finale;
- `examples/v2_showcase/spec.json` — v2: a balcony with a ledge and birds, a forest march as rain begins, a fear close-up, an over-the-shoulder palace shot, a slab map with an army, a cheering city, a fire, a chase, the aftermath of a battle;
- `examples/character_sheet/spec.json` — character sheet: 4 angles, 14 emotions, 19 poses, costumes. Render it with `--stills` and check new characters against it;
- `examples/v3_characters/spec.json` — headwear of every era, outfits, countryball flag heads, gas mask, creatures, cavalry, the reaper;
- `examples/v3_places/spec.json` — a 37-shot tour of every v3 background and vehicle;
- `examples/v3_graphics/spec.json` — newspapers, checklists, stamps, charts, bubbles, TV quotes, signs, timeline, subtitles, living atlas maps;
- `examples/v3_fx/spec.json` — horror and war sequences, transitions, grades, layer modifiers and entrances;
- example storyboards: `assets/demo_*.jpg`.

## Production rules

1. **Three planes in every shot:** foreground (`fg`), characters, a rich background, plus atmosphere (`birds`, `beam`, `rain`, `smoke`). A bare background with a lone character is only for reactions and titles (02 → "Depth rule").
2. **Characters move like the reference:** 3/4 angle; a pose holds, then changes over 2 frames with settle (hold-and-snap); the body sways; the mouth cycles through 3 shapes while speaking; `tremble` for fear; `walk`/`run` for movement.
3. **No static shots.** The camera always drifts; this is the default. Add one main action per shot. Split shots longer than 5 s into internal beats.
4. **Match the reference pace:** a new image every 1.5–3.5 s. Speed up the pace at the climax.
5. **Word = event.** The key word of a line coincides with a label, a number or a camera hit appearing (`at`, `punch`).
6. **Labels = key words**, not the whole sentence. Tag (`tag`) + name + an arrow pointing to the character.
7. **Character sheet:** describe recurring characters once in `cast`, then reference them with `who` only.
8. **Set the tone with palette, FX and `grade`**; the grammar stays the same. Cold tone: `dusk`/`night`/`storm`/`teal`, `spotlight`. Comedic: `sunset`/`day`, `splat`, `speedlines`. Horror: `horror`/`mono-red`/`cold`, lurker, glitch. See the tables in 02 and 07-fx-and-tone.
9. **Deflate every peak:** after a scare or a grim beat, cut to comedy or warmth within 2–6 s (all eight references do this).
10. **Imply violence, never show it:** blood pools, X-eyes, crosses filling a region, tombstones, stat blocks, a grade shift with a silent hold. Use generic flags and emblems, never extremist symbols or real likenesses (06 "Handling dark material").
11. **Determinism:** use only `T.rng`/`T.noise`; never `Math.random` or the system clock. Two renders of the same moment must match byte for byte (tested).
12. **Before the final render:**
   - the validator and tests are green;
   - the `--sheet` has been reviewed (text stays in frame, faces are not covered);
   - the preview has been handed for independent review to an agent that did not write the spec.

## Structure

```
scripts/engine/      index.html + core.js (timeline, camera, transitions) + lib/
  lib/paint.js       palette, outlines, toon text, grain/vignette
  lib/bg.js          sky (streak/cumulus clouds, hills with aerial perspective) / interior (light wedges, panel) / parchment / burst / flat / image
  lib/face.js        v2 head: egg-shaped, 4 angles, 14 emotions, 3-shape talking mouth, hairstyles, beards, headwear
  lib/rig.js         v2 body: 2-segment arms + hands, 19 hold-and-snap poses, sway, tremble, walk and run, cloak, armor
  lib/crowd.js       crowds and army ranks: phase-shifted copies, rank depth, marching, silhouettes
  lib/scenery.js     foreground fg (bushes, tree canopies, ledge, grass, trunk, over-the-shoulder, rocks) + forest and city backgrounds
  lib/atmos.js       flipbook fire, rain, light beam, birds, smoke, explosion, blood, lightning, arrows + grade color correction
  lib/text.js        label / title / date / era / counter / timer / caption + title-safe area protection
  lib/props.js       17 props (coin, scroll, sword, shield, spear, torch, light bulb, flag, temple…)
  lib/widgets.js     image cutouts (idle/talk/blink), card, sign, calendar
  lib/fx.js          rays, speedlines, sweat, anger, splat, flash, dust, sparkle, confetti, spotlight
  v3 modules:
  lib/costume.js     T.HEADWEAR registry (29 kinds across eras) + head modes: flag (countryball), gas mask, tint, bull/skull heads
  lib/outfit.js      outfits: suit, tunic, greatcoat, hanfu, kimono, lamellar, surcoat, hivis, skeleton; medals, puttees
  lib/creatures.js   creature layer: horse, bull, cow, camel, sheep (walk/gallop on twos, riders, glow)
  lib/spirits.js     reaper, raven, dove, skeleton
  lib/vehicles.js    vehicle layer: tank, car1910, train, steamer, submarine, junk, caravel, rowboat, biplane, cannon, cart
  lib/places*.js     trench, battlefield, sea, underwater, corridor, void, office, graveyard, eastcity, karst, gallery,
                     blueprint, desert, mountains, stage, bar, hospital, factory, street1920, minoan, olympus, chalkboard
  lib/fgx.js, props2.js   more foreground kinds (sandbags, bars, window grid, curtains, fpv hands…) and 21 props
  lib/docs*.js       doc layer: newspaper, document/checklist, stamp, chart, bubble, tv, idcard, poster, quote, stat,
                     yearsign, hangsign, nametag, ribbon, lowerthird, mission
  lib/hud.js         timeline HUD and karaoke subtitles with flagged words
  lib/mapx*.js       map v3: atlas style, faces and arms on regions, conquer floods, fronts, tokens, cities, crosses,
                     punch cracks, rivers, walls, pencil (the map moved here from widgets.js)
  lib/atmos2/3.js    glitch, rgbsplit, alarm, cctv, mist, whirlpool, red eyes, wall shadow, eyelids, ink burst, gas,
                     muzzle flashes, shell bursts, flame shapes; layer modifiers glow/silhouette/lineart; 7 transitions
scripts/vocab/*.json     validator vocabulary per module (merged by spec.py, compared with the engine by tests)
scripts/render.py    MP4 / stills / sheet / serve, parallel workers, audio
scripts/spec.py      loading + validation (KNOWN_* = the engine vocabulary)
scripts/script2spec.py   storyboard → spec, SRT alignment, --merge
scripts/key_green.py     chroma key for AI cutouts
scripts/analyze_ref.py   rhythm measurement and frame strips for a new reference
```

## Feedback loop

After each film:
- add recipes that worked to `02-visual-grammar.md`;
- document new layers in `03-spec-reference.md`;
- record mistakes and workarounds in the QA section of `05-workflow.md`.

If the code and the documentation disagree, trust the code and fix the documentation.
