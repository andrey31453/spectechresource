<script setup lang="ts">
import type { HomeDto } from "~/types/catalog";
import { formatPriceFrom } from "~/utils/price";
import { categoryPath, servicePath, typePath } from "~/utils/routes";
import { telHref } from "~/utils/phone";

definePageMeta({ layout: false });

const { data: site } = await useSite();
const { data: home, error, refresh, status } = await useAsyncData<HomeDto>(
  "home-index5",
  () => $fetch<HomeDto>("/api/home"),
);
const city = computed(() => site.value?.city ?? { slug: "moskva", name: "Москва", nameIn: "Москве" });
const phone = computed(() => site.value?.phone ?? null);
const categories = computed(() => home.value?.categories ?? []);
const allTypes = computed(() => categories.value.flatMap(category => category.types));
const activeCategory = ref("");
const search = ref("");
const visibleLimit = ref(8);
watch([activeCategory, search], () => { visibleLimit.value = 8; });
const visibleTypes = computed(() => {
  const types = activeCategory.value
    ? categories.value.find(category => category.slug === activeCategory.value)?.types ?? []
    : allTypes.value;
  const query = search.value.trim().toLocaleLowerCase("ru-RU");
  return types.filter(type => type.name.toLocaleLowerCase("ru-RU").includes(query));
});
const messengers = computed(() => [
  { name: "Telegram", url: site.value?.telegram },
  { name: "WhatsApp", url: site.value?.whatsapp },
  { name: "MAX", url: site.value?.maxMessenger },
].filter((item): item is { name: string; url: string } => Boolean(item.url)));

const shell = "mx-auto w-full max-w-[1320px] px-5 md:px-8";
const titleClass = "m-0 text-[clamp(1.65rem,3.2vw,2.5rem)] font-extrabold leading-tight tracking-[-0.035em]";
const orangeButton = "inline-flex min-h-12 items-center justify-center gap-3 rounded-lg bg-[#ff901e] px-5 py-3 text-sm font-bold text-[#171b1f] transition-colors hover:bg-[#ffa43e] hover:text-[#171b1f] hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b64b00] motion-reduce:transition-none";
const navLink = "inline-flex min-h-11 items-center text-sm font-semibold text-[#303a42] hover:text-[#9c4100] hover:no-underline";
const benefits = [
  { icon: "helmet", title: "Техника с экипажем", text: "Машину и квалификацию машиниста подбираем под ваши работы." },
  { icon: "truck", title: "Подача на объект", text: "Согласуем адрес, подъездные пути и время доставки до выезда." },
  { icon: "docs", title: "Условия в договоре", text: "Фиксируем смену, доставку, ГСМ и состав закрывающих документов." },
];
const brief = [
  { number: "01", title: "Что нужно сделать", text: "Котлован, разгрузка, вывоз грунта или другая задача. Укажите объём работ." },
  { number: "02", title: "Где находится объект", text: "Адрес, ограничения по высоте и ширине въезда, состояние подъездных путей." },
  { number: "03", title: "Когда нужна техника", text: "Дата начала, количество смен и удобное время подачи." },
];

usePageSeo({
  title: `Аренда спецтехники в ${city.value.nameIn} — СПЕЦТЕХРЕСУРС`,
  description: "Спецтехника под задачу: каталог с ценами, подбор машины и экипажа, согласование доставки и расчёт аренды.",
  path: "/index5",
  noindex: true,
});
useHead({ meta: [{ name: "theme-color", content: "#171b1f", key: "theme-color" }] });
</script>

