<script setup lang="ts">
import type { CategoryCardDto } from "~/types/catalog";

const { data: site } = await useSite();
const { data: categories, error } = await useFetch<CategoryCardDto[]>("/api/catalog", {
  key: "catalog",
});
throwIfError(error.value);

const city = computed(() => site.value?.city ?? { slug: "moskva", name: "Москва", nameIn: "Москве" });
const totalTypes = computed(() =>
  (categories.value ?? []).reduce((sum, category) => sum + category.types.length, 0),
);

usePageSeo({
  title: `Каталог спецтехники в ${city.value.nameIn} — ${totalTypes.value} видов техники`,
  description: `Каталог аренды спецтехники в ${city.value.nameIn}: землеройная, погрузочная, подъёмная, дорожно-ремонтная и коммунальная техника. Цены за смену, договор с юрлицами.`,
  path: "/katalog",
});
</script>

<template>
  <div>
    <SiteBreadcrumbs :items="[{ name: 'Главная', path: '/' }, { name: 'Каталог' }]" />

    <h1>Каталог спецтехники</h1>
    <p class="lead">
      {{ totalTypes }} видов техники в {{ (categories?.length ?? 0) }} разделах. Выберите нужную
      позицию — на странице вида указаны цена за смену, условия доставки и модели в парке.
    </p>

    <CatalogGrid :categories="categories ?? []" :city-slug="city.slug" />

    <CtaBlock v-if="site" :phone="site.phone" />
  </div>
</template>
