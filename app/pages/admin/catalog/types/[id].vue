<script setup lang="ts">
import type { AdminCategoryDto, AdminTypeDto, AdminTypeListItemDto } from "~/types/admin-catalog";
import { typeFormBody, typeFormFrom, type TypeForm } from "~/utils/admin-catalog-forms";

definePageMeta({ layout: "admin" });

useSeoMeta({
  title: "Вид техники · админка",
  robots: "noindex, nofollow",
});

const route = useRoute();
const typeId = computed(() => String(route.params.id ?? ""));
const requestFetch = useRequestFetch();

const { data, error, refresh } = await useAsyncData(
  () => `admin-type-${typeId.value}`,
  async () => {
    const [type, allTypes, categories] = await Promise.all([
      requestFetch<{ type: AdminTypeDto }>(`/api/admin/catalog/types/${typeId.value}`),
      requestFetch<{ types: AdminTypeListItemDto[] }>("/api/admin/catalog/types"),
      requestFetch<{ categories: AdminCategoryDto[] }>("/api/admin/catalog/categories"),
    ]);

    return { type: type.type, types: allTypes.types, categories: categories.categories };
  },
);
throwIfError(error.value);

if (!data.value?.type) {
  throw createError({ statusCode: 404, message: "Вид техники не найден" });
}

const type = computed(() => data.value?.type ?? null);
const categories = computed(() => data.value?.categories ?? []);

// ── Основные поля вида ──

const form = ref<TypeForm>(typeFormFrom(data.value.type));
const notice = ref<string | null>(null);
const { fieldErrors, formError, pending, submit } = useAdminForm();

async function saveType() {
  const body = typeFormBody(form.value);

  const result = await submit<{ type: AdminTypeDto }>(() =>
    $fetch(`/api/admin/catalog/types/${typeId.value}`, { method: "PATCH", body }),
  );

  if (!result) return;

  form.value = typeFormFrom(result.type);
  notice.value = "Вид техники сохранён";
  await refresh();
}

// ── Модели ──

/** Ключи новых (ещё не сохранённых) карточек: после создания карточки убираем. */
const newModelKeys = ref<number[]>([]);
const nextModelKey = ref(0);

function addModel() {
  nextModelKey.value += 1;
  newModelKeys.value = [...newModelKeys.value, nextModelKey.value];
}

async function onModelSaved(mode: "created" | "updated") {
  if (mode === "created") newModelKeys.value = [];
  notice.value = mode === "created" ? "Модель добавлена" : "Модель сохранена";
  await refresh();
}

async function onModelRemoved() {
  notice.value = "Модель удалена";
  await refresh();
}

// ── «Похожая техника» ──

const relatedIds = ref<string[]>(data.value.type.related.map((item) => item.id));
const relatedSaving = ref(false);
const relatedError = ref<string | null>(null);

const relatedCandidates = computed(() => (data.value?.types ?? []).filter((item) => item.id !== typeId.value));

/** Выбранные в порядке вывода: id из связей может уже не быть в списке — не теряем его. */
const relatedSelected = computed(() => {
  const known = new Map<string, { id: string; name: string; slug: string }>();

  for (const item of relatedCandidates.value) {
    known.set(item.id, { id: item.id, name: item.name, slug: item.slug });
  }
  for (const item of data.value?.type.related ?? []) {
    if (!known.has(item.id)) known.set(item.id, { id: item.id, name: item.name, slug: item.slug });
  }

  return relatedIds.value
    .map((id) => known.get(id))
    .filter((item): item is { id: string; name: string; slug: string } => Boolean(item));
});

function isRelated(id: string) {
  return relatedIds.value.includes(id);
}

function toggleRelated(id: string) {
  relatedIds.value = isRelated(id)
    ? relatedIds.value.filter((item) => item !== id)
    : [...relatedIds.value, id];
}

function moveRelated(id: string, delta: number) {
  const index = relatedIds.value.indexOf(id);
  const target = index + delta;
  if (index === -1 || target < 0 || target >= relatedIds.value.length) return;

  const next = [...relatedIds.value];
  next.splice(index, 1);
  next.splice(target, 0, id);
  relatedIds.value = next;
}

async function saveRelated() {
  if (relatedSaving.value) return;

  relatedSaving.value = true;
  relatedError.value = null;

  try {
    await $fetch(`/api/admin/catalog/types/${typeId.value}/related`, {
      method: "PUT",
      body: { relatedIds: relatedIds.value },
    });
    notice.value = "Похожая техника сохранена";
    await refresh();
  } catch (err) {
    const fetchError = err as { data?: { message?: string } };
    relatedError.value = fetchError.data?.message ?? "Не удалось сохранить похожую технику";
  } finally {
    relatedSaving.value = false;
  }
}
</script>

