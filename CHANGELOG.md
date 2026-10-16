# Changelog

## Unreleased

Painted engine, phases 0 and 1: a density lint and the paint core.

- `style.look: "painted"` (or `look` per shot): light-relative multi-tone shading for every filled `T.outlined` shape (deep band, shadow band, lit base, airbrushed falloff, rim light), heavier ink on the shadow side, contact shadows under characters and under the head, paper tooth in the grain. Classic stays the default and renders as before; lettering and UI stay flat (`painted: true` opts a layer in, `painted: false` out).
- `style.light` / `shot.light`: `dir`, `color`, `rim`, `ambient`, `intensity`.
- Painted places: sun bloom, deeper zenith and horizon haze, 3-tone clouds, textured hills and ground with tufts and occlusion, surface textures per background kind (plaster, wood planks and floors, carpet, cobbles, water, parchment) and a wall-floor occlusion band.
- New layer fields `atmos` (atmospheric perspective, works in both looks) and `contact` (ground shadow).
- `base/textures.js`: seeded, cached texture tiles `grass`, `wood`, `stone`, `brick`, `plaster`, `fabric`, `paper`, `water` and `T.fillTexture`; `base/shade.js`: `T.paintState`, `T.shadeFill`, `T.inkUnder`, `T.inkStroke`, `T.contactShadow`.
- Grades `dusk` and `overcast`.
- `scripts/density.py`: `spec.py` prints non-fatal warnings for shots under 4 layers (title cards excepted), `void` backgrounds, characters without a foreground element, and 3+ consecutive cuts at the same camera zoom.
- `examples/painted_bench`: one dense painted shot per scene type (interior, street, landscape, map, globe, face close-up, vehicle, crowd).

Painted engine, phase 7: props and FX 2.0.

- Closed-form particles: `fx` kind `particles` with 14 presets (`smoke`, `dust`, `sparks`, `fire`, `embers`, `steam`, `splash`, `rain`, `snow`, `debris`, `confetti`, `leaves`, `bubbles`, `gas`) and fields `rate`, `spread`, `life`, `gravity`, `wind`, `dur`, `burst`, `prewarm`, ...; every particle is a pure function of (seed, index, time). Painted rendering: soft lit puffs and additive glows.
- Impact language: `impact-frame` (1-6 frame `invert`, `flat` poster or `flash` hit frame), `streaks`, `shockwave`, `dustkick` (fires on a target's landings), `toxic-cloud`, `aura`, and the layer field `trail` (motion smear on any layer).
- Under the painted look `smoke`, `fire`, `explosion`, `dust`, `puff` and `gas` are repainted with particles; `bottle`, `crate`, `barrel`, `coin`, `moneybag`, `sack`, `hourglass`, `bulb`, `book`, `scroll`, `sword` and `shield` get materials, and standing props get contact shadows. Classic frames are unchanged.
- Materials API: `T.matGlass`, `T.matLiquid`, `T.matMetal`, `T.matWood`, `T.matFabric`, `T.matPaper`, `T.matStone`, `T.matLeather`.
- 37 new props: lab glassware (`flask`, `round-flask`, `beaker`, `test-tube`, `tube-rack`, `retort`, `burner`) with liquid levels, bubbles and fumes; `book-stack`, `paper-stack`, `coin-pile`, `banknotes`, `gold-bars`, `amphora`, `apple`, `cheese`, `fish`, `chair`, `stool`, `oil-lamp`, `lantern`, `inkwell`; `hammer`, `wrench`, `saw`, `shovel`, `pickaxe`, `anvil`, `axe`, `bow`, `pistol`, `musket`, `cannon` (guns `fire` with flash, smoke and recoil); machines with moving parts `gears`, `piston`, `gauge`, `valve`, `fuel-pump`.
- Painted paper: aged sheets with folds, stains and grungy stamps (`folds`, `stains`); new doc kinds `front-page` and `letter` (handwriting that writes on, signature, wax seal).
- `examples/props_fx_v2`: a 12-shot catalog of the above.

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
