<script setup lang="ts">
import type { FaqDto } from "~/types/catalog";

const props = withDefaults(
  defineProps<{
    items: FaqDto[];
    /** Уникальный ключ JSON-LD, если на странице несколько FAQ-блоков. */
    schemaKey?: string;
    withSchema?: boolean;
  }>(),
  { schemaKey: "faq", withSchema: true },
);

if (props.withSchema && props.items.length) {
  useJsonLd(props.schemaKey, {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: props.items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  });
}

/** Порядковый номер вопроса: 01, 02, … */
const number = (index: number) => String(index + 1).padStart(2, "0");
</script>

<template>
  <ul v-if="items.length" class="grid gap-3">
    <li v-for="(item, index) in items" :key="item.question">
      <details
        class="group rounded-card border border-line bg-surface transition-colors hover:border-brand/40 open:border-brand/50"
      >
        <summary
          class="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden sm:text-base"
        >
          <span class="flex items-baseline gap-3">
            <span aria-hidden="true" class="font-mono text-xs font-semibold text-brand">
              {{ number(index) }}
            </span>
            {{ item.question }}
          </span>
          <SiteIcon
            name="chevron"
            class="h-4 w-4 shrink-0 text-brand transition-transform group-open:rotate-180"
          />
        </summary>
        <p class="border-t border-line px-5 py-4 text-sm leading-relaxed text-muted">
          {{ item.answer }}
        </p>
      </details>
    </li>
  </ul>
</template>
