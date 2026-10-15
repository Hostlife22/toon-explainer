---
name: toon-explainer
description: "Turn a topic or a narrated script/storyboard into a cutout-cartoon explainer video, landscape (16:9) or vertical short (9:16), in the style of history/science YouTube channels (bean-head characters, painted skies, bold outlined lettering, maps, counters, punch-zooms). Topic → directing plan → JSON spec → deterministic Canvas render → MP4. Use when the user wants to plan or animate an explainer on any topic, make a vertical short, generate shots from a storyboard (the companion master prompt's step 5 format: a **Shot N** line followed by '- Voiceover:' and '- On screen:' lines, see references/05-workflow.md; other languages via --labels), recreate this reference style, or render/preview/re-time such a film."
---

# Toon Explainer

## Your role

You are the director, animator and editor. The script becomes a **spec** (JSON with shots and layers), and the spec becomes a video. Code draws every frame in the browser (Canvas 2D, Playwright, ffmpeg); AI can optionally generate unique characters and backgrounds (see 04).

The style grammar comes from studies of **twenty** videos by one history/myth explainer channel: eight long films (Rome, China, the Reconquista, World War I, the road to World War II, a speech fact-check show, a Greek myth, a horror biography; about 3.5 hours) and twelve vertical shorts (40–95 s). Every frame was decoded for cut detection; contact sheets cover every video end to end, with frame strips at 30 fps for fast actions and transcripts for word sync. `references/06-reference-library.md` records coverage and what each video teaches, `references/09-directing.md` turns the dramaturgy into a planning method, `references/10-technique-library.md` catalogues the techniques by what a scene must do, `references/11-vertical-shorts.md` covers the 9:16 format, and `references/07-story-craft.md` maps sentences to shot recipes.

**Direct before you draw.** For any new film, first write the central question, the arc and a shot card per shot (what the viewer learns, what physically happens, what changes, why it follows the previous shot): `references/09-directing.md`. Only then pick layers.

## Route the task

All numbered guides are in `references/`; toolkit cards are in `references/toolkits/` and listed in `references/08-toolkits.md`.

| Request | Workflow | Read |
|---|---|---|
| "Make a video about X" (only a topic) | central question → arc → meaning events → visual actions → storyboard → spec | 09 → 10 → 05 |
| "Animate this script" / a storyboard exists | `script2spec.py` → shot cards → shot recipes → fill in layers → sheet → render | 09 §7 → 05 → 07 → 02 → 03 |
| Vertical short, Reels/TikTok/Shorts, 9:16 | `"format": "vertical"`, shot `frame` and `pinned`, three-band layout, hook in the first sentence, hard stop | 11 → 09 |
| Pick a technique by what the scene must do (explain a mechanism, build suspense, show a death off screen, compare, pass time) | technique library by purpose, then its engine recipe | 10 → card |
| Turn a line of narration into a shot | Find the sentence's intent in the recipe table, then open the card it names | 07 §7 → 08 → card |
| Make a single shot or scene | Recipe from 02 or a card, check with `--stills` | 02, 03, card |
| Custom character / unique location | `bean` in `cast`, or an AI cutout + `key_green.py` + an `image` layer | `toolkits/01_characters.md`, 04 |
| Fit to an existing voiceover | SRT → `script2spec.py --srt … --merge spec.json` | 05 §4 |
| New reference style | `analyze_ref.py` → frame strips → extend 01 and the library | 01, 06 |
| Pick tools for a new topic | Film type → backgrounds, characters, graphics and tone tools | 06 "Topic → toolkit matrix" → 08 |
| Characters, costumes, expressions, poses, body types | `cast` looks, `pose`/`expr` timelines, `build`/`age` | `toolkits/01_characters.md` |
| Acting and gags: giant arm, poof costume change, hats, exits | `arm` layer, `fx: poof/hat/marks/prohibit`, `swap`, enter/exit kinds | `toolkits/02_acting.md` |
| Props, objects with faces, animals, vehicles | `prop`, `obj`, `creature`, `vehicle` layers | `toolkits/03_props_creatures_vehicles.md` |
| Places: skies, trenches, palaces, studios, rooms, foreground framing | `bg` kinds, `fg` kinds | `toolkits/04_places.md` |
| Maps: territories, conquests, fronts, figures on the map, views | `map` layer | `toolkits/05_maps.md` |
| Names, titles, counters, documents, bubbles, timelines, subtitles | lettering layers and `doc` kinds | `toolkits/06_paper_and_lettering.md` |
| Game-parody framing: HUD, cursor, VS cards, menus, quest chips | `hud`, `cursor`, game `doc` kinds, `spec.overlays` | `toolkits/07_game_ui.md` |
| Effects, materials, horror and war FX, grades, piles and floods, cracked glass, petrify | `fx` kinds, layer modifiers (incl. `xray`), `grade` | `toolkits/08_fx_and_tone.md` |
| Transitions, split screens, frame-in-frame (gilt, TV, phone, photo, circle badge), POV masks, depth of field | transitions (incl. `swirl`, `pixelate`, `burn`, `swarm`, `squeeze`, `carry`, `whip` `dir`), `panel`, `fg` masks, `blur`/`focus`, `letterbox` | `toolkits/09_transitions_and_lens.md` |
| New layer type / prop / effect | Register in the engine + `scripts/vocab/<module>.json` (no `spec.py` edit) | 03 "Extending" |

