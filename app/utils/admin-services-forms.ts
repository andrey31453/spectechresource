import type { AdminServiceDto } from "~/types/admin-services";

/**
 * Состояние формы услуги ↔ тело админ-API.
 *
 * В форме всё строки (так работает `<input>`), сервер ждёт `null` вместо пустой строки.
 * Преобразования — здесь, чтобы страница оставалась тонкой.
 */

const text = (value: string | null): string => value ?? "";

const emptyToNull = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
};

export interface ServiceForm {
  slug: string;
  title: string;
  description: string;
  descriptionTop: string;
  descriptionBottom: string;
  equipmentTypeIds: string[];
  image: string;
  seoTitle: string;
  seoDescription: string;
  seoText: string;
  sortOrder: number;
  isPublished: boolean;
}

export function emptyServiceForm(): ServiceForm {
  return {
    slug: "",
    title: "",
    description: "",
    descriptionTop: "",
    descriptionBottom: "",
    equipmentTypeIds: [],
    image: "",
    seoTitle: "",
    seoDescription: "",
    seoText: "",
    sortOrder: 10,
    isPublished: true,
  };
}

export function serviceFormFrom(service: AdminServiceDto): ServiceForm {
  return {
    slug: service.slug,
    title: service.title,
    description: text(service.description),
    descriptionTop: text(service.descriptionTop),
    descriptionBottom: text(service.descriptionBottom),
    equipmentTypeIds: [...service.equipmentTypeIds],
    image: text(service.image),
    seoTitle: text(service.seoTitle),
    seoDescription: text(service.seoDescription),
    seoText: text(service.seoText),
    sortOrder: service.sortOrder,
    isPublished: service.isPublished,
  };
}

/** Тело запроса: пустые необязательные поля уходят как `null`, числа — числами. */
export function serviceFormBody(form: ServiceForm) {
  return {
    slug: form.slug.trim(),
    title: form.title.trim(),
    description: emptyToNull(form.description),
    descriptionTop: emptyToNull(form.descriptionTop),
    descriptionBottom: emptyToNull(form.descriptionBottom),
    equipmentTypeIds: [...form.equipmentTypeIds],
    image: emptyToNull(form.image),
    seoTitle: emptyToNull(form.seoTitle),
    seoDescription: emptyToNull(form.seoDescription),
    seoText: emptyToNull(form.seoText),
    sortOrder: form.sortOrder,
    isPublished: form.isPublished,
  };
}
