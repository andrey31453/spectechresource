<script setup lang="ts">
import type { FetchError } from "ofetch";
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import type { HomeDto } from "~/types/catalog";
import { buildLeadPayload, createRequestId } from "~/utils/lead-form";
import { initLanding, type LandingLeadInput } from "~/utils/landing";
import { groupModelsBySupergroup, sectionStyleVars, toneStyle } from "~/utils/model-groups";
import { groupModelsByCategory } from "~/utils/models";
import { telHref } from "~/utils/phone";
import { pluralRu } from "~/utils/plural";
import { formatPriceFrom, formatPriceShort, lowestPrice } from "~/utils/price";
import { categoryPath, servicePath, typePath } from "~/utils/routes";
import { useAsyncData, useRoute, useHead } from "nuxt/app";

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
const requisites = computed(() =>
  [
    site.value?.legalName ?? companyName.value,
    site.value?.inn ? `ИНН ${site.value.inn}` : null,
    site.value?.ogrn ? `ОГРН ${site.value.ogrn}` : null,
  ].filter((item): item is string => Boolean(item)),
);
const priceDisclaimer = computed(
  () =>
    site.value?.priceDisclaimer ??
    "Цены на сайте — ориентир и не являются публичной офертой: стоимость и наличие подтверждает менеджер.",
);
/** Год в подвале — из даты рендера страницы (в SSR и на клиенте совпадает в пределах года). */
const currentYear = new Date().getFullYear();

const categories = computed(() => home.value?.categories ?? []);
const models = computed(() => home.value?.models ?? []);
const services = computed(() => home.value?.services ?? []);
const advantages = computed(() => home.value?.advantages ?? []);
const steps = computed(() => home.value?.steps ?? []);
const stats = computed(() => home.value?.stats ?? []);
const faq = computed(() => home.value?.faq ?? []);

/**
 * Демонстрационные фотографии техники — заменяются снимками из карточек каталога,
 * когда появятся собственные фото парка (вопрос Q-08 в `docs/specs/front.md`).
 */
const PHOTOS = {
  hero: "/landing/images/tech/hero.webp",
  park: "/landing/images/tech/park.webp",
  delivery: "/landing/images/tech/podacha.webp",
  crew: "/landing/images/tech/mashinist.webp",
  documents: "/landing/images/tech/dokumenty.webp",
  service: "/landing/images/tech/remont.webp",
  site: "/landing/images/tech/na-obekte.webp",
} as const;

const advantagePhotos: string[] = [
  PHOTOS.park,
  PHOTOS.delivery,
  PHOTOS.crew,
  PHOTOS.documents,
  PHOTOS.service,
  PHOTOS.site,
];

/** Иконки карточек: щит, часы, машина, документ, ключ, геометка — по порядку карточек. */
const advantageIcons: string[] = [
  "M12 3 4.5 6v6c0 4.2 3.2 7.6 7.5 9 4.3-1.4 7.5-4.8 7.5-9V6z",
  "M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17zm0 4.3V12l3.4 2",
  "M3.5 7.5h9.5v9H3.5zM13 11h3.9l3.1 3.2v2.3H13z",
  "M14 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V7.5z",
  "M15.4 3.6a4.6 4.6 0 0 0 5.1 6.9l-8.1 8.1a2.6 2.6 0 1 1-3.6-3.6l8-8.1a4.6 4.6 0 0 0-1.4-3.3z",
  "M12 21s-6.5-5.4-6.5-10a6.5 6.5 0 1 1 13 0c0 4.6-6.5 10-6.5 10z",
];

/** Карточки «Почему нас выбирают»: преимущества из админки + номер, фото и иконка по порядку. */
const advantageCards = computed(() =>
  advantages.value.map((item, index) => ({
    title: item.title,
    text: item.text,
    photo: advantagePhotos[index] ?? null,
    icon: advantageIcons[index] ?? advantageIcons[0] ?? "",
    number: String(index + 1).padStart(2, "0"),
  })),
);

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

const SERVICE_PHOTOS: Record<string, string> = {
  "zemlyanye-raboty": "/landing/images/tech/usluga-zemlyanye.webp",
  "vyvoz-grunta": "/landing/images/tech/usluga-vyvoz.webp",
  demontazh: "/landing/images/tech/usluga-demontazh.webp",
  "planirovka-uchastka": "/landing/images/tech/usluga-planirovka.webp",
  "perevozka-tehniki-tralom": "/landing/images/tech/usluga-perevozka.webp",
};

const SERVICE_CHIPS: Record<string, string[]> = {
  "zemlyanye-raboty": ["Ковш 0,3–1,4 м³", "С машинистом"],
  "vyvoz-grunta": ["Самосвалы 10–30 т", "С погрузкой"],
  demontazh: ["Гидромолот", "Вывоз обломков"],
  "planirovka-uchastka": ["Планировщик", "Уплотнение катком"],
  "perevozka-tehniki-tralom": ["Низкорамная платформа", "С креплением"],
};

/** Услуги с фотографией и метками — галерея блока «Работы своей техникой». */
const serviceCards = computed(() =>
  services.value.map((service) => ({
    slug: service.slug,
    title: service.title,
    description: service.description,
    photo: service.image ?? SERVICE_PHOTOS[service.slug] ?? null,
    chips: SERVICE_CHIPS[service.slug] ?? [],
  })),
);

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

/** Первый экран: цена смены, размер парка и число разделов — из данных каталога. */
const heroFacts = computed(() => {
  const price = lowestPrice(allTypes.value);

  return [
    {
      label: "Цена",
      value: price
        ? formatPriceShort(price.priceFrom, price.priceUnit)
        : "по запросу",
    },
    { label: "Парк", value: `${parkTypeLabel.value} техники` },
    { label: "Каталог", value: parkSectionsLabel.value },
  ];
});

/**
 * Оффер первого экрана: что есть в парке и на каких условиях работаем.
 * Цена самой дешёвой смены выводится рядом — в бейджах `heroFacts`,
 * чтобы цифра не повторялась в лиде.
 */
const heroLead =
  "Гусеничные и колёсные экскаваторы, автокраны, самосвалы, катки, илососы и сваебойные установки — в наличии, с машинистами в штате. Смету с доставкой и ГСМ считаем до подачи машины, договор с юрлицами: НДС или без, закрывающие документы.";

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

interface PopularType {
  slug: string;
  title: string;
  rank: string;
  purpose: string;
  conditions: string;
}

/** Популярные виды техники: цена берётся из каталога, тексты — из брифа главной (§3.5). */
const POPULAR_TYPES: PopularType[] = [
  {
    slug: "gusenichnogo-ekskavatora",
    title: "Гусеничный экскаватор",
    rank: "чаще всего",
    purpose:
      "Котлованы, траншеи, разработка плотного грунта, погрузка в самосвал",
    conditions: "С машинистом, смена 8 часов, подача тралом",
  },
  {
    slug: "avtokrana",
    title: "Автокран",
    rank: "монтаж",
    purpose: "Подъём и установка конструкций, разгрузка, монтаж оборудования",
    conditions: "С машинистом, стропальщик по договорённости",
  },
  {
    slug: "samosvala",
    title: "Самосвал",
    rank: "вывоз",
    purpose:
      "Вывоз грунта и строительного мусора, доставка инертных материалов",
    conditions: "С водителем, объём кузова 10–30 т",
  },
  {
    slug: "katka",
    title: "Каток",
    rank: "уплотнение",
    purpose: "Уплотнение грунта, щебня и асфальта, подготовка основания",
    conditions: "С машинистом, вибрационный или статический режим",
  },
];

/** Виды техники с ценой из каталога — карточки блока «Популярная техника». */
const popularTypes = computed(() =>
  POPULAR_TYPES.map((item) => {
    const type = categories.value
      .flatMap((category) =>
        category.types.map((entry) => ({
          ...entry,
          categorySlug: category.slug,
        })),
      )
      .find((entry) => entry.slug === item.slug);

    return {
      ...item,
      price: type
        ? formatPriceFrom(type.priceFrom, type.priceUnit)
        : "Цена по запросу",
      href: type ? typePath(type.slug, city.value.slug) : "/katalog",
    };
  }),
);

interface LeaseTab {
  id: string;
  label: string;
  title: string;
  text: string;
  photo: string;
  specs: Array<{ label: string; value: string }>;
}

