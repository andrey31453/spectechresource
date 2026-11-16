import { requireAdmin } from "../../../../utils/admin-guard";
import { toAdminTypeListItem } from "../../../../utils/catalog-admin";

/** Виды техники: все, если `categoryId` не передан, иначе — только раздел. */
export default defineEventHandler(async (event) => {
  requireAdmin(event);

  const categoryId = String(getQuery(event).categoryId ?? "").trim();

  const types = await usePrisma().equipmentType.findMany({
    where: categoryId ? { categoryId } : {},
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { models: true } } },
  });

  return { types: types.map(toAdminTypeListItem) };
});
