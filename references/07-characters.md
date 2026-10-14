# 07 · Characters v3: headwear, outfits, head modes, creatures

v3 extends the bean rig so one engine can cast any era: the ancient world, the Middle Ages, East Asia, the 1800s, both world wars and horror. Everything is driven by fields in `cast` (or a layer's `look`), so a character keeps the same design in every shot. The example [`examples/v3_characters/spec.json`](../examples/v3_characters/spec.json) shows every item.

Engine files:
- `lib/costume.js`: headwear registry `T.HEADWEAR`.
- `lib/outfit.js`: outfits `T.OUTFITS` plus head modes.
- `lib/face.js`, `lib/rig.js`: wiring.
- `lib/creatures.js`: quadrupeds.
- `lib/spirits.js`: reaper, birds, skeleton.
- `lib/crowd.js`: lineup and mounted crowds.

## Headwear (`head`)

Every kind is view-aware: visors and fringes sit on the face side in 3/4, and masses lean to the back. Colors come from `headColor`, `headColor2` and `headColor3`.

| Era | Kinds |
|---|---|
| Ancient / medieval | `crown`, `laurel`, `helmet` (Roman, crest via `crest`), `hood`, `pontifex`, `headband`, `hat`, `great-helm` (flat-top cylinder, eye slit, breath cross), `nasal-helm`, `turban` (`veil: true` or a color covers mouth and chin; `headColor2` is a jewel), `jester` |
| 1800s–1900s | `tophat` (`headColor2` band), `bowler`, `fedora`, `beret`, `safari`, `newsboy-cap`, `graduation`, `kepi`, `fez` |
| World wars | `pickelhaube` (brass spike via `headColor2`), `brodie` (tin hat), `adrian` (crest ridge), `dome` (generic WWII bowl), `officer-cap` (band `headColor2`, visor, badge), `ushanka` |
| East Asia | `straw-cone` (douli), `official-cap` (`fringe: true` for an emperor's bead fringe; `headColor2` band), `qing-hat` (pair it with `hair: "queue"`) |

## Outfits (`outfit`)

An outfit draws over the bell body and brings defaults (trousers, shoes, belt) that the cast entry can still override.

| Outfit | Look | Useful fields |
|---|---|---|
| `suit` | Jacket, white shirt V, tie, lapels, shoes | `tie`, `bowtie: true`, `shirt` |
| `tunic` | WWI/WWII service tunic: stand collar, shoulder straps, brass buttons, chest pockets, belt with ammo pouches | `robe` (feldgrau `#77735e`, khaki `#a48a5a`, horizon blue `#6d84a8`), `buttonColor`, `belt` |
| `greatcoat` | Long coat to the ankles, fold-down collar, double buttons | `robe` |
| `hanfu` | Cross collar, wide sleeves, sash, hanging tassel panel | `trim2` collar, `sashColor`, `apron` |
| `kimono` | Cross collar and a wide obi | `trim2`, `sashColor` |
| `lamellar` | Checker-scale armor, shoulder flaps, scarf | `armor`, `scarf` (color or `false`) |
| `surcoat` | Crusader tabard with a cross over mail | `crossColor`, `sleeve` (mail) |
| `hivis` | Reflective vest | `vest` |
| `skeleton` | Rib cage and pelvis; implies the skull head | — |

Extras that combine with any outfit:
- `medals: N`: ribbon bars and medals.
- `puttees: true | color`: leg wraps.
- `shoes: color`: replaces the sandals.
- `apron: color`.
- `skirt: "tiered"` with `skirtColors`.
- `sleeveW`: sleeve width; wide sleeves are about 60–70.

## Head modes

| Field | Effect |
|---|---|
| `flag: {pattern, colors}` | Countryball head. Patterns: `h3`, `v3`, `disc`, `cross`, `nordic`, `crescent`, `stripes` (`count`). Adds a shaded rim and gloss. Eyes become white ovals unless `flagEyes: false`. `flagMouth: false` hides the mouth; `flagCrack: true` marks a broken empire. Use `hair: "bald"`. |
| `mask: "gas"` | WWI gas mask: face plate, two goggles, ribbed snout and canister. `maskColor`. |
| `tint: color` | Multiplies a color over the face, e.g. gas green `#7fae4a` or sickly grey. `tintAlpha` (0.5); `tintAt` fades it in over 0.5 s from that layer time. |
| `headShape: "bull"` | Minotaur-style bull head with ribbed horns, nose ring and glowing red slit eyes. Set `skin`, `hornColor`, `eyeColor`, `noseRing: false`. |
| `headShape: "skull"` | Skull head (skeletons, the dead). |

New expressions:
- `mad`: rotating spiral eyes and a jagged grin.
- `evil`: glowing red slits and angry brows.
- `sick`: dark eye rings and a blood trickle.

New hair: `queue`. New beards:
- `long`: a grey beard to the chest.
- `walrus`: a big drooping mustache; color it with `mustacheColor`.

## Creatures (`type: "creature"`)

| Kind | Construction | Fields |
|---|---|---|
| `horse`, `bull`, `cow`, `camel`, `sheep` | Quadruped rig: rounded body (hump for bull/camel, wool puffs for sheep), neck, kind-specific head, 4 tapering legs swinging in diagonal pairs on twos, swaying tail | `size` (height px), `walk` / `run` windows, `gaitRate`, `color`, `color2` (hooves), `horns` (`long`/`short`), `spots`, `glow` (`true` or a color, for divine animals), `tear`, `eyes: "evil"`, `muzzle` |
| (any quadruped) + `rider` | A cast member sits on the back. The rider's legs are hidden and a saddle cloth is drawn. | `rider`, `riderPose`, `riderExpr`, `riderHold`, `riderHoldL`, `riderView`, `riderScale` (1), `riderY`, `saddle` |
| `reaper` | Skull mask with fangs, black ragged robe ending in a ghost tail, light-grey rim, zig-zag antenna, long-fingered gloves, 6 px bob | `expr`: `neutral` / `smile` / `menace`; `pose`: `idle` / `reach` / `sign`; `hold` (`scythe` or any prop); `rim`, `robe`, `mask` |
| `raven`, `dove` | Bird on a perch, or flying | `headTurn` (snaps every ~1.7 s), `flap` windows, `fly`, `perch: false`, `color` |
| `skeleton` | The bean rig with a skull head and rib outfit | All bean fields (`pose`, `talk`, `walk`, ...) |

Walk cycles run at 0.7 s per stride and gallop at 0.42 s, both on twos. The gallop adds a body bob and pitch.

## Crowds

- `mode: "lineup"`: a diagonal row of big overlapping faces (each 5% smaller, about 40% overlap); `dir` is ±1. Use it for "the generals", "the suspects" or "the nations".
- `creature: "horse"`: every member rides a horse (`who` are the riders); `gallop: true`, `hold`.
- Crowds pick up every new look automatically. Back rows are tinted by depth.

## Recipes

1. **Nations as people.** Use a `burst` background. Put countryball beans in a row with expressions per line of narration, and add a `fez`, `beret` or `pickelhaube` as a costume gag. Snap one to `angry` on the key word.
2. **Over the top (WWI).** Tunic and `brodie` soldiers with `puttees` in a `crowd` with `march`. Cut to a close-up, then a gas beat: `tint` fades in with `tintAt`, then cut to the `mask: "gas"` version.
3. **The council.** Use `mode: "lineup"` with `suit` + `tophat` statesmen and `tunic` + `officer-cap` generals (`medals`, `beard: "walrus"`). One `talk` window per speaker.
4. **Cavalry charge.** A `crowd` with `creature: "horse"`, `gallop: true` and knights in `surcoat` + `great-helm` holding spears. The camera pans 500–700 px; add `fg: grass` at `z` 1.5.
5. **It is always watching.** A dim interior with a sad character in front and a `reaper` behind (`enter: "fade"`, `enterDur` 2.5). Switch `expr` to `smile` and `pose` to `sign` for the comic deflation. A `raven` with `headTurn` sits in the corner.
6. **Jump scare.** A quiet hold, then a hard cut to a black `flat` bg with a `reaper` at `size` 1400–1600, `y` about 1.5, `pose: "reach"`, `expr: "menace"` and camera `shake`.
7. **Myth creature reveal.** Mist and storm, then a `bull` with `glow: true` and `tear: true` for pathos. Its offspring is a bean with `headShape: "bull"` and `eyes` glowing red.
8. **Court of another dynasty.** `hanfu` + `official-cap` (`fringe: true`) emperor, `qing-hat` officials with `hair: "queue"`, and `kimono` or `lamellar` guards.
