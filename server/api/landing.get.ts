/**
 * Посадочная вида техники: /arenda-{typeSlug}.
 * Город по умолчанию используется в контенте, но не в адресе.
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const typeSlug = String(query.typeSlug ?? "");

  if (!typeSlug) {
    throw createError({ statusCode: 404, message: "Вид техники не найден" });
  }

  const prisma = usePrisma();

  const [type, city] = await Promise.all([
    prisma.equipmentType.findFirst({
      where: { slug: typeSlug, isPublished: true, category: { isPublished: true } },
      include: {
        category: true,
        models: {
          where: { isAvailable: true },
          orderBy: [{ sortOrder: "asc" }, { brand: "asc" }],
          include: { specs: { orderBy: { sortOrder: "asc" } } },
        },
        relatedFrom: {
          where: { target: { isPublished: true } },
          orderBy: { sortOrder: "asc" },
          include: { target: true },
        },
      },
    }),
    prisma.city.findFirst({
      where: { isActive: true },
      orderBy: [{ isDefault: "desc" }, { sortOrder: "asc" }],
    }),
  ]);

  if (!type) {
    throw createError({ statusCode: 404, message: "Вид техники не найден" });
  }
  if (!city) {
    throw createError({ statusCode: 500, message: "Не настроен город работы" });
  }

  let faq = await prisma.faqItem.findMany({
    where: { isPublished: true, scope: "TYPE", equipmentTypeId: type.id },
    orderBy: { sortOrder: "asc" },
    select: { question: true, answer: true },
  });

  if (!faq.length) {
    faq = await prisma.faqItem.findMany({
      where: { isPublished: true, scope: "GLOBAL" },
      orderBy: { sortOrder: "asc" },
      select: { question: true, answer: true },
    });
  }

  return {
    canonicalPath: `/arenda-${type.slug}`,
    city: toCity(city),
    category: {
      slug: type.category.slug,
      title: type.category.title,
    },
    type: {
      slug: type.slug,
      name: type.name,
      nameGenitive: type.nameGenitive,
      priceFrom: money(type.priceFrom),
      priceUnit: type.priceUnit,
      minOrder: type.minOrder,
      deliveryTerms: type.deliveryTerms,
      deliveryPrice: money(type.deliveryPrice),
      crewAvailable: type.crewAvailable,
      withoutCrewAvailable: type.withoutCrewAvailable,
      worksPerformedHtml: type.worksPerformed ? renderMarkdown(type.worksPerformed) : null,
      gallery: type.gallery,
      seoTitle: type.seoTitle,
      seoDescription: type.seoDescription,
      seoTextHtml: type.seoText ? renderMarkdown(type.seoText) : null,
    },
    models: type.models.map((model) => ({
      slug: model.slug,
      id: model.id,
      brand: model.brand,
      model: model.model,
      shortDesc: model.shortDesc,
      pricePerShift: money(model.pricePerShift),
      pricePerHour: money(model.pricePerHour),
      photos: model.photos,
      specs: model.specs.map((spec) => ({ name: spec.name, value: spec.value })),
    })),
    faq: toFaq(faq),
    related: type.relatedFrom.map((link) => toTypeCard(link.target)),
  };
});
