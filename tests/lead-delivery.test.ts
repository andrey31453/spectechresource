import { describe, expect, it, vi } from "vitest";
import * as v from "valibot";
import { LeadSchema } from "#shared/schemas/leads";
import type { BitrixSendResult, CrmLead } from "~~/server/utils/bitrix";
import type { LeadDeliveryDeps } from "~~/server/utils/leads";
import {
  buildLeadCreateData,
  crmLeadFromRecord,
  deliverLead,
  isDryRun,
  isUniqueViolation,
  toCrmLead,
} from "~~/server/utils/leads";

const input = v.parse(LeadSchema, {
  name: "Иван",
  phone: "8 999 123 45 67",
  email: "ivan@example.ru",
  comment: " Нужен экскаватор ",
  consent: true,
  place: "equipment",
  pageUrl: "https://spectech.example/katalog",
  pageTitle: "Каталог",
  referer: "https://yandex.ru/",
  utmSource: "yandex",
  equipmentTypeSlug: "gusenichnogo-ekskavatora",
  requestId: "3f0b1c9e-1a2b-4c3d-8e9f-0a1b2c3d4e5f",
});

const crm: CrmLead = {
  name: "Иван",
  phone: "+79991234567",
  email: null,
  comment: null,
  pageUrl: "https://spectech.example/katalog",
  pageTitle: null,
  place: "hero",
  utmSource: null,
  utmMedium: null,
  utmCampaign: null,
  utmContent: null,
  utmTerm: null,
  equipmentTypeName: null,
  createdAt: new Date("2026-11-15T10:00:00.000Z"),
};

const now = new Date("2026-11-15T12:00:00.000Z");

describe("buildLeadCreateData", () => {
  it("сохраняет заявку только с email без обязательных имени и телефона", () => {
    const parsed = v.parse(LeadSchema, { ...input, name: null, phone: null, email: "client@example.ru" });
    const data = buildLeadCreateData(parsed, { ip: null, userAgent: null, consentVersion: "v1", now });
    expect(data).toMatchObject({ name: "", phone: "", email: "client@example.ru" });
  });
  it("переносит поля формы и контекст запроса", () => {
    const data = buildLeadCreateData(
      input,
      { ip: "192.0.2.10", userAgent: "Mozilla/5.0", consentVersion: "2026-11-15", now },
      { equipmentTypeId: "et1" },
    );

    expect(data).toMatchObject({
      requestId: "3f0b1c9e-1a2b-4c3d-8e9f-0a1b2c3d4e5f",
      name: "Иван",
      phone: "+79991234567",
      email: "ivan@example.ru",
      comment: "Нужен экскаватор",
      place: "equipment",
      pageTitle: "Каталог",
      referer: "https://yandex.ru/",
      utmSource: "yandex",
      utmMedium: null,
      equipmentTypeId: "et1",
      consentVersion: "2026-11-15",
      ip: "192.0.2.10",
      userAgent: "Mozilla/5.0",
    });
    expect(data.consentAt).toBe(now);
  });

  it("без вида техники и UTM подставляет null, а не undefined", () => {
    const data = buildLeadCreateData(input, { ip: null, userAgent: null, consentVersion: "v1", now });

    expect(data.equipmentTypeId).toBeNull();
    expect(data.ip).toBeNull();
    expect(data.userAgent).toBeNull();
  });

  it("согласие фиксируется временем сервера, а не данными клиента", () => {
    const data = buildLeadCreateData(input, { ip: null, userAgent: null, consentVersion: "v1", now });
    expect(data.consentAt.toISOString()).toBe("2026-11-15T12:00:00.000Z");
  });
});

describe("crmLeadFromRecord", () => {
  it("берёт название техники из связи и дату создания", () => {
    const lead = crmLeadFromRecord({
      ...crm,
      createdAt: now,
      equipmentType: { name: "Гусеничные экскаваторы" },
    });

    expect(lead.equipmentTypeName).toBe("Гусеничные экскаваторы");
    expect(lead.createdAt).toBe(now);
  });
});

