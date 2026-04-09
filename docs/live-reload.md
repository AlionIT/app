# Live Reload For Electron Monorepos

Этот файл нужен как рабочая инструкция для других проектов.

Его задача: помочь быстро понять,

- есть ли в проекте live reload вообще
- какой именно вид live reload используется
- что лучше выбрать для простого Electron desktop-проекта
- как внедрить это с минимальным количеством проблем

## Короткий вывод

Для проектов такого типа лучше не тащить тяжёлый bundler только ради live reload.

Оптимальный вариант для этого класса проектов:

- мягкая перезагрузка renderer-части при изменении `css`, `html`, `renderer.js`
- полный restart Electron только при изменении `main.js`, `preload.js`, `package.json`

Это быстрее в повседневной работе, чем ручной перезапуск,
но заметно проще и надёжнее, чем полноценный большой dev-server stack.

## Как проверить, есть ли live reload в проекте

Проверять нужно в нескольких местах.

### 1. Проверить `package.json`

Смотреть нужно:

- корневой `package.json`
- `desktop/package.json`

Признаки, что live reload уже есть:

- `vite`
- `webpack`
- `webpack-dev-server`
- `electron-reload`
- `electronmon`
- `nodemon`
- `chokidar`
- отдельный dev launcher script

Если `dev` это просто:

```json
"dev": "electron ."
```

то live reload, скорее всего, отсутствует.

### 2. Проверить Electron main process

Нужно открыть основной Electron-файл.

Смотреть, есть ли:

- watcher на файлы
- `process.on('message', ...)`
- `webContents.reload()`
- `webContents.reloadIgnoringCache()`
- логика restart приложения при изменении файлов

### 3. Проверить dev launcher script

Если в проекте уже есть файл наподобие:

- `scripts/dev-desktop.js`
- `scripts/dev-electron.js`
- `scripts/electron-dev.js`

нужно проверить, не реализован ли watcher там.

### 4. Проверить фактически

Самая надёжная проверка:

1. Запустить проект через `npm start`
2. Поменять одно заметное значение в CSS
3. Сохранить файл
4. Посмотреть, произошло ли обновление без ручного restart

Если ничего не произошло, live reload отсутствует или работает не для CSS.

## Какие бывают виды live reload

### 1. Полноценный bundler dev server

Примеры:

- Vite
- Webpack dev server
- React/Vue dev environment

Плюсы:

- быстрые обновления
- часто есть HMR
- хорошо подходит для SPA и фронтенд-фреймворков

Минусы:

- заметно сложнее инфраструктура
- больше зависимостей
- больше точек отказа
- для простого статического Electron UI часто избыточно

### 2. Полный restart приложения на любой change

Примеры:

- `electronmon`
- `nodemon`
- `electron-reload` в режиме полного restart

Плюсы:

- просто объяснить
- просто внедрить

Минусы:

- медленнее
- раздражает при частых CSS-правках
- теряется локальное состояние окна и текущий контекст чаще, чем нужно

### 3. Смешанный режим: soft reload + hard restart

Это тот вариант, который используется у нас и который лучше всего подходит для таких проектов.

Идея:

- `css`, `html`, `renderer.js`, обычные изображения:
  только reload renderer
- `main.js`, `preload.js`, `package.json`, `.ico`:
  restart Electron процесса

Плюсы:

- быстрее ручной разработки
- не требует тяжёлого фронтенд-стека
- лучше подходит для обычного Electron на `index.html + css + renderer.js`
- меньше шансов сломать текущую архитектуру

Минусы:

- это не настоящий HMR
- изменения main/preload всё равно требуют restart
- при reload renderer можно потерять несохранённый UI state

## Какой вариант считать оптимальным

Для простого desktop-проекта на Electron без React/Vite/Webpack оптимальным считаем именно смешанный режим:

- лёгкий watcher
- renderer reload для UI-изменений
- process restart только для main/preload

Это хороший компромисс между:

- скоростью
- простотой
- устойчивостью

## Как это реализовано в текущем проекте

В этом проекте используются следующие точки:

- launcher script: [dev-desktop.js](/W:/MyIdeas/VibePlans/app/scripts/dev-desktop.js)
- desktop dev script: [package.json](/W:/MyIdeas/VibePlans/app/desktop/package.json)
- bridge в Electron main: [main.js](/W:/MyIdeas/VibePlans/app/desktop/main.js)

Логика такая:

- `npm start`
- корень маршрутизирует запуск в `desktop`
- `desktop/package.json` запускает `node ../scripts/dev-desktop.js`
- launcher script следит за файлами в `desktop/`
- при изменении renderer-части отправляет сообщение в Electron main process
- Electron main process делает `webContents.reloadIgnoringCache()`
- при изменении main/preload launcher полностью перезапускает Electron

## Пошагово, как сделать это в другом проекте

### Шаг 1. Проверить, нет ли уже существующего live reload

Сначала проверить:

- `package.json`
- `desktop/package.json`
- `main.js`
- `preload.js`
- `scripts/`

Если проект уже использует Vite или другой dev server, не надо поверх этого накручивать второй watcher.

Сначала нужно понять существующую схему.

