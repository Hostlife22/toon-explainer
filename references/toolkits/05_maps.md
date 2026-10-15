# 05 · Maps
In a word: a living map that carries the exposition spine of a history film: territories grow, get conquered, split, shatter and grow faces; armies, fleets, fronts, arrows and rulers move across it, seen flat, tilted, on a globe or on a war table.

Engine: `scripts/engine/lib/maps/map.js` (layer, styles, land, regions, faces, labels), `scripts/engine/lib/maps/map-overlays.js` (base overlays, `T.MAP_ICONS`), `scripts/engine/lib/maps/map-views.js` (views, region effects, figures and the other overlays) · Vocabulary: `scripts/vocab/maps.json`, `scripts/vocab/map-views.json`, `scripts/vocab/maps-hair.json` (`map_icon`, `map_view`; map fields themselves are checked by the engine, not by `spec.py`) · Example films: [`examples/living_maps/spec.json`](../../examples/living_maps/spec.json) (one shot per feature) and [`examples/paper_and_maps/spec.json`](../../examples/paper_and_maps/spec.json) (shots `g09`, `g14`, `g15`); render with `--sheet` to browse · Related cards: [01 Characters](01_characters.md) (cast beans used as map `figures`), [03 Props, creatures and vehicles](03_props_creatures_vehicles.md) (props for `arms`, `squads`, `drops`), [06 Paper and lettering](06_paper_and_lettering.md) (`yearsign`, `hangsign`, `ribbon` over a map), [08 FX and tone](08_fx_and_tone.md) (flames, smoke, brawl clouds), [09 Transitions and lens](09_transitions_and_lens.md) (zoom into a region, `punch`). Shared layer fields: [03-spec-reference](../03-spec-reference.md); map spine method and pacing: [07-story-craft](../07-story-craft.md).

## ① When to use it

| The narration says… | Feature |
|---|---|
| "This is where it all began" (establish) | `map` + `land` + `pins` / `cities`, slow `camera.zoom` drift |
| "Three rivals each held a region" | `view: "tilt"`, `words` `style: "toon"`, one `figures` entry per ruler 0.25 s apart |
| "An empire stretching across the world" | `view: "globe"` with slow `spin`, ruler figure `enter: "stretch"`; or `globe.full` |
| "The generals planned…" | `view: "tabletop"`, `tacks` on the beats, then `hand` places the last one |
| "The kingdom grew" | region `at` + `dur` (grow from the centroid or `from`) |
| "A new dynasty took over" | region `recolor` + `yearLabel` (+ `ribbon` doc, card 06) |
| "X conquered Y" | region `conquer` (`by` a region id), victim face switches to `cry` |
| "The idea spread" | `conquer` `pattern: "blotch"` + `rays` behind the nearest figure |
| "Then they took B, then C" | `annex` on each region 1–1.5 s apart |
| "Annexed and erased" | `whiteout` (white with a cyan rim) |
| "Swallowed by its neighbour" | `engulf` from the attacker's side |
| "Era change", "slowly absorbed" | `wipe` (3 f for an era cut, 2 s for absorption) |
| "Drifted away", "lost Africa" | `drift`, `peel` (coin pile) |
| "The country split in two" | `split` with `gap` and `fight` |
| "It broke into dozens of states" | `shatter` (`pieces` 12–20), hold the empty land 1 s |
| "Bled money from the inside" | `slash` with `spill: "money"`, face `strain` |
| "Got beaten / gave up / burned" | `damage`, `surrender`, region `fire`; repeat `damage` in later shots |
| "Renamed itself" | region `strikeLabel` |
| "X declared war on Y" | `arrows` `double: true`, `label: "WAR"`, cascading 1.2 s apart |
| "The front advanced" | `fronts` 1.5–2 s + `tokens` `helmet` |
| "The fleet sailed" | `tokens` `ship`, `count` 4–6, `every` 0.35 |
| "The army marched in" | `squads` with `wipe`; `camps` with `move` for sieges |
| "He conquered region after region" | walking `figures` (`path`, `walk`, `paint`) + `trails` `head` |
| "Chaos, everyone fought" | `brawls`, then `out` to leave the land empty for 2 s |
| "They raced each other to the sea, fighting all the way" | `fights` (a brawl cloud travelling along a `path`) with `drops` `flag` and `trail` |
| "The land burned" | `fires` overlay, `cities` `burning` |
| "Millions died" | `crosses` over the region, then a `stat` doc; never bodies |
| "Built forts along the river" | `rivers` + river `words` (`along`) + `forts` |
| "Built the railway / the wall" | `tracks`; `wall` |
| "Drew a new border" | `pencil` |
| "The border shifted", "a straight line became a front" | `morphs` |
| "Hurled its army at the neighbour" | region `face` + `throws` (`icon` `army`, `count` 3) |
| "It left a trail of destruction / planted flags / spread the infection" | `drops` on the mover (`tokens`, `figures` with `path`, `squads`, `routes`, ...) — blasts turning to smoke, `flag`, `dot` |
| "Trade flourished" | `coins` hopping along a route |
| "Closed the strait" | `barriers` |
| "Planted their flag" | `flags` |
| "That plan failed" | `xmarks` |
| "Patched up", "crushed" | `drops` `bandage` / `foot` + layer `shake` |
| "Smashed through" | `punch` + `camera.punch` |
| "The period ended" | `desaturate` |

## ② Look and staging rules

