# 03 · Контракт спеки (spec.json)

Движок рисует в фиксированном пространстве **1920×1080**. Позиции слоёв задаются нормализованно: `x`, `y` в диапазоне 0..1 от кадра. Валидатор: `python3 scripts/spec.py spec.json`. Списки допустимых значений лежат в `KNOWN_*` в `scripts/spec.py`, тест сверяет их с движком.

**Два отсчёта времени** (секунды):
- **время шота**, от склейки: `at`, `out`, `move[].at`, `shake[].at`, `jump[].at`, `camera.*`;
- **время слоя**, от его `at`: всё внутри слоя, то есть `talk`, `pose[].at`, `expr[].at`, `counter.delay`, `calendar.delay`, `map.regions/pins/routes[].at`, `card.every`, анимации fx.

Пример: слой с `"at": 1.0` и `"talk": [[0, 1.5]]` говорит с 1,0 по 2,5 с шота.

Цвета задаются только в формате `#rrggbb` или `#rgb`: из них считаются тени и дымка. Валидатор проверяет цвета внешности.

```jsonc
{
  "title": "…", "fps": 30, "seed": 1,               // seed делает рендер детерминированным
  "style": { "grain": true, "vignette": 0.3 },        // пост-обработка; false отключает
  "cast": { "<имя>": { /* внешность bean */ } },      // лист персонажей
  "shots": [ { "id": "k01", "dur": 3.2, "vo": "…", "screen": "…",
               "transition": "cut" | { "kind": "zoom-punch", "dur": 0.3 },
               "bg": { … } | [ { … }, { … } ],        // фоны рисуются по порядку
               "camera": { … }, "layers": [ … ] } ]
}
```

## Камера
| Поле | Пример | Что делает |
|---|---|---|
| `zoom` | `[1, 1.06]` | Масштаб от начала к концу шота. По умолчанию `[1, 1.04]` (дрейф всегда есть) |
| `pan` | `[[0,0],[40,-10]]` | Сдвиг в пикселях 1080p |
| `focus` | `[0.6, 0.45]` | Точка, к которой идёт наезд |
| `ease` | `linear` (деф.), `inOut`, `out`, `outCubic` | Кривая |
| `at`, `dur` | `0.5`, `2` | Окно движения внутри шота |
| `punch` | `[{"at":2.4,"amount":0.12}]` | Наезд-удар: рост за 0,08 с, затухание ~0,4 с |
| `shake` | `[{"at":1,"dur":0.5,"amp":18}]` | Тряска |
| `rot` | `[0, -2]` | Наклон в градусах |

Параллакс: у каждого слоя есть `z` (по умолчанию 1). При 0 слой прибит к экрану, при 0,5 движется вдвое медленнее камеры. Фоны раскладывают свои планы сами: небо 0,15, облака 0,3, холмы 0,45–0,8, земля 1.

## Фоны `bg.kind`
- `sky`:
  - `preset`: `sunset|day|dusk|night|storm|teal`;
  - `clouds`: число или `true`;
  - `rays`: bool, `sun`: `[x,y]`;
  - `hills`: число или `false`, `horizon`: 0..1, `groundY`: 0..1;
  - `ground`: `grass|sand|stone|dirt|snow|false|#hex`;
  - `trees`: `[[x,y,h],…]`, `water`: `{y,color}`;
  - `palette`: переопределения цветов;
  - `wind`: скорость облаков;
  - `cloudStyle`: `streak` (закатные «дольки» с кремовой нижней кромкой, по умолчанию у `sunset` и `dusk`) или `cumulus` (кучевые с контуром, тёмным низом и завитками).
  - Холмы сами получают воздушную перспективу (дальние светлее и ближе к цвету горизонта), подсвеченный гребень, тень у подножия и мазки.
- `forest`: лес в три глубины (дальние голубоватые стволы, средние, ближние с развилками), кроны с серповидными бликами, дымка, светлые пятна, лучи.
  - Поля: `sky`, `haze`, `leaf`, `hi`, `trunk`, `ground`, `groundY`, `path` (bool), `rays` (bool).
- `city`: небо с холмами + два ряда домов (дальний в дымке), храм в центре, круглые деревья, площадь с плиткой.
  - Поля: `preset`, `style` (`stone` или `wood` — бревенчатая деревня), `temple` (bool), `clouds`, `ground`, `groundY`.
- `interior`:
  - `wall`, `trim`, `floor`, `floorY`;
  - `columns`: `[x…]`, `columnColor` (`#d9a84a` для золотых), `drapes`: `[x…]`;
  - `window`: `[x,y,w,h]` (нормализованно), `windowSky`;
  - `dado` (цвет винной панели внизу стены, `false` выключает), `dadoH`, `dadoTrim`;
  - `light` (диагональные клинья света, по умолчанию включены), `wedges: [[x0, w], …]`;
  - `shine` (блики на полу), `lattice` (красная решётка, как в тронном зале).
