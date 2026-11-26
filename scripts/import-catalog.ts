import "dotenv/config";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { processUploadImage } from "../server/utils/image-processing";
import { htmlToText, matchEquipmentType, parsePrice, splitBrandModel, type ArchivedProduct, type ImportSpec, type EquipmentTypeForImport } from "../server/utils/catalog-import";
import { detectImageMime, uploadStoragePath, uploadUrlFromPath, uploadGroupPaths, type ImageVariant } from "../shared/utils/uploads";

const MAX_PRODUCTS = Number(process.env.IMPORT_MAX_PRODUCTS || 0);
const sources = [
  { name: "msg-spectech" as const, base: "https://msg-spectech.ru", sitemap: "https://msg-spectech.ru/sitemap.xml" },
  { name: "aksgroup" as const, base: "https://aksgroup.moscow", sitemap: "https://aksgroup.moscow/wp-sitemap-posts-product-1.xml" },
];
const root = resolve(process.env.NUXT_UPLOADS_DIR || process.env.UPLOADS_DIR || ".data/uploads");
const archiveRoot = resolve(".data/imports", new Date().toISOString().replace(/[:.]/g, "-"));
const imageCache = new Map<string, string>();

function matches(value: string, expression: RegExp): string[] { return [...value.matchAll(expression)].map((match) => match[1] || "").filter(Boolean); }
async function get(url: string): Promise<string> { const response = await fetch(url, { headers: { "user-agent": "spectechresource-catalog-import/1.0" }, signal: AbortSignal.timeout(30_000) }); if (!response.ok) throw new Error(`${response.status} ${url}`); return response.text(); }
function extractUrls(xml: string): string[] { return [...new Set(matches(xml, /<loc>\s*(.*?)\s*<\/loc>/gis).map((url) => url.replace(/&amp;/g, "&")))]; }
function first(html: string, expression: RegExp): string { return htmlToText(html.match(expression)?.[1] || ""); }
function extractSpecs(html: string): ImportSpec[] {
  const specs: ImportSpec[] = [];
  const patterns = [/<span[^>]*class="field-label[^"]*"[^>]*>([\s\S]*?)<\/span>\s*<span[^>]*class="field-value[^"]*"[^>]*>([\s\S]*?)<\/span>/gi, /<div[^>]*class="aks-product-specs__item"[^>]*>\s*<span[^>]*>([\s\S]*?)<\/span>\s*<strong[^>]*>([\s\S]*?)<\/strong>/gi];
  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) specs.push({ name: htmlToText(match[1]!).replace(/:\s*$/, ""), value: htmlToText(match[2]!) });
  }
  const unique = new Map(specs.map((spec) => [`${spec.name}:${spec.value}`, spec]));
  return [...unique.values()];
}
function extractImages(html: string, base: string): string[] {
  const candidates = [...matches(html, /(?:src|data-src|data-lazy-src|href)=["']([^"']+\.(?:jpe?g|png|webp|avif)(?:\?[^"']*)?)["']/gi), ...matches(html, /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi)];
  return [...new Set(candidates.map((url) => new URL(url, base).href).filter((url) => !/logo|icon|favicon|captcha/i.test(url)))].slice(0, 20);
}

function checksumUuid(checksum: string): string {
  return `${checksum.slice(0, 8)}-${checksum.slice(8, 12)}-4${checksum.slice(13, 16)}-a${checksum.slice(17, 20)}-${checksum.slice(20, 32)}`;
}

async function saveImage(url: string): Promise<string | null> {
  if (imageCache.has(url)) return imageCache.get(url)!;
  try {
    const response = await fetch(url, { headers: { "user-agent": "spectechresource-catalog-import/1.0" }, signal: AbortSignal.timeout(30_000) });
    if (!response.ok) return null;
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength > 5 * 1024 * 1024 || !detectImageMime(bytes)) return null;
    const images = await processUploadImage(bytes);
    const checksum = createHash("sha256").update(bytes).digest("hex").slice(0, 32);
    const relative = uploadStoragePath(new Date(), checksumUuid(checksum), "image/webp").replace(".webp", "-full.webp");
    for (const path of uploadGroupPaths(relative)) {
      const variant = path.match(/-(small|medium|full)\.webp$/)?.[1] as ImageVariant;
      await mkdir(dirname(resolve(root, path)), { recursive: true });
      await writeFile(resolve(root, path), images[variant]);
    }
    const result = uploadUrlFromPath(relative);
    imageCache.set(url, result);
    return result;
  } catch { return null; }
}

