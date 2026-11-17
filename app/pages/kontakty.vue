<script setup lang="ts">
const { data: site } = await useSite();

const city = computed(() => site.value?.city ?? { slug: "moskva", name: "Москва", nameIn: "Москве" });

usePageSeo({
  title: `Контакты — аренда спецтехники в ${city.value.nameIn}`,
  description: `Связаться с ${site.value?.companyName ?? "ООО «СПЕЦТЕХРЕСУРС»"}: телефон, электронная почта, адрес и график работы. Заявки на аренду техники принимаем с 8:00 до 20:00.`,
  path: "/kontakty",
});

const messengers = computed(() =>
  [
    { label: "Telegram", href: site.value?.telegram },
    { label: "WhatsApp", href: site.value?.whatsapp },
    { label: "MAX", href: site.value?.maxMessenger },
  ].filter((item): item is { label: string; href: string } => Boolean(item.href)),
);

const mapLink = computed(() => {
  const lat = site.value?.mapLat;
  const lng = site.value?.mapLng;
  return lat && lng ? `https://yandex.ru/maps/?pt=${lng},${lat}&z=16&l=map` : null;
});

const requisites = computed(() =>
  [
    site.value?.legalName,
    site.value?.inn ? `ИНН ${site.value.inn}` : null,
    site.value?.ogrn ? `ОГРН ${site.value.ogrn}` : null,
    site.value?.legalAddress ? `Юридический адрес: ${site.value.legalAddress}` : null,
  ].filter((item): item is string => Boolean(item)),
);
</script>

<template>
  <div v-if="site">
    <SiteBreadcrumbs :items="[{ name: 'Главная', path: '/' }, { name: 'Контакты' }]" />

    <h1>Контакты</h1>
    <p class="lead">
      Аренда спецтехники в {{ city.nameIn }} и области. Позвоните или напишите — рассчитаем стоимость
      и сроки подачи на объект.
    </p>

    <div class="grid" style="margin: 24px 0">
      <div class="card">
        <span class="card__title">Телефон</span>
        <a :href="telHref(site.phone)" class="text-lg font-bold text-ink transition-colors hover:text-brand">{{ site.phone }}</a>
        <p v-if="site.workingHours" class="card__meta" style="margin: 6px 0 0">
          {{ site.workingHours }}
        </p>
      </div>

      <div v-if="site.email" class="card">
        <span class="card__title">Электронная почта</span>
        <a :href="`mailto:${site.email}`">{{ site.email }}</a>
      </div>

      <div v-if="site.address" class="card">
        <span class="card__title">Адрес</span>
        <span class="card__meta">{{ site.address }}</span>
        <p v-if="mapLink" style="margin: 6px 0 0">
          <a :href="mapLink" rel="noopener">Показать на карте</a>
        </p>
      </div>

      <div v-if="messengers.length" class="card">
        <span class="card__title">Мессенджеры</span>
        <p v-for="item in messengers" :key="item.label" style="margin: 0">
          <a :href="item.href" rel="noopener">{{ item.label }}</a>
        </p>
      </div>
    </div>

    <section v-if="requisites.length" class="section">
      <h2>Реквизиты</h2>
      <ul>
        <li v-for="item in requisites" :key="item">{{ item }}</li>
      </ul>
    </section>

    <CtaBlock :phone="site.phone" title="Нужен расчёт по объекту?" text="Назовите адрес и сроки — подберём технику и посчитаем смену." />

    <p class="muted" style="margin-top: 16px">{{ site.priceDisclaimer }}</p>
  </div>
</template>