- `parchment`: `color`, `z`.
- `burst`: фон для реакций; `color`, `center`, `edge`, `at`: `[x,y]`, `wedges`: bool.
- `flat`: `color`.
- `image`: `image` (путь относительно спеки), `overscan` (1,08), `z`, `filter` (CSS-фильтр canvas, например `"saturate(1.1)"`).

## Общие поля слоя
`type`, `id`, `x`, `y`, `scale`, `rot` (градусы), `alpha`, `flip`, `z`, `hud` (без камеры), `at`, `out`,
`enter`, `exit` (`none|fade|pop|drop|rise|slide-left|slide-right|slide-up|slide-down|spin`), `enterDur`, `exitDur`,
`move: [{at,dur,to:[x,y],scale,rot,alpha,flip,ease}]`, `bob` (px), `bobHz`, `sway` (град), `swayHz`, `wobble` (px),
`shake: [{at,dur,amp}]`, `jump: [{at,dur,h}]`.

**Поле кадра:** `label`, `title` и `counter` автоматически сдвигаются, чтобы текст не выходил за отступ 3,5 % от края. Расчёт учитывает наезд камеры. Отключается полем `"keepInFrame": false`. Длинный `title` ужимается до 90 % ширины кадра.

Вход по умолчанию:
- `pop` у подписей, пропсов, счётчиков;
- `none` у персонажей, карт, fx и титров (у титров буквы выпрыгивают сами);
- `slide-left` у плашки эпохи;
- `fade` у `caption`.

## Типы слоёв

### `bean`: персонаж, нарисованный кодом (риг v2: `face.js` + `rig.js`)
```json
{"type":"bean","who":"caesar","size":620,"x":0.6,"y":0.96,"view":"3q",
 "expr":"smug" | [{"at":0,"v":"neutral"},{"at":1.2,"v":"shock"}],
 "pose":"idle" | [{"at":0,"v":"hips"},{"at":2,"v":"point"}],
 "talk":[[0.3,1.8]], "walk":[[0,2]], "run":[[2,3]], "tremble":[[0,1.5]],
 "hold":"sword", "holdL":"shield", "gaze":8, "headTilt":-6, "lean":4, "rock":1.6, "poseBlend":0.07, "look":{…override cast…}}
```
- Точка `(x,y)` — это **ступни**. `size` задаёт рост в px; 1080 = рост во весь кадр. Крупный план: `size` 1000–1400 при `y` 1.2–1.5.
- `view`:
  - `3q` по умолчанию (≈60–70 % кадров референса): черты смещены к стороне взгляда, затылок в большой холодной тени;
  - `front`, `side`;
  - `back`: затылок, волосы закрывают голову.
  - Персонаж смотрит вправо, `flip: true` разворачивает влево.
- `expr`: `neutral happy content sleepy smug angry rage sad worried shock scream squint cry dead`.
  - Брови несут эмоцию.
  - `rage` добавляет вену злости, `worried` — каплю пота, `cry` — ручьи слёз.
  - `dead` — X-глаза; сочетай с `rot: -88`, `rock: 0`, `blink: false` и `fx: blood`.
- `talk`: рот меняет одну из 3 форм выражения каждые ~3 кадра (10 Гц, без повторов), голова покачивается ±1,6°.
- `pose`: `idle point point-up arms-up shrug facepalm think wave hold fist hips cross present scared hands-face thumbs-up clutch-head sword-up reach`.
  - Руки — две гнущиеся трубки (плечо → локоть → кисть, часть поз через IK).
  - Кисти-перчатки: `open`, `fist`, `point`, `thumb`.
- **Hold-and-snap:** смена позы занимает `poseBlend` секунд (по умолчанию 0,07 = 2 кадра) и даёт осадку тела ~4,5 % за 0,2 с. Так анимирован референс. Для плавного жеста ставь `poseBlend: 0.25`.
- Покой:
  - тело качается вокруг ступней ±`rock`° (1,6) с периодом 1,7 с, голова в противофазе;
  - дыхание 1,2 %, моргание раз в ~3 с (3 кадра).
- `walk` / `run`: циклы на «двойках». Шаг 0,56 с, бег 0,4 с (`gaitRate` ускоряет). Есть подпрыгивание и наклон, руки машут (`keepArms: true` оставляет позу рук).
  - Двигай персонажа через `move` или веди камеру `pan`, а персонажа держи на месте (так в референсе).
