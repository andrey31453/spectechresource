import { requireAdmin } from "../../../utils/admin-guard";
import { toAdminPageListItem } from "../../../utils/pages-admin";

/** Все страницы, включая черновики: админке нужен полный список. Свежие правки — сверху. */
export default defineEventHandler(async (event) => {
  requireAdmin(event);

  const pages = await usePrisma().page.findMany({
    orderBy: [{ updatedAt: "desc" }, { title: "asc" }],
  });

  return { pages: pages.map(toAdminPageListItem) };
});
