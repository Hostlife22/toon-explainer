# 06 · Reference library: twenty studied videos

The engine's style grammar comes from twenty videos by the same history/myth explainer channel: eight long films (19–38 min) and twelve vertical shorts (40–95 s). This guide records what was studied, how completely, what each video teaches, and where the reference does things this skill deliberately does not. The techniques themselves are catalogued by purpose in [10-technique-library.md](10-technique-library.md); the planning method built from them is [09-directing.md](09-directing.md); the 9:16 format is [11-vertical-shorts.md](11-vertical-shorts.md); the engine features are in the toolkit cards ([08-toolkits.md](08-toolkits.md)).

No frames, audio or characters from these videos are included in the repository; only techniques and measurements.

## How the videos were studied

Three passes. The first two (2026-10-14/15) covered the eight long films only: contact sheets every 4–5 s and then every 1 s, more than 300 motion strips, transcripts; they produced the toolkit cards and [07-story-craft.md](07-story-craft.md). The third pass (2026-10-15) covered all twenty and kept three kinds of evidence apart:

1. **Technical decode of every frame.** Each video was decoded in full at its native 30 fps (403,452 frames: 376,855 long, 26,597 shorts) to detect cuts and measure shot lengths and the share of still frames. Cut = a grey-frame difference spike above 14 that is 3× the local median, confirmed by a histogram change, with a 3-frame debounce. The detector misses dissolves and counts flashes, whips, swirls and stepped fire as cuts; every analyst checked the suspicious detections with frame strips (examples: one short's "45 cuts" were a furnace fire animated on threes; about 30 of Rome's minute-11 "cuts" are one boiling fire).
2. **Visual review of contact sheets.** Every video was viewed end to end on timestamped sheets: one frame every 2 s for long films (213 sheets), every 0.5 s for shorts (49 sheets), plus one middle frame of every detected shot (77 shot sheets). Sub-2-s events outside the strips may still be missed.
3. **Frame-by-frame study.** 274 strips at native 30 fps (a few at 10–15 fps for slow scenes) of fast actions, transitions, transformations, gags, entrances, cycles and lip-sync: 171 for the long films, 103 for the shorts. Frame counts in the docs come from these strips unless marked otherwise.

Transcripts: the supplied captions for the long films; Whisper (`small.en`, word timestamps) for the shorts, with recognition errors noted where they mattered. Eleven analyst agents (one per long film, three for four shorts each) wrote structured notes with confidence levels; gaps left by image-loading failures were closed in follow-up passes until every sheet and strip had been opened.

### Coverage

| Video | Length | Frames decoded | Contact sheets | Shot sheets | Strips viewed | Sponsor / third-party material (excluded from style findings) |
|---|---|---|---|---|---|---|
| The ENTIRE History of Rome | 38:29 | 69,275 | 39/39 | 13/13 | 17/17 | Sponsor 16:47–17:52; end screen with sponsor footage from 38:18; real-person parodies and game IP gags |
| The ENTIRE History of China | 32:02 | 57,655 | 32/32 | 8/8 | 14/14 | No sponsor. 0.5 s live-action meme 0:00.8; museum photo ~2:46; footballer photo meme ~20:16; game/franchise parodies (evolution screen, voxel world, platformer) |
| The Longest War Ever | 24:08 | 43,433 | 25/25 | 5/5 | 19/19 | Sponsor 5:00–5:36. The supplied transcript has an unrelated transcript appended after its line 478 |
| World War 1 Explained | 31:11 | 56,128 | 32/32 | 9/9 | 17/17 | Sponsor 13:26–14:15 |
| How WW2 Began | 18:57 | 34,105 | 19/19 | 7/7 | 19/19 | Sponsor 3:08–4:37 with game footage; archival photograph 0:28–0:44 and 7:24–7:28; members card; pop-culture cameos |
| Fact-Checking (speech fact-check) | 23:19 | 41,983 | 24/24 | 7/7 | 32/32 | Sponsor 7:37–8:36 and 22:57–23:19; archival film on the TV at 0:00, 9:08, 14:40, 18:24–18:34 |
| My Favorite Greek Myths | 21:38 | 38,929 | 22/22 | 10/10 | 22/22 | Sponsor 7:22–8:33 with game footage; members card 1:50; a real editing-software capture 9:10–9:22 |
| The God of Horror | 19:38 | 35,347 | 20/20 | 5/5 | 31/31 | No sponsor; patron credits 19:24–19:38; brand names drawn into props |
| 4 shorts, group A (Fanta, Pope, war cat, Church) | 40–80 s | 7,505 | 13/13 | 4/4 | 36/36 | None; brand and game parodies noted |
| 4 shorts, group B (bunkers, BE/NL border, Suiyang, US borders) | 48–95 s | 9,909 | 18/18 | 4/4 | 24/24 | None; an "up next" card, a parody game HUD |
| 4 shorts, group C (Zeppelin, beer flood, zombie child, "Order 66") | 68–85 s | 9,183 | 18/18 | 5/5 | 43/43 | None; one short is built on a film-scene parody, others use game cards |

