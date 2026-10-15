# 06 · Paper and lettering
In a word: every piece of text and paper a narrated film puts on screen: name labels, titles, dates and counters, newspapers and treaties, stamps and charts, speech and picture bubbles, time-skip cards, big numbers, graffiti, verdict papers, a year ruler and karaoke subtitles.

Engine: `scripts/engine/lib/base/text.js` (`label`, `title`, `date`, `era`, `counter`, `timer`, `caption`), `scripts/engine/lib/paper/paper.js` (`doc` layer + paper kinds), `scripts/engine/lib/paper/signs-bubbles.js` (bubbles, TV, signs, banners), `scripts/engine/lib/paper/cards.js` (name, time, number, graffiti and verdict cards), `scripts/engine/lib/paper/timeline-subtitles.js` (`timeline`, `subtitle`) · Vocabulary: `scripts/vocab/paper.json`, `scripts/vocab/paper-cards.json` (`doc` kinds, registry `TOON.DOCS`), `KNOWN_LAYERS` in `scripts/spec.py` · Example films: [`examples/paper_cards/spec.json`](../../examples/paper_cards/spec.json) (one shot per card), [`examples/paper_and_maps/spec.json`](../../examples/paper_and_maps/spec.json) (paper kinds, `timeline`, `subtitle`), [`examples/grammar/spec.json`](../../examples/grammar/spec.json) (lettering layers in context); render with `--sheet` to browse · Related cards: [01 Characters](01_characters.md) (busts and portraits come from `cast`), [03 Props, creatures and vehicles](03_props_creatures_vehicles.md) (icons in charts, bubbles and unit cards), [05 Maps](05_maps.md) (signs and banners over a map), [07 Game UI](07_game_ui.md) (game-screen `doc` kinds and the `hud` layer), [08 FX and tone](08_fx_and_tone.md). Shared layer fields, `card`, `sign` and `calendar`: [03-spec-reference](../03-spec-reference.md); which device for which line: [02-visual-grammar](../02-visual-grammar.md), [07-story-craft](../07-story-craft.md).

## ① When to use it

| The narration says… | Device |
|---|---|
| "This is X, the dictator" (classic intro) | `label` with `tag` and `arrow` toward the character |
| "Meet X, the general / the boss" | `doc` `nameplate` `style: "rank"`, `anchor: "bottom-left"` |
| "This is X" (cold open on a character) | `nameplate` `style: "big"` placed before the bean in `layers` |
| "A boy called X, who later renamed himself Y" | `nameplate` `style: "hand"`, `arrowTo: "<bean layer id>"`, `strike: {at, new}` |
| "Enter the rival" | `nameplate` `style: "slant"`, `anchor: "head"`, `who: "<bean layer id>"` |
| "X, pronounced …", "X: the failed painter, the next big thing" | `nameplate` `sub`, `bullets` |
| Chapter title, episode name | `title`; `mission` for a punchy one-word chapter |
| "In 46 BC…" | `date` with `suffix`, then `era` badge |
| "Rome, the Republic" (period on screen for minutes) | `era` (screen-locked, bottom left) |
| "20,000 soldiers", "it cost 3 million" | `counter`; `statstack` for "N, plus M" |
| "He had N of X and M of Y" | `unitcards` over a blurred close-up |
| "Then came 1212" | `bigyear`; `yearsign` with `strike` for a corrected year |
| "N years later", "meanwhile" | `timeskip` `black` / `cloud` / `inline` |
| "Speedrun", "the clock was ticking" | `timer` (also as a film `overlay`) |
| A quote that must be read | `caption`; `quote` with a grey portrait |
| "The papers said…", "both sides claimed…" | `newspaper` (two, tilted, 0.5 s apart) |
| "The treaty said…", "the demands were…" | `checklist` / `document` with `checks`, `strikes`, `stamp` |
| "Rejected", "approved", "classified" | `stamp` |
| "The economy collapsed", "sales rose" | `chart` `line` / `bar` with `icons` and `callouts` |
| "His papers said he was…" | `idcard`; `poster` for wanted / propaganda; `nametag` for an ironic name sticker |
| "Breaking news" | `tv` `style: "modern"` + `lowerthird` |
| "He said on TV that…" (fact-check) | `tv` `style: "oval"` + `subtitle` with `flag`, then `stamp` |
| "Let's check the claims" | `scorecard` with `marks` on the beats, then `verdict` |
| "They faked the numbers" | `tally` |
| Talking, thinking, shouting | `bubble` (text or a mini bean) |
| "He explained that A leads to B", "the plan was cancelled" | `pictobubble` `icons` with `arrow` items and `strike` |
| "She dreamed of…" | `pictobubble` `thought` with a `scene` from another shot and a nested `child` |
| "The plan had four steps" | `pictobubble` `list` |
| "He demanded…", "the crowd shouted" | `pictobubble` `shout` |
| "Units X, Y and Z were never used again" | `band` with `items` and `retireAt` |
| "The counter of times it fell apart" | `hangsign` with `swap` |
| A dynasty or faction name over a map | `ribbon` |
| "Officially it was called…" (euphemism) | `graffiti` `cover` + `rewrite` + `thumb` |
| "Signed in blood" / "his name was erased" | `graffiti` `style: "blood"` + `flood` / `erase` |
| "Millions died" | `stat` (huge numeral on a wall) |
| "The prisoners became a menu", "a to-do list" | `list` with `strike`, `retitle`, `insertTitle`, `ticks`, `spill` |
| "On paper it was a kingdom" (naive plan) | `crayon` with `recolor` and `cut` |
| "Three wars in the time of one" | `timeline` with `spans`, `marks`, `pointer` |

