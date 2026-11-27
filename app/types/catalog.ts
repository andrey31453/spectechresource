/** DTO публичного API. Источник: server/api/* (см. docs/specs/seo-routing.md). */

export type PriceUnit = "SHIFT" | "HOUR" | "PER_METER";

export interface CityDto {
  slug: string;
  name: string;
  nameIn: string;
}

export interface TypeCardDto {
  /** Краткая информация главной: descriptionTop или worksPerformed. */
  description?: string | null;
  slug: string;
  name: string;
  nameGenitive: string;
  priceFrom: string | null;
  priceUnit: PriceUnit;
  /** Обложка вида: первое фото галереи; null — фото ещё не загружено. */
  image: string | null;
}

/** Плоский пункт публичного каталога: категория из ТЗ = вид техники. */
export type CatalogTypeDto = TypeCardDto;

export interface CatalogFilterDto {
  slug: string;
  name: string;
  descriptionTopHtml: string | null;
  descriptionBottomHtml: string | null;
}

export interface CatalogModelsDto {
  types: CatalogFilterDto[];
  models: HomeModelDto[];
}

export interface CategoryCardDto {
  description?: string | null;
  colorTheme?: string;
  slug: string;
  title: string;
  shortDesc: string | null;
  image?: string | null;
  types: TypeCardDto[];
}

export interface FaqDto {
  question: string;
  answer: string;
}

export interface ServiceCardDto {
  slug: string;
  title: string;
  description: string | null;
  image?: string | null;
}

export interface SiteDto {
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
  city: CityDto;
}

/**
 * Модель техники на главной: конкретная машина с ценой за смену.
 * `categorySlug`/`typeSlug` связывают карточку с разделом и посадочной вида —
 * страницы моделей находятся внутри соответствующего вида техники.
 */
export interface HomeModelDto {
  slug: string;
  id: string;
  categorySlug: string;
  typeSlug: string;
  typeName: string;
  brand: string;
  model: string;
  shortDesc: string | null;
  pricePerShift: string | null;
  /** Цена за час, если заполнена в админке: вторая строка под ценой смены. */
  pricePerHour: string | null;
  /** Первое фото из галереи модели; null — фото ещё не загружено. */
  photo: string | null;
  photos: string[];
  specs: Array<{ name: string; value: string }>;
}

export interface HomeDto {
  categories: CategoryCardDto[];
  models: HomeModelDto[];
  services: ServiceCardDto[];
  advantages: Array<{ title: string; text: string | null; icon: string | null }>;
  steps: Array<{ title: string; text: string | null }>;
  stats: Array<{ value: string; unit: string | null; label: string }>;
  faq: FaqDto[];
}

export interface CategoryDetailDto extends CategoryCardDto {
  h1: string | null;
  image: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoTextHtml: string | null;
}

export interface ModelDto {
  slug: string;
  id: string;
  brand: string;
  model: string;
  shortDesc: string | null;
  pricePerShift: string | null;
  pricePerHour: string | null;
  photos: string[];
  specs: Array<{ name: string; value: string }>;
}

export interface LandingDto {
  canonicalPath: string;
  city: CityDto;
  category: { slug: string; title: string };
  type: {
    slug: string;
    name: string;
    nameGenitive: string;
    priceFrom: string | null;
    priceUnit: PriceUnit;
    minOrder: string | null;
    deliveryTerms: string | null;
    deliveryPrice: string | null;
    crewAvailable: boolean;
    withoutCrewAvailable: boolean;
    descriptionTopHtml: string | null;
    worksPerformedHtml: string | null;
    gallery: string[];
    seoTitle: string | null;
    seoDescription: string | null;
    seoTextHtml: string | null;
  };
  models: ModelDto[];
  faq: FaqDto[];
  related: TypeCardDto[];
}

export interface ServiceDetailDto extends ServiceCardDto {
  seoTitle: string | null;
  seoDescription: string | null;
  contentHtml: string | null;
  faq: FaqDto[];
}

export interface PageDto {
  slug: string;
  title: string;
  seoTitle: string | null;
  seoDescription: string | null;
  contentHtml: string;
  updatedAt: string;
}
