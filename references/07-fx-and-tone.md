# 07 · FX, transitions and tone (v3)

These effects come from the reference library: horror biography, myth, war, fact-check and empire-history videos. Use them to change the tone without changing the drawing style. Every effect is deterministic and seeded by the layer `id`.

Showcase: [examples/v3_fx/spec.json](../examples/v3_fx/spec.json), with one shot per feature.

Measured cost per 1080p frame on the reference Mac:

| Effect | Time |
| --- | --- |
| `glitch` | ≈50 ms |
| `rgbsplit` | ≈45 ms |
| `mono-red` | ≈65 ms |
| `lineart` | ≈30 ms |
| `glow` | ≈100 ms |

Everything else costs under 5 ms.

## FX layers (`"type": "fx"`)

Full-frame effects ignore the layer position. Give them `"hud": true` so the camera does not move them.

| `kind` | Fields (defaults) | Look and motion |
| --- | --- | --- |
| `glitch` | `dur` 0.6, `looks` | A 1–3 frame sequence: grayscale with slice offsets, thermal map, normal, half-frame purple tint, posterize. Full frame. |
| `rgbsplit` | `dur` 0.8, `offset` 5, `strength` 0.55 | Cyan and magenta ghosts of everything drawn so far, plus slice jumps every 4 frames. Full frame. |
| `alarm` | `period` 8, `on` 5, `strength` 0.7, `color` | Red multiply strobe, 5 frames on and 3 off. Full frame. |
| `cctv` | `label` "CAM 1" | Corner brackets, camera label, REC dot blinking at 1 Hz, scanlines. Full frame. Pair with `camera.rot` for a tilted security view. |
| `mist` | `w` 1400, `count` 9, `rise` 320 | Soft wisps rising and swaying over water or ground. |
| `whirlpool` | `size` 420 | Top-down rotating rings that contract into a dark center. |
| `redeyes` | `gap` 60, `size` 22, `color`, `bloom` 26, `on: [[a,b]]`, `blink: [t]` | Two glowing slanted eyes in the dark. They breathe slightly; `blink` hides them for 4 frames. |
| `eyes-white` | same as `redeyes` | White slit eyes, for shadows on a wall. |
| `wallshadow` | `size` 520, `grow` 1.0, `hornsAt` 0.6, `eyesAt` 1.2, `alpha` 0.88, `color`, `eyeColor` | A silhouette cast on the wall. It swells from 0.8 to 1.1, sprouts horns, then its eyes pop on in one frame with a glow flash. |
| `darkness` | `dur` 4, `count` 10, `strength` 1 | Soft black blobs that creep in from the frame edges toward the center. Full frame. |
| `eyelids` | `mode` close/open/blink, `dur` 0.8 | POV almond lids closing or opening. Full frame. |
| `inkburst` | `bursts: [t]`, `color` #3b2a7a, `count` 9, `spread` 300, `puddle` 260 | Ink blobs erupt for 8 frames and fall into splats, then a puddle spreads for 20 frames. |
| `paperstorm` | `count` 14, `color` | Sheets with text lines drifting outward and rotating. |
| `flameshape` | `emblem` bull/skull/eye/crown/man, `size` 320, `morphAt` 1.2, `color` | A fire grows, then becomes an emblem silhouette with a flickering gold outline and flame tongues on top. Use it for omens and visions. |
| `gas` | `from` right/left, `dur` 3, `h` 220, `count` 26, `color` | A green band drifting along the horizon and swelling as it advances. It covers whatever is under it. |
| `muzzle` | `count` 6, `spacing` 220, `dir` 1/−1, `every` 0.12 | A line of shooters firing in turn: a 4-point star flash with a tracer streak, about 3 frames each. |
| `shellburst` | `every` 0.4, `w` 1600, `size` 200 | Mushroom flashes popping behind a trench lip or hill. Pair each burst with a `camera.shake` entry. |

## Layer modifiers (any layer type)

| Field | Effect |
| --- | --- |
| `glow: true \| {color, blur 34, pulse 0.1}` | Soft outer glow that pulses at 0.5 Hz. For gods, relics, ghosts and divine creatures. |
| `silhouette: "#hex"` | Draws the layer as one flat color. For the threat in the dark, an audience, a figure behind glass or a shadow. |
| `lineart: true \| {color, width 4}` | Outline only. Combine with `bg: flat #050505` for the "inside his mind" line-art world. |

The layer is drawn to an offscreen canvas and post-processed. Use these modifiers on a few layers per shot, not on everything.

## Entrances (`enter`)

| Value | Timing |
| --- | --- |
| `drop-squash` | Falls in 2 frames, squashes to 150/55 on impact, rebounds to 85/115, settles by about 0.5 s. Use it for statistics dropped as objects and props that land. |
| `pop-tilt` | 0 → 1.15 → 1 with a ±5° rotation, 0.22 s. Use it for map stickers, notes and labels. |
| `slam` | Scales from 1.6 to 1 in 3 frames, then shakes for 0.2 s. Use it for verdicts, mission titles and stamps. |

