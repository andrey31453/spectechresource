import { requireAdmin } from "../../../../utils/admin-guard";
import { requirePathParam, throwConflict, throwNotFound } from "../../../../utils/admin-request";

/**
 * Удаление раздела. Если внутри есть виды техники — 409: каскадно удалять
 * посадочные страницы вместе с моделями и текстами слишком дорого для случайного клика.
 */
export default defineEventHandler(async (event) => {
  requireAdmin(event);
  const id = requirePathParam(event);
  const prisma = usePrisma();

  const existing = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { types: true } } },
  });

  if (!existing) throwNotFound("Раздел не найден");

  if (existing._count.types > 0) {
    throwConflict(
      `В разделе видов техники: ${existing._count.types}. Сначала перенесите их в другой раздел или удалите.`,
    );
  }

  await prisma.category.delete({ where: { id } });

  return { ok: true };
});
