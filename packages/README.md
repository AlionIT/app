# Packages

> Правила package-слоя стандартного проекта живут в PackageLab:
> - `W:\MyIdeas\AlionIT\package-lab\README.md`;
> - `W:\MyIdeas\AlionIT\package-lab\_docs\consumers\package-installation.md`;
> - `W:\MyIdeas\AlionIT\package-lab\_docs\consumers\package-integration.md`;
> - `W:\MyIdeas\AlionIT\package-lab\_docs\developers\project-local-packages.md`.
>
> Этот файл описывает локальный package-слой проекта и не является копией
> старого общего регламента MyIdeas.

## Локальный слой поставки пакетов

`app\packages` - это локальный слой поставки first-party/runtime-пакетов для
конкретного приложения. Runtime-код приложения должен импортировать такие пакеты
только из этой папки, а не напрямую из PackageLab `_stable`, соседних проектов,
абсолютных путей или произвольных внешних каталогов.

Состав локального слоя описан в `packages\packages.jsonc`. Конкретный список
пакетов проекта хранится только там и в README самих пакетов, а не в этом
стандартном README.

`packages\packages.jsonc` управляет двумя типами пакетов:

- managed-копиями из PackageLab Stable (`origin: "packagelab-stable"`),
  расположенными в `app\packages\<target>` и связанными с источником
  `W:\MyIdeas\AlionIT\package-lab\_stable\<package>`;
- project-local пакетами (`origin: "project-local"`), которые принадлежат
  только этому проекту, уже живут в `app\packages\<target>` и не устанавливаются,
  а только проверяются.

Обычные npm-зависимости управляются через `package.json` приложения. Этот
документ описывает только first-party/runtime-пакеты локального слоя.

## Обязательное правило для агентов

Любой агент, работающий с first-party/runtime-пакетами проекта, обязан считать
`app\packages` единственным разрешённым источником таких пакетов для runtime-кода
приложения.

Запрещено:

- добавлять runtime-импорты напрямую из `W:\MyIdeas\AlionIT\package-lab`,
  PackageLab `_stable`, соседних проектов, абсолютных путей или произвольных
  внешних папок;
- вручную копировать пакет в код приложения или в обход
  `packages\packages.jsonc`;
- менять PackageLab или managed-пакет как способ быстро починить приложение,
  если задача явно не разрешает работу с этим пакетом;
- добавлять новый пакет в `app\packages` без записи в `packages\packages.jsonc`.

Если приложению нужен новый first-party пакет:

1. Найти или согласовать источник пакета: PackageLab Stable для глобального
   пакета или `project-local` для пакета, который принадлежит только этому
   проекту.
2. Добавить или обновить запись в `packages\packages.jsonc`.
3. Разместить или обновить пакет в `app\packages\<target>` и проверить его
   соответствие записи реестра.
4. Подключать пакет в runtime-коде только из локального пути
   `app\packages\<target>`.

Если нужного пакета нет в PackageLab Stable, версия или `dbFormatVersion` не
совпадает, либо нужно менять сам глобальный пакет, агент останавливается и
сообщает пользователю или владельцу пакетов. Решение о правке PackageLab
принимается отдельно.

## packages.jsonc

Файл `packages\packages.jsonc` лежит рядом с этим README и является реестром
локального слоя.

Минимальная структура:

```jsonc
{
  "schemaVersion": 1,
  "defaults": {
    "updateMode": "manual",
    "versionPolicy": "exact",
    "onMismatch": "fail",
    "exclude": [
      "node_modules/**",
      ".git/**",
      "temp-data/**",
      "_temp/**"
    ]
  },
  "packages": {
    "package-name": {
      "origin": "packagelab-stable",
      "source": "W:/MyIdeas/AlionIT/package-lab/_stable/package-name",
      "target": "package-name",
      "kind": "runtime",
      "versionPolicy": "exact",
      "version": "0.1.0",
      "updateMode": "manual",
      "onMismatch": "fail",
      "entry": "index.js"
    }
  }
}
```

Свойства пакета:

- `origin` - источник пакета. Допустимо `packagelab-stable` или
  `project-local`.
- `source` - путь к исходному пакету. Обязателен для `packagelab-stable`, не
  нужен для `project-local`.
- `target` - имя папки внутри `app\packages`.
- `kind` - смысловая категория пакета: например `database`, `runtime`, `ui`,
  `asset`, `util`, `config`.
