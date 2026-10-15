# 03 · Spec contract (spec.json)

The engine draws in a fixed **1920×1080** space. Layer positions are normalized: `x`, `y` in the range 0..1 of the frame. Validator: `python3 scripts/spec.py spec.json`. The lists of allowed values live in `KNOWN_*` in `scripts/spec.py`; a test checks them against the engine.

**Two time bases** (seconds):
- **shot time**, from the cut: `at`, `out`, `move[].at`, `shake[].at`, `jump[].at`, `camera.*`;
- **layer time**, from the layer's `at`: everything inside the layer, i.e. `talk`, `pose[].at`, `expr[].at`, `counter.delay`, `calendar.delay`, `map.regions/pins/routes[].at`, `card.every`, fx animations.

Example: a layer with `"at": 1.0` and `"talk": [[0, 1.5]]` talks from 1.0 to 2.5 s of shot time.

Colors must be `#rrggbb` or `#rgb`: shadows and haze are derived from them. The validator checks appearance colors.

```jsonc
{
  "title": "…", "fps": 30, "seed": 1,               // seed makes the render deterministic
  "style": { "grain": true, "vignette": 0.3 },        // post-processing; false disables
  "cast": { "<name>": { /* bean appearance */ } },    // character sheet
  "shots": [ { "id": "k01", "dur": 3.2, "vo": "…", "screen": "…",
               "transition": "cut" | { "kind": "zoom-punch", "dur": 0.3 },
               "bg": { … } | [ { … }, { … } ],        // backgrounds are drawn in order
               "camera": { … }, "layers": [ … ] } ]
}
```

## Camera
| Field | Example | What it does |
|---|---|---|
| `zoom` | `[1, 1.06]` | Scale from shot start to shot end. Default `[1, 1.04]` (there is always some drift) |
| `pan` | `[[0,0],[40,-10]]` | Offset in 1080p pixels |
| `focus` | `[0.6, 0.45]` | Point (frame fractions) the zoom pushes toward. Not related to the shot-level `focus` (rack focus) below |
| `ease` | `linear` (default), `inOut`, `out`, `outCubic` | Curve |
| `at`, `dur` | `0.5`, `2` | Movement window within the shot |
| `punch` | `[{"at":2.4,"amount":0.12}]` | Punch-zoom: grows over 0.08 s, decays over ~0.4 s |
| `shake` | `[{"at":1,"dur":0.5,"amp":18}]` | Shake |
| `rot` | `[0, -2]` or `[{"at":0,"v":0},{"at":1.2,"v":-6}]` | Tilt in degrees. Key form = dutch-angle snaps (2-frame blend) |
| `letterbox` | `{"h":0.12,"at":0.3,"dur":0.2,"out":2.5}` or `true` | Cinematic bars slide in (and out at `out`) for extreme close-ups and stares |
| `jump` | `[{"at":1.4,"zoom":1.35,"focus":[0.4,0.35]}]` | Cut-in without a cut: the zoom jumps in 1 frame on a pose snap or key word; entries stack |

Parallax: every layer has a `z` (default 1). At 0 the layer is pinned to the screen; at 0.5 it moves at half the camera speed. Backgrounds lay out their own planes: sky 0.15, clouds 0.3, hills 0.45–0.8, ground 1.

## Backgrounds `bg.kind`
- `sky`:
  - `preset`: `sunset|day|dusk|night|storm|teal` (plus `sepia` and `overcast`, see [04 Places](toolkits/04_places.md));
  - `clouds`: number or `true`;
  - `rays`: bool, `sun`: `[x,y]`;
  - `hills`: number or `false`, `horizon`: 0..1, `groundY`: 0..1;
  - `ground`: `grass|sand|stone|dirt|snow|false|#hex`;
  - `trees`: `[[x,y,h],…]`, where `x`, `y` (the trunk base) and `h` (tree height) are **fractions of the frame**: `h` 0.35 (the default) is a third of the frame height. Pixels are rejected (`h` > 1.5 fails validation);
  - `water`: `{y,color}`;
  - `palette`: color overrides;
  - `wind`: cloud speed;
  - `cloudStyle`: `streak` (sunset "slices" with a cream bottom edge; default for `sunset` and `dusk`) or `cumulus` (outlined cumulus with a dark underside and curls).
  - Hills get aerial perspective automatically (distant ones are lighter and closer to the horizon color), a lit ridge, a shadow at the base, and brush strokes.
