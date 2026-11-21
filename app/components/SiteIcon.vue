<script setup lang="ts">
/**
 * Набор линейных иконок публичных страниц (24×24, stroke = currentColor).
 * Иконки встроены в разметку: без внешних спрайтов и лишних запросов.
 * Неизвестное имя → `shield`, чтобы админские ключи не ломали вёрстку.
 */
withDefaults(
  defineProps<{
    name?: string | null;
    strokeWidth?: number;
  }>(),
  { name: "shield", strokeWidth: 1.6 },
);
</script>

<template>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <template v-if="name === 'arrow'">
      <path d="M4 12h15" />
      <path d="m13.5 6.5 5.5 5.5-5.5 5.5" />
    </template>
    <template v-else-if="name === 'chevron'">
      <path d="m6 9.5 6 6 6-6" />
    </template>
    <template v-else-if="name === 'check'">
      <path d="m4.5 12.5 5 5 10-11" />
    </template>
    <template v-else-if="name === 'phone'">
      <path d="M6.4 3.5h3l1.5 4-2 1.4a11.2 11.2 0 0 0 5.6 5.6l1.4-2 4 1.5v3a2 2 0 0 1-2.2 2A16.6 16.6 0 0 1 4.5 5.7a2 2 0 0 1 1.9-2.2z" />
    </template>
    <template v-else-if="name === 'truck'">
      <path d="M2.5 15.5V8A1.5 1.5 0 0 1 4 6.5h7v9" />
      <path d="M11 9.5h4.5L20 13v2.5" />
      <path d="M2.5 15.5h2" />
      <path d="M8 15.5h5" />
      <path d="M17 15.5h3" />
      <circle cx="6" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
      <path d="M8 18h7" />
    </template>
    <template v-else-if="name === 'excavator'">
      <rect x="3.5" y="14.5" width="10" height="4" rx="2" />
      <path d="M6.5 14.5V12h5v2.5" />
      <path d="M8 12V9.5h3V12" />
      <path d="M11.5 10.5 16 7.5" />
      <path d="M16 7.5 18.5 11" />
      <path d="M18 11h3v2.5h-3z" />
    </template>
    <template v-else-if="name === 'crane'">
      <path d="M3.5 17.5h16" />
      <circle cx="6.5" cy="18.6" r="1.5" />
      <circle cx="16.5" cy="18.6" r="1.5" />
      <path d="M5.5 17.5v-4h6v4" />
      <path d="M11.5 13.5 19.6 5" />
      <path d="M19.6 5v2" />
      <path d="M18.4 7h2.4" />
      <path d="M19.6 7v1.4a1.3 1.3 0 0 1-2.6 0" />
    </template>
    <template v-else-if="name === 'roller'">
      <circle cx="7" cy="16.5" r="3" />
      <path d="M10 16.5v-6h5.5l3 3v3" />
      <path d="M12 10.5V8h3v2.5" />
      <path d="M2.5 21h19" />
    </template>
    <template v-else-if="name === 'clock'">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3.2 2" />
    </template>
    <template v-else-if="name === 'docs'">
      <path d="M14 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V7.5z" />
      <path d="M14 3v4.5h4.5" />
      <path d="M9 12.5h6" />
      <path d="M9 16h4" />
    </template>
    <template v-else-if="name === 'helmet'">
      <path d="M4 15.5a8 8 0 0 1 16 0" />
      <path d="M10 8.4V5.5h4v2.9" />
      <path d="M2.5 15.5h19V18h-19z" />
    </template>
    <template v-else-if="name === 'gear'">
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3v2.2M12 18.8V21M4.2 7.5l1.9 1.1M17.9 15.4l1.9 1.1M4.2 16.5l1.9-1.1M17.9 8.6l1.9-1.1" />
    </template>
    <template v-else-if="name === 'mail'">
      <rect x="3" y="5.5" width="18" height="13" rx="1.8" />
      <path d="m3.8 7 8.2 6 8.2-6" />
    </template>
    <template v-else-if="name === 'pin'">
      <path d="M12 21s6.5-6 6.5-10.5a6.5 6.5 0 1 0-13 0C5.5 15 12 21 12 21z" />
      <circle cx="12" cy="10.5" r="2.4" />
    </template>
    <template v-else>
      <path d="M12 3 4.5 6v5.3c0 4.4 3.1 8.2 7.5 9.7 4.4-1.5 7.5-5.3 7.5-9.7V6z" />
      <path d="m8.8 12.2 2.3 2.3 4.4-4.7" />
    </template>
  </svg>
</template>
