<script setup lang="ts">
import type { ServiceDetailDto } from "~/types/catalog";

const route = useRoute();
const slug = String(route.params.slug ?? "");

const { data: site } = await useSite();
const { data: service, error } = await useFetch<ServiceDetailDto>(`/api/services/${slug}`, {
  key: `service-${slug}`,
});
throwIfError(error.value);

const city = computed(() => site.value?.city ?? { slug: "moskva", name: "Москва", nameIn: "Москве" });
const companyName = computed(() => site.value?.companyName ?? "ООО «СПЕЦТЕХРЕСУРС»");

usePageSeo({
  title: service.value?.seoTitle ?? `${service.value?.title ?? "Услуга"} в ${city.value.nameIn} | ${companyName.value}`,
  description: service.value?.seoDescription ?? service.value?.description ?? null,
  path: `/uslugi/${slug}`,
  type: "article",
});
</script>

<template>
  <div v-if="service">
    <SiteBreadcrumbs
      :items="[
        { name: 'Главная', path: '/' },
        { name: 'Услуги', path: '/uslugi' },
        { name: service.title },
      ]"
    />

    <h1>{{ service.title }}</h1>
    <p v-if="service.description" class="lead">{{ service.description }}</p>

    <div v-if="service.contentHtml" v-html="service.contentHtml" />

    <FaqList v-if="service.faq.length" :items="service.faq" with-schema />

    <CtaBlock v-if="site" :phone="site.phone" />
  </div>
</template>
