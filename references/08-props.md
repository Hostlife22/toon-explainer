# 08 · Props: personified objects, signposts, furniture, gag props, screens, creatures and vehicles

This toolkit covers the objects that act in the reference films. A treaty gets a face and flexes. A signpost spins round to a new name. A cage drops over the accused, a door opens onto fire, an emblem lands on its owner, and a dump truck tips people out. Modules: `props3.js` (prop kinds), `creatures2.js` (the `obj` layer and creatures v4) and `vehicles2.js` (vehicles v4 plus the machine props: screens, calendar, window, clock, emblem, stat block, wheel and coin). Vocabulary: `scripts/vocab/props3.json`. Showcase: [examples/v4_props/spec.json](../examples/v4_props/spec.json), with one shot per feature.

Times inside a layer are layer-local, so they count from the layer's `at`. Frame counts assume 30 fps. All common layer fields still apply (`x`, `y`, `scale`, `rot`, `move`, `swap`, `jitter`, `swing`, `enter`, `out`, …). Props enter with `pop` by default. Pass `enter: "none"` when a prop should already be in place at the cut.

**Origin.** Ground props draw with their origin at the bottom centre, so set `y` to the floor line (about 0.88). These are signpost, fork-signs, the furniture, cage, door, gate, portcullis, coin-heap, big-button, bowling-ball, pins, chess, ice-block, clock, emblem3d, stat-block and prize-wheel (`TOON.PROP_GROUND`). Every other prop is centred on (`x`, `y`), so a bean can `hold` it. That includes the v3 props in [07-places](07-places.md) (`crate`, `barrel`, `mug`, …) and the v1 props: to put something on top of a centred `crate` (0.9 × `size` tall), its top edge is at `y − 0.45 × size / 1080`. `size` is the prop's largest dimension in px.

**Drawing helper.** `T.drawCoil(ctx, pts, {r, pitch, color, width, ink})` draws an ink-outlined steel coil spring along a polyline (dark back half, light front half). The `glove-spring` arm uses it.

**Field name.** The common layer field `flip` mirrors a layer. That is why the signpost spin is called `turn`.

## `obj` layer: a personified object

`{ "type": "obj", "prop": "sack", "size": 220, "x": 0.5, "y": 0.88, "face": {...}, "arms": {...}, "legs": true, "head": "fez" }`

| Field | Default | Meaning |
| --- | --- | --- |
| `prop` / `vehicle` / `shape` | `shape: "blob"` | The body. `prop` takes any prop kind and `vehicle` any vehicle kind. `shape` is one of `blob`, `disc`, `globe` (sea and seeded continents), `heart` or `footstool` (a tufted cushion on a wooden apron with four turned legs; `wood` recolours the wood). `color` recolours it. |
| `size` | 200 | Body size in px. The origin is the bottom of the body, or the feet when `legs` is set. |
| `face` | `{mood: "neutral", pos: [0, -0.55], scale: 1}` | `mood` takes any bean expression, as a constant or an `[{at, v}]` timeline (it snaps in 1 frame). `pos` is a fraction of `size` from the origin. `eyes` / `mouth` override the kinds. `face: false` hides the face. The face uses `TOON.drawMiniFace` when the CHARS module is loaded; otherwise it falls back to bean eye and mouth kinds. |
| `arms` | none | `{pose: "idle"\|"flex"\|"wave"\|"point"\|"hold"\|"crossed"\|"punch", at, sprout, color: "#ffffff", hold, holdSize: 0.5, span: 0.42, y: -0.45, w: 0.075, count}`. White tube arms with cartoon gloves. `pose` can be a timeline. |
| `legs` | false | Two short white legs with brown shoes. They step on twos inside `walk` windows. |
| `head`, `headSize` 0.35, `headY` −1, `headX`, `headTilt` | none | Any `TOON.HEADWEAR` kind, placed on the top edge. |
| `bandage`, `cracked` | false | Crossed tan strips beside the face, or seeded crack lines. |
| `talk`, `blink` | none, true | Talking mouth at 10 Hz. Blinks every ~3 s for 3 frames. |

