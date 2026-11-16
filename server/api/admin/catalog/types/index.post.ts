import { TypeCreateSchema } from "#shared/schemas/catalog";
import { requireAdmin } from "../../../../utils/admin-guard";
import { readValidBody, throwConflict, throwNotFound } from "../../../../utils/admin-request";
import { toAdminTypeListItem } from "../../../../utils/catalog-admin";
import { isUniqueViolation } from "../../../../utils/leads";

/** Новый вид техники = новая посадочная страница `/arenda-{slug}-v-{город}`. */
export default defineEventHandler(async (event) => {
  requireAdmin(event);
  const input = await readValidBody(event, TypeCreateSchema);
  const prisma = usePrisma();

  const category = await prisma.category.findUnique({
    where: { id: input.categoryId },
    select: { id: true },
  });

  if (!category) throwNotFound("Раздел не найден");

  try {
    const type = await prisma.equipmentType.create({
      data: {
        categoryId: input.categoryId,
        slug: input.slug,
        name: input.name,
        nameGenitive: input.nameGenitive,
        priceFrom: input.priceFrom ?? null,
        priceUnit: input.priceUnit ?? "SHIFT",
        minOrder: input.minOrder ?? null,
        deliveryTerms: input.deliveryTerms ?? null,
        deliveryPrice: input.deliveryPrice ?? null,
        crewAvailable: input.crewAvailable ?? true,
        withoutCrewAvailable: input.withoutCrewAvailable ?? false,
        worksPerformed: input.worksPerformed ?? null,
        gallery: input.gallery ?? [],
        seoTitle: input.seoTitle ?? null,
        seoDescription: input.seoDescription ?? null,
        seoText: input.seoText ?? null,
        sortOrder: input.sortOrder ?? 10,
        isPublished: input.isPublished ?? true,
      },
      include: { _count: { select: { models: true } } },
    });

    setResponseStatus(event, 201);
    return { type: toAdminTypeListItem(type) };
  } catch (error) {
    if (isUniqueViolation(error)) throwConflict("Вид техники с таким кодом уже есть");
    throw error;
  }
});
