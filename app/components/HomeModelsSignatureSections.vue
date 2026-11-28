<script setup lang="ts">
import { imageVariantUrl } from "#shared/utils/uploads";
import type { HomeModelSection } from "~/utils/model-groups";
import type { HomeModelGroup } from "~/utils/models";
import { typePath, modelPath } from "~/utils/routes";
import { formatMoney } from "~/utils/price";
import { modelPage, showcaseShelf } from "~/utils/model-showcase";

const props = defineProps<{
  sections: HomeModelSection[];
  variant: "h" | "i" | "j";
  thumbnails: boolean;
  citySlug: string;
  priceDisclaimer: string;
}>();

const selected = ref<Record<string, string>>({});
const filters = ref<Record<string, string>>({});
const pages = ref<Record<string, number>>({});
const pageSize = ref(2);

onMounted(() => {
  const desktop = window.matchMedia("(min-width: 1280px)");
  const tablet = window.matchMedia("(min-width: 768px)");
  const update = () => { pageSize.value = desktop.matches ? 4 : tablet.matches ? 3 : 2; };
  update();
  desktop.addEventListener("change", update);
  tablet.addEventListener("change", update);
  onBeforeUnmount(() => {
    desktop.removeEventListener("change", update);
    tablet.removeEventListener("change", update);
  });
});

function filterOptions(section: HomeModelSection) {
  const categories = section.shelves.map((shelf) => shelf.category);
  return categories.length > 1 ? [{ slug: "", title: "Все" }, ...categories] : categories;
}

function isFilterActive(section: HomeModelSection, slug: string) {
  return section.shelves.length === 1 || (filters.value[section.slug] ?? "") === slug;
}

function changeFilter(section: HomeModelSection, slug: string) {
  if (isFilterActive(section, slug)) return;
  filters.value[section.slug] = slug;
  pages.value[section.slug] = 0;
}

function pagination(shelf: HomeModelGroup) {
  return modelPage(shelf.models, pages.value[shelf.category.slug] ?? 0, pageSize.value);
}

function visibleShelves(section: HomeModelSection) {
  const slug = filters.value[section.slug];
  if (props.variant === "h") return [showcaseShelf(section, slug)];
  return slug ? section.shelves.filter((shelf) => shelf.category.slug === slug) : section.shelves;
}

function current(shelf: HomeModelGroup) {
  return shelf.models.find((model) => model.id === selected.value[shelf.category.slug]) ?? shelf.models[0];
}

function sectionTone(section: HomeModelSection) {
  return section.colorTheme === "BLACK" ? "bg-ink text-sand" : section.colorTheme === "ORANGE" ? "bg-flame text-ink" : "bg-cement2 text-ink";
}
</script>

