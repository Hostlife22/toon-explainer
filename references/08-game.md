# 08 · Game UI: HUD, cursor, splash cards, menus and slides

The reference channels borrow video-game screens to land a beat: a system log for small events, a hazard bar for pressure, a VS card for a rivalry, a pause menu for an aside, a slideshow to skip decades. Module: `scripts/engine/lib/gameui.js`. Vocabulary: `scripts/vocab/gameui.json`. Showcase: [examples/v4_game/spec.json](../examples/v4_game/spec.json).

Game UI is drawn flat, not in the cartoon ink style. It uses a cold UI ink (`#1a1a1f`), bevelled buttons (a darker bottom band and a thin white top line) and white caps with a dark outline. All times are layer-local seconds, and frame counts assume 30 fps. Every kind animates its own entrance, so the default `enter` is `none` for `hud`, `cursor` and `doc`.

## Sentence type → recipe

| The narration says… | Use |
| --- | --- |
| "X left the alliance", "Y joined", a run of small events | `hud` `notice` |
| "pressure kept building", "debt piled up" | `hud` `meter`, then `warning` at the peak |
| "they collected one after another" | `hud` `counter` + `score` popups |
| "they were running out of everything" | `hud` `hearts` |
| "this one is us" | `hud` `marker` over a bean |
| two or three open questions answered later | `hud` `chip` as an `overlays` entry |
| "in quick succession", a montage of rulers | `hud` `timer-lcd` as an overlay |
| "someone erased him", "they moved armies like pieces" | `cursor` (drag + `then: "delete"`, or RTS `select`) |
| "X versus Y" | `doc` `versus` (`seam: "jagged"` for two sides of an argument) |
| "there were three rounds of this" | `doc` `sequel` |
| "then a new player arrived" | `doc` `challenger` or `joins` |
| chapter break, "let's pause", "loading the next era" | `doc` `menu`, `pause`, `loading`, `insert` |
| "which option would they choose?" | `doc` `wheel` or `carousel` |
| "X transformed into Y", inner monologue | `doc` `dialog` |
| "they ran out of money", "the plan failed" | `doc` `error` |
| "they upgraded / reformed X" | `doc` `upgrade` |
| "X was removed by Y", told flippantly | `doc` `killfeed` |
| "it was finally over" | `doc` `highscore` |
| "meanwhile…" | `doc` `meanwhile` |
| cliffhanger ending | `doc` `tbc` |
| "X offered Y a deal" | `doc` `trade` |
| "nothing changed for decades", "let's skip ahead" | `doc` `slides` |

## `hud` layer

`{ "type": "hud", "kind": "<kind>", ... }`. It is screen-locked by default; set `hud: false` to let the camera move it. When a kind lists a default anchor, that anchor applies only if `x` and `y` are left out.