## Transitions (`transition: "kind"` or `{"kind": ..., "at": [x, y], ...}`)

| Kind | Duration | Look |
| --- | --- | --- |
| `inkblot` | 0.8 | A black splat with swirl arms grows from `at` (default center), then the next shot opens through a hole. `color` sets the ink. |
| `slash` | 0.35 | Three white blade streaks and a red jagged brush band across the cut. |
| `peephole` | 0.9 | A comic ellipse iris with a thick rim and motion swooshes. It closes on A, holds black, then opens on B. `at` sets the center. |
| `sepia-to-color` | 1.0 | A sepia memory dissolves into the color scene; incoming layers start as blue-tinted ghosts. |
| `torn-split` | 0.35 | The next shot slides in behind a jagged torn-paper edge. `from: "left"` reverses the direction. |
| `barwipe` | 0.6 | Ragged dark bars rise from the bottom, then leave upward. `color` sets the bars. |
| `flash-cut` | 0.1 | A hard cut through a 3-frame white flash. |

## Grades (`grade`)

| Preset | Use |
| --- | --- |
| `sepia` | Backstory, prophecy and "long ago" vignettes, as an engraving-parchment look. Follow it with `sepia-to-color`. |
| `horror` | Dread interiors: desaturated maroon tint and a heavy vignette. |
| `cold` | Grief and loss: a desaturated grey-blue. |
| `divine` | An apparition or a god: a bright center bloom. |
| `mono-red` | A corrupted memory: the world turns grayscale and only blood and roses keep their red. |

`grade` can fade in mid-shot with `{"preset": ..., "at": 2.0, "dur": 0.5}`.

`shot.vignette: {strength 0.8, x 0.5, y 0.5, radius 0.55, color}` overrides the film vignette for one shot. Horror interiors use 0.6–0.85 centered on the light source.

## Tone rules

- **Dread, then scare, then deflation.** Hold a quiet shot for 3–5 s with a 1%/s push-in. Then make a *hard cut* (no transition) to the scare: a full-frame black background, `wallshadow` or a silhouette, `redeyes`, a slight camera shake, held 1.5–4 s. Within 2–6 s of the peak, deflate with comedy: a hard or `flash-cut` cut to a warm `burst` background, a deadpan or `squint` face and a gag line. The reference never leaves a scare undeflated.
- **The lurker.** Keep the threat small in the background (`silhouette`, scale 0.4–0.8), let it fade in over 2–3 s (`enter: "fade"`, `enterDur` 2.4) while the subject stays unaware, then reveal `redeyes`.
- **Imply violence with stand-ins.** Never show a death on screen. Use a blood pool (`fx: blood`), X eyes (`expr: "dead"`), a cut to black, a tombstone or a statistic as an object. Hold that shot for 3–4 s without gags, then grade the next shot `solemn` or `cold`.
- **One lighting idea per horror shot:** a candle or torch, a window wedge, or a spotlight. Use a heavy `vignette` around it.

## Recipes

1. **Corrupted memory.** A bright idyllic shot (3 s), then `fx: glitch` (0.6 s, `hud`), then the same composition with `grade: "mono-red"`, a `blood` stand-in and a `back` view of the character.
2. **It is always watching.** A `horror` grade interior with the character in the foreground (`expr: sad`, `pose: think`). A copy of the cast member as `silhouette: "#0d0907"` sits at 0.8 scale in the background with `enter: "fade"` and `enterDur` 2.4. `redeyes` comes in at +2.6 s with one blink.
3. **Jump scare.** Hard cut to `bg: flat #050404` with a full-frame `wallshadow` (`grow` 0.15, `eyesAt` 0) and big `redeyes`, plus `camera.shake` across the whole shot. Then `flash-cut` to the deflation shot.
4. **Shadow on the wall.** A warm interior, a small character with a torch, and a `wallshadow` behind them that grows and gets horns at 0.9 s and eyes at 1.9 s. `tremble` on the character from the eyes onward.
5. **Final breath.** A close-up (`size` 1300, `y` 1.45) with `fx: eyelids mode close`, then `inkblot` into a `lineart` mind-world with a `paperstorm`.
6. **Divine apparition.** Sky with `hills: false`, the god with `glow` and `pose: arms-up`, `grade: "divine"`, entered through `peephole` or after `mist` over water.
7. **Omen in the fire.** A dark interior with `fx: flameshape` (`emblem` bull or skull, `morphAt` 1.3); the character's `expr` goes from neutral to shock at the morph.
8. **Gas attack.** A `solemn` battlefield with a row of soldiers (`crowd`) and `fx: gas` from the right over 3 s. Cut to the gas-mask close-up.
9. **Night bombardment.** A night sky with `fx: shellburst` every 0.4 s, `fx: muzzle` along the far line, `fg: rubble`, and a `camera.shake` entry per burst.
10. **Security footage reveal.** A tilted (`camera.rot`) wide interior with `fx: cctv`, then `fx: alarm` at the twist. Exit through `slash`.
