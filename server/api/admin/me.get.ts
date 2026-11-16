import { requireAdmin } from "../../utils/admin-guard";

/** Кто сейчас вошёл — для шапки админки и проверки сессии на клиенте. */
export default defineEventHandler((event) => {
  return { user: requireAdmin(event) };
});
