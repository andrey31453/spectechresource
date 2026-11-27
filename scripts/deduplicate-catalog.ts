import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { resolve } from "node:path";
import { mergeArchivedProducts, type ArchivedProduct } from "../server/utils/catalog-import";

const input = process.argv[2];
if (!input) throw new Error("Укажите каталог исходного архива");
const source = resolve(input);
const original: ArchivedProduct[] = JSON.parse(await readFile(resolve(source, "products.json"), "utf8"));
if (!Array.isArray(original) || !original.length) throw new Error("Архив пуст или имеет неверный формат");
const previousReport = JSON.parse(await readFile(resolve(source, "report.json"), "utf8"));
const { products, merges } = mergeArchivedProducts(original);
const uploads = resolve(process.env.NUXT_UPLOADS_DIR || process.env.UPLOADS_DIR || ".data/uploads");
for (const product of products) {
  if (product.isPublished && !product.typeId) throw new Error("Опубликованный товар без вида");
  for (const photo of product.photos) {
    if (!/^\/uploads\/\d{4}\/\d{2}\/[a-f0-9-]+-full\.webp$/.test(photo)) throw new Error("Некорректный путь фотографии");
    for (const variant of ["small", "medium", "full"]) await access(resolve(uploads, photo.slice("/uploads/".length).replace(/-full\.webp$/, `-${variant}.webp`)));
  }
}
if (/https?:\/\//i.test(JSON.stringify(products))) throw new Error("Архив содержит внешние URL");
const output = resolve(`${source}-merged-${new Date().toISOString().replace(/[:.]/g, "-")}`);
await mkdir(output, { recursive: false });
await writeFile(resolve(output, "products.json"), `${JSON.stringify(products, null, 2)}\n`, { flag: "wx" });
const report = { ...previousReport, createdAt: new Date().toISOString(), originalTotal: original.length, total: products.length, published: products.filter((product) => product.isPublished).length, unmatched: products.filter((product) => !product.typeId).length, unpublishedWithType: products.filter((product) => product.typeId && !product.isPublished).length, merges };
await writeFile(resolve(output, "report.json"), `${JSON.stringify(report, null, 2)}\n`, { flag: "wx" });
console.log(JSON.stringify({ output, ...report }, null, 2));