## ② Look and staging rules

- **Lettering style.** Heavy Rubik 800/900 caps, a dark-brown ink outline and a soft drop shadow. White is the default fill; gold `#f2c230` for tags and new names, red `#c8323a` for titles, red `#c8141c` / `#e0302a` for strikes, stamps and verdict marks. Paper is warm cream (`#f6ecd2`, `#fbf7ee`, `#efe2c0`) with one flat darker band as its shadow, never gradients.
- **Sizes that read at 1080p.** Name 80–110 px, tags at half the name, captions 56 px, subtitles 54 px, body text on paper 40–44 px. Nothing under ~30 px. Long names: drop `size` to 80–90 rather than letting them run off the frame.
- **Safe frame.** `label`, `title` and `counter` shift themselves to stay 3.5 % inside the frame edge (camera zoom included); `keepInFrame: false` turns that off. A `title` longer than 90 % of the frame is squeezed.
- **Empty side.** Put names on the empty side of the frame (x 0.22–0.32 when the character stands on the right). A `big` nameplate goes behind the bean (earlier in `layers`) and beside or above the head, never under it.
- **Screen-locked by default** (ignore camera moves, `hud: false` lets the camera move them): `era`, `timer`, `lowerthird`, `timeskip`, `statstack`, `band`, `timeline`, `subtitle`. Everything else moves with the camera.
- **Always sharp.** Lettering and `doc` layers ignore shot `focus` blur even with an `id` (`focusable: true` opts in).
- **Docs animate themselves.** Every `doc` kind runs its own entrance (layer default `enter` is `none`); do not add `enter`. Times inside a doc are layer-local (from the layer `at`). Common layer fields (`x`, `y`, `scale`, `rot`, `move`, `out`, `blur`, `swap`, `jitter`, `swing`, `hud`) still apply.
- **Hold and snap.** Name labels land in 4–8 frames and hold; never ease a label in for longer than a third of a second. Marks, stamps and strikes appear in 1–8 frames, then hold; the narration beat decides `at`.
- **No real marks.** Mastheads, posters and stamps carry invented names; no real logos, insignia, extremist symbols or likenesses. Portraits are cast beans.

## ③ Field reference

### ③.1 Lettering layers

| Layer | Fields and defaults | Behaviour |
|---|---|---|
| `label` | `text` (required), `size` 96, `color` `#fff`, `tilt` −4, `tag`, `tagColor` `#f2c230`, `arrow` (`right`, `down-right`, `down`, `down-left`, `left`, `up-left`, `up`, `up-right` or degrees), `arrowAt` 0.2, `arrowLen` 1.5 × `size`, `keepInFrame` | Name plate: tag (half size) pops above the name at 0.08 s, a white block arrow pops at `arrowAt` and nudges. Default `enter` `pop` |
| `title` | `text` (required), `size` 120 (fitted to 90 % of the frame), `color` `#c8323a`, `stagger` 0.035, `jiggle` 2, `sub`, `subColor` `#fff`, `keepInFrame` | Letters pop one by one (`stagger` s apart) and jiggle `jiggle` px; `sub` (0.42 size) pops after the last letter. Default `enter` `none` |
| `date` | `text` (required), `suffix`, `size` 110, `color` `#fff` | Big numerals with a small trailing era mark ("46" + "BC"). Default `enter` `pop` |
| `era` | `parts: [[text, color], …]` (or `text`, drawn red), `small`, `size` 64 | Left-aligned period badge; `small` line (0.38 size) above. Screen-locked; default `enter` `slide-left`. Place at x 0.025, y 0.95 |
| `counter` | `from` 0, `to` 100, `dur` 1.5, `delay` 0, `ease` `outCubic` (any engine ease; unknown names fall back to in-out), `decimals` 0, `sep` `" "` (`false` = none), `prefix`, `suffix`, `size` 150, `color` `#fff`, `keepInFrame` | Counts up with a tiny tremble while counting. Default `enter` `pop` |
| `timer` | `start` 0 (s), `rate` 1 | Green LCD clock (300 × 110 px) reading `s.cc` or `m:ss.cc`. Screen-locked; default `enter` `none`; resize with `scale` |
| `caption` | `text` (required), `size` 56, `color` `#fff` | A plain outlined quote line for the lower third. Default `enter` `fade`. `script2spec` placeholders carry `"todo": true` |

### ③.2 The `doc` layer

`{ "type": "doc", "kind": "<kind>", … }`. The kinds below plus the game-screen kinds in [07 Game UI](07_game_ui.md) share the `TOON.DOCS` registry; an unknown kind throws. Kinds from `cards.js` throw a clear error on an invalid enum value (`style`, `anchor`, `arrow`, `in`, `paper` of `list`, `wall` of `graffiti`); missing fields take the defaults.

Shared entrance: **docPop** = scale 0 → ~1.15 → 1 with a small settle rotation over 0.22 s (≈7 f), used by `newspaper`, `document`, `checklist`, `chart`, `poster`, `quote`, `tv`, `nametag`, `scorecard`, `tally`, `list`, `crayon`.

### ③.3 Paper kinds

