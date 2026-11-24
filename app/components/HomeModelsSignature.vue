<script setup lang="ts">
import type { HomeModelGroup } from "~/utils/models";
import { categoryPath, typePath } from "~/utils/routes";
import { formatMoney } from "~/utils/price";

defineProps<{
  groups: HomeModelGroup[];
  citySlug: string;
  priceDisclaimer: string;
}>();

const selected = ref<Record<string, string>>({});

function current(group: HomeModelGroup) {
  return group.models.find((model) => model.id === selected.value[group.category.slug]) ?? group.models[0];
}

const tones = [
  "bg-[#f5f2eb] text-[#101416]",
  "bg-[#ff8a2b] text-[#101416]",
  "bg-[#101416] text-[#f5f2eb]",
];
</script>

<template>
  <div>
    <section
      v-for="(group, index) in groups"
      :id="`modeli-f-${group.category.slug}`"
      :key="group.category.slug"
      :aria-labelledby="`modeli-f-title-${group.category.slug}`"
      class="overflow-hidden px-5 py-12 md:px-8 md:py-20"
      :class="tones[index % 3]"
    >
      <div class="mx-auto max-w-site">
        <div class="mb-8 flex items-center justify-between gap-4 border-b border-current/25 pb-4 text-xs font-bold tracking-widest uppercase">
          <span>{{ group.number }} / Парк техники</span>
          <span>{{ group.modelsLabel }}</span>
        </div>
        <h2 :id="`modeli-f-title-${group.category.slug}`" class="m-0! max-w-5xl text-[clamp(32px,5.8vw,80px)]! leading-[.98]! font-extrabold tracking-[-.055em] text-inherit! uppercase [overflow-wrap:anywhere]">{{ group.category.title }}</h2>

        <div class="mt-8 grid! min-w-0 gap-8 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] lg:gap-12">
          <template v-if="current(group)">
            <div class="min-w-0">
              <Transition
                mode="out-in"
                enter-active-class="transition-[opacity,transform] duration-300 motion-reduce:transition-none!"
                enter-from-class="translate-x-4 opacity-0"
                leave-active-class="transition-opacity duration-150 motion-reduce:transition-none!"
                leave-to-class="opacity-0"
              >
                <a :key="current(group)!.id" :href="typePath(current(group)!.typeSlug, citySlug)" class="group relative block aspect-[4/3] overflow-hidden bg-[#232a2e] text-white! focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current md:aspect-[16/10]" :aria-label="`Подробнее: ${current(group)!.brand} ${current(group)!.model}`">
                  <img v-if="current(group)!.photo" :src="current(group)!.photo!" :alt="`${current(group)!.brand} ${current(group)!.model}`" width="960" height="600" loading="lazy" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.025] group-focus-visible:scale-[1.025] motion-reduce:transform-none! motion-reduce:scale-100! motion-reduce:translate-none! motion-reduce:transition-none!">
                  <span v-else class="absolute inset-0 grid! place-items-center text-lg">Фото уточняйте у менеджера</span>
                  <span class="absolute right-4 bottom-4 inline-flex min-h-11 items-center gap-6 bg-[#101416] px-5 py-3 text-sm font-bold text-[#f5f2eb]">О машине <span aria-hidden="true" class="inline-block transition-transform group-hover:translate-x-1 group-focus-visible:translate-x-1 motion-reduce:transform-none! motion-reduce:scale-100! motion-reduce:translate-none!">↗</span></span>
                </a>
              </Transition>
            </div>

            <div class="flex min-w-0 flex-col items-start" aria-live="polite" aria-atomic="true">
              <p class="m-0! text-sm font-semibold text-inherit!">{{ current(group)!.typeName }}</p>
              <h3 class="mt-3! mb-0! text-[clamp(28px,3vw,44px)]! leading-tight! font-bold tracking-tight text-inherit!">{{ current(group)!.brand }} {{ current(group)!.model }}</h3>
              <p class="mt-6! mb-0! text-[clamp(28px,3vw,44px)] font-bold leading-tight text-inherit!">{{ formatMoney(current(group)!.pricePerShift) ? `${formatMoney(current(group)!.pricePerShift)} ₽` : "Цена по запросу" }}<span v-if="current(group)!.pricePerShift" class="mt-1 block text-sm font-medium">за смену</span></p>
              <dl v-if="current(group)!.specs.length" class="mt-6 grid! w-full grid-cols-2 gap-5 border-y border-current/25 py-5">
                <div v-for="spec in current(group)!.specs.slice(0, 2)" :key="spec.name" class="min-w-0">
                  <dt class="text-xs leading-relaxed">{{ spec.name }}</dt>
                  <dd class="m-0 mt-1 text-lg font-bold [overflow-wrap:anywhere]">{{ spec.value }}</dd>
                </div>
              </dl>
              <a :href="typePath(current(group)!.typeSlug, citySlug)" class="group mt-6 inline-flex min-h-12 w-full items-center justify-between gap-6 px-5 py-3 text-base font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current" :class="index % 3 === 2 ? 'bg-[#ff8a2b] text-[#101416]! hover:bg-[#ffa24f]' : 'bg-[#101416] text-[#f5f2eb]! hover:bg-[#30383b]'">Выбрать машину <span aria-hidden="true" class="transition-transform group-hover:translate-x-1 motion-reduce:transform-none! motion-reduce:scale-100! motion-reduce:translate-none!">→</span></a>
            </div>
          </template>
        </div>

        <div class="mt-8 flex flex-wrap gap-2" role="group" :aria-label="`Выбор модели: ${group.category.title}`">
          <button
            v-for="model in group.models"
            :key="model.id"
            type="button"
            :aria-pressed="current(group)?.id === model.id"
            class="min-h-12 border border-current/40 px-4 py-3 text-sm font-semibold transition-[background-color,color,transform] hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current motion-reduce:transform-none! motion-reduce:scale-100! motion-reduce:translate-none! motion-reduce:transition-none!"
            :class="current(group)?.id === model.id ? (index % 3 === 2 ? 'bg-[#f5f2eb] text-[#101416]' : 'bg-[#101416] text-[#f5f2eb]') : 'bg-transparent text-inherit hover:bg-current/10'"
            @click="selected[group.category.slug] = model.id"
          >{{ model.brand }} {{ model.model }}</button>
        </div>
        <a :href="categoryPath(group.category.slug)" class="mt-5 inline-flex min-h-11 items-center gap-3 text-sm font-bold text-inherit! underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current">Весь раздел <span aria-hidden="true">↗</span></a>
      </div>
    </section>
    <p class="m-0! bg-[#101416] px-5 py-6 text-sm leading-relaxed text-[#c5cacb]! md:px-8">{{ priceDisclaimer }}</p>
  </div>
</template>