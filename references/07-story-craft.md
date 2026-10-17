# 07 · Story craft: from any script to a well-animated film

This guide is for the director: the agent that turns a narration script into a shot list and then into a spec. Plan the story first with [09-directing.md](09-directing.md) (central question, arc, shot cards); use this guide to turn each beat into a shot, [10-technique-library.md](10-technique-library.md) to choose a technique by purpose, and [11-vertical-shorts.md](11-vertical-shorts.md) for 9:16 shorts. The numbers come from a frame-by-frame study of eight reference explainers (empire history, a Chinese dynasty survey, the Reconquista, World War I, the road to World War II, a speech fact-check show, a Greek myth and a horror biography), about 3.5 hours in total, measured at 12 fps and converted to 30 fps. Every recipe is topic-independent: X, Y and Z are people, groups, countries, companies or ideas, and N is a number.

Every name in backticks is real engine vocabulary. Field contracts live in [03-spec-reference.md](03-spec-reference.md) and the toolkit cards listed in [08-toolkits.md](08-toolkits.md): [characters](toolkits/01_characters.md), [acting](toolkits/02_acting.md), [props, creatures and vehicles](toolkits/03_props_creatures_vehicles.md), [places](toolkits/04_places.md), [maps](toolkits/05_maps.md), [paper and lettering](toolkits/06_paper_and_lettering.md), [game UI](toolkits/07_game_ui.md), [FX and tone](toolkits/08_fx_and_tone.md) and [transitions and lens](toolkits/09_transitions_and_lens.md). Core shot recipes (character intro, reveal, map, counter) are in [02-visual-grammar.md](02-visual-grammar.md).

Times are seconds unless written as frames (f). 1 f = 1/30 s: 2 f = 0.07, 3 f = 0.1, 6 f = 0.2, 8 f = 0.27, 10 f = 0.33, 12 f = 0.4, 15 f = 0.5, 20 f = 0.67, 30 f = 1.0.

## 1. The director's loop

### 1.1 Script to beats to shots

1. **Read the whole script first.** Write a one-line spine: who wants what, what goes wrong, what changes by the end. If the script is a list of facts, find the conflict hiding in it (X vs the problem, the old way vs the new way, expectation vs reality).
2. **Pick a frame device** (section 3.2) and **a recurring device** (section 3.4). They are what make 20 facts feel like one story.
3. **Split the narration into beats.** A beat is a clause that deserves a new picture: a new actor, a new number, a new place, a turn ("but"), a key noun or idiom. At 160 wpm that is one beat per 4–8 words, so a new image every 1.5–3.5 s.
4. **Tag each beat** with an intent group from section 7 (conflict, change, quantity, time...) and a tone: comic, neutral, dark or atrocity (section 5).
5. **Group beats into shots.** A shot holds as many beats as share one framing:
   - 1 beat per shot: gag insert, reaction, punchline card, dialogue line (1.5–3.5 s);
   - 2–4 beats per shot: map, board, stage, tableau, TV quote (6–15 s, a pop-in every 1.5–3 s);
   - 1 beat held long: dread, grief, atrocity stills (3–12 s, nothing new on purpose).
6. **Build a map spine with gag inserts.** Exposition rides on one long-lived composition (a map, a timeline, a chalkboard, a TV studio) that keeps state across shots (`damage`, recoloured regions, a `hangsign` counter). After every 1–3 spine beats, hang a 1.5–3 s gag insert that literalizes the line, then cut back to the spine exactly where it was.
7. **Word = event.** Put the `at` of the pop, the snap, the `camera.punch` or the `camera.jump` on the key word of the line, never on the cut. Text arrives 0.3–1.0 s after the cut.
8. **Change the visual mode every 60–90 s:** map, then skit, then UI parody (`hud`, `versus`, `slides`), then board (`chalkboard`, `corkboard`), then host. The change itself resets attention.
9. **Write the spec:** `script2spec.py` skeleton, `cast` once, then layers per shot from section 7, validate, `--sheet`, `--stills` on the risky shots, render.

### 1.2 Budget by film length

| Film | Shots | Beats | Mode changes | Dark beats | Recurring devices |
|---|---|---|---|---|---|
| 30 s short | 10–14 | 12–16 | 1–2 | 0–1 | 1 callback |
| 40–95 s vertical short ([11](11-vertical-shorts.md)) | 12–25 compositions, mean 3–4.5 s | 15–40 | a new mode every 5–15 s | 0–1 (slows down for it) | 1 callback + a loop, photo or sting ending; no title card |
| 60 s | 18–25 | 25–35 | 2–3 | 0–1 | 1 running gag |
| 3 min | 45–60 | 70–100 | 3–4 | 1–3 | 1 counter + 1 running gag |
| 10 min | 70–160 (measured 73–157 detected shots per 10 min; five of eight long films are under 100) | 220–300 | 8–10 | 3–8 | counter, lurker or host, 2–3 prop callbacks |

### 1.3 The beat test

A beat is finished when the frame answers "what changed?" in one glance. If the answer is "only the words", add one of: a pose snap, an expression snap, a pop-in, a `swap`, a camera `jump`, a `punch`, or cut.

## 2. Pacing

### 2.1 Measured shot length

| Reference (part) | Mean shot | Effective beat | Notes |
|---|---|---|---|
| Empire history | 4.6–5.3 s | ~2 s | arguments cut every ~1.5 s; gag lists 1.5–3 s; exposition maps 8–15 s; held emotional shots 10–12 s |
| Dynasty survey | 4.9–6.5 s | 1.5–3 s | map spine 6–25 s with a change every 1.5–3 s; gag inserts 1.5–4 s; punchline cards 2–3 s |
| Fact-check show | 3.5–5.4 s | 1.5–3 s | TV quotes 5–15 s; reaction gags 1–2 s; explainer runs 2–4 s |
| Greek myth | 2.4–4.2 s | 2.5 s | dialogue 2–3.5 s; fights 1.0–1.6 s; dread and grief holds 4–6 s |
| Horror biography | 6.6 s | 2–3 s | dark beats 8–12 s; comic beats 2–4 s |
| Reconquista | 5.7–7.5 s (median 4–5) | ~2.3 s | gags 1.5–4 s; maps 8–25 s, a new element every 2–3 s |
| World wars | 3.0–5.5 s | 1.5–2.5 s | reactions 1–2 s; maps 4–15 s; one chalkboard ran 73 s with 12 internal scenes |

Full-decode re-measurement (2026-10-15: every frame of every video decoded, cut = grey-frame difference spike with a 3-frame debounce; flashes, whips and stepped fire inflate the count, dissolves are missed, so treat these as ±10 %):

| Video | Cuts | Mean shot | Median shot | Still frames |
|---|---|---|---|---|
| Empire history (38:29) | 445 | 5.2 s | 4.6 s (comic first half 3.5, serious second half 5.9) | 0.29 |
| Dynasty survey (32:02) | 285 | 6.7 s | 5.9 s | 0.46 |
| Reconquista (24:08) | 175 | 8.2 s | 7.1 s (climax 4.5) | 0.37 |
| World War I (31:11) | 296 | 6.3 s | 4.8 s | 0.37 |
| Road to World War II (18:57) | 240 | 4.7 s | 3.4 s | 0.28 |
| Fact-check show (23:19) | 219 | 6.4 s | 5.0 s | 0.36 |
| Greek myth (21:38) | 339 | 3.8 s | 3.0 s | 0.21 |
| Horror biography (19:38) | 171 (about 140 real) | 6.9 s | 5.3 s | 0.31 |
| 12 vertical shorts (40–95 s) | 9.5–17 per minute | 2.3–5.9 s | 2.3–6.0 s | 0.02–0.19 |

Rule: **mean shot 4–8 s, effective beat 1.5–3 s.** A shot may run long only if it keeps changing inside. Conversational host scenes (two-shots of a host and a silent viewer) run 10–30 s; quote and map holds 15–23 s; next to them, sub-2 s inserts (a written joke, a reaction, a black sarcasm beat) keep the rhythm.

### 2.2 Shot length by scene type

| Scene type | Length | Inside the shot | Engine |
|---|---|---|---|
| Gag insert | 1.5–3 s (set piece up to 8 s) | one action | hard `cut` in and out |
| Punchline card | 2–3 s | one hit, then hold | `stamp`, `prohibit`, `boom` with `text` |
| Reaction close-up | 1–2 s | one `expr` snap | `bg: burst` or `mood` |
| Dialogue shot / reverse | 1.5–3.5 s | mouth + one pose snap | `talk`, `pose` keys, `fg: ots` |
| Quote on a screen | 5–22 s (measured holds of 19.5 and 21.5 s while the karaoke fills) | karaoke words, flagged lies | `doc kind:"tv"` + `subtitle` |
| Map spine | 6–25 s | pop-in every 1.5–3 s | `map` + `camera.zoom` drift |
| Establishing | 3–6 s | slow pan, birds, a sign | `fx: birds`, `signpost` |
| Tableau / board | 3–9 s per tableau (a board 15–70 s) | one figure or line per clause | `parchment-panel`, `chalkboard`, `corkboard` |
| Dread hold | 4–6 s (horror 8–12) | light, vignette, one small motion | 1 %/s push-in |
| Grief / aftermath | 3–6 s | none, or a slow `pool` | no gags |
| Montage item | 1.5–4 s each | one emblem + one gag | `overlays` timer or counter |
| Fight / chase cut | 1.0–1.6 s | `jitter` on twos | then a 2–4 s outcome hold |
| Title / chapter card | 1–3 s | letters pop | `title`, `mission`, `timeskip`, `spin-zoom` |

### 2.3 Cuts and holds

