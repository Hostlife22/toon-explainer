# 04 · Places: backgrounds, skies and foreground framing
In a word: give every shot a painted set (landscape, town, interior, studio, mood backdrop) with its own parallax planes, and frame it with a dark foreground so the frame always reads in three depths.

Engine: `scripts/engine/lib/places/backgrounds.js`, `scripts/engine/lib/places/scenery.js`, `scripts/engine/lib/places/foreground.js`, `scripts/engine/lib/places/places-war.js`, `scripts/engine/lib/places/places-world.js`, `scripts/engine/lib/places/places-towns.js`, `scripts/engine/lib/places/places-sets.js`, `scripts/engine/lib/places/places-rooms.js` · Vocabulary: `scripts/vocab/places.json`, `scripts/vocab/places-sets.json` and the base sets `KNOWN_BGS`, `KNOWN_SKY`, `KNOWN_FG` in `scripts/spec.py` · Example films: [`examples/places_tour/spec.json`](../../examples/places_tour/spec.json) (landscapes, towns, war, dread), [`examples/sets_rooms/spec.json`](../../examples/sets_rooms/spec.json) (one shot per mood, palace, studio, room and set variant), [`examples/showcase/spec.json`](../../examples/showcase/spec.json) (sky, forest, city, interior, parchment with foreground framing); render with `--sheet` to browse · Related cards: [01_characters](01_characters.md) (staging beans, `topbean` on a `floor`), [03_props_creatures_vehicles](03_props_creatures_vehicles.md) (vehicles, `crate`, `banner` and other set dressing), [05_maps](05_maps.md) (maps on `parchment`), [08_fx_and_tone](08_fx_and_tone.md) (grades, atmosphere fx, the `fg` kind `mob`), [09_transitions_and_lens](09_transitions_and_lens.md) (the `fg` POV masks `binoculars`, `spyglass`, `eye-pov`) · Main guides: [spec contract](../03-spec-reference.md), [visual grammar](../02-visual-grammar.md), [reference breakdown](../01-reference-breakdown.md).

## ① When to use it

| Story beat / sentence | Background (`bg.kind`, variant) | Foreground (`fg`) |
| --- | --- | --- |
| Cold open, "long ago", a date card | `sky` (`sunset`, `dusk`, `rays`), `parchment-panel` | `ledge`, `grass` |
| "They marched through the forest", ambush | `forest` | `canopy` + `bushes` |
| Village, market, cheering crowd | `city` (`style` `stone` or `wood`), `street1920` | `grass`, `lamp-post` |
| Throne room, "the ruler decided", court intrigue | `palace` (`ochre`, `red`, `polychrome`, `gothic`), `interior`, `minoan` | `ots`, `bg-front` (`fgColumns`) |
| Reaction close-up, character intro, emotion flip | `mood` (`rays` preset by emotion), `burst` | none |
| "He was stunned" / villain's scheme / numb silence | `mood` `swirl` / `vortex` / `smoke` | none |
| Romance, fond memory, "aww" | `mood` `bokeh` with `petals` | none |
| Hype, chaos held as one pose | `mood` `splat`, `streaks`, `action` | none |
| "A new era began", "its own civilization", "meanwhile life went on" | `mood` `nebula`, `ornament`, `collage` | none |
| Stalemate, siege, waiting | `trench`, `trench-section`, `sky` with `timelapse` | `trench-wall`, `sandbags` |
| Attack, aftermath, "the war was lost" | `battlefield`, `burning` (`plain`, `city`, `palace`) | `barbed-wire`, `rubble` |
| Fleet, crossing, departure, farewell | `sea`, `harbor`, `underwater` | `foam` |
| Dread, horror, inner mind | `corridor`, `void` (`flesh`, `stage`, `boil`), `graveyard`, `alley` | `bars`, `trunk` |
| Fact-check host, storyteller bookend | `office`, `room` `gamer` | `hands-fpv` |
| Looking out from inside a vat, a box, a cell or a window | any outdoor or set bg | `aperture` (`bars` for a window) |
| "They explained it on air", verdict, "sold to the highest bidder" | `studio` (`news`, `podcast`, `courtroom`, `auction`, `gameshow`, `quiz`, `classroom`) | `bg-front` |
| News reaching home, "night after night", illness, poverty | `room` (`living`, `bedroom`, `hospital`, `parlour`) | `bg-front`, `window-grid` |
| Imprisoned, secret visit | `cell` | `bg-front` (bars) or `bars` |
| A plan, a tactic, "everything was connected" | `blueprint`, `chalkboard`, `corkboard` | none |
| Changing era or topic through a painting | `gallery` | none |
| Journey, "on the way to..." | `vehicle-interior` (`train`, `bus`, `plane`) | none |
| Antiquity scene, leisure of the elite, "pushed out of power" | `antique` (`colonnade`, `balcony`, `temple-square`, `bath`), `olympus` | `bg-front` (balcony slab) |
| East Asian history | `eastcity`, `karst`, `palace` `red` | `grass` |
| "Alone in his room", argued in circles, top-down aftermath | `floor` (any `material`) + `topbean` | none |
| Desert, mountains, cave, gorge | `desert`, `mountains` (`peaks`, `cave`, `gorge`) | `ledge` |
| Industry, a regime's factories | `factory` (`banner`) | none |
| Stage show, theatre metaphor | `stage` | `curtains` |
| Watching through a window, rain outside | any exterior | `window-grid` |
| AI-painted or photographic plate | `image` | any |
| Title card, plain colour | `flat` | none |

## ② Look and staging rules

- **Three planes in every shot.** Foreground `fg` at `z` 1.2–1.6 covering 10–25 % of the frame and darker than the midground; characters and props at `z` 1; the background paints its own far planes. A lone character on an empty backdrop is acceptable only for `mood`/`burst` reactions and title cards.
- **Backgrounds parallax themselves.** Each kind draws its planes through the camera at fixed factors: sky 0.15, clouds 0.3, far hills or mountains 0.3–0.45, mid set pieces 0.55–0.85, ground and walls 1, near pieces 1.1–1.3. A camera `zoom`/`pan` therefore separates the planes for free; keep the default drift `zoom [1, 1.04]` or more.
- **One key light from the upper left.** Interiors carry a 6–10 % white light wedge from the upper left and a matching shadow wedge; keep added props and fx consistent with it.
- **Line weight.** Set detail lines are thinner and lighter (`#5a4030`, 2–4 px) than the character ink (`#2a1c15`, 5–6 px), so characters pop off the set. Gradients only in skies, glows and mood backdrops; everything else is one flat colour plus one flat shadow tone.
- **Sky palette carries tone.** `sunset` for warm storybook beats, `day` for neutral, `dusk`/`night`/`storm`/`teal` for cold investigative beats, `sepia` for the trenches, `overcast` for grey fact and industry. Cloud style: `streak` slices for `sunset`/`dusk`, outlined `cumulus` otherwise.
- **Flicker on twos, never tween.** Flames, lanterns, CRT glow, window lights and mood bolts re-seed every 2–3 frames; only scrolls, drifts and rotations move smoothly.
- **Staging behind a set piece.** A figure "behind" a bench, desk, podium, sofa or balustrade stands with its feet hidden under it, and the shot adds one `bg-front` fg layer after the figure (see ③).
- **Safe frame.** Keep lettering between `y` 0.15 and 0.85; a camera zoom of 1.05 crops 2.5 % off every edge, and `fg` framing eats the corners.
- **No real insignia.** Use `factory` `banner` and the `banner` prop with a plain disc for regimes and factions; never recreate real extremist symbols. `burning` `bodies` and `battlefield` `bodies` stay as debris and pools, never gore.