- **Two styles.** `parchment` (default): pale blue sea with wave marks, warm land slab with a 7 px extrusion and a light coastal glow. `atlas`: flat political map, blue sea `#5b72d6`, coastal halo, tan land with a fine dot pattern, thick dark borders, 3 px extrusion. Every region is a slab with one flat darker side tone (shade −0.42) and a dark ink border, like the rest of the toolkit.
- **Faction colours.** Use saturated flat colours per side; `T.MAP_FACTIONS` lists the reference set: red `#d52a2a`, purple `#a43fd6`, green `#3aa33a`, lime `#3ad13a`, orange `#f08a2c`, navy `#1d2a5a`, yellow `#f2c43a`, grey `#9a9a98`, cyan `#7fd6ea`, black `#1a1210`. Neutral land: `halftone`.
- **Scale that reads.** Map words, tokens, labels and icons stay big: about 20–25 % of the frame width for words, never below about 30 px for any label. Region labels default to 64 px. In `view: "tilt"` far labels shrink and neighbours collide: raise far ones to 54–64 and separate close ones with `dy`.
- **Coordinates.** Everything is normalized to the map box: `w` × `h` of the frame (default 1.1 × 1.1, so the map bleeds past the frame). The box is centred on the layer `x`/`y`. Arrow ends and wound positions are the exceptions noted in ③.
- **Present at the cut.** Regions grow over 1.2 s by default. A region that should already be there at frame 0 needs `"dur": 0.001` (all `living_maps` shots do this).
- **Hold and snap.** Pops use stepped frames, not tweens; let each map beat hold 0.5–1 s before the next action. A map spine changes something every 1.5–3 s (see [07-story-craft](../07-story-craft.md)).
- **Upright vs flat under a view.** With `view` set, flat things (regions, land, `words`, `arrows`, `trails`, `tracks`, `xmarks`, `rivers`, `fronts`, `routes`, `cities`, `crosses`, `armies`, `tokens`, `punch`, `pencil`, `pins`, `yearLabel`, `morphs`, `throws`) are warped with the board. Upright things (`figures`, `flags`, `brawls`, `fights`, `fires`, `forts`, `camps`, `squads`, `coins`, `barriers`, `drops`, `tacks`, `hand`) stand up, shrink with depth and are drawn over the board.
- **Figures.** Cast beans on a map wear a 6 px white sticker rim and a ground shadow, and are scaled down automatically so the head stays inside the 3.5 % safe margin at the top.
- **Real geography.** `blob` regions and `land` ellipses read as abstract territory. When the outline matters, supply `image` (a parchment-style map PNG) and draw regions over it with `pts`.
- **Symbols.** Flags use plain colours, simple patterns and initials only: no real emblems, logos or extremist symbols. Casualties are crosses, fires and statistics, never bodies.

## ③ Field reference

Layer: `{ "type": "map", ... }`. Default `enter` is `none`. All common layer fields (`x`, `y`, `scale`, `rot`, `move`, `shake`, `out`, `alpha`, …) apply to the whole map. Times inside the layer are layer-local (they count from the layer `at`). Unknown views, styles, patterns, shapes, formations or region ids throw a clear error at render time.

### ③.1 Map body

| Field | Default | Effect |
|---|---|---|
| `style` | `parchment` | `parchment` or `atlas` (anything else falls back to `parchment`) |
| `w`, `h` | 1.1, 1.1 | Map box size in frame widths / heights |
| `image` | none | Path to a map picture drawn over the whole box (replaces sea, waves and `land`) |
| `sea` | parchment `#8fa8d8`, atlas `#5b72d6` | Sea fill |
| `waves` | parchment 26, atlas 0 | Number of seeded wave marks |
| `land` | `[]` | `[[cx, cy, rx, ry], …]` seeded lumpy islands (map fractions) |
| `landColor` | parchment `#e3b964`, atlas `#d4bd7a` | Land fill |
| `coast` | parchment pale blue glow, atlas `#9db0ef` | Coastal halo colour |
| `dots` | true (atlas only) | `false` removes the atlas dot pattern on land |
| `extrude` | parchment 7, atlas 3 | Slab depth in px for land and regions (`tilt.depth` overrides it) |
| `id` | `"map"` | Seeds `blob` region shapes; keep it (and region ids) to repeat the same shapes across shots |
| `regions` | `[]` | Territories, see ③.3 |
| `desaturate` | none | `{at 0, dur 0.5, strength 1}`: the whole map fades to grey |
| `view` | none | `tilt`, `globe` or `tabletop`, see ③.2 |

### ③.2 Views (`map_view`)

| View | Options object and defaults | Effect |
|---|---|---|
| `tilt` | `tilt: {deg 35, taper 0.78, vp 0.42, zoom 1, depth 12, skew 0, pan, panAt 0, panDur, shadow true}` | Perspective board. `deg` 0–75, `taper` (far/near width ratio) 0.2–1, `vp` puts the far edge at that frame height (0 = top), `depth` is region extrusion, `skew` −0.25..0.25 turns the board, `pan: [[x0, y0], [x1, y1]]` (map fractions) glides the content eased in-out over `panDur` (default: shot length minus layer `at`, at least 0.5 s), `shadow: false` drops the soft board shadow. `vp` 0–0.05 with `h` 1.3 fills the frame; `vp` 0.42 with a `sea` that matches the background gives a floating diorama slab |
| `tabletop` | `table: {color "#3a3a2e", deg 28, taper 0.78, zoom 0.72, vp 0.13, skew, pan, panAt, panDur, border 26, paper "#efe2c0", curl true, burnt false}` | Paper map on a war table: wood grain lines, cream paper border (`border` px), folded corners (`curl`), optional burnt edge. Pair with `tacks` and `hand` |
| `globe` | `globe: {space 0.25, curve 2.2, top 0.15, stars 60, rim "#b9cbe4", spin 0.006, night true}` | Map on a planet curving under a sky. `space` = sky fraction above the horizon, `curve` = planet radius in frame widths, `top` = map row on the horizon, `spin` = drift in map widths per second (content wraps), `night: false` = pale day sky without stars |
| `globe` + `full` | `globe: {full: true, r 0.38, dy 0, span 0.8, vspan 0.86, sea, stars, rim, spin}` | A whole disc in a starry sky with a terminator on the right 35 % and a darker limb. `r` radius (frame heights), `dy` moves it down to leave room for a title, `span` (0.4–1) and `vspan` (0.4–1) are how much of the visible hemisphere the map covers; the disc is filled with `sea` (default: the map sea) |

### ③.3 Regions: shape, look, lifecycle, labels

`regions: [{ … }]`, drawn in list order (later on top).

| Field | Default | Effect |
|---|---|---|
| `id` | none | Name used by `conquer.by`, `engulf.by`, `wipe.by`, `arrows`, `crosses.region`, `brawls.region`, `fires.region`, `squads.wipe.region`, `figures.paint.clip`; also seeds `blob` and effects |
| `pts` | required unless `blob` | `[[x, y], …]` polygon in map fractions, drawn smooth |
| `blob` | none | `[cx, cy, rx, ry]` seeded lumpy polygon, used only when `pts` is omitted; seeded by map `id` + region `id` (or index) |
| `blobPoints`, `jag` | 16, 0.16 | Blob vertex count and roughness |
| `color` | `#c8323a` | Fill |
| `border` (alias `ink`), `borderWidth` | atlas `#2a1c15`, parchment darker fill; width atlas 5, parchment 6 | Border colour and width |
| `halftone`, `dotColor` | false | Neutral land with a dot pattern (non-aligned countries); ends when `recolor` starts |
| `at`, `dur` | 0, 1.2 | Grows as a circle from the centroid (outCubic) |
| `from` | centroid | `[x, y]`: grow from this point instead |
| `out`, `outDur` | none, 0.5 | Fade the territory away |
| `pulse` | false | Glowing, breathing rim |
| `recolor` | none | `{color, at 1, dur 0.8}` crossfade to a new colour |
| `conquer` | none | `{by, color, at 1, dur 0.8, from, mood "cry", pattern "flood", blobs 20, chunk, rays}`. `by` is a region id or a hex (`color` when `by` is unset). `flood`: the attacker colour grows from the attacker centroid (or `from`); the victim face squashes to 70 % and switches to `mood`. `blotch` (`dur` 2): one big chunk at `chunk: [x, y]` plus `blobs` islands grow until they merge; `rays` adds pale rotating wedges behind the nearest figure; works on halftone regions |
| `whiteout` | none | `{at 1, dur 0.5, rim "#50c8c8"}` annexed state: fades to white with a cyan rim |
| `label` | none | String or `{text, at, size, color "#fff", dy, tilt}`; pops at `label.at` (default region `at`); sits `1.9 × size` above the centroid when the region has a face |
| `labelSize` | 46 (64 on effect regions) | Label size when `label` is a string |
| `strikeLabel` | none | `{old, new, at 1, color}`: old name struck in red, new name (gold by default) written below at −4° |

