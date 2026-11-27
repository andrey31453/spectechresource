import { describe, expect, it, vi } from "vitest";
import { serviceEquipmentRelation, validateServiceEquipment } from "~~/server/utils/service-equipment";
import { toAdminService } from "~~/server/utils/services-admin";

vi.stubGlobal("createError", (input: object) => Object.assign(new Error("validation"), input));

describe("service equipment writes", () => {
  it("PATCH различает отсутствие поля, очистку и замену связей", () => {
    expect(serviceEquipmentRelation(undefined)).toBeUndefined();
    expect(serviceEquipmentRelation([])).toEqual({ set: [] });
    expect(serviceEquipmentRelation(["a", "b"])).toEqual({ set: [{ id: "a" }, { id: "b" }] });
  });
  it("проверяет существование всех видов до записи", async () => {
    const count = vi.fn().mockResolvedValue(2);
    const prisma = { equipmentType: { count } } as unknown as Parameters<typeof validateServiceEquipment>[0];
    await validateServiceEquipment(prisma, undefined);
    await validateServiceEquipment(prisma, []);
    expect(count).not.toHaveBeenCalled();
    await validateServiceEquipment(prisma, ["a", "b"]);
    expect(count).toHaveBeenCalledWith({ where: { id: { in: ["a", "b"] } } });
    count.mockResolvedValue(1);
    await expect(validateServiceEquipment(prisma, ["a", "missing"])).rejects.toMatchObject({ statusCode: 400, data: { errors: [{ field: "equipmentTypeIds", message: expect.any(String) }] } });
  });
  it("DTO возвращает тексты и привязки", () => {
    const dto = toAdminService({ id: "s", slug: "s", title: "S", description: null,
      descriptionTop: "Top", descriptionBottom: "Bottom", image: null,
      seoTitle: null, seoDescription: null, seoText: "Legacy", sortOrder: 0,
      isPublished: true, updatedAt: new Date("2026-11-27T00:00:00Z"),
      equipmentTypes: [{ id: "a" }], _count: { faq: 2 } });
    expect(dto).toMatchObject({ equipmentTypeIds: ["a"], descriptionTop: "Top", descriptionBottom: "Bottom", seoText: "Legacy", faqCount: 2 });
  });
});