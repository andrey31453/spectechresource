<script setup lang="ts">
import type { SiteDto } from "~/types/catalog";

const props = defineProps<{ site: SiteDto }>();

const year = new Date().getFullYear();

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
  <footer class="site-footer">
    <div class="container">
      <div class="site-footer__cols">
        <section>
          <h2>{{ site.companyName }}</h2>
          <ul>
            <li>
              <a :href="telHref(site.phone)" class="site-header__phone">{{ site.phone }}</a>
            </li>
            <li v-if="site.email">
              <a :href="`mailto:${site.email}`">{{ site.email }}</a>
            </li>
            <li v-if="site.workingHours">{{ site.workingHours }}</li>
            <li v-if="site.address">{{ site.address }}</li>
          </ul>
        </section>

        <section>
          <h2>Каталог</h2>
          <ul>
            <li><NuxtLink to="/katalog">Все разделы</NuxtLink></li>
            <li><NuxtLink to="/uslugi">Услуги</NuxtLink></li>
            <li><NuxtLink to="/kontakty">Контакты</NuxtLink></li>
            <li>
              <NuxtLink to="/politika-obrabotki-personalnyh-dannyh">
                Политика обработки персональных данных
              </NuxtLink>
            </li>
          </ul>
        </section>

        <section v-if="messengers.length || requisites.length">
          <h2>Реквизиты и связь</h2>
          <ul>
            <li v-for="item in messengers" :key="item.label">
              <a :href="item.href" rel="noopener">{{ item.label }}</a>
            </li>
            <li v-for="item in requisites" :key="item">{{ item }}</li>
          </ul>
        </section>
      </div>

      <div class="site-footer__bottom">
        <p>
          © {{ year }} {{ site.companyName }}. {{ site.priceDisclaimer }}
        </p>
      </div>
    </div>
  </footer>
</template>
