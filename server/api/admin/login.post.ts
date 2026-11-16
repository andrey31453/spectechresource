import * as v from "valibot";
import { LoginSchema } from "#shared/schemas/auth";
import { toFieldErrors } from "#shared/schemas/errors";
import { createAdminSession } from "../../utils/admin-sessions";
import {
  ADMIN_LOGIN_RATE_LIMIT,
  ADMIN_SESSION_COOKIE,
  isSecureProtocol,
  sessionCookieOptions,
  toAdminIdentity,
} from "../../utils/auth";
import { DUMMY_PASSWORD_HASH, verifyPassword } from "../../utils/password";
import { hitRateLimit } from "../../utils/rate-limit";

/**
 * Вход в админку: e-mail + пароль → строка в `admin_sessions` → httpOnly-cookie.
 *
 * Ответы намеренно не различают «нет такого e-mail» и «неверный пароль»:
 * иначе форма входа превращается в проверялку существующих сотрудников.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const parsed = v.safeParse(LoginSchema, body ?? {});

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      message: "Проверьте поля формы",
      data: { errors: toFieldErrors(parsed.issues) },
    });
  }

  const { email, password } = parsed.output;
  const ip = getRequestIP(event, { xForwardedFor: true });
  const limit = hitRateLimit(`admin-login:${ip ?? "unknown"}`, ADMIN_LOGIN_RATE_LIMIT);

  if (!limit.allowed) {
    setResponseHeader(event, "retry-after", limit.retryAfterSec);
    throw createError({
      statusCode: 429,
      statusMessage: "Too Many Requests",
      message: "Слишком много попыток входа. Подождите несколько минут.",
    });
  }

  const prisma = usePrisma();
  const user = await prisma.adminUser.findUnique({ where: { email } });

  // Хеш проверяем всегда, даже когда пользователя нет: одинаковое время ответа.
  const passwordOk = await verifyPassword(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);

  if (!user || !user.isActive || !passwordOk) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
      message: "Неверный e-mail или пароль",
    });
  }

  const config = useRuntimeConfig();
  const { token, expiresAt } = await createAdminSession(prisma, user.id, {
    ip: ip ?? null,
    userAgent: getRequestHeader(event, "user-agent") ?? null,
    secret: String(config.sessionSecret ?? ""),
  });

  await prisma.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  setCookie(
    event,
    ADMIN_SESSION_COOKIE,
    token,
    sessionCookieOptions(expiresAt, isSecureProtocol(getRequestProtocol(event))),
  );
  setResponseHeader(event, "cache-control", "no-store");

  return { user: toAdminIdentity(user) };
});
