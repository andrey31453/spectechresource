import type { LeadStatusName } from "#shared/schemas/leads-filters";

/**
 * DTO журнала заявок: Prisma-запись → плоский JSON для админки.
 * Телефон уже канонический (`+7XXXXXXXXXX`), даты — ISO-строки.
 */

export interface AdminLeadListItemDto {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  place: string;
  pageUrl: string;
  pageTitle: string | null;
  equipmentTypeName: string | null;
  status: LeadStatusName;
  attempts: number;
  createdAt: string;
  sentAt: string | null;
  crmLeadId: string | null;
  errorText: string | null;
}

export interface AdminLeadDto extends AdminLeadListItemDto {
  sourceLabel: string | null;
  sourceButton: string | null;
  comment: string | null;
  referer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  consentAt: string;
  consentVersion: string;
  ip: string | null;
  userAgent: string | null;
  requestId: string;
  updatedAt: string;
}

export interface LeadListRow {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  place: string;
  pageUrl: string;
  pageTitle: string | null;
  status: LeadStatusName;
  attempts: number;
  createdAt: Date;
  sentAt: Date | null;
  crmLeadId: string | null;
  errorText: string | null;
  equipmentType?: { name: string } | null;
}

export interface LeadDetailRow extends LeadListRow {
  sourceLabel?: string | null;
  sourceButton?: string | null;
  comment: string | null;
  referer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  consentAt: Date;
  consentVersion: string;
  ip: string | null;
  userAgent: string | null;
  requestId: string;
  updatedAt: Date;
}

export function toAdminLeadListItem(lead: LeadListRow): AdminLeadListItemDto {
  return {
    id: lead.id,
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    place: lead.place,
    pageUrl: lead.pageUrl,
    pageTitle: lead.pageTitle,
    equipmentTypeName: lead.equipmentType?.name ?? null,
    status: lead.status,
    attempts: lead.attempts,
    createdAt: lead.createdAt.toISOString(),
    sentAt: lead.sentAt ? lead.sentAt.toISOString() : null,
    crmLeadId: lead.crmLeadId,
    errorText: lead.errorText,
  };
}

export function toAdminLead(lead: LeadDetailRow): AdminLeadDto {
  return {
    ...toAdminLeadListItem(lead),
    sourceLabel: lead.sourceLabel ?? null,
    sourceButton: lead.sourceButton ?? null,
    comment: lead.comment,
    referer: lead.referer,
    utmSource: lead.utmSource,
    utmMedium: lead.utmMedium,
    utmCampaign: lead.utmCampaign,
    utmContent: lead.utmContent,
    utmTerm: lead.utmTerm,
    consentAt: lead.consentAt.toISOString(),
    consentVersion: lead.consentVersion,
    ip: lead.ip,
    userAgent: lead.userAgent,
    requestId: lead.requestId,
    updatedAt: lead.updatedAt.toISOString(),
  };
}

export interface LeadStatusCounts {
  all: number;
  NEW: number;
  SENT: number;
  FAILED: number;
}

/** `groupBy(status)` → счётчики для вкладок списка. */
export function leadStatusCounts(
  groups: ReadonlyArray<{ status: LeadStatusName; _count: { _all: number } }>,
): LeadStatusCounts {
  const counts: LeadStatusCounts = { all: 0, NEW: 0, SENT: 0, FAILED: 0 };

  for (const group of groups) {
    const value = group._count._all;
    counts.all += value;
    counts[group.status] = value;
  }

  return counts;
}

/**
 * Можно ли повторять отправку. Успешную заявку не отправляем повторно:
 * в CRM появился бы дубль, а исходный лид уже ведёт клиента.
 */
export function leadRetryBlockReason(lead: { status: LeadStatusName; crmLeadId: string | null }): string | null {
  if (lead.status !== "SENT") return null;

  return `Заявка уже отправлена в CRM${lead.crmLeadId ? ` (ID ${lead.crmLeadId})` : ""} — повтор создаст дубль.`;
}
