<script setup lang="ts">
/**
 * Полоса условий под первым экраном (бриф §3.3): сухие условия сделки,
 * не преимущества. Значения должны совпадать с договором и таблицей §3.10.
 */
const conditions = [
  { icon: "clock", title: "Смена 8 часов", text: "Час сверх смены — по часовому тарифу." },
  { icon: "gear", title: "Минимальный заказ", text: "От 4 часов; для тяжёлой техники — от смены." },
  { icon: "truck", title: "Доставка тралом", text: "По Москве и области, стоимость считаем по адресу." },
  { icon: "docs", title: "Договор и документы", text: "Счёт, УПД, акты, путевые листы. С НДС или без." },
];
</script>

<template>
  <section aria-label="Условия аренды" class="border-t border-line-dark bg-void">
    <div class="mx-auto max-w-site px-5 py-[clamp(1.5rem,3.2vw,2.5rem)] md:px-8">
      <ul class="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
        <li v-for="item in conditions" :key="item.title" class="flex items-start gap-3">
          <SiteIcon
            :name="item.icon"
            class="mt-0.5 h-[1.6rem] w-[1.6rem] shrink-0 text-brand-light"
          />
          <span>
            <span class="block text-[0.95rem] leading-tight font-bold text-snow">
              {{ item.title }}
            </span>
            <span class="mt-1 block text-[0.82rem] leading-relaxed text-mist">{{ item.text }}</span>
          </span>
        </li>
      </ul>
    </div>
  </section>
</template>