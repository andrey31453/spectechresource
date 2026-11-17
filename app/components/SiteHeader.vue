<script setup lang="ts">
import type { SiteDto } from "~/types/catalog";

defineProps<{
  site: SiteDto;
  categories: Array<{ slug: string; title: string }>;
}>();

/** Ссылка в навигации: приглушённый цвет, бренд на наведении, без подчёркивания. */
const navLink = "whitespace-nowrap text-muted transition-colors hover:text-brand hover:no-underline";
const navLinkStrong = "whitespace-nowrap font-semibold text-ink transition-colors hover:text-brand hover:no-underline";
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
    <div class="mx-auto flex max-w-site flex-wrap items-center justify-between gap-3 px-4 py-3">
      <NuxtLink to="/" class="group flex flex-col leading-tight hover:no-underline">
        <span class="text-base font-bold tracking-tight text-ink transition-colors group-hover:text-brand">
          {{ site.companyName }}
        </span>
        <span class="text-xs text-muted">аренда спецтехники</span>
      </NuxtLink>

      <div class="hidden items-center gap-6 md:flex">
        <div class="flex flex-col items-end leading-tight">
          <a
            :href="telHref(site.phone)"
            class="text-lg font-bold whitespace-nowrap text-ink transition-colors hover:text-brand hover:no-underline"
          >
            {{ site.phone }}
          </a>
          <span v-if="site.workingHours" class="text-xs text-muted">{{ site.workingHours }}</span>
        </div>

        <a
          v-if="site.email"
          :href="`mailto:${site.email}`"
          class="text-sm text-muted transition-colors hover:text-brand"
        >
          {{ site.email }}
        </a>
      </div>

      <a
        :href="telHref(site.phone)"
        class="inline-flex items-center rounded-field bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark hover:no-underline md:hidden"
      >
        Позвонить
      </a>
    </div>

    <nav aria-label="Каталог и разделы сайта" class="hidden border-t border-line md:block">
      <div class="mx-auto flex max-w-site flex-wrap items-center gap-x-5 gap-y-1 px-4 py-2 text-sm">
        <NuxtLink to="/katalog" :class="navLinkStrong">Каталог</NuxtLink>
        <NuxtLink
          v-for="category in categories"
          :key="category.slug"
          :to="categoryPath(category.slug)"
          :class="navLink"
        >
          {{ category.title }}
        </NuxtLink>
        <NuxtLink to="/uslugi" :class="['ml-auto', navLinkStrong]">Услуги</NuxtLink>
        <NuxtLink to="/kontakty" :class="navLinkStrong">Контакты</NuxtLink>
      </div>
    </nav>

    <details class="group border-t border-line md:hidden">
      <summary
        class="mx-auto flex max-w-site cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden"
      >
        Меню
        <span aria-hidden="true" class="text-muted transition-transform group-open:rotate-180">▾</span>
      </summary>

      <nav aria-label="Мобильное меню" class="mx-auto max-w-site px-4 pb-3">
        <ul class="flex flex-col divide-y divide-line text-sm">
          <li>
            <NuxtLink to="/katalog" class="block py-2 font-semibold text-ink">Каталог</NuxtLink>
          </li>
          <li v-for="category in categories" :key="category.slug">
            <NuxtLink :to="categoryPath(category.slug)" class="block py-2 pl-3 text-muted">
              {{ category.title }}
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/uslugi" class="block py-2 font-semibold text-ink">Услуги</NuxtLink>
          </li>
          <li>
            <NuxtLink to="/kontakty" class="block py-2 font-semibold text-ink">Контакты</NuxtLink>
          </li>
        </ul>
      </nav>
    </details>
  </header>
</template>
