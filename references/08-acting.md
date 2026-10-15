# 08 · Acting and gags (v4)

These are the reference library's most reused comedy devices: an arm whose owner is never seen, the poof cloud that swaps one thing for another, hats that pass power, micro-acting marks around a head, sweat and tears, the "no X" sign, and eight measured entrances and exits. Timing is measured in frames at 30 fps. Everything is deterministic and seeded by the layer `id`, and boiling details re-seed on twos.

Showcase: [examples/v4_acting/spec.json](../examples/v4_acting/spec.json), with one shot per feature.

Many gags work together with the v4 `swap` field on the target layer: the cloud or hat hides a one-frame change of `look`, `expr`, `pose` or `alpha`.

## Arm layer (`"type": "arm"`)

An arm enters from a frame edge, does one thing (shove, grab, punch, stamp, hand over) and leaves. It is drawn in world space: `x`/`y` do not move the layer. They only set the off-frame root line, `y` for `from` left/right and `x` for top/bottom (both default to the first `reach` target), and `reach` places the hand. The root always stays off-frame, even under camera zoom. Put the arm after the layers it touches.

```json
{"type": "arm", "id": "taxarm", "kind": "rubber", "from": "right", "label": "tax",
 "reach": [{"at": 0.5, "to": [0.6, 0.66], "hold": 0.45, "back": 0.33}],
 "state": [{"at": 0, "v": "open"}, {"at": 0.62, "v": "grab"}], "take": ["bag"]}
```

