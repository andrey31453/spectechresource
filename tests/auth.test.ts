import { describe, expect, it } from "vitest";
import {
  ADMIN_LOGIN_RATE_LIMIT,
  ADMIN_SESSION_TTL_MS,
  adminSessionExpiry,
  createSessionToken,
  hasAtLeastRole,
  hashSessionToken,
  isAdminApiPath,
  isAdminPagePath,
  isPublicAdminRequest,
  isReadMethod,
  isSameOrigin,
  isSecureProtocol,
  isSessionExpired,
  sessionCookieOptions,
  toAdminIdentity,
} from "../server/utils/auth";

/** Чистая логика сессии админки: токены, роли, какие маршруты закрыты. */

describe("токен сессии", () => {
  it("43 символа base64url и не повторяется", () => {
    const first = createSessionToken();
    const second = createSessionToken();

    expect(first).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(first).not.toBe(second);
  });

  it("в БД попадает хеш, а не сам токен", () => {
    const token = createSessionToken();
    const hash = hashSessionToken(token);

    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash).not.toBe(token);
    expect(hashSessionToken(token)).toBe(hash);
  });

  it("хеш с секретом отличается от хеша без секрета", () => {
    const token = createSessionToken();

    expect(hashSessionToken(token, "secret")).not.toBe(hashSessionToken(token));
    expect(hashSessionToken(token, "secret")).toBe(hashSessionToken(token, "secret"));
  });
});

describe("срок жизни сессии", () => {
  it("по умолчанию — неделя", () => {
    const now = new Date("2026-11-15T12:00:00.000Z");
    const expiresAt = adminSessionExpiry(now);

    expect(ADMIN_SESSION_TTL_MS).toBe(7 * 24 * 60 * 60 * 1000);
    expect(expiresAt.toISOString()).toBe("2026-11-22T12:00:00.000Z");
  });

  it("истекшая и пограничная сессия считаются просроченными", () => {
    const now = new Date("2026-11-15T12:00:00.000Z");

    expect(isSessionExpired(new Date("2026-11-15T11:59:59.000Z"), now)).toBe(true);
    expect(isSessionExpired(now, now)).toBe(true);
    expect(isSessionExpired(new Date("2026-11-15T12:00:01.000Z"), now)).toBe(false);
  });
});

describe("роли", () => {
  it("ADMIN проходит везде, EDITOR — только туда, где нужен редактор", () => {
    expect(hasAtLeastRole("ADMIN", "ADMIN")).toBe(true);
    expect(hasAtLeastRole("ADMIN", "EDITOR")).toBe(true);
    expect(hasAtLeastRole("EDITOR", "EDITOR")).toBe(true);
    expect(hasAtLeastRole("EDITOR", "ADMIN")).toBe(false);
  });
});

describe("какие маршруты админки закрыты", () => {
  it("вход, выход и страница входа — публичные", () => {
    expect(isPublicAdminRequest("POST", "/api/admin/login")).toBe(true);
    expect(isPublicAdminRequest("POST", "/api/admin/logout")).toBe(true);
    expect(isPublicAdminRequest("GET", "/admin/login")).toBe(true);
  });

  it("тот же путь с другим методом уже требует сессию", () => {
    expect(isPublicAdminRequest("GET", "/api/admin/login")).toBe(false);
    expect(isPublicAdminRequest("GET", "/api/admin/logout")).toBe(false);
  });

  it("остальные админ-API и страницы закрыты", () => {
    for (const path of ["/api/admin/me", "/api/admin/leads", "/api/admin/catalog/types"]) {
      expect(isAdminApiPath(path)).toBe(true);
      expect(isPublicAdminRequest("GET", path)).toBe(false);
    }

    for (const path of ["/admin", "/admin/leads", "/admin/catalog/zemleroynaya-tehnika"]) {
      expect(isAdminPagePath(path)).toBe(true);
      expect(isPublicAdminRequest("GET", path)).toBe(false);
    }
  });

  it("похожие, но не админские пути не задевает", () => {
    expect(isAdminApiPath("/api/leads")).toBe(false);
    expect(isAdminPagePath("/administrator")).toBe(false);
    expect(isAdminPagePath("/adminlogin")).toBe(false);
    expect(isAdminApiPath("/api/admin-panel")).toBe(false);
  });

  it("безопасные методы — GET, HEAD, OPTIONS", () => {
    expect(isReadMethod("GET")).toBe(true);
    expect(isReadMethod("HEAD")).toBe(true);
    expect(isReadMethod("OPTIONS")).toBe(true);
    expect(isReadMethod("POST")).toBe(false);
    expect(isReadMethod("DELETE")).toBe(false);
  });
});

describe("cookie сессии", () => {
  it("httpOnly, SameSite=Lax, выход на весь сайт", () => {
    const expiresAt = new Date("2026-11-22T12:00:00.000Z");
    const options = sessionCookieOptions(expiresAt, true);

    expect(options).toEqual({
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      expires: expiresAt,
    });
  });

  it("secure включается только на https", () => {
    expect(isSecureProtocol("https")).toBe(true);
    expect(isSecureProtocol("http")).toBe(false);
    expect(isSecureProtocol(undefined)).toBe(false);
  });
});

describe("проверка источника запроса (CSRF)", () => {
  it("свой источник пропускается", () => {
    expect(isSameOrigin("https://spectech.ru", "spectech.ru")).toBe(true);
    expect(isSameOrigin("http://localhost:3000", "localhost:3000")).toBe(true);
  });

  it("чужой источник отклоняется", () => {
    expect(isSameOrigin("https://evil.example", "spectech.ru")).toBe(false);
    expect(isSameOrigin("https://spectech.ru:8443", "spectech.ru")).toBe(false);
    expect(isSameOrigin("null", "spectech.ru")).toBe(false);
  });

  it("без Origin (curl, серверный вызов) не блокируем", () => {
    expect(isSameOrigin(undefined, "spectech.ru")).toBe(true);
  });
});

describe("toAdminIdentity", () => {
  it("отдаёт только безопасные поля", () => {
    const view = toAdminIdentity({
      id: "u1",
      email: "admin@example.ru",
      name: null,
      role: "ADMIN",
    });

    expect(view).toEqual({ id: "u1", email: "admin@example.ru", name: null, role: "ADMIN" });
    expect(Object.keys(view).sort()).toEqual(["email", "id", "name", "role"]);
  });

  it("неизвестная роль считается редактором", () => {
    expect(toAdminIdentity({ id: "u1", email: "a@b.ru", name: "Иван", role: "OWNER" }).role).toBe("EDITOR");
  });
});

describe("лимит попыток входа", () => {
  it("не мягче 5 попыток за 5 минут", () => {
    expect(ADMIN_LOGIN_RATE_LIMIT.limit).toBeGreaterThanOrEqual(5);
    expect(ADMIN_LOGIN_RATE_LIMIT.windowMs).toBe(5 * 60 * 1000);
  });
});
