import { describe, expect, it } from "vitest";
import { homeTypeSections } from "~/utils/home-type-cards";
import type { CategoryCardDto, HomeModelDto } from "~/types/catalog";

const category: CategoryCardDto = {
  slug: "earth", title: "Земляные работы", shortDesc: "Работы", colorTheme: "BLACK",
  types: [{ slug: "excavator", name: "Экскаваторы", nameGenitive: "экскаватора", image: null, priceFrom: null, priceUnit: "SHIFT", description: "**Копка**\n\n[котлованов](/work)" }],
};
const model = (patch: Partial<HomeModelDto> = {}): HomeModelDto => ({
  id: "1", slug: "one", categorySlug: "earth", typeSlug: "excavator", typeName: "Экскаваторы", brand: "JCB", model: "130",
  shortDesc: null, pricePerShift: "10000", pricePerHour: "1500", photo: "/uploads/one.webp", photos: [], specs: [], ...patch,
});

describe("homepage type cards", () => {
  it("counts models only within the category/type and finds a cover and minimum shift price", () => {
    const original = JSON.stringify(category);
    const cards = homeTypeSections([category], [model(), model({ id: "2", pricePerShift: "9000" }), model({ categorySlug: "other" }), model({ typeSlug: "other" })])[0]!.cards;
    expect(cards).toHaveLength(1);
    expect(cards[0]).toMatchObject({ modelsCount: 2, image: "/uploads/one.webp", priceFrom: "9000", description: "Копка котлованов" });
    expect(JSON.stringify(category)).toBe(original);
  });
  it("preserves empty types and missing prices without inventing content", () => {
    expect(homeTypeSections([category], [])[0]!.cards[0]).toMatchObject({ modelsCount: 0, image: null, priceFrom: null });
    expect(homeTypeSections([], [])).toEqual([]);
  });
  it("prioritizes the type price and gallery over model data", () => {
    const type = { ...category.types[0]!, priceFrom: "5000", image: "/type.webp" };
    expect(homeTypeSections([{ ...category, types: [type] }], [model()])[0]!.cards[0]).toMatchObject({ priceFrom: "5000", image: "/type.webp" });
  });
  it("uses the matching price unit and never substitutes a shift price for per-meter pricing", () => {
    const withUnit = (priceUnit: "HOUR" | "PER_METER") => homeTypeSections([{ ...category, types: [{ ...category.types[0]!, priceUnit }] }], [model()])[0]!.cards[0];
    expect(withUnit("HOUR")?.priceFrom).toBe("1500");
    expect(withUnit("PER_METER")?.priceFrom).toBeNull();
  });
});