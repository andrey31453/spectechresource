import { randomUUID } from "node:crypto";
import type { Dirent } from "node:fs";
import { mkdir, readFile, readdir, stat, unlink, writeFile } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";
import {
  type ImageMime,
  isSafeUploadPath,
  uploadStoragePath,
  uploadUrlFromPath,
} from "#shared/utils/uploads";

/**
 * Локальное хранилище загрузок.
 *
 * Папка по умолчанию — `.data/uploads` (в git и в сборку не попадает), путь задаётся
 * `UPLOADS_DIR`. Класть файлы в `public/` нельзя: при `nuxt build` эта папка копируется
 * в `.output/public` один раз, и загруженное после старта прод-сервер не отдаст.
 * Отдача — `server/routes/uploads/[...path].get.ts` из той же папки (ADR-21).
 */

export interface UploadFileInfo {
  path: string;
  size: number;
  modifiedAt: Date;
}

export interface SavedUpload extends UploadFileInfo {
  url: string;
  mime: ImageMime;
}

/** Абсолютный путь папки загрузок: `UPLOADS_DIR` или `.data/uploads` от корня проекта. */
export function uploadsRoot(): string {
  const configured = String(useRuntimeConfig().uploadsDir ?? "").trim();
  return resolve(process.cwd(), configured === "" ? ".data/uploads" : configured);
}

/** Путь внутри папки загрузок; выход за её пределы — ошибка программиста, а не 404. */
function absoluteUploadPath(relativePath: string): string {
  if (!isSafeUploadPath(relativePath)) {
    throw new Error(`Недопустимый путь загрузки: ${relativePath}`);
  }

  const root = uploadsRoot();
  const absolute = resolve(root, relativePath);

  if (!absolute.startsWith(`${root}${sep}`)) {
    throw new Error(`Путь за пределами папки загрузок: ${relativePath}`);
  }

  return absolute;
}

/** Пишет файл под сгенерированным именем и возвращает данные для ответа админке. */
export async function saveUploadImage(bytes: Uint8Array, mime: ImageMime): Promise<SavedUpload> {
  const relativePath = uploadStoragePath(new Date(), randomUUID(), mime);
  const absolutePath = absoluteUploadPath(relativePath);

  await mkdir(dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, bytes);

  return {
    path: relativePath,
    url: uploadUrlFromPath(relativePath),
    size: bytes.byteLength,
    mime,
    modifiedAt: new Date(),
  };
}

/** Содержимое файла для отдачи браузеру; `null` — файла нет (или путь не наш). */
export async function readUploadFile(relativePath: string): Promise<Buffer | null> {
  if (!isSafeUploadPath(relativePath)) return null;

  try {
    return await readFile(absoluteUploadPath(relativePath));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

/** Удаление файла: `false` — файла уже нет. */
export async function removeUploadFile(relativePath: string): Promise<boolean> {
  try {
    await unlink(absoluteUploadPath(relativePath));
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
}

/** Все файлы загрузок: два уровня (`год/месяц`), только наши имена. */
export async function listUploadFiles(): Promise<UploadFileInfo[]> {
  const root = uploadsRoot();
  const files: UploadFileInfo[] = [];

  let years: string[];
  try {
    years = (await readdir(root, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return files;
    throw error;
  }

  for (const year of years) {
    let months: Dirent[];
    try {
      months = await readdir(join(root, year), { withFileTypes: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") continue;
      throw error;
    }

    for (const monthEntry of months) {
      if (!monthEntry.isDirectory()) continue;

      const month = monthEntry.name;
      const monthDir = join(root, year, month);

      let entries: Dirent[];
      try {
        entries = await readdir(monthDir, { withFileTypes: true });
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") continue;
        throw error;
      }

      for (const entry of entries) {
        if (!entry.isFile()) continue;

        const relativePath = `${year}/${month}/${entry.name}`;
        if (!isSafeUploadPath(relativePath)) continue;

        try {
          const info = await stat(join(monthDir, entry.name));
          files.push({ path: relativePath, size: info.size, modifiedAt: info.mtime });
        } catch (error) {
          // Файл удалили между чтением папки и `stat` — это не ошибка задачи.
          if ((error as NodeJS.ErrnoException).code === "ENOENT") continue;
          throw error;
        }
      }
    }
  }

  return files;
}
