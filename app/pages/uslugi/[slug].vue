<script setup lang="ts">
import type { ServiceDetailDto } from "~/types/catalog";
import { earthworksSlug } from "~~/shared/content/earthworks";

definePageMeta({ fullBleed: true });

const route = useRoute();
const slug = String(route.params.slug ?? "");

const { data: site } = await useSite();
const { data: service, error } = await useFetch<ServiceDetailDto>(`/api/services/${slug}`, {
  key: `service-${slug}`,
});
throwIfError(error.value);

const city = computed(() => site.value?.city ?? { slug: "moskva", name: "Москва", nameIn: "Москве" });
const companyName = computed(() => site.value?.companyName ?? "ООО «СПЕЦТЕХРЕСУРС»");

usePageSeo({
  title: service.value?.seoTitle ?? `${service.value?.title ?? "Услуга"} в ${city.value.nameIn} | ${companyName.value}`,
  description: service.value?.seoDescription ?? service.value?.description ?? null,
  path: `/uslugi/${slug}`,
  type: "article",
});
</script>

<template>
  <article v-if="service && slug === earthworksSlug" id="service-earthworks" class="bg-cement2 text-ink">
    <section class="bg-night text-snow">
      <div class="mx-auto max-w-site px-5 pb-16 pt-6 md:px-8 md:pb-24">
        <div class="[&_a]:text-fog [&_span]:text-fog [&_nav]:text-fog [&_nav]:mb-10">
          <SiteBreadcrumbs :items="[{ name: 'Главная', path: '/' }, { name: 'Услуги', path: '/uslugi' }, { name: service.title }]" />
        </div>
        <div class="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div class="min-w-0">
            <p class="mb-5 font-mono text-xs uppercase tracking-widest text-flame2">Услуги · Москва и область</p>
            <h1 class="mb-6 text-[clamp(2.75rem,6vw,5.5rem)] font-semibold leading-[1.02] tracking-tight">{{ service.title }}</h1>
            <p v-if="service.description" class="mb-8 max-w-xl text-lg leading-relaxed text-fog">{{ service.description }}</p>
            <SiteButton href="#zayavka" tone="light" with-arrow>Рассчитать работы</SiteButton>
            <p class="mb-0 mt-4 text-sm leading-relaxed text-fog">Начнём с задачи, объёма и условий на площадке.</p>
          </div>
          <figure v-if="service.image" class="m-0 min-w-0">
            <img :src="service.image" :alt="service.title" width="960" height="800" fetchpriority="high" class="aspect-[6/5] w-full rounded-card object-cover">
            <figcaption class="mt-4 border-l-2 border-flame pl-4 text-sm leading-relaxed text-fog">Котлован · Траншеи · Погрузка · Обратная засыпка</figcaption>
          </figure>
        </div>
      </div>
    </section>

    <div class="mx-auto grid max-w-site gap-12 px-5 py-16 md:px-8 md:py-24 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-20">
      <ServiceDescription v-if="service.descriptionTopHtml || service.contentHtml" :html="service.descriptionTopHtml || service.contentHtml || ''" data-description-top />
      <aside class="self-start rounded-card border border-cement-line bg-white p-6 md:p-8 lg:sticky lg:top-28">
        <p class="mb-4 font-mono text-xs uppercase tracking-widest text-ember-ink">Для предметного расчёта</p>
        <h2 class="mb-5 text-2xl font-semibold leading-tight">Расскажите об объекте</h2>
        <ul class="mb-7 space-y-4 text-sm leading-relaxed text-ink2">
          <li><strong class="block text-ink">Где работаем</strong>Адрес и условия подъезда.</li>
          <li><strong class="block text-ink">Что делаем</strong>Вид работ, размеры и глубина.</li>
          <li><strong class="block text-ink">Когда начинаем</strong>Желаемые даты и режим работ.</li>
          <li><strong class="block text-ink">Куда перемещаем грунт</strong>На участке или с вывозом.</li>
        </ul>
        <SiteButton href="#zayavka" class="w-full">Обсудить задачу</SiteButton>
        <p class="mb-0 mt-4 text-sm leading-relaxed text-steel">Нет точных замеров? Начните с описания — уточним, какие данные нужны.</p>
      </aside>
    </div>

    <ServiceEquipmentShowcase :equipment="service.equipment" :price-disclaimer="site?.priceDisclaimer" />
    <div v-if="service.descriptionBottomHtml" class="mx-auto max-w-site px-5 py-16 md:px-8 md:py-24">
      <ServiceDescription :html="service.descriptionBottomHtml" data-description-bottom />
    </div>

    <section v-if="service.faq.length" class="border-t border-cement-line bg-white">
      <div class="mx-auto max-w-site px-5 py-16 md:px-8 md:py-24">
        <p class="mb-4 font-mono text-xs uppercase tracking-widest text-ember-ink">До начала работ</p>
        <h2 class="mb-8 text-3xl font-semibold tracking-tight md:text-4xl">Разберём важные вопросы</h2>
        <FaqList :items="service.faq" with-schema />
      </div>
    </section>
    <section class="bg-night text-snow">
      <div class="mx-auto flex max-w-site flex-col items-start justify-between gap-8 px-5 py-16 md:px-8 md:py-20 lg:flex-row lg:items-center">
        <div class="max-w-2xl">
          <p class="mb-4 font-mono text-xs uppercase tracking-widest text-flame2">Следующий шаг</p>
          <h2 class="mb-4 text-3xl font-semibold leading-tight tracking-tight md:text-4xl">Сначала задача.<br>Затем нужная машина.</h2>
          <p class="mb-0 text-base leading-relaxed text-fog">Оставьте контакты и опишите объект. Уточним исходные данные для подбора техники и расчёта.</p>
        </div>
        <SiteButton href="#zayavka" tone="light" with-arrow>Оставить заявку</SiteButton>
      </div>
    </section>
  </article>
  <div v-else-if="service" class="container py-8">
    <SiteBreadcrumbs
      :items="[
        { name: 'Главная', path: '/' },
        { name: 'Услуги', path: '/uslugi' },
        { name: service.title },
      ]"
    />

    <h1>{{ service.title }}</h1>
    <p v-if="service.description" class="lead">{{ service.description }}</p>

    <div v-if="service.descriptionTopHtml || service.contentHtml" v-html="service.descriptionTopHtml || service.contentHtml || ''" />
    <ServiceEquipmentShowcase :equipment="service.equipment" :price-disclaimer="site?.priceDisclaimer" />
    <div v-if="service.descriptionBottomHtml" v-html="service.descriptionBottomHtml" />

    <FaqList v-if="service.faq.length" :items="service.faq" with-schema />

    <CtaBlock v-if="site" :phone="site.phone" />
  </div>
</template>
