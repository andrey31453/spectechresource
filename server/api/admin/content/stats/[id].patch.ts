import { TrustStatUpdateSchema } from "#shared/schemas/admin-content";
import { requireAdmin } from "../../../../utils/admin-guard";
import { readValidBody, requirePathParam, throwNotFound } from "../../../../utils/admin-request";
import { toAdminTrustStat } from "../../../../utils/content-admin";

/** Правка цифры: приходят только изменённые поля. */
export default defineEventHandler(async (event) => {
  requireAdmin(event);
  const id = requirePathParam(event);
  const input = await readValidBody(event, TrustStatUpdateSchema);
  const prisma = usePrisma();

  const existing = await prisma.trustStat.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throwNotFound("Цифра не найдена");

  const item = await prisma.trustStat.update({ where: { id }, data: input });

  return { item: toAdminTrustStat(item) };
});
