# Changelog

## 1.0.0 · 2026-10-14

The first release of toon-explainer: a skill for coding agents and a portable Canvas engine that turns a narrated script into a cutout-cartoon explainer video in the style of history and science YouTube channels.

### Script to film

- Added `script2spec.py`: parses a storyboard (`Shot N / Voiceover / On screen`, or the Russian `Кадр N / Озвучка / На экране`), estimates shot timing from words per minute and writes a skeleton spec plus an SRT file.
- Added alignment to a real voiceover: `--srt` snaps every shot to its first spoken word (difflib word matching, short VTT timestamps, no cumulative drift); `--merge` re-times a filled spec without touching its layers.
- Added a JSON spec contract with a validator (`spec.py`) whose vocabulary is checked against the engine by tests.

### Characters

- Built the bean-head character rig: egg-shaped head, three-quarter, front, side and back views, and a large cool back-of-head shadow.
- Added 14 expressions with brows, mouth sheet, sweat, tears and anger vein, plus a talking mouth that cycles three shapes at about 10 Hz.
- Added two-bone arms with IK targets and glove hands (open, fist, point, thumb). Implemented 19 poses with hold-and-snap timing and a settle squash.
- Added idle rock around the feet, tremble, walk and run cycles on twos, a cape that lags behind movement, and hand-held props in both hands.
- Added costumes: hair masses that cover the back of the head, beards, crowns, laurels, crested helmets, hoods, hats, armor, pleated skirts, sashes, trim and capes.
- Added crowds and army rows: duplicated designs with phase offsets, depth-tinted back rows, marching, cheering and silhouette audiences.

### Scenes and atmosphere

- Added painted skies with streak and cumulus clouds, layered hills with atmospheric fade and rim light, forests in three depths, stone and wooden towns, palace interiors with light wedges, parchment, reaction bursts and image backgrounds.
- Added the foreground framing layer: bushes, canopy, ledge, tall grass, edge trunk, over-the-shoulder head and rubble.
- Added flipbook fire with embers, two-layer rain, corner light beams, bird flocks, smoke, explosions, blood, lightning, arrow volleys, speed lines, splats, spotlights and more.
- Added per-shot color grading (`serious`, `storm`, `night`, `solemn`, `warm`, `gold`) that can fade in mid-shot.
- Added extruded parchment maps with coastal glow, wave marks, growing and receding territories, pins, routes and dot armies.
- Added lettering: name labels with tags and arrows, titles, dates, era tags, counters, timers, cards, signs and a flipping calendar. A safe-frame clamp keeps text in frame, including under camera zoom.

### Rendering and quality checks

- Implemented deterministic frame-by-frame rendering with Playwright and FFmpeg: MP4, PNG stills, per-shot contact sheets, an interactive preview server, parallel workers and voiceover muxing.
- Added a reference-video analyzer (`analyze_ref.py`), a chroma-key tool for AI-generated cutouts (`key_green.py`), repository checks, release packaging and CI.
- Added tests for parsing, alignment, validation, engine vocabulary, determinism, odd render scales, short audio and every example.
