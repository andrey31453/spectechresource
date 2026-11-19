import { describe, expect, it } from "vitest";
import {
  PRICE_UNIT_LABEL,
  PRICE_UNIT_SHORT,
  formatMoney,
  formatPrice,
  formatPriceFrom,
  formatPriceShort,
  lowestPrice,
} from "~/utils/price";

/** Intl в ru-RU разделяет разряды неразрывным пробелом (U+00A0), а не обычным. */
const NBSP = "\u00A0";

describe("formatMoney", () => {
  it("целые суммы выводит без копеек и с разделением разрядов", () => {
    expect(formatMoney("26000.00")).toBe(`26${NBSP}000`);
    expect(formatMoney("1234567.00")).toBe(`1${NBSP}234${NBSP}567`);
  });

  it("дробные суммы выводит с запятой и максимум двумя знаками", () => {
    expect(formatMoney("26500.50")).toBe(`26${NBSP}500,5`);
    expect(formatMoney("26500.55")).toBe(`26${NBSP}500,55`);
  });

  it("null, undefined и пустая строка означают «нет цены»", () => {
    expect(formatMoney(null)).toBeNull();
    expect(formatMoney(undefined)).toBeNull();
    expect(formatMoney("")).toBeNull();
  });

  it("нечисловую строку возвращает как есть, не ломая страницу", () => {
    expect(formatMoney("по запросу")).toBe("по запросу");
  });
});

describe("formatPriceFrom", () => {
  it("добавляет «от», валюту и единицу цены", () => {
    expect(formatPriceFrom("26000.00", "SHIFT")).toBe(`от 26${NBSP}000 ₽ за смену`);
    expect(formatPriceFrom("3500.00", "HOUR")).toBe(`от 3${NBSP}500 ₽ за час`);
    expect(formatPriceFrom("900.00", "PER_METER")).toBe(`от 900 ₽ за п.м.`);
  });

  it("без цены пишет «Цена по запросу»", () => {
    expect(formatPriceFrom(null, "SHIFT")).toBe("Цена по запросу");
  });
});

describe("formatPrice", () => {
  it("для таблицы моделей добавляет только валюту", () => {
    expect(formatPrice("26000.00")).toBe(`26${NBSP}000 ₽`);
  });

  it("без цены ставит прочерк", () => {
    expect(formatPrice(null)).toBe("—");
  });
});

describe("PRICE_UNIT_LABEL", () => {
  it("покрывает все единицы цены из схемы", () => {
    expect(PRICE_UNIT_LABEL).toEqual({
      SHIFT: "за смену",
      HOUR: "за час",
      PER_METER: "за п.м.",
    });
  });
});

describe("formatPriceShort", () => {
  it("для строки каталога пишет цену и короткую единицу", () => {
    expect(formatPriceShort("13500.00", "SHIFT")).toBe(`от 13${NBSP}500 ₽/смена`);
    expect(formatPriceShort("3500.00", "HOUR")).toBe(`от 3${NBSP}500 ₽/час`);
    expect(formatPriceShort("900.00", "PER_METER")).toBe(`от 900 ₽/п.м.`);
  });

  it("без цены пишет «по запросу»", () => {
    expect(formatPriceShort(null, "SHIFT")).toBe("по запросу");
    expect(formatPriceShort("", "HOUR")).toBe("по запросу");
  });
});

describe("lowestPrice", () => {
  it("выбирает минимальную цену и её единицу", () => {
    expect(
      lowestPrice([
        { priceFrom: "26000.00", priceUnit: "SHIFT" },
        { priceFrom: "13500.00", priceUnit: "SHIFT" },
        { priceFrom: null, priceUnit: "HOUR" },
      ]),
    ).toEqual({ priceFrom: "13500.00", priceUnit: "SHIFT" });
  });

  it("сравнивает деньги как числа, а не как строки", () => {
    expect(
      lowestPrice([
        { priceFrom: "9000.00", priceUnit: "SHIFT" },
        { priceFrom: "10000.00", priceUnit: "HOUR" },
      ]),
    ).toEqual({ priceFrom: "9000.00", priceUnit: "SHIFT" });
  });

  it("без цен и с нечисловыми значениями возвращает null", () => {
    expect(lowestPrice([])).toBeNull();
    expect(lowestPrice([{ priceFrom: null, priceUnit: "SHIFT" }])).toBeNull();
    expect(lowestPrice([{ priceFrom: "по запросу", priceUnit: "SHIFT" }])).toBeNull();
  });
});

describe("PRICE_UNIT_SHORT", () => {
  it("покрывает все единицы цены из схемы", () => {
    expect(PRICE_UNIT_SHORT).toEqual({
      SHIFT: "смена",
      HOUR: "час",
      PER_METER: "п.м.",
    });
  });
});
