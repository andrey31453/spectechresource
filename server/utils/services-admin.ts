/**
 * DTO админ-услуг: Prisma-строки → плоский JSON.
 *
 * `faqCount` нужен таблице (сколько вопросов привязано) и удалению: услугу с FAQ
 * не удаляем, чтобы каскад не унёс тексты (слайс `admin-content`).
 */

export interface AdminServiceDto {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  descriptionTop: string | null;
  descriptionBottom: string | null;
  equipmentTypeIds: string[];
  image: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoText: string | null;
  sortOrder: number;
  isPublished: boolean;
  faqCount: number;
  updatedAt: string;
}

export function toAdminService(service: {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  descriptionTop: string | null;
  descriptionBottom: string | null;
  equipmentTypes?: Array<{ id: string }>;
  image: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoText: string | null;
  sortOrder: number;
  isPublished: boolean;
  updatedAt: Date;
  _count?: { faq: number };
}): AdminServiceDto {
  return {
    id: service.id,
    slug: service.slug,
    title: service.title,
    description: service.description,
    descriptionTop: service.descriptionTop,
    descriptionBottom: service.descriptionBottom,
    equipmentTypeIds: service.equipmentTypes?.map((type) => type.id) ?? [],
    image: service.image,
    seoTitle: service.seoTitle,
    seoDescription: service.seoDescription,
    seoText: service.seoText,
    sortOrder: service.sortOrder,
    isPublished: service.isPublished,
    faqCount: service._count?.faq ?? 0,
    updatedAt: service.updatedAt.toISOString(),
  };
}
