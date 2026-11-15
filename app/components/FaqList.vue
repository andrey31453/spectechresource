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
</script>

<template>
  <ul v-if="items.length" class="faq">
    <li v-for="item in items" :key="item.question">
      <details>
        <summary>{{ item.question }}</summary>
        <p>{{ item.answer }}</p>
      </details>
    </li>
  </ul>
</template>
