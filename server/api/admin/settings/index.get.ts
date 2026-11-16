import { requireAdmin } from "../../../utils/admin-guard";
import { SETTINGS_ID, toAdminCity, toAdminSettings } from "../../../utils/settings-admin";

/** Настройки сайта и все города, включая неактивные: админке нужен полный список. */
export default defineEventHandler(async (event) => {
  requireAdmin(event);
  const prisma = usePrisma();

  const [settings, cities] = await Promise.all([
    prisma.siteSettings.findUnique({ where: { id: SETTINGS_ID } }),
    prisma.city.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
  ]);

  if (!settings) {
    throw createError({
      statusCode: 500,
      message: "Настройки сайта не заполнены — выполните npm run db:seed",
    });
  }

  return { settings: toAdminSettings(settings), cities: cities.map(toAdminCity) };
});
