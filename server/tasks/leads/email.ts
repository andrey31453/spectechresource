import { deliverLeadEmail } from "../../mail-form/delivery";
import { mailConfigFromRuntime, sendLeadEmail } from "../../mail-form/rusender";
import { crmLeadFromRecord } from "../../utils/leads";

export default defineTask({
  meta: { name: "leads:email", description: "Досылка заявок через Rusender (вручную)" },
  async run(): Promise<{ result: { processed: number; sent: number; failed: number; skipped: string | null } }> {
    const config = mailConfigFromRuntime(useRuntimeConfig());
    if (!config.enabled || !config.apiToken) return { result: { processed: 0, sent: 0, failed: 0, skipped: "Rusender не включён или не настроен" } };
    const prisma = usePrisma();
    const pending = await prisma.lead.findMany({
      where: { emailSentAt: null, emailAttempts: { lt: 6 } },
      orderBy: { createdAt: "asc" },
      take: 20,
      include: { equipmentType: { select: { name: true } } },
    });
    let sent = 0;
    for (const lead of pending) {
      const result = await deliverLeadEmail({ id: lead.id, crm: crmLeadFromRecord(lead) }, {
        send: (id, crm) => sendLeadEmail(id, crm, config),
        update: (id, data) => prisma.lead.update({ where: { id }, data }),
      });
      if (result.ok) sent++;
    }
    return { result: { processed: pending.length, sent, failed: pending.length - sent, skipped: null } };
  },
});