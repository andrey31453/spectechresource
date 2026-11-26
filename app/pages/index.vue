<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import type { HomeDto } from "~/types/catalog";
import { initLanding } from "~/utils/landing";
import { groupModelsBySupergroup } from "~/utils/model-groups";
import { groupModelsByCategory } from "~/utils/models";
import { telHref } from "~/utils/phone";
import { pluralRu } from "~/utils/plural";
import { formatPriceFrom, formatPriceShort, lowestPrice } from "~/utils/price";
import { servicePath, typePath } from "~/utils/routes";
import { useAsyncData, useHead } from "nuxt/app";

/**
 * Главная — вёрстка макета `docs/sait-13` (1:1): разметка, стили и поведение перенесены
 * из `dist/index.html`. Содержимое заменено на данные сайта аренды спецтехники:
 * каталог, услуги, преимущества, шаги, цифры и FAQ приходят из `GET /api/home`,
 * контакты и реквизиты — из `GET /api/site` (тексты правятся в админке).
 *
 * Стили макета — файл `/landing/style.css` (сборка референса без изменений). Он
 * подключается ссылкой из `public/`, а не импортом: импорт попадал в общий чанк
 * страниц, и `body` макета (тёмный фон, `color-scheme: dark`) применялся на всех
 * маршрутах. Порядок решает `moveStyleLast`: правила макета должны идти последними.
 * Правила каркаса, пересекающиеся с макетом (body, a, img, .lead, .grid), лежат
 * в `main.css` внутри слоёв и с меткой `landing-page` на <body>.
 */
definePageMeta({ layout: false });

/** Сколько видов показываем в карточке раздела: остальные сворачиваются в «ещё N». */
const CATALOG_TYPES_LIMIT = 4;
const heroActive = ref(false);

const { data: site } = await useSite();
const { data: home } = await useAsyncData<HomeDto>(
  "home-page",
  () => $fetch<HomeDto>("/api/home"),
  {
    default: () => ({
      categories: [],
      models: [],
      services: [],
      advantages: [],
      steps: [],
      stats: [],
      faq: [],
    }),
  },
);

const companyName = computed(
  () => site.value?.companyName ?? "ООО «СПЕЦТЕХРЕСУРС»",
);
/** Бренд без организационной формы — для подписи в шапке и подвале. */
const brandName = computed(() =>
  companyName.value.replace(/^ООО\s+/, "").replace(/[«»]/g, ""),
);
const city = computed(
  () =>
    site.value?.city ?? { slug: "moskva", name: "Москва", nameIn: "Москве" },
);
const phone = computed(() => site.value?.phone ?? "+7 (495) 000-00-00");
const phoneLink = computed(() => telHref(phone.value));
const email = computed(() => site.value?.email ?? "info@example.ru");
const emailLink = computed(() => `mailto:${email.value}`);
const workingHours = computed(
  () => site.value?.workingHours ?? "Пн–Вс, 08:00–20:00",
);
const address = computed(() => site.value?.address ?? "");
const priceDisclaimer = computed(
  () =>
    site.value?.priceDisclaimer ??
    "Цены на сайте — ориентир и не являются публичной офертой: стоимость и наличие подтверждает менеджер.",
);

const categories = computed(() => home.value?.categories ?? []);
const models = computed(() => home.value?.models ?? []);
const services = computed(() => home.value?.services ?? []);
const steps = computed(() => home.value?.steps ?? []);
const stats = computed(() => home.value?.stats ?? []);
const faq = computed(() => home.value?.faq ?? []);

/**
 * Демонстрационные фотографии техники — заменяются снимками из карточек каталога,
 * когда появятся собственные фото парка (вопрос Q-08 в `docs/specs/front.md`).
 */
const PHOTOS = {
  park: "/landing/images/tech/park.webp",
  delivery: "/landing/images/tech/podacha.webp",
  crew: "/landing/images/tech/mashinist.webp",
  documents: "/landing/images/tech/dokumenty.webp",
  service: "/landing/images/tech/remont.webp",
  site: "/landing/images/tech/na-obekte.webp",
} as const;

/** Иконки шагов заявки: поиск, расчёт, согласование, погрузка, доставка, сервис. */
const stepIcons: string[] = [
  "M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM15.4 15.4 21 21",
  "M4.5 3h15v18h-15zM8 7.5h8M8 12h8M8 16.5h4",
  "M4.5 12.5 9.5 17.5 20 6.5",
  "M3.5 8h9.5v8H3.5zM13 11h4l3 3v2h-7z",
  "M3 16.5V12h3.5V8.5h6V12H18l3 2.5v2",
  "M15.4 3.6a4.6 4.6 0 0 0 5.1 6.9l-8.1 8.1a2.6 2.6 0 1 1-3.6-3.6l8-8.1a4.6 4.6 0 0 0-1.4-3.3z",
];

/** Шаги заказа из админки + номер и иконка по порядку. */
const stepCards = computed(() =>
  steps.value.map((step, index) => ({
    title: step.title,
    text: step.text,
    number: String(index + 1).padStart(2, "0"),
    icon: stepIcons[index] ?? stepIcons[0] ?? "",
  })),
);

/** Заголовок блока шагов: число берётся из админки, чтобы «шесть» не разошлось с данными. */
const stepsLabel = computed(() => {
  const count = steps.value.length;

  return count > 0
    ? `${count} ${pluralRu(count, ["шаг", "шага", "шагов"])}`
    : "Порядок заказа";
});

/** Все виды каталога одним списком: цена «от» на первом экране и в блоке техники. */
const allTypes = computed(() =>
  categories.value.flatMap((category) => category.types),
);
const parkTypeCount = computed(() => allTypes.value.length);
const parkTypeLabel = computed(
  () =>
    `${parkTypeCount.value} ${pluralRu(parkTypeCount.value, ["вид", "вида", "видов"])}`,
);
const parkSectionsLabel = computed(
  () =>
    `${categories.value.length} ${pluralRu(categories.value.length, ["раздел", "раздела", "разделов"])}`,
);

