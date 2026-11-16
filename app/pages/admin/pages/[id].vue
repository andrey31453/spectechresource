<script setup lang="ts">
import type { AdminPageDto } from "~/types/admin-pages";

definePageMeta({ layout: "admin" });

useSeoMeta({
  title: "Страница · админка",
  robots: "noindex, nofollow",
});

const route = useRoute();
const id = String(route.params.id ?? "");
const requestFetch = useRequestFetch();

const { data, error, refresh } = await useAsyncData(`admin-page-${id}`, () =>
  requestFetch<{ page: AdminPageDto }>(`/api/admin/pages/${id}`),
);
throwIfError(error.value);

const page = computed(() => data.value?.page ?? null);
const notice = ref<string | null>(null);

const dateTime = (iso: string) =>
  new Date(iso).toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" });

async function onSaved() {
  notice.value = "Страница сохранена";
  await refresh();
}

async function onRemoved() {
  await navigateTo("/admin/pages");
}
</script>

<template>
  <div v-if="page" class="admin-page">
    <div class="admin-page__head">
      <div>
        <div class="admin-breadcrumbs">
          <NuxtLink to="/admin">Админка</NuxtLink>
          <span>/</span>
          <NuxtLink to="/admin/pages">Страницы</NuxtLink>
          <span>/</span>
          <span>{{ page.title }}</span>
        </div>
        <h1 class="admin-page__title">{{ page.title }}</h1>
        <p class="admin-page__lead">
          Адрес: <code>/{{ page.slug }}</code> · обновлена {{ dateTime(page.updatedAt) }}
        </p>
      </div>
      <div class="admin-page__actions">
        <span :class="['admin-badge', page.isPublished ? 'admin-badge--on' : 'admin-badge--off']">
          {{ page.isPublished ? "опубликована" : "черновик" }}
        </span>
      </div>
    </div>

    <p v-if="notice" class="admin-notice">{{ notice }}</p>

    <AdminPageForm mode="edit" :page="page" @saved="onSaved" @removed="onRemoved" />
  </div>
</template>
