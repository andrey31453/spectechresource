import type { LeadStatusName } from "#shared/schemas/leads-filters";

/** DTO журнала заявок — зеркало `server/utils/lead-admin.ts`. */

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

export interface AdminLeadStatusCounts {
  all: number;
  NEW: number;
  SENT: number;
  FAILED: number;
}

export interface AdminLeadsResponse {
  leads: AdminLeadListItemDto[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
  counts: AdminLeadStatusCounts;
}

export interface AdminLeadDeliveryResult {
  sent: boolean;
  attempts: number;
  crmLeadId: string | null;
  error: string | null;
}

export interface AdminLeadRetryResponse {
  ok: boolean;
  delivery: AdminLeadDeliveryResult;
  lead: AdminLeadDto;
}