- `forest`: a forest at three depths (distant bluish trunks, middle trunks, forked near trunks), canopies with crescent highlights, haze, light patches, rays.
  - Fields: `sky`, `haze`, `leaf`, `hi`, `trunk`, `ground`, `groundY`, `path` (bool), `rays` (bool).
- `city`: sky with hills + two rows of houses (the far row in haze), a temple in the center, round trees, a tiled square.
  - Fields: `preset`, `style` (`stone` or `wood` for a log-cabin village), `temple` (bool), `clouds`, `ground`, `groundY`.
- `interior`:
  - `wall`, `trim`, `floor`, `floorY`;
  - `columns`: `[x…]`, `columnColor` (`#d9a84a` for gold), `drapes`: `[x…]`;
  - `window`: `[x,y,w,h]` (normalized), `windowSky` (a sky **preset name** such as `day`, `dusk` or `night`, not a color; default `day`);
  - `dado` (color of the wine-colored panel at the bottom of the wall; `false` disables it), `dadoH`, `dadoTrim`;
  - `light` (diagonal light wedges, on by default), `wedges: [[x0, w], …]`;
  - `shine` (floor highlights), `lattice` (red lattice, as in a throne room).
- `parchment`: `color`, `z`.
- `burst`: background for reactions; `color`, `center`, `edge`, `at`: `[x,y]`, `wedges`: bool.
- `flat`: `color`.
- `image`: `image` (path relative to the spec), `overscan` (1.08), `z`, `filter` (canvas CSS filter, e.g. `"saturate(1.1)"`).

## Common layer fields
`type`, `id`, `x`, `y`, `scale`, `rot` (degrees), `alpha`, `flip`, `z`, `hud` (ignores the camera), `at`, `out`,
`enter`, `exit` (`none|fade|pop|drop|rise|slide-left|slide-right|slide-up|slide-down|spin|drop-squash|pop-tilt|slam` and the gag kinds in [02 Acting](toolkits/02_acting.md)), `enterDur`, `exitDur`,
`move: [{at,dur,to:[x,y],scale,rot,alpha,flip,ease}]`, `bob` (px), `bobHz`, `sway` (deg), `swayHz`, `wobble` (px),
`shake: [{at,dur,amp}]`, `jump: [{at,dur,h}]`.

More fields accepted by every layer:

| Field | Example | What it does |
|---|---|---|
| `swap` | `[{"at":1.2,"look":{"outfit":"toga","head":null}},{"at":2,"kind":"skull"}]` | Hard 1-frame change of any field at shot time `at` (costume change under a poof, prop turns into another, text changes). `look` merges into the layer's look; `null` inside `look` removes a cast item, a top-level `null` deletes the field. `type` cannot be swapped |
| `blur` | `6` or `[{"at":0,"v":0},{"at":0.6,"v":12}]` | Depth-of-field blur in px (1080p), with `blurDim` (default 0.08) darkening. Blurred foreground heads, blurred background props behind a card |
| `jitter` | `{"amp":3,"on":2}` or `true` | Seeded tremble on twos (struggle, panic, a shaking region); `from`/`to` limit it in layer time |
| `swing` | `{"at":0.4,"amp":10,"period":1.1,"decay":2}` | Damped pendulum around the layer origin: hanging signs, a dropped microphone, keys on a hook |
| `glow`, `silhouette`, `lineart` + module modifiers | `"glow": true` | Per-layer modifiers from `T.LAYER_MODS`; several can combine (order is fixed by the registry) |

Shot-level `focus` (rack focus; not the same as `camera.focus`, which is only the zoom target point): `"focus": [{"at":0,"on":"king","px":10},{"at":2.2,"on":"bg","dur":0.5}]`. From `at`, every layer **with an `id`** other than `on` ramps to `px` of blur and `on` ramps sharp over `dur` (0.4 s, ease in-out); the background gets `bg` px (default `px`, or 0 when `on` is `"bg"`). Pull focus on the word that names the new subject.
- Always sharp: layers without an `id`, and lettering and screen furniture even with an `id`: `label`, `title`, `caption`, `date`, `era`, `counter`, `timer`, `doc`, `hud`, `cursor` and `fx`. Add `"focusable": true` to let one of these blur.
- Any other layer opts out with `"sharp": true`.

