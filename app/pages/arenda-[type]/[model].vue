<script setup lang="ts">
import type { LandingDto, ModelDto } from "~/types/catalog";

definePageMeta({ fullBleed: true, key: route => route.path });
const route = useRoute();
const typeSlug = String(route.params.type ?? "");
const slug = String(route.params.model ?? "");
const { data: site } = await useSite();
const { data: model, error } = await useFetch<ModelDto>("/api/model", { query: { typeSlug, modelSlug: slug } });
throwIfError(error.value);
const { data: landing, error: typeError } = await useFetch<LandingDto>("/api/landing", { query: { typeSlug } });
throwIfError(typeError.value);
if (!model.value || !landing.value) throw createError({ statusCode: 404, message: "Модель не найдена" });
const title = `${model.value.brand} ${model.value.model}`;
const h1 = `Аренда ${landing.value.type.nameGenitive} ${title}`;
const shell = "mx-auto w-full max-w-[1320px] px-5 md:px-8";
const button = "inline-flex min-h-12 items-center justify-center rounded-lg bg-[#ff901e] px-6 py-3 text-sm font-bold text-[#171b1f] transition-colors hover:bg-[#ffa43e] hover:text-[#171b1f] hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9c4100] motion-reduce:transition-none";
const { canonical } = usePageSeo({ title: `${h1} | СПЕЦТЕХРЕСУРС`, description: model.value.shortDesc ?? `${h1}. Цены, характеристики и условия подачи на объект.`, path: modelPath(typeSlug, slug), type: "article" });
useJsonLd("product", {
  "@context": "https://schema.org", "@type": "Product", name: h1, url: canonical,
  image: model.value.photos, description: model.value.shortDesc ?? h1,
  ...(model.value.pricePerShift || model.value.pricePerHour ? { offers: {
    "@type": "Offer", priceCurrency: "RUB", price: model.value.pricePerShift ?? model.value.pricePerHour,
    availability: "https://schema.org/InStock", url: canonical,
  } } : {}),
});
</script>

<template>
  <div v-if="model && landing" id="equipment-page" class="bg-[#f4f5f6] py-6 text-[#20272d] [--color-brand:#9c4100] [--color-brand-dark:#7d3400] [--color-brand-soft:#fff0df] [&_label[aria-hidden=true]]:hidden">
    <div :class="shell">
      <SiteBreadcrumbs :items="[{ name: 'Главная', path: '/' }, { name: 'Каталог', path: '/katalog' }, { name: landing.category.title, path: categoryPath(landing.category.slug) }, { name: landing.type.name, path: typePath(typeSlug) }, { name: title }]" />
      <h1 class="my-6 text-[clamp(1.65rem,3vw,2.5rem)] font-extrabold leading-tight tracking-tight [overflow-wrap:anywhere]">{{ h1 }}</h1>
      <div class="grid items-start gap-8 pb-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <EquipmentGallery :photos="model.photos" :title="title" />
        <div class="min-w-0 rounded-xl border border-[#e0e5e8] bg-white p-6 sm:p-8">
          <div class="flex flex-wrap items-center justify-between gap-4 border-b border-[#e0e5e8] pb-6">
            <div><p class="m-0 text-2xl font-extrabold">{{ formatPrice(model.pricePerShift) }}</p><p v-if="model.pricePerShift" class="mt-1 mb-0 text-sm text-[#55616b]">за смену 8 часов</p></div>
            <a href="#model-order" :class="button">Заказать {{ title }}</a>
          </div>
          <p v-if="model.pricePerHour" class="mt-4 text-sm text-[#55616b]">{{ formatPrice(model.pricePerHour) }} за час</p>
          <p v-if="model.shortDesc" class="my-5 whitespace-pre-line text-sm leading-relaxed [overflow-wrap:anywhere]">{{ model.shortDesc }}</p>
          <h2 class="mt-6 mb-4 text-lg font-bold">Характеристики</h2>
          <ModelSpecs v-if="model.specs.length" :specs="model.specs" />
          <p v-else class="text-sm text-[#55616b]">Характеристики уточняйте у менеджера.</p>
          <p class="mt-6 mb-0 text-xs leading-relaxed text-[#55616b]">Наличие и итоговую стоимость подтверждает менеджер.</p>
        </div>
      </div>
      <section class="rounded-xl border border-[#e0e5e8] bg-white p-6 sm:p-8" aria-labelledby="model-terms">
        <h2 id="model-terms" class="mt-0 text-xl font-bold">Условия аренды и доставки</h2>
        <ul class="space-y-3 text-sm leading-relaxed text-[#55616b]">
          <li v-if="landing.type.minOrder">Минимальный заказ: {{ landing.type.minOrder }}</li>
          <li v-if="landing.type.deliveryTerms">{{ landing.type.deliveryTerms }}</li>
          <li v-if="landing.type.deliveryPrice">Доставка: {{ formatPrice(landing.type.deliveryPrice) }}</li>
          <li v-if="landing.type.crewAvailable">Работа с машинистом</li>
          <li v-if="landing.type.withoutCrewAvailable">Возможна аренда без экипажа</li>
          <li>Регион работы: {{ landing.city.name }} и область</li>
        </ul>
        <div v-if="landing.type.worksPerformedHtml" class="mt-6 text-sm leading-relaxed" v-html="landing.type.worksPerformedHtml" />
      </section>
      <section v-if="landing.faq.length" class="py-12"><h2 class="mb-6 text-2xl font-bold">Вопросы об аренде</h2><FaqList :items="landing.faq" /></section>
      <section id="model-order" class="my-12 grid scroll-mt-6 gap-8 rounded-2xl bg-[#fff0df] p-6 sm:p-9 lg:grid-cols-2 lg:p-12" aria-labelledby="model-order-title">
        <div><p class="text-xs font-bold tracking-widest text-[#9c4100] uppercase">Расчёт аренды</p><h2 id="model-order-title" class="mt-3 text-3xl font-extrabold leading-tight">Нужен {{ title }}?</h2><p class="mt-5 text-base leading-relaxed text-[#4e555b]">Укажите задачу, адрес объекта и сроки. Уточним наличие машины, рассчитаем аренду и доставку.</p><a v-if="site?.phone" :href="telHref(site.phone)" class="inline-flex min-h-11 items-center text-lg font-bold text-[#20272d] hover:text-[#9c4100]">{{ site.phone }}</a></div>
        <div class="[&_form]:shadow-none [&_form_a]:inline-flex [&_form_a]:min-h-6 [&_form_a]:items-center [&_form_button[type=submit]]:bg-[#ff901e] [&_form_button[type=submit]]:bg-none [&_form_button[type=submit]]:text-[#171b1f] [&_form_button[type=submit]:hover]:bg-[#ffa43e] [&_input[type=checkbox]]:h-6 [&_input[type=checkbox]]:w-6">
          <LeadForm place="equipment" :equipment-type-slug="typeSlug" :equipment-model-id="model.id" :phone="site?.phone" :heading="`Заказать ${title}`" lead="Согласуем условия до подачи техники." submit-label="Получить расчёт" />
        </div>
      </section>
      <p v-if="site" class="pb-4 text-xs leading-relaxed text-[#55616b]">{{ site.priceDisclaimer }}</p>
    </div>
  </div>
</template>