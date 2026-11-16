<script setup lang="ts">
/** Оболочка админки: без шапки и подвала сайта, но с закрытием от индексации. */
useSeoMeta({
  robots: "noindex, nofollow",
});
</script>

<template>
  <div class="admin-shell">
    <header class="admin-shell__bar">
      <NuxtLink to="/admin" class="admin-shell__brand">СПЕЦТЕХРЕСУРС · админка</NuxtLink>
      <NuxtLink to="/" class="admin-shell__link">На сайт</NuxtLink>
    </header>

    <main class="admin-shell__main">
      <slot />
    </main>
  </div>
</template>
