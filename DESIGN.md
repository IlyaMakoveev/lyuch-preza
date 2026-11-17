# DESIGN.md — интеграция деки (для главного агента)

Документ для сборки `index.html`. Всё, что здесь описано, уже реализовано в
`css/tokens.css`, `css/base.css`, `css/chrome.css`, `js/deck.js`. Хром
интерфейса (прогресс, счётчик, кнопка темы, подсказка клавиш, обзор-сетка)
**создаёт `js/deck.js` сам — в HTML добавлять его не нужно.**

## Скелет index.html

```html
<!DOCTYPE html>
<html lang="ru" data-theme="dark" data-zcode-design>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Вайбкодинг для самых маленьких</title>
  <link rel="stylesheet" href="css/tokens.css">
  <link rel="stylesheet" href="css/base.css">
  <link rel="stylesheet" href="css/chrome.css">
  <link rel="stylesheet" href="css/widgets.css">
</head>
<body>
  <main id="deck">
    <!-- 10 секций .slide, см. каталог раскладок ниже -->
  </main>
  <script src="js/deck.js"></script>
  <script src="js/widgets.js"></script>
</body>
</html>
```

Порядок скриптов обязателен: `deck.js` раньше `widgets.js` (widgets слушает
события деки). Оба — классические скрипты, не модули.

## Контракт секции слайда

```html
<section class="slide layout-bento" data-slide="2" data-kicker="Кому это нужно"
         data-title="Агентная грамотность" data-notes="Заметки спикера одним абзацем">
  <div class="slide-inner">
    …контент…
  </div>
</section>
```

- `data-slide` — порядковый номер (0–9).
- `data-kicker` + `data-title` — короткие тексты для мини-карточек обзора (G).
  Без них deck.js возьмёт текст из `.kicker` / `.slide-title`.
- `data-notes` — заметки для панели спикера (использует widgets.js).
- Внутри — ровно один `.slide-inner`.

## Общие элементы разметки

- Kicker и заголовок: `<p class="kicker">…</p>`, `<h2 class="slide-title">…</h2>`,
  подзаголовок `<p class="slide-sub">…</p>`.
- Staggered reveal: добавьте `data-reveal` и inline-переменную порядка
  `style="--i: 2"` (задержка = `--i × 60ms`). Работает на любых блоках внутри
  слайда, виден только на активном слайде.
- Морфинг между слайдами: `data-vt="имя"` (уникальное имя на пару элементов
  на РАЗНЫХ слайдах, например один и тот же заголовок на hero и finale).
- Карточка-стекло: `<div class="card">` или `<div class="bento-card">`.
- Кнопки: `<button class="btn btn--primary">` / `btn--ghost`; чипы:
  `<button class="chip">`; клавиша: `<kbd class="kbd">→</kbd>`.
- Иконки: inline SVG, monoline stroke 1.6–1.8px, `currentColor`,
  размер через width/height 22px внутри `<span class="card-icon">…</span>`.

## Каталог раскладок

### 1. Hero

```html
<section class="slide layout-hero" data-slide="0" data-kicker="Хабр" data-title="Вайбкодинг для самых маленьких">
  <div class="slide-inner">
    <p class="kicker" data-reveal>Статья · Habr</p>
    <h1 class="slide-title" data-reveal style="--i:1">Вайбкодинг<br><span class="text-gradient">для самых маленьких</span></h1>
    <p class="slide-sub" data-reveal style="--i:2">Как перестать писать код руками и начать формулировать смысл.</p>
    <p class="source-line" data-reveal style="--i:3">habr.com/ru/articles/1107966/ · Часть 1</p>
  </div>
</section>
```

### 2. Statement (крупная мысль + цитаты)

```html
<section class="slide layout-statement" data-slide="1" data-kicker="Определение" data-title="Программирование на естественном языке">
  <div class="slide-inner">
    <h2 class="slide-title" data-reveal>Программирование на естественном языке</h2>
    <div class="quotes">
      <blockquote class="quote" data-reveal style="--i:1">
        «Вайбкодинг — …цитата из Collins Dictionary…»
        <cite>Collins Dictionary, слово года</cite>
      </blockquote>
      <blockquote class="quote" data-reveal style="--i:2">
        «…цитата Карпеди…»
        <cite>Андрей Карпеди</cite>
      </blockquote>
    </div>
  </div>
</section>
```

