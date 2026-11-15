<script setup lang="ts">
import type { SiteDto } from "~/types/catalog";

defineProps<{
  site: SiteDto;
  categories: Array<{ slug: string; title: string }>;
}>();
</script>

<template>
  <header class="site-header">
    <div class="container site-header__top">
      <NuxtLink to="/" class="site-header__brand">{{ site.companyName }}</NuxtLink>

      <div class="site-header__contacts">
        <a :href="telHref(site.phone)" class="site-header__phone">{{ site.phone }}</a>
        <span v-if="site.workingHours" class="muted">{{ site.workingHours }}</span>
        <a v-if="site.email" :href="`mailto:${site.email}`">{{ site.email }}</a>
      </div>
    </div>

    <nav class="site-nav" aria-label="Каталог и разделы сайта">
      <div class="container">
        <ul>
          <li><NuxtLink to="/katalog">Каталог</NuxtLink></li>
          <li v-for="category in categories" :key="category.slug">
            <NuxtLink :to="categoryPath(category.slug)">{{ category.title }}</NuxtLink>
          </li>
          <li><NuxtLink to="/uslugi">Услуги</NuxtLink></li>
          <li><NuxtLink to="/kontakty">Контакты</NuxtLink></li>
        </ul>
      </div>
    </nav>
  </header>
</template>
