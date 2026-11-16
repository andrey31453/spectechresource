import { requireAdmin } from "../../../utils/admin-guard";
import { requirePathParam, throwNotFound } from "../../../utils/admin-request";
import { toAdminLead } from "../../../utils/lead-admin";

/** Карточка заявки: контакты, источник, согласие, служебные поля и состояние доставки. */
export default defineEventHandler(async (event) => {
  requireAdmin(event);
  const id = requirePathParam(event);

  const lead = await usePrisma().lead.findUnique({
    where: { id },
    include: { equipmentType: { select: { name: true } } },
  });

  if (!lead) throwNotFound("Заявка не найдена");

  return { lead: toAdminLead(lead) };
});
