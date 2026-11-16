import type { FetchError } from "ofetch";
import { formatFileSize, MAX_IMAGE_BYTES, uploadPathFromUrl } from "#shared/utils/uploads";
import type { AdminUploadDto } from "~/types/admin-uploads";

type UploadErrorPayload = {
  message?: string;
  data?: { errors?: Array<{ field: string; message: string }> };
};

/**
 * Загрузка и удаление изображений админки: одна обработка ответов на все формы каталога.
 *
 * Размер проверяется до отправки (быстрый ответ без сети), формат — только на сервере
 * по содержимому файла: `file.type` из браузера подделывается одной строкой.
 */
export function useImageUpload() {
  const route = useRoute();
  const pending = ref(false);
  const error = ref<string | null>(null);

  function messageFrom(cause: unknown, fallback: string): string {
    const fetchError = cause as FetchError<UploadErrorPayload>;
    const fieldError = fetchError.data?.data?.errors?.[0]?.message;

    return fieldError ?? fetchError.data?.message ?? fallback;
  }

  async function handleFailure(cause: unknown, fallback: string): Promise<void> {
    const statusCode = (cause as FetchError)?.statusCode;

    if (statusCode === 401) {
      await navigateTo(`/admin/login?next=${encodeURIComponent(route.fullPath)}`);
      error.value = "Сессия истекла — войдите заново";
      return;
    }

    error.value = messageFrom(cause, fallback);
  }

  /** Один файл; `null` — ошибка (текст в `error`). */
  async function upload(file: File): Promise<AdminUploadDto | null> {
    if (pending.value) return null;

    error.value = null;

    if (file.size > MAX_IMAGE_BYTES) {
      error.value = `Файл больше ${formatFileSize(MAX_IMAGE_BYTES)} — сожмите изображение`;
      return null;
    }

    pending.value = true;

    try {
      const body = new FormData();
      body.append("file", file);

      const result = await $fetch<{ upload: AdminUploadDto }>("/api/admin/uploads", {
        method: "POST",
        body,
      });

      return result.upload;
    } catch (cause) {
      await handleFailure(cause, "Не удалось загрузить файл");
      return null;
    } finally {
      pending.value = false;
    }
  }

  /** Несколько файлов подряд: останавливаемся на первой ошибке, уже загруженные возвращаем. */
  async function uploadMany(files: File[]): Promise<AdminUploadDto[]> {
    const uploaded: AdminUploadDto[] = [];

    for (const file of files) {
      const result = await upload(file);
      if (!result) break;

      uploaded.push(result);
    }

    return uploaded;
  }

  /** Удаление файла с диска; `true` — файла больше нет. */
  async function remove(url: string): Promise<boolean> {
    const path = uploadPathFromUrl(url);

    if (!path) {
      error.value = "Это внешний адрес — файл хранится не у нас, удалять нечего";
      return false;
    }

    if (pending.value) return false;

    error.value = null;
    pending.value = true;

    try {
      await $fetch(`/api/admin/uploads/${path}`, { method: "DELETE" });
      return true;
    } catch (cause) {
      await handleFailure(cause, "Не удалось удалить файл");
      return false;
    } finally {
      pending.value = false;
    }
  }

  function clearError() {
    error.value = null;
  }

  return { pending, error, upload, uploadMany, remove, clearError };
}
