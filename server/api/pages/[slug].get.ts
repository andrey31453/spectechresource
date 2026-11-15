/** Статическая страница (политика ПДн и т.п.) — markdown рендерится в HTML. */
export default defineEventHandler(async (event) => {
  const slug = String(getRouterParam(event, "slug") ?? "");
  if (!slug) {
    throw createError({ statusCode: 404, message: "Страница не найдена" });
  }

  const prisma = usePrisma();

  const page = await prisma.page.findFirst({ where: { slug, isPublished: true } });

  if (!page) {
    throw createError({ statusCode: 404, message: "Страница не найдена" });
  }

  return {
    slug: page.slug,
    title: page.title,
    seoTitle: page.seoTitle,
    seoDescription: page.seoDescription,
    contentHtml: renderMarkdown(page.content),
    updatedAt: page.updatedAt.toISOString(),
  };
});
