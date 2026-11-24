<script setup lang="ts">
import type { HomeModelSection } from "~/utils/model-groups";
import type { HomeModelGroup } from "~/utils/models";
import { categoryPath, typePath } from "~/utils/routes";
import { formatMoney } from "~/utils/price";

defineProps<{
  sections: HomeModelSection[];
  variant: "h" | "i" | "j";
  thumbnails: boolean;
  citySlug: string;
  priceDisclaimer: string;
}>();

const selected = ref<Record<string, string>>({});
const filters = ref<Record<string, string>>({});

function visibleShelves(section: HomeModelSection) {
  const slug = filters.value[section.slug];
  return slug ? section.shelves.filter((shelf) => shelf.category.slug === slug) : section.shelves;
}

function current(shelf: HomeModelGroup) {
  return shelf.models.find((model) => model.id === selected.value[shelf.category.slug]) ?? shelf.models[0];
}

const introductions: Record<string, string> = {
  "zemlyanye-raboty": "От разработки грунта до устройства свай.",
  "pogruzka-i-podem": "Погрузка, подъём и монтаж — техника под вашу задачу.",
  "dorogi-i-stroyka": "От подготовки основания до асфальта и бетона.",
  "perevozki-i-kommunalka": "Перевозка техники, вывоз грунта и обслуживание территорий.",
};
const tones = [
  "bg-[#f5f2eb] text-[#101416]",
  "bg-[#ff8a2b] text-[#101416]",
  "bg-[#101416] text-[#f5f2eb]",
];
</script>