- **85–90 % of cuts are hard cuts.** Transitions mean something: time (`cloud-wipe`, `timeskip`), memory (`dissolve`, `sepia-to-color`), a world switch (`fade-white`, `portal`), impact (`flash-cut`), death or a chapter (`fade-black`, `black-beat`). Budget one non-`cut` transition per 4–5 shots.
- **Holds are alive, not frozen.** Long films are 21–46 % fully still frames, and characters freeze completely for 0.9–2.5 s between snaps (a 33 f held mallet, a 58 f still dinner shot); what keeps the frame from dying is the camera drift (`zoom` [1, 1.04]), blinks, idle rock, flames, map tokens hopping or a slow `move`. Shorts are stricter: 2–19 % still frames, so every hold drifts.
- **Medium shots may hold the body still for 4–6 s** apart from the mouth; the pose snaps carry the acting.
- **Prefer a beat inside the shot to a cut** when the framing would stay the same (map, board, stage).
- **Black and empty beats are deliberate.** Measured black lengths by job: 16 f for an impact, 27 f between chapters, 1.3 s as a sarcasm pause, 3 s after a death, 7.3 s before entering a dread place. Empty sets: 3–12 f of an empty set before a character pops in; 1 s of an empty card after the gag; 1–3 s of black before a solemn title (`black-beat` with `dur` 2 and `title`).
- **Speed up toward the climax, or get heavier:** fights and arguments cut every 0.1–1.6 s (an argument's shot/reverse shrinks from 1.6 s to 0.1 s, Rome 4:28), then hold the outcome 2–4 s. Serious climaxes may instead keep 2–9 s shots and escalate through content (Rome's ambush; earlier docs claimed a 0.87 s median there, which the full decode does not reproduce).

## 3. Structure

### 3.1 Hooks and cold opens (first 10–40 s)

In long films every hook ends on a series or title card within 15–45 s (`title` letters popping, or `spin-zoom` into the first scene). Vertical shorts never do: the first sentence is the claim and an event lands within 2 s ([11-vertical-shorts](11-vertical-shorts.md) §5).

| Hook | Recipe |
|---|---|
| Reverse-chronology map | One `map` stepping back through 3–4 states (`wipe` per region, 2–3 s each), a `hangsign` era caption, a ruler figure under `poof` + `swap`, then `fade-white` with `camera.zoom` [1, 1.8] into scene one |
| POV hands on a desk | `fg: hands-fpv` over a `tabletop` map; `tacks` pin the places; a wrong guess is struck (`xmarks`); a `bigyear` slams in |
| Slapstick summary | Two archetype beans slap-fight at a border under joke `signpost` planks; `brawl` cloud; it clears to two `gravestone` props |
| Comparative stat | `timeline` with other long spans popping in; the subject's span `grow`s and dwarfs them; `camera.punch` on the reaction |
| Promise of judgement | Host reads a `list` of guests to judge; each guest reaction is a 1 s `expr` snap insert |
| Beauty turning to rot | Idyllic shots, `grade` shift to `cold`, a `reaper` fading in (`enterDur` 2.4), `fade-white` to the title |
| Eyes as screens | Close-up with `expr:"vision"` and look `vision:"skull"`; the host refuses the topic; `marks` `scribble` |
| "You" are invited in | `fg: eye-pov` with `wake`, a `menu` with `click`, `insert` card, title |

### 3.2 Frame stories (the wrapper that carries meta jokes)

| Frame | How it works | Engine |
|---|---|---|
| Storyteller | POV desk, a map unrolls; bookend in an armchair by the fire; a lurker in the doorway at the end | `fg: hands-fpv`, `bg: office` with `desk` false, `armchair`, `reaper` |
| Museum | Host walks a gallery; each painting is a world with its own narrator | `bg: gallery`, `panel` `frame:"gilt"`, `portal` |
| Video game | Missions, score pop-ups, pause menu, insert-disc chapters, glitches when the topic turns dark | `mission`, `hud`, `pause`, `insert`, `glitch` |
| Trial / fact-check | Each quote plays on a TV with karaoke subtitles; host verdict; callbacks to earlier guests | `doc kind:"tv"`, `subtitle` `flag`, `scorecard`, `stamp` |
| Grandpa and kid | An elder tells it, a kid demands drama, the narrator gives in | `age:"elder"`, `age:"child"`, `sleep-drool`, `marks` `zzz` |
| Recurring host | A host appears every 60–90 s to comment, hold props to camera, argue with the story | `cast` host, `fg: ots`, `room` `variant:"gamer"`, `cctv` |

### 3.3 Act shapes

- **Cycle:** rise, flaw, collapse, shatter, counter increments, new unifier. Repeat 3–7 times on one map spine with 2–6 gag inserts per pass; each pass is faster than the last.
- **Myth arc:** setup, inciting sin, escalation (a curse), payoff, consequence, dark turn, new cause.
- **Case loop:** quote, verdict line, 1–4 explainer cutaways, back to the host. Later cases run faster (2.5 min, then 30 s, then a 6 s dismissal).
- **Chapter per actor:** one actor per 30–60 s, each with a `nameplate`, one defining gag and one exit beat.
- **Montage block:** many similar items under a running HUD (`timer-lcd` or `counter` in `overlays`, or `slides`), 1.5–4 s each.
- **Compare block** at the end of an act: inside vs outside, then vs now (`panel` `layout:"split"`).
- **Payoff, then immediate undercut:** "...and 15 years later it all fell apart" (`timeskip`, then the ruin).

### 3.4 Recurring devices

| Device | Rule | Engine |
|---|---|---|
| Running counter | A sign that returns on every repeat event with the same peel animation; the narrator calls it back | Per shot: `doc kind:"hangsign"` with `swap` `num`. A count that must stay on screen across cuts: `hud kind:"counter"` in `spec.overlays` (`value` keys, `sep` or `compact`, `hideIn`), see [07 Game UI](toolkits/07_game_ui.md) |
| Persistent markers | Open questions stay on screen until answered (red X flips to a green check) | `overlays` + `hud kind:"chip"` `answerAt` |
| Persistent damage | A region keeps its black eye in every later map shot; a character keeps a sticker | region `damage`, look `stickers`, `bruise` |
| Callback composition | Reuse an earlier exact composition with roles reversed | same `bg` and layer layout, swapped `who` |
| Rhetorical callback | The same sarcastic line at two collapses, with an identical shot | same layers, new `nameplate` |
| Narrator interruptions | Every 60–90 s the host breaks in: argues, threatens the co-host (censored), opens a door on a disaster | host `cast`, `drip` transition, `door` `behind:"fire"` |
| Style-switch reset | Every 60–90 s a new visual mode | `hud`, `chalkboard`, `material:"engrave"`, `crayon`, `studio` |
| Recurring lurker | A small deadpan reaper pops into normal scenes, waves, holds a paper | `reaper` `pose:"sign"` `expr:"smile"`, `enter:"peek"` |
| Prop callback | A gag prop returns 2–5 minutes later | same `prop` kind |

### 3.5 Cliffhangers and outros

- Chained `throne` (`chains`, `sign` "BOSS STILL ALIVE"); a hooded figure grins after a `silhouette-in`; a ship sails toward the next topic (`galley` + `move`); `tbc` arrow with bouncing words; a `cctv` coda with the lurker; the narrator passes out (`exit:"pivot-fall"`).
- Outro: a `panel` `layout:"grid"` of cast busts with frozen `t`, and empty `frame:"gilt"` cells for end-screen links.

## 4. Comedy devices

| Device | Recipe | Engine |
|---|---|---|
| Literalized idiom | Draw the words: "stabbed in the back" = dagger in the back; "puppet ruler" = strings to a bar; "scapegoat" = a goat at a lectern; "turned the tables" = a flipped card; "drop like flies" = a queue tumbling off a cliff | `dagger`, figures `strings`, `goat` + `lectern`, `exit:"tumble"` |
| Anachronism insert | A modern object in an old scene, full shot 2–8 s, never a split | `smartphone`, `helicopter`, `dump-truck`, `crt`, `studio` |
| Game/media metaphor | An abstract process as a known UI | `upgrade`, `trade`, `slides`, `killfeed`, `wheel`, `joins`, `highscore` |
| Relabel punchline | Same object, new text: a caption swaps in place, a sign flips, a list is retitled | `nameplate` `strike`, `signpost` `turn`, `list` `retitle`, `swap` on `text` |
| Wrong one first | Show the decoy, then the right one pops beside it 0.6 s later | two layers, second `enter:"pop"` |
| Downgrade | Show the grand version, scissors cut it, pan down to the tiny real thing with a sad bean | `crayon` `cut`, `scissors`, `camera.pan` |
| Deflation | Within 2–6 s of a scare or a death: hard cut to a warm `burst` (shorts use a blue swirl backdrop, `bg: mood` `variant: "swirl"`), deadpan `squint`, or the victim gives a thumbs-up | `flash-cut`, `expr:"squint"`, `pose:"thumbs-up"` |
| Absurd tool | A baguette in a sword clash, a bucket as a ladder | any prop as `hold` |
| Object stand-ins for violence | Boxing gloves for attacks, a bowling strike for an offensive, food tokens as armies | `arm` `kind:"glove-spring"`, `bowling-ball` + `pins`, `squads` `prop:"croissant"` |
| Absurd escalation | One becomes many in one frame; each prop pops bigger (1x, 1.6x, 2.5x); "x37" unit cards | same `at` on copies, `scale` steps, `unitcards` |
| Interruption card | "WE DON'T HAVE TIME" explosion, an "INSUFFICIENT FUNDS" popup, "N SECONDS LATER" hides the act | `boom` `text`, `error`, `timeskip` |
| Persistent injury | Once punched, the region or bean keeps the bruise | region `damage`, look `bruise`, `bandage` |
| Pun character | Any noun + face + arms + headwear is an actor | `obj` with `face`, `arms`, `head` |
| Calm villain | Officers take tea while chaos runs behind | `teacup`, `expr:"smug-closed"` |
| Editor meta gag | A cursor drag-selects a character "to delete him" | `cursor` `drag` `then:"delete"` |
| Sign as narrator | A wooden sign states the irony ("POPULATION: 1") | `signpost`, `stack` |
| Group as object | Food tokens, animals (rabbit vs turtle), countryball heads | `squads`, `rabbit`, `turtle`, look `flag` |
| Spoiled kid | The aggressor as a child who wants things, a weak parent gives in, three times | `age:"child"`, `expr:"wail"`, `flail` / `flail-b` |
| Joke at the end of a list | The last line of a serious list is absurd | `checklist`, `list` |
| Narrator aside | A tiny scholar bobs up holding a book: "historians aren't sure" | `enter:"ground"` or `rise`, `hold:"book"` |
| Liar | Noses grow while they smile | look `nose` `grow` |

Rules: one joke per insert; the hold after the hit is the joke (1 s minimum); a gag never sits inside an atrocity beat; deliver the punchline on the cut, not in the middle of a move.

## 5. Dark beats

