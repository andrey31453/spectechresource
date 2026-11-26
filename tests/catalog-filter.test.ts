import { describe, expect, it } from "vitest";
import { filterCatalogModels } from "~/utils/catalog-filter";

const models = [
  { id: "a", typeSlug: "excavator", categorySlug: "earth" },
  { id: "b", typeSlug: "loader", categorySlug: "earth" },
  { id: "c", typeSlug: "excavator", categorySlug: "earth" },
];

describe("filterCatalogModels", () => {
  it("изначально и после сброса возвращает весь парк", () => {
    expect(filterCatalogModels(models, "")).toEqual(models);
  });
  it("фильтрует по виду, а не крупной группе, сохраняя порядок", () => {
    expect(filterCatalogModels(models, "excavator").map((model) => model.id)).toEqual(["a", "c"]);
    expect(filterCatalogModels(models, "loader").map((model) => model.id)).toEqual(["b"]);
    expect(models).toHaveLength(3);
  });
  it("возвращает пустой список для отсутствующего вида и пустого парка", () => {
    expect(filterCatalogModels(models, "earth")).toEqual([]);
    expect(filterCatalogModels([], "")).toEqual([]);
  });
});