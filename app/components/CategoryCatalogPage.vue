<script setup lang="ts">
import type { CategoryDetailDto, CatalogModelsDto } from "~/types/catalog";

const props = defineProps<{ slug: string }>();
const { data: category, error } = await useFetch<CategoryDetailDto>(`/api/catalog/${props.slug}`);
throwIfError(error.value);
const { data: catalog, error: catalogError } = await useFetch<CatalogModelsDto>("/api/catalog/models", {
  query: { categorySlug: props.slug },
});
throwIfError(catalogError.value);
const { data: site } = await useSite();
const title = category.value?.h1 || category.value?.title || "Аренда спецтехники";
usePageSeo({
  title: category.value?.seoTitle || title,
  description: category.value?.seoDescription || category.value?.shortDesc,
  path: `/arenda-${props.slug}`,
});
</script>

<template>
  <div>
    <SiteBreadcrumbs :items="[{ name: 'Главная', path: '/' }, { name: 'Каталог', path: '/katalog' }, { name: category?.title ?? title }]" />
    <h1>{{ title }}</h1>
    <p v-if="category?.shortDesc" class="lead">{{ category.shortDesc }}</p>
    <CatalogListing v-if="catalog" :catalog="catalog" />
    <div v-if="category?.seoTextHtml" class="mt-8 [overflow-wrap:anywhere]" v-html="category.seoTextHtml" />
    <CtaBlock v-if="site" :phone="site.phone" />
  </div>
</template>