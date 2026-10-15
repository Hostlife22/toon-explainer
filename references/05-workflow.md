# 05 · From script to finished video

Relation to the companion master prompt (MASTER_PROMPT.md, step 5 storyboard format): steps 1–5 of the master prompt produce the script-storyboard. This skill replaces or complements steps 6–7 (image and animation prompts): instead of 100+ generated images, most shots are **drawn and animated by code**. AI is needed only for unique characters and backgrounds (see 04).

## Step 0: direct before writing shots

If you start from a topic (no script yet) or the script is a list of facts, plan the film first with [09-directing.md](09-directing.md): central question → arc → meaning events → the visible action for each one → characters and locations → timing. Write the central question and the arc above the first `**Shot N**` (lines before the first shot are ignored by the parser) and put the shot card's "Happens / Changes" in each `- On screen:` line. For a 9:16 short also read [11-vertical-shorts.md](11-vertical-shorts.md) and add `"format": "vertical"` to the spec after `script2spec` builds it.

## Storyboard format

One block per shot, with these labels:

- `**Shot N**`, optionally followed by 🎬 (the shot gets a main action);
- `- Voiceover:` or `- VO:` (the line, quotes optional);
- `- On screen:` or `- Screen:` (what the viewer sees).

Each label sits on its own line; a one-line `Shot N — Voiceover — On screen` row is not parsed. The bold, the leading `-` and the quotes are optional, lines before the first shot (title, notes) are ignored, and every shot needs a voiceover line. A complete two-shot `script.md` (see also [examples/coffee_film/script.md](../examples/coffee_film/script.md)):

```markdown
# How Coffee Conquered the World

**Shot 1** 🎬
- Voiceover: "Two billion cups of coffee. Every single day."
- On screen: a groggy office bean gulps a mug; the cup counter slams in.

**Shot 2**
- Voiceover: "And we owe it all to a goat."
- On screen: hard cut, a goat pops up on a gold burst; punch on "goat".
```

For a storyboard written in another language, add its label words with a JSON file and pass `--labels`:

```json
{ "shot": ["Plano"], "voiceover": ["Narración"], "screen": ["Pantalla"] }
```

Matching ignores case and diacritics, so the voiceover alignment also works for scripts in other languages.

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
Each `**Shot N**` becomes a shot `kNN` whose duration is based on its word count: `words × 60 / wpm + 0.25` s, at least `--min` (1.6 s).

Picking `--wpm` for a target length: `wpm ≈ 60 × total words / (target seconds − 0.25 × shots)`. Example: 200 words in 24 shots for a 70 s film gives 60 × 200 / (70 − 6) ≈ 188, while the default 160 gives about 81 s. Many very short shots hit the 1.6 s floor and run longer than the formula says, so check the total the script prints and re-run. Typical narration: 150–170 wpm calm, 180–200 brisk. The `vo`, `screen` and `anim` (🎬) fields are preserved. Each shot gets a placeholder `caption` marked `todo`.

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
`render.py` exits non-zero on any page error, including a failed script or image request (`[requestfailed]` in the log). An error such as `Unknown layer type "hud"` together with a failed request means an engine module did not load: re-run, and fix the path if the same file fails again.

Review `sheet.jpg` (a frame at 75% of each shot; in a vertical film the tiles are 9:16):
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
`--merge` changes only the `dur` of `kNN` shots, leaves layers untouched and rebuilds `spec.srt`. Each shot starts on the first word of its line; the last shot ends 0.6 s after the last cue. Layer times (`at`) are local, so labels move together with their shot. Only re-check shots that became much shorter.

`--merge` overwrites **every** matching `dur`, including holds you lengthened by hand (a tail hold so a payoff can finish, a silent beat). There is no field that pins a duration. After each merge, re-apply those holds by hand (keep a list of them), or give the extra beat its own shot id that is not in the storyboard (for example `k24b`): shots missing from the storyboard are kept as they are. Without `--srt`, `--merge` re-times from the `--wpm` estimate instead.

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