- `versionPolicy` - политика версии. `exact` требует указанную `version`;
  `track` берёт текущую версию из источника или локального пакета.
- `version` - ожидаемая версия для `versionPolicy: "exact"`.
- `dbFormatVersion` - версия формата данных для database-пакетов, если пакет её
  объявляет.
- `updateMode` - объявленная политика обновления managed-копии.
- `onMismatch` - поведение при несовпадении: `fail` останавливает проверку,
  `warn` печатает предупреждение.
- `entry` - публичная точка входа, обычно `index.js`.
- `exclude` - шаблоны файлов, которые не копируются из managed-источника.

### updateMode

- `manual` - пакет обновляется только осознанно.
- `start-check` - при стартовой автоматизации новая версия только обнаруживается,
  но не устанавливается.
- `start-sync` - при стартовой автоматизации пакет синхронизируется с источником.

Для database-пакетов используется `versionPolicy: "exact"`,
`updateMode: "manual"` и явный `dbFormatVersion`, если формат данных есть.
База данных не должна незаметно обновляться при обычном запуске приложения.

## Именование пакетов

Глобальные пакеты из PackageLab Stable сохраняют переносимое имя пакета:

```text
lite-editor
color-panel
icon-kit
notes-db
```

Project-local пакеты, которые принадлежат только одному проекту, получают
префикс проекта:

```text
project-name-board-core
project-name-mentor-core
project-name-product-limits
```

Короткие папки с подчёркиванием вроде `_board-core` для project-local пакетов не
используются. Длинное имя лучше: оно сразу показывает, какому проекту принадлежит
пакет и что это полноценный пакет, а не служебная папка.

Главный суффикс для чистого переносимого ядра:

```text
*-core
```

`-core` используется только для бизнес-логики, схем данных, нормализации,
валидации, расчётов и state transitions. Core-пакет не должен содержать UI, DOM,
Electron IPC, `BrowserWindow`, Node `fs`, platform-native API, storage
конкретного приложения или runtime-данные.

Если пакет является готовым reusable-компонентом, runtime-слоем, UI-пакетом или
набором конфигурации, суффикс `-core` не используется.

Дополнительные platform-суффиксы `*-electron`, `*-web`, `*-native` являются
запасным инструментом и используются только для самостоятельных reusable
platform-пакетов, если они действительно понадобились.

## Структура packages

```text
packages/
  README.md
  packages.jsonc
  package-name/
    VERSION
    README.md
    package.json
    index.js
    config.js
```

Папки без нижнего подчёркивания считаются полноценными пакетами. Папки с нижним
подчёркиванием являются служебными зонами и не считаются пакетами.

Новые служебные зоны нельзя добавлять без отдельного решения. Не создавайте
расплывчатые папки:

```text
packages/utils/
packages/helpers/
packages/common/
packages/shared/
```

Для самостоятельных компонентов используются полноценные пакеты с конкретным
именем. Для простой общей логики предпочтительнее маленький полноценный пакет с
ясным именем, а не безымянная общая свалка.

## Полноценный пакет

Обязательные правила:

- пакет всегда ESM-only;
- `package.json` содержит `"type": "module"`;
- публичная точка входа одна: `index.js`;
- проект-потребитель импортирует пакет через публичный API, а не через
  внутренние файлы;
- версия в `VERSION` и `package.json` совпадает;
- README пакета описывает назначение, подключение, API, конфигурацию и
  требования;
- пакет не хранит пользовательские данные внутри своей папки;
- пакет не пишет runtime-логи внутрь `packages\package-name`;
- если пакету нужен debug-log, путь передаёт проект-потребитель, например
  `temp\package-name.log`.

Пример `package.json`:

```json
{
  "name": "@local/package-name",
  "version": "0.1.0",
  "private": true,
  "description": "Portable local package.",
  "main": "index.js",
  "exports": {
    ".": "./index.js"
  },
  "type": "module",
  "license": "MIT"
}
```

Пример публичного импорта:

```js
import { createPackageFeature } from "./packages/package-name/index.js";
```

Не импортируйте внутренние файлы пакета:

```js
// Плохо:
import { createPackageFeature } from "./packages/package-name/main/internal-file.js";
```

Если приложению нужна новая публичная функция, экспортируйте её из `index.js`
пакета и опишите в README пакета.