## ③ Field reference

### How a background is read

| Field / rule | Effect |
| --- | --- |
| `shot.bg` | One object or a list; a list is painted in order (later entries on top). Missing `bg` = `{"kind": "sky"}`. An object with `image` and no `kind` is `image`. |
| `kind` | One of the names below. Unknown kinds fail validation. |
| time | Background animation runs on **shot time** (from the cut), not layer time. |
| `seed` | Extra seed string for the seeded layout (clouds, trees, notes, splats). Read by `sky`, `forest`, `city`, `mood`, `palace`, `burning`, `studio`, `room`, `floor`, `cell`, `harbor`, `alley`, `antique`, `parchment-panel`, `corkboard`, `vehicle-interior`. Other kinds are seeded by the shot id only. |
| `vignette` | Edge darkening 0–1 for `mood`, `studio`, `room`, `floor`, `alley`, `antique`, `corkboard`, `vehicle-interior` (defaults below). `palace` (0.3, night 0.55), `cell` (0.6), `harbor` (0.3, night 0.5) and `burning` (0.45) use fixed values. |
| shot `grade` with `"target": "bg"` | Tints only the backgrounds ([08_fx_and_tone](08_fx_and_tone.md)). |
| shot `focus` with `"on": "bg"` | The background takes part in rack focus ([spec contract](../03-spec-reference.md)). |
| `preset` validation | Checked against the sky presets only for `sky` and `city`. Other kinds that pass a `preset` to the sky crash at render time on an unknown name. |

### Sky presets (`preset`)

| Preset | Look | Cloud style | Notes |
| --- | --- | --- | --- |
| `sunset` | Pink to cream, sun low left | `streak` | Storybook default for warm beats |
| `day` | Blue to pale, sun upper right | `cumulus` | Default for `sky`, `city`, `eastcity`, `desert`, `mountains`, `street1920` |
| `dusk` | Navy to violet to peach | `streak` | |
| `night` | Navy with 140 twinkling stars | `cumulus` | Default for `graveyard` |
| `storm` | Grey-blue, no sun disc | `cumulus` | |
| `teal` | Dark teal to mint | `cumulus` | Cold investigative tone |
| `sepia` | Khaki-cream (trench war) | `cumulus` | Default for `trench`, `trench-section`, `battlefield` |
| `overcast` | Flat grey, no sun disc | `cumulus` | Default for `karst`, `factory`; forced by `street1920` `grey` |

`palette` overrides any preset key: `stops` (4 gradient colours), `sun` `[x, y]`, `glow`, `hills` (3 colours), `ground`, `cloud`, `cloudHi`, `cloudUnder`, `wisp`, `stars` (bool), `cloudStyle`.

### Open air: `sky`, `forest`, `city`

**`sky`** (planes: gradient, sun, stars, rays 0.15 · clouds 0.3 · hills 0.45 / 0.63 / 0.81 · trees, water, ground 1)

| Field | Default | Effect |
| --- | --- | --- |
| `preset` | `day` | Sky preset above |
| `palette` | none | Preset overrides |
| `horizon` | 0.62 | Hill base line (frame fraction) |
| `sun` | preset's | `[x, y]` glow centre and ray origin |
| `rays` | false | God rays from `sun`, turning 0.03 rad/s |
| `stars` | preset's | Force stars on any preset |
| `clouds` | 0 | Count, or `true` = 6; each cloud also brings 2 wisps |
| `cloudStyle` | preset's (`cumulus` if unset) | `streak` or `cumulus` |
| `wind` | 8 | Cloud drift px/s (each cloud 0.6–1.6 ×, wisps 1.6 ×) |
| `hills` | 3 | Ridge count, or `false`. Far ridges get aerial perspective, a lit rim and brush strokes |
| `groundY` | 0.8 | Ground line |
| `ground` | `grass` | `grass` (tufts), `sand`, `stone`, `dirt`, `snow`, `paddy` (rice terraces with dikes and seedlings), any `#hex`, or `false` |
| `trees` | none | `[[x, y, h], ...]`, trunk base and height as frame fractions (`h` 0.35 = a third of the frame; `h` > 1.5 fails validation) |
| `water` | none | `{y: 0.82, color: "#5fa8d0"}` band with drifting dashes |
| `timelapse` | none | `true` or `{dayDur: 1.6, shades: false}`: a smiling sun arcs across, then a crescent moon (`shades` gives it sunglasses); the gradient blends day to night and stars come out. Replaces the preset gradient and sun glow |

**`forest`** (planes: backdrop 0.2 · trunk rows 0.35 / 0.6 / 0.85 · ground 1)

| Field | Default | Effect |
| --- | --- | --- |
| `sky` | `#e9e6b8` | Light between the trunks |
| `haze` | `#9aa86a` | Fog tone over the far rows |
| `leaf` / `hi` | `#5a7a2a` / `#8a9a58` | Canopy fill and crescent highlight strokes |
| `trunk` | `#4a4436` | Near trunk colour (forked near trunks) |
| `ground` / `groundY` | `#4d5a2c` / 0.84 | Floor |
| `path` | true | Dirt path toward the centre |
| `rays` | true | Light rays from the upper left (screen space) |

**`city`** (planes: sky at horizon 0.55 with 2 hills · far houses 0.55 in haze · near houses 0.8 · plaza 1)

| Field | Default | Effect |
| --- | --- | --- |
| `preset` / `palette` / `clouds` | `day` / none / 4 | Passed to the sky |
| `style` | `stone` | `stone` (plaster, red roofs, tiled plaza) or `wood` (log cabins, grass) |
| `temple` | true | Temple in the centre of the near row |
| `ground` / `groundY` | by style / 0.78 | Plaza colour and line |

### Flat, graphic and paper backdrops