<template>
  <div>
    <section
      v-for="(section, index) in sections"
      :id="`modeli-${variant}-${section.slug}`"
      :key="section.slug"
      :aria-labelledby="`modeli-${variant}-title-${section.slug}`"
      class="relative isolate overflow-hidden px-5 md:px-8"
      :class="[sectionTone(section), variant === 'h' ? 'py-[148px] md:py-[180px]' : 'py-12 md:py-20']"
    >
      <div aria-hidden="true" class="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,var(--color-flame),transparent_60%)]" :class="section.colorTheme === 'BLACK' ? 'opacity-25' : 'opacity-20'" />
      <div aria-hidden="true" class="pointer-events-none absolute inset-0 -z-10 opacity-[0.06]" :class="index % 3 === 2 ? 'bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] bg-size-[56px_56px]' : 'bg-[radial-gradient(circle,currentColor_1px,transparent_1.1px)] bg-size-[15px_15px]'" />
      <div class="mx-auto max-w-site">
        <div v-if="variant !== 'h'" class="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-current/25 pb-4 text-xs font-bold tracking-widest uppercase">
          <span>{{ section.numberLabel }} / Парк техники</span>
          <span>{{ section.shelvesLabel }} · {{ section.modelsLabel }}</span>
        </div>
        <h2 :id="`modeli-${variant}-title-${section.slug}`" class="m-0! max-w-5xl text-[clamp(32px,5.8vw,80px)]! leading-[.98]! font-extrabold tracking-[-.055em] text-inherit! uppercase [overflow-wrap:anywhere]">{{ section.title }}</h2>
        <p class="mt-5! mb-0! max-w-2xl text-lg leading-relaxed text-inherit!">{{ section.lead }}</p>
        <div v-if="variant !== 'i' && (variant !== 'h' || section.shelves.length > 1)" class="mt-10 flex flex-wrap gap-3" role="group" :aria-label="`Фильтр видов техники: ${section.title}`">
          <button v-for="filter in filterOptions(section)" :key="filter.slug" type="button" :aria-pressed="isFilterActive(section, filter.slug)" class="min-h-14 rounded-2xl border-0 px-6 py-4 text-base font-bold transition-colors motion-reduce:transition-none! focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current" :class="isFilterActive(section, filter.slug) ? (section.colorTheme === 'BLACK' ? 'bg-sand text-ink' : 'bg-ink text-sand') : 'bg-transparent text-inherit hover:bg-current/10'" @click="changeFilter(section, filter.slug)">{{ filter.title }}</button>
        </div>
        <nav v-else-if="variant === 'i'" class="mt-6 flex flex-wrap gap-x-6 gap-y-2" :aria-label="`Виды техники: ${section.title}`">
          <a v-for="shelf in section.shelves" :key="shelf.category.slug" :href="`#modeli-${variant}-shelf-${shelf.category.slug}`" class="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-inherit! underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current">{{ shelf.category.title }} <span aria-hidden="true">↓</span></a>
        </nav>

        <TransitionGroup tag="div" :class="variant === 'h' ? 'grid!' : ''" enter-active-class="transition-opacity duration-180 ease-out motion-reduce:transition-none!" enter-from-class="opacity-0" leave-active-class="pointer-events-none transition-opacity duration-120 ease-in motion-reduce:transition-none!" leave-to-class="opacity-0">
        <section v-for="shelf in visibleShelves(section)" :id="`modeli-${variant}-shelf-${shelf.category.slug}`" :key="`${shelf.category.slug}-${filters[section.slug] ?? ''}`" :aria-labelledby="variant === 'h' ? `modeli-${variant}-title-${section.slug}` : `modeli-${variant}-shelf-title-${shelf.category.slug}`" class="mt-6 min-w-0 scroll-mt-24 md:mt-8" :class="variant === 'h' ? '[grid-area:1/1]' : 'border-t border-current/25'">
          <div v-if="variant !== 'h'" class="flex flex-wrap items-baseline justify-between gap-4">
            <h3 v-if="variant !== 'h'" :id="`modeli-${variant}-shelf-title-${shelf.category.slug}`" class="m-0! text-[clamp(24px,3vw,40px)]! leading-tight! font-bold tracking-tight text-inherit!">{{ shelf.category.title }}</h3>
            <a v-if="variant !== 'h'" :href="typePath(shelf.category.slug)" class="inline-flex min-h-11 items-center gap-3 text-sm font-bold text-inherit! underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current">Весь вид техники <span aria-hidden="true">↗</span></a>
          </div>

          <div v-if="current(shelf)" class="mt-10 grid! min-w-0 gap-10 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] lg:gap-12">
            <div class="min-w-0">
              <Transition mode="out-in" enter-active-class="transition-opacity duration-300 motion-reduce:transition-none!" enter-from-class="opacity-0" leave-active-class="transition-opacity duration-150 motion-reduce:transition-none!" leave-to-class="opacity-0">
                <a :key="current(shelf)!.id" :href="modelPath(current(shelf)!.typeSlug, current(shelf)!.slug)" class="group relative block aspect-[4/3] overflow-hidden rounded-3xl bg-panel text-white! focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current md:aspect-[16/10]" :aria-label="`Подробнее: ${current(shelf)!.brand} ${current(shelf)!.model}`">
                  <img v-if="current(shelf)!.photo" :src="imageVariantUrl(current(shelf)!.photo!, 'medium')" :alt="`${current(shelf)!.brand} ${current(shelf)!.model}`" width="960" height="600" loading="lazy" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.025] group-focus-visible:scale-[1.025] motion-reduce:scale-100! motion-reduce:transition-none!">
                  <span v-else class="absolute inset-0 grid! place-items-center text-lg">Фото уточняйте у менеджера</span>
                  <span v-if="variant !== 'h'" class="absolute right-4 bottom-4 inline-flex rounded-xl min-h-11 items-center gap-6 bg-ink px-5 py-3 text-sm font-bold text-sand">О машине <span aria-hidden="true">↗</span></span>
                </a>
              </Transition>
            </div>
            <div class="flex min-w-0 flex-col items-start" aria-live="polite" aria-atomic="true">
              <p class="m-0! text-sm font-semibold text-inherit!">{{ current(shelf)!.typeName }}</p>
              <h4 class="mt-3! mb-0! text-[clamp(28px,3vw,44px)]! leading-tight! font-bold tracking-tight text-inherit! [overflow-wrap:anywhere]">{{ current(shelf)!.brand }} {{ current(shelf)!.model }}</h4>
              <p v-if="variant === 'h' && current(shelf)!.shortDesc" class="mt-5! mb-0! whitespace-pre-line text-base leading-relaxed text-inherit! [overflow-wrap:anywhere]">{{ current(shelf)!.shortDesc }}</p>
              <p class="mt-6! mb-0! text-[clamp(28px,3vw,44px)] font-bold leading-tight text-inherit!">{{ formatMoney(current(shelf)!.pricePerShift) ? `${formatMoney(current(shelf)!.pricePerShift)} ₽` : "Цена по запросу" }}<span v-if="current(shelf)!.pricePerShift" class="mt-1 block text-sm font-medium">за смену</span></p>
              <ModelSpecs :specs="current(shelf)!.specs" class="mt-6 py-5" />
              <div v-if="variant === 'h'" class="mt-auto flex w-full flex-wrap justify-end gap-3 pt-8">
                <a :href="modelPath(current(shelf)!.typeSlug, current(shelf)!.slug)" class="group inline-flex min-h-14 items-center justify-between gap-4 rounded-2xl px-5 py-3 text-base font-bold transition-colors motion-reduce:transition-none! focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current" :class="section.colorTheme === 'BLACK' ? 'bg-flame text-ink! hover:bg-flame2' : 'bg-ink text-sand! hover:bg-ink2'">Подробнее о технике <span aria-hidden="true" class="transition-transform group-hover:translate-x-1 motion-reduce:translate-none! motion-reduce:transition-none!">→</span></a>
                <SiteButton href="#zayavka" :data-equipment-type-slug="current(shelf)!.typeSlug" :data-equipment-model-id="current(shelf)!.id" :data-equipment-label="`${current(shelf)!.brand} ${current(shelf)!.model}`" variant="ghost" :tone="section.colorTheme === 'BLACK' ? 'light' : 'dark'">Заказать</SiteButton>
              </div>
              <a v-else :href="modelPath(current(shelf)!.typeSlug, current(shelf)!.slug)" class="group mt-8 inline-flex rounded-2xl min-h-14 w-full items-center justify-between gap-6 px-5 py-3 text-base font-bold transition-colors motion-reduce:transition-none! focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current" :class="section.colorTheme === 'BLACK' ? 'bg-flame text-ink! hover:bg-flame2' : 'bg-ink text-sand! hover:bg-ink2'">Выбрать машину <span aria-hidden="true" class="transition-transform group-hover:translate-x-1 motion-reduce:translate-none! motion-reduce:transition-none!">→</span></a>
            </div>
          </div>

          <div class="mt-12 grid! grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4" role="group" :aria-label="`Выбор модели: ${shelf.category.title}`">
            <button
              v-for="model in (variant === 'h' ? pagination(shelf).models : shelf.models)"
              :key="model.id"
              type="button"
              :aria-pressed="current(shelf)?.id === model.id"
              class="group flex min-h-24 min-w-0 flex-col overflow-hidden rounded-2xl border p-0 text-left focus-visible:outline-2 focus-visible:outline-offset-4 motion-reduce:transition-none!"
              :class="variant === 'h' ? ['border-2 bg-white! text-ink! transition-[border-color] hover:border-ember! focus-visible:outline-ember-ink', current(shelf)?.id === model.id ? 'border-ember-ink' : 'border-cement-line'] : ['border-current/40 transition-colors hover:bg-current/10 focus-visible:outline-current', current(shelf)?.id === model.id ? (section.colorTheme === 'BLACK' ? 'bg-sand text-ink' : 'bg-ink text-sand') : 'bg-transparent text-inherit hover:bg-current/10', current(shelf)?.id === model.id && variant !== 'i' ? 'ring-2 ring-current ring-offset-2' : '', variant === 'j' ? 'relative isolate min-h-36 bg-ink! text-sand!' : '']"
              @click="selected[shelf.category.slug] = model.id"
            >
              <template v-if="variant === 'h'">
                <span class="grid! aspect-[16/10] w-full shrink-0 place-items-center overflow-hidden bg-cement text-steel">
                  <img v-if="model.photo" :src="model.photo" alt="" width="320" height="200" loading="lazy" class="h-full w-full object-cover">
                  <span v-else class="px-3 text-xs">Фото уточняйте</span>
                </span>
                <span class="w-full px-4 pt-4 pb-3 text-base font-bold [overflow-wrap:anywhere]">{{ model.brand }} {{ model.model }}</span>
                <span class="mt-auto px-4 pt-1 pb-5 text-base font-extrabold text-ember-ink">{{ formatMoney(model.pricePerShift) ? `${formatMoney(model.pricePerShift)} ₽ / смена` : "Цена по запросу" }}</span>
              </template>
              <template v-else-if="variant === 'j'">
                <img v-if="model.photo" :src="model.photo" alt="" width="320" height="180" loading="lazy" class="absolute inset-0 -z-20 h-full w-full object-cover">
                <span aria-hidden="true" class="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(16,20,22,.97)_0%,rgba(16,20,22,.9)_75%,rgba(16,20,22,.15)_100%)]" />
                <span class="flex min-h-36 w-3/4 flex-1 flex-col justify-between gap-4 p-3 text-sand md:p-4">
                  <span class="text-sm font-bold [overflow-wrap:anywhere]">{{ model.brand }} {{ model.model }}</span>
                  <span class="text-sm font-semibold">{{ formatMoney(model.pricePerShift) ? `${formatMoney(model.pricePerShift)} ₽ / смена` : "Цена по запросу" }}</span>
                </span>
              </template>
              <span v-else class="flex w-full flex-1 flex-col gap-3 p-4">
                <span class="text-sm font-bold [overflow-wrap:anywhere]">{{ model.brand }} {{ model.model }}</span>
                <span class="mt-auto text-sm font-semibold">{{ formatMoney(model.pricePerShift) ? `${formatMoney(model.pricePerShift)} ₽ / смена` : "Цена по запросу" }}</span>
                <span class="text-xs">{{ current(shelf)?.id === model.id ? "Выбрана ✓" : "Посмотреть →" }}</span>
              </span>
            </button>
          </div>
          <nav v-if="variant === 'h' && pagination(shelf).count > 1" class="mt-8 flex flex-wrap items-center justify-center gap-3" :aria-label="`Страницы моделей: ${section.title}`">
            <button type="button" aria-label="Предыдущая страница моделей" :disabled="pagination(shelf).index === 0" class="grid! size-12 place-items-center rounded-full border border-current/30 text-xl hover:bg-current/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current disabled:opacity-35" @click="pages[shelf.category.slug] = pagination(shelf).index - 1">←</button>
            <div class="flex flex-wrap justify-center" role="group" aria-label="Выбор страницы моделей">
              <button v-for="page in pagination(shelf).count" :key="page" type="button" :aria-label="`Страница ${page} из ${pagination(shelf).count}`" :aria-current="pagination(shelf).index === page - 1 ? 'page' : undefined" class="group grid! size-11 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current" @click="pages[shelf.category.slug] = page - 1">
                <span aria-hidden="true" class="size-2.5 rounded-full bg-current" :class="pagination(shelf).index === page - 1 ? 'opacity-100' : 'opacity-40 group-hover:opacity-70'" />
              </button>
            </div>
            <button type="button" aria-label="Следующая страница моделей" :disabled="pagination(shelf).index === pagination(shelf).count - 1" class="grid! size-12 place-items-center rounded-full border border-current/30 text-xl hover:bg-current/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current disabled:opacity-35" @click="pages[shelf.category.slug] = pagination(shelf).index + 1">→</button>
          </nav>
        </section>
        </TransitionGroup>
      </div>
    </section>
    <p class="m-0! bg-ink px-5 py-6 text-sm leading-relaxed text-fog! md:px-8">{{ priceDisclaimer }}</p>
  </div>
</template>
