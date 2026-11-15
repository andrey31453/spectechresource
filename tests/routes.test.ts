import { describe, expect, it } from "vitest";
import { categoryPath, servicePath, typePath } from "~/utils/routes";

describe("typePath", () => {
  it("собирает ЧПУ посадочной без завершающего слеша (ADR-6)", () => {
    expect(typePath("gusenichnogo-ekskavatora", "moskva")).toBe("/arenda-gusenichnogo-ekskavatora-v-moskva");
    expect(typePath("gusenichnogo-ekskavatora", "moskva")).not.toMatch(/\/$/);
  });

  it("подставляет город из City.slug", () => {
    expect(typePath("mini-ekskavatora", "sankt-peterburg")).toBe("/arenda-mini-ekskavatora-v-sankt-peterburg");
  });
});

describe("categoryPath", () => {
  it("ведёт в раздел каталога", () => {
    expect(categoryPath("zemleroynaya-tehnika")).toBe("/katalog/zemleroynaya-tehnika");
  });
});

describe("servicePath", () => {
  it("ведёт на страницу услуги", () => {
    expect(servicePath("zemlyanye-raboty")).toBe("/uslugi/zemlyanye-raboty");
  });
});
