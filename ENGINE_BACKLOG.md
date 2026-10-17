# Engine backlog

Issues found while remaking "The Man Who Poisoned the World Twice" with the painted engine (all 128 shots). The film specs
work around each of them.

## Done

Each item below has tests, a visual check and a Codex review; the film's contact sheet was re-rendered afterwards (only k48,
k68 and k89 changed, all as intended; k48's panel was moved up behind the now-occluding bench).

- Arm IK keeps the elbow outward for raised hands; `holdRot`, `holdProps`; `xray` `anatomy` and `specks`.
- Characters: `flail` / `flail-b` upright (old flip kept as `upended`); `glasses: true` draws clear spectacles; crowd `look`
  and age swaps (also for mounted crowds, via creature `riderLook`); a high `reach` lengthens the arm without `stretch`;
  `sick` reads as nausea (green tint, pale sweat, `queasy` mouth); bottle `pour` can tip back (`back`, timelines).
- Places and props: set parts with `front: true` (courtroom bench) are slotted among actors per frame by depth; `obj`
  `contact` shadow sits at the feet; painted `stone` grain; unlit `candle` / `oil-lamp` / `lantern` and flame timelines;
  smaller `poof` with optional word; new props `scales`, `microscope`, `paintbrush`, `newspaper`, `spray-can`, `fridge`,
  `rope`, `pulley`.
- Core, camera and motion: world labels stay glued during a zoomed `frame` pan; smooth paths never overshoot or reverse;
  `density.py` reads real zooms and frame boxes; the `ortho` star backdrop stays behind earlier layers (`T.AFTER_BG`);
  `xray` `out`; `move` `by` / `from`; grade `out` validated; new `fx` `blackout` with `lights`.
- Creatures and vehicles: the reaper holds props beside the body; cars draw `front`, `3q`, `back`, `3q-back` views and turn
  through them (view / facing timelines, path reversals); rider objects take `expr`, `lookAt`, `takes`, `talk` and more.
- `scripts/spec.py` split (`spec_vocab.py`, `spec_maps.py`) to stay under 800 lines.
- Both `sick` sweat beads read in every view and hair kind (drawn over the hair, on the visible face side); an `ortho`
  map's modifiers (blur, focus, material) reach its starfield again; `gags.js` and `game-ui.js` split under 800 lines
  (`gags-fx.js`, `gags-enter.js`, `game-docs.js`; example frames byte-identical).
- Props and front pass: held props get a natural size (`T.HOLD_SIZE`: newspaper, paintbrush, scales, microscope,
  spray-can, rope, long tools, signs) without `holdScale`; ground fx (`dust` at the judge's feet, `T.FX_GROUND`) slot
  among front parts by `y` (`front: "over"` / `"depth"` override); every visible `set` contributes front parts (a
  parts-only set does not cover), and `frontY` opts `room` / `cell` / `antique` / `palace` / `studio` front planes in.

## Remaining gaps

- `dump-truck` has no turn views; the 3/4 car views are a stylized extrusion, and the bean rig has no back three-quarter view
  (riders in `3q-back` use the back view).
- A rider's `lookAt` aims from its seat but ignores the suspension bounce; vehicle riders don't take `riderLook`.
