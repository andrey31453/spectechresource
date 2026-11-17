import { FaqCreateSchema } from "#shared/schemas/admin-content";
import { requireAdmin } from "../../../../utils/admin-guard";
import { readValidBody, throwFieldError } from "../../../../utils/admin-request";
import { findFaqTargetIssue, toAdminFaq } from "../../../../utils/content-admin";

/** Новый вопрос: область задаёт привязку — вид техники (`TYPE`) или услугу (`SERVICE`). */
export default defineEventHandler(async (event) => {
  requireAdmin(event);
  const input = await readValidBody(event, FaqCreateSchema);
  const prisma = usePrisma();

  const issue = await findFaqTargetIssue(prisma, input);
  if (issue) throwFieldError(issue.field, issue.message);

  const item = await prisma.faqItem.create({
    data: input,
    include: {
      equipmentType: { select: { name: true } },
      service: { select: { title: true } },
    },
  });

  setResponseStatus(event, 201);
  return { item: toAdminFaq(item) };
});
