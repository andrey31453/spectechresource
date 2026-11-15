/** Главная: разделы каталога, услуги, блоки доверия, шаги работы, общий FAQ. */
export default defineEventHandler(async () => {
  const prisma = usePrisma();

  const [categories, services, advantages, steps, stats, faq] = await Promise.all([
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
    prisma.service.findMany({
      where: { isPublished: true },
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
      select: { slug: true, title: true, description: true },
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
      types: category.types.map(toTypeCard),
    })),
    services,
    advantages: advantages.map((item) => ({ title: item.title, text: item.text, icon: item.icon })),
    steps: steps.map((item) => ({ title: item.title, text: item.text })),
    stats: stats.map((item) => ({ value: item.value, unit: item.unit, label: item.label })),
    faq: toFaq(faq),
  };
});