<template>
  <div>
    <section
      v-for="(section, index) in sections"
      :id="`modeli-${variant}-${section.slug}`"
      :key="section.slug"
      :aria-labelledby="`modeli-${variant}-title-${section.slug}`"
      class="overflow-hidden px-5 py-12 md:px-8 md:py-20"
      :class="tones[index % 3]"
    >
      <div class="mx-auto max-w-site">
        <div class="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-current/25 pb-4 text-xs font-bold tracking-widest uppercase">
          <span>{{ section.numberLabel }} / Парк техники</span>
          <span>{{ section.shelvesLabel }} · {{ section.modelsLabel }}</span>
        </div>
        <h2 :id="`modeli-${variant}-title-${section.slug}`" class="m-0! max-w-5xl text-[clamp(32px,5.8vw,80px)]! leading-[.98]! font-extrabold tracking-[-.055em] text-inherit! uppercase [overflow-wrap:anywhere]">{{ section.title }}</h2>
        <p class="mt-5! mb-0! max-w-2xl text-lg leading-relaxed text-inherit!">{{ introductions[section.slug] ?? section.lead }}</p>
        <div v-if="variant !== 'i'" class="mt-6 flex flex-wrap gap-2" role="group" :aria-label="`Фильтр подкатегорий: ${section.title}`">
          <button v-for="filter in [{ slug: '', title: 'Все' }, ...section.shelves.map(shelf => shelf.category)]" :key="filter.slug" type="button" :aria-pressed="(filters[section.slug] ?? '') === filter.slug" class="min-h-11 border border-current/40 px-4 py-2 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current" :class="(filters[section.slug] ?? '') === filter.slug ? (index % 3 === 2 ? 'bg-[#f5f2eb] text-[#101416]' : 'bg-[#101416] text-[#f5f2eb]') : 'bg-transparent text-inherit hover:bg-current/10'" @click="filters[section.slug] = filter.slug">{{ filter.title }}</button>
        </div>
        <nav v-else class="mt-6 flex flex-wrap gap-x-6 gap-y-2" :aria-label="`Подкатегории: ${section.title}`">
          <a v-for="shelf in section.shelves" :key="shelf.category.slug" :href="`#modeli-${variant}-shelf-${shelf.category.slug}`" class="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-inherit! underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current">{{ shelf.category.title }} <span aria-hidden="true">↓</span></a>
        </nav>

        <section v-for="shelf in visibleShelves(section)" :id="`modeli-${variant}-shelf-${shelf.category.slug}`" :key="shelf.category.slug" :aria-labelledby="`modeli-${variant}-shelf-title-${shelf.category.slug}`" class="mt-10 scroll-mt-24 border-t border-current/25 pt-8 md:mt-14">
          <div class="flex flex-wrap items-baseline justify-between gap-4">
            <h3 :id="`modeli-${variant}-shelf-title-${shelf.category.slug}`" class="m-0! text-[clamp(24px,3vw,40px)]! leading-tight! font-bold tracking-tight text-inherit!">{{ shelf.category.title }}</h3>
            <a :href="categoryPath(shelf.category.slug)" class="inline-flex min-h-11 items-center gap-3 text-sm font-bold text-inherit! underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current">Весь раздел <span aria-hidden="true">↗</span></a>
          </div>

          <div v-if="current(shelf)" class="mt-6 grid! min-w-0 gap-8 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] lg:gap-12">
            <div class="min-w-0">
              <Transition mode="out-in" enter-active-class="transition-opacity duration-300 motion-reduce:transition-none!" enter-from-class="opacity-0" leave-active-class="transition-opacity duration-150 motion-reduce:transition-none!" leave-to-class="opacity-0">
                <a :key="current(shelf)!.id" :href="typePath(current(shelf)!.typeSlug, citySlug)" class="group relative block aspect-[4/3] overflow-hidden bg-[#232a2e] text-white! focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current md:aspect-[16/10]" :aria-label="`Подробнее: ${current(shelf)!.brand} ${current(shelf)!.model}`">
                  <img v-if="current(shelf)!.photo" :src="current(shelf)!.photo!" :alt="`${current(shelf)!.brand} ${current(shelf)!.model}`" width="960" height="600" loading="lazy" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.025] group-focus-visible:scale-[1.025] motion-reduce:scale-100! motion-reduce:transition-none!">
                  <span v-else class="absolute inset-0 grid! place-items-center text-lg">Фото уточняйте у менеджера</span>
                  <span class="absolute right-4 bottom-4 inline-flex min-h-11 items-center gap-6 bg-[#101416] px-5 py-3 text-sm font-bold text-[#f5f2eb]">О машине <span aria-hidden="true">↗</span></span>
                </a>
              </Transition>
            </div>
            <div class="flex min-w-0 flex-col items-start" aria-live="polite" aria-atomic="true">
              <p class="m-0! text-sm font-semibold text-inherit!">{{ current(shelf)!.typeName }}</p>
              <h4 class="mt-3! mb-0! text-[clamp(28px,3vw,44px)]! leading-tight! font-bold tracking-tight text-inherit! [overflow-wrap:anywhere]">{{ current(shelf)!.brand }} {{ current(shelf)!.model }}</h4>
              <p class="mt-6! mb-0! text-[clamp(28px,3vw,44px)] font-bold leading-tight text-inherit!">{{ formatMoney(current(shelf)!.pricePerShift) ? `${formatMoney(current(shelf)!.pricePerShift)} ₽` : "Цена по запросу" }}<span v-if="current(shelf)!.pricePerShift" class="mt-1 block text-sm font-medium">за смену</span></p>
              <dl v-if="current(shelf)!.specs.length" class="mt-6 grid! w-full grid-cols-2 gap-5 border-y border-current/25 py-5">
                <div v-for="spec in current(shelf)!.specs.slice(0, 2)" :key="spec.name" class="min-w-0">
                  <dt class="text-xs leading-relaxed">{{ spec.name }}</dt>
                  <dd class="m-0 mt-1 text-lg font-bold [overflow-wrap:anywhere]">{{ spec.value }}</dd>
                </div>
              </dl>
              <a :href="typePath(current(shelf)!.typeSlug, citySlug)" class="group mt-6 inline-flex min-h-12 w-full items-center justify-between gap-6 px-5 py-3 text-base font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current" :class="index % 3 === 2 ? 'bg-[#ff8a2b] text-[#101416]! hover:bg-[#ffa24f]' : 'bg-[#101416] text-[#f5f2eb]! hover:bg-[#30383b]'">Выбрать машину <span aria-hidden="true" class="transition-transform group-hover:translate-x-1 motion-reduce:translate-none! motion-reduce:transition-none!">→</span></a>
            </div>
          </div>

          <div class="mt-8 grid! grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4" role="group" :aria-label="`Выбор модели: ${shelf.category.title}`">
            <button
              v-for="model in shelf.models"
              :key="model.id"
              type="button"
              :aria-pressed="current(shelf)?.id === model.id"
              class="group flex min-h-24 min-w-0 flex-col overflow-hidden border border-current/40 p-0 text-left transition-[background-color,color,translate] hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current motion-reduce:translate-none! motion-reduce:transition-none!"
              :class="[current(shelf)?.id === model.id ? (index % 3 === 2 ? 'bg-[#f5f2eb] text-[#101416]' : 'bg-[#101416] text-[#f5f2eb]') : 'bg-transparent text-inherit hover:bg-current/10', current(shelf)?.id === model.id && variant !== 'i' ? 'ring-2 ring-current ring-offset-2' : '', variant === 'j' ? 'relative isolate min-h-36 bg-[#101416]! text-[#f5f2eb]!' : '']"
              @click="selected[shelf.category.slug] = model.id"
            >
              <template v-if="variant === 'h'">
                <span class="w-full px-4 pt-4 pb-3 text-sm font-bold [overflow-wrap:anywhere]">{{ model.brand }} {{ model.model }}</span>
                <span class="grid! h-[90px]! w-full shrink-0 place-items-center overflow-hidden bg-[#232a2e] text-[#f5f2eb] md:h-[120px]!">
                  <img v-if="model.photo" :src="model.photo" alt="" width="320" height="120" loading="lazy" class="h-[90px]! w-full object-cover md:h-[120px]!">
                  <span v-else class="px-3 text-xs">Фото уточняйте</span>
                </span>
                <span class="mt-auto px-4 py-3 text-sm font-semibold">{{ formatMoney(model.pricePerShift) ? `${formatMoney(model.pricePerShift)} ₽ / смена` : "Цена по запросу" }}</span>
              </template>
              <template v-else-if="variant === 'j'">
                <img v-if="model.photo" :src="model.photo" alt="" width="320" height="180" loading="lazy" class="absolute inset-0 -z-20 h-full w-full object-cover">
                <span aria-hidden="true" class="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(16,20,22,.97)_0%,rgba(16,20,22,.9)_75%,rgba(16,20,22,.15)_100%)]" />
                <span class="flex min-h-36 w-3/4 flex-1 flex-col justify-between gap-4 p-3 text-[#f5f2eb] md:p-4">
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
        </section>
      </div>
    </section>
    <p class="m-0! bg-[#101416] px-5 py-6 text-sm leading-relaxed text-[#c5cacb]! md:px-8">{{ priceDisclaimer }}</p>
  </div>
</template>