## Commands (run from the skill folder)

```sh
python3 scripts/script2spec.py film/script.md --out film/spec.json            # skeleton + .srt
python3 scripts/spec.py film/spec.json                                         # validation
uv run --with playwright python scripts/render.py film/spec.json --sheet film/sheet.jpg
uv run --with playwright python scripts/render.py film/spec.json --serve       # preview in the browser
uv run --with playwright python scripts/render.py film/spec.json --out film/preview.mp4 --scale 0.5 --workers 4
uv run --with playwright python scripts/render.py film/spec.json --out film/final.mp4 --audio vo.mp3 --workers 4
uv run --with playwright python scripts/render.py examples/vertical_short/spec.json --out renders/short.mp4 --scale 0.5 --workers 4   # 9:16
uv run --with pytest --with playwright --with pillow --with numpy pytest tests -q
```

Dependencies: `uv`, `ffmpeg`, Chromium for Playwright (`uv run --with playwright playwright install chromium`). The Rubik 800/900 font (OFL, includes Cyrillic) lives in `scripts/engine/lib/fonts/`.

## Examples

Films that show a whole story:
- `examples/coffee_film/` — "How Coffee Conquered the World", 24 shots, 73 s, with its storyboard `script.md`. It was made from the docs alone and is the best model of a finished film;
- `examples/vertical_short/` — "Why Ice Floats", a 51 s 9:16 science short planned with `09-directing.md` (central question and arc in `script.md`): molecules as characters, a stacked comparison, vertical whips, a what-if, a photo ending;
- `examples/money_film/` — "Why Printing Money Raises Prices", 38 s, 16:9 economics film built as an escalation ladder: a price counter that persists across cuts, cause and effect in one frame, the palace and the bakery reused in changed states;
- `examples/calendar_445/` — 25 s on "The year that lasted 445 days";
- `examples/showcase/` — a balcony with birds, a forest march as rain begins, a fear close-up, an over-the-shoulder palace shot, a slab map with an army, a cheering city, a fire, a chase, the aftermath of a battle;
- `examples/grammar/` — recipe catalog: reveal, map, villain, episode, finale;
- `examples/story_*` — twelve 22 s story films on non-historical topics, each with a hook, a turn and a payoff and dense feature use: `story_moon_race` (rivals, countdown), `story_vaccine` (an inside-the-body explainer), `story_museum_heist` (a plan, CCTV, a double-cross), `story_banana_caper` (a slapstick investigation), `story_startup` (rise and fall told with UI), `story_simulation` (glitches, grid, pull-back reveal), `story_border` (a living-map dispute), `story_emu_war` (comedy history with image cutouts), `story_lighthouse` (slow-burn horror), `story_volcano` (a science disaster), and two 9:16 shorts, `story_cat_physics` and `story_honey`.

Toolkit catalogs (one shot per feature; render one with `--sheet` before using its card for the first time): `character_sheet`, `eras_wardrobe`, `expressions_wardrobe`, `acting_gags`, `props_creatures`, `places_tour`, `sets_rooms`, `living_maps`, `paper_and_maps`, `paper_cards`, `game_ui`, `tone_and_horror`, `action_fx`, `transitions_lens`. `references/08-toolkits.md` says which card each one belongs to. Contact sheets of every example: `assets/sheets/<example>.jpg`.

## Production rules

