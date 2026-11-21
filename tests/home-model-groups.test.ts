import { describe, expect, it } from "vitest";
import type { HomeModelDto } from "~/types/catalog";
import type { HomeModelSupergroup, HomeModelTone } from "~/utils/model-groups";
import {
  groupModelsBySupergroup,
  HOME_MODEL_SUPERGROUPS,
  HOME_MODEL_TONES,
  HOME_MODEL_TONE_STYLES,
  sectionStyleVars,
  toneStyle,
} from "~/utils/model-groups";
import { groupModelsByCategory } from "~/utils/models";

/** Intl разделяет разряды неразрывным пробелом — как в `price.ts`. */
const NBSP = "\u00A0";

/** Минимальная модель: тесты проверяют только поля, нужные группировке. */
function model(patch: Partial<HomeModelDto> & { id: string; categorySlug: string }): HomeModelDto {
  return {
    typeSlug: "avtokrana",
    typeName: "Автокраны",
    brand: "Ivanovets",
    model: "KS-45717",
    pricePerShift: "26000.00",
    pricePerHour: null,
    photo: null,
    specs: [],
    ...patch,
  };
}

const categories = [
  { slug: "zemleroynaya-tehnika", title: "Землеройная техника" },
  { slug: "pogruzochnaya-tehnika", title: "Погрузочная техника" },
  { slug: "transportnaya-tehnika", title: "Транспортная техника" },
];

/** Полки трёх разделов — вход для `groupModelsBySupergroup`. */
function shelves(prices: { earth?: string; loading?: string; transport?: string } = {}) {
  const items = [
    model({
      id: "e1",
      categorySlug: "zemleroynaya-tehnika",
      pricePerShift: prices.earth ?? "20000.00",
    }),
    model({
      id: "l1",
      categorySlug: "pogruzochnaya-tehnika",
      pricePerShift: prices.loading ?? "12000.00",
    }),
    model({
      id: "t1",
      categorySlug: "transportnaya-tehnika",
      pricePerShift: prices.transport ?? "30000.00",
    }),
  ];

  return groupModelsByCategory(categories, items);
}

function supergroup(patch: Partial<HomeModelSupergroup> & { slug: string }): HomeModelSupergroup {
  return {
    title: patch.slug,
    lead: "Описание группы",
    categorySlugs: [],
    icon: "excavator",
    tags: ["Задача один", "Задача два", "Задача три"],
    ...patch,
  };
}

/** Относительная яркость цвета `#rrggbb` — по WCAG 2.1. */
function luminance(hex: string): number {
  const channels = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255);

  return channels
    .map((value) => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4))
    .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index]!, 0);
}

/** Контраст двух цветов: 1 — совпадают, 21 — чёрный на белом. */
function contrast(first: string, second: string): number {
  const [light, dark] = [luminance(first), luminance(second)].sort((a, b) => b - a);

  return (light! + 0.05) / (dark! + 0.05);
}

/**
 * Фон полосы тона для проверки контраста: светлая — `--color-sand`, чёрная —
 * `--color-night`. У оранжевой полосы берём средний тон градиента `--grad-flame`:
 * шапка секции и мелкий текст стоят в его левой половине.
 */
const TONE_BACKDROP: Record<HomeModelTone, string> = {
  light: "#f5f4ef",
  flame: "#ff7a2f",
  dark: "#0b0f13",
};

/** Роли тона, которые обязаны быть простыми `#rrggbb` (их проверяет контраст). */
const HEX_FIELDS = [
  "ink",
  "muted",
  "accent",
  "onAccent",
  "kicker",
  "cardHoverBg",
  "cardHoverInk",
  "cardHoverPrice",
  "cardHoverBar",
  "cardHoverBorder",
  "cardHoverGoBg",
  "cardHoverGoInk",
] as const;

