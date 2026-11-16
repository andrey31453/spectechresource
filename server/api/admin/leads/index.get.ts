import type { Prisma } from "../../../../generated/prisma/client";
import * as v from "valibot";
import { LeadFiltersSchema } from "#shared/schemas/leads-filters";
import { requireAdmin } from "../../../utils/admin-guard";
import { throwValidationError } from "../../../utils/admin-request";
import { leadStatusCounts, toAdminLeadListItem } from "../../../utils/lead-admin";
import { leadPagination, toLeadWhere } from "../../../utils/leads-filter";

/**
 * Журнал заявок: фильтры (статус, место формы, даты, поиск), пагинация и счётчики для вкладок.
 *
 * Счётчики считаются без фильтра по статусу: выбрав «Ошибка», администратор всё равно
 * должен видеть, сколько всего новых и отправленных.
 */
export default defineEventHandler(async (event) => {
  requireAdmin(event);

  const parsed = v.safeParse(LeadFiltersSchema, getQuery(event));

  if (!parsed.success) {
    throwValidationError(parsed.issues, "Проверьте фильтры");
  }

  const filters = parsed.output;
  const where = toLeadWhere(filters) as Prisma.LeadWhereInput;
  const countsWhere = toLeadWhere({ ...filters, status: "all" }) as Prisma.LeadWhereInput;
  const { page, pageSize, skip, take } = leadPagination(filters);
  const prisma = usePrisma();

  const [total, leads, groups] = await Promise.all([
    prisma.lead.count({ where }),
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: { equipmentType: { select: { name: true } } },
    }),
    prisma.lead.groupBy({ by: ["status"], where: countsWhere, _count: { _all: true } }),
  ]);

  return {
    leads: leads.map(toAdminLeadListItem),
    total,
    page,
    pageSize,
    pages: Math.max(1, Math.ceil(total / pageSize)),
    counts: leadStatusCounts(groups),
  };
});
