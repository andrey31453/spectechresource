/** Один раздел каталога: описание, SEO-поля и список видов. */
export default defineEventHandler(async (event) => {
  const slug = String(getRouterParam(event, "category") ?? "");
  if (!slug) {
    throw createError({ statusCode: 404, message: "Раздел не найден" });
  }

  const prisma = usePrisma();

  const category = await prisma.category.findFirst({
    where: { slug, isPublished: true },
    include: {
      types: {
        where: { isPublished: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      },
    },
  });

  if (!category) {
    throw createError({ statusCode: 404, message: "Раздел не найден" });
  }

  return {
    slug: category.slug,
    title: category.title,
    h1: category.h1,
    shortDesc: category.shortDesc,
    image: category.image,
    seoTitle: category.seoTitle,
    seoDescription: category.seoDescription,
    seoTextHtml: category.seoText ? renderMarkdown(category.seoText) : null,
    types: category.types.map(toTypeCard),
  };
});
