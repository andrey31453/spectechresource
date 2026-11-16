import type { AdminPageDto } from "~/types/admin-pages";

/**
 * Состояние формы страницы ↔ тело админ-API.
 *
 * В форме всё строки (так работает `<input>`), сервер ждёт `null` вместо пустой строки
 * в необязательных SEO-полях. Контент обрезаем по краям: хвостовые пустые строки
 * в markdown ничего не добавляют, а в БД занимают место.
 */

const text = (value: string | null): string => value ?? "";

const emptyToNull = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
};

export interface PageForm {
  slug: string;
  title: string;
  content: string;
  seoTitle: string;
  seoDescription: string;
  isPublished: boolean;
}

export function emptyPageForm(): PageForm {
  return {
    slug: "",
    title: "",
    content: "",
    seoTitle: "",
    seoDescription: "",
    isPublished: true,
  };
}

export function pageFormFrom(page: AdminPageDto): PageForm {
  return {
    slug: page.slug,
    title: page.title,
    content: page.content,
    seoTitle: text(page.seoTitle),
    seoDescription: text(page.seoDescription),
    isPublished: page.isPublished,
  };
}

export function pageFormBody(form: PageForm) {
  return {
    slug: form.slug.trim(),
    title: form.title.trim(),
    content: form.content.trim(),
    seoTitle: emptyToNull(form.seoTitle),
    seoDescription: emptyToNull(form.seoDescription),
    isPublished: form.isPublished,
  };
}
