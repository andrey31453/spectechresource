/** Настройки сайта + город (шапка, подвал, контакты). */
export default defineEventHandler(async () => {
  const prisma = usePrisma();

  const settings = await prisma.siteSettings.findUnique({
    where: { id: "main" },
    include: { city: true },
  });

  if (!settings) {
    throw createError({
      statusCode: 500,
      message: "Настройки сайта не заполнены — выполните npm run db:seed",
    });
  }

  return toSite(settings);
});
