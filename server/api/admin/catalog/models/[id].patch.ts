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
        include: { specs: { orderBy: [{ sortOrder: "asc" }] } },
      });
    });

    return { model: toAdminModel(model) };
  } catch (error) {
    if (isUniqueViolation(error)) throwConflict("Модель с таким кодом или названием у этого вида уже есть");
    throw error;
  }
});
