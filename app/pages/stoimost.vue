<script setup lang="ts">
import type { HomeDto } from "~/types/catalog";
import { formatPrice } from "~/utils/price";
import { groupModelsByType } from "~/utils/prices";
import { modelPath, typePath } from "~/utils/routes";

const { data: site } = await useSite();
const { data: home } = await useAsyncData<HomeDto>("prices-page", () => $fetch<HomeDto>("/api/home"), {
  default: () => ({ categories: [], models: [], services: [], advantages: [], steps: [], stats: [], faq: [] }),
});
const modelsByType = computed(() => groupModelsByType(home.value?.models ?? []));

const city = computed(() => site.value?.city.nameIn ?? "Москве");
usePageSeo({
  title: `Стоимость аренды спецтехники в ${city.value} — цены на модели`,
  description: `Цены на аренду моделей спецтехники в ${city.value}: стоимость за час и смену. Если тариф не указан, уточните цену у менеджера.`,
  path: "/stoimost",
});
</script>

<template>
  <div>
    <SiteBreadcrumbs :items="[{ name: 'Главная', path: '/' }, { name: 'Стоимость' }]" />
    <h1>Стоимость аренды спецтехники</h1>
    <p class="lead">Цены на конкретные модели сгруппированы по видам техники. Тариф зависит от комплектации, срока и адреса подачи.</p>

    <div v-if="modelsByType.length" class="mt-8 space-y-10">
      <section v-for="type in modelsByType" :key="type.slug" :aria-labelledby="`price-${type.slug}`">
        <h2 :id="`price-${type.slug}`" class="mb-4 mt-0 text-xl font-bold">
          <NuxtLink :to="typePath(type.slug)">{{ type.name }}</NuxtLink>
        </h2>
        <div class="overflow-x-auto rounded-card border border-line">
          <table class="w-full min-w-[36rem] table-fixed border-collapse text-left text-sm">
            <colgroup>
              <col class="w-1/2">
              <col class="w-1/4">
              <col class="w-1/4">
            </colgroup>
            <thead class="bg-surface-soft text-muted">
              <tr><th class="p-3 font-semibold">Модель</th><th class="p-3 font-semibold">За час</th><th class="p-3 font-semibold">За смену</th></tr>
            </thead>
            <tbody>
              <tr v-for="model in type.models" :key="model.id" class="border-t border-line">
                <td class="p-3"><NuxtLink :to="modelPath(model.typeSlug, model.slug)">{{ model.brand }} {{ model.model }}</NuxtLink></td>
                <td class="p-3">{{ model.pricePerHour ? formatPrice(model.pricePerHour) : 'По запросу' }}</td>
                <td class="p-3">{{ model.pricePerShift ? formatPrice(model.pricePerShift) : 'По запросу' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
    <p v-else class="mt-6 rounded-card border border-line bg-surface p-5 text-muted">Цены и модели уточняйте у менеджера — каталог моделей пока не опубликован.</p>
    <p class="mt-8 text-sm text-muted">{{ site?.priceDisclaimer ?? 'Стоимость и наличие подтверждает менеджер.' }}</p>
    <CtaBlock v-if="site" :phone="site.phone" title="Нужен точный расчёт?" text="Уточним тариф, сроки и стоимость доставки до объекта." />
  </div>
</template>