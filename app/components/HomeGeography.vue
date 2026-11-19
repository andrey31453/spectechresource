<script setup lang="ts">
/**
 * Блок «География» (бриф §3.13). Города — статический список страницы;
 * город самого сайта берётся из настроек и здесь не дублируется.
 */
const geography = [
  "Москва",
  "Новая Москва",
  "Химки",
  "Мытищи",
  "Балашиха",
  "Подольск",
  "Домодедово",
  "Одинцово",
];
</script>

<template>
  <section class="bg-concrete">
    <div class="mx-auto max-w-site px-5 py-14 md:px-8 md:py-[84px]">
      <SectionHead
        kicker="География"
        title="Работаем в Москве и области"
        lead="Доставляем технику тралом или самоходом. Стоимость доставки зависит от адреса, габаритов машины и времени подачи — считаем по заявке."
      />

      <ul class="mt-8 flex flex-wrap gap-2">
        <li
          v-for="place in geography"
          :key="place"
          class="rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink"
        >
          {{ place }}
        </li>
      </ul>

      <p class="mt-6 text-sm leading-relaxed text-muted">
        Дальние направления и негабарит — по согласованию.
        <NuxtLink to="/kontakty" class="font-semibold text-brand underline underline-offset-2">
          Напишите в контактах
        </NuxtLink>
        — посчитаем доставку и подачу.
      </p>
    </div>
  </section>
</template>