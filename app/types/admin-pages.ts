/** DTO админ-страниц — зеркало `server/utils/pages-admin.ts`. */

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