### Шаг 2. Если проект простой, выбрать смешанный режим

Если проект работает по схеме:

- `index.html`
- `css/*.css`
- `renderer.js`
- `main.js`
- `preload.js`

лучше использовать не bundler, а лёгкий launcher script.

### Шаг 3. Добавить watcher-зависимость

Рекомендуемый вариант:

```bash
npm install --save-dev chokidar
```

Почему именно так:

- `chokidar` надёжнее обычного `fs.watch`
- меньше сюрпризов на Windows
- меньше проблем с пачкой изменений при сохранении файлов

### Шаг 4. Сделать отдельный dev launcher script

Рекомендуемое место:

```text
scripts/dev-desktop.js
```

Этот файл должен:

- запускать Electron как дочерний процесс
- следить за `desktop/`
- понимать, какие изменения требуют reload, а какие restart
- отправлять IPC-сообщение в Electron main process для renderer reload

### Шаг 5. Настроить `desktop/package.json`

Рекомендуемый смысл:

```json
{
  "scripts": {
    "start": "npm run dev",
    "dev": "node ../scripts/dev-desktop.js",
    "dev:plain": "electron ."
  }
}
```

Почему полезно оставить `dev:plain`:

- это аварийный fallback
- если watcher ломается, можно быстро вернуться к простому запуску

### Шаг 6. Добавить bridge в main process

В Electron main process нужно добавить обработку сообщения от launcher script.

Идея:

- launcher отправляет `plans:reload-renderer`
- main process получает это сообщение
- активное окно вызывает `webContents.reloadIgnoringCache()`

Такой bridge работает только в dev и не должен использоваться в packaged build.

### Шаг 7. Разделить типы файлов на soft/hard reload

Рекомендуемое правило:

Soft reload:

- `index.html`
- `renderer.js`
- `css/**/*`
- обычные изображения интерфейса

Hard restart:

- `main.js`
- `preload.js`
- `package.json`
- `.ico`

Это снижает количество лишних restart и делает работу с CSS заметно быстрее.

### Шаг 8. Сделать debounce

Watcher должен не дёргать reload на каждое микрособытие.

Нужно:

- объединять быстрые серии событий
- делать небольшую задержку перед reload/restart

Практически это уменьшает дрожание при сохранении файлов редактором.

## Что лучше не делать

Лучше не делать так:

- использовать полный restart Electron на каждую CSS-правку, если можно reload только renderer
- тащить Vite/Webpack только ради CSS reload в простом проекте
- делать два разных watcher-механизма сразу
- включать dev reload в packaged build

## С какими проблемами можно столкнуться

### 1. Изменился CSS, но ничего не произошло

Причины:

- watcher не следит за этим файлом
- сохранение попало в ignored path
- в проекте правится не тот CSS-файл
- позднее подключённый CSS переопределяет стиль

### 2. Изменился `main.js`, но приложение не изменилось

Причина:

- был сделан только renderer reload, а нужен был полный restart

### 3. Слишком много лишних reload

Причины:

- нет debounce
- watcher слушает слишком много файлов
- редактор пишет файлы в несколько этапов

### 4. Теряется состояние интерфейса

Это нормально:

- renderer reload перезагружает страницу
- значит несохранённое UI state может потеряться

Если это критично, нужно отдельно сохранять состояние или использовать более сложный HMR-подход.

## Минимальный чек-лист для другого проекта

1. Проверить, нет ли уже существующего live reload
2. Если проект простой, выбрать смешанный режим
3. Установить `chokidar`
4. Создать `scripts/dev-desktop.js`
5. Переключить `desktop/package.json` на launcher script
6. Добавить bridge в `main.js`
7. Разделить soft reload и hard restart
8. Проверить руками на CSS
9. Проверить руками на `renderer.js`
10. Проверить руками на `main.js`

## Как проверить, что всё сделано правильно

### Проверка CSS

1. Запустить:

```bash
npm start
```

2. Изменить значение в CSS
3. Сохранить файл
4. Убедиться, что окно обновилось без ручного перезапуска

### Проверка renderer

1. Изменить `renderer.js`
2. Сохранить
3. Убедиться, что окно обновилось

### Проверка main/preload

1. Изменить `main.js` или `preload.js`
2. Сохранить
3. Убедиться, что Electron перезапустился полностью

## Что передавать в другой проект

Если нужно повторить такую же схему в другом проекте, вместе с основной структурой лучше передавать:

- [start new project.md](/W:/MyIdeas/VibePlans/app/docs/start%20new%20project.md)
- [npm.md](/W:/MyIdeas/VibePlans/app/docs/npm.md)
- этот файл: [live-reload.md](/W:/MyIdeas/VibePlans/app/docs/live-reload.md)

## Короткая формулировка задания для другой AI

Нужно проверить, есть ли в проекте live reload.

Если его нет и проект представляет собой простой Electron desktop без тяжёлого frontend bundler, нужно внедрить смешанный dev-only live reload:

- `css/html/renderer` обновлять через renderer reload
- `main/preload/package.json/.ico` обновлять через полный restart Electron
- использовать лёгкий launcher script, а не тяжёлый dev server
- использовать `chokidar`
- не включать эту механику в production build
