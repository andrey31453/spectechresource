import type { HomeModelDto } from "~/types/catalog";

export interface ModelsPriceGroup {
  slug: string;
  name: string;
  models: HomeModelDto[];
}

/** Группирует прайс только по виду техники, не раскрывая homepage Category. */
export function groupModelsByType(models: HomeModelDto[]): ModelsPriceGroup[] {
  const groups = new Map<string, ModelsPriceGroup>();

  for (const model of models) {
    let group = groups.get(model.typeSlug);
    if (!group) {
      group = { slug: model.typeSlug, name: model.typeName, models: [] };
      groups.set(model.typeSlug, group);
    }
    group.models.push(model);
  }

  return [...groups.values()];
}