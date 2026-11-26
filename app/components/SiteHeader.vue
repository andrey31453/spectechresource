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
function handleMenuClick(event: MouseEvent) {
  if (!(event.currentTarget instanceof HTMLDetailsElement)) return;
  const current = event.currentTarget;
  if (event.target instanceof Element && event.target.closest("a")) {
    current.open = false;
    return;
  }
  if (!(event.target instanceof Element) || !event.target.closest('summary')) return;
  event.preventDefault();
  current.open = !current.open;
  if (current.open) {
    header.value?.querySelectorAll<HTMLDetailsElement>("details[open]").forEach(menu => {
      if (menu !== current) menu.open = false;
    });
  }
}
function closeMenusOutside(event: MouseEvent) {
  if (event.target instanceof Element && !event.target.closest('details')) {
    header.value?.querySelectorAll<HTMLDetailsElement>("details[open]").forEach(menu => { menu.open = false; });
  }
}
function closeMenusOnEscape(event: KeyboardEvent) {
  if (event.key !== "Escape") return;
  header.value?.querySelectorAll<HTMLDetailsElement>("details[open]").forEach(menu => { menu.open = false; });
}
onMounted(() => {
  document.addEventListener("click", closeMenusOutside);
  document.addEventListener("keydown", closeMenusOnEscape);
});
onBeforeUnmount(() => {
  document.removeEventListener("click", closeMenusOutside);
  document.removeEventListener("keydown", closeMenusOnEscape);
});
const isActive = (path: string) => path === "/arenda-"
  ? route.path.startsWith("/arenda-")
  : route.path === path || (path !== "/" && route.path.startsWith(`${path}/`));
</script>

<template>
  <header
    ref="header"
    class="inset-x-0 top-0 z-50 border-b border-line-dark bg-night/95 text-snow backdrop-blur transition-[opacity,transform,visibility] motion-reduce:transition-none"
    :class="[fixed ? 'fixed' : 'sticky', active ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-full opacity-0']"
    :inert="!active"
  >
    <div class="mx-auto flex max-w-site items-center justify-between gap-3 px-5 py-3 md:px-8 lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
      <SiteBrand />
      <nav class="hidden items-center justify-self-center gap-3 lg:flex" aria-label="Основное меню">
        <details class="group relative" @click="handleMenuClick">
          <summary :class="['flex min-h-11 cursor-pointer list-none items-center gap-2 text-sm font-semibold hover:text-flame2 [&::-webkit-details-marker]:hidden', isActive('/arenda-') || isActive('/katalog') ? 'text-flame2' : 'text-snow']">Каталог техники <SiteIcon name="chevron" class="size-3 transition-transform group-open:rotate-180" /></summary>
          <div class="absolute left-0 top-full max-h-[70dvh] w-80 overflow-auto rounded-card border border-line-dark bg-night p-2">
            <NuxtLink v-for="category in categories" :key="category.slug" :to="typePath(category.slug)" :class="[menuLink, isActive(typePath(category.slug)) ? 'bg-panel text-flame2!' : '']">{{ category.title }}</NuxtLink>
          </div>
        </details>
        <details class="group relative" @click="handleMenuClick">
          <summary :class="['flex min-h-11 cursor-pointer list-none items-center gap-2 text-sm font-semibold [&::-webkit-details-marker]:hidden', isActive('/uslugi') ? 'text-flame2' : 'text-snow']">Услуги <SiteIcon name="chevron" class="size-3 transition-transform group-open:rotate-180" /></summary>
          <div class="absolute left-0 top-full max-h-[70dvh] w-72 overflow-auto rounded-card border border-line-dark bg-night p-2">
            <NuxtLink v-for="service in services" :key="service.slug" :to="servicePath(service.slug)" :class="[menuLink, isActive(servicePath(service.slug)) ? 'bg-panel text-flame2!' : '']">{{ service.title }}</NuxtLink>
          </div>
        </details>
        <NuxtLink to="/stoimost" :class="[menuLink, isActive('/stoimost') ? 'bg-panel text-flame2!' : '']">Стоимость</NuxtLink>
        <NuxtLink to="/kontakty" :class="[menuLink, isActive('/kontakty') ? 'bg-panel text-flame2!' : '']">Контакты</NuxtLink>
      </nav>
      <div class="flex items-center justify-self-end gap-3">
        <a :href="telHref(site.phone)" class="hidden min-h-11 shrink-0 items-center whitespace-nowrap text-sm font-bold text-snow hover:text-flame2 xl:inline-flex">{{ site.phone }}</a>
        <details class="group lg:hidden" @click="handleMenuClick">
          <summary class="flex min-h-11 cursor-pointer list-none items-center gap-1 text-sm font-bold [&::-webkit-details-marker]:hidden">Меню <SiteIcon name="chevron" class="size-3 group-open:rotate-180" /></summary>
          <nav class="absolute inset-x-0 top-full max-h-[75dvh] overflow-auto border-y border-line-dark bg-night px-5 py-3" aria-label="Мобильное меню">
            <NuxtLink to="/katalog" :class="[menuLink, isActive('/katalog') ? 'bg-panel text-flame2!' : '']">Каталог техники</NuxtLink>
            <NuxtLink v-for="category in categories" :key="category.slug" :to="typePath(category.slug)" :class="[menuLink, isActive(typePath(category.slug)) ? 'bg-panel text-flame2!' : '']">{{ category.title }}</NuxtLink>
            <NuxtLink to="/uslugi" :class="[menuLink, isActive('/uslugi') ? 'text-flame2' : '']">Услуги</NuxtLink>
            <NuxtLink to="/stoimost" :class="[menuLink, isActive('/stoimost') ? 'text-flame2' : '']">Стоимость</NuxtLink>
            <NuxtLink to="/#smena" :class="menuLink">Условия аренды</NuxtLink>
            <NuxtLink to="/kontakty" :class="[menuLink, isActive('/kontakty') ? 'text-flame2' : '']">Контакты</NuxtLink>
            <a :href="telHref(site.phone)" :class="menuLink">{{ site.phone }}</a>
          </nav>
        </details>
        <SiteButton href="#zayavka" size="sm">Заказать технику</SiteButton>
      </div>
    </div>
  </header>
</template>
