import * as v from "valibot";
import { describe, expect, it } from "vitest";
import {
  ServiceCreateSchema,
  ServiceUpdateSchema,
  toAdminServiceFieldErrors,
} from "#shared/schemas/admin-services";

/** Ошибки валидации в формате API — так их читает форма. */
function errors(schema: v.GenericSchema, input: unknown) {
  const parsed = v.safeParse(schema, input);
  return parsed.success ? [] : toAdminServiceFieldErrors(parsed.issues);
}

function fields(schema: v.GenericSchema, input: unknown) {
  return errors(schema, input).map((error) => error.field);
}

const validService = {
  slug: "vyvoz-grunta",
  title: "Вывоз грунта",
  description: "Самосвалы от 10 до 20 м³, работаем по Москве и области.",
  image: null,
  seoTitle: null,
  seoDescription: null,
  seoText: "## Когда нужен вывоз грунта\n\nТекст.",
  sortOrder: 20,
  isPublished: true,
};

describe("схема услуги", () => {
  it("принимает корректную услугу и нормализует код и заголовок", () => {
    const parsed = v.safeParse(ServiceCreateSchema, {
      ...validService,
      slug: "  Vyvoz-Grunta  ",
      title: "  Вывоз грунта  ",
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.output.slug).toBe("vyvoz-grunta");
    expect(parsed.output.title).toBe("Вывоз грунта");
  });

  it("подставляет порядок и публикацию по умолчанию", () => {
    const parsed = v.safeParse(ServiceCreateSchema, { slug: "demontazh", title: "Демонтаж" });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.output.sortOrder).toBe(10);
    expect(parsed.output.isPublished).toBe(true);
    expect(parsed.output.description).toBeNull();
  });

  it("требует название и корректный код адреса", () => {
    expect(fields(ServiceCreateSchema, { slug: "vyvoz-grunta", title: "   " })).toContain("title");
    expect(fields(ServiceCreateSchema, { slug: "Вывоз грунта", title: "Вывоз" })).toContain("slug");
    expect(fields(ServiceCreateSchema, { slug: "vyvoz-grunta" })).toContain("title");
  });

  it("ограничивает длину описания и SEO-полей", () => {
    expect(fields(ServiceCreateSchema, { ...validService, description: "x".repeat(501) })).toContain(
      "description",
    );
    expect(fields(ServiceCreateSchema, { ...validService, seoDescription: "x".repeat(301) })).toContain(
      "seoDescription",
    );
    expect(fields(ServiceCreateSchema, { ...validService, seoText: "x".repeat(20001) })).toContain(
      "seoText",
    );
  });

  it("проверяет тип публикации и диапазон порядка", () => {
    expect(fields(ServiceCreateSchema, { ...validService, isPublished: "да" })).toContain("isPublished");
    expect(fields(ServiceCreateSchema, { ...validService, sortOrder: -1 })).toContain("sortOrder");
    expect(fields(ServiceCreateSchema, { ...validService, sortOrder: 10.5 })).toContain("sortOrder");
  });

  it("PATCH принимает частичное тело и пустой объект", () => {
    expect(v.safeParse(ServiceUpdateSchema, {}).success).toBe(true);
    expect(v.safeParse(ServiceUpdateSchema, { title: "Вывоз грунта самосвалами" }).success).toBe(true);
    expect(fields(ServiceUpdateSchema, { slug: "плохой код" })).toContain("slug");
    expect(fields(ServiceUpdateSchema, { isPublished: null })).toContain("isPublished");
  });

  it("PATCH не добавляет поля, которых не было в теле", () => {
    const parsed = v.safeParse(ServiceUpdateSchema, { title: "Вывоз грунта самосвалами" });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    // Иначе `PATCH /services/:id { title }` затирал бы описание и SEO-поля пустыми значениями.
    expect(Object.keys(parsed.output)).toEqual(["title"]);
  });
});
