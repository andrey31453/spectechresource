<script setup lang="ts">
import type { CategoryCardDto } from "~/types/catalog";

defineProps<{
  categories: CategoryCardDto[];
  citySlug: string;
}>();

/** На карточке показываем первые виды; остальные доступны на странице раздела. */
const VISIBLE_TYPES = 4;

const number = (index: number) => String(index + 1).padStart(2, "0");
</script>

<template>
  <div class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <article
      v-for="(category, index) in categories"
      :key="category.slug"
      class="flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface p-5 transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-card"
    >
      <NuxtLink
        v-if="category.image"
        :to="categoryPath(category.slug)"
        class="-mx-5 -mt-5 mb-4 block overflow-hidden bg-line"
        tabindex="-1"
        aria-hidden="true"
      >
        <img
          :src="category.image"
          :alt="category.title"
          loading="lazy"
          width="640"
          height="360"
          class="aspect-[16/9] w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
        >
      </NuxtLink>

      <span aria-hidden="true" class="font-mono text-xs font-semibold tracking-[0.18em] text-brand">
        {{ number(index) }}
      </span>

      <h3
        class="mt-3 text-[clamp(1.1rem,2vw,1.4rem)] leading-snug font-bold tracking-tight text-ink"
      >
        <NuxtLink :to="categoryPath(category.slug)" class="transition-colors hover:text-brand">
          {{ category.title }}
        </NuxtLink>
      </h3>

      <p v-if="category.shortDesc" class="mt-2 text-sm leading-relaxed text-muted">
        {{ category.shortDesc }}
      </p>

      <ul v-if="category.types.length" class="mt-4 space-y-1.5">
        <li v-for="type in category.types.slice(0, VISIBLE_TYPES)" :key="type.slug">
          <NuxtLink
            :to="typePath(type.slug, citySlug)"
            class="flex items-start gap-2 text-sm text-muted transition-colors hover:text-brand"
          >
            <span aria-hidden="true" class="mt-[0.45rem] h-1 w-1 shrink-0 rounded-full bg-brand/50" />
            <span class="min-w-0 flex-1">{{ type.name }}</span>
            <span class="shrink-0 text-right text-xs leading-5 font-medium text-brand">
              {{ formatPriceShort(type.priceFrom, type.priceUnit) }}
            </span>
          </NuxtLink>
        </li>
      </ul>

      <p v-if="category.types.length > VISIBLE_TYPES" class="mt-2 text-xs text-muted">
        ещё {{ category.types.length - VISIBLE_TYPES }}
        {{ pluralRu(category.types.length - VISIBLE_TYPES, ["вид", "вида", "видов"]) }}
      </p>

      <div class="mt-auto pt-6">
        <NuxtLink
          :to="categoryPath(category.slug)"
          class="flex items-center justify-between gap-3 border-t border-line pt-4 text-xs text-muted transition-colors hover:text-brand"
        >
          <span>
            {{ category.types.length }}
            {{ pluralRu(category.types.length, ["вид", "вида", "видов"]) }}
          </span>
          <span class="flex items-center gap-2">
            <span class="sr-only">Смотреть раздел</span>
            <SiteIcon name="arrow" class="h-4 w-4 text-brand" />
          </span>
        </NuxtLink>
      </div>
    </article>
  </div>
</template>
