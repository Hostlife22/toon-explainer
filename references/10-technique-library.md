# 10 · Technique library: choose by what the scene must do

160 techniques measured in 20 reference videos (8 long films and 12 vertical shorts by one cartoon history channel), merged across videos and indexed by **the job a scene does for the viewer**, not by era or object. Each entry gives where it was seen (video and timecode), what happens on screen, the composition and order of events, measured timing, two transfers to non-historical topics, and how to build it in this engine. Plan the film first with [09-directing.md](09-directing.md); field contracts are in [03-spec-reference.md](03-spec-reference.md) and the toolkit cards ([08-toolkits.md](08-toolkits.md)); the vertical format is [11-vertical-shorts.md](11-vertical-shorts.md); how the videos were studied and what each covers is in [06-reference-library.md](06-reference-library.md).

Short names used below. Long: **China** (Entire History of China, 32:02), **Rome** (Entire History of
Rome, 38:29), **WW2** (How WW2 Began, 18:57), **Greek** (My Favorite Greek Myths, Minotaur, 21:38),
**Poe** (The God of Horror, 19:38), **Reconquista** (The Longest War Ever, 24:08), **Fact-check**
(Fact-Checking Hitler, 23:19), **WW1** (World War 1 Explained, 31:11). Shorts (9:16): **Fanta** (40 s),
**Pope** (80 s), **Simon** (57 s), **Church** (73 s), **Bunkers** (48 s), **Border** (93 s),
**Suiyang** (95 s), **USA** (95 s), **Zeppelin** (68 s), **Beer** (85 s), **Zombie** (81 s),
**French** (71 s).

Timing source tags: **[strip]** = native-fps frame strip (30 fps unless a lower fps is given), frame
counts are exact inside the window; **[sheet 2 s]** = long-video uniform contact sheet, one frame per
2 s; **[sheet 0.5 s]** = short uniform sheet; **[shot sheet]** = detector middle-frame sheet with the
detector's start time and length; **[decode]** = stats.json / shots.json numbers from decoding every
frame. 1 f = 1/30 s.

## 1. How to use this library

1. **Start from what the scene must do for the viewer, not from the object in it.** Read the line of
   narration and ask: is it hooking, introducing someone, explaining how something works, giving a
   number, changing a state or passing time, raising a threat, landing a hit or a punchline, handling a
   death, moving through space, showing a thought, keeping continuity, changing chapter, or ending? Each
   question is a section below (IDs: H, P, M, Q, C, T, I, D, L, V, F, X, E, S).
2. **Pick the entry whose Purpose matches**, then check "Transfer" to see that it works outside history
   (every entry lists two non-historical uses). Prefer entries seen in 2+ videos; entries marked
   *single source* are real but less proven.
3. **Copy the Composition and Timing literally first** (they are measured), then substitute your
   content. Put the event on the key word, not on the cut (most observed syncs land 0-0.3 s before or
   after the word; costume swaps sometimes lead by 0.5-1 s).
4. **Check the Engine line before writing the spec.** SUPPORTED = one documented feature does it.
   COMPOSABLE = existing pieces combined (listed). NEEDS-ASSET = the motion works but a drawing is missing.
   NEEDS-CODE = an engine capability is missing; use the stated workaround or skip.
5. **Check the "Not to copy" list (section 16)** before using anything that came from a parody, a real
   person or a violent beat.
6. **For a vertical short read section 15 first**: the shorts keep the long-form cut rate but almost
   never hold a frozen frame, and they compose natively in three bands.

General measured rhythm that applies to every section (decode, all 20 videos): long videos hold 21-46 %
of frames fully static and cut 7-16 times per minute (median shot 3.0-7.1 s); shorts cut at the same
rate (10-17 real cuts per minute) but only 2-19 % of frames are static, because every shot carries 3-6
in-shot events (a new visual idea every 1.5-2.5 s, counted on 0.5 s sheets).

**Animating position, size and angle.** Wherever an entry says "`move` steps", use the layer's `move` list: `"move": [{"at": 0.4, "dur": 0.3, "to": [0.6, 0.5], "scale": 1.4, "rot": -8, "alpha": 1, "ease": "outCubic"}]` (shot time; each step starts from where the previous one ended). `x`, `y`, `scale` and `alpha` themselves are constants, not timelines. The camera is a start → end move: `zoom` `[from, to]` and `pan` `[[x0, y0], [x1, y1]]` over `at`/`dur` with an `ease`; one-frame reframes are `camera.jump`, pulses `camera.punch`, and only `camera.rot` takes `[{at, v}]` keys. Numeric `[{at, v}]` timelines exist for a few listed fields (`blur`, shot `frame`, grade `strength`, HUD `value`, map and face fields in their cards); costume, pose and expression changes use `pose`/`expr` keys or `swap` (with `look` for costume).

## 2. Hook and opening

### H1 False absolute, corrected inside 3 s
- Purpose: a claim the viewer believes is overturned before they can scroll away; curiosity is rewarded on screen.
- Seen in: Border 0:00-0:03.5; China 0:00-0:19 ("only China since 1912"); Zombie 0:00-0:04.1 ("invaded by a boy dead for 13 years").
- Observed: Border states "completely surrounded" over the full map, says "Well...", pushes into the tiny enclave and a figure pops up on it. China states a paradox over a tabletop map and pays it off with the CHINA label pop. Zombie proves "dead" with a 1-frame silhouette flash.
- Composition and order: full subject on screen -> hold -> fast push or snap onto the exception -> hold on the hedge word -> one small character event on the exception.
- Timing: Border hold 0.37 s, push 0.6 s with motion blur (18 f), hold 0.67 s, pop-up 5 f [strip]. Zombie silhouette swap 1 f at 3.55 s on "dead" [strip].
- Transfer: "Antibiotics kill bacteria. Well, most of them." (push into one resistant colony); "Every phone uses the same charger. Well, these don't."
- Engine: SUPPORTED. `camera.jump` (`zoom` 1.4, `focus` on the exception) or a fast `camera.zoom` `[1, 2]` with `at`/`dur` 0.6 and `focus` + `fx kind:"speedlines"`, a `map` with `regions`, `bean` `enter:"rise"`.
- Docs: new (07 §3.1 hook table has no false-absolute hook).

### H2 Payoff first, explanation after
- Purpose: show the absurd or impressive end state in the first second so the whole film becomes "how did we get here".
- Seen in: Beer 0:00-0:01.0; Pope 0:00-0:03.6; Greek 0:02-0:07 (teaser of other stories).
- Observed: Beer: a woman on a street, a beer wave curls over her, the street floods. Pope: an old pope lowers a mitre on a young bean, a tight sunburst insert of the mitre, a game "mission passed" banner. Greek: POV hands over a table map, a boulder crushes the tiny figures, a monster flash, then the slow backstory.
- Composition and order: calm establishing frame (under 0.5 s) -> the event in one movement -> 1 tight insert or banner -> cut to the beginning of the story.
- Timing: Beer calm 11 f, crest covers in 6 f, scream snap 1 f, flooded by f30 (20 f total) [strip]. Pope mitre lowers 4 f, sunburst insert held 18 f, banner fades in 3 f [strip]. Greek hold 1.7 s, hand pull-back 3 f, push-in 2 f, boulder crosses half the frame in ~0.6 s [strip 15 fps].
- Transfer: "Imagine your phone exploding in your pocket" (explosion first, battery chemistry after); "how a seed becomes an oak" (oak first).
- Engine: COMPOSABLE. `transition:"wave"` or a rising `fx kind:"spill"` over a `street1920`/`city` bg; `bg: burst` insert shot + `doc kind:"mission"`; `fg:"hands-fpv"` + `map view:"tabletop"` `figures` + a `prop` with `move` steps.
- Docs: new for shorts (07 §3.1 has "slapstick summary" but no payoff-first rule).

### H3 Doubt-answer second hook at 3-6 s
- Purpose: answers the viewer's "that can't be real" before it becomes a reason to leave.
- Seen in: Beer 0:02.5-0:05.4; Zombie 0:05.0-0:07.9; French 0:00-0:05.4 ("Hear me out").
- Observed: Beer: a man crumples the paper ("yeah, you're laughing"), a broadsheet springs up and pushes into the lens ("but this really happened!"). Zombie: on "What?!" the whole shot shrinks into a phone that plays the short itself in a video app. French: "is actually based on a real-life event".
- Composition and order: hook image -> a skeptic beat (crumple, laugh, "What?") -> a proof object (newspaper, phone, document) fills or frames the shot -> first fact.
- Timing: Beer broadsheet springs up in 4 f, pushes to fill in ~12 f, 7 f dip to black, title fades up in 2 f [strip]. Zombie shrink into the phone 8 f + 6 f settle [strip].
- Transfer: "Yes, a city really banned ketchup" (court ruling on a held paper); "the study is real" (shot shrinks onto a journal page).
- Engine: COMPOSABLE. `doc kind:"newspaper"` with `move` steps past 1.5 + `transition:"fade-black"` (`dur` 0.25); or the next shot as `panel` `layout:"frame"` `frame:"phone"` with a cell `{shot, t}` of the hook shot and `move` steps from about 3 to 1.
- Docs: new.

### H4 Quiz to "you" with a board of wrong guesses
- Purpose: makes the viewer commit to an expectation, then breaks it.
- Seen in: Bunkers 0:00-0:07.1; China 0:51-2:02 (two question tags answered later).
- Observed: Bunkers: a game-show host, an answer board with "???" slots; the likely answers fill on their words; the host face-palms on "neither", then a 1-frame whip to the real answer. China: two question tags stack top right in a quiz studio and are ticked when answered (1:24, 2:02).
- Composition and order: host or narrator + empty slots -> slots fill on the spoken guesses -> dismissive pose on the negation -> whip or cut to the reveal.
- Timing: slots fill within 0.3 s of each word, about 0.8 s apart; face-palm holds 7 f, then one motion-blurred frame [strip].
- Transfer: "Which planet has the most moons?"; "the most common password is...".
- Engine: COMPOSABLE. `doc kind:"checklist"` (or `sign` lines with `swap` on `text`) + bean `pose:"facepalm"` + `transition:{kind:"whip"}`; persistent open questions: `overlays` `hud kind:"chip"` `answerAt`.
- Docs: extends 07 §3.4 "Persistent markers" and recipe #272; the quiz board itself is new.

### H5 Idyll, glitch, the same place ruined
- Purpose: announces that the pretty opening is a lie; sets a dark or ironic tone in one second.
- Seen in: Poe 0:11.8-0:13.1 (single source).
- Observed: a 10 s idyllic park shot breaks into per-frame colour looks, then a hard cut to the same composition grey and dead.
- Composition and order: idyll hold -> 0.7 s glitch -> hard cut to the identical framing in a ruined state.
- Timing: 22 frames of looks (3 grey, 1 orange, 2 grey, 1 orange, 5 normal, then 1-2 f hue bands), cut on a frame [strip].
- Transfer: "a startup's launch party -> the bankruptcy filing"; "a healthy reef -> a bleached reef".
- Engine: SUPPORTED. `fx kind:"glitch"` with a `looks` list (`dur` 0.7) in shot A; shot B reuses A's layers with `grade:"mono"` and damage props.
- Docs: extends toolkits/08_fx_and_tone.md "Corrupted memory" (the after-image here is grey, not red).

### H6 Rewind: a map ladder or a time strip pulled back
- Purpose: tells the viewer "it started somewhere else" or jumps far back along a visible line of years.
- Seen in: Rome 0:00-0:13 (one map steps backwards through history); China 0:22-0:28 (a time-machine ruler slides NOW -> 2000 BC while the town fades away); WW2 16:42-16:54 (big hands pinch and drag a "1931 ----- 1939" paper line, beans hop onto it).
- Observed: Rome: 4 states on one parchment map, each with a ruler and a badge, then a push into the origin dot and white. China: buildings fade out in step with the ruler marker, then a flood starts. WW2: the timeline is a prop that hands physically rewind.
- Composition and order: present state -> 3-4 earlier states on the same framing (or the marker slides) -> hold -> accelerating push into the origin -> white.
- Timing: Rome ~2 s per state, hold 1.7 s, push 20 f, white crossfade 17 f [strip]. China slide and fade 2-3 s together [sheet 2 s]. WW2 drag sequence ~12 s [sheet 2 s].
- Transfer: rewinding a codebase to its first commit; scrubbing a project back to the first prototype.
- Engine: SUPPORTED. `map` region `wipe` per state + `doc kind:"hangsign"` or `era` caption + `transition:"fade-white"` with `camera.zoom` [1, 1.8]; ruler: `timeline` + per-prop `out`; hands: `arm kind:"hand"` with `move` steps over a `timeline`.
- Docs: extends 07 §3.1 "Reverse-chronology map" (timing confirmed) and recipe #122.

### H7 Comparative span with a slapstick B-plot underneath
- Purpose: sets scale ("longest war ever") while keeping the eye busy during a list.
- Seen in: Reconquista 0:02-0:14 (single source).
- Observed: span bars pop in at the top of the frame on each war name; underneath, a trench soldier pops up and is shot; the subject's bar slides in last and dwarfs the rest.
- Composition and order: HUD band at the top, a tiny independent gag below, the subject's bar on its name.
- Timing: one bar per name; the subject bar slides in at 12.6 s; gag beats every 2-4 s [strip 5 fps].
- Transfer: the longest-running TV show vs other shows; a project's delay vs other projects.
- Engine: SUPPORTED. `timeline` layer with `spans` `grow` over any `bg` + an independent bean gag.
- Docs: extends 07 §3.1 "Comparative stat"; the B-plot-under-HUD rule is new.

### H8 Retell a famous story, then reveal the real one
- Purpose: borrows a plot the viewer already knows to explain an unknown event beat for beat.
- Seen in: French 0:00-0:13.5 (single source).
- Observed: 3-4 beats of a known fictional scene (secret order, sent everywhere, executed at once), a whip, the same beats in history with matching staging.
- Composition and order: fiction beats (6 s) -> whip into a page card -> real beats with the same staging (letters instead of holograms).
- Timing: fiction 6 s; whip 5 f; card held 4 f at 40 %, grows to full in ~20 f [strip].
- Transfer: "the heist movie plot really happened at a bank"; "the zombie-film quarantine has a real precedent".
- Engine: COMPOSABLE. Two shot groups with mirrored layouts + `transition:{kind:"whip"}` + `panel` `layout:"frame"` layer with `move` steps (see X10). Use invented designs only (section 16).
- Docs: new.

## 3. Introduce a person or role

### P1 Name label lands on the spoken name, pointer on the right subject
- Purpose: the viewer knows who is who in one glance; with a contrast pair, also who the hero is.
- Seen in: Bunkers 0:16.67; Simon 0:00-0:02.5; Rome 0:13-0:22; China (names over figures, curved-arrow captions 12:26, 21:14); French 0:15.
- Observed: a name label with an angled pointer pops on the name; Simon opens on a red arrow bobbing over the weak stray next to a smug fat cat, the name label at 2.5 s.
- Composition and order: subject placed first -> pointer or arrow -> label on the name word -> hold.
- Timing: Bunkers label at 16.67 for the word at 16.72 [strip 15 fps]; Simon frame lands (zoom settle) in 4 f, arrow from frame 0, label 2.5 s [strip].
- Transfer: "this tiny startup vs the giant" (arrow on the small one); "this neuron fires first".
- Engine: SUPPORTED. `label` (with pointer) `at` on the word, or `doc kind:"nameplate"`; arrow via `fx kind:"arrows"`.
- Docs: extends 02-visual-grammar.md recipe B; the contrast-pair opening is new.

### P2 Name card whose last bullet is the joke
- Purpose: compresses a biography into a card and lands a laugh on the second line.
- Seen in: WW2 2:38, 10:42-10:46; Greek 12:20 (ID card "SON OF AEGEUS / ID: MMMCCLXXVII").
- Observed: a big name card with one or two bullets that pop one at a time; the last bullet is a punchline. Greek's ID card slides in diagonally with a tilt over a held crowd.
- Composition and order: hold the subject -> card in -> bullet 1 -> bullet 2 (joke) -> hold.
- Timing: Greek crowd hold 1.8 s, card slides in ~5 f [strip].
- Transfer: a new CEO card "LIKES: synergy / DISLIKES: profit"; a bacterium's ID card.
- Engine: SUPPORTED. `doc kind:"nameplate"` with `bullets` and `bulletEvery` (the last bullet is the joke); `nametag`, `lowerthird` and `idcard` show fixed text.
- Docs: extends toolkits/06_paper_and_lettering.md (nametag); the "last bullet is the joke" rule is new.

### P3 Same framing, new light: the true nature
- Purpose: reveals that a character (or a chapter) is two-faced without new art.
- Seen in: Church 0:17.6-0:18.2; China 13:16-13:20; Rome 15:13-15:19 (cute/evil match cut), 11:01.2-11:05.8 (a chapter title regraded when the villain stands on it); WW2 7:06.5-7:08.5 (divine light flips to hell in shot).
- Observed: Church: pious pope, hard cut to the same balcony darker, ~30 % closer, scheming hands, evil grin. China: the same pose cut three times with grade changes (yellow, grey, red), then the name. WW2: the grade bleeds to red and the pose swaps to a crouched menace mid-bleed. Rome: an empty burst, the stone title, a flash, then the same title dark red and black with the villain's silhouette on top.
- Composition and order: warm version held -> cut (or in-shot bleed, or a flash) to the cold version on the turn word -> optional name caption.
- Timing: Church warm hold 12 f, cut, extra 2 f push [strip]; China three cuts ~1 s apart [sheet 2 s]; WW2 34 f divine hold, 6 f bleed, pose swap at the middle of the bleed [strip]; Rome burst 0.6 s, title 2.8 s, flash 0.1 s, regraded title 1.1 s [shot sheet].
- Transfer: "the friendly CEO... who wasn't"; a "Version 2.0" card that turns ominous when the bug appears.
- Engine: SUPPORTED. Next shot same `bg` and layers with `grade` (`night-violet`, `inferno`, `mono-red`), `camera.zoom` `[1.3, 1.35]`, `expr:"evil"`/`menace`, `pose:"rub-hands"`; in-shot: `grade:[{preset:"divine"},{preset:"inferno",at,dur:0.2}]` + `swap`; title: `title` + `transition:"flash-cut"` + a bean with the `silhouette` modifier.
- Docs: extends 07 recipes #42 and #97; the title regrade is new.

