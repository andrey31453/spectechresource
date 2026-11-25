<script setup lang="ts">
import type { FetchError } from "ofetch";
import { FAQ_SCOPE_LABELS, FAQ_SCOPES } from "#shared/schemas/admin-content";
import type { AdminEquipmentTypeRefDto, AdminFaqDto, AdminServiceRefDto, FaqScopeName } from "~/types/admin-content";
import { emptyFaqForm, faqFormBody, faqFormFrom, type FaqForm } from "~/utils/admin-content-forms";

/**
 * FAQ: один список для главной (`GLOBAL`), страниц видов (`TYPE`) и услуг (`SERVICE`).
 * Область задаёт привязку — форма показывает только нужный выбор.
 */
defineProps<{
  items: AdminFaqDto[];
  services: AdminServiceRefDto[];
  types: AdminEquipmentTypeRefDto[];
}>();

const emit = defineEmits<{ saved: [] }>();

const form = ref<FaqForm>(emptyFaqForm());
const editingId = ref<string | null>(null);
const formOpen = ref(false);
const notice = ref<string | null>(null);
const removeError = ref<string | null>(null);

const { fieldErrors, formError, pending, submit } = useAdminForm();

const scopeOptions = FAQ_SCOPES.map((scope) => ({ value: scope, label: FAQ_SCOPE_LABELS[scope] }));

function openCreate() {
  form.value = emptyFaqForm();
  editingId.value = null;
  formOpen.value = true;
  notice.value = null;
  removeError.value = null;
}

function openEdit(item: AdminFaqDto) {
  form.value = faqFormFrom(item);
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
  const body = faqFormBody(form.value);
  const isEdit = Boolean(editingId.value);

  const result = await submit(() =>
    isEdit
      ? $fetch(`/api/admin/content/faq/${editingId.value}`, { method: "PATCH", body })
      : $fetch("/api/admin/content/faq", { method: "POST", body }),
  );

  if (!result) return;

  notice.value = isEdit ? "Вопрос сохранён" : "Вопрос добавлен";
  closeForm();
  emit("saved");
}

async function remove(item: AdminFaqDto) {
  if (!import.meta.client) return;
  if (!window.confirm(`Удалить вопрос «${item.question}»? Действие необратимо.`)) return;

  removeError.value = null;
  notice.value = null;

  try {
    await $fetch(`/api/admin/content/faq/${item.id}`, { method: "DELETE" });
    notice.value = "Вопрос удалён";
    if (editingId.value === item.id) closeForm();
    emit("saved");
  } catch (error) {
    const fetchError = error as FetchError<{ message?: string }>;
    removeError.value = fetchError.data?.message ?? "Не удалось удалить вопрос";
  }
}

/** Где встретится вопрос — подпись для таблицы. */
function scopeTitle(item: AdminFaqDto): string {
  if (item.scope === "TYPE") return item.equipmentTypeTitle ?? "вид техники";
  if (item.scope === "SERVICE") return item.serviceTitle ?? "услуга";
  return "Главная и все посадочные";
}

const SCOPE_BADGES: Record<FaqScopeName, string> = {
  GLOBAL: "общий",
  TYPE: "вид",
  SERVICE: "услуга",
};
</script>

<template>
  <div class="admin-subcard">
    <div class="admin-subcard__head">
      <div>
        <h2 class="admin-subcard__title">Вопросы и ответы</h2>
        <p class="admin-page__lead">
          Общий список показывается на главной и там, где у вида нет своих вопросов; вопросы вида — на его посадочной.
        </p>
      </div>
      <button type="button" class="button" @click="openCreate">+ Вопрос</button>
    </div>

    <p v-if="notice" class="admin-notice">{{ notice }}</p>
    <p v-if="removeError" class="admin-form__error">{{ removeError }}</p>

    <div v-if="formOpen" class="admin-form__section">
      <form class="admin-form" novalidate @submit.prevent="save">
        <div class="admin-form__grid">
          <AdminField label="Где показывать" :error="fieldErrors.scope">
            <select v-model="form.scope" class="field__input" name="scope">
              <option v-for="option in scopeOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </AdminField>

          <AdminField
            v-if="form.scope === 'TYPE'"
            label="Вид техники"
            :error="fieldErrors.equipmentTypeId"
            hint="Страница /arenda-{код}"
          >
            <select v-model="form.equipmentTypeId" class="field__input" name="equipmentTypeId">
              <option value="">— выберите вид —</option>
              <option v-for="type in types" :key="type.id" :value="type.id">
                {{ type.categoryTitle }} · {{ type.name }}
              </option>
            </select>
          </AdminField>

          <AdminField
            v-if="form.scope === 'SERVICE'"
            label="Услуга"
            :error="fieldErrors.serviceId"
            hint="Страница /uslugi/{код}"
          >
            <select v-model="form.serviceId" class="field__input" name="serviceId">
              <option value="">— выберите услугу —</option>
              <option v-for="service in services" :key="service.id" :value="service.id">
                {{ service.title }}
              </option>
            </select>
          </AdminField>

          <AdminField label="Порядок" :error="fieldErrors.sortOrder" hint="Меньше — выше в списке">
            <input v-model.number="form.sortOrder" class="field__input" type="number" min="0" step="10" name="sortOrder">
          </AdminField>
        </div>

        <AdminField label="Вопрос" :error="fieldErrors.question">
          <textarea v-model="form.question" class="field__input field__textarea" name="question" rows="2" />
        </AdminField>

        <AdminField label="Ответ" :error="fieldErrors.answer">
          <textarea v-model="form.answer" class="field__input field__textarea" name="answer" rows="4" />
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
            <th>Вопрос</th>
            <th>Где</th>
            <th>Порядок</th>
            <th>Публикация</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td>
              <strong>{{ item.question }}</strong>
              <div class="muted admin-clamp">{{ item.answer }}</div>
            </td>
            <td>
              <span class="admin-badge">{{ SCOPE_BADGES[item.scope] }}</span>
              <div class="muted">{{ scopeTitle(item) }}</div>
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
            <td colspan="5" class="muted">Вопросов пока нет — добавьте первый.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

