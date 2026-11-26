<script setup lang="ts">
import type { AdminModelDto, AdminTypeListItemDto } from "~/types/admin-catalog";

definePageMeta({ layout: "admin", key: route => route.path });
useSeoMeta({ title: "Модель техники · админка", robots: "noindex, nofollow" });
const route = useRoute();
const requestFetch = useRequestFetch();
const { data, error, refresh } = await useAsyncData(
  () => `admin-model-${route.params.id}`,
  async () => {
    const [model, types] = await Promise.all([
      requestFetch<{ model: AdminModelDto; type: { id: string; name: string; slug: string } | null }>(`/api/admin/catalog/models/${route.params.id}`),
      requestFetch<{ types: AdminTypeListItemDto[] }>("/api/admin/catalog/types"),
    ]);
    return { ...model, types: types.types };
  },
);
throwIfError(error.value);
if (!data.value) throw createError({ statusCode: 404, message: "Модель не найдена" });
const notice = ref("");
async function saved() {
  notice.value = "Модель сохранена";
  await refresh();
}
</script>

<template>
  <div v-if="data" class="admin-page">
    <div class="admin-page__head">
      <div>
        <div class="admin-breadcrumbs"><NuxtLink to="/admin/catalog">Каталог</NuxtLink><span>/</span><span>{{ data.type?.name ?? "Без категории" }}</span></div>
        <h1 class="admin-page__title">{{ data.model.brand }} {{ data.model.model }}</h1>
      </div>
      <NuxtLink v-if="data.type && data.model.isPublished" :to="modelPath(data.type.slug, data.model.slug)" class="button button--ghost" target="_blank">Открыть на сайте</NuxtLink>
    </div>
    <p v-if="notice" class="admin-notice" role="status">{{ notice }}</p>
    <AdminModelCard :model="data.model" :types="data.types" @saved="saved" @removed="navigateTo('/admin/catalog/models')" />
  </div>
</template>