import { describe, expect, it } from "vitest";
import * as v from "valibot";
import { LeadSchema, toLeadFieldErrors } from "#shared/schemas/leads";

const requestId = "3f0b1c9e-1a2b-4c3d-8e9f-0a1b2c3d4e5f";

const valid = {
  name: "Иван",
  phone: "+7 (999) 123-45-67",
  consent: true,
  place: "hero",
  pageUrl: "https://spectech.example/katalog",
  requestId,
};

function issuesFor(input: Record<string, unknown>) {
  const result = v.safeParse(LeadSchema, { ...valid, ...input });
  return result.success ? [] : toLeadFieldErrors(result.issues);
}

describe("LeadSchema", () => {
  it("принимает минимальную заявку и нормализует телефон", () => {
    const result = v.safeParse(LeadSchema, valid);
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.output.phone).toBe("+79991234567");
    expect(result.output.email).toBeNull();
    expect(result.output.comment).toBeNull();
    expect(result.output.utmSource).toBeNull();
    expect(result.output.equipmentTypeSlug).toBeNull();
  });

  it("номер с ведущей 8 приводится к +7", () => {
    const result = v.safeParse(LeadSchema, { ...valid, phone: "8 999 123 45 67" });
    expect(result.success && result.output.phone).toBe("+79991234567");
  });

  it("городской номер из 10 цифр получает код 7", () => {
    const result = v.safeParse(LeadSchema, { ...valid, phone: "495 000-00-00" });
    expect(result.success && result.output.phone).toBe("+74950000000");
  });

  it("слишком короткий номер отклоняется с сообщением про формат", () => {
    const [issue] = issuesFor({ phone: "123" });
    expect(issue?.field).toBe("phone");
    expect(issue?.message).toContain("+7 (999) 123-45-67");
  });

  it("имя из одного символа отклоняется", () => {
    const errors = issuesFor({ name: " И " });
    expect(errors).toEqual([{ field: "name", message: "Имя — минимум 2 символа" }]);
  });

  it("без согласия заявку не принять", () => {
    const [issue] = issuesFor({ consent: false });
    expect(issue?.field).toBe("consent");
  });

  it("неизвестное место формы отклоняется", () => {
    const [issue] = issuesFor({ place: "sidebar" });
    expect(issue?.field).toBe("place");
  });

  it("пустой e-mail становится null, кривой — ошибкой поля", () => {
    const empty = v.safeParse(LeadSchema, { ...valid, email: "  " });
    expect(empty.success && empty.output.email).toBeNull();

    const [issue] = issuesFor({ email: "ivan@" });
    expect(issue?.field).toBe("email");
    expect(issue?.message).toContain("name@example.ru");
  });

  it("комментарий и UTM обрезаются по краям, пустые — null", () => {
    const result = v.safeParse(LeadSchema, {
      ...valid,
      comment: "  Нужен экскаватор на 3 дня  ",
      utmSource: " yandex ",
      utmTerm: "",
    });
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.output.comment).toBe("Нужен экскаватор на 3 дня");
    expect(result.output.utmSource).toBe("yandex");
    expect(result.output.utmTerm).toBeNull();
  });

  it("адрес страницы обязателен и должен быть http(s)", () => {
    expect(issuesFor({ pageUrl: "/katalog" }).map((e) => e.field)).toContain("pageUrl");
    expect(issuesFor({ pageUrl: undefined }).map((e) => e.field)).toContain("pageUrl");
  });

  it("requestId должен быть uuid — иначе дубль не отличить", () => {
    const [issue] = issuesFor({ requestId: "abc" });
    expect(issue?.field).toBe("requestId");
  });

  it("код вида техники проверяется, пустой — null", () => {
    const [issue] = issuesFor({ equipmentTypeSlug: "Гусеничный экскаватор" });
    expect(issue?.field).toBe("equipmentTypeSlug");

    const result = v.safeParse(LeadSchema, { ...valid, equipmentTypeSlug: "" });
    expect(result.success && result.output.equipmentTypeSlug).toBeNull();
  });

  it("honeypot не мешает валидации: решение о боте принимает обработчик", () => {
    const result = v.safeParse(LeadSchema, { ...valid, honeypot: "http://spam.example" });
    expect(result.success).toBe(true);
  });
});

describe("toLeadFieldErrors", () => {
  it("несколько ошибок сразу — по одной на поле", () => {
    const errors = issuesFor({ name: "", phone: "", consent: false });
    expect(errors.map((error) => error.field)).toEqual(["name", "phone", "consent"]);
    expect(errors.every((error) => error.message.length > 0)).toBe(true);
  });

  it("ошибку без поля помечает как _form", () => {
    const errors = toLeadFieldErrors([
      { message: "Что-то не так", path: [] } as unknown as v.BaseIssue<unknown>,
    ]);
    expect(errors).toEqual([{ field: "_form", message: "Что-то не так" }]);
  });
});