### 3. Bento (`.span-2` — широкая, `.row-2` — высокая)

```html
<section class="slide layout-bento" data-slide="2" data-kicker="Кому это нужно" data-title="Агенты уже везде">
  <div class="slide-inner">
    <p class="kicker" data-reveal>Кому это нужно</p>
    <h2 class="slide-title" data-reveal style="--i:1">Агенты уже везде</h2>
    <div class="bento-grid">
      <div class="bento-card span-2" data-reveal style="--i:2">
        <span class="card-icon"><svg>…</svg></span>
        <h3>Интеграции</h3>
        <p>1С, Notion, Slack, GitHub, Stripe, amoCRM…</p>
      </div>
      <div class="bento-card row-2" data-reveal style="--i:3"><h3>…</h3><p>…</p></div>
      <div class="bento-card" data-reveal style="--i:4"><h3>…</h3><p>…</p></div>
    </div>
  </div>
</section>
```

Сетка 4 колонки; на ≤760px — одна колонка, span/row игнорируются.

### 4. Diagram (флоу LLM → Tools → MCP и цикл ReAct)

```html
<section class="slide layout-diagram" data-slide="3" data-kicker="Архитектура" data-title="Как устроен агент">
  <div class="slide-inner">
    <h2 class="slide-title" data-reveal>Как устроен агент</h2>
    <div class="flow">
      <div class="flow-step card" data-reveal style="--i:1"><span class="flow-index">01</span><h3>LLM</h3><p>Мозг агента</p></div>
      <svg class="flow-arrow" viewBox="0 0 28 20" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M2 10h22m-6-6 6 6-6 6"/></svg>
      <div class="flow-step card" data-reveal style="--i:2"><span class="flow-index">02</span><h3>Tools</h3><p>Инструменты</p></div>
      <svg class="flow-arrow" …></svg>
      <div class="flow-step card" data-reveal style="--i:3"><span class="flow-index">03</span><h3>MCP</h3><p>Протокол подключения</p></div>
    </div>
    <div class="loop">
      <div class="loop-node card" data-reveal style="--i:4"><h3>Reason</h3><p>Думает</p></div>
      <svg class="flow-arrow" …></svg>
      <div class="loop-node card" data-reveal style="--i:5"><h3>Act</h3><p>Действует</p></div>
      <svg class="flow-arrow" …></svg>
      <div class="loop-node card" data-reveal style="--i:6"><h3>Observe</h3><p>Наблюдает</p></div>
      <div class="loop-return" aria-hidden="true"></div>
      <span class="loop-label">цикл ReAct</span>
    </div>
  </div>
</section>
```

### 5. Timeline

```html
<section class="slide layout-timeline" data-slide="6" data-kicker="Кейс" data-title="Poster Studio за 3 запроса">
  <div class="slide-inner">
    <h2 class="slide-title" data-reveal>3 запроса → готовое приложение</h2>
    <div class="timeline">
      <div class="timeline-step" data-reveal style="--i:1">
        <span class="timeline-tag">01</span><h3>Создай</h3><p>Первый промпт с контекстом.</p>
      </div>
      <div class="timeline-step" data-reveal style="--i:2"><span class="timeline-tag">02</span><h3>Улучшим</h3><p>…</p></div>
      <div class="timeline-step" data-reveal style="--i:3"><span class="timeline-tag">03</span><h3>Проверь</h3><p>…</p></div>
    </div>
  </div>
</section>
```

Горизонтально с точками и линией; на ≤760px — вертикально.

### 6. Reference (сетка справок 2 колонки)

```html
<section class="slide layout-reference" data-slide="7" data-kicker="Настройка" data-title="Настраиваем ZCode (GLM)">
  <div class="slide-inner">
    <h2 class="slide-title" data-reveal>Настраиваем ZCode (GLM)</h2>
    <div class="ref-grid">
      <div class="card" data-reveal style="--i:1"><h3>Модели</h3><p><code>GLM-5.3</code> — сложные задачи…</p></div>
      <div class="card" data-reveal style="--i:2"><h3>Рассуждения</h3><p><code>low / high / max</code>…</p></div>
      <div class="card" data-reveal style="--i:3"><h3>Доверие</h3><p><code>plan → build → yolo</code>…</p></div>
      <div class="card" data-reveal style="--i:4"><h3>Скиллы и MCP</h3><p>…</p></div>
    </div>
  </div>
</section>
```

