import { AdvantageUpdateSchema } from "#shared/schemas/admin-content";
import { requireAdmin } from "../../../../utils/admin-guard";
import { readValidBody, requirePathParam, throwNotFound } from "../../../../utils/admin-request";
import { toAdminAdvantage } from "../../../../utils/content-admin";

/** Правка преимущества: приходят только изменённые поля. */
export default defineEventHandler(async (event) => {
  requireAdmin(event);
  const id = requirePathParam(event);
  const input = await readValidBody(event, AdvantageUpdateSchema);
  const prisma = usePrisma();

  const existing = await prisma.advantage.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throwNotFound("Преимущество не найдено");

  const item = await prisma.advantage.update({ where: { id }, data: input });

  return { item: toAdminAdvantage(item) };
});
