import type { HomeModelGroup } from "~/utils/models";
import { modelsCountLabel, priceRangeLabel } from "~/utils/models";
import { pluralRu } from "~/utils/plural";

/**
 * Надгруппа техники на главной: крупная секция, внутри которой стоят полки
 * разделов каталога. Витринная надстройка — адреса разделов и посадочных
 * не меняются, в БД надгрупп нет.
 */
export interface HomeModelSupergroup {
  /** Якорь секции: `#modeli-{slug}`. */
  slug: string;
  /** Заголовок секции (`h2`). */
  title: string;
  /** Одно-два предложения под заголовком: какие задачи решает группа. */
  lead: string;
  /** Разделы каталога в нужном порядке — по их `slug`. */
  categorySlugs: string[];
  /** Имя иконки из `SiteIcon`: знак группы в акцентном круге. */
  icon: string;
  /** Три коротких задачи группы — чипы под лидом. */
  tags: readonly string[];
}

/** Полка внутри секции: тот же раздел, но с номером «01 / 02» внутри своей надгруппы. */
export interface HomeModelShelf extends HomeModelGroup {
  numberLabel: string;
}

/** Секция главной: надгруппа и её полки с общими счётчиками. */
export interface HomeModelSection {
  slug: string;
  title: string;
  lead: string;
  /** «01» — номер секции подряд. */
  number: string;
  /** «01 / 04» — номер для кикера. */
  numberLabel: string;
  /** Имя иконки из `SiteIcon`. */
  icon: string;
  /** Чипы задач под лидом. */
  tags: readonly string[];
  shelves: HomeModelShelf[];
  /** «16 моделей» — по всем полкам секции. */
  modelsLabel: string;
  /** «2 раздела» — сколько полок внутри. */
  shelvesLabel: string;
  /** «13 500–28 000 ₽/смена» по всем моделям секции. */
  priceRange: string;
}

/**
 * Четыре надгруппы главной — по видам работ, а не по формальной классификации:
 * заказчик ищет «выкопать котлован» или «перевезти технику», а не «землеройную технику».
 * Порядок здесь задаёт порядок секций на странице.
 */
export const HOME_MODEL_SUPERGROUPS: readonly HomeModelSupergroup[] = [
  {
    slug: "zemlyanye-raboty",
    title: "Земляные работы",
    lead: "Снять грунт, выкопать котлован или траншею, забить сваи: экскаваторы и сваебойная техника с экипажем, доставка на объект.",
    categorySlugs: ["zemleroynaya-tehnika", "svaeboynaya-tehnika"],
    icon: "excavator",
    tags: ["Котлован", "Траншея", "Сваи"],
  },
  {
    slug: "pogruzka-i-podem",
    title: "Погрузка и подъём",
    lead: "Разгрузить машину, поднять груз на высоту, смонтировать конструкцию: погрузчики, автокраны, гусеничные краны и автовышки.",
    categorySlugs: ["pogruzochnaya-tehnika", "podyomnaya-tehnika"],
    icon: "crane",
    tags: ["Разгрузка", "Монтаж", "Работа на высоте"],
  },
  {
    slug: "dorogi-i-stroyka",
    title: "Дороги и стройплощадка",
    lead: "Подготовить основание, уложить асфальт, залить бетон: дорожно-ремонтная и строительная техника под линейные и площадные работы.",
    categorySlugs: ["dorozhno-remontnaya-tehnika", "stroitelnaya-tehnika"],
    icon: "roller",
    tags: ["Основание", "Асфальт", "Бетон"],
  },
  {
    slug: "perevozki-i-kommunalka",
    title: "Перевозки и коммунальное хозяйство",
    lead: "Вывезти грунт и мусор, перевезти технику, прочистить сети и полить дороги: самосвалы, манипуляторы, тралы и коммунальные машины.",
    categorySlugs: ["transportnaya-tehnika", "kommunalnaya-tehnika"],
    icon: "truck",
    tags: ["Вывоз грунта", "Перевозка техники", "Сети и полив"],
  },
];

/**
 * Запасная секция для разделов каталога, которых нет в конфиге выше: новый раздел,
 * добавленный в админке, не должен пропадать с главной. Порядок полок — как в каталоге.
 */
const FALLBACK_SUPERGROUP: HomeModelSupergroup = {
  slug: "drugaya-tehnika",
  title: "Другая техника",
  lead: "Разделы каталога, которые пока не вошли в группы выше: техника под точечные задачи.",
  categorySlugs: [],
  icon: "gear",
  tags: ["Спецзадачи", "Разные работы", "Под заказ"],
};

/**
 * Раскладывает полки разделов по надгруппам и нумерует секции.
 *
 * Порядок секций — из конфига, порядок полок внутри секции — порядок `categorySlugs`
 * в конфиге (а не каталога: так «главный» раздел группы можно поднять наверх).
 * Пустые надгруппы не выводятся: раздел без моделей не рисует пустую секцию целиком.
 * Полки, не попавшие ни в одну надгруппу, уходят в запасную секцию «Другая техника».
 */
export function groupModelsBySupergroup(
  shelves: HomeModelGroup[],
  supergroups: readonly HomeModelSupergroup[] = HOME_MODEL_SUPERGROUPS,
): HomeModelSection[] {
  const byCategory = new Map(shelves.map((shelf) => [shelf.category.slug, shelf]));
  const used = new Set<string>();
  const drafts: Array<Omit<HomeModelSection, "number" | "numberLabel">> = [];

  for (const supergroup of supergroups) {
    const own: HomeModelGroup[] = [];

    for (const slug of supergroup.categorySlugs) {
      const shelf = byCategory.get(slug);
      if (!shelf || used.has(slug)) continue;

      own.push(shelf);
      used.add(slug);
    }

    if (own.length) drafts.push(buildDraft(supergroup, own));
  }

  const rest = shelves.filter((shelf) => !used.has(shelf.category.slug));
  if (rest.length) drafts.push(buildDraft(FALLBACK_SUPERGROUP, rest));

  const total = String(drafts.length).padStart(2, "0");

  return drafts.map((draft, index) => {
    const number = String(index + 1).padStart(2, "0");

    return {
      ...draft,
      number,
      numberLabel: `${number} / ${total}`,
    };
  });
}

function buildDraft(
  supergroup: HomeModelSupergroup,
  shelves: HomeModelGroup[],
): Omit<HomeModelSection, "number" | "numberLabel"> {
  const models = shelves.flatMap((shelf) => shelf.models);
  const total = String(shelves.length).padStart(2, "0");

  return {
    slug: supergroup.slug,
    title: supergroup.title,
    lead: supergroup.lead,
    icon: supergroup.icon,
    tags: supergroup.tags,
    shelves: shelves.map((shelf, index) => ({
      ...shelf,
      numberLabel: `${String(index + 1).padStart(2, "0")} / ${total}`,
    })),
    modelsLabel: modelsCountLabel(models.length),
    shelvesLabel: `${shelves.length} ${pluralRu(shelves.length, ["раздел", "раздела", "разделов"])}`,
    priceRange: priceRangeLabel(models),
  };
}
