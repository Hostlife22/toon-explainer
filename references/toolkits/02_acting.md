# 02 · Acting and gags
In a word: the comedy devices that make something *happen to* a character: an arm whose owner is never seen, a poof cloud that hides a change, hats that pass power, micro-acting marks, sweat and tears, the "no X" sign, and measured entrances, exits, swaps, trembles and swings.

Engine: `scripts/engine/lib/acting/gags.js` (arm, gag fx, `prohibit` prop, eight registered entrances / exits), `scripts/engine/core.js` (built-in entrances / exits, `swap`, `jitter`, `swing`, `shake`, `jump`) · Vocabulary: `scripts/vocab/acting.json`, `scripts/vocab/fx-tone.json` (`drop-squash`, `pop-tilt`, `slam`), `KNOWN_ENTER` in `scripts/spec.py` · Example film: [`examples/acting_gags/spec.json`](../../examples/acting_gags/spec.json) (one shot per device; render with `--sheet` to browse) · Related cards: [01 Characters](01_characters.md) (poses, expressions, headwear the hat gag draws), [03 Props, creatures and vehicles](03_props_creatures_vehicles.md) (what an arm can `hold` or `take`), [08 FX and tone](08_fx_and_tone.md) (impact stars, dust, shock), [09 Transitions and lens](09_transitions_and_lens.md) (`camera.jump`, `camera.shake`). Field contract shared by all layers: [03-spec-reference](../03-spec-reference.md); beat-to-shot method: [07-story-craft](../07-story-craft.md).

## ① When to use it

| The narration says… | Device |
|---|---|
| "X took / taxed / stole / confiscated Y" | `arm` `rubber` with `take`, `label` naming the taker |
| "The state gave him Y", "an unseen power decided" | `arm` `hand` + `bracelet` + `hold` |
| "They kept attacking / hitting" | `arm` `glove-spring`, `count` 3; target `shake` per hit |
| "One blow ended it" | `arm` `glove-piston`, `count` 1, target `expr: dead` |
| "X was crushed / abolished / stamped out" | `arm` `foot` + `camera.shake` + target `swap` `alpha` 0 + `hat` `mode: flat` |
| "Quietly siphoned off" | `arm` `hook` with `take` |
| "X became Y", "renamed", "the next generation took over" | `fx` `poof` + target `swap` at +0.07 s |
| "They vanished / ran away" | `poof` `mode: column` + `out`, or `exit: zip` |
| "X became king", "power passed to his son" | `fx` `hat` `drop` / `give` + target `swap` `look.head` |
| "He held every office at once" | `hat` `stack` 1, 2, 3, 0.8 s apart |
| "The crown fell", startled soldier | `hat` `fly` + target `swap` `head: null` |
| "He was overthrown / thrown out" | rubber `arm` shove + `exit: tumble` with `detach: "head"` |
| "He died" (comic), "collapsed" | `exit: pivot-fall` + `expr: dead` |
| "Suddenly followers appeared" | `enter: ground`, staggered 0.4 s |
| "Meanwhile someone was listening" | `enter: peek` + `expr: evil` |
| "A new power arrived" | `enter: silhouette-in` from the right or bottom |
| "Out of nowhere came…" (portal, painting, door) | `enter: spit` |
| "One, two, three of them" (figures) | `enter: stretch`, 6–8 frames apart |
| Statistic or object dropped in | `enter: drop-squash` |
| Verdict, stamp, mission title | `enter: slam` |
| Sticker, note, small label | `enter: pop-tilt` |
| "There was no X", "X was banned" | `fx` `prohibit` over the object, or `prop` `prohibit` with `icon` |
| Shouting, sleeping, despair, an idea, disgust, noticing | `marks` `shout-jag` / `zzz` / `gloom` / `ticks` / `stink` / `notice` |
| Panic, pressure, grief | `sweat-spray`, `tear-stream` |
| Struggle, strain, cringe | `jitter` |
| A hanging sign, a dropped mic, keys | `swing` |
| Instant costume / prop / text change | `swap` |

## ② Look and staging rules