- `tremble`: дрожь ±6 единиц каждые 2 кадра (страх).
- `hold` — проп в правой руке, `holdL` — в левой, например `shield`. Меч поворачивается по руке; копьё и факел остаются почти вертикальными (наклон до ±20°), факел горит; остальное держится вертикально.
- Плащ (`cape`) отстаёт от движения: скорость берётся из `move`, а при беге он развевается.
- Внешность (в `cast`):
  - `skin`, `skinShade`, `view`;
  - `robe`, `robeShade`, `sleeve`, `trim`, `sash`, `belt`, `cape`, `armor` (сегментная броня), `pleats` (юбка в складку), `folds` (складки, по умолчанию да), `sandal`, `legColor`, `hold`, `holdL`;
  - `hair`: `short|long|curly|bun|bald|bald-sides`, `hairColor`. Короткие и длинные волосы закрывают верх и затылок, чёлка заканчивается у стороны лица;
  - `beard`: `full|goatee|stubble`, `beardColor`, `mustache`, `mustacheColor`, `blush`. Борода начинается ниже глаз;
  - `head`: `crown|laurel|helmet|hood|headband|pontifex|hat`, `headColor`, `crest`. У шлема гребень из щетины и нащёчники по краям.

### `crowd`: толпа или ряд армии
```json
{"type":"crowd","who":"legion" | ["citizen","citizen2"],"x":0.5,"y":0.95,"count":9,"rows":2,"spread":1500,"size":300,
 "march":true,"armsUp":false,"expr":"happy","pose":"idle","view":"3q","flipAlt":true,"silhouette":false,"inStep":false}
```
- Одна модель повторяется N раз со случайной фазой.
- Задние ряды на 22 % мельче, менее насыщенные и темнее.
- `march`: все идут шагом (`inStep: true` — в ногу).
- `armsUp`: руки вверх-вниз попеременно, 2 Гц (ликование).
- `silhouette`: тёмные силуэты-зрители.
- Ещё поля: `jitter` (разброс по x, 30 px), `hold`, `holdL`, `gaitRate`, `rock`, `fog` (цвет дымки задних рядов).
- Задавай `id`, если в шоте две толпы с одинаковыми `who`, `x` и `count`, иначе фазы совпадут.

### `fg`: передний план, рамка кадра (главный источник глубины в референсе)
- Ставь **последним** в списке слоёв, но **до** подписей. Параллакс `z` 1,3–1,6, вход по умолчанию `none`.
- Координаты — полный кадр (`x`, `y` оставь 0,5).
- `kind`:
  - `bushes`: тёмные кусты в углах, `sides: ["bl","br","tl","tr"]`, `color`, `hi`;
  - `canopy`: тёмные кроны, свисающие сверху;
  - `ledge`: диагональный уступ, `surface: "stone"|"grass"`, `side: "left"|"right"`, `h` (доля кадра 0,22);
  - `grass`: высокие пучки по низу с подсвеченными стеблями, `count`, `h`, `color`, `hi`;
  - `trunk`: ствол у края кадра, `side`, `inset`;
  - `ots`: «через плечо» — большой тёмный затылок с плечом у края, `who` из `cast`, `side`, `tone` (затемнение 0,45);
  - `rubble`: камни по низу.

### `image`: вырезка от ИИ (PNG с альфой)
```json
{"type":"image","src":"assets/caesar_idle.png","w":520,"anchor":[0.5,1],
 "frames":{"idle":"assets/c_idle.png","talk":"assets/c_talk.png","blink":"assets/c_blink.png"},"talk":[[0.5,2]]}
```
Во время `talk` кадры idle и talk чередуются с частотой 8 Гц. `blink` показывается раз в ~3 с. Добавляются лёгкое сжатие-растяжение и тень под ногами. Все общие поля движения работают и здесь.

### Леттеринг
- `label`: `text`, `tag`, `tagColor`, `color`, `size` (96), `tilt` (−4°), `arrow` (`right|left|up|down|down-right|…|deg`), `arrowAt`, `arrowLen`.
- `title`: `text`, `sub`, `color`, `subColor`, `size`, `stagger` (0,035 с на букву), `jiggle`.
- `date`: `text`, `suffix`, `size`, `color`.
- `era` (HUD внизу слева): `small`, `parts: [[текст, цвет], …]`, `size`.
- `counter`: `from`, `to`, `dur`, `delay`, `prefix`, `suffix`, `decimals`, `sep`, `size`, `color`, `ease`.
- `timer` (HUD): `start`, `rate`.
- `caption`: `text`, `size`. Это строка-цитата; заглушки из `script2spec` помечены `"todo": true`.

