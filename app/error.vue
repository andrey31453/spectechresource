<script setup lang="ts">
import type { NuxtError } from "#app";

const props = defineProps<{ error: NuxtError }>();

const statusCode = computed(() => props.error.statusCode ?? 500);
const title = computed(() =>
  statusCode.value === 404 ? "Страница не найдена" : "Не удалось открыть страницу",
);

useSeoMeta({
  title: `${title.value} (${statusCode.value})`,
  robots: "noindex, nofollow",
});

function goHome() {
  clearError({ redirect: "/" });
}
</script>

<template>
  <div class="container">
    <div class="error-page">
      <p class="error-page__code">{{ statusCode }}</p>
      <h1>{{ title }}</h1>
      <p class="lead">
        {{
          statusCode === 404
            ? "Возможно, адрес устарел или в ссылке опечатка. Откройте каталог — там все виды техники."
            : "Мы уже разбираемся. Попробуйте обновить страницу или позвоните нам."
        }}
      </p>
      <p style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap">
        <button type="button" class="button" @click="goHome">На главную</button>
        <NuxtLink to="/katalog" class="button button--ghost">Каталог техники</NuxtLink>
      </p>
    </div>
  </div>
</template>
