# Third-party notices

toon-explainer bundles the following third-party material.

## Rubik typeface

`scripts/engine/lib/fonts/Rubik-800.woff2` and `Rubik-900.woff2` are static instances of the Rubik variable font by the Rubik Project Authors, converted to WOFF2. Rubik is licensed under the SIL Open Font License 1.1; the full license text is in [scripts/engine/lib/fonts/OFL-Rubik.txt](scripts/engine/lib/fonts/OFL-Rubik.txt). The font is not sold by itself.

## Natural Earth

`scripts/engine/lib/maps/geo-data-lo.js` and `geo-data-hi.js` are derived from Natural Earth (https://www.naturalearthdata.com) 1:110m and 1:50m Admin 0 countries, lakes and rivers + lake centerlines. Natural Earth is in the public domain; no permission is needed to use it. The data was quantized to 0.01 degree, split into shared border arcs and simplified by `scripts/build_geo.py`. Country names and borders follow Natural Earth's de facto conventions and are not a statement on any dispute. The mountain spines and desert outlines in `geo-ranges.js` are hand-traced approximations made for this project.

## Reference video

The style measurements in [references/01-reference-breakdown.md](references/01-reference-breakdown.md) describe techniques observed in a third-party YouTube video. No frames, audio, characters or other material from that video are included in this repository. All showcase images and animations were rendered by this engine.
