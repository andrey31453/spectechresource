import { PageUpdateSchema } from "#shared/schemas/admin-pages";
import { requireAdmin } from "../../../utils/admin-guard";
import { readValidBody, requirePathParam, throwConflict, throwNotFound } from "../../../utils/admin-request";
import { savePageSlugRedirect } from "../../../utils/page-slugs";
import { toAdminPage } from "../../../utils/pages-admin";
import { isUniqueViolation } from "../../../utils/leads";

/**
 * Правка страницы: приходят только изменённые поля (`partial`-схема).
 * Смена кода оставляет старый адрес живым — 301 на новый (ADR-6).
 */
export default defineEventHandler(async (event) => {
  requireAdmin(event);
  const id = requirePathParam(event);
  const input = await readValidBody(event, PageUpdateSchema);
  const prisma = usePrisma();

  const existing = await prisma.page.findUnique({ where: { id }, select: { slug: true } });
  if (!existing) throwNotFound("Страница не найдена");

  try {
    const page = await prisma.page.update({ where: { id }, data: input });

    if (input.slug) {
      await savePageSlugRedirect(prisma, existing.slug, page.slug);
    }

    return { page: toAdminPage(page) };
  } catch (error) {
    if (isUniqueViolation(error)) throwConflict("Страница с таким кодом уже есть");
    throw error;
  }
});