<template>
  <div class="min-h-screen bg-[#f4f5f6] font-sans text-[#20272d] [--color-brand:#9c4100] [--color-brand-dark:#7d3400] [--color-brand-soft:#fff0df] [--color-brand-bright:#ad4900] [&_a]:decoration-0 [&_form_a]:inline-flex [&_form_a]:min-h-6 [&_form_a]:items-center [&_label[aria-hidden=true]]:hidden">
    <div class="border-b border-[#e0e5e8] bg-white">
      <div :class="[shell, 'flex min-h-10 flex-wrap items-center justify-between gap-x-5 gap-y-1 py-1 text-xs text-[#55616b]']">
        <span class="inline-flex items-center gap-2"><SiteIcon name="pin" class="h-4 w-4" />{{ city.name }} и область</span>
        <span>{{ site?.workingHours ?? 'Режим работы уточняйте у диспетчера' }}</span>
        <a href="#usloviya" class="hidden min-h-8 items-center text-[#55616b] hover:text-[#9c4100] sm:inline-flex">Доставка и условия аренды</a>
      </div>
    </div>
    <header class="border-b border-[#e0e5e8] bg-white">
      <div :class="[shell, 'flex flex-wrap items-center justify-between gap-4 py-5']">
        <a href="/index5" aria-label="Спецтехресурс — начало страницы" class="flex items-center gap-2.5 text-[#20272d] hover:text-[#20272d] hover:no-underline">
          <SiteLogo class="size-11 shrink-0" />
          <span><strong class="block text-[15px] font-black tracking-[-0.05em] sm:text-lg">СПЕЦ<span class="text-[#9c4100]">ТЕХ</span>РЕСУРС</strong><span class="block text-[11px] tracking-[0.09em] text-[#55616b]">АРЕНДА СПЕЦТЕХНИКИ</span></span>
        </a>
        <nav aria-label="Основное меню" class="hidden items-center gap-6 lg:flex">
          <a href="#katalog" :class="navLink">Каталог техники</a><a href="#uslugi" :class="navLink">Услуги</a><a href="#usloviya" :class="navLink">Условия</a><a href="#kontakty" :class="navLink">Контакты</a>
        </nav>
        <a v-if="phone" :href="telHref(phone)" class="ml-auto inline-flex min-h-11 items-center gap-2 text-sm font-extrabold whitespace-nowrap text-[#20272d] hover:text-[#9c4100] xl:text-lg"><SiteIcon name="phone" class="h-5 w-5" />{{ phone }}</a>
        <a href="#raschet" :class="[orangeButton, 'hidden sm:inline-flex']">Заказать технику<SiteIcon name="arrow" class="h-4 w-4" /></a>
      </div>
      <nav :class="[shell, 'flex flex-wrap gap-x-5 border-t border-[#eef0f2] lg:hidden']" aria-label="Разделы страницы">
        <a href="#katalog" :class="navLink">Каталог</a><a href="#uslugi" :class="navLink">Услуги</a><a href="#raschet" :class="navLink">Расчёт</a><a href="#kontakty" :class="navLink">Контакты</a>
      </nav>
    </header>

    <main id="main-index5">
      <section class="relative isolate overflow-hidden bg-[#171b1f] text-white" aria-labelledby="hero-title">
        <img src="/landing/images/tech/hero.webp" alt="Спецтехника на строительном объекте" width="1600" height="1067" fetchpriority="high" class="absolute inset-0 -z-20 h-full w-full object-cover object-center" >
        <div class="absolute inset-0 -z-10 bg-linear-to-r from-[#11161a]/95 via-[#11161a]/90 to-[#11161a]/65" />
        <div :class="[shell, 'grid items-center gap-10 py-12 md:py-16 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16']">
          <div>
            <span class="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.12em] text-[#ffd0a0] uppercase"><span class="h-2 w-2 rounded-full bg-[#ff901e]" />Для стройки, производства и города</span>
            <h1 id="hero-title" class="mt-5 mb-0 text-[clamp(2.3rem,4.8vw,4rem)] font-extrabold leading-[1.04] tracking-[-0.045em]">Большие задачи.<br><span class="text-[#ff9b38]">Нужная техника.</span></h1>
            <p class="mt-6 mb-0 max-w-xl text-lg leading-relaxed text-[#e1e5e8]">Аренда спецтехники в {{ city.nameIn }} и области. Подберём машину под ваши работы и согласуем подачу на объект.</p>
            <div class="mt-7 flex flex-wrap gap-3">
              <a href="#katalog" :class="orangeButton">Выбрать технику<SiteIcon name="arrow" class="h-4 w-4" /></a>
              <a v-if="phone" :href="telHref(phone)" class="inline-flex min-h-12 items-center gap-2 rounded-lg border border-white/40 px-5 py-3 text-sm font-semibold text-white hover:border-[#ff901e] hover:text-[#ffc48a] hover:no-underline">Обсудить задачу</a>
            </div>
            <dl v-if="home?.stats.length" class="mt-10 grid grid-cols-3 gap-4 border-t border-white/25 pt-6">
              <div v-for="stat in home.stats.slice(0, 3)" :key="stat.label"><dt class="text-[clamp(1.4rem,2.7vw,2.2rem)] font-extrabold text-white">{{ stat.value }}<span class="ml-1 text-sm font-semibold text-[#ffc48a]">{{ stat.unit }}</span></dt><dd class="mt-1 text-xs leading-relaxed text-[#d5dce1]">{{ stat.label }}</dd></div>
            </dl>
          </div>
          <div id="raschet" class="scroll-mt-6 rounded-xl bg-white p-2 text-[#20272d] shadow-xl [&_form]:border-0 [&_form]:shadow-none [&_form_button[type=submit]]:bg-[#ff901e] [&_form_button[type=submit]]:bg-none [&_form_button[type=submit]]:text-[#171b1f] [&_form_button[type=submit]]:shadow-none [&_form_button[type=submit]:hover]:bg-[#ffa43e] [&_input[type=checkbox]]:h-6 [&_input[type=checkbox]]:w-6">
            <LeadForm place="hero" :equipment-types="allTypes" :phone="phone" heading="Рассчитаем ваш заказ" lead="Оставьте задачу и адрес объекта. Уточним наличие, стоимость смены и доставки." submit-label="Получить расчёт аренды" />
          </div>
        </div>
      </section>

      <div :class="[shell, 'pt-5']">
        <div class="grid gap-3 md:grid-cols-3">
          <div v-for="benefit in benefits" :key="benefit.title" class="flex items-start gap-4 rounded-xl border border-[#e0e5e8] bg-white p-5"><span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#fff0df] text-[#9c4100]"><SiteIcon :name="benefit.icon" class="h-6 w-6" /></span><div><h2 class="m-0 text-sm font-bold">{{ benefit.title }}</h2><p class="mt-1 mb-0 text-xs leading-relaxed text-[#55616b]">{{ benefit.text }}</p></div></div>
        </div>
      </div>

      <section id="katalog" :class="[shell, 'scroll-mt-6 py-14 md:py-18']" aria-labelledby="catalog-title">
        <div class="flex flex-wrap items-end justify-between gap-4"><div><p class="mb-2 text-xs font-bold tracking-[0.12em] text-[#9c4100] uppercase">Наш каталог / {{ allTypes.length }} видов техники</p><h2 id="catalog-title" :class="titleClass">Спецтехника в аренду</h2></div><a href="/katalog" :class="navLink">Полный каталог<SiteIcon name="arrow" class="ml-2 h-4 w-4" /></a></div>
        <p class="mt-4 mb-6 max-w-2xl text-sm leading-relaxed text-[#55616b]">От земляных работ до подъёма и перевозки. Выберите раздел или найдите нужную машину — в карточке цена и переход к характеристикам.</p>
        <div v-if="error" role="alert" class="rounded-xl border border-[#e0e5e8] bg-white p-6"><p>Не удалось загрузить каталог. Попробуйте ещё раз или свяжитесь с диспетчером.</p><button type="button" :class="orangeButton" :disabled="status === 'pending'" @click="refresh()">{{ status === 'pending' ? 'Загружаем…' : 'Повторить загрузку' }}</button></div>
        <template v-else>
          <div class="mb-6 flex flex-wrap items-center gap-2" aria-label="Фильтр каталога">
            <button type="button" :aria-pressed="activeCategory === ''" class="min-h-11 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors hover:border-[#9c4100] motion-reduce:transition-none" :class="activeCategory === '' ? 'border-[#20272d] bg-[#20272d] text-white' : 'border-[#d5dce1] bg-white text-[#303a42]'" @click="activeCategory = ''">Вся техника</button>
            <button v-for="category in categories" :key="category.slug" type="button" :aria-pressed="activeCategory === category.slug" class="min-h-11 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors hover:border-[#9c4100] motion-reduce:transition-none" :class="activeCategory === category.slug ? 'border-[#20272d] bg-[#20272d] text-white' : 'border-[#d5dce1] bg-white text-[#303a42]'" @click="activeCategory = category.slug">{{ category.title }}</button>
          </div>
          <div class="mb-6 flex flex-wrap items-center justify-between gap-4"><p class="m-0 text-sm text-[#55616b]" aria-live="polite">Найдено позиций: {{ visibleTypes.length }}</p><label class="flex min-h-11 w-full items-center gap-3 rounded-lg border border-[#d5dce1] bg-white px-4 sm:w-80"><span class="text-sm text-[#55616b]">Поиск</span><input v-model="search" type="search" aria-label="Поиск техники по названию" placeholder="Например, экскаватор" class="min-h-11 w-full min-w-0 bg-transparent text-sm outline-offset-2" ></label></div>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <a v-for="type in visibleTypes.slice(0, visibleLimit)" :key="type.slug" :href="typePath(type.slug, city.slug)" class="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-[#dfe4e8] bg-white text-[#20272d] transition-[border-color,box-shadow] hover:border-[#dd7417] hover:text-[#20272d] hover:no-underline hover:shadow-lg focus-visible:outline-[#9c4100] motion-reduce:transition-none" data-equipment-card>
              <div class="relative aspect-[16/10] overflow-hidden bg-[#e9edef]"><img v-if="type.image" :src="type.image" :alt="type.name" width="640" height="400" loading="lazy" class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none" ><div v-else class="flex h-full items-center justify-center"><SiteIcon name="excavator" class="h-20 w-20 text-[#55616b]" /></div><span class="absolute top-3 left-3 rounded bg-white px-2 py-1 text-[11px] font-semibold text-[#303a42]">Аренда</span></div>
              <div class="flex grow flex-col p-5"><h3 class="m-0 min-h-12 text-base font-bold leading-snug">{{ type.name }}</h3><p class="mt-4 mb-0 text-base font-extrabold text-[#9c4100]">{{ formatPriceFrom(type.priceFrom, type.priceUnit) }}</p><div class="mt-5 flex items-center justify-between border-t border-[#e7ebee] pt-4"><span class="text-xs font-semibold text-[#55616b]">Модели и характеристики</span><span class="flex h-8 w-8 items-center justify-center rounded-full bg-[#f0f2f3] text-[#303a42] transition-colors group-hover:bg-[#ff901e] motion-reduce:transition-none"><SiteIcon name="arrow" class="h-4 w-4" /></span></div></div>
            </a>
          </div>
          <div v-if="visibleTypes.length > visibleLimit" class="mt-6 text-center"><button type="button" :class="orangeButton" @click="visibleLimit += 8">Показать ещё {{ Math.min(8, visibleTypes.length - visibleLimit) }}<SiteIcon name="chevron" class="h-4 w-4" /></button></div>
          <p v-if="!visibleTypes.length" role="status" class="rounded-xl border border-[#e0e5e8] bg-white p-6 text-sm text-[#55616b]">По вашему запросу техника не найдена. Измените поиск или оставьте заявку на подбор.</p>
          <p class="mt-5 mb-0 text-xs leading-relaxed text-[#55616b]">Для тарифов за смену: смена — 8 часов. {{ site?.priceDisclaimer ?? 'Цены ориентировочные. Стоимость и наличие подтверждает менеджер.' }}</p>
        </template>
      </section>

      <section v-if="home?.services.length" id="uslugi" class="bg-white py-14 md:py-18" aria-labelledby="services-title"><div :class="shell">
        <div class="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p class="mb-2 text-xs font-bold tracking-[0.12em] text-[#9c4100] uppercase">Техника + задача</p><h2 id="services-title" :class="titleClass">Что нужно сделать на объекте?</h2></div><a href="/uslugi" :class="navLink">Все услуги<SiteIcon name="arrow" class="ml-2 h-4 w-4" /></a></div>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><a v-for="service in home.services" :key="service.slug" :href="servicePath(service.slug)" class="group overflow-hidden rounded-xl border border-[#e0e5e8] bg-[#f4f5f6] text-[#20272d] hover:border-[#dd7417] hover:text-[#20272d] hover:no-underline"><img v-if="service.image" :src="service.image" :alt="service.title" width="640" height="320" loading="lazy" class="h-44 w-full object-cover" ><div class="p-6"><h3 class="m-0 flex items-center justify-between gap-4 text-lg font-bold">{{ service.title }}<SiteIcon name="arrow" class="h-5 w-5 shrink-0 text-[#9c4100]" /></h3><p v-if="service.description" class="mt-3 mb-0 text-sm leading-relaxed text-[#55616b]">{{ service.description }}</p></div></a></div>
      </div></section>

      <section v-if="home?.advantages.length" :class="[shell, 'py-14 md:py-18']" aria-labelledby="advantages-title"><h2 id="advantages-title" :class="titleClass">Работа начинается с договорённостей</h2><div class="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-3"><article v-for="(advantage, index) in home.advantages" :key="advantage.title" class="rounded-xl border border-[#e0e5e8] bg-white p-6"><span class="text-xs font-bold text-[#9c4100]">/ {{ String(index + 1).padStart(2, '0') }}</span><h3 class="mt-4 mb-0 text-lg font-bold">{{ advantage.title }}</h3><p v-if="advantage.text" class="mt-3 mb-0 text-sm leading-relaxed text-[#55616b]">{{ advantage.text }}</p></article></div></section>

      <section id="usloviya" class="bg-[#20272d] py-14 text-white md:py-18" aria-labelledby="terms-title"><div :class="shell">
        <div class="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]"><div><p class="mb-3 text-xs font-bold tracking-[0.12em] text-[#ffc48a] uppercase">Без лишних уточнений</p><h2 id="terms-title" :class="titleClass">Три вещи для точного расчёта</h2><p class="mt-5 mb-0 text-sm leading-relaxed text-[#d5dce1]">Стоимость зависит от машины, срока аренды, доставки и условий работы. До заказа согласуем продолжительность смены, ГСМ и переработку.</p><a href="#raschet" :class="[orangeButton, 'mt-6']">Обсудить мой объект<SiteIcon name="arrow" class="h-4 w-4" /></a></div><div class="divide-y divide-white/20"><article v-for="item in brief" :key="item.number" class="flex gap-5 py-5 first:pt-0"><span class="text-xl font-bold text-[#ffc48a]">{{ item.number }}</span><div><h3 class="m-0 text-lg font-bold">{{ item.title }}</h3><p class="mt-2 mb-0 text-sm leading-relaxed text-[#d5dce1]">{{ item.text }}</p></div></article></div></div>
      </div></section>

      <section v-if="home?.steps.length" :class="[shell, 'py-14 md:py-18']" aria-labelledby="steps-title"><h2 id="steps-title" :class="titleClass">От заявки до работы на объекте</h2><ol class="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><li v-for="(step, index) in home.steps" :key="step.title" class="rounded-xl border border-[#e0e5e8] bg-white p-6"><span class="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#ff901e] text-sm font-extrabold text-[#171b1f]">{{ String(index + 1).padStart(2, '0') }}</span><h3 class="mt-5 mb-0 text-base font-bold">{{ step.title }}</h3><p v-if="step.text" class="mt-3 mb-0 text-sm leading-relaxed text-[#55616b]">{{ step.text }}</p></li></ol></section>

      <section :class="[shell, 'pb-14 md:pb-18']" aria-labelledby="callback-title"><div class="grid gap-8 rounded-2xl bg-[#fff0df] p-6 sm:p-9 lg:grid-cols-2 lg:p-12"><div><SiteIcon name="excavator" class="mb-6 h-14 w-14 text-[#9c4100]" /><h2 id="callback-title" :class="titleClass">Не знаете, какая машина подойдёт?</h2><p class="mt-5 mb-0 max-w-md text-base leading-relaxed text-[#4e555b]">Расскажите, что нужно сделать. Поможем выбрать тип техники, навесное оборудование и формат аренды.</p><p class="mt-5 mb-0 text-sm text-[#4e555b]">Нужны несколько машин? Укажите это в комментарии — обсудим состав техники и последовательность подачи.</p><a v-if="phone" :href="telHref(phone)" class="mt-6 inline-flex min-h-11 items-center gap-3 text-lg font-bold text-[#20272d] hover:text-[#9c4100]"><SiteIcon name="phone" class="h-5 w-5" />{{ phone }}</a></div><div class="[&_form]:shadow-none [&_form_button[type=submit]]:bg-[#ff901e] [&_form_button[type=submit]]:bg-none [&_form_button[type=submit]]:text-[#171b1f] [&_form_button[type=submit]:hover]:bg-[#ffa43e] [&_input[type=checkbox]]:h-6 [&_input[type=checkbox]]:w-6"><LeadForm place="callback" :phone="phone" heading="Поможем с подбором" lead="Задача, адрес и сроки — остальное уточним вместе." submit-label="Подобрать технику" /></div></div></section>

      <section v-if="home?.faq.length" class="bg-white py-14 md:py-18" aria-labelledby="faq-title"><div :class="[shell, 'grid gap-8 lg:grid-cols-[0.7fr_1.3fr]']"><div><p class="mb-3 text-xs font-bold tracking-[0.12em] text-[#9c4100] uppercase">До начала работ</p><h2 id="faq-title" :class="titleClass">Частые вопросы</h2><p class="mt-4 text-sm leading-relaxed text-[#55616b]">Собрали ответы об аренде, оплате и подаче техники.</p></div><FaqList :items="home.faq" schema-key="index5-faq" /></div></section>
    </main>

    <footer id="kontakty" class="bg-[#171b1f] pt-12 pb-24 text-white md:pb-6"><div :class="shell"><div class="grid gap-8 border-b border-white/20 pb-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr]">
      <div><p class="mb-3 text-lg font-black tracking-tight">СПЕЦ<span class="text-[#ff9b38]">ТЕХ</span>РЕСУРС</p><p class="max-w-xs text-sm leading-relaxed text-[#c4cdd4]">Нужная техника.<br>Для больших и маленьких задач.</p><p class="mb-0 text-sm text-[#c4cdd4]">{{ site?.legalName ?? site?.companyName }}</p><p v-if="site?.inn" class="mt-2 mb-0 text-xs text-[#c4cdd4]">ИНН {{ site.inn }}<template v-if="site.ogrn"> · ОГРН {{ site.ogrn }}</template></p></div>
      <div><h2 class="mt-0 mb-3 text-sm font-bold text-white">Каталог техники</h2><a v-for="category in categories" :key="category.slug" :href="categoryPath(category.slug)" class="flex min-h-8 items-center text-xs text-[#c4cdd4] hover:text-[#ffc48a]">{{ category.title }}</a></div>
      <div><h2 class="mt-0 mb-3 text-sm font-bold text-white">Связаться с нами</h2><a v-if="phone" :href="telHref(phone)" class="inline-flex min-h-11 items-center text-xl font-bold text-white hover:text-[#ffc48a]">{{ phone }}</a><a v-if="site?.email" :href="`mailto:${site.email}`" class="flex min-h-9 items-center text-sm break-all text-[#c4cdd4] hover:text-[#ffc48a]">{{ site.email }}</a><p v-if="site?.address" class="mt-3 mb-2 text-sm leading-relaxed text-[#c4cdd4]">{{ site.address }}</p><p v-if="site?.workingHours" class="mb-2 text-xs text-[#c4cdd4]">{{ site.workingHours }}</p><div class="flex flex-wrap gap-3"><a v-for="messenger in messengers" :key="messenger.name" :href="messenger.url" target="_blank" rel="noopener noreferrer" class="inline-flex min-h-11 items-center text-sm text-[#ffc48a] hover:text-white">{{ messenger.name }}</a></div></div>
    </div><div class="flex flex-wrap items-center justify-between gap-3 pt-5 text-xs text-[#c4cdd4]"><span>© {{ new Date().getFullYear() }} {{ site?.companyName ?? 'СПЕЦТЕХРЕСУРС' }}</span><a href="/politika-obrabotki-personalnyh-dannyh" class="inline-flex min-h-9 items-center text-[#c4cdd4] hover:text-white">Политика обработки персональных данных</a><a href="#main-index5" class="inline-flex min-h-9 items-center text-[#c4cdd4] hover:text-white">Наверх ↑</a></div></div></footer>
    <div class="fixed inset-x-0 bottom-0 z-30 flex gap-3 border-t border-[#dfe4e8] bg-white p-3 shadow-lg md:hidden"><a v-if="phone" :href="telHref(phone)" class="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg border border-[#d5dce1] text-sm font-bold text-[#20272d] hover:text-[#9c4100]"><SiteIcon name="phone" class="h-4 w-4" />Позвонить</a><a href="#raschet" :class="[orangeButton, 'flex-1']">Оставить заявку</a></div>
  </div>
</template>