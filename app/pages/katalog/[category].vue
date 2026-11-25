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

    <figure v-if="category.image" class="mt-6 overflow-hidden rounded-card border border-line bg-line">
      <img
        :src="category.image"
        :alt="category.title"
        width="1280"
        height="640"
        class="aspect-[16/9] w-full object-cover sm:aspect-[21/9]"
      >
    </figure>

    <ul class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" style="margin-top: 20px">
      <li v-for="type in category.types" :key="type.slug">
        <NuxtLink
          :to="typePath(type.slug, city.slug)"
          class="flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface transition hover:border-brand"
        >
          <img
            v-if="type.image"
            :src="type.image"
            :alt="`Аренда ${type.nameGenitive}`"
            loading="lazy"
            width="640"
            height="400"
            class="aspect-[16/10] w-full object-cover bg-line"
          >
          <span class="flex flex-1 flex-col gap-1 p-4">
            <span class="font-semibold text-ink">{{ type.name }}</span>
            <span class="mt-auto text-sm font-medium text-brand">
              {{ formatPriceFrom(type.priceFrom, type.priceUnit) }}
            </span>
          </span>
        </NuxtLink>
      </li>
    </ul>

    <div v-if="category.seoTextHtml" v-html="category.seoTextHtml" />

    <CtaBlock v-if="site" :phone="site.phone" />
  </div>
</template>
