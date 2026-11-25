import { describe, expect, it } from "vitest";
import type { HomeModelDto } from "~/types/catalog";
import type { HomeModelSupergroup } from "~/utils/model-groups";
import { groupModelsBySupergroup, HOME_MODEL_SUPERGROUPS } from "~/utils/model-groups";
import { groupModelsByCategory } from "~/utils/models";
import { modelPage, showcaseShelf } from "~/utils/model-showcase";

describe("modelPage", () => {
  it("делит модели на страницы и сохраняет неполную последнюю", () => {
    expect(modelPage([1, 2, 3, 4, 5], 1, 2)).toEqual({ count: 3, index: 1, models: [3, 4] });
    expect(modelPage([1, 2, 3, 4, 5], 2, 2).models).toEqual([5]);
  });
  it("ограничивает страницу после изменения ширины и обрабатывает пустой список", () => {
    expect(modelPage([1, 2, 3], 9, 4)).toEqual({ count: 1, index: 0, models: [1, 2, 3] });
    expect(modelPage([], -1, 0)).toEqual({ count: 0, index: 0, models: [] });
  });
});

/** Intl разделяет разряды неразрывным пробелом — как в `price.ts`. */
const NBSP = "\u00A0";

/** Минимальная модель: тесты проверяют только поля, нужные группировке. */
function model(patch: Partial<HomeModelDto> & { id: string; categorySlug: string }): HomeModelDto {
  return {
    typeSlug: "avtokrana",
    typeName: "Автокраны",
    slug: "test-model",
    brand: "Ivanovets",
    model: "KS-45717",
    shortDesc: null,
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

describe("groupModelsBySupergroup", () => {
  it("объединяет разделы в одну витрину с чередованием моделей", () => {
    const own = shelves();
    own[0]!.models.push(model({ id: "e2", categorySlug: "zemleroynaya-tehnika" }));
    const section = groupModelsBySupergroup(own, [supergroup({ slug: "all", categorySlugs: categories.map(c => c.slug) })])[0]!;
    expect(showcaseShelf(section).models.map(m => m.id)).toEqual(["e1", "l1", "t1", "e2"]);
    expect(showcaseShelf(section, "pogruzochnaya-tehnika").models.map(m => m.id)).toEqual(["l1"]);
    expect(showcaseShelf(section, "missing").models).toEqual([]);
  });
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