async function parseProduct(url: string, section: string, source: typeof sources[number]["name"], types: EquipmentTypeForImport[]): Promise<ArchivedProduct> {
  const html = await get(url);
  const title = first(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i) || first(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const metaDescription = first(html, /<meta[^>]+(?:name|property)=["'](?:description|og:description)["'][^>]+content=["']([^"']*)["']/i);
  const start = source === "msg-spectech" ? html.indexOf("<h1") : html.indexOf("aks-single-product__left");
  if (start < 0 || !title) throw new Error("Карточка товара не распознана");
  const body = html.slice(start).split(source === "msg-spectech" ? "Рекомендуем спецтехнику" : "Остались вопросы")[0]!;
  const productDescription = first(body, /<div[^>]*class="aks-single-product__desc"[^>]*>([\s\S]*?)<\/div>/i);
  const description = [metaDescription, productDescription].filter(Boolean).join("\n\n") || null;
  const text = htmlToText(body);
  const { brand, model } = splitBrandModel(title);
  const type = matchEquipmentType(section, types);
  const photos: string[] = [];
  for (const image of extractImages(body, url).filter((image) => !/-300x300\./.test(image))) { const saved = await saveImage(image); if (saved && !photos.includes(saved)) photos.push(saved); }
  if (!photos.length) throw new Error("Не удалось сохранить фотографии товара");
  return { source, sourceSection: section, title, brand, model, description, specs: extractSpecs(body), pricePerHour: parsePrice(text, "hour"), pricePerShift: parsePrice(text, "shift"), photos, typeId: type?.id ?? null, isPublished: Boolean(type) };
}

async function main(): Promise<void> {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL || process.env.NUXT_DATABASE_URL }) });
  try {
    const types = await prisma.equipmentType.findMany({ select: { id: true, name: true, slug: true } });
    const products: ArchivedProduct[] = []; const errors: string[] = [];
    for (const source of sources) {
      const productUrls = new Set(extractUrls(await get(source.sitemap)).filter((url) => source.name === "msg-spectech" ? /\/vidy-tekhniki\/[^/]+\/?$/.test(url) : url.includes("aksgroup.moscow/" )).map((url) => url.replace(/\/$/, "")));
      const index = await get(source.name === "msg-spectech" ? `${source.base}/vidy-tekhniki/` : source.base);
      const region = source.name === "msg-spectech" ? index.slice(index.indexOf("<h1")) : firstRaw(index, /<nav class="aks-nav">([\s\S]*?)<\/nav>/i);
      const sections = [...region.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)].filter((m) => source.name === "msg-spectech" ? m[2]!.includes("el-title") && m[1]!.startsWith("/vidy-tekhniki/") : /\/arenda-/.test(m[1]!));
      const seen = new Set<string>();
      for (const section of sections) {
        const sectionName = source.name === "msg-spectech" ? first(section[2]!, /<div[^>]*class="el-title[^"]*"[^>]*>([\s\S]*?)<\/div>/i) : htmlToText(section[2]!);
        const queue = [new URL(section[1]!, source.base).href]; const visited = new Set<string>();
        while (queue.length && (!MAX_PRODUCTS || seen.size < MAX_PRODUCTS)) {
          const page = queue.shift()!; if (visited.has(page)) continue; visited.add(page);
          try {
            const listing = (await get(page)).split("Рекомендуем спецтехнику")[0]!;
            for (const link of listing.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>/gi)) {
              const target = new URL(link[1]!.replace(/&amp;/g, "&"), page).href.replace(/\/$/, "");
              if (/page-numbers|pagination-next/.test(link[0]) && target.startsWith(source.base) && !visited.has(target)) queue.push(target);
              if (!productUrls.has(target) || seen.has(target) || (MAX_PRODUCTS && seen.size >= MAX_PRODUCTS)) continue;
              if (source.name === "msg-spectech" && !/uk-link-reset|el-link|el-title|el-image/.test(link[0])) continue;
              seen.add(target);
              try { products.push(await parseProduct(target, sectionName, source.name, types)); } catch { errors.push(`${source.name}: ${sectionName}: ошибка карточки ${seen.size}`); }
            }
          } catch { errors.push(`${source.name}: ${sectionName}: ошибка списка`); }
        }
      }
    }
    await mkdir(archiveRoot, { recursive: true });
    await writeFile(resolve(archiveRoot, "products.json"), `${JSON.stringify(products, null, 2)}\n`);
    await writeFile(resolve(archiveRoot, "report.json"), `${JSON.stringify({ createdAt: new Date().toISOString(), total: products.length, published: products.filter((item) => item.isPublished).length, unmatched: products.filter((item) => !item.typeId).length, errors }, null, 2)}\n`);
    if (errors.length || !products.length) process.exitCode = 1;
    console.log(JSON.stringify({ archiveRoot, total: products.length, published: products.filter((item) => item.isPublished).length, unmatched: products.filter((item) => !item.typeId), errors: errors.length }, null, 2));
  } finally { await prisma.$disconnect(); }
}
function firstRaw(html: string, expression: RegExp): string { return html.match(expression)?.[1] || ""; }
await main();