Film-level `overlays`: `"overlays": [{"from": 12.0, "to": 95.0, "layer": {"type": "title", ...}}]`. Screen-space layers (film time, `hud: true`) that survive cuts and transitions: quest chips, a speedrun timer, a running score, a persistent sticker. Layer time starts at `from`, so `swap`, `enter` and `out` work inside them.
- `hideIn: ["k19", "k23"]` hides the overlay during those shots (a split screen that needs the corner, a finale with its own counter); it returns on the next shot.
- For a fade or a hide in the middle of a shot, swap the overlay layer's alpha. `at` is overlay time (film time minus `from`): `"swap": [{"at": 41.2, "alpha": 0}, {"at": 44.0, "alpha": 1}]`.

**Safe area:** `label`, `title` and `counter` are shifted automatically so text stays inside a 3.5 % margin from the frame edge. The calculation accounts for camera zoom. Disable with `"keepInFrame": false`. A long `title` is squeezed to 90 % of the frame width.

Default entrance:
- `pop` for labels, props, counters;
- `none` for characters, maps, fx and titles (title letters pop in on their own);
- `slide-left` for the era plate;
- `fade` for `caption`.

## Layer types

### `bean`: a character drawn in code (`characters/face.js` + `characters/rig.js`)
```json
{"type":"bean","who":"caesar","size":620,"x":0.6,"y":0.96,"view":"3q",
 "expr":"smug" | [{"at":0,"v":"neutral"},{"at":1.2,"v":"shock"}],
 "pose":"idle" | [{"at":0,"v":"hips"},{"at":2,"v":"point"}],
 "talk":[[0.3,1.8]], "walk":[[0,2]], "run":[[2,3]], "tremble":[[0,1.5]],
 "hold":"sword", "holdL":"shield", "gaze":8, "headTilt":-6, "lean":4, "rock":1.6, "poseBlend":0.07, "look":{…override cast…}}
```
- The `(x,y)` point is the **feet**. `size` sets the height in px; 1080 = full frame height. Close-up: `size` 1000–1400 with `y` 1.2–1.5.
- `view`:
  - `3q` by default (≈60–70 % of reference frames): features shift toward the gaze side, the back of the head sits in a large cool shadow;
  - `front`, `side`;
  - `back`: back of the head, hair covers the head.
  - The character faces right; `flip: true` turns it left.
- `expr`: the base set is `neutral happy content sleepy smug angry rage sad worried shock scream squint cry dead`; [01 Characters](toolkits/01_characters.md) lists all of them (`menace`, `evil`, `jaw-drop`, `side-eye`, …) with their eye, mouth and brow kinds.
  - The eyebrows carry the emotion.
  - `rage` adds an anger vein, `worried` a sweat drop, `cry` streams of tears.
  - `dead` gives X eyes; combine with `rot: -88`, `rock: 0`, `blink: false` and `fx: blood`.
- `talk`: the mouth switches between the expression's 3 shapes every ~3 frames (10 Hz, no repeats); the head bobs ±1.6°.
- `pose` (arms): `idle point point-up arms-up shrug facepalm think wave hold fist hips cross present scared hands-face thumbs-up clutch-head sword-up reach`.
  - Arms are two bendable tubes (shoulder → elbow → hand; some poses use IK).
  - Glove hands: `open`, `fist`, `point`, `thumb`.
- More poses (`rig.js` `T.POSES`; the full set is `poses` in `scripts/vocab/characters-poses.json` and [01 Characters](toolkits/01_characters.md)):
  - hands: `pray steeple cheeks cover-ears shade-eyes binoculars pinch-nose clutch-chest cover-mouth eat drink phone-ear`;
  - force and power: `shove t-pose spread flex flex-one hands-up hammer throw-windup throw hold-high carry grab`;
  - pleading and offering: `beg rub-hands offer kneel kneel-pray kneel-beg kneel-offer prostrate`;
  - two characters: `hug arm-around handshake` (partner at +x, overlap about 40 %), `cradle` (`hold: "swaddle"`), `lean-table`;
  - body on the ground or in the air: `sit` (chair seat at about 0.1 × `size` above `y`), `sit-floor` (hugging knees), `sit-slump`, `lie` (pair with `expr: dead`), `crawl`, `fly`, `flail` / `flail-b` (alternate for a tumble), `hang` (from a bar).
  - A pose entry may carry a body: `{arms, body: {dy, rot, lean, legs, front, view, armScale, pivot}}`; legs are `stand kneel sit tuck splay kick squat dangle none`. Modules add poses with `T.POSES[name] = …`.
