export interface ImportSpec {
  name: string;
  value: string;
}

export interface ArchivedProduct {
  source: "msg-spectech" | "aksgroup";
  sourceSection: string;
  title: string;
  brand: string;
  model: string;
  description: string | null;
  specs: ImportSpec[];
  pricePerHour: string | null;
  pricePerShift: string | null;
  photos: string[];
  typeId: string | null;
  isPublished: boolean;
}

export interface EquipmentTypeForImport {
  id: string;
  name: string;
  slug: string;
}

const SECTION_ALIASES: Record<string, string[]> = {
  "гусеничные экскаваторы": ["гусеничн", "crawler"],
  "колёсные экскаваторы": ["колесн", "колёсн", "wheel"],
  "экскаваторы-разрушители": ["разрушител", "demolition"],
  "экскаваторы-погрузчики": ["экскаватор-погрузчик", "экскаватор погрузчик"],
  "мини-экскаваторы": ["мини-экскаватор", "mini-excavator"],
  "фронтальные погрузчики": ["фронтальн", "front loader"],
  "мини-погрузчики": ["мини-погруз", "skid"],
  "телескопические погрузчики": ["телескопическ", "telehandler"],
  автокраны: ["автокран", "автокран"],
  "башенные автокраны": ["башенн"],
  "гусеничные краны": ["гусеничн.*кран"],
  автовышки: ["автовыш", "вышк"],
  автогрейдеры: ["автогрейдер", "грейдер"],
  асфальтоукладчики: ["асфальтоуклад"],
  бульдозеры: ["бульдозер"],
  гидромолоты: ["гидромолот"],
  "дорожные фрезы": ["дорожн.*фрез", "фреза"],
  катки: ["каток", "катки", "катка", "roller"],
  компрессоры: ["компрессор", "компрессора"],
  автобетононасосы: ["бетононасос"],
  автобетоносмесители: ["бетономес", "бетоносмес"],
  вибропогружатели: ["вибропогруж"],
  грейферы: ["грейфер"],
  подъёмники: ["подъемник", "подъёмник", "ножничн"],
  манипуляторы: ["манипулятор"],
  длинномеры: ["длинномер"],
  самосвалы: ["самосвал", "самосвала", "самосвалов", "dump truck"],
  "низкорамные платформы (тралы)": ["низкорам", "трал"],
  "бортовые машины": ["бортов"],
  илососы: ["илосос"],
  "поливомоечные машины": ["поливомоеч", "поливочн"],
  водовозы: ["водовоз"],
  "вакуумные машины": ["вакуумн"],
  "сваебойные установки": ["сваеб"],
};

export function cleanText(value: string): string {
  return value.replace(/\u00a0/g, " ").replace(/[ \t\r\n]+/g, " ").trim();
}

export function htmlToText(value: string): string {
  return cleanText(value.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/https?:\/\/\S+/gi, ""));
}

export function parseMoney(value: string | undefined): string | null {
  if (!value) return null;
  const normalized = value.replace(/\s/g, "").replace(/,/g, ".").replace(/[^\d.]/g, "");
  if (!normalized) return null;
  const number = Number(normalized);
  return Number.isFinite(number) && number >= 0 ? number.toFixed(2) : null;
}

export function parsePrice(text: string, unit: "hour" | "shift"): string | null {
  const pattern = unit === "hour"
    ? /([\d\s]+(?:[,.]\d+)?)\s*(?:₽|руб\.?)(?:\s*\/\s*(?:час|ч\.?))|(?:за\s+час)[^\d]{0,20}([\d\s]+(?:[,.]\d+)?)/i
    : /([\d\s]+(?:[,.]\d+)?)\s*(?:₽|руб\.?)(?:\s*\/\s*(?:смен|сутк|день))|(?:за\s+(?:смен|сутк|день))[^\d]{0,20}([\d\s]+(?:[,.]\d+)?)/i;
  const match = text.match(pattern);
  return parseMoney(match?.[1] ?? match?.[2]);
}

export function inferSection(value: string): string {
  const text = value.toLocaleLowerCase("ru");
  if (/samosval/.test(text)) return "самосвалы";
  for (const [section, aliases] of Object.entries(SECTION_ALIASES)) {
    if (aliases.some((alias) => new RegExp(alias, "i").test(text))) return section;
  }
  return cleanText(value) || "Без раздела";
}

export function matchEquipmentType(section: string, types: EquipmentTypeForImport[]): EquipmentTypeForImport | null {
  const normalize = (text: string) => text.toLocaleLowerCase("ru").replace(/ё/g, "е").replace(/[^а-яa-z0-9]/g, "").replace(/^аренда/, "");
  const direct = types.find((type) => normalize(type.name) === normalize(section));
  if (direct) return direct;
  if (/катков/i.test(section)) return types.find((type) => type.slug === "katka") ?? null;
  if (/экскаваторов-погрузчиков/i.test(section)) return types.find((type) => type.slug === "ekskavatora-pogruzchika") ?? null;
  const aliases: Record<string, string> = { башенные: "bashennogo-avtokrana", гусеничные: "gusenichnogo-krana", минипогрузчики: "mini-pogruzchika", бетоносмесители: "avtobetonosmesitelya", поливочныемашины: "polivomoechnoy-mashiny", дорожнаяфреза: "dorozhnoy-frezy" };
  const alias = aliases[normalize(section)];
  if (alias) return types.find((type) => type.slug === alias) ?? null;
  const sectionText = inferSection(section).toLocaleLowerCase("ru");
  return types.find((type) => {
    const typeText = `${type.name} ${type.slug}`.toLocaleLowerCase("ru");
    return typeText === sectionText || typeText.includes(sectionText) || sectionText.includes(typeText);
  }) ?? types.find((type) => inferSection(type.name).toLocaleLowerCase("ru") === sectionText) ?? null;
}

