import type { Prisma, PrismaClient } from "../../generated/prisma/client";
import type { CrmLead } from "./bitrix";
import { mapLeadToBitrix, sendLeadToBitrix } from "./bitrix";
import { deliverLead } from "./leads";

/**
 * Связка «БД + CRM» для доставки заявки: используется и в `POST /api/leads`,
 * и в задаче досылки. Отдельный файл, чтобы `server/utils/leads.ts` оставался чистым
 * и тестировался без Prisma.
 */

export interface LeadDeliveryConfig {
  webhookUrl: string;
  dryRun: boolean;
}

export function createLeadDelivery(prisma: PrismaClient, config: LeadDeliveryConfig) {
  return (lead: { id: string; crm: CrmLead }) =>
    deliverLead(lead, {
      dryRun: config.dryRun,
      updateLead: (id, data) =>
        prisma.lead.update({ where: { id }, data: data as Prisma.LeadUpdateInput }),
      send: (crm) => sendLeadToBitrix(mapLeadToBitrix(crm), { webhookUrl: config.webhookUrl }),
    });
}
