import { WorkStepCreateSchema } from "#shared/schemas/admin-content";
import { requireAdmin } from "../../../../utils/admin-guard";
import { readValidBody } from "../../../../utils/admin-request";
import { toAdminWorkStep } from "../../../../utils/content-admin";

/** Новый шаг «Как заказать технику» на главной. */
export default defineEventHandler(async (event) => {
  requireAdmin(event);
  const input = await readValidBody(event, WorkStepCreateSchema);

  const item = await usePrisma().workStep.create({ data: input });

  setResponseStatus(event, 201);
  return { item: toAdminWorkStep(item) };
});
