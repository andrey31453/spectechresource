import * as v from "valibot";
import { LeadSchema, toLeadFieldErrors } from "#shared/schemas/leads";
import { buildLeadCreateData, isDryRun, isUniqueViolation, toCrmLead } from "../utils/leads";
import { createLeadDelivery } from "../utils/leads-delivery";
import { hitRateLimit } from "../utils/rate-limit";

/**
 * Приём заявки с сайта: валидация → запись в `Lead` → отправка в Битрикс24.
 * Заявка сначала сохраняется в БД, поэтому недоступная CRM не приводит к потере лида (ADR-5).
 */

/** 10 заявок с одного IP за 10 минут: реальным посетителям хватает с запасом. */
const RATE_LIMIT = { limit: 10, windowMs: 10 * 60 * 1000 };

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody(event);
  const parsed = v.safeParse(LeadSchema, body ?? {});

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      message: "Проверьте поля формы",
      data: { errors: toLeadFieldErrors(parsed.issues) },
    });
  }

  const input = parsed.output;

  // Ловушка для ботов: отвечаем как обычно, но заявку не создаём.
  if (input.honeypot) {
    setResponseStatus(event, 201);
    return { ok: true };
  }

  const ip = getRequestIP(event, { xForwardedFor: true }) ?? null;
  const limit = hitRateLimit(`leads:${ip ?? "unknown"}`, RATE_LIMIT);

  if (!limit.allowed) {
    setResponseHeader(event, "retry-after", limit.retryAfterSec);
    throw createError({
      statusCode: 429,
      statusMessage: "Too Many Requests",
      message: "Слишком много заявок с этого адреса. Позвоните нам или попробуйте позже.",
    });
  }

  const prisma = usePrisma();

  const equipmentType = input.equipmentTypeSlug
    ? await prisma.equipmentType.findUnique({
        where: { slug: input.equipmentTypeSlug },
        select: { id: true, name: true },
      })
    : null;

  const equipmentModel = input.equipmentModelId
    ? await prisma.equipmentModel.findFirst({
        where: { id: input.equipmentModelId, typeId: equipmentType?.id ?? "", isAvailable: true, type: { isPublished: true, category: { isPublished: true } } },
        select: { id: true },
      })
    : null;
  if (input.equipmentModelId && !equipmentModel) {
    throw createError({ statusCode: 400, message: "Модель недоступна или не относится к выбранному виду" });
  }

  const data = buildLeadCreateData(
    input,
    {
      ip,
      userAgent: getRequestHeader(event, "user-agent") ?? null,
      consentVersion: String(config.leadsConsentVersion),
    },
    { equipmentTypeId: equipmentType?.id ?? null, equipmentModelId: equipmentModel?.id ?? null },
  );

  let leadId: string;

  try {
    const lead = await prisma.lead.create({ data });
    leadId = lead.id;
  } catch (error) {
    // Повторная отправка той же формы (двойной клик, ретрай сети) — не ошибка для клиента.
    if (isUniqueViolation(error)) {
      setResponseStatus(event, 200);
      return { ok: true, duplicate: true };
    }
    throw error;
  }

  const delivery = await createLeadDelivery(prisma, {
    webhookUrl: String(config.bitrix24WebhookUrl),
    dryRun: isDryRun(config.leadsDryRun),
  })({ id: leadId, crm: toCrmLead(data, equipmentType?.name ?? null) });

  if (!delivery.sent) {
    console.warn(
      `[leads] заявка ${leadId} сохранена, но в CRM не ушла: ${delivery.error ?? "режим без отправки"}`,
    );
  }

  setResponseStatus(event, 201);
  return { ok: true };
});
