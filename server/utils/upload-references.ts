import type { PrismaClient } from "../../generated/prisma/client";
import { uploadPathFromUrl, uploadGroupPaths, uploadUrlFromPath } from "#shared/utils/uploads";

/**
 * Кто ссылается на загруженный файл.
 *
 * Нужно в двух местах: `DELETE /api/admin/uploads` не даёт удалить используемое фото
 * (иначе на сайте останется битая картинка), а задача `uploads:cleanup` удаляет только «сирот».
 * Функции чистые — строки Prisma передаются снаружи, поэтому тестируются без БД.
 */

export interface UploadReferences {
  categories: Array<{ title: string; image: string | null }>;
  services: Array<{ title: string; image: string | null }>;
  types: Array<{ name: string; gallery: string[] }>;
  models: Array<{ brand: string; model: string; photos: string[] }>;
}

/** Все адреса, на которые ссылается БД. */
export function referencedUploadUrls(references: UploadReferences): Set<string> {
  const urls = new Set<string>();

  for (const category of references.categories) {
    if (category.image) urls.add(category.image.trim());
  }
  for (const service of references.services) {
    if (service.image) urls.add(service.image.trim());
  }
  for (const type of references.types) {
    for (const url of type.gallery) urls.add(url.trim());
  }
  for (const model of references.models) {
    for (const url of model.photos) urls.add(url.trim());
  }

  urls.delete("");
  return urls;
}

/** Человеческие подписи мест, где встречается адрес: для текста ошибки при удалении. */
export function uploadUsages(references: UploadReferences, url: string): string[] {
  const target = url.trim();
  const usages: string[] = [];

  for (const category of references.categories) {
    if (category.image?.trim() === target) usages.push(`раздел «${category.title}»`);
  }
  for (const service of references.services) {
    if (service.image?.trim() === target) usages.push(`услуга «${service.title}»`);
  }
  for (const type of references.types) {
    if (type.gallery.some((item) => item.trim() === target)) usages.push(`вид техники «${type.name}»`);
  }
  for (const model of references.models) {
    if (model.photos.some((item) => item.trim() === target)) {
      usages.push(`модель «${model.brand} ${model.model}»`);
    }
  }

  return usages;
}

/** Множество относительных путей из набора адресов — для сверки с папкой на диске. */
export function referencedUploadPaths(urls: Iterable<string>): Set<string> {
  const paths = new Set<string>();

  for (const url of urls) {
    const path = uploadPathFromUrl(url);
    if (path) for (const sibling of uploadGroupPaths(path)) paths.add(sibling);
  }

  return paths;
}

/**
 * Строки из БД, где могут встречаться адреса загрузок.
 * `imageUrl` сужает выборку до одного адреса — так `DELETE` не читает весь каталог.
 */
export async function loadUploadReferences(
  prisma: PrismaClient,
  options: { imageUrl?: string } = {},
): Promise<UploadReferences> {
  const url = options.imageUrl?.trim();
  const imageWhere = url ? { image: url } : {};
  const galleryWhere = url ? { gallery: { has: url } } : {};
  const photosWhere = url ? { photos: { has: url } } : {};

  const [categories, services, types, models] = await Promise.all([
    prisma.category.findMany({ where: imageWhere, select: { title: true, image: true } }),
    prisma.service.findMany({ where: imageWhere, select: { title: true, image: true } }),
    prisma.equipmentType.findMany({ where: galleryWhere, select: { name: true, gallery: true } }),
    prisma.equipmentModel.findMany({ where: photosWhere, select: { brand: true, model: true, photos: true } }),
  ]);

  return { categories, services, types, models };
}

/** Где используется файл: пустой массив — «сирота», удалять можно. */
export async function findUploadUsages(prisma: PrismaClient, url: string): Promise<string[]> {
  const path = uploadPathFromUrl(url);
  const urls = path ? uploadGroupPaths(path).map(uploadUrlFromPath) : [url];
  const usages = await Promise.all(urls.map(async (item) => uploadUsages(await loadUploadReferences(prisma, { imageUrl: item }), item)));
  return [...new Set(usages.flat())];
}