- `antic: true` adds a 3-frame anticipation dip before every pose change and a 2-frame stretch after it; `snapTilt: 8` adds one tilted breakdown frame. Use them on big gestures (a slam on the table, a reveal), not on talking heads.
- `look.build` (`adult brute fat thin muscle`) and `look.age` (`adult child toddler baby elder`) change proportions; `size` stays an adult's height, so a child at the same `size` is drawn about 0.65 as tall. `age` sets head/limb ratios, `build` sets widths. Overlays (belly, pecs, swaddle, wrinkles) are drawn by `characters/expressions.js` ([01 Characters](toolkits/01_characters.md)).
- **Hold-and-snap:** a pose change takes `poseBlend` seconds (default 0.07 = 2 frames) and gives the body a ~4.5 % settle over 0.2 s. This is how the reference is animated. For a smooth gesture, set `poseBlend: 0.25`.
- Idle:
  - the body rocks around the feet by ±`rock`° (1.6) with a 1.7 s period, the head in counter-phase;
  - breathing 1.2 %, a blink every ~3 s (3 frames).
- `walk` / `run`: cycles animated on twos. Step 0.56 s, run 0.4 s (`gaitRate` speeds them up). Includes bounce and lean; arms swing (`keepArms: true` keeps the arm pose).
  - Move the character with `move`, or drive the camera with `pan` and keep the character in place (as the reference does).
- `tremble`: a ±6-unit tremor every 2 frames (fear).
- `hold` is the prop in the right hand, `holdL` in the left, e.g. `shield`. A sword rotates with the arm; a spear and a torch stay nearly vertical (tilt up to ±20°), and the torch burns; everything else is held vertical.
- The cape (`cape`) lags behind motion: its velocity comes from `move`, and it flutters while running.
- Appearance (in `cast`):
  - `skin`, `skinShade`, `view`. A custom `skin` derives its 3/4 head shadow and leg shadow automatically (22 % darker); set `skinShade` only to override that tone;
  - `robe`, `robeShade`, `sleeve`, `trim`, `sash`, `belt`, `cape`, `armor` (segmented armor), `pleats` (pleated skirt), `folds` (fabric folds, on by default), `sandal`, `legColor`, `hold`, `holdL`;
  - `hair`: `short|long|curly|bun|bald|bald-sides`, `hairColor`. Short and long hair cover the top and back of the head; the bangs end at the face side;
  - `beard`: `full|goatee|stubble`, `beardColor`, `mustache`, `mustacheColor`, `blush`. The beard starts below the eyes;
  - `head`: `crown|laurel|helmet|hood|headband|pontifex|hat`, `headColor`, `crest`. The helmet has a bristle crest and cheek guards at the sides.

### `crowd`: a crowd or an army rank
```json
{"type":"crowd","who":"legion" | ["citizen","citizen2"],"x":0.5,"y":0.95,"count":9,"rows":2,"spread":1500,"size":300,
 "march":true,"armsUp":false,"expr":"happy","pose":"idle","view":"3q","flipAlt":true,"silhouette":false,"inStep":false}
```
- One model is repeated N times with a random phase.
- Back rows are 22 % smaller, less saturated and darker.
- `march`: everyone walks (`inStep: true` keeps them in step).
- `armsUp`: arms go up and down alternately at 2 Hz (cheering).
- `silhouette`: dark spectator silhouettes.
- Other fields: `jitter` (x scatter, 30 px), `hold`, `holdL`, `gaitRate`, `rock`, `fog` (haze color for back rows).
- Set `id` if a shot has two crowds with the same `who`, `x` and `count`; otherwise their phases match.

### `fg`: foreground, frame framing (the main source of depth in the reference)
- Put it **last** in the layer list, but **before** labels. Parallax `z` 1.3–1.6, default entrance `none`.
- Coordinates cover the full frame (leave `x`, `y` at 0.5).
- `kind`:
  - `bushes`: dark bushes in the corners, `sides: ["bl","br","tl","tr"]`, `color`, `hi`;
  - `canopy`: dark tree crowns hanging from the top;
  - `ledge`: a diagonal ledge, `surface: "stone"|"grass"`, `side: "left"|"right"`, `h` (fraction of the frame, 0.22);
  - `grass`: tall tufts along the bottom with lit blades, `count`, `h`, `color`, `hi`;
  - `trunk`: a tree trunk at the frame edge, `side`, `inset`;
  - `ots`: over-the-shoulder, a large dark back of the head with a shoulder at the frame edge, `who` from `cast`, `side`, `tone` (darkening, 0.45);
  - `rubble`: stones along the bottom.