| Kind | Fields (defaults) | Look and motion |
| --- | --- | --- |
| `flat` | `color` (`#fff`) | Plain fill in screen space (no parallax) |
| `image` | `image` (path relative to the spec; `src` also works), `overscan` 1.08, `z` 1, `filter` (canvas CSS filter, e.g. `"saturate(1.1)"`) | Cover-fit image on one plane |
| `parchment` | `color` (paper), `z` 1 | Paper with 26 seeded stains and a brown edge burn; base for maps |
| `burst` | `color` `#2f8f8a`, `center` `#bfe8d8`, `edge` `#0f2f35`, `at` [0.5, 0.5], `wedges` true | Radial reaction gradient, 14 faint wedges turning 0.08 rad/s, 60 drifting specks. Plane 0.3 |
| `parchment-panel` | `color` `#d9a06a`, `frame` true, `torn` true, `ornament` true | Full-frame torn tan sheet, mauve inner shadow bottom-left, grain, dark wood frame, round ornament top-right. For engraving backstories |
| `blueprint` | `sketch` [], `stamp`, `tilt` -1.5 (deg), `color` `#3d7fd0` | Blue grid sheet on a plank table with a pencil. `sketch` items (coordinates normalized to the sheet): `{line: [[x,y],...], at, dur}` draws along the polyline, `{circle: [x, y, r], at, dur}` (`r` as a fraction of the sheet width) sweeps an arc, `{text, x, y, size: 54, at, dur}` fades in. `dur` default 0.8 s. `stamp` is a boxed text top-right |

Blueprint boards in the reference replace the whole drawing on each beat (about 12 drawings inside one 70 s shot, WW1 2:40–3:50): stack several `blueprint` backgrounds as separate shots, or swap `sketch` with `swap`, rather than only adding items.
| `chalkboard` | `lines` [{`text`, `at`, `size` 64}], `wall` `#d8c8a0`, `board` `#3c4a3a`, `floor` `#8a6a45` | Wall-mounted board; each line types in over 0.4 s, default `at` = index × 0.6 s |
| `corkboard` | `board` `cork` or `felt`, `notes` 12, `strings` [], `sign`, `vignette` 0.35 | `notes` is a count of seeded notes or a list of strings / `{text, at, color}` (`""` = scribble, `\n` splits lines). Notes are cream, yellow, pale blue or grey photos, tilted ±8°, each pinned; a note with `at` pop-tilts in over 0.2 s. `strings`: `[from, to, at]` note indices, a sagging red string drawn over 0.3 s. `sign`: hand-lettered cardboard title. Any other `board` value throws |

### `mood`: emotion backdrops

`{"kind": "mood", "variant": "rays", ...}` · default variant `rays` · plane 0.3 (`action`, `collage` 0.4; `ornament` 0.5). Every variant takes `vignette`.

| `variant` | Fields (defaults) | Look and motion |
| --- | --- | --- |
| `rays` | `preset` `gold`, `rays` 28 (even, min 6), `spin` 4 °/s, `center` [0.5, 0.5], `bloom` 0.15 (× width), `soft` 6 px, `pulse` false, `colors` [a, b], `vignette` 0.35 | Alternating wedges blurred `soft` px, white bloom at the centre; `pulse` breathes the bloom ±6 % at 1 Hz. The lighter colour becomes the wedges |
| `swirl` | `colors` [`#5fb6cf`, `#2b6d86`], `center` [0.5, 0.5], `spin` 4, `soft` 12, `vignette` 0.5 | Seven blurred spiral ribbons |
| `vortex` | `center` `#8c5ad0` (a colour here), `edge` `#2c1c5a`, `at` [0.5, 0.5], `spin` 4, `vignette` 0.45 | Radial gradient with five soft spiral smoke arms |
| `smoke` | `color` `#3a5aa8`, `vignette` 0.45 | 12 light and 4 dark blobs of one hue, blurred 20 px, drifting about 12 px/s |
| `bokeh` | `from` `#c86bd8`, `to` `#f5d6f5`, `count` 14, `petals` false, `vignette` 0.2 | Vertical gradient, soft discs rising 6 px/s; `petals` adds 26 pink petals drifting down-right 30–50 px/s with ±15 px sway |
| `petals` | as `bokeh` | Shorthand for `bokeh` with `petals: true` |
| `splat` | `base` `#fbf3d8`, `colors` [`#f39aa0`, `#f6c26b`, `#ffd9e0`], `count` 20, `vignette` 0.12 | Paint splats with satellites and drips. Static |
| `grunge` | `color` `#e0502a`, `dark` `#7a2010`, `vignette` 0.6 | Flat colour, lighter centre, speckles and blots. Static |
| `streaks` | `colors` [`#b8202a`, `#7a1018`, `#8fc59a`], `dir` -1, `speed` 60, `vignette` 0.4 | Darkest colour is the base; 52 rounded bars scroll `speed` × 0.6–1.4 px/s |
| `action` | `base` `#3a2a28`, `vignette` 0.35 | Band of orange puffs boiling ±6 % on twos, 8 zigzag bolts re-seeding every 3 frames |
| `nebula` | `colors` [`#7a2a7a`, `#e0a0e0`], `stars` 8, `vignette` 0.3 | Purple haze, four-point sparkles twinkling for 6 frames every 1.2–2.8 s |
| `ornament` | `colors` [`#e8a33a`, `#c86a1c`, `#c0305a`], `tile` 96 (48–200), `vignette` 0.55 | Tiled 8-point star and meander pattern; behind a floating map or scroll |
| `collage` | `palette` (5 pastels), `base` `#fbf3e4`, `vignette` 0.15 | 46 seeded pastel flowers and leaves |

`rays` presets: `gold`, `green`, `blue`, `purple`, `yellow`, `crimson`, `cyan`, `lime`, `split` (blue left, red right, 40 px seam, white wedges), `rainbow` (six hues). Emotion map: gold = glory, green = power-up, blue = sadness or a ghost, purple = ominous, crimson = rage, `split` = two-sided argument, `rainbow` = madness. Unknown presets and variants throw.

### Interiors and sets

**`interior`** (one plane at 0.85, floor included)

| Field | Default | Effect |
| --- | --- | --- |
| `wall` / `trim` / `floor` / `floorY` | `#e9c99a` / red / `#a8784d` / 0.78 | Wall, trim (also the drape colour), floor, floor line (perspective planks) |
| `window` / `windowSky` | none / `day` | `[x, y, w, h]` normalized rect showing a sky preset gradient (a preset name, validated) |
| `columns` / `columnColor` | none / `#efe6d4` | Fluted columns at `x` fractions; `#d9a84a` for gold |
| `drapes` | none | Swaying drapes at `x` fractions |
| `dado` / `dadoH` / `dadoTrim` | `#7a1a14` / 0.2 / `#d9a84a` | Wine panel at the wall bottom with a gold line (also a gold line at y 0.1); `dado: false` removes both |
| `light` / `wedges` | true / [[0.15, 0.18], [0.55, 0.12], [0.82, 0.08]] | Diagonal shadow wedges `[x0, w]` |
| `shine` | true | Floor highlights |
| `lattice` | false | Red throne-room lattice on the wall |

