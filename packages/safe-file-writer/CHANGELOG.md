# CHANGELOG

История опубликованных версий пакета `safe-file-writer`.

## 0.1.0

### Added

- Первый релиз пакета durable-записи файлов на диск с отложенным бэкапом версий.
- `createSafeFileWriter({ baseDir, durability, fsyncDir, backup, onBackupError })` —
  durable-адаптер записи (`writeFile`/`writeFileAtomic`, `appendLine`, `readText`,
  `readBytes`, `exists`, `ensureDir`, `remove`, `removeDir`, `list`, `rename`, `resolve`).
- Durable-запись основного файла: `tmp → writeFile → fsync(данные) → rename → fsync(каталога
  best-effort)`. Закрывает кейс «файл нужного размера из нулей» после жёсткого сбоя на NTFS.
- Параметр `backup` в записи: отложенный, разнесённый во времени бэкап версий. Debounce
  `delayMs` с жёстким потолком `maxDelayMs`, per-path сериализация, ротация `keepVersions`,
  настраиваемые каталог (`dir`) и расширение (`suffix`).
- Восстановление: `listBackups(rel)` и `restore(rel, { version })`.
- Управление фоновым бэкапом: `flush(rel?)` и `close()`.
- Низкоуровневые примитивы `writeFileDurable` и `appendLineDurable`.
- Настройки durability и задержек бэкапа в `config.js` (`DURABILITY`, `BACKUP_DEFAULTS`).
