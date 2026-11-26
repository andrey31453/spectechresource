import { describe, expect, it } from "vitest";
import type { Decimalish } from "~~/server/utils/dto";
import { money, toCity, toFaq, toHomeModel, toSite, toTypeCard } from "~~/server/utils/dto";

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
      image: null,
    });
  });

  it("первое фото галереи становится обложкой карточки", () => {
    expect(
      toTypeCard({
        slug: "mini-ekskavatora",
        name: "Мини-экскаваторы",
        nameGenitive: "мини-экскаватора",
        priceFrom: null,
        priceUnit: "SHIFT",
        gallery: ["/uploads/type-cover.webp", "/uploads/type-2.webp"],
      }).image,
    ).toBe("/uploads/type-cover.webp");
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

describe("toHomeModel", () => {
  const model = {
    id: "m1",
    slug: "test-model",
    brand: "Hitachi",
    model: "ZX200-5G",
    shortDesc: "Разработка котлованов",
    pricePerShift: decimal("28000.00"),
    pricePerHour: decimal("4000.00"),
    photos: ["/uploads/model-cover.webp", "/uploads/model-2.webp"],
    specs: [
      { name: "Масса, т", value: "20" },
      { name: "Глубина копания, м", value: "6,7" },
    ],
    type: {
      slug: "gusenichnogo-ekskavatora",
      name: "Гусеничные экскаваторы",
      category: { slug: "zemlyanye-raboty" },
    },
  };

  it("отдаёт цены строками, первое фото и характеристики без sortOrder", () => {
    expect(toHomeModel(model)).toEqual({
      id: "m1",
      categorySlug: "zemlyanye-raboty",
      typeSlug: "gusenichnogo-ekskavatora",
      typeName: "Гусеничные экскаваторы",
      slug: "test-model",
      brand: "Hitachi",
      model: "ZX200-5G",
      shortDesc: "Разработка котлованов",
      pricePerShift: "28000.00",
      pricePerHour: "4000.00",
      photo: "/uploads/model-cover.webp",
      photos: model.photos,
      specs: [
        { name: "Масса, т", value: "20" },
        { name: "Глубина копания, м", value: "6,7" },
      ],
    });
  });

  it("без фото и без цены за час отдаёт null — карточка рисует заглушку", () => {
    const dto = toHomeModel({ ...model, photos: [], pricePerHour: null });

    expect(dto.photo).toBeNull();
    expect(dto.pricePerHour).toBeNull();
  });

  it("не подменяет отсутствующее описание и сохраняет весь список характеристик", () => {
    const specs = [...model.specs, { name: "Ширина, м", value: "1,7" }];
    const dto = toHomeModel({ ...model, shortDesc: null, specs });
    expect(dto.shortDesc).toBeNull();
    expect(dto.specs).toEqual(specs);
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