| Kind | Fields (defaults) | Timing |
| --- | --- | --- |
| `notice` | `lines: [{at, text, color, icon}]`, `life` 1.5, `size` 26, `max` 4, `color` `#fff`. Anchor: the bottom-left of the newest line, `x` 0.02, `y` 0.94. | A line slides 30 px in over 6 frames. Older lines rise one row over 6 frames, and a line fades over 10 frames after `life`. |
| `meter` | `label`, `value` (0..1 or `[{at, v}]`), `w` 520, `h` 44, `style: "hazard"\|"solid"`, `color` `#f5c518`, `labelColor` `#e0313a`, `warnAt` 0.9. Anchor: the bar's top-left, `x` 0.04, `y` 0.1. | A value change eases (`outBack`) over 8 frames. Stripes scroll 1 px per frame. At `warnAt` or above, the red triangle blinks 6 frames on, 6 off. At 1.0 the bar shakes ±3 px on twos. |
| `counter` | `icon` (any prop, `coin`), `value` (keys), `prefix` `x`, `suffix`, `size` 64, `sep` (thousands separator `","` or `" "`; none by default), `compact: true` (2100000000 → `2.1B`, 340000000 → `340M`, 12000 → `12K`). Anchor: `x` 0.05, `y` 0.08. | Each step pops the number from 1.4 to 1 over 6 frames and flashes the icon white for 3 frames. |
| `warning` | `text`, `tilt` −4, `glitch`, `w` 880, `h` 110, `color` `#d8262a`. Anchor: `x` 0.5, `y` 0.2. | Pop-tilt over 7 frames. `glitch` slices the banner into 3 offset bands on twos: for the first 0.5 s, then for 4 frames every 1.2 s. |
| `score` | `text` `+100`, `sub`, `color` `#ffe84a` (green `#8cf05a`), `size` 72, `rise` 40, `pixels` 7, `style: "pixel"\|"bold"`, `life` 0.8 | Scale goes 0.6 → 1.2 (frame 4) → 1 (frame 6) while the popup rises over 12 frames. White squares scatter, and the popup fades over its last 6 frames. Usually `hud: false`. |
| `hearts` | `count` 10, `value` (keys), `cell` 6, `hunger` (`true`, a number or keys), `hotbar` 9, `selected` 0, `items: [prop…]`. Anchor: the bottom centre, `x` 0.5, `y` 0.95. | A lost heart flashes white for 2 frames, then turns grey. The row shakes ±2 px for 8 frames. |
| `marker` | `follow` (layer id), `text` `P1`, `color` `#d83a2a`, `dx` 0, `dy` −40, `size` 1, `delay` 0.33 | It reads the followed layer's position every frame and sits above its head (beans: feet minus 1.14 × `size`). Fades in over 6 frames and bobs ±2 px at 1 Hz. It is world space unless `hud: true`. `follow` must be in the same shot. |
| `chip` | `text`, `key` (shown in red), `keyColor`, `corner: "tl"\|"tr"\|"bl"\|"br"` (`tr`), `slot` 0, `answerAt`, `size` 30, `w` (auto) | Slides 40 px in from the edge and pops in over 6 frames. At `answerAt`, the status box flips over 6 frames from a red X to a green check, with a 4-frame white flash. Slots stack 8 px apart. |
| `timer-lcd` | `start` 0, `stop`, `format: "m:ss.cc"\|"ss.cc"\|"h:mm:ss"`, `corner` `tr`, `color` `#7ef0a0`, `w` 300, `h` 92 | Seven-segment digits that tick every frame. After `stop` the frozen digits blink 3 times between full and 35 % (6 frames each, never blank), then hold. |

### Persistent chips and timers (`spec.overlays`)

Put `chip`, `timer-lcd` and a running `counter` in top-level `overlays` so they survive cuts. `hideIn: [shot ids]` hides an overlay for whole shots (a split screen that needs its corner); for a mid-shot hide, swap its alpha in overlay time: `"swap": [{"at": 41.2, "alpha": 0}, {"at": 44, "alpha": 1}]`. Overlay layer time is film time minus `from`, so `answerAt` and `stop` count from the overlay's `from`.

```json
"overlays": [
  {"from": 0.0, "to": 19.6, "layer": {"type": "hud", "kind": "chip", "corner": "bl", "slot": 1, "text": "WHO WINS THE VALLEY?", "key": "VALLEY", "answerAt": 16.0}},
  {"from": 0.0, "to": 19.6, "layer": {"type": "hud", "kind": "timer-lcd", "stop": 17.5}}
]
```

### Readable sizes

The QA rule in [05-workflow](05-workflow.md) asks for labels of at least 56 px and captions of at least 44 px. Two HUD defaults are much smaller because they copy real game UI: `notice` text is 26 px and `chip` text 30 px. When a HUD element carries a word the narration depends on, raise it: `notice` `size` 44–56, `chip` `size` 34–40 (it grows wide quickly, so keep the text short), `counter` 64 or more. Leave decorative chatter at the defaults.

## `cursor` layer

`{ "type": "cursor", "style": "arrow"|"hand"|"grab", "path": [[x, y, t], ...], "clicks": [t...], "drag": {...}, "then": "delete", "target": "<id>", "carry": "<id>", "select": [...], "size": 34, "wiggle": 6, "drift": 2 }`