**Source limits.** The long films are 640×320 (Rome 854×428) and the shorts 360×640, compressed. Claims about line weight, paper grain, small textures and mouth shapes below 2–3 px are marked medium or low confidence in the notes and are not used as hard rules here; enlarging a frame was never treated as recovering detail. Lip-sync could be counted only in a few close-ups (WW1: about 3 open mouth shapes swapping every 2–4 frames with the head still). Audio was not analysed beyond the transcripts.

**Where the skill deliberately differs from the reference.** Several videos draw extremist symbols on flags, banners and maps, caricature real people, show executions with blood, and parody games, films and brands. The skill keeps generic emblems, generic beans with a name card, implied violence and original designs; those choices are not gaps. One short keeps dark-comic euphemism inside an atrocity section; the skill does not deflate atrocity beats.

## The eight long films

| Video | Length | Topic shape | Tone mix | Signature devices |
| --- | --- | --- | --- | --- |
| The ENTIRE History of Rome | 38:29 | Long chronology, one civilization | 70% comic / 30% serious | Bean characters in 3/4, foreground framing, parchment maps with extruded territories, hold-and-snap posing, punch zooms |
| The ENTIRE History of China | 32:02 | 4,000 years, "fell apart and glued back 7 times" | 70 / 30 | Living map territories with faces and weapon arms, region-eats-region floods, persistent dynasty HUD card, hanging counter sign, pagodas and karst mist |
| The Longest War Ever (Reconquista) | 24:08 | 781-year war | 70 / 30 | Timeline HUD with spans, wooden year signpost with strike-and-replace, day/night time-lapse, ships and army blobs on maps, pencil drawing a border, game-UI parodies |
| World War 1 Explained | 31:11 | Causes → fronts → armistice | 70 / 30 | Trenches and no-man's-land, sepia-khaki grade, gas cloud, tank roll-in, muzzle-flash volleys, blueprint plan board, crosses filling a region, mission title cards |
| How WW2 Began | 18:57 | Three countries' road to war | 80 / 20 | Museum-gallery frame story, countryball (flag) heads, interwar suits and offices, document checklists, hand-drawn charts, annexation maps, train travel montage |
| Fact-Checking Hitler | 23:19 | Speeches checked against facts | 60 deadpan / 25 grim / 15 slapstick | Office "fact-check show", oval retro TV quote player, karaoke subtitles with red-flagged words, verdict doors (stamps mark cancelled facts), dropped statistic blocks, CCTV alarm |
| My Favorite Greek Myths (Minotaur) | 21:38 | One myth as a drama | about 75 drama / 25 comic by screen time (earlier estimate 60 / 40) | Sepia engraving backstory, divine glow, flame forming a shape, red eyes in the dark, one-point labyrinth corridor, wings and the far fall, ID card |
| The God of Horror (Poe) | 19:38 | Biography as horror | 55 gothic / 30 comic / 15 scares | Death figure lurking in normal scenes, glitch bursts, mono-red grade, jump-scare hard cut, wall shadow with eyes, ink-blot and peephole transitions, eyelids POV |

