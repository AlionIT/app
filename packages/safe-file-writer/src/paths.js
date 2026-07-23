import { basename, dirname, isAbsolute, join } from "node:path";

// Разрешение путей бэкапа.
//
// Формат имени одинаков независимо от расположения бэкапа:
//   последняя версия:  <basename><suffix>          напр. ui.json.bak
//   старые версии:     <basename><suffix>.<n>       напр. ui.json.bak.1  (n=1 новее n=2)
//
// Расположение:
//   backupDir не задан -> рядом с основным файлом (dirname основного файла);
//   backupDir задан    -> под этим каталогом сохраняется относительная подпапка исходного
//                         файла, чтобы файлы с одинаковым basename из разных папок не
//                         затирали друг друга. Сам формат имени файла при этом не меняется.

export function resolveBackupDir({ root, relPath, backupDir }) {
  const mainAbs = isAbsolute(relPath) ? relPath : join(root, relPath);
  if (!backupDir) return dirname(mainAbs);

  const baseDir = isAbsolute(backupDir) ? backupDir : join(root, backupDir);
  const relDir = isAbsolute(relPath) ? "" : dirname(relPath);
  return relDir && relDir !== "." ? join(baseDir, relDir) : baseDir;
}

export function backupBaseName(relPath, suffix) {
  return `${basename(relPath)}${suffix}`;
}

// version 0 -> последняя версия (<name><suffix>); n>=1 -> <name><suffix>.<n>
export function backupVersionPath(dir, baseName, version) {
  return version <= 0 ? join(dir, baseName) : join(dir, `${baseName}.${version}`);
}
