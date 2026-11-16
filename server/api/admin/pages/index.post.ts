import { PageCreateSchema } from "#shared/schemas/admin-pages";
import { requireAdmin } from "../../../utils/admin-guard";
import { readValidBody, throwConflict } from "../../../utils/admin-request";
import { toAdminPage } from "../../../utils/pages-admin";
import { isUniqueViolation } from "../../../utils/leads";

/** Новая статическая страница: корневой адрес `/{slug}` должен быть свободен. */
export default defineEventHandler(async (event) => {
  requireAdmin(event);
  const input = await readValidBody(event, PageCreateSchema);

  try {
    const page = await usePrisma().page.create({
      data: {
        slug: input.slug,
        title: input.title,
        content: input.content,
        seoTitle: input.seoTitle ?? null,
        seoDescription: input.seoDescription ?? null,
        isPublished: input.isPublished ?? true,
      },
    });

    setResponseStatus(event, 201);
    return { page: toAdminPage(page) };
  } catch (error) {
    if (isUniqueViolation(error)) throwConflict("Страница с таким кодом уже есть");
    throw error;
  }
});
