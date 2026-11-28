import type { LocationQuery, LocationQueryValue } from "vue-router";
import type { LeadPlace } from "#shared/schemas/leads";

/**
 * Клиентские помощники формы: разбор UTM и сборка тела `POST /api/leads`.
 * Схема — одна (`shared/schemas/leads.ts`), поэтому клиент отправляет ровно её поля.
 */

export interface UtmParams {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
}

/** Лимиты полей из схемы: длинный мусор в адресе не должен ломать отправку. */
const LIMITS = { utm: 200, pageTitle: 200, url: 2048 } as const;

function firstQueryValue(
  value: LocationQueryValue | LocationQueryValue[] | undefined,
): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string") return null;

  const text = raw.trim();
  return text ? text.slice(0, LIMITS.utm) : null;
}

/** UTM-метки из адреса страницы: только известные ключи, без пустых значений. */
export function utmFromQuery(query: LocationQuery): UtmParams {
  return {
    utmSource: firstQueryValue(query["utm_source"]),
    utmMedium: firstQueryValue(query["utm_medium"]),
    utmCampaign: firstQueryValue(query["utm_campaign"]),
    utmContent: firstQueryValue(query["utm_content"]),
    utmTerm: firstQueryValue(query["utm_term"]),
  };
}

export interface LeadPayloadInput {
  place: LeadPlace;
  name: string;
  phone: string;
  email?: string | null;
  comment?: string | null;
  consent: boolean;
  /** Абсолютный адрес страницы: схема требует `http://` или `https://`. */
  pageUrl: string;
  requestId: string;
  equipmentTypeSlug?: string | null;
  equipmentModelId?: string | null;
  honeypot?: string;
  pageTitle?: string | null;
  sourceLabel?: string | null;
  sourceButton?: string | null;
  referer?: string | null;
  query?: LocationQuery;
}

function trimmedOrNull(value: string | null | undefined, max: number): string | null {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) return null;

  return text.slice(0, max);
}

/** Тело заявки: значения полей как есть, пустые строки — `null`. */
export function buildLeadPayload(input: LeadPayloadInput) {
  return {
    name: input.name.trim(),
    phone: input.phone.trim(),
    email: trimmedOrNull(input.email, 254),
    comment: trimmedOrNull(input.comment, 2000),
    consent: input.consent,
    place: input.place,
    pageUrl: input.pageUrl,
    pageTitle: trimmedOrNull(input.pageTitle, LIMITS.pageTitle),
    sourceLabel: trimmedOrNull(input.sourceLabel, 300),
    sourceButton: trimmedOrNull(input.sourceButton, 300),
    referer: trimmedOrNull(input.referer, LIMITS.url),
    ...utmFromQuery(input.query ?? {}),
    equipmentTypeSlug: trimmedOrNull(input.equipmentTypeSlug, 80),
    ...(input.equipmentModelId ? { equipmentModelId: input.equipmentModelId } : {}),
    requestId: input.requestId,
    honeypot: input.honeypot ?? "",
  };
}

/**
 * Идентификатор запроса для идемпотентности. `crypto.randomUUID` есть не везде
 * (например, http-стенд без secure context), поэтому есть запасной генератор UUID v4.
 */
export function createRequestId(): string {
  const cryptoApi = globalThis.crypto;

  if (typeof cryptoApi?.randomUUID === "function") {
    return cryptoApi.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}