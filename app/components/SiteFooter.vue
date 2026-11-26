<script setup lang="ts">
import type { SiteDto } from "~/types/catalog";
import { categoryPath, servicePath } from "~/utils/routes";

const props = withDefaults(defineProps<{
  site: SiteDto;
  stars?: boolean;
  categories?: Array<{ slug: string; title: string }>;
  services?: Array<{ slug: string; title: string }>;
}>(), { stars: false, categories: () => [], services: () => [] });

const year = new Date().getFullYear();

/** Ссылка подвала: приглушённый цвет, бренд на наведении. */
const link = "inline-flex min-h-6 items-center text-mist transition-colors hover:text-flame2 focus-visible:outline-flame2 motion-reduce:transition-none";

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
  <footer v-if="stars" id="zayavka" data-site-footer class="band band--stars relative isolate border-t border-line-dark bg-night py-20! text-sm text-snow md:py-28! lg:border-t-0 xl:py-32!">
    <div class="stars-bg" aria-hidden="true">
      <div class="stars stars--far" />
      <div class="stars stars--mid" />
      <div class="stars stars--near" />
      <div class="stars stars--spark" />
      <div class="stars stars--giant" />
    </div>
    <div class="mx-auto max-w-site px-5 md:px-8">
      <div data-footer-columns class="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-8 xl:gap-12">
        <div data-footer-catalog class="flex min-w-0 flex-col items-start">
          <h2 class="m-0 text-xl font-bold text-snow">Каталог техники</h2>
          <nav aria-label="Каталог в подвале" class="mt-6 flex flex-col items-start gap-2">
            <NuxtLink v-for="category in categories" :key="category.slug" :to="categoryPath(category.slug)" :class="link">{{ category.title }}</NuxtLink>
            <NuxtLink to="/katalog" :class="[link, 'mt-2 font-semibold text-snow']">Весь каталог →</NuxtLink>
          </nav>
          <nav v-if="services.length" aria-label="Услуги в подвале" class="mt-10 flex w-full flex-col items-start gap-2 pt-6 lg:mt-auto">
            <NuxtLink v-for="service in services" :key="service.slug" :to="servicePath(service.slug)" :class="link">{{ service.title }}</NuxtLink>
          </nav>
        </div>
        <div data-footer-form class="stars-lead-form min-w-0 [&_form]:p-6! [&_form>div.grid]:mt-7! [&_form>div.grid]:gap-6! [&_form>div.grid>div.grid]:gap-6! [&_form>button]:mt-7! sm:[&_form]:p-8! xl:[&_form]:p-10!">
          <slot name="form" />
        </div>
        <div data-footer-contacts class="flex min-w-0 flex-col items-start border-t border-line-dark pt-8 lg:border-t-0 lg:pt-0 lg:pl-8 xl:pl-10">
          <SiteBrand />
          <h2 class="mt-7 mb-0 text-xl font-bold text-snow">Свяжитесь с нами</h2>
          <ul class="mt-5 space-y-4 break-words">
            <li><a :href="telHref(site.phone)" :class="[link, 'text-lg font-bold text-snow']">{{ site.phone }}</a></li>
            <li v-if="site.email"><a :href="`mailto:${site.email}`" :class="link">{{ site.email }}</a></li>
            <li v-if="site.workingHours" class="text-mist">{{ site.workingHours }}</li>
            <li class="leading-relaxed text-mist">{{ site.address || `Работаем в ${site.city.nameIn} и по области` }}</li>
          </ul>
          <div v-if="messengers.length" class="mt-5 flex flex-wrap gap-x-4 gap-y-2">
            <a v-for="item in messengers" :key="item.label" :href="item.href" rel="noopener" :class="link">{{ item.label }}</a>
          </div>
          <p v-if="requisites.length" class="mt-6 mb-0 text-xs leading-relaxed text-mist">{{ requisites.join(' · ') }}</p>
          <div data-footer-bottom class="mt-10 w-full pt-6 lg:mt-auto">
            <nav aria-label="Ссылки в подвале" class="flex flex-wrap gap-x-4 gap-y-2 pt-5">
              <NuxtLink to="/stoimost" :class="link">Стоимость</NuxtLink>
              <NuxtLink to="/uslugi" :class="link">Услуги</NuxtLink>
              <NuxtLink to="/kontakty" :class="link">Контакты</NuxtLink>
              <NuxtLink to="/politika-obrabotki-personalnyh-dannyh" :class="link">Политика ПДн</NuxtLink>
            </nav>
            <p class="mt-5 mb-0 text-xs leading-relaxed text-snow">© {{ year }} {{ site.companyName }}.</p>
          </div>
        </div>
      </div>
    </div>
  </footer>
  <footer v-else data-site-footer class="border-t border-line-dark bg-night text-sm">
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