- `path` uses frame fractions and layer seconds, eased `inOut` between points. With no path, the cursor rests at `x`/`y`.
- `clicks`: each click squashes the cursor to 0.9 for 2 frames and draws a white ring that grows from 10 to 30 px over 8 frames.
- `drag: {from, to, at, dur 0.33}` draws a dashed marquee (`#2a1d17` plus a white offset line) from `from` to the cursor, and the cursor follows the corner. A `hand` cursor shows a grab while it drags. Afterwards the cursor wiggles ±`wiggle` px for 12 frames, then holds at `to` unless the `path` has later points.
- `then: "delete"`: 12 frames after the drag ends, the marquee disappears with a white burst. The engine cannot hide another layer, so give the target `"out": <drag.at + dur + 0.4>, "exit": "pop", "exitDur": 0.07`. Layers are not hidden through `T.hiddenLayers`.
- `carry: "<id>"`: while the drag runs, a copy of that layer moves with the marquee corner. Hide the original at `drag.at` (`"out": drag.at, "exitDur": 0`). The cursor layer must come after the carried layer in `layers`.
- `select: [{x, y, rx 110, ry 34, at, out, color}]`: RTS selection ellipses (dashed, green by default) pop in under units.
- The cursor is screen space. Set `hud: false` to make it world space.

## `doc` kinds (game screens)

These kinds share the `doc` registry with `docs.js`, `docs2.js` and `docs3.js`. Full-frame cards are screen-locked unless `hud: false`, and they assume the layer sits at the centre (the default).

