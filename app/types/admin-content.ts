/**
 * DTO контентных блоков админки — зеркало `server/utils/content-admin.ts`.
 *
 * `equipmentTypeTitle`/`serviceTitle` — подписи привязок FAQ: таблица показывает,
 * где именно встретится вопрос, без дополнительных запросов.
 */

export type FaqScopeName = "GLOBAL" | "TYPE" | "SERVICE";

export interface AdminFaqDto {
  id: string;
  scope: FaqScopeName;
  equipmentTypeId: string | null;
  serviceId: string | null;
  equipmentTypeTitle: string | null;
  serviceTitle: string | null;
  question: string;
  answer: string;
  sortOrder: number;
  isPublished: boolean;
  updatedAt: string;
}

export interface AdminAdvantageDto {
  id: string;
  title: string;
  text: string | null;
  icon: string | null;
  sortOrder: number;
  isPublished: boolean;
  updatedAt: string;
}

export interface AdminWorkStepDto {
  id: string;
  title: string;
  text: string | null;
  sortOrder: number;
  isPublished: boolean;
}

export interface AdminTrustStatDto {
  id: string;
  value: string;
  unit: string | null;
  label: string;
  sortOrder: number;
  isPublished: boolean;
}

/** Справочники для выбора привязки FAQ. */
export interface AdminServiceRefDto {
  id: string;
  title: string;
  slug: string;
}

export interface AdminEquipmentTypeRefDto {
  id: string;
  name: string;
  categoryTitle: string;
}

export interface AdminContentDto {
  faq: AdminFaqDto[];
  advantages: AdminAdvantageDto[];
  steps: AdminWorkStepDto[];
  stats: AdminTrustStatDto[];
  services: AdminServiceRefDto[];
  types: AdminEquipmentTypeRefDto[];
}