/**
 * Секции `#modeli`: техника разложена по надгруппам (земляные работы, погрузка и подъём,
 * дороги и стройка, перевозки и коммуналка), внутри каждой — полки разделов каталога.
 * Порядок разделов и моделей задаёт `GET /api/home`, группировка — `groupModelsByCategory`,
 * надгруппы — `groupModelsBySupergroup` (`app/utils/model-groups.ts`).
 */
const modelGroups = computed(() => groupModelsByCategory(categories.value, models.value));
const modelSections = computed(() => groupModelsBySupergroup(modelGroups.value));

/** Классы, которые заказывают чаще всего: по ним в карточках разделов ставим «Хит спроса». */
const HIT_TYPE_SLUGS = new Set([
  "gusenichnogo-ekskavatora",
  "avtokrana",
  "samosvala",
  "katka",
]);

/**
 * Разделы каталога для сетки: четыре вида в списке, цена «от» по разделу,
 * счётчик видов и остаток за пределами списка.
 */
const catalogCards = computed(() =>
  categories.value.map((category) => {
    const price = lowestPrice(category.types);
    const types = category.types.slice(0, CATALOG_TYPES_LIMIT);
    const hidden = category.types.length - types.length;

    return {
      slug: category.slug,
      title: category.title,
      shortDesc: category.shortDesc,
      isHit: category.types.some((type) => HIT_TYPE_SLUGS.has(type.slug)),
      price: price
        ? formatPriceFrom(price.priceFrom, price.priceUnit)
        : "Цена по запросу",
      types,
      typesCount: `${category.types.length} ${pluralRu(category.types.length, ["вид", "вида", "видов"])}`,
      moreCount: hidden
        ? `ещё ${hidden} ${pluralRu(hidden, ["вид", "вида", "видов"])}`
        : null,
    };
  }),
);

/** Слаги «быстрого подбора»: частые заказы в полосе `#podbor` под первым экраном. */
const HERO_QUICK_SLUGS = [
  "gusenichnogo-ekskavatora",
  "avtokrana",
  "samosvala",
  "katka",
  "mini-pogruzchika",
  "ilososa",
];

/** «Быстрый подбор»: виды техники с ценой из каталога и ссылкой на страницу вида. */
const heroQuickPicks = computed(() => {
  const bySlug = new Map(allTypes.value.map((type) => [type.slug, type]));

  return HERO_QUICK_SLUGS.flatMap((slug) => {
    const type = bySlug.get(slug);
    if (!type) return [];

    return [
      {
        slug,
        name: type.name,
        price: formatPriceShort(type.priceFrom, type.priceUnit),
        href: typePath(type.slug, city.value.slug),
      },
    ];
  });
});

interface LeaseTab {
  id: string;
  label: string;
  title: string;
  text: string;
  photo: string;
  specs: Array<{ label: string; value: string }>;
}

/** Условия смены и ГСМ; доставка собрана в отдельном разделе. */
const leaseTabs: LeaseTab[] = [
  {
    id: "smena",
    label: "Смена и заказ",
    title: "Смена и минимальный заказ",
    text: "Смена считается по факту работы машины на объекте. Время подачи и переездов внутри площадки оговариваем отдельно, чтобы в счёте не появлялось неожиданных строк.",
    photo: PHOTOS.park,
    specs: [
      { label: "Продолжительность смены", value: "8 часов" },
      { label: "Минимальный заказ", value: "4 часа" },
      { label: "Переработка сверх смены", value: "по часовому тарифу" },
      { label: "Ночная смена", value: "по согласованию" },
      { label: "Выходные и праздники", value: "по тарифу" },
    ],
  },
  {
    id: "gsm",
    label: "ГСМ и ответственность",
    title: "Топливо, обслуживание и ответственность",
    text: "Технику передаём в рабочем состоянии и обслуживаем между сменами. Условия по топливу и простою фиксируем в договоре до начала работ, чтобы споров при закрытии не было.",
    photo: PHOTOS.service,
    specs: [
      {
        label: "Топливо (ГСМ)",
        value: "за счёт заказчика, если не согласовано иное",
      },
      { label: "Обслуживание и ремонт", value: "за счёт исполнителя" },
      { label: "Ответственность перед третьими лицами", value: "по договору" },
    ],
  },
];

interface DocTab {
  id: string;
  label: string;
  title: string;
  note: string;
  cards: Array<{ code: string; name: string; text: string }>;
}

/** Договор и закрывающие; тендеры вынесены в компактную карточку. */
const docTabs: DocTab[] = [
  {
    id: "dogovor",
    label: "Договор и оплата",
    title: "Договор и оплата",
    note: "Работаем с НДС и без НДС: схему оплаты и состав закрывающих документов согласуем до подачи техники.",
    cards: [
      {
        code: "Договор",
        name: "Договор аренды техники с экипажем",
        text: "Предмет, конкретная машина, смена, ответственность сторон, порядок оплаты, замены техники и расторжения.",
      },
      {
        code: "Счёт",
        name: "Счёт и порядок оплаты",
        text: "Предоплата или постоплата по договору, безналичный расчёт, работа с НДС и без НДС.",
      },
      {
        code: "Спецификация",
        name: "Спецификация и график подачи",
        text: "Перечень машин, количество смен и адреса подачи — приложением к договору на весь срок аренды.",
      },
    ],
  },
  {
    id: "zakryvayushchie",
    label: "Закрывающие документы",
    title: "Закрывающие документы",
    note: "Комплект готовим по каждой смене или за период — как удобно вашей бухгалтерии.",
    cards: [
      {
        code: "УПД",
        name: "Универсальный передаточный документ",
        text: "Закрывает смену и одновременно служит счётом-фактурой при работе с НДС.",
      },
      {
        code: "Акт",
        name: "Акт выполненных работ",
        text: "Фиксирует отработанные часы и смены по путевым листам, подписывается на объекте.",
      },
      {
        code: "Путевой лист",
        name: "Путевые листы машинистов",
        text: "Подтверждают время работы на объекте и служат основанием для расчёта переработки.",
      },
      {
        code: "Счёт-фактура",
        name: "Счёт-фактура",
        text: "Выставляем при работе с НДС вместе с УПД — в сроки, установленные договором.",
      },
    ],
  },
];


