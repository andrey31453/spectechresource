/** Главная: разделы каталога, модели с ценой, услуги, блоки доверия, шаги работы, общий FAQ. */
export default defineEventHandler(async () => {
  const prisma = usePrisma();

  const [categories, models, services, advantages, steps, stats, faq] = await Promise.all([
    prisma.category.findMany({
      where: { isPublished: true },
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
      include: {
        types: {
          where: { isPublished: true },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        },
      },
    }),
    prisma.equipmentModel.findMany({
      where: {
        isAvailable: true,
        type: { isPublished: true, category: { isPublished: true } },
      },
      orderBy: [
        { type: { category: { sortOrder: "asc" } } },
        { type: { sortOrder: "asc" } },
        { sortOrder: "asc" },
        { brand: "asc" },
      ],
      select: {
        id: true,
        slug: true,
        brand: true,
        model: true,
        shortDesc: true,
        pricePerShift: true,
        pricePerHour: true,
        photos: true,
        specs: {
          orderBy: { sortOrder: "asc" },
          select: { name: true, value: true },
        },
        type: {
          select: {
            slug: true,
            name: true,
            category: { select: { slug: true } },
          },
        },
      },
    }),
    prisma.service.findMany({
      where: { isPublished: true },
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
      select: { slug: true, title: true, description: true, image: true },
    }),
    prisma.advantage.findMany({ where: { isPublished: true }, orderBy: { sortOrder: "asc" } }),
    prisma.workStep.findMany({ where: { isPublished: true }, orderBy: { sortOrder: "asc" } }),
    prisma.trustStat.findMany({ where: { isPublished: true }, orderBy: { sortOrder: "asc" } }),
    prisma.faqItem.findMany({
      where: { isPublished: true, scope: "GLOBAL" },
      orderBy: { sortOrder: "asc" },
      select: { question: true, answer: true },
    }),
  ]);

  return {
    categories: categories.map((category) => ({
      slug: category.slug,
      title: category.title,
      shortDesc: category.shortDesc,
      image: category.image,
      types: category.types.map(toTypeCard),
    })),
    models: models.map(toHomeModel),
    services,
    advantages: advantages.map((item) => ({ title: item.title, text: item.text, icon: item.icon })),
    steps: steps.map((item) => ({ title: item.title, text: item.text })),
    stats: stats.map((item) => ({ value: item.value, unit: item.unit, label: item.label })),
    faq: toFaq(faq),
  };
});
