# 08 · FX and tone
In a word: effects, materials, colour grades and film post that change the mood of a shot (emphasis, weather,
horror, fights, implied violence, rivalry, light, memory) without leaving the cutout-cartoon look.

Engine: `scripts/engine/lib/fx/emphasis.js`, `atmosphere.js` (also every grade), `tone.js` (glow, silhouette and
lineart modifiers, pixel helpers), `tone-fx.js`, `action-fx.js` (also `fg: mob`), `materials.js`, plus
`scripts/engine/core.js` (modifier pipeline, `blur`, entrances) and `scripts/engine/lib/base/paint.js` (grain and
vignette) · Vocabulary: `scripts/vocab/fx-tone.json`, `scripts/vocab/fx-action.json`, `scripts/vocab/modifiers.json`,
base `KNOWN_FX` and `KNOWN_GRADES` in `scripts/spec.py` · Example films:
[`examples/tone_and_horror/spec.json`](../../examples/tone_and_horror/spec.json) and
[`examples/action_fx/spec.json`](../../examples/action_fx/spec.json), one shot per feature (render with `--sheet` to
browse) · Related cards: [01_characters.md](01_characters.md) (beans, `expr: "dead"`, poses),
[02_acting.md](02_acting.md) (`poof`, `swap`, `jitter`, tremble), [04_places.md](04_places.md) (backgrounds, other
`fg` kinds), [09_transitions_and_lens.md](09_transitions_and_lens.md) (cuts, camera, rack focus),
[../07-story-craft.md](../07-story-craft.md) (tone arcs).

## ① When to use it

| Sentence or beat | Feature |
| --- | --- |
| "Look at this", a reveal, a punchline | `rays`, `speedlines`, `sparkle`, `flash`, `splat` with text |
| Nervous, angry, landed | `sweat`, `anger`, `dust` |
| Celebration, win | `confetti`, `onomatopoeia` with `score` |
| Investigation, alone with it | `spotlight`, `spotcone`, shot `vignette` |
| Weather, setting | `rain`, `smoke`, `mist`, `birds`, `beam`, `lightning`, `fire`, `whirlpool` |
| A battle, a volley | `arrows`, `muzzle`, `shellburst`, `gas`, `explosion` |
| "It blew up" / interruption gag "we don't have time" | `boom` (puff or mushroom) / `boom` with `text` |
| "They fought", "civil war", a scuffle | `brawl` |
| "Massacre", "killed", "sacrificed" (always implied) | `blood-wipe`, `blood-streaks`, `blood-splash`, `pool`, `blood` |
| "Corruption spread", "the ink ruined it" | `spill` (`flood` to cut on it) |
| "The people revolted" | `fg: mob` |
| "Doom closed in" | `shadow-hands`, `darkness` |
| "Zapped", "struck down" / "his zeal crumbled" | `shock` / `disintegrate` |
| "The orders never arrived", "the deal collapsed" | `word-shatter` |
| "Rivals", "a battle of wills" | `duel` + `crackle`, `beam-clash` |
| "Into the darkness", "only the torch" | `lightpool` |
| "Imprisoned" / "a miracle" | `shafts` / `godbeam`, `glow`, grade `divine` |
| "He remembered", "a dark thought" | `memory` (bubble, framed shot or giant face) |
| A corrupted memory, a twist | `glitch`, `rgbsplit`, grade `mono-red` |
| Security footage, an alarm | `cctv`, `alarm`, grade `crt-cyan` |
| A portrait cracks for a death elsewhere; a screen or a window breaks; "the illusion shattered" | `crack` over the picture |
| "And you were turned to stone"; a curse freezes the viewer; an ending that addresses the viewer | `petrify` |
| "The world stopped rendering", a simulation breaks down | `hatch` (with `wash`), then cut to `bg: grid` |
| Something watches from the dark | `silhouette` modifier, `redeyes`, `eyes-white`, `wallshadow` |
| Final breath, fainting, POV | `eyelids` |
| Omen, vision, prophecy | `flameshape`, `inkburst`, `paperstorm`, grade `sepia` |
| "He died and returned to haunt them" | `material: "ghost"` + `glow` |
| "A statue was raised" / "rich beyond measure" / "in the age of myth" | `material` `stone` (`plinth`) / `gold` / `engrave` |
| "Froze to death", "put on ice" | `freeze` or `material: "ice"` |
| Characters on a map or a busy background | `sticker` |
| "The alliance broke", "heartbroken", "divided" | `split` on a heart prop, a flag or a character |
| Inside his mind | `lineart` on `bg: flat #050505` |
| Statistic dropped as an object / map note / verdict | entrances `drop-squash` / `pop-tilt` / `slam` |
| Mood of the whole shot | `grade` (presets in ③) |

## ② Look and staging rules

- Keep the house style inside effects: dark-brown ink outlines and one flat shadow tone on anything solid (pools,
  spills, splats, clouds, stickers); glows and light are soft and never outlined.
- Every effect is deterministic and seeded by the layer `id`. Give every fx layer an `id`, and a different one per
  copy, or two copies draw the same shapes.
- Full-frame effects ignore the layer position. Set `"hud": true` so the camera does not move or zoom them.
- Use modifiers and pixel grades on a few layers per shot, not on everything (cost in ⑥).
- **Dread, then scare, then deflation.** Hold a quiet shot 3-5 s with a 1 %/s push-in. Hard cut (no transition) to
  the scare: a black background, `wallshadow` or a `silhouette`, `redeyes`, a slight camera shake, held 1.5-4 s.
  Within 2-6 s of the peak, deflate with comedy: a hard cut or `flash-cut` to a warm `burst` background, a deadpan or
  `squint` face and a gag line. Never leave a scare undeflated.
- **The lurker.** Keep the threat small in the background (`silhouette`, scale 0.4-0.8), fade it in over 2-3 s
  (`enter: "fade"`, `enterDur` 2.4) while the subject stays unaware, then reveal `redeyes`.
- **Imply violence with stand-ins.** Never show a death. Use a pool, X eyes (`expr: "dead"`), a cut to black, a
  tombstone or a statistic as an object. Hold that shot 3-4 s without gags, then grade the next one `solemn`,
  `cold` or `dusk-blue`.
- **One lighting idea per dark shot:** a candle or torch (`lightpool`), a window wedge (`shafts`, `beam`) or a
  spotlight (`spotcone`), with a heavy `vignette` around it (0.6-0.85, centred on the light).
- Sizes that read at 1080p: a `pool` 400+ under a 500 px bean, `redeyes` `size` 16-38, labels over effects at least
  60 px. Keep the main character above y 0.65 when `fg: mob` is on (the heads fill the lower quarter).
- Grades recolour everything drawn in the shot, labels and HUD included. Use `"target": "bg"` or a lower `strength`
  when lettering or a character must stay clean.
- Draw order matters: `pool`, `duel`, `beam-clash` and shellbursts behind a trench lip go before the beans; `crackle`
  between eyes, `shafts`, `gas` and full-frame overlays go after them; a title goes after a `spill` flood.
- No real logos, flags of extremist movements or likenesses in emblems, mobs or memories.

## ③ Field reference

### fx layer basics

