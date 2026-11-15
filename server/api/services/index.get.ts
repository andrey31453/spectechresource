/** Список опубликованных услуг. */
export default defineEventHandler(async () => {
  const prisma = usePrisma();

  const services = await prisma.service.findMany({
    where: { isPublished: true },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    select: { slug: true, title: true, description: true, image: true },
  });

  return services;
});
