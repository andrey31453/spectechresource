/**
 * DTO админ-настроек: Prisma-строки → плоский JSON для формы и таблицы городов.
 * Даты — ISO, служебные поля наружу не отдаём; `cityId` — id строки `City`, а не slug,
 * потому что форма выбирает город из списка.
 */

/** Singleton: одна строка настроек на весь сайт. */
export const SETTINGS_ID = "main";

export interface AdminCityDto {
  id: string;
  slug: string;
  name: string;
  nameIn: string;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  updatedAt: string;
}

export function toAdminCity(city: {
  id: string;
  slug: string;
  name: string;
  nameIn: string;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  updatedAt: Date;
}): AdminCityDto {
  return {
    id: city.id,
    slug: city.slug,
    name: city.name,
    nameIn: city.nameIn,
    isDefault: city.isDefault,
    isActive: city.isActive,
    sortOrder: city.sortOrder,
    updatedAt: city.updatedAt.toISOString(),
  };
}

export interface AdminSiteSettingsDto {
  companyName: string;
  phone: string;
  email: string | null;
  telegram: string | null;
  whatsapp: string | null;
  maxMessenger: string | null;
  workingHours: string | null;
  address: string | null;
  cityId: string;
  mapLat: number | null;
  mapLng: number | null;
  legalName: string | null;
  inn: string | null;
  ogrn: string | null;
  legalAddress: string | null;
  priceDisclaimer: string;
  metrikaId: string | null;
  updatedAt: string;
}

export function toAdminSettings(settings: {
  companyName: string;
  phone: string;
  email: string | null;
  telegram: string | null;
  whatsapp: string | null;
  maxMessenger: string | null;
  workingHours: string | null;
  address: string | null;
  cityId: string;
  mapLat: number | null;
  mapLng: number | null;
  legalName: string | null;
  inn: string | null;
  ogrn: string | null;
  legalAddress: string | null;
  priceDisclaimer: string;
  metrikaId: string | null;
  updatedAt: Date;
}): AdminSiteSettingsDto {
  return {
    companyName: settings.companyName,
    phone: settings.phone,
    email: settings.email,
    telegram: settings.telegram,
    whatsapp: settings.whatsapp,
    maxMessenger: settings.maxMessenger,
    workingHours: settings.workingHours,
    address: settings.address,
    cityId: settings.cityId,
    mapLat: settings.mapLat,
    mapLng: settings.mapLng,
    legalName: settings.legalName,
    inn: settings.inn,
    ogrn: settings.ogrn,
    legalAddress: settings.legalAddress,
    priceDisclaimer: settings.priceDisclaimer,
    metrikaId: settings.metrikaId,
    updatedAt: settings.updatedAt.toISOString(),
  };
}
