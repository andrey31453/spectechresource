import * as v from "valibot";
import { toFieldErrors, type FieldError } from "./errors";

/**
 * Схемы каталога — одни для админ-форм и админ-API (как `leads.ts` для заявок).
 *
 * Формы шлют строки: цену «26 000,50» сервер приводит к «26000.50» (Decimal),
 * пустое поле — к `null` («цена по запросу»). Необязательные поля без значения
 * остаются `undefined`, чтобы `PATCH` не затирал то, что не меняли.
 */

export const PRICE_UNITS = ["SHIFT", "HOUR", "PER_METER"] as const;

export type PriceUnitName = (typeof PRICE_UNITS)[number];

export const PRICE_UNIT_LABELS: Record<PriceUnitName, string> = {
  SHIFT: "за смену",
  HOUR: "за час",
  PER_METER: "за метр",
};

export const SLUG_MAX_LENGTH = 80;

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MONEY_RE = /^\d{1,9}(?:\.\d{1,2})?$/;

/** Код в адресе: латиница в нижнем регистре, цифры и дефис между словами. */
export function isValidSlug(value: string): boolean {
  return value.length >= 2 && value.length <= SLUG_MAX_LENGTH && SLUG_RE.test(value);
}

/** «26 000,50» → «26000.50»; пустая строка → `null` («цена по запросу»). */
export function normalizeMoneyInput(value: unknown): string | null {
  if (value === null || value === undefined) return null;

  const cleaned = String(value)
    .replace(/[\s\u00a0]/g, "")
    .replace(",", ".");

  if (cleaned === "") return null;
  if (!MONEY_RE.test(cleaned)) return cleaned;

  const [integer, fraction = ""] = cleaned.split(".");
  return `${integer}.${(fraction + "00").slice(0, 2)}`;
}

/** Код в адресе. Общий для каталога и городов — правило одно. */
export function slugField() {
  return v.pipe(
    v.string("Укажите код для адреса"),
    v.trim(),
    v.toLowerCase(),
    v.minLength(2, "Код — минимум 2 символа"),
    v.maxLength(SLUG_MAX_LENGTH, `Код — не больше ${SLUG_MAX_LENGTH} символов`),
    v.regex(SLUG_RE, "Код: латиница в нижнем регистре, цифры и дефис (например, mini-ekskavatora)"),
  );
}

export function requiredText(max: number, what: string) {
  return v.pipe(
    v.string(`Укажите ${what}`),
    v.trim(),
    v.minLength(2, `${what} — минимум 2 символа`),
    v.maxLength(max, `${what} — не больше ${max} символов`),
  );
}

/** Пустая строка от формы — это «поле не заполнено», а не значение. */
export function optionalText(max: number, what: string) {
  return v.optional(
    v.pipe(
      v.nullish(v.string()),
      v.transform((value) => {
        const text = typeof value === "string" ? value.trim() : "";
        return text === "" ? null : text;
      }),
      v.check((value) => value === null || value.length <= max, `${what} — не больше ${max} символов`),
    ),
    null,
  );
}

function moneyField(what: string) {
  return v.optional(
    v.pipe(
      // Принимаем строку, число и null: форма шлёт строку, API может — число.
      v.unknown(),
      v.transform(normalizeMoneyInput),
      v.check(
        (value) => value === null || MONEY_RE.test(value),
        `${what} — число до 9 цифр и не больше 2 знаков после точки`,
      ),
    ),
    null,
  );
}


function photosField(what: string) {
  return v.optional(
    v.pipe(
      v.array(
        v.pipe(
          v.string(`${what}: адрес файла — строка`),
          v.trim(),
          v.minLength(1, `${what}: пустой адрес`),
          v.maxLength(500, `${what}: адрес — не больше 500 символов`),
        ),
        `${what} — список адресов`,
      ),
      v.maxLength(20, `${what} — не больше 20 штук`),
    ),
    [],
  );
}

export const sortOrderField = v.pipe(
  v.number("Порядок — число"),
  v.integer("Порядок — целое число"),
  v.minValue(0, "Порядок — от 0"),
  v.maxValue(100000, "Порядок — до 100000"),
);

const isPublishedField = v.boolean("Публикация — да или нет");

// ───────────────────────────── Разделы каталога ─────────────────────────────

const categoryFields = {
  slug: slugField(),
  title: requiredText(120, "название раздела"),
  h1: optionalText(255, "H1"),
  shortDesc: optionalText(300, "короткое описание"),
  image: optionalText(500, "адрес изображения"),
  seoTitle: optionalText(255, "SEO-заголовок"),
  seoDescription: optionalText(300, "SEO-описание"),
  seoText: optionalText(20000, "SEO-текст"),
  sortOrder: sortOrderField,
  isPublished: isPublishedField,
};

