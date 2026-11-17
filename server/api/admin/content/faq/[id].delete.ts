import { requireAdmin } from "../../../../utils/admin-guard";
import { requirePathParam, throwNotFound } from "../../../../utils/admin-request";

/** Удаление вопроса: только сам текст, привязки к виду и услуге остаются на месте. */
export default defineEventHandler(async (event) => {
  requireAdmin(event);
  const id = requirePathParam(event);
  const prisma = usePrisma();

  const existing = await prisma.faqItem.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throwNotFound("Вопрос не найден");

  await prisma.faqItem.delete({ where: { id } });

  return { ok: true };
});
