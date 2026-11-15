<script setup lang="ts">
import type { ServiceCardDto } from "~/types/catalog";

const { data: site } = await useSite();
const { data: services, error } = await useFetch<ServiceCardDto[]>("/api/services", {
  key: "services",
});
throwIfError(error.value);

const city = computed(() => site.value?.city ?? { slug: "moskva", name: "Москва", nameIn: "Москве" });

usePageSeo({
  title: `Услуги — аренда спецтехники в ${city.value.nameIn}`,
  description: `Услуги при аренде спецтехники в ${city.value.nameIn}: земляные работы, вывоз грунта, демонтаж, планировка участка, перевозка техники тралом.`,
  path: "/uslugi",
});
</script>

<template>
  <div>
    <Breadcrumbs :items="[{ name: 'Главная', path: '/' }, { name: 'Услуги' }]" />

    <h1>Услуги</h1>
    <p class="lead">
      Техника работает под задачу: от выемки грунта до перевозки на объект. Стоимость услуги считаем
      после уточнения объёма и сроков.
    </p>

    <ul class="grid" style="margin-top: 20px">
      <li v-for="service in services ?? []" :key="service.slug">
        <NuxtLink :to="servicePath(service.slug)" class="card">
          <span class="card__title">{{ service.title }}</span>
          <span v-if="service.description" class="card__meta">{{ service.description }}</span>
        </NuxtLink>
      </li>
    </ul>

    <CtaBlock v-if="site" :phone="site.phone" />
  </div>
</template>