usePageSeo({
  title: `Аренда спецтехники в ${city.value.nameIn} | ${brandName.value}`,
  description: `Аренда спецтехники в ${city.value.nameIn} и области: экскаваторы, автокраны, самосвалы, катки, сваебойные установки. Договор с юрлицами, подача от 4 часов.`,
  path: "/",
});

/** Шрифт макета и метка страницы: только на главной, при уходе со страницы теги снимаются. */
useHead({
  // Метка на <body> отключает правила каркаса, которые пересекаются с макетом:
  // переносы в заголовках (`tailwind.css`) и классы `.lead`/`.grid` (`main.css`).
  bodyAttrs: {
    class: "landing-page palette-warm-amber",
  },
  // Тёмная строка браузера на мобильном — как у макета (`--color-night` = фон body).
  meta: [{ name: "theme-color", content: "#0b0f13", key: "theme-color" }],
  link: [
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    {
      rel: "preconnect",
      href: "https://fonts.gstatic.com",
      crossorigin: "anonymous",
    },
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap",
      key: "landing-font",
    },
    {
      rel: "stylesheet",
      href: "/landing/style.css",
      key: "landing-style",
      tagPriority: "low",
    },
    {
      rel: "stylesheet",
      href: "/landing/warm-amber.css",
      key: "landing-warm-amber",
      tagPriority: "low",
    },
  ],
});

/** FAQPage для поиска: те же вопросы, что видны в блоке «Частые вопросы» (SEO-03). */
if (faq.value.length) {
  useJsonLd("home-faq", {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.value.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  });
}

/**
 * Ставит стили макета последними в `<head>`.
 *
 * В собранном приложении ссылка и так идёт после CSS сайта, а в dev-режиме Vite
 * вставляет `tailwind.css` и `main.css` тегами `<style>` уже после неё — и тогда
 * `body` и токены каркаса перебивают макет. Перемещение ссылки — та же таблица
 * стилей из кеша, без повторной загрузки; первый кадр рисуется по ней же.
 */
function moveStyleLast() {
  const link = document.head.querySelector<HTMLLinkElement>(
    'link[data-hid="landing-style"]',
  );
  if (!link || link === document.head.lastElementChild) return;
  document.head.append(link);
}

