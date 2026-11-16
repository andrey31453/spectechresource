import { requireAdmin } from "../../../../utils/admin-guard";
import { requirePathParam, throwConflict, throwNotFound } from "../../../../utils/admin-request";
import { leadRetryBlockReason, toAdminLead } from "../../../../utils/lead-admin";
import { crmLeadFromRecord, isDryRun } from "../../../../utils/leads";
import { createLeadDelivery } from "../../../../utils/leads-delivery";

/**
 * Ручная повторная отправка в CRM из карточки заявки.
 *
 * Отправленную заявку повторять нельзя — в Битрикс24 появился бы дубль лида.
 * В режиме `LEADS_DRY_RUN` повтор бессмысленен: отвечаем 409 с понятным текстом,
 * а не зелёной галочкой при том, что в CRM ничего не ушло.
 */
export default defineEventHandler(async (event) => {
  requireAdmin(event);
  const id = requirePathParam(event);
  const config = useRuntimeConfig();
  const prisma = usePrisma();

  const lead = await prisma.lead.findUnique({
    where: { id },
    include: { equipmentType: { select: { name: true } } },
  });

  if (!lead) throwNotFound("Заявка не найдена");

  const blocked = leadRetryBlockReason(lead);
  if (blocked) throwConflict(blocked);

  if (isDryRun(config.leadsDryRun)) {
    throwConflict(
      "Отправка в CRM выключена режимом LEADS_DRY_RUN. Включите боевую отправку и задайте BITRIX24_WEBHOOK_URL.",
    );
  }

  if (!config.bitrix24WebhookUrl) {
    throwConflict("BITRIX24_WEBHOOK_URL не задан — отправлять некуда.");
  }

  const delivery = await createLeadDelivery(prisma, {
    webhookUrl: String(config.bitrix24WebhookUrl),
    dryRun: false,
  })({ id: lead.id, crm: crmLeadFromRecord(lead) });

  const updated = await prisma.lead.findUniqueOrThrow({
    where: { id },
    include: { equipmentType: { select: { name: true } } },
  });

  // Ошибка CRM — ожидаемое состояние, а не сбой API: заявка осталась в БД, попытка записана.
  return { ok: delivery.sent, delivery, lead: toAdminLead(updated) };
});
