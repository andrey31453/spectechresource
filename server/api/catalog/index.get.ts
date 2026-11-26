/** Плоский каталог видов техники. Группы Category используются только на главной. */
export default defineEventHandler(async () => {
  const prisma = usePrisma();

  const types = await prisma.equipmentType.findMany({
    where: { isPublished: true, category: { isPublished: true } },
    orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }, { name: "asc" }],
  });

  return types.map(toTypeCard);
});
