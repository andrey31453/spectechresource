import { requireAdmin } from "../../../utils/admin-guard";
import { toAdminService } from "../../../utils/services-admin";

/** Все услуги, включая черновики: админке нужен полный список. Порядок — как на сайте. */
export default defineEventHandler(async (event) => {
  requireAdmin(event);

  const services = await usePrisma().service.findMany({
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    include: { _count: { select: { faq: true } } },
  });

  return { services: services.map(toAdminService) };
});