| Kind | Fields (defaults) | Look · planes |
| --- | --- | --- |
| `office` | `wall` `#a8673a`, `planks` (vertical; `horizontal`), `window` `porthole` (`arched`, `grid`, `none`), `windowX` 0.72, `lamp` false, `carpet` `#7a2a22`, `floorY` 0.78, `desk` true, `deskX` 0.5, `chair` true | Plank wall, window, carpet, green-shade lamp with warm pool · wall 0.85, desk and tufted chair 1 (behind characters) |
| `gallery` | `frames` [{`x` 0.5, `y` 0.38, `w` 0.36, `h` 0.4}], `wall` `#e9dcc0`, `dado` `#6b4a2e`, `floor` `#a8784d`, `floorY` 0.82 | Gilt frames; each frame takes `image` (path, preloaded) or a `top`/`bottom` gradient (`#86c3ee`/`#9fb86a`) and an optional `plaque` text · 0.9 |
| `stage` | `color` `#8a1a1a`, `back` `#2a1210`, `floor` `#8a5a32`, `spots` [0.35, 0.65] | Plank floor, spotlight pools, red side curtains and scalloped valance · 0.9 |
| `bar` | `brick` false, `wall` `#8a5a32`, `lamps` [0.25, 0.5, 0.75], `counter` true, `counterY` 0.78, `mugs` [0.18, 0.62, 0.86] | Plank or brick wall, two bottle shelves, pendant lamps · wall 0.85, counter with mugs 1.1 (still behind characters) |
| `hospital` | `beds` 3 (per side), `wall` `#cfe0d4`, `floor` `#b9c0c4` | Pale ward, three windows, beds seen from the foot end · 0.9 |
| `minoan` | `columns` [0.12, 0.38, 0.62, 0.88] | Striped wall bands, disc frieze, downward-tapering red columns · wall 0.9, perspective checker floor 1 |
| `olympus` | `throne` true, `throneX` 0.5, `column` true | Light sky with rays, marble throne on steps, broken column, cloud floor · 0.3 / 0.8 / 1 |
| `corridor` | `vp` [0.5, 0.46], `stone` `#5b554a`, `floor` `#4a4640`, `sky` `#1c2a3a`, `torches` 2 (pairs), `thread` false | One-point stone tunnel, torches with warm pools, black vanishing point; `thread` = Ariadne line · 0.9 |
| `cell` | `window` [0.72, 0.2] or false, `floorY` 0.8, `cold` false, `torch` 0.2 (x) or false, `shaft` true, `bars` true, `barColor` `#8a6a2a` | Slate blocks, small barred window, light shaft striped by the bars (cold blue with `cold`), flickering wall torch · walls 0.8, shaft 0.9, bars 1.3 with a warm rim near the torch (front plane) |
| `vehicle-interior` | `vehicle` `train` (`bus`, `plane`), `scenery` `mountains` (`city`, `sea`, `steppe`), `speed` 60, `windows` (train/bus [[0.55, 0.25, 0.35, 0.35]], plane two ovals), `seat` `#3c8f8a`, `seatShade`, `sway` 1.5 (deg), `picture` true (train), `vignette` 0.3 | Train: wood wall and framed picture; bus: grab rail with straps; plane: pale wall, oval windows, passing clouds. Far bands scroll with parallax; every 0.5 s a near tree or pole crosses in 6 frames with 4 blur copies. The whole set rocks at 0.8 Hz around a pivot below the frame · 1 |
| `floor` | `material` `planks`, `rot` 0, `light` [], `props` [], `vignette` 0.3 | Top-down floor rotating about the centre (see below) · 1 |

`floor` details:
- `material`: `planks`, `tiles` (`colors` [`#e8e0cc`, `#8a6a4a`], `tile` 120 px), `rug` (planks under a bordered rug), `grass` (mow stripes), `flowers` (`colors`, 4 defaults), `dirt` (`pit` [0.5, 0.5] or false), `coffers` (hexagonal), `water` (dashes drift 15 px/s, swirl rings), `stone`. Unknown materials throw.
- `rot`: degrees, number or `[{at, v}]` timeline.
- `light`: `[[x, y, w, h, angle], ...]` additive window patches with a cross of mullions; `angle` default 30.
- `props`: `[{kind, x, y, rot, scale, color}]`, kinds `bed`, `chair`, `table`, `box`, `rug`; drop shadow down-right. Unknown kinds throw.
- Characters on a floor use `topbean` ([01_characters](01_characters.md)).

**`palace`** · `{"kind": "palace", "variant": "ochre", "columns": [0.12, 0.34, 0.66, 0.88], "throne": {"x": 0.5, "h": 600, "color": "#b3202a"}, "floorY": 0.8}` · planes: wall 0.6, floor/columns/throne 1, light shafts 0.9, `fgColumns` 1.2

| `variant` | Look |
| --- | --- |
| `ochre` (default) | Roman ochre wall with red bands and gold trim, dentil frieze, arched niche behind the throne, gold fluted columns, polished floor with column reflections |
| `red` | East Asian red lacquer columns with dark bands, glowing lattice windows between them, lanterns flickering on twos |
| `polychrome` | Minoan blue/white/red bands, spiral rosette frieze, white columns tapering downward, checker floor in perspective |
| `gothic` | One-point hall: pointed windows, receding pillars, red carpet up three steps to a smaller throne (`h` default 300), red side curtains at 1.2 (`curtains` true). Ignores `columns`, `fgColumns`, `shafts` |

Other fields: `night` (navy wall and floor, lanterns lit, vignette 0.55), `throne` `false` or `{x, h, color}`, `fgColumns` [x...] (thick near columns, front plane), `shafts` (three warm light shafts with dust drifting 14 px/s). Throne base sits at `floorY` + 0.55 × (1 − `floorY`) (0.91 by default); the seat top is 0.36 × `h` px above it (about `y` 0.71 with defaults).

**`studio`** · `{"kind": "studio", "variant": "gameshow", ...}` · `vignette` 0.3 · back wall 0.6 (`news` 0.45), front pieces 1 to 1.3

| `variant` | Fields (defaults) | Look and motion · front plane |
| --- | --- | --- |
| `gameshow` (default) | `sign`, `podium` true, `podiumX` 0.74, `confetti` false | Purple gradient, light pillars pulsing at 0.5 Hz, diagonal spotlight · podium with a teal sign plate, confetti (1.1) |
| `quiz` | `screen`, `podiumX` 0.9 | Blue grid wall, half-ring corners, big bezel screen · ring-stack podium |
| `news` | `deskY` 0.8, `tags` true, `tag` `BREAKING NEWS` | Night skyline whose windows toggle 2 % every 12 frames · curved anchor desk, corner tags BREAKING NEWS and LIVE (dot blinks at 1 Hz) |
| `courtroom` | `benchY` 0.62 | Wood panels with pilasters, backlit arched window · raised bench and witness box |
| `auction` | `title` `LOT 1` (`\n` for lines), `paddles` [{`x` 0.5, `num`, `at`}] | Red striped wall, framed landscape, title easel · lectern, audience heads (1.3), paddles popping up over 6 frames with `outBack` |
| `podcast` | `mics` [0.44, 0.56] | Wood slat wall, plants · table with boom-arm microphones at chin height, papers, headphones |
| `classroom` | `lines` [{`text`, `at`, `size` 60}] or strings | Chalkboard whose lines type in over 0.4 s (default `at` = index × 0.6), window light wedge · teacher desk, pupil desks (1.3) |

**`room`** · `{"kind": "room", "variant": "gamer", ...}` · `vignette` 0.35 · walls 0.6, furniture 1, front pieces 1–1.3

