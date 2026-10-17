# 01 · Reference Breakdown: "The ENTIRE History of ROME" (Historically channel)

Source: a locally supplied copy of the video and its transcript, 38:29, 854×428 @ 30 fps.
Analyzed on 2026-10-14 with `scripts/analyze_ref.py` (cuts and pacing) and frame strips at 2–15 fps.

## 1. How it's made (technique)

This is **cutout / puppet animation** in the vein of Toon Boom Harmony or After Effects, not frame-by-frame drawing:

| Layer | How it's built | What we replicate in code |
|---|---|---|
| Background | A painted "storybook" image: gradient sky (sunset, day), stylized comma-shaped clouds, hills with dark outlines, grass drawn as strokes | `bg: sky / interior / parchment / burst` or an AI-generated `bg.image` |
| Characters | "Bean" heads: white face, dot eyes, simple mouth, thick dark-brown outline, short robe-like body, sausage arms | `bean` rig (code) or AI-generated `image` cutouts |
| Character motion | Pose-to-pose keys (the first pass read 4–6 frames; the frame-strip passes measured snaps of 0–2 frames plus a short settle, which is the engine default `poseBlend` 0.07 s), blinking, a mouth that flaps during dialogue, breathing, shaking from fear or anger | `pose: [{at,v}]`, `talk`, `shake`, `jump`, auto blink and breathing |
| Camera | Almost always a slow push-in or drift (Ken Burns) of 2–6%; sharp "punch-zooms" on emotional words | `camera.zoom`, `camera.pan`, `camera.punch` |
| Lettering | Bold rounded sans-serif, white fill, thick black outline, drop shadow; a small colored tag above the name ("KING" in yellow above "NUMITOR"), a thick white arrow pointing at the character | `label` (tag + arrow), `date`, `era`, `title` |
| Infographics | Parchment map, territory fills in red, a character stands on the map; era badge in the lower left ("ROMAN KINGDOM" in red and white); speedrun timer | `map`, `era`, `timer` |
| Effects | Light rays, anime speed lines, sweat drops, an ink splat with text ("K.O."), flash to white | `fx: rays / speedlines / sweat / splat / flash` |
| Transitions | 80% hard cuts; the rest are a fast push-in into white, a dissolve, or a swipe | `transition: cut / zoom-punch / fade-white / dissolve / whip` |

## 2. Pacing measurements (`analyze_ref.py`)

| Window | Cuts per 2 min | Mean shot | Median | Motionless frames* |
|---|---|---|---|---|
| 0:00–2:00 (comedic opening) | 52 | 2.26 s | 1.43 s | 22% |
| 16:40–18:40 (calm section) | 34 | 3.43 s | 2.0 s | 41% |
| 21:40–23:40 (Teutoburg, serious scene) | 67 | 1.76 s | 0.87 s | 15% |

\* "Motionless" means the frame-to-frame difference is < 0.5 (camera drift only). Another ~45% of frames show a small difference: a character moves a body part, or text pops in.

**Re-measurement (2026-10-15).** A second decode of every frame (grey-frame difference spike plus a histogram check, 3-frame debounce) does not reproduce these counts: it finds 20 shots (median 5.2 s) in 0:00–2:00 and 23 shots (median 6.0 s) in 21:40–23:40, and the 2-second contact sheets show about 11 picture changes in minute 0. The first analyzer most likely counted fire boil, flashes and pop-ins as cuts. Read the table above as "visual events", not edits, and take the whole-video numbers from [07-story-craft §2.1](07-story-craft.md) (445 cuts, median 4.6 s; comic first half 3.5 s, serious second half 5.9 s). The Teutoburg climax does **not** cut faster (its shots run 1.7–8.8 s); it intensifies through content: black beats, creeping threats, rain and a grade change.

