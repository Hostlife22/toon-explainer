# 07 · Game UI
In a word: borrow video-game screens to land a beat: a system log for small events, a hazard bar for pressure, coins and hearts for gains and losses, a cursor that deletes someone, a VS card for a rivalry, a pause menu for an aside, a slideshow to skip decades.

Engine: `scripts/engine/lib/game/game-ui.js` (`hud` and `cursor` layers, game-screen `doc` kinds; the `doc` dispatcher lives in `scripts/engine/lib/paper/paper.js`, persistent overlays in `scripts/engine/core.js`) · Vocabulary: `scripts/vocab/game-ui.json` · Example film: [`examples/game_ui/spec.json`](../../examples/game_ui/spec.json) (26 shots, one per kind, with chip and timer overlays; render with `--sheet` to browse) · Related cards: [06 Paper and lettering](06_paper_and_lettering.md) (the other `doc` kinds, counters, timers), [02 Acting and gags](02_acting.md) (exits that pair with a cursor delete), [01 Characters](01_characters.md) (who / look / pose / expr of busts), [09 Transitions and lens](09_transitions_and_lens.md). Field contract: [03-spec-reference](../03-spec-reference.md); beat-to-shot method: [07-story-craft](../07-story-craft.md).

## ① When to use it

| The narration says… | Use |
|---|---|
| "X left the alliance", "Y joined", a run of small events | `hud` `notice` |
| "Pressure kept building", "debt piled up" | `hud` `meter`, then `warning` at the peak |
| "They collected one after another" | `hud` `counter` + `score` popups |
| "They were running out of everything" | `hud` `hearts` (+ `hunger`, `hotbar`) |
| "This one is us" | `hud` `marker` over a bean |
| Two or three open questions answered later | `hud` `chip` as an `overlays` entry |
| "In quick succession", a montage of rulers | `hud` `timer-lcd` as an overlay |
| "Someone erased him" | `cursor` `drag` + `then: "delete"` |
| "They moved armies like pieces" | `cursor` `select` + `clicks` |
| "He was simply moved elsewhere" | `cursor` `drag` + `carry` |
| "X versus Y" | `doc` `versus` (`seam: "jagged"` for two sides of an argument) |
| "There were three rounds of this" | `doc` `sequel` |
| "Then a new player arrived" | `doc` `challenger` or `joins` |
| Chapter break, "let's pause", "loading the next era" | `doc` `menu`, `pause`, `loading`, `insert` |
| "Which option would they choose?" | `doc` `wheel` or `carousel` |
| "X transformed into Y", inner monologue | `doc` `dialog` |
| "They ran out of money", "the plan failed" | `doc` `error` |
| "They upgraded / reformed X" | `doc` `upgrade` |
| "X was removed by Y", told flippantly | `doc` `killfeed` |
| "It was finally over" | `doc` `highscore` |
| "Meanwhile…" | `doc` `meanwhile` |
| Cliffhanger ending | `doc` `tbc` |
| "X offered Y a deal" | `doc` `trade` |
| "Nothing changed for decades", "let's skip ahead" | `doc` `slides` |

## ② Look and staging rules

