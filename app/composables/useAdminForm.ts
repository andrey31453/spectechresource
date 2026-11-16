import type { FetchError } from "ofetch";
import type { AdminFieldError } from "~/types/admin";

type AdminErrorPayload = { message?: string; data?: { errors?: AdminFieldError[] } };

/**
 * Сохранение админ-формы: одна обработка ответов на все страницы.
 * 400 — ошибки по полям, 401 — сессия истекла (возвращаем на вход), 409/404 — текст сервера.
 */
export function useAdminForm() {
  const route = useRoute();
  const fieldErrors = ref<Record<string, string>>({});
  const formError = ref<string | null>(null);
  const pending = ref(false);
  const saved = ref(false);

  /**
   * Ошибка для поля и его вложенных элементов: сервер может вернуть `gallery.0`,
   * `photos.1`, `specs.0.name` — форма подсвечивает общий блок.
   */
  function errorFor(field: string): string | undefined {
    if (fieldErrors.value[field]) return fieldErrors.value[field];

    const nested = Object.entries(fieldErrors.value).find(([key]) => key.startsWith(`${field}.`));
    return nested?.[1];
  }

  function reset() {
    fieldErrors.value = {};
    formError.value = null;
    saved.value = false;
  }

  async function submit<T>(action: () => Promise<T>): Promise<T | null> {
    if (pending.value) return null;

    pending.value = true;
    reset();

    try {
      const result = await action();
      saved.value = true;
      return result;
    } catch (error) {
      const fetchError = error as FetchError<AdminErrorPayload>;
      const errors = fetchError.data?.data?.errors ?? [];

      if (fetchError.statusCode === 400) {
        for (const issue of errors) {
          fieldErrors.value[issue.field] = issue.message;
        }
        if (errors.length === 0) {
          formError.value = fetchError.data?.message ?? "Проверьте поля формы";
        }
      } else if (fetchError.statusCode === 401) {
        await navigateTo(`/admin/login?next=${encodeURIComponent(route.fullPath)}`);
      } else if (fetchError.statusCode === 404 || fetchError.statusCode === 409) {
        formError.value = fetchError.data?.message ?? "Не удалось сохранить изменения";
      } else {
        formError.value = "Не удалось сохранить. Попробуйте ещё раз чуть позже.";
      }

      return null;
    } finally {
      pending.value = false;
    }
  }

  return { fieldErrors, formError, pending, saved, submit, reset, errorFor };
}
