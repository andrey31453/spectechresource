import { requireAdmin } from "../../../utils/admin-guard";
import { toAdminCategory } from "../../../utils/catalog-admin";

/** Все разделы каталога, включая неопубликованные: админке нужен полный список. */
export default defineEventHandler(async (event) => {
  requireAdmin(event);

  const categories = await usePrisma().category.findMany({
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    include: { _count: { select: { types: true } } },
  });

  return { categories: categories.map(toAdminCategory) };
});
