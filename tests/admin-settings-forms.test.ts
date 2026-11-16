import { describe, expect, it } from "vitest";
import type { AdminCityDto, AdminSiteSettingsDto } from "~/types/admin-settings";
import {
  cityFormBody,
  cityFormFrom,
  emptyCityForm,
  emptySettingsForm,
  settingsFormBody,
  settingsFormFrom,
} from "~/utils/admin-settings-forms";

const settingsDto: AdminSiteSettingsDto = {
  companyName: "Спецтехресурс",
  phone: "+7 (495) 000-00-00",
  email: null,
  telegram: "@spectech",
  whatsapp: null,
  maxMessenger: null,
  workingHours: null,
  address: "Москва, адрес уточняется",
  cityId: "city-1",
  mapLat: 55.7558,
  mapLng: null,
  legalName: null,
  inn: null,
  ogrn: null,
  legalAddress: null,
  priceDisclaimer: "Цены не являются публичной офертой",
  metrikaId: "12345678",
  updatedAt: "2026-11-15T10:00:00.000Z",
};

const cityDto: AdminCityDto = {
  id: "city-1",
  slug: "moskva",
  name: "Москва",
  nameIn: "Москве",
  isDefault: true,
  isActive: true,
  sortOrder: 10,
  updatedAt: "2026-11-15T10:00:00.000Z",
};

describe("форма настроек", () => {
  it("null-поля DTO превращаются в пустые строки, координаты — в строки", () => {
    const form = settingsFormFrom(settingsDto);

    expect(form.email).toBe("");
    expect(form.legalName).toBe("");
    expect(form.mapLat).toBe("55.7558");
    expect(form.mapLng).toBe("");
    expect(form.cityId).toBe("city-1");
  });

  it("пустые необязательные поля уходят как null, строки обрезаются", () => {
    const body = settingsFormBody({
      ...emptySettingsForm(),
      companyName: "  Спецтехресурс ",
      phone: " +7 495 000-00-00 ",
      priceDisclaimer: "  Цены не оферта  ",
      email: "   ",
      mapLat: "",
      cityId: "city-1",
    });

    expect(body).toMatchObject({
      companyName: "Спецтехресурс",
      phone: "+7 495 000-00-00",
      priceDisclaimer: "Цены не оферта",
      email: null,
      mapLat: null,
      cityId: "city-1",
    });
  });

  it("координаты отправляются строкой: ошибку ввода вернёт сервер", () => {
    const body = settingsFormBody({ ...emptySettingsForm(), mapLat: " 55,7558 " });

    expect(body.mapLat).toBe("55,7558");
  });
});

describe("форма города", () => {
  it("читается из DTO без потерь", () => {
    const form = cityFormFrom(cityDto);

    expect(form).toMatchObject({
      slug: "moskva",
      name: "Москва",
      nameIn: "Москве",
      sortOrder: 10,
      isDefault: true,
      isActive: true,
    });
  });

  it("новый город по умолчанию активен, но не выбран городом по умолчанию", () => {
    expect(emptyCityForm()).toMatchObject({ sortOrder: 10, isDefault: false, isActive: true });
  });

  it("тело запроса обрезает строки и сохраняет порядок и флаги", () => {
    const body = cityFormBody({
      ...emptyCityForm(),
      slug: "  kazan ",
      name: " Казань ",
      nameIn: " Казани ",
      sortOrder: 20,
      isDefault: true,
    });

    expect(body).toEqual({
      slug: "kazan",
      name: "Казань",
      nameIn: "Казани",
      sortOrder: 20,
      isDefault: true,
      isActive: true,
    });
  });
});
