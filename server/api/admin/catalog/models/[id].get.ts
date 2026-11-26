import { requireAdmin } from "../../../../utils/admin-guard";
import { requirePathParam, throwNotFound } from "../../../../utils/admin-request";
import { toAdminModel } from "../../../../utils/catalog-admin";

export default defineEventHandler(async (event) => {
  requireAdmin(event);
  const model = await usePrisma().equipmentModel.findUnique({
    where: { id: requirePathParam(event) },
    include: { specs: { orderBy: { sortOrder: "asc" } }, type: { include: { category: { select: { id: true, title: true } } } } },
  });
  if (!model) throwNotFound("Модель не найдена");
  return { model: toAdminModel(model), type: model.type };
});