<script setup lang="ts">
import type { AdminContentDto } from "~/types/admin-content";

definePageMeta({ layout: "admin" });

useSeoMeta({
  title: "Контент · админка",
  robots: "noindex, nofollow",
});

const requestFetch = useRequestFetch();

// Один запрос на все блоки: вкладки переключаются без сети, после сохранения обновляем всё.
const { data, error, refresh } = await useAsyncData("admin-content", () =>
  requestFetch<AdminContentDto>("/api/admin/content"),
);
throwIfError(error.value);

const TABS = [
  { key: "faq", label: "FAQ" },
  { key: "advantages", label: "Преимущества" },
  { key: "steps", label: "Порядок работы" },
  { key: "stats", label: "Цифры доверия" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const route = useRoute();

const tab = computed<TabKey>(() => TABS.find((item) => item.key === route.query.tab)?.key ?? "faq");

const content = computed(() => data.value ?? null);

const counts = computed<Record<TabKey, number>>(() => ({
  faq: content.value?.faq.length ?? 0,
  advantages: content.value?.advantages.length ?? 0,
  steps: content.value?.steps.length ?? 0,
  stats: content.value?.stats.length ?? 0,
}));
</script>

<template>
  <div class="admin-page">
    <div class="admin-page__head">
      <div>
        <h1 class="admin-page__title">Контент</h1>
        <p class="admin-page__lead">
          Блоки главной и вопросы для страниц видов и услуг. Публичные страницы читают
          PostgreSQL на каждый запрос — сохранение видно на сайте сразу.
        </p>
      </div>
      <div class="admin-page__actions">
        <NuxtLink to="/" class="button button--ghost">Открыть главную</NuxtLink>
      </div>
    </div>

    <nav class="admin-tabs" aria-label="Разделы контента">
      <NuxtLink
        v-for="item in TABS"
        :key="item.key"
        :to="{ path: '/admin/content', query: { tab: item.key } }"
        :class="['admin-tab', { 'admin-tab--active': tab === item.key }]"
      >
        {{ item.label }}
        <span class="admin-badge">{{ counts[item.key] }}</span>
      </NuxtLink>
    </nav>

    <template v-if="content">
      <AdminFaqSection
        v-if="tab === 'faq'"
        :items="content.faq"
        :services="content.services"
        :types="content.types"
        @saved="refresh"
      />
      <AdminAdvantagesSection
        v-else-if="tab === 'advantages'"
        :items="content.advantages"
        @saved="refresh"
      />
      <AdminWorkStepsSection
        v-else-if="tab === 'steps'"
        :items="content.steps"
        @saved="refresh"
      />
      <AdminTrustStatsSection v-else :items="content.stats" @saved="refresh" />
    </template>
  </div>
</template>