1. **Never show the death itself.** Cut before the act (the sword is raised, cut) or after it (the aftermath still). Stand-ins, mild to strong:
   - `expr:"dead"` with `pose:"lie"`, a small `pool`, a helmet lying beside the body (`fx: hat` `mode:"fly"`);
   - an empty hat landing alone; a ghost (`material:"ghost"`, `enter:"fade"`); the soul rising 60 px (`move`);
   - a `gravestone` or `coffin` sliding in; `crosses` tiling a region; a `spill` flood turning the sea red;
   - a `killfeed` line, a `stat-block`;
   - a colour flood: `blood-wipe`, `blood-streaks` then black, the `drip` transition;
   - a `brawl` cloud that clears to one survivor; dust hiding the hit;
   - 1 s of black (`black-beat`), then the next scene.
2. **Mass casualties are objects, never bodies:** `crosses`, map `fires`, a `stat-block` with a nametag, `doc kind:"stat"` on a brick wall, a `rot` slide into red darkness.
3. **Deflation timing:** comic deaths (pivot fall, slip, zap) deflate within 2 s; ordinary deaths get a 3–4 s neutral hold, then a lighter beat within 5–15 s; scares deflate within 2–6 s of the peak.
4. **Do not deflate atrocity beats** (genocide, famine, mass terror, harm to children): no gags in the scene, a `dusk-blue`, `cold` or `solemn` grade, slow framing, statistics as text or an object, hold the dark word silent about 2 s. Irony may target the perpetrators' denial (`graffiti` `cover` + `rewrite` + `thumb`), never the victims. Comic relief returns 30–60 s later at the earliest.
5. **The grade carries the tone:** `solemn`, `cold`, `night`, `dusk-blue` or `moonlit` on the dark beat; `rage` or `red-flash` for 1 s on a realisation; keep the next shot `cold` after a death.
6. **Hold, don't move.** Dark stills hold 3–12 s with `zoom` [1, 1.01] or a slow `pool`. End the beat with `glow-open` `mode:"push"` (1.0 to 1.6 into black) or `fade-black`.
7. **Threats stay cute-scary:** the `reaper` waves, holds a paper (`pose:"sign"`), sits at a deathbed with arms crossed.
8. **Censor jokes only for fictional threats** (the narrator threatening a co-host): `drip` closes, hold, open.
9. **Symbols and people:** use generic flags (`flags` `pattern` `disc`, `stripes`, `band`, initials), neutral `emblem3d` shapes and the `party-tunic` (no insignia). Never draw extremist symbols, real logos or real likenesses: historical figures are generic beans with era costume, a `nameplate` and one prop.

## 6. Motion timing (30 fps) mapped to the engine

### 6.1 Posing and acting

| Action | Measured | Engine |
|---|---|---|
| Pose snap | 1–2 f, no in-betweens, then hold 1.5–3 s (4–6 s in medium shots) | `pose` keys, `poseBlend` 0.07 (default) |
| Slow-burn realisation | eyes widen over ~4 s while the pose holds ("wait a minute") | expressions do not blend: hold `neutral` with a slow push (`zoom` [1, 1.08]), add `marks` `ticks`, then snap `shock` on the last word |
| Settle after snap | ~6 f, ~4.5 % squash | built into the rig |
| Breakdown frame on big gestures | 1 drawing for 2–3 f, body tilted 8–10° | `snapTilt` 8 |
| Anticipation dip | ~3 f dip before, 2 f stretch after | `antic` true |
| Smooth gesture (rare) | 6–8 f | `poseBlend` 0.25 |
| Turn back to front | 1 f | `swap` `view` |
| Expression snap | exactly 1 f, both characters on the same frame | `expr` keys at the same `at` |
| Cringe after the snap | ±1.5 px for 4 f | `jitter` `amp` 1.5 with `from`/`to` |
| Grit / strain | ±2 px on twos for ~1 s, opposite directions for two figures | `jitter` `amp` 2 `on` 2 |
| Fear tremble | ±1–2 px every 2 f | `tremble` windows |
| Shout thrust | head forward on the stressed word | `lean` or `camera.jump` |
| Talk | new mouth every 3 f, head bob ±1.6° | `talk` windows |
| Blink | 3 f every ~3 s | built in; `blink` false for statues and the dead |
| Multiply pop | hold 8 f, all copies in 1 f | copies with the same `at`, `enter:"none"` |
| Crying fit | alternate two poses every 2 f | `pose` keys `flail` / `flail-b`, `expr:"wail"` |
| Cape follow-through | trails a turn by 2–3 f, overshoots ~10 % | `cape` + `move` |

### 6.2 Entrances

| Entrance | Measured | Engine |
|---|---|---|
| Characters at the cut | 0 f, already there; into a held shot, often an eased slide of the rigid cutout (~30 f in, 1.2–1.6 s out; Rome) | `enter:"none"` (bean default); `slide-left`/`slide-right` with `enterDur` 1 |
| Pop (labels, icons) | 0 to 1.15 to 1 in 6–7 f, staggered 6–8 f | `enter:"pop"`, `pop-tilt` |
| Stretch (figures) | 0.3 to 1.15 to 1 in 3 f | `enter:"stretch"` |
| Drop-squash (objects, stats) | fall 2 f, squash 1 f, settle by ~12 f | `enter:"drop-squash"` |
| Slam (verdicts, stamps) | 1.6 to 1 in 3 f + shake | `enter:"slam"`, `stamp` |
| Hat drop | falls 2 f, squash 2 f | `fx: hat` `mode:"drop"`, target `swap` `head` at +0.13 |
| Cage drop | 5 f fall, 3 f bounce, 1 f stagger between cages | `cage` `drop`, 0.04 s apart |
| Slide-in object | ~10 f, overshoot 4 % | `slide-left`, `slide-right`, `slide-up`, `slide-down` |
| VS card | right 5 f, left 2 f later, VS rises 8 f | `versus` |
| Name rise | 8 f from below | `nameplate` `in:"rise"` |
| Peek | head and shoulders in 6–8 f, tilted 15–20° | `enter:"peek"` |
| From the ground | dark hole 3 f, figure at 1.06, settled by f5 | `enter:"ground"`, groups 0.4 s apart |
| Silhouette rise | dark shape over ~15 f, colour fades in | `enter:"silhouette-in"` |
| Spat out of a portal | 10 f arc + drop-squash | `enter:"spit"` |
| Off-screen arm | 2–4 f in, hold, 5 f out | `arm` `reach` `dur` 0.12 `hold` 0.5 `back` 0.17 |
| Ghost fade | alpha 0 to 0.75 over 15 f | `material:"ghost"` + `enter:"fade"` |
| Lurker fade | 60–75 f | `enter:"fade"`, `enterDur` 2.4 |

### 6.3 Exits

| Exit | Measured | Engine |
|---|---|---|
| Shove / tumble | spins ~18°/f on a gravity arc, gone in ~15 f; hat pops up 80 px | `exit:"tumble"` `tumble.detach:"head"` + rubber `arm` arriving at `out` |
| Zip | lean back 4 f, gone on f5, puff trail 5 f + 15 f fade; panic variant: 15 f crouch + ~10 f of leg-wheels first | `exit:"zip"`, `zip.rev` |
| Poof swap | cloud covers in 2 f, boils ~5 f, fades 12 f; swap under it | `fx: poof` at t, target `swap` at t + 0.07 |
| Run away in a cloud | stacked clouds rising from the feet | `poof` `mode:"column"` + `out` |
| Pivot fall | 90° about the feet in 10 f, squash 2 f, dust 30 f | `exit:"pivot-fall"`; `fall.snap` true for a faceplant |
| Group vanish | each fades over 30 f, next starts halfway | `out` + `exit:"fade"` `exitDur` 1, staggered 0.5 s |
| Walk into depth | scale −30 % over 1.5 s | `walk` + `move` with `scale` |
| Exit behind an occluder | walk until a foreground edge hides them | `fg` layer after the bean |
| Puppet yank | out in ~3–7 f | figures `yank`, or `move` `dur` 0.2 |
| Delete | marquee, white burst | `cursor` `then:"delete"`, target `exit:"pop"` `exitDur` 0.07 |
| Disintegrate | shards 4 f, ash 12 f | `fx: disintegrate` `target` |

### 6.4 Cycles

| Cycle | Measured | Engine |
|---|---|---|
| Walk | on twos, ~10–17 f per step, bob 4–6 px | `walk`, step 0.56 s (`gaitRate` to speed up) |
| Run | on twos, lean 20° | `run`, 0.4 s |
| Gallop | two poses on twos, bounce 8 px | `creature` `run`, `rider` |
| Wing flap | far: two poses every ~6 f | look `wings` + `flap` windows |
| March bob on maps | ±3 px on twos | `tokens` `bob`, `squads` `hop`, `camps` `move` |
| Oars | 0.6–0.9 s | `galley` `rowPeriod` 0.75 |
| Flames | small flames redrawn on twos; large fires boil every 4–6 f (Rome 11:35), screen-filling fire on threes (vertical shorts) | `fire`, `fires`, `torch` |
| Arms flail | alternate every 2–5 f | `flail` / `flail-b` keys |
| Spring punch | 11 f (out 2, hold 3, back 3, rest 3), x3 | `arm` `kind:"glove-spring"` `count` 3 |
| Region stab loop | 2 poses every 2 f | region `arms`, `split` `fight` |
| Pendulum (sign, mic, keys) | period 0.6–1.2 s, 6–18°, decays over 1–2 s | `swing` `{amp, period, decay}` |
| Day/night window | hold 22 f, crossfade 8 f | `window-cycle`, `room` `cycle` |
| Sweat spray | drops 15 f each | `sweat-spray`, `stack` |
| Beacon / flicker | on 10 f, off 5 f | `alarm` |

### 6.5 Impacts

