<script setup lang="ts">
import { imageVariantUrl } from "#shared/utils/uploads";

const props = defineProps<{ photos: string[]; title: string }>();
const selected = defineModel<number>({ default: 0 });
const viewer = ref<HTMLDialogElement | null>(null);
const opened = ref(false);
const failed = ref(false);
const active = computed(() => props.photos[selected.value] ?? props.photos[0]);
let trigger: HTMLElement | null = null;
let previousOverflow = "";

function open(event: MouseEvent) {
  if (!viewer.value || !active.value || opened.value) return;
  trigger = event.currentTarget instanceof HTMLElement ? event.currentTarget : null;
  previousOverflow = document.body.style.overflow;
  failed.value = false;
  viewer.value.showModal();
  opened.value = true;
  document.body.style.overflow = "hidden";
}
function restore() {
  if (!opened.value) return;
  opened.value = false;
  document.body.style.overflow = previousOverflow;
  if (trigger?.isConnected) trigger.focus({ preventScroll: true });
  trigger = null;
}
function close() { viewer.value?.close(); restore(); }
function step(delta: number) {
  selected.value = (selected.value + delta + props.photos.length) % (props.photos.length || 1);
}
function keydown(event: KeyboardEvent) {
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    event.preventDefault();
    step(event.key === "ArrowLeft" ? -1 : 1);
  }
  if (event.key !== "Tab") return;
  const buttons = viewer.value?.querySelectorAll<HTMLButtonElement>("button");
  if (!buttons?.length) return;
  const first = buttons[0]!;
  const last = buttons[buttons.length - 1]!;
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}
watch(active, () => { failed.value = false; });
watch(() => props.photos, close);
onBeforeRouteLeave(close);
onBeforeUnmount(close);
defineExpose({ open });
</script>

<template>
  <Teleport to="body">
    <dialog ref="viewer" class="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none border-0 bg-ink p-4 text-white backdrop:bg-ink/90 open:grid open:grid-rows-[auto_minmax(0,1fr)_auto] open:gap-4 sm:p-6" :aria-label="`Фото: ${title}`" data-photo-viewer @keydown="keydown" @click.self="close" @close="restore">
      <div class="flex items-center justify-between gap-4">
        <span class="truncate text-sm font-semibold">{{ title }}</span>
        <button type="button" autofocus class="grid size-11 shrink-0 place-items-center rounded-full border border-white/60 bg-ink text-2xl text-white hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white" aria-label="Закрыть фото" @click="close">×</button>
      </div>
      <div class="flex min-h-0 min-w-0 items-center justify-center" data-photo-backdrop @click.self="close">
        <img v-if="opened && active && !failed" :key="active" :src="imageVariantUrl(active, 'full')" :alt="`${title} — фото ${selected + 1}`" class="block max-h-full max-w-full object-contain" @error="failed = true">
        <p v-else-if="failed" role="status" class="text-white!">Не удалось загрузить фото. Попробуйте другое.</p>
      </div>
      <div class="flex items-center justify-center gap-5">
        <button v-if="photos.length > 1" type="button" class="grid size-11 place-items-center rounded-full border border-white/60 bg-ink text-2xl text-white hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white" aria-label="Предыдущее фото" @click="step(-1)">←</button>
        <span aria-live="polite" aria-atomic="true" class="text-sm text-white">{{ selected + 1 }} / {{ photos.length }}</span>
        <button v-if="photos.length > 1" type="button" class="grid size-11 place-items-center rounded-full border border-white/60 bg-ink text-2xl text-white hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white" aria-label="Следующее фото" @click="step(1)">→</button>
      </div>
    </dialog>
  </Teleport>
</template>