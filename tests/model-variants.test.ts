import { describe, expect, it } from "vitest";
import { HOME_MODEL_VARIANTS, modelVariant } from "~/utils/model-variants";

/**
 * Версии блока «Каталог моделей»: заказчик сравнивает их глазами, поэтому коды,
 * якоря и названия обязаны быть уникальными — иначе подпись уедет к чужой версии.
 */
describe("HOME_MODEL_VARIANTS", () => {
  it("четыре версии по порядку A, B, C, D", () => {
    expect(HOME_MODEL_VARIANTS.map((variant) => variant.key)).toEqual(["a", "b", "c", "d"]);
  });

  it("якоря уникальны и совпадают с шаблоном `modeli-variant-*`", () => {
    const ids = HOME_MODEL_VARIANTS.map((variant) => variant.id);

    expect(new Set(ids).size).toBe(ids.length);
    for (const variant of HOME_MODEL_VARIANTS) {
      expect(variant.id).toBe(`modeli-variant-${variant.key}`);
    }
  });

  it("названия уникальны и непустые", () => {
    const titles = HOME_MODEL_VARIANTS.map((variant) => variant.title);

    expect(new Set(titles).size).toBe(titles.length);
    for (const variant of HOME_MODEL_VARIANTS) {
      expect(variant.title.trim().length).toBeGreaterThan(0);
      expect(variant.note.trim().length).toBeGreaterThan(20);
    }
  });
});

describe("modelVariant", () => {
  it("находит версию по коду", () => {
    expect(modelVariant("c").title).toBe("Полка-паспорт");
    expect(modelVariant("a").id).toBe("modeli-variant-a");
  });

  it("неизвестный код — ошибка, а не пустая подпись", () => {
    expect(() => modelVariant("z" as "a")).toThrowError(/Неизвестная версия/);
  });
});
