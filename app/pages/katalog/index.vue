<script setup lang="ts">
import type { CatalogModelsDto } from "~/types/catalog";

const { data: site } = await useSite();
const { data, error } = await useFetch<CatalogModelsDto>("/api/catalog/models", {
  key: "catalog-models",
});
throwIfError(error.value);

const city = computed(() => site.value?.city ?? { slug: "moskva", name: "Москва", nameIn: "Москве" });
usePageSeo({
  title: `Каталог спецтехники в ${city.value.nameIn} — аренда техники`,
  description: `Каталог аренды спецтехники в ${city.value.nameIn}: землеройная, погрузочная, подъёмная, дорожно-ремонтная и коммунальная техника. Цены за смену, договор с юрлицами.`,
  path: "/katalog",
});
</script>

<template>
  <div>
    <SiteBreadcrumbs :items="[{ name: 'Главная', path: '/' }, { name: 'Каталог' }]" />

    <h1>Каталог спецтехники</h1>
    <p class="lead">
      Весь парк техники с ценами и характеристиками. Выберите вид в списке или смотрите все модели.
    </p>

    <CatalogListing v-if="data" :catalog="data" />

    <CtaBlock v-if="site" :phone="site.phone" />
  </div>
</template>
