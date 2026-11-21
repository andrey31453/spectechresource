<script setup lang="ts">
import type { HomeModelDto } from "~/types/catalog";

/**
 * Карточка модели на главной — главный «товарный» элемент страницы.
 *
 * Вертикальная: фото на всю ширину, крупные название и цена, три характеристики.
 * При наведении и с клавиатуры карточка слегка увеличивается (место под масштаб
 * зарезервировано отступом `li` в `index.vue`, поэтому соседние карточки не двигаются),
 * а на фото выезжает панель с полным списком характеристик. Вся карточка — ссылка
 * на посадочную вида: отдельных страниц моделей в каталоге нет.
 */
const props = defineProps<{
  model: HomeModelDto;
  citySlug: string;
}>();

/** Сколько характеристик видно всегда; остальные — в панели на фото. */
const VISIBLE_SPECS = 3;

const href = computed(() => typePath(props.model.typeSlug, props.citySlug));
const visibleSpecs = computed(() => props.model.specs.slice(0, VISIBLE_SPECS));
/** Вторая строка под ценой смены: «4 000 ₽/час», если цена за час заполнена. */
const hourPrice = computed(() =>
  props.model.pricePerHour ? formatPrice(props.model.pricePerHour) : null,
);
</script>

<template>
  <NuxtLink
    :to="href"
    class="group relative flex h-full flex-col overflow-hidden rounded-[4px] border border-[#d8d2c0] bg-white shadow-[0_1px_2px_rgb(13_18_20/0.06)] transition-[transform,scale,box-shadow,border-color] duration-200 ease-out hover:z-10 hover:scale-[1.02] hover:border-[#c9a48f] hover:shadow-[0_16px_34px_-18px_rgb(13_18_20/0.45)] focus-visible:z-10 focus-visible:scale-[1.02] focus-visible:border-[#b83c12]"
  >
    <div class="relative aspect-[16/10] w-full overflow-hidden bg-[#e8e5db]">
      <img
        v-if="model.photo"
        class="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06] group-focus-visible:scale-[1.06]"
        :src="model.photo"
        :alt="`${model.brand} ${model.model} — ${model.typeName}`"
        width="760"
        height="475"
        loading="lazy"
        decoding="async"
      >
      <span
        v-else
        class="absolute inset-0 flex items-center justify-center text-[11px] tracking-[0.14em] text-[#8a8474] uppercase"
        >фото готовится</span
      >

      <!-- Доп. информация при наведении: полный список характеристик поверх фото.
           Панель лежит в потоке карточки, но абсолютом — раскладку не меняет.
           `aria-hidden`: это визуальный дубль характеристик, скринридеру хватает текста. -->
      <div
        v-if="model.specs.length"
        aria-hidden="true"
        class="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-[#0d1214]/95 via-[#0d1214]/85 to-transparent px-4 pt-8 pb-3 text-white opacity-0 transition duration-200 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
      >
        <span class="text-[10px] font-semibold tracking-[0.18em] uppercase opacity-70"
          >Характеристики</span
        >
        <dl class="mt-1.5 space-y-0.5 text-[12.5px] leading-5">
          <div
            v-for="spec in model.specs"
            :key="spec.name"
            class="flex items-baseline justify-between gap-3"
          >
            <dt class="min-w-0 opacity-70">{{ spec.name }}</dt>
            <dd class="shrink-0 font-medium">{{ spec.value }}</dd>
          </div>
        </dl>
      </div>
    </div>

    <div class="flex flex-1 flex-col p-4">
      <span class="kicker">{{ model.brand }}</span>
      <h4 class="mt-1.5 text-[1.28rem] leading-tight font-semibold tracking-tight text-[#0d1214]">
        {{ model.model }}
      </h4>
      <p class="mt-1 text-sm leading-5 text-[#3d474b]">{{ model.typeName }}</p>

      <dl v-if="visibleSpecs.length" class="mt-3 space-y-1 text-[13px] leading-5">
        <div
          v-for="spec in visibleSpecs"
          :key="spec.name"
          class="flex items-baseline justify-between gap-3"
        >
          <dt class="min-w-0 text-[#3d474b]">{{ spec.name }}</dt>
          <dd class="shrink-0 text-right font-medium text-[#0d1214]">{{ spec.value }}</dd>
        </div>
      </dl>

      <div class="mt-auto pt-4">
        <div class="flex items-end justify-between gap-3 border-t border-[#e7e1d1] pt-3">
          <span class="min-w-0">
            <b class="block text-[1.5rem] leading-none font-bold tracking-tight text-[#0d1214]">{{
              formatPrice(model.pricePerShift)
            }}</b>
            <span class="mt-1.5 block text-xs leading-4 text-[#3d474b]">
              за смену 8 ч<template v-if="hourPrice"> · {{ hourPrice }}/час</template>
            </span>
          </span>
          <span
            aria-hidden="true"
            class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#d9d5c8] text-[#b83c12] transition-colors duration-200 group-hover:border-[#b83c12] group-hover:bg-[#f6f1ea] group-focus-visible:border-[#b83c12] group-focus-visible:bg-[#f6f1ea]"
          >
            <svg
              class="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
              focusable="false"
            >
              <path d="M4 12h15M13.5 6.5 19 12l-5.5 5.5" />
            </svg>
          </span>
        </div>
      </div>

      <span class="sr-only">— открыть карточку вида</span>
    </div>
  </NuxtLink>
</template>
