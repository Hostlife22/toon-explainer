# 05 · From script to finished video

Relation to the companion master prompt (MASTER_PROMPT.md, step 5 storyboard format): steps 1–5 of the master prompt produce the script-storyboard. This skill replaces or complements steps 6–7 (image and animation prompts): instead of 100+ generated images, most shots are **drawn and animated by code**. AI is needed only for unique characters and backgrounds (see 04).

## Storyboard format

The parser accepts both Russian and English labels:

- `**Кадр N**` (Shot N) or `**Shot N**`, optionally followed by 🎬;
- `— Озвучка:` (Voiceover) or `— Voiceover:` / `— VO:`;
- `— На экране:` (On screen) or `— On screen:` / `— Screen:`.

## Pipeline

```
script.md ──script2spec──► spec.json (skeleton, timings, .srt)
                     │
        Claude: fill in cast + layers following 02-visual-grammar
                     │
            spec.py (validation) ──► render --sheet (storyboard) ──► fixes
                     │
     voiceover ready? ──► Whisper/CapCut .srt ──► script2spec --srt (exact timings, layers kept)
                     │
        render --scale 0.5 --workers 4 (preview) ──► review ──► final render + --audio
```

### 1. Skeleton
```sh
python3 scripts/script2spec.py film/script.md --out film/spec.json --wpm 160
```
Each `**Кадр N**` (or `**Shot N**`) becomes a shot `kNN` whose duration is based on its word count. The `vo`, `screen` and `anim` (🎬) fields are preserved. Each shot gets a placeholder `caption` marked `todo`.

### 2. Filling in (Claude's job)
For each shot:
1. Identify the beat type (A–I in `02-visual-grammar.md`) from `vo` and `screen`.
2. Add recurring characters to `cast` once.
3. Replace the placeholder with the recipe's layers. Labels are the **key words of the line**, not the whole sentence.
4. Set `at` from the line's text: label appearance ≈ position of the key word in `vo` × shot duration.
5. 🎬 shots get a main action (pose change, `move`, `jump`, `punch`). The rest get only camera drift and a label entrance.
6. Use one non-cut transition every 4–5 shots.

Fill in long films in batches of 15–20 shots (as in step 6 of the master prompt) and check the storyboard after each batch.

### 3. Storyboard check
```sh
python3 scripts/spec.py film/spec.json
uv run --with playwright python scripts/render.py film/spec.json --sheet film/sheet.jpg
```
Review `sheet.jpg` (a frame at 75% of each shot):
- text stays inside the frame;
- labels do not cover faces;
- characters stand on the ground;
- one focal point per frame;
- colors do not repeat three shots in a row.

### 4. Timing to the real voiceover
Make an SRT of the voiceover (Whisper: `whisper vo.mp3 --language ru --output_format srt` — set `--language` to your narration language — or an export from CapCut). Then:
```sh
python3 scripts/script2spec.py film/script.md --srt vo.srt --merge film/spec.json
```
`--merge` changes only the `dur` of `kNN` shots, leaves layers untouched and rebuilds `spec.srt`. Each shot starts on the first word of its line. Layer times (`at`) are local, so labels move together with their shot. Only re-check shots that became much shorter.

### 5. Preview and final
```sh
uv run --with playwright python scripts/render.py film/spec.json --out film/preview.mp4 --scale 0.5 --workers 4
uv run --with playwright python scripts/render.py film/spec.json --shot k07,k08 --out film/k07.mp4   # spot check
uv run --with playwright python scripts/render.py film/spec.json --out film/final.mp4 --audio vo.mp3 --workers 4
```
Benchmark from 14.10.2026 (on a Mac): 25 s of video takes 30 s at `--scale 0.5 --workers 3` and 2 min 22 s at 1080p with `--workers 4` (≈5.7 s of rendering per 1 s of video). A 7-minute film at 1080p takes ≈40 minutes. Render previews at 0.5.

Interactive viewer (space to play, arrow keys to step frame by frame, slider to scrub):
```sh
uv run --with playwright python scripts/render.py film/spec.json --serve   # prints the URL
```

## QA before delivery
- [ ] `spec.py` reports no errors, `pytest tests` is green.
- [ ] No shot longer than 5 s without an internal beat.
- [ ] The key word of each line coincides with an on-screen event (±0.3 s).
- [ ] Text is readable on a phone: `size` at least 56 for labels, 44 for caption.
- [ ] The tone matches the one chosen (table in 02).
- [ ] Independent review: hand `preview.mp4` to an agent that did not write the spec and ask it to find the 5 worst moments.
