import { createHash, createHmac, randomBytes } from "node:crypto";

/**
 * Сессия админки: непрозрачный токен в httpOnly-cookie + строка в `AdminSession` (ADR-19).
 *
 * Здесь только чистые функции — без Prisma, h3 и Nitro, поэтому модуль целиком
 * проверяется юнит-тестами. Работа с БД — `server/utils/admin-sessions.ts`.
 */

export const ADMIN_SESSION_COOKIE = "admin_session";

/** Неделя: заказчику удобно, а украденный токен всё равно отзывается удалением строки. */
export const ADMIN_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Вход: 8 попыток за 5 минут на IP — человеку хватает, перебор становится бессмысленным. */
export const ADMIN_LOGIN_RATE_LIMIT = { limit: 8, windowMs: 5 * 60 * 1000 } as const;

export type AdminRoleName = "ADMIN" | "EDITOR";

/** Что кладём в `event.context.admin` и отдаём в `GET /api/admin/me`. */
export interface AdminIdentity {
  id: string;
  email: string;
  name: string | null;
  role: AdminRoleName;
}

/** Случайный токен сессии: 32 байта → 43 символа base64url. */
export function createSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * В БД хранится только хеш токена. Если задан `SESSION_SECRET` — HMAC,
 * иначе sha256: утечка дампа не даёт готовых cookie.
 */
export function hashSessionToken(token: string, secret = ""): string {
  return secret
    ? createHmac("sha256", secret).update(token).digest("hex")
    : createHash("sha256").update(token).digest("hex");
}

export function adminSessionExpiry(now: Date = new Date()): Date {
  return new Date(now.getTime() + ADMIN_SESSION_TTL_MS);
}

export function isSessionExpired(expiresAt: Date, now: Date = new Date()): boolean {
  return expiresAt.getTime() <= now.getTime();
}

/** `ADMIN` умеет всё, `EDITOR` — контент; сравнение ролей в одном месте. */
export function hasAtLeastRole(role: AdminRoleName, required: AdminRoleName): boolean {
  return role === "ADMIN" || required === "EDITOR";
}

export function isReadMethod(method: string): boolean {
  return method === "GET" || method === "HEAD" || method === "OPTIONS";
}

export function isAdminApiPath(pathname: string): boolean {
  return pathname === "/api/admin" || pathname.startsWith("/api/admin/");
}

export function isAdminPagePath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

/**
 * Что доступно без сессии: вход, выход (безвреден) и сама страница входа.
 * Всё остальное под `/api/admin/**` и `/admin/**` закрыто.
 */
export function isPublicAdminRequest(method: string, pathname: string): boolean {
  if (pathname === "/admin/login") return true;
  if (pathname === "/api/admin/login" && method === "POST") return true;
  if (pathname === "/api/admin/logout" && method === "POST") return true;
  return false;
}

/** Параметры cookie: JS страницы токен не читает, отправляется только на свой сайт. */
export function sessionCookieOptions(expiresAt: Date, secure: boolean) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    expires: expiresAt,
  };
}

export function isSecureProtocol(protocol: string | undefined): boolean {
  return protocol === "https";
}

/**
 * Проверка источника для небезопасных методов (вторая линия после `SameSite=Lax`).
 * Запрос без `Origin` (curl, серверный вызов) не блокируем: cookie браузер туда не подставит сам.
 */
export function isSameOrigin(origin: string | undefined, host: string | undefined): boolean {
  if (!origin) return true;
  if (!host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** Представление пользователя для API: без `passwordHash` и служебных полей. */
export function toAdminIdentity(user: {
  id: string;
  email: string;
  name: string | null;
  role: string;
}): AdminIdentity {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role === "ADMIN" ? "ADMIN" : "EDITOR",
  };
}