Takeaways for the engine:
- **Not a single fully static shot.** Even an "empty" frame drifts the camera (zoom 1.00→1.04–1.06 per shot). That's why the engine's default camera is `zoom [1, 1.04]`.
- **A new image every 1.5–3.5 s.** This matches the pace in MASTER_PROMPT (15–18 images per minute). Split shots longer than 5 s into 2–3 internal beats: a pose change, a pop-in caption, a punch-zoom.
- Clusters of "cuts" 0.23 s apart aren't cuts but a fast push-in with a white flash (frames 0:12.0–0:13.2) or a burst of flash frames. In the engine this is `zoom-punch`.
- At the climax (the forest ambush) the first pass reported a 0.87 s median; the re-measurement above does not support it. Escalate a serious climax through content and holds; reserve sub-second cutting for comic arguments and fights.

## 3. Technique timings (examples)

- **0:05–0:12** Map of Europe with a character sitting on it. An "ALBA LONGA" flag pops in with overshoot (~0.3 s), the era badge switches from "ROMAN KINGDOM" to "ROME", the camera slowly pushes in, ending in a fast push-in to white.
- **0:13.5–0:22** Empty balcony at sunset, rays, then the date "771 BC" pops in. Cut: the king on the balcony; after 1 s the "KING / NUMITOR" caption and arrow appear. His brother slides in from the edge of the frame.
- **1:07–1:10** Rapid sequence: emblem title card, close-up, "K.O." splat, then a celebration scene with silhouettes.
- **18:20–18:27** The empire map is filled red, a character on the map. A bandage pops in above the emperor, who holds it up and "patches" the map (the first pass read it as flying in from off-screen; medium confidence). Cut to a statue.

## 4. Color and line

- Outline is dark brown, not black (`#2a1c15`), thickness ≈ 1.2% of character height.
- Skin is warm white (`#f6f2ea`) with a single cool-gray shadow on one side (`#d8d0c4`); cel-shaded, no gradients on characters.
- Gradients are allowed only in the sky and in glows.
- Clothing is saturated: red `#c8323a`, gold `#f2c230`, olive `#8a8b4a`, purple, light blue.
- Sky: pink-orange sunsets `#b84a63 → #fde3a0`, daytime `#4f9fe0 → #eef8fb`. Reactions need a teal speckled "burst" background.
- Light grain and a warm vignette at the edges.

