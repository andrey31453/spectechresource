<script setup lang="ts">
const route = useRoute();
const slug = computed(() => String(route.params.slug ?? ""));
const { data, error } = await useFetch("/api/rental-route", { query: { slug } });
throwIfError(error.value);
</script>

<template>
  <CategoryCatalogPage v-if="data?.kind === 'category'" :key="slug" :slug="slug" />
  <EquipmentTypeLanding v-else :key="`type-${slug}`" />
</template>