| Kind | Fields and defaults | Behaviour |
|---|---|---|
| `newspaper` | `masthead` "THE DAILY TIMES", `date`, `headline` "BREAKING NEWS", `subhead`, `photo: {who \| color, bg}`, `w` 760, `h` 980, `color` `#efe8d6`, `grayscale` false, `id` (seeds the column lines) | docPop. Text lines fill the columns; the photo is a cast bust (grey when `grayscale`). Tilt with `rot` |
| `document` | `title`, `titleColor`, `lines: [...]`, `lineSize` 44, `rowH` 74, `every` 0 (line reveal step), `paper` (`"scroll"` adds rolled ends), `w` 860 (1100 with `minimap`), `h` (auto), `boxes`, `checks: [{row, at, mark: "check" \| "x", color}]`, `strikes: [{row, at, color}]`, `stamp: {text, at, color, size 70, tilt}`, `minimap: {color}`, `id` | docPop; lines fade in 0.2 s from 0.15 s, `every` apart. `checks` (or `boxes: true`) draws boxes; a tick (green) or cross (red) draws in 0.2 s; strikes are hand-drawn red lines over 0.25 s; `minimap` adds a small blob map with a red area |
| `checklist` | as `document`, boxes always on | Treaty terms, demands, to-do lists |
| `stamp` | `text` "APPROVED", `color` `#c8141c`, `size` 110, `tilt` −12 | Slams 1.6 → 1 in 3 f with a 0.25 s shake; double border |
| `chart` | `chart: "line" \| "bar"`, `values` [1, 2, 3], `labels`, `yLabel`, `color` `#c8141c` (an array cycles per bar), `dur` 1.5, `w` 1100, `h` 680, `paper: "grid"`, `arrowEnd` true, `icons: [{i, prop "coin", at, dy 80, size 90}]`, `callouts: [{i, text, at, dy 130, w 300}]` | docPop; hand-drawn axes with arrowheads; the line draws from 0.25 s over `dur` with white dots and an end arrow; bars pop one by one across `dur`; icons and callout bubbles pop above value `i` |
| `idcard` | `name` "NAME", `nameColor` `#f2c230`, `sub`, `line`, `who`, `header` "IDENTITY CARD", `band` `#3a6fb0`, `color` `#f3e6c4`, `w` 760, `h` 440, `tilt` −8 | Slides in from 500 px left over 0.28 s; colour bust of a cast member |
| `poster` | `title` "WANTED", `titleColor` `#c8141c`, `name`, `sub`, `who`, `duotone: [dark, light]` (`#2a3a6a`, `#9ab0d8`), `color` `#efdcae`, `w` 600, `h` 820, `tilt` 2 | docPop; duotone portrait, pinned corners. Also propaganda |
| `quote` | `who`, `text`, `author`, `size` 50, `dur` 0.8, `color` `#2b2d33`, `w` 1300, `h` 460 | docPop; grey portrait; the italic quote reveals line by line from 0.2 s over `dur`; `author` appears after the last line |
| `stat` | `value` "1.5", `words: [...]`, `wall: "brick" \| "plaster"`, `color` `#b3121c`, `size` 360, `w` 1500, `h` 760 | Huge brush numeral pops on a wall at 0.1 s; words pop 0.25 s apart from 0.4 s. Death tolls, big numbers |

### ③.4 Signs, bubbles and screens

| Kind | Fields and defaults | Behaviour |
|---|---|---|
| `bubble` | `style: "speech" \| "thought" \| "shout"`, `text` (`\n` breaks), `size` 46, `w` 560, `h` 240, `tail: [dx, dy]` (−0.25 w, 0.75 h), `who` + `expr` "happy" + `pose` "idle" (a mini bean inside), `color` (shout `#ff5aa8`), `id` | Pops 0 → 1.15 → 1 in 0.14 s. Thought bubbles get scalloped edges and three trail circles; shout is a jagged star with white text |
| `tv` | `style: "oval" \| "modern"`, `w` 900, `who`, `talk` (default talks throughout), `expr` "neutral", `pose` "idle", `view` "3q", `text`, `grayscale` true, `screen` `#6c7472`, `color` (shell) | docPop. Oval: extruded retro shell, antennas, legs, LEDs; modern: dark monitor on a stand. Scanlines and vignette over the screen |
| `yearsign` | `text` "YEAR", `num` "711", `strike: {at 1, num}`, `splash` true, `tilt` −14, `w` 520 | A plank on a post drops in with a bounce (0.3 s) into a water splash; `strike` crosses out the number (0.2 s) and pops the new one in gold |
| `hangsign` | `title` (set it), `num` 0, `swap: {at 1, num}`, `w` 620, `h` 360 | A board on two ropes drops in 0.22 s, swings and settles; `swap` strikes the digit card and slaps a new card on over 0.25 s |
| `nametag` | `name` "NAME", `nameColor`, `header` "HELLO", `sub` "MY NAME IS", `color` `#d0312d`, `w` 420, `h` 280, `tilt` −6 | docPop sticker; stick it on anything, including a statistic |
| `ribbon` | `text` "BANNER", `textColor`, `color` `#efdcae`, `w` 1100, `h` 130, `size` 72 | Banner with folded tails unrolls over 0.3 s; text appears at 70 % |
| `lowerthird` | `tag` "BREAKING NEWS", `headline` "HEADLINE", `ticker`, `color` `#c8141c` | Screen-locked full-width bar sliding in from the left over 0.3 s; `ticker` scrolls at 160 px/s. Place at x 0.5, y 0.86 |
| `mission` | `small` "MISSION:", `smallColor` `#c9c9c9`, `word` "SURVIVE", `color` `#fff`, `size` 220 | Grey line at once, then a huge bevelled word punches 1.3 → 1 from 0.12 s over 0.2 s. Chapter cards |

