# AlionIT

Краткое описание:
статический web-сайт AlionIT Business School.

## Статус

Проект приведён к стандартной app-структуре MyIdeas.

Текущий runnable target:

- `web`

Desktop, mobile и server target-ы пока не созданы.

## Быстрый старт

Все команды запускаются из корня проекта:

```bash
npm install
npm run start -- web
```

## Основные команды

Набор команд соответствует `scripts` в корневом `package.json`.

- `npm run start -- web`
  Запускает web-target локально.

- `npm run dev -- web`
  Явный dev-запуск web-target-а.

- `npm run check -- web`
  Проверяет статический web-target.

- `npm run build -- web`
  Копирует статические файлы в `dist/web`.

## Структура проекта

`apps/` собирает все варианты приложения внутри проекта. Сейчас runnable target
один: `web`.

```text
apps/
  web/
packages/
  README.md
  packages.jsonc
scripts/
  run.mjs
  targets/
    index.mjs
    web.mjs
docs/
  start.md
data/
  .gitkeep
dist/
  web/
temp/

README.md
CHANGELOG.md
VERSIONS.jsonc
package.json
package-lock.json
.gitignore
.gitattributes
```

`data/` пока не содержит проектных данных и удерживается через `.gitkeep`.
`dist/` используется только для generated build artifacts.

## Версии

Правила ведения версий находятся в [VERSIONS.jsonc](./VERSIONS.jsonc). В README
схема версий не дублируется.

[CHANGELOG.md](./CHANGELOG.md) - журнал изменений по release-ам в `VERSIONS.jsonc`.

## Документация

- [Общие правила MyIdeas](../../_docs/README.md)
- [Workflow](../../_docs/workflow.md)
- [New Project](../../_docs/new project/start new project.md)
- [NPM Workflow](../../_docs/new project/npm.md)
- [PackageLab и правила пакетов](../../AlionIT/package-lab/README.md)
- [Интеграция пакетов](../../AlionIT/package-lab/_docs/consumers/package-integration.md)
- [README Template](../../_docs/new project/templates/_readme.md)
- [Start notes](./docs/start.md)
- [Local package layer](./packages/README.md)
- [Changelog](./CHANGELOG.md)

## Примечания

- Повседневная разработка идёт через `npm run dev -- web`.
- `dist/web` создаётся командами сборки и не является исходным кодом.
