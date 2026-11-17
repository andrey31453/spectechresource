<script setup lang="ts">
import type { SiteDto } from "~/types/catalog";

const props = defineProps<{ site: SiteDto }>();

const year = new Date().getFullYear();

/** Ссылка подвала: приглушённый цвет, бренд на наведении. */
const link = "text-muted transition-colors hover:text-brand";

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
  <footer class="mt-16 border-t border-line bg-surface-soft text-sm">
    <div class="mx-auto grid max-w-site gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
      <section>
        <h2 class="mt-0 mb-3 text-base font-bold text-ink">{{ site.companyName }}</h2>
        <ul class="space-y-2">
          <li>
            <a
              :href="telHref(site.phone)"
              class="text-lg font-bold whitespace-nowrap text-ink transition-colors hover:text-brand"
            >
              {{ site.phone }}
            </a>
          </li>
          <li v-if="site.email">
            <a :href="`mailto:${site.email}`" :class="link">{{ site.email }}</a>
          </li>
          <li v-if="site.workingHours" class="text-muted">{{ site.workingHours }}</li>
          <li v-if="site.address" class="text-muted">{{ site.address }}</li>
        </ul>
      </section>

      <section>
        <h2 class="mt-0 mb-3 text-base font-bold text-ink">Каталог</h2>
        <ul class="space-y-2">
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

      <section v-if="messengers.length">
        <h2 class="mt-0 mb-3 text-base font-bold text-ink">Мессенджеры</h2>
        <ul class="space-y-2">
          <li v-for="item in messengers" :key="item.label">
            <a :href="item.href" rel="noopener" :class="link">{{ item.label }}</a>
          </li>
        </ul>
      </section>

      <section v-if="requisites.length">
        <h2 class="mt-0 mb-3 text-base font-bold text-ink">Реквизиты</h2>
        <ul class="space-y-2 text-muted">
          <li v-for="item in requisites" :key="item">{{ item }}</li>
        </ul>
      </section>
    </div>

    <div class="border-t border-line">
      <p class="mx-auto max-w-site px-4 py-4 text-xs text-muted">
        © {{ year }} {{ site.companyName }}. {{ site.priceDisclaimer }}
      </p>
    </div>
  </footer>
</template>
