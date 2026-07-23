import { promises as fs } from "node:fs";
import { dirname } from "node:path";
import { randomBytes } from "node:crypto";

// Низкоуровневая durable-запись: tmp -> writeFile -> fsync(data) -> rename -> fsync(dir).
//
// Именно отсутствие fsync данных перед rename давало "файл нужного размера из нулей"
// после жёсткого сбоя на NTFS: rename меняет только метаданные (файл существует, размер,
// выделенные блоки), а NTFS их журналирует агрессивно и переживает краш. Сами данные
// остаются в page-cache и физически на диск ещё не легли. Краш в этом окне -> при
// восстановлении файл нужного размера читается как нули. fsync данных ДО rename это
// закрывает: после него старый файл остаётся целым, либо новый уже целиком на диске.

const isWindows = process.platform === "win32";

function tmpNameFor(target) {
  return `${target}.tmp-${process.pid}-${randomBytes(6).toString("hex")}`;
}

function toBuffer(data) {
  return typeof data === "string" ? Buffer.from(data, "utf8") : Buffer.from(data);
}

// fsync каталога нужен в POSIX, чтобы durable была сама запись имени (rename): без него
// после краха может остаться tmp-файл без переименования. На Windows открыть каталог как
// файл и вызвать FlushFileBuffers штатно нельзя, поэтому это no-op; там durability даёт
// fsync данных до rename + агрессивный журнал метаданных NTFS.
async function fsyncDirBestEffort(dirPath) {
  if (isWindows) return;
  let handle;
  try {
    handle = await fs.open(dirPath, "r");
    await handle.sync();
  } catch {
    // EISDIR/EPERM/ENOSYS и пр. на нестандартных FS — это best-effort, молча игнорируем.
  } finally {
    if (handle) await handle.close().catch(() => {});
  }
}

// Атомарная durable-запись всего файла. rel уже должен быть абсолютным путём.
export async function writeFileDurable(target, data, { durability = "fsync", fsyncDir = true } = {}) {
  await fs.mkdir(dirname(target), { recursive: true });
  const tmp = tmpNameFor(target);
  const buffer = toBuffer(data);
  let handle;
  try {
    handle = await fs.open(tmp, "w");
    await handle.writeFile(buffer);
    if (durability === "fsync") await handle.sync();
  } finally {
    if (handle) await handle.close();
  }
  try {
    await fs.rename(tmp, target);
  } catch (error) {
    await fs.rm(tmp, { force: true }).catch(() => {});
    throw error;
  }
  if (durability === "fsync" && fsyncDir) await fsyncDirBestEffort(dirname(target));
}

// Durable-дозапись строки. Append безопаснее полной перезаписи (старое содержимое уже на
// диске), но fsync гарантирует, что и новый хвост физически записан.
export async function appendLineDurable(target, line, { durability = "fsync" } = {}) {
  await fs.mkdir(dirname(target), { recursive: true });
  const text = line.endsWith("\n") ? line : `${line}\n`;
  let handle;
  try {
    handle = await fs.open(target, "a");
    await handle.writeFile(text, { encoding: "utf8" });
    if (durability === "fsync") await handle.sync();
  } finally {
    if (handle) await handle.close();
  }
}
