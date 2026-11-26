<script setup lang="ts">
import { imageVariantUrl } from "#shared/utils/uploads";
const props = defineProps<{ photos: string[]; label: string }>();
const viewer = ref<HTMLDialogElement | null>(null);
const activeIndex = ref(0);
const activePhoto = computed(() => props.photos[activeIndex.value]);
let trigger: HTMLElement | null = null;
let previousOverflow = "";
let locked = false;

function openPhoto(index: number, event: MouseEvent) {
  if (!viewer.value || !props.photos[index]) return;
  trigger = event.currentTarget instanceof HTMLElement ? event.currentTarget : null;
  activeIndex.value = index;
  previousOverflow = document.body.style.overflow;
  viewer.value.showModal();
  document.body.style.overflow = "hidden";
  locked = true;
}

function restore() {
  if (!locked) return;
  document.body.style.overflow = previousOverflow;
  locked = false;
  if (trigger?.isConnected) trigger.focus({ preventScroll: true });
  trigger = null;
}

function close() {
  viewer.value?.close();
  restore();
}

function step(direction: number) {
  if (!props.photos.length) return;
  activeIndex.value = (activeIndex.value + direction + props.photos.length) % props.photos.length;
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === "Tab") {
    const buttons = viewer.value?.querySelectorAll<HTMLButtonElement>("button");
    if (!buttons?.length) return;
    const first = buttons[0]!;
    const last = buttons[buttons.length - 1]!;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
    return;
  }
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  event.preventDefault();
  step(event.key === "ArrowLeft" ? -1 : 1);
}

watch(() => props.photos, close);
onBeforeUnmount(close);
</script>

<template>
  <section v-if="photos.length" class="section min-w-0" data-type-gallery>
    <h2>Фото техники</h2>
    <p class="muted">Нажмите на фото, чтобы рассмотреть подробнее.</p>
    <div class="flex max-w-full gap-3 overflow-x-auto overscroll-x-contain p-1 pb-3" data-gallery-strip>
      <button
        v-for="(photo, index) in photos"
        :key="`${photo}-${index}`"
        type="button"
        class="h-[120px] w-[180px] shrink-0 cursor-zoom-in overflow-hidden rounded-card border-2 border-line bg-line p-0 hover:border-ember-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-ink sm:h-[160px] sm:w-[240px]"
        :aria-label="`Открыть фото ${index + 1}: ${label}`"
        aria-haspopup="dialog"
        @click="openPhoto(index, $event)"
      >
        <img :src="imageVariantUrl(photo, 'small')" :alt="`${label} — фото ${index + 1}`" loading="lazy" width="480" height="320" class="h-full w-full object-cover" >
      </button>
    </div>
    <Teleport to="body">
      <dialog ref="viewer" class="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none border-0 bg-ink p-4 text-white backdrop:bg-ink/90 open:grid open:grid-rows-[auto_minmax(0,1fr)_auto] open:gap-4 sm:p-6" :aria-label="`Фото техники: ${label}`" data-gallery-viewer @keydown="onKeydown" @click.self="close" @close="restore">
        <div class="flex min-w-0 items-center justify-between gap-4">
          <span class="min-w-0 truncate text-sm font-semibold sm:text-base">{{ label }}</span>
          <button type="button" autofocus class="grid size-11 shrink-0 place-items-center rounded-full border border-white/60 bg-ink text-2xl text-white hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" aria-label="Закрыть фото" @click="close">×</button>
        </div>
        <div class="flex min-h-0 min-w-0 items-center justify-center" @click.self="close">
          <img v-if="activePhoto" :src="activePhoto" :alt="`${label} — фото ${activeIndex + 1}`" class="block max-h-full max-w-full object-contain" >
        </div>
        <div class="flex items-center justify-center gap-5">
          <button v-if="photos.length > 1" type="button" class="grid size-11 place-items-center rounded-full border border-white/60 bg-ink text-2xl text-white hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" aria-label="Предыдущее фото" @click="step(-1)">←</button>
          <span class="text-sm text-white" aria-live="polite" aria-atomic="true">{{ activeIndex + 1 }} / {{ photos.length }}</span>
          <button v-if="photos.length > 1" type="button" class="grid size-11 place-items-center rounded-full border border-white/60 bg-ink text-2xl text-white hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" aria-label="Следующее фото" @click="step(1)">→</button>
        </div>
      </dialog>
    </Teleport>
  </section>
</template>