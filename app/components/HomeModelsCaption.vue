<script setup lang="ts">
import type { HomeModelVariant } from "~/utils/model-variants";
import { modelVariant } from "~/utils/model-variants";

/**
 * Подпись версии блока «Каталог моделей» на странице сравнения.
 *
 * Одинаковая графитовая полоса перед каждой версией: она отделяет варианты друг
 * от друга, но не вмешивается в их собственный дизайн — заказчик сравнивает
 * вёрстку, а не подписи. Данные — `HOME_MODEL_VARIANTS`, чтобы код, название
 * и якорь не разъезжались с навигацией.
 */
const props = defineProps<{ variant: HomeModelVariant["key"] }>();

const entry = computed(() => modelVariant(props.variant));
</script>

<template>
  <div class="border-y border-white/10 bg-[#0d1214] px-5 py-4 md:px-8">
    <div class="mx-auto flex max-w-site flex-wrap items-baseline gap-x-4 gap-y-1.5">
      <b class="font-mono text-[11px] font-semibold tracking-[0.24em] text-[#ff9c4a] uppercase"
        >Вариант {{ entry.key.toUpperCase() }}</b
      >
      <span class="text-base font-semibold text-[#f4efe2]">{{ entry.title }}</span>
      <span class="min-w-0 basis-full text-[13px] leading-5 text-[#a9a49a] sm:flex-1 sm:basis-auto">{{
        entry.note
      }}</span>
    </div>
  </div>
</template>