| Impact | Measured | Engine |
|---|---|---|
| Hit-cut | frame N walking, frame N+1 already hit; hold 3 s | `swap` at the hit time, no in-between |
| Impact star | 2–7 f | `arm` `impact`, `explosion`, `fx: splat` |
| Smash | hold the raised tool 12–33 f, fall in 1–2 f, impact ticks on contact, hold 17–25 f; punches may arrive in 1–2 f with no wind-up at all (deadpan) | `pose:"hammer"` keys + `mallet` + `jitter` |
| Punch through a map | hairline crack 1 f before, cracks grow 5 f, push-in 8 % over 12 f | map `punch` + `camera.punch` |
| Fist close | palm to fist in 1 f, tremble 1 s | `arm` `kind:"hand"` `state` keys `open` then `fist` + `jitter` |
| Stomp | 2–3 f, flattens instantly, holds 30+ f, no bounce | `arm` `kind:"foot"` `stomp`, target `swap` |
| Camera shake | 6 px for 6–8 f; 4 f for small clunks | `camera.shake` `{at, dur: 0.2, amp: 6}` |
| Door slam | 1–2 f shut, starburst 7 f | `door` `slam` |
| Explosion | white core 2–5 f, yellow to orange by 15 f, smoke to 40 f | `boom` `style:"puff"` |
| Electrocution | normal / white / skeleton every 2–3 f for 0.5–0.8 s | `fx: shock` `target` |

### 6.6 Camera

| Move | Measured | Engine |
|---|---|---|
| Hold drift | 1–3 %/s, never static | `zoom` [1, 1.04] (default) |
| Push then cut | 1.0 to 2.2 in 6 f, cut on the reaction | `zoom` [1, 2.2] with `at`, `dur` 0.2, `ease:"inOut"` |
| Punch-in | 1.3–1.6x pulse | `punch` `amount` 0.12–0.3 |
| Jump cut-in | 1-frame jump 1.25–1.4x on the snap | `jump` `{at, zoom: 1.35, focus}` |
| Map zoom to region | ~12 f ease-out | `zoom`, `focus`, `ease:"outCubic"`, `dur` 0.4 |
| Slow pan | ~40 px/s on maps, 60 px/s follow pans | `pan` |
| Push to black | 1.0 to 1.6 over 1.2 s, fade over 12 f | `glow-open` `mode:"push"` `dur` 1.4–2 |
| Rotating overhead | 25° + 20 % zoom-out over 10 s | `bg: floor` `rot` keys, `zoom` [1.2, 1] |
| Letterbox | bars 9–25 % for 1–3 s on decisive close-ups | `letterbox` `{h: 0.12, at, out}` |
| Dutch | 12–30° for panic, melee, extreme close-ups | `rot` keys (2-frame snaps) |
| Rack focus | on the word that names the new subject | shot `focus` `[{at, on, px}]` |

### 6.7 Transitions

| Transition | Frames | Meaning |
|---|---|---|
| `cut` | 0 | 85–90 % of all cuts |
| `flash-cut` | 3 white | impact, teleport, scare deflation |
| `zoom-punch` | 9 | reveal, punchline |
| `dissolve` | ~10 | same subject closer, time on the same spot |
| `fade-white` | 12 | world switch, "entering the story" |
| `fade-black` | 15 | death, chapter end |
| `black-beat` | 12 (`dur` 2 with `title` for solemn) | before a climax, after a death |
| `cloud-wipe` | 27 (`word` `dur` 0.4) | time passed; POOF cut |
| `drip` | 36 | implied massacre, censor gag |
| `curtain` | 48 | act change, regime change |
| `explosion-wipe` | 21 | "boom, the war began", victory |
| `wave` / `bubble-wipe` | 21 / 15 | flood, dive |
| `portal` | 42 | into a painting or a map pin |
| `screen-dive` | 21 | into a TV or phone |
| `fg-pass` | 24 | moving between places without a hard cut |
| `spin-zoom` | 36 | new era, dynasty, chapter title slam |
| `glow-open` | 27 | into the darkness |
| `vignette-close` | 30 | alone, dread |
| `inkblot`, `peephole`, `slash`, `torn-split`, `barwipe`, `sepia-to-color` | 10–30 | horror, comic iris, rivalry, flashback |

## 7. Sentence type to shot recipe

**Notation.** Each recipe is a compact spec hint. A word in front of fields names the layer (`bean`, `map`, `arm`, `doc kind:"..."`, `fx kind:"..."`, `prop kind:"..."`); `key:value` is a JSON field; `@t` is the layer `at` in shot seconds; `+` joins layers in one shot; `>>` is a cut to the next shot; `->` is a timeline step inside a field. `bg:` and `grade:` are shot fields. Pick the intent group first, then the recipe; prefer literalizing the idiom in the line.

**Painted-engine upgrades by intent.** The recipes below were written for the classic look and still work; for a new painted film reach first for these features (cards in [08-toolkits.md](08-toolkits.md)):

| Intent | Painted-engine feature |
|---|---|
| Where and when (a new place or era) | `ews`/`ws` establisher: a Places 2.0 `set` or landscape, a real `geo` map (`iso`, `lonlat`, `drawOn`, `flood`) or an `ortho` globe spinning to the place |
| Somebody speaks, argues, persuades | `camera.frame` `ots` pair, `lookAt` the listener, `lipsync` from the voiceover when the character mouths the line |
| A reaction, a realization, a decision | `frame` punch `ms` -> `cu` / `ecu` with `overshoot`, `takes` (`double`, `snap`, `jolt`), new `expr` (`terror`, `awe`, `scheming`, `exhausted`) |
| The key object (a poison, a coin, a document) | `ecu` on the prop layer or a `box`, the prop acts (`pour`, `boil`, `fumes`, `fill`), `aura`, `particles` |
| Travel, traffic, an era of machines | vehicles and animals on a `path` (`orient`, `bank`, exhaust, dust, wake), `follow` camera |
| Work, experiments, industry | `set` `lab` / `office` / `factory`, machines with moving parts (`gears`, `piston`, `gauge`, `valve`, `fuel-pump`) |
| Smoke, poison, fire, explosion | `particles` presets, `toxic-cloud`, painted `explosion`, `impact-frame`, `shockwave`, `dustkick`, `streaks` |
| Spread to everyone, everywhere | globe with `continent` regions flooding in sequence; a crowd with `silhouettes` in the foreground |
| Time passing in one place | the same `set` with `dark` raised and a night `window`, `fidget` acting, a `wall-calendar` and a `hud` counter |

### 7.1 Power and conflict

| # | Narration | Recipe |
|---|---|---|
| 1 | "X declared war on Y" | `map style:"painted"` `geo` with regions by `iso`, `face` `mood:"angry"` + lon/lat `arrows` `double:true` `label:"WAR"`, one per pair, 1.2 s apart |
| 2 | "X invaded Y" | `map` `squads` `icon:"helmet"` `wipe:{region, to}` + `camera.pan` following the lead token |
| 3 | "X conquered region after region" | `map view:"tilt"` `figures` with `path`, `walk`, `paint:{color, every:5}` + `trails` `head`; on real geography: region `flood:{from:[lon,lat], by}` one after another |
| 4 | "X crushed Y" | `bg: burst` + tiny `bean` `scale` 0.3 + `arm kind:"hand"` `state:open->fist` @0.6 + `jitter` 1 s; `grade:"rage"` optional |
| 5 | "X was much stronger than Y" | `map view:"tilt"` `figures`: Y normal, X with look `build:"brute"`, `pose:"cross"` |
| 6 | "X kept attacking Y" | `arm kind:"glove-spring"` `count:3` from X's side + region `damage:{kind:"black-eye"}` kept in later shots |
| 7 | "X was squeezed from all sides" | `obj` + three `arm kind:"glove-piston"` from `left`, `right`, `top`, 2 f apart + `expr:"squeeze"` |
| 8 | "A huge power arrived" | `bean` `enter:"silhouette-in"` `from:"bottom"` >> `bg: sky preset:"sunset"` `grade:"sunset-epic"` + `build:"brute"` + `crowd` behind |
| 9 | "The armies met" | `bg: sky preset:"sunset"` valley + two `crowd` `silhouette:true` blocks (`count` 12 vs 5) + `cursor` `select` ellipses under each |
| 10 | "A huge battle / chaos" | `fx kind:"brawl"` `dur:1.5` over hidden fighters (`out` at the fx `at`) -> winner `pose:"fist"`, loser `pose:"lie"` `expr:"dead"` |
| 11 | "Civil war everywhere" | `map` `brawls:{region, count:9, every:0.06}` + `fires` + `arm kind:"foot"` `stomp` + `camera.shake` |
| 12 | "They swept everything away" | `creature kind:"horse"` `run` + `crowd` `march` crossing in 1.6 s + `fx: dust` |
| 13 | "X sacked the city" | `black-beat` >> `bg: burning variant:"city"` + giant `bean` `size` 1400 + `prop kind:"temple"` squashed by `swap` `scale` |
| 14 | "X threw everything at them" | `bg: mood variant:"action"` + `fx: paperstorm` + ducking `bean pose:"hands-face"` |
| 15 | "Command sent them over the top" | `bean view:"back"` -> `swap` `view:"front"` @0.5 + `hold:"whistle"` >> soldier `run` past a `gravestone` |
| 16 | "A decisive moment" | `camera.frame` `{target, size:"ecu"}` with `overshoot` + `letterbox` `{h:0.12, at:0.3, out:2}` >> `coin-flip` on `bg: flat` |
| 17 | "X ambushed Y" | `fg: hands-fpv` over `bg: mountains` slope >> `crowd silhouette:true` on the rims + `grade:"serious"` |
| 18 | "Hidden resistance" | `bg: forest` + `fx kind:"redeyes"` `blink` >> the bored hidden fighter `expr:"sleepy"` |
| 19 | "X's forces surrounded Z" | `map` two `camps` `move:{to}` closing in + `doc kind:"bigyear"` |
| 20 | "They fought to a standstill" | `map` region `arms` on both faces held 6 s, nobody moves |
| 21 | "X attacked from the sea" | `map` `tokens icon:"ship"` `count:5` `every:0.35` + target `cities` `burning` |
| 22 | "The front barely moved" | `map` `fronts` 1.5 s + `xmarks` where it stalled + `hangsign` counter |
| 23 | "Bombardment" | `bg: trench` + `fx kind:"shellburst"` + `camera.shake` per burst + `fg: sandbags` |

### 7.2 Rivalry and standoff