### `image`: an AI cutout (PNG with alpha)
```json
{"type":"image","src":"assets/caesar_idle.png","w":520,"anchor":[0.5,1],
 "frames":{"idle":"assets/c_idle.png","talk":"assets/c_talk.png","blink":"assets/c_blink.png"},"talk":[[0.5,2]]}
```
During `talk`, the idle and talk frames alternate at 8 Hz. `blink` shows every ~3 s. A light squash-and-stretch and a shadow under the feet are added. All common motion fields work here too.

### Lettering
- `label`: `text`, `tag`, `tagColor`, `color`, `size` (96), `tilt` (−4°), `arrow` (`right|left|up|down|down-right|…|deg`), `arrowAt`, `arrowLen`.
- `title`: `text`, `sub`, `color`, `subColor`, `size`, `stagger` (0.035 s per letter), `jiggle`.
- `date`: `text`, `suffix`, `size`, `color`.
- `era` (HUD, bottom left): `small`, `parts: [[text, color], …]`, `size`.
- `counter`: `from`, `to`, `dur`, `delay`, `prefix`, `suffix`, `decimals`, `sep`, `size`, `color`, `ease`.
- `timer` (HUD): `start`, `rate`.
- `caption`: `text`, `size`. A quote line; placeholders from `script2spec` are marked `"todo": true`.

### Objects and widgets
- `prop`: `kind` = `coin moneybag scroll sword flag question exclaim bread temple skull heart book hourglass shield spear torch bulb` (the base set), `size`, `text`, `color`, `spin` (coin). The torch burns with a flipbook flame; the idea bulb glows and pulses with rays. About 75 more kinds (`crate`, `barrel`, `mug`, `throne`, `signpost`, …) are in [03 Props, creatures and vehicles](toolkits/03_props_creatures_vehicles.md).
  - **Origin:** props are centred on (`x`, `y`) unless listed in `TOON.PROP_GROUND` (signposts, furniture, cage, door, … see [03 Props](toolkits/03_props_creatures_vehicles.md)), which stand on `y`. A centred prop sits half its height above its bottom edge: a `crate` or `barrel` is 0.9 × `size` tall, so to stand one on a floor at `floorY` use `y = floorY − 0.45 × size / 1080`, and its top is at `y − 0.45 × size / 1080`.
- `card`: `w`, `h`, `title`, `titleColor`, `lines`, `every`, `lineSize`, `color`.
- `sign`: `text` (`\n` breaks the line), `w`.
- `calendar`: `pages: [{head, num, headColor}]` + `every`, or `head`, `from`, `to`, `dur`, `ease` for a fast count; `size`.
- `map`: territories, conquests, fronts, routes, armies, figures and views. The whole field reference is in [05 Maps](toolkits/05_maps.md).

### `fx`
`kind`:
- `rays`: `color`, `count`, `spin`;
- `speedlines`: `inner`, `count`, `color`;
- `sweat`: `count`, `speed`;
- `anger`;
- `splat`: `text`, `size`, `textSize`, `color`, `textColor`;
- `flash`: `dur`, `strength`, `color`;
- `dust`, `sparkle`: `radius`, `count`;
- `confetti`;
- `spotlight`: `radius`, `strength`;
- `fire`: a row of flame tongues, `w`, `count`, `size`, `embers`, `glow`. It is a flipbook: shapes change every 2 frames, 3 colors, no outline, embers fly upward;
- `rain`: full frame, two layers of streaks, `density`, `angle`. Use with `"hud": true`; for a gradual start, use `at` + `enter: "fade"`;
- `beam`: a diagonal light wedge from a corner, `from: "tl"|"tr"`, `width`, `strength`; grows over 10 frames and flickers;
- `birds`: a flock of "check mark" birds, `count`, `speed`, `dir`, `size`, wings animated on twos;
- `smoke`: a smoke band, `w`, `rise`, `color`;
- `puff`: legacy swap cloud; prefer `poof` ([02 Acting](toolkits/02_acting.md)), the swap cloud made for `swap`;
- `explosion`: a star burst with debris, ~0.6 s;
- `blood`: `shape: "pool"|"splat"`, `w`;
- `lightning`: lightning bolts, rebuilt every 2 frames;
- `arrows`: a volley of arrows across the frame, `count`, `dir`, `every`.

These are the base kinds. Over 40 more live in [08 FX and tone](toolkits/08_fx_and_tone.md) and [02 Acting](toolkits/02_acting.md).

