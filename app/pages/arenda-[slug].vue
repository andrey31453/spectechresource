<script setup lang="ts">
import type { LandingDto } from "~/types/catalog";

const route = useRoute();
const segment = String(route.params.slug ?? "");

// ЧПУ посадочной: /arenda-{typeSlug}-v-{citySlug}
const markerIndex = segment.lastIndexOf("-v-");
if (markerIndex <= 0) {
  throw createError({ statusCode: 404, message: "Страница не найдена" });
}

const typeSlug = segment.slice(0, markerIndex);
const citySlug = segment.slice(markerIndex + 3);

const { data: site } = await useSite();
const { data, error } = await useFetch<LandingDto>("/api/landing", {
  key: `landing-${segment}`,
  query: { typeSlug, citySlug },
});
throwIfError(error.value);

const landing = computed(() => data.value);
const city = computed(() => landing.value?.city ?? { slug: "moskva", name: "Москва", nameIn: "Москве" });
const companyName = computed(() => site.value?.companyName ?? "ООО «СПЕЦТЕХРЕСУРС»");
const h1 = computed(() => `Аренда ${landing.value?.type.nameGenitive ?? ""} в ${city.value.nameIn}`);

// Неверный город в URL (или город не из справочника) → 301 на город по умолчанию.
if (data.value && data.value.requestedCitySlug !== data.value.city.slug) {
  await navigateTo(data.value.canonicalPath, { redirectCode: 301, replace: true });
}

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
  path: `/arenda-${typeSlug}-v-${citySlug}`,
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

function specLine(specs: Array<{ name: string; value: string }>): string {
  return specs.map((spec) => `${spec.name}: ${spec.value}`).join(" · ");
}
</script>

<template>
  <div v-if="landing">
    <Breadcrumbs
      :items="[
        { name: 'Главная', path: '/' },
        { name: 'Каталог', path: '/katalog' },
        { name: landing.category.title, path: categoryPath(landing.category.slug) },
        { name: landing.type.name },
      ]"
    />

    <h1>{{ h1 }}</h1>
    <p class="lead">
      {{ landing.type.name }} в аренду в {{ city.nameIn }} и области: подача с экипажем, работа по
      договору с закрывающими документами.
    </p>

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

    <section v-if="landing.models.length" class="section">
      <h2>Модели в парке</h2>
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Модель</th>
              <th>Цена за смену</th>
              <th>Цена за час</th>
              <th>Характеристики</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="model in landing.models" :key="model.id">
              <td>{{ model.brand }} {{ model.model }}</td>
              <td>{{ formatPrice(model.pricePerShift) }}</td>
              <td>{{ formatPrice(model.pricePerHour) }}</td>
              <td class="muted">{{ specLine(model.specs) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="muted">Наличие конкретной модели уточняйте по телефону — парк обновляется.</p>
    </section>

    <section v-if="landing.type.worksPerformedHtml" class="section">
      <h2>Какие работы выполняем</h2>
      <div v-html="landing.type.worksPerformedHtml" />
    </section>

    <section v-if="landing.related.length" class="section">
      <h2>Похожая техника</h2>
      <ul class="grid">
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

    <section v-if="landing.type.seoTextHtml" class="section">
      <h2>Подробнее об аренде</h2>
      <div v-html="landing.type.seoTextHtml" />
    </section>

    <CtaBlock
      v-if="site"
      :phone="site.phone"
      :title="`Нужна ${landing.type.name.toLowerCase()}?`"
      text="Уточним наличие, рассчитаем смену и сроки подачи на объект."
    />

    <p v-if="site" class="muted" style="margin-top: 16px">{{ site.priceDisclaimer }}</p>
  </div>
</template>
