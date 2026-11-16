import { describe, expect, it } from "vitest";
import {
  leadRetryBlockReason,
  leadStatusCounts,
  toAdminLead,
  toAdminLeadListItem,
  type LeadDetailRow,
  type LeadListRow,
} from "~~/server/utils/lead-admin";

const createdAt = new Date("2026-11-16T08:05:00.000Z");
const updatedAt = new Date("2026-11-16T09:00:00.000Z");

const row: LeadDetailRow = {
  id: "lead1",
  name: "Иван",
  phone: "+79991234567",
  email: "ivan@example.ru",
  place: "equipment",
  pageUrl: "https://spectech.example/katalog",
  pageTitle: "Каталог",
  status: "FAILED",
  attempts: 3,
  createdAt,
  sentAt: null,
  crmLeadId: null,
  errorText: "HTTP 502",
  equipmentType: { name: "Гусеничные экскаваторы" },
  comment: "Нужен экскаватор",
  referer: "https://yandex.ru/",
  utmSource: "yandex",
  utmMedium: null,
  utmCampaign: null,
  utmContent: null,
  utmTerm: null,
  consentAt: createdAt,
  consentVersion: "2026-11-15",
  ip: "192.0.2.10",
  userAgent: "Mozilla/5.0",
  requestId: "3f0b1c9e-1a2b-4c3d-8e9f-0a1b2c3d4e5f",
  updatedAt,
};

describe("toAdminLeadListItem", () => {
  it("отдаёт плоский JSON без служебных полей карточки", () => {
    const item = toAdminLeadListItem(row);

    expect(item).toEqual({
      id: "lead1",
      name: "Иван",
      phone: "+79991234567",
      email: "ivan@example.ru",
      place: "equipment",
      pageUrl: "https://spectech.example/katalog",
      pageTitle: "Каталог",
      equipmentTypeName: "Гусеничные экскаваторы",
      status: "FAILED",
      attempts: 3,
      createdAt: "2026-11-16T08:05:00.000Z",
      sentAt: null,
      crmLeadId: null,
      errorText: "HTTP 502",
    });
    expect("comment" in item).toBe(false);
  });

  it("без техники и e-mail отдаёт null, а не undefined", () => {
    const item = toAdminLeadListItem({ ...row, email: null, equipmentType: null } satisfies LeadListRow);

    expect(item.email).toBeNull();
    expect(item.equipmentTypeName).toBeNull();
  });
});

describe("toAdminLead", () => {
  it("добавляет UTM, согласие и контекст запроса", () => {
    const lead = toAdminLead(row);

    expect(lead).toMatchObject({
      utmSource: "yandex",
      utmMedium: null,
      consentVersion: "2026-11-15",
      ip: "192.0.2.10",
      requestId: "3f0b1c9e-1a2b-4c3d-8e9f-0a1b2c3d4e5f",
      updatedAt: "2026-11-16T09:00:00.000Z",
    });
    expect(lead.consentAt).toBe("2026-11-16T08:05:00.000Z");
  });
});

describe("leadStatusCounts", () => {
  it("считает «все» как сумму групп", () => {
    expect(
      leadStatusCounts([
        { status: "NEW", _count: { _all: 5 } },
        { status: "FAILED", _count: { _all: 2 } },
        { status: "SENT", _count: { _all: 3 } },
      ]),
    ).toEqual({ all: 10, NEW: 5, SENT: 3, FAILED: 2 });
  });

  it("пустая выборка — нули", () => {
    expect(leadStatusCounts([])).toEqual({ all: 0, NEW: 0, SENT: 0, FAILED: 0 });
  });
});

describe("leadRetryBlockReason", () => {
  it("отправленную заявку повторять нельзя", () => {
    expect(leadRetryBlockReason({ status: "SENT", crmLeadId: "42" })).toContain("ID 42");
    expect(leadRetryBlockReason({ status: "SENT", crmLeadId: null })).toContain("уже отправлена");
  });

  it("новую и неудачную можно отправлять повторно", () => {
    expect(leadRetryBlockReason({ status: "NEW", crmLeadId: null })).toBeNull();
    expect(leadRetryBlockReason({ status: "FAILED", crmLeadId: null })).toBeNull();
  });
});
