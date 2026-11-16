import type { AdminCityDto, AdminSiteSettingsDto } from "~/types/admin-settings";

/**
 * Состояние форм настроек ↔ тело админ-API.
 *
 * В форме всё строки (так работает `<input>`), сервер ждёт `null` вместо пустой строки.
 * Числа приводит сервер: невалидную координату он вернёт ошибкой поля, а не молча
 * превратит в «не заполнено».
 */

const text = (value: string | null): string => value ?? "";

const emptyToNull = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
};

const coordinate = (value: number | null): string => (value === null ? "" : String(value));

// ───────────────────────────── Настройки сайта ─────────────────────────────

export interface SettingsForm {
  companyName: string;
  phone: string;
  email: string;
  telegram: string;
  whatsapp: string;
  maxMessenger: string;
  workingHours: string;
  address: string;
  cityId: string;
  mapLat: string;
  mapLng: string;
  legalName: string;
  inn: string;
  ogrn: string;
  legalAddress: string;
  priceDisclaimer: string;
  metrikaId: string;
}

export function emptySettingsForm(): SettingsForm {
  return {
    companyName: "",
    phone: "",
    email: "",
    telegram: "",
    whatsapp: "",
    maxMessenger: "",
    workingHours: "",
    address: "",
    cityId: "",
    mapLat: "",
    mapLng: "",
    legalName: "",
    inn: "",
    ogrn: "",
    legalAddress: "",
    priceDisclaimer: "",
    metrikaId: "",
  };
}

export function settingsFormFrom(settings: AdminSiteSettingsDto): SettingsForm {
  return {
    companyName: settings.companyName,
    phone: settings.phone,
    email: text(settings.email),
    telegram: text(settings.telegram),
    whatsapp: text(settings.whatsapp),
    maxMessenger: text(settings.maxMessenger),
    workingHours: text(settings.workingHours),
    address: text(settings.address),
    cityId: settings.cityId,
    mapLat: coordinate(settings.mapLat),
    mapLng: coordinate(settings.mapLng),
    legalName: text(settings.legalName),
    inn: text(settings.inn),
    ogrn: text(settings.ogrn),
    legalAddress: text(settings.legalAddress),
    priceDisclaimer: settings.priceDisclaimer,
    metrikaId: text(settings.metrikaId),
  };
}

/** Тело запроса: пустые необязательные поля уходят как `null`, строки обрезаются. */
export function settingsFormBody(form: SettingsForm) {
  return {
    companyName: form.companyName.trim(),
    phone: form.phone.trim(),
    email: emptyToNull(form.email),
    telegram: emptyToNull(form.telegram),
    whatsapp: emptyToNull(form.whatsapp),
    maxMessenger: emptyToNull(form.maxMessenger),
    workingHours: emptyToNull(form.workingHours),
    address: emptyToNull(form.address),
    cityId: form.cityId,
    mapLat: emptyToNull(form.mapLat),
    mapLng: emptyToNull(form.mapLng),
    legalName: emptyToNull(form.legalName),
    inn: emptyToNull(form.inn),
    ogrn: emptyToNull(form.ogrn),
    legalAddress: emptyToNull(form.legalAddress),
    priceDisclaimer: form.priceDisclaimer.trim(),
    metrikaId: emptyToNull(form.metrikaId),
  };
}

// ──────────────────────────────── Города ────────────────────────────────

export interface CityForm {
  slug: string;
  name: string;
  nameIn: string;
  sortOrder: number;
  isDefault: boolean;
  isActive: boolean;
}

export function emptyCityForm(): CityForm {
  return {
    slug: "",
    name: "",
    nameIn: "",
    sortOrder: 10,
    isDefault: false,
    isActive: true,
  };
}

export function cityFormFrom(city: AdminCityDto): CityForm {
  return {
    slug: city.slug,
    name: city.name,
    nameIn: city.nameIn,
    sortOrder: city.sortOrder,
    isDefault: city.isDefault,
    isActive: city.isActive,
  };
}

export function cityFormBody(form: CityForm) {
  return {
    slug: form.slug.trim(),
    name: form.name.trim(),
    nameIn: form.nameIn.trim(),
    sortOrder: form.sortOrder,
    isDefault: form.isDefault,
    isActive: form.isActive,
  };
}
