import { ModelUpdateSchema } from "#shared/schemas/catalog";
import { requireAdmin } from "../../../../utils/admin-guard";
import { readValidBody, requirePathParam, throwConflict, throwNotFound } from "../../../../utils/admin-request";
import { toAdminModel } from "../../../../utils/catalog-admin";
import { isUniqueViolation } from "../../../../utils/leads";

/**
 * Правка модели. Характеристики приходят полным списком: если поле передано —
 * список заменяется целиком (порядок строк = порядок в форме).
 */
export default defineEventHandler(async (event) => {
  requireAdmin(event);
  const id = requirePathParam(event);
  const input = await readValidBody(event, ModelUpdateSchema);
  const prisma = usePrisma();

  const existing = await prisma.equipmentModel.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throwNotFound("Модель не найдена");

  const { specs, ...rest } = input;

  const effectiveTypeId = input.typeId !== undefined ? input.typeId : (await prisma.equipmentModel.findUnique({
    where: { id },
    select: { typeId: true },
  }))?.typeId;

  if (input.typeId) {
    const type = await prisma.equipmentType.findUnique({ where: { id: input.typeId }, select: { id: true } });
    if (!type) throwNotFound("Вид техники не найден");
  }

  if (input.isPublished && !effectiveTypeId) {
    throw createError({ statusCode: 400, message: "Сначала назначьте вид техники товару" });
  }

  if (input.typeId === null) {
    rest.isPublished = false;
  }

  if (input.isPublished) {
    const modelWithType = await prisma.equipmentModel.findUnique({
      where: { id },
      select: { typeId: true },
    });
    if (!modelWithType?.typeId) {
      throw createError({ statusCode: 400, message: "Сначала назначьте вид техники товару" });
    }
  }

  try {
    const model = await prisma.$transaction(async (tx) => {
      if (specs !== undefined) {
        await tx.equipmentSpec.deleteMany({ where: { modelId: id } });
      }

      return tx.equipmentModel.update({
        where: { id },
        data: {
          ...rest,
          ...(specs !== undefined
            ? {
                specs: {
                  create: specs.map((spec, index) => ({
                    name: spec.name,
                    value: spec.value,
                    sortOrder: (index + 1) * 10,
                  })),
                },
              }
            : {}),
        },
        include: {
          specs: { orderBy: [{ sortOrder: "asc" }] },
          type: { include: { category: { select: { id: true, title: true } } } },
        },
      });
    });

    return { model: toAdminModel(model) };
  } catch (error) {
    if (isUniqueViolation(error)) throwConflict("Модель с таким кодом или названием у этого вида уже есть");
    throw error;
  }
});