Timing: the body breathes with a 1.5 % squash at 0.6 Hz. With `sprout`, each arm grows in 3 frames (outBack), the second one 10 frames later, then the flex bicep pulses every 12 frames. `punch` runs an 11-frame cycle (extend 2, hold 3, retract 3, rest 3), repeated `count` times.

**When to use:** "the economy / the treaty / the country did X" (the abstraction acts); idiom puns ("footstool", "the heart of the nation", "scapegoat"); a battered vehicle or state (`bandage`, `cracked`).

## Signposts (feature 27)

| Kind | Fields (defaults) | Notes |
| --- | --- | --- |
| `signpost` | `text` (`\n` breaks a line), `arrow: false\|"left"\|"right"`, `tilt` −6, `stake` true, `post` true, `w` = size, `h` 0.42·size, `color` `#b07a3c`, `textColor` `#3a2414`, `stack: ["TEXT2", …]`, `turn: {at, text, dir: -1, arrow}` | A plank on a post with seeded grain, nails and hand-lettered lines. `stack` adds joke planks below. `turn`: 1 frame of +15° anticipation, then a 22-frame pinwheel spin with 4 ghost copies. It lands on the new text, with the arrow mirrored when `dir` is −1, and settles over 6 frames. It also wobbles ±1° at 0.5 Hz. |
| `fork-signs` | `left`, `right`, `colorL`, `colorR`, `textColor`, `w` | Two arrow planks on one post that point apart. |
| `marquee-arrow` | `text`, `curve` 0.4, `color` `#3a1426`, `bulb` `#ff7ad9` | A curved thick arrow with 14 chasing bulbs, lit in threes at 10 Hz. Wobbles ±2° at 1 Hz. Aim it with `rot`. |

**When to use:** place names and renamings ("X, today known as Y": `turn`), "this way to disaster" (`fork-signs`), "here!" (`marquee-arrow`). For a sign that lands, use `enter: "drop-squash"`.

## Furniture (features 44, 94)

| Kind | Fields | Notes |
| --- | --- | --- |
| `throne` | `color` `#b8202c`, `frame` `#e2b23c`, `pointed`, `chains: true\|{at}`, `chainColor`, `sign`, `part` back/front | Red velvet back, gold frame and studs. `chains` run in 0.2 s as three strands bolted to the arm posts across the sitter, then a padlock pops. `sign` hangs on cords above the back, clear of the sitter's crown. Seat a bean with `pose: "sit"` at about `y` − 0.06 between two layers: `part: "back"` (frame) before the bean and `part: "front"` (chains + sign) after it. |
| `bed` | `occupant: {who, expr, view}` (or an array), `two`, `quilt`, `color`, `view: "side"\|"top"` | The cast member's head lies on the pillow. The sheet breathes at 0.4 Hz. Needs the layer env, which the `prop` layer passes. |
| `lectern` | `mic`, `sign`, `textColor`, `low`, `poster`, `color` | Put the speaker's layer **before** the lectern, so the lectern hides the speaker's body. |
| `easel` | `text`, `chart: {pts: [[x, y], …], at, dur: 1.5, crashAt, color, crashColor}`, `prohibit`, `flipAt` + `after: {text, chart, prohibit}` | The chart draws on (ease.inOut). The crash segment snaps in red over 4 frames, with an arrowhead, so add a `camera.shake` at that moment. `flipAt` flips the page over 6 frames. |
| `deckchair` | `stripes`, `cocktail` | Complacency: sit a bean in it with sunglasses. |
| `coffin` | `open`, `flowers`, `lying`, `color` | |
| `crib` | `babies` N (draws `swaddle` props behind the bars), `color` | |
| `dinner-table` | `color`, `cloth` | A one-point table with plates, glasses and a roast. Place beans around it. |
| `armchair` | `view: "front"\|"back"`, `color` `#7a2030` | Wingback. |
| `swaddle` | `color` | A wrapped baby. It is centred, so a bean can hold it with `pose: "cradle"`. |

