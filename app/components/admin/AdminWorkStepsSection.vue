<script setup lang="ts">
import type { FetchError } from "ofetch";
import type { AdminWorkStepDto } from "~/types/admin-content";
import {
  emptyWorkStepForm,
  workStepFormBody,
  workStepFormFrom,
  type WorkStepForm,
} from "~/utils/admin-content-forms";

/** Порядок работы — нумерованный список «Как заказать технику» на главной. */
defineProps<{ items: AdminWorkStepDto[] }>();

const emit = defineEmits<{ saved: [] }>();

const form = ref<WorkStepForm>(emptyWorkStepForm());
const editingId = ref<string | null>(null);
const formOpen = ref(false);
const notice = ref<string | null>(null);
const removeError = ref<string | null>(null);

const { fieldErrors, formError, pending, submit } = useAdminForm();

function openCreate() {
  form.value = emptyWorkStepForm();
  editingId.value = null;
  formOpen.value = true;
  notice.value = null;
  removeError.value = null;
}

function openEdit(item: AdminWorkStepDto) {
  form.value = workStepFormFrom(item);
  editingId.value = item.id;
  formOpen.value = true;
  notice.value = null;
  removeError.value = null;
}

function closeForm() {
  formOpen.value = false;
  editingId.value = null;
}

async function save() {
  const body = workStepFormBody(form.value);
  const isEdit = Boolean(editingId.value);

  const result = await submit(() =>
    isEdit
      ? $fetch(`/api/admin/content/steps/${editingId.value}`, { method: "PATCH", body })
      : $fetch("/api/admin/content/steps", { method: "POST", body }),
  );

  if (!result) return;

  notice.value = isEdit ? "Шаг сохранён" : "Шаг добавлен";
  closeForm();
  emit("saved");
}

async function remove(item: AdminWorkStepDto) {
  if (!import.meta.client) return;
  if (!window.confirm(`Удалить шаг «${item.title}»? Действие необратимо.`)) return;

  removeError.value = null;
  notice.value = null;

  try {
    await $fetch(`/api/admin/content/steps/${item.id}`, { method: "DELETE" });
    notice.value = "Шаг удалён";
    if (editingId.value === item.id) closeForm();
    emit("saved");
  } catch (error) {
    const fetchError = error as FetchError<{ message?: string }>;
    removeError.value = fetchError.data?.message ?? "Не удалось удалить шаг";
  }
}
</script>

<template>
  <div class="admin-subcard">
    <div class="admin-subcard__head">
      <div>
        <h2 class="admin-subcard__title">Порядок работы</h2>
        <p class="admin-page__lead">Нумерованный список «Как заказать технику» на главной: порядок задаёт номер шага.</p>
      </div>
      <button type="button" class="button" @click="openCreate">+ Шаг</button>
    </div>

    <p v-if="notice" class="admin-notice">{{ notice }}</p>
    <p v-if="removeError" class="admin-form__error">{{ removeError }}</p>

    <div v-if="formOpen" class="admin-form__section">
      <form class="admin-form" novalidate @submit.prevent="save">
        <div class="admin-form__grid admin-form__grid--half">
          <AdminField label="Название шага" :error="fieldErrors.title">
            <input v-model="form.title" class="field__input" type="text" name="title" autocomplete="off">
          </AdminField>

          <AdminField label="Порядок" :error="fieldErrors.sortOrder" hint="Меньше — выше в списке">
            <input v-model.number="form.sortOrder" class="field__input" type="number" min="0" step="10" name="sortOrder">
          </AdminField>
        </div>

        <AdminField label="Описание" :error="fieldErrors.text">
          <textarea v-model="form.text" class="field__input field__textarea" name="text" rows="3" />
        </AdminField>

        <label class="field field--check">
          <input v-model="form.isPublished" type="checkbox" name="isPublished">
          <span class="field__label">Опубликован на сайте</span>
        </label>

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
            <th>Шаг</th>
            <th>Порядок</th>
            <th>Публикация</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td>
              <strong>{{ item.title }}</strong>
              <div v-if="item.text" class="muted admin-clamp">{{ item.text }}</div>
            </td>
            <td>{{ item.sortOrder }}</td>
            <td>
              <span :class="['admin-badge', item.isPublished ? 'admin-badge--on' : 'admin-badge--off']">
                {{ item.isPublished ? "опубликован" : "черновик" }}
              </span>
            </td>
            <td>
              <div class="table__actions">
                <button type="button" class="button button--ghost button--small" @click="openEdit(item)">
                  Изменить
                </button>
                <button
                  type="button"
                  class="button button--ghost button--small button--danger"
                  @click="remove(item)"
                >
                  Удалить
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="items.length === 0">
            <td colspan="4" class="muted">Шагов пока нет — добавьте первый.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
