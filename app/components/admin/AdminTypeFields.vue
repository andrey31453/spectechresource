<script setup lang="ts">
import { PRICE_UNITS, PRICE_UNIT_LABELS } from "#shared/schemas/catalog";
import type { AdminCategoryDto } from "~/types/admin-catalog";
import type { TypeForm } from "~/utils/admin-catalog-forms";

/** Поля вида техники: одни и те же в списке раздела и в карточке вида. */
const form = defineModel<TypeForm>({ required: true });

const props = defineProps<{
  categories: AdminCategoryDto[];
  errors: Record<string, string>;
}>();

/** Ошибка вложенного элемента массива (`gallery.0`) относится к блоку целиком. */
function errorFor(field: string): string | undefined {
  if (props.errors[field]) return props.errors[field];

  return Object.entries(props.errors).find(([key]) => key.startsWith(`${field}.`))?.[1];
}
</script>

<template>
  <div class="admin-form__grid">
    <AdminField label="Название" :error="errors.name" hint="Гусеничные экскаваторы">
      <input v-model="form.name" class="field__input" type="text" name="name" autocomplete="off">
    </AdminField>

    <AdminField label="Код для адреса" :error="errors.slug" hint="gusenichnogo-ekskavatora">
      <input v-model="form.slug" class="field__input" type="text" name="slug" autocomplete="off">
    </AdminField>

    <AdminField
      label="Родительный падеж"
      :error="errors.nameGenitive"
      hint="Для H1: «аренда гусеничного экскаватора»"
    >
      <input v-model="form.nameGenitive" class="field__input" type="text" name="nameGenitive">
    </AdminField>

    <AdminField label="Раздел" :error="errors.categoryId">
      <select v-model="form.categoryId" class="field__input" name="categoryId">
        <option v-for="item in categories" :key="item.id" :value="item.id">{{ item.title }}</option>
      </select>
    </AdminField>

    <AdminField label="Цена от, ₽" :error="errors.priceFrom" hint="Пусто — «цена по запросу»">
      <input v-model="form.priceFrom" class="field__input" type="text" inputmode="decimal" name="priceFrom">
    </AdminField>

    <AdminField label="Единица цены" :error="errors.priceUnit">
      <select v-model="form.priceUnit" class="field__input" name="priceUnit">
        <option v-for="unit in PRICE_UNITS" :key="unit" :value="unit">{{ PRICE_UNIT_LABELS[unit] }}</option>
      </select>
    </AdminField>

    <AdminField label="Минимальный заказ" :error="errors.minOrder">
      <input v-model="form.minOrder" class="field__input" type="text" name="minOrder" placeholder="минимум 4 часа">
    </AdminField>

    <AdminField label="Цена доставки, ₽" :error="errors.deliveryPrice">
      <input v-model="form.deliveryPrice" class="field__input" type="text" inputmode="decimal" name="deliveryPrice">
    </AdminField>

    <AdminField label="Порядок" :error="errors.sortOrder" hint="Меньше — выше в списке">
      <input v-model.number="form.sortOrder" class="field__input" type="number" min="0" step="10" name="sortOrder">
    </AdminField>
  </div>

  <AdminField label="Условия доставки" :error="errors.deliveryTerms">
    <textarea v-model="form.deliveryTerms" class="field__input field__textarea" name="deliveryTerms" />
  </AdminField>

  <AdminField
    label="Какие работы выполняет (markdown)"
    :error="errors.worksPerformed"
    hint="Выводится на посадочной странице"
  >
    <textarea v-model="form.worksPerformed" class="field__input field__textarea" name="worksPerformed" rows="5" />
  </AdminField>

  <AdminGalleryField
    v-model="form.gallery"
    label="Фотографии вида"
    :error="errorFor('gallery')"
    hint="Порядок в списке — порядок на сайте"
  />

  <div class="admin-form__grid admin-form__grid--half">
    <label class="field field--check">
      <input v-model="form.crewAvailable" type="checkbox" name="crewAvailable">
      <span class="field__label">С экипажем</span>
    </label>
    <label class="field field--check">
      <input v-model="form.withoutCrewAvailable" type="checkbox" name="withoutCrewAvailable">
      <span class="field__label">Без экипажа</span>
    </label>
    <label class="field field--check">
      <input v-model="form.isPublished" type="checkbox" name="isPublished">
      <span class="field__label">Опубликован на сайте</span>
    </label>
  </div>

  <AdminField label="Описание сверху (markdown)" :error="errors.descriptionTop" hint="Перед списком моделей техники">
    <textarea v-model="form.descriptionTop" class="field__input field__textarea" name="descriptionTop" rows="6" />
  </AdminField>
  <AdminField label="Описание снизу (markdown)" :error="errors.seoText" hint="После списка моделей. Ранее — SEO-текст вида">
    <textarea v-model="form.seoText" class="field__input field__textarea" name="seoText" rows="6" />
  </AdminField>

  <details>
    <summary class="field__hint">SEO-поля вида</summary>
    <div class="admin-form__grid">
      <AdminField label="SEO-заголовок" :error="errors.seoTitle">
        <input v-model="form.seoTitle" class="field__input" type="text" name="seoTitle">
      </AdminField>
      <AdminField label="SEO-описание" :error="errors.seoDescription">
        <input v-model="form.seoDescription" class="field__input" type="text" name="seoDescription">
      </AdminField>
    </div>
  </details>
</template>
