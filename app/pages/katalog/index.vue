<script setup lang="ts">
import type { CatalogModelsDto } from "~/types/catalog";
import { filterCatalogModels } from "~/utils/catalog-filter";

const { data: site } = await useSite();
const { data, error } = await useFetch<CatalogModelsDto>("/api/catalog/models", {
  key: "catalog-models",
});
throwIfError(error.value);

const city = computed(() => site.value?.city ?? { slug: "moskva", name: "Москва", nameIn: "Москве" });
const selectedSlug = ref("");
const types = computed(() => data.value?.types ?? []);
const models = computed(() => data.value?.models ?? []);
const selectedType = computed(() => types.value.find((type) => type.slug === selectedSlug.value));
const visibleModels = computed(() => filterCatalogModels(models.value, selectedSlug.value));
const counts = computed(() => {
  const result: Record<string, number> = {};
  for (const model of models.value) result[model.typeSlug] = (result[model.typeSlug] ?? 0) + 1;
  return result;
});

usePageSeo({
  title: `Каталог спецтехники в ${city.value.nameIn} — аренда техники`,
  description: `Каталог аренды спецтехники в ${city.value.nameIn}: землеройная, погрузочная, подъёмная, дорожно-ремонтная и коммунальная техника. Цены за смену, договор с юрлицами.`,
  path: "/katalog",
});
</script>

<template>
  <div data-lead-page :data-equipment-type-slug="selectedType?.slug" :data-equipment-label="selectedType?.name">
    <SiteBreadcrumbs :items="[{ name: 'Главная', path: '/' }, { name: 'Каталог' }]" />

    <h1>Каталог спецтехники</h1>
    <p class="lead">
      Весь парк техники с ценами и характеристиками. Выберите вид в списке или смотрите все модели.
    </p>

    <div class="mt-8 grid min-w-0 items-start gap-8 lg:grid-cols-[16rem_minmax(0,1fr)]" data-catalog>
      <aside class="min-w-0 rounded-card border border-line bg-white p-3 lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto lg:overscroll-contain" aria-label="Виды техники">
        <h2 class="m-0! px-3 py-3 text-lg! font-bold">Виды техники</h2>
        <div class="flex flex-col gap-1" role="group" aria-label="Фильтр каталога">
          <button type="button" :aria-pressed="selectedSlug === ''" aria-controls="catalog-results" class="flex min-h-11 w-full items-center justify-between gap-3 rounded-field border-0 px-3 py-3 text-left text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink motion-reduce:transition-none" :class="selectedSlug === '' ? 'bg-ink text-white' : 'bg-transparent text-ink hover:bg-cement'" @click="selectedSlug = ''">Вся техника <span>{{ models.length }}</span></button>
          <button v-for="type in types" :key="type.slug" type="button" :aria-pressed="selectedSlug === type.slug" aria-controls="catalog-results" class="flex min-h-11 w-full items-center justify-between gap-3 rounded-field border-0 px-3 py-3 text-left text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink motion-reduce:transition-none" :class="selectedSlug === type.slug ? 'bg-ink text-white' : 'bg-transparent text-ink hover:bg-cement'" @click="selectedSlug = type.slug"><span>{{ type.name }}</span><span>{{ counts[type.slug] ?? 0 }}</span></button>
        </div>
      </aside>
      <section id="catalog-results" class="min-w-0" aria-labelledby="catalog-results-title">
        <h2 id="catalog-results-title" class="mt-0! text-2xl! font-bold">{{ selectedType?.name ?? 'Вся техника' }}</h2>
        <p class="mb-5 text-sm text-muted" role="status" aria-live="polite">Моделей: {{ visibleModels.length }}</p>
        <div v-if="selectedType?.descriptionTopHtml" class="mb-6 [overflow-wrap:anywhere]" data-description-top v-html="selectedType.descriptionTopHtml" />
        <CatalogModelsGrid :models="visibleModels" :equipment-type-slug="selectedType?.slug" :equipment-label="selectedType?.name" />
        <div v-if="selectedType?.descriptionBottomHtml" class="mt-8 [overflow-wrap:anywhere]" data-description-bottom v-html="selectedType.descriptionBottomHtml" />
      </section>
    </div>

    <CtaBlock v-if="site" :phone="site.phone" />
  </div>
</template>
