<script setup lang="ts">
/**
 * Шапка секции публичной страницы: моно-кикер с линией, заголовок и лид.
 * Уровень заголовка фиксирован (h2): h1 всегда один и живёт в hero страницы.
 */
withDefaults(
  defineProps<{
    title: string;
    kicker?: string | null;
    lead?: string | null;
    /** `dark` — для тёмных полос, `light` — для светлых. */
    tone?: "dark" | "light";
  }>(),
  { kicker: null, lead: null, tone: "light" },
);
</script>

<template>
  <div>
    <span
      v-if="kicker"
      class="inline-flex items-center gap-2.5 font-mono text-[11px] font-semibold tracking-[0.22em] uppercase"
      :class="tone === 'dark' ? 'text-brand-light' : 'text-brand'"
    >
      <span
        aria-hidden="true"
        class="h-0.5 w-[26px] bg-linear-to-r"
        :class="tone === 'dark' ? 'from-brand-light to-brand' : 'from-brand to-brand-light'"
      />
      {{ kicker }}
    </span>

    <h2
      class="mb-0 text-[clamp(1.5rem,3.4vw,2.35rem)] leading-tight font-bold tracking-tight"
      :class="[kicker ? 'mt-4' : '', tone === 'dark' ? 'text-snow' : 'text-ink']"
    >
      {{ title }}
    </h2>

    <p
      v-if="lead"
      class="mt-4 mb-0 max-w-3xl text-[clamp(1rem,1.4vw,1.115rem)] leading-relaxed"
      :class="tone === 'dark' ? 'text-mist' : 'text-muted'"
    >
      {{ lead }}
    </p>
  </div>
</template>
