# 07 · Graphics: documents, UI, timeline, subtitles and map v3

These devices come from the reference library: fact-check shows, war and dynasty histories, myth retellings. Modules: `docs.js`, `docs2.js`, `hud.js`, `mapx.js` and `mapx2.js`. Vocabulary: `scripts/vocab/docs.json`, `scripts/vocab/mapx.json`. Showcase: [examples/v3_graphics/spec.json](../examples/v3_graphics/spec.json).

Times inside a layer are layer-local: they count from the layer's `at`. Every `doc` kind animates its own entrance, so the layer default `enter` is `none`. All common layer fields (`x`, `y`, `scale`, `rot`, `move`, `bob`, `out`, …) still apply.

## `doc` layer

`{ "type": "doc", "kind": "<kind>", ... }`

| Kind | Fields (defaults) | Notes |
| --- | --- | --- |
| `newspaper` | `masthead`, `date`, `headline`, `subhead`, `photo: {who \| color, bg}`, `w` 760, `h` 980, `grayscale`, `color` | Pops in. Column lines fill the page. Tilt it with `rot`. |
| `document` | `title`, `titleColor`, `lines: [...]`, `paper: "sheet"\|"scroll"`, `every` (line reveal step), `lineSize` 44, `rowH` 74, `checks: [{row, at, mark: "check"\|"x", color}]`, `strikes: [{row, at, color}]`, `stamp: {text, at, color, size}`, `minimap: {color}`, `w` | A tick or cross draws itself in 0.2 s. Strikes are hand-drawn red lines (0.25 s). |
| `checklist` | same as `document`, with check boxes always on | Treaty terms, demands, to-do lists. |
| `stamp` | `text` ("APPROVED"), `color` `#c8141c`, `size` 110, `tilt` −12 | Slams in from 1.6 to 1 over 3 frames, with a 0.25 s shake. Double border. |
| `chart` | `chart: "line"\|"bar"`, `values`, `labels`, `yLabel`, `color` (an array for bars), `dur` 1.5, `paper: "grid"`, `arrowEnd`, `icons: [{i, prop, at, dy, size}]`, `callouts: [{i, text, at, dy, w}]` | Hand-drawn axes with arrowheads. Lines draw progressively; bars pop one by one. |
| `idcard` | `name`, `sub`, `line`, `who`, `header`, `band`, `color`, `tilt` −8 | Slides in from the left. The portrait is a bust of a `cast` member. |
| `poster` | `title` ("WANTED"), `name`, `sub`, `who`, `duotone: [dark, light]`, `tilt` 2 | Duotone portrait, pinned corners. Also works as propaganda. |
| `quote` | `who`, `text`, `author`, `size` 50, `dur` 0.8 | Grey portrait. The italic quote reveals line by line. |
| `stat` | `value` ("1.5"), `words: [...]`, `wall: "brick"\|"plaster"`, `color`, `size` 360 | A huge brush numeral on a wall. Use it for death tolls and big numbers. |
| `bubble` | `style: "speech"\|"thought"\|"shout"`, `text` (`\n` breaks a line), `w`, `h`, `tail: [dx, dy]`, `size`, `who` + `expr` (a mini scene inside), `color` | Pops 0 → 1.15 → 1. A thought bubble can hold a mini bean. |
| `tv` | `style: "oval"\|"modern"`, `w` 900, `who`, `talk`, `expr`, `view`, `text`, `grayscale` (true), `screen`, `color` | Retro oval TV: extruded shell, antennas, LEDs, scanlines. Use it for the "quote on trial" device. |
| `yearsign` | `text` ("YEAR"), `num`, `strike: {at, num}`, `splash`, `tilt` −14, `w` | A wooden plank on a post that drops in, with a water splash. `strike` crosses out the number and pops in the new one. |
| `hangsign` | `title`, `num`, `swap: {at, num}`, `w`, `h` | A counter board on ropes. It drops in, swings and settles. `swap` crosses out the old digit and slaps on a new card. |
| `nametag` | `name`, `header` ("HELLO"), `sub` ("MY NAME IS"), `color`, `tilt` | Stick it on anything, including a statistic. |
| `ribbon` | `text`, `color`, `textColor`, `w` 1100, `h`, `size` | A banner with folded tails that unrolls. |
| `lowerthird` | `tag` ("BREAKING NEWS"), `headline`, `ticker`, `color` | Screen-locked (`hud`). Slides in from the left; the ticker scrolls. Place it at `y` 0.86. |
| `mission` | `small` ("MISSION:"), `word`, `color`, `size` 220 | A small grey line plus a huge bevelled word that punches in from 1.3 to 1. Use it for chapter cards. |

## `timeline` layer (screen-locked)

`{ "type": "timeline", "y": 0.25, "from": 500, "to": 2000, "w": 0.84, "prefix": "YEAR", "spans": [...], "marks": [...], "pointer": {...} }`

- `spans: [{from, to, label, color, at, row, grow}]`: rounded bars pop in and grow along the ruler. `row` stacks them; the default stacks three rows.
- `marks: [{year, label, color, at}]`: dots on the ruler.
- `pointer: {from, year, at, dur, suffix, color}`: the time-machine pointer. It slides and shows the current year.
- `panel: false` removes the dark backing; `labels: {"500": "..."}` renames the end labels.
- Set `hud: false` to let the camera move it.

## `subtitle` layer (screen-locked)

`{ "type": "subtitle", "y": 0.9, "text": "...", "start": 0.3, "dur": 2.6, "fill": "#7fe08a", "base": "#fff", "flag": [{"word": "never wanted war", "color": "#ff2a2a", "at": 3.2}], "size": 54, "maxW": 0.82 }`