## Cage, door, gate, portcullis (feature 45)

| Kind | Fields | Timing |
| --- | --- | --- |
| `cage` | `drop: true\|{at}`, `lock`, `color` | Falls in 5 frames (ease.in), then squashes 3 % over 3 frames. Put it **after** the prisoner in the layer list; its back bars draw at half alpha. Stagger several cages 1 frame (0.04 s) apart, and `swap` the prisoner's expression to `scream` on landing. |
| `door` | `color`, `frame`, `slam: {at}`, `open: {at, dur: 0.4}`, `behind: "dark"\|"fire"\|"#hex"\|<shot id>`, `knocker` | Slam: the leaf bows for 3 frames, impact ticks show for 2, then it springs back over 2. Open: the leaf turns 0 → 80° (ease.out) around its hinge. `fire` adds flipbook flames and a light spill on the floor. A shot id shows that shot through the opening. |
| `gate` | `close: {at, dur: 0.33}` or `open: {at, dur: 0.6}`, `behind`, `color` | Two plank leaves in a stone arch. At contact there is a pale 12-spike starburst for 7 frames, tick lines and dust, so add a `camera.shake` of 6 px. |
| `portcullis` | `dur` 0.85 (or `drop: {at, dur}`), `bars` 7, `arch` true, `behind` | The bars grow down (ease.in), with a 2 % overshoot in the last 3 frames. |

**When to use:** "arrested / locked away" (cage), "it backfired" (`door` + `behind: "fire"`), "they shut the gates", "the vault sealed itself".

## Handheld gag props (features 46, 95)

These props are centred, so they work as bean `hold` items.

| Kind | Fields | Animation |
| --- | --- | --- |
| `sack` | `text`, `dollar`, `color` | |
| `bottle` | `text`, `label`, `color`, `liquid`, `pour: {at, dur: 0.5}` | Tips to 110° and pours a stream. |
| `candle` | `color` | Flame flicker on twos, warm glow. |
| `key` | `color`, `hook` | `hook: true` hangs the key on a brass wall hook at the anchor, so the core `swing` pivots on the hook. |
| `broom` | `sweep: {at, dur: 1.2}` | ±20° sweeps on a 6-frame cycle, with dust. |
| `magnet` | `attract: {at, target: [dx, dy]}` (px from the prop) | Zigzag bolts redrawn on twos, attraction arcs, 1 Hz pole glow. Enter with `slide-left`. |
| `phone` | `style: "brick"\|"flip"\|"rotary"\|"smart"`, `ring: [t, …]`, `screen`, `text` | Ring: ticks and jitter for 0.5 s. |
| `smartphone` | `screen` (shot id), `screenTime`, `text` | A sub-shot on the lit screen. |
| `megaphone` | `on: true\|[[a, b]]` | Sound ticks pulse on twos. |
| `magnifier` | `reveal: {at, layers: [...], scale: 1.4}`, `zoom` | Without `reveal` it magnifies what lies under the lens. With `reveal` the lens shows hidden layers, which stay in world position while the magnifier `move`s; they fade in over 6 frames. |
| `scissors` | `snip: [t, …]`, `color` | Blades shut in 2 frames and reopen in 4. |
| `mallet` | `style: "wood"\|"giant"` | |
| `dagger` | `tip` (red stand-in), `reflect: <who>` | `reflect` shows a tiny bust in the blade. |
| `boxing-glove` | `badge: true\|[colours]` | |
| `chain` | `w`, `ball`, `scroll` (px/s), `link` | Face-on and edge-on links. `scroll` drags the chain. |
| `coin-heap` (ground) | `count` 34, `chest`, `color` | Glints on fours. |
| `binoculars` | `eyes`, `color` | Three-quarter view: two barrels toward screen right, objective rims, eyecups and a strap. 2 px hand jitter at 4 Hz. `eyes` puts a pupil in the front lens. |
| `white-flag` | `color` | 1.2 Hz cloth wave. |
| `cleaver` | `chop: {at, from: -25, to: 35, dur: 0.8}` | Rotates about the wrist (outBack). |
| `bandage`, `pitchfork` | `color` | |
| `whistle` | `on` | |
| `remote`, `big-button` (ground) | `press: [t, …]` | The button sinks for 3 frames, with yellow ticks. |
| `bowling-ball` (ground) | `colors` (3 bands), `roll: {at, to: [dx, dy], wobble: 13}` | Rocks ±4° on twos for `wobble` frames, then launches in 4 frames. |
| `pins` (ground) | `count` 6, `hit: {at}`, `color` | Seeded throws with spin; each pin lands and stays lying on the floor, so the end frame shows them knocked down. Set `hit.at` to the ball's arrival: `roll.at` + (wobble + 4) / 30. |
| `chess` (ground) | `piece: "pawn"\|"knight"\|"king"\|"queen"`, `side: "white"\|"black"`, `topple: {at, dir}` | Falls 90° about the base in 7 frames (ease.in). |
| `ice-block` (ground) | `opacity` 0.55 | Put it after a frozen bean. |