### ③.5 Name and time cards

**`nameplate`**

| Field | Default | Meaning |
|---|---|---|
| `style` | `rank` | `rank` (small red rank word over a heavy white name), `big` (condensed 110 px name, stays readable unless `fadeTo` is set), `hand` (hand-lettered, per-letter jitter, no shadow), `slant` (italic, skewed, vertical `gradient`) |
| `name`, `rank`, `sub`, `rankColor`, `color` | `NAME`, none, none, `#e0302a`, `#fff` | `sub` is a half-size line under the name (pronunciation) |
| `bullets`, `bulletEvery` | `[]`, 0.6 | Lines typed under the name at 2 letters per 2.5 f, one every `bulletEvery` s |
| `size` | 88 (`big` 110) | Name height in px |
| `tilt` | rank 0, big 0, hand −10, slant −6 | Degrees |
| `in` | rank/hand `rise`, big `pop`, slant `slide` | `rise` (80 px up + fade over 8 f), `pop` (1.25 → 1 over 4 f), `slide` (from the right over 5 f), `none` |
| `hold`, `fadeTo`, `fadeDur` | 0.6 (big 0.33), 1, 1 | After landing and `hold`, alpha eases to `fadeTo` over `fadeDur` |
| `anchor` | `free` | `bottom-left` (left-aligned at 72 px, 90 px above the bottom; sub-lines stack upward; only when `x`/`y` are unset), `head` (above the head of the bean layer whose `id` is `who`) |
| `who` | none | Bean layer `id` for `anchor: "head"` |
| `arrow` | `none` (`hook-right` when `arrowTo` is set) | `hook-left`, `hook-right`, `hook-down` (white curved arrow with an open V head, draws on over 7 f after the name lands) or `straight` (thick arrow) |
| `arrowTo` | none | A bean layer `id` (the arrow ends beside that head) or `[x, y]` frame fractions |
| `strike` | none | `{at 1.5, new, color "#141414"}`: marker line draws 6 f, holds 8 f, the old name fades 6 f, the new name writes at 2 f per letter |
| `gradient` | `["#ffe27a", "#f08a1e"]` | `slant` fill, top to bottom |

