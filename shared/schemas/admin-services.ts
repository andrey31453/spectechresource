import * as v from "valibot";
import { optionalText, requiredText, slugField, sortOrderField } from "./catalog";
import { toFieldErrors, type FieldError } from "./errors";

/**
 * Схемы услуг — одни для админ-формы и админ-API.
 *
 * Услуга живёт по адресу `/uslugi/{slug}` и связана с FAQ (`FaqItem.serviceId`).
 * Правила slug, порядка и текстов переиспользуются из `catalog.ts`.
 */

const serviceFields = {
  slug: slugField(),
  title: requiredText(200, "название услуги"),
  description: optionalText(500, "краткое описание"),
  descriptionTop: optionalText(20000, "верхнее описание"),
  descriptionBottom: optionalText(20000, "нижнее описание"),
  equipmentTypeIds: v.optional(v.pipe(
    v.array(v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(100))),
    v.maxLength(100),
    v.check((ids) => new Set(ids).size === ids.length, "Виды техники не должны повторяться"),
  )),
  image: optionalText(500, "адрес изображения"),
  seoTitle: optionalText(255, "SEO-заголовок"),
  seoDescription: optionalText(300, "SEO-описание"),
  seoText: optionalText(20000, "SEO-текст"),
  sortOrder: sortOrderField,
  isPublished: v.boolean("Публикация — да или нет"),
};

export const ServiceCreateSchema = v.object({
  ...serviceFields,
  sortOrder: v.optional(serviceFields.sortOrder, 10),
  isPublished: v.optional(serviceFields.isPublished, true),
});

/** `partial`: PATCH присылает только изменённые поля, остальные Prisma не трогает. */
export const ServiceUpdateSchema = v.partial(v.object(serviceFields));

export type ServiceCreateInput = v.InferOutput<typeof ServiceCreateSchema>;
export type ServiceUpdateInput = v.InferOutput<typeof ServiceUpdateSchema>;

export type AdminServiceFieldError = FieldError;

export const toAdminServiceFieldErrors = toFieldErrors;
