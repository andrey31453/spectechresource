<script setup lang="ts">
import type { CategoryCardDto } from "~/types/catalog";

const { data: site } = await useSite();

const { data: categories } = await useAsyncData<CategoryCardDto[]>(
  "nav-categories",
  () => $fetch<CategoryCardDto[]>("/api/catalog"),
  { deep: false },
);

const navCategories = computed(() =>
  (categories.value ?? []).map((category) => ({ slug: category.slug, title: category.title })),
);

if (site.value) {
  const {
    public: { siteUrl },
  } = useRuntimeConfig();
  const base = String(siteUrl).replace(/\/+$/, "");

  useJsonLd("organization", {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.value.companyName,
    legalName: site.value.legalName ?? undefined,
    url: `${base}/`,
    telephone: site.value.phone,
    email: site.value.email ?? undefined,
    address: site.value.address
      ? {
          "@type": "PostalAddress",
          addressCountry: "RU",
          addressLocality: site.value.city.name,
          streetAddress: site.value.address,
        }
      : undefined,
  });
}
</script>

<template>
  <div>
    <SiteHeader v-if="site" :site="site" :categories="navCategories" />

    <main class="page-main">
      <div class="container">
        <slot />
      </div>
    </main>

    <SiteFooter v-if="site" :site="site" />
  </div>
</template>
