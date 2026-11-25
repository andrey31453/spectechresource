import { ModelCreateSchema } from "#shared/schemas/catalog";
import { requireAdmin } from "../../../../../utils/admin-guard";
import { readValidBody, requirePathParam, throwConflict, throwNotFound } from "../../../../../utils/admin-request";
import { toAdminModel } from "../../../../../utils/catalog-admin";
import { isUniqueViolation } from "../../../../../utils/leads";

/** Новая модель в таблице вида: `(typeId, brand, model)` уникально. */
export default defineEventHandler(async (event) => {
  requireAdmin(event);
  const typeId = requirePathParam(event);
  const input = await readValidBody(event, ModelCreateSchema);
  const prisma = usePrisma();

  const type = await prisma.equipmentType.findUnique({ where: { id: typeId }, select: { id: true } });
  if (!type) throwNotFound("Вид техники не найден");

  try {
    const model = await prisma.equipmentModel.create({
      data: {
        typeId,
        brand: input.brand,
        model: input.model,
        shortDesc: input.shortDesc ?? null,
        pricePerShift: input.pricePerShift ?? null,
        pricePerHour: input.pricePerHour ?? null,
        photos: input.photos ?? [],
        isAvailable: input.isAvailable ?? true,
        sortOrder: input.sortOrder ?? 10,
        specs: {
          create: (input.specs ?? []).map((spec, index) => ({
            name: spec.name,
            value: spec.value,
            sortOrder: (index + 1) * 10,
          })),
        },
      },
      include: { specs: { orderBy: [{ sortOrder: "asc" }] } },
    });

    setResponseStatus(event, 201);
    return { model: toAdminModel(model) };
  } catch (error) {
    if (isUniqueViolation(error)) throwConflict("Такая модель у этого вида уже есть");
    throw error;
  }
});
