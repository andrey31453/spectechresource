/** Карта сайта: статические страницы + разделы + посадочные + услуги + страницы. */
export default defineEventHandler(async (event) => {
  const prisma = usePrisma();
  const {
    public: { siteUrl },
  } = useRuntimeConfig();
  const base = String(siteUrl).replace(/\/+$/, "");

  const [city, categories, types, services, pages] = await Promise.all([
    prisma.city.findFirst({
      where: { isActive: true },
      orderBy: [{ isDefault: "desc" }, { sortOrder: "asc" }],
      select: { slug: true },
    }),
    prisma.category.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.equipmentType.findMany({
      where: { isPublished: true },
      orderBy: { sortOrder: "asc" },
      select: { slug: true, updatedAt: true },
    }),
    prisma.service.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.page.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const day = (date: Date) => date.toISOString().slice(0, 10);

  const entries: Array<{ path: string; lastmod?: string; priority: string }> = [
    { path: "/", priority: "1.0" },
    { path: "/katalog", priority: "0.9" },
    { path: "/uslugi", priority: "0.7" },
    { path: "/kontakty", priority: "0.6" },
    ...categories.map((item) => ({
      path: `/katalog/${item.slug}`,
      lastmod: day(item.updatedAt),
      priority: "0.8",
    })),
    ...(city
      ? types.map((item) => ({
          path: `/arenda-${item.slug}-v-${city.slug}`,
          lastmod: day(item.updatedAt),
          priority: "0.9",
        }))
      : []),
    ...services.map((item) => ({
      path: `/uslugi/${item.slug}`,
      lastmod: day(item.updatedAt),
      priority: "0.6",
    })),
    ...pages.map((item) => ({
      path: `/${item.slug}`,
      lastmod: day(item.updatedAt),
      priority: "0.3",
    })),
  ];

  const urls = entries
    .map((entry) => {
      const lastmod = entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : "";
      return `  <url><loc>${base}${entry.path}</loc>${lastmod}<priority>${entry.priority}</priority></url>`;
    })
    .join("\n");

  setHeader(event, "Content-Type", "application/xml; charset=utf-8");
  setHeader(event, "Cache-Control", "public, max-age=3600");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
});
