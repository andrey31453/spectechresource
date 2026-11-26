import { describe, expect, it, vi } from "vitest";
import type { CrmLead } from "~~/server/utils/bitrix";
import { mapLeadToBitrix, sendLeadToBitrix } from "~~/server/utils/bitrix";

const lead: CrmLead = {
  name: "Иван",
  phone: "+79991234567",
  email: "ivan@example.ru",
  comment: "Нужен экскаватор на 3 дня",
  pageUrl: "https://spectech.example/arenda-gusenichnogo-ekskavatora",
  pageTitle: "Аренда гусеничного экскаватора",
  place: "equipment",
  utmSource: "yandex",
  utmMedium: "cpc",
  utmCampaign: null,
  utmContent: null,
  utmTerm: null,
  equipmentTypeName: "Гусеничные экскаваторы",
  createdAt: new Date("2026-11-15T10:00:00.000Z"),
};

const webhookUrl = "https://portal.bitrix24.ru/rest/1/token/crm.lead.add.json";

it("не отправляет пустые имя и телефон для email-заявки", () => {
  const { fields } = mapLeadToBitrix({ ...lead, name: "", phone: "" });
  expect(fields.NAME).toBeUndefined();
  expect(fields.PHONE).toBeUndefined();
  expect(fields.EMAIL).toEqual([{ VALUE: "ivan@example.ru", VALUE_TYPE: "WORK" }]);
  expect(fields.TITLE).toContain("Без имени");
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const noSleep = () => Promise.resolve();

describe("mapLeadToBitrix", () => {
  it("заполняет поля лида и телефон в формате Битрикс24", () => {
    const { fields, params } = mapLeadToBitrix(lead);

    expect(fields.TITLE).toBe("Заявка с сайта: Иван — Гусеничные экскаваторы");
    expect(fields.NAME).toBe("Иван");
    expect(fields.PHONE).toEqual([{ VALUE: "+79991234567", VALUE_TYPE: "WORK" }]);
    expect(fields.EMAIL).toEqual([{ VALUE: "ivan@example.ru", VALUE_TYPE: "WORK" }]);
    expect(fields.SOURCE_ID).toBe("WEB");
    expect(params.REGISTER_SONET_EVENT).toBe("Y");
  });

  it("в комментарий попадают страница, форма и техника", () => {
    const comments = String(mapLeadToBitrix(lead).fields.COMMENTS);

    expect(comments).toContain("Нужен экскаватор на 3 дня");
    expect(comments).toContain("Форма: equipment");
    expect(comments).toContain("https://spectech.example/arenda-gusenichnogo-ekskavatora");
    expect(comments).toContain("Техника: Гусеничные экскаваторы");
  });

  it("без e-mail, техники и UTM не создаёт пустых полей", () => {
    const { fields } = mapLeadToBitrix({
      ...lead,
      email: null,
      equipmentTypeName: null,
      utmSource: null,
      utmMedium: null,
    });

    expect(fields).not.toHaveProperty("EMAIL");
    expect(fields).not.toHaveProperty("UTM_SOURCE");
    expect(fields).not.toHaveProperty("UTM_MEDIUM");
    expect(fields.TITLE).toBe("Заявка с сайта: Иван");
  });

  it("переносит только заполненные UTM-метки", () => {
    const { fields } = mapLeadToBitrix(lead);

    expect(fields.UTM_SOURCE).toBe("yandex");
    expect(fields.UTM_MEDIUM).toBe("cpc");
    expect(fields).not.toHaveProperty("UTM_CAMPAIGN");
  });
});


describe("sendLeadToBitrix", () => {
  it("успех с первой попытки возвращает id лида", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ result: 42 }));

    const result = await sendLeadToBitrix(mapLeadToBitrix(lead), {
      webhookUrl,
      fetchImpl: fetchImpl as unknown as typeof fetch,
      sleep: noSleep,
    });

    expect(result).toEqual({ ok: true, crmLeadId: "42", error: null, attempts: 1 });
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    const [, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body)).fields.NAME).toBe("Иван");
  });

  it("повторяет отправку после сбоя и сообщает число попыток", async () => {
    const fetchImpl = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce(jsonResponse({ result: 7 }));
    const sleep = vi.fn(noSleep);

    const result = await sendLeadToBitrix(mapLeadToBitrix(lead), {
      webhookUrl,
      fetchImpl: fetchImpl as unknown as typeof fetch,
      sleep,
      baseDelayMs: 100,
    });

    expect(result.ok).toBe(true);
    expect(result.crmLeadId).toBe("7");
    expect(result.attempts).toBe(2);
    expect(sleep).toHaveBeenCalledWith(100);
  });

  it("после всех попыток возвращает ошибку HTTP, не бросая исключение", async () => {
    const fetchImpl = vi
      .fn()
      .mockImplementation(() => Promise.resolve(new Response("upstream down", { status: 502 })));
    const sleep = vi.fn(noSleep);

    const result = await sendLeadToBitrix(mapLeadToBitrix(lead), {
      webhookUrl,
      retries: 2,
      baseDelayMs: 50,
      fetchImpl: fetchImpl as unknown as typeof fetch,
      sleep,
    });

    expect(result).toEqual({
      ok: false,
      crmLeadId: null,
      error: "HTTP 502: upstream down",
      attempts: 3,
    });
    expect(sleep.mock.calls).toEqual([[50], [100]]);
  });

  it("ошибку в теле 200-ответа тоже считает неудачей", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({ error: "QUERY_LIMIT_EXCEEDED", error_description: "Too many requests" }),
    );

    const result = await sendLeadToBitrix(mapLeadToBitrix(lead), {
      webhookUrl,
      retries: 0,
      fetchImpl: fetchImpl as unknown as typeof fetch,
      sleep: noSleep,
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe("Битрикс24: Too many requests");
  });

  it("таймаут описывает как таймаут, а не как сетевую ошибку", async () => {
    const timeout = Object.assign(new Error("The operation was aborted"), { name: "TimeoutError" });
    const fetchImpl = vi.fn().mockRejectedValue(timeout);

    const result = await sendLeadToBitrix(mapLeadToBitrix(lead), {
      webhookUrl,
      retries: 0,
      timeoutMs: 1_500,
      fetchImpl: fetchImpl as unknown as typeof fetch,
      sleep: noSleep,
    });

    expect(result.error).toBe("таймаут 1500 мс");
  });

  it("без вебхука не делает попыток — заявка останется в БД", async () => {
    const fetchImpl = vi.fn();

    const result = await sendLeadToBitrix(mapLeadToBitrix(lead), {
      webhookUrl: "",
      fetchImpl: fetchImpl as unknown as typeof fetch,
      sleep: noSleep,
    });

    expect(result.attempts).toBe(0);
    expect(result.error).toContain("BITRIX24_WEBHOOK_URL");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("неожиданный ответ без result не считается успехом", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));

    const result = await sendLeadToBitrix(mapLeadToBitrix(lead), {
      webhookUrl,
      retries: 0,
      fetchImpl: fetchImpl as unknown as typeof fetch,
      sleep: noSleep,
    });

    expect(result.ok).toBe(false);
    expect(result.error).toContain("Неожиданный ответ");
  });
});