| `variant` | Fields (defaults) | Look · front plane |
| --- | --- | --- |
| `gamer` (default) | `tv` true, `screen`, `lamp` true, `neon` | Violet walls, tilted posters, CRT on a stand (6 % scanlines, glow ±5 %), console, two beanbags, floor-lamp wedge, red curtain; `neon` adds a magenta glowing sign · none |
| `living` | `wall` `#9a6a42`, `window` `dusk` or false, `tv` true, `screen`, `sofa` true, `cycle` | Plank wall, oval red rug, fireplace with a flipbook fire, TV on a cabinet · sofa back at 1.3 |
| `bedroom` | `window` `night`, `lampsOff` [t...], `quilt` false, `cycle` | Plum bed, two bedside lamps, dark door; each `lampsOff` time switches a lamp off and darkens the room 40 % over 4 frames · quilt at 1 (only with `quilt: true`) |
| `hospital` | `monitor` true, `bed` true, `iv` true, `cycle` | Blue-grey wall, garden window with white curtains, IV stand with a half-full bag and a tube to the bed, heart monitor trace beating · blue blanket at 1.3 |
| `parlour` | `wear` 0 (0–1), `window` `sunset`, `cycle` | Wainscot wall, oval mirror, dresser with a candle, fireplace, curtained window; `wear` adds damp stains · none |

Window skies: `day`, `dusk`, `sunset`, `night`, `garden`. `cycle: true` alternates day and night every second (22 frames hold, 8 frames crossfade) for "night after night". `screen` (in `quiz`, `gamer`, `living`): the `id` of another shot rendered live inside the frame, `{shot, t}` to freeze it at time `t`, or plain text (`{text}` also works). A shot cannot show itself.

### Landscapes, towns and dread sets

Sky pass-through: kinds marked † forward `clouds` (4), `cloudStyle`, `palette` and `stars` to their sky; ‡ also forward `sun`; § forward `clouds`, `cloudStyle`, `palette` only.

| Kind | Fields (defaults) | Look · planes |
| --- | --- | --- |
| `trench` † | `preset` `sepia`, `night` false, `horizon` 0.5, `lip` 0.62, `wire` true, `burning` false, `back` true | Inside a trench: pale mountains (0.4), no-man's-land with craters and wire and the opposite lip (0.65), back wall of jagged earth slabs (0.9). `burning`: flame strip plus black smoke on the lip. `night`: night sky and blue palette |
| `trench-section` † | `preset` `sepia`, `horizon` 0.36, `trenchX` 0.5, `dugout` true | Side cutaway: surface line, trench with fire-step, lit dugout · 1 |
| `battlefield` † | `preset` `sepia`, `horizon` 0.5, `hill` `#8a7a50`, `ground` `#6b5f3a`, `crater` `#4a4128`, `craters` 14, `trees` 4 (count of dead trees), `wire` false, `fires` 0, `bodies` 0, `bodyColor` `#77735e`, `haze` false | No-man's-land or aftermath: hill (0.45), ground with craters, dead trees, tufts (0.8). `bodies` = red-pool heaps, `fires` = flame count, `haze` = `true` (amber) or any CSS colour, screen space |
| `sea` † | `preset` `turquoise` (`storm`, `fog`, `night`, `sunset`), `horizon` 0.55, `cliffs` (`left`, `right`, `both`), `cliffColor` `#d9b77a`, `islet` [x] (lighthouse), `waves` 40, `mist` (auto for `fog`/`storm`) | Horizon sea with crests drifting about 20 px/s · cliffs and islet 0.5, water 0.85. Sea presets pick their own sky; unknown presets throw |
| `underwater` | `top` `#4fb4e0`, `bottom` `#123a6a` | Gradient with light shafts (0.3), sand, swaying seaweed, rising bubbles (0.8) |
| `void` | `variant` `black` (`color` `#0a0908`), `spots` (`color` `#2f8f9a`, `spot` rgba), `boil` (`color` `#3a0c34`, purple noise re-seeded on twos), `flesh` (`pillars` 6, dripping organic columns at 0.4–1.0), `stage` (`at` 0.5, spotlight cone on a cobble pool, 0.9) | Horror and inner-mind stages. `black`, `spots`, `boil` are screen space. Unknown variants throw |
| `graveyard` ‡ | `preset` `night`, `horizon` 0.62, `hill` `#1f2a44`, `ground` `#1a2238`, `stone` `#8a96aa`, `fence` true | Hills (0.5), three rows of tombstones and crosses, fence, ground mist (0.85) |
| `eastcity` ‡ | `preset` `day`, `horizon` 0.62, `roof` `#4a4a50`, `gold` false, `pagoda` true, `balustrade` true, `ground` `#d8cbb0` | Far ridge (0.35), halls with red columns and upturned eaves and a pagoda (0.65), paved ground with a marble balustrade (1) |
| `karst` ‡ | `preset` `overcast` (`sunset` tints the peaks), `horizon` 0.66, `paddy` true, `river` true, `pagoda` [x], `ground` `#8a9a78` | Misty pointed peaks at 0.25 / 0.45 / 0.7 with fog bands, paddies and river (1) |
| `desert` ‡ | `preset` `day`, `horizon` 0.6, `cacti` 0 | Three dune bands (0.4 / 0.65 / 0.9), cacti (1) |
| `mountains` ‡ | `variant` `peaks` (`cave`, `gorge`), `preset` `day`, `horizon` 0.66, `ground` `#7f9a5a`, `at` 0.5 (cave x) | Snow-capped peaks (0.3 / 0.55); `cave` = arch with a dark mouth, `gorge` = two cliff walls (1) |
| `factory` § | `preset` `overcast`, `horizon` 0.72, `color` `#3c3f45`, `banner` (colour) | Block skyline with window grids and smoking chimneys (0.7); `banner` hangs a plain-disc banner |
| `street1920` § | `preset` `day`, `horizon` 0.7, `domes` [0.3, 0.7], `obelisk` (x), `grey` false | Domes and obelisk (0.6), ochre palazzi with arched windows (0.85), cobbles (1). `grey` = depression grade with an overcast sky |
| `harbor` | `time` `sunset` (`day`, `night`, `fog`; `night: true` also works), `horizon` 0.55, `ship` true, `shipX` 0.22, `sail` `#f2ead8`, `pierX` 0.5, `flare` true | Low sun with bloom, rings and lens-flare discs, or moon and stars at night (0.15); sea with drifting dashes and a moored ship bobbing 4 px over 2.2 s (0.6); plank pier receding to the horizon (1). Unknown `time` throws |
| `alley` | `windows` 0.4 (lit fraction), `barrel` true, `barrelX` 0.5, `boxes` true, `snow` false, `vignette` 0.8 | One-point brick walls to a slot of night sky (0.3 / 0.85); fire barrel with a flickering cone, boxes, trash can, drainpipe (1) |
| `antique` | `variant` `colonnade` (`balcony`, `temple-square`, `bath`), `sky` (`sunset` for colonnade/balcony, `day` otherwise), `columns` 3 (colonnade), `slabY` 0.74 (balcony), `vignette` 0.3 | `colonnade`: fat fluted columns before a brick wall with sun-shadow bands and potted plants. `balcony`: sunset with god rays over a valley; the cream balustrade slab runs diagonally across the lower third at 1.3 (front plane). `temple-square`: nine-column temple, red-roof houses, paved square. `bath`: aqueduct arches, blue pool, steam rising 20 px/s. `sky` takes any sky preset |
| `burning` | `variant` `plain` (`city`, `palace`), `night` true, `horizon` 0.6 (`city` 0.5), `smoke` 0.22 (lower edge of the smoke ceiling), `temple` (x), `cityX` 0.66, `bodies` 0 | Crimson-to-red sky with a black billowing smoke ceiling drifting 10–18 px/s (0.15); two rows of magenta mountains (0.35); `plain` = cracked orange plain with a flame band; `city` = dark hill with a burning roofline; `palace` = palace wall with eave roofs, roof flames, two smoke columns (0.7). `bodies` = shield, helmet and spear debris heaps, no gore. Flames re-seed on twos, glow ±6 % |

