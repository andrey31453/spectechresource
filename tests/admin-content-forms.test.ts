import { describe, expect, it } from "vitest";
import type { AdminAdvantageDto, AdminFaqDto, AdminTrustStatDto, AdminWorkStepDto } from "~/types/admin-content";
import {
  advantageFormBody,
  advantageFormFrom,
  emptyAdvantageForm,
  emptyFaqForm,
  emptyTrustStatForm,
  emptyWorkStepForm,
  faqFormBody,
  faqFormFrom,
  trustStatFormBody,
  trustStatFormFrom,
  workStepFormBody,
  workStepFormFrom,
} from "~/utils/admin-content-forms";

const faqDto: AdminFaqDto = {
  id: "faq-1",
  scope: "SERVICE",
  equipmentTypeId: null,
  serviceId: "service-1",
  equipmentTypeTitle: null,
  serviceTitle: "Вывоз грунта",
  question: "Сколько стоит вывоз?",
  answer: "Зависит от объёма.",
  sortOrder: 20,
  isPublished: false,
  updatedAt: "2026-11-16T08:30:00.000Z",
};

const advantageDto: AdminAdvantageDto = {
  id: "adv-1",
  title: "Собственный парк",
  text: null,
  icon: "fleet",
  sortOrder: 10,
  isPublished: true,
  updatedAt: "2026-11-16T08:30:00.000Z",
};

const stepDto: AdminWorkStepDto = {
  id: "step-1",
  title: "Заявка",
  text: null,
  sortOrder: 10,
  isPublished: true,
};

const statDto: AdminTrustStatDto = {
  id: "stat-1",
  value: "120",
  unit: null,
  label: "техники в парке",
  sortOrder: 10,
  isPublished: true,
};

describe("форма FAQ", () => {
  it("null-привязки превращаются в пустые строки", () => {
    const form = faqFormFrom(faqDto);

    expect(form.equipmentTypeId).toBe("");
    expect(form.serviceId).toBe("service-1");
    expect(form.scope).toBe("SERVICE");
    expect(form.isPublished).toBe(false);
  });

  it("новый вопрос — общий, порядок 10, опубликован", () => {
    const form = emptyFaqForm();

    expect(form.scope).toBe("GLOBAL");
    expect(form.sortOrder).toBe(10);
    expect(form.isPublished).toBe(true);
    expect(form.question).toBe("");
  });

  it("тело запроса чистит привязку, не соответствующую области", () => {
    const global = faqFormBody({
      ...emptyFaqForm(),
      scope: "GLOBAL",
      equipmentTypeId: "type-1",
      serviceId: "service-1",
      question: "  Вопрос  ",
      answer: "  Ответ  ",
    });

    expect(global).toEqual({
      scope: "GLOBAL",
      equipmentTypeId: null,
      serviceId: null,
      question: "Вопрос",
      answer: "Ответ",
      sortOrder: 10,
      isPublished: true,
    });
  });

  it("для вида и услуги отправляет выбранную привязку", () => {
    const type = faqFormBody({ ...emptyFaqForm(), scope: "TYPE", equipmentTypeId: " type-1 " });
    expect(type.equipmentTypeId).toBe("type-1");
    expect(type.serviceId).toBeNull();

    const service = faqFormBody({ ...emptyFaqForm(), scope: "SERVICE", serviceId: "service-1" });
    expect(service.serviceId).toBe("service-1");
    expect(service.equipmentTypeId).toBeNull();

    const empty = faqFormBody({ ...emptyFaqForm(), scope: "SERVICE", serviceId: "   " });
    expect(empty.serviceId).toBeNull();
  });
});

describe("формы простых блоков", () => {
  it("преимущество: null-поля пустеют, пустые поля уходят как null", () => {
    const form = advantageFormFrom(advantageDto);

    expect(form.text).toBe("");
    expect(form.icon).toBe("fleet");

    expect(
      advantageFormBody({
        title: "  Подача от 4 часов ",
        text: "   ",
        icon: "  clock ",
        sortOrder: 20,
        isPublished: true,
      }),
    ).toEqual({
      title: "Подача от 4 часов",
      text: null,
      icon: "clock",
      sortOrder: 20,
      isPublished: true,
    });

    expect(emptyAdvantageForm().isPublished).toBe(true);
  });

  it("шаг: пустое описание — null", () => {
    expect(workStepFormFrom(stepDto).text).toBe("");

    expect(
      workStepFormBody({ title: " Расчёт ", text: "", sortOrder: 20, isPublished: false }),
    ).toEqual({
      title: "Расчёт",
      text: null,
      sortOrder: 20,
      isPublished: false,
    });

    expect(emptyWorkStepForm().sortOrder).toBe(10);
  });

  it("цифра: единица необязательна, значение остаётся строкой", () => {
    expect(trustStatFormFrom(statDto).unit).toBe("");

    expect(
      trustStatFormBody({ value: " 4,9 ", unit: "", label: " рейтинг ", sortOrder: 30, isPublished: true }),
    ).toEqual({
      value: "4,9",
      unit: null,
      label: "рейтинг",
      sortOrder: 30,
      isPublished: true,
    });

    expect(emptyTrustStatForm().value).toBe("");
  });
});