/** Модули макета: появление блоков, меню, табы, маска, заявка, шкала разделов. */
let disposeLanding: (() => void) | undefined;
onMounted(() => {
  void nextTick(moveStyleLast);
  disposeLanding = initLanding();
});
onBeforeUnmount(() => {
  disposeLanding?.();
  disposeLanding = undefined;
});
</script>
<template>
  <div>
    <SiteHeader v-if="site" :site="site" :categories="categories" :services="services" fixed :active="heroActive" />
    <main id="main">
      <HomeExperimentalLanding variant="dark" embedded @activate="heroActive = true" />

      <section id="podbor" class="band feat-band">
        <div class="shell">
          <h2 class="sr-only">Быстрый подбор: частые заказы с ценой</h2>
          <span class="kicker">Быстрый подбор: частые заказы с ценой</span>
          <ul class="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <li v-for="pick in heroQuickPicks" :key="pick.slug" class="flex">
              <a
                class="chip w-full flex-col items-start gap-1.5 py-3 transition hover:bg-white/5"
                :href="pick.href"
              >
                <span class="leading-snug">{{ pick.name }}</span>
                <b class="text-sm text-snow">{{ pick.price }}</b>
              </a>
            </li>
          </ul>
        </div>
      </section>

      <div v-if="models.length" id="modeli">
        <HomeModelsSignatureSections :sections="modelSections" variant="h" :thumbnails="true" :city-slug="city.slug" :price-disclaimer="priceDisclaimer" />
      </div>

      <section id="o-kompanii" class="band on-light">
        <div class="shell">
          <div class="max-w-4xl">
            <div class="about__intro">
              <span class="kicker">О компании</span>
              <h2 class="h2 about__title mt-4">
                <span class="about__brand"
                  >СПЕЦ<span class="brand__accent">ТЕХ</span>РЕСУРС</span
                >
                — техника, которая работает
              </h2>
              <p class="lead mt-4">
                {{ parkTypeLabel }} техники в {{ parkSectionsLabel }}: экскаваторы,
                автокраны, самосвалы, катки, погрузчики и сваебойные установки.
                Работаем в {{ city.nameIn }} и области. Диспетчер на связи
                {{ workingHours }}.
              </p>

              <a class="btn btn--ink about__cta" href="#pokazateli"
                >Парк и база<svg
                  class="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M4 12h15M13.5 6.5 19 12l-5.5 5.5" /></svg
              ></a>
            </div>
          </div>
        </div>
      </section>

      <section id="katalog" class="band grid-bg">
        <div class="shell">
          <span class="kicker">Каталог техники</span>
          <h2 class="h2 mt-4">От котлована до свай: {{ parkSectionsLabel }} каталога</h2>
          <p class="lead mt-4 max-w-4xl">
            Разложили парк по задачам: земляные работы, погрузка, монтаж, дорога,
            бетон, перевозка, коммунальное хозяйство и сваи. В карточке — цена
            «от» за смену, что входит в раздел и сколько видов внутри. Начните с
            раздела, который ближе к вашей задаче.
          </p>
          <div class="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <article
              v-for="card in catalogCards"
              :key="card.slug"
              class="panel flex flex-col p-6 reveal"
            >
              <div class="flex items-start justify-between gap-3">
                <svg
                  class="h-7 w-7 text-flame"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M3 16.5V12h3.5V8.5h6V12H18l3 2.5v2h-2" />
                  <path d="M6.5 16.5h11" />
                  <path
                    d="M6 19.5a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6zM17 19.5a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6z"
                  />
                </svg>
                <span v-if="card.isHit" class="chip">Хит спроса</span>
              </div>
              <h3 class="h3 mt-5">{{ card.title }}</h3>
              <p class="panel__meta mt-3">{{ card.shortDesc }}</p>
              <p class="mt-4 text-lg font-semibold text-flame">
                {{ card.price }}
              </p>
              <ul class="tick mt-5">
                <li v-for="type in card.types" :key="type.slug">
                  {{ type.name }} —
                  {{ formatPriceShort(type.priceFrom, type.priceUnit) }}
                </li>
              </ul>
              <div class="mt-5 flex flex-wrap gap-2">
                <span class="chip">{{ card.typesCount }}</span>
                <span v-if="card.moreCount" class="chip">{{
                  card.moreCount
                }}</span>
              </div>
              <div class="mt-auto pt-5">
                <div class="border-t border-flame/30 pt-5" aria-hidden="true" />
                <a class="btn btn--ghost" href="/katalog"
                  >Весь каталог<svg
                    class="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.6"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path d="M4 12h15M13.5 6.5 19 12l-5.5 5.5" /></svg
                ></a>
              </div>
            </article>
          </div>
          <p
            class="note mt-6 border-l-2 px-4 py-3 text-sm border-flame/70 bg-flame/5"
          >
            {{ priceDisclaimer }}
          </p>
          <div class="mt-8 flex flex-wrap gap-3">
            <a class="btn btn--primary" href="/katalog"
              >Весь каталог — {{ parkTypeLabel
              }}<svg
                class="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M4 12h15M13.5 6.5 19 12l-5.5 5.5" /></svg
            ></a>
            <a class="btn btn--ghost" href="#zayavka"
              >Подобрать под задачу<svg
                class="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M4 12h15M13.5 6.5 19 12l-5.5 5.5" /></svg
            ></a>
          </div>
        </div>
      </section>

      <!--
  Блок «Техника в парке»: второй уровень каталога — виды техники с ценой за смену.
  Вкладки показывают все виды раздела, чтобы стоимость и заказ были видны
  без перехода в каталог; поведение вкладок — модуль `tabs` из `app/utils/landing.ts`.
