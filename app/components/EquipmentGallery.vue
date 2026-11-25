<script setup lang="ts">
const props = defineProps<{ photos: string[]; title: string }>();
const selected = ref(0);
const failed = ref<string[]>([]);
const photos = computed(() => [...new Set(props.photos)].filter(photo => !failed.value.includes(photo)));
const active = computed(() => photos.value[selected.value] ?? photos.value[0]);
watch(() => props.photos, () => { selected.value = 0; failed.value = []; });
</script>

<template>
  <div class="flex min-w-0 flex-col gap-3 lg:flex-row" aria-label="Фотографии модели">
    <div v-if="photos.length > 1" class="order-2 flex gap-2 overflow-x-auto p-1 lg:order-1 lg:max-h-[520px] lg:w-20 lg:shrink-0 lg:flex-col lg:overflow-y-auto">
      <button v-for="(photo, index) in photos" :key="photo" type="button" :aria-label="`Показать фото ${index + 1}: ${title}`" :aria-pressed="active === photo" class="size-16 shrink-0 overflow-hidden rounded-lg border-2 bg-white p-1 transition-colors hover:border-[#9c4100] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9c4100] motion-reduce:transition-none" :class="active === photo ? 'border-[#9c4100]' : 'border-[#dfe4e8]'" @click="selected = index">
        <img :src="photo" alt="" width="64" height="64" class="h-full w-full object-contain" @error="failed.push(photo)">
      </button>
    </div>
    <figure class="relative order-1 m-0 flex aspect-[4/3] min-w-0 flex-1 items-center justify-center overflow-hidden rounded-xl border border-[#e0e5e8] bg-white lg:order-2">
      <img v-if="active" :src="active" :alt="`${title} — фото ${photos.indexOf(active) + 1}`" width="960" height="720" fetchpriority="high" class="h-full w-full object-contain p-4" @error="failed.push(active)">
      <p v-else class="px-6 text-center text-sm text-[#55616b]">Фотографии уточняйте у менеджера</p>
      <figcaption v-if="active && photos.length > 1" class="absolute right-3 bottom-3 rounded-lg bg-white px-3 py-2 text-xs text-[#55616b]" aria-live="polite">{{ photos.indexOf(active) + 1 }} / {{ photos.length }}</figcaption>
    </figure>
  </div>
</template>