| # | Narration | Recipe |
|---|---|---|
| 24 | "X vs Y" | `doc kind:"versus"` `left`/`right` `{who, eyeGlow:true}` on `bg: flat` |
| 25 | "A rivalry in several rounds" | `doc kind:"sequel"` `titles` 0.2 s apart |
| 26 | "X and Y became rivals" | two close-ups nose to nose `expr:"menace"` + `jitter` `amp:2` each + a third bean squished between |
| 27 | "They couldn't agree" | one shot with `camera.frame` keys `{target:A, size:"mcu", ots:B}` -> `{target:B, ots:A, whip:true}` every 1.5 s; or `bg: mood variant:"grunge"` with a different `color` per speaker |
| 28 | "X wanted A, Y wanted B" | `panel layout:"split"` `seam:"jagged"` `vs:true` with cell `label`s |
| 29 | "Standoff" | `fx kind:"duel"` before the beans + `crackle` between the eyes |
| 30 | "A battle of wills" | `fx kind:"beam-clash"` after the bg + two beans `pose:"reach"` |
| 31 | "X and Y grew apart" | `obj shape:"heart"` with `split:{at, gap:0.18, label}` >> two beans walking apart |
| 32 | "Torn between two sides" | two `bean silhouette:"#141010"` pulling + a small coloured bean with `jitter` |
| 33 | "X stepped between them" | `fx kind:"duel"` + a third bean `pose:"spread"` + `marks` `shout-jag` |
| 34 | "Same goal, different methods" | `prop kind:"fork-signs"` `left`/`right` + two beans walking opposite ways |

### 7.3 Betrayal and deception

| # | Narration | Recipe |
|---|---|---|
| 35 | "X betrayed Y" | two beans `pose:"arm-around"` -> `swap` @1.0: `dagger` appears (`at`) + Y `expr` -> `shock` + small `fx kind:"blood-splash"` `count:3` |
| 36 | "X betrayed Y on the map" | neighbour region `arms` `weapon:"dagger"` while Y region `face` is busy (`mood:"happy"`) -> `damage` |
| 37 | "Allies at first, but..." | `doc kind:"newspaper"` `photo` of both >> the photo with `split` modifier, one half held, `expr:"angry"` |
| 38 | "They secretly plotted" | `crowd` walking with `hold:"dagger"` hidden by `flip` >> close-up with `dagger` `reflect` |
| 39 | "Conspirators watched" | two beans `enter:"peek"` at different heights + `fg: bushes` + `expr:"side-eye"` |
| 40 | "X staged an incident" | `bean expr:"smug-closed"` `hold:"bomb"` >> the same `crowd mode:"lineup"` -> `swap` `look` to the enemy colours |
| 41 | "It was all a lie" | three beans `pose:"hug"` + look `nose:{grow:[0.4, 1.9]}` staggered + one `expr:"grimace"` at the peak |
| 42 | "Looks nice, is ruthless" | cute close-up `expr:"cute"` on `mood` `bokeh` >> same framing, `grade:"inferno"`, `expr:"menace"` (match cut) |
| 43 | "Invited Y to a feast to kill him" | `dinner-table` `grade:"night-violet"` + guard `pose:"sword-up"` -> Y `exit:"zip"` leaves only `fx kind:"hat"` `mode:"fly"` |
| 44 | "X faked the numbers" | `doc kind:"tally"` `scribble` >> boss `expr:"smug"` |
| 45 | "X spread lies about Y" | X behind a `lectern` pointing at `doc kind:"poster"` of Y >> `crowd armsUp:true` `expr:"angry"` |
| 46 | "They covered it up" | `doc kind:"graffiti"` `cover` + `rewrite` (euphemism) + `thumb` |
| 47 | "X wormed his way in" | `door` + bean `move` to `scale` 0.2 into the keyhole + `exit:"zip"` `zip.hole:true` |
| 48 | "The fine print..." | `doc kind:"document"` + `magnifier` `reveal:{layers}` showing the hidden clause |
| 49 | "A secret clause" | `doc kind:"document"` `minimap` + `camera.pan` down to a second block |
| 50 | "X bribed Y" | `bg: burst` + Y `expr:"dollar"` + `arm kind:"rubber"` `hold:"moneybag"` -> a second `arm` shoves Z out (`exit:"tumble"`) + empty hold 1 s |
| 51 | "They deserted for money" | `crowd` `expr:"dollar"` `hold:"moneybag"` walking away + leader `expr:"hollow"` |
| 52 | "X was blind to it" | X pins a `tabletop` map + tiny bean with look `wings:"insect"` repainting a region -> X `bandage:"eyes"` |
| 53 | "Propaganda" | `doc kind:"poster"` `duotone` + `crowd` `expr:"star-eyes"` |

### 7.4 Death, decline and loss

| # | Narration | Recipe |
|---|---|---|
| 54 | "X was killed" (serious) | raised `sword` close-up >> `fx kind:"blood-streaks"` -> `fade-black`, hold black 2 s |
| 55 | "X was killed" (comic) | `exit:"pivot-fall"` + `marks` `whoosh` + bystander `expr` snap `scream` `pose:"clutch-head"` |
| 56 | "X died in <year>" | world-anchored `date` + bean walks, slips: `exit:"pivot-fall"` -> `pose:"lie"` `expr:"dead"` hold 2 s |
| 57 | "X died of illness" | `room` `variant:"hospital"` + `grade:{preset:"cold", at, dur:0.7}` + `reaper` `enter:"fade"` `enterDur` 2.4, hold 4 s |
| 58 | "His soul left" | same bean copy with `material:"ghost"` `glow:true` `move` 60 px up |
| 59 | "Struck down in battle" | hit-cut: `swap` `expr:"dead"` + `pose:"lie"` at 0 + `fx kind:"hat"` `mode:"fly"` + ironic `signpost` |
| 60 | "Most attackers died" | one rider `creature` `rider` -> `swap` hit, `fx kind:"hat"` `mode:"fly"`, `pool` >> officers with `teacup` |
| 61 | "Everyone left / died" | `crowd` or beans `pose:"hug"`, each `out` + `exit:"fade"` 0.5 s staggered + `reaper` left alone |
| 62 | "None came back" | floor-level `bean` hand sliding out (`move`) + `pool` >> empty `bg: trench` 3 s, `grade:"solemn"` |
| 63 | "Killed far from home" | `bg: harbor time:"fog"` + `coffin` + `nameplate` + `spill` over 6 s |
| 64 | "N people died" | `map` `crosses:{region, count:100}` 1.5 s >> `doc kind:"stat"` `wall:"brick"`, silent hold |
| 65 | "N died, K per day" | `stat-block` `tag` + `companion` `text` on `bg: city preset:"night"` |
| 66 | "A massacre" | close-up raised `sword` + `fx kind:"blood-wipe"` `cover:true` >> hard cut to the map with `fires`; or `drip` transition |
| 67 | "Executed" | cut away before the act -> `grade:"red-flash"` 1 s or `black-beat` `dur` 1 |
| 68 | "The empire was dead" | `bg: graveyard` + `gravestone` `text` with the name + `grade:"moonlit"` |
| 69 | "The kingdom was gone" | `bg: battlefield` aftermath + `fires` + `gravestone` `enter:"slide-up"` |
| 70 | "Froze to death" | bean `freeze:{at}` + `jitter` `to` the same time + `grade:"cold"` |
| 71 | "Rulers kept dying" | queue of beans walking off a cliff (`fg: ledge`), each `exit:"tumble"` 0.6 s apart + `hangsign` counter |
| 72 | "Zapped / struck by lightning" | `fx kind:"shock"` `target` + target `swap` `alpha` 0 -> 1 with `expr:"dead"` |
| 73 | "Poisoned" | `fx kind:"toxic-cloud"` `ground:true` + `particles` `preset:"gas"` + `tremble` + `grade` drop on the key word; comic: `bg: mood variant:"swirl"` + `expr:"sick"` + `fx kind:"hat"` `mode:"fly"` |
| 74 | "Drowned / fell" | `bg: floor material:"water"` + `topbean` `move` `scale` 0.1 over 0.7 s + `fx: splat` >> empty sea 8–10 s (the reference holds 10 s and lets the silence become the joke) |
| 75 | "X lost its strength" | `pose:"flex"` -> `sit-slump` + `expr:"sad"` + look `gloom` |
| 76 | "Mourning" | `bean view:"back"` `pose:"kneel"` facing `bg: burning` + look `tears:"stream"` + `grade:"cold"` |
| 77 | "Their faith crumbled" | `fx kind:"disintegrate"` `target` with `stinger:true` |

### 7.5 Change, transformation and renaming

| # | Narration | Recipe |
|---|---|---|
| 78 | "X became Y" | `fx kind:"poof"` @1.0 + target `swap` @1.07 `look:{outfit, head}` + `expr` |
| 79 | "Power passed to the son" | `fx kind:"hat"` `mode:"give"` `from` father `target` son + son `swap` `look:{head:"crown"}` @+0.4 |
| 80 | "X was crowned" | `fx kind:"hat"` `mode:"drop"` `bonk:true` + target `swap` at +0.13 + `bg: mood variant:"rays" preset:"gold"` |
| 81 | "He held every office" | `fx kind:"hat"` `mode:"stack"` `stack` 1, 2, 3 at 0.8 s steps |
| 82 | "The crowd made X king" | `crowd armsUp:true` + bean `pose:"lie"` on top + `fx kind:"hat"` `mode:"drop"` |
| 83 | "The monarchy ended" | king `swap` `look:{head:null}` + `fx kind:"hat"` `mode:"fly"` (the crown lands alone) + `arm kind:"foot"` `stomp` on it + `camera.shake` |
| 84 | "Kings became mere officials" | two `poof` + `swap` `look:{outfit:"toga", head:null}` |
| 85 | "X renamed itself Y" | `doc kind:"nameplate"` `strike:{at, new}` |
| 86 | "Place X, today known as Y" | `prop kind:"signpost"` `turn:{at, text}` |
| 87 | "The regime was replaced" | `curtain` transition >> new performer on `bg: stage` + `arm kind:"hook"` takes the old one (`take`) |
| 88 | "Declared independence" | `map` `flags` pole grows + `annex` on the region |
| 89 | "The country split in two" | `map` region `split:{at, gap, fight:true}` |
| 90 | "The empire shattered" | region `shatter:{pieces:16, bgStreaks:true}`, hold the empty land 1 s |
| 91 | "He split the land into N parts" | `cleaver` `chop` over the map + regions `recolor` 4–6 f apart + `figures` `enter:"stretch"` |
| 92 | "X absorbed Y" | region `engulf:{by, dir}`; or `conquer` `pattern:"blotch"` for a slow spread |
| 93 | "It existed only on paper" | `obj` or `prop` with `material:"ghost"`; or `bg: blueprint` |
| 94 | "It was ruined" | clean close-up -> `swap` to the broken look (`cracked:true`, `bandage:true` on `obj`) |
| 95 | "X grew old" | `swap` `look:{age:"elder", beard:"long"}` under `poof` + `nameplate` year |
| 96 | "X grew up" | `age:"child"` in one shot, adult in the next, same `cast` colours, `cloud-wipe` between |
| 97 | "X turned evil" | callback of an earlier warm shot with `grade:"inferno"` + `expr:"menace"` + look `devil:true` |
| 98 | "Revealed his true colours" | `swap` `look:{outfit}` + `pose:"spread"` + `fx: flash` |
| 99 | "Everyone saw the monster inside" | `fx: lightning` + `swap` `silhouette` on for ~22 f + `fx kind:"wallshadow"` |
| 100 | "X became a legend / statue" | `swap` `material:{kind:"stone", plinth:true}` + `pose:"point-up"` + `rock:0` `blink:false` |
| 101 | "X got rich" | `swap` `material:"gold"` or `look:{monocle:true}` + `coin-heap` `enter:"drop-squash"` |
| 102 | "A new era began" | `spin-zoom` with `emblem` >> `bg: mood variant:"nebula"` + `title` |

