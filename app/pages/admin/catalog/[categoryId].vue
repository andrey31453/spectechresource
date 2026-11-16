<script setup lang="ts">
import type { FetchError } from "ofetch";
import { PRICE_UNIT_LABELS } from "#shared/schemas/catalog";
import type { AdminCategoryDto, AdminTypeDto, AdminTypeListItemDto } from "~/types/admin-catalog";
import {
  emptyTypeForm,
  typeFormBody,
  typeFormFrom,
  type TypeForm,
} from "~/utils/admin-catalog-forms";

definePageMeta({ layout: "admin" });

useSeoMeta({
  title: "Виды техники · админка",
  robots: "noindex, nofollow",
});

const route = useRoute();
const categoryId = computed(() => String(route.params.categoryId ?? ""));
const requestFetch = useRequestFetch();

const { data, error, refresh } = await useAsyncData(
  () => `admin-category-${categoryId.value}`,
  async () => {
    const [categories, types] = await Promise.all([
      requestFetch<{ categories: AdminCategoryDto[] }>("/api/admin/catalog/categories"),
      requestFetch<{ types: AdminTypeListItemDto[] }>(
        `/api/admin/catalog/types?categoryId=${encodeURIComponent(categoryId.value)}`,
      ),
    ]);

    return {
      category: categories.categories.find((item) => item.id === categoryId.value) ?? null,
      categories: categories.categories,
      types: types.types,
    };
  },
);
throwIfError(error.value);

if (!data.value?.category) {
  throw createError({ statusCode: 404, message: "Раздел каталога не найден" });
}

const category = computed(() => data.value?.category ?? null);
const categories = computed(() => data.value?.categories ?? []);
const types = computed(() => data.value?.types ?? []);

const form = ref<TypeForm>(emptyTypeForm(categoryId.value));
const editingId = ref<string | null>(null);
const formOpen = ref(false);
const formLoading = ref(false);
const notice = ref<string | null>(null);
const removeError = ref<string | null>(null);

const { fieldErrors, formError, pending, submit } = useAdminForm();

function openCreate() {
  form.value = emptyTypeForm(categoryId.value);
  editingId.value = null;
  formOpen.value = true;
  notice.value = null;
  removeError.value = null;
}

/** В списке только основные поля, поэтому карточку для формы читаем отдельно. */
async function openEdit(type: AdminTypeListItemDto) {
  if (formLoading.value) return;

  formLoading.value = true;
  notice.value = null;
  removeError.value = null;

  try {
    const response = await $fetch<{ type: AdminTypeDto }>(`/api/admin/catalog/types/${type.id}`);
    form.value = typeFormFrom(response.type);
    editingId.value = type.id;
    formOpen.value = true;
  } catch (err) {
    const fetchError = err as FetchError<{ message?: string }>;
    removeError.value = fetchError.data?.message ?? "Не удалось открыть вид техники";
  } finally {
    formLoading.value = false;
  }
}

function closeForm() {
  formOpen.value = false;
  editingId.value = null;
  removeError.value = null;
}

async function save() {
  const body = typeFormBody(form.value);
  const isEdit = Boolean(editingId.value);

  const result = await submit(() =>
    isEdit
      ? $fetch(`/api/admin/catalog/types/${editingId.value}`, { method: "PATCH", body })
      : $fetch("/api/admin/catalog/types", { method: "POST", body }),
  );

  if (!result) return;

  notice.value = isEdit ? "Вид техники сохранён" : "Вид техники создан";
  closeForm();
  await refresh();
}

async function remove(type: AdminTypeListItemDto) {
  if (!import.meta.client) return;

  const confirmed = window.confirm(
    `Удалить вид «${type.name}»? Модели и характеристики удалятся, заявки останутся без привязки.`,
  );
  if (!confirmed) return;

  removeError.value = null;

  try {
    const result = await $fetch<{ deletedModels: number; detachedLeads: number }>(
      `/api/admin/catalog/types/${type.id}`,
      { method: "DELETE" },
    );
    notice.value = `Вид удалён: моделей — ${result.deletedModels}, заявок без привязки — ${result.detachedLeads}`;
    if (editingId.value === type.id) closeForm();
    await refresh();
  } catch (err) {
    const fetchError = err as FetchError<{ message?: string }>;
    removeError.value = fetchError.data?.message ?? "Не удалось удалить вид техники";
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
          <NuxtLink to="/admin/catalog">Каталог</NuxtLink>
          <span>/</span>
          <span>{{ category?.title }}</span>
        </div>
        <h1 class="admin-page__title">{{ category?.title }}</h1>
        <p class="admin-page__lead">
          Виды техники раздела. У каждого вида своя посадочная страница
          <code>/arenda-{код}-v-{город}</code>.
        </p>
      </div>
      <div class="admin-page__actions">
        <button type="button" class="button" @click="openCreate">+ Вид техники</button>
      </div>
    </div>

    <p v-if="notice" class="admin-notice">{{ notice }}</p>
    <p v-if="removeError" class="admin-form__error">{{ removeError }}</p>

    <div v-if="formOpen" class="admin-subcard">
      <div class="admin-subcard__head">
        <h2 class="admin-subcard__title">{{ editingId ? "Правка вида техники" : "Новый вид техники" }}</h2>
        <button type="button" class="button button--ghost button--small" @click="closeForm">Закрыть</button>
      </div>

      <form class="admin-form" novalidate @submit.prevent="save">
        <AdminTypeFields v-model="form" :categories="categories" :errors="fieldErrors" />

        <p v-if="formError" class="admin-form__error" role="alert">{{ formError }}</p>

        <div class="admin-form__actions">
          <button type="submit" class="button" :disabled="pending">
            {{ pending ? "Сохраняем…" : "Сохранить" }}
          </button>
          <button type="button" class="button button--ghost" @click="closeForm">Отмена</button>
        </div>
      </form>
    </div>

    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Вид техники</th>
            <th>Код</th>
            <th>Цена от</th>
            <th>Моделей</th>
            <th>Порядок</th>
            <th>Публикация</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="type in types" :key="type.id">
            <td>
              <strong>{{ type.name }}</strong>
              <div class="muted">{{ type.nameGenitive }}</div>
            </td>
            <td><code>{{ type.slug }}</code></td>
            <td>
              <template v-if="type.priceFrom">
                от {{ Number(type.priceFrom).toLocaleString("ru-RU") }} ₽ {{ PRICE_UNIT_LABELS[type.priceUnit] }}
              </template>
              <span v-else class="muted">по запросу</span>
            </td>
            <td>{{ type.modelsCount }}</td>
            <td>{{ type.sortOrder }}</td>
            <td>
              <span :class="['admin-badge', type.isPublished ? 'admin-badge--on' : 'admin-badge--off']">
                {{ type.isPublished ? "опубликован" : "черновик" }}
              </span>
            </td>
            <td>
              <div class="table__actions">
                <NuxtLink :to="`/admin/catalog/types/${type.id}`" class="button button--ghost button--small">
                  Модели
                </NuxtLink>
                <button
                  type="button"
                  class="button button--ghost button--small"
                  :disabled="formLoading"
                  @click="openEdit(type)"
                >
                  Изменить
                </button>
                <button
                  type="button"
                  class="button button--ghost button--small button--danger"
                  @click="remove(type)"
                >
                  Удалить
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="types.length === 0">
            <td colspan="7" class="muted">В разделе пока нет видов техники.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