<template>
  <div class="admin-catalog">
    <div class="admin-page">
    <div class="admin-page__head">
      <div>
        <div class="admin-breadcrumbs">
          <NuxtLink to="/admin">Админка</NuxtLink>
          <span>/</span>
          <NuxtLink to="/admin/catalog">Каталог</NuxtLink>
          <span>/</span>
          <NuxtLink v-if="type" :to="`/admin/catalog/${type.categoryId}`">{{ type.category.title }}</NuxtLink>
          <span>/</span>
          <span>{{ type?.name }}</span>
        </div>
        <h1 class="admin-page__title">{{ type?.name }}</h1>
        <p class="admin-page__lead">
          Посадочная страница: <code>/arenda-{{ type?.slug }}-v-{город}</code>. Ниже — поля вида, модели и перелинковка.
        </p>
      </div>
      <div class="admin-page__actions">
        <NuxtLink v-if="type" :to="`/admin/catalog/${type.categoryId}`" class="button button--ghost">
          К видам раздела
        </NuxtLink>
      </div>
    </div>

    <p v-if="notice" class="admin-notice">{{ notice }}</p>

    <form class="admin-form" novalidate @submit.prevent="saveType">
      <AdminTypeFields v-model="form" :categories="categories" :errors="fieldErrors" />

      <p v-if="formError" class="admin-form__error" role="alert">{{ formError }}</p>

      <div class="admin-form__actions">
        <button type="submit" class="button" :disabled="pending">
          {{ pending ? "Сохраняем…" : "Сохранить вид" }}
        </button>
      </div>
    </form>
  </div>

  <div class="admin-page">
    <div class="admin-page__head">
      <div>
        <h2 class="admin-page__title">Модели и характеристики</h2>
        <p class="admin-page__lead">Таблица на посадочной странице. Характеристики показываются в карточке модели.</p>
      </div>
      <div class="admin-page__actions">
        <button type="button" class="button" @click="addModel">+ Модель</button>
      </div>
    </div>

    <div class="admin-list">
      <AdminModelCard
        v-for="model in type?.models ?? []"
        :key="model.id"
        :type-id="typeId"
        :model="model"
        @saved="onModelSaved"
        @removed="onModelRemoved"
      />

      <AdminModelCard
        v-for="key in newModelKeys"
        :key="`new-${key}`"
        :type-id="typeId"
        :model="null"
        @saved="onModelSaved"
        @removed="onModelRemoved"
      />

      <p v-if="(type?.models?.length ?? 0) === 0 && newModelKeys.length === 0" class="admin-form__note">
        Моделей пока нет — добавьте первую, чтобы на сайте появилась таблица.
      </p>
    </div>
  </div>

  <div class="admin-page">
    <div class="admin-page__head">
      <div>
        <h2 class="admin-page__title">Похожая техника</h2>
        <p class="admin-page__lead">
          Блок «Похожая техника» на посадочной. Порядок в списке выбранных — порядок вывода на сайте.
        </p>
      </div>
      <div class="admin-page__actions">
        <button type="button" class="button" :disabled="relatedSaving" @click="saveRelated">
          {{ relatedSaving ? "Сохраняем…" : "Сохранить перелинковку" }}
        </button>
      </div>
    </div>

    <p v-if="relatedError" class="admin-form__error" role="alert">{{ relatedError }}</p>

    <h3 class="admin-subcard__title">Выбрано: {{ relatedSelected.length }}</h3>
    <div v-if="relatedSelected.length" class="admin-related">
      <div v-for="(item, index) in relatedSelected" :key="item.id" class="admin-related__item admin-related__item--active">
        <span class="admin-related__title">{{ item.name }}</span>
        <code class="admin-related__slug">{{ item.slug }}</code>
        <div class="table__actions">
          <button
            type="button"
            class="button button--ghost button--small"
            title="Выше"
            :disabled="index === 0"
            @click="moveRelated(item.id, -1)"
          >
            ↑
          </button>
          <button
            type="button"
            class="button button--ghost button--small"
            title="Ниже"
            :disabled="index === relatedSelected.length - 1"
            @click="moveRelated(item.id, 1)"
          >
            ↓
          </button>
          <button type="button" class="button button--ghost button--small" @click="toggleRelated(item.id)">
            Убрать
          </button>
        </div>
      </div>
    </div>
    <p v-else class="admin-form__note">Пока ничего не выбрано — блок на сайте не показывается.</p>

    <h3 class="admin-subcard__title">Добавить из каталога</h3>
    <div class="admin-related">
      <label
        v-for="item in relatedCandidates"
        :key="item.id"
        :class="['admin-related__item', { 'admin-related__item--active': isRelated(item.id) }]"
      >
        <input type="checkbox" :checked="isRelated(item.id)" @change="toggleRelated(item.id)">
        <span class="admin-related__title">{{ item.name }}</span>
        <code class="admin-related__slug">{{ item.slug }}</code>
        <span
          :class="['admin-badge', item.isPublished ? 'admin-badge--on' : 'admin-badge--off']"
        >{{ item.isPublished ? "опубликован" : "черновик" }}</span>
      </label>
      <p v-if="relatedCandidates.length === 0" class="admin-form__note">Других видов техники в каталоге нет.</p>
    </div>
    </div>
  </div>
</template>