`{"type": "fx", "kind": ..., "id": ..., "x", "y", "at", "out", "hud", "scale", ...}`. Default entrance `none`. All
fx timings below are **layer time** (seconds from the layer's `at`). The layer `x`/`y` (default 0.5) is the effect's
centre unless the table says otherwise. Three placement families:

| Family | Kinds | Position and camera |
| --- | --- | --- |
| Local | emphasis, atmosphere (except `rain`), `mist`, `whirlpool`, eyes, `wallshadow`, `inkburst`, `paperstorm`, `flameshape`, war kinds, `brawl`, `blood-splash`, `pool`, `spill`, `boom` (no text), `onomatopoeia`, `word-shatter` | At the layer position, scaled by `scale`, moved by the camera unless `hud` |
| Frame space | `blood-wipe`, `blood-streaks`, `shadow-hands`, `crackle`, `lightpool`, `shafts`, `godbeam`, `spotcone` | Frame coordinates (0..1 fields); camera applied unless `hud` |
| Screen | `rain`, `glitch`, `rgbsplit`, `alarm`, `cctv`, `darkness`, `eyelids`, `beam-clash`, `duel`, `boom` with `text`, `memory`, `shock`, `disintegrate` | Whole frame, never moved by the camera (`memory` uses its own `x`/`y` as frame fractions) |

`fx` layers stay sharp under a shot's rack `focus` unless they set `"focusable": true`.

### Emphasis (`emphasis.js`)

| `kind` | Fields (defaults) | Look and timing |
| --- | --- | --- |
| `rays` | `color` rgba(255,248,215,0.25), `count` 10, `spin` 0.05 | Slowly turning god rays around the layer point |
| `speedlines` | `inner` 380, `count` 70, `color` rgba(255,255,255,0.85) | Radial anime lines from radius `inner` outward, re-seeded 12 times a second |
| `sweat` | `count` 3, `speed` 1.4 | Blue outlined drops falling 120 px and fading, `speed` cycles per second |
| `anger` | none | Red cross-popping vein mark, pulsing up to 1.15 |
| `splat` | `size` 360, `color` #1a0f0b, `text`, `textSize` 170, `textColor` #f0e6e6 | Ink splat slams in over 0.18 s (outBack) with droplets; optional text ("K.O.", "GOTCHA") |
| `flash` | `dur` 0.3, `strength` 0.9, `color` #fff | Full-frame flash fading over `dur` |
| `dust` | `count` 9, `color` #e8dcc4 | Outlined puffs spreading and fading over 0.8 s (landings, stomps) |
| `sparkle` | `count` 6, `radius` 160, `color` #fff6b0 | Four-point outlined stars twinkling inside `radius` |
| `confetti` | `count` 60 | Five-colour paper rain falling from above the frame |
| `spotlight` | `radius` 420, `strength` 0.82 | Dark vignette around the layer point, breathing ±2 % |

### Atmosphere and weather (`atmosphere.js`)

| `kind` | Fields (defaults) | Look and timing |
| --- | --- | --- |
| `fire` | `w` 600, `count` 5, `size` 220, `embers` 18, `glow` true, `step` 2 | Row of flipbook flames (3 nested tongues, new shape every `step` frames, no outline), rising embers, warm glow (`glow: false` drops it). Measured: torches on twos; a large blaze boils every 4–6 f (Rome 11:35), a furnace on threes (zombie-child short): use `step` 3–6 for big fires |
| `rain` | `density` 90, `angle` 4 | Full frame, two layers of streaks. For a gradual start use `at` + `enter: "fade"` |
| `beam` | `from` tl/tr, `width` 260, `color` #fff6d0, `strength` 0.28 | Diagonal light wedge from a frame corner (keep `x`/`y` 0.5), grows over 10 frames, flickers ±6 % |
| `birds` | `count` 5, `speed` 90, `dir` 1, `size` 26, `color` #1d1410 | V flock of "m" birds gliding at `speed` px/s, wings on twos |
| `smoke` | `w` 1400, `count` 14, `rise` 220, `color` #8a8580 | Band of grey puffs rising and fading |
| `puff` | `size` 260, `color` #efe2c8 | Older swap cloud, 0.45 s, opaque for the first 30 %. Prefer `poof` ([02_acting.md](02_acting.md)) |
| `explosion` | `size` 320, `debris` #5a4a30 (a colour) | Three-colour starburst with debris, 0.6 s |
| `blood` | `shape` pool/splat, `w` 220, `dur` 0.8 | Dark-red blob (fixed #8a0f12) with a highlight; `pool` spreads over `dur` |
| `lightning` | `h` 500, `count` 2, `color` #fff7a0 | Glowing jagged bolts re-seeded every 2 frames |
| `arrows` | `count` 6, `dir` 1, `every` 0.18 | Arrows cross the frame in 0.17 s each, staggered by `every` plus up to 0.1 s |

### Tone and horror (`tone-fx.js`)

| `kind` | Fields (defaults) | Look and timing |
| --- | --- | --- |
| `glitch` | `dur` 0.6, `looks`, `style` | `style: "corrupt"` (rows torn sideways, the lower part of the frame dropping to black, like a corrupted video file) or `"stepped"` (flat black, then grey, then white frames: a disc-swap fade) picks a measured look list; extra looks `tear`, `blackout`, `black`, `gray`, `white` can be used in `looks`. One look per frame from `looks` (default `gray-slice, gray-slice, thermal, thermal, normal, halfhue, posterize, posterize, gray-slice`); slice offsets on gray and posterize frames. Screen |
| `rgbsplit` | `dur` 0.8, `offset` 5, `strength` 0.55 | Cyan and magenta ghosts of everything drawn so far, slice jumps every 4 frames. Screen |
| `alarm` | `period` 8, `on` 5, `strength` 0.7, `color` #ff1010 | Multiply strobe, `on` frames on out of every `period`. Screen. For the slow siren of an overruled verdict (about 1 s on, 0.8 s off, continuing across cuts; Fact-Checking 19:16) use `period` 54, `on` 30, and put it in `spec.overlays` |
| `crack` | `size` 420 (radius), `spokes` 9, `rings` 2, `dur` 0.07, `color` #f4fbff, `shade` 0.18 | Cracked glass around the layer position: jagged radial spokes and broken rings with an ink edge spread in 2 frames, a milky tint and a bright impact knot. Place it over a `panel` frame or a window; seeded by `id`. Reference: a portrait glass cracks in one frame (horror biography 5:57) |
| `petrify` | `dur` 0.4, `stage2` (`dur` + 0.8), `color` #8e8a84, `strength` 0.85 | Whole visible frame: colour drains to grey, stone speckle and cracks creep in from the frame edges; at `stage2` a heavier grey and a crack across the middle. Draw it last. Reference: the myth film ends by turning the viewer to stone in two stages (21:23) |
| `hatch` | `dur` 0.4, `from` `left` (`right`, `all`), `spacing` 26, `width` 3, `color` #2a1c15 (net opacity 0.85, scaled by the layer `alpha`), `wash` (a colour washed over the frame first), `washAt` 1.0 | A cross-hatch net closes over the visible frame, after an optional pink-white wash creeps over half of it. Reference: the render collapse of a game world (WW1 30:23): half the garden washes out, then a net covers everything; follow with a cut to `bg: grid` |
| `cctv` | `label` "CAM 1", `variant` (`camcorder`: blinking REC dot + `label` "REC" top-left, a running timecode from `start` seconds bottom-left, a battery icon with `battery` 0..1 top-right, a centre crosshair; reference: a home-video overlay over a subject's good deeds, Rome 13:28) | Corner brackets, camera label, REC dot blinking at 1 Hz, scanlines. Pair with `camera.rot` for a tilted security view. Screen |
| `mist` | `w` 1400, `count` 9, `rise` 320 | Soft wisps rising and swaying over water or ground |
| `whirlpool` | `size` 420 | Top-down rotating rings contracting into a dark centre |
| `redeyes` | `gap` 60, `size` 22, `color` #ff2a2a, `bloom` 26, `on` [[a, b]], `blink` [t], `close` {`at`, `dur` 0.8} | Two glowing slanted eyes that breathe; `on` limits them to windows, each `blink` hides them for 0.12 s (4 frames); `close` narrows the eyes to a slit over the first 60 % of `dur` while they dim to off, and they stay off after |
| `eyes-white` | as `redeyes`; `color` #ffffff, `bloom` 10, `size` 26 | White slit eyes, for shadows on a wall |
| `wallshadow` | `size` 520, `grow` 1.0, `hornsAt` 0.6, `eyesAt` 1.2, `alpha` 0.88, `color` #120c0a, `eyeColor` (white) | Silhouette on the wall swells 0.8 → 1.1 over `grow` s, sprouts horns over 0.3 s from `hornsAt`, eyes pop on at `eyesAt` with a 2-frame glow flash |
| `darkness` | `dur` 4, `count` 10, `strength` 1 | Soft black blobs creeping from the edges toward the centre. Screen |
| `eyelids` | `mode` close/open/blink, `dur` 0.8 | POV almond lids. Screen |
| `inkburst` | `bursts` [0], `color` #3b2a7a, `count` 9, `spread` 300, `puddle` 260 | Ink blobs erupt for 8 frames and fall into splats; the puddle spreads over 20 frames from 0.2 s. One burst per entry |
| `paperstorm` | `count` 14, `color` #f3ead6, `ink` | Outlined sheets with text lines drifting outward and turning |
| `flameshape` | `emblem` bull/skull/eye/crown/man, `size` 320, `morphAt` 1.2, `color` #f08a1a | A fire grows until `morphAt`, crossfades over 0.2 s into an emblem silhouette (outBack 0.3 s) with a flickering gold outline and flame tongues on top |
| `gas` | `from` right/left, `dur` 3, `h` 220, `count` 26, `color` rgba(127,174,74,0.75) | Green band drifting along the horizon and swelling as it advances; covers what is under it |
| `muzzle` | `count` 6, `spacing` 220, `dir` 1/-1, `every` 0.12 | A line of shooters firing in turn: 4-point star flash and tracer, 0.09 s (about 3 frames) each |
| `shellburst` | `every` 0.4, `w` 1600, `size` 200 | Mushroom flashes popping behind a lip across width `w` |

### Action (`action-fx.js`, `materials.js`)

| `kind` | Fields (defaults) | Look and timing |
| --- | --- | --- |
| `brawl` | `size` 480, `path` [[x, y], ...], `travel` (= `dur`, 1.5 without `dur`), `dur` (endless), `end` pop/puffs, `limbs` [fist, boot, sword, spear], `skins` [hex or cast names], `stars` 5, `haze` false, `dust` true | White fight cloud with limbs and weapons poking out (any `T.PROPS` kind works as a limb), helmet heads, an angry face, popping stars; everything re-seeds on twos. `path` (frame fractions) moves it over `travel`, `haze` trails dust behind. After `dur` it pops (0.2 s) or breaks into 6 puffs. Skins from cast names use the robe colour |
| `blood-wipe` | `from` bottom/top/both, `color` #8a0a0a, `count` 9, `drips` 5, `dur` 2, `cover` false | Flame-like tongues rise in 3 frames and boil on twos, thin drips grow 6 px per frame from the opposite edge; `cover` fills the frame over the last 0.2 s of `dur` so you can cut on it |
| `blood-streaks` | `count` 7, `color` #8a0a14, `inner` #c02030 | Diagonal tapered brush strokes, each sweeping in over 2 frames, staggered 1 frame |
| `blood-splash` | `from` left/right, `count` 6, `spread` 220, `size` 1 | Teardrops fly in from off-screen on decelerating arcs (10 frames), land as spiky outlined splats ringed by droplets, each grows a drip 60 px over 1.5 s. The first splat is 1.6× larger |
| `pool` | `size` 260, `dur` 6, `color` #5a0a10, `flat` 0.32 | Flat lobed outlined pool with a shade tone, spreading (outCubic) under a body |
| `spill` | `size` 300, `dur` 2, `color` #7a1420 (ink: #2b2050), `tendrils` 0, `flood` false, `flat` 1 | One outlined stain with tendrils (growing 1.4× faster), shade and gloss; `flood` keeps growing until the frame is covered at `dur` + 1.5 s |
| `pile` | `prop` coin (any prop kind), `count` (auto: enough `size` objects to reach `level`; a smaller count scales the objects up), `size` 110, `level` 0.85, `dur` 1.2, `seed`, `body` (gap fill; #b8860b for coins) | Objects drop from above the frame (0.3 s ease-in with a spin) and settle in hex-packed rows from the bottom edge up to `level` with a 0.2 s squash-bounce, seeded order, the whole pile filling in `dur`. Full frame (visible strip in vertical films): leave `x`/`y` at 0.5. An avalanche on the quantity word, or a pile rising to a character's chin (`level` ≈ 0.6) |
| `flood` | `level` 0.85, `dur` 1.5, `color` #e8b440 (beer), `foam` #fff6dc ("" for none), `bubbles` true, `count` 26, `wave` 18 | Liquid rises from the bottom edge (ease-out) with one shadow tone in its lower half, a scalloped foam crest rolling on twos and seeded bubbles rising inside. Full frame (visible strip in vertical films) |
| `shadow-hands` | `count` 5, `dur` 1.2, `alpha` 0.55, `weapons` true, `darken` 0.4 | Clawed arm shadows (every other one gripping a spear with `weapons`) slide in from both edges (outCubic, staggered 0.1 s) while the frame darkens by `darken`; then sway 2 px at 2 Hz and flex on twos. Composited as one shadow |
| `shock` | `target`, `dur` 0.8, `color` #4fd2ff, `xray` true, `spikes` true, `count` 6 | Repaints layer `target`: normal / white / black x-ray (skull, spine, ribs) / half alpha on a seeded 2-3 frame rhythm, `count` zigzag bolts and a starburst re-seeded every 2 frames, hair standing up |
| `disintegrate` | `target`, `pieces` 20 (min 6), `ash` true, `stinger` false | Optional 2-frame blue negative stinger; shards drift out over 4 frames, turn black and fall over 12 into an ash pile with a smoke stem, which holds |
| `boom` | `size` 420, `style` puff/mushroom, `debris` 8 (a count), `text` | Puff: spark on frame 0, white-hot core grows frames 1-15, yellow then orange with debris 16-30, brown smoke and embers fade 31-42. Mushroom: stem and cap grow 15 frames, hold, fade by frame 72. `text` makes a full-frame interruption card (yellow cloud, dark rim, white disc of heavy text, `\n` for line breaks) that pops in over 6 frames |
| `onomatopoeia` | `text` "BOOOM", `size` 360, `score`, `dur` 1.5 | Grey smoke cloud, flickering red-orange-yellow star, bouncing graffiti letters; scales 0.8 → 1.1 over 12 frames, fades over the last 8 of `dur`. `score` rises green with an overshoot at frame 4 |
| `word-shatter` | `text` "ORDERS", `color` #d8242a, `size` 140, `angle` -18, `vx` 240, `burstAt` 0.9 | Extruded word pops in (0.4 → 1.1 → 1.0 by frame 5), drifts at `vx` px/s turning 0.4° per frame; at `burstAt` every glyph flies off with spin and gravity behind a yellow puff |
| `crackle` | `from`, `to` ([x, y] or bean ids; default [0.38, 0.42] → [0.62, 0.42]), `color` #ffe14a, `width` 4, `glow` 12, `jitter` 10 | Jagged glowing line re-seeded every frame with a midpoint spark. With two bean ids it runs eye to eye as a bold stare beam (`width` 14, `glow` 26, `jitter` 16) that follows the beans |
| `beam-clash` | `from` [0.15, 0.5], `to` [0.85, 0.5], `color` #7fe6ff, `bg` #2a2650, `flash` true | Full-frame rivalry backdrop: scrolling streaks, two jagged beams meeting at an orb that drifts ±80 px (1.3 s period) and toggles orb / ring / sparkle; 5-frame white flash at the start |
| `duel` | `left` 0.22, `right` 0.78, `h` 0.62, `color` #0d0a0c, `rim` #6b4a8a, `eyes` [idA, idB] / [[x, y], [x, y]] / false, `width` 14, `spark` #ffe14a | Two black masses bristling with blades behind the rivals, inner rim light, a stare beam between the eyes (bean ids anchor to the eyes) |
| `lightpool` | `follow` (layer id), `part` hand/head/center, `r` 420, `color` #ffd04a, `dark` 0.85, `open` {at, dur 0.66}; without `follow`: `x`/`y` | Darkness with a warm hole around a character; `open` grows it from 60 px; radius flickers ±5 % on twos. Follows the target's parallax `z` |
| `shafts` | `items` [{x 0.5, w 0.12, angle 25}] (default one shaft at x 0.7), `bars` 4, `color` #fff4d0, `alpha` 0.28 | Soft window light with faint bar shadows that fade by mid-frame; `x` is the floor end; drifts 1 % of the width per second |
| `godbeam` | `from` tl/tr/t, `target` [0.55, 0.7], `width` 220, `color` #fff6b0, `alpha` 0.6 | One feathered beam that grows to the target over 10 frames with a glow ellipse there |
| `spotcone` | `x` 0.5, `top` 0, `floor` 0.86, `w` 0.32, `alpha` 0.18, `dark` 0.85 | Stage cone and floor ellipse; everything outside is darkened |
| `memory` | bubble mode: `who`, `pose`, `expr`, `look`, `view`, `flip`, `legs`, `x` 0.75, `y` 0.9, `size` 520, `alpha` 0.85, `tint` #8fa6d8, `backdrop` fire/rays, `bubble` true, `tail` [0.5, 0.35], `dur` 0.66 | Tinted cast bean inside an outlined thought cloud popping in over `dur`, three shrinking circles trailing toward `tail`; `backdrop` clipped inside. `bubble: false` gives a free-floating ghost (`alpha` 0.45) |
| `memory` | shot mode: `shot`, `t` 0, `rect` [0.55, 0.1, 0.42, 0.8], `tint`, `alpha` | A frozen frame of another shot, tinted, in an ink-framed rounded panel |
| `memory` | face mode: `face` true, `who`, `expr` "evil", `look`, `view` front, `size` 600, `scale` 1.6, `x` 0.5, `y` 0.42, `dim` 0.45, `alpha` 0.65 | Darkens the scene by `dim` and adds a grey giant face (a dark thought) |

### Foreground `mob` (`"type": "fg", "kind": "mob"`)

| Field | Default | Effect |
| --- | --- | --- |
| `items` | [`pitchfork`, `torch`, `spear`, `scimitar`, `banner`, `arm`] | Tool per person, cycled; any other name throws |
| `count` | 8 | People across the width, in two rows (odd ones behind, smaller and higher) |
| `color` | #141010 | Silhouette colour; torch flames are the only coloured part |
| `h` | [200, 320] | Raised-arm height range |
| `rise` | 0.27 | Seconds each person takes to rise from below (outCubic), 2 frames apart |
| `sway` | 8 | Sway amplitude in px, on twos |

Heads and shoulders with ears, caps and brimmed hats, one arm raised and bent at the elbow. Leave `x`/`y` at 0.5.

### Layer modifiers (any layer type)

A modifier turns on when its field is set. The layer is painted offscreen and post-processed; modifiers stack in this
order: `silhouette` 10, `lineart` 20, `material` 30, `freeze` 32, `xray` 34, `split` 60, `sticker` 80, `glow` 90, `blur` 95.
They all work inside `swap` (`{"at": 1.0, "material": "stone"}` makes a statue in one frame). `at` inside
`material`, `freeze` and `split` is **shot time**.

| Field | Values (defaults) | Look and motion |
| --- | --- | --- |
| `silhouette` | "#hex" | The whole layer in one flat colour: the threat in the dark, an audience, a figure behind glass |
| `lineart` | `true` or {`color` #ffffff, `width` 4} | Outline only (computed at half resolution above 1000 px wide). With `bg: flat #050505` it is the "inside his mind" world |
| `material` | "ghost"/"stone"/"gold"/"engrave"/"ice" or {`kind`, `at`, `dur` 0.5, ...} | Recolours the layer; with `at` it crossfades from the plain layer over `dur`. Kinds below |
| `freeze` | `true` or {`at` 0, `dur` 0.2, `pad` 0.08, `tint` #bfe8ea, `color` (front face) rgba(178,226,234,0.5)} | Frosted figure inside a faceted ice block (top, side and front faces, ink edges, facets, highlights); fades in over `dur` with a 2 % pop. Stop the motion at `at` (for example `jitter: {to: at}`) |
| `xray` | `true` or {`at` 0, `dur` 0.2, `inner` (prop kind), `innerSize` (half the shorter side), `color` #7fd0ff, `alpha` 0.8, `anatomy` false, `specks` 0, `specksAt` 0, `specksDur` 1} | From `at` (shot time) the layer crossfades over `dur` into a see-through blue silhouette: a translucent tinted body with faint inner structure, a light inner rim, scan stripes rolling on twos and an ink outline, with `inner` drawn at its centre ("it is hollow inside"). `anatomy: true` draws a body x-ray inside it (skull, spine and ribs, pink lungs, a heart beating at 1.2 Hz, vessels); `specks` (count 0..200) dark grains settle into the bones one by one from `specksAt` over `specksDur` seconds (lead in the bones, a toxin building up). Order 34. Ignored on `fx` layers (`shock` uses `xray` for itself) |
| `split` | {`at` 0, `gap` 0.18, `angle` 90, `jag` 0.06, `rot` 6, `label`: "text" or {`text`, `color` #c8202a}} | Crack line 1 frame before `at`; at `at` a 1-frame squash, then the jagged halves spring apart over 3 frames (outBack) and rotate ±`rot`°, with a ribbon label in the gap. `angle` 90 is a vertical cut |
| `sticker` | `true` or {`width` 6, `color` #ffffff, `shadow` 0.25, `hover` false} | Die-cut border and soft drop shadow; `hover` bobs ±3 px every 0.8 s with a 1 px boil on twos |
| `glow` | `true` or {`color` #fffbe6, `blur` 34, `pulse` 0.1} | Soft outer glow pulsing at 0.5 Hz: gods, relics, ghosts |
| `blur` | px number or [{at, v}] timeline, `blurDim` 0.08 | Gaussian blur from 0.3 px up, slightly darkened by `blurDim`. Rack focus sets it on layers with an `id`; `sharp: true` opts a layer out |

| `material` kind | Fields (defaults) | Look |
| --- | --- | --- |
| `ghost` | `alpha` 0.55, `tint` #b9c2c8, `rim` #eef3f6, `bob` 5, `wisp` true | Desaturated, tinted, see-through, pale rim, ±`bob` px at 0.5 Hz. A ghost bean loses its legs for an S-shaped wisp tail that sways at 0.8 Hz (`wisp: false` or bean `legs: true` keeps the legs) |
| `stone` | `color` #c9bea8, `cracks` 3, `crack` #8f846f, `plinth` false, `plinthColor` #a59d8f | Grey-beige statue with seeded cracks; `plinth` adds an outlined block under the feet. Set `rock: 0` and `blink: false` on the bean |
| `gold` | `ramp` [#6a4210, #e0a828, #fff4b0], `glints` 4 | Gold luminance ramp with twinkling glints |
| `engrave` | `ramp` [#e2b57a, #6e4b2c, #4a3322], `alpha` 0.9 | Sepia engraving: ink lines turn light, fills dark brown, faint grain, the paper shows through. Leave one accent layer plain |
| `ice` | `tint` #bfe8ea | Frosted look and a gloss streak, without the block |

### Entrances from this toolkit (`enter`)

| Value | Default `enterDur` | Motion |
| --- | --- | --- |
| `drop-squash` | 0.5 | Falls in 2 frames, squashes to 150/55 on impact, rebounds to 85/115, settles by about frame 15. Statistics dropped as objects, props that land |
| `pop-tilt` | 0.22 | 0 → 1.15 → 1 with a ±5° turn. Map stickers, notes, labels |
| `slam` | 0.12 | Scales 1.6 → 1 in about 4 frames, then shakes for 0.2 s. Verdicts, mission titles, stamps |

### Colour grade (`shot.grade`)

Forms: `"preset"`, or an entry {`preset`, `at` 0, `dur` (instant), `strength` 1 or [{at, v}], `out`, `outDur` (=
`dur`), `target` frame/bg}, or a list of entries applied in order. Times are shot time. `out` fades the entry away;
`target: "bg"` grades only the backgrounds (before the layers), `frame` (default) grades the finished shot before
grain and vignette.

| Preset | Use |
| --- | --- |
| `serious` | Desaturated dark teal: ambush, investigation |
| `storm` | Grey-blue, downpour |
| `night` | Night, bluish cold |
| `solemn` | Dusty grey-brown: execution, loss |
| `warm` | Warm, comedic |
| `gold` | Golden glow, triumph |
| `sepia` | Backstory, prophecy, "long ago" (engraving parchment with a vignette); leave through `sepia-to-color` |
| `horror` | Dread interiors: desaturated maroon and a heavy vignette |
| `cold` | Grief and loss: desaturated grey-blue |
| `divine` | An apparition or a god: bright centre bloom |
| `mono-red` | Corrupted memory: grayscale world where only strong reds stay (pixel pass) |
| `rage` | Anger mid-shot, a red luminance ramp; ramp in with `{preset: "rage", at, dur: 0.5}` |
| `inferno` | The dark twin of a previous shot (pink-red ramp) |
| `golden-hour` | Departure, farewell, aftermath glory |
| `moonlit` | Night secrets, grief |
| `night-violet` | Night charge, dread |
| `gaslight` | A writer at night, candle rooms |
| `pink` | Romance, alliance, "aww": strong rose wash, magenta vignette |
| `purple-neon` | A gamer's screen-lit room |
| `crt-cyan` | Footage on a monitor, CCTV playback: desaturated cyan, scanlines, dark vignette |
| `dusk-blue` | Dignified tragedy, no gags |
| `red-flash` | A 4-6 frame impact (`at`, `out` = `at` + 0.17) or a 1 s realisation |
| `mono` | Plain greyscale. The past turned into a photograph (end of a short, with `panel` `frame: "photo"`), a memory, an archive look without sepia |
| `negative` | Colour negative (a `difference` with white). A battle title frozen as a negative for about 2 s (The Longest War 20:34); a 0.2–0.3 s flash on "what if" |
| `sunset-epic` | Founding sagas, villains arriving |
| `dusk` | Violet-rose evening after sunset, a little warm bloom low in the frame (painted look) |
| `overcast` | Grey, flat, slightly desaturated daylight: an ordinary day, a grim morning |

Presets are op lists in `T.GRADE_PRESETS` (composite fills, `vignette`, `bloom`, `pixel`); pixel ops live in
`T.GRADE_PIXEL` (`mono-red`, `ramp3`, `scanlines`).

### Film post (`style`, `shot.vignette`)

| Field | Default | Effect |
| --- | --- | --- |
| `style.grain` | true | Film grain tile re-placed 12 times a second; `false` disables. In the painted look the paper tooth rides on the grain tile; with `false` a static paper texture stays |
| `style.vignette` | 0.28 | Warm-dark film vignette strength; `false` disables |
| `shot.vignette` | none | {`strength` 0.8, `x` 0.5, `y` 0.5, `radius` 0.55, `color`} replaces the film vignette for one shot; `color` is the outer stop and overrides `strength` |
| `style.look` / `shot.look` | `classic` | `painted` turns on the painted look below for the film or one shot |
| `style.light` / `shot.light` | see below | Key light of the painted look |

### Painted look

`"style": {"look": "painted"}` renders the film with light-relative shading instead of the classic flat fills
(field contract in [03 Painted look](../03-spec-reference.md#painted-look-stylelook)). What it adds, and where:

| Piece | Engine | What it does |
| --- | --- | --- |
| Light | `base/shade.js` `T.paintState(spec, shot)` | Resolves `light` {`dir` 58 (degrees toward the light, 0 = right, 90 = up), `color` `#fff0cf`, `rim` 0.55, `ambient` `#3c2f5c`, `intensity` 0.6}; `shot.light` merges over `style.light`. core.js sets it as `T.PAINT` while a shot draws |
| Multi-tone shapes | `T.paintPrep`, `T.shadeFill`, `T.inkUnder` | Every `T.outlined` shape with an opaque hex fill (gradients, patterns and rgba fills stay as they are): deep band on the far edge, shadow band, lit base, airbrushed falloff, rim light; ink heavier on the shadow side. Bands are shifted copies of the path, so any path callback works. `T.outlined(..., {paint: false})` keeps one shape flat, `{paint: 0.45}` softens it (faces) |
| Tapered ink | `T.inkStroke(ctx, pts, {w, w0, w1, ink})` | A brush stroke along a polyline, thin at both ends: folds, wrinkles, grass, hair strands |
| Contact shadow | `T.contactShadow(ctx, x, y, rx, ry, alpha)`, layer field `contact` | Soft occlusion ellipse under grounded layers (beans and crowd members by default); a second one under the head |
| Textures | `base/textures.js` `T.TEXTURES`, `T.textureTile(kind, seed)`, `T.fillTexture(ctx, pathFn, kind, {rect, scale, rot, alpha, comp, seed})` | Seeded 256 px seamless tiles, cached per (kind, seed): `grass` strokes, `wood` grain, `stone` cobbles, `brick` running bond, `plaster` mottling, `fabric` weave, `paper` fibre, `water` ripples. Overlaid on a path or a rect |
| Painted skies | `places/paint-places.js` `T.paintSky` | Sun bloom, deeper zenith, horizon haze, 3-tone clouds (lit cap, soft volume, darker underside), grass texture on hills, textured ground with occlusion and 2-tone tufts |
| Surfaces | `T.paintSurface`, `T.BG_SURFACES`, `T.BG_FLOOR` | Per bg kind: plaster walls and wood floors (`interior`, `room`, `palace`, `hospital`), planks with grain everywhere `T.planks` is used (`office`, `stage`, `bar`), carpets, cobbled streets (`street1920`, `factory`, `city`), water (`sea`, `harbor`), parchment fibre, a wall-floor occlusion band |
| Atmospheric perspective | layer field `atmos` (`T.LAYER_MODS.atmos`) | Tints a far layer toward the haze colour (the sky's horizon by default) |
| Frame | `T.paintPost` | Key-light wash falling off to a cool, darker far side; paper tooth baked into the grain tile (static paper when `style.grain` is `false`) |

Lettering and screen furniture stay flat (`T.PAINT_EXEMPT`); `painted: true` opts one in. Classic remains the
default and is unchanged. Frame cost is under 2x classic; the bench film is `examples/painted_bench` (render its
contact sheet with the command in CLAUDE.md).

### Particles, impact and painted FX

`fx/particles.js`, `fx/impact.js`, `fx/fx-paint.js`. Every particle is a pure function of (seed, index, time): spawn
time, launch angle, speed, size and tone come from an integer hash, the position is the closed-form solution of launch
velocity + gravity + wind under linear drag, plus smooth hashed turbulence. Nothing is stepped, so frames never depend
on render order and you can scrub anywhere. Under the painted look puffs are soft lit sprites (lit cap toward the
light, shadow band, feathered edge) and fire / sparks / embers glow additively; the classic look draws flat toon marks
with ink.

**`particles`**: `{"type": "fx", "kind": "particles", "preset": "smoke", "x", "y", "rate", "spread", "life", "gravity", "wind", "at", "dur"}`

| Field | Meaning (preset default) |
|---|---|
| `preset` | `smoke`, `dust`, `sparks`, `fire`, `embers`, `steam`, `splash`, `rain`, `snow`, `debris`, `confetti`, `leaves`, `bubbles`, `gas` (`TOON.PARTICLE_PRESETS`) |
| `rate` | particles per second (up to 2000); `burst: N` (up to 5000) spawns N at once instead (debris bursts by default) |
| `life` | seconds each particle lives (each varies 0.7x to 1.3x) |
| `dir`, `spread` | launch direction in degrees (0 = right, -90 = up) and the full cone width |
| `speed` | launch speed px/s (each varies 0.55x to 1.45x) |
| `gravity`, `wind`, `drag` | px/s^2 (negative = buoyant smoke), the air speed particles drift toward (px/s), linear drag 1/s |
| `turb` | turbulence amplitude in px (smooth noise per particle) |
| `size`, `grow` | px, a number or `[min, max]`; end size / start size |
| `w`, `h`, `ox`, `oy` | emitter box and offset from the layer point (sky presets sit 600 px above it and span 2300 px: put the layer at `y` 0.5) |
| `color` / `colors` | one hex (tones are derived) or a list (base, shadow, light; fire uses a hot-to-cold ramp); lists shorter than three are expanded |
| `dur` | emission time in layer seconds (default: while the layer lives); no particle is born after it, the last ones finish their life. With `prewarm` the emitter has already run `prewarm` seconds at layer time 0 and still emits for `dur` |
| `prewarm` | `true` (one `life`) or seconds: the emitter starts already running |
| `floor`, `spin`, `opacity`, `seed` | landing line in px below the emitter (debris), rotation speed, particle opacity 0..1 (the layer's own `alpha` still fades the whole layer), seed override (default `id`) |

**Impact language**

| Kind | Fields (defaults) | What it does |
|---|---|---|
| `impact-frame` | `mode` (`invert` \| `flat` \| `flash`), `frames` (2, 1..6), `color` (paper `#f6efe2` / flash colour), `accent` (`#c8141c`, `null` = two tones), `ink`, `threshold` (0.36) | Holds for `frames` frames from the layer `at`, over the finished frame below it: `invert` negates it, `flat` posterises it to ink / accent / paper (manga hit frame), `flash` whites it out. Put it last in the layer list at the hit time |
| `streaks` | `angle` (180 = lines travel left), `count` (36), `speed` (2600), `w`, `h` (area), `len` ([160, 560]), `width` ([3, 10]), `color` (white), `ink` (dark lines), `opacity` (0.8) | Parallel speed lines sliding past (the background rushes by). Radial lines stay `speedlines` |
| `shockwave` | `size` (420 radius), `dur` (0.6), `rings` (2, 1..8), `color`, `width`, `squash`, `ground` (flattened ring + dust rolling out both ways), `dust` (false = no dust), `dustColor` | Expanding rings, soft additive band with a thin refraction edge (painted) or white ring with ink (classic) |
| `dustkick` | `target` (layer id), `times` ([layer seconds]), `size` (1), `side` (`both` \| `left` \| `right`), `color` | Dust rolls out along the ground and settles, pebbles hop. With `target` it fires at each landing of that layer (the end of every `jump`, the first touch of a `drop` entrance, the end of a `slam`, using the layer's real entrance duration) at its feet in world space, after its `swap`s, so it stays put whatever the camera does |
| `toxic-cloud` | `size` (320), `color` (`#9fb34a`), `count` (18 puffs), `dur` (2 s growth), `ground` (hugs the floor), `drift` (px/s), `wisps` (true), `opacity` (0.92) | A churning mass of lit puffs that grows in, with a sickly under-glow and gas wisps peeling off. Lead exhaust, chlorine, plague miasma |
| `aura` | `radius` (220), `color` (`#ffe27a`), `pulse` (0.08, 0..1), `rays` (10), `motes` (true) | Additive glow with slowly turning soft rays and rising glowing motes: relics, power-ups, radioactive objects. For a halo hugging a layer's own shape use the `glow` modifier |

Layer field `trail` (any layer): motion smear, see [03 Common layer fields](../03-spec-reference.md#common-layer-fields).

**Painted versions of classic kinds** (painted look only; the classic look is unchanged, `T.FX_CLASSIC` keeps the
originals):

| Kind | Painted |
|---|---|
| `smoke` | a drifting band of lit, prewarmed smoke puffs (same `w`, `count`, `rise`, `color`) |
| `fire` | a dark heat-smoke column behind, layered painted tongues (deep red rim, orange, yellow, white-hot core, each a cooling gradient, re-shaped every `step` frames), additive licking flames, a flickering glow and particle embers |
| `explosion` | flash, starburst, a fireball of hot puffs over a dark smoke billow, sparks, debris that lands, a shock ring; lasts about 2.5 s |
| `dust`, `puff` | bursts of lit dust puffs; the swap cloud as multi-tone puffs |
| `gas` | the creeping front as lit billows |

## ④ Timing

All at 30 fps. "Twos" means a new drawing every 2 frames.

| Event | Frames | Field |
| --- | --- | --- |
| Flipbook fire | new shape every 2 | `fire` `step` (3–6 for a large blaze) |
| Lightning, brawl, boils, mob sway | new shape every 2 | fixed |
| `speedlines` re-seed | every 2.5 (12 per s) | fixed |
| `flash` | 9 | `dur` 0.3 |
| `splat` slam / `dust` spread | 5 / 24 | fixed |
| `beam` / `godbeam` grow | 10 | fixed |
| `explosion` / `puff` | 18 / 14 | fixed |
| `arrows` crossing | 5 each, 5-8 apart | `every` 0.18 |
| `glitch` | 1 look per frame, 18 in all | `dur` 0.6 |
| `rgbsplit` slice jump | every 4 | fixed |
| `alarm` | 5 on, 3 off | `on` 5, `period` 8 |
| `redeyes` blink | 4 | fixed 0.12 s |
| `wallshadow` swell / horns / eye flash | 30 / 9 / 2 | `grow` 1.0, `hornsAt`, `eyesAt` |
| `eyelids` | 24 | `dur` 0.8 |
| `inkburst` fly / puddle | 8 / 20 | fixed |
| `muzzle` flash | 3 | fixed 0.09 s |
| `shellburst` grow / gone | 6 / 18 | `every` 0.4 |
| `blood-wipe` rise / cover | 3 / last 6 | `dur`, `cover` |
| `blood-streaks` stroke | 2 each, 1 apart; hold about 10 then cut | fixed |
| `blood-splash` flight / drip | 10 / 45 | fixed |
| `mob` person rise | 8, 2 apart | `rise` 0.27 |
| `shadow-hands` slide | 36, 3 apart | `dur` 1.2 |
| `shock` looks / bolts | 2-3 / re-seed every 2 | `dur` 0.8 |
| `disintegrate` drift / fall / ash | 4 / 12 / from 8 over 10 | fixed |
| `boom` puff / mushroom / card pop | 42 / 72 / 6 | `style`, `text` |
| `onomatopoeia` grow / fade | 12 / last 8 | `dur` 1.5 |
| `word-shatter` pop / puff | 5 / 18 | `burstAt` 0.9 |
| `beam-clash` opening flash | 5 | `flash` |
| `lightpool` open | 20 | `open.dur` 0.66 |
| `material` crossfade | 15 | `material.dur` 0.5 |
| `freeze` | 6 | `freeze.dur` 0.2 |
| `xray` | `true` or {`at` 0, `dur` 0.2, `inner` (prop kind), `innerSize` (half the shorter side), `color` #7fd0ff, `alpha` 0.8, `anatomy` false, `specks` 0, `specksAt` 0, `specksDur` 1} | From `at` (shot time) the layer crossfades over `dur` into a see-through blue silhouette: a translucent tinted body with faint inner structure, a light inner rim, scan stripes rolling on twos and an ink outline, with `inner` drawn at its centre ("it is hollow inside"). `anatomy: true` draws a body x-ray inside it (skull, spine and ribs, pink lungs, a heart beating at 1.2 Hz, vessels); `specks` (count 0..200) dark grains settle into the bones one by one from `specksAt` over `specksDur` seconds (lead in the bones, a toxin building up). Order 34. Ignored on `fx` layers (`shock` uses `xray` for itself) |
| `split` crack / squash / spring | 1 before / 1 / 3, settle 6 | `split.at` |
| `drop-squash` / `pop-tilt` / `slam` | 15 / 7 / 4 + 6 shake | `enterDur` |
| Grade ramp in | 15 (`dur` 0.5) for rage; 1-2 for a cut-like change | `dur`, `outDur` |
| Trauma cycle | about 28 per grade | list with `out`/`at` |
| Dread hold / scare / deflate | 90-150 / 45-120 / within 60-180 of the peak | shot `dur` |

## ⑤ Recipes

**Corrupted memory.** A bright idyllic shot (3 s), then this: a glitch, the same composition graded `mono-red`, a
blood stand-in and a `back` view.
```json
{"id": "r08_corrupt", "dur": 2.6, "grade": "mono-red", "bg": {"kind": "sky"},
 "layers": [{"type": "bean", "who": "poet", "x": 0.5, "y": 0.96, "size": 520, "view": "back"},
            {"type": "fx", "kind": "blood", "id": "r08_blood", "x": 0.62, "y": 0.92, "w": 200},
            {"type": "fx", "kind": "glitch", "id": "r08_glitch", "hud": true, "dur": 0.6}]}
```

**It is always watching.** Lurker silhouette fades in, red eyes at +2.6 s with one blink.
```json
{"id": "r08_lurker", "dur": 4.0, "grade": "horror", "vignette": {"strength": 0.85, "x": 0.6, "radius": 0.5},
 "bg": {"kind": "interior", "wall": "#5a4a40"},
 "layers": [{"type": "bean", "who": "poet", "x": 0.66, "y": 0.98, "size": 620, "expr": "sad", "pose": "think"},
            {"type": "bean", "who": "poet", "id": "r08_lurk", "x": 0.28, "y": 0.9, "size": 520, "silhouette": "#0d0907",
             "enter": "fade", "enterDur": 2.4, "blink": false},
            {"type": "fx", "kind": "redeyes", "id": "r08_eyes", "x": 0.297, "y": 0.475, "at": 2.6, "gap": 56, "size": 16, "blink": [0.8]}]}
```

**Jump scare, then deflate.** Hard cut in, `flash-cut` out to a warm burst with a deadpan face. The stiller variant the horror reference actually uses: hard cut to black with a giant face and two clawed hands, **no motion for 4.2 s**, exit through `fade-white` (13:03.2–13:07.7); stillness, not shake, carries the shock.
```json
{"id": "r08_scare", "dur": 1.6, "bg": {"kind": "flat", "color": "#050404"},
 "camera": {"zoom": [1.06, 1.1], "shake": [{"at": 0, "dur": 1.6, "amp": 4}]},
 "layers": [{"type": "fx", "kind": "wallshadow", "id": "r08_ws", "x": 0.5, "y": 1.05, "size": 980, "grow": 0.15, "hornsAt": 0, "eyesAt": 0, "alpha": 1},
            {"type": "fx", "kind": "redeyes", "id": "r08_big", "x": 0.5, "y": 0.42, "gap": 200, "size": 38, "bloom": 40}]}
```

**"A statue was raised in his honour."** One-frame swap to stone with a plinth and a dust puff.
```json
{"type": "bean", "who": "king", "id": "r08_statue", "x": 0.6, "y": 0.84, "size": 500, "pose": "hips", "rock": 0, "blink": false,
 "swap": [{"at": 1.0, "material": {"kind": "stone", "plinth": true, "cracks": 4}}]}
```

**"He returned to haunt them."**
```json
{"type": "bean", "who": "king", "id": "r08_ghost", "x": 0.66, "y": 0.78, "size": 500, "pose": "point", "expr": "angry",
 "material": {"kind": "ghost", "alpha": 0.6}, "glow": {"color": "#dff2ff", "blur": 24}, "enter": "fade", "enterDur": 0.5, "at": 0.3}
```

**"The alliance broke."**
```json
{"type": "prop", "kind": "heart", "id": "r08_heart", "x": 0.5, "y": 0.62, "size": 300, "split": {"at": 1.0, "gap": 0.2, "label": {"text": "BETRAYED"}}}
```

**"He was struck down."** Hide the target for the shock window, then bring it back dead.
```json
{"id": "r08_zap", "dur": 2.6, "bg": {"kind": "burst", "color": "#2f4f8a"},
 "layers": [{"type": "bean", "who": "hero", "id": "r08_victim", "x": 0.5, "y": 0.96, "size": 560,
             "swap": [{"at": 0.6, "alpha": 0}, {"at": 1.4, "alpha": 1, "pose": "scared", "expr": "dead"}]},
            {"type": "fx", "kind": "shock", "id": "r08_shock", "target": "r08_victim", "at": 0.6, "dur": 0.8}]}
```

**"A massacre followed."** Implied: the wipe covers the frame at 2 s, cut on the red, next shot graded `solemn`.
```json
{"type": "fx", "kind": "blood-wipe", "id": "r08_wipe", "hud": true, "from": "both", "dur": 2.0, "cover": true}
```

**"The people revolted."**
```json
{"type": "fg", "kind": "mob", "id": "r08_mob", "enter": "none", "at": 0.3, "count": 8, "items": ["pitchfork", "torch", "banner", "arm"]}
```

**"Rivals, a battle of wills."** Masses behind, stare beam after the beans.
```json
{"id": "r08_duel", "dur": 3.0, "bg": {"kind": "flat", "color": "#2a1c30"},
 "layers": [{"type": "fx", "kind": "duel", "id": "r08_masses", "hud": true, "eyes": false},
            {"type": "bean", "who": "rival", "id": "r08_a", "x": 0.3, "y": 0.96, "size": 640, "pose": "fist", "expr": "angry"},
            {"type": "bean", "who": "hero", "id": "r08_b", "x": 0.7, "y": 0.96, "size": 640, "pose": "fist", "expr": "angry", "flip": true},
            {"type": "fx", "kind": "crackle", "id": "r08_stare", "from": "r08_a", "to": "r08_b", "hud": true, "width": 14, "glow": 26, "at": 0.3}]}
```

**"Only his torch showed the way."**
```json
{"id": "r08_dark", "dur": 3.0, "bg": {"kind": "interior", "wall": "#4a3a30"},
 "layers": [{"type": "bean", "who": "hero", "id": "r08_bearer", "x": 0.4, "y": 0.96, "size": 480, "hold": "torch", "pose": "hold",
             "walk": [[0, 3]], "move": [{"at": 0, "dur": 3, "to": [0.6, 0.96], "ease": "linear"}]},
            {"type": "fx", "kind": "lightpool", "id": "r08_torch", "follow": "r08_bearer", "part": "hand", "r": 380, "open": {"at": 0.1, "dur": 0.66}}]}
```

**"It blew up."** Two booms 9 frames apart, a camera punch on the first.
```json
{"id": "r08_boom", "dur": 2.4, "bg": {"kind": "sky"}, "camera": {"punch": [{"at": 0.2, "amount": 0.12}]},
 "layers": [{"type": "fx", "kind": "boom", "id": "r08_b1", "x": 0.4, "y": 0.6, "at": 0.2},
            {"type": "fx", "kind": "boom", "id": "r08_b2", "x": 0.66, "y": 0.52, "size": 300, "at": 0.5}]}
```

**"He remembered the fire."**
```json
{"type": "fx", "kind": "memory", "id": "r08_mem", "who": "king", "pose": "think", "expr": "cry", "x": 0.72, "y": 0.86, "size": 580, "backdrop": "fire", "at": 0.4, "tail": [0.42, 0.42]}
```

**Trauma cycle.** Three grades about 28 frames each.
```json
{"id": "r08_trauma", "dur": 2.8, "bg": {"kind": "interior"},
 "grade": [{"preset": "moonlit", "strength": 0.8, "out": 0.93, "outDur": 0.05},
           {"preset": "gaslight", "at": 0.93, "dur": 0.05, "out": 1.86, "outDur": 0.05},
           {"preset": "night-violet", "at": 1.86, "dur": 0.05}],
 "layers": [{"type": "bean", "who": "hero", "x": 0.5, "y": 0.96, "size": 520, "pose": "clutch-head", "expr": "worried"}]}
```

**Night bombardment.** Shellbursts behind the trench lip, a firing line, a shake per burst.
```json
{"id": "r08_night", "dur": 3.0, "grade": "night", "bg": {"kind": "sky", "sky": "night"},
 "camera": {"shake": [{"at": 0.4, "dur": 0.3, "amp": 8}, {"at": 0.8, "dur": 0.3, "amp": 8}, {"at": 1.2, "dur": 0.3, "amp": 8}]},
 "layers": [{"type": "fx", "kind": "shellburst", "id": "r08_shells", "x": 0.5, "y": 0.62},
            {"type": "fx", "kind": "muzzle", "id": "r08_line", "x": 0.5, "y": 0.7, "count": 6},
            {"type": "fg", "kind": "rubble", "enter": "none"}]}
```

**Hellish set, clean character.** A background-only grade keeps the bean and the label untouched.
```json
{"id": "r08_hell", "dur": 2.4, "grade": {"preset": "inferno", "target": "bg"}, "bg": {"kind": "interior"},
 "layers": [{"type": "bean", "who": "hero", "x": 0.5, "y": 0.96, "size": 520, "expr": "worried"},
            {"type": "label", "text": "MEANWHILE, BELOW", "x": 0.5, "y": 0.14}]}
```

**The counted thing buries the frame** (bunkers short 0:13). On the quantity word: `{"type": "fx", "kind": "pile", "prop": "coin", "level": 0.9, "dur": 1.2, "at": 0.4}`, hold 0.5 s, then `transition: "fade-black"` into the next fact. A liquid version (a beer flood): `{"type": "fx", "kind": "flood", "color": "#e8b440", "level": 0.85, "dur": 1.5}` with a bean `tremble` in front.

**Hollow inside** (a hyped product, a fake institution): the object on a `bg: "blueprint"` or plain set, then `"xray": {"at": 1.2, "inner": "coin"}` on its layer (or no `inner` for "nothing inside") + `camera.punch` on the reveal word.

**The light in the eye goes out** (a monster or machine dies): a letterboxed close-up of `redeyes`, then `"close": {"at": 1.5, "dur": 0.8}`, hold the dark frame 2–3 s; no music sting, no gag.

**Turned to stone / the screen breaks** (an ending that addresses the viewer): `fg: "hands-fpv"` + `{"type": "fx", "kind": "petrify", "at": 0.5, "stage2": 1.4}` as the last layer; a framed portrait for a death elsewhere: `panel` `frame: "gilt"` + `{"type": "fx", "kind": "crack", "at": 1.1, "size": 260}` over it, with a rack `focus` onto the portrait first.

## ⑥ Limits and pitfalls

- Cost per 1080p frame on the reference Mac: `glow` about 100 ms, `mono-red` 65 ms, `glitch` 50 ms, `rgbsplit` 45 ms,
  `lineart` 30 ms; `engrave`, `gold`, `rage`, `inferno`, `crt-cyan` 20-60 ms (pixel passes); `material`, `sticker`,
  `split`, `freeze` 5-15 ms each; `shock`, `disintegrate` and `memory` repaint one layer offscreen. Everything else is
  under 5 ms. Keep these to a few layers per shot and render previews with `--scale 0.5`.
- Screen kinds (`glitch`, `rgbsplit`, `alarm`, `cctv`, `darkness`, `eyelids`, `rain`) and the pixel grades work on
  whatever is drawn before them. Put them after the layers they should affect; anything listed later is untouched.
- `shock` and `disintegrate` repaint `target` but do not hide it: hide it yourself (`swap` alpha 0, or `out`) for the
  same window. The target must be a layer `id` in the same shot and cannot be another `shock` or `disintegrate`; a
  wrong id throws.
- `crackle` with bean ids and `duel` eyes must come after the beans, or the beans cover the beam; `duel` itself goes
  before them, so use `eyes: false` and a separate `crackle`. `lightpool.follow` must be a layer id in the shot.
- Enum fields throw on bad values: `godbeam.from` (tl/tr/t), `mob.items`, `material` kinds, `grade.target`
  (frame/bg). `beam.from` silently treats anything but `tr` as `tl`, and an unknown `flameshape` emblem falls back to
  `bull`.
- `explosion.debris` is a colour, `boom.debris` is a count. `blood` has a fixed colour; use `pool` or `spill` for a
  custom one. `puff` is the older swap cloud; `poof` in [02_acting.md](02_acting.md) reads better.
- `memory` ignores the layer transform and the camera: its own `x`/`y`/`size` place it. Its bean needs a `who` from
  `cast`; shot mode needs an existing shot id (`T.subShot` nests at most 2 levels).
- Modifier `at` (material, freeze, split) is shot time, while fx fields (`blink`, `eyesAt`, `burstAt`) are layer
  time. Mixing them up shifts an event by the layer's `at`.
- A `frame` grade recolours lettering too. Lower `strength`, use `target: "bg"`, or put the clean label in the next
  shot. Grades do not touch film `overlays`.
- `lineart` and `silhouette` work on the alpha of the whole layer: a bean holding a prop becomes one shape. Split the
  prop into its own layer if it must stay readable.
- Path callbacks given to `T.outlined` run twice; effects that add new shapes must draw all random values before the
  path function (the engine already does this for the shipped kinds).
- Never show a death on screen or use real-world extremist symbols in emblems, banners or crowds.
