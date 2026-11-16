import { SiteSettingsUpdateSchema } from "#shared/schemas/admin-settings";
import { requireAdmin } from "../../../utils/admin-guard";
import { readValidBody, throwFieldError } from "../../../utils/admin-request";
import { SETTINGS_ID, toAdminSettings } from "../../../utils/settings-admin";

/**
 * Сохранение настроек. Форма отправляет все поля сразу, поэтому `PATCH` фактически
 * заменяет строку; `upsert` — страховка на случай пустой БД без сида.
 */
export default defineEventHandler(async (event) => {
  requireAdmin(event);
  const input = await readValidBody(event, SiteSettingsUpdateSchema);
  const prisma = usePrisma();

  const city = await prisma.city.findUnique({ where: { id: input.cityId }, select: { id: true } });
  if (!city) {
    throwFieldError("cityId", "Город не найден — обновите список городов");
  }

  const settings = await prisma.siteSettings.upsert({
    where: { id: SETTINGS_ID },
    update: input,
    create: { id: SETTINGS_ID, ...input },
  });

  return { settings: toAdminSettings(settings) };
});