### ③.4 Regions: living states and effects

Any of these keys (or a face mood `plead`, `hearts`, `pipe`, `dollar`, or a `squads.wipe` aimed at the region) switches the region to the effect renderer; base fields from ③.3 still apply.

| Field | Defaults | Effect |
|---|---|---|
| `face` | `{mood "neutral", at 0, accessory, scale 0.32}` | A face at the centroid, sized `scale` × the smaller bbox side. `mood` is a name or a `[{at, v}]` timeline; see ③.5 |
| `faceOffset` | `[0, 0]` | Moves face and arms by fractions of the region bbox |
| `arms` | `{weapon, at 0, swing true, sides [-1, 1], size 130}` | Tube arms holding any `T.PROPS` kind (`sword`, `spear`, `torch`, …), swinging on twos (`swing: false` holds still); `sides: [1]` for one arm |
| `damage` | `{at 0, kind "black-eye"}` | `black-eye`, `x-eye`, `bandage`, `crack` on the face, popping 1.3 → 1.15 → 1. Persistent: repeat it in later shots for continuity |
| `surrender` | `{at 1, side 1, size 1}` | A tube arm rises (6 f outBack) and waves a white flag on twos; `side: -1` = left |
| `fire` | `{at 1, every 60, size 54}` | Flipbook flames every `every` px along the border, every fifth with an outlined grey smoke column |
| `annex` | `{at 0.8, flashes 2, colors ["#ff8a1a", "#ffd23a"], to "#d0312d"}` | 6 f per colour, hard switches, then the final colour |
| `wipe` | `{by "#c3161f", from centroid, at 0, dur 2, shape "circle"}` | Repaint from a point: growing `circle` or straight `line` edge; `by` is a region id or a hex |
| `engulf` | `{by "#d0312d", at 1, dur 0.5, dir "top"}` | A huge attacker-coloured circle slides in from `dir` (`top`, `bottom`, `left`, `right` or `[dx, dy]`) with an ink front; the face shrinks to 0.8, looks at the front and cries when covered |
| `drift` | `{dx -0.04, dy 0, at 1, dur 2, to "#4a4a4a"}` | Slides away (map fractions), then fades to grey over 0.3 s; `to: null` keeps the colour |
| `peel` | `{at 2, dur 0.5, lift 12, coins true}` | Lifts and fades; a coin pile pops at the centroid and vanishes |
| `split` | `{at 1, colors ["#e9a83a", "#6b3a8a"], line, dur 0.2, gap 0, faces ["angry", "angry"], fight false, blob true}` | First-colour blob grows 4 f (`blob: false` skips it), jagged crack (custom `line: [[x, y], …]`), halves recolour over `dur`, drift `gap` px apart (5 f outBack); each half gets a face from `faces` (falsy = none); `fight` adds punching tube arms on a 6-frame cycle with impact stars |
| `shatter` | `{at 1, pieces 12, cracks 0.4, dur 0.5, spread 160, fall 30, keep false, bgStreaks false}` | Glowing crack lines grow over `cracks` s, then Voronoi pieces fly out `spread` px, spin ±25° and drop `fall` px over `dur`, fading in the last 4 f (`keep` leaves them); `bgStreaks` shows red chaos streaks in the hole |
| `slash` | `{at 0.5, stitches 3, wounds [{x 0.5, y 0.55, at, size 1}], spill "money", count 16, mood "strain"}` | Zig-zag stitches draw 8 f each; each wound (x/y = fractions of the region bbox; default `at` right after the stitches, then +0.3 s each) opens in 3 f and spills `money` (bills and coins), `soldiers` (helmets), `blood` (small drops) or `none` for about 1 s; the face switches to `mood` |

### ③.5 Faces

| Moods (`face.mood`) | Accessories (`face.accessory`) | Damage (`damage.kind`) |
|---|---|---|
| `neutral`, `happy`, `angry`, `sad`, `worried`, `cry` (falling tear), `shock`, `smug`, `strain`, `sleepy`, `plead` (big glossy eyes, wobbly mouth, tear), `hearts` (beating heart eyes), `pipe` (long white pipe with a smoke curl), `dollar` (green `$` eyes, open grin) | `sunglasses`, `crown`, `tear`, `bandage` | `black-eye`, `x-eye`, `bandage`, `crack` |

Faces blink every 3.3 s (except the four special moods). A conquered region forces `conquer.mood`; a slashed one forces `slash.mood`.

### ③.6 Overlays

Each overlay is a map field. Draw order (later on top): `rivers`, `wall`, `fronts`, `routes`, `cities`, `crosses`, `armies`, `tokens`, `punch`, `pencil`, `pins`, `yearLabel`, `morphs`, `throws`, `tracks`, `trails`, `words`, `xmarks`, `arrows`, `camps`, `forts`, `squads`, `coins`, `barriers`, `flags`, `fires`, `figures`, `brawls`, `fights`, `tacks`, `drops`, `hand`. "List" means an array; "one or list" accepts a single object too.

**Lines and borders**

| Field | Shape | Defaults and effect |
|---|---|---|
| `rivers` | list `{pts, at 0, dur 1.2, color "#30c8e8", width 10}` | A line grows along the path (rivers, canals) |
| `fronts` | list `{pts, at 0, dur 1.5, color "#d0312d", width 10, jag 14}` | Jagged front line advancing along the path, ink-rimmed |
| `routes` | list `{pts, at 0, dur 1.2, color "#c8323a"}` | Dashed 12 px route that draws on, dashes crawling |
| `trails` | list `{pts, at 0, dur 1.5, dash [18, 12], color "#d02020", width 6}` or `{head: figureId}` | Dashed line drawing on; `head` follows a walking figure's `path` |
| `tracks` | list `{pts, at 0, dur 0.2, color "#3a1d14"}` | Railway: two rails and ties |
| `pencil` | object `{pts, at 0, dur 1.5, color "#1d1410", width 8}` | A pencil sprite draws a border; sparkles for 0.6 s at the end |
| `wall` | object `{pts, at 0, dur 1.2, segments 24, color "#8a8a88", height 22}` | Crenellated strip snapping in segment by segment, a tower every third |
| `morphs` | list `{from: [[x, y], …], to: [[x, y], …], at 0, dur 0.6, color "#2a1c15", width 6, dash false}` | Holds the `from` line, then morphs it into `to` (in-out, stepped on twos). Lists of different lengths are resampled by arc length to the longer count. `dash: true` uses `[3w, 2w]`, or pass an array |

