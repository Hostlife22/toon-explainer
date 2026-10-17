# Changelog

## Unreleased

### Engine gaps: props-front

- Fix: held props take a natural size with acting on (the painted default) when no `holdScale` is set: `T.HOLD_SIZE` now also grows long tools, signs and broadsheets (`newspaper` 280, `paintbrush` 250, `scales` 270, `microscope` 260, `spray-can` 190, `rope` 230, `broom` 330, `shovel` 320, `pitchfork` 340, `rifle` / `musket` 330, `placard` / flags 260 and more), so they read against the hand and body without tuning. Classic keeps 170; an explicit `holdScale` still multiplies the classic size; props that already read right (mug, teacup, bottle, mallet, scroll, ...) are unchanged.
- Fix: ground fx placed at a spot (`dust`, `dustkick`, `poof`, `puff`, `smoke`, `fire`, `blood`, `pool`, `spill`, `toxic-cloud`; registry `T.FX_GROUND`) are slotted among `set` front parts by their `y` like actors, so dust at the judge's feet stays behind the bench; screen-wide fx (flash, blackout, rain, ...) stay over. New fx field `front`: `"over"` keeps the old order, `"depth"` slots any placed fx by its `y`.
- Fix: front parts come from every `set` in the shot's `bg` list that no covering background follows; a parts-only set (`wall: false, floor: false`) does not cover, so a room plus a set of extra front benches, or a landscape plus a parts-only set with a front desk, both work (`T.bgCovers`, `T.frontSources`).
- New bg field `frontY` on `room`, `cell`, `antique`, `palace` and `studio`: their front plane joins the automatic front pass (redrawn over layers standing above `frontY`), so a judge stays behind a `studio` `courtroom` bench without a hand-placed `bg-front` layer.
- Front pass review fixes: an fx is slotted where it renders (`T.FX_ANCHOR`: a targeted `dustkick` at its landing point, a `brawl` along its own `path`); only positional `move` steps place an fx; an explicit `set-front` layer also places `frontY` planes; a `frontY` plane is left out of the background pass (drawn once, also under a rack-focus blur); fx `front` is validated across swaps.
- `examples/painted_places` gains `set_front_layers` and `set_front_plane`; `examples/props_fx_v2` gains `v16_held`.

### Engine backlog: characters

- Fix: poses `flail` / `flail-b` stand upright (panicked arms thrown up at odd angles) instead of rendering the character upside down; the old head-over-heels flip is the new pose pair `upended` / `upended-b` (`story_banana_caper` uses it for its slips).
- Fix: `glasses: true` draws plain spectacles (thin rounded frames over clear glass, the eyes show through) instead of sunglasses; `"clear"` / `"spectacles"` are the explicit names, `"sun"` (and other strings) still draw sunglasses.
- Fix: `crowd` honours `look` (merged over every member's cast look, back rows still tinted), so a crowd `swap` with `look: {"age": "child"}` turns the whole crowd into children; bean `look.age` swaps are covered by a test.
- Fix: a bean `reach` to a target above the shoulder and out of reach lengthens the arm toward it (up to 1.9 × straight up, like `hold-high`) without `stretch`; level and low targets keep the arm length and `stretch: false` turns it off. In the painted front view a raised arm whose hand ends over the head stays behind the head instead of crossing the face.
- Fix: the `sick` expression reads as nausea, not bleeding: a pale green face tint, cold pale sweat beads and a new tight wavy `queasy` mouth replace the red drip.
- Held and prop `bottle` `pour` can tip back: `{at, dur, back, backDur}` returns it upright, or a `[{at, v}]` timeline of tip fractions drives it; the painted liquid stays poured. The return starts from the tip reached at `back`, and the poured amount is the running maximum of the (eased) tip curve, so the liquid never rises again. `holdProps.pour` and a prop's `pour` are validated.
- Crowd `look` (and `swap` looks) are validated like bean looks, and mounted crowds (`creature`) pass it to the riders through the new creature field `riderLook`.
- `examples/characters_v2` gains `c11_panic_sick_reach` and `c12_crowd_age_pour`.

### Engine backlog: core, camera and motion

- Fix: world-placed labels, titles and counters (`hud` false) no longer slide along the frame edge while a zoomed `frame` camera pans: the safe-frame shift is fixed for the layer's life (the smallest one that fits it in the frame at some moment on screen), so the text stays glued to its world spot.
- Fix: `smooth` paths use centripetal Catmull-Rom tangents held monotone between neighbouring points, so very uneven point spacing no longer makes the curve overshoot or loop backwards (no false turn squash on a car).
- Fix: `scripts/density.py` reads keyed `camera.zoom` values and `frame` box sizes, so it no longer reports false "same camera zoom" runs.
- Fix: the `ortho` globe's star backdrop is painted right after the shot backgrounds (new `T.AFTER_BG` hook), so layers listed before the map stay visible.
- `xray` `out` / `outDur`: the scan crossfades back to the normal layer mid-shot.
- `move` steps take `by: [dx, dy]` (relative slide) and `from: [x, y]` (start point; held until the step starts; alone it slides the layer in to its `x`/`y`). Steps without them behave as before.
- Shot `grade` `out` / `outDur` are documented as the way to end a grade mid-shot and validated (numbers, `out` not before `at`).
- New `fx` `blackout`: the lights go off (`level`, `color`, `fade`, `dur`, `fadeOut`), with `lights` keeping soft lit holes around a candle or lamp that follow it and the camera.
- Review fixes: the blackout scratch is cleared each draw (translucent colours no longer build up); only the first `move` step holds a layer at its `from`; the globe backdrop pass resolves `swap`s first; vertical films sample each moment's strip centre for the label shift; a pinned blackout whose `lights` name world layers is drawn in the world pass; `lights` are validated (shape, `r` > 0, ids in the shot; `scripts/spec_blackout.py`); a grade with `at: null` validates; density fits `frame` box zooms to the vertical strip.
- Integration fixes: the world-label shift samples the layer's own state at each sampled time (a label that slides in is no longer pinned to the frame edge); `T.subShot` frames vertical sources with the same `T.stripFramed` as the film; swap states are validated for refs, blackout lights, riders and rider acting; `scripts/spec.py` vocabulary and map checks moved to `spec_vocab.py` and `spec_maps.py` (re-exported, no behaviour change).
- `examples/camera_acting` gains `s18_world_labels_pan`, `s19_slide_and_xray` and `s20_lights_out`; tests in `tests/test_backlog_core.py`.

### Engine backlog: places and props

- Fix: the `courtroom` set preset's judge's desk now sits in front of the actors. Set parts take `front: true`: they are left out of the room and drawn by a front pass that goes into the layer order automatically (before the first fg layer, lettering, layer with `z` > 1 or layer standing lower than the part), so a judge stands behind the bench and a witness in front of it stays in front. An explicit `fg` `bg-front` (or the new `set-front`) layer places the pass by hand.
- Fix: `contact: true` on an `obj` draws its shadow at the object's feet (it landed half a size below, detached), 1.3 times wider for the body.
- Fix: the `stone` material shows a texture in the painted look: soft mottling, pits with a lit lip and chipped facets, seeded in the layer's own units so the grain moves and scales with it (`grain` 0..2, `false` = none); it also keeps more of the layer's shading. The classic look is unchanged.
- `candle` takes `flame: false` (a charred wick); `candle`, `oil-lamp` and `lantern` also take a `[{at, v}]` flame timeline, and a lamp that goes out leaves a smoke wisp for 1.5 s.
- `poof` defaults to 300 x 220 (was 420 x 300) so it no longer covers the subject; `word` takes any text, and `false` hides it like `null`. Explicit `w` / `h` work as before.
- Review fixes: each front part is slotted per frame from the layers' current state (swaps, motion, `z`, `hud`) and depth-sorted by its own `y` among the actors; an inactive explicit front layer no longer suppresses the pass; only the last background, when it is a set, contributes front parts; `set-front` in `pinned` is rejected. `spray: 0` sprays and every window's plume finishes; the everyday props' fields and nested prop kinds (fridge `items`, pulley `load`, scales pans, flame timelines, held props' `holdProps`) are validated (`scripts/props_check.py`); fridge ground items stand on the shelf; `contact: true` on an `obj` uses its wider default shadow.
- Front parts stay under `fx` layers (a blackout covers the bench), are slotted from the state a layer is drawn at on twos, get the `bg`-target grade and the rack-focus background blur, and draw inside pinned sub-shot replays.
- New props, original designs with painted shading: `scales` (tilting beam, pans holding props), `microscope`, `paintbrush`, `newspaper` (`title`, `headline`, `date`, `photo`), `spray-can` (`spray` windows with a particle mist), `fridge` (`open` door over lit shelves with `items`), `rope` (coil) and `pulley` (`lift` raises a `load`, the wheel turns). The paintbrush, newspaper, spray can and rope work as bean `hold` items with `holdProps`. Catalog shots in `examples/props_fx_v2` (`v13_everyday`, `v14_house`, `v15_unlit`) and `examples/painted_places` (`set_courtroom_front`).

