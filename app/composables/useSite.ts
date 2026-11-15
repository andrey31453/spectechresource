import type { SiteDto } from "~/types/catalog";

/** Настройки сайта + город. Один ключ на всё приложение — запрос выполняется один раз. */
export function useSite() {
  return useAsyncData<SiteDto>("site", () => $fetch<SiteDto>("/api/site"), { deep: false });
}