### Foreground framing (`type: "fg"`)

Common rules: put `fg` after the characters and before the lettering. Leave `x`, `y` at 0.5: the drawing covers the full frame around the layer origin. Parallax `z` 1.2–1.6. The default entrance is `none`: framing is there from the cut, as in the reference; set an `enter` only when the framing itself should arrive. `id` seeds the layout of `bushes`, `canopy`, `grass`, `rubble`, `sandbags`, `trench-wall`, `barbed-wire` and `foam`; give two layers of the same kind different ids.

| `kind` | Look | Fields (defaults) |
| --- | --- | --- |
| `bushes` | Dark leaf clumps, three per corner, the biggest in the corner | `sides` [`bl`, `br`] (any of `bl`, `br`, `tl`, `tr`), `color` `#3e4b2a`, `hi` `#5d6e3a` |
| `canopy` | Seven dark tree crowns hanging from the top edge | `color` `#2f3a22`, `hi` `#4c5c33` |
| `ledge` | Diagonal ledge rising from one side | `surface` `stone` (or `grass`, which adds tufts), `side` `left`, `h` 0.22 (frame fraction), `color` (`#c9b49a` stone, `#6e7a34` grass), `count`, `hi` (tufts) |
| `grass` | Tall tufts along the bottom edge with lit blades, swaying ±6 px | `count` 26, `h` 150 (px), `color` `#5a6a2a`, `hi` `#e8b23a` |
| `trunk` | Tree trunk at the frame edge | `side` `left`, `inset` 90 (px from the edge), `color` `#4a3a2c` |
| `ots` | Over-the-shoulder: large dark back of a head and shoulders, mirrored to look into the frame | `who` (cast name, validated), `look` (overrides), `side` `left`, `tone` 0.45 (darkening) |
| `rubble` | Stones along the bottom | `count` 9, `color` `#8e8578` |
| `sandbags` | Three staggered rows of rounded bags | `h` 0.2, `color` `#9a917c` |
| `trench-wall` | Jagged earth slabs with a lit bevel and cracks | `h` 0.28, `color` `#3d3222`, `bevel` `#6e5c3c` |
| `window-grid` | Glass haze, reflection streaks and mullions (watching through a window) | `cols` 4, `rows` 3, `mullion` 28 (px), `color` `#3a2a22`, `haze` `rgba(255,255,255,0.3)` (any CSS colour) |
| `bars` | Prison bars with a warm torch rim | `count` 7, `color` `#2a2622`, `rim` `rgba(255,190,90,0.55)`, `crossbar` true |
| `barbed-wire` | X posts every 200 px with looping wire along the bottom | `h` 110 (post height, px); the wire base sits 0.08 of the frame above the bottom edge. Leave `y` unset (see ⑥) |
| `curtains` | Red theatre curtains framing both sides, gently swaying | `color` `#8a1a1a`, `width` 0.18 (each side) |
| `foam` | Scalloped white cloud or foam band along the bottom | `rim` `#9fc4e8` (outline) |
| `hands-fpv` | First-person gloved hands rising from the bottom corners with a bob | `color` `#f6f2ea` (glove), `sleeve` `#5a6a8a` |
| `lamp-post` | A street lamp as a vertical band near one edge | `side` `right` |
| `aperture` | Looking out from inside: a dark frame over the whole screen with one rectangular or rounded hole, an ink rim and one lighter bevel tone around the hole, optional vertical window bars | `hole` [0.2, 0.18, 0.6, 0.64] (`[x, y, w, h]` fractions of the visible frame; in vertical films of the strip), `radius` 0 (px), `color` `#120c09`, `edge` true (ink rim + bevel), `bars` 0 (count), `barWidth` (3 % of the hole width, at least 18 px); ignores `x`, `y`, `scale`, `z` and the camera (fixed to the screen) |
| `bg-front` | Redraws the shot background's front plane over everything drawn so far | none; ignores `x`, `y`, `scale`, `z` (the plane keeps its background parallax) |

`bg-front` front planes:

| bg | Front plane |
| --- | --- |
| `palace` | `fgColumns`; the `gothic` side curtains |
| `studio` | `gameshow` podium and confetti, `quiz` ring podium, `news` desk and corner tags, `courtroom` bench and witness box, `auction` lectern, heads and paddles, `podcast` table and microphones, `classroom` teacher desk and pupil desks |
| `room` | `living` sofa back, `hospital` blanket, `bedroom` quilt (only with `quilt: true`) |
| `cell` | the bars |
| `antique` | the `balcony` balustrade |

The background also draws its front plane itself, so a shot without `bg-front` still looks complete. `office` desk, `bar` counter and `olympus` throne have no front plane: they always stay behind the characters.

Other `fg` kinds live in other toolkits: the POV masks `binoculars`, `spyglass` and `eye-pov` in [09_transitions_and_lens](09_transitions_and_lens.md), and the crowd silhouette band `mob` in [08_fx_and_tone](08_fx_and_tone.md).

## ④ Timing

All values at 30 fps. Background motion runs on shot time.

