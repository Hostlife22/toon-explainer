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
- Vehicles and riders: `dump-truck` turns through `front` / `3q` / `3q-back` / `back`; the 3/4 car views are a real
  projection (perspective faces, elliptical wheels on both sides, glass, lights, painted shading); beans take
  `view: "3q-back"` (also riders in 3q-back); rider anchors follow the suspension; vehicles take `riderLook`.

## Remaining gaps

- Held props draw at the default size 170, so a held `newspaper` or `paintbrush` needs `holdScale` 1.3-1.8.
- Any `fx` layer is slotted above `front` set parts, so a local effect placed behind a bench (dust at the judge's feet)
  draws over the bench.
- Only the last background contributes `front` parts, and only when it is a `set`.
- Other road vehicles without turn views: `tank` (treads and sponsons would need their own front / back drawings), and the
  animal-drawn or pushed `cart`, `chariot`, `wagon`, `bicycle` and `cannon` (they keep the squash on a reversal). There is
  no bus, van or lorry kind besides `dump-truck`.
- In a 3/4 view the back sweat bead of a `sick` face can hide under the hair.
- An `ortho` map layer with a modifier (blur, material) no longer applies it to its starfield.
- `lib/acting/gags.js` is over the 800-line limit (836 lines).
