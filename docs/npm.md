# NPM Workflow

## English

### Purpose

This file defines the standard way we run and build npm-based desktop projects.

Our rule for development is simple:

- during development, we launch the project through npm scripts;
- we do not treat a built `.exe` as the main development entry point;
- visual, UI, and behavior changes are checked from source first;
- packaging is used as a verification step, not as the default daily workflow.

### Standard Development Flow

1. Install dependencies:

```bash
npm install
```

2. Run the project in development mode:

```bash
npm run dev
```

3. If `dev` is not defined, `npm start` may be used as the development entry.

4. After meaningful changes, verify a packaged build:

```bash
npm run pack
```

5. Before release or version freeze, build the distributable package:

```bash
npm run dist
```

### `npm start` vs `npm run dev`

These commands are close, but they are not the same kind of thing.

- `npm run <name>` is the general npm command for running any script from `package.json`.
- `npm start` is a special built-in npm shortcut for the `start` script.
- `npm run start` and `npm start` usually mean the same thing.
- `npm run dev` is not special to npm. It works only because we define a `dev` script ourselves.

So yes: in the end these are mostly script names, but the word `start` has special treatment in npm.

### Recommended Naming Rule

For our Electron projects, the best long-term standard is:

- keep both `start` and `dev`;
- use `npm start` as the most natural daily entry point;
- keep `npm run dev` as the explicit technical name for development mode;
- keep `pack` and `dist` separate because they belong to later stages;
- optionally add `prod:smoke` for automated packaged-app verification.

Recommended pattern:

```json
{
  "scripts": {
    "start": "npm run dev",
    "dev": "electron .",
    "pack": "electron-builder --dir",
    "dist": "electron-builder"
  }
}
```

Why this is useful:

- `npm start` stays convenient and natural;
- `npm run dev` stays explicit in docs and team communication;
- build commands remain clearly separated from daily development.

### Why Not Use Only One Command

Using only `npm start` is possible, but not ideal:

- it is simple;
- it is familiar;
- but it hides the fact that this is specifically development mode.

Using only `npm run dev` is also possible, but not ideal:

- it is explicit;
- it is technically clear;
- but it removes the very natural default entry point many people expect.

Our conclusion:

- keep both;
- let `start` be the human-friendly entry point;
- let `dev` be the explicit technical development name;
- let both launch the same source-based development workflow unless a project has a strong reason to split them.

### Command Roles

- `npm install`
  Installs dependencies for the project.

- `npm start`
  The default daily command.
  In our standard, this should start development mode, not a packaged build.

- `npm run dev`
  Explicit development mode.
  Should launch the app from source.
  If hot reload, file watching, or development flags exist, they belong here.

- `npm run pack`
  Creates a local packaged build for checking behavior close to production.
  This is not the main daily development mode.

- `npm run dist`
  Creates the final distributable build.
  This is the release-oriented command.

- `npm run prod:smoke`
  Optional verification command for packaged builds.

### Implementation Standard

For new Electron projects, we should implement scripts like this:

```json
{
  "scripts": {
    "start": "npm run dev",
    "dev": "electron .",
    "pack": "electron-builder --dir",
    "dist": "electron-builder",
    "prod:smoke": "npm run pack"
  }
}
```

Possible project-specific variants:

- `dev` may include extra flags such as hot reload or debug flags;
- `dist` may target Windows, macOS, or both;
- `prod:smoke` may run a real smoke test instead of reusing `pack`.

### Electron-Specific Rule

For Electron projects on Windows and macOS, the policy should stay the same:

- daily development runs from source through npm scripts;
- styles and UI should be checked in dev mode first;
- packaged builds are verification steps;
- release artifacts are built only when needed.

The script names should stay stable even if the internal command changes per project.

### Recommended Script Standard For Future Projects

For new projects, we should try to keep the same script naming:

- `npm run dev`
  Preferred daily development command.
  Runs the app from source with development flags and hot reload if available.

- `npm start`
  May be an alias to `npm run dev`.
  Useful for compatibility with common npm habits.

- `npm run pack`
  Creates a local packaged build for checking behavior close to production.

- `npm run dist`
  Creates the final distributable artifact.

- `npm run prod:smoke`
  Optional but recommended.
  Runs a lightweight automated check against the packaged app.

### Current Project Standard

For this project, the active commands are:

- `npm start`
  Runs the default root target.
  Right now the default target is `desktop`.