**When to use:** labelled abstractions (sacks of DEBT), "pulled in" (magnet), "on closer look" (magnifier reveal), "cut down to size", "the offensive knocked them down" (bowling), "a game of strategy" (chess), "froze to death" (ice).

## Screens (feature 96)

| Kind | Fields | Timing |
| --- | --- | --- |
| `crt` | `screen` (shot id), `screenTime`, `text`, `screenColor`, `scan` 0.06, `bulge` true, `pullback: {at, dur: 0.66}`, `on: {at}` | The origin is the screen centre. `pullback` starts with the screen filling the frame and eases out to the prop over 20 frames (outCubic): "it was a game on a TV in a room". `on` goes dark, shows a 2-frame white line, then the image fades up through scanlines over 8 frames. |
| `monitor` | same | A beige box with a cool bloom on the surroundings. |

A sub-shot cannot show a shot that shows itself; that fails with a clear error.

## Time props (feature 97)

| Kind | Fields | Timing |
| --- | --- | --- |
| `wall-calendar` | `title`, `days` 31, `cross: {at, every: 0.05, count, from: 1}`, `circle: {at, day}`, `color`, `paper` | Each cross is 2 strokes of 2 frames. The circle draws itself over 6 frames. |
| `window-cycle` | `period` 1.0, `cycles` 3, `start: "day"\|"dusk"\|"night"`, `frame` | Each state holds 22 frames, then crossfades over 8. The sun has a sleepy face; at night there is a moon and twinkling stars. Pair it with a shot `grade` timeline. |
| `clock` (ground) | `style: "grandfather"\|"wall"`, `time: [h, m]`, `fast: {at, rate: 2}` (clock hours per second) | The pendulum swings ±12° with a 1.2 s period. |

**When to use:** "night after night", "rulers changed weekly", "time was running out".

## Emblems, stat blocks, chance (features 98, 99)

