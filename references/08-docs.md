# 08 · Docs v4: names, time cards, bubbles, numbers, graffiti and verdict papers

Text and paper devices from the v4 reference pass: rank labels and renamed names, "N YEARS LATER" cards, picture speech bubbles, stacked statistics, unit cards, punched-in years, caption bands, paint-over graffiti, fact-check scorecards, faked tallies, struck-out lists and crayon plans. Module: `scripts/engine/lib/docs3.js`. Vocabulary: `scripts/vocab/docs3.json` (kinds merge with `docs.json` under the `TOON.DOCS` registry). Showcase: [examples/v4_docs/spec.json](../examples/v4_docs/spec.json).

Every kind is a `doc` layer: `{ "type": "doc", "kind": "<kind>", ... }`. Docs animate their own entrance (the layer default `enter` is `none`), so do not add `enter`. Common layer fields (`x`, `y`, `scale`, `rot`, `move`, `out`, `blur`, `swap`, `jitter`, `swing`, `hud`) still apply. Times inside a doc are layer-local (they count from the layer's `at`). Frame counts below are at 30 fps. An invalid enum value (`style`, `anchor`, `arrow`, `paper`, `wall`) throws a clear error; missing fields take the defaults.

## Which recipe for which sentence

| Narration | Recipe |
| --- | --- |
| "Meet X, the general / the boss" | `nameplate` `style: "rank"`, `anchor: "bottom-left"` |
| "This is X" (cold open on a character) | `nameplate` `style: "big"`, placed before the bean in `layers` so the name sits behind the character; place it so the head does not hide it (above the shoulders or beside the bean) and set `fadeTo: 0.4` only when the character changes pose |
| "A boy called X, who later renamed himself Y" | `nameplate` `style: "hand"`, `arrow: "hook-right"`, `arrowTo: "<bean id>"`, `strike: {at, new}` |
| "Enter the rival" | `nameplate` `style: "slant"`, `anchor: "head"`, `who: "<bean id>"` |
| "X, pronounced ...", "X: the failed painter, the next big thing" | `sub`, `bullets` |
| "N years later", "meanwhile" | `timeskip` `black` (hard card) or `cloud` (over the live scene) or `inline` |
| "He explained that A leads to B", "the plan was cancelled" | `pictobubble` `icons` with `arrow` items and `strike` |
| "She dreamed of ...", "he imagined ..." | `pictobubble` `thought` with `scene` (another shot inside) and a nested `child` |
| "The plan had four steps" | `pictobubble` `list` (grows one line per beat) |
| "He demanded ...", "the crowd shouted" | `pictobubble` `shout` |
| "An army of N, plus M auxiliaries" | `statstack` |
| "He had N of X and M of Y" | `unitcards` over a blurred close-up (`blur: 6` on that bean) |
| "Then came 1212" | `bigyear` |
| "Units X, Y and Z were never used again", title bands | `band` (`items`, `retireAt`) or `band` with `sub` and no items |
| "Officially it was called ..." (euphemism, rebrand) | `graffiti` `cover` + `rewrite` + `thumb` |
| "Signed in blood" | `graffiti` `style: "blood"`, `hands`, `flood` |
| "His name was erased" | `graffiti` `erase: {word}` |
| "Let's check the claims" | `scorecard` with `marks` on the narration beats, then `verdict` |
| "They faked the numbers" | `tally` |
| "The list of prisoners became a menu", "treated the treaty as a to-do list" | `list` with `strike`, `retitle`, `insertTitle`, `ticks`, `pencil`, `spill` |
| "On paper it was a kingdom" (naive plan, then the downgrade) | `crayon` with `recolor` and `cut` |

## `nameplate`

| Field | Default | Meaning |
| --- | --- | --- |
| `style` | `rank` | `rank` (small red rank word above a heavy white name), `big` (condensed 110 px name, stays fully readable unless `fadeTo` is set), `hand` (hand-lettered, per-letter jitter, no shadow), `slant` (italic, skewed, vertical `gradient`) |
| `name`, `rank`, `sub`, `rankColor`, `color` | `NAME`, none, none | `sub` is a 50 % line under the name (pronunciation) |
| `bullets`, `bulletEvery` | `[]`, 0.6 | Lines typed under the name at 2 letters per 2.5 frames, one every `bulletEvery` s |
| `size` | 88 (`big` 110) | Name height in px |
| `tilt` | rank 0, big 0, hand −10, slant −6 | Degrees |
| `in` | rank/hand `rise`, big `pop`, slant `slide` | `rise` (80 px up + fade over 8 f), `pop` (1.25 → 1 over 4 f), `slide` (from the right over 5 f), `none` |
| `hold`, `fadeTo`, `fadeDur` | 0.6 / 1 / 1 (big hold 0.33) | After landing and `hold`, alpha eases to `fadeTo` over `fadeDur` |
| `anchor` | `free` | `bottom-left` (left-aligned at 60 px, H−90; sub-lines stack upward; only when `x`/`y` are unset), `head` (above the head of bean layer `who`) |
| `arrow` | `none` (`hook-right` when `arrowTo` is set) | `hook-left`, `hook-right`, `hook-down` (white curved arrow with an open V head, draws on over 7 f after the name lands) or `straight` (thick arrow) |
| `arrowTo` | none | A bean layer id (the arrow ends beside its head) or `[x, y]` frame fractions |
| `strike` | none | `{at, new, color}`: marker line draws 6 f, holds 8 f, the old name fades 6 f, the new name writes at 2 f per letter |
| `gradient` | `["#ffe27a", "#f08a1e"]` | `slant` fill, top to bottom |

## `timeskip`

`{ text, style: "black"|"cloud"|"inline", color, bg, size, dur, rotFrom −6, rotTo −2, scaleFrom 0.96, scaleTo 1.04, w, h, hud }`

- `black`: a full-frame `bg` card. The text fades in over 15 f, rotates and scales linearly across `dur` (default: the layer's `out − at`, else 2 s) and fades to black over the last 10 f. Use 1.5–2 s.
- `cloud`: a white cloud (`w` 1000 × `h` 300) pops 0 → 1.1 → 1 in 6 f; red brush letters tilted −8°.
- `inline`: white caps with an ink outline on a live shot (set `y` near 0.12).
- Screen-locked by default (`hud: false` lets the camera move it).

## `pictobubble`

`{ style: "speech"|"thought"|"shout", w 620, h 300, tail [dx, dy] | false, appear: "pop"|"cut", tilt, ... }` plus one content:

- `icons: [{prop | who | creature | text | arrow: true, at, strike, size, expr, pose}]`, `every` 0.5, `iconSize`: a row of props, cast busts, creatures or words separated by orange arrows. Each pops over 5 f; `strike` (seconds) stamps a red prohibition ring in 1 frame with a 2-frame shake.
- `scene: {shot, t, scale, dx, dy, grade}`: renders another shot of the film inside the bubble (`t` freezes it; default plays along).
- `list: [...]`, `listEvery` 1.0, `listAt` 0.3, `size` 40, `maxH`: numbered lines; the bubble grows upward to fit over 6 f per line (the tail stays put), and the font shrinks 10 % per step when `maxH` is reached.
- `text` (`\n` for line breaks), `size` 46.
- `child: {style, icons | text | list, at, w, h, dx, dy}`: a nested bubble spawned from the top edge, its two trail circles popping 3 f apart.
- `shout`: pink lumpy cloud, white italic text, grows 0.3 → `grow` (1.6) over 30 f with −8° rotation; black shards and a red halftone cluster pop at 65 %.

Timing tip (Ro-1): hold the empty bubble for ~15 f before the first icon.

## Number cards

- `statstack`: `{ main: {value, label}, lines: [{at, value, label, color}], countUp true, countDur 0.6, size 96, anchor "bottom-left", numColor, lineColor }`. Lines slide up 40 px and fade in over 8 f; numbers count up with their own thousands separator; each new line pushes the older ones up over 6 f. Screen-locked.
- `unitcards`: `{ cards: [{who | creature | prop, n: "x50,000", at, bg, label}], w 280, gap 40, every 0.8 }`. Cream cards pop 0 → 1.15 → 1 over 6 f, 0.8 s apart; red slanted counters. Put a big blurred bean (`blur: 6`) behind and push the camera in slowly.
- `bigyear`: `{ text, size 300, face: [top, bottom], side, depth 12, grow 1.15, growDur 2, fade: {at, to, dur} }`. Italic gold numerals with a 12-step extrusion punch 5 % → 40 % → 90 % → 100 % at frames 3, 6, 8, then grow linearly; `fade` leaves a ghost while the scene continues.
- `band`: `{ y 0.18, h 0.22, header, sub, items, every 1, retireAt, retireColor, outAt, alpha 0.45, headerFrom, headerTo, headerSize 72, itemSize 110 }`. A full-width translucent band (fades in over 4 f); the header colour lerps over 6 f; items pop-tilt one per `every`; `retireAt` strikes them through with a thick `retireColor` (red) line, one item every 3 f, while the numerals stay light and readable; `outAt` fades everything over 10 f. With `sub` and no `items` it is a title band.

## `graffiti`

`{ text ("\n" for lines), style: "brush"|"blood"|"paint", color, size 170, wall: "brick"|"parchment"|"plaster"|"none", w 2000, h 1140, tilt −4, tx, ty, write: {at 0.2, dur 1.2}, cover, erase, rewrite, hands, flood, thumb }`

- Letters reveal in order with a sweep per glyph over `write.dur`. `paint` and `blood` letters grow drips over 1.5 s; `blood` adds a dark offset and spatter dots.
- `cover: {at 2, dur 1.2, color "#f5d020", tool "roller"|"eraser", line}`: paints over one line (default the last) right to left with a ragged edge, a roller and a glove riding it.
- `erase: {word, at, dur 0.8}`: a pink eraser rubs one word (index counted across the whole text) back to the wall.
- `rewrite: {text, at, perLetter 0.2, color}`: hand-lettered text on the covered band, written by a brush held by a glove (the reference uses ~6 f per letter).
- `hands: true`: two gloves at the bottom corners; the right one follows the writing point.
- `flood: {at, dur, to}`: the wall reddens. `thumb: {at}`: a thumbs-up glove slides in over 8 f.

## Verdict papers

- `scorecard`: `{ title, rows 6, cols ["STATEMENT","TRUE","FALSE"], marks: [{row, col: "true"|"false"|index, at, kind, color}], stand true, tilt 4, verdict: {text, at, color, size}, w 420, h 520 }`. Each mark draws in two strokes over 8 f, then settles 1.15 → 1 over 5 f; put marks on the narration beats. The verdict uses the v3 `stamp`.
- `tally`: `{ title, value "0", scribble: {at 1, text, every 0.1, color "#1a2a8a"}, easel true, w 640, h 480 }`. Pen digits continue the printed value one per `every`, growing up to 30 % larger and wrapping; each pops 1.2 → 1 over 2 f. Cut to a smug reaction afterwards.
- `list`: `{ paper: "sheet"|"scroll", title, items, every 0.3, itemsAt 0.3, size 40, rowH 64, w 620, strike: [{item | "title", at, color}], retitle: {text, at, color}, ticks: [{item, at}], insertTitle: {text, at}, pencil, spill: {at, len} | true }`. Items are hand-lettered; strikes draw over 6 f; `retitle` writes over 12 f above the old title; `insertTitle` slides the content down one row over 6 f and writes a new heading; `pencil` shows a glove with a pencil at the current stroke; `spill` swaps in one frame to a long paper folding down to the floor.
- `crayon`: `{ outline: [[x, y], ...] (0–1 of the sheet), items: ["figure","castle","$","rocket","box","heart","star","sun","crown" or any word], itemSize, caption, color, recolor: {at, color}, paper, w 900, h 640, drawAt 0.2, drawDur 1, cut: {at} }`. Waxy strokes draw on in order; `recolor` redraws them in a second colour over 10 f; `cut` slides scissors in over 8 f, snaps them shut in 5 f, and the two halves fall.

## Timing notes

- Name labels land in 4–8 frames and hold; never ease a label in for longer than a third of a second.
- Hold-and-snap: marks, stamps and strikes appear in 1–8 frames, then hold; the narration beat decides `at`.
- Leave a 0.3–0.5 s gap after a `timeskip` card before the next beat.
- Graffiti euphemism gag (W1-2): write 0.8 s, cover ~35 f, rewrite 6 f per letter, thumbs-up 8 f.
