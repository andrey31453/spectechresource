import { describe, expect, it } from "vitest";
import type { AdminCategoryDto, AdminModelDto, AdminTypeDto } from "~/types/admin-catalog";
import {
  categoryFormBody,
  categoryFormFrom,
  emptyCategoryForm,
  emptyModelForm,
  emptyTypeForm,
  modelFormBody,
  modelFormFrom,
  typeFormBody,
  typeFormFrom,
} from "~/utils/admin-catalog-forms";

const categoryDto: AdminCategoryDto = {
  id: "cat-1",
  slug: "zemleroynaya-tehnika",
  title: "Землеройная техника",
  h1: null,
  shortDesc: "Экскаваторы и планировщики",
  image: null,
  seoTitle: null,
  seoDescription: null,
  seoText: null,
  sortOrder: 10,
  isPublished: true,
  typesCount: 9,
  updatedAt: "2026-11-15T10:00:00.000Z",
};

const modelDto: AdminModelDto = {
  id: "model-1",
  brand: "JCB",
  model: "3CX",
  shortDesc: "Работы на ограниченной площадке",
  pricePerShift: "26000.00",
  pricePerHour: null,
  photos: ["/uploads/jcb-1.jpg", "/uploads/jcb-2.jpg"],
  isAvailable: false,
  sortOrder: 20,
  specs: [
    { name: "Масса, т", value: "7,2" },
    { name: "Ковш, м³", value: "1,0" },
  ],
};

const typeDto: AdminTypeDto = {
  id: "type-1",
  categoryId: "cat-1",
  slug: "gusenichnogo-ekskavatora",
  name: "Гусеничные экскаваторы",
  nameGenitive: "гусеничного экскаватора",
  priceFrom: "26000.00",
  priceUnit: "HOUR",
  sortOrder: 10,
  isPublished: true,
  minOrder: "минимум 4 часа",
  deliveryTerms: null,
  deliveryPrice: "5000.00",
  crewAvailable: true,
  withoutCrewAvailable: false,
  worksPerformed: null,
  gallery: ["/uploads/type-1.jpg", "/uploads/type-2.jpg"],
  seoTitle: null,
  seoDescription: null,
  seoText: null,
  category: { id: "cat-1", slug: "zemleroynaya-tehnika", title: "Землеройная техника" },
  models: [modelDto],
  related: [],
  updatedAt: "2026-11-15T10:00:00.000Z",
};

describe("формы раздела", () => {
  it("null-поля DTO превращаются в пустые строки", () => {
    const form = categoryFormFrom(categoryDto);

    expect(form.h1).toBe("");
    expect(form.seoText).toBe("");
    expect(form.sortOrder).toBe(10);
  });

  it("пустые необязательные поля уходят как null, строки обрезаются", () => {
    const body = categoryFormBody({
      ...emptyCategoryForm(),
      slug: "  novyy-razdel ",
      title: "  Новый раздел ",
      h1: "   ",
    });

    expect(body).toMatchObject({ slug: "novyy-razdel", title: "Новый раздел", h1: null, sortOrder: 10 });
  });
});

describe("формы вида техники", () => {
  it("цена и галерея читаются из DTO без хвостовых нулей", () => {
    const form = typeFormFrom(typeDto);

    expect(form.priceFrom).toBe("26000");
    expect(form.deliveryPrice).toBe("5000");
    expect(form.gallery).toEqual(["/uploads/type-1.jpg", "/uploads/type-2.jpg"]);
  });

  it("обратное преобразование собирает массив фото и сохраняет числа", () => {
    const body = typeFormBody(typeFormFrom(typeDto));

    expect(body).toMatchObject({
      categoryId: "cat-1",
      priceFrom: "26000",
      priceUnit: "HOUR",
      deliveryPrice: "5000",
      gallery: ["/uploads/type-1.jpg", "/uploads/type-2.jpg"],
      worksPerformed: null,
    });
  });

  it("пустые строки в тексте и фото не создают пустых значений", () => {
    const body = typeFormBody({ ...emptyTypeForm("cat-1"), priceFrom: "   ", gallery: [" ", ""] });

    expect(body.priceFrom).toBeNull();
    expect(body.gallery).toEqual([]);
    expect(body.minOrder).toBeNull();
  });
});

describe("формы модели", () => {
  it("читает, обрезает и очищает краткое описание", () => {
    expect(modelFormFrom(modelDto).shortDesc).toBe(modelDto.shortDesc);
    expect(modelFormFrom({ ...modelDto, shortDesc: null }).shortDesc).toBe("");
    expect(modelFormBody({ ...emptyModelForm(), shortDesc: "  Для погрузки  " }).shortDesc).toBe("Для погрузки");
    expect(modelFormBody({ ...emptyModelForm(), shortDesc: "  " }).shortDesc).toBeNull();
  });

  it("характеристики без названия и значения отбрасываются", () => {
    const body = modelFormBody({
      ...emptyModelForm(),
      brand: " JCB ",
      model: " 3CX ",
      specs: [
        { name: " Масса, т ", value: " 7,2 " },
        { name: "", value: "" },
      ],
    });

    expect(body.brand).toBe("JCB");
    expect(body.model).toBe("3CX");
    expect(body.specs).toEqual([{ name: "Масса, т", value: "7,2" }]);
  });

  it("фотографии обрезаются и пустые адреса отбрасываются", () => {
    const body = modelFormBody({ ...emptyModelForm(), photos: ["/a.jpg", "", "  /b.jpg  "] });

    expect(body.photos).toEqual(["/a.jpg", "/b.jpg"]);
  });

  it("модель без характеристик получает одну пустую строку для ввода", () => {
    const form = modelFormFrom({ ...modelDto, specs: [] });

    expect(form.specs).toEqual([{ name: "", value: "" }]);
    expect(form.pricePerShift).toBe("26000");
  });
});
