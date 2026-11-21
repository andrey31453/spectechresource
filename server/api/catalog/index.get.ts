/** Все опубликованные разделы каталога с видами техники. */
export default defineEventHandler(async () => {
  const prisma = usePrisma();

  const categories = await prisma.category.findMany({
    where: { isPublished: true },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    include: {
      types: {
        where: { isPublished: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      },
    },
  });

  return categories.map((category) => ({
    slug: category.slug,
    title: category.title,
    shortDesc: category.shortDesc,
    image: category.image,
    types: category.types.map(toTypeCard),
  }));
});
