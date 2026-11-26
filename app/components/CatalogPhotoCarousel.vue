<script setup lang="ts">
import { imageVariantUrl } from "#shared/utils/uploads";

const props = defineProps<{ photos: string[]; title: string; href: string }>();
const selected = ref(0);
const failed = ref<string[]>([]);
const photos = computed(() => [...new Set(props.photos)].filter((photo) => !failed.value.includes(photo)));
const index = computed(() => selected.value % (photos.value.length || 1));
const active = computed(() => photos.value[index.value]);
let start: { x: number; y: number } | null = null;
let suppressClick = false;
function step(delta: number) {
  selected.value = (index.value + delta + photos.value.length) % (photos.value.length || 1);
}
function touchStart(event: TouchEvent) {
  const point = event.touches[0];
  start = point ? { x: point.clientX, y: point.clientY } : null;
  suppressClick = false;
}
function touchEnd(event: TouchEvent) {
  const point = event.changedTouches[0];
  if (start && point && Math.abs(point.clientX - start.x) > 40 && Math.abs(point.clientX - start.x) > Math.abs(point.clientY - start.y)) {
    step(point.clientX < start.x ? 1 : -1);
    suppressClick = true;
  }
  start = null;
}
function click(event: MouseEvent) {
  if (suppressClick) { event.preventDefault(); suppressClick = false; }
}
watch(() => props.photos, () => { selected.value = 0; failed.value = []; });
</script>

<template>
  <div class="group/photo relative aspect-[16/10] overflow-hidden bg-cement text-ink" data-catalog-photos @touchstart.passive="touchStart" @touchend.passive="touchEnd" @touchcancel="start = null">
    <NuxtLink :to="href" class="grid h-full w-full place-items-center text-ink! focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-ink" :aria-label="`Подробнее: ${title}`" @click="click">
      <img v-if="active" :key="active" :src="imageVariantUrl(active, 'small')" :alt="`${title} — фото ${index + 1}`" width="480" height="360" loading="lazy" class="h-full w-full object-contain" @error="failed.push(active)">
      <span v-else class="p-5 text-center text-sm">Фото уточняйте у менеджера</span>
    </NuxtLink>
    <template v-if="photos.length > 1">
      <button v-for="direction in [-1, 1]" :key="direction" type="button" :aria-label="direction < 0 ? 'Предыдущее фото' : 'Следующее фото'" class="absolute top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-line bg-white text-xl text-ink opacity-0 transition-opacity group-hover/photo:opacity-100 group-focus-within/photo:opacity-100 hover:bg-cement focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-ink motion-reduce:transition-none [@media(hover:none)]:opacity-100" :class="direction < 0 ? 'left-2' : 'right-2'" @click="step(direction)">{{ direction < 0 ? '←' : '→' }}</button>
      <div class="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center gap-1" aria-hidden="true">
        <span v-for="(_, position) in photos" :key="position" class="size-1.5 rounded-full" :class="position === index ? 'bg-ink' : 'bg-white ring-1 ring-ink/40'" />
      </div>
      <span class="sr-only" aria-live="polite" aria-atomic="true">Фото {{ index + 1 }} из {{ photos.length }}</span>
    </template>
  </div>
</template>