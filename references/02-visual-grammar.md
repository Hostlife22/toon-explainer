# 02 · Visual Grammar: Which Shot for Which Line

Each script frame (`vo` + `screen`) becomes one shot in the spec. First pick the **beat type**, then take its recipe and substitute your own content. Recipes are tested `layers` fragments; the full field contract is in `03-spec-reference.md`.

## Pacing rules (from the reference measurements)

1. A shot lasts 1.5–4 s. If a line runs longer than 5 s, split the shot into 2–3 internal beats: a pose change (`pose:[{at,v}]`), a pop-in caption (`at`), a punch-zoom (`camera.punch`).
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

## Depth rule (v2): build every shot from 3 planes

1. **Foreground** (`fg`, `z` 1.3–1.6): bushes in the corners, overhanging canopies, a ledge, tall grass, a trunk at the edge, or an over-the-shoulder back of a head. Covers 10–25% of the frame and is darker than the midground.
2. **Midground**: characters (3/4 view!), crowds, props.
3. **Background**: a rich backdrop (`forest`, `city`, `sky` with the right cloud style, `interior` with light wedges).

Add atmosphere (`fx`: `birds`, `beam`, `rain`, `smoke`, `fire`) and, when the tone calls for it, `grade`. An empty background with a lone character is acceptable only for reactions (`burst`) and title cards.

## Recipes

### A. Cold open / date
Empty location, then the date, then the era badge.
```json
{"bg":{"kind":"sky","preset":"dusk","clouds":5,"rays":true},
 "camera":{"zoom":[1.0,1.06],"pan":[[0,0],[30,-10]]},
 "layers":[
  {"type":"prop","kind":"temple","x":0.5,"y":0.8,"size":420,"enter":"none","z":0.8},
  {"type":"date","text":"46","suffix":"до н. э.","x":0.5,"y":0.22,"at":0.5},
  {"type":"era","small":"46 до н. э.","parts":[["РИМСКАЯ","#e0393e"],["РЕСПУБЛИКА","#fff"]],"x":0.025,"y":0.95,"at":0.2}]}
```

### B. Character introduction (name + tag + arrow)
The most common shot in the reference.
```json
{"layers":[
  {"type":"bean","who":"caesar","x":0.62,"y":0.97,"size":680,"expr":"smug","pose":[{"at":0,"v":"hips"},{"at":2,"v":"point"}],"talk":[[2.1,3.5]]},
  {"type":"label","tag":"ДИКТАТОР","text":"ЮЛИЙ ЦЕЗАРЬ","x":0.28,"y":0.36,"at":0.8,"arrow":"down-right","size":88}]}
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
  {"type":"label","text":"+1 МЕСЯЦ","x":0.3,"y":0.18,"at":0.9,"color":"#9be07f"},
  {"type":"bean","who":"b","x":0.72,"y":0.95,"size":520,"flip":true,"expr":[{"at":2,"v":"shock"}],"pose":[{"at":2,"v":"scared"}],"shake":[{"at":2,"dur":0.5}]},
  {"type":"label","text":"−1 МЕСЯЦ","x":0.72,"y":0.18,"at":2.1,"color":"#ff6b6b"}]}
```

### E. Specifics: a number, amount, or year (credibility)
`burst` background, a large counter, and a punch-zoom the moment the number finishes counting.
```json
{"bg":{"kind":"burst","color":"#2f8f8a"},"camera":{"punch":[{"at":2.4,"amount":0.12}]},
 "layers":[{"type":"counter","x":0.5,"y":0.55,"from":0,"to":20000,"dur":2.2,"suffix":" СОЛДАТ","size":150,"color":"#ffe066"},
           {"type":"fx","kind":"speedlines","x":0.5,"y":0.5,"at":2.4,"out":3.2}]}
```
For a document or study, use `card` (title, year, 2–3 lines); for a day, month, or deadline, use `calendar`.

### F. Map / geography / spread
```json
{"bg":{"kind":"parchment"},"layers":[{"type":"map","land":[[0.45,0.55,0.25,0.18],[0.7,0.4,0.2,0.2]],
  "regions":[{"pts":[[0.38,0.5],[0.5,0.45],[0.55,0.6],[0.42,0.66]],"at":0.5,"dur":1.5}],
  "pins":[{"x":0.47,"y":0.55,"at":0.3,"label":"РИМ"}],
  "routes":[{"pts":[[0.47,0.55],[0.6,0.45],[0.72,0.38]],"at":1.2,"dur":1.4}]},
  {"type":"bean","who":"x","x":0.62,"y":0.6,"size":260}]}
```
For real geography, supply a `map.image`: an AI-generated parchment-style map or PNG outlines. The code handles fills, pins, and routes.

### G. Turn to the "villain" / the system
Dark preset (`night`, `storm`), villain large from below (`size` 750+, `y` 1.02), `expr:"smug"`, slow push-in `zoom [1, 1.12]` with `ease:"out"`, `fx: spotlight` or dark-colored `rays`. Tag caption: "ИНДУСТРИЯ", "КОРПОРАЦИЯ", "СЕНАТ".

### H. Cinematic episode scene (closed-door meeting, experiment)
5–8 short shots (1–2 s) in a single `interior` location:
- wide shot;
- face close-up (`size` 1100, `y` 1.35 — head fills the frame);
- detail (`prop` large);
- reaction (`burst` + `shock`).
Speed up toward the climax (as in the reference, median 0.87 s).

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
`fg: ots` (`who` is the listener, `side` opposite the speaker) + the speaker in 3/4 view with `talk`, pose changes, and a caption. Put the caption **after** `ots` in the layer list so the back of the head doesn't cover it.

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
