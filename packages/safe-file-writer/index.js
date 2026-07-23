// Публичная точка входа для @local/safe-file-writer.
//
// Потребители импортируют только отсюда. Внутренние модули src/* не входят
// в публичный контракт и могут меняться без предупреждения.

export {
  version,
  DURABILITY,
  BACKUP_DEFAULTS,
  DEFAULTS,
  default as safeFileWriterConfig,
} from "./config.js";

// Основной фабричный API: durable-адаптер записи с отложенным бэкапом.
export { createSafeFileWriter } from "./src/writer.js";

// Низкоуровневые durable-примитивы для потребителей, которым нужен только fsync-фикс
// без планировщика бэкапа.
export { writeFileDurable, appendLineDurable } from "./src/durable-write.js";

// Карта package-зависимостей PackageLab (пустая: см. dependencies.js).
export { packageDependencies } from "./dependencies.js";
