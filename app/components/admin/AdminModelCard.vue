<script setup lang="ts">
import type { FetchError } from "ofetch";
import type { AdminModelDto } from "~/types/admin-catalog";
import { emptyModelForm, modelFormBody, modelFormFrom, type ModelForm } from "~/utils/admin-catalog-forms";

/**
 * Модель техники: отдельная карточка, чтобы можно было править несколько моделей
 * подряд, не теряя несохранённые изменения в соседних.
 */
const props = defineProps<{
  typeId: string;
  model: AdminModelDto | null;
}>();

const emit = defineEmits<{
  saved: [mode: "created" | "updated"];
  removed: [];
}>();

const form = ref<ModelForm>(props.model ? modelFormFrom(props.model) : emptyModelForm());
const removeError = ref<string | null>(null);
const { fieldErrors, formError, pending, submit, errorFor } = useAdminForm();

const title = computed(() =>
  props.model ? `${props.model.brand} ${props.model.model}` : "Новая модель",
);

async function save() {
  const body = modelFormBody(form.value);
  const isNew = !props.model;

  const result = await submit<{ model: AdminModelDto }>(() =>
    isNew
      ? $fetch(`/api/admin/catalog/types/${props.typeId}/models`, { method: "POST", body })
      : $fetch(`/api/admin/catalog/models/${props.model?.id}`, { method: "PATCH", body }),
  );

  if (!result) return;

  form.value = modelFormFrom(result.model);
  emit("saved", isNew ? "created" : "updated");
}

async function remove() {
  if (!props.model || !import.meta.client) return;
  if (!window.confirm(`Удалить модель «${title.value}»? Характеристики тоже удалятся.`)) return;

  removeError.value = null;

  try {
    await $fetch(`/api/admin/catalog/models/${props.model.id}`, { method: "DELETE" });
    emit("removed");
  } catch (err) {
    const fetchError = err as FetchError<{ message?: string }>;
    removeError.value = fetchError.data?.message ?? "Не удалось удалить модель";
  }
}
</script>

<template>
  <div class="admin-subcard">
    <div class="admin-subcard__head">
      <h3 class="admin-subcard__title">
        {{ title }}
        <span v-if="model && !model.isAvailable" class="admin-badge admin-badge--off">недоступна</span>
      </h3>
      <div class="table__actions">
        <button type="button" class="button" :disabled="pending" @click="save">
          {{ pending ? "Сохраняем…" : "Сохранить" }}
        </button>
        <button
          v-if="model"
          type="button"
          class="button button--ghost button--danger"
          :disabled="pending"
          @click="remove"
        >
          Удалить
        </button>
      </div>
    </div>

    <form class="admin-form" novalidate @submit.prevent="save">
      <div class="admin-form__grid">
        <AdminField label="Марка" :error="fieldErrors.brand" hint="JCB">
          <input v-model="form.brand" class="field__input" type="text" name="brand" autocomplete="off">
        </AdminField>

        <AdminField label="Модель" :error="fieldErrors.model" hint="3CX">
          <input v-model="form.model" class="field__input" type="text" name="model" autocomplete="off">
        </AdminField>

        <AdminField label="Цена за смену, ₽" :error="fieldErrors.pricePerShift">
          <input v-model="form.pricePerShift" class="field__input" type="text" inputmode="decimal" name="pricePerShift">
        </AdminField>

        <AdminField label="Цена за час, ₽" :error="fieldErrors.pricePerHour">
          <input v-model="form.pricePerHour" class="field__input" type="text" inputmode="decimal" name="pricePerHour">
        </AdminField>

        <AdminField label="Порядок" :error="fieldErrors.sortOrder">
          <input v-model.number="form.sortOrder" class="field__input" type="number" min="0" step="10" name="sortOrder">
        </AdminField>
      </div>

      <AdminField label="Краткое описание" :error="fieldErrors.shortDesc" hint="До 600 символов: для каких задач подходит эта модель">
        <textarea v-model="form.shortDesc" class="field__input field__textarea" name="shortDesc" rows="3" maxlength="600" />
      </AdminField>

      <AdminGalleryField
        v-model="form.photos"
        label="Фотографии модели"
        :error="errorFor('photos')"
        hint="Порядок в списке — порядок в карточке модели"
      />

      <div class="field">
        <span class="field__label">Характеристики</span>
        <AdminSpecsEditor v-model="form.specs" />
        <span v-if="errorFor('specs')" class="field__error">{{ errorFor("specs") }}</span>
      </div>

      <label class="field field--check">
        <input v-model="form.isAvailable" type="checkbox" name="isAvailable">
        <span class="field__label">Доступна для заявок</span>
      </label>

      <p v-if="formError" class="admin-form__error" role="alert">{{ formError }}</p>
      <p v-if="removeError" class="admin-form__error">{{ removeError }}</p>
    </form>
  </div>
</template>