### Объекты и виджеты
- `prop`: `kind` = `coin moneybag scroll sword flag question exclaim bread temple skull heart book hourglass shield spear torch bulb`, `size`, `text`, `color`, `spin` (монета). Факел горит флипбук-пламенем, лампочка-идея светится и пульсирует лучиками.
- `card`: `w`, `h`, `title`, `titleColor`, `lines`, `every`, `lineSize`, `color`.
- `sign`: `text` (`\n` переносит строку), `w`.
- `calendar`: `pages: [{head, num, headColor}]` + `every`, либо `head`, `from`, `to`, `dur`, `ease` для быстрого счёта; `size`.
- `map`: `image` или `land: [[cx,cy,rx,ry]]`; поля `w`, `h`, `sea`, `landColor`, `coast`, `waves` (число значков волн), `extrude` (7 px).
  - `regions: [{pts,color,ink,at,dur,out,pulse}]`: территории-плиты с тёмным боковым торцом. Появляются расширяющимся кругом; `out` убирает территорию за 0,5 с, `pulse` даёт светящуюся кромку.
  - `pins: [{x,y,at,label,color,size}]`.
  - `routes: [{pts,at,dur,color}]`.
  - `armies: [{x,y,rx,ry,count,at,dur,color}]`: овал из точек, точки появляются по одной.
  - Суша приподнята плитой, у берега светлое свечение, в море значки волн.
  - Точки нормализованы к коробке карты (по умолчанию она на 10 % больше кадра).

### `fx`
`kind`:
- `rays`: `color`, `count`, `spin`;
- `speedlines`: `inner`, `count`, `color`;
- `sweat`: `count`, `speed`;
- `anger`;
- `splat`: `text`, `size`, `textSize`, `color`, `textColor`;
- `flash`: `dur`, `strength`, `color`;
- `dust`, `sparkle`: `radius`, `count`;
- `confetti`;
- `spotlight`: `radius`, `strength`;
- `fire`: ряд языков пламени, `w`, `count`, `size`, `embers`, `glow`. Это флипбук: формы меняются каждые 2 кадра, 3 цвета, без контура, искры летят вверх;
- `rain`: на весь кадр, два слоя штрихов, `density`, `angle`. Ставь с `"hud": true`, плавное начало через `at` + `enter: "fade"`;
- `beam`: диагональный клин света из угла, `from: "tl"|"tr"`, `width`, `strength`, растёт 10 кадров и мерцает;
- `birds`: стая «галочек», `count`, `speed`, `dir`, `size`, крылья на «двойках»;
- `smoke`: полоса дыма, `w`, `rise`, `color`;
- `puff`: облако-подмена, ставь в момент замены персонажа;
- `explosion`: звезда-взрыв с осколками, ~0,6 с;
- `blood`: `kind: "pool"|"splat"`, `w`;
- `lightning`: молнии, пересобираются каждые 2 кадра;
- `arrows`: залп стрел поперёк кадра, `count`, `dir`, `every`.

## Цветокор шота (`grade`)
`"grade": "serious"` или `{ "preset": "serious", "at": 2.0, "dur": 0.5, "strength": 1 }` перекрашивает весь шот, **включая подписи и HUD**. Если подпись должна остаться чистой, ставь её в следующий шот или ослабь `strength`. С `at`/`dur` перекраска включается посреди шота: в референсе так начинается дождь, 22:43.9.

| Пресет | Когда |
|---|---|
| `serious` | Обесцвеченный тёмно-бирюзовый: засада, расследование |
| `storm` | Серо-синий, ливень |
| `night` | Ночь, голубоватый холод |
| `solemn` | Пыльный серо-коричневый: казнь, утрата |
| `warm` | Тёплый комедийный |
| `gold` | Золотой час, триумф |

## Переходы
`cut` (0 с), `dissolve` (0,35), `fade-white` (0,4), `fade-black` (0,5), `zoom-punch` (0,3), `whip` (0,3), `iris` (0,5).
Переход занимает **начало** шота, к которому он указан. В это время предыдущий шот продолжает жить (его время идёт дальше `dur`).

## Расширение
- Новый слой: `T.layers.<type> = (ctx, L, lt, env) => {…}` в `scripts/engine/lib/*.js`. `lt` — время слоя, `env.lt` — время шота. Подключи файл в `index.html`, добавь тип в `KNOWN_LAYERS`.
- Новый фон: `T.bgs.<kind>`, добавь в `KNOWN_BGS`.
- Новый проп: `T.PROPS.<kind>`, добавь в `KNOWN_PROPS`.
- Новый fx: `T.FX.<kind>`, добавь в `KNOWN_FX`.
- Новая поза: `POSES` в `bean.js`, добавь в `KNOWN_POSES`.
- `tests/test_pipeline.py::test_python_vocabulary_matches_engine` упадёт, если забыть обновить `KNOWN_*`.
- В функции пути для `T.outlined` нельзя вызывать `rng`: путь строится дважды (заливка и обводка).
- Случайность только через `T.rng(T.hash(seed))` и `T.noise`. `Math.random` запрещён: рендер обязан быть детерминированным, это проверяет `tests/test_pipeline.py`.
