# 02 · Visual Grammar: Which Shot for Which Line

Each script frame (`vo` + `screen`) becomes one shot in the spec. First pick the **beat type**, then take its recipe and substitute your own content. Recipes are tested `layers` fragments; the full field contract is in `03-spec-reference.md`.

The recipes below (A–P) are the core grammar. Topic-specific recipes live with their toolkits: war, places and vehicles in [toolkits/04_places.md](toolkits/04_places.md); fact-check, maps, timelines and documents in [toolkits/06_paper_and_lettering.md](toolkits/06_paper_and_lettering.md); horror, myth and war effects in [toolkits/08_fx_and_tone.md](toolkits/08_fx_and_tone.md); characters and creatures in [toolkits/01_characters.md](toolkits/01_characters.md). To choose a toolkit for a new topic, start from the matrix in [06-reference-library.md](06-reference-library.md).

## Pacing rules (from the reference measurements)

1. Something new happens on screen every 1.5–3.5 s; a shot itself may last 2–8 s (the references' median shot is 3.0–7.1 s) if it carries those events. If a line runs longer than 5 s on one framing, give it 2–3 internal beats: a pose change (`pose:[{at,v}]`), a pop-in caption (`at`), a punch-zoom (`camera.punch`).
2. Every shot moves:
   - the camera always drifts (default `zoom [1, 1.04]`);
   - the character at least breathes and blinks (automatic);
   - plus one main action: a pose, an entrance, a caption, a counter.
3. On-screen text appears **0.3–1.0 s after the cut** (`at`), not on the first frame: the viewer sees the image first.
4. The key word of a line = an event in the frame. If `vo` says "445 days", a counter must pop in or the camera must punch on that word (adjusted via `at`).
5. Transitions:
   - `cut` by default;
   - `zoom-punch` on a reveal or a punchline;
   - `fade-white` on an era or chapter change;
   - `whip` for "meanwhile" or a comparison;
   - `dissolve` for lyrical moments;
   - `fade-black` for the ending.
   Use no more than one non-`cut` transition per 4–5 shots.
6. A character talks (`talk`) only when **they** are speaking, not on every voice-over line.

## Depth rule: build every shot from 3 planes

1. **Foreground** (`fg`, `z` 1.3–1.6): bushes in the corners, overhanging canopies, a ledge, tall grass, a trunk at the edge, or an over-the-shoulder back of a head. Covers 10–25% of the frame and is darker than the midground.
2. **Midground**: characters (3/4 view!), crowds, props.
3. **Background**: a rich backdrop (`forest`, `city`, `sky` with the right cloud style, `interior` with light wedges).

Add atmosphere (`fx`: `particles`, `birds`, `beam`, `rain`, `smoke`, `fire`) and, when the tone calls for it, `grade`. An empty background with a lone character is acceptable only for reactions (`burst`) and title cards.

In the painted look (`style.look: "painted"`, the default for new films) the background is a Places 2.0 `set` (a `preset` plus your own `parts`) or a painted landscape, the middle plane gets a `set` layer of furniture in front of the actors, and the foreground can be an `ots` shoulder from the camera framing or `silhouettes` of an audience (`size` 0.5–0.6 when the camera frames tightly, or the hats fill the frame).

## Shot sizes and density

Plan each shot's size with `camera.frame` (`ecu`, `cu`, `mcu`, `ms`, `ws`, `ews`) and follow the quotas of [09 §6.1](09-directing.md#61-coverage-shot-sizes-continuous-motion-and-density-painted-look): at least 25 % `cu`/`ecu` per minute, an `ots` pair for every exchange, a wide establisher (set, landscape, `geo` map, globe) per new place or era, never three cuts in a row at one size. Every shot carries one continuous motion (a `path`, `particles`, a camera move); poses still hold and snap. Lettering in a tightly framed shot uses `hud: true`.

Density checklist (each shot): place + actors + foreground; light set; one continuous motion; size differs from one of the previous two shots; real geography on maps. `python3 scripts/spec.py` prints the density lint after the OK line; fix every warning or justify it in the shot's `screen` note.

## Recipes

### A. Cold open / date
Empty location, then the date, then the era badge.
```json
{"bg":{"kind":"sky","preset":"dusk","clouds":5,"rays":true},
 "camera":{"zoom":[1.0,1.06],"pan":[[0,0],[30,-10]]},
 "layers":[
  {"type":"prop","kind":"temple","x":0.5,"y":0.8,"size":420,"enter":"none","z":0.8},
  {"type":"date","text":"46","suffix":"BC","x":0.5,"y":0.22,"at":0.5},
  {"type":"era","small":"46 BC","parts":[["ROMAN","#e0393e"],["REPUBLIC","#fff"]],"x":0.025,"y":0.95,"at":0.2}]}
```

### B. Character introduction (name + tag + arrow)
The most common shot in the reference.
```json
{"layers":[
  {"type":"bean","who":"caesar","x":0.62,"y":0.97,"size":680,"expr":"smug","pose":[{"at":0,"v":"hips"},{"at":2,"v":"point"}],"talk":[[2.1,3.5]]},
  {"type":"label","tag":"DICTATOR","text":"JULIUS CAESAR","x":0.28,"y":0.36,"at":0.8,"arrow":"down-right","size":88}]}
```
Place the caption on the **empty side** of the frame: x 0.22–0.32 if the character is on the right. Long name → `size` 80–90.

### C. Held-back reveal ("He wasn't a cook. He was a scientist…")
Shot 1: a silhouette or the character's back (`expr` not visible, `fx: spotlight`). Shot 2: `zoom-punch` and the face in `shock` or `smug`, plus a label.
```json
{"layers":[{"type":"bean","who":"x","x":0.5,"y":0.98,"size":600},{"type":"fx","kind":"spotlight","x":0.5,"y":0.45,"radius":360}]}
```

### D. Contrast "in nature X, but now Y" / comparison
Two characters or two objects on opposite sides; the second appears later; `whip` transition.
```json
{"layers":[
  {"type":"bean","who":"a","x":0.3,"y":0.95,"size":520,"expr":[{"at":0,"v":"neutral"},{"at":0.8,"v":"happy"}],"pose":[{"at":0.8,"v":"arms-up"}],"jump":[{"at":0.9,"h":70}]},
  {"type":"label","text":"+1 MONTH","x":0.3,"y":0.18,"at":0.9,"color":"#9be07f"},
  {"type":"bean","who":"b","x":0.72,"y":0.95,"size":520,"flip":true,"expr":[{"at":2,"v":"shock"}],"pose":[{"at":2,"v":"scared"}],"shake":[{"at":2,"dur":0.5}]},
  {"type":"label","text":"−1 MONTH","x":0.72,"y":0.18,"at":2.1,"color":"#ff6b6b"}]}
```

### E. Specifics: a number, amount, or year (credibility)
`burst` background, a large counter, and a punch-zoom the moment the number finishes counting.
```json
{"bg":{"kind":"burst","color":"#2f8f8a"},"camera":{"punch":[{"at":2.4,"amount":0.12}]},
 "layers":[{"type":"counter","x":0.5,"y":0.55,"from":0,"to":20000,"dur":2.2,"suffix":" SOLDIERS","size":150,"color":"#ffe066"},
           {"type":"fx","kind":"speedlines","x":0.5,"y":0.5,"at":2.4,"out":3.2}]}
```
For a document or study, use `card` (title, year, 2–3 lines); for a day, month, or deadline, use `calendar`.

### F. Map / geography / spread
Real geography first (the painted default): a `geo` map with countries by `iso`, historical or state shapes as `lonlat` rings, and animated change (`flood`, `drawOn`, `wipe`), pins and routes in lon/lat:
```json
{"bg":{"kind":"flat","color":"#14213d"},"layers":[{"type":"map","style":"painted",
  "geo":{"proj":"mercator","center":[{"at":0,"v":[-92,39]},{"at":2.6,"v":[-84,40]}],"span":52,
         "zoom":[{"at":2.2,"v":1},{"at":3.6,"v":2.2}],"ranges":true,"rivers":true},
  "regions":[{"id":"us","iso":"USA","color":"#8fb36a","dur":0.001,"label":{"text":"USA","size":60}},
             {"id":"ohio","lonlat":[[-84.8,41.7],[-80.5,42],[-80.5,40.6],[-82.6,38.4],[-84.8,39.1]],"color":"#c8402a",
              "dur":0.001,"drawOn":{"at":2.4,"dur":1.0}}],
  "pins":[{"lon":-74,"lat":40.7,"label":"NEW YORK","at":0.2},{"lon":-84.19,"lat":39.76,"label":"DAYTON","at":2.6}],
  "routes":[{"pts":{"ll":[[-74,40.7],[-84.19,39.76]],"gc":true},"at":0.6,"dur":1.7}]}]}
```
For "everywhere on Earth", an `ortho` globe whose `center` keys spin it while `continent` regions `flood` one after another. The older blob map below remains for abstract or invented lands:
```json
{"bg":{"kind":"parchment"},"layers":[{"type":"map","land":[[0.45,0.55,0.25,0.18],[0.7,0.4,0.2,0.2]],
  "regions":[{"pts":[[0.38,0.5],[0.5,0.45],[0.55,0.6],[0.42,0.66]],"at":0.5,"dur":1.5}],
  "pins":[{"x":0.47,"y":0.55,"at":0.3,"label":"ROME"}],
  "routes":[{"pts":[[0.47,0.55],[0.6,0.45],[0.72,0.38]],"at":1.2,"dur":1.4}]},
  {"type":"bean","who":"x","x":0.62,"y":0.6,"size":260}]}
```
For a hand-drawn look of a real place, `map.image` (an AI-generated parchment map) still works; prefer `geo` (see [toolkits/05_maps.md](toolkits/05_maps.md)).

### G. Turn to the "villain" / the system
Dark preset (`night`, `storm`), villain large from below (`size` 750+, `y` 1.02), `expr:"smug"`, slow push-in `zoom [1, 1.12]` with `ease:"out"`, `fx: spotlight` or dark-colored `rays`. Tag caption: "INDUSTRY", "CORPORATION", "SENATE".

### H. Cinematic episode scene (closed-door meeting, experiment)
5–8 short shots (1–2 s) in a single `interior` location:
- wide shot;
- face close-up (`size` 1100, `y` 1.35 — head fills the frame);
- detail (`prop` large);
- reaction (`burst` + `shock`).
Speed up toward the climax of a comic argument or a fight (shots of 0.1–1.6 s, then a 2–4 s outcome hold); a serious episode may instead escalate through content and holds (see 07-story-craft §2.3).

### I. Twist ending (addressing "you")
A viewer-stand-in character `who:"you"` (neutral clothing), `expr:"worried"`, then `"neutral"`. The key phrase appears letter by letter as a `title`. The last shot uses `fade-black`, with the camera slowly pulling out: `zoom [1.08, 1.0]`.

### J. Ambush / serious scene (Teutoburg, 20:44–24:10)
`forest` + `fg: canopy` + `fg: bushes`. A `crowd` row with `march`. At the turn, `grade: {preset:"serious", at, dur:0.5}` and `fx: rain` with the same `at`. Then a close-up: `size` 900–1000, `tremble`, `expr` from `worried` to `shock`, `fx: arrows`, `camera.shake`.

### K. March / army
`crowd` (`who` a legionary with `holdL:"shield"`, `hold:"sword"`), `count` 6–9, `march: true`. Camera `pan` 100–200 px per shot: background parallax supplies the motion on its own.

### L. Fire / disaster
`city` with `preset: "night"` or `grade: "night"`. Layer order: `fx: smoke`, then `fx: fire` (w 1700, count 8), then `explosion` on the key word, then a character with `expr:"scream"` + `pose:"clutch-head"` + `tremble`. Add `camera.shake`.

### M. Chase / messenger
`run` for the whole shot window. The character stays in place or travels via `move`; camera `pan` 500–700 px; `fg: grass` with `z` 1.6 so the grass rushes past. The cloak billows automatically.

### N. After the battle
`grade: "solemn"`, `forest` without `path`. The fallen: `expr:"dead"`, `rot:-88`, `rock:0`, `blink:false` + `fx: blood`. The victor: `pose:"sword-up"`, `flip`. The camera slowly pulls out (`zoom [1.06, 1.0]`).

### O. Celebration / the people
`city` (`style: stone` or `wood`) + `crowd` (2 rows, `armsUp`, `expr: "happy"`, `flipAlt`) + `fx: confetti` + `fg: grass`.

### P. Over-the-shoulder conversation
Both characters in the shot with ids, then `camera.frame` keys `{"target": "<speaker>", "size": "mcu", "ots": "<listener>"}` and a second key that swaps them on the reply (shot-reverse-shot in one shot). The listener becomes a blurred dark shoulder at the frame edge, the speaker sits opposite; a final key at `ecu` with `overshoot` punches into the line that matters. Hand-placed alternative: `fg: ots` (`who` is the listener, `side` opposite the speaker), with the caption **after** it in the layer list.

### Q. Lived-in room (painted look)
`bg: set` with a `preset` (`study`, `library`, `office`, `tavern`, `lab`, `throne`, `courtroom`) or your own `parts`; a `window` with `light: true` gives a shaft with dust, a `lamp` or `fireplace` gives a warm pool (raise `dark` for a night scene). Put the speaker in the light, add a `set` layer (`table` with a `candle`, `z` 1.1) in front of the characters, and frame with `fg: column` or `fg: curtains`.

### R. Establishing landscape with depth (painted look)
`hills`, `woods`, `river` (`coast`), `dunes`, `ancient` or `castle` + a slow camera `pan`: far planes are hazed and slide less. Push `parallax` to 1.5–2 for a showy reveal and `haze` up for heat or morning mist. Frame with `fg: foliage` (top corners) and keep the character on the near meadow or plaza.

### S. Looking out / listening audience
Through a window: `fg: window-frame` over a `castle` or `street1920`, a character's shoulder at `z` 1.3 in a corner. A speech or verdict: `fg: silhouettes` (`who` = cast backs) under a speaker on a `stage` or in a `set` `courtroom`.

### T. Shot-size grammar (vary the size every cut or two)
Frame the subject instead of zooming by hand: `camera.frame: {"target": "<id>", "size": "ecu" | "cu" | "mcu" | "ms" | "ws" | "ews"}`.
Establish at `ws` / `ews` (a `high` angle makes the figure small and lost), cut to `ms` for the gesture, `mcu` / `cu`
for the reaction, `ecu` + `letterbox` for the stare or the scream. Power and triumph: `angle: "low"` at `ms` over a
crowd. Panic: `handheld` + `shake`. Chase: `follow` the runner (`onTwos` for snappier legs), `whip` to the pursuer.
Dread: `dollyzoom` on a `cu`. Reveal of a second character: `rack` focus from the foreground one to the far one.

### U. Vehicles and walkers on a path (painted look)
A street establisher with life: the hero car on a `path` with `ease: "out"` so it rolls in and stops, a second vehicle crossing behind at a smaller `size` with `atmos`, a pedestrian on a `path` with `gait: "walk"`, and the camera `follow`ing the hero (`size: "ws"`, `axis: "x"`). Exhaust and wheel rotation come from the distance travelled.
```json
{"bg":{"kind":"street1920"},"camera":{"follow":{"target":"car","lag":0.4,"size":"ws","axis":"x"}},
 "layers":[{"type":"vehicle","kind":"sedan1920","size":260,"atmos":0.25,"path":{"pts":[[1.15,0.8],[-0.2,0.8]],"dur":4.6,"ease":"linear"}},
  {"type":"bean","who":"lady","x":0.86,"y":0.9,"size":300,"path":{"pts":[[0.86,0.88],[0.66,0.88]],"dur":4.6,"gait":"walk"}},
  {"type":"vehicle","kind":"model-t","id":"car","size":420,"riders":["driver"],"path":{"pts":[[-0.2,0.93],[0.52,0.93]],"dur":2.6,"ease":"out"}},
  {"type":"fg","kind":"lamp-post","side":"left"}]}
```

### V. The insert that matters (ECU on an object)
`camera.frame` keys from `ms` on the character to a `box` around the hands or the object (`overshoot` 0.08), or straight to a prop layer; the prop acts (`bottle` `pour`; the glassware fields `boil`, `fumes`, `fill`), `particles` carry the substance (`splash`, `gas`, `steam`), and the label is `hud`. End the beat with a cut back to a face.

### W. Poison, gas, fumes
`fx` `toxic-cloud` (`ground: true`, `drift`) creeping along the floor + low `particles` `gas` band (`prewarm`) + a per-shot cold `light` and a `grade` that drops on the key word (`{preset: "solemn", at, dur: 0.6}`). Never show the harm: characters `tremble`, then `exit: "fade"`, and the empty place holds.

## Tone: cold vs. comedic

| | Cold (MASTER_PROMPT) | Comedic (as in the reference) |
|---|---|---|
| Sky presets | `dusk`, `night`, `storm`, `teal` | `sunset`, `day` |
| Expressions | `neutral`, `worried`, `smug`, `shock` | `scream`, `happy`, `angry` |
| FX | `spotlight`, `rays` (dim), `flash` | `splat`, `confetti`, `sweat`, `speedlines` |
| Transitions | `cut`, `fade-black`, `dissolve` | `zoom-punch`, `whip` |
| Lettering | white, muted tags | colored tags, bouncing `title` |
| `style.vignette` | 0.35–0.45 | 0.25 |
| `grade` | `serious`, `storm`, `night`, `solemn` | `warm`, `gold` |
| Pose holds | 1.5–3 s, few changes | 0.4–1 s, frequent pose changes |

## Character sheet = `cast`

Define recurring characters **once** in `spec.cast` and reference them via `who`. This keeps a character looking the same in every shot: it's the equivalent of the "character sheet" from MASTER_PROMPT. Appearance fields are listed in `03-spec-reference.md` → bean.
