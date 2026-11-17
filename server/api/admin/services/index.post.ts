import { ServiceCreateSchema } from "#shared/schemas/admin-services";
import { requireAdmin } from "../../../utils/admin-guard";
import { readValidBody, throwConflict } from "../../../utils/admin-request";
import { isUniqueViolation } from "../../../utils/leads";
import { toAdminService } from "../../../utils/services-admin";

/** Новая услуга: код `/uslugi/{slug}` должен быть свободен. */
export default defineEventHandler(async (event) => {
  requireAdmin(event);
  const input = await readValidBody(event, ServiceCreateSchema);

  try {
    const service = await usePrisma().service.create({
      data: {
        slug: input.slug,
        title: input.title,
        description: input.description ?? null,
        image: input.image ?? null,
        seoTitle: input.seoTitle ?? null,
        seoDescription: input.seoDescription ?? null,
        seoText: input.seoText ?? null,
        sortOrder: input.sortOrder,
        isPublished: input.isPublished,
      },
    });

    setResponseStatus(event, 201);
    return { service: toAdminService(service) };
  } catch (error) {
    if (isUniqueViolation(error)) throwConflict("Услуга с таким кодом уже есть");
    throw error;
  }
});
