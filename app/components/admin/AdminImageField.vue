<script setup lang="ts">
import { IMAGE_ACCEPT, MAX_IMAGE_BYTES, formatFileSize, uploadPathFromUrl } from "#shared/utils/uploads";

/**
 * Одно изображение раздела: загрузка файла с диска или внешний адрес.
 *
 * Убрать из поля и удалить файл — разные действия: файл может использоваться
 * в другом месте, тогда сервер ответит `409` и текст появится под полем.
 */
const model = defineModel<string>({ required: true });

defineProps<{
  label: string;
  hint?: string;
  error?: string;
  disabled?: boolean;
}>();

const { pending, error: uploadError, upload, remove } = useImageUpload();
const fileInput = ref<HTMLInputElement | null>(null);

const hasImage = computed(() => model.value.trim() !== "");
const isManaged = computed(() => Boolean(uploadPathFromUrl(model.value)));

function openPicker() {
  fileInput.value?.click();
}

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";

  if (!file) return;

  const uploaded = await upload(file);
  if (uploaded) model.value = uploaded.url;
}

function clearField() {
  model.value = "";
}

async function deleteFile() {
  if (!isManaged.value || !import.meta.client) return;
  if (!window.confirm("Удалить файл с сервера? Если он где-то используется, сервер откажет.")) return;

  const removed = await remove(model.value);
  if (removed) model.value = "";
}
</script>

<template>
  <div class="field">
    <span class="field__label">{{ label }}</span>

    <div class="admin-images">
      <div v-if="hasImage" class="admin-images__item admin-images__item--single">
        <img :src="model" alt="" class="admin-images__thumb" loading="lazy">
        <div class="admin-images__actions">
          <button
            type="button"
            class="button button--ghost button--small"
            :disabled="pending || disabled"
            @click="openPicker"
          >
            Заменить
          </button>
          <button type="button" class="button button--ghost button--small" :disabled="pending || disabled" @click="clearField">
            Убрать из поля
          </button>
          <button
            v-if="isManaged"
            type="button"
            class="button button--ghost button--small button--danger"
            :disabled="pending || disabled"
            @click="deleteFile"
          >
            Удалить файл
          </button>
        </div>
      </div>

      <div class="admin-images__add">
        <button
          v-if="!hasImage"
          type="button"
          class="button button--ghost button--small"
          :disabled="pending || disabled"
          @click="openPicker"
        >
          {{ pending ? "Загружаем…" : "Загрузить фото" }}
        </button>
        <input
          ref="fileInput"
          class="admin-images__input"
          type="file"
          :accept="IMAGE_ACCEPT"
          :disabled="pending || disabled"
          @change="onFileChange"
        >
        <span class="field__hint">JPEG, PNG, WebP, AVIF, GIF · до {{ formatFileSize(MAX_IMAGE_BYTES) }}</span>
      </div>

      <input
        v-model="model"
        class="field__input"
        type="text"
        placeholder="/uploads/… или https://…"
        :disabled="disabled"
      >
    </div>

    <span v-if="hint" class="field__hint">{{ hint }}</span>
    <span v-if="error || uploadError" class="field__error">{{ error || uploadError }}</span>
  </div>
</template>
