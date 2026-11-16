import type { LeadPlace } from "#shared/schemas/leads";
import type { LeadStatusFilter, LeadStatusName } from "#shared/schemas/leads-filters";
import { LEAD_PAGE_SIZE } from "#shared/schemas/leads-filters";

/** Подписи и состояние фильтров журнала заявок на клиенте. */

export const LEAD_PLACE_LABELS: Record<LeadPlace, string> = {
  hero: "Первый экран",
  callback: "Обратный звонок",
  "landing-form": "Форма на посадочной",
  equipment: "Страница техники",
  contacts: "Контакты",
  footer: "Подвал сайта",
};

export function leadPlaceLabel(place: string): string {
  return LEAD_PLACE_LABELS[place as LeadPlace] ?? place;
}

/** Цвет бейджа: новая — нейтральная, отправленная — зелёная, ошибка — красная. */
export function leadStatusBadgeClass(status: LeadStatusName): string {
  if (status === "SENT") return "admin-badge admin-badge--on";
  if (status === "FAILED") return "admin-badge admin-badge--off";
  return "admin-badge";
}

export interface AdminLeadFilterState {
  status: LeadStatusFilter;
  place: LeadPlace | "";
  from: string;
  to: string;
  q: string;
  page: number;
  pageSize: number;
}

export function emptyLeadFilterState(): AdminLeadFilterState {
  return {
    status: "all",
    place: "",
    from: "",
    to: "",
    q: "",
    page: 1,
    pageSize: LEAD_PAGE_SIZE.default,
  };
}

export interface LeadQueryOptions {
  /** Для выгрузки страница не нужна: CSV отдаёт всё по фильтрам. */
  withPage?: boolean;
}

/**
 * Состояние фильтров → query API. Пустые поля не отправляются,
 * чтобы ссылка на выгрузку и запрос списка были короткими.
 */
export function leadFiltersQuery(
  filters: AdminLeadFilterState,
  options: LeadQueryOptions = {},
): Record<string, string> {
  const { withPage = true } = options;
  const query: Record<string, string> = {};

  if (filters.status !== "all") query.status = filters.status;
  if (filters.place) query.place = filters.place;
  if (filters.from) query.from = filters.from;
  if (filters.to) query.to = filters.to;
  if (filters.q.trim()) query.q = filters.q.trim();

  if (withPage) {
    query.page = String(filters.page);
    query.pageSize = String(filters.pageSize);
  }

  return query;
}

/** Ссылка на скачивание CSV с текущими фильтрами. */
export function leadExportUrl(filters: AdminLeadFilterState): string {
  const query = new URLSearchParams(leadFiltersQuery(filters, { withPage: false })).toString();
  return query ? `/api/admin/leads/export.csv?${query}` : "/api/admin/leads/export.csv";
}
