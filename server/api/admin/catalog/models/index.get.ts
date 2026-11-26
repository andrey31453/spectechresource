import { requireAdmin } from "../../../../utils/admin-guard";
import { toAdminModel } from "../../../../utils/catalog-admin";

/** Все модели для редакторской очереди, включая товары без вида техники. */
export default defineEventHandler(async (event) => {
  requireAdmin(event);
  const status = String(getQuery(event).status ?? "all");
  const where = status === "published" ? { isPublished: true } : status === "unpublished" ? { isPublished: false } : {};
  const models = await usePrisma().equipmentModel.findMany({
    where,
    orderBy: [{ isPublished: "asc" }, { brand: "asc" }, { model: "asc" }],
    include: {
      type: { include: { category: { select: { id: true, title: true } } } },
      specs: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }] },
    },
  });
  return { models: models.map(toAdminModel) };
});