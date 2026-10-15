# 11 · Vertical shorts (9:16)

How to direct and build a 40–95 s vertical short. The rules come from a full study of 12 vertical shorts by the reference channel (every frame decoded for cut detection, contact sheets every 0.5 s, 103 frame strips at 30 fps, Whisper transcripts; see [06-reference-library.md](06-reference-library.md) for coverage). A short is **not** a cut-down long film: it has its own hook, its own density and its own ending. The worked example is [`examples/vertical_short`](../examples/vertical_short/spec.json) ("Why Ice Floats", 12 shots, 51 s) with its storyboard [`script.md`](../examples/vertical_short/script.md).

Burned-in word captions in the reference shorts are a platform overlay and are not part of the style; the engine does not draw them.

## 1. The engine side

| Field | Where | Meaning |
|---|---|---|
| `"format": "vertical"` | spec | Output is 1080×1920. The film is still drawn in the 1920×1080 world; each frame shows a strip of it **607.5 px wide and the full 1080 high**, scaled up (vector drawing, so it stays sharp). Default `"landscape"` |
| `frame` | shot | X of the strip centre as a fraction of the world width: a number or `[{at, v, ease}]` keys (so the vertical window can pan or snap between two subjects). Default `0.5`, clamped to 0.158–0.842. The camera zoom centres on it unless `camera.focus` is set |
| `pinned` | shot | Layers drawn after the shot **without the camera**, always centred in the visible frame: titles, step headers, labels that must not drift while the frame pans. Same layer types and fields as `layers` |

The visible strip at the default frame spans x **0.342–0.658** of the world. Practical coordinates:

