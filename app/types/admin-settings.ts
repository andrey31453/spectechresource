/** DTO админ-настроек — зеркало `server/utils/settings-admin.ts`. */

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
