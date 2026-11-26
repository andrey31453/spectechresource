/** Пустой код — вся техника; фильтруем только по виду, не по группе главной. */
export function filterCatalogModels<T extends { typeSlug: string }>(models: T[], typeSlug: string): T[] {
  return typeSlug ? models.filter((model) => model.typeSlug === typeSlug) : models;
}