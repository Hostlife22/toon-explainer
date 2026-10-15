# 08 · Map v4: views, living regions, figures and overlays

Maps carry about a third of the screen time in the reference histories. v4 adds camera-like views of the map, effects on single regions, cast characters standing on the map and many new overlays. Module: `scripts/engine/lib/mapx3.js`. Vocabulary: `scripts/vocab/mapx3.json`. Showcase: [examples/v4_map/spec.json](../examples/v4_map/spec.json), one shot per feature.

Everything from [map v3](07-graphics.md#map-v3-type-map) still works. Coordinates are normalized to the map box (`w`/`h`, default 1.1 × the frame). All times are layer time. Unknown kinds, styles or patterns throw a clear error.

## Region shapes without geodata (`regions[].blob`)

`"regions": [{"id": "eth", "blob": [0.62, 0.55, 0.08, 0.06], "color": "#c8873a"}]` draws a seeded lumpy polygon instead of hand-written `pts`. `blob` is `[cx, cy, rx, ry]` in map fractions, like `land`; it is used only when `pts` is omitted. `blobPoints` (16) sets the vertex count and `jag` (0.16) the roughness. The shape is seeded by the map `id` and the region `id` (or index), so it stays identical across shots when both are kept. Place region blobs inside a matching `land` ellipse. Blobs read as abstract territory, not real geography; use an `image` map when the outline matters.

## Views (`view`)

| Field | Defaults | Meaning |
| --- | --- | --- |
| `view: "tilt"`, `tilt: {deg, taper, vp, zoom, depth, skew, pan, panAt, panDur, shadow}` | `deg` 35, `taper` 0.78, `vp` 0.42, `zoom` 1, `depth` 12, `skew` 0 | A perspective board. `taper` is the far/near width ratio; `vp` places the far edge (0 = frame top); `depth` is the region extrusion; `skew` -0.25..0.25 turns the board; `pan: [[x0, y0], [x1, y1]]` glides the content through the perspective over the shot (eased). `shadow: false` removes the board drop shadow. Use `vp` 0–0.05 with `h` 1.3 to fill the frame (Ch 17:45), or `vp` 0.42 and a `sea` that matches the background for a floating diorama slab (Rq 1:23). |
| `view: "globe"`, `globe: {space, curve, top, stars, rim, spin, night}` | `space` 0.25, `curve` 2.2, `top` 0.15, `stars` 60, `rim` `#b9cbe4`, `spin` 0.006, `night` true | The map lies on a planet. `space` is the sky fraction above the horizon, `curve` the planet radius in frame widths, `top` the map row that sits on the horizon, `spin` the drift in map widths per second (content wraps, so keep land away from the left and right map edges). |
| `globe: {full: true, r, dy, spin, span, vspan, sea}` | `r` 0.38, `dy` 0, `span` 0.8, `vspan` 0.86 | A whole globe disc in space with a terminator on the right 35 % and a darker limb. The map width covers `span` of the visible hemisphere and its height `vspan` of the disc, so the land sits inside the sphere with sea around it (the disc is filled with the map `sea`). `dy` moves the disc down (frame fraction) to leave room for a title above it. |
| `view: "tabletop"`, `table: {color, deg, taper, zoom, vp, border, paper, curl, burnt}` | `#3a3a2e`, 28°, 0.78, 0.72, 0.13, 26, `#efe2c0`, true, false | Paper map on a war table: grain lines, cream border, folded corners, optional burnt edge. Pair with `tacks` and `hand`. |

Upright things (figures, flags, brawls, fires, forts, camps, squads, coins, barriers, drops, tacks, hand) stay upright and shrink with depth. Flat things (regions, words, arrows, trails, tracks, xmarks) are warped with the board.

## Region effects (`regions[]`)

| Field | Defaults | Timing |
| --- | --- | --- |
| `split: {at, colors, line, dur, gap, faces, fight, blob}` | `at` 1, `colors` `#e9a83a`/`#6b3a8a`, `dur` 0.2, `gap` 0, `faces` angry/angry, `blob` true | Blob of the first colour grows 4 f, a jagged crack appears in 1 f (custom `line: [[x, y], ...]` is allowed), the halves recolour over `dur`, then drift `gap` px apart (5 f outBack). Each half gets its own face. `fight` adds tube arms that punch on a 6-frame cycle with an impact star. |
| `shatter: {at, pieces, cracks, dur, spread, fall, keep, bgStreaks}` | 1, 12, 0.4, 0.5, 160, 30, false, false | White-glow crack lines grow from the centroid over `cracks`, then Voronoi pieces fly out, spin ±25° and drop over `dur`, fading in the last 4 f. `bgStreaks` shows red chaos streaks in the hole. |
| `slash: {at, stitches, wounds: [{x, y, at, size}], spill, count, mood}` | 0.5, 3, centre, `money`, 16, `strain` | Zig-zag stitches draw in 8 f each, then each wound opens in 3 f and spills `money` (dollar bills and coins), `soldiers`, `blood` (small drops) or `none` for 1 s. Wound `x`/`y` are fractions of the region's bounding box. |
| `engulf: {by, at, dur, dir}` | —, 1, 0.5, `top` | A huge circle of the attacker colour (`by` is a region id or a hex) slides in from `dir` (`top`/`bottom`/`left`/`right` or `[dx, dy]`) with an ink front. The victim face shrinks to 0.8, looks at the front and cries when it is covered. |
| `wipe: {by, from, at, dur, shape}` | —, centroid, 0, 2, `circle` | Repaint from a point: a growing `circle`, or a straight `line` edge. Era changes (3 f) or slow absorption (2 s). |
| `drift: {dx, dy, at, dur, to}` | -0.04, 0, 1, 2, `#4a4a4a` | The region slides away, then fades to grey (`to: null` keeps the colour). |
| `peel: {at, dur, lift, coins}` | 2, 0.5, 12, true | The region lifts and fades; a coin pile pops at the centroid and vanishes ("lost Africa"). |
| `conquer: {by, at, dur, pattern: "blotch", blobs, chunk, rays}` | `pattern` `flood` | `blotch`: one big chunk at `chunk: [x, y]` plus `blobs` (20) islands grow until they merge over `dur` (2 s). `rays` adds pale rotating wedges behind the nearest map figure. Works on halftone regions too. |
| `annex: {at, flashes, colors, to}` | 0.8, 2, orange/yellow, `#d0312d` | 6 f per colour, hard switches, then the final colour. Stagger regions 1 s apart for "then B, then C". |
| `damage: {at, kind}` | `black-eye` | `black-eye`, `x-eye`, `bandage`, `crack` on the region face, popping 1.3 → 1 in 2 f. It is persistent: repeat it in later shots for continuity. |
| `surrender: {at, side, size}` | 1, 1, 1 | A tube arm rises (6 f outBack) and waves a white flag on twos. |
| `fire: {at, every, size}` | 1, 60, 54 | Flipbook flames every `every` px along the border, with columns of outlined grey smoke puffs. |
| `face.mood` | | New moods `plead` (big glossy eyes, wobbly mouth), `hearts`, `pipe` (long white pipe and smoke curl), `dollar`. The other v3 moods and accessories are unchanged. |

## Overlays

| Field | Defaults | Meaning |
| --- | --- | --- |
| `figures: [{who, look, x, y, at, out, scale, pose, expr, view, flip, talk, enter, sticker, rim, shadow, hover, path, walk, paint, sit, strings, yank, id}]` | `scale` 0.32 (of frame height), `enter` `pop` | Cast beans standing on the map with a 6 px white sticker rim and a ground shadow. `enter`: `pop` (0.25 → 0.6 → 1 in 3 f), `stretch`, `drop`, `none`; `out` pops them away. `path` + `walk: [t0, t1]` walks them (they face the direction of travel). `paint: {color, every, r, clip}` lays a territory lobe every `every` frames (5) behind the walker; `clip` lists region ids. `sit`: `throne`, `deckchair`, `bed` (pose defaults to `sit`/`lie`). `hover` bobs ±3 px with no shadow. `strings` adds puppet strings and a wooden control cross kept inside the safe frame; `yank` pulls the puppet out of frame in 3 f. Figures whose head would cross the top 3.5 % safe margin are scaled down to fit (`fit: false` turns this off). |
| `arrows: [{from, to, at, out, double, label, labelSize, labelColor, color, width, bend, trim, style, pulse, draw, depth}]` | `width` 62 (`block` 72, `hook` 24), `bend` 0.06, `style` `flat` | `from`/`to` are region ids or `[x, y]`; region ends are trimmed 8 %. `label` is big white lettering with an ink rim on the shaft (`labelSize` default max(56, 1.05 × width), shrunk to fit 62 % of the shaft but never below 34 px). Pops 0 → 1.1 at f4 → 1 at f6, or grows along its path over `draw` s. `block` is a 3D arrow with white label, `hook` a hand-drawn white hook arrow. |
| `brawls: {region \| pts, at, count, every, size, out, outDur}` | 9, 0.06, 170, —, 0.6 | Fight clouds with fists, stars and grimaces pop in 2 f apart (0.3 → 0.7 → 1.12 → 1), jitter on twos and fade together. Uses `T.drawBrawl` when the FX module provides it. |
| `fires: {region \| pts, at, count, every, size, smoke, out}` | 18, 0.08, 84 | Free-standing flames scattered over a region, every third one with a rising column of outlined grey smoke puffs. |
| `trails: [{pts, at, dur, dash, color, width} \| {head: figureId}]` | 1.5 s, `[18, 12]`, `#d02020`, 6 | Dashed line drawing on; `head` follows a walking figure. |
| `tracks: [{pts, at, dur, color}]` | 0.2 s, `#3a1d14` | Railway: two rails and ties. |
| `forts: {along, count, every, at, size, icon}` | 6, 0.2, 1, 120 | Forts pop-tilt one by one along a line. |
| `camps: [{x, y, at, style, flags, color, size, move: {to, at, dur}, hop}]` | `camp`, 2, —, 230 | `palisade`, `camp` (dot soldiers), `formation` (dot block with standards), `blob` (cloud of helmets). They hop ±3 px on twos while moving. |
| `squads: [{prop \| icon, count, formation, pts, at, dur, size, hop, flagEvery, wipe: {region, to}, state: {at, v: "empty"}}]` | 4, `diamond`, 3 s, 130 | A column of props (`croissant`, `mug` …) or map icons (`icon`: `helmet` default, `ship` for a fleet …) marching in formation (`diamond`, `line`, `blob`). `wipe` repaints the region 40 px behind the lead; `state.v: "empty"` greys the tokens ("supplies ran out"). v3 `tokens` is unchanged. |
| `flags: [{x, y, at, h, color, color2, pattern, letter}]` | `h` 220 | The pole grows in 15 f, the cloth unfurls in 10 f and waves on twos. `pattern`: `disc`, `star`, `stripes`, `band`. Plain colours and initials only, no real emblems. |
| `coins: {pts, at, every, count, size, hop, apex, loop}` | 0.25, 8, 36, 0.6, 40 | Gold coins hop along the points ("trade flourished"). |
| `xmarks: [{x, y, size, at, color, width, rot}]` | 160 | Two tapered brush strokes, 3 f each. |
| `barriers: [{x, y, at, angle, len, color, flip, scale}]` | `len` 120, `scale` 1.6 | A striped arm swings down 70° in 8 f with a 2 f bounce ("closed the strait"). |
| `words: [{text, x, y, rot, skew, size, style, color, extrude, side, at}]` | −10°, −0.25, 160, `shade` | Words lying on the map plane. `shade` uses a deep tone of the region underneath; `toon` is white with ink; `extrude` is cream 3D lettering that slams 1.6 → 1. With `along: [[x, y], ...]` and `labelAt`, an italic river label (`size` 64) follows the path. |
| `drops: [{prop, x, y, at, hold, rot, size, text, puffs, out}]` | `bandage`, 1 s, −25°, 420 | The object hovers above its target, squashes for 1 frame, slams in 1 frame, settles and puffs. `bandage`, `stamp` (leaves an imprint with `text`), `foot` (900 px, red seep), or any `T.PROPS` kind. Add a layer `shake` at the slam for impact. |
| `tacks: [{x, y, at, color, size, label}]` | `#d42020`, 2.2 | Push-pins drop in 4 f with a 1-frame squash. |
| `hand: {to, at, dur, hold, sleeve, state, carry, from, size, color}` | 0.4, 1, `#4a5a3a`, `pinch`, `size` 200 | A gloved hand slides in from the nearest edge (12 f), trembles 1 px while holding, and retracts. `carry: "tack" \| "flag"` shows the item until it arrives; time a tack to land at `at + dur`. |

New map icons for `cities`, `tokens` and `forts`: `fort`, `camp`, `formation`, `factory`, `derrick`, `plane`, `church-hut`, `rubble`. `T.MAP_FACTIONS` lists the reference faction colours.

## Recipes (sentence → map)

1. **"Three rivals each held a region."** `tilt` view, `words` with `style: "toon"` on each region, one `figure` per ruler, popping 0.25 s apart, with `pose` and `expr` that set their attitude.
2. **"An empire stretching across the world."** `globe` view with a slow `spin`, the ruler figure entering with `stretch`.
3. **"The generals planned …"** `tabletop`: three `tacks` on the beat, then the `hand` places the last one.
4. **"The country split in two."** `split` with `gap` and `fight`, then cut to the two leaders.
5. **"It broke into dozens of states."** `shatter` (pieces 12–20), hold the empty land 1 s.
6. **"Bled money from the inside."** `slash` with `spill: "money"`, face `strain`.
7. **"Swallowed by its neighbour."** `engulf` from the attacker's side, 0.5 s.
8. **"The idea spread."** `conquer` with `pattern: "blotch"` and `rays` behind the leader figure.
9. **"Then they took B, then C."** `annex` on each region 1–1.5 s apart.
10. **"Got beaten / gave up / burned."** `damage`, `surrender`, `fire`; keep `damage` in the following shots.
11. **"He conquered region after region."** A walking `figure` with `paint` and a `trails` head.
12. **"X declared war on Y."** `arrows` with `double` and `label: "WAR"`, cascading 1.2 s apart.
13. **"Chaos, everyone fought."** `brawls`, then `out` to leave the empty land for 2 s.
14. **"Built forts along the river."** `rivers` + river `words` (`along`) + `forts`.
15. **"The army marched in."** `squads` with `wipe`; `camps` with `move` for sieges.
16. **"Patched up / crushed."** `drops` with `bandage`, or `foot` plus a layer `shake`.

Scale: the reference keeps map words and tokens big, labels and icons about 20–25 % of the frame width. The defaults above follow that; do not shrink labels below about 30 px. Region labels default to 46 px (`regions[].label: {text, size, dy}`). In `view: "tilt"` they shrink toward the far edge and neighbours collide, so raise far labels to 54–64 and separate close ones with `dy`.

Timing: hold-and-snap. Pops use stepped frames, not tweens; let each map beat hold 0.5–1 s before the next action.
