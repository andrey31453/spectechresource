import { beforeEach, describe, expect, it } from "vitest";
import { hitRateLimit, resetRateLimit } from "~~/server/utils/rate-limit";

const window = { limit: 3, windowMs: 60_000 };

describe("hitRateLimit", () => {
  beforeEach(() => resetRateLimit());

  it("пропускает запросы в пределах лимита и вычитает остаток", () => {
    expect(hitRateLimit("ip", { ...window, now: 1_000 })).toEqual({
      allowed: true,
      remaining: 2,
      retryAfterSec: 0,
    });
    expect(hitRateLimit("ip", { ...window, now: 1_000 }).remaining).toBe(1);
    expect(hitRateLimit("ip", { ...window, now: 1_000 })).toEqual({
      allowed: true,
      remaining: 0,
      retryAfterSec: 0,
    });
  });

  it("запрос сверх лимита отклоняет и подсказывает Retry-After", () => {
    for (let i = 0; i < 3; i++) hitRateLimit("ip", { ...window, now: 1_000 });

    const blocked = hitRateLimit("ip", { ...window, now: 31_000 });
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSec).toBe(30);
  });

  it("ключи не пересекаются: чужой IP не страдает", () => {
    for (let i = 0; i < 4; i++) hitRateLimit("192.0.2.1", { ...window, now: 1_000 });

    expect(hitRateLimit("192.0.2.2", { ...window, now: 1_000 }).allowed).toBe(true);
  });

  it("после окна счётчик обнуляется", () => {
    for (let i = 0; i < 4; i++) hitRateLimit("ip", { ...window, now: 1_000 });

    expect(hitRateLimit("ip", { ...window, now: 61_000 })).toEqual({
      allowed: true,
      remaining: 2,
      retryAfterSec: 0,
    });
  });
});
