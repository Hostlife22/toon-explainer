# 03 · Props, creatures and vehicles

In a word: give the narration physical things to point at. A treaty flexes its arms, a signpost spins to a new name, a cage drops on the accused, a crown is lowered by helicopter, a wolf sits at the door and a tank rolls into frame.

Engine: `scripts/engine/lib/props/props.js`, `props/props-world.js`, `props/props-gags.js`, `props/props-extra.js`, `props/vehicles.js`, `props/vehicles-machines.js`, `scripts/engine/lib/creatures/quadrupeds.js`, `creatures/spirits.js`, `creatures/animals-objects.js`, `scripts/engine/lib/base/widgets.js` · v2 rigs: `creatures/motion-path.js`, `creatures/creature-kit.js`, `creatures/quad-rig.js`, `creatures/beasts-hoofed.js`, `creatures/beasts-paws.js`, `creatures/beasts-small.js`, `props/vehicles-kit.js`, `props/vehicles-road.js`, `props/vehicles-rail-sea.js`, `props/vehicles-air.js` · Vocabulary: `scripts/vocab/creatures-vehicles-v2.json`, `scripts/vocab/props.json`, `scripts/vocab/props-extra.json`, `scripts/vocab/vehicles.json`, `scripts/vocab/creatures.json`, the `props` list of `scripts/vocab/places.json`, plus `KNOWN_PROPS` and the `prop` / `image` / `card` / `sign` / `calendar` layer types in `scripts/spec.py` · Example films: [`examples/creatures_vehicles_v2/spec.json`](../../examples/creatures_vehicles_v2/spec.json) (12 painted shots: gaits, states, new animals, cars, trains, ships, aircraft), [`examples/props_creatures/spec.json`](../../examples/props_creatures/spec.json) (34 shots, one per feature), [`examples/places_tour/spec.json`](../../examples/places_tour/spec.json) (vehicles), [`examples/eras_wardrobe/spec.json`](../../examples/eras_wardrobe/spec.json) (horses, reaper, birds, skeleton); render any of them with `--sheet` to browse · Related cards: [01 Characters](01_characters.md) (the bean that holds props, `pose: "sit"`, `cradle`), [02 Acting](02_acting.md) (`prohibit` sign, off-screen arms, `drop-squash` and other entrances), [04 Places](04_places.md) (rooms and floors to stand props on), [06 Paper and lettering](06_paper_and_lettering.md) (labels and number cards next to an object), [08 FX and tone](08_fx_and_tone.md) (impact FX, smoke, fire), [09 Transitions and lens](09_transitions_and_lens.md) (sub-shots and POV masks) · Shared layer fields (`at`, `out`, `x`, `y`, `scale`, `rot`, `flip`, `move`, `swap`, `jitter`, `swing`, `blur`, `enter`, `exit`): [03-spec-reference.md](../03-spec-reference.md).

## ① When to use it

| Sentence or beat in the narration | Use | Notes |
|---|---|---|
| "The economy / the treaty / the country did X" (an abstraction acts) | `obj` with `prop`, `vehicle` or `shape` + `face` + `arms` | `globe` for "the world", `heart` for "the heart of the nation" |
| Idiom puns ("footstool", "scapegoat", "the wolf at the door") | `obj` `shape: "footstool"`, `creature` `goat` / `wolf` | Say the idiom as the prop pops in |
| A labelled amount ("sacks of DEBT", "N people died") | `sack` with `text`, `stat-block` with `tag`, `coin-heap` | Pair with a `counter` from [06](06_paper_and_lettering.md) |
| "X, today known as Y"; "this way to disaster"; "here!" | `signpost` with `turn`; `fork-signs`; `marquee-arrow` | Land the sign with `enter: "drop-squash"` |
| "Arrested", "locked away", "they shut the gates", "it backfired" | `cage` `drop`; `gate` `close`; `portcullis`; `door` `open` + `behind: "fire"` | Add `camera.shake` on contact |
| Power and rank ("took the throne", "proclaimed himself X") | `throne` (`part`, `chains`, `sign`), `emblem3d` `deliver` | Crush the claimant with `topple` |
| Home and family beats | `bed` with `occupant`, `crib`, `swaddle`, `dinner-table`, `armchair`, `deckchair`, `coffin` | `coffin` + `flowers` for a death without gore |
| A speech, a lecture, a plan that fails | `lectern` (`mic`, `sign`), `easel` (`chart` with a crash), `megaphone` | Put the crash on the narrated word |
| "On closer inspection" | `magnifier` with `reveal` | Revealed layers stay in world position |
| "It was a game on a TV in a room"; "the news showed" | `crt` / `monitor` with `screen` + `pullback`; `smartphone`; `phone` `style: "smart"` | The screen plays another shot of the film |
| "Night after night"; "time was running out"; "days passed" | `window-cycle`, `wall-calendar` `cross`, `clock` `fast`, `calendar` count, `hourglass` | Pair with a shot `grade` timeline |
| Money buys the verdict, "justice for sale" (a pun close-up) | `coin-gavel` with `strike` | Hold it in a bean hand or fill the frame with it |
| A strategy game, a board of territories | `iso-tile` rows with `building` and `owner` | Draw back tiles first |
| Chance, fate, succession by lot | `prize-wheel` `spin`, `coin-flip` (`split` for a broken deal) | Both are deterministic |
| Strategy, an offensive, a frozen front | `chess` `topple`, `bowling-ball` + `pins`, `ice-block` over a bean | |
| Small handheld actions | `bottle` `pour`, `broom` `sweep`, `scissors` `snip`, `cleaver` `chop`, `remote` / `big-button` `press`, `phone` `ring`, `whistle` `on`, `magnet` `attract` | All work as bean `hold` items too |
| Metaphor animals and war animals | `creature`: `wolf`, `dog`, `pig`, `goat`, `rabbit`, `turtle`, `snail`, `kangaroo`, `elephant` (`tower`) | `pose: "biped"` lets an animal stand and hold a prop |
| Herds, cavalry, myth beasts | `creature`: `horse`, `bull`, `cow`, `camel`, `sheep` with `walk` / `run`, `rider`, `glow`, `tear` | A whole cavalry is a `crowd` with `creature` ([01](01_characters.md)) |
| Death, dread, omens, peace | `creature`: `reaper`, `skeleton`, `raven` (`headTurn`), `dove` | `reaper` `pose: "sign"` + `expr: "smile"` for the comic deflation |
| Travel, a new weapon, invasion, delivery | `vehicle`: `tank`, `train`, `car1910`, `biplane`, `caravel`, `junk`, `galley`, `steamer`, `submarine`, `rowboat`, `cart`, `cannon`, `bicycle`, `dump-truck`, `helicopter` | Move with `move`; animate inside `drive` |
| A character drawn by an image model | `image` with `frames` and `talk` | See [04-ai-assets.md](../04-ai-assets.md) |
| A note of rules, a list, a sign on a post, a tearing day calendar | `card`, `sign`, `calendar` | Rich paper documents live in [06](06_paper_and_lettering.md) |

## ② Look and staging rules

- **Ink and shade come for free.** Every kind draws through `T.outlined`: dark-brown ink (`#2a1c15`), one flat shade tone per colour, no gradients except glows, screens and the cleaver blade. When you pass `color`, pick a mid-saturation colour; the shade is derived from it.
- **Sizes that read at 1080p.** Hand props 160–300 px; a prop that is the subject of the shot 380–640 px; furniture 420–640; beans in the examples are 330–420 px, so a throne at 640 seats a 330-px king. Creatures 150 (snail, bird) to 470 (elephant); a jump-scare reaper 1400–1600 at `y` ≈ 1.5. Vehicles 300 (rowboat, cart) to 1100 (a three-car train). Lettering on props should still come out 56 px or more; `fitSize` shrinks text that does not fit, so shorten the text rather than trusting the shrink.
- **Origin.** Ground props stand with their bottom centre on (`x`, `y`): set `y` to the floor line (≈ 0.88). They are `signpost`, `fork-signs`, `throne`, `bed`, `lectern`, `easel`, `deckchair`, `coffin`, `crib`, `dinner-table`, `armchair`, `cage`, `door`, `gate`, `portcullis`, `coin-heap`, `big-button`, `bowling-ball`, `pins`, `chess`, `ice-block`, `clock`, `emblem3d`, `stat-block`, `prize-wheel`, `iso-tile` and `meat-grinder` (`TOON.PROP_GROUND`). Every other prop is centred on (`x`, `y`) so a hand can hold it: a centred `crate` or `barrel` is 0.9 × `size` tall, so stand it on a floor with `y = floorY − 0.45 × size / 1080`, and its top is at `y − 0.45 × size / 1080`. Vehicles and creatures stand on (`x`, `y`) (ground or waterline contact); `image` uses `anchor` (bottom centre by default); `card`, `calendar` are centred; `sign` stands on its post foot.
- **Three planes.** Background (`bg`), midground (beans, props, creatures, vehicles), foreground (`fg` from [04](04_places.md)). Layer order is draw order: a cage, a lectern, an ice block or the `throne` `part: "front"` must come after the bean they cover.
- **Safe frame.** Keep everything that must read inside 3.5 % of the edges; vehicles that drive through may start and end off-frame (`x` −0.1 → 1.1).
- **Facing.** Creatures and vehicles face screen right; use `flip: true` (any layer) or `dir: -1` (vehicles) to face left. Keep three-quarter readability: animals are drawn in profile with a 3/4 eye, beans riding them default to `view: "3q"`.
- **Hold and snap.** Props change state in 1–7 frames and then hold (cage 5, chess topple 7, door slam 7, signpost spin 22). Use `swap` for an instant change of `kind`, `text` or colour.
- **What to avoid.** No real extremist symbols: `banner` carries a plain disc and `emblem3d` only neutral shapes (`star`, `crown`, `shield`, `heart`, `coin`, `disc`, `cross-plain`). No real logos on screens. Violence uses stand-ins: `dagger` `tip` (red stand-in), `coffin`, `gravestone`, `cross`, a `cage`, never gore. Don't copy real mascots or real people into `image` cutouts.

