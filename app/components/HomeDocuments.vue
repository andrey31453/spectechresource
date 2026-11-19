<script setup lang="ts">
/**
 * Блок «Документы и гарантии» (бриф §3.12). Списки статические: это обещания
 * компании, а не контент из админки. Формулировки о ТО, простое и подмене —
 * обязательства: публикуем после сверки с договором (открытый вопрос брифа).
 */
const documents = [
  "Договор аренды или оказания услуг",
  "Заявка-спецификация с техникой, сроками и стоимостью",
  "Счёт на оплату",
  "УПД",
  "Акт выполненных работ",
  "Путевые листы",
  "Карточка предприятия и реквизиты для тендера",
];

const guarantees = [
  "Техника проходит ТО и проверку перед каждой подачей",
  "При поломке не по вине заказчика подаём резервную машину",
  "Простой по нашей вине не оплачивается",
  "Машинисты с удостоверениями и допусками",
  "Условия подмены и ответственности фиксируются в договоре",
];
</script>

<template>
  <section class="bg-surface">
    <div class="mx-auto max-w-site px-5 py-14 md:px-8 md:py-[84px]">
      <SectionHead
        kicker="Документы"
        title="Договор, документы и гарантии"
        lead="Работаем с юрлицами и ИП: полный пакет закрывающих документов и понятная ответственность по договору."
      />

      <div class="mt-10 grid gap-4 lg:grid-cols-2">
        <div class="rounded-card border border-line bg-surface-soft p-6">
          <h3 class="text-[clamp(1.05rem,2vw,1.3rem)] font-bold text-ink">Какие документы получите</h3>
          <ul class="mt-4 grid gap-3 text-sm leading-relaxed text-muted">
            <li v-for="item in documents" :key="item" class="flex items-start gap-2.5">
              <SiteIcon name="docs" class="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <span>{{ item }}</span>
            </li>
          </ul>
        </div>

        <div class="rounded-card border border-line bg-surface-soft p-6">
          <h3 class="text-[clamp(1.05rem,2vw,1.3rem)] font-bold text-ink">
            Что гарантируем
          </h3>
          <ul class="mt-4 grid gap-3 text-sm leading-relaxed text-muted">
            <li v-for="item in guarantees" :key="item" class="flex items-start gap-2.5">
              <SiteIcon name="check" class="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <span>{{ item }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>