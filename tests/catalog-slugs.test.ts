import { describe, expect, it } from "vitest";
import { categorySlugRedirect, typeSlugRedirect } from "~~/server/utils/catalog-slugs";

describe("categorySlugRedirect", () => {
  it("старый адрес раздела ведёт на новый", () => {
    expect(categorySlugRedirect("zemleroynaya-tehnika", "zemlyanye-raboty")).toEqual({
      from: "/katalog/zemleroynaya-tehnika",
      to: "/katalog/zemlyanye-raboty",
    });
  });

  it("без смены кода редирект не нужен", () => {
    expect(categorySlugRedirect("same", "same")).toBeNull();
  });
});

describe("typeSlugRedirect", () => {
  it("строит адрес посадочной с городом", () => {
    expect(typeSlugRedirect("mini-ekskavatora", "mini-ekskavatory", "moskva")).toEqual({
      from: "/arenda-mini-ekskavatora-v-moskva",
      to: "/arenda-mini-ekskavatory-v-moskva",
    });
  });

  it("без активного города редирект не создаём", () => {
    expect(typeSlugRedirect("old", "new", null)).toBeNull();
  });

  it("не дублирует редирект, если код не менялся", () => {
    expect(typeSlugRedirect("same", "same", "moskva")).toBeNull();
  });
});