describe("toCrmLead", () => {
  it("передаёт в CRM нормализованный телефон и дату согласия", () => {
    const data = buildLeadCreateData(input, { ip: null, userAgent: null, consentVersion: "v1", now });
    const lead = toCrmLead(data, "Гусеничные экскаваторы");

    expect(lead.phone).toBe("+79991234567");
    expect(lead.createdAt).toBe(now);
    expect(lead.equipmentTypeName).toBe("Гусеничные экскаваторы");
  });
});

describe("isDryRun", () => {
  it("по умолчанию включён", () => {
    expect(isDryRun(undefined)).toBe(true);
    expect(isDryRun("")).toBe(true);
    expect(isDryRun("true")).toBe(true);
  });

  it("выключается только явным false", () => {
    expect(isDryRun("false")).toBe(false);
    expect(isDryRun("FALSE")).toBe(false);
    expect(isDryRun(false)).toBe(false);
  });
});

describe("isUniqueViolation", () => {
  it("распознаёт P2002 и не путает с обычной ошибкой", () => {
    expect(isUniqueViolation({ code: "P2002" })).toBe(true);
    expect(isUniqueViolation(new Error("P2002"))).toBe(false);
    expect(isUniqueViolation(null)).toBe(false);
    expect(isUniqueViolation("P2002")).toBe(false);
  });
});


describe("deliverLead", () => {
  function deps(overrides: Partial<LeadDeliveryDeps> = {}) {
    return {
      updateLead: vi.fn().mockResolvedValue({}),
      send: vi.fn(),
      dryRun: false,
      now: () => now,
      ...overrides,
    } satisfies LeadDeliveryDeps;
  }

  const ok: BitrixSendResult = { ok: true, crmLeadId: "42", error: null, attempts: 1 };
  const fail: BitrixSendResult = { ok: false, crmLeadId: null, error: "HTTP 502", attempts: 3 };

  it("в режиме без отправки пишет только попытку и не трогает статус", async () => {
    const d = deps({ dryRun: true, send: vi.fn() });

    const result = await deliverLead({ id: "l1", crm }, d);

    expect(result).toEqual({ sent: false, attempts: 1, crmLeadId: null, error: null });
    expect(d.send).not.toHaveBeenCalled();
    expect(d.updateLead).toHaveBeenCalledWith("l1", { attempts: { increment: 1 } });
  });

  it("успех помечает SENT, сохраняет id CRM и время", async () => {
    const d = deps({ send: vi.fn().mockResolvedValue(ok) });

    const result = await deliverLead({ id: "l1", crm }, d);

    expect(result.sent).toBe(true);
    expect(d.updateLead).toHaveBeenCalledWith("l1", {
      status: "SENT",
      sentAt: now,
      crmLeadId: "42",
      errorText: null,
      attempts: { increment: 1 },
    });
  });

  it("неудача помечает FAILED, текст ошибки сохраняется для админки", async () => {
    const d = deps({ send: vi.fn().mockResolvedValue(fail) });

    const result = await deliverLead({ id: "l1", crm }, d);

    expect(result).toEqual({ sent: false, attempts: 3, crmLeadId: null, error: "HTTP 502" });
    expect(d.updateLead).toHaveBeenCalledWith("l1", {
      status: "FAILED",
      errorText: "HTTP 502",
      attempts: { increment: 3 },
    });
  });

  it("без вебхука заявка остаётся NEW и не расходует попытки", async () => {
    const d = deps({
      send: vi.fn().mockResolvedValue({
        ok: false,
        crmLeadId: null,
        error: "BITRIX24_WEBHOOK_URL не задан",
        attempts: 0,
      } satisfies BitrixSendResult),
    });

    await deliverLead({ id: "l1", crm }, d);

    expect(d.updateLead).toHaveBeenCalledWith("l1", {
      status: "NEW",
      errorText: "BITRIX24_WEBHOOK_URL не задан",
    });
  });
});
