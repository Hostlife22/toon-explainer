# Third-party notices

toon-explainer bundles or adapts the following third-party material.

## Rubik typeface

`scripts/engine/lib/fonts/Rubik-800.woff2` and `Rubik-900.woff2` are static instances of the Rubik variable font by the Rubik Project Authors, converted to WOFF2. Rubik is licensed under the SIL Open Font License 1.1; the full license text is in [scripts/engine/lib/fonts/OFL-Rubik.txt](scripts/engine/lib/fonts/OFL-Rubik.txt). The font is not sold by itself.

## Frame-capture renderer pattern

`scripts/render.py` follows the frame-capture approach of [art-motion](https://github.com/Hostlife22/art-motion): a local HTTP server, headless Chromium stepping a Canvas timeline frame by frame and piping PNG frames into FFmpeg. art-motion includes code adapted from the original animation toolkit by alchaincyf; the following MIT notice applies to that upstream code.

MIT License

Copyright (c) 2026 alchaincyf (Huashu · Peanut)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Reference video

The style measurements in [references/01-reference-breakdown.md](references/01-reference-breakdown.md) describe techniques observed in a third-party YouTube video. No frames, audio, characters or other material from that video are included in this repository. All showcase images and animations were rendered by this engine.
