import type { H3Event } from "h3";
import type { AdminIdentity } from "./auth";

/**
 * Доступ к данным текущего администратора. Middleware уже проверил сессию,
 * но проверка здесь нужна: тип `event.context.admin` — опциональный,
 * и это последняя линия, если маршрут случайно окажется вне фильтра.
 */
export function requireAdmin(event: H3Event): AdminIdentity {
  const admin = event.context.admin;

  if (!admin) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
      message: "Требуется вход в админку",
    });
  }

  return admin;
}