describe("groupModelsBySupergroup", () => {
  it("раскладывает полки по надгруппам в порядке конфига", () => {
    const sections = groupModelsBySupergroup(shelves(), [
      supergroup({ slug: "transport", categorySlugs: ["transportnaya-tehnika"] }),
      supergroup({ slug: "earth", categorySlugs: ["zemleroynaya-tehnika"] }),
      supergroup({ slug: "loading", categorySlugs: ["pogruzochnaya-tehnika"] }),
    ]);

    expect(sections.map((section) => section.slug)).toEqual(["transport", "earth", "loading"]);
  });

  it("порядок полок внутри секции задаёт конфиг, а не каталог", () => {
    const sections = groupModelsBySupergroup(shelves(), [
      supergroup({
        slug: "earth",
        categorySlugs: ["pogruzochnaya-tehnika", "zemleroynaya-tehnika"],
      }),
    ]);

    expect(sections[0]?.shelves.map((shelf) => shelf.category.slug)).toEqual([
      "pogruzochnaya-tehnika",
      "zemleroynaya-tehnika",
    ]);
  });

  it("не выводит секции, в которых нет ни одной полки", () => {
    const sections = groupModelsBySupergroup(shelves(), [
      supergroup({ slug: "empty", categorySlugs: ["svaeboynaya-tehnika"] }),
      supergroup({ slug: "earth", categorySlugs: ["zemleroynaya-tehnika"] }),
      supergroup({ slug: "loading", categorySlugs: ["pogruzochnaya-tehnika"] }),
      supergroup({ slug: "transport", categorySlugs: ["transportnaya-tehnika"] }),
    ]);

    expect(sections.map((section) => section.slug)).toEqual(["earth", "loading", "transport"]);
  });

  it("собирает разделы вне конфига в секцию «Другая техника»", () => {
    const sections = groupModelsBySupergroup(shelves(), [
      supergroup({ slug: "earth", categorySlugs: ["zemleroynaya-tehnika"] }),
    ]);

    expect(sections.map((section) => section.slug)).toEqual(["earth", "drugaya-tehnika"]);
    expect(sections[1]?.title).toBe("Другая техника");
    expect(sections[1]?.shelves.map((shelf) => shelf.category.slug)).toEqual([
      "pogruzochnaya-tehnika",
      "transportnaya-tehnika",
    ]);
  });

  it("не дублирует полку, если раздел указан в двух надгруппах", () => {
    const sections = groupModelsBySupergroup(shelves(), [
      supergroup({
        slug: "first",
        categorySlugs: ["zemleroynaya-tehnika", "transportnaya-tehnika"],
      }),
      supergroup({ slug: "second", categorySlugs: ["zemleroynaya-tehnika"] }),
    ]);

    expect(sections.map((section) => section.slug)).toEqual(["first", "drugaya-tehnika"]);
    expect(sections[0]?.shelves.map((shelf) => shelf.category.slug)).toEqual([
      "zemleroynaya-tehnika",
      "transportnaya-tehnika",
    ]);
    expect(sections[1]?.shelves.map((shelf) => shelf.category.slug)).toEqual([
      "pogruzochnaya-tehnika",
    ]);
  });

  it("нумерует секции подряд и полки внутри секции", () => {
    const sections = groupModelsBySupergroup(shelves(), [
      supergroup({
        slug: "earth",
        categorySlugs: ["zemleroynaya-tehnika", "pogruzochnaya-tehnika"],
      }),
      supergroup({ slug: "transport", categorySlugs: ["transportnaya-tehnika"] }),
    ]);

    expect(sections.map((section) => section.number)).toEqual(["01", "02"]);
    expect(sections.map((section) => section.numberLabel)).toEqual(["01 / 02", "02 / 02"]);
    expect(sections[0]?.shelves.map((shelf) => shelf.numberLabel)).toEqual(["01 / 02", "02 / 02"]);
    expect(sections[1]?.shelves.map((shelf) => shelf.numberLabel)).toEqual(["01 / 01"]);
  });

  it("считает модели, разделы и диапазон цен по всей секции", () => {
    const sections = groupModelsBySupergroup(
      shelves({ earth: "18500.00", loading: "12000.00", transport: "30000.00" }),
      [
        supergroup({
          slug: "earth",
          categorySlugs: ["zemleroynaya-tehnika", "pogruzochnaya-tehnika"],
        }),
      ],
    );

    expect(sections[0]?.modelsLabel).toBe("2 модели");
    expect(sections[0]?.shelvesLabel).toBe("2 раздела");
    expect(sections[0]?.priceRange).toBe(`12${NBSP}000–18${NBSP}500 ₽/смена`);
    expect(sections[1]?.modelsLabel).toBe("1 модель");
    expect(sections[1]?.shelvesLabel).toBe("1 раздел");
  });

  it("переносит в секцию иконку и чипы задач", () => {
    const sections = groupModelsBySupergroup(shelves(), [
      supergroup({
        slug: "lift",
        categorySlugs: ["pogruzochnaya-tehnika"],
        icon: "crane",
        tags: ["Разгрузка", "Монтаж", "Высота"],
      }),
    ]);

    expect(sections[0]?.icon).toBe("crane");
    expect(sections[0]?.tags).toEqual(["Разгрузка", "Монтаж", "Высота"]);
  });

  it("чередует фирменные полосы: светлая, оранжевая, чёрная — по кругу", () => {
    const all = groupModelsByCategory(
      [
        { slug: "zemleroynaya-tehnika", title: "Землеройная техника" },
        { slug: "pogruzochnaya-tehnika", title: "Погрузочная техника" },
        { slug: "transportnaya-tehnika", title: "Транспортная техника" },
        { slug: "kommunalnaya-tehnika", title: "Коммунальная техника" },
      ],
      [
        model({ id: "e1", categorySlug: "zemleroynaya-tehnika" }),
        model({ id: "l1", categorySlug: "pogruzochnaya-tehnika" }),
        model({ id: "t1", categorySlug: "transportnaya-tehnika" }),
        model({ id: "k1", categorySlug: "kommunalnaya-tehnika" }),
      ],
    );

    const sections = groupModelsBySupergroup(all, [
      supergroup({ slug: "a", categorySlugs: ["zemleroynaya-tehnika"] }),
      supergroup({ slug: "b", categorySlugs: ["pogruzochnaya-tehnika"] }),
      supergroup({ slug: "c", categorySlugs: ["transportnaya-tehnika"] }),
      supergroup({ slug: "d", categorySlugs: ["kommunalnaya-tehnika"] }),
    ]);

    expect(sections.map((section) => section.tone)).toEqual(["light", "flame", "dark", "light"]);
  });

  it("сохраняет все полки: сумма секций равна числу разделов с техникой", () => {
    const all = shelves();
    const sections = groupModelsBySupergroup(all, HOME_MODEL_SUPERGROUPS);
    const total = sections.reduce((sum, section) => sum + section.shelves.length, 0);

    expect(total).toBe(all.length);
  });
});

