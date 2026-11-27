import type { HomeModelSection } from "~/utils/model-groups";
import { modelsCountLabel, priceRangeLabel } from "~/utils/models";

/** Одна витрина, в режиме «Все» модели видов техники чередуются. */
export function showcaseShelf(section: HomeModelSection, typeSlug = "") {
  const shelves = section.shelves.filter((shelf) => !typeSlug || shelf.category.slug === typeSlug);
  const length = Math.max(0, ...shelves.map((shelf) => shelf.models.length));
  const models = Array.from({ length }, (_, index) => shelves.flatMap((shelf) => {
    const model = shelf.models[index];
    return model ? [model] : [];
  })).flat();

  return {
    category: { slug: section.slug, title: shelves.length === 1 ? shelves[0]!.category.title : "Вся техника" },
    number: section.number,
    models,
    modelsLabel: modelsCountLabel(models.length),
    priceRange: priceRangeLabel(models),
  };
}

export function modelPage<T>(models: T[], page: number, size: number) {
  const pageSize = Math.max(1, Math.floor(size) || 1);
  const count = Math.ceil(models.length / pageSize);
  const index = Math.min(Math.max(0, Math.floor(page) || 0), Math.max(0, count - 1));
  return { count, index, models: models.slice(index * pageSize, (index + 1) * pageSize) };
}
