import { TypeUpdateSchema } from "#shared/schemas/catalog";
import { requireAdmin } from "../../../../../utils/admin-guard";
import { readValidBody, requirePathParam, throwConflict, throwNotFound } from "../../../../../utils/admin-request";
import { toAdminType } from "../../../../../utils/catalog-admin";
import { saveSlugRedirect, typeSlugRedirect } from "../../../../../utils/catalog-slugs";
import { isUniqueViolation } from "../../../../../utils/leads";

/** Правка вида техники; смена кода сохраняет 301 со старого адреса посадочной. */
export default defineEventHandler(async (event) => {
  requireAdmin(event);
  const id = requirePathParam(event);
  const input = await readValidBody(event, TypeUpdateSchema);
  const prisma = usePrisma();

  const existing = await prisma.equipmentType.findUnique({ where: { id }, select: { slug: true } });
  if (!existing) throwNotFound("Вид техники не найден");

  if (input.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: input.categoryId }, select: { id: true } });
    if (!category) throwNotFound("Раздел не найден");
  }

  const { categoryId, ...rest } = input;
  const data = categoryId ? { ...rest, categoryId } : rest;

  try {
    const type = await prisma.equipmentType.update({
      where: { id },
      data,
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

    if (input.slug) {
      // Город в адресе посадочной: редирект строим для города по умолчанию (ADR-6).
      const city = await prisma.city.findFirst({
        where: { isActive: true },
        orderBy: [{ isDefault: "desc" }, { sortOrder: "asc" }],
        select: { slug: true },
      });

      await saveSlugRedirect(prisma, typeSlugRedirect(existing.slug, type.slug, city?.slug ?? null));
    }

    return { type: toAdminType(type) };
  } catch (error) {
    if (isUniqueViolation(error)) throwConflict("Вид техники с таким кодом уже есть");
    throw error;
  }
});
