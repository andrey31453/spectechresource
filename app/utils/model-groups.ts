import type { CategoryCardDto, HomeModelDto } from "~/types/catalog";
import type { HomeModelGroup } from "~/utils/models";
import { groupModelsByCategory, modelsCountLabel, priceRangeLabel } from "~/utils/models";
import { pluralRu } from "~/utils/plural";

/** Секция — категория БД. Полки фильтра — её виды, не дополнительный уровень каталога. */
export interface HomeModelSection {
  slug: string;
  title: string;
  lead: string;
  colorTheme: string;
  number: string;
  numberLabel: string;
  shelves: Array<HomeModelGroup & { numberLabel: string }>;
  modelsLabel: string;
  shelvesLabel: string;
  priceRange: string;
}

export function categoryModelSections(categories: CategoryCardDto[], models: HomeModelDto[]): HomeModelSection[] {
  const groups = groupModelsByCategory(categories, models);
  const total = String(groups.length).padStart(2, "0");
  return groups.map((group, index) => {
    const category = categories.find((item) => item.slug === group.category.slug)!;
    const byType = new Map<string, HomeModelDto[]>();
    for (const model of group.models) {
      const bucket = byType.get(model.typeSlug);
      if (bucket) bucket.push(model);
      else byType.set(model.typeSlug, [model]);
    }
    const shelves = category.types.flatMap((type) => {
      const items = byType.get(type.slug);
      if (!items?.length) return [];
      return [{
        category: { slug: type.slug, title: type.name },
        number: "",
        numberLabel: "",
        models: items,
        modelsLabel: modelsCountLabel(items.length),
        priceRange: priceRangeLabel(items),
      }];
    });
    const number = String(index + 1).padStart(2, "0");
    return {
      slug: category.slug,
      title: category.title,
      lead: category.description ?? category.shortDesc ?? "",
      colorTheme: category.colorTheme ?? "WHITE",
      number,
      numberLabel: `${number} / ${total}`,
      shelves: shelves.map((shelf, i) => ({
        ...shelf,
        number: String(i + 1).padStart(2, "0"),
        numberLabel: `${String(i + 1).padStart(2, "0")} / ${String(shelves.length).padStart(2, "0")}`,
      })),
      modelsLabel: group.modelsLabel,
      shelvesLabel: `${shelves.length} ${pluralRu(shelves.length, ["вид", "вида", "видов"])}`,
      priceRange: group.priceRange,
    };
  });
}