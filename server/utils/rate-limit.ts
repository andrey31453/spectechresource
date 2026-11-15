/**
 * Простой ограничитель частоты в памяти процесса Nitro.
 *
 * Осознанные ограничения: счётчики живут в одном инстансе и обнуляются при рестарте,
 * за балансировщиком нужен общий стор (Redis) — см. `docs/specs/leads.md`.
 */

export interface RateLimitOptions {
  /** Сколько запросов разрешено в окне. */
  limit: number;
  /** Длина окна в миллисекундах. */
  windowMs: number;
  /** Момент проверки — подменяется в тестах. */
  now?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Через сколько секунд окно сбросится (для заголовка `Retry-After`). */
  retryAfterSec: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/** Защита от роста памяти, если IP много: при переполнении выбрасываем истёкшие окна. */
const MAX_BUCKETS = 10_000;

function prune(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function hitRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = options.now ?? Date.now();

  if (buckets.size >= MAX_BUCKETS) prune(now);

  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true, remaining: Math.max(0, options.limit - 1), retryAfterSec: 0 };
  }

  bucket.count += 1;
  const retryAfterSec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));

  if (bucket.count > options.limit) {
    return { allowed: false, remaining: 0, retryAfterSec };
  }

  return { allowed: true, remaining: Math.max(0, options.limit - bucket.count), retryAfterSec: 0 };
}

/** Только для тестов: сбросить накопленные окна. */
export function resetRateLimit(): void {
  buckets.clear();
}
