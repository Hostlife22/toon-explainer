# 01 · Characters
In a word: one bean rig casts anyone from any era (a legionary, a WWI private, a countryball, an angel, a toddler, a villain seen from above) and makes them act through hold-and-snap poses and one-frame expression snaps.

Engine: `scripts/engine/lib/characters/rig.js` (body, poses, builds), `face.js` (head, expressions), `expressions.js` (expression pack, face extras, accessories, wings, `topbean`), `headwear.js` + `wardrobe.js` (headwear, outfits, hair, beards), `outfits.js` (outfits, head modes), `crowd.js` · Vocabulary: `scripts/vocab/characters.json`, `scripts/vocab/characters-costume.json`, `scripts/vocab/maps-hair.json` (`smear` field list), `scripts/vocab/characters-poses.json` plus the base sets `KNOWN_POSES`, `KNOWN_EXPR`, `KNOWN_HAIR`, `KNOWN_BEARD`, `KNOWN_HEAD`, `KNOWN_VIEWS` in `scripts/spec.py` · Example films: [`examples/character_sheet/spec.json`](../../examples/character_sheet/spec.json) (views, expressions, poses, costumes), [`examples/eras_wardrobe/spec.json`](../../examples/eras_wardrobe/spec.json) (headwear by era, outfits, countryballs, masks, lineup, cavalry), [`examples/expressions_wardrobe/spec.json`](../../examples/expressions_wardrobe/spec.json) (ages, builds, expression pack, face extras, accessories, wings, the rest of the wardrobe, overhead view); render with `--sheet` to browse · Related cards: [02_acting.md](02_acting.md) (arm, poof, hats, entrances that act on beans), [03_props_creatures_vehicles.md](03_props_creatures_vehicles.md) (held props, creatures and riders, reaper, `obj` faces), [08_fx_and_tone.md](08_fx_and_tone.md) (materials such as `ghost`, `silhouette` / `glow` modifiers), [09_transitions_and_lens.md](09_transitions_and_lens.md). Spec basics: [../03-spec-reference.md](../03-spec-reference.md); motion timing by scene: [../07-story-craft.md](../07-story-craft.md).

Everything about a character's design lives in `cast` (or in a layer's `look`, which merges over the cast entry), so a character keeps the same design in every shot. `swap: [{at, look: {...}}]` changes any look field in one frame (`null` inside `look` removes a cast item).

## ① When to use it

| Story beat / sentence | Feature |
|---|---|
| "He was the emperor / a monk / a soldier of 1916" | `cast` with `head` + `outfit` (+ `hold`) from the era tables in ③ |
| Introducing a person by type, no lower third | `label: "BANKER"` on the forehead, `badge` on the chest, `sign` around the neck |
| Nations, empires, parties as people | countryball head: `flag: {pattern, colors}` + `hair: "bald"` |
| "He realized / was shocked / fell in love / smelled money" | one-frame `expr` snap: `shock`, `jaw-drop`, `heart`, `dollar`, `star-eyes`, `vision` |
| "That was a lie" | liar `nose: {grow: [t0, t1]}` |
| Despair, dread, crying, cringe | `gloom`, `dread`, `tears`, `expr: "wail"`, `expr: "grimace"` + `jitter` |
| Villain, scheming, monster | `expr: "menace"` / `evil` / `roar`, `head: "hood-dark"` or `wide-brim`, `devil: true` |
| Beaten, wounded, silenced, censored | `expr: "bruised"`, `bruise`, `bandage`, `mouthTape` |
| Generations, "grew up", kids vs adults | `age: child / toddler / baby / elder` |
| Power contrast, status jokes | `build: brute / muscle / fat / thin` |
| Angel and devil, hubris ("flew too close") | `wings`, `head: "halo"`, `devil: true`, wax `melt` |
| Praying, begging, kneeling, kowtow, collapse | body poses `kneel-pray`, `kneel-beg`, `prostrate`, `sit-slump`, `lie` |
| Deals, alliances, "took him under his wing" | two-character poses `handshake`, `hug`, `arm-around` |
| Gas attack, sickness, poison | `tint` with `tintAt`, `mask: "gas"`, `expr: "sick"` |
| Myth creature, the dead | `headShape: "bull"` / `"skull"`, `outfit: "skeleton"` |
| Ruler pacing, surveillance, a body on the floor | `topbean` layer (overhead) |
| Armies, the people, the council, "the suspects" | `crowd` (rows, `march`, `armsUp`, `mode: "lineup"`, `creature: "horse"`) |

## ② Look and staging rules

- **Construction (from the reference):** egg head (wide cheeks, narrow chin) about 45–50 % of the height, a tilted bell body with stubby legs, about 2.2 heads tall. Arms are bendable tapering tubes with white glove hands (`open`, `fist`, `point`, `thumb`). Eyes are dots or vertical ovals with no whites, thick brows carry the emotion, a "D" mouth has a pink tongue and a strip of upper teeth.
- **Ink and shade:** every part is outlined in dark-brown ink (`#2a1c15`, width 9 rig units, about 6 px on a 400 px bean) with exactly one flat shadow tone per colour (about 22–24 % darker, derived from the fill). A custom `skin` derives its own head and leg shadow; set `skinShade` / `robeShade` only to override. Colours in the look must be hex (`#rgb` or `#rrggbb`); the validator rejects names.
- **View:** `3q` in 60–70 % of shots (features slide to the face side, the back third of the head sits in a cool `#c4c1cd` shadow). `front` for confrontation and address, `side` for profiles and walking, `back` for leaving and over-the-shoulder. The rig faces right; `flip: true` faces left. Headwear and hair are view-aware (visors and fringes on the face side, masses toward the back).
- **Sizes that read (1080p):** catalogue or crowd member 260–340; full figure in a wide shot 380–520 with feet at `y` 0.9–0.98; medium 560–700 (`y` 0.95–1.0); villain from below 750+ (`y` 1.02); close-up 900–1400 with `y` 1.2–1.5 (head fills the frame); baby next to adults about 250. `size` is always an adult's height: a child at the same `size` is drawn about 0.65 as tall.
- **Three planes:** put beans in the middle plane (`z` 1), a `fg` element in front (bushes, grass, an over-the-shoulder head) and the background behind. Labels go on the empty side (`x` 0.22–0.32 when the bean stands right).
- **Safe frame:** keep faces and labels inside the 3.5 % margin; a catalogue shot holds at most 8 beans in two rows.
- **Hold and snap:** a pose holds 0.4–4 s and changes in 1–2 frames with a small settle; expressions change in exactly one frame, on the stressed word, and two characters reacting together snap on the same frame. Smooth blends are rare (`poseBlend` 0.25 for one gentle gesture).
- **Avoid:** likenesses of real people or channel characters, extremist insignia (`party-tunic` is deliberately insignia-free), name-like colours, tiny beans (under 200 px the face stops reading), dark beards plus `menace` (see ⑥).