### 7. Widget (слайд-виджет)

```html
<section class="slide layout-widget" data-slide="4" data-kicker="Инструменты" data-title="Чем вайбкодить">
  <div class="slide-inner">
    <p class="kicker" data-reveal>Инструменты</p>
    <h2 class="slide-title" data-reveal style="--i:1">Чем вайбкодить</h2>
    <div class="widget-zone">
      <div data-widget="tools"></div>
    </div>
  </div>
</section>
```

То же для `data-widget="sandbox"` (слайд 5) и `data-widget="pulse"` (слайд 8).
widgets.js сам заполнит эти точки монтирования.

### 8. Finale

```html
<section class="slide layout-finale" data-slide="9" data-kicker="Финал" data-title="Код пишет агент. Смысл пишешь ты.">
  <div class="slide-inner">
    <h2 class="slide-title" data-reveal>Код пишет агент.<br><span class="text-gradient">Смысл пишешь ты.</span></h2>
    <p class="slide-sub" data-reveal style="--i:1">Продолжение — в части 2.</p>
    <div class="actions" data-reveal style="--i:2">
      <button class="btn btn--primary">Отлично</button>
      <button class="btn btn--ghost">Было полезно</button>
    </div>
  </div>
</section>
```

## Что делает deck.js сам (в HTML НЕ добавлять)

`.progress > .progress-bar`, `.slide-counter`, `.theme-toggle` (SVG-иконки
внутри), `.kbd-hint`, `.overview#overview` с `.overview-card`. А также:
управление `.is-active/.is-exiting`, hash `#/N`, View Transitions + морфинг
`data-vt`, клавиатура/колесо/свайпы, тема (localStorage `vibe-theme`),
класс `has-overview` на body.

## API и события для widgets.js

```js
window.VibeDeck.state        // { index, total, overviewOpen } — живые геттеры
window.VibeDeck.next() / prev() / goTo(i) / toggleOverview(force?)
```

События на `document`:

| Событие | detail | Когда |
|---|---|---|
| `deck:ready` | `{index, total}` | init после DOMContentLoaded |
| `deck:change` | `{index, total, dir}` | смена слайда (dir 1/-1) |
| `deck:overview-toggle` | `{open}` | открытие/закрытие обзора |

widgets.js: слушайте `deck:change` для сброса/перезапуска анимаций виджетов,
`deck:ready` — если инициализация раньше деки. Клавиши `S` (спикер) и `L`
(лазер) widgets.js обрабатывает сам — deck.js их не трогает.

## Ключевые дизайн-решения

- Акцент один: Apple-синий `#0a84ff` (тёмная) / `#0071e3` (светлая).
  `--success`/`--danger` — только семантика.
- Display-шкала: `--fs-display: clamp(44px, 8.6vw, 104px)`, заголовки с
  `letter-spacing: -0.03em`, line-height 1.02–1.08.
- Движение: `--ease-out: cubic-bezier(0.32,0.72,0,1)` для всего переходного,
  `--ease-spring` — только pop-in; длительности 160/320/560ms.
- Переход слайдов: VT ~560ms; fallback-классы: вход `scale(0.96)+24px`,
  выход `scale(1.04)+blur(8px)`. Блокировка навигации 700ms.
- Печать: `@media print` — слайды статично друг под другом, `@page { size: landscape }`.
- `prefers-reduced-motion`: все анимации 0.01ms, reveal виден сразу, VT отключён.

## Ручная проверка

1. Открыть `index.html` в Chrome/Safari (file://).
2. `→/←/Space/PageDown/PageUp/Home/End` — навигация; `#/N` в адресной строке;
   перезагрузка с hash восстанавливает слайд.
3. `G` — обзор-сетка, клик по карточке — переход, `Esc` — закрытие.
4. `T` — тема, сохраняется в localStorage между перезагрузками.
5. Горизонтальный жест трекпада — смена слайдов (блокировка ~900ms);
   вертикальное колесо — естественный скролл, слайды не листает. На тач — свайпы
   (кроме зон виджетов и кнопок).
6. DevTools: 390×844 — одна колонка, без горизонтального скролла;
   Эмуляция `prefers-reduced-motion` — переходы мгновенны; Печать (PDF) —
   альбомные страницы. `window.VibeDeck` в консоли — API доступен.
