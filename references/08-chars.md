# 08 · Characters v4: bodies, faces, wardrobe, overhead view

v4 widens the bean cast without changing the style. Ages and builds get their own overlays, faces get 18 new expressions and a set of gag extras (liar nose, tear streams, gloom, tape, bandages), and the wardrobe grows by 29 headwear kinds, 20 outfits, 7 hair kinds and a bushy beard. There is also a top-down `topbean` layer and a mini face for objects. Everything is a `cast` / `look` field, so a character keeps the same design in every shot, and `swap` changes any of it in one frame.

Modules: `lib/chars4.js` (expressions, face and head extras, accessories, build overlays, wings, `topbean`, `TOON.drawMiniFace`) and `lib/wardrobe4.js` (headwear, outfits, hair, beards). Vocabulary: `scripts/vocab/chars4.json`. Showcase: [examples/v4_chars/spec.json](../examples/v4_chars/spec.json), with one shot per feature.

Times inside a look are layer-local (they count from the layer's `at`). Frame counts assume 30 fps.

## Ages and builds (`age`, `build`)

Proportions come from the rig (`TOON.BUILDS`, see [03-spec-reference.md](03-spec-reference.md)). This module draws what the proportions cannot.

| Value | Overlay | Notes |
|---|---|---|
| `age: "child"` | none; eyes ×1.1 | Head stays adult-size, so a kid reads as about 45 % head. |
| `age: "toddler"` | white diaper over the hips (`diaper` colour); eyes ×1.15 | Crying fit: alternate poses `flail` / `flail-b` every 2 frames, `expr: "wail"`. |
| `age: "baby"` | swaddle bundle with fold lines (`swaddle` colour, default cream); no legs; arms hidden unless `arms: true`; eyes ×1.2 | Use a smaller `size` (about 250) next to adults. Twins: one red swaddle, one cream. |
| `age: "elder"` | forehead lines, crow's feet, under-eye bags; grey hair by default | Pairs with `hair: "bald-sides"` or `"wild"` and `beard: "long"`. |
| `build: "muscle"` | V-torso: pec arcs, centre line, ab ticks | `pose: "flex"` for the gag. |
| `build: "brute"` | pec plates and a 2×3 ab grid; `bare: true` paints a bare chest; `plates: true` adds pauldrons and belt plates (`plateColor`) | The head shrinks to 0.75, so it sits low between the shoulders. |
| `build: "fat"` | belly overhang with a back shade; `belt` dips under it; chin fold | Pair with `sit-slump`. |
| `build: "thin"` | none | Lanky monster: add `mouthOverride: "teeth-wide"`. |

`look.arms: false` hides both arms on any bean (rider, swaddled, armless statue).

**When to use:** generations and "grew up" (age), power contrast ("the big brother": brute next to a kid), status deflation (fat king, thin servant).

## Expression pack (`expr`)

Every expression snaps in one frame, like the reference. Each works with `talk` (the listed talk set) and with `look.eyesOverride` / `look.mouthOverride`.

| `expr` | Eyes / brows / mouth | Animation | When to use |
|---|---|---|---|
| `grimace` | squeezed arcs with crease ticks / worried / wide teeth | — | Cringe, "that's awkward". Add `jitter: {amp: 1.5, from: t, to: t + 0.13}` on the snap. |
| `star-eyes` | yellow stars / high / open smile | stars rock 0°/10° on twos | Fame, idols, "dream come true". |
| `sparkle` | big glossy pupils + lower lid / sad / wobble | — | Puppy plea; add `tears: "drop"`. |
| `hollow` | white rings without pupils (`pupils: true` adds a dot) | — | Stunned, numb, "wait, what". |
| `side-eye` | pupils slid sideways under a flat lid (`sideGaze` −1/+1) / flat / wavy | — | Suspicion, judging someone. |
| `smug-closed` | closed content arcs / smug / smirk | — | "As planned". Add `headTilt: 8`. |
| `squeeze` | `> <` chevrons with crease ticks / high / O | — | Strain, sneezes, a loud noise. |
| `menace` | red glowing slits / angry / dark grin; shadow band over the brow | — | Villain reveal, scheming. With `beard: full` and a dark `beardColor` the brow band and beard black out the whole face, leaving two red slits: use `evil` or a lighter beard instead. |
| `wail` | squeezed arcs with a wavy lid / sad / trapezoid mouth; tear streams | mouth re-rolls every 3 frames | Comic over-crying, tantrums. |
| `bruised` | dot eyes over a purple swelling / angry / small teeth | — | After the fight. |
| `jaw-drop` | wide / high / jaw falls past the chin | 4 frames outCubic after the snap; `jawDrop` scales it | Disbelief at a number or a reveal. |
| `sleep-drool` | closed arcs / O / drool line | drool sways | Boredom, a sleeping guard. |
| `dollar` | green bills / high / open smile | — | Greed, a deal. |
| `heart` | red hearts / high / smile | 2 Hz pulse | Love, a crush, obsession. |
| `vision` | portholes showing `vision` (any prop kind, or text) tinted `visionTint` | 0.9 → 1 pop on the first frame | "All he could think about was X". |
| `roar` | red slits / heavy / fangs | — | Monsters, rage. |
| `dying` | red slits that narrow over 18 frames, then close | from the expression's `at` | The villain fades. |
| `cute` | happy arcs / "w" cat mouth; blush | — | Wholesome, "aww". |

New kinds for overrides: eyes `dash star sparkle hollow lidSide closedArc chevron glowSlit dyingSlit wailEye bill heart window`; mouths `teeth-wide teeth-mid wavy grin-dark trapezoid jaw fangs cat o-small`; brows `flat heavy`.

## Face and head extras (look fields)

| Field | Values (defaults) | Look and timing | When to use |
|---|---|---|---|
| `nose` | `{grow: [t0, t1], len: 0.45, tilt: -8, pops: false}` | Liar nose grows linearly over the window (1.5 s = 45 frames in the reference); `len` is a fraction of the head width; `pops` adds a 3 % bump every 15 frames. | "That was a lie", broken promises, propaganda. |
| `tears` | `stream`, `drop`, `bead`, `joy`; `tearColor` | `stream`: twin bands to the chin, highlights flow at 60 units/s, a drip detaches every 18 frames. `bead`: about to cry. `joy`: one drop on the face side. | Grief, defeat, happy tears. |
| `blush` | `true`, `squiggle`, `hatch` | Pink ovals, plus a red zigzag or three hatch strokes. | Crush, embarrassment. |
| `dread` | `true` or `{color, hatch, rim}` | Ink-outlined hatch on the back cheek, two sweat streaks and a sliding sweat drop at the temple. `rim` (default pale lilac; `false` removes it, or a hex colour) keeps the marks readable on dark scenes. | "Uh oh". |
| `gloom` | `{at: 0, count: 8, color: "#6a4ab0", rim}` | Ink-outlined violet drips from the brow or hat brim plus a dark wash over the forehead; they grow over 10 frames, then boil on twos; drops fall every 12 frames. A pale `rim` (default on; `false` or a hex colour) separates them from dark hair and dark backgrounds. | Despair, realizing a mistake. |
| `mouthTape` | `true` | Two black strips in an X over the mouth. | Silenced, censored. |
| `bruise` | `left`, `right`, `both` | Purple swelling under the eye. | Beaten but comic. |
| `bandage` | `head`, `cross`, `eyes` | Head wrap with a knot, crossed plasters on the forehead, or a band over the eyes. | Wounded, blindfolded. |
| `mask: "eye"` | `maskColor` | Burglar band with eye holes (pairs with `outfit: "stripes"`). | Thieves, secret identity. |
| `glasses` | `sun`, `shutter`, `round` (+ `opaque: true`); `glassesColor` | Sun lenses with a glint; shutter slats; round rims or opaque white lenses with a grey glint. Side view: one lens + an arm to the ear. | Cool, party, nerd, "the expert". |
| `monocle` | `true` | Gold ring on the face-side eye with a chain. | Rich, aristocrat. |
| `label` | text or `{text}`; `labelColor` | White strip curved across the forehead, up to 8 letters. | Naming a type without a lower third. |
| `devil` / `horns: "devil"` | `devilColor` | Red horns (and, with `devil`, a swaying tail). | Moral flip; pair an angel with a devil. |

All of these can be switched on mid-shot with `swap: [{at, look: {...}}]` (a 1-frame change, as in the reference).

## Accessories on the body

| Field | Values | Notes |
|---|---|---|
| `badge` | text, or `{text, style: "hello"\|"tag"\|"plank", badgeSwap: [{at, text}]}`; `badgeColor` | `hello` sticker with a red header; `tag` yellow card; `plank` wooden board (pair with `pose: "offer"`). `badgeSwap` changes the text with a 1-frame squash. |
| `sign` | text or `{text}` | Cardboard sign on a rope, swings 2° at 1 Hz. Neutral text only ("FOR RENT"). |
| `stickers` | `[{kind, anchor, at, size, rot, color}]` | Kinds `star heart check mug skull` or any prop kind. Anchors `forehead chest belly cheek`. Slaps on: scale 1.4 → 1 over 3 frames with a 2-frame wiggle. Persist them in the cast to track progress. |
| `stains` | `true` or `{color, count, seed}`; `stainColor` | Seeded blobs with drips, clipped to the robe. |
| `bowtie` | `true`; `tie` | Generic bow tie for outfits other than `suit` / `frockcoat` (those draw their own). |

## Wings, halo and tail

`wings: "bird" | "angel" | "insect"` or `{kind, span, color, wax, melt: {at}}` (`wingColor`). Spans: bird 1.8, angel 1.1, insect 1 (× the bean height / 2 per wing). Wings rest raised (24°, angel 34°). Inside a `flap: [[a, b]]` window they switch between two poses every 6 frames; insect wings flutter on twos. `wax: true` adds outlined wax beads on the arm bone. From `melt.at` the wings stop flapping and sag 20° over 1.2 s while the feathers hang lower and the beads stretch into runs that shed drops every 0.5 s; after 1 s every other primary (tip first, one per 6 frames) loosens and tumbles down with a sine sway, fading out over 1.2 s. The wing keeps its silhouette, only thinner. `head: "halo"` floats a gold ring that bobs at 0.8 Hz. `devil: true` adds horns and a tail that sways ±10° at 1 Hz.

**When to use:** angel/devil judgments, Icarus-style hubris ("flew too close"), pests and meddlers (insect wings with `bob` 8 at 3 Hz).

## Headwear v4 (`head`)

All take `headColor`, `headColor2`, `headColor3`.

| Group | Kinds |
|---|---|
| Ancient and imperial | `imperial-helmet` (cheek guards, transverse crest via `crest`), `crested-bronze` (nose guard, front-to-back plume), `winged-helm`, `phrygian`, `mianguan` (board with swinging bead strings), `court-hat`, `phoenix-crown` |
| Medieval and faith | `mail-coif` (`crownOver: true` puts a crown on top), `kettle-hat`, `hood-dark` (face in shadow; glowing eyes survive with `menace`, `evil`, `roar` or `eyeGlow: true`), `hijab`, `veil-wrap` (eye band only, fluttering tail), `dotted-cap`, `fur-cap` |
| Modern and jobs | `hard-hat`, `chef-hat`, `bucket-hat`, `straw-boater`, `deerstalker`, `shako`, `barrister-wig`, `nightcap`, `wide-brim` (shadow band over the eyes) |
| Gags | `clown-wig` (red nose and painted smile), `star-tophat`, `party-hat` (`hatText`), `halo`, `bucket-helmet` (blinking antenna, `headText`), `visor-helmet` (eye lights; a non-white `eyeColor` glows) |

## Outfits v4 (`outfit`)

Each brings defaults (robe, trousers, shoes) that the cast can override; all honour `robe`, `sleeve`, `legColor`, `shoes`.

| Outfit | Look | Fields |
|---|---|---|
| `toga` | diagonal drape with folds | `drapeColor`, `trim` (edge stripe and hem) |
| `chiton` | belted tunic, shoulder brooch | `drapeColor` adds a himation, `belt` |
| `dress` | long dress, belt with a hanging strap | `bodice`, `veilColor` (back veil), `belt` |
| `cuirass` | segmented plate, shoulder plates, leather strips over a pleated skirt | `plateColor`; pairs with `cape` |
| `cloak` | half-cape flap on the back shoulder, brooch, bandolier | `cape`, `belt` |
| `robe-royal` | mantle collar with a gold edge, buttons, hem | `trim` |
| `habit` | hood fold, rope belt, wooden pendant | `belt`, `pendant` |
| `frockcoat` | lapels, waistcoat, bow tie, coat tails behind the legs | `vest`, `shirt`, `tie`, `bowtie: false` |
| `labcoat` | white coat, lapels, pockets with a pen, tie | `shirt`, `tie` |
| `overalls` | bib and straps; the lower body becomes trousers | `bibColor`, `stripeColor` (striped shirt) |
| `jersey` | collar and hem in `trim2`, big number | `jerseyNum`, `numColor` |
| `rags` | frayed hem teeth, stitched patches | — |
| `fur-vest` | open vest with fur trim over a bare chest, tooth necklace | `vest`, `furColor` |
| `stripes` | prisoner stripes | `stripeColor`; pair with `mask: "eye"` |
| `boxers` | bare torso, dotted shorts | `shortsColor`, `dotColor` |
| `cow-suit` | spotted onesie, bell, muzzle, ears and stubby horns | `spotColor`, `muzzle` |
| `gown` | white gown, translucent veil, flower circlet | `veilColor` |
| `tracht` | suspenders with stitching, leather shorts | `suspenders`, `shortsColor` |
| `party-tunic` | stand collar, four flap pockets, button row (no insignia) | `robe` |
| `judge-robe` | black robe with white bib tabs | pair with `head: "barrister-wig"` |

## Hair and beards

`hair`: `braids` (two plaits, red ties), `curly-big`, `volute` (wavy mass to the waist, gold temple discs via `headColor3`), `long-straight` (centre parting), `ponytail` (sways), `wild` (grey by default), `spikes` (shock gag: swap it in for one frame). `beard: "bushy"` (`beardColor`, `beardHi`) is a scalloped cloud over the jaw; the talking mouth draws on top.

## `topbean` layer (overhead character)

`{"type": "topbean", "who": "king", "x": 0.5, "y": 0.55, "size": 260, "facing": 90, "walk": [[0, 2]], "lie": false, "expr": "angry"}`

| Field | Default | Meaning |
|---|---|---|
| `size` | 260 | Shoulder-to-head size in px. |
| `facing` | 0 | Degrees, 0 = up the screen, 90 = right. A `[{at, v}]` timeline snaps; turns over 90° get two in-between frames. |
| `walk` | none | Windows: shoulders rock ±4° and the arms swing ±12° on twos with a 0.56 s step. Combine with `move`. |
| `lie` | false | Lying on the back: full body with splayed limbs and a full face (any `expr`). |
| `face` | true | `false` hides the peeking eyes. |
| `who` / `look` | — | Cast look: `robe`, `sleeve`, `skin`, `hairColor`, `shoeColor`, `cape`, `head` (crown ring, helmet disc with a front-to-back crest, hats as discs). |

A standing figure reads as a person from above through a fixed set of cues: a flat shadow offset down-right in screen space, two shoes peeking out in front, shaped shoulders with the arms hanging at the sides and hands forward, and a head disc where hair (or a helmet set back) covers the back while the face crescent, eyes and a nose bump stay visible at the front edge, so the facing is readable at any angle. Stage it at `size` 340–420 so it fills 40–60 % of the frame height; give helmeted guards a tunic colour that differs from the helmet.

Idle breathing: 1–2 % scale at 0.5 Hz. **When to use:** pacing rulers, surveillance, a body on the floor without gore, couples lying in flowers, breaking up a shot-reverse-shot dialogue.

## `TOON.drawMiniFace` (for objects)

`TOON.drawMiniFace(ctx, x, y, r, mood, lt, seed, {eyes, mouth, blink, brows, color, look})`, or `(ctx, x, y, r, mood, {lt, seed, ...})`. `r` is the face radius in px; eyes sit at ±0.35 r, the mouth at +0.35 r. `mood` is any expression; `blink` true/false forces the state, omitted blinks every ~3 s for 2 frames. The PROPS `obj` layer uses it, so objects, suns and regions share the bean faces.

## Recipes

- **Liar:** three beans with `arm-around`, each `nose: {grow: [0.4, 1.9]}` on staggered windows; snap one to `grimace` as the noses peak.
- **Muscle transform:** `swap: [{at: 1, look: {build: "muscle"}}, {at: 2, look: {build: null}}]` hidden behind a `poof`.
- **Angel vs devil:** two small beans by the head, one with `wings: "angel"` + `head: "halo"`, one with `devil: true` and `expr: "menace"`.
- **Icarus:** `wings: {kind: "bird", span: 2, wax: true, melt: {at: 1.4}}`, `flap: [[0, 1.4]]`, `bob: 12`, expression `star-eyes` → `shock` at the melt.
- **Catalogue shot:** at most 8 beans per shot in two rows (`size` about 340, feet at `y` 0.48 and 0.905), labels as `caption` size 40 just under the feet; keep every label inside the 3.5 % safe margin and split long lists into several shots.
- **Shock hair:** `swap: [{at: t, look: {hair: "spikes"}}]` with `expr: "hollow"`.