describe("HOME_MODEL_SUPERGROUPS", () => {
  it("покрывает все восемь разделов каталога и не повторяет их", () => {
    const slugs = HOME_MODEL_SUPERGROUPS.flatMap((group) => group.categorySlugs);

    expect(new Set(slugs).size).toBe(slugs.length);
    expect([...slugs].sort()).toEqual(
      [
        "dorozhno-remontnaya-tehnika",
        "kommunalnaya-tehnika",
        "podyomnaya-tehnika",
        "pogruzochnaya-tehnika",
        "stroitelnaya-tehnika",
        "svaeboynaya-tehnika",
        "transportnaya-tehnika",
        "zemleroynaya-tehnika",
      ].sort(),
    );
  });

  it("у каждой надгруппы есть заголовок и описание для секции", () => {
    for (const group of HOME_MODEL_SUPERGROUPS) {
      expect(group.title.length).toBeGreaterThan(3);
      expect(group.lead.length).toBeGreaterThan(20);
      expect(group.categorySlugs.length).toBeGreaterThan(0);
    }
  });

  it("даёт каждой надгруппе свою иконку", () => {
    const icons = HOME_MODEL_SUPERGROUPS.map((group) => group.icon);

    expect(new Set(icons).size).toBe(HOME_MODEL_SUPERGROUPS.length);
  });

  it("даёт каждой секции три коротких чипа задач", () => {
    for (const group of HOME_MODEL_SUPERGROUPS) {
      expect(group.tags).toHaveLength(3);

      for (const tag of group.tags) {
        expect(tag.trim()).toBe(tag);
        expect(tag.length).toBeGreaterThan(2);
        expect(tag.length).toBeLessThanOrEqual(24);
      }
    }
  });
});

