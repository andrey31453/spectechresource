<script setup lang="ts">
/** Оболочка админки: без шапки и подвала сайта, но с закрытием от индексации. */
useSeoMeta({
  robots: "noindex, nofollow",
});

const route = useRoute();

// Каталог, журнал заявок, настройки и редактор страниц — таблицы и формы в несколько колонок,
// им тесно в узкой колонке входа.
const wide = computed(
  () =>
    route.path.startsWith("/admin/catalog") ||
    route.path.startsWith("/admin/leads") ||
    route.path.startsWith("/admin/pages") ||
    route.path.startsWith("/admin/settings"),
);
</script>

<template>
  <div class="admin-shell">
    <header class="admin-shell__bar">
      <NuxtLink to="/admin" class="admin-shell__brand">СПЕЦТЕХРЕСУРС · админка</NuxtLink>
      <nav class="admin-shell__nav" aria-label="Разделы админки">
        <NuxtLink to="/admin/leads" class="admin-shell__link">Заявки</NuxtLink>
        <NuxtLink to="/admin/catalog" class="admin-shell__link">Каталог</NuxtLink>
        <NuxtLink to="/admin/pages" class="admin-shell__link">Страницы</NuxtLink>
        <NuxtLink to="/admin/settings" class="admin-shell__link">Настройки</NuxtLink>
        <NuxtLink to="/" class="admin-shell__link">На сайт</NuxtLink>
      </nav>
    </header>

    <main :class="['admin-shell__main', { 'admin-shell__main--wide': wide }]">
      <slot />
    </main>
  </div>
</template>
