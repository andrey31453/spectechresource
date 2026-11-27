import type { CatalogTypeDto } from "~/types/catalog";

/** Общий список видов для верхнего меню на главной и внутренних страницах. */
export async function useCatalogNavigation() {
  const { data } = await useAsyncData<CatalogTypeDto[]>(
    "nav-categories",
    () => $fetch<CatalogTypeDto[]>("/api/catalog"),
    { deep: false },
  );

  return computed(() => (data.value ?? []).map((type) => ({
    slug: type.slug,
    title: type.name,
  })));
}