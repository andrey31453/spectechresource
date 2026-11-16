import { beforeEach, describe, expect, it } from "vitest";
import type { PrismaClient } from "../generated/prisma/client";
import {
  createAdminSession,
  resolveAdminSession,
  revokeAdminSession,
  revokeAllAdminSessions,
} from "../server/utils/admin-sessions";
import { ADMIN_SESSION_TTL_MS, hashSessionToken } from "../server/utils/auth";

/**
 * Операции с `admin_sessions` на минимальном фейке Prisma: проверяем логику
 * «что пишем, что находим, что удаляем», не поднимая БД (ADR-16).
 */

interface FakeUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
}

interface SessionRow {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  ip: string | null;
  userAgent: string | null;
}

function createFakePrisma(users: FakeUser[]) {
  const rows: SessionRow[] = [];
  let counter = 0;

  const prisma = {
    adminSession: {
      async create({ data }: { data: Omit<SessionRow, "id"> }) {
        const row: SessionRow = { id: `session-${++counter}`, ...data };
        rows.push(row);
        return row;
      },
      async findUnique({ where }: { where: { tokenHash: string } }) {
        const row = rows.find((item) => item.tokenHash === where.tokenHash);
        if (!row) return null;

        const user = users.find((item) => item.id === row.userId);
        if (!user) return null;

        return { id: row.id, expiresAt: row.expiresAt, user };
      },
      async delete({ where }: { where: { id: string } }) {
        const index = rows.findIndex((item) => item.id === where.id);
        if (index >= 0) rows.splice(index, 1);
        return {};
      },
      async deleteMany({ where }: { where: { tokenHash?: string; userId?: string } }) {
        let count = 0;

        for (let index = rows.length - 1; index >= 0; index -= 1) {
          const row = rows[index];
          if (!row) continue;

          const matchesHash = where.tokenHash ? row.tokenHash === where.tokenHash : true;
          const matchesUser = where.userId ? row.userId === where.userId : true;

          if (matchesHash && matchesUser) {
            rows.splice(index, 1);
            count += 1;
          }
        }

        return { count };
      },
    },
  };

  return { prisma: prisma as unknown as PrismaClient, rows, users };
}

const ACTIVE_USER: FakeUser = {
  id: "user-1",
  email: "admin@example.ru",
  name: "Иван",
  role: "ADMIN",
  isActive: true,
};

describe("createAdminSession", () => {
  it("пишет в БД хеш токена, а не токен; сохраняет ip и user-agent", async () => {
    const { prisma, rows } = createFakePrisma([ACTIVE_USER]);
    const now = new Date("2026-11-15T12:00:00.000Z");

    const created = await createAdminSession(prisma, ACTIVE_USER.id, {
      ip: "203.0.113.10",
      userAgent: "Mozilla/5.0",
      now,
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]?.tokenHash).toBe(hashSessionToken(created.token));
    expect(rows[0]?.tokenHash).not.toBe(created.token);
    expect(rows[0]?.ip).toBe("203.0.113.10");
    expect(rows[0]?.userAgent).toBe("Mozilla/5.0");
    expect(created.expiresAt.getTime() - now.getTime()).toBe(ADMIN_SESSION_TTL_MS);
  });
});

describe("resolveAdminSession", () => {
  let fake: ReturnType<typeof createFakePrisma>;

  beforeEach(() => {
    fake = createFakePrisma([{ ...ACTIVE_USER }]);
  });

  it("находит пользователя по валидному токену", async () => {
    const created = await createAdminSession(fake.prisma, ACTIVE_USER.id, { ip: null, userAgent: null });

    const session = await resolveAdminSession(fake.prisma, created.token);

    expect(session?.user).toEqual({ id: "user-1", email: "admin@example.ru", name: "Иван", role: "ADMIN" });
    expect(session?.sessionId).toBe("session-1");
  });

  it("не находит чужой или пустой токен", async () => {
    await createAdminSession(fake.prisma, ACTIVE_USER.id, { ip: null, userAgent: null });

    await expect(resolveAdminSession(fake.prisma, "чужой-токен")).resolves.toBeNull();
    await expect(resolveAdminSession(fake.prisma, "")).resolves.toBeNull();
  });

  it("удаляет просроченную сессию и не пускает", async () => {
    const created = await createAdminSession(fake.prisma, ACTIVE_USER.id, {
      ip: null,
      userAgent: null,
      now: new Date("2026-11-01T00:00:00.000Z"),
    });

    const session = await resolveAdminSession(fake.prisma, created.token, {
      now: new Date("2026-11-15T00:00:00.000Z"),
    });

    expect(session).toBeNull();
    expect(fake.rows).toHaveLength(0);
  });

  it("не пускает деактивированного пользователя, даже если сессия жива", async () => {
    const created = await createAdminSession(fake.prisma, ACTIVE_USER.id, { ip: null, userAgent: null });

    const user = fake.users[0];
    if (user) user.isActive = false;

    await expect(resolveAdminSession(fake.prisma, created.token)).resolves.toBeNull();
  });

  it("сессия, созданная с SESSION_SECRET, не находится без секрета", async () => {
    const created = await createAdminSession(fake.prisma, ACTIVE_USER.id, {
      ip: null,
      userAgent: null,
      secret: "server-secret",
    });

    await expect(resolveAdminSession(fake.prisma, created.token)).resolves.toBeNull();
    await expect(resolveAdminSession(fake.prisma, created.token, { secret: "server-secret" })).resolves.not.toBeNull();
  });
});

describe("отзыв сессий", () => {
  it("revokeAdminSession удаляет только свою сессию", async () => {
    const { prisma, rows } = createFakePrisma([{ ...ACTIVE_USER }]);
    const first = await createAdminSession(prisma, ACTIVE_USER.id, { ip: null, userAgent: null });
    const second = await createAdminSession(prisma, ACTIVE_USER.id, { ip: null, userAgent: null });

    await expect(revokeAdminSession(prisma, first.token)).resolves.toBe(true);
    await expect(revokeAdminSession(prisma, first.token)).resolves.toBe(false);
    expect(rows).toHaveLength(1);
    await expect(resolveAdminSession(prisma, second.token)).resolves.not.toBeNull();
  });

  it("revokeAllAdminSessions чистит все входы пользователя", async () => {
    const { prisma } = createFakePrisma([{ ...ACTIVE_USER }]);
    await createAdminSession(prisma, ACTIVE_USER.id, { ip: null, userAgent: null });
    await createAdminSession(prisma, ACTIVE_USER.id, { ip: null, userAgent: null });

    await expect(revokeAllAdminSessions(prisma, ACTIVE_USER.id)).resolves.toBe(2);
    await expect(revokeAllAdminSessions(prisma, ACTIVE_USER.id)).resolves.toBe(0);
  });
});