| Field | Default | Meaning |
| --- | --- | --- |
| `kind` | `rubber` | `rubber`, `hand` (giant forearm), `glove-spring`, `glove-piston`, `foot`, `hook` |
| `from` | `right` | `left right top bottom tl tr bl br`. The root sits off-frame at `y` (sides) or `x` (top/bottom); both default to the first target. `hook` always comes from the top. |
| `reach[]` | – | `{at, to: [nx, ny], dur, hold, back}` in layer time. Extend over `dur`, hold, retract over `back`. Add several entries for repeated shoves (rhythm gag: 1, 2, pause, 3 with a longer `hold`). |
| `state` | `open` | Hand shape, a constant or `[{at, v}]` hard swap: `open fist point pinch grab thumb flat` |
| `take` | – | Layer ids. From the first `grab`/`pinch` state (for `hook`, when it reaches its target) each one is hidden in place and redrawn under the hand, so it leaves with the arm. `grip` [dx, dy] sets the offset from the hand tip to the layer anchor (default: bean head under the hand, prop top under the hand). |
| `hold` | – | Prop kind drawn in the hand from the start (`scroll`, `moneybag`, `sword`...). `holdSize` sets its size. |
| `width` | per kind | Tube width in px: rubber 36, hand 110, spring 18, piston 14, foot 96 |
| `color`, `skin`, `cuff` | #f4f1ea | Tube, glove and cuff fill |
| `bend` | 0.15 | Tube curvature (0–0.4) as a fraction of its length. It bulges upward. |
| `label`, `labelSize` | – | Bold caps along the tube (the "GOVERNMENT" arm) |
| `sleeve`, `bracelet` | – | `hand` only: sleeve colour on the root 40 %, and a gold cuff band (#e8b52c) carrying the `label` |
| `count`, `every`, `lastHold` | 3, 0.37, – | Spring and piston gloves repeat the first reach `count` times (11-frame cycle: out 2, hold 3, back 3). `lastHold` keeps the final punch extended for that many seconds (the knockout beat). |
| `coil`, `pitch` | 44, 84 | `glove-spring`: coil radius and pixels per turn of the steel spring (dark back half, light front half, see `T.drawCoil`). |
| `gloveSize`, `gloveColor`, `badge` | 140, #c8302a | Boxing glove size, colour and a knuckle disc colour |
| `stomp: [t]`, `boot`, `leg`, `sole`, `toes` | – | `foot`: contact times. `boot` is a hex colour for a boot instead of a bare foot (#f3a3c0). `leg` is the trouser colour, `sole: true` shows the sole to camera for map stomps, `toes` is 1/−1. |
| `hookSize` | 1.6 | `hook` scale |
| `impact`, `impactColor`, `impactSize` | on for gloves and foot | A starburst on the contact frame for 3 frames (#ffe14a; lime #b8f25a works too) |

Timing by kind (`dur` / `hold` / `back`): rubber and hand 0.12 / 0.5 / 0.17 (outCubic out, ease-in back; use `back` 0.33 for a slow "take"), spring 2 / 3 / 3 frames, piston 2 frames linear, foot 0.2 s ease-in / 1.2 / 0.2 (the comedy is in the hold, so don't bounce), hook 0.9 s linear with a 2 px bob / 0.2 / 0.4. The hand trembles 1–2 px on twos while it holds.

Pair a foot stomp with `camera.shake` `{at, dur: 0.15, amp: 6}` and a `swap` that hides or squashes the target at the contact time.

**Use for:** "X took / taxed / stole", "X was pushed out", "X kept hitting Y" (spring), "an unseen power decided" or "was given by the state" (giant hand with `bracelet`), "abolished" (foot), "quietly siphoned off" (hook).

## FX kinds (`"type": "fx"`)

FX that follow a character take a `target` (a layer id in the same shot) and draw in that layer's rig units, so they scale and move with it. Without a `target`, the fx `x`/`y` is the head centre of a 300 px character (`size` scales it).

| `kind` | Fields (defaults) | Look and timing |
| --- | --- | --- |
| `poof` | `w` 420, `h` 300, `count` 7, `puffs` 5, `word` "POOF!" (`null` hides it), `wordColor` #e8c860, `mode` band/column, `color` #f4f1ea, `shade` #d6d0c6, `hold` 0.17 | The cloud covers the subject in 2 frames (0.6→1.05 outBack), boils for `hold`, then fades as one sheet over 12 frames while stray puffs fly out. `column` stacks 2–3 clouds rising from the feet (for "ran away"). Put the target's `swap` (or `out`) at `at + 0.07`, so the change lands under the cloud. Cream #efe6cf / #d6c8a6 and grey-beige #ddd5ca / #b0a598 are good alternatives. |
| `hat` | `target`, `head` crown, `mode` drop/give/fly/stack/flat, `flat` 0.42, `tilt` −4, `from` (give: giver layer id; drop: fall height 600), `color`, `color2`, `stack` 1, `dir` −1, `float`, `bonk` | Draws any `T.HEADWEAR` sprite. **drop**: falls in 2 frames with yellow swooshes, then squashes for 2 frames. **give**: a 12-frame arc (apex `arc` 120 px) from the giver's head to the target's. **fly**: up at 900 px/s, spinning about 540°/s in whole turns, lands upright on its brim beside the feet with a squash and one bounce; a loose hat shows its dark lining so a helmet never reads as a crescent (`float: true` hovers in a figure 8 instead). **stack**: each hat drops in 5 frames onto the one below, tilting ±6°. **flat**: the hat left behind where the target stood, pressed flat (`flat` = height scale) with a dust puff; put it under a foot stomp at the contact time so the end frame keeps a remain. Once the target's own `swap` wears the same `head`, a drop or give stops drawing. Swap at `at + 0.13` to keep the squash, or at `at + 0.07` for an instant landing. For fly, swap `head: null` on the target at `at`. The cast's `headColor` only tints the target's own hat kind. |
| `marks` | `target`, `mark`, `dur`, `side` 1, `size` 1, `color` | Pops in 1 frame and animates on twos. Finite marks fade over 0.2 s after `dur`. Marks: `shout-jag` (3 ink zigzags, jittering, 0.5 s), `ticks` (`variant` realize/press/crunch, 4 frames), `notice` (`\ | /` fan, 5 frames), `zzz` (a Z every 0.6 s, rising and fading over 1.5 s), `hat-drips` (stress ticks under a brim, one falls every 0.4 s), `gloom` (purple drip lines over the forehead, growing over 8 frames), `stink` (green wavy lines), `whoosh` (white motion arcs, 2 frames in, 10 frames fade), `question` / `exclaim` (bobbing at 2 Hz), `scribble` (black scribble cloud) |
| `sweat-spray` | `target`, `rate` 3/s, `spread` 120°, `dur`, `size` 1, `color` #9fdcf2, `stack`, `side` | Drops (about 85 px tall on a 420 px bean) leave the head rim on gravity arcs (15 frames each). `stack: true` adds one drop per second that collects on the temple and slides down. |
| `tear-stream` | `target`, `width` 10, `both` true, `dur`, `color` #7fc4ff | Ribbons run from the lower lids to the chin with a scrolling highlight and a drip bulb. Pair with `expr: "cry"` and `talk` for the wail. |
| `prohibit` | `size` 260, `color` #d42020, `icon` (prop kind), `stamp`, `jolt` | The ring pops 0→1.15→1 over 7 frames with a 5° tilt, then the bar wipes along its length in 4 frames. `jolt: true` adds a 2-frame 4 px shake. `stamp: true` makes it appear in 1 frame (for stamping a speech-bubble icon). |

## Prop (`"type": "prop"`)

| `kind` | Fields | Look |
| --- | --- | --- |
| `prohibit` | `size`, `icon`, `color` | A static "no X" sign. `icon` draws that prop under the sign at 0.6 size, slightly desaturated. |

## Entrances and exits (`enter` / `exit`)

Each one is registered in `T.ENTERS`, with its default duration in `T.ENTER_DUR`. `enterDur`/`exitDur` override the duration. Kinds that leave something behind (holes, dust, hats) draw it automatically.

| Kind | Use as | Default dur | Fields | Timing |
| --- | --- | --- | --- | --- |
| `tumble` | exit | 0.5 | `tumble: {dir 1, spin 18 °/frame, vx 600, vy −500, g 4000, detach: "head"}` | No anticipation (frame 0 is already flying): spin about the body centre on a gravity arc. `detach: "head"` takes the headwear off at `out`, pops it up 80 px, hangs it for 5 frames, drops it at 60 % gravity and leaves it lying on the ground where the bean stood (the end frame keeps it). Shove it with a rubber arm `reach` that arrives at `out`. |
| `zip` | exit | 0.8 | `zip: {dir 1, puffs 10, hole false}` | Leans back 8° with scaleX 0.94 for 4 frames, gone at frame 5. A cream dust trail holds 5 frames, then shrinks and fades over 15 frames (staggered). `hole: true` leaves a ragged dark silhouette (doors, walls). |
| `ground` | enter | 0.17 | `holeColor` #3a2a20 | A dark hole for 3 frames, the layer pops at 1.06 on frame 3 and settles on frame 5, and 3 dust puffs appear. Stagger groups by 0.4 s. |
| `peek` | enter / exit | 0.25 | `peek: {side right/left/bottom/top, tilt 18, dist}` | Slides in from the edge with outBack and keeps leaning `tilt`° toward the centre. The exit slides out with ease-in. Place the layer near the edge so only head and shoulders show. |
| `stretch` | enter | 0.1 | – | scaleY 0.3 → 1.15 → 1 on frames 0, 2 and 3 (scaleX inverse), anchored at the feet. Stagger 6–8 frames. |
| `spit` | enter | 0.6 | `spit: {from [0.5, 0.4], arc 400}` | Flies out of a point (painting, portal, door) on a 10-frame parabola, growing from 0.3, then a drop-squash landing (0.85 → 1.05 → 1 by frame 18). |
| `silhouette-in` | enter | 0.6 | `from` left/right/bottom/none, `silColor` | Slides in as a flat dark shape (#1d1414; rising from the bottom is #140f0c, with ease-out), and colour crossfades in over the last 30 %. |
| `pivot-fall` | exit | 1.2 | `fall: {dir 1, whoosh true, puffs true, snap false, fade false}` | Falls 90° around the feet over 10 accelerating frames with white whoosh arcs, squashes for 2 frames, and stays down for `exitDur`, lying on the floor line (lifted by half its width). Dust grows past the head and feet over 6 frames and fades over 12. Keep `y` ≤ 0.86 so the lying body clears the frame edge. `snap: true` is the 1-frame faceplant. |

## Which recipe for which sentence

| Narration | Recipe |
| --- | --- |
| "X took / taxed / confiscated Y" | `arm` rubber with `take`, `label` naming the taker |
| "The state gave him Y" | `arm` hand + `bracelet` + `hold` |
| "They kept attacking" | `arm` glove-spring, `count` 3, target with `shake` per hit |
| "X was crushed / abolished" | `arm` foot + `camera.shake` + target `swap` `alpha` 0 |
| "X became Y", "renamed", "the next generation took over" | `poof` + `swap` at +0.07 |
| "They vanished / ran" | `poof` `mode: column` + `out`, or `exit: zip` |
| "X became king", "power passed to his son" | `hat` drop / give + target `swap` `look.head` |
| "He held every office" | `hat` stack 1, 2, 3, 0.8 s apart |
| "He died" (comic), "collapsed" | `exit: pivot-fall`, `expr: dead` |
| "He was overthrown / thrown out" | rubber arm shove + `exit: tumble` with `detach: "head"` |
| "Suddenly followers appeared" | `enter: ground`, staggered 0.4 s |
| "Meanwhile someone was listening" | `enter: peek` + `expr: evil` |
| "A new power arrived" | `enter: silhouette-in` from the right or bottom |
| "There was no X", "X was banned" | `prohibit` fx over the prop, or `prop` prohibit with `icon` |
| Shouting, sleeping, despair, an idea, disgust | `marks` shout-jag / zzz / gloom / ticks + question / stink |
| Panic, pressure, grief | `sweat-spray`, `tear-stream` |

## Notes

- `arm` uses `kind` (not `style`) for its look, so the validator checks it against `TOON.ARMS`.
- `take` hides the taken layer for the rest of the shot. To drop it again, add a second layer that appears with `at`.
- acting.js wraps `T.drawLayer` (chained, so other modules can wrap it too). The wrapper hides taken layers and draws exit and entrance leftovers.
