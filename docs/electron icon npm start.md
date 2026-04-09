# Electron Icon For `npm start`

Этот файл нужен как отдельное техническое задание для другого проекта.

Цель: сделать так, чтобы при запуске Electron-приложения через:

```bash
npm start
```

в Windows показывалась иконка самого приложения, а не стандартная иконка Electron.

## Важное замечание

В текущих базовых инструкциях нового проекта это требование не зафиксировано достаточно явно.

Поэтому, если в другом проекте нужно сразу получить правильную иконку в taskbar и в окне приложения даже в dev-режиме, нужно отдельно передать ещё и этот файл.

## Что должно получиться

После реализации:

- `npm start` запускает desktop-target
- Electron-окно открывается с иконкой приложения
- Windows taskbar показывает иконку приложения
- при упаковке через `npm run pack` и `npm run dist` используется та же иконка

## Что обязательно нужно сделать

Нужно реализовать все пункты ниже одновременно.

Если пропустить хотя бы один из них, Windows может продолжить показывать стандартную иконку Electron.

Обязательно нужно:

1. Создать настоящий Windows-файл иконки `.ico`
2. Положить его в `desktop/assets/app.ico`
3. Завести стабильный `App User Model ID`
4. Передать иконку в `BrowserWindow`
5. На Windows вызвать `mainWindow.setIcon(...)`
6. На Windows вызвать `mainWindow.setAppDetails(...)`
7. До создания окна вызвать `app.setAppUserModelId(...)`
8. Если используется упаковка, прописать иконку ещё и в `desktop/package.json`

## Где должна лежать иконка

Минимально:

```text
desktop/
  assets/
    app.ico
```

Дополнительно можно хранить исходник:

```text
desktop/
  assets/
    app.ico
    app-icon.png
```

Но для Windows в рантайме важен именно файл `.ico`.

PNG сам по себе не заменяет полноценную Windows-иконку.

## Что должно быть в Electron main process

Ниже описан точный паттерн, который нужно реализовать в основном Electron-файле.

В текущем проекте это [main.js](/W:/MyIdeas/VibePlans/app/desktop/main.js).

### 1. Завести путь к иконке и стабильный app ID

Пример логики:

```js
const path = require('node:path');

const APP_ROOT = __dirname;
const APP_ICON_PATH = path.join(APP_ROOT, 'assets', 'app.ico');
const APP_USER_MODEL_ID = 'com.example.myapp.desktop';
```

Требования:

- `APP_USER_MODEL_ID` должен быть стабильным
- он не должен меняться между запусками
- для другого проекта нужно задать свой уникальный ID

Пример:

```text
com.company.product.desktop
```

## 2. Перед созданием окна вызвать `app.setAppUserModelId(...)`

Это нужно делать до создания главного окна.

Пример:

```js
app.whenReady().then(async () => {
  if (process.platform === 'win32') {
    app.setAppUserModelId(APP_USER_MODEL_ID);
  }

  await createMainWindow();
});
```

Без этого Windows часто продолжает считать приложение обычным Electron-процессом.

## 3. Передать иконку в `BrowserWindow`

При создании окна должен быть передан параметр `icon`.

Пример:

```js
const fsSync = require('node:fs');

async function createMainWindow() {
  const hasAppIcon = fsSync.existsSync(APP_ICON_PATH);

  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    title: 'My App',
    icon: hasAppIcon ? APP_ICON_PATH : undefined,
    webPreferences: {
      preload: path.join(APP_ROOT, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
}
```

## 4. На Windows дополнительно вызвать `setIcon(...)` и `setAppDetails(...)`

Этого шага лучше не пропускать.

Пример:

```js
if (process.platform === 'win32') {
  if (hasAppIcon) {
    mainWindow.setIcon(APP_ICON_PATH);
    mainWindow.setAppDetails({
      appId: APP_USER_MODEL_ID,
      appIconPath: APP_ICON_PATH
    });
  } else {
    mainWindow.setAppDetails({
      appId: APP_USER_MODEL_ID
    });
  }
}
```