| Kind | Fields (defaults) | Timing |
| --- | --- | --- |
| `versus` | `left`/`right: {who, name, eyeGlow (true or a colour), bg, pose "fist", expr "angry", look, eyeX, eyeY}`, `seam: "none"\|"jagged"`, `bg: "burst"\|"none"`, `vsColor` `#fff`, `push` 0.02, `size` 1000 | The empty burst holds for 3 frames. The right bust slides in over 5 frames with a 6% overshoot, and the left one 2 frames later. "VS" rises 200 px over 8 frames. A jagged seam draws top to bottom over 8 frames, and each half takes its own `bg` colour. After that, a slow push-in of `push` per second. |
| `sequel` | `titles: [...]`, `every` 0.2, `w` 1300, `h` 150, `size` 110, `color` `#b0b0b0` | Torn grey strips slam in from alternating sides (5 frames, `outCubic`) with a 3-frame shake on landing. The titles have a yellow-to-red gradient. |
| `challenger` | `who`, `title` (`\n` breaks a line), `sub`, `color` `#d40000`, `titleColor`, `dur` 3.5, `pose`, `expr` `smug`, `look` | The disc enters from the right in 2 frames, the bust pops from 0.9 to 1 over 3 frames, and the title types in over 2 frames. The serif sub-line swings from −90° to −15° over 12 frames. At `dur − 0.6` the bust turns to a silhouette over 6 frames, then the disc shrinks over 8. |
| `joins` | `name`, `sub` (`JOINS THE BATTLE!`), `who`, `sky` `#7ec8f0`, `pose` `arms-up`, `expr`, `size` 900, `whoX` 0.16, `streak` `#c8202a` | 2 white frames, then the name slams from 1.3 to 1 over 4 frames and the streak wipes in over 5 frames. Hold about 1.5 s. |
| `menu` | `title`, `buttons: [...]`, `click: [{at, i}]`, `titleColor` `#f5c430`, `buttonColor`, `textColor`, `style`, `cursor` `hand`, `size` 160 | Buttons pop in 3 frames apart. The hand enters below the first target, then hops to each clicked button's right end (10 frames, `inOut`, arriving on `at`) so it never covers the label; and presses it for 2 frames, darkening the button. |
| `pause` | `title` `PAUSE`, `buttons`, `style: "plank"\|"button"` (`plank`), `mirror`, `dim` 0.5, `click` | Dims the scene. The title is hand-placed letters. `mirror` flips the lettering, as if the menu were seen from inside the game. |
| `loading` | `text` `Loading..`, `full` true, `color` `#111`, `size` 1 | A 12-dot spinner (r 96 px) turns once per second; the 64 px label's dots cycle every 8 frames. With `full: false` it draws no backdrop, so it can sit on a TV screen. Put a bored bean layer after it so the black frame is not empty. |
| `insert` | `text` `INSERT DISK #2`, `drip` true, `numColor` `#d21f1f`, `size` 96, `full` | The last number is red with a thin outline; 2 to 4 drips hang from its baseline (drawn under the numeral, so it stays crisp) and grow 30–70 px over 0.6 s. |
| `wheel` | `items: [prop \| {prop, label}]`, `steps: [index…]`, `every` 0.4, `size` 230, `activeColor` `#2f7fd6`, `dim` 0.4 | The highlight hard-snaps to the next step every `every` seconds, with no tween. The last pick pulses twice. End on the absurd option. |
| `carousel` | `items: [{prop, label}]`, `select: [{at, i}]`, `start` 0, `dim` 0.85 | Cards (360 px selected, 250 px neighbours, 48 px labels) slide over 8 frames per selection. The chosen card bounces once. |
| `dialog` | `text`, `cps` 30, `speaker`, `w` 1700, `h` 200, `size` 34 (at the bottom unless `y` is set) | Typewriter text, cut on frames. Once the text completes, a "v" arrow blinks. |
| `error` | `title` `ERROR`, `text`, `button` `OK`, `barColor`, `w` 520, `h` 150 | Pops from 0.8 to 1 over 3 frames, shakes for 6 frames, then blinks twice in 4-frame steps. Scale it with `scale`. |
| `upgrade` | `text` (`UPGRADE\nAVAILABLE`), `pressAt`, `color` `#c8302a`, `tilt` −6, `costs: [{x, y, text, at}]`, `tag` 1.8 (cost tag scale) | Pop-tilt in, then a pulse at 1.5 Hz. At `pressAt` the button squashes for 2 frames and vanishes in a white burst. Cost tags (frame coordinates) pop in and bob. |
| `killfeed` | `entries: [{a, icon, v, at}]`, `size` 40, `life`, `w` (anchor: top-right, 40 px margin) | Each entry slides in from the right over 6 frames and pushes the older entries down. |
| `highscore` | `top` `NEW HIGHSCORE!`, `bottom` `CONTINUE?`, `countdown`, `confetti` true, `size` 120 | The top line pops in letter by letter, 2 frames per letter. The bottom line sits right under the title (clear of a character below) and blinks at 1 Hz; the `countdown` digit stays on beside it. |
| `meanwhile` | `text` `MEANWHILE...`, `palette: [4 pastels]`, `color` `#e0302a`, `size` 150 | A seeded flower-and-leaf collage. The letters re-jitter on twos. Hold 2–3 s. |
| `tbc` | `text` `To Be Continued`, `words: [...]`, `every` 0.27, `sepia` true | Sepia-tones the scene. The arrow banner slides in from the right over 10 frames, and the words pop in one at a time. |
| `trade` | `title` `TRADE OFFER`, `get` (I RECEIVE), `give` (YOU RECEIVE), `getTitle`, `giveTitle`; an item is `{prop \| text \| map \| layer, label, at, scale}` | The card pops in, then each item pops at its `at`. A `map` item is drawn through `T.layers.map`, clipped into a 420×236 box. |
| `slides` | `slides: [{shot, t 0.5, year, title, layer, color}]`, `every` 1.2, `transition: "cut"\|"slide"`, `cursor` | A presentation window with thumbnails. A `shot` slide is that shot frozen at `t` through `T.subShot` (cached). The cursor eases to "next" over 0.4 s and clicks on each switch. |

## Notes

- For the full-frame cards (`versus`, `challenger`, `joins`, `meanwhile`, `loading`, `insert`), a plain `flat` background is enough.
- `bust` portraits are ordinary beans drawn with `legs: false`. `who` and `look` work as they do elsewhere.
- `slides` renders other shots of the same film, so never let a slide show the shot that contains it.
