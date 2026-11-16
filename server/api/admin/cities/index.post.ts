import { CityCreateSchema } from "#shared/schemas/admin-settings";
import { requireAdmin } from "../../../utils/admin-guard";
import { readValidBody, throwConflict } from "../../../utils/admin-request";
import { isUniqueViolation } from "../../../utils/leads";
import { toAdminCity } from "../../../utils/settings-admin";

/** Новый город: код уникален, город по умолчанию на сайте всегда один. */
export default defineEventHandler(async (event) => {
  requireAdmin(event);
  const input = await readValidBody(event, CityCreateSchema);
  const prisma = usePrisma();

  try {
    const city = await prisma.$transaction(async (tx) => {
      if (input.isDefault) {
        await tx.city.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
      }

      return tx.city.create({ data: input });
    });

    setResponseStatus(event, 201);
    return { city: toAdminCity(city) };
  } catch (error) {
    if (isUniqueViolation(error)) throwConflict("Город с таким кодом уже есть");
    throw error;
  }
});
