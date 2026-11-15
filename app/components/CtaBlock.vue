<script setup lang="ts">
withDefaults(
  defineProps<{
    phone: string;
    title?: string;
    text?: string;
  }>(),
  {
    title: "Нужна техника под задачу?",
    text: "Позвоните — подберём машину, посчитаем смену и сроки подачи.",
  },
);
</script>

<template>
  <div class="cta">
    <div>
      <p style="margin: 0"><strong>{{ title }}</strong></p>
      <p v-if="text" class="muted" style="margin: 4px 0 0">{{ text }}</p>
    </div>
    <div style="display: flex; gap: 10px; flex-wrap: wrap">
      <a :href="telHref(phone)" class="button">{{ phone }}</a>
      <NuxtLink to="/kontakty" class="button button--ghost">Оставить заявку</NuxtLink>
    </div>
  </div>
</template>
