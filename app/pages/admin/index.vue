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
      <h2>Что появится дальше</h2>
      <p>
        Разделы админки (каталог, заявки, страницы) подключаются следующими слайсами — план и статусы
        в <code>TODO.md</code> в корне проекта.
      </p>
    </section>
  </div>
</template>