**Markers and lettering**

| Field | Shape | Defaults and effect |
|---|---|---|
| `pins` | list `{x, y, at 0, label, color "#c8323a", size 48, style}` | Pulsing dot, or `style: "drop"` map pin; `size` is the label size |
| `cities` | list `{x, y, icon "castle", at 0, size 90, burning, label, color}` | Map icon pops in; `burning: <time>` lights a flipbook fire from that time; `label` in 36 px; `color` tints the icons that take one (`pawn`, `cross`, `flag`, `army`, `fort`, `camp`, `formation`) |
| `crosses` | object `{region \| pts, at 0, dur 1.5, count 60, size 34, color "#f2efe8"}` | Grave crosses pop (0.15 s each), back to front, until the area is tiled |
| `throws` | list `{from: [x, y], to: [x, y], icon "army", size 70, count 1, every 0.12, at 0, windup 0.3, dur 0.37, arc 0.25, impact true, spin true}` | Each copy (started `every` s apart) winds up at `from` for `windup` (pulls back and squashes, 9 f), flies a parabola for `dur` (11 f) peaking `arc` × the distance above the straight line, spinning one turn unless `spin: false`, and lands in a dust puff with a 3 f star flash (25 f). `icon` is a map icon or any `prop` kind; other icon fields (`color`) pass through |
| `punch` | object `{x, y, at 0, size 120, cracks 8}` | Black star hole with radial cracks, popping in 0.12 s |
| `yearLabel` | object `{text, at 0, x 0.82, y 0.16, size 120, color "#fff", tilt -6}` | Big year stamped 1.3 → 1 over 0.2 s |
| `words` | list `{text, x 0.5, y 0.5, rot -10, skew -0.25, size 160, style, color, extrude, side "#6b3a1d", at 0}` | Words lying on the map plane. `style`: `shade` (default; deep tone of the region underneath, or `color`), `toon` (white with ink, or `color`), `extrude` (cream `#efe3c8` 3D lettering, `extrude` px deep (10), slams 1.6 → 1); setting `extrude` alone implies `style: "extrude"` |
| `words` (river label) | `{text, along: [[x, y], …], labelAt 0.5, size 64, weight 900, color "#1d3f7a", at 0}` | Italic label following a path, fades in over 6 f |
| `xmarks` | list `{x 0.5, y 0.5, size 160, at 0, color "#141010", width 0.12, rot -4}` | Two tapered brush strokes, 3 f each; `width` is a fraction of `size` |
| `tacks` | list `{x 0.5, y 0.5, at 0, color "#d42020", size 2.2, label, labelSize 34}` | Push-pins drop in 4 f with a 1-frame squash |
| `flags` | list `{x 0.5, y 0.5, at 0, h 220, color "#c8323a", color2 "#f4efe4", pattern, letter}` | Pole grows 15 f, cloth unfurls 10 f and waves on twos. `pattern`: `disc`, `star`, `stripes`, `band`; `letter` prints up to 2 characters |
| `barriers` | list `{x 0.5, y 0.5, at 0, angle 0, len 120, color "#d42020", flip, scale 1.6}` | Striped arm swings down 70° in 8 f with a 2-frame bounce |

**Moving units**

| Field | Shape | Defaults and effect |
|---|---|---|
| `tokens` | list `{icon "ship", pts, at 0, dur 2, size 70, bob 3, count 1, every 0.3, color}` | Icons travel along the path (eased), copies staggered by `every`, mirrored to their heading, bobbing `bob` px |
| `armies` | list `{x, y, rx 0.05, ry 0.03, count 40, at 0, dur 0.6, color "#1d1410"}` | Oval of dots popping in one by one |
| `squads` | one or list `{prop \| icon "helmet", count 4, formation "diamond", pts, at 0, dur 3, size 130, hop true, flagEvery, wipe {region, to "#9a9a9a"}, state {at, v: "empty"}, id, color}` | A column of props or map icons marching in `diamond`, `line` or `blob` formation, hopping ±3 px on twos while moving; every `flagEvery`-th member carries a white flag; `wipe` repaints the region 40 px behind the lead; `state.v: "empty"` greys the tokens |
| `camps` | one or list `{x 0.5, y 0.5, at 0, style "camp", flags 2, color "#c3161f", size 230, move {to, at 0, dur 3}, hop true}` | `palisade`, `camp` (dot soldiers), `formation` (dot block with standards), `blob` (cloud of helmets); hop while moving |
| `forts` | one or list `{along, count 6, every 0.2, at 1, size 120, icon "fort", color}` | Forts pop-tilt one by one along a polyline (2+ points) |
| `coins` | one or list `{pts, at 0, every 0.25, count 8, size 36, hop 0.6, apex 40, loop false}` | Spinning gold coins hop point to point (`hop` s per hop, `apex` px high); `loop` repeats |
| `figures` | one or list, see below | Cast beans standing on the map |

**Route marks (`drops` on a mover).** `tokens[]`, `figures[]` with a `path`, `squads`, `camps` with `move`, `fights[]`, and the drawn head of `routes[]` and `trails[]` (not `head` trails: put `drops` on the figure) accept `drops`; `throws` do not (a throw is a jump and already lands in a puff). A mark is dropped at the mover's position at its start time and every `every` s until it stops, pops in, and stays in map space (it zooms and pans with the map, and lies on the board under a `view`; `squads` and `camps` marks stand upright). Marks are drawn under the mover. This is a field of the moving item, unlike the map-level `drops` overlay (a prop slammed onto the map, below).

| `drops` field | Default | Effect |
|---|---|---|
| `every` | 0.5 | Seconds between marks |
| `icon` | `blast` | Any map icon (`blast`, `dot`, `flag`, `cross`, ...) or prop kind |
| `size` | 60 | Mark size in flat-map px |
| `pop` | 6 | Pop-in frames: scale 0 → 1.15 → 1, stepped per frame |
| `spin` | 30 | Random tilt range in degrees (seeded per mark) |
| `life` | none | Seconds before a mark turns into its `after` state; omit to keep the mark |
| `after` | `smoke` | `smoke` (grey cloud pops in and drifts up slowly, then stays), `none` (mark collapses in 3 f), or a map icon / prop kind |
| `color`, `afterColor` | icon default | Tint of the mark and of the `after` icon |

