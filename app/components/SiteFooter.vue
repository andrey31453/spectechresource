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
    <div class="mx-auto grid max-w-site gap-8 px-5 py-10 sm:grid-cols-2 md:px-8 lg:grid-cols-4">
      <section>
        <h2 class="mt-0 mb-3 text-base font-bold text-snow"><SiteBrand /></h2>
        <ul class="space-y-2">
          <li>
            <a
              :href="telHref(site.phone)"
              class="inline-flex min-h-6 items-center text-lg font-bold whitespace-nowrap text-snow transition-colors hover:text-flame2"
            >
              {{ site.phone }}
            </a>
          </li>
          <li v-if="site.email">
            <a :href="`mailto:${site.email}`" :class="link">{{ site.email }}</a>
          </li>
          <li v-if="site.workingHours" class="text-mist">{{ site.workingHours }}</li>
          <li v-if="site.address" class="text-mist">{{ site.address }}</li>
        </ul>
      </section>

      <section>
        <h2 class="mt-0 mb-3 text-base font-bold text-snow">Каталог</h2>
        <ul class="space-y-2">
          <li v-for="category in categories" :key="category.slug">
            <NuxtLink :to="categoryPath(category.slug)" :class="link">{{ category.title }}</NuxtLink>
          </li>
          <li>
            <NuxtLink to="/katalog" :class="link">Все разделы</NuxtLink>
          </li>
          <li>
            <NuxtLink to="/uslugi" :class="link">Услуги</NuxtLink>
          </li>
          <li>
            <NuxtLink to="/kontakty" :class="link">Контакты</NuxtLink>
          </li>
          <li>
            <NuxtLink to="/politika-obrabotki-personalnyh-dannyh" :class="link">
              Политика обработки персональных данных
            </NuxtLink>
          </li>
        </ul>
      </section>

      <section v-if="services.length">
        <h2 class="mt-0 mb-3 text-base font-bold text-snow">Услуги</h2>
        <ul class="space-y-2">
          <li v-for="service in services" :key="service.slug">
            <NuxtLink :to="servicePath(service.slug)" :class="link">{{ service.title }}</NuxtLink>
          </li>
        </ul>
      </section>

      <section v-if="messengers.length">
        <h2 class="mt-0 mb-3 text-base font-bold text-snow">Мессенджеры</h2>
        <ul class="space-y-2">
          <li v-for="item in messengers" :key="item.label">
            <a :href="item.href" rel="noopener" :class="link">{{ item.label }}</a>
          </li>
        </ul>
      </section>

      <section v-if="requisites.length">
        <h2 class="mt-0 mb-3 text-base font-bold text-snow">Реквизиты</h2>
        <ul class="space-y-2 text-mist">
          <li v-for="item in requisites" :key="item">{{ item }}</li>
        </ul>
      </section>
    </div>

    <div class="border-t border-line-dark">
      <p class="mx-auto max-w-site px-5 py-4 text-xs text-mist md:px-8">
        © {{ year }} {{ site.companyName }}. {{ site.priceDisclaimer }}
      </p>
    </div>
  </footer>
</template>
