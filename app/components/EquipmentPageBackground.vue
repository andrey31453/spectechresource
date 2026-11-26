<script setup lang="ts">
import { equipmentBackgrounds } from "~/utils/equipment-backgrounds";

const route = useRoute();
// Nuxt передаёт серверный выбор в payload: при гидратации схема не меняется.
const selected = useState<number>(`equipment-background:${route.path}`, () => Math.floor(Math.random() * equipmentBackgrounds.length));
const scheme = computed(() => equipmentBackgrounds[selected.value]!);
</script>

<template>
  <div data-equipment-background :data-scheme="scheme.name" aria-hidden="true" class="pointer-events-none absolute inset-0 -z-10 overflow-hidden select-none">
    <div class="absolute inset-0 bg-[radial-gradient(circle,#0d12140c_1px,transparent_1.1px)] bg-size-[22px_22px] mask-[linear-gradient(180deg,transparent,black_8%,black_92%,transparent)]" />
    <svg viewBox="0 0 560 560" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" focusable="false" class="absolute top-[62.5%] right-0 size-[320px] -translate-y-1/2 opacity-[0.12] md:size-[460px] xl:size-[560px]">
      <g stroke="#93a0ab">
        <circle cx="280" cy="280" r="254" />
        <circle cx="280" cy="280" r="198" stroke-dasharray="3 11" />
      </g>
      <path :d="scheme.path" stroke="#55616b" />
      <path :d="scheme.accent" stroke="#ff7a2f" stroke-width="2.4" />
      <path d="M450 120h36M468 102v36M100 430h24M112 418v24" stroke="#ff7a2f" />
      <circle cx="280" cy="280" r="5" fill="#ff7a2f" />
    </svg>
  </div>
</template>