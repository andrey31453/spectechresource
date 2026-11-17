import { requireAdmin } from "../../../../utils/admin-guard";
import { requirePathParam, throwNotFound } from "../../../../utils/admin-request";

/** Удаление цифры: строка пропадает из блока доверия на главной. */
export default defineEventHandler(async (event) => {
  requireAdmin(event);
  const id = requirePathParam(event);
  const prisma = usePrisma();

  const existing = await prisma.trustStat.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throwNotFound("Цифра не найдена");

  await prisma.trustStat.delete({ where: { id } });

  return { ok: true };
});
