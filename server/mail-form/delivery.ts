import type { CrmLead } from "../utils/bitrix";
import type { MailResult } from "./rusender";

/** Сервисный слой: почтовые статусы никогда не меняют результат CRM. */
export async function deliverLeadEmail(
  lead: { id: string; crm: CrmLead },
  deps: {
    send: (id: string, crm: CrmLead) => Promise<MailResult>;
    update: (id: string, data: {
      emailAttempts: { increment: number };
      emailErrorText: string | null;
      emailSentAt?: Date;
      emailMessageId?: string;
    }) => Promise<unknown>;
    now?: () => Date;
  },
) {
  const result = await deps.send(lead.id, lead.crm);
  await deps.update(lead.id, {
    emailAttempts: { increment: result.attempts },
    emailErrorText: result.error,
    ...(result.ok && result.messageId ? {
      emailSentAt: (deps.now ?? (() => new Date()))(),
      emailMessageId: result.messageId,
    } : {}),
  });
  return result;
}