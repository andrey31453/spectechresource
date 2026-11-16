import * as v from "valibot";
import { describe, expect, it } from "vitest";
import {
  CityCreateSchema,
  CityUpdateSchema,
  SiteSettingsUpdateSchema,
  toAdminSettingsFieldErrors,
} from "#shared/schemas/admin-settings";

/** Ошибки валидации в формате API — так их читают формы. */
function errors(schema: v.GenericSchema, input: unknown) {
  const parsed = v.safeParse(schema, input);
  return parsed.success ? [] : toAdminSettingsFieldErrors(parsed.issues);
}

function fields(schema: v.GenericSchema, input: unknown) {
  return errors(schema, input).map((error) => error.field);
}

const validSettings = {
  companyName: "Спецтехресурс",
  phone: "+7 (495) 000-00-00",
  email: "info@example.ru",
  telegram: "@spectech",
  whatsapp: null,
  maxMessenger: " ",
  workingHours: "Пн–Вс, 08:00–20:00",
  address: "Москва, адрес уточняется",
  cityId: "city-1",
  mapLat: "55,7558",
  mapLng: 37.6173,
  legalName: "ООО «Спецтехресурс»",
  inn: "7701234567",
  ogrn: "1234567890123",
  legalAddress: "Москва, ул. Примерная, 1",
  priceDisclaimer: "Цены не являются публичной офертой",
  metrikaId: " 12345678 ",
};

function settingsWith(overrides: Record<string, unknown>) {
  return { ...validSettings, ...overrides };
}

describe("SiteSettingsUpdateSchema", () => {
  it("принимает значения сида, приводит координаты и обрезает ID Метрики", () => {
    const parsed = v.safeParse(SiteSettingsUpdateSchema, validSettings);

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    expect(parsed.output.mapLat).toBeCloseTo(55.7558);
    expect(parsed.output.mapLng).toBeCloseTo(37.6173);
    expect(parsed.output.metrikaId).toBe("12345678");
    expect(parsed.output.maxMessenger).toBeNull();
  });

  it("телефон: отображаемый вид можно, буквы нельзя", () => {
    expect(fields(SiteSettingsUpdateSchema, settingsWith({ phone: "8 800 000-00-00" }))).toEqual([]);
    expect(fields(SiteSettingsUpdateSchema, settingsWith({ phone: "позвоните нам" }))).toContain("phone");
  });

  it("координаты вне диапазона и мусор отклоняются", () => {
    expect(fields(SiteSettingsUpdateSchema, settingsWith({ mapLat: "120" }))).toContain("mapLat");
    expect(fields(SiteSettingsUpdateSchema, settingsWith({ mapLng: "37,6173" }))).toEqual([]);
    expect(fields(SiteSettingsUpdateSchema, settingsWith({ mapLng: "восток" }))).toContain("mapLng");
  });

  it("пустые необязательные поля становятся null", () => {
    const parsed = v.safeParse(
      SiteSettingsUpdateSchema,
      settingsWith({
        email: " ",
        telegram: "",
        whatsapp: "",
        maxMessenger: "",
        workingHours: "",
        address: "",
        mapLat: "",
        mapLng: null,
        legalName: "",
        inn: "",
        ogrn: "",
        legalAddress: "",
        metrikaId: "",
      }),
    );

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    expect(parsed.output).toMatchObject({
      email: null,
      telegram: null,
      mapLat: null,
      mapLng: null,
      inn: null,
      metrikaId: null,
    });
  });

  it("ИНН и ОГРН принимают только цифры нужной длины", () => {
    expect(fields(SiteSettingsUpdateSchema, settingsWith({ inn: "770123456" }))).toContain("inn");
    expect(fields(SiteSettingsUpdateSchema, settingsWith({ inn: "770123456789" }))).toEqual([]);
    expect(fields(SiteSettingsUpdateSchema, settingsWith({ ogrn: "12345678901234" }))).toContain("ogrn");
    expect(fields(SiteSettingsUpdateSchema, settingsWith({ ogrn: "123456789012345" }))).toEqual([]);
  });

  it("e-mail, обязательные тексты и город проверяются", () => {
    expect(fields(SiteSettingsUpdateSchema, settingsWith({ email: "почта" }))).toContain("email");
    expect(fields(SiteSettingsUpdateSchema, settingsWith({ companyName: "   " }))).toContain("companyName");
    expect(fields(SiteSettingsUpdateSchema, settingsWith({ priceDisclaimer: "" }))).toContain("priceDisclaimer");
    expect(fields(SiteSettingsUpdateSchema, settingsWith({ cityId: " " }))).toContain("cityId");
  });
});

describe("CityCreateSchema", () => {
  it("подставляет порядок, активность и «не по умолчанию»", () => {
    const parsed = v.safeParse(CityCreateSchema, { slug: " Kazan ", name: "Казань", nameIn: "Казани" });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    expect(parsed.output).toMatchObject({
      slug: "kazan",
      sortOrder: 10,
      isDefault: false,
      isActive: true,
    });
  });

  it("код города проверяется по общим правилам каталога", () => {
    expect(fields(CityCreateSchema, { slug: "Казань", name: "Казань", nameIn: "Казани" })).toContain("slug");
  });
});

describe("CityUpdateSchema", () => {
  it("пустой объект допустим: PATCH меняет только переданные поля", () => {
    const parsed = v.safeParse(CityUpdateSchema, {});

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.output).toEqual({});
  });

  it("нормализует код и проверяет название", () => {
    expect(fields(CityUpdateSchema, { slug: " Novosibirsk " })).toEqual([]);
    expect(fields(CityUpdateSchema, { nameIn: " " })).toContain("nameIn");
  });
});
