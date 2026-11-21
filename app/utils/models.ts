import type { CategoryCardDto, HomeModelDto } from "~/types/catalog";
import { pluralRu } from "~/utils/plural";
import { formatMoney } from "~/utils/price";

/** Полка главной: один раздел каталога и техника, которая в нём числится. */
export interface HomeModelGroup {
  category: Pick<CategoryCardDto, "slug" | "title">;
  /** Сквозной номер полки: `01`, `02`, … — по нему считается «02 / 07». */
  number: string;
  models: HomeModelDto[];
  /** «4 модели» — счётчик со склонением. */
  modelsLabel: string;
  /** «13 500–28 000 ₽/смена» по ценам полки. */
  priceRange: string;
}

/**
 * Раскладывает модели главной по разделам каталога: у каждой категории своя полка.
 *
 * Порядок задаёт каталог (`categories`), а не ответ API: разделы идут как в `#tehnika`.
 * Порядок моделей внутри полки сохраняется — его выставляет `GET /api/home`
 * (раздел → вид → модель по `sortOrder`). Пустые разделы пропускаются, нумерация сплошная.
 */
export function groupModelsByCategory(
  categories: Array<Pick<CategoryCardDto, "slug" | "title">>,
  models: HomeModelDto[],
): HomeModelGroup[] {
  const byCategory = new Map<string, HomeModelDto[]>();

  for (const model of models) {
    const bucket = byCategory.get(model.categorySlug);

    if (bucket) bucket.push(model);
    else byCategory.set(model.categorySlug, [model]);
  }

  const groups: HomeModelGroup[] = [];

  for (const category of categories) {
    const items = byCategory.get(category.slug);
    if (!items?.length) continue;

    groups.push({
      category: { slug: category.slug, title: category.title },
      number: String(groups.length + 1).padStart(2, "0"),
      models: items,
      modelsLabel: `${items.length} ${pluralRu(items.length, ["модель", "модели", "моделей"])}`,
      priceRange: priceRangeLabel(items),
    });
  }

  return groups;
}

/**
 * Цены смены в полке: «13 500–28 000 ₽/смена», при одной цене — «13 500 ₽/смена»,
 * без заполненных цен — «цена по запросу».
 */
function priceRangeLabel(models: HomeModelDto[]): string {
  const amounts = models
    .filter((model) => model.pricePerShift !== null)
    .map((model) => Number(model.pricePerShift))
    .filter((amount) => Number.isFinite(amount));

  if (!amounts.length) return "цена по запросу";

  const min = moneyLabel(Math.min(...amounts));
  const max = moneyLabel(Math.max(...amounts));

  return min === max ? `${min} ₽/смена` : `${min}–${max} ₽/смена`;
}

function moneyLabel(amount: number): string {
  return formatMoney(String(amount)) ?? String(amount);
}
