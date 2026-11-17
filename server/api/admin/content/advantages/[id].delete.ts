import { requireAdmin } from "../../../../utils/admin-guard";
import { requirePathParam, throwNotFound } from "../../../../utils/admin-request";

/** Удаление преимущества: блок исчезает с главной сразу после сохранения. */
export default defineEventHandler(async (event) => {
  requireAdmin(event);
  const id = requirePathParam(event);
  const prisma = usePrisma();

  const existing = await prisma.advantage.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throwNotFound("Преимущество не найдено");

  await prisma.advantage.delete({ where: { id } });

  return { ok: true };
});
