import { CityUpdateSchema } from "#shared/schemas/admin-settings";
import { requireAdmin } from "../../../utils/admin-guard";
import { readValidBody, requirePathParam, throwConflict, throwNotFound } from "../../../utils/admin-request";
import { isUniqueViolation } from "../../../utils/leads";
import { toAdminCity } from "../../../utils/settings-admin";

/**
 * Правка города. Приходят только изменённые поля (`partial`-схема),
 * поэтому остальные значения Prisma не трогает.
 */
export default defineEventHandler(async (event) => {
  requireAdmin(event);
  const id = requirePathParam(event);
  const input = await readValidBody(event, CityUpdateSchema);
  const prisma = usePrisma();

  const existing = await prisma.city.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throwNotFound("Город не найден");

  // Лендинги и sitemap берут первый активный город — без него сайт останется без города.
  if (input.isActive === false) {
    const otherActive = await prisma.city.count({ where: { isActive: true, id: { not: id } } });

    if (otherActive === 0) {
      throwConflict("Нельзя деактивировать единственный активный город");
    }
  }

  try {
    const city = await prisma.$transaction(async (tx) => {
      if (input.isDefault) {
        await tx.city.updateMany({
          where: { isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      }

      return tx.city.update({ where: { id }, data: input });
    });

    return { city: toAdminCity(city) };
  } catch (error) {
    if (isUniqueViolation(error)) throwConflict("Город с таким кодом уже есть");
    throw error;
  }
});
