import { TrustStatCreateSchema } from "#shared/schemas/admin-content";
import { requireAdmin } from "../../../../utils/admin-guard";
import { readValidBody } from "../../../../utils/admin-request";
import { toAdminTrustStat } from "../../../../utils/content-admin";

/** Новая цифра доверия: «120 ед. техники в парке» на главной. */
export default defineEventHandler(async (event) => {
  requireAdmin(event);
  const input = await readValidBody(event, TrustStatCreateSchema);

  const item = await usePrisma().trustStat.create({ data: input });

  setResponseStatus(event, 201);
  return { item: toAdminTrustStat(item) };
});
