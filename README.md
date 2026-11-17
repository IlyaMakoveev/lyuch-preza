# Вайбкодинг для самых маленьких — Интерактивная презентация

Интерактивная веб-презентация в стиле Apple Keynote по статье Хабра
[«Вайбкодинг для самых маленьких. Часть 1»](https://habr.com/ru/articles/1107966/).

## 🚀 Демо

- **Презентация**: [https://username.github.io/repo-name/](https://username.github.io/repo-name/) (после деплоя)
- **Poster Studio**: Живой редактор постеров на слайде 19

## 🎯 Особенности

- **24 слайда** с драматургией Apple Keynote: 1 слайд = 1 сильная мысль
- **Живой интерактив**: 15 виджетов (воронка ИИ→LLM, симулятор контекста, симулятор промптов, матрица сред, опрос аудитории, панель спикера и др.)
- **Настоящий Poster Studio**: Реальное приложение, созданное агентом за 3 запроса — меняй стили, цвета, размеры и скачивай PNG 1080×1350
- **Нативные веб-технологии**: Vanilla HTML/CSS/JS, View Transitions API, CSS-свойства, без сборщиков и зависимостей
- **60 FPS анимации**: Пружинная физика, морфинг элементов, staggered reveal, поддержка `prefers-reduced-motion`
- **Адаптивность**: 1440×900 (desktop) → 390×844 (mobile) без горизонтального скролла

## 🎮 Управление

| Клавиша | Действие |
|---------|----------|
| `←` / `→` / `Space` | Навигация по слайдам |
| `G` | Режим обзора (Grid Overview) |
| `S` | Панель спикера (заметки + таймер) |
| `L` (удерживать) | Лазерная указка |
| `T` | Переключение темы (светлая/тёмная) |
| `Home` / `End` | Первый / последний слайд |

## 📦 Структура проекта

```
.
├── index.html              # Главная презентация
├── content/
│   └── slides.json         # Контент всех 24 слайдов
├── css/
│   ├── tokens.css          # Дизайн-токены (цвета, типографика, easing, z-index)
│   ├── base.css            # Базовые стили, раскладки слайдов, анимации
│   ├── chrome.css          # UI хром (прогресс, счётчик, тема, обзор)
│   └── widgets.css         # Стили виджетов (префикс .w-)
├── js/
│   ├── deck.js             # Движок презентации (VibeDeck API)
│   └── widgets.js          # Виджеты (VibeWidgets API)
├── poster-studio/
│   └── index.html          # Автономное приложение Poster Studio
├── assets/                 # Медиа-ассеты (после чистки PNG — пустая)
├── .github/workflows/
│   └── deploy.yml          # GitHub Pages деплой
├── DESIGN.md               # Документ интеграции для разработчиков
├── WIDGETS.md              # Контракт виджетов
├── BRIEF.md                # Архитектурный контракт
├── TASKS.md                # Трекер задач проекта
└── README.md               # Этот файл
```

## 🛠 Локальный запуск

```bash
# Любой статический сервер, например:
python3 -m http.server 8712
# Затем открой http://127.0.0.1:8712/index.html
```

## 🚢 Деплой на GitHub Pages

- **Автоматически**: `push` в `main` (или `master`) запускает `.github/workflows/deploy.yml`; также доступен ручной запуск из вкладки Actions (`workflow_dispatch`).
- **Один раз включить руками**: Settings → Pages → Build and deployment → Source: **GitHub Actions** (иначе workflow упадёт с ошибкой «Pages not enabled»).
- **Состав артефакта**: только сайт — `index.html`, `css/`, `js/`, `content/`, `poster-studio/`, `assets/` (если непустая). Служебное не публикуется: `.github`, `.agents`, `.zcode`, `.claude`, `*.md`, `skills-lock.json`.
- **Кеширование**: менять заголовки `Cache-Control` на GitHub Pages нельзя (все файлы отдаются с `max-age=600`). Поэтому при изменении файлов в `css/` или `js/` поднимай единый токен `?v=N` во всех шести ссылках `index.html` (4 `<link>`, 2 `<script>`), например `?v=38` → `?v=39` — изменится URL, и кеш сбросится. `poster-studio/index.html` самодостаточен (весь CSS/JS inline) и в бампе не нуждается. Сам HTML Pages кеширует максимум на 10 минут.

## 🎨 Дизайн-система

- **Тёмная тема по умолчанию**: `#0a0a0c` с полупрозрачными слоями
- **Акцент**: Apple Blue `#0a84ff` (тёмная) / `#0071e3` (светлая)
- **Типографика**: Системный стек (`-apple-system`, `SF Pro`, `Inter`, `Segoe UI`)
- **Display-шкала**: `clamp(44px, 8.6vw, 104px)` с `letter-spacing: -0.03em`
- **Easing**: `cubic-bezier(0.32, 0.72, 0, 1)` для переходов, `cubic-bezier(0.34, 1.56, 0.64, 1)` для pop-in
- **Bento-карточки**: `backdrop-filter: blur(24px) saturate(1.6)`, границы `1px solid rgba(...)`

## 📱 Адаптивность

- **Desktop** (≥1024px): полные раскладки, Bento-сетки, боковая панель спикера
- **Tablet** (768–1023px): адаптированные сетки
- **Mobile** (<768px): одноколоночные раскладки, панель спикера — снизу (bottom sheet), скрыты подсказки клавиш

## 🔧 Использованные скиллы ZCode

| Скилл | Назначение |
|-------|------------|
| `frontend-design` | UI/UX экспертиза (Anthropic) |
| `emilkowalski/skills` (20 шт.) | Motion, apple-design, animate, gestures... |
| `ponytail` (6 шт.) | Lazy senior mode, YAGNI, нативные API |
| `design-motion-principles` | Принципы движения, аудит анимаций |
| `android-dev` | Android эмулятор (build, run, UI Automator) |
| `control-browser` | Playwright в браузере (автономное QA) |
| `visualize` | Интерактивные визуализации в чате |

Установка:
```bash
npx skills add DietrichGebert/ponytail -y
npx skills add emilkowalski/skills -y
npx skills add anthropics/skills --skill frontend-design -y
npx skills add kylezantos/design-motion-principles -y
```

## 🏗 Архитектура оркестрации

Проект собран **4 подагентами параллельно**:

1. **Подагент 1 (Content Architect)**: Парсинг статьи → `content/slides.json`
2. **Подагент 2 (Art Director)**: Дизайн-система + движок → `css/`, `js/deck.js`, `DESIGN.md`
3. **Подагент 3 (Interactive Eng)**: 15 виджетов → `css/widgets.css`, `js/widgets.js`, `WIDGETS.md`
4. **Главный агент (Integrator)**: `index.html`, интеграция, фиксы, QA

Это и есть вайбкодинг в действии: оркестрация специализированных агентов вместо ручного написания всего кода.

## 📄 Лицензия

MIT — свободно используйте для обучения, демо и вдохновения.

---

*Создано с помощью ZCode (GLM) и вайбкодинга. Код пишет агент. Смысл пишешь ты.*