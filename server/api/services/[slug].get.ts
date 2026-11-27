/** Услуга: описание, SEO-текст (markdown → HTML) и её FAQ. */
export default defineEventHandler(async (event) => {
  const slug = String(getRouterParam(event, "slug") ?? "");
  if (!slug) {
    throw createError({ statusCode: 404, message: "Услуга не найдена" });
  }

  const prisma = usePrisma();

  const service = await prisma.service.findFirst({
    where: { slug, isPublished: true },
    include: {
      equipmentTypes: {
        where: { isPublished: true, category: { isPublished: true } },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }, { id: "asc" }],
        include: {
          category: { select: { slug: true } },
          models: {
            where: { isPublished: true },
            orderBy: [{ sortOrder: "asc" }, { brand: "asc" }, { model: "asc" }, { id: "asc" }],
            include: { specs: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] } },
          },
        },
      },
      faq: {
        where: { isPublished: true },
        orderBy: { sortOrder: "asc" },
        select: { question: true, answer: true },
      },
    },
  });

  if (!service) {
    throw createError({ statusCode: 404, message: "Услуга не найдена" });
  }

  return {
    slug: service.slug,
    title: service.title,
    description: service.description,
    image: service.image,
    seoTitle: service.seoTitle,
    seoDescription: service.seoDescription,
    descriptionTopHtml: service.descriptionTop ? renderMarkdown(service.descriptionTop) : null,
    descriptionBottomHtml: service.descriptionBottom ? renderMarkdown(service.descriptionBottom) : null,
    contentHtml: !service.descriptionTop && !service.descriptionBottom && service.seoText ? renderMarkdown(service.seoText) : null,
    equipment: {
      types: service.equipmentTypes.map((type) => ({ slug: type.slug, name: type.name })),
      models: service.equipmentTypes.flatMap((type) => type.models.map((model) => toHomeModel({ ...model, type }))),
    },
    faq: toFaq(service.faq),
  };
});
