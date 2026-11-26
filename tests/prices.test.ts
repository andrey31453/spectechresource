import { describe, expect, it } from "vitest";
import { groupModelsByType } from "~/utils/prices";

const model = (typeSlug: string, typeName: string, id: string) => ({
  id,
  slug: id,
  categorySlug: "supergroup",
  typeSlug,
  typeName,
  brand: "JCB",
  model: id,
  shortDesc: null,
  pricePerShift: null,
  pricePerHour: null,
  photo: null,
  photos: [],
  specs: [],
});

describe("groupModelsByType", () => {
  it("groups by equipment type and keeps source order", () => {
    const result = groupModelsByType([
      model("excavator", "Экскаваторы", "3CX"),
      model("crane", "Автокраны", "KS"),
      model("excavator", "Экскаваторы", "320"),
    ]);

    expect(result.map(group => group.slug)).toEqual(["excavator", "crane"]);
    expect(result[0]?.models.map(item => item.id)).toEqual(["3CX", "320"]);
    expect(result).not.toHaveLength(1);
  });
});