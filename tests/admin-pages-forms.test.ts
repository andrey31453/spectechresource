import { describe, expect, it } from "vitest";
import type { AdminPageDto } from "~/types/admin-pages";
import { emptyPageForm, pageFormBody, pageFormFrom } from "~/utils/admin-pages-forms";

const pageDto: AdminPageDto = {
  id: "page-1",
  slug: "politika-obrabotki-personalnyh-dannyh",
  title: "Политика обработки персональных данных",
  content: "## 1. Общие положения\n\nТекст.",
  seoTitle: null,
  seoDescription: null,
  isPublished: false,
  createdAt: "2026-11-15T10:00:00.000Z",
  updatedAt: "2026-11-16T08:30:00.000Z",
};

describe("форма страницы", () => {
  it("null-поля SEO превращаются в пустые строки", () => {
    const form = pageFormFrom(pageDto);

    expect(form.seoTitle).toBe("");
    expect(form.seoDescription).toBe("");
    expect(form.isPublished).toBe(false);
  });

  it("новая страница публикуется по умолчанию", () => {
    const form = emptyPageForm();

    expect(form.isPublished).toBe(true);
    expect(form.slug).toBe("");
    expect(form.content).toBe("");
  });

  it("тело запроса обрезает строки и отправляет null вместо пустых SEO", () => {
    const body = pageFormBody({
      ...emptyPageForm(),
      slug: "  o-dostavke  ",
      title: "  О доставке  ",
      content: "  ## Условия  ",
      seoTitle: "  ",
      seoDescription: "Доставка по Москве",
    });

    expect(body.slug).toBe("o-dostavke");
    expect(body.title).toBe("О доставке");
    expect(body.content).toBe("## Условия");
    expect(body.seoTitle).toBeNull();
    expect(body.seoDescription).toBe("Доставка по Москве");
  });

  it("контент сохраняет переводы строк внутри текста", () => {
    const body = pageFormBody({
      ...emptyPageForm(),
      content: "\n## Заголовок\n\n- пункт\n- ещё пункт\n",
    });

    expect(body.content).toBe("## Заголовок\n\n- пункт\n- ещё пункт");
  });

  it("страница из карточки переживает круг «DTO → форма → тело запроса»", () => {
    const body = pageFormBody(pageFormFrom(pageDto));

    expect(body.slug).toBe(pageDto.slug);
    expect(body.title).toBe(pageDto.title);
    expect(body.content).toBe(pageDto.content);
    expect(body.seoTitle).toBeNull();
    expect(body.isPublished).toBe(false);
  });
});
