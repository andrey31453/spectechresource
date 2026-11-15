import { describe, expect, it } from "vitest";
import type { Decimalish } from "~~/server/utils/dto";
import { money, toCity, toFaq, toSite, toTypeCard } from "~~/server/utils/dto";

/** Prisma-`Decimal` в тестах не нужен: контракт `money` — любой объект с `toFixed`. */
const decimal = (value: string): Decimalish => ({ toFixed: () => value });

describe("money", () => {
  it("отдаёт Decimal строкой с двумя знаками", () => {
    expect(money(decimal("26000.00"))).toBe("26000.00");
    expect(money(decimal("0.00"))).toBe("0.00");
  });

  it("null и undefined означают «цена по запросу»", () => {
    expect(money(null)).toBeNull();
    expect(money(undefined)).toBeNull();
  });
});

describe("toCity", () => {
  it("оставляет только slug, name, nameIn", () => {
    expect(toCity({ slug: "moskva", name: "Москва", nameIn: "Москве", id: "c1" } as never)).toEqual({
      slug: "moskva",
      name: "Москва",
      nameIn: "Москве",
    });
  });
});

describe("toTypeCard", () => {
  it("превращает Decimal в строку и сохраняет единицу цены", () => {
    expect(
      toTypeCard({
        slug: "gusenichnogo-ekskavatora",
        name: "Гусеничные экскаваторы",
        nameGenitive: "гусеничного экскаватора",
        priceFrom: decimal("26000.00"),
        priceUnit: "SHIFT",
      }),
    ).toEqual({
      slug: "gusenichnogo-ekskavatora",
      name: "Гусеничные экскаваторы",
      nameGenitive: "гусеничного экскаватора",
      priceFrom: "26000.00",
      priceUnit: "SHIFT",
    });
  });

  it("без цены отдаёт null, а не 0", () => {
    expect(
      toTypeCard({
        slug: "transheekopatel",
        name: "Траншеекопатели",
        nameGenitive: "траншеекопателя",
        priceFrom: null,
        priceUnit: "PER_METER",
      }).priceFrom,
    ).toBeNull();
  });
});

describe("toSite", () => {
  it("отдаёт все поля настроек и вложенный город без id", () => {
    const site = toSite({
      companyName: "ООО «СПЕЦТЕХРЕСУРС»",
      phone: "+7 (495) 000-00-00",
      email: "info@example.com",
      telegram: "https://t.me/example",
      whatsapp: null,
      maxMessenger: null,
      workingHours: "Пн–Пт, 9:00–19:00",
      address: "Москва, ул. Примерная, 1",
      mapLat: 55.75,
      mapLng: 37.61,
      legalName: "ООО «СПЕЦТЕХРЕСУРС»",
      inn: "7700000000",
      ogrn: "1157700000000",
      legalAddress: "Москва, ул. Примерная, 1",
      priceDisclaimer: "Цены не являются публичной офертой.",
      metrikaId: "12345678",
      city: { slug: "moskva", name: "Москва", nameIn: "Москве" },
    });

    expect(site.city).toEqual({ slug: "moskva", name: "Москва", nameIn: "Москве" });
    expect(Object.keys(site).sort()).toEqual(
      [
        "address",
        "city",
        "companyName",
        "email",
        "inn",
        "legalAddress",
        "legalName",
        "mapLat",
        "mapLng",
        "maxMessenger",
        "metrikaId",
        "ogrn",
        "phone",
        "priceDisclaimer",
        "telegram",
        "whatsapp",
        "workingHours",
      ].sort(),
    );
  });
});

describe("toFaq", () => {
  it("отдаёт только вопрос и ответ — без id и служебных полей", () => {
    expect(
      toFaq([
        { question: "Нужен ли договор?", answer: "Да, работаем с юрлицами.", id: "f1" } as never,
      ]),
    ).toEqual([{ question: "Нужен ли договор?", answer: "Да, работаем с юрлицами." }]);
  });

  it("на пустом массиве возвращает пустой массив", () => {
    expect(toFaq([])).toEqual([]);
  });
});
