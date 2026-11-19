import { describe, expect, it } from "vitest";
import { pluralRu } from "~/utils/plural";

const VIEW = ["вид", "вида", "видов"] as [string, string, string];

describe("pluralRu", () => {
  it("единственное число для 1 и чисел на 1", () => {
    expect(pluralRu(1, VIEW)).toBe("вид");
    expect(pluralRu(21, VIEW)).toBe("вид");
    expect(pluralRu(101, VIEW)).toBe("вид");
  });

  it("форма для 2–4 и чисел на 2–4", () => {
    expect(pluralRu(2, VIEW)).toBe("вида");
    expect(pluralRu(4, VIEW)).toBe("вида");
    expect(pluralRu(23, VIEW)).toBe("вида");
    expect(pluralRu(102, VIEW)).toBe("вида");
  });

  it("форма для 5–20 и чисел на 0, 5–9", () => {
    expect(pluralRu(0, VIEW)).toBe("видов");
    expect(pluralRu(5, VIEW)).toBe("видов");
    expect(pluralRu(9, VIEW)).toBe("видов");
    expect(pluralRu(25, VIEW)).toBe("видов");
    expect(pluralRu(100, VIEW)).toBe("видов");
  });

  it("11–14 всегда третья форма", () => {
    expect(pluralRu(11, VIEW)).toBe("видов");
    expect(pluralRu(12, VIEW)).toBe("видов");
    expect(pluralRu(14, VIEW)).toBe("видов");
    expect(pluralRu(111, VIEW)).toBe("видов");
    expect(pluralRu(114, VIEW)).toBe("видов");
  });

  it("отрицательные и дробные значения считаются по модулю и целой части", () => {
    expect(pluralRu(-3, VIEW)).toBe("вида");
    expect(pluralRu(3.9, VIEW)).toBe("вида");
  });
});
