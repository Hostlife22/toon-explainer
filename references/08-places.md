# 08 · Places v4: mood backdrops, palaces, studios, rooms and travel interiors

Thirteen backgrounds measured on the reference library (empire history, China, Greek myth, Reconquista, both world wars, horror biography, fact-check show). Every one paints three depth planes through the camera (sky or wall 0.15–0.6, set pieces 1, foreground 1.2–1.3), takes one key light from the upper left (a 6–10 % white wedge on the walls) and draws its detail lines thinner and lighter than the character ink. Random placement is seeded by the shot, and anything that flickers (flames, lanterns, TV glow, window lights) re-seeds on twos.

Showcase: [examples/v4_places/spec.json](../examples/v4_places/spec.json), with one shot per kind and variant (52 shots).

Engine: `scripts/engine/lib/places4.js` (mood, palace, burning, studio) and `scripts/engine/lib/places5.js` (room, floor, cell, harbor, alley, antique, parchment-panel, corkboard, vehicle-interior).

## Foreground pass: `{"type": "fg", "kind": "bg-front"}`

Backgrounds are always painted before the layers, so a judge behind a bench or a prisoner behind bars needs a second pass. Add one `bg-front` fg layer after the characters. It redraws the foreground plane of the shot's background (with that background's own parallax) over everything drawn so far. Put labels after it so they stay on top. The background also draws the plane itself, so a shot without the fg layer still looks complete.

| bg | Foreground plane |
| --- | --- |
| `palace` | `fgColumns`, and the `gothic` side curtains |
| `studio` | the `gameshow` podium and confetti, the `quiz` ring podium, the `news` desk and corner tags, the `courtroom` bench and witness box, the `auction` lectern, audience heads and paddles, the `podcast` table and microphones, and the `classroom` teacher desk and pupil desks |
| `room` | the `living` sofa back, the `hospital` blanket, and the `bedroom` quilt (only with `quilt: true`) |
| `cell` | the bars |
| `antique` | the `balcony` balustrade |

Staging rule: a figure "behind" a piece stands with its feet hidden under it. For example, a judge `y` 0.76 with `size` 480 stands behind the bench, whose top is at 0.62. A news anchor `y` 1.06 with `size` 700 stands behind the desk, whose top is at `deskY` 0.8.

## `mood`: emotion backdrops (burst v2)

`{"kind": "mood", "variant": "rays", ...}`. The plane sits at z 0.3, so it barely moves with the camera. Every variant takes `vignette`.

| `variant` | Fields (defaults) | Look and motion |
| --- | --- | --- |
| `rays` | `preset` (`gold`), `spin` 4 °/s, `rays` 28, `center` [0.5, 0.5], `bloom` 0.15 (fraction of the width), `soft` 6 px, `pulse` false, `colors` [a, b] (overrides the preset) | Alternating wedges blurred `soft` px, a white bloom at the centre and a 35 % edge vignette. `pulse` breathes the bloom ±6 % at 1 Hz. |
| `swirl` | `colors` [`#5fb6cf`, `#2b6d86`], `spin` 4, `center`, `soft` 12, `vignette` 0.5 | Seven marbled spiral ribbons wound around the centre. |
| `vortex` | `center` `#8c5ad0`, `edge` `#2c1c5a`, `at` [x, y], `spin` 4 | A radial gradient with five soft spiral smoke arms. |
| `smoke` | `color` `#3a5aa8` | Twelve light blobs and four dark ones in one hue, blurred 20 px, drifting 10–20 px/s. |
| `bokeh` | `from` `#c86bd8`, `to` `#f5d6f5`, `count` 14, `petals` false | A vertical gradient with soft discs rising 6 px/s. `petals: true` adds pink petals drifting down and right at 30–50 px/s with a ±15 px sway. The variant `petals` is shorthand for this. |
| `splat` | `base` `#fbf3d8`, `colors` (3), `count` 20 | Paint splats with satellites and drips. Static. |
| `grunge` | `color` `#e0502a`, `dark` `#7a2010` | Flat colour with a lighter centre, speckles, dark blots and a heavy vignette (0.6). Static. |
| `streaks` | `colors` [`#b8202a`, `#7a1018`, `#8fc59a`], `dir` -1, `speed` 60 | Rounded bars over the darkest colour, scrolling `speed` px/s. |
| `action` | `base` `#3a2a28` | A band of orange puffs that boil ±6 % on twos, and zigzag bolts that re-seed every 3 frames. |
| `nebula` | `colors` [`#7a2a7a`, `#e0a0e0`], `stars` 8 | Purple haze and four-point sparkles that twinkle over 6 frames, staggered. |
| `ornament` | `colors` (3 warm tones), `tile` 96 (48–200) | A tiled 8-point star and meander pattern with a dark vignette, behind a floating map or scroll. |
| `collage` | `palette` (5 pastels), `base` `#fbf3e4` | Seeded pastel flowers and leaves. |

