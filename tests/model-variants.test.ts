import { describe, expect, it } from "vitest";
import { HOME_MODEL_VARIANTS, modelVariant } from "~/utils/model-variants";

/**
 * Версии блока «Каталог моделей»: заказчик сравнивает их глазами, поэтому коды,
 * якоря и названия обязаны быть уникальными — иначе подпись уедет к чужой версии.
 */
describe("HOME_MODEL_VARIANTS", () => {
  it("десять версий по порядку H, J, I, F, G, E, A, B, C, D", () => {
    expect(HOME_MODEL_VARIANTS.map((variant) => variant.key)).toEqual(["h", "j", "i", "f", "g", "e", "a", "b", "c", "d"]);
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
    expect(modelVariant("e").title).toBe("Коммерческая витрина");
    expect(modelVariant("f").title).toBe("Парк крупным планом");
    expect(modelVariant("g").title).toBe("Редакционные полки");
    expect(modelVariant("h").id).toBe("modeli-variant-h");
    expect(modelVariant("i").id).toBe("modeli-variant-i");
    expect(modelVariant("j").id).toBe("modeli-variant-j");
  });

  it("неизвестный код — ошибка, а не пустая подпись", () => {
    expect(() => modelVariant("z" as "a")).toThrowError(/Неизвестная версия/);
  });
});
