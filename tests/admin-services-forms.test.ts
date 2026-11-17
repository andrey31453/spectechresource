import { describe, expect, it } from "vitest";
import type { AdminServiceDto } from "~/types/admin-services";
import { emptyServiceForm, serviceFormBody, serviceFormFrom } from "~/utils/admin-services-forms";

const serviceDto: AdminServiceDto = {
  id: "service-1",
  slug: "vyvoz-grunta",
  title: "Вывоз грунта",
  description: null,
  image: "/uploads/vyvoz-grunta.jpg",
  seoTitle: null,
  seoDescription: "Вывоз грунта самосвалами",
  seoText: "## Текст\n\nАбзац.",
  sortOrder: 20,
  isPublished: false,
  faqCount: 3,
  updatedAt: "2026-11-16T08:30:00.000Z",
};

describe("форма услуги", () => {
  it("null-поля превращаются в пустые строки", () => {
    const form = serviceFormFrom(serviceDto);

    expect(form.description).toBe("");
    expect(form.seoTitle).toBe("");
    expect(form.image).toBe("/uploads/vyvoz-grunta.jpg");
    expect(form.isPublished).toBe(false);
  });

  it("новая услуга публикуется по умолчанию и получает порядок 10", () => {
    const form = emptyServiceForm();

    expect(form.isPublished).toBe(true);
    expect(form.sortOrder).toBe(10);
    expect(form.slug).toBe("");
  });

  it("тело запроса обрезает строки и отправляет пустые поля как null", () => {
    const body = serviceFormBody({
      ...emptyServiceForm(),
      slug: "  vyvoz-grunta  ",
      title: "  Вывоз грунта  ",
      description: "   ",
      image: " /uploads/grunt.jpg ",
      seoText: "  ## Текст  ",
      sortOrder: 30,
    });

    expect(body).toEqual({
      slug: "vyvoz-grunta",
      title: "Вывоз грунта",
      description: null,
      image: "/uploads/grunt.jpg",
      seoTitle: null,
      seoDescription: null,
      seoText: "## Текст",
      sortOrder: 30,
      isPublished: true,
    });
  });

  it("DTO → форма → тело запроса сохраняет заполненные поля", () => {
    const body = serviceFormBody(serviceFormFrom(serviceDto));

    expect(body.slug).toBe("vyvoz-grunta");
    expect(body.title).toBe("Вывоз грунта");
    expect(body.description).toBeNull();
    expect(body.image).toBe("/uploads/vyvoz-grunta.jpg");
    expect(body.seoDescription).toBe("Вывоз грунта самосвалами");
    expect(body.sortOrder).toBe(20);
    expect(body.isPublished).toBe(false);
  });
});
