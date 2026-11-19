import type { PriceUnit } from "~/types/catalog";

export const PRICE_UNIT_LABEL: Record<PriceUnit, string> = {
  SHIFT: "за смену",
  HOUR: "за час",
  PER_METER: "за п.м.",
};

/** "26000.00" → "26 000" (или "26 500,50"). null → null (цена не задана). */
export function formatMoney(value: string | null | undefined): string | null {
  if (!value) return null;

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return value;

  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: Number.isInteger(numeric) ? 0 : 2,
  }).format(numeric);
}

/** Для карточек: «от 26 000 ₽ за смену» либо «Цена по запросу». */
export function formatPriceFrom(value: string | null | undefined, unit: PriceUnit): string {
  const money = formatMoney(value);
  if (!money) return "Цена по запросу";

  return `от ${money} ₽ ${PRICE_UNIT_LABEL[unit]}`;
}

/** Для таблицы моделей: «26 000 ₽» либо «—». */
export function formatPrice(value: string | null | undefined): string {
  return formatMoney(value) ? `${formatMoney(value)} ₽` : "—";
}

/** Короткая единица для строки каталога: «/смена», «/час», «/п.м.». */
export const PRICE_UNIT_SHORT: Record<PriceUnit, string> = {
  SHIFT: "смена",
  HOUR: "час",
  PER_METER: "п.м.",
};

/** Для строки вида в каталоге: «от 13 500 ₽/смена» либо «по запросу» (CAT-01). */
export function formatPriceShort(value: string | null | undefined, unit: PriceUnit): string {
  const money = formatMoney(value);
  if (!money) return "по запросу";

  return `от ${money} ₽/${PRICE_UNIT_SHORT[unit]}`;
}

/**
 * Самая низкая цена среди видов раздела и её единица — для таблицы «раздел → цена от».
 * null, если ни у одного вида цена не заполнена или она не число.
 */
export function lowestPrice(
  items: Array<{ priceFrom: string | null; priceUnit: PriceUnit }>,
): { priceFrom: string; priceUnit: PriceUnit } | null {
  let best: { priceFrom: string; priceUnit: PriceUnit; amount: number } | null = null;

  for (const item of items) {
    if (!item.priceFrom) continue;

    const amount = Number(item.priceFrom);
    if (!Number.isFinite(amount)) continue;

    if (!best || amount < best.amount) {
      best = { priceFrom: item.priceFrom, priceUnit: item.priceUnit, amount };
    }
  }

  return best ? { priceFrom: best.priceFrom, priceUnit: best.priceUnit } : null;
}
