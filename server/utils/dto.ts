/**
 * DTO для публичного API: Prisma-модели → плоский JSON.
 * Decimal отдаём строкой (в JSON он и так станет строкой, но так контракт явный).
 */

export type Decimalish = { toFixed(fractionDigits: number): string };

export type PriceUnit = "SHIFT" | "HOUR" | "PER_METER";

export function money(value: Decimalish | null | undefined): string | null {
  return value ? value.toFixed(2) : null;
}

export function toCity(city: { slug: string; name: string; nameIn: string }) {
  return { slug: city.slug, name: city.name, nameIn: city.nameIn };
}

export function toTypeCard(type: {
  slug: string;
  name: string;
  nameGenitive: string;
  priceFrom: Decimalish | null;
  priceUnit: PriceUnit;
}) {
  return {
    slug: type.slug,
    name: type.name,
    nameGenitive: type.nameGenitive,
    priceFrom: money(type.priceFrom),
    priceUnit: type.priceUnit,
  };
}

export function toSite(settings: {
  companyName: string;
  phone: string;
  email: string | null;
  telegram: string | null;
  whatsapp: string | null;
  maxMessenger: string | null;
  workingHours: string | null;
  address: string | null;
  mapLat: number | null;
  mapLng: number | null;
  legalName: string | null;
  inn: string | null;
  ogrn: string | null;
  legalAddress: string | null;
  priceDisclaimer: string;
  metrikaId: string | null;
  city: { slug: string; name: string; nameIn: string };
}) {
  return {
    companyName: settings.companyName,
    phone: settings.phone,
    email: settings.email,
    telegram: settings.telegram,
    whatsapp: settings.whatsapp,
    maxMessenger: settings.maxMessenger,
    workingHours: settings.workingHours,
    address: settings.address,
    mapLat: settings.mapLat,
    mapLng: settings.mapLng,
    legalName: settings.legalName,
    inn: settings.inn,
    ogrn: settings.ogrn,
    legalAddress: settings.legalAddress,
    priceDisclaimer: settings.priceDisclaimer,
    metrikaId: settings.metrikaId,
    city: toCity(settings.city),
  };
}

export function toFaq(items: Array<{ question: string; answer: string }>) {
  return items.map((item) => ({ question: item.question, answer: item.answer }));
}
