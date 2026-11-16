import { CategoryUpdateSchema } from "#shared/schemas/catalog";
import { requireAdmin } from "../../../../utils/admin-guard";
import { readValidBody, requirePathParam, throwConflict, throwNotFound } from "../../../../utils/admin-request";
import { toAdminCategory } from "../../../../utils/catalog-admin";
import { categorySlugRedirect, saveSlugRedirect } from "../../../../utils/catalog-slugs";
import { isUniqueViolation } from "../../../../utils/leads";

/**
 * Правка раздела. Приходят только изменённые поля (`partial`-схема),
 * поэтому остальные значения Prisma не трогает.
 */
export default defineEventHandler(async (event) => {
  requireAdmin(event);
  const id = requirePathParam(event);
  const input = await readValidBody(event, CategoryUpdateSchema);
  const prisma = usePrisma();

  const existing = await prisma.category.findUnique({ where: { id }, select: { slug: true } });
  if (!existing) throwNotFound("Раздел не найден");

  try {
    const category = await prisma.category.update({
      where: { id },
      data: input,
      include: { _count: { select: { types: true } } },
    });

    // Старый адрес раздела продолжает работать: 301 на новый (ADR-6).
    if (input.slug) {
      await saveSlugRedirect(prisma, categorySlugRedirect(existing.slug, category.slug));
    }

    return { category: toAdminCategory(category) };
  } catch (error) {
    if (isUniqueViolation(error)) throwConflict("Раздел с таким кодом уже есть");
    throw error;
  }
});
