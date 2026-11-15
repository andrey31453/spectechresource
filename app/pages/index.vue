<script setup lang="ts">
import type { HomeDto } from "~/types/catalog";

const { data: site } = await useSite();
const { data: home, error } = await useFetch<HomeDto>("/api/home", { key: "home" });
throwIfError(error.value);

const city = computed(() => site.value?.city ?? { slug: "moskva", name: "Москва", nameIn: "Москве" });
const companyName = computed(() => site.value?.companyName ?? "ООО «СПЕЦТЕХРЕСУРС»");

const totalTypes = computed(() =>
  (home.value?.categories ?? []).reduce((sum, category) => sum + category.types.length, 0),
);

usePageSeo({
  title: `Аренда спецтехники в ${city.value.nameIn} — ${companyName.value}`,
  description: `Аренда спецтехники для строительных, дорожных и коммунальных работ в ${city.value.nameIn}: ${totalTypes.value} видов техники, договор с юрлицами, подача от 4 часов.`,
  path: "/",
});
</script>

<template>
  <div v-if="home && site">
    <h1>Аренда спецтехники в {{ city.nameIn }}</h1>
    <p class="lead">
      {{ totalTypes }} видов техники для земляных, дорожных, погрузочных и коммунальных работ.
      Работаем с юридическими лицами по договору, техника подаётся с экипажем.
    </p>

    <CtaBlock :phone="site.phone" />

    <ul v-if="home.stats.length" class="stats" style="margin-top: 24px">
      <li v-for="stat in home.stats" :key="stat.label" class="stat">
        <span class="stat__value">{{ stat.value }}</span>
        <span v-if="stat.unit" class="muted"> {{ stat.unit }}</span>
        <div class="muted">{{ stat.label }}</div>
      </li>
    </ul>

    <section class="section" style="margin-top: 32px">
      <h2>Каталог спецтехники</h2>
      <CatalogGrid :categories="home.categories" :city-slug="city.slug" />
    </section>

    <section v-if="home.services.length" class="section">
      <h2>Услуги</h2>
      <ul class="grid">
        <li v-for="service in home.services" :key="service.slug">
          <NuxtLink :to="servicePath(service.slug)" class="card">
            <span class="card__title">{{ service.title }}</span>
            <span v-if="service.description" class="card__meta">{{ service.description }}</span>
          </NuxtLink>
        </li>
      </ul>
    </section>

    <section v-if="home.advantages.length" class="section">
      <h2>Почему работают с нами</h2>
      <ul class="grid">
        <li v-for="item in home.advantages" :key="item.title" class="card">
          <span class="card__title">{{ item.title }}</span>
          <span v-if="item.text" class="card__meta">{{ item.text }}</span>
        </li>
      </ul>
    </section>

    <section v-if="home.steps.length" class="section">
      <h2>Как заказать технику</h2>
      <ol>
        <li v-for="step in home.steps" :key="step.title">
          <strong>{{ step.title }}</strong>
          <template v-if="step.text"> — {{ step.text }}</template>
        </li>
      </ol>
    </section>

    <section v-if="home.faq.length" class="section">
      <h2>Вопросы и ответы</h2>
      <FaqList :items="home.faq" />
    </section>

    <CtaBlock :phone="site.phone" title="Не нашли нужную технику?" text="Позвоните — подберём аналог из парка или найдём машину под задачу." />

    <p class="muted" style="margin-top: 16px">{{ site.priceDisclaimer }}</p>
  </div>
</template>
