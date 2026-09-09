# Tetra — custom code

Кастомный CSS/JS для сайта Tetra на Webflow. Код живёт здесь, а Webflow
только подключает файлы по ссылке (GitHub Pages).

## Структура

Код разделён на **страницу** и **компоненты** (navbar / footer / CTA / partners —
это Webflow-компоненты, их анимации ездят вместе с ними).

| Файл | Что внутри |
|---|---|
| `tetra-core.css` / `tetra-core.js` | общий фундамент: perf-килл-свитч, общий `gsap.matchMedia`, фабрика reveal-анимаций (`window.Tetra`), маски строк/кнопок. **Подключать первым.** |
| `tetra-page.css` / `tetra-page.js` | анимации всей страницы: Lenis, hero-хореография, `section_intro` (pin + заливка), benefits (sticky), trust (scale), about-card-animation, reveal benefits/trust/about, hover-reveal всех кнопок, image parallax, About-swiper, контроллер CADD |
| `tetra-navbar.css` / `tetra-navbar.js` | навбар: скрытие banner+logo на скролле, переключение цвета по `[navbar-color]`, мобильное меню (шторка + выезд пунктов) |
| `tetra-footer.js` | футер: reveal колонок/wordmark/legal, пульс обводки wordmark по ховеру |
| `tetra-cta.js` | CTA: reveal heading → text → кнопки |
| `tetra-partners.js` | partners: бесконечная лента логотипов + reveal заголовка |
| `tetra-cadd.js` | только для страницы **CADD**: залипающая стопка карточек `section_cadd-practice` (>=992px) + reveal секций cadd-gap / cadd-fundamentals / cadd-practice |

`window.Tetra` (из `tetra-core.js`) должен загрузиться раньше всех остальных
`tetra-*.js`. Порядок остальных между собой не важен.

## Как это подключено в Webflow

### Home → Page Settings → Custom Code

**Inside `<head>` tag:**

```html
<link rel="stylesheet" href="https://unpkg.com/lenis@1.3.26/dist/lenis.css">
<link rel="stylesheet" href="https://aleksandrrelate.github.io/tetra-custom-code/tetra-core.css">
<link rel="stylesheet" href="https://aleksandrrelate.github.io/tetra-custom-code/tetra-page.css">
<link rel="stylesheet" href="https://aleksandrrelate.github.io/tetra-custom-code/tetra-navbar.css">
```

**Before `</body>` tag:**

```html
<script src="https://cdn.jsdelivr.net/npm/lenis@1.1.20/dist/lenis.min.js"></script>
<script src="https://aleksandrrelate.github.io/tetra-custom-code/tetra-core.js"></script>
<script src="https://aleksandrrelate.github.io/tetra-custom-code/tetra-page.js"></script>
<script src="https://aleksandrrelate.github.io/tetra-custom-code/tetra-navbar.js"></script>
<script src="https://aleksandrrelate.github.io/tetra-custom-code/tetra-footer.js"></script>
<script src="https://aleksandrrelate.github.io/tetra-custom-code/tetra-cta.js"></script>
<script src="https://aleksandrrelate.github.io/tetra-custom-code/tetra-partners.js"></script>
```

Порядок важен: `tetra-*.js` рассчитывают, что jQuery, webflow.js, GSAP
(+ ScrollTrigger, SplitText) и Lenis уже загружены (подключаются выше),
и что `tetra-core.js` идёт до остальных `tetra-*.js`.

Если компонента (navbar / footer / CTA / partners) на странице нет — его файл
можно не подключать, ошибок не будет.

### CADD → Page Settings → Custom Code

То же самое, что на Home, но `tetra-page.js` меняется на `tetra-cadd.js`
(секции CADD), а компоненты переиспользуются как есть:

**Inside `<head>` tag:**

```html
<link rel="stylesheet" href="https://unpkg.com/lenis@1.3.26/dist/lenis.css">
<link rel="stylesheet" href="https://aleksandrrelate.github.io/tetra-custom-code/tetra-core.css">
<link rel="stylesheet" href="https://aleksandrrelate.github.io/tetra-custom-code/tetra-page.css">
<link rel="stylesheet" href="https://aleksandrrelate.github.io/tetra-custom-code/tetra-navbar.css">
```

**Before `</body>` tag:**

```html
<script src="https://cdn.jsdelivr.net/npm/lenis@1.1.20/dist/lenis.min.js"></script>
<script src="https://aleksandrrelate.github.io/tetra-custom-code/tetra-core.js"></script>
<script src="https://aleksandrrelate.github.io/tetra-custom-code/tetra-page.js"></script>
<script src="https://aleksandrrelate.github.io/tetra-custom-code/tetra-cadd.js"></script>
<script src="https://aleksandrrelate.github.io/tetra-custom-code/tetra-navbar.js"></script>
<script src="https://aleksandrrelate.github.io/tetra-custom-code/tetra-footer.js"></script>
<script src="https://aleksandrrelate.github.io/tetra-custom-code/tetra-cta.js"></script>
<script src="https://aleksandrrelate.github.io/tetra-custom-code/tetra-partners.js"></script>
```

`tetra-page.js` на CADD даёт общие hero / trust / parallax / hover-reveal кнопок
(секции, которых нет, просто пропускаются). `tetra-cadd.js` — только CADD-секции.

## Анти-FOUC (мигание контента при загрузке)

Пока грузятся GSAP/плагины и наши файлы, HTML уже отрисован — reveal-элементы
видны, потом `gsap.set()` их прячет → мигание. Лечится классом `.tetra-anim`
на `<html>`, который **синхронным инлайн-скриптом в `<head>`** прячет эти
элементы ещё до первого рендера.

- Правила и готовый сниппет — в шапке `tetra-core.css` (единый источник правды).
- Сниппет (скрипт + `<style>`) вставлен **инлайн** в Page Settings → Inside `<head>` tag
  на Home и CADD. В хостируемом `tetra-core.css` те же правила лежат для истории —
  но работает именно инлайн-копия (файл по `<link>` приезжает слишком поздно).
- `tetra-core.js` снимает класс через кадр после `DOMContentLoaded`; в инлайн-скрипте
  есть `setTimeout(2500)` как failsafe на случай, если JS не загрузился.
- Добавил новую reveal-секцию — допиши её селектор и в `tetra-core.css`, и в
  инлайн-`<style>` в Webflow (или навесь на секцию атрибут `data-reveal`).

## Как править

По согласованию с владельцем готовые проверенные правки коммитим и пушим в `main`
без отдельного подтверждения на каждый пуш. Незавершённые и посторонние изменения
не включаем.

Пуш в `main` → GitHub Pages пересобирается за ~минуту → изменения на сайте.
**Перепубликовывать Webflow при этом не нужно** — он отдаёт ссылку, а не копию кода.

## Важно

- Мобилка в этом проекте — всегда ширина **479px и меньше**; от 480px — не мобильный portrait-брейкпоинт.
- `?perf=<name>[,<name>]` в URL выключает подсистемы для диагностики джанка.
  Имена: `partners`, `reveal`, `benefits`, `intro`, `trust`, `swiper`, `caddsvg`, `all`.
- Репозиторий публичный: GitHub Pages не отдаёт файлы из приватных репозиториев на бесплатном тарифе. Секретов в коде нет.
- Если правится **вёрстка** (классы, структура), это по-прежнему делается в Webflow. Здесь только поведение и стили поверх неё.
