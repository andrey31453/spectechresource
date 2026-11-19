/**
 * Русская форма существительного при числе: pluralRu(3, ["вид", "вида", "видов"]).
 * Правило: 11–14 и всё, что кончается на 0, 5–9 → третья форма.
 */
export function pluralRu(count: number, forms: [string, string, string]): string {
  const abs = Math.abs(Math.trunc(count)) % 100;
  if (abs >= 11 && abs <= 14) return forms[2];

  const last = abs % 10;
  if (last === 1) return forms[0];
  if (last >= 2 && last <= 4) return forms[1];
  return forms[2];
}
