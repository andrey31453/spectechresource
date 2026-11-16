import { requireAdmin } from "../../../../../utils/admin-guard";
import { requirePathParam, throwNotFound } from "../../../../../utils/admin-request";

/**
 * Удаление вида техники: модели, характеристики, FAQ и связи «похожая техника»
 * уходят каскадом, заявки остаются — у них только обнуляется ссылка (`SetNull`).
 * В ответе — сколько строк затронуто, чтобы админка показала последствия.
 */
export default defineEventHandler(async (event) => {
  requireAdmin(event);
  const id = requirePathParam(event);
  const prisma = usePrisma();

  const existing = await prisma.equipmentType.findUnique({
    where: { id },
    include: { _count: { select: { models: true, leads: true } } },
  });

  if (!existing) throwNotFound("Вид техники не найден");

  await prisma.equipmentType.delete({ where: { id } });

  return { ok: true, deletedModels: existing._count.models, detachedLeads: existing._count.leads };
});
