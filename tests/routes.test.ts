import { describe, expect, it } from "vitest";
import { categoryPath, modelPath, servicePath, typePath } from "~/utils/routes";

describe("typePath", () => {
  it("собирает ЧПУ посадочной без завершающего слеша (ADR-6)", () => {
    expect(typePath("gusenichnogo-ekskavatora", "moskva")).toBe("/arenda-gusenichnogo-ekskavatora");
    expect(typePath("gusenichnogo-ekskavatora", "moskva")).not.toMatch(/\/$/);
  });

  it("не включает город в адрес", () => {
    expect(typePath("mini-ekskavatora", "sankt-peterburg")).toBe("/arenda-mini-ekskavatora");
  });
  it("вкладывает модель в вид", () => {
    expect(modelPath("gusenichnogo-ekskavatora", "cat-320")).toBe("/arenda-gusenichnogo-ekskavatora/cat-320");
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
