<script setup lang="ts">
/**
 * Блок «Парк и база» (бриф §3.8): цифры доверия из админки (СОТ-блок)
 * плюс короткий текст о собственной технике и базе.
 */
defineProps<{
  stats: Array<{ value: string; unit: string | null; label: string }>;
}>();

const base = [
  "Собственный парк: машину не ищем у посредников в день подачи.",
  "Техника закреплена за машинистами — один экипаж на машину.",
  "Документы готовим заранее: договор, счёт, УПД и путевой лист.",
];
</script>

<template>
  <section class="bg-concrete">
    <div class="mx-auto max-w-site px-5 py-14 md:px-8 md:py-[84px]">
      <SectionHead
        kicker="О компании"
        title="Парк и база"
        lead="Техника закреплена за машинистами: состояние и сроки подачи предсказуемы. Обслуживание и замену машин фиксируем в договоре."
      />

      <ul v-if="stats.length" class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <li
          v-for="stat in stats"
          :key="stat.label"
          class="rounded-card border border-line bg-surface px-5 py-6"
        >
          <span class="flex items-baseline gap-1.5">
            <span class="font-mono text-[clamp(1.6rem,3vw,2.2rem)] font-bold text-ink">
              {{ stat.value }}
            </span>
            <span v-if="stat.unit" class="font-mono text-sm font-semibold text-brand">
              {{ stat.unit }}
            </span>
          </span>
          <span class="mt-2 block text-sm leading-relaxed text-muted">{{ stat.label }}</span>
        </li>
      </ul>

      <ul class="mt-8 grid gap-3 text-sm leading-relaxed text-muted lg:max-w-4xl">
        <li v-for="item in base" :key="item" class="flex items-start gap-2.5">
          <SiteIcon name="check" class="mt-0.5 h-4 w-4 shrink-0 text-brand" />
          <span>{{ item }}</span>
        </li>
      </ul>
    </div>
  </section>
</template>