### P4 Status and power by scale
- Purpose: power difference, burden or distance is read from size and placement before any word.
- Seen in: Reconquista 1:12-1:20, 12:14-12:20 (a giant pinches a thumb-sized rival; a governor holds a tiny shepherd between two fingers); China 11:44-11:48, 30:06-30:14 (a toddler emperor at half adult height under an oversized hat), 26:56-27:02 (the rulers lounge on a tray carried on the shoulders of the ruled); Rome 15:12; WW2 13:32-14:30; Zeppelin 1:01.1-1:05.7 (a tiny plane top left, the airship's flank cropped bottom right); Poe 3:29-3:33 ("cracks became canyons" staged as a huge foreground head and a tiny figure far away).
- Observed: one subject cropped huge at a corner or edge, the other small and complete in the opposite corner; or a load-bearing stack of people; the small one does the acting.
- Composition and order: big mass cropped -> diagonal empty space -> small actor; hierarchy: bottom group carries, top group sits, long hold.
- Timing: holds of 3-8 s with one action [sheet 2 s / sheet 0.5 s].
- Transfer: a regulator holding a tiny startup between two fingers; management layers sitting on the workers.
- Engine: SUPPORTED. Bean `size` (330 vs 1400), `build:"brute"`, `age:"child"`, an oversized `head`; a large layer at `z` 1.3-1.6 near a corner; stack: `pose:"carry"` under a `prop` with seated beans `pose:"sit"`.
- Docs: extends 07 recipes #5 and #208; the corner composition and the carried stack are new.

### P5 One narrator, many costumes (the narrator plays the subject)
- Purpose: keeps one familiar voice while each chapter or example gets its own look.
- Seen in: WW2 0:54, 9:48, 16:34 (host re-costumed per country); Fact-check 9:50-11:40 (host wears the subject's moustache and hair to act quotes on the TV); Border 0:52-1:01 (the narrator plays the example buyer).
- Observed: the same host design re-dressed (street clothes, tracht, kimono); when there is no footage, the host acts the subject inside a TV.
- Composition and order: chapter title or portal -> host in the new costume -> same mannerisms.
- Timing: chapters of 6-8 min [sheet 2 s]; TV act-outs 5-15 s each [shot sheet].
- Transfer: a tour guide who becomes a chef, an engineer and a pilot per stop; a teacher acting a CEO's memo.
- Engine: SUPPORTED. One `cast` host with per-shot `look` overrides (`outfit`, `head`, `beard`); TV act-out: `doc kind:"tv"` `who`.
- Docs: new (07 §3.2 "Recurring host" has no re-costuming rule).

### P6 Recurring non-human co-star that changes role
- Purpose: one mascot or living object anchors the whole argument and changes role with it.
- Seen in: Fanta 0:10.0, 0:31.9, 0:33.8, 0:38.1 (brand mascot: logo, defaced, accomplice, dealer); Zeppelin 0:30-1:06 (the eyed airship antagonist); Poe (Death: comic, threatening, tender); China 25:14-25:42 (a horse mascot).
- Observed: the same design re-dressed per beat; Death's mood is shown only by eye-hole shape (round neutral, closed curves + smile tender).
- Composition and order: introduce early as an object -> return every 10-60 s (short) or 1-3 min (long) in a new role.
- Timing: Fanta returns about every 8-10 s [sheet 0.5 s]; Poe Death appears at every loss (7 returns in 19 min) [sheet 2 s].
- Transfer: a cereal mascot through a sugar-history short; a server icon that sweats, then burns, then retires.
- Engine: SUPPORTED. The same layer settings copied into every shot (`creature` `reaper` with `expr` neutral/smile/menace, or an `obj` with `face`): `cast`/`who` applies to beans only, so keep one template and change `expr`/`pose` per shot.
- Docs: extends 07 §3.4 "Recurring lurker"; the tender reading of `reaper` `expr:"smile"` is new.

### P7 Costume ladder equals rank
- Purpose: progress through a career or arc is readable from clothing alone.
- Seen in: Pope 0:08.5-1:20 (hoodie, cassock, sash, red robes, white robes; the HUD rank colour follows the costume); Poe (beige child clothes, suit, army blue, cadet maroon, frock coat); Rome 18:58, 34:32 (recruit to professional, then a battered veteran); Greek 17:44 (torn bloody cloak after the fight).
- Observed: each step of the story swaps one costume layer; damage is added to costume rather than to the body.
- Composition and order: same character, same framing class, one costume change per step.
- Timing: one step per 8-9 s in Pope [sheet 0.5 s].
- Transfer: intern to senior engineer (badge, lanyard, hoodie, blazer); a startup's office from garage to tower.
- Engine: SUPPORTED. `swap` `look:{outfit, head}` per step; damage via look `bandage`, `bruise`.
- Docs: extends 07 recipe #78.

### P8 Two-bar profile, proof in the background
- Purpose: profiles a character as a contradiction (huge strength, zero loyalty) and proves it at once.
- Seen in: China 16:14-16:22 (single source).
- Observed: a handheld device pops in; ATTACK fills 10 pips; LOYALTY shows 1; the device tilts to the foreground while in the background he kills his own ally.
- Composition and order: device pop -> bar 1 fill -> bar 2 near empty -> rack to the background event.
- Timing: the first bar fills over ~2 s [sheet 2 s].
- Transfer: a new hire's skills vs reliability; a phone's camera vs battery.
- Engine: COMPOSABLE. Two `hud kind:"meter"` with `value` keys (or `doc kind:"statstack"`) + shot `focus` rack with the `blur` modifier.
- Docs: new pairing (meters documented in toolkits/07_game_ui.md).

### P9 The foreground plane carries the entrance or the decision
- Purpose: walks the viewer into a scene from behind the speakers, or lets a decider snap in without a cut.
- Seen in: Rome 36:06-36:09 (two oversized helmet backs recede from the bottom corners into a two-shot); French 0:29.5-0:36.4 (the king's cropped head at the edge snaps to a sly grin and an OK hand on "get"); Poe 3:29 (a huge blurred foreground head watches the hero leave); WW1 10:07.8, 23:12.5 (defocused foreground hands and heads frame one sharp object for up to 20.6 s).
- Observed: a figure at the lens plane (back view or cropped head) either recedes into the scene and turns to camera, or holds dark at the edge and snaps on the key word.
- Composition and order: foreground mass -> background action -> recede and turn, or 1 f snap.
- Timing: Rome recede ~10 f ease-out, turns by 2-3 f drawing swap ~0.5 s apart [strip]; French snap 1 f at 34.57 s [strip 15 fps].
- Transfer: two engineers stepping up to a server rack; "then the investor smiled".
- Engine: SUPPORTED. Bean `view:"back"` with `move` `scale` steps from large to normal over 0.33 s, then `swap` `view:"3q"`; or a large bean at `z` 1.3 near the edge + `swap` of `pose`/`expr`/`view`; the `blur` modifier on foreground layers for the defocused frame.
- Docs: new.

### P10 Personified abstraction with a face
- Purpose: makes an invisible thing (morale, a feeling, a country, a fund) into an actor that can be hit, healed or sad.
- Seen in: Zeppelin 0:44-0:46.5 ("morale" smiley with a meter); WW2 1:38-1:54 (a crying heart on a stage, split and band-aided); Rome 18:00 (territory blobs with faces); China (map regions with props: sunglasses and cash, muscle arms, a pipe); Zeppelin (the airship gets eyes).
- Observed: a simple shape plus eyes, brows and sometimes gloves; it reacts with one expression snap per beat.
- Composition and order: the object centred, one prop or label naming it, then the event that changes its face.
- Timing: expression changes on single-frame swaps; China map faces do not idle during holds [strip].
- Transfer: "team morale" after layoffs; "customer trust" after a data leak.
- Engine: SUPPORTED. `obj` with `face`, `arms`, `head`; map region `face`; `prop kind:"heart"` with `fx kind:"spotlight"`.
- Docs: extends 07 §4 "Pun character".

## 4. Explain a mechanism / cause and effect

### M1 The plan drawn or replayed on a board, one clause at a time
- Purpose: a spoken specification or plan becomes a visible design; one requirement equals one drawing.
- Seen in: Greek 6:36-6:50 (a maze plan drawn clause by clause on a table; similar table plans at 2:54 and 15:26); WW1 2:40-3:50 (a blueprint board replays the assassination plan, ~12 scenes redrawn in place in one 70 s shot).
- Observed: Greek: black walls already on the parchment; red route strokes grow on several at a time; a short dissolve to the next plan; the last plan shows a lost figure with "?". WW1: white line drawings on blue, a pencil and an eraser fixed at the frame edges as anchors; each beat erases and redraws the scene; labels and signposts pop in.
- Composition and order: plan surface (table top-down or blueprint) -> clause 1 drawing -> dissolve or redraw -> clause 2 -> ... -> a figure on the plan acts out the cost.
- Timing: Greek 2-4 s per clause; strokes grow over ~3 s; 2-3 f dissolve between plans [strip 10 fps]. WW1 a burst pops in 1 f and holds 6 f; an arm drifts up over ~1 s while a car creeps a quarter of the frame in 2 s [strip].
- Transfer: a software architecture explained requirement by requirement; a heist-style replay of how an outage happened.
- Engine: COMPOSABLE. One shot (or one `doc`) per clause on `bg:"blueprint"` (with `sketch` items) or `parchment-panel`, joined by `dissolve`; beans with the `lineart` modifier or `material:"engrave"`. Strokes that draw on per clause inside one shot already work: `bg:"blueprint"` `sketch` items take a `line` with their own `at` and `dur`. Wiping the board between beats: item `out` or `bg.clear: [t]`.
- Docs: extends toolkits/04_places.md (blueprint) and 07 §2.1 ("one chalkboard ran 73 s with 12 internal scenes"); clause-by-clause drawing is new.

### M2 Struck clause, consequence in the same frame
- Purpose: each broken rule shows its result immediately, so cause and effect are inseparable.
- Seen in: Fact-check 2:50-3:01; WW2 13:14-13:24 (ban list retitled "TO DO LIST" and ticked).
- Observed: checklist left, map right; on "strike two" the line is struck and soldiers hop to the matching region; the last item adds a tank. WW2: a hand writes "TO DO LIST:" above a treaty and ticks each ban.
- Composition and order: document and map side by side -> strike or tick on the keyword -> map change 0-0.6 s later.
- Timing: strike drawn in ~4 f (0.2-0.3 s); region pulses every 8-10 f while discussed; units hop in 1-2 f [strip]. WW2 ticks ~2 s apart [strip 10 fps].
- Transfer: broken New Year resolutions next to a calendar; violated safety rules on a factory floor plan.
- Engine: SUPPORTED. `doc kind:"list"` with `strike`, `ticks`, `insertTitle`/`retitle`, `pencil` + `map` `squads`/`tokens` entered at the same `at`.
- Docs: extends 07 recipe #213; the split-screen strike/move pairing is new.

### M3 Shared table: one object lands per listed item
- Purpose: lists what two parties share, or what piles onto one, physically.
- Seen in: Poe 8:18-8:31; Pope 0:13.2-0:15.7 (a book per subject on the hands, "+1" pops).
- Observed: two brothers in tall chairs; a chain, a framed picture, chips, bottles and a red stain arrive on the table on each item. Pope: each subject word adds a book and a "+1"; the face strains.
- Composition and order: fixed two-shot or single, the receiving surface in the middle -> one object per word -> faces barely move.
- Timing: Poe items 1.5-2.5 s apart, each arriving in at most 1 s (chain slides ~1 s, picture drops in at most 0.2 s, bottles drop with dust clearing over ~0.8 s) [strip 6 fps]. Pope "+1" scale-pop 2 f, about 0.1 s after "learn" [strip].
- Transfer: what two rival companies have in common; tasks dumped on one intern.
- Engine: SUPPORTED. `prop` kinds (`chain`, `bottle`, `coin-heap`, `book`) with `enter:"drop-squash"`/`pop` at staggered `at` + `hud kind:"score"` popups.
- Docs: extends 07 recipe #191.

### M4 A diagram figure comes alive
- Purpose: a static diagram "objects" to the claim, or a person inside the diagram feels its cost.
- Seen in: USA 0:07.9-0:08.9 (chalk figures fidget on "it isn't"); Greek 6:46-6:50 (a sepia figure lost in the maze plan); Fanta 0:17.5-0:22.8 (silhouette workers inside comic panels).
- Observed: chalk or engraved figures hold, then change pose with line boil on the contradiction word; a red mark appears where the claim fails.
- Composition and order: diagram held -> key word -> figure pose change -> mark.
- Timing: USA figures move from 8.10 s for "it" at 7.93 s; red zigzag over ~10 f [strip].
- Transfer: "the flowchart said it would work"; "the textbook says X, except...".
- Engine: COMPOSABLE. `bg:"chalkboard"` or `parchment-panel` + beans with the `lineart` modifier or `material:"engrave"` + `swap` of `pose` + `jitter` boil + `prop kind:"question"`.
- Docs: new.

### M5 The keyword becomes a wall the action pushes past
- Purpose: the word on screen is part of the action, not a caption.
- Seen in: China 10:54-11:08 (single source).
- Observed: EXPANSION pops over the map; a giant arm rises in front of the word and pushes the border; the word repeats on each push.
- Composition and order: word pop -> arm rises over the word -> push -> word re-pops on the next push.
- Timing: word pop 5 f with 1 f overshoot; arm rises in 4 f [strip].
- Transfer: "GROWTH" with a hand shoving a chart line up; "DEADLINE" with a hand shoving a calendar.
- Engine: COMPOSABLE. `title` + `arm` (`kind:"hand"`/`rubber`) ordered after the title + `map` region growth (`conquer`).
- Docs: new.

### M6 An impersonal system acts through a cursor or a hook
- Purpose: authority gives with one hand and takes with the other, with no face to blame.
- Seen in: Poe 6:37-6:46; Rome 5:16-5:20 (an editor marquee drags a character over a wall); Bunkers 0:45.5 (a game cursor over the map).
- Observed: a white OS cursor drags a uniform onto the hero, then a hook on a line lowers and fishes the money bag away; Rome's marquee drags Remus across.
- Composition and order: hero held still -> cursor in, drop, cursor wanders off -> hook lowers -> lift.
- Timing: Poe hold 2.5 s, cursor carry ~0.7 s, outfit swaps on contact, hook lowers ~1.4 s [strip 10 fps].
- Transfer: an app grants a badge and takes a subscription fee; a government grants a title and raises a tax.
- Engine: COMPOSABLE. `cursor` layer `drag` + `swap look outfit` on contact + `arm kind:"hook"` `take` the `moneybag`.
- Docs: extends 07 recipes #223 and #273.

### M7 Hand plucks a piece off the map
- Purpose: "cut off", "removed", "disconnected" as one physical action.
- Seen in: USA 0:46.5-0:50.5; Fact-check 10:46.5-10:56 (a giant leader leans in and plucks a tiny figure off the map).
- Observed: a hand slides in from the bottom, pinches a peninsula, pulls it off along a dashed line; the map face winces with arms out; the piece gets its own face.
- Composition and order: map with a face -> hand in -> pinch -> pull -> reaction -> hand out.
- Timing: slide 6 f, pinch 4 f, pull 8 f with impact ticks, wince at f17, glove arms 4 f, exit ~10 f [strip]. Fact-check giant appears in 1 f, holds 2 s [strip 15 fps].
- Transfer: a subsidiary spun off; a regulator pulling an app out of a store.
- Engine: COMPOSABLE. `map` region `split` (crack + `gap`, a face per half) + `arm kind:"hand"` with `state` keys, or a giant bean `size` 1400 + `arm` grab.
- Docs: extends 07 recipe #89 and #13; the pluck is new.

### M8 A map face throws its army along an arc
- Purpose: "X threw everything at Y" with a clear attacker and victim.
- Seen in: Border 0:25.4-0:27.5; China 9:00-9:10 (balls thrown, chibi kings pop out of the shells).
- Observed: an arm grows on the attacker's region, cocks back, releases; a cluster of soldier tokens flies in a parabola and explodes on the target, which gets X eyes.
- Composition and order: two region faces -> arm -> wind-up -> release -> arc -> impact -> victim expression.
- Timing: wind-up 9 f, arc 11 f (0.37 s), impact cloud ~25 f [strip].
- Transfer: "the company threw money at the problem"; "the immune system fires antibodies".
- Engine: SUPPORTED. `map` `throws: [{from, to, icon, count, every, at, windup 0.3, dur 0.37, arc 0.25, impact}]` (wind-up 9 f, flight 11 f, impact puff 25 f) + region `damage` on the target.
- Docs: new.

### M9 A scene prop carries into the diagram
- Purpose: links the story world and the map, so the map change reads as the character's deed.
- Seen in: Rome 32:28-32:36 (a cleaver carried out of the scene chops the map); Reconquista 8:04.6-8:08.4 (an "ARMY" sack carried across the strait onto a ship).
- Observed: the character holds the object in the scene and exits; on the map a giant arm with the same object enters and acts.
- Composition and order: scene with prop -> exit -> map shot -> the same prop arrives -> action -> region change.
- Timing: arm enters after 0.8 s; each chop ~0.3 s lift and a 1-sample drop, then a region recolour [strip 15 fps]. Sack topples onto the ship in ~0.4 s, leap arc ~0.8 s [strip 15 fps].
- Transfer: a chef's knife slicing a budget pie after a kitchen scene; a scientist's pipette colouring a country.
- Engine: COMPOSABLE. Scene bean `hold:"cleaver"` + `exit`; map `arm` with `prop kind:"cleaver"` + region `recolor`; or `prop kind:"sack"` `text:"ARMY"` + `pose:"carry"` + `vehicle kind:"galley"`.
- Docs: extends 07 recipe #91; the bridging is new.

### M10 Policy as a game action
- Purpose: a decision becomes one button press with visible results.
- Seen in: China 27:48-27:53 (UPGRADE button, wall segments with cost chips); Bunkers 0:24.6-0:28.8 (bunkers placed on build plates); Pope 0:49.3-0:54.8 (a strategy-game tile with spreading territory); Zeppelin 0:58.37-0:58.53 (a glove taps a screen, "LVL UP!").
- Observed: a pulsing button is poked by a giant finger; the result appears piece by piece with cost chips; LVL UP appears full size on the next frame after the tap and rocks.
- Composition and order: zoom to the place -> button -> press -> results build -> optional reward text.
- Timing: China poke 3 f with impact lines, button shrinks out 3 f, one segment per ~2 f [strip 15 fps]. Zeppelin tap 4 f, text on the next frame, rocks ±5° on a 6 f cycle, speed lines ~10 f [strip].
- Transfer: a city adds bike lanes; a company opens factories.
- Engine: SUPPORTED. `doc kind:"upgrade"` `pressAt` + `costs` + `arm`; reward: `title` + `fx kind:"speedlines"` + `swing`.
- Docs: extends 07 recipe #142.

### M11 Chain of symbols pushed through on key words
- Purpose: walks "X, and only Y can make you Z" as a chain the eye can follow.
- Seen in: Pope 0:56.57-0:57.5 (single source).
- Observed: on each key word a card slides in from the left and pushes the previous one out to the right; the backdrop stays fixed.
- Composition and order: card 1 -> word -> card 2 pushes it out -> word -> card 3.
- Timing: ~10 f and ~7 f per push [strip].
- Transfer: phone -> app -> subscription; seed -> tree -> paper.
- Engine: COMPOSABLE. `obj`/`prop`/`doc` layers with `move` steps (in from the left, out to the right) on a fixed `bg:"mood"`.
- Docs: new (the `carousel` doc kind exists in toolkits/07_game_ui.md; push timing not documented).

### M12 A boom drawn as a business chart
- Purpose: makes a cruel or absurd trend legible and ironic.
- Seen in: Church 0:23.9-0:27.1; WW2 12:50-13:00 (popularity rises as money drains); China 11:20 (price signs grow).
- Observed: a rising chart on a monitor at the top; hooded inventors rise into the bottom half. WW2: a green CRT diagram where the leader's pedestal rises as the money bar falls.
- Composition and order: chart top, people bottom -> the line rises with the narration -> people react.
- Timing: inventors rise over ~25 f [strip].
- Transfer: "the plague was great for doctors"; "the gold rush was great for shovel sellers".
- Engine: SUPPORTED. `prop kind:"monitor"` or `doc kind:"chart"` + beans `enter:"rise"`; inverse pair: two `hud kind:"meter"` with opposite `value` keys.
- Docs: extends 07 recipe #136.

### M13 Hollow inside: x-ray of a hyped object
- Purpose: shows that a showy thing has nothing inside.
- Seen in: Fact-check 20:36-20:45 (single source).
- Observed: a "BRAND NEW!" machine drops onto a hut; the solid machine crossfades to a translucent box with blueprints, then empty, then blueprints.
- Composition and order: drop -> hold -> x-ray states alternate.
- Timing: drop in 3 f, tilt correction 1 f, hold 1.7 s+, then ~0.3 s per state [strip 10 fps].
- Transfer: a gadget with no software; a company with no product.
- Engine: SUPPORTED. The `xray` modifier on any prop, `obj` or bean: `xray: {at, dur 0.2, inner: "<prop kind>", color}` turns it into a blue see-through body with the `inner` prop (or nothing) inside.
- Docs: new.

### M14 Installed from above by a machine
- Purpose: an outside force installs or removes someone.
- Seen in: Zombie 0:38.27-0:39.87 (a claw crane lowers a man onto a throne); Reconquista 17:16-17:22 (a helicopter airlifts an emblem to a new capital); WW1 14:49.6 (a long white arm from the right edge sets a turtle token on the map next to a sleeping rabbit) [shot sheet].
- Observed: the machine enters from the top, descends with an ease-out, opens on the key verb; the figure drops and lands sprawled.
- Composition and order: target from above -> machine descends -> release on the verb -> landing snap.
- Timing: Zombie descent ~1.2 s (18 f at 15 fps), drop 2 f, landing 1 f pose snap [strip 15 fps].
- Transfer: a CEO parachuted in by investors; a puppet board installed.
- Engine: COMPOSABLE. `vehicle kind:"helicopter"` carrying a `prop`/bean with `move` steps + `swap` pose on landing; an `arm kind:"hand"` with `move` steps keyed to a `creature`. The claw itself: `prop kind:"claw-crane"` with `load`, `drop: {at, dur 0.53}` and `releaseAt`; the map `hand` `carry` only takes a tack or a flag.
- Docs: extends toolkits/03_props_creatures_vehicles.md (helicopter delivery); the claw is new.

### M15 A choice as a menu or a fork
- Purpose: a decision between options, or a fate, becomes something the viewer can read at a glance.
- Seen in: WW1 4:05.5-4:10 (a weapon-select carousel: diaper / hand / stick grenade, then the choice in a POV hand), 3:18-3:24 (a road fork with HOSPITAL and DEATH signs; only the fatal arrow remains in the next shot); Rome 27:10 (a weapon wheel picks the absurd option), 26:20-26:28 (a game-show wheel lands on GOOD? after two near-misses).
- Observed: options as cards, wheel segments or signs; a pointer or wobble picks one; the next shot shows the choice in use.
- Composition and order: options -> pointer flash or wobble -> selection -> cut to the chosen path or item.
- Timing: WW1 cards static ~13 f, chevron flashes 3 f, cards snap in 1 f, the selected card flashes red 2 f [strip]. Rome wheel ~3.3 s ease-out with two near-misses, confetti 4-5 f after the stop [strip 15 fps].
- Transfer: choosing a tool (hammer / glue / tape); two career paths; one wrong branch in a code path.
- Engine: SUPPORTED. `doc kind:"carousel"` with `select`, `doc kind:"wheel"`, `prop kind:"prize-wheel"` `spin`, `prop kind:"fork-signs"` `left`/`right` + `vehicle kind:"car1910"`; POV: `fg:"hands-fpv"`. The carousel slides over 8 f with a bounce; `snap: true` gives the reference's 1-frame menu.
- Docs: extends toolkits/07_game_ui.md (carousel) and 07 recipes #34, #164, #234.

## 5. Quantity, scale and comparison

### Q1 The counted thing floods the frame on the quantity word
- Purpose: "half a million", "a mountain of debt" becomes a physical pressure the viewer feels.
- Seen in: Bunkers 0:13.27-0:14.2 (bunkers rain until the frame is buried); French 0:25.5-0:29.5 (invoices pile up to the king's chin and mouth); Beer 0:00-0:01.0 and 0:36.9 (beer fills from the bottom).
- Observed: objects fall at mixed sizes and rotations, larger ones nearer the lens; or a pile front rises steadily from the bottom edge while the character holds a pose.
- Composition and order: subject held -> first object on the number word -> full cover (or chin height on "amount") -> dip to black or next beat.
- Timing: Bunkers first object 0.07 s before "million", full cover in 17 f (0.57 s), 8 f to black [strip]. French pile front ~1/3 of the frame height in 2 s, chin on "amount" (28.4 s), mouth covered at 29.1 s [strip 15 fps].
- Transfer: "a billion plastic bottles a year"; "300 unanswered emails".
- Engine: SUPPORTED. `fx kind:"pile"` (`prop`, `level` 0.85, `dur` 1.2, `size`) pours the counted objects in until they bury the frame; `fx kind:"flood"` (`level`, `dur`, `color`, `foam`) raises a liquid from the bottom; then `transition:"fade-black"`.
- Docs: new.

### Q2 A statistic as a labelled object
- Purpose: a dry total becomes a thing: a prize the viewer wins, a mass hanging over a city, or a stored pressure about to burst; the rate comes as a second, smaller object.
- Seen in: Bunkers 0:11.0 ("GRAND PRIZE 500K BUNKERS $$$$" card); Fact-check 13:28-13:40 (a giant cube "HELLO, I AM 681,682 PEOPLE", then a small "1000 A DAY!" cube); Beer 0:30.5-0:32.4 (a "500K LITERS" stencil with four red arrows pointing outward, then the barrel bursts).
- Observed: the host gestures and a card pops beside his hand; the cube hangs over a night city with a nametag and the second cube beside it; the pressure label holds, crossfades to the intact object, which bursts.
- Composition and order: context shot -> big labelled object -> (smaller rate object, or the release) -> hold silent.
- Timing: card pop ~6 f, held 2 s [strip]; cube pair held ~12 s [sheet 2 s]; pressure label hold ~1.3 s, crossfade ~4 f, burst fills the frame in 3 f at 15 fps (~0.2 s) [strip 15 fps].
- Transfer: tonnes of plastic per year, then per minute; a battery about to overheat.
- Engine: SUPPORTED. `prop kind:"stat-block"` with a tag + `companion` on `bg: city` night; `doc kind:"stat"`/`card` with `enter:"pop"`; pressure: `label` + `prop kind:"marquee-arrow"` x4 + `fx kind:"splat"`.
- Docs: extends 07 recipe #65 (the prize framing and the pressure label are new).

### Q3 One bar grows for as long as the number is spoken
- Purpose: a total felt by duration rather than by a pop; used for a death toll.
- Seen in: Suiyang 1:21.7-1:25.5 (single source).
- Observed: an axis 0-30K over a blurred background; one bar rises linearly from zero to the top while the narrator speaks the number; an icon label under it; fade.
- Composition and order: axis -> bar starts at zero on the sentence start -> reaches the top as the sentence ends -> fade.
- Timing: linear rise ~2.7 s, no easing pops [strip].
- Transfer: CO2 concentration rising; national debt growth.
- Engine: SUPPORTED. `doc kind:"chart"` `chart:"bar"` with `grow: {i, from, to, at, dur}`: one bar grows linearly while the number is spoken, the others keep their pop-in.
- Docs: new.

### Q4 Each listed word adds one visible token
- Purpose: a spoken list is counted on screen without cutting away.
- Seen in: Church 0:03.30-0:04.0 (device stickers pop onto the hook shot); Pope 0:13.9 ("+1" per subject); Simon 0:46.5-0:47.3 ("+HEALTH", "+RAT RESISTANCE"); Bunkers 0:21-0:23 (enemy flags pop onto the board); Suiyang 0:35.9-0:39.5 (diet icons fill paper sheets per word).
- Observed: die-cut stickers or "+N" text pop on the word with a small overshoot; the scene underneath keeps playing.
- Composition and order: topic shot -> token 1 on word 1 -> token 2 bigger or elsewhere -> token 3.
- Timing: Church stickers 4 f each with overshoot, on "by", "making", "torturing" 0.3 s apart [strip]; Pope pop 2 f [strip].
- Transfer: "by making junk food mainstream" (burger and soda stickers); "exercise: +sleep, +mood".
- Engine: SUPPORTED. `prop` with the `sticker` modifier and `enter:"pop-tilt"`; `hud kind:"score"` with `text` and a green `color`.
- Docs: extends toolkits/08_fx_and_tone.md (`sticker`) and toolkits/07_game_ui.md (`score`).

### Q5 Ranking board
- Purpose: compares many options in one frame, with the hero option landing last on top.
- Seen in: Zeppelin 0:07.1-0:10.0 (single source).
- Observed: S/A/B rows; entries pop into rows on their names; the hero entry lands in S with star pops on "advantage".
- Composition and order: empty rows -> entries per name -> hero entry last.
- Timing: an entry every 0.4-0.6 s [sheet 0.5 s].
- Transfer: ranking programming languages; ranking diets.
- Engine: SUPPORTED. `doc kind:"tierlist"` with `rows` (default S/A/B/C/D colours), `items: [{row, text | prop, at}]` that pop into their rows left to right, and `mark: {row, at}` to highlight a row.
- Docs: new.

### Q6 Absorption game
- Purpose: power accumulation as one circle eating the others.
- Seen in: Rome 14:00-14:04 (single source).
- Observed: labelled circles on a grid; one grows by eating "every office"; the rival stays small and sweats.
- Composition and order: grid -> the big circle moves -> each eaten circle pops out -> the rival reacts.
- Timing: the shot runs 7.4 s [shot sheet].
- Transfer: big tech acquiring startups; a monopoly swallowing competitors.
- Engine: COMPOSABLE. `bg:"blueprint"` + `obj` discs (`size`, `move` steps) each followed by a `label` with the same `move` steps (an `obj` draws no text); eaten discs `exit:"pop"`; rival `fx kind:"sweat"`.
- Docs: new.

### Q7 Sequence as a gallery walk
- Purpose: a series of versions, laws or works reads as one gesture.
- Seen in: Fact-check 3:50-3:58 (plan paintings; the last is already stamped CANCELLED on arrival); Poe 14:04-14:30 (book covers swing in on hooks); WW2 11:40-11:48 (photos held up to camera in pairs).
- Observed: the camera trucks between framed items; the latest item arrives already in its final state; previous items go soft focus.
- Composition and order: item 1 -> truck -> item 2 -> ... -> the last item carries the verdict.
- Timing: truck 7-10 f with ease-out, no motion blur; each frame holds 3-6 s [strip]. Poe covers swing in one at a time on each title [sheet 2 s].
- Transfer: product versions v1 to v4; diet plans over decades.
- Engine: COMPOSABLE. `bg:"gallery"` with `panel` `frame` cells + `camera.pan` + `doc kind:"stamp"`; photos: `panel` `frame:"photo"` + `arm` `hold`; hanging covers: `prop kind:"book"` `enter:"slide-down"` + `swing` + `blur` on old ones.
- Docs: extends 07 recipe #190.

## 6. Change of state, transformation, time passing

### C1 Whole set re-dressed on one word
- Purpose: an accusation, a status change or a legal reclassification becomes visible on the same people in the same room.
- Seen in: Fanta 0:01.87 (party guests re-costumed in uniforms on "probably"); USA 1:16.0-1:17.0 (a whole town swaps to the other nation's look on "technically a US citizen"); Border 0:42.0, 1:04.5 (a buyer's head swaps to a bomb balaclava on "smugglers").
- Observed: identical framing; only costumes change; the action continues.
- Composition and order: ordinary scene -> 0-frame cut (or in-shot 1 f swap) to the re-dressed state -> hold.
- Timing: Fanta cut 0.01 s after "probably", new state held 1.5 s [strip]; Border swap leads its word by ~1 s [sheet 0.5 s].
- Transfer: "the acquisition made everyone a Google employee" (badges swap); "click accept and you are a subscriber for life".
- Engine: SUPPORTED. `swap` with `look` (`outfit`, `head`) per cast member at the word; or the next shot with the same layers and `transition:"cut"`.
- Docs: extends 07 recipe #78; whole-room and legal-status use is new.

### C2 The change hides under smoke
- Purpose: a transformation, costume change, defection or set change without drawing the in-between; a double poof adds a false result first.
- Seen in: WW2 2:00.9, 10:52.4, 13:02.5-13:03.3; Reconquista 6:59.9-7:01.5 (a turncoat poofs and reappears in enemy colours); Poe 4:04.4-4:06.5 (a cloud reshaped every 2 f for 2 s); Greek 20:26.9 (the wings vanish in a feather poof); WW1 21:57.4-21:59.9 (an input dance, a poof reveals a wrong form, a second poof the intended one).
- Observed: a cartoon cloud covers the subject, the state swaps under it, the cloud fades; WW2 13:03 uses a full-width smoke wall to re-dress the whole set after dark pitchfork silhouettes rise in the foreground.
- Composition and order: subject -> cloud full -> hold -> fade with the new state; defection: dissolve to the same face among the other side; double poof: wrong form held, second poof.
- Timing: WW2 cloud full in 1-2 f, holds ~6 f, fades ~6 f [strip]; smoke wall covers in 0.2 s [shot sheet]; Reconquista head turn 3 f, cloud grows 5 f, holds 6 f, ~8 f dissolve, enemy leans in over 3 f [strip]; Poe sustained cloud ~2 s [strip]; WW1 each input ~10 f, poof holds ~4 f, wrong form 6 f [strip].
- Transfer: an employee poached by a rival; an upgrade that first bricks the device, then works.
- Engine: SUPPORTED. `fx kind:"poof"` at t + target `swap` at t + 0.07; set change: full-width `fx kind:"smoke"` + layer `swap` at peak cover; defection: `transition:"dissolve"`; double poof: two `poof` + two `swap`.
- Docs: extends 07 §6.3 "Poof swap"; sustained cloud, smoke wall, side-switch and the false intermediate are new.

### C3 Strobing toggle between before and after
- Purpose: "became", "was crowned", "evolved" feels instant and magical.
- Seen in: Zombie 1:00.6-1:01.3 (running pose and coronation robe alternate); Church 1:05.6-1:07.6 (the device flickers between silhouettes); China 7:00.5-7:10 (a silhouette pulses old/new size); Poe 3:06.6 (contact flickers grey, black, white silhouettes).
- Observed: two states alternate on a few frames each, usually on a sunburst, then settle on the new one.
- Composition and order: crown lands or contact -> alternation -> settle -> hold.
- Timing: Zombie ~8 swaps in 0.6 s (3, 2, 3, 2, 1 f), sunburst crossfades in 6 f [strip]; Church every 4-6 f, one black frame, old form returns in 3 f [strip 15 fps]; China pulse on a 10 f cycle [strip]; Poe 1-2 f per look for ~0.6 s [strip].
- Transfer: "she became CEO"; "the startup went public".
- Engine: SUPPORTED. `swap` with several `at` entries changing `look: {outfit, head}`, `pose` and `hold` + `bg:"burst"`; silhouettes via the `silhouette` modifier toggled by `swap`.
- Docs: new (no strobe-swap recipe; no "evolv" anywhere in the docs).

### C4 Evolution ceremony, optionally cancelled
- Purpose: a rank or category change (kingdom to empire, tool to weapon) as a recognisable ceremony; the cancelled version marks a ban.
- Seen in: China 7:00.5-7:10; Church 1:04.0-1:08.8.
- Observed: a glowing backdrop, a white flash, a typed dialog box "What? X is evolving!", the subject whitens to a pulsing silhouette, the old form is crossed out. Church: the device flickers, then returns to its old form with "now illegal".
- Composition and order: hold -> flash -> typed box -> silhouette pulse -> new form (or old form back + verdict box).
- Timing: China token arcs in 24 f, 4 f star flash, fade-in 5 f, ~1 character per frame typing, silhouette 8 f [strip].
- Transfer: a caterpillar becoming a butterfly; "phones kept evolving until the battery law".
- Engine: COMPOSABLE. `fx kind:"flash"` + `doc kind:"dialog"` (`cps` 30) + `silhouette` modifier with `swap` + `fx kind:"rays"` + `fx kind:"prohibit"` or `marks` for the X. Use an original box design (section 16).
- Docs: new.

### C5 Resolve snap with follow-through
- Purpose: a decision or recovery lands with force while the pose stays readable.
- Seen in: Simon 0:36.85-0:37.12 (crouched and bandaged to heroic, bandages fly off); Rome 22:02.8 (despair to resolve, hair streaks behind).
- Observed: a long hold, a 1-frame snap to the new pose; loose parts (bandages, hair) keep moving after the body stops.
- Composition and order: low pose hold -> 1 f snap -> debris or smear -> 2 s hold.
- Timing: Simon snap 1 f, bandages fly and fade over 8 f, hold 2 s [strip]; Rome hold 2.8 s, 1 f anticipation dip, 1 f snap, hair smear ~10 f, settled by f14 [strip].
- Transfer: an athlete deciding to sprint; a renovated building shedding scaffolding.
- Engine: COMPOSABLE. `swap` (pose + `look` headband) + small `prop` pieces with `move` steps and `alpha` fade; the hair smear: bean `smear: {at, dur 0.33, dir}` (4 fading copies and speed lines behind the head, settled by f14).
- Docs: extends 07 §6.1 "Pose snap"; follow-through debris is new.

### C6 Aging in place
- Purpose: time passes for the same person in the same spot, so the age change is the whole message.
- Seen in: China 25:35-25:41 (a siege: both figures age while the date chip jumps 1234 -> 1279); Rome 19:04.6-19:06.5 ("20 YEARS LATER" puff card, same framing, the soldier grey); Poe 12:53-12:57 (sofa dissolve, party hat "13" becomes "18"); Greek 8:38 -> 13:06 (child to adult by redesign).
- Observed: identical camera and set; the subject's age marks change (beard, grey, a number on the costume).
- Composition and order: young hold -> short card or dissolve -> old version in the same framing -> hold.
- Timing: China dissolve ~0.6 s with the date change [strip 10 fps]; Rome young hold 1.8 s, card ~0.1 s detected [shot sheet]; Poe 1 s dissolve [strip 10 fps].
- Transfer: an intern who becomes a senior engineer; a sapling that becomes a tree.
- Engine: SUPPORTED. Duplicate the shot with `look` `age:"elder"` + `beard`, `transition:"dissolve"` or `doc kind:"timeskip"`; `date` layer `swap`; a number on a hat via `prop` `text`.
- Docs: extends 07 recipes #95 and #125.

### C7 Counter runs while the pose stays frozen
- Purpose: makes a long wait feel long without animating anything.
- Seen in: Pope 0:36.43-0:37.37 (years 9 -> 20 while the priest prays); Suiyang 0:28.8-0:32.4 (month titles tick over a held soldier, then the empty storehouse); China 25:35 (date chip jump during the hold); WW1 7:30.1-7:34.9 (the same hunched soldier in three 1.5-1.7 s cuts while the grade steps green-grey, warm, dark, then he lies down) [shot sheet].
- Observed: only the number changes; the character does not move except a blink; the release is an exit and a tilt to the consequence (a cobwebbed door).
- Composition and order: held pose -> counter or month title steps -> on "runs out" the character exits -> camera tilts to the empty result.
- Timing: Pope 11 values in ~35 f, 2-3 f each [strip]; Suiyang a month every 4-6 f at 15 fps (0.3-0.4 s), held pose 2.6 s, 3 f turn, 0.5 s tilt [strip 15 fps].
- Transfer: "the case sat in court for 12 years"; "the savings slowly drained".
- Engine: SUPPORTED. `hud kind:"counter"` with dense `value` keys, or a `title`/`date` with a `swap` sequence; `camera.pan` for the tilt; grade stepping: repeated shots with `grade` `storm`, `warm`, `night`, then `pose:"lie"`. The cobweb itself: `prop kind:"cobweb"` (`corner`, `spider`).
- Docs: new.

### C8 Day and night compress the wait
- Purpose: compresses days or centuries; acceleration makes the wait feel endless.
- Seen in: Reconquista 10:34-10:46 (sky time-lapse that speeds up); Rome 37:48.7-38:00.7 (hard-cut lit/dark flicker on a globe map, territory shrinks one step per cycle); Poe 7:31-8:03 (window day/night while paper stacks grow); Fact-check 21:14.67 (sky snaps to dusk in 1 f inside a running work loop).
- Observed: a sun arcs and the gradient swaps; or hard cuts alternate light and dark while a map loses one step per cycle; or one 1-frame grade swap during a loop.
- Composition and order: first cycle slow -> later cycles fast (or fixed hard-cut rhythm) -> the state change lands on a dark phase.
- Timing: Reconquista first day ~4.5 s, first night ~0.8 s, then ~1.0-1.2 s per day [strip 30 fps + 5 fps]. Rome ~0.7 s lit / 0.3 s dark per cycle for ~12 s [shot sheet]. Fact-check 1-frame dusk shift [strip 15 fps].
- Transfer: waiting for a patent decision; a coastline eroding over centuries.
- Engine: COMPOSABLE. `bg:"sky"` `timelapse` (`dayDur` is constant: use two shots, 4.5 then 1.1); the map flicker as alternating short shots (lit / `grade:"night"`; regions cannot `swap` mid-shot); the 1-frame dusk as a `grade` key with `dur` 0. Or one shot: `timelapse.dayDur` as `[{at, v}]` keys (e.g. 4.5 s day, 0.8 s night, then 1.1 s per day) or `accel: {from, to, over}`.
- Docs: extends toolkits/04_places.md `timelapse` and 07 recipe #117.

### C9 Power-up or heal item consumed
- Purpose: "he survived", "she got stronger" becomes a visible event.
- Seen in: Simon 0:24.07-0:25.07 (a cake slice flies in, is consumed, blue "+" rise); WW2 2:44.0-2:47.0 (a serum syringe drains, muscle arms pop on); Rome 2:47-3:10 (wolf-milk power-up with aura and speed lines).
- Observed: the item travels to the character and dissolves into them; particles or new body parts appear; the head comes up or the pose snaps.
- Composition and order: weak pose -> item arrives -> consumed -> particles -> new pose.
- Timing: Simon item enters ~8 f, onto the face 3 f, dissolves 1-2 f, "+" signs rise and fade over ~18 f, head up the same frame [strip]. WW2 pose snap 1 f, syringe drains ~36 f, first arm pops 2 f, second arm 10 f later [strip 15 fps].
- Transfer: "the company got a bailout"; "the patient responded to treatment".
- Engine: COMPOSABLE. `prop` with `move` steps + `fx kind:"sparkle"` or `hud kind:"score"` `text:"+"` + `swap` pose; muscle arms via `build:"muscle"` `swap`.
- Docs: new.

### C10 Colour scene turns into an engraving for the summary
- Purpose: switches from a dramatised scene to a narrated summary on the same subject.
- Seen in: Greek 1:14-1:16 and 10:06-10:34; Fact-check 3:38-3:42 (the live cutaway freezes into a gilt painting the host points at).
- Observed: the same pose becomes a parchment engraving and the summary continues in that mode; or the scene freezes and becomes a framed picture.
- Composition and order: colour close-up -> same pose in sepia/engraving -> summary tableaux; or freeze -> gilt frame -> host points.
- Timing: switch ~0.5 s; sepia tableaux 13-17 s each [shot sheet].
- Transfer: "and over the next ten years..." recap; a news event turned into a museum piece.
- Engine: SUPPORTED. Same bean with `material:{kind:"engrave", at, dur:0.5}` + `bg:"parchment-panel"`; freeze: next shot `panel` `layout:"frame"` `frame:"gilt"` with a cell `{shot, t}` + host `pose:"point"`.
- Docs: new direction (only `sepia-to-color` is documented).

### C11 Window as a state screen
- Purpose: shows the world changing (planned, expected, real) from one fixed point of view.
- Seen in: Rome 33:12-33:18 (empty hill, sign, a city); Zeppelin 0:15.5-0:17.5 (window band full of explosions, then a calm city: "but that's not what happened"); Poe 7:31 (window day/night behind the writer); Simon 0:11.1-0:16.3 (the attack seen through a window frame).
- Observed: same framing, the content of the window swaps on the key words while the person in front reacts.
- Composition and order: over-the-shoulder at a window -> state 1 -> state 2 -> state 3.
- Timing: Rome ~2 s per state in one 7 s shot [shot sheet]; Zeppelin bursts every 0.4-0.5 s, each 2-3 f bright then ~8 f smoke, captain turns in 3 f [strip 15 fps].
- Transfer: a founder at the office window: empty lot, crane, tower; an office window over a booming then dead street.
- Engine: COMPOSABLE. `fg:"window-grid"` or `fg:"ots"` + bg landscape + `prop`/`sign` `enter:"pop"` at the words; or `prop kind:"window-cycle"`.
- Docs: new.

### C12 Tokens drain to show supplies running out
- Purpose: "supplies ran out" or "they starved" without a body: the container empties.
- Seen in: WW1 27:13-27:23 (beer-mug armies advance on the map, then every mug turns into an empty glass at once); Suiyang 0:28.8-0:32.9 (a full rice bowl, then an empty bowl and a cobwebbed storehouse); Simon 0:26.1-0:28.5 (an inventory with one fish in many empty slots).
- Observed: the token that stood for the army or the food stays in place and changes to its empty state, all tokens in the same frame; the character beside it holds or walks off.
- Composition and order: full tokens on the map or in hand -> narration "ran out" -> empty state -> reaction (collapse, crawl to a last mug).
- Timing: WW1 mugs pop in 0.2-0.3 s apart, ~6 s of advance, then all swap to empty within at most 5 f and hold 3+ s [strip 6 fps]; Suiyang empty bowl exit after a 2.6 s hold [strip 15 fps].
- Transfer: a budget shown as coins that run dry; fuel gauges on a delivery map.
- Engine: SUPPORTED. `map` `squads` with `prop` and `state:{at, v:"empty"}` (07 #139) + bean `pose:"crawl"`; inventory: `hud kind:"hearts"` + `panel` `layout:"grid"`. A drained `mug` drawing may need an asset.
- Docs: extends 07 recipe #139.

### C13 Regime change as a repeated stage act
- Purpose: a fast run of replacements (ruler, republic, revolutionary) reads as one rhythm.
- Seen in: WW1 24:20-24:38; WW2 13:02.5-13:03.3 (pitchfork silhouettes rise, then the set is re-dressed).
- Observed: on a stage the current ruler performs; a row of black pitchfork silhouettes rises in the foreground; curtain; a new performer; pitchforks again; curtain; the next.
- Composition and order: performer -> foreground silhouettes rise -> curtain -> replacement -> repeat.
- Timing: each cycle ~5-6 s [sheet 2 s]; WW2 silhouettes 0.7 s before the 0.2 s smoke cover [shot sheet].
- Transfer: CEOs replaced after shareholder revolts; a band's line-up changes.
- Engine: SUPPORTED. `bg:"stage"`, `transition:"curtain"`, `fg:"mob"` with `items` pitchfork rising (`fx kind:"smoke"` for the WW2 variant).
- Docs: extends 07 recipes #87 and #251; the repeat-with-replacement rhythm is new.

## 7. Conflict, threat, suspense, escalation

### T1 Weapon or threat creeps in, then the cut
- Purpose: dread before an act, with the act itself withheld.
- Seen in: Rome 22:52-22:55 (an axe creeps, cut to black); Greek 1:43.5-1:47 (a blade tip teases from the edge, withdraws, then the full swing); WW1 3:30-3:33 (the gunman raises his arm while the car creeps a quarter of the frame in 2 s); Suiyang 0:48.0-0:48.7 (the sword raised and held).
- Observed: a small part of the threat enters at the frame edge and moves slowly; the victim's face turns to horror; the cut comes on contact or just before.
- Composition and order: unaware victim -> tip at the edge -> slow creep (optionally withdraw and still frames) -> fast final move -> black or a stand-in (slash marks, red silhouette).
- Timing: Rome weapon in 6 f, creep 1.6 s with a slow push-in, then 16 black frames [strip]. Greek tip creeps ~1 s, withdraws, 18 f stillness, swing in 3 f with speed streaks, held 0.6 s, slash marks, black [strip]. Suiyang raise held 23 f, swing 4 f [strip].
- Transfer: a deadline cursor creeping toward "submit"; a wrecking ball approaching a house.
- Engine: COMPOSABLE. `prop`/`arm` with slow `move` steps + `camera.zoom` [1, 1.08] + `swap` `expr:"scream"` + `transition:"black-beat"` (`dur` 0.5) or a `fx kind:"blood-streaks"` shot.
- Docs: extends 07 recipe #54 and §5.1; the creep and tease timings are new.

### T2 The viewer sees the danger first
- Purpose: dramatic irony: the threat or the trap is visible before the character notices it.
- Seen in: Reconquista 3:25.5-3:31.4 (an army rises on the horizon behind a smug reader); Poe 5:47.5-5:49.4 (Death rises from behind a bush, arms wide); Church 0:22.77-0:23.17 (a sinister figure slides one third into the frame from the edge); Rome 28:06-28:11 (a slip hazard is on screen before the victim enters reading; the death date slides in before the accident).
- Observed: the subject is busy or smug; the threat rises, peeks, or simply waits in the frame; the subject turns and snaps to shock on the key word, or walks into it.
- Composition and order: subject foreground -> threat visible -> ~2 s of irony -> turn and 1 f shock snap (or the accident) -> hold -> culprits revealed next.
- Timing: Reconquista toss 1 f snap, army visible ~2.5 s before the take [strip 15 fps]. Poe hold 1.7 s, rise ~6 f with dust [strip]. Church peek ~13 f [strip]. Rome hazard 0.6 s before the entrance, date ~1.3 s before the slip, ~0.35 s airborne [strip 15 fps].
- Transfer: an IT admin ignoring an alert while a server rack burns behind him; a "last day before the outage" date shown while a developer commits.
- Engine: SUPPORTED. Background `crowd`/`creature` `enter:"rise"` or `enter:"peek"` + subject `swap` `view`/`expr` at the word; `date` `at` before `exit:"pivot-fall"`. The slip hazard: `prop kind:"banana-peel"`.
- Docs: extends 07 recipes #56 and #169; the "threat visible about 2 s before the take" rule is new.

### T3 The hold sits on the threat, not on the action
- Purpose: keeps a fight readable: the menace lands, then the reaction, then a short hit.
- Seen in: Greek 17:05.5-17:08; Reconquista 21:34.5-21:42 (duel: lock, wind-up hold, eye insert, explosion).
- Observed: short wide, short close, a 2 f snap closer, then a long still close-up of the threat (letterboxed eyes or a raised weapon), then the hero's reaction snap, then the blow in a wide.
- Composition and order: wide 4 f -> close 4 f -> snap closer -> threat hold ~1.2-2.3 s -> reaction -> hit.
- Timing: Greek 4 f, 4 f, 2 f snap, 35 f still letterbox, 7 f reaction, 2 f snap held 20 f [strip]. Reconquista lock ~0.5 s, wind-up held 2.3 s with a slow push, eye panel slides in ~3 f and holds 0.6 s [strip 15 fps].
- Transfer: a debate where one killer question lands; a vote count before the result.
- Engine: COMPOSABLE. Shot `dur` 0.13 / 0.13 / 1.17 / 0.9; `camera.jump` for the snaps; `camera.letterbox`; `fx kind:"redeyes"`; `panel` slide for the eye insert; `transition:"explosion-wipe"`.
- Docs: new as a measured cadence (07 §2.3 says fights cut every 1.0-1.6 s).

### T4 Accelerating ping-pong argument
- Purpose: a quarrel escalates through the cutting rate alone.
- Seen in: Rome 4:28.3-4:35.1; WW1 22:27.0-22:28.4 (panic: four glances around an empty room in 1.4 s: 0.6 / 0.1 whip / 0.6 / 0.7 s) [shot sheet].
- Observed: mirrored close-ups of two brothers alternate on "Mine's better / No, mine's better"; each shot shorter than the last; release into a wide with the river between them.
- Composition and order: A, B, A, B... shrinking -> one long wide; panic variant: 3-4 fast looks at one set, one with a whip blur, then the discovery.
- Timing: 1.6, 1.3, 0.8, 0.7, 0.6, 0.4, 0.3, 0.2 x5, 0.1, 0.1 s, then an 8.7 s wide [shot sheet].
- Transfer: tabs vs spaces between two engineers; two shops undercutting each other's price.
- Engine: COMPOSABLE. Alternating shots with `dur` shrinking ~0.75x per pair (floor 3 f), bean `flip`, same `bg` per speaker colour, then a wide. Author by hand (script2spec cannot generate it).
- Docs: extends 07 recipe #27.

### T5 Threat closes in from every frame edge
- Purpose: menace from a crowd or the world without any act.
- Seen in: Suiyang 1:01.7-1:07.5 (hungry heads pop in from every edge around one civilian); Bunkers 0:19.2-0:21 (red claws curl in from every border of a framed map); Poe 10:45-11:23 (shadows creep from the frame edges around a couple); China 8:24-8:32 (crowd shadows rise up a palace facade).
- Observed: elements enter from all edges, rotated to face inward; the centre subject holds one pose.
- Composition and order: lone subject centred -> first intruder peeks just before the cue word -> the rest pop in fast -> hold.
- Timing: Suiyang first head 0.1 s before "thousands", then one head every 3-6 f for ~2 s [strip]; China shadows grow over ~8 s [sheet 2 s].
- Transfer: every creditor wanting a piece; a startup surrounded by acquirers.
- Engine: COMPOSABLE. Several beans (`legs:false`) with `rot` 90/180/270 and `enter:"peek"`; `map` `arrows` inward; `fx kind:"shadow-hands"` or `wallshadow` growing with `move` `scale` steps.
- Docs: extends toolkits/08_fx_and_tone.md (`shadow-hands`, `wallshadow`); the all-edges ring is new.

### T6 Grade snaps or bleeds on the realisation word
- Purpose: an emotion peaks without a cut.
- Seen in: Bunkers 0:17.47 (1 f red mono with a new grimace on "convinced"); WW2 6:03.77-6:03.90 (red mono + zoom punch onto a scream); Greek 5:21.9-5:22.2 (a rage crossfade); WW2 7:07.63 (divine to inferno with the pose swap mid-bleed).
- Observed: the whole frame turns red/orange either in one frame (paranoia) or over a few frames (rage rising); a new expression lands with it.
- Composition and order: worried hold -> grade change + expression swap on the word -> hold 1-2 s.
- Timing: Bunkers 1 f [strip 15 fps]; WW2 punch 3 f after a 2.2 s hold [strip 15 fps]; Greek 8 f after a 40 f hold [strip].
- Transfer: "then he saw the bill"; "she realised the server was production".
- Engine: SUPPORTED. `grade:{preset:"rage" | "mono-red", at, dur}` (`dur` 0 for the snap) + `swap` `expr`/`pose` + optional `camera.jump`.
- Docs: extends 07 recipes #170 and #172.

### T7 Red eyes switch on
- Purpose: marks the hidden schemer or the final turn to villain.
- Seen in: Pope 1:16.97-1:17.37 (red eyes flicker on as the rank flips to POPE); Fact-check 21:14, 21:22, 22:28 (a black head with red eyes peeks at the frame edge); WW2 0:41.40-0:42.1 (the guide's eyes dissolve to red, the vignette deepens); Church 0:22.8 (the peeking figure has red eyes).
- Observed: the eyes come on with a short flicker, often while the face holds still; a dark vignette follows.
- Composition and order: still face or silhouette -> eyes on -> hold 1-2 s.
- Timing: Pope 3 f flicker [strip]; WW2 4 f dissolve, vignette ~20 f [strip]; Fact-check pop 1 f, hold 1-2 s [strip 15 fps].
- Transfer: the hidden shareholder; the AI system that "decided".
- Engine: SUPPORTED. `fx kind:"redeyes"` (`on` windows, `blink`) + bean `silhouette` modifier; HUD label change by text keys.
- Docs: extends toolkits/08_fx_and_tone.md (`redeyes`).

### T8 Pressure meter fills per item, then overload
- Purpose: makes an accumulating pressure the plot mechanism; the overflow is the turn.
- Seen in: WW1 29:08-30:26 (a MEMORY bar fills with each Versailles demand; at max a glitch, an error popup, the world goes wireframe); Zeppelin 0:44.6-0:46.6 (a vertical morale meter drops under smoke after a bomb).
- Observed: a hazard-striped bar steps up on each spoken item; the change is sometimes hidden under smoke and then revealed; at the limit the image breaks.
- Composition and order: meter above the characters -> one step per item -> max -> breakdown (glitch, popup, line-art world).
- Timing: Zeppelin bomb falls 21 f, fireball peaks in 4 f, meter drops while the smoke covers (46.0-46.3 s), sad face at 46.43 s [strip]. WW1 steps per demand over ~1 min [sheet 2 s]; the collapse is staged over ~19 s: torn circular vignette ~2.7 s, half the garden washes out, a cross-hatch net, a wireframe world, a run on a perspective grid floor 2.7 s, file icons in a swirl, black 0.7 s [strip 15 fps + shot sheet].
- Transfer: stress during exam week; server load during a launch.
- Engine: SUPPORTED. `hud kind:"meter"` `style:"hazard"` with `value` keys + `hud kind:"warning"` + `doc kind:"error"` + the `lineart` modifier for the overload. A vertical meter: `hud kind:"meter"` `orient:"vertical"` (fills bottom-up on the side edge).; the collapse: `fx kind:"hatch"` (`wash`, then the net) and a cut to `bg: grid` (`speed` for running).
- Docs: extends toolkits/07_game_ui.md (meter); the overload payoff is new.

### T9 Futile loop: wave after wave
- Purpose: attrition and futility shown by a repeating action that changes nothing.
- Seen in: Reconquista 10:51-10:54 (riders bounce off a shield wall one after another); Fact-check 21:04-21:14 (the same scrap throw into a furnace repeats); China 5:38-5:52 (region arms swing weapons in loops), 18:20-18:28 (soldiers fed into a grinder).
- Observed: one actor performs the same action on a fixed period; the target never changes.
- Composition and order: fixed framing -> cycle 1 -> identical cycle 2, 3, 4.
- Timing: Reconquista one wave every 20-25 f, 4 in 3 s [strip]; Fact-check throw wind-up 3 f, ~7 f arc at 15 fps, period ~2.4 s [strip 15 fps].
- Transfer: spam emails bouncing off a filter; sales calls bouncing off a gatekeeper.
- Engine: COMPOSABLE. Copies of a `creature`/bean with `move` steps offset by the period and `exit:"tumble"`; region `arms` loops; the grinder: `prop kind:"meat-grinder"` with `crank` windows, `feed` and `extrude: {at, dur, len}` for the sausage.
- Docs: extends 07 recipe #20.

### T10 Hand-only insert, then the wait
- Purpose: suspense about who is at the door or what the button will do; the wait is the anticipation.
- Seen in: Greek 2:39.5-2:41 (an arm knocks twice); Fact-check 8:55.5-8:59.5 (a hand rests on a big desk button before pressing).
- Observed: a cut to the hand only; it rests or knocks; the reaction cut follows.
- Composition and order: exterior or wide -> hand insert -> wait -> action with impact ticks -> reaction.
- Timing: Greek wind-up 2 f, contact, ticks 7-8 f, second knock 15 f later [strip]. Fact-check rest 46 f before the press, press ticks ~4 f [strip].
- Transfer: launching a rocket; sending a risky email.
- Engine: SUPPORTED. Two `arm kind:"hand"` layers (or two `reach` windows) 0.5 s apart (`count`/`every` repeat only the spring and piston gloves) + `fx kind:"marks"` ticks; `prop kind:"big-button"` press in an insert shot.
- Docs: extends toolkits/02_acting.md (`count`/`every`); the hold-before-press rule is new.

### T11 Two sides split the frame while they wait
- Purpose: shows two sides waiting for different outcomes at once.
- Seen in: Suiyang 0:23.2-0:28.8 (a diagonal lightning split, "PENDING" reinforcements vs a pocket watch); Rome 5:24.6-5:31.9 (alternating red and teal close-ups), 8:06.7 (an empty red/blue split burst before a reveal).
- Observed: a zigzag seam divides the frame; each side has its own sky colour and a status label; an icon pops on the keyword.
- Composition and order: split -> labels -> one event on the key word.
- Timing: split held ~5.6 s; the surrender icon on "surrender" [sheet 0.5 s].
- Transfer: buyer waits for shipping, seller waits for payment; two teams before a deadline.
- Engine: COMPOSABLE. `panel` `layout:"split"` `seam:"jagged"` (or `slant` with `angle`) + per-cell `label`; `prop kind:"clock"`; `doc kind:"loading"` for "pending".
- Docs: extends 07 recipe #28.

## 8. Impact, failure, punchline

### I1 Long innocent hold, then a hit with no anticipation
- Purpose: the length of the calm sells the impact; the gag is the contrast.
- Seen in: WW2 7:20.7-7:23.97 (a crossing guard with a STOP sign, then a van); Fact-check 17:23.5-17:27.5 (a mallet held overhead, then smash); China 16:42.5-16:46 (deadpan punch, the puncher keeps his expression); WW1 26:32.33-26:35.8 (a map arm punches a region); Poe 17:11-17:14.5 (a dying man bolts upright between doctors); WW1 11:49.2-11:49.5 (an off-screen tank hit shown only as a ~3 f near-white flash on the panicking soldier, fading back over ~6 f) [shot sheet].
- Observed: the subject holds almost still for 1-3 s; the hit arrives in 1-5 frames with no wind-up; a hold follows.
- Composition and order: calm hold -> instant hit -> impact marks -> hold (17+ f).
- Timing: WW2 hold 3.1 s, van crosses the frame in 5 f [strip]. Fact-check hold 33 f, fall 2 f, ticks on contact, hold 17-25 f [strip]. China hold 1.6 s, fist 2 f, victim ejected ~7 f [strip]. WW1 arm in 1 f, impact 2 f, hold 9 f, retract 2 f, black eye already drawn [strip 15 fps]. Poe hold 75 f, rise 2-3 f [strip].
- Transfer: a careful regulator run over by a hype train; a gavel on a bad idea.
- Engine: SUPPORTED. `vehicle`/`prop` with a 2-5 f `x`/`y` jump, `arm kind:"glove-piston"`, `pose:"hammer"` keys + `prop kind:"mallet"`, `fx kind:"marks"`, `camera.shake`.
- Docs: extends 07 §6.5 "Smash" (which prescribes a 12 f wind-up hold); the zero-anticipation rule is new.

### I2 Growing shadow before the drop
- Purpose: anticipation for a falling object and a comic landing.
- Seen in: WW2 0:52.50-0:52.97 (an empty frame, a shadow grows, the viewer falls in); Fact-check 4:42.93-4:43.17 (a shadow disc grows under a figure, a tank lands on it).
- Observed: a dark ellipse grows on the empty spot; the object enters and lands; a squash or a rock-back; a stain stays.
- Composition and order: empty ground -> shadow grows -> object enters -> lands -> hold.
- Timing: WW2 shadow ~10 f, body enters in 3 f, flat squash, no bounce [strip]. Fact-check shadow ~6 f, tank enters 1 f, lands the next frame, rocks ~3 f [strip].
- Transfer: a package delivered by a drone; a meteor before an extinction beat.
- Engine: SUPPORTED. `enter:"drop"` or `drop-squash` with `dropShadow` (seconds, or `true` = 0.33) on the `bean`/`prop`.
- Docs: new field (NEW IN THIS PASS); toolkits/02_acting.md does not describe it yet.

### I3 The empty frame is the beat
- Purpose: an empty set before an arrival, or an empty burst after a crossing, lets the viewer anticipate or feel the impact.
- Seen in: Simon 0:45.17-0:46.57 (the hero lunges across, the burst holds empty, the victory pose rises); Rome 8:06.7, 11:01.2, 14:40.1 (empty bursts or a closed-door insert before a reveal); Greek 19:56.5-19:59.4 (each flight shot starts as empty sky); WW2 0:52.70 (empty cobblestones before the drop); Bunkers 0:14.0-0:14.2 (dip to black after the avalanche); WW1 13:03.2 (the room shown empty for 6 f: the host has vanished, then a 3 f pixel burst) [shot sheet].
- Observed: the background alone holds for a few frames to a second; then the subject enters, or the next subject rises.
- Composition and order: empty set -> entrance from an edge or from below; or crossing -> empty hold -> new state.
- Timing: Simon cross ~20 f, empty 15 f, rise 4 f [strip 15 fps]; Rome empty bursts 0.6-1.2 s, closed-door insert 0.5 s [shot sheet]; Greek empty 6-9 f [strip 15 fps].
- Transfer: "the product sold out instantly" (crossing, empty shelf); a rocket stage sequence.
- Engine: SUPPORTED. Layer `at` 0.2-1.2 with `enter:"slide-up"`/`slide-left`/`rise`; `bg:"burst"` alone for the empty beat.
- Docs: extends 07 §2.3 "Empty beats are deliberate" (gives 3-12 f only; the reference also uses 0.5-1.2 s).

### I4 Exit-reveal: the leaving character uncovers the theme
- Purpose: when the character walks out, the remaining composition states the point.
- Seen in: Rome 13:05-13:07 (Caesar leaves; a chained throne tagged BOSS STILL ALIVE remains), 32:28-32:30 (an emperor leaves a window onto a burning city); Suiyang 1:01.8-1:02.2 (an official slides out with his "86 SERVANTS" placard; only a bone icon remains).
- Observed: a 1 f head turn, a rigid slide out of frame, then the empty composition holds.
- Composition and order: character in front of the theme object -> turn -> slide out -> hold.
- Timing: slide 1.2-1.6 s, empty hold 0.7-1 s [strip 15 fps]; Suiyang slide ~12 f [strip].
- Transfer: a CEO walks out leaving the empty chair and the falling ticker; a student leaves the desk and the paper shows "F".
- Engine: COMPOSABLE. `exit:"slide-left"` with `exitDur` 1.3 (or `out` + `move` steps) and the shot `dur` extended by 0.8 s.
- Docs: new.

### I5 Sub-second text punchline insert
- Purpose: one readable word as a joke, cut before it is explained.
- Seen in: WW2 0:06.8 (a game box title scrawled over with "RUN", 0.8 s); Rome 14:22.2-14:24.0 (two-step slam caption "OH GOD HE'S" then a tighter crop "...BECOMING A KING!!!"), 20:28.3 (0.4 s extreme crop of a poster, then the full poster).
- Observed: a close insert of a single written word or a crop that completes on the second shot.
- Composition and order: setup shot -> 0.4-0.8 s text insert (or crop, then reveal) -> back.
- Timing: 0.8 s; 1.2 s + 0.4 s; 0.4 s + 2.6 s [shot sheet].
- Transfer: "and the documentation said..." (one word: "NONE"); a product box scrawled "DON'T".
- Engine: SUPPORTED. `doc kind:"graffiti"` or `fx kind:"marks"` over a `prop`, or a `title` shot of 0.4-0.8 s with `camera.zoom` crop.
- Docs: extends toolkits/06_paper_and_lettering.md (graffiti); the sub-second timing is new.

### I6 Relabel or deface the icon as the verdict
- Purpose: an instant comic verdict on a thing or a name; reveals true intent.
- Seen in: Fanta 0:31.87-0:32.10 (marker doodles deface a mascot on "Nazi"); Greek 9:36-9:40 ("PRISONERS" struck out, rewritten "MENU"); China 24:42 (a name struck and rewritten); Reconquista 2:27.3 (an identity label slapped over by another's arm); Fact-check 3:57 (the next painting is already stamped CANCELLED).
- Observed: strokes draw on stroke by stroke, or a strike plus rewrite, or a slab slapped over a label; the victim's brows drop on the same frame.
- Composition and order: icon or label held -> strike/doodle/slap on the word -> hold.
- Timing: Fanta 8 f of strokes starting 0.25 s before the word [strip]; Reconquista arm 2 f, brows drop the same frame, hold 50+ f [strip].
- Transfer: "Employees" struck to "Resources"; a campaign poster defaced after a scandal.
- Engine: SUPPORTED. `doc kind:"list"` `strike` + `retitle`; `doc kind:"nameplate"` `strike`; `doc kind:"graffiti"` `write`; label slap: `arm kind:"rubber"` + `swap` of the `label` text (07 #219).
- Docs: extends 07 §4 "Relabel punchline" and recipe #219.

### I7 Censor or interrupt mid-word
- Purpose: refuses to show or say something, and turns the refusal into a running gag.
- Seen in: China 18:56-19:00 ("finally whole agai-": a censored hand cracks the map), 29:12 ("happily ever afte-" cut by "Oi mate"); WW2 18:02-18:06 (a mascot clubs the host before he describes an atrocity); Border 0:41.0, 1:05.5 (a red box covers the sensitive word); Greek 9:10-9:22 (a fourth-wall editor gag).
- Observed: the narration is cut off by an on-screen event: a hand, a club, a box over the gap.
- Composition and order: setup line -> interruption on the last syllable -> reaction or complaint.
- Timing: the box pops in the pause [sheet 0.5 s]; the club hit within 2-4 s [sheet 2 s].
- Transfer: "the bug is finally fix-" (the screen cracks); a brand name covered by "[REDACTED]".
- Engine: COMPOSABLE. `arm` + map region `split`/`shatter`; `label`/`sign` `enter:"pop"` with "CENSORED"; censor creature: `creature`/`obj` + `hold` + `fx kind:"shock"`. Never use a real platform logo.
- Docs: extends 07 recipe #276 (drip censor); the mid-word crack is new.

### I8 Retraction by desaturation
- Purpose: the narrator walks back an exaggeration; the image loses its colour.
- Seen in: Bunkers 0:32.4-0:34.2 (a bunker in a toilet, then the same frame in black and white: "okay, maybe not everywhere"); Beer 1:05.1-1:12.2 (the judge's thought cloud turns grey on "though they definitely could have").
- Observed: hard cut or in-shot change to greyscale on the hedge phrase, held.
- Composition and order: absurd image -> hedge word -> grey copy -> hold 1.7 s.
- Timing: hold 1.7 s [sheet 0.5 s].
- Transfer: "every developer uses Vim. Okay, not every"; "the best pizza in the world, well, in town".
- Engine: SUPPORTED. `grade:"mono"` (new) on a duplicate shot, or a `grade` key with `at` on the hedge word.
- Docs: new (grade `mono` is new in this pass).

### I9 Who moves and who does not
- Purpose: a reaction is read from the bystanders, or from the lack of one; timing makes it comic.
- Seen in: Poe 17:13.5-17:14.5 (doctors recoil and shake, the revived man holds still); Fact-check 0:34.5-0:37.5 (two guests snap to the same grin on the same frame); Greek 12:16.87-12:20.8 (a crowd murmurs with staggered single-member changes, never in unison); Rome 31:02-31:06, 32:00 (an emperor is stabbed behind the narrating critic, nobody reacts), 0:28.6-0:31 (neighbours keep crying while the heirs are tipped off one by one); China 16:42 (the puncher keeps a star-eyed face).
- Observed: four modes: reactors-only jitter; both characters swap on the same frame; a crowd changes one member at a time; a deadpan foreground ignores a background event.
- Composition and order: subject event -> reactors respond in the chosen mode (or not at all) -> hold.
- Timing: Poe jitter every frame for 1+ s with shake lines [strip]. Fact-check 40 f neutral hold, heads turn 1 f, 46 f hold, both grins 1 f [strip]. Greek crowd held ~3.9 s, no two neighbours change on the same frame [strip]. Rome background action 2-4 s [sheet 2 s].
- Transfer: a jury reacting; a presenter explaining stability while a server rack catches fire behind him.
- Engine: SUPPORTED. `jitter` on reactors + `fx kind:"shock"`; `swap` `expr` at the same `at`; crowd: separate beans with staggered `talk` windows; deadpan: background beans with `blur`, `expr:"dead"`, `exit:"pivot-fall"`.
- Docs: extends 07 §6.1 "Expression snap"; reactors-only, staggered murmur and the deadpan background are new.

### I10 Panic close-up arrives oversized and settles
- Purpose: realisation hits the viewer as a camera blow.
- Seen in: Fact-check 9:45.83-9:46.0 (a sweat close-up zooms out onto a blue polka backdrop); Bunkers 0:07.13 (one motion-blurred frame from a face-palm to a low close-up).
- Observed: the close-up starts too big and settles in a few frames; sweat ticks cycle while the pose holds.
- Composition and order: lean-in or setup -> cut to oversized close-up -> settle -> hold.
- Timing: Fact-check settle ~5 f, hold 1.3 s+ [strip]; Bunkers 1 blurred frame [strip].
- Transfer: realising a deadline; the moment a bug is found in production.
- Engine: SUPPORTED. `camera.zoom` keys [1.25 -> 1.0 over 0.17 s] or `transition:"zoom-punch"`, `bg:"mood"`, `fx kind:"sweat"`.
- Docs: extends 07 §6.6 "Jump cut-in".

### I11 Prop pun close-up after the wide
- Purpose: a verdict or cause told as one visual pun.
- Seen in: Beer 1:11.9-1:12.9 (single source: a judge swings, hard cut to a gavel whose head is a coin stack).
- Observed: wide with the downswing, hard cut to an extreme close-up on a pale speed-line background; the pun object drops and hits on the key word.
- Composition and order: wide action -> hard cut -> pun object close -> hit -> hold.
- Timing: downswing 5 f, cut, drop 5 f, hit on "act" [strip].
- Transfer: "the vote was bought" (a ballot box of coins); "lobbyists wrote the law" (a pen made of banknotes).
- Engine: SUPPORTED. `prop kind:"coin-gavel"` (`strike: [t, …]` swings the coin head down in 3 f) in a close-up after a hard cut.
- Docs: new.

### I12 Ironic reward for the culprit
- Purpose: mocks an unjust outcome.
- Seen in: Beer 1:00.9-1:05.1, 1:16.5 (a "DID NOTHING WRONG AWARD" rosette pinned on the owner, later a full-frame swing-in wipe); French 1:07.8-1:11.45 (the king grins, thumbs up, confetti, "YAY..."); Reconquista 23:22 (a NEW HIGHSCORE card).
- Observed: a celebration device applied to the wrong person; it returns later as a wipe.
- Composition and order: culprit smiles -> award or confetti -> hold.
- Timing: French confetti from 70.37 s, word pops over ~6 f, the film ends mid-confetti [strip].
- Transfer: "the CEO got a bonus"; "the polluter was fined one dollar".
- Engine: COMPOSABLE. `doc kind:"ribbon"` or `stamp` pinned by an `arm`; `fx kind:"confetti"` + `title`; `doc kind:"highscore"`. The rosette: `prop kind:"rosette"` with `text` (wraps to fit) and `swing`.
- Docs: extends 07 recipe #127.

### I13 Backfire: the same weapon turns on the user
- Purpose: "it backfired" as one reversed beat.
- Seen in: WW1 11:00-11:14 (gas blown at the enemy; the wind returns and the user's face turns green, then a skull); Bunkers 0:37.22-0:37.5 (a prohibit stamp lands on the threat map: it never happened).
- Observed: the effect travels one way, then the same effect returns.
- Composition and order: launch -> victim reaction -> wind change -> user reaction.
- Timing: each half ~4-6 s [sheet 2 s].
- Transfer: a PR campaign that backfires; a price war that hurts the starter.
- Engine: SUPPORTED. `fx kind:"gas"` with direction swapped across two shots + `swap` with `expr` and `look: {headShape: "skull"}`.
- Docs: extends 07 recipe #141.

### I14 Shatter, then the successor sweeps up
- Purpose: one movement collapses and the next one literally cleans it away.
- Seen in: Reconquista 20:34-20:44 (single source).
- Observed: the battle title holds as a colour negative; the loser on a radial burst is struck by lightning and shatters; the successor sweeps the pieces into a dustpan.
- Composition and order: negative hold -> lightning -> shatter -> sweep.
- Timing: negative hold ~2.1 s, burst held 1.2 s, recoil ~0.5 s [strip 15 fps].
- Transfer: a failed product cleared off the shelf by its rival; a dead trend swept away.
- Engine: COMPOSABLE. `grade:"negative"` (new) on the title shot + `fx kind:"lightning"` + `fx kind:"disintegrate"` + `prop kind:"broom"` on a new bean.
- Docs: extends 07 recipe #77; the negative hold and the sweep-up are new.

## 9. Death, loss and atrocity by implication

All entries here keep the skill's rules (07 §5, SKILL.md): the act is never drawn, victims are never the butt
of the joke, mass death is an object or a number. Where the reference goes further, see section 16.

### D1 Red silhouettes, witnesses stay in colour
- Purpose: a killing happens without being drawn; the witnesses' faces carry the horror.
- Seen in: Suiyang 0:47.2-0:50.5 (single source).
- Observed: a weapon raised and held behind a calm victim; on contact the background figures become flat red silhouettes on black while the foreground witnesses stay in full colour; the victim's silhouette slumps slowly; cut to an aftermath tableau.
- Composition and order: witnesses' heads along the bottom edge -> raise and hold -> swing -> drain -> red tint -> silhouettes -> slow slump -> aftermath.
- Timing: raise held 23 f, swing 4 f, 1 f drained, 2 f red tint, silhouettes 20 f, slump ~27 f [strip].
- Transfer: the dark moment in a true-crime short; a factory accident in a safety video.
- Engine: COMPOSABLE. The `silhouette` modifier (red colour) switched on by `swap` on the background layers only + a full-frame black `prop`/`fx kind:"darkness"` layer that enters on the same frame (backgrounds cannot `swap` mid-shot; or cut to a `void` shot) + `move` steps on the victim; foreground beans untouched.
- Docs: extends 07 §5.1; the in-colour witness split is new.

### D2 Death flash on the word
- Purpose: makes "dead" land on the syllable, then returns to the story.
- Seen in: Zombie 0:03.55-0:04.12 (a lightning flash turns the boy into a black silhouette with red X eyes), 0:18.7-0:19.8 (a white radial burst, the body darkens, a red slash draws down on "throat"); Rome 8:04.7-8:05.3 (lightning x-ray flicker: black/white skeleton frames).
- Observed: a 1-frame swap to the dead state, lightning flicker, a hold, a fade back (or a stylised mark instead of the wound).
- Composition and order: living subject -> word -> 1 f swap -> flicker -> hold -> fade back.
- Timing: Zombie swap 1 f, bolt changes every 1-2 f for ~12 f, hold ~20 f, 6 f fade back [strip]; burst fades in 8 f, silhouette over ~6 f, slash 3 f [strip]; Rome four frames of 0.1-0.2 s inverted [shot sheet].
- Transfer: "this product was already dead"; "the company had been bankrupt for years".
- Engine: COMPOSABLE. Bean `silhouette` modifier + `expr:"dead"` via `swap` + `fx kind:"lightning"`; x-ray: `fx kind:"shock"` `xray:true` with `transition:"flash-cut"`.
- Docs: extends 07 recipes #72 and #99.

### D3 Death outside the frame
- Purpose: the death is implied by what leaves the frame or what is hidden.
- Seen in: Poe 8:38.0-8:40.0 (a coughing brother slides down out of frame, an empty chair, a puff of dust); Simon 0:16.3-0:21.6 (only the captain's hand and cap at the frame edge); Greek 17:16-17:18 (the kill hidden by a wall edge, a blood pool spreads into view); China 8:14-8:16 (a victim turns into a translucent blue ghost behind the man holding the forged letter).
- Observed: a slide out of frame, an occluder, or a ghost; then the empty place holds.
- Composition and order: victim in frame -> exit or occlusion -> empty hold -> a small trace (dust, pool, hat).
- Timing: Poe slide ~20 f, empty chair 0.6 s, dust rises over ~0.7 s [strip].
- Transfer: a competitor drops out of a race; a company "eliminated" behind a closed door.
- Engine: COMPOSABLE. Layer `move` steps off frame + `fx kind:"dust"`; `fg:"bg-front"` or `ledge` occluder + `fx kind:"pool"`; `material:"ghost"` with `enter:"fade"`.
- Docs: extends 07 §5.1 (occlusion and slide-out are not listed).

### D4 An object stands in for the dying
- Purpose: compresses illness-to-death or a remote death into one image.
- Seen in: Poe 6:13-6:16 (a coffin drops over the sickbed), 15:34.8-15:39.5 (a grandfather clock at midnight, a white figure sweeps through the extreme foreground), 5:54.5-5:57.3 (two framed portraits; rack focus; her glass cracks); Rome 37:20 (an empire shape engraved on a tombstone).
- Observed: the object lands on or replaces the person's place; a clock holds while a figure passes and the frame darkens; a portrait cracks for a death elsewhere.
- Composition and order: hold -> object drops / figure passes / glass cracks -> dust or darkness -> hold.
- Timing: sickbed hold 2.7 s, coffin falls 6 f with a dust burst [strip]; clock hold 1.1 s, foreground pass ~0.4 s with a 1 f flicker [strip]; crack lines in 1 f [strip].
- Transfer: the old phone replaced by its successor; a company's logo cracks when it goes bust.
- Engine: SUPPORTED. `prop kind:"coffin"` `enter:"drop"` + `fx kind:"dust"`; `prop kind:"clock"` + `transition:"fg-pass"` or a large blurred layer with `move` steps; `prop kind:"gravestone"`; portraits in `panel` `frame:"photo"`/`gilt` with shot `focus`. The portrait crack: `fx kind:"crack"` placed over the frame (`size` ≈ the portrait's half-width).
- Docs: extends 07 §5.1 (coffin) and recipe #68; the clock pass and the cracked portrait are new.

### D5 The light in the eye goes out
- Purpose: a quiet, clear end to a monster or machine.
- Seen in: Greek 17:26-17:30 (single source).
- Observed: a close-up of a glowing red eye narrows to a slit and dims while held.
- Composition and order: eye close-up -> narrow -> dim -> hold.
- Timing: ~4 s [sheet 2 s].
- Transfer: a robot shutting down; a villain computer.
- Engine: SUPPORTED. `fx kind:"redeyes"` with `close: {at, dur: 0.8}`: the eyes narrow to a slit and dim to off, then stay off; hold the dark frame afterwards.
- Docs: new.

### D6 Subtraction from a group
- Purpose: loss as people disappearing one by one from a picture.
- Seen in: Poe 0:22.5-0:28.5 (a family picnic portrait, members fade out individually); Rome 0:28.6-0:31 (an off-screen arm tips heirs off a balcony one by one); Reconquista 22:24-22:27 (off-screen arms take the coins, then the daughter).
- Observed: one member at a time leaves (fade or removal by an arm); the remaining ones do not react; the last frame washes pale or holds on the survivor.
- Composition and order: group held -> member 1 out -> member 2 out (overlapping) -> wash or hold.
- Timing: Poe group holds 3.5 s, each fade 0.6-0.9 s overlapping [strip 10 fps]. Rome arm in 4 f, victim rotates and drops 10 f, arm stays 10 f, retracts 2 f, 0.4 s hold, ~1.1 s per victim [strip]. Reconquista arm 1 sweeps in ~0.6 s, arm 2 comes 1.6 s later and yanks in ~0.3 s [strip 15 fps].
- Transfer: layoffs one desk at a time; species lost from an ecosystem.
- Engine: SUPPORTED. Per-layer `out` + `exit:"fade"` `exitDur` staggered; `arm kind:"rubber"` + target `exit:"tumble"`; `arm` `take`.
- Docs: extends 07 recipe #61 and §6.2 "Off-screen arm".

### D7 People become numbers that leave
- Purpose: a group of victims is a counted sign; its removal means they are gone.
- Seen in: Suiyang 1:00.0-1:01.7 ("86 SERVANTS" placard slides out of frame with its holder), 1:12.0 ("86 WOMEN!" sign); Fact-check 13:10-13:26 (quota pins pushed into a map, a "KILL" sheet).
- Observed: a placard is held up; just after "no ... left" the holder slides out with it; a small icon remains on the empty ground.
- Composition and order: placard held ~1.5 s -> exit -> empty ground with one icon.
- Timing: exit ~12 f [strip].
- Transfer: "500 jobs cut"; species lost per year.
- Engine: SUPPORTED. `prop kind:"placard"` `text` held by a bean + `exit`/`move` steps; `prop kind:"pin"`/`pins` on a map.
- Docs: new.

### D8 Neutral icons replace the unbearable
- Purpose: the narration says the terrible thing; the picture shows a neutral object.
- Seen in: Suiyang 0:54-1:01.5 (food icons stand in for people); Rome 30:48 ("dropped like flies" as a bug zapper); WW2 8:44 (crosses fill the region for Ethiopia's dead).
- Observed: a cartoon object or icon takes the place of the victims in every shot of the section.
- Composition and order: the speaker or perpetrator in frame + the icon -> no body anywhere.
- Timing: per beat 3-5 s [sheet 0.5 s].
- Transfer: "they burned the records" (a document icon); "workers were replaced" (a cog icon).
- Engine: COMPOSABLE. Any neutral `prop` (`bread`, `skull`, `coin`, `cross`) or map `crosses`; the food icon: `prop kind:"meat-bone"`.
- Docs: extends 07 §5.2.

### D9 Victims' order as a queue under a sign
- Purpose: delivers a horrible ordered list without depicting harm; the irony targets the system.
- Seen in: Suiyang 1:07.5-1:14.6 (single source).
- Observed: a maître d' under a pale arrow sign gestures groups through; each group slides in from the right and out to the left on its word; a pop sign marks the turning point.
- Composition and order: host and sign fixed -> group 1 -> group 2 -> sign pop -> group 3.
- Timing: ~1 s per group [strip 15 fps].
- Transfer: layoffs department by department; the order in which an OS kills apps.
- Engine: COMPOSABLE. Bean groups with `move` steps + `prop kind:"marquee-arrow"` with text + `head:"chef-hat"` look. Conflicts with 07 §5.4 (no gags in atrocity beats): use only for non-atrocity topics (the skill keeps 07 §5.4).
- Docs: new.

### D10 Silence after the death
- Purpose: gives the loss weight with an empty frame or black, before anything else happens.
- Seen in: China 9:52 (~3 s empty room after an escape), 10:28 (3 s black after a suicide), 26:30 (~3 s empty cliff at sunset), 16:46 (empty red after a punch-out); Greek 20:30.7-20:40.57 (an empty sea ~10 s, deadpan "Nevermind"); Suiyang 1:14.6-1:21.7 (an empty courtyard with a dark pool and bones); Rome 5:31.9 (a 0.8 s "5 SECONDS LATER" black card hides the murder).
- Observed: the place without the person, held; or black; nothing moves except a slow push.
- Composition and order: event -> empty composition or black -> hold -> (lighter beat later).
- Timing: China 3 s holds [sheet 2 s]; Greek ~10 s [strip 15 fps]; Rome card 0.8 s [shot sheet].
- Transfer: the empty desk after a founder leaves; the silent server room after the outage.
- Engine: SUPPORTED. The previous shot's `bg` without the bean, `camera.zoom` [1, 1.01]; `transition:"black-beat"` with `dur` 1-3; `doc kind:"timeskip"`.
- Docs: extends 07 §5.6 and recipe #74 (which gives 5 s; the reference holds up to 10 s).

### D11 Death as data
- Purpose: a death told through a machine readout.
- Seen in: Poe 18:30-18:35 (single source).
- Observed: POV eyelids close; black; glowing ECG traces with a green number; the trace flattens and the number snaps to 0 on the same frame.
- Composition and order: lids close -> black frame -> traces -> flatline + counter 0.
- Timing: lids ~7 f at 10 fps (~0.7 s), black 1 f, flatline and 0 on the same frame [strip 10 fps].
- Transfer: a server going down (uptime counter to 0); a species count reaching 0.
- Engine: SUPPORTED. `hud kind:"ecg"` (`bpm` constant or keys, `flatAt`: the trace goes flat, the readout counts to 0 and turns red) + `fx kind:"eyelids"` `mode:"close"` on the same frame.
- Docs: new.

### D12 Game text for a distant or deserved death
- Purpose: delivers a death in one second, at a distance, without a scene.
- Seen in: Zombie 0:44.5-0:46.5 (a kill-feed banner while the main character keeps walking); Fanta 0:28.6-0:30.8 (a game-chat farewell line on "war"); Suiyang 1:28.9-1:30.5 ("CRITICAL HIT!!!" rises after an embrace hides the stab); WW1 16:06 ("SOLDIER1 HAS LEFT").
- Observed: a banner or floating text announces the death; the action in the frame does not stop.
- Composition and order: main action -> banner at the top -> continue.
- Timing: text rises over ~6 f [strip]; banner held 1-2 s [sheet 0.5 s].
- Transfer: "meanwhile the rival company went bankrupt"; "the candidate dropped out".
- Engine: SUPPORTED. `doc kind:"killfeed"`; `hud kind:"score"` with `text`; `hud kind:"notice"`.
- Docs: extends 07 §5.1 (killfeed line). Use original wording, never a game's real death screen (section 16).

### D13 Harm implied by the device and puffs
- Purpose: shows pain without wounds; the device is shown, the victim stays generic.
- Seen in: Church 1:02.6-1:03.57 (a screw turns, puffs burst on "fingers"), 0:35.33-0:36.9 (a hanging figure swings through the tall frame like a pendulum); Greek 1:46 (red slash marks instead of a wound).
- Observed: an extreme close-up of the mechanism; white puffs at the contact on the key word; victims are plain grey beans.
- Composition and order: mechanism close-up -> motion -> puffs on the word -> cut.
- Timing: screw turns ~20 f, puffs grow over ~6 f [strip]; pendulum period ~1.5 s with an empty-rope interval [strip 15 fps].
- Transfer: a hydraulic press test; a nutcracker in a product demo.
- Engine: SUPPORTED. `prop` close-up + `fx kind:"puff"`; pendulum: `swing` `{amp, period}` on the layer (a pivot at the frame top may need a parent; check).
- Docs: extends 07 §5.1.

### D14 Drop the comic frame for the atrocity, return with a line
- Purpose: marks a section as serious by removing the film's running jokes and slowing down (even inside a 90 s short), then signals the return.
- Seen in: WW1 19:40-20:42 (the game UI disappears for the genocide segment; a serious aside; "back to the not-so-great war"); Rome 17:52 onward (after the sponsor break: longer holds, serious grades, gags further apart); Suiyang 0:52-1:21 (the short slows to ~4 cuts/min against 15 in the first minute).
- Observed: the frame device and HUDs vanish; shots lengthen; grades go cold; the host speaks plainly; an explicit line brings the frame back.
- Composition and order: frame device -> drop it -> serious block -> host aside -> frame returns.
- Timing: WW1 block ~1 min [sheet 2 s]; Rome Empire half median shot 5.92 s vs 3.51 s in the comedy half [decode]; Suiyang 15 cuts in the first minute, ~4 per minute in the last 35 s, shots of 7-11 s [decode]; Pope 17 cuts in the first minute, 3 in the last 20 s for its payoff holds [decode].
- Transfer: a safety film that drops its mascot for the real accident; a finance explainer that turns serious for a fraud victim story.
- Engine: SUPPORTED. Remove `overlays`/`pinned` HUD layers for those shots (`hideIn` on overlays), `grade:"cold"`/`solemn`, longer `dur`.
- Docs: new as a rule (07 §5.4 covers grade and pace, not dropping the frame device).

### D15 Euphemism painted over the truth
- Purpose: shows denial: the truth is written, then covered with a euphemism.
- Seen in: WW1 20:14-20:22 (single source: a red wall line is rolled over and re-lettered "RELOCATED!!", a thumbs-up arm pops in).
- Observed: red lettering on a wall; a roller covers one word right to left; a brush hand letters the euphemism; a thumbs-up.
- Composition and order: truth -> roller -> rewrite -> thumb.
- Timing: cover ~1.8 s, rewrite ~2 s letter by letter [strip 10 fps].
- Transfer: "layoffs" painted over as "rightsizing"; a recall renamed "service campaign".
- Engine: SUPPORTED. `doc kind:"graffiti"` with `cover` (`tool:"roller"`), `rewrite`, `thumb`.
- Docs: extends 07 recipe #46 (timing confirmed).

## 10. Place, travel and maps

### L1 Map spine: punch in, pop events, cut away, come back
- Purpose: exposition rides on one long-lived map; events arrive inside it every 1.5-3 s.
- Seen in: China (6:17 holds 30.3 s, 10:52.9 holds 24.7 s; punch-in at 6:05.6); Greek 10:50.5-10:56 (push-in, fires pop on); Reconquista 7:34-7:54, 16:34-16:58; Fact-check 2:02-2:18, 16:24 (23.4 s); WW1 disc 3 (median shot 7.17 s, map-heavy).
- Observed: a hard cut to about 2x on the region with a short residual push; labels fade before an event (poof, fire, arrow); inserts cut away and return to the map in the same state.
- Composition and order: wide map -> punch-in -> label -> event pops -> cut to a gag insert -> back to the map.
- Timing: China punch cut to ~2x, then a 7 f ease-out push, label fades 6 f, poof blooms 7 f [strip]. Greek push-in held 1.7 s, ~10 fires in 0.7 s (one per 2-3 f) [strip 10 fps].
- Transfer: zooming on one country in a statistics map; one line in a long contract.
- Engine: SUPPORTED. `map` with `regions`, `fires`, `labels`; `camera.zoom` starting at 2.0 easing to ~2.15 over 0.23 s; `fx kind:"poof"`.
- Docs: extends 07 §1.1 step 6 and recipe #21.

### L2 Living map faces keep their damage
- Purpose: countries act like characters and remember what happened to them.
- Seen in: China (faces with props; frozen during holds); WW1 26:32.33-26:35.8 (a map arm punches Russia, the black eye persists, later reused); WW2 10:00 (Germany with a black eye); Border 0:25.5-0:32 (Belgium gets X eyes); USA 0:46.5 (a map face winces with glove arms); Reconquista 14:42-14:46 (angry brows drawn on red neighbours).
- Observed: eyes, brows and mouths on the territory; damage marks persist across later map shots.
- Composition and order: region face -> event -> expression or damage -> keep it in every later shot.
- Timing: WW1 arm in 1 f, impact 2 f, hold 9 f, retract 2 f, second punch 2.5 s later [strip 15 fps].
- Transfer: a company's quarterly loss as a bruise on its logo; a team region after a lost match.
- Engine: SUPPORTED. `map` `regions[].face` (`mood`) + `damage:{kind:"black-eye"}` (07 #6) + `arm`. Keep faces static during holds if the reference look is wanted.
- Docs: extends toolkits/05_maps.md (faces, damage) and 07 §3.4 "Persistent damage".

### L3 A trail of events along a route
- Purpose: a campaign or journey summarised as a path with marks left behind.
- Seen in: Rome 13:06-13:10 (a toy car drives across the map dropping explosions); USA 0:33.5-0:38.5 (numbered route headings pop in country colours while a car follows the road); WW1 6:33.7-6:45.3 (two fight-cloud balls of heads race across an empty top-down field, planting flags into the trench line they leave); Reconquista 7:34-7:54 (cities burn one by one and turn green).
- Observed: a moving token; behind it marks pop at intervals; step headings or colours follow the route.
- Composition and order: token start -> move -> marks every 0.5-1 s -> end state.
- Timing: Rome explosions ~0.5 s apart (grow ~0.2 s, hold ~1 s, turn to smoke) [strip 15 fps]; USA one heading per 1.0 s on the words [sheet 0.5 s]; WW1 empty field 2.3 s, the clouds cross in ~5.8 s, hold 3.4 s on the two lines [strip 5 fps].
- Transfer: a delivery van leaving "late" stamps; a virus leaving infection dots.
- Engine: COMPOSABLE. `map` `figures` `path` (or `tokens`) + `trails` `head` + several `fx kind:"explosion"` at staggered `at`; headings as a `title` `swap` sequence. Marks dropped behind the mover: `drops: {every 0.5, icon "blast" | "dot" | any prop, life, after "smoke"}` on `tokens`, `figures`, `squads`, `camps`, `routes` or `trails`; a fight cloud along a path: map `fights: [{path, dur, heads, drops: {icon: "flag"}}]`.
- Docs: extends 07 recipe #149.

### L4 Round locator badge for a zoomed map
- Purpose: keeps the viewer oriented when the map is zoomed too far to recognise.
- Seen in: USA 0:12.2, 0:24-0:26.5, 0:39-0:41.5, 0:51-0:53.5, 1:18-1:21 (single source, five uses).
- Observed: a small round inset of the whole country with a red arrow sits in the top-right corner, holds, then fades when the local map has been read; at 0:02.03 the badge itself zooms through the cut (see X9).
- Composition and order: zoomed map -> badge pops top-right -> arrow points in -> fade.
- Timing: holds 2-3 s [sheet 0.5 s].
- Transfer: "this neuron in the brain" (a brain badge); "this server in Frankfurt" (a Europe badge).
- Engine: SUPPORTED. `panel` `layout:"frame"` `frame:"circle"` (new) with a `map` cell, or `layout:"pip"`; in a vertical film keep it in shot `pinned` so it stays in the visible strip; arrow via `label`.
- Docs: new (frame kind `circle` is new in this pass; 05_maps has no inset).

### L5 Pencil draws the line, the region answers
- Purpose: "a line was drawn" happens on screen; the side named next lights up.
- Seen in: Reconquista 11:30.67-11:33.8 (a pencil traces the Pyrenees, the south flashes on "south"); USA 0:04.5-0:06.5 (a chalk line draws along the 49th parallel).
- Observed: the tool enters, traces, exits; the named side flashes about a second later.
- Composition and order: map -> pencil in -> trace -> out -> region flash on the word.
- Timing: trace ~1.6 s, flash 1.2 s after the pencil exits [strip 15 fps]; chalk line ~2 s [sheet 0.5 s].
- Transfer: a property line between neighbours; a project scope boundary.
- Engine: SUPPORTED. `map` `pencil` + `barriers` + region flash via `recolor`; chalk: `bg:"chalkboard"` with its drawn items (there is no generic line layer).
- Docs: extends 07 recipe #206.

### L6 Border line morphs from straight to crooked
- Purpose: makes "it isn't straight" visible at maximum scale.
- Seen in: USA 0:16.0-0:18.6 (single source).
- Observed: the camera pushes until the frame is two bands; flags fly in to label them; the dividing stripe wobbles, then morphs into a zigzag on the key word; figures step into each other's teeth.
- Composition and order: push to bands -> flags -> wobble -> morph -> figures.
- Timing: flags land in ~6 f; wobble ~10 f; morph ~6 f, landing 0.5 s after "zigzags" [strip].
- Transfer: the treaty line in the ocean; a budget line that "should have been flat".
- Engine: SUPPORTED. `map` `morphs: [{from: [[x, y]…], to: [[x, y]…], at, dur 0.6, color, width, dash}]`: the border line eases from straight to crooked on twos.
- Docs: new.

### L7 A giant figure on the map
- Purpose: power or expansion as a body that stands on, steps over or looms above the territory.
- Seen in: WW2 13:32-13:42 (a child giant stands on a tilted map and steps into neighbouring regions); China 17:44-17:58 (rulers stand on an oblique map); Fact-check 10:46.5-10:56 (a giant leans in and plucks a figure); Greek 10:56.2 (a giant sepia face slides over the map); Rome 29:04-29:06 (a guard's dark silhouette slides over the map behind a tiny emperor).
- Observed: a figure at country scale; steps are pose swaps, not walk cycles; a shadow version reads as an unseen power.
- Composition and order: tilted map -> giant pops or slides in -> one step per beat -> region change.
- Timing: WW2 step is a pose swap at ~13:40 [strip 10 fps]; Fact-check pop 1 f, hold 2 s [strip 15 fps].
- Transfer: a regulator's shadow over a market map; a monopoly stepping into new markets.
- Engine: COMPOSABLE. `map` `view:"tilt"` + a large bean (`size` 1400) with `move` steps and a `pose` swap per step + region `conquer`; shadow: the `silhouette` modifier with low `alpha`.
- Docs: extends 07 recipe #5 and toolkits/05_maps.md `figures`.

### L8 Simultaneous pop across the territory
- Purpose: "everywhere at once": a coordinated action shown spatially.
- Seen in: French 0:50.07-0:51.33 (a throne drops into the centre of a map card, about 12 knights pop up); Fact-check 2:50-3:01 (units hop into each struck region); Rome 19:56-20:46 (forts pop along the frontier one per beat).
- Observed: one actor in the centre; agents pop across the region in fast succession, each with a small puff.
- Composition and order: centre drop -> pops spread outward -> hold.
- Timing: throne drop 2 f; one knight every 2-4 f [strip 15 fps].
- Transfer: a coordinated global outage; a nationwide strike.
- Engine: SUPPORTED. `map` + `figures` with staggered `enter:"pop"` (or `cities`/`drops`).
- Docs: extends toolkits/05_maps.md (figures).

### L9 A message travels as an object
- Purpose: diplomacy, orders or news shown as a thing that moves between places.
- Seen in: China 10:40-10:50 (a bottle floats to a neighbour's coast, then a handwritten letter card); French 0:36.4-0:44.6 (red letters fly out to the corners of a framed castle, then a time-locked envelope "OPEN ONLY AFTER..."); Fact-check 5:23-5:25 (outlined rings travel across a globe from a radio tower).
- Observed: the object crosses the map or the frame; a close-up of the message follows.
- Composition and order: sender -> object travels -> arrives -> message close-up held.
- Timing: rings emit one per ~3 f [strip]; envelope held ~4 s, then a push-in on the reader's eyes [strip 15 fps].
- Transfer: a cold email to a partner; a rumour spreading on social media.
- Engine: COMPOSABLE. `map` + `prop kind:"bottle"` or `scroll` with `move` steps + `doc kind:"document"`; rings: repeated `obj` ellipses with `move` steps (a ring emitter and a radio-tower drawing would be new).
- Docs: extends 07 recipe #245.

### L10 World-state signs and the location card
- Purpose: the place, its owner and its date are told by in-world lettering that changes with the story.
- Seen in: Reconquista 13:06, 13:38 (NOW LEAVING / WELCOME TO, then WELCOME BACK TO next to a corpse); Rome 4:04, 22:06, 29:42 (welcome and leaving signs); Border 0:18.8, 1:13.8 (a welcome arch, later chained shut); WW1 0:48, 4:46 (bevelled location title, the date fades in after); Simon 0:03.5 (red block letters drop behind the character); Suiyang 0:08-0:12 ("MODERN DAY CHINA" becomes "757 AD CHINA").
- Observed: signs at the road or arch; titles in the sky; the date subtitle arrives after the place name.
- Composition and order: establishing -> place name -> date 0.3 s later -> later visits show the sign changed.
- Timing: WW1 title fades in 2 f, date fades in 4 f 0.3 s later [strip].
- Transfer: a startup's "Welcome to unicorn land" sign that later reads "Welcome back to reality"; a lab door label that changes after each accident.
- Engine: SUPPORTED. `prop kind:"signpost"` with `turn` or `sign` + `swap` on `text`; `title` + `date` with `at`.
- Docs: extends 07 recipes #86, #144, #145.

### L11 Diegetic excuse for a new camera view
- Purpose: motivates an aerial or impossible view from inside the story.
- Seen in: WW1 6:20-6:30 (the host floats up wearing a bucket, cut to the top-down field); WW2 9:14.5-9:24.6 (the viewer is launched in a bubble across a top-down plaza, then a ground-level reverse); Fact-check 0:46-0:48 (a CCTV "CAM 1 REC" wide as the office's high angle).
- Observed: a character does something absurd that "lifts" the camera; the next shot is the new angle.
- Composition and order: character action -> cut to the new view -> back.
- Timing: WW2 power pose held 36 f, bubble pops in with overshoot (~1.3x, settles in 3 f) [strip 15 fps].
- Transfer: "let me get a drone view" before a city plan; a security camera view of an office workflow.
- Engine: COMPOSABLE. Bean `pose:"fly"` + a `hold` prop, then a `map`/`topbean` shot; `fx kind:"cctv"` `label:"CAM 1"`. The bucket: `prop kind:"bucket"` (`upside: true` worn as a hat, or held with `hold:"bucket"`).
- Docs: new.

### L12 Sky ellipsis
- Purpose: skips the walk or the dangerous part and marks time without a cut.
- Seen in: Greek 16:22-16:26.4 (tilt up off the labyrinth wall to the sky, tilt back down into a later moment); WW2 0:50.9-0:52.5 (tilt down from the sky to a piazza).
- Observed: an eased tilt to empty sky, a hold, an eased tilt back down to the same place later on.
- Composition and order: structure -> tilt up -> sky hold -> tilt down -> later state.
- Timing: Greek tilt ~10 f ease-out, sky ~4 s, tilt down ~9 f [strip]; WW2 tilt-down 13 f, hold 30 f [strip].
- Transfer: before results are announced; leaving a hospital room.
- Engine: SUPPORTED. `camera.pan` `[[0, -300], [0, 0]]` with `at`/`dur` 0.33 and `ease:"outCubic"` on a `bg` with sky above.
- Docs: new.

### L13 Map shape as an object in a scene
- Purpose: makes an abstract territory physical: it can be eaten, broken, engraved or glued.
- Seen in: Rome 21:32-21:36 (a country-shaped cracker dissolves in soup), 37:20 (the empire shape engraved on a tombstone); China 31:44 (a vase glued from the map pieces); Fact-check 20:12-20:16 (a child's crayon map).
- Observed: the outline of the territory is used as the silhouette of a prop.
- Composition and order: scene with the prop -> action on the prop -> narration names the country.
- Timing: 2-4 s per beat [sheet 2 s].
- Transfer: a country-shaped cookie being eaten; a state-shaped puzzle piece.
- Engine: COMPOSABLE. A small `map` layer (`scale`, `x`, `y`, `alpha`) placed on a `prop`; `doc kind:"crayon"`. A region as a standalone object: `prop kind:"region"` (`pts`, `face`, `label`) with `material:"gold"` or `"stone"`.
- Docs: new.

### L14 Capture as a cage dropped on a map token
- Purpose: "X was taken" as one map verb.
- Seen in: WW1 21:20.1-21:20.5 (a cage falls onto the Jerusalem token); Fact-check 12:00-12:08 (homeless men caged; scene version).
- Observed: a cage falls from above the frame onto the token, settles, holds; neighbouring tokens stay still.
- Composition and order: map with tokens -> cage drop -> hold.
- Timing: fall ~4 f, 1 f settle, hold 25 f [strip].
- Transfer: a city captured by a rival brand; a server quarantined on a network map.
- Engine: COMPOSABLE. `map` `tokens` + `prop kind:"cage"` with `enter:"drop"`.
- Docs: extends 07 recipe #209 (scene version); the map verb is new.

## 11. Memory, thought, imagination, point of view

### V1 Thought clouds: grow into the scene, or swap ideal for reality
- Purpose: enters imagination diegetically, or shows expectation vs outcome while the thinker does not move.
- Seen in: China 7:35.5-7:39.0 (thought puffs grow into a cloud wipe into the afterlife); Poe 7:00-7:06 (the cloud shows a rich self, then the self in a trash bin); Beer 1:05.1-1:12.2 (the judge's cloud shows the wave, then turns grey); Fact-check 15:16-15:26 (a dream bubble of gold coins over a retirement shack).
- Observed: either the cloud edge creeps down and then covers the frame into the imagined place, or the cloud content swaps on the "but".
- Composition and order: think pose -> puffs -> (slow creep -> fast cover -> white -> new place) or (ideal -> turn word -> reality) -> hold.
- Timing: China snap 2 f, creep 32 f, cover 7 f, dissolve 5 f [strip]; swaps ~3 s per state [sheet 2 s].
- Transfer: a daydream of retirement; a startup dream vs reality.
- Engine: COMPOSABLE. `pose:"think"` + `fx kind:"marks"` puffs + `transition:{kind:"cloud-wipe", from:"top"}`; content swap: `doc kind:"pictobubble"` `style:"thought"` (or `fx kind:"memory"`) with a `swap`; grey via `grade`.
- Docs: extends toolkits/09_transitions_and_lens.md (`cloud-wipe`) and 07 recipe #243.

### V2 Memory or imagination staged inside the same shot
- Purpose: a spoken memory or an imagined consequence shares the frame with the person thinking it; no flashback cut.
- Seen in: Greek 14:46-14:52 (shadow-puppet silhouettes on the wall behind the speaker), 13:28.5-13:33 (the other character wipes out of a two-shot and an imagined burning figure fades into the vacated half); Poe 5:08-5:30 (a glowing blue past self writes at the desk while the present self crawls); Rome 6:20 (the murdered brother's ghost returns as a callback).
- Observed: dark silhouettes or translucent figures act the memory beside or behind the thinker for 2-3 s each; the thinker keeps his expression.
- Composition and order: speaker close-up or two-shot -> one side clears (optional) -> memory figures fade in -> fade -> next.
- Timing: Greek wipe ~6 f, vision fades in ~8 f [strip 15 fps]; 2-3 s per memory [sheet 2 s].
- Transfer: a grandparent recalling the war; a manager imagining the layoffs while the employee leaves.
- Engine: COMPOSABLE. Beans or vehicles with the `silhouette` modifier (constant `alpha` 0.6, `blur` 2) at `z` < 1 with `enter:"fade"`; `material:"ghost"` + `glow`; `exit:"slide-right"` for the vacating character; `fx kind:"fire"` faded in and out with `enter:"fade"` / `exit:"fade"`.
- Docs: extends 07 recipe #181 (memory bubble); the in-shot staging is new.

### V3 Perception swap: the same figure through someone's eyes
- Purpose: shows why someone believed or feared something.
- Seen in: WW2 12:36-12:48 (a street preacher with a hate placard becomes a haloed angel in a desperate man's POV); Poe 18:06-18:12 (a woman's mirror shows a monster, then an angel).
- Observed: a cut to the POV angle with the subject re-drawn, then back.
- Composition and order: objective view -> OTS POV -> swapped look -> back.
- Timing: ~6 s total [sheet 2 s].
- Transfer: how a gambler sees a slot machine; how a fan sees a celebrity.
- Engine: SUPPORTED. `fg:"ots"` + `swap` `look:{head:"halo"}`, `pose:"pray"`; reverse with the original look.
- Docs: new.

### V4 Flashes reveal the hidden nature
- Purpose: subliminal reveal: what people really are shows only in the lightning.
- Seen in: Poe 9:53.5-9:59.5 (three townsfolk are monsters only on lightning frames); Rome 8:04.7-8:05.3 (an x-ray skeleton flicker on "he angered a god").
- Observed: irregular strobes; bright monster frames, then dark monster frames, then dim humans, then normal.
- Composition and order: normal hold -> strobe 1 -> back -> strobe 2 ... (irregular intervals).
- Timing: Poe 5 strobes in 6 s; per flash bright 2-6 f, dark 2-5 f, dim 2-4 f [strip].
- Transfer: employees as their burnout selves; politicians as their donors.
- Engine: COMPOSABLE. `fx kind:"lightning"` + layer `swap` alternating looks per strobe + `grade` keys for the dark frames.
- Docs: extends 07 recipe #99 (single silhouette swap).

### V5 Everyone fades to line-art except the subject
- Purpose: isolates one person for blame or attention.
- Seen in: Fact-check 18:46-18:52 (the crowd turns to white outlines, the subject stays coloured in a spotlight); Poe 13:48-14:02 (the whole frame becomes white lines on black for "suffocating" pages); WW1 30:17-30:23 (the world turns to a wireframe at "memory overload").
- Observed: an in-shot switch of all other layers to outlines.
- Composition and order: crowd scene -> switch -> spotlit subject held.
- Timing: ~6 s [sheet 2 s].
- Transfer: one employee singled out; the one person who said no.
- Engine: SUPPORTED. The `lineart` modifier via `swap` on the crowd layers + `fx kind:"spotlight"` on the subject.
- Docs: extends toolkits/08_fx_and_tone.md (`lineart` is documented only for "inside his mind").

### V6 Silhouette behind glass, then lit
- Purpose: introduces a secret or a monster without showing it.
- Seen in: Greek 5:40-5:46 (a baby silhouette moves behind a translucent striped door); Fact-check 12:11.0-12:11.67 (a booth figure lightens from a dark silhouette).
- Observed: a soft silhouette behind a translucent panel; either held (mystery) or lit up (reveal).
- Composition and order: panel -> silhouette moves -> hold or light up.
- Timing: Greek ~3 s hold [sheet 2 s]; Fact-check lightens over ~20 f [strip].
- Transfer: a prototype behind a lab door; a surprise guest behind a curtain.
- Engine: COMPOSABLE. `prop kind:"door"` + a bean with the `silhouette` and `blur` modifiers at `alpha` 0.5; lit: `swap` off the silhouette with a `grade` key.
- Docs: new.

### V7 Looking out from inside the object
- Purpose: puts the viewer inside the absurd device.
- Seen in: Greek 3:48-3:54 (single source).
- Observed: a dark wooden frame with a small rectangular window; the characters outside are seen through it.
- Composition and order: aperture fg -> outside action.
- Timing: ~6 s [sheet 2 s].
- Transfer: inside a vending machine watching a customer; inside a server rack.
- Engine: SUPPORTED. `fg kind:"aperture"` with `hole: [x, y, w, h]` (fractions of the visible frame), `radius`, `bars` (window bars), `edge`.
- Docs: new.

### V8 Top-down for loneliness and for the dead
- Purpose: the overhead view isolates a person, a body or a fall.
- Seen in: Poe 2:17 (alone in a box), 8:40-8:50 (a slowly rotating overhead on the brother's body), 10:40 (tiny in an ink void); Greek 1:02.0-1:05.4 (top-down in the sea while the frame darkens from the edges on "the ocean turned black"); WW2 9:24.6 (the viewer's face top-down looking up).
- Observed: subject small in the centre; the frame darkens or rotates slowly.
- Composition and order: overhead -> slow darkening or rotation -> hold or lightning.
- Timing: Greek darkening over ~2.6 s, 2 f lightning flash in the next wide [strip 15 fps]; Poe rotation over ~10 s [sheet 2 s].
- Transfer: the last customer in an empty mall; a lone diver over the deep.
- Engine: SUPPORTED. `bg:"floor"` + `topbean` + `fx kind:"spotcone"` or `darkness`; rotation `move` steps with `zoom` [1.2, 1].
- Docs: extends 07 §6.6 "Rotating overhead" and recipe #179.

### V9 A device viewfinder gives a second voice
- Purpose: switches to a documentary, surveillance or "other side" voice.
- Seen in: Rome 13:28-14:13 (a camcorder REC overlay over the subject's good deeds); Fact-check 0:46-0:48, 19:16-19:30, 22:48-22:51 (a CCTV angle as the unseen boss's eye); Poe 1:05-1:28 (a telescope iris view of the park).
- Observed: overlay chrome (REC dot, corner brackets, crosshair or CAM label) over normal shots; the overlay is dropped when the voice ends.
- Composition and order: normal story -> overlay on -> 3-5 items -> overlay off.
- Timing: Rome ~14 s with a new item every ~3 s [sheet 2 s].
- Transfer: "behind the scenes of a founder"; "what the ad doesn't show".
- Engine: COMPOSABLE. `fx kind:"cctv"` with `label:"REC"` or "CAM 1" over the shots (`variant: "camcorder"` adds the battery icon, running timecode and crosshair); telescope: `fg:"spyglass"`.
- Docs: extends toolkits/08_fx_and_tone.md (`cctv`).

### V10 Eyes as the window
- Purpose: starts inside a character's head, or links "he read it" to "what it meant".
- Seen in: WW2 0:01.8-0:03.8 (an extreme close-up with the previous video reflected in both eyes, pull-out to the room); WW1 0:24.07-0:25.3 (the viewer's POV eyelids blink at the TV, then the TV powers on as a white bloom inside the eye and the logo resolves); Greek 2:23-2:34 (the obsession reflected in an eye close-up with a blush); French 0:44.6-0:49.8 (a slow push-in on a reader, the eyes snap wide, the map dissolves in through the eye area).
- Observed: the eyes fill the frame and show what the character sees, or the next shot comes in through them.
- Composition and order: eyes close-up -> hold -> scale out, or eye snap + camera jump -> dissolve to the meaning.
- Timing: WW2 hold 22 f, scale-down 4 f, 6 f crossfade, eyes open in 2 f [strip]; WW1 open 11 f, close 1 f, closed 3 f, re-open via 2 f, bloom ~2 f up and ~3 f hold, logo resolves over ~12 f [strip]; French dissolve ~5 f [strip 15 fps].
- Transfer: a gamer's eyes reflecting the loss screen; a scientist reading results, then the global outbreak map.
- Engine: COMPOSABLE. Close-up bean `size` 1300+ with `expr:"vision"` and look `vision`; a `camera.zoom` `[from, to]` push + `camera.jump` + `swap` `expr` + `transition:"dissolve"` (`dur` 0.2); viewer POV: `fg:"eye-pov"` with `blink` (its close takes a 2 f slit, the reference 1 f).
- Docs: extends 07 §3.1 "Eyes as screens"; the dissolve through the eyes is new.

## 12. Frame devices, narrator, running gags and continuity

### F1 Hub set with fixed camera setups and a procedural loop
- Purpose: a repeatable structure the viewer learns, so each new case runs faster.
- Seen in: Fact-check (an office reused ~25 times from four fixed setups: wide, OTS on the guest, host medium, CCTV high corner; a red and a green door in the same wall); WW2 (a museum gallery hub at 0:14, 9:20, 16:12, 18:26); Bunkers 0:00, 0:21, 0:38 (a game-show stage at start, middle and end); WW1 (a real room with a console at 0:00, 4:28, 12:44, 22:26, 30:36).
- Observed: guest enters, quote, pause, cutaway, host comment, verdict, door; each case varies one step.
- Composition and order: hub establishing -> case loop -> return to the hub in a changed state.
- Timing: Fact-check cases run 7 min, then shorter [sheet 2 s]; door closes in ~0.3 s, hold 1+ s on the closed door [strip 15 fps].
- Transfer: a hiring panel judging candidates; a quiz show for product claims.
- Engine: SUPPORTED. Reused `bg` and layer layouts per setup; `prop kind:"door"` `color`, `open`, `slam`; `fx kind:"cctv"`.
- Docs: extends 07 §3.2 (Trial / fact-check, Museum).

### F2 The presenter trapped inside a game
- Purpose: turns chapters into levels and the topic's darkness into the host's conflict.
- Seen in: WW1 (discs as chapters; mission cards; the host refuses at 12:17; a villain "System" addresses the viewer at 13:04; the memory overload escape at 30:17); Pope 0:01.9 (a "mission passed" banner frames the whole short as a run); Rome 7:28-8:50 (a speedrun timer).
- Observed: game chrome (P1/P2 markers, mission banners, pause menus, insert-disc cards) wraps the history; an antagonist owns the frame story; inside the game the pause menu is painted mirrored on a cabin wall (they are behind the screen, WW1 22:22.2); the game breaks at the climax.
- Composition and order: rent or start the game -> level 1 -> pause -> insert next disc -> ... -> the game breaks -> back in the room.
- Timing: chapter cards ~2 s; disc swap ~12 s; see X4 for the glitch chain [strip].
- Transfer: a biology course as levels (cells, organs); a cooking series as cartridges.
- Engine: SUPPORTED. `doc` kinds `mission`, `pause`, `insert`, `menu`; `hud` markers; `fx kind:"glitch"`.
- Docs: extends 07 §3.2 "Video game" (the trapped host and the system antagonist are new).

### F3 Act counter on a hanging sign
- Purpose: turns repetition into anticipation: the audience waits for the next increment.
- Seen in: China 4:48 and six more times (single source; 0 to 7: 8:48, 15:06, 19:28, 20:54, 21:52, 30:58).
- Observed: a wooden "COUNT" sign drops, swings; a new card slides in over the old one, which falls.
- Composition and order: collapse event -> sign drop -> new number -> narrator callback line.
- Timing: drop 3 f, 1 f overshoot, 2 f settle, then a pendulum sway; the new card rotated ~25° [strip].
- Transfer: "times the server crashed this year"; "failed launches".
- Engine: SUPPORTED. `doc kind:"hangsign"` with `swap:{at, num}`.
- Docs: extends toolkits/06_paper_and_lettering.md (hangsign; timing confirmed).

### F4 Persistent HUD across the film
- Purpose: one glance tells how far along the life, the reign or the run is.
- Seen in: Pope 0:08.5-1:20 (YEARS PASSED + RANK, the rank colour follows the costume); China (an era chip with a mini-map and year; "FREE FOR ALL" badge in interregna; "HAN 2", "TANG 2" on restorations); Rome 7:28-8:50 (an LCD speedrun timer); Border 1:01.8-1:07.5 (a wanted-level HUD that rises with the narration).
- Observed: a corner widget stays across cuts; it ticks on each step; its state names (badge, sequel number) carry the story.
- Composition and order: widget appears on the first step -> ticks on every step -> special states for anarchy or restoration -> freezes at the end.
- Timing: Rome timer pops in frozen at 0.00, stays frozen across one cut for ~1 s, starts when the first subject rises into frame, freezes at the end of the montage [strip 15 fps]. Pope rank label recolours and glows on change [strip].
- Transfer: "how to become a doctor" (years + title); a sports season ("CHAMPION: X", "VACANT", "X 2").
- Engine: SUPPORTED. `spec.overlays` (or shot `pinned` in vertical films) with `hud kind:"counter"`, `chip`, `timer-lcd` (`start`, `stop`), `era`. Arc lettering over the number: a `title` with `arc` (degrees) in the same overlay.
- Docs: extends 07 §3.4 "Running counter" and recipe #196; anarchy and sequel states are new.

### F5 Mute viewer stand-in collects stickers
- Purpose: gives the narration's "you" a body and rewards each chapter.
- Seen in: WW2 (a white bean gets a star sticker at 9:12, a beer mug at 16:01, a skull badge at 18:18); WW1 (a mute white bean friend reacts with eyes only: dot, O, squint, tear; and at 0:00-0:01.2 the viewer's own POV glove rattles a KEEP OUT door, which swings open in 3 f onto the host already talking) [strip].
- Observed: the stand-in never speaks; it is pushed, kicked or dropped into chapters and keeps every sticker.
- Composition and order: chapter end -> sticker slap -> keep it in every later shot.
- Timing: sticker slaps on with scale 1.4 -> 1 over 3 f (engine default).
- Transfer: a new employee collecting badges through onboarding; a learner collecting merit stamps.
- Engine: SUPPORTED. Look `stickers` `[{kind, anchor, at}]` on the `cast` member; `expr` changes only.
- Docs: extends toolkits/01_characters.md (stickers) and 07 §3.4 "Persistent damage"; the chapter reward is new.

### F6 Same place, changed state on every return
- Purpose: the location itself tells what changed; a rerun with only the date changed makes the sameness the joke.
- Seen in: Greek 5:06, 15:12, 18:34, 19:02 (a workshop door with an angrier sign each visit: "BRO JUST STOP!", "I'M OUT!"); Rome 36:44-36:58 (a rerun: the 410 and 455 sacks use the same burst, giant and stomp, only the date plate changes); China (the same collapse map at every dynasty); Rome 0:13 and 3:46 (the balcony with roles reversed), 27:00 (an empty throne with a tumbleweed); WW2 2:12-2:33 (the piazza regraded grey); Suiyang 0:32 (the storehouse with cobwebs); Bunkers 0:07 vs 0:38 (empty map, then covered); Border 1:13.8 (the welcome arch chained); Poe 0:09 vs 0:12 (the park bright, then dead and grey).
- Observed: identical framing; one sign, grade or prop differs.
- Composition and order: establishing exterior 2-4 s -> sign readable 1.5 s+ -> action.
- Timing: sign readable for at least 1.5 s [sheet 2 s].
- Transfer: a startup's door ("No pitches", "NO PITCHES!!", "Moved to Bali"); a lab door after each explosion.
- Engine: SUPPORTED. The same `bg` and layout per visit + `sign`/`signpost` `text` per visit + `grade` per visit; rerun: duplicate the shot with a `date` `swap` on `text`.
- Docs: extends 07 §3.4 "Callback composition" and "Rhetorical callback".

### F7 Setup prop pays off later
- Purpose: continuity the viewer notices: a small object planted early returns at the turn.
- Seen in: Rome 5:32 -> 7:38 (a tombstone set up after a murder trips the murderer two minutes later); Reconquista 9:02 -> 10:56 (a commander's HELLO MY NAME IS sticker marks him until he dies), 17:22 -> 18:00 (an emblem planted, wobbling, then falling on its owner); Greek (the thread from gift to door knot to bloody exit).
- Observed: the object stays visible across shots; it is used again at the payoff.
- Composition and order: plant -> keep in frame in later shots -> payoff.
- Timing: payoffs 1-2 min after the plant [sheet 2 s].
- Transfer: a sticky note on a monitor that explains the outage; a contract clause shown early that sinks the deal.
- Engine: SUPPORTED. Same `prop` kind and position across shots; `doc kind:"nametag"`; `emblem3d` with `topple`.
- Docs: extends 07 §3.4 "Prop callback" and recipe #137.

### F8 The dead return as translucent callbacks
- Purpose: ties the ending to the beginning across time; the dead comment on the living.
- Seen in: Reconquista 23:00, 23:26 (the founder stands behind the heirs at the final push; ghost kings toast at the victory party); Rome 6:20 (the murdered brother's ghost), 26:46 (Augustus descends to force a sign on his heir); China 8:16 and 13:52 (translucent blue ghosts).
- Observed: a translucent figure in the old costume stands behind or beside the living.
- Composition and order: living characters -> ghost fades in behind -> one gesture.
- Timing: ghost fade ~15 f (engine "Ghost fade") [sheet 2 s].
- Transfer: the founder's ghost at the company's IPO; a grandparent's ghost at the family reunion.
- Engine: SUPPORTED. Bean `material:"ghost"` + `enter:"fade"` (+ `glow`).
- Docs: extends 07 recipe #58; the lineage payoff is new.

### F9 Narrator argues with the picture
- Purpose: puts the narrator's opinion into the scene; the screen changes in response.
- Seen in: Rome 33:48-33:58 (the critic argues with a CRT: the text flips, one version gets a red X), 2:16-2:47 (props pop over the narrator's hand as a list); China 21:30 (the narrator barges into a scene), 31:06 (thrown into the map); Fact-check 6:06-6:14 ("not even going to comment").
- Observed: a host in an armchair or at the edge reacts; the screen content flips or is crossed out.
- Composition and order: host + screen -> screen claim -> host objection -> screen flips or X.
- Timing: flips every 2-3 s [sheet 2 s].
- Transfer: a host disputing a chart on a monitor; a scientist arguing with an outdated textbook diagram.
- Engine: COMPOSABLE. `prop kind:"crt"` with a `screen` (sub-shot) + `fx kind:"prohibit"`/`marks` + host `pose:"point"`.
- Docs: extends 07 §3.4 "Narrator interruptions".

### F10 Reaction character between segments
- Purpose: a recurring face gives the viewer permission to react ("twice!?").
- Seen in: USA 0:38.67-0:46.5 (a teacher face-palms on "TWICE!"); Border 1:23.6 (the narrator's close-up "I apologise, but no"); Bunkers 0:34.2 (an expert at a whiteboard "Nothing Ever Happens"); Rome 2:20, 7:20, 13:24, 24:44, 33:48 (the critic every 1-3 min).
- Observed: a 2-4 s close-up of the same explainer face between map segments.
- Composition and order: segment -> reaction close-up -> next segment.
- Timing: 2-4 s inserts [sheet 0.5 s]; long-form returns every 1-3 min [sheet 2 s].
- Transfer: a teacher face-palming between bad code samples; a referee shaking his head between fouls.
- Engine: SUPPORTED. One `cast` explainer + `pose:"facepalm"` on `bg:"mood"`; `title` for the word.
- Docs: extends 07 recipe #268.

### F11 Earlier image crossed out
- Purpose: "instead of doing it like before", or "that version is wrong", in one beat.
- Seen in: USA 0:54.0 (the earlier "chaps with a thread" image returns with a red X); Rome 33:48-33:58 (one name version gets a red X); China 7:02-7:10 (the old form crossed out after the evolution).
- Observed: a small re-show of the earlier visual; a red X pops over it; the new method appears beside it.
- Composition and order: callback image -> X -> new image.
- Timing: X pop ~4 f [sheet 0.5 s].
- Transfer: "instead of emailing, they used chat"; "instead of oil, they burned coal".
- Engine: SUPPORTED. Re-used layer + `fx kind:"prohibit"` (or `prop kind:"prohibit"`).
- Docs: new as a callback.

### F12 Wrong one first, corrected in the world
- Purpose: disambiguates a confusable name without a caption.
- Seen in: China 27:16-27:20 (the camera passes the "YELLOW TURBAN STORE", "no, not that one", continues to the "RED TURBAN STORE"); WW2 2:33-2:36 (a chef bean: "no, the one without the hat").
- Observed: the decoy is shown first; the camera or the narrator moves on to the right one.
- Composition and order: decoy -> correction line -> pan or pop to the right one.
- Timing: ~4 s [sheet 2 s].
- Transfer: Java vs JavaScript; two similarly named towns.
- Engine: COMPOSABLE. Two `sign` layers + one `camera.pan` move from the first to the second; or the second bean `enter:"pop"` 0.6 s later.
- Docs: extends 07 §4 "Wrong one first" and recipe #270.

## 13. Transitions and chapter changes

### X1 Swirl locked on a shared centre
- Purpose: a fast jump in time, place or tone that keeps the eye on the same spot.
- Seen in: 10 of the 12 shorts: Fanta 0:03.37, 0:33.57; Pope 0:58.2; Simon 0:05.4; Church 0:05.1; Bunkers 0:38.27; Border 0:18.63; USA 0:08.97; Suiyang 0:08.07; Zeppelin 0:09.93; French 0:17.5 (Beer and Zombie use other jumps; see X8). Not reported in any long-video note.
- Observed: A twists into a radial blur around a point, a vortex peak, B untwists from the same point; both centres sit on the same subject (a country silhouette, a tangle that lands on a church spire).
- Composition and order: hold A -> twist -> vortex -> untwist B -> sharp.
- Timing: total 8-12 f: Fanta ~4 f + ~4 f; Bunkers 4 f + 4 f (9 f); Border 3 f twist, 5 f vortex, 2 f untwist (10 f); French 4 + 3 + 4 f (12 f); Zeppelin 2 f blur + ~6 f unwind [strip].
- Transfer: "meanwhile in the lab"; a before/after of the same city.
- Engine: SUPPORTED. `transition:{kind:"swirl", at:[x,y], turns:0.75, dir:1, dur:0.3}` (new; default 0.4 s; the reference runs 0.27-0.4 s).
- Docs: new (the swirl transition is in the engine but not in 07 §6.7 or toolkits/09).

### X2 Whip, horizontal or vertical
- Purpose: "meanwhile", a comparison, or a section change; vertical whips match the tall frame.
- Seen in: Border 1:30.4-1:30.7 (vertical, 8 f), 0:51.5 (horizontal); WW2 7:14.5-7:17.5 (whip pans between frozen vignettes of one wide tableau: three acts of a gang in one gesture); Simon 0:34.27-0:34.5 (smear out 4 f, smeared entrance 3 f); Bunkers 0:07.13 (1 blurred frame); China 4:16.5, 12:36.5 (2 heavy-blur frames between two framings on the same background); French 0:11.87 (5 f); WW1 7:20.77 (a 4 f lateral pan with blur).
- Observed: A smears in the travel direction, B arrives smeared and settles; the China variant only reframes on the same backdrop.
- Composition and order: hold -> smear out -> smear in -> settle.
- Timing: 1-8 f as listed; WW2 vignettes held ~2 s each, whip 3-4 f [strip].
- Transfer: comparing two products; three stages of a supply chain in one panorama.
- Engine: SUPPORTED. `transition:{kind:"whip", dir:"left"|"right"|"up"|"down"}` (`dir` new in this pass); same-backdrop reframe: `camera` `jump` with a 2 f blur; panorama: one shot per vignette with the same wide `bg:"burst"` offset by `camera.pan`, joined by 3–4 f `whip` transitions (a single camera move cannot hold and whip several times) + `fx kind:"speedlines"`.
- Docs: extends toolkits/09_transitions_and_lens.md (whip is documented as horizontal only).

### X3 White-out timing family
- Purpose: entering a story, a world switch, a blast, a scare release.
- Seen in: Fact-check 1:15.0-1:18.5 (push into a TV, bleach, white, the map fades out of white); Rome 0:10.5-0:13.5 (accelerating push into the origin dot, white crossfade); WW2 16:30.4-16:32.2 (a kick, wash to white, white, fade into a train); Poe 0:48.10-0:48.57 (2 f hard white, the portrait fades up); Beer 0:28.13-0:28.77 (white-out, then the burst resolves); WW1 25:19.07-25:19.23 (white before a "joins" name slab), 28:09.5-28:10.1 (a foreground prop stays in frame through 9 f of white and a 3 f ghosted dissolve while the world behind it changes) [shot sheet].
- Observed: always a push or impact first, then a pure-white hold, then the new image comes out of the white.
- Composition and order: slow push -> accelerate -> bleach -> white hold -> fade out of white.
- Timing: Fact-check slow push ~40 f, accelerate ~22 f, bleach 4 f, white ~20 f, fade-in ~10 f [strip]. Rome push 20 f, crossfade 17 f [strip]. WW2 wash ~0.2 s, white 0.9 s [shot sheet]. Poe white 2 f, fade-up 12 f [strip]. Beer to white 10 f, hold 2 f, resolve 8 f [strip]. WW1 white 5 f, name fades in 2 f, hold 38 f [strip].
- Transfer: into a hologram meeting; a light-bulb moment.
- Engine: SUPPORTED. `camera.zoom` keys (ease-in) + `transition:"fade-white"` with `dur` 0.4-1.0; or `screen-dive` for a screen.
- Docs: extends 07 §6.7 (`fade-white` 12 f; the reference white holds run 2-27 f).

### X4 Glitch, black hold, white ramp, location card
- Purpose: a hard chapter boundary that feels like a machine switching worlds.
- Seen in: WW1 4:45.33-4:48.0 (disc swap); Poe 11:58.8-12:00.4 (a datamosh glitch that spills over the cut); WW1 30:17-30:23 (memory overload: a circular vignette with tear strips, the host breaks into pixels).
- Observed: a pixel-slice glitch on the old image, black, a ramp to white, the place title, the date after it; Poe's corruption continues 0.2 s into the next shot.
- Composition and order: glitch -> black -> white -> title -> date.
- Timing: WW1 glitch 20 f, settle 20 f, black 27 f, then a stepped ramp (dark grey 3 f, light grey 3 f) to white with the title, title 2 f, date 4 f 0.3 s later [strip + shot sheet]. Poe 27 f row-tear glitch, bottom 40 % drops to black, 4 f near-black, 3 more hits into the next shot [strip].
- Transfer: switching from one software version to the next; a hacked system rebooting.
- Engine: COMPOSABLE. `fx kind:"glitch"` (`dur` 0.66) + `transition:"black-beat"` + `transition:"fade-white"` + `title` + `date`; a glitch overlay in both shots (or `overlays`) for the spill-over. Row tears and the bottom black-out: `glitch` `style: "corrupt"`; the black, grey, white disc-swap ramp: `glitch` `style: "stepped"`.
- Docs: new chain (07 §6.7 lists the pieces separately).

### X5 Mosaic explosion
- Purpose: a blast that is also a cut (or a punctuation inside a shot) in the channel's pixel look.
- Seen in: Zeppelin 0:02.92-0:04.25 (a pixelated fireball wipe); Beer 0:34.8-0:35.7, 0:36.1-0:36.9 (two mosaic bursts inside one shot).
- Observed: a blocky fireball covers the frame, churns, browns, recedes with a stepped edge revealing B.
- Composition and order: hold -> blast covers -> churn -> brown -> recede -> B.
- Timing: covers in 5 f, churns ~17 f, recedes ~7 f, ~40 f total; block size ~1/20 of the frame width [strip]. Beer bursts ~0.9 s each [strip 10 fps].
- Transfer: "the market crashed" into a new chart; "the server exploded" into the post-mortem.
- Engine: SUPPORTED. `transition:"pixelate"` (`block` 48, `flash` 0.25, `dur` 0.4) for the cut; inside a shot, put a 0.4 s insert shot between two `pixelate` transitions, or use `explosion-wipe` for a non-pixel blast.
- Docs: new.

### X6 Burn-away reveal
- Purpose: the destruction of a symbol is the transition.
- Seen in: French 1:02.10-1:03.0 (fire rises from the bottom and burns a banner away, revealing the stake); China 21:56 (a fire-smoke wipe, sheet only); WW1 8:45.67-8:46.73 (a related full-frame fire beat: the fire dissolves in over ~10 f, holds 23 f with the flames redrawn about every 5 f, then a hard cut) [strip].
- Observed: flames climb from the bottom edge; the image chars from below and recedes upward; flames remain along the bottom of B.
- Composition and order: symbol full frame -> flames rise -> char line climbs -> B revealed.
- Timing: flames climb ~40 % of the height in 12 f; char line ~16 f; ~30 f total [strip].
- Transfer: "the treaty went up in flames"; "the brand was destroyed".
- Engine: SUPPORTED. `transition: {kind: "burn", from: "bottom"}` (0.9 s): a charred, flaming edge eats A and uncovers B.
- Docs: new.

### X7 Something passes the lens and carries the cut
- Purpose: moves between scenes without a hard cut, using an object or a body that fills the lens.
- Seen in: Church 0:40.37-0:41.83 (a mitre rises from the bottom edge until the robe fills the frame); Poe 16:15.23-16:16.3 (a thrown sheet grows into the lens), 2:05.9-2:07.1 (bats swarm from the edges, black, thin out on a new place), 16:45.6-16:46.4 (giant ravens sweep up; one lands perched in the new scene); Beer 1:16.5 (a rosette swings in as a full-frame wipe), 0:04.73-0:05.13 (a broadsheet pushes to fill the lens); WW1 21:24.3-21:26.2 (three 0.2-0.3 s motion-blurred rushes up a crate tower, a 1.0 s near-black foreground pass, then the big reveal) [shot sheet].
- Observed: the passing object fills the frame; the next scene appears behind or after it; sometimes the object stays as a prop in the new scene.
- Composition and order: hold -> object enters -> fills the lens -> next scene.
- Timing: Church ~45 f [strip 15 fps]; Poe sheet ~30 f ease-in, bats 12 f in / 3 f black / ~20 f out, ravens ~25 f [strip]; Beer paper ~12 f then a 7 f dip to black [strip].
- Transfer: a paper plane that wipes to the office where it lands; a bee that wipes to the flower.
- Engine: COMPOSABLE. A large `prop`/bean/`creature` with `move` steps until it covers the frame + a `cut`; horizontal figures: `transition:"fg-pass"`; a swarm of bats or birds: `transition: {kind: "swarm", creature: "bat"}` (1.2 s). A vertical rise or drop: `transition: {kind: "fg-pass", axis: "vertical"}`.
- Docs: extends toolkits/09_transitions_and_lens.md (`fg-pass` is horizontal, figures only).

### X8 Squeeze to a seam, blurred pull-back in
- Purpose: "case closed... until" feels like a door shutting and a new view opening.
- Seen in: Zombie 0:20.53-0:21.17 (single source).
- Observed: A squeezes horizontally toward a centre line, stretching and darkening; B starts ~2x and blurred and pulls back sharp on the next key word.
- Composition and order: squeeze out -> cut -> blurred zoom-out in.
- Timing: squeeze 8 f, pull-back ~12 f [strip].
- Transfer: "the deal was off... until"; switching from a backstory to a map.
- Engine: SUPPORTED. `transition: {kind: "squeeze", axis: "horizontal"}` (0.5 s): A collapses into a bright line, B pulls back from 2× with a blur.
- Docs: new.

### X9 An inset badge carries the cut
- Purpose: carries the "where" from one scene into the next.
- Seen in: USA 0:02.03-0:02.47 (single source).
- Observed: a round badge behind the emblem character scales and rotates up until its map fills the frame, holds, shrinks back into a circle that is now part of the next scene.
- Composition and order: badge in A -> grows to full -> full map -> shrinks into B.
- Timing: 3 f grow, 3 f full, 4 f shrink, 4 f settle (~14 f) [strip].
- Transfer: a logo badge flying from a title into a dashboard; a globe badge into a classroom map.
- Engine: SUPPORTED. `transition: {kind: "carry", from: [x, y, w, h], to: [x, y, w, h], round: true}` (0.5 s): the badge window of A grows to fill the frame, then B's window shrinks back into its badge.
- Docs: new.

### X10 Paper or a card carries the cut
- Purpose: the page that told the fact becomes the wipe into the event, or a card signals "now the real version".
- Seen in: Beer 0:57.33-0:57.67 (a hand slides the photo page out to the left, revealing the flooded street), 1:24.83-1:25.10 (the paper slides down, revealing the opening frame); Fact-check 18:05.3 (a paper roll rolls across as a wipe); Reconquista 1:01.5-1:04.2 (a parchment of ideal icons tears open on a brawl: "on paper"); French 0:11.87-0:12.77 (a whip, then the next shot appears as a small card with a drop shadow on white and grows to full).
- Observed: a held page moves out of frame (slide, roll or tear) and uncovers the next image; or the next image arrives as a card and grows.
- Composition and order: page held -> drift -> fast slide or tear -> scene; or whip -> card at 40 % -> hold -> grow.
- Timing: Beer drift 15 f, slide ~10 f with heavy blur; loop slide ~6 f [strip]; Reconquista hold 1.3 s, halves slide apart over ~1 s [strip]; French whip 5 f, card held 4 f, grows over ~20 f [strip].
- Transfer: a contract pulled away to show the factory; from a myth to its source document.
- Engine: COMPOSABLE. `doc kind:"newspaper"`/`document` with `move` steps over the next shot's layers; tear: the `split` modifier with a jagged seam on the paper layer; card: `panel` `layout:"frame"` (`frame:"photo"` or `none`) with a cell `{shot}` and `move` steps (`scale` 0.4 → 1) after `transition:{kind:"whip"}`.
- Docs: extends toolkits/09_transitions_and_lens.md (`torn-split` is one-sided; the centre tear and the card zoom are new).

### X11 Black beat, length by meaning
- Purpose: black as impact, sarcasm pause, death silence or chapter dread.
- Seen in: Rome 22:52-22:55 (16 black frames after a creeping axe), 5:31.9 (0.8 s "5 SECONDS LATER"); WW2 13:32.5 (1.3 s black on "Yeah, shocker, right?"); China 10:28 (3 s black after a suicide); Greek 15:53.8 (7.3 s black before entering the labyrinth); WW1 4:46.6-4:47.5 (27 f black between discs).
- Observed: pure black of very different lengths depending on the job.
- Composition and order: event or line -> black -> next shot (often a title).
- Timing: impact 0.5 s; sarcasm 1.3 s; chapter 0.9 s; death 3 s; dread 7.3 s [strip / shot sheet].
- Transfer: after "and then the email was sent"; before "the results".
- Engine: SUPPORTED. `transition:{kind:"black-beat", dur}` (with `title` for a solemn card).
- Docs: extends 07 §6.7 (`black-beat` 12 f) with the length table.

### X12 Portal by shove, kick or sinking into a picture
- Purpose: a chapter switch as a physical act on the viewer stand-in.
- Seen in: WW2 0:43.3-0:44 (POV hands dive into a framed photo, white flash), 9:46.2-9:47.8 (the viewer sinks ghosted into a floor painting and drops into the next set), 16:30-16:32 (a kick, white); Greek 20:40.6-20:42.8 (reverse: the fight freezes and pulls back into a painting).
- Observed: the body enters the picture; whiteout or a fall into the new set.
- Composition and order: picture in frame -> push/kick/sink -> white or fall -> new set.
- Timing: sink ~8 f, empty painting 12 f, body falls in 6 f and lands flat [strip].
- Transfer: diving into a dataset; falling into a video game level.
- Engine: SUPPORTED. `transition:"portal"` with `frame` or `fade-white`; sink variant: `material:"ghost"` + `move` steps + `alpha` (composable).
- Docs: extends 07 recipes #152 and #278.

## 14. Endings and payoffs

### E1 Freeze into a picture: a photograph or a painting
- Purpose: closes the story as an archived moment ("this is the past", "this became legend").
- Seen in: Fanta 0:36.07-0:37.0; Simon 0:54.73-0:55.17 (then held ~1.9 s to the end); Zeppelin 1:06.17-1:07.43 (then a CTA bar); Beer 1:22.57-1:22.70 (a halftone photo on a newspaper); Greek 20:40.6-20:42.8 (the frozen climax pulls back into a gilt painting beside the aged hero); Fact-check 3:38-3:42 (a live cutaway freezes into a painting the host points at).
- Observed: the frame washes white or drains to grey, then shrinks into a bordered print (on wood, on white with a drop shadow, on a newspaper), sometimes tilted; or a fast zoom-out reveals a gilt frame and a person beside it.
- Composition and order: final action -> freeze -> grey or white wash -> shrink into a print (or pull back to the painting) -> hold (or CTA).
- Timing: Fanta wash 7 f, shrink ~12 f [strip]; Simon drain 6 f, shrink 7 f [strip]; Zeppelin grey ~10 f, shrink and tilt -4° in ~4 f, CTA bar in 6 f [strip]; Beer to halftone in 2 f [strip 15 fps]; Greek frozen 2.07 s, zoom-out 4-5 f, settle ~3 f [strip 15 fps].
- Transfer: "and that was the last photo of the old factory"; a launch-day photo that becomes a framed print in the boardroom.
- Engine: COMPOSABLE. Next shot: `panel` `layout:"frame"` `frame:"photo"` (new) or `gilt` with a cell `{shot: <previous>, t: <its dur>}` + `grade:"mono"` or `sepia` on the source shot (panel cells honour only `grade: false`) or on the whole new shot + `move` steps on the panel (or `camera.zoom` out); a bean `age:"elder"` beside a gilt frame. A panel cannot show its own shot.
- Docs: extends 07 recipe #278; the photo outro is new.

### E2 Seamless loop or mirrored bookend
- Purpose: lets a short replay without a seam; closes the frame story in a long video.
- Seen in: Beer 1:24.83-1:25.4 (the last paper slides down to reveal frame 0's street); Pope 1:16.6-1:20 (the final throne pose mirrors the opening); Fanta 0:38.1 (ends on the opening's friend); Poe 18:43 (the park composition from 0:09 repeats); Greek 21:08-21:25 (storyteller bookend in an armchair).
- Observed: the last image matches or rhymes with the first composition.
- Composition and order: last beat -> uncover or rebuild the opening composition -> hard end.
- Timing: Beer slide ~6 f, the video ends there [strip 15 fps].
- Transfer: a cooking short that ends on the empty board it started with; a tutorial that ends on the opening question answered.
- Engine: COMPOSABLE. Final shot built from shot 1's layers; the slide-away as a `doc` with `move` steps over those layers.
- Docs: extends 07 §3.4 "Callback composition"; the seamless loop for shorts is new.

### E3 Ironic button
- Purpose: ends on the villain's gain or the absurd outcome with sarcasm, no moral.
- Seen in: French 1:07.8-1:11.45 (thumbs up, confetti, "YAY...", ends mid-confetti); Reconquista 23:22-23:52 ("NEW HIGHSCORE! 781 YEARS! CONTINUE?", then "WE DON'T HAVE TIME LOL" paying off the opening's time debt); Church 1:08.8-1:13.0 (a modern sting about another government).
- Observed: a celebration or game-over card applied with irony; the film stops during it.
- Composition and order: final fact -> celebration device -> cut before it settles.
- Timing: French word pops over ~6 f, the film ends 1 s into the confetti [strip].
- Transfer: "and the lobbyist got a promotion. Congratulations!"; "the project shipped. Three years late."
- Engine: SUPPORTED. `fx kind:"confetti"` + `title` pop + `pose:"thumbs-up"`; `doc kind:"highscore"`; `fx kind:"boom"` with `text`.
- Docs: extends 07 recipes #127 and #275.

### E4 End on the open problem
- Purpose: leaves the last decision to the viewer; makes the replay immediate.
- Seen in: Bunkers 0:45.5-0:47.96 (single source).
- Observed: a cursor hovers over the map; every object lights up for a moment; a "REMOVE? $$$$" dialog grows in; hard end.
- Composition and order: map full of objects -> cursor hover -> highlight -> dialog -> end.
- Timing: highlight 4 f; dialog grows 4 f to ~110 %, settles 3 f, lands 0.08 s after "because"; the video ends 0.34 s after the last word [strip].
- Transfer: "delete all your old photos?"; "cancel the subscription?".
- Engine: COMPOSABLE. `cursor` layer (hover) + a brief `grade`/`glow` key on the objects + `doc kind:"error"` or `menu` as the dialog.
- Docs: new.

### E5 Pull-back reveal on the twist line
- Purpose: the last beat recontextualises the story: the cheerful arrival is too late.
- Seen in: Suiyang 1:30.5-1:34.72 (single source).
- Observed: a cheerful soldier with pizza boxes; hard cut to the reverse with the face already in horror; the camera pulls back to reveal the stain and bones in the foreground; hard end.
- Composition and order: cheerful arrival -> reverse -> pull-back -> end.
- Timing: pull-back ~12 f; ends 0.32 s after the last word [strip].
- Transfer: "the fix shipped one day after the company folded"; "the rain came a week after the harvest died".
- Engine: SUPPORTED. `camera.zoom` [1.3 -> 1.0] over 0.4 s + `swap` `expr` + `fx kind:"pool"` in the foreground.
- Docs: new as an ending.

### E6 Outbound tease or sequel sting
- Purpose: keeps the viewer in the series.
- Seen in: Border 1:30.5-1:33.21 (a vertical whip to a new map: "not the US and Mexico just yet"); Zombie 1:17.6-1:21.4 (a newspaper with a mock sequel headline); WW1 30:24-31:00 ("WALDO WILL BE BACK", a sequel box hidden in the closet); WW2 18:24-18:57 (an empty frame for the next war).
- Observed: one more shot with the next topic or a sequel card; no recap.
- Composition and order: punchline -> whip or cut to the tease -> one line -> end.
- Timing: Border ends 0.27 s after the last word [decode + strip].
- Transfer: any series of shorts; "next week: the other half of the story".
- Engine: SUPPORTED. `doc kind:"sequel"`, `newspaper`, `tbc`; a normal shot after `transition:{kind:"whip", dir:"up"}`.
- Docs: extends 07 §3.5 and recipe #280.

### E7 Lyrical last image
- Purpose: ends on wonder instead of a joke; one image sums up the most surprising fact.
- Seen in: USA 1:27.5-1:34.61 (single source).
- Observed: split islands with "FRIDAY / THURSDAY" labels; hard cut to a low-angle over-the-shoulder at night: an observer in the foreground, the other island under the moon; a second figure joins; hard end.
- Composition and order: fact split -> cut to OTS night -> slow drift -> end.
- Timing: OTS held ~5 s, figure joins at 1:32.0 [sheet 0.5 s].
- Transfer: "from this hill you can see two time zones"; "the light you see left that star 1000 years ago".
- Engine: COMPOSABLE. `bg:"sky"` `preset:"night"` + a foreground bean (`size` ~1400, `fg:"ots"`) + a far bean with a late `enter`.
- Docs: new.

### E8 The ending addresses the viewer
- Purpose: a closing callback that happens to "you".
- Seen in: Greek 21:22-21:25.7 (single source: POV hands raised before a glowing-eyed figure; the screen turns to cracked stone).
- Observed: a POV shot; an overlay creeps from the edges and covers the frame; hard cut to credits.
- Composition and order: POV -> threat's eyes -> 1 f flicker -> cover from the edges -> full cover -> cut.
- Timing: 1 f stone flicker, ~70 % cover held ~0.75 s, full cover 9 f [strip].
- Transfer: "don't look at the sun" (the screen goes white); "the screen freezes" (the viewer turns to ice).
- Engine: SUPPORTED. `fx kind:"petrify"` (`dur` 0.4, `stage2`): the whole visible frame drains to cracked grey stone in two stages; add `fg:"hands-fpv"` for the viewer's own hands.
- Docs: new.

## 15. Vertical-short specifics

Engine basis for every entry here (NEW IN THIS PASS): `spec.format:"vertical"` renders 1080x1920 from a
607.5-px-wide strip of the 1920x1080 world, full height; `shot.frame` (number or `[{at, v, ease}]`, 0.158-0.842)
pans the strip; `shot.pinned` layers draw after the shot without camera, centred in the visible frame;
labels, titles, counters, corner widgets (`hud` `chip`, `timer-lcd`, `doc` `killfeed`) and `cctv` corners now clamp to
the visible strip. Author every layer inside +/-303 world px of the frame centre; vertical travel can use the
full 1080 world px.

### S1 Three bands, caption band reserved
- Purpose: one subject reads at phone size and the platform captions never cover a face.
- Seen in: all 12 shorts (e.g. Pope 0:08.5-1:20, Fanta 0:17.5, Bunkers 0:03-0:07, Suiyang 0:33-0:40, French 0:49.6-0:52).
- Observed: top 10-25 %: titles, counters, badges, HUD; 20-45 %: faces and the subject; about 40-65 %: left clear for captions; bottom 25-35 %: foreground mass (podium, desk, backs of heads, props). French puts a map card in the upper two-thirds with a soft blur below.
- Composition and order: HUD top -> face upper-middle -> clear band -> foreground bottom.
- Timing: n/a (layout) [sheet 0.5 s].
- Transfer: a vertical cooking short (recipe step top, hands middle, board bottom); a phone-first product demo.
- Engine: SUPPORTED. `format:"vertical"` + `pinned` titles/HUD + layer `y` placement; check with `--stills`.
- Docs: new (no vertical section in SKILL.md, 02, 03, 05 or 07).

### S2 The first frame already moves, and the hook lands by 2 s
- Purpose: frame 0 is the feed preview; it must move, and the first key word must have an event.
- Seen in: Zeppelin 0:00-0:00.13; Zombie 0:00-0:00.13; French 0:00-0:01.27; Simon 0:00-0:00.13; Fanta 0:01.87; Pope 0:01.23; USA 0:01.0.
- Observed: the opening shot starts 5-10 % enlarged (blurred in Zombie and French) and settles; a pose snap or rise-in follows within 0.6 s; no title card, no channel ident; the first sentence is the claim.
- Composition and order: settle -> first event on the first key word (by 2 s) -> second hook by 3-6 s (H3).
- Timing: settle 4 f in all four measured shorts; Zeppelin officer rises from the bottom in 3 f with 1 f overshoot at 0.6 s [strip].
- Transfer: the first frame of any short.
- Engine: SUPPORTED. `camera: {zoom: [1.08, 1], at: 0, dur: 0.13, ease: "outCubic"}` (a punch at 0 starts from 1, not enlarged); `enter:"rise"`.
- Docs: new (07 §3.1 requires a title card within 15-45 s, which shorts never use).

### S3 Same cut rate, no frozen frames
- Purpose: density without frantic cutting.
- Seen in: all 12 shorts [decode].
- Observed: real cuts 10-17 per minute (long videos 7-16); static frames 2-12 % (USA 19 %) against 21-46 % in long videos; each 4-11 s shot carries 3-6 in-shot events; a joke or pun every 6-10 s (group C count).
- Composition and order: per shot: settle -> 3-6 pops, swaps, peeks, pushes -> cut.
- Timing: a new visual idea every 1.5-2.5 s [sheet 0.5 s]; narration 175-186 wpm (2.9-3.2 words/s) [transcripts].
- Transfer: any 30-90 s explainer.
- Engine: SUPPORTED. Default `camera.zoom` drift + staggered `at` on layers; budget events, not cuts.
- Docs: extends 07 §1.2 (counts only); add a vertical row: 60-90 s, 13-23 real shots, 25-35 in-shot events.

### S4 Wide subjects: crop, never shrink
- Purpose: fits maps, ships and vehicles into 9:16 without tiny unreadable content.
- Seen in: Zombie 0:21-0:42 (a vertical strip around the border, figures at ~30 % of the frame height); French 0:49.6 (a map card); Zeppelin 0:54.5 (Britain, a naturally tall island; then seen through a cockpit windscreen), 0:11.5, 0:40, 1:01 (the airship as a sliver, a top band, a cropped flank); Fanta 0:09.2-0:11.9 (a truck in two beats: cab, then trailer side), 0:29.0 (the world as a globe cap in the lower 60 %); Pope 0:49.3 (a region as one strategy tile); Simon (a ship only in vertical slices); Bunkers 0:01 (Europe on a curved globe close-up); Border 0:32.4 (a tilted map).
- Observed: choose a tall region, a strip, a card, a cap, a tile or a slice; draw figures far above map scale.
- Composition and order: per subject, pick one of: tall region / border strip / card / globe cap / tile / two beats.
- Timing: n/a [sheet 0.5 s].
- Transfer: a long train in two beats; a river map cropped to one bend.
- Engine: COMPOSABLE. `map` with `camera` `focus` on a strip + `shot.frame`; `view:"globe"` placed low; `view:"tilt"`; `panel` card; a region as one game tile: `prop kind:"iso-tile"` (`building` tower / house, `owner` colour).
- Docs: new.

### S5 Border direction becomes the frame split
- Purpose: top/bottom or left/right halves of the tall frame map onto two sides.
- Seen in: USA 0:16.0-0:22.97 (a horizontal border: Canada band top, US bottom), 1:24-1:29.7 (a vertical date line: one island per half); Border 0:44.6-0:51.9 (the Netherlands' face top, Belgium's face bottom); Church 0:23.9-0:27.1 (idea top, people bottom); Suiyang 0:23.2 (a diagonal split).
- Observed: the divider runs across the frame; each half gets its own colour, flag or face.
- Composition and order: push until two bands -> labels -> events per half.
- Timing: flags land in ~6 f [strip].
- Transfer: buyer top, seller bottom; "above the line vs below the line" in a budget.
- Engine: COMPOSABLE. A `map` pushed to bands with `camera.zoom` + `prop kind:"flag"` layers; or two `panel` `layout:"custom"` cells stacked top and bottom (`split` divides left/right only).
- Docs: new.

### S6 Witnesses as heads along the bottom edge
- Purpose: depth in a tall frame; puts the viewer among the onlookers.
- Seen in: Suiyang 0:33-0:40, 0:47-0:51, 1:14.6-1:21; Zombie 0:27-0:33, 0:50-0:56 (big hat backs, the speaker small above); Bunkers 0:03.3-0:06.5 (the contestant cropped large at lower-left).
- Observed: large cropped heads or helmets in the lower third looking into the scene.
- Composition and order: foreground backs bottom -> subject upper-middle.
- Timing: n/a [sheet 0.5 s].
- Transfer: an audience at a keynote; customers in a queue.
- Engine: SUPPORTED. `fg:"ots"` or a `crowd` row at `z` > 1.3 with `view:"back"` near the bottom.
- Docs: extends 02-visual-grammar.md "Depth rule".

### S7 The vertical axis carries the meaning
- Purpose: drops from the top, fills from the bottom, height as altitude or quantity.
- Seen in: Beer 0:08.7-0:14.2 (tilt up a giant vat with tiny workers at the base; the top lands on "half a million"); Zeppelin 0:40-0:46 (bombs fall top to bottom), 0:10.0-0:13.2 (a biplane crosses the lower half, the airship enters high: altitude); Zombie 0:38 (a claw), 0:57 (a crown drops), 1:16 (an urn flies out the top); Beer 0:01 (flood from the bottom), 1:12.2 (a coin gavel drops); French 0:21-0:29 (crowds, castles and invoices rise from the bottom), 1:06.7 (the king rises from the bottom edge); Church 0:35.3 (a pendulum through the height), 0:40.4 (a mitre rises).
- Observed: entrances come from the bottom edge more than from the sides; gauges and tallies stack vertically.
- Composition and order: threat or gift from the top; accumulation from the bottom.
- Timing: rise-ins 3-4 f with a 1 f overshoot (French, Zeppelin) [strip]; Beer base hold ~2 s, tilt ~2.5 s with ease in and out [strip 6 fps].
- Transfer: savings filling a jar; a rocket's stages.
- Engine: SUPPORTED. `enter:"rise"`, `slide-up`, `drop`; `move` steps over the full 1080 world px; tilt: `camera.pan` `[[0, -400], [0, 0]]` over a tall `prop` (e.g. `barrel` at large `scale`).
- Docs: new.

### S8 Natively tall frames: held paper, phones, comic pages
- Purpose: motivates the tall format with an in-world portrait object.
- Seen in: Fanta 0:17.5-0:23.6 (a comic page built in reading order: two small panels on top, one tall panel below, then a soldier breaks out of the bottom panel over the gutters); Beer 0:01, 0:47, 1:23 (a newspaper held by gloved hands); Zombie 0:05 (a phone), 1:17.6 (a newspaper); Pope 0:16.2, 1:09.3 (phone chats); French 0:36.4 (a portrait painting frame); Bunkers 0:28.8-0:31.5 (a travel app scrolled on a phone, one card per list word).
- Observed: the content is shown inside a portrait object that fills most of the frame.
- Composition and order: hand-held object -> content swaps per word -> slide away.
- Timing: Bunkers swipes follow the words at ~0.9 s spacing [sheet 0.5 s]; Fanta panels ~12 f each, break-out rise 4 f [strip].
- Transfer: a recipe on a phone; a receipt that unrolls.
- Engine: SUPPORTED. `panel` `layout:"frame"` `frame:"phone"`; `doc kind:"newspaper"`; `fg:"hands-fpv"`; comic page: `panel` `layout:"custom"` with three `rect` cells and `every`, a bean drawn after it with `enter:"pop-tilt"`.
- Docs: new for vertical.

### S9 Game UI as the state language
- Purpose: converts states into icons readable in a second.
- Seen in: Simon (HP heart, heal item, inventory, buffs, a VS card); Pope (level/HP nameplate, "+1", mission passed); Zeppelin (tier list, patch notes, LVL UP); Church (an evolution box); Border (a wanted-level HUD); Beer, Zombie, Fanta (kill-feed or chat banners).
- Observed: one game element per story state; the next state replaces it.
- Composition and order: state change -> matching game element -> hold 1-2 s.
- Timing: VS slams in 3 f, boss rises in 4 f, labels in 3-4 f (Simon) [strip].
- Transfer: "exercise: +sleep, +mood"; "the reform: +trade, +stability".
- Engine: SUPPORTED. `hud` kinds (`hearts`, `score`, `meter`, `counter`, `chip`), `doc` kinds (`versus`, `mission`, `killfeed`, `upgrade`, `dialog`, `menu`). Use original designs (section 16).
- Docs: extends toolkits/07_game_ui.md.

### S10 Hard end within 0.35 s of the last word
- Purpose: the hard stop and a question-like last beat make the replay immediate.
- Seen in: Bunkers (0.34 s), Border (0.27 s), Suiyang (0.32 s), USA (0.35 s); none of the 12 shorts has an outro card except Zeppelin's subscribe bar.
- Observed: no end screen; the last frame is the last story beat (open problem, tease, twist, wonder, loop, ironic button).
- Composition and order: last line -> last image -> cut to end.
- Timing: 0.27-0.35 s [decode + strip].
- Transfer: any short.
- Engine: SUPPORTED. Last shot `dur` = remaining VO + 0.3 s.
- Docs: new.

### S11 Group chat as the twist
- Purpose: a modern, natively vertical UI for a conspiracy reveal.
- Seen in: Pope 1:09.3-1:16.6 (single source).
- Observed: a phone chat; messages appear one at a time; a meme image; cut to the villain pose.
- Composition and order: chat header -> message 1 -> message 2 -> image -> cut.
- Timing: the chat holds 7.3 s [decode].
- Transfer: "the founders had planned it in a group chat"; "the heist crew".
- Engine: SUPPORTED. `doc kind:"chat"` with `title` and `messages: [{from, text, at, side, who | color}]` (a 0.6 s typing bubble before each message, 6-frame pops, older messages scroll up); put it in a `panel` `frame:"phone"` or on its own in a vertical film.
- Docs: new.

## 16. Not to copy

Recorded by function only. The transferable technique (if any) is already in the entries above with an
original design; what is listed here must not be reproduced as drawn in the reference.

### 16.1 Third-party IP parodies (copy the device, never the design, name, logo or wording)
| Function in the reference | Where | Use instead |
|---|---|---|
| A monster-evolution screen ("What? X is evolving!") | China 7:00-7:10; Church 1:04-1:08.8 | C4 with an original dialog box and wording |
| A voxel/block-game world and HUD | China 16:54; Rome 4:14-4:22 (also a sword at 5:32) | a generic pixel set via a pixel grade |
| A platformer, a zombie shooter, a card-game reverse card, a saber duel, a sci-fi senate | China 28:08, 11:38, 14:34, 14:04, 27:30; Reconquista 18:16; Rome 16:04-16:12 | generic game frames (`mission`, `menu`, `versus`) |
| A famous sci-fi film scene recreated (armoured trooper, hologram order, hooded ruler, quoted lines) | French 0:00-0:12 | H9 with invented characters and paraphrase |
| Monster-collection creatures, a capture ball, a dex-like device | Rome 8:28-8:40, 34:04; China 16:14 | P8 with an original device |
| Game death screens, kill feeds and chat banners copied verbatim | Beer 0:43.5-0:46; Zombie 0:44.5; Fanta 0:28.6 | D13 with original wording |
| A crime-game HUD and logo | Border 1:01.8-1:07.5 | a generic HUD (`counter`, `chip`) |
| Named game characters in a tier list; a game urban legend in patch notes | Zeppelin 0:07.1-0:10, 0:19.7 | invented entries |
| A known game's knight designs; a mech, a gauntlet, a cartoon undersea backdrop, a "meanwhile" card style, a conspiracy-wall meme, a "joins the battle" fighter card style | French 0:17.8-0:25; WW1 21:26, 16:54, 28:08, 10:06, 24:40, 25:56, 25:18 | original designs; our `joins`/`meanwhile` docs with original lettering; no "to be continued" arrow card copied from a show (WW1 30:52.1) |
| Plumber brothers, anime posters, an anime-style style-break insert, an anime chat image, anime "menacing" glyphs | WW2 0:50, 1:26, 4:36, 16:24, 3:08.4; Pope 1:14-1:17; Church 0:49.5-0:53.1 | original characters; plain `marks` |
| A sketch-show giant foot cut-out; a kaiju; a maze-eating game route; a cartoon cat on a shirt; a drink mascot | Rome 20:52; WW2 17:02, 12:12-12:18, 9:02; China 25:00 | `arm kind:"foot"`, generic creatures, `map` `arrows` |
| Real brands and logos as gags (a cola mascot and truck, an online-store box, a film-studio marquee, a video-platform name and mascot, a political cap slogan) | Fanta 0:10-0:40; Poe 2:00-2:10, 18:06-18:12; Border 0:41, 1:05.5; WW2 18:02, 6:16 | "CENSORED", invented brands |

### 16.2 Real people, photographs and footage
| Function | Where |
|---|---|
| A live-action meme photo of a real politician as a 0.5 s insert | China 0:00.77-0:01.27 |
| Real photo cutouts (a museum mask, a celebrating footballer, a kitten, a photo-textured hand) | China 2:44-2:48, 20:16-20:19; WW1 2:48-2:50; Simon 0:52.5-0:53.6 |
| Archival photographs and newsreel on TVs and in frames | WW2 0:28-0:34, 0:43-0:44, 7:24-7:28; Fact-check 0:00-0:01, 9:08, 14:40-14:44, 18:24-18:34 |
| Parodies of a TV lawyer and real-person-like guests; a possible celebrity likeness | Rome 1:46-1:58, 15:4x; China 16:36 (low confidence) |
| Caricature markers of real 20th-century leaders (moustache, side parting, hair helmets) | WW2 throughout; Fact-check throughout; Fanta 0:11.9-0:17.4 |
| Screen captures of real software, a video-player page with real-looking thumbnails, sponsor web apps | Greek 9:10-9:22; WW1 29:54-30:02, 13:26-14:15 |

Our rule stays: historical or public figures are generic beans with era costume, a `nameplate` and one prop.

### 16.3 Extremist and political symbols shown in the reference
| Function | Where |
|---|---|
| A totalitarian party emblem on red banners behind a speaker, on armbands and on a figure's face | WW2 11:18, 11:50, 13:04-13:12, 15:30-15:36 |
| The same emblem on map fills, flags, a rally banner, a large wall banner and an "idea" icon above a head; in archival film | Fact-check 1:18-1:32, 2:02-2:18, 4:12-4:14, 4:58, 6:44-6:50, 3:08, 18:32 |
| A state communist emblem on a council wall, on curtains and on map floods | WW2 2:50, 5:58, 6:06; Fact-check 9:20-9:26 |
| An armband emblem and a military cross as shorthand for a regime | Fanta 0:01.9-0:03.4, 0:07.5-0:17.5 |

Use colour fields, initials, generic `emblem3d` shapes, plain disc or stripe flags and the `party-tunic`
(07 §5.9). The reference scenes read without the symbols because names, costume colour and map fill do the work.

### 16.4 Violence, cruelty and taste beyond our rules
| Function | Where | Our stand-in |
|---|---|---|
| An on-screen execution with blood spray; shotgun blood; blood under a bulldozer; blood lettering; beatings and a cauldron | Fact-check 2:20-2:22, 5:26-5:28, 10:14, 12:48, 22:00-22:16 | D3, D8, D9, D11 |
| A bloody birth bed, blood-smeared walls, wound slashes, a bloody fight | Greek 4:14-5:00, 8:50, 1:46, 17:16 | D3 occlusion, D14 puffs |
| A dead woman with bloody gloves; coughing blood | Poe 0:12-0:13, 13:16 | D4, D7 |
| An off-frame decapitation with a blood column; a flying head | China 16:54-17:31, 11:28-13:11 | D10 silence after the death |
| Dark-comic devices inside an atrocity section (a chef seating victims, "CRITICAL HIT", pizza after a massacre) | Suiyang 1:07.5-1:14.6, 1:28.9, 1:30.5 | conflicts with 07 §5.4; the skill keeps the stricter rule (see 17.11) |
| An ethnic costume gag for an assassin | Rome 8:32 | none |
| A drug-snorting gag; a sexual-implication bed gag | Rome 11:46; Greek 2:36-3:30 | none |

## 17. Measurements that correct the current docs

These measurements have been applied to the files named in each row (07-story-craft, 01-reference-breakdown, 02-visual-grammar, SKILL.md and the toolkit cards), except 17.11: the skill keeps its stricter rule and does not put gags inside atrocity beats. Rows 17.5, 17.13, 17.15, 17.27 and 17.28 are now engine features (`zip.rev`, `alarm` `period`, `dropShadow`, `swirl`, `whip` `dir`, `mono`, `negative`, `photo` and `circle` frames, `format: "vertical"`); fire takes `step` (17.3).

Method key: **decode** = every frame decoded, cut detector (gray mean-abs-diff, histogram, 3-frame debounce;
flashes, whips and stepped fx inflate counts, dissolves are missed); **strip** = native-fps frame strip;
**shot sheet** / **sheet** = contact sheets. The skill's 07 says its numbers were "measured at 12 fps".

| # | Doc and claim | Measured | Video | Method |
|---|---|---|---|---|
| 17.1 | 01-reference-breakdown.md §2 table: 52 cuts in 0:00-2:00 (mean 2.26 s, median 1.43 s); 67 cuts in 21:40-23:40 (mean 1.76 s, median 0.87 s); line 35 "at the climax the pace speeds up: median 0.87 s" | 0:00-2:00: 20 shots, mean 6.4 s, median 5.2 s (~11 picture changes in minute 0 on the 2 s sheet); 21:40-23:40: 23 shots, mean 5.1 s, median 6.0 s; Teutoburg shots run 1.7-8.8 s. The only accelerating cut run in the film is a comic argument at 4:28.3-4:35.1 (1.6 s down to 0.1 s) | Rome | decode + all 13 shot sheets + 2 s sheets |
| 17.2 | 01 §3 line 42: the bandage "flies in from off-screen" | it pops in above the ruler, who holds it up before applying it (medium) | Rome 18:20-18:24 | strip 30 fps |
| 17.3 | 01 line 111, toolkits/08_fx_and_tone.md lines 115 and 272, 07 §6.4 "Flames: redrawn on twos" | big fires boil slower: a large blaze swaps shapes about every 6 f; a furnace fire on threes with a full redraw every 6 f; a furnace flame boil about every 3 f; a full-frame fire redrawn about every 5 f; an energy clash re-shapes every 1 f for 4+ s. Keep 2 f for torches; allow 3-6 f for big fires and 1 f for energy | Rome 11:35-11:41; Zombie 1:09-1:13.4; Fact-check 21:14; WW1 8:45.67-8:46.73; Poe 3:49 | shot sheet; strip + frame-diff cycle; strip 15 fps; strip 30 fps; strip 30 fps |
| 17.4 | toolkits/03_props_creatures_vehicles.md line 425: jump scare with "camera shake"; toolkits/08 line 329: "hard cut in, flash-cut out" | the scare is dead still for 4.2 s with no shake and exits through a fade to white (6 f), a 5 f white hold and a 20 f fade-up | Poe 13:03.2-13:07.7 | strip 30 fps |
| 17.5 | toolkits/02_acting.md lines 136 and 187, 07 §6.3: zip = "lean 4 f, gone on f5" | before the zip: ~2 s panic hold, a 15 f crouch-turn anticipation and ~10 f of spinning leg wheels while the body stays put. The engine now has `zip.rev` (NEW IN THIS PASS); the docs do not mention it | China 14:55.5-14:59.5 | strip 30 fps |
| 17.6 | 07 §2.1 table and rule "mean shot 4-6 s" | Dynasty survey stated 4.9-6.5 s, measured mean 6.72 / median 5.92; Fact-check stated 3.5-5.4 s, measured 6.36 / 5.04; Reconquista stated "5.7-7.5 s (median 4-5)", measured 8.23 / 7.1 (4.5 s median only in the 1086-1492 climax); World wars stated 3.0-5.5 s, WW1 measured 6.3 / 4.83 (disc-3 map section median 7.17 s), WW2 4.72 / 3.43. Five of eight long videos have a mean above 6 s | China, Fact-check, Reconquista, WW1, WW2, Poe (6.85) | decode |
| 17.7 | 07 §1.2: "10 min: 120-160 shots" | detected shots per 10 min: Reconquista 73, Poe 87, China 89, Fact-check 94, WW1 95, Rome 116, WW2 127 (incl. sponsor), Greek 157. Five of eight are below 100 | all 8 long | decode |
| 17.8 | SKILL.md rule 4 "a new image every 1.5-3.5 s"; 02-visual-grammar.md pacing rule 1 "a shot lasts 1.5-4 s"; 07 §1.1 step 3 and §9 rule 1 | medians are 3.0-7.1 s; the 1.5-3.5 s figure holds for picture events (cuts plus in-shot pops), not for shots. Rome's Empire half: median 5.92 s with 10-27 s holds and pop-ins every 1.5-3 s | all 8 long; Rome halves 3.51 s vs 5.92 s | decode + sheets |
| 17.9 | 07 §2.3 "No frame is frozen for more than ~1 s" | fully static frames are 21-46 % of long videos; strips show characters completely frozen 0.9-2.5 s between snaps, a 58 f fully static dinner shot and a 33 f static held mallet. Shorts match the rule (2-19 % static) | China (46 %), Fact-check, all long; shorts | decode + strips |
| 17.10 | 07 §2.3 "Speed up toward the climax: cut every 1.0-1.6 s" | holds only for action fights (Greek fight shots 0.4-1.5 s). Dramatic climaxes intensify through content: Rome Teutoburg 1.7-8.8 s shots with black beats and creeps; Reconquista climax median 4.5 s (about double the body's cut rate, not 1-1.6 s) | Greek, Rome, Reconquista | decode + shot sheets |
| 17.11 | 07 §5.4 "no gags in atrocity beats ... comic relief returns 30-60 s later at the earliest" | a famine-atrocity short keeps dark-comic devices inside the section (a victim's "Oh hell no!" at 0:07, a chef queue 1:07.5-1:14.6, "CRITICAL HIT" 1:28.9, pizza boxes 1:30.5) aimed at the system, never at victims; the act itself is a held silent beat. Observation only; the skill keeps its rule | Suiyang | strips + sheets |
| 17.12 | 07 §3.1 "Every hook ends on a series or title card within 15-45 s" | none of the 12 shorts has a title card, channel ident or chapter card; the first sentence is the claim and an event lands within 2 s | all 12 shorts | sheets 0.5 s + strips |
| 17.13 | toolkits/08_fx_and_tone.md lines 132 and 281: `alarm` default 5 on / 3 off frames | an authority alarm strobes ~30 f on / ~24 f off (period ~1.8 s) and continues across cuts. The engine supports it (`period` 54, `on` 30); document it as the slow preset | Fact-check 19:16.2-19:25.5 | strip 10 + 15 fps + shot sheet |
| 17.14 | toolkits/04_places.md line 301: time-lapse "1.6 s per full day" (constant `dayDur`) | the reference accelerates: first day ~4.5 s, first night ~0.8 s, then ~1.0-1.2 s per day from a new angle; a map version uses hard cuts of ~0.7 s lit / 0.3 s dark | Reconquista 10:34-10:46; Rome 37:48.7-38:00.7 | strips 30 + 5 fps; shot sheet |
| 17.15 | toolkits/02_acting.md `drop`/`drop-squash` rows: no ground shadow | a shadow grows on the empty spot for ~10 f (WW2) or ~6 f (Fact-check) before the object lands. The engine has `dropShadow` (NEW IN THIS PASS); the docs do not | WW2 0:52.7; Fact-check 4:42.93 | strips 30 fps |
| 17.16 | 07 §6.5 "Smash: 12 f windup hold, 1 f smash" | the mallet is held 33 f, falls in 2 f, impact ticks on contact, 17-25 f hold; punches arrive in 1-2 f with no wind-up at all | Fact-check 17:24.5; China 16:42.5; WW1 26:32 | strips |
| 17.17 | 07 recipe #74 "empty sea 5 s" | the empty sea after the fall holds ~10 s (20:30.7-20:40.57) and becomes the deadpan "Nevermind" joke | Greek | strip 15 fps + shot sheet |
| 17.18 | 07 §6.7 `black-beat` 12 f; §2.3 "1-3 s of black before a solemn title" | measured black lengths by job: 16 f impact, 27 f chapter, 1.3 s sarcasm pause, 3 s after a death, 7.3 s before entering a dread location | Rome 22:54; WW1 4:46.6; WW2 13:32.5; China 10:28; Greek 15:53.8 | strips + shot sheets |
| 17.19 | toolkits/07_game_ui.md `joins`: "2 white f, name 4 f, hold ~1.5 s" | 5 white frames, the name slab fades in over 2 f, hold 38 f (~1.27 s) | WW1 25:19.07 | strip 30 fps |
| 17.20 | toolkits/07_game_ui.md `carousel`: cards slide over 8 f with a bounce | cards snap in 1 f, a 3 f chevron flash, a 2 f red select flash | WW1 4:09.07 | strip 30 fps |
| 17.21 | toolkits/04_places.md `blueprint` sketches are additive | the board replaces whole drawings per beat in place (~12 scenes in a 70 s "shot") | WW1 2:40-3:50 | sheets 2 s + strips |
| 17.22 | 07 §4 "Deflation: hard cut to a warm burst" | the shorts deflate on a blue swirl backdrop (a deadpan poster, a sweating worker, a rising king) | Zeppelin 0:51.5; Beer 0:20.5; French 1:06.7 | sheets 0.5 s + strip |
| 17.23 | 07 §2.2 "Quote on a screen 5-15 s" | TV quote holds run 19.5 s and 21.5 s while the karaoke subtitle fills | Fact-check 1:38.7, 14:56.1 | decode + strip |
| 17.24 | 06-reference-library.md row for the Greek myth: "60 drama / 40 comic"; row for the fact-check show: "stamps" as verdicts | by screen time about 75 drama / 25 comic (medium confidence); verdicts are mostly doors, stamps mark cancelled facts | Greek; Fact-check | sheets + transcript |
| 17.25 | 07 §6.2 "Characters at the cut: 0 f, already there" (as the general rule) | entrances into held shots are often eased slides of a rigid cutout (~30 f in, 1.2-1.6 s out) | Rome 0:19.6-0:23.0, 13:05, 32:28 | strips |
| 17.26 | 07 §6.1 pose snaps 1-2 f "then hold" as the only acting mode | realisation beats are slow burns: eyes widen over ~4 s while the pose holds (sheet only, medium) | China 15:14-15:26 | sheet 2 s |
| 17.27 | 07 §6.7 / toolkits/09 transition list | the shorts' signature jump is an 8-12 f swirl locked on a shared centre (10 of 12 shorts) and a vertical whip; both exist in the engine (`swirl`, `whip` `dir`, NEW IN THIS PASS) but are undocumented. Grades `mono` and `negative`, panel frames `photo` and `circle`, and `format:"vertical"` / `shot.frame` / `shot.pinned` are also undocumented | 10 shorts; Border 1:30.4; Reconquista 20:34 | strips |
| 17.28 | 07 §6.1 "Talk: new mouth every 3 f, head bob ±1.6°" | mouths change every 2-4 f with about 3 open shapes, but the talking head is fully held (no bob) in two of three measured talkers; the Rome listener-speaker pair shows a small bob | WW1 19:08.5-19:11.0; Greek 12:30; Rome 36:08 | strip 30 fps (WW1 with a zoomed face crop) |
| 17.29 | toolkits/09 `fg` `eye-pov` blink (closes via a 2 f slit); toolkits/03 `door` `open` default 0.4 s | the viewer-POV blink closes in 1 f (closed 3 f, re-opens over 2 f); the door swings open in 3 f | WW1 0:24.07-0:24.57, 0:01.13-0:01.20 | strip 30 fps |
| 17.30 | SHORTS_A/B/C notes: "no portrait canvas", "keepInFrame uses 1920-px margins", "no grayscale grade", "no polaroid frame", "no swirl", "whip horizontal only" | all resolved in the engine (see the NEW IN THIS PASS list); the entries above use the new fields | notes vs engine_vocab.txt | code check |

## 18. Coverage

Per-video coverage (frames decoded, contact sheets, shot sheets, frame strips, transcripts, sponsor and third-party spans) is in [06-reference-library.md](06-reference-library.md#coverage). Every contact sheet, shot sheet and strip listed there was opened; timings tagged [sheet 2 s] or [sheet 0.5 s] were seen only at that sampling.