- Words fill one by one. Timing is weighted by character count over `[start, start + dur]`.
- Pass `words: [{w, at}]` for exact timings from a transcript.
- `flag` turns a word or phrase red with a small pop, by default 0.3 s after its last word fills. This is the fact-check device: the quote plays, then the lie lights up.

## Map v3 (`type: "map"`)

All earlier fields still work: `image`, `land`, `regions` with `pts`/`at`/`dur`/`out`/`pulse`, `pins`, `routes`, `armies`, `extrude`.

| Field | Meaning |
| --- | --- |
| `style: "parchment"\|"atlas"` | `atlas` is the flat political map: blue sea `#5b72d6`, coastal halo, tan land with a fine dot pattern, thick dark borders, low extrusion. |
| `regions[].id` | Name used by `conquer.by` and `crosses.region`. |
| `regions[].color`, `border`, `borderWidth` | Fill and border. |
| `regions[].halftone` | Neutral region with a dot pattern (non-aligned countries). |
| `regions[].from: [x, y]` | Grow from this point instead of the centroid. |
| `regions[].recolor: {color, at, dur}` | Crossfade to a new colour (an era change, a region turning black). |
| `regions[].conquer: {by, at, dur, from, mood}` | The attacker's colour floods in from its centroid. `by` is a region id or a colour. The victim's face squashes and switches to `mood` (default `cry`). |
| `regions[].whiteout: {at, dur, rim}` | Annexed state: the region fades to white with a cyan rim. |
| `regions[].face: {mood, at, accessory, scale}` | A living region. `mood` is `neutral\|happy\|angry\|sad\|worried\|cry\|shock\|smug\|strain\|sleepy` (or a `[{at, v}]` timeline). `accessory` is `sunglasses\|crown\|tear\|bandage`. Use `faceOffset: [dx, dy]` to move the face. |
| `regions[].arms: {weapon, at, swing, sides, size}` | Tube arms holding any prop (`sword`, `spear`, `torch`, …), swinging on twos. |
| `regions[].label` | A string or `{text, at, size, color, dy, tilt}`. |
| `regions[].strikeLabel: {old, new, at, color}` | The old name is struck out in red and the new name written below. |
| `fronts: [{pts, at, dur, color, width, jag}]` | A jagged front line that advances along its path. |
| `tokens: [{icon, pts, at, dur, size, bob, count, every, color}]` | Icons travel along a path: `ship`, `train`, `helmet`, `tank`, `mug`, `pawn`, `army`, `flag`, `castle`, `dome`, `pagoda`, `house`, `cross`. Copies are staggered by `every`; they mirror to their heading and bob. |
| `cities: [{x, y, icon, at, size, burning, label}]` | City icons pop in. `burning: <time>` lights flipbook fire on them. |
| `crosses: {region \| pts, at, dur, count, size, color}` | Grave crosses pop in until the region is tiled, for death tolls. |
| `punch: {x, y, at, size, cracks}` | A black star hole with radial cracks, for a fist through the map. |
| `rivers: [{pts, at, dur, color, width}]` | A cyan line grows along its path (canals, rivers). |
| `pencil: {pts, at, dur, color, width}` | A pencil sprite draws a border, with sparks at the end. |
| `wall: {pts, at, dur, segments, color, height}` | A crenellated wall strip snaps in segment by segment (the Great Wall, a frontier wall). |
| `yearLabel: {text, at, x, y, size, color, tilt}` | A big stamped year. |
| `desaturate: {at, dur, strength}` | The whole map fades to grey (end of a period). |

## Recipes

1. **Quote on trial (fact-check).** Use an interior background with a `doc: tv` holding the speaker (`talk`, grayscale). Add a `subtitle` of the quote (`start` 0.3, `dur` ≈ word count × 0.3) with a `flag` on the false phrase. Cut to an explainer, then back to a `stamp` reading "FALSE" or "MISLEADING".
2. **Annexation.** Use an `atlas` map. The neighbour gets a worried `face`; the aggressor gets a smug face and sunglasses. Then `conquer: {by}` 0.8 s, then `strikeLabel` old → new, then `whiteout` on the next victim. Hold for 1 s.
3. **Dynasty switch.** The old region `recolor`s to the new dynasty colour. Add a `yearLabel` plus a `ribbon` with the dynasty name. If chaos repeats, use a `hangsign` with `swap` (the "times it fell apart" counter).
4. **Front-line advance / invasion.** Use `fronts` (1.5–2 s) together with `tokens` of `helmet` (`count` 3–5, `every` 0.3) along the attack path. Add `cities` with `burning` as the front passes them.
5. **Invasion fleet.** Use `tokens` of `ship` with `count` 4–6 and `every` 0.35 from the sea to the coast. The target region then gets a `recolor` and burning `cities`.
6. **Death toll.** Use `crosses` over the region (60–120, 1.5 s), then cut to a `doc: stat` with the number on a brick wall. Hold it silent. Prefer these stand-ins to showing death.
7. **Breaking news.** Use a `doc: tv` with `style: "modern"` and a talking presenter, plus a `doc: lowerthird` with a headline and ticker. For "what each side said", show two tilted `doc: newspaper` layers 0.5 s apart.
8. **Treaty checklist.** Use a `doc: checklist` (`paper: "scroll"`) with the terms. Each broken term gets an `x` check plus a `strike` on its narration beat. End on a `stamp`.
9. **Economic collapse.** Use a `doc: chart` (`chart: "line"`, `paper: "grid"`) drawing over 2 s to a crash arrow. Pop a `moneybag` or `coin` icon on the peak and an "OH NO" callout at the bottom.
10. **Long span in seconds.** Use a `timeline` with three war spans popping in at 1 s intervals, then the subject's long span `grow`ing for 0.8 s and a punch zoom on the reacting character.