### 7.6 Quantity, scale and statistics

| # | Narration | Recipe |
|---|---|---|
| 103 | "He had N men and M animals" | big bean `blur:6` behind + `doc kind:"unitcards"` 0.8 s apart + slow `zoom` [1, 1.06] |
| 104 | "The army was N strong, plus M" | `map` + `doc kind:"statstack"` adding one line per beat |
| 105 | "Units X, Y, Z were never used again" | `doc kind:"band"` `items` + `retireAt` |
| 106 | "N vs M" | `counter` pair on `bg: mood variant:"rays" preset:"split"`; or two `stat-block` props of different `scale` |
| 107 | "One became many" | one `bean` or prop, then 5–6 copies with the same `at` 8 f later |
| 108 | "It kept getting bigger" | props with `enter:"pop"` at `scale` 1, 1.6, 2.5 + `fx: dust` |
| 109 | "A big number" | `doc kind:"stat"` on a wall; or `counter` + `camera.punch` as it lands |
| 110 | "Expected slow, it was fast" | `turtle` `walk` beside an `arm kind:"hand"` `state:"flat"` >> `rabbit` already at the goal, `expr:"happy"` |
| 111 | "A tiny amount" | `bean pose:"offer"` + `coin` `size` 40 + close-up `camera.jump` |
| 112 | "Population gag" | `signpost` "POPULATION: 1" + one bean `expr:"sad"` |
| 113 | "The cost was enormous" | `hud kind:"meter"` `value` keys to 1 + `warning` |
| 114 | "They collected one after another" | `hud kind:"counter"` + `score` popups per item |

### 7.7 Time and waiting

| # | Narration | Recipe |
|---|---|---|
| 115 | "N years later" | `doc kind:"timeskip"` `style:"black"` 1.5–2 s, then 0.3–0.5 s before the next beat |
| 116 | "N seconds later" (hiding an act) | `doc kind:"timeskip"` 1 s >> the aftermath still |
| 117 | "They waited a week" | `bg: sky` `timelapse` + `crowd` on the ridge |
| 118 | "Night after night" | writing close-up + `window-cycle` behind + paper stacks `enter:"pop"` every 0.33 s; or `room` `cycle:true` |
| 119 | "Nothing happened for decades" | `doc kind:"slides"` with `cursor`, one `year` per click |
| 120 | "I'll skip the rest" | `fx: glitch` + `doc kind:"list"` `spill:true` |
| 121 | "Rulers switched weekly" | `wall-calendar` `cross` + `bean pose:"facepalm"` |
| 122 | "Years passed between A and B" | `timeline` `spans` `grow` + `pointer` |
| 123 | "Meanwhile..." | `doc kind:"meanwhile"` 2–3 s; or `fg-pass` transition |
| 124 | "Then came <year>" | `doc kind:"bigyear"` `fade` over a live scene |
| 125 | "Time passed on the same spot" | same composition, poses changed, `dissolve` |
| 126 | "Time was running out" | `clock` `fast` + `hud kind:"timer-lcd"` + `sweat-spray` |
| 127 | "Finally, it was over" | `doc kind:"highscore"` over the final map + `confetti` |

### 7.8 Success and failure

| # | Narration | Recipe |
|---|---|---|
| 128 | "X won" | `explosion-wipe` >> duo `pose:"fist"` / `arms-up` on `bg: mood variant:"rays" preset:"gold"` |
| 129 | "X took power" | `expr:"smug-closed"` `headTilt:8` close-up + `head:"crown"` on `bg: burst` |
| 130 | "A golden age" | `title` + `fx: sparkle` + map `coins` between `cities` + `grade:"golden-hour"` |
| 131 | "X surrendered" | region `surrender`; or `bg: burning` + small bean `pose:"kneel"` + `white-flag` |
| 132 | "Handed over the keys" | `bg: sky preset:"sunset"` + `pose:"kneel-offer"` `hold:"key"` + `fg: ots` |
| 133 | "His plan failed" | `easel` `chart` `crashAt` + `camera.shake`; or `doc kind:"error"` |
| 134 | "Nobody liked his work" | crowd `pose:"cross"` turning away (`flip`) + bean `sweat-spray` -> `expr:"wail"` |
| 135 | "Ran out of money" | `arm kind:"hand"` grabbing a region >> `doc kind:"error"` "INSUFFICIENT FUNDS" |
| 136 | "Economic collapse" | `easel` `chart` + `crashAt` + `fire` behind; or `doc kind:"chart"` `arrowEnd` |
| 137 | "Even golden ages crack" | `emblem3d` on the map -> `topple:{at}` onto its owner + owner `swap` `pose:"lie"` |
| 138 | "They lost X, Y and Z" | region `peel` one by one 0.6 s apart with `coins` |
| 139 | "Supplies ran out" | `squads` `state:{at, v:"empty"}` + bean `pose:"crawl"` + `arm kind:"rubber"` `take` |
| 140 | "Mission accomplished" (ironic) | `swap` `look:{glasses:"sun"}` + `hud kind:"score"` `text:"+100"` |
| 141 | "It backfired" | `door` `open` `behind:"fire"` + bean `expr:"hollow"` |
| 142 | "Upgraded / reformed" | `doc kind:"upgrade"` `pressAt` + `costs` |

### 7.9 Place, travel and arrival

| # | Narration | Recipe |
|---|---|---|
| 143 | "Long ago, X was ruled by..." | `fg: hands-fpv` + `map view:"tabletop"` + `figures` `enter:"pop"` 2 f apart; `bg: parchment-panel` + `material:"engrave"` for backstory |
| 144 | "They arrived in X" | establishing shot + `signpost` `enter:"drop-squash"`; or `nameplate` `style:"hand"` over a `blur` bg |
| 145 | "They left X" | `run` past a `signpost` "NOW LEAVING X" + `exit:"zip"` |
| 146 | "Crossed the sea" | `bg: sea` or `harbor` + `ship` / `sailship` on a `path` (wake) + `golden-hour`; or a `geo` map `tokens icon:"ship"` along a great-circle `routes` |
| 147 | "Marched back, people joined" | `walk` toward camera + `crowd` `enter:"ground"` staggered + `placard` props |
| 148 | "Moved the capital" | `map` `figures` `sit:"throne"` -> `marquee-arrow` on the new place |
| 149 | "Travelled from A to B" | `geo` map `pins` + `routes` `{ll:[...], gc:true}` + `tokens` along it + `center`/`zoom` keys flying to B; on the ground: a vehicle on a `path` with `follow` |
| 150 | "Built a road / canal / railway" | `map` `rivers` + `words` `along`; or `tracks` + `tokens icon:"train"` |
| 151 | "The empire stretched from A to B" | `geo` `proj:"ortho"` globe with `center` keys spinning to the place + regions by `iso` with `flood` + pins |
| 152 | "Into the story" | push on a map pin -> `portal` or `fade-white` |
| 153 | "Walked into the darkness" | `glow-open` + `fx kind:"lightpool"` `follow` + `bg: corridor` |
| 154 | "A new city rose" | low angle `bg: city` + `prop kind:"temple"` and houses `enter:"pop"` around an awed bean `expr:"jaw-drop"` |
| 155 | "Foreigners came" | `gate` `open` + travellers `walk` in + foreground bean `pose:"pinch-nose"` + `marks` `stink` |
| 156 | "On the way to X" | `bg: vehicle-interior` + beans with matching `swing` |

### 7.10 Ideas, plans and inventions

| # | Narration | Recipe |
|---|---|---|
| 157 | "X had an idea" | `pose:"think"` -> `point-up` + `prop kind:"bulb"` `enter:"pop"` + `marks` `ticks` |
| 158 | "X made a plan" | `pose:"steeple"` `expr:"menace"` + `doc kind:"pictobubble"` `list`; or `bg: blueprint` |
| 159 | "A ridiculous plan" | `bg: corkboard` `notes` + `strings` drawing on + `sign` |
| 160 | "A naive plan" | `doc kind:"crayon"` + `recolor` + `cut` |
| 161 | "Scientists found a way" | `bg: set preset:"lab"` + glassware props (`flask`, `round-flask`, `burner`, `fumes`) + `reach` timeline across them; or `doc kind:"loading"` on a `monitor` |
| 162 | "A new weapon / technology" | prop on `bg: mood variant:"nebula"` + `glow` >> the user holds it (`hold`) |
| 163 | "The invention was unveiled" | `curtain` transition `mode:"open"`; false reveal first, real one `swap` in |
| 164 | "What should they use?" | `doc kind:"wheel"` landing on the absurd option >> bean `hold` it |
| 165 | "He had a vision / an omen" | `fx kind:"flameshape"` `morphAt` + bean `expr` -> `shock` |
| 166 | "Couldn't stop thinking of X" | `pose:"lean-table"` + `expr:"vision"` + look `vision` set to a prop kind |
| 167 | "Built stone by stone" | `pose:"hammer"` close-up + wall pieces `enter:"drop-squash"` >> aerial `map` `wall` |
| 168 | "Everything was connected" | `bg: corkboard` + `camera.pan` along `strings` + `expr:"hollow"` |

### 7.11 Emotions and reactions

