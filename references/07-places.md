# 07 · Places, vehicles, foreground framing and props (v3)

New settings measured on the reference studies (WWI, WWII, Reconquista, China, Greek myth, horror, fact-check), so one engine can stage history, myth and horror stories. Every background draws its own parallax planes, like `sky`. Every vehicle animates only while it is driving. Example tour: `examples/v3_places/spec.json` (37 shots).

## Backgrounds (`bg.kind`)

| Kind | Look | Fields (defaults) |
| --- | --- | --- |
| `trench` | Inside a WWI trench: sky, pale mountains, no-man's-land with craters and wire, opposite lip, back wall of jagged earth slabs | `preset` (`sepia`), `night`, `burning` (flame strip + black smoke on the lip), `wire` (true), `back` (true), `horizon` (0.5), `lip` (0.62), `clouds` |
| `trench-section` | Side cutaway: surface at `horizon`, trench cut with fire-step, lit dugout | `preset`, `horizon` (0.36), `trenchX` (0.5), `dugout` (true) |
| `battlefield` | No-man's-land or aftermath: craters, dead trees, tufts | `preset` (`sepia`), `craters` (14), `trees` (4), `wire`, `fires` (count), `bodies` (count of red-pool heaps), `bodyColor`, `haze` (true or a color), `ground`, `hill` |
| `sea` | Horizon sea with moving wave crests | `preset`: `turquoise`, `storm`, `fog`, `night`, `sunset`; `cliffs`: `left`, `right`, `both`; `cliffColor`; `islet: [x]` (tower); `mist`; `waves` (40); `horizon` (0.55) |
| `underwater` | Gradient, light shafts, swaying seaweed, rising bubbles, sand | `top`, `bottom` |
| `corridor` | One-point stone tunnel, torches with warm light pools, dark vanishing point | `vp` (`[0.5,0.46]`), `torches` (2 per side), `thread` (Ariadne line), `stone`, `floor`, `sky` |
| `void` | Horror and inner-mind stages | `variant`: `black` (`color`), `spots` (`color`, `spot`), `boil` (purple noise redrawn on twos), `flesh` (organic pillars with drips, `pillars` 6), `stage` (spotlight cone on a cobble pool, `at`) |
| `office` | Plank wall, window, carpet, desk and tufted chair | `wall`, `planks` (`vertical`/`horizontal`), `window` (`porthole`, `arched`, `grid`, `none`), `windowX`, `lamp`, `desk` (true), `deskX`, `chair` (true), `carpet`, `floorY` |
| `graveyard` | Night hills, rows of tombstones and crosses, fence, ground mist | `preset` (`night`), `stone`, `fence` (true), `ground`, `hill` |
| `eastcity` | Halls with red columns and upturned eaves, a pagoda, marble balustrade | `preset`, `roof` (`#4a4a50`), `gold` (some gold roofs), `pagoda` (true), `balustrade` (true), `ground` |
| `karst` | Misty pointed peaks in three depths, fog bands, river, paddies | `preset` (`overcast`, or `sunset`), `paddy` (true), `river` (true), `pagoda: [x]`, `ground` |
| `gallery` | Museum wall with gilt frames and plaques | `frames: [{x,y,w,h, top, bottom, image, plaque}]`, `wall`, `dado`, `floor` |
| `blueprint` | Blue grid sheet on a wood table, chalk drawing that builds over time | `sketch: [{line:[[x,y]...], at, dur} \| {circle:[x,y,r], at} \| {text, x, y, size, at}]` (normalized to the sheet), `stamp`, `tilt` (-1.5°), `color` |
| `desert` | Three dune bands, optional cacti | `preset`, `cacti` (count), `horizon` |
| `mountains` | Snow-capped peaks | `variant`: `peaks`, `cave` (arch with a dark mouth, `at`), `gorge` (two cliff walls); `preset`, `ground` |
| `stage` | Theatre: plank floor, spotlight pools, red curtains and valance | `color` (`#8a1a1a`), `spots: [x...]`, `back`, `floor` |
| `bar` | Plank or brick wall, bottle shelves, pendant lamps, counter with mugs in front | `brick`, `wall`, `lamps: [x...]`, `counter` (true), `counterY` (0.78), `mugs: [x...]` |
| `hospital` | Pale ward, windows, rows of beds seen from the foot end | `beds` (3 per side), `wall`, `floor` |
| `factory` | Block skyline with lit window grids, smoking chimneys | `preset` (`overcast`), `color`, `banner` (color of a hung banner with a plain disc) |
| `street1920` | Ochre palazzi with arched windows, domes, obelisk, cobbles | `domes: [x...]`, `obelisk: x`, `grey` (depression grade), `preset` |
| `minoan` | Striped wall bands, red/blue disc frieze, downward-tapering red columns, checker floor | `columns: [x...]` |
| `olympus` | Light sky with rays, cloud floor, marble throne on steps, broken column | `throne` (true), `throneX`, `column` (true) |
| `chalkboard` | Wall-mounted board, chalk lines that type in | `lines: [{text, at, size}]`, `wall`, `board`, `floor` |

