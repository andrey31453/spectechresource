import type { Prisma } from "../../../../generated/prisma/client";
import * as v from "valibot";
import { LeadFiltersSchema, LEADS_EXPORT_LIMIT } from "#shared/schemas/leads-filters";
import { csvFileName } from "#shared/utils/csv";
import { requireAdmin } from "../../../utils/admin-guard";
import { throwValidationError } from "../../../utils/admin-request";
import { leadsToCsv } from "../../../utils/leads-csv";
import { toLeadWhere } from "../../../utils/leads-filter";

/**
 * Выгрузка журнала в CSV (`/api/admin/leads/export.csv`).
 *
 * Уважает те же фильтры, что список, но без пагинации — до `LEADS_EXPORT_LIMIT` строк.
 * Файл открывается в русском Excel: BOM, `;`, CRLF, даты по Москве.
 */
export default defineEventHandler(async (event) => {
  requireAdmin(event);

  const parsed = v.safeParse(LeadFiltersSchema, getQuery(event));

  if (!parsed.success) {
    throwValidationError(parsed.issues, "Проверьте фильтры");
  }

  const where = toLeadWhere(parsed.output) as Prisma.LeadWhereInput;

  const leads = await usePrisma().lead.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: LEADS_EXPORT_LIMIT,
    include: { equipmentType: { select: { name: true } } },
  });

  setResponseHeader(event, "content-type", "text/csv; charset=utf-8");
  setResponseHeader(event, "content-disposition", `attachment; filename="${csvFileName("leads")}"`);
  setResponseHeader(event, "cache-control", "no-store");

  return leadsToCsv(leads);
});
