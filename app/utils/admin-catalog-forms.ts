import type { PriceUnitName } from "#shared/schemas/catalog";
import type { AdminCategoryDto, AdminModelDto, AdminSpecDto, AdminTypeDto } from "~/types/admin-catalog";

/**
 * Состояние форм каталога ↔ тело админ-API.
 *
 * В форме всё строки (так работает `<input>`), сервер ждёт `null` вместо пустой строки
 * и массив вместо многострочного текста. Преобразования — здесь, чтобы страницы оставались тонкими.
 */

const text = (value: string | null): string => value ?? "";

/** Адреса изображений: пустые строки в форме — «ещё не заполнили», а не адрес. */
const cleanUrls = (values: string[]): string[] =>
  values.map((value) => value.trim()).filter((value) => value !== "");

/** «26000.00» → «26000»: в поле ввода хвостовые нули только мешают. */
const priceInput = (value: string | null): string => {
  if (value === null) return "";

  const numeric = Number(value);
  return Number.isFinite(numeric) ? String(numeric) : value;
};

const emptyToNull = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
};

// ─────────────────────────────── Разделы ───────────────────────────────

export interface CategoryForm {
  slug: string;
  title: string;
  h1: string;
  shortDesc: string;
  image: string;
  seoTitle: string;
  seoDescription: string;
  seoText: string;
  sortOrder: number;
  isPublished: boolean;
}

export function emptyCategoryForm(): CategoryForm {
  return {
    slug: "",
    title: "",
    h1: "",
    shortDesc: "",
    image: "",
    seoTitle: "",
    seoDescription: "",
    seoText: "",
    sortOrder: 10,
    isPublished: true,
  };
}

export function categoryFormFrom(category: AdminCategoryDto): CategoryForm {
  return {
    slug: category.slug,
    title: category.title,
    h1: text(category.h1),
    shortDesc: text(category.shortDesc),
    image: text(category.image),
    seoTitle: text(category.seoTitle),
    seoDescription: text(category.seoDescription),
    seoText: text(category.seoText),
    sortOrder: category.sortOrder,
    isPublished: category.isPublished,
  };
}

/** Тело запроса: пустые необязательные поля уходят как `null`, числа — числами. */
export function categoryFormBody(form: CategoryForm) {
  return {
    slug: form.slug.trim(),
    title: form.title.trim(),
    h1: emptyToNull(form.h1),
    shortDesc: emptyToNull(form.shortDesc),
    image: emptyToNull(form.image),
    seoTitle: emptyToNull(form.seoTitle),
    seoDescription: emptyToNull(form.seoDescription),
    seoText: emptyToNull(form.seoText),
    sortOrder: Number(form.sortOrder) || 0,
    isPublished: form.isPublished,
  };
}


// ────────────────────────────── Виды техники ──────────────────────────────

export interface TypeForm {
  categoryId: string;
  slug: string;
  name: string;
  nameGenitive: string;
  priceFrom: string;
  priceUnit: PriceUnitName;
  minOrder: string;
  deliveryTerms: string;
  deliveryPrice: string;
  crewAvailable: boolean;
  withoutCrewAvailable: boolean;
  worksPerformed: string;
  gallery: string[];
  seoTitle: string;
  seoDescription: string;
  seoText: string;
  sortOrder: number;
  isPublished: boolean;
}

export function emptyTypeForm(categoryId = ""): TypeForm {
  return {
    categoryId,
    slug: "",
    name: "",
    nameGenitive: "",
    priceFrom: "",
    priceUnit: "SHIFT",
    minOrder: "",
    deliveryTerms: "",
    deliveryPrice: "",
    crewAvailable: true,
    withoutCrewAvailable: false,
    worksPerformed: "",
    gallery: [],
    seoTitle: "",
    seoDescription: "",
    seoText: "",
    sortOrder: 10,
    isPublished: true,
  };
}

export function typeFormFrom(type: AdminTypeDto): TypeForm {
  return {
    categoryId: type.categoryId,
    slug: type.slug,
    name: type.name,
    nameGenitive: type.nameGenitive,
    priceFrom: priceInput(type.priceFrom),
    priceUnit: type.priceUnit,
    minOrder: text(type.minOrder),
    deliveryTerms: text(type.deliveryTerms),
    deliveryPrice: priceInput(type.deliveryPrice),
    crewAvailable: type.crewAvailable,
    withoutCrewAvailable: type.withoutCrewAvailable,
    worksPerformed: text(type.worksPerformed),
    gallery: [...type.gallery],
    seoTitle: text(type.seoTitle),
    seoDescription: text(type.seoDescription),
    seoText: text(type.seoText),
    sortOrder: type.sortOrder,
    isPublished: type.isPublished,
  };
}

export function typeFormBody(form: TypeForm) {
  return {
    categoryId: form.categoryId,
    slug: form.slug.trim(),
    name: form.name.trim(),
    nameGenitive: form.nameGenitive.trim(),
    priceFrom: emptyToNull(form.priceFrom),
    priceUnit: form.priceUnit,
    minOrder: emptyToNull(form.minOrder),
    deliveryTerms: emptyToNull(form.deliveryTerms),
    deliveryPrice: emptyToNull(form.deliveryPrice),
    crewAvailable: form.crewAvailable,
    withoutCrewAvailable: form.withoutCrewAvailable,
    worksPerformed: emptyToNull(form.worksPerformed),
    gallery: cleanUrls(form.gallery),
    seoTitle: emptyToNull(form.seoTitle),
    seoDescription: emptyToNull(form.seoDescription),
    seoText: emptyToNull(form.seoText),
    sortOrder: Number(form.sortOrder) || 0,
    isPublished: form.isPublished,
  };
}


// ──────────────────────────────── Модели ────────────────────────────────

export interface ModelForm {
  brand: string;
  model: string;
  shortDesc: string;
  pricePerShift: string;
  pricePerHour: string;
  photos: string[];
  isAvailable: boolean;
  sortOrder: number;
  specs: AdminSpecDto[];
}

export function emptyModelForm(): ModelForm {
  return {
    brand: "",
    model: "",
    shortDesc: "",
    pricePerShift: "",
    pricePerHour: "",
    photos: [],
    isAvailable: true,
    sortOrder: 10,
    specs: [{ name: "", value: "" }],
  };
}

export function modelFormFrom(model: AdminModelDto): ModelForm {
  return {
    brand: model.brand,
    model: model.model,
    shortDesc: text(model.shortDesc),
    pricePerShift: priceInput(model.pricePerShift),
    pricePerHour: priceInput(model.pricePerHour),
    photos: [...model.photos],
    isAvailable: model.isAvailable,
    sortOrder: model.sortOrder,
    specs: model.specs.length ? model.specs.map((spec) => ({ ...spec })) : [{ name: "", value: "" }],
  };
}

/** Пустые строки характеристик отбрасываем: незаполненная строка — «ещё не вписали», а не ошибка. */
export function modelFormBody(form: ModelForm) {
  return {
    brand: form.brand.trim(),
    model: form.model.trim(),
    shortDesc: emptyToNull(form.shortDesc),
    pricePerShift: emptyToNull(form.pricePerShift),
    pricePerHour: emptyToNull(form.pricePerHour),
    photos: cleanUrls(form.photos),
    isAvailable: form.isAvailable,
    sortOrder: Number(form.sortOrder) || 0,
    specs: form.specs
      .map((spec) => ({ name: spec.name.trim(), value: spec.value.trim() }))
      .filter((spec) => spec.name !== "" || spec.value !== ""),
  };
}
