<script setup lang="ts">
import type { FetchError } from "ofetch";
import type { AdminTrustStatDto } from "~/types/admin-content";
import {
  emptyTrustStatForm,
  trustStatFormBody,
  trustStatFormFrom,
  type TrustStatForm,
} from "~/utils/admin-content-forms";

/** Цифры доверия — строка «120 ед. техники в парке» на главной. */
defineProps<{ items: AdminTrustStatDto[] }>();

const emit = defineEmits<{ saved: [] }>();

const form = ref<TrustStatForm>(emptyTrustStatForm());
const editingId = ref<string | null>(null);
const formOpen = ref(false);
const notice = ref<string | null>(null);
const removeError = ref<string | null>(null);

const { fieldErrors, formError, pending, submit } = useAdminForm();

function openCreate() {
  form.value = emptyTrustStatForm();
  editingId.value = null;
  formOpen.value = true;
  notice.value = null;
  removeError.value = null;
}

function openEdit(item: AdminTrustStatDto) {
  form.value = trustStatFormFrom(item);
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
  const body = trustStatFormBody(form.value);
  const isEdit = Boolean(editingId.value);

  const result = await submit(() =>
    isEdit
      ? $fetch(`/api/admin/content/stats/${editingId.value}`, { method: "PATCH", body })
      : $fetch("/api/admin/content/stats", { method: "POST", body }),
  );

  if (!result) return;

  notice.value = isEdit ? "Цифра сохранена" : "Цифра добавлена";
  closeForm();
  emit("saved");
}

async function remove(item: AdminTrustStatDto) {
  if (!import.meta.client) return;
  if (!window.confirm(`Удалить цифру «${item.value} ${item.unit ?? ""}»? Действие необратимо.`)) return;

  removeError.value = null;
  notice.value = null;

  try {
    await $fetch(`/api/admin/content/stats/${item.id}`, { method: "DELETE" });
    notice.value = "Цифра удалена";
    if (editingId.value === item.id) closeForm();
    emit("saved");
  } catch (error) {
    const fetchError = error as FetchError<{ message?: string }>;
    removeError.value = fetchError.data?.message ?? "Не удалось удалить цифру";
  }
}
</script>

<template>
  <div class="admin-subcard">
    <div class="admin-subcard__head">
      <div>
        <h2 class="admin-subcard__title">Цифры доверия</h2>
        <p class="admin-page__lead">Строка под заголовком главной: «120 ед. техники в парке», «12 лет на рынке».</p>
      </div>
      <button type="button" class="button" @click="openCreate">+ Цифра</button>
    </div>

    <p v-if="notice" class="admin-notice">{{ notice }}</p>
    <p v-if="removeError" class="admin-form__error">{{ removeError }}</p>

    <div v-if="formOpen" class="admin-form__section">
      <form class="admin-form" novalidate @submit.prevent="save">
        <div class="admin-form__grid">
          <AdminField
            label="Значение"
            :error="fieldErrors.value"
            hint="Строкой, чтобы писать «12+» и «4,9»"
          >
            <input v-model="form.value" class="field__input" type="text" name="value" autocomplete="off">
          </AdminField>

          <AdminField label="Единица" :error="fieldErrors.unit" hint="ед., лет, %, часа">
            <input v-model="form.unit" class="field__input" type="text" name="unit" autocomplete="off">
          </AdminField>

          <AdminField label="Порядок" :error="fieldErrors.sortOrder" hint="Меньше — выше в списке">
            <input v-model.number="form.sortOrder" class="field__input" type="number" min="0" step="10" name="sortOrder">
          </AdminField>
        </div>

        <AdminField label="Подпись" :error="fieldErrors.label">
          <input v-model="form.label" class="field__input" type="text" name="label" autocomplete="off">
        </AdminField>

        <label class="field field--check">
          <input v-model="form.isPublished" type="checkbox" name="isPublished">
          <span class="field__label">Опубликована на сайте</span>
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
            <th>Цифра</th>
            <th>Порядок</th>
            <th>Публикация</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td>
              <strong>{{ item.value }}</strong>
              <span v-if="item.unit" class="muted"> {{ item.unit }}</span>
              <div class="muted">{{ item.label }}</div>
            </td>
            <td>{{ item.sortOrder }}</td>
            <td>
              <span :class="['admin-badge', item.isPublished ? 'admin-badge--on' : 'admin-badge--off']">
                {{ item.isPublished ? "опубликована" : "черновик" }}
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
            <td colspan="4" class="muted">Цифр пока нет — добавьте первую.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
