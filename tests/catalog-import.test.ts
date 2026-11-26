import { describe, expect, it } from "vitest";
import { cleanText, htmlToText, inferSection, matchEquipmentType, parseMoney, parsePrice, splitBrandModel } from "../server/utils/catalog-import";

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