## The twelve vertical shorts

| Short | Length | Topic shape | Signature devices |
| --- | --- | --- | --- |
| Fanta origin | 40 s | brand-origin trivia | a whole room re-costumed on one word; a vertical comic page built in reading order with a figure breaking out of a panel; the past turned into a photograph at the end |
| Pope in 55 years | 80 s | a career as a progression | persistent years-and-rank HUD whose rank colour follows the costume; push-wipe carousel of concept cards; a region as one game tile; a chat reveal; the last shot mirrors the first |
| The war cat | 57 s | an animal hero's biography | an arrow marking the hero on frame 1; game-state storytelling (heal item, inventory, versus card); a held grey photograph ending |
| Church and torture | 73 s | an institution's double standard | "+1" stickers on each listed word; the same balcony relit sinister on one word; a foreground rise wipe from the bottom edge; a pendulum gag that uses the frame height |
| 500K bunkers | 48 s | one country's quirk | a quiz to "you" with an answer board; an avalanche of objects on the quantity word; an open "REMOVE? $$$$" ending |
| Belgium / Netherlands border | 93 s | a geography oddity | a false absolute corrected within 3 s; a map face throwing its army along an arc; nations as top/bottom faces; an outbound tease |
| Siege of Suiyang | 95 s | an atrocity, told by implication | numbered placards, icons and red silhouettes with in-colour foreground witnesses; the cut rate drops from 15 to 4 per minute; an ironic pull-back ending |
| Weird US borders | 95 s | a list of oddities | a round locator badge on cropped maps; the border direction becomes the frame split, with a straight line morphing to a zigzag; numbered steps on a car route; a lyrical ending |
| The Zeppelin | 68 s | a weapon's effect | altitude = frame height; a personified abstraction with a falling meter; a pixelated explosion wipe; freeze → grey → photo + subscribe bar |
| The London beer flood | 85 s | a disaster | the climax in the first second, then a newspaper "this really happened"; a tilt-up along a 7 m vat; a flood from the bottom; a seamless loop |
| The "zombie child" ruler | 81 s | a bizarre ruler | the whole shot shrinks into a phone; a costume toggling 8 times in 0.6 s; a claw crane placing a ruler on the map; a "Part II" sting |
| The French "Order 66" | 71 s | a pop-culture premise for a real event | a matched dissolve between two eras in the same pose; piles rising to the chin; a fire burn-away reveal; an ironic button |

What shorts share and how they differ from the long films is in [11-vertical-shorts.md](11-vertical-shorts.md) §2.

## Constants across the long films

These hold in every video and are the engine's defaults:

- **Shot length** 1.5–4 s for comic inserts and 4–9 s for dread (median shots 3.0–7.1 s per film); comic arguments and fights speed up at their climax, serious climaxes get heavier through content and holds.
- **Camera drift on every hold:** zoom 1.00 → 1.03–1.06 over the shot. Punch zooms land on key words.
- **Three planes:** a foreground framing element, characters in 3/4 view, and a rich background.
- **Hold-and-snap:** poses swap in 0–1 frames, then hold. Talking mouths cycle 2–3 shapes every 2–4 frames.
- **Maps carry about a third of screen time** in history videos. They are never static: regions grow, flood, crack, burn, recolor, or sprout faces.
- **Lettering** is a white bold sans with a thick dark outline. A small colored tag sits above the name, and an arrow points at the subject.
- **Comedy deflates scares and comic deaths within 2–6 s, ordinary deaths within 5–15 s after a 3–4 s neutral hold.** Use a hard cut to warm color, a deadpan face, a sign gag or a fourth-wall aside. Atrocity beats are held instead (silent, cold grade, no gags). The Suiyang short slows its cutting there from 15 to 4 per minute but keeps some dark-comic euphemism; the skill copies the slowdown, not the jokes.
- **Violence is implied, never shown:** use blood pools, X-eyes, crosses filling a region, tombstones, a dropped statistic block, or a grade shift with a silent hold.

