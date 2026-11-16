import { revokeAdminSession } from "../../utils/admin-sessions";
import { ADMIN_SESSION_COOKIE } from "../../utils/auth";

/**
 * Выход: удаляет строку сессии в БД и сбрасывает cookie.
 * Без валидной сессии тоже отвечает `200`: повторный клик по «Выйти» — не ошибка.
 */
export default defineEventHandler(async (event) => {
  const token = getCookie(event, ADMIN_SESSION_COOKIE);

  if (token) {
    const config = useRuntimeConfig();
    await revokeAdminSession(usePrisma(), token, String(config.sessionSecret ?? ""));
  }

  deleteCookie(event, ADMIN_SESSION_COOKIE, { path: "/" });
  setResponseHeader(event, "cache-control", "no-store");

  return { ok: true };
});
