import { money, type Decimalish, type PriceUnit } from "./dto";

/**
 * DTO админ-каталога: Prisma-строки → плоский JSON для форм и таблиц.
 * Decimal отдаём строкой (как в публичном API), числа не округляем повторно,
 * даты — ISO, служебные поля (`createdAt`) наружу не отдаём.
 */

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

export function toAdminCategory(category: {
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
  updatedAt: Date;
  _count: { types: number };
}): AdminCategoryDto {
  return {
    id: category.id,
    slug: category.slug,
    title: category.title,
    h1: category.h1,
    shortDesc: category.shortDesc,
    image: category.image,
    seoTitle: category.seoTitle,
    seoDescription: category.seoDescription,
    seoText: category.seoText,
    sortOrder: category.sortOrder,
    isPublished: category.isPublished,
    typesCount: category._count.types,
    updatedAt: category.updatedAt.toISOString(),
  };
}

export interface AdminTypeListItemDto {
  id: string;
  categoryId: string;
  slug: string;
  name: string;
  nameGenitive: string;
  priceFrom: string | null;
  priceUnit: PriceUnit;
  sortOrder: number;
  isPublished: boolean;
  modelsCount: number;
}

export function toAdminTypeListItem(type: {
  id: string;
  categoryId: string;
  slug: string;
  name: string;
  nameGenitive: string;
  priceFrom: Decimalish | null;
  priceUnit: PriceUnit;
  sortOrder: number;
  isPublished: boolean;
  _count: { models: number };
}): AdminTypeListItemDto {
  return {
    id: type.id,
    categoryId: type.categoryId,
    slug: type.slug,
    name: type.name,
    nameGenitive: type.nameGenitive,
    priceFrom: money(type.priceFrom),
    priceUnit: type.priceUnit,
    sortOrder: type.sortOrder,
    isPublished: type.isPublished,
    modelsCount: type._count.models,
  };
}

export interface AdminModelDto {
  slug: string;
  id: string;
  brand: string;
  model: string;
  shortDesc: string | null;
  pricePerShift: string | null;
  pricePerHour: string | null;
  photos: string[];
  isAvailable: boolean;
  sortOrder: number;
  specs: Array<{ name: string; value: string }>;
}

export function toAdminModel(model: {
  slug: string;
  id: string;
  brand: string;
  model: string;
  shortDesc: string | null;
  pricePerShift: Decimalish | null;
  pricePerHour: Decimalish | null;
  photos: string[];
  isAvailable: boolean;
  sortOrder: number;
  specs: Array<{ name: string; value: string }>;
}): AdminModelDto {
  return {
    slug: model.slug,
    id: model.id,
    brand: model.brand,
    model: model.model,
    shortDesc: model.shortDesc,
    pricePerShift: money(model.pricePerShift),
    pricePerHour: money(model.pricePerHour),
    photos: model.photos,
    isAvailable: model.isAvailable,
    sortOrder: model.sortOrder,
    specs: model.specs.map((spec) => ({ name: spec.name, value: spec.value })),
  };
}

export interface AdminTypeDto extends Omit<AdminTypeListItemDto, "modelsCount"> {
  minOrder: string | null;
  deliveryTerms: string | null;
  deliveryPrice: string | null;
  crewAvailable: boolean;
  withoutCrewAvailable: boolean;
  worksPerformed: string | null;
  gallery: string[];
  seoTitle: string | null;
  seoDescription: string | null;
  seoText: string | null;
  category: { id: string; slug: string; title: string };
  models: AdminModelDto[];
  related: Array<{ id: string; slug: string; name: string }>;
  updatedAt: string;
}

export function toAdminType(type: {
  id: string;
  categoryId: string;
  slug: string;
  name: string;
  nameGenitive: string;
  priceFrom: Decimalish | null;
  priceUnit: PriceUnit;
  minOrder: string | null;
  deliveryTerms: string | null;
  deliveryPrice: Decimalish | null;
  crewAvailable: boolean;
  withoutCrewAvailable: boolean;
  worksPerformed: string | null;
  gallery: string[];
  seoTitle: string | null;
  seoDescription: string | null;
  seoText: string | null;
  sortOrder: number;
  isPublished: boolean;
  updatedAt: Date;
  category: { id: string; slug: string; title: string };
  models: Array<Parameters<typeof toAdminModel>[0]>;
  relatedFrom: Array<{ target: { id: string; slug: string; name: string } }>;
}): AdminTypeDto {
  return {
    id: type.id,
    categoryId: type.categoryId,
    slug: type.slug,
    name: type.name,
    nameGenitive: type.nameGenitive,
    priceFrom: money(type.priceFrom),
    priceUnit: type.priceUnit,
    minOrder: type.minOrder,
    deliveryTerms: type.deliveryTerms,
    deliveryPrice: money(type.deliveryPrice),
    crewAvailable: type.crewAvailable,
    withoutCrewAvailable: type.withoutCrewAvailable,
    worksPerformed: type.worksPerformed,
    gallery: type.gallery,
    seoTitle: type.seoTitle,
    seoDescription: type.seoDescription,
    seoText: type.seoText,
    sortOrder: type.sortOrder,
    isPublished: type.isPublished,
    category: type.category,
    models: type.models.map(toAdminModel),
    related: type.relatedFrom.map((link) => ({
      id: link.target.id,
      slug: link.target.slug,
      name: link.target.name,
    })),
    updatedAt: type.updatedAt.toISOString(),
  };
}
