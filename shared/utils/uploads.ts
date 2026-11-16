/**
 * Загрузки изображений: лимиты, определение формата по содержимому и адреса файлов.
 *
 * Код общий для клиента и сервера: форма проверяет размер и тип до отправки,
 * сервер повторяет проверку по magic bytes — расширению и `Content-Type` не доверяем.
 * SVG не принимаем: внутри него бывает скрипт, а отдаём файлы с того же домена.
 */

/** Все загруженные файлы отдаются этим префиксом (`server/routes/uploads/[...path].get.ts`). */
export const UPLOADS_URL_PREFIX = "/uploads/";

/** Больше 5 МБ — это уже не фотография техники, а повод её сжать. */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Столько же, сколько разрешает схема каталога для галереи и фото модели. */
export const MAX_IMAGES_PER_FIELD = 20;

/** Формат → расширение файла на диске. */
export const IMAGE_MIME_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
} as const;

export type ImageMime = keyof typeof IMAGE_MIME_EXTENSIONS;

/** Подсказка для `<input type="file" accept>` и сообщений об ошибке. */
export const IMAGE_ACCEPT = Object.keys(IMAGE_MIME_EXTENSIONS).join(",");

/** Имя файла генерируем сами: год/месяц/`<uuid>.<ext>`. */
const UPLOAD_PATH_RE =
  /^\d{4}\/(?:0[1-9]|1[0-2])\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:jpg|png|webp|avif|gif)$/;

function ascii(bytes: Uint8Array, offset: number, length: number): string {
  let text = "";

  for (let index = offset; index < offset + length; index += 1) {
    text += String.fromCharCode(bytes[index] ?? 0);
  }

  return text;
}

/**
 * Формат по первым байтам файла. `null` — не изображение из разрешённого списка.
 * AVIF определяем по ISO-BMFF: `ftyp` в байтах 4–7 и бренд `avif`/`avis` в 8–11.
 */
export function detectImageMime(bytes: Uint8Array): ImageMime | null {
  if (bytes.length < 12) return null;

  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";

  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }

  const gifHeader = ascii(bytes, 0, 6);
  if (gifHeader === "GIF87a" || gifHeader === "GIF89a") return "image/gif";

  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP") return "image/webp";

  const brand = ascii(bytes, 8, 4);
  if (ascii(bytes, 4, 4) === "ftyp" && (brand === "avif" || brand === "avis")) return "image/avif";

  return null;
}

/** Относительный путь на диске: `2026/11/<uuid>.jpg`. */
export function uploadStoragePath(date: Date, id: string, mime: ImageMime): string {
  const year = String(date.getUTCFullYear());
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");

  return `${year}/${month}/${id}.${IMAGE_MIME_EXTENSIONS[mime]}`;
}

/** Путь из запроса/БД безопасен, только если он наш: без `..`, абсолютных путей и чужих расширений. */
export function isSafeUploadPath(value: string): boolean {
  return UPLOAD_PATH_RE.test(value);
}

/** Публичный адрес файла: `/uploads/2026/11/<uuid>.jpg`. */
export function uploadUrlFromPath(path: string): string {
  return `${UPLOADS_URL_PREFIX}${path}`;
}

/**
 * Обратное преобразование: адрес → путь на диске.
 * `null` для внешних ссылок и ручных адресов — такие файлы мы не храним и не удаляем.
 */
export function uploadPathFromUrl(url: string | null | undefined): string | null {
  const trimmed = url?.trim() ?? "";
  if (!trimmed.startsWith(UPLOADS_URL_PREFIX)) return null;

  const path = trimmed.slice(UPLOADS_URL_PREFIX.length);
  return isSafeUploadPath(path) ? path : null;
}

/** Расширение → формат: нужно при отдаче файла, чтобы не читать его содержимое снова. */
export function imageMimeFromPath(path: string): ImageMime | null {
  const extension = path.slice(path.lastIndexOf(".") + 1).toLowerCase();

  for (const [mime, value] of Object.entries(IMAGE_MIME_EXTENSIONS)) {
    if (value === extension) return mime as ImageMime;
  }

  return null;
}

/** «823 КБ», «1,4 МБ» — для подсказок и ошибок. */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 Б";
  if (bytes < 1024) return `${Math.round(bytes)} Б`;

  const kilobytes = bytes / 1024;
  if (kilobytes < 1024) return `${Math.round(kilobytes)} КБ`;

  return `${(kilobytes / 1024).toFixed(1).replace(".", ",")} МБ`;
}