export const CategoryCreateSchema = v.object({
  ...categoryFields,
  sortOrder: v.optional(sortOrderField, 10),
  isPublished: v.optional(isPublishedField, true),
});

export const CategoryUpdateSchema = v.partial(v.object(categoryFields));

export type CategoryCreateInput = v.InferOutput<typeof CategoryCreateSchema>;
export type CategoryUpdateInput = v.InferOutput<typeof CategoryUpdateSchema>;


// ────────────────────────────── Виды техники ──────────────────────────────

const typeFields = {
  categoryId: v.pipe(v.string("Выберите раздел"), v.trim(), v.minLength(1, "Выберите раздел")),
  slug: slugField(),
  name: requiredText(120, "название вида"),
  nameGenitive: requiredText(160, "название в родительном падеже"),
  priceFrom: moneyField("Цена от"),
  priceUnit: v.picklist(PRICE_UNITS, "Неизвестная единица цены"),
  minOrder: optionalText(120, "минимальный заказ"),
  deliveryTerms: optionalText(300, "условия доставки"),
  deliveryPrice: moneyField("Цена доставки"),
  crewAvailable: v.boolean("С экипажем — да или нет"),
  withoutCrewAvailable: v.boolean("Без экипажа — да или нет"),
  descriptionTop: optionalText(20000, "описание сверху"),
  worksPerformed: optionalText(20000, "какие работы выполняет"),
  gallery: photosField("Фотографии вида"),
  seoTitle: optionalText(255, "SEO-заголовок"),
  seoDescription: optionalText(300, "SEO-описание"),
  seoText: optionalText(20000, "SEO-текст"),
  sortOrder: sortOrderField,
  isPublished: isPublishedField,
};

export const TypeCreateSchema = v.object({
  ...typeFields,
  priceUnit: v.optional(typeFields.priceUnit, "SHIFT"),
  crewAvailable: v.optional(typeFields.crewAvailable, true),
  withoutCrewAvailable: v.optional(typeFields.withoutCrewAvailable, false),
  sortOrder: v.optional(sortOrderField, 10),
  isPublished: v.optional(isPublishedField, true),
});

export const TypeUpdateSchema = v.partial(v.object(typeFields));

export type TypeCreateInput = v.InferOutput<typeof TypeCreateSchema>;
export type TypeUpdateInput = v.InferOutput<typeof TypeUpdateSchema>;


// ──────────────────────── Модели и характеристики ────────────────────────

const specFields = {
  name: v.pipe(
    v.string("Характеристика: укажите название"),
    v.trim(),
    v.minLength(1, "Характеристика: название не может быть пустым"),
    v.maxLength(80, "Характеристика: название — не больше 80 символов"),
  ),
  value: v.pipe(
    v.string("Характеристика: укажите значение"),
    v.trim(),
    v.minLength(1, "Характеристика: значение не может быть пустым"),
    v.maxLength(120, "Характеристика: значение — не больше 120 символов"),
  ),
};

const specsField = v.optional(
  v.pipe(
    v.array(v.object(specFields), "Характеристики — список строк"),
    v.maxLength(40, "Характеристики — не больше 40 строк"),
  ),
  [],
);

const modelFields = {
  slug: slugField(),
  brand: requiredText(80, "марку"),
  model: requiredText(80, "модель"),
  shortDesc: optionalText(600, "Краткое описание"),
  pricePerShift: moneyField("Цена за смену"),
  pricePerHour: moneyField("Цена за час"),
  photos: photosField("Фотографии модели"),
  isAvailable: v.boolean("Доступность — да или нет"),
  sortOrder: sortOrderField,
  specs: specsField,
};

export const ModelCreateSchema = v.object({
  ...modelFields,
  slug: v.optional(modelFields.slug),
  isAvailable: v.optional(modelFields.isAvailable, true),
  sortOrder: v.optional(sortOrderField, 10),
});

export const ModelUpdateSchema = v.partial(v.object(modelFields));

export type ModelCreateInput = v.InferOutput<typeof ModelCreateSchema>;
export type ModelUpdateInput = v.InferOutput<typeof ModelUpdateSchema>;

// ─────────────────────────── «Похожая техника» ───────────────────────────

/** Порядок в массиве = порядок вывода на посадочной странице. */
export const RelatedUpdateSchema = v.object({
  relatedIds: v.pipe(
    v.array(
      v.pipe(v.string("Похожая техника: id вида — строка"), v.trim(), v.minLength(1, "Пустой id вида")),
      "Похожая техника — список id",
    ),
    v.maxLength(30, "Похожая техника — не больше 30 видов"),
    v.check((ids) => new Set(ids).size === ids.length, "Виды не должны повторяться"),
  ),
});

export type RelatedUpdateInput = v.InferOutput<typeof RelatedUpdateSchema>;

export type CatalogFieldError = FieldError;

export const toCatalogFieldErrors = toFieldErrors;
