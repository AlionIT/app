import { promises as fs } from "node:fs";
import { dirname, isAbsolute, join, resolve as resolvePath } from "node:path";

import { DEFAULTS, version } from "../config.js";
import { writeFileDurable, appendLineDurable } from "./durable-write.js";
import { createBackupScheduler } from "./backup-scheduler.js";
import { resolveBackupDir, backupBaseName, backupVersionPath } from "./paths.js";

// safe-file-writer: durable-адаптер записи на диск с отложенным бэкапом версий.
//
// Через него должна проходить вся запись приложения. Два слоя защиты:
//   1) основной файл всегда пишется durable (tmp + fsync + rename) — это фикс "79 нулей";
//   2) при { backup: true } дополнительно ведётся разнесённый во времени бэкап версий.

function mergeBackupDefaults(userBackup) {
  const b = DEFAULTS.backup;
  const u = userBackup || {};
  return {
    dir: u.dir ?? b.dir,
    keepVersions: u.keepVersions ?? b.keepVersions,
    suffix: u.suffix ?? b.suffix,
    delayMs: u.delayMs ?? b.delayMs,
    maxDelayMs: u.maxDelayMs ?? b.maxDelayMs,
  };
}

export function createSafeFileWriter(options = {}) {
  const { baseDir } = options;
  if (!baseDir || typeof baseDir !== "string") {
    throw new TypeError("createSafeFileWriter требует { baseDir: string }.");
  }

  const root = resolvePath(baseDir);
  const durability = options.durability === "none" ? "none" : "fsync";
  const fsyncDir = options.fsyncDir !== false;

  // Дефолты бэкапа = config <- options.backup, плюс durability/fsyncDir для durable-записи
  // самих файлов бэкапа.
  const backupDefaults = Object.freeze({
    ...mergeBackupDefaults(options.backup),
    durability,
    fsyncDir,
  });

  const onError = typeof options.onBackupError === "function"
    ? options.onBackupError
    : (error, rel) => {
        // eslint-disable-next-line no-console
        console.error(`[safe-file-writer] backup failed for ${rel}:`, error);
      };

  const scheduler = createBackupScheduler({ root, defaults: backupDefaults, onError });

  const abs = (rel) => {
    if (rel === "." || rel === "") return root;
    return isAbsolute(rel) ? rel : join(root, rel);
  };

  function scheduleBackup(rel, data, opts) {
    if (!opts || !opts.backup) return;
    const backupOptions = opts.backup === true ? undefined : opts.backup;
    scheduler.set(rel, data, backupOptions);
  }

  // --- запись ---------------------------------------------------------------

  async function writeFile(rel, data, opts = {}) {
    await writeFileDurable(abs(rel), data, { durability, fsyncDir });
    scheduleBackup(rel, data, opts);
  }

  async function appendLine(rel, line, opts = {}) {
    await appendLineDurable(abs(rel), line, { durability });
    // Бэкап append-файла = периодическая полная копия текущего содержимого. Дорого на
    // больших JSONL, поэтому это осознанный opt-in; append и так безопаснее полной
    // перезаписи (старые строки уже на диске).
    if (opts && opts.backup) {
      const current = await fs.readFile(abs(rel)).catch(() => null);
      if (current !== null) scheduleBackup(rel, current, opts);
    }
  }

  // --- чтение / обслуживание -----------------------------------------------

  async function readText(rel) {
    try {
      return await fs.readFile(abs(rel), "utf8");
    } catch (error) {
      if (error.code === "ENOENT") return null;
      throw error;
    }
  }

  async function readBytes(rel) {
    try {
      return await fs.readFile(abs(rel));
    } catch (error) {
      if (error.code === "ENOENT") return null;
      throw error;
    }
  }

  async function exists(rel) {
    try {
      await fs.access(abs(rel));
      return true;
    } catch {
      return false;
    }
  }

  async function ensureDir(rel = ".") {
    await fs.mkdir(abs(rel), { recursive: true });
  }

  async function remove(rel) {
    await fs.rm(abs(rel), { force: true }).catch((error) => {
      if (error.code !== "ENOENT") throw error;
    });
  }

  async function removeDir(rel) {
    await fs.rm(abs(rel), { force: true, recursive: true }).catch((error) => {
      if (error.code !== "ENOENT") throw error;
    });
  }

  async function list(rel = ".") {
    try {
      return await fs.readdir(abs(rel));
    } catch (error) {
      if (error.code === "ENOENT") return [];
      throw error;
    }
  }

  async function rename(fromRel, toRel) {
    const to = abs(toRel);
    await fs.mkdir(dirname(to), { recursive: true });
    await fs.rename(abs(fromRel), to);
  }

  // --- бэкап: flush / восстановление ---------------------------------------

  async function flush(rel) {
    if (rel === undefined) return scheduler.flushAll();
    return scheduler.flush(rel);
  }

  async function close() {
    await scheduler.flushAll();
    scheduler.stop();
  }

  function backupInfo(rel, backupOverride) {
    const o = backupOverride && backupOverride !== true ? backupOverride : {};
    const suffix = o.suffix ?? backupDefaults.suffix;
    return {
      dir: resolveBackupDir({ root, relPath: rel, backupDir: o.dir ?? backupDefaults.dir }),
      baseName: backupBaseName(rel, suffix),
      keep: o.keepVersions ?? o.keep ?? backupDefaults.keepVersions,
    };
  }

  // Список существующих версий бэкапа: [{ version, path, size, mtimeMs }], новее -> старее.
  async function listBackups(rel, backupOverride) {
    const { dir, baseName, keep } = backupInfo(rel, backupOverride);
    const found = [];
    for (let n = 0; n < Math.max(keep, 1); n += 1) {
      const path = backupVersionPath(dir, baseName, n);
      try {
        const st = await fs.stat(path);
        found.push({ version: n, path, size: st.size, mtimeMs: st.mtimeMs });
      } catch {
        // нет такой версии — пропускаем
      }
    }
    return found;
  }

  // Восстановить основной файл из бэкапа (по умолчанию из последней версии, 0).
  async function restore(rel, restoreOpts = {}) {
    const restoreVersion = restoreOpts.version ?? 0;
    const { dir, baseName } = backupInfo(rel, restoreOpts.backup);
    const src = backupVersionPath(dir, baseName, restoreVersion);
    const data = await fs.readFile(src); // ENOENT, если такой версии нет
    await writeFileDurable(abs(rel), data, { durability, fsyncDir });
    return { restoredFrom: src, bytes: data.length };
  }

  return Object.freeze({
    kind: "safe-file-writer",
    version,
    baseDir: root,

    // адаптер записи
    writeFile,
    writeFileAtomic: writeFile, // drop-in совместимость со storage-adapter (напр. notes-db)
    appendLine,

    // чтение / обслуживание
    readText,
    readBytes,
    exists,
    ensureDir,
    remove,
    removeDir,
    list,
    rename,
    resolve: abs,

    // бэкап
    flush,
    close,
    listBackups,
    restore,
  });
}