| Motion | Measured value | Field |
| --- | --- | --- |
| Sky cloud drift | 8 px/s × 0.6–1.6 per cloud, wisps 13 px/s | `wind` |
| Sky god rays | 0.03 rad/s turn | `rays` |
| Time-lapse day | 1.6 s per full day (sun half 24 frames, moon half 24 frames) | `timelapse.dayDur` |
| Accelerating time-lapse (measured) | first day ~4.5 s, first night ~0.8 s, then ~1.0–1.2 s per day; a map version flips ~0.7 s lit / 0.3 s dark (Reconquista 10:34, Rome 37:48) | `dayDur` is constant: cut to a second shot with a smaller `dayDur` to accelerate |
| Burst wedges / specks | 0.08 rad/s; specks 20–60 px/s | `burst` |
| Interior drapes | ±10 px sway, period about 5 s | `drapes` |
| Fg grass sway / hands bob | ±6 px, period 3.9 s / ±10 px, period 3.1 s | `grass`, `hands-fpv` |
| Sea crests / harbor dashes | about 20 px/s scaled by depth / about 15 px/s | `sea`, `harbor` |
| Harbor ship bob | 4 px over 2.2 s | `ship` |
| Underwater bubbles | rise 60–140 px/s | `underwater` |
| Void boil, burning flames, lanterns, torch, CRT | re-seed on twos (every 2 frames), glow ±5–8 % | `void` `boil`, `burning`, `palace`, `cell`, `room` |
| Mood rays spin / pulse | 4 °/s (6–8 for frantic); bloom ±6 % at 1 Hz | `spin`, `pulse` |
| Mood action bolts | re-seed every 3 frames; puffs boil on twos | `action` |
| Mood nebula twinkle | 6 frames, every 1.2–2.8 s per star | `stars` |
| Mood streaks | `speed` 60 px/s × 0.6–1.4 | `speed`, `dir` |
| Bokeh discs / petals | rise 6 px/s / fall 30–50 px/s with ±15 px sway | `bokeh`, `petals` |
| Gameshow light pillars | ±10 % at 0.5 Hz; confetti falls 120–200 px/s | `gameshow` |
| News skyline / LIVE dot | 2 % of windows toggle every 12 frames / blinks at 1 Hz | `news` |
| Auction paddle, corkboard note | pop in 6 frames (0.2 s) with `outBack` | `paddles[].at`, `notes[].at` |
| Corkboard string | draws in 9 frames (0.3 s), ease in-out | `strings[2]` |
| Chalkboard / classroom line | types in 12 frames (0.4 s); default stagger 18 frames | `lines[].at` |
| Blueprint sketch item | draws or fades in 24 frames (0.8 s) by default | `sketch[].dur` |
| Bedroom lamp off | room darkens 40 % over 4 frames | `lampsOff` |
| Window day/night cycle | 22 frames hold + 8 frames crossfade, 1 s per phase | `cycle` |
| Hospital monitor | one beat every 1.25 s | `monitor` |
| Vehicle interior | sway at 0.8 Hz; a near pole or tree every 15 frames, crossing in 6 frames | `sway`, `speed` |
| Palace dust / bath steam | 14 px/s / 20 px/s | `shafts`, `bath` |
| Burning smoke ceiling | 10–18 px/s | `smoke` |

Hold rules: hold a `mood` backdrop at least 1.5 s so the spin reads, and swap the `rays` preset with a cut, not a dissolve, when the emotion flips. A `blueprint` board can carry 8–20 s with the camera drifting if each consequence cuts away. Establishing places hold 2–4 s with `zoom [1, 1.04–1.06]`.

## ⑤ Recipes

**Waiting in the trench (stalemate, siege).** Camera drift 3–4 s, worried soldier behind the wall.
```json
{"bg": {"kind": "trench"}, "camera": {"zoom": [1, 1.04]},
 "layers": [{"type": "bean", "who": "soldier", "size": 950, "x": 0.45, "y": 1.18, "expr": "worried"},
            {"type": "fg", "kind": "trench-wall", "z": 1.3, "enter": "none"}]}
```

**Over the top (attack).** 3 s, crowd crosses the wire, camera shakes on the first impact.
```json
{"bg": {"kind": "battlefield", "wire": true}, "camera": {"shake": [{"at": 1.2, "dur": 0.4, "amp": 14}]},
 "layers": [{"type": "crowd", "who": "soldier", "x": 0.2, "y": 0.92, "count": 7, "rows": 2, "spread": 1200, "size": 300, "march": true,
             "move": [{"at": 0, "dur": 3, "to": [0.7, 0.92], "ease": "linear"}]},
            {"type": "fg", "kind": "barbed-wire", "z": 1.4, "enter": "none"}]}
```

**Time-lapse siege ("they waited a week").** 4–10 s; a cannon fires every 1.5 s ([03_props_creatures_vehicles](03_props_creatures_vehicles.md)).
```json
{"bg": {"kind": "sky", "timelapse": {"dayDur": 1.6, "shades": true}, "hills": 2, "clouds": 0},
 "layers": [{"type": "vehicle", "kind": "cannon", "x": 0.3, "y": 0.86, "size": 420, "fire": [0.8, 2.3, 3.8]}]}
```

**Invasion fleet.** Turquoise sea between cliffs, staggered boats; the next shot is the map with the region flipping.
```json
{"bg": {"kind": "sea", "preset": "turquoise", "cliffs": "both"},
 "layers": [{"type": "vehicle", "kind": "caravel", "x": 0.1, "y": 0.74, "size": 420, "drive": [[0, 3.5]], "move": [{"at": 0, "dur": 3.5, "to": [0.45, 0.74], "ease": "linear"}]},
            {"type": "vehicle", "kind": "junk", "x": -0.1, "y": 0.86, "size": 520, "drive": [[0, 3.5]], "move": [{"at": 0.4, "dur": 3.1, "to": [0.3, 0.86], "ease": "linear"}]}]}
```

**Character intro or reaction on a mood backdrop.** Preset by emotion; label after the bean.
```json
{"bg": {"kind": "mood", "variant": "rays", "preset": "purple", "pulse": true}, "camera": {"zoom": [1, 1.06]},
 "layers": [{"type": "bean", "who": "king", "size": 1100, "y": 1.25, "expr": "smug"},
            {"type": "label", "text": "THE TYRANT", "tag": "KING", "x": 0.72, "y": 0.3, "at": 0.6}]}
```

**The verdict (figure behind a set piece).** Judge feet hidden under the bench top at 0.62, then the front pass.
```json
{"bg": {"kind": "studio", "variant": "courtroom"},
 "layers": [{"type": "bean", "who": "judge", "size": 480, "x": 0.5, "y": 0.76, "view": "front", "pose": "point"},
            {"type": "fg", "kind": "bg-front"},
            {"type": "label", "text": "GUILTY", "x": 0.5, "y": 0.2, "at": 1.0}]}
```

**News reaching home ("they saw it on TV").** The living-room TV plays the news shot live; the sofa back crops the viewer.
```json
{"bg": {"kind": "room", "variant": "living", "screen": "k07_news", "window": "night"},
 "layers": [{"type": "bean", "who": "citizen", "size": 700, "x": 0.3, "y": 1.05, "view": "back"},
            {"type": "fg", "kind": "bg-front"}]}
```

**Throne hall, ruler decides.** Ochre palace with shafts, near column through `bg-front`; the king sits on the throne (seat top about `y` 0.71, `sit` puts the feet 0.1 × `size` below it); push in toward the throne.
```json
{"bg": {"kind": "palace", "variant": "ochre", "shafts": true, "fgColumns": [0.04]},
 "camera": {"zoom": [1, 1.06], "focus": [0.5, 0.6]},
 "layers": [{"type": "bean", "who": "king", "size": 520, "x": 0.5, "y": 0.77, "view": "front", "pose": "sit"},
            {"type": "fg", "kind": "bg-front"}]}
```

