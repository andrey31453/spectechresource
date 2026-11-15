<script setup lang="ts">
import type { CategoryDetailDto } from "~/types/catalog";

const route = useRoute();
const slug = String(route.params.category ?? "");

const { data: site } = await useSite();
const { data: category, error } = await useFetch<CategoryDetailDto>(`/api/catalog/${slug}`, {
  key: `category-${slug}`,
});
throwIfError(error.value);

const city = computed(() => site.value?.city ?? { slug: "moskva", name: "Москва", nameIn: "Москве" });
const companyName = computed(() => site.value?.companyName ?? "ООО «СПЕЦТЕХРЕСУРС»");

const h1 = computed(
  () => category.value?.h1 ?? `Аренда ${category.value?.title.toLowerCase() ?? ""} в ${city.value.nameIn}`,
);

usePageSeo({
  title: category.value?.seoTitle ?? `${h1.value} — цены и условия | ${companyName.value}`,
  description: category.value?.seoDescription ?? category.value?.shortDesc ?? null,
  path: `/katalog/${slug}`,
});
</script>

<template>
  <div v-if="category">
    <SiteBreadcrumbs
      :items="[
        { name: 'Главная', path: '/' },
        { name: 'Каталог', path: '/katalog' },
        { name: category.title },
      ]"
    />

    <h1>{{ h1 }}</h1>
    <p v-if="category.shortDesc" class="lead">{{ category.shortDesc }}</p>

    <ul class="grid" style="margin-top: 20px">
      <li v-for="type in category.types" :key="type.slug">
        <NuxtLink :to="typePath(type.slug, city.slug)" class="card">
          <span class="card__title">{{ type.name }}</span>
          <span class="card__meta">{{ formatPriceFrom(type.priceFrom, type.priceUnit) }}</span>
        </NuxtLink>
      </li>
    </ul>

    <div v-if="category.seoTextHtml" v-html="category.seoTextHtml" />

    <CtaBlock v-if="site" :phone="site.phone" />
  </div>
</template>
