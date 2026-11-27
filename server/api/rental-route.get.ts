/** Существующий вид имеет приоритет при совпадении адресов. */
export default defineEventHandler(async (event) => {
  const slug = String(getQuery(event).slug ?? "");
  const prisma = usePrisma();
  const type = await prisma.equipmentType.findFirst({
    where: { slug, isPublished: true, category: { isPublished: true } },
    select: { id: true },
  });
  if (type) return { kind: "type" as const };
  const category = await prisma.category.findFirst({ where: { slug, isPublished: true }, select: { id: true } });
  if (category) return { kind: "category" as const };
  throw createError({ statusCode: 404, message: "Техника не найдена" });
});