Presets for `rays`: `gold`, `green`, `blue`, `purple`, `yellow`, `crimson`, `cyan`, `lime`, `split` (blue left, red right, 40 px seam) and `rainbow` (six hues around the circle). The darker tone becomes the base and the lighter tone the wedges.

When to use:
- Character intro or reaction close-up: `rays`. Choose the preset by emotion: gold for glory, green for a power-up, blue for sadness or a ghost, purple for something ominous, `split` for a two-sided argument, `rainbow` for madness.
- "He was stunned", "it dawned on her": `swirl`. A villain's scheme: `vortex`. A cold or numb silence: `smoke`.
- "Aww", romance, alliance by marriage, fond memories: `bokeh` with `petals`.
- Hype or over-the-top excitement: `splat`. Colour-coding each speaker in an argument (swap per line): `grunge`.
- A fight or chaos held as a single pose: `streaks` or `action`.
- "A new era began", or a floating map: `nebula`. "Its own civilization": `ornament`. "Meanwhile, life went on": `collage`.

Pair `mood` with a `grade` that has `"target": "bg"` to tint only the backdrop.

## `palace`: throne hall

`{"kind": "palace", "variant": "ochre", "columns": [0.12, 0.34, 0.66, 0.88], "throne": {"x": 0.5, "h": 600, "color": "#b3202a"}, "floorY": 0.8}`

| `variant` | Look |
| --- | --- |
| `ochre` (default) | Roman. Ochre wall with red bands and gold trim, a dentil frieze, an arched niche behind the throne, gold fluted columns and a polished floor with column reflections. |
| `red` | East Asian. Red lacquer columns with dark bands, glowing lattice windows between them and hanging lanterns that flicker on twos. |
| `polychrome` | Minoan. Blue, white and red wall bands, a spiral rosette frieze, white columns that taper downward and a red, white and blue checker floor in perspective. |
| `gothic` | One-point hall. Tall pointed windows on the back wall, receding pillars, a red carpet up three steps to the throne, and red side curtains with gold trim (`curtains` true). |

Other fields: `night` (navy wall and lattice, lanterns lit), `throne: false`, `fgColumns` [x...] (thick near columns at z 1.2, drawn by `bg-front`), and `shafts` (three warm light shafts with drifting dust). The throne is a pointed gold arch with a red tufted back, gold studs, a cushion and armrests. Its seat sits at about `floorY` + 0.36 × `h`.

When to use: "the ruler decided", court intrigue, a coronation, "meanwhile in the palace" (`night`), a sulking king (`gothic`).

## `burning`: city or inferno plain

`{"kind": "burning", "variant": "plain", "horizon": 0.6, "temple": 0.75, "bodies": 3, "night": true, "smoke": 0.22}`

- `plain`: a cracked orange plain with a three-row flame band along the horizon.
- `city`: a dark hill with a burning roofline (`cityX` 0.66) and an orange glow on the hillside.
- `palace`: a long palace wall with eave roofs, a flame row along the roofline, two rising smoke columns and a paved courtyard.

The sky runs from crimson to red at the horizon, with a black smoke ceiling (`smoke` is the y of its lower edge) drifting 10 px/s. Each row of billows is one merged mass with the same crescent shade on every billow; the front row has an ink outline and a fire-lit underside. Two rows of magenta mountains sit at z 0.35. `temple` puts a small columned silhouette on the ridge. `bodies` scatters battlefield debris in the foreground as stand-ins for the fallen, with no gore: a dropped round shield, a helmet and a spear stuck in the ground, mirrored and recoloured per heap. Flames redraw on twos and the glow flickers ±6 %.

When to use: "the city fell", "the war was lost", "everything burned". Keep gags out of these shots.

## `floor`: top-down

`{"kind": "floor", "material": "planks", "rot": 0, "light": [[0.6, 0.25, 0.18, 0.35, 25]], "props": [{"kind": "bed", "x": 0.3, "y": 0.5}]}`

- `material`: `planks`, `tiles` (`colors`, `tile` 120), `rug` (planks under a big bordered rug), `grass` (mow stripes), `flowers` (`colors`), `dirt` (`pit` [x, y] or false), `coffers` (hexagonal), `water` (dashes drift 15 px/s, with slow swirl rings) or `stone`.
- `rot`: degrees, a number or a `[{at, v}]` timeline. The whole floor rotates about the centre, for a rotating overhead shot.
- `light`: window patches `[x, y, w, h, angle]` with a cross of mullions, additive.
- `props`: top-down furniture `bed`, `chair` (leg nubs, red cushion, curved spindle back, armrests), `table` (with papers), `box` (open flaps, tape, a book and cloth inside) or `rug`, each with `x`, `y`, `rot`, `scale` and `color`. They cast drop shadows down and to the right.