### Sky additions
- Presets `sepia` (WWI khaki-cream) and `overcast` (grey).
- `ground: "paddy"`: grey-green rice terraces with dikes and seedling rows.
- `timelapse: { dayDur: 1.6, shades: false }`: a smiling sun crosses on an arc, then a crescent moon (optionally in sunglasses). The gradient blends between day and night, and stars come out. Use it for "they waited for days" beats.

## Vehicles (`type: "vehicle"`)

`{ "type":"vehicle", "kind":"tank", "x":0.1, "y":0.86, "size":620, "drive":[[0,3.5]], "move":[{ "at":0, "dur":3.5, "to":[0.62,0.86], "ease":"linear" }] }`

- The origin is where the vehicle touches the ground or water; `size` is its overall width in px.
- `drive: [[t0,t1]]` (layer time) spins wheels, scrolls treads, turns paddles and propellers, and bobs land vehicles 4 px at 3 Hz. Wheels stop where they were when a window ends. Move the vehicle with the common `move` field, or keep it still and pan the camera.
- `dir: -1` faces left. `speed` scales wheel spin (default 1). `bobAmp` sets the land-vehicle bob.
- Boats rock automatically: `rock` in degrees (2.5) plus a 4 px heave.

| Kind | Extra fields |
| --- | --- |
| `tank` | Mark I lozenge with perimeter tread ticks, sponson gun and rivets. `color`, `burning` |
| `car1910` | Open-top car with spoked wheels. `riders: ["castName", ...]` (seated beans, `talk` passes through), `color` |
| `train` | Engine plus carriages, coupling rod, chimney smoke while driving. `cars` (3), `color`, `engineColor`, `smoke` |
| `steamer` | Paddle steamer, two smoking funnels, rotating paddle wheel. `color` |
| `submarine` | Cigar hull, conning tower, propeller blur. `face: "angry" \| true`, `color` |
| `junk` | Crescent hull with planks, two battened sails. `color` (sail) |
| `caravel` | Three masts, the main sail with a cross. `color` (sail), `cross` (true), `crossColor` |
| `rowboat` | Oars that row while driving. `riders`, `color` |
| `biplane` | Two wings with struts, roundels, propeller blur, pilot, gentle bob. `color`, `roundel`, `burning` (smoke trail) |
| `cannon` | On a wheeled carriage. `fire: [t, ...]` (layer time) gives a muzzle flash, recoil and a smoke cloud |
| `cart` | Plank box on a spoked wheel. `load` (any prop kind), `color` |

`T.smokePuffs(ctx, x, y, lt, {n, color, rise, size, seed, drift})` is exported for other modules.

## Foreground framing (`type: "fg"`) additions

