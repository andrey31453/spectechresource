/**
 * Отправка заявки в Битрикс24 через входящий вебхук (`crm.lead.add.json`).
 *
 * Битрикс24 отвечает `200 OK` и при ошибке — она приходит в теле как `{ error, error_description }`,
 * поэтому проверяем и HTTP-статус, и тело. ПДн в тексты ошибок не попадают: сохраняется только
 * ответ CRM, обрезанный до 300 символов.
 */

export interface CrmLead {
  name: string;
  phone: string;
  email: string | null;
  comment: string | null;
  pageUrl: string;
  pageTitle: string | null;
  place: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  equipmentTypeName: string | null;
  createdAt: Date;
}

export interface BitrixFields {
  [key: string]: string | { VALUE: string; VALUE_TYPE: string }[];
}

export interface BitrixLeadRequest {
  fields: BitrixFields;
  params: { REGISTER_SONET_EVENT: "Y" };
}

export interface BitrixSendOptions {
  webhookUrl: string;
  /** Таймаут одной попытки. */
  timeoutMs?: number;
  /** Количество повторов после первой попытки (всего попыток — `retries + 1`). */
  retries?: number;
  /** Базовая пауза перед повтором, дальше удваивается. */
  baseDelayMs?: number;
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
}

export interface BitrixSendResult {
  ok: boolean;
  crmLeadId: string | null;
  error: string | null;
  /** Сколько попыток реально сделано; `0` — вебхук не настроен, попыток не было. */
  attempts: number;
}

const MAX_ERROR_LENGTH = 300;

function shorten(value: string): string {
  const text = value.trim().replace(/\s+/g, " ");
  return text.length > MAX_ERROR_LENGTH ? `${text.slice(0, MAX_ERROR_LENGTH)}…` : text;
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** Заявка → тело запроса `crm.lead.add.json`. Чистая функция: проверяется тестами. */
export function mapLeadToBitrix(lead: CrmLead): BitrixLeadRequest {
  const comments = [
    lead.comment,
    `Форма: ${lead.place}`,
    `Страница: ${lead.pageUrl}${lead.pageTitle ? ` (${lead.pageTitle})` : ""}`,
    lead.equipmentTypeName ? `Техника: ${lead.equipmentTypeName}` : null,
    `Создана: ${lead.createdAt.toISOString()}`,
  ]
    .filter(Boolean)
    .join("\n");

  const fields: BitrixFields = {
    TITLE: `Заявка с сайта: ${lead.name}${lead.equipmentTypeName ? ` — ${lead.equipmentTypeName}` : ""}`,
    NAME: lead.name,
    PHONE: [{ VALUE: lead.phone, VALUE_TYPE: "WORK" }],
    COMMENTS: comments,
    SOURCE_ID: "WEB",
    SOURCE_DESCRIPTION: `spectechresource / ${lead.place}`,
  };

  if (lead.email) {
    fields.EMAIL = [{ VALUE: lead.email, VALUE_TYPE: "WORK" }];
  }

  const utm: Array<[keyof BitrixFields, string | null]> = [
    ["UTM_SOURCE", lead.utmSource],
    ["UTM_MEDIUM", lead.utmMedium],
    ["UTM_CAMPAIGN", lead.utmCampaign],
    ["UTM_CONTENT", lead.utmContent],
    ["UTM_TERM", lead.utmTerm],
  ];

  for (const [key, value] of utm) {
    if (value) fields[key] = value;
  }

  return { fields, params: { REGISTER_SONET_EVENT: "Y" } };
}

/**
 * Отправка с таймаутом и повторами. Не бросает исключений: результат всегда возвращается,
 * чтобы заявка осталась в БД даже при полностью недоступной CRM (ADR-5).
 */
export async function sendLeadToBitrix(
  payload: BitrixLeadRequest,
  options: BitrixSendOptions,
): Promise<BitrixSendResult> {
  const {
    webhookUrl,
    timeoutMs = 5_000,
    retries = 2,
    baseDelayMs = 300,
    fetchImpl = fetch,
    sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)),
  } = options;

  if (!webhookUrl) {
    return {
      ok: false,
      crmLeadId: null,
      error: "BITRIX24_WEBHOOK_URL не задан — отправка в CRM не выполнялась",
      attempts: 0,
    };
  }

  const total = Math.max(1, retries + 1);
  let lastError = "неизвестная ошибка";

  for (let attempt = 1; attempt <= total; attempt++) {
    try {
      const response = await fetchImpl(webhookUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(timeoutMs),
      });
      const text = await response.text();

      if (!response.ok) {
        lastError = `HTTP ${response.status}: ${shorten(text)}`;
      } else {
        const body = parseJson(text);

        if (body && typeof body === "object" && "error" in body && body.error) {
          const description =
            "error_description" in body ? String(body.error_description) : String(body.error);
          lastError = `Битрикс24: ${shorten(description)}`;
        } else if (body && typeof body === "object" && "result" in body && body.result != null) {
          return { ok: true, crmLeadId: String(body.result), error: null, attempts: attempt };
        } else {
          lastError = `Неожиданный ответ Битрикс24: ${shorten(text)}`;
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        const isTimeout = error.name === "TimeoutError" || error.name === "AbortError";
        lastError = isTimeout ? `таймаут ${timeoutMs} мс` : error.message;
      } else {
        lastError = String(error);
      }
    }

    if (attempt < total) {
      await sleep(baseDelayMs * 2 ** (attempt - 1));
    }
  }

  return { ok: false, crmLeadId: null, error: lastError, attempts: total };
}
