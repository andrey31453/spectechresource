<script setup lang="ts">
interface Crumb {
  name: string;
  path?: string;
}

const props = defineProps<{ items: Crumb[] }>();

const {
  public: { siteUrl },
} = useRuntimeConfig();
const base = String(siteUrl).replace(/\/+$/, "");

useJsonLd("breadcrumbs", {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: props.items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    ...(item.path
      ? { item: item.path === "/" ? `${base}/` : `${base}${item.path}` }
      : {}),
  })),
});
</script>

<template>
  <nav class="breadcrumbs" aria-label="Хлебные крошки">
    <ol>
      <li v-for="item in items" :key="item.name">
        <NuxtLink v-if="item.path" :to="item.path">{{ item.name }}</NuxtLink>
        <span v-else aria-current="page">{{ item.name }}</span>
      </li>
    </ol>
  </nav>
</template>