- **Hold and snap.** Every gag is a hard change (1–2 frames) followed by a hold long enough to read (0.5–1.5 s). Never tween an expression or a costume change; hide it under a cloud, a hat or a cut.
- **Ink and shade.** Arms, gloves, hats, clouds and signs use the shared dark-brown ink outline and one flat shadow strip on the lower side. Keep tube colours light (`#f4f1ea`) so the arm reads as a cartoon limb, not a pipe.
- **Arms are world-space and off-frame.** The arm root always stays outside the frame, even under camera zoom; `x` / `y` only choose the edge line. Put the `arm` layer after the layers it touches. Reach the hand to the object's contact point, not its centre.
- **FX follow their `target`.** `hat`, `marks`, `sweat-spray`, `tear-stream` draw in the target's rig units, so they scale, move and flip with it. The target must have an `id` in the same shot.
- **Swap under cover.** The change lands under the cover: `poof` swap at `at + 0.07`, hat `drop` swap at `at + 0.13` (keeps the squash) or `at + 0.07` (instant landing), hat `give` swap at `at + 0.4` (12-frame flight).
- **What is left behind.** End frames should keep a remain: a flat hat after a stomp, a hat lying on the floor after a tumble, a dark hole after a zip with `hole: true`, a body lying after a `pivot-fall`.
- **Readable sizes.** A mark is drawn for a 420 px bean by default (`size` 1 when targeted); `prohibit` 260 px is the minimum for a sign over a prop; use 380 for a hero sign.
- **Avoid:** two gags on the same character in the same second, an arm that crosses a face, a `poof` without a `swap` (the cloud then reveals nothing), entrance gags on characters who should already be there at the cut (characters default to `enter: none`).

## ③ Field reference

### `arm` layer (`"type": "arm"`)

