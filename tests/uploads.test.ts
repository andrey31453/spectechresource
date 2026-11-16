import { describe, expect, it } from "vitest";
import {
  MAX_IMAGE_BYTES,
  MAX_IMAGES_PER_FIELD,
  detectImageMime,
  formatFileSize,
  imageMimeFromPath,
  isSafeUploadPath,
  uploadPathFromUrl,
  uploadStoragePath,
  uploadUrlFromPath,
} from "#shared/utils/uploads";
import {
  referencedUploadPaths,
  referencedUploadUrls,
  uploadUsages,
  type UploadReferences,
} from "~~/server/utils/upload-references";

const UUID = "0f0e0d0c-0b0a-4908-8706-050403020100";

function bytes(...values: Array<number | string>): Uint8Array {
  const list: number[] = [];

  for (const value of values) {
    if (typeof value === "number") list.push(value);
    else for (const char of value) list.push(char.charCodeAt(0));
  }

  return new Uint8Array(list);
}

/** Хвост, чтобы короткие сигнатуры проходили проверку минимальной длины. */
const tail = bytes(0, 0, 0, 0, 0, 0, 0, 0);

const samples = {
  jpeg: bytes(0xff, 0xd8, 0xff, 0xe0, ...tail),
  png: bytes(0x89, "PNG", 0x0d, 0x0a, 0x1a, 0x0a, ...tail),
  gif: bytes("GIF89a", ...tail),
  webp: bytes("RIFF", 0x24, 0, 0, 0, "WEBP"),
  avif: bytes(0, 0, 0, 0x1c, "ftypavif", ...tail),
};

describe("определение формата изображения", () => {
  it("узнаёт поддерживаемые форматы по первым байтам", () => {
    expect(detectImageMime(samples.jpeg)).toBe("image/jpeg");
    expect(detectImageMime(samples.png)).toBe("image/png");
    expect(detectImageMime(samples.gif)).toBe("image/gif");
    expect(detectImageMime(samples.webp)).toBe("image/webp");
    expect(detectImageMime(samples.avif)).toBe("image/avif");
  });

  it("не пропускает SVG, текст и пустой файл", () => {
    expect(detectImageMime(bytes('<svg xmlns="http://www.w3.org/2000/svg">'))).toBeNull();
    expect(detectImageMime(bytes("просто текст"))).toBeNull();
    expect(detectImageMime(new Uint8Array(0))).toBeNull();
    expect(detectImageMime(bytes(0xff, 0xd8, 0xff))).toBeNull();
  });

  it("RIFF без WEBP и ftyp с чужим брендом — не наши форматы", () => {
    expect(detectImageMime(bytes("RIFF", 0x24, 0, 0, 0, "WAVE"))).toBeNull();
    expect(detectImageMime(bytes(0, 0, 0, 0x18, "ftypisom", ...tail))).toBeNull();
  });
});

describe("пути и адреса загрузок", () => {
  it("раскладывает файл по году и месяцу", () => {
    expect(uploadStoragePath(new Date("2026-11-16T23:30:00Z"), UUID, "image/jpeg")).toBe(
      `2026/11/${UUID}.jpg`,
    );
    expect(uploadStoragePath(new Date("2027-01-01T00:00:00Z"), UUID, "image/webp")).toBe(
      `2027/01/${UUID}.webp`,
    );
  });

  it("адрес и путь обратимы", () => {
    const path = uploadStoragePath(new Date("2026-11-16T10:00:00Z"), UUID, "image/png");
    const url = uploadUrlFromPath(path);

    expect(url).toBe(`/uploads/2026/11/${UUID}.png`);
    expect(uploadPathFromUrl(url)).toBe(path);
  });

  it("внешние адреса и подозрительные пути не считаются нашими", () => {
    expect(uploadPathFromUrl("https://cdn.example.ru/a.jpg")).toBeNull();
    expect(uploadPathFromUrl("/img/a.jpg")).toBeNull();
    expect(uploadPathFromUrl(`/uploads/2026/11/../../etc/passwd`)).toBeNull();
    expect(uploadPathFromUrl(null)).toBeNull();

    expect(isSafeUploadPath(`2026/11/${UUID}.jpg`)).toBe(true);
    expect(isSafeUploadPath(`/2026/11/${UUID}.jpg`)).toBe(false);
    expect(isSafeUploadPath(`2026/11/${UUID}.svg`)).toBe(false);
    expect(isSafeUploadPath(`2026/11/${UUID.toUpperCase()}.jpg`)).toBe(false);
    expect(isSafeUploadPath("2026/13/" + UUID + ".jpg")).toBe(false);
    expect(isSafeUploadPath("2026/11/not-a-uuid.jpg")).toBe(false);
  });

  it("формат по расширению нужен для заголовка Content-Type", () => {
    expect(imageMimeFromPath(`2026/11/${UUID}.avif`)).toBe("image/avif");
    expect(imageMimeFromPath(`2026/11/${UUID}.gif`)).toBe("image/gif");
    expect(imageMimeFromPath(`2026/11/${UUID}.txt`)).toBeNull();
  });
});

describe("лимиты и размеры", () => {
  it("лимит файла — 5 МБ, изображений в поле — 20", () => {
    expect(MAX_IMAGE_BYTES).toBe(5 * 1024 * 1024);
    expect(MAX_IMAGES_PER_FIELD).toBe(20);
  });

  it("размер читается по-русски", () => {
    expect(formatFileSize(512)).toBe("512 Б");
    expect(formatFileSize(2048)).toBe("2 КБ");
    expect(formatFileSize(5 * 1024 * 1024)).toBe("5,0 МБ");
    expect(formatFileSize(1.4 * 1024 * 1024)).toBe("1,4 МБ");
    expect(formatFileSize(Number.NaN)).toBe("0 Б");
  });
});

describe("ссылки на загруженные файлы", () => {
  const urlA = `/uploads/2026/11/${UUID}.jpg`;
  const urlB = `/uploads/2026/11/11111111-2222-4333-8444-555555555555.webp`;

  const references: UploadReferences = {
    categories: [{ title: "Землеройная техника", image: urlA }],
    services: [{ title: "Доставка", image: " https://cdn.example.ru/delivery.png " }],
    types: [{ name: "Гусеничные экскаваторы", gallery: [urlB, " "] }],
    models: [{ brand: "JCB", model: "3CX", photos: [urlA, ` ${urlB} `] }],
  };

  it("собирает используемые адреса без пустых строк", () => {
    const urls = referencedUploadUrls(references);

    expect(urls.has(urlA)).toBe(true);
    expect(urls.has(urlB)).toBe(true);
    expect(urls.has("https://cdn.example.ru/delivery.png")).toBe(true);
    expect(urls.has("")).toBe(false);
    expect(urls.size).toBe(3);
  });

  it("объясняет, где используется файл", () => {
    expect(uploadUsages(references, urlA)).toEqual([
      "раздел «Землеройная техника»",
      "модель «JCB 3CX»",
    ]);
    expect(uploadUsages(references, urlB)).toEqual([
      "вид техники «Гусеничные экскаваторы»",
      "модель «JCB 3CX»",
    ]);
    expect(uploadUsages(references, `/uploads/2026/11/${UUID}.gif`)).toEqual([]);
  });

  it("пути для сверки с диском берутся только из наших адресов", () => {
    const paths = referencedUploadPaths(referencedUploadUrls(references));

    expect([...paths].sort()).toEqual([`2026/11/${UUID}.jpg`, `2026/11/11111111-2222-4333-8444-555555555555.webp`]);
  });
});