## Shot color grade (`grade`)
`"grade": "serious"` or `{ "preset": "serious", "at": 2.0, "dur": 0.5, "strength": 1 }` recolors the whole shot, **including labels and the HUD**. If a label must stay clean, put it in the next shot or lower `strength`. With `at`/`dur`, the grade kicks in mid-shot: this is how the rain starts in the reference at 22:43.9.

`grade` may also be a **list** of entries, applied in order, each `{preset, at, dur, strength, out, outDur, target}`. `out` fades the entry away again (over `outDur`, default `dur`), so a list builds grade sequences such as a trauma cycle (teal → amber → violet, each about 0.95 s) or a 1 s red flash. `strength` accepts a `[{at,v}]` timeline. `"target": "bg"` grades only the backgrounds (applied before the layers), so characters and lettering stay clean on a hellish red or a cold sepia set. All presets are listed in [08 FX and tone](toolkits/08_fx_and_tone.md).

| Preset | When |
|---|---|
| `serious` | Desaturated dark teal: ambush, investigation |
| `storm` | Gray-blue, downpour |
| `night` | Night, bluish cold |
| `solemn` | Dusty gray-brown: execution, loss |
| `warm` | Warm, comedic |
| `gold` | Golden hour, triumph |

## Transitions
Built into `core.js`: `cut` (0 s), `dissolve` (0.35), `fade-white` (0.4), `fade-black` (0.5), `zoom-punch` (0.3), `whip` (0.3), `iris` (0.5). Twenty more (ink blot, peephole, cloud wipe, drip, …) with their parameters are in [09 Transitions and lens](toolkits/09_transitions_and_lens.md).
A transition occupies the **start** of the shot it is set on. During it, the previous shot keeps playing (its time runs past `dur`).

## Extending
- New layer: `T.layers.<type> = (ctx, L, lt, env) => {…}` in `scripts/engine/lib/<domain>/*.js`. `lt` is layer time, `env.lt` is shot time. Add the `<script>` tag to `index.html`.
- New entrance/exit: `T.ENTERS.<kind> = (p, st, isExit, L) => {…}` mutates the motion state `{x, y, s, r, a, sx, sy}` for progress `p`; set its default duration in `T.ENTER_DUR.<kind>` and list it under `enter` in the vocab (a test checks the two match).
- New layer modifier: `T.LAYER_MODS.<name> = {order, apply(src, L, lt, env), under(ctx, src, L, lt, env), filter(L, lt, env)}`; it is active when the layer has a truthy `<name>` field. Declare it under `"kinds": {"layer_mod": [...]}`.
- Shared helpers (`lib/base/helpers.js`): `T.num` (number or `[{at,v}]`), `T.drawCloud`, `T.starburst`, `T.drawThickArrow`, `T.drawGlove`, `T.subShot(id, lt, env, {t, grade})` (render another shot into a canvas for panels, TVs and paintings; nesting deeper than 2 throws).
- New background `T.bgs.<kind>`, prop `T.PROPS.<kind>`, fx `T.FX.<kind>`, foreground `T.FG.<kind>`, transition `T.transitions.<kind>`, headwear `T.HEADWEAR.<kind>`, pose in `POSES` (`rig.js`).
- Declare every new name in `scripts/vocab/<module>.json` instead of editing `spec.py`. Keys: `layers`, `bgs`, `fx`, `props`, `fg`, `transitions`, `grades`, `enter`, `poses`, `expr`, `head`, `hair`, `beard`, `sky`, `views`, `color_keys`, plus `kinds` (allowed `kind` values per layer type) and `registry` (the engine registry those kinds must match, for example `"vehicle": "TOON.VEHICLES"`).
- Tests compare the merged vocabulary with the engine (`test_python_vocabulary_matches_engine`, `test_vocab_kinds_match_engine_registries`), so a missing declaration fails CI.
- Document new fields in the card of their domain (`references/toolkits/`, listed in [08-toolkits.md](08-toolkits.md)).
- Do not call `rng` inside a path function for `T.outlined`: the path is built twice (fill and stroke). Derive per-item random values from a per-item seed, not from a stream whose consumption depends on time.
- Randomness only through `T.rng(T.hash(seed))` and `T.noise`. `Math.random` is forbidden: the render must be deterministic, and `tests/test_pipeline.py` checks this.

Every domain has a card with its full field reference; see [08-toolkits.md](08-toolkits.md).
