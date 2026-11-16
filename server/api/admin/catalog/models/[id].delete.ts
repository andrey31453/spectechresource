import { requireAdmin } from "../../../../utils/admin-guard";
import { requirePathParam, throwNotFound } from "../../../../utils/admin-request";

/** Удаление модели: характеристики уходят каскадом, заявки остаются без ссылки (`SetNull`). */
export default defineEventHandler(async (event) => {
  requireAdmin(event);
  const id = requirePathParam(event);
  const prisma = usePrisma();

  const existing = await prisma.equipmentModel.findUnique({
    where: { id },
    include: { _count: { select: { leads: true } } },
  });

  if (!existing) throwNotFound("Модель не найдена");

  await prisma.equipmentModel.delete({ where: { id } });

  return { ok: true, detachedLeads: existing._count.leads };
});
