import { requireAdmin } from "../../../../../utils/admin-guard";
import { requirePathParam, throwNotFound } from "../../../../../utils/admin-request";
import { toAdminType } from "../../../../../utils/catalog-admin";

/** Карточка вида для редактора: все поля, модели с характеристиками и «похожая техника». */
export default defineEventHandler(async (event) => {
  requireAdmin(event);
  const id = requirePathParam(event);

  const type = await usePrisma().equipmentType.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, slug: true, title: true } },
      models: {
        orderBy: [{ sortOrder: "asc" }, { brand: "asc" }],
        include: { specs: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }] } },
      },
      relatedFrom: {
        orderBy: [{ sortOrder: "asc" }],
        include: { target: { select: { id: true, slug: true, name: true } } },
      },
    },
  });

  if (!type) throwNotFound("Вид техники не найден");

  return { type: toAdminType(type) };
});