Default `enter` is `none`; the arm animates itself through `reach`. `reach` times are layer time (seconds after the arm's `at`).

| Field | Default | Effect |
|---|---|---|
| `kind` | `rubber` | `rubber` (stretchy tube + white glove), `hand` (giant forearm + glove), `glove-spring` (steel coil + boxing glove), `glove-piston` (brass rod with two collars + boxing glove), `foot` (leg tube + bare foot or boot), `hook` (thin line from above + J hook). Checked against `TOON.ARMS`. |
| `from` | `right` | Edge of the root: `left`, `right`, `top`, `bottom`, `tl`, `tr`, `bl`, `br`. `hook` always comes from `top`. |
| `x`, `y` | first `reach` target | Root line only: `y` for `left` / `right`, `x` for `top` / `bottom`. They do not move the layer. |
| `z`, `hud` | 1, false | Camera parallax factor of the root and hand; `hud: true` ignores the camera. |
| `reach` | – | One object or a list `{at 0, to [nx, ny], dur, hold, back}`. Extend over `dur`, hold, retract over `back` (per-kind defaults below). Several entries make repeated shoves. |
| `to` | [0.5, 0.6] | Single target used when there is no `reach` (and by `foot` `stomp`). |
| `state` | `open` | Hand shape, constant or `[{at, v}]` hard swap: `open`, `fist`, `point`, `pinch`, `grab`, `thumb`, `flat` (drawn as `open`). |
| `take` | – | Layer id or list. From the first `grab` / `pinch` state (for `hook`: when it reaches its target) each layer is hidden in place for the rest of the shot and redrawn under the hand, so it leaves with the arm. |
| `grip` | auto | `[dx, dy]` from the hand tip to the taken layer's anchor. Default: beans / creatures / crowds hang by the head (0.9 × height below the tip), other layers by the top (0.42 × height). |
| `hold`, `holdSize` | –, 1.2 × glove | Prop kind drawn in the glove from the start (`scroll`, `moneybag`, `sword`...). |
| `width` | per kind | Tube width px: rubber 36, hand 110, glove-spring 18, glove-piston 14, foot 96, hook 3. Also pushes the root further off-frame. |
| `color` | per kind | Tube colour: rubber / hand #f4f1ea, piston #b8893a, hook #3a3a3a; `glove-spring`: coil colour (#c9ccd2); `foot`: bare-foot colour (#f3a3c0). |
| `skin`, `cuff` | #fbfaf6, #f4f1ea | Glove and cuff fill (`rubber`, `hand`). |
| `bend` | 0.15 | Tube curvature as a fraction of its length (0–0.4), bulging upward. Spring 0.06; piston and hook are always straight. |
| `label`, `labelSize` | –, 26 (hand 40) | Bold caps along the tube (ink on `rubber`, white on `hand`). |
| `sleeve` | – | `hand`: sleeve colour over the root 40 % of the tube. |
| `bracelet` | – | `hand`: `true` or a hex colour (#e8b52c): a gold cuff band at the wrist that carries the `label` (`labelSize` 34). |
| `count`, `every`, `lastHold` | 3, 0.37, – | `glove-spring` / `glove-piston` with one `reach`: repeat it `count` times every `every` s. `lastHold` keeps the final punch out that long (the knockout beat). |
| `coil`, `pitch` | max(44, 3 × width), 84 | `glove-spring`: coil radius and px per turn. |
| `gloveSize`, `gloveColor`, `badge` | 140, #c8302a, – | Boxing glove size, colour, and a knuckle-disc colour. |
| `stomp` | – | `foot`: list of contact times (layer time); each builds a reach that lands at that time. |
| `boot`, `leg`, `sole`, `toes` | –, –, false, toward centre | `foot`: boot colour instead of a bare foot, trouser colour of the leg tube, `sole: true` shows the sole to camera (map stomps), `toes` 1 / −1. |
| `hookSize` | 1.6 | `hook` scale. |
| `impact`, `impactColor`, `impactSize` | on for gloves and foot, #ffe14a, 1 | Starburst at the contact point for the first 3 hold frames (lime #b8f25a also works). |

### Gag `fx` kinds (`"type": "fx"`)

Common: `target` (layer id in the same shot; the fx draws in its rig units and disappears while the target is invisible). Without `target`, the fx `x` / `y` is the head centre of a 300 px character and `size` scales it (`poof` and `prohibit` are always placed by `x` / `y`). `fx` layers default to `enter: none`.

| `kind` | Fields (defaults) | Effect |
|---|---|---|
| `poof` | `w` 420, `h` 300, `hold` 0.17, `mode` `band` / `column`, `count` 7 (column: clouds 2–4, default 3), `puffs` 5, `color` #f4f1ea, `shade` #d6d0c6, `word` `POOF!` (`null` hides), `wordSize` 1, `wordColor` #e8c860 | Band: covers in 2 frames, boils for `hold`, fades as one flat sheet over 12 frames while stray puffs fly out. Column: stacked clouds rise from the feet ("ran away"); place it at the feet. Alternatives: cream #efe6cf / #d6c8a6, grey-beige #ddd5ca / #b0a598. |
| `hat` | `target` (required), `head` `crown` (any headwear kind, see [01](01_characters.md)), `mode` `drop` / `give` / `fly` / `stack` / `flat`, `color`, `color2` | Draws a headwear sprite onto or off the target's head. A `drop` or `give` stops drawing once the target's own `swap` wears the same `head`. The cast `headColor` only tints the target's own hat kind. |
| ↳ `drop` | `from` 600 (fall height px), `bonk` | Falls in 2 frames with two yellow swooshes, squashes 2 frames; `bonk` adds a small star. |
| ↳ `give` | `from` (giver layer id), `arc` 120 | 12-frame arc from the giver's head to the target's. |
| ↳ `fly` | `dir` −1, `vx` 220, `vy` −900, `g` 2500, `spin` 540 (°/s, rounded to whole turns), `float` | Pops off, spins, lands upright on its brim beside the feet with a squash and one bounce; a loose hat shows its dark lining. `float: true` hovers in a figure 8 instead. |
| ↳ `stack` | `stack` 1 (position in the pile), `from` 600, `bonk` | Drops in 5 frames (ease-in) onto the hat below, tilting ±6°. |
| ↳ `flat` | `flat` 0.42 (height scale), `tilt` −4 | The hat left pressed flat where the target stood, with a dust puff. Put it at a foot stomp's contact time. |
| `marks` | `target`, `mark` `shout-jag`, `dur`, `side` 1, `size` 1, `color`, `count`, `variant` | Micro-acting marks around the head, animated on twos. Finite marks fade over 0.2 s after `dur`. See the mark table below. |
| `sweat-spray` | `target`, `rate` 3 (drops/s), `spread` 120 (± degrees from straight up), `dur`, `size` 1, `color` #9fdcf2, `stack`, `side` 1 | Drops leave the head rim on gravity arcs, 15 frames each. `stack: true` instead adds one drop per second that collects on the temple (`side`) and slides down. |
| `tear-stream` | `target`, `width` 10, `both` true (false = one eye), `dur`, `color` #7fc4ff | Ribbons grow from the lower lids to the chin over 0.2 s with a scrolling highlight and a drip bulb; adapts to `view`. |
| `prohibit` | `size` 260, `color` #d42020, `icon` (prop kind), `stamp` (`true` / `"instant"`), `jolt`, `highlight` true | Ring pops 0 → 1.15 → 1 over 7 frames with a 5° tilt, then the bar wipes in over 4 frames. `jolt`: 2-frame 4 px shake after. `stamp`: appears whole on frame 1 (`"instant"`: frame 0) with a 3-frame shake. `highlight: false` removes the white glint. |

| `mark` | Default `dur` | Look |
|---|---|---|
| `shout-jag` | 0.5 | Three jittering ink zigzags above the head. |
| `ticks` | 0.13 | Short ink-edged strokes at the temple; `variant` `realize` (#ffe060, default), `press`, `crunch` (at the mouth, blinking on twos); `count` 4. |
| `notice` | 0.17 | `\ | /` fan above the head. |
| `whoosh` | 0.4 | White motion arcs beside the body, in 2 frames, fade 10; `count` 3. |
| `zzz` | ∞ | A Z every 0.6 s, rising and fading over 1.5 s. |
| `hat-drips` | ∞ | Stress ticks under a brim, one falls as a drop every 0.4 s; `count` 8. |
| `gloom` | ∞ | Purple (#4a2a5a) drip lines over the forehead, growing over 8 frames; `count` 8. |
| `stink` | ∞ | Three green wavy lines rising. |
| `question`, `exclaim` | ∞ | The `question` / `exclaim` prop above the head, bobbing at 2 Hz. |
| `scribble` | ∞ | Black scribble cloud above the head. |

### `prohibit` prop (`"type": "prop"`)

| `kind` | Fields | Effect |
|---|---|---|
| `prohibit` | `size` 160, `icon`, `color` #d42020, `highlight` | Static "no X" sign; `icon` draws that prop under the sign at 0.6 size, slightly desaturated. |

### Entrances and exits (`enter`, `exit`, `enterDur`, `exitDur`)

`at` starts the entrance; `out` starts the exit, and the layer disappears at `out + exitDur`. The default `exit` is `fade`. Default `enter` by type: `none` for `bean`, `image`, `map`, `fx`, `sign`, `timer`, `title`, `arm`, `hud`, `cursor`, `doc`, `timeline`, `subtitle`, `panel`; `slide-left` for `era`; `fade` for `caption`; `pop` for everything else.

| Kind | Default dur | Fields | As entrance | As exit |
|---|---|---|---|---|
| `none` | 0.32 | – | Already there. | Hard cut at `out + exitDur` (use `exitDur` 0 for a cut at `out`). |
| `fade` | 0.32 | – | Alpha 0 → 1. | Alpha 1 → 0. |
| `pop` | 0.32 | – | Scale 0 → overshoot → 1 (outBack). | Shrinks (ease-in). |
| `drop` | 0.32 | – | Falls from 0.8 frame height and bounces (outBounce). | Rises out of frame. |
| `rise` | 0.32 | – | Comes up from 0.7 frame height below (outCubic). | Sinks down. |
| `slide-left`, `slide-right`, `slide-up`, `slide-down` | 0.32 | – | Slides in from 0.7 frame width / height on that side (outCubic). | Slides back out the same side. |
| `spin` | 0.32 | – | One full turn while popping in. | Spins while shrinking. |
| `drop-squash` | 0.5 | `dropShadow` (also on `drop`) | Falls in 2 frames, squashes 150 / 55 %, rebounds 85 / 115 %, settles by 0.5 s. `dropShadow`: N seconds (or `true` = 0.33) before `at`, a dark ground ellipse grows on the empty landing spot, then shrinks under the body over 0.2 s (measured: about 10 f of growing shadow on an empty frame, the body falls in within 3 f, How WW2 Began 0:52.7; about 6 f before a tank lands, Fact-Checking 20:36). | Fade. |
| `pop-tilt` | 0.22 | – | 0 → 1.15 → 1 with a 5° tilt (toward the facing side). | Shrinks with a tilt. |
| `slam` | 0.12 | – | Scales 1.6 → 1 in 3 frames, then shakes ±14 / ±8 px for 0.2 s. | Fade. |
| `tumble` | 0.5 | `tumble: {dir 1, spin 18 (°/frame), vx 600, vy −500, g 4000, detach}` | Flies in on the reversed arc. | No anticipation: spins about the body centre on a gravity arc. `detach: "head"` (beans) pops the headwear up 80 px, hangs 5 frames, drops it at 60 % gravity and leaves it on its brim where the bean stood. |
| `zip` | 0.8 | `zip: {dir 1, puffs 10, hole false, rev}` | Reversed lean, no trail. | `rev`: N seconds (or `true` = 0.35) before `out` the legs spin as two blurred wheels with a dust puff (measured: a 15 f crouch, then about 10 f of leg-wheels before the zip, The ENTIRE History of China 14:55; pose the crouch yourself with `pose` keys). Then leans back 8° (scaleX 0.94) for 4 frames, gone on frame 5; a cream dust trail holds 5 frames then shrinks and fades over 15. `hole: true` leaves a ragged dark silhouette. |
| `ground` | 0.17 | `holeColor` #3a2a20 | Dark hole 3 frames, pops at 1.06 on frame 3, 1.03 on frame 4, settled frame 5; 3 dust puffs. | Reversed pop, no hole. |
| `peek` | 0.25 | `peek: {side right, tilt 18, dist, depth 0.45}` | Slides in from `side` (outBack) and keeps leaning `tilt`° toward the centre (`left` / `right`); `top` / `bottom` slide in by `depth` of the height. | Slides out (ease-in). |
| `stretch` | 0.1 | – | scaleY 0.3 → 0.72 → 1.15 → 1 on frames 0–3 (scaleX inverse), anchored at the feet. | Reversed. |
| `spit` | 0.6 | `spit: {from [0.5, 0.4], arc 400}` | Flies from `from` on a 10-frame parabola growing from 0.3, then a squash landing (0.85 → 1.05 → 1 by frame 18). | Reversed. |
| `silhouette-in` | 0.6 | `from` `left` / `right` / `bottom` / `none`, `silColor` | Slides in as a flat dark shape (#1d1414; from `bottom` #140f0c with ease-out), colour crossfades in over the last 30 %. | Reversed, no silhouette. |
| `pivot-fall` | 1.2 | `fall: {dir 1, whoosh true, puffs true, snap false, fade false}` | Stands up from lying. | Falls 90° about the feet over 10 accelerating frames with whoosh arcs, squashes 2 frames, lies on the floor line until `out + exitDur`. Dust grows past head and feet over 6 frames, fades over 12. `snap: true` is a 1-frame faceplant; `fade: true` fades over the last 0.3 s. |

Kinds from `tumble` to `pivot-fall` play time-reversed when used in the other direction; what they leave behind (hole, dust, trail, hat) is drawn only in their natural direction.

### Acting fields on any layer (`swap`, `jitter`, `swing`, `shake`, `jump`)

| Field | Shape (defaults) | Clock | Effect |
|---|---|---|---|
| `swap` | `[{at, ...fields}]` | shot time | Hard 1-frame change of any field (`expr`, `pose`, `look`, `kind`, `alpha`, `text`, `view`...). Entries at or before the time merge in order; `look` merges into the look (a `null` inside it removes a cast item such as `head`), a top-level `null` deletes the field. `type` cannot be swapped. |
| `jitter` | `true`, a number (amp px) or `{amp 3, on 2, from 0, to ∞}` | layer time | New seeded x / y offset of ±`amp` px every `on` frames between `from` and `to`. |
| `swing` | `true` or `{at, amp 8, period 1.2, decay 2.2}` | shot time (`at` defaults to the layer `at`) | Damped pendulum about the layer origin: `amp`° × e^(−decay·t) × sin(2πt / period). |
| `shake` | `[{at, dur 0.4, amp 12}]` | shot time | Horizontal shake decaying to 0 (a hit, a slammed table). |
| `jump` | `[{at, dur 0.45, h 120}]` | shot time | One hop of `h` px (joy, surprise). |

Bean-only acting fields (`pose` / `expr` keys, `antic`, `snapTilt`, `tremble`, `talk`, `lean`) are in [01 Characters](01_characters.md).

### Body acting (`acting`)

On by default in the painted look (`style.look: "painted"`), opt-in with `acting: true` in classic, off with `acting: false`; `{antic, overshoot, breathe, shift, squash, turn: false}` drops single parts. All of it is a pure function of time (`motion.js`).

| Part | Effect |
|---|---|
| `antic` | Before a big pose change (arms travel over 50° or the body pose changes), 4 frames of anticipation: the arms swing against their coming motion (16 % of it, at most 20°), the body dips 10 units and squashes 5 %. The explicit classic `antic: true` keeps its own 3-frame dip. |
| `overshoot` | Pose changes follow an under-damped spring (about 16 % overshoot, settled in ~0.3 s; `poseBlend` sets the speed) instead of the classic settle squash; reach moves use it too. |
| `breathe` | Idle breathing at 0.28 Hz lifts the shoulders and the head 2.5 units. |
| `shift` | Idle weight shift from foot to foot every 3.2–4.5 s (seeded): lean ±2.2°, hips ±5 units, eased over 0.7 s. |
| `squash` | Jumps (`jump`): 4-frame crouch (to 0.8), launch stretch 1.16, falling stretch 1.07, landing squash 0.78 that bounces back in 0.35 s; volume kept by the width. `impact` entries squash sideways and lean back. |
| `turn` | Front-view in-between when a `move` / `path` flip turns the character around. |
| secondary motion | Hair (shear from the crown), cape, robe hem, helmet crests / plumes and ties lag behind the body: a damped spring (1.4 Hz, damping 0.32) driven by the layer's acceleration over the last 1.2 s plus drag on its speed (`T.springLag`), turn impulses and the gait. The bean field `secondary` scales it (the common `sway` field is a different thing: a rotation). |

Travel along a curve is the common `path` field ([spec reference](../03-spec-reference.md#common-layer-fields)); beans walk it with a gait cycle (see [01 Characters](01_characters.md#characters-20-fields-bean)). `floorY` (any layer, normalised floor y) keeps the painted contact shadow on the floor under a flying or hovering bean or contact layer; jumps and upward `bob` lift it automatically.

## ④ Timing

All counts at 30 fps; one frame = 0.033 s.

| Device | Measured | Field |
|---|---|---|
| Arm `rubber` / `hand` | out 0.12 s (4 f, outCubic), hold 0.5 s, back 0.17 s (5 f, ease-in); slow "take" back 0.33 s; hand trembles 1–2 px on twos while holding | `reach` `dur` / `hold` / `back` |
| Arm `glove-spring` / `glove-piston` | 11-frame cycle: rest 3, out 2, hold 3, back 3; ×3 | `count` 3, `every` 0.37; piston extends linearly |
| Arm `foot` | 0.2 s ease-in down, hold 1.2 s, 0.2 s up; no bounce | `stomp` + `camera.shake` `{dur 0.15, amp 6}` |
| Arm `hook` | 0.9 s linear down with a 2 px bob, hold 0.2, back 0.4 | defaults |
| Impact star | 3 frames from contact | `impact` |
| Poof | covers 2 f, boils 5 f, fades 12 f = 19 f | `hold` 0.17; swap at +0.07 |
| Poof column | clouds 2 f apart, grow 6 f, fade from f12 over 12 f | `mode: column` |
| Hat drop | falls 2 f, squash 2 f, swooshes fade over 6 f | swap at +0.13 (or +0.07) |
| Hat give | 12 f arc | swap at +0.4 |
| Hat stack | 5 f each, 0.8 s apart | `stack` 1, 2, 3 |
| Hat fly | up 900 px/s, ~540°/s, squash 2 f on landing, bounce 0.2 s | target swap `head: null` at `at` |
| Marks | pop 1 f, boil on twos; `ticks` 4 f, `notice` 5 f, `shout-jag` 15 f, `whoosh` 2 + 10 f | `dur` |
| Sweat drop | 15 f per drop, 3 per second | `rate` |
| Tear stream | grows 6 f, dash scrolls 8 px per frame | – |
| Prohibit | ring 7 f, bar 4 f, jolt 2 f | – |
| Pose / expression snap | 1–2 f, hold 1.5–3 s | `pose` / `expr` keys, `swap` |
| Cringe after a snap | ±1.5 px for 4 f | `jitter {amp 1.5, from, to}` |
| Grit / strain | ±2 px on twos for ~1 s | `jitter {amp 2, on 2}` |
| Pendulum (sign, mic, keys) | period 0.6–1.2 s, 6–18°, dies over 1–2 s | `swing {amp, period, decay}` |
| Stretch line-up | 3 f each, 6–8 f stagger | `enter: stretch`, `at` +0.23 |
| Ground group | settles by f5, groups 0.4 s apart | `enter: ground` |
| Peek | head and shoulders in 6–8 f, tilt 15–20° | `enter: peek`, `enterDur` 0.25 |
| Silhouette-in | ~15–20 f | `enterDur` 0.6–0.7, staggered 0.1 s |
| Zip | lean 4 f, gone f5, trail 5 + 15 f | `exit: zip` |
| Tumble | ~15 f off frame | `exitDur` 0.5–0.7 |
| Pivot fall | 10 f fall, 2 f squash, dust ~30 f | `exitDur` ≥ 1.2 (2.0 to keep the body) |
| Group vanish | each fades 30 f, next starts halfway | `exit: fade`, `exitDur` 1, stagger 0.5 s |

## ⑤ Recipes

**"The tax office took his savings."** Rubber arm grabs a prop; the bean's expression snaps on the grab.
```json
{"type": "prop", "id": "bag", "kind": "moneybag", "x": 0.6, "y": 0.8, "size": 170}
{"type": "arm", "id": "taxarm", "kind": "rubber", "from": "right", "y": 0.62, "label": "tax",
 "reach": [{"at": 0.5, "to": [0.6, 0.66], "hold": 0.45, "back": 0.33}],
 "state": [{"at": 0, "v": "open"}, {"at": 0.62, "v": "grab"}], "take": ["bag"]}
```

**"The state handed him the charter."** Giant hand with a gold cuff from the top-right corner.
```json
{"type": "arm", "id": "state", "kind": "hand", "from": "tr", "label": "state", "bracelet": "#e8b52c",
 "hold": "scroll", "reach": [{"at": 0.3, "to": [0.6, 0.42], "hold": 2.0}], "state": "grab", "bend": 0.1}
```

**"They kept hitting him."** Spring glove ×3 with a shake per hit and a held knockout punch.
```json
{"type": "bean", "id": "victim", "who": "villain", "x": 0.66, "y": 0.92, "size": 420,
 "expr": [{"at": 0, "v": "smug"}, {"at": 0.4, "v": "shock"}],
 "shake": [{"at": 0.37, "dur": 0.2}, {"at": 0.74, "dur": 0.2}, {"at": 1.11, "dur": 0.2}]}
{"type": "arm", "id": "spring", "kind": "glove-spring", "from": "left", "y": 0.55,
 "reach": [{"at": 0.3, "to": [0.56, 0.55]}], "count": 3, "every": 0.37, "lastHold": 1.1}
```

**"The old order was stamped out."** Foot stomp, the king vanishes on contact, his crown stays flat.
```json
{"type": "bean", "id": "squashed", "who": "king", "x": 0.5, "y": 0.92, "size": 300,
 "expr": [{"at": 0, "v": "smug"}, {"at": 0.8, "v": "shock"}], "swap": [{"at": 1.2, "alpha": 0}]}
{"type": "fx", "kind": "hat", "at": 1.2, "mode": "flat", "target": "squashed", "head": "crown"}
{"type": "arm", "id": "foot", "kind": "foot", "from": "top", "stomp": [1.2], "reach": [{"to": [0.5, 0.9]}],
 "boot": "#3a2a20", "leg": "#4a5a6a", "width": 120}
```
Add `"camera": {"shake": [{"at": 1.2, "dur": 0.15, "amp": 6}]}` on the shot.

**"Overnight, peasants became bankers."** Poof hides a costume swap 0.07 s after it starts.
```json
{"type": "bean", "id": "p1", "who": "peasant", "x": 0.3, "y": 0.92, "size": 420,
 "swap": [{"at": 1.07, "look": {"outfit": "suit", "robe": "#2f3a4a"}, "expr": "smug"}]}
{"type": "fx", "kind": "poof", "at": 1.0, "x": 0.3, "y": 0.66, "w": 380, "h": 300}
```

**"And the heir simply ran."** Column poof at the feet, the bean cut out under it.
```json
{"type": "bean", "id": "p3", "who": "heir", "x": 0.76, "y": 0.92, "size": 420, "out": 1.66, "exit": "none", "exitDur": 0}
{"type": "fx", "kind": "poof", "at": 1.6, "x": 0.76, "y": 0.92, "mode": "column", "w": 380, "h": 300, "word": null}
```

**"The crown passed to his son."** Hat give from one head to the other; both looks swap.
```json
{"type": "bean", "id": "oldking", "who": "king", "x": 0.3, "y": 0.92, "size": 420,
 "pose": [{"at": 0, "v": "idle"}, {"at": 0.8, "v": "hold-high"}], "swap": [{"at": 1.0, "look": {"head": null}}]}
{"type": "bean", "id": "son", "who": "heir", "x": 0.7, "y": 0.92, "size": 420,
 "swap": [{"at": 1.4, "look": {"head": "crown"}, "expr": "happy"}]}
{"type": "fx", "kind": "hat", "at": 1.0, "mode": "give", "target": "son", "from": "oldking", "head": "crown"}
```

**"He held every office at once."** Three hats stack 0.8 s apart.
```json
{"type": "fx", "kind": "hat", "at": 0.4, "mode": "stack", "stack": 1, "target": "boss", "head": "tophat", "color": "#2a2a30"}
{"type": "fx", "kind": "hat", "at": 1.2, "mode": "stack", "stack": 2, "target": "boss", "head": "fez", "color": "#b8302a"}
{"type": "fx", "kind": "hat", "at": 2.0, "mode": "stack", "stack": 3, "target": "boss", "head": "crown"}
```

**"He was thrown out of his own palace."** A shove arrives at `out`, the bean tumbles and loses the crown.
```json
{"type": "bean", "id": "ousted", "who": "king", "x": 0.55, "y": 0.92, "size": 420,
 "expr": [{"at": 0, "v": "smug"}, {"at": 0.85, "v": "scream"}],
 "out": 0.85, "exit": "tumble", "exitDur": 0.7, "tumble": {"dir": 1, "detach": "head"}}
{"type": "arm", "id": "shove", "kind": "rubber", "from": "left", "y": 0.6,
 "reach": [{"at": 0.6, "to": [0.48, 0.62], "hold": 0.3}], "state": "open"}
```

**"Meanwhile, someone was listening."** Peek from the right edge, kept tilted.
```json
{"type": "bean", "id": "lurker", "who": "villain", "x": 0.97, "y": 0.98, "size": 520, "at": 0.8,
 "enter": "peek", "peek": {"side": "right", "tilt": 18}, "expr": "evil"}
```

**"And then, out of nowhere, followers."** Three ground entrances 0.4 s apart.
```json
{"type": "bean", "id": "g1", "who": "peasant", "x": 0.58, "y": 0.92, "size": 360, "at": 0.6, "enter": "ground"}
{"type": "bean", "id": "g2", "who": "kid", "x": 0.74, "y": 0.92, "size": 360, "at": 1.0, "enter": "ground"}
{"type": "bean", "id": "g3", "who": "heir", "x": 0.9, "y": 0.92, "size": 360, "at": 1.4, "enter": "ground"}
```

**"He just dropped dead."** Comic plank fall, body stays down to the cut.
```json
{"type": "bean", "id": "faller", "who": "villain", "x": 0.36, "y": 0.86, "size": 420,
 "expr": [{"at": 0, "v": "shock"}, {"at": 0.9, "v": "dead"}], "out": 0.9, "exit": "pivot-fall", "exitDur": 2.0, "fall": {"dir": 1}}
```

**"Books were banned."** The sign draws itself over the object.
```json
{"type": "prop", "kind": "book", "x": 0.7, "y": 0.5, "size": 220}
{"type": "fx", "kind": "prohibit", "at": 0.8, "x": 0.7, "y": 0.5, "size": 380, "jolt": true}
```

**"He was furious, the clerk was asleep, the kid lost all hope."** Marks on three ids.
```json
{"type": "fx", "kind": "marks", "mark": "shout-jag", "target": "m1", "at": 0.2, "dur": 1.4}
{"type": "fx", "kind": "marks", "mark": "zzz", "target": "m2"}
{"type": "fx", "kind": "marks", "mark": "gloom", "target": "m3", "at": 0.3}
```

**"Under pressure, he cracked."** Sweat spray plus a strain tremble on twos.
```json
{"type": "bean", "id": "sw", "who": "clerk", "x": 0.3, "y": 0.92, "size": 420, "expr": "worried", "jitter": {"amp": 2, "on": 2}}
{"type": "fx", "kind": "sweat-spray", "target": "sw", "rate": 4}
```

**"The sign said CLOSED."** A hanging sign that swings after the slam.
```json
{"type": "label", "text": "CLOSED", "x": 0.5, "y": 0.3, "enter": "slam", "swing": {"amp": 12, "period": 0.9, "decay": 2}}
```

## ⑥ Limits and pitfalls

- **Ids are mandatory for targets.** `target`, `take` and hat `from` (give) look up a layer `id` in the same shot. A bean without an `id` is silently skipped: the fx draws nothing (no error).
- **`take` is final for the shot.** A taken layer stays hidden until the shot ends. To drop it again, add a second layer that appears with `at`.
- **Arm draw order.** The arm draws on top of everything before it; layers listed after it cover it. The hand grips the taken layer drawn under the fingers.
- **`arm` ignores its own `x` / `y` as position.** Move the hand with `reach.to`; `x` / `y` only shift the off-frame root line.
- **Spring / piston `count` needs exactly one `reach` entry.** With two or more entries they are used as written and `count` is ignored.
- **Poof without swap.** The cloud is just a cloud; put the target's `swap` (or `out` + `exit: none`, `exitDur` 0) at `at + 0.07`.
- **Hat `drop` / `give` vanish when the target's swap wears the same `head`.** If the swap uses a different headwear kind, the fx hat keeps drawing on top of it.
- **Hat `fly` needs the target's own hat removed** (`swap` `look.head: null` at the fx `at`), or there are two hats.
- **Pivot-fall / tumble disappear at `out + exitDur`.** For a body that stays down until the cut, set `exitDur` to the rest of the shot. Keep `y` ≤ 0.86 so the lying body clears the bottom edge.
- **Reversed kinds leave nothing behind.** `ground`, `zip`, `pivot-fall`, `silhouette-in` draw their hole, trail, dust or silhouette only in their natural direction.
- **`silhouette-in` reads the top-level `from` field** (not `silhouette-in: {from}`); do not confuse it with the arm's `from`.
- **Entrance gags on beans override the bean default `none`.** Characters that are simply there at the cut should not enter at all.
- **Jitter and swing clocks differ.** `jitter.from` / `to` count from the layer's `at`; `swing.at`, `shake.at`, `jump.at` and `swap.at` are shot time.
- **Determinism.** Everything is seeded by the layer `id`; two identical gags without ids look identical. Give each its own `id`.
- gags.js wraps `T.drawLayer` (chained), so other modules can wrap it too; the wrapper hides taken layers and draws leftovers from entrances and exits.
