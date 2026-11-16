import * as v from "valibot";
import { optionalText, requiredText, slugField, sortOrderField } from "./catalog";
import { toFieldErrors, type FieldError } from "./errors";

/**
 * Схемы настроек сайта и городов — одни для админ-формы и админ-API.
 *
 * Форма шлёт строки: `«55,75»` превращается в `55.75`, пустое необязательное поле — в `null`,
 * чтобы в БД не появлялись пустые строки вместо «не заполнено».
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
/** Телефон хранится в отображаемом виде: `+7 (495) 000-00-00`. Нормализация — на стороне формы. */
const PHONE_RE = /^\+?[\d\s()-]{10,25}$/;
const METRIKA_RE = /^\d{1,10}$/;

const emailField = v.pipe(
  optionalText(254, "e-mail"),
  v.check((value) => value === null || EMAIL_RE.test(value), "Проверьте e-mail: нужен вид name@example.ru"),
);

/** ИНН и ОГРН: только цифры и строго определённая длина. */
function digitsField(allowed: readonly number[], what: string) {
  return v.optional(
    v.pipe(
      v.unknown(),
      v.transform((value) => {
        const text = value === null || value === undefined ? "" : String(value).trim();
        return text === "" ? null : text;
      }),
      v.check(
        (value) => value === null || (/^\d+$/.test(value) && allowed.includes(value.length)),
        `${what} — ${allowed.join(" или ")} цифр`,
      ),
    ),
    null,
  );
}

/**
 * Широта/долгота: принимаем строку с запятой (`55,75`) и число.
 * Нечисловой ввод превращается в `NaN` — тип остаётся `number | null`, а проверка его отклоняет.
 */
function coordinateField(limit: number, what: string) {
  return v.optional(
    v.pipe(
      v.unknown(),
      v.transform((value) => {
        if (value === null || value === undefined) return null;

        const text = String(value).replace(",", ".").trim();
        if (text === "") return null;

        const numeric = Number(text);
        return Number.isFinite(numeric) ? numeric : Number.NaN;
      }),
      v.check(
        (value) => value === null || (value >= -limit && value <= limit),
        `${what} — число от -${limit} до ${limit}`,
      ),
    ),
    null,
  );
}

// ───────────────────────────── Настройки сайта ─────────────────────────────

export const SiteSettingsUpdateSchema = v.object({
  companyName: requiredText(200, "название компании"),
  phone: v.pipe(
    v.string("Укажите телефон"),
    v.trim(),
    v.minLength(10, "Телефон — минимум 10 символов"),
    v.maxLength(25, "Телефон — не больше 25 символов"),
    v.regex(PHONE_RE, "Телефон: цифры, пробел, + ( ) и дефис — например, +7 (495) 000-00-00"),
  ),
  email: emailField,
  telegram: optionalText(200, "Telegram"),
  whatsapp: optionalText(200, "WhatsApp"),
  maxMessenger: optionalText(200, "MAX"),
  workingHours: optionalText(120, "часы работы"),
  address: optionalText(300, "адрес"),
  cityId: v.pipe(v.string("Выберите город"), v.trim(), v.minLength(1, "Выберите город")),
  mapLat: coordinateField(90, "Широта"),
  mapLng: coordinateField(180, "Долгота"),
  legalName: optionalText(255, "юридическое название"),
  inn: digitsField([10, 12], "ИНН"),
  ogrn: digitsField([13, 15], "ОГРН"),
  legalAddress: optionalText(255, "юридический адрес"),
  priceDisclaimer: requiredText(300, "дисклеймер о ценах"),
  metrikaId: v.optional(
    v.pipe(
      v.unknown(),
      v.transform((value) => {
        const text = value === null || value === undefined ? "" : String(value).trim();
        return text === "" ? null : text;
      }),
      v.check((value) => value === null || METRIKA_RE.test(value), "ID Метрики — 1–10 цифр"),
    ),
    null,
  ),
});

export type SiteSettingsUpdateInput = v.InferOutput<typeof SiteSettingsUpdateSchema>;

// ──────────────────────────────── Города ────────────────────────────────

const cityFields = {
  slug: slugField(),
  name: requiredText(120, "название города"),
  nameIn: requiredText(120, "название в предложном падеже"),
  sortOrder: sortOrderField,
  isDefault: v.boolean("Город по умолчанию — да или нет"),
  isActive: v.boolean("Активность — да или нет"),
};

export const CityCreateSchema = v.object({
  ...cityFields,
  sortOrder: v.optional(sortOrderField, 10),
  isDefault: v.optional(cityFields.isDefault, false),
  isActive: v.optional(cityFields.isActive, true),
});

export const CityUpdateSchema = v.partial(v.object(cityFields));

export type CityCreateInput = v.InferOutput<typeof CityCreateSchema>;
export type CityUpdateInput = v.InferOutput<typeof CityUpdateSchema>;

export type AdminSettingsFieldError = FieldError;

export const toAdminSettingsFieldErrors = toFieldErrors;