## Topic → toolkit matrix

| Film type | Backgrounds | Characters | Graphics | Tone tools |
| --- | --- | --- | --- | --- |
| Ancient / classical history | sky + hills, forest, city, interior, minoan, olympus, parchment | togas, laurels, crested helmets, crowns, legionaries, horses | parchment map, date, era tag, label | warm or gold grades, sunset |
| Medieval / long war | mountains, battlefield, castle props, desert, sea with ships | great helm, nasal helm, turban, surcoat, horses, camels | timeline HUD, year sign, army blobs, ships on map | sepia-gold, aftermath haze |
| East Asian history | eastcity, karst, paddy, throne interior | straw cone hat, official cap, hanfu, lamellar | living territories, conquer floods, hanging counter, dynasty card, Great Wall strip | mist grey for endings |
| World War I | trench, trench section, battlefield, graveyard, blueprint | brodie, pickelhaube, adrian, kepi, gas mask, tunic + puttees | atlas map with fronts, mission cards, crosses fill, stat card | sepia-khaki, night blue, gas green |
| Interwar / World War II | office, street1920, factory, beerhall, hospital, gallery, train | suits and ties, officer caps, dome helmets, countryball heads | newspaper, document checklist, chart, annexation map, fronts, tokens | grey depression, sinister purple |
| Fact-check / myth vs truth | office, gallery, void | host in a suit, interviewees | tv quote player, karaoke subtitles with flagged words, stamps, checklists, verdict doors, stat blocks | deadpan pacing, CCTV alarm |
| Mythology | sea presets, corridor, olympus, minoan, mountains, sepia backstory | gods with glow, creatures (bull, raven), hybrids, wings | ID card, poster, scroll | divine glow, red eyes in the dark |
| Horror / biography of a dark figure | void (flesh, spotlight stage, boil), office or study with candle, graveyard, rain window | reaper lurking, raven, skeletons, madness face | handwritten letters, book covers | mono-red, heavy vignette, glitch, jump scare, ink-blot transition |
| Science / psychology essay (target channel) | office, lab interior, void stages, gallery, blueprint | modern clothing, scientist look | chart, document, stat block, tv quotes, subtitles | serious or cold grade, spotlight, slow push |

## Narrative devices worth reusing on any topic

- **Frame story:** a host with a fixed set (office, museum, game console, storyteller den) that each section returns to. It gives the film structure and an easy place for asides.
- **Recurring counter:** a hanging sign or HUD card counts a repeated event ("times the empire fell apart: 4"). Swap the digit with a crossed-out old number.
- **Persistent HUD:** a dynasty or era card plus a date that stays on screen across shots and changes on each era switch.
- **Fact-check loop:** play the claim (tv + subtitles), flag the false words red, show the reality cutaway, stamp a verdict.
- **Time compression:** timeline spans, a year sign that strikes and replaces, a day/night time-lapse, or a pencil redrawing borders.
- **Personified places:** territories with faces and arms, and countryball heads. Nations act out their politics.
- **Lurker:** a threat figure fades in behind unaware characters over 2–3 s and appears in several shots before it acts.
- **Sepia backstory:** an engraving-style flashback that dissolves into the color present.

## Handling dark material

All eight videos cover wars, executions, genocide, plague or death, and they handle it the same way. The engine follows the same rules:

1. Stand-ins instead of depiction: blood pool, X-eyes, tombstone, crosses filling a region, a statistic block.
2. Shift the grade (`solemn`, `cold`, `mono-red`) and hold silently for 3–4 s. No gags inside the hold.
3. State the facts plainly in narration and text.
4. Do not recreate extremist symbols. Use generic party flags, armbands with a plain disc, and generic emblems.
5. Never imitate a real person's likeness or a real channel's characters. Use generic construction rules.
