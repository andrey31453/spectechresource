/** Ошибку загрузки данных на SSR превращаем в настоящий HTTP-код (404/500), а не в пустую страницу. */
export function throwIfError(error: { statusCode?: number; statusMessage?: string; message?: string } | null | undefined): void {
  if (!error) return;

  throw createError({
    statusCode: error.statusCode ?? 500,
    message: error.statusMessage || error.message || "Не удалось загрузить данные",
  });
}
