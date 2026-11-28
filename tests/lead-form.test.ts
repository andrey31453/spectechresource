import { describe, expect, it } from "vitest";
import { buildLeadPayload, createRequestId, utmFromQuery } from "~/mail-form/payload";

describe("utmFromQuery", () => {
  it("достаёт UTM-метки в поля схемы", () => {
    expect(
      utmFromQuery({
        utm_source: "yandex",
        utm_medium: "cpc",
        utm_campaign: "arenda-ekskavatora",
        utm_content: "gruppa-1",
        utm_term: "аренда экскаватора",
      }),
    ).toEqual({
      utmSource: "yandex",
      utmMedium: "cpc",
      utmCampaign: "arenda-ekskavatora",
      utmContent: "gruppa-1",
      utmTerm: "аренда экскаватора",
    });
  });

  it("игнорирует посторонние параметры и пустые значения", () => {
    expect(
      utmFromQuery({ utm_source: "  ", page: "2", utm_campaign: "" }),
    ).toEqual({
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
      utmContent: null,
      utmTerm: null,
    });
  });

  it("берёт первое значение повторяющегося параметра и обрезает до 200 символов", () => {
    const long = "a".repeat(250);
    const utm = utmFromQuery({ utm_source: ["yandex", "google"], utm_term: long });

    expect(utm.utmSource).toBe("yandex");
    expect(utm.utmTerm).toHaveLength(200);
  });
});

describe("buildLeadPayload", () => {
  const base = {
    place: "hero" as const,
    name: "  Иван  ",
    phone: " +7 (999) 123-45-67 ",
    consent: true,
    pageUrl: "https://spectech.example/",
    requestId: "2f0f9d3e-3a4b-4c5d-8e9f-0a1b2c3d4e5f",
    query: { utm_source: "yandex" },
  };

  it("собирает поля схемы и приводит пустые строки к null", () => {
    expect(buildLeadPayload({ ...base, comment: "   " })).toEqual({
      name: "Иван",
      phone: "+7 (999) 123-45-67",
      email: null,
      comment: null,
      consent: true,
      place: "hero",
      pageUrl: "https://spectech.example/",
      pageTitle: null,
      sourceLabel: null,
      sourceButton: null,
      referer: null,
      utmSource: "yandex",
      utmMedium: null,
      utmCampaign: null,
      utmContent: null,
      utmTerm: null,
      equipmentTypeSlug: null,
      requestId: "2f0f9d3e-3a4b-4c5d-8e9f-0a1b2c3d4e5f",
      honeypot: "",
    });
  });

  it("передаёт вид техники, комментарий и ловушку для ботов", () => {
    const payload = buildLeadPayload({
      ...base,
      comment: " Нужен экскаватор на 2 смены ",
      equipmentTypeSlug: "gusenichnogo-ekskavatora",
      honeypot: "",
    });

    expect(payload.comment).toBe("Нужен экскаватор на 2 смены");
    expect(payload.equipmentTypeSlug).toBe("gusenichnogo-ekskavatora");
    expect(payload.honeypot).toBe("");
  });

  it("сохраняет отказ от согласия: решение принимает схема, а не форма", () => {
    expect(buildLeadPayload({ ...base, consent: false }).consent).toBe(false);
  });
});

describe("createRequestId", () => {
  it("возвращает UUID v4", () => {
    expect(createRequestId()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it("не повторяет предыдущий идентификатор", () => {
    expect(createRequestId()).not.toBe(createRequestId());
  });
});