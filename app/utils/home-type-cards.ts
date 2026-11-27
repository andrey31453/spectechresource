import type { CategoryCardDto, HomeModelDto } from "~/types/catalog";

/** Все опубликованные виды, в том числе пока без моделей; порядок задаёт админка. */
export function homeTypeSections(categories: CategoryCardDto[], models: HomeModelDto[]) {
  return categories.map((category) => ({
    ...category,
    lead: category.description ?? category.shortDesc ?? "",
    cards: category.types.map((type) => {
      const items = models.filter((model) => model.categorySlug === category.slug && model.typeSlug === type.slug);
      const prices = items.map((model) => type.priceUnit === "SHIFT" ? model.pricePerShift : type.priceUnit === "HOUR" ? model.pricePerHour : null)
        .filter((price): price is string => price !== null && Number.isFinite(Number(price)) && Number(price) >= 0);
      return {
        ...type,
        modelsCount: items.length,
        image: type.image || items.find((model) => model.photo)?.photo || null,
        priceFrom: type.priceFrom ?? (prices.length ? prices.reduce((min, price) => Number(price) < Number(min) ? price : min) : null),
        description: (type.description ?? "").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/^\s*-\s+/gm, "").replace(/[#*_>`]/g, "").replace(/\s+/g, " ").trim(),
      };
    }),
  }));
}