### Engine backlog: creatures and vehicles

- Fix: the reaper's `hold` prop sits in its right glove, out beside the body, in every pose (it covered the skull mask); the scythe follows the glove too; `holdSize` sets the prop size (`tests/test_vehicle_views.py`).
- Car views: `model-t`, `car1910`, `sedan1920`, `car1950` and `car-modern` draw `front`, `3q`, `back` and `3q-back` views (`lib/props/vehicles-views.js`) from a per-kind face description. A vehicle `view` / `facing` timeline turns the car through the views in between (`turn: {frames, via, squash, smear}`), and a car whose `path` doubles back turns through 3q and front (or back) instead of squashing. Cars without `view`, `facing` or a reversal render exactly as before.
- Riders can be objects `{who, expr, lookAt, talk, pose, hold, takes, ...}`: a seated driver changes expression on its own timeline and looks at a layer or point from its seat (the acting director aims from the seat in the world).
- Car 3q and 3q-back views redrawn as one oblique projection (`lib/props/vehicles-3q.js`): foreshortened side, swept bonnet / roof / boot top planes and the front or rear face inked as one silhouette with creases, far wheels, riders behind the glass. In 3q-back the rear face replaces the side drawing's tail end (tail lights, bumper end, spare) and riders are seen from behind.
- Fixes from review: rider anchors are pure functions of shot time (view, facing and 3q seat at that time; the vehicle's `at`; rider `scale`), so acting no longer depends on render order; riders of different vehicles never share a director plan; classic `car1910` riders aim from their seats; take hops lift seated riders; exhaust puffs keep the facing of their emission time; the squash stays where no view turn can draw (`rig: "classic"`, authored view); `view: "side"` is identical to no view; looping paths turn across the lap seam (circular distance, seam reversal); path `orient` no longer tilts front / back views; rider fields (`expr`, `hold`, `talk`, `lookAt`, `takes`) are type-checked and their targets validated.
- `examples/creatures_vehicles_v2` shot `c13_car_turns` (a U-turn toward the camera, a car turning to face the camera and away, a driver reacting to a reaper holding an hourglass); recipe note in `02-visual-grammar.md` (U).

Painted engine, phase 8: directing rules.

- `SKILL.md` makes the painted look the default for new films and routes to Places 2.0, real `geo` maps and globes, shot-size framing, acting, path motion and particles; production rules gain "one continuous motion per shot", shot-size quotas and a per-shot density checklist.
- `references/09-directing.md` §6.1 (coverage: shot-size quotas per minute, OTS for every exchange, wide establishers on maps and globes, continuous motion, hold-and-snap for poses, density checklist); `02-visual-grammar.md` "Shot sizes and density", a `geo` map recipe F and recipes U (vehicles and walkers on paths), V (the ECU insert), W (poison and gas); `07-story-craft.md` §7 maps sentence intents to the new features and updates the war, rivalry, poison, travel, globe and lab recipes.
- Bean `holdRot` (degrees or a timeline) tilts the held prop in the grip and `holdProps` passes prop fields to it (a held `bottle` can `pour`), so held props act and move with the hand.
- `xray` `anatomy` (skeleton, lungs, beating heart, vessels) and `specks` (grains settling into the bones over time).
- Fix: arm IK keeps the elbow on the outer side for hands raised above the shoulder, changing bend side smoothly through a narrow band at shoulder height (no elbow jump) (`drink`, `eat`, `facepalm`, `reach` to the face no longer fold the elbow across the chest; `tests/test_arm_ik.py`).
- `examples/painted_bench` map and globe shots use real geography (a painted Mediterranean with a flood, pins and a sign; a spinning `ortho` globe with ISO regions).

Painted engine, phase 4: camera and acting. Classic specs without the new fields render pixel for pixel as before.

- Shot-size grammar: `camera.frame` keys frame a target layer at `ecu`, `cu`, `mcu`, `ms`, `ws` or `ews` (bean head and body extents, or a layer's box), with `place`, `zoom`, `point` / `box` targets and world-edge clamping; keys move between framings with an ease, a spring `overshoot` that settles, or a `whip` pan with a motion streak, and `rack: true` pulls focus to the target.
- Over the shoulder: a key's `ots` hides the listener and redraws it as a blurred dark shoulder at the frame edge, with the speaker placed opposite. Low / high angle (`camera.angle`): horizon planes shift by depth and the subject looms or shrinks.
- Moves: eased `zoom` / `pan` keys, `handheld` (layered seeded noise), `follow` a moving layer with a critically damped lag, `dollyzoom`, `orbit` (parallax slide), smooth `roll`. Easings `inCubic`, `inBack`, `inOutBack`, `outSettle`, `outElastic`. Every move keeps the per-plane parallax of Places 2.0; deep planes never zoom out past the frame under a framed camera.
- Layer `dist` (camera distance: parallax 1 / dist, haze for far layers). `onTwos` on `style`, a shot or a layer steps characters at 12 fps while the camera stays on ones.
- Acting director (`acting/director.js`): bean `lookAt` (body, head and eyes follow a layer or point, with a spring head snap), reaction `takes` (`double`, `snap`, `jolt`, `blink`), and with acting on: a blink after the cut and on head snaps, a head kick on expression changes and idle fidgets (`acting.blink`, `react`, `fidget`).
- Fixes to the shared path motion: object paths move `fx` and `map` layers again (only their plain lists keep the old meaning), the path position wins over `move.to`, anonymous path layers keep one noise seed (no bob / wobble flicker), creature crowds forward `contact` to their members, and map `fights`, `morphs` and `throws` accept the lon/lat forms (`{ll}`, `{lon, lat}`, `{ll: [...], gc}`) when the map has `geo`.
- `scripts/camera_check.py` validates the new fields; the density lint counts shot sizes and over-the-shoulder framing. New example `examples/camera_acting` (one shot per feature); `examples/painted_bench` now uses an over-the-shoulder shot that punches into an ECU, a follow on the car and a low angle on the crowd.

Painted engine, phase 3: Characters 2.0. Classic specs render as before; the painted look turns acting on.

- Turnarounds: `view` (`front`, `3q`, `side` / `profile`, `back`) and `facing` (`right` / `left`) take timelines; changes turn through the in-between views with a squashed drawing and an automatic hair smear (`turn`). Flips from `move` / `path` get a front-view in-between.
- Arms: IK `reach` to world points, rig-local points or another layer (`target`), arced hand paths with spring overshoot, `stretch` for rubber-hose reaches; new hand shapes `grab`, `wave`, `peace`, `thumbs-up`, counting `one`..`five` via `hand` / `handL` (registry `T.HANDS`). Painted arms and legs are shaded tapered tubes with cuffs and joint creases.
- Body acting (`acting`, default on when painted): automatic anticipation before big pose changes, spring overshoot and settle after them, breathing, weight shift, squash & stretch on jumps, landings and `impact` hits.
- Gaits: new walk / run / `sneak` / `march` cycles with contact, down, passing and up poses, 2-bone legs with planted feet, head nod and counter-swinging arms. Beans walk the common `path` (one implementation, shared with creatures and vehicles) with the stride matched to the speed. `floorY` keeps the painted contact shadow on the floor under fliers; upward `bob` now lifts it too.
- Spring secondary motion in closed form (`T.springLag`): hair, cape, robe hem, helmet crests and ties lag and overshoot; `secondary` scales it.
- Close-up faces (`detail`, automatic on large painted heads): graded irises with highlights, mood-shaped lids and brows, nose and cheek shading, wrinkles, sweat, tears, veins, blush, stubble, mouths with teeth rows and tongue. New expressions `terror`, `disgust`, `awe`, `crying`, `laughing`, `scheming`, `exhausted`.
- Lip-sync: `scripts/lipsync.py` writes a per-frame loudness envelope from a voiceover (FFmpeg + standard library); `lipsync: {src}` maps it to five mouth shapes on twos (`render.py` inlines the file).
- Painted costume detail: fabric weave over robes and outfits, cloth folds that follow the secondary motion, shaded belts with buckles, `patches`.
- With acting, raised near arms draw over the head (`arms-up`, `point-up` stay visible) and held props get sizes that suit them; `holdScale` scales a held prop in any look.
- Hardening: gait phase integrates the cadence over speed changes (no re-phasing on eased paths), switching the reaching arm releases instead of snapping, pinned beans can reach world layers, `turn` / `acting.turn` settings apply to motion flips, impacts are clamped, cloth folds respect layer opacity, `--gate 0` keeps silence silent, external lip-sync envelopes are validated, and malformed or non-finite Characters 2.0 values are reported instead of crashing.
- `examples/characters_v2` (one shot per feature) and livelier face and crowd shots in `examples/painted_bench`.

Painted engine, phases 0 and 1: a density lint and the paint core.

- `style.look: "painted"` (or `look` per shot): light-relative multi-tone shading for every filled `T.outlined` shape (deep band, shadow band, lit base, airbrushed falloff, rim light), heavier ink on the shadow side, contact shadows under characters and under the head, paper tooth in the grain. Classic stays the default and renders as before; lettering and UI stay flat (`painted: true` opts a layer in, `painted: false` out).
- `style.light` / `shot.light`: `dir`, `color`, `rim`, `ambient`, `intensity`.
- Painted places: sun bloom, deeper zenith and horizon haze, 3-tone clouds, textured hills and ground with tufts and occlusion, surface textures per background kind (plaster, wood planks and floors, carpet, cobbles, water, parchment) and a wall-floor occlusion band.
- New layer fields `atmos` (atmospheric perspective, works in both looks) and `contact` (ground shadow).
- `base/textures.js`: seeded, cached texture tiles `grass`, `wood`, `stone`, `brick`, `plaster`, `fabric`, `paper`, `water` and `T.fillTexture`; `base/shade.js`: `T.paintState`, `T.shadeFill`, `T.inkUnder`, `T.inkStroke`, `T.contactShadow`.
- Grades `dusk` and `overcast`.
- `scripts/density.py`: `spec.py` prints non-fatal warnings for shots under 4 layers (title cards excepted), `void` backgrounds, characters without a foreground element, and 3+ consecutive cuts at the same camera zoom.
- `examples/painted_bench`: one dense painted shot per scene type (interior, street, landscape, map, globe, face close-up, vehicle, crowd).

Maps 2.0: real geography.

- Bundled Natural Earth geography (public domain): 1:110m and 1:50m countries with shared-arc borders, lakes and rivers, about 265 KB in `scripts/engine/lib/maps/geo-data-lo.js` / `geo-data-hi.js`, rebuilt by `scripts/build_geo.py` from the raw downloads.
- Map `geo: {proj, center, span, zoom, rotate, radius}` with `equirect`, `mercator` and `ortho` projections; `center`, `span`, `zoom` and `rotate` take `[{at, v}]` keys, so a globe spins to Europe and zooms in. The globe sits on a twinkling starfield with an atmosphere glow, sphere shading and an inked rim; `graticule` draws latitude and longitude lines.
- Regions by ISO code (`iso: "FRA"`, groups `iso: ["ESP", "PRT"]` merged into one outline, `continent`), custom historical territories as `lonlat` rings (hand-drawn wobble, clipped to the real coast), `labelAt`. Faces, labels, conquest, wipes and every region effect work on them; overlay points take `{ll: [lon, lat]}`, `{ll: [...], gc: true}` (great circle) or `lon`/`lat` keys, and lon/lat `arrows` bow along the great circle.
- `style: "painted"` for every map: mottled brush-textured sea, concentric coast ripples, land on a deep inked drop side with a bevel and paper grain, painted region slabs, highland and desert tint (`relief`, `lush`), mountain glyphs with snow caps and hill humps along 29 built-in ranges (`ranges`, `mountains`), rivers by name, plus `compass` and wooden `signs` overlays.
- Animated conquest: region `flood` (organic boiling front from a lon/lat point, shared across all parts of a group), `drawOn` (border traced with a pen, then the fill fades in), `wipe.dir` (a straight edge sweeping `left`, `right`, `top`, `bottom`, a vector or an angle).
- The validator checks map `style`, `geo.proj`, `geo.ranges`, `geo.detail`, `iso` codes, `lonlat` rings and lon/lat cover origins. New example `examples/geo_maps` (Europe 1914, globe spin, Mediterranean flood, warring states of China, an Atlantic crossing, a border drawn and wiped).

Painted engine, phase 7: props and FX 2.0.

- Closed-form particles: `fx` kind `particles` with 14 presets (`smoke`, `dust`, `sparks`, `fire`, `embers`, `steam`, `splash`, `rain`, `snow`, `debris`, `confetti`, `leaves`, `bubbles`, `gas`) and fields `rate`, `spread`, `life`, `gravity`, `wind`, `dur`, `burst`, `prewarm`, ...; every particle is a pure function of (seed, index, time). Painted rendering: soft lit puffs and additive glows.
- Impact language: `impact-frame` (1-6 frame `invert`, `flat` poster or `flash` hit frame), `streaks`, `shockwave`, `dustkick` (fires on a target's landings), `toxic-cloud`, `aura`, and the layer field `trail` (motion smear on any layer).
- Under the painted look `smoke`, `fire`, `explosion`, `dust`, `puff` and `gas` are repainted with particles; `bottle`, `crate`, `barrel`, `coin`, `moneybag`, `sack`, `hourglass`, `bulb`, `book`, `scroll`, `sword` and `shield` get materials, and standing props get contact shadows. Classic frames are unchanged.
- Materials API: `T.matGlass`, `T.matLiquid`, `T.matMetal`, `T.matWood`, `T.matFabric`, `T.matPaper`, `T.matStone`, `T.matLeather`.
- 37 new props: lab glassware (`flask`, `round-flask`, `beaker`, `test-tube`, `tube-rack`, `retort`, `burner`) with liquid levels, bubbles and fumes; `book-stack`, `paper-stack`, `coin-pile`, `banknotes`, `gold-bars`, `amphora`, `apple`, `cheese`, `fish`, `chair`, `stool`, `oil-lamp`, `lantern`, `inkwell`; `hammer`, `wrench`, `saw`, `shovel`, `pickaxe`, `anvil`, `axe`, `bow`, `pistol`, `musket`, `cannon` (guns `fire` with flash, smoke and recoil); machines with moving parts `gears`, `piston`, `gauge`, `valve`, `fuel-pump`.
- Painted paper: aged sheets with folds, stains and grungy stamps (`folds`, `stains`); new doc kinds `front-page` and `letter` (handwriting that writes on, signature, wax seal).
- `examples/props_fx_v2`: a 12-shot catalog of the above.

Phase 6, creatures and vehicles 2.0:

- `path: {pts, at, dur, ease, curve, orient, face, bank, loop}` on any layer (`creatures/motion-path.js`): constant-speed motion along smooth, linear or bezier curves (looping beziers close smoothly) with ease, facing the direction of motion (reversing eases turn the layer round), `orient`, `bank` and `loop`; `T.layerTravel` gives the signed distance the rig walked or rolled along `path` or `move`.
- v2 creature rigs: gait tables with planted feet (walk, trot, gallop, auto by speed), 2-bone IK legs, states `idle`, `eat`, `sleep`, `scared`, `sit`, toon eyes by `expr`, lagging tails and manes, riders with saddle, bridle and reins. Upgraded `horse`, `cow`, `bull`, `sheep`, `pig`, `camel`, `elephant`, `dog`, `wolf` (painted look or new fields); new `cat`, `bear`, `rat`, `chicken`, `bird` (`flock`), `fish` (`school`), `snake`.
- v2 vehicles: wheels and rods driven by distance, terrain suspension, world-space smoke / exhaust / dust / steam / wake trails and contrails, headlights, ships on a swell. New `model-t`, `sedan1920`, `car1950`, `car-modern`, `chariot`, `wagon` (animal teams), `locomotive`, `ship`, `sailship`, `plane`, `zeppelin`, `balloon`, `rocket`; `tank`, `train`, `biplane`, `submarine`, `car1910` upgrade in the painted look.
- Animals kick up dust when running on dirt (`dust`); contact shadows stay on the ground during jumps; organic silhouettes (jointed tapered legs, thigh contours, wool, fur clumps, hump, knee wrinkles).
- Classic specs render pixel-identical; `rig: "classic"` / `"v2"` forces a rig.
- `examples/creatures_vehicles_v2` (12 shots); the painted bench vehicle shot now drives a wagon and a Model T along paths.

Painted engine, phase 2: Places 2.0.

- Modular set kit: bg kind `set` (`wall` plaster / brick / wood / stone / wallpaper / tile, perspective `floor` wood / stone / tile / carpet / dirt, `dark`, `parts`) with 29 painted parts (window with light shaft and dust, door, arch, column, roof beams, stairs, fireplace, curtain, painting, lamp, chandelier, banner, pipes, shelf, cabinet, rug, table, desk, chair, bed, plant, clock, throne, bench, flasks, crates, globe) and presets `throne`, `lab`, `courtroom`, `library`, `tavern`, `study`, `office`; layer type `set` places the same parts in front of the characters.
- Depth planes: `parallax` on any background scales the depth between its planes (old kinds too); far planes of the new kinds carry atmospheric `haze`. In the painted look static planes are cached in offscreen canvases (deterministic keys) and animated details draw live, so the painted film got faster (film backgrounds 38 -> 31 ms/frame at scale 0.5).
- New landscapes: `hills`, `woods`, `river` (and `coast`), `dunes`, `ancient`, `castle`, with swaying trees and grass, glints, surf, blowing sand, smoke and fluttering banners.
- Richer painted versions of `office`, `stage`, `street1920`, `factory`, `gallery`, `sky`, `mountains`, `room`, `studio`, `corkboard` and `parchment` (same fields; classic look pixel-identical).
- Painted fg framing: `foliage`, `column`, `window-frame`, `silhouettes`.
- `examples/painted_places` catalog; `painted_bench` interior, street and landscape shots use the new sets.
- Review fixes: a `set` layer follows its own `move`/bob/entrance; painted surface overlays keep their background's `parallax`, and parallax no longer leaks into nested screen shots; painted fg framing (`column`, `foliage`, `window-frame`, `silhouettes`) anchors to the visible strip in vertical films; `wall: false` / `floor: false` validate; malformed set enums, non-finite part geometry and bad presets of the new landscapes are reported instead of crashing or rendering; `street1920` / `factory` honour a custom `haze` colour; animation inside a set part (fire, candles) stays behind parts listed after it.
- Richer painted `corkboard` (cork granules, pinned clutter, red yarn, frame), `parchment` (ruled lines, ornament border, aged edges, burnt corners), and new painted `battlefield`, `trench` and `harbor`; vegetation on sunset hills stays green.

## 3.6.0 · 2026-10-15

More pictures, more examples and a reproducible showcase.

- Twelve story films in `examples/story_*` on non-historical topics, each with a storyboard: the moon race, a vaccine, a museum heist, a banana-peel investigation, a startup, the simulation hypothesis, a disputed island, the emu war, a lighthouse horror, a volcano and two 9:16 shorts (cats and gravity, honey that never spoils).
- The catalog films demo every feature added since 3.2 (43 new shots): transitions `burn`, `swarm`, `swirl`, `pixelate`; `glitch` styles; `fg` `aperture`; vertical `fg-pass`; `title` `arc`; `panel` photo and circle; grades `mono` and `negative`; fx `crack`, `petrify`, `pile`, `hatch`; `doc` `chat` and `tierlist`; `hud` `ecg`, vertical `meter`, `carousel` `snap`; `cctv` camcorder; props `claw-crane`, `rosette`, `meat-bone`, `bucket`, `meat-grinder`, `cobweb`, `banana-peel`, `region`, `coin-gavel`, `iso-tile`; map `fights`, `throws`, `morphs`; bg `grid`, blueprint erase, time-lapse keys and `accel`; `smear`, `dropShadow`, `redeyes` `close`, `xray`.
- `examples/character_sheet` now shows every expression (35), pose (65), headwear (58) and outfit (29), plus ages and builds.
- `scripts/make_media.py` rebuilds every README picture from `assets/media.json` (GIFs render without film grain, which triples GIF size); a test keeps the manifest, the README and `assets/` in sync.
- `gallery.html` ([live](https://hostlife22.github.io/toon-explainer/)) shows every picture full size with buttons to its spec, storyboard and contact sheet, with filters and search. `scripts/make_gallery.py` writes it from the manifest and the README captions; `.github/workflows/gallery.yml` publishes it to GitHub Pages when pictures, specs, storyboards or the generator change on `main`.
- README: a new hero, 12 story GIFs, 29 new feature GIFs, all older GIFs re-rendered with the current engine, contact sheets for all 31 examples, and current counts. Unused pictures were removed.

## 3.5.0 · 2026-10-15

The last open caveats of the technique library.

- `blueprint` sketches can be erased mid-shot: an item's `out` fades it over `eraseDur` (0.15 s), and `bg.clear: [t, ...]` wipes everything drawn before each time.
- `hud` `carousel` `snap: true`: the instant mode, where the position jumps in one frame, the arrows flash and the picked card gets a red frame.
- Background `grid` (a perspective floor grid, "the simulation" look) and `fx` `hatch` (a cross-hatch net closes over the frame, with an optional colour `wash`, for a render "collapse").
- Props `cobweb` (corner web, optional spider), `banana-peel` (ground prop) and `region` (one map region as a standalone prop with a seeded coastline, a raised edge shadow, an optional `face` and `label`).
- Map `fights`: a brawl cloud that travels along a `path`, with heads, dust, route `trail` and `drops`.
- Sky `timelapse` takes `dayDur` keys (`[{at, v}]`), `accel {from, to, over, at, ease}` and a start `phase`; the phase is integrated on a fixed grid so frames stay order-independent.
- The validator checks the new fields (`fights` path, dur, ease and counts; `hatch` spacing; `dayDur` keys; `accel` ease; `blueprint` `clear`; `cobweb` corner; `region` points).

## 3.4.0 · 2026-10-15

The remaining asset and detail gaps from the technique library.

- Props `claw-crane` (lowers a `load`, releases it, rises), `rosette` (award badge; the text wraps to fit), `meat-bone`, `bucket` (held, or worn `upside`), `meat-grinder` (crank windows, `feed`, an extruding sausage).
- Bean `smear`: a hair and headwear smear on a sharp turn (about 10 frames, settled by frame 14).
- Map movers (`tokens`, `figures`, `squads`, `camps`, `routes`, `trails`) take `drops`: marks dropped along the path every N seconds that can turn into smoke; new map icons `blast` and `dot`.
- `fx` `cctv` `variant: "camcorder"` (REC, running timecode, battery, crosshair); `hud` `meter` `orient: "vertical"`; `fg-pass` `axis: "vertical"` (a figure rises or drops across the frame).
- The validator checks the new names and shapes (crane `load`, grinder `feed`, `drops` icons, `smear`, `fg-pass` `axis`).

## 3.3.0 · 2026-10-15

Every technique the reference study had marked "needs code" or "needs asset" is now in the engine. The technique library has no open NEEDS entries left; a few minor drawings are still noted inside individual entries.

### New engine features

- Transitions: `burn` (a charred, flaming edge), `swarm` (bats or birds close the frame), `squeeze` (collapse to a line, blurred pull-back) and `carry` (an inset or badge grows into the next scene). `glitch` gains `style: "corrupt"` (row tears, bottom black-out) and `style: "stepped"` (black, grey, white), plus the looks `tear`, `blackout`, `black`, `gray` and `white`.
- Full-frame overlays: `fx` `crack` (cracked glass) and `petrify` (the frame turns to stone in two stages).
- Fills: `fx` `pile` (objects pour in and bury the frame) and `flood` (liquid rises from the bottom).
- Maps: overlays `throws` (icons thrown along an arc with wind-up and impact) and `morphs` (a line morphs between two shapes).
- Screens: `doc` `chat` (messenger thread with typing bubbles), `doc` `tierlist`, `hud` `ecg` (heart monitor that can flatline), and `grow` for one bar of a bar chart.
- Characters, props and lens: `redeyes` `close`, the `xray` layer modifier, `fg` `aperture` (a dark frame with a window), `title` `arc` (lettering on a curve), and the props `coin-gavel` and `iso-tile`.

### Vertical format

- Only the visible strip is drawn and pixel-graded: a vertical frame now costs about 15 % more than a landscape one, instead of about 50 %.
- Text wider than the visible frame shrinks to fit (`fit: false` keeps the size), and the vignette is centred on the strip.
- An `fx` in `pinned` may target a world layer and follows its camera and frame.
- A `panel` showing a vertical shot shows it as framed by that shot's `frame`.

## 3.2.0 · 2026-10-15

A third study covered twenty reference videos: the eight long films again plus twelve vertical shorts. Every frame was decoded (403,452 frames) for cut and stillness measurements. All 262 contact sheets (every 2 s for long films, every 0.5 s for shorts), 77 shot sheets and 274 native-fps frame strips were viewed, and sponsor reads and third-party footage were logged and excluded. The results became a directing method, a technique library indexed by purpose, a vertical format and corrected measurements.

### Directing and library

- `references/09-directing.md`: topic → central question → arc → meaning events → visible actions → characters and locations → timing → check → render. It adds a shot card (learns / happens / changes / because), scene patterns that combine techniques, a pre-render checklist and five worked transfers to non-historical topics.
- `references/10-technique-library.md`: 160 techniques with video and timecode, observed action, composition and order, measured timing, two non-history transfers and an engine status (supported, composable, needs asset, needs code). It also has a "not to copy" list and the measurements behind the doc corrections.
- `references/11-vertical-shorts.md`: the 9:16 grammar measured on twelve shorts (three bands, fitting wide subjects, hook in the first sentence, density instead of faster cutting, hard-stop endings) and how to build it.
- `references/06-reference-library.md` now records coverage per video, the shorts, source limits and deliberate differences from the reference.

### Engine

- `"format": "vertical"` renders 1080×1920. A strip of the 1920×1080 world is shown; shot `frame` pans it and shot `pinned` layers stay fixed in the frame. Labels, titles and counters keep inside the strip, and corner HUD widgets and `cctv` anchor to it (`T.visibleSpan`, `T.drawPinned`).
- Transitions `swirl` (the shorts' spin cut) and `pixelate`; `whip` takes `dir` (`left`, `right`, `up`, `down`).
- Grades `mono` and `negative`; `panel` frames `photo` (print with a caption margin) and `circle` (locator badge).
- `dropShadow` grows a ground shadow before a `drop`/`drop-squash` lands; `zip.rev` spins leg-wheels before a zip exit; `fire` takes `step` (frames per flame drawing).

### Examples

- `examples/vertical_short` ("Why Ice Floats", 9:16, 51 s) and `examples/money_film` ("Why Printing Money Raises Prices", 16:9, 38 s), each with a storyboard that states its central question and arc.

### Corrections

- Rome cut counts and the "climax median 0.87 s" claim do not reproduce. Shot medians are 3.0–7.1 s across the long films; pace rules now count visual events, not cuts.
- Other measured corrections: still-frame shares, jump-scare stillness, fire redraw rate, smash timing, black-beat lengths, time-lapse acceleration, `joins`/`carousel`/`blueprint` behaviour and the shorts' hooks without title cards.
- The deflation rule in SKILL.md no longer contradicts the atrocity rule in 07-story-craft; the 07 header number is fixed, and the stale doc paths in `scripts/vocab/*.json` point at the toolkit cards.

## 3.1.0 · 2026-10-15

The skill no longer carries version labels in its names. Files, folders, examples and guides are named by what they contain, and the guides follow one numbered sequence plus a folder of toolkit cards.

### Structure

- `references/` now holds the numbered guides 01–08 and `references/toolkits/` with nine cards (characters, acting, props/creatures/vehicles, places, maps, paper and lettering, game UI, FX and tone, transitions and lens). Each card uses one template: when to use it, look and staging, a full field reference checked against the engine, measured timing, recipes, and limits. The former `07-*` and `08-*` guides are merged into the cards; `09-story-craft.md` is now `07-story-craft.md`, and the new `08-toolkits.md` is the catalog.
- The engine's `lib/` is split into domain folders (`base`, `characters`, `acting`, `creatures`, `props`, `places`, `maps`, `paper`, `game`, `fx`, `lens`) with descriptive file names, and the vocabulary files follow the same names.
- Examples are renamed by content (`showcase`, `eras_wardrobe`, `living_maps`, `coffee_film`, …), and the showcase shot ids are now `s01_…`.

### Checks and fixes

- `check_repository.py` fails when a vocabulary name is documented nowhere in `references/`.
- The validator now checks `fx` `target` ids, nameplate `arrowTo`, `who` inside doc objects, map `conquer.by` and `crosses.region`, the nested `obj` prop, vehicle and `arms.hold`, `load.prop`, and the sky `preset` of every sky-backed background.
- Foreground `fg` layers no longer pop in on their first frame; framing is there from the cut.
- A crowd with `silhouette: true` keeps its depth-tinted rows; wing `flap` works on the layer; `tears: "bead"` uses `tearColor`; animals map more expression names; `window-cycle` crossfades correctly for any `period`; region labels are 64 px everywhere; `hangsign` and `graffiti` placeholders are neutral.

## 3.0.0 · 2026-10-15

A second, much denser study of the same eight reference videos: about 12,500 frames at 1 fps, more than 300 high-fps motion strips and the full transcripts, compared feature by feature with v3. The 115 missing techniques found became nine new engine modules, a set of core hooks and a story-craft guide, so an agent can stage most beats of any topic with dedicated tools.

### Core

- Any layer can change fields mid-shot with `swap` (a 1-frame costume, prop or text change), blur with `blur` (number or timeline), tremble with `jitter` and hang with a damped `swing`. Shots get rack `focus` between layers and the background.
- Camera `letterbox` bars, 1-frame cut-in `jump`s and dutch-angle `rot` keys. Film-level `overlays` keep chips, timers and stickers on screen across cuts.
- Grades can be a list of timed entries (trauma cycles, red flashes) and can target only the background.
- New registries for modules: `T.LAYER_MODS`, `T.ENTERS`, `T.POSES`, `T.BUILDS`, `T.EXPR`, eye, mouth, brow, hair and beard kinds, face extras, `T.GRADE_PRESETS`, map views, region hooks and overlay order. `T.subShot` renders one shot inside another; `lib/shared4.js` adds clouds, starbursts, thick arrows and cartoon gloves.
- 46 new poses (kneel, sit, lie, crawl, fly, hug, handshake, beg, throw and more) with real leg modes, `antic` anticipation, and `build`/`age` proportions (child, toddler, baby, elder, brute, fat, thin, muscle).

### Characters (`08-chars.md`)

- Characters v4: 18 new expressions (`grimace`, `star-eyes`, `sparkle`, `hollow`, `side-eye`, `smug-closed`, `squeeze`, `menace`, `wail`, `bruised`, `jaw-drop`, `sleep-drool`, `dollar`, `heart`, `vision`, `roar`, `dying`, `cute`) with new eye, mouth and brow kinds usable through `eyesOverride` / `mouthOverride`.
- Face gags as look fields: growing liar `nose`, tear `stream`/`drop`/`bead`/`joy`, `blush` squiggle/hatch, `dread`, `gloom` drips, `mouthTape`, `bruise`, `bandage`, burglar `mask: "eye"`, `glasses` (sun/shutter/round), `monocle`, forehead `label`, devil horns.
- Body accessories: name `badge` (hello/tag/plank, with `badgeSwap`), rope `sign`, slap-on `stickers`, `stains`, generic `bowtie`; `wings` (bird/angel/insect, `flap` windows, wax `melt`), `devil` tail and the `halo` hat.
- Ages and builds now look the part: swaddled babies, toddler diapers, elder wrinkles, brute pec/ab plates (`bare`, `plates`), fat belly, muscle V-torso; child builds get bigger eyes and `arms: false` hides arms.
- Wardrobe v4: 29 headwear kinds (from `mianguan` and `imperial-helmet` to `hard-hat`, `clown-wig` and `bucket-helmet`), 20 outfits (`toga`, `cuirass`, `habit`, `frockcoat`, `labcoat`, `overalls`, `jersey`, `rags`, `stripes`, `cow-suit`, `gown`, ...), 7 hair kinds and `beard: "bushy"`.
- New `topbean` layer: an overhead character that paces (`walk`, snapping `facing`), lies spread-eagle (`lie`) and wears its crown or helmet from above.
- `TOON.drawMiniFace` gives objects, suns and regions the same faces as the beans (used by the `obj` layer). Guide: `references/08-chars.md`; showcase: `examples/v4_chars`.

### Acting and gags (`08-acting.md`)

- New `arm` layer: an off-screen arm reaches in from a frame edge to shove, grab, punch, stamp or hand something over. Kinds are `rubber`, `hand` (giant forearm with a labelled gold bracelet), `glove-spring`, `glove-piston`, `foot` and `hook`. `take` lifts other layers out of the shot, and `hold` puts a prop in the hand.
- New `poof` fx: a boiling cloud covers a one-frame `swap` (X becomes Y) or a vanish. The `column` mode is for running away.
- New `hat` fx: headwear drops onto a head, passes from one head to another, flies off on a startle, or stacks up for "he held every office".
- New `marks` fx for micro-acting around a head: shout jags, realize ticks, notice fan, zzz, stress drips, gloom lines, stink, whoosh, ?/!, scribble. Also new `sweat-spray` and `tear-stream` emitters.
- New "no X" sign as the `prohibit` fx (ring pop, then a bar wipe) and as a static `prohibit` prop with an icon underneath.
- Eight measured entrances and exits: `tumble` (shove launch that can knock the hat off), `zip` (dust trail), `ground` (pop out of a hole), `peek`, `stretch`, `spit`, `silhouette-in` and `pivot-fall`.

### Props, objects, creatures and vehicles (`08-props.md`)

- New `obj` layer: give any prop, vehicle or built-in shape (`blob`, `disc`, `globe`, `heart`, `footstool`) a face, white tube arms with gloves (`flex`, `wave`, `point`, `hold`, `crossed`, `punch`, `sprout`), legs, a hat, a bandage or cracks.
- Signpost family: `signpost` (arrow planks, stacked joke planks, a `turn` spin that lands on a new name), `fork-signs` and a chasing-bulb `marquee-arrow`.
- Furniture and enclosures: `throne` (with chains and a note), `bed` with a cast occupant, `lectern`, `easel` with a crashing chart, `deckchair`, `coffin`, `crib`, `dinner-table`, `armchair`, and the `cage` drop, `door` slam / open-on-fire, `gate` slam and `portcullis`.
- 30 handheld gag props: sack, bottle (pours), candle, key, broom, magnet (attracts), phones, megaphone, magnifier (reveals hidden layers), scissors, mallet, dagger, boxing glove, chain, coin heap, binoculars, white flag, cleaver, bandage, pitchfork, whistle, remote, big button, bowling ball and pins, chess pieces (topple), ice block.
- Screens that show another shot: `crt` with a pull-back from full frame, `monitor`, `smartphone`. A door can also open onto another shot.
- Time and chance props: `wall-calendar` (days crossed off), `window-cycle` (day / dusk / night), `clock`, `prize-wheel` (deterministic spin), `coin-flip` (flips, lands, splits). Emblem and stat props: extruded `emblem3d` that drops and topples, and a `stat-block` nametag cube with a companion.
- New creatures: wolf, dog, elephant (war tower), pig, rabbit, turtle, goat, snail, kangaroo, with stand, sit and biped (`hold`) poses.
- New vehicles: galley with rowing oars, bicycle with a pedalling rider, dump truck that tips its riders out, helicopter with a swinging cable load.

### Places (`08-places.md`)

- New `mood` background: emotion backdrops for reaction close-ups and intros. The `rays` burst v2 has ten presets (gold, green, blue, purple, yellow, crimson, cyan, lime, a two-sided `split` and `rainbow`), plus `swirl`, `vortex`, `smoke`, `bokeh` with petals, `splat`, `grunge`, `streaks`, `action`, `nebula`, `ornament` and `collage`.
- New `palace` throne hall in four variants: Roman ochre, East Asian red lacquer with glowing lattice windows and lanterns (also at `night`), Minoan polychrome, and a gothic one-point hall with a red carpet. It has a tufted throne, polished floor reflections, light shafts with dust, and optional near columns.
- New `burning` background: an inferno plain, a city burning on a hill, or a burning palace roofline, with a drifting smoke ceiling and flames that redraw on twos.
- New `studio` sets (game show, quiz with a live screen, news desk with a skyline, courtroom, auction with pop-up paddles, podcast, classroom) and `room` interiors (gamer room with a CRT and neon sign, living room, bedroom whose lamps switch off, hospital, worn parlour). The `screen` field shows another shot live inside TVs and screens.
- New top-down `floor` (planks, tiles, rug, grass, flowers, dirt, coffers, water, stone) with window light patches, top-down furniture and a rotation timeline for overhead shots.
- New `cell` dungeon (barred light shaft, torch, foreground bars), `harbor` pier (sunset, day, night or fog, with a moored ship), night `alley` (fire barrel, lit windows, snow), and `antique` sets (colonnade, balcony balustrade, temple square, bath).
- New `parchment-panel` for engraving backstories, `corkboard` for conspiracy plans (labelled notes, pins, red strings that draw themselves), and `vehicle-interior` (train, bus or plane) with scenery scrolling past the window and poles flashing by.
- New fg kind `bg-front` redraws a background's foreground plane (benches, desks, podiums, bars, balustrades, sofa, blanket) over the characters, so figures can stand behind it. The guide is in `references/08-places.md` and the tour is in `examples/v4_places`.

### Maps (`08-map.md`)

- Map views: `view: "tilt"` (perspective board with depth, skew and a pan glide), `"globe"` (planet horizon under a starry sky, or a full spinning globe) and `"tabletop"` (paper map on a war table with folded corners and an optional burnt edge).
- Living regions: `split` (crack, two faces, punching arms), `shatter` (Voronoi pieces fly apart), `slash` (stitches and a wound spilling money), `engulf`, `wipe`, `drift`, `peel`, blotch conquest (`conquer.pattern: "blotch"` with rays) and `annex` colour flashes.
- Region states: persistent `damage` (black eye, x eye, bandage, crack), `surrender` white flag, border `fire`, and new face moods `plead`, `hearts`, `pipe`, `dollar`.
- Cast `figures` stand on the map as stickers: pop/stretch/drop entrances, walking paths that paint territory, thrones and beds, puppet strings with a yank.
- New overlays: relation `arrows` (flat, block, hook), fight-cloud `brawls`, scattered `fires`, dashed `trails`, railway `tracks`, `forts`, army `camps`, marching `squads` that repaint a region, `flags`, hopping `coins`, brush `xmarks`, `barriers`, `words` lying on the map (plus river labels), slamming `drops` (bandage, stamp, giant foot), `tacks` and a gloved `hand`.
- New map icons: fort, camp, formation, factory, derrick, plane, church-hut, rubble. Showcase: `examples/v4_map/spec.json`; guide: `references/08-map.md`.

### Lettering and paper (`08-docs.md`)

- `doc: nameplate`: rank, big, hand-lettered and slanted name labels with curved hook arrows that point at a bean (`arrowTo: "<id>"`), strike-and-rename, pronunciation sub-line, typed bullets, bottom-left or above-the-head anchoring and fade-to-ghost.
- `doc: timeskip`: "N YEARS LATER" cards (black card with a slow linear drift, red brush letters on a white cloud, or an inline caption).
- `doc: pictobubble`: speech, thought and shout bubbles holding icon rows with arrows and prohibition strikes, a live mini scene from another shot, a list that grows per beat, or a nested thought bubble.
- Number cards: `statstack` (counting statistic lines that stack up), `unitcards` ("x N" portrait counters), `bigyear` (3D gold year punch with a fading ghost) and `band` (translucent caption band with sequenced, retiring items).
- `doc: graffiti`: brush, paint and blood lettering on brick, parchment or plaster, with a paint-roller cover, an eraser, a brush rewrite, gloves, a reddening wall and a thumbs-up.
- Verdict papers: `scorecard` (true/false table with drawn marks and a stamp), `tally` (scribbled fake number on an easel), `list` (strike, retitle, ticks, inserted heading, pencil hand, spilling scroll) and `crayon` (child's plan with recolor and a scissors cut).

### Game UI parodies (`08-game.md`)

- New `hud` layer (game-UI kit, `gameui.js`): `notice` system log, `meter` hazard bar with warning blink and overload shake, `counter` pickup tally, glitching `warning` banner, pixel-style `score` popups, `hearts` survival row with hunger and hotbar, `marker` player tag that follows a layer, `chip` quest tracker whose X flips to a check at `answerAt`, and a seven-segment `timer-lcd` speedrun timer. Chips and timers persist across cuts through `spec.overlays`.
- New `cursor` layer: an arrow, hand or grab cursor that follows an eased `path`, with click squash and rings, a drag-select marquee, `then: "delete"` with a pop burst, `carry` (a copy of a layer moves with the drag) and RTS `select` ellipses.
- New splash-card `doc` kinds: `versus` (sunburst or jagged split, eye glow), `sequel` torn title strips, fighting-game `challenger` intro, and the `joins` "joins the battle" splash.
- New game-screen `doc` kinds: `menu` with a hopping hand cursor, `pause` (plank signs, mirrored option), `loading` spinner, `insert` disk card with dripping numeral, `wheel` weapon wheel, `carousel` item cards, RPG `dialog` typewriter box, OS `error` popup, strategy `upgrade` button with cost tags, `killfeed`, `highscore`, `meanwhile` collage, `tbc` cliffhanger and the `trade` offer panel.
- New `slides` doc: a presentation window that clicks through frozen frames of other shots (`T.subShot`, cached) to fast-forward through decades.

### Effects, materials and grades (`08-fx.md`)

- Layer modifiers `material` (ghost, stone, gold, engrave, ice), `freeze`, `sticker` and `split` work on any layer and can be swapped in within one frame (statue reveal, ghost return, ice block, die-cut map stickers, a heart that breaks with a "BETRAYED" ribbon). Ghost beans get a swaying wisp tail instead of legs.
- New `brawl` fight-cloud fx with boiling limbs, weapons, helmets, stars and an optional travel path. `T.drawBrawl` is exported for map brawls.
- Blood stand-ins `blood-wipe`, `blood-streaks`, `blood-splash` and `pool`, plus `spill` for wine or ink stains that can flood the frame.
- Mob silhouettes (`fg: mob`) with pitchforks, torches, spears, scimitars and banners rising from below, and `shadow-hands` closing in.
- `shock` (x-ray electrocution cycle), `disintegrate` (shards to an ash pile), comic `boom` (puff, mushroom and full-frame interruption card), `onomatopoeia` with a score popup, and `word-shatter`.
- Rivalry and light kit: `crackle`, `beam-clash`, `duel`, `lightpool`, `shafts`, `godbeam` and `spotcone`. `memory` adds ghosted flashbacks and dark-thought faces.
- Twelve new grade presets: rage, inferno, golden-hour, moonlit, night-violet, gaslight, pink, purple-neon, crt-cyan, dusk-blue, red-flash and sunset-epic. Guide: `references/08-fx.md`. Example: `examples/v4_fx`.

### Transitions, panels and POV masks (`08-lens.md`)

- 13 new transitions measured on the reference videos: `cloud-wipe` (with a `word: "POOF!"` cut), `drip` (blood / censor curtain), `black-beat`, `curtain`, `explosion-wipe`, `wave`, `bubble-wipe`, `portal`, `screen-dive`, `fg-pass`, `spin-zoom`, `glow-open` (with `mode: "push"`) and `vignette-close`.
- New `panel` layer shows other shots of the film inside the frame: split screen with a straight, slanted or jagged lightning seam, a VS badge and name labels; comic grids with tilted cells; picture-in-picture; and a framed shot in a gilt painting, a CRT TV or a phone.
- Panel cells play live or freeze on a punchline frame (`t`), crop with `focus`/`zoom`, slowly push in, and slide in from the nearest edge with a stagger.
- New POV masks for `fg` layers: `binoculars` (plus a `reflect` mode where the scene shows in the lens fronts), `spyglass` and `eye-pov` with blinks, a wake-up and a white bloom. Masks drift handheld and lag behind camera pans.

### Fixes

- Map region faces on the left half of a map blinked constantly; angry and sad brows were swapped; halftone regions ignored conquest and recolor.
- `fx: blood` could never draw its splat (the shape now comes from `shape`, since `kind` is always `blood`).
- The shout speech bubble consumed random numbers inside its outline path, so fill and stroke disagreed. New tests catch this class of bug in every example, along with frames that depend on render order.
- A custom `skin` now gets a matching 3/4 shadow instead of the default pale one.
- `render.py` fails when an engine script or asset fails to load instead of rendering with missing modules.

### Tooling

- Map regions accept a `blob: [cx, cy, rx, ry]` shorthand; HUD counters format numbers with `sep` or `compact`; overlays can skip shots with `hideIn`; lettering stays sharp during rack focus.
- The validator checks the v4 fields (`swap`, `blur`, `jitter`, `swing`, shot `focus`, `overlays`, grade lists, `build`, `age`) and catches tree heights given in pixels.

### Docs and examples

- New `references/09-story-craft.md`: measured pacing, hooks and frame stories, comedy devices, dark-beat rules, a motion timing table and a sentence-type to shot-recipe table written in engine vocabulary.
- Nine new guides `references/08-*.md` and nine example films `examples/v4_*` with one shot per feature.

## 2.0.0 · 2026-10-15

Seven more reference videos studied frame by frame (China, the Reconquista, World War I, the road to World War II, a speech fact-check show, a Greek myth and a horror biography), each turned into a toolkit so the engine can make films on many topics.

### Characters and creatures

- Moved headwear into the `T.HEADWEAR` registry and added 22 kinds: WWI and WWII helmets, officer caps, kepi, fez, ushanka, great and nasal helms, turban with veil, top hat, bowler, fedora, beret, safari, newsboy cap, graduation cap, jester, straw cone, official cap with fringe and Qing hat.
- Added outfits (suit, tunic, greatcoat, hanfu, kimono, lamellar, surcoat, hivis, skeleton) with medals, puttees and shoes; head modes for national-flag heads, gas masks, face tints, bull and skull heads; the `mad`, `evil` and `sick` expressions; long and walrus beards; the queue hairstyle.
- Added the `creature` layer: horse, bull, cow, camel and sheep with walk and gallop cycles and riders; reaper, raven, dove and skeleton. Crowds gained lineup and cavalry modes.

### Places and vehicles

- Added 23 backgrounds, from trenches, battlefields, seas and stone corridors to horror voids, offices, graveyards, East Asian cities, karst mist, galleries, blueprints, stages, bars, hospitals, factories, 1920s streets, Minoan halls, Olympus and chalkboards. Skies gained sepia and overcast presets, paddy ground and a day/night time-lapse.
- Added the `vehicle` layer with 11 kinds, 9 foreground kinds and 21 props.

### Graphics and maps

- Added the `doc` layer with 17 kinds (newspaper, document and checklist, stamp, chart, bubble, TV, ID card, poster, quote, stat, year sign, hanging counter, name tag, ribbon, news lower third, mission card), the `timeline` HUD and karaoke `subtitle` with flagged words.
- Rebuilt the map (`mapx.js`): atlas style, region ids, faces and weapon arms, conquer floods, annex and strike-label states, fronts, routes, tokens, burning cities, crosses, armies, punch cracks, rivers, walls, pencil and year labels. Existing map fields keep working.

### FX, tone and editing

- Added 17 effects including glitch, RGB split, alarm, CCTV, mist, whirlpool, red eyes, wall shadow, eyelids, ink burst, gas, muzzle flashes, shell bursts and flame shapes; per-layer glow, silhouette and line-art modifiers; drop-squash, pop-tilt and slam entrances; 7 transitions; sepia, horror, cold, divine and mono-red grades; per-shot vignettes.

### Docs and tooling

- Added the reference library (`06`) with a topic → toolkit matrix and rules for dark material, and four v3 guides (`07-*`).
- The validator vocabulary is now split into `scripts/vocab/*.json` per module, and tests compare every registry with the engine.
- Added four v3 example films and a new README showcase.

## 1.0.0 · 2026-10-14

The first release of toon-explainer: a skill for coding agents and a portable Canvas engine that turns a narrated script into a cutout-cartoon explainer video in the style of history and science YouTube channels.

### Script to film

- Added `script2spec.py`: parses a storyboard (`Shot N / Voiceover / On screen`, other languages through a `--labels` file), estimates shot timing from words per minute and writes a skeleton spec plus an SRT file.
- Added alignment to a real voiceover: `--srt` snaps every shot to its first spoken word (difflib word matching, short VTT timestamps, no cumulative drift); `--merge` re-times a filled spec without touching its layers.
- Added a JSON spec contract with a validator (`spec.py`) whose vocabulary is checked against the engine by tests.

### Characters

- Built the bean-head character rig: egg-shaped head, three-quarter, front, side and back views, and a large cool back-of-head shadow.
- Added 14 expressions with brows, mouth sheet, sweat, tears and anger vein, plus a talking mouth that cycles three shapes at about 10 Hz.
- Added two-bone arms with IK targets and glove hands (open, fist, point, thumb). Implemented 19 poses with hold-and-snap timing and a settle squash.
- Added idle rock around the feet, tremble, walk and run cycles on twos, a cape that lags behind movement, and hand-held props in both hands.
- Added costumes: hair masses that cover the back of the head, beards, crowns, laurels, crested helmets, hoods, hats, armor, pleated skirts, sashes, trim and capes.
- Added crowds and army rows: duplicated designs with phase offsets, depth-tinted back rows, marching, cheering and silhouette audiences.

### Scenes and atmosphere

- Added painted skies with streak and cumulus clouds, layered hills with atmospheric fade and rim light, forests in three depths, stone and wooden towns, palace interiors with light wedges, parchment, reaction bursts and image backgrounds.
- Added the foreground framing layer: bushes, canopy, ledge, tall grass, edge trunk, over-the-shoulder head and rubble.
- Added flipbook fire with embers, two-layer rain, corner light beams, bird flocks, smoke, explosions, blood, lightning, arrow volleys, speed lines, splats, spotlights and more.
- Added per-shot color grading (`serious`, `storm`, `night`, `solemn`, `warm`, `gold`) that can fade in mid-shot.
- Added extruded parchment maps with coastal glow, wave marks, growing and receding territories, pins, routes and dot armies.
- Added lettering: name labels with tags and arrows, titles, dates, era tags, counters, timers, cards, signs and a flipping calendar. A safe-frame clamp keeps text in frame, including under camera zoom.

### Rendering and quality checks

- Implemented deterministic frame-by-frame rendering with Playwright and FFmpeg: MP4, PNG stills, per-shot contact sheets, an interactive preview server, parallel workers and voiceover muxing.
- Added a reference-video analyzer (`analyze_ref.py`), a chroma-key tool for AI-generated cutouts (`key_green.py`), repository checks, release packaging and CI.
- Added tests for parsing, alignment, validation, engine vocabulary, determinism, odd render scales, short audio and every example.
