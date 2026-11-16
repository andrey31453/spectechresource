import type { PrismaClient } from "../../generated/prisma/client";
import {
  adminSessionExpiry,
  createSessionToken,
  hashSessionToken,
  isSessionExpired,
  toAdminIdentity,
  type AdminIdentity,
} from "./auth";

/**
 * Операции с таблицей `admin_sessions`. Отдельно от `auth.ts`, чтобы чистая логика
 * (хеши, предикаты путей) тестировалась без Prisma, а здесь остались только запросы.
 */

export interface AdminSessionContext {
  ip: string | null;
  userAgent: string | null;
  /** `SESSION_SECRET`: с ним хеш токена — HMAC-SHA256, без него — sha256. */
  secret?: string;
  now?: Date;
}

export interface CreatedAdminSession {
  /** Сырой токен: кладём в cookie и больше нигде не храним. */
  token: string;
  expiresAt: Date;
}

export async function createAdminSession(
  prisma: PrismaClient,
  userId: string,
  context: AdminSessionContext,
): Promise<CreatedAdminSession> {
  const token = createSessionToken();
  const expiresAt = adminSessionExpiry(context.now);

  await prisma.adminSession.create({
    data: {
      userId,
      tokenHash: hashSessionToken(token, context.secret ?? ""),
      expiresAt,
      ip: context.ip,
      userAgent: context.userAgent,
    },
  });

  return { token, expiresAt };
}

export interface ResolvedAdminSession {
  sessionId: string;
  user: AdminIdentity;
}

export interface ResolveOptions {
  secret?: string;
  now?: Date;
}

/**
 * Проверка cookie: есть строка сессии, не истекла, пользователь активен.
 * Просроченную сессию удаляем сразу — таблица не растёт от «забытых» входов.
 */
export async function resolveAdminSession(
  prisma: PrismaClient,
  token: string,
  options: ResolveOptions = {},
): Promise<ResolvedAdminSession | null> {
  if (!token) return null;

  const session = await prisma.adminSession.findUnique({
    where: { tokenHash: hashSessionToken(token, options.secret ?? "") },
    select: {
      id: true,
      expiresAt: true,
      user: { select: { id: true, email: true, name: true, isActive: true } },
    },
  });

  if (!session || !session.user.isActive) return null;

  if (isSessionExpired(session.expiresAt, options.now)) {
    await prisma.adminSession.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }

  return { sessionId: session.id, user: toAdminIdentity(session.user) };
}

/** Выход: удаляет ровно эту сессию. Возвращает `false`, если строки уже не было. */
export async function revokeAdminSession(prisma: PrismaClient, token: string, secret = ""): Promise<boolean> {
  const result = await prisma.adminSession.deleteMany({ where: { tokenHash: hashSessionToken(token, secret) } });
  return result.count > 0;
}

/** «Выйти на всех устройствах» и сброс доступа при смене пароля. */
export async function revokeAllAdminSessions(prisma: PrismaClient, userId: string): Promise<number> {
  const result = await prisma.adminSession.deleteMany({ where: { userId } });
  return result.count;
}
