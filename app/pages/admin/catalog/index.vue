<script setup lang="ts">
import type { FetchError } from "ofetch";
import type { AdminCategoryDto } from "~/types/admin-catalog";
import {
  categoryFormBody,
  categoryFormFrom,
  emptyCategoryForm,
  type CategoryForm,
} from "~/utils/admin-catalog-forms";

definePageMeta({ layout: "admin" });

useSeoMeta({
  title: "Каталог · админка",
  robots: "noindex, nofollow",
});

const requestFetch = useRequestFetch();

const { data, error, refresh } = await useAsyncData("admin-categories", () =>
  requestFetch<{ categories: AdminCategoryDto[] }>("/api/admin/catalog/categories"),
);
throwIfError(error.value);

const categories = computed(() => data.value?.categories ?? []);

const form = ref<CategoryForm>(emptyCategoryForm());
const editingId = ref<string | null>(null);
const formOpen = ref(false);
const notice = ref<string | null>(null);
const removeError = ref<string | null>(null);

const { fieldErrors, formError, pending, submit } = useAdminForm();

function openCreate() {
  form.value = emptyCategoryForm();
  editingId.value = null;
  formOpen.value = true;
  notice.value = null;
  removeError.value = null;
}

function openEdit(category: AdminCategoryDto) {
  form.value = categoryFormFrom(category);
  editingId.value = category.id;
  formOpen.value = true;
  notice.value = null;
  removeError.value = null;
}

function closeForm() {
  formOpen.value = false;
  editingId.value = null;
  removeError.value = null;
}

async function save() {
  const body = categoryFormBody(form.value);
  const isEdit = Boolean(editingId.value);

  const result = await submit(() =>
    isEdit
      ? $fetch(`/api/admin/catalog/categories/${editingId.value}`, { method: "PATCH", body })
      : $fetch("/api/admin/catalog/categories", { method: "POST", body }),
  );

  if (!result) return;

  notice.value = isEdit ? "Раздел сохранён" : "Раздел создан";
  closeForm();
  await refresh();
}

async function remove(category: AdminCategoryDto) {
  if (!import.meta.client) return;
  if (!window.confirm(`Удалить раздел «${category.title}»? Действие необратимо.`)) return;

  removeError.value = null;

  try {
    await $fetch(`/api/admin/catalog/categories/${category.id}`, { method: "DELETE" });
    notice.value = "Раздел удалён";
    if (editingId.value === category.id) closeForm();
    await refresh();
  } catch (err) {
    const fetchError = err as FetchError<{ message?: string }>;
    removeError.value = fetchError.data?.message ?? "Не удалось удалить раздел";
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
          <span>Каталог</span>
        </div>
        <h1 class="admin-page__title">Разделы каталога</h1>
        <p class="admin-page__lead">
          Раздел — верхний уровень каталога: <code>/katalog/{код}</code>. Виды техники и модели открываются внутри раздела.
        </p>
      </div>
      <div class="admin-page__actions">
        <button type="button" class="button" @click="openCreate">+ Раздел</button>
      </div>
    </div>

    <p v-if="notice" class="admin-notice">{{ notice }}</p>
    <p v-if="removeError" class="admin-form__error">{{ removeError }}</p>

    <div v-if="formOpen" class="admin-subcard">
      <div class="admin-subcard__head">
        <h2 class="admin-subcard__title">{{ editingId ? "Правка раздела" : "Новый раздел" }}</h2>
        <button type="button" class="button button--ghost button--small" @click="closeForm">Закрыть</button>
      </div>

      <form class="admin-form" novalidate @submit.prevent="save">
        <div class="admin-form__grid">
          <AdminField label="Название" :error="fieldErrors.title">
            <input v-model="form.title" class="field__input" type="text" name="title" autocomplete="off">
          </AdminField>

          <AdminField
            label="Код для адреса"
            :error="fieldErrors.slug"
            hint="Латиница, цифры и дефис: zemleroynaya-tehnika"
          >
            <input v-model="form.slug" class="field__input" type="text" name="slug" autocomplete="off">
          </AdminField>

          <AdminField label="H1 (заголовок страницы)" :error="fieldErrors.h1">
            <input v-model="form.h1" class="field__input" type="text" name="h1">
          </AdminField>

          <AdminField label="Порядок" :error="fieldErrors.sortOrder" hint="Меньше — выше в списке">
            <input v-model.number="form.sortOrder" class="field__input" type="number" min="0" step="10" name="sortOrder">
          </AdminField>
        </div>

        <AdminField label="Короткое описание" :error="fieldErrors.shortDesc">
          <textarea v-model="form.shortDesc" class="field__input field__textarea" name="shortDesc" />
        </AdminField>

        <AdminField label="Описание блока на главной" :error="fieldErrors.description">
          <textarea v-model="form.description" class="field__input field__textarea" name="description" maxlength="2000" rows="5" />
        </AdminField>
        <AdminField label="Цветовая тема" :error="fieldErrors.colorTheme">
          <select v-model="form.colorTheme" class="field__input" name="colorTheme">
            <option value="WHITE">Светлая</option>
            <option value="ORANGE">Оранжевая</option>
            <option value="BLACK">Чёрная</option>
          </select>
        </AdminField>

        <AdminImageField
          v-model="form.image"
          label="Изображение раздела"
          :error="fieldErrors.image"
          hint="Показывается в каталоге и на странице раздела"
        />

        <label class="field field--check">
          <input v-model="form.isPublished" type="checkbox" name="isPublished">
          <span class="field__label">Опубликован на сайте</span>
        </label>

        <details>
          <summary class="field__hint">SEO-поля и текст раздела</summary>
          <div class="admin-form__grid">
            <AdminField label="SEO-заголовок" :error="fieldErrors.seoTitle">
              <input v-model="form.seoTitle" class="field__input" type="text" name="seoTitle">
            </AdminField>
            <AdminField label="SEO-описание" :error="fieldErrors.seoDescription">
              <input v-model="form.seoDescription" class="field__input" type="text" name="seoDescription">
            </AdminField>
          </div>
          <AdminField label="SEO-текст (markdown)" :error="fieldErrors.seoText">
            <textarea v-model="form.seoText" class="field__input field__textarea" name="seoText" rows="6" />
          </AdminField>
        </details>

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
            <th>Раздел</th>
            <th>Код</th>
            <th>Видов</th>
            <th>Порядок</th>
            <th>Публикация</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="category in categories" :key="category.id">
            <td>
              <strong>{{ category.title }}</strong>
              <div v-if="category.h1" class="muted">{{ category.h1 }}</div>
            </td>
            <td><code>{{ category.slug }}</code></td>
            <td>{{ category.typesCount }}</td>
            <td>{{ category.sortOrder }}</td>
            <td>
              <span :class="['admin-badge', category.isPublished ? 'admin-badge--on' : 'admin-badge--off']">
                {{ category.isPublished ? "опубликован" : "черновик" }}
              </span>
            </td>
            <td>
              <div class="table__actions">
                <NuxtLink :to="`/admin/catalog/${category.id}`" class="button button--ghost button--small">
                  Виды
                </NuxtLink>
                <button type="button" class="button button--ghost button--small" @click="openEdit(category)">
                  Изменить
                </button>
                <button
                  type="button"
                  class="button button--ghost button--small button--danger"
                  @click="remove(category)"
                >
                  Удалить
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="categories.length === 0">
            <td colspan="6" class="muted">Разделов пока нет — создайте первый.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
