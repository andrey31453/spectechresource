/** Кэш таблицы `Redirect` в памяти Nitro: 60 секунд, чтобы не ходить в БД на каждый запрос. */
const TTL_MS = 60_000;

let cache: { loadedAt: number; map: Map<string, string> } | null = null;

/** Админка поменяла адрес страницы — старый адрес должен работать сразу, без ожидания TTL. */
export function invalidateRedirectCache(): void {
  cache = null;
}

export async function getRedirectMap(): Promise<Map<string, string>> {
  if (cache && Date.now() - cache.loadedAt < TTL_MS) return cache.map;

  const rows = await usePrisma().redirect.findMany({ select: { from: true, to: true } });

  cache = {
    loadedAt: Date.now(),
    map: new Map(rows.map((row) => [row.from, row.to])),
  };

  return cache.map;
}
