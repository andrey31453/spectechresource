<script setup lang="ts">
import type { FetchError } from "ofetch";
import type { AdminServiceDto } from "~/types/admin-services";
import type { AdminTypeListItemDto } from "~/types/admin-catalog";
import {
  emptyServiceForm,
  serviceFormBody,
  serviceFormFrom,
  type ServiceForm,
} from "~/utils/admin-services-forms";

definePageMeta({ layout: "admin" });

useSeoMeta({
  title: "Услуги · админка",
  robots: "noindex, nofollow",
});

const requestFetch = useRequestFetch();

const { data, error, refresh } = await useAsyncData("admin-services", () =>
  requestFetch<{ services: AdminServiceDto[] }>("/api/admin/services"),
);
throwIfError(error.value);
const { data: typeData, error: typeError } = await useAsyncData("admin-service-types", () =>
  requestFetch<{ types: AdminTypeListItemDto[] }>("/api/admin/catalog/types"),
);
throwIfError(typeError.value);

const services = computed(() => data.value?.services ?? []);

const form = ref<ServiceForm>(emptyServiceForm());
const editingId = ref<string | null>(null);
const formOpen = ref(false);
const notice = ref<string | null>(null);
const removeError = ref<string | null>(null);

const { fieldErrors, formError, pending, submit } = useAdminForm();

function openCreate() {
  form.value = emptyServiceForm();
  editingId.value = null;
  formOpen.value = true;
  notice.value = null;
  removeError.value = null;
}

function openEdit(service: AdminServiceDto) {
  form.value = serviceFormFrom(service);
  editingId.value = service.id;
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
  const body = serviceFormBody(form.value);
  const isEdit = Boolean(editingId.value);

  const result = await submit(() =>
    isEdit
      ? $fetch(`/api/admin/services/${editingId.value}`, { method: "PATCH", body })
      : $fetch("/api/admin/services", { method: "POST", body }),
  );

  if (!result) return;

  notice.value = isEdit ? "Услуга сохранена" : "Услуга создана";
  closeForm();
  await refresh();
}

async function remove(service: AdminServiceDto) {
  if (!import.meta.client) return;
  if (!window.confirm(`Удалить услугу «${service.title}»? Действие необратимо.`)) return;

  removeError.value = null;

  try {
    await $fetch(`/api/admin/services/${service.id}`, { method: "DELETE" });
    notice.value = "Услуга удалена";
    if (editingId.value === service.id) closeForm();
    await refresh();
  } catch (err) {
    const fetchError = err as FetchError<{ message?: string }>;
    removeError.value = fetchError.data?.message ?? "Не удалось удалить услугу";
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
          <span>Услуги</span>
        </div>
        <h1 class="admin-page__title">Услуги</h1>
        <p class="admin-page__lead">
          Услуга — страница <code>/uslugi/{код}</code>: краткое описание, SEO-текст и собственные
          вопросы FAQ. Вопросы добавляются в слайсе «Контент».
        </p>
      </div>
      <div class="admin-page__actions">
        <button type="button" class="button" @click="openCreate">+ Услуга</button>
      </div>
    </div>

    <p v-if="notice" class="admin-notice">{{ notice }}</p>
    <p v-if="removeError" class="admin-form__error">{{ removeError }}</p>

    <div v-if="formOpen" class="admin-subcard">
      <div class="admin-subcard__head">
        <h2 class="admin-subcard__title">{{ editingId ? "Правка услуги" : "Новая услуга" }}</h2>
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
            hint="Латиница, цифры и дефис: vyvoz-grunta"
          >
            <input v-model="form.slug" class="field__input" type="text" name="slug" autocomplete="off">
          </AdminField>

          <AdminField label="Порядок" :error="fieldErrors.sortOrder" hint="Меньше — выше в списке">
            <input v-model.number="form.sortOrder" class="field__input" type="number" min="0" step="10" name="sortOrder">
          </AdminField>
        </div>

        <AdminField
          label="Краткое описание"
          :error="fieldErrors.description"
          hint="Лид-абзац: показывается в списке услуг и в начале страницы"
        >
          <textarea v-model="form.description" class="field__input field__textarea" name="description" rows="3" />
        </AdminField>

        <AdminImageField
          v-model="form.image"
          label="Изображение услуги"
          :error="fieldErrors.image"
          hint="Показывается в карточке услуги и на странице"
        />

        <AdminField label="Верхнее описание (markdown)" :error="fieldErrors.descriptionTop" hint="Перед блоком техники">
          <textarea v-model="form.descriptionTop" class="field__input field__textarea" name="descriptionTop" rows="10" />
        </AdminField>
        <AdminField label="Виды техники для услуги" :error="fieldErrors.equipmentTypeIds" hint="На сайте показываются только опубликованные виды, разделы и модели. Порядок — как в каталоге.">
          <div>
            <label v-for="type in typeData?.types ?? []" :key="type.id" class="field field--check">
              <input v-model="form.equipmentTypeIds" type="checkbox" :value="type.id" name="equipmentTypeIds">
              <span>{{ type.name }}{{ type.isPublished ? '' : ' (скрыт)' }}</span>
            </label>
            <p v-if="!typeData?.types.length" class="field__hint">Сначала добавьте виды техники в каталог.</p>
          </div>
        </AdminField>
        <AdminField label="Нижнее описание (markdown)" :error="fieldErrors.descriptionBottom" hint="После блока техники">
          <textarea v-model="form.descriptionBottom" class="field__input field__textarea" name="descriptionBottom" rows="10" />
        </AdminField>

        <label class="field field--check">
          <input v-model="form.isPublished" type="checkbox" name="isPublished">
          <span class="field__label">Опубликована на сайте</span>
        </label>

        <details>
          <summary class="field__hint">SEO-поля и текст услуги</summary>
          <div class="admin-form__grid">
            <AdminField label="SEO-заголовок" :error="fieldErrors.seoTitle">
              <input v-model="form.seoTitle" class="field__input" type="text" name="seoTitle">
            </AdminField>
            <AdminField label="SEO-описание" :error="fieldErrors.seoDescription">
              <input v-model="form.seoDescription" class="field__input" type="text" name="seoDescription">
            </AdminField>
          </div>
          <AdminField label="Прежний SEO-текст (markdown)" :error="fieldErrors.seoText" hint="Сохраняется для совместимости. Выводится только если оба новых описания пусты.">
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
            <th>Услуга</th>
            <th>Код</th>
            <th>Вопросов</th>
            <th>Порядок</th>
            <th>Публикация</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="service in services" :key="service.id">
            <td>
              <strong>{{ service.title }}</strong>
              <div v-if="service.description" class="muted">{{ service.description }}</div>
            </td>
            <td><code>{{ service.slug }}</code></td>
            <td>{{ service.faqCount }}</td>
            <td>{{ service.sortOrder }}</td>
            <td>
              <span :class="['admin-badge', service.isPublished ? 'admin-badge--on' : 'admin-badge--off']">
                {{ service.isPublished ? "опубликована" : "черновик" }}
              </span>
            </td>
            <td>
              <div class="table__actions">
                <NuxtLink
                  v-if="service.isPublished"
                  :to="`/uslugi/${service.slug}`"
                  target="_blank"
                  class="button button--ghost button--small"
                >
                  Открыть
                </NuxtLink>
                <button type="button" class="button button--ghost button--small" @click="openEdit(service)">
                  Изменить
                </button>
                <button
                  type="button"
                  class="button button--ghost button--small button--danger"
                  @click="remove(service)"
                >
                  Удалить
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="services.length === 0">
            <td colspan="6" class="muted">Услуг пока нет — создайте первую.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