- **Flat, not cartoon ink.** Game UI is drawn the way the reference draws it: a cold UI ink (`#1a1a1f`), bevelled buttons (darker bottom band, thin white top line), white caps with a dark outline. Only `meanwhile` and `tbc` use the warm character ink. Do not add outlines or grades to make it match the characters; the contrast is the joke.
- **Screen-locked by default.** `hud` kinds and full-frame `doc` cards ignore the camera; `hud: false` puts them in world space (score popups over a character, a marker that should zoom with the scene). The `cursor` is screen space unless `hud: false`.
- **No entrance needed.** Every kind animates its own entrance, so the default `enter` is `none` for `hud`, `cursor` and `doc`. Adding `pop` makes it pop twice.
- **Safe frame.** Corner widgets sit 40 px (3.5 %) from the edge of the visible frame (in a vertical film, the edge of the 607.5-px strip; see [11-vertical-shorts](../11-vertical-shorts.md)). Default anchors apply only when both `x` and `y` are omitted (per axis for `notice`, `meter`, `counter`, `warning`, `hearts`).
- **Readable sizes.** Labels should be at least 56 px and captions at least 44 px ([05-workflow](../05-workflow.md) QA). Two defaults copy real game UI and are smaller: `notice` 26 px and `chip` 30 px. When the narration depends on the word, raise them: `notice` `size` 44–56, `chip` `size` 34–40 (keep the text short; it grows wide), `counter` 64 or more. Leave decorative chatter at the defaults.
- **Full-frame cards** (`versus`, `challenger`, `joins`, `meanwhile`, `loading`, `insert`) paint their own backdrop; a plain `flat` `bg` is enough. Busts are ordinary beans drawn without legs; `who` and `look` work as elsewhere.
- **Use sparingly.** One game device per beat; two or three per minute of film. The device is a frame around the story, not the story.

## ③ Field reference

### `hud` layer (`"type": "hud", "kind": …`)

Screen-locked unless `hud: false` (`marker` is the exception: world space unless `hud: true`). Values marked "keys" take a number or `[{at, v}]` in layer time.

| `kind` | Fields (defaults) | Default anchor | Effect and timing |
|---|---|---|---|
| `ecg` | `w` 700, `h` 220, `bpm` 70 (constant or `[{at, v}]` through `T.num`), optional `flatAt` (layer seconds), `color` `#3fe07a`, `grid` true; common `x`, `y`, `scale`, `hud` apply | Bottom-right of `T.visibleSpan(env)`, 40 px inset when both `x` and `y` are omitted; auto-fits narrow frames. Explicit `x` / `y` position the strip centre | Deterministic heart-monitor trace scrolls left at 160 px/s. BPM and trace follow the keyed rate. The number counts down linearly over the final 0.6 s before `flatAt`; at `flatAt` it reads 0, the entire trace is flat, and trace, status and beep indicator turn red with a `FLAT` label. The indicator is visual; no audio is generated. `grid: false` hides grid lines. Implemented by `scripts/engine/lib/paper/screens.js`; vocabulary `scripts/vocab/screens.json` |
| `notice` | `lines: [{at, text, color, icon}]` (or one `text` at 0), `life` 1.5, `size` 26, `max` 4, `color` #fff | `x` 0.02, `y` 0.94 (bottom-left of the newest line) | System log. A line slides 30 px in over 6 f on a dark translucent strip; older lines rise one row over 6 f; a line fades over 10 f after `life`; at most `max` lines. `icon` is a prop kind. |
| `meter` | `orient` (`vertical`: the bar stands on the side edge and fills bottom-up; then `w` is the thickness 44 and `h` the length 520; default anchor x 0.06 of the visible frame (also in vertical films), y 0.3; reference: a falling meter beside a personified abstraction in the Zeppelin short), `label`, `labelSize` 40, `labelColor` #e0313a, `value` (0..1, keys), `w` 520, `h` 44, `style` `hazard` / `solid`, `color` (#f5c518 hazard, #5ad84a solid), `warnAt` 0.9 | `x` 0.04, `y` 0.1 (bar top-left) | Pops in over 6 f. Value changes ease (outBack) over 8 f. Hazard stripes scroll 1 px per frame. At `warnAt` or above a red triangle blinks 6 f on / 6 off; at 1.0 the bar shakes ±3 px on twos. |
| `counter` | `icon` `coin` (any prop; `false` hides), `value` (keys), `prefix` `x`, `suffix`, `size` 64, `sep` (`","` or `" "`), `compact` | `x` 0.05, `y` 0.08 (icon centre) | Pops in. Each step pops the number 1.4 → 1 over 6 f and flashes the icon white for 3 f. `compact: true`: 2100000000 → `2.1B`, 340000000 → `340M`, 12000 → `12K`. |
| `warning` | `text` `WARNING`, `tilt` −4, `glitch`, `w` 880, `h` 110, `color` #d8262a | `x` 0.5, `y` 0.2 | Banner with two warning triangles; pop-tilt over 7 f. `glitch: true` slices it into 3 offset bands on twos for the first 0.5 s, then for 4 f every 1.2 s. |
| `score` | `text` `+100`, `sub`, `color` #ffe84a (green #8cf05a), `size` 72, `rise` 40, `pixels` 7, `style` `pixel` / `bold`, `life` 0.8 | layer `x` / `y` | Popup: 0.6 → 1.2 (f4) → 1 (f6), rises `rise` px over 12 f, white squares scatter over 8 f, fades over the last 6 f. `pixel` draws blocky arcade lettering. Usually `hud: false`. |
| `hearts` | `count` 10, `value` (keys, default `count`), `cell` 6, `hunger` (`true`, a number or keys), `hotbar` (`true` = 9 slots, or a number), `selected` 0, `items: [prop…]` | `x` 0.5, `y` 0.95 (bottom centre) | Pixel hearts. A lost heart flashes white for 2 f, then turns grey; the row shakes ±2 px for 8 f. `hunger` adds a meat row; `hotbar` adds inventory slots holding `items`. |
| `marker` | `follow` (layer id, required), `text` `P1`, `color` #d83a2a, `dx` 0, `dy` −40, `size` 1, `delay` 0.33 | above the followed layer | Pin tag that tracks the layer every frame (beans: 1.14 × `size` above the feet, so hats clear). Fades in over 6 f after `delay`, bobs ±2 px at 1 Hz. |
| `chip` | `text`, `key` (word shown in red), `keyColor` #e03030, `corner` `tl` / `tr` / `bl` / `br` (`tr`), `slot` 0, `answerAt`, `size` 30, `w` (auto) | corner, 40 px margin (`x` / `y` ignored) | Quest tracker: slides 40 px in and pops over 6 f. At `answerAt` the status box flips over 6 f from a red X to a green check with a 4-frame white flash. Slots stack 8 px apart. |
| `timer-lcd` | `start` 0, `stop`, `format` `m:ss.cc` / `ss.cc` / `h:mm:ss`, `corner` `tr`, `color` #7ef0a0, `w` 300, `h` 92 | corner when both `x` and `y` are omitted | Seven-segment speedrun timer counting layer time from `start`. After `stop` it freezes and blinks 3 times between full and 35 % (6 f each, never blank), then holds. |

