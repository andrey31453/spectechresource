import "dotenv/config";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { processUploadImage } from "../server/utils/image-processing";
import { imageVariantUrl, uploadPathFromUrl, uploadStoragePath, uploadUrlFromPath, type ImageVariant } from "../shared/utils/uploads";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.NUXT_DATABASE_URL || process.env.DATABASE_URL }) });
const root = resolve(process.env.NUXT_UPLOADS_DIR || process.env.UPLOADS_DIR || ".data/uploads");
const cache = new Map<string, string>();
const failures: string[] = [];
let converted = 0;
async function prepare(url: string): Promise<string> {
  if (cache.has(url)) return cache.get(url)!;
  if (uploadPathFromUrl(url) && /-(small|medium|full)\.webp$/.test(url)) return imageVariantUrl(url, "full");
  const upload = uploadPathFromUrl(url);
  const base = upload ? root : resolve("public");
  const path = upload ? resolve(root, upload) : resolve(base, url.replace(/^\//, ""));
  if (!url.startsWith("/") || !path.startsWith(`${base}${sep}`)) { failures.push(url); return url; }
  const written: string[] = [];
  try {
    const images = await processUploadImage(await readFile(path));
    const full = uploadStoragePath(new Date(), randomUUID(), "image/webp").replace(/\.webp$/, "-full.webp");
    for (const variant of Object.keys(images) as ImageVariant[]) {
      const target = resolve(root, full.replace(/-full\.webp$/, `-${variant}.webp`));
      await mkdir(dirname(target), { recursive: true });
      written.push(target);
      await writeFile(target, images[variant]);
    }
    const result = uploadUrlFromPath(full);
    cache.set(url, result);
    converted++;
    return result;
  } catch (error) {
    await Promise.allSettled(written.map((path) => unlink(path)));
    failures.push(`${url}: ${error instanceof Error ? error.message : "ошибка"}`);
    return url;
  }
}
try {
  const types = await prisma.equipmentType.findMany();
  for (const type of types) {
    const originals = [...type.gallery];
    const gallery: string[] = [];
    for (const photo of originals) gallery.push(await prepare(photo));
    await prisma.equipmentType.update({ where: { id: type.id }, data: { gallery } });
    const models = await prisma.equipmentModel.findMany({ where: { typeId: type.id } });
    for (const model of models) {
      // Expand only seed-owned demo photos; preserve manually selected model photos.
      const demoOnly = model.photos.every((url) => url.startsWith("/landing/images/tech/"));
      const source = demoOnly ? [...new Set([...model.photos, ...originals])] : model.photos;
      const photos: string[] = [];
      for (const photo of source) photos.push(await prepare(photo));
      await prisma.equipmentModel.update({ where: { id: model.id }, data: { photos } });
    }
  }
  for (const category of await prisma.category.findMany()) {
    if (category.image) await prisma.category.update({ where: { id: category.id }, data: { image: await prepare(category.image) } });
  }
  for (const service of await prisma.service.findMany()) {
    if (service.image) await prisma.service.update({ where: { id: service.id }, data: { image: await prepare(service.image) } });
  }
  console.log(JSON.stringify({ converted, failures }, null, 2));
  if (failures.length) process.exitCode = 1;
} finally { await prisma.$disconnect(); }