import type { LeadInput } from "#shared/schemas/leads";
import type { BitrixSendResult, CrmLead } from "./bitrix";

/**
 * Сборка записи `Lead` из проверенных данных формы и контекста запроса.
 * Чистые функции без Prisma — проверяются юнит-тестами.
 */

export interface LeadRequestContext {
  ip: string | null;
  userAgent: string | null;
  /** Редакция политики обработки ПДн, с которой согласился посетитель. */
  consentVersion: string;
  now?: Date;
}

export interface LeadRefs {
  equipmentTypeId?: string | null;
  equipmentTypeName?: string | null;
}

export interface LeadCreateData {
  requestId: string;
  name: string;
  phone: string;
  email: string | null;
  comment: string | null;
  place: string;
  pageUrl: string;
  pageTitle: string | null;
  referer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  equipmentTypeId: string | null;
  consentAt: Date;
  consentVersion: string;
  ip: string | null;
  userAgent: string | null;
}

export function buildLeadCreateData(
  input: LeadInput,
  context: LeadRequestContext,
  refs: LeadRefs = {},
): LeadCreateData {
  return {
    requestId: input.requestId,
    name: input.name,
    phone: input.phone,
    email: input.email,
    comment: input.comment,
    place: input.place,
    pageUrl: input.pageUrl,
    pageTitle: input.pageTitle,
    referer: input.referer,
    utmSource: input.utmSource,
    utmMedium: input.utmMedium,
    utmCampaign: input.utmCampaign,
    utmContent: input.utmContent,
    utmTerm: input.utmTerm,
    equipmentTypeId: refs.equipmentTypeId ?? null,
    consentAt: context.now ?? new Date(),
    consentVersion: context.consentVersion,
    ip: context.ip,
    userAgent: context.userAgent,
  };
}

/** Запись из БД → данные для CRM. */
export function toCrmLead(data: LeadCreateData, equipmentTypeName: string | null = null): CrmLead {
  return {
    name: data.name,
    phone: data.phone,
    email: data.email,
    comment: data.comment,
    pageUrl: data.pageUrl,
    pageTitle: data.pageTitle,
    place: data.place,
    utmSource: data.utmSource,
    utmMedium: data.utmMedium,
    utmCampaign: data.utmCampaign,
    utmContent: data.utmContent,
    utmTerm: data.utmTerm,
    equipmentTypeName,
    createdAt: data.consentAt,
  };
}

export interface LeadRecordSource {
  name: string;
  phone: string;
  email: string | null;
  comment: string | null;
  pageUrl: string;
  pageTitle: string | null;
  place: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  createdAt: Date;
  equipmentType?: { name: string } | null;
}

/** Запись `Lead` из БД → данные для CRM (для задачи досылки). */
export function crmLeadFromRecord(record: LeadRecordSource): CrmLead {
  return {
    name: record.name,
    phone: record.phone,
    email: record.email,
    comment: record.comment,
    pageUrl: record.pageUrl,
    pageTitle: record.pageTitle,
    place: record.place,
    utmSource: record.utmSource,
    utmMedium: record.utmMedium,
    utmCampaign: record.utmCampaign,
    utmContent: record.utmContent,
    utmTerm: record.utmTerm,
    equipmentTypeName: record.equipmentType?.name ?? null,
    createdAt: record.createdAt,
  };
}

/**
 * Режим «не отправлять в реальную CRM». По умолчанию включён: значения,
 * которых нет в окружении, не должны приводить к боевым лидам в Битрикс24.
 */
export function isDryRun(value: unknown): boolean {
  return String(value ?? "true").toLowerCase() !== "false";
}

/** Prisma-ошибка уникальности `requestId` (P2002) — повторная отправка той же формы. */
export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

export interface LeadDeliveryDeps {
  updateLead: (id: string, data: Record<string, unknown>) => Promise<unknown>;
  send: (lead: CrmLead) => Promise<BitrixSendResult>;
  dryRun: boolean;
  now?: () => Date;
}

export interface LeadDeliveryResult {
  sent: boolean;
  attempts: number;
  crmLeadId: string | null;
  error: string | null;
}

/**
 * Доставка сохранённой заявки в CRM и фиксация результата в `Lead`.
 * Ошибка CRM не отменяет заявку: она уже в БД, статус — `FAILED`, повтор через задачу/админку.
 */
export async function deliverLead(
  lead: { id: string; crm: CrmLead },
  deps: LeadDeliveryDeps,
): Promise<LeadDeliveryResult> {
  if (deps.dryRun) {
    await deps.updateLead(lead.id, { attempts: { increment: 1 } });
    return { sent: false, attempts: 1, crmLeadId: null, error: null };
  }

  const result = await deps.send(lead.crm);

  if (result.attempts === 0) {
    await deps.updateLead(lead.id, { status: "NEW", errorText: result.error });
    return { sent: false, attempts: 0, crmLeadId: null, error: result.error };
  }

  if (result.ok) {
    const sentAt = (deps.now ?? (() => new Date()))();
    await deps.updateLead(lead.id, {
      status: "SENT",
      sentAt,
      crmLeadId: result.crmLeadId,
      errorText: null,
      attempts: { increment: result.attempts },
    });
    return { sent: true, attempts: result.attempts, crmLeadId: result.crmLeadId, error: null };
  }

  await deps.updateLead(lead.id, {
    status: "FAILED",
    errorText: result.error,
    attempts: { increment: result.attempts },
  });
  return { sent: false, attempts: result.attempts, crmLeadId: null, error: result.error };
}
