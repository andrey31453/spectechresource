import { detectImageMime, formatFileSize, MAX_IMAGE_BYTES } from "#shared/utils/uploads";
import { requireAdmin } from "../../../utils/admin-guard";
import { throwFieldError } from "../../../utils/admin-request";
import { saveUploadImage } from "../../../utils/uploads";
import { InvalidUploadImage } from "../../../utils/image-processing";

/** Запас на границы multipart и имя файла: тело чуть больше самого изображения. */
const MULTIPART_OVERHEAD_BYTES = 64 * 1024;

/**
 * Загрузка изображения из админки (`multipart/form-data`, поле `file`).
 *
 * Формат определяется по содержимому, а не по расширению или `Content-Type` от клиента.
 * Тело читается в память целиком: 5 МБ — предел, при котором это безопасно и без стриминга.
 */
export default defineEventHandler(async (event) => {
  requireAdmin(event);

  // Тело читается в память целиком, поэтому отказываем до чтения, а не после.
  const contentLength = Number(getRequestHeader(event, "content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_IMAGE_BYTES + MULTIPART_OVERHEAD_BYTES) {
    throw createError({
      statusCode: 413,
      statusMessage: "Payload Too Large",
      message: `Файл больше ${formatFileSize(MAX_IMAGE_BYTES)} — сожмите изображение`,
    });
  }

  const parts = await readMultipartFormData(event);
  const file = parts?.find((part) => part.name === "file" && part.data.byteLength > 0);

  if (!file) {
    throwFieldError("file", "Выберите файл изображения");
  }

  if (file.data.byteLength > MAX_IMAGE_BYTES) {
    throwFieldError("file", `Файл больше ${formatFileSize(MAX_IMAGE_BYTES)} — сожмите изображение`);
  }

  const mime = detectImageMime(file.data);

  if (!mime) {
    throwFieldError("file", "Поддерживаются изображения JPEG, PNG, WebP, AVIF и GIF");
  }

  const upload = await saveUploadImage(file.data, mime).catch((error: unknown) => {
    if (error instanceof InvalidUploadImage) throwFieldError("file", error.message);
    throw error;
  });

  setResponseStatus(event, 201);

  return {
    upload: {
      path: upload.path,
      url: upload.url,
      size: upload.size,
      mime: upload.mime,
      variants: upload.variants,
      originalName: file.filename ?? null,
    },
  };
});
