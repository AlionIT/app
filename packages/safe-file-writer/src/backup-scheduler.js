import { promises as fs } from "node:fs";

import { writeFileDurable } from "./durable-write.js";
import { resolveBackupDir, backupBaseName, backupVersionPath } from "./paths.js";

// Отложенный debounce-бэкап с потолком maxDelayMs и per-path сериализацией.
//
// Суть защиты — разнесение во времени. Основной файл уже durable-записан, а бэкап
// ложится на диск через delayMs..maxDelayMs позже. Одно окно жёсткого сбоя не может
// задеть и рабочий файл, и бэкап одновременно — в отличие от прежнего mirror, который
// писался тем же мигом теми же байтами и терялся вместе с оригиналом.
//
// Планировщик никогда не блокирует event loop: планирование — через таймеры, запись —
// async I/O, и одновременно выполняется не более одной записи бэкапа на путь.

export function createBackupScheduler({ root, defaults, onError }) {
  // rel -> { pending, timer, firstAt, flushing }
  const state = new Map();

  function getState(rel) {
    let st = state.get(rel);
    if (!st) {
      st = { pending: null, timer: null, firstAt: null, flushing: null };
      state.set(rel, st);
    }
    return st;
  }

  function clearTimer(st) {
    if (st.timer) {
      clearTimeout(st.timer);
      st.timer = null;
    }
  }

  function report(error, rel) {
    if (onError) onError(error, rel);
  }

  // Поставить/обновить отложенный бэкап. Быстрые повторные записи одного файла
  // коалесцируются: храним только последние данные, но не отодвигаем жёсткий потолок
  // (firstAt не сбрасывается, поэтому maxDelayMs отсчитывается от первой записи).
  function set(rel, data, options) {
    const st = getState(rel);
    const opts = normalizeBackupOptions(options, defaults);
    if (st.firstAt === null) st.firstAt = Date.now();
    st.pending = { data, opts };
    armTimer(rel, st, opts);
  }

  function armTimer(rel, st, opts) {
    clearTimer(st);
    const now = Date.now();
    const untilCap = st.firstAt + opts.maxDelayMs - now;
    const delay = Math.max(0, Math.min(opts.delayMs, untilCap));
    st.timer = setTimeout(() => {
      st.timer = null;
      void runFlush(rel);
    }, delay);
    // отложенный бэкап не должен сам по себе держать процесс живым
    if (typeof st.timer.unref === "function") st.timer.unref();
  }

  async function runFlush(rel) {
    const st = state.get(rel);
    if (!st || !st.pending || st.pending.data === null) return;
    if (st.flushing) return; // текущая запись завершится и при необходимости перепланирует

    const { data, opts } = st.pending;
    st.pending = null;
    st.firstAt = null;
    clearTimer(st);

    st.flushing = writeBackup(rel, data, opts)
      .catch((error) => report(error, rel))
      .finally(() => {
        st.flushing = null;
        // данные, пришедшие во время записи, уже поставили таймер; подстрахуемся
        if (st.pending && st.pending.data !== null && !st.timer) {
          armTimer(rel, st, st.pending.opts);
        } else if (!st.pending && !st.timer) {
          state.delete(rel);
        }
      });
    await st.flushing;
  }

  // Принудительно сбросить отложенный бэкап немедленно (для flush()/close()).
  async function flush(rel) {
    const st = state.get(rel);
    if (!st) return;
    clearTimer(st);
    if (st.flushing) await st.flushing.catch(() => {});
    if (!st.pending || st.pending.data === null) return;

    const { data, opts } = st.pending;
    st.pending = null;
    st.firstAt = null;
    st.flushing = writeBackup(rel, data, opts)
      .catch((error) => report(error, rel))
      .finally(() => { st.flushing = null; });
    await st.flushing;
  }

  async function flushAll() {
    await Promise.all([...state.keys()].map((rel) => flush(rel)));
  }

  function stop() {
    for (const st of state.values()) clearTimer(st);
  }

  // Одна durable-запись версии(й) бэкапа. Существующие бэкапы никогда не
  // перезаписываются "на месте": новая последняя версия ставится атомарным durable
  // writeFileDurable (tmp -> fsync -> rename), старые версии ротируются renam'ами.
  async function writeBackup(rel, data, opts) {
    const dir = resolveBackupDir({ root, relPath: rel, backupDir: opts.dir });
    const baseName = backupBaseName(rel, opts.suffix);
    await fs.mkdir(dir, { recursive: true });

    const durable = { durability: opts.durability, fsyncDir: opts.fsyncDir };

    if (opts.keepVersions <= 1) {
      // одна версия: атомарная durable-замена <name><suffix>
      await writeFileDurable(backupVersionPath(dir, baseName, 0), data, durable);
      return;
    }

    // несколько версий: удаляем самую старую за пределами лимита, сдвигаем номера,
    // текущую последнюю двигаем в .1, затем durable-пишем новую последнюю.
    const keep = opts.keepVersions;
    await fs.rm(backupVersionPath(dir, baseName, keep), { force: true }).catch(() => {});
    for (let n = keep - 1; n >= 1; n -= 1) {
      await renameIfExists(
        backupVersionPath(dir, baseName, n),
        backupVersionPath(dir, baseName, n + 1)
      );
    }
    await renameIfExists(
      backupVersionPath(dir, baseName, 0),
      backupVersionPath(dir, baseName, 1)
    );
    await writeFileDurable(backupVersionPath(dir, baseName, 0), data, durable);
  }

  async function renameIfExists(from, to) {
    try {
      await fs.rename(from, to);
    } catch (error) {
      if (error && error.code !== "ENOENT") throw error;
    }
  }

  return Object.freeze({ set, flush, flushAll, stop, writeBackup });
}

// Нормализация опций бэкапа: true/undefined -> дефолты; объект -> merge над дефолтами.
export function normalizeBackupOptions(options, defaults) {
  if (options === true || options === undefined || options === null) return defaults;
  return Object.freeze({
    dir: options.dir ?? defaults.dir,
    keepVersions: options.keepVersions ?? options.keep ?? defaults.keepVersions,
    suffix: options.suffix ?? defaults.suffix,
    delayMs: options.delayMs ?? defaults.delayMs,
    maxDelayMs: options.maxDelayMs ?? defaults.maxDelayMs,
    durability: options.durability ?? defaults.durability,
    fsyncDir: options.fsyncDir ?? defaults.fsyncDir,
  });
}
