import { describe, expect, it } from "vitest";
import type { CategoryCardDto, HomeModelDto } from "~/types/catalog";
import { categoryModelSections } from "~/utils/model-groups";
import { modelPage, showcaseShelf } from "~/utils/model-showcase";

const model = (id: string, categorySlug = "earth", typeSlug = "excavator"): HomeModelDto => ({
  id, categorySlug, typeSlug, typeName: typeSlug, slug: id, brand: "Brand", model: id,
  shortDesc: null, pricePerShift: "10000", pricePerHour: null, photo: null, photos: [], specs: [],
});
const category = (slug = "earth"): CategoryCardDto => ({
  slug, title: slug, description: "Описание из админки", shortDesc: "Короткое",
  colorTheme: "ORANGE", types: ["excavator", "pile"].map(slug => ({
    slug, name: slug, nameGenitive: slug, priceFrom: null, priceUnit: "SHIFT", image: null,
  })),
});

describe("categoryModelSections", () => {
  it("читает название, описание и тему непосредственно из категории", () => {
    const section = categoryModelSections([category()], [model("one")])[0]!;
    expect(section).toMatchObject({ slug: "earth", title: "earth", lead: "Описание из админки", colorTheme: "ORANGE", numberLabel: "01 / 01" });
    expect(section.shelves.map(item => item.category.slug)).toEqual(["excavator"]);
  });
  it("сохраняет порядок категорий и пропускает пустые", () => {
    const result = categoryModelSections([category("second"), category("empty"), category()], [model("one"), model("two", "second")]);
    expect(result.map(item => item.slug)).toEqual(["second", "earth"]);
    expect(result.map(item => item.numberLabel)).toEqual(["01 / 02", "02 / 02"]);
  });
  it("фильтрует по видам без старых категорий и не теряет модели", () => {
    const section = categoryModelSections([category()], [model("one"), model("two", "earth", "pile"), model("three")])[0]!;
    expect(showcaseShelf(section).models.map(item => item.id)).toEqual(["one", "two", "three"]);
    expect(showcaseShelf(section, "pile").models.map(item => item.id)).toEqual(["two"]);
    expect(showcaseShelf(section, "missing").models).toEqual([]);
    expect(section.modelsLabel).toBe("3 модели");
  });
  it("поддерживает новые категории без правок конфигурации и пустой каталог", () => {
    expect(categoryModelSections([category("new")], [model("one", "new")])[0]?.slug).toBe("new");
    expect(categoryModelSections([], [])).toEqual([]);
  });
  it("использует короткое описание и светлую тему по умолчанию", () => {
    expect(categoryModelSections([{ ...category(), description: null, colorTheme: undefined }], [model("one")])[0]).toMatchObject({ lead: "Короткое", colorTheme: "WHITE" });
  });
});
describe("modelPage", () => {
  it("ограничивает страницы и поддерживает пустой список", () => {
    expect(modelPage([1, 2, 3], 9, 2)).toEqual({ count: 2, index: 1, models: [3] });
    expect(modelPage([], -1, 0)).toEqual({ count: 0, index: 0, models: [] });
  });
});