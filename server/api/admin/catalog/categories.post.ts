import { CategoryCreateSchema } from "#shared/schemas/catalog";
import { requireAdmin } from "../../../utils/admin-guard";
import { readValidBody, throwConflict } from "../../../utils/admin-request";
import { toAdminCategory } from "../../../utils/catalog-admin";
import { isUniqueViolation } from "../../../utils/leads";

/** Новый раздел каталога: код в адресе (`/katalog/{slug}`) должен быть свободен. */
export default defineEventHandler(async (event) => {
  requireAdmin(event);
  const input = await readValidBody(event, CategoryCreateSchema);

  try {
    const category = await usePrisma().category.create({
      data: {
        slug: input.slug,
        title: input.title,
        h1: input.h1 ?? null,
        shortDesc: input.shortDesc ?? null,
        image: input.image ?? null,
        seoTitle: input.seoTitle ?? null,
        seoDescription: input.seoDescription ?? null,
        seoText: input.seoText ?? null,
        sortOrder: input.sortOrder ?? 10,
        isPublished: input.isPublished ?? true,
      },
      include: { _count: { select: { types: true } } },
    });

    setResponseStatus(event, 201);
    return { category: toAdminCategory(category) };
  } catch (error) {
    if (isUniqueViolation(error)) throwConflict("Раздел с таким кодом уже есть");
    throw error;
  }
});