**`timeskip`**: `{text "9 MONTHS LATER", style "black", color, bg "#000", size, dur, rotFrom -6, rotTo -2, scaleFrom 0.96, scaleTo 1.04, w 1000, h 300, hud}`. Screen-locked unless `hud: false`.
- `black`: a full-frame `bg` card. Text (`#f2f2f2`, `size` 64, fitted to 80 % width) fades in over 15 f, rotates and scales linearly across `dur` (default: the layer's `out − at`, else 2 s) and fades out over the last 10 f. Use 1.5–2 s.
- `cloud`: a white cloud (`w` × `h`) pops 0.05 → 1.1 → 1 in 6 f; red (`#d8242a`) brush letters (`size` 120) tilted −8°.
- `inline`: white caps (`size` 72) with an ink outline on the live shot, fade in 10 f and out over the last 10 f; set `y` near 0.12.

**`pictobubble`**: `{style "speech" | "thought" | "shout", w 620, h 300, tail [dx, dy] (−0.2 w, 0.85 h) | false, appear "pop" | "cut", tilt 0, color, id}` plus one content (`text` is ignored when `icons` or `list` is set):

| Content | Fields and defaults | Behaviour |
|---|---|---|
| `icons` | `[{prop \| who \| creature \| text \| arrow: true, at, strike, size 0.9, color, expr, pose, view, zoom, flip}]`, `every` 0.5, `iconSize` (fits the row) | A row of props, cast busts, creatures or words separated by orange arrows (`arrow: true`, `color`). Each pops over 5 f at `at` (default 0.25 + i × `every`); `strike: <time>` stamps a red prohibition ring in 1 frame with a 2-frame shake |
| `scene` | `{shot, t, scale, dx, dy, grade}` | Renders another shot of the film inside the bubble (`t` freezes it at that shot time; default plays along) |
| `list` | `[...]`, `listEvery` 1.0, `listAt` 0.3, `size` 40, `maxH` 2.2 × `h` | Typed lines; the bubble grows upward over 6 f per line (tail stays put); the font shrinks 10 % per step once `maxH` is reached |
| `text` | `size` 46, `\n` breaks | Ink text (shout: white italic) |
| `child` | `{style "thought", icons \| text \| list, at 1.5, w 0.7 w, h 0.75 h, dx 0.32 w, dy (above)}` | A nested bubble spawned from the top edge; its two trail circles pop 3 f apart |

Entrances: `speech`/`thought` pop over 6 f (`appear: "cut"` skips it); `shout` is a pink lumpy cloud (`color` `#f4b6c4`) growing 0.3 → `grow` (1.6) over 30 f with −8° rotation; black shards and a red halftone halo pop at 65 %.

### ③.6 Number cards

| Kind | Fields and defaults | Behaviour |
|---|---|---|
| `statstack` | `main: {value, label, at 0}`, `lines: [{at (1 + i), value, label, color}]`, `countUp` true, `countDur` 0.6, `size` 96, `anchor` `bottom-left` \| `free`, `numColor` `#ffd94a`, `lineColor` `#e33333`, `hud` | Screen-locked; bottom-left at (60 px, 60 px from the bottom) when `x`/`y` are unset. Rows slide up 40 px and fade in over 8 f; numbers count up keeping their own thousands separator; each new line (0.42 size) pushes the older ones up over 6 f |
| `unitcards` | `cards: [{who \| creature \| prop, n "x50,000", at, bg "#c9b98f", label, expr, pose}]`, `w` 280, `gap` 40, `every` 0.8 | Cream cards (h = 1.14 w) pop 0 → 1.15 → 1 over 6 f, `every` s apart, tilted ±2°; red slanted counters. Put a big blurred bean (`blur: 6`) behind and push the camera in slowly |
| `bigyear` | `text` "1212", `size` 300 (fitted to 80 % width), `face: [top, bottom]` (`#f3d65a`, `#e2b83a`), `side` `#b48a2a`, `depth` 12, `grow` 1.15, `growDur` 2, `fade: {at 2.5, to 0.3, dur 0.5}` | Italic gold numerals with an extrusion punch 5 % → 40 % → 90 % → 100 % at frames 3, 6, 8, then grow linearly; `fade` leaves a ghost while the scene continues |
| `band` | `y` 0.18, `h` 0.22, `header`, `headerSize` 72, `headerFrom` `#c3161f`, `headerTo` `#ffe94a`, `sub`, `subColor` `#ffd94a`, `items`, `itemSize` 110, `every` 1, `retireAt`, `retireColor` `#e0302a`, `outAt`, `alpha` 0.45, `hud` | Full-width translucent band (fades in 4 f). Here `y` is the band's top edge (frame fraction) and the layer x/y are ignored; `hud: false` centres it on the layer instead. Header colour lerps over 6 f; items pop-tilt from 0.3 s, one per `every`; `retireAt` strikes them, one every 3 f, while the numerals stay readable; `outAt` fades everything over 10 f. With `sub` and no `items` it is a title band |

### ③.7 `graffiti`

`{text "TEXT" ("\n" for lines), style "brush" | "blood" | "paint", color (#e0202a, blood #c8141c), size 170, wall "brick" | "parchment" | "plaster" | "none", w 2000, h 1140, tilt -4, tx 0, ty 0, write, cover, erase, rewrite, hands, flood, thumb, id}`

| Field | Defaults | Behaviour |
|---|---|---|
| `write` | `{at 0.2, dur 1.2}` | Letters reveal in order with a sweep per glyph; `paint` and `blood` letters grow drips over 1.5 s; `blood` adds a dark offset and spatter dots; `paint` letters vary in size |
| `cover` | `{at 2, dur 1.2, color "#f5d020", tool "roller" \| "eraser", line (last)}` | Paints over one line right to left with a ragged edge, a roller (or eraser) and a glove riding it |
| `erase` | `{word 0, at 2, dur 0.8}` | A pink eraser rubs one word (index across the whole text) back to the wall |
| `rewrite` | `{text "RELOCATED!!", at 3.4, perLetter 0.2, color ink}` | Hand-lettered text on the covered band, written by a brush in a glove (needs `cover`) |
| `hands` | false | Two gloves at the bottom corners; the right one follows the writing point |
| `flood` | `{at 2, dur 1, to "#e02020"}` | The wall reddens |
| `thumb` | `{at 5}` | A thumbs-up glove slides in over 8 f |
| `tx`, `ty` | 0, 0 | Offset of the text block on the wall (px) |

### ③.8 Verdict papers

| Kind | Fields and defaults | Behaviour |
|---|---|---|
| `scorecard` | `title` "The Speech", `rows` 6, `cols` `["STATEMENT", "TRUE", "FALSE"]`, `marks: [{row, col: "true" \| "false" \| index, at 0.4, kind "tick" \| "x", color}]`, `stand` true, `tilt` 4, `verdict: {text "FALSE", at 3, color, size 64, tilt -14}`, `w` 420, `h` 520 | docPop; scribbled statements; each mark draws in two strokes over 8 f, then settles 1.15 → 1 over 5 f (`kind` defaults to a tick in the TRUE column, a cross elsewhere); `verdict` is a `stamp` |
| `tally` | `title` "AMOUNT PRODUCED:", `value` "0", `scribble: {at 1, text "999999", every 0.1, color "#1a2a8a"}`, `easel` true, `w` 640, `h` 480 | docPop; pen digits continue the printed value one per `every`, growing up to 30 % larger and wrapping; each pops 1.2 → 1 over 2 f |
| `list` | `paper: "sheet" \| "scroll"`, `title`, `items`, `every` 0.3, `itemsAt` 0.3, `size` 40, `rowH` 64, `w` 620, `h` (auto), `strike: [{item \| "title", at 1, color}]`, `retitle: {text "MENU", at 2.8, color}`, `ticks: [{item, at 1, color}]`, `insertTitle: {text "TO DO LIST:", at 0.5}`, `pencil`, `spill: {at 0, len 900} \| true` | docPop; items hand-lettered; strikes draw over 6 f; ticks 5 f; `retitle` writes over 12 f above the old title; `insertTitle` slides the content down one row over 6 f and writes a heading; `pencil` shows a gloved pencil at the current stroke; `spill` swaps in one frame to a long paper folding to the floor |
| `crayon` | `outline: [[x, y], …]` (0–1 of the sheet), `items: ["figure", "castle", "$", "rocket", "box", "heart", "star", "sun", "crown" or any word]`, `itemSize` (0.22 × the smaller side), `caption`, `color` `#e050c0`, `recolor: {at 1.5, color "#3a6ae0"}`, `paper` (sheet colour, `#f6f1e4`), `w` 900, `h` 640, `drawAt` 0.2, `drawDur` 1.0, `cut: {at 3}` | docPop; waxy strokes draw on in order, words and `caption` appear when done; `recolor` redraws in a second colour over 10 f; `cut` slides scissors in over 8 f, snaps them shut in 5 f, and the halves fall |

### ③.9 `timeline` layer

`{ "type": "timeline", "x": 0.5, "y": 0.25, "from": 0, "to": 2000, "w": 0.84, "prefix": "YEAR", "labels": {"500": "…"}, "panel": "rgba(20,14,10,0.55)", "spans": [...], "marks": [...], "pointer": {...} }`. Screen-locked (`hud: false` lets the camera move it); default `enter` `none`.

| Field | Defaults | Behaviour |
|---|---|---|
| `from`, `to`, `w` | 0, 2000, 0.84 | Year range and ruler width (frame widths); the ruler draws over 0.35 s |
| `prefix`, `labels` | `YEAR`, none | End labels read "`prefix` year" unless `labels` maps that year to a text |
| `panel` | dark translucent | Backing panel colour; `false` removes it |
| `spans` | `[{from, to, label, color, at (0.4 + i), row (i % 3), grow 0.25}]` | Rounded bars pop (0.3 s) and grow along the ruler over `grow` s; `row` stacks them (three rows by default); colours cycle red, orange, violet, green |
| `marks` | `[{year, label, color, at 0.5}]` | Dots on the ruler, popping 0.25 s |
| `pointer` | `{from (ruler from), year (ruler to), at 0.3, dur 1.5, suffix, color "#ffe066"}` | The time-machine pointer slides in-out and shows the current year |

### ③.10 `subtitle` layer

`{ "type": "subtitle", "x": 0.5, "y": 0.9, "text": "…", "start": 0, "dur": 0.32 × words, "base": "#fff", "fill": "#7fe08a", "flag": [{"word": "never wanted war", "color": "#ff2a2a", "at": 3.2}], "size": 54, "maxW": 0.82, "words": [{"w": "…", "at": 0.4}] }`. Screen-locked; default `enter` `none`.
- Words switch from `base` to `fill` one by one; timing is weighted by character count over [`start`, `start + dur`]. Pass `words: [{w, at}]` for exact transcript timings (then `text` is ignored).
- Lines wrap at `maxW` (frame widths) and stack upward: the last line sits on `y`.
- `flag` turns a word or phrase (`word`, matched case- and punctuation-insensitively on consecutive words) red with a small pop, by default 0.3 s after its last word fills. This is the fact-check device: the quote plays, then the lie lights up.

## ④ Timing

Frame counts at 30 fps.

| Beat | Frames / seconds | Field |
|---|---|---|
| Label pop | 10 f (0.32 s) outBack; tag at +2 f over 9 f; arrow at 0.2 s over 9 f | `enter`, `arrowAt` |
| Title letters | one every ~1 f (0.035 s), each 8 f; sub after the last | `stagger` |
| Era slide | 10 f | default `enter` |
| Counter | 1.5 s count, then punch-zoom on the last digit | `dur`, `camera.punch` |
| Name label land | 4–8 f, never longer than ~10 f; nameplate `rise` 8 f, `pop` 4 f, `slide` 5 f | `in` |
| Hook arrow | draws 7 f, starting 2 f after the name lands | `arrow` |
| Rename strike | line 6 f, hold 8 f, fade 6 f, 2 f per new letter | `strike` |
| Bullets | 2 letters per 2.5 f, one line per 0.6 s | `bulletEvery` |
| docPop | ~7 f (0.22 s) | most docs |
| Bubble pop | ~4 f (0.14 s); pictobubble 6 f; hold the empty bubble ~15 f before the first icon | `icons[].at` |
| Stamp slam | 1.6 → 1 in 3 f, shake 8 f | `stamp`, `verdict.at` |
| Tick / cross | 6 f (document), 8 f + 5 f settle (scorecard) | `checks[].at`, `marks[].at` |
| Strike line | 8 f (document), 6 f (list, nameplate) | `strikes[].at`, `strike[].at` |
| Chart line | 1.5 s from 0.25 s | `dur` |
| ID card slide | 8 f | — |
| Year sign drop | 9 f bounce; strike 6 f; new number at +6 f | `strike.at` |
| Hang sign | drop 7 f, swing settles in ~1 s; swap 8 f | `swap.at` |
| Lower third | slide 9 f; ticker 160 px/s | — |
| Mission word | small line at once, word at 4 f, punch 6 f | — |
| Timeskip `black` | fade in 15 f, drift 1.5–2 s, fade out 10 f; leave 0.3–0.5 s before the next beat | `dur`, layer `out` |
| Timeskip `cloud` | 6 f pop | — |
| Statstack row | 8 f slide-fade, count 18 f, push 6 f | `lines[].at`, `countDur` |
| Unit cards | 6 f pop, 0.8 s apart | `every` |
| Big year | punch at f3, f6, f8, then 2 s grow | `growDur` |
| Band | 4 f fade-in, items 8 f pop-tilt 1 s apart, strikes 3 f apart, out 10 f | `every`, `retireAt`, `outAt` |
| Graffiti euphemism gag | write 0.8 s, cover ~35 f, rewrite 6 f per letter, thumbs-up 8 f | `write`, `cover`, `rewrite.perLetter` 0.2, `thumb` |
| Tally digits | one per 3 f, each 2 f pop | `scribble.every` |
| List retitle | 12 f; insert title 6 f slide | `retitle`, `insertTitle` |
| Crayon | 1 s draw, 10 f recolour, scissors 8 f + 5 f snap | `drawDur`, `recolor`, `cut` |
| Timeline | ruler 11 f; spans 9 f pop + `grow`; 1 s apart by default | `spans[].at` |
| Subtitle | ~0.32 s per word; flag 0.3 s after the phrase, 6 f pop | `dur`, `flag[].at` |

## ⑤ Recipes

Snippets are complete `layers[]` entries; `who` values must exist in `cast`, and `arrowTo` / nameplate `who` name a bean **layer `id`** in the same shot.

**Character intro.** Name, tag and arrow on the empty side.
```json
{"type": "label", "tag": "DICTATOR", "text": "JULIUS CAESAR", "x": 0.28, "y": 0.36, "at": 0.8, "arrow": "down-right", "size": 88}
```

**Cold open with date and era.**
```json
{"type": "date", "text": "46", "suffix": "BC", "x": 0.5, "y": 0.22, "at": 0.5}
```
```json
{"type": "era", "small": "46 BC", "parts": [["ROMAN", "#e0393e"], ["REPUBLIC", "#fff"]], "x": 0.025, "y": 0.95, "at": 0.2}
```

**"20,000 soldiers."** A counter on a burst background; punch the camera at 2.4 s.
```json
{"type": "counter", "x": 0.5, "y": 0.55, "from": 0, "to": 20000, "dur": 2.2, "sep": ",", "suffix": " SOLDIERS", "size": 150, "color": "#ffe066"}
```

**"Meet Marcus, the general."** Rank plate with pronunciation and typed bullets.
```json
{"type": "doc", "kind": "nameplate", "style": "rank", "rank": "GENERAL", "name": "MARCUS", "sub": "(MAR-KUS)", "anchor": "bottom-left", "at": 0.3,
 "bullets": ["- lost three battles", "- won one argument"], "bulletEvery": 0.6}
```

**"A boy called Temujin, later Genghis Khan."** Hand-lettered name with a hook arrow to the bean layer `boy`, then the rename.
```json
{"type": "doc", "kind": "nameplate", "style": "hand", "name": "TEMUJIN", "x": 0.5, "y": 0.82, "size": 96, "at": 0.2, "arrowTo": "boy",
 "strike": {"at": 1.6, "new": "GENGHIS KHAN"}}
```

**"Twenty years later."** Black card, 2 s.
```json
{"type": "doc", "kind": "timeskip", "text": "20 YEARS LATER", "style": "black", "out": 2.0}
```

**Quote on trial (fact-check).** A TV with the speaker, karaoke subtitle with the lie flagged; next shot a `stamp` "FALSE".
```json
{"type": "doc", "kind": "tv", "who": "consul", "style": "oval", "x": 0.5, "y": 0.42, "w": 900}
```
```json
{"type": "subtitle", "x": 0.5, "y": 0.9, "text": "We have never wanted war. We want peace.", "start": 0.3, "dur": 2.6,
 "flag": [{"word": "never wanted war", "at": 3.2}]}
```

**Breaking news.**
```json
{"type": "doc", "kind": "lowerthird", "x": 0.5, "y": 0.86, "at": 0.3, "tag": "BREAKING NEWS", "headline": "SENATE VOTES ITSELF A RAISE", "ticker": "MARKETS CALM - BREAD PRICES UP - GAMES CONTINUE"}
```

**Treaty checklist.** Terms on a scroll; broken terms get a cross and a strike on their beats; a stamp ends it.
```json
{"type": "doc", "kind": "checklist", "paper": "scroll", "title": "TREATY TERMS", "x": 0.5, "y": 0.5, "scale": 0.8, "every": 0.3,
 "lines": ["No army on the river", "Pay 100 talents", "Return the hostages"],
 "checks": [{"row": 0, "at": 1.4, "mark": "x"}, {"row": 2, "at": 2.0, "mark": "check"}],
 "strikes": [{"row": 0, "at": 1.6}], "stamp": {"text": "VOID", "at": 2.6}}
```

**"The economy collapsed."** A line chart drawing to a crash, an icon on the peak and a callout at the bottom.
```json
{"type": "doc", "kind": "chart", "chart": "line", "paper": "grid", "values": [3, 5, 8, 9, 2], "labels": ["1920", "1922", "1924", "1926", "1929"],
 "yLabel": "WEALTH", "dur": 2.0, "x": 0.5, "y": 0.5, "scale": 0.85,
 "icons": [{"i": 3, "prop": "moneybag", "at": 1.6}], "callouts": [{"i": 4, "text": "OH NO", "at": 2.4}]}
```

**"He explained: war, then gold, but no castle."** Picture bubble with arrows and a strike.
```json
{"type": "doc", "kind": "pictobubble", "style": "speech", "x": 0.66, "y": 0.32, "w": 700, "h": 300, "tail": [-260, 200], "every": 0.4,
 "icons": [{"prop": "sword"}, {"arrow": true}, {"prop": "moneybag"}, {"arrow": true}, {"prop": "temple", "strike": 2.4}]}
```

**"An army of 25 legions, plus 150,000 auxiliaries."**
```json
{"type": "doc", "kind": "statstack", "main": {"value": "25", "label": "LEGIONS"},
 "lines": [{"at": 1.0, "value": "150 000", "label": "SOLDIERS"}, {"at": 2.0, "value": "150 000", "label": "AUXILIARY"}]}
```

**"Officially it was misplaced."** Paint graffiti covered and rewritten, thumbs-up.
```json
{"type": "doc", "kind": "graffiti", "text": "3 MILLION\nSTOLEN", "style": "paint", "wall": "brick", "write": {"at": 0.1, "dur": 0.8},
 "cover": {"at": 1.4, "dur": 1.1}, "rewrite": {"text": "MISPLACED!!", "at": 2.6, "perLetter": 0.12}, "thumb": {"at": 4.0}}
```

**"Let's check the speech."** Marks on the beats, verdict stamp.
```json
{"type": "doc", "kind": "scorecard", "title": "The Speech", "x": 0.68, "y": 0.42, "scale": 1.25,
 "marks": [{"row": 0, "col": "false", "at": 0.4}, {"row": 1, "col": "false", "at": 0.8}, {"row": 2, "col": "true", "at": 1.2}],
 "verdict": {"text": "FALSE", "at": 2.6}}
```

**"The prisoners became a menu."**
```json
{"type": "doc", "kind": "list", "paper": "scroll", "x": 0.5, "y": 0.5, "scale": 1.3, "title": "PRISONERS", "items": ["Theseus", "Pirithous", "a goat"],
 "pencil": true, "strike": [{"item": "title", "at": 1.8}], "retitle": {"text": "MENU", "at": 2.3}, "ticks": [{"item": 2, "at": 3.0}]}
```

**"The times it fell apart: four."** A hanging counter over the map, swapped on the beat.
```json
{"type": "doc", "kind": "hangsign", "title": "TIMES IT FELL APART", "num": 3, "swap": {"at": 1.4, "num": 4}, "x": 0.78, "y": 0.4, "scale": 0.7}
```

**"Three wars in the time of one."** Spans 0.8–1 s apart, the long one grows, the pointer travels.
```json
{"type": "timeline", "x": 0.5, "y": 0.27, "from": 500, "to": 2000,
 "spans": [{"from": 1337, "to": 1453, "label": "100 YEARS WAR", "at": 0.6}, {"from": 1568, "to": 1648, "label": "80 YEARS WAR", "at": 1.4},
           {"from": 711, "to": 1492, "label": "RECONQUISTA", "color": "#2e9e48", "at": 2.4, "grow": 0.8}],
 "pointer": {"from": 500, "year": 711, "at": 3.4, "dur": 1.2}}
```

## ⑥ Limits and pitfalls

- **Validation stops at the kind.** `spec.py` checks the layer type, the `doc` kind and that `label`, `title`, `caption` and `date` have non-empty `text`; it does not check doc fields. Wrong enums in `cards.js` kinds throw at render; wrong values in the other kinds silently fall back (an unknown `bubble` `style` draws a speech bubble, an unknown `chart` draws a line). Render stills of new cards.
- **Set the text of every card.** Defaults are placeholders (`NAME`, `HEADLINE`, `BANNER`, `SURVIVE`, `711`, `9 MONTHS LATER`, `TEXT`, `RELOCATED!!`, `999999`); `hangsign` without a `title` prints `TIMES IT HAPPENED`.
- **Layer `id` vs cast id.** `nameplate` `who` (head anchor) and string `arrowTo` look up a bean **layer** `id` in the same shot, not a `cast` key. A missing layer silently drops the anchor / arrow.
- **`timeskip` `black` paints a full-frame card** over every layer listed before it; keep it alone in a short shot, or last in `layers` with an `out`.
- **`band` `y` is not the layer position.** It is the band's top edge as a frame fraction and the band ignores the layer `x`/`y` while screen-locked.
- **`statstack` and `nameplate` `bottom-left`** only anchor when both `x` and `y` are unset; setting either switches to free placement.
- **`hangsign` `swap` is the sign's own `{at, num}` object**, not the common list-form `swap` field (which needs a list). Use one or the other on a layer.
- **Bubbles with `who`** draw a full bean clipped to the bubble; keep `h` ≥ 240 so the face reads.
- **`pictobubble` `scene`** renders another shot: nesting is limited to two levels, and a shot must not show itself.
- **`crayon` `paper` is a colour**, unlike `list` `paper`, which is the `sheet` / `scroll` enum.
- **`subtitle` matching** needs the flagged words consecutive in the text; punctuation and case are ignored. With `words`, flags still match on `w`.
- **`counter` `sep` defaults to a space** ("20 000"); pass `","` for "20,000".
- **Fonts.** Only Rubik 800 and 900 are bundled (`Rubik-800`, `Rubik-900`); glyphs Rubik lacks fall back to Arial Black / sans-serif.
- **Game-screen cards** (`versus`, `menu`, `slides`, …) and the `hud` widgets live in [07 Game UI](07_game_ui.md); `card`, `sign` and `calendar` are documented in [03-spec-reference](../03-spec-reference.md).
