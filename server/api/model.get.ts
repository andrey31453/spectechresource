export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const typeSlug = String(query.typeSlug ?? "");
  const slug = String(query.modelSlug ?? "");
  const model = await usePrisma().equipmentModel.findFirst({
    where: { slug, isPublished: true, type: { slug: typeSlug, isPublished: true, category: { isPublished: true } } },
    include: { specs: { orderBy: { sortOrder: "asc" } } },
  });
  if (!model) throw createError({ statusCode: 404, message: "Модель не найдена" });
  return {
    id: model.id, slug: model.slug, brand: model.brand, model: model.model,
    shortDesc: model.shortDesc, photos: model.photos,
    pricePerShift: money(model.pricePerShift), pricePerHour: money(model.pricePerHour),
    specs: model.specs.map(spec => ({ name: spec.name, value: spec.value })),
  };
});