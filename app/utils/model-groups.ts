import type { HomeModelGroup } from "~/utils/models";
import { modelsCountLabel, priceRangeLabel } from "~/utils/models";
import { pluralRu } from "~/utils/plural";

/**
 * Тон секции — фирменная полоса главной. Фон берётся готовыми классами
 * `/landing/style.css` (`.on-light`, `.flame-band`, `.process-band`), поэтому
 * секции каталога выглядят как остальные блоки страницы, а не как отдельный мир.
 * Порядок в массиве задаёт чередование: светлая → оранжевая → чёрная → светлая.
 */
export const HOME_MODEL_TONES = ["light", "flame", "dark"] as const;

export type HomeModelTone = (typeof HOME_MODEL_TONES)[number];

/**
 * Цветовые роли тона. Одна запись на тон — единственный источник правды:
 * значения уходят CSS-переменными в секцию, их наследуют шапка, полки и карточки,
 * а тесты `tests/home-model-groups.test.ts` проверяют контраст этих же пар.
 */
export interface HomeModelToneStyle {
  /** Класс полосы лендинга: фон, сетка, глобальные правила текста. */
  className: string;
  /** Заголовки секции и полок. */
  ink: string;
  /** Счётчики, мета полок, лид, дисклеймер. */
  muted: string;
  /** Значок группы, черта полки, активная точка, рамки стрелок. */
  accent: string;
  /** Иконка внутри акцентного круга. */
  onAccent: string;
  /** Кикер «Каталог моделей · 01 / 04»: на оранжевой полосе он тёмный. */
  kicker: string;
  /** Плашка чипа задач под лидом. */
  chipBg: string;
  chipBorder: string;
  chipInk: string;
  /** Фон круглых стрелок полки: на тёмной полосе — почти прозрачный, иначе иконка тонет. */
  railBg: string;
  /** Рамка белой карточки в покое. */
  cardBorder: string;
  /** Карточка при наведении: фон и текст. */
  cardHoverBg: string;
  cardHoverInk: string;
  cardHoverMuted: string;
  cardHoverLine: string;
  cardHoverBorder: string;
  /** Цена, бренд, верхняя полоса и круглая стрелка в состоянии наведения. */
  cardHoverPrice: string;
  cardHoverBar: string;
  cardHoverGoBg: string;
  cardHoverGoInk: string;
}

/**
 * Три тона. Цвета — из фирменной системы лендинга:
 * `--color-sand #f5f4ef`, `--color-ink #0d1214`, `--color-ember-ink #b83c12`,
 * `--color-flame #ff7a2f`, `--color-mist #8fa1ad`, `--color-snow #eef2f4`.
 * Карточка всегда белая; наведение на светлой и оранжевой полосе инвертирует её
 * в графит, на чёрной — заливает оранжевым: на тёмном фоне графит не читался бы.
 */
