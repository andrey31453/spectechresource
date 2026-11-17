import { requireAdmin } from "../../../../utils/admin-guard";
import { requirePathParam, throwNotFound } from "../../../../utils/admin-request";

/** Удаление шага: нумерация на главной пересчитывается сама. */
export default defineEventHandler(async (event) => {
  requireAdmin(event);
  const id = requirePathParam(event);
  const prisma = usePrisma();

  const existing = await prisma.workStep.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throwNotFound("Шаг не найден");

  await prisma.workStep.delete({ where: { id } });

  return { ok: true };
});