/** Условия аренды — три вкладки брифа главной (§3.10). */
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
      { label: "Простой по вине исполнителя", value: "не оплачивается" },
      { label: "Замена при поломке", value: "резервная машина" },
      { label: "Ответственность перед третьими лицами", value: "по договору" },
    ],
  },
  {
    id: "dostavka",
    label: "Доставка и допуск",
    title: "Доставка на объект и допуск к работам",
    text: "Способ доставки зависит от машины: гусеничную технику везём тралом, колёсную подаём своим ходом. Пропуска, освещение и подготовку площадки обеспечивает заказчик.",
    photo: PHOTOS.delivery,
    specs: [
      { label: "Доставка", value: "тралом или своим ходом, по адресу" },
      { label: "Въезд и пропуска", value: "оформляет заказчик" },
      { label: "Документы машиниста", value: "удостоверение и путевой лист" },
      { label: "Инструктаж по ТБ", value: "на объекте перед началом работ" },
      {
        label: "Работа на действующем объекте",
        value: "по регламенту заказчика",
      },
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

/** Документы для юрлиц и тендеров — три вкладки брифа главной (§3.12, §3.15). */
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
  {
    id: "tender",
    label: "Для тендеров",
    title: "Документы для закупок",
    note: "Готовим пакет под 44-ФЗ и 223-ФЗ: от карточки предприятия до спецификации с графиком подачи машин.",
    cards: [
      {
        code: "Карточка",
        name: "Карточка предприятия и реквизиты",
        text: "Комплект учредительных и регистрационных документов — по запросу.",
      },
      {
        code: "КП",
        name: "Коммерческое предложение по форме заказчика",
        text: "Заполняем форму закупки: позиции, смены, стоимость и сроки подачи техники.",
      },
      {
        code: "Опыт",
        name: "Подтверждение опыта",
        text: "Акты, отзывы и референс-лист по аналогичным объектам — в составе заявки.",
      },
    ],
  },
];

/**
 * Пункты шкалы разделов: порядок и `id` совпадают с блоками страницы.
 * Шкала и мобильное меню строятся из этого списка, поэтому новый блок
 * достаточно добавить здесь и в разметке.
 */
const railItems: Array<{ id: string; label: string }> = [
  { id: "main", label: "Аренда спецтехники" },
  { id: "podbor", label: "Быстрый подбор" },
  { id: "modeli", label: "Модели и цены" },
  { id: "o-kompanii", label: "О компании" },
  { id: "katalog", label: "Каталог техники" },
  { id: "tehnika", label: "Техника в парке" },
  { id: "usloviya", label: "Условия аренды" },
  { id: "raschet", label: "Расчёт по объекту" },
  { id: "uslugi", label: "Услуги" },
  { id: "zadacha", label: "Задача" },
  { id: "formaty", label: "Форматы работы" },
  { id: "smena", label: "Смена и оплата" },
  { id: "poryadok", label: "Порядок работы" },
  { id: "populyarnoe", label: "Популярная техника" },
  { id: "pokazateli", label: "Парк в цифрах" },
  { id: "garantii", label: "Гарантии" },
  { id: "dokumenty", label: "Документы" },
  { id: "pochemu-my", label: "Почему напрямую" },
  { id: "dopusk", label: "Допуск на объект" },
  { id: "geografiya", label: "География" },
  { id: "faq", label: "Вопросы" },
  { id: "tendery", label: "Тендеры" },
  { id: "ceny", label: "Стоимость" },
  { id: "zayavka", label: "Заявка" },
];

const route = useRoute();

usePageSeo({
  title: `Аренда спецтехники в ${city.value.nameIn} | ${brandName.value}`,
  description: `Аренда спецтехники в ${city.value.nameIn} и области: экскаваторы, автокраны, самосвалы, катки, сваебойные установки. Договор с юрлицами, подача от 4 часов.`,
  path: "/",
});

/** Шрифт макета и метка страницы: только на главной, при уходе со страницы теги снимаются. */
useHead({
  // Метка на <body> отключает правила каркаса, которые пересекаются с макетом:
  // переносы в заголовках (`tailwind.css`) и классы `.lead`/`.grid` (`main.css`).
  bodyAttrs: { class: "landing-page" },
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

type LeadErrorPayload = {
  message?: string;
  data?: { errors?: Array<{ field: string; message: string }> };
};

/**
 * Отправка заявки главной: те же схема и API, что у остальных форм сайта
 * (ADR-5 — сначала запись в БД, потом CRM). Согласие на обработку данных в макете
 * выражено примечанием под кнопкой, поэтому уходит `consent: true`.
 */
async function submitLead(input: LandingLeadInput) {
  const payload = buildLeadPayload({
    place: "landing-form",
    name: input.name,
    phone: input.phone,
    comment: input.comment,
    consent: true,
    pageUrl: window.location.href,
    pageTitle: document.title,
    referer: document.referrer || null,
    requestId: createRequestId(),
    query: route.query,
  });

  try {
    await $fetch("/api/leads", { method: "POST", body: payload });
  } catch (error) {
    // Текст уходит в статус формы: сообщение сервера точнее общего текста макета.
    const fetchError = error as FetchError<LeadErrorPayload>;
    throw new Error(
      fetchError.data?.data?.errors?.[0]?.message ??
        fetchError.data?.message ??
        "",
      { cause: error },
    );
  }
}

/**
 * Полки `#modeli`: у каждого раздела свой горизонтальный ряд карточек.
 * Ряд листается страницами — целыми карточками: на десктопе три, на телефоне одна.
 * Сами карточки не едут, полосы прокрутки не видно: двигают стрелки, точки под рядом,
 * тач и трекпад (ряд остаётся `overflow-x: auto`).
 */
const railRefs = ref<Record<string, HTMLElement | null>>({});
/** `page` — текущая страница (с нуля), `pages` — сколько их всего; при одной точки не рисуются. */
const railStates = ref<Record<string, { page: number; pages: number }>>({});

function setRail(slug: string, el: unknown) {
  const node = el instanceof HTMLElement ? el : null;

  if (railRefs.value[slug] !== node) railRefs.value[slug] = node;
  if (node) updateRail(slug);
}

/**
 * Геометрия полки: ширина карточки с зазором, сколько их влезает в кадр целиком
 * и сколько выходит страниц. Считаем по DOM, а не по брейкпоинтам: ширина карточек
 * задана утилитами Tailwind, и логика страниц должна идти за вёрсткой, а не дублировать её.
 */
function railMetrics(rail: HTMLElement) {
  const cards = rail.querySelectorAll<HTMLElement>("li");
  const gap = Number.parseFloat(getComputedStyle(rail).columnGap) || 0;
  const step = (cards[0]?.offsetWidth ?? 0) + gap;
  const inView = step > 0 ? Math.max(1, Math.round((rail.clientWidth + gap) / step)) : 1;

  return {
    pageWidth: step > 0 ? step * inView : rail.clientWidth,
    pages: Math.max(1, Math.ceil(cards.length / inView)),
    max: Math.max(0, rail.scrollWidth - rail.clientWidth),
  };
}

/**
 * Текущая страница и их число. Последняя страница прижимается к правому краю,
 * поэтому определяется по `max`, а не по номеру шага.
 * Состояние меняем только при реальном изменении: ref-функция полки вызывается
 * на каждом патче, и лишняя запись запустила бы бесконечный перерендер.
 */
function updateRail(slug: string) {
  const rail = railRefs.value[slug];
  if (!rail) return;

  const { pageWidth, pages, max } = railMetrics(rail);
  const page =
    max > 0 && rail.scrollLeft >= max - 2
      ? pages - 1
      : Math.min(pages - 1, Math.round(rail.scrollLeft / pageWidth));
  const current = railStates.value[slug];

  if (current && current.page === page && current.pages === pages) return;

  railStates.value[slug] = { page, pages };
}

function updateAllRails() {
  for (const slug of Object.keys(railRefs.value)) updateRail(slug);
}

function railPages(slug: string): number {
  return railStates.value[slug]?.pages ?? 1;
}

function railPage(slug: string): number {
  return railStates.value[slug]?.page ?? 0;
}

/** Переход на страницу: последнюю прижимаем к правому краю, чтобы кадр остался полным. */
function goToPage(slug: string, target: number) {
  const rail = railRefs.value[slug];
  if (!rail) return;

  const { pageWidth, pages, max } = railMetrics(rail);
  const page = Math.min(pages - 1, Math.max(0, target));
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  rail.scrollTo({
    left: Math.min(page * pageWidth, max),
    behavior: reduced ? "auto" : "smooth",
  });
}

/** Стрелка листает ровно одну страницу — столько карточек, сколько видно целиком. */
function scrollRail(slug: string, direction: -1 | 1) {
  goToPage(slug, railPage(slug) + direction);
}

/** Модули макета: появление блоков, меню, табы, маска, заявка, шкала разделов. */
let disposeLanding: (() => void) | undefined;
onMounted(() => {
  void nextTick(moveStyleLast);
  disposeLanding = initLanding({ submitLead });
  void nextTick(updateAllRails);
  window.addEventListener("resize", updateAllRails, { passive: true });
});
onBeforeUnmount(() => {
  window.removeEventListener("resize", updateAllRails);
  disposeLanding?.();
  disposeLanding = undefined;
});
</script>
<template>
  <div>
    <header class="site-header">
      <div class="shell flex items-center justify-between gap-6 py-3">
        <a class="brand" href="/">
          <svg
            class="brand__mark"
            viewBox="0 0 104 137"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            focusable="false"
          >
            <path fill="currentColor" d="M0 35.5L28 17.5V129.5L0 122Z" />
            <path
              fill="currentColor"
              d="M36 11.7L52 0L68 7.1V125.3L52 137L36 129.9Z"
            />
            <path
              class="brand__mark-accent"
              d="M76 7.5L104 15V101.5L76 119.5Z"
            />
          </svg>
          <span>
            <span class="brand__name"
              >СПЕЦ<span class="brand__accent">ТЕХ</span>РЕСУРС</span
            >
            <span class="brand__tag">аренда спецтехники</span>
          </span>
        </a>

        <nav
          class="hidden lg:flex items-center gap-6"
          aria-label="Основное меню"
        >
          <div class="nav-group">
            <button class="nav-group__btn" type="button" aria-haspopup="true">
              Каталог техники<svg
                class="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                <path d="m6 9.5 6 6 6-6" />
              </svg>
            </button>
            <div class="nav-group__list">
              <a
                v-for="category in categories"
                :key="category.slug"
                :href="categoryPath(category.slug)"
                >{{ category.title }}</a
              >
              <a href="/katalog">Весь каталог</a>
            </div>
          </div>
          <div class="nav-group">
            <button class="nav-group__btn" type="button" aria-haspopup="true">
              Услуги<svg
                class="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                <path d="m6 9.5 6 6 6-6" />
              </svg>
            </button>
            <div class="nav-group__list">
              <a
                v-for="service in services"
                :key="service.slug"
                :href="servicePath(service.slug)"
                >{{ service.title }}</a
              >
              <a href="/uslugi">Все услуги</a>
            </div>
          </div>
          <div class="nav-group">
            <button class="nav-group__btn" type="button" aria-haspopup="true">
              Цены и заявка<svg
                class="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                <path d="m6 9.5 6 6 6-6" />
              </svg>
            </button>
            <div class="nav-group__list">
              <a href="#ceny">Стоимость аренды</a>
              <a href="#smena">Условия смены</a>
              <a href="#zayavka">Оставить заявку</a>
              <a href="/kontakty">Контакты</a>
            </div>
          </div>
        </nav>

        <div class="header-contacts hidden lg:flex flex-col items-end gap-2">
          <a class="header-phone" :href="phoneLink">
            <svg
              class="header-phone__icon"
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
            >{{ phone }}
          </a>
          <a class="btn btn--ghost btn--sm header-cta" href="#zayavka"
            >Заказать технику</a
          >
        </div>

        <details class="mnav lg:hidden">
          <summary>
            Меню<svg
              class="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
              focusable="false"
            >
              <path d="m6 9.5 6 6 6-6" />
            </svg>
          </summary>
          <div class="mnav__panel">
            <div class="mnav__scroll">
              <p class="mnav__title">Разделы</p>
              <a href="/">Главная</a>
              <a href="#katalog">Каталог техники</a>
              <a href="#tehnika">Техника в парке</a>
              <a href="#uslugi">Услуги</a>
              <a href="#ceny">Стоимость</a>
              <a href="#faq">Вопросы и ответы</a>
              <p class="mnav__title mt-5">Разделы каталога</p>
              <a
                v-for="category in categories"
                :key="category.slug"
                :href="categoryPath(category.slug)"
                >{{ category.title }}</a
              >
              <p class="mnav__title mt-5">Услуги</p>
              <a
                v-for="service in services"
                :key="service.slug"
                :href="servicePath(service.slug)"
                >{{ service.title }}</a
              >
              <p class="mnav__title mt-5">Компания</p>
              <a href="#o-kompanii">О компании</a>
              <a href="#smena">Условия аренды</a>
              <a href="/kontakty">Контакты</a>
            </div>
            <div class="mnav__foot">
              <a class="btn btn--primary" href="#zayavka">Заказать технику</a>
              <a class="btn btn--ghost mnav-phone" :href="phoneLink">{{
                phone
              }}</a>
            </div>
          </div>
        </details>
      </div>
    </header>
    <main id="main">
      <nav class="rail" aria-label="Разделы страницы" data-rail>
        <div class="rail__plate" aria-hidden="true" />
        <ol class="rail__list">
          <li
            v-for="(item, index) in railItems"
            :key="item.id"
            class="rail__item"
          >
            <a
              class="rail__link"
              :class="{ 'is-active': index === 0 }"
              :href="`#${item.id}`"
              :data-rail-target="item.id"
              :aria-current="index === 0 ? 'true' : undefined"
            >
              <span class="rail__dot" aria-hidden="true" />
              <span class="rail__label">{{ item.label }}</span>
            </a>
          </li>
        </ol>
      </nav>

      <section class="hero hero--photo hero--photo-strong hero--steps">
        <div class="hero__bg" aria-hidden="true">
          <img
            class="hero__bg-img"
            :src="PHOTOS.hero"
            alt=""
            width="1600"
            height="1200"
            fetchpriority="high"
            decoding="async"
          />
        </div>
        <div class="shell hero__inner">
          <h1 class="h1 mt-5 max-w-5xl">
            <span>Аренда спецтехники в {{ city.nameIn }}</span>
            <span class="hero-steps">
              <span class="hero-steps__item">экскаваторы</span
              ><span class="hero-steps__item">автокраны</span
              ><span class="hero-steps__item">самосвалы</span
              ><span class="hero-steps__item">катки</span>
            </span>
            <span class="hero__accent">с машинистом</span>
          </h1>
          <p class="lead mt-5 max-w-3xl">{{ heroLead }}</p>
          <div class="mt-8 flex flex-wrap gap-3">
            <a class="btn btn--primary" href="#zayavka"
              >Заказать технику<svg
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
                <path d="M4 12h15M13.5 6.5 19 12l-5.5 5.5" /></svg></a
            ><a class="btn btn--ghost" href="#katalog"
              >Каталог техники<svg
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
          <ul class="mt-6 flex flex-wrap gap-2">
            <li v-for="fact in heroFacts" :key="fact.label" class="chip">
              <span>{{ fact.label }}</span>
              <b class="text-snow">{{ fact.value }}</b>
            </li>
          </ul>
        </div>
      </section>

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

      <!--
        Каталог моделей: четыре надгруппы по видам работ, у каждой — своя крупная
        секция. Внутри секции техника разложена по полкам разделов каталога:
        заголовок раздела, мета и ряд карточек со стрелками. Сама лента не едет:
        шаг делает посетитель. Карточка — вертикальная плитка (`HomeModelCard`):
        фото, название, три характеристики и цена; при наведении раскрывает полный
        список характеристик. Стоит сразу под «Быстрый подбор», до «О компании»:
        видно, какая именно машина поедет на объект и сколько стоит смена.
        Виды и цены «от» — в `#tehnika`. Состав надгрупп — `app/utils/model-groups.ts`.
      -->
      <div v-if="models.length" id="modeli">
        <section
          v-for="(section, sectionIndex) in modelSections"
          :id="`modeli-${section.slug}`"
          :key="section.slug"
          class="band relative overflow-x-clip pt-12! pb-12! lg:pt-14! lg:pb-14!"
          :class="toneStyle(section.tone).className"
          :style="sectionStyleVars(section.tone)"
        >
          <!-- Водяной номер секции: декоративная «цифра-призрак» в свободном правом
               верхнем углу (лид ограничен max-w-4xl). Рисуется до контента, поэтому
               текст и карточки всегда поверх.
               `max-lg:hidden`, а не `hidden lg:block`: в `/landing/style.css` есть
               собственное `.hidden{display:none}`, и оно перебивает `lg:block`. -->
          <span
            aria-hidden="true"
            class="pointer-events-none absolute top-28 right-6 max-lg:hidden text-[9.5rem] leading-none font-bold tabular-nums text-[var(--section-accent)] select-none opacity-[0.09]"
            >{{ section.number }}</span
          >
          <div class="shell relative">
            <div class="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
              <div class="flex min-w-0 items-start gap-4">
                <span
                  aria-hidden="true"
                  class="mt-0.5 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--section-accent)] text-[var(--section-on-accent)] shadow-[0_14px_26px_-14px_rgb(13_18_20/0.6)] lg:h-14 lg:w-14"
                >
                  <SiteIcon :name="section.icon" :stroke-width="1.5" class="h-6 w-6 lg:h-7 lg:w-7" />
                </span>
                <div class="min-w-0">
                  <span class="kicker models-kicker">
                    <span aria-hidden="true" class="inline-block h-0.5 w-6 bg-[var(--section-kicker)]" />
                    Каталог моделей · {{ section.numberLabel }}
                  </span>
                  <h2 class="h2 mt-3 text-[var(--section-ink)]">{{ section.title }}</h2>
                </div>
              </div>
              <div class="flex flex-wrap items-center gap-4">
                <p class="models-meta text-sm">
                  {{ section.modelsLabel }} · {{ section.shelvesLabel }}
                </p>
                <a v-if="sectionIndex === 0" class="btn btn--ghost" href="/katalog"
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
            <p class="lead models-lead mt-3 max-w-4xl">{{ section.lead }}</p>
            <ul class="mt-4 flex flex-wrap gap-2">
              <li
                v-for="tag in section.tags"
                :key="tag"
                class="inline-flex items-center rounded-full border border-[var(--section-chip-border)] bg-[var(--section-chip-bg)] px-3 py-1 text-xs font-semibold text-[var(--section-chip-ink)]"
              >
                {{ tag }}
              </li>
            </ul>
            <div class="mt-8 space-y-8">
              <div
                v-for="shelf in section.shelves"
                :key="shelf.category.slug"
                class="models-shelf border-t pt-6 first:border-t-0 first:pt-0"
              >
                <div class="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
                  <div class="models-shelf-head min-w-0 pl-3">
                    <h3 class="h3 text-[var(--section-ink)]">
                      <a
                        class="transition-colors hover:text-[var(--section-accent)]"
                        :href="categoryPath(shelf.category.slug)"
                        >{{ shelf.category.title }}</a
                      >
                    </h3>
                    <p class="models-meta mt-1 text-sm">
                      {{ shelf.numberLabel }} · {{ shelf.modelsLabel }} · {{ shelf.priceRange }}
                    </p>
                  </div>
                <div class="flex shrink-0 items-center gap-2">
                  <div
                    v-if="railPages(shelf.category.slug) > 1"
                    class="mr-1 flex items-center gap-1"
                    :aria-label="`Страницы моделей раздела «${shelf.category.title}»`"
                  >
                    <button
                      v-for="page in railPages(shelf.category.slug)"
                      :key="page"
                      type="button"
                      class="inline-flex h-6 w-6 items-center justify-center rounded-full"
                      :aria-label="`Страница ${page} из ${railPages(shelf.category.slug)}`"
                      :aria-current="page - 1 === railPage(shelf.category.slug) ? 'true' : undefined"
                      @click="goToPage(shelf.category.slug, page - 1)"
                    >
                      <span
                        class="shelf-dot h-2 w-2 rounded-full transition-colors"
                        :class="{ 'shelf-dot--active': page - 1 === railPage(shelf.category.slug) }"
                      />
                    </button>
                  </div>
                  <button
                    type="button"
                    class="shelf-btn inline-flex h-9 w-9 items-center justify-center rounded-full border transition"
                    :disabled="railPage(shelf.category.slug) === 0"
                    :aria-label="`Предыдущие модели раздела «${shelf.category.title}»`"
                    @click="scrollRail(shelf.category.slug, -1)"
                  >
                    <svg
                      class="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.8"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path d="M20 12H5M10.5 6.5 5 12l5.5 5.5" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="shelf-btn inline-flex h-9 w-9 items-center justify-center rounded-full border transition"
                    :disabled="railPage(shelf.category.slug) >= railPages(shelf.category.slug) - 1"
                    :aria-label="`Следующие модели раздела «${shelf.category.title}»`"
                    @click="scrollRail(shelf.category.slug, 1)"
                  >
                    <svg
                      class="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.8"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path d="M4 12h15M13.5 6.5 19 12l-5.5 5.5" />
                    </svg>
                  </button>
                </div>
              </div>
              <ul
                :ref="(el) => setRail(shelf.category.slug, el)"
                class="models-rail mt-4 flex gap-4 overflow-x-auto pb-1"
                :aria-label="`Модели раздела «${shelf.category.title}»`"
                @scroll.passive="updateRail(shelf.category.slug)"
              >
                <li
                  v-for="item in shelf.models"
                  :key="item.id"
                  class="w-[86vw] shrink-0 p-2 sm:w-[320px] xl:w-[380px]"
                >
                  <HomeModelCard :model="item" :city-slug="city.slug" />
                </li>
              </ul>
              </div>
            </div>

            <p
              v-if="sectionIndex === modelSections.length - 1"
              class="note models-note mt-6 border-l-2 px-4 py-3 text-sm"
            >
              {{ priceDisclaimer }}
            </p>
          </div>
        </section>
      </div>

      <section id="o-kompanii" class="band on-light">
        <div class="shell">
          <div class="about">
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
                Парк собственный, машинисты в штате, техника обслуживается между
                сменами, диспетчер на связи {{ workingHours }}. Один договор
                закрывает машину, экипаж, доставку и документы — подрядчиков под
                объект собирать не нужно.
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
            <div class="catcards">
              <article
                v-for="card in advantageCards"
                :key="card.title"
                class="catcard reveal"
              >
                <figure
                  v-if="card.photo"
                  class="catcard__media"
                  role="img"
                  :aria-label="card.title"
                  :style="{ backgroundImage: `url('${card.photo}')` }"
                >
                  <span class="catcard__num">{{ card.number }}</span>
                </figure>
                <div class="catcard__head">
                  <svg
                    class="catcard__icon"
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
                  <h3 class="catcard__title">{{ card.title }}</h3>
                </div>
                <p class="catcard__text">{{ card.text }}</p>
              </article>
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
                <a class="btn btn--ghost" :href="categoryPath(card.slug)"
                  >Смотреть раздел<svg
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
                      <a :href="typePath(type.slug, city.slug)">{{
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
                <div class="mt-6">
                  <a class="btn btn--ghost" :href="categoryPath(category.slug)"
                    >Расчёт по разделу «{{ category.title }}»<svg
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

      <section id="usloviya" class="band feat-band">
        <div class="shell">
          <h2 class="sr-only">Условия аренды спецтехники</h2>
          <ul class="featstrip__row">
            <li class="featstrip-item">
              <svg
                class="featstrip-item__icon"
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
                  d="M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17zm0 4.3V12l3.4 2"
                />
              </svg>
              <span>
                <span class="featstrip-item__title">Смена 8 часов</span>
                <span class="featstrip-item__text"
                  >минимум 4 часа оплачиваемого времени</span
                >
              </span>
            </li>
            <li class="featstrip-item">
              <svg
                class="featstrip-item__icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17z" />
                <path d="M2.5 12h4M17.5 12h4" />
              </svg>
              <span>
                <span class="featstrip-item__title">Подача от 4 часов</span>
                <span class="featstrip-item__text"
                  >по {{ city.nameIn }} при свободной машине</span
                >
              </span>
            </li>
            <li class="featstrip-item">
              <svg
                class="featstrip-item__icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M3.5 7.5h9.5v9H3.5zM13 11h3.9l3.1 3.2v2.3H13z" />
                <path
                  d="M6.5 20a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6zM17 20a1.8 1.8 0 1 0 0-3.6A1.8 1.8 0 0 0 17 20z"
                />
              </svg>
              <span>
                <span class="featstrip-item__title">Своя техника</span>
                <span class="featstrip-item__text"
                  >без субподряда и посредников</span
                >
              </span>
            </li>
            <li class="featstrip-item">
              <svg
                class="featstrip-item__icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M12 12a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2z" />
                <path d="M4.5 20.4a7.5 7.5 0 0 1 15 0" />
              </svg>
              <span>
                <span class="featstrip-item__title">Экипаж в штате</span>
                <span class="featstrip-item__text"
                  >машинисты с допусками и стажем</span
                >
              </span>
            </li>
            <li class="featstrip-item">
              <svg
                class="featstrip-item__icon"
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
              <span>
                <span class="featstrip-item__title">Документы для юрлиц</span>
                <span class="featstrip-item__text"
                  >договор, счёт, УПД, путевые листы</span
                >
              </span>
            </li>
          </ul>
        </div>
      </section>

      <section id="raschet" class="band on-light">
        <div class="bg-survey" aria-hidden="true">
          <svg
            class="bg-survey__svg"
            viewBox="0 0 240 240"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            <path class="bg-survey__thin" d="M120 42V28" />
            <circle class="bg-survey__thin" cx="120" cy="22" r="5" />
            <rect
              class="bg-survey__body"
              x="92"
              y="42"
              width="56"
              height="38"
              rx="4"
            />
            <circle class="bg-survey__thin" cx="120" cy="61" r="5" />
            <path class="bg-survey__body" d="M92 52H66a8 8 0 0 0 0 16h26" />
            <path class="bg-survey__thin" d="M66 52v16" />
            <path
              class="bg-survey__leg"
              d="M120 80 44 196M120 80l76 116M120 80v96"
            />
            <path
              class="bg-survey__thin"
              d="M30 196h28M182 196h28M106 176h28"
            />
            <path class="bg-survey__brace" d="M81 140h78" />
          </svg>
        </div>
        <div class="shell">
          <div class="context">
            <div class="context__copy">
              <span class="kicker">Условия объекта</span>
              <h2 class="h2 mt-4">
                Сначала смотрим на объект, потом подбираем машину
              </h2>
              <p class="lead mt-4 max-w-4xl">
                Подбор техники начинается не с прайса, а с условий работы:
                подъездные пути, грунты, стеснённость площадки, режим объекта и
                сроки. От них зависит класс машины, сменное оборудование и
                способ доставки.
              </p>
              <ol class="context__rows">
                <li class="context__row reveal">
                  <span class="context__num">01</span>
                  <div>
                    <h3 class="context__title">Подъезды и площадка</h3>
                    <p class="context__text">
                      Какая ширина проезда, есть ли ограничения по нагрузке на
                      ось, где можно развернуть самосвал, автокран или
                      низкорамный трал.
                    </p>
                  </div>
                </li>
                <li class="context__row reveal">
                  <span class="context__num">02</span>
                  <div>
                    <h3 class="context__title">Грунты и рельеф</h3>
                    <p class="context__text">
                      Слабые и обводнённые грунты требуют другой машины либо
                      временного покрытия; уклон и перепад высот влияют на
                      работу крана и экскаватора.
                    </p>
                  </div>
                </li>
                <li class="context__row reveal">
                  <span class="context__num">03</span>
                  <div>
                    <h3 class="context__title">Стеснённость и коммуникации</h3>
                    <p class="context__text">
                      Работа в охранных зонах ЛЭП и трубопроводов идёт по
                      наряду-допуску; от этого зависит вылет стрелы, габарит
                      машины и порядок допуска на площадку.
                    </p>
                  </div>
                </li>
                <li class="context__row reveal">
                  <span class="context__num">04</span>
                  <div>
                    <h3 class="context__title">Режим и сроки</h3>
                    <p class="context__text">
                      Круглосуточные и вахтовые графики, работа в выходные,
                      простои из-за погоды и очередь машин на выезде учитываются
                      в смете до подписания договора.
                    </p>
                  </div>
                </li>
              </ol>
            </div>
            <figure class="context__visual reveal">
              <figcaption class="context__caption">
                <span>Схема площадки</span>
                <span class="context__hint" aria-hidden="true"
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
                    <path d="m6 9.5 6 6 6-6" /></svg
                ></span>
              </figcaption>
              <div class="context__scene">
                <svg
                  class="plan"
                  viewBox="0 0 640 480"
                  role="img"
                  aria-label="Условная схема площадки: зона работ с объектом и оборудованием, проезды и направление подъезда техники"
                  focusable="false"
                >
                  <defs>
                    <pattern
                      id="plan-hatch"
                      width="12"
                      height="12"
                      patternUnits="userSpaceOnUse"
                      patternTransform="rotate(38)"
                    >
                      <path class="plan__hatch" d="M0 0V12" />
                    </pattern>
                  </defs>
                  <rect
                    class="plan__ground"
                    x="40"
                    y="36"
                    width="560"
                    height="408"
                    rx="6"
                  />
                  <rect
                    class="plan__frame"
                    x="40"
                    y="36"
                    width="560"
                    height="408"
                    rx="6"
                  />
                  <g class="plan__corners">
                    <path d="M40 68V36h32" />
                    <path d="M568 36h32v32" />
                    <path d="M600 412v32h-32" />
                    <path d="M72 444H40v-32" />
                  </g>
                  <path class="plan__road" d="M40 380H560V140" />
                  <path class="plan__road-line" d="M40 380H560V140" />
                  <rect
                    class="plan__zone"
                    x="104"
                    y="96"
                    width="300"
                    height="232"
                    rx="3"
                  />
                  <rect
                    class="plan__zone-edge"
                    x="104"
                    y="96"
                    width="300"
                    height="232"
                    rx="3"
                  />
                  <rect
                    class="plan__building"
                    x="140"
                    y="132"
                    width="228"
                    height="164"
                    rx="2"
                  />
                  <path
                    class="plan__cell"
                    d="M216 132V296M292 132V296M140 178H368M140 224H368M140 270H368"
                  />
                  <rect
                    class="plan__unit"
                    x="162"
                    y="152"
                    width="52"
                    height="30"
                    rx="1.5"
                  />
                  <rect
                    class="plan__unit"
                    x="162"
                    y="240"
                    width="52"
                    height="32"
                    rx="1.5"
                  />
                  <circle class="plan__ring" cx="116" cy="316" r="24" />
                  <circle class="plan__ring" cx="116" cy="316" r="42" />
                  <g class="plan__markers">
                    <circle class="plan__marker" cx="116" cy="108" r="5" />
                    <circle class="plan__marker" cx="392" cy="108" r="5" />
                    <circle class="plan__marker" cx="116" cy="316" r="5" />
                    <circle class="plan__marker" cx="392" cy="316" r="5" />
                  </g>
                  <path
                    class="plan__route"
                    d="M596 62C556 92 470 104 404 120"
                  />
                  <path class="plan__arrow" d="M420 114 404 120 410 136" />
                </svg>
              </div>
              <div class="context__legend">
                <span class="context__legend-item">
                  <i
                    class="context__swatch context__swatch--zone"
                    aria-hidden="true"
                  />
                  Зона работ
                </span>
                <span class="context__legend-item">
                  <i
                    class="context__swatch context__swatch--building"
                    aria-hidden="true"
                  />
                  Объект и оборудование
                </span>
                <span class="context__legend-item">
                  <i
                    class="context__swatch context__swatch--marker"
                    aria-hidden="true"
                  />
                  Точки подъезда и работы
                </span>
                <span class="context__legend-item">
                  Условная схема, без масштаба
                </span>
              </div>
            </figure>
          </div>
        </div>
      </section>

      <section id="uslugi" class="band flame-band">
        <div class="shell">
          <span class="kicker">Услуги</span>
          <h2 class="h2 mt-4">{{ services.length }} услуг, где техника — только начало</h2>
          <p class="lead mt-4 max-w-4xl">
            Берём на себя цикл работ целиком: разработать грунт, вывезти его,
            снести строение, спланировать участок, перевезти технику тралом. В
            каждом блоке видно, что делаем и какой техникой; стоимость считаем по
            объекту, а не по среднему прайсу.
          </p>
          <div class="shots mt-10">
            <figure
              v-for="card in serviceCards"
              :key="card.slug"
              class="shot reveal"
            >
              <img
                v-if="card.photo"
                class="shot__img"
                :src="card.photo"
                :alt="card.title"
                width="1536"
                height="960"
                loading="lazy"
                decoding="async"
              />
              <figcaption class="shot__cap">
                <span class="shot__title"
                  ><a :href="servicePath(card.slug)">{{ card.title }}</a></span
                >
                <p class="panel__meta">{{ card.description }}</p>
                <div class="shot__tags flex flex-wrap gap-2">
                  <span v-for="chip in card.chips" :key="chip" class="chip">{{
                    chip
                  }}</span>
                </div>
              </figcaption>
            </figure>
          </div>
          <div class="mt-10 flex flex-wrap items-center gap-3">
            <a class="btn btn--primary" href="#zayavka"
              >Обсудить работы на объекте<svg
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
          <p
            class="note mt-6 border-l-2 px-4 py-3 text-sm border-ink/40 bg-ink/5"
          >
            {{ priceDisclaimer }}
          </p>
        </div>
      </section>

      <section id="zadacha" class="band on-light">
        <div class="shell">
          <span class="kicker">Задача</span>
          <h2 class="h2 mt-4">Аренда техники — это не только машина</h2>
          <p class="lead mt-4 max-w-4xl">
            Объект редко обходится одной единицей: сегодня нужен экскаватор,
            завтра автокран, послезавтра самосвал. Считаем смету под весь фронт
            работ сразу, чтобы техника не простаивала в ожидании.
          </p>
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
                <path d="M3 16.5V12h3.5V8.5h6V12H18l3 2.5v2h-2" />
                <path d="M6.5 16.5h11" />
                <path
                  d="M6 19.5a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6zM17 19.5a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6z"
                />
              </svg>
              <h3 class="h3 mt-5">Под объект нужен не один класс техники</h3>
              <p class="panel__meta mt-3">
                Экскаватор-погрузчик на благоустройстве, гусеничный экскаватор
                на котловане, автокран на монтаже — это три разные машины в
                разные дни. Держим весь набор в собственном парке, чтобы
                заказчик не собирал технику по частям и не терял дни на
                переговорах.
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
                <circle cx="12" cy="12" r="8.5" />
                <path d="M12 7.5V12l3.2 2" />
              </svg>
              <h3 class="h3 mt-5">Простой машины дороже самой аренды</h3>
              <p class="panel__meta mt-3">
                Вставшая из-за поломки техника останавливает бригаду и сдвигает
                весь график. Поэтому машины проходят ТО между сменами, на объект
                выходит резервная единица, а сроки замены фиксируются в договоре
                — не «как получится».
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
                  d="M14 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V7.5z"
                />
                <path d="M14 3v4.5h4.5" />
                <path d="M9 12.5h6M9 16h4" />
              </svg>
              <h3 class="h3 mt-5">
                Документы важнее, чем «договоримся на месте»
              </h3>
              <p class="panel__meta mt-3">
                Бухгалтерии и проверяющим нужны договор, счёт, акты и путевые
                листы, а тендерной комиссии — справки и подтверждение опыта.
                Работаем по договору с полным комплектом закрывающих документов.
              </p>
            </article>
          </div>
        </div>
        <div class="deco deco--corner deco--br" aria-hidden="true">
          <span class="deco__angle" /><span class="deco__dot" />
        </div>
      </section>

      <section id="formaty" class="band grid-bg">
        <div class="shell">
          <span class="kicker">Два формата работы</span>
          <h2 class="h2 mt-4">Одна машина на смену или парк на весь объект</h2>
          <p class="lead mt-4 max-w-4xl">
            Форматы совмещаются: можно взять один экскаватор на два дня или
            отдать весь фронт работ нам — от расчистки площадки до вывоза грунта
            и забивки свай. Условия, стоимость и ответственность фиксируются
            договором.
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
                  <li>Машинист в штате, с допусками и опытом на объектах</li>
                  <li>Заправка, ТО и текущий ремонт — наша зона</li>
                  <li>Смена 8 или 10 часов, минимальный заказ — одна смена</li>
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
                  <li>Замена при поломке из резерва без сдвига графика</li>
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
          <h2 class="h2 mt-4">Смена, топливо и доставка — как это устроено</h2>
          <p class="lead mt-4 max-w-4xl">
            Смена — 8 часов, минимум 4 оплачиваемых часа, переработка — по
            часовому тарифу. ГСМ по умолчанию за счёт заказчика, обслуживание и
            ремонт — наши. Как это считается, что нужно для допуска и как
            доставляем машину — по вкладкам.
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
                Заявку ведёт один диспетчер: подбирает машину, считает смету с
                доставкой, готовит договор и следит за подачей. Сроки каждого
                шага известны до начала работ — «уточним по ходу» не бывает.
              </p>
              <ul class="process__points">
                <li class="process__point">
                  <span class="process__mark"
                    ><svg
                      class="h-3 w-3"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.6"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path d="m4.5 12.5 5 5 10-11" /></svg
                  ></span>
                  <span
                    >Один договор на технику, экипаж, доставку и документы</span
                  >
                </li>
                <li class="process__point">
                  <span class="process__mark"
                    ><svg
                      class="h-3 w-3"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.6"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path d="m4.5 12.5 5 5 10-11" /></svg
                  ></span>
                  <span
                    >Цена фиксируется в смете до подачи машины, переработка — по
                    часовому тарифу</span
                  >
                </li>
                <li class="process__point">
                  <span class="process__mark"
                    ><svg
                      class="h-3 w-3"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.6"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path d="m4.5 12.5 5 5 10-11" /></svg
                  ></span>
                  <span
                    >Полный комплект закрывающих документов, включая справки для
                    тендера</span
                  >
                </li>
              </ul>
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

      <section id="populyarnoe" class="band flame-band">
        <div class="shell">
          <span class="kicker">Популярная техника</span>
          <h2 class="h2 mt-4">Что заказывают чаще всего</h2>
          <p class="lead mt-4 max-w-4xl">
            Гусеничный экскаватор, автокран, самосвал и каток закрывают
            большинство заявок: котлован и траншеи, монтаж конструкций, вывоз
            грунта, уплотнение основания. Цена — за смену 8 часов с машинистом по
            данным каталога; доставку и ГСМ считаем отдельно.
          </p>
          <ol class="levels mt-10">
            <li
              v-for="(card, index) in popularTypes"
              :key="card.slug"
              class="panel panel--practice levelcard reveal"
              :class="{ 'panel--accent': index === 0 }"
            >
              <h3 class="levelcard__title">{{ card.title }}</h3>
              <span class="levelcard__rank">{{ card.rank }}</span>
              <dl class="levelcard__specs">
                <div class="levelcard__spec">
                  <dt class="levelcard__label">Цена</dt>
                  <dd class="levelcard__value">{{ card.price }}</dd>
                </div>
                <div class="levelcard__spec">
                  <dt class="levelcard__label">Для чего берут</dt>
                  <dd class="levelcard__value">{{ card.purpose }}</dd>
                </div>
                <div class="levelcard__spec">
                  <dt class="levelcard__label">Условия</dt>
                  <dd class="levelcard__value">{{ card.conditions }}</dd>
                </div>
              </dl>
              <div class="mt-6">
                <a class="btn btn--ghost" :href="card.href"
                  >Заказать<svg
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
            </li>
          </ol>
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
                <path d="M12 3 3 7.5 12 12l9-4.5z" />
                <path d="M3 12.5 12 17l9-4.5" />
                <path d="M3 17 12 21.5 21 17" />
              </svg>
              <h3 class="h3 mt-5">Закрывающие документы</h3>
              <p class="panel__meta mt-3">
                Договор, счёт, акты, путевые листы и счета-фактуры — в срок, без
                напоминаний. Комплект подходит для бухгалтерии, тендеров и
                проверок.
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
            Что получает юрлицо: договор, закрывающие, тендер
          </h2>
          <p class="lead mt-4 max-w-4xl">
            Комплект документов зависит от формы оплаты и требований вашей
            бухгалтерии или тендерного отдела. Ниже — что входит в каждый пакет;
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
        </div>
      </section>

      <section id="pochemu-my" class="band flame-band">
        <div class="shell">
          <div class="practice-split">
            <div class="practice-intro">
              <span class="kicker">Почему напрямую</span>

              <h2 class="h3 mt-4">
                Работа с собственником парка — меньше посредников в смете
              </h2>
              <p class="lead mt-4">
                Посредник добавляет в стоимость свою маржу и не отвечает за
                фактическое состояние машины. Мы держим парк сами: диспетчер
                видит, где каждая единица, и может перепланировать выход без
                переторговки с третьей стороной.
              </p>
              <p class="note practice-intro__note">
                Документы на технику, допуски машинистов и страховая
                ответственность — направляем по запросу в составе предложения и
                тендерной документации.
              </p>
            </div>
            <ol class="panel panel--practice practice-sheet">
              <li class="practice reveal">
                <span class="practice__num">01</span>
                <div class="practice__body">
                  <div class="practice__head">
                    <svg
                      class="h-5 w-5 practice__icon"
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
                    <h3 class="practice__title">
                      Машина, а не «найдём у партнёров»
                    </h3>
                  </div>
                  <p class="practice__text">
                    Каждая единица в каталоге — наша: известны год выпуска,
                    состояние, наработка и комплект сменного оборудования. Мы не
                    обещаем технику, которой у нас нет, и не подменяем класс
                    машины в день подачи.
                  </p>
                </div>
              </li>
              <li class="practice reveal">
                <span class="practice__num">02</span>
                <div class="practice__body">
                  <div class="practice__head">
                    <svg
                      class="h-5 w-5 practice__icon"
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
                    <h3 class="practice__title">
                      Один диспетчер на все заявки
                    </h3>
                  </div>
                  <p class="practice__text">
                    Заявки, переносы и замены идут через одного диспетчера,
                    который знает график парка на неделю вперёд. Не нужно
                    обзванивать менеджеров, чтобы сдвинуть выход машины на день
                    или добавить вторую единицу.
                  </p>
                </div>
              </li>
              <li class="practice reveal">
                <span class="practice__num">03</span>
                <div class="practice__body">
                  <div class="practice__head">
                    <svg
                      class="h-5 w-5 practice__icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.6"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <rect x="2.5" y="5.5" width="19" height="13" rx="1.5" />
                      <path d="M2.5 10h19" />
                      <path d="M6 14.5h4" />
                    </svg>
                    <h3 class="practice__title">Смета без скрытых позиций</h3>
                  </div>
                  <p class="practice__text">
                    Мобилизация, работа на объекте, переработка и ГСМ расписаны
                    отдельными строками. Итог совпадает с договором, а не
                    пересчитывается «по факту» после закрытия смены.
                  </p>
                </div>
              </li>
              <li class="practice reveal">
                <span class="practice__num">04</span>
                <div class="practice__body">
                  <div class="practice__head">
                    <svg
                      class="h-5 w-5 practice__icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.6"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path d="M8 21 12 3l4 18" />
                      <path d="M6.4 15h11.2M9.2 9h5.6" />
                      <path d="M6 21h12" />
                    </svg>
                    <h3 class="practice__title">
                      Допуск на объект и требования площадки
                    </h3>
                  </div>
                  <p class="practice__text">
                    Учитываем внутренние регламенты заказчика: пропуска,
                    наряд-допуск, работу в охранных зонах и режимные
                    ограничения. Документы на технику и удостоверения машинистов
                    готовим заранее, а не в день выезда.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </section>

      <section id="dopusk" class="band grid-bg">
        <div class="shell">
          <span class="kicker">Допуск и подача</span>
          <h2 class="h2 mt-4">Что нужно от заказчика до выхода машины</h2>
          <p class="lead mt-4 max-w-4xl">
            Список короткий, но без него машина не заедет на объект: пропуска,
            наряд-допуск и место для стоянки оформляются заранее. Диспетчер
            подскажет, что из этого нужно именно на вашей площадке.
          </p>
          <div class="mt-8">
            <div class="docrow">
              <svg
                class="h-5 w-5"
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
              ><span class="text-sm text-mist"
                >Заявка с адресом объекта, характером работ и сроками — по ней
                подбираем машину и считаем смену</span
              >
            </div>
            <div class="docrow">
              <svg
                class="h-5 w-5"
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
              ><span class="text-sm text-mist"
                >Пропуска на технику и машинистов, режим въезда и время подачи
                на территорию</span
              >
            </div>
            <div class="docrow">
              <svg
                class="h-5 w-5"
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
                <path d="m9 12.2 2.2 2.3 4.3-4.5" /></svg
              ><span class="text-sm text-mist"
                >Наряд-допуск, если работы идут в охранных зонах ЛЭП,
                трубопроводов или на действующем производстве</span
              >
            </div>
            <div class="docrow">
              <svg
                class="h-5 w-5"
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
              ><span class="text-sm text-mist"
                >Схема подъезда и место для стоянки: ширина проезда, покрытие и
                ограничения по нагрузке на ось</span
              >
            </div>
            <div class="docrow">
              <svg
                class="h-5 w-5"
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
              ><span class="text-sm text-mist"
                >Ответственный на площадке: принимает машину, подписывает
                путевой лист и акт смены</span
              >
            </div>
            <div class="docrow">
              <svg
                class="h-5 w-5"
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
              ><span class="text-sm text-mist"
                >Бытовые условия для экипажа при вахтовом графике: помещение для
                отдыха и место для пересменки</span
              >
            </div>
            <div class="docrow">
              <svg
                class="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M4 16.5V12h3.5V8.5h6V12H18l3 2.5v2h-2" />
                <path d="M6.5 16.5h11" />
                <path
                  d="M6 19.5a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6zM17 19.5a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6z"
                /></svg
              ><span class="text-sm text-mist"
                >Точка заправки или порядок передачи ГСМ, если топливо не входит
                в смену</span
              >
            </div>
          </div>
        </div>
      </section>

      <section id="geografiya" class="band on-light">
        <div class="shell">
          <span class="kicker">География</span>
          <h2 class="h2 mt-4">Москва и область: тралом и своим ходом</h2>
          <p class="lead mt-4 max-w-4xl">
            Везём технику на объект сами: тяжёлые машины — низкорамным тралом,
            колёсную технику — своим ходом. Адрес, габариты машины и время
            подачи диспетчер проверяет до подписания договора.
          </p>
          <ul class="tick mt-7">
            <li>
              Доставка тралом: гусеничные экскаваторы, катки, сваебойные
              установки
            </li>
            <li>
              Своим ходом по городу и области: экскаваторы-погрузчики,
              самосвалы, автокраны
            </li>
            <li>
              Мобилизацию считаем по адресу объекта — отдельной строкой в смете
            </li>
            <li>
              Подача в выходные и круглосуточные смены — по согласованному
              графику
            </li>
          </ul>
          <p class="note mt-6">
            Выезд за пределы области — по согласованию: время в пути и обратную
            мобилизацию считаем заранее и фиксируем в договоре.
          </p>
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

          <p class="cta-key">
            <svg
              class="cta-key__icon"
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
              <path d="m9 12.2 2.2 2.3 4.3-4.5" /></svg
            ><span
              >Работаем по договору: техника, экипаж, доставка и документы —
              <strong class="cta-key__hi"
                >один подрядчик на весь объём работ</strong
              >.</span
            >
          </p>
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

      <section id="tendery" class="band on-light">
        <div class="shell">
          <span class="kicker">Тендеры и госпредприятия</span>
          <h2 class="h2 mt-4">Готовим документацию для ЭТП, 44-ФЗ и 223-ФЗ</h2>
          <p class="lead mt-4 max-w-4xl">
            Работаем с закупками сетевых, генерирующих и промышленных компаний:
            помогаем заказчику сформировать технические требования так, чтобы к
            поставке не прошли машины без подтверждённого состояния и допусков.
          </p>
          <ul class="tick mt-7">
            <li>
              Техническое задание и обоснование требований к технике и сменному
              оборудованию
            </li>
            <li>
              Расчёт стоимости смены, мобилизации и ГСМ как приложение к
              закупочной документации
            </li>
            <li>Справки и референс-лист по запросу</li>
            <li>
              Документы для подтверждения опыта: акты, отзывы, путевые листы
            </li>
          </ul>
        </div>
        <div class="deco deco--seal deco--br" aria-hidden="true">
          <span class="deco__seal"
            ><span class="deco__rings" aria-hidden="true"
              ><i class="deco__ring deco__ring--near" /><i
                class="deco__ring deco__ring--far" /><i
                class="deco__ring-dot" /></span
            ><svg
              class="deco__seal-svg"
              viewBox="0 0 132 168"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
              focusable="false"
            >
              <path
                class="deco__seal-line"
                d="M24 8h66l26 26v108a16 16 0 0 1-16 16H24a16 16 0 0 1-16-16V24a16 16 0 0 1 16-16Z"
              />
              <path
                class="deco__seal-line"
                d="M90 8c0 12 1 18 6 22 5 4 12 4 20 4"
              />
              <path
                class="deco__seal-line"
                d="M28 58h70M28 78h64M28 98h58M28 118h20"
              />
              <circle class="deco__seal-ring" cx="85" cy="132" r="30" />
              <circle class="deco__seal-ring" cx="85" cy="132" r="19" />
              <path class="deco__seal-check" d="M72 132l7.5 7.5 20-14.8" /></svg
          ></span>
          <span class="deco__ticks"
            ><i class="deco__tick" /><i class="deco__tick" /><i
              class="deco__tick" /><i class="deco__tick" /><i
              class="deco__tick" /><i class="deco__tick" /><i
              class="deco__tick" /><i class="deco__tick" /><i
              class="deco__tick" /><i class="deco__tick" /><i
              class="deco__tick"
          /></span>
        </div>
      </section>

      <section id="ceny" class="band grid-bg">
        <div class="shell">
          <span class="kicker">Ориентиры</span>
          <h2 class="h2 mt-4">Прайс: {{ parkTypeLabel }} — цена за смену</h2>
          <p class="lead mt-4 max-w-4xl">
            Цены выгружены из каталога: смена 8 часов с машинистом по каждому
            виду. Итог зависит от объекта, сроков и доставки, но порядок цифр
            виден до звонка. Смету с мобилизацией и ГСМ пришлём по заявке.
          </p>
          <div class="tabs mt-10" data-tabs>
            <div class="tabs__list" role="tablist" aria-label="Разделы техники">
              <button
                v-for="category in categories"
                :id="`ceny-tab-${category.slug}`"
                :key="category.slug"
                type="button"
                class="tabs__tab"
                role="tab"
                :aria-controls="`ceny-panel-${category.slug}`"
              >
                {{ category.title
                }}<span class="tabs__count">{{ category.types.length }}</span>
              </button>
            </div>
            <div class="tabs__panels">
              <section
                v-for="category in categories"
                :id="`ceny-panel-${category.slug}`"
                :key="category.slug"
                class="tabs__panel"
                role="tabpanel"
                :aria-labelledby="`ceny-tab-${category.slug}`"
              >
                <p class="lead">{{ category.shortDesc }}</p>
                <div class="table-scroll mt-8">
                  <table class="tbl">
                    <thead>
                      <tr>
                        <th scope="col">Вид техники</th>
                        <th scope="col">Ориентир</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="type in category.types" :key="type.slug">
                        <td>
                          <a :href="typePath(type.slug, city.slug)">{{
                            type.name
                          }}</a>
                        </td>
                        <td>
                          {{ formatPriceShort(type.priceFrom, type.priceUnit) }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p
                  class="note mt-6 border-l-2 px-4 py-3 text-sm border-flame/70 bg-flame/5"
                >
                  {{ priceDisclaimer }}
                </p>
                <div class="mt-6">
                  <a class="btn btn--ghost" :href="categoryPath(category.slug)"
                    >Расчёт по этому разделу<svg
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
              </section>
            </div>
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
          class="shell grid gap-10 lg:grid-cols-[1fr_minmax(0,430px)] lg:items-start lg:gap-14"
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

          <form
            class="panel panel--accent panel--form p-5 md:p-6"
            method="post"
            :action="emailLink"
            enctype="text/plain"
            data-form
          >
            <input type="hidden" name="Раздел" value="Главная" />

            <div class="grid gap-4">
              <div class="field">
                <label for="f-name">Имя</label>
                <input
                  id="f-name"
                  name="name"
                  type="text"
                  placeholder="Как к вам обращаться"
                  required
                  autocomplete="name"
                />
              </div>
              <div class="field">
                <label for="f-phone">Телефон</label>
                <input
                  id="f-phone"
                  name="phone"
                  type="tel"
                  placeholder="+7 (___) ___-__-__"
                  required
                  autocomplete="tel"
                />
              </div>
              <div class="field">
                <label for="f-comment">Комментарий</label>
                <textarea
                  id="f-comment"
                  name="comment"
                  rows="3"
                  placeholder="Вид работ, объект, объём и сроки — коротко"
                />
              </div>
            </div>

            <p
              class="form-status mt-4"
              data-form-status
              data-form-error="Проверьте поля, отмеченные красным, и попробуйте снова."
              role="status"
              aria-live="polite"
            >
              Заявка отправлена: диспетчер свяжется с вами в рабочее время и
              подберёт технику под задачу.
            </p>

            <div class="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center">
              <button class="btn btn--primary btn--wide" type="submit">
                Отправить заявку<svg
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
                  <path d="M4 12h15M13.5 6.5 19 12l-5.5 5.5" />
                </svg>
              </button>
              <span class="form-note max-w-[22rem]"
                >Нажимая кнопку, вы соглашаетесь на обработку персональных
                данных.</span
              >
            </div>
            <p class="form-note mt-3">{{ priceDisclaimer }}</p>
          </form>
        </div>
      </section>
    </main>
    <footer class="site-footer">
      <div class="shell">
        <div class="grid gap-10 lg:grid-cols-[1.5fr_repeat(4,1fr)]">
          <div>
            <a class="brand" href="/">
              <svg
                class="brand__mark"
                viewBox="0 0 104 137"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                focusable="false"
              >
                <path fill="currentColor" d="M0 35.5L28 17.5V129.5L0 122Z" />
                <path
                  fill="currentColor"
                  d="M36 11.7L52 0L68 7.1V125.3L52 137L36 129.9Z"
                />
                <path
                  class="brand__mark-accent"
                  d="M76 7.5L104 15V101.5L76 119.5Z"
                />
              </svg>
              <span>
                <span class="brand__name">{{ brandName }}</span>
                <span class="brand__tag">аренда спецтехники</span>
              </span>
            </a>
            <p class="mt-5 max-w-sm text-sm text-mist">
              {{ companyName }} — аренда спецтехники с экипажем: экскаваторы,
              автокраны, самосвалы, катки, погрузчики и сваебойные установки.
              Работаем по договору, с доставкой на объект и полным комплектом
              документов.
            </p>
            <ul class="mt-6 space-y-2">
              <li>
                <a class="inline-flex items-center gap-2" :href="phoneLink"
                  ><svg
                    class="h-4 w-4 text-flame"
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
                <a class="inline-flex items-center gap-2" :href="emailLink"
                  ><svg
                    class="h-4 w-4 text-flame"
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
              <li class="inline-flex items-center gap-2 text-sm text-mist">
                <svg
                  class="h-4 w-4 text-flame"
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
              <li class="inline-flex items-center gap-2 text-sm text-mist">
                <svg
                  class="h-4 w-4 text-flame"
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
                ><template v-else>{{ city.name }} и область</template>
              </li>
            </ul>
          </div>

          <div>
            <h3>Каталог</h3>
            <ul class="space-y-2">
              <li v-for="category in categories" :key="category.slug">
                <a :href="categoryPath(category.slug)">{{ category.title }}</a>
              </li>
            </ul>
          </div>
          <div>
            <h3>Услуги</h3>
            <ul class="space-y-2">
              <li v-for="service in services" :key="service.slug">
                <a :href="servicePath(service.slug)">{{ service.title }}</a>
              </li>
            </ul>
          </div>
          <div>
            <h3>Расчёт и заявка</h3>
            <ul class="space-y-2">
              <li><a href="#ceny">Стоимость</a></li>
              <li><a href="#zayavka">Оставить заявку</a></li>
              <li><a href="/kontakty">Контакты</a></li>
            </ul>
          </div>

          <div>
            <h3>Компания</h3>
            <ul class="space-y-2">
              <li><a href="#o-kompanii">О компании</a></li>
              <li><a href="/katalog">Каталог техники</a></li>
              <li><a href="#faq">Вопросы и ответы</a></li>
            </ul>
          </div>
        </div>

        <div class="mt-12 border-t border-line pt-6">
          <p class="fnote max-w-4xl">
            {{ requisites.join(" · ") }}. Аренда спецтехники с экипажем: подбор
            машины, доставка, работа на объекте и закрывающие документы.
            {{ priceDisclaimer }}
          </p>
          <div class="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p class="fnote">
              © {{ currentYear }} {{ companyName }} · Аренда спецтехники
            </p>
            <a class="btn btn--ghost" :href="phoneLink"
              >Заказать технику<svg
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
    </footer>
  </div>
</template>

<style scoped>
/*
 * Полки «Каталог моделей»: у каждого раздела свой горизонтальный ряд карточек.
 * Автоматической прокрутки нет — листают стрелки, точки, тач и трекпад; страница
 * считается целыми карточками, состояние живёт в `railStates`.
 * Полоса прокрутки скрыта: она резала ряд под карточками и спорила с точками.
 * Классы локальные (scoped): правила макета из `/landing/style.css` их не перебивают.
 */
.models-rail {
  scroll-snap-type: x proximity;
  scrollbar-width: none;
  overscroll-behavior-x: contain;
}

/*
 * Цвет секций «Каталог моделей». Фон — готовые полосы лендинга
 * (`.on-light` / `.flame-band` / `.process-band`), а роли приходят из
 * `HOME_MODEL_TONE_STYLES` переменными `--section-*`: их ставит секция инлайном,
 * наследуют шапка, полки и карточки. Порядок тонов — светлая, оранжевая, чёрная.
 * Свои scoped-классы нужны там, где правила лендинга (`.kicker`, `.lead`,
 * `.panel__meta`, `.note`) задают цвет: scoped-селектор с атрибутом специфичнее
 * и перебивает `/landing/style.css`, который грузится позже бандла.
 */
.models-kicker {
  color: var(--section-kicker, #b83c12);
}

/* У `.kicker` в лендинге своя черта-псевдоэлемент; здесь черта своя,
   её цвет зависит от тона, поэтому базовую гасим. */
.models-kicker::before {
  display: none;
}

.models-lead {
  color: var(--section-muted, #3d474b);
}

.models-meta {
  color: var(--section-muted, #3d474b);
}

.models-shelf {
  border-top-color: color-mix(in srgb, var(--section-ink, #0d1214) 16%, transparent);
}

.models-shelf-head {
  border-left: 3px solid var(--section-accent, #b83c12);
}

.models-note {
  border-left-color: var(--section-accent, #b83c12);
  background-color: color-mix(in srgb, var(--section-ink, #0d1214) 7%, transparent);
  color: var(--section-muted, #3d474b);
}

.shelf-btn {
  border-color: color-mix(in srgb, var(--section-accent, #b83c12) 40%, #ffffff);
  color: var(--section-accent, #b83c12);
  background-color: var(--section-rail-bg, rgb(255 255 255 / 0.55));
}

.shelf-btn:hover:not(:disabled) {
  border-color: var(--section-accent, #b83c12);
  background-color: var(--section-accent, #b83c12);
  color: var(--section-on-accent, #ffffff);
}

.shelf-btn:disabled {
  cursor: default;
  opacity: 0.3;
}

.shelf-dot {
  background-color: color-mix(in srgb, var(--section-accent, #b83c12) 30%, transparent);
}

.shelf-dot--active {
  background-color: var(--section-accent, #b83c12);
}

.models-rail::-webkit-scrollbar {
  display: none;
}

/* Карточка встаёт по левому краю ленты после шага стрелки. */
.models-rail > li {
  scroll-snap-align: start;
}
</style>