`drops: true` takes every default. An unknown `icon` or `after` throws at render time.

`figures` entries: `{who, x 0.5, y 0.5, at 0, out, scale 0.32, enter "pop", pose, expr, view, look, talk, flip, id, sticker true, rim 6, shadow true, fit true, hover, sit, strings, yank, path, walk, paint}`. Any other bean field (`look`, `talk`, `hold`, …) passes through to the bean ([01 Characters](01_characters.md)).

| Figure field | Effect |
|---|---|
| `scale` | Height as a fraction of the frame height (shrinks with depth under a view) |
| `enter` | `pop` (0.25 → 0.6 → 1 in 3 f), `stretch` (squash-stretch 3 f), `drop` (falls 6 f, squash 0.8 → 1.08 → 1), `none`; `out` pops away 0.6 → 0.25 → 0 |
| `sticker`, `rim`, `shadow` | White sticker outline (px), ground shadow |
| `fit` | `false` lets the head cross the top safe margin |
| `hover` | Bobs ±3 px on twos with no shadow |
| `sit` | `throne`, `deckchair`, `bed` (pose defaults to `sit`, or `lie` for `bed`) |
| `strings`, `yank` | Puppet strings to a wooden control cross kept in frame; `yank: <time>` pulls the puppet out of frame in 3 f |
| `path`, `walk` | `path: [[x, y], …]` walks the figure (facing the direction of travel) during `walk: [t0, t1]` (default `[at + 0.3, at + 2.3]`) |
| `paint` | `{color "#c3161f", every 5, r [0.03, 0.06], clip}`: lays a territory lobe every `every` frames behind the walker; `r` is the lobe radius range (map widths); `clip` lists region ids to stay inside |

**Area effects (upright)**

| Field | Shape | Defaults and effect |
|---|---|---|
| `brawls` | one or list `{region \| pts, at 0, count 9, every 0.06, size 170, out, outDur 0.6, id}` | Fight clouds with fists, stars and grimaces pop 2 f apart (0.3 → 0.7 → 1.12 → 1), jitter on twos, fade together on `out` |
| `fights` | one or list `{path, at 0, dur 4, ease "linear", size 120, count 3, heads 6, dust true, skins, drops, trail false, out, outDur 0.4, id}` | A brawl cloud that travels: `path` is 2+ `[x, y]` map fractions. A clump of `count` brawl clouds (the `brawls` look: limbs, weapons, stars) jitters around the mover and hops ±4 px on twos while it moves; `heads` cartoon heads (team helmets from `skins`, else red / blue) pop in and out of the rim on twos; `dust` kicks up a puff every 0.1 s behind it (each swells and fades over 0.6 s). It pops in over 4 f (0.3 → 0.7 → 1.12 → 1), travels along the path over `dur` with `ease` (any `T.ease` name), then keeps boiling at the end until `out` (fade and shrink over `outDur`). `drops` takes the route-mark object (below), e.g. `{every 0.5, icon "flag", color}` for a planted trench line; `trail: true` or `{color "#5a3a24", width 7, dash}` draws the line it leaves. Stays in map space and stands upright under a `view` |
| `fires` | one or list `{region \| pts, at 0, count 18, every 0.08, size 84, smoke true, out, outDur 0.5, id}` | Free-standing flames scattered over the area, every third with a smoke column |

**Props on the map (upright)**

| Field | Shape | Defaults and effect |
|---|---|---|
| `arrows` | list `{from, to, at 0, out, style "flat", double, label, labelSize, labelColor "#fff", color, width, head, bend 0.06, trim, pulse, draw, depth 12}` | `from`/`to` are region ids or `[x, y]`; ends at region ids are trimmed 8 % (`trim`). `flat` (orange `#e8502a`, width 62), `block` (3D red `#c03030`, width 72, `depth` px side), `hook` (white hand-drawn hook, width 24). Pops 0 → 1.1 (f4) → 1 (f6), or grows along its path over `draw` s; `pulse` breathes 3 %. `label` is big white lettering with an ink rim riding the shaft (`labelSize` max(56, 1.05 × width), hook max(56, 2.4 × width), shrunk to fit 62 % of the shaft, never below 34 px) |
| `drops` | list `{prop "bandage", x 0.5, y 0.5, at 0, hold 1, rot -25, size 420, text, color, puffs true, out}` | Object hovers above the target for `hold` s, squashes 1 frame, slams, settles 1.05 → 1 and puffs. `bandage`, `stamp` (leaves a `text` imprint, default "APPROVED", in `color`), `foot` (900 px, rot 0, red seep), or any `T.PROPS` kind. Add a layer `shake` at the slam |
| `hand` | one or list `{to [0.5, 0.5], at 0, dur 0.4, hold 1, from, sleeve "#4a5a3a", state "pinch", carry, color "#d42020", size 200}` | Gloved hand slides in from `from` (`top`, `bottom`, `left`, `right`; default nearest edge), trembles 1 px while holding, retracts in 10 f. `state`: `open`, `fist`, `point`, `pinch`, `grab`, `thumb`. `carry: "tack"` or `"flag"` shows the item until it arrives |

### ③.7 Map icons (`map_icon`)

Used by `cities[].icon`, `tokens[].icon`, `squads[].icon`, `forts[].icon`, route marks (`drops.icon`, `drops.after`): `blast` (flat cartoon explosion, the route-mark default), `dot` (infection / marker dot, `color`), `ship`, `train`, `helmet`, `tank`, `mug`, `pawn`, `castle`, `dome`, `pagoda`, `house`, `cross`, `flag`, `army`, `fort`, `camp`, `formation`, `factory` (smoking chimneys), `derrick`, `plane` (spinning prop), `church-hut`, `rubble`. An unknown icon throws.

## ④ Timing

Frame counts at 30 fps. Engine defaults first, then the reference measurements they come from.