When to use: "they argued in circles", loneliness ("alone in his room"), aftermath on the floor, surveillance from above, "nothing but open sea" (`water`). Characters on a floor use the `topbean` layer (characters module); the `floor_coffers` shot in the showcase paces one across the room with `walk`, `move` and a `facing` timeline. Keep labels at y 0.15 or lower in the frame: a camera zoom of 1.05 crops the top 2.5 %.

## `studio`: TV and stage sets

`{"kind": "studio", "variant": "gameshow", ...}`

| `variant` | Fields | Look and motion |
| --- | --- | --- |
| `gameshow` | `sign`, `podium` true, `podiumX` 0.74, `confetti` | A purple gradient with light pillars pulsing ±10 % at 0.5 Hz, a diagonal spotlight, and a podium with a teal sign plate. |
| `quiz` | `screen`, `podiumX` 0.9 | A blue grid wall, concentric half-ring corners, a big bezel screen and a ring-stack podium. |
| `news` | `tags` true, `tag` "BREAKING NEWS", `deskY` 0.8 | A night skyline whose windows toggle 2 % every 12 frames, a curved anchor desk, and the corner tags BREAKING NEWS and LIVE (the dot blinks at 1 Hz). Combine with the v3 `lowerthird`. |
| `courtroom` | `benchY` 0.62 | Wood panels with pilasters, a backlit arched window, a raised bench and a witness box. |
| `auction` | `title` (use `\n` for lines), `paddles` [{x, num, at}] | A red striped wall, a framed landscape, a title easel, a lectern and a row of audience heads. Paddles pop up over 6 frames with `outBack`. |
| `podcast` | `mics` [0.44, 0.56] | A wood slat wall, plants, a table with boom-arm microphones, papers and headphones. |
| `classroom` | `lines` [{text, at, size}] | A chalkboard whose lines type in, a window with a light wedge, a teacher desk, and pupil desks at z 1.3. |

`screen` (in `quiz`, and in `room` `gamer` and `living`) is either the id of another shot, which renders live inside the frame through `T.subShot`, or plain text. `{shot, t}` freezes the shot at time `t`. A shot cannot show itself.

When to use: "fate decided at random" (`gameshow`), "who was behind it?" (`quiz`), "they explained it on air" (`news` or `podcast`), "the verdict" (`courtroom`), "it was sold to the highest bidder" (`auction`), "the teacher found out" (`classroom`).

## `room`: interiors

`{"kind": "room", "variant": "gamer", ...}`

| `variant` | Fields | Look |
| --- | --- | --- |
| `gamer` | `tv` true, `screen`, `lamp` true, `neon` "TEXT" | Violet walls, tilted posters, a CRT on a stand (6 % scanlines, glow flicker ±5 %), a console, two beanbags, a floor lamp wedge and a red curtain. `neon` adds a magenta glowing sign. |
| `living` | `wall`, `window` (`dusk`), `tv`, `screen`, `sofa` true, `cycle` | A plank wall, an oval red rug, a fireplace with a flipbook fire, a TV on a cabinet and a sofa back in front. |
| `bedroom` | `window` (`night`), `lampsOff` [t...], `quilt` | A plum bed, two bedside lamps and a dark door. Each `lampsOff` time switches a lamp off and darkens the room 40 % over 4 frames. |
| `hospital` | `monitor` true, `bed` true, `iv` true | A blue-grey wall, a garden window with white curtains, an IV stand with a half-full bag and a tube looping to the bed, a heart monitor whose trace beats, and a blue blanket in front. |
| `parlour` | `wear` 0–1, `window` (`sunset`) | A 19th-century wall with wainscot, an oval mirror, a dresser with a candle, a fireplace and a curtained window. `wear` adds damp stains. |

Window skies: `day`, `dusk`, `sunset`, `night` and `garden`. `cycle: true` alternates day and night every second (22 frames hold, 8 frames crossfade) for "night after night".

When to use: host or narrator frame stories (`gamer`), news reaching home (`living` with `screen`), "the powers did nothing" (`bedroom` with `lampsOff`), illness (`hospital`), poverty in a period story (`parlour` with `wear`).

## `cell`: dungeon

`{"kind": "cell", "window": [0.72, 0.2], "bars": true, "barColor": "#8a6a2a", "torch": 0.2, "shaft": true, "cold": false, "floorY": 0.8}`

Slate block walls, a small barred window high up and a warm light shaft (cold blue with `cold: true`) striped by the window bars. A wall torch flickers on twos with a light pool ±5 %. The foreground bars at z 1.3 pick up a warm rim near the torch. `bg-front` puts the bars over the prisoners. `window: false` and `torch: false` remove those pieces.

When to use: "they were imprisoned", secret night visits, "the food was locked away".

## `harbor`: pier

