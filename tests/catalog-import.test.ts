import { describe, expect, it } from "vitest";
import { cleanText, htmlToText, inferSection, matchEquipmentType, mergeArchivedProducts, parseMoney, parsePrice, splitBrandModel, type ArchivedProduct } from "../server/utils/catalog-import";

describe("catalog import normalization", () => {
  it("normalizes whitespace and common entities", () => {
    expect(cleanText("  Каток XCMG\n XMR30S ")).toBe("Каток XCMG XMR30S");
    expect(htmlToText("<p>Масса&nbsp;3&nbsp;300 кг</p>")).toBe("Масса 3 300 кг");
  });

  it("parses hourly and shift prices", () => {
    expect(parsePrice("Цена за час 875 руб/час, цена за смену 7 000 руб/смена", "hour")).toBe("875.00");
    expect(parsePrice("Цена за час 875 руб/час, цена за смену 7 000 руб/смена", "shift")).toBe("7000.00");
    expect(parseMoney(" 140 000 ₽ ")).toBe("140000.00");
    expect(parseMoney("Договорная")).toBeNull();
    expect(parsePrice("Цена по запросу", "shift")).toBeNull();
  });

  it("uses the source section for one category mapping", () => {
    expect(inferSection("https://aksgroup.moscow/arenda-samosvalov/samosval-volvo")).toBe("самосвалы");
    expect(matchEquipmentType("arenda-samosvalov", [{ id: "1", name: "Самосвалы", slug: "samosvala" }])?.id).toBe("1");
    expect(matchEquipmentType("Катки", [{ id: "2", name: "Катки", slug: "katka" }])?.id).toBe("2");
  });

  it("splits a common equipment title", () => {
    expect(splitBrandModel("Аренда катка XCMG XMR30S")).toEqual({ brand: "XCMG", model: "XMR30S" });
    expect(splitBrandModel("Аренда экскаватора-разрушителя «Caterpillar 345C UHD»")).toEqual({ brand: "Caterpillar", model: "345C UHD" });
  });

  it("leaves the generic excavator section unmatched instead of classifying its products", () => {
    expect(matchEquipmentType("Аренда экскаваторов", [{ id: "1", name: "Экскаваторы-разрушители", slug: "ekskavatora-razrushitelya" }])).toBeNull();
  });

  it("maps abbreviated MSG crane sections without confusing excavators and cranes", () => {
    const types = [{ id: "excavator", name: "Гусеничные экскаваторы", slug: "gusenichnogo-ekskavatora" }, { id: "crane", name: "Гусеничные краны", slug: "gusenichnogo-krana" }];
    expect(matchEquipmentType("Гусеничные", types)?.id).toBe("crane");
    expect(matchEquipmentType("Гусеничные экскаваторы", types)?.id).toBe("excavator");
  });
});

const product = (overrides: Partial<ArchivedProduct> = {}): ArchivedProduct => ({ source: "msg-spectech", sourceSection: "Мини-экскаваторы", title: "Bobcat E50", brand: "Bobcat", model: "E50", description: "Описание", specs: [], pricePerHour: null, pricePerShift: null, photos: ["/uploads/a.webp"], typeId: "mini", isPublished: true, ...overrides });

describe("archive deduplication", () => {
  it("merges photos, paragraphs and specs and selects each minimum price independently", () => {
    const a = product({ description: "Общее\n\nПервое", pricePerHour: "1200.00", pricePerShift: "7000.00", specs: [{ name: "Масса", value: "4 900" }] });
    const b = product({ source: "aksgroup", description: "Общее\n\nВторое", pricePerHour: "1000.00", pricePerShift: "8000.00", photos: ["/uploads/a.webp", "/uploads/b.webp"], specs: [{ name: "Масса", value: "4900" }, { name: "Мощность", value: "50" }] });
    const snapshot = JSON.stringify([a, b]);
    const result = mergeArchivedProducts([a, b]);
    expect(result.products).toHaveLength(1);
    expect(result.products[0]).toMatchObject({ description: "Общее\n\nПервое\n\nВторое", pricePerHour: "1000.00", pricePerShift: "7000.00", photos: ["/uploads/a.webp", "/uploads/b.webp"], isPublished: true });
    expect(result.products[0]!.specs).toHaveLength(2);
    expect(result.merges[0]!.conflicts).toEqual([]);
    expect(JSON.stringify([a, b])).toBe(snapshot);
  });

  it("unpublishes conflicting models, warns first and keeps only the smaller spec", () => {
    const result = mergeArchivedProducts([product({ specs: [{ name: "Вылет", value: "22" }] }), product({ specs: [{ name: "Вылет", value: "18,8 м" }] })]);
    expect(result.products[0]).toMatchObject({ isPublished: false, typeId: "mini", specs: [{ name: "Вылет", value: "18,8 м" }] });
    expect(result.products[0]!.description).toMatch(/^ВНИМАНИЕ: обнаружено несоответствие/);
    expect(result.products[0]!.description).toContain("вариант 1 — 22; вариант 2 — 18,8 м");
    expect(mergeArchivedProducts(result.products).products).toEqual(result.products);
  });

  it("keeps unknown prices null, accepts zero and removes price specs in merged cards", () => {
    const result = mergeArchivedProducts([product({ specs: [{ name: "Цена за смену", value: "5000 руб." }] }), product({ pricePerHour: "0.00" })]);
    expect(result.products[0]).toMatchObject({ pricePerHour: "0.00", pricePerShift: null, specs: [] });
  });

  it("does not merge different types or unknown source sections", () => {
    expect(mergeArchivedProducts([product(), product({ typeId: "other" }), product({ typeId: null }), product({ typeId: null, sourceSection: "Экскаваторы" })]).products).toHaveLength(4);
  });

  it("corrects crane identities without merging different capacities", () => {
    expect(splitBrandModel("Автокран 100 тонн «Галичанин»")).toEqual({ brand: "Галичанин", model: "100 тонн" });
    const result = mergeArchivedProducts([product({ title: "Автокран 50 тонн «Liebherr»", brand: "Liebherr", model: "Liebherr" }), product({ title: "Автокран 60 тонн «Liebherr»", brand: "Liebherr", model: "Liebherr" })]);
    expect(result.products.map((item) => item.model)).toEqual(["50 тонн", "60 тонн"]);
  });

  it("fails safely on textual conflicts or incompatible units instead of inventing a minimum", () => {
    expect(() => mergeArchivedProducts([product({ specs: [{ name: "Кабина", value: "Открытая" }] }), product({ specs: [{ name: "Кабина", value: "Закрытая" }] })])).toThrow("Нельзя выбрать меньшее");
    expect(() => mergeArchivedProducts([product({ specs: [{ name: "Масса", value: "5 т" }] }), product({ specs: [{ name: "Масса", value: "4900 кг" }] })])).toThrow("Разные единицы");
    expect(() => mergeArchivedProducts([product({ pricePerHour: "ошибка" }), product()])).toThrow("Некорректная цена");
  });
});