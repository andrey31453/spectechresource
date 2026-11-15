<script setup lang="ts">
import type { CategoryCardDto } from "~/types/catalog";

defineProps<{
  categories: CategoryCardDto[];
  citySlug: string;
}>();
</script>

<template>
  <div class="section">
    <section v-for="category in categories" :id="category.slug" :key="category.slug" class="section">
      <h2>
        <NuxtLink :to="categoryPath(category.slug)">{{ category.title }}</NuxtLink>
      </h2>
      <p v-if="category.shortDesc" class="lead">{{ category.shortDesc }}</p>

      <ul class="grid">
        <li v-for="type in category.types" :key="type.slug">
          <NuxtLink :to="typePath(type.slug, citySlug)" class="card">
            <span class="card__title">{{ type.name }}</span>
            <span class="card__meta">{{ formatPriceFrom(type.priceFrom, type.priceUnit) }}</span>
          </NuxtLink>
        </li>
      </ul>
    </section>
  </div>
</template>
