<script setup lang="ts">
import type { SiteDto } from "~/types/catalog";

withDefaults(defineProps<{
  site: SiteDto;
  categories: Array<{ slug: string; title: string }>;
  services?: Array<{ slug: string; title: string }>;
  fixed?: boolean;
  active?: boolean;
}>(), { services: () => [], fixed: false, active: true });

const menuLink = "flex min-h-11 items-center px-4 py-2 text-sm text-snow transition-colors hover:text-flame2 hover:no-underline focus-visible:outline-flame";
const header = ref<HTMLElement | null>(null);
const route = useRoute();
watch(() => route.fullPath, () => {
  header.value?.querySelectorAll<HTMLDetailsElement>("details[open]").forEach(menu => { menu.open = false; });
});
function closeMenu(event: MouseEvent) {
  if (!(event.target instanceof Element) || !event.target.closest("a")) return;
  event.target.closest("details")?.removeAttribute("open");
}
</script>

<template>
  <header
    ref="header"
    class="inset-x-0 top-0 z-50 border-b border-line-dark bg-night/95 text-snow backdrop-blur transition-[opacity,transform,visibility] motion-reduce:transition-none"
    :class="[fixed ? 'fixed' : 'sticky', active ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-full opacity-0']"
    :inert="!active"
  >
    <div class="mx-auto flex max-w-site items-center justify-between gap-3 px-5 py-3 md:px-8">
      <SiteBrand />
      <nav class="hidden items-center gap-3 lg:flex" aria-label="Основное меню">
        <details class="group relative" @click="closeMenu">
          <summary class="flex min-h-11 cursor-pointer list-none items-center gap-2 text-sm font-semibold [&::-webkit-details-marker]:hidden">Каталог техники <SiteIcon name="chevron" class="size-3 transition-transform group-open:rotate-180" /></summary>
          <div class="absolute left-0 top-full max-h-[70dvh] w-80 overflow-auto border border-line-dark bg-night p-2">
            <NuxtLink v-for="category in categories" :key="category.slug" :to="categoryPath(category.slug)" :class="menuLink">{{ category.title }}</NuxtLink>
            <NuxtLink to="/katalog" :class="menuLink">Весь каталог</NuxtLink>
          </div>
        </details>
        <details class="group relative" @click="closeMenu">
          <summary class="flex min-h-11 cursor-pointer list-none items-center gap-2 text-sm font-semibold [&::-webkit-details-marker]:hidden">Услуги <SiteIcon name="chevron" class="size-3 transition-transform group-open:rotate-180" /></summary>
          <div class="absolute left-0 top-full max-h-[70dvh] w-72 overflow-auto border border-line-dark bg-night p-2">
            <NuxtLink v-for="service in services" :key="service.slug" :to="servicePath(service.slug)" :class="menuLink">{{ service.title }}</NuxtLink>
            <NuxtLink to="/uslugi" :class="menuLink">Все услуги</NuxtLink>
          </div>
        </details>
        <NuxtLink to="/#ceny" :class="menuLink">Стоимость</NuxtLink>
        <NuxtLink to="/kontakty" :class="menuLink">Контакты</NuxtLink>
      </nav>
      <a :href="telHref(site.phone)" class="ml-auto hidden min-h-11 shrink-0 items-center text-sm font-bold text-snow hover:text-flame2 xl:inline-flex">{{ site.phone }}</a>
      <details class="group lg:hidden" @click="closeMenu">
        <summary class="flex min-h-11 cursor-pointer list-none items-center gap-1 text-sm font-bold [&::-webkit-details-marker]:hidden">Меню <SiteIcon name="chevron" class="size-3 group-open:rotate-180" /></summary>
        <nav class="absolute inset-x-0 top-full max-h-[75dvh] overflow-auto border-y border-line-dark bg-night px-5 py-3" aria-label="Мобильное меню">
          <NuxtLink to="/katalog" :class="menuLink">Каталог техники</NuxtLink>
          <NuxtLink v-for="category in categories" :key="category.slug" :to="categoryPath(category.slug)" :class="menuLink">{{ category.title }}</NuxtLink>
          <NuxtLink to="/uslugi" :class="menuLink">Услуги</NuxtLink>
          <NuxtLink to="/#smena" :class="menuLink">Условия аренды</NuxtLink>
          <NuxtLink to="/kontakty" :class="menuLink">Контакты</NuxtLink>
          <a :href="telHref(site.phone)" :class="menuLink">{{ site.phone }}</a>
        </nav>
      </details>
      <SiteButton to="/#zayavka" size="sm">Заказать технику</SiteButton>
    </div>
  </header>
</template>
