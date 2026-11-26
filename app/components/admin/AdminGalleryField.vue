<script setup lang="ts">
import {
  IMAGE_ACCEPT,
  imageVariantUrl,
  MAX_IMAGE_BYTES,
  MAX_IMAGES_PER_FIELD,
  formatFileSize,
  uploadPathFromUrl,
} from "#shared/utils/uploads";

/**
 * Галерея: порядок в массиве = порядок вывода на сайте.
 * Стрелки меняют порядок, «Убрать» убирает адрес из формы, «Удалить файл» стирает его с сервера.
 */
const model = defineModel<string[]>({ required: true });

defineProps<{
  label: string;
  hint?: string;
  error?: string;
  disabled?: boolean;
}>();

const { pending, error: uploadError, uploadMany, remove } = useImageUpload();
const fileInput = ref<HTMLInputElement | null>(null);
const manualUrl = ref("");
const localError = ref<string | null>(null);

const limitReached = computed(() => model.value.length >= MAX_IMAGES_PER_FIELD);

function openPicker() {
  if (limitReached.value) {
    localError.value = `Не больше ${MAX_IMAGES_PER_FIELD} изображений`;
    return;
  }

  fileInput.value?.click();
}

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  input.value = "";

  if (files.length === 0) return;

  localError.value = null;

  const free = MAX_IMAGES_PER_FIELD - model.value.length;
  if (free <= 0) {
    localError.value = `Не больше ${MAX_IMAGES_PER_FIELD} изображений`;
    return;
  }

  const uploaded = await uploadMany(files.slice(0, free));
  if (uploaded.length > 0) {
    model.value = [...model.value, ...uploaded.map((item) => item.url)];
  }

  if (files.length > free) {
    localError.value = `Добавлены первые ${free}: больше ${MAX_IMAGES_PER_FIELD} изображений не сохранится`;
  }
}

function addManualUrl() {
  const url = manualUrl.value.trim();
  if (!url) return;

  if (limitReached.value) {
    localError.value = `Не больше ${MAX_IMAGES_PER_FIELD} изображений`;
    return;
  }

  localError.value = null;
  model.value = [...model.value, url];
  manualUrl.value = "";
}

function removeAt(index: number) {
  model.value = model.value.filter((_, position) => position !== index);
}

function move(index: number, delta: number) {
  const target = index + delta;
  if (target < 0 || target >= model.value.length) return;

  const next = [...model.value];
  const [item] = next.splice(index, 1);
  if (item === undefined) return;

  next.splice(target, 0, item);
  model.value = next;
}

async function deleteFile(index: number) {
  const url = model.value[index];
  if (!url || !import.meta.client) return;
  if (!window.confirm("Удалить файл с сервера? Если он где-то используется, сервер откажет.")) return;

  const removed = await remove(url);
  if (removed) removeAt(index);
}
</script>

<template>
  <div class="field">
    <span class="field__label">{{ label }}</span>

    <div class="admin-images">
      <div v-if="model.length" class="admin-images__grid">
        <div v-for="(url, index) in model" :key="`${url}-${index}`" class="admin-images__item">
          <img :src="imageVariantUrl(url, 'small')" alt="" class="admin-images__thumb" loading="lazy">
          <code class="admin-images__url">{{ url }}</code>
          <div class="admin-images__actions">
            <button
              type="button"
              class="button button--ghost button--small"
              title="Выше"
              :disabled="pending || disabled || index === 0"
              @click="move(index, -1)"
            >
              ↑
            </button>
            <button
              type="button"
              class="button button--ghost button--small"
              title="Ниже"
              :disabled="pending || disabled || index === model.length - 1"
              @click="move(index, 1)"
            >
              ↓
            </button>
            <button type="button" class="button button--ghost button--small" :disabled="disabled" @click="removeAt(index)">
              Убрать
            </button>
            <button
              v-if="uploadPathFromUrl(url)"
              type="button"
              class="button button--ghost button--small button--danger"
              :disabled="pending || disabled"
              @click="deleteFile(index)"
            >
              Удалить файл
            </button>
          </div>
        </div>
      </div>

      <p v-else class="admin-form__note">Изображений пока нет.</p>

      <div class="admin-images__add">
        <button type="button" class="button button--ghost button--small" :disabled="pending || disabled" @click="openPicker">
          {{ pending ? "Загружаем…" : "Загрузить фото" }}
        </button>
        <input
          ref="fileInput"
          class="admin-images__input"
          type="file"
          multiple
          :accept="IMAGE_ACCEPT"
          :disabled="pending || disabled"
          @change="onFileChange"
        >
        <span class="field__hint">
          {{ model.length }} из {{ MAX_IMAGES_PER_FIELD }} · JPEG, PNG, WebP, AVIF, GIF · до {{ formatFileSize(MAX_IMAGE_BYTES) }}
        </span>
      </div>

      <div class="admin-images__add">
        <input
          v-model="manualUrl"
          class="field__input"
          type="text"
          placeholder="/uploads/… или https://…"
          :disabled="disabled"
          @keydown.enter.prevent="addManualUrl"
        >
        <button type="button" class="button button--ghost button--small" :disabled="disabled" @click="addManualUrl">
          Добавить адрес
        </button>
      </div>
    </div>

    <span v-if="hint" class="field__hint">{{ hint }}</span>
    <span v-if="error || uploadError || localError" class="field__error">
      {{ error || uploadError || localError }}
    </span>
  </div>
</template>
