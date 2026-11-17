import * as v from "valibot";
import { describe, expect, it } from "vitest";
import {
  AdvantageCreateSchema,
  AdvantageUpdateSchema,
  FaqCreateSchema,
  FaqUpdateSchema,
  TrustStatCreateSchema,
  WorkStepCreateSchema,
  faqTargetIssue,
  mergeFaqTarget,
  normalizeFaqTarget,
  toAdminContentFieldErrors,
} from "#shared/schemas/admin-content";

/** Ошибки валидации в формате API — так их читает форма. */
function errors(schema: v.GenericSchema, input: unknown) {
  const parsed = v.safeParse(schema, input);
  return parsed.success ? [] : toAdminContentFieldErrors(parsed.issues);
}

function fields(schema: v.GenericSchema, input: unknown) {
  return errors(schema, input).map((error) => error.field);
}

const validFaq = {
  scope: "GLOBAL" as const,
  equipmentTypeId: null,
  serviceId: null,
  question: "Как заказать технику?",
  answer: "Оставьте заявку на сайте или позвоните — менеджер рассчитает стоимость.",
  sortOrder: 10,
  isPublished: true,
};

describe("схема FAQ", () => {
  it("принимает общий вопрос и подставляет порядок с публикацией", () => {
    const parsed = v.safeParse(FaqCreateSchema, {
      scope: "GLOBAL",
      question: "  Как заказать технику?  ",
      answer: "  Позвоните.  ",
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.output.question).toBe("Как заказать технику?");
    expect(parsed.output.answer).toBe("Позвоните.");
    expect(parsed.output.equipmentTypeId).toBeNull();
    expect(parsed.output.serviceId).toBeNull();
    expect(parsed.output.sortOrder).toBe(10);
    expect(parsed.output.isPublished).toBe(true);
  });

  it("для вида техники требует вид, для услуги — услугу", () => {
    expect(fields(FaqCreateSchema, { ...validFaq, scope: "TYPE", equipmentTypeId: null })).toContain(
      "equipmentTypeId",
    );
    expect(fields(FaqCreateSchema, { ...validFaq, scope: "SERVICE", serviceId: null })).toContain("serviceId");

    const typeFaq = v.safeParse(FaqCreateSchema, { ...validFaq, scope: "TYPE", equipmentTypeId: "type-1" });
    expect(typeFaq.success).toBe(true);
    if (!typeFaq.success) return;
    expect(typeFaq.output.equipmentTypeId).toBe("type-1");
    expect(typeFaq.output.serviceId).toBeNull();
  });

  it("не хранит привязку, которая не соответствует области", () => {
    const global = v.safeParse(FaqCreateSchema, {
      ...validFaq,
      scope: "GLOBAL",
      equipmentTypeId: "type-1",
      serviceId: "service-1",
    });
    expect(global.success).toBe(true);
    if (!global.success) return;
    expect(global.output.equipmentTypeId).toBeNull();
    expect(global.output.serviceId).toBeNull();

    const type = v.safeParse(FaqCreateSchema, {
      ...validFaq,
      scope: "TYPE",
      equipmentTypeId: "type-1",
      serviceId: "service-1",
    });
    expect(type.success).toBe(true);
    if (!type.success) return;
    expect(type.output.serviceId).toBeNull();
  });

  it("требует вопрос и ответ в границах длины", () => {
    expect(fields(FaqCreateSchema, { ...validFaq, question: " " })).toContain("question");
    expect(fields(FaqCreateSchema, { ...validFaq, answer: "" })).toContain("answer");
    expect(fields(FaqCreateSchema, { ...validFaq, question: "x".repeat(301) })).toContain("question");
    expect(fields(FaqCreateSchema, { ...validFaq, answer: "x".repeat(3001) })).toContain("answer");
  });

  it("PATCH присылает только изменённые поля", () => {
    const parsed = v.safeParse(FaqUpdateSchema, { question: "Новый вопрос" });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.output).toEqual({ question: "Новый вопрос" });
  });

  it("слияние PATCH с записью сохраняет привязку и чистит лишнюю", () => {
    const existing = { scope: "TYPE" as const, equipmentTypeId: "type-1", serviceId: null };

    expect(mergeFaqTarget(existing, { sortOrder: 20 })).toEqual(existing);
    expect(mergeFaqTarget(existing, { scope: "GLOBAL" })).toEqual({
      scope: "GLOBAL",
      equipmentTypeId: null,
      serviceId: null,
    });
    expect(mergeFaqTarget(existing, { scope: "SERVICE", serviceId: "service-1" })).toEqual({
      scope: "SERVICE",
      equipmentTypeId: null,
      serviceId: "service-1",
    });
  });

  it("проверяет привязку по итоговой области", () => {
    expect(faqTargetIssue({ scope: "GLOBAL", equipmentTypeId: null, serviceId: null })).toBeNull();
    expect(faqTargetIssue({ scope: "TYPE", equipmentTypeId: "type-1", serviceId: null })).toBeNull();
    expect(faqTargetIssue({ scope: "TYPE", equipmentTypeId: null, serviceId: null })?.field).toBe(
      "equipmentTypeId",
    );
    expect(faqTargetIssue({ scope: "SERVICE", equipmentTypeId: null, serviceId: null })?.field).toBe(
      "serviceId",
    );
  });

  it("нормализация не меняет валидную привязку", () => {
    const target = { scope: "SERVICE" as const, equipmentTypeId: null, serviceId: "service-1" };

    expect(normalizeFaqTarget(target)).toEqual(target);
  });
});