Практически это означает:

- окно получает иконку
- Windows taskbar получает правильную идентичность приложения
- даже dev-запуск через `npm start` начинает показывать кастомную иконку вместо Electron

## 5. Что должно быть в `desktop/package.json`

Если проект поддерживает сборку, в `desktop/package.json` нужно указать иконку ещё и в build-конфигурации.

Минимальная логика:

```json
{
  "build": {
    "appId": "com.example.myapp.desktop",
    "productName": "My App",
    "win": {
      "icon": "assets/app.ico"
    }
  }
}
```

Если в проекте уже есть `electron-builder`, нужно убедиться, что:

- `build.appId` совпадает по смыслу с `APP_USER_MODEL_ID`
- `build.win.icon` указывает на `desktop/assets/app.ico`

## 6. Что нужно требовать от другого проекта

Если ты отдаёшь эту задачу в другой проект, нужно прямо написать:

- создать `desktop/assets/app.ico`
- завести стабильный `APP_USER_MODEL_ID`
- использовать иконку в `BrowserWindow`
- вызвать `app.setAppUserModelId(...)`
- вызвать `mainWindow.setIcon(...)`
- вызвать `mainWindow.setAppDetails({ appId, appIconPath })`
- если есть упаковка, прописать `build.win.icon` в `desktop/package.json`
- проверить результат именно при запуске через `npm start`

## Минимальный чек-лист для исполнителя

Исполнитель должен сделать следующее:

1. Создать файл `desktop/assets/app.ico`
2. Открыть Electron main file
3. Добавить путь к иконке
4. Добавить стабильный `APP_USER_MODEL_ID`
5. Вызвать `app.setAppUserModelId(...)` до создания окна
6. Передать `icon` в `BrowserWindow`
7. На Windows вызвать `mainWindow.setIcon(...)`
8. На Windows вызвать `mainWindow.setAppDetails(...)`
9. Если есть сборка, прописать `build.win.icon`
10. Проверить запуск через `npm start`

## Как проверять

После реализации нужно проверить:

```bash
npm install
npm start
```

И убедиться, что:

- открылось Electron-приложение
- в окне есть нужная иконка
- в панели задач Windows видна иконка приложения, а не Electron

Дополнительно, если есть сборка:

```bash
npm run pack
npm run dist
```

И проверить, что собранное приложение использует ту же иконку.

## Почему это важно фиксировать отдельно

Частая ошибка в новых Electron-проектах такая:

- приложение уже запускается через `npm start`
- окно открывается
- сборка работает
- но в taskbar остаётся стандартная иконка Electron

Обычно это происходит потому, что:

- не создан `.ico`
- не задан `App User Model ID`
- не вызван `setAppDetails(...)`
- иконка передана только в сборку, но не в dev-режим

Этот файл нужен именно для того, чтобы сразу потребовать правильную реализацию иконки и в dev-режиме тоже.

## Что передавать в другой проект

Если в другом проекте нужен такой же результат, вместе с основными файлами нужно передавать:

- [start new project.md](/W:/MyIdeas/VibePlans/app/docs/start%20new%20project.md)
- [npm.md](/W:/MyIdeas/VibePlans/app/docs/npm.md)
- этот файл: [electron icon npm start.md](/W:/MyIdeas/VibePlans/app/docs/electron%20icon%20npm%20start.md)

## Короткая формулировка задания для другой AI

Нужно создать Electron desktop-target в монорепозитории так, чтобы при запуске через `npm start` на Windows отображалась собственная иконка приложения, а не иконка Electron.

Для этого обязательно:

- создать `desktop/assets/app.ico`
- в main process использовать стабильный `APP_USER_MODEL_ID`
- вызвать `app.setAppUserModelId(...)`
- передать `icon` в `BrowserWindow`
- вызвать `mainWindow.setIcon(...)`
- вызвать `mainWindow.setAppDetails({ appId, appIconPath })`
- при наличии сборки указать `build.win.icon` в `desktop/package.json`
- проверить результат именно через `npm start`
