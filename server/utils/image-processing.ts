import sharp from "sharp";
import { IMAGE_VARIANTS, MAX_IMAGE_BYTES, type ImageVariant } from "../../shared/utils/uploads";

export class InvalidUploadImage extends Error {}

/** Decode before touching disk; strip metadata and keep only the first frame. */
export async function processUploadImage(bytes: Uint8Array): Promise<Record<ImageVariant, Buffer>> {
  if (bytes.byteLength > MAX_IMAGE_BYTES) throw new InvalidUploadImage("Файл больше 5 МБ");
  try {
    const image = sharp(Buffer.from(bytes), { limitInputPixels: 40_000_000, failOn: "warning", animated: false }).rotate();
    const result = {} as Record<ImageVariant, Buffer>;
    for (const variant of Object.keys(IMAGE_VARIANTS) as ImageVariant[]) {
      const { width, height, quality } = IMAGE_VARIANTS[variant];
      result[variant] = await image.clone().resize({ width, height, fit: "inside", withoutEnlargement: true }).webp({ quality }).toBuffer();
    }
    return result;
  } catch {
    throw new InvalidUploadImage("Не удалось прочитать изображение: файл повреждён или превышает 40 млн пикселей");
  }
}