- Put the subject at `x` 0.5 (or at the shot's `frame`). Side-by-side items fit only between x 0.36 and 0.64; stack them vertically instead.
- `size` is in world pixels, and the strip is 607 px wide: a bean of `size` 500 fills about half the frame height; a `label` of `size` 56–64 takes 10–12 characters across the frame. `keepInFrame` pulls labels, titles and counters inside the strip and shrinks text that is wider than it (`fit: false` keeps the size), so long names stay readable but get small: prefer short ones.
- Corner widgets (`hud` `chip` and `timer-lcd`, `doc` `killfeed`) and `fx` `cctv` anchor to the corners of the visible frame. Other `hud`/`era` layers use their `x`/`y` in world fractions; in a vertical film put them in `pinned` or `spec.overlays` with `x` inside 0.36–0.64.
- `spec.overlays` are centred like `pinned` layers and persist across cuts (a running counter, a progress HUD).
- `whip` takes `dir` `up`/`down` for vertical travel (the direction the picture moves, opposite to the implied camera); `swirl` is the shorts' signature cut (section 4).
- Render cost: only the visible strip is drawn and pixel-graded (at 1.78× scale), so a vertical frame takes about 15 % longer than a landscape one (measured: 31.6 s vs 27.4 s for 9.4 s of film at `--scale 0.5`). Preview at `--scale 0.5`.
- An `fx` in `pinned` can target a pinned layer or a world layer; with a world target it follows that layer's camera and frame. A `panel` that shows a vertical shot shows it as framed by that shot's `frame`.

```sh
uv run --with playwright python scripts/render.py examples/vertical_short/spec.json --sheet renders/vs.jpg --scale 0.5
uv run --with playwright python scripts/render.py examples/vertical_short/spec.json --out renders/vs.mp4 --scale 0.5 --workers 4
```

## 2. What the numbers say (12 shorts vs 8 long videos, same channel)

| | Shorts (40–95 s) | Long videos (19–38 min) |
|---|---|---|
| Cuts per minute (detector, corrected for transition artefacts) | 9.5–17 | 7–16 |
| Narration | 175–186 wpm | about 3.2 words/s |
| Fully static frames | **2–14 %** (map-heavy 19 %) | 21–46 % |
| Events inside one shot | 3–6 in a 4–11 s shot; a new visual idea every 1.5–2.5 s; a joke or visual pun every 6–10 s | one change every 1.5–3 s on spines; long holds allowed |
| Opening | the claim on frame 1, no title card, no logo | cold open, title card, host room |
| Host on screen | only as a 2–4 s reaction insert, or not at all | long host scenes (10–30 s two-shots) |
| Ending | hard stop 0.27–0.35 s after the last word | outro, end screen |

**Shorts are not faster-cut; they are denser.** The cut rate matches the long videos. What changes is that almost no frame is still: every hold sits on a push, a pan or a drift, and each shot carries several pops, swaps and morphs. Detections shorter than 0.25 s in the shorts were almost always a transition (swirl, pixel wipe) or a stepped effect (fire on threes), not an edit.

## 3. Composing the 9:16 frame

1. **Three horizontal bands.** Top 10–25 %: lettering and status graphics (titles, step headers, counters, a progress HUD). Middle: the subject's head and hands, or the area of interest of a map; heads sit at 20–45 % of the height. Bottom 25–35 %: a foreground mass (desk, podium, the backs of onlookers' heads, a railing, the floor). Use `pinned` for the top band, `layers` for the rest.
2. **One subject, large.** Close-ups fill the width (a head at 40–60 % of it); full figures appear only in map or overhead shots. Two-shots go diagonal (one large and cropped at a bottom corner, one smaller at the opposite top) or stacked.
3. **Foreground witnesses.** Large cropped heads or helmets in the lower third look into the scene, so the viewer stands among the onlookers (used throughout the atrocity short; a `bean` with `view: "back"` and `y` > 1, or `fg` `ots`).
4. **The vertical axis carries meaning.** Things that arrive drop from the top (bombs, a crown, a gavel, an ice cube: `enter: "drop-squash"` + `dropShadow`). Things that grow rise or fill from the bottom (a flood, a crowd, a pile up to a character's chin, a rising block of ice: `move` up). Height in the frame = altitude, size, rank. Gauges stand on the side edge.
5. **Meaning split top/bottom.** Two sides of a comparison stack: idea above, people below; the "before" above, the "after" below; a horizontal border becomes the divide (`panel` `layout: "custom"` with two cells, see `k07` in the example).
6. **Portrait props as frames.** A newspaper held up, a phone, a painting, a door, a map card with margins, a photo on a table: the tall format is motivated by a tall object in the world (`panel` `frame` `phone` / `photo`, `doc` `newspaper`).

### Fitting wide subjects

- **Crop, don't shrink.** A ship or an airship appears as a diagonal sliver, a top band or a huge flank filling a corner. A long truck is shown in two beats: the cab arrives, then a cut to the side of the trailer filling the frame.
- **Maps:** pick a naturally tall region; crop to a vertical strip around the border so the frontier runs top to bottom; show the country as a map card with margins; tilt the map (`map` `view: "tilt"`) so its far edge fills the top; or replace it (one game-like tile, the top cap of a globe with figures standing on it). Figures and icons on the map are drawn at 25–35 % of the frame height, far above map scale.
- **Round locator badge:** when the map is cropped, a circle with the whole country sits in the top corner (one short used it five times, and once zoomed it up to carry a cut). Build it with `panel` `layout: "frame"`, `frame: "circle"`, one cell `{shot: "<map shot>", t, rect: [0.56, 0.05, 0.09, 0.16]}` drawn in `pinned`.
- **Pan the window, not the world.** For a chase or a route, keep the world wide and animate `frame` (and `camera.pan` vertically for top-to-bottom travel).

## 4. Motion, cuts and transitions

- **Frame 0 is never still.** Three of four shorts in one group open on an enlarged frame that settles in about 4 frames. A punch peaks 0.08 s after its `at`, so start it before the shot: `camera.punch: [{at: -0.08, amount: 0.08}]` (the frame starts 8 % enlarged and settles while the normal drift continues).
- **Word = event is stricter** than in the long form: pops land within 0–0.3 s of the key word (costume swaps up to 0.5–1 s early).
- **Transitions:** hard cuts; the **swirl** (spin and zoom into a point, 9–12 frames, used in nearly every short): `"transition": {"kind": "swirl", "at": [0.5, 0.5]}` (default 0.4 s, `dir` −1 reverses the spin, `at` keeps both shots locked on one subject); vertical **whip**: `dir` is where the picture travels, so `{"kind": "whip", "dir": "down"}` reads as the camera rising (up to the surface, up a tower) and `"up"` as the camera sinking (down under the ice, down a well); push-wipes; fast `flash-cut`. No dissolve longer than about 0.8 s. Also measured in the shorts and available: `pixelate` (a mosaic explosion cut), `burn` (fire rises and burns the picture away), `squeeze` (a squeeze to a line, then a blurred pull-back onto a map) and `carry` (a locator badge grows to become the next scene: `from`/`to` rects, `round: true`).
- **Piles and floods fill from the bottom** on the quantity word: `fx` `pile` (objects) or `flood` (liquid), then a dip to black.
- **Holds breathe.** A held drawing keeps living through a slow push, `wobble`, fire on threes, a bob. Keep the static share under 15 %.
- **Dark beats slow down.** The one atrocity short drops from about 15 cuts/min to 4 for its last 35 s: a short still makes room for weight.

## 5. Story shape of a short

- **One question, 4–6 steps, one twist.** A cause → effect → irony spine; each step gets one device and one in-shot reveal on its key word. No map spine and no chapters.
- **Hook in the first sentence (0–3 s)** with a visible change by 1.0–2.3 s. Types seen: a quiz to "you"; a false absolute corrected within 3 s; the climax shown first (the disaster happens in the first second, then "you're laughing, but this really happened"); a second-person danger; an absurd superlative; a pop-culture premise ("based on a real event").
- **A doubt-answer at 3–6 s:** the line that pre-empts "no way" (a newspaper slammed into the lens, a phone with the fact, "hear me out").
- **Callbacks inside 90 s:** a set returns in a changed state (empty → full, clean → stained, warm → cold) or an earlier image returns crossed out.
- **Endings** (pick one; every reference short stops 0.3 s after the last word, with no outro):
  - *Loop/bookend:* the last shot returns to the first composition, or slides away to reveal frame 0.
  - *The past becomes a photograph:* freeze, drain to grey, shrink into a print on a table (`grade: "mono"` + `panel` `frame: "photo"` holding an earlier shot at a frozen `t`; `k12` in the example).
  - *Sequel sting:* a "Part II" paper, an "up next" card.
  - *Ironic button* or *open problem* left on screen.
- **Recurring channel devices that also live in shorts:** a newspaper with a masthead as the fact carrier, game-UI cards (level-up, inventory, death banner), pictogram speech bubbles, a blue-swirl reaction backdrop (`bg: mood` `variant: "swirl"`), a sunburst for crowning moments (`mood` `rays`).

## 6. Recipes (all used in `examples/vertical_short`)

| Beat | Shot |
|---|---|
| Hook: a rule, visibly shown in the first second | `k01`: big prop at x 0.5 shrinks with `move` `scale` at 0.75 s; `camera.punch` at 0 (settle) and on the change; pinned `label` SMALLER at 0.95 s; onlooker bean in the bottom band |
| The rule broken | `k02`: same set and framing (callback composition); the object's shadow grows (`dropShadow` 0.3), it lands with `drop-squash`, the onlooker snaps to `shock` on the same frame |
| Mechanism as characters | `k04`–`k06`: personified `obj` discs jostle (`wobble`, a `jitter` shove, a `punch` arm), the grade turns `cold`, `swap` stops the wobble and arms sprout one by one, then the ring pops in 0.3 s apart; pinned step headers LIQUID → COLD → RINGS |
| Comparison | `k07`: `panel` `custom` with the earlier shots stacked top/bottom at frozen `t`, a `counter` landing on the seam |
| Consequence by vertical travel | `k08`–`k10`: an ice block rises with `move`; `whip` `dir: "down"` (the camera rises to the surface), `whip` `dir: "up"` (back under the lid); the swimmer gives a `thumbs-up` on "life gets through" |
| What-if | `k11`: `flash-cut` + a 0.25 s `negative` grade on "If", the same set turns `cold`, `freeze` on the swimmer and the fish on "Solid", a silent pinned title |
| Ending | `k12`: `swirl` back to a print of `k02` in a `photo` frame, `grade: "mono"` on the last words |

## 7. Checklist

- [ ] The first frame shows the subject and moves; a visible change by 2 s; the doubt-answer by 6 s.
- [ ] Every shot has its subject inside x 0.36–0.64 (or around its `frame`), titles in `pinned`, nothing important in the outer 4 % of the strip.
- [ ] No text wider than the strip; labels 46–70, titles 80–100.
- [ ] Each shot has 2+ in-shot events; no hold without camera drift.
- [ ] A step header or counter carries the progress through the 4–6 steps.
- [ ] One callback composition; the ending is a loop, a photo, a sting or a button, and the last frame lands 0.3 s after the last word.
- [ ] Dark beats follow [07-story-craft](07-story-craft.md) §5 (the reference keeps dark-comic euphemism inside one atrocity short; this skill deliberately does not).