- `npm run dev`
  Explicit development entry for the selected root target.

- `npm start -- desktop`
  Explicitly runs the `desktop` target from the monorepo root.

- `npm start -- --target desktop`
  Named form of the same target selection.

- `npm run check -- desktop`
  Runs the selected target check command from the monorepo root.

- `npm run pack`
  Builds a packaged local version.

- `npm run dist`
  Builds the final Windows portable package.

### Parameters And Environment Variables

General rule:

- visual styling should live in CSS;
- JavaScript should switch state, mode, or classes;
- environment variables should be used only for runtime flags, testing, or environment-specific behavior.

If a project needs extra runtime flags, they should be documented in this file.

Example:

- `CTRLV_SMOKE=1`
  Enables smoke-test behavior for this project.

### Practical Notes

- If the project is under active development, start from npm scripts, not from a packaged `.exe`.
- If a style change is not visible, first confirm that the project is really using source files and not overriding them elsewhere.
- Keep this document reusable: copy it to other projects and only update the project-specific section.

### Final Standard We Adopt

For future Electron projects, our standard is:

- use npm scripts as the main project entry;
- keep both `npm start` and `npm run dev`;
- make `npm start` the default daily command;
- make `npm run dev` the explicit development command;
- keep `npm run pack` and `npm run dist` as separate build stages;
- document any extra project flags in this file.

---

## Русский

### Назначение

Этот файл задаёт единый стандарт запуска и сборки npm-проектов, особенно desktop-проектов на Electron и похожих стеков.

Наше правило для разработки простое:

- на этапе разработки проект запускаем через npm-скрипты;
- собранный `.exe` не считаем основным способом повседневной разработки;
- изменения в интерфейсе, стилях и логике сначала проверяем из исходников;
- упаковку используем как этап проверки, а не как основной ежедневный режим.

### Стандартный Порядок Работы

1. Установить зависимости:

```bash
npm install
```

2. Запустить проект в режиме разработки:

```bash
npm run dev
```

3. Если `dev` не определён, допускается использовать `npm start` как команду разработки.

4. После заметных изменений проверить локальную упакованную версию:

```bash
npm run pack
```

5. Перед релизом или фиксацией версии собрать финальный артефакт:

```bash
npm run dist
```

### `npm start` и `npm run dev`

Эти команды близки по смыслу, но это не одно и то же по роли.

- `npm run <name>` — это общий способ npm запускать любой скрипт из `package.json`.
- `npm start` — это специальная встроенная короткая команда для скрипта `start`.
- `npm run start` и `npm start` обычно означают одно и то же.
- `npm run dev` не является специальной командой npm. Она работает только потому, что мы сами создаём скрипт `dev`.

То есть да: по сути это имена скриптов, но `start` у npm имеет особый статус.

### Рекомендуемое Правило Именования

Для наших Electron-проектов лучше держать такой стандарт:

- иметь и `start`, и `dev`;
- использовать `npm start` как самый естественный повседневный вход;
- оставлять `npm run dev` как явное техническое имя dev-режима;
- `pack` и `dist` держать отдельно, потому что это уже другие этапы;
- при необходимости добавлять `prod:smoke` для автоматической проверки упакованной версии.

Рекомендуемый шаблон:

```json
{
  "scripts": {
    "start": "npm run dev",
    "dev": "electron .",
    "pack": "electron-builder --dir",
    "dist": "electron-builder"
  }
}
```

Почему это удобно:

- `npm start` остаётся привычной и короткой командой;
- `npm run dev` удобно использовать в документации и в обсуждениях как явное название режима разработки;
- сборка и релиз не смешиваются с повседневным запуском.

### Почему Не Стоит Оставлять Только Одну Команду

Использовать только `npm start` можно, но это не лучший вариант:

- это просто;
- это привычно;
- но так теряется явное обозначение dev-режима.

Использовать только `npm run dev` тоже можно, но это тоже не лучший вариант:

- это явно и технически понятно;
- но исчезает естественная стандартная точка входа, которую многие ожидают увидеть в проекте.

Наш вывод:

- держим обе команды;
- `start` оставляем как удобный человеческий вход;
- `dev` оставляем как явное техническое имя режима разработки;
- по умолчанию обе команды должны вести в один и тот же запуск из исходников, если нет сильной причины их разделять.

### Роли Команд

- `npm install`
  Устанавливает зависимости проекта.

