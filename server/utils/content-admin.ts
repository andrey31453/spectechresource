import type { PrismaClient } from "../../generated/prisma/client";
import type { FaqTarget } from "#shared/schemas/admin-content";
import type { FieldError } from "#shared/schemas/errors";

/**
 * DTO контентных блоков: Prisma-строки → плоский JSON.
 *
 * Привязки FAQ отдаём и id (`форма выбирает значение`), и подписями (`таблица показывает,
 * где встретится вопрос`): справочники уже загружены вместе со списками.
 */

export interface AdminFaqDto {
  id: string;
  scope: FaqTarget["scope"];
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

export function toAdminFaq(item: {
  id: string;
  scope: FaqTarget["scope"];
  equipmentTypeId: string | null;
  serviceId: string | null;
  question: string;
  answer: string;
  sortOrder: number;
  isPublished: boolean;
  updatedAt: Date;
  equipmentType?: { name: string } | null;
  service?: { title: string } | null;
}): AdminFaqDto {
  return {
    id: item.id,
    scope: item.scope,
    equipmentTypeId: item.equipmentTypeId,
    serviceId: item.serviceId,
    equipmentTypeTitle: item.equipmentType?.name ?? null,
    serviceTitle: item.service?.title ?? null,
    question: item.question,
    answer: item.answer,
    sortOrder: item.sortOrder,
    isPublished: item.isPublished,
    updatedAt: item.updatedAt.toISOString(),
  };
}

/**
 * Привязка FAQ должна указывать на существующую запись: иначе Prisma упадёт на внешнем ключе.
 * Проверяем до записи и отвечаем обычной ошибкой поля.
 */
export async function findFaqTargetIssue(prisma: PrismaClient, target: FaqTarget): Promise<FieldError | null> {
  if (target.scope === "TYPE" && target.equipmentTypeId) {
    const exists = await prisma.equipmentType.findUnique({
      where: { id: target.equipmentTypeId },
      select: { id: true },
    });

    if (!exists) return { field: "equipmentTypeId", message: "Такого вида техники нет" };
  }

  if (target.scope === "SERVICE" && target.serviceId) {
    const exists = await prisma.service.findUnique({
      where: { id: target.serviceId },
      select: { id: true },
    });

    if (!exists) return { field: "serviceId", message: "Такой услуги нет" };
  }

  return null;
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

export function toAdminAdvantage(item: {
  id: string;
  title: string;
  text: string | null;
  icon: string | null;
  sortOrder: number;
  isPublished: boolean;
  updatedAt: Date;
}): AdminAdvantageDto {
  return {
    id: item.id,
    title: item.title,
    text: item.text,
    icon: item.icon,
    sortOrder: item.sortOrder,
    isPublished: item.isPublished,
    updatedAt: item.updatedAt.toISOString(),
  };
}

export interface AdminWorkStepDto {
  id: string;
  title: string;
  text: string | null;
  sortOrder: number;
  isPublished: boolean;
}

export function toAdminWorkStep(item: {
  id: string;
  title: string;
  text: string | null;
  sortOrder: number;
  isPublished: boolean;
}): AdminWorkStepDto {
  return {
    id: item.id,
    title: item.title,
    text: item.text,
    sortOrder: item.sortOrder,
    isPublished: item.isPublished,
  };
}

export interface AdminTrustStatDto {
  id: string;
  value: string;
  unit: string | null;
  label: string;
  sortOrder: number;
  isPublished: boolean;
}

export function toAdminTrustStat(item: {
  id: string;
  value: string;
  unit: string | null;
  label: string;
  sortOrder: number;
  isPublished: boolean;
}): AdminTrustStatDto {
  return {
    id: item.id,
    value: item.value,
    unit: item.unit,
    label: item.label,
    sortOrder: item.sortOrder,
    isPublished: item.isPublished,
  };
}
