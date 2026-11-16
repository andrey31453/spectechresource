import { RelatedUpdateSchema } from "#shared/schemas/catalog";
import { requireAdmin } from "../../../../../utils/admin-guard";
import { readValidBody, requirePathParam, throwFieldError, throwNotFound } from "../../../../../utils/admin-request";

/**
 * «Похожая техника»: полный список id в нужном порядке — так форме проще
 * (перестановка стрелками), а сервер перезаписывает связи одной транзакцией.
 */
export default defineEventHandler(async (event) => {
  requireAdmin(event);
  const id = requirePathParam(event);
  const { relatedIds } = await readValidBody(event, RelatedUpdateSchema);
  const prisma = usePrisma();

  if (relatedIds.includes(id)) {
    throwFieldError("relatedIds", "Вид не может ссылаться сам на себя");
  }

  const type = await prisma.equipmentType.findUnique({ where: { id }, select: { id: true } });
  if (!type) throwNotFound("Вид техники не найден");

  if (relatedIds.length > 0) {
    const found = await prisma.equipmentType.findMany({
      where: { id: { in: relatedIds } },
      select: { id: true },
    });

    if (found.length !== relatedIds.length) {
      const known = new Set(found.map((row) => row.id));
      const missing = relatedIds.filter((relatedId) => !known.has(relatedId));
      throwNotFound(`Виды не найдены: ${missing.join(", ")}`);
    }
  }

  await prisma.$transaction([
    prisma.relatedType.deleteMany({ where: { sourceId: id } }),
    prisma.relatedType.createMany({
      data: relatedIds.map((targetId, index) => ({
        sourceId: id,
        targetId,
        sortOrder: (index + 1) * 10,
      })),
    }),
  ]);

  return { relatedIds };
});
