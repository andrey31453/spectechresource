import { FaqUpdateSchema, faqTargetIssue, mergeFaqTarget } from "#shared/schemas/admin-content";
import { requireAdmin } from "../../../../utils/admin-guard";
import { readValidBody, requirePathParam, throwFieldError, throwNotFound } from "../../../../utils/admin-request";
import { findFaqTargetIssue, toAdminFaq } from "../../../../utils/content-admin";

/**
 * Правка вопроса. Привязку проверяем на итоговом состоянии: `PATCH` может прислать
 * только `scope`, а вид или услуга останутся из сохранённой записи.
 */
export default defineEventHandler(async (event) => {
  requireAdmin(event);
  const id = requirePathParam(event);
  const input = await readValidBody(event, FaqUpdateSchema);
  const prisma = usePrisma();

  const existing = await prisma.faqItem.findUnique({
    where: { id },
    select: { scope: true, equipmentTypeId: true, serviceId: true },
  });
  if (!existing) throwNotFound("Вопрос не найден");

  const target = mergeFaqTarget(existing, input);

  const targetIssue = faqTargetIssue(target);
  if (targetIssue) throwFieldError(targetIssue.field, targetIssue.message);

  const linkIssue = await findFaqTargetIssue(prisma, target);
  if (linkIssue) throwFieldError(linkIssue.field, linkIssue.message);

  const item = await prisma.faqItem.update({
    where: { id },
    data: { ...input, equipmentTypeId: target.equipmentTypeId, serviceId: target.serviceId },
    include: {
      equipmentType: { select: { name: true } },
      service: { select: { title: true } },
    },
  });

  return { item: toAdminFaq(item) };
});
