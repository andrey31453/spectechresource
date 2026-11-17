import { requireAdmin } from "../../../utils/admin-guard";
import { toAdminAdvantage, toAdminFaq, toAdminTrustStat, toAdminWorkStep } from "../../../utils/content-admin";

/**
 * Контентные блоки одним запросом: экран один, вкладки переключаются без сети.
 * Справочники услуг и видов техники нужны форме FAQ для выбора привязки.
 */
export default defineEventHandler(async (event) => {
  requireAdmin(event);
  const prisma = usePrisma();

  const [faq, advantages, steps, stats, services, types] = await Promise.all([
    prisma.faqItem.findMany({
      orderBy: [{ scope: "asc" }, { sortOrder: "asc" }, { question: "asc" }],
      include: {
        equipmentType: { select: { name: true } },
        service: { select: { title: true } },
      },
    }),
    prisma.advantage.findMany({ orderBy: [{ sortOrder: "asc" }, { title: "asc" }] }),
    prisma.workStep.findMany({ orderBy: [{ sortOrder: "asc" }, { title: "asc" }] }),
    prisma.trustStat.findMany({ orderBy: [{ sortOrder: "asc" }, { label: "asc" }] }),
    prisma.service.findMany({
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
      select: { id: true, title: true, slug: true },
    }),
    prisma.equipmentType.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, category: { select: { title: true } } },
    }),
  ]);

  return {
    faq: faq.map(toAdminFaq),
    advantages: advantages.map(toAdminAdvantage),
    steps: steps.map(toAdminWorkStep),
    stats: stats.map(toAdminTrustStat),
    services,
    types: types.map((type) => ({ id: type.id, name: type.name, categoryTitle: type.category.title })),
  };
});