export const HOME_MODEL_TONE_STYLES: Record<HomeModelTone, HomeModelToneStyle> = {
  light: {
    className: "on-light",
    ink: "#0d1214",
    muted: "#3d474b",
    accent: "#b83c12",
    onAccent: "#ffffff",
    kicker: "#b83c12",
    chipBg: "rgb(255 255 255 / 0.55)",
    chipBorder: "#b83c12",
    chipInk: "#b83c12",
    railBg: "rgb(255 255 255 / 0.55)",
    cardBorder: "#d8d2c0",
    cardHoverBg: "#0d1214",
    cardHoverInk: "#ffffff",
    cardHoverMuted: "rgb(255 255 255 / 0.72)",
    cardHoverLine: "rgb(255 255 255 / 0.18)",
    cardHoverBorder: "#ff7a2f",
    cardHoverPrice: "#ff7a2f",
    cardHoverBar: "#ff7a2f",
    cardHoverGoBg: "#ff7a2f",
    cardHoverGoInk: "#0d1214",
  },
  flame: {
    className: "flame-band",
    ink: "#14100a",
    muted: "#2b1a10",
    accent: "#14100a",
    onAccent: "#ffffff",
    kicker: "#14100a",
    chipBg: "rgb(20 16 10 / 0.08)",
    chipBorder: "rgb(20 16 10 / 0.4)",
    chipInk: "#14100a",
    railBg: "rgb(255 255 255 / 0.55)",
    cardBorder: "rgb(20 16 10 / 0.28)",
    cardHoverBg: "#0d1214",
    cardHoverInk: "#ffffff",
    cardHoverMuted: "rgb(255 255 255 / 0.72)",
    cardHoverLine: "rgb(255 255 255 / 0.18)",
    cardHoverBorder: "#ff9c4a",
    cardHoverPrice: "#ff9c4a",
    cardHoverBar: "#ff9c4a",
    cardHoverGoBg: "#ff9c4a",
    cardHoverGoInk: "#0d1214",
  },
  dark: {
    className: "process-band",
    ink: "#eef2f4",
    muted: "#8fa1ad",
    accent: "#ff7a2f",
    onAccent: "#14100a",
    kicker: "#ff7a2f",
    chipBg: "rgb(255 255 255 / 0.06)",
    chipBorder: "rgb(255 122 47 / 0.55)",
    chipInk: "#ff7a2f",
    railBg: "rgb(255 255 255 / 0.06)",
    cardBorder: "rgb(255 255 255 / 0.2)",
    cardHoverBg: "#ff7a2f",
    cardHoverInk: "#14100a",
    cardHoverMuted: "rgb(20 16 10 / 0.72)",
    cardHoverLine: "rgb(20 16 10 / 0.28)",
    cardHoverBorder: "#14100a",
    cardHoverPrice: "#14100a",
    cardHoverBar: "#14100a",
    cardHoverGoBg: "#14100a",
    cardHoverGoInk: "#ff7a2f",
  },
};

/** Оформление тона: одна запись `HOME_MODEL_TONE_STYLES` без копирования полей. */
export function toneStyle(tone: HomeModelTone): HomeModelToneStyle {
  return HOME_MODEL_TONE_STYLES[tone];
}

/**
 * CSS-переменные секции: их наследуют шапка, полки и карточки. Отдаются инлайном
 * в `:style` секции — так цвета тона заданы в одном месте (TS), а не размазаны
 * по шаблону и scoped-стилям.
 */
export function sectionStyleVars(tone: HomeModelTone): Record<string, string> {
  const style = toneStyle(tone);

  return {
    "--section-ink": style.ink,
    "--section-muted": style.muted,
    "--section-accent": style.accent,
    "--section-on-accent": style.onAccent,
    "--section-kicker": style.kicker,
    "--section-chip-bg": style.chipBg,
    "--section-chip-border": style.chipBorder,
    "--section-chip-ink": style.chipInk,
    "--section-rail-bg": style.railBg,
    "--card-border": style.cardBorder,
    "--card-hover-bg": style.cardHoverBg,
    "--card-hover-ink": style.cardHoverInk,
    "--card-hover-muted": style.cardHoverMuted,
    "--card-hover-line": style.cardHoverLine,
    "--card-hover-border": style.cardHoverBorder,
    "--card-hover-price": style.cardHoverPrice,
    "--card-hover-bar": style.cardHoverBar,
    "--card-hover-go-bg": style.cardHoverGoBg,
    "--card-hover-go-ink": style.cardHoverGoInk,
  };
}

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
  /** Фирменная полоса секции: светлая, оранжевая, чёрная — по кругу. */
  tone: HomeModelTone;
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
  const drafts: Array<Omit<HomeModelSection, "number" | "numberLabel" | "tone">> = [];

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
      tone: HOME_MODEL_TONES[index % HOME_MODEL_TONES.length]!,
    };
  });
}

function buildDraft(
  supergroup: HomeModelSupergroup,
  shelves: HomeModelGroup[],
): Omit<HomeModelSection, "number" | "numberLabel" | "tone"> {
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
