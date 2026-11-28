import { describe, expect, it } from "vitest";
import { parse, safeParse } from "valibot";
import { buildLeadSource, readLeadPageContext } from "~/utils/lead-source";
import { buildLeadPayload } from "~/mail-form/payload";
import { LeadSchema } from "#shared/schemas/leads";
import { buildLeadCreateData, toCrmLead, crmLeadFromRecord } from "~~/server/utils/leads";
import { mapLeadToBitrix } from "~~/server/utils/bitrix";

const base = {
  name: "", phone: "", email: "client@example.ru", consent: true,
  place: "callback" as const, pageUrl: "https://example.com/",
  requestId: "3f0b1c9e-1a2b-4c3d-8e9f-0a1b2c3d4e5f",
};

describe("источник заявки", () => {
  it("сохраняет главную и кнопку без техники", () => {
    expect(buildLeadSource({ sourceLabel: "Главная страница" }, { sourceButton: "Заказать звонок" }))
      .toMatchObject({ sourceLabel: "Главная страница", sourceButton: "Заказать звонок" });
  });
  it("учитывает категорию страницы и общую кнопку шапки", () => {
    expect(buildLeadSource({ equipmentTypeSlug: "excavator", equipmentLabel: "Экскаваторы" }, { sourceButton: "Звонок" }))
      .toMatchObject({ sourceLabel: "Категория: Экскаваторы", equipmentTypeSlug: "excavator" });
  });
  it("карточка модели на главной важнее контекста страницы", () => {
    expect(buildLeadSource({ sourceLabel: "Главная страница" }, { equipmentModelId: "m1", equipmentLabel: "CAT 320" }))
      .toMatchObject({ sourceLabel: "Товар: CAT 320" });
  });
  it("не переносит контекст между открытиями", () => {
    const page = { sourceLabel: "Главная страница" };
    buildLeadSource(page, { equipmentModelId: "m1", equipmentLabel: "CAT 320" });
    expect(buildLeadSource(page)).toEqual(page);
    expect(readLeadPageContext()).toEqual({});
  });
  it("обрезает поля клиента и не меняет комментарий", () => {
    const payload = buildLeadPayload({ ...base, sourceLabel: "x".repeat(350), sourceButton: " Заказать ", comment: "Мой текст" });
    expect(payload.sourceLabel).toHaveLength(300);
    expect(payload.sourceButton).toBe("Заказать");
    expect(payload.comment).toBe("Мой текст");
  });
  it("принимает старые клиенты и отклоняет превышение лимита", () => {
    expect(parse(LeadSchema, base)).toMatchObject({ sourceLabel: null, sourceButton: null });
    for (const key of ["sourceLabel", "sourceButton"]) {
      expect(safeParse(LeadSchema, { ...base, [key]: "x".repeat(301) }).success).toBe(false);
    }
  });
  it("передаёт снимок через БД в первую и повторную отправку CRM", () => {
    const input = parse(LeadSchema, { ...base, sourceLabel: "Товар: CAT 320", sourceButton: "Заказать" });
    const data = buildLeadCreateData(input, { ip: null, userAgent: null, consentVersion: "1" });
    const first = toCrmLead(data);
    const retry = crmLeadFromRecord({ ...data, createdAt: data.consentAt });
    for (const lead of [first, retry]) {
      const { fields } = mapLeadToBitrix(lead);
      expect(fields.COMMENTS).toContain("Источник: Товар: CAT 320");
      expect(fields.COMMENTS).toContain("Кнопка: Заказать");
      expect(fields.SOURCE_DESCRIPTION).toContain("Товар: CAT 320 / Заказать");
    }
  });
});