import { describe, expect, it } from "vitest";
import type { HomeModelDto, ServiceEquipmentDto } from "~/types/catalog";
import { serviceShowcaseSelection } from "~/utils/service-showcase";

const model = (id: string, typeSlug: string): HomeModelDto => ({
  id, typeSlug, slug: id, categorySlug: "earth", typeName: typeSlug,
  brand: "Brand", model: id, shortDesc: null, pricePerShift: null,
  pricePerHour: null, photo: null, photos: [], specs: [],
});
const equipment: ServiceEquipmentDto = {
  types: [{ slug: "a", name: "A" }, { slug: "b", name: "B" }, { slug: "empty", name: "Empty" }],
  models: [model("a1", "a"), model("a2", "a"), model("b1", "b")],
};

describe("service showcase selection", () => {
  it("выбирает первый вид и модель для SSR", () => {
    const current = serviceShowcaseSelection(equipment, "", "");
    expect(current.type?.slug).toBe("a");
    expect(current.model?.id).toBe("a1");
    expect(current.models).toHaveLength(2);
  });
  it("показывает выбранную модель и не допускает модель чужого вида", () => {
    expect(serviceShowcaseSelection(equipment, "a", "a2").model?.id).toBe("a2");
    expect(serviceShowcaseSelection(equipment, "b", "a2").model?.id).toBe("b1");
  });
  it("обрабатывает пустой вид и удалённые данные", () => {
    expect(serviceShowcaseSelection(equipment, "empty", "a1").model).toBeUndefined();
    expect(serviceShowcaseSelection(equipment, "removed", "removed").model?.id).toBe("a1");
    expect(serviceShowcaseSelection({ types: [], models: [] }, "", "")).toEqual({ type: undefined, model: undefined, models: [] });
  });
});