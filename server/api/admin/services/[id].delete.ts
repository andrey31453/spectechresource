import { requireAdmin } from "../../../utils/admin-guard";
import { requirePathParam, throwConflict, throwNotFound } from "../../../utils/admin-request";
import { invalidateRedirectCache } from "../../../utils/redirects";

/**
 * Удаление услуги. Если к ней привязаны вопросы FAQ — отказываем: каскад в схеме
 * унёс бы тексты, а их сначала переносят или удаляют осознанно.
 * Редиректы на удалённый адрес убираем, чтобы старые ссылки получали 404, а не 301 в пустоту.
 */
export default defineEventHandler(async (event) => {
  requireAdmin(event);
  const id = requirePathParam(event);
  const prisma = usePrisma();

  const existing = await prisma.service.findUnique({
    where: { id },
    select: { slug: true, _count: { select: { faq: true } } },
  });
  if (!existing) throwNotFound("Услуга не найдена");

  if ((existing._count?.faq ?? 0) > 0) {
    throwConflict(`К услуге привязано вопросов FAQ: ${existing._count.faq}. Сначала удалите их`);
  }

  await prisma.$transaction([
    prisma.redirect.deleteMany({ where: { to: `/uslugi/${existing.slug}` } }),
    prisma.service.delete({ where: { id } }),
  ]);

  invalidateRedirectCache();

  return { ok: true };
});
