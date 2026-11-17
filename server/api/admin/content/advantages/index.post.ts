import { AdvantageCreateSchema } from "#shared/schemas/admin-content";
import { requireAdmin } from "../../../../utils/admin-guard";
import { readValidBody } from "../../../../utils/admin-request";
import { toAdminAdvantage } from "../../../../utils/content-admin";

/** Новое преимущество — блок «Почему работают с нами» на главной. */
export default defineEventHandler(async (event) => {
  requireAdmin(event);
  const input = await readValidBody(event, AdvantageCreateSchema);

  const item = await usePrisma().advantage.create({ data: input });

  setResponseStatus(event, 201);
  return { item: toAdminAdvantage(item) };
});
