# AlionIT

Краткое описание:
AlionIT — проект онлайн бизнес-школы и стартап-сообщества. На текущем этапе репозиторий содержит монорепозиторий с desktop-прототипом на Electron, который используется как рабочая оболочка будущего сайта.

## Статус

Прототип в активной разработке.

Текущий рабочий target по умолчанию:

- `desktop`

## Быстрый старт

Все команды запускаются из корня репозитория:

```bash
npm install
npm start
```

## Основные команды

- `npm install`
  Устанавливает зависимости проекта.

- `npm start`
  Запускает target по умолчанию. Сейчас это `desktop`.

- `npm start -- desktop`
  Явно запускает desktop-target.

- `npm start -- --target desktop`
  Именованная форма выбора desktop-target.

- `npm run dev -- desktop`
  Явная dev-команда для desktop-target.

- `npm run check -- desktop`
  Проверяет desktop-часть проекта.

- `npm run pack`
  Собирает локальную упакованную desktop-версию для проверки.

- `npm run dist`
  Собирает финальный Windows portable-пакет.

- `npm start -- web`
- `npm start -- mobile`
- `npm start -- server`
  Если эти target-ы ещё не настроены, они возвращают понятную заглушку.

## Структура проекта

- `desktop/`
  Основной desktop-target на Electron. Сейчас используется как прототип интерфейса будущего сайта AlionIT.

- `web/`
  Направление для будущей web-части проекта.

- `mobile/`
  Направление для будущей mobile-части проекта.

- `server/`
  Направление для backend / service layer.

- `scripts/`
  Вспомогательные скрипты проекта, включая маршрутизатор target-ов.

- `docs/`
  Документация, стандарты запуска и внутренние правила работы.

## Документация

- [Workflow](./docs/workflow.md)
- [NPM workflow](./docs/npm.md)
- [Start](./docs/start.md)
- [Electron icon for npm start](./docs/electron%20icon%20npm%20start.md)
- [Live reload](./docs/live-reload.md)
- [Start new project](./docs/start%20new%20project.md)
- [Changelog](./CHANGELOG.md)

## Примечания

- Проект развивается как бизнес-школа и сообщество для стартапов, а не как отдельная IT-школа.
- IT, AI, продуктовые и цифровые инструменты рассматриваются как часть стартап-практики.
- Desktop-приложение запускается через npm-скрипты из корня монорепозитория.
- Для smoke-проверки desktop-запуска можно выставить `ALIONIT_SMOKE=1`, чтобы приложение автоматически закрылось после успешного старта.
