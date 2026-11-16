import { LEAD_STATUS_LABELS } from "#shared/schemas/leads-filters";
import { toCsv } from "#shared/utils/csv";
import { formatLeadDateTime } from "#shared/utils/leads-format";

/**
 * Выгрузка журнала заявок в CSV: те же поля, что в карточке, плюс служебные.
 *
 * Заголовки по-русски и в порядке «сначала человек, потом служебное»: файл открывают
 * в Excel и читают глазами, а не парсят роботом. Даты — московские.
 */

export const LEAD_CSV_HEADERS = [
  "ID",
  "Создана",
  "Статус",
  "Имя",
  "Телефон",
  "E-mail",
  "Комментарий",
  "Форма",
  "Страница",
  "Заголовок страницы",
  "Техника",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "Согласие",
  "Редакция согласия",
  "Попыток",
  "Отправлена",
  "ID в CRM",
  "Ошибка отправки",
  "Referer",
  "IP",
  "User-Agent",
] as const;

export interface LeadCsvSource {
  id: string;
  createdAt: Date;
  status: keyof typeof LEAD_STATUS_LABELS;
  name: string;
  phone: string;
  email: string | null;
  comment: string | null;
  place: string;
  pageUrl: string;
  pageTitle: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  consentAt: Date;
  consentVersion: string;
  attempts: number;
  sentAt: Date | null;
  crmLeadId: string | null;
  errorText: string | null;
  referer: string | null;
  ip: string | null;
  userAgent: string | null;
  equipmentType?: { name: string } | null;
}

/** Одна заявка → строка в порядке `LEAD_CSV_HEADERS`. */
export function leadToCsvRow(lead: LeadCsvSource): Array<string | number | null> {
  return [
    lead.id,
    formatLeadDateTime(lead.createdAt),
    LEAD_STATUS_LABELS[lead.status],
    lead.name,
    lead.phone,
    lead.email,
    lead.comment,
    lead.place,
    lead.pageUrl,
    lead.pageTitle,
    lead.equipmentType?.name ?? null,
    lead.utmSource,
    lead.utmMedium,
    lead.utmCampaign,
    lead.utmContent,
    lead.utmTerm,
    formatLeadDateTime(lead.consentAt),
    lead.consentVersion,
    lead.attempts,
    formatLeadDateTime(lead.sentAt),
    lead.crmLeadId,
    lead.errorText,
    lead.referer,
    lead.ip,
    lead.userAgent,
  ];
}

/** Заголовок + строки, BOM и `;` — файл сразу открывается в русском Excel. */
export function leadsToCsv(leads: ReadonlyArray<LeadCsvSource>): string {
  return toCsv([LEAD_CSV_HEADERS, ...leads.map(leadToCsvRow)]);
}
