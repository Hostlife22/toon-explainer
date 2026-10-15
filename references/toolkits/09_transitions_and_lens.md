# 09 · Transitions and lens
In a word: how the audience looks at the film: what covers a cut, how two places share the screen, whose eyes we look
through, and how the camera pushes, tilts, frames and pulls focus.

Engine: `scripts/engine/core.js` (timeline, built-in transitions, camera, letterbox, rack focus),
`scripts/engine/lib/fx/tone.js` (comic and horror transitions), `scripts/engine/lib/lens/transitions.js`,
`scripts/engine/lib/lens/panels.js` (`panel` layer, POV masks), `scripts/engine/lib/base/helpers.js` (`T.subShot`) ·
Vocabulary: `scripts/vocab/transitions-lens.json`, `scripts/vocab/fx-tone.json` (`transitions`), base
`KNOWN_TRANSITIONS` in `scripts/spec.py` · Example films:
[`examples/transitions_lens/spec.json`](../../examples/transitions_lens/spec.json) and the transition shots of
[`examples/tone_and_horror/spec.json`](../../examples/tone_and_horror/spec.json) (render with `--sheet` to browse) ·
Related cards: [08_fx_and_tone.md](08_fx_and_tone.md) (grades, horror beats), [04_places.md](04_places.md) (other
`fg` kinds), [01_characters.md](01_characters.md) (cast used by `fg-pass` and peeks) · Camera contract:
[../03-spec-reference.md](../03-spec-reference.md#camera).

## ① When to use it

| Sentence or beat | Feature |
| --- | --- |
| Most cuts, on the narration beat | `cut` (default, no transition) |
| Soft passage of time, a calm scene change | `dissolve`, `fade-black` |
| A flash of insight, the next morning | `fade-white`, `flash-cut` |
| "And then, BAM", energetic chapter step | `zoom-punch`, `whip`, `slash` |
| Cartoon close-out on one subject | `iris`, `peephole` |
| "Time passed", "after the battle", "a generation later" | `cloud-wipe` |
| "...and he vanished", a quick gag swap | `cloud-wipe` with `word: "POOF!"` |
| "A massacre followed", "he was executed" (implied) | `drip`, `inkblot` |
| Before a climax, after a death, "and then..." | `black-beat` (solemn: `dur` 2 and a `title`) |
| "Act two", "a new player took the stage" | `curtain` |
| "Boom, the war began", an interruption gag | `explosion-wipe` |
| "They flooded the city", "swept away", "under the sea" | `wave`, `bubble-wipe` |
| "Let's go back to...", "inside the story" | `portal` from a painting or a map |
| "On TV he said..." | `screen-dive` from a `panel` TV |
| "He was coming", "meanwhile", moving between places | `fg-pass` |
| "A new era / dynasty began", chapter starts | `spin-zoom` |
| Vertical short: the default jump between two steps, locked on one subject | `swirl` (`at` the shared subject) |
| An explosion or a "glitch" cut, a game-like reset, a censored moment | `pixelate` |
| "It burned down", a letter or banner burns away to reveal the next scene | `burn` (`from` bottom / top / left / right) |
| Bats, birds or a swarm sweep the scene away; "night fell", "the plague spread" | `swarm` (`creature` bat / bird) |
| A hard reset of the picture, "everything collapsed into one line", then a fast arrival on a map | `squeeze` |
| An inset (a locator badge, a photo, a screen) grows to become the next scene, or the scene shrinks into one | `carry` (`from` and `to` rects) |
| Going up to the surface or a rooftop / down a well, "meanwhile, below" | `whip` with `dir: "down"` (picture moves down = camera rises) / `"up"` |
| "Into the darkness", "walking into the dark" | `glow-open` (`push`) |
| "Alone", "it all went dark", dread | `vignette-close` |
| Back from a memory to the present | `sepia-to-color` after a `sepia` grade |
| A torn-apart argument, a page turn | `torn-split`, `barwipe` |
| "X versus Y", "two sides argued" | `panel` `split` with a jagged seam and `vs` |
| "Meanwhile, in two places" | `panel` `split` with `seam: "slant"` |
| "It was a mess" (recap) | `panel` `grid` with frozen frames |
| "The news reached..." | `panel` `pip` over the reporter |
| "Later it became famous" / "everyone watched it on TV / phone" | `panel` `frame` gilt / tv / phone |
| A photo held up to compare two people; "that's all history now" (the ending of a short) | `panel` `frame` `photo` with a frozen `t`, plus `grade: "mono"` |
| A cropped map needs a whole-country locator | `panel` `frame` `circle` in a corner |
| "They were watching", "spies reported" | `fg` `binoculars`, `spyglass` |
| "He saw it coming" (reverse view) | `binoculars` with `reflect` |
| "Waking up in...", fainting | `fg` `eye-pov` (`wake`, `blink`, `bloom`) |
| A stare, an extreme close-up | `camera.letterbox` |
| A key word, a pose snap | `camera.jump`, `camera.punch` |
| Unease, a crooked world | `camera.rot` keys (dutch angle) |
| The subject changes inside one shot | shot `focus` (rack focus) |

## ② Look and staging rules

- The hard cut is the house transition: cut on the narration beat. Use a named transition only when the sentence
  jumps in time, place or tone, at most one every few shots, and never two flashy ones in a row.
- A transition occupies the **start** of the shot it is set on, while the previous shot keeps playing (its time runs
  past its `dur`). Black, white and red holds are inside the transition, so anything the new shot animates during
  `dur` is hidden: start entrances, panels and eye events after `dur` (the example sets `"at": 0.4` on a panel behind
  a 0.4 s `black-beat`).
- No transition holds a pure-white frame for more than 2 frames (`flash` is capped at 2).
- Panels: keep the layer at `x`/`y` 0.5 (cell rects are frame fractions), set `"hud": true`, give it an `id`, and
  keep grids to 4-6 cells. Each cell is another shot of the film, so the source shots also play in the timeline:
  that suits recaps and callbacks.
- POV masks always get `"hud": true` (`fg` layers have no entrance by default), leave `x`/`y` at 0.5, and pair with a `camera.pan` so the lag
  reads.
- Letterbox only for extreme close-ups and stares; dutch keys for unease, 4-8°; rack focus on the word that names the
  new subject.
- `fg-pass` and portal peeks draw real cast members: use the film's own characters, never likenesses of real people.

## ③ Field reference

### Transition spec

`"transition": "kind"` or `{"kind": ..., "dur": ..., ...params}` on the incoming shot. `dur` overrides the default
below. A transition on the first shot is ignored. Lens kinds that draw seeded shapes (`cloud-wipe`, `drip`,
`explosion-wipe`, `wave`, `bubble-wipe`) also take `seed` (0) to vary them. Enum params throw on unknown values.

### Built-in transitions (`core.js`)

| Kind | `dur` | Look |
| --- | --- | --- |
| `cut` | 0 | Hard cut |
| `dissolve` | 0.35 | Crossfade (ease in-out) |
| `fade-white` | 0.4 | Through a warm white (#fffaf0) peak at the midpoint, switching shots there |
| `fade-black` | 0.5 | Through black, switching at the midpoint |
| `zoom-punch` | 0.3 | A zooms to 1.9× under a rising white wash, B lands from 1.25× to 1 as the wash clears |
| `whip` | 0.3 | `dir` `left` (default: the picture travels left), `right`, `up`, `down`. Five 30 % ghost copies of A slide out while B slides in. In vertical films a horizontal whip travels the strip width |
| `pixelate` | 0.4 | `block` 48 (peak block size, logical px), `flash` 0.25 | A breaks into growing square blocks (nearest-neighbour), with a white lift at the peak; B resolves out of the same blocks. Seen as the mosaic explosion cut of two shorts (Zeppelin, beer flood) and a pixel censor in the dynasty survey |
| `burn` | 0.9 | `from` `bottom` (`top`, `left`, `right`), `char` #2a1408, `flames` true, `seed` | A ragged edge re-seeded on twos crosses the frame; A survives on the unburnt side, a charred band with an orange glow and flame tongues (every second edge point) runs along the edge, B is uncovered behind it. Reference: fire rises from the bottom and burns a banner away (French short 1:02), a fire-smoke wipe (dynasty survey 21:56) |
| `swarm` | 1.2 | `creature` `bat` (`bird`), `count` 120, `color` #120c09, `dir` 1 (−1 right to left), `seed` | Seeded flyers (wings on twos, 140–340 px) cross on their own lanes; the dense middle closes the frame completely around 40 % (the cut happens under it) and the stragglers thin out over B. Reference: bats fill the frame over ~12 f, black ~3 f, thin out over ~20 f (horror biography 2:06); a raven wipe (~25 f) |
| `squeeze` | 0.5 | `axis` `horizontal` (`vertical`), `color` #fffaf0 | A collapses into a bright line over the first 45 % (with a slight stretch), then B pulls back from 2× and a 14-px blur to sharp. Reference: a horizontal squeeze to a line, then a blurred pull-back onto the map (zombie-child short) |
| `carry` | 0.5 | `from` [x, y, w, h] (rect of A, fractions of the visible frame, i.e. of the strip in a vertical film; default the centre third), `to` [x, y, w, h] (rect of B; default `from`), `round` false, `rim` #f7f3ea | First half: the `from` window of A grows (zooming its content) to fill the frame while the rest dims; second half: B starts zoomed so its `to` window fills the frame and shrinks back into place. A white rim with an ink edge marks the window until it fills the frame. Reference: a round locator badge zooms up to fill the frame and lands as the badge of the next scene (US-borders short 0:02, ~14 f) |
| `swirl` | 0.4 | `at` [0.5, 0.5] (the shared pivot), `turns` 0.75, `dir` 1 (−1 reverses). A spins clockwise and zooms into `at` with trailing motion copies and a blurred zoomed copy behind; past the middle (a brief white lift) B unspins out of the same point. Measured in the shorts: 9–12 frames (3 twirl, 5 vortex, 2 untwirl) |
| `iris` | 0.5 | A circle opens on B from the frame centre (no params) |

### Comic and horror transitions (`tone.js`)

| Kind | `dur` | Fields (defaults) | Look |
| --- | --- | --- | --- |
| `inkblot` | 0.8 | `at` [0.5, 0.5], `color` #050403 | A splat with swirl arms grows from `at` until mid-way, then B opens through a hole |
| `slash` | 0.35 | none | Three white blade streaks and a red jagged brush band across the cut (switch at 55 %) |
| `peephole` | 0.9 | `at` [0.5, 0.5] | Comic ellipse iris with a thick rim and swooshes: closes on A (0-42 %), holds black, opens on B (58-100 %) |
| `sepia-to-color` | 1.0 | none | Sepia memory dissolves into the colour scene; incoming layers start as blue-tinted ghosts |
| `torn-split` | 0.35 | `from` right/left | B slides in behind a jagged torn-paper edge from the right (`left` reverses) |
| `barwipe` | 0.6 | `color` #3a2618 | Ragged dark bars rise from the bottom, switch at mid-way, then leave upward |
| `flash-cut` | 0.1 | none | Hard cut through a 3-frame white flash |

### Lens transitions (`lens/transitions.js`)

| Kind | `dur` | Fields (defaults) | Look and timing |
| --- | --- | --- | --- |
| `cloud-wipe` | 0.9 | `from` bottom/top/left/right, `at` [0.5, 0.5], `color` #b7bcc2, `shade` #9097a0, `ink` #6d727a | Six boiling cumulus clumps arrive from `from` (0-45 %), cover the frame (switch at 50 %), then part radially from `at` and shrink |
| `cloud-wipe` + `word` | set 0.4 | `word` "POOF!", `color` #f4f1ea, `shade` (color, 12 % darker) | POOF cut: a cream cloud with the word pops 60 → 110 % in 3 frames, the shot switches on frame 2, the cloud rises and fades by frame 9 |
| `drip` | 1.2 | `mode` both/top, `color` #8b0000, `cols` 14 (4-40), `hold` 0.3, `glow` false, `at` [0.5, 0.45] | Columns with round drips descend; `both` adds flame-like tongues rising from the bottom that boil on twos. Holds solid red for `hold`, then pulls apart on B. `glow` puts a muzzle flash at `at` first |
| `black-beat` | 0.4 | `color` #000000, `title`, `size` 96 | Half a frame of A, then black, then a hard cut. With `dur` 1-3 and a `title`, the white title fades in from 0.15 s over 10 frames |
| `curtain` | 1.6 | `mode` close/open, `color` #a01818, `hold` 0.6 (open: 0.15), `valance` true | Velvet halves with fold bands meet in 10 frames, hold, part over the rest (outCubic). `open` starts closed on B and parts |
| `explosion-wipe` | 0.7 | `at` [0.5, 0.55], `text` | Outlined fireball grows 0.2 → 1.6 frame widths in 4 frames, switch on frame 3, then fades. `text` sits in the white core |
| `wave` | 0.7 | `dir` right/left, `color` #3fc6d8, `shade` #1e8fb0 | A curling foam-rimmed front sweeps across A (0-40 %, switch there), then recedes uncovering B |
| `bubble-wipe` | 0.5 | `count` 90 (10-300), `color` #dff4fb | Outlined bubbles rise fast over a pale wash; switch at peak coverage (50 %) |
| `portal` | 1.4 | `frame` [x, y, w, h] (fractions of A, default [0.35, 0.2, 0.3, 0.45]), `peek` (cast name), `peekExpr` shock, `flash` 1 (0-2 frames), `hole` 1.35 | Zoom-punch into `frame` until its picture fills the screen (8 frames, zoom blur on the last), `flash` white frames, then B opens under a fading white wash with a big gilt-rimmed hole (`hole` × 600 px) at the top that holds about 10 frames, so a `peek` character reads looking down through it, then shrinks up and out |
| `screen-dive` | 0.7 | `frame` [x, y, w, h] (default [0.4, 0.3, 0.2, 0.25]), `shape` oval/rect, `flash` 0 (0-2 frames) | The camera pushes into the screen in A (a TV, a mirror, a painting) over about 80 % of `dur` while B already plays inside it (cover-fit, scanlines and glare fading as we pass the glass); optional white frames at the hand-off. Match `frame` to the TV panel `rect` |
| `fg-pass` | 0.8 | `axis` (`vertical`: the figure rises from the bottom edge, or drops from the top with `dir` -1, in `view` front, and B is uncovered behind it; reference: a mitre rises from the bottom until the robe fills the frame, Church short 0:40), `who` (cast name), `dir` 1/-1, `view` side, `size` 1.7 × H, `silhouette` #hex, `tilt` 0.08, `expr` neutral | A giant walking figure (slightly blurred) crosses the lens; B is revealed behind them and settles from a `tilt` × H offset. Without `who` a generic grey-robed figure walks |
| `spin-zoom` | 1.2 | `emblem` {`text`, `color` #4a3aa8, `shape` [[x, y]...] in -1..1, `prop`, `fill` #ffffff}, `text` (used without `emblem`, default "NEW ERA"), `bg` [#f6b46a, #fde3a0] | On a turning soft sunburst, the emblem spins in (-300° → 0, 0.05 → 0.9×, overshoot) over the first 20 %, holds readable at 0.9 → 1.15× with a slight wobble until 72 %, then spins out and grows to about 14× to swallow the frame; hard cut |
| `glow-open` | 0.9 | `mode` glow/push, `at` [0.5, 0.5], `color` #ffd04a | `glow`: black, a torch orb grows from 60 px into a light pool on B (from frame 4 over up to 20 frames). `push` (use `dur` 1.4-2): A pushes 1.0 → 1.6 over 60 % of `dur` while fading to black, then B fades up over 18 frames |
| `vignette-close` | 1.0 | `at` [0.5, 0.45], `r` 0.22 (0.02-1.5), `tint` #2a1040 | Darkness creeps in to a soft oval of radius `r` × H around `at` over min(1 s, `dur`), then cut |

### `panel` layer

Each cell shows another shot of the film, rendered live through `T.subShot` (or frozen with `t`). Default entrance
`none`; cells animate themselves.

| Layer field | Default | Meaning |
| --- | --- | --- |
| `layout` | `split` | `split` (2 cells), `grid`, `pip` (1 cell), `frame` (1 cell), `custom` (cells with `rect`) |
| `cells` | required | Cell objects (below) or shot id strings |
| `labels` | true | Default for every cell: `false` hides the source shot's `label`, `title`, `caption`, `subtitle`, `date` and `era` layers |
| `push` | 1.01 split, 1 others | Slow zoom per second for every cell |
| `seam` | `straight` | Split only: `straight`, `slant`, `jagged` (8 zig-zags of yellow lightning) |
| `angle` | 8 for `slant`, else 0 | Seam tilt in degrees |
| `pos` | 0.5 | Divider position (fraction of the width) |
| `seamColor` | #ffd21e | Jagged seam colour |
| `gutter` | 14 split, 12 grid | Seam or grid gutter width |
| `gutterColor` | #0b0806 | Gutter colour; `"none"` keeps the shot visible behind a grid |
| `vs` | false | `true` or a string: 110 px "VS" popping at the bottom of the seam |
| `cols` / `rows` | 2 / auto | Grid size |
| `tilt` | 0 | Grid: alternating ±deg per cell for a comic page |
| `every` | 0.1 (split: 0) | Stagger between cell entrances (s) |
| `slideIn` | true | Cells slide from the nearest edge over 8 frames (outCubic); split halves come from opposite sides |
| `border` | 5 grid/custom; gilt 4, tv 6, phone 3, none 6 | Ink line around cells |
| `frame` | `gilt` | `frame` layout: `gilt` (gold frame), `tv` (CRT bezel, knobs, scanlines, bulge vignette), `phone` (body, notch, video-app chrome), `photo` (white print border with a deeper bottom margin and a drop shadow; `caption` writes on the margin, `paper` sets its colour), `circle` (a round cell with a white ring: a locator badge), `none` |
| `plaque` | none | Gilt frame: text on a brass plaque under the painting |

| Cell field | Default | Meaning |
| --- | --- | --- |
| `shot` | none | Source shot id; without it the cell is a flat `color` block. A panel cannot show its own shot |
| `t` | live | Freeze the source shot at this time (punchline frames in recap grids) |
| `from` | 0 | Offset into the source shot when playing live (source time stops at its `dur`) |
| `zoom` / `focus` | 1 / [0.5, 0.5] | Extra zoom and crop centre (fractions of the source frame), or `"auto"`: head and chest of the biggest bean in the source shot |
| `fit` | `cover` (`width` for `phone`) | `cover` crops to fill; `width` shows the whole frame width on a dark backing, shifted by `offset` (fraction of the cell height) |
| `push`, `labels`, `border` | layer value | Per-cell overrides |
| `label` / `labelAt` | none / 0.3 (split 0.4) | Toon caption popping at the bottom of the cell |
| `rect` | per layout | `[x, y, w, h, rotDeg]` in frame fractions; `rot` also sets the angle. Defaults: pip [0.6, 0.07, 0.34, 0.34, -3]; gilt [0.24, 0.12, 0.52, 0.6]; tv [0.26, 0.14, 0.48, 0.52]; phone [0.38, 0.08, 0.24, 0.8]; photo [0.3, 0.14, 0.4, 0.56, -3]; circle [0.41, 0.06, 0.18, 0.32] (square on screen: w × 1920 = h × 1080); none [0.2, 0.15, 0.6, 0.6] |
| `color` | #3a2e28 (empty), #121014 (fit width) | Backing colour |
| `grade` | source grade | `false` renders the source without its grade, vignette and grain |

The split seam draws top to bottom over 8 frames and the VS pops on frame 8. A pip has a white border and a 30 % drop
shadow. A phone with a fit-width clip adds a progress bar and comment lines; use a `rect` about 0.32 wide so the
clip's words stay at least 26 px.

### POV masks (`"type": "fg"`)

| `kind` | Fields (defaults) | Look and motion |
| --- | --- | --- |
| `binoculars` | `lag` 0.2, `handheld` 2, `glare` true, `color` #050505 | Two overlapping circular holes (r 0.38 H, centres ±0.13 W) with dark rims, glass tint and glare streaks |
| `binoculars` + `reflect` | `reflect`: `true` or {`shot`, `t`, `from`, `who`, `skin`, `eyebrows` angry/worried/neutral} | Reverse view: a face fills the frame (skin and hair from cast `who`) and `shot` is reflected, cyan-tinted, in the two lens fronts |
| `spyglass` | `r` 0.42 (0.05-1), `rim` #b08a3a, `glare` true, `color`, `lag`, `handheld` | One round hole with a soft dark inner ring and an inked brass rim |
| `eye-pov` | `wake`, `blink` [t...], `bloom`, `w` 0.9, `h` 0.7, `lidGlow` rgba(120,52,40,0.55), `lashRim` #8a5a4c, `color`, `lag`, `handheld` | Almond eyelid hole with tapered lashes and pink corners. `wake`: closed until then, a 2-frame slit, open. Each blink: slit 2 frames, closed 2, slit 2. `bloom` fills the hole white for 2 frames and fades over 12. Closed lids glow faintly warm (`lidGlow`) and lashes carry a lighter rim (`lashRim`) so they read on the mask |

All masks drift with `handheld` px of noise at 4 Hz and trail camera pans by `lag` seconds (up to 120 px). Mask times
are layer time.

### Camera and focus as lens tools

Full field contract: [../03-spec-reference.md](../03-spec-reference.md#camera). Camera times are shot time.

| Field | Default | Lens use |
| --- | --- | --- |
| `camera.zoom` / `pan` / `focus` / `ease` / `at` / `dur` | [1, 1.04] / none / [0.5, 0.5] / linear / 0 / shot `dur` | The base push or pan; there is always some drift |
| `camera.punch` | [{`at`, `amount` 0.15}] | Punch-zoom: grows over 0.08 s, decays in about 0.4 s. Impacts, key words |
| `camera.shake` | [{`at`, `dur`, `amp` 18}] | Noise shake fading linearly over `dur`. Explosions, scares |
| `camera.rot` | [from, to] degrees, or [{`at`, `v`}] keys | Tilt; the key form snaps between values with a 2-frame blend (dutch angle) |
| `camera.jump` | [{`at`, `zoom` 1.3, `focus`}] | Cut-in without a cut: zoom jumps in 1 frame toward `focus`; entries stack |
| `camera.letterbox` | `true` or {`h` 0.12, `at` 0, `dur` 0.2, `out`, `color` #000} | Cinematic bars slide in over `dur` (and out from `out`) |
| shot `focus` | [{`at`, `on` (layer id or "bg"), `dur` 0.4, `px` 10, `bg`}] | Rack focus: from `at`, layers with an `id` other than `on` ramp to `px` blur and `on` ramps sharp (ease in-out); the background gets `bg` (default `px`, 0 when `on` is "bg") |
| layer `sharp` / `focusable` | false / false | `sharp: true` keeps a layer out of rack focus; `focusable: true` lets lettering, HUD and `fx` blur |
| layer `blur` | 0 | Fixed or `[{at, v}]` blur in px, combined with rack focus (the larger wins) |
| layer `z` | 1 | Parallax factor (0 pinned to the screen, 1.3-1.6 foreground) |

## ④ Timing

At 30 fps; "switch" is the frame where B replaces A.

| Event | Frames | Field |
| --- | --- | --- |
| `dissolve` / `fade-white` / `fade-black` | 10-11 / 12 (switch 6) / 15 (switch 7-8) | `dur` |
| `zoom-punch`, `whip`, `slash`, `torn-split` | 9-11 | `dur` |
| `iris` / `bubble-wipe` | 15 / 15 (switch 7-8) | `dur` |
| `flash-cut` | 3 | `dur` 0.1 |
| `inkblot` / `peephole` | 24 (switch 12) / 27 (black hold about 4) | `dur` |
| `barwipe` / `sepia-to-color` | 18 (switch 9) / 30 | `dur` |
| `cloud-wipe` | 27: clumps in 0-13, covered 11-19, switch 13-14, part 16-27 | `dur` 0.9 |
| POOF cut | 12: switch 2, pop 3, gone by 9 | `dur` 0.4 |
| `drip` | 36: cover 10-11, hold 9, open 16 | `dur` 1.2, `hold` 0.3 |
| `black-beat` | 12; title fades in 10 from 0.15 s | `dur`, `title` |
| `curtain` | 48: close 10, hold 18, part 20 | `dur` 1.6, `hold` 0.6 |
| `explosion-wipe` | 21: full size at 4, switch 3, fade from 6 | `dur` 0.7 |
| `wave` | 21: cover 8, recede 13 | `dur` 0.7 |
| `portal` | 42: punch 8, flash 1, hole holds 10, shrinks the rest | `dur` 1.4 |
| `screen-dive` | 21: dive about 17, then B | `dur` 0.7 |
| `fg-pass` | 24; B settles from 35 % | `dur` 0.8 |
| `spin-zoom` | 36: spin in 7, hold to 26, swallow 10 | `dur` 1.2 |
| `swirl` | 12: twirl out 6, untwirl 6 (reference 9-12) | `dur` 0.4 (0.3 for 9 f) |
| `pixelate` | 12: blocks grow 6, resolve 6 | `dur` 0.4 |
| `burn` | 27: edge crosses with ease-in-out | `dur` 0.9 |
| `swarm` | 36: build ~12, closed ~3, thin ~20 | `dur` 1.2 |
| `squeeze` | 15: line 7, pull-back 8 | `dur` 0.5 |
| `carry` | 15: grow 7, shrink 8 | `dur` 0.5 (0.47 for 14 f) |
| `glow-open` glow / push | 27, orb from frame 4 over 20 / 48: push 29, fade in 18 | `dur` 0.9 / 1.6 |
| `vignette-close` | 30 | `dur` 1.0 |
| Panel seam / VS / cell slide / label pop | 8 / pops on 8 over 6 / 8 each, 3 apart / 6 from 0.3 s | `every`, `labelAt` |
| Mask handheld / pan lag | 4 Hz / 6 | `handheld`, `lag` 0.2 |
| Eye `wake` / blink / `bloom` | slit 2 / 2 + 2 + 2 / 2 white + 12 fade | `wake`, `blink`, `bloom` |
| Camera punch / jump / dutch snap | 2-3 up, about 12 down / 1 / 2 | `punch`, `jump`, `rot` keys |
| Letterbox / rack focus | 6 / 12 | `letterbox.dur` 0.2, `focus.dur` 0.4 |

## ⑤ Recipes

**"Time passed."**
```json
{"id": "r09_later", "dur": 2.6, "transition": {"kind": "cloud-wipe", "dur": 0.9}, "bg": {"kind": "sky"},
 "layers": [{"type": "bean", "who": "hero", "x": 0.5, "y": 0.96, "size": 480, "pose": "idle"}]}
```

**"...and he vanished."** The shot without him starts behind a POOF.
```json
{"id": "r09_gone", "dur": 2.0, "transition": {"kind": "cloud-wipe", "dur": 0.4, "word": "POOF!"}, "bg": {"kind": "interior"}, "layers": []}
```

**"And then... silence."** A solemn black beat with a title; the next layer starts after it.
```json
{"id": "r09_beat", "dur": 3.0, "transition": {"kind": "black-beat", "dur": 2.0, "title": "THREE YEARS LATER"}, "bg": {"kind": "sky", "sky": "dusk"},
 "layers": [{"type": "bean", "who": "rival", "x": 0.5, "y": 0.96, "size": 480, "at": 2.0, "enter": "fade"}]}
```

**"Act two."**
```json
{"id": "r09_act2", "dur": 3.2, "transition": {"kind": "curtain", "dur": 1.6}, "bg": {"kind": "interior"},
 "layers": [{"type": "bean", "who": "rival", "x": 0.5, "y": 0.96, "size": 480, "pose": "arms-up", "expr": "smug"}]}
```

**"X versus Y."** Two earlier shots side by side, cropped to their beans, behind a black beat.
```json
{"id": "r09_versus", "dur": 3.0, "transition": {"kind": "black-beat", "dur": 0.4}, "bg": {"kind": "flat", "color": "#0b0806"},
 "layers": [{"type": "panel", "id": "r09_split", "hud": true, "layout": "split", "seam": "jagged", "vs": true, "at": 0.4, "labels": false,
             "cells": [{"shot": "r09_later", "focus": "auto", "zoom": 1.5, "label": "THE HERO"},
                       {"shot": "r09_act2", "focus": "auto", "zoom": 1.5, "label": "THE RIVAL"}]}]}
```

**"It was a mess."** Recap grid of frozen punchline frames, entered through an explosion.
```json
{"id": "r09_recap", "dur": 3.0, "transition": {"kind": "explosion-wipe", "dur": 0.7, "text": "WHAT A MESS"}, "bg": {"kind": "flat", "color": "#0b0806"},
 "layers": [{"type": "panel", "id": "r09_grid", "hud": true, "layout": "grid", "cols": 2, "tilt": 2.5, "at": 0.25,
             "cells": [{"shot": "r09_later", "t": 1.6}, {"shot": "r09_act2", "t": 2.0}, {"shot": "r09_beat", "t": 2.6}, {"shot": "r09_gone", "t": 1.0}]}]}
```

**"On TV he said..."** A TV panel, then dive into it; the dive `frame` matches the TV `rect`.
```json
{"id": "r09_tv", "dur": 3.0, "bg": {"kind": "interior"},
 "layers": [{"type": "panel", "id": "r09_set", "layout": "frame", "frame": "tv", "cells": [{"shot": "r09_act2", "from": 0.4}]}]}
```
```json
{"id": "r09_ontv", "dur": 2.6, "transition": {"kind": "screen-dive", "dur": 0.7, "frame": [0.26, 0.14, 0.48, 0.52], "shape": "rect"},
 "bg": {"kind": "interior"}, "layers": [{"type": "bean", "who": "rival", "x": 0.5, "y": 0.96, "size": 520, "pose": "present", "talk": [[0.8, 2.4]]}]}
```

**"Spies were watching."** Binoculars trail a pan.
```json
{"id": "r09_watch", "dur": 3.2, "bg": {"kind": "sky"}, "camera": {"zoom": [1.05, 1.05], "pan": [[-120, 0], [140, 0]], "ease": "inOut"},
 "layers": [{"type": "bean", "who": "rival", "x": 0.62, "y": 0.8, "size": 300, "pose": "wave"},
            {"type": "fg", "kind": "binoculars", "id": "r09_bino", "hud": true, "enter": "none", "lag": 0.2, "handheld": 2}]}
```

**"He woke up in a strange room."**
```json
{"id": "r09_wake", "dur": 3.4, "transition": {"kind": "vignette-close", "dur": 1.0, "at": [0.5, 0.4], "r": 0.2}, "bg": {"kind": "interior"},
 "layers": [{"type": "bean", "who": "rival", "x": 0.5, "y": 1.25, "size": 1100, "expr": "worried", "talk": [[1.4, 2.6]]},
            {"type": "fg", "kind": "eye-pov", "id": "r09_eye", "hud": true, "enter": "none", "wake": 1.1, "bloom": 1.15, "blink": [2.6]}]}
```

**"A new era began."**
```json
{"id": "r09_era", "dur": 2.4, "transition": {"kind": "spin-zoom", "dur": 1.2, "emblem": {"text": "THE NEW ERA", "color": "#4a3aa8",
  "shape": [[0, -1], [0.24, -0.32], [0.95, -0.3], [0.38, 0.12], [0.6, 0.82], [0, 0.4], [-0.6, 0.82], [-0.38, 0.12], [-0.95, -0.3], [-0.24, -0.32]]}},
 "bg": {"kind": "sky"}, "layers": []}
```

**Back from the memory.** A sepia shot, then the present comes in through `sepia-to-color`.
```json
{"id": "r09_now", "dur": 2.4, "transition": "sepia-to-color", "bg": {"kind": "sky"},
 "layers": [{"type": "bean", "who": "hero", "x": 0.5, "y": 0.96, "size": 500, "expr": "content"}]}
```

**The stare.** Letterbox, a jump cut-in on the key word and a dutch snap.
```json
{"id": "r09_stare", "dur": 3.0, "bg": {"kind": "flat", "color": "#2a1c30"},
 "camera": {"letterbox": {"h": 0.12, "at": 0.3, "out": 2.6}, "jump": [{"at": 1.4, "zoom": 1.35, "focus": [0.5, 0.35]}],
            "rot": [{"at": 0, "v": 0}, {"at": 1.4, "v": -6}]},
 "layers": [{"type": "bean", "who": "rival", "x": 0.5, "y": 1.1, "size": 900, "expr": "angry"}]}
```

**"But the real threat was behind him."** Rack focus from the hero to the rival.
```json
{"id": "r09_rack", "dur": 3.2, "bg": {"kind": "interior"}, "focus": [{"at": 0, "on": "r09_near", "px": 10}, {"at": 1.6, "on": "r09_far"}],
 "layers": [{"type": "bean", "who": "rival", "id": "r09_far", "x": 0.7, "y": 0.8, "size": 320, "expr": "smug"},
            {"type": "bean", "who": "hero", "id": "r09_near", "x": 0.3, "y": 1.05, "size": 700, "expr": "neutral"}]}
```

**"Meanwhile, he was on his way."** A giant cast member walks across the lens.
```json
{"id": "r09_meanwhile", "dur": 2.8, "transition": {"kind": "fg-pass", "dur": 0.8, "who": "rival", "view": "side"}, "bg": {"kind": "sky"},
 "layers": [{"type": "fg", "kind": "spyglass", "id": "r09_glass", "hud": true, "enter": "none", "r": 0.42}]}
```

## ⑥ Limits and pitfalls

- Anything the new shot animates during the transition `dur` is hidden under the holds. Start entrances, panels and
  eye events after it.
- The previous shot keeps rendering past its own `dur` during the transition: layers with `out` or moves near its end
  keep going, so do not end a shot on an exit you need to see.
- During a transition both shots render every frame (twice the cost); a panel costs one shot render per cell and a
  `reflect` one more. Keep grids to 4-6 cells.
- Panels: a panel cannot show its own shot, nesting is limited to 2 levels (`T.subShot` throws), and a live cell
  freezes on the source shot's last frame once its time runs out (use `from` or `t`). A panel with an `id` blurs
  under rack focus unless it sets `sharp: true`.
- `slideIn` on a hard cut fills the gap with the gutter colour while cells slide, which reads as dropped black
  frames. Use `slideIn: false` on a cut, or hide the slide behind a non-cut transition.
- Crops keep fragments of the source lettering at the cell edge ("TA"); `labels: false` removes them.
- Masks need a camera pan for `lag` to show.
- `fg-pass` without `who` (or with a name missing from `cast`) walks a generic figure; a missing `peek` name draws an
  empty hole. Both read `cast` from the film being rendered.
- `iris` has no `at` and always opens from the centre; use `peephole` or `inkblot` for an off-centre point.
- `screen-dive` and `portal` only look seamless when `frame` matches the TV, painting or map position in A.
- Camera `jump` has no duration: entries stack until the shot ends. Use `punch` for a zoom that comes back.
- A grade recolours the whole shot, but transition overlays (clouds, curtains, ink) are drawn after both shots and
  are never graded; film `overlays` draw over transitions.
