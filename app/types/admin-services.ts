/** Услуга в админке: публичные поля + количество привязанных вопросов FAQ. */
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
