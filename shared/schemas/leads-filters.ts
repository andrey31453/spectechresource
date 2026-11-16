import * as v from "valibot";
import { normalizePhone, isNormalizedPhone } from "#shared/utils/phone";
import { LEAD_PLACES, type LeadPlace } from "./leads";

/**
 * Фильтры журнала заявок — одна схема для админ-API и клиентских ссылок.
 *
 * Даты приходят как `ГГГГ-ММ-ДД` и трактуются как московские сутки (UTC+3): заказчик
 * смотрит «заявки за 16 ноября» по московскому времени, а не по UTC.
 */

export const LEAD_STATUSES = ["NEW", "SENT", "FAILED"] as const;
export type LeadStatusName = (typeof LEAD_STATUSES)[number];
export type LeadStatusFilter = LeadStatusName | "all";

export const LEAD_STATUS_LABELS: Record<LeadStatusName, string> = {
  NEW: "Новая",
  SENT: "Отправлена",
  FAILED: "Ошибка",
};

/** Москва, UTC+3 без перехода на летнее время. */
export const LEADS_TIMEZONE_OFFSET_MINUTES = 3 * 60;

export const LEAD_PAGE_SIZE = { default: 20, min: 10, max: 100 } as const;
/** Глубже этого списка никто не листает, а гигантский `skip` только нагружает БД. */
export const LEAD_PAGE_MAX = 10_000;
export const LEAD_SEARCH_MAX = 100;
/** Потолок выгрузки: больше за один файл заказчику не нужно, а память сервера конечна. */
export const LEADS_EXPORT_LIMIT = 5000;

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** `2026-11-16` → части даты; `null`, если дата не существует (31 февраля и т.п.). */
export function parseLeadDateParts(value: string): { year: number; month: number; day: number } | null {
  const match = DATE_RE.exec(value.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }

  return { year, month, day };
}

/** Начало московских суток (`00:00:00.000 МСК`). */
export function leadDayStart(value: string): Date | null {
  const parts = parseLeadDateParts(value);
  if (!parts) return null;

  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day) - LEADS_TIMEZONE_OFFSET_MINUTES * 60_000);
}

/** Последняя миллисекунда московских суток (`23:59:59.999 МСК`). */
export function leadDayEnd(value: string): Date | null {
  const parts = parseLeadDateParts(value);
  if (!parts) return null;

  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day + 1) - LEADS_TIMEZONE_OFFSET_MINUTES * 60_000 - 1);
}

function textField(max: number, message: string) {
  return v.optional(
    v.pipe(
      v.nullish(v.string()),
      v.transform((value) => (typeof value === "string" ? value.trim() : "")),
      v.check((value) => value.length <= max, message),
      v.transform((value) => (value === "" ? null : value)),
    ),
    null,
  );
}

function dateField(message: string) {
  return v.optional(
    v.pipe(
      v.nullish(v.string()),
      v.transform((value) => (typeof value === "string" ? value.trim() : "")),
      v.check((value) => value === "" || parseLeadDateParts(value) !== null, message),
      v.transform((value) => (value === "" ? null : value)),
    ),
    null,
  );
}

/** Query-строки приходят как строки, JSON-тело — как числа: приводим к целому. */
function toInt(value: string | number | null | undefined): number {
  if (typeof value === "number" && Number.isFinite(value)) return Math.trunc(value);

  const text = typeof value === "string" ? value.trim() : "";
  return text === "" ? Number.NaN : Number.parseInt(text, 10);
}

function clamp(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

export type LeadFilters = {
  status: LeadStatusFilter;
  place: LeadPlace | null;
  from: string | null;
  to: string | null;
  q: string | null;
  page: number;
  pageSize: number;
};

export const LeadFiltersSchema = v.pipe(
  v.object({
    status: v.optional(
      v.pipe(
        v.nullish(v.string()),
        v.transform((value) => (typeof value === "string" ? value.trim() : "")),
        v.check(
          (value) => value === "" || value === "all" || LEAD_STATUSES.includes(value as LeadStatusName),
          "Неизвестный статус заявки",
        ),
        v.transform((value) => (value === "" || value === "all" ? "all" : value) as LeadStatusFilter),
      ),
      "all",
    ),
    place: v.optional(
      v.pipe(
        v.nullish(v.string()),
        v.transform((value) => (typeof value === "string" ? value.trim() : "")),
        v.check((value) => value === "" || LEAD_PLACES.includes(value as LeadPlace), "Неизвестное место формы"),
        v.transform((value) => (value === "" ? null : (value as LeadPlace))),
      ),
      null,
    ),
    from: dateField("Дата начала — в формате ГГГГ-ММ-ДД"),
    to: dateField("Дата конца — в формате ГГГГ-ММ-ДД"),
    q: textField(LEAD_SEARCH_MAX, `Поиск — не больше ${LEAD_SEARCH_MAX} символов`),
    page: v.optional(
      v.pipe(
        v.nullish(v.union([v.string(), v.number()])),
        v.transform(toInt),
        v.transform((value) => clamp(value, 1, LEAD_PAGE_MAX, 1)),
      ),
      1,
    ),
    pageSize: v.optional(
      v.pipe(
        v.nullish(v.union([v.string(), v.number()])),
        v.transform(toInt),
        v.transform((value) => clamp(value, LEAD_PAGE_SIZE.min, LEAD_PAGE_SIZE.max, LEAD_PAGE_SIZE.default)),
      ),
      LEAD_PAGE_SIZE.default,
    ),
  }),
  v.forward(
    v.check((filters) => !filters.from || !filters.to || filters.from <= filters.to, "Дата начала позже даты конца"),
    ["to"],
  ),
);

export type LeadFiltersInput = v.InferOutput<typeof LeadFiltersSchema>;

/** Пустые фильтры: «все заявки», первая страница. */
export function emptyLeadFilters(): LeadFiltersInput {
  return {
    status: "all",
    place: null,
    from: null,
    to: null,
    q: null,
    page: 1,
    pageSize: LEAD_PAGE_SIZE.default,
  };
}

/** Диапазон `createdAt` по выбранным датам; `null`, если ни одна дата не задана. */
export function leadCreatedAtRange(filters: Pick<LeadFiltersInput, "from" | "to">): { gte?: Date; lte?: Date } | null {
  const gte = filters.from ? leadDayStart(filters.from) : null;
  const lte = filters.to ? leadDayEnd(filters.to) : null;

  if (!gte && !lte) return null;

  return { ...(gte ? { gte } : {}), ...(lte ? { lte } : {}) };
}

export interface LeadSearchTerms {
  /** Исходная строка без пробелов по краям. */
  text: string | null;
  /** Канонический телефон, если поиск похож на номер: `+79991234567`. */
  phone: string | null;
  /** Цифры строки (от 3): по ним ищем в `phone`, где номер хранится с разделителями. */
  digits: string | null;
}

/** «+7 (999) 123-45-67», «9991234567», «ivan@example.ru», «Иван» — что искать и как. */
export function leadSearchTerms(query: string | null): LeadSearchTerms {
  const text = query?.trim() ?? "";
  if (!text) return { text: null, phone: null, digits: null };

  const digits = text.replace(/\D/g, "");
  const normalized = normalizePhone(text);

  return {
    text,
    phone: isNormalizedPhone(normalized) ? normalized : null,
    digits: digits.length >= 3 ? digits : null,
  };
}
