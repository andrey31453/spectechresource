<script setup lang="ts">
import type { CatalogTypeDto, ServiceCardDto } from "~/types/catalog";

const { data: site } = await useSite();

const route = useRoute();

/** Страницы с полноэкранными полосами объявляют `definePageMeta({ fullBleed: true })`. */
const fullBleed = computed(() => route.meta.fullBleed === true);

const { data: types } = await useAsyncData<CatalogTypeDto[]>(
  "nav-categories",
  () => $fetch<CatalogTypeDto[]>("/api/catalog"),
  { deep: false },
);

const { data: services } = await useAsyncData<ServiceCardDto[]>(
  "nav-services", () => $fetch<ServiceCardDto[]>("/api/services"), { deep: false },
);

const navCategories = computed(() =>
  (types.value ?? []).map((type) => ({ slug: type.slug, title: type.name })),
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
  <div class="flex min-h-screen flex-col bg-sand text-ink">
    <SiteHeader v-if="site" :site="site" :categories="navCategories" :services="services ?? []" />

    <main v-if="fullBleed" class="flex-1">
      <slot />
    </main>

    <main v-else class="page-main flex-1">
      <div class="container">
        <slot />
      </div>
    </main>

    <SiteFooter v-if="site" :site="site" :categories="navCategories" :services="services ?? []" />
  </div>
</template>