- `npm start`
  Основная повседневная команда запуска.
  В нашем стандарте она должна запускать именно dev-режим, а не готовую сборку.

- `npm run dev`
  Явное имя режима разработки.
  Должна запускать приложение из исходников.
  Если в проекте есть hot reload, watcher или специальные dev-флаги, они должны жить здесь.

- `npm run pack`
  Делает локальную упакованную сборку для проверки поведения, близкого к production.
  Это не основной режим ежедневной разработки.

- `npm run dist`
  Делает финальную выпускную сборку.
  Это уже релизная команда.

- `npm run prod:smoke`
  Необязательная команда быстрой проверки упакованной версии.

### Стандарт Реализации

Для новых Electron-проектов мы рекомендуем реализовывать скрипты так:

```json
{
  "scripts": {
    "start": "npm run dev",
    "dev": "electron .",
    "pack": "electron-builder --dir",
    "dist": "electron-builder",
    "prod:smoke": "npm run pack"
  }
}
```

Допустимые проектные варианты:

- `dev` может содержать дополнительные dev-флаги, hot reload или debug-параметры;
- `dist` может собирать Windows, macOS или обе платформы;
- `prod:smoke` может быть отдельным реальным smoke-тестом, а не алиасом.

### Правило Для Electron-Проектов

Для Electron-проектов на Windows и macOS политика должна быть одинаковой:

- ежедневная разработка идёт из исходников через npm-скрипты;
- стили и интерфейс сначала проверяются в dev-режиме;
- упакованные сборки нужны как этап проверки;
- финальные артефакты собираются отдельно, когда это действительно нужно.

Названия скриптов желательно сохранять одинаковыми даже тогда, когда внутренние команды в проекте немного отличаются.

### Рекомендуемый Стандарт Скриптов Для Новых Проектов

Для новых проектов желательно держать одинаковые имена скриптов:

- `npm run dev`
  Основная команда для ежедневной разработки.
  Запускает приложение из исходников, с dev-флагами и hot reload, если он есть.

- `npm start`
  Может быть алиасом на `npm run dev`.
  Удобно для совместимости с привычным npm-сценарием.

- `npm run pack`
  Делает локальную упакованную сборку для проверки поведения, близкого к production.

- `npm run dist`
  Делает финальную сборку, которую уже можно считать выпускной.

- `npm run prod:smoke`
  Необязательный, но желательный скрипт.
  Нужен для быстрой автоматической проверки production-сборки.

### Текущий Стандарт Для Этого Проекта

В этом проекте сейчас используются такие команды:

- `npm start`
  Запускает target по умолчанию из корня монорепозитория.
  Сейчас target по умолчанию это `desktop`.

- `npm run dev`
  Явная dev-команда для выбранного target из корня.

- `npm start -- desktop`
  Явно запускает `desktop` из корня монорепозитория.

- `npm start -- --target desktop`
  То же самое в именованной форме параметра.

- `npm run check -- desktop`
  Запускает проверку выбранного target из корня монорепозитория.

- `npm run pack`
  Делает локальную упакованную сборку.

- `npm run dist`
  Делает финальную portable-сборку для Windows.

### Параметры И Переменные Окружения

Общее правило:

- визуальные стили должны жить в CSS;
- JavaScript должен переключать состояние, режим или классы;
- переменные окружения используем только для флагов запуска, тестов и средовых настроек.

Если проекту нужны дополнительные runtime-параметры, их надо документировать в этом файле.

Пример:

- `CTRLV_SMOKE=1`
  Включает smoke-test режим для этого проекта.

### Практические Замечания

- Пока проект активно разрабатывается, запускать его лучше через npm-скрипты, а не через готовый `.exe`.
- Если изменение в стилях не видно, сначала нужно проверить, действительно ли приложение использует исходники, а не переопределяет внешний вид в другом месте.
- Этот файл задуман как переиспользуемый шаблон: его можно копировать в другие проекты и менять только проектно-специфичный раздел.

### Финальный Стандарт, Который Мы Принимаем

Для будущих Electron-проектов принимаем такой стандарт:

- основная точка входа в проект — npm-скрипты;
- держим и `npm start`, и `npm run dev`;
- `npm start` считаем основной повседневной командой;
- `npm run dev` считаем явным техническим именем dev-режима;
- `npm run pack` и `npm run dist` держим как отдельные этапы сборки;
- все дополнительные флаги и параметры документируем в этом файле.
