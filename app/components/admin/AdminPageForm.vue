<script setup lang="ts">
import type { FetchError } from "ofetch";
import type { AdminPageDto } from "~/types/admin-pages";
import { emptyPageForm, pageFormBody, pageFormFrom, type PageForm } from "~/utils/admin-pages-forms";

/**
 * Форма страницы: одна на создание и правку, чтобы поля, подсказки и обработка
 * ошибок не расходились между экранами. Сохранение и удаление — здесь же,
 * навигацию после них решает страница.
 */
const props = defineProps<{
  mode: "create" | "edit";
  page?: AdminPageDto | null;
}>();

const emit = defineEmits<{
  saved: [page: AdminPageDto];
  removed: [];
}>();

const form = ref<PageForm>(props.page ? pageFormFrom(props.page) : emptyPageForm());
const removeError = ref<string | null>(null);
const { fieldErrors, formError, pending, submit } = useAdminForm();

// Карточка приходит из useAsyncData: при клиентском переходе данные могут появиться
// после монтирования формы — тогда заполняем её тем, что загрузилось.
watch(
  () => props.page,
  (page) => {
    if (page) form.value = pageFormFrom(page);
  },
);

async function save() {
  const body = pageFormBody(form.value);
  const isCreate = props.mode === "create";

  const result = await submit(() =>
    isCreate
      ? $fetch<{ page: AdminPageDto }>("/api/admin/pages", { method: "POST", body })
      : $fetch<{ page: AdminPageDto }>(`/api/admin/pages/${props.page?.id}`, { method: "PATCH", body }),
  );

  if (!result) return;

  // Сервер нормализует код (нижний регистр) — показываем то, что реально сохранилось.
  form.value = pageFormFrom(result.page);
  emit("saved", result.page);
}

async function remove() {
  if (!props.page || !import.meta.client) return;
  if (!window.confirm(`Удалить страницу «${props.page.title}»? Действие необратимо.`)) return;

  removeError.value = null;

  try {
    await $fetch(`/api/admin/pages/${props.page.id}`, { method: "DELETE" });
    emit("removed");
  } catch (err) {
    const fetchError = err as FetchError<{ message?: string }>;
    removeError.value = fetchError.data?.message ?? "Не удалось удалить страницу";
  }
}
</script>

<template>
  <form class="admin-form" novalidate @submit.prevent="save">
    <fieldset class="admin-form__section">
      <legend class="admin-form__legend">Страница</legend>

      <div class="admin-form__grid">
        <AdminField label="Заголовок" :error="fieldErrors.title">
          <input v-model="form.title" class="field__input" type="text" name="title" autocomplete="off">
        </AdminField>

        <AdminField
          label="Код для адреса"
          :error="fieldErrors.slug"
          hint="Латиница, цифры и дефис: страница откроется по адресу /код"
        >
          <input v-model="form.slug" class="field__input" type="text" name="slug" autocomplete="off">
        </AdminField>
      </div>

      <AdminField
        label="Текст страницы (markdown)"
        :error="fieldErrors.content"
        hint="Заголовки ##, списки «- », цитаты «> », **жирный**, _курсив_, ссылки [текст](https://…)"
      >
        <textarea
          v-model="form.content"
          class="field__input field__textarea field__textarea--code"
          name="content"
          rows="18"
          spellcheck="false"
        />
      </AdminField>
    </fieldset>

    <fieldset class="admin-form__section">
      <legend class="admin-form__legend">SEO</legend>

      <div class="admin-form__grid">
        <AdminField
          label="SEO-заголовок"
          :error="fieldErrors.seoTitle"
          hint="Если пусто — на сайте берётся заголовок страницы"
        >
          <input v-model="form.seoTitle" class="field__input" type="text" name="seoTitle">
        </AdminField>

        <AdminField label="SEO-описание" :error="fieldErrors.seoDescription">
          <input v-model="form.seoDescription" class="field__input" type="text" name="seoDescription">
        </AdminField>
      </div>

      <label class="field field--check">
        <input v-model="form.isPublished" type="checkbox" name="isPublished">
        <span class="field__label">Опубликована на сайте</span>
      </label>
    </fieldset>

    <p v-if="formError" class="admin-form__error" role="alert">{{ formError }}</p>
    <p v-if="removeError" class="admin-form__error">{{ removeError }}</p>

    <div class="admin-form__actions">
      <button type="submit" class="button" :disabled="pending">
        {{ pending ? "Сохраняем…" : "Сохранить" }}
      </button>
      <NuxtLink to="/admin/pages" class="button button--ghost">К списку</NuxtLink>
      <a
        v-if="page?.isPublished"
        :href="`/${page.slug}`"
        class="button button--ghost"
        target="_blank"
        rel="noopener"
      >
        Открыть на сайте
      </a>
      <button
        v-if="mode === 'edit'"
        type="button"
        class="button button--ghost button--danger"
        @click="remove"
      >
        Удалить
      </button>
    </div>
  </form>
</template>
