import { describe, expect, it } from "vitest";
import type { HomeModelDto } from "~/types/catalog";
import { groupModelsByCategory } from "~/utils/models";

/** Intl разделяет разряды неразрывным пробелом — как в `price.ts`. */
const NBSP = "\u00A0";

/** Минимальная модель: тесты проверяют только поля, нужные полкам. */
function model(patch: Partial<HomeModelDto> & { id: string; categorySlug: string }): HomeModelDto {
  return {
    typeSlug: "avtokrana",
    typeName: "Автокраны",
    brand: "Ivanovets",
    model: "KS-45717",
    pricePerShift: "26000.00",
    pricePerHour: null,
    photo: null,
    specs: [],
    ...patch,
  };
}

const categories = [
  { slug: "zemlyanye-raboty", title: "Земляные работы" },
  { slug: "krany", title: "Краны" },
  { slug: "samosvaly", title: "Самосвалы" },
];

describe("groupModelsByCategory", () => {
  it("раскладывает технику по разделам в порядке каталога, а не моделей", () => {
    const groups = groupModelsByCategory(categories, [
      model({ id: "m1", categorySlug: "krany" }),
      model({ id: "m2", categorySlug: "zemlyanye-raboty" }),
      model({ id: "m3", categorySlug: "krany" }),
    ]);

    expect(groups.map((group) => group.category.slug)).toEqual(["zemlyanye-raboty", "krany"]);
    expect(groups.map((group) => group.models.map((item) => item.id))).toEqual([["m2"], ["m1", "m3"]]);
  });

  it("сохраняет порядок моделей внутри полки — его задаёт API", () => {
    const groups = groupModelsByCategory(categories, [
      model({ id: "b", categorySlug: "krany" }),
      model({ id: "a", categorySlug: "krany" }),
    ]);

    expect(groups[0]?.models.map((item) => item.id)).toEqual(["b", "a"]);
  });

  it("пропускает разделы без техники и нумерует полки подряд", () => {
    const groups = groupModelsByCategory(categories, [
      model({ id: "m1", categorySlug: "zemlyanye-raboty" }),
      model({ id: "m2", categorySlug: "samosvaly" }),
    ]);

    expect(groups.map((group) => group.category.slug)).toEqual(["zemlyanye-raboty", "samosvaly"]);
    expect(groups.map((group) => group.number)).toEqual(["01", "02"]);
  });

  it("не выводит технику раздела, которого нет в каталоге", () => {
    const groups = groupModelsByCategory(categories, [
      model({ id: "orphan", categorySlug: "arhiv" }),
      model({ id: "m1", categorySlug: "krany" }),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.models.map((item) => item.id)).toEqual(["m1"]);
  });

  it("склоняет счётчик моделей", () => {
    const labels = [
      groupModelsByCategory(categories, [model({ id: "1", categorySlug: "krany" })])[0]?.modelsLabel,
      groupModelsByCategory(categories, [
        model({ id: "1", categorySlug: "krany" }),
        model({ id: "2", categorySlug: "krany" }),
      ])[0]?.modelsLabel,
      groupModelsByCategory(
        categories,
        Array.from({ length: 5 }, (_, index) => model({ id: String(index), categorySlug: "krany" })),
      )[0]?.modelsLabel,
    ];

    expect(labels).toEqual(["1 модель", "2 модели", "5 моделей"]);
  });

  it("показывает диапазон цен смены по полке", () => {
    const groups = groupModelsByCategory(categories, [
      model({ id: "1", categorySlug: "krany", pricePerShift: "28000.00" }),
      model({ id: "2", categorySlug: "krany", pricePerShift: "13500.00" }),
      model({ id: "3", categorySlug: "krany", pricePerShift: "20000.00" }),
    ]);

    expect(groups[0]?.priceRange).toBe(`13${NBSP}500–28${NBSP}000 ₽/смена`);
  });

  it("при одной цене диапазона нет, при пустых ценах — «цена по запросу»", () => {
    const single = groupModelsByCategory(categories, [
      model({ id: "1", categorySlug: "krany", pricePerShift: "26000.00" }),
      model({ id: "2", categorySlug: "krany", pricePerShift: null }),
    ]);
    const empty = groupModelsByCategory(categories, [
      model({ id: "1", categorySlug: "krany", pricePerShift: null }),
    ]);

    expect(single[0]?.priceRange).toBe(`26${NBSP}000 ₽/смена`);
    expect(empty[0]?.priceRange).toBe("цена по запросу");
  });
});
