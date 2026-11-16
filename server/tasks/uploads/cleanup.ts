import { uploadUrlFromPath } from "#shared/utils/uploads";
import { loadUploadReferences, referencedUploadUrls } from "../../utils/upload-references";
import { listUploadFiles, removeUploadFile } from "../../utils/uploads";

/**
 * Удаление «сирот»: файлы, на которые не ссылается ни каталог, ни услуги.
 *
 * Свежая загрузка без сохранённой формы тоже выглядит сиротой, поэтому файлы моложе
 * суток не трогаем — иначе задача, запущенная во время заполнения формы, съест фото.
 * Запуск: `npx nuxi task run uploads:cleanup` (в проде — по расписанию вместе с `leads:send`).
 */

const MIN_AGE_MS = 24 * 60 * 60 * 1000;

interface CleanupResult {
  scanned: number;
  referenced: number;
  removed: number;
  keptRecent: number;
}

export default defineTask({
  meta: {
    name: "uploads:cleanup",
    description: "Удаляет загруженные файлы, на которые не ссылается БД",
  },
  async run() {
    const prisma = usePrisma();
    const references = await loadUploadReferences(prisma);
    const referencedUrls = referencedUploadUrls(references);
    const referencedPaths = new Set(
      [...referencedUrls].map(uploadUrlFromPath).filter((path): path is string => Boolean(path)),
    );

    const files = await listUploadFiles();
    const now = Date.now();
    let removed = 0;
    let keptRecent = 0;

    for (const file of files) {
      if (referencedPaths.has(file.path)) continue;

      if (now - file.modifiedAt.getTime() < MIN_AGE_MS) {
        keptRecent += 1;
        continue;
      }

      if (await removeUploadFile(file.path)) removed += 1;
    }

    return {
      result: {
        scanned: files.length,
        referenced: referencedPaths.size,
        removed,
        keptRecent,
      } as CleanupResult,
    };
  },
});
