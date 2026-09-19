# CHANGELOG

- **CHANGELOG.md**: ведётся на двух языках:
  - на английском языке: названия разделов (`Added`, `Changed`, `Fixed`), названия коммитов, имена файлов, API и все технические идентификаторы;
  - на русском языке: описание изменений и их назначения.

- **CHANGELOG.md** - журнал изменений по release-ам в VERSIONS.jsonc.
  - Все заметные изменения проекта документируются в этом файле.
  - Файл не обновляется на каждый commit.
  - Изменения обычно собираются при подготовке версии и тега.

- **Версии, даты и разделы**:
  - Каждая выпущенная версия оформляется заголовком:
    `## [MAJOR.MINOR.PATCH] - YYYY-MM-DD`.
  - Дата указывается в формате ISO `YYYY-MM-DD` и означает дату выпуска версии.
  - `[Unreleased]` даты не имеет и, если используется, располагается первым;
  - выпущенные версии располагаются от новых к старым;
  - Перед каждой новой записываемой версией в CHANGELOG.md оставляются ровно три пустые строки для визуального разделения блоков версий.
  - В каждой версии разделы располагаются в таком порядке:

    ```markdown
    ### Added
    ### Changed
    ### Fixed
    ```

  - `Added` — новые возможности, API, файлы и функции.
  - `Changed` — изменения существующего поведения, API, конфигурации или структуры.
  - `Fixed` — исправления ошибок и проблем.
  - Названия разделов всегда пишутся на английском языке.
  - Пустые разделы сохраняются как часть шаблона.
  - После выпуска записи из `[Unreleased]` переносятся в раздел версии с датой.



##

## [v0.1.0] - 2026-07-06

### Added
- Created a clean standard MyIdeas app structure with a single `apps/web` target.
- Added the first static AlionIT Business School landing page.
- Added root target routing for `start`, `dev`, `check`, and `build`.
- Added the standard local package layer with an empty package registry.

### Changed
- Removed the legacy desktop, mobile, server, root web, copied docs, and unused environment scaffolding.