## ③ Field reference

### Bean layer (`"type": "bean"`)

Coordinates: (`x`, `y`) is the point between the feet. All times inside the layer are layer time (from the layer's `at`). Every common layer field also works (`move`, `swap`, `jitter`, `jump`, `enter`, `blur`, ...; see [../03-spec-reference.md](../03-spec-reference.md)).

| Field | Default | Effect |
|---|---|---|
| `who` | – | Cast entry name; must exist in `spec.cast`. |
| `look` | – | Look fields merged over the cast entry for this layer only. |
| `size` | 420 | On-screen height in px (rig is 600 units tall). |
| `view` | look `view`, else `3q` | `front`, `3q`, `side`, `back`. A pose `body.view` applies when the layer has none. |
| `expr` | `neutral` | Expression name or `[{at, v}]` (snaps in 1 frame). |
| `pose` | `idle` | Pose name or `[{at, v}]` (hold-and-snap). |
| `poseBlend` | 0.07 | Seconds a pose change takes (0.07 = 2 frames). Body `dy`/`rot`/`lean` interpolate; legs and pivot switch halfway. |
| `antic` | false | 3-frame anticipation dip before each timeline pose change and a 2-frame stretch after it. Needs a `pose` timeline. |
| `snapTilt` | – | Degrees of tilt on the first frame after each pose change (one breakdown frame). |
| `talk` | – | Windows `[[a, b], ...]`: mouth cycles the expression's talk set every 3 frames, head bobs ±1.6°. |
| `walk`, `run` | – | Windows: gait cycle on twos (step 0.56 s, run 0.4 s); arms swing unless `keepArms`. Body poses are suspended while walking. |
| `gaitRate` | 1 | Speeds up both cycles. |
| `keepArms` | false | Keep the pose's arms during `walk` / `run`. |
| `tremble` | – | Windows: ±6 × ±4 unit jitter on twos (fear). |
| `hold`, `holdL` | look `hold` / `holdL` | Prop kind in the right / left hand. `sword` follows the forearm; `spear` and `torch` stay near-vertical (±20°) and the torch burns; `shield` is drawn at 260, `spear` at 420, others at 170 units. |
| `gaze` | 0 | Face shift in units toward the gaze side (front view: full; 3q: ×0.4). |
| `headTilt` | 0 | Extra head tilt in degrees. |
| `smear` | – | Hair smear on a sharp head turn: `[{at, dur 0.33, dir 1, strength 1}]` (one object also works; `at` is layer time). From `at` the hair and headwear leave 4 fading copies plus 3 ink speed lines behind the skull, offset up to 46 × 4 × `strength` units and decaying per frame to nothing at `at + dur`. `dir` 1 trails toward the back of the head (the usual lag after snapping toward the face side), −1 toward the face side; mirrored beans mirror it. No-op for `bald`, no hair and alt heads (`headShape`). |
| `lean` | 0 | Extra body lean in degrees (shout thrust). |
| `rock` | 1.6 | Idle sway amplitude in degrees around the feet (period 1.7 s); 0 for statues and corpses. |
| `blink` | true | `false` disables blinking (statues, the dead). |
| `legs` | – | `false` hides the legs (riders, busts, portraits). |

### Poses (`pose`)

65 poses in `T.POSES` (`rig.js`). Arms are two-bone tubes posed by shoulder/elbow angles or IK targets.

| Group | Poses |
|---|---|
| Basic | `idle` `point` `point-up` `arms-up` `shrug` `facepalm` `think` `wave` (the hand waves on twos) `hold` `fist` `hips` `cross` `present` `scared` `hands-face` `thumbs-up` `clutch-head` `sword-up` `reach` |
| Hands to face and body | `pray` `steeple` `cheeks` `cover-ears` `shade-eyes` `binoculars` `pinch-nose` `clutch-chest` `cover-mouth` `eat` `drink` (= `eat`) `phone-ear` |
| Force and power | `shove` (lean 15°) `t-pose` `spread` `flex` `flex-one` `hands-up` `hammer` `throw-windup` (lean −10°) `throw` (lean 12°) `hold-high` `carry` (squat) `grab` |
| Pleading and offering | `beg` `rub-hands` (= `beg`) `offer` `kneel` `kneel-pray` `kneel-beg` `kneel-offer` `prostrate` |
| Two characters | `hug` `arm-around` `handshake` (partner at +x, overlap about 40 %), `cradle` (pair with `hold: "swaddle"`), `lean-table` |
| On the ground or in the air | `sit` (seat about 0.1 × `size` above `y`), `sit-floor` (hugging knees), `sit-slump`, `lie` (rot −88°), `crawl`, `fly` (rot 75°, centred), `flail` / `flail-b` (rot 160°, centred; alternate them), `hang` (dangling legs; hands at the bar) |

Hands-in-front poses draw both arms over the body: `facepalm` `think` `cross` `hands-face` `clutch-head` and every pose with `body.front` (most of the hand poses and `pray`, `beg`, `cradle`, `sit-floor`, `kneel-beg`).

**Pose entry format** (for modules that add `T.POSES[name]`): `[leftArm, rightArm]` or `{arms: [l, r], body: {dy, rot, lean, legs, front, view, armScale, pivot}}`. Arm spec `{a, e, hand}` (shoulder angle, elbow bend, outward degrees) or `{to: [x, y], hand}` (IK target in rig units, mirrored for the left arm).

| `body` field | Default | Effect |
|---|---|---|
| `dy` | 0 | Drops the upper body (scaled by the build's leg height). |
| `rot` | 0 | Whole-figure rotation in degrees; the rig re-fits so the figure stays on the ground (or centred with `pivot: "center"`). |
| `lean` | 0 | Extra lean in degrees. |
| `legs` | `stand` | Leg mode: `stand` `kneel` `sit` `tuck` `splay` `kick` `squat` `dangle` `none`. `kneel`, `sit`, `tuck`, `splay`, `squat` keep their direction relative to the ground when the body rotates; `sit` and `tuck` draw over the robe. `kick` is available to custom poses only. |
| `front` | false | Both arms in front of the body. |
| `view` | – | Forces a view while the pose holds. |
| `armScale` | 1 | Stretchy reach (`hands-up` 1.3, `hold-high` 1.9, `hang` 2). |
| `pivot` | `ground` | `ground` or `center` for rotated poses. |

### Builds and ages (`look.build`, `look.age`)

`build`: `adult` `brute` `fat` `thin` `muscle`. `age`: `adult` `child` `toddler` `baby` `elder`. The age sets head and limb ratios, the build sets widths; both together combine.

| Value | Proportions (`T.BUILDS`) | Overlay |
|---|---|---|
| `child` | body ×0.85 wide, ×0.62 tall, legs ×0.7, arms ×0.75; eyes ×1.1; no beard | – |
| `toddler` | body ×0.5 tall, legs ×0.5; eyes ×1.15; no beard | white diaper over the hips (`diaper`) |
| `baby` | body ×0.42 tall, no legs, arms hidden unless `arms: true`; eyes ×1.2; no beard | swaddle bundle with fold lines (`swaddle`, default cream `#f0ece4`) |
| `elder` | body ×0.97, leans 6°, head forward; grey hair `#c8c8c8` unless `hairColor` is set | forehead lines, crow's feet, under-eye bags |
| `brute` | head ×0.75, body ×1.7 wide, arms ×1.8 thick, hands ×1.6 | pec plates and a 2×3 ab grid; `bare: true` paints a bare chest; `plates: true` adds pauldrons and belt plates (`plateColor`, `#6f7078`) |
| `fat` | body ×1.45 wide, legs ×1.25 wide | belly overhang (the `belt` dips under it), chin fold |
| `thin` | body ×0.8 wide, ×1.2 tall, legs ×1.3, arms ×1.5 long | – |
| `muscle` | head ×0.9, body ×1.4 wide, arms ×1.5 thick | V-torso: pec arcs, centre line, ab ticks |

`arms: false` hides both arms on any bean (armless statue, rider in a coat). `eyeScale` overrides the eye scale.

### Base look fields (cast / `look`)

| Field | Default | Effect |
|---|---|---|
| `skin`, `skinShade` | `#f6f2ea`, derived | Skin and its single shadow tone. |
| `robe`, `robeShade` | `#c8323a`, derived | Body colour and shadow. |
| `sleeve` | `robe` | Arm colour. |
| `sleeveW` | 46 | Arm width in units (wide sleeves 60–70). |
| `trim` | – | Hem stripe colour (also `toga` edge, `robe-royal` gold). |
| `sash` | – | Diagonal sash colour. |
| `belt` | – | Waist belt colour (outfits reuse it for their own belts). |
| `cape` | – | Cape colour; lags behind `move` velocity and flutters at 3 Hz while running. |
| `armor` | – | Segmented chest plate colour (`lamellar` uses it for scales). |
| `pleats` | false | Pleated skirt lines. |
| `folds` | true | Fabric fold lines (outfits switch them off). |
| `sandal` | `#6b4423` | Sandal colour. |
| `shoes` | – | Closed shoes instead of sandals (colour). |
| `legColor` | `skin` | Trousers / leg colour. |
| `puttees` | – | `true` or a colour: leg wraps. |
| `view` | `3q` | Default view of this character. |
| `hold`, `holdL` | – | Default props in the hands. |
| `skirt`, `skirtColors` | – | `skirt: "tiered"` paints three bands (`skirtColors`, default `#a8443a` `#efe6d4` `#6a2a3a`). |
| `apron` | – | Apron panel colour (on `hanfu` it colours the tassel panel). |
| `medals` | – | Number of ribbon bars with medals (`true` = 3). |
| `blush` | – | `true` pink cheeks; `squiggle` and `hatch` add marks. |
| `eyesOverride`, `mouthOverride` | – | Force an eye or mouth kind under every expression (see kinds below). |

### Hair and beards

| Field | Values |
|---|---|
| `hair` | `short` (default) `long` `curly` `bun` `bald` `bald-sides` `queue` (long back braid, pairs with `qing-hat`) `braids` (two plaits, red ties) `curly-big` `volute` (wavy mass to the waist, temple discs in `headColor3`) `long-straight` (centre parting) `ponytail` (sways; tie in `headColor3`) `wild` (grey tufts by default) `spikes` (shock gag). Short and long hair cover the top and back of the head; the fringe stops at the face side. `back` view paints the whole head in hair colour. |
| `hairColor` | `#4a2e1f` |
| `beard` | `full` (starts below the eyes) `goatee` `stubble` `long` (grey `#d9d3c7` to the chest) `walrus` (big drooping mustache, `mustacheColor`) `bushy` (scalloped cloud over the jaw, `beardHi` highlight). The talking mouth is drawn on top. |
| `beardColor`, `mustache`, `mustacheColor` | Beard colour (falls back to `hairColor`); `mustache: true` adds a mustache. |

### Headwear (`head`)

Colours: `headColor` (main), `headColor2`, `headColor3`; defaults in brackets.

| Group | Kinds |
|---|---|
| Ancient and imperial | `crown` (gold; `headColor2` jewel), `laurel` (`#6f9a3a`), `helmet` (Roman; `crest` brush crest, cheek guard), `imperial-helmet` (cheek guards both sides, transverse `crest`), `crested-bronze` (nose guard, front-to-back plume `crest`), `winged-helm` (`headColor2` gold wings), `phrygian` (tip curls forward, `headColor2` feather), `pontifex` (cream hood), `headband`, `hat` (wide straw) |
| Medieval and faith | `great-helm` (flat-top cylinder, eye slit, breath cross), `nasal-helm`, `kettle-hat`, `mail-coif` (`crownOver: true` puts a crown in `headColor2` on top), `hood`, `hood-dark` (face in shadow; glowing eyes with `menace` / `evil` / `roar` or `eyeGlow: true`, colour `eyeColor`), `hijab` (`#d65a86`, cape over the shoulders), `turban` (`veil: true` or a colour covers mouth and chin; `headColor2` jewel), `veil-wrap` (only an eye band shows, tail flutters), `dotted-cap` (studs `headColor2`, plume `headColor3`), `fur-cap` (lining `headColor2`), `jester` (`headColor` / `headColor2` points with bells) |
| East Asia | `straw-cone` (douli), `official-cap` (`fringe: true` or a colour = emperor's bead fringe; `headColor2` band), `qing-hat` (`headColor2` tassel dome, `headColor3` finial), `mianguan` (board `headColor2`, swinging bead strings `headColor3`), `court-hat`, `phoenix-crown` (`headColor2` gold rays and drops) |
| 1800s to 1900s | `tophat` (`headColor2` band), `bowler`, `fedora`, `beret`, `safari`, `newsboy-cap`, `graduation` (`headColor2` tassel), `kepi` (`headColor2` band), `fez` (`headColor2` tassel), `shako` (`headColor2` pom, `headColor3` band and badge), `deerstalker` (`headColor2` check), `straw-boater` (`headColor2` band), `barrister-wig` |
| World wars | `pickelhaube` (`headColor2` brass spike), `brodie` (tin hat), `adrian` (crest ridge), `dome` (generic WWII bowl), `officer-cap` (`headColor2` band, visor, badge), `ushanka` (`headColor2` top) |
| Modern and jobs | `hard-hat`, `chef-hat`, `bucket-hat` (`headColor2` band), `nightcap` (`headColor2` pom), `wide-brim` (shadow band over the eyes; `headColor2` band) |
| Gags | `clown-wig` (red nose and painted smile in `headColor2`; `seed` re-rolls the puffs), `star-tophat` (`headColor2` stripes, `headColor3` star band), `party-hat` (`headColor2` stripes; `hatText` on the cone), `halo` (gold ring, bobs), `bucket-helmet` (blinking antenna; `headText` stencil, 8 letters), `visor-helmet` (eye lights in `eyeColor`; a colour not starting with `#f` glows; optional `crest`) |

### Outfits (`outfit`)

An outfit draws over the bell body and brings defaults (robe, trousers, shoes, `folds: false`) that sit between the base look and the cast's own values, so the cast can still override any of them.

| Outfit | Look | Defaults | Fields |
|---|---|---|---|
| `suit` | jacket, shirt V, tie, lapels | robe `#2f3238`, dark trousers, shoes | `shirt`, `tie`, `bowtie: true` |
| `tunic` | WWI/WWII service tunic: stand collar, shoulder straps, brass buttons, chest pockets, belt with pouches | robe `#77735e` (feldgrau; khaki `#a48a5a`, horizon blue `#6d84a8`) | `buttonColor`, `belt` |
| `greatcoat` | long coat to the ankles, fold-down collar, double buttons | robe `#cfc2a5` | `robe` |
| `hanfu` | cross collar, wide sleeves, sash, tassel panel | robe `#2a2228`, `sleeveW` 64 | `trim2` collar, `sashColor`, `apron` |
| `kimono` | cross collar, wide obi | robe `#3a4a4a`, `sleeveW` 60 | `trim2`, `sashColor` |
| `lamellar` | checker-scale armour, shoulder flaps, scarf | robe `#5a2a2a` | `armor`, `scarf` (colour or `false`) |
| `surcoat` | crusader tabard with a cross over mail | robe `#f2efe6`, mail sleeves and legs | `crossColor`, `sleeve`, `belt` |
| `hivis` | reflective vest | robe `#3a4a6a` | `vest` |
| `skeleton` | rib cage and pelvis | bone-white skin, skull head, bald | – |
| `toga` | diagonal drape with folds | robe `#efe6d3` | `drapeColor`, `trim` (edge stripe) |
| `chiton` | belted tunic, shoulder brooch | robe `#ece6d8` | `drapeColor` (adds a himation), `belt` |
| `dress` | long dress, belt with a hanging strap | robe `#efe9dc` | `bodice`, `veilColor` (back veil), `belt` |
| `cuirass` | segmented plate, shoulder plates, leather strips over a pleated skirt | robe `#c8232b` | `plateColor`; pair with `cape` |
| `cloak` | half-cape flap on the back shoulder, brooch, bandolier | robe `#d8c6a6`, cape `#3f5d4a` | `cape`, `belt` |
| `robe-royal` | mantle collar with a gold edge, buttons | robe `#b82a2a`, trim `#e2b23c` | `trim` |
| `habit` | hood fold, rope belt, wooden pendant | robe `#6b3f33` | `belt`, `pendant` |
| `frockcoat` | lapels, waistcoat, bow tie, coat tails behind the legs | robe `#2a2a30` | `vest`, `shirt`, `tie`, `bowtie: false` |
| `labcoat` | white coat, lapels, pockets with a pen, tie | robe `#f4f4f0` | `shirt`, `tie` |
| `overalls` | bib and straps; the lower body becomes trousers | robe `#e8dcc4`, legs `#d0302a` | `bibColor`, `stripeColor` (striped shirt) |
| `jersey` | collar and hem in `trim2`, big number | robe `#1e1e22` | `jerseyNum` (10, up to 3 chars), `numColor`, `trim2` |
| `rags` | frayed hem teeth, stitched patches | robe `#d9c3a0` | `patchSeed` |
| `fur-vest` | open vest with fur trim over a bare chest, tooth necklace | bare chest | `vest`, `furColor` |
| `stripes` | prisoner stripes | robe `#efefef` | `stripeColor`; pair with `mask: "eye"` |
| `boxers` | bare torso, dotted shorts | bare chest | `shortsColor`, `dotColor` |
| `cow-suit` | spotted onesie, bell, muzzle, ears, stubby horns | robe `#f2f0ea` | `spotColor`, `spotSeed`, `muzzle` |
| `gown` | white gown, see-through veil, flower circlet | robe `#f6f4f0` | `veilColor` |
| `tracht` | suspenders with stitching, leather shorts | robe `#efe3b8` | `suspenders`, `shortsColor` |
| `party-tunic` | stand collar, four flap pockets, button row (no insignia) | robe `#6f6b4c` | `robe` |
| `judge-robe` | black robe with white bib tabs, pleats | robe `#1e1e22` | pair with `head: "barrister-wig"` |

### Head modes

| Field | Effect |
|---|---|
| `flag: {pattern, colors, count}` | Countryball head clipped to the egg, with a shaded rim and gloss. `pattern`: `h3` (default), `v3`, `stripes` (`count`, 7), `disc`, `cross`, `nordic`, `crescent`. `colors` are hex. Eyes become white ovals (`flagEyes: false` keeps normal eyes); `flagMouth: false` hides the mouth; `flagCrack: true` cracks it (a broken empire). Use `hair: "bald"`. |
| `mask` | `gas`: WWI gas mask (plate, goggles, ribbed snout, canister; `maskColor`). `eye`: burglar band with eye holes (`maskColor`). |
| `tint`, `tintAlpha`, `tintAt` | Multiplies a colour over the face (gas green `#7fae4a`, sickly grey). `tintAlpha` 0.5; `tintAt` fades it in over 0.5 s from that layer time. |
| `headShape` | `bull`: minotaur head with ribbed horns (`hornColor`), nose ring (`noseRing: false` removes it), glowing slit eyes (`eyeColor`); `skin` colours the hide. `skull`: skull head (skeletons, the dead). |

### Expressions (`expr`)

35 expressions in `T.EXPR`; each is eyes / brows / rest mouth / talk set, and all snap in one frame. `rage` adds an anger vein, `worried` a sweat drop, `cry` tear streams, `sick` a blood trickle.

| `expr` | Eyes / brows / mouth | Talk set | Use |
|---|---|---|---|
| `neutral` | `dot` / – / `closed` | closed mid wide | default |
| `happy`, `content` | `arc` / – / `smileOpen`, `smile` | smile mid wide | joy |
| `sleepy` | `lid` / – / `small` | small mid | boredom |
| `smug` | `lid` / smug / `smirk` | smirk mid wide | "as planned" |
| `angry`, `rage` | `dotSmall` / angry / `grimace`, `wide` (+ vein) | grimace wide mid | anger |
| `sad`, `worried` | `dot` / sad, worried / `frown`, `wobble` (+ sweat) | frown/wobble mid | loss, nerves |
| `shock` | `wide` / high / `o` | o wide | surprise |
| `scream`, `squint` | `squint` / high, – / `scream`, `grimace` | | terror, strain |
| `cry` | `arcDown` / sad / `wobbleOpen` + streams | | grief |
| `dead` | `x` / – / `o` | o | death (with `rot: -88`, `rock: 0`, `blink: false`) |
| `mad` | rotating `spiral` / – / `grin` | grin wide | madness |
| `evil` | red glowing `slit` / angry / `smirk` | smirk wide | villain |
| `sick` | dark-`ringed` / worried / `frown` + blood | frown mid | poison, plague |
| `grimace` | `dash` + crease ticks / worried / `teeth-wide` | teeth-wide teeth-mid | cringe |
| `star-eyes` | yellow `star` (rocks on twos) / high / `smileOpen` | smile wide | fame, dream |
| `sparkle` | big glossy `sparkle` / sad / `wobble` | small mid | puppy plea (add `tears: "drop"`) |
| `hollow` | white `hollow` rings (`pupils: true` adds a dot) / – / `o-small` | o-small mid | numb, "wait, what" |
| `side-eye` | `lidSide` (`sideGaze` −1 / +1) / flat / `wavy` | wavy mid | suspicion |
| `smug-closed` | `closedArc` / smug / `smirk` | smirk mid | "as planned" (add `headTilt: 8`) |
| `squeeze` | `> <` `chevron` / high / `o` | o wide | strain, sneeze |
| `menace` | `glowSlit` / angry / `grin-dark` + shadow band over the brow | grin-dark wide | villain reveal |
| `wail` | `wailEye` / sad / `trapezoid` + tear streams | trapezoid | over-crying |
| `bruised` | `dot` over a purple swelling / angry / `teeth-mid` | teeth-mid mid | after the fight |
| `jaw-drop` | `wide` / high / `jaw` (falls past the chin; `jawDrop` scales it) | jaw | disbelief |
| `sleep-drool` | `closedArc` / – / `o-small` + drool | o-small | sleeping guard |
| `dollar` | green `bill` / high / `smileOpen` | smile wide | greed |
| `heart` | pulsing `heart` / high / `smile` | smile mid | love |
| `vision` | `window` portholes showing `vision` (prop kind, or up to 4 letters) tinted `visionTint` / high / `o` | o | "all he could think about was X" |
| `roar` | `glowSlit` / heavy / `fangs` | fangs | monster, rage |
| `dying` | `dyingSlit` narrows over 18 frames, then closes / sad / `closed` | closed | the villain fades |
| `cute` | `arc` / – / `cat` + blush | cat mid | wholesome |

**Kinds for `eyesOverride` / `mouthOverride`** (and for `T.drawMiniFace` `eyes` / `mouth`):
- eyes: `dot` (default) `blink` `arc` `arcDown` `lid` `wide` `squint` `x` `dotSmall` `spiral` `slit` `ringed` `flag` `dash` `star` `sparkle` `hollow` `lidSide` `closedArc` `chevron` `glowSlit` `dyingSlit` `wailEye` `bill` `heart` `window`. `eyeColor` recolours `glowSlit` and `dyingSlit`.
- mouths: `closed` (default) `mid` `wide` `scream` `smileOpen` `o` `grimace` `wobbleOpen` `wobble` `smile` `frown` `smirk` `small` `grin` `teeth-wide` `teeth-mid` `wavy` `grin-dark` `trapezoid` `jaw` `fangs` `cat` `o-small`.
- brows (from the expression only): `angry` `sad` `worried` `high` `smug` `flat` `heavy`.
- Eyes that never blink: `wide` `squint` `x` `arc` `arcDown` `spiral` `slit` and every kind from `dash` on.

### Face and head extras (look fields)

| Field | Values (defaults) | Look and timing |
|---|---|---|
| `nose` | `{grow: [t0, t1], len: 0.45, tilt: -8, pops: false}` | Liar nose grows linearly over the window (layer time; 1.5 s = 45 frames in the reference); `len` is a fraction of 300 units; `pops` bumps it 3 % for 2 frames every 15 frames while growing. |
| `tears`, `tearColor` | `stream`, `drop`, `bead`, `joy`; `#9fd0f0` | `stream`: twin bands to the chin, highlights flow down, a drip detaches every 18 frames. `drop`: a drop slides down both cheeks every 1.25 s. `joy`: the same on the face side only. `bead`: a pooled tear about to fall. |
| `blush` | `true`, `squiggle`, `hatch` | Pink ovals, plus a red zigzag or three hatch strokes. |
| `dread` | `true` or `{color, hatch, rim}` | Hatch on the back cheek (`hatch`, `#6a5a8a`), two sweat streaks and a sweat drop sliding every 0.8 s (`color`, `#7fbfe8`). `rim` (pale `#f4eefc`; `false` removes it, or a hex) keeps the marks readable on dark scenes. |
| `gloom` | `true` or `{at: 0, count: 8, color: "#6a4ab0", rim}` | Violet drips from the brow (or the hat brim) and a dark wash over the forehead; grow over 10 frames, then boil on twos; drops fall every 12 frames. Pale `rim` as for `dread`. |
| `mouthTape` | `true` | Two black strips in an X over the mouth. |
| `bruise` | `left`, `right`, `both` | Purple swelling under the eye. |
| `bandage` | `head`, `cross`, `eyes` | Head wrap with a knot, crossed plasters on the forehead, or a blindfold band. |
| `glasses`, `glassesColor`, `opaque` | `sun` (any other value too), `shutter`, `round` | Sun lenses with a glint; shutter slats (`#2a6ad0`); round ink rims, or opaque white lenses with `opaque: true`. Side view: one lens and an arm to the ear. |
| `monocle` | `true` | Gold ring on the face-side eye with a chain. |
| `label`, `labelColor` | text or `{text}`; `#c8323a` | White strip curved across the forehead, up to 8 letters. |
| `devil`, `horns`, `tail`, `devilColor` | `devil: true`; `horns: "devil"`; `tail: "devil"`; `#d2232a` | `devil` adds red horns and an S-curve tail; `horns` / `tail` add one of them. |
| `eyeGlow`, `eyeColor` | – | Glowing eyes inside `hood-dark`; colour of glowing eyes and `visor-helmet` lights. |
| `pupils`, `sideGaze`, `jawDrop`, `vision`, `visionTint` | – | Parameters of `hollow`, `side-eye`, `jaw-drop` and `vision` (see the expression table). |

### Body accessories (look fields)

| Field | Values | Notes |
|---|---|---|
| `badge`, `badgeColor`, `badgeSwap` | text, or `{text, style, badgeSwap}`; `style` `hello` (default) / `tag` / `plank` | `hello` sticker with a red header; `tag` yellow card; `plank` wooden board (pair with `pose: "offer"`). `badgeSwap: [{at, text}]` (in the badge or the look) changes the text with a 1-frame squash. |
| `sign` | text or `{text}` | Cardboard sign on a rope (10 letters), swings ±2° at 1 Hz. Neutral text only ("FOR RENT"). |
| `stickers` | `[{kind, anchor, at, size, rot, color}]` or kind strings | Kinds `star` `heart` `check` `mug` `skull` or any prop kind. Anchors `chest` (default) `belly` `forehead` `cheek`. `rot` −8. Slaps on: scale 1.4 → 1 over 3 frames with a ±8° wiggle for 5 frames. Keep them in the cast to track progress. |
| `stains`, `stainColor` | `true` or `{color, count: 5, seed}`; `#b0151a` | Seeded blobs with drips, clipped to the robe. |
| `bowtie`, `tie` | `true`; colour | Bow tie for outfits other than `suit` / `frockcoat` (they draw their own). |

### Wings, halo and tail

| Field | Values | Effect |
|---|---|---|
| `wings`, `wingColor` | `bird`, `angel`, `insect`, or `{kind: "bird", span, color, wax, melt: {at}}` | Spans: bird 1.8, angel 1.1, insect 1 (× half the bean height per wing). Colours: bird `#f1e6d2`, angel white, insect `#a7e0d8` (70 % alpha). Wings rest raised (24°, angel 34°). An unknown kind throws. |
| `flap` | windows `[[a, b]]` in the look (layer time) | Feathered wings switch between two poses every 6 frames; insect wings flutter on twos. |
| `wax`, `melt: {at}` | inside `wings` | `wax: true` adds wax beads on the arm bone. From `melt.at` the wings stop flapping and sag 20° over 1.2 s, the beads run and shed drops every 0.5 s; after 1 s every other primary (tip first, one per 6 frames) tumbles down and fades over 1.2 s. |
| `head: "halo"` | `headColor` | Gold ring with a soft glow, bobs ±4 at 0.8 Hz. |
| `devil: true` | `devilColor` | Horns plus a tail that sways ±10° at 1 Hz. |

### `topbean` layer (overhead character)

`{"type": "topbean", "who": "king", "x": 0.5, "y": 0.55, "size": 380, "facing": 90, "walk": [[0, 2]], "expr": "angry"}`

| Field | Default | Meaning |
|---|---|---|
| `who` / `look` | – | Cast look. Read: `robe`, `sleeve`, `skin`, `skinShade`, `hair` (`bald` / `bald-sides` show the scalp), `hairColor`, `shoeColor` (`#3a2a22`), `legColor`, `cape`, `head`, `headColor`, `crest`, `outfit` defaults. |
| `size` | 260 | Shoulder-to-head size in px. |
| `facing` | 0 | Degrees, 0 = up the screen, 90 = right. A `[{at, v}]` timeline snaps; turns over 90° get two in-between frames. |
| `walk` | – | Windows: shoulders rock ±4° and the arms swing ±14° on twos with a 0.56 s step. Combine with `move`. |
| `lie` | false | Lying on the back: full body, splayed limbs and a full face (any `expr`). |
| `expr` | `neutral` | Constant or timeline; standing figures show only the eyes. |
| `face` | true | `false` hides the peeking eyes. |

Reading cues: a flat shadow offset down-right in screen space, two shoes peeking out in front, shaped shoulders with arms at the sides, a head disc where hair (or a helmet) covers the back while the face crescent, eyes and a nose bump stay at the front edge. Headwear from above: crown ring, helmet disc with a front-to-back crest, brimmed hats as two discs, anything else as a cap disc; `halo` is skipped.

### `crowd` layer

`{"type": "crowd", "who": ["citizen", "citizen2"], "x": 0.5, "y": 0.95, "count": 9, "rows": 2, "spread": 1500, "size": 300, "march": true}`

| Field | Default | Meaning |
|---|---|---|
| `who` | – | One cast name or a list (members cycle through it). |
| `count`, `rows` | 7, 1 | Members and rows. Back rows are 22 % smaller, sit 0.32 × `size` higher, and are mixed toward `fog` and darkened. |
| `spread`, `jitter` | 1400, 30 | Row width and random x scatter in px. |
| `size` | 300 | Front-row member height. |
| `fog` | `#8f9a9c` | Haze colour for back rows. |
| `march`, `inStep` | false | Everyone walks; `inStep: true` keeps the phases equal. |
| `armsUp` | false | Arms go up and down at 2 Hz per member (cheering). |
| `pose`, `expr`, `view`, `rock`, `gaitRate`, `hold`, `holdL` | `idle`, `neutral`, `3q`, 1.6 | Passed to every member (constants only). |
| `flipAlt` | false | Every other member faces left. |
| `silhouette` | false | Dark spectator figures (see ⑥ for `true` vs a hex). |
| `mode` | – | `lineup`: a diagonal row of big overlapping faces, back first, each 5 % smaller, 0.3 × `size` apart (about 40 % overlap); `dir` ±1 sets the diagonal. |
| `creature`, `gallop`, `color` | – | Members ride a creature kind (`horse`, ...; `who` are the riders, `hold` goes to the rider); `gallop: true` runs; `color` recolours the animal. |
| `id` | – | Seeds the phases; set it when two crowds share `who`, `x` and `count`. |

Members get every look field of their cast entry automatically.

### Faces on objects and extension hooks

- `T.drawMiniFace(ctx, x, y, r, mood, {eyes, mouth, lt, seed, blink, brows, color, look})` (or `(ctx, x, y, r, mood, lt, seed, opts)`): bean eyes, brows and mouth on any object; `r` is the face radius in px, eyes at ±0.35 r, mouth at +0.35 r. `blink` `true`/`false` forces the state; omitted, it blinks for 2 frames every 3 s. Used by `obj` props, suns and map regions ([03_props_creatures_vehicles.md](03_props_creatures_vehicles.md)).
- Registries read at draw time: `T.POSES`, `T.LEG_MODES`, `T.BUILDS`, `T.EXPR`, `T.EYE_KINDS`, `T.MOUTH_KINDS`, `T.BROW_KINDS`, `T.NO_BLINK_EYES`, `T.HAIR_KINDS`, `T.BEARD_KINDS`, `T.HEADWEAR`, `T.OUTFITS` + `T.OUTFIT_DEFAULTS`, hooks `T.FACE_EXTRAS`, `T.HEAD_EXTRAS`, `T.BEAN_UNDER` (behind the legs: wings, tails, coat tails, veils), `T.BEAN_EXTRAS` (over the torso). Declare new names in a `scripts/vocab/*.json` file; `outfit` kinds are checked against `TOON.OUTFITS`.

## ④ Timing

Frames at 30 fps; seconds are layer time.

| Motion | Measured in the reference | Engine |
|---|---|---|
| Pose snap | 0–2 f, hold 1.5–3 s (4–6 s in medium shots) | `poseBlend` 0.07 (2 f) |
| Settle after a snap | ~6 f, ~4.5 % squash | built in (0.2 s) |
| Smooth gesture (rare) | 6–8 f | `poseBlend` 0.25 |
| Anticipation | ~3 f dip before, 2 f stretch after | `antic: true` (dip 12 units, squash 0.94, arms −15°; stretch 1.04) |
| Breakdown frame | 1 drawing, body tilted 8–10° | `snapTilt: 8` (1 f) |
| Expression snap | exactly 1 f, both characters on the same frame | `expr` keys with the same `at` |
| Hair smear on a sharp turn | 1 f snap, the hair streaks ~10 f, settled by f14 (despair → resolve turn) | `smear: [{at: t}]` (`dur` 0.33 = 10 f, decay (1 − f/10)^1.6) |
| Cringe after the snap | ±1.5 px for 4 f | `jitter: {amp: 1.5, from: t, to: t + 0.13}` |
| Talk | a new mouth every 2–4 f, head bob 1–3° | every 3 f (10 Hz, never the same twice), bob ±1.6° |
| Idle sway | ±1.5–3° around the feet, 1.5–2 s | `rock` 1.6°, period 1.7 s; breathing 1.2 % at 0.55 Hz |
| Blink | 2–3 f, rare | 3 f every 2.8–4.4 s (seeded per character) |
| Walk | on twos, a step every 6–8 f, bounce ~3 % | 0.56 s cycle, bob 14 units, lean 2° |
| Run | on twos, strong lean | 0.4 s cycle, bob 24 units, lean 9° |
| Fear tremble | ±1–2 px every 2 f | `tremble` windows |
| Wave | – | hand swings on twos at ~2 Hz |
| Cape | lag + ~3 Hz sine | flutter 3 Hz, wind from `move` velocity |
| Crying fit | two poses every 2 f | `pose` keys `flail` / `flail-b` 0.067 s apart, `expr: "wail"` |
| Jaw drop | – | 4 f outCubic after the expression starts |
| Dying slit | – | narrows over 18 f, then closes |
| Vision pop | – | porthole 0.9 → 1 on the first frame |
| Star eyes / heart eyes | – | stars rock 0°/10° on twos; hearts pulse at 2 Hz |
| Wail mouth | – | re-rolls every 3 f |
| Liar nose | 45 f in the reference | `nose.grow` window; `pops` every 15 f |
| Tear stream drip | – | every 18 f |
| Gloom | – | grows 10 f, boils on twos, drops every 12 f |
| Gas tint | – | `tintAt` fade 0.5 s |
| Sticker slap | – | 1.4 → 1 in 3 f, wiggle 5 f |
| Badge swap | – | 1 f squash |
| Wing flap | far wings: two poses every ~6 f | `flap` windows (6 f per pose; insect on twos) |
| Wax melt | – | sag 1.2 s, feathers from +1 s one per 6 f, fade 1.2 s |
| Halo / devil tail / sign | – | halo bob 0.8 Hz; tail ±10° at 1 Hz; sign ±2° at 1 Hz |
| Headwear motion | crests and hair nearly rigid | helmet crests ±4 units, bead strings ±3°, ponytail ±4°, `bucket-helmet` bulb blinks at 1 Hz |
| Overhead walk / turn | – | `topbean` step 0.56 s on twos; turns over 90° get 2 in-between frames; breathing 0–2 % at 0.5 Hz |
| Crowd cheer | – | `armsUp` 2 Hz, seeded per member |

## ⑤ Recipes

1. **Character introduction.** Bean on the right, label on the empty side.
```json
{"type": "bean", "who": "caesar", "x": 0.62, "y": 0.97, "size": 680, "expr": "smug",
 "pose": [{"at": 0, "v": "hips"}, {"at": 2, "v": "point"}], "talk": [[2.1, 3.5]], "antic": true}
```
2. **Shock on the key word (two characters, same frame).**
```json
{"type": "bean", "who": "senator", "x": 0.3, "y": 0.95, "size": 520,
 "expr": [{"at": 0, "v": "neutral"}, {"at": 1.4, "v": "jaw-drop"}], "pose": [{"at": 1.4, "v": "scared"}], "snapTilt": 8}
```
3. **Liar.** Three beans with `arm-around`, noses on staggered windows; one snaps to `grimace` as the noses peak.
```json
{"type": "bean", "who": "minister", "x": 0.5, "y": 0.95, "size": 460, "pose": "arm-around", "expr": [{"at": 1.9, "v": "grimace"}],
 "look": {"nose": {"grow": [0.4, 1.9], "pops": true}}, "jitter": {"amp": 1.5, "from": 1.9, "to": 2.03}}
```
4. **Nations as people.** A countryball row on a `burst` background; a costume gag on one.
```json
{"type": "bean", "who": "ball_a", "x": 0.3, "y": 0.92, "size": 420, "expr": [{"at": 0, "v": "smug"}, {"at": 1.6, "v": "angry"}],
 "look": {"flag": {"pattern": "h3", "colors": ["#ffffff", "#2f6db8", "#c8323a"]}, "hair": "bald", "head": "fez"}}
```
5. **Gas attack (WWI).** Tunic soldier, the tint fades in on the word, then cut to the masked version.
```json
{"type": "bean", "who": "private", "x": 0.55, "y": 1.2, "size": 1000, "expr": [{"at": 0, "v": "worried"}, {"at": 1.2, "v": "sick"}],
 "tremble": [[1.2, 3]], "look": {"outfit": "tunic", "head": "brodie", "puttees": true, "tint": "#7fae4a", "tintAt": 1.0}}
```
6. **The council (lineup).** Statesmen and generals as a diagonal of overlapping faces.
```json
{"type": "crowd", "mode": "lineup", "who": ["statesman", "general"], "x": 0.7, "y": 0.98, "count": 5, "size": 620, "dir": 1, "expr": "smug"}
```
7. **Cavalry charge.** Knights on galloping horses; pan the camera 500–700 px and add `fg: grass` at `z` 1.5.
```json
{"type": "crowd", "who": "knight", "creature": "horse", "gallop": true, "hold": "spear", "x": 0.5, "y": 0.92, "count": 6, "rows": 2, "spread": 1600, "size": 300}
```
8. **Icarus.** Wax wings flap until the melt; the expression flips at the same moment.
```json
{"type": "bean", "who": "icarus", "x": 0.5, "y": 0.7, "size": 420, "bob": 12, "pose": "spread",
 "expr": [{"at": 0, "v": "star-eyes"}, {"at": 1.4, "v": "shock"}],
 "look": {"wings": {"kind": "bird", "span": 2, "wax": true, "melt": {"at": 1.4}}, "flap": [[0, 1.4]]}}
```
9. **Angel vs devil on the shoulders.** Two small beans by the head of a big one.
```json
{"type": "bean", "who": "devil", "x": 0.72, "y": 0.42, "size": 200, "expr": "menace", "look": {"devil": true}, "talk": [[0.5, 1.6]]}
```
10. **Despair beat.** Gloom drips and dread marks switch on mid-shot with a one-frame swap.
```json
{"type": "bean", "who": "clerk", "x": 0.5, "y": 1.0, "size": 700, "expr": [{"at": 0, "v": "neutral"}, {"at": 1.0, "v": "hollow"}],
 "swap": [{"at": 1.0, "look": {"gloom": {"at": 1.0}, "dread": true}}]}
```
11. **Muscle transform behind a poof** ([02_acting.md](02_acting.md) for `poof`).
```json
{"type": "bean", "who": "clerk", "x": 0.5, "y": 0.95, "size": 520,
 "pose": [{"at": 0, "v": "idle"}, {"at": 1.07, "v": "flex"}], "swap": [{"at": 1.07, "look": {"build": "muscle"}}]}
```
12. **Generations.** Elder, adult and child of one family in one row; the baby in the adult's arms.
```json
{"type": "bean", "who": "mother", "x": 0.5, "y": 0.95, "size": 480, "pose": "cradle", "hold": "swaddle"}
```
13. **Kowtow before the throne.**
```json
{"type": "bean", "who": "official", "x": 0.4, "y": 0.95, "size": 420, "view": "side",
 "pose": [{"at": 0, "v": "kneel"}, {"at": 0.8, "v": "prostrate"}], "antic": true}
```
14. **Ruler pacing, seen from above.** Cut in from a side view to break a dialogue.
```json
{"type": "topbean", "who": "king", "x": 0.5, "y": 0.55, "size": 380,
 "facing": [{"at": 0, "v": 90}, {"at": 1.6, "v": 270}], "walk": [[0, 1.5], [1.7, 3]], "move": [{"at": 0, "dur": 1.5, "to": [0.7, 0.55]}, {"at": 1.7, "dur": 1.3, "to": [0.3, 0.55]}]}
```
15. **Catalogue shot.** At most 8 beans in two rows: `size` about 340, feet at `y` 0.48 and 0.905, `caption` size 40 just under each pair of feet, all inside the 3.5 % margin; split longer lists into several shots.
16. **Shock hair.** `swap: [{at: t, look: {hair: "spikes"}}, {at: t + 0.5, look: {hair: null}}]` with `expr: "hollow"` at `t`.
17. **Snap turn with a hair smear.** Despair to resolve in one frame: `pose` and `expr` keys at `t`, `smear: [{at: t}]`, and a `snapTilt: 8` breakdown frame. `"pose": [{"at": 0, "v": "clutch-head"}, {"at": 1.2, "v": "fist"}], "expr": [{"at": 0, "v": "sad"}, {"at": 1.2, "v": "mad"}], "snapTilt": 8, "smear": [{"at": 1.2, "dir": 1}]`.

## ⑥ Limits and pitfalls

- **Dark beard + `menace`:** the brow shadow band and a dark `full` beard black out the whole face, leaving two red slits. Use `evil`, or a lighter `beardColor`.
- **Crowd `silhouette`:** `true` draws the crowd's own depth-tinted silhouettes; a hex (`"#1a1414"`) instead runs the generic `silhouette` modifier ([08_fx_and_tone.md](08_fx_and_tone.md)) and paints the whole crowd that one colour.
- `flap` works on the look (cast or `look`) and on the layer; the look wins when both are set.
- `antic` only works with a `pose` timeline; a constant pose never anticipates. Walking (`walk` / `run`) suspends body poses: legs stand, `dy` / `rot` / `lean` are dropped.
- `age: "baby"` hides the arms and legs and puts the bean in a swaddle; to cradle a baby, use the `cradle` pose with `hold: "swaddle"` on the adult instead of a second bean.
- `build: "brute"` shrinks the head to 0.75, so faces read smaller: raise `size` for close-ups.
- Headwear kinds that cover the face (`great-helm`, `visor-helmet`, `bucket-helmet`, `hood-dark`, `veil-wrap`, `turban` with `veil`) hide most of the expression: use pose, `tremble` and `jitter` to act.
- `visor-helmet` treats any `eyeColor` starting with `#f` as white and does not glow it, so `#ff3a2a` stays flat; pick `#e02020` or `#d42a2a` for glowing red eyes.
- `mouthOverride` replaces the rest mouth only; while talking the expression's talk set still plays.
- Two crowds with the same `who`, `x` and `count` move in sync unless they have different `id`s.
- `topbean` standing figures show only the eyes of an expression (mouths are hidden from above); use `lie: true` for a full face.
- `label` is cut at 8 letters, `sign` at 10, `headText` at 8, `jerseyNum` at 3, `vision` text at 4.
- Unknown `wings` kinds throw a page error; unknown headwear, hair or outfit names draw nothing, but the validator rejects them first.
- `swap` is shot time, everything inside a look (`nose.grow`, `gloom.at`, `tintAt`, `stickers[].at`, `badgeSwap`, `melt.at`, `flap`) is layer time.
