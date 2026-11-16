import { requireAdmin } from "../../../utils/admin-guard";
import { requirePathParam, throwNotFound } from "../../../utils/admin-request";
import { invalidateRedirectCache } from "../../../utils/redirects";

/**
 * Удаление страницы. Заодно убираем редиректы, которые вели на её адрес:
 * иначе старые ссылки получат 301 в пустоту вместо честного 404.
 */
export default defineEventHandler(async (event) => {
  requireAdmin(event);
  const id = requirePathParam(event);
  const prisma = usePrisma();

  const existing = await prisma.page.findUnique({ where: { id }, select: { slug: true } });
  if (!existing) throwNotFound("Страница не найдена");

  await prisma.$transaction([
    prisma.redirect.deleteMany({ where: { to: `/${existing.slug}` } }),
    prisma.page.delete({ where: { id } }),
  ]);

  invalidateRedirectCache();

  return { ok: true };
});
