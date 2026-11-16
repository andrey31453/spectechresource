import * as v from "valibot";
import { normalizePhone } from "#shared/utils/phone";
import { toFieldErrors, type FieldError } from "./errors";

/**
 * Схема заявки — одна для формы (клиент) и для `POST /api/leads` (сервер).
 * Ошибки сформулированы по-русски и годятся для показа у поля.
 */

/** Откуда пришла заявка: блоки формы на сайте. */
export const LEAD_PLACES = [
  "hero",
  "callback",
  "landing-form",
  "equipment",
  "contacts",
  "footer",
] as const;

export type LeadPlace = (typeof LEAD_PLACES)[number];

const MAX = {
  name: 80,
  email: 254,
  comment: 2000,
  pageTitle: 200,
  url: 2048,
  utm: 200,
  equipmentSlug: 80,
} as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const EQUIPMENT_SLUG_RE = /^[a-z0-9-]{1,80}$/;

/** Пустая строка от клиента — это «поле не заполнено», а не значение. */
function optionalText(max: number, message: string) {
  return v.optional(
    v.pipe(
      v.nullish(v.string()),
      v.transform((value) => {
        const text = typeof value === "string" ? value.trim() : "";
        return text === "" ? null : text;
      }),
      v.check((value) => value === null || value.length <= max, message),
    ),
    null,
  );
}

const emailField = v.pipe(
  optionalText(MAX.email, `E-mail — не больше ${MAX.email} символов`),
  v.check((value) => value === null || EMAIL_RE.test(value), "Проверьте e-mail: нужен вид name@example.ru"),
);

const equipmentSlugField = v.optional(
  v.pipe(
    v.nullish(v.string()),
    v.transform((value) => {
      const text = typeof value === "string" ? value.trim() : "";
      return text === "" ? null : text;
    }),
    v.check(
      (value) => value === null || EQUIPMENT_SLUG_RE.test(value),
      "Некорректный код вида техники",
    ),
  ),
  null,
);

export const LeadSchema = v.object({
  name: v.pipe(
    v.string("Укажите, как к вам обращаться"),
    v.trim(),
    v.minLength(2, "Имя — минимум 2 символа"),
    v.maxLength(MAX.name, `Имя — не больше ${MAX.name} символов`),
  ),
  phone: v.pipe(
    v.string("Укажите телефон"),
    v.transform(normalizePhone),
    v.regex(/^\+7\d{10}$/, "Телефон в формате +7 (999) 123-45-67"),
  ),
  email: emailField,
  comment: optionalText(MAX.comment, `Комментарий — не больше ${MAX.comment} символов`),
  consent: v.literal(true, "Без согласия на обработку персональных данных заявку принять нельзя"),
  place: v.picklist(LEAD_PLACES, "Неизвестное место формы"),
  pageUrl: v.pipe(
    v.string("Не передан адрес страницы"),
    v.trim(),
    v.maxLength(MAX.url, `Адрес страницы — не больше ${MAX.url} символов`),
    v.regex(/^https?:\/\/\S+$/i, "Адрес страницы должен начинаться с http:// или https://"),
  ),
  pageTitle: optionalText(MAX.pageTitle, `Заголовок страницы — не больше ${MAX.pageTitle} символов`),
  referer: optionalText(MAX.url, `Referer — не больше ${MAX.url} символов`),
  utmSource: optionalText(MAX.utm, `utm_source — не больше ${MAX.utm} символов`),
  utmMedium: optionalText(MAX.utm, `utm_medium — не больше ${MAX.utm} символов`),
  utmCampaign: optionalText(MAX.utm, `utm_campaign — не больше ${MAX.utm} символов`),
  utmContent: optionalText(MAX.utm, `utm_content — не больше ${MAX.utm} символов`),
  utmTerm: optionalText(MAX.utm, `utm_term — не больше ${MAX.utm} символов`),
  /** Вид техники передаётся кодом (slug), а не id: клиент не знает внутренних id. */
  equipmentTypeSlug: equipmentSlugField,
  /** Идемпотентность: один и тот же идентификатор не создаёт второй лид. */
  requestId: v.pipe(v.string("Не передан идентификатор запроса"), v.uuid("Некорректный идентификатор запроса")),
  /** Ловушка для ботов: люди это поле не видят и не заполняют. */
  honeypot: v.optional(
    v.pipe(
      v.nullish(v.string()),
      v.transform((value) => (typeof value === "string" ? value.trim() : "")),
    ),
    "",
  ),
});

export type LeadInput = v.InferOutput<typeof LeadSchema>;

export type LeadFieldError = FieldError;

/** Ошибки valibot → плоский список для ответа API и подсветки полей в форме. */
export const toLeadFieldErrors = toFieldErrors;