**Conspiracy plan ("everything was connected").** Notes pop in, strings follow the narration.
```json
{"bg": {"kind": "corkboard", "sign": "THE PLAN", "notes": [{"text": "STEP 1", "at": 0.2}, {"text": "???", "at": 0.8}, {"text": "PROFIT", "at": 1.4}, ""],
        "strings": [[0, 1, 1.0], [1, 2, 1.6]]}}
```

**Blueprint tactic.** Sketch times follow the narration: road, label, X marks the spot.
```json
{"bg": {"kind": "blueprint", "stamp": "SARAJEVO, 28 JUNE",
        "sketch": [{"line": [[0.08, 0.72], [0.45, 0.62], [0.92, 0.66]], "at": 0, "dur": 1},
                   {"text": "BRIDGE", "x": 0.45, "y": 0.55, "at": 0.8},
                   {"circle": [0.62, 0.64, 0.04], "at": 1.6}]}}
```

**Corridor dread.** Back-view bean walks toward the vanishing point under a serious grade; cut to `void` for the inner-mind beat.
```json
{"bg": {"kind": "corridor", "thread": true}, "grade": {"preset": "serious", "strength": 0.6},
 "layers": [{"type": "bean", "who": "hero", "size": 700, "x": 0.5, "y": 1.0, "view": "back", "walk": [[0, 3]],
             "move": [{"at": 0, "dur": 3, "to": [0.5, 0.8], "scale": 0.6, "ease": "linear"}]}]}
```

**Gallery entry (changing era or topic).** Host points at the plaque; push in on the frame, then `fade-white` into the painted scene.
```json
{"bg": {"kind": "gallery", "frames": [{"x": 0.62, "y": 0.38, "w": 0.36, "h": 0.42, "plaque": "THE TREATY"}]},
 "camera": {"zoom": [1, 1.12], "focus": [0.62, 0.38]},
 "layers": [{"type": "bean", "who": "host", "size": 620, "x": 0.22, "y": 0.96, "pose": "point"}]}
```

**Storyteller bookend.** Office without the desk, a book, first-person hands.
```json
{"bg": {"kind": "office", "window": "porthole", "lamp": true, "desk": false},
 "layers": [{"type": "prop", "kind": "book", "x": 0.5, "y": 0.62, "size": 420},
            {"type": "fg", "kind": "hands-fpv", "enter": "none"}]}
```

**Night after night / the powers did nothing.** Bedroom lamps switch off on the beat.
```json
{"bg": {"kind": "room", "variant": "bedroom", "lampsOff": [1.2, 2.0], "quilt": true, "cycle": true},
 "layers": [{"type": "bean", "who": "king", "size": 520, "x": 0.5, "y": 0.82, "view": "front", "expr": "sleepy"},
            {"type": "fg", "kind": "bg-front"}]}
```

**Journey ("on the way to...").** Travellers rock with the carriage: `swing` matches `sway`.
```json
{"bg": {"kind": "vehicle-interior", "vehicle": "train", "scenery": "steppe", "speed": 90},
 "layers": [{"type": "bean", "who": "hero", "size": 640, "x": 0.25, "y": 1.02, "pose": "sit", "swing": {"at": 0, "amp": 1.5, "period": 1.25, "decay": 0}}]}
```

**Forest march (three planes).** Canopy and bushes framing a marching column.
```json
{"bg": {"kind": "forest"}, "camera": {"zoom": [1, 1.05], "pan": [[0, 0], [60, 0]]},
 "layers": [{"type": "crowd", "who": "soldier", "x": 0.5, "y": 0.95, "count": 6, "rows": 2, "spread": 1400, "size": 320, "march": true},
            {"type": "fg", "kind": "canopy", "z": 1.4, "enter": "none"},
            {"type": "fg", "kind": "bushes", "sides": ["bl", "br"], "z": 1.5, "enter": "none"}]}
```

**Looking out from inside the vat.** The world seen through a rounded hole; push the camera so the outside drifts while the frame holds.
```json
{"bg": {"kind": "sky", "preset": "day"}, "camera": {"zoom": [1, 1.08]},
 "layers": [{"type": "bean", "who": "brewer", "size": 600, "x": 0.5, "y": 0.92, "expr": "shock"},
            {"type": "fg", "kind": "aperture", "hole": [0.2, 0.15, 0.6, 0.6], "radius": 40, "bars": 2}]}
```

## ⑥ Limits and pitfalls

- **`barbed-wire` reads `y` twice.** The kind uses `y` both as the layer position and as the wire height above the bottom edge, so setting `y` moves the whole drawing. Leave `y` unset; change `h` or `z` instead.
- **`ledge` with `surface: "grass"` and a custom `h`.** The tufts reuse `h` as their pixel height, so `h` 0.2 gives invisible blades. Keep the default `h` for grass ledges, or add a separate `grass` fg layer.
- **`sky` water under the ground.** The ground band is painted after `water` and starts at `groundY` (0.8), above the default water line (0.82). Set `ground: false` or a `groundY` below `water.y`, or the water is hidden.
- **Trees float or sink.** `trees` bases above `groundY` hover over the hills; bases far below it lose their trunks under the ground band. Put the base at `groundY` or up to 0.05 below.
- **Unchecked presets.** `preset` is validated only for `sky` and `city`. A typo in `trench`, `battlefield`, `desert`, `graveyard` and the other sky-backed kinds passes `spec.py` and crashes at render. `sea` and `harbor` have their own preset lists and throw a clear error.
- **`center` means two things in `mood`.** It is a point in `rays` and `swirl` but a colour in `vortex` (whose point is `at`).
- **No front plane for some sets.** `office` desk, `bar` counter, `olympus` throne, `hospital` beds and `minoan` columns are part of the background; a bean cannot stand behind them. Use `studio` sets, `room`, `palace` `fgColumns`, `cell`, `antique` `balcony`, or an `fg` kind for that.
- **`bg-front` redraws every background in a list.** With `bg: [a, b]`, each entry that has a front plane is drawn again; order the list so the wanted front plane is on top.
- **`palace` `gothic` ignores** `columns`, `fgColumns` and `shafts`, and its throne defaults to `h` 300.
- **Fixed vignettes.** `palace`, `cell`, `harbor` and `burning` ignore `vignette`; lift a too-dark corner with a lighter `grade` or `fx: beam`.
- **`flat` and `void` `black`/`spots`/`boil` ignore the camera.** Zoom pushes and shakes show no movement on them; add an `fg` layer or particles if the move must read.
- **`interior` is a single plane.** Wall and floor move together at 0.85; the depth must come from `fg` (`ots`, `trunk`) and columns.
- **Screens nest at most twice.** `screen` and `T.subShot` render another shot; a shot cannot show itself and nesting deeper than 2 throws. Point `screen` at a short, simple shot.
- **Lettering on busy sets.** `news` corner tags and the `mood` bloom sit where labels often go; place labels at `y` 0.2–0.3 and away from the tags, and put them after `bg-front` so they stay on top.
- **Workaround for a missing set.** Use `image` with an AI-painted plate ([../04-ai-assets.md](../04-ai-assets.md)), then frame it with `fg` so the plate still gets three planes.
