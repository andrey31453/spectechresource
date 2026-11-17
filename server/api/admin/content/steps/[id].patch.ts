import { WorkStepUpdateSchema } from "#shared/schemas/admin-content";
import { requireAdmin } from "../../../../utils/admin-guard";
import { readValidBody, requirePathParam, throwNotFound } from "../../../../utils/admin-request";
import { toAdminWorkStep } from "../../../../utils/content-admin";

/** Правка шага: приходят только изменённые поля. */
export default defineEventHandler(async (event) => {
  requireAdmin(event);
  const id = requirePathParam(event);
  const input = await readValidBody(event, WorkStepUpdateSchema);
  const prisma = usePrisma();

  const existing = await prisma.workStep.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throwNotFound("Шаг не найден");

  const item = await prisma.workStep.update({ where: { id }, data: input });

  return { item: toAdminWorkStep(item) };
});