| Beat | Frames / seconds | Field |
|---|---|---|
| Region grows in | 36 f (1.2 s) outCubic; `0.001` = already there | `regions[].dur` |
| Territory removed | 15 f fade; reference removes territories in ~1 s steps | `out`, `outDur` |
| Face, arms, label, city, fort pop | 8 f (0.25 s) outBack | `face.at`, `arms.at`, `label.at`, `cities[].at` |
| Pin pop | 9 f (0.3 s) | `pins[].at` |
| Route marks | one every 0.5 s, pop 6 f (0 → 1.15 → 1), then hold; with `life` 1 the mark collapses in 3 f into smoke (reference: a toy car drives across a map dropping explosions ~0.5 s apart, grow ~0.2 s, hold ~1 s, turn to smoke) | `drops.every`, `pop`, `life` |
| Throw | wind-up 9 f, flight 11 f, impact puff 25 f (reference: a map face throws its army at a neighbour) | `throws[].windup`, `dur` |
| Border morph | 18 f (0.6 s) in-out on twos (reference: a straight border becomes a zigzag in a short) | `morphs[].dur` |
| Flood conquest / recolor | 24 f (0.8 s) in-out | `conquer.dur`, `recolor.dur` |
| Blotch conquest | 2 s | `conquer.dur` |
| Annex flash | 6 f per colour × 2 colours × 2 flashes = 24 f, then hard switch | `annex` |
| Whiteout | 15 f | `whiteout.dur` |
| Rename | strike 6 f, new name pops at +8 f over 8 f | `strikeLabel.at` |
| Split | blob 4 f, crack 1 f, recolour 6 f, drift apart 5 f, punches every 6 f from +9 f | `split` |
| Shatter | cracks 12 f, pieces fly 15 f, fade last 4 f | `shatter` |
| Slash | 8 f per stitch, wound opens 3 f, spill ~30 f | `slash` |
| Engulf | 15 f outCubic | `engulf.dur` |
| Wipe | 3 f era cut … 2 s absorption | `wipe.dur` |
| Drift / peel | 2 s slide + 9 f to grey / 15 f lift, coins pop 4 f | `drift`, `peel` |
| Damage mark | 1.3 → 1.15 → 1 over 3 f | `damage.at` |
| Surrender arm | 6 f outBack, flag on twos | `surrender.at` |
| Figure enter | `pop`/`stretch` 3 f, `drop` 6 f + 3 f squash, `out` 3 f, `yank` 3 f | `figures[].enter` |
| Walker paint | one lobe every 5 f | `paint.every` |
| Arrow | 0 → 1.1 at f4 → 1 at f6, or draw over `draw` s | `arrows[].at` |
| Brawl clouds | one every 2 f (0.06 s), 4-step pop, fade 18 f | `brawls` |
| Travelling fight (measured) | two clouds race the length of an empty field in ~5.8 s planting a flag every ~0.5 s, then hold ~3.4 s on the two lines (WW1 6:33.7–6:45.3) | `fights[].dur`, `drops.every` |
| Fires overlay | one every 0.08 s, 3-step pop | `fires` |
| Front / route / river / wall | 1.5 s / 1.2 s / 1.2 s / 1.2 s | `dur` |
| Tokens march | 2 s per copy, copies 0.3 s apart; fleets 4–6 at 0.35 s | `tokens` |
| Squads / camps move | 3 s, hop ±3 px on twos | `squads.dur`, `camps.move.dur` |
| Forts | 0.2 s apart, 8 f pop with −14° tilt settle | `forts.every` |
| Flags | pole 15 f, cloth from f9 over 10 f, wave on twos | `flags[].at` |
| Coins | 0.6 s per hop, 0.25 s apart | `coins` |
| X mark | 3 f + 3 f | `xmarks[].at` |
| Barrier | 8 f swing + 2 f bounce | `barriers[].at` |
| Map words | `shade`/`toon` 1.3 → 1 in 5 f; `extrude` 1.6 → 1 in 3 f | `words[].at` |
| Drop slam | hover `hold` s (1 s), 1 f squash, 1 f slam, settle 4 f, puffs 8 f | `drops[].hold` |
| Tack | falls 4 f, 1 f squash | `tacks[].at` |
| Hand | in 12 f, hold 1 s, out 10 f; tack lands at `at + dur` | `hand` |
| Crosses | 1.5 s total, each pops in 0.15 s | `crosses.dur` |
| Year label | 1.3 → 1 in 6 f | `yearLabel.at` |
| Punch through | 4 f pop; reference: crack 1 f before, cracks grow 5 f, push-in 8 % over 12 f | `punch` + `camera.punch` |
| Map zoom to region | ~12 f ease-out | `camera.zoom`, `ease: "outCubic"`, `dur` 0.4 |
| Slow pan | ~40 px/s | `camera.pan`, `tilt.pan` |
| Map beat hold | 0.5–1 s between actions; spine shots 6–25 s with a change every 1.5–3 s | layer `at` values |

## ⑤ Recipes

Snippets are complete `layers[]` entries. `blob` regions keep them short; swap in `pts` or an `image` for real outlines. Figures need the `who` ids in `cast`.

**"Three rivals each held a region."** Tilt board, toon words, rulers popping 0.25 s apart.
```json
{"type": "map", "style": "atlas", "view": "tilt", "w": 1.2, "h": 1.3, "tilt": {"deg": 42, "vp": 0.04, "depth": 14, "pan": [[0, 0.02], [0.03, -0.02]]},
 "land": [[0.5, 0.52, 0.42, 0.4]],
 "regions": [{"id": "west", "blob": [0.3, 0.5, 0.13, 0.22], "color": "#d52a2a", "dur": 0.001},
             {"id": "east", "blob": [0.62, 0.35, 0.15, 0.13], "color": "#a43fd6", "dur": 0.001},
             {"id": "south", "blob": [0.62, 0.7, 0.15, 0.12], "color": "#f08a2c", "dur": 0.001}],
 "words": [{"text": "WEST", "x": 0.28, "y": 0.62, "style": "toon", "size": 110, "at": 0.3},
           {"text": "EAST", "x": 0.6, "y": 0.4, "style": "toon", "size": 110, "at": 0.5}],
 "figures": [{"who": "ruler", "x": 0.28, "y": 0.47, "at": 0.9, "pose": "hips", "expr": "smug", "scale": 0.34},
             {"who": "rival", "x": 0.7, "y": 0.42, "at": 1.15, "expr": "angry", "scale": 0.34, "flip": true}]}
```

**"X conquered Y, and renamed it."** Flood conquest, crying victim, rename, then the year.
```json
{"type": "map", "style": "atlas", "land": [[0.5, 0.5, 0.4, 0.36]],
 "regions": [{"id": "big", "blob": [0.36, 0.5, 0.16, 0.2], "color": "#d52a2a", "dur": 0.001, "face": {"mood": "smug", "accessory": "sunglasses"}},
             {"id": "small", "blob": [0.66, 0.48, 0.12, 0.14], "color": "#3aa33a", "dur": 0.001, "face": {"mood": "worried", "at": 0.2},
              "conquer": {"by": "big", "at": 1.0, "dur": 0.8}, "strikeLabel": {"old": "GREENLAND", "new": "NEW RED", "at": 2.0}}],
 "yearLabel": {"text": "1066", "at": 2.6}}
```

