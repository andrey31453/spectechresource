import type { H3Event } from "h3";
import { hasAtLeastRole, type AdminIdentity, type AdminRoleName } from "./auth";

/**
 * Доступ к данным текущего администратора. Middleware уже проверил сессию,
 * но проверка здесь нужна: тип `event.context.admin` — опциональный,
 * и это последняя линия, если маршрут случайно окажется вне фильтра.
 */
export function requireAdmin(event: H3Event, required: AdminRoleName = "EDITOR"): AdminIdentity {
  const admin = event.context.admin;

  if (!admin) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
      message: "Требуется вход в админку",
    });
  }

  if (!hasAtLeastRole(admin.role, required)) {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      message: "Недостаточно прав для этого действия",
    });
  }

  return admin;
}
