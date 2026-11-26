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
  const words = value.split(" ").filter(Boolean);
  if (words.length < 2) return { brand: value || "Техника", model: value || "Модель" };
  const ignored = new Set(["каток", "катка", "самосвал", "экскаватор", "компрессор", "погрузчик", "кран", "автокран", "аренда"]);
  const brand = words.find((word) => /[a-z]/i.test(word)) ?? words.find((word) => /[а-яё]/i.test(word) && !ignored.has(word.toLocaleLowerCase("ru"))) ?? words[0]!;
  const index = words.indexOf(brand);
  return { brand, model: words.slice(index + 1).join(" ") || brand };
}
