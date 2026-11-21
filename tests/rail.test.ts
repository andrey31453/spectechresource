import { describe, expect, it } from "vitest";
import { railMetrics, railPage, railTargetPage } from "~/utils/rail";

/**
 * Лента карточек: страницы считаются целыми карточками, последняя прижимается
 * к правому краю. Числа взяты из живой вёрстки главной (1280 / 768 / 375).
 */
describe("railMetrics", () => {
  it("на 1280 в кадр влезают три карточки по 380 px", () => {
    const metrics = railMetrics({
      count: 7,
      cardWidth: 380,
      gap: 16,
      clientWidth: 1240,
      scrollWidth: 2756,
    });

    expect(metrics.step).toBe(396);
    expect(metrics.inView).toBe(3);
    expect(metrics.pageWidth).toBe(1188);
    expect(metrics.pages).toBe(3);
    expect(metrics.max).toBe(1516);
  });

  it("не влезающая четвёртая карточка не расширяет страницу", () => {
    // 300 + 16 = 316; (1240 + 16) / 316 = 3.97 — округление вверх дало бы 4.
    const metrics = railMetrics({
      count: 5,
      cardWidth: 300,
      gap: 16,
      clientWidth: 1240,
      scrollWidth: 1564,
    });

    expect(metrics.inView).toBe(3);
    expect(metrics.pageWidth).toBe(948);
  });

  it("на телефоне листает по одной карточке", () => {
    const metrics = railMetrics({
      count: 4,
      cardWidth: 307,
      gap: 16,
      clientWidth: 335,
      scrollWidth: 1276,
    });

    expect(metrics.inView).toBe(1);
    expect(metrics.pageWidth).toBe(323);
    expect(metrics.pages).toBe(4);
  });

  it("ровно влезающая карточка считается видимой", () => {
    const metrics = railMetrics({
      count: 2,
      cardWidth: 300,
      gap: 16,
      clientWidth: 632,
      scrollWidth: 632,
    });

    expect(metrics.inView).toBe(2);
    expect(metrics.pages).toBe(1);
    expect(metrics.max).toBe(0);
  });

  it("неразмеченная лента — одна страница без точек", () => {
    const metrics = railMetrics({
      count: 7,
      cardWidth: 0,
      gap: 0,
      clientWidth: 0,
      scrollWidth: 0,
    });

    expect(metrics.step).toBe(0);
    expect(metrics.inView).toBe(1);
    expect(metrics.pages).toBe(1);
  });

  it("пустая лента не делит на ноль", () => {
    const metrics = railMetrics({
      count: 0,
      cardWidth: 300,
      gap: 16,
      clientWidth: 1240,
      scrollWidth: 0,
    });

    expect(metrics.pages).toBe(1);
    expect(metrics.max).toBe(0);
  });
});

describe("railPage", () => {
  const metrics = railMetrics({
    count: 7,
    cardWidth: 380,
    gap: 16,
    clientWidth: 1240,
    scrollWidth: 2756,
  });

  it("начало ленты — первая страница", () => {
    expect(railPage(0, metrics)).toBe(0);
  });

  it("середина ленты — вторая страница", () => {
    expect(railPage(1188, metrics)).toBe(1);
  });

  it("упор в правый край — последняя страница, даже если шаг не совпал", () => {
    expect(railPage(1516, metrics)).toBe(2);
    expect(railPage(1514, metrics)).toBe(2);
  });

  it("прокрутка за пределы ленты не выходит за последнюю страницу", () => {
    expect(railPage(9999, metrics)).toBe(2);
  });

  it("отрицательная прокрутка (iOS-инерция) даёт первую страницу", () => {
    expect(railPage(-40, metrics)).toBe(0);
  });

  it("одностраничная лента всегда на нулевой странице", () => {
    const single = railMetrics({
      count: 2,
      cardWidth: 380,
      gap: 16,
      clientWidth: 1240,
      scrollWidth: 792,
    });

    expect(railPage(0, single)).toBe(0);
    expect(railPage(500, single)).toBe(0);
  });
});

describe("railTargetPage", () => {
  const metrics = railMetrics({
    count: 7,
    cardWidth: 380,
    gap: 16,
    clientWidth: 1240,
    scrollWidth: 2756,
  });

  it("шаг вперёд и назад", () => {
    expect(railTargetPage(0, 1, metrics)).toBe(1);
    expect(railTargetPage(2, -1, metrics)).toBe(1);
  });

  it("за краями ленты шаг не выходит за границы", () => {
    expect(railTargetPage(0, -1, metrics)).toBe(0);
    expect(railTargetPage(2, 1, metrics)).toBe(2);
  });
});
