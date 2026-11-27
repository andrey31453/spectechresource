import "dotenv/config";
import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { modelSlug } from "../shared/utils/model-slug";
import type { ArchivedProduct } from "../server/utils/catalog-import";

const input = process.argv[2];
if (!input || !process.argv.includes("--replace-and-clear-leads")) throw new Error("Укажите архив и --replace-and-clear-leads");
const connectionString = process.env.DATABASE_URL || process.env.NUXT_DATABASE_URL;
if (!connectionString) throw new Error("Не задан адрес БД");
const address = new URL(connectionString);
if (!["localhost", "127.0.0.1"].includes(address.hostname) || address.port !== "5433") throw new Error("Разрешена только локальная БД на порту 5433");
const products: ArchivedProduct[] = JSON.parse(await readFile(resolve(input, "products.json"), "utf8"));
if (!Array.isArray(products) || !products.length) throw new Error("Пустой архив");
const uploads = resolve(process.env.NUXT_UPLOADS_DIR || process.env.UPLOADS_DIR || ".data/uploads");
const keys = new Set<string>();
const slugs = new Set<string>();
const data = products.map((product, sortOrder) => {
  if (!product.brand?.trim() || !product.model?.trim() || typeof product.isPublished !== "boolean" || (product.isPublished && !product.typeId)) throw new Error("Некорректная карточка");
  for (const price of [product.pricePerHour, product.pricePerShift]) {
    if (price !== null && !/^\d{1,10}\.\d{2}$/.test(price)) throw new Error("Некорректная цена");
  }
  const key = JSON.stringify([product.typeId, product.brand, product.model]);
  if (product.typeId && keys.has(key)) throw new Error("Дубликат модели");
  keys.add(key);
  const base = modelSlug(product.brand, product.model);
  let slug = base;
  let suffix = 1;
  while (slugs.has(JSON.stringify([product.typeId, slug]))) slug = `${base}-${++suffix}`;
  slugs.add(JSON.stringify([product.typeId, slug]));
  return { slug, typeId: product.typeId, brand: product.brand, model: product.model, shortDesc: product.description, pricePerHour: product.pricePerHour, pricePerShift: product.pricePerShift, photos: product.photos, isPublished: product.isPublished, sortOrder, specs: { create: product.specs.map((spec, index) => ({ name: spec.name, value: spec.value, sortOrder: index })) } };
});
for (const product of products) {
  if (!Array.isArray(product.photos) || !product.photos.length) throw new Error("Нет фотографий");
  for (const photo of product.photos) {
    if (!/^\/uploads\/\d{4}\/\d{2}\/[a-f0-9-]+-full\.webp$/.test(photo)) throw new Error("Некорректный путь фото");
    for (const variant of ["small", "medium", "full"]) await access(resolve(uploads, photo.slice(9).replace(/-full\.webp$/, `-${variant}.webp`)));
  }
}
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
try {
  const result = await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('LOCK TABLE equipment_models, equipment_specs, leads IN EXCLUSIVE MODE');
    const types = new Set((await tx.equipmentType.findMany({ select: { id: true } })).map((type) => type.id));
    if (products.some((product) => product.typeId && !types.has(product.typeId))) throw new Error("В архиве неизвестный вид техники");
    const deletedLeads = await tx.lead.deleteMany();
    const deletedModels = await tx.equipmentModel.deleteMany();
    for (const item of data) await tx.equipmentModel.create({ data: item });
    const saved = await tx.equipmentModel.findMany({ orderBy: { sortOrder: "asc" }, include: { specs: { orderBy: { sortOrder: "asc" } } } });
    if (saved.length !== data.length) throw new Error("Не совпало количество товаров");
    for (const [index, row] of saved.entries()) {
      const expected = data[index]!;
      const actual = { slug: row.slug, typeId: row.typeId, brand: row.brand, model: row.model, shortDesc: row.shortDesc, pricePerHour: row.pricePerHour?.toFixed(2) ?? null, pricePerShift: row.pricePerShift?.toFixed(2) ?? null, photos: row.photos, isPublished: row.isPublished, sortOrder: row.sortOrder, specs: { create: row.specs.map((spec) => ({ name: spec.name, value: spec.value, sortOrder: spec.sortOrder })) } };
      if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`Не совпали данные карточки ${index}`);
    }
    return { deletedModels: deletedModels.count, deletedLeads: deletedLeads.count, imported: saved.length, published: saved.filter((row) => row.isPublished).length, specs: await tx.equipmentSpec.count(), verified: true };
  }, { timeout: 120_000 });
  console.log(JSON.stringify(result, null, 2));
} finally { await prisma.$disconnect(); }