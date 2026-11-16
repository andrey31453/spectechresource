/**
 * Форматирование дат заявок. В админке и в CSV — московское время,
 * потому что фильтр «за 16.11» тоже считается по МСК (см. `leads-filters.ts`).
 */

/** Часовой пояс отчётности и фильтров: Москва, UTC+3 (без перехода на летнее время). */
export const LEADS_TIMEZONE = "Europe/Moscow";

const DATE_TIME_FORMAT = new Intl.DateTimeFormat("ru-RU", {
  timeZone: LEADS_TIMEZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** `2026-11-16T08:05:00Z` → `16.11.2026, 11:05`; пусто → пустая строка. */
export function formatLeadDateTime(value: Date | string | null | undefined): string {
  if (!value) return "";

  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";

  return DATE_TIME_FORMAT.format(date);
}
