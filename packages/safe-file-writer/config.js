export const version = "0.1.0";

// Уровень durability основной записи:
//   "fsync" — tmp -> writeFile -> fsync(data) -> rename -> fsync(dir best-effort).
//             Гарантирует, что данные физически на диске ДО rename. Именно отсутствие
//             этого шага давало "файл нужного размера из нулей" после жёсткого сбоя.
//   "none"  — tmp -> writeFile -> rename без fsync. Быстрее, но без гарантии durability.
//             Допустимо только для одноразовых/восстановимых файлов.
export const DURABILITY = Object.freeze({
  fsync: "fsync",
  none: "none",
});

// Настройки отложенного бэкапа. Задержки живут здесь и переопределяются приложением
// на инстанс (createSafeFileWriter({ backup })) или на конкретный вызов
// (writeFile(rel, data, { backup: { ... } })).
export const BACKUP_DEFAULTS = Object.freeze({
  // Каталог бэкапа. null -> рядом с основным файлом. Относительный путь резолвится от
  // baseDir, абсолютный — как есть. Формат имени файла (<basename>.bak) не зависит от
  // расположения.
  dir: null,

  // Сколько версий бэкапа хранить. 1 -> один <name>.bak (атомарно заменяется).
  // N -> <name>.bak (новейшая) + <name>.bak.1 .. <name>.bak.(N-1) (старее).
  keepVersions: 1,

  // Стандартное расширение бэкапа.
  suffix: ".bak",

  // Debounce: бэкап пишется через delayMs "тишины" после последней записи файла.
  // Быстрые повторные записи одного файла коалесцируются в один бэкап.
  delayMs: 3000,

  // Жёсткий потолок задержки. Даже если файл пишется непрерывно (напр. ui.json на
  // каждый захват буфера), бэкап всё равно делается не реже maxDelayMs. Это и есть
  // разнесение во времени: бэкап ложится на диск ПОЗЖЕ основного файла, поэтому одно
  // окно сбоя не может задеть и рабочий файл, и бэкап сразу.
  maxDelayMs: 15000,
});

const config = Object.freeze({
  version,
  durability: DURABILITY.fsync,
  fsyncDir: true,
  backup: BACKUP_DEFAULTS,
});

// Общий объект дефолтов, который читает writer.
export const DEFAULTS = Object.freeze({
  durability: config.durability,
  fsyncDir: config.fsyncDir,
  backup: BACKUP_DEFAULTS,
});

export default config;
