<script setup lang="ts">
import type { CatalogTypeDto } from "~/types/catalog";

const { data: site } = await useSite();
const { data: types, error } = await useFetch<CatalogTypeDto[]>("/api/catalog", {
  key: "catalog",
});
throwIfError(error.value);

const city = computed(() => site.value?.city ?? { slug: "moskva", name: "Москва", nameIn: "Москве" });
const totalTypes = computed(() => types.value?.length ?? 0);

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
      {{ totalTypes }} видов техники. Выберите нужную
      позицию — на странице вида указаны цена за смену, условия доставки и модели в парке.
    </p>

    <CatalogGrid :types="types ?? []" :city-slug="city.slug" />

    <CtaBlock v-if="site" :phone="site.phone" />
  </div>
</template>
