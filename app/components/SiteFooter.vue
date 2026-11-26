<script setup lang="ts">
import type { SiteDto } from "~/types/catalog";

const props = withDefaults(defineProps<{
  site: SiteDto;
  categories?: Array<{ slug: string; title: string }>;
  services?: Array<{ slug: string; title: string }>;
}>(), { categories: () => [], services: () => [] });

const year = new Date().getFullYear();

/** Ссылка подвала: приглушённый цвет, бренд на наведении. */
const link = "inline-flex min-h-6 items-center text-mist transition-colors hover:text-flame2";

const messengers = computed(() =>
  [
    { label: "Telegram", href: props.site.telegram },
    { label: "WhatsApp", href: props.site.whatsapp },
    { label: "MAX", href: props.site.maxMessenger },
  ].filter((item): item is { label: string; href: string } => Boolean(item.href)),
);

const requisites = computed(() =>
  [
    props.site.legalName,
    props.site.inn ? `ИНН ${props.site.inn}` : null,
    props.site.ogrn ? `ОГРН ${props.site.ogrn}` : null,
  ].filter((item): item is string => Boolean(item)),
);
</script>

<template>
  <footer data-site-footer class="border-t border-line-dark bg-night text-sm">
    <div class="mx-auto flex max-w-site flex-col gap-5 px-5 py-6 md:flex-row md:items-center md:justify-between md:px-8">
      <div class="flex flex-wrap items-center gap-x-5 gap-y-2">
        <SiteBrand />
        <a :href="telHref(site.phone)" class="font-bold whitespace-nowrap text-snow hover:text-flame2">{{ site.phone }}</a>
        <a v-if="site.email" :href="`mailto:${site.email}`" :class="link">{{ site.email }}</a>
      </div>
      <nav aria-label="Ссылки в подвале" class="flex flex-wrap gap-x-5 gap-y-1">
        <NuxtLink to="/katalog" :class="link">Каталог</NuxtLink>
        <NuxtLink to="/stoimost" :class="link">Стоимость</NuxtLink>
        <NuxtLink to="/uslugi" :class="link">Услуги</NuxtLink>
        <NuxtLink to="/kontakty" :class="link">Контакты</NuxtLink>
        <a href="#zayavka" :class="link">Заявка</a>
        <NuxtLink to="/politika-obrabotki-personalnyh-dannyh" :class="link">Политика ПДн</NuxtLink>
      </nav>
    </div>
    <div class="border-t border-line-dark">
      <div class="mx-auto flex max-w-site flex-wrap gap-x-5 gap-y-1 px-5 pt-3 text-xs text-mist md:px-8">
        <span v-if="site.workingHours">{{ site.workingHours }}</span>
        <span v-if="site.address">{{ site.address }}</span>
        <a v-for="item in messengers" :key="item.label" :href="item.href" rel="noopener" :class="link">{{ item.label }}</a>
        <span v-if="requisites.length">{{ requisites.join(' · ') }}</span>
      </div>
      <p class="mx-auto flex max-w-site flex-wrap gap-x-2 px-5 py-3 text-xs text-mist md:px-8">
        <span>© {{ year }} {{ site.companyName }}.</span><span>{{ site.priceDisclaimer }}</span>
      </p>
    </div>
  </footer>
</template>
