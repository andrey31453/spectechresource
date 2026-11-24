<script setup lang="ts">
import type { HomeModelGroup } from "~/utils/models";
import { categoryPath, typePath } from "~/utils/routes";
import { formatMoney } from "~/utils/price";

defineProps<{
  groups: HomeModelGroup[];
  citySlug: string;
  priceDisclaimer: string;
}>();

const tones = [
  "bg-[#101416] text-[#f5f2eb]",
  "bg-[#f5f2eb] text-[#101416]",
  "bg-[#ff8a2b] text-[#101416]",
];
</script>

<template>
  <div>
    <section
      v-for="(group, index) in groups"
      :id="`modeli-g-${group.category.slug}`"
      :key="group.category.slug"
      :aria-labelledby="`modeli-g-title-${group.category.slug}`"
      class="overflow-hidden px-5 py-12 md:px-8 md:py-20"
      :class="tones[index % 3]"
    >
      <div class="mx-auto max-w-site">
        <div class="mb-8 flex flex-wrap items-end justify-between gap-5 border-b border-current/25 pb-6">
          <div class="min-w-0 flex-1 basis-64">
            <p class="mt-0! mb-4! text-xs font-bold tracking-widest text-inherit! uppercase">{{ group.number }} / {{ group.modelsLabel }}</p>
            <h2 :id="`modeli-g-title-${group.category.slug}`" class="m-0! max-w-4xl text-[clamp(32px,4.5vw,64px)]! leading-none! font-extrabold tracking-[-.05em] text-inherit! uppercase [overflow-wrap:anywhere]">{{ group.category.title }}</h2>
          </div>
          <a :href="categoryPath(group.category.slug)" class="inline-flex min-h-11 shrink-0 items-center gap-5 border-b border-current py-2 text-sm font-bold text-inherit! focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current">Весь раздел <span aria-hidden="true">↗</span></a>
        </div>

        <div class="grid! min-w-0 gap-8 md:grid-cols-2 xl:grid-cols-3">
          <article v-for="(model, modelIndex) in group.models" :key="model.id" class="group min-w-0 border-b border-current/30 pb-6 transition-transform duration-300 hover:-translate-y-1 focus-within:-translate-y-1 motion-reduce:transform-none! motion-reduce:scale-100! motion-reduce:translate-none! motion-reduce:transition-none!">
            <a :href="typePath(model.typeSlug, citySlug)" class="relative block aspect-[4/3] overflow-hidden bg-[#232a2e] text-white! focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current" :aria-label="`Подробнее: ${model.brand} ${model.model}`">
              <img v-if="model.photo" :src="model.photo" :alt="`${model.brand} ${model.model}`" width="720" height="540" loading="lazy" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.035] group-focus-within:scale-[1.035] motion-reduce:transform-none! motion-reduce:scale-100! motion-reduce:translate-none! motion-reduce:transition-none!">
              <span v-else class="absolute inset-0 grid! place-items-center px-5 text-base">Фото уточняйте у менеджера</span>
              <span aria-hidden="true" class="absolute top-3 left-3 bg-[#101416] px-3 py-2 font-mono text-xs text-[#f5f2eb]">{{ String(modelIndex + 1).padStart(2, "0") }}</span>
              <span aria-hidden="true" class="absolute right-3 bottom-3 grid! size-12 place-items-center bg-[#ff8a2b] text-2xl text-[#101416] transition-transform group-hover:-translate-y-1 group-focus-within:-translate-y-1 motion-reduce:transform-none! motion-reduce:scale-100! motion-reduce:translate-none!">↗</span>
            </a>
            <p class="mt-5! mb-2! text-sm text-inherit!">{{ model.typeName }}</p>
            <h3 class="m-0! text-2xl! leading-tight! font-bold text-inherit!">{{ model.brand }} {{ model.model }}</h3>
            <p class="mt-4! mb-0! text-2xl font-bold text-inherit!">{{ formatMoney(model.pricePerShift) ? `${formatMoney(model.pricePerShift)} ₽` : "Цена по запросу" }}<span v-if="model.pricePerShift" class="ml-2 text-sm font-medium">/ смена</span></p>
            <details v-if="model.specs.length" class="mt-4 border-t border-current/25">
              <summary class="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 py-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current [&::-webkit-details-marker]:hidden">Характеристики <span aria-hidden="true" class="text-xl transition-transform in-open:rotate-45 motion-reduce:transition-none!">+</span></summary>
              <dl class="m-0 grid! grid-cols-2 gap-4 pb-4">
                <div v-for="spec in model.specs.slice(0, 2)" :key="spec.name" class="min-w-0">
                  <dt class="text-xs leading-relaxed">{{ spec.name }}</dt>
                  <dd class="m-0 mt-1 text-base font-bold [overflow-wrap:anywhere]">{{ spec.value }}</dd>
                </div>
              </dl>
            </details>
            <a :href="typePath(model.typeSlug, citySlug)" class="mt-3 inline-flex min-h-12 w-full items-center justify-between gap-3 border border-current px-4 py-3 text-sm font-bold text-inherit! transition-colors hover:bg-current/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current">Выбрать машину <span aria-hidden="true">→</span></a>
          </article>
        </div>
      </div>
    </section>
    <p class="m-0! bg-[#101416] px-5 py-6 text-sm leading-relaxed text-[#c5cacb]! md:px-8">{{ priceDisclaimer }}</p>
  </div>
</template>