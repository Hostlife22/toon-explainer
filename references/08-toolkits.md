# 08 · Toolkits: what the engine can draw, by domain

Read this when you know the beat you want to stage and need the right tool. It is the catalog of the nine toolkit cards in [`toolkits/`](toolkits/), a selection table, the rules that hold across all of them, and the example film that shows each card on screen. The field contract shared by every layer (timing, motion, camera, swap, blur, overlays) is in [03-spec-reference.md](03-spec-reference.md); how to turn narration into shots is in [07-story-craft.md](07-story-craft.md).

Every card uses the same sections: ① when to use it, ② look and staging rules, ③ the full field reference, ④ measured timing, ⑤ recipes, ⑥ limits and pitfalls.

## 1. Catalog

| Card | Draws | Layer types and fields | Engine (`scripts/engine/lib/`) | Example films (`examples/`) |
|---|---|---|---|---|
| [01 Characters](toolkits/01_characters.md) | Bean characters of every era: hair, beards, headwear, outfits, flag heads and masks, expressions, face gags, accessories, wings, poses, body types, crowds, overhead figures | `bean`, `crowd`, `topbean`, `cast` look fields | `characters/` | `character_sheet`, `eras_wardrobe`, `expressions_wardrobe` |
| [02 Acting and gags](toolkits/02_acting.md) | Off-screen arms and giant hands, poof costume changes, hat gags, micro-acting marks, "no X" signs, entrances and exits, struggle and swing | `arm`, `fx: poof hat marks prohibit sweat-spray tear-stream`, `enter`/`exit`, `swap`, `jitter`, `swing` | `acting/`, `core.js` | `acting_gags` |
| [03 Props, creatures and vehicles](toolkits/03_props_creatures_vehicles.md) | Hand props and set props, furniture, cages and doors, screens, clocks and wheels, objects with faces, animals, spirits, vehicles, image cutouts, cards and signs | `prop`, `obj`, `creature`, `vehicle`, `image`, `card`, `sign`, `calendar`, `hold` | `props/`, `creatures/`, `base/widgets.js` | `props_creatures`, `places_tour`, `eras_wardrobe` |
| [04 Places](toolkits/04_places.md) | Painted skies and hills, interiors, forests and towns, war and dread settings, palaces, studios, rooms, harbors, mood backdrops, foreground framing | `bg` kinds, `fg` kinds | `places/` | `places_tour`, `sets_rooms`, `showcase` |
| [05 Maps](toolkits/05_maps.md) | Parchment and atlas maps, living regions with faces, conquests and annexations, fronts, routes, armies, cities, figures standing on the map, tilt / globe / tabletop views | `map` | `maps/` | `living_maps`, `paper_and_maps` |
| [06 Paper and lettering](toolkits/06_paper_and_lettering.md) | Labels, titles, dates, counters, timers, captions, newspapers, documents, stamps, charts, bubbles, signs, nameplates, time skips, number cards, graffiti, timelines, subtitles | `label`, `title`, `date`, `era`, `counter`, `timer`, `caption`, `doc`, `timeline`, `subtitle` | `base/text.js`, `paper/` | `paper_cards`, `paper_and_maps` |
| [07 Game UI](toolkits/07_game_ui.md) | Game-parody framing: HUD widgets, quest chips, speedrun timers, cursors, VS and challenger cards, menus, dialogs, slides | `hud`, `cursor`, game `doc` kinds, `spec.overlays` | `game/` | `game_ui` |
| [08 FX and tone](toolkits/08_fx_and_tone.md) | Emphasis effects, weather and fire, horror and war FX, brawls, violence stand-ins, booms, light, materials (ghost, statue, gold, engraving, ice), grades | `fx` kinds, `fg: mob`, layer modifiers, `grade`, `style` | `fx/` | `tone_and_horror`, `action_fx` |
| [09 Transitions and lens](toolkits/09_transitions_and_lens.md) | Every transition, split screens and comic grids, frame-in-frame, binocular / spyglass / eye POV, rack focus, letterbox, cut-in jumps | `transition`, `panel`, `fg: binoculars spyglass eye-pov`, camera fields, `focus`, `blur` | `lens/`, `fx/tone.js`, `core.js` | `transitions_lens`, `tone_and_horror` |

The film [`examples/coffee_film`](../examples/coffee_film/spec.json) combines all nine cards in a 73-second story and is the best single reference for how they work together. Two films built with the directing method of [09-directing.md](09-directing.md) show the cards on non-historical topics: [`examples/vertical_short`](../examples/vertical_short/spec.json) (science, 9:16) and [`examples/money_film`](../examples/money_film/spec.json) (economics, 16:9).

## 2. Choose by beat

| The beat needs… | Start with | Then add |
|---|---|---|
| Who is this person, and what do they want | 01 (look, expression, pose) + 06 nameplate | 04 a place that says where; 02 a gesture on the key word |
| Something happens to someone (pushed, robbed, crowned, changed) | 02 | 01 expression snap, 08 impact FX |
| Things, money, inventions, animals | 03 | 06 a number card or label |
| Where we are, and the mood of the place | 04 | 08 atmosphere and grade |
| Who controls what, over time | 05 | 06 year sign or timeline; 02 a giant hand on the map |
| A name, a number, a quote, a claim to check | 06 | 07 for a game-show or quest framing |
| Danger, violence, death, magic | 08 (stand-ins, never gore) | 09 a cut that hides the moment |
| Comparison, two sides, a memory, a point of view | 09 (panel, POV masks, focus) | 06 VS lettering |

## 3. Rules that hold across all cards

- **Every name in a card is engine vocabulary.** The validator (`python3 scripts/spec.py`) rejects unknown kinds; `python3 scripts/check_repository.py` fails when a vocabulary name is missing from the docs.
- **Look:** dark-brown ink outline (`#2a1c15`), one flat shadow tone per colour, three-quarter views, readable lettering (labels 56 px or more, captions 44 px or more at 1080p), everything inside a 3.5 % safe frame.
- **Timing:** hold-and-snap. Poses, expressions and swaps change in 1–2 frames and then hold; entrances last 4–15 frames; something on screen changes every 1.5–3.5 s.
- **Layering:** later layers draw on top. Put the foreground last, or use `fg: bg-front` to redraw a background's front plane over characters.
- **Ids:** give a layer an `id` when another layer, a rack `focus` or a cursor must refer to it; ids also seed the randomness of effects, so two layers of the same kind look different.
- **Persisting things** (counters, quest chips, timers) go in `spec.overlays`, not in each shot.

## 4. Adding to a toolkit

Register the new kind in the engine module of its domain, declare it in that module's `scripts/vocab/*.json`, document it in the card's ③ table with a recipe in ⑤, and add a shot to the card's example film. See [03 "Extending"](03-spec-reference.md#extending).
