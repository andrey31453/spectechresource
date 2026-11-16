import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import type { ScryptOptions } from "node:crypto";

/**
 * Пароли админки — **scrypt** из стандартной библиотеки Node (ADR-19).
 *
 * Новых зависимостей не добавляем, но формат хеша версионирован:
 * `scrypt$N$r$p$соль$хеш`, параметры лежат внутри строки. Поэтому стоимость
 * можно поднять (или перейти на argon2id), не сбрасывая старые пароли:
 * каждый хеш проверяется своими параметрами.
 */

const ALGORITHM = "scrypt";

/** 2^14, 16 МиБ памяти на одну проверку: ~50–100 мс, незаметно человеку и дорого перебору. */
const DEFAULT_PARAMS = { N: 16384, r: 8, p: 1 } as const;

const SALT_BYTES = 16;
const KEY_BYTES = 64;

/** Пределы для *новых* паролей; при входе длина не проверяется — только схемой (до 200 символов). */
export const PASSWORD_LIMITS = { min: 12, max: 200 } as const;

function derive(password: string, salt: Buffer, keyLength: number, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keyLength, options, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });
}

interface ParsedHash {
  N: number;
  r: number;
  p: number;
  salt: Buffer;
  hash: Buffer;
}

function isIntInRange(value: number, min: number, max: number): boolean {
  return Number.isInteger(value) && value >= min && value <= max;
}

/**
 * Разбор строки хеша. Возвращает `null` на любом мусоре: битый хеш в БД
 * должен означать «пароль не подходит», а не 500 и не попытку выделить гигабайт памяти.
 */
function parseHash(stored: string): ParsedHash | null {
  const parts = stored.split("$");
  if (parts.length !== 6) return null;

  const [algorithm, rawN, rawR, rawP, rawSalt, rawHash] = parts;
  if (algorithm !== ALGORITHM || !rawN || !rawR || !rawP || !rawSalt || !rawHash) return null;

  const N = Number(rawN);
  const r = Number(rawR);
  const p = Number(rawP);

  // Верхние границы защищают от «отравленного» хеша: scrypt с N=2^30 съест всю память.
  // 2^15 = 32 МиБ — потолок для проверки; поднимать вместе с DEFAULT_PARAMS.
  if (!isIntInRange(N, 2 ** 10, 2 ** 15) || (N & (N - 1)) !== 0) return null;
  if (!isIntInRange(r, 1, 32) || !isIntInRange(p, 1, 4)) return null;

  const salt = Buffer.from(rawSalt, "base64");
  const hash = Buffer.from(rawHash, "base64");
  if (salt.length === 0 || hash.length === 0) return null;

  return { N, r, p, salt, hash };
}

/** Хеш для сохранения в `AdminUser.passwordHash`. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const key = await derive(password, salt, KEY_BYTES, DEFAULT_PARAMS);

  return [ALGORITHM, DEFAULT_PARAMS.N, DEFAULT_PARAMS.r, DEFAULT_PARAMS.p, salt.toString("base64"), key.toString("base64")].join(
    "$",
  );
}

/**
 * Хеш-заглушка на случай «пользователя с таким e-mail нет».
 * Проверка всё равно выполняется — иначе по времени ответа (десятки миллисекунд)
 * можно отличить существующий адрес от несуществующего.
 */
export const DUMMY_PASSWORD_HASH =
  "scrypt$16384$8$1$n94gm4siYz29HX/eYm5Q1g==$bU7ACGjBFtOrciF1FATKt43xkn2u1qw7qdLOXfSziVp9gGCkc4DOIN56gQ8GVUsXaCqJF4yTGRhx25B900J9nQ==";

/** Проверка пароля; на битом хеше возвращает `false`, а не бросает исключение. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parsed = parseHash(stored);
  if (!parsed) return false;

  try {
    const expected = await derive(password, parsed.salt, parsed.hash.length, {
      N: parsed.N,
      r: parsed.r,
      p: parsed.p,
    });

    return expected.length === parsed.hash.length && timingSafeEqual(expected, parsed.hash);
  } catch {
    return false;
  }
}
