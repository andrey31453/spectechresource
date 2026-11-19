<script setup lang="ts">
/**
 * Блок «Условия аренды» (бриф §3.10): две колонки — с экипажем и без.
 * Статическая таблица страницы: данные не редактируются в админке.
 */
const terms = [
  { label: "Что получаете", crew: "техника + машинист", solo: "только техника" },
  { label: "Минимальный заказ", crew: "от 4 часов, смена 8 часов", solo: "от смены" },
  { label: "Кто управляет", crew: "наш машинист", solo: "арендатор с допуском" },
  { label: "ГСМ", crew: "за счёт заказчика", solo: "за счёт заказчика" },
  { label: "Ответственность за технику", crew: "наша", solo: "арендатора" },
  { label: "Доставка", crew: "тралом, считается отдельно", solo: "тралом или самоходом" },
  { label: "Документы", crew: "путевой лист, акт", solo: "акт приёма-передачи" },
];
</script>

<template>
  <section class="bg-surface-soft">
    <div class="mx-auto max-w-site px-5 py-14 md:px-8 md:py-[84px]">
      <SectionHead
        kicker="Условия"
        title="Как устроена аренда"
        lead="Два формата: с машинистом и без. Ниже — что входит, кто отвечает за технику и как считается смена."
      />

      <div class="mt-10 overflow-x-auto rounded-card border border-line bg-surface">
        <table class="w-full min-w-[40rem] border-collapse text-left text-sm">
          <caption class="sr-only">
            Условия аренды спецтехники с экипажем и без экипажа
          </caption>
          <thead>
            <tr class="bg-surface-soft text-xs tracking-[0.16em] text-muted uppercase">
              <th scope="col" class="px-4 py-3 font-semibold">Условие</th>
              <th scope="col" class="px-4 py-3 font-semibold">С экипажем</th>
              <th scope="col" class="px-4 py-3 font-semibold">Без экипажа</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in terms" :key="row.label" class="border-t border-line">
              <th scope="row" class="px-4 py-3 align-top font-semibold text-ink">
                {{ row.label }}
              </th>
              <td class="px-4 py-3 align-top text-muted">{{ row.crew }}</td>
              <td class="px-4 py-3 align-top text-muted">{{ row.solo }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p class="mt-4 text-xs leading-relaxed text-muted">
        Без экипажа сдаём не всю технику: гусеничные экскаваторы и тяжёлые краны — только с машинистом.
        Уточняйте по конкретному виду.
      </p>
    </div>
  </section>
</template>