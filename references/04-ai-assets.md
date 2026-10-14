# 04 · AI assets: the "drawn by AI, animated by code" hybrid

The `bean` code rig and procedural backgrounds give you a recognizable style immediately and for free. But the painterly quality of the reference (hill texture, detailed costumes, architecture) comes out better from image generators. The rule, as in art-motion: **code handles the scene, camera, text, FX and timing; AI draws unique characters and complex backgrounds; code composites and animates them.**

Generated assets must not imitate a real channel's characters or a real person's likeness: describe your own original designs.

## When to use what
| Need | Path |
|---|---|
| Extras, "you, the viewer", abstract people, quick drafts | `bean` from `cast` |
| A recognizable historical figure with costume detail | `image` cutout (idle / talk / blink) |
| A unique location (forum, lab, ship) | `bg.image` (+ code layers on top) |
| A real map | `map.image`, with fills, pins and routes drawn by code |
| Complex action (running, fighting, full-body gesture) in a 🎬 frame | Veo image-to-video from the frame from MASTER_PROMPT step 6; the clip goes in as a separate shot in the edit |

## Prompts (generic, English)

The style block for this renderer. Append it **verbatim** to the end of every prompt so AI images match the code layers:

> flat 2D cartoon cutout illustration in the style of a history explainer YouTube animation, bean-shaped white heads with small black dot eyes and simple mouths, thick dark-brown ink outlines (#2a1c15), cel shading with one flat shadow tone, saturated robe colors (crimson #c8323a, gold #f2c230, olive, purple), warm painterly gradient sky, stylized swoosh clouds, no realism, no 3D, no text

**Character cutout** (generate 3 variants: mouth closed, mouth open, eyes closed):
> full body character, standing, facing slightly to the right, arms relaxed, [description from cast: e.g. "Julius Caesar: laurel wreath, white toga with dark-red sash, red cape"], mouth closed, isolated on a perfectly flat pure green #00FF00 background, no shadow on the background, centered, generous margin, + STYLE BLOCK

Then:
```sh
uv run --with pillow --with numpy python scripts/key_green.py raw/ assets/cut/ --trim
```

**Background** (no characters; leave empty space where they will stand):
> wide establishing background, [location], empty foreground on the [left/right] third for characters, horizon at 60% height, 16:9, + STYLE BLOCK

**Map:**
> old parchment map of [region], hand-drawn coastlines with thick brown outline, pale blue sea, tan land, no labels, no text, top-down, 16:9, + STYLE BLOCK

## Wiring it in
```json
{"bg":{"kind":"image","image":"assets/bg/forum.png"},
 "layers":[{"type":"image","frames":{"idle":"assets/cut/caesar_idle.png","talk":"assets/cut/caesar_talk.png","blink":"assets/cut/caesar_blink.png"},
            "x":0.64,"y":0.97,"w":560,"talk":[[0.4,2.6]],"move":[{"at":2.8,"dur":0.4,"to":[0.6,0.97]}]}]}
```
Paths are relative to `spec.json`. The renderer serves only files referenced in the spec.

## Higgsfield / fal / Midjourney
Any generator works: the prompts are generic. If an image-generation MCP is connected (for example Higgsfield), call its image tool (such as `generate_image`) with the same prompts. For consistency, generate all characters with **one model and one style seed**, and keep the `cast` descriptions word-for-word identical (the "character sheet" rule from MASTER_PROMPT).

## Checking a cutout
- No green fringe on the outline. If there is one, raise `--tol` to 110–130.
- Feet at the bottom edge of the PNG: `anchor [0.5,1]` is used, so the character stands on the ground.
- Character height matches the `bean` characters in the scene: roughly `w` 450–600 for a height of 600–700 px.