`{"kind": "harbor", "time": "sunset", "horizon": 0.55, "ship": true, "shipX": 0.22, "sail": "#f2ead8", "pierX": 0.5, "flare": true}`

`time` is `sunset`, `day`, `night` or `fog` (`night: true` also works). The sun sits low with a horizontal bloom, two pale rings and lens-flare discs. A crescent moon and stars replace it at night. Wave dashes drift 15 px/s, a moored sailing ship bobs 4 px over 2.2 s, and a plank pier with posts recedes to the horizon.

When to use: departures and arrivals, farewells, a "years later" establishing shot.

## `alley`: night

`{"kind": "alley", "barrel": true, "barrelX": 0.5, "windows": 0.4, "boxes": true, "snow": false}`

One-point brick walls lead to a slot of night sky. A fraction `windows` of the apartment windows is lit. A fire barrel throws a warm cone (±8 %) and glow. There are cardboard boxes, a trash can, a drainpipe and a heavy vignette (0.8). `snow` adds falling flakes.

When to use: poverty, crime, "it became illegal to...", orphans, secret meetings.

## `antique`: antiquity sets

`{"kind": "antique", "variant": "colonnade", "sky": "sunset", "columns": 3}`

| `variant` | Look |
| --- | --- |
| `colonnade` | Fat fluted columns on a plinth before a brick wall with diagonal sun-shadow bands, potted plants and a gap of sunset sky. |
| `balcony` | A sunset with god rays from the upper right over a valley. The cream balustrade slab runs diagonally across the lower third at z 1.3 (`slabY` 0.74) and cuts the characters at the waist when you use `bg-front`. |
| `temple-square` | A temple front with nine columns, steps and a pediment, box houses with red roofs and a paved square in perspective. |
| `bath` | Aqueduct arches and a blue pool in a stone rim, with steam rising 20 px/s. |

`sky` takes any sky preset. When to use: any antiquity scene, "X pushed Y out of power" (`balcony` with a `shove` pose), the leisure of the elite (`colonnade`, `bath`).

## `parchment-panel`: engraving backstory

`{"kind": "parchment-panel", "frame": true, "torn": true, "ornament": true, "color": "#d9a06a"}`

A full-frame torn sheet with a radial tan gradient, a mauve inner shadow in the bottom-left corner, grain specks, a dark wood frame and a round ornament in the top-right corner. Pair the figures with the FX `engrave` material when it is available, and push in slowly (`zoom` [1, 1.02] over 3 s).

When to use: backstory, genealogy, "long ago", a flashback inside a story.

## `corkboard`: conspiracy board

`{"kind": "corkboard", "board": "cork", "notes": ["STEP 1", "", "???", "PROFIT"], "strings": [[0, 3, 0.4], [3, 7, 0.9]], "sign": "THE PLAN"}`

- `board`: `cork` or `felt` (blue-grey).
- `notes`: a count (12) of seeded notes, or a list of strings or `{text, at, color}`. An empty string gives a scribbled note. Notes are cream, yellow or pale blue papers, or grey photos, tilted ±8°, each with a red push pin. A note with `at` pop-tilts in over 6 frames.
- `strings`: `[from, to, at]` note indices. Each red string sags slightly and draws itself over 0.3 s with `inOut`.
- `sign`: a hand-lettered cardboard sign at the top.

When to use: "a ridiculous plan", "everything was connected", investigations.

## `vehicle-interior`: scrolling window

`{"kind": "vehicle-interior", "vehicle": "train", "scenery": "mountains", "speed": 60, "sway": 1.5, "windows": [[0.55, 0.25, 0.35, 0.35]]}`

- `vehicle`: `train` (wood wall and a framed picture), `bus` (grab rail with hanging straps) or `plane` (pale wall, oval windows, clouds passing).
- `scenery`: `mountains`, `city`, `sea` or `steppe`. Two far bands scroll at `speed` px/s with parallax. Every 0.5 s a near tree or telegraph pole crosses the window in 6 frames, with four motion-blur copies.
- `windows`: rects `[x, y, w, h]` in frame fractions.
- `seat` (`#3c8f8a`) sets the colour of the two bench seats.
- `sway`: degrees. The whole interior rocks at 0.8 Hz. Give the characters a matching `swing` so they rock with it.

When to use: journeys, "on the way to...", conversations while travelling.

## Timing notes

- Everything that flickers (flames, lanterns, the CRT, window lights, the action bolts) changes on twos or slower. Nothing tweens smoothly except scrolls, drifts and rotation.
- Paddle and note pops take 6 frames with `outBack`. Strings take 9 frames. A lamp switches off over 4 frames. The window day/night cycle holds 22 frames and crossfades 8.
- Hold a mood backdrop for at least 1.5 s so the spin reads. Swap the `rays` preset with a cut, not a dissolve, when the emotion flips.
