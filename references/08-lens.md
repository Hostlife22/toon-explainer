# 08 · Lens: transitions, panel layouts and POV masks (v4)

These tools change *how the audience looks* at a scene: what covers a cut, how two places share the screen, and whose eyes we look through. They come from the reference library (myth, empire, China, WWI, fact-check and horror videos). Everything is deterministic: transitions are seeded by `kind` + `seed`, masks by the layer `id`.

Showcase: [examples/v4_lens/spec.json](../examples/v4_lens/spec.json), with one shot per feature.

Remember the transition rule: a transition occupies the **start** of the shot it is set on, while the previous shot keeps playing. Black, white and red holds are built into the transition, so anything the new shot animates during `dur` is hidden. Start entrances, panels and eye events after `dur` (the example sets `"at": 0.4` on a panel behind a 0.4 s black beat).

## Transitions (`"transition": {"kind": ..., ...}`)

| Kind | `dur` | Fields (defaults) | Look and timing |
| --- | --- | --- | --- |
| `cloud-wipe` | 0.9 | `at` [0.5,0.5], `color` #b7bcc2, `shade` #9097a0, `ink` #6d727a, `from` bottom/top/left/right | Six boiling cumulus clumps rise and cover the frame (p 0–0.45), hold, then part radially from `at`. |
| `cloud-wipe` + `word` | set 0.4 | `word` "POOF!", `color` #f4f1ea | POOF cut: a cream cloud pops 60→110 % in 3 frames, the shot switches on frame 2, the cloud drifts and fades by frame 9. |
| `drip` | 1.2 | `mode` both/top, `color` #8b0000, `cols` 14, `hold` 0.3, `glow` false, `at` | Columns with round drips descend in ~10 frames; `both` adds flame-like tongues rising from the bottom (boil on twos). Holds solid red for `hold`, then pulls apart revealing B. `glow` puts a muzzle flash first. |
| `black-beat` | 0.4 | `color` #000, `title`, `size` 96 | One frame of A, black, hard cut. With `dur` 1–3 and a `title`, the white title fades in over 10 frames. |
| `curtain` | 1.6 | `mode` close/open, `color` #a01818, `hold` 0.6, `valance` true | Velvet halves meet in 10 frames, hold, part over the remainder (outCubic). `mode: "open"` starts closed on B and parts. |
| `explosion-wipe` | 0.7 | `at` [0.5,0.55], `text` | Fireball grows 0.2→1.6 screen widths in 4 frames, covers the cut (switch on frame 3), fades over the rest. `text` sits in the white core. |
| `wave` | 0.7 | `dir` right/left, `color` #3fc6d8, `shade` #1e8fb0 | A curling foam-rimmed front sweeps across A (p 0–0.4), then recedes uncovering B. |
| `bubble-wipe` | 0.5 | `count` 90, `color` #dff4fb | White bubbles rise fast; the cut happens at peak coverage. |
| `portal` | 1.4 | `frame` [x,y,w,h] (fractions of A), `peek` cast name, `peekExpr` shock, `flash` 1 (0–2 frames), `hole` 1.35 | Zoom-punch into `frame` until its picture fills the screen (8 frames, zoom blur on the last), `flash` frames of white, then B opens with a fading white wash under a big gilt-rimmed hole (`hole` × 600 px) that holds ~10 frames so `peek` reads looking down through it, then shrinks up and out. |
| `screen-dive` | 0.7 | `frame` [x,y,w,h], `shape` oval/rect, `flash` 0 (0–2 frames) | The camera pushes into the screen in A (a TV, a mirror, a painting) over 80 % of `dur` while B already plays inside it (cover-fit, scanlines fading as we pass the glass), until the screen fills the frame. Optional `flash` white frames at the hand-off. Match `frame` to the panel `rect` of the TV. |
| `fg-pass` | 0.8 | `who` cast name, `dir` 1/−1, `view` side, `size` 1.7×H, `silhouette` #hex, `tilt` 0.08, `expr` | A giant walking cast member crosses the lens; B is revealed behind them and settles from a `tilt`×H offset. |
| `spin-zoom` | 1.2 | `emblem` {`text`, `color` #4a3aa8, `shape` [[x,y]...] in −1..1, `prop`}, `bg` [#f6b46a, #fde3a0] | On a soft sunburst, the emblem spins in (−300°→0, 0.05→0.9× with overshoot) over the first 20 %, holds readable at 0.9→1.15× with a slight wobble until 72 %, then spins out and grows to ~14× to swallow the frame; hard cut. |
| `glow-open` | 0.9 | `at`, `color` #ffd04a, `mode` glow/push | `glow`: black, a torch orb grows into a light pool over 20 frames revealing B. `push` (use `dur` 1.4–2): A pushes 1.0→1.6 and fades to black, B fades up over 18 frames. |
| `vignette-close` | 1.0 | `at` [0.5,0.45], `r` 0.22, `tint` #2a1040 | Darkness creeps in to a soft oval of radius `r`×H around `at` over 30 frames, then cut. |

### Which transition for which sentence

| Narration | Recipe |
| --- | --- |
| "Time passed", "after the battle", "a generation later" | `cloud-wipe` |
| "...and he vanished", a quick gag swap | `cloud-wipe` with `word: "POOF!"` |
| "A massacre followed", "he was executed" (implied, never shown) | `drip` |
| Before a climax, after a death, "and then..." | `black-beat` (solemn: `dur` 2, `title`) |
| "Act two", "a new player took the stage", "the regime changed" | `curtain` |
| "Boom, the war began", an interruption gag | `explosion-wipe` |
| "They flooded the city", "swept away", "under the sea" | `wave`, `bubble-wipe` |
| "Let's go back to...", "inside the story" | `portal` from a painting or map |
| "On TV he said..." | `screen-dive` from a `panel` TV |
| "He was coming", "meanwhile", moving between places without a hard cut | `fg-pass` |
| "A new era / dynasty began", chapter starts | `spin-zoom` |
| "Into the darkness", "only the torch showed the way" | `glow-open` (`push` for walking into the dark) |
| "Alone", "it all went dark", dread | `vignette-close` |

## `panel` layer: split screen, comic grid, picture-in-picture, framed shot

Each cell shows **another shot of the film**, rendered live through `T.subShot` (nesting is limited to 2 levels; a panel cannot show its own shot). Source shots also play in the timeline, which suits recaps and callbacks. Keep the layer at the default `x`/`y` 0.5: cell rects are in frame fractions. The panel's default entrance is `none` because cells animate themselves.

```json
{"type": "panel", "hud": true, "layout": "split", "seam": "jagged", "vs": true,
 "labels": false,
 "cells": [{"shot": "arg_a", "focus": "auto", "zoom": 1.5, "label": "THE HERO"},
           {"shot": "arg_b", "focus": "auto", "zoom": 1.5, "label": "THE RIVAL"}]}
```

| Field | Default | Meaning |
| --- | --- | --- |
| `layout` | `split` | `split` (2 cells), `grid`, `pip`, `frame`, `custom` |
| `cells[]` | required | `{shot, t, from, zoom 1, focus [0.5,0.5], fit, labels, push, label, labelAt, rect, color, grade}` or a shot id string |
| `cells[].t` | live | Freeze the source shot at this time (punchline frames in recap grids) |
| `cells[].from` | 0 | Offset into the source shot when playing live |
| `cells[].focus` / `zoom` | centre / 1 | Crop centre (fractions of the source frame, or `"auto"` = head and chest of the biggest bean in the source shot) and extra zoom |
| `cells[].fit` | `cover` (`width` for `phone`) | `cover` crops to fill the cell; `width` shows the whole frame width on a dark backing (a landscape clip in a portrait phone; the phone adds a progress bar and comment lines). `offset` shifts it by a fraction of the cell height |
| `labels` | true | Per cell or for the layer. `false` hides the source shot's text layers (`label`, `title`, `caption`, `subtitle`, `date`, `era`) so a crop never leaves fragments such as "TA" at the cell edge |
| `push` | 1.01 split, 1 others | Slow zoom per second (1.01 = 1 %/s), per cell or for the layer |
| `seam` | `straight` | Split only: `straight`, `slant` (`angle` 8°), `jagged` (yellow `seamColor` lightning, 8 zig-zags). `pos` 0.5 moves the divider |
| `gutter` / `gutterColor` | 14 / #0b0806 | Seam or grid gutter width and colour (`gutterColor: "none"` keeps the shot visible behind a grid) |
| `vs` | false | `true` or a string: 110 px VS at the bottom of the seam |
| `cols` / `rows` / `tilt` | 2 / auto / 0 | Grid size; `tilt` alternates ±deg per cell for comic pages |
| `every` | 0.1 | Stagger between cell entrances (s) |
| `slideIn` | true | Cells slide from the nearest edge over 8 frames (outCubic); split halves come from opposite sides. While they slide, the gutter colour fills the gap, which reads as dropped black frames after a hard `cut`. Use `slideIn: false` on a cut, or keep the slide behind a non-cut transition |
| `border` | 5 grid/custom | Ink line around cells |
| `frame` | `gilt` | `frame` layout: `gilt` (gold frame, `plaque` text), `tv` (CRT bezel, scanlines, bulge vignette), `phone`, `none` |
| `rect` | per layout | `[x, y, w, h, rotDeg]` in frame fractions. Defaults: pip [0.6,0.07,0.34,0.34,−3]; gilt [0.24,0.12,0.52,0.6]; tv [0.26,0.14,0.48,0.52]; phone [0.38,0.08,0.24,0.8] (use ~0.32 wide so a fit-width clip keeps its words ≥ 26 px) |

The seam draws top to bottom over 8 frames and the VS pops on frame 8. A pip has a white border and a 30 % drop shadow.

| Narration | Recipe |
| --- | --- |
| "X versus Y", "two sides argued" | `split` + `seam: "jagged"` + `vs` + labels; `labels: false` and `focus: "auto"` + `zoom` 1.5 crop each half to its bean |
| "Meanwhile, in two places" | `split` with `seam: "slant"` |
| "It was a mess" (recap) | `grid` 2×2 with frozen `t` punchline frames and `tilt` 2–3 |
| "The news reached..." | `pip` over the reporter |
| "Later it became famous" | `frame: "gilt"` on a `gallery` bg, then `portal` into it |
| "Everyone watched it on TV / phone" | `frame: "tv"` or `"phone"`, then `screen-dive` |

## POV masks (`"type": "fg"`, use `"hud": true, "enter": "none"`)

| `kind` | Fields (defaults) | Look and motion |
| --- | --- | --- |
| `binoculars` | `lag` 0.2, `handheld` 2, `glare` true, `color` #050505 | Two overlapping circular holes (r 0.38 H) with dark rims, glass tint and glare streaks. |
| `binoculars` + `reflect` | `reflect: {shot, t, from, who, skin, eyebrows angry/worried/neutral}` | Reverse view: a face fills the frame and `shot` is reflected (cyan) in the two lens fronts. |
| `spyglass` | `r` 0.42, `rim` #b08a3a | One round hole with a soft dark ring and a brass rim. |
| `eye-pov` | `wake`, `blink` [t...], `bloom`, `w` 0.9, `h` 0.7 | Almond eyelid hole with lashes and pink corners. `wake`: closed until then, 2-frame slit, open. Each blink: slit 2 frames, closed 2, slit 2. `bloom` fills the hole white for 2 frames and fades over 12 (waking up, loading). Closed lids glow faintly warm (`lidGlow`) and lashes carry a lighter `lashRim` (#8a5a4c) so they read on the dark mask. |

All masks drift with 2 px handheld noise at 4 Hz (`handheld`) and trail camera pans by `lag` seconds, so pair them with a `camera.pan`. Use them for "they were watching", "spies reported", "he saw it coming" and "waking up in...".

## Notes

- Panels and reflections render whole shots per frame: a 2×2 grid costs about four shot renders. Keep grids to 4–6 cells.
- `fg-pass` and portal `peek` draw cast members from `spec.cast`; lens.js reads them from `T.film.spec` (set by `T.init`).