describe("схемы простых блоков", () => {
  it("преимущество: заголовок обязателен, иконка — ключ латиницей", () => {
    const parsed = v.safeParse(AdvantageCreateSchema, {
      title: "  Собственный парк  ",
      text: "  Без посредников.  ",
      icon: "  FLEET  ",
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.output.title).toBe("Собственный парк");
    expect(parsed.output.text).toBe("Без посредников.");
    expect(parsed.output.icon).toBe("fleet");
    expect(parsed.output.sortOrder).toBe(10);

    expect(fields(AdvantageCreateSchema, { title: "" })).toContain("title");
    expect(fields(AdvantageCreateSchema, { title: "Парк", icon: "иконка" })).toContain("icon");
    expect(fields(AdvantageCreateSchema, { title: "Парк", icon: "fleet clock" })).toContain("icon");
  });

  it("PATCH преимущества не добавляет отсутствующие поля", () => {
    const parsed = v.safeParse(AdvantageUpdateSchema, { sortOrder: 30 });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.output).toEqual({ sortOrder: 30 });
  });

  it("шаг: название обязательно, описание необязательно", () => {
    const parsed = v.safeParse(WorkStepCreateSchema, { title: "Заявка" });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.output.text).toBeNull();
    expect(parsed.output.isPublished).toBe(true);

    expect(fields(WorkStepCreateSchema, { title: "З" })).toContain("title");
  });

  it("цифра: значение строкой от 1 символа, подпись обязательна", () => {
    const short = v.safeParse(TrustStatCreateSchema, { value: "4", unit: "часа", label: "средняя подача" });

    expect(short.success).toBe(true);
    if (!short.success) return;
    expect(short.output.value).toBe("4");
    expect(short.output.unit).toBe("часа");

    const custom = v.safeParse(TrustStatCreateSchema, { value: " 12+ ", label: "лет на рынке" });
    expect(custom.success).toBe(true);
    if (!custom.success) return;
    expect(custom.output.value).toBe("12+");
    expect(custom.output.unit).toBeNull();

    expect(fields(TrustStatCreateSchema, { value: "", label: "лет" })).toContain("value");
    expect(fields(TrustStatCreateSchema, { value: "12", label: "" })).toContain("label");
    expect(fields(TrustStatCreateSchema, { value: "12", unit: "x".repeat(21), label: "лет" })).toContain(
      "unit",
    );
  });
});