## VERSION

Файл `VERSION` обязателен для полноценного пакета. В нём должна быть только
версия:

```text
0.1.0
```

Формат версии:

```text
MAJOR.MINOR.PATCH
```

Правила повышения версии:

- `PATCH` - исправление бага без изменения публичного API.
- `MINOR` - новая возможность без поломки старого подключения.
- `MAJOR` - изменение публичного API или поведения, требующее правок у
  потребителя.

При изменении пакета обновляются вместе:

- `VERSION`;
- `package.json` -> `version`;
- README пакета, если изменилось подключение, API или поведение.

## README пакета

README обязателен для полноценного пакета. Он должен позволять подключить пакет
без поиска по проекту.

В README пакета должны быть:

- название пакета;
- текущая версия;
- короткое назначение;
- список файлов и папок;
- пример подключения;
- пример базового использования;
- публичный API;
- конфигурация;
- требования к среде;
- что делает пакет;
- что должен делать проект-потребитель.

Для Electron-пакетов дополнительно описываются:

- где создаётся окно;
- какие preload/IPC каналы используются;
- какие callbacks должен передать проект;
- какие permissions нужны;
- какие файлы должны попасть в сборку.

## config.js пакета

`config.js` обязателен для полноценного пакета. В нём лежат дефолтные настройки
пакета:

- размеры окон и панелей;
- тексты;
- цвета;
- поведение по умолчанию;
- IPC channel names;
- имена публичных API;
- лимиты;
- таймауты;
- настройки визуализации.

`config.js` должен быть ESM:

```js
export const version = "0.1.0";

const config = Object.freeze({
  version,
});

export default config;
```

## App adapters

Если пакету нужна обвязка под конкретное приложение (`desktop`, `web`,
`mobile`), эта обвязка не создаётся в `packages` как отдельный пакет по
умолчанию. Она размещается внутри приложения:

```text
apps/desktop/src/package-adapters/
apps/web/src/package-adapters/
apps/mobile/src/package-adapters/
```

Adapter-модули являются обычными ESM-модулями приложения. У отдельных adapter-ов
нет собственных `package.json`, `VERSION`, README и статуса пакета.

Разрешённое исключение: в корне каталога `apps/*/src/package-adapters/` может
лежать один служебный `package.json` с единственным содержимым:

```json
{ "type": "module" }
```

Это технический ESM-маркер для всей папки `package-adapters`, а не
`package.json` конкретного adapter-а. В такой файл нельзя добавлять `name`,
`version`, `main`, `exports`, `dependencies`, `scripts` или README.

## Что не делать

Не кладите код конкретного приложения в переносимый пакет, если этот код нельзя
переиспользовать через публичные options/callbacks.

Не импортируйте из пакета файлы приложения:

```js
// Плохо:
import { addEntry } from "../../src/main/history.js";
```

Пакет должен получать интеграцию через публичные options/callbacks.

Не храните runtime-данные внутри `packages`.

Не добавляйте новый CommonJS-код, `require(...)`, `module.exports`, `.cjs`,
UMD/IIFE/global-wrapper для новых пакетов.

## Legacy-код

Если в `packages` уже есть CommonJS или смешанный формат, это legacy. Его можно
использовать до миграции, но нельзя брать как образец.

Новые изменения должны двигать код к единому стандарту:

```text
ESM only.
```

Если агент обновляет legacy-пакет и задача позволяет, он должен перевести
публичный контракт пакета на ESM-only и обновить README/VERSION/package.json по
этому стандарту.

## Чеклист для нового пакета

- Папка создана в `packages\<package-name>`.
- Имя папки lowercase, через дефис.
- Есть запись в `packages\packages.jsonc`.
- Есть `VERSION`.
- Есть `README.md`.
- Есть `package.json`.
- Есть `index.js`.
- Есть `config.js`.
- В `package.json` стоит `"type": "module"`.
- Версия в `VERSION` совпадает с `package.json`.
- `index.js` использует ESM `export`.
- `config.js` использует ESM `export`.
- Нет `require(...)`.
- Нет `module.exports`.
- Нет `.cjs`.
- Публичное подключение идёт через `index.js`.
- README описывает API и подключение.
- Пакет не хранит пользовательские данные.
- Пакет не пишет логи внутрь `packages`.
- Runtime-код приложения импортирует пакет только из `app\packages`.
