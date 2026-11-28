import type { CrmLead } from "../utils/bitrix";

export interface MailConfig {
  apiToken: string;
  from: string;
  to: string;
  enabled: boolean;
}

export interface MailResult {
  ok: boolean;
  messageId: string | null;
  attempts: number;
  error: string | null;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]!);
}

export function buildMailPayload(lead: CrmLead, config: Pick<MailConfig, "from" | "to">) {
  const text = [
    `Имя: ${lead.name || "Не указано"}`,
    `Телефон: ${lead.phone || "Не указан"}`,
    `Email: ${lead.email || "Не указан"}`,
    `Комментарий: ${lead.comment || "—"}`,
    `Техника: ${lead.equipmentTypeName || "—"}`,
    `Форма: ${lead.place}`,
    `Источник: ${lead.sourceLabel || "—"}`,
    `Кнопка: ${lead.sourceButton || "—"}`,
    `Страница: ${lead.pageUrl}`,
    `Заголовок: ${lead.pageTitle || "—"}`,
    `Создана: ${lead.createdAt.toISOString()}`,
    `UTM source: ${lead.utmSource || "—"}`,
    `UTM medium: ${lead.utmMedium || "—"}`,
    `UTM campaign: ${lead.utmCampaign || "—"}`,
    `UTM content: ${lead.utmContent || "—"}`,
    `UTM term: ${lead.utmTerm || "—"}`,
  ].join("\n");
  return { data: {
    from: { email: config.from, name: "СПЕЦТЕХРЕСУРС" },
    to: { email: config.to },
    subject: "СПЕЦТЕХРЕСУРС — новая заявка с сайта",
    html: `<pre>${escapeHtml(text)}</pre>`,
  } };
}

export async function sendLeadEmail(
  id: string,
  lead: CrmLead,
  config: MailConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<MailResult> {
  const fail = (error: string, attempts = 0): MailResult => ({ ok: false, messageId: null, attempts, error });
  if (!config.enabled) return fail("Rusender выключен");
  if (!config.apiToken.trim() || /\s/.test(config.apiToken)
    || ![config.from, config.to].every((email) => /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email))) {
    return fail("Rusender не настроен");
  }
  const body = JSON.stringify(buildMailPayload(lead, config));
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await fetchImpl("https://api.rusender.ru/api/v1/public/emails", {
        method: "POST",
        redirect: "error",
        signal: AbortSignal.timeout(10_000),
        headers: {
          Authorization: `Bearer ${config.apiToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          "Idempotency-Key": `lead-email-${id}`,
        },
        body,
      });
      if (response.status === 202) {
        const data: unknown = await response.json().catch(() => null);
        const messageId = (data as { data?: { id?: unknown } } | null)?.data?.id;
        if (typeof messageId === "string" && messageId.trim()) {
          return { ok: true, messageId, attempts: attempt, error: null };
        }
        return fail("Rusender: некорректное подтверждение", attempt);
      }
      if (response.status < 500 || attempt === 2) return fail(`Rusender: HTTP ${response.status}`, attempt);
    } catch {
      if (attempt === 2) return fail("Rusender: ошибка сети или таймаут", attempt);
    }
  }
  return fail("Rusender: попытки исчерпаны", 2);
}

export function mailConfigFromRuntime(config: {
  rusenderApiToken: unknown; rusenderFrom: unknown; rusenderTo: unknown; rusenderEnabled: unknown;
}): MailConfig {
  return {
    apiToken: String(config.rusenderApiToken),
    from: String(config.rusenderFrom),
    to: String(config.rusenderTo),
    enabled: String(config.rusenderEnabled).toLowerCase() === "true",
  };
}