These rules describe the **classic** look (the engine default). A second pass over the later films of the channel (The Longest War, Rome, WW1, China, Greek Myths) shows a richer finish, which the engine reproduces as the **painted** look (`style.look: "painted"`, [03 Painted look](03-spec-reference.md#painted-look-stylelook)):
- **Shading.** 2–3 tones per colour: a cel shadow band on the side away from a single key light, a darker core on the far edge, and a soft airbrushed falloff toward the edges (horses, robes, helmets). Faces stay almost pure white.
- **Rim and ink.** A thin warm rim light on the lit edge of saturated shapes; the ink is heavier on the shadow side and lighter on the lit side.
- **Contact.** Soft dark occlusion under feet, barrels and carts, and under the chin on the torso; dark bands where walls meet the floor.
- **Texture.** Grass strokes on fields and hills, wood grain on planks and floors, cobbles, plaster mottling on walls, paper tooth over the whole frame.
- **Depth.** Painted skies (deeper zenith, sun bloom, haze at the horizon, clouds with a warm lit cap and a darker underside); far layers fade toward the sky colour (atmospheric perspective); sets sit a step darker than the actors, with the side away from the light falling into a cool shade.
- **Grades.** Warm low-sun and violet dusk grades, grey overcast days.

## 5. How we deliberately differ from the reference

The target channel (MASTER_PROMPT) has a cold, investigative tone. So we take the visual grammar one-to-one but shift the tone through palette and FX:
- presets `dusk`, `night`, `storm`, `teal` instead of a perpetual sunset;
- `fx: spotlight` for "interrogation room" darkness;
- fewer clownish `splat` and `confetti` effects.
See the "Tone" section in `02-visual-grammar.md`.

## 6. Full breakdown of the entire video (0:00–38:29, 4 parallel analyses, 2026-10-14)

Method: contact sheets of the whole video (one frame every 4 s, about 580 frames), 80+ motion strips at 10–15 and 30 fps, about 80 full-size background frames. Below are the findings the engine implements.

### Character
- The head takes up 45–50% of total height. Egg-shaped: wider at the cheekbones, tapering to the chin. The body is a tilted "bell" with stubby legs, about 2.2 heads tall overall.
- **3/4 view in 60–70% of frames.** Features shift toward the gaze direction; the back third of the head sits in a large cool-gray shadow `#c4c1cd`. There are also front, side, back, and extreme close-up shots (face filling half the frame).
- Arms are bendable tapering tubes, **not straight lines**. Hands are white gloves with 3–4 fingers: fist, point, open palm, thumbs-up, grip.
- Face:
  - eyes are dots or vertical ovals without whites;
  - thick eyebrows carry the emotion;
  - a "D" mouth with a pink tongue `#e8828a` and a strip of upper teeth, a snarl with a grid of teeth, a wavy mouth when crying.
- Extras: X eyes (death), "> <" (strain), streams of tears, sweat drops, an anger vein.
- Hair is a single solid mass with a light highlight streak; in 3/4 view it covers the back of the head. Beard is a mass below the eyes.
- Legionary:
  - gray segmented armor, red pleated skirt;
  - helmet with a brush crest and cheek guards;
  - large red shield with yellow "wings", short sword.

### Character animation
- **Limited animation, hold-and-snap.** A pose holds for 0.4–4 s and changes **within 0–1 frames**, followed by a short settle (~4%, 3–4 frames). Smooth transitions between poses are rare (1:17, 12:41, 24:12, 31:36).
- Speech: 2–3 mouth shapes, each held for 2–4 frames (≈8–12 changes per second). The head bobs 1–3°; the jaw doesn't move.
- Idle: the body sways around the feet by ±1.5–3° with a 1.5–2 s period, the head tilts in counter-phase, breathing ~1–2%. Blinks are rare, 2–3 frames long.
- Walking and running on "twos": a step every 6–8 frames, a bounce of ~3% of height. Often the character stays in place while the background scrolls past with parallax (3:40, 22:36).
- Fear: a ±1–2 px tremble every 2 frames. A strike: wind-up (4 frames), smear (1 frame), impact, then a hold with micro-shake.
- Cloaks billow (lag + a sine wave of about 3 Hz). Crests and hair are nearly rigid.
- Crowds and armies: one model duplicated with phase offsets; back rows are smaller and dimmer (15:04, 22:36). On maps, armies are clusters of dots.

### Backgrounds
- **Almost every frame has a foreground element covering 10–25% of the frame:**
  - dark bushes in the corners;
  - overhanging tree canopies;
  - a diagonal ledge or balustrade;
  - tall tufts of grass;
  - a tree trunk at the edge;
  - an over-the-shoulder back of a head.

  This is the main source of depth (0:12, 3:36, 21:00, 29:32, 35:28).
- Landscape:
  - 2–4 bands of hills, with distant ones lighter and closer to the horizon color;
  - a lit ridge, shadow at the base, visible brush strokes.
- Two types of clouds:
  - sunset "segments" with a cream lower edge;
  - daytime cumulus with an outline, blue-gray underside, and curls.
- Forest in three depth layers, canopies with crescent highlights, dappled light, rays (2:48, 21:00).
- Palace interiors:
  - mustard wall, wine-colored lower panel with a gold stripe;
  - gold columns at the edges;
  - **diagonal shadow wedges at roughly 30°**, highlights on the floor.
- Atmosphere:
  - flipbook fire: small flames change every 2 frames, a large blaze about every 6 (Carthage, 11:35), 3 colors, sparks;
  - rain in 2 layers, starting mid-shot together with a color regrade;
  - rays from a corner, flocks of birds, smoke, explosions, blood, arrows.
- Maps:
  - territories are slabs with a dark 5–15 px edge and a light glow along the coasts;
  - fills expand, and territories are removed in steps of ~1 s;
  - armies as dots.
- Mood is set by color regrading:
  - serious scenes: desaturated dark teal, long holds, slow push-ins;
  - comedic scenes: warm colors, "bursts", quick inserts.
