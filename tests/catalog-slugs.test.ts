import { describe, expect, it } from "vitest";
import { categorySlugRedirect } from "~~/server/utils/catalog-slugs";

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
