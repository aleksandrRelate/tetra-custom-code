# Tetra — custom code

Кастомный CSS/JS для сайта Tetra на Webflow. Раньше этот код лежал целиком
в Page Settings → Custom Code (~50 КБ инлайном). Теперь он живёт здесь,
а Webflow только подключает два файла по ссылке.

## Что где

| Файл | Что внутри |
|---|---|
| `tetra.css` | стили Lenis, тема навбара, маски для reveal-анимаций, анимация кнопок, parallax, swiper на About |
| `tetra.js` | скролл-интеракции (GSAP + ScrollTrigger + SplitText + Lenis), анимация кнопок, parallax картинок, swiper на About, контроллер графики CADD |

Блоки внутри файлов идут в том же порядке, что и раньше в Webflow, и помечены
комментариями `/* ===== ... ===== */`.

## Как это подключено в Webflow

Страница Home → Page Settings → Custom Code.

**Inside `<head>` tag:**

```html
<link rel="stylesheet" href="https://unpkg.com/lenis@1.3.26/dist/lenis.css">
<link rel="stylesheet" href="https://aleksandrrelate.github.io/tetra-custom-code/tetra.css">
```

**Before `</body>` tag:**

```html
<script src="https://cdn.jsdelivr.net/npm/lenis@1.1.20/dist/lenis.min.js"></script>
<script src="https://aleksandrrelate.github.io/tetra-custom-code/tetra.js"></script>
```

Порядок важен: `tetra.js` рассчитывает, что jQuery, webflow.js, GSAP
(+ ScrollTrigger, SplitText) и Lenis уже загружены — все они подключаются выше.

## Как править

Пуш в `main` → GitHub Pages пересобирается за ~минуту → изменения на сайте.
**Перепубликовывать Webflow при этом не нужно** — он отдаёт ссылку, а не копию кода.

Быстрая правка в браузере: открыть репозиторий и нажать `.` — откроется
VS Code прямо в GitHub.

## Важно

- Мобилка в этом проекте — всегда ширина **479px и меньше**; от 480px — не мобильный portrait-брейкпоинт.
- Репозиторий публичный: GitHub Pages не отдаёт файлы из приватных репозиториев
  на бесплатном тарифе. Секретов в этом коде нет — он и так уходит в браузер.
- Если правится **вёрстка** (классы, структура), это по-прежнему делается
  в Webflow. Здесь только поведение и стили поверх неё.
