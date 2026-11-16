import { requireAdmin } from "../../../utils/admin-guard";
import { requirePathParam, throwNotFound } from "../../../utils/admin-request";
import { toAdminPage } from "../../../utils/pages-admin";

/** Карточка страницы: форма редактора грузит контент и SEO-поля по прямой ссылке. */
export default defineEventHandler(async (event) => {
  requireAdmin(event);
  const id = requirePathParam(event);

  const page = await usePrisma().page.findUnique({ where: { id } });
  if (!page) throwNotFound("Страница не найдена");

  return { page: toAdminPage(page) };
});
