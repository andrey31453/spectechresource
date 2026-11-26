<script setup lang="ts">
import type { LandingDto } from "~/types/catalog";

const route = useRoute();
const segment = String(route.params.slug ?? "");

// ЧПУ посадочной: /arenda-{typeSlug}
const typeSlug = segment;

const { data: site } = await useSite();
const { data, error } = await useFetch<LandingDto>("/api/landing", {
  key: `landing-${segment}`,
  query: { typeSlug },
});
throwIfError(error.value);

const landing = computed(() => data.value);
const models = computed(() => (landing.value?.models ?? []).map((model) => ({
  ...model,
  categorySlug: landing.value!.category.slug,
  typeSlug,
  typeName: landing.value!.type.name,
  photo: model.photos[0] ?? null,
})));
const gallery = computed(() => landing.value?.type.gallery ?? []);
const city = computed(() => landing.value?.city ?? { slug: "moskva", name: "Москва", nameIn: "Москве" });
const companyName = computed(() => site.value?.companyName ?? "ООО «СПЕЦТЕХРЕСУРС»");
const h1 = computed(() => `Аренда ${landing.value?.type.nameGenitive ?? ""} в ${city.value.nameIn}`);


const fallbackDescription = computed(() => {
  const type = landing.value?.type;
  if (!type) return null;

  const conditions = [
    `аренда ${type.nameGenitive} в ${city.value.nameIn}`,
    formatPriceFrom(type.priceFrom, type.priceUnit).toLowerCase(),
    type.minOrder ? `минимальный заказ: ${type.minOrder}` : null,
    "работа с юридическими лицами по договору",
  ].filter(Boolean);

  return `${conditions.join(", ")}.`;
});

const { canonical } = usePageSeo({
  title: landing.value?.type.seoTitle ?? `${h1.value} — ${formatPriceFrom(landing.value?.type.priceFrom ?? null, landing.value?.type.priceUnit ?? "SHIFT").toLowerCase()} | ${companyName.value}`,
  description: landing.value?.type.seoDescription ?? fallbackDescription.value,
  path: `/arenda-${typeSlug}`,
  type: "article",
});

if (landing.value?.type.priceFrom) {
  const type = landing.value.type;
  const price = Number(type.priceFrom).toFixed(2);

  useJsonLd("product", {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `Аренда ${type.nameGenitive}`,
    description: type.seoDescription ?? fallbackDescription.value ?? undefined,
    url: canonical,
    offers: {
      "@type": "Offer",
      price,
      priceCurrency: "RUB",
      availability: "https://schema.org/InStock",
      url: canonical,
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price,
        priceCurrency: "RUB",
        unitText: PRICE_UNIT_LABEL[type.priceUnit],
      },
    },
  });
}


</script>

<template>
  <div v-if="landing" data-lead-page :data-equipment-type-slug="typeSlug" :data-equipment-label="landing.type.name">
    <SiteBreadcrumbs
      :items="[
        { name: 'Главная', path: '/' },
        { name: 'Каталог', path: '/katalog' },
        { name: landing.type.name },
      ]"
    />

    <h1>{{ h1 }}</h1>
    <p class="lead">
      {{ landing.type.name }} в аренду в {{ city.nameIn }} и области: подача с экипажем, работа по
      договору с закрывающими документами.
    </p>

    <div v-if="landing.type.descriptionTopHtml" class="section [overflow-wrap:anywhere]" data-description-top v-html="landing.type.descriptionTopHtml" />

    <section class="section" data-model-list>
      <h2>Модели в парке</h2>
      <CatalogModelsGrid :models="models" wide :equipment-type-slug="typeSlug" :equipment-label="landing.type.name" />
      <p class="muted">Наличие конкретной модели уточняйте по телефону — парк обновляется.</p>
    </section>

    <TypePhotoGallery :photos="gallery" :label="landing.type.name" />

    <CtaBlock :phone="site?.phone ?? ''" />

    <section class="section" style="margin-top: 24px">
      <h2>Цена и условия</h2>
      <ul>
        <li><strong>Стоимость:</strong> {{ formatPriceFrom(landing.type.priceFrom, landing.type.priceUnit) }}</li>
        <li v-if="landing.type.minOrder"><strong>Минимальный заказ:</strong> {{ landing.type.minOrder }}</li>
        <li v-if="landing.type.deliveryTerms"><strong>Доставка:</strong> {{ landing.type.deliveryTerms }}</li>
        <li v-if="landing.type.deliveryPrice"><strong>Доставка отдельно:</strong> {{ formatPrice(landing.type.deliveryPrice) }}</li>
        <li>
          <strong>Экипаж:</strong>
          {{ landing.type.crewAvailable ? "с машинистом" : "без экипажа" }}
          <template v-if="landing.type.withoutCrewAvailable && landing.type.crewAvailable"> или без экипажа</template>
        </li>
      </ul>
    </section>

    <div v-if="landing.type.seoTextHtml" class="section [overflow-wrap:anywhere]" data-description-bottom v-html="landing.type.seoTextHtml" />

    <section v-if="landing.type.worksPerformedHtml" class="section">
      <h2>Какие работы выполняем</h2>
      <div v-html="landing.type.worksPerformedHtml" />
    </section>

    <section v-if="landing.related.length" class="section">
      <h2>Похожая техника</h2>
      <ul class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <li v-for="item in landing.related" :key="item.slug">
          <NuxtLink :to="typePath(item.slug, city.slug)" class="card">
            <span class="card__title">{{ item.name }}</span>
            <span class="card__meta">{{ formatPriceFrom(item.priceFrom, item.priceUnit) }}</span>
          </NuxtLink>
        </li>
      </ul>
    </section>

    <section v-if="landing.faq.length" class="section">
      <h2>Вопросы и ответы</h2>
      <FaqList :items="landing.faq" />
    </section>

    <CtaBlock
      v-if="site"
      :phone="site.phone"
      :title="`Нужна ${landing.type.name.toLowerCase()}?`"
      :equipment-type-slug="typeSlug"
      :equipment-label="landing.type.name"
      text="Уточним наличие, рассчитаем смену и сроки подачи на объект."
    />

    <p v-if="site" class="muted" style="margin-top: 16px">{{ site.priceDisclaimer }}</p>
  </div>
</template>