### `cursor` layer (`"type": "cursor"`)

Coordinates are frame fractions; times are layer seconds. Screen space unless `hud: false` (then world space with parallax `z`).

| Field | Default | Effect |
|---|---|---|
| `style` | `arrow` | `arrow` (white OS pointer with shadow), `hand` (pointing glove), `grab` (closed glove). A `hand` shows `grab` while dragging. |
| `path` | – | `[[x, y, t], …]`, eased in-out between points. Without a path the cursor rests at `x` / `y` (0.5). |
| `size` | 34 | Pointer size px (40–48 reads at 1080p). |
| `clicks` | – | `[t…]`: squash to 0.9 for 2 f, white ring grows 10 → 30 px over 8 f. |
| `drag` | – | `{from [0.4, 0.4], to [0.6, 0.6], at 0, dur 0.33, hold}`: dashed marquee (#2a1d17 + white offset line) from `from` to the cursor; the cursor follows the corner, then wiggles ±`wiggle` px on twos for 12 f and holds at `to` unless `path` has later points. The marquee disappears at `hold` (default: 12 f after the drag ends). |
| `then` | – | `"delete"`: 12 f after the drag ends the marquee pops with a white burst (6 f). The engine does not hide the selected layer (see ⑥). |
| `carry` | – | Layer id: while dragging, a copy of that layer moves with the marquee corner. |
| `select` | – | `[{x, y, rx 110, ry 34, at, out, color #5ad84a}]`: RTS selection ellipses, dashed and marching, pop in over 5 f. |
| `wiggle` | 6 | Post-drag wiggle amplitude px. |
| `drift` | 2 | Idle hand drift px (smooth noise); `false` turns it off. |

### Game `doc` kinds (`"type": "doc", "kind": …`)

These share the `doc` layer with the paper kinds ([06](06_paper_and_lettering.md)). Screen-locked unless `hud: false`; they assume the layer sits at the centre (default) and scale with `scale`. A `bust` side object takes `who`, `look`, `pose`, `expr`, `view`.

**Splash cards**

| `kind` | Fields (defaults) | Effect and timing |
|---|---|---|
| `versus` | `left` / `right: {who, name, look, view, pose fist, expr angry, eyeGlow (true = #ff2a2a, or a colour), eyeX, eyeY, bg #ffb800}`, `seam` `none` / `jagged`, `bg` `burst` / `none`, `vsColor` #fff, `push` 0.02, `size` 1000 | The empty ray burst holds 3 f; the right bust slides in over 5 f with overshoot, the left 2 f later; names in italic caps; "VS" rises 200 px over 8 f. `jagged`: a yellow zigzag seam draws top to bottom over 8 f and each half takes its own `bg`. Then a slow push-in of `push` per second. |
| `challenger` | `who`, `look`, `view`, `pose` `idle`, `expr` `smug`, `title` `CHALLENGER\nAPPROACHING` (`\n` breaks), `titleColor` #f2b01a, `sub` (`''` hides), `color` #d40000, `dur` 3.5 | Black frame; a red disc enters from the right in 2 f, the bust pops 0.9 → 1 over 3 f, the title types in over 2 f in alternating big / small gold caps, the serif sub-line swings −90° → −15° over 12 f. At `dur − 0.6` the bust turns to a silhouette over 6 f, then the disc shrinks over 8 f. |
| `joins` | `name` `NEW PLAYER`, `sub` `JOINS THE BATTLE!`, `who`, `look`, `pose` `arms-up`, `expr` `angry`, `flip`, `size` 900, `whoX` 0.16, `sky` #7ec8f0, `streak` #c8202a | Sky with clouds; 2 white frames, then the name slams 1.3 → 1 over 4 f and the red streak with the sub-line wipes in over 5 f. Hold about 1.5 s. |
| `sequel` | `titles: [...]`, `every` 0.2, `w` 1300, `h` 150, `size` 110, `color` #b0b0b0 | Torn grey strips slam in from alternating sides (5 f, outCubic) with a 3-frame shake on landing; titles in a yellow-to-red gradient. |

**Menus and pickers**

| `kind` | Fields (defaults) | Effect and timing |
|---|---|---|
| `menu` | `title` `MAIN MENU`, `size` 160, `titleColor` #f5c430, `buttons` [`START GAME`, `LOAD`, `QUIT`], `click: [{at, i}]`, `style` (`plank` for wooden planks), `buttonColor` #f3ead2, `textColor` #2a2622, `bw` 520, `bh` 90, `mirror`, `cursor` `hand` | Extruded title pops over 7 f; buttons pop 3 f apart from f4. The hand cursor enters below the first target, hops to each clicked button's right end (10 f, in-out, arriving on `at`) and presses it for 2 f, darkening the button. |
| `pause` | `title` `PAUSE`, `size` 150, `buttons` [`RESUME`, `SAVE`, `MAIN MENU`], `style` `plank` / `button` (`plank`), `dim` 0.5, `mirror`, `click`, `cursor`, `buttonColor`, `textColor`, `bw`, `bh` | Dims the scene, title in hand-placed jittered letters; buttons and cursor as `menu`. `mirror` flips the lettering (the menu seen from inside the game). |
| `loading` | `text` `Loading..`, `full` true, `color` #111111, `size` 1 | 12-dot spinner (r 96 px) turning once per second; the label's dots cycle every 8 f. `full: false` draws no backdrop (e.g. on a TV screen). |
| `insert` | `text` `INSERT DISK #2`, `size` 96, `numColor` #d21f1f, `drip` true, `full` true, `color` #151515 | The last number is red; 2–4 drips grow 30–70 px from its baseline over 0.6 s. |
| `wheel` | `items: [prop | {prop, label}]`, `steps: [i…]` ([0]), `every` 0.4, `size` 230, `activeColor` #2f7fd6, `dim` 0.4 | Weapon wheel. The highlight hard-snaps to the next step every `every` s (no tween); the last pick pulses twice. Label in the centre. |
| `carousel` | `items: [{prop, label}]`, `select: [{at, i}]`, `start` 0, `dim` 0.85 | Item cards (360 px selected, 250 px neighbours, 48 px labels) slide over 8 f per selection; the chosen card bounces once. |

**Boxes and panels**

| `kind` | Fields (defaults) | Effect and timing |
|---|---|---|
| `dialog` | `text`, `cps` 30, `speaker`, `w` 1700, `h` 200, `size` 34, `y` | RPG box at the bottom unless `y` is set; scales in over 4 f; typewriter text cut on frames; when complete a "v" arrow blinks. |
| `error` | `title` `ERROR`, `text` `SOMETHING WENT WRONG`, `button` `OK`, `barColor` #2f6fd0, `w` 520, `h` 150 | OS popup: pops 0.8 → 1 over 3 f, shakes 6 f, then blinks twice in 4-frame steps. Scale it up with `scale` (1.6 reads). |
| `upgrade` | `text` `UPGRADE\nAVAILABLE`, `pressAt`, `color` #c8302a, `tilt` −6, `costs: [{x, y, text, at}]`, `tag` 1.8 | Pop-tilt in over 7 f, then a 1.5 Hz pulse. At `pressAt` it squashes for 2 f and vanishes in a white burst (6 f). Cost tags (frame coordinates) pop in at their `at` and bob. |
| `killfeed` | `entries: [{a, icon, v, at}]`, `size` 40, `life`, `w` | Top-right (40 px margin) unless `x` / `y` given. Each entry slides in from the right over 6 f and pushes older ones down; with `life` each fades over 0.3 s once its `life` is over. |
| `highscore` | `top` `NEW HIGHSCORE!`, `bottom` `CONTINUE?`, `countdown`, `confetti` true, `size` 120 | The top line pops in letter by letter, 2 f per letter; the bottom line blinks (0.6 s on, 0.4 off) right under it; the `countdown` digit counts down once per second beside it. |
| `meanwhile` | `text` `MEANWHILE...`, `palette` (4 pastels), `color` #e0302a, `size` 150 | Seeded flower-and-leaf collage; letters re-jitter on twos. Hold 2–3 s. |
| `tbc` | `text` `To Be Continued`, `words: [...]`, `every` 0.27, `sepia` true | Sepia-tones the scene; the arrow banner slides in from the right over 10 f, then the words pop in one at a time, tilted. |
| `trade` | `title` `TRADE OFFER`, `color` #c8202a, `w` 1100, `h` 620, `get` / `give: [item]`, `getTitle` `I RECEIVE:`, `giveTitle` `YOU RECEIVE:`; item `{prop | text | map | layer, label, at, scale 0.22, color}` | The card pops in, then each item pops at its `at`. A `map` item (map fields) or a `layer` item is drawn at `scale` into a 420 × 236 box. |
| `slides` | `slides: [{shot, t 0.5, year, title, layer, color}]`, `every` 1.2, `transition` `cut` / `slide`, `cursor` (`false` hides) | Presentation window with up to 5 thumbnails. A `shot` slide is that shot of the film frozen at `t` (cached); a `layer` slide draws one layer. The cursor eases to "next" over 0.4 s and clicks on each switch. |

### Persistent widgets (`spec.overlays`)

Top-level `overlays: [{from, to, hideIn, layer}]` draws a layer over every shot from film time `from` to `to`, screen-locked, across cuts and transitions. Layer time is film time minus `from`, so `answerAt`, `stop` and `swap.at` count from `from`. `hideIn: [shot ids]` hides it for whole shots; for a mid-shot hide swap its alpha: `"swap": [{"at": 41.2, "alpha": 0}, {"at": 44, "alpha": 1}]`. Put `chip`, `timer-lcd` and a running `counter` here.

## ④ Timing

All counts at 30 fps.

| Element | Measured | Field |
|---|---|---|
| Notice line | slide 6 f, older lines rise 6 f, fade 10 f after 1.5 s | `life` |
| Meter value step | 8 f outBack; warning blink 6 / 6 f; overload shake on twos | `value` keys |
| Counter step | number pop 6 f, icon flash 3 f | `value` keys 0.6–0.8 s apart |
| Warning banner | pop-tilt 7 f; glitch 0.5 s, then 4 f every 1.2 s | `glitch` |
| Score popup | 6 f pop, 12 f rise, 0.8 s life | `life` |
| Lost heart | white 2 f, row shake 8 f | `value` keys |
| Marker | 10 f delay, 6 f fade-in, 1 Hz bob | `delay` |
| Chip | 6 f in; flip 6 f + 4 f flash at the answer | `answerAt` |
| LCD timer stop | 3 blinks × 12 f (36 f), then hold | `stop` |
| Cursor click | squash 2 f, ring 8 f | `clicks` |
| Cursor drag | 10 f drag, 12 f wiggle, burst 6 f | `drag.dur` 0.33 |
| Menu button press | 10 f hop arriving on `at`, 2 f press | `click` |
| VS card | burst 3 f, right bust 5 f, left 2 f later, VS 8 f | – |
| Challenger | disc 2 f, bust 3 f, title 2 f, sub 12 f; silhouette 6 f + shrink 8 f at `dur − 0.6` | `dur` = shot length |
| Joins | 2 white f, name 4 f, streak 5 f; hold ~1.5 s | – |
| Sequel strip | 5 f slam + 3 f shake, every 0.2 s | `every` |
| Wheel | hard snap every 0.4 s, 12 f pulse on the last | `every` |
| Carousel | 8 f slide + 6 f bounce | `select` |
| Dialog | 30 characters per second | `cps` |
| Error popup | 3 f pop, 6 f shake, 2 blinks of 4 f | – |
| Highscore | 2 f per letter, 1 Hz blink | – |
| TBC | banner 10 f, words every 8 f | `every` 0.27 |
| Slides | 1.2 s per slide, cursor move 0.4 s | `every` |

## ⑤ Recipes

**A heartbeat stops on the reveal.** `{"type":"hud","kind":"ecg","bpm":[{"at":0,"v":70},{"at":2,"v":110}],"flatAt":3.5}`. Omit `x` and `y` for a visible-frame corner anchor, including vertical shorts. For messenger `chat`, tier-board `tierlist`, and a bar-chart `grow` beat, see [06 Paper and lettering](06_paper_and_lettering.md).

**"One by one, the soldiers deserted."** System log, raised for readability.
```json
{"type": "hud", "kind": "notice", "y": 0.8, "size": 44, "life": 1.6,
 "lines": [{"at": 0.5, "text": "SOLDIER1 HAS LEFT"}, {"at": 1.3, "text": "SOLDIER7 HAS LEFT"}, {"at": 2.1, "text": "ALLY JOINED", "color": "#8cf05a"}]}
```

**"Debt kept piling up until it broke."** Meter in steps, warning at the peak.
```json
{"type": "hud", "kind": "meter", "label": "DEBT", "value": [{"at": 0, "v": 0.1}, {"at": 0.7, "v": 0.35}, {"at": 1.4, "v": 0.62}, {"at": 2.0, "v": 0.93}, {"at": 2.4, "v": 1.0}]}
{"type": "hud", "kind": "warning", "at": 2.4, "text": "DEBT OVERLOAD", "glitch": true, "y": 0.42}
```

**"Every conquest paid."** Counter steps with world-space score popups over the action.
```json
{"type": "hud", "kind": "counter", "icon": "coin", "size": 72, "value": [{"at": 0, "v": 0}, {"at": 0.6, "v": 1}, {"at": 1.4, "v": 2}]}
{"type": "hud", "kind": "score", "at": 0.6, "x": 0.68, "y": 0.42, "text": "+100", "hud": false}
{"type": "hud", "kind": "score", "at": 1.4, "x": 0.82, "y": 0.45, "text": "+1914", "sub": "PTS", "color": "#8cf05a", "style": "bold", "hud": false}
```

**"The siege took everything."** Hearts and hunger draining, hotbar of supplies.
```json
{"type": "hud", "kind": "hearts", "value": [{"at": 0, "v": 10}, {"at": 0.8, "v": 7}, {"at": 1.5, "v": 4}, {"at": 2.2, "v": 1}],
 "hunger": [{"at": 0, "v": 6}, {"at": 1.2, "v": 2}], "hotbar": 9, "selected": 2, "items": ["bread", "torch", "sword", "coin"]}
```

**"This one is us."** Player tag over a bean with an id.
```json
{"type": "hud", "kind": "marker", "follow": "p1", "text": "P1", "color": "#d83a2a"}
```

**"And the third brother was simply erased."** Drag, delete burst, target pops out on the burst.
```json
{"type": "bean", "id": "thug3", "who": "rival", "x": 0.5, "y": 0.86, "size": 400, "out": 1.5, "exit": "pop", "exitDur": 0.07}
{"type": "cursor", "path": [[0.9, 0.1, 0], [0.4, 0.38, 0.6]], "size": 48, "then": "delete",
 "drag": {"from": [0.4, 0.38], "to": [0.6, 0.92], "at": 0.75, "dur": 0.35}}
```

**"Generals moved armies like pieces."** RTS selection under units, hand cursor clicks.
```json
{"type": "cursor", "style": "hand", "size": 40, "clicks": [0.8, 2.3],
 "path": [[0.9, 0.2, 0], [0.4, 0.62, 0.7], [0.4, 0.62, 1.5], [0.7, 0.62, 2.2]],
 "select": [{"x": 0.3, "y": 0.8, "rx": 90, "ry": 26, "at": 0.85}, {"x": 0.74, "y": 0.82, "rx": 90, "ry": 26, "at": 2.3, "color": "#e0302a"}]}
```

**"The king against his own clerks."** Jagged versus with team colours.
```json
{"type": "doc", "kind": "versus", "seam": "jagged",
 "left": {"who": "king", "name": "THE KING", "bg": "#2f6db8"}, "right": {"who": "clerk", "name": "THE CLERKS", "bg": "#c8323a"}}
```

**"Then a new rival appeared."** Challenger card for the whole shot.
```json
{"type": "doc", "kind": "challenger", "who": "rival", "dur": 3.5}
```

**"Which weapon would they pick?"** Wheel ending on the absurd option.
```json
{"type": "doc", "kind": "wheel", "every": 0.4, "steps": [0, 1, 2, 3],
 "items": [{"prop": "spear", "label": "SPEAR"}, {"prop": "sword", "label": "SWORD"}, {"prop": "shield", "label": "SHIELD"}, {"prop": "scroll", "label": "A STRONGLY WORDED LETTER"}]}
```

**"The treasury was empty."** OS error over the scene.
```json
{"type": "doc", "kind": "error", "x": 0.62, "y": 0.42, "scale": 1.6, "at": 0.3, "title": "TREASURY.EXE", "text": "INSUFFICIENT FUNDS"}
```

**"Brother killed uncle, cousin killed brother…"** Flippant kill feed.
```json
{"type": "doc", "kind": "killfeed", "entries": [{"a": "BROTHER", "icon": "sword", "v": "UNCLE", "at": 0.3}, {"a": "COUSIN", "icon": "bomb", "v": "BROTHER", "at": 1.1}]}
```

**"Rome offered a deal."** Trade card with items popping in.
```json
{"type": "doc", "kind": "trade", "get": [{"prop": "shield", "label": "YOUR HELP", "at": 0.5}],
 "give": [{"text": "3 STATES", "at": 1.0}, {"prop": "moneybag", "label": "AND A BONUS", "at": 1.5}]}
```

**"Let's skip a hundred years."** Slides of earlier shots (never the shot that contains it).
```json
{"type": "doc", "kind": "slides", "every": 1.0,
 "slides": [{"shot": "g01_notice_marker", "t": 0.2, "year": "820"}, {"shot": "g04_hearts", "t": 0.2, "year": "840"}]}
```

**Open questions across the whole act.** Chips and a timer as overlays.
```json
"overlays": [
  {"from": 0.0, "to": 19.6, "layer": {"type": "hud", "kind": "chip", "corner": "bl", "slot": 1, "size": 36, "text": "WHO WINS THE VALLEY?", "key": "VALLEY", "answerAt": 16.0}},
  {"from": 0.0, "to": 19.6, "layer": {"type": "hud", "kind": "timer-lcd", "stop": 17.5}}
]
```

## ⑥ Limits and pitfalls

- **The cursor cannot hide another layer.** For `then: "delete"`, give the target `"out": drag.at + drag.dur + 0.4, "exit": "pop", "exitDur": 0.07` so it vanishes on the burst. For `carry`, hide the original at `drag.at` (`"out": drag.at, "exit": "none", "exitDur": 0`) and list the cursor after the carried layer.
- **`marker` and `carry` need an id in the same shot.** A wrong `follow` or `carry` id throws an error and stops the render.
- **`chip` ignores `x` / `y`;** use `corner` and `slot`. `timer-lcd` uses `corner` only when both `x` and `y` are omitted.
- **Overlay time is not shot time.** `answerAt`, `stop` and `swap.at` inside an overlay count from the overlay's `from`.
- **Overlays draw over transitions too.** Use `hideIn` for a shot that needs the corner (split screens, a finale with its own counter).
- **`slides` renders other shots** of the same film; a slide showing its own shot fails (nesting is limited to 2 levels). Slides render slowly; keep 3–6.
- **Busts are beans without legs,** drawn from the cast `who`; the validator checks every nested `who` inside `doc` objects against `cast`.
- **`versus` without `seam: "jagged"`** draws one shared burst; per-side `bg` colours only apply to the jagged layout.
- **Game lettering does not auto-fit everywhere.** `notice` and `chip` grow with their text; long chip text runs off-frame. Keep game text to 2–4 words.
- **`wheel` `steps` index into `items`;** an index past the end shows an empty label.
- **Do not grade or blur game UI.** `hud`, `cursor` and `doc` are exempt from rack focus unless `focusable: true`; keep them sharp.

### Measured against the reference (third study, 2026-10-15)

- **`joins`:** the reference flashes 5 white frames, fades the name slab in over 2 f and holds about 1.27 s (WW1 25:19); the engine's card is close enough for most uses.
- **`carousel`:** the reference snaps cards in 1 f with a 3 f chevron flash and a 2 f red select flash (WW1 4:09); the engine's 8 f bouncing slide is softer. For a snappier menu, give each card its own `at` and `enter: "none"`.
- **Game UI as a frame story:** a whole long film can live inside a game (disc chapters, an "INSERT DISK #2" pause, a system antagonist that owns the frame; WW1). The UI disappears for the most serious segment and the host explicitly returns afterwards: drop the parody when the subject turns grave.
