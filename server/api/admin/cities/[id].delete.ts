import { requireAdmin } from "../../../utils/admin-guard";
import { requirePathParam, throwConflict, throwNotFound } from "../../../utils/admin-request";

/**
 * Удаление города. Запрещено, если город указан в настройках сайта и если он последний:
 * `SiteSettings.cityId` заполнен всегда, а без города не строятся ссылки лендингов.
 */
export default defineEventHandler(async (event) => {
  requireAdmin(event);
  const id = requirePathParam(event);
  const prisma = usePrisma();

  const existing = await prisma.city.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throwNotFound("Город не найден");

  const [total, usedBySettings] = await Promise.all([
    prisma.city.count(),
    prisma.siteSettings.count({ where: { cityId: id } }),
  ]);

  if (total <= 1) {
    throwConflict("Нельзя удалить единственный город");
  }

  if (usedBySettings > 0) {
    throwConflict("Город указан в настройках сайта — сначала выберите другой город");
  }

  await prisma.city.delete({ where: { id } });

  return { ok: true };
});