| # | Narration | Recipe |
|---|---|---|
| 169 | "X panicked" | `fg: ots` >> `pose:"clutch-head"` + `sweat-spray` + `title` behind the bean |
| 170 | "X was furious" | low-angle close-up `expr:"rage"` 1 f snap + `jitter` 2 px + `marks` `shout-jag`; or `grade:{preset:"rage", dur:0.5}` |
| 171 | "X was terrified" | `expr:"hollow"` + `pose:"cover-ears"` + `tremble`; or `pose:"cheeks"` `expr:"scream"` |
| 172 | "X realised" | 1 f snap to `shock` + `marks` `ticks` `variant:"realize"` + `grade:"red-flash"` |
| 173 | "X was smug" | `pose:"cross"` + `expr:"smug-closed"` + `cape` on a low-angle `fg: ledge` |
| 174 | "X was suspicious" | `expr:"side-eye"` + `sweat-spray` `stack:true` |
| 175 | "X was dazzled" | `expr:"star-eyes"` or `sparkle` on `bg: mood variant:"bokeh"` |
| 176 | "X fell in love" | `expr:"heart"` + `blush:"squiggle"` + `pink` grade; map face `mood:"hearts"` |
| 177 | "X was humiliated" | `swap` `look:{head:"clown-wig"}` + `bg: mood variant:"swirl"` |
| 178 | "X gave up" | `exit:"pivot-fall"` `fall.snap:true` (faceplant), hold 1 s |
| 179 | "X was alone" | `vignette-close` transition; or `bg: floor` + `topbean` + `fx kind:"spotcone"` |
| 180 | "A dark thought" | `fx kind:"memory"` `face:true` `expr:"evil"` |
| 181 | "He remembered" | `fx kind:"memory"` beside the close-up, or `{shot, t}` of the earlier shot |
| 182 | "Hope for the first time" | `expr:"sparkle"` -> look `tears:"joy"` |
| 183 | "Traumatised" | `pose:"cover-ears"` close-up + grade list `moonlit`, `gaslight`, `night-violet` ~28 f apart -> `fade-black` |
| 184 | "Bored" | `age:"elder"` `expr:"sleep-drool"` + `marks` `zzz` >> kid `expr:"wail"` |
| 185 | "Disgusted" | `expr:"grimace"` + `pose:"pinch-nose"` + `marks` `stink` |
| 186 | "Despair" | look `gloom` + `pose:"sit-floor"` + `grade:"cold"` |
| 187 | "Shocked into silence" | `expr:"jaw-drop"`; or `swap` `look:{hair:"spikes"}` for one frame + `expr:"hollow"` |

### 7.12 Lists and enumeration

| # | Narration | Recipe |
|---|---|---|
| 188 | "X did A, B and C" | runner `run` in place + item props `slide-left` + `hud kind:"score"` per item |
| 189 | "A list of names / eras" | `easel` `flipAt` per beat, or `doc kind:"slides"` |
| 190 | "A list of works / laws" | `doc` pages hanging with `swing` + `fx: spotlight` on the key one |
| 191 | "Shared problems A, B, C" | two `armchair` + one prop per clause `enter:"drop-squash"` on a table |
| 192 | "He did A, B, C" (phone call) | `pose:"phone-ear"` + `doc kind:"pictobubble"` `list` |
| 193 | "Small kingdoms formed: A, B, C" | `map` `words` + `arrows` `style:"block"` 1 s apart |
| 194 | "They had A, B, C" (assets) | `map` `cities` or `drops` one per noun, ~1 s apart |
| 195 | "United: A, B, C, even D" | `crowd mode:"lineup"` growing per name (separate layers 1 s apart), last one absurd |
| 196 | "N rulers in a row" | `overlays` `hud kind:"timer-lcd"` + one 1.5–3 s `bg: mood variant:"rays"` shot per ruler with one prop |
| 197 | "Problems: A, B, C" | three 1.5 s empty-location shots, each one `signpost`, `grade:"solemn"` |
| 198 | "Then X, then Y, then Z" (events) | `hud kind:"notice"` `lines` over the scene |
| 199 | "A checklist of demands" | `doc kind:"checklist"` `checks` on the beats + `stamp` |

### 7.13 Comparison and contrast

| # | Narration | Recipe |
|---|---|---|
| 200 | "Life inside vs outside" | inside vignette >> the same bean `poof` -> `swap` `look:{outfit:"fur-vest"}` + `prohibit` icons |
| 201 | "Each side spun the result" | two `doc kind:"newspaper"` tilted opposite, same `photo`, 0.5 s apart |
| 202 | "Then vs now" | `panel layout:"split"` `seam:"slant"`, same framing, different era |
| 203 | "The mainstream was X; he was different" | crowd of identical beans + one with a different `outfit`, `fx: spotlight` |
| 204 | "Both sides, all over the world" | `obj shape:"globe"` with `split` + two `arms` `pose:"punch"` |
| 205 | "A had X, B had nothing" | `coin-heap` vs a bean `pose:"offer"` with empty hands |
| 206 | "A line was drawn between them" | `map` `pencil` + `barriers` + `figures` on each side |
| 207 | "Expectation vs reality" | `doc kind:"crayon"` `cut` >> the tiny real thing + `signpost` |
| 208 | "Big brother vs little" | `build:"brute"` next to `age:"child"` |

### 7.14 Rules, laws and bureaucracy

| # | Narration | Recipe |
|---|---|---|
| 209 | "X made Y a crime" | `bg: alley` + beans + `cage` `drop` 0.04 s apart + `swap` `expr:"scream"` on landing |
| 210 | "X was banned" | `fx kind:"prohibit"` `icon` `jolt:true` over the prop |
| 211 | "A law authorised X" | `bg: studio variant:"courtroom"` + judge `hold:"mallet"` `pose:"hammer"` + `fg: bg-front` + `title` |
| 212 | "Papers tied people to a place" | `doc kind:"idcard"` + `stamp` slam |
| 213 | "They broke the treaty term by term" | `doc kind:"list"` `retitle` + `ticks` + `pencil` |
| 214 | "Speech vs reality" | `doc kind:"tv"` + `subtitle` `flag` on the false phrase + `pause` |
| 215 | "The verdict" | `doc kind:"scorecard"` `marks` + `verdict` |
| 216 | "Authority revoked his licence" | `wave` transition >> bean holding a `doc kind:"idcard"`; `arm kind:"hand"` `take` |
| 217 | "Meanwhile in heaven" | `bg: olympus` + bean `look:{head:"halo"}` behind a desk |
| 218 | "Rules were strict" | `pose:"hold-high"` + `doc kind:"document"` `paper:"scroll"` |
| 219 | "Labelled second-class" | `arm kind:"rubber"` -> `swap` look `label` text, then a worse one |
| 220 | "Silenced / censored" | `swap` `look:{mouthTape:true}` |
| 221 | "Arrested" | `cage` drop, or `bg: cell` + `fg: bg-front` + `outfit:"stripes"` |

### 7.15 Money and economy

| # | Narration | Recipe |
|---|---|---|
| 222 | "X taxed / took everything" | `arm kind:"rubber"` `label:"TAX"` `take` the `sack`, repeat `reach` |
| 223 | "Funding was taken away" | `arm kind:"hook"` `take` the `moneybag` + deadpan `expr:"neutral"` |
| 224 | "Paid for protection" | bean hands `moneybag` to a rider (`creature` `rider`) + `doc kind:"newspaper"` |
| 225 | "Prices rose" | `doc kind:"chart"` bars + vendor `expr:"wail"` |
| 226 | "Printed money until it burned" | `crt` or prop + `fx: paperstorm` + `fire` |
| 227 | "They were rich" | `map` `drops` `prop:"coin-heap"` -> `boom` on the same spot |
| 228 | "Bled money from inside" | region `slash:{spill:"money"}` + face `mood:"strain"` |
| 229 | "Trade flourished" | `map` `coins:{pts}` between `cities` |
| 230 | "They bet everything" | `dinner-table` + `coin-heap` pushed (`move`) + `sack` "DEBT" slides back + `pose:"hands-face"` |
| 231 | "Sold to the highest bidder" | `bg: studio variant:"auction"` `paddles` + `stamp` "SOLD" |
| 232 | "X offered Y a deal" | `doc kind:"trade"` `get` / `give` |
| 233 | "Left people poor" | `outfit:"rags"` + `bg: room variant:"parlour"` `wear` |
| 234 | "Fate decided at random" | `prize-wheel` `spin` on `bg: studio variant:"gameshow"` |

### 7.16 Information and communication

| # | Narration | Recipe |
|---|---|---|
| 235 | "X said: '...'" | `doc kind:"tv"` `who` `talk` + `subtitle` |
| 236 | "Hold on, that's not right" | `fg: hands-fpv` + `remote` `press` + `doc kind:"pause"` >> host `expr:"side-eye"` |
| 237 | "News spread" | `doc kind:"newspaper"` + `photo` + `bg: studio variant:"news"` + `lowerthird` |
| 238 | "Communication collapsed" | `fx kind:"word-shatter"` `text:"ORDERS"` |
| 239 | "X found out and told Z" | `bg: studio variant:"classroom"` + `age:"child"` `pose:"point"` up at a teacher |
| 240 | "Neighbours spied on each other" | `topbean` on a bench >> `fg: binoculars` + `camera.pan` |
| 241 | "X was watching Y" | `fg: spyglass` >> reverse: `fg: binoculars` `reflect` |
| 242 | "X explained the backstory" | `doc kind:"pictobubble"` `icons` with `arrow` items and `strike` |
| 243 | "Everyone wanted to be the next X" | `doc kind:"pictobubble"` `style:"thought"` + nested `child` |
| 244 | "He asked nicely" | `bed` + `pose:"phone-ear"` + `pictobubble` `scene` of the map |
| 245 | "A letter arrived" | `scroll` `move` from `scale` 0.3 to 1.2 at camera + `doc kind:"document"` |
| 246 | "X declared <slogan>" | `microphone` with `swing` + `megaphone` `on` + `doc kind:"ribbon"` |
| 247 | "A propaganda report" | `doc kind:"tv"` `text` taped note |
| 248 | "The crowd shouted" | `doc kind:"pictobubble"` `style:"shout"` |
| 249 | "On TV they said..." | `panel layout:"frame"` `frame:"tv"` -> `screen-dive` |
| 250 | "Inner monologue" | `doc kind:"dialog"` typewriter at the bottom |