| Kind | Fields |
| --- | --- |
| `sandbags` | 3 staggered rows of rounded bags along the bottom. `h` (0.2), `color` |
| `trench-wall` | Jagged earth slabs with a lit bevel and cracks. `h` (0.28), `color`, `bevel` |
| `window-grid` | Mullions plus a glass haze and reflection streaks (watching through a window). `cols` (4), `rows` (3), `mullion` (28), `color`, `haze` |
| `bars` | Prison bars with a warm torch rim light. `count` (7), `color`, `rim`, `crossbar` (true) |
| `barbed-wire` | Posts with looping wire across the bottom. `y` (0.08), `h` (110) |
| `curtains` | Red curtains framing both sides. `color`, `width` (0.18) |
| `foam` | Scalloped white cloud or foam band along the bottom. `rim` |
| `hands-fpv` | First-person gloved hands rising from the bottom corners with a bob (storyteller, reader). `color`, `sleeve` |
| `lamp-post` | A street lamp as a vertical edge band. `side` (`right`) |

## Props (`type: "prop"` / `hold`) additions

| Category | Kinds |
| --- | --- |
| Weapons | `rifle`, `grenade`, `bomb` (fuse sparks on twos), `canister` |
| Markers | `gravestone` (`title` "R.I.P", `text`, `color`), `cross` |
| Buildings | `pagoda` (`tiers`, `roof`, `color`), `castle` (`flag`, `flagColor`, `color`), `dome` (`color`, `domeColor`), `tent` |
| Objects | `mug`, `croissant`, `pawn`, `pin`, `teacup`, `telephone`, `microphone`, `crate` (`text`), `barrel` |
| Signs | `banner` (generic hanging banner with a plain disc, `color`, `emblem`, `text`), `placard` (`text`, `textColor`) |

Use `banner` for parties, regimes and factions. Never recreate real extremist symbols.

All of these props are centred on (`x`, `y`), not standing on it: a `crate` or `barrel` is 0.9 × `size` tall, so set `y` 0.45 × `size` / 1080 above the floor line to stand it there. Ground-origin props are listed in [08-props](08-props.md).

## Recipes

### Waiting in the trench (stalemate, siege)
`bg: trench` + a soldier bean at `size` 950, `y` 1.18 + `fg: trench-wall` (`z` 1.3). Camera drift `zoom [1,1.04]`, 3–4 s, `expr: "worried"`.

### Over the top (attack)
`bg: battlefield` with `wire` + a `crowd` (`march`, 2 rows) that moves across with `move` + `fx: arrows` or muzzle flashes + `camera.shake` on the first impact. 3 s.

### New weapon reveal
1. A soldier looks right (1.5 s).
2. `bg: battlefield`, then a `vehicle` (`tank` or `biplane`) drives in from the frame edge with `drive` + `move` (2.5–3.5 s).
3. A `zoom-punch` cut to the shocked face.

### Invasion fleet
`bg: sea` (`turquoise`, `cliffs: "both"`) + 2–3 boats (`caravel`, `junk`) with staggered `move` + `fx: birds`. The next shot is the map with the region flipping.

### Time-lapse siege ("they waited a week")
`bg: sky` with `timelapse` (`dayDur` 1.6, `shades`) + `hills` + a tiny `crowd` on the ridge + a `cannon` firing every ~1.5 s. 4–10 s.

### Corridor dread
`bg: corridor` with `thread` + a back-view bean walking toward the vanishing point (`walk`, `move` with `scale` 0.6) + `grade: serious` at strength 0.6. Cut to `void` (`flesh` or `stage`) for the inner-mind beat.

### Gallery entry (changing era or topic)
`bg: gallery` with one big frame and a `plaque` + a host pointing. Push in toward the frame (`camera.zoom` with `focus` on it), then `fade-white` into the scene the painting shows.

### Blueprint plan (explaining a plot or tactic)
`bg: blueprint` with `stamp` and a `sketch` list whose `at` times follow the narration: road, bridge label, X marks the spot, route line. Keep the board 8–20 s with the camera drifting, and cut away for each consequence.

### Fact-check office / storyteller bookends
- Fact-check office: `bg: office` (`porthole`, `lamp`) + a host with `talk` + `prop: telephone` and `microphone`.
- Storyteller bookend: `office` with `desk:false` + `prop: book` + `fg: hands-fpv`.