describe("тоны секций моделей", () => {
  it("берёт фон готовыми полосами лендинга", () => {
    expect(HOME_MODEL_TONES.map((tone) => toneStyle(tone).className)).toEqual([
      "on-light",
      "flame-band",
      "process-band",
    ]);
  });

  it("отдаёт секции CSS-переменные тона и карточки", () => {
    const vars = sectionStyleVars("dark");
    const style = HOME_MODEL_TONE_STYLES.dark;

    expect(vars["--section-ink"]).toBe(style.ink);
    expect(vars["--section-accent"]).toBe(style.accent);
    expect(vars["--section-on-accent"]).toBe(style.onAccent);
    expect(vars["--section-kicker"]).toBe(style.kicker);
    expect(vars["--section-rail-bg"]).toBe(style.railBg);
    expect(vars["--card-border"]).toBe(style.cardBorder);
    expect(vars["--card-hover-bg"]).toBe(style.cardHoverBg);
    expect(vars["--card-hover-price"]).toBe(style.cardHoverPrice);
    // Переменная прошлой палитры не должна вернуться: её больше никто не ставит.
    expect(vars["--section-bright"]).toBeUndefined();
  });

  it("держит цвета тонов в формате #rrggbb", () => {
    for (const tone of HOME_MODEL_TONES) {
      for (const field of HEX_FIELDS) {
        expect(toneStyle(tone)[field], `${tone}.${field}`).toMatch(/^#[0-9a-f]{6}$/);
      }
    }
  });

  it("сохраняет читаемый контраст ролей на каждой полосе", () => {
    for (const tone of HOME_MODEL_TONES) {
      const style = toneStyle(tone);
      const backdrop = TONE_BACKDROP[tone];

      expect(contrast(style.ink, backdrop), `заголовок на полосе ${tone}`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(style.muted, backdrop), `лид на полосе ${tone}`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(style.kicker, backdrop), `кикер на полосе ${tone}`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(style.accent, backdrop), `акцент на полосе ${tone}`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(style.onAccent, style.accent), `иконка на акценте ${tone}`).toBeGreaterThanOrEqual(
        4.5,
      );
    }
  });

  it("даёт карточке радикальное, но читаемое наведение на каждой полосе", () => {
    for (const tone of HOME_MODEL_TONES) {
      const style = toneStyle(tone);

      // Наведение обязано отличаться от полосы, иначе карточка «исчезает» (3:1).
      expect(
        contrast(style.cardHoverBg, TONE_BACKDROP[tone]),
        `наведение на полосе ${tone}`,
      ).toBeGreaterThanOrEqual(3);
      expect(contrast(style.cardHoverInk, style.cardHoverBg), `текст карточки ${tone}`).toBeGreaterThanOrEqual(
        4.5,
      );
      expect(contrast(style.cardHoverPrice, style.cardHoverBg), `цена карточки ${tone}`).toBeGreaterThanOrEqual(
        4.5,
      );
      expect(
        contrast(style.cardHoverBorder, style.cardHoverBg),
        `рамка карточки ${tone}`,
      ).toBeGreaterThanOrEqual(3);
      expect(
        contrast(style.cardHoverGoInk, style.cardHoverGoBg),
        `стрелка карточки ${tone}`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  });
});

