# Engine backlog

Issues found while remaking "The Man Who Poisoned the World Twice" with the painted engine (all 128 shots). The film specs
work around each of them; fix them in the engine with tests, a visual check and a review, then re-render the film's contact
sheet and compare.

## Already fixed during the film work

- Arm IK keeps the elbow outward for raised hands and changes smoothly at shoulder height (`6d4b005`, `ed2f124`).
- `holdRot` tilts a held prop; `holdProps` lets a held prop act (a bottle pours).
- `xray` `anatomy` and `specks`: skeleton, organs and lead grains settling in the bones.

## Bugs

1. Poses `flail` and `flail-b` are rotated 160 degrees, so the character renders upside down (`lib/characters/rig.js`).
2. `glasses: true` on a cast look draws sunglasses instead of spectacles (`"round"` works).
3. The reaper's `hold` prop covers its face: the hand slot sits at head height (`lib/creatures/spirits.js`).
4. The `courtroom` set preset draws the judge's desk behind the actors.
5. World-placed labels (`hud: false`) drift off their positions while a zoomed `frame` camera pans.
6. Swapping `look.age` (for example to `"child"`) showed no visible change on beans in a crowd shot (k118).
7. `contact: true` on an `obj` draws no contact shadow; the stone material shows no visible texture.
8. Smooth paths with very uneven point spacing loop backwards (a car got squashed as if turning).
9. `scripts/density.py` `_zoom_key` treats any keyed `camera.zoom` as the default, so it reports false "same size" warnings.
10. The `ortho` globe's star backdrop covers layers listed before the map.
11. A bean `reach` to a target above the head leaves the hands at the face unless `stretch: true` is set.
12. The `sick` expression draws red drips that read as blood.

## Missing features

- `xray` cannot be switched off inside a shot (no `out` field; a `swap` to `null` is the workaround).
- `move.from` is ignored and `move.to` is absolute, so an element cannot slide (for example a curtain).
- A shot `grade` key with `at` never ends on its own.
- No blackout or light-off effect (a black `fx` flash with a long `dur` is the workaround).
- The `candle` prop cannot be unlit (no `flame: false`, unlike `oil-lamp` and `lantern`).
- `poof` defaults to 420 x 300 with a "POOF!" word, which covers the subject.
- A held bottle cannot tip back upright after `holdProps.pour`.
- Missing props: scales, microscope, paintbrush, a newspaper to hold, rope and pulleys, fridge, spray can.

## Quality gaps (larger tasks)

- A vehicle turning around is drawn as a squash, not a real three-quarter turn.
- A driver seated in a vehicle cannot change expression.
