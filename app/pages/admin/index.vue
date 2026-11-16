<script setup lang="ts">
import type { AdminUserDto } from "~/types/admin";

definePageMeta({ layout: "admin" });

useSeoMeta({
  title: "Админка",
  robots: "noindex, nofollow",
});

const requestFetch = useRequestFetch();

// SSR-запрос уходит с cookie текущего запроса, поэтому пользователь известен сразу при рендере.
const { data } = await useAsyncData("admin-me", () => requestFetch<{ user: AdminUserDto }>("/api/admin/me"));

const user = computed(() => data.value?.user ?? null);

if (!user.value) {
  await navigateTo("/admin/login");
}

async function logout() {
  await $fetch("/api/admin/logout", { method: "POST" });
  await navigateTo("/admin/login");
}
</script>

<template>
  <div v-if="user" class="admin-dashboard">
    <h1 class="admin-dashboard__title">Здравствуйте{{ user.name ? `, ${user.name}` : "" }}</h1>
    <p class="admin-dashboard__meta">
      Вы вошли как <strong>{{ user.email }}</strong>. Сессия хранится в базе,
      её можно отозвать — выход ниже удаляет её сразу.
    </p>

    <div class="admin-dashboard__actions">
      <button type="button" class="button button--ghost" @click="logout">Выйти</button>
    </div>

    <section class="admin-dashboard__todo">
      <h2>Разделы</h2>
      <p>
        <NuxtLink to="/admin/leads"><strong>Заявки</strong></NuxtLink> — журнал: фильтры по статусу и датам,
        поиск по контактам, карточка заявки с повтором отправки в Битрикс24 и выгрузка в CSV.
      </p>
      <p>
        <NuxtLink to="/admin/catalog"><strong>Каталог</strong></NuxtLink> — разделы, виды техники, модели,
        характеристики и цены. Изменения сразу видны на сайте.
      </p>
      <p>
        <NuxtLink to="/admin/settings"><strong>Настройки</strong></NuxtLink> — телефон и мессенджеры, адрес,
        реквизиты, счётчик Метрики и города. Изменения сразу видны на сайте.
      </p>
      <p>Страницы, услуги и контентные блоки — следующие слайсы, план в <code>TODO.md</code> в корне проекта.</p>
    </section>
  </div>
</template>
