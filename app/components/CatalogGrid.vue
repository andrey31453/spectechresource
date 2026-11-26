<script setup lang="ts">
import type { CatalogTypeDto } from "~/types/catalog";

defineProps<{ types: CatalogTypeDto[]; citySlug: string }>();
const number = (index: number) => String(index + 1).padStart(2, "0");
</script>

<template>
  <div class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <article v-for="(type, index) in types" :key="type.slug" class="flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface p-5 transition-colors hover:border-brand">
      <NuxtLink v-if="type.image" :to="typePath(type.slug, citySlug)" class="-mx-5 -mt-5 mb-4 block overflow-hidden bg-line" tabindex="-1" aria-hidden="true">
        <img :src="type.image" :alt="type.name" loading="lazy" width="640" height="360" class="aspect-[16/9] w-full object-cover">
      </NuxtLink>
      <span aria-hidden="true" class="font-mono text-xs font-semibold tracking-[0.18em] text-brand">{{ number(index) }}</span>
      <h2 class="mt-3 text-[clamp(1.1rem,2vw,1.4rem)] leading-snug font-bold tracking-tight text-ink">
        <NuxtLink :to="typePath(type.slug, citySlug)" class="inline-flex min-h-6 items-center transition-colors hover:text-brand">{{ type.name }}</NuxtLink>
      </h2>
      <p class="mt-2 text-sm leading-relaxed text-muted">Модели и характеристики</p>
      <div class="mt-auto pt-6"><span class="flex items-center justify-between border-t border-line pt-4 text-xs text-muted"><span>{{ formatPriceShort(type.priceFrom, type.priceUnit) }}</span><SiteIcon name="arrow" class="h-4 w-4 text-brand" /></span></div>
    </article>
  </div>
</template>