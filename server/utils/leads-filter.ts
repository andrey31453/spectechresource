import type { LeadPlace } from "#shared/schemas/leads";
import { leadCreatedAtRange, leadSearchTerms, type LeadFiltersInput, type LeadStatusName } from "#shared/schemas/leads-filters";

/**
 * Фильтры журнала → условие Prisma. Структура описана своими типами,
 * чтобы модуль тестировался без Prisma-клиента; хэндлер приводит её к `Prisma.LeadWhereInput`.
 */

export type LeadSearchCondition =
  | { name: { contains: string; mode: "insensitive" } }
  | { email: { contains: string; mode: "insensitive" } }
  | { phone: string }
  | { phone: { contains: string } };

export interface LeadWhere {
  status?: LeadStatusName;
  place?: LeadPlace;
  createdAt?: { gte?: Date; lte?: Date };
  OR?: LeadSearchCondition[];
}

export function toLeadWhere(filters: LeadFiltersInput): LeadWhere {
  const where: LeadWhere = {};

  if (filters.status !== "all") where.status = filters.status;
  if (filters.place) where.place = filters.place;

  const createdAt = leadCreatedAtRange(filters);
  if (createdAt) where.createdAt = createdAt;

  const search = leadSearchTerms(filters.q);

  if (search.text) {
    const conditions: LeadSearchCondition[] = [
      { name: { contains: search.text, mode: "insensitive" } },
      { email: { contains: search.text, mode: "insensitive" } },
    ];

    // Телефон в БД канонический: и точное совпадение, и поиск по цифрам внутри номера.
    if (search.phone) conditions.push({ phone: search.phone });
    if (search.digits) conditions.push({ phone: { contains: search.digits } });

    where.OR = conditions;
  }

  return where;
}

export interface LeadPagination {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

/** Страница за пределами выборки даёт пустой список, а не ошибку: UI просто покажет «нет заявок». */
export function leadPagination(filters: LeadFiltersInput): LeadPagination {
  const { page, pageSize } = filters;

  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}
