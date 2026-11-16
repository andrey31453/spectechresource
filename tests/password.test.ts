import { describe, expect, it } from "vitest";
import { DUMMY_PASSWORD_HASH, PASSWORD_LIMITS, hashPassword, verifyPassword } from "../server/utils/password";

/**
 * Пароли админки: scrypt из node:crypto, формат `scrypt$N$r$p$соль$хеш`.
 * Тесты настоящие — никаких моков хеширования, иначе проверять нечего.
 */

const PASSWORD = "spec-tech-2026!";

describe("hashPassword", () => {
  it("сохраняет алгоритм, параметры и соль внутри строки", async () => {
    const hash = await hashPassword(PASSWORD);

    expect(hash.startsWith("scrypt$16384$8$1$")).toBe(true);
    expect(hash.split("$")).toHaveLength(6);
  });

  it("для одинаковых паролей даёт разные хеши (соль случайная)", async () => {
    const first = await hashPassword(PASSWORD);
    const second = await hashPassword(PASSWORD);

    expect(first).not.toBe(second);
  });

  it("не содержит сам пароль", async () => {
    const hash = await hashPassword(PASSWORD);

    expect(hash).not.toContain(PASSWORD);
  });
});

describe("verifyPassword", () => {
  it("принимает верный пароль", async () => {
    const hash = await hashPassword(PASSWORD);

    await expect(verifyPassword(PASSWORD, hash)).resolves.toBe(true);
  });

  it("отклоняет неверный пароль", async () => {
    const hash = await hashPassword(PASSWORD);

    await expect(verifyPassword(`${PASSWORD} `, hash)).resolves.toBe(false);
  });

  it("на битом или чужом хеше возвращает false, а не бросает исключение", async () => {
    const broken = [
      "",
      "не-хеш",
      "scrypt$16384$8$1$соль-без-base64",
      "scrypt$1$8$1$c2FsdA==$aGFzaA==",
      "scrypt$1048576$8$1$c2FsdA==$aGFzaA==",
      "scrypt$16384$8$0$c2FsdA==$aGFzaA==",
      "argon2id$16384$8$1$c2FsdA==$aGFzaA==",
      "scrypt$16384$8$1$$",
    ];

    for (const stored of broken) {
      await expect(verifyPassword(PASSWORD, stored)).resolves.toBe(false);
    }
  });

  it("хеш-заглушка валидна и не пускает никого", async () => {
    await expect(verifyPassword("admin-dummy-password-do-not-use", DUMMY_PASSWORD_HASH)).resolves.toBe(true);
    await expect(verifyPassword(PASSWORD, DUMMY_PASSWORD_HASH)).resolves.toBe(false);
  });
});

describe("PASSWORD_LIMITS", () => {
  it("требует пароль от 12 символов", () => {
    expect(PASSWORD_LIMITS.min).toBeGreaterThanOrEqual(12);
    expect(PASSWORD_LIMITS.max).toBeGreaterThan(PASSWORD_LIMITS.min);
  });
});
