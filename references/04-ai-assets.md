# 04 · Ассеты от ИИ: гибрид «нарисовано нейросетью, анимировано кодом»

Код-риг `bean` и процедурные фоны дают узнаваемый стиль сразу и бесплатно. Но живописность референса (фактура холмов, детальные костюмы, архитектура) лучше получается у генераторов картинок. Правило, как в art-motion: **сцену, камеру, текст, FX и тайминг делает код; уникальные персонажи и сложные фоны рисует ИИ; код их компонует и оживляет.**

## Когда что использовать
| Нужно | Путь |
|---|---|
| Массовка, «зритель-ты», абстрактные люди, быстрые черновики | `bean` из `cast` |
| Узнаваемый исторический персонаж с деталями костюма | `image`-вырезка (idle / talk / blink) |
| Уникальная локация (форум, лаборатория, корабль) | `bg.image` (+ код-слои сверху) |
| Реальная карта | `map.image`, а заливки, пины и маршруты рисует код |
| Сложное действие (бег, драка, жест с телом) в 🎬-кадре | Veo image-to-video по кадру из шага 6 MASTER_PROMPT, клип ставится как отдельный шот на монтаже |

## Промты (универсальные, английский)

Блок стиля этого рендера. Добавляй его **дословно** в конец каждого промта, чтобы картинки от ИИ совпадали с код-слоями:

> flat 2D cartoon cutout illustration in the style of a history explainer YouTube animation, bean-shaped white heads with small black dot eyes and simple mouths, thick dark-brown ink outlines (#2a1c15), cel shading with one flat shadow tone, saturated robe colors (crimson #c8323a, gold #f2c230, olive, purple), warm painterly gradient sky, stylized swoosh clouds, no realism, no 3D, no text

**Персонаж-вырезка** (генерируй 3 варианта: рот закрыт, рот открыт, глаза закрыты):
> full body character, standing, facing slightly to the right, arms relaxed, [описание из cast: e.g. "Julius Caesar: laurel wreath, white toga with dark-red sash, red cape"], mouth closed, isolated on a perfectly flat pure green #00FF00 background, no shadow on the background, centered, generous margin, + БЛОК СТИЛЯ

Потом:
```sh
uv run --with pillow --with numpy python scripts/key_green.py raw/ assets/cut/ --trim
```

**Фон** (без персонажей, оставь пустое место там, где они будут стоять):
> wide establishing background, [локация], empty foreground on the [left/right] third for characters, horizon at 60% height, 16:9, + БЛОК СТИЛЯ

**Карта:**
> old parchment map of [регион], hand-drawn coastlines with thick brown outline, pale blue sea, tan land, no labels, no text, top-down, 16:9, + БЛОК СТИЛЯ

## Подключение
```json
{"bg":{"kind":"image","image":"assets/bg/forum.png"},
 "layers":[{"type":"image","frames":{"idle":"assets/cut/caesar_idle.png","talk":"assets/cut/caesar_talk.png","blink":"assets/cut/caesar_blink.png"},
            "x":0.64,"y":0.97,"w":560,"talk":[[0.4,2.6]],"move":[{"at":2.8,"dur":0.4,"to":[0.6,0.97]}]}]}
```
Пути указываются относительно `spec.json`. Рендерер раздаёт только файлы, упомянутые в спеке.

## Higgsfield / fal / Midjourney
Подойдёт любой генератор: промты универсальные. Если подключён MCP Higgsfield, `generate_image` вызывается с этими же промтами. Для единства генерируй всех персонажей **одной моделью и одним сидом стиля**, держи `cast`-описания дословно одинаковыми (правило «лист персонажей» из MASTER_PROMPT).

## Проверка вырезки
- Нет зелёной каймы на контуре. Если есть, подними `--tol` до 110–130.
- Ступни у нижнего края PNG: используется `anchor [0.5,1]`, и так персонаж встаёт на землю.
- Высота персонажа совпадает с `bean` на сцене, примерно `w` 450–600 при росте 600–700 px.
