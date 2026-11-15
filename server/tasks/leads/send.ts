import { crmLeadFromRecord, isDryRun } from "../../utils/leads";
import { createLeadDelivery } from "../../utils/leads-delivery";

/**
 * Досылка заявок, которые не ушли в Битрикс24 при создании.
 *
 * Запуск: `npx nuxi task run leads:send` вручную или по расписанию
 * (`scheduledTasks` в конфиге Nitro) — расписание включим вместе с деплоем.
 */

/** После стольких попыток заявку разбирают вручную из админки, а не долбят CRM. */
const MAX_ATTEMPTS = 6;
const BATCH = 20;

interface SendLeadsResult {
  processed: number;
  sent: number;
  failed: number;
  /** Причина, по которой задача ничего не делала; `null` — работала. */
  skipped: string | null;
}

export default defineTask({
  meta: {
    name: "leads:send",
    description: "Досылает в Битрикс24 заявки, которые не ушли при создании",
  },
  async run() {
    const config = useRuntimeConfig();

    if (isDryRun(config.leadsDryRun)) {
      return { result: { processed: 0, sent: 0, failed: 0, skipped: "LEADS_DRY_RUN" } as SendLeadsResult };
    }

    if (!config.bitrix24WebhookUrl) {
      return {
        result: { processed: 0, sent: 0, failed: 0, skipped: "BITRIX24_WEBHOOK_URL" } as SendLeadsResult,
      };
    }

    const prisma = usePrisma();

    const pending = await prisma.lead.findMany({
      where: {
        status: { in: ["NEW", "FAILED"] },
        attempts: { lt: MAX_ATTEMPTS },
      },
      orderBy: { createdAt: "asc" },
      take: BATCH,
      include: { equipmentType: { select: { name: true } } },
    });

    const deliver = createLeadDelivery(prisma, {
      webhookUrl: String(config.bitrix24WebhookUrl),
      dryRun: false,
    });

    let sent = 0;
    let failed = 0;

    for (const lead of pending) {
      const result = await deliver({ id: lead.id, crm: crmLeadFromRecord(lead) });
      if (result.sent) sent += 1;
      else failed += 1;
    }

    return { result: { processed: pending.length, sent, failed, skipped: null } as SendLeadsResult };
  },
});