**"Then they took B, then C."** Annex flashes 1 s apart, a label on the beat.
```json
{"type": "map", "style": "atlas", "land": [[0.5, 0.5, 0.42, 0.38]],
 "regions": [{"id": "a", "blob": [0.3, 0.5, 0.12, 0.16], "color": "#d52a2a", "dur": 0.001},
             {"id": "b", "blob": [0.52, 0.42, 0.1, 0.12], "color": "#a43fd6", "dur": 0.001, "annex": {"at": 0.5, "to": "#d52a2a"}},
             {"id": "c", "blob": [0.7, 0.58, 0.1, 0.12], "color": "#f08a2c", "dur": 0.001, "annex": {"at": 1.5, "to": "#d52a2a"}}]}
```

**"The country split in two."** Split with a gap and a fight, then cut to the two leaders.
```json
{"type": "map", "style": "atlas", "land": [[0.5, 0.5, 0.36, 0.38]],
 "regions": [{"id": "land", "blob": [0.5, 0.5, 0.22, 0.26], "color": "#f08a2c", "dur": 0.001, "face": {"mood": "neutral", "scale": 0.3},
              "split": {"at": 0.8, "gap": 18, "fight": true}}]}
```

**"Swallowed by its neighbour."** Engulf from the attacker's side.
```json
{"type": "map", "style": "atlas", "land": [[0.5, 0.5, 0.42, 0.36]],
 "regions": [{"id": "east", "blob": [0.7, 0.48, 0.16, 0.2], "color": "#a43fd6", "dur": 0.001, "face": {"mood": "smug"}},
             {"id": "west", "blob": [0.36, 0.52, 0.12, 0.14], "color": "#d52a2a", "dur": 0.001, "face": {"mood": "worried"},
              "engulf": {"by": "east", "at": 1.0, "dur": 0.5, "dir": "right"}}]}
```

**"X declared war on Y."** A double arrow with a label, then a block push and a hand-drawn hook.
```json
{"type": "map", "style": "atlas", "land": [[0.5, 0.5, 0.42, 0.38]],
 "regions": [{"id": "west", "blob": [0.3, 0.5, 0.13, 0.18], "color": "#d52a2a", "dur": 0.001, "face": {"mood": "angry"}},
             {"id": "east", "blob": [0.68, 0.42, 0.13, 0.15], "color": "#a43fd6", "dur": 0.001, "face": {"mood": "angry"}},
             {"id": "south", "blob": [0.6, 0.72, 0.12, 0.1], "color": "#f08a2c", "dur": 0.001}],
 "arrows": [{"from": "west", "to": "east", "at": 0.3, "double": true, "label": "WAR"},
            {"from": "east", "to": "south", "at": 1.5, "style": "block", "label": "PUSH", "bend": -0.1}]}
```

**"The army marched in and took the south."** A squad repaints the region behind it; a camp moves up for the siege.
```json
{"type": "map", "style": "atlas", "land": [[0.5, 0.5, 0.42, 0.38]],
 "regions": [{"id": "south", "blob": [0.62, 0.68, 0.16, 0.12], "color": "#f08a2c", "dur": 0.001}],
 "squads": [{"icon": "helmet", "count": 5, "formation": "diamond", "pts": [[0.3, 0.5], [0.5, 0.62], [0.72, 0.7]], "at": 0.3, "dur": 2.6,
             "wipe": {"region": "south", "to": "#d52a2a"}, "flagEvery": 5}],
 "camps": [{"x": 0.3, "y": 0.4, "at": 0.2, "style": "palisade", "move": {"to": [0.44, 0.44], "at": 0.6, "dur": 2.4}}]}
```

**"He conquered region after region."** A walking ruler paints territory, a dashed trail follows him.
```json
{"type": "map", "style": "atlas", "land": [[0.5, 0.5, 0.42, 0.38]],
 "regions": [{"id": "plain", "blob": [0.38, 0.48, 0.2, 0.22], "color": "#9a9a98", "halftone": true, "dur": 0.001}],
 "figures": [{"id": "walker", "who": "ruler", "path": [[0.24, 0.6], [0.32, 0.45], [0.46, 0.36]], "walk": [0.4, 2.8], "scale": 0.2,
              "paint": {"color": "#d52a2a", "every": 5, "r": [0.025, 0.045], "clip": ["plain"]}}],
 "trails": [{"head": "walker", "color": "#d02020"}]}
```

**"The fleet sailed; the coast burned."** Ships along a route, a front, burning cities.
```json
{"type": "map", "land": [[0.4, 0.5, 0.3, 0.34]],
 "tokens": [{"icon": "ship", "pts": [[0.95, 0.75], [0.62, 0.62]], "at": 0.4, "dur": 2.0, "count": 5, "every": 0.35, "size": 70}],
 "fronts": [{"pts": [[0.58, 0.3], [0.56, 0.55], [0.6, 0.8]], "at": 1.6, "dur": 1.8}],
 "cities": [{"x": 0.5, "y": 0.5, "icon": "castle", "at": 0.3, "burning": 2.4, "label": "PORT"},
            {"x": 0.4, "y": 0.66, "icon": "dome", "at": 0.5, "burning": 2.8}]}
```

**"Millions died." / "The era ended."** Crosses tile the region, then the map greys out. Cut to a `stat` doc (card 06).
```json
{"type": "map", "style": "atlas", "land": [[0.5, 0.5, 0.4, 0.36]],
 "regions": [{"id": "k", "blob": [0.5, 0.5, 0.2, 0.2], "color": "#d52a2a", "dur": 0.001}],
 "crosses": {"region": "k", "at": 0.4, "dur": 1.5, "count": 90},
 "desaturate": {"at": 2.2, "dur": 0.8}}
```

**"The generals planned their next move."** War table, tacks on the beats, a hand places the last one.
```json
{"type": "map", "style": "parchment", "view": "tabletop", "land": [[0.5, 0.52, 0.4, 0.38]], "table": {"color": "#4a3a2a"},
 "tacks": [{"x": 0.3, "y": 0.45, "at": 0.4}, {"x": 0.62, "y": 0.4, "at": 0.65}, {"x": 0.38, "y": 0.6, "at": 1.95, "color": "#2a6ad4"}],
 "hand": {"to": [0.38, 0.6], "at": 1.55, "dur": 0.4, "hold": 0.8, "carry": "tack", "color": "#2a6ad4"}}
```

**"An empire stretching across the world."** Full globe with a title space above it.
```json
{"type": "map", "style": "atlas", "view": "globe", "land": [[0.35, 0.45, 0.14, 0.2], [0.62, 0.55, 0.16, 0.18]],
 "regions": [{"id": "empire", "blob": [0.36, 0.45, 0.1, 0.14], "color": "#d52a2a", "at": 0.5, "dur": 1.2}],
 "globe": {"full": true, "r": 0.36, "dy": 0.07, "spin": 0.05, "stars": 80}}
```

