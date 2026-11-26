<script setup lang="ts">
import type { HomeDto } from "~/types/catalog";
import { formatPriceFrom, lowestPrice } from "~/utils/price";
import { servicePath, typePath } from "~/utils/routes";
import { telHref } from "~/utils/phone";

definePageMeta({ layout: false });

const { data: site } = await useSite();
const { data: home, error, status, refresh } = await useAsyncData<HomeDto>(
  "home-index6",
  () => $fetch<HomeDto>("/api/home"),
);
const city = computed(() => site.value?.city ?? { slug: "moskva", name: "Москва", nameIn: "Москве" });
const phone = computed(() => site.value?.phone ?? null);
const categories = computed(() => home.value?.categories ?? []);
const equipmentTypes = computed(() => categories.value.flatMap(category => category.types));
const search = ref("");
const filteredCategories = computed(() => {
  const query = search.value.trim().toLocaleLowerCase("ru-RU");
  return categories.value.filter(category =>
    [category.title, ...category.types.map(type => type.name)]
      .some(name => name.toLocaleLowerCase("ru-RU").includes(query)),
  );
});
const catalogCards = computed(() => filteredCategories.value.map(category => {
  const price = lowestPrice(category.types);
  return {
    ...category,
    cover: category.image ?? category.types.find(type => type.image)?.image,
    priceLabel: price ? formatPriceFrom(price.priceFrom, price.priceUnit) : "Стоимость по запросу",
  };
}));
const messengers = computed(() => [
  { name: "Telegram", url: site.value?.telegram },
  { name: "WhatsApp", url: site.value?.whatsapp },
  { name: "MAX", url: site.value?.maxMessenger },
].filter((item): item is { name: string; url: string } => Boolean(item.url)));

const shell = "mx-auto w-full max-w-[1440px] px-5 md:px-10";
const sectionTitle = "m-0 text-[clamp(1.8rem,3.5vw,3rem)] leading-[1.12] font-extrabold tracking-[-0.035em]";
const kicker = "mb-3 text-xs font-bold tracking-[0.14em] text-[#ff9e49] uppercase";
const button = "inline-flex min-h-12 items-center justify-center gap-5 rounded-md bg-[#ff7a00] px-6 py-3 text-sm font-bold text-[#031827] transition-colors hover:bg-[#ff9a3e] hover:text-[#031827] hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ffae66] motion-reduce:transition-none";
const lightLink = "inline-flex min-h-11 items-center text-sm font-semibold text-[#dae4ec] hover:text-[#ffad65] hover:no-underline";
const features = [
  { icon: "pin", title: "Москва и область", text: "Адрес и подачу согласуем заранее" },
  { icon: "excavator", title: "Под вашу задачу", text: "Подбор машины и оборудования" },
  { icon: "helmet", title: "Работа с экипажем", text: "Условия уточняем при заказе" },
  { icon: "docs", title: "Понятный расчёт", text: "Смена, доставка и документы" },
];

usePageSeo({
  title: `Аренда спецтехники в ${city.value.nameIn} — СПЕЦТЕХРЕСУРС`,
  description: "Спецтехника для строительных, дорожных и коммунальных работ. Каталог, подбор под задачу и расчёт аренды с доставкой на объект.",
  path: "/index6",
  noindex: true,
});
useHead({ meta: [{ name: "theme-color", content: "#031827", key: "theme-color" }] });
</script>

