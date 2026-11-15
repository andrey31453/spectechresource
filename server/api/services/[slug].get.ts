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
    contentHtml: service.seoText ? renderMarkdown(service.seoText) : null,
    faq: toFaq(service.faq),
  };
});