**"Patched up, then crushed."** Drops on a region with a face; shake on the foot slam (`at + hold`).
```json
{"type": "map", "style": "atlas", "land": [[0.5, 0.5, 0.42, 0.38]],
 "regions": [{"id": "east", "blob": [0.6, 0.45, 0.16, 0.18], "color": "#a43fd6", "dur": 0.001, "face": {"mood": "worried"}, "damage": {"at": 0.9, "kind": "bandage"}}],
 "drops": [{"prop": "bandage", "x": 0.62, "y": 0.42, "at": 0.2, "hold": 0.6, "size": 360},
           {"prop": "foot", "x": 0.36, "y": 0.62, "at": 1.6, "hold": 0.5, "size": 700}],
 "shake": [{"at": 2.1, "amp": 10, "dur": 0.2}]}
```

**"It broke into dozens of states."** Shatter with chaos streaks; hold the empty land.
```json
{"type": "map", "style": "atlas", "land": [[0.5, 0.5, 0.4, 0.36]],
 "regions": [{"id": "empire", "blob": [0.5, 0.48, 0.24, 0.24], "color": "#a43fd6", "dur": 0.001, "face": {"mood": "shock"},
              "shatter": {"at": 0.8, "pieces": 16, "dur": 0.6, "spread": 170, "bgStreaks": true}}]}
```

**"It hurled its armies at the neighbour, and the border buckled."** A face throws three armies, then the straight border morphs into a zigzag.
```json
{"type": "map", "style": "atlas", "land": [[0.5, 0.5, 0.42, 0.36]],
 "regions": [{"id": "west", "blob": [0.3, 0.5, 0.17, 0.24], "color": "#d9a441", "dur": 0.001, "face": {"mood": "angry"}},
             {"id": "east", "blob": [0.72, 0.5, 0.17, 0.24], "color": "#7fae4a", "dur": 0.001, "face": {"mood": "shock"}}],
 "throws": [{"from": [0.3, 0.5], "to": [0.72, 0.45], "icon": "army", "size": 110, "count": 3, "at": 0.4}],
 "morphs": [{"from": [[0.5, 0.25], [0.5, 0.75]], "to": [[0.5, 0.25], [0.56, 0.35], [0.44, 0.45], [0.56, 0.55], [0.44, 0.65], [0.5, 0.75]], "at": 1.6, "width": 8}]}
```

**"It tore across the country, leaving ruin behind."** A tank drives across the map dropping a blast every half second; each blast holds 1 s and turns to smoke. Swap the `icon` for `flag` (planted along a trench line, no `life`) or `dot` with `color` (an infection spreading).
```json
{"type": "map", "style": "atlas", "land": [[0.5, 0.5, 0.42, 0.36]],
 "regions": [{"id": "land", "blob": [0.5, 0.5, 0.36, 0.3], "color": "#d9a441", "dur": 0.001}],
 "tokens": [{"icon": "tank", "pts": [[0.2, 0.35], [0.5, 0.48], [0.8, 0.4]], "at": 0.2, "dur": 3, "size": 90,
             "drops": {"every": 0.5, "size": 70, "life": 1.0, "after": "smoke"}}]}
```

**"Both armies raced north to the sea, leaving a trench line behind."** Two fight clouds full of heads race up an empty field in 5.8 s, each planting its colour's flags every half second, then the shot holds on the two lines (shot `dur` ~9.4).
```json
{"type": "map", "style": "atlas", "land": [[0.5, 0.5, 0.44, 0.44]],
 "regions": [{"id": "field", "blob": [0.5, 0.5, 0.4, 0.42], "color": "#c9b47a", "dur": 0.001}],
 "fights": [{"id": "west", "path": [[0.42, 0.85], [0.4, 0.6], [0.44, 0.35], [0.41, 0.14]], "at": 0.2, "dur": 5.8, "skins": ["#c8323a"],
             "trail": true, "out": 6.1, "drops": {"every": 0.5, "icon": "flag", "size": 50, "color": "#c8323a"}},
            {"id": "east", "path": [[0.58, 0.85], [0.6, 0.6], [0.56, 0.35], [0.59, 0.14]], "at": 0.2, "dur": 5.8, "skins": ["#4f7fb8"],
             "trail": true, "out": 6.1, "drops": {"every": 0.5, "icon": "flag", "size": 50, "color": "#4f7fb8"}}]}
```

## ⑥ Limits and pitfalls

- **`spec.py` does not check map fields.** It validates the layer type and `who` ids of beans, not regions or overlays. Typos in enums (`view`, `conquer.pattern`, `wipe.shape`, `engulf.dir`, `slash.spill`, `split`/`arrows` style, `formation`, `camp` style, `sit`, figure `enter`, flag `pattern`, `words.style`, `hand.from`, unknown `drops` prop or map icon, unknown route-mark `drops.icon` / `drops.after`, unknown region id in `arrows`/`brawls`/`fires`/`paint.clip`, a `fights` `path` with fewer than 2 points or an unknown `fights` `ease`) throw at render time. Render a still (`--stills`) of every new map shot.
- **Region id lookups are silent in a few places.** `conquer.by` with an unknown id is treated as a colour string; `crosses.region` with an unknown id draws nothing. Double-check ids.
- **`split` and `shatter` replace the region drawing** once they start: `label`, `arms` and a single face are not drawn after the split (each half gets its own face), and nothing remains after a shatter unless `keep` is set.
- **`blob` shapes depend on ids.** Changing the map `id`, a region `id` or the region order (when ids are missing) reshapes every blob; keep them identical across the shots of one spine.
- **Globe spin wraps the content.** Keep land away from the left and right map edges, or it pops across the seam.
- **Views are heavier.** The flat map is painted to a scratch canvas and warped in 96 (tilt / tabletop) or 128 (globe) strips; very large `w`/`h` lose resolution (capped at 4096 px). Prefer `--scale 0.5` previews.
- **Pixel fields under views.** `size`, `width`, `gap`, `spread` are flat-map pixels; under `tilt` they shrink toward the far edge. Upright overlays scale with depth too.
- **Figures in a `tilt` with `vp` near 0** can hit the safe margin and be scaled down to 45 %; move them lower or set `fit: false`.
- **Units.** Every overlay position is a map fraction (not a frame fraction). Exceptions: `slash.wounds[].x/y` are fractions of the region bounding box, `faceOffset` is a fraction of the region bounding box, `figures[].scale` is a fraction of the frame height.
- **`armies` and `routes` are the plain early overlays.** For readable marching use `squads` or `tokens`, and for dashed paths prefer `trails` (it can follow a figure).
- **A single map shot carries 2–4 beats.** Past that, cut to a gag insert and come back to the same map state (repeat `damage`, recolours and `blob` ids so the spine stays continuous).
