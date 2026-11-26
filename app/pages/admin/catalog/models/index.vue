<script setup lang="ts">
import type { AdminModelDto, AdminTypeListItemDto } from "~/types/admin-catalog";

definePageMeta({ layout: "admin" });
useSeoMeta({ title: "Товары каталога · админка", robots: "noindex, nofollow" });

const requestFetch = useRequestFetch();
const status = ref("unpublished");
const { data, error, refresh } = await useAsyncData(
  () => `admin-models-${status.value}`,
  async () => {
    const [models, types] = await Promise.all([
      requestFetch<{ models: AdminModelDto[] }>(`/api/admin/catalog/models?status=${status.value}`),
      requestFetch<{ types: AdminTypeListItemDto[] }>("/api/admin/catalog/types"),
    ]);
    return { models: models.models, types: types.types };
  },
);
throwIfError(error.value);
const models = computed(() => data.value?.models ?? []);
const types = computed(() => data.value?.types ?? []);
const notice = ref("");
async function saved() { notice.value = "Модель сохранена"; await refresh(); }
async function removed() { notice.value = "Модель удалена"; await refresh(); }
</script>

<template>
  <div class="admin-page">
    <div class="admin-page__head">
      <div>
        <div class="admin-breadcrumbs"><NuxtLink to="/admin">Админка</NuxtLink><span>/</span><span>Каталог</span></div>
        <h1 class="admin-page__title">Товары каталога</h1>
        <p class="admin-page__lead">Здесь можно разобрать импортированные товары без категории. Они не показываются на сайте.</p>
      </div>
    </div>
    <div class="admin-form__grid">
      <label class="field">
        <span class="field__label">Отбор</span>
        <select v-model="status" class="field__input">
          <option value="unpublished">Неопубликованные</option>
          <option value="published">Опубликованные</option>
          <option value="all">Все товары</option>
        </select>
      </label>
    </div>
    <p v-if="notice" class="admin-notice">{{ notice }}</p>
    <div class="admin-list">
      <AdminModelCard v-for="model in models" :key="model.id" :model="model" :types="types" @saved="saved" @removed="removed" />
      <p v-if="models.length === 0" class="admin-form__note">Товаров по этому отбору нет.</p>
    </div>
  </div>
</template>