## ③ Field reference

Times inside a layer are layer-local (they count from the layer's `at`). A field marked "event" takes `true` (at 0), a number (the `at`) or an object `{at, ...}`. Default entrances: `prop`, `obj`, `creature`, `vehicle`, `card` and `calendar` enter with `pop` (0.32 s); `image` and `sign` with `none`. Pass `enter: "none"` when something must already be in place at the cut.

### `prop` layer

`{"type": "prop", "kind": "<kind>", "size": 160, ...kind fields}`. `size` (default 160) is the prop's largest dimension in px. All kind fields below sit on the layer itself. `color` recolours the main surface where a kind lists it; kinds without `color` have a fixed palette.

**Basic props** (`props.js`, centred)

| Kind | Fields (defaults) | Look and motion |
|---|---|---|
| `coin` | `spin` (false), `text` (`$`) | Gold coin; `spin` turns it edge-on at ~1 Hz |
| `moneybag` | — | Tan sack with a gold `$` |
| `scroll` | `text` | Parchment with ruled lines and two rods |
| `sword` | — | Steel blade, gold guard |
| `flag` | `color` (`#fff`), `text` | Waving flag on a pole (wave ~1 Hz) |
| `question`, `exclaim` | — | White `?` rocking ±7° / red `!` shaking ±5° |
| `bread`, `temple`, `skull` | — | Loaf, Greek temple front, skull |
| `heart` | — | Red heart beating (8 % pulse) |
| `book` | `color` (`#7a3b2e`), `text` (gold) | Closed book, title on the cover |
| `hourglass` | — | Sand runs down and resets every 3.3 s |
| `shield` | `color` (`#c8141c`) | Legionary scutum with a gold boss and wings |
| `spear`, `torch` | — | Spear; torch with a flipbook flame |
| `bulb` | — | Idea bulb with a glow and pulsing rays |

**World props** (`props-world.js`, centred)

| Kind | Fields (defaults) | Look and motion |
|---|---|---|
| `rifle`, `grenade`, `canister` | `canister`: `color` (`#6a7a4a`) | Drawn upright; canister has a yellow gas band |
| `bomb` | — | Black bomb, fuse spark blinking at 7.5 Hz |
| `gravestone` | `title` (`R.I.P`), `text`, `color` (`#aab0bc`) | Rounded stone on a grass strip |
| `cross` | `color` (`#f2efe8`) | Plain grave cross |
| `pagoda` | `tiers` (4), `roof` (`#4a4a50`), `color` (`#a03a2a`) | Tiered tower |
| `castle` | `color` (`#9a9a96`), `flag` (true; `false` hides), `flagColor` (red) | Two towers, crenels, gate |
| `dome` | `color` (`#e8d8b0`), `domeColor` (`#3a8a7a`) | Domed building with a minaret-like tower |
| `tent` | `color` (`#8a6a3a`) | Army tent |
| `mug`, `croissant`, `teacup`, `telephone`, `microphone` | — | Beer mug with foam, pastry, blue-band cup, desk telephone, stand mic |
| `pawn` | `color` (`#2a2a2e`) | Board-game pawn |
| `pin` | `color` (red) | Map pin with a white dot |
| `crate` | `color` (`#9a6a3a`), `text` | Wooden crate 0.9 × `size` tall, X brace |
| `barrel` | `color` (`#8a5a32`) | Barrel with two hoops, 0.9 × `size` tall |
| `banner` | `color` (`#b8262a`), `emblem` (`#f2efe8`, the disc), `text` | Hanging banner with a plain disc, slow sway; for parties, regimes, factions |
| `placard` | `color` (`#f6efe0`), `text`, `textColor` (red) | Protest sign on a stick |
| `prohibit` | `icon` (a prop kind drawn under the bar), `color`, `highlight` | Red "no" ring and bar; full details in [02 Acting](02_acting.md) |

**Signposts** (ground)

| Kind | Fields (defaults) | Motion |
|---|---|---|
| `signpost` | `text` (`\n` breaks a line), `arrow` (`false` \| `"left"` \| `"right"`), `tilt` (−6°), `post` (true), `stake` (true), `w` (= `size`), `h` (0.42 × `size`), `color` (`#b07a3c`), `textColor` (`#3a2414`), `stack: ["TEXT", ...]` (joke planks below), `turn` (event `{at, text, dir: -1, arrow}`; a 1-frame lean and a 22-frame pinwheel spin, the new text lands 23 frames after `at`, so start it 0.77 s before the word) | Wobbles ±1° at 0.5 Hz. `turn`: 1 frame of +15° anticipation, 22-frame pinwheel spin with 4 ghost copies, lands on `turn.text` with the arrow mirrored when `dir` is −1 (or set to `turn.arrow`), settles over 6 frames |
| `fork-signs` | `left` (`LEFT`), `right` (`RIGHT`), `colorL` (`#b07a3c`), `colorR` (`#9a6a34`), `textColor`, `w` (0.62 × `size`), `stake` | Two arrow planks on one post pointing apart |
| `marquee-arrow` (centred) | `text`, `curve` (0.4), `color` (`#3a1426`), `bulb` (`#ff7ad9`) | Curved thick arrow, 14 bulbs chasing in threes at 10 Hz, wobble ±2° at 1 Hz. Aim with `rot` |

**Furniture** (ground except `swaddle`)

| Kind | Fields (defaults) | Notes |
|---|---|---|
| `throne` | `color` (`#b8202c` velvet), `frame` (`#e2b23c` gold), `pointed`, `chains` (event; `chainColor` `#9a9aa2`), `sign`, `textColor` (`#c0202a`), `part` (`"back"` \| `"front"`, default both) | Chains run in 0.2 s as three strands bolted to the arm posts, then a padlock pops (0.15 s). `sign` hangs on cords above the back, clear of a crown. Seat a bean with `pose: "sit"` at `y` − 0.06 between two layers: `part: "back"` before the bean, `part: "front"` after it |
| `bed` | `occupant: {who, expr, view}` or an array of them, `two` (duplicates one occupant), `quilt` (`#f2efe9`), `color` (`#8a5a3a` wood), `view` (`"side"` \| `"top"`) | The cast member's head lies on the pillow; the sheet breathes at 0.4 Hz |
| `lectern` | `color` (`#7a4a2a`), `low` (narrower top), `sign` (front text), `poster` (text on a board behind), `textColor` (`#f2c230` for `sign`, `#c0202a` for `poster`), `mic` | Put the speaker's layer before the lectern |
| `easel` | `text`, `textColor`, `board` (`#f3ead2`), `chart: {pts: [[x, y], ...] (0–1), at, dur: 1.5, crashAt (index, default last), color: "#3fae3a", crashColor: "#d0302a"}`, `prohibit`, `flipAt` + `after: {text, chart, prohibit, board}` | The chart draws on (ease.inOut); the crash segment snaps in over 4 frames with an arrowhead. `flipAt` flips the page over 6 frames and shows `after` |
| `deckchair` | `stripes` (`["#e8504a", "#f3ead2"]`), `cocktail` | Complacency: a bean in it with sunglasses |
| `coffin` | `color` (`#7a4a2a`), `open`, `flowers`, `lying` | `lying` turns it horizontal |
| `crib` | `color` (`#c99a5a`), `babies` (0) | Draws `swaddle` babies behind the bars |
| `dinner-table` | `color` (`#8a5a3a`), `cloth` (`#f2efe9`) | One-point table with plates, glasses and a roast |
| `armchair` | `color` (`#7a2030`), `view` (`"front"` \| `"back"`) | Tufted wingback |
| `swaddle` (centred) | `color` (`#cfe2f2`) | Wrapped baby; a bean holds it with `pose: "cradle"` |

**Cage, door, gate, portcullis** (ground)

| Kind | Fields (defaults) | Motion |
|---|---|---|
| `cage` | `drop` (event), `lock`, `color` (`#2a2a24`) | Falls 1300 px in 5 frames (ease.in), squashes 3 % over 3 frames. Hidden before `drop.at`. Back bars at half alpha |
| `door` | `color` (`#8a5a3a`), `frame` (`#5a3a22`), `slam` (event), `open` (event, `dur` 0.4), `behind` (`"dark"` \| `"fire"` \| `"#hex"` \| a shot id), `screenTime` (time of that shot, default the layer time), `knocker` | Slam: the leaf bows for 3 frames, impact ticks for 2, springs back over 2. Open: the leaf turns 0 → 80° (ease.out). `fire` adds flipbook flames and a light spill |
| `gate` | `close` (event, `dur` 0.33) or `open` (event, `dur` 0.6), `behind`, `color` (`#5a5040`) | Two plank leaves in a stone arch; on closing a pale 12-spike starburst for 7 frames, ticks and dust |
| `portcullis` | `drop` (event `{at, dur}`), `dur` (0.85), `bars` (7), `arch` (true), `behind` | The bars grow down (ease.in) with a 2 % overshoot in the last 3 frames. Without `drop` it drops at 0 |

**Claw, awards and grinder** (`props-extra.js`; centred except the ground-standing grinder)

| Kind | Fields (defaults) | Look and motion |
|---|---|---|
| `claw-crane` | `load` (optional prop-kind string), `drop: {at: 0, dur: 0.53, from: 0.6}` (these defaults also apply when omitted), `releaseAt` (`drop.at + drop.dur`), `color` (`#d0d4dc`) | Cable reaches the top edge, including vertical frames. Layer origin is the load's rest centre; the load is drawn at 0.5 × `size` with ground origins adjusted to centre. `drop.from` is a fraction of `size` above rest; lower over `dur` seconds, open over 0.1 s at `releaseAt`, leave the load at rest and raise the claw by `from` over 0.4 s. Schedule release after lowering. Use `enter: "none"` for this measured action |
| `rosette` | `text` (`AWARD`; `\n` splits lines), `color` (`#c8323a`), `ribbon` (same as `color`; `ribbonColor` is an alias, `ribbon` takes precedence), `swing` (false; set true for the shared layer pendulum: ±8°, 1.2 s period, decay 2.2) | Pleated red badge, cream text centre, two ribbon tails. Pin a separate prop layer over a character's chest; shorten the text or split it across lines for phone readability |
| `meat-bone` | `color` (`#c0503a`) | Neutral cartoon ham and cream bone, centred; works as bean `hold` / `holdL` |
| `bucket` | `color` (`#9aa3ab`), `tilt` (0°, number or numeric timeline), `upside` (false) | Metal pail and arched handle, centred with the complete silhouette about `size` tall. `upside: true` adds 180° for a hat; position a separate layer over the head. Works as bean `hold` / `holdL` at their standard 170 px size |
| `meat-grinder` (ground) | `crank` (`[]`, active windows `[[a,b], ...]`), `extrude` (absent; when set: `{at: 0, dur: 2, len: 600, color: "#c0503a"}`), `feed` (optional prop-kind string), `feedAt` (0) | Bottom-centre stand, hopper, hand crank and right-facing nozzle. Crank makes one turn per 0.6 active seconds on twos, pauses between windows and resumes; overlapping windows count once. Sausage grows horizontally to `extrude.len` logical px (independent of `size`), with pinches every 90 px. `feed` is 0.3 × `size`, waits above the hopper, then sinks out of sight in 0.53 s from `feedAt`. Use `flip` for a left-facing nozzle |
| `cobweb` | `corner` `tl` (`tr`, `bl`, `br`: the corner of the prop's box the web hangs in), `color` #eef0f2, `spider` false (a spider on a thread that bobs) | A web across one corner, sagging strands with a faint ink edge. Place it at a door or room corner to show a place re-used in an abandoned state (siege short 0:32) |
| `banana-peel` (ground) | `color` #f2d23a | A peel on the floor: three splayed flaps, a standing core and a brown stem. Show it before the victim walks in (Rome 28:05) |
| `region` | `pts` [[x, y], …] (-0.5..0.5 of `size`; default a blob), `rough` 0.6 (coastline wobble), `seed`, `color` #d9a54a, `outline` true, `shade` true, `face` (a mood or `{mood, accessory, scale}` as on map regions), `label`, `labelSize` | A territory as a standalone object: a coastline shape with one flat shadow rim, an optional map-region face and a name. Layer modifiers work on it (`material: "gold"` / `"stone"`), as do `move` steps and `swap`: lift a country off the map, carry it, crown it |

**Handheld gag props** (centred, so they work as `hold` items)

| Kind | Fields (defaults) | Motion |
|---|---|---|
| `sack` | `text`, `textColor`, `dollar` (green `$` instead of text), `color` (`#c9a06a`) | |
| `bottle` | `text`, `textColor`, `label` (`#efe6cf`), `color` (`#5a3a22`), `liquid` (`#d9b84a`), `pour` (event, `dur` 0.5) | Tips to 110° (ease.inOut) and pours a stream after 60 % |
| `candle` | `color` (`#efe6cf`) | Flame flickers ±6 % on twos, warm glow |
| `key` | `color` (`#e8c040`), `hook` | `hook` hangs the key on a brass wall hook at the anchor, so `swing` pivots on the hook |
| `broom` | `sweep` (event, `dur` 1.2), `color` (handle) | ±20°, one sweep every 6 frames, dust puffs |
| `magnet` | `color` (`#c8202a`), `attract` (event, `target: [dx, dy]` px from the prop, default `[0, 1.4 × size]`) | Zigzag bolts redrawn on twos, expanding arcs, pole glow at 1 Hz |
| `phone` | `style` (`"brick"` \| `"flip"` \| `"rotary"` \| `"smart"`), `ring: [t, ...]`, `color` | Ring: ticks and 1.5 px jitter on twos for 0.5 s. `smart` takes the screen fields below |
| `smartphone` | `screen` (shot id), `screenTime`, `text`, `textColor`, `screenColor`, `scan`, `bulge` | A lit screen showing another shot |
| `megaphone` | `on` (`true` or `[[a, b], ...]`), `color` (`#b08a3a`) | Sound ticks pulse on twos |
| `magnifier` | `zoom` (1.4), `reveal: {at, layers: [...], scale}` | Without `reveal` it magnifies whatever is drawn under the lens. With `reveal` the lens shows the hidden `layers` (full layer objects, world position) fading in over 6 frames |
| `scissors` | `snip: [t, ...]`, `color` (`#c8202a` handles) | Blades shut in 2 frames, reopen in 4 |
| `mallet` | `style` (`"wood"` \| `"giant"`), `color` (`#d8b890`) | |
| `dagger` | `tip` (`true` or a colour: red stand-in on the tip), `reflect` (cast id: a tiny bust in the blade), `reflectExpr` (`angry`) | |
| `boxing-glove` | `color` (`#c8302a`), `badge` (`true` or a list of stripe colours) | |
| `chain` | `w` (= `size`), `link` (1, link scale), `scroll` (0 px/s), `ball`, `color` (`#8a8a92`) | Face-on and edge-on links; `scroll` drags the chain |
| `coin-heap` (ground) | `count` (34), `chest`, `color` (`#f2c230`) | Seeded coins and banknotes; 3 glints jump at 7.5 Hz |
| `coin-gavel` | `color` (`#f2c230` gold), `wood` (`#8a5a34`), `strike: [t, ...]` | A judge's gavel whose head is a stack of gold coins seen edge-on, a `$` coin face on the end and a glint. Each `strike` swings the head down 25° in 3 frames and back in 4 |
| `iso-tile` (ground) | `color` (`#7cbf4a` grass), `earth` (`#8a5a34`), `depth` (0.2 of `size`), `owner` (border colour), `building` (`"none"` \| `"house"` \| `"tower"`) | Isometric strategy-game tile: a 2:1 grass diamond `size` wide on a thick earth slab, a grass lip, seeded tufts; `owner` draws a coloured border diamond inset on the top, and the tower flag takes the owner colour. Neighbours sit `size`/2 apart in x and `size`/4 apart in y |
| `binoculars` | `color` (`#2e2e34`), `eyes` | Three-quarter view, 2 px hand jitter at 4 Hz; `eyes` puts a pupil in the front lens |
| `white-flag` | `color` (`#f6f3ee`) | Cloth waves at 1.2 Hz |
| `cleaver` | `chop: {at, from: -25, to: 35, dur: 0.8}` | Rotates about the wrist (outBack) |
| `bandage` | `color` (`#f2b48c`) | Adhesive plaster strip |
| `pitchfork` | `color` (`#8a5a2a` handle) | |
| `whistle` | `color` (`#c0392b`), `on` (`true` or windows) | Blast ticks pulse on twos |
| `remote` | `press: [t, ...]`, `color` (`#4a4a50`) | The red button sinks for 3 frames with yellow ticks |
| `big-button` (ground) | `press: [t, ...]`, `color` (`#c81a1a`) | Same press, bigger ticks |
| `bowling-ball` (ground) | `colors` (three bands, `["#2a5aa8", "#f2efe9", "#c8302a"]`), `roll: {at, to: [dx, dy] (default [900, 0]), wobble: 13}` | Rocks ±4° on twos for `wobble` frames, then launches over 4 frames (ease.in) spinning 40°/frame |
| `pins` (ground) | `count` (6, up to 10), `hit` (event), `color` (`#f6f3ee`) | Seeded throws with spin; each pin lands and stays lying on the floor. Set `hit.at = roll.at + (wobble + 4) / 30` |
| `chess` (ground) | `piece` (`"pawn"` \| `"knight"` \| `"king"` \| `"queen"`), `side` (`"white"` \| `"black"`), `color`, `topple` (event, `dir` 1 \| −1) | Falls 90° about the base in 7 frames (ease.in) |
| `ice-block` (ground) | `opacity` (0.55), `color` (`#bfe8ea`) | Put it after a frozen bean |

**Screens** (centred on the screen)

| Kind | Fields (defaults) | Motion |
|---|---|---|
| `crt` | `screen` (shot id), `screenTime` (default layer time), `text` + `textColor` (`#e8f4ff`) when no screen, `screenColor` (`#1d2a33`), `scan` (0.06, scanline darkness; 0 = off), `bulge` (true), `color` (`#1c1c22` cabinet), `pullback` (event, `dur` 0.66), `on` (event) | `pullback`: starts with the screen filling the frame and eases out to the prop over 20 frames (outCubic). `on`: dark for 2 frames with a white line, then the image fades up through heavy scanlines over 8 frames |
| `monitor` | same; `color` (`#e8dca8` beige box), `screenColor` (`#1a3a4a`) | Cool bloom on the surroundings |

**Time props**

| Kind | Fields (defaults) | Motion |
|---|---|---|
| `wall-calendar` (centred) | `title` (`MONTH`), `days` (31), `cross: {at, every: 0.05, count: 0, from: 1}`, `circle: {at, day}`, `color` (`#c0392b` header), `paper` (`#f3ead2`) | Each red cross is 2 strokes of 2 frames, one day every `every` s. The circle draws itself over 6 frames |
| `window-cycle` (centred) | `period` (1.0 s per state), `cycles` (3), `start` (`"day"` \| `"dusk"` \| `"night"`), `frame` (`#5a4a3a`) | Each state holds for `period` minus 8 frames, then crossfades over the last 8; sleepy-faced sun, moon and twinkling stars at night |
| `clock` (ground) | `style` (`"grandfather"` \| `"wall"`), `time` (`[10, 8]`), `fast: {at, rate: 2}` (clock hours per second), `color` (`#6a3a22`) | Pendulum ±12° with a 1.2 s period; hands run in real time unless `fast` |

**Emblems, stat blocks, chance**

| Kind | Fields (defaults) | Motion |
|---|---|---|
| `emblem3d` (ground) | `shape` (`star`; also `crown`, `shield`, `heart`, `coin`, `disc`, `cross-plain`), `color` (`#c8213a`), `depth` (22 px extrusion), `text`, `textColor` (`#ffffff`), `deliver: {by: "drop" \| "helicopter", at}`, `topple` (event, `dir` 1) | Drop: hidden before `at`, 5-frame fall, 1-frame 110/92 squash, dust specks for 6 frames. `by: "helicopter"` only draws a static cable above. Topple: 90° about the base corner in 7 frames, then a 6-frame shake and dust |
| `stat-block` (ground) | `color` (`#9a2a5a`), `tag: {header: "HELLO, I AM", name}`, `companion: {at, text, size (0.18 × size), textColor: "#ffd21a"}`, `deliver`, `topple` | Lumpy cube with speckles and drips, a nametag tilted −6°; the companion cube pops in (0.25 s outBack) with its label |
| `prize-wheel` (ground) | `segments: [{label, color, w}]` (6 WIN / LOSE / AGAIN segments by default), `spin: {at, dur: 3.2, turns: 3.5, land: 0, overshoot: 0.4}` | Deterministic: exponential decay overshoots the `land` segment, then creeps back over the last 15 % (outBack) |
| `coin-flip` | `faces` (`["star", "crown"]`: emblem shapes or letters), `land` (`"A"` \| `"B"`), `dur` (1.6), `from` (`[0.3, 0.7]`, start offset in frame fractions from the layer position), `grow` (`[0.6, 1.6]`), `split` (event, default at `dur`), `floor` (1.9 × radius) | Parabola into (`x`, `y`) flipping every 7 frames. `split`: 1 white frame, then the jagged halves drift ±200 px over 12 frames, fall onto the invisible floor and stay |

### Bean `hold` and `holdL`

`hold` (right hand) and `holdL` (left hand) on a `bean`, a `crowd` or a cast look take any centred prop kind above (the validator checks the `props` vocabulary). How the hand draws it:

| Prop | Size in the hand | Orientation |
|---|---|---|
| `sword` | 170 | The blade follows the forearm |
| `spear` | 420 | Shaft stays nearly upright (tilt up to ±20°) |
| `torch` | 170 | Upright, burning |
| `shield` | 260 | Centred on the hand |
| any other kind | 170 | Upright, centred 60 px above the hand |

Pair with poses from [01 Characters](01_characters.md): `hold`, `hold-high`, `carry`, `cradle` (`hold: "swaddle"`), `sword-up`, `present`. Ground props (`signpost`, `chess`, …) draw upward from the hand, so prefer centred kinds for holding. Creatures hold props through their own `hold` (biped animals, kangaroo, reaper) and riders through `riderHold` / `riderHoldL`.

### `obj` layer: a personified object

`{"type": "obj", "prop": "sack", "size": 220, "x": 0.5, "y": 0.88, "face": {...}, "arms": {...}, "legs": true, "head": "fez"}`. Origin: the bottom of the body, or the feet when `legs` is set. Breathes with a 1.5 % squash at 0.6 Hz.

| Field | Default | Meaning |
|---|---|---|
| `prop` | — | Body is any prop kind; the layer's other fields go to that prop (`text`, `turn`, `color`, …). Centred props are lifted so they stand on the origin |
| `vehicle` | — | Body is any vehicle kind; `drive` and `speed` animate it |
| `shape` | `blob` | Used when neither `prop` nor `vehicle`: `blob`, `disc`, `globe` (sea + seeded continents, `land` colour `#4aa84a`), `heart` (`shade` colour), `footstool` (tufted cushion on a wooden apron with four turned legs, `wood` `#a8743a`) |
| `color` | per shape | Recolours the shape body (or the prop / vehicle) |
| `size` | 200 | Body size in px |
| `face` | `{mood: "neutral", pos: [0, -0.55], scale: 1}` | `mood`: any bean expression, constant or `[{at, v}]` timeline (snaps in 1 frame). `pos`: fraction of `size` from the origin. `eyes` / `mouth`: override the eye and mouth kinds. `color`: brow ink. `face: false` hides it |
| `talk` | — | `[[a, b], ...]` windows: talking mouth at 10 Hz |
| `blink` | true | Blinks every ~3 s for 3 frames |
| `arms` | — | `true` or `{pose, at, sprout, color: "#ffffff", glove: "#fbfaf6", hand: 1, hold, holdSize: 0.5, span: 0.42, y: -0.45, w: 0.075, count}`. White tube arms with cartoon gloves. `pose` (constant or timeline): `idle`, `flex`, `wave`, `point`, `hold`, `crossed`, `punch`. `wave` / `point` / `punch` act with the screen-right arm; `hold` puts a prop in that hand at `holdSize` × `size`. `span` and `y` place the shoulders (fractions of `size`), `w` the tube width, `hand` scales the gloves, `count` limits `punch` repeats |
| `legs` | false | Two short legs with shoes; they step on twos inside `walk` windows. `legColor` (`#f4f1ea`), `shoeColor` (`#6b4423`) |
| `walk` | — | `[[a, b], ...]` windows for `legs` |
| `head` | — | Any headwear kind from [01 Characters](01_characters.md), on the top edge. `headSize` (0.35), `headX` (0), `headY` (−1), `headTilt` (0°), `headColor`, `headColor2` |
| `bandage`, `cracked` | false | Crossed plaster strips beside the face; seeded crack lines over the body |

### `creature` layer

`{"type": "creature", "kind": "<kind>", "size": ..., "x": 0.5, "y": 0.88}`. `size` is the on-screen height; feet at (`x`, `y`); faces right (`flip: true` for left). `walk` and `run` are `[[a, b], ...]` windows.

**Herd quadrupeds** (`quadrupeds.js`): `horse`, `bull`, `cow`, `camel`, `sheep`. Default `size` 360.

| Field | Default | Effect |
|---|---|---|
| `walk`, `run` | — | Legs swing in diagonal pairs on twos: walk 0.7 s per stride (±18°), run (gallop) 0.42 s (±34°) with a body bob and 3° pitch |
| `gaitRate` | 1 | Speeds up both gaits |
| `color`, `color2` | per kind; hooves `#3a2a20` | Body and hoof colours |
| `horns` | bull `long`, cow `short` | `"long"` \| `"short"`; bull and cow heads only |
| `hornColor`, `muzzle` | `#c9ccd2`, pinkish | Bull and cow heads only |
| `spots`, `spotColor` | cow true, `#2a2624` | Seeded body patches |
| `glow` | — | `true` (white) or a colour: halo around the body for divine animals |
| `tear` | — | A tear under the eye (bull and cow) |
| `eyes` | — | `"evil"`: glowing red slit (bull and cow) |
| `rider` | — | Cast id seated on the back, legs hidden, saddle cloth drawn. `riderPose` (`idle`), `riderExpr` (`neutral`), `riderHold`, `riderHoldL`, `riderView` (`3q`), `riderScale` (1), `riderY` (0, vertical offset in animal units), `saddle` (`#8f1f27`) |

**More animals** (`animals-objects.js`): `wolf`, `dog`, `elephant`, `pig`, `rabbit`, `turtle`, `goat`, `snail`, `kangaroo`. Default `size` 300. Body bobs 2 px at 0.6 Hz.

| Field | Applies to | Effect |
|---|---|---|
| `pose` | `stand` (default), `sit` (wolf, dog, goat, pig, elephant), `biped` (wolf, dog, pig, goat, elephant, rabbit) | `sit`: haunch on the ground, straight forelegs, tail on the floor. `biped`: bean-proportioned animal standing on two legs |
| `walk`, `run` | all | Quadrupeds 0.7 s per cycle (run 0.42 s), biped 0.56 s, legs on twos. Rabbit and kangaroo hop (0.5 s per hop); turtle strides every 1.2 s; snail leaves a slime line (30 px/s; move the layer to match) |
| `expr` | all | `neutral`, `angry`, `sad`, `happy`, `scared`, `shock` (brow + eye shape); blinks every ~2.7 s; ears twitch for 2 frames every ~2 s |
| `talk` | wolf, dog, goat, pig, rabbit, snail | Mouth opens at 10 Hz inside the windows |
| `hold` | `biped` animals, kangaroo | Any prop kind in the paw |
| `color`, `color2` | all | Body and belly / shell / muzzle colour |
| `tower`, `rider`, `riderScale`, `riderPose`, `riderExpr`, `riderHold`, `saddle` | elephant (`tower: true` adds a war tower with the `rider` standing in it); pig and elephant also seat a plain `rider` | Wolf, dog and goat ignore `rider` |
| `head`, `headColor` | snail | Any headwear kind on the eye stalks |

Looks: `wolf` grey with a white chest ruff; `dog` golden with floppy ears; `goat` white with rectangular pupils, a beard and hooves (scapegoat); `pig` pink with a curly tail; `elephant` with flapping ears and a swaying trunk; `rabbit` with long ears; `turtle` with a hex-pattern shell; `snail` with a spiral shell; `kangaroo` always upright with a pouch and a thick tail.

**Spirits and birds** (`spirits.js`)

| Kind | Fields (defaults) | Look and motion |
|---|---|---|
| `reaper` | `size` (460), `expr` (`neutral` \| `smile` \| `menace`, constant or timeline), `pose` (`idle` \| `reach` \| `sign`, constant or timeline), `hold` (`"scythe"` or any prop kind, drawn at 200 with the layer's fields), `rim` (`#8a8a8a` outline, reads on dark), `robe` (`#141416`), `mask` (`#f2f0ec`) | Skull mask with fangs, ragged robe ending in a ghost tail, long-fingered gloves, zig-zag antenna wiggling at 4 fps; bobs 8 units with a 1.6 s period |
| `raven`, `dove` | `size` (160), `flap` (windows), `fly` (dove default true), `perch` (true; `false` hides the perch legs), `headTurn` (snaps the head every ~1.7 s), `color` | Wings beat on an 8-frame cycle (4 up, 4 down) while flapping or flying |
| `skeleton` | every `bean` field (`who`, `pose`, `expr`, `talk`, `walk`, `look`, …) | The bean rig with `outfit: "skeleton"` and `headShape: "skull"` |

### `vehicle` layer

`{"type": "vehicle", "kind": "tank", "x": 0.1, "y": 0.86, "size": 620, "drive": [[0, 3.5]], "move": [{"at": 0, "dur": 3.5, "to": [0.62, 0.86], "ease": "linear"}]}`. Origin: ground or waterline contact, centred; `size` (default 480) is the overall width.

| Field | Default | Effect |
|---|---|---|
| `drive` | — | `[[a, b], ...]`: wheels spin, treads scroll, paddles, oars and propellers turn, land vehicles bob 4 px (3 bounces/s). Wheels stop where they were when a window ends. Move the vehicle with `move`, or keep it still and pan the camera |
| `speed` | 1 | Scales wheel spin |
| `dir` | 1 | −1 faces left (riders mirror with it) |
| `bobAmp` | 4 | Land-vehicle bob in px while driving |
| `rock` | 2.5 | Boats (`steamer`, `submarine`, `junk`, `caravel`, `rowboat`) always rock this many degrees plus a 4 px heave; `biplane` always bobs 8 px |
| `color` | per kind | Main colour (the sail for `junk` and `caravel`) |

| Kind | Extra fields (defaults) | Look and motion |
|---|---|---|
| `tank` | `color` (`#7d6a52`), `burning` | Mark I lozenge, perimeter tread ticks, sponson gun, rivets; `burning` adds flames and black smoke |
| `car1910` | `riders: [who, ...]` (seated beans, `talk` passes through), `color` (`#2f3e5a`) | Open-top car, spoked wheels |
| `train` | `cars` (3), `color` (`#6a6e74`), `engineColor` (`#2f3236`), `smoke` (always smoke; otherwise only while driving) | Engine with coupling rod, carriages with windows |
| `steamer` | `color` (`#2c2a30` hull) | Two smoking funnels, rotating paddle wheel |
| `submarine` | `face` (`true` \| `"angry"`), `color` (`#5d6a72`) | Cigar hull, conning tower, propeller blur |
| `junk` | `color` (`#b03030` sails) | Crescent hull, two battened sails |
| `caravel` | `color` (`#f1e6cc` sails), `cross` (true), `crossColor` (red) | Three masts, a cross on the main sail |
| `rowboat` | `riders`, `color` (`#9a6a3a`) | Oars row while driving |
| `biplane` | `color` (`#b8a070`), `roundel` (`#2d3f9a`), `burning` (smoke trail) | Struts, roundels, pilot, propeller blur |
| `cannon` | `fire: [t, ...]`, `color` (`#3a3d42` barrel) | Each shot: 3-frame muzzle flash, 30-unit recoil easing back over 0.5 s, smoke for 1.4 s |
| `cart` | `load` (a prop kind, drawn at 110 units), `color` (`#9a6a3a`) | Plank box on a spoked wheel |
| `galley` | `sail` (`#d8c49a`; `#1a1a1a` for an ominous sail), `crew` (4), `oars` (12), `row` (true), `rowPeriod` (0.75), `color` (`#5a3a22`) | Bobs 4 px and pitches 1.5° over 2.2 s; oars sweep ±20° on twos inside `drive` |
| `bicycle` | `rider`, `riderExpr`, `riderPose` (`hold`), `riderHold`, `riderScale` (1), `legColor` (`#3a3a44`), `talk`, `color` (`#b8282c` frame) | One pedal turn per 10 frames of driving; the rider's legs follow the pedals |
| `dump-truck` | `tilt` (degrees, number or `[{at, v, ease}]` timeline), `riders: [who, ...]`, `color` (`#f2d02f`) | The bed turns about its rear hinge; once `tilt` passes 25° the riders scream, slide off (accelerating) and pile up behind the truck with `expr: "dead"`. Vibrates while driving |
| `helicopter` | `load: {prop, size: 300, cable: 220, ...prop fields}`, `color` (`#5a7a4a`) | Rotor blur alternates every frame, body rocks ±2°, the load swings ±6° on its cable (1.6 s) |

### Motion 2.0: path, gaits and trails

Any layer can travel a `path: {pts, at, dur, ease, curve, orient, face, bank, loop}` (always an object; field reference in [03-spec-reference.md](../03-spec-reference.md#common-layer-fields)): constant speed along the curve, auto facing with a squash through a turn, `orient` to the tangent, `bank` into curves. Creatures and vehicles read the distance actually travelled (along `path`, or along `move` steps), so feet stay planted and wheels never skid.

**v2 rigs and the classic look.** New kinds always use their v2 rig. The existing kinds `horse`, `cow`, `bull`, `sheep`, `pig`, `camel`, `elephant`, `dog`, `wolf` (creatures) and `tank`, `train`, `biplane`, `submarine`, `car1910` (vehicles) switch to their v2 rig in the painted look, with a new field (`gait`, `state`, `path`, `terrain`, `lights`, `dust`, `exhaust`, `wake`, `contrail`, `animal`, `team`, `flock`, `school`) or with `rig: "v2"`; otherwise they keep their classic drawing pixel for pixel. `rig: "classic"` forces the old drawing; `pose: "biped"` and the elephant `tower` always use it.

**Creature fields (v2)**

| Field | Default | Effect |
|---|---|---|
| `gait` | auto when moving | `walk` (4-beat, 0.62 duty), `trot` (diagonal pairs), `gallop` (`run`; rotary, with a moment of suspension), `auto` (by speed: idle under 0.12 leg lengths/s, walk, trot from 2.4, gallop from 5.2, cross-faded). Constant or `[{at, v}]` timeline (0.3 s blends). Feet are planted while in stance: the stride is locked to the distance travelled; on the spot the cycle runs at a cadence (walk 0.9, trot 1.35, gallop 1.9 cycles/s, times `gaitRate`) |
| `state` | `idle` | `idle` (breathing, weight shift, ear and tail flicks, blinks, look-around), `walk` / `trot` / `run` / `gallop`, `eat` (head down, chewing, tail swish), `sleep` (lies down, legs folded, eyes shut, slow breath, "z" marks), `scared` (rears back, ears flat, wide eyes, tremble, sweat, tail tucked), `sit` (dog, wolf, cat, bear; the legacy `pose: "sit"` maps to it). Birds: `fly`, `glide`, `idle` (perched). Timeline allowed |
| `expr` | by state | Toon eye with pupil, lid and brow: `neutral`, `happy`, `angry`, `sad`, `scared`, `shock`, `worried`, `sleepy`, `evil`, `smug`, `dead`, plus the bean names they map to |
| `walk`, `run` | — | Legacy windows still work (walk, gallop) |
| `rider` | — | Horse, cow, bull, camel, elephant: seated cast member, saddle cloth, near leg and boot, bridle and reins (horse); `riderPose`, `riderExpr`, `riderHold`, `riderHoldL`, `riderScale`, `riderY`, `riderLeg`, `riderBoot`, `saddle`, `tackColor`. `tack: true` puts the bridle on a riderless horse |
| `color`, `color2`, `mane` | per kind | Body, belly / muzzle, mane and tail colour. `blaze` (horse white stripe), `spots` / `spotColor` (cow), `horns` (`long` / `short`), `hornColor`, `muzzle`, `ring`, `tusks: false`, `stripes: false` (cat) |
| `glow`, `tear`, `eyes: "evil"`, `talk` | — | As on the classic animals |
| `flock` (bird), `school` (fish) | 1 | Draws n members in a seeded formation, each on its own flap / swim phase and drift; `spread` (1) scales a flock |
| `contact` | on | Painted look: soft shadow under the feet (stays on the ground and shrinks during a `jump`); `false` turns it off |
| `dust` | on dirt | Animals moving faster than a trot kick up dust puffs from the hooves on `ground: "dirt"` and on `desert`, `battlefield`, `trench`, `graveyard`; `true`, `false` or an amount overrides |

New creatures: `cat` (striped, slit pupils, curling tail), `bear` (heavy, clawed paws), `rat` (long bare tail), `chicken` (two-leg walk with the head that holds still in space then snaps forward, pecks in `eat`, flaps when `scared`), `bird` (flap 1.1 s then glide 0.7 s; flap rate rises with speed; perch legs when idle), `fish` (body wave growing to the tail, tail beat follows the swim speed, bubbles; `bubbles: false`), `snake` (slither: a ground-locked wave, so the body does not slide; tongue flicks; `length` 900, `raised`).

**Vehicle fields (v2)**

| Field | Default | Effect |
|---|---|---|
| `path` / `move` | — | Travel. Wheels, treads, rods and the team's gait follow the distance; `drive` windows still spin things on the spot (220 px/s of virtual travel) |
| `terrain` | road (tank `rough`, chariot / wagon `dirt`) | Suspension over seeded bumps: `smooth`, `road`, `rail`, `cobble`, `dirt`, `rough`; the body lifts and pitches between its axles |
| `exhaust`, `dust`, `smoke`, `steam`, `wake` | on where it fits | World-space trails: puffs are emitted on a fixed time grid along the vehicle's past positions and stay behind it (motor exhaust, dust on `dirt` / `rough`, chimney and funnel smoke, cylinder steam, foam wake). Whether a puff exists and how big it is is decided at its emission time, so speeding up never moves smoke already in the air. `false` turns one off |
| `contrail` | false | Plane / biplane: a fading white ribbon along the flown path |
| `lights` | false | Headlight cone (additive) |
| `riders` / `rider` | — | Seated cast members in cars, the driver of a chariot / wagon / locomotive, the pilot, the balloonist |
| `animal`, `team` | `horse`, 2 | Chariot and wagon: the creature kind and count pulling it (v2 rig, gait locked to the travel); `animalColor`, `animalColors: [...]` |
| `engine` | true | false stops the idle shiver |

| Kind | Extra fields (defaults) | Look and motion |
|---|---|---|
| `model-t` | `color` (`#23252b`) | ~1908 tourer: canopy on posts, brass radiator and lamp, 12-spoke wheels, fenders and running board |
| `sedan1920` | `color` (`#6a1e24`), `color2` (roof) | Long louvred hood, closed cabin with two windows, wire wheels, spare tyre |
| `car1950` | `color` (`#5ab0b8`), `color2` (`#f4efe6` roof and flash) | Rounded fenders with skirts, chrome bumpers and strip, whitewalls, tail light |
| `car-modern` | `color` (`#d8322e`) | Low hatch, tinted glass, alloy wheels, LED lamps |
| `tank` (v2) | `color`, `burning`, `terrain` | Lozenge hull with plates and rivets, tread links and six road wheels moving with the distance, exhaust stack smoke, dust |
| `chariot` | `rider`, `color` (`#b8862e`), `color2` (trim) | Two-wheeled car behind a galloping / trotting team, pole to the yoke |
| `wagon` | `rider`, `cover` (true), `load` (prop, when uncovered), `color`, `color2` (canvas) | Covered wagon with hooped canvas, wood-grain box, four spoked wheels |
| `locomotive`, `train` (v2) | `cars` (2), `color`, `color2` (red), `carColor`, `rider`, `smokeColor`, `lights` | Steam engine: driving wheels with coupling and connecting rods phase-locked to the wheel angle, chimney smoke thicker when slow, cylinder steam, carriages swaying with a lag |
| `ship` | `style` (`liner` \| `warship`), `color` (hull), `color2` (superstructure), `funnel`, `boot`, `name`, `rock` | Heaves and pitches on two crossing swells, bow wave with spray growing with speed, funnel smoke, foam wake |
| `sailship` | `color` (sails), `color2` (hull), `cross`, `crossColor`, `flag` | Two tiers of bellied square sails (fuller with speed), pennants streaming back, wood-grain hull |
| `submarine` (v2) | `face`, `periscope`, `depth` (0..1 or timeline: sinks under a water tint), `water` | Ribbed hull, prop blur, bubble stream |
| `plane` | `color`, `roundel`, `rider` (pilot), `contrail`, `burning`, `gear` | Monoplane; rolls on turns from the path `bank` (the wing foreshortens, shows its underside, swaps in front of / behind the body), prop blur |
| `biplane` (v2) | `color`, `roundel`, `rider`, `contrail`, `burning` | Fabric-textured fuselage, struts, two wings rolling with the bank |
| `zeppelin` | `color`, `mark`, `burning` | Ribbed envelope, fins, gondola with windows, two prop blurs, slow pitch |
| `balloon` | `colors` / `color`, `color2`, `rider` | Striped envelope, ropes, wicker basket, burner flame on a seeded schedule, pendulum sway |
| `rocket` | `color`, `color2`, `ignite` | Fins, porthole; flickering three-tone flame and launch shake while it moves or with `ignite`; smoke column left in the world. Stands on its fins; on a `path` with `orient` it flies nose first |

### Widgets (`base/widgets.js`)

| Layer | Fields (defaults) | Behaviour |
|---|---|---|
| `image` | `src` or `frames: {idle, talk, blink}` (paths relative to the spec), `w` (image width), `anchor` (`[0.5, 1]`), `talk` (windows), `squash` (true), `shadow` (true) | AI cutout (PNG with alpha). During `talk` the idle and talk frames alternate at 8 Hz; `blink` shows for 4 frames every ~3.1 s; a 1 % breathing squash at 0.55 Hz (plus jitter while talking); a contact shadow when the anchor is at the bottom (`anchor[1]` ≥ 0.95) |
| `card` | `w` (760), `h` (460), `title`, `titleColor` (red), `lines: [...]`, `every` (0.45 s), `lineSize` (46), `color` (`#f6e7c1`) | Parchment note; line *i* slides in from the left over 0.25 s at 0.25 + *i* × `every` |
| `sign` | `text` (`\n` breaks a line; required), `w` (360) | Static wooden board on a 310-px post, cream lettering fitted to 54 px. For a sign that spins or lands, use the `signpost` prop |
| `calendar` | Page mode: `pages: [{head, num, headColor}]`, `every` (0.6 s per page), `delay` (0). Count mode: `head`, `from` (1), `to` (31), `dur` (3), `delay`, `ease` (`outCubic`). Both: `size` (420), `headColor` (red) | Page-a-day block on two rings. Page mode tears each page in the last 45 % of its time (it flies up-right and rotates). Count mode rolls the number and tears at 10 Hz while counting |

### Helpers for module authors

`T.drawProp(ctx, kind, size, lt, fields)` draws any prop (throws on an unknown kind); `T.PROP_GROUND` lists ground-origin kinds; `T.PROP3` exports the shared prop helpers (`stick`, `words`, `ticks`, `chainLinks`, `padlock`, `screen`, …); `T.withPropEnv(env, fn)` gives `drawProp` the cast and sub-shot environment; `T.drawCoil(ctx, pts, {r: 44, pitch: 84, color, width: 8, ink: 17})` draws an ink-outlined coil spring along a polyline; `T.smokePuffs(ctx, x, y, lt, {n: 5, color, rise: 160, size: 34, seed, drift: -60})`; `T.EMBLEM_SHAPES`; `T.drawCreatureEye(ctx, x, y, L)`; registries `T.PROPS`, `T.VEHICLES`, `T.CREATURES`.

## ④ Timing

All counts at 30 fps; field values are seconds unless marked.

| Action | Frames | Field |
|---|---|---|
| Default `pop` entrance | 10 (0.32 s) | `enter`, `enterDur` |
| `drop-squash` landing (signs, emblems) | 15 (0.5 s): 2-frame fall, squash, rebound | `enter: "drop-squash"` |
| Signpost turn | 1 anticipation + 22 spin + 6 settle | `turn.at` |
| Cage drop | 5 fall + 3 squash | `drop.at`; stagger cages by 1 frame, `swap` the prisoner to `scream` on frame 5 |
| Door slam | 3 bow + 2 hold (ticks) + 2 spring back | `slam.at` |
| Door open | 12 (0.4 s) | `open.dur` |
| Gate close | 10 (0.33 s) + 7 starburst | `close.dur`; add `camera.shake` 6 px at `close.at + 0.33` |
| Portcullis | 25 (0.85 s), last 3 overshoot | `dur` / `drop.dur` |
| Throne chains | 6 (0.2 s) + padlock pop 5 | `chains.at` |
| Easel chart | 45 (1.5 s) draw + 4 crash | `chart.at`, `chart.dur`; `flipAt` page flip 6 |
| Bottle pour | 15 (0.5 s) | `pour.dur` |
| Scissors snip | 2 shut + 4 open | `snip` |
| Coin-gavel strike | 3 down + 4 back | `strike` |
| Button press | 3 sink | `press` |
| Bowling roll | `wobble` (13) rock + 4 launch | `roll`; pins `hit.at = roll.at + (wobble + 4) / 30` |
| Chess / emblem topple | 7 fall (+ 6 shake for emblems) | `topple.at` |
| Emblem / stat-block drop | 5 fall + 1 squash + 6 dust | `deliver.at` |
| Stat-block companion | 8 (0.25 s) outBack | `companion.at` |
| CRT pull-back | 20 (0.66 s) outCubic | `pullback` |
| CRT power-on | 2 dark + 8 scanline fade | `on.at` |
| Magnifier reveal | 6 fade | `reveal.at` |
| Calendar cross | 2 strokes × 2 frames, one per `every` (0.05 s = 1.5 frames) | `cross` |
| Calendar circle | 6 | `circle.at` |
| Window cycle | 22 hold + 8 crossfade per state at `period` 1.0 | `period`, `cycles` |
| Prize wheel | 96 (3.2 s): decay to overshoot over 85 %, outBack back over 15 % | `spin` |
| Coin flip | one face every 7 frames over `dur` (48); split 1 white + 12 drift | `dur`, `split.at` |
| `obj` arm sprout | 3 per arm, second arm 10 frames later; flex pulse every 12 | `arms.at` |
| `obj` punch | 11-frame cycle: extend 2, hold 3, retract 3, rest 3 | `arms.at`, `arms.count` |
| Herd walk / gallop | 21 / 12.6 per stride, on twos | `walk`, `run`, `gaitRate` |
| Animal walk / biped walk | 21 / 17 per cycle, on twos | `walk` |
| Hop (rabbit, kangaroo) | 15 per hop | `walk` |
| Bird wingbeat | 8 (4 up, 4 down) | `flap`, `fly` |
| Raven head snap | every ~51 | `headTurn` |
| Bicycle pedal | 10 per turn | `drive`, `speed` |
| Galley oar stroke | 22 (0.75 s) | `rowPeriod` |
| Cannon shot | 3 flash, 15 recoil, 42 smoke | `fire` |
| `image` talk / blink | 4-frame swaps (8 Hz) / 4 frames every ~93 | `talk`, `frames.blink` |
| `card` lines | first at 8, then every 13.5 (0.45 s), 8-frame slide | `every` |
| `calendar` pages | 18 per page (0.6 s), tear in the last 8 | `every` |

Shot length guide: a prop gag beat (land, react) fits in 2.5–3.5 s; a vehicle crossing the frame 3–3.5 s; a reaper fade-in uses `enterDur` 2.5 inside a 4 s shot.

## ⑤ Recipes

- **Claw delivery:** `{"type":"prop","kind":"claw-crane","x":0.5,"y":0.5,"size":420,"enter":"none","load":"pawn","drop":{"at":0.2,"dur":0.53,"from":0.6},"releaseAt":0.73}` lowers, releases and retracts; align the rest centre with a throne seat for a coronation gag.
- **Unmerited award:** `{"type":"prop","kind":"rosette","x":0.52,"y":0.59,"size":260,"text":"DID NOTHING\nWRONG\nAWARD","swing":true}` goes after the bean, pinned over its chest.
- **Neutral food icon:** `{"type":"prop","kind":"meat-bone","x":0.5,"y":0.5,"size":360,"color":"#c0503a"}`; a bean can instead use `"hold":"meat-bone"`.
- **Bucket helmet:** `{"type":"prop","kind":"bucket","x":0.5,"y":0.36,"size":220,"upside":true,"tilt":-8}` goes over the head; use `"hold":"bucket"` on a bean for a carried pail.
- **Grinder metaphor:** `{"type":"prop","kind":"meat-grinder","x":0.35,"y":0.88,"size":440,"enter":"none","crank":[[0.5,2.5]],"feed":"pawn","feedAt":0.5,"extrude":{"at":0.7,"dur":2,"len":600,"color":"#c0503a"}}` turns a neutral game piece into linked sausage.

**1. "The treaty flexed its muscles"** (an abstraction acts): a personified scroll sprouts arms on the verb.
```json
{"type": "obj", "id": "treaty", "prop": "scroll", "text": "TREATY", "size": 300, "x": 0.6, "y": 0.86, "legs": true,
 "face": {"mood": [{"at": 0, "v": "neutral"}, {"at": 0.6, "v": "smug"}], "pos": [0, -0.74], "scale": 0.6},
 "arms": {"pose": "flex", "at": 0.6, "sprout": true, "span": 0.66}, "talk": [[1.4, 2.4]]}
```

**2. "Alba Longa, today known as Castel Gandolfo"**: the sign lands, then spins to the new name.
```json
{"type": "prop", "kind": "signpost", "id": "sign1", "x": 0.4, "y": 0.88, "size": 380, "enter": "drop-squash",
 "text": "ALBA LONGA", "arrow": "right", "turn": {"at": 1.4, "text": "CASTEL\nGANDOLFO"}}
```

**3. "He was arrested on the spot"**: the cage comes after the prisoner, the prisoner screams on impact (frame 5).
```json
[{"type": "bean", "who": "host", "x": 0.4, "y": 0.88, "size": 400, "pose": "idle", "swap": [{"at": 0.67, "expr": "scream", "pose": "scared"}]},
 {"type": "prop", "kind": "cage", "id": "cage1", "x": 0.4, "y": 0.88, "size": 560, "drop": {"at": 0.5}, "lock": true}]
```
Add `"camera": {"shake": [{"at": 0.67, "dur": 0.2, "amp": 8}]}` to the shot.

**4. "And then it backfired"**: a calm door opens onto fire; the host recoils as it opens.
```json
[{"type": "prop", "kind": "door", "id": "door1", "x": 0.62, "y": 0.88, "size": 520, "color": "#3a8a4a", "open": {"at": 1.2, "dur": 0.4}, "behind": "fire"},
 {"type": "bean", "who": "host", "x": 0.36, "y": 0.88, "size": 380, "pose": [{"at": 0, "v": "point"}, {"at": 1.3, "v": "scared"}], "expr": [{"at": 0, "v": "smug"}, {"at": 1.3, "v": "shock"}]}]
```

**5. "He proclaimed himself emperor, and it crushed him"**: an emblem drops, then topples onto its owner.
```json
[{"type": "bean", "who": "king", "x": 0.66, "y": 0.88, "size": 320, "pose": [{"at": 0, "v": "point-up"}, {"at": 2.4, "v": "lie"}], "expr": [{"at": 0, "v": "happy"}, {"at": 2.0, "v": "shock"}, {"at": 2.4, "v": "dead"}]},
 {"type": "prop", "kind": "emblem3d", "id": "star", "x": 0.4, "y": 0.88, "size": 520, "shape": "crown", "color": "#e2b23c", "deliver": {"by": "drop", "at": 0.2}, "topple": {"at": 2.1, "dir": 1}}]
```

**6. "Night after night, the days crossed off"**: window cycle and wall calendar side by side, under a darkening `grade`.
```json
[{"type": "prop", "kind": "window-cycle", "x": 0.28, "y": 0.42, "size": 360, "period": 1.0, "cycles": 1},
 {"type": "prop", "kind": "wall-calendar", "x": 0.66, "y": 0.42, "size": 380, "title": "SIEGE", "cross": {"at": 0.3, "every": 0.06, "count": 26}, "circle": {"at": 2.2, "day": 28}}]
```

**7. "Succession was decided by chance"**: the wheel lands on a chosen segment after an overshoot.
```json
{"type": "prop", "kind": "prize-wheel", "x": 0.5, "y": 0.9, "size": 560,
 "segments": [{"label": "HEIR", "color": "#9ad43a"}, {"label": "UNCLE", "color": "#d63a4a"}, {"label": "GENERAL", "color": "#3a8ad6"}, {"label": "NOBODY", "color": "#f2a63a", "w": 2}],
 "spin": {"at": 0.3, "dur": 3.2, "turns": 3.5, "land": 2}}
```

**8. "It was all a game on a TV"**: an earlier shot plays on a CRT that pulls back into a room.
```json
{"type": "prop", "kind": "crt", "x": 0.5, "y": 0.5, "size": 620, "screen": "p04_signpost_flip", "pullback": {"at": 0.2, "dur": 0.66}}
```
`screen` must name another shot of the same spec.

**9. "The market rose for years, then crashed"**: easel chart with the crash on the narrated word.
```json
{"type": "prop", "kind": "easel", "x": 0.6, "y": 0.9, "size": 640, "text": "MARKET",
 "chart": {"pts": [[0, 0.2], [0.3, 0.4], [0.6, 0.62], [0.8, 0.8], [0.95, 0.06]], "at": 0.3, "dur": 1.6}}
```
Add a `camera.shake` at `chart.at + chart.dur`.

**10. "The knights charged"**: a galloping horse with a rider and a spear, crossing the frame.
```json
{"type": "creature", "kind": "horse", "x": 0.1, "y": 0.9, "size": 340, "rider": "knight", "riderHold": "spear", "riderExpr": "angry",
 "run": [[0, 3]], "move": [{"at": 0, "dur": 3, "to": [0.8, 0.9], "ease": "linear"}]}
```
For a whole charge use a `crowd` with `creature: "horse"` and `gallop: true` ([01](01_characters.md)).

**11. "The scapegoat"**: the idiom as an animal, sad, walking off.
```json
{"type": "creature", "kind": "goat", "x": 0.7, "y": 0.88, "size": 330, "expr": "sad", "flip": true,
 "walk": [[0.8, 3]], "move": [{"at": 0.8, "dur": 2.2, "to": [0.45, 0.88], "ease": "linear"}]}
```

**12. "Death was always watching"**: the reaper fades in behind, then deflates the mood.
```json
[{"type": "creature", "kind": "reaper", "x": 0.68, "y": 0.86, "size": 420, "enter": "fade", "enterDur": 2.5, "alpha": 0.9,
  "expr": [{"at": 0, "v": "neutral"}, {"at": 2.8, "v": "smile"}], "pose": [{"at": 0, "v": "idle"}, {"at": 2.8, "v": "sign"}]},
 {"type": "creature", "kind": "raven", "x": 0.12, "y": 0.4, "size": 140, "headTurn": true}]
```
Jump-scare variant: hard cut, black `flat` bg, `reaper` at `size` 1500, `y` 1.5, `pose: "reach"`, `expr: "menace"`, `enter: "none"`. The horror reference holds it **dead still for 4.2 s** (no shake, `camera.zoom` [1, 1]) and leaves through `fade-white` (The God of Horror 13:03.2); a short `camera.shake` is the louder, comic variant.

**13. "A new weapon appeared"**: a tank drives in from the frame edge.
```json
{"type": "vehicle", "kind": "tank", "x": 0.1, "y": 0.86, "size": 620, "drive": [[0, 3.5]],
 "move": [{"at": 0, "dur": 3.5, "to": [0.62, 0.86], "ease": "linear"}]}
```
Cut on a `zoom-punch` to the shocked soldier ([09](09_transitions_and_lens.md)).

**14. "The crown was delivered by air"**: a helicopter carries an emblem on a swinging cable.
```json
{"type": "vehicle", "kind": "helicopter", "x": 0.28, "y": 0.34, "size": 700, "drive": [[0, 3]],
 "load": {"prop": "emblem3d", "shape": "crown", "size": 300, "cable": 220, "color": "#e2b23c"},
 "move": [{"at": 0, "dur": 3, "to": [0.56, 0.34], "ease": "inOut"}]}
```

**15. "They were all thrown out"**: the dump truck tips its riders when `tilt` passes 25°.
```json
{"type": "vehicle", "kind": "dump-truck", "x": 0.56, "y": 0.88, "size": 900, "riders": ["host", "king"],
 "tilt": [{"at": 0, "v": 0}, {"at": 0.8, "v": 0}, {"at": 2.0, "v": 38, "ease": "inOut"}]}
```

**16. "Invasion fleet"**: boats rock on their own, so `drive` is optional; stagger the moves.
```json
[{"type": "vehicle", "kind": "caravel", "x": 0.2, "y": 0.62, "size": 300, "move": [{"at": 0, "dur": 3.5, "to": [0.45, 0.64], "ease": "linear"}]},
 {"type": "vehicle", "kind": "galley", "x": 0.7, "y": 0.78, "size": 700, "sail": "#1a1a1a", "dir": -1, "drive": [[0, 3.5]], "move": [{"at": 0.3, "dur": 3.2, "to": [0.55, 0.78], "ease": "linear"}]}]
```

**17. "The rules were simple"**: a card whose lines follow the narration.
```json
{"type": "card", "x": 0.5, "y": 0.48, "title": "THE RULES", "lines": ["1. No kings", "2. Two consuls", "3. One year each"], "every": 0.8}
```

**18. "Thirty days passed"**: the day calendar counts and tears.
```json
{"type": "calendar", "x": 0.5, "y": 0.5, "size": 420, "head": "JUNE", "from": 1, "to": 30, "dur": 2.4, "delay": 0.3}
```

**19. A talking AI cutout**: idle, talk and blink frames from an image model.
```json
{"type": "image", "src": "assets/c_idle.png", "frames": {"idle": "assets/c_idle.png", "talk": "assets/c_talk.png", "blink": "assets/c_blink.png"},
 "w": 520, "anchor": [0.5, 1], "x": 0.3, "y": 0.92, "talk": [[0.5, 2.5]]}
```

**20. "Justice was for sale"**: a coin gavel strikes on the verdict word over a board of owned tiles.
```json
{"type": "prop", "kind": "iso-tile", "x": 0.62, "y": 0.8, "size": 380, "building": "tower", "owner": "#c8302a"},
{"type": "prop", "kind": "iso-tile", "x": 0.8, "y": 0.8, "size": 380, "building": "house", "owner": "#3a6ea5"},
{"type": "prop", "kind": "coin-gavel", "x": 0.3, "y": 0.5, "size": 520, "enter": "drop-squash", "strike": [1.2]}
```

### Cavalry charge along a road (v2)

```json
{"type": "creature", "kind": "horse", "size": 300, "rider": "knight", "riderHold": "spear", "riderExpr": "angry",
 "path": {"pts": [[-0.1, 0.92], [0.5, 0.9], [1.1, 0.93]], "dur": 3, "ease": "in"}}
```

The horse starts in a walk, breaks into a trot and a gallop as it speeds up (auto gait), feet planted on the ground.

### A plane banking through a turn with a contrail

```json
{"type": "vehicle", "kind": "plane", "size": 300, "contrail": true,
 "path": {"pts": [[-0.1, 0.6], [0.35, 0.35], [0.7, 0.55], [1.1, 0.25]], "dur": 4, "ease": "linear", "orient": 35, "bank": 50}}
```

## ⑥ Limits and pitfalls

- **Draw order covers.** `cage`, `lectern`, `ice-block` and `throne` `part: "front"` must come after the bean they cover; `throne` `part: "back"` before it. A single `throne` layer draws the chains behind a later bean.
- **Centred vs ground origin.** Putting a centred prop (`crate`, `barrel`, `mug`) at the floor `y` sinks half of it into the floor; use `y = floorY − 0.45 × size / 1080` for crates and barrels. Ground props held in a hand draw upward from the hand.
- **`color` is ignored** by fixed-palette kinds: `moneybag`, `sword`, `bread`, `temple`, `skull`, `heart`, `hourglass`, `spear`, `torch`, `bulb`, `question`, `exclaim`, `rifle`, `grenade`, `bomb`, `mug`, `croissant`, `teacup`, `telephone`, `microphone`, `smartphone`, `cleaver`, `dagger` (use `tip`), `scissors` blades, `easel`, `coffin` lining. Use an `fx` material ([08](08_fx_and_tone.md)) or `swap` to another kind instead.
- **Sub-shots.** `crt`, `monitor`, `smartphone`, `phone` `style: "smart"` and `door` / `gate` / `portcullis` `behind: "<shot id>"` render another shot; a shot cannot show itself and nesting stops at 2 levels (clear error). The sub-shot keeps its own camera and runs at `screenTime` or the layer time.
- **Magnifier without `reveal`** magnifies what is already drawn under it, so put it after the layers it should magnify.
- **Unchecked nested kinds.** The validator checks `kind`, `hold` and `holdL`, but not `obj.prop`, `obj.vehicle`, `load.prop`, `cart` `load`, `arms.hold` or `riderHold`. A typo in `obj.prop` / `obj.vehicle` / `load.prop` / `cart` `load` throws at render; a typo in `arms.hold` silently draws nothing.
- **Creature `expr`** for the animals in `animals-objects.js` has six profile faces (`neutral`, `angry`, `sad`, `happy`, `scared`, `shock`); `evil`, `rage`, `mad`, `smug`, `content`, `worried`, `cry`, `scream` and `sleepy` map onto them, anything else falls back to `neutral`. The herd quadrupeds have no `expr` at all; use `eyes: "evil"` and `tear` (bull and cow only).
- **Head-specific fields.** `horns`, `hornColor`, `muzzle`, `eyes` and `tear` only show on the bull and cow heads; `horse`, `camel` and `sheep` ignore them. `talk` does nothing on `elephant`, `turtle`, `kangaroo`. `kangaroo` ignores `pose`. Wolf, dog and goat ignore `rider`; use a `horse`, `camel`, `pig` or `elephant`.
- **Dove flies by default.** A perched dove needs `fly: false`.
- **Wheels only turn inside `drive`.** A vehicle moved with `move` but no `drive` slides with frozen wheels; boats and the galley hull still rock without `drive`, but galley oars only row inside it.
- **`deliver: {by: "helicopter"}`** on `emblem3d` / `stat-block` only draws a static cable going up out of frame; for a real flight use a `helicopter` `vehicle` with `load`.
- **Dump-truck riders** fall only if the `tilt` timeline passes 25°; once off the bed they lie behind the truck for the rest of the shot.
- **Window cycle with `period` below 1.0** truncates the 8-frame crossfade (the hold is fixed at 22 frames), so states snap; that is fine for a fast time-lapse, not for a calm one.
- **Coin flip** arrives from an offset (`from`, frame fractions) to its own `x`, `y`: place the layer at the landing point, not the start.
- **`sign` layer is static** with fixed colours; for a spin, a drop or a coloured plank use the `signpost` prop.
- **`calendar` count mode** only tears while counting; after `dur` it holds the last number. In page mode the last page never tears.
- **`image` paths** are relative to the spec and only files referenced by the spec are served to the renderer; the contact shadow disappears when `anchor[1]` is above 0.95.
- **Determinism.** Seeded detail (coins, cracks, grain, pins) depends on `id`; give two layers of the same kind different `id`s so they don't look identical, and keep an `id` stable so a re-render matches.