| Kind | Fields | Timing |
| --- | --- | --- |
| `emblem3d` (ground) | `shape: "star"\|"crown"\|"shield"\|"heart"\|"coin"\|"disc"\|"cross-plain"`, `color`, `depth` 22, `text`, `deliver: {by: "drop"\|"helicopter", at}`, `topple: {at, dir}` | Drop: a 5-frame fall, a 1-frame 110/92 squash, then dust specks. Topple: 90° about the base corner in 7 frames, then dust and a 6-frame shake. `swap` the crushed bean's pose to `lie` at the impact. Neutral shapes only. |
| `stat-block` (ground) | `color`, `tag: {header, name}`, `companion: {size, text, at, textColor}`, `deliver` | A lumpy cube with speckles and drips, and a nametag tilted −6°. The companion cube pops in with its label ("1000 A DAY!"). |
| `prize-wheel` (ground) | `segments: [{label, color, w}]`, `spin: {at, dur: 3.2, turns: 3.5, land, overshoot: 0.4}` | Deterministic: an exponential decay overshoots the `land` segment, then creeps back over the last 15 % (outBack). |
| `coin-flip` | `faces: [shape\|letter, …]`, `land: "A"\|"B"`, `dur` 1.6, `from: [0.3, 0.7]` (frame fractions from the landing point), `grow: [0.6, 1.6]`, `split: {at}` | A parabola into the layer position, flipping every 7 frames. Split: 1 white frame, then the jagged halves drift ±200 px, drop onto an invisible floor (`floor`, default 1.9 × radius below) and stay. |

**When to use:** "proclaimed himself X", "N people killed" as a physical object, "succession was random", "fate decided".

## Creatures v4 (feature 66)

`{ "type": "creature", "kind": "wolf", "size": 300, "pose": "stand"\|"sit"\|"biped", "walk": [[0, 2]], "expr": "angry", "talk": [[0, 1]], "hold": "torch", "color", "color2" }`

| Kind | Notes |
| --- | --- |
| `wolf`, `dog` | Grey or golden, with a white chest. One body silhouette with thigh and shoulder masses and thick jointed legs ending in paws. The wolf has a chest ruff. `sit` shows the haunch, straight forelegs and the tail along the floor. The dog has floppy ears. |
| `elephant` | `tower: true` adds a war tower with `rider` (cast) standing in it. Ear flap and trunk sway. |
| `pig`, `goat` | The goat has rectangular pupils, a beard and thick legs with dark hooves (scapegoat). |
| `rabbit` | Long ears. Hops inside `walk`. |
| `turtle` | Hex-pattern shell, slow 1.2 s stride. |
| `snail` | `head` takes any headwear kind. Leaves a slime line behind while `walk`ing (30 px/s; move the layer to match). |
| `kangaroo` | Always upright, with a thick tail and a pouch. Hops inside `walk`. `hold` puts a prop in its paws. |

`expr`: `neutral`, `angry`, `sad`, `happy`, `scared`, `shock`. `pose: "biped"` (wolf, dog, pig, goat, elephant, rabbit) gives a bean-proportioned animal that can `hold` a prop. Timing: legs move on twos (0.7 s per quadruped cycle, 0.56 s biped). The body bobs 2 px at 0.6 Hz, the ears twitch for 2 frames every ~2 s, and the tail sways at 1 Hz.

**When to use:** metaphor animals ("the wolf at the door", "fast vs slow", "scapegoat") and war animals.

## Vehicles v4 (feature 100)

| Kind | Fields | Notes |
| --- | --- | --- |
| `galley` | `sail` (`#1a1a1a` for an ominous sail), `crew` 4, `oars` 12, `row` true, `rowPeriod` 0.75, `color` | Bobs 4 px and pitches 1.5° over 2.2 s. The oars sweep on twos inside `drive`. |
| `bicycle` | `rider`, `riderExpr`, `riderPose`, `legColor` | The pedals turn every 10 frames while driving. The rider's legs follow the pedals. |
| `dump-truck` | `tilt` (degrees, a number or an `[{at, v, ease}]` timeline), `riders: [who, …]` | The bed turns about its rear hinge. Once `tilt` passes 25° the riders scream, slide off and pile up behind the truck. The body vibrates while driving. |
| `helicopter` | `load: {prop, size, cable: 220, ...prop fields}`, `color` | The rotor blur alternates every frame. The load swings ±6° on its cable. Pair it with `emblem3d` for "delivered by air". |

Move vehicles across the frame with `move`, and animate wheels, oars and rotors inside `drive` windows.
