import type { PriceUnitName } from "#shared/schemas/catalog";

/** DTO админ-каталога — зеркало `server/utils/catalog-admin.ts`. */

export interface AdminCategoryDto {
  id: string;
  slug: string;
  title: string;
  h1: string | null;
  shortDesc: string | null;
  image: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoText: string | null;
  sortOrder: number;
  isPublished: boolean;
  typesCount: number;
  updatedAt: string;
}

export interface AdminTypeListItemDto {
  id: string;
  categoryId: string;
  slug: string;
  name: string;
  nameGenitive: string;
  priceFrom: string | null;
  priceUnit: PriceUnitName;
  sortOrder: number;
  isPublished: boolean;
  modelsCount: number;
}

export interface AdminSpecDto {
  name: string;
  value: string;
}

export interface AdminModelDto {
  slug: string;
  id: string;
  typeId: string | null;
  type: { id: string; name: string; slug: string; category: { id: string; title: string } } | null;
  brand: string;
  model: string;
  shortDesc: string | null;
  pricePerShift: string | null;
  pricePerHour: string | null;
  photos: string[];
  isPublished: boolean;
  sortOrder: number;
  specs: AdminSpecDto[];
}

export interface AdminRelatedDto {
  id: string;
  slug: string;
  name: string;
}

export interface AdminTypeDto extends Omit<AdminTypeListItemDto, "modelsCount"> {
  minOrder: string | null;
  deliveryTerms: string | null;
  deliveryPrice: string | null;
  crewAvailable: boolean;
  withoutCrewAvailable: boolean;
  descriptionTop: string | null;
  worksPerformed: string | null;
  gallery: string[];
  seoTitle: string | null;
  seoDescription: string | null;
  seoText: string | null;
  category: { id: string; slug: string; title: string };
  models: AdminModelDto[];
  related: AdminRelatedDto[];
  updatedAt: string;
}
