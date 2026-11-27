/** Полный парк моделей для каталога; группы главной не являются фильтрами. */
export default defineEventHandler(async (event) => {
  const categorySlug = String(getQuery(event).categorySlug ?? "");
  const types = await usePrisma().equipmentType.findMany({
    where: { isPublished: true, category: { isPublished: true, ...(categorySlug ? { slug: categorySlug } : {}) } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }, { id: "asc" }],
    include: {
      category: { select: { slug: true } },
      models: {
        where: { isPublished: true },
        orderBy: [{ sortOrder: "asc" }, { brand: "asc" }, { model: "asc" }, { id: "asc" }],
        include: { specs: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] } },
      },
    },
  });

  return {
    types: types.map((type) => ({
      slug: type.slug,
      name: type.name,
      descriptionTopHtml: type.descriptionTop ? renderMarkdown(type.descriptionTop) : null,
      descriptionBottomHtml: type.seoText ? renderMarkdown(type.seoText) : null,
    })),
    models: types.flatMap((type) => type.models.map((model) => toHomeModel({ ...model, type }))),
  };
});