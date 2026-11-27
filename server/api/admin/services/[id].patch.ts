import { ServiceUpdateSchema } from "#shared/schemas/admin-services";
import { requireAdmin } from "../../../utils/admin-guard";
import { readValidBody, requirePathParam, throwConflict, throwNotFound } from "../../../utils/admin-request";
import { saveSlugRedirect, serviceSlugRedirect } from "../../../utils/catalog-slugs";
import { isUniqueViolation } from "../../../utils/leads";
import { toAdminService } from "../../../utils/services-admin";
import { serviceEquipmentRelation, validateServiceEquipment } from "../../../utils/service-equipment";

/**
 * Правка услуги: приходят только изменённые поля (`partial`-схема).
 * Смена кода оставляет старый адрес живым — 301 на новый (ADR-6).
 */
export default defineEventHandler(async (event) => {
  requireAdmin(event);
  const id = requirePathParam(event);
  const input = await readValidBody(event, ServiceUpdateSchema);
  const prisma = usePrisma();

  const existing = await prisma.service.findUnique({
    where: { id },
    select: { slug: true },
  });
  if (!existing) throwNotFound("Услуга не найдена");
  const { equipmentTypeIds, ...fields } = input;
  await validateServiceEquipment(prisma, equipmentTypeIds);

  try {
    const service = await prisma.service.update({
      where: { id },
      data: { ...fields, equipmentTypes: serviceEquipmentRelation(equipmentTypeIds) },
      include: { _count: { select: { faq: true } }, equipmentTypes: { select: { id: true } } },
    });

    if (input.slug) {
      await saveSlugRedirect(prisma, serviceSlugRedirect(existing.slug, service.slug));
    }

    return { service: toAdminService(service) };
  } catch (error) {
    if (isUniqueViolation(error)) throwConflict("Услуга с таким кодом уже есть");
    throw error;
  }
});