-->
      <section id="tehnika" class="band on-light">
        <div class="shell">
          <span class="kicker">Техника в парке</span>
          <h2 class="h2 mt-4">Полный парк: {{ parkTypeLabel }} с ценой за смену</h2>
          <p class="lead mt-4 max-w-4xl">
            Все виды собраны по разделам, чтобы не листать общий прайс:
            выбирайте класс и смотрите цену «от» за смену 8 часов с машинистом.
            Если по виду цены нет — считаем под объект и фиксируем в смете.
          </p>
          <div class="tabs mt-10" data-tabs>
            <div
              class="tabs__list"
              role="tablist"
              aria-label="Виды техники по разделам"
            >
              <button
                v-for="category in categories"
                :id="`park-tab-${category.slug}`"
                :key="category.slug"
                type="button"
                class="tabs__tab"
                role="tab"
                :aria-controls="`park-panel-${category.slug}`"
              >
                {{ category.title
                }}<span class="tabs__count">{{ category.types.length }}</span>
              </button>
            </div>
            <div class="tabs__panels">
              <section
                v-for="category in categories"
                :id="`park-panel-${category.slug}`"
                :key="category.slug"
                class="tabs__panel"
                role="tabpanel"
                :aria-labelledby="`park-tab-${category.slug}`"
              >
                <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <article
                    v-for="type in category.types"
                    :key="type.slug"
                    class="panel flex flex-col p-5"
                  >
                    <h3 class="h3">
                      <a class="inline-flex min-h-6 items-center" :href="typePath(type.slug, city.slug)">{{
                        type.name
                      }}</a>
                    </h3>
                    <p class="panel__meta mt-2 text-sm">
                      {{ formatPriceFrom(type.priceFrom, type.priceUnit) }}
                    </p>
                    <div class="mt-auto flex flex-wrap gap-2 pt-5">
                      <a
                        class="btn btn--sm btn--ghost"
                        :href="typePath(type.slug, city.slug)"
                        >Подробнее</a
                      >
                      <a class="btn btn--sm btn--ink" href="#zayavka"
                        >Заказать</a
                      >
                    </div>
                  </article>
                </div>
                <p
                  class="note mt-6 border-l-2 px-4 py-3 text-sm border-ink/40 bg-ink/5"
                >
                  {{ priceDisclaimer }}
                </p>
              </section>
            </div>
          </div>
          <div class="mt-10 flex flex-wrap items-center gap-3">
            <a class="btn btn--primary" href="#zayavka"
              >Подобрать технику под задачу<svg
                class="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M4 12h15M13.5 6.5 19 12l-5.5 5.5" /></svg
            ></a>
            <a class="btn btn--ghost" href="/katalog"
              >Весь каталог<svg
                class="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M4 12h15M13.5 6.5 19 12l-5.5 5.5" /></svg
            ></a>
          </div>
        </div>
      </section>

      <section id="uslugi" class="scroll-mt-24 bg-black py-12 text-white md:py-16" aria-labelledby="directions-title">
        <div class="shell">
          <div class="mb-8 grid! gap-5 md:grid-cols-2">
            <div>
              <p class="mb-3 text-xs font-bold tracking-[0.14em] text-[#ff9e49] uppercase">Направления работ</p>
              <h2 id="directions-title" class="m-0 text-[clamp(1.8rem,3.5vw,3rem)] leading-[1.12] font-extrabold tracking-[-0.035em] text-white">Сначала задача.<br>Затем нужная машина.</h2>
            </div>
            <p class="m-0 max-w-lg self-end text-sm leading-relaxed text-[#c7c7c7]">Выберите направление работ: от разработки грунта до перевозки техники. На странице услуги — задачи и подходящие машины.</p>
          </div>
          <div v-if="services.length" class="grid! gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <a v-for="(service, index) in services" :key="service.slug" :href="servicePath(service.slug)" class="group flex min-w-0 flex-col rounded-lg border border-[#424242] bg-[#141414] p-6 text-white! no-underline! transition-colors hover:border-[#ff7a00] hover:bg-[#242424] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ffae66] motion-reduce:transition-none!" data-direction-card>
              <span class="flex items-center justify-between text-xs font-bold text-[#ffb16d]">{{ String(index + 1).padStart(2, '0') }}<SiteIcon name="arrow" class="h-5 w-5" /></span>
              <h3 class="mt-7 mb-3 text-xl font-bold text-white">{{ service.title }}</h3>
              <p v-if="service.description" class="mt-0 mb-0 text-sm leading-relaxed text-[#d0d0d0]">{{ service.description }}</p>
            </a>
          </div>
          <p v-else class="text-sm leading-relaxed text-[#d0d0d0]">Индивидуальный подбор для строительных, дорожных и коммунальных работ. <a href="#zayavka" class="inline-flex min-h-11 items-center font-semibold text-[#ffb16d]! hover:text-white!">Расскажите о своей задаче →</a></p>
        </div>
      </section>

      <section id="formaty" class="band grid-bg">
        <div class="shell">
          <span class="kicker">Два формата работы</span>
          <h2 class="h2 mt-4">Одна машина на смену или парк на весь объект</h2>
          <p class="lead mt-4 max-w-4xl">
            Выберите отдельную машину или согласуйте состав техники
            под последовательные этапы работ.
          </p>
          <div class="mt-10 grid gap-4 md:grid-cols-2">
            <article class="linecard reveal">
              <figure class="media linecard__media">
                <img
                  class="media__img"
                  :src="PHOTOS.park"
                  alt="Экскаватор и самосвал на площадке объекта"
                  width="1600"
                  height="1200"
                  loading="lazy"
                  decoding="async"
                />
                <figcaption class="media__credit">
                  Фото из архива компании
                </figcaption>
              </figure>
              <div class="linecard__body">
                <svg
                  class="h-8 w-8 text-flame"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                  focusable="false"
                >
                  <rect x="3" y="3.5" width="18" height="17" rx="1" />
                  <path d="M3 9h18M3 14.5h18M9 3.5v17M15 3.5v17" />
                </svg>
                <h3 class="h3 mt-5">Аренда техники со сменным экипажем</h3>
                <p class="panel__meta mt-3">
                  Экскаваторы, автокраны, самосвалы, катки, погрузчики и
                  сваебойные установки с машинистом на смену, неделю или месяц.
                </p>
                <ul class="tick mt-7">
                  <li>Одна машина под конкретный этап работ</li>
                  <li>Сменное оборудование под вашу задачу</li>
                  <li>Аренда на смену, неделю или месяц</li>
                </ul>
                <div class="mt-7">
                  <a class="btn btn--ghost" href="/katalog"
                    >Весь каталог техники<svg
                      class="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.6"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path d="M4 12h15M13.5 6.5 19 12l-5.5 5.5" /></svg
                  ></a>
                </div>
              </div>
            </article>
            <article class="linecard reveal">
              <figure class="media linecard__media">
                <img
                  class="media__img"
                  :src="PHOTOS.crew"
                  alt="Бригада на объекте рядом с землеройной техникой"
                  width="1600"
                  height="1067"
                  loading="lazy"
                  decoding="async"
                />
                <figcaption class="media__credit">
                  Фото из архива компании
                </figcaption>
              </figure>
              <div class="linecard__body">
                <svg
                  class="h-8 w-8 text-flame"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path
                    d="M12 3 4.5 6v6c0 4.2 3.2 7.6 7.5 9 4.3-1.4 7.5-4.8 7.5-9V6z"
                  />
                  <path d="m9 12.2 2.2 2.3 4.3-4.5" />
                </svg>
                <h3 class="h3 mt-5">Комплексная механизация объекта</h3>
                <p class="panel__meta mt-3">
                  Несколько машин в одном договоре: земляные работы, погрузка и
                  вывоз, планировка, монтажные подъёмы и свайные работы по
                  графику стройки.
                </p>
                <ul class="tick mt-7">
                  <li>Один договор и один диспетчер на весь парк</li>
                  <li>График выхода машин под этапы работ</li>
                  <li>Координация подачи нескольких классов техники</li>
                </ul>
                <div class="mt-7">
                  <a class="btn btn--ghost" href="/uslugi"
                    >Все услуги<svg
                      class="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.6"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path d="M4 12h15M13.5 6.5 19 12l-5.5 5.5" /></svg
                  ></a>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section id="smena" class="band on-light">
        <div class="shell">
          <span class="kicker">Условия аренды</span>
          <h2 class="h2 mt-4">Смена и топливо — условия аренды</h2>
          <p class="lead mt-4 max-w-4xl">
            Смена — 8 часов, минимум 4 оплачиваемых часа, переработка — по
            часовому тарифу. ГСМ по умолчанию за счёт заказчика, обслуживание и
            ремонт — наши. Подробности расчёта — по вкладкам.
          </p>
          <div class="tabs mt-10" data-tabs>
            <div
              class="tabs__list"
              role="tablist"
              aria-label="Условия аренды техники"
            >
              <button
                v-for="tab in leaseTabs"
                :id="`mat-tab-${tab.id}`"
                :key="tab.id"
                type="button"
                class="tabs__tab"
                role="tab"
                :aria-controls="`mat-panel-${tab.id}`"
              >
                {{ tab.label }}
              </button>
            </div>
            <div class="tabs__panels">
              <section
                v-for="tab in leaseTabs"
                :id="`mat-panel-${tab.id}`"
                :key="tab.id"
                class="tabs__panel"
                role="tabpanel"
                :aria-labelledby="`mat-tab-${tab.id}`"
              >
                <div class="matpanel">
                  <figure class="media matpanel__media">
                    <img
                      class="media__img"
                      :src="tab.photo"
                      :alt="tab.title"
                      width="1200"
                      height="800"
                      loading="lazy"
                      decoding="async"
                    />
                    <figcaption class="media__credit">
                      Фото из архива компании
                    </figcaption>
                  </figure>
                  <div class="matpanel__body">
                    <h3 class="matpanel__title">
                      <svg
                        class="h-5 w-5 text-flame"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.6"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        aria-hidden="true"
                        focusable="false"
                      >
                        <path
                          d="M14 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V7.5z"
                        />
                        <path d="M14 3v4.5h4.5" />
                        <path d="M9 12.5h6M9 16h4" /></svg
                      ><span>{{ tab.title }}</span>
                    </h3>
                    <p class="matpanel__text">{{ tab.text }}</p>
                    <dl class="spec">
                      <div
                        v-for="spec in tab.specs"
                        :key="spec.label"
                        class="spec__row"
                      >
                        <dt>{{ spec.label }}</dt>
                        <dd>{{ spec.value }}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </section>

      <section id="poryadok" class="band process-band">
        <div class="shell">
          <div class="process">
            <div class="process__aside">
              <span class="kicker">Как заказать</span>
              <h2 class="h2 mt-4">
                {{ stepsLabel }}: от заявки до выхода машины на объект
              </h2>
              <p class="lead mt-4 max-w-4xl">
                Заявку ведёт один диспетчер. Даты и время каждого этапа
                согласуем при оформлении заказа.
              </p>
            </div>
            <ol class="process__grid">
              <li
                v-for="card in stepCards"
                :key="card.number"
                class="stepcard reveal"
              >
                <div class="stepcard__head">
                  <span class="stepcard__num">{{ card.number }}</span>
                  <svg
                    class="stepcard__icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.6"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path :d="card.icon" />
                  </svg>
                </div>
                <h3 class="stepcard__title">{{ card.title }}</h3>
                <p class="stepcard__text">{{ card.text }}</p>
              </li>
            </ol>
          </div>
        </div>
      </section>

      <section id="pokazateli" class="band on-light">
        <div class="shell">
          <span class="kicker">Показатели</span>
          <h2 class="h2 mt-4">Ключевые цифры</h2>
          <div class="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div v-for="item in stats" :key="item.label" class="stat reveal">
              <div class="stat__value">
                {{ item.value
                }}<template v-if="item.unit"> {{ item.unit }}</template>
              </div>
              <p class="stat__label">{{ item.label }}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="garantii" class="band grid-bg">
        <div class="shell">
          <span class="kicker">Гарантии и сопровождение</span>
          <h2 class="h2 mt-4">Что получает заказчик вместе с машиной</h2>
          <div class="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <article class="panel p-6 reveal">
              <svg
                class="h-7 w-7 text-flame"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  d="M14 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V7.5z"
                />
                <path d="M14 3v4.5h4.5" />
                <path d="M9 12.5h6M9 16h4" />
              </svg>
              <h3 class="h3 mt-5">Смета до подачи техники</h3>
              <p class="panel__meta mt-3">
                Стоимость смены, доставки и дополнительного оборудования
                фиксируется в смете и договоре. Изменения — только по
                согласованию, с письменным подтверждением.
              </p>
            </article>
            <article class="panel p-6 reveal">
              <svg
                class="h-7 w-7 text-flame"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  d="M12 3 4.5 6v6c0 4.2 3.2 7.6 7.5 9 4.3-1.4 7.5-4.8 7.5-9V6z"
                />
                <path d="m9 12.2 2.2 2.3 4.3-4.5" />
              </svg>
              <h3 class="h3 mt-5">Замена машины при поломке</h3>
              <p class="panel__meta mt-3">
                Если техника встала не по вине заказчика, простой не
                оплачивается, а на объект выходит резервная единица того же
                класса в сроки, указанные в договоре.
              </p>
            </article>
            <article class="panel p-6 reveal">
              <svg
                class="h-7 w-7 text-flame"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                <circle cx="12" cy="8" r="3.6" />
                <path d="M5 20.5c0-3.6 3.1-5.6 7-5.6s7 2 7 5.6" />
              </svg>
              <h3 class="h3 mt-5">Машинисты в штате</h3>
              <p class="panel__meta mt-3">
                Экипаж с удостоверениями и допусками, с опытом на действующих
                объектах. Инструктаж по технике безопасности на площадке
                проходит до начала работ.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section id="dokumenty" class="band on-light">
        <div class="bg-scheme" aria-hidden="true">
          <svg
            class="bg-scheme__svg"
            viewBox="0 0 560 560"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            <g class="bg-scheme__ring">
              <circle cx="280" cy="280" r="254" />
              <circle cx="280" cy="280" r="198" />
              <circle cx="280" cy="280" r="142" />
            </g>
            <path
              class="bg-scheme__contour"
              d="M128 300 C 128 150, 432 150, 432 300"
            />
            <path class="bg-scheme__contour" d="M280 300 V156" />
            <path class="bg-scheme__contour" d="M156 232 H404" />
            <path class="bg-scheme__contour" d="M192 300 V190" />
            <path class="bg-scheme__contour" d="M368 300 V190" />
            <rect
              class="bg-scheme__object"
              x="152"
              y="300"
              width="256"
              height="208"
              rx="8"
            />
            <path
              class="bg-scheme__object"
              d="M152 348 H408M152 396 H408M152 444 H408"
            />
            <path class="bg-scheme__object" d="M216 300 V508M344 300 V508" />
            <path
              class="bg-scheme__path"
              d="M452 118 C 430 160, 360 180, 300 178"
            />
            <circle class="bg-scheme__dot" cx="452" cy="118" r="7" />
            <circle class="bg-scheme__dot" cx="280" cy="300" r="6" />
          </svg>
        </div>
        <div class="bg-ticks" aria-hidden="true">
          <span class="deco__ticks deco__ticks--a"
            ><i class="deco__tick" /><i class="deco__tick" /><i
              class="deco__tick" /><i class="deco__tick" /><i
              class="deco__tick"
          /></span>
          <span class="deco__ticks deco__ticks--b"
            ><i class="deco__tick" /><i class="deco__tick" /><i
              class="deco__tick" /><i class="deco__tick" /><i
              class="deco__tick"
          /></span>
          <span class="deco__ticks deco__ticks--c"
            ><i class="deco__tick" /><i class="deco__tick" /><i
              class="deco__tick" /><i class="deco__tick" /><i
              class="deco__tick" /><i class="deco__tick" /><i
              class="deco__tick" /><i class="deco__tick"
          /></span>
          <span class="deco__ticks deco__ticks--d"
            ><i class="deco__tick" /><i class="deco__tick" /><i
              class="deco__tick" /><i class="deco__tick"
          /></span>
        </div>
        <div class="shell">
          <span class="kicker">Документы</span>
          <h2 class="h2 mt-4">
            Договор и закрывающие документы
          </h2>
          <p class="lead mt-4 max-w-4xl">
            Комплект документов зависит от формы оплаты и требований вашей
            бухгалтерии. Ниже — что входит в каждый пакет;
            состав и сроки согласуем до подачи техники.
          </p>
          <p class="note note--comment mt-6">
            Работаем с НДС и без НДС. Электронный документооборот — по
            согласованию: Диадок, СБИС или сканы с подписью.
          </p>
          <div class="tabs mt-8" data-tabs>
            <div
              class="tabs__list"
              role="tablist"
              aria-label="Документы для заказчика"
            >
              <button
                v-for="tab in docTabs"
                :id="`normativy-tab-${tab.id}`"
                :key="tab.id"
                type="button"
                class="tabs__tab"
                role="tab"
                :aria-controls="`normativy-panel-${tab.id}`"
              >
                {{ tab.label
                }}<span class="tabs__count">{{ tab.cards.length }}</span>
              </button>
            </div>
            <div class="tabs__panels">
              <section
                v-for="tab in docTabs"
                :id="`normativy-panel-${tab.id}`"
                :key="tab.id"
                class="tabs__panel"
                role="tabpanel"
                :aria-labelledby="`normativy-tab-${tab.id}`"
              >
                <div class="docpanel__head">
                  <h3 class="docpanel__title">{{ tab.title }}</h3>
                  <span class="docpanel__count">{{ tab.cards.length }}</span>
                </div>
                <p class="docpanel__note">{{ tab.note }}</p>
                <div class="docgrid">
                  <article
                    v-for="card in tab.cards"
                    :key="card.code"
                    class="panel doc-card p-6 reveal"
                  >
                    <span class="doc-card__code">{{ card.code }}</span>
                    <h4 class="doc-card__name">{{ card.name }}</h4>
                    <p class="panel__meta mt-3">{{ card.text }}</p>
                  </article>
                </div>
              </section>
            </div>
          </div>
          <aside id="tendery" aria-labelledby="tender-title" class="mt-10 grid gap-6 rounded-2xl bg-[#fff0df] p-6 text-[#20272d] sm:p-9 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <SiteIcon name="docs" class="mb-4 h-9 w-9 text-[#9c4100]" />
              <h3 id="tender-title" class="m-0 text-2xl font-extrabold leading-tight tracking-tight text-[#20272d]">Участвуем в тендерах и закупках</h3>
              <p class="mt-4 mb-0 max-w-2xl text-sm leading-relaxed text-[#4e555b]">44-ФЗ, 223-ФЗ и коммерческие закупки. Подготовим предложение по форме заказчика, сведения о технике и подтверждение опыта под требования вашей закупки.</p>
            </div>
            <div class="rounded-xl border border-[#dfe4ea] bg-white p-6">
              <p class="m-0 text-base font-bold text-[#20272d]">Обсудим вашу закупку</p>
              <p class="mt-3 mb-5 text-sm leading-relaxed text-[#4e555b]">Укажите номер закупки и срок подачи в комментарии к заявке.</p>
              <a href="#zayavka" data-tender-cta class="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-[#ff901e] px-5 py-3 text-sm font-bold text-[#171b1f]! no-underline! transition-colors hover:bg-[#ffa43e] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9c4100] motion-reduce:transition-none">Обсудить тендер</a>
            </div>
          </aside>
        </div>
      </section>

      <section id="geografiya" class="band on-light">
        <div class="shell">
          <span class="kicker">Доставка и допуск</span>
          <h2 class="h2 mt-4">Доставка в Москву и область: что подготовить</h2>
          <p class="lead mt-4 max-w-4xl">Гусеничную и тяжёлую технику доставляем тралом, колёсную — своим ходом. Стоимость считаем по адресу объекта; выезд за пределы области согласуем отдельно.</p>
          <ul class="tick mt-7">
            <li>Сообщите адрес, дату и удобное время подачи.</li>
            <li>Проверьте ширину въезда, покрытие и место для разгрузки или стоянки.</li>
            <li>Подготовьте пропуска; для работ в охранных зонах — необходимый наряд-допуск.</li>
            <li>Назначьте ответственного за приём машины и инструктаж на площадке.</li>
          </ul>
        </div>
      </section>

      <section id="cta" class="cta-band band">
        <div class="shell cta-band__inner">
          <div class="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:items-end">
            <div>
              <span class="kicker">Расчёт по объекту</span>
              <h2 class="h2 mt-4">
                Опишите работы — подберём машину и посчитаем смету
              </h2>
              <p class="mt-4 max-w-2xl text-[#2b1a10]">
                Достаточно вида работ, объёма, адреса объекта и сроков.
                Диспетчер предложит класс машины и сменное оборудование,
                посчитает смену с доставкой и подскажет, что нужно для допуска
                на площадку.
              </p>
            </div>
            <div class="lg:text-right">
              <div class="flex flex-wrap gap-3 lg:justify-end">
                <a class="btn btn--ink" href="#zayavka"
                  ><svg
                    class="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.6"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path
                      d="M6.4 3.5h3l1.5 4-2 1.4a11.2 11.2 0 0 0 5.6 5.6l1.4-2 4 1.5v3a2 2 0 0 1-2.2 2A16.6 16.6 0 0 1 4.5 5.7 2 2 0 0 1 6.4 3.5z"
                    /></svg
                  >Оставить заявку</a
                >
                <a class="btn btn--ink" :href="phoneLink">{{ phone }}</a>
              </div>
            </div>
          </div>

        </div>
      </section>

      <section id="faq" class="band on-light">
        <div class="shell">
          <span class="kicker">Вопросы и ответы</span>
          <h2 class="h2 mt-4">Частые вопросы об аренде</h2>
          <p class="lead mt-4 max-w-4xl">
            Собрали то, что чаще всего спрашивают до подписания договора: про
            смену, топливо, доставку, документы и замену техники.
          </p>
          <div class="mt-10 grid gap-4 md:grid-cols-2">
            <details
              v-for="item in faq"
              :key="item.question"
              class="panel p-6 reveal"
            >
              <summary class="h3">{{ item.question }}</summary>
              <p class="panel__meta mt-3">{{ item.answer }}</p>
            </details>
          </div>
        </div>
      </section>

      <section id="zayavka" class="band band--stars">
        <div class="stars-bg" aria-hidden="true">
          <div class="stars stars--far" />
          <div class="stars stars--mid" />
          <div class="stars stars--near" />
          <div class="stars stars--spark" />

          <div class="stars stars--giant" />
        </div>
        <div
          class="shell grid gap-10 lg:grid-cols-[1fr_minmax(0,500px)] lg:items-start lg:gap-14"
        >
          <div>
            <span class="kicker">Обратная связь</span>
            <h2 class="h2 mt-4">Заказать технику</h2>

            <ul class="mt-9 space-y-4 text-base md:text-lg">
              <li>
                <a
                  class="inline-flex items-center gap-4 font-medium text-snow transition-colors hover:text-flame"
                  :href="phoneLink"
                  ><svg
                    class="h-5 w-5 shrink-0 text-flame md:h-6 md:w-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.6"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path
                      d="M6.4 3.5h3l1.5 4-2 1.4a11.2 11.2 0 0 0 5.6 5.6l1.4-2 4 1.5v3a2 2 0 0 1-2.2 2A16.6 16.6 0 0 1 4.5 5.7 2 2 0 0 1 6.4 3.5z"
                    /></svg
                  >{{ phone }}</a
                >
              </li>
              <li>
                <a
                  class="inline-flex items-center gap-4 font-medium text-snow transition-colors hover:text-flame"
                  :href="emailLink"
                  ><svg
                    class="h-5 w-5 shrink-0 text-flame md:h-6 md:w-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.6"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <rect x="2.5" y="5" width="19" height="14" rx="1.5" />
                    <path d="m3.5 6.5 8.5 6.5 8.5-6.5" /></svg
                  >{{ email }}</a
                >
              </li>
              <li class="flex items-center gap-4 text-mist">
                <svg
                  class="h-5 w-5 shrink-0 text-flame md:h-6 md:w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                  focusable="false"
                >
                  <circle cx="12" cy="12" r="8.5" />
                  <path d="M12 7.5V12l3.2 2" /></svg
                >{{ workingHours }}
              </li>
              <li class="flex items-center gap-4 text-mist">
                <svg
                  class="h-5 w-5 shrink-0 text-flame md:h-6 md:w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path
                    d="M12 21s6.5-5.6 6.5-10.5a6.5 6.5 0 1 0-13 0C5.5 15.4 12 21 12 21z"
                  />
                  <circle cx="12" cy="10.5" r="2.4" /></svg
                ><template v-if="address">{{ address }}</template
                ><template v-else
                  >Работаем в {{ city.nameIn }} и по области</template
                >
              </li>
            </ul>
          </div>

          <div class="stars-lead-form">
            <LeadForm place="callback" :equipment-types="allTypes.map(type => ({ slug: type.slug, name: type.name }))" :phone="phone" heading="Оставьте заявку" lead="Укажите контакты и задачу — уточним наличие, стоимость и сроки подачи." submit-label="Получить расчёт" />
          </div>
        </div>
      </section>
    </main>
    <SiteFooter v-if="site" :site="site" :categories="categories" :services="services" />
  </div>
</template>
