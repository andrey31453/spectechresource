<script setup lang="ts">
import type { PageDto } from "~/types/catalog";

const route = useRoute();
const slug = String(route.params.slug ?? "");

const { data: site } = await useSite();
const { data: page, error } = await useFetch<PageDto>(`/api/pages/${slug}`, {
  key: `page-${slug}`,
});
throwIfError(error.value);

const companyName = computed(() => site.value?.companyName ?? "ООО «СПЕЦТЕХРЕСУРС»");

usePageSeo({
  title: page.value?.seoTitle ?? `${page.value?.title ?? "Страница"} — ${companyName.value}`,
  description: page.value?.seoDescription ?? null,
  path: `/${slug}`,
  type: "article",
});
</script>

<template>
  <div v-if="page">
    <Breadcrumbs :items="[{ name: 'Главная', path: '/' }, { name: page.title }]" />

    <h1>{{ page.title }}</h1>

    <div v-html="page.contentHtml" />

    <p class="muted" style="margin-top: 24px">
      Редакция от {{ new Date(page.updatedAt).toLocaleDateString("ru-RU") }}.
    </p>
  </div>
</template>