### 7.17 Groups, crowds and alliances

| # | Narration | Recipe |
|---|---|---|
| 251 | "The people revolted" | `fg: mob` `items` `pitchfork`, `torch` |
| 252 | "Loved by all except..." | `crowd armsUp:true` >> `door` `slam` + angry `crowd` close-up |
| 253 | "Thousands marched" | `crowd` `rows:3` `march:true` filling frame + one small bean `tremble` in front |
| 254 | "Doom closed in" | low-angle bean `pose:"pray"` + `fx kind:"shadow-hands"` |
| 255 | "X was a puppet" | `map` `figures` `strings:true` -> `yank`; or bean `pose:"hang"` |
| 256 | "They gathered a crew" | leader + members `enter:"ground"` 1 s apart each with a `hold` prop -> walk into `bg: corridor` |
| 257 | "A marriage merged the realms" | `bg: mood variant:"bokeh"` `petals` + `pose:"hug"` >> map regions `recolor` into one |
| 258 | "A friendship / alliance" | `pose:"arm-around"` `expr:"happy"` >> hard cut: same pair behind `fg: bars` |
| 259 | "They made a deal" | `pose:"handshake"` pair + `doc kind:"stamp"` |
| 260 | "The powers did nothing" | `room` `variant:"bedroom"` `lampsOff` >> black |
| 261 | "Guards controlled access" | two beans `hold:"spear"` crossing + commoner `expr:"sad"` |
| 262 | "A new player arrived" | `doc kind:"challenger"` |
| 263 | "X entered the war" | `doc kind:"joins"` |
| 264 | "Split among the heirs" | region `drift` + `figures` `yank` + map `desaturate` |
| 265 | "Divided among A, B, C" | `panel layout:"grid"` `tilt` + `arm` with `label` per grabber |
| 266 | "The nations / the generals" | `crowd mode:"lineup"` + one `talk` window per speaker |

### 7.18 Meta and narrator

| # | Narration | Recipe |
|---|---|---|
| 267 | "I'm sure that went well" | narrator opens `door` `behind:"fire"` + `fx: flash` |
| 268 | "Historians aren't sure" | tiny scholar `enter:"ground"` with `hold:"book"` + `marks` `question` |
| 269 | "Let me explain this word" | `doc kind:"document"` with a `swap` illustration per word |
| 270 | "Wait, which one?" | the wrong bean first, the right one `enter:"pop"` 0.6 s later + `hud kind:"marker"` |
| 271 | "Let me correct that" | `swap` on `text`; or `hud kind:"chip"` `answerAt` |
| 272 | "Remember our open question?" | `overlays` `hud kind:"chip"` persisting across shots |
| 273 | "Someone edit this out" | `cursor` `drag` + `then:"delete"` |
| 274 | "We made a video on that" | bean `pose:"present"` + `panel layout:"pip"` |
| 275 | "No time for that" | `boom` `text` |
| 276 | "I won't show this" | narrator `pose:"cross"` + `drip` censor gag + deflation within 2 s |
| 277 | "Recap: it's a mess" | `panel layout:"grid"` 2x2, frozen `t`, `tilt` 2–3 |
| 278 | "Let's go into the picture" | `panel` `frame:"gilt"` on `bg: gallery` -> `portal` |
| 279 | "Back to the host" | cut to the frame-story set (`room` `variant:"gamer"`) with the guest reacting |
| 280 | "To be continued" | `doc kind:"tbc"` |
| 281 | "Chapter N" | `doc kind:"mission"`, `insert`, or `spin-zoom` |
| 282 | "Waking up in..." | `fg: eye-pov` `wake` + `blink` |

## 8. Worked example: a 30-second film

Neutral topic, seven lines, 160 wpm. Spine: a root everyone hated becomes the food that fed a continent. Frame device: none (too short). Recurring device: the potato character, and the `prohibit` sign that returns as a callback.

```
1. In 1550, nobody in Europe had ever seen a potato.
2. Sailors brought it back from the Andes, and Europe was not impressed.
3. People called it ugly, poisonous, food for pigs.
4. So one clever minister planted potatoes in a royal field and posted guards.
5. Peasants decided anything guarded must be valuable, and stole it at night.
6. Within a century, the potato fed half the continent.
7. Not bad for a lumpy root everyone wanted to ban.
```

Cast: `spud` is an `obj` (`shape:"blob"`, `color` `#b8864a`, `face`, `arms`, `legs`); `minister` (`outfit:"frockcoat"`, `head:"tophat"`), `guard` (`head:"kettle-hat"`, `hold:"spear"`), `peasant` (`outfit:"rags"`).

| Shot | Time | VO (key word) | Layers |
|---|---|---|---|
| s01 | 0.0–2.2 | "1550", "nobody" | `bg: sky preset:"day"` + `bean` peasant `expr:"neutral"` + `doc kind:"bigyear"` `text:"1550"` @0.3 + `fx kind:"marks"` `mark:"question"` @1.4 |
| s02 | 2.2–4.0 | "Sailors" | `bg: sea` + `vehicle kind:"caravel"` `move` across + `fx: birds`; `camera.zoom` [1, 1.05] |
| s03 | 4.0–6.0 | "not impressed" | `bg: mood variant:"grunge"` + `obj` spud `face:{mood:"happy"}` `arms.pose:"wave"` center + crowd `mode:"lineup"` `expr:"side-eye"` @0.6 + `camera.jump` @1.2 |
| s04 | 6.0–7.4 | "ugly" | `bg: burst` + bean `expr:"grimace"` `pose:"pinch-nose"` + `fx kind:"marks"` `mark:"stink"` |
| s05 | 7.4–8.7 | "poisonous" | spud close-up + `fx kind:"prohibit"` `jolt:true` @0.3 over it + spud `face` `mood` keys `happy` -> `sad` @0.4 |
| s06 | 8.7–10.0 | "food for pigs" | `creature kind:"pig"` `expr:"happy"` + spud `obj` beside it + `signpost` "MENU" `enter:"drop-squash"` |
| s07 | 10.0–13.2 | "clever minister" | `bg: palace` + minister `pose:"steeple"` `expr:"menace"` `antic:true` + `doc kind:"nameplate"` `style:"rank"` `rank:"MINISTER"` @0.6 + `fx kind:"marks"` `mark:"ticks"` @2.4 + `camera.punch` @2.4 |
| s08 | 13.2–16.0 | "royal field", "guards" | `bg: sky preset:"day"` `hills:2` + spuds as small `obj` row + `signpost` "ROYAL POTATOES. KEEP OUT" @0.5 + guard `bean` `enter:"slide-right"` @1.4 `pose:"cross"` + `fg: grass` |
| s09 | 16.0–19.6 | "stole it at night" | `grade:"moonlit"` same set (callback composition) + guard `expr:"sleep-drool"` + `marks` `zzz` + two peasants `enter:"peek"` @0.6 -> `pose:"carry"` `hold:"sack"` + `exit:"zip"` @2.8 |
| s10 | 19.6–25.0 | "a century", "half the continent" | `transition:{kind:"cloud-wipe", word:"POOF!", dur:0.4}` + `map style:"atlas"` `view:"tilt"` + region `conquer:{pattern:"blotch", by:"#b8864a"}` @0.8 `dur` 2.4 + `figures` spud-like peasants `enter:"stretch"` 0.25 s apart + `doc kind:"bigyear"` `text:"1650"` @0.2 `fade` |
| s11 | 25.0–30.0 | "lumpy root", "ban" | `bg: mood variant:"rays" preset:"gold"` + spud `obj` `arms.pose:"flex"` + `fx kind:"poof"` @1.0 + spud `swap` `head:"crown"` @1.07 + `prop kind:"prohibit"` `icon` @2.6 slides out (`move`) + `title` @3.4 |

One shot in full (s05, the poisonous beat):

```json
{"id": "s05", "dur": 1.3, "vo": "poisonous,",
 "bg": {"kind": "burst", "color": "#6a2a7a"},
 "camera": {"zoom": [1.0, 1.05], "shake": [{"at": 0.3, "dur": 0.13, "amp": 4}]},
 "layers": [
  {"type": "obj", "id": "spud", "shape": "blob", "color": "#b8864a", "size": 420, "x": 0.5, "y": 0.86,
   "face": {"mood": [{"at": 0, "v": "happy"}, {"at": 0.4, "v": "sad"}]}, "arms": {"pose": "idle"}},
  {"type": "fx", "kind": "prohibit", "id": "ban", "at": 0.3, "x": 0.5, "y": 0.62, "size": 520, "jolt": true}]}
```

Checks for this film: 11 shots in 30 s (mean 2.7 s, with internal beats every 1–2 s); eight distinct sets; one non-cut transition; the key word lands on a pop, snap or punch in every shot; one callback composition (s08, s09); a deflation-free film because nothing dark happens.

## 9. Quick rules

1. One clause with a new idea = one beat; a new visual event every 1.5–3.5 s (a cut or an in-shot change; shots themselves run 3–7 s median); the key word lands on `at`.
2. Decide the intent group (section 7), then the recipe; literalize the idiom when the line has one.
3. A shot runs longer than 5 s only if something new appears every 1.5–3 s (map spine, board, quote).
4. Build long stretches as a spine with gag inserts; return to the spine in the same state.
5. Every 60–90 s change the visual mode; every 60–90 s bring back a recurring device.
6. Hard cuts by default; one non-`cut` transition per 4–5 shots, and only when it means time, memory, a world, impact or death.
7. Poses and expressions snap (1–2 f) and hold; use `antic` and `snapTilt` only on big gestures; give every shot one main action.
8. Swaps hide under something: `poof` at t, `swap` at t + 0.07; hats swap `head` at +0.13.
9. Text appears 0.3–1.0 s after the cut, keyword only, on the empty side of the frame.
10. Three planes in every shot (`fg`, characters, a rich `bg`) except reactions and title cards.
11. After a dark beat: 3–4 s neutral hold, `cold` grade, lighter beat within 5–15 s; scares deflate in 2–6 s; atrocity beats never deflate.
12. Imply violence with stand-ins; mass death is an object; no gore, no extremist symbols, no real logos or likenesses.
13. Persistent state (damage, stickers, counters, chips) must stay consistent across every later shot.
14. Before rendering: validate, review the `--sheet`, check the risky shots with `--stills`, and confirm that every recipe name exists in the vocabulary.