0. **Plan the story first** (`09-directing.md`): central question → arc → meaning events → the physical action that shows each one → shot cards. Every shot must answer: what the viewer learns, what happens, what changes, why it follows the previous one.
1. **Three planes in every shot:** foreground (`fg`), characters, a rich background, plus atmosphere (`birds`, `beam`, `rain`, `smoke`). A bare background with a lone character is only for reactions and titles (02 → "Depth rule").
2. **Characters move like the reference:** 3/4 angle; a pose holds, then changes over 2 frames with settle (hold-and-snap); the body sways; the mouth cycles through 3 shapes while speaking; `tremble` for fear; `walk`/`run` for movement.
3. **No static shots.** The camera always drifts; this is the default. Add one main action per shot. Split shots longer than 5 s into internal beats.
4. **Match the reference pace by events, not cuts:** both formats cut 7–17 times a minute, and something new happens on screen every 1.5–3 s (shorts: 1.5–2.5 s, under 15 % still frames). A long map, board or stage shot is fine if it keeps changing inside. Climaxes either cut fast (0.1–1.6 s, then a 2–4 s outcome hold) or get heavier through content; hold before an impact (2–3 s) so it lands.
5. **Word = event.** The key word of a line coincides with a label, a number or a camera hit appearing (`at`, `punch`, `jump`).
6. **Labels = key words**, not the whole sentence. Tag (`tag`) + name + an arrow pointing to the character.
7. **Character sheet:** describe recurring characters once in `cast`, then reference them with `who` only.
8. **Set the tone with palette, FX and `grade`**; the grammar stays the same. Cold tone: `dusk`/`night`/`storm`/`teal`, `spotlight`. Comedic: `sunset`/`day`, `splat`, `speedlines`. Horror: `horror`/`mono-red`/`cold`, lurker, glitch. See 02 and `toolkits/08_fx_and_tone.md`.
9. **Story first:** split the script into beats, pick a recipe per beat from `07-story-craft.md` (map spine + 1.5–4 s gag inserts, a recurring device, a frame story for long films), and make every gag land on its key word.
10. **Deflate scares and ordinary grim peaks:** cut to comedy or warmth within 2–6 s (scares, comic deaths) or 5–15 s (ordinary deaths). **Never deflate atrocity beats** (genocide, famine, mass terror, harm to children): no gags, a cold grade, a silent hold (07-story-craft §5). One reference short keeps dark-comic euphemism inside such a beat; this skill deliberately does not.
11. **Imply violence, never show it:** blood pools, X-eyes, crosses filling a region, tombstones, stat blocks, a grade shift with a silent hold, a cut away before contact. Use generic flags and emblems, never extremist symbols or real likenesses (06 "Handling dark material"). Some reference videos draw such symbols, caricature real people or show executions; those are deliberate differences, not gaps.
12. **Determinism:** use only `T.rng`/`T.noise`; never `Math.random` or the system clock. Two renders of the same moment must match byte for byte (tested).
13. **Vertical shorts are their own format** (`11-vertical-shorts.md`): claim on frame 1, visible change by 2 s, three bands (lettering top, subject middle, foreground bottom), subjects inside x 0.36–0.64, one question in 4–6 steps, hard stop 0.3 s after the last word.
14. **Before the final render:**
   - the validator and tests are green;
   - the `--sheet` has been reviewed (text stays in frame, faces are not covered);
   - the preview has been handed for independent review to an agent that did not write the spec.

## Project structure

```
scripts/engine/          index.html + core.js (timeline, camera, layer motion, swap, modifiers, focus, overlays, transitions, landscape/vertical output)
  lib/base/              paint (palette, outlines, toon text, grain), helpers (numbers, clouds, arrows, gloves, sub-shots),
                         text (labels, titles, counters), widgets (image cutouts, cards, signs, calendar)
  lib/characters/        face, rig (poses, legs, builds), headwear, outfits, wardrobe, expressions, crowd
  lib/acting/            gags: off-screen arms, poof, hats, marks, prohibit, entrances and exits
  lib/creatures/         quadrupeds, spirits (reaper, birds, skeleton), animals-objects (obj layer, more animals)
  lib/props/             props, props-world, props-gags, vehicles, vehicles-machines (screens, clocks, wheels)
  lib/places/            backgrounds (sky, interior, parchment, burst), scenery (fg, forest, city), foreground,
                         places-war, places-world, places-towns, places-sets, places-rooms
  lib/maps/              map (styles, regions, faces), map-overlays (rivers, fronts, routes, tokens), map-views (views,
                         living regions, figures, arrows, trails)
  lib/paper/             paper (newspaper, documents, stamps, charts), signs-bubbles, cards (nameplates, time skips,
                         picture bubbles, number cards, graffiti), timeline-subtitles
  lib/game/              game-ui: hud and cursor layers, game doc kinds
  lib/fx/                emphasis, atmosphere (fire, rain, grades), tone (modifiers, comic and horror transitions),
                         tone-fx (horror, surveillance, war), action-fx (brawls, stand-ins, booms, light), materials
  lib/lens/              transitions, panels (split screen, grids, frames, POV masks)
  lib/fonts/             Rubik 800/900 (OFL)
scripts/vocab/*.json     validator vocabulary per module (merged by spec.py, compared with the engine by tests)
scripts/render.py        MP4 / stills / sheet / serve, parallel workers, audio
scripts/spec.py          loading + validation (KNOWN_* = the engine vocabulary)
scripts/script2spec.py   storyboard → spec, SRT alignment, --merge
scripts/key_green.py     chroma key for AI cutouts
scripts/analyze_ref.py   rhythm measurement and frame strips for a new reference
scripts/check_repository.py   syntax, JSON, doc links and vocabulary coverage of the docs
references/              01–11 numbered guides (09 directing, 10 technique library, 11 vertical shorts) + toolkits/ (one card per domain)
examples/                story films and toolkit catalogs
```

## Feedback loop

After each film:
- add recipes that worked to `02-visual-grammar.md`, `07-story-craft.md` or the card they belong to;
- document new fields in the card of their domain (and core fields in `03-spec-reference.md`);
- record mistakes and workarounds in the QA section of `05-workflow.md`.

If the code and the documentation disagree, trust the code and fix the documentation.