<template>
  <div class="min-h-screen bg-[#031827] font-sans text-white [--color-brand:#a14600] [--color-brand-dark:#853900] [--color-brand-bright:#a14600] [--color-brand-soft:#fff0df] [&_form_a]:inline-flex [&_form_a]:min-h-6 [&_form_a]:items-center [&_input[type=checkbox]]:h-6 [&_input[type=checkbox]]:w-6 [&_label[aria-hidden=true]]:hidden motion-reduce:[&_*]:transition-none">
    <div class="relative isolate overflow-hidden">
      <img src="/landing/images/tech/hero.webp" alt="Спецтехника на строительном объекте" width="1600" height="1067" fetchpriority="high" class="absolute inset-0 -z-20 h-full w-full object-cover object-center" >
      <div class="absolute inset-0 -z-10 bg-linear-to-b from-[#031827]/95 via-[#031827]/80 to-[#031827]" />
      <header class="relative z-20 border-b border-white/15">
        <div :class="[shell, 'flex min-h-24 flex-wrap items-center justify-between gap-4 py-5']">
          <a href="/index6" aria-label="Спецтехресурс — начало страницы" class="flex items-center gap-3 text-white hover:text-white hover:no-underline">
            <SiteLogo class="size-11 shrink-0" />
            <span><strong class="block text-[15px] font-black tracking-[-0.045em] sm:text-xl">СПЕЦТЕХРЕСУРС</strong><span class="mt-1 block text-[10px] tracking-[0.12em] text-[#d0dde7] uppercase">Техника для ваших задач</span></span>
          </a>
          <nav aria-label="Основное меню" class="hidden items-center gap-7 lg:flex">
            <a href="#katalog" :class="lightLink">Техника</a><a href="#napravleniya" :class="lightLink">Направления работ</a><a href="#o-kompanii" :class="lightLink">О компании</a><a href="#kontakty" :class="lightLink">Контакты</a>
          </nav>
          <div class="hidden text-right xl:block"><a v-if="phone" :href="telHref(phone)" class="inline-flex min-h-9 items-center text-lg font-bold text-white hover:text-[#ffad65]">{{ phone }}</a><p v-if="site?.workingHours" class="m-0 text-xs text-[#d0dde7]">{{ site.workingHours }}</p></div>
          <a href="#zayavka" :class="[button, 'ml-auto px-4 lg:ml-0']"><span class="hidden sm:inline">Оставить заявку</span><span class="sm:hidden">Заявка</span><SiteIcon name="arrow" class="h-4 w-4" /></a>
        </div>
        <nav :class="[shell, 'flex flex-wrap gap-x-5 border-t border-white/15 lg:hidden']" aria-label="Разделы страницы"><a href="#katalog" :class="lightLink">Техника</a><a href="#napravleniya" :class="lightLink">Работы</a><a href="#o-kompanii" :class="lightLink">О нас</a><a href="#kontakty" :class="lightLink">Контакты</a></nav>
      </header>

      <section aria-labelledby="hero-title" :class="[shell, 'pt-14 pb-9 text-center md:pt-20 md:pb-12']">
        <p class="mb-5 text-xs font-bold tracking-[0.18em] text-[#ffd0a6] uppercase">Аренда спецтехники · {{ city.name }} и область</p>
        <h1 id="hero-title" class="mx-auto m-0 max-w-5xl text-[clamp(2.6rem,6.5vw,5.7rem)] font-black leading-[1.03] tracking-[-0.045em]"><span class="block text-[#ff922e]">Спецтехника</span>для ваших задач</h1>
        <p class="mx-auto mt-6 mb-8 max-w-2xl text-base leading-relaxed text-[#e1eaf1] md:text-lg">Для строительства, земляных работ и благоустройства в {{ city.nameIn }}. Поможем выбрать машину, рассчитать аренду и согласовать подачу на объект.</p>
        <a href="#zayavka" :class="[button, 'min-h-16 px-7 text-base']">Подобрать технику<span class="flex h-9 w-9 items-center justify-center rounded-full bg-[#031827] text-white"><SiteIcon name="arrow" class="h-5 w-5" /></span></a>
        <div class="mt-12 grid grid-cols-2 gap-x-4 gap-y-7 border-t border-white/20 pt-8 md:mt-16 md:grid-cols-4">
          <div v-for="(feature, index) in features" :key="feature.title" :class="['px-2 md:px-5', index < 3 ? 'md:border-r md:border-white/20' : '']"><SiteIcon :name="feature.icon" class="mx-auto mb-3 h-7 w-7 text-[#ff9e49]" /><p class="m-0 text-sm font-bold text-white">{{ index === 0 ? `${city.name} и область` : feature.title }}</p><p class="mt-2 mb-0 text-xs leading-relaxed text-[#c7d5df]">{{ feature.text }}</p></div>
        </div>
      </section>
    </div>

    <main>
      <section id="katalog" :class="[shell, 'scroll-mt-6 py-12 md:py-16']" aria-labelledby="catalog-title">
        <div class="mb-7 flex flex-wrap items-end justify-between gap-5"><div><p :class="kicker">Каталог / {{ categories.length }} разделов</p><h2 id="catalog-title" :class="sectionTitle">Выберите вашу технику</h2></div><a href="/katalog" :class="lightLink">Весь каталог<SiteIcon name="arrow" class="ml-3 h-4 w-4" /></a></div>
        <div class="mb-6 flex flex-wrap items-center justify-between gap-4"><p class="m-0 max-w-xl text-sm leading-relaxed text-[#c7d5df]">От разработки котлована до подъёма груза. В каждом разделе — виды машин, характеристики и цены.</p><label class="flex min-h-12 w-full items-center gap-3 rounded-md border border-[#587083] bg-[#06263f] px-4 sm:w-80"><span class="text-sm text-[#d4e0e9]">Поиск</span><input v-model="search" type="search" aria-label="Найти раздел или вид техники" placeholder="Например, экскаватор" class="min-h-12 w-full min-w-0 bg-transparent text-sm text-white placeholder:text-[#bccdd9]" ></label></div>
        <div v-if="error" role="alert" class="rounded-lg border border-[#587083] bg-[#06263f] p-6"><p class="mb-4">Не удалось загрузить каталог. Повторите запрос или свяжитесь с диспетчером.</p><button type="button" :class="button" :disabled="status === 'pending'" @click="refresh()">{{ status === 'pending' ? 'Загружаем…' : 'Повторить загрузку' }}</button></div>
        <template v-else>
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <a v-for="category in catalogCards" :key="category.slug" href="/katalog" class="group relative flex min-w-0 flex-col overflow-hidden rounded-lg border border-[#32516a] bg-[#0d2c46] text-white transition-colors hover:border-[#ff7a00] hover:text-white hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ffae66] motion-reduce:transition-none" data-equipment-card>
              <div class="px-5 pt-5"><h3 class="m-0 min-h-12 text-lg font-bold leading-snug">{{ category.title }}</h3><p class="mt-3 mb-4 text-sm font-semibold text-[#ffb16d]">{{ category.priceLabel }}</p></div>
              <div class="relative mt-auto aspect-[16/10] overflow-hidden bg-[#06263f]"><img v-if="category.cover" :src="category.cover" :alt="category.title" width="640" height="400" loading="lazy" class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none" ><div v-else class="flex h-full items-center justify-center"><SiteIcon name="excavator" class="h-16 w-16 text-[#d0dde7]" /></div><span class="absolute right-3 bottom-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#ff7a00] text-[#031827]"><SiteIcon name="arrow" class="h-5 w-5" /></span></div>
            </a>
          </div>
          <p v-if="!catalogCards.length" role="status" class="rounded-lg border border-[#587083] p-6 text-sm text-[#d4e0e9]">Подходящие разделы не найдены. Измените поиск или оставьте заявку на подбор.</p>
          <p v-else class="mt-4 mb-0 text-xs text-[#c7d5df]" aria-live="polite">Разделов: {{ catalogCards.length }} из {{ categories.length }}.</p>
          <p class="mt-3 mb-0 text-xs leading-relaxed text-[#c7d5df]">Смена — 8 часов для посменных тарифов. {{ site?.priceDisclaimer ?? 'Цены ориентировочные. Стоимость и наличие подтверждает менеджер.' }}</p>
        </template>
      </section>

      <section id="napravleniya" class="scroll-mt-6 bg-[#06263f] py-12 md:py-16" aria-labelledby="directions-title"><div :class="shell">
        <div class="mb-8 grid gap-5 md:grid-cols-2"><div><p :class="kicker">Направления работ</p><h2 id="directions-title" :class="sectionTitle">Сначала задача.<br>Затем нужная машина.</h2></div><p class="m-0 max-w-lg self-end text-sm leading-relaxed text-[#c7d5df]">Расскажите об объекте, объёме и сроках. Уточним подъездные пути, ограничения и необходимое оборудование — подберём технику под реальные условия работы.</p></div>
        <div v-if="home?.services.length" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><a v-for="(service, index) in home.services" :key="service.slug" :href="servicePath(service.slug)" class="group flex flex-col rounded-lg border border-[#426078] bg-[#0d2c46] p-6 text-white transition-colors hover:border-[#ff7a00] hover:bg-[#143b59] hover:text-white hover:no-underline motion-reduce:transition-none"><span class="flex items-center justify-between text-xs font-bold text-[#ffb16d]">{{ String(index + 1).padStart(2, '0') }}<SiteIcon name="arrow" class="h-5 w-5" /></span><h3 class="mt-7 mb-3 text-xl font-bold">{{ service.title }}</h3><p v-if="service.description" class="mt-0 mb-0 text-sm leading-relaxed text-[#d0dde7]">{{ service.description }}</p></a></div>
        <p v-else class="text-sm leading-relaxed text-[#d0dde7]">Индивидуальный подбор для строительных, дорожных и коммунальных работ. <a href="#zayavka" :class="lightLink">Расскажите о своей задаче →</a></p>
      </div></section>

      <section id="o-kompanii" class="scroll-mt-6 bg-[#f7f7f7] py-12 text-[#1f2937] md:py-16" aria-labelledby="about-title"><div :class="shell">
        <div class="grid items-center gap-8 lg:grid-cols-2 lg:gap-14"><div><p class="mb-4 text-xs font-bold tracking-[0.14em] text-[#a14600] uppercase">О компании</p><h2 id="about-title" :class="[sectionTitle, 'uppercase']">Спецтехресурс.<br>От задачи — к работе.</h2><p class="mt-6 mb-3 text-sm leading-7 text-[#4c5965]">Техника нужна на конкретный день, на конкретный объект и под конкретный объём работ. Поэтому подбор начинаем с ваших условий: что нужно сделать, где и когда.</p><p class="mb-0 text-sm leading-7 text-[#4c5965]">Помогаем разобраться с типом машины, оборудованием, доставкой и продолжительностью аренды. До выезда согласуем стоимость и состав работ.</p><p class="mt-6 mb-0 border-l-4 border-[#ff7a00] bg-white px-5 py-4 text-sm font-bold leading-relaxed">Нужная техника и понятные договорённости — чтобы вы могли сосредоточиться на объекте.</p></div><img src="/landing/images/tech/na-obekte.webp" alt="Спецтехника во время работ на объекте" width="780" height="520" loading="lazy" class="h-64 w-full rounded-2xl object-cover sm:h-80 lg:h-96" ></div>
        <dl v-if="home?.stats.length" class="mt-9 grid grid-cols-2 gap-x-6 gap-y-4 lg:grid-cols-4"><div v-for="stat in home.stats" :key="stat.label" class="border-t border-[#ced5db] py-5"><dt class="text-3xl font-black tracking-tight text-[#1f2937]">{{ stat.value }}<span v-if="stat.unit" class="ml-2 text-base">{{ stat.unit }}</span></dt><dd class="mt-2 text-sm leading-relaxed text-[#4c5965]">{{ stat.label }}</dd></div></dl>
        <div v-if="home?.advantages.length" class="mt-6 grid gap-5 md:grid-cols-3"><article v-for="advantage in home.advantages" :key="advantage.title" class="border-t border-[#ced5db] pt-5"><SiteIcon name="check" class="mb-3 h-6 w-6 text-[#a14600]" /><h3 class="m-0 text-base font-bold">{{ advantage.title }}</h3><p v-if="advantage.text" class="mt-3 mb-0 text-sm leading-relaxed text-[#4c5965]">{{ advantage.text }}</p></article></div>
      </div></section>

      <section v-if="home?.steps.length" :class="[shell, 'py-12 md:py-16']" aria-labelledby="steps-title"><p :class="kicker">Простой порядок</p><h2 id="steps-title" :class="sectionTitle">Как мы работаем</h2><ol class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"><li v-for="(step, index) in home.steps" :key="step.title" class="border-t border-[#587083] pt-6"><span class="text-4xl font-black text-[#ff9e49]">{{ String(index + 1).padStart(2, '0') }}</span><h3 class="mt-5 mb-3 text-lg font-bold">{{ step.title }}</h3><p v-if="step.text" class="m-0 text-sm leading-relaxed text-[#c7d5df]">{{ step.text }}</p></li></ol></section>

      <section id="zayavka" class="scroll-mt-6 bg-[#06263f] py-12 md:py-16" aria-labelledby="request-title"><div :class="shell">
        <div class="mb-8 max-w-3xl"><p :class="kicker">Подберём вместе</p><h2 id="request-title" :class="sectionTitle">Не знаете, какая техника нужна?</h2><p class="mt-5 mb-0 text-base leading-relaxed text-[#d0dde7]">Расскажите о работе и сроках. Предложим подходящий вариант и рассчитаем аренду с учётом доставки и условий на объекте.</p></div>
        <div class="grid items-start gap-6 lg:grid-cols-[1.15fr_0.85fr]"><div class="[&_form]:border-0 [&_form]:rounded-xl [&_form]:shadow-none [&_form_button[type=submit]]:bg-[#ff7a00] [&_form_button[type=submit]]:bg-none [&_form_button[type=submit]]:text-[#031827] [&_form_button[type=submit]]:shadow-none [&_form_button[type=submit]:hover]:bg-[#ff9a3e]"><LeadForm place="callback" :equipment-types="equipmentTypes" :phone="phone" heading="Заявка на подбор техники" lead="Укажите задачу, адрес объекта и даты. Остальные детали уточним при звонке." submit-label="Получить расчёт" /></div>
          <div class="flex h-full flex-col rounded-xl border border-[#587083] bg-[#0d2c46] p-6 md:p-8"><SiteIcon name="phone" class="mb-5 h-8 w-8 text-[#ff9e49]" /><h3 class="m-0 text-2xl font-bold">Обсудить с диспетчером</h3><p class="mt-4 mb-5 text-sm leading-relaxed text-[#d0dde7]">Есть вопросы или уже знаете нужную машину? Позвоните или напишите в удобный мессенджер.</p><a v-if="phone" :href="telHref(phone)" class="mb-4 inline-flex min-h-12 items-center text-[clamp(1.2rem,2.4vw,1.9rem)] font-bold text-white hover:text-[#ffad65]">{{ phone }}</a><p v-if="site?.workingHours" class="mb-6 text-sm text-[#d0dde7]">{{ site.workingHours }}</p><div v-if="messengers.length" class="grid gap-3"><a v-for="messenger in messengers" :key="messenger.name" :href="messenger.url" target="_blank" rel="noopener noreferrer" class="flex min-h-16 items-center justify-between gap-4 rounded-md border border-[#678298] px-5 py-4 text-base font-bold text-white hover:border-[#ff7a00] hover:text-[#ffad65] hover:no-underline">{{ messenger.name }}<SiteIcon name="arrow" class="h-5 w-5" /></a></div><div class="mt-7 border-t border-[#587083] pt-6"><p class="m-0 text-sm font-bold text-white">Для точного расчёта подготовьте:</p><ul class="mt-3 space-y-2 text-sm leading-relaxed text-[#d0dde7]"><li>01 · Задачу и объём работ</li><li>02 · Адрес и условия подъезда</li><li>03 · Дату начала и срок аренды</li></ul></div></div>
        </div>
      </div></section>

      <section v-if="home?.faq.length" :class="[shell, 'py-12 md:py-16']" aria-labelledby="faq-title"><div class="mb-8 grid gap-5 md:grid-cols-2"><div><p :class="kicker">FAQ</p><h2 id="faq-title" :class="sectionTitle">Часто задаваемые<br>вопросы</h2></div><p class="m-0 max-w-md self-end text-sm leading-relaxed text-[#c7d5df]">Об аренде, оплате и доставке. Условия конкретного заказа согласуем до подачи техники.</p></div><div class="[&_details]:border-[#426078] [&_details]:bg-[#0d2c46] [&_summary]:text-white [&_summary_span.font-mono]:text-[#ffb16d] [&_summary_svg]:text-[#ffb16d] [&_details_p]:border-[#426078] [&_details_p]:text-[#d0dde7]"><FaqList :items="home.faq" schema-key="index6-faq" /></div></section>
    </main>

    <footer id="kontakty" class="border-t border-[#426078] bg-[#02121e] pt-12 pb-6"><div :class="shell"><div class="grid gap-8 pb-10 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1.1fr]">
      <div><p class="mb-4 text-xl font-black tracking-tight text-white">СПЕЦТЕХРЕСУРС<span class="text-[#ff922e]">.</span></p><p class="mb-5 max-w-xs text-sm leading-relaxed text-[#c7d5df]">Аренда спецтехники в {{ city.nameIn }} и области. Подбор под ваши задачи и условия объекта.</p><a href="#zayavka" :class="button">Подобрать технику</a></div>
      <div><h2 class="mt-0 mb-3 text-base font-bold text-white">Каталог техники</h2><a v-for="type in equipmentTypes" :key="type.slug" :href="typePath(type.slug, city.slug)" class="flex min-h-9 items-center py-1 text-xs leading-relaxed text-[#c7d5df] hover:text-[#ffad65]">{{ type.name }}</a></div>
      <div><h2 class="mt-0 mb-3 text-base font-bold text-white">Компания</h2><nav aria-label="Ссылки в подвале" class="flex flex-col items-start"><a href="#o-kompanii" :class="lightLink">О компании</a><a href="#napravleniya" :class="lightLink">Направления работ</a><a href="/uslugi" :class="lightLink">Все услуги</a><a href="/kontakty" :class="lightLink">Контакты и реквизиты</a></nav><p class="mt-5 mb-0 text-xs leading-relaxed text-[#c7d5df]">{{ site?.legalName ?? site?.companyName }}</p><p v-if="site?.inn" class="mt-2 text-xs leading-relaxed text-[#c7d5df]">ИНН {{ site.inn }}<template v-if="site.ogrn"><br>ОГРН {{ site.ogrn }}</template></p></div>
      <div><h2 class="mt-0 mb-3 text-base font-bold text-white">Контакты</h2><a v-if="phone" :href="telHref(phone)" class="inline-flex min-h-11 items-center text-lg font-bold text-white hover:text-[#ffad65]">{{ phone }}</a><a v-if="site?.email" :href="`mailto:${site.email}`" class="flex min-h-11 items-center text-sm break-all text-[#c7d5df] hover:text-[#ffad65]">{{ site.email }}</a><p v-if="site?.workingHours" class="mt-3 text-sm leading-relaxed text-[#c7d5df]">{{ site.workingHours }}</p><p v-if="site?.address" class="mt-3 text-sm leading-relaxed text-[#c7d5df]">{{ site.address }}</p><a href="#zayavka" :class="lightLink">Заказать звонок →</a></div>
    </div><div class="flex flex-wrap items-center justify-between gap-4 border-t border-[#426078] pt-5 text-xs text-[#c7d5df]"><span>© {{ new Date().getFullYear() }} {{ site?.companyName ?? 'СПЕЦТЕХРЕСУРС' }}</span><a href="/politika-obrabotki-personalnyh-dannyh" class="inline-flex min-h-11 items-center text-[#c7d5df] hover:text-[#ffad65]">Политика обработки персональных данных</a></div></div></footer>
  </div>
</template>