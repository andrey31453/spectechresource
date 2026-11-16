<script setup lang="ts">
import type { AdminPageDto } from "~/types/admin-pages";

definePageMeta({ layout: "admin" });

useSeoMeta({
  title: "Новая страница · админка",
  robots: "noindex, nofollow",
});

/** После создания открываем редактор этой же страницы: дальше правки идут в неё, а не в новую. */
async function onSaved(page: AdminPageDto) {
  await navigateTo(`/admin/pages/${page.id}`);
}
</script>

<template>
  <div class="admin-page">
    <div class="admin-page__head">
      <div>
        <div class="admin-breadcrumbs">
          <NuxtLink to="/admin">Админка</NuxtLink>
          <span>/</span>
          <NuxtLink to="/admin/pages">Страницы</NuxtLink>
          <span>/</span>
          <span>Новая</span>
        </div>
        <h1 class="admin-page__title">Новая страница</h1>
        <p class="admin-page__lead">
          Адрес страницы — корневой: <code>/politika-obrabotki-personalnyh-dannyh</code>.
          Коды разделов сайта (<code>katalog</code>, <code>uslugi</code>, <code>kontakty</code>)
          заняты — форма их не примет.
        </p>
      </div>
    </div>

    <AdminPageForm mode="create" @saved="onSaved" />
  </div>
</template>