export function splitBrandModel(title: string): { brand: string; model: string } {
  const value = cleanText(title).replace(/[«»„“”"]/g, "").replace(/^аренда\s+/i, "").replace(/^мини\s+/i, "");
  const crane = value.match(/^автокран\s+(\d+(?:[.,]\d+)?)\s+тонн\s+(.+)$/i);
  if (crane) return { brand: crane[2]!, model: `${crane[1]} тонн` };
  const words = value.split(" ").filter(Boolean);
  if (words.length < 2) return { brand: value || "Техника", model: value || "Модель" };
  const ignored = new Set(["каток", "катка", "самосвал", "экскаватор", "компрессор", "погрузчик", "кран", "автокран", "аренда"]);
  const brand = words.find((word) => /[a-z]/i.test(word)) ?? words.find((word) => /[а-яё]/i.test(word) && !ignored.has(word.toLocaleLowerCase("ru"))) ?? words[0]!;
  const index = words.indexOf(brand);
  return { brand, model: words.slice(index + 1).join(" ") || brand };
}

export interface MergeConflict {
  name: string;
  values: string[];
  selected: string;
}

function specKey(value: string): string {
  return cleanText(value).toLocaleLowerCase("ru").replace(/ё/g, "е").replace(/\s*:\s*$/, "");
}

function comparableValue(value: string): string {
  return specKey(value).replace(/(\d)\s+(?=\d)/g, "$1").replace(/(\d),(?=\d)/g, "$1.");
}

function scalar(value: string): number | null {
  const match = comparableValue(value).match(/^(\d+(?:\.\d+)?)\s*([^\d]*)$/);
  return match ? Number(match[1]) : null;
}

function minimumPrice(values: (string | null)[]): string | null {
  const prices = values.filter((value): value is string => value !== null);
  for (const price of prices) {
    if (!/^\d+(?:\.\d{1,2})?$/.test(price) || !Number.isFinite(Number(price))) throw new Error("Некорректная цена в архиве");
  }
  return prices.length ? Math.min(...prices.map(Number)).toFixed(2) : null;
}

export function mergeArchivedProducts(products: ArchivedProduct[]): { products: ArchivedProduct[]; merges: { title: string; count: number; conflicts: MergeConflict[] }[] } {
  const groups = new Map<string, ArchivedProduct[]>();
  for (const original of products) {
    const crane = /^\s*(?:аренда\s+)?автокран\s+\d+(?:[.,]\d+)?\s+тонн\s+/i.test(original.title);
    const product = { ...original, ...(crane ? splitBrandModel(original.title) : {}) };
    // Unknown sections must not be collapsed into a single null-type category.
    const section = product.typeId ?? `${product.source}:${specKey(product.sourceSection)}`;
    const key = JSON.stringify([section, specKey(product.brand), specKey(product.model)]);
    const group = groups.get(key) ?? [];
    group.push(product);
    groups.set(key, group);
  }
  const result: ArchivedProduct[] = [];
  const merges: { title: string; count: number; conflicts: MergeConflict[] }[] = [];
  for (const group of groups.values()) {
    const first = group[0]!;
    if (group.length === 1) { result.push(first); continue; }
    const specs = new Map<string, { name: string; values: string[] }>();
    for (const product of group) {
      for (const spec of product.specs) {
        // Prices have dedicated fields; do not keep contradictory prices in specs.
        if (/^цена за (?:час|смену)$/i.test(cleanText(spec.name))) continue;
        const key = specKey(spec.name);
        const entry = specs.get(key) ?? { name: spec.name, values: [] };
        if (!entry.values.some((value) => comparableValue(value) === comparableValue(spec.value))) entry.values.push(spec.value);
        specs.set(key, entry);
      }
    }
    const conflicts: MergeConflict[] = [];
    const mergedSpecs = [...specs.values()].map(({ name, values }) => {
      let selected = values[0]!;
      if (values.length > 1) {
        const numbers = values.map(scalar);
        if (numbers.some((number) => number === null)) throw new Error(`Нельзя выбрать меньшее значение характеристики «${name}»: ${values.join(" / ")}`);
        const units = new Set(values.map((value) => comparableValue(value).replace(/^\d+(?:\.\d+)?\s*/, "")).filter(Boolean));
        if (units.size > 1) throw new Error(`Разные единицы характеристики «${name}»: ${values.join(" / ")}`);
        selected = values[numbers.indexOf(Math.min(...numbers as number[]))]!;
        conflicts.push({ name, values, selected });
      }
      return { name, value: selected };
    });
    const paragraphs = [...new Set(group.flatMap((product) => (product.description ?? "").split(/\n\s*\n/)).map((text) => text.trim()).filter(Boolean))];
    if (conflicts.length) paragraphs.unshift(`ВНИМАНИЕ: обнаружено несоответствие характеристик исходных карточек. Товар снят с публикации до проверки.\n${conflicts.map((conflict) => `${conflict.name}: ${conflict.values.map((value, index) => `вариант ${index + 1} — ${value}`).join("; ")}. В характеристиках выбрано: ${conflict.selected}.`).join("\n")}`);
    result.push({ ...first, description: paragraphs.join("\n\n") || null, specs: mergedSpecs, photos: [...new Set(group.flatMap((product) => product.photos))], pricePerHour: minimumPrice(group.map((product) => product.pricePerHour)), pricePerShift: minimumPrice(group.map((product) => product.pricePerShift)), isPublished: Boolean(first.typeId) && group.every((product) => product.isPublished) && !conflicts.length });
    merges.push({ title: first.title, count: group.length, conflicts });
  }
  return { products: result, merges };
}
