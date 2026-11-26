import { describe, expect, it } from "vitest";
import type { Decimalish } from "~~/server/utils/dto";
import {
  toAdminCategory,
  toAdminModel,
  toAdminType,
  toAdminTypeListItem,
} from "~~/server/utils/catalog-admin";

const decimal = (value: string): Decimalish => ({ toFixed: () => value });
const updatedAt = new Date("2026-11-15T10:00:00.000Z");

describe("toAdminCategory", () => {
  it("отдаёт счётчик видов и дату в ISO, без createdAt", () => {
    const dto = toAdminCategory({
      id: "cat-1",
      slug: "zemleroynaya-tehnika",
      title: "Землеройная техника",
      h1: "Аренда землеройной техники",
      shortDesc: null,
      image: null,
      seoTitle: null,
      seoDescription: null,
      seoText: null,
      sortOrder: 10,
      isPublished: true,
      updatedAt,
      _count: { types: 9 },
    });

    expect(dto).toMatchObject({
      id: "cat-1",
      typesCount: 9,
      sortOrder: 10,
      isPublished: true,
      updatedAt: "2026-11-15T10:00:00.000Z",
    });
    expect("createdAt" in dto).toBe(false);
  });
});

describe("toAdminTypeListItem", () => {
  it("цену отдаёт строкой, а число моделей — из _count", () => {
    const dto = toAdminTypeListItem({
      id: "type-1",
      categoryId: "cat-1",
      slug: "gusenichnogo-ekskavatora",
      name: "Гусеничные экскаваторы",
      nameGenitive: "гусеничного экскаватора",
      priceFrom: decimal("26000.00"),
      priceUnit: "SHIFT",
      sortOrder: 10,
      isPublished: false,
      _count: { models: 3 },
    });

    expect(dto).toMatchObject({ priceFrom: "26000.00", modelsCount: 3, isPublished: false });
  });

  it("без цены — null, а не 0", () => {
    const dto = toAdminTypeListItem({
      id: "type-2",
      categoryId: "cat-1",
      slug: "katka",
      name: "Катки",
      nameGenitive: "катка",
      priceFrom: null,
      priceUnit: "HOUR",
      sortOrder: 20,
      isPublished: true,
      _count: { models: 0 },
    });

    expect(dto.priceFrom).toBeNull();
  });
});

describe("toAdminModel", () => {
  it("характеристики отдаёт парами имя → значение в исходном порядке", () => {
    const dto = toAdminModel({
      id: "model-1",
      typeId: "type-1",
      type: { id: "type-1", name: "Экскаваторы", slug: "ekskavatory", category: { id: "cat-1", title: "Землеройная техника" } },
      slug: "test-model",
      brand: "JCB",
      model: "3CX",
      shortDesc: "Для погрузки и земляных работ",
      pricePerShift: decimal("26000.00"),
      pricePerHour: null,
      photos: ["/uploads/jcb-3cx.jpg"],
      isPublished: true,
      sortOrder: 10,
      specs: [
        { name: "Масса, т", value: "7,2" },
        { name: "Ковш, м³", value: "1,0" },
      ],
    });

    expect(dto.pricePerShift).toBe("26000.00");
    expect(dto.shortDesc).toBe("Для погрузки и земляных работ");
    expect(dto.pricePerHour).toBeNull();
    expect(dto.specs).toEqual([
      { name: "Масса, т", value: "7,2" },
      { name: "Ковш, м³", value: "1,0" },
    ]);
  });
});

describe("toAdminType", () => {
  it("собирает карточку с категорией, моделями и похожей техникой", () => {
    const dto = toAdminType({
      id: "type-1",
      categoryId: "cat-1",
      slug: "gusenichnogo-ekskavatora",
      name: "Гусеничные экскаваторы",
      nameGenitive: "гусеничного экскаватора",
      priceFrom: decimal("26000.00"),
      priceUnit: "SHIFT",
      minOrder: "минимум 4 часа",
      deliveryTerms: null,
      deliveryPrice: decimal("5000.00"),
      crewAvailable: true,
      withoutCrewAvailable: false,
      descriptionTop: "Описание перед моделями",
      worksPerformed: null,
      gallery: [],
      seoTitle: null,
      seoDescription: null,
      seoText: null,
      sortOrder: 10,
      isPublished: true,
      updatedAt,
      category: { id: "cat-1", slug: "zemleroynaya-tehnika", title: "Землеройная техника" },
      models: [
        {
          id: "model-1",
          typeId: "type-1",
          type: { id: "type-1", name: "Экскаваторы", slug: "ekskavatory", category: { id: "cat-1", title: "Землеройная техника" } },
          slug: "test-model",
          brand: "JCB",
          model: "3CX",
          shortDesc: null,
          pricePerShift: null,
          pricePerHour: null,
          photos: [],
          isPublished: true,
          sortOrder: 10,
          specs: [{ name: "Масса, т", value: "7,2" }],
        },
      ],
      relatedFrom: [{ target: { id: "type-2", slug: "mini-ekskavatora", name: "Мини-экскаваторы" } }],
    });

    expect(dto.category.slug).toBe("zemleroynaya-tehnika");
    expect(dto.descriptionTop).toBe("Описание перед моделями");
    expect(dto.models[0]?.specs).toEqual([{ name: "Масса, т", value: "7,2" }]);
    expect(dto.related).toEqual([{ id: "type-2", slug: "mini-ekskavatora", name: "Мини-экскаваторы" }]);
    expect(dto.deliveryPrice).toBe("5000.00");
    expect(dto.updatedAt).toBe("2026-11-15T10:00:00.000Z");
  });
});
