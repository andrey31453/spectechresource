import * as v from "valibot";
import { describe, expect, it } from "vitest";
import {
  CategoryCreateSchema,
  CategoryUpdateSchema,
  ModelCreateSchema,
  ModelUpdateSchema,
  RelatedUpdateSchema,
  TypeCreateSchema,
  TypeUpdateSchema,
  isValidSlug,
  normalizeMoneyInput,
  toCatalogFieldErrors,
} from "#shared/schemas/catalog";

/** Ошибки валидации в формате API — так их читают формы. */
function errors(schema: v.GenericSchema, input: unknown) {
  const parsed = v.safeParse(schema, input);
  return parsed.success ? [] : toCatalogFieldErrors(parsed.issues);
}

describe("isValidSlug", () => {
  it("принимает латиницу, цифры и дефисы между словами", () => {
    expect(isValidSlug("mini-ekskavatora")).toBe(true);
    expect(isValidSlug("katki-2")).toBe(true);
  });

  it("отклоняет кириллицу, пробелы, подчёркивания и дефисы по краям", () => {
    expect(isValidSlug("мини-экскаватор")).toBe(false);
    expect(isValidSlug("mini ekskavator")).toBe(false);
    expect(isValidSlug("mini_ekskavator")).toBe(false);
    expect(isValidSlug("-mini")).toBe(false);
    expect(isValidSlug("mini-")).toBe(false);
    expect(isValidSlug("a")).toBe(false);
  });
});

describe("normalizeMoneyInput", () => {
  it("приводит цену к строке с двумя знаками", () => {
    expect(normalizeMoneyInput("26 000")).toBe("26000.00");
    expect(normalizeMoneyInput("26 000,5")).toBe("26000.50");
    expect(normalizeMoneyInput("1234.567")).toBe("1234.567");
    expect(normalizeMoneyInput(13500)).toBe("13500.00");
  });

  it("пустое значение — «цена по запросу»", () => {
    expect(normalizeMoneyInput("")).toBeNull();
    expect(normalizeMoneyInput("   ")).toBeNull();
    expect(normalizeMoneyInput(null)).toBeNull();
    expect(normalizeMoneyInput(undefined)).toBeNull();
  });
});

describe("CategoryCreateSchema", () => {
  it("подставляет порядок и публикацию, обрезает пробелы и приводит код к нижнему регистру", () => {
    const parsed = v.safeParse(CategoryCreateSchema, { slug: " Mini-Test ", title: "  Тестовый раздел  " });

    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.output).toMatchObject({
      slug: "mini-test",
      title: "Тестовый раздел",
      h1: null,
      sortOrder: 10,
      isPublished: true,
    });
  });

  it("пустые необязательные поля превращает в null", () => {
    const parsed = v.safeParse(CategoryCreateSchema, {
      slug: "mini-test",
      title: "Раздел",
      h1: "   ",
      seoText: "",
    });

    expect(parsed.success && parsed.output.h1).toBeNull();
    expect(parsed.success && parsed.output.seoText).toBeNull();
  });

  it("возвращает ошибки по полям с русскими текстами", () => {
    const list = errors(CategoryCreateSchema, { slug: "Плохой код", title: "x" });

    expect(list.map((item) => item.field).sort()).toEqual(["slug", "title"]);
    expect(list.every((item) => item.message.length > 0)).toBe(true);
  });
});

describe("CategoryUpdateSchema", () => {
  it("не подставляет значения для отсутствующих полей", () => {
    const parsed = v.safeParse(CategoryUpdateSchema, {});

    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.output).toEqual({});
  });

  it("пропускает только переданные поля", () => {
    const parsed = v.safeParse(CategoryUpdateSchema, { title: "Новое название" });

    expect(parsed.success && parsed.output).toEqual({ title: "Новое название" });
  });

  it("явный null остаётся null — поле можно очистить", () => {
    const parsed = v.safeParse(CategoryUpdateSchema, { h1: null });

    expect(parsed.success && parsed.output).toEqual({ h1: null });
  });

describe("TypeCreateSchema", () => {
  const base = {
    categoryId: "cat-1",
    slug: "gusenichnogo-ekskavatora",
    name: "Гусеничные экскаваторы",
    nameGenitive: "гусеничного экскаватора",
  };

  it("по умолчанию цена за смену, экипаж есть, без экипажа нет", () => {
    const parsed = v.safeParse(TypeCreateSchema, base);

    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.output).toMatchObject({
      priceFrom: null,
      priceUnit: "SHIFT",
      crewAvailable: true,
      withoutCrewAvailable: false,
      gallery: [],
      sortOrder: 10,
      isPublished: true,
    });
  });

  it("нормализует цену и фотографии из строк", () => {
    const parsed = v.safeParse(TypeCreateSchema, { ...base, priceFrom: "26 000,5", gallery: [" /a.jpg "] });

    expect(parsed.success && parsed.output.priceFrom).toBe("26000.50");
    expect(parsed.success && parsed.output.gallery).toEqual(["/a.jpg"]);
  });

  it("отклоняет неизвестную единицу цены и слишком много фото", () => {
    const list = errors(TypeCreateSchema, {
      ...base,
      priceUnit: "TON",
      gallery: Array.from({ length: 21 }, (_, index) => `/photo-${index}.jpg`),
    });

    expect(list.map((item) => item.field).sort()).toEqual(["gallery", "priceUnit"]);
  });

  it("требует родительный падеж — без него не собрать H1", () => {
    const list = errors(TypeCreateSchema, { ...base, nameGenitive: "" });

    expect(list[0]?.field).toBe("nameGenitive");
  });
});

