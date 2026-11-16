<script setup lang="ts">
import type { FetchError } from "ofetch";
import type { AdminPageListItemDto } from "~/types/admin-pages";

definePageMeta({ layout: "admin" });

useSeoMeta({
  title: "Страницы · админка",
  robots: "noindex, nofollow",
});

const requestFetch = useRequestFetch();

const { data, error, refresh } = await useAsyncData("admin-pages", () =>
  requestFetch<{ pages: AdminPageListItemDto[] }>("/api/admin/pages"),
);
throwIfError(error.value);

const pages = computed(() => data.value?.pages ?? []);

const notice = ref<string | null>(null);
const removeError = ref<string | null>(null);

const dateTime = (iso: string) =>
  new Date(iso).toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" });

async function remove(page: AdminPageListItemDto) {
  if (!import.meta.client) return;
  if (!window.confirm(`Удалить страницу «${page.title}»? Действие необратимо.`)) return;

  removeError.value = null;

  try {
    await $fetch(`/api/admin/pages/${page.id}`, { method: "DELETE" });
    notice.value = "Страница удалена";
    await refresh();
  } catch (err) {
    const fetchError = err as FetchError<{ message?: string }>;
    removeError.value = fetchError.data?.message ?? "Не удалось удалить страницу";
  }
}
</script>

<template>
  <div class="admin-page">
    <div class="admin-page__head">
      <div>
        <div class="admin-breadcrumbs">
          <NuxtLink to="/admin">Админка</NuxtLink>
          <span>/</span>
          <span>Страницы</span>
        </div>
        <h1 class="admin-page__title">Страницы</h1>
        <p class="admin-page__lead">
          Статические страницы сайта: политика ПДн, условия, доставка. Открываются по адресу
          <code>/код</code>, текст — markdown.
        </p>
      </div>
      <div class="admin-page__actions">
        <NuxtLink to="/admin/pages/new" class="button">+ Страница</NuxtLink>
      </div>
    </div>

    <p v-if="notice" class="admin-notice">{{ notice }}</p>
    <p v-if="removeError" class="admin-form__error">{{ removeError }}</p>

    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Страница</th>
            <th>Публикация</th>
            <th>Обновлена</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="page in pages" :key="page.id">
            <td>
              <strong>{{ page.title }}</strong>
              <div class="muted"><code>/{{ page.slug }}</code></div>
            </td>
            <td>
              <span :class="['admin-badge', page.isPublished ? 'admin-badge--on' : 'admin-badge--off']">
                {{ page.isPublished ? "опубликована" : "черновик" }}
              </span>
            </td>
            <td class="muted">{{ dateTime(page.updatedAt) }}</td>
            <td>
              <div class="table__actions">
                <NuxtLink :to="`/admin/pages/${page.id}`" class="button button--ghost button--small">
                  Изменить
                </NuxtLink>
                <a
                  v-if="page.isPublished"
                  :href="`/${page.slug}`"
                  class="button button--ghost button--small"
                  target="_blank"
                  rel="noopener"
                >
                  Открыть
                </a>
                <button
                  type="button"
                  class="button button--ghost button--small button--danger"
                  @click="remove(page)"
                >
                  Удалить
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="pages.length === 0">
            <td colspan="4" class="muted">Страниц пока нет — создайте первую.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
