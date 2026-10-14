---
name: toon-explainer
description: "Turn a narrated script/storyboard into a cutout-cartoon explainer video in the style of history/science YouTube channels (Historically-style bean-head characters, painted skies, bold outlined lettering, maps, counters, punch-zooms). Script → JSON spec → deterministic Canvas render → MP4. Use when the user wants to animate a script, generate shots from a storyboard (MASTER_PROMPT step 5 format «Кадр N — Озвучка — На экране»), recreate this reference style, or render/preview/re-time such a film."
---

# Toon Explainer

Ты режиссёр, аниматор и монтажёр. Сценарий превращается в **спеку** (JSON со шотами и слоями), спека — в видео. Картинку рисует код в браузере (Canvas 2D, Playwright, ffmpeg); уникальных персонажей и фоны по желанию генерирует ИИ (см. 04).

Скилл вырос из покадрового разбора «The ENTIRE History of ROME» (Historically, 38 мин) 14.10.2026. v2 опирается на разбор **всего** видео четырьмя параллельными анализами. Измеренные факты лежат в `references/01-reference-breakdown.md` (§6 — полный разбор).

## Маршрут

| Запрос | Что делать | Читать |
|---|---|---|
| «Анимируй этот сценарий» / есть раскадровка | `script2spec.py` → заполнить слои → sheet → render | 05 → 02 → 03 |
| Сделать отдельный шот или сцену | Рецепт из 02, проверка через `--stills` | 02, 03 |
| Свой персонаж / уникальная локация | `bean` в `cast`, либо ИИ-вырезка + `key_green.py` + слой `image` | 03 (bean), 04 |
| Подогнать под готовую озвучку | SRT → `script2spec.py --srt … --merge spec.json` | 05 §4 |
| Новый референс-стиль | `analyze_ref.py` → полосы кадров → дописать 01 и библиотеку | 01 |
| Новый тип слоя / проп / эффект | `T.layers` / `T.PROPS` / `T.FX` + `KNOWN_*` в `spec.py` | 03 «Расширение» |

## Команды (из папки скилла)

```sh
python3 scripts/script2spec.py film/script.md --out film/spec.json            # скелет + .srt
python3 scripts/spec.py film/spec.json                                         # валидация
uv run --with playwright python scripts/render.py film/spec.json --sheet film/sheet.jpg
uv run --with playwright python scripts/render.py film/spec.json --serve       # просмотр в браузере
uv run --with playwright python scripts/render.py film/spec.json --out film/preview.mp4 --scale 0.5 --workers 4
uv run --with playwright python scripts/render.py film/spec.json --out film/final.mp4 --audio vo.mp3 --workers 4
uv run --with pytest --with playwright --with pillow --with numpy pytest tests -q
```

Зависимости: `uv`, `ffmpeg`, Chromium для Playwright (`uv run --with playwright playwright install chromium`). Шрифт Rubik 800/900 (OFL, есть кириллица) лежит в `scripts/engine/lib/fonts/`.

Примеры:
- `examples/calendar_445/spec.json` — 25 с по идее «Год, который длился 445 дней»;
- `examples/grammar/spec.json` — каталог рецептов: разгадка, карта, злодей, эпизод, финал.
- `examples/v2_showcase/spec.json` — v2: балкон с уступом и птицами, марш в лесу с началом дождя, страх крупно, дворец «через плечо», карта-плиты с армией, ликующий город, пожар, погоня, после битвы;
- `examples/character_sheet/spec.json` — лист персонажа: 4 ракурса, 14 эмоций, 19 поз, костюмы. Рендери `--stills` и сверяй с ним новых героев;
- раскадровки примеров: `assets/demo_*.jpg`.

## Правила производства

1. **Три плана в каждом шоте:** передний (`fg`), персонажи, богатый фон, плюс атмосфера (`birds`, `beam`, `rain`, `smoke`). Голый фон с одиноким персонажем — только для реакций и титров (02 → «Правило глубины»).
2. **Персонаж живёт как в референсе:** ракурс 3/4, поза держится и сменяется за 2 кадра с осадкой (hold-and-snap), тело качается, рот меняет 3 формы во время речи, `tremble` от страха, `walk`/`run` для движения.
3. **Ни одного статичного шота.** Камера дрейфует всегда, это по умолчанию. Плюс одно главное действие на шот. Шоты длиннее 5 с делятся на внутренние биты.
4. **Темп референса:** новая картинка каждые 1,5–3,5 с. В кульминации темп ускоряется.
5. **Слово = событие.** Ключевое слово реплики совпадает с появлением подписи, числа, удара камеры (`at`, `punch`).
6. **Подписи = ключевые слова**, а не фраза целиком. Тег (`tag`) + имя + стрелка на персонажа.
7. **Лист персонажей:** повторяющиеся герои описываются один раз в `cast`, дальше только `who`.
8. **Тон задаётся палитрой, FX и `grade`**, грамматика не меняется. Холодный тон: `dusk`/`night`/`storm`/`teal`, `spotlight`. Комедийный: `sunset`/`day`, `splat`, `speedlines`. Таблица в 02.
9. **Детерминизм:** только `T.rng`/`T.noise`, никакого `Math.random` и времени системы. Два рендера одного момента совпадают побайтно (тест).
10. **Перед финалом:**
   - валидатор и тесты зелёные;
   - `--sheet` просмотрен (текст в кадре, лица не перекрыты);
   - превью отдано на независимый просмотр агенту, который не писал спеку.

## Структура

```
scripts/engine/      index.html + core.js (таймлайн, камера, переходы) + lib/
  lib/paint.js       палитра, обводки, toon-текст, зерно/виньетка
  lib/bg.js          sky (облака streak/cumulus, холмы с воздушной перспективой) / interior (клинья света, панель) / parchment / burst / flat / image
  lib/face.js        голова v2: яйцевидная, 4 ракурса, 14 эмоций, говорящий рот из 3 форм, причёски, бороды, головные уборы
  lib/rig.js         тело v2: руки из 2 сегментов + кисти, 19 поз hold-and-snap, покачивание, дрожь, ходьба и бег, плащ, броня
  lib/crowd.js       толпы и ряды армии: копии со сдвигом фазы, глубина рядов, марш, силуэты
  lib/scenery.js     передний план fg (кусты, кроны, уступ, трава, ствол, «через плечо», камни) + фоны forest и city
  lib/atmos.js       огонь-флипбук, дождь, луч, птицы, дым, взрыв, кровь, молния, стрелы + цветокор grade
  lib/text.js        label / title / date / era / counter / timer / caption + защита поля кадра
  lib/props.js       17 пропсов (монета, свиток, меч, щит, копьё, факел, лампочка, флаг, храм…)
  lib/widgets.js     image-вырезки (idle/talk/blink), card, sign, calendar, map (плиты, свечение берега, армии)
  lib/fx.js          rays, speedlines, sweat, anger, splat, flash, dust, sparkle, confetti, spotlight
scripts/render.py    MP4 / stills / sheet / serve, параллельные воркеры, звук
scripts/spec.py      загрузка + валидация (KNOWN_* = словарь движка)
scripts/script2spec.py   раскадровка → спека, выравнивание по SRT, --merge
scripts/key_green.py     хромакей ИИ-вырезок
scripts/analyze_ref.py   замер ритма и полосы кадров нового референса
```

## Обратная связь

После каждого фильма:
- удачные рецепты добавляй в `02-visual-grammar.md`;
- новые слои документируй в `03-spec-reference.md`;
- ошибки и обходные пути записывай в раздел QA файла `05-workflow.md`.

Если код и документация расходятся, верь коду и исправляй документацию.
