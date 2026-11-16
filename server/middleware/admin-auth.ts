import { resolveAdminSession } from "../utils/admin-sessions";
import {
  ADMIN_SESSION_COOKIE,
  isAdminApiPath,
  isAdminPagePath,
  isPublicAdminRequest,
  isReadMethod,
  isSameOrigin,
  type AdminIdentity,
} from "../utils/auth";

/**
 * Защита админки: всё под `/api/admin/**` и `/admin/**` требует валидной сессии,
 * кроме входа и выхода (ADR-19).
 *
 * Один фильтр на все маршруты: новый эндпоинт нельзя «забыть защитить».
 * Проверка стоит до хэндлера, поэтому в самом хэндлере достаточно взять `event.context.admin`.
 */
export default defineEventHandler(async (event) => {
  const { pathname, search } = getRequestURL(event);

  const isApi = isAdminApiPath(pathname);
  if (!isApi && !isAdminPagePath(pathname)) return;

  const method = getMethod(event);
  const isPublic = isPublicAdminRequest(method, pathname);

  const token = getCookie(event, ADMIN_SESSION_COOKIE);
  const config = useRuntimeConfig();
  const secret = String(config.sessionSecret ?? "");

  // Для страницы входа сессию смотрим только чтобы увести уже вошедшего в админку.
  const shouldResolve = Boolean(token) && (!isPublic || (pathname === "/admin/login" && isReadMethod(method)));

  let session: { sessionId: string; user: AdminIdentity } | null = null;

  if (shouldResolve && token) {
    try {
      session = await resolveAdminSession(usePrisma(), token, { secret });
    } catch (error) {
      console.error("[admin-auth] не удалось проверить сессию:", error);
      throw createError({
        statusCode: 503,
        statusMessage: "Service Unavailable",
        message: "Сервис временно недоступен, попробуйте позже",
      });
    }
  }

  // Публичные маршруты: форма входа и выход.
  if (isPublic) {
    if (!session) deleteCookie(event, ADMIN_SESSION_COOKIE, { path: "/" });
    if (session && pathname === "/admin/login" && isReadMethod(method)) return sendRedirect(event, "/admin", 302);
    setResponseHeader(event, "cache-control", "no-store");
    return;
  }

  if (!session) {
    if (token) deleteCookie(event, ADMIN_SESSION_COOKIE, { path: "/" });

    if (isApi) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
        message: "Требуется вход в админку",
      });
    }

    const next = pathname + search;
    return sendRedirect(event, `/admin/login?next=${encodeURIComponent(next)}`, 302);
  }

  // CSRF: на небезопасные методы требуем совпадения Origin с Host (вторая линия после SameSite=Lax).
  if (!isReadMethod(method) && !isSameOrigin(getRequestHeader(event, "origin"), getRequestHeader(event, "host"))) {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      message: "Запрос с чужого источника отклонён",
    });
  }

  event.context.admin = session.user;
  setResponseHeader(event, "cache-control", "no-store");
});
