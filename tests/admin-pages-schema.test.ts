import * as v from "valibot";
import { describe, expect, it } from "vitest";
import { PageCreateSchema, PageUpdateSchema, toAdminPageFieldErrors } from "#shared/schemas/admin-pages";

/** Ошибки валидации в формате API — так их читает форма. */
function errors(schema: v.GenericSchema, input: unknown) {
  const parsed = v.safeParse(schema, input);
  return parsed.success ? [] : toAdminPageFieldErrors(parsed.issues);
}

function fields(schema: v.GenericSchema, input: unknown) {
  return errors(schema, input).map((error) => error.field);
}

const validPage = {
  slug: "politika-obrabotki-personalnyh-dannyh",
  title: "Политика обработки персональных данных",
  content: "## 1. Общие положения\n\nТекст политики.",
  seoTitle: "Политика ПДн — Спецтехресурс",
  seoDescription: null,
  isPublished: true,
};

describe("схема страницы", () => {
  it("принимает корректную страницу и нормализует код и заголовок", () => {
    const parsed = v.safeParse(PageCreateSchema, {
      ...validPage,
      slug: "  Politika-PDn  ",
      title: "  Политика  ",
      content: "  ## Раздел  ",
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    expect(parsed.output.slug).toBe("politika-pdn");
    expect(parsed.output.title).toBe("Политика");
    expect(parsed.output.content).toBe("## Раздел");
  });

  it("по умолчанию страница опубликована", () => {
    const parsed = v.safeParse(PageCreateSchema, { ...validPage, isPublished: undefined });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    expect(parsed.output.isPublished).toBe(true);
  });

  it("отклоняет короткий код и недопустимые символы", () => {
    expect(fields(PageCreateSchema, { ...validPage, slug: "a" })).toContain("slug");
    expect(fields(PageCreateSchema, { ...validPage, slug: "Политика" })).toContain("slug");
  });

  it("запрещает коды разделов сайта: такая страница никогда не откроется", () => {
    for (const slug of ["admin", "api", "uploads", "katalog", "uslugi", "kontakty"]) {
      const fieldErrors = errors(PageCreateSchema, { ...validPage, slug });
      expect(fieldErrors).toContainEqual({
        field: "slug",
        message: "Этот адрес занят разделом сайта — выберите другой код",
      });
    }
  });

  it("запрещает адреса посадочных страниц", () => {
    expect(fields(PageCreateSchema, { ...validPage, slug: "arenda-ekskavatora" })).toContain("slug");
  });

  it("требует непустой текст страницы", () => {
    expect(fields(PageCreateSchema, { ...validPage, content: "   " })).toContain("content");
    expect(fields(PageCreateSchema, { ...validPage, content: null })).toContain("content");
  });

  it("ограничивает текст страницы 100 000 символами", () => {
    expect(fields(PageCreateSchema, { ...validPage, content: "a".repeat(100_001) })).toContain("content");
    expect(fields(PageCreateSchema, { ...validPage, content: "a".repeat(100_000) })).not.toContain("content");
  });

  it("ограничивает SEO-описание 300 символами", () => {
    expect(fields(PageCreateSchema, { ...validPage, seoDescription: "a".repeat(301) })).toContain(
      "seoDescription",
    );
    expect(fields(PageCreateSchema, { ...validPage, seoDescription: "a".repeat(300) })).not.toContain(
      "seoDescription",
    );
  });

  it("PATCH: сохраняет только переданные поля", () => {
    const parsed = v.safeParse(PageUpdateSchema, { title: "Новый заголовок" });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    expect(parsed.output).toEqual({ title: "Новый заголовок" });
  });

  it("PATCH: пустой объект допустим, а пустой заголовок — нет", () => {
    expect(v.safeParse(PageUpdateSchema, {}).success).toBe(true);
    expect(fields(PageUpdateSchema, { title: " " })).toContain("title");
  });

  it("PATCH: не подставляет значение публикации по умолчанию", () => {
    const parsed = v.safeParse(PageUpdateSchema, { content: "Текст" });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    expect(parsed.output.isPublished).toBeUndefined();
  });
});
