import { describe, expect, it, vi } from "vitest";
import type { CrmLead } from "../server/utils/bitrix";
import { buildMailPayload, mailConfigFromRuntime, sendLeadEmail } from "../server/mail-form/rusender";
import { deliverLeadEmail } from "../server/mail-form/delivery";

const lead: CrmLead = {
  name: "<Иван>", phone: "", email: "test@example.org", comment: "<&\"'>",
  pageUrl: "https://example.org", pageTitle: null, place: "hero",
  utmSource: null, utmMedium: null, utmCampaign: null, utmContent: null, utmTerm: null,
  equipmentTypeName: null, createdAt: new Date("2026-11-28T10:00:00Z"),
};
const config = { enabled: true, apiToken: "test-token", from: "info@example.org", to: "owner@example.org" };
const accepted = () => new Response(JSON.stringify({ data: { id: "mail-1" } }), { status: 202 });

describe("Rusender", () => {
  it("экранирует HTML и выбирает адреса только из серверной конфигурации", () => {
    const { data } = buildMailPayload(lead, config);
    expect(data.from.email).toBe(config.from);
    expect(data.to.email).toBe(config.to);
    expect(data.html).toContain("&lt;Иван&gt;");
    expect(data.html).toContain("&lt;&amp;&quot;&#39;&gt;");
    expect(data.html).toContain("Телефон: Не указан");
  });

  it("не обращается к API без включения или корректных настроек", async () => {
    const request = vi.fn<typeof fetch>();
    for (const override of [{ enabled: false }, { apiToken: "" }, { apiToken: "bad\ntoken" }, { to: "bad" }]) {
      expect((await sendLeadEmail("1", lead, { ...config, ...override }, request)).attempts).toBe(0);
    }
    expect(request).not.toHaveBeenCalled();
  });

  it("передаёт auth, запрещает редиректы и принимает только 202 с id", async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(accepted());
    expect(await sendLeadEmail("1", lead, config, request)).toEqual({ ok: true, messageId: "mail-1", attempts: 1, error: null });
    expect(request).toHaveBeenCalledWith("https://api.rusender.ru/api/v1/public/emails", expect.objectContaining({
      redirect: "error", method: "POST", signal: expect.any(AbortSignal),
      headers: expect.objectContaining({ Authorization: "Bearer test-token", "Idempotency-Key": "lead-email-1" }),
    }));
  });

  it.each([200, 302, 400, 401, 429])("не повторяет HTTP %s и не сохраняет ответ API", async (status) => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(new Response("secret provider response", { status }));
    expect(await sendLeadEmail("1", lead, config, request)).toMatchObject({ ok: false, attempts: 1, error: `Rusender: HTTP ${status}` });
    expect(request).toHaveBeenCalledTimes(1);
  });

  it.each([null, {}, { data: { id: " " } }, { data: { id: 123 } }])("отклоняет неверное подтверждение %j", async (body) => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(body), { status: 202 }));
    expect((await sendLeadEmail("1", lead, config, request)).ok).toBe(false);
    expect(request).toHaveBeenCalledTimes(1);
  });

  it.each(["network", "server"])("повторяет %s с тем же ключом и телом", async (kind) => {
    const request = vi.fn<typeof fetch>();
    if (kind === "network") request.mockRejectedValueOnce(new Error("private details"));
    else request.mockResolvedValueOnce(new Response(null, { status: 503 }));
    request.mockResolvedValueOnce(accepted());
    expect(await sendLeadEmail("1", lead, config, request)).toMatchObject({ ok: true, attempts: 2 });
    expect(request.mock.calls[0]![1]!.body).toBe(request.mock.calls[1]![1]!.body);
    expect(request.mock.calls[0]![1]!.headers).toEqual(request.mock.calls[1]![1]!.headers);
  });

  it("ограничивает сетевые попытки и не раскрывает исключение", async () => {
    const request = vi.fn<typeof fetch>().mockRejectedValue(new Error("private details"));
    expect(await sendLeadEmail("1", lead, config, request)).toMatchObject({ attempts: 2, error: "Rusender: ошибка сети или таймаут" });
    expect(request).toHaveBeenCalledTimes(2);
  });

  it("включается только явным true", () => {
    const runtime = { rusenderApiToken: "", rusenderFrom: "", rusenderTo: "", rusenderEnabled: undefined };
    expect(mailConfigFromRuntime(runtime).enabled).toBe(false);
    expect(mailConfigFromRuntime({ ...runtime, rusenderEnabled: "true" }).enabled).toBe(true);
  });
});

describe("deliverLeadEmail", () => {
  it.each([true, false])("сохраняет независимые email-поля при ok=%s", async (ok) => {
    const update = vi.fn().mockResolvedValue(undefined);
    const now = new Date();
    const result = { ok, messageId: ok ? "mail-1" : null, attempts: 2, error: ok ? null : "HTTP 503" };
    await deliverLeadEmail({ id: "1", crm: lead }, { update, send: vi.fn().mockResolvedValue(result), now: () => now });
    expect(update).toHaveBeenCalledWith("1", {
      emailAttempts: { increment: 2 }, emailErrorText: result.error,
      ...(ok ? { emailSentAt: now, emailMessageId: "mail-1" } : {}),
    });
  });
});