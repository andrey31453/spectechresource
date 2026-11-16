import { imageMimeFromPath, isSafeUploadPath } from "#shared/utils/uploads";
import { readUploadFile } from "../../utils/uploads";

/**
 * Отдача загруженных изображений: `/uploads/2026/11/<uuid>.jpg`.
 *
 * Файлы лежат вне `public/`, поэтому маршрут нужен свой. Имена уникальны и не меняются,
 * значит содержимое можно кэшировать навсегда; `nosniff` не даёт браузеру угадывать тип.
 */
export default defineEventHandler(async (event) => {
  const relativePath = String(getRouterParam(event, "path") ?? "");
  const mime = imageMimeFromPath(relativePath);

  if (!mime || !isSafeUploadPath(relativePath)) {
    throw createError({ statusCode: 404, statusMessage: "Not Found", message: "Файл не найден" });
  }

  const file = await readUploadFile(relativePath);

  if (!file) {
    throw createError({ statusCode: 404, statusMessage: "Not Found", message: "Файл не найден" });
  }

  setHeader(event, "Content-Type", mime);
  setHeader(event, "Content-Length", file.byteLength);
  setHeader(event, "Cache-Control", "public, max-age=31536000, immutable");
  setHeader(event, "X-Content-Type-Options", "nosniff");

  return file;
});
