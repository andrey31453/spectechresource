/**
 * DTO админ-страниц: Prisma-строки → плоский JSON.
 *
 * В списке контент не нужен — страница политики ПДн весит десятки килобайт,
 * поэтому `content` отдаётся только в карточке (`GET /api/admin/pages/:id`).
 * Даты — ISO, служебные поля наружу не отдаём.
 */

export interface AdminPageListItemDto {
  id: string;
  slug: string;
  title: string;
  isPublished: boolean;
  updatedAt: string;
}

export interface AdminPageDto extends AdminPageListItemDto {
  content: string;
  seoTitle: string | null;
  seoDescription: string | null;
  createdAt: string;
}

export function toAdminPageListItem(page: {
  id: string;
  slug: string;
  title: string;
  isPublished: boolean;
  updatedAt: Date;
}): AdminPageListItemDto {
  return {
    id: page.id,
    slug: page.slug,
    title: page.title,
    isPublished: page.isPublished,
    updatedAt: page.updatedAt.toISOString(),
  };
}

export function toAdminPage(page: {
  id: string;
  slug: string;
  title: string;
  content: string;
  seoTitle: string | null;
  seoDescription: string | null;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}): AdminPageDto {
  return {
    ...toAdminPageListItem(page),
    content: page.content,
    seoTitle: page.seoTitle,
    seoDescription: page.seoDescription,
    createdAt: page.createdAt.toISOString(),
  };
}