describe("TypeUpdateSchema", () => {
  it("на пустом объекте не добавляет ни одного поля", () => {
    const parsed = v.safeParse(TypeUpdateSchema, {});

    expect(parsed.success && parsed.output).toEqual({});
  });

  it("не подставляет значения по умолчанию при частичном обновлении", () => {
    const parsed = v.safeParse(TypeUpdateSchema, { priceFrom: "15000" });

    expect(parsed.success && parsed.output).toEqual({ priceFrom: "15000.00" });
  });
});

describe("ModelCreateSchema", () => {
  it("по умолчанию доступна, порядок 10, характеристик нет", () => {
    const parsed = v.safeParse(ModelCreateSchema, { brand: " JCB ", model: " 3CX " });

    expect(parsed.success && parsed.output).toMatchObject({
      brand: "JCB",
      model: "3CX",
      isAvailable: true,
      sortOrder: 10,
      specs: [],
      photos: [],
    });
  });

  it("проверяет строки характеристик и лимит", () => {
    const list = errors(ModelCreateSchema, {
      brand: "JCB",
      model: "3CX",
      specs: [{ name: "", value: "7,2" }],
    });

    expect(list.map((item) => item.field)).toContain("specs.0.name");
  });

  it("ограничивает число характеристик сорока", () => {
    const specs = Array.from({ length: 41 }, (_, index) => ({ name: `Параметр ${index}`, value: "1" }));
    const list = errors(ModelCreateSchema, { brand: "JCB", model: "3CX", specs });

    expect(list.map((item) => item.field)).toContain("specs");
  });
});

describe("ModelUpdateSchema", () => {
  it("не трогает характеристики, если поле не передано", () => {
    const parsed = v.safeParse(ModelUpdateSchema, { pricePerHour: "2 500" });

    expect(parsed.success && parsed.output).toEqual({ pricePerHour: "2500.00" });
    expect(parsed.success && "specs" in parsed.output).toBe(false);
  });

  it("пустой список характеристик — это «удалить все»", () => {
    const parsed = v.safeParse(ModelUpdateSchema, { specs: [] });

    expect(parsed.success && parsed.output).toEqual({ specs: [] });
  });
});

describe("RelatedUpdateSchema", () => {
  it("сохраняет порядок и разрешает пустой список", () => {
    const parsed = v.safeParse(RelatedUpdateSchema, { relatedIds: ["b", "a"] });

    expect(parsed.success && parsed.output.relatedIds).toEqual(["b", "a"]);
    expect(v.safeParse(RelatedUpdateSchema, { relatedIds: [] }).success).toBe(true);
  });

  it("не пропускает повторы, пустые id и больше 30 связей", () => {
    expect(errors(RelatedUpdateSchema, { relatedIds: ["a", "a"] })[0]?.message).toContain("повторяться");
    expect(errors(RelatedUpdateSchema, { relatedIds: ["a", " "] })[0]?.field).toBe("relatedIds.1");

    const many = Array.from({ length: 31 }, (_, index) => `id-${index}`);
    expect(errors(RelatedUpdateSchema, { relatedIds: many }).map((item) => item.field)).toContain("relatedIds");
  });
});

describe("toCatalogFieldErrors", () => {
  it("склеивает путь до поля вложенного объекта", () => {
    const list = errors(ModelCreateSchema, {
      brand: "JCB",
      model: "3CX",
      specs: [{ name: "Масса", value: "" }],
    });

    expect(list).toContainEqual({
      field: "specs.0.value",
      message: "Характеристика: значение не может быть пустым",